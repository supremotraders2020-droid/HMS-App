import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "http";
import { storage } from "./storage";
import type { InsertUserNotification, UserNotification } from "@shared/schema";

interface WebSocketClient extends WebSocket {
  userId?: string;
  userRole?: string;
}

class NotificationService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocketClient[]> = new Map();

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

    this.broadcast({ type: "admin_notification", event: "appointment_created", appointmentId, department, location }, "ADMIN");
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
}

export const notificationService = new NotificationService();
