import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "http";
import { storage } from "./storage";
import type { InsertUserNotification, UserNotification, Appointment, Doctor, HealthTip } from "@shared/schema";
import { generateHealthTip } from "./openai";

interface WebSocketClient extends WebSocket {
  userId?: string;
  userRole?: string;
}

class NotificationService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocketClient[]> = new Map();
  private reminderInterval: NodeJS.Timeout | null = null;
  private healthTipInterval: NodeJS.Timeout | null = null;
  private doctorsCache: Map<string, Doctor> = new Map();
  private lastHealthTipTime: string | null = null;

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws/notifications" });

    this.wss.on("connection", (ws: WebSocketClient, req) => {
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      const userId = url.searchParams.get("userId");
      const userRole = url.searchParams.get("userRole");

      if (userId && userRole) {
        ws.userId = userId;
        ws.userRole = userRole;

        if (!this.clients.has(userId)) {
          this.clients.set(userId, []);
        }
        this.clients.get(userId)!.push(ws);

        console.log(`WebSocket connected: ${userId} (${userRole})`);
      }

      ws.on("close", () => {
        if (ws.userId) {
          const userClients = this.clients.get(ws.userId);
          if (userClients) {
            const index = userClients.indexOf(ws);
            if (index > -1) {
              userClients.splice(index, 1);
            }
            if (userClients.length === 0) {
              this.clients.delete(ws.userId);
            }
          }
          console.log(`WebSocket disconnected: ${ws.userId}`);
        }
      });

      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === "ping") {
            ws.send(JSON.stringify({ type: "pong" }));
          }
        } catch (e) {
          console.error("WebSocket message parse error:", e);
        }
      });
    });

    console.log("WebSocket notification service initialized");
  }

  private sendToUser(userId: string, data: any) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const message = JSON.stringify(data);
      userClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }

  private broadcast(data: any, filterRole?: string) {
    const message = JSON.stringify(data);
    this.clients.forEach((clients) => {
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          if (!filterRole || client.userRole === filterRole) {
            client.send(message);
          }
        }
      });
    });
  }

  // Broadcast slot updates to all connected clients for real-time sync
  broadcastSlotUpdate(slotUpdate: {
    type: 'slot.booked' | 'slot.cancelled' | 'slots.generated';
    slotId?: string;
    doctorId: string;
    date: string;
    startTime?: string;
    patientName?: string | null;
    count?: number;
  }) {
    const message = JSON.stringify({
      type: 'slot_update',
      ...slotUpdate
    });
    
    // Broadcast to all connected clients (admin, doctors, patients)
    this.clients.forEach((clients) => {
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
    
    console.log(`Slot update broadcast: ${slotUpdate.type} for doctor ${slotUpdate.doctorId}`);
  }

  async createAndPushNotification(notification: InsertUserNotification): Promise<UserNotification> {
    const created = await storage.createUserNotification(notification);
    
    this.sendToUser(notification.userId, {
      type: "notification",
      notification: created
    });

    return created;
  }

  async notifyAppointmentCreated(
    appointmentId: string, 
    doctorId: string, 
    patientName: string, 
    appointmentDate: string, 
    appointmentTime: string,
    department?: string,
    location?: string,
    patientId?: string
  ) {
    const locationInfo = location ? ` at ${location}` : '';
    const deptInfo = department ? ` (${department})` : '';
    
    // Notify the doctor
    await this.createAndPushNotification({
      userId: doctorId,
      userRole: "DOCTOR",
      type: "appointment",
      title: "New Appointment Booked",
      message: `${patientName} has booked an appointment for ${appointmentDate} at ${appointmentTime}${deptInfo}${locationInfo}`,
      relatedEntityType: "appointment",
      relatedEntityId: appointmentId,
      isRead: false,
      metadata: JSON.stringify({ appointmentDate, appointmentTime, patientName, department, location })
    });

    // Notify the patient (confirmation)
    if (patientId) {
      await this.createAndPushNotification({
        userId: patientId,
        userRole: "PATIENT",
        type: "appointment",
        title: "Appointment Confirmed",
        message: `Your appointment for ${appointmentDate} at ${appointmentTime}${deptInfo}${locationInfo} has been confirmed`,
        relatedEntityType: "appointment",
        relatedEntityId: appointmentId,
        isRead: false,
        metadata: JSON.stringify({ appointmentDate, appointmentTime, department, location })
      });
    }

    // Broadcast to all admins
    this.broadcast({ type: "admin_notification", event: "appointment_created", appointmentId, department, location }, "ADMIN");
    
    // Broadcast appointment update to the specific doctor for real-time schedule sync
    this.sendToUser(doctorId, {
      type: "appointment_update",
      event: "created",
      appointmentId,
      doctorId,
      appointmentDate,
      appointmentTime,
      patientName
    });
  }

  async notifyAppointmentUpdated(appointmentId: string, doctorId: string, patientName: string, status: string, appointmentDate: string) {
    await this.createAndPushNotification({
      userId: doctorId,
      userRole: "DOCTOR",
      type: "appointment",
      title: `Appointment ${status}`,
      message: `Appointment with ${patientName} on ${appointmentDate} has been ${status.toLowerCase()}`,
      relatedEntityType: "appointment",
      relatedEntityId: appointmentId,
      isRead: false,
      metadata: JSON.stringify({ status, patientName, appointmentDate })
    });

    this.broadcast({ type: "admin_notification", event: "appointment_updated", appointmentId, status }, "ADMIN");
  }

  async notifyPrescriptionCreated(prescriptionId: string, patientId: string, patientName: string, doctorName: string) {
    await this.createAndPushNotification({
      userId: patientId,
      userRole: "PATIENT",
      type: "prescription",
      title: "New Prescription",
      message: `Dr. ${doctorName} has created a new prescription for you`,
      relatedEntityType: "prescription",
      relatedEntityId: prescriptionId,
      isRead: false,
      metadata: JSON.stringify({ doctorName })
    });

    this.broadcast({ type: "admin_notification", event: "prescription_created", prescriptionId }, "ADMIN");
  }

  async notifyScheduleUpdated(doctorId: string, scheduleId: string, date: string, action: string) {
    await this.createAndPushNotification({
      userId: doctorId,
      userRole: "DOCTOR",
      type: "schedule",
      title: `Schedule ${action}`,
      message: `Your schedule for ${date} has been ${action.toLowerCase()}`,
      relatedEntityType: "schedule",
      relatedEntityId: scheduleId,
      isRead: false,
      metadata: JSON.stringify({ date, action })
    });

    this.broadcast({ type: "admin_notification", event: "schedule_updated", doctorId, scheduleId }, "ADMIN");
    this.broadcast({ type: "opd_notification", event: "schedule_updated", doctorId, scheduleId }, "OPD_MANAGER");
  }

  async notifyProfileUpdated(userId: string, userRole: string, profileType: string) {
    await this.createAndPushNotification({
      userId,
      userRole,
      type: "profile",
      title: "Profile Updated",
      message: `Your ${profileType} profile has been successfully updated`,
      relatedEntityType: "profile",
      relatedEntityId: userId,
      isRead: false,
      metadata: JSON.stringify({ profileType })
    });

    this.broadcast({ type: "admin_notification", event: "profile_updated", userId, userRole }, "ADMIN");
  }

  async notifyPatientAdmission(patientId: string, patientName: string, doctorId: string, admissionId: string) {
    await this.createAndPushNotification({
      userId: doctorId,
      userRole: "DOCTOR",
      type: "admission",
      title: "New Patient Admission",
      message: `${patientName} has been admitted under your care`,
      relatedEntityType: "admission",
      relatedEntityId: admissionId,
      isRead: false,
      metadata: JSON.stringify({ patientName })
    });

    this.broadcast({ type: "admin_notification", event: "patient_admitted", admissionId }, "ADMIN");
    this.broadcast({ type: "nurse_notification", event: "patient_admitted", admissionId }, "NURSE");
    this.broadcast({ type: "opd_notification", event: "patient_admitted", admissionId }, "OPD_MANAGER");
  }

  async notifyPatientDischarge(patientId: string, patientName: string, doctorId: string, admissionId: string) {
    await this.createAndPushNotification({
      userId: doctorId,
      userRole: "DOCTOR",
      type: "discharge",
      title: "Patient Discharged",
      message: `${patientName} has been discharged from your care`,
      relatedEntityType: "admission",
      relatedEntityId: admissionId,
      isRead: false,
      metadata: JSON.stringify({ patientName })
    });

    this.broadcast({ type: "admin_notification", event: "patient_discharged", admissionId }, "ADMIN");
    this.broadcast({ type: "nurse_notification", event: "patient_discharged", admissionId }, "NURSE");
  }

  async notifySystemMessage(userId: string, userRole: string, title: string, message: string) {
    await this.createAndPushNotification({
      userId,
      userRole,
      type: "system",
      title,
      message,
      relatedEntityType: null,
      relatedEntityId: null,
      isRead: false,
      metadata: null
    });
  }

  // ========== BILLING NOTIFICATIONS ==========

  notifyBillRequested(billId: string, patientId: string, patientName: string) {
    console.log(`Bill requested by ${patientName} (${patientId}), billId: ${billId}`);
    
    this.broadcast({
      type: "admin_notification",
      event: "bill_requested",
      billId,
      patientId,
      patientName
    }, "ADMIN");
  }

  notifyBillUpdated(billId: string, patientId: string, totalAmount: string, status: string) {
    console.log(`Bill ${billId} updated for patient ${patientId}: Total ${totalAmount}, Status: ${status}`);
    
    // Send to the specific patient who owns this bill
    this.sendToUser(patientId, {
      type: "bill_updated",
      event: "bill_updated",
      billId,
      patientId,
      totalAmount,
      status
    });

    // Also broadcast to admin for dashboard updates
    this.broadcast({
      type: "admin_notification",
      event: "bill_updated",
      billId,
      patientId,
      totalAmount,
      status
    }, "ADMIN");
  }

  // ========== APPOINTMENT REMINDER SCHEDULER ==========
  
  startReminderScheduler() {
    // Run every 5 minutes
    const INTERVAL_MS = 5 * 60 * 1000;
    
    console.log("Starting appointment reminder scheduler (every 5 minutes)");
    
    // Run immediately on start
    this.checkAndSendReminders();
    
    // Then run periodically
    this.reminderInterval = setInterval(() => {
      this.checkAndSendReminders();
    }, INTERVAL_MS);
  }

  stopReminderScheduler() {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
      console.log("Appointment reminder scheduler stopped");
    }
  }

  private async checkAndSendReminders() {
    try {
      const appointments = await storage.getAppointments();
      const now = new Date();
      
      // Refresh doctors cache
      const doctors = await storage.getDoctors();
      this.doctorsCache.clear();
      doctors.forEach(doc => this.doctorsCache.set(doc.id, doc));

      for (const appointment of appointments) {
        // Skip cancelled or completed appointments
        if (appointment.status === "cancelled" || appointment.status === "completed") {
          continue;
        }

        // Parse appointment date and time
        const appointmentDateTime = this.parseAppointmentDateTime(appointment.appointmentDate, appointment.timeSlot);
        if (!appointmentDateTime) continue;

        const hoursUntil = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Check for day-before reminder (appointment is tomorrow, between 12 and 48 hours)
        if (hoursUntil >= 12 && hoursUntil <= 48) {
          await this.sendReminderIfNeeded(appointment, "24h");
        }
        
        // Check for 1-hour reminder (between 0.5 and 2 hours before)
        if (hoursUntil >= 0.5 && hoursUntil <= 2) {
          await this.sendReminderIfNeeded(appointment, "1h");
        }
      }
    } catch (error) {
      console.error("Error in reminder scheduler:", error);
    }
  }

  private parseAppointmentDateTime(dateStr: string, timeSlot: string): Date | null {
    try {
      // dateStr format: "2025-12-11" or similar
      // timeSlot format: "09:00", "14:30", etc.
      const [hours, minutes] = timeSlot.split(":").map(Number);
      const date = new Date(dateStr);
      date.setHours(hours, minutes, 0, 0);
      return date;
    } catch {
      return null;
    }
  }

  private async sendReminderIfNeeded(appointment: Appointment, reminderType: "24h" | "1h") {
    // Use patientId (username) if available, fallback to patientName for legacy appointments
    const patientUserId = appointment.patientId || appointment.patientName;
    const reminderKey = `reminder::${appointment.id}::${reminderType}`;
    
    // Check if reminder was already sent by looking for existing notification with this metadata
    const existingNotifications = await storage.getUserNotifications(patientUserId);
    const alreadySent = existingNotifications.some(n => {
      try {
        const metadata = n.metadata ? JSON.parse(n.metadata) : {};
        return metadata.reminderKey === reminderKey;
      } catch {
        return false;
      }
    });

    if (alreadySent) {
      return; // Already sent this reminder
    }

    // Get doctor details
    const doctor = this.doctorsCache.get(appointment.doctorId);
    const doctorName = doctor?.name || "Your Doctor";
    
    // Format reminder message
    const timeLabel = reminderType === "24h" ? "tomorrow" : "in 1 hour";
    const formattedTime = this.formatTimeSlot(appointment.timeSlot);
    const department = appointment.department || "OPD";
    const location = appointment.location || "Gravity Hospital";

    const title = reminderType === "24h" 
      ? "Appointment Reminder - Tomorrow" 
      : "Appointment Reminder - Starting Soon";
    
    const message = `Your appointment with Dr. ${doctorName} is ${timeLabel}.\n` +
      `Time: ${formattedTime}\n` +
      `Department: ${department}\n` +
      `Location: ${location}`;

    await this.createAndPushNotification({
      userId: patientUserId, // Use patientId (username) for proper notification delivery
      userRole: "PATIENT",
      type: "appointment",
      title,
      message,
      relatedEntityType: "appointment",
      relatedEntityId: appointment.id,
      isRead: false,
      metadata: JSON.stringify({
        reminderKey,
        reminderType,
        doctorName,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.timeSlot,
        department,
        location
      })
    });

    console.log(`Sent ${reminderType} reminder for appointment ${appointment.id} to ${patientUserId}`);
  }

  private formatTimeSlot(timeSlot: string): string {
    const [hours, minutes] = timeSlot.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  }

  // ========== HEALTH TIPS SCHEDULER ==========
  
  startHealthTipScheduler() {
    // Check every minute for scheduled health tip times (9 AM and 9 PM IST)
    const INTERVAL_MS = 60 * 1000; // 1 minute
    
    console.log("Starting health tip scheduler (9 AM and 9 PM IST daily)");
    
    // Check immediately on start
    this.checkAndGenerateHealthTip();
    
    // Then run periodically
    this.healthTipInterval = setInterval(() => {
      this.checkAndGenerateHealthTip();
    }, INTERVAL_MS);
  }

  stopHealthTipScheduler() {
    if (this.healthTipInterval) {
      clearInterval(this.healthTipInterval);
      this.healthTipInterval = null;
      console.log("Health tip scheduler stopped");
    }
  }

  private async checkAndGenerateHealthTip() {
    try {
      // Get current time in IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
      const istTime = new Date(now.getTime() + istOffset);
      
      const hour = istTime.getUTCHours();
      const minute = istTime.getUTCMinutes();
      const dateStr = istTime.toISOString().split('T')[0];
      
      // Check if it's 9 AM or 9 PM (with 5-minute window)
      const is9AM = hour === 9 && minute >= 0 && minute < 5;
      const is9PM = hour === 21 && minute >= 0 && minute < 5;
      
      if (!is9AM && !is9PM) {
        return; // Not the right time
      }
      
      const scheduledFor = is9AM ? "9AM" : "9PM";
      const tipKey = `${dateStr}_${scheduledFor}`;
      
      // Prevent duplicate generation
      if (this.lastHealthTipTime === tipKey) {
        return;
      }
      
      console.log(`Generating health tip for ${scheduledFor} on ${dateStr}`);
      
      // Generate health tip using AI
      const tipData = await generateHealthTip(scheduledFor);
      
      // Store in database
      const healthTip = await storage.createHealthTip({
        title: tipData.title,
        content: tipData.content,
        category: tipData.category,
        weatherContext: tipData.weatherContext,
        season: tipData.season,
        priority: tipData.priority,
        targetAudience: tipData.targetAudience,
        scheduledFor: scheduledFor,
        isActive: true
      });
      
      // Mark as generated
      this.lastHealthTipTime = tipKey;
      
      // Broadcast to all connected users
      this.broadcastHealthTip(healthTip);
      
      console.log(`Health tip generated and broadcast: ${healthTip.title}`);
    } catch (error) {
      console.error("Error generating health tip:", error);
    }
  }

  broadcastHealthTip(healthTip: HealthTip) {
    // Broadcast to ALL connected users (both admin and patients)
    this.broadcast({
      type: "health_tip",
      event: "new_health_tip",
      tip: {
        id: healthTip.id,
        title: healthTip.title,
        content: healthTip.content,
        category: healthTip.category,
        weatherContext: healthTip.weatherContext,
        season: healthTip.season,
        priority: healthTip.priority,
        targetAudience: healthTip.targetAudience,
        scheduledFor: healthTip.scheduledFor,
        generatedAt: healthTip.generatedAt
      }
    });
    
    console.log(`Health tip broadcast to all connected users: ${healthTip.title}`);
  }

  // Manual trigger for testing (can be called from admin API)
  async generateHealthTipNow(scheduledFor: "9AM" | "9PM" = "9AM"): Promise<HealthTip | null> {
    try {
      console.log(`Manually generating health tip for ${scheduledFor}`);
      
      const tipData = await generateHealthTip(scheduledFor);
      
      const healthTip = await storage.createHealthTip({
        title: tipData.title,
        content: tipData.content,
        category: tipData.category,
        weatherContext: tipData.weatherContext,
        season: tipData.season,
        priority: tipData.priority,
        targetAudience: tipData.targetAudience,
        scheduledFor: scheduledFor,
        isActive: true
      });
      
      // Broadcast immediately
      this.broadcastHealthTip(healthTip);
      
      return healthTip;
    } catch (error) {
      console.error("Error manually generating health tip:", error);
      return null;
    }
  }
}

export const notificationService = new NotificationService();
