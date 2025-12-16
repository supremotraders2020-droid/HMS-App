import { db } from "./db";
import { eq, desc, and, lt, sql } from "drizzle-orm";
import { randomUUID, randomBytes, createCipheriv, createDecipheriv } from "crypto";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;
import {
  users, doctors, schedules, appointments,
  inventoryItems, staffMembers, inventoryPatients, inventoryTransactions,
  trackingPatients, medications, meals, vitals,
  conversationLogs, servicePatients, admissions, medicalRecords,
  biometricTemplates, biometricVerifications,
  notifications, hospitalTeamMembers, activityLogs,
  equipment, serviceHistory, emergencyContacts, hospitalSettings,
  prescriptions, doctorSchedules, doctorPatients, doctorProfiles, patientProfiles, userNotifications, consentForms,
  patientConsents, medicines, oxygenCylinders, cylinderMovements, oxygenConsumption, lmoReadings, oxygenAlerts,
  bmwBags, bmwMovements, bmwPickups, bmwDisposals, bmwVendors, bmwStorageRooms, bmwIncidents, bmwReports,
  doctorOathConfirmations, consentTemplates, resolvedAlerts, doctorTimeSlots,
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
  type HospitalSettings, type InsertHospitalSettings,
  type Prescription, type InsertPrescription, type DoctorSchedule, type InsertDoctorSchedule,
  type DoctorPatient, type InsertDoctorPatient, type DoctorProfile, type InsertDoctorProfile,
  type PatientProfile, type InsertPatientProfile,
  type UserNotification, type InsertUserNotification,
  type ConsentForm, type InsertConsentForm,
  type PatientConsent, type InsertPatientConsent,
  type Medicine, type InsertMedicine,
  type OxygenCylinder, type InsertOxygenCylinder,
  type CylinderMovement, type InsertCylinderMovement,
  type OxygenConsumption, type InsertOxygenConsumption,
  type LmoReading, type InsertLmoReading,
  type OxygenAlert, type InsertOxygenAlert,
  type BmwBag, type InsertBmwBag,
  type BmwMovement, type InsertBmwMovement,
  type BmwPickup, type InsertBmwPickup,
  type BmwDisposal, type InsertBmwDisposal,
  type BmwVendor, type InsertBmwVendor,
  type BmwStorageRoom, type InsertBmwStorageRoom,
  type BmwIncident, type InsertBmwIncident,
  type BmwReport, type InsertBmwReport,
  doctorVisits, type DoctorVisit, type InsertDoctorVisit,
  type DoctorOathConfirmation, type InsertDoctorOathConfirmation,
  type ConsentTemplate, type InsertConsentTemplate,
  type ResolvedAlert, type InsertResolvedAlert,
  type DoctorTimeSlot, type InsertDoctorTimeSlot
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
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

  // ========== PATIENT CONSENT METHODS ==========
  async getAllPatientConsents(): Promise<PatientConsent[]> {
    return await db.select().from(patientConsents).orderBy(desc(patientConsents.uploadedAt));
  }

  async getPatientConsentsByPatientId(patientId: string): Promise<PatientConsent[]> {
    return await db.select().from(patientConsents)
      .where(eq(patientConsents.patientId, patientId))
      .orderBy(desc(patientConsents.uploadedAt));
  }

  async getPatientConsentById(id: string): Promise<PatientConsent | undefined> {
    const result = await db.select().from(patientConsents).where(eq(patientConsents.id, id));
    return result[0];
  }

  async createPatientConsent(consent: InsertPatientConsent): Promise<PatientConsent> {
    const result = await db.insert(patientConsents).values(consent).returning();
    return result[0];
  }

  async deletePatientConsent(id: string): Promise<boolean> {
    await db.delete(patientConsents).where(eq(patientConsents.id, id));
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

  // ========== ENSURE ESSENTIAL ACCOUNTS ==========
  async ensureEssentialAccounts(): Promise<void> {
    const essentialAccounts = [
      { username: "admin", password: "123456", role: "ADMIN" as const, name: "Administrator", email: "admin@gravityhospital.in" },
      { username: "patient", password: "123456", role: "PATIENT" as const, name: "Test Patient", email: "patient@gravityhospital.in" },
      { username: "doctor", password: "123456", role: "DOCTOR" as const, name: "Doctor", email: "doctor@gravityhospital.in" },
      { username: "dr.anil.kulkarni", password: "Doctor@123", role: "DOCTOR" as const, name: "Dr. Anil Kulkarni", email: "dr.anil.kulkarni@gravityhospital.in" },
      { username: "dr.snehal.patil", password: "Doctor@123", role: "DOCTOR" as const, name: "Dr. Snehal Patil", email: "dr.snehal.patil@gravityhospital.in" },
      { username: "dr.vikram.deshpande", password: "Doctor@123", role: "DOCTOR" as const, name: "Dr. Vikram Deshpande", email: "dr.vikram.deshpande@gravityhospital.in" },
      { username: "dr.priyanka.joshi", password: "Doctor@123", role: "DOCTOR" as const, name: "Dr. Priyanka Joshi", email: "dr.priyanka.joshi@gravityhospital.in" },
      { username: "dr.rajesh.bhosale", password: "Doctor@123", role: "DOCTOR" as const, name: "Dr. Rajesh Bhosale", email: "dr.rajesh.bhosale@gravityhospital.in" },
      { username: "dr.meena.sharma", password: "Doctor@123", role: "DOCTOR" as const, name: "Dr. Meena Sharma", email: "dr.meena.sharma@gravityhospital.in" },
      { username: "dr.sunil.gaikwad", password: "Doctor@123", role: "DOCTOR" as const, name: "Dr. Sunil Gaikwad", email: "dr.sunil.gaikwad@gravityhospital.in" },
      { username: "dr.kavita.deshmukh", password: "Doctor@123", role: "DOCTOR" as const, name: "Dr. Kavita Deshmukh", email: "dr.kavita.deshmukh@gravityhospital.in" },
      { username: "dr.amit.jadhav", password: "Doctor@123", role: "DOCTOR" as const, name: "Dr. Amit Jadhav", email: "dr.amit.jadhav@gravityhospital.in" },
      { username: "dr.sunita.pawar", password: "Doctor@123", role: "DOCTOR" as const, name: "Dr. Sunita Pawar", email: "dr.sunita.pawar@gravityhospital.in" },
    ];

    for (const account of essentialAccounts) {
      const existingUser = await this.getUserByUsername(account.username);
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(account.password, SALT_ROUNDS);
        await db.insert(users).values({
          username: account.username,
          password: hashedPassword,
          role: account.role,
          name: account.name,
          email: account.email,
        });
        console.log(`Created essential account: ${account.username}`);
      }
    }
  }

  // ========== SEED DATA METHOD ==========
  async seedInitialData(): Promise<void> {
    // Always ensure essential accounts exist (admin, patient)
    await this.ensureEssentialAccounts();
    
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
      // Nurses are now added only by admin through User Management
      // No mock nurse data is seeded - real nurses must be added by admin
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
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
      await db.insert(users).values({ ...user, password: hashedPassword });
    }

    // Doctors are now added only by admin through User Management
    // No mock doctor data is seeded - real doctors must be added by admin

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
      address: "Gat No, 167, Sahyog Nager, Triveni Nagar, Nigdi, Pimpri-Chinchwad, Maharashtra 411062",
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

  // ========== PRESCRIPTION METHODS ==========
  async getPrescriptions(): Promise<Prescription[]> {
    return await db.select().from(prescriptions).orderBy(desc(prescriptions.createdAt));
  }

  async getPrescriptionsByDoctor(doctorId: string): Promise<Prescription[]> {
    return await db.select().from(prescriptions).where(eq(prescriptions.doctorId, doctorId)).orderBy(desc(prescriptions.createdAt));
  }

  async getPrescriptionsByPatient(patientName: string): Promise<Prescription[]> {
    return await db.select().from(prescriptions).where(eq(prescriptions.patientName, patientName)).orderBy(desc(prescriptions.createdAt));
  }

  async getPrescription(id: string): Promise<Prescription | undefined> {
    const result = await db.select().from(prescriptions).where(eq(prescriptions.id, id));
    return result[0];
  }

  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    const result = await db.insert(prescriptions).values(prescription).returning();
    return result[0];
  }

  async updatePrescription(id: string, updates: Partial<InsertPrescription>): Promise<Prescription | undefined> {
    const result = await db.update(prescriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(prescriptions.id, id))
      .returning();
    return result[0];
  }

  async deletePrescription(id: string): Promise<boolean> {
    const result = await db.delete(prescriptions).where(eq(prescriptions.id, id)).returning();
    return result.length > 0;
  }

  // ========== DOCTOR SCHEDULE METHODS ==========
  async getDoctorSchedules(doctorId: string): Promise<DoctorSchedule[]> {
    return await db.select().from(doctorSchedules).where(eq(doctorSchedules.doctorId, doctorId));
  }

  async getDoctorSchedule(id: string): Promise<DoctorSchedule | undefined> {
    const result = await db.select().from(doctorSchedules).where(eq(doctorSchedules.id, id));
    return result[0];
  }

  async createDoctorSchedule(schedule: InsertDoctorSchedule): Promise<DoctorSchedule> {
    const result = await db.insert(doctorSchedules).values(schedule).returning();
    return result[0];
  }

  async updateDoctorSchedule(id: string, updates: Partial<InsertDoctorSchedule>): Promise<DoctorSchedule | undefined> {
    const result = await db.update(doctorSchedules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(doctorSchedules.id, id))
      .returning();
    return result[0];
  }

  async deleteDoctorSchedule(id: string): Promise<boolean> {
    const result = await db.delete(doctorSchedules).where(eq(doctorSchedules.id, id)).returning();
    return result.length > 0;
  }

  // ========== DOCTOR TIME SLOTS METHODS ==========
  async getDoctorTimeSlots(doctorId: string, date?: string, status?: string): Promise<DoctorTimeSlot[]> {
    let conditions = [eq(doctorTimeSlots.doctorId, doctorId)];
    if (date) conditions.push(eq(doctorTimeSlots.slotDate, date));
    if (status) conditions.push(eq(doctorTimeSlots.status, status));
    return await db.select().from(doctorTimeSlots).where(and(...conditions)).orderBy(doctorTimeSlots.startTime);
  }

  async getDoctorTimeSlotsBySchedule(scheduleId: string): Promise<DoctorTimeSlot[]> {
    return await db.select().from(doctorTimeSlots).where(eq(doctorTimeSlots.scheduleId, scheduleId)).orderBy(doctorTimeSlots.startTime);
  }

  async getDoctorTimeSlot(id: string): Promise<DoctorTimeSlot | undefined> {
    const result = await db.select().from(doctorTimeSlots).where(eq(doctorTimeSlots.id, id));
    return result[0];
  }

  async getAvailableTimeSlots(doctorId: string, date: string): Promise<DoctorTimeSlot[]> {
    return await db.select().from(doctorTimeSlots)
      .where(and(
        eq(doctorTimeSlots.doctorId, doctorId),
        eq(doctorTimeSlots.slotDate, date),
        eq(doctorTimeSlots.status, 'available')
      ))
      .orderBy(doctorTimeSlots.startTime);
  }

  async createDoctorTimeSlot(slot: InsertDoctorTimeSlot): Promise<DoctorTimeSlot> {
    const result = await db.insert(doctorTimeSlots).values(slot).returning();
    return result[0];
  }

  async createDoctorTimeSlotsBulk(slots: InsertDoctorTimeSlot[]): Promise<DoctorTimeSlot[]> {
    if (slots.length === 0) return [];
    const result = await db.insert(doctorTimeSlots).values(slots).returning();
    return result;
  }

  async bookTimeSlot(slotId: string, patientId: string, patientName: string, appointmentId: string): Promise<DoctorTimeSlot | undefined> {
    // Use transaction with SELECT FOR UPDATE to prevent double booking
    const result = await db.transaction(async (tx) => {
      // Lock and check the slot
      const [slot] = await tx.select().from(doctorTimeSlots)
        .where(and(eq(doctorTimeSlots.id, slotId), eq(doctorTimeSlots.status, 'available')))
        .for('update');
      
      if (!slot) {
        return undefined; // Slot not available or doesn't exist
      }

      // Book the slot
      const [updated] = await tx.update(doctorTimeSlots)
        .set({
          status: 'booked',
          patientId,
          patientName,
          appointmentId,
          bookedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(doctorTimeSlots.id, slotId))
        .returning();
      
      return updated;
    });
    
    return result;
  }

  async cancelTimeSlot(slotId: string): Promise<DoctorTimeSlot | undefined> {
    const result = await db.update(doctorTimeSlots)
      .set({
        status: 'available',
        patientId: null,
        patientName: null,
        appointmentId: null,
        bookedAt: null,
        updatedAt: new Date()
      })
      .where(eq(doctorTimeSlots.id, slotId))
      .returning();
    return result[0];
  }

  async deleteTimeSlotsBySchedule(scheduleId: string): Promise<boolean> {
    const result = await db.delete(doctorTimeSlots).where(eq(doctorTimeSlots.scheduleId, scheduleId)).returning();
    return result.length > 0;
  }

  // ========== DOCTOR PATIENT METHODS ==========
  async getDoctorPatients(doctorId: string): Promise<DoctorPatient[]> {
    return await db.select().from(doctorPatients).where(eq(doctorPatients.doctorId, doctorId)).orderBy(desc(doctorPatients.createdAt));
  }

  async getDoctorPatient(id: string): Promise<DoctorPatient | undefined> {
    const result = await db.select().from(doctorPatients).where(eq(doctorPatients.id, id));
    return result[0];
  }

  async createDoctorPatient(patient: InsertDoctorPatient): Promise<DoctorPatient> {
    const result = await db.insert(doctorPatients).values(patient).returning();
    return result[0];
  }

  async updateDoctorPatient(id: string, updates: Partial<InsertDoctorPatient>): Promise<DoctorPatient | undefined> {
    const result = await db.update(doctorPatients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(doctorPatients.id, id))
      .returning();
    return result[0];
  }

  async deleteDoctorPatient(id: string): Promise<boolean> {
    const result = await db.delete(doctorPatients).where(eq(doctorPatients.id, id)).returning();
    return result.length > 0;
  }

  // ========== DOCTOR PROFILE METHODS ==========
  async getDoctorProfile(doctorId: string): Promise<DoctorProfile | undefined> {
    const result = await db.select().from(doctorProfiles).where(eq(doctorProfiles.doctorId, doctorId));
    return result[0];
  }

  async getAllDoctorProfiles(): Promise<DoctorProfile[]> {
    return await db.select().from(doctorProfiles);
  }

  async createDoctorProfile(profile: InsertDoctorProfile): Promise<DoctorProfile> {
    const result = await db.insert(doctorProfiles).values(profile).returning();
    return result[0];
  }

  async updateDoctorProfile(doctorId: string, updates: Partial<InsertDoctorProfile>): Promise<DoctorProfile | undefined> {
    const result = await db.update(doctorProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(doctorProfiles.doctorId, doctorId))
      .returning();
    return result[0];
  }

  // ========== PATIENT PROFILE METHODS ==========
  async getPatientProfile(patientId: string): Promise<PatientProfile | undefined> {
    const result = await db.select().from(patientProfiles).where(eq(patientProfiles.patientId, patientId));
    return result[0];
  }

  async createPatientProfile(profile: InsertPatientProfile): Promise<PatientProfile> {
    const result = await db.insert(patientProfiles).values(profile).returning();
    return result[0];
  }

  async updatePatientProfile(patientId: string, updates: Partial<InsertPatientProfile>): Promise<PatientProfile | undefined> {
    const result = await db.update(patientProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(patientProfiles.patientId, patientId))
      .returning();
    return result[0];
  }

  async upsertPatientProfile(profile: InsertPatientProfile): Promise<PatientProfile> {
    const existing = await this.getPatientProfile(profile.patientId);
    if (existing) {
      return (await this.updatePatientProfile(profile.patientId, profile))!;
    }
    return this.createPatientProfile(profile);
  }

  // ========== USER NOTIFICATION METHODS ==========
  async getUserNotifications(userId: string): Promise<UserNotification[]> {
    return await db.select().from(userNotifications)
      .where(eq(userNotifications.userId, userId))
      .orderBy(desc(userNotifications.createdAt));
  }

  async getUserNotificationsByRole(userRole: string): Promise<UserNotification[]> {
    return await db.select().from(userNotifications)
      .where(eq(userNotifications.userRole, userRole))
      .orderBy(desc(userNotifications.createdAt));
  }

  async getUserNotification(id: string): Promise<UserNotification | undefined> {
    const result = await db.select().from(userNotifications).where(eq(userNotifications.id, id));
    return result[0];
  }

  async createUserNotification(notification: InsertUserNotification): Promise<UserNotification> {
    const result = await db.insert(userNotifications).values(notification).returning();
    return result[0];
  }

  async markUserNotificationRead(id: string): Promise<UserNotification | undefined> {
    const result = await db.update(userNotifications)
      .set({ isRead: true })
      .where(eq(userNotifications.id, id))
      .returning();
    return result[0];
  }

  async markAllUserNotificationsRead(userId: string): Promise<void> {
    await db.update(userNotifications)
      .set({ isRead: true })
      .where(eq(userNotifications.userId, userId));
  }

  async deleteUserNotification(id: string): Promise<boolean> {
    const result = await db.delete(userNotifications).where(eq(userNotifications.id, id)).returning();
    return result.length > 0;
  }

  // ========== CONSENT FORM METHODS ==========
  async getConsentForms(): Promise<ConsentForm[]> {
    return await db.select().from(consentForms).orderBy(desc(consentForms.createdAt));
  }

  async getConsentForm(id: string): Promise<ConsentForm | undefined> {
    const result = await db.select().from(consentForms).where(eq(consentForms.id, id));
    return result[0];
  }

  async getConsentFormsByCategory(category: string): Promise<ConsentForm[]> {
    return await db.select().from(consentForms)
      .where(eq(consentForms.category, category))
      .orderBy(desc(consentForms.createdAt));
  }

  async createConsentForm(form: InsertConsentForm): Promise<ConsentForm> {
    const result = await db.insert(consentForms).values(form).returning();
    return result[0];
  }

  async updateConsentForm(id: string, updates: Partial<InsertConsentForm>): Promise<ConsentForm | undefined> {
    const result = await db.update(consentForms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(consentForms.id, id))
      .returning();
    return result[0];
  }

  async deleteConsentForm(id: string): Promise<boolean> {
    const result = await db.delete(consentForms).where(eq(consentForms.id, id)).returning();
    return result.length > 0;
  }

  // ========== MEDICINES DATABASE METHODS ==========
  async getAllMedicines(): Promise<Medicine[]> {
    return await db.select().from(medicines).orderBy(medicines.brandName);
  }

  async getMedicine(id: string): Promise<Medicine | undefined> {
    const result = await db.select().from(medicines).where(eq(medicines.id, id));
    return result[0];
  }

  async getMedicinesByCategory(category: string): Promise<Medicine[]> {
    return await db.select().from(medicines)
      .where(eq(medicines.category, category))
      .orderBy(medicines.brandName);
  }

  async searchMedicines(query: string): Promise<Medicine[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db.select().from(medicines)
      .where(
        sql`LOWER(${medicines.brandName}) LIKE ${searchTerm} OR 
            LOWER(${medicines.genericName}) LIKE ${searchTerm} OR 
            LOWER(${medicines.companyName}) LIKE ${searchTerm} OR 
            LOWER(${medicines.category}) LIKE ${searchTerm} OR
            LOWER(${medicines.uses}) LIKE ${searchTerm}`
      )
      .orderBy(medicines.brandName);
  }

  async createMedicine(medicine: InsertMedicine): Promise<Medicine> {
    const result = await db.insert(medicines).values(medicine).returning();
    return result[0];
  }

  async createMedicinesBulk(medicineList: InsertMedicine[]): Promise<Medicine[]> {
    if (medicineList.length === 0) return [];
    const result = await db.insert(medicines).values(medicineList).returning();
    return result;
  }

  async deleteMedicine(id: string): Promise<boolean> {
    const result = await db.delete(medicines).where(eq(medicines.id, id)).returning();
    return result.length > 0;
  }

  async deleteAllMedicines(): Promise<boolean> {
    await db.delete(medicines);
    return true;
  }

  // ========== OXYGEN CYLINDER METHODS ==========
  async getOxygenCylinders(): Promise<OxygenCylinder[]> {
    return await db.select().from(oxygenCylinders).orderBy(desc(oxygenCylinders.createdAt));
  }

  async getOxygenCylinder(id: string): Promise<OxygenCylinder | undefined> {
    const result = await db.select().from(oxygenCylinders).where(eq(oxygenCylinders.id, id));
    return result[0];
  }

  async getOxygenCylinderByCode(code: string): Promise<OxygenCylinder | undefined> {
    const result = await db.select().from(oxygenCylinders).where(eq(oxygenCylinders.cylinderCode, code));
    return result[0];
  }

  async getOxygenCylindersByStatus(status: string): Promise<OxygenCylinder[]> {
    return await db.select().from(oxygenCylinders)
      .where(eq(oxygenCylinders.status, status))
      .orderBy(desc(oxygenCylinders.createdAt));
  }

  async createOxygenCylinder(cylinder: InsertOxygenCylinder): Promise<OxygenCylinder> {
    const result = await db.insert(oxygenCylinders).values(cylinder).returning();
    return result[0];
  }

  async updateOxygenCylinder(id: string, updates: Partial<InsertOxygenCylinder>): Promise<OxygenCylinder | undefined> {
    const result = await db.update(oxygenCylinders)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(oxygenCylinders.id, id))
      .returning();
    return result[0];
  }

  async deleteOxygenCylinder(id: string): Promise<boolean> {
    const result = await db.delete(oxygenCylinders).where(eq(oxygenCylinders.id, id)).returning();
    return result.length > 0;
  }

  // ========== CYLINDER MOVEMENT METHODS ==========
  async getCylinderMovements(): Promise<CylinderMovement[]> {
    return await db.select().from(cylinderMovements).orderBy(desc(cylinderMovements.movementDate));
  }

  async getCylinderMovementsByCylinder(cylinderId: string): Promise<CylinderMovement[]> {
    return await db.select().from(cylinderMovements)
      .where(eq(cylinderMovements.cylinderId, cylinderId))
      .orderBy(desc(cylinderMovements.movementDate));
  }

  async createCylinderMovement(movement: InsertCylinderMovement): Promise<CylinderMovement> {
    const result = await db.insert(cylinderMovements).values(movement).returning();
    return result[0];
  }

  // ========== OXYGEN CONSUMPTION METHODS ==========
  async getOxygenConsumptionRecords(): Promise<OxygenConsumption[]> {
    return await db.select().from(oxygenConsumption).orderBy(desc(oxygenConsumption.createdAt));
  }

  async getOxygenConsumptionByPatient(patientId: string): Promise<OxygenConsumption[]> {
    return await db.select().from(oxygenConsumption)
      .where(eq(oxygenConsumption.patientId, patientId))
      .orderBy(desc(oxygenConsumption.createdAt));
  }

  async getOxygenConsumptionByDepartment(department: string): Promise<OxygenConsumption[]> {
    return await db.select().from(oxygenConsumption)
      .where(eq(oxygenConsumption.department, department))
      .orderBy(desc(oxygenConsumption.createdAt));
  }

  async createOxygenConsumption(consumption: InsertOxygenConsumption): Promise<OxygenConsumption> {
    const result = await db.insert(oxygenConsumption).values(consumption).returning();
    return result[0];
  }

  async updateOxygenConsumption(id: string, updates: Partial<InsertOxygenConsumption>): Promise<OxygenConsumption | undefined> {
    const result = await db.update(oxygenConsumption)
      .set(updates)
      .where(eq(oxygenConsumption.id, id))
      .returning();
    return result[0];
  }

  // ========== LMO READING METHODS ==========
  async getLmoReadings(): Promise<LmoReading[]> {
    return await db.select().from(lmoReadings).orderBy(desc(lmoReadings.createdAt));
  }

  async getLmoReadingsByDate(date: string): Promise<LmoReading[]> {
    return await db.select().from(lmoReadings)
      .where(eq(lmoReadings.readingDate, date))
      .orderBy(desc(lmoReadings.createdAt));
  }

  async createLmoReading(reading: InsertLmoReading): Promise<LmoReading> {
    const result = await db.insert(lmoReadings).values(reading).returning();
    return result[0];
  }

  // ========== OXYGEN ALERTS METHODS ==========
  async getOxygenAlerts(): Promise<OxygenAlert[]> {
    return await db.select().from(oxygenAlerts).orderBy(desc(oxygenAlerts.createdAt));
  }

  async getActiveOxygenAlerts(): Promise<OxygenAlert[]> {
    return await db.select().from(oxygenAlerts)
      .where(eq(oxygenAlerts.isResolved, false))
      .orderBy(desc(oxygenAlerts.createdAt));
  }

  async createOxygenAlert(alert: InsertOxygenAlert): Promise<OxygenAlert> {
    const result = await db.insert(oxygenAlerts).values(alert).returning();
    return result[0];
  }

  async resolveOxygenAlert(id: string, resolvedBy: string): Promise<OxygenAlert | undefined> {
    const result = await db.update(oxygenAlerts)
      .set({ isResolved: true, resolvedBy, resolvedAt: new Date() })
      .where(eq(oxygenAlerts.id, id))
      .returning();
    return result[0];
  }

  // ========== BIOMEDICAL WASTE MANAGEMENT (BMW) METHODS ==========

  async getBmwBags(filters?: { status?: string; category?: string; department?: string }): Promise<BmwBag[]> {
    let query = db.select().from(bmwBags).orderBy(desc(bmwBags.createdAt));
    
    if (filters?.status) {
      query = query.where(eq(bmwBags.status, filters.status)) as any;
    }
    if (filters?.category) {
      query = query.where(eq(bmwBags.category, filters.category)) as any;
    }
    if (filters?.department) {
      query = query.where(eq(bmwBags.department, filters.department)) as any;
    }
    
    return await query;
  }

  async getBmwBag(id: string): Promise<BmwBag | undefined> {
    const result = await db.select().from(bmwBags).where(eq(bmwBags.id, id));
    return result[0];
  }

  async createBmwBag(bag: InsertBmwBag): Promise<BmwBag> {
    const result = await db.insert(bmwBags).values(bag).returning();
    return result[0];
  }

  async updateBmwBag(id: string, updates: Partial<InsertBmwBag>): Promise<BmwBag | undefined> {
    const result = await db.update(bmwBags)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bmwBags.id, id))
      .returning();
    return result[0];
  }

  async getBmwStats(): Promise<{
    totalBags: number;
    pendingPickup: number;
    disposedToday: number;
    totalWeightKg: number;
    yellowBags: number;
    redBags: number;
    whiteBags: number;
    blueBags: number;
    storageAlerts: number;
  }> {
    const allBags = await db.select().from(bmwBags);
    const today = new Date().toISOString().split('T')[0];
    
    const pendingBags = allBags.filter(b => b.status !== "DISPOSED");
    const disposedToday = allBags.filter(b => 
      b.status === "DISPOSED" && 
      b.disposedAt && 
      new Date(b.disposedAt).toISOString().split('T')[0] === today
    );
    
    // Check for storage alerts (bags in storage past 48 hours)
    const now = new Date();
    const storageAlerts = allBags.filter(b => 
      b.status === "STORED" && 
      b.storageDeadline && 
      new Date(b.storageDeadline) < now
    ).length;
    
    return {
      totalBags: allBags.length,
      pendingPickup: pendingBags.length,
      disposedToday: disposedToday.length,
      totalWeightKg: allBags.reduce((sum, b) => sum + parseFloat(b.approxWeight || "0"), 0),
      yellowBags: allBags.filter(b => b.category === "YELLOW").length,
      redBags: allBags.filter(b => b.category === "RED").length,
      whiteBags: allBags.filter(b => b.category === "WHITE").length,
      blueBags: allBags.filter(b => b.category === "BLUE").length,
      storageAlerts
    };
  }

  async getBmwMovements(bagId?: string): Promise<BmwMovement[]> {
    if (bagId) {
      return await db.select().from(bmwMovements)
        .where(eq(bmwMovements.bagId, bagId))
        .orderBy(desc(bmwMovements.timestamp));
    }
    return await db.select().from(bmwMovements).orderBy(desc(bmwMovements.timestamp));
  }

  async createBmwMovement(movement: InsertBmwMovement): Promise<BmwMovement> {
    const result = await db.insert(bmwMovements).values(movement).returning();
    return result[0];
  }

  async getBmwStorageRooms(): Promise<BmwStorageRoom[]> {
    return await db.select().from(bmwStorageRooms).orderBy(bmwStorageRooms.name);
  }

  async createBmwStorageRoom(room: InsertBmwStorageRoom): Promise<BmwStorageRoom> {
    const result = await db.insert(bmwStorageRooms).values(room).returning();
    return result[0];
  }

  async updateBmwStorageRoom(id: string, updates: Partial<InsertBmwStorageRoom>): Promise<BmwStorageRoom | undefined> {
    const result = await db.update(bmwStorageRooms)
      .set(updates)
      .where(eq(bmwStorageRooms.id, id))
      .returning();
    return result[0];
  }

  async getBmwVendors(): Promise<BmwVendor[]> {
    return await db.select().from(bmwVendors).orderBy(bmwVendors.name);
  }

  async createBmwVendor(vendor: InsertBmwVendor): Promise<BmwVendor> {
    const result = await db.insert(bmwVendors).values(vendor).returning();
    return result[0];
  }

  async updateBmwVendor(id: string, updates: Partial<InsertBmwVendor>): Promise<BmwVendor | undefined> {
    const result = await db.update(bmwVendors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bmwVendors.id, id))
      .returning();
    return result[0];
  }

  async getBmwPickups(): Promise<BmwPickup[]> {
    return await db.select().from(bmwPickups).orderBy(desc(bmwPickups.createdAt));
  }

  async createBmwPickup(pickup: InsertBmwPickup): Promise<BmwPickup> {
    const result = await db.insert(bmwPickups).values(pickup).returning();
    return result[0];
  }

  async updateBmwPickup(id: string, updates: Partial<InsertBmwPickup>): Promise<BmwPickup | undefined> {
    const result = await db.update(bmwPickups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bmwPickups.id, id))
      .returning();
    return result[0];
  }

  async getBmwDisposals(): Promise<BmwDisposal[]> {
    return await db.select().from(bmwDisposals).orderBy(desc(bmwDisposals.createdAt));
  }

  async createBmwDisposal(disposal: InsertBmwDisposal): Promise<BmwDisposal> {
    const result = await db.insert(bmwDisposals).values(disposal).returning();
    return result[0];
  }

  async getBmwIncidents(): Promise<BmwIncident[]> {
    return await db.select().from(bmwIncidents).orderBy(desc(bmwIncidents.reportedAt));
  }

  async createBmwIncident(incident: InsertBmwIncident): Promise<BmwIncident> {
    const result = await db.insert(bmwIncidents).values(incident).returning();
    return result[0];
  }

  async updateBmwIncident(id: string, updates: Partial<InsertBmwIncident>): Promise<BmwIncident | undefined> {
    const result = await db.update(bmwIncidents)
      .set(updates)
      .where(eq(bmwIncidents.id, id))
      .returning();
    return result[0];
  }

  async getBmwReports(): Promise<BmwReport[]> {
    return await db.select().from(bmwReports).orderBy(desc(bmwReports.createdAt));
  }

  async createBmwReport(report: InsertBmwReport): Promise<BmwReport> {
    const result = await db.insert(bmwReports).values(report).returning();
    return result[0];
  }

  async seedBmwData(): Promise<void> {
    const existingBags = await db.select().from(bmwBags);
    if (existingBags.length > 0) {
      console.log("BMW data already exists, skipping seed...");
      return;
    }

    console.log("Seeding BMW demo data...");
    const now = new Date();

    const vendorData = [
      {
        vendorId: "VND-001",
        name: "BioCare Solutions",
        companyName: "BioCare Solutions Pvt. Ltd.",
        contactPerson: "Rajesh Sharma",
        phone: "+91 9876543210",
        email: "rajesh@biocaresolutions.in",
        address: "Plot No. 45, MIDC Industrial Area, Pune, Maharashtra 411018",
        licenseNumber: "MH/BMW/2024/0123",
        licenseExpiry: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        vehicleNumbers: "MH-12-AB-1234,MH-12-AB-5678",
        isActive: true
      },
      {
        vendorId: "VND-002",
        name: "GreenCycle Waste",
        companyName: "GreenCycle Waste Management Pvt. Ltd.",
        contactPerson: "Priya Patel",
        phone: "+91 9876543211",
        email: "priya@greencyclewaste.com",
        address: "Unit 12, Industrial Estate, Pimpri, Maharashtra 411035",
        licenseNumber: "MH/BMW/2024/0456",
        licenseExpiry: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        vehicleNumbers: "MH-14-CD-5678",
        isActive: true
      }
    ];

    const createdVendors = [];
    for (const vendor of vendorData) {
      const result = await db.insert(bmwVendors).values(vendor).returning();
      createdVendors.push(result[0]);
    }

    const storageRoomData = [
      {
        name: "BMW Storage Room A",
        location: "Ground Floor, West Wing",
        capacity: 50,
        currentOccupancy: 12,
        temperature: "25",
        lastCleanedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        cleanedBy: "Housekeeping Staff",
        notes: "Yellow and Red category storage",
        isActive: true
      },
      {
        name: "BMW Storage Room B",
        location: "Basement, East Wing",
        capacity: 30,
        currentOccupancy: 28,
        temperature: "22",
        lastCleanedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        cleanedBy: "Housekeeping Staff",
        notes: "White and Blue category storage",
        isActive: true
      }
    ];

    const createdRooms = [];
    for (const room of storageRoomData) {
      const result = await db.insert(bmwStorageRooms).values(room).returning();
      createdRooms.push(result[0]);
    }

    const departments = ["Emergency", "ICU", "Surgery", "Laboratory", "Radiology", "Pharmacy", "OPD"];
    const categories: Array<"YELLOW" | "RED" | "WHITE" | "BLUE"> = ["YELLOW", "RED", "WHITE", "BLUE"];
    const statuses: Array<"GENERATED" | "COLLECTED" | "STORED" | "PICKED_UP" | "DISPOSED"> = ["GENERATED", "COLLECTED", "STORED", "PICKED_UP", "DISPOSED"];

    const bagData = [];
    for (let i = 0; i < 20; i++) {
      const category = categories[i % 4];
      const status = statuses[Math.min(i % 5, 4)];
      const daysAgo = Math.floor(i / 4);
      const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const storageDeadline = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000);
      
      bagData.push({
        barcode: `BMW-${Date.now().toString(36).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
        category,
        department: departments[i % departments.length],
        approxWeight: String((Math.random() * 5 + 0.5).toFixed(2)),
        status,
        generatedBy: "Admin User",
        generatedByRole: "ADMIN",
        storageDeadline,
        storageRoomId: status === "STORED" || status === "PICKED_UP" || status === "DISPOSED" 
          ? createdRooms[category === "YELLOW" || category === "RED" ? 0 : 1].id 
          : null,
        disposedAt: status === "DISPOSED" ? new Date(now.getTime() - (daysAgo - 1) * 24 * 60 * 60 * 1000) : null,
        notes: `Sample ${category} category waste from ${departments[i % departments.length]}`,
        createdAt,
        updatedAt: createdAt
      });
    }

    const createdBags = [];
    for (const bag of bagData) {
      const result = await db.insert(bmwBags).values(bag).returning();
      createdBags.push(result[0]);
    }

    for (const bag of createdBags) {
      await db.insert(bmwMovements).values({
        bagId: bag.id,
        action: "CREATED",
        performedBy: "Admin User",
        performedByRole: "ADMIN",
        location: bag.department,
        weight: bag.approxWeight,
        notes: "Bag generated",
        timestamp: bag.createdAt
      });

      if (bag.status !== "GENERATED") {
        await db.insert(bmwMovements).values({
          bagId: bag.id,
          action: "MOVED_TO_STORAGE",
          performedBy: "Nurse Staff",
          performedByRole: "NURSE",
          location: "Storage Room",
          weight: bag.approxWeight,
          notes: "Moved to storage",
          timestamp: new Date(new Date(bag.createdAt!).getTime() + 2 * 60 * 60 * 1000)
        });
      }

      if (bag.status === "PICKED_UP" || bag.status === "DISPOSED") {
        await db.insert(bmwMovements).values({
          bagId: bag.id,
          action: "PICKED_UP",
          performedBy: "BioCare Driver",
          performedByRole: "VENDOR",
          location: "Loading Dock",
          weight: bag.approxWeight,
          notes: "Picked up by vendor",
          timestamp: new Date(new Date(bag.createdAt!).getTime() + 24 * 60 * 60 * 1000)
        });
      }

      if (bag.status === "DISPOSED") {
        await db.insert(bmwMovements).values({
          bagId: bag.id,
          action: "DISPOSED",
          performedBy: "BioCare Facility",
          performedByRole: "VENDOR",
          location: "Disposal Facility",
          weight: bag.approxWeight,
          notes: "Disposed via incineration",
          timestamp: bag.disposedAt!
        });
      }
    }

    const pickupData = [
      {
        pickupId: "PU-20241210-001",
        vendorId: createdVendors[0].id,
        scheduledDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        actualDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        status: "COMPLETED" as const,
        driverName: "Suresh Kumar",
        vehicleNumber: "MH-12-AB-1234",
        bagIds: createdBags.filter(b => b.status === "DISPOSED").slice(0, 3).map(b => b.id),
        totalBags: 3,
        totalWeight: "8.5",
        notes: "Regular pickup completed successfully",
        handoverSignature: "Verified by Admin"
      },
      {
        pickupId: "PU-20241211-001",
        vendorId: createdVendors[1].id,
        scheduledDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        status: "SCHEDULED" as const,
        driverName: "Ramesh Patil",
        vehicleNumber: "MH-14-CD-5678",
        bagIds: createdBags.filter(b => b.status === "STORED").slice(0, 5).map(b => b.id),
        totalBags: 5,
        totalWeight: "12.3",
        notes: "Scheduled for tomorrow morning"
      }
    ];

    const createdPickups = [];
    for (const pickup of pickupData) {
      const result = await db.insert(bmwPickups).values(pickup).returning();
      createdPickups.push(result[0]);
    }

    const disposalData = [
      {
        pickupId: createdPickups[0].id,
        bagId: createdBags.find(b => b.status === "DISPOSED")?.id || createdBags[0].id,
        disposalMethod: "INCINERATION" as const,
        disposalDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        certificateNumber: "CERT-2024-BMW-001",
        verifiedBy: "BioCare Facility Manager",
        notes: "High temperature incineration at 1100°C"
      },
      {
        pickupId: createdPickups[0].id,
        bagId: createdBags.filter(b => b.status === "DISPOSED")[1]?.id || createdBags[1].id,
        disposalMethod: "AUTOCLAVING" as const,
        disposalDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        certificateNumber: "CERT-2024-BMW-002",
        verifiedBy: "BioCare Facility Manager",
        notes: "Steam sterilization followed by shredding"
      }
    ];

    for (const disposal of disposalData) {
      await db.insert(bmwDisposals).values(disposal);
    }

    const incidentData = [
      {
        incidentType: "SPILL",
        severity: "MODERATE",
        department: "ICU",
        bagId: createdBags[5]?.id,
        location: "Corridor B, Ground Floor",
        description: "Minor spillage during bag transport. Contained and cleaned immediately.",
        reportedBy: "Nurse Sharma",
        reportedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        actionTaken: "Area sanitized with hospital-grade disinfectant. Staff provided with PPE guidelines refresher.",
        resolvedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        resolvedBy: "Infection Control Officer",
        status: "RESOLVED"
      }
    ];

    for (const incident of incidentData) {
      await db.insert(bmwIncidents).values(incident);
    }

    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const reportData = [
      {
        reportType: "MONTHLY" as const,
        reportPeriodStart: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
        reportPeriodEnd: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0),
        totalBagsGenerated: 156,
        totalWeightKg: "234.5",
        categoryBreakdown: {
          YELLOW: { bags: 45, weight: 67.2 },
          RED: { bags: 38, weight: 52.1 },
          WHITE: { bags: 42, weight: 71.5 },
          BLUE: { bags: 31, weight: 43.7 }
        },
        complianceStatus: "COMPLIANT" as const,
        notes: "All waste disposed within 48-hour limit. No incidents reported.",
        generatedBy: "Admin User",
        submittedToAuthority: true,
        submissionDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000)
      },
      {
        reportType: "DAILY" as const,
        reportPeriodStart: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        reportPeriodEnd: now,
        totalBagsGenerated: 8,
        totalWeightKg: "12.3",
        categoryBreakdown: {
          YELLOW: { bags: 2, weight: 3.1 },
          RED: { bags: 2, weight: 2.8 },
          WHITE: { bags: 2, weight: 3.5 },
          BLUE: { bags: 2, weight: 2.9 }
        },
        complianceStatus: "COMPLIANT" as const,
        notes: "Daily summary - all operations normal",
        generatedBy: "System"
      }
    ];

    for (const report of reportData) {
      await db.insert(bmwReports).values(report);
    }

    console.log("BMW demo data seeded successfully!");
  }

  // ========== DOCTOR VISIT METHODS ==========
  async getDoctorVisitsByPatient(patientId: string): Promise<DoctorVisit[]> {
    return await db.select().from(doctorVisits)
      .where(eq(doctorVisits.patientId, patientId))
      .orderBy(desc(doctorVisits.createdAt));
  }

  async createDoctorVisit(visit: InsertDoctorVisit): Promise<DoctorVisit> {
    const result = await db.insert(doctorVisits).values(visit).returning();
    return result[0];
  }

  // ========== DOCTOR OATH CONFIRMATION METHODS ==========
  async getDoctorOathConfirmation(doctorId: string, date: string): Promise<DoctorOathConfirmation | undefined> {
    const result = await db.select().from(doctorOathConfirmations)
      .where(and(
        eq(doctorOathConfirmations.doctorId, doctorId),
        eq(doctorOathConfirmations.date, date)
      ));
    return result[0];
  }

  async createDoctorOathConfirmation(confirmation: InsertDoctorOathConfirmation): Promise<DoctorOathConfirmation> {
    const result = await db.insert(doctorOathConfirmations).values(confirmation).returning();
    return result[0];
  }

  // ========== CONSENT TEMPLATES METHODS ==========
  async getAllConsentTemplates(): Promise<ConsentTemplate[]> {
    return await db.select().from(consentTemplates).where(eq(consentTemplates.isActive, true)).orderBy(consentTemplates.category, consentTemplates.title);
  }

  async getConsentTemplate(id: string): Promise<ConsentTemplate | undefined> {
    const result = await db.select().from(consentTemplates).where(eq(consentTemplates.id, id));
    return result[0];
  }

  async getConsentTemplatesByType(consentType: string): Promise<ConsentTemplate[]> {
    return await db.select().from(consentTemplates)
      .where(and(eq(consentTemplates.consentType, consentType), eq(consentTemplates.isActive, true)))
      .orderBy(consentTemplates.title);
  }

  async getConsentTemplatesByCategory(category: string): Promise<ConsentTemplate[]> {
    return await db.select().from(consentTemplates)
      .where(and(eq(consentTemplates.category, category), eq(consentTemplates.isActive, true)))
      .orderBy(consentTemplates.title);
  }

  async createConsentTemplate(template: InsertConsentTemplate): Promise<ConsentTemplate> {
    const result = await db.insert(consentTemplates).values(template).returning();
    return result[0];
  }

  async updateConsentTemplate(id: string, updates: Partial<InsertConsentTemplate>): Promise<ConsentTemplate | undefined> {
    const result = await db.update(consentTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(consentTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteConsentTemplate(id: string): Promise<boolean> {
    const result = await db.delete(consentTemplates).where(eq(consentTemplates.id, id)).returning();
    return result.length > 0;
  }

  // Seed consent templates with PDF files
  async seedConsentTemplates(): Promise<void> {
    const existing = await db.select().from(consentTemplates);
    if (existing.length > 0) {
      console.log("Consent templates already exist, skipping seed...");
      return;
    }

    const templates: InsertConsentTemplate[] = [
      {
        title: "Medico-Legal Register (Digital Consent Form)",
        consentType: "MEDICO_LEGAL",
        description: "Digital medico-legal form for documenting patient injuries, police information, and medical officer attestation. Must be preserved forever as per legal requirements.",
        category: "Legal",
        pdfPath: "/consents/Digital_Medico_Legal_Form_1765472182868.pdf",
        version: "1.0",
        isActive: true,
        isBilingual: false,
        languages: "English"
      },
      {
        title: "Operation Theatre Register",
        consentType: "OPERATION_THEATRE",
        description: "Digital form for recording surgical procedures, operation team details, materials used, anaesthesia information, and post-operative notes.",
        category: "Surgical",
        pdfPath: "/consents/Operation_Theatre_Register_1765472182869.pdf",
        version: "1.0",
        isActive: true,
        isBilingual: false,
        languages: "English"
      },
      {
        title: "Icon Hospital Consent Form (Multiple)",
        consentType: "LOW_PROGNOSIS",
        description: "Comprehensive consent form including: Low General Condition/Poor Prognosis, Emergency Procedure, Patient Shifting, Valuables Declaration, Treatment Denial, and DNR consents.",
        category: "General",
        pdfPath: "/consents/Icon_Hospital_Consent_Form_1765472182869.pdf",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Marathi"
      },
      {
        title: "HIV Test Informed Consent",
        consentType: "HIV_TEST",
        description: "Consent form for HIV blood test with information about test results confidentiality, insurance coverage, and patient acknowledgment.",
        category: "Diagnostic",
        pdfPath: "/consents/Hiv_Consent_Form_1765472182870.pdf",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Marathi"
      },
      {
        title: "HBsAg Test Informed Consent",
        consentType: "HBSAG_TEST",
        description: "Consent form for Hepatitis B (HBsAg) blood test with information about test results confidentiality, insurance coverage, and patient acknowledgment.",
        category: "Diagnostic",
        pdfPath: "/consents/Hbsag_Consent_Form_1765472182870.pdf",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Marathi"
      },
      {
        title: "Informed Consent for Anaesthesia",
        consentType: "ANAESTHESIA",
        description: "Consent form explaining types of anaesthesia, associated risks and complications including rare possibilities of allergic reactions, dental injury, and other complications.",
        category: "Surgical",
        pdfPath: "/consents/Anaesthesia_Consent_Form_1765472182871.pdf",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Marathi"
      },
      {
        title: "Consent for Surgery/Operative Procedure",
        consentType: "SURGERY",
        description: "Authorization for surgical/operative procedures including anaesthesia, with acknowledgment of risks, possible complications, and consent for photography/videography for medical purposes.",
        category: "Surgical",
        pdfPath: "/consents/Surgery_Consent_Form_1765472182872.pdf",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Marathi"
      },
      {
        title: "Tubal Ligation Consent Form",
        consentType: "TUBAL_LIGATION",
        description: "Comprehensive consent form for tubal ligation procedure including patient declarations, eligibility criteria, anaesthesia consent, and follow-up requirements.",
        category: "Surgical",
        pdfPath: "/consents/Tubal_Ligation_Consent_Form_1765472182872.pdf",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Marathi"
      },
      {
        title: "Consent for Blood/Blood Component Transfusion",
        consentType: "BLOOD_TRANSFUSION",
        description: "Consent form for blood or blood product transfusion explaining risks associated with refusal including organ damage, heart attack, stroke, and other complications.",
        category: "Treatment",
        pdfPath: "/consents/Blood_Transfusion_Consent_Form_1765472182873.pdf",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Marathi"
      },
      {
        title: "Discharge Against Medical Advice (DAMA/LAMA)",
        consentType: "DAMA",
        description: "Consent form for patients or relatives choosing to discharge against medical advice, acknowledging risks and releasing hospital from liability.",
        category: "Discharge",
        pdfPath: "/consents/Discharge_Against_Medical_Advice_Form_1765472182873.pdf",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Marathi"
      }
    ];

    await db.insert(consentTemplates).values(templates);
    console.log("Consent templates seeded successfully with 10 forms");
  }

  // ========== RESOLVED ALERTS METHODS ==========
  async getResolvedAlerts(): Promise<ResolvedAlert[]> {
    return await db.select().from(resolvedAlerts).orderBy(desc(resolvedAlerts.resolvedAt));
  }

  async createResolvedAlert(alert: InsertResolvedAlert): Promise<ResolvedAlert> {
    const result = await db.insert(resolvedAlerts).values(alert).returning();
    return result[0];
  }

  async deleteResolvedAlert(id: string): Promise<boolean> {
    const result = await db.delete(resolvedAlerts).where(eq(resolvedAlerts.id, id)).returning();
    return result.length > 0;
  }
}

export const databaseStorage = new DatabaseStorage();
