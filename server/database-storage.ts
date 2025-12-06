import { db } from "./db";
import { eq, desc, and, lt, sql } from "drizzle-orm";
import { randomUUID, randomBytes, createCipheriv, createDecipheriv } from "crypto";
import {
  users, doctors, schedules, appointments,
  inventoryItems, staffMembers, inventoryPatients, inventoryTransactions,
  trackingPatients, medications, meals, vitals,
  conversationLogs, servicePatients, admissions, medicalRecords,
  biometricTemplates, biometricVerifications,
  notifications, hospitalTeamMembers, activityLogs,
  equipment, serviceHistory, emergencyContacts, hospitalSettings,
  type User, type InsertUser, type Doctor, type InsertDoctor,
  type Schedule, type InsertSchedule, type Appointment, type InsertAppointment,
  type InventoryItem, type InsertInventoryItem, type StaffMember, type InsertStaffMember,
  type InventoryPatient, type InsertInventoryPatient, type InventoryTransaction, type InsertInventoryTransaction,
  type TrackingPatient, type InsertTrackingPatient, type Medication, type InsertMedication,
  type Meal, type InsertMeal, type Vitals, type InsertVitals,
  type ConversationLog, type InsertConversationLog, type ServicePatient, type InsertServicePatient,
  type Admission, type InsertAdmission, type MedicalRecord, type InsertMedicalRecord,
  type BiometricTemplate, type InsertBiometricTemplate, type BiometricVerification, type InsertBiometricVerification,
  type Notification, type InsertNotification, type HospitalTeamMember, type InsertHospitalTeamMember,
  type ActivityLog, type InsertActivityLog,
  type Equipment, type InsertEquipment, type ServiceHistory, type InsertServiceHistory,
  type EmergencyContact, type InsertEmergencyContact,
  type HospitalSettings, type InsertHospitalSettings
} from "@shared/schema";
import type { IStorage } from "./storage";

const ENCRYPTION_KEY = process.env.BIOMETRIC_ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";

export class DatabaseStorage implements IStorage {
  
  private encryptBiometricData(data: string): { encrypted: string; iv: string } {
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");
    return { encrypted, iv: iv.toString("hex") };
  }

  private decryptBiometricData(encryptedData: string, iv: string): string {
    const decipher = createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), Buffer.from(iv, "hex"));
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  // ========== USER METHODS ==========
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // ========== DOCTOR METHODS ==========
  async getDoctors(): Promise<Doctor[]> {
    return await db.select().from(doctors);
  }

  async getDoctor(id: string): Promise<Doctor | undefined> {
    const result = await db.select().from(doctors).where(eq(doctors.id, id));
    return result[0];
  }

  async createDoctor(doctor: InsertDoctor): Promise<Doctor> {
    const result = await db.insert(doctors).values(doctor).returning();
    return result[0];
  }

  // ========== SCHEDULE METHODS ==========
  async getSchedules(doctorId: string, date?: string): Promise<Schedule[]> {
    if (date) {
      return await db.select().from(schedules).where(
        and(eq(schedules.doctorId, doctorId), eq(schedules.date, date))
      );
    }
    return await db.select().from(schedules).where(eq(schedules.doctorId, doctorId));
  }

  async getSchedulesByDate(date: string): Promise<Schedule[]> {
    return await db.select().from(schedules).where(eq(schedules.date, date));
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const result = await db.insert(schedules).values(schedule).returning();
    return result[0];
  }

  async updateScheduleBookedStatus(id: string, isBooked: boolean): Promise<Schedule | undefined> {
    const result = await db.update(schedules)
      .set({ isBooked })
      .where(eq(schedules.id, id))
      .returning();
    return result[0];
  }

  async findAndBookScheduleSlot(doctorId: string, date: string, timeSlot: string): Promise<Schedule | undefined> {
    // First check if there's already an appointment for this slot
    const existingAppointments = await db.select().from(appointments).where(
      and(
        eq(appointments.doctorId, doctorId),
        eq(appointments.appointmentDate, date),
        eq(appointments.timeSlot, timeSlot),
        sql`${appointments.status} NOT IN ('cancelled', 'completed')`
      )
    );
    
    // If there's already an active appointment, the slot is not available
    if (existingAppointments.length > 0) {
      return undefined;
    }
    
    // Check if a schedule entry exists
    const existing = await db.select().from(schedules).where(
      and(
        eq(schedules.doctorId, doctorId),
        eq(schedules.date, date),
        eq(schedules.timeSlot, timeSlot)
      )
    );
    
    // If schedule exists and is not booked, mark it as booked
    if (existing.length > 0) {
      if (!existing[0].isBooked) {
        return await this.updateScheduleBookedStatus(existing[0].id, true);
      }
      return undefined;
    }
    
    // If no schedule exists, create one and mark it as booked
    const newSchedule = await db.insert(schedules).values({
      doctorId,
      date,
      timeSlot,
      isBooked: true
    }).returning();
    
    return newSchedule[0];
  }

  // ========== APPOINTMENT METHODS ==========
  async getAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments).orderBy(desc(appointments.createdAt));
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const result = await db.select().from(appointments).where(eq(appointments.id, id));
    return result[0];
  }

  async getAppointmentsByStatus(status: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.status, status));
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const appointmentId = `APT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const result = await db.insert(appointments).values({
      ...appointment,
      appointmentId
    }).returning();
    return result[0];
  }

  async updateAppointmentStatus(id: string, status: string): Promise<Appointment | undefined> {
    const result = await db.update(appointments)
      .set({ status })
      .where(eq(appointments.id, id))
      .returning();
    return result[0];
  }

  // ========== INVENTORY ITEMS METHODS ==========
  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return await db.select().from(inventoryItems);
  }

  async getInventoryItemById(id: string): Promise<InventoryItem | undefined> {
    const result = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return result[0];
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const result = await db.insert(inventoryItems).values(item).returning();
    return result[0];
  }

  async updateInventoryItemStock(id: string, newStock: number): Promise<InventoryItem | undefined> {
    const result = await db.update(inventoryItems)
      .set({ currentStock: newStock, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))
      .returning();
    return result[0];
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return await db.select().from(inventoryItems).where(
      sql`${inventoryItems.currentStock} <= ${inventoryItems.lowStockThreshold}`
    );
  }

  async updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const result = await db.update(inventoryItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))
      .returning();
    return result[0];
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const result = await db.delete(inventoryItems).where(eq(inventoryItems.id, id)).returning();
    return result.length > 0;
  }

  // ========== STAFF MEMBERS METHODS ==========
  async getAllStaffMembers(): Promise<StaffMember[]> {
    return await db.select().from(staffMembers);
  }

  async getStaffMemberById(id: string): Promise<StaffMember | undefined> {
    const result = await db.select().from(staffMembers).where(eq(staffMembers.id, id));
    return result[0];
  }

  async createStaffMember(staff: InsertStaffMember): Promise<StaffMember> {
    const result = await db.insert(staffMembers).values(staff).returning();
    return result[0];
  }

  // ========== INVENTORY PATIENTS METHODS ==========
  async getAllInventoryPatients(): Promise<InventoryPatient[]> {
    return await db.select().from(inventoryPatients);
  }

  async getInventoryPatientById(id: string): Promise<InventoryPatient | undefined> {
    const result = await db.select().from(inventoryPatients).where(eq(inventoryPatients.id, id));
    return result[0];
  }

  async createInventoryPatient(patient: InsertInventoryPatient): Promise<InventoryPatient> {
    const result = await db.insert(inventoryPatients).values(patient).returning();
    return result[0];
  }

  // ========== INVENTORY TRANSACTIONS METHODS ==========
  async getAllInventoryTransactions(): Promise<InventoryTransaction[]> {
    return await db.select().from(inventoryTransactions).orderBy(desc(inventoryTransactions.createdAt));
  }

  async getTransactionsByItem(itemId: string): Promise<InventoryTransaction[]> {
    return await db.select().from(inventoryTransactions).where(eq(inventoryTransactions.itemId, itemId));
  }

  async getTransactionsByPatient(patientId: string): Promise<InventoryTransaction[]> {
    return await db.select().from(inventoryTransactions).where(eq(inventoryTransactions.patientId, patientId));
  }

  async getTransactionsByStaff(staffId: string): Promise<InventoryTransaction[]> {
    return await db.select().from(inventoryTransactions).where(eq(inventoryTransactions.staffId, staffId));
  }

  async createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction> {
    const item = await this.getInventoryItemById(transaction.itemId);
    if (!item) throw new Error("Item not found");

    let newStock = item.currentStock;
    if (transaction.type === "ISSUE") {
      newStock -= transaction.quantity;
    } else if (transaction.type === "RETURN") {
      newStock += transaction.quantity;
    } else if (transaction.type === "DISPOSE") {
      newStock -= transaction.quantity;
    } else if (transaction.type === "ADD") {
      // For ADD transactions, stock is already set on item creation
      newStock = item.currentStock;
    }

    // Only update stock for non-ADD transactions
    if (transaction.type !== "ADD") {
      await this.updateInventoryItemStock(transaction.itemId, newStock);
    }

    const totalCost = (parseFloat(item.cost) * transaction.quantity).toFixed(2);
    const result = await db.insert(inventoryTransactions).values({
      ...transaction,
      remainingStock: newStock,
      totalCost
    }).returning();
    return result[0];
  }

  // ========== INVENTORY REPORTS ==========
  async getInventoryReports(): Promise<any> {
    const items = await this.getAllInventoryItems();
    const transactions = await this.getAllInventoryTransactions();
    
    const totalItems = items.length;
    const totalTransactions = transactions.length;
    const lowStockItems = items.filter(i => i.currentStock <= i.lowStockThreshold).length;
    const totalValue = items.reduce((sum, i) => sum + (parseFloat(i.cost) * i.currentStock), 0);
    
    const categoryBreakdown: Record<string, number> = {};
    items.forEach(item => {
      categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
    });
    
    return {
      totalItems,
      totalTransactions,
      lowStockItems,
      totalValue: totalValue.toFixed(2),
      categoryBreakdown
    };
  }

  async getPatientWiseReport(): Promise<any[]> {
    const patients = await this.getAllInventoryPatients();
    const transactions = await this.getAllInventoryTransactions();
    
    return patients.map(patient => {
      const patientTransactions = transactions.filter(t => t.patientId === patient.id);
      const totalItems = patientTransactions.reduce((sum, t) => sum + t.quantity, 0);
      const totalCost = patientTransactions.reduce((sum, t) => sum + parseFloat(t.totalCost || "0"), 0);
      return {
        patientId: patient.patientId,
        patientName: patient.name,
        totalItems,
        totalCost: totalCost.toFixed(2),
        transactions: patientTransactions.length
      };
    });
  }

  async getStaffWiseReport(): Promise<any[]> {
    const staff = await this.getAllStaffMembers();
    const transactions = await this.getAllInventoryTransactions();
    
    return staff.map(member => {
      const staffTransactions = transactions.filter(t => t.staffId === member.id);
      const totalItems = staffTransactions.reduce((sum, t) => sum + t.quantity, 0);
      return {
        staffId: member.id,
        staffName: member.name,
        role: member.role,
        totalItems,
        transactions: staffTransactions.length
      };
    });
  }

  // ========== PATIENT TRACKING METHODS ==========
  async getAllTrackingPatients(): Promise<TrackingPatient[]> {
    return await db.select().from(trackingPatients).orderBy(desc(trackingPatients.admissionDate));
  }

  async getTrackingPatientById(id: string): Promise<TrackingPatient | undefined> {
    const result = await db.select().from(trackingPatients).where(eq(trackingPatients.id, id));
    return result[0];
  }

  async createTrackingPatient(patient: InsertTrackingPatient): Promise<TrackingPatient> {
    const result = await db.insert(trackingPatients).values({
      ...patient,
      status: "admitted",
      admissionDate: new Date()
    }).returning();
    return result[0];
  }

  async updateTrackingPatientStatus(id: string, status: string): Promise<TrackingPatient | undefined> {
    const result = await db.update(trackingPatients)
      .set({ status })
      .where(eq(trackingPatients.id, id))
      .returning();
    return result[0];
  }

  async dischargeTrackingPatient(id: string, dischargeDate: Date): Promise<TrackingPatient | undefined> {
    const result = await db.update(trackingPatients)
      .set({ status: "discharged", dischargeDate })
      .where(eq(trackingPatients.id, id))
      .returning();
    return result[0];
  }

  async deleteTrackingPatient(id: string): Promise<boolean> {
    const result = await db.delete(trackingPatients).where(eq(trackingPatients.id, id));
    return true;
  }

  // ========== MEDICATIONS METHODS ==========
  async getMedicationsByPatient(patientId: string): Promise<Medication[]> {
    return await db.select().from(medications)
      .where(eq(medications.patientId, patientId))
      .orderBy(desc(medications.administeredAt));
  }

  async createMedication(medication: InsertMedication): Promise<Medication> {
    const result = await db.insert(medications).values({
      ...medication,
      administeredAt: new Date()
    }).returning();
    return result[0];
  }

  // ========== MEALS METHODS ==========
  async getMealsByPatient(patientId: string): Promise<Meal[]> {
    return await db.select().from(meals)
      .where(eq(meals.patientId, patientId))
      .orderBy(desc(meals.servedAt));
  }

  async createMeal(meal: InsertMeal): Promise<Meal> {
    const result = await db.insert(meals).values({
      ...meal,
      servedAt: new Date()
    }).returning();
    return result[0];
  }

  // ========== VITALS METHODS ==========
  async getVitalsByPatient(patientId: string): Promise<Vitals[]> {
    return await db.select().from(vitals)
      .where(eq(vitals.patientId, patientId))
      .orderBy(desc(vitals.recordedAt));
  }

  async createVitals(vital: InsertVitals): Promise<Vitals> {
    const result = await db.insert(vitals).values({
      ...vital,
      recordedAt: new Date()
    }).returning();
    return result[0];
  }

  // ========== PATIENT TRACKING HISTORY ==========
  async getPatientTrackingHistory(patientId: string): Promise<any> {
    const patient = await this.getTrackingPatientById(patientId);
    const patientMedications = await this.getMedicationsByPatient(patientId);
    const patientMeals = await this.getMealsByPatient(patientId);
    const patientVitals = await this.getVitalsByPatient(patientId);
    
    return {
      patient,
      medications: patientMedications,
      meals: patientMeals,
      vitals: patientVitals
    };
  }

  // ========== CHATBOT SERVICE METHODS ==========
  async createConversationLog(log: InsertConversationLog): Promise<ConversationLog> {
    const result = await db.insert(conversationLogs).values(log).returning();
    return result[0];
  }

  async getConversationLogs(userId?: string, limit = 50): Promise<ConversationLog[]> {
    if (userId) {
      return await db.select().from(conversationLogs)
        .where(eq(conversationLogs.userId, userId))
        .orderBy(desc(conversationLogs.timestamp))
        .limit(limit);
    }
    return await db.select().from(conversationLogs)
      .orderBy(desc(conversationLogs.timestamp))
      .limit(limit);
  }

  async getConversationLogsByCategory(category: string, limit = 50): Promise<ConversationLog[]> {
    return await db.select().from(conversationLogs)
      .where(eq(conversationLogs.category, category))
      .orderBy(desc(conversationLogs.timestamp))
      .limit(limit);
  }

  // ========== PATIENT SERVICE METHODS ==========
  async getAllServicePatients(): Promise<ServicePatient[]> {
    return await db.select().from(servicePatients).orderBy(desc(servicePatients.createdAt));
  }

  async getServicePatientById(id: string): Promise<ServicePatient | undefined> {
    const result = await db.select().from(servicePatients).where(eq(servicePatients.id, id));
    return result[0];
  }

  async createServicePatient(patient: InsertServicePatient): Promise<ServicePatient> {
    const result = await db.insert(servicePatients).values(patient).returning();
    return result[0];
  }

  async updateServicePatient(id: string, patient: Partial<InsertServicePatient>): Promise<ServicePatient | undefined> {
    const result = await db.update(servicePatients)
      .set(patient)
      .where(eq(servicePatients.id, id))
      .returning();
    return result[0];
  }

  async deleteServicePatient(id: string): Promise<boolean> {
    await db.delete(servicePatients).where(eq(servicePatients.id, id));
    return true;
  }

  // ========== ADMISSIONS METHODS ==========
  async getAllAdmissions(): Promise<Admission[]> {
    return await db.select().from(admissions).orderBy(desc(admissions.admissionDate));
  }

  async getActiveAdmissions(): Promise<Admission[]> {
    return await db.select().from(admissions).where(eq(admissions.status, "admitted"));
  }

  async getAdmissionById(id: string): Promise<Admission | undefined> {
    const result = await db.select().from(admissions).where(eq(admissions.id, id));
    return result[0];
  }

  async getAdmissionsByPatient(patientId: string): Promise<Admission[]> {
    return await db.select().from(admissions)
      .where(eq(admissions.patientId, patientId))
      .orderBy(desc(admissions.admissionDate));
  }

  async createAdmission(admission: InsertAdmission): Promise<Admission> {
    const result = await db.insert(admissions).values({
      ...admission,
      status: "admitted"
    }).returning();
    return result[0];
  }

  async updateAdmission(id: string, admission: Partial<InsertAdmission>): Promise<Admission | undefined> {
    const result = await db.update(admissions)
      .set(admission)
      .where(eq(admissions.id, id))
      .returning();
    return result[0];
  }

  async dischargePatient(id: string, dischargeDate: Date, notes?: string): Promise<Admission | undefined> {
    const updateData: any = { status: "discharged", dischargeDate };
    if (notes) updateData.notes = notes;
    
    const result = await db.update(admissions)
      .set(updateData)
      .where(eq(admissions.id, id))
      .returning();
    return result[0];
  }

  // ========== MEDICAL RECORDS METHODS ==========
  async getAllMedicalRecords(): Promise<MedicalRecord[]> {
    return await db.select().from(medicalRecords).orderBy(desc(medicalRecords.recordDate));
  }

  async getMedicalRecordById(id: string): Promise<MedicalRecord | undefined> {
    const result = await db.select().from(medicalRecords).where(eq(medicalRecords.id, id));
    return result[0];
  }

  async getMedicalRecordsByPatient(patientId: string): Promise<MedicalRecord[]> {
    return await db.select().from(medicalRecords)
      .where(eq(medicalRecords.patientId, patientId))
      .orderBy(desc(medicalRecords.recordDate));
  }

  async createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord> {
    const result = await db.insert(medicalRecords).values(record).returning();
    return result[0];
  }

  async updateMedicalRecord(id: string, record: Partial<InsertMedicalRecord>): Promise<MedicalRecord | undefined> {
    const result = await db.update(medicalRecords)
      .set(record)
      .where(eq(medicalRecords.id, id))
      .returning();
    return result[0];
  }

  async deleteMedicalRecord(id: string): Promise<boolean> {
    await db.delete(medicalRecords).where(eq(medicalRecords.id, id));
    return true;
  }

  // ========== BIOMETRIC SERVICE METHODS ==========
  async getAllBiometricTemplates(): Promise<BiometricTemplate[]> {
    return await db.select().from(biometricTemplates);
  }

  async getBiometricTemplateById(id: string): Promise<BiometricTemplate | undefined> {
    const result = await db.select().from(biometricTemplates).where(eq(biometricTemplates.id, id));
    return result[0];
  }

  async getBiometricTemplatesByPatient(patientId: string): Promise<BiometricTemplate[]> {
    return await db.select().from(biometricTemplates).where(eq(biometricTemplates.patientId, patientId));
  }

  async createBiometricTemplate(template: InsertBiometricTemplate): Promise<BiometricTemplate> {
    const result = await db.insert(biometricTemplates).values(template).returning();
    return result[0];
  }

  async updateBiometricTemplate(id: string, template: Partial<InsertBiometricTemplate>): Promise<BiometricTemplate | undefined> {
    const result = await db.update(biometricTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(biometricTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteBiometricTemplate(id: string): Promise<boolean> {
    await db.delete(biometricTemplates).where(eq(biometricTemplates.id, id));
    return true;
  }

  // ========== BIOMETRIC VERIFICATIONS METHODS ==========
  async getAllBiometricVerifications(): Promise<BiometricVerification[]> {
    return await db.select().from(biometricVerifications).orderBy(desc(biometricVerifications.verifiedAt));
  }

  async getRecentBiometricVerifications(limit = 10): Promise<BiometricVerification[]> {
    return await db.select().from(biometricVerifications)
      .orderBy(desc(biometricVerifications.verifiedAt))
      .limit(limit);
  }

  async getBiometricVerificationsByPatient(patientId: string): Promise<BiometricVerification[]> {
    return await db.select().from(biometricVerifications)
      .where(eq(biometricVerifications.patientId, patientId))
      .orderBy(desc(biometricVerifications.verifiedAt));
  }

  async createBiometricVerification(verification: InsertBiometricVerification): Promise<BiometricVerification> {
    const result = await db.insert(biometricVerifications).values(verification).returning();
    return result[0];
  }

  // ========== BIOMETRIC STATS ==========
  async getBiometricStats(): Promise<{
    totalPatients: number;
    totalTemplates: number;
    verificationsToday: number;
    successfulVerifications: number;
    fingerprintTemplates: number;
    faceTemplates: number;
  }> {
    const templates = await this.getAllBiometricTemplates();
    const verifications = await this.getAllBiometricVerifications();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const verificationsToday = verifications.filter(v => 
      v.verifiedAt && new Date(v.verifiedAt) >= today
    ).length;
    
    const successfulVerifications = verifications.filter(v => v.isMatch).length;
    const fingerprintTemplates = templates.filter(t => t.biometricType === "fingerprint").length;
    const faceTemplates = templates.filter(t => t.biometricType === "face").length;
    
    const uniquePatients = new Set(templates.map(t => t.patientId));
    
    return {
      totalPatients: uniquePatients.size,
      totalTemplates: templates.length,
      verificationsToday,
      successfulVerifications,
      fingerprintTemplates,
      faceTemplates
    };
  }

  async simulateBiometricCapture(patientId: string, biometricType: string): Promise<{
    success: boolean;
    quality: number;
    templateData: string;
    message: string;
  }> {
    const quality = Math.floor(Math.random() * 30) + 70;
    const success = quality >= 75;
    
    if (success) {
      const rawTemplate = `SIMULATED_TEMPLATE_${patientId}_${biometricType}_${Date.now()}`;
      const encrypted = this.encryptBiometricData(rawTemplate);
      
      return {
        success: true,
        quality,
        templateData: encrypted.encrypted,
        message: `${biometricType} captured successfully with quality score ${quality}`
      };
    }
    
    return {
      success: false,
      quality,
      templateData: "",
      message: `${biometricType} capture failed. Quality score ${quality} is below threshold of 75`
    };
  }

  async verifyBiometric(patientId: string, biometricType: string, templateData: string): Promise<{
    isMatch: boolean;
    confidenceScore: number;
    message: string;
    verificationId?: string;
  }> {
    const existingTemplates = await this.getBiometricTemplatesByPatient(patientId);
    const matchingTemplate = existingTemplates.find(t => t.biometricType === biometricType && t.isActive);
    
    if (!matchingTemplate) {
      const verification = await this.createBiometricVerification({
        patientId,
        templateId: null,
        biometricType,
        confidenceScore: "0.00",
        isMatch: false,
        ipAddress: null,
        deviceInfo: null
      });
      
      return {
        isMatch: false,
        confidenceScore: 0,
        message: `No ${biometricType} template found for this patient`,
        verificationId: verification.id
      };
    }
    
    const confidenceScore = Math.floor(Math.random() * 15) + 85;
    const isMatch = confidenceScore >= 90;
    
    const verification = await this.createBiometricVerification({
      patientId,
      templateId: matchingTemplate.id,
      biometricType,
      confidenceScore: confidenceScore.toFixed(2),
      isMatch,
      ipAddress: null,
      deviceInfo: null
    });
    
    return {
      isMatch,
      confidenceScore,
      message: isMatch ? "Identity verified successfully" : "Identity verification failed",
      verificationId: verification.id
    };
  }

  // ========== NOTIFICATION SERVICE METHODS ==========
  async getAllNotifications(): Promise<Notification[]> {
    return await db.select().from(notifications).orderBy(desc(notifications.createdAt));
  }

  async getNotificationById(id: string): Promise<Notification | undefined> {
    const result = await db.select().from(notifications).where(eq(notifications.id, id));
    return result[0];
  }

  async getNotificationsByCategory(category: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.category, category))
      .orderBy(desc(notifications.createdAt));
  }

  async getNotificationsByStatus(status: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.status, status))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async updateNotification(id: string, notification: Partial<InsertNotification>): Promise<Notification | undefined> {
    const result = await db.update(notifications)
      .set(notification)
      .where(eq(notifications.id, id))
      .returning();
    return result[0];
  }

  async sendNotification(id: string): Promise<Notification | undefined> {
    const result = await db.update(notifications)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return result[0];
  }

  async deleteNotification(id: string): Promise<boolean> {
    await db.delete(notifications).where(eq(notifications.id, id));
    return true;
  }

  // ========== HOSPITAL TEAM MEMBERS METHODS ==========
  async getAllTeamMembers(): Promise<HospitalTeamMember[]> {
    return await db.select().from(hospitalTeamMembers);
  }

  async getTeamMemberById(id: string): Promise<HospitalTeamMember | undefined> {
    const result = await db.select().from(hospitalTeamMembers).where(eq(hospitalTeamMembers.id, id));
    return result[0];
  }

  async getTeamMembersByDepartment(department: string): Promise<HospitalTeamMember[]> {
    return await db.select().from(hospitalTeamMembers).where(eq(hospitalTeamMembers.department, department));
  }

  async getOnCallTeamMembers(): Promise<HospitalTeamMember[]> {
    return await db.select().from(hospitalTeamMembers).where(eq(hospitalTeamMembers.isOnCall, true));
  }

  async createTeamMember(member: InsertHospitalTeamMember): Promise<HospitalTeamMember> {
    const result = await db.insert(hospitalTeamMembers).values(member).returning();
    return result[0];
  }

  async updateTeamMember(id: string, member: Partial<InsertHospitalTeamMember>): Promise<HospitalTeamMember | undefined> {
    const result = await db.update(hospitalTeamMembers)
      .set({ ...member, updatedAt: new Date() })
      .where(eq(hospitalTeamMembers.id, id))
      .returning();
    return result[0];
  }

  async deleteTeamMember(id: string): Promise<boolean> {
    await db.delete(hospitalTeamMembers).where(eq(hospitalTeamMembers.id, id));
    return true;
  }

  async updateTeamMemberOnCallStatus(id: string, isOnCall: boolean): Promise<HospitalTeamMember | undefined> {
    const result = await db.update(hospitalTeamMembers)
      .set({ isOnCall, updatedAt: new Date() })
      .where(eq(hospitalTeamMembers.id, id))
      .returning();
    return result[0];
  }

  // ========== NOTIFICATION STATS ==========
  async getNotificationStats(): Promise<{
    totalSent: number;
    pendingCount: number;
    byChannel: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    const allNotifications = await this.getAllNotifications();
    
    const totalSent = allNotifications.filter(n => n.status === "sent").length;
    const pendingCount = allNotifications.filter(n => n.status === "draft" || n.status === "scheduled").length;
    
    const byChannel: Record<string, number> = { push: 0, email: 0, sms: 0, whatsapp: 0 };
    const byCategory: Record<string, number> = {};
    
    allNotifications.filter(n => n.status === "sent").forEach(n => {
      n.channels.forEach(channel => {
        byChannel[channel] = (byChannel[channel] || 0) + 1;
      });
      byCategory[n.category] = (byCategory[n.category] || 0) + 1;
    });
    
    return { totalSent, pendingCount, byChannel, byCategory };
  }

  // ========== SEED DATA METHOD ==========
  async seedInitialData(): Promise<void> {
    // Check if data already exists
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log("Database already has data, skipping seed...");
      return;
    }

    console.log("Seeding initial data...");

    // Seed demo users (5 per role = 25 users)
    const demoUsers: InsertUser[] = [
      // Admins
      { username: "admin1", password: "Admin@123", role: "ADMIN", name: "Rajesh Sharma", email: "rajesh.sharma@gravityhospital.com" },
      { username: "admin2", password: "Admin@123", role: "ADMIN", name: "Priya Mehta", email: "priya.mehta@gravityhospital.com" },
      { username: "admin3", password: "Admin@123", role: "ADMIN", name: "Amit Patel", email: "amit.patel@gravityhospital.com" },
      { username: "admin4", password: "Admin@123", role: "ADMIN", name: "Sunita Rao", email: "sunita.rao@gravityhospital.com" },
      { username: "admin5", password: "Admin@123", role: "ADMIN", name: "Vikram Singh", email: "vikram.singh@gravityhospital.com" },
      // Doctors
      { username: "doctor1", password: "Doctor@123", role: "DOCTOR", name: "Dr. Anil Kulkarni", email: "anil.kulkarni@gravityhospital.com" },
      { username: "doctor2", password: "Doctor@123", role: "DOCTOR", name: "Dr. Snehal Patil", email: "snehal.patil@gravityhospital.com" },
      { username: "doctor3", password: "Doctor@123", role: "DOCTOR", name: "Dr. Rahul Deshmukh", email: "rahul.deshmukh@gravityhospital.com" },
      { username: "doctor4", password: "Doctor@123", role: "DOCTOR", name: "Dr. Kavita Joshi", email: "kavita.joshi@gravityhospital.com" },
      { username: "doctor5", password: "Doctor@123", role: "DOCTOR", name: "Dr. Suresh Nair", email: "suresh.nair@gravityhospital.com" },
      // Nurses
      { username: "nurse1", password: "Nurse@123", role: "NURSE", name: "Anita Deshpande", email: "anita.deshpande@gravityhospital.com" },
      { username: "nurse2", password: "Nurse@123", role: "NURSE", name: "Meera Kulkarni", email: "meera.kulkarni@gravityhospital.com" },
      { username: "nurse3", password: "Nurse@123", role: "NURSE", name: "Ravi Kumar", email: "ravi.kumar@gravityhospital.com" },
      { username: "nurse4", password: "Nurse@123", role: "NURSE", name: "Priya Sharma", email: "priya.sharma@gravityhospital.com" },
      { username: "nurse5", password: "Nurse@123", role: "NURSE", name: "Deepa Nair", email: "deepa.nair@gravityhospital.com" },
      // OPD Managers
      { username: "opd1", password: "OPD@123", role: "OPD_MANAGER", name: "Sachin Tendulkar", email: "sachin.t@gravityhospital.com" },
      { username: "opd2", password: "OPD@123", role: "OPD_MANAGER", name: "Neeta Ambani", email: "neeta.a@gravityhospital.com" },
      { username: "opd3", password: "OPD@123", role: "OPD_MANAGER", name: "Ramesh Iyer", email: "ramesh.i@gravityhospital.com" },
      { username: "opd4", password: "OPD@123", role: "OPD_MANAGER", name: "Geeta Phogat", email: "geeta.p@gravityhospital.com" },
      { username: "opd5", password: "OPD@123", role: "OPD_MANAGER", name: "Manish Malhotra", email: "manish.m@gravityhospital.com" },
      // Patients
      { username: "patient1", password: "Patient@123", role: "PATIENT", name: "Rahul Verma", email: "rahul.verma@gmail.com" },
      { username: "patient2", password: "Patient@123", role: "PATIENT", name: "Anjali Kapoor", email: "anjali.kapoor@gmail.com" },
      { username: "patient3", password: "Patient@123", role: "PATIENT", name: "Vikas Reddy", email: "vikas.reddy@gmail.com" },
      { username: "patient4", password: "Patient@123", role: "PATIENT", name: "Pooja Sharma", email: "pooja.sharma@gmail.com" },
      { username: "patient5", password: "Patient@123", role: "PATIENT", name: "Kiran Yadav", email: "kiran.yadav@gmail.com" },
    ];

    for (const user of demoUsers) {
      await db.insert(users).values(user);
    }

    // Seed doctors for OPD
    const demoDoctors: InsertDoctor[] = [
      { name: "Dr. Anil Kulkarni", specialty: "General Medicine", qualification: "MBBS, MD", experience: 15, rating: "4.8", availableDays: "Mon, Wed, Fri", avatarInitials: "AK" },
      { name: "Dr. Snehal Patil", specialty: "Pediatrics", qualification: "MBBS, DCH", experience: 12, rating: "4.9", availableDays: "Tue, Thu, Sat", avatarInitials: "SP" },
      { name: "Dr. Rahul Deshmukh", specialty: "Cardiology", qualification: "MBBS, DM Cardiology", experience: 18, rating: "4.7", availableDays: "Mon, Tue, Wed", avatarInitials: "RD" },
      { name: "Dr. Kavita Joshi", specialty: "Gynecology", qualification: "MBBS, MS OBG", experience: 14, rating: "4.8", availableDays: "Wed, Thu, Fri", avatarInitials: "KJ" },
      { name: "Dr. Suresh Nair", specialty: "Orthopedics", qualification: "MBBS, MS Ortho", experience: 20, rating: "4.6", availableDays: "Mon, Thu, Sat", avatarInitials: "SN" },
      { name: "Dr. Priya Sharma", specialty: "Dermatology", qualification: "MBBS, MD Dermatology", experience: 10, rating: "4.9", availableDays: "Tue, Fri, Sat", avatarInitials: "PS" },
      { name: "Dr. Rajesh Kumar", specialty: "ENT", qualification: "MBBS, MS ENT", experience: 16, rating: "4.5", availableDays: "Mon, Wed, Sat", avatarInitials: "RK" },
      { name: "Dr. Amit Singh", specialty: "Neurology", qualification: "MBBS, DM Neurology", experience: 22, rating: "4.8", availableDays: "Tue, Thu, Fri", avatarInitials: "AS" },
      { name: "Dr. Meena Gupta", specialty: "Ophthalmology", qualification: "MBBS, MS Ophthalmology", experience: 13, rating: "4.7", availableDays: "Mon, Wed, Thu", avatarInitials: "MG" },
      { name: "Dr. Vikram Patel", specialty: "Psychiatry", qualification: "MBBS, MD Psychiatry", experience: 11, rating: "4.6", availableDays: "Tue, Wed, Sat", avatarInitials: "VP" },
      { name: "Dr. Sunita Reddy", specialty: "Radiology", qualification: "MBBS, MD Radiology", experience: 17, rating: "4.8", availableDays: "Mon, Thu, Fri", avatarInitials: "SR" },
      { name: "Dr. Ajay Thakur", specialty: "Anesthesiology", qualification: "MBBS, MD Anesthesia", experience: 19, rating: "4.7", availableDays: "All Days", avatarInitials: "AT" },
    ];

    for (const doctor of demoDoctors) {
      await db.insert(doctors).values(doctor);
    }

    // Seed sample service patients
    const samplePatients: InsertServicePatient[] = [
      { firstName: "Sanjay", lastName: "Gupta", dateOfBirth: "1970-03-15", gender: "Male", phone: "9876543210", email: "sanjay.gupta@gmail.com", address: "123 MG Road, Pune", emergencyContact: "Priya Gupta", emergencyPhone: "9876543211", insuranceProvider: "Star Health", insuranceNumber: "SH123456" },
      { firstName: "Anita", lastName: "Sharma", dateOfBirth: "1985-07-22", gender: "Female", phone: "9876543212", email: "anita.sharma@gmail.com", address: "456 FC Road, Pune", emergencyContact: "Rajesh Sharma", emergencyPhone: "9876543213", insuranceProvider: "ICICI Lombard", insuranceNumber: "IL789012" },
      { firstName: "Vikram", lastName: "Singh", dateOfBirth: "1960-11-08", gender: "Male", phone: "9876543214", email: "vikram.singh@gmail.com", address: "789 JM Road, Pune", emergencyContact: "Meera Singh", emergencyPhone: "9876543215", insuranceProvider: "Max Bupa", insuranceNumber: "MB345678" },
      { firstName: "Priya", lastName: "Patel", dateOfBirth: "1992-04-30", gender: "Female", phone: "9876543216", email: "priya.patel@gmail.com", address: "321 Koregaon Park, Pune", emergencyContact: "Amit Patel", emergencyPhone: "9876543217", insuranceProvider: "Bajaj Allianz", insuranceNumber: "BA901234" },
    ];

    for (const patient of samplePatients) {
      await db.insert(servicePatients).values(patient);
    }

    // Seed tracking patients
    const trackingPatientsData: InsertTrackingPatient[] = [
      { name: "Sanjay Gupta", age: 55, gender: "Male", department: "General Medicine", room: "310A", diagnosis: "Hypertension", doctor: "Dr. Kavita Joshi", notes: null, dischargeDate: null },
      { name: "Anita Sharma", age: 38, gender: "Female", department: "Cardiology", room: "205B", diagnosis: "Cardiac Arrhythmia", doctor: "Dr. Rahul Deshmukh", notes: null, dischargeDate: null },
      { name: "Rajesh Kumar", age: 45, gender: "Male", department: "Orthopedics", room: "112A", diagnosis: "Knee Surgery Recovery", doctor: "Dr. Suresh Nair", notes: null, dischargeDate: null },
      { name: "Priya Patel", age: 28, gender: "Female", department: "Gynecology", room: "401C", diagnosis: "Post-partum care", doctor: "Dr. Kavita Joshi", notes: null, dischargeDate: null },
    ];

    for (const tp of trackingPatientsData) {
      await db.insert(trackingPatients).values({
        ...tp,
        status: "admitted",
        admissionDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      });
    }

    console.log("Initial data seeded successfully!");
  }

  // ========== ACTIVITY LOG METHODS ==========
  async getActivityLogs(limit?: number): Promise<ActivityLog[]> {
    if (limit) {
      return await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
    }
    return await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt));
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const result = await db.insert(activityLogs).values(log).returning();
    return result[0];
  }

  // ========== EQUIPMENT SERVICING METHODS ==========
  async getEquipment(): Promise<Equipment[]> {
    return await db.select().from(equipment).orderBy(desc(equipment.createdAt));
  }

  async getEquipmentById(id: string): Promise<Equipment | undefined> {
    const result = await db.select().from(equipment).where(eq(equipment.id, id));
    return result[0];
  }

  async createEquipment(equip: InsertEquipment): Promise<Equipment> {
    const result = await db.insert(equipment).values(equip).returning();
    return result[0];
  }

  async updateEquipment(id: string, updates: Partial<InsertEquipment>): Promise<Equipment | undefined> {
    const result = await db.update(equipment)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(equipment.id, id))
      .returning();
    return result[0];
  }

  async deleteEquipment(id: string): Promise<boolean> {
    const result = await db.delete(equipment).where(eq(equipment.id, id)).returning();
    return result.length > 0;
  }

  // Service History Methods
  async getServiceHistory(equipmentId?: string): Promise<ServiceHistory[]> {
    if (equipmentId) {
      return await db.select().from(serviceHistory)
        .where(eq(serviceHistory.equipmentId, equipmentId))
        .orderBy(desc(serviceHistory.serviceDate));
    }
    return await db.select().from(serviceHistory).orderBy(desc(serviceHistory.serviceDate));
  }

  async createServiceHistory(history: InsertServiceHistory): Promise<ServiceHistory> {
    const result = await db.insert(serviceHistory).values(history).returning();
    return result[0];
  }

  async deleteServiceHistory(id: string): Promise<boolean> {
    const result = await db.delete(serviceHistory).where(eq(serviceHistory.id, id)).returning();
    return result.length > 0;
  }

  // Emergency Contacts Methods
  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    return await db.select().from(emergencyContacts).orderBy(emergencyContacts.serviceType);
  }

  async createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact> {
    const result = await db.insert(emergencyContacts).values(contact).returning();
    return result[0];
  }

  async updateEmergencyContact(id: string, updates: Partial<InsertEmergencyContact>): Promise<EmergencyContact | undefined> {
    const result = await db.update(emergencyContacts)
      .set(updates)
      .where(eq(emergencyContacts.id, id))
      .returning();
    return result[0];
  }

  async deleteEmergencyContact(id: string): Promise<boolean> {
    const result = await db.delete(emergencyContacts).where(eq(emergencyContacts.id, id)).returning();
    return result.length > 0;
  }

  // Seed Equipment Data
  async seedEquipmentData(): Promise<void> {
    const existingEquipment = await db.select().from(equipment).limit(1);
    if (existingEquipment.length > 0) {
      console.log("Equipment data already exists, skipping seed...");
      return;
    }

    console.log("Seeding equipment data...");

    const equipmentData: InsertEquipment[] = [
      { name: "X-Ray Machine", model: "GE Definium 656", serialNumber: "XR-2024-001", lastServiceDate: "2024-11-15", nextDueDate: "2025-02-15", status: "up-to-date", location: "Radiology Dept", serviceFrequency: "quarterly", companyName: "GE Healthcare India", contactNumber: "+91 1800 103 4800", emergencyNumber: "+91 98765 11111" },
      { name: "MRI Scanner", model: "Siemens MAGNETOM", serialNumber: "MR-2024-002", lastServiceDate: "2024-10-20", nextDueDate: "2024-12-20", status: "due-soon", location: "Imaging Center", serviceFrequency: "quarterly", companyName: "Siemens Healthineers", contactNumber: "+91 1800 209 1800", emergencyNumber: "+91 98765 22222" },
      { name: "CT Scanner", model: "Philips Ingenuity", serialNumber: "CT-2024-003", lastServiceDate: "2024-08-10", nextDueDate: "2024-11-10", status: "overdue", location: "Radiology Dept", serviceFrequency: "quarterly", companyName: "Philips Healthcare", contactNumber: "+91 1800 102 2929", emergencyNumber: "+91 98765 33333" },
      { name: "Ultrasound System", model: "GE LOGIQ E10", serialNumber: "US-2024-004", lastServiceDate: "2024-11-25", nextDueDate: "2025-02-25", status: "up-to-date", location: "OBG Dept", serviceFrequency: "quarterly", companyName: "GE Healthcare India", contactNumber: "+91 1800 103 4800", emergencyNumber: "+91 98765 11111" },
      { name: "ECG Machine", model: "Philips PageWriter", serialNumber: "ECG-2024-005", lastServiceDate: "2024-11-01", nextDueDate: "2025-01-01", status: "due-soon", location: "Cardiology", serviceFrequency: "monthly", companyName: "Philips Healthcare", contactNumber: "+91 1800 102 2929", emergencyNumber: "+91 98765 33333" },
      { name: "Ventilator", model: "Draeger Evita V500", serialNumber: "VT-2024-006", lastServiceDate: "2024-09-15", nextDueDate: "2024-11-15", status: "overdue", location: "ICU", serviceFrequency: "monthly", companyName: "Draeger Medical India", contactNumber: "+91 1800 123 4567", emergencyNumber: "+91 98765 44444" },
      { name: "Defibrillator", model: "Philips HeartStart", serialNumber: "DF-2024-007", lastServiceDate: "2024-11-20", nextDueDate: "2025-02-20", status: "up-to-date", location: "Emergency", serviceFrequency: "quarterly", companyName: "Philips Healthcare", contactNumber: "+91 1800 102 2929", emergencyNumber: "+91 98765 33333" },
      { name: "Anesthesia Machine", model: "GE Aisys CS2", serialNumber: "AN-2024-008", lastServiceDate: "2024-10-05", nextDueDate: "2024-12-05", status: "due-soon", location: "Operation Theater", serviceFrequency: "monthly", companyName: "GE Healthcare India", contactNumber: "+91 1800 103 4800", emergencyNumber: "+91 98765 11111" },
      { name: "Patient Monitor", model: "Philips IntelliVue", serialNumber: "PM-2024-009", lastServiceDate: "2024-11-10", nextDueDate: "2025-01-10", status: "up-to-date", location: "ICU", serviceFrequency: "monthly", companyName: "Philips Healthcare", contactNumber: "+91 1800 102 2929", emergencyNumber: "+91 98765 33333" },
    ];

    for (const equip of equipmentData) {
      await db.insert(equipment).values(equip);
    }

    // Seed service history
    const allEquipment = await this.getEquipment();
    const serviceHistoryData: InsertServiceHistory[] = [
      { equipmentId: allEquipment[0]?.id || "", serviceDate: "2024-11-15", technician: "Rajesh Kumar", description: "Annual maintenance, calibration completed, tube replacement", cost: "₹45,000" },
      { equipmentId: allEquipment[0]?.id || "", serviceDate: "2024-08-10", technician: "Amit Sharma", description: "Quarterly inspection and cleaning", cost: "₹15,000" },
      { equipmentId: allEquipment[0]?.id || "", serviceDate: "2024-05-05", technician: "Rajesh Kumar", description: "Software update and system optimization", cost: "₹8,000" },
      { equipmentId: allEquipment[1]?.id || "", serviceDate: "2024-10-20", technician: "Suresh Reddy", description: "Coil replacement and calibration", cost: "₹1,25,000" },
      { equipmentId: allEquipment[1]?.id || "", serviceDate: "2024-07-15", technician: "Suresh Reddy", description: "Helium refill and system check", cost: "₹85,000" },
      { equipmentId: allEquipment[2]?.id || "", serviceDate: "2024-08-10", technician: "Vikram Singh", description: "Gantry alignment and detector calibration", cost: "₹55,000" },
    ];

    for (const history of serviceHistoryData) {
      if (history.equipmentId) {
        await db.insert(serviceHistory).values(history);
      }
    }

    // Seed emergency contacts
    const emergencyContactsData: InsertEmergencyContact[] = [
      { name: "City Ambulance Service", serviceType: "Medical Help", phoneNumber: "+91 102", isPrimary: true, isActive: true },
      { name: "Hospital Emergency", serviceType: "Medical Help", phoneNumber: "+91 20 1234 5678", isPrimary: true, isActive: true },
      { name: "Fire Brigade", serviceType: "Fire Service", phoneNumber: "+91 101", isPrimary: true, isActive: true },
      { name: "Police Control Room", serviceType: "Police", phoneNumber: "+91 100", isPrimary: true, isActive: true },
      { name: "Sharma Plumbing Works", serviceType: "Plumber", phoneNumber: "+91 98765 12345", isPrimary: true, isActive: true },
      { name: "Quick Fix Plumbers", serviceType: "Plumber", phoneNumber: "+91 98765 67890", isPrimary: false, isActive: true },
      { name: "PowerTech Electricals", serviceType: "Electrician", phoneNumber: "+91 97654 32100", isPrimary: true, isActive: true },
      { name: "City Electricians", serviceType: "Electrician", phoneNumber: "+91 97654 11111", isPrimary: false, isActive: true },
      { name: "Otis Elevator Service", serviceType: "Lift Service", phoneNumber: "+91 1800 123 4567", isPrimary: true, isActive: true },
      { name: "TechSupport IT Solutions", serviceType: "IT Support", phoneNumber: "+91 88888 77777", isPrimary: true, isActive: true },
      { name: "Network Solutions", serviceType: "IT Support", phoneNumber: "+91 88888 66666", isPrimary: false, isActive: true },
    ];

    for (const contact of emergencyContactsData) {
      await db.insert(emergencyContacts).values(contact);
    }

    console.log("Equipment data seeded successfully!");
  }

  // ========== HOSPITAL SETTINGS METHODS ==========
  async getHospitalSettings(): Promise<HospitalSettings | undefined> {
    const result = await db.select().from(hospitalSettings).limit(1);
    return result[0];
  }

  async createHospitalSettings(settings: InsertHospitalSettings): Promise<HospitalSettings> {
    const result = await db.insert(hospitalSettings).values(settings).returning();
    return result[0];
  }

  async updateHospitalSettings(id: string, updates: Partial<InsertHospitalSettings>): Promise<HospitalSettings | undefined> {
    const result = await db.update(hospitalSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(hospitalSettings.id, id))
      .returning();
    return result[0];
  }

  async getOrCreateHospitalSettings(): Promise<HospitalSettings> {
    const existing = await this.getHospitalSettings();
    if (existing) return existing;
    
    // Create default settings
    return await this.createHospitalSettings({
      name: "Gravity Hospital",
      address: "sane chowk, Nair Colony, More Vasti, Chikhali, Pimpri-Chinchwad, Maharashtra 411062",
      phone: "+91 20 2745 8900",
      email: "info@gravityhospital.in",
      website: "www.gravityhospital.in",
      establishedYear: "2015",
      licenseNumber: "MH-PUNE-2015-001234",
      registrationNumber: "REG-MH-15-001234",
      emergencyHours: "24/7",
      opdHours: "08:00 - 20:00",
      visitingHours: "10:00 - 12:00, 16:00 - 18:00",
      maxPatientsPerDay: "200",
      appointmentSlotDuration: "30",
      emergencyWaitTime: "15",
      totalBeds: "150",
      icuBeds: "20",
      emergencyBeds: "15",
      operationTheaters: "8",
      departments: ["Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Emergency Medicine", "General Surgery", "Radiology", "Pathology"],
    });
  }
}

export const databaseStorage = new DatabaseStorage();
