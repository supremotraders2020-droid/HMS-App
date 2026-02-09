import { db } from "./db";
import { eq, desc, and, lt, sql, or } from "drizzle-orm";
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
  prescriptions, prescriptionItems, doctorSchedules, doctorPatients, doctorProfiles, patientProfiles, userNotifications, consentForms,
  patientConsents, medicines, oxygenCylinders, cylinderMovements, oxygenConsumption, lmoReadings, oxygenAlerts,
  bmwBags, bmwMovements, bmwPickups, bmwDisposals, bmwVendors, bmwStorageRooms, bmwIncidents, bmwReports,
  doctorOathConfirmations, consentTemplates, resolvedAlerts, doctorTimeSlots,
  patientBills, billPayments, healthTips,
  swabAreaMaster, swabSamplingSiteMaster, swabOrganismMaster, swabCollection, swabLabResults, swabCapaActions, swabAuditLogs,
  diseaseCatalog, dietTemplates, medicationScheduleTemplates, patientDiseaseAssignments, personalizedCarePlans,
  medicalStores, medicalStoreUsers, medicalStoreInventory, prescriptionDispensing, dispensingItems, medicalStoreAccessLogs, medicalStoreBills,
  pathologyLabs, labTestCatalog, labTestOrders, sampleCollections, labReports, labReportResults, pathologyLabAccessLogs,
  staffMaster, shiftRoster, taskLogs, attendanceLogs, leaveRequests, overtimeLogs, staffPerformanceMetrics, rosterAuditLogs,
  insuranceProviders, patientInsurance, insuranceClaims, insuranceClaimDocuments, insuranceClaimLogs, insuranceProviderChecklists,
  opdPrescriptionTemplates, opdTemplateVersions, nurseDepartmentPreferences, departmentNurseAssignments,
  diagnosticTestOrders, technicianReports,
  otCases, otCaseTeam, otPreopCounselling, otPreopChecklist, otPreanaestheticEval,
  otSafetyChecklist, otPreopAssessment, otReEvaluation, otConsentSurgery, otConsentAnaesthesia,
  otAnaesthesiaRecord, otTimeLog, otSurgeonNotes, otPostopAssessment, otMonitoringChart,
  otLabourChart, otNeonateSheet, otAuditLog, bedCategories,
  type OtCase, type InsertOtCase, type OtCaseTeam, type InsertOtCaseTeam,
  type OtPreopCounselling, type InsertOtPreopCounselling, type OtPreopChecklist, type InsertOtPreopChecklist,
  type OtPreanaestheticEval, type InsertOtPreanaestheticEval, type OtSafetyChecklist, type InsertOtSafetyChecklist,
  type OtPreopAssessment, type InsertOtPreopAssessment, type OtReEvaluation, type InsertOtReEvaluation,
  type OtConsentSurgery, type InsertOtConsentSurgery, type OtConsentAnaesthesia, type InsertOtConsentAnaesthesia,
  type OtAnaesthesiaRecord, type InsertOtAnaesthesiaRecord, type OtTimeLog, type InsertOtTimeLog,
  type OtSurgeonNotes, type InsertOtSurgeonNotes, type OtPostopAssessment, type InsertOtPostopAssessment,
  type OtMonitoringChart, type InsertOtMonitoringChart, type OtLabourChart, type InsertOtLabourChart,
  type OtNeonateSheet, type InsertOtNeonateSheet, type OtAuditLog, type InsertOtAuditLog,
  type OpdPrescriptionTemplate, type InsertOpdPrescriptionTemplate,
  type NurseDepartmentPreferences, type InsertNurseDepartmentPreferences,
  type OpdTemplateVersion, type InsertOpdTemplateVersion,
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
  type DoctorTimeSlot, type InsertDoctorTimeSlot,
  type PatientBill, type InsertPatientBill,
  type BillPayment, type InsertBillPayment,
  type HealthTip, type InsertHealthTip,
  type SwabAreaMaster, type InsertSwabAreaMaster,
  type SwabSamplingSiteMaster, type InsertSwabSamplingSiteMaster,
  type SwabOrganismMaster, type InsertSwabOrganismMaster,
  type SwabCollection, type InsertSwabCollection,
  type SwabLabResult, type InsertSwabLabResult,
  type SwabCapaAction, type InsertSwabCapaAction,
  type SwabAuditLog, type InsertSwabAuditLog,
  type DiseaseCatalog, type InsertDiseaseCatalog,
  type DietTemplate, type InsertDietTemplate,
  type MedicationScheduleTemplate, type InsertMedicationScheduleTemplate,
  type PatientDiseaseAssignment, type InsertPatientDiseaseAssignment,
  type PersonalizedCarePlan, type InsertPersonalizedCarePlan,
  type MedicalStore, type InsertMedicalStore,
  type MedicalStoreUser, type InsertMedicalStoreUser,
  type MedicalStoreInventory, type InsertMedicalStoreInventory,
  type PrescriptionDispensing, type InsertPrescriptionDispensing,
  type DispensingItem, type InsertDispensingItem,
  type MedicalStoreAccessLog, type InsertMedicalStoreAccessLog,
  type MedicalStoreBill, type InsertMedicalStoreBill,
  type PathologyLab, type InsertPathologyLab,
  type LabTestCatalog, type InsertLabTestCatalog,
  type LabTestOrder, type InsertLabTestOrder,
  type SampleCollection, type InsertSampleCollection,
  type LabReport, type InsertLabReport,
  type LabReportResult, type InsertLabReportResult,
  type PathologyLabAccessLog, type InsertPathologyLabAccessLog,
  type StaffMaster, type InsertStaffMaster,
  type ShiftRoster, type InsertShiftRoster,
  type TaskLog, type InsertTaskLog,
  type AttendanceLog, type InsertAttendanceLog,
  type LeaveRequest, type InsertLeaveRequest,
  type OvertimeLog, type InsertOvertimeLog,
  type StaffPerformanceMetric, type InsertStaffPerformanceMetric,
  type RosterAuditLog, type InsertRosterAuditLog,
  type InsuranceProvider, type InsertInsuranceProvider,
  type PatientInsurance, type InsertPatientInsurance,
  type InsuranceClaim, type InsertInsuranceClaim,
  type InsuranceClaimDocument, type InsertInsuranceClaimDocument,
  type InsuranceClaimLog, type InsertInsuranceClaimLog,
  type InsuranceProviderChecklist, type InsertInsuranceProviderChecklist,
  faceEmbeddings, biometricConsent, faceRecognitionLogs, faceAttendance, faceRecognitionSettings, duplicatePatientAlerts,
  referralSources, patientReferrals,
  hospitalServiceDepartments, hospitalServices,
  beds, type Bed, type InsertBed,
  type FaceEmbedding, type InsertFaceEmbedding,
  type BiometricConsent, type InsertBiometricConsent,
  type FaceRecognitionLog, type InsertFaceRecognitionLog,
  type FaceAttendance, type InsertFaceAttendance,
  type FaceRecognitionSetting, type InsertFaceRecognitionSetting,
  type DuplicatePatientAlert, type InsertDuplicatePatientAlert,
  type ReferralSource, type InsertReferralSource,
  type PatientReferral, type InsertPatientReferral,
  type HospitalServiceDepartment, type InsertHospitalServiceDepartment,
  type HospitalService, type InsertHospitalService,
  icuCharts, icuVitalCharts, icuHemodynamicMonitoring, icuSedationMonitoring,
  icuVentilatorSettings, icuAbgReports, icuAirwayCare, icuDailyInvestigations,
  icuDiabeticChart, icuPlayOfDay, icuCuffPressure, icuEttTracheostomy,
  icuDuration, icuFluidBalanceTarget, icuIntakeChart, icuOutputChart,
  icuMedicationOrders, icuNursingRemarks, icuNursingDuty, icuFluidOrders,
  icuNutritionChart, icuBodyMarking, icuNurseDiary, icuOnceOnlyDrugs,
  icuPreviousDayNotes, icuAllergyPrecautions, icuDoctorNurseNotes,
  type IcuCharts, type InsertIcuCharts,
  type IcuVitalCharts, type InsertIcuVitalCharts,
  type IcuHemodynamicMonitoring, type InsertIcuHemodynamicMonitoring,
  type IcuSedationMonitoring, type InsertIcuSedationMonitoring,
  type IcuVentilatorSettings, type InsertIcuVentilatorSettings,
  type IcuAbgReports, type InsertIcuAbgReports,
  type IcuAirwayCare, type InsertIcuAirwayCare,
  type IcuDailyInvestigations, type InsertIcuDailyInvestigations,
  type IcuDiabeticChart, type InsertIcuDiabeticChart,
  type IcuPlayOfDay, type InsertIcuPlayOfDay,
  type IcuCuffPressure, type InsertIcuCuffPressure,
  type IcuEttTracheostomy, type InsertIcuEttTracheostomy,
  type IcuDuration, type InsertIcuDuration,
  type IcuFluidBalanceTarget, type InsertIcuFluidBalanceTarget,
  type IcuIntakeChart, type InsertIcuIntakeChart,
  type IcuOutputChart, type InsertIcuOutputChart,
  type IcuMedicationOrders, type InsertIcuMedicationOrders,
  type IcuNursingRemarks, type InsertIcuNursingRemarks,
  type IcuNursingDuty, type InsertIcuNursingDuty,
  type IcuFluidOrders, type InsertIcuFluidOrders,
  type IcuNutritionChart, type InsertIcuNutritionChart,
  type IcuBodyMarking, type InsertIcuBodyMarking,
  type IcuNurseDiary, type InsertIcuNurseDiary,
  type IcuOnceOnlyDrugs, type InsertIcuOnceOnlyDrugs,
  type IcuPreviousDayNotes, type InsertIcuPreviousDayNotes,
  type IcuAllergyPrecautions, type InsertIcuAllergyPrecautions
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

  async getUsersByRole(role: string): Promise<User[]> {
    const result = await db.select().from(users).where(eq(users.role, role));
    return result;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserByName(name: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.name, name));
    return result[0];
  }

  async getStaffMembers(): Promise<StaffMember[]> {
    return await db.select().from(staffMembers);
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async updateUserStatus(id: string, status: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateUserLastLogin(id: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ lastLogin: new Date(), updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
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

  async updateTrackingPatient(id: string, updates: Partial<TrackingPatient>): Promise<TrackingPatient | undefined> {
    const result = await db.update(trackingPatients)
      .set(updates)
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

  async getMedicalRecordsByDoctor(doctorId: string): Promise<MedicalRecord[]> {
    return await db.select().from(medicalRecords)
      .where(eq(medicalRecords.doctorId, doctorId))
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

  async getTeamMemberByEmail(email: string): Promise<HospitalTeamMember | undefined> {
    const result = await db.select().from(hospitalTeamMembers).where(eq(hospitalTeamMembers.email, email));
    return result[0];
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
  // NOTE: Only superadmin is created automatically. All other staff (doctors, nurses, OPD managers) 
  // must be added by admin through User Management to ensure proper staff_master entries.
  async ensureEssentialAccounts(): Promise<void> {
    const essentialAccounts = [
      { username: "superadmin", password: "SuperAdmin@123", role: "SUPER_ADMIN" as const, name: "Super Administrator", email: "superadmin@gravityhospital.in" },
      { username: "admin", password: "Admin@123", role: "ADMIN" as const, name: "Administrator", email: "admin@gravityhospital.in" },
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
      } else if (account.username === "superadmin" || account.username === "admin") {
        // Always ensure superadmin and admin have the known password
        const hashedPassword = await bcrypt.hash(account.password, SALT_ROUNDS);
        await db.update(users).set({ password: hashedPassword }).where(eq(users.username, account.username));
        console.log(`Reset password for essential account: ${account.username}`);
      }
    }
  }

  // ========== ENSURE STAFF MASTER ENTRIES ==========
  async ensureStaffMasterEntries(): Promise<void> {
    // Get all doctors/nurses/OPD managers who don't have staff_master entries
    const usersNeedingStaffMaster = await db.execute(sql`
      SELECT u.id, u.username, u.name, u.role, u.email
      FROM users u
      LEFT JOIN staff_master sm ON sm.user_id = u.id
      WHERE u.role IN ('DOCTOR', 'NURSE', 'OPD_MANAGER', 'TECHNICIAN', 'PATHOLOGY_LAB', 'MEDICAL_STORE')
        AND sm.id IS NULL
    `);
    
    for (const user of usersNeedingStaffMaster.rows as any[]) {
      const empCode = `EMP${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(-3).toUpperCase()}`;
      const dept = user.role === 'DOCTOR' ? 'OPD' : 
                   user.role === 'NURSE' ? 'NURSING' : 
                   user.role === 'TECHNICIAN' ? 'DIAGNOSTIC' :
                   user.role === 'PATHOLOGY_LAB' ? 'PATHOLOGY' :
                   user.role === 'MEDICAL_STORE' ? 'PHARMACY' : 'ADMIN';
      
      await db.insert(staffMaster).values({
        id: crypto.randomUUID(),
        userId: user.id,
        employeeCode: empCode,
        fullName: user.name || user.username,
        role: user.role,
        department: dept,
        status: 'ACTIVE',
        email: user.email,
      });
      console.log(`Created staff_master for: ${user.username} (${user.role})`);
    }
  }

  // ========== SEED DATA METHOD ==========
  async seedInitialData(): Promise<void> {
    // Always ensure essential accounts exist (admin, patient)
    await this.ensureEssentialAccounts();
    
    // Ensure all staff have staff_master entries for login
    await this.ensureStaffMasterEntries();
    
    // Check if data already exists
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log("Database already has data, skipping seed...");
      return;
    }

    console.log("Seeding initial data...");

    // All users (admins, doctors, nurses, patients, etc.) must be added by admin through User Management
    // No demo/mock data is seeded - real data must be added by admin
    
    console.log("Initial data seeded successfully (no dummy data)");
    
    // Seed health tips data
    await this.seedHealthTipsData();
  }

  // ========== HEALTH TIPS SEED DATA ==========
  async seedHealthTipsData(): Promise<void> {
    const existingTips = await db.select().from(healthTips).limit(1);
    if (existingTips.length > 0) {
      console.log("Health tips data already exists, skipping seed...");
      return;
    }

    console.log("Seeding health tips data for last 2 days...");

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Set times for 9 AM and 9 PM IST (adding 5:30 hours offset for IST)
    const setTime = (date: Date, hour: number): Date => {
      const d = new Date(date);
      d.setHours(hour, 0, 0, 0);
      return d;
    };

    const sampleHealthTips: InsertHealthTip[] = [
      {
        title: "Winter Morning Wellness",
        content: "Start your winter mornings with warm water and honey. This combination boosts immunity, aids digestion, and keeps you energized throughout the day. Add a pinch of turmeric for extra anti-inflammatory benefits.",
        category: "seasonal",
        weatherContext: "Cold weather, 18°C",
        season: "Winter",
        priority: "medium",
        targetAudience: "all",
        scheduledFor: "9AM",
        isActive: true,
        generatedAt: setTime(twoDaysAgo, 9)
      },
      {
        title: "Evening Diet Tips for Better Sleep",
        content: "Avoid heavy meals 3 hours before bedtime. Include magnesium-rich foods like nuts and seeds in your dinner. A glass of warm milk with a pinch of nutmeg can promote restful sleep.",
        category: "diet",
        weatherContext: "Clear night, 15°C",
        season: "Winter",
        priority: "low",
        targetAudience: "all",
        scheduledFor: "9PM",
        isActive: true,
        generatedAt: setTime(twoDaysAgo, 21)
      },
      {
        title: "Hydration Reminder",
        content: "Even in cold weather, your body needs adequate hydration. Drink at least 8 glasses of water daily. Include warm soups, herbal teas, and fresh fruit juices to maintain optimal hydration levels.",
        category: "general",
        weatherContext: "Partly cloudy, 20°C",
        season: "Winter",
        priority: "high",
        targetAudience: "all",
        scheduledFor: "9AM",
        isActive: true,
        generatedAt: setTime(yesterday, 9)
      },
      {
        title: "Exercise in Winter",
        content: "Don't skip exercise in winter! Indoor yoga, stretching, or a 20-minute walk can boost your metabolism and improve circulation. Exercise releases endorphins that combat winter blues.",
        category: "wellness",
        weatherContext: "Foggy morning, 16°C",
        season: "Winter",
        priority: "medium",
        targetAudience: "all",
        scheduledFor: "9PM",
        isActive: true,
        generatedAt: setTime(yesterday, 21)
      }
    ];

    for (const tip of sampleHealthTips) {
      await db.insert(healthTips).values(tip);
    }

    // Also create user notifications for patients with the health tips
    const patientUsers = await db.select().from(users).where(eq(users.role, "PATIENT"));
    
    for (const tip of sampleHealthTips) {
      for (const patient of patientUsers) {
        await db.insert(userNotifications).values({
          userId: patient.username,
          userRole: "PATIENT",
          title: tip.title,
          message: tip.content,
          type: "health_tip",
          isRead: false,
          createdAt: tip.generatedAt,
          metadata: JSON.stringify({
            category: tip.category,
            weatherContext: tip.weatherContext,
            season: tip.season,
            scheduledFor: tip.scheduledFor
          })
        });
      }
    }

    console.log("Health tips data seeded successfully!");
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

  async seedBedCategories(): Promise<void> {
    const existing = await db.select().from(bedCategories).limit(1);
    if (existing.length > 0) {
      console.log("Bed categories already exist, skipping seed...");
      return;
    }

    console.log("Seeding bed categories...");

    const categories = [
      { id: "cat-daycare", name: "Day-Care", code: "DC", description: "Day-care beds for short procedures", categoryType: "day_care", documentationIntensity: "STANDARD", requiresIcuAdmission: false, requiresPediatricPatient: false, isActive: true },
      { id: "cat-general", name: "General Ward", code: "GEN", description: "Standard general ward beds for routine care", categoryType: "inpatient", documentationIntensity: "STANDARD", requiresIcuAdmission: false, requiresPediatricPatient: false, isActive: true },
      { id: "cat-hdu", name: "HDU", code: "HDU", description: "High Dependency Unit for step-down care", categoryType: "inpatient", documentationIntensity: "STANDARD", requiresIcuAdmission: false, requiresPediatricPatient: false, isActive: true },
      { id: "cat-icu", name: "ICU", code: "ICU", description: "Intensive Care Unit beds with critical monitoring", categoryType: "icu", documentationIntensity: "STANDARD", requiresIcuAdmission: false, requiresPediatricPatient: false, isActive: true },
      { id: "cat-isolation", name: "Isolation", code: "ISO", description: "Isolation rooms for infectious cases", categoryType: "isolation", documentationIntensity: "STANDARD", requiresIcuAdmission: false, requiresPediatricPatient: false, isActive: true },
      { id: "cat-nicu", name: "NICU", code: "NICU", description: "Neonatal Intensive Care Unit", categoryType: "icu", documentationIntensity: "STANDARD", requiresIcuAdmission: false, requiresPediatricPatient: false, isActive: true },
      { id: "cat-private", name: "Private", code: "PVT", description: "Private single-bed rooms", categoryType: "inpatient", documentationIntensity: "STANDARD", requiresIcuAdmission: false, requiresPediatricPatient: false, isActive: true },
      { id: "cat-semi-private", name: "Semi-Private", code: "SP", description: "Semi-private rooms with 2 beds", categoryType: "inpatient", documentationIntensity: "STANDARD", requiresIcuAdmission: false, requiresPediatricPatient: false, isActive: true },
    ];

    for (const cat of categories) {
      await db.insert(bedCategories).values(cat).onConflictDoNothing();
    }

    console.log(`Seeded ${categories.length} bed categories successfully!`);
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

  async seedInventoryItems(): Promise<void> {
    const existing = await db.select().from(inventoryItems).limit(1);
    if (existing.length > 0) {
      console.log("Inventory items already exist, skipping seed...");
      return;
    }

    console.log("Seeding inventory items...");

    const items: InsertInventoryItem[] = [
      { name: "Disposable Gloves (Box of 100)", category: "gloves", currentStock: 500, lowStockThreshold: 50, unit: "boxes", cost: "350", supplier: "MedSupply India", description: "Latex-free nitrile examination gloves" },
      { name: "Surgical Gloves (Sterile)", category: "gloves", currentStock: 300, lowStockThreshold: 30, unit: "pairs", cost: "45", supplier: "MedSupply India", description: "Sterile powdered surgical gloves" },
      { name: "Disposable Syringes 5ml", category: "syringes", currentStock: 1000, lowStockThreshold: 100, unit: "units", cost: "8", supplier: "BD India", description: "Luer-lock disposable syringes 5ml" },
      { name: "Disposable Syringes 10ml", category: "syringes", currentStock: 800, lowStockThreshold: 80, unit: "units", cost: "10", supplier: "BD India", description: "Luer-lock disposable syringes 10ml" },
      { name: "Insulin Syringes 1ml", category: "syringes", currentStock: 500, lowStockThreshold: 50, unit: "units", cost: "12", supplier: "BD India", description: "U-100 insulin syringes with needle" },
      { name: "N95 Masks", category: "disposables", currentStock: 400, lowStockThreshold: 50, unit: "units", cost: "35", supplier: "3M India", description: "NIOSH-approved N95 respirator masks" },
      { name: "Surgical Masks (3-ply)", category: "disposables", currentStock: 2000, lowStockThreshold: 200, unit: "units", cost: "5", supplier: "Venus Safety", description: "3-ply disposable surgical face masks" },
      { name: "IV Infusion Set", category: "disposables", currentStock: 300, lowStockThreshold: 30, unit: "units", cost: "55", supplier: "Romsons", description: "Sterile IV infusion set with flow regulator" },
      { name: "IV Cannula (20G)", category: "disposables", currentStock: 400, lowStockThreshold: 40, unit: "units", cost: "25", supplier: "BD India", description: "20-gauge intravenous cannula with wings" },
      { name: "Cotton Roll (500g)", category: "disposables", currentStock: 150, lowStockThreshold: 15, unit: "rolls", cost: "120", supplier: "Jaycot Industries", description: "Absorbent cotton roll 500 grams" },
      { name: "Bandage Roll (10cm x 3m)", category: "disposables", currentStock: 600, lowStockThreshold: 60, unit: "rolls", cost: "18", supplier: "Premierpads", description: "Cotton elastic bandage roll" },
      { name: "Antiseptic Solution (Betadine 500ml)", category: "disposables", currentStock: 100, lowStockThreshold: 10, unit: "bottles", cost: "180", supplier: "Win-Medicare", description: "Povidone-iodine 10% antiseptic solution" },
      { name: "Gauze Pads (10x10cm)", category: "disposables", currentStock: 1000, lowStockThreshold: 100, unit: "packs", cost: "25", supplier: "Premierpads", description: "Sterile gauze swab pads pack of 5" },
      { name: "Surgical Tape (2.5cm x 9.1m)", category: "disposables", currentStock: 200, lowStockThreshold: 20, unit: "rolls", cost: "45", supplier: "3M India", description: "Micropore surgical tape" },
      { name: "Hypodermic Needles (22G)", category: "disposables", currentStock: 1500, lowStockThreshold: 150, unit: "units", cost: "3", supplier: "BD India", description: "22-gauge hypodermic needles" },
      { name: "Suture Kit (Silk 3-0)", category: "disposables", currentStock: 200, lowStockThreshold: 20, unit: "units", cost: "85", supplier: "Ethicon India", description: "Non-absorbable silk braided suture" },
      { name: "Urine Collection Bag", category: "disposables", currentStock: 250, lowStockThreshold: 25, unit: "units", cost: "40", supplier: "Romsons", description: "Sterile urine drainage bag 2L" },
      { name: "Disposable Bed Sheet", category: "disposables", currentStock: 300, lowStockThreshold: 30, unit: "units", cost: "60", supplier: "MedSupply India", description: "Non-woven disposable bed sheet" },
    ];

    for (const item of items) {
      await db.insert(inventoryItems).values(item).onConflictDoNothing();
    }

    console.log(`Seeded ${items.length} inventory items successfully!`);
  }

  async seedOxygenCylinders(): Promise<void> {
    const existing = await db.select().from(oxygenCylinders).limit(1);
    if (existing.length > 0) {
      console.log("Oxygen cylinders already exist, skipping seed...");
      return;
    }

    console.log("Seeding oxygen cylinders...");

    const cylinders: InsertOxygenCylinder[] = [
      { cylinderCode: "OXY-B-001", cylinderType: "B-type", capacity: "200", filledPressure: "2000", currentPressure: "2000", status: "full", vendor: "Linde India", location: "ICU", purityCertificateDate: "2025-01-15", hydrostaticTestDate: "2023-06-10", nextTestDueDate: "2028-06-10" },
      { cylinderCode: "OXY-B-002", cylinderType: "B-type", capacity: "200", filledPressure: "2000", currentPressure: "1200", status: "in_use", vendor: "Linde India", location: "Emergency", purityCertificateDate: "2025-01-15", hydrostaticTestDate: "2023-08-20", nextTestDueDate: "2028-08-20" },
      { cylinderCode: "OXY-D-001", cylinderType: "D-type", capacity: "500", filledPressure: "2000", currentPressure: "2000", status: "full", vendor: "INOX Air Products", location: "General Ward", purityCertificateDate: "2025-02-01", hydrostaticTestDate: "2024-01-15", nextTestDueDate: "2029-01-15" },
      { cylinderCode: "OXY-E-001", cylinderType: "E-type", capacity: "680", filledPressure: "2000", currentPressure: "500", status: "in_use", vendor: "INOX Air Products", location: "OT-1", purityCertificateDate: "2024-12-10", hydrostaticTestDate: "2022-11-05", nextTestDueDate: "2027-11-05" },
      { cylinderCode: "OXY-H-001", cylinderType: "H-type", capacity: "7000", filledPressure: "2200", currentPressure: "2200", status: "full", vendor: "Linde India", location: "Central Store", purityCertificateDate: "2025-01-20", hydrostaticTestDate: "2024-03-01", nextTestDueDate: "2029-03-01" },
      { cylinderCode: "OXY-H-002", cylinderType: "H-type", capacity: "7000", filledPressure: "2200", currentPressure: "300", status: "empty", vendor: "Linde India", location: "Central Store", purityCertificateDate: "2024-11-05", hydrostaticTestDate: "2023-04-18", nextTestDueDate: "2028-04-18" },
    ];

    for (const cyl of cylinders) {
      await db.insert(oxygenCylinders).values(cyl).onConflictDoNothing();
    }

    console.log(`Seeded ${cylinders.length} oxygen cylinders successfully!`);
  }

  async seedDiseaseCatalog(): Promise<void> {
    const existing = await db.select().from(diseaseCatalog).limit(1);
    if (existing.length > 0) {
      console.log("Disease catalog already exists, skipping seed...");
      return;
    }

    console.log("Seeding disease catalog...");

    const diseases: InsertDiseaseCatalog[] = [
      { diseaseName: "Diabetes Mellitus", alternateNames: "Sugar Disease, Madhumeha", category: "metabolic", affectedSystem: "Endocrine", shortDescription: "A condition where the body cannot properly process blood sugar (glucose)", causes: JSON.stringify(["Insulin resistance", "Insufficient insulin production", "Genetic factors"]), riskFactors: JSON.stringify(["Obesity", "Sedentary lifestyle", "Family history", "Age over 45"]), symptoms: JSON.stringify(["Frequent urination", "Excessive thirst", "Unexplained weight loss", "Blurred vision", "Fatigue"]), emergencySigns: JSON.stringify(["Very high blood sugar (>400 mg/dL)", "Diabetic ketoacidosis", "Loss of consciousness"]), clinicalParameters: JSON.stringify({ fastingBloodSugar: "70-100 mg/dL", postMealSugar: "<140 mg/dL", hba1c: "<7%" }), dosList: JSON.stringify(["Monitor blood sugar regularly", "Take medications on time", "Exercise 30 min daily", "Eat balanced meals"]), dontsList: JSON.stringify(["Skip meals", "Consume excess sugar", "Miss medications", "Ignore foot care"]), isActive: true },
      { diseaseName: "Hypertension", alternateNames: "High Blood Pressure, BP", category: "cardiovascular", affectedSystem: "Heart", shortDescription: "Persistently elevated blood pressure in the arteries", causes: JSON.stringify(["Narrowing of arteries", "High salt intake", "Stress", "Genetic predisposition"]), riskFactors: JSON.stringify(["Obesity", "Smoking", "High salt diet", "Excessive alcohol", "Family history"]), symptoms: JSON.stringify(["Headache", "Dizziness", "Chest pain", "Shortness of breath", "Nosebleeds"]), emergencySigns: JSON.stringify(["BP above 180/120 mmHg", "Severe chest pain", "Vision changes", "Difficulty speaking"]), clinicalParameters: JSON.stringify({ normalBP: "<120/80 mmHg", stage1: "130-139/80-89 mmHg", stage2: ">=140/90 mmHg" }), dosList: JSON.stringify(["Take BP medications daily", "Reduce salt intake", "Exercise regularly", "Manage stress"]), dontsList: JSON.stringify(["Stop medication without consulting doctor", "Consume excess salt", "Smoke", "Drink excess alcohol"]), isActive: true },
      { diseaseName: "Asthma", alternateNames: "Dama, Bronchial Asthma", category: "respiratory", affectedSystem: "Lungs", shortDescription: "Chronic inflammatory disease of the airways causing breathing difficulty", causes: JSON.stringify(["Airway inflammation", "Genetic factors", "Environmental allergens"]), riskFactors: JSON.stringify(["Family history", "Allergies", "Air pollution", "Smoking exposure", "Respiratory infections"]), symptoms: JSON.stringify(["Wheezing", "Shortness of breath", "Chest tightness", "Coughing especially at night"]), emergencySigns: JSON.stringify(["Severe breathlessness", "Blue lips or fingertips", "Unable to speak full sentences", "Inhaler not helping"]), clinicalParameters: JSON.stringify({ peakFlow: ">80% of personal best", spO2: ">95%" }), dosList: JSON.stringify(["Keep inhaler accessible", "Avoid known triggers", "Follow action plan", "Get flu vaccine yearly"]), dontsList: JSON.stringify(["Ignore worsening symptoms", "Stop controller medications", "Smoke", "Exercise in cold air without precaution"]), isActive: true },
      { diseaseName: "Dengue Fever", alternateNames: "Break-bone Fever, Haddi Tod Bukhar", category: "infectious", affectedSystem: "Blood", shortDescription: "Mosquito-borne viral infection causing high fever and body pain", causes: JSON.stringify(["Dengue virus transmitted by Aedes mosquitoes"]), riskFactors: JSON.stringify(["Monsoon season", "Stagnant water near home", "Previous dengue infection", "Tropical climate"]), symptoms: JSON.stringify(["High fever (104F)", "Severe headache", "Pain behind eyes", "Joint and muscle pain", "Skin rash", "Nausea"]), emergencySigns: JSON.stringify(["Severe abdominal pain", "Persistent vomiting", "Bleeding from nose or gums", "Blood in vomit or stool", "Platelet count <20000"]), clinicalParameters: JSON.stringify({ plateletCount: ">150000/mcL", hematocrit: "Normal range" }), dosList: JSON.stringify(["Stay hydrated", "Rest completely", "Use mosquito nets", "Monitor platelet count daily"]), dontsList: JSON.stringify(["Take aspirin or ibuprofen", "Ignore warning signs", "Self-medicate", "Delay hospital visit if bleeding"]), isActive: true },
      { diseaseName: "Typhoid Fever", alternateNames: "Motijhara, Enteric Fever", category: "infectious", affectedSystem: "Digestive", shortDescription: "Bacterial infection caused by contaminated food or water", causes: JSON.stringify(["Salmonella typhi bacteria", "Contaminated water or food"]), riskFactors: JSON.stringify(["Poor sanitation", "Contaminated water supply", "Close contact with infected person"]), symptoms: JSON.stringify(["Sustained high fever", "Weakness", "Abdominal pain", "Headache", "Loss of appetite", "Constipation or diarrhea"]), emergencySigns: JSON.stringify(["Intestinal bleeding", "Perforation of intestine", "Very high fever not responding to medication"]), clinicalParameters: JSON.stringify({ widalTest: "Positive >1:160", bloodCulture: "Positive for S. typhi" }), dosList: JSON.stringify(["Complete full antibiotic course", "Drink boiled water", "Eat hygienic food", "Wash hands frequently"]), dontsList: JSON.stringify(["Stop antibiotics early", "Eat street food", "Drink unfiltered water", "Share personal items"]), isActive: true },
      { diseaseName: "Malaria", alternateNames: "Malaria Bukhar", category: "infectious", affectedSystem: "Blood", shortDescription: "Parasitic infection transmitted by Anopheles mosquito bites", causes: JSON.stringify(["Plasmodium parasite via mosquito bite"]), riskFactors: JSON.stringify(["Living in endemic areas", "Lack of mosquito protection", "Rainy season", "Travel to endemic regions"]), symptoms: JSON.stringify(["Cyclic high fever with chills", "Sweating", "Headache", "Body aches", "Nausea and vomiting", "Fatigue"]), emergencySigns: JSON.stringify(["Cerebral malaria (confusion)", "Severe anemia", "Respiratory distress", "Organ failure"]), clinicalParameters: JSON.stringify({ bloodSmear: "Negative for parasites", rapidTest: "Negative" }), dosList: JSON.stringify(["Complete antimalarial course", "Use mosquito nets", "Apply repellent", "Drain stagnant water"]), dontsList: JSON.stringify(["Skip medication doses", "Ignore recurring fever", "Self-diagnose", "Delay treatment"]), isActive: true },
      { diseaseName: "Pneumonia", alternateNames: "Lung Infection, Nimoniya", category: "respiratory", affectedSystem: "Lungs", shortDescription: "Infection that inflames the air sacs in one or both lungs", causes: JSON.stringify(["Bacterial infection", "Viral infection", "Fungal infection", "Aspiration"]), riskFactors: JSON.stringify(["Age >65 or <2", "Chronic lung disease", "Weakened immune system", "Smoking", "Recent hospitalization"]), symptoms: JSON.stringify(["Cough with phlegm", "Fever and chills", "Shortness of breath", "Chest pain when breathing", "Fatigue"]), emergencySigns: JSON.stringify(["Severe difficulty breathing", "Confusion", "Blue discoloration of lips", "High persistent fever"]), clinicalParameters: JSON.stringify({ spO2: ">95%", chestXray: "Clear lung fields", wbc: "4000-11000/mcL" }), dosList: JSON.stringify(["Complete antibiotic course", "Rest adequately", "Stay hydrated", "Practice deep breathing"]), dontsList: JSON.stringify(["Smoke", "Ignore breathing difficulty", "Skip medications", "Delay medical care"]), isActive: true },
      { diseaseName: "COVID-19", alternateNames: "Coronavirus Disease, SARS-CoV-2", category: "infectious", affectedSystem: "Lungs", shortDescription: "Respiratory illness caused by the SARS-CoV-2 coronavirus", causes: JSON.stringify(["SARS-CoV-2 virus", "Airborne transmission", "Contact with infected surfaces"]), riskFactors: JSON.stringify(["Unvaccinated status", "Age >60", "Comorbidities", "Immunocompromised", "Close contact with infected"]), symptoms: JSON.stringify(["Fever", "Dry cough", "Fatigue", "Loss of taste or smell", "Sore throat", "Body aches"]), emergencySigns: JSON.stringify(["Persistent chest pain", "SpO2 <94%", "Confusion", "Inability to stay awake", "Bluish lips"]), clinicalParameters: JSON.stringify({ spO2: ">95%", rtPcr: "Negative", ctValue: ">35" }), dosList: JSON.stringify(["Isolate if positive", "Monitor oxygen levels", "Stay hydrated", "Get vaccinated"]), dontsList: JSON.stringify(["Ignore symptoms", "Avoid testing", "Self-medicate with steroids", "Break isolation"]), isActive: true },
      { diseaseName: "Tuberculosis", alternateNames: "TB, Kshay Rog", category: "infectious", affectedSystem: "Lungs", shortDescription: "Bacterial infection primarily affecting the lungs, spread through air", causes: JSON.stringify(["Mycobacterium tuberculosis bacteria", "Airborne transmission"]), riskFactors: JSON.stringify(["Close contact with TB patient", "HIV/AIDS", "Malnutrition", "Smoking", "Overcrowded living"]), symptoms: JSON.stringify(["Persistent cough >3 weeks", "Coughing blood", "Night sweats", "Weight loss", "Evening fever", "Chest pain"]), emergencySigns: JSON.stringify(["Massive hemoptysis", "Severe respiratory distress", "Meningitis symptoms"]), clinicalParameters: JSON.stringify({ sputumTest: "Negative for AFB", chestXray: "No active lesions", genexpert: "Not detected" }), dosList: JSON.stringify(["Complete DOTS therapy", "Cover mouth when coughing", "Ensure ventilation", "Eat nutritious food"]), dontsList: JSON.stringify(["Stop medication early", "Spit in open", "Skip follow-up visits", "Ignore side effects"]), isActive: true },
      { diseaseName: "Heart Disease", alternateNames: "Coronary Artery Disease, Hriday Rog", category: "cardiovascular", affectedSystem: "Heart", shortDescription: "Conditions affecting the heart including coronary artery disease and heart failure", causes: JSON.stringify(["Atherosclerosis", "High cholesterol", "Hypertension", "Diabetes"]), riskFactors: JSON.stringify(["Smoking", "High cholesterol", "Hypertension", "Diabetes", "Obesity", "Family history", "Sedentary lifestyle"]), symptoms: JSON.stringify(["Chest pain or discomfort", "Shortness of breath", "Fatigue", "Palpitations", "Swollen ankles"]), emergencySigns: JSON.stringify(["Crushing chest pain", "Pain radiating to left arm or jaw", "Sudden breathlessness", "Loss of consciousness"]), clinicalParameters: JSON.stringify({ cholesterol: "<200 mg/dL", ldl: "<100 mg/dL", hdl: ">40 mg/dL", bp: "<130/80 mmHg" }), dosList: JSON.stringify(["Take heart medications regularly", "Follow heart-healthy diet", "Exercise as advised", "Manage stress"]), dontsList: JSON.stringify(["Smoke", "Eat high-fat foods", "Ignore chest pain", "Skip medications"]), isActive: true },
    ];

    for (const disease of diseases) {
      await db.insert(diseaseCatalog).values(disease).onConflictDoNothing();
    }

    console.log(`Seeded ${diseases.length} diseases in catalog successfully!`);
  }

  async seedSwabMasters(): Promise<void> {
    const existingAreas = await db.select().from(swabAreaMaster).limit(1);
    const existingSites = await db.select().from(swabSamplingSiteMaster).limit(1);
    const existingOrganisms = await db.select().from(swabOrganismMaster).limit(1);

    if (existingAreas.length > 0 && existingSites.length > 0 && existingOrganisms.length > 0) {
      console.log("Swab master data already exists, skipping seed...");
      return;
    }

    console.log("Seeding swab master data...");

    if (existingAreas.length === 0) {
      const areas: InsertSwabAreaMaster[] = [
        { block: "Block A", floor: "2nd Floor", areaType: "OT", areaName: "OT-1", equipment: "OT Table, OT Light", isActive: true },
        { block: "Block A", floor: "2nd Floor", areaType: "OT", areaName: "OT-2", equipment: "OT Table, Instrument Trolley", isActive: true },
        { block: "Block B", floor: "1st Floor", areaType: "ICU", areaName: "ICU-1", equipment: "Ventilator, Patient Monitor", isActive: true },
        { block: "Block B", floor: "1st Floor", areaType: "ICU", areaName: "ICU-2", equipment: "Ventilator, Infusion Pump", isActive: true },
        { block: "Block A", floor: "Ground Floor", areaType: "OT", areaName: "CSSD", equipment: "Autoclave, Instrument Washer", isActive: true },
        { block: "Block C", floor: "1st Floor", areaType: "OT", areaName: "Labour Room", equipment: "Delivery Table, Infant Warmer", isActive: true },
      ];
      for (const area of areas) {
        await db.insert(swabAreaMaster).values(area).onConflictDoNothing();
      }
      console.log(`Seeded ${areas.length} swab areas.`);
    }

    if (existingSites.length === 0) {
      const sites: InsertSwabSamplingSiteMaster[] = [
        { siteName: "OT Table", description: "Operating table surface", isActive: true },
        { siteName: "Instrument Trolley", description: "Surgical instrument trolley surface", isActive: true },
        { siteName: "OT Light Handle", description: "Overhead OT light handle", isActive: true },
        { siteName: "Ventilator Surface", description: "External surface of ventilator machine", isActive: true },
        { siteName: "Patient Monitor", description: "Touch screen and buttons of patient monitor", isActive: true },
        { siteName: "Suction Machine", description: "Suction machine surface and nozzle area", isActive: true },
        { siteName: "Anesthesia Machine", description: "Anesthesia workstation surface", isActive: true },
        { siteName: "Wall Surface", description: "Wall near patient area", isActive: true },
        { siteName: "Floor Surface", description: "Floor near OT/ICU bed area", isActive: true },
        { siteName: "Door Handle", description: "Frequently touched door handles", isActive: true },
      ];
      for (const site of sites) {
        await db.insert(swabSamplingSiteMaster).values(site).onConflictDoNothing();
      }
      console.log(`Seeded ${sites.length} sampling sites.`);
    }

    if (existingOrganisms.length === 0) {
      const organisms: InsertSwabOrganismMaster[] = [
        { organismName: "No Growth", category: "none", riskLevel: "low", description: "No microbial growth detected", isActive: true },
        { organismName: "Staphylococcus aureus", category: "pathogen", riskLevel: "high", description: "Common hospital-acquired pathogen causing skin and wound infections", isActive: true },
        { organismName: "MRSA", category: "pathogen", riskLevel: "critical", description: "Methicillin-resistant Staphylococcus aureus - drug-resistant pathogen", isActive: true },
        { organismName: "Escherichia coli", category: "pathogen", riskLevel: "medium", description: "Gram-negative bacterium causing urinary and GI infections", isActive: true },
        { organismName: "Pseudomonas aeruginosa", category: "pathogen", riskLevel: "high", description: "Opportunistic pathogen common in ICU and burn units", isActive: true },
        { organismName: "Klebsiella pneumoniae", category: "pathogen", riskLevel: "high", description: "Gram-negative bacterium causing pneumonia and UTIs", isActive: true },
        { organismName: "Acinetobacter baumannii", category: "pathogen", riskLevel: "critical", description: "Multi-drug resistant hospital-acquired pathogen", isActive: true },
        { organismName: "Candida species", category: "pathogen", riskLevel: "medium", description: "Fungal pathogen causing bloodstream and surgical site infections", isActive: true },
        { organismName: "Enterococcus faecalis", category: "pathogen", riskLevel: "medium", description: "Gram-positive bacterium causing surgical site infections", isActive: true },
        { organismName: "Coagulase-negative Staphylococci", category: "flora", riskLevel: "low", description: "Normal skin flora, usually non-pathogenic", isActive: true },
        { organismName: "Bacillus species", category: "flora", riskLevel: "low", description: "Environmental organism, generally non-pathogenic", isActive: true },
        { organismName: "Aspergillus species", category: "pathogen", riskLevel: "high", description: "Environmental fungus causing respiratory infections in immunocompromised", isActive: true },
      ];
      for (const org of organisms) {
        await db.insert(swabOrganismMaster).values(org).onConflictDoNothing();
      }
      console.log(`Seeded ${organisms.length} organisms.`);
    }

    console.log("Swab master data seeded successfully!");
  }

  async seedPathologyLabs(): Promise<void> {
    const existing = await db.select().from(pathologyLabs).limit(1);
    if (existing.length > 0) {
      console.log("Pathology labs already exist, skipping seed...");
      return;
    }

    console.log("Seeding pathology labs...");

    await db.insert(pathologyLabs).values({
      labName: "Main Pathology Lab",
      labCode: "LAB-001",
      labType: "IN_HOUSE",
      address: "Ground Floor, Block A, Hospital Campus",
      phone: "+91 20 1234 5600",
      email: "pathlab@hospital.in",
      licenseNumber: "MH-PATH-2024-001",
      accreditation: "NABL",
      operatingHours: "24/7",
      contactPerson: "Dr. Lab Director",
      isActive: true,
      canAccessFullRecords: true,
    }).onConflictDoNothing();

    console.log("Seeded main pathology lab successfully!");
  }

  async seedMedicalStores(): Promise<void> {
    const existing = await db.select().from(medicalStores).limit(1);
    if (existing.length > 0) {
      console.log("Medical stores already exist, skipping seed...");
      return;
    }

    console.log("Seeding medical stores...");

    await db.insert(medicalStores).values({
      storeCode: "MS-001",
      storeName: "Main Hospital Pharmacy",
      storeType: "IN_HOUSE",
      ownerName: "Hospital Administration",
      licenseNumber: "MH-PHARM-2024-001",
      gstNumber: "27AABCH1234A1Z5",
      drugLicenseNumber: "MH-DL-2024-001",
      address: "Ground Floor, Main Building, Hospital Campus",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
      phone: "+91 20 1234 5601",
      email: "pharmacy@hospital.in",
      operatingHours: "08:00 AM - 10:00 PM",
      is24Hours: false,
      status: "ACTIVE",
      hasInventoryAccess: true,
      canSubstituteMedicines: false,
      requiresDoctorApproval: true,
    }).onConflictDoNothing();

    console.log("Seeded main medical store successfully!");
  }

  async seedDietTemplates(): Promise<void> {
    const existing = await db.select().from(dietTemplates).limit(1);
    if (existing.length > 0) {
      console.log("Diet templates already exist, skipping seed...");
      return;
    }

    console.log("Seeding diet templates...");

    const templates: InsertDietTemplate[] = [
      {
        diseaseId: "general",
        templateName: "General Diet Plan",
        dietType: "both",
        mealPlan: JSON.stringify({ early_morning: "Warm water with lemon", breakfast: "Poha/Upma with vegetables, milk or tea", mid_morning: "Seasonal fruit", lunch: "2 Roti, dal, sabzi, rice, curd, salad", evening_snack: "Green tea with roasted chana or makhana", dinner: "2 Roti, light sabzi, dal soup", bedtime: "Warm turmeric milk" }),
        foodsToAvoid: JSON.stringify(["Excessive fried foods", "Processed foods", "Excess sugar", "Excess salt"]),
        foodsToLimit: JSON.stringify(["Red meat", "Refined flour (maida)", "Carbonated drinks"]),
        safeInModeration: JSON.stringify(["Ghee", "Sweets on occasions", "Coffee"]),
        portionGuidance: "Eat until 80% full. Use a standard thali for portion control.",
        hydrationGuidance: "Drink 8-10 glasses of water daily. Include buttermilk and coconut water.",
        specialNotes: "Eat seasonal and locally available foods. Prefer home-cooked meals.",
        isActive: true,
      },
      {
        diseaseId: "diabetic",
        templateName: "Diabetic Diet Plan",
        dietType: "both",
        mealPlan: JSON.stringify({ early_morning: "Methi seeds soaked water or warm water", breakfast: "Multigrain roti with paneer/egg bhurji, green tea", mid_morning: "Handful of almonds or small apple", lunch: "1 Jowar/Bajra roti, palak dal, green sabzi, small portion brown rice, curd", evening_snack: "Roasted makhana or sprouts chaat", dinner: "1 Multigrain roti, bottle gourd sabzi, moong dal soup", bedtime: "Sugar-free turmeric milk (if needed)" }),
        foodsToAvoid: JSON.stringify(["White sugar", "White rice in excess", "Mango", "Grapes", "Banana", "Maida products", "Sugary drinks", "Fruit juices"]),
        foodsToLimit: JSON.stringify(["Potato", "White bread", "Honey", "Dates"]),
        safeInModeration: JSON.stringify(["Brown rice", "Whole wheat roti", "Low-GI fruits like guava and orange"]),
        portionGuidance: "Small frequent meals every 3-4 hours. Never skip meals.",
        hydrationGuidance: "Drink 8-10 glasses of water. Avoid sweetened beverages. Buttermilk is good.",
        specialNotes: "Always eat carbohydrates with protein or fiber to slow sugar absorption.",
        isActive: true,
      },
      {
        diseaseId: "cardiac",
        templateName: "Cardiac (Heart-Healthy) Diet Plan",
        dietType: "both",
        mealPlan: JSON.stringify({ early_morning: "Warm water with garlic clove (optional)", breakfast: "Oats porridge with fruits, or idli with sambar", mid_morning: "Walnuts and flaxseeds", lunch: "2 Roti (wheat/jowar), lauki/tinda sabzi, dal, salad, small portion rice", evening_snack: "Green tea with roasted chana", dinner: "1 Roti, steamed fish/paneer, vegetable soup", bedtime: "Warm water" }),
        foodsToAvoid: JSON.stringify(["Fried foods", "Red meat", "Butter", "Full-fat cheese", "Processed meats", "Excess salt", "Trans fats"]),
        foodsToLimit: JSON.stringify(["Egg yolk (max 3/week)", "Coconut oil", "Salt (less than 5g/day)"]),
        safeInModeration: JSON.stringify(["Olive oil", "Mustard oil", "Dark chocolate", "Nuts"]),
        portionGuidance: "Small portions. Avoid overeating. Dinner should be lightest meal.",
        hydrationGuidance: "6-8 glasses of water. Limit fluid if heart failure is present (as per doctor).",
        specialNotes: "Focus on omega-3 rich foods like walnuts, flaxseeds, and fish.",
        isActive: true,
      },
      {
        diseaseId: "renal",
        templateName: "Renal (Kidney-Friendly) Diet Plan",
        dietType: "both",
        mealPlan: JSON.stringify({ early_morning: "Warm water", breakfast: "White bread toast with jam, or semolina upma, tea with little milk", mid_morning: "Apple or pear (peeled)", lunch: "2 Roti, lauki/tinda sabzi (low potassium), dal (small portion), white rice", evening_snack: "Arrowroot biscuits with tea", dinner: "1 Roti, cabbage sabzi, light soup", bedtime: "As advised by doctor" }),
        foodsToAvoid: JSON.stringify(["Banana", "Orange", "Tomato (excess)", "Spinach", "Nuts in excess", "Coconut water", "Dry fruits", "Whole grains in excess"]),
        foodsToLimit: JSON.stringify(["Salt (as per doctor)", "Protein (as per GFR)", "Potassium-rich foods", "Phosphorus-rich foods"]),
        safeInModeration: JSON.stringify(["Low-potassium fruits like apple and pear", "White rice", "Refined flour in small quantity"]),
        portionGuidance: "Protein portion as per nephrologist advice (0.6-0.8g/kg). Strict fluid limit if on dialysis.",
        hydrationGuidance: "Fluid intake as prescribed by nephrologist. Track daily intake.",
        specialNotes: "This diet must be personalized based on kidney function (GFR) and dialysis status. Always follow nephrologist guidance.",
        isActive: true,
      },
      {
        diseaseId: "soft-liquid",
        templateName: "Soft/Liquid Diet Plan",
        dietType: "both",
        mealPlan: JSON.stringify({ early_morning: "Warm water or clear soup", breakfast: "Daliya porridge or mashed banana with milk", mid_morning: "Fresh fruit juice (strained) or coconut water", lunch: "Khichdi (well-cooked), dal soup, mashed vegetables, curd", evening_snack: "Custard or fruit puree", dinner: "Suji kheer or rice porridge with dal water", bedtime: "Warm milk" }),
        foodsToAvoid: JSON.stringify(["Hard or crunchy foods", "Raw vegetables", "Nuts and seeds", "Spicy foods", "Fried items"]),
        foodsToLimit: JSON.stringify(["Fibrous vegetables", "Whole grains", "Citrus fruits"]),
        safeInModeration: JSON.stringify(["Well-cooked soft rice", "Mashed potato", "Soft paneer"]),
        portionGuidance: "Small, frequent meals (6 times a day). Chew thoroughly or blend foods.",
        hydrationGuidance: "Sip fluids frequently. ORS if needed. Clear soups and broths are excellent.",
        specialNotes: "Suitable for post-surgery recovery, dental procedures, difficulty swallowing, and GI issues.",
        isActive: true,
      },
    ];

    for (const template of templates) {
      await db.insert(dietTemplates).values(template).onConflictDoNothing();
    }

    console.log(`Seeded ${templates.length} diet templates successfully!`);
  }

  async seedDefaultBeds(): Promise<void> {
    const existing = await db.select().from(beds).limit(1);
    if (existing.length > 0) {
      console.log("Beds already exist, skipping seed...");
      return;
    }

    console.log("Seeding default beds...");

    const bedData: InsertBed[] = [
      { bedNumber: "GEN-01", bedName: "General Ward Bed 1", categoryId: "cat-general", wardName: "General Ward A", floor: "1st Floor", department: "General", occupancyStatus: "AVAILABLE", isActive: true },
      { bedNumber: "GEN-02", bedName: "General Ward Bed 2", categoryId: "cat-general", wardName: "General Ward A", floor: "1st Floor", department: "General", occupancyStatus: "AVAILABLE", isActive: true },
      { bedNumber: "GEN-03", bedName: "General Ward Bed 3", categoryId: "cat-general", wardName: "General Ward A", floor: "1st Floor", department: "General", occupancyStatus: "AVAILABLE", isActive: true },
      { bedNumber: "GEN-04", bedName: "General Ward Bed 4", categoryId: "cat-general", wardName: "General Ward B", floor: "1st Floor", department: "General", occupancyStatus: "AVAILABLE", isActive: true },
      { bedNumber: "GEN-05", bedName: "General Ward Bed 5", categoryId: "cat-general", wardName: "General Ward B", floor: "1st Floor", department: "General", occupancyStatus: "AVAILABLE", isActive: true },
      { bedNumber: "GEN-06", bedName: "General Ward Bed 6", categoryId: "cat-general", wardName: "General Ward B", floor: "1st Floor", department: "General", occupancyStatus: "AVAILABLE", isActive: true },
      { bedNumber: "ICU-01", bedName: "ICU Bed 1", categoryId: "cat-icu", wardName: "ICU", floor: "2nd Floor", department: "ICU", occupancyStatus: "AVAILABLE", hasOxygenCapability: true, hasVentilatorCapability: true, isActive: true },
      { bedNumber: "ICU-02", bedName: "ICU Bed 2", categoryId: "cat-icu", wardName: "ICU", floor: "2nd Floor", department: "ICU", occupancyStatus: "AVAILABLE", hasOxygenCapability: true, hasVentilatorCapability: true, isActive: true },
      { bedNumber: "ICU-03", bedName: "ICU Bed 3", categoryId: "cat-icu", wardName: "ICU", floor: "2nd Floor", department: "ICU", occupancyStatus: "AVAILABLE", hasOxygenCapability: true, hasVentilatorCapability: true, isActive: true },
      { bedNumber: "ICU-04", bedName: "ICU Bed 4", categoryId: "cat-icu", wardName: "ICU", floor: "2nd Floor", department: "ICU", occupancyStatus: "AVAILABLE", hasOxygenCapability: true, hasVentilatorCapability: true, isActive: true },
      { bedNumber: "HDU-01", bedName: "HDU Bed 1", categoryId: "cat-hdu", wardName: "HDU", floor: "2nd Floor", department: "HDU", occupancyStatus: "AVAILABLE", hasOxygenCapability: true, isActive: true },
      { bedNumber: "HDU-02", bedName: "HDU Bed 2", categoryId: "cat-hdu", wardName: "HDU", floor: "2nd Floor", department: "HDU", occupancyStatus: "AVAILABLE", hasOxygenCapability: true, isActive: true },
      { bedNumber: "PVT-01", bedName: "Private Room 1", categoryId: "cat-private", wardName: "Private Wing", floor: "3rd Floor", department: "Private", occupancyStatus: "AVAILABLE", isActive: true },
      { bedNumber: "PVT-02", bedName: "Private Room 2", categoryId: "cat-private", wardName: "Private Wing", floor: "3rd Floor", department: "Private", occupancyStatus: "AVAILABLE", isActive: true },
      { bedNumber: "PVT-03", bedName: "Private Room 3", categoryId: "cat-private", wardName: "Private Wing", floor: "3rd Floor", department: "Private", occupancyStatus: "AVAILABLE", isActive: true },
      { bedNumber: "SP-01", bedName: "Semi-Private Room 1", categoryId: "cat-semi-private", wardName: "Semi-Private Wing", floor: "2nd Floor", department: "Semi-Private", occupancyStatus: "AVAILABLE", isActive: true },
      { bedNumber: "SP-02", bedName: "Semi-Private Room 2", categoryId: "cat-semi-private", wardName: "Semi-Private Wing", floor: "2nd Floor", department: "Semi-Private", occupancyStatus: "AVAILABLE", isActive: true },
      { bedNumber: "ISO-01", bedName: "Isolation Room 1", categoryId: "cat-isolation", wardName: "Isolation Ward", floor: "Ground Floor", department: "Isolation", occupancyStatus: "AVAILABLE", isIsolationBed: true, infectionControlFlag: true, ppeProtocolRequired: true, isActive: true },
      { bedNumber: "ISO-02", bedName: "Isolation Room 2", categoryId: "cat-isolation", wardName: "Isolation Ward", floor: "Ground Floor", department: "Isolation", occupancyStatus: "AVAILABLE", isIsolationBed: true, infectionControlFlag: true, ppeProtocolRequired: true, isActive: true },
      { bedNumber: "NICU-01", bedName: "NICU Bed 1", categoryId: "cat-nicu", wardName: "NICU", floor: "2nd Floor", department: "NICU", occupancyStatus: "AVAILABLE", hasOxygenCapability: true, hasVentilatorCapability: true, isActive: true },
    ];

    for (const bed of bedData) {
      await db.insert(beds).values(bed).onConflictDoNothing();
    }

    console.log(`Seeded ${bedData.length} beds successfully!`);
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

  async getPrescriptionsByPatientFlexible(patientName: string): Promise<Prescription[]> {
    // Normalize the search name: trim, lowercase, collapse multiple spaces
    const normalizedSearch = patientName.trim().toLowerCase().replace(/\s+/g, ' ');
    
    // Get all prescriptions and filter with normalized matching
    const allPrescriptions = await db.select().from(prescriptions).orderBy(desc(prescriptions.createdAt));
    
    return allPrescriptions.filter(rx => {
      if (!rx.patientName) return false;
      const normalizedPatientName = rx.patientName.trim().toLowerCase().replace(/\s+/g, ' ');
      return normalizedPatientName === normalizedSearch;
    });
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
    // First delete prescription items
    await db.delete(prescriptionItems).where(eq(prescriptionItems.prescriptionId, id));
    const result = await db.delete(prescriptions).where(eq(prescriptions.id, id)).returning();
    return result.length > 0;
  }

  async getPrescriptionsByPatientId(patientId: string): Promise<Prescription[]> {
    return await db.select().from(prescriptions)
      .where(eq(prescriptions.patientId, patientId))
      .orderBy(desc(prescriptions.createdAt));
  }

  async getFinalizedPrescriptionsByPatientId(patientId: string): Promise<Prescription[]> {
    return await db.select().from(prescriptions)
      .where(and(
        eq(prescriptions.patientId, patientId),
        eq(prescriptions.prescriptionStatus, 'finalized')
      ))
      .orderBy(desc(prescriptions.createdAt));
  }

  async generatePrescriptionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await db.select().from(prescriptions)
      .where(sql`prescription_number LIKE 'PR-${year}-%'`)
      .orderBy(desc(prescriptions.createdAt));
    
    let nextNum = 1;
    if (result.length > 0 && result[0].prescriptionNumber) {
      const lastNum = parseInt(result[0].prescriptionNumber.split('-')[2] || '0');
      nextNum = lastNum + 1;
    }
    return `PR-${year}-${String(nextNum).padStart(4, '0')}`;
  }

  async finalizePrescription(id: string, signedBy: string, signedByName: string): Promise<Prescription | undefined> {
    const prescriptionNumber = await this.generatePrescriptionNumber();
    const result = await db.update(prescriptions)
      .set({
        prescriptionStatus: 'finalized',
        prescriptionNumber,
        signedBy,
        signedByName,
        signedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(prescriptions.id, id))
      .returning();
    return result[0];
  }

  // ========== PRESCRIPTION ITEMS METHODS ==========
  async getPrescriptionItems(prescriptionId: string): Promise<any[]> {
    return await db.select().from(prescriptionItems)
      .where(eq(prescriptionItems.prescriptionId, prescriptionId))
      .orderBy(prescriptionItems.sortOrder);
  }

  async createPrescriptionItem(item: any): Promise<any> {
    // Auto-generate schedule based on frequency
    const schedule = this.generateScheduleFromFrequency(item.frequency);
    const result = await db.insert(prescriptionItems)
      .values({ ...item, schedule: JSON.stringify(schedule) })
      .returning();
    return result[0];
  }

  async createPrescriptionItems(items: any[]): Promise<any[]> {
    if (items.length === 0) return [];
    const itemsWithSchedule = items.map((item, index) => ({
      ...item,
      schedule: JSON.stringify(this.generateScheduleFromFrequency(item.frequency)),
      sortOrder: index
    }));
    const result = await db.insert(prescriptionItems).values(itemsWithSchedule).returning();
    return result;
  }

  async deletePrescriptionItems(prescriptionId: string): Promise<boolean> {
    await db.delete(prescriptionItems).where(eq(prescriptionItems.prescriptionId, prescriptionId));
    return true;
  }

  generateScheduleFromFrequency(frequency: string): string[] {
    switch (frequency) {
      case '1': return ['Morning'];
      case '2': return ['Morning', 'Night'];
      case '3': return ['Morning', 'Afternoon', 'Night'];
      case '4': return ['Morning', 'Afternoon', 'Evening', 'Night'];
      default: return ['Morning'];
    }
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

  async getAllTimeSlotsForDate(date: string): Promise<DoctorTimeSlot[]> {
    return await db.select().from(doctorTimeSlots)
      .where(eq(doctorTimeSlots.slotDate, date))
      .orderBy(doctorTimeSlots.startTime);
  }

  async getTimeSlotDoctorMappings(): Promise<{ doctorId: string; doctorName: string }[]> {
    const result = await db.selectDistinct({
      doctorId: doctorTimeSlots.doctorId,
      doctorName: doctorTimeSlots.doctorName
    }).from(doctorTimeSlots);
    return result;
  }

  async getDoctorTimeSlotByAppointmentId(appointmentId: string): Promise<DoctorTimeSlot | undefined> {
    const result = await db.select().from(doctorTimeSlots).where(eq(doctorTimeSlots.appointmentId, appointmentId));
    return result[0];
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

  async deleteUserNotificationsByAppointment(appointmentId: string): Promise<boolean> {
    const result = await db.delete(userNotifications)
      .where(eq(userNotifications.relatedEntityId, appointmentId))
      .returning();
    return result.length > 0;
  }

  async markUserNotificationsReadByAppointment(appointmentId: string): Promise<boolean> {
    const result = await db.update(userNotifications)
      .set({ isRead: true })
      .where(eq(userNotifications.relatedEntityId, appointmentId))
      .returning();
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
    const allTemplates = await db.select().from(consentTemplates).where(eq(consentTemplates.isActive, true)).orderBy(consentTemplates.category, consentTemplates.title);
    const seenTypes = new Set<string>();
    const uniqueTemplates: ConsentTemplate[] = [];
    for (const template of allTemplates) {
      if (!seenTypes.has(template.consentType)) {
        seenTypes.add(template.consentType);
        uniqueTemplates.push(template);
      }
    }
    return uniqueTemplates;
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
    const existingConsentTypes = new Set(existing.map(t => t.consentType));

    const templates: InsertConsentTemplate[] = [
      // === LEGAL & ADMINISTRATIVE ===
      {
        title: "Medico-Legal Register (Digital Consent Form)",
        consentType: "MEDICO_LEGAL",
        description: "Comprehensive medico-legal form for documenting patient injuries, police information, body diagram markings, radiological investigations, and medical officer attestation. Must be preserved permanently as per legal requirements. Trilingual: English, Hindi, Marathi.",
        category: "Legal & Administrative",
        pdfPath: "/consents/Medico_Legal_Register.pdf",
        version: "2.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Discharge Against Medical Advice (DAMA/LAMA)",
        consentType: "DAMA",
        description: "Consent form for patients or relatives choosing to discharge against medical advice. Includes patient representative/surrogate consent section and acknowledges all risks including deterioration of health or death. Trilingual: English, Hindi, Marathi.",
        category: "Legal & Administrative",
        pdfPath: "/consents/DAMA_LAMA_Consent.pdf",
        version: "2.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Digital Consent Form (Multiple)",
        consentType: "DIGITAL_CONSENT",
        description: "Comprehensive consent form including: Low General Condition/Poor Prognosis, Emergency Procedure, Patient Shifting to Other Hospital, Handing Over of Valuables, Denial of Treatment, and DNR (Do Not Resuscitate) consents. Trilingual: English, Hindi, Marathi.",
        category: "Legal & Administrative",
        pdfPath: "/consents/Digital_Consent_Form.pdf",
        version: "2.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      // === SURGICAL & PROCEDURAL ===
      {
        title: "Operation Theatre Register",
        consentType: "OPERATION_THEATRE",
        description: "OT case logging form for recording patient details, diagnosis, surgical procedures, operation team, materials used (HPE, implants, disposables), anaesthesia details, and post-operative notes. Part of hospital medico-legal records. Trilingual: English, Hindi, Marathi.",
        category: "Surgical & Procedural",
        pdfPath: "/consents/Operation_Theatre_Register.pdf",
        version: "2.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Informed Consent for Anaesthesia",
        consentType: "ANAESTHESIA",
        description: "Consent form explaining all types of anaesthesia (General/Spinal/Regional/Local/Sedation), associated risks including drug reactions, dental injury, nerve injury, paralysis, brain damage, heart attack, and other rare complications. Trilingual: English, Hindi, Marathi.",
        category: "Surgical & Procedural",
        pdfPath: "/consents/Anaesthesia_Consent.pdf",
        version: "2.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Consent for Surgery/Operative Procedure",
        consentType: "SURGERY",
        description: "Authorization for surgical/operative procedures including anaesthesia, with declaration of medical conditions (hypertension, diabetes, bleeding disorders), drug allergies, consent for blood products, and clinical photography for educational purposes. Trilingual: English, Hindi, Marathi.",
        category: "Surgical & Procedural",
        pdfPath: "/consents/Surgery_Consent.pdf",
        version: "2.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Tubal Ligation Consent Form",
        consentType: "TUBAL_LIGATION",
        description: "Comprehensive consent form for female sterilization procedure including personal/family details, voluntary declarations, eligibility criteria, anaesthesia consent, and follow-up requirements. Confirms procedure is permanent and irreversible. Trilingual: English, Hindi, Marathi.",
        category: "Surgical & Procedural",
        pdfPath: "/consents/Tubal_Ligation_Consent.pdf",
        version: "2.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Plastic Surgery Consent Form",
        consentType: "PLASTIC_SURGERY",
        description: "Authorization for plastic/reconstructive surgery with acknowledgment that no guarantee is given regarding surgical outcomes. Includes consent for anaesthesia and use of medical records/photographs for documentation and educational purposes. Trilingual: English, Hindi, Marathi.",
        category: "Surgical & Procedural",
        pdfPath: "/consents/Plastic_Surgery_Consent.pdf",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Surgery Form",
        consentType: "SURGERY_FORM",
        description: "Comprehensive 5-page surgical procedure form including: Anesthesia Chart (patient identification, surgical team, premedication, monitoring, IV lines, anesthesia type), Pre-Operative Evaluation (ASA status, airway assessment, NBM status, vital signs, investigations, safety checklist), Surgical Safety Checklist Sign-In (patient verification, allergy assessment, anesthesia safety check), Surgical Safety Checklist Sign-Out (instrument/sponge/needle counts, specimen management, post-op instructions), and Operation Record. NABH-compliant documentation for complete surgical workflow. Trilingual: English, Hindi, Marathi.",
        category: "Surgical & Procedural",
        pdfPath: "/consents/Surgery_Procedure_Form.pdf",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      // === DIAGNOSTIC & TESTING ===
      {
        title: "HIV Test Informed Consent",
        consentType: "HIV_TEST",
        description: "Consent form for HIV blood test with detailed information about test purpose, window period limitations, results confidentiality, insurance coverage implications, and consent/decline options. Trilingual: English, Hindi, Marathi.",
        category: "Diagnostic & Testing",
        pdfPath: "/consents/HIV_Test_Consent.pdf",
        version: "2.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "HBsAg Test Informed Consent",
        consentType: "HBSAG_TEST",
        description: "Consent form for Hepatitis B Surface Antigen blood test with information about confirmatory testing requirements, results confidentiality, insurance coverage, and consent/decline options. Trilingual: English, Hindi, Marathi.",
        category: "Diagnostic & Testing",
        pdfPath: "/consents/HBsAg_Test_Consent.pdf",
        version: "2.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Injection Consent Form (OPD)",
        consentType: "INJECTION_OPD",
        description: "Consent form for OPD injections and medications with acknowledgment of possible side effects, adverse reactions, and confirmation of allergy/medical history disclosure. For outpatient procedural use. Trilingual: English, Hindi, Marathi.",
        category: "Diagnostic & Testing",
        pdfPath: "/consents/Injection_Consent_OPD.pdf",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      // === TREATMENT ===
      {
        title: "Consent for Blood/Blood Component Transfusion",
        consentType: "BLOOD_TRANSFUSION",
        description: "Consent form for blood or blood product transfusion with detailed explanation of risks associated with refusal including inadequate oxygen supply, organ damage, heart attack, stroke, inability to control bleeding, and death. Trilingual: English, Hindi, Marathi.",
        category: "Treatment",
        pdfPath: "/consents/Blood_Transfusion_Consent.pdf",
        version: "2.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      // === MATERNAL & NEONATAL ===
      {
        title: "Newborn Baby Consent Form",
        consentType: "NEWBORN_BABY",
        description: "Consent for medical examination, treatment, and necessary procedures for newborn babies including emergency procedures, vaccination, blood investigations, imaging studies, and routine neonatal care. Trilingual: English, Hindi, Marathi.",
        category: "Maternal & Neonatal",
        pdfPath: "/consents/Newborn_Baby_Consent.pdf",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      // === PATIENT EDUCATION ===
      {
        title: "Patient Counselling, Education & Documentation",
        consentType: "PATIENT_COUNSELLING",
        description: "Consent form confirming patient has received proper counselling and education regarding illness, diagnosis, treatment plan, medicines, procedures, risks, benefits, and alternatives. Includes documentation consent for hospital records. Trilingual: English, Hindi, Marathi.",
        category: "Legal & Administrative",
        pdfPath: "/consents/dynamic/PATIENT_COUNSELLING",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      // === NEW CONSENT FORMS (9 Additional) ===
      {
        title: "Patient Education Consent",
        consentType: "PATIENT_EDUCATION",
        description: "Acknowledgement that patient has been educated about health condition, disease process, preventive measures, medication schedule, dietary advice, physical activity, and warning signs. Trilingual: English, Hindi, Marathi.",
        category: "Patient Education",
        pdfPath: "/consents/dynamic/PATIENT_EDUCATION",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Billing Sheet Acknowledgement",
        consentType: "BILLING_ACKNOWLEDGEMENT",
        description: "Acknowledgement of hospital billing structure including consultation fees, investigation charges, procedure costs, room rent, consumables, and applicable taxes. Trilingual: English, Hindi, Marathi.",
        category: "Financial & Insurance",
        pdfPath: "/consents/dynamic/BILLING_ACKNOWLEDGEMENT",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "MJPJAY Scheme Consent",
        consentType: "MJPJAY_SCHEME",
        description: "Declaration of eligibility under MJPJAY scheme with authorization for hospital to upload medical details and submit claims as per scheme guidelines. Trilingual: English, Hindi, Marathi.",
        category: "Financial & Insurance",
        pdfPath: "/consents/dynamic/MJPJAY_SCHEME",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Minor/Intermediate Procedure Consent (Consent 2.5)",
        consentType: "MINOR_PROCEDURE",
        description: "Consent for minor or intermediate medical procedures with explanation of nature, purpose, benefits, and possible risks. No outcome guarantee provided. Trilingual: English, Hindi, Marathi.",
        category: "Surgical & Procedural",
        pdfPath: "/consents/dynamic/MINOR_PROCEDURE",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Physician Fitness Certificate Consent",
        consentType: "FITNESS_CERTIFICATE",
        description: "Consent for medical examination to assess physical and mental fitness. Certificate issued based on clinical findings. Trilingual: English, Hindi, Marathi.",
        category: "Legal & Administrative",
        pdfPath: "/consents/dynamic/FITNESS_CERTIFICATE",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Physiotherapy Consent",
        consentType: "PHYSIOTHERAPY",
        description: "Consent for physiotherapy treatment including explanation of treatment nature, expected benefits, duration, and possible discomfort. Trilingual: English, Hindi, Marathi.",
        category: "Therapeutic",
        pdfPath: "/consents/dynamic/PHYSIOTHERAPY",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Recovery Sheet Acknowledgement",
        consentType: "RECOVERY_SHEET",
        description: "Acknowledgement of recovery plan, medications, activity restrictions, wound care, warning signs, and follow-up schedule. Trilingual: English, Hindi, Marathi.",
        category: "Post-Operative",
        pdfPath: "/consents/dynamic/RECOVERY_SHEET",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "General Procedure Consent",
        consentType: "GENERAL_PROCEDURE",
        description: "Informed consent for planned medical or surgical procedure with understanding of nature, benefits, risks, alternatives, and possible complications. Trilingual: English, Hindi, Marathi.",
        category: "Surgical & Procedural",
        pdfPath: "/consents/dynamic/GENERAL_PROCEDURE",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Anaesthesia Type-Wise Consent",
        consentType: "ANAESTHESIA_TYPE",
        description: "Consent for specific type of anaesthesia (Local/Spinal/General/Regional) with explanation of purpose, risks, side effects, and alternatives. Trilingual: English, Hindi, Marathi.",
        category: "Surgical & Procedural",
        pdfPath: "/consents/dynamic/ANAESTHESIA_TYPE",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Anaesthesia High Risk Consent",
        consentType: "ANAESTHESIA_HIGH_RISK",
        description: "High-risk anaesthesia consent for patients with pre-existing conditions explaining potential complications, risks, and patient acknowledgement. Trilingual: English, Hindi, Marathi.",
        category: "Surgical & Procedural",
        pdfPath: "/consents/dynamic/ANAESTHESIA_HIGH_RISK",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Surgical High Risk Consent",
        consentType: "SURGICAL_HIGH_RISK",
        description: "High-risk surgical consent for patients undergoing surgery with elevated risks due to medical conditions, age, or associated illnesses. Trilingual: English, Hindi, Marathi.",
        category: "Surgical & Procedural",
        pdfPath: "/consents/dynamic/SURGICAL_HIGH_RISK",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Anaesthetist Notes - Format 1",
        consentType: "ANAESTHETIST_NOTES_F1",
        description: "Pre-anaesthetic assessment, anaesthesia plan, intra-operative notes, and post-anaesthesia plan documentation. Trilingual: English, Hindi, Marathi.",
        category: "Surgical & Procedural",
        pdfPath: "/consents/dynamic/ANAESTHETIST_NOTES_F1",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Anaesthetist Notes - Format 2",
        consentType: "ANAESTHETIST_NOTES_F2",
        description: "Detailed pre-anaesthetic evaluation with vitals, systemic examination, ASA grading, intra-operative record, and post-anaesthesia instructions. Trilingual: English, Hindi, Marathi.",
        category: "Surgical & Procedural",
        pdfPath: "/consents/dynamic/ANAESTHETIST_NOTES_F2",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "DAMA - Discharge Against Medical Advice",
        consentType: "DAMA_CONSENT",
        description: "Consent for patient leaving hospital against medical advice with risk acknowledgment. Trilingual: English, Hindi, Marathi.",
        category: "Discharge & Documentation",
        pdfPath: "/consents/dynamic/DAMA_CONSENT",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Absconding from Hospital Documentation",
        consentType: "ABSCONDING_DOC",
        description: "Documentation form for patients who leave without formal discharge. Trilingual: English, Hindi, Marathi.",
        category: "Discharge & Documentation",
        pdfPath: "/consents/dynamic/ABSCONDING_DOC",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Physical Restraint Request Form",
        consentType: "RESTRAINT_REQUEST",
        description: "Request form for physical restraint with safety justification. Trilingual: English, Hindi, Marathi.",
        category: "Patient Safety",
        pdfPath: "/consents/dynamic/RESTRAINT_REQUEST",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Physical Restraint Informed Consent",
        consentType: "RESTRAINT_CONSENT",
        description: "Informed consent for physical restraint application. Trilingual: English, Hindi, Marathi.",
        category: "Patient Safety",
        pdfPath: "/consents/dynamic/RESTRAINT_CONSENT",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Physical Restraint Monitoring Record",
        consentType: "RESTRAINT_MONITORING",
        description: "Continuous monitoring record for patients under physical restraint. Trilingual: English, Hindi, Marathi.",
        category: "Patient Safety",
        pdfPath: "/consents/dynamic/RESTRAINT_MONITORING",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "MTP - Medical Termination of Pregnancy Consent",
        consentType: "MTP_CONSENT",
        description: "Consent for medical termination of pregnancy as per MTP Act of India. Trilingual: English, Hindi, Marathi.",
        category: "Obstetrics & Gynecology",
        pdfPath: "/consents/dynamic/MTP_CONSENT",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Consent for Thrombolysis",
        consentType: "THROMBOLYSIS_CONSENT",
        description: "Digital consent for thrombolysis therapy to dissolve blood clots. Trilingual: English, Hindi, Marathi.",
        category: "Consent & Certification",
        pdfPath: "/consents/dynamic/THROMBOLYSIS_CONSENT",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Consent for Lumbar Puncture (LP)",
        consentType: "LUMBAR_PUNCTURE_CONSENT",
        description: "Digital consent for lumbar puncture procedure to collect cerebrospinal fluid (CSF) or administer medication. Includes explanation of risks like headache, back pain, bleeding, infection, nerve injury. Trilingual: English, Hindi, Marathi.",
        category: "Consent & Certification",
        pdfPath: "/consents/dynamic/LUMBAR_PUNCTURE_CONSENT",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Consent for Ventilator Support",
        consentType: "VENTILATOR_CONSENT",
        description: "Digital consent for ventilator support to assist or take over breathing. Includes explanation of risks like infection, lung injury, prolonged ventilation, difficulty in weaning, or risk to life. Trilingual: English, Hindi, Marathi.",
        category: "Consent & Certification",
        pdfPath: "/consents/dynamic/VENTILATOR_CONSENT",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Consent for Transfer for Diagnostic Purpose",
        consentType: "TRANSFER_DIAGNOSTIC_CONSENT",
        description: "Digital consent for temporary transfer of patient for diagnostic purposes such as investigations, imaging, or specialized tests not available at this hospital. Includes risks during transportation. Trilingual: English, Hindi, Marathi.",
        category: "Consent & Certification",
        pdfPath: "/consents/dynamic/TRANSFER_DIAGNOSTIC_CONSENT",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Consent for Intubation",
        consentType: "INTUBATION_CONSENT",
        description: "Digital consent for intubation procedure involving insertion of a tube into the airway to assist breathing. Includes explanation of risks like sore throat, injury to teeth/airway, bleeding, infection, difficulty in removal, or need for ventilator support. Trilingual: English, Hindi, Marathi.",
        category: "Consent & Certification",
        pdfPath: "/consents/dynamic/INTUBATION_CONSENT",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      },
      {
        title: "Consent for Central Line Insertion",
        consentType: "CENTRAL_LINE_CONSENT",
        description: "Digital consent for Central Venous Line insertion for administration of medications, fluids, blood products, nutrition, or monitoring. Includes risks like bleeding, infection, air embolism, clot formation. Trilingual: English, Hindi, Marathi.",
        category: "Consent & Certification",
        pdfPath: "/consents/dynamic/CENTRAL_LINE_CONSENT",
        version: "1.0",
        isActive: true,
        isBilingual: true,
        languages: "English, Hindi, Marathi"
      }
    ];

    // Filter out templates that already exist
    const newTemplates = templates.filter(t => !existingConsentTypes.has(t.consentType));
    
    if (newTemplates.length === 0) {
      console.log("All consent templates already exist, skipping seed...");
      return;
    }

    await db.insert(consentTemplates).values(newTemplates);
    console.log(`Consent templates seeded: ${newTemplates.length} new forms added (total: ${existing.length + newTemplates.length})`);
  }

  // ========== PATHOLOGY TESTS SEEDING ==========
  async seedPathologyTests(): Promise<void> {
    const existingTests = await db.select().from(labTestCatalog);
    if (existingTests.length >= 888) {
      console.log(`Pathology tests already exist (${existingTests.length} tests), skipping seed...`);
      return;
    }

    const fs = await import('fs');
    const path = await import('path');
    
    const filePath = path.join(process.cwd(), "attached_assets/CompleteTestList_1767070588504.xls");
    
    if (!fs.existsSync(filePath)) {
      console.log("Pathology tests file not found, skipping...");
      return;
    }

    console.log("Starting pathology tests seeding...");
    const content = fs.readFileSync(filePath, "utf-8");
    
    const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
    const cellRegex = /<td>([^<]*)<\/td>/g;
    
    interface TestData {
      testName: string;
      displayName: string;
      shortName: string;
      categoryName: string;
      charges: number;
    }
    
    const tests: TestData[] = [];
    let rowMatch;
    let isFirstRow = true;
    
    while ((rowMatch = rowRegex.exec(content)) !== null) {
      const rowContent = rowMatch[1];
      const cells: string[] = [];
      let cellMatch;
      
      while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
        cells.push(cellMatch[1].trim());
      }
      
      if (isFirstRow) {
        isFirstRow = false;
        continue;
      }
      
      if (cells.length >= 5) {
        const testName = cells[0] || "";
        const displayName = cells[1] || "";
        const shortName = cells[2] || "";
        const categoryName = cells[3] || "GENERAL";
        const charges = parseFloat(cells[4]) || 0;
        
        if (testName && testName !== "&nbsp;") {
          tests.push({
            testName: testName.trim(),
            displayName: displayName.trim(),
            shortName: shortName.trim(),
            categoryName: categoryName === "&nbsp;" ? "GENERAL" : categoryName.trim(),
            charges
          });
        }
      }
    }
    
    console.log(`Parsed ${tests.length} tests from Excel file`);
    
    const existingCodes = new Set(existingTests.map(t => t.testCode));
    let inserted = 0;
    
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      const prefix = test.testName.replace(/[^a-zA-Z0-9]/g, "").substring(0, 6).toUpperCase();
      const testCode = `PT-${prefix}-${String(i + 1).padStart(4, "0")}`;
      
      if (existingCodes.has(testCode)) continue;
      
      const categoryLower = test.categoryName.toLowerCase();
      let sampleType = "Blood/Serum";
      if (categoryLower.includes("urine")) sampleType = "Urine";
      else if (categoryLower.includes("blood") || categoryLower.includes("haematology")) sampleType = "Blood";
      else if (categoryLower.includes("serology")) sampleType = "Serum";
      else if (categoryLower.includes("micro") || categoryLower.includes("culture")) sampleType = "Swab/Culture";
      else if (categoryLower.includes("stool")) sampleType = "Stool";
      else if (categoryLower.includes("csf") || categoryLower.includes("fluid")) sampleType = "Body Fluid";
      else if (categoryLower.includes("histopathology") || categoryLower.includes("biopsy")) sampleType = "Tissue";
      else if (categoryLower.includes("biochemistry")) sampleType = "Serum";
      else if (categoryLower.includes("hormone")) sampleType = "Serum";
      else if (categoryLower.includes("vitamin")) sampleType = "Serum";
      else if (categoryLower.includes("immuno")) sampleType = "Serum";
      
      try {
        await db.insert(labTestCatalog).values({
          testCode,
          testName: test.displayName || test.testName,
          testCategory: test.categoryName,
          sampleType,
          description: `${test.testName} - ${test.shortName}`,
          price: String(test.charges || 0),
          turnaroundTime: "24-48 hours",
          isActive: true
        });
        inserted++;
      } catch (error: any) {
        if (!error.message?.includes("duplicate")) {
          console.error(`Error inserting test ${test.testName}:`, error.message);
        }
      }
    }
    
    console.log(`Pathology tests seeding complete: ${inserted} tests inserted`);
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

  // ========== PATIENT BILLING METHODS ==========
  async getPatientBill(id: string): Promise<PatientBill | undefined> {
    const result = await db.select().from(patientBills).where(eq(patientBills.id, id));
    return result[0];
  }

  async getPatientBillByPatientId(patientId: string): Promise<PatientBill | undefined> {
    const result = await db.select().from(patientBills)
      .where(eq(patientBills.patientId, patientId))
      .orderBy(desc(patientBills.createdAt));
    return result[0];
  }

  async getPatientBills(patientId: string): Promise<PatientBill[]> {
    return await db.select().from(patientBills)
      .where(eq(patientBills.patientId, patientId))
      .orderBy(desc(patientBills.createdAt));
  }

  async getPatientBillByAdmissionId(admissionId: string): Promise<PatientBill | undefined> {
    const result = await db.select().from(patientBills)
      .where(eq(patientBills.admissionId, admissionId));
    return result[0];
  }

  async getAllPatientBills(): Promise<PatientBill[]> {
    return await db.select().from(patientBills).orderBy(desc(patientBills.createdAt));
  }

  async getPendingBillRequests(): Promise<PatientBill[]> {
    return await db.select().from(patientBills)
      .where(eq(patientBills.status, "pending"))
      .orderBy(desc(patientBills.billRequestedAt));
  }

  async createPatientBill(bill: InsertPatientBill): Promise<PatientBill> {
    const roomCharges = parseFloat(bill.roomCharges?.toString() || "0");
    const doctorConsultation = parseFloat(bill.doctorConsultation?.toString() || "0");
    const labTests = parseFloat(bill.labTests?.toString() || "0");
    const medicines = parseFloat(bill.medicines?.toString() || "0");
    const inventoryCharges = parseFloat(bill.inventoryCharges?.toString() || "0");
    const otherFees = parseFloat(bill.otherFees?.toString() || "0");
    const paidAmount = parseFloat(bill.paidAmount?.toString() || "0");

    const totalAmount = roomCharges + doctorConsultation + labTests + medicines + inventoryCharges + otherFees;
    const balanceDue = totalAmount - paidAmount;

    const result = await db.insert(patientBills).values({
      ...bill,
      totalAmount: totalAmount.toFixed(2),
      balanceDue: balanceDue.toFixed(2),
    }).returning();
    return result[0];
  }

  async updatePatientBill(id: string, updates: Partial<InsertPatientBill>): Promise<PatientBill | undefined> {
    const existingBill = await this.getPatientBill(id);
    if (!existingBill) return undefined;

    const roomCharges = parseFloat(updates.roomCharges?.toString() || existingBill.roomCharges?.toString() || "0");
    const doctorConsultation = parseFloat(updates.doctorConsultation?.toString() || existingBill.doctorConsultation?.toString() || "0");
    const labTests = parseFloat(updates.labTests?.toString() || existingBill.labTests?.toString() || "0");
    const medicines = parseFloat(updates.medicines?.toString() || existingBill.medicines?.toString() || "0");
    const inventoryCharges = parseFloat(updates.inventoryCharges?.toString() || existingBill.inventoryCharges?.toString() || "0");
    const otherFees = parseFloat(updates.otherFees?.toString() || existingBill.otherFees?.toString() || "0");
    const paidAmount = parseFloat(updates.paidAmount?.toString() || existingBill.paidAmount?.toString() || "0");

    const totalAmount = roomCharges + doctorConsultation + labTests + medicines + inventoryCharges + otherFees;
    const balanceDue = totalAmount - paidAmount;

    let status = existingBill.status;
    if (balanceDue <= 0 && totalAmount > 0) {
      status = "paid";
    } else if (paidAmount > 0 && balanceDue > 0) {
      status = "partial";
    } else if (totalAmount > 0) {
      status = "pending";
    }

    const result = await db.update(patientBills)
      .set({
        ...updates,
        totalAmount: totalAmount.toFixed(2),
        balanceDue: balanceDue.toFixed(2),
        status,
        lastUpdatedAt: new Date(),
      })
      .where(eq(patientBills.id, id))
      .returning();
    return result[0];
  }

  async deletePatientBill(id: string): Promise<boolean> {
    const result = await db.delete(patientBills).where(eq(patientBills.id, id)).returning();
    return result.length > 0;
  }

  // ========== BILL PAYMENTS METHODS ==========
  async getBillPayments(billId: string): Promise<BillPayment[]> {
    return await db.select().from(billPayments)
      .where(eq(billPayments.billId, billId))
      .orderBy(desc(billPayments.paidAt));
  }

  async createBillPayment(payment: InsertBillPayment): Promise<BillPayment> {
    const result = await db.insert(billPayments).values(payment).returning();
    
    const bill = await this.getPatientBill(payment.billId);
    if (bill) {
      const newPaidAmount = parseFloat(bill.paidAmount?.toString() || "0") + parseFloat(payment.amount.toString());
      await this.updatePatientBill(payment.billId, {
        paidAmount: newPaidAmount.toFixed(2)
      } as any);
    }
    
    return result[0];
  }

  // ========== HEALTH TIPS METHODS ==========
  async getAllHealthTips(): Promise<HealthTip[]> {
    return await db.select().from(healthTips).orderBy(desc(healthTips.generatedAt));
  }

  async getActiveHealthTips(): Promise<HealthTip[]> {
    return await db.select().from(healthTips)
      .where(eq(healthTips.isActive, true))
      .orderBy(desc(healthTips.generatedAt));
  }

  async getHealthTipsByDate(date: string): Promise<HealthTip[]> {
    return await db.select().from(healthTips)
      .where(sql`DATE(${healthTips.generatedAt}) = ${date}`)
      .orderBy(desc(healthTips.generatedAt));
  }

  async getLatestHealthTip(): Promise<HealthTip | undefined> {
    const result = await db.select().from(healthTips)
      .where(eq(healthTips.isActive, true))
      .orderBy(desc(healthTips.generatedAt))
      .limit(1);
    return result[0];
  }

  async createHealthTip(tip: InsertHealthTip): Promise<HealthTip> {
    const result = await db.insert(healthTips).values(tip).returning();
    return result[0];
  }

  async updateHealthTip(id: string, updates: Partial<InsertHealthTip>): Promise<HealthTip | undefined> {
    const result = await db.update(healthTips)
      .set(updates)
      .where(eq(healthTips.id, id))
      .returning();
    return result[0];
  }

  async deleteHealthTip(id: string): Promise<boolean> {
    const result = await db.delete(healthTips).where(eq(healthTips.id, id)).returning();
    return result.length > 0;
  }

  // ========== SWAB MONITORING - AREA MASTER ==========
  async getAllSwabAreas(): Promise<SwabAreaMaster[]> {
    return await db.select().from(swabAreaMaster).orderBy(swabAreaMaster.areaName);
  }

  async getSwabArea(id: string): Promise<SwabAreaMaster | undefined> {
    const result = await db.select().from(swabAreaMaster).where(eq(swabAreaMaster.id, id));
    return result[0];
  }

  async getSwabAreasByType(areaType: string): Promise<SwabAreaMaster[]> {
    return await db.select().from(swabAreaMaster).where(eq(swabAreaMaster.areaType, areaType));
  }

  async createSwabArea(area: InsertSwabAreaMaster): Promise<SwabAreaMaster> {
    const result = await db.insert(swabAreaMaster).values(area).returning();
    return result[0];
  }

  async updateSwabArea(id: string, updates: Partial<InsertSwabAreaMaster>): Promise<SwabAreaMaster | undefined> {
    const result = await db.update(swabAreaMaster).set(updates).where(eq(swabAreaMaster.id, id)).returning();
    return result[0];
  }

  async deleteSwabArea(id: string): Promise<boolean> {
    const result = await db.delete(swabAreaMaster).where(eq(swabAreaMaster.id, id)).returning();
    return result.length > 0;
  }

  // ========== SWAB MONITORING - SAMPLING SITE MASTER ==========
  async getAllSwabSamplingSites(): Promise<SwabSamplingSiteMaster[]> {
    return await db.select().from(swabSamplingSiteMaster).orderBy(swabSamplingSiteMaster.siteName);
  }

  async getSwabSamplingSite(id: string): Promise<SwabSamplingSiteMaster | undefined> {
    const result = await db.select().from(swabSamplingSiteMaster).where(eq(swabSamplingSiteMaster.id, id));
    return result[0];
  }

  async createSwabSamplingSite(site: InsertSwabSamplingSiteMaster): Promise<SwabSamplingSiteMaster> {
    const result = await db.insert(swabSamplingSiteMaster).values(site).returning();
    return result[0];
  }

  async updateSwabSamplingSite(id: string, updates: Partial<InsertSwabSamplingSiteMaster>): Promise<SwabSamplingSiteMaster | undefined> {
    const result = await db.update(swabSamplingSiteMaster).set(updates).where(eq(swabSamplingSiteMaster.id, id)).returning();
    return result[0];
  }

  async deleteSwabSamplingSite(id: string): Promise<boolean> {
    const result = await db.delete(swabSamplingSiteMaster).where(eq(swabSamplingSiteMaster.id, id)).returning();
    return result.length > 0;
  }

  // ========== SWAB MONITORING - ORGANISM MASTER ==========
  async getAllSwabOrganisms(): Promise<SwabOrganismMaster[]> {
    return await db.select().from(swabOrganismMaster).orderBy(swabOrganismMaster.organismName);
  }

  async getSwabOrganism(id: string): Promise<SwabOrganismMaster | undefined> {
    const result = await db.select().from(swabOrganismMaster).where(eq(swabOrganismMaster.id, id));
    return result[0];
  }

  async createSwabOrganism(organism: InsertSwabOrganismMaster): Promise<SwabOrganismMaster> {
    const result = await db.insert(swabOrganismMaster).values(organism).returning();
    return result[0];
  }

  async updateSwabOrganism(id: string, updates: Partial<InsertSwabOrganismMaster>): Promise<SwabOrganismMaster | undefined> {
    const result = await db.update(swabOrganismMaster).set(updates).where(eq(swabOrganismMaster.id, id)).returning();
    return result[0];
  }

  async deleteSwabOrganism(id: string): Promise<boolean> {
    const result = await db.delete(swabOrganismMaster).where(eq(swabOrganismMaster.id, id)).returning();
    return result.length > 0;
  }

  // ========== SWAB COLLECTION ==========
  async getAllSwabCollections(): Promise<SwabCollection[]> {
    return await db.select().from(swabCollection).orderBy(desc(swabCollection.collectionDate));
  }

  async getSwabCollection(id: string): Promise<SwabCollection | undefined> {
    const result = await db.select().from(swabCollection).where(eq(swabCollection.id, id));
    return result[0];
  }

  async getSwabCollectionsByArea(areaId: string): Promise<SwabCollection[]> {
    return await db.select().from(swabCollection).where(eq(swabCollection.areaId, areaId)).orderBy(desc(swabCollection.collectionDate));
  }

  async getSwabCollectionsByStatus(status: string): Promise<SwabCollection[]> {
    return await db.select().from(swabCollection).where(eq(swabCollection.status, status)).orderBy(desc(swabCollection.collectionDate));
  }

  async createSwabCollection(collection: InsertSwabCollection): Promise<SwabCollection> {
    const swabId = `SWB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const result = await db.insert(swabCollection).values({
      ...collection,
      swabId,
      status: "pending",
    }).returning();
    return result[0];
  }

  async updateSwabCollection(id: string, updates: Partial<SwabCollection>): Promise<SwabCollection | undefined> {
    const result = await db.update(swabCollection)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(swabCollection.id, id))
      .returning();
    return result[0];
  }

  // ========== SWAB LAB RESULTS ==========
  async getAllSwabLabResults(): Promise<SwabLabResult[]> {
    return await db.select().from(swabLabResults).orderBy(desc(swabLabResults.resultDate));
  }

  async getSwabLabResult(id: string): Promise<SwabLabResult | undefined> {
    const result = await db.select().from(swabLabResults).where(eq(swabLabResults.id, id));
    return result[0];
  }

  async getSwabLabResultByCollection(collectionId: string): Promise<SwabLabResult | undefined> {
    const result = await db.select().from(swabLabResults).where(eq(swabLabResults.swabCollectionId, collectionId));
    return result[0];
  }

  async createSwabLabResult(result: InsertSwabLabResult): Promise<SwabLabResult> {
    const insertedResult = await db.insert(swabLabResults).values(result).returning();
    return insertedResult[0];
  }

  // ========== CAPA ACTIONS ==========
  async getAllSwabCapaActions(): Promise<SwabCapaAction[]> {
    return await db.select().from(swabCapaActions).orderBy(desc(swabCapaActions.createdAt));
  }

  async getSwabCapaAction(id: string): Promise<SwabCapaAction | undefined> {
    const result = await db.select().from(swabCapaActions).where(eq(swabCapaActions.id, id));
    return result[0];
  }

  async getSwabCapaActionsByStatus(status: string): Promise<SwabCapaAction[]> {
    return await db.select().from(swabCapaActions).where(eq(swabCapaActions.status, status)).orderBy(desc(swabCapaActions.createdAt));
  }

  async getSwabCapaActionByCollection(collectionId: string): Promise<SwabCapaAction | undefined> {
    const result = await db.select().from(swabCapaActions).where(eq(swabCapaActions.swabCollectionId, collectionId));
    return result[0];
  }

  async createSwabCapaAction(capa: InsertSwabCapaAction): Promise<SwabCapaAction> {
    const result = await db.insert(swabCapaActions).values(capa).returning();
    return result[0];
  }

  async updateSwabCapaAction(id: string, updates: Partial<SwabCapaAction>): Promise<SwabCapaAction | undefined> {
    const result = await db.update(swabCapaActions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(swabCapaActions.id, id))
      .returning();
    return result[0];
  }

  async closeSwabCapaAction(id: string, closedBy: string, closedByName: string, closureRemarks: string): Promise<SwabCapaAction | undefined> {
    const result = await db.update(swabCapaActions)
      .set({
        status: "closed",
        closedBy,
        closedByName,
        closureRemarks,
        closedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(swabCapaActions.id, id))
      .returning();
    return result[0];
  }

  // ========== SWAB AUDIT LOGS ==========
  async getAllSwabAuditLogs(): Promise<SwabAuditLog[]> {
    return await db.select().from(swabAuditLogs).orderBy(desc(swabAuditLogs.createdAt));
  }

  async getSwabAuditLogsByEntity(entityType: string, entityId: string): Promise<SwabAuditLog[]> {
    return await db.select().from(swabAuditLogs)
      .where(and(eq(swabAuditLogs.entityType, entityType), eq(swabAuditLogs.entityId, entityId)))
      .orderBy(desc(swabAuditLogs.createdAt));
  }

  async createSwabAuditLog(log: InsertSwabAuditLog): Promise<SwabAuditLog> {
    const result = await db.insert(swabAuditLogs).values(log).returning();
    return result[0];
  }

  // ========== DISEASE CATALOG ==========
  async getAllDiseases(): Promise<DiseaseCatalog[]> {
    return await db.select().from(diseaseCatalog).where(eq(diseaseCatalog.isActive, true)).orderBy(diseaseCatalog.diseaseName);
  }

  async getDiseasesByCategory(category: string): Promise<DiseaseCatalog[]> {
    return await db.select().from(diseaseCatalog).where(and(eq(diseaseCatalog.category, category), eq(diseaseCatalog.isActive, true)));
  }

  async getDisease(id: string): Promise<DiseaseCatalog | undefined> {
    const result = await db.select().from(diseaseCatalog).where(eq(diseaseCatalog.id, id));
    return result[0];
  }

  async createDisease(disease: InsertDiseaseCatalog): Promise<DiseaseCatalog> {
    const result = await db.insert(diseaseCatalog).values(disease).returning();
    return result[0];
  }

  async updateDisease(id: string, updates: Partial<InsertDiseaseCatalog>): Promise<DiseaseCatalog | undefined> {
    const result = await db.update(diseaseCatalog).set({ ...updates, updatedAt: new Date() }).where(eq(diseaseCatalog.id, id)).returning();
    return result[0];
  }

  // ========== DIET TEMPLATES ==========
  async getAllDietTemplates(): Promise<DietTemplate[]> {
    return await db.select().from(dietTemplates).where(eq(dietTemplates.isActive, true));
  }

  async getDietTemplatesByDisease(diseaseId: string): Promise<DietTemplate[]> {
    return await db.select().from(dietTemplates).where(and(eq(dietTemplates.diseaseId, diseaseId), eq(dietTemplates.isActive, true)));
  }

  async getDietTemplate(id: string): Promise<DietTemplate | undefined> {
    const result = await db.select().from(dietTemplates).where(eq(dietTemplates.id, id));
    return result[0];
  }

  async createDietTemplate(template: InsertDietTemplate): Promise<DietTemplate> {
    const result = await db.insert(dietTemplates).values(template).returning();
    return result[0];
  }

  async updateDietTemplate(id: string, updates: Partial<InsertDietTemplate>): Promise<DietTemplate | undefined> {
    const result = await db.update(dietTemplates).set(updates).where(eq(dietTemplates.id, id)).returning();
    return result[0];
  }

  // ========== MEDICATION SCHEDULE TEMPLATES ==========
  async getAllMedicationScheduleTemplates(): Promise<MedicationScheduleTemplate[]> {
    return await db.select().from(medicationScheduleTemplates).where(eq(medicationScheduleTemplates.isActive, true));
  }

  async getMedicationScheduleTemplatesByDisease(diseaseId: string): Promise<MedicationScheduleTemplate[]> {
    return await db.select().from(medicationScheduleTemplates).where(and(eq(medicationScheduleTemplates.diseaseId, diseaseId), eq(medicationScheduleTemplates.isActive, true)));
  }

  async createMedicationScheduleTemplate(template: InsertMedicationScheduleTemplate): Promise<MedicationScheduleTemplate> {
    const result = await db.insert(medicationScheduleTemplates).values(template).returning();
    return result[0];
  }

  // ========== PATIENT DISEASE ASSIGNMENTS ==========
  async getAllPatientDiseaseAssignments(): Promise<PatientDiseaseAssignment[]> {
    return await db.select().from(patientDiseaseAssignments).where(eq(patientDiseaseAssignments.isActive, true)).orderBy(desc(patientDiseaseAssignments.createdAt));
  }

  async getPatientDiseaseAssignmentsByPatient(patientId: string): Promise<PatientDiseaseAssignment[]> {
    return await db.select().from(patientDiseaseAssignments).where(and(eq(patientDiseaseAssignments.patientId, patientId), eq(patientDiseaseAssignments.isActive, true)));
  }

  async getPatientDiseaseAssignment(id: string): Promise<PatientDiseaseAssignment | undefined> {
    const result = await db.select().from(patientDiseaseAssignments).where(eq(patientDiseaseAssignments.id, id));
    return result[0];
  }

  async createPatientDiseaseAssignment(assignment: InsertPatientDiseaseAssignment): Promise<PatientDiseaseAssignment> {
    const result = await db.insert(patientDiseaseAssignments).values(assignment).returning();
    return result[0];
  }

  async updatePatientDiseaseAssignment(id: string, updates: Partial<PatientDiseaseAssignment>): Promise<PatientDiseaseAssignment | undefined> {
    const result = await db.update(patientDiseaseAssignments).set({ ...updates, updatedAt: new Date() }).where(eq(patientDiseaseAssignments.id, id)).returning();
    return result[0];
  }

  // ========== PERSONALIZED CARE PLANS ==========
  async getPersonalizedCarePlansByPatient(patientId: string): Promise<PersonalizedCarePlan[]> {
    return await db.select().from(personalizedCarePlans).where(and(eq(personalizedCarePlans.patientId, patientId), eq(personalizedCarePlans.isActive, true))).orderBy(desc(personalizedCarePlans.createdAt));
  }

  async getPersonalizedCarePlan(id: string): Promise<PersonalizedCarePlan | undefined> {
    const result = await db.select().from(personalizedCarePlans).where(eq(personalizedCarePlans.id, id));
    return result[0];
  }

  async getPersonalizedCarePlanByAssignment(assignmentId: string): Promise<PersonalizedCarePlan | undefined> {
    const result = await db.select().from(personalizedCarePlans).where(and(eq(personalizedCarePlans.assignmentId, assignmentId), eq(personalizedCarePlans.isActive, true)));
    return result[0];
  }

  async createPersonalizedCarePlan(plan: InsertPersonalizedCarePlan): Promise<PersonalizedCarePlan> {
    const result = await db.insert(personalizedCarePlans).values(plan).returning();
    return result[0];
  }

  async updatePersonalizedCarePlan(id: string, updates: Partial<PersonalizedCarePlan>): Promise<PersonalizedCarePlan | undefined> {
    const result = await db.update(personalizedCarePlans).set({ ...updates, updatedAt: new Date() }).where(eq(personalizedCarePlans.id, id)).returning();
    return result[0];
  }

  // ========== MEDICAL STORE MANAGEMENT ==========
  async getAllMedicalStores(): Promise<MedicalStore[]> {
    return await db.select().from(medicalStores).orderBy(desc(medicalStores.createdAt));
  }

  async getMedicalStore(id: string): Promise<MedicalStore | undefined> {
    const result = await db.select().from(medicalStores).where(eq(medicalStores.id, id));
    return result[0];
  }

  async getMedicalStoreByCode(code: string): Promise<MedicalStore | undefined> {
    const result = await db.select().from(medicalStores).where(eq(medicalStores.storeCode, code));
    return result[0];
  }

  async createMedicalStore(store: InsertMedicalStore): Promise<MedicalStore> {
    const result = await db.insert(medicalStores).values(store).returning();
    return result[0];
  }

  async updateMedicalStore(id: string, updates: Partial<InsertMedicalStore>): Promise<MedicalStore | undefined> {
    const result = await db.update(medicalStores).set({ ...updates, updatedAt: new Date() }).where(eq(medicalStores.id, id)).returning();
    return result[0];
  }

  async deleteMedicalStore(id: string): Promise<boolean> {
    const result = await db.delete(medicalStores).where(eq(medicalStores.id, id)).returning();
    return result.length > 0;
  }

  // ========== MEDICAL STORE USERS ==========
  async getMedicalStoreUsersByStore(storeId: string): Promise<MedicalStoreUser[]> {
    return await db.select().from(medicalStoreUsers).where(eq(medicalStoreUsers.storeId, storeId));
  }

  async getMedicalStoreUserByUserId(userId: string): Promise<MedicalStoreUser | undefined> {
    const result = await db.select().from(medicalStoreUsers).where(eq(medicalStoreUsers.userId, userId));
    return result[0];
  }

  async createMedicalStoreUser(user: InsertMedicalStoreUser): Promise<MedicalStoreUser> {
    const result = await db.insert(medicalStoreUsers).values(user).returning();
    return result[0];
  }

  async updateMedicalStoreUser(id: string, updates: Partial<InsertMedicalStoreUser>): Promise<MedicalStoreUser | undefined> {
    const result = await db.update(medicalStoreUsers).set({ ...updates, updatedAt: new Date() }).where(eq(medicalStoreUsers.id, id)).returning();
    return result[0];
  }

  // ========== MEDICAL STORE INVENTORY ==========
  async getMedicalStoreInventory(storeId: string): Promise<MedicalStoreInventory[]> {
    return await db.select().from(medicalStoreInventory).where(eq(medicalStoreInventory.storeId, storeId)).orderBy(medicalStoreInventory.medicineName);
  }

  async createMedicalStoreInventoryItem(item: InsertMedicalStoreInventory): Promise<MedicalStoreInventory> {
    const result = await db.insert(medicalStoreInventory).values(item).returning();
    return result[0];
  }

  async updateMedicalStoreInventoryItem(id: string, updates: Partial<InsertMedicalStoreInventory>): Promise<MedicalStoreInventory | undefined> {
    const result = await db.update(medicalStoreInventory).set({ ...updates, updatedAt: new Date() }).where(eq(medicalStoreInventory.id, id)).returning();
    return result[0];
  }

  async deleteMedicalStoreInventoryItem(id: string): Promise<boolean> {
    const result = await db.delete(medicalStoreInventory).where(eq(medicalStoreInventory.id, id)).returning();
    return result.length > 0;
  }

  // ========== PRESCRIPTION DISPENSING ==========
  async getAllPrescriptionDispensing(): Promise<PrescriptionDispensing[]> {
    return await db.select().from(prescriptionDispensing).orderBy(desc(prescriptionDispensing.createdAt));
  }

  async getPrescriptionDispensingByStore(storeId: string): Promise<PrescriptionDispensing[]> {
    return await db.select().from(prescriptionDispensing).where(eq(prescriptionDispensing.storeId, storeId)).orderBy(desc(prescriptionDispensing.createdAt));
  }

  async getPrescriptionDispensingByPrescription(prescriptionId: string): Promise<PrescriptionDispensing[]> {
    return await db.select().from(prescriptionDispensing).where(eq(prescriptionDispensing.prescriptionId, prescriptionId));
  }

  async createPrescriptionDispensing(dispensing: InsertPrescriptionDispensing): Promise<PrescriptionDispensing> {
    const result = await db.insert(prescriptionDispensing).values(dispensing).returning();
    return result[0];
  }

  async updatePrescriptionDispensing(id: string, updates: Partial<InsertPrescriptionDispensing>): Promise<PrescriptionDispensing | undefined> {
    const result = await db.update(prescriptionDispensing).set({ ...updates, updatedAt: new Date() }).where(eq(prescriptionDispensing.id, id)).returning();
    return result[0];
  }

  // ========== DISPENSING ITEMS ==========
  async getDispensingItemsByDispensing(dispensingId: string): Promise<DispensingItem[]> {
    return await db.select().from(dispensingItems).where(eq(dispensingItems.dispensingId, dispensingId));
  }

  async createDispensingItem(item: InsertDispensingItem): Promise<DispensingItem> {
    const result = await db.insert(dispensingItems).values(item).returning();
    return result[0];
  }

  // ========== MEDICAL STORE BILLS ==========
  async getAllMedicalStoreBills(): Promise<MedicalStoreBill[]> {
    return await db.select().from(medicalStoreBills).orderBy(desc(medicalStoreBills.createdAt));
  }

  async getMedicalStoreBillsByStore(storeId: string): Promise<MedicalStoreBill[]> {
    return await db.select().from(medicalStoreBills).where(eq(medicalStoreBills.storeId, storeId)).orderBy(desc(medicalStoreBills.createdAt));
  }

  async createMedicalStoreBill(bill: InsertMedicalStoreBill): Promise<MedicalStoreBill> {
    const result = await db.insert(medicalStoreBills).values(bill).returning();
    return result[0];
  }

  async updateMedicalStoreBill(id: string, updates: Partial<InsertMedicalStoreBill>): Promise<MedicalStoreBill | undefined> {
    const result = await db.update(medicalStoreBills).set({ ...updates, updatedAt: new Date() }).where(eq(medicalStoreBills.id, id)).returning();
    return result[0];
  }

  // ========== MEDICAL STORE ACCESS LOGS ==========
  async getMedicalStoreAccessLogs(storeId?: string): Promise<MedicalStoreAccessLog[]> {
    if (storeId) {
      return await db.select().from(medicalStoreAccessLogs).where(eq(medicalStoreAccessLogs.storeId, storeId)).orderBy(desc(medicalStoreAccessLogs.timestamp));
    }
    return await db.select().from(medicalStoreAccessLogs).orderBy(desc(medicalStoreAccessLogs.timestamp));
  }

  async createMedicalStoreAccessLog(log: InsertMedicalStoreAccessLog): Promise<MedicalStoreAccessLog> {
    const result = await db.insert(medicalStoreAccessLogs).values(log).returning();
    return result[0];
  }

  // ==================== PATHOLOGY LAB MODULE ====================

  // ========== PATHOLOGY LABS ==========
  async getAllPathologyLabs(): Promise<PathologyLab[]> {
    return await db.select().from(pathologyLabs).orderBy(desc(pathologyLabs.createdAt));
  }

  async getPathologyLab(id: string): Promise<PathologyLab | undefined> {
    const result = await db.select().from(pathologyLabs).where(eq(pathologyLabs.id, id));
    return result[0];
  }

  async getPathologyLabByCode(code: string): Promise<PathologyLab | undefined> {
    const result = await db.select().from(pathologyLabs).where(eq(pathologyLabs.labCode, code));
    return result[0];
  }

  async createPathologyLab(lab: InsertPathologyLab): Promise<PathologyLab> {
    const result = await db.insert(pathologyLabs).values(lab).returning();
    return result[0];
  }

  async updatePathologyLab(id: string, updates: Partial<InsertPathologyLab>): Promise<PathologyLab | undefined> {
    const result = await db.update(pathologyLabs).set({ ...updates, updatedAt: new Date() }).where(eq(pathologyLabs.id, id)).returning();
    return result[0];
  }

  async deletePathologyLab(id: string): Promise<boolean> {
    const result = await db.delete(pathologyLabs).where(eq(pathologyLabs.id, id)).returning();
    return result.length > 0;
  }

  // ========== LAB TEST CATALOG ==========
  async getAllLabTests(): Promise<LabTestCatalog[]> {
    return await db.select().from(labTestCatalog).orderBy(labTestCatalog.testName);
  }

  async getLabTest(id: string): Promise<LabTestCatalog | undefined> {
    const result = await db.select().from(labTestCatalog).where(eq(labTestCatalog.id, id));
    return result[0];
  }

  async getLabTestByCode(code: string): Promise<LabTestCatalog | undefined> {
    const result = await db.select().from(labTestCatalog).where(eq(labTestCatalog.testCode, code));
    return result[0];
  }

  async createLabTest(test: InsertLabTestCatalog): Promise<LabTestCatalog> {
    const result = await db.insert(labTestCatalog).values(test).returning();
    return result[0];
  }

  async updateLabTest(id: string, updates: Partial<InsertLabTestCatalog>): Promise<LabTestCatalog | undefined> {
    const result = await db.update(labTestCatalog).set({ ...updates, updatedAt: new Date() }).where(eq(labTestCatalog.id, id)).returning();
    return result[0];
  }

  async deleteLabTest(id: string): Promise<boolean> {
    const result = await db.delete(labTestCatalog).where(eq(labTestCatalog.id, id)).returning();
    return result.length > 0;
  }

  // ========== LAB TEST ORDERS ==========
  async getAllLabTestOrders(): Promise<LabTestOrder[]> {
    return await db.select().from(labTestOrders).orderBy(desc(labTestOrders.createdAt));
  }

  async getLabTestOrder(id: string): Promise<LabTestOrder | undefined> {
    const result = await db.select().from(labTestOrders).where(eq(labTestOrders.id, id));
    return result[0];
  }

  async getLabTestOrdersByPatient(patientId: string): Promise<LabTestOrder[]> {
    return await db.select().from(labTestOrders).where(eq(labTestOrders.patientId, patientId)).orderBy(desc(labTestOrders.createdAt));
  }

  async getLabTestOrdersByDoctor(doctorId: string): Promise<LabTestOrder[]> {
    return await db.select().from(labTestOrders).where(eq(labTestOrders.doctorId, doctorId)).orderBy(desc(labTestOrders.createdAt));
  }

  async getLabTestOrdersByLab(labId: string): Promise<LabTestOrder[]> {
    return await db.select().from(labTestOrders).where(eq(labTestOrders.assignedLabId, labId)).orderBy(desc(labTestOrders.createdAt));
  }

  async createLabTestOrder(order: InsertLabTestOrder): Promise<LabTestOrder> {
    const result = await db.insert(labTestOrders).values(order).returning();
    return result[0];
  }

  async ensureLabTestOrderSequence(): Promise<void> {
    // Create sequence if it doesn't exist - safe to call multiple times
    await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS lab_test_order_seq START 1`);
  }

  async createLabTestOrdersBatch(ordersWithoutNumbers: Omit<InsertLabTestOrder, "orderNumber">[]): Promise<LabTestOrder[]> {
    // Use transaction for atomic batch insert - all succeed or all fail
    // Uses PostgreSQL sequence for concurrency-safe unique order numbers
    const createdOrders = await db.transaction(async (tx) => {
      const results: LabTestOrder[] = [];
      const year = new Date().getFullYear();
      
      for (const order of ordersWithoutNumbers) {
        // Use nextval() for guaranteed unique sequential numbers under concurrency
        // Drizzle execute returns { rows: [...] } format
        const seqResult = await tx.execute(sql`SELECT nextval('lab_test_order_seq') as seq_num`);
        const seqNum = Number((seqResult.rows as any[])[0]?.seq_num ?? 0);
        if (!seqNum) {
          throw new Error("Failed to generate order number from sequence");
        }
        const orderNumber = `LAB-${year}-${String(seqNum).padStart(6, '0')}`;
        
        const [created] = await tx.insert(labTestOrders).values({ ...order, orderNumber }).returning();
        results.push(created);
      }
      return results;
    });
    return createdOrders;
  }

  async updateLabTestOrder(id: string, updates: Partial<InsertLabTestOrder>): Promise<LabTestOrder | undefined> {
    const result = await db.update(labTestOrders).set({ ...updates, updatedAt: new Date() }).where(eq(labTestOrders.id, id)).returning();
    return result[0];
  }

  // ========== SAMPLE COLLECTIONS ==========
  async getAllSampleCollections(): Promise<SampleCollection[]> {
    return await db.select().from(sampleCollections).orderBy(desc(sampleCollections.createdAt));
  }

  async getSampleCollection(id: string): Promise<SampleCollection | undefined> {
    const result = await db.select().from(sampleCollections).where(eq(sampleCollections.id, id));
    return result[0];
  }

  async getSampleCollectionsByOrder(orderId: string): Promise<SampleCollection[]> {
    return await db.select().from(sampleCollections).where(eq(sampleCollections.orderId, orderId)).orderBy(desc(sampleCollections.createdAt));
  }

  async createSampleCollection(sample: InsertSampleCollection): Promise<SampleCollection> {
    const result = await db.insert(sampleCollections).values(sample).returning();
    return result[0];
  }

  async updateSampleCollection(id: string, updates: Partial<InsertSampleCollection>): Promise<SampleCollection | undefined> {
    const result = await db.update(sampleCollections).set({ ...updates, updatedAt: new Date() }).where(eq(sampleCollections.id, id)).returning();
    return result[0];
  }

  // ========== LAB REPORTS ==========
  async getAllLabReports(): Promise<LabReport[]> {
    return await db.select().from(labReports).orderBy(desc(labReports.createdAt));
  }

  async getLabReport(id: string): Promise<LabReport | undefined> {
    const result = await db.select().from(labReports).where(eq(labReports.id, id));
    return result[0];
  }

  async getLabReportsByPatient(patientId: string): Promise<LabReport[]> {
    return await db.select().from(labReports).where(eq(labReports.patientId, patientId)).orderBy(desc(labReports.createdAt));
  }

  async getLabReportsByDoctor(doctorId: string): Promise<LabReport[]> {
    return await db.select().from(labReports).where(eq(labReports.doctorId, doctorId)).orderBy(desc(labReports.createdAt));
  }

  async getLabReportsByLab(labId: string): Promise<LabReport[]> {
    return await db.select().from(labReports).where(eq(labReports.labId, labId)).orderBy(desc(labReports.createdAt));
  }

  async createLabReport(report: InsertLabReport): Promise<LabReport> {
    const result = await db.insert(labReports).values(report).returning();
    return result[0];
  }

  async updateLabReport(id: string, updates: Partial<InsertLabReport>): Promise<LabReport | undefined> {
    const result = await db.update(labReports).set({ ...updates, updatedAt: new Date() }).where(eq(labReports.id, id)).returning();
    return result[0];
  }

  // ========== LAB REPORT RESULTS ==========
  async getLabReportResults(reportId: string): Promise<LabReportResult[]> {
    return await db.select().from(labReportResults).where(eq(labReportResults.reportId, reportId));
  }

  async createLabReportResult(result: InsertLabReportResult): Promise<LabReportResult> {
    const insertResult = await db.insert(labReportResults).values(result).returning();
    return insertResult[0];
  }

  // ========== PATHOLOGY LAB ACCESS LOGS ==========
  async getPathologyLabAccessLogs(labId?: string): Promise<PathologyLabAccessLog[]> {
    if (labId) {
      return await db.select().from(pathologyLabAccessLogs).where(eq(pathologyLabAccessLogs.labId, labId)).orderBy(desc(pathologyLabAccessLogs.timestamp));
    }
    return await db.select().from(pathologyLabAccessLogs).orderBy(desc(pathologyLabAccessLogs.timestamp));
  }

  async createPathologyLabAccessLog(log: InsertPathologyLabAccessLog): Promise<PathologyLabAccessLog> {
    const result = await db.insert(pathologyLabAccessLogs).values(log).returning();
    return result[0];
  }

  // ========== STAFF MASTER METHODS ==========
  async getAllStaffMaster(): Promise<StaffMaster[]> {
    return await db.select().from(staffMaster).orderBy(desc(staffMaster.createdAt));
  }

  async getStaffMaster(id: string): Promise<StaffMaster | undefined> {
    const result = await db.select().from(staffMaster).where(eq(staffMaster.id, id));
    return result[0];
  }

  async getStaffMasterByUserId(userId: string): Promise<StaffMaster | undefined> {
    const result = await db.select().from(staffMaster).where(eq(staffMaster.userId, userId));
    return result[0];
  }

  async getStaffMasterByEmployeeCode(employeeCode: string): Promise<StaffMaster | undefined> {
    const result = await db.select().from(staffMaster).where(eq(staffMaster.employeeCode, employeeCode));
    return result[0];
  }

  async getStaffMasterByEmail(email: string): Promise<StaffMaster | undefined> {
    const result = await db.select().from(staffMaster).where(eq(staffMaster.email, email));
    return result[0];
  }

  async getStaffMasterByDepartment(department: string): Promise<StaffMaster[]> {
    return await db.select().from(staffMaster).where(eq(staffMaster.department, department)).orderBy(staffMaster.fullName);
  }

  async getStaffMasterByRole(role: string): Promise<StaffMaster[]> {
    return await db.select().from(staffMaster).where(eq(staffMaster.role, role)).orderBy(staffMaster.fullName);
  }

  async createStaffMaster(staff: InsertStaffMaster): Promise<StaffMaster> {
    const result = await db.insert(staffMaster).values(staff).returning();
    return result[0];
  }

  async updateStaffMaster(id: string, updates: Partial<InsertStaffMaster>): Promise<StaffMaster | undefined> {
    const result = await db.update(staffMaster).set({ ...updates, updatedAt: new Date() }).where(eq(staffMaster.id, id)).returning();
    return result[0];
  }

  async deleteStaffMaster(id: string): Promise<boolean> {
    const result = await db.delete(staffMaster).where(eq(staffMaster.id, id)).returning();
    return result.length > 0;
  }

  // ========== SHIFT ROSTER METHODS ==========
  async getAllShiftRoster(): Promise<ShiftRoster[]> {
    return await db.select().from(shiftRoster).orderBy(desc(shiftRoster.shiftDate));
  }

  async getShiftRoster(id: string): Promise<ShiftRoster | undefined> {
    const result = await db.select().from(shiftRoster).where(eq(shiftRoster.id, id));
    return result[0];
  }

  async getShiftRosterByStaff(staffId: string): Promise<ShiftRoster[]> {
    return await db.select().from(shiftRoster).where(eq(shiftRoster.staffId, staffId)).orderBy(desc(shiftRoster.shiftDate));
  }

  async getShiftRosterByDate(date: string): Promise<ShiftRoster[]> {
    return await db.select().from(shiftRoster).where(eq(shiftRoster.shiftDate, date)).orderBy(shiftRoster.startTime);
  }

  async getShiftRosterByDateRange(startDate: string, endDate: string): Promise<ShiftRoster[]> {
    return await db.select().from(shiftRoster)
      .where(and(
        sql`${shiftRoster.shiftDate} >= ${startDate}`,
        sql`${shiftRoster.shiftDate} <= ${endDate}`
      ))
      .orderBy(shiftRoster.shiftDate, shiftRoster.startTime);
  }

  async getShiftRosterByDepartment(department: string): Promise<ShiftRoster[]> {
    return await db.select().from(shiftRoster).where(eq(shiftRoster.department, department)).orderBy(desc(shiftRoster.shiftDate));
  }

  async createShiftRoster(shift: InsertShiftRoster): Promise<ShiftRoster> {
    const result = await db.insert(shiftRoster).values(shift).returning();
    return result[0];
  }

  async updateShiftRoster(id: string, updates: Partial<InsertShiftRoster>): Promise<ShiftRoster | undefined> {
    const result = await db.update(shiftRoster).set({ ...updates, updatedAt: new Date() }).where(eq(shiftRoster.id, id)).returning();
    return result[0];
  }

  async deleteShiftRoster(id: string): Promise<boolean> {
    const result = await db.delete(shiftRoster).where(eq(shiftRoster.id, id)).returning();
    return result.length > 0;
  }

  // ========== TASK LOGS METHODS ==========
  async getAllTaskLogs(): Promise<TaskLog[]> {
    return await db.select().from(taskLogs).orderBy(desc(taskLogs.createdAt));
  }

  async getTaskLog(id: string): Promise<TaskLog | undefined> {
    const result = await db.select().from(taskLogs).where(eq(taskLogs.id, id));
    return result[0];
  }

  async getTaskLogsByStaff(staffId: string): Promise<TaskLog[]> {
    return await db.select().from(taskLogs).where(eq(taskLogs.staffId, staffId)).orderBy(desc(taskLogs.createdAt));
  }

  async getTaskLogsByDepartment(department: string): Promise<TaskLog[]> {
    return await db.select().from(taskLogs).where(eq(taskLogs.department, department)).orderBy(desc(taskLogs.createdAt));
  }

  async getTaskLogsByStatus(status: string): Promise<TaskLog[]> {
    return await db.select().from(taskLogs).where(eq(taskLogs.status, status)).orderBy(desc(taskLogs.createdAt));
  }

  async createTaskLog(task: InsertTaskLog): Promise<TaskLog> {
    const result = await db.insert(taskLogs).values(task).returning();
    return result[0];
  }

  async updateTaskLog(id: string, updates: Partial<InsertTaskLog>): Promise<TaskLog | undefined> {
    const result = await db.update(taskLogs).set({ ...updates, updatedAt: new Date() }).where(eq(taskLogs.id, id)).returning();
    return result[0];
  }

  // ========== ATTENDANCE LOGS METHODS ==========
  async getAllAttendanceLogs(): Promise<AttendanceLog[]> {
    return await db.select().from(attendanceLogs).orderBy(desc(attendanceLogs.date));
  }

  async getAttendanceLog(id: string): Promise<AttendanceLog | undefined> {
    const result = await db.select().from(attendanceLogs).where(eq(attendanceLogs.id, id));
    return result[0];
  }

  async getAttendanceLogsByStaff(staffId: string): Promise<AttendanceLog[]> {
    return await db.select().from(attendanceLogs).where(eq(attendanceLogs.staffId, staffId)).orderBy(desc(attendanceLogs.date));
  }

  async getAttendanceLogsByDate(date: string): Promise<AttendanceLog[]> {
    return await db.select().from(attendanceLogs).where(eq(attendanceLogs.date, date));
  }

  async getAttendanceLogByStaffAndDate(staffId: string, date: string): Promise<AttendanceLog | undefined> {
    const result = await db.select().from(attendanceLogs)
      .where(and(eq(attendanceLogs.staffId, staffId), eq(attendanceLogs.date, date)));
    return result[0];
  }

  async createAttendanceLog(attendance: InsertAttendanceLog): Promise<AttendanceLog> {
    const result = await db.insert(attendanceLogs).values(attendance).returning();
    return result[0];
  }

  async updateAttendanceLog(id: string, updates: Partial<InsertAttendanceLog>): Promise<AttendanceLog | undefined> {
    const result = await db.update(attendanceLogs).set({ ...updates, updatedAt: new Date() }).where(eq(attendanceLogs.id, id)).returning();
    return result[0];
  }

  // ========== LEAVE REQUESTS METHODS ==========
  async getAllLeaveRequests(): Promise<LeaveRequest[]> {
    return await db.select().from(leaveRequests).orderBy(desc(leaveRequests.createdAt));
  }

  async getLeaveRequest(id: string): Promise<LeaveRequest | undefined> {
    const result = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    return result[0];
  }

  async getLeaveRequestsByStaff(staffId: string): Promise<LeaveRequest[]> {
    return await db.select().from(leaveRequests).where(eq(leaveRequests.staffId, staffId)).orderBy(desc(leaveRequests.createdAt));
  }

  async getLeaveRequestsByStatus(status: string): Promise<LeaveRequest[]> {
    return await db.select().from(leaveRequests).where(eq(leaveRequests.status, status)).orderBy(desc(leaveRequests.createdAt));
  }

  async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    return await db.select().from(leaveRequests).where(eq(leaveRequests.status, "PENDING")).orderBy(desc(leaveRequests.createdAt));
  }

  async createLeaveRequest(leave: InsertLeaveRequest): Promise<LeaveRequest> {
    const result = await db.insert(leaveRequests).values(leave).returning();
    return result[0];
  }

  async updateLeaveRequest(id: string, updates: Partial<InsertLeaveRequest>): Promise<LeaveRequest | undefined> {
    const result = await db.update(leaveRequests).set({ ...updates, updatedAt: new Date() }).where(eq(leaveRequests.id, id)).returning();
    return result[0];
  }

  // ========== OVERTIME LOGS METHODS ==========
  async getAllOvertimeLogs(): Promise<OvertimeLog[]> {
    return await db.select().from(overtimeLogs).orderBy(desc(overtimeLogs.date));
  }

  async getOvertimeLog(id: string): Promise<OvertimeLog | undefined> {
    const result = await db.select().from(overtimeLogs).where(eq(overtimeLogs.id, id));
    return result[0];
  }

  async getOvertimeLogsByStaff(staffId: string): Promise<OvertimeLog[]> {
    return await db.select().from(overtimeLogs).where(eq(overtimeLogs.staffId, staffId)).orderBy(desc(overtimeLogs.date));
  }

  async getOvertimeLogsByStatus(status: string): Promise<OvertimeLog[]> {
    return await db.select().from(overtimeLogs).where(eq(overtimeLogs.status, status)).orderBy(desc(overtimeLogs.date));
  }

  async getPendingOvertimeLogs(): Promise<OvertimeLog[]> {
    return await db.select().from(overtimeLogs).where(eq(overtimeLogs.status, "PENDING")).orderBy(desc(overtimeLogs.date));
  }

  async createOvertimeLog(overtime: InsertOvertimeLog): Promise<OvertimeLog> {
    const result = await db.insert(overtimeLogs).values(overtime).returning();
    return result[0];
  }

  async updateOvertimeLog(id: string, updates: Partial<InsertOvertimeLog>): Promise<OvertimeLog | undefined> {
    const result = await db.update(overtimeLogs).set({ ...updates, updatedAt: new Date() }).where(eq(overtimeLogs.id, id)).returning();
    return result[0];
  }

  // ========== STAFF PERFORMANCE METRICS METHODS ==========
  async getAllStaffPerformanceMetrics(): Promise<StaffPerformanceMetric[]> {
    return await db.select().from(staffPerformanceMetrics).orderBy(desc(staffPerformanceMetrics.periodEnd));
  }

  async getStaffPerformanceMetric(id: string): Promise<StaffPerformanceMetric | undefined> {
    const result = await db.select().from(staffPerformanceMetrics).where(eq(staffPerformanceMetrics.id, id));
    return result[0];
  }

  async getStaffPerformanceMetricsByStaff(staffId: string): Promise<StaffPerformanceMetric[]> {
    return await db.select().from(staffPerformanceMetrics).where(eq(staffPerformanceMetrics.staffId, staffId)).orderBy(desc(staffPerformanceMetrics.periodEnd));
  }

  async createStaffPerformanceMetric(metric: InsertStaffPerformanceMetric): Promise<StaffPerformanceMetric> {
    const result = await db.insert(staffPerformanceMetrics).values(metric).returning();
    return result[0];
  }

  async updateStaffPerformanceMetric(id: string, updates: Partial<InsertStaffPerformanceMetric>): Promise<StaffPerformanceMetric | undefined> {
    const result = await db.update(staffPerformanceMetrics).set({ ...updates, updatedAt: new Date() }).where(eq(staffPerformanceMetrics.id, id)).returning();
    return result[0];
  }

  // ========== ROSTER AUDIT LOGS METHODS ==========
  async getAllRosterAuditLogs(): Promise<RosterAuditLog[]> {
    return await db.select().from(rosterAuditLogs).orderBy(desc(rosterAuditLogs.timestamp));
  }

  async getRosterAuditLogsByRoster(rosterId: string): Promise<RosterAuditLog[]> {
    return await db.select().from(rosterAuditLogs).where(eq(rosterAuditLogs.rosterId, rosterId)).orderBy(desc(rosterAuditLogs.timestamp));
  }

  async createRosterAuditLog(log: InsertRosterAuditLog): Promise<RosterAuditLog> {
    const result = await db.insert(rosterAuditLogs).values(log).returning();
    return result[0];
  }

  // ==================== INSURANCE MANAGEMENT METHODS ====================

  // ========== INSURANCE PROVIDERS METHODS ==========
  async getAllInsuranceProviders(): Promise<InsuranceProvider[]> {
    return await db.select().from(insuranceProviders).orderBy(insuranceProviders.providerName);
  }

  async getActiveInsuranceProviders(): Promise<InsuranceProvider[]> {
    return await db.select().from(insuranceProviders).where(eq(insuranceProviders.activeStatus, true)).orderBy(insuranceProviders.providerName);
  }

  async getInsuranceProvider(id: string): Promise<InsuranceProvider | undefined> {
    const result = await db.select().from(insuranceProviders).where(eq(insuranceProviders.id, id));
    return result[0];
  }

  async createInsuranceProvider(provider: InsertInsuranceProvider): Promise<InsuranceProvider> {
    const result = await db.insert(insuranceProviders).values(provider).returning();
    return result[0];
  }

  async updateInsuranceProvider(id: string, updates: Partial<InsertInsuranceProvider>): Promise<InsuranceProvider | undefined> {
    const result = await db.update(insuranceProviders).set({ ...updates, updatedAt: new Date() }).where(eq(insuranceProviders.id, id)).returning();
    return result[0];
  }

  async deactivateInsuranceProvider(id: string): Promise<InsuranceProvider | undefined> {
    const result = await db.update(insuranceProviders).set({ activeStatus: false, updatedAt: new Date() }).where(eq(insuranceProviders.id, id)).returning();
    return result[0];
  }

  // ========== PATIENT INSURANCE METHODS ==========
  async getAllPatientInsurance(): Promise<PatientInsurance[]> {
    return await db.select().from(patientInsurance).orderBy(desc(patientInsurance.createdAt));
  }

  async getPatientInsurance(id: string): Promise<PatientInsurance | undefined> {
    const result = await db.select().from(patientInsurance).where(eq(patientInsurance.id, id));
    return result[0];
  }

  async getPatientInsuranceByPatient(patientId: string): Promise<PatientInsurance[]> {
    return await db.select().from(patientInsurance).where(eq(patientInsurance.patientId, patientId)).orderBy(desc(patientInsurance.createdAt));
  }

  async createPatientInsurance(insurance: InsertPatientInsurance): Promise<PatientInsurance> {
    const result = await db.insert(patientInsurance).values(insurance).returning();
    return result[0];
  }

  async updatePatientInsurance(id: string, updates: Partial<InsertPatientInsurance>): Promise<PatientInsurance | undefined> {
    const result = await db.update(patientInsurance).set({ ...updates, updatedAt: new Date() }).where(eq(patientInsurance.id, id)).returning();
    return result[0];
  }

  // ========== INSURANCE CLAIMS METHODS ==========
  async getAllInsuranceClaims(): Promise<InsuranceClaim[]> {
    return await db.select().from(insuranceClaims).orderBy(desc(insuranceClaims.createdAt));
  }

  async getInsuranceClaim(id: string): Promise<InsuranceClaim | undefined> {
    const result = await db.select().from(insuranceClaims).where(eq(insuranceClaims.id, id));
    return result[0];
  }

  async getInsuranceClaimByNumber(claimNumber: string): Promise<InsuranceClaim | undefined> {
    const result = await db.select().from(insuranceClaims).where(eq(insuranceClaims.claimNumber, claimNumber));
    return result[0];
  }

  async getInsuranceClaimsByPatient(patientId: string): Promise<InsuranceClaim[]> {
    return await db.select().from(insuranceClaims).where(eq(insuranceClaims.patientId, patientId)).orderBy(desc(insuranceClaims.createdAt));
  }

  async getInsuranceClaimsByStatus(status: string): Promise<InsuranceClaim[]> {
    return await db.select().from(insuranceClaims).where(eq(insuranceClaims.status, status)).orderBy(desc(insuranceClaims.createdAt));
  }

  async createInsuranceClaim(claim: InsertInsuranceClaim): Promise<InsuranceClaim> {
    const result = await db.insert(insuranceClaims).values(claim).returning();
    return result[0];
  }

  async updateInsuranceClaim(id: string, updates: Partial<InsertInsuranceClaim>): Promise<InsuranceClaim | undefined> {
    const result = await db.update(insuranceClaims).set({ ...updates, updatedAt: new Date() }).where(eq(insuranceClaims.id, id)).returning();
    return result[0];
  }

  // ========== INSURANCE CLAIM DOCUMENTS METHODS ==========
  async getClaimDocuments(claimId: string): Promise<InsuranceClaimDocument[]> {
    return await db.select().from(insuranceClaimDocuments).where(eq(insuranceClaimDocuments.claimId, claimId)).orderBy(insuranceClaimDocuments.createdAt);
  }

  async createClaimDocument(doc: InsertInsuranceClaimDocument): Promise<InsuranceClaimDocument> {
    const result = await db.insert(insuranceClaimDocuments).values(doc).returning();
    return result[0];
  }

  async verifyClaimDocument(id: string, verifiedBy: string): Promise<InsuranceClaimDocument | undefined> {
    const result = await db.update(insuranceClaimDocuments).set({ verified: true, verifiedBy, verifiedAt: new Date() }).where(eq(insuranceClaimDocuments.id, id)).returning();
    return result[0];
  }

  // ========== INSURANCE CLAIM LOGS METHODS ==========
  async getClaimLogs(claimId: string): Promise<InsuranceClaimLog[]> {
    return await db.select().from(insuranceClaimLogs).where(eq(insuranceClaimLogs.claimId, claimId)).orderBy(desc(insuranceClaimLogs.timestamp));
  }

  async createClaimLog(log: InsertInsuranceClaimLog): Promise<InsuranceClaimLog> {
    const result = await db.insert(insuranceClaimLogs).values(log).returning();
    return result[0];
  }

  // ========== INSURANCE PROVIDER CHECKLISTS METHODS ==========
  async getProviderChecklists(providerId: string): Promise<InsuranceProviderChecklist[]> {
    return await db.select().from(insuranceProviderChecklists).where(eq(insuranceProviderChecklists.providerId, providerId)).orderBy(insuranceProviderChecklists.displayOrder);
  }

  async getProviderChecklistsByType(providerId: string, claimType: string): Promise<InsuranceProviderChecklist[]> {
    return await db.select().from(insuranceProviderChecklists).where(and(eq(insuranceProviderChecklists.providerId, providerId), eq(insuranceProviderChecklists.claimType, claimType))).orderBy(insuranceProviderChecklists.displayOrder);
  }

  async createProviderChecklist(checklist: InsertInsuranceProviderChecklist): Promise<InsuranceProviderChecklist> {
    const result = await db.insert(insuranceProviderChecklists).values(checklist).returning();
    return result[0];
  }

  async deleteProviderChecklists(providerId: string): Promise<void> {
    await db.delete(insuranceProviderChecklists).where(eq(insuranceProviderChecklists.providerId, providerId));
  }

  // ========== FACE RECOGNITION SYSTEM ==========

  // Face Embeddings
  async createFaceEmbedding(embedding: InsertFaceEmbedding): Promise<FaceEmbedding> {
    const result = await db.insert(faceEmbeddings).values(embedding).returning();
    return result[0];
  }

  async getFaceEmbedding(id: string): Promise<FaceEmbedding | undefined> {
    const result = await db.select().from(faceEmbeddings).where(eq(faceEmbeddings.id, id));
    return result[0];
  }

  async getFaceEmbeddingByUser(userId: string, userType: string): Promise<FaceEmbedding | undefined> {
    const result = await db.select().from(faceEmbeddings).where(
      and(eq(faceEmbeddings.userId, userId), eq(faceEmbeddings.userType, userType), eq(faceEmbeddings.isActive, true))
    );
    return result[0];
  }

  async getAllActiveFaceEmbeddings(userType?: string): Promise<FaceEmbedding[]> {
    if (userType) {
      return await db.select().from(faceEmbeddings).where(
        and(eq(faceEmbeddings.isActive, true), eq(faceEmbeddings.userType, userType))
      );
    }
    return await db.select().from(faceEmbeddings).where(eq(faceEmbeddings.isActive, true));
  }

  async updateFaceEmbedding(id: string, updates: Partial<InsertFaceEmbedding>): Promise<FaceEmbedding | undefined> {
    const result = await db.update(faceEmbeddings).set({ ...updates, updatedAt: new Date() }).where(eq(faceEmbeddings.id, id)).returning();
    return result[0];
  }

  async deactivateFaceEmbedding(userId: string, userType: string): Promise<void> {
    await db.update(faceEmbeddings).set({ isActive: false, updatedAt: new Date() }).where(
      and(eq(faceEmbeddings.userId, userId), eq(faceEmbeddings.userType, userType))
    );
  }

  // Biometric Consent
  async createBiometricConsent(consent: InsertBiometricConsent): Promise<BiometricConsent> {
    const result = await db.insert(biometricConsent).values(consent).returning();
    return result[0];
  }

  async getBiometricConsent(userId: string, userType: string): Promise<BiometricConsent | undefined> {
    const result = await db.select().from(biometricConsent).where(
      and(eq(biometricConsent.userId, userId), eq(biometricConsent.userType, userType))
    );
    return result[0];
  }

  async updateBiometricConsent(id: string, updates: Partial<InsertBiometricConsent>): Promise<BiometricConsent | undefined> {
    const result = await db.update(biometricConsent).set({ ...updates, updatedAt: new Date() }).where(eq(biometricConsent.id, id)).returning();
    return result[0];
  }

  async revokeBiometricConsent(userId: string, userType: string, revokedBy: string, reason?: string): Promise<void> {
    await db.update(biometricConsent).set({
      consentStatus: false,
      revokedAt: new Date(),
      revokedBy,
      revokedReason: reason,
      updatedAt: new Date()
    }).where(and(eq(biometricConsent.userId, userId), eq(biometricConsent.userType, userType)));
  }

  // Face Recognition Logs
  async createFaceRecognitionLog(log: InsertFaceRecognitionLog): Promise<FaceRecognitionLog> {
    const result = await db.insert(faceRecognitionLogs).values(log).returning();
    return result[0];
  }

  async getFaceRecognitionLogs(filters?: { userType?: string; matchStatus?: string; startDate?: Date; endDate?: Date }): Promise<FaceRecognitionLog[]> {
    let query = db.select().from(faceRecognitionLogs);
    const conditions: any[] = [];
    
    if (filters?.userType) conditions.push(eq(faceRecognitionLogs.userType, filters.userType));
    if (filters?.matchStatus) conditions.push(eq(faceRecognitionLogs.matchStatus, filters.matchStatus));
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(faceRecognitionLogs.createdAt)).limit(500);
    }
    return await query.orderBy(desc(faceRecognitionLogs.createdAt)).limit(500);
  }

  async getRecognitionStats(): Promise<{ total: number; successful: number; failed: number; avgConfidence: number }> {
    const logs = await db.select().from(faceRecognitionLogs);
    const total = logs.length;
    const successful = logs.filter(l => l.matchStatus === 'SUCCESS').length;
    const failed = logs.filter(l => l.matchStatus === 'FAILURE').length;
    const avgConfidence = logs.length > 0 
      ? logs.reduce((sum, l) => sum + parseFloat(l.confidenceScore || '0'), 0) / logs.length 
      : 0;
    return { total, successful, failed, avgConfidence };
  }

  // Face Attendance
  async createFaceAttendance(attendance: InsertFaceAttendance): Promise<FaceAttendance> {
    const result = await db.insert(faceAttendance).values(attendance).returning();
    return result[0];
  }

  async getFaceAttendanceByStaff(staffId: string, startDate?: string, endDate?: string): Promise<FaceAttendance[]> {
    return await db.select().from(faceAttendance).where(eq(faceAttendance.staffId, staffId)).orderBy(desc(faceAttendance.createdAt));
  }

  async getFaceAttendanceToday(staffId: string): Promise<FaceAttendance[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return await db.select().from(faceAttendance).where(
      and(eq(faceAttendance.staffId, staffId))
    ).orderBy(desc(faceAttendance.createdAt));
  }

  async getLatestFaceAttendance(staffId: string): Promise<FaceAttendance | undefined> {
    const result = await db.select().from(faceAttendance).where(eq(faceAttendance.staffId, staffId)).orderBy(desc(faceAttendance.createdAt)).limit(1);
    return result[0];
  }

  async getAllFaceAttendanceToday(): Promise<FaceAttendance[]> {
    return await db.select().from(faceAttendance).orderBy(desc(faceAttendance.createdAt)).limit(200);
  }

  // Face Recognition Settings
  async getFaceRecognitionSetting(key: string): Promise<FaceRecognitionSetting | undefined> {
    const result = await db.select().from(faceRecognitionSettings).where(eq(faceRecognitionSettings.settingKey, key));
    return result[0];
  }

  async getAllFaceRecognitionSettings(): Promise<FaceRecognitionSetting[]> {
    return await db.select().from(faceRecognitionSettings);
  }

  async upsertFaceRecognitionSetting(key: string, value: string, description?: string, updatedBy?: string): Promise<FaceRecognitionSetting> {
    const existing = await this.getFaceRecognitionSetting(key);
    if (existing) {
      const result = await db.update(faceRecognitionSettings).set({
        settingValue: value,
        description,
        updatedBy,
        updatedAt: new Date()
      }).where(eq(faceRecognitionSettings.settingKey, key)).returning();
      return result[0];
    } else {
      const result = await db.insert(faceRecognitionSettings).values({
        settingKey: key,
        settingValue: value,
        description,
        updatedBy
      }).returning();
      return result[0];
    }
  }

  // Duplicate Patient Alerts
  async createDuplicatePatientAlert(alert: InsertDuplicatePatientAlert): Promise<DuplicatePatientAlert> {
    const result = await db.insert(duplicatePatientAlerts).values(alert).returning();
    return result[0];
  }

  async getDuplicatePatientAlerts(status?: string): Promise<DuplicatePatientAlert[]> {
    if (status) {
      return await db.select().from(duplicatePatientAlerts).where(eq(duplicatePatientAlerts.alertStatus, status)).orderBy(desc(duplicatePatientAlerts.createdAt));
    }
    return await db.select().from(duplicatePatientAlerts).orderBy(desc(duplicatePatientAlerts.createdAt));
  }

  async updateDuplicatePatientAlert(id: string, updates: Partial<InsertDuplicatePatientAlert>): Promise<DuplicatePatientAlert | undefined> {
    const result = await db.update(duplicatePatientAlerts).set(updates).where(eq(duplicatePatientAlerts.id, id)).returning();
    return result[0];
  }

  async resolveDuplicateAlert(id: string, reviewedBy: string, status: string, notes?: string, mergedToId?: string): Promise<DuplicatePatientAlert | undefined> {
    const result = await db.update(duplicatePatientAlerts).set({
      alertStatus: status,
      reviewedBy,
      reviewedAt: new Date(),
      reviewNotes: notes,
      mergedToPatientId: mergedToId
    }).where(eq(duplicatePatientAlerts.id, id)).returning();
    return result[0];
  }

  // ========== REFERRAL MANAGEMENT ==========
  async createReferralSource(source: InsertReferralSource): Promise<ReferralSource> {
    const result = await db.insert(referralSources).values(source).returning();
    return result[0];
  }

  async getReferralSources(): Promise<ReferralSource[]> {
    return await db.select().from(referralSources).orderBy(desc(referralSources.createdAt));
  }

  async getReferralSource(id: string): Promise<ReferralSource | undefined> {
    const result = await db.select().from(referralSources).where(eq(referralSources.id, id));
    return result[0];
  }

  async updateReferralSource(id: string, updates: Partial<InsertReferralSource>): Promise<ReferralSource | undefined> {
    const result = await db.update(referralSources).set({ ...updates, updatedAt: new Date() }).where(eq(referralSources.id, id)).returning();
    return result[0];
  }

  async deleteReferralSource(id: string): Promise<boolean> {
    const result = await db.delete(referralSources).where(eq(referralSources.id, id)).returning();
    return result.length > 0;
  }

  async createPatientReferral(referral: InsertPatientReferral): Promise<PatientReferral> {
    const processedReferral = {
      ...referral,
      referralDate: referral.referralDate ? new Date(referral.referralDate) : new Date(),
      appointmentDate: referral.appointmentDate ? new Date(referral.appointmentDate) : null,
      followUpDate: referral.followUpDate ? new Date(referral.followUpDate) : null,
    };
    const result = await db.insert(patientReferrals).values(processedReferral).returning();
    return result[0];
  }

  async getPatientReferrals(filters?: { referralType?: string; status?: string }): Promise<PatientReferral[]> {
    if (filters?.referralType && filters?.status) {
      return await db.select().from(patientReferrals).where(
        and(eq(patientReferrals.referralType, filters.referralType), eq(patientReferrals.status, filters.status))
      ).orderBy(desc(patientReferrals.createdAt));
    }
    if (filters?.referralType) {
      return await db.select().from(patientReferrals).where(eq(patientReferrals.referralType, filters.referralType)).orderBy(desc(patientReferrals.createdAt));
    }
    if (filters?.status) {
      return await db.select().from(patientReferrals).where(eq(patientReferrals.status, filters.status)).orderBy(desc(patientReferrals.createdAt));
    }
    return await db.select().from(patientReferrals).orderBy(desc(patientReferrals.createdAt));
  }

  async getPatientReferral(id: string): Promise<PatientReferral | undefined> {
    const result = await db.select().from(patientReferrals).where(eq(patientReferrals.id, id));
    return result[0];
  }

  async updatePatientReferral(id: string, updates: Partial<InsertPatientReferral>): Promise<PatientReferral | undefined> {
    const processedUpdates = {
      ...updates,
      updatedAt: new Date(),
      ...(updates.referralDate && { referralDate: new Date(updates.referralDate) }),
      ...(updates.appointmentDate && { appointmentDate: new Date(updates.appointmentDate) }),
      ...(updates.followUpDate && { followUpDate: new Date(updates.followUpDate) }),
    };
    const result = await db.update(patientReferrals).set(processedUpdates).where(eq(patientReferrals.id, id)).returning();
    return result[0];
  }

  async deletePatientReferral(id: string): Promise<boolean> {
    const result = await db.delete(patientReferrals).where(eq(patientReferrals.id, id)).returning();
    return result.length > 0;
  }

  // ========== HOSPITAL SERVICE DEPARTMENT METHODS ==========
  async createHospitalServiceDepartment(department: InsertHospitalServiceDepartment): Promise<HospitalServiceDepartment> {
    const result = await db.insert(hospitalServiceDepartments).values(department).returning();
    return result[0];
  }

  async getHospitalServiceDepartments(): Promise<HospitalServiceDepartment[]> {
    return await db.select().from(hospitalServiceDepartments).orderBy(hospitalServiceDepartments.displayOrder);
  }

  async getHospitalServiceDepartment(id: string): Promise<HospitalServiceDepartment | undefined> {
    const result = await db.select().from(hospitalServiceDepartments).where(eq(hospitalServiceDepartments.id, id));
    return result[0];
  }

  async getHospitalServiceDepartmentBySlug(slug: string): Promise<HospitalServiceDepartment | undefined> {
    const result = await db.select().from(hospitalServiceDepartments).where(eq(hospitalServiceDepartments.slug, slug));
    return result[0];
  }

  async updateHospitalServiceDepartment(id: string, updates: Partial<InsertHospitalServiceDepartment>): Promise<HospitalServiceDepartment | undefined> {
    const result = await db.update(hospitalServiceDepartments).set({ ...updates, updatedAt: new Date() }).where(eq(hospitalServiceDepartments.id, id)).returning();
    return result[0];
  }

  async deleteHospitalServiceDepartment(id: string): Promise<boolean> {
    const result = await db.delete(hospitalServiceDepartments).where(eq(hospitalServiceDepartments.id, id)).returning();
    return result.length > 0;
  }

  // ========== HOSPITAL SERVICE METHODS ==========
  async createHospitalService(service: InsertHospitalService): Promise<HospitalService> {
    const result = await db.insert(hospitalServices).values(service).returning();
    return result[0];
  }

  async getHospitalServices(departmentId?: string): Promise<HospitalService[]> {
    if (departmentId) {
      return await db.select().from(hospitalServices).where(eq(hospitalServices.departmentId, departmentId)).orderBy(hospitalServices.name);
    }
    return await db.select().from(hospitalServices).orderBy(hospitalServices.name);
  }

  async getHospitalService(id: string): Promise<HospitalService | undefined> {
    const result = await db.select().from(hospitalServices).where(eq(hospitalServices.id, id));
    return result[0];
  }

  async updateHospitalService(id: string, updates: Partial<InsertHospitalService>): Promise<HospitalService | undefined> {
    const result = await db.update(hospitalServices).set({ ...updates, updatedAt: new Date() }).where(eq(hospitalServices.id, id)).returning();
    return result[0];
  }

  async deleteHospitalService(id: string): Promise<boolean> {
    const result = await db.delete(hospitalServices).where(eq(hospitalServices.id, id)).returning();
    return result.length > 0;
  }

  async bulkCreateHospitalServices(services: InsertHospitalService[]): Promise<HospitalService[]> {
    if (services.length === 0) return [];
    const result = await db.insert(hospitalServices).values(services).returning();
    return result;
  }

  async seedHospitalServices(): Promise<void> {
    const existingDepts = await db.select().from(hospitalServiceDepartments).limit(1);
    if (existingDepts.length > 0) {
      console.log("Hospital services already exist, skipping seed...");
      return;
    }

    console.log("Seeding hospital service departments and services...");

    const departmentsData = [
      { slug: "blood-bank", name: "Blood Bank Services", description: "Blood bank facilities and services", iconKey: "TestTube", displayOrder: 1 },
      { slug: "cardiothoracic-surgery", name: "Cardiothoracic Surgery", description: "Heart and chest surgical procedures", iconKey: "Heart", displayOrder: 2 },
      { slug: "cardiovascular-surgery", name: "Cardiovascular Surgery", description: "Blood vessel and heart surgical procedures", iconKey: "Activity", displayOrder: 3 },
      { slug: "cathlab", name: "Cathlab Procedures", description: "Catheterization laboratory procedures", iconKey: "Stethoscope", displayOrder: 4 },
      { slug: "vascular-surgery", name: "Vascular Surgery", description: "Blood vessel surgical procedures", iconKey: "Activity", displayOrder: 5 }
    ];

    const servicesData: Record<string, string[]> = {
      "blood-bank": [
        "Apheresis - Pediatric Apheresis", "Apheresis - Pediatric Red Cell Exchange", "Apheresis - Plasma Exchange (Adults)",
        "Apheresis - Plasma Exchange (Children)", "Apheresis - Plateletpheresis - Single Dose", "Apheresis - Plateletpheresis - Double Dose",
        "Apheresis - Red Blood Cell Exchange", "Apheresis - Stem Cell Collection", "Apheresis Disposable Set - Adult",
        "Apheresis Disposable Set - Pediatric", "Blood Component - Cryoprecipitate (Single Unit)", "Blood Component - FFP (Single Unit)",
        "Blood Component - Leukocyte Depleted PRBC", "Blood Component - PRBC (Single Unit)", "Blood Component - Platelet Rich Plasma",
        "Blood Component - Random Donor Platelets", "Blood Component - Saline Washed RBC", "Blood Component - Single Donor Platelets",
        "Blood Component - Whole Blood", "Blood Group & Rh Typing", "Cross Match - Major", "Cross Match - Minor",
        "Coombs Test - Direct", "Coombs Test - Indirect", "Antibody Screening", "Antibody Identification",
        "Cold Agglutinin Titer", "Hemoglobin Electrophoresis", "G6PD Screening", "Kleihauer-Betke Test",
        "Irradiated Blood Products", "CMV Negative Blood Products", "Extended Phenotyping", "HLA Typing",
        "Platelet Crossmatch", "Platelet Antibody Testing", "Red Cell Alloantibody Testing", "Warm Autoantibody Investigation",
        "Cold Autoantibody Investigation", "Transfusion Reaction Investigation", "DAT Follow-up Panel", "Elution Testing",
        "Adsorption Testing", "Titration Studies", "Antigen Typing - Rh", "Antigen Typing - Kell",
        "Antigen Typing - Duffy", "Antigen Typing - Kidd", "Antigen Typing - MNS", "Antigen Typing - Lewis",
        "Antigen Typing - P1PK", "Antigen Typing - Lutheran", "Therapeutic Phlebotomy", "Autologous Blood Donation",
        "Directed Donation Processing", "Blood Warming Service", "Emergency Blood Release"
      ],
      "cardiothoracic-surgery": [
        "CABG - On Pump (Single Vessel)", "CABG - On Pump (Double Vessel)", "CABG - On Pump (Triple Vessel)",
        "CABG - Off Pump (OPCAB)", "CABG - Redo Surgery", "Valve Replacement - Aortic (Mechanical)",
        "Valve Replacement - Aortic (Bioprosthetic)", "Valve Replacement - Mitral (Mechanical)",
        "Valve Replacement - Mitral (Bioprosthetic)", "Valve Repair - Mitral", "Valve Repair - Tricuspid",
        "Double Valve Replacement", "Triple Valve Surgery", "CABG + Valve Combined Surgery",
        "Aortic Root Replacement (Bentall)", "Ascending Aortic Replacement", "Aortic Arch Replacement",
        "Ross Procedure", "David Procedure", "Pericardiectomy", "Pericardial Window",
        "Myxoma Excision", "Ventricular Septal Defect Repair (Adult)", "Atrial Septal Defect Repair (Adult)",
        "LVAD Implantation", "RVAD Implantation", "BiVAD Implantation", "ECMO Cannulation",
        "Heart Transplant", "Lung Transplant", "Heart-Lung Transplant", "Thymectomy (Open)"
      ],
      "cardiovascular-surgery": [
        "Carotid Endarterectomy", "Carotid Artery Stenting", "Carotid Body Tumor Excision",
        "Subclavian Artery Bypass", "Axillo-Bifemoral Bypass", "Aorto-Bifemoral Bypass",
        "Femoro-Popliteal Bypass", "Femoro-Tibial Bypass", "Femoro-Femoral Crossover Bypass",
        "Ilio-Femoral Bypass", "Infra-Inguinal Bypass", "Abdominal Aortic Aneurysm Repair (Open)",
        "Thoracic Aortic Aneurysm Repair", "Thoracoabdominal Aneurysm Repair", "Iliac Aneurysm Repair",
        "Popliteal Aneurysm Repair", "Femoral Aneurysm Repair", "Visceral Artery Aneurysm Repair",
        "Renal Artery Bypass", "Mesenteric Artery Bypass", "Celiac Artery Bypass",
        "Splenic Artery Aneurysm Repair", "Hepatic Artery Aneurysm Repair", "Thromboendarterectomy",
        "Embolectomy - Upper Limb", "Embolectomy - Lower Limb", "Fasciotomy", "Amputation - Below Knee",
        "Amputation - Above Knee", "Amputation - Toe", "Amputation - Forefoot", "Amputation - Transmetatarsal",
        "Arteriovenous Fistula Creation", "Arteriovenous Fistula Revision", "AV Graft Placement",
        "AV Graft Thrombectomy", "Dialysis Catheter Placement", "Dialysis Catheter Removal",
        "IVC Filter Placement", "IVC Filter Retrieval", "Varicose Vein Surgery - Stripping",
        "Varicose Vein Surgery - EVLT"
      ],
      "cathlab": [
        "Diagnostic Coronary Angiography", "Coronary Angiography with LV Gram", "Right Heart Catheterization",
        "Left Heart Catheterization", "Combined Heart Catheterization", "Coronary Angioplasty - Single Vessel",
        "Coronary Angioplasty - Double Vessel", "Coronary Angioplasty - Triple Vessel",
        "Primary PCI (STEMI)", "Rescue PCI", "Facilitated PCI", "Staged PCI",
        "CTO PCI (Chronic Total Occlusion)", "Bifurcation PCI", "Left Main PCI",
        "Rotational Atherectomy", "Orbital Atherectomy", "Cutting Balloon Angioplasty",
        "Scoring Balloon Angioplasty", "Drug-Coated Balloon Angioplasty", "Bare Metal Stent Implantation",
        "Drug-Eluting Stent Implantation", "Bioresorbable Scaffold Implantation", "Covered Stent Implantation",
        "IVUS (Intravascular Ultrasound)", "OCT (Optical Coherence Tomography)", "FFR (Fractional Flow Reserve)",
        "iFR (Instantaneous Wave-free Ratio)", "Coronary Flow Reserve", "Carotid Angiography",
        "Carotid Stenting", "Renal Angiography", "Renal Artery Stenting", "Peripheral Angiography - Lower Limb",
        "Peripheral Angiography - Upper Limb", "Peripheral Angioplasty - Iliac", "Peripheral Angioplasty - Femoral",
        "Peripheral Angioplasty - Popliteal", "Peripheral Angioplasty - Tibial", "Peripheral Stenting - Iliac",
        "Peripheral Stenting - Femoral", "Peripheral Stenting - Popliteal", "Subclavian Angioplasty",
        "Subclavian Stenting", "Vertebral Angiography", "Vertebral Stenting",
        "Pulmonary Angiography", "Pulmonary Artery Stenting", "Aortography",
        "TAVI (Transcatheter Aortic Valve Implantation)", "TMVR (Transcatheter Mitral Valve Repair)",
        "MitraClip Implantation", "WATCHMAN Device Implantation", "LAA Closure Device",
        "ASD Closure (Device)", "VSD Closure (Device)", "PDA Closure (Device)",
        "PFO Closure (Device)", "Coarctation Stenting", "Pulmonary Valve Replacement (Transcatheter)",
        "BPV (Balloon Pulmonary Valvuloplasty)", "BMV (Balloon Mitral Valvuloplasty)",
        "BAV (Balloon Aortic Valvuloplasty)", "Septal Ablation (Alcohol)", "Pericardiocentesis",
        "Temporary Pacemaker Insertion", "Permanent Pacemaker - Single Chamber",
        "Permanent Pacemaker - Dual Chamber", "ICD Implantation - Single Chamber",
        "ICD Implantation - Dual Chamber", "CRT-P Implantation", "CRT-D Implantation",
        "Leadless Pacemaker Implantation", "Lead Extraction", "Device Upgrade",
        "Device Replacement", "EP Study", "RF Ablation - SVT", "RF Ablation - Atrial Flutter",
        "RF Ablation - AF", "Cryoablation", "VT Ablation", "Cardiac Biopsy"
      ],
      "vascular-surgery": [
        "Varicose Vein Surgery - EVLT (Endovenous Laser)", "Varicose Vein Surgery - RFA (Radiofrequency)",
        "Varicose Vein Surgery - Foam Sclerotherapy", "Varicose Vein Surgery - Glue Ablation",
        "Varicose Vein Surgery - Mechanochemical Ablation", "Varicose Vein Surgery - Phlebectomy",
        "Deep Vein Thrombosis - Catheter Directed Thrombolysis", "DVT - Mechanical Thrombectomy",
        "DVT - Pharmacomechanical Thrombectomy", "DVT - IVC Filter Placement", "DVT - IVC Filter Retrieval",
        "Chronic Venous Insufficiency - Iliac Vein Stenting", "May-Thurner Syndrome Treatment",
        "Pelvic Congestion Syndrome - Embolization", "Nutcracker Syndrome Treatment",
        "Venous Malformation Sclerotherapy", "Venous Malformation Excision", "Arteriovenous Malformation Embolization",
        "AVM Excision", "Lymphedema Surgery - LVA", "Lymphedema Surgery - VLNT",
        "Thoracic Outlet Syndrome Surgery", "Popliteal Entrapment Syndrome Surgery",
        "Diabetic Foot - Debridement", "Diabetic Foot - Revascularization", "Diabetic Foot - Amputation",
        "Diabetic Foot - Skin Grafting", "Critical Limb Ischemia - Endovascular", "CLI - Surgical Bypass",
        "CLI - Hybrid Procedure", "Acute Limb Ischemia - Thrombectomy", "ALI - Thrombolysis",
        "ALI - Bypass Surgery", "Peripheral Artery Disease - Angioplasty", "PAD - Stenting",
        "PAD - Atherectomy", "PAD - Drug-Coated Balloon", "Renal Artery Stenosis - Angioplasty",
        "Renal Artery Stenosis - Stenting", "Mesenteric Ischemia - Endovascular", "Mesenteric Ischemia - Surgical",
        "Aortic Dissection - TEVAR", "Aortic Dissection - Open Repair", "EVAR (Endovascular Aneurysm Repair)",
        "FEVAR (Fenestrated EVAR)", "Branched EVAR", "Iliac Branch Device", "Chimney/Snorkel EVAR",
        "Aortic Stent Graft", "Vascular Access Creation", "Vascular Access Revision",
        "Hemodialysis Catheter Insertion", "Hemodialysis Catheter Exchange", "Peritoneal Dialysis Catheter",
        "Central Venous Catheter - PICC", "Central Venous Catheter - Tunneled", "Port-A-Cath Insertion",
        "Vascular Trauma Repair", "Pseudoaneurysm Repair", "Vascular Graft Infection Treatment"
      ]
    };

    for (const deptData of departmentsData) {
      const [dept] = await db.insert(hospitalServiceDepartments).values(deptData).returning();
      
      const services = servicesData[deptData.slug] || [];
      if (services.length > 0) {
        const servicesToInsert = services.map(name => ({
          departmentId: dept.id,
          name
        }));
        await db.insert(hospitalServices).values(servicesToInsert);
      }
    }

    console.log("Hospital services seeded successfully!");
  }

  // ========== OPD PRESCRIPTION TEMPLATE METHODS ==========
  
  async createOpdTemplate(template: InsertOpdPrescriptionTemplate): Promise<OpdPrescriptionTemplate> {
    const result = await db.insert(opdPrescriptionTemplates).values(template).returning();
    return result[0];
  }

  async getOpdTemplates(filters?: { isPublic?: boolean; createdBy?: string; category?: string }): Promise<OpdPrescriptionTemplate[]> {
    let query = db.select().from(opdPrescriptionTemplates).where(eq(opdPrescriptionTemplates.isActive, true));
    
    // Apply filters - return all active templates by default
    const templates = await db.select().from(opdPrescriptionTemplates)
      .where(eq(opdPrescriptionTemplates.isActive, true))
      .orderBy(desc(opdPrescriptionTemplates.usageCount), opdPrescriptionTemplates.name);
    
    // Apply client-side filtering
    let filteredTemplates = templates;
    if (filters?.isPublic !== undefined) {
      filteredTemplates = filteredTemplates.filter(t => t.isPublic === filters.isPublic);
    }
    if (filters?.createdBy) {
      filteredTemplates = filteredTemplates.filter(t => t.createdBy === filters.createdBy || t.isPublic);
    }
    if (filters?.category) {
      filteredTemplates = filteredTemplates.filter(t => t.category === filters.category);
    }
    
    return filteredTemplates;
  }

  async getOpdTemplate(id: string): Promise<OpdPrescriptionTemplate | undefined> {
    const result = await db.select().from(opdPrescriptionTemplates).where(eq(opdPrescriptionTemplates.id, id));
    return result[0];
  }

  async getOpdTemplateBySlug(slug: string): Promise<OpdPrescriptionTemplate | undefined> {
    const result = await db.select().from(opdPrescriptionTemplates).where(eq(opdPrescriptionTemplates.slug, slug));
    return result[0];
  }

  async updateOpdTemplate(id: string, updates: Partial<InsertOpdPrescriptionTemplate>, userId?: string, userName?: string): Promise<OpdPrescriptionTemplate | undefined> {
    // Get existing template for version control
    const existing = await this.getOpdTemplate(id);
    if (!existing) return undefined;

    // Determine the current version number (start from 1 if null)
    const currentVersion = existing.version || 1;
    const nextVersion = currentVersion + 1;

    // Create version history entry with the CURRENT state before updating
    if (userId) {
      await db.insert(opdTemplateVersions).values({
        templateId: id,
        version: currentVersion,
        name: existing.name,
        symptoms: existing.symptoms,
        medicines: existing.medicines,
        instructions: existing.instructions,
        suggestedTests: existing.suggestedTests,
        followUpDays: existing.followUpDays,
        dietAdvice: existing.dietAdvice,
        activityAdvice: existing.activityAdvice,
        changedBy: userId,
        changedByName: userName,
        changeNotes: 'Updated template'
      });
    }

    // Update the template with incremented version
    const result = await db.update(opdPrescriptionTemplates)
      .set({ 
        ...updates, 
        version: nextVersion,
        updatedAt: new Date() 
      })
      .where(eq(opdPrescriptionTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteOpdTemplate(id: string): Promise<boolean> {
    // Check if it's a system template
    const template = await this.getOpdTemplate(id);
    if (template?.isSystemTemplate) {
      return false; // Cannot delete system templates
    }
    
    const result = await db.update(opdPrescriptionTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(opdPrescriptionTemplates.id, id))
      .returning();
    return result.length > 0;
  }

  async incrementTemplateUsage(id: string): Promise<void> {
    const template = await this.getOpdTemplate(id);
    if (template) {
      await db.update(opdPrescriptionTemplates)
        .set({ usageCount: (template.usageCount || 0) + 1 })
        .where(eq(opdPrescriptionTemplates.id, id));
    }
  }

  async getOpdTemplateVersions(templateId: string): Promise<OpdTemplateVersion[]> {
    return await db.select().from(opdTemplateVersions)
      .where(eq(opdTemplateVersions.templateId, templateId))
      .orderBy(desc(opdTemplateVersions.version));
  }

  async seedSystemTemplates(): Promise<void> {
    const existingTemplates = await db.select().from(opdPrescriptionTemplates).limit(1);
    if (existingTemplates.length > 0) {
      console.log("OPD templates already exist, skipping seed...");
      return;
    }

    console.log("Seeding OPD prescription templates...");

    const systemTemplates = [
      {
        name: "Common Cold / Rhinitis",
        slug: "common-cold-rhinitis",
        description: "Template for common cold and viral rhinitis",
        category: "General",
        symptoms: JSON.stringify([
          "Runny nose", "Sneezing", "Nasal congestion", "Mild fever",
          "Headache", "Watery eyes", "Sore throat (mild)"
        ]),
        medicines: JSON.stringify([
          { medicineName: "Cetirizine", dosageForm: "Tab", strength: "10 mg", frequency: "1", mealTiming: "after_food", duration: 5, durationUnit: "days", specialInstructions: "May cause drowsiness" },
          { medicineName: "Paracetamol", dosageForm: "Tab", strength: "650 mg", frequency: "SOS", mealTiming: "after_food", duration: 3, durationUnit: "days", specialInstructions: "Max 3/day" },
          { medicineName: "Steam inhalation", dosageForm: "Therapy", strength: "", frequency: "2", mealTiming: "any", duration: 5, durationUnit: "days", specialInstructions: "Morning & Night" }
        ]),
        instructions: JSON.stringify("Adequate rest, warm fluids, steam inhalation"),
        suggestedTests: JSON.stringify(["CBC (if symptoms persist > 3 days)"]),
        followUpDays: 5,
        dietAdvice: "Avoid cold drinks, prefer warm food",
        activityAdvice: "Rest, avoid cold exposure",
        isSystemTemplate: true,
        isPublic: true
      },
      {
        name: "Fever - Acute / Viral",
        slug: "fever-acute-viral",
        description: "Template for acute fever of viral origin",
        category: "General",
        symptoms: JSON.stringify([
          "High body temperature", "Chills", "Body ache", "Headache",
          "Weakness", "Loss of appetite"
        ]),
        medicines: JSON.stringify([
          { medicineName: "Paracetamol", dosageForm: "Tab", strength: "650 mg", frequency: "3", mealTiming: "after_food", duration: 3, durationUnit: "days", specialInstructions: "" },
          { medicineName: "Pantoprazole", dosageForm: "Tab", strength: "40 mg", frequency: "1", mealTiming: "before_food", duration: 3, durationUnit: "days", specialInstructions: "" }
        ]),
        instructions: JSON.stringify("Monitor temperature every 6 hours"),
        suggestedTests: JSON.stringify(["CBC", "Dengue / Malaria (if fever > 2 days)"]),
        followUpDays: 2,
        dietAdvice: "Light food, increased fluids",
        activityAdvice: "Complete bed rest",
        isSystemTemplate: true,
        isPublic: true
      },
      {
        name: "Throat Infection / Pharyngitis",
        slug: "throat-infection-pharyngitis",
        description: "Template for sore throat and pharyngitis",
        category: "ENT",
        symptoms: JSON.stringify([
          "Sore throat", "Pain while swallowing", "Fever",
          "Hoarseness of voice", "Redness in throat"
        ]),
        medicines: JSON.stringify([
          { medicineName: "Azithromycin", dosageForm: "Tab", strength: "500 mg", frequency: "1", mealTiming: "after_food", duration: 5, durationUnit: "days", specialInstructions: "" },
          { medicineName: "Paracetamol", dosageForm: "Tab", strength: "650 mg", frequency: "SOS", mealTiming: "after_food", duration: 3, durationUnit: "days", specialInstructions: "" },
          { medicineName: "Warm saline gargle", dosageForm: "Therapy", strength: "", frequency: "2", mealTiming: "any", duration: 5, durationUnit: "days", specialInstructions: "Morning & Night" }
        ]),
        instructions: JSON.stringify("Avoid cold beverages, Voice rest"),
        suggestedTests: JSON.stringify(["Throat swab (if recurrent)"]),
        followUpDays: 5,
        dietAdvice: "Warm liquids, soft food",
        activityAdvice: "Voice rest",
        isSystemTemplate: true,
        isPublic: true
      },
      {
        name: "Stomach Infection / Gastroenteritis",
        slug: "stomach-infection-gastroenteritis",
        description: "Template for diarrhea and stomach infections",
        category: "Gastroenterology",
        symptoms: JSON.stringify([
          "Loose motions", "Abdominal pain", "Vomiting", "Fever", "Dehydration"
        ]),
        medicines: JSON.stringify([
          { medicineName: "Ofloxacin + Ornidazole", dosageForm: "Tab", strength: "", frequency: "2", mealTiming: "after_food", duration: 5, durationUnit: "days", specialInstructions: "" },
          { medicineName: "ORS", dosageForm: "Sachet", strength: "", frequency: "SOS", mealTiming: "any", duration: 3, durationUnit: "days", specialInstructions: "After each stool" },
          { medicineName: "Pantoprazole", dosageForm: "Tab", strength: "40 mg", frequency: "1", mealTiming: "before_food", duration: 5, durationUnit: "days", specialInstructions: "" }
        ]),
        instructions: JSON.stringify("Strict hygiene, Avoid outside food"),
        suggestedTests: JSON.stringify(["Stool routine (conditional)"]),
        followUpDays: 3,
        dietAdvice: "Liquid / soft diet",
        activityAdvice: "Rest at home",
        isSystemTemplate: true,
        isPublic: true
      },
      {
        name: "Acidity / GERD",
        slug: "acidity-gerd",
        description: "Template for acid reflux and GERD",
        category: "Gastroenterology",
        symptoms: JSON.stringify([
          "Burning sensation in chest", "Sour belching", "Upper abdominal pain", "Nausea"
        ]),
        medicines: JSON.stringify([
          { medicineName: "Pantoprazole", dosageForm: "Tab", strength: "40 mg", frequency: "1", mealTiming: "before_food", duration: 7, durationUnit: "days", specialInstructions: "" },
          { medicineName: "Antacid syrup", dosageForm: "Syrup", strength: "10 ml", frequency: "2", mealTiming: "after_food", duration: 7, durationUnit: "days", specialInstructions: "" }
        ]),
        instructions: JSON.stringify("Avoid late night meals, No smoking/alcohol"),
        suggestedTests: JSON.stringify(["USG Abdomen (if chronic)"]),
        followUpDays: 7,
        dietAdvice: "Avoid spicy & oily food",
        activityAdvice: "No lying down immediately after meals",
        isSystemTemplate: true,
        isPublic: true
      },
      {
        name: "Hypertension",
        slug: "hypertension",
        description: "Template for high blood pressure management",
        category: "Cardiology",
        symptoms: JSON.stringify([
          "Headache", "Dizziness", "Palpitations", "Often asymptomatic"
        ]),
        medicines: JSON.stringify([
          { medicineName: "Amlodipine", dosageForm: "Tab", strength: "5 mg", frequency: "1", mealTiming: "any", duration: 30, durationUnit: "days", specialInstructions: "Take in morning" }
        ]),
        instructions: JSON.stringify("Daily BP monitoring"),
        suggestedTests: JSON.stringify(["BP Chart", "ECG", "Lipid profile"]),
        followUpDays: 14,
        dietAdvice: "Low salt diet",
        activityAdvice: "Regular light exercise",
        isSystemTemplate: true,
        isPublic: true
      },
      {
        name: "Diabetes Mellitus - Type 2",
        slug: "diabetes-type-2",
        description: "Template for Type 2 Diabetes management",
        category: "Endocrinology",
        symptoms: JSON.stringify([
          "Increased thirst", "Frequent urination", "Fatigue", "Slow wound healing"
        ]),
        medicines: JSON.stringify([
          { medicineName: "Metformin", dosageForm: "Tab", strength: "500 mg", frequency: "2", mealTiming: "after_food", duration: 30, durationUnit: "days", specialInstructions: "" }
        ]),
        instructions: JSON.stringify("Sugar monitoring explained"),
        suggestedTests: JSON.stringify(["Fasting Sugar", "PP Sugar", "HbA1c"]),
        followUpDays: 30,
        dietAdvice: "Diabetic diet plan",
        activityAdvice: "Regular walking",
        isSystemTemplate: true,
        isPublic: true
      },
      {
        name: "Urinary Tract Infection",
        slug: "urinary-tract-infection",
        description: "Template for UTI management",
        category: "Urology",
        symptoms: JSON.stringify([
          "Burning urination", "Frequent urination", "Lower abdominal pain", "Fever"
        ]),
        medicines: JSON.stringify([
          { medicineName: "Nitrofurantoin", dosageForm: "Tab", strength: "100 mg", frequency: "2", mealTiming: "after_food", duration: 7, durationUnit: "days", specialInstructions: "" },
          { medicineName: "Urinary alkalizer", dosageForm: "Syrup", strength: "10 ml", frequency: "2", mealTiming: "after_food", duration: 5, durationUnit: "days", specialInstructions: "" }
        ]),
        instructions: JSON.stringify("Increase water intake"),
        suggestedTests: JSON.stringify(["Urine routine", "Urine culture"]),
        followUpDays: 7,
        dietAdvice: "Plenty of water",
        activityAdvice: "Normal activity",
        isSystemTemplate: true,
        isPublic: true
      },
      {
        name: "Body Pain / Muscle Strain",
        slug: "body-pain-muscle-strain",
        description: "Template for muscle pain and strain",
        category: "Orthopedics",
        symptoms: JSON.stringify([
          "Localized pain", "Muscle stiffness", "Reduced movement"
        ]),
        medicines: JSON.stringify([
          { medicineName: "Aceclofenac", dosageForm: "Tab", strength: "100 mg", frequency: "2", mealTiming: "after_food", duration: 5, durationUnit: "days", specialInstructions: "" },
          { medicineName: "Muscle relaxant", dosageForm: "Tab", strength: "", frequency: "1", mealTiming: "after_food", duration: 5, durationUnit: "days", specialInstructions: "Night only" }
        ]),
        instructions: JSON.stringify("Hot fomentation"),
        suggestedTests: JSON.stringify(["X-ray (if injury)"]),
        followUpDays: 5,
        dietAdvice: "Regular diet",
        activityAdvice: "Avoid strenuous activity",
        isSystemTemplate: true,
        isPublic: true
      },
      {
        name: "Pregnancy - Routine Visit",
        slug: "pregnancy-routine-visit",
        description: "Template for routine antenatal checkup",
        category: "Obstetrics",
        symptoms: JSON.stringify([
          "Missed periods", "Nausea", "Back pain", "Fatigue"
        ]),
        medicines: JSON.stringify([
          { medicineName: "Folic Acid", dosageForm: "Tab", strength: "5 mg", frequency: "1", mealTiming: "after_food", duration: 30, durationUnit: "days", specialInstructions: "" },
          { medicineName: "Iron + Calcium", dosageForm: "Tab", strength: "", frequency: "1", mealTiming: "after_food", duration: 30, durationUnit: "days", specialInstructions: "Night" }
        ]),
        instructions: JSON.stringify("Antenatal counseling"),
        suggestedTests: JSON.stringify(["Sonography (USG)", "Hb", "Blood group", "Sugar test"]),
        followUpDays: 30,
        dietAdvice: "Balanced diet with proteins",
        activityAdvice: "Light activity, no heavy lifting",
        isSystemTemplate: true,
        isPublic: true
      }
    ];

    for (const template of systemTemplates) {
      await db.insert(opdPrescriptionTemplates).values(template);
    }

    console.log("OPD prescription templates seeded successfully!");
  }

  // ========== NURSE DEPARTMENT PREFERENCES ==========
  async getAllNurseDepartmentPreferences(): Promise<any[]> {
    return await db.select().from(nurseDepartmentPreferences).orderBy(nurseDepartmentPreferences.nurseName);
  }

  async getNurseDepartmentPreferences(nurseId: string): Promise<any | undefined> {
    const result = await db.select().from(nurseDepartmentPreferences)
      .where(eq(nurseDepartmentPreferences.nurseId, nurseId))
      .limit(1);
    return result[0];
  }

  async upsertNurseDepartmentPreferences(preferences: any): Promise<any> {
    const existing = await this.getNurseDepartmentPreferences(preferences.nurseId);
    
    if (existing) {
      const result = await db.update(nurseDepartmentPreferences)
        .set({
          nurseName: preferences.nurseName,
          primaryDepartment: preferences.primaryDepartment,
          secondaryDepartment: preferences.secondaryDepartment,
          tertiaryDepartment: preferences.tertiaryDepartment,
          updatedAt: new Date()
        })
        .where(eq(nurseDepartmentPreferences.nurseId, preferences.nurseId))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(nurseDepartmentPreferences)
        .values({
          nurseId: preferences.nurseId,
          nurseName: preferences.nurseName,
          primaryDepartment: preferences.primaryDepartment,
          secondaryDepartment: preferences.secondaryDepartment,
          tertiaryDepartment: preferences.tertiaryDepartment
        })
        .returning();
      return result[0];
    }
  }

  async deleteNurseDepartmentPreferences(nurseId: string): Promise<boolean> {
    const result = await db.delete(nurseDepartmentPreferences)
      .where(eq(nurseDepartmentPreferences.nurseId, nurseId))
      .returning();
    return result.length > 0;
  }

  async updateNurseAvailability(nurseId: string, isAvailable: boolean): Promise<any | undefined> {
    const result = await db.update(nurseDepartmentPreferences)
      .set({ isAvailable, updatedAt: new Date() })
      .where(eq(nurseDepartmentPreferences.nurseId, nurseId))
      .returning();
    return result[0];
  }

  async getNurseDepartmentPreferencesByName(nurseName: string): Promise<any | undefined> {
    const result = await db.select().from(nurseDepartmentPreferences)
      .where(eq(nurseDepartmentPreferences.nurseName, nurseName))
      .limit(1);
    return result[0];
  }

  async updateNurseAssignment(nurseName: string, assignedRoom: string | null, assignedDoctor: string | null, department: string | null): Promise<any | undefined> {
    const nurse = await this.getNurseDepartmentPreferencesByName(nurseName);
    if (!nurse) return undefined;

    let assignedPosition: string | null = null;
    if (department) {
      if (nurse.primaryDepartment === department) {
        assignedPosition = "Primary";
      } else if (nurse.secondaryDepartment === department) {
        assignedPosition = "Secondary";
      } else if (nurse.tertiaryDepartment === department) {
        assignedPosition = "Tertiary";
      }
    }

    const result = await db.update(nurseDepartmentPreferences)
      .set({ 
        isAvailable: false,
        assignedRoom,
        assignedDoctor,
        assignedPosition,
        updatedAt: new Date() 
      })
      .where(eq(nurseDepartmentPreferences.nurseName, nurseName))
      .returning();
    return result[0];
  }

  async clearNurseAssignment(nurseName: string): Promise<any | undefined> {
    const result = await db.update(nurseDepartmentPreferences)
      .set({ 
        isAvailable: true,
        assignedRoom: null,
        assignedDoctor: null,
        assignedPosition: null,
        updatedAt: new Date() 
      })
      .where(eq(nurseDepartmentPreferences.nurseName, nurseName))
      .returning();
    return result[0];
  }

  async seedNurseDepartmentPreferences(): Promise<void> {
    const existing = await db.select().from(nurseDepartmentPreferences).limit(1);
    if (existing.length > 0) {
      console.log("Nurse department preferences already exist, skipping seed...");
      return;
    }

    console.log("Seeding nurse department preferences...");

    const HOSPITAL_DEPARTMENTS = [
      "Emergency", "Cardiology", "Neurology", "Orthopedics", "Pediatrics",
      "Oncology", "Ophthalmology", "ENT", "Dermatology", "Psychiatry",
      "Gynecology", "Urology", "Nephrology", "Gastroenterology", "Pulmonology",
      "Endocrinology", "Rheumatology", "Pathology", "Radiology", "Physiotherapy",
      "Dental", "General Medicine", "General Surgery", "ICU"
    ];

    // Create nurse test data with department preferences
    const nursePreferences = [
      { nurseId: "nurse-001", nurseName: "Sister Priya Sharma", primary: "Emergency", secondary: "ICU", tertiary: "General Medicine" },
      { nurseId: "nurse-002", nurseName: "Sister Anjali Patel", primary: "Cardiology", secondary: "ICU", tertiary: "Emergency" },
      { nurseId: "nurse-003", nurseName: "Sister Meena Gupta", primary: "Neurology", secondary: "Emergency", tertiary: "ICU" },
      { nurseId: "nurse-004", nurseName: "Sister Kavita Singh", primary: "Orthopedics", secondary: "Physiotherapy", tertiary: "Emergency" },
      { nurseId: "nurse-005", nurseName: "Sister Sunita Rao", primary: "Pediatrics", secondary: "General Medicine", tertiary: "Emergency" },
      { nurseId: "nurse-006", nurseName: "Sister Rekha Verma", primary: "Oncology", secondary: "ICU", tertiary: "General Medicine" },
      { nurseId: "nurse-007", nurseName: "Sister Deepa Joshi", primary: "Ophthalmology", secondary: "ENT", tertiary: "General Medicine" },
      { nurseId: "nurse-008", nurseName: "Sister Neha Kulkarni", primary: "ENT", secondary: "Ophthalmology", tertiary: "Dermatology" },
      { nurseId: "nurse-009", nurseName: "Sister Pooja Desai", primary: "Dermatology", secondary: "General Medicine", tertiary: "Rheumatology" },
      { nurseId: "nurse-010", nurseName: "Sister Swati Nair", primary: "Psychiatry", secondary: "Neurology", tertiary: "General Medicine" },
      { nurseId: "nurse-011", nurseName: "Sister Rashmi Pillai", primary: "Gynecology", secondary: "Pediatrics", tertiary: "General Medicine" },
      { nurseId: "nurse-012", nurseName: "Sister Lakshmi Iyer", primary: "Urology", secondary: "Nephrology", tertiary: "General Surgery" },
      { nurseId: "nurse-013", nurseName: "Sister Vidya Menon", primary: "Nephrology", secondary: "ICU", tertiary: "General Medicine" },
      { nurseId: "nurse-014", nurseName: "Sister Shweta Patil", primary: "Gastroenterology", secondary: "General Medicine", tertiary: "Emergency" },
      { nurseId: "nurse-015", nurseName: "Sister Pallavi Reddy", primary: "Pulmonology", secondary: "ICU", tertiary: "Emergency" },
      { nurseId: "nurse-016", nurseName: "Sister Anita Saxena", primary: "Endocrinology", secondary: "General Medicine", tertiary: "Cardiology" },
      { nurseId: "nurse-017", nurseName: "Sister Divya Chopra", primary: "Rheumatology", secondary: "Orthopedics", tertiary: "General Medicine" },
      { nurseId: "nurse-018", nurseName: "Sister Manisha Jain", primary: "Pathology", secondary: "General Medicine", tertiary: "Oncology" },
      { nurseId: "nurse-019", nurseName: "Sister Ritu Agarwal", primary: "Radiology", secondary: "Emergency", tertiary: "Neurology" },
      { nurseId: "nurse-020", nurseName: "Sister Geeta Bhat", primary: "Physiotherapy", secondary: "Orthopedics", tertiary: "Neurology" },
      { nurseId: "nurse-021", nurseName: "Sister Sarita Mishra", primary: "Dental", secondary: "ENT", tertiary: "General Medicine" },
      { nurseId: "nurse-022", nurseName: "Sister Archana Tiwari", primary: "General Medicine", secondary: "Emergency", tertiary: "Cardiology" },
      { nurseId: "nurse-023", nurseName: "Sister Bhavana Kumar", primary: "General Surgery", secondary: "ICU", tertiary: "Emergency" },
      { nurseId: "nurse-024", nurseName: "Sister Chitra Shetty", primary: "ICU", secondary: "Emergency", tertiary: "Cardiology" },
    ];

    for (const nurse of nursePreferences) {
      await db.insert(nurseDepartmentPreferences).values({
        nurseId: nurse.nurseId,
        nurseName: nurse.nurseName,
        primaryDepartment: nurse.primary,
        secondaryDepartment: nurse.secondary,
        tertiaryDepartment: nurse.tertiary
      });
    }

    console.log(`Seeded ${nursePreferences.length} nurse department preferences successfully!`);
  }

  // ========== ICU DROPDOWN DATA METHODS ==========
  
  // Get all beds
  async getAllBeds(): Promise<Bed[]> {
    return await db.select().from(beds).orderBy(beds.bedNumber);
  }
  
  // Get available ICU beds (department = ICU/Critical Care and status = available)
  async getAvailableIcuBeds(): Promise<Bed[]> {
    return await db.select().from(beds)
      .where(and(
        or(
          eq(beds.department, "ICU"),
          eq(beds.department, "Critical Care")
        ),
        eq(beds.occupancyStatus, "available"),
        eq(beds.isActive, true)
      ))
      .orderBy(beds.bedNumber);
  }
  
  // Get all doctors for ICU consultant dropdowns (show ALL doctors, not just ICU-specific)
  async getIcuDoctors(): Promise<StaffMaster[]> {
    const allDoctors = await db.select().from(staffMaster)
      .where(and(
        eq(staffMaster.role, "DOCTOR"),
        eq(staffMaster.status, "ACTIVE")
      ))
      .orderBy(staffMaster.fullName);
    
    return allDoctors;
  }
  
  // Get nurses with ICU as one of their department preferences
  async getIcuNurses(): Promise<any[]> {
    const allPreferences = await db.select().from(nurseDepartmentPreferences)
      .orderBy(nurseDepartmentPreferences.nurseName);
    
    // Filter for nurses with ICU in any of their preferences
    return allPreferences.filter(nurse => 
      nurse.primaryDepartment === "ICU" ||
      nurse.secondaryDepartment === "ICU" ||
      nurse.tertiaryDepartment === "ICU"
    );
  }
  
  // Get ICU-admitted patients from tracking_patients table (real-time ICU data)
  async getAdmittedPatientsWithDetails(): Promise<any[]> {
    // Fetch only patients currently in ICU (is_in_icu = true)
    const icuPatients = await db.select().from(trackingPatients)
      .where(eq(trackingPatients.isInIcu, true))
      .orderBy(desc(trackingPatients.admissionDate));
    
    // Format the data for the frontend dropdown
    return icuPatients.map(patient => {
      // Parse name into firstName/lastName
      const nameParts = (patient.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      return {
        id: patient.id,
        firstName,
        lastName,
        name: patient.name,
        admissionDate: patient.admissionDate,
        wardType: 'ICU',
        bedNumber: patient.room,
        department: patient.department,
        diagnosis: patient.diagnosis,
        gender: patient.gender,
        age: patient.age,
        bloodType: patient.bloodGroup,
        doctor: patient.doctor,
        status: patient.status
      };
    });
  }

  // Seed ICU beds if not exist
  async seedIcuBeds(): Promise<void> {
    const existingBeds = await db.select().from(beds).limit(1);
    if (existingBeds.length > 0) {
      console.log("Beds already exist, skipping ICU bed seed...");
      return;
    }

    console.log("Seeding ICU beds...");
    
    const icuBeds = [];
    for (let i = 1; i <= 20; i++) {
      icuBeds.push({
        bedNumber: `ICU-${i.toString().padStart(2, '0')}`,
        bedName: `ICU Bed ${i}`,
        categoryId: "icu-standard",
        wardName: "Intensive Care Unit",
        floor: "2",
        department: "Critical Care",
        occupancyStatus: "available",
        hasOxygenCapability: true,
        hasVentilatorCapability: i <= 10, // First 10 beds have ventilator
        isIsolationBed: i === 19 || i === 20, // Last 2 are isolation beds
        isActive: true
      });
    }

    for (const bed of icuBeds) {
      await db.insert(beds).values(bed);
    }

    console.log(`Seeded ${icuBeds.length} ICU beds successfully!`);
  }

  // ========== DEPARTMENT NURSE ASSIGNMENTS ==========
  async getAllDepartmentNurseAssignments(): Promise<any[]> {
    return await db.select().from(departmentNurseAssignments).orderBy(departmentNurseAssignments.departmentName);
  }

  async getDepartmentNurseAssignment(departmentName: string): Promise<any | undefined> {
    const result = await db.select().from(departmentNurseAssignments).where(eq(departmentNurseAssignments.departmentName, departmentName));
    return result[0];
  }

  async upsertDepartmentNurseAssignment(assignment: any): Promise<any> {
    const existing = await this.getDepartmentNurseAssignment(assignment.departmentName);
    
    if (existing) {
      const result = await db.update(departmentNurseAssignments)
        .set({
          primaryNurseId: assignment.primaryNurseId || null,
          primaryNurseName: assignment.primaryNurseName || null,
          secondaryNurseId: assignment.secondaryNurseId || null,
          secondaryNurseName: assignment.secondaryNurseName || null,
          tertiaryNurseId: assignment.tertiaryNurseId || null,
          tertiaryNurseName: assignment.tertiaryNurseName || null,
          updatedAt: new Date()
        })
        .where(eq(departmentNurseAssignments.departmentName, assignment.departmentName))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(departmentNurseAssignments)
        .values({
          departmentName: assignment.departmentName,
          primaryNurseId: assignment.primaryNurseId || null,
          primaryNurseName: assignment.primaryNurseName || null,
          secondaryNurseId: assignment.secondaryNurseId || null,
          secondaryNurseName: assignment.secondaryNurseName || null,
          tertiaryNurseId: assignment.tertiaryNurseId || null,
          tertiaryNurseName: assignment.tertiaryNurseName || null
        })
        .returning();
      return result[0];
    }
  }

  async deleteDepartmentNurseAssignment(departmentName: string): Promise<boolean> {
    const result = await db.delete(departmentNurseAssignments)
      .where(eq(departmentNurseAssignments.departmentName, departmentName));
    return true;
  }

  async initializeDepartmentNurseAssignments(): Promise<void> {
    const existing = await db.select().from(departmentNurseAssignments).limit(1);
    if (existing.length > 0) {
      console.log("Department nurse assignments already initialized, skipping...");
      return;
    }

    console.log("Initializing department nurse assignments...");

    const HOSPITAL_DEPARTMENTS = [
      "Emergency", "Cardiology", "Neurology", "Orthopedics", "Pediatrics",
      "Oncology", "Ophthalmology", "ENT", "Dermatology", "Psychiatry",
      "Gynecology", "Urology", "Nephrology", "Gastroenterology", "Pulmonology",
      "Endocrinology", "Rheumatology", "Pathology", "Radiology", "Physiotherapy",
      "Dental", "General Medicine", "General Surgery", "ICU"
    ];

    for (const dept of HOSPITAL_DEPARTMENTS) {
      await db.insert(departmentNurseAssignments).values({
        departmentName: dept
      });
    }

    console.log(`Initialized ${HOSPITAL_DEPARTMENTS.length} departments for nurse assignments!`);
  }

  // ========== DIAGNOSTIC TEST ORDERS ==========
  async createDiagnosticTestOrder(order: any): Promise<any> {
    const result = await db.insert(diagnosticTestOrders).values(order).returning();
    return result[0];
  }

  async getAllDiagnosticTestOrders(): Promise<any[]> {
    return await db.select().from(diagnosticTestOrders).orderBy(desc(diagnosticTestOrders.orderedDate));
  }

  async getDiagnosticTestOrderById(id: string): Promise<any | undefined> {
    const result = await db.select().from(diagnosticTestOrders).where(eq(diagnosticTestOrders.id, id));
    return result[0];
  }

  async getDiagnosticTestOrdersByPatient(patientId: string): Promise<any[]> {
    return await db.select().from(diagnosticTestOrders).where(eq(diagnosticTestOrders.patientId, patientId)).orderBy(desc(diagnosticTestOrders.orderedDate));
  }

  async getDiagnosticTestOrdersByDoctor(doctorId: string): Promise<any[]> {
    return await db.select().from(diagnosticTestOrders).where(eq(diagnosticTestOrders.doctorId, doctorId)).orderBy(desc(diagnosticTestOrders.orderedDate));
  }

  async getDiagnosticTestOrdersByStatus(status: string): Promise<any[]> {
    return await db.select().from(diagnosticTestOrders).where(eq(diagnosticTestOrders.status, status)).orderBy(desc(diagnosticTestOrders.orderedDate));
  }

  async getPendingDiagnosticTestOrders(): Promise<any[]> {
    return await db.select().from(diagnosticTestOrders)
      .where(sql`${diagnosticTestOrders.status} IN ('PENDING', 'SAMPLE_COLLECTED', 'IN_PROGRESS') AND ${diagnosticTestOrders.source} = 'PATIENT_MONITORING'`)
      .orderBy(desc(diagnosticTestOrders.orderedDate));
  }

  async getDiagnosticTestOrdersByIcuChart(icuChartId: string): Promise<any[]> {
    return await db.select().from(diagnosticTestOrders)
      .where(eq(diagnosticTestOrders.icuChartId, icuChartId))
      .orderBy(desc(diagnosticTestOrders.orderedDate));
  }

  async getDiagnosticTestOrdersBySession(sessionId: string): Promise<any[]> {
    return await db.select().from(diagnosticTestOrders)
      .where(eq(diagnosticTestOrders.sessionId, sessionId))
      .orderBy(desc(diagnosticTestOrders.orderedDate));
  }

  async updateDiagnosticTestOrder(id: string, updates: any): Promise<any | undefined> {
    const result = await db.update(diagnosticTestOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(diagnosticTestOrders.id, id))
      .returning();
    return result[0];
  }

  async deleteDiagnosticTestOrder(id: string): Promise<boolean> {
    await db.delete(diagnosticTestOrders).where(eq(diagnosticTestOrders.id, id));
    return true;
  }

  // ========== TECHNICIAN REPORTS ==========
  async createTechnicianReport(report: any): Promise<any> {
    const result = await db.insert(technicianReports).values(report).returning();
    return result[0];
  }

  async getAllTechnicianReports(): Promise<any[]> {
    return await db.select().from(technicianReports).orderBy(desc(technicianReports.reportDate));
  }

  async getTechnicianReportById(id: string): Promise<any | undefined> {
    const result = await db.select().from(technicianReports).where(eq(technicianReports.id, id));
    return result[0];
  }

  async getTechnicianReportsByPatient(patientId: string): Promise<any[]> {
    return await db.select().from(technicianReports).where(eq(technicianReports.patientId, patientId)).orderBy(desc(technicianReports.reportDate));
  }

  async getTechnicianReportsByDoctor(doctorId: string): Promise<any[]> {
    return await db.select().from(technicianReports).where(eq(technicianReports.doctorId, doctorId)).orderBy(desc(technicianReports.reportDate));
  }

  async getTechnicianReportsByTechnician(technicianId: string): Promise<any[]> {
    return await db.select().from(technicianReports).where(eq(technicianReports.technicianId, technicianId)).orderBy(desc(technicianReports.reportDate));
  }

  async getTechnicianReportByTestOrder(testOrderId: string): Promise<any | undefined> {
    const result = await db.select().from(technicianReports).where(eq(technicianReports.testOrderId, testOrderId));
    return result[0];
  }

  async updateTechnicianReport(id: string, updates: any): Promise<any | undefined> {
    const result = await db.update(technicianReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(technicianReports.id, id))
      .returning();
    return result[0];
  }

  async deleteTechnicianReport(id: string): Promise<boolean> {
    await db.delete(technicianReports).where(eq(technicianReports.id, id));
    return true;
  }

  // ========== ICU MONITORING SYSTEM ==========
  
  // ICU Charts (Main record)
  async createIcuChart(chart: InsertIcuCharts): Promise<IcuCharts> {
    const result = await db.insert(icuCharts).values(chart).returning();
    return result[0];
  }

  async getAllIcuCharts(): Promise<IcuCharts[]> {
    return await db.select().from(icuCharts).orderBy(desc(icuCharts.createdAt));
  }

  async getIcuChartById(id: string): Promise<IcuCharts | undefined> {
    const result = await db.select().from(icuCharts).where(eq(icuCharts.id, id));
    return result[0];
  }

  async getIcuChartsByPatient(patientId: string): Promise<IcuCharts[]> {
    return await db.select().from(icuCharts).where(eq(icuCharts.patientId, patientId)).orderBy(desc(icuCharts.chartDate));
  }

  async getIcuChartsByDate(chartDate: string): Promise<IcuCharts[]> {
    return await db.select().from(icuCharts).where(eq(icuCharts.chartDate, chartDate));
  }

  async updateIcuChart(id: string, updates: Partial<InsertIcuCharts>): Promise<IcuCharts | undefined> {
    const result = await db.update(icuCharts).set({ ...updates, updatedAt: new Date() }).where(eq(icuCharts.id, id)).returning();
    return result[0];
  }

  async deleteIcuChart(id: string): Promise<boolean> {
    await db.delete(icuCharts).where(eq(icuCharts.id, id));
    return true;
  }

  // ICU Vital Charts
  async createIcuVitalChart(vital: InsertIcuVitalCharts): Promise<IcuVitalCharts> {
    const result = await db.insert(icuVitalCharts).values(vital).returning();
    return result[0];
  }

  async getIcuVitalChartsByChartId(icuChartId: string): Promise<IcuVitalCharts[]> {
    return await db.select().from(icuVitalCharts).where(eq(icuVitalCharts.icuChartId, icuChartId));
  }

  async updateIcuVitalChart(id: string, updates: Partial<InsertIcuVitalCharts>): Promise<IcuVitalCharts | undefined> {
    const result = await db.update(icuVitalCharts).set(updates).where(eq(icuVitalCharts.id, id)).returning();
    return result[0];
  }

  async deleteIcuVitalChart(id: string): Promise<boolean> {
    await db.delete(icuVitalCharts).where(eq(icuVitalCharts.id, id));
    return true;
  }

  // ICU Hemodynamic Monitoring
  async createIcuHemodynamicEntry(entry: InsertIcuHemodynamicMonitoring): Promise<IcuHemodynamicMonitoring> {
    const result = await db.insert(icuHemodynamicMonitoring).values(entry).returning();
    return result[0];
  }

  async getIcuHemodynamicByChartId(icuChartId: string): Promise<IcuHemodynamicMonitoring[]> {
    return await db.select().from(icuHemodynamicMonitoring).where(eq(icuHemodynamicMonitoring.icuChartId, icuChartId));
  }

  async updateIcuHemodynamicEntry(id: string, updates: Partial<InsertIcuHemodynamicMonitoring>): Promise<IcuHemodynamicMonitoring | undefined> {
    const result = await db.update(icuHemodynamicMonitoring).set(updates).where(eq(icuHemodynamicMonitoring.id, id)).returning();
    return result[0];
  }

  async deleteIcuHemodynamicEntry(id: string): Promise<boolean> {
    await db.delete(icuHemodynamicMonitoring).where(eq(icuHemodynamicMonitoring.id, id));
    return true;
  }

  // ICU Sedation Monitoring
  async createIcuSedationEntry(entry: InsertIcuSedationMonitoring): Promise<IcuSedationMonitoring> {
    const result = await db.insert(icuSedationMonitoring).values(entry).returning();
    return result[0];
  }

  async getIcuSedationByChartId(icuChartId: string): Promise<IcuSedationMonitoring[]> {
    return await db.select().from(icuSedationMonitoring).where(eq(icuSedationMonitoring.icuChartId, icuChartId));
  }

  async updateIcuSedationEntry(id: string, updates: Partial<InsertIcuSedationMonitoring>): Promise<IcuSedationMonitoring | undefined> {
    const result = await db.update(icuSedationMonitoring).set(updates).where(eq(icuSedationMonitoring.id, id)).returning();
    return result[0];
  }

  async deleteIcuSedationEntry(id: string): Promise<boolean> {
    await db.delete(icuSedationMonitoring).where(eq(icuSedationMonitoring.id, id));
    return true;
  }

  // ICU Ventilator Settings
  async createIcuVentilatorEntry(entry: InsertIcuVentilatorSettings): Promise<IcuVentilatorSettings> {
    const result = await db.insert(icuVentilatorSettings).values(entry).returning();
    return result[0];
  }

  async getIcuVentilatorByChartId(icuChartId: string): Promise<IcuVentilatorSettings[]> {
    return await db.select().from(icuVentilatorSettings).where(eq(icuVentilatorSettings.icuChartId, icuChartId));
  }

  async updateIcuVentilatorEntry(id: string, updates: Partial<InsertIcuVentilatorSettings>): Promise<IcuVentilatorSettings | undefined> {
    const result = await db.update(icuVentilatorSettings).set(updates).where(eq(icuVentilatorSettings.id, id)).returning();
    return result[0];
  }

  async deleteIcuVentilatorEntry(id: string): Promise<boolean> {
    await db.delete(icuVentilatorSettings).where(eq(icuVentilatorSettings.id, id));
    return true;
  }

  // ICU ABG Reports
  async createIcuAbgReport(report: InsertIcuAbgReports): Promise<IcuAbgReports> {
    const result = await db.insert(icuAbgReports).values(report).returning();
    return result[0];
  }

  async getIcuAbgByChartId(icuChartId: string): Promise<IcuAbgReports[]> {
    return await db.select().from(icuAbgReports).where(eq(icuAbgReports.icuChartId, icuChartId));
  }

  async updateIcuAbgReport(id: string, updates: Partial<InsertIcuAbgReports>): Promise<IcuAbgReports | undefined> {
    const result = await db.update(icuAbgReports).set(updates).where(eq(icuAbgReports.id, id)).returning();
    return result[0];
  }

  async deleteIcuAbgReport(id: string): Promise<boolean> {
    await db.delete(icuAbgReports).where(eq(icuAbgReports.id, id));
    return true;
  }

  // ICU Airway Care
  async createIcuAirwayCare(entry: InsertIcuAirwayCare): Promise<IcuAirwayCare> {
    const result = await db.insert(icuAirwayCare).values(entry).returning();
    return result[0];
  }

  async getIcuAirwayCareByChartId(icuChartId: string): Promise<IcuAirwayCare[]> {
    return await db.select().from(icuAirwayCare).where(eq(icuAirwayCare.icuChartId, icuChartId));
  }

  async updateIcuAirwayCare(id: string, updates: Partial<InsertIcuAirwayCare>): Promise<IcuAirwayCare | undefined> {
    const result = await db.update(icuAirwayCare).set(updates).where(eq(icuAirwayCare.id, id)).returning();
    return result[0];
  }

  async deleteIcuAirwayCare(id: string): Promise<boolean> {
    await db.delete(icuAirwayCare).where(eq(icuAirwayCare.id, id));
    return true;
  }

  // ICU Daily Investigations
  async createIcuDailyInvestigation(investigation: InsertIcuDailyInvestigations): Promise<IcuDailyInvestigations> {
    const result = await db.insert(icuDailyInvestigations).values(investigation).returning();
    return result[0];
  }

  async getIcuDailyInvestigationByChartId(icuChartId: string): Promise<IcuDailyInvestigations | undefined> {
    const result = await db.select().from(icuDailyInvestigations).where(eq(icuDailyInvestigations.icuChartId, icuChartId));
    return result[0];
  }

  async updateIcuDailyInvestigation(id: string, updates: Partial<InsertIcuDailyInvestigations>): Promise<IcuDailyInvestigations | undefined> {
    const result = await db.update(icuDailyInvestigations).set(updates).where(eq(icuDailyInvestigations.id, id)).returning();
    return result[0];
  }

  async deleteIcuDailyInvestigation(id: string): Promise<boolean> {
    await db.delete(icuDailyInvestigations).where(eq(icuDailyInvestigations.id, id));
    return true;
  }

  // ICU Diabetic Chart
  async createIcuDiabeticEntry(entry: InsertIcuDiabeticChart): Promise<IcuDiabeticChart> {
    const result = await db.insert(icuDiabeticChart).values(entry).returning();
    return result[0];
  }

  async getIcuDiabeticByChartId(icuChartId: string): Promise<IcuDiabeticChart[]> {
    return await db.select().from(icuDiabeticChart).where(eq(icuDiabeticChart.icuChartId, icuChartId));
  }

  async updateIcuDiabeticEntry(id: string, updates: Partial<InsertIcuDiabeticChart>): Promise<IcuDiabeticChart | undefined> {
    const result = await db.update(icuDiabeticChart).set(updates).where(eq(icuDiabeticChart.id, id)).returning();
    return result[0];
  }

  async deleteIcuDiabeticEntry(id: string): Promise<boolean> {
    await db.delete(icuDiabeticChart).where(eq(icuDiabeticChart.id, id));
    return true;
  }

  // ICU Play of Day
  async createIcuPlayOfDay(entry: InsertIcuPlayOfDay): Promise<IcuPlayOfDay> {
    const result = await db.insert(icuPlayOfDay).values(entry).returning();
    return result[0];
  }

  async getIcuPlayOfDayByChartId(icuChartId: string): Promise<IcuPlayOfDay | undefined> {
    const result = await db.select().from(icuPlayOfDay).where(eq(icuPlayOfDay.icuChartId, icuChartId));
    return result[0];
  }

  async updateIcuPlayOfDay(id: string, updates: Partial<InsertIcuPlayOfDay>): Promise<IcuPlayOfDay | undefined> {
    const result = await db.update(icuPlayOfDay).set(updates).where(eq(icuPlayOfDay.id, id)).returning();
    return result[0];
  }

  async deleteIcuPlayOfDay(id: string): Promise<boolean> {
    await db.delete(icuPlayOfDay).where(eq(icuPlayOfDay.id, id));
    return true;
  }

  // ICU Cuff Pressure
  async createIcuCuffPressure(entry: InsertIcuCuffPressure): Promise<IcuCuffPressure> {
    const result = await db.insert(icuCuffPressure).values(entry).returning();
    return result[0];
  }

  async getIcuCuffPressureByChartId(icuChartId: string): Promise<IcuCuffPressure | undefined> {
    const result = await db.select().from(icuCuffPressure).where(eq(icuCuffPressure.icuChartId, icuChartId));
    return result[0];
  }

  async updateIcuCuffPressure(id: string, updates: Partial<InsertIcuCuffPressure>): Promise<IcuCuffPressure | undefined> {
    const result = await db.update(icuCuffPressure).set(updates).where(eq(icuCuffPressure.id, id)).returning();
    return result[0];
  }

  async deleteIcuCuffPressure(id: string): Promise<boolean> {
    await db.delete(icuCuffPressure).where(eq(icuCuffPressure.id, id));
    return true;
  }

  // ICU ETT/Tracheostomy
  async createIcuEttTracheostomy(entry: InsertIcuEttTracheostomy): Promise<IcuEttTracheostomy> {
    const result = await db.insert(icuEttTracheostomy).values(entry).returning();
    return result[0];
  }

  async getIcuEttTracheostomyByChartId(icuChartId: string): Promise<IcuEttTracheostomy | undefined> {
    const result = await db.select().from(icuEttTracheostomy).where(eq(icuEttTracheostomy.icuChartId, icuChartId));
    return result[0];
  }

  async updateIcuEttTracheostomy(id: string, updates: Partial<InsertIcuEttTracheostomy>): Promise<IcuEttTracheostomy | undefined> {
    const result = await db.update(icuEttTracheostomy).set(updates).where(eq(icuEttTracheostomy.id, id)).returning();
    return result[0];
  }

  async deleteIcuEttTracheostomy(id: string): Promise<boolean> {
    await db.delete(icuEttTracheostomy).where(eq(icuEttTracheostomy.id, id));
    return true;
  }

  // ICU Duration
  async createIcuDuration(entry: InsertIcuDuration): Promise<IcuDuration> {
    const result = await db.insert(icuDuration).values(entry).returning();
    return result[0];
  }

  async getIcuDurationByChartId(icuChartId: string): Promise<IcuDuration | undefined> {
    const result = await db.select().from(icuDuration).where(eq(icuDuration.icuChartId, icuChartId));
    return result[0];
  }

  async updateIcuDuration(id: string, updates: Partial<InsertIcuDuration>): Promise<IcuDuration | undefined> {
    const result = await db.update(icuDuration).set(updates).where(eq(icuDuration.id, id)).returning();
    return result[0];
  }

  async deleteIcuDuration(id: string): Promise<boolean> {
    await db.delete(icuDuration).where(eq(icuDuration.id, id));
    return true;
  }

  // ICU Fluid Balance Target
  async createIcuFluidBalanceTarget(entry: InsertIcuFluidBalanceTarget): Promise<IcuFluidBalanceTarget> {
    const result = await db.insert(icuFluidBalanceTarget).values(entry).returning();
    return result[0];
  }

  async getIcuFluidBalanceTargetByChartId(icuChartId: string): Promise<IcuFluidBalanceTarget | undefined> {
    const result = await db.select().from(icuFluidBalanceTarget).where(eq(icuFluidBalanceTarget.icuChartId, icuChartId));
    return result[0];
  }

  async updateIcuFluidBalanceTarget(id: string, updates: Partial<InsertIcuFluidBalanceTarget>): Promise<IcuFluidBalanceTarget | undefined> {
    const result = await db.update(icuFluidBalanceTarget).set(updates).where(eq(icuFluidBalanceTarget.id, id)).returning();
    return result[0];
  }

  async deleteIcuFluidBalanceTarget(id: string): Promise<boolean> {
    await db.delete(icuFluidBalanceTarget).where(eq(icuFluidBalanceTarget.id, id));
    return true;
  }

  // ICU Intake Chart
  async createIcuIntakeEntry(entry: InsertIcuIntakeChart): Promise<IcuIntakeChart> {
    const result = await db.insert(icuIntakeChart).values(entry).returning();
    return result[0];
  }

  async getIcuIntakeByChartId(icuChartId: string): Promise<IcuIntakeChart[]> {
    return await db.select().from(icuIntakeChart).where(eq(icuIntakeChart.icuChartId, icuChartId));
  }

  async updateIcuIntakeEntry(id: string, updates: Partial<InsertIcuIntakeChart>): Promise<IcuIntakeChart | undefined> {
    const result = await db.update(icuIntakeChart).set(updates).where(eq(icuIntakeChart.id, id)).returning();
    return result[0];
  }

  async deleteIcuIntakeEntry(id: string): Promise<boolean> {
    await db.delete(icuIntakeChart).where(eq(icuIntakeChart.id, id));
    return true;
  }

  // ICU Output Chart
  async createIcuOutputEntry(entry: InsertIcuOutputChart): Promise<IcuOutputChart> {
    const result = await db.insert(icuOutputChart).values(entry).returning();
    return result[0];
  }

  async getIcuOutputByChartId(icuChartId: string): Promise<IcuOutputChart[]> {
    return await db.select().from(icuOutputChart).where(eq(icuOutputChart.icuChartId, icuChartId));
  }

  async updateIcuOutputEntry(id: string, updates: Partial<InsertIcuOutputChart>): Promise<IcuOutputChart | undefined> {
    const result = await db.update(icuOutputChart).set(updates).where(eq(icuOutputChart.id, id)).returning();
    return result[0];
  }

  async deleteIcuOutputEntry(id: string): Promise<boolean> {
    await db.delete(icuOutputChart).where(eq(icuOutputChart.id, id));
    return true;
  }

  // ICU Medication Orders
  async createIcuMedicationOrder(order: InsertIcuMedicationOrders): Promise<IcuMedicationOrders> {
    const result = await db.insert(icuMedicationOrders).values(order).returning();
    return result[0];
  }

  async getIcuMedicationOrdersByChartId(icuChartId: string): Promise<IcuMedicationOrders[]> {
    return await db.select().from(icuMedicationOrders).where(eq(icuMedicationOrders.icuChartId, icuChartId));
  }

  async updateIcuMedicationOrder(id: string, updates: Partial<InsertIcuMedicationOrders>): Promise<IcuMedicationOrders | undefined> {
    const result = await db.update(icuMedicationOrders).set(updates).where(eq(icuMedicationOrders.id, id)).returning();
    return result[0];
  }

  async deleteIcuMedicationOrder(id: string): Promise<boolean> {
    await db.delete(icuMedicationOrders).where(eq(icuMedicationOrders.id, id));
    return true;
  }

  // ICU Nursing Remarks
  async createIcuNursingRemark(remark: InsertIcuNursingRemarks): Promise<IcuNursingRemarks> {
    const result = await db.insert(icuNursingRemarks).values(remark).returning();
    return result[0];
  }

  async getIcuNursingRemarksByChartId(icuChartId: string): Promise<IcuNursingRemarks[]> {
    return await db.select().from(icuNursingRemarks).where(eq(icuNursingRemarks.icuChartId, icuChartId));
  }

  async updateIcuNursingRemark(id: string, updates: Partial<InsertIcuNursingRemarks>): Promise<IcuNursingRemarks | undefined> {
    const result = await db.update(icuNursingRemarks).set(updates).where(eq(icuNursingRemarks.id, id)).returning();
    return result[0];
  }

  async deleteIcuNursingRemark(id: string): Promise<boolean> {
    await db.delete(icuNursingRemarks).where(eq(icuNursingRemarks.id, id));
    return true;
  }

  // ICU Nursing Duty
  async createIcuNursingDuty(duty: InsertIcuNursingDuty): Promise<IcuNursingDuty> {
    const result = await db.insert(icuNursingDuty).values(duty).returning();
    return result[0];
  }

  async getIcuNursingDutyByChartId(icuChartId: string): Promise<IcuNursingDuty[]> {
    return await db.select().from(icuNursingDuty).where(eq(icuNursingDuty.icuChartId, icuChartId));
  }

  async updateIcuNursingDuty(id: string, updates: Partial<InsertIcuNursingDuty>): Promise<IcuNursingDuty | undefined> {
    const result = await db.update(icuNursingDuty).set(updates).where(eq(icuNursingDuty.id, id)).returning();
    return result[0];
  }

  async deleteIcuNursingDuty(id: string): Promise<boolean> {
    await db.delete(icuNursingDuty).where(eq(icuNursingDuty.id, id));
    return true;
  }

  // ICU Fluid Orders
  async createIcuFluidOrder(order: InsertIcuFluidOrders): Promise<IcuFluidOrders> {
    const result = await db.insert(icuFluidOrders).values(order).returning();
    return result[0];
  }

  async getIcuFluidOrdersByChartId(icuChartId: string): Promise<IcuFluidOrders[]> {
    return await db.select().from(icuFluidOrders).where(eq(icuFluidOrders.icuChartId, icuChartId));
  }

  async updateIcuFluidOrder(id: string, updates: Partial<InsertIcuFluidOrders>): Promise<IcuFluidOrders | undefined> {
    const result = await db.update(icuFluidOrders).set(updates).where(eq(icuFluidOrders.id, id)).returning();
    return result[0];
  }

  async deleteIcuFluidOrder(id: string): Promise<boolean> {
    await db.delete(icuFluidOrders).where(eq(icuFluidOrders.id, id));
    return true;
  }

  // ICU Nutrition Chart
  async createIcuNutritionEntry(entry: InsertIcuNutritionChart): Promise<IcuNutritionChart> {
    const result = await db.insert(icuNutritionChart).values(entry).returning();
    return result[0];
  }

  async getIcuNutritionByChartId(icuChartId: string): Promise<IcuNutritionChart[]> {
    return await db.select().from(icuNutritionChart).where(eq(icuNutritionChart.icuChartId, icuChartId));
  }

  async updateIcuNutritionEntry(id: string, updates: Partial<InsertIcuNutritionChart>): Promise<IcuNutritionChart | undefined> {
    const result = await db.update(icuNutritionChart).set(updates).where(eq(icuNutritionChart.id, id)).returning();
    return result[0];
  }

  async deleteIcuNutritionEntry(id: string): Promise<boolean> {
    await db.delete(icuNutritionChart).where(eq(icuNutritionChart.id, id));
    return true;
  }

  // ICU Body Marking
  async createIcuBodyMarking(marking: InsertIcuBodyMarking): Promise<IcuBodyMarking> {
    const result = await db.insert(icuBodyMarking).values(marking).returning();
    return result[0];
  }

  async getIcuBodyMarkingsByChartId(icuChartId: string): Promise<IcuBodyMarking[]> {
    return await db.select().from(icuBodyMarking).where(eq(icuBodyMarking.icuChartId, icuChartId));
  }

  async updateIcuBodyMarking(id: string, updates: Partial<InsertIcuBodyMarking>): Promise<IcuBodyMarking | undefined> {
    const result = await db.update(icuBodyMarking).set(updates).where(eq(icuBodyMarking.id, id)).returning();
    return result[0];
  }

  async deleteIcuBodyMarking(id: string): Promise<boolean> {
    await db.delete(icuBodyMarking).where(eq(icuBodyMarking.id, id));
    return true;
  }

  // ICU Nurse Diary
  async createIcuNurseDiaryEntry(entry: InsertIcuNurseDiary): Promise<IcuNurseDiary> {
    const result = await db.insert(icuNurseDiary).values(entry).returning();
    return result[0];
  }

  async getIcuNurseDiaryByChartId(icuChartId: string): Promise<IcuNurseDiary[]> {
    return await db.select().from(icuNurseDiary).where(eq(icuNurseDiary.icuChartId, icuChartId));
  }

  async updateIcuNurseDiaryEntry(id: string, updates: Partial<InsertIcuNurseDiary>): Promise<IcuNurseDiary | undefined> {
    const result = await db.update(icuNurseDiary).set(updates).where(eq(icuNurseDiary.id, id)).returning();
    return result[0];
  }

  async deleteIcuNurseDiaryEntry(id: string): Promise<boolean> {
    await db.delete(icuNurseDiary).where(eq(icuNurseDiary.id, id));
    return true;
  }

  // ICU Once Only Drugs
  async createIcuOnceOnlyDrug(drug: InsertIcuOnceOnlyDrugs): Promise<IcuOnceOnlyDrugs> {
    const result = await db.insert(icuOnceOnlyDrugs).values(drug).returning();
    return result[0];
  }

  async getIcuOnceOnlyDrugsByChartId(icuChartId: string): Promise<IcuOnceOnlyDrugs[]> {
    return await db.select().from(icuOnceOnlyDrugs).where(eq(icuOnceOnlyDrugs.icuChartId, icuChartId));
  }

  async updateIcuOnceOnlyDrug(id: string, updates: Partial<InsertIcuOnceOnlyDrugs>): Promise<IcuOnceOnlyDrugs | undefined> {
    const result = await db.update(icuOnceOnlyDrugs).set(updates).where(eq(icuOnceOnlyDrugs.id, id)).returning();
    return result[0];
  }

  async deleteIcuOnceOnlyDrug(id: string): Promise<boolean> {
    await db.delete(icuOnceOnlyDrugs).where(eq(icuOnceOnlyDrugs.id, id));
    return true;
  }

  // ICU Previous Day Notes
  async createIcuPreviousDayNotes(notes: InsertIcuPreviousDayNotes): Promise<IcuPreviousDayNotes> {
    const result = await db.insert(icuPreviousDayNotes).values(notes).returning();
    return result[0];
  }

  async getIcuPreviousDayNotesByChartId(icuChartId: string): Promise<IcuPreviousDayNotes | undefined> {
    const result = await db.select().from(icuPreviousDayNotes).where(eq(icuPreviousDayNotes.icuChartId, icuChartId));
    return result[0];
  }

  async updateIcuPreviousDayNotes(id: string, updates: Partial<InsertIcuPreviousDayNotes>): Promise<IcuPreviousDayNotes | undefined> {
    const result = await db.update(icuPreviousDayNotes).set(updates).where(eq(icuPreviousDayNotes.id, id)).returning();
    return result[0];
  }

  async deleteIcuPreviousDayNotes(id: string): Promise<boolean> {
    await db.delete(icuPreviousDayNotes).where(eq(icuPreviousDayNotes.id, id));
    return true;
  }

  // ICU Allergy Precautions
  async createIcuAllergyPrecautions(precautions: InsertIcuAllergyPrecautions): Promise<IcuAllergyPrecautions> {
    const result = await db.insert(icuAllergyPrecautions).values(precautions).returning();
    return result[0];
  }

  async getIcuAllergyPrecautionsByChartId(icuChartId: string): Promise<IcuAllergyPrecautions | undefined> {
    const result = await db.select().from(icuAllergyPrecautions).where(eq(icuAllergyPrecautions.icuChartId, icuChartId));
    return result[0];
  }

  async updateIcuAllergyPrecautions(id: string, updates: Partial<InsertIcuAllergyPrecautions>): Promise<IcuAllergyPrecautions | undefined> {
    const result = await db.update(icuAllergyPrecautions).set(updates).where(eq(icuAllergyPrecautions.id, id)).returning();
    return result[0];
  }

  async deleteIcuAllergyPrecautions(id: string): Promise<boolean> {
    await db.delete(icuAllergyPrecautions).where(eq(icuAllergyPrecautions.id, id));
    return true;
  }

  // ICU Doctor & Nurse Notes
  async createIcuDoctorNurseNote(note: any): Promise<any> {
    const result = await db.insert(icuDoctorNurseNotes).values(note).returning();
    return result[0];
  }

  async getIcuDoctorNurseNotesByChartId(icuChartId: string): Promise<any[]> {
    return await db.select().from(icuDoctorNurseNotes)
      .where(eq(icuDoctorNurseNotes.icuChartId, icuChartId))
      .orderBy(desc(icuDoctorNurseNotes.createdAt));
  }

  // Get complete ICU chart with all related data
  async getCompleteIcuChart(icuChartId: string): Promise<any> {
    const chart = await this.getIcuChartById(icuChartId);
    if (!chart) return null;

    const [
      vitalCharts, hemodynamic, sedation, ventilator, abgReports, airwayCare,
      dailyInvestigations, diabeticChart, playOfDay, cuffPressure, ettTracheostomy,
      duration, fluidBalanceTarget, intakeChart, outputChart, medicationOrders,
      nursingRemarks, nursingDuty, fluidOrders, nutritionChart, bodyMarkings,
      nurseDiary, onceOnlyDrugs, previousDayNotes, allergyPrecautions, doctorNurseNotes
    ] = await Promise.all([
      this.getIcuVitalChartsByChartId(icuChartId),
      this.getIcuHemodynamicByChartId(icuChartId),
      this.getIcuSedationByChartId(icuChartId),
      this.getIcuVentilatorByChartId(icuChartId),
      this.getIcuAbgByChartId(icuChartId),
      this.getIcuAirwayCareByChartId(icuChartId),
      this.getIcuDailyInvestigationByChartId(icuChartId),
      this.getIcuDiabeticByChartId(icuChartId),
      this.getIcuPlayOfDayByChartId(icuChartId),
      this.getIcuCuffPressureByChartId(icuChartId),
      this.getIcuEttTracheostomyByChartId(icuChartId),
      this.getIcuDurationByChartId(icuChartId),
      this.getIcuFluidBalanceTargetByChartId(icuChartId),
      this.getIcuIntakeByChartId(icuChartId),
      this.getIcuOutputByChartId(icuChartId),
      this.getIcuMedicationOrdersByChartId(icuChartId),
      this.getIcuNursingRemarksByChartId(icuChartId),
      this.getIcuNursingDutyByChartId(icuChartId),
      this.getIcuFluidOrdersByChartId(icuChartId),
      this.getIcuNutritionByChartId(icuChartId),
      this.getIcuBodyMarkingsByChartId(icuChartId),
      this.getIcuNurseDiaryByChartId(icuChartId),
      this.getIcuOnceOnlyDrugsByChartId(icuChartId),
      this.getIcuPreviousDayNotesByChartId(icuChartId),
      this.getIcuAllergyPrecautionsByChartId(icuChartId),
      this.getIcuDoctorNurseNotesByChartId(icuChartId)
    ]);

    return {
      ...chart,
      vitalCharts, hemodynamic, sedation, ventilator, abgReports, airwayCare,
      dailyInvestigations, diabeticChart, playOfDay, cuffPressure, ettTracheostomy,
      duration, fluidBalanceTarget, intakeChart, outputChart, medicationOrders,
      nursingRemarks, nursingDuty, fluidOrders, nutritionChart, bodyMarkings,
      nurseDiary, onceOnlyDrugs, previousDayNotes, allergyPrecautions, doctorNurseNotes
    };
  }

  // ========== OPERATION & OT MODULE ==========
  
  // Helper function to convert timestamp strings to Date objects for OT forms
  // Handles both full ISO date strings and time-only strings (HH:MM or HH:MM:SS)
  private convertTimestampFields(data: any, fields: string[]): any {
    const processed = { ...data };
    const today = new Date();
    const datePrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    for (const field of fields) {
      if (processed[field] && typeof processed[field] === 'string') {
        const value = processed[field].trim();
        // Check if it's a time-only value (HH:MM or HH:MM:SS)
        if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(value)) {
          // Convert time-only to full timestamp using today's date
          processed[field] = new Date(`${datePrefix}T${value}:00`);
        } else {
          // Try parsing as a full date string
          const parsed = new Date(value);
          if (!isNaN(parsed.getTime())) {
            processed[field] = parsed;
          } else {
            // If parsing fails, set to null to avoid database errors
            processed[field] = null;
          }
        }
      }
    }
    return processed;
  }

  // OT Cases
  async getOtCases(): Promise<OtCase[]> {
    return await db.select().from(otCases).orderBy(desc(otCases.scheduledDate));
  }

  async getOtCaseById(id: string): Promise<OtCase | undefined> {
    const result = await db.select().from(otCases).where(eq(otCases.id, id));
    return result[0];
  }

  async getOtCasesByPatient(patientId: string): Promise<OtCase[]> {
    return await db.select().from(otCases).where(eq(otCases.patientId, patientId)).orderBy(desc(otCases.scheduledDate));
  }

  async getOtCasesBySurgeon(surgeonId: string): Promise<OtCase[]> {
    return await db.select().from(otCases).where(eq(otCases.surgeonId, surgeonId)).orderBy(desc(otCases.scheduledDate));
  }

  async getOtCasesByDate(date: string): Promise<OtCase[]> {
    return await db.select().from(otCases).where(eq(otCases.scheduledDate, date)).orderBy(otCases.scheduledTime);
  }

  async getOtCasesByStatus(status: string): Promise<OtCase[]> {
    return await db.select().from(otCases).where(eq(otCases.status, status)).orderBy(desc(otCases.scheduledDate));
  }

  async createOtCase(data: InsertOtCase): Promise<OtCase> {
    const result = await db.insert(otCases).values(data).returning();
    return result[0];
  }

  async updateOtCase(id: string, data: Partial<InsertOtCase>): Promise<OtCase | undefined> {
    const result = await db.update(otCases).set({ ...data, updatedAt: new Date() }).where(eq(otCases.id, id)).returning();
    return result[0];
  }

  async updateOtCaseStatus(id: string, status: string): Promise<OtCase | undefined> {
    const result = await db.update(otCases).set({ status, updatedAt: new Date() }).where(eq(otCases.id, id)).returning();
    return result[0];
  }

  // OT Case Team
  async getOtCaseTeam(caseId: string): Promise<OtCaseTeam[]> {
    return await db.select().from(otCaseTeam).where(eq(otCaseTeam.caseId, caseId));
  }

  async addOtCaseTeamMember(data: InsertOtCaseTeam): Promise<OtCaseTeam> {
    const result = await db.insert(otCaseTeam).values(data).returning();
    return result[0];
  }

  async removeOtCaseTeamMember(id: string): Promise<boolean> {
    const result = await db.delete(otCaseTeam).where(eq(otCaseTeam.id, id)).returning();
    return result.length > 0;
  }

  // Pre-Op Counselling
  async getOtPreopCounselling(caseId: string): Promise<OtPreopCounselling | undefined> {
    const result = await db.select().from(otPreopCounselling).where(eq(otPreopCounselling.caseId, caseId));
    return result[0];
  }

  async createOtPreopCounselling(data: InsertOtPreopCounselling): Promise<OtPreopCounselling> {
    const processedData = this.convertTimestampFields(data, ['counsellingDateTime', 'patientSignedAt', 'completedAt']);
    const result = await db.insert(otPreopCounselling).values(processedData).returning();
    return result[0];
  }

  async updateOtPreopCounselling(id: string, data: Partial<InsertOtPreopCounselling>): Promise<OtPreopCounselling | undefined> {
    const processedData = this.convertTimestampFields(data, ['counsellingDateTime', 'patientSignedAt', 'completedAt']);
    const result = await db.update(otPreopCounselling).set(processedData).where(eq(otPreopCounselling.id, id)).returning();
    return result[0];
  }

  // Pre-Op Checklist
  async getOtPreopChecklist(caseId: string): Promise<OtPreopChecklist | undefined> {
    const result = await db.select().from(otPreopChecklist).where(eq(otPreopChecklist.caseId, caseId));
    return result[0];
  }

  async createOtPreopChecklist(data: InsertOtPreopChecklist): Promise<OtPreopChecklist> {
    const processedData = this.convertTimestampFields(data, ['completedAt', 'verifiedAt']);
    const result = await db.insert(otPreopChecklist).values(processedData).returning();
    return result[0];
  }

  async updateOtPreopChecklist(id: string, data: Partial<InsertOtPreopChecklist>): Promise<OtPreopChecklist | undefined> {
    const processedData = this.convertTimestampFields(data, ['completedAt', 'verifiedAt']);
    const result = await db.update(otPreopChecklist).set(processedData).where(eq(otPreopChecklist.id, id)).returning();
    return result[0];
  }

  // Pre-Anaesthetic Eval
  async getOtPreanaestheticEval(caseId: string): Promise<OtPreanaestheticEval | undefined> {
    const result = await db.select().from(otPreanaestheticEval).where(eq(otPreanaestheticEval.caseId, caseId));
    return result[0];
  }

  async createOtPreanaestheticEval(data: InsertOtPreanaestheticEval): Promise<OtPreanaestheticEval> {
    const processedData = this.convertTimestampFields(data, ['evaluatedAt']);
    const result = await db.insert(otPreanaestheticEval).values(processedData).returning();
    return result[0];
  }

  async updateOtPreanaestheticEval(id: string, data: Partial<InsertOtPreanaestheticEval>): Promise<OtPreanaestheticEval | undefined> {
    const processedData = this.convertTimestampFields(data, ['evaluatedAt']);
    const result = await db.update(otPreanaestheticEval).set(processedData).where(eq(otPreanaestheticEval.id, id)).returning();
    return result[0];
  }

  // Safety Checklist
  async getOtSafetyChecklist(caseId: string): Promise<OtSafetyChecklist | undefined> {
    const result = await db.select().from(otSafetyChecklist).where(eq(otSafetyChecklist.caseId, caseId));
    return result[0];
  }

  async createOtSafetyChecklist(data: InsertOtSafetyChecklist): Promise<OtSafetyChecklist> {
    const result = await db.insert(otSafetyChecklist).values(data).returning();
    return result[0];
  }

  async updateOtSafetyChecklist(id: string, data: Partial<InsertOtSafetyChecklist>): Promise<OtSafetyChecklist | undefined> {
    const result = await db.update(otSafetyChecklist).set(data).where(eq(otSafetyChecklist.id, id)).returning();
    return result[0];
  }

  // Pre-Op Assessment
  async getOtPreopAssessment(caseId: string): Promise<OtPreopAssessment | undefined> {
    const result = await db.select().from(otPreopAssessment).where(eq(otPreopAssessment.caseId, caseId));
    return result[0];
  }

  async createOtPreopAssessment(data: InsertOtPreopAssessment): Promise<OtPreopAssessment> {
    const processedData = this.convertTimestampFields(data, ['assessmentAt']);
    const result = await db.insert(otPreopAssessment).values(processedData).returning();
    return result[0];
  }

  async updateOtPreopAssessment(id: string, data: Partial<InsertOtPreopAssessment>): Promise<OtPreopAssessment | undefined> {
    const processedData = this.convertTimestampFields(data, ['assessmentAt']);
    const result = await db.update(otPreopAssessment).set(processedData).where(eq(otPreopAssessment.id, id)).returning();
    return result[0];
  }

  // Re-Evaluation
  async getOtReEvaluation(caseId: string): Promise<OtReEvaluation[]> {
    return await db.select().from(otReEvaluation).where(eq(otReEvaluation.caseId, caseId)).orderBy(desc(otReEvaluation.createdAt));
  }

  async createOtReEvaluation(data: InsertOtReEvaluation): Promise<OtReEvaluation> {
    const processedData = this.convertTimestampFields(data, ['reevalAt']);
    const result = await db.insert(otReEvaluation).values(processedData).returning();
    return result[0];
  }

  // Consent Surgery
  async getOtConsentSurgery(caseId: string): Promise<OtConsentSurgery | undefined> {
    const result = await db.select().from(otConsentSurgery).where(eq(otConsentSurgery.caseId, caseId));
    return result[0];
  }

  async createOtConsentSurgery(data: InsertOtConsentSurgery): Promise<OtConsentSurgery> {
    const processedData = this.convertTimestampFields(data, ['patientSignedAt', 'doctorSignedAt']);
    const result = await db.insert(otConsentSurgery).values(processedData).returning();
    return result[0];
  }

  async updateOtConsentSurgery(id: string, data: Partial<InsertOtConsentSurgery>): Promise<OtConsentSurgery | undefined> {
    const processedData = this.convertTimestampFields(data, ['patientSignedAt', 'doctorSignedAt']);
    const result = await db.update(otConsentSurgery).set(processedData).where(eq(otConsentSurgery.id, id)).returning();
    return result[0];
  }

  // Consent Anaesthesia
  async getOtConsentAnaesthesia(caseId: string): Promise<OtConsentAnaesthesia | undefined> {
    const result = await db.select().from(otConsentAnaesthesia).where(eq(otConsentAnaesthesia.caseId, caseId));
    return result[0];
  }

  async createOtConsentAnaesthesia(data: InsertOtConsentAnaesthesia): Promise<OtConsentAnaesthesia> {
    const processedData = this.convertTimestampFields(data, ['patientSignedAt', 'anaesthetistSignedAt']);
    const result = await db.insert(otConsentAnaesthesia).values(processedData).returning();
    return result[0];
  }

  async updateOtConsentAnaesthesia(id: string, data: Partial<InsertOtConsentAnaesthesia>): Promise<OtConsentAnaesthesia | undefined> {
    const processedData = this.convertTimestampFields(data, ['patientSignedAt', 'anaesthetistSignedAt']);
    const result = await db.update(otConsentAnaesthesia).set(processedData).where(eq(otConsentAnaesthesia.id, id)).returning();
    return result[0];
  }

  // Anaesthesia Record
  async getOtAnaesthesiaRecord(caseId: string): Promise<OtAnaesthesiaRecord | undefined> {
    const result = await db.select().from(otAnaesthesiaRecord).where(eq(otAnaesthesiaRecord.caseId, caseId));
    return result[0];
  }

  async createOtAnaesthesiaRecord(data: InsertOtAnaesthesiaRecord): Promise<OtAnaesthesiaRecord> {
    const processedData = this.convertTimestampFields(data, ['inductionTime', 'intubationTime', 'extubationTime', 'anaesthesiaEndTime']);
    const result = await db.insert(otAnaesthesiaRecord).values(processedData).returning();
    return result[0];
  }

  async updateOtAnaesthesiaRecord(id: string, data: Partial<InsertOtAnaesthesiaRecord>): Promise<OtAnaesthesiaRecord | undefined> {
    const processedData = this.convertTimestampFields(data, ['inductionTime', 'intubationTime', 'extubationTime', 'anaesthesiaEndTime']);
    const result = await db.update(otAnaesthesiaRecord).set(processedData).where(eq(otAnaesthesiaRecord.id, id)).returning();
    return result[0];
  }

  // Time Log
  async getOtTimeLog(caseId: string): Promise<OtTimeLog[]> {
    return await db.select().from(otTimeLog).where(eq(otTimeLog.caseId, caseId)).orderBy(otTimeLog.eventTime);
  }

  async createOtTimeLogEntry(data: InsertOtTimeLog): Promise<OtTimeLog> {
    const processedData = this.convertTimestampFields(data, ['eventTime']);
    const result = await db.insert(otTimeLog).values(processedData).returning();
    return result[0];
  }

  // Surgeon Notes
  async getOtSurgeonNotes(caseId: string): Promise<OtSurgeonNotes | undefined> {
    const result = await db.select().from(otSurgeonNotes).where(eq(otSurgeonNotes.caseId, caseId));
    return result[0];
  }

  async createOtSurgeonNotes(data: InsertOtSurgeonNotes): Promise<OtSurgeonNotes> {
    const processedData = this.convertTimestampFields(data, ['dictatedAt']);
    const result = await db.insert(otSurgeonNotes).values(processedData).returning();
    return result[0];
  }

  async updateOtSurgeonNotes(id: string, data: Partial<InsertOtSurgeonNotes>): Promise<OtSurgeonNotes | undefined> {
    const processedData = this.convertTimestampFields(data, ['dictatedAt']);
    const result = await db.update(otSurgeonNotes).set(processedData).where(eq(otSurgeonNotes.id, id)).returning();
    return result[0];
  }

  // Post-Op Assessment
  async getOtPostopAssessment(caseId: string): Promise<OtPostopAssessment[]> {
    return await db.select().from(otPostopAssessment).where(eq(otPostopAssessment.caseId, caseId)).orderBy(desc(otPostopAssessment.createdAt));
  }

  async createOtPostopAssessment(data: InsertOtPostopAssessment): Promise<OtPostopAssessment> {
    const result = await db.insert(otPostopAssessment).values(data).returning();
    return result[0];
  }

  // Monitoring Chart
  async getOtMonitoringChart(caseId: string): Promise<OtMonitoringChart[]> {
    return await db.select().from(otMonitoringChart).where(eq(otMonitoringChart.caseId, caseId)).orderBy(otMonitoringChart.recordTime);
  }

  async createOtMonitoringChartEntry(data: InsertOtMonitoringChart): Promise<OtMonitoringChart> {
    const processedData = this.convertTimestampFields(data, ['recordTime']);
    // Auto-generate recordTime if not provided
    if (!processedData.recordTime) {
      processedData.recordTime = new Date();
    }
    const result = await db.insert(otMonitoringChart).values(processedData).returning();
    return result[0];
  }

  // Labour Chart
  async getOtLabourChart(caseId: string): Promise<OtLabourChart[]> {
    return await db.select().from(otLabourChart).where(eq(otLabourChart.caseId, caseId)).orderBy(otLabourChart.recordTime);
  }

  async createOtLabourChartEntry(data: InsertOtLabourChart): Promise<OtLabourChart> {
    const processedData = this.convertTimestampFields(data, ['recordTime', 'ruptureTime']);
    const result = await db.insert(otLabourChart).values(processedData).returning();
    return result[0];
  }

  // Neonate Sheet
  async getOtNeonateSheet(caseId: string): Promise<OtNeonateSheet | undefined> {
    const result = await db.select().from(otNeonateSheet).where(eq(otNeonateSheet.caseId, caseId));
    return result[0];
  }

  async createOtNeonateSheet(data: InsertOtNeonateSheet): Promise<OtNeonateSheet> {
    const result = await db.insert(otNeonateSheet).values(data).returning();
    return result[0];
  }

  async updateOtNeonateSheet(id: string, data: Partial<InsertOtNeonateSheet>): Promise<OtNeonateSheet | undefined> {
    const result = await db.update(otNeonateSheet).set(data).where(eq(otNeonateSheet.id, id)).returning();
    return result[0];
  }

  // OT Audit Log
  async createOtAuditLog(data: InsertOtAuditLog): Promise<OtAuditLog> {
    const result = await db.insert(otAuditLog).values(data).returning();
    return result[0];
  }

  async getOtAuditLogs(caseId: string): Promise<OtAuditLog[]> {
    return await db.select().from(otAuditLog).where(eq(otAuditLog.caseId, caseId)).orderBy(desc(otAuditLog.timestamp));
  }

  // OT data should be added manually through the admin portal
  // No demo data is seeded
  async seedOtDemoData(): Promise<void> {
    console.log("OT data seeding skipped - real data should be added through admin portal");
  }
}

export const databaseStorage = new DatabaseStorage();
