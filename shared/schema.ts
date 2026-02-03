import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal, pgEnum, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Role Enum - SUPER_ADMIN is the highest authority
export const userRoleEnum = pgEnum("user_role", ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "PATIENT", "MEDICAL_STORE", "PATHOLOGY_LAB", "TECHNICIAN"]);

// Inventory Enums
export const inventoryCategoryEnum = pgEnum("inventory_category", ["disposables", "syringes", "gloves", "medicines", "equipment"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["ISSUE", "RETURN", "DISPOSE"]);
export const staffRoleEnum = pgEnum("staff_role", ["doctor", "nurse", "technician", "pharmacist", "administrator"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  plainPassword: text("plain_password"),
  role: text("role").notNull().default("PATIENT"),
  name: text("name"),
  email: text("email"),
  dateOfBirth: text("date_of_birth"),
  status: text("status").notNull().default("active"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by"),
});

const validRoles = ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "PATIENT", "MEDICAL_STORE", "PATHOLOGY_LAB", "TECHNICIAN"] as const;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  name: true,
  email: true,
  dateOfBirth: true,
}).extend({
  role: z.enum(validRoles).default("PATIENT"),
});

export type UserRole = typeof validRoles[number];

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const doctors = pgTable("doctors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  qualification: text("qualification").notNull(),
  experience: integer("experience").notNull(),
  rating: text("rating").notNull().default("4.5"),
  availableDays: text("available_days").notNull(),
  avatarInitials: text("avatar_initials").notNull(),
  dateOfBirth: text("date_of_birth"),
});

export const insertDoctorSchema = createInsertSchema(doctors).omit({ id: true });
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Doctor = typeof doctors.$inferSelect;

// Doctor Profiles table - extended profile information for doctors
export const doctorProfiles = pgTable("doctor_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  doctorId: varchar("doctor_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  specialty: text("specialty").notNull(),
  email: text("email"),
  phone: text("phone"),
  qualifications: text("qualifications"),
  experience: text("experience"),
  designation: text("designation").default("Consultant"),
  department: text("department"),
  photoUrl: text("photo_url"),
  bio: text("bio"),
  languages: text("languages"),
  consultationFee: text("consultation_fee"),
  hospitalName: text("hospital_name"),
  hospitalAddress: text("hospital_address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDoctorProfileSchema = createInsertSchema(doctorProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDoctorProfile = z.infer<typeof insertDoctorProfileSchema>;
export type DoctorProfile = typeof doctorProfiles.$inferSelect;

// Patient Profiles table - extended profile information for patients
export const patientProfiles = pgTable("patient_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  dateOfBirth: text("date_of_birth"),
  bloodType: text("blood_type"),
  gender: text("gender"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactRelation: text("emergency_contact_relation"),
  emergencyContactPhone: text("emergency_contact_phone"),
  allergies: text("allergies"),
  chronicConditions: text("chronic_conditions"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPatientProfileSchema = createInsertSchema(patientProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPatientProfile = z.infer<typeof insertPatientProfileSchema>;
export type PatientProfile = typeof patientProfiles.$inferSelect;

export const schedules = pgTable("schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  doctorId: varchar("doctor_id").notNull(),
  date: text("date").notNull(),
  timeSlot: text("time_slot").notNull(),
  isBooked: boolean("is_booked").notNull().default(false),
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({ id: true });
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedules.$inferSelect;

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  appointmentId: text("appointment_id").notNull().unique(),
  patientId: varchar("patient_id"), // Patient's username/login identifier for notifications
  patientName: text("patient_name").notNull(),
  patientPhone: text("patient_phone").notNull(),
  patientEmail: text("patient_email"),
  doctorId: varchar("doctor_id").notNull(),
  appointmentDate: text("appointment_date").notNull(),
  timeSlot: text("time_slot").notNull(),
  department: text("department"),
  location: text("location"),
  symptoms: text("symptoms"),
  status: text("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, appointmentId: true, createdAt: true });
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// ========== INVENTORY SERVICE TABLES ==========

// Inventory Items table
export const inventoryItems = pgTable("inventory_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  currentStock: integer("current_stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(10),
  unit: text("unit").notNull().default("units"),
  cost: text("cost").notNull(),
  supplier: text("supplier"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;

// Staff Members table
export const staffMembers = pgTable("staff_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  role: text("role").notNull(),
  email: text("email"),
  phone: text("phone"),
  department: text("department"),
  dateOfBirth: text("date_of_birth"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStaffMemberSchema = createInsertSchema(staffMembers).omit({
  id: true,
  createdAt: true,
});
export type InsertStaffMember = z.infer<typeof insertStaffMemberSchema>;
export type StaffMember = typeof staffMembers.$inferSelect;

// Inventory Patients table (separate from appointments patients)
export const inventoryPatients = pgTable("inventory_patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: text("patient_id").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInventoryPatientSchema = createInsertSchema(inventoryPatients).omit({
  id: true,
  createdAt: true,
});
export type InsertInventoryPatient = z.infer<typeof insertInventoryPatientSchema>;
export type InventoryPatient = typeof inventoryPatients.$inferSelect;

// Inventory Transactions table
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  itemId: varchar("item_id").notNull(),
  quantity: integer("quantity").notNull(),
  staffId: varchar("staff_id"),
  patientId: varchar("patient_id"),
  notes: text("notes"),
  remainingStock: integer("remaining_stock").notNull(),
  totalCost: text("total_cost"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInventoryTransactionSchema = createInsertSchema(inventoryTransactions).omit({
  id: true,
  createdAt: true,
  remainingStock: true,
  totalCost: true,
});
export type InsertInventoryTransaction = z.infer<typeof insertInventoryTransactionSchema>;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;

// ========== PATIENT TRACKING SERVICE TABLES ==========

// Tracking Patients table
export const trackingPatients = pgTable("tracking_patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  department: text("department").notNull(),
  room: text("room").notNull(),
  diagnosis: text("diagnosis").notNull(),
  admissionDate: timestamp("admission_date").notNull().defaultNow(),
  dischargeDate: timestamp("discharge_date"),
  status: text("status").notNull().default("admitted"),
  doctor: text("doctor").notNull(),
  nurse: text("nurse"),
  notes: text("notes"),
  isInIcu: boolean("is_in_icu").notNull().default(false),
  icuTransferDate: timestamp("icu_transfer_date"),
  icuDays: integer("icu_days").default(0),
  ventilatorDays: integer("ventilator_days").default(0),
  bloodGroup: text("blood_group"),
  attendingDoctor: text("attending_doctor"),
  assignedNurse: text("assigned_nurse"),
});

export const insertTrackingPatientSchema = createInsertSchema(trackingPatients).omit({
  id: true,
  admissionDate: true,
  status: true,
});
export type InsertTrackingPatient = z.infer<typeof insertTrackingPatientSchema>;
export type TrackingPatient = typeof trackingPatients.$inferSelect;

// Patient Movement Log - tracks all patient movements with timestamps
export const patientMovementLog = pgTable("patient_movement_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackingPatientId: varchar("tracking_patient_id").notNull(),
  eventType: text("event_type").notNull(), // admission, ward_transfer, icu_transfer, icu_discharge, discharge, manual_note
  fromLocation: text("from_location"),
  toLocation: text("to_location"),
  bedId: varchar("bed_id"),
  performedBy: text("performed_by"),
  notes: text("notes"),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPatientMovementLogSchema = createInsertSchema(patientMovementLog).omit({
  id: true,
  createdAt: true,
});
export type InsertPatientMovementLog = z.infer<typeof insertPatientMovementLogSchema>;
export type PatientMovementLog = typeof patientMovementLog.$inferSelect;

// Medications table
export const medications = pgTable("medications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  route: text("route").notNull(),
  frequency: text("frequency").notNull(),
  administeredAt: timestamp("administered_at").notNull().defaultNow(),
  administeredBy: text("administered_by").notNull(),
  notes: text("notes"),
});

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
  administeredAt: true,
});
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type Medication = typeof medications.$inferSelect;

// Meals table
export const meals = pgTable("meals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(),
  mealType: text("meal_type").notNull(),
  description: text("description").notNull(),
  calories: integer("calories"),
  dietaryRestrictions: text("dietary_restrictions"),
  consumptionPercentage: integer("consumption_percentage").notNull().default(100),
  servedAt: timestamp("served_at").notNull().defaultNow(),
  servedBy: text("served_by").notNull(),
  notes: text("notes"),
});

export const insertMealSchema = createInsertSchema(meals).omit({
  id: true,
  servedAt: true,
});
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type Meal = typeof meals.$inferSelect;

// Vitals table
export const vitals = pgTable("vitals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(),
  temperature: text("temperature"),
  heartRate: integer("heart_rate"),
  bloodPressureSystolic: integer("blood_pressure_systolic"),
  bloodPressureDiastolic: integer("blood_pressure_diastolic"),
  respiratoryRate: integer("respiratory_rate"),
  oxygenSaturation: integer("oxygen_saturation"),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
  recordedBy: text("recorded_by").notNull(),
  notes: text("notes"),
});

export const insertVitalsSchema = createInsertSchema(vitals).omit({
  id: true,
  recordedAt: true,
});
export type InsertVitals = z.infer<typeof insertVitalsSchema>;
export type Vitals = typeof vitals.$inferSelect;

// Doctor Visits table
export const doctorVisits = pgTable("doctor_visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(),
  visitDate: text("visit_date").notNull(),
  visitTime: text("visit_time").notNull(),
  doctorName: text("doctor_name"),
  notes: text("notes"),
  status: text("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
});

export const insertDoctorVisitSchema = createInsertSchema(doctorVisits).omit({
  id: true,
  createdAt: true,
});
export type InsertDoctorVisit = z.infer<typeof insertDoctorVisitSchema>;
export type DoctorVisit = typeof doctorVisits.$inferSelect;

// ========== CHATBOT SERVICE TABLES ==========

// Conversation Logs table
export const conversationLogs = pgTable("conversation_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"),
  query: text("query").notNull(),
  response: text("response").notNull(),
  category: text("category"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertConversationLogSchema = createInsertSchema(conversationLogs).omit({
  id: true,
  timestamp: true,
});
export type InsertConversationLog = z.infer<typeof insertConversationLogSchema>;
export type ConversationLog = typeof conversationLogs.$inferSelect;

// ========== PATIENT SERVICE TABLES ==========

// Service Patients table (for patient demographics)
export const servicePatients = pgTable("service_patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  gender: text("gender").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  insuranceProvider: text("insurance_provider"),
  insuranceNumber: text("insurance_number"),
  assignedNurseId: varchar("assigned_nurse_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertServicePatientSchema = createInsertSchema(servicePatients).omit({
  id: true,
  createdAt: true,
  assignedNurseId: true, // Assigned by admin, not during patient creation
});
export type InsertServicePatient = z.infer<typeof insertServicePatientSchema>;
export type ServicePatient = typeof servicePatients.$inferSelect;

// Admissions table
export const admissions = pgTable("admissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(),
  admissionDate: timestamp("admission_date").defaultNow(),
  dischargeDate: timestamp("discharge_date"),
  department: text("department").notNull(),
  roomNumber: text("room_number"),
  admittingPhysician: text("admitting_physician").notNull(),
  primaryDiagnosis: text("primary_diagnosis"),
  status: text("status").notNull().default("admitted"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdmissionSchema = createInsertSchema(admissions).omit({
  id: true,
  admissionDate: true,
  createdAt: true,
});
export type InsertAdmission = z.infer<typeof insertAdmissionSchema>;
export type Admission = typeof admissions.$inferSelect;

// Medical Records table
export const medicalRecords = pgTable("medical_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(),
  doctorId: varchar("doctor_id"),
  recordDate: timestamp("record_date").defaultNow(),
  recordType: text("record_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  physician: text("physician").notNull(),
  fileName: text("file_name"),
  fileData: text("file_data"),
  fileType: text("file_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMedicalRecordSchema = createInsertSchema(medicalRecords).omit({
  id: true,
  recordDate: true,
  createdAt: true,
});
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;
export type MedicalRecord = typeof medicalRecords.$inferSelect;

// Patient Consent Forms table
export const patientConsents = pgTable("patient_consents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(),
  consentType: text("consent_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  fileName: text("file_name").notNull(),
  fileData: text("file_data").notNull(),
  fileType: text("file_type").notNull(),
  uploadedBy: text("uploaded_by"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  status: text("status").notNull().default("active"),
});

export const insertPatientConsentSchema = createInsertSchema(patientConsents).omit({
  id: true,
  uploadedAt: true,
});
export type InsertPatientConsent = z.infer<typeof insertPatientConsentSchema>;
export type PatientConsent = typeof patientConsents.$inferSelect;

// ========== BIOMETRIC SERVICE TABLES ==========

// Biometric Templates table - stores encrypted biometric data
export const biometricTemplates = pgTable("biometric_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(),
  biometricType: text("biometric_type").notNull(), // 'fingerprint' or 'face'
  templateData: text("template_data").notNull(), // AES-256 encrypted template
  encryptionIv: text("encryption_iv").notNull(), // Initialization vector for AES
  quality: integer("quality").notNull().default(0), // Template quality score 0-100
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBiometricTemplateSchema = createInsertSchema(biometricTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBiometricTemplate = z.infer<typeof insertBiometricTemplateSchema>;
export type BiometricTemplate = typeof biometricTemplates.$inferSelect;

// Biometric Verifications table - logs all verification attempts
export const biometricVerifications = pgTable("biometric_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(),
  templateId: varchar("template_id"),
  biometricType: text("biometric_type").notNull(),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }).notNull(),
  isMatch: boolean("is_match").notNull(),
  verifiedAt: timestamp("verified_at").defaultNow(),
  ipAddress: text("ip_address"),
  deviceInfo: text("device_info"),
});

export const insertBiometricVerificationSchema = createInsertSchema(biometricVerifications).omit({
  id: true,
  verifiedAt: true,
});
export type InsertBiometricVerification = z.infer<typeof insertBiometricVerificationSchema>;
export type BiometricVerification = typeof biometricVerifications.$inferSelect;

// ========== NOTIFICATION SERVICE TABLES ==========

// Notifications table - stores all hospital notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  category: text("category").notNull(), // 'health_tips', 'hospital_updates', 'emergency', 'opd_announcements', 'disease_alerts', 'general'
  priority: text("priority").notNull().default("medium"), // 'low', 'medium', 'high', 'critical'
  channels: text("channels").array().notNull(), // ['push', 'email', 'sms', 'whatsapp']
  scheduledAt: timestamp("scheduled_at"),
  mediaFiles: text("media_files"), // JSON string of media file objects
  attachedLink: text("attached_link"),
  status: text("status").notNull().default("draft"), // 'draft', 'scheduled', 'sent', 'failed'
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  sentAt: timestamp("sent_at"),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Hospital Team Members table - for notification team directory
export const hospitalTeamMembers = pgTable("hospital_team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  title: text("title").notNull(),
  department: text("department").notNull(), // 'emergency_medicine', 'cardiology', 'neurology', etc.
  specialization: text("specialization"),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  photoUrl: text("photo_url"),
  isOnCall: boolean("is_on_call").notNull().default(false),
  status: text("status").notNull().default("available"), // 'available', 'busy', 'offline'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertHospitalTeamMemberSchema = createInsertSchema(hospitalTeamMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertHospitalTeamMember = z.infer<typeof insertHospitalTeamMemberSchema>;
export type HospitalTeamMember = typeof hospitalTeamMembers.$inferSelect;

// ========== ACTIVITY LOGS TABLE ==========

export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(), // 'patient', 'appointment', 'inventory', 'user', 'medical_record', etc.
  entityId: text("entity_id"),
  performedBy: text("performed_by").notNull(),
  performedByRole: text("performed_by_role"),
  details: text("details"),
  activityType: text("activity_type").notNull().default("info"), // 'info', 'success', 'urgent', 'warning'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

// ========== EQUIPMENT SERVICING TABLES ==========

// Equipment table - stores all hospital equipment
export const equipment = pgTable("equipment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  model: text("model").notNull(),
  serialNumber: text("serial_number").notNull().unique(),
  lastServiceDate: text("last_service_date"),
  nextDueDate: text("next_due_date").notNull(),
  status: text("status").notNull().default("up-to-date"), // 'up-to-date', 'due-soon', 'overdue'
  location: text("location").notNull(),
  serviceFrequency: text("service_frequency").notNull().default("quarterly"), // 'monthly', 'quarterly', 'yearly'
  companyName: text("company_name"),
  contactNumber: text("contact_number"),
  emergencyNumber: text("emergency_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEquipmentSchema = createInsertSchema(equipment).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type Equipment = typeof equipment.$inferSelect;

// Service History table - tracks all service records for equipment
export const serviceHistory = pgTable("service_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  equipmentId: varchar("equipment_id").notNull(),
  serviceDate: text("service_date").notNull(),
  technician: text("technician").notNull(),
  description: text("description").notNull(),
  cost: text("cost").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertServiceHistorySchema = createInsertSchema(serviceHistory).omit({
  id: true,
  createdAt: true,
});
export type InsertServiceHistory = z.infer<typeof insertServiceHistorySchema>;
export type ServiceHistory = typeof serviceHistory.$inferSelect;

// Emergency Contacts table - hospital emergency service contacts
export const emergencyContacts = pgTable("emergency_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  serviceType: text("service_type").notNull(), // 'Medical Help', 'Fire Service', 'Police', 'Plumber', 'Electrician', 'Lift Service', 'IT Support'
  phoneNumber: text("phone_number").notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmergencyContactSchema = createInsertSchema(emergencyContacts).omit({
  id: true,
  createdAt: true,
});
export type InsertEmergencyContact = z.infer<typeof insertEmergencyContactSchema>;
export type EmergencyContact = typeof emergencyContacts.$inferSelect;

// ========== HOSPITAL SETTINGS TABLE ==========

export const hospitalSettings = pgTable("hospital_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Basic Information
  name: text("name").notNull().default("Gravity Hospital"),
  address: text("address").notNull().default("Gat No, 167, Sahyog Nager, Triveni Nagar, Nigdi, Pimpri-Chinchwad, Maharashtra 411062"),
  phone: text("phone").notNull().default("+91 20 2745 8900"),
  email: text("email").notNull().default("info@gravityhospital.in"),
  website: text("website").default("www.gravityhospital.in"),
  establishedYear: text("established_year").default("2015"),
  licenseNumber: text("license_number").default("MH-PUNE-2015-001234"),
  registrationNumber: text("registration_number").default("REG-MH-15-001234"),
  // Operational Settings
  emergencyHours: text("emergency_hours").default("24/7"),
  opdHours: text("opd_hours").default("08:00 - 20:00"),
  visitingHours: text("visiting_hours").default("10:00 - 12:00, 16:00 - 18:00"),
  maxPatientsPerDay: text("max_patients_per_day").default("200"),
  appointmentSlotDuration: text("appointment_slot_duration").default("30"),
  emergencyWaitTime: text("emergency_wait_time").default("15"),
  // Facility Info
  totalBeds: text("total_beds").default("150"),
  icuBeds: text("icu_beds").default("20"),
  emergencyBeds: text("emergency_beds").default("15"),
  operationTheaters: text("operation_theaters").default("8"),
  departments: text("departments").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertHospitalSettingsSchema = createInsertSchema(hospitalSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertHospitalSettings = z.infer<typeof insertHospitalSettingsSchema>;
export type HospitalSettings = typeof hospitalSettings.$inferSelect;

// ========== DOCTOR PORTAL TABLES ==========

// Prescriptions table - doctor-created prescriptions for patients
export const prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prescriptionNumber: text("prescription_number"), // Human-readable ID like PR-2025-001
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  patientAge: text("patient_age"),
  patientGender: text("patient_gender"),
  visitId: varchar("visit_id"), // Link to OPD visit
  doctorId: varchar("doctor_id").notNull(),
  doctorName: text("doctor_name").notNull(),
  doctorRegistrationNo: text("doctor_registration_no"),
  chiefComplaints: text("chief_complaints"),
  diagnosis: text("diagnosis").notNull(),
  provisionalDiagnosis: text("provisional_diagnosis"),
  vitals: text("vitals"), // JSON: {bp, sugar, pulse, weight, temp}
  patientComplaints: text("patient_complaints"), // Patient's complaints in their own words
  doctorObservations: text("doctor_observations"), // Doctor's clinical observations
  pastHistoryReference: text("past_history_reference"), // Reference to past medical history
  knownAllergies: text("known_allergies"),
  pastMedicalHistory: text("past_medical_history"),
  medicines: text("medicines").array().notNull(), // Array of medicine strings like "Amlodipine 5mg - Once daily"
  medicineDetails: text("medicine_details"), // JSON array with detailed medicine info
  instructions: text("instructions"),
  dietAdvice: text("diet_advice"),
  activityAdvice: text("activity_advice"),
  investigations: text("investigations"),
  suggestedTest: text("suggested_test"),
  patientRecordId: varchar("patient_record_id"), // Link to medical record uploaded by admin
  prescriptionDate: text("prescription_date").notNull(),
  followUpDate: text("follow_up_date"),
  prescriptionStatus: text("prescription_status").notNull().default("draft"), // 'draft', 'awaiting_signature', 'finalized', 'void'
  status: text("status").notNull().default("active"), // 'active', 'completed', 'cancelled'
  createdByRole: text("created_by_role"), // 'ADMIN', 'DOCTOR', 'OPD_MANAGER'
  createdByName: text("created_by_name"),
  signedBy: varchar("signed_by"),
  signedByName: text("signed_by_name"),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Prescription = typeof prescriptions.$inferSelect;

// Doctor Schedules table - date-specific availability slots for doctors
export const doctorSchedules = pgTable("doctor_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  doctorId: varchar("doctor_id").notNull(),
  day: text("day").notNull(), // 'Monday', 'Tuesday', etc. (kept for display)
  specificDate: text("specific_date"), // YYYY-MM-DD format for date-specific slots
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  slotType: text("slot_type").notNull().default("OPD"), // 'OPD', 'Surgery', 'Consultation'
  location: text("location"), // Pune location for the slot
  maxPatients: integer("max_patients").notNull().default(20),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDoctorScheduleSchema = createInsertSchema(doctorSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDoctorSchedule = z.infer<typeof insertDoctorScheduleSchema>;
export type DoctorSchedule = typeof doctorSchedules.$inferSelect;

// Doctor Time Slots table - individual 30-minute slots generated from schedules
// This is the single source of truth for appointment slot availability
export const doctorTimeSlots = pgTable("doctor_time_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scheduleId: varchar("schedule_id").notNull(), // Reference to doctor_schedules
  doctorId: varchar("doctor_id").notNull(),
  doctorName: text("doctor_name").notNull(),
  slotDate: text("slot_date").notNull(), // YYYY-MM-DD format
  startTime: text("start_time").notNull(), // HH:MM AM/PM format
  endTime: text("end_time").notNull(), // HH:MM AM/PM format
  slotType: text("slot_type").notNull().default("OPD"), // 'OPD', 'Surgery', 'Consultation'
  location: text("location"),
  status: text("status").notNull().default("available"), // 'available', 'booked', 'cancelled', 'completed'
  appointmentId: varchar("appointment_id"), // Link to appointments table when booked
  patientId: varchar("patient_id"), // For quick lookup of patient's slots
  patientName: text("patient_name"), // Denormalized for display
  bookedAt: timestamp("booked_at"), // When the slot was booked
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDoctorTimeSlotSchema = createInsertSchema(doctorTimeSlots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  bookedAt: true,
});
export type InsertDoctorTimeSlot = z.infer<typeof insertDoctorTimeSlotSchema>;
export type DoctorTimeSlot = typeof doctorTimeSlots.$inferSelect;

// Doctor Patients table - patients assigned to or treated by specific doctors
export const doctorPatients = pgTable("doctor_patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  doctorId: varchar("doctor_id").notNull(),
  patientName: text("patient_name").notNull(),
  patientAge: integer("patient_age"),
  patientGender: text("patient_gender"),
  patientPhone: text("patient_phone").notNull(),
  patientEmail: text("patient_email"),
  patientAddress: text("patient_address"),
  bloodGroup: text("blood_group"),
  allergies: text("allergies"),
  medicalHistory: text("medical_history"),
  lastVisit: text("last_visit"),
  status: text("status").notNull().default("active"), // 'active', 'inactive', 'discharged'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDoctorPatientSchema = createInsertSchema(doctorPatients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDoctorPatient = z.infer<typeof insertDoctorPatientSchema>;
export type DoctorPatient = typeof doctorPatients.$inferSelect;

// ========== USER NOTIFICATIONS TABLE ==========
// User-specific notifications for all roles (Doctor, Patient, Admin, OPD Manager, Nurse)
export const userNotifications = pgTable("user_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  userRole: text("user_role").notNull(), // DOCTOR, PATIENT, ADMIN, OPD_MANAGER, NURSE
  type: text("type").notNull(), // appointment, prescription, schedule, profile, system, report
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedEntityId: varchar("related_entity_id"),
  relatedEntityType: text("related_entity_type"), // appointments, prescriptions, schedules, profiles
  isRead: boolean("is_read").notNull().default(false),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserNotificationSchema = createInsertSchema(userNotifications).omit({
  id: true,
  createdAt: true,
});
export type InsertUserNotification = z.infer<typeof insertUserNotificationSchema>;
export type UserNotification = typeof userNotifications.$inferSelect;

// ========== CONSENT FORMS TABLE ==========
// Storage for hospital consent form PDFs that admin can upload, download, and print
export const consentForms = pgTable("consent_forms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"), // general, surgery, treatment, admission, discharge
  fileName: text("file_name").notNull(),
  fileData: text("file_data").notNull(), // Base64 encoded PDF
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull().default("application/pdf"),
  uploadedBy: varchar("uploaded_by").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConsentFormSchema = createInsertSchema(consentForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertConsentForm = z.infer<typeof insertConsentFormSchema>;
export type ConsentForm = typeof consentForms.$inferSelect;

// ========== MEDICINES DATABASE TABLE ==========
// OPD Medicine database for searchable medicine inventory
export const medicines = pgTable("medicines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandName: text("brand_name").notNull(),
  genericName: text("generic_name").notNull(),
  strength: text("strength").notNull(),
  dosageForm: text("dosage_form").notNull(),
  companyName: text("company_name").notNull(),
  mrp: decimal("mrp", { precision: 10, scale: 2 }).notNull(),
  packSize: text("pack_size").notNull(),
  uses: text("uses").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMedicineSchema = createInsertSchema(medicines).omit({
  id: true,
  createdAt: true,
});
export type InsertMedicine = z.infer<typeof insertMedicineSchema>;
export type Medicine = typeof medicines.$inferSelect;

// ========== OXYGEN TRACKING TABLES ==========
// Cylinder types and status enums
export const cylinderTypeEnum = pgEnum("cylinder_type", ["B-type", "D-type", "Jumbo"]);
export const cylinderStatusEnum = pgEnum("cylinder_status", ["full", "in_use", "empty", "for_refilling", "for_testing"]);

// Oxygen Cylinders Stock Register
export const oxygenCylinders = pgTable("oxygen_cylinders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cylinderCode: text("cylinder_code").notNull().unique(), // QR/Barcode
  cylinderType: text("cylinder_type").notNull(), // B-type, D-type, Jumbo
  capacity: decimal("capacity", { precision: 10, scale: 2 }).notNull(), // in liters
  filledPressure: decimal("filled_pressure", { precision: 10, scale: 2 }), // psi when filled
  currentPressure: decimal("current_pressure", { precision: 10, scale: 2 }), // current psi
  status: text("status").notNull().default("full"), // full, in_use, empty, for_refilling, for_testing
  vendor: text("vendor"),
  purityCertificateDate: text("purity_certificate_date"),
  hydrostaticTestDate: text("hydrostatic_test_date"), // Every 3-5 years
  nextTestDueDate: text("next_test_due_date"),
  location: text("location"), // Ward/Department
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOxygenCylinderSchema = createInsertSchema(oxygenCylinders).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
});
export type InsertOxygenCylinder = z.infer<typeof insertOxygenCylinderSchema>;
export type OxygenCylinder = typeof oxygenCylinders.$inferSelect;

// Cylinder Movement Register (Issue/Return Log)
export const cylinderMovements = pgTable("cylinder_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cylinderId: varchar("cylinder_id").notNull(),
  cylinderCode: text("cylinder_code").notNull(),
  movementType: text("movement_type").notNull(), // ISSUE, RETURN
  department: text("department").notNull(),
  startPressure: decimal("start_pressure", { precision: 10, scale: 2 }),
  endPressure: decimal("end_pressure", { precision: 10, scale: 2 }),
  issuedBy: text("issued_by"),
  receivedBy: text("received_by"),
  acknowledgedBy: text("acknowledged_by"),
  notes: text("notes"),
  movementDate: timestamp("movement_date").defaultNow(),
});

export const insertCylinderMovementSchema = createInsertSchema(cylinderMovements).omit({
  id: true,
  movementDate: true,
});
export type InsertCylinderMovement = z.infer<typeof insertCylinderMovementSchema>;
export type CylinderMovement = typeof cylinderMovements.$inferSelect;

// Patient-wise Oxygen Consumption Register
export const oxygenConsumption = pgTable("oxygen_consumption", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id"),
  patientName: text("patient_name").notNull(),
  department: text("department").notNull(),
  cylinderId: varchar("cylinder_id"),
  cylinderCode: text("cylinder_code"),
  flowRate: decimal("flow_rate", { precision: 10, scale: 2 }).notNull(), // LPM (liters per minute)
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  totalHours: decimal("total_hours", { precision: 10, scale: 2 }),
  totalConsumption: decimal("total_consumption", { precision: 10, scale: 2 }), // LPM × hours
  recordedBy: text("recorded_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOxygenConsumptionSchema = createInsertSchema(oxygenConsumption).omit({
  id: true,
  createdAt: true,
});
export type InsertOxygenConsumption = z.infer<typeof insertOxygenConsumptionSchema>;
export type OxygenConsumption = typeof oxygenConsumption.$inferSelect;

// LMO (Liquid Medical Oxygen) Tank Daily Dip Register
export const lmoReadings = pgTable("lmo_readings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tankId: text("tank_id").notNull().default("MAIN"),
  readingDate: text("reading_date").notNull(),
  readingTime: text("reading_time").notNull(),
  levelPercentage: decimal("level_percentage", { precision: 5, scale: 2 }).notNull(),
  volumeLiters: decimal("volume_liters", { precision: 10, scale: 2 }),
  pressure: decimal("pressure", { precision: 10, scale: 2 }),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  recordedBy: text("recorded_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLmoReadingSchema = createInsertSchema(lmoReadings).omit({
  id: true,
  createdAt: true,
});
export type InsertLmoReading = z.infer<typeof insertLmoReadingSchema>;
export type LmoReading = typeof lmoReadings.$inferSelect;

// Oxygen Alerts
export const oxygenAlerts = pgTable("oxygen_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alertType: text("alert_type").notNull(), // LOW_STOCK, OVERCONSUMPTION, PENDING_RETURN, TEST_DUE, LEAKAGE
  severity: text("severity").notNull().default("warning"), // info, warning, critical
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedCylinderId: varchar("related_cylinder_id"),
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedBy: text("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOxygenAlertSchema = createInsertSchema(oxygenAlerts).omit({
  id: true,
  createdAt: true,
});
export type InsertOxygenAlert = z.infer<typeof insertOxygenAlertSchema>;
export type OxygenAlert = typeof oxygenAlerts.$inferSelect;

// ========== BIOMEDICAL WASTE MANAGEMENT (BMW) TABLES ==========

// BMW Category Enum - Color coded as per CPCB guidelines
export const bmwCategoryEnum = pgEnum("bmw_category", ["YELLOW", "RED", "WHITE", "BLUE"]);

// BMW Bag Status Enum
export const bmwStatusEnum = pgEnum("bmw_status", ["GENERATED", "COLLECTED", "STORED", "PICKED_UP", "DISPOSED"]);

// BMW Movement Action Enum
export const bmwActionEnum = pgEnum("bmw_action", ["CREATED", "COLLECTED", "MOVED_TO_STORAGE", "PICKED_BY_VENDOR", "DISPOSED"]);

// BMW Disposal Method Enum
export const bmwDisposalMethodEnum = pgEnum("bmw_disposal_method", ["AUTOCLAVE", "INCINERATION", "CHEMICAL_TREATMENT", "SHREDDING", "DEEP_BURIAL"]);

// BMW Bags Table - Core tracking entity
export const bmwBags = pgTable("bmw_bags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  barcode: text("barcode").notNull().unique(), // Auto-generated unique barcode
  category: text("category").notNull(), // YELLOW, RED, WHITE, BLUE
  department: text("department").notNull(), // OPD, ICU, OT, Lab, Ward, etc.
  approxWeight: decimal("approx_weight", { precision: 10, scale: 2 }).notNull(), // Initial weight in kg
  finalWeight: decimal("final_weight", { precision: 10, scale: 2 }), // Weight at disposal
  status: text("status").notNull().default("GENERATED"), // GENERATED, COLLECTED, STORED, PICKED_UP, DISPOSED
  generatedBy: text("generated_by").notNull(), // User who created the bag
  generatedByRole: text("generated_by_role").notNull(), // Role of the user
  collectedBy: text("collected_by"), // Housekeeping staff
  storageRoomId: text("storage_room_id"), // Temporary storage location
  storedAt: timestamp("stored_at"), // When moved to storage
  storageDeadline: timestamp("storage_deadline"), // 48-hour limit
  vendorId: text("vendor_id"), // CBWTF vendor
  pickedUpAt: timestamp("picked_up_at"), // When vendor picked up
  disposedAt: timestamp("disposed_at"), // When finally disposed
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBmwBagSchema = createInsertSchema(bmwBags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBmwBag = z.infer<typeof insertBmwBagSchema>;
export type BmwBag = typeof bmwBags.$inferSelect;

// BMW Movements Table - Tracks all bag movements/actions
export const bmwMovements = pgTable("bmw_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bagId: varchar("bag_id").notNull(), // Reference to bmw_bags
  action: text("action").notNull(), // CREATED, COLLECTED, MOVED_TO_STORAGE, PICKED_BY_VENDOR, DISPOSED
  performedBy: text("performed_by").notNull(), // User who performed action
  performedByRole: text("performed_by_role").notNull(), // Role of the user
  location: text("location").notNull(), // Current location after action
  weight: decimal("weight", { precision: 10, scale: 2 }), // Weight at this point
  notes: text("notes"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertBmwMovementSchema = createInsertSchema(bmwMovements).omit({
  id: true,
  timestamp: true,
});
export type InsertBmwMovement = z.infer<typeof insertBmwMovementSchema>;
export type BmwMovement = typeof bmwMovements.$inferSelect;

// BMW Pickups Table - Vendor pickup records
export const bmwPickups = pgTable("bmw_pickups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pickupId: text("pickup_id").notNull().unique(), // Auto-generated pickup ID
  vendorId: text("vendor_id").notNull(), // CBWTF vendor ID
  vendorName: text("vendor_name").notNull(),
  pickupDate: text("pickup_date").notNull(),
  pickupTime: text("pickup_time").notNull(),
  totalBags: integer("total_bags").notNull().default(0),
  totalWeight: decimal("total_weight", { precision: 10, scale: 2 }).notNull(),
  yellowBags: integer("yellow_bags").default(0),
  redBags: integer("red_bags").default(0),
  whiteBags: integer("white_bags").default(0),
  blueBags: integer("blue_bags").default(0),
  yellowWeight: decimal("yellow_weight", { precision: 10, scale: 2 }).default("0"),
  redWeight: decimal("red_weight", { precision: 10, scale: 2 }).default("0"),
  whiteWeight: decimal("white_weight", { precision: 10, scale: 2 }).default("0"),
  blueWeight: decimal("blue_weight", { precision: 10, scale: 2 }).default("0"),
  slipUrl: text("slip_url"), // Uploaded pickup slip
  vehicleNumber: text("vehicle_number"),
  driverName: text("driver_name"),
  receivedBy: text("received_by"), // Hospital staff who handed over
  status: text("status").notNull().default("SCHEDULED"), // SCHEDULED, IN_PROGRESS, COMPLETED
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBmwPickupSchema = createInsertSchema(bmwPickups).omit({
  id: true,
  pickupId: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBmwPickup = z.infer<typeof insertBmwPickupSchema>;
export type BmwPickup = typeof bmwPickups.$inferSelect;

// BMW Disposals Table - Final disposal records
export const bmwDisposals = pgTable("bmw_disposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bagId: varchar("bag_id").notNull(), // Reference to bmw_bags
  pickupId: varchar("pickup_id"), // Reference to bmw_pickups
  method: text("method").notNull(), // AUTOCLAVE, INCINERATION, CHEMICAL_TREATMENT, SHREDDING, DEEP_BURIAL
  disposalDate: text("disposal_date").notNull(),
  disposalTime: text("disposal_time"),
  treatmentFacility: text("treatment_facility"), // CBWTF facility name
  certificateUrl: text("certificate_url"), // Uploaded disposal certificate
  verifiedBy: text("verified_by"), // Who verified the disposal
  status: text("status").notNull().default("PENDING"), // PENDING, TREATED, VERIFIED
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBmwDisposalSchema = createInsertSchema(bmwDisposals).omit({
  id: true,
  createdAt: true,
});
export type InsertBmwDisposal = z.infer<typeof insertBmwDisposalSchema>;
export type BmwDisposal = typeof bmwDisposals.$inferSelect;

// BMW Vendors Table - CBWTF vendor registry
export const bmwVendors = pgTable("bmw_vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: text("vendor_id").notNull().unique(),
  name: text("name").notNull(),
  companyName: text("company_name").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  licenseNumber: text("license_number").notNull(), // CPCB/SPCB license
  licenseExpiry: text("license_expiry"),
  vehicleNumbers: text("vehicle_numbers"), // Comma-separated
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBmwVendorSchema = createInsertSchema(bmwVendors).omit({
  id: true,
  vendorId: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBmwVendor = z.infer<typeof insertBmwVendorSchema>;
export type BmwVendor = typeof bmwVendors.$inferSelect;

// BMW Storage Rooms Table - Temporary storage locations
export const bmwStorageRooms = pgTable("bmw_storage_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  location: text("location").notNull(),
  capacity: integer("capacity").notNull().default(100), // Max number of bags
  currentOccupancy: integer("current_occupancy").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  lastCleanedAt: timestamp("last_cleaned_at"),
  cleanedBy: text("cleaned_by"),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBmwStorageRoomSchema = createInsertSchema(bmwStorageRooms).omit({
  id: true,
  createdAt: true,
});
export type InsertBmwStorageRoom = z.infer<typeof insertBmwStorageRoomSchema>;
export type BmwStorageRoom = typeof bmwStorageRooms.$inferSelect;

// BMW Incidents Table - Needle-stick injuries, spills, etc.
export const bmwIncidents = pgTable("bmw_incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  incidentType: text("incident_type").notNull(), // NEEDLE_STICK, SPILL, EXPOSURE, OTHER
  severity: text("severity").notNull().default("MINOR"), // MINOR, MODERATE, MAJOR
  department: text("department").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  involvedPersonnel: text("involved_personnel"),
  wasteCategory: text("waste_category"), // Related waste category if applicable
  bagId: varchar("bag_id"), // Related bag if applicable
  actionTaken: text("action_taken"),
  reportedBy: text("reported_by").notNull(),
  reportedAt: timestamp("reported_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"),
  status: text("status").notNull().default("REPORTED"), // REPORTED, INVESTIGATING, RESOLVED
  notes: text("notes"),
});

export const insertBmwIncidentSchema = createInsertSchema(bmwIncidents).omit({
  id: true,
  reportedAt: true,
});
export type InsertBmwIncident = z.infer<typeof insertBmwIncidentSchema>;
export type BmwIncident = typeof bmwIncidents.$inferSelect;

// BMW Reports Table - Generated compliance reports
export const bmwReports = pgTable("bmw_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportType: text("report_type").notNull(), // DAILY, WEEKLY, MONTHLY, ANNUAL, MPCB
  reportPeriod: text("report_period").notNull(), // Date range or period identifier
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  totalBagsGenerated: integer("total_bags_generated").default(0),
  totalWeightKg: decimal("total_weight_kg", { precision: 10, scale: 2 }).default("0"),
  yellowBags: integer("yellow_bags").default(0),
  redBags: integer("red_bags").default(0),
  whiteBags: integer("white_bags").default(0),
  blueBags: integer("blue_bags").default(0),
  disposedBags: integer("disposed_bags").default(0),
  pendingBags: integer("pending_bags").default(0),
  incidentsCount: integer("incidents_count").default(0),
  generatedBy: text("generated_by").notNull(),
  reportData: text("report_data"), // JSON string with detailed data
  fileUrl: text("file_url"), // Generated PDF/Excel report
  status: text("status").notNull().default("GENERATED"), // GENERATED, SUBMITTED, APPROVED
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBmwReportSchema = createInsertSchema(bmwReports).omit({
  id: true,
  createdAt: true,
});
export type InsertBmwReport = z.infer<typeof insertBmwReportSchema>;
export type BmwReport = typeof bmwReports.$inferSelect;

// Doctor Oath Confirmations Table - Daily NMC Physician's Pledge acceptance
export const doctorOathConfirmations = pgTable("doctor_oath_confirmations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  doctorId: varchar("doctor_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format for daily tracking
  oathAccepted: boolean("oath_accepted").notNull().default(true),
  acceptedAt: timestamp("accepted_at").defaultNow(),
});

export const insertDoctorOathConfirmationSchema = createInsertSchema(doctorOathConfirmations).omit({
  id: true,
  acceptedAt: true,
});
export type InsertDoctorOathConfirmation = z.infer<typeof insertDoctorOathConfirmationSchema>;
export type DoctorOathConfirmation = typeof doctorOathConfirmations.$inferSelect;

// Consent Type Enum for categorizing consent templates
export const consentTypeEnum = pgEnum("consent_type", [
  "MEDICO_LEGAL",
  "OPERATION_THEATRE",
  "LOW_PROGNOSIS",
  "EMERGENCY_PROCEDURE",
  "PATIENT_SHIFTING",
  "VALUABLES_DECLARATION",
  "TREATMENT_DENIAL",
  "DNR",
  "HIV_TEST",
  "HBSAG_TEST",
  "ANAESTHESIA",
  "SURGERY",
  "TUBAL_LIGATION",
  "BLOOD_TRANSFUSION",
  "DAMA"
]);

// Consent Templates Table - Reusable consent form templates
export const consentTemplates = pgTable("consent_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  consentType: text("consent_type").notNull(),
  description: text("description"),
  category: text("category").notNull().default("General"),
  pdfPath: text("pdf_path").notNull(),
  version: text("version").notNull().default("1.0"),
  isActive: boolean("is_active").notNull().default(true),
  isBilingual: boolean("is_bilingual").notNull().default(false),
  languages: text("languages").default("English"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConsentTemplateSchema = createInsertSchema(consentTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertConsentTemplate = z.infer<typeof insertConsentTemplateSchema>;
export type ConsentTemplate = typeof consentTemplates.$inferSelect;

// Signed Digital Consents Table - Stores digitally signed consent records
export const signedDigitalConsents = pgTable("signed_digital_consents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  patientUhid: text("patient_uhid"),
  patientAge: text("patient_age"),
  patientGender: text("patient_gender"),
  consentType: text("consent_type").notNull(),
  consentTitle: text("consent_title").notNull(),
  language: text("language").notNull().default("English"),
  patientSignature: text("patient_signature"),
  witnessSignature: text("witness_signature"),
  witnessName: text("witness_name"),
  witnessRelation: text("witness_relation"),
  doctorName: text("doctor_name"),
  doctorDesignation: text("doctor_designation"),
  doctorSignature: text("doctor_signature"),
  consentContent: text("consent_content"),
  signedAt: timestamp("signed_at").defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSignedDigitalConsentSchema = createInsertSchema(signedDigitalConsents).omit({
  id: true,
  signedAt: true,
  createdAt: true,
});
export type InsertSignedDigitalConsent = z.infer<typeof insertSignedDigitalConsentSchema>;
export type SignedDigitalConsent = typeof signedDigitalConsents.$inferSelect;

// ========== AI INTELLIGENCE LAYER TABLES ==========

// AI Engine Types
export const aiEngineTypeEnum = pgEnum("ai_engine_type", [
  "DOCTOR_EFFICIENCY",
  "NURSE_EFFICIENCY", 
  "OPD_INTELLIGENCE",
  "HOSPITAL_HEALTH",
  "COMPLIANCE_RISK",
  "PREDICTIVE"
]);

// AI Analytics Snapshots Table - Stores calculated metrics over time
export const aiAnalyticsSnapshots = pgTable("ai_analytics_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  engineType: text("engine_type").notNull(), // DOCTOR_EFFICIENCY, NURSE_EFFICIENCY, OPD_INTELLIGENCE, etc.
  entityId: varchar("entity_id"), // Doctor ID, Nurse ID, Department ID, or null for hospital-wide
  entityType: text("entity_type"), // doctor, nurse, department, hospital
  metricName: text("metric_name").notNull(),
  metricValue: decimal("metric_value", { precision: 10, scale: 2 }).notNull(),
  metricUnit: text("metric_unit"), // percentage, count, minutes, score
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  calculatedAt: timestamp("calculated_at").defaultNow(),
});

export const insertAiAnalyticsSnapshotSchema = createInsertSchema(aiAnalyticsSnapshots).omit({
  id: true,
  calculatedAt: true,
});
export type InsertAiAnalyticsSnapshot = z.infer<typeof insertAiAnalyticsSnapshotSchema>;
export type AiAnalyticsSnapshot = typeof aiAnalyticsSnapshots.$inferSelect;

// AI Metric Catalog Table - Defines available metrics for each engine
export const aiMetricCatalog = pgTable("ai_metric_catalog", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  engineType: text("engine_type").notNull(),
  metricName: text("metric_name").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  metricUnit: text("metric_unit"),
  targetValue: decimal("target_value", { precision: 10, scale: 2 }),
  warningThreshold: decimal("warning_threshold", { precision: 10, scale: 2 }),
  criticalThreshold: decimal("critical_threshold", { precision: 10, scale: 2 }),
  isHigherBetter: boolean("is_higher_better").notNull().default(true),
  weight: decimal("weight", { precision: 5, scale: 2 }).default("1.0"), // For composite scores
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiMetricCatalogSchema = createInsertSchema(aiMetricCatalog).omit({
  id: true,
  createdAt: true,
});
export type InsertAiMetricCatalog = z.infer<typeof insertAiMetricCatalogSchema>;
export type AiMetricCatalog = typeof aiMetricCatalog.$inferSelect;

// AI Anomaly Events Table - Tracks detected anomalies and outliers
export const aiAnomalyEvents = pgTable("ai_anomaly_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  engineType: text("engine_type").notNull(),
  entityId: varchar("entity_id"),
  entityType: text("entity_type"),
  anomalyType: text("anomaly_type").notNull(), // SPIKE, DROP, THRESHOLD_BREACH, PATTERN_BREAK
  severity: text("severity").notNull().default("MEDIUM"), // LOW, MEDIUM, HIGH, CRITICAL
  metricName: text("metric_name").notNull(),
  expectedValue: decimal("expected_value", { precision: 10, scale: 2 }),
  actualValue: decimal("actual_value", { precision: 10, scale: 2 }).notNull(),
  deviation: decimal("deviation", { precision: 10, scale: 2 }),
  description: text("description").notNull(),
  suggestedAction: text("suggested_action"),
  isAcknowledged: boolean("is_acknowledged").notNull().default(false),
  acknowledgedBy: text("acknowledged_by"),
  acknowledgedAt: timestamp("acknowledged_at"),
  detectedAt: timestamp("detected_at").defaultNow(),
});

export const insertAiAnomalyEventSchema = createInsertSchema(aiAnomalyEvents).omit({
  id: true,
  detectedAt: true,
});
export type InsertAiAnomalyEvent = z.infer<typeof insertAiAnomalyEventSchema>;
export type AiAnomalyEvent = typeof aiAnomalyEvents.$inferSelect;

// AI Prediction Results Table - Stores forecasts and predictions
export const aiPredictionResults = pgTable("ai_prediction_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  engineType: text("engine_type").notNull(),
  predictionType: text("prediction_type").notNull(), // ICU_LOAD, OXYGEN_DEMAND, STOCK_SHORTAGE, STAFF_SHORTAGE
  entityId: varchar("entity_id"),
  entityType: text("entity_type"),
  predictionDate: timestamp("prediction_date").notNull(), // The date being predicted
  predictedValue: decimal("predicted_value", { precision: 10, scale: 2 }).notNull(),
  confidenceLevel: decimal("confidence_level", { precision: 5, scale: 2 }), // 0-100%
  lowerBound: decimal("lower_bound", { precision: 10, scale: 2 }),
  upperBound: decimal("upper_bound", { precision: 10, scale: 2 }),
  actualValue: decimal("actual_value", { precision: 10, scale: 2 }), // Filled in later for accuracy tracking
  modelVersion: text("model_version").default("1.0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiPredictionResultSchema = createInsertSchema(aiPredictionResults).omit({
  id: true,
  createdAt: true,
});
export type InsertAiPredictionResult = z.infer<typeof insertAiPredictionResultSchema>;
export type AiPredictionResult = typeof aiPredictionResults.$inferSelect;

// AI Recommendations Table - Prescriptive outputs and suggestions
export const aiRecommendations = pgTable("ai_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  engineType: text("engine_type").notNull(),
  category: text("category").notNull(), // EFFICIENCY, COMPLIANCE, RESOURCE, COST, SAFETY
  priority: text("priority").notNull().default("MEDIUM"), // LOW, MEDIUM, HIGH, CRITICAL
  entityId: varchar("entity_id"),
  entityType: text("entity_type"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  expectedImpact: text("expected_impact"), // e.g., "15% reduction in wait time"
  estimatedSavings: decimal("estimated_savings", { precision: 12, scale: 2 }),
  implementationDifficulty: text("implementation_difficulty").default("MEDIUM"), // LOW, MEDIUM, HIGH
  status: text("status").notNull().default("PENDING"), // PENDING, IN_PROGRESS, IMPLEMENTED, DISMISSED
  implementedBy: text("implemented_by"),
  implementedAt: timestamp("implemented_at"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const insertAiRecommendationSchema = createInsertSchema(aiRecommendations).omit({
  id: true,
  createdAt: true,
});
export type InsertAiRecommendation = z.infer<typeof insertAiRecommendationSchema>;
export type AiRecommendation = typeof aiRecommendations.$inferSelect;

// Hospital Health Index Table - Daily hospital-wide health scores
export const hospitalHealthIndex = pgTable("hospital_health_index", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull().unique(), // YYYY-MM-DD format
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }).notNull(), // 0-100
  doctorEfficiencyScore: decimal("doctor_efficiency_score", { precision: 5, scale: 2 }),
  nurseEfficiencyScore: decimal("nurse_efficiency_score", { precision: 5, scale: 2 }),
  opdScore: decimal("opd_score", { precision: 5, scale: 2 }),
  complianceScore: decimal("compliance_score", { precision: 5, scale: 2 }),
  resourceUtilization: decimal("resource_utilization", { precision: 5, scale: 2 }),
  patientSatisfaction: decimal("patient_satisfaction", { precision: 5, scale: 2 }),
  costEfficiency: decimal("cost_efficiency", { precision: 5, scale: 2 }),
  workflowDelayIndex: decimal("workflow_delay_index", { precision: 5, scale: 2 }),
  trend: text("trend").default("STABLE"), // IMPROVING, STABLE, DECLINING
  insights: text("insights"), // JSON array of key insights
  calculatedAt: timestamp("calculated_at").defaultNow(),
});

export const insertHospitalHealthIndexSchema = createInsertSchema(hospitalHealthIndex).omit({
  id: true,
  calculatedAt: true,
});
export type InsertHospitalHealthIndex = z.infer<typeof insertHospitalHealthIndexSchema>;
export type HospitalHealthIndex = typeof hospitalHealthIndex.$inferSelect;

// Resolved Alerts Table - Track resolved critical alerts across all users
export const resolvedAlerts = pgTable("resolved_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alertType: text("alert_type").notNull(),
  alertSeverity: text("alert_severity").notNull(),
  alertMessage: text("alert_message").notNull(),
  patientId: varchar("patient_id"),
  resolvedBy: varchar("resolved_by"),
  resolvedAt: timestamp("resolved_at").defaultNow(),
});

export const insertResolvedAlertSchema = createInsertSchema(resolvedAlerts).omit({
  id: true,
  resolvedAt: true,
});
export type InsertResolvedAlert = z.infer<typeof insertResolvedAlertSchema>;
export type ResolvedAlert = typeof resolvedAlerts.$inferSelect;

// ========== PATIENT BILLING TABLES ==========

// Bill Status Enum
export const billStatusEnum = pgEnum("bill_status", ["pending", "partial", "paid", "cancelled"]);

// Patient Bills table
export const patientBills = pgTable("patient_bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  admissionId: varchar("admission_id"),
  
  // Charge fields (in paisa/cents for precision)
  roomCharges: decimal("room_charges", { precision: 12, scale: 2 }).notNull().default("0"),
  roomDays: integer("room_days").default(1),
  doctorConsultation: decimal("doctor_consultation", { precision: 12, scale: 2 }).notNull().default("0"),
  labTests: decimal("lab_tests", { precision: 12, scale: 2 }).notNull().default("0"),
  medicines: decimal("medicines", { precision: 12, scale: 2 }).notNull().default("0"),
  inventoryCharges: decimal("inventory_charges", { precision: 12, scale: 2 }).notNull().default("0"),
  otherFees: decimal("other_fees", { precision: 12, scale: 2 }).notNull().default("0"),
  otherFeesDescription: text("other_fees_description"),
  
  // Totals
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  balanceDue: decimal("balance_due", { precision: 12, scale: 2 }).notNull().default("0"),
  
  // Status
  status: text("status").notNull().default("pending"), // pending, partial, paid, cancelled
  billRequestedAt: timestamp("bill_requested_at"),
  lastUpdatedAt: timestamp("last_updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  
  // Audit
  createdBy: varchar("created_by"),
  updatedBy: varchar("updated_by"),
});

export const insertPatientBillSchema = createInsertSchema(patientBills).omit({
  id: true,
  totalAmount: true,
  balanceDue: true,
  lastUpdatedAt: true,
  createdAt: true,
});
export type InsertPatientBill = z.infer<typeof insertPatientBillSchema>;
export type PatientBill = typeof patientBills.$inferSelect;

// Bill Payments table - tracks individual payments
export const billPayments = pgTable("bill_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billId: varchar("bill_id").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, card, upi, insurance
  transactionId: text("transaction_id"),
  notes: text("notes"),
  paidAt: timestamp("paid_at").defaultNow(),
  receivedBy: varchar("received_by"),
});

export const insertBillPaymentSchema = createInsertSchema(billPayments).omit({
  id: true,
  paidAt: true,
});
export type InsertBillPayment = z.infer<typeof insertBillPaymentSchema>;
export type BillPayment = typeof billPayments.$inferSelect;

// ========== AI HEALTH TIPS TABLES ==========

// Health Tips table - stores AI-generated health tips
export const healthTips = pgTable("health_tips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // weather, climate, diet, trending, seasonal
  weatherContext: text("weather_context"), // Current weather conditions used
  season: text("season"), // summer, monsoon, winter, spring
  priority: text("priority").notNull().default("medium"), // low, medium, high
  targetAudience: text("target_audience").notNull().default("all"), // all, patients, elderly, children
  generatedAt: timestamp("generated_at").defaultNow(),
  scheduledFor: text("scheduled_for"), // "9AM" or "9PM"
  isActive: boolean("is_active").notNull().default(true),
});

export const insertHealthTipSchema = createInsertSchema(healthTips).omit({
  id: true,
  generatedAt: true,
});
export type InsertHealthTip = z.infer<typeof insertHealthTipSchema>;
export type HealthTip = typeof healthTips.$inferSelect;

// ========== OT & ICU SWAB CONTAMINATION MONITORING TABLES ==========

// Area Master - Hospital locations (OT / ICU areas)
export const swabAreaMaster = pgTable("swab_area_master", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  block: text("block").notNull(), // Block A, Block B, etc.
  floor: text("floor").notNull(), // Ground Floor, 1st Floor, etc.
  areaType: text("area_type").notNull(), // OT, ICU
  areaName: text("area_name").notNull(), // OT-1, ICU-A, etc.
  equipment: text("equipment"), // Equipment or Bed identifier
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSwabAreaMasterSchema = createInsertSchema(swabAreaMaster).omit({
  id: true,
  createdAt: true,
});
export type InsertSwabAreaMaster = z.infer<typeof insertSwabAreaMasterSchema>;
export type SwabAreaMaster = typeof swabAreaMaster.$inferSelect;

// Sampling Site Master - Where swabs are collected from
export const swabSamplingSiteMaster = pgTable("swab_sampling_site_master", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteName: text("site_name").notNull(), // OT Table, OT Light, Ventilator, etc.
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSwabSamplingSiteMasterSchema = createInsertSchema(swabSamplingSiteMaster).omit({
  id: true,
  createdAt: true,
});
export type InsertSwabSamplingSiteMaster = z.infer<typeof insertSwabSamplingSiteMasterSchema>;
export type SwabSamplingSiteMaster = typeof swabSamplingSiteMaster.$inferSelect;

// Organism Master - Types of organisms that can be detected
export const swabOrganismMaster = pgTable("swab_organism_master", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organismName: text("organism_name").notNull(), // No Growth, E. coli, MRSA, etc.
  category: text("category").notNull(), // pathogen, flora, none
  riskLevel: text("risk_level").notNull().default("low"), // low, medium, high, critical
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSwabOrganismMasterSchema = createInsertSchema(swabOrganismMaster).omit({
  id: true,
  createdAt: true,
});
export type InsertSwabOrganismMaster = z.infer<typeof insertSwabOrganismMasterSchema>;
export type SwabOrganismMaster = typeof swabOrganismMaster.$inferSelect;

// Swab Collection - Main swab collection records
export const swabCollection = pgTable("swab_collection", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  swabId: text("swab_id").notNull().unique(), // Auto-generated unique ID
  collectionDate: timestamp("collection_date").notNull().defaultNow(),
  areaType: text("area_type").notNull(), // OT / ICU
  areaId: varchar("area_id").notNull(), // Reference to area master
  samplingSiteId: varchar("sampling_site_id").notNull(), // Reference to sampling site
  reason: text("reason").notNull(), // Routine, Post-fumigation, Outbreak suspicion
  collectedBy: varchar("collected_by").notNull(), // Staff ID
  collectedByName: text("collected_by_name"), // Staff Name for display
  remarks: text("remarks"),
  status: text("status").notNull().default("pending"), // pending, in_lab, completed, failed
  resultStatus: text("result_status"), // PASS, ACCEPTABLE, FAIL
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSwabCollectionSchema = createInsertSchema(swabCollection).omit({
  id: true,
  swabId: true,
  status: true,
  resultStatus: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSwabCollection = z.infer<typeof insertSwabCollectionSchema>;
export type SwabCollection = typeof swabCollection.$inferSelect;

// Swab Lab Results - Laboratory test results
export const swabLabResults = pgTable("swab_lab_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  swabCollectionId: varchar("swab_collection_id").notNull(), // Reference to swab collection
  cultureMedia: text("culture_media").notNull(), // Blood agar, MacConkey, etc.
  organismId: varchar("organism_id").notNull(), // Reference to organism master
  cfuCount: integer("cfu_count"), // Colony Forming Units
  growthLevel: text("growth_level").notNull(), // None, Low, Moderate, Heavy
  sensitivityTest: boolean("sensitivity_test").default(false),
  sensitivityDetails: text("sensitivity_details"),
  resultDate: timestamp("result_date").notNull().defaultNow(),
  processedBy: varchar("processed_by").notNull(), // Lab staff ID
  processedByName: text("processed_by_name"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSwabLabResultSchema = createInsertSchema(swabLabResults).omit({
  id: true,
  createdAt: true,
});
export type InsertSwabLabResult = z.infer<typeof insertSwabLabResultSchema>;
export type SwabLabResult = typeof swabLabResults.$inferSelect;

// CAPA Actions - Corrective and Preventive Actions for failed swabs
export const swabCapaActions = pgTable("swab_capa_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  swabCollectionId: varchar("swab_collection_id").notNull(), // Reference to failed swab
  issueSummary: text("issue_summary").notNull(), // Auto-generated
  rootCause: text("root_cause"), // Selected root cause
  immediateAction: text("immediate_action").notNull(), // Deep cleaning, Fumigation, Fogging
  responsibleDepartment: text("responsible_department").notNull(),
  responsiblePerson: varchar("responsible_person"),
  responsiblePersonName: text("responsible_person_name"),
  targetClosureDate: timestamp("target_closure_date").notNull(),
  verificationSwabRequired: boolean("verification_swab_required").default(true),
  verificationSwabId: varchar("verification_swab_id"), // Link to verification swab
  status: text("status").notNull().default("open"), // open, in_progress, pending_verification, closed
  closedBy: varchar("closed_by"),
  closedByName: text("closed_by_name"),
  closedAt: timestamp("closed_at"),
  closureRemarks: text("closure_remarks"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSwabCapaActionSchema = createInsertSchema(swabCapaActions).omit({
  id: true,
  status: true,
  closedBy: true,
  closedByName: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSwabCapaAction = z.infer<typeof insertSwabCapaActionSchema>;
export type SwabCapaAction = typeof swabCapaActions.$inferSelect;

// Swab Audit Logs - Track all changes for compliance
export const swabAuditLogs = pgTable("swab_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull(), // swab_collection, lab_result, capa_action
  entityId: varchar("entity_id").notNull(),
  action: text("action").notNull(), // create, update, delete, status_change
  previousValue: text("previous_value"), // JSON of previous state
  newValue: text("new_value"), // JSON of new state
  performedBy: varchar("performed_by").notNull(),
  performedByName: text("performed_by_name"),
  performedByRole: text("performed_by_role"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSwabAuditLogSchema = createInsertSchema(swabAuditLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertSwabAuditLog = z.infer<typeof insertSwabAuditLogSchema>;
export type SwabAuditLog = typeof swabAuditLogs.$inferSelect;

// =====================================================
// DISEASE KNOWLEDGE, DIET & MEDICATION SCHEDULING MODULE
// =====================================================

// Disease Catalog - Master list of diseases with clinical info
export const diseaseCatalog = pgTable("disease_catalog", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  diseaseName: text("disease_name").notNull().unique(),
  alternateNames: text("alternate_names"), // Comma-separated
  category: text("category").notNull(), // metabolic, cardiovascular, respiratory, infectious, neuro, other
  affectedSystem: text("affected_system").notNull(), // Endocrine, Heart, Lungs, etc.
  shortDescription: text("short_description").notNull(), // Layman-friendly
  causes: text("causes").notNull(), // JSON array of causes
  riskFactors: text("risk_factors").notNull(), // JSON array
  symptoms: text("symptoms").notNull(), // JSON array
  emergencySigns: text("emergency_signs"), // JSON array - when to seek emergency care
  clinicalParameters: text("clinical_parameters"), // JSON with target values like BP, blood sugar ranges
  dosList: text("dos_list"), // JSON array of do's
  dontsList: text("donts_list"), // JSON array of don'ts
  activityRecommendations: text("activity_recommendations"), // JSON with exercise, yoga, etc.
  monitoringGuidelines: text("monitoring_guidelines"), // JSON with daily/weekly/monthly checks
  followUpSchedule: text("follow_up_schedule"), // JSON with timing guidance
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDiseaseCatalogSchema = createInsertSchema(diseaseCatalog).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDiseaseCatalog = z.infer<typeof insertDiseaseCatalogSchema>;
export type DiseaseCatalog = typeof diseaseCatalog.$inferSelect;

// Diet Templates - Disease-specific diet plans
export const dietTemplates = pgTable("diet_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  diseaseId: varchar("disease_id").notNull(), // Reference to disease catalog
  templateName: text("template_name").notNull(),
  dietType: text("diet_type").notNull().default("both"), // veg, non-veg, both
  mealPlan: text("meal_plan").notNull(), // JSON with early_morning, breakfast, mid_morning, lunch, evening_snack, dinner, bedtime
  foodsToAvoid: text("foods_to_avoid"), // JSON array
  foodsToLimit: text("foods_to_limit"), // JSON array
  safeInModeration: text("safe_in_moderation"), // JSON array
  portionGuidance: text("portion_guidance"),
  hydrationGuidance: text("hydration_guidance"),
  specialNotes: text("special_notes"), // Regional, seasonal adaptations
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDietTemplateSchema = createInsertSchema(dietTemplates).omit({
  id: true,
  createdAt: true,
});
export type InsertDietTemplate = z.infer<typeof insertDietTemplateSchema>;
export type DietTemplate = typeof dietTemplates.$inferSelect;

// Medication Schedule Templates - Timing guidance (NOT prescriptions)
export const medicationScheduleTemplates = pgTable("medication_schedule_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  diseaseId: varchar("disease_id").notNull(), // Reference to disease catalog
  medicineCategory: text("medicine_category").notNull(), // Antidiabetic, Antihypertensive, etc.
  typicalTiming: text("typical_timing").notNull(), // Morning, Afternoon, Evening, Night
  beforeAfterFood: text("before_after_food").notNull(), // before, after, with, empty_stomach
  missedDoseInstructions: text("missed_dose_instructions"),
  storageGuidelines: text("storage_guidelines"),
  interactionWarnings: text("interaction_warnings"), // JSON array - food/alcohol interactions
  generalNotes: text("general_notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMedicationScheduleTemplateSchema = createInsertSchema(medicationScheduleTemplates).omit({
  id: true,
  createdAt: true,
});
export type InsertMedicationScheduleTemplate = z.infer<typeof insertMedicationScheduleTemplateSchema>;
export type MedicationScheduleTemplate = typeof medicationScheduleTemplates.$inferSelect;

// Patient Disease Assignments - Link patients to diseases with personalized care
export const patientDiseaseAssignments = pgTable("patient_disease_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(), // Reference to patient
  diseaseId: varchar("disease_id").notNull(), // Reference to disease catalog
  severity: text("severity").notNull().default("moderate"), // mild, moderate, severe
  diagnosedDate: timestamp("diagnosed_date").defaultNow(),
  assignedBy: varchar("assigned_by").notNull(), // Doctor ID
  assignedByName: text("assigned_by_name"),
  comorbidities: text("comorbidities"), // JSON array of other disease IDs
  opdIpdStatus: text("opd_ipd_status").notNull().default("OPD"), // OPD, IPD
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPatientDiseaseAssignmentSchema = createInsertSchema(patientDiseaseAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPatientDiseaseAssignment = z.infer<typeof insertPatientDiseaseAssignmentSchema>;
export type PatientDiseaseAssignment = typeof patientDiseaseAssignments.$inferSelect;

// Personalized Care Plans - AI-generated customized plans for patients
export const personalizedCarePlans = pgTable("personalized_care_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(),
  assignmentId: varchar("assignment_id").notNull(), // Reference to patient disease assignment
  personalizedDiet: text("personalized_diet"), // JSON - AI-customized diet plan
  personalizedSchedule: text("personalized_schedule"), // JSON - medication timing
  personalizedLifestyle: text("personalized_lifestyle"), // JSON - activity recommendations
  personalizedMonitoring: text("personalized_monitoring"), // JSON - monitoring schedule
  aiInputParameters: text("ai_input_parameters"), // JSON - age, gender, weight, preferences used
  aiGeneratedAt: timestamp("ai_generated_at").defaultNow(),
  generatedBy: varchar("generated_by"), // Doctor who triggered AI generation
  generatedByName: text("generated_by_name"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPersonalizedCarePlanSchema = createInsertSchema(personalizedCarePlans).omit({
  id: true,
  aiGeneratedAt: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPersonalizedCarePlan = z.infer<typeof insertPersonalizedCarePlanSchema>;
export type PersonalizedCarePlan = typeof personalizedCarePlans.$inferSelect;

// ========== PRESCRIPTION ITEMS TABLE ==========
// Detailed medicine entries for prescriptions
export const prescriptionItems = pgTable("prescription_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prescriptionId: varchar("prescription_id").notNull(),
  medicineName: text("medicine_name").notNull(),
  dosageForm: text("dosage_form").notNull(), // 'Tab', 'Syrup', 'Inj', 'Cap', 'Cream', 'Drop'
  strength: text("strength"), // e.g., '5mg', '250ml'
  frequency: text("frequency").notNull(), // '1', '2', '3', '4' times per day
  mealTiming: text("meal_timing").notNull(), // 'before_food', 'after_food', 'with_food'
  duration: integer("duration").notNull(), // Number of days
  durationUnit: text("duration_unit").notNull().default("days"), // 'days', 'weeks', 'months'
  schedule: text("schedule"), // JSON array: ["Morning", "Night"] - auto-generated from frequency
  specialInstructions: text("special_instructions"),
  quantity: integer("quantity"), // Total quantity to dispense
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPrescriptionItemSchema = createInsertSchema(prescriptionItems).omit({
  id: true,
  createdAt: true,
});
export type InsertPrescriptionItem = z.infer<typeof insertPrescriptionItemSchema>;
export type PrescriptionItem = typeof prescriptionItems.$inferSelect;

// ========== PATIENT MONITORING MODULE ==========
// Medical-Grade, ICU Chart & Nursing Workflow (NABH-Compliant)

// Enums for Patient Monitoring
export const monitoringShiftEnum = pgEnum("monitoring_shift", ["MORNING", "EVENING", "NIGHT"]);
export const monitoringWardEnum = pgEnum("monitoring_ward", ["ICU", "HDU", "GENERAL_WARD", "EMERGENCY"]);
export const entryMethodEnum = pgEnum("entry_method", ["MANUAL", "DEVICE", "AUTO"]);
export const eventTypeEnum = pgEnum("event_type", ["ROUTINE", "EMERGENCY", "CRITICAL"]);
export const marStatusEnum = pgEnum("mar_status", ["GIVEN", "HELD", "MISSED"]);

// Module 1: Patient Monitoring Sessions (24-hour per patient)
export const patientMonitoringSessions = pgTable("patient_monitoring_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  uhid: text("uhid").notNull(),
  age: integer("age").notNull(),
  sex: text("sex").notNull(),
  admissionDateTime: timestamp("admission_datetime").notNull(),
  ward: text("ward").notNull(),
  bedNumber: text("bed_number").notNull(),
  bloodGroup: text("blood_group"),
  weightKg: decimal("weight_kg"),
  primaryDiagnosis: text("primary_diagnosis").notNull(),
  secondaryDiagnosis: text("secondary_diagnosis"), // JSON array
  admittingConsultant: text("admitting_consultant").notNull(),
  icuConsultant: text("icu_consultant"),
  isVentilated: boolean("is_ventilated").default(false),
  isLocked: boolean("is_locked").default(false),
  sessionDate: text("session_date").notNull(), // YYYY-MM-DD for 24-hour period
  sessionStartTime: timestamp("session_start_time").defaultNow(),
  sessionEndTime: timestamp("session_end_time"),
  createdBy: varchar("created_by").notNull(),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPatientMonitoringSessionSchema = createInsertSchema(patientMonitoringSessions).omit({
  id: true,
  isLocked: true,
  sessionStartTime: true,
  sessionEndTime: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPatientMonitoringSession = z.infer<typeof insertPatientMonitoringSessionSchema>;
export type PatientMonitoringSession = typeof patientMonitoringSessions.$inferSelect;

// Module 2: Vital Signs - Hourly Log (24 slots: 08:00 to 07:00 next day)
export const vitalsHourly = pgTable("vitals_hourly", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  hourSlot: text("hour_slot").notNull(), // "08:00", "09:00", etc.
  heartRate: integer("heart_rate"),
  systolicBp: integer("systolic_bp"),
  diastolicBp: integer("diastolic_bp"),
  meanArterialPressure: integer("mean_arterial_pressure"),
  respiratoryRate: integer("respiratory_rate"),
  spo2: integer("spo2"),
  temperature: decimal("temperature"),
  temperatureUnit: text("temperature_unit").default("C"),
  cvp: decimal("cvp"),
  icp: decimal("icp"),
  cpp: decimal("cpp"),
  entryMethod: text("entry_method").default("MANUAL"),
  missedReason: text("missed_reason"),
  nurseId: varchar("nurse_id").notNull(),
  nurseName: text("nurse_name"),
  recordedAt: timestamp("recorded_at").defaultNow(),
  version: integer("version").default(1),
});

export const insertVitalsHourlySchema = createInsertSchema(vitalsHourly).omit({
  id: true,
  recordedAt: true,
  version: true,
});
export type InsertVitalsHourly = z.infer<typeof insertVitalsHourlySchema>;
export type VitalsHourly = typeof vitalsHourly.$inferSelect;

// Module 3: Inotropes & Sedation
export const inotropesSedation = pgTable("inotropes_sedation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  drugName: text("drug_name").notNull(),
  diagnosis: text("diagnosis"),
  concentration: text("concentration"),
  dose: text("dose"),
  rate: text("rate"), // ml/hr or mcg/kg/min
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  route: text("route"),
  sedationScale: text("sedation_scale"), // RASS or GCS value
  scaleType: text("scale_type"), // "RASS" or "GCS"
  nurseRemarks: text("nurse_remarks"),
  nurseId: varchar("nurse_id").notNull(),
  nurseName: text("nurse_name"),
  createdAt: timestamp("created_at").defaultNow(),
  version: integer("version").default(1),
});

export const insertInotropesSedationSchema = createInsertSchema(inotropesSedation).omit({
  id: true,
  createdAt: true,
  version: true,
});
export type InsertInotropesSedation = z.infer<typeof insertInotropesSedationSchema>;
export type InotropesSedation = typeof inotropesSedation.$inferSelect;

// Module 4: Ventilator Management (Conditional)
export const ventilatorSettings = pgTable("ventilator_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  ventilationMode: text("ventilation_mode").notNull(),
  fio2: integer("fio2"), // percentage
  setTidalVolume: integer("set_tidal_volume"),
  expiredTidalVolume: integer("expired_tidal_volume"),
  setMinuteVolume: decimal("set_minute_volume"),
  expiredMinuteVolume: decimal("expired_minute_volume"),
  respiratoryRateSet: integer("respiratory_rate_set"),
  respiratoryRateSpontaneous: integer("respiratory_rate_spontaneous"),
  simvRate: integer("simv_rate"),
  peepCpap: decimal("peep_cpap"),
  autoPeep: decimal("auto_peep"),
  peakAirwayPressure: decimal("peak_airway_pressure"),
  pressureSupport: decimal("pressure_support"),
  ieRatio: text("ie_ratio"),
  recordedAt: timestamp("recorded_at").defaultNow(),
  nurseId: varchar("nurse_id").notNull(),
  nurseName: text("nurse_name"),
  shift: text("shift").notNull(),
  version: integer("version").default(1),
});

export const insertVentilatorSettingsSchema = createInsertSchema(ventilatorSettings).omit({
  id: true,
  recordedAt: true,
  version: true,
});
export type InsertVentilatorSettings = z.infer<typeof insertVentilatorSettingsSchema>;
export type VentilatorSettings = typeof ventilatorSettings.$inferSelect;

// Module 5: ABG & Lab Values
export const abgLabResults = pgTable("abg_lab_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  // ABG Values
  ph: decimal("ph"),
  pco2: decimal("pco2"),
  po2: decimal("po2"),
  hco3: decimal("hco3"),
  baseExcess: decimal("base_excess"),
  o2Saturation: decimal("o2_saturation"),
  svo2: decimal("svo2"),
  lactate: decimal("lactate"),
  // Lab Values
  hb: decimal("hb"),
  wbc: decimal("wbc"),
  urea: decimal("urea"),
  creatinine: decimal("creatinine"),
  sodium: decimal("sodium"),
  potassium: decimal("potassium"),
  chloride: decimal("chloride"),
  pt: decimal("pt"),
  aptt: decimal("aptt"),
  lft: text("lft"), // JSON for multiple values
  bsl: decimal("bsl"),
  bloodCulture: text("blood_culture"),
  urineCulture: text("urine_culture"),
  sputumCulture: text("sputum_culture"),
  xrayChest: text("xray_chest"),
  otherInvestigations: text("other_investigations"),
  attachmentUrl: text("attachment_url"),
  attachmentType: text("attachment_type"),
  recordedAt: timestamp("recorded_at").defaultNow(),
  nurseId: varchar("nurse_id").notNull(),
  nurseName: text("nurse_name"),
  version: integer("version").default(1),
});

export const insertAbgLabResultsSchema = createInsertSchema(abgLabResults).omit({
  id: true,
  recordedAt: true,
  version: true,
});
export type InsertAbgLabResults = z.infer<typeof insertAbgLabResultsSchema>;
export type AbgLabResults = typeof abgLabResults.$inferSelect;

// Module 6: Intake Chart (Hourly)
export const intakeHourly = pgTable("intake_hourly", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  hourSlot: text("hour_slot").notNull(),
  ivLine1: integer("iv_line_1").default(0),
  ivLine2: integer("iv_line_2").default(0),
  ivLine3: integer("iv_line_3").default(0),
  ivLine4: integer("iv_line_4").default(0),
  ivLine5: integer("iv_line_5").default(0),
  ivLine6: integer("iv_line_6").default(0),
  oral: integer("oral").default(0),
  ngTube: integer("ng_tube").default(0),
  bloodProducts: integer("blood_products").default(0),
  medications: integer("medications").default(0),
  hourlyTotal: integer("hourly_total").default(0),
  nurseId: varchar("nurse_id").notNull(),
  nurseName: text("nurse_name"),
  recordedAt: timestamp("recorded_at").defaultNow(),
  version: integer("version").default(1),
});

export const insertIntakeHourlySchema = createInsertSchema(intakeHourly).omit({
  id: true,
  recordedAt: true,
  version: true,
});
export type InsertIntakeHourly = z.infer<typeof insertIntakeHourlySchema>;
export type IntakeHourly = typeof intakeHourly.$inferSelect;

// Module 7: Output Chart (Hourly)
export const outputHourly = pgTable("output_hourly", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  hourSlot: text("hour_slot").notNull(),
  urineOutput: integer("urine_output").default(0),
  drainOutput: integer("drain_output").default(0),
  drainType: text("drain_type"),
  vomitus: integer("vomitus").default(0),
  stool: integer("stool").default(0),
  otherLosses: integer("other_losses").default(0),
  otherLossesDescription: text("other_losses_description"),
  hourlyTotal: integer("hourly_total").default(0),
  nurseId: varchar("nurse_id").notNull(),
  nurseName: text("nurse_name"),
  recordedAt: timestamp("recorded_at").defaultNow(),
  version: integer("version").default(1),
});

export const insertOutputHourlySchema = createInsertSchema(outputHourly).omit({
  id: true,
  recordedAt: true,
  version: true,
});
export type InsertOutputHourly = z.infer<typeof insertOutputHourlySchema>;
export type OutputHourly = typeof outputHourly.$inferSelect;

// Module 8: Diabetic Flow Chart
export const diabeticFlow = pgTable("diabetic_flow", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  recordedTime: timestamp("recorded_time").notNull(),
  bloodSugarLevel: integer("blood_sugar_level").notNull(),
  insulinType: text("insulin_type"),
  insulinDose: decimal("insulin_dose"),
  route: text("route"),
  sodium: decimal("sodium"),
  potassium: decimal("potassium"),
  chloride: decimal("chloride"),
  alertType: text("alert_type"), // HYPOGLYCEMIA, HYPERGLYCEMIA, MISSED_INSULIN
  alertMessage: text("alert_message"),
  nurseId: varchar("nurse_id").notNull(),
  nurseName: text("nurse_name"),
  nurseSignature: text("nurse_signature"),
  createdAt: timestamp("created_at").defaultNow(),
  version: integer("version").default(1),
});

export const insertDiabeticFlowSchema = createInsertSchema(diabeticFlow).omit({
  id: true,
  createdAt: true,
  version: true,
});
export type InsertDiabeticFlow = z.infer<typeof insertDiabeticFlowSchema>;
export type DiabeticFlow = typeof diabeticFlow.$inferSelect;

// Module 9: Medication Administration Record (MAR)
export const medicationAdminRecords = pgTable("medication_admin_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  drugName: text("drug_name").notNull(),
  diagnosis: text("diagnosis"),
  route: text("route").notNull(),
  dose: text("dose").notNull(),
  frequency: text("frequency").notNull(), // 1x, 2x, 3x, 4x
  mealTiming: text("meal_timing"), // pre_meal, post_meal
  scheduledTime: timestamp("scheduled_time").notNull(),
  actualGivenTime: timestamp("actual_given_time"),
  status: text("status").notNull().default("GIVEN"), // GIVEN, HELD, MISSED
  reasonNotGiven: text("reason_not_given"),
  orderedBy: varchar("ordered_by"),
  orderedByName: text("ordered_by_name"),
  nurseId: varchar("nurse_id").notNull(),
  nurseName: text("nurse_name"),
  createdAt: timestamp("created_at").defaultNow(),
  version: integer("version").default(1),
});

export const insertMedicationAdminRecordSchema = createInsertSchema(medicationAdminRecords).omit({
  id: true,
  createdAt: true,
  version: true,
});
export type InsertMedicationAdminRecord = z.infer<typeof insertMedicationAdminRecordSchema>;
export type MedicationAdminRecord = typeof medicationAdminRecords.$inferSelect;

// Module 10: Once-Only Drugs
export const onceOnlyDrugs = pgTable("once_only_drugs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  drugName: text("drug_name").notNull(),
  dose: text("dose").notNull(),
  route: text("route").notNull(),
  timeOrdered: timestamp("time_ordered").notNull(),
  timeGiven: timestamp("time_given"),
  doctorId: varchar("doctor_id"),
  doctorName: text("doctor_name"),
  doctorSignature: text("doctor_signature"),
  nurseId: varchar("nurse_id").notNull(),
  nurseName: text("nurse_name"),
  nurseSignature: text("nurse_signature"),
  createdAt: timestamp("created_at").defaultNow(),
  version: integer("version").default(1),
});

export const insertOnceOnlyDrugSchema = createInsertSchema(onceOnlyDrugs).omit({
  id: true,
  createdAt: true,
  version: true,
});
export type InsertOnceOnlyDrug = z.infer<typeof insertOnceOnlyDrugSchema>;
export type OnceOnlyDrug = typeof onceOnlyDrugs.$inferSelect;

// Module 11: Nursing Remarks & Shift Diary
export const nursingShiftNotes = pgTable("nursing_shift_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  noteTime: timestamp("note_time").notNull(),
  eventType: text("event_type").notNull().default("ROUTINE"), // ROUTINE, EMERGENCY, CRITICAL
  observation: text("observation").notNull(),
  actionTaken: text("action_taken"),
  doctorInformed: boolean("doctor_informed").default(false),
  doctorName: text("doctor_name"),
  shift: text("shift").notNull(), // MORNING, EVENING, NIGHT
  nurseId: varchar("nurse_id").notNull(),
  nurseName: text("nurse_name"),
  nurseInitial: text("nurse_initial"),
  staffRole: text("staff_role").default("NURSE"),
  createdAt: timestamp("created_at").defaultNow(),
  version: integer("version").default(1),
});

export const insertNursingShiftNoteSchema = createInsertSchema(nursingShiftNotes).omit({
  id: true,
  createdAt: true,
  version: true,
});
export type InsertNursingShiftNote = z.infer<typeof insertNursingShiftNoteSchema>;
export type NursingShiftNote = typeof nursingShiftNotes.$inferSelect;

// Module 12: Airway, Lines & Tubes
export const airwayLinesTubes = pgTable("airway_lines_tubes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  ettSize: text("ett_size"),
  tracheostomyDetails: text("tracheostomy_details"),
  cuffPressureMorning: decimal("cuff_pressure_morning"),
  cuffPressureEvening: decimal("cuff_pressure_evening"),
  cuffPressureNight: decimal("cuff_pressure_night"),
  daysIntubated: integer("days_intubated").default(0),
  daysVentilated: integer("days_ventilated").default(0),
  centralLineDetails: text("central_line_details"),
  centralLineInsertDate: text("central_line_insert_date"),
  foleyDetails: text("foley_details"),
  foleyInsertDate: text("foley_insert_date"),
  drainsDetails: text("drains_details"), // JSON array
  nurseId: varchar("nurse_id").notNull(),
  nurseName: text("nurse_name"),
  updatedAt: timestamp("updated_at").defaultNow(),
  version: integer("version").default(1),
});

export const insertAirwayLinesTubesSchema = createInsertSchema(airwayLinesTubes).omit({
  id: true,
  updatedAt: true,
  version: true,
});
export type InsertAirwayLinesTubes = z.infer<typeof insertAirwayLinesTubesSchema>;
export type AirwayLinesTubes = typeof airwayLinesTubes.$inferSelect;

// Module 13: Staff on Duty
export const dutyStaffAssignments = pgTable("duty_staff_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  shift: text("shift").notNull(), // MORNING, EVENING, NIGHT
  nurseId: varchar("nurse_id").notNull(),
  nurseName: text("nurse_name").notNull(),
  employeeId: text("employee_id"),
  shiftStartTime: timestamp("shift_start_time").notNull(),
  shiftEndTime: timestamp("shift_end_time"),
  nursesNotes: text("nurses_notes"),
  staffSignEmpNo: text("staff_sign_emp_no"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDutyStaffAssignmentSchema = createInsertSchema(dutyStaffAssignments).omit({
  id: true,
  createdAt: true,
});
export type InsertDutyStaffAssignment = z.infer<typeof insertDutyStaffAssignmentSchema>;
export type DutyStaffAssignment = typeof dutyStaffAssignments.$inferSelect;

// Module 14: Allergies & Precautions (Always Visible)
export const patientAllergiesPrecautions = pgTable("patient_allergies_precautions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  drugAllergies: text("drug_allergies"), // JSON array
  foodAllergies: text("food_allergies"), // JSON array
  specialPrecautions: text("special_precautions"),
  infectionControlFlags: text("infection_control_flags"), // JSON array
  nurseId: varchar("nurse_id").notNull(),
  nurseName: text("nurse_name"),
  updatedAt: timestamp("updated_at").defaultNow(),
  version: integer("version").default(1),
});

export const insertPatientAllergiesPrecautionsSchema = createInsertSchema(patientAllergiesPrecautions).omit({
  id: true,
  updatedAt: true,
  version: true,
});
export type InsertPatientAllergiesPrecautions = z.infer<typeof insertPatientAllergiesPrecautionsSchema>;
export type PatientAllergiesPrecautions = typeof patientAllergiesPrecautions.$inferSelect;

// Module 15: IPD Investigation Chart
export const ipdInvestigationChart = pgTable("ipd_investigation_chart", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  investigationDate: timestamp("investigation_date").notNull(),
  
  // HEMATOLOGY & ACUTE PHASE PROTEINS
  wbc: text("wbc"),
  neutrophilsPercent: text("neutrophils_percent"),
  lymphocytesPercent: text("lymphocytes_percent"),
  platelets: text("platelets"),
  hb: text("hb"),
  esr: text("esr"),
  crp: text("crp"),
  il6: text("il6"),
  procalcitonin: text("procalcitonin"),
  ldh: text("ldh"),
  ferritin: text("ferritin"),
  serumIron: text("serum_iron"),
  tibc: text("tibc"),
  bslRandom: text("bsl_random"),
  urineRoutine: text("urine_routine"),
  urineProteins: text("urine_proteins"),
  urinePusCells: text("urine_pus_cells"),
  
  // INFECTION PANEL
  hiv: text("hiv"),
  hbsag: text("hbsag"),
  hcv: text("hcv"),
  malaria: text("malaria"),
  dengueNs1: text("dengue_ns1"),
  dengueIgG: text("dengue_igg"),
  dengueIgM: text("dengue_igm"),
  chikungunyaIgG: text("chikungunya_igg"),
  chikungunyaIgM: text("chikungunya_igm"),
  weilFelix: text("weil_felix"),
  widal: text("widal"),
  hPylori: text("h_pylori"),
  hba1c: text("hba1c"),
  meanGlucose: text("mean_glucose"),
  
  // RENAL FUNCTION
  bloodUrea: text("blood_urea"),
  creatinine: text("creatinine"),
  sodiumNa: text("sodium_na"),
  potassiumK: text("potassium_k"),
  calcium: text("calcium"),
  phosphorus: text("phosphorus"),
  uricAcid: text("uric_acid"),
  
  // CARDIAC FUNCTION VALUES
  troponin: text("troponin"),
  cpkMb: text("cpk_mb"),
  ntProBnp: text("nt_pro_bnp"),
  
  // LIPID PROFILE
  totalCholesterol: text("total_cholesterol"),
  triglycerides: text("triglycerides"),
  hdl: text("hdl"),
  ldlDirectLdl: text("ldl_direct_ldl"),
  
  // HEPATO-BILIARY-PANCREATIC VALUES
  totalBilirubin: text("total_bilirubin"),
  directBilirubin: text("direct_bilirubin"),
  indirectBilirubin: text("indirect_bilirubin"),
  sgot: text("sgot"),
  sgpt: text("sgpt"),
  alkPo4: text("alk_po4"),
  totalProteins: text("total_proteins"),
  albumin: text("albumin"),
  cholinesterase: text("cholinesterase"),
  ggtp: text("ggtp"),
  ammonia: text("ammonia"),
  amylase: text("amylase"),
  lipase: text("lipase"),
  
  // COAGULATION PROFILE
  bleedingTime: text("bleeding_time"),
  clottingTime: text("clotting_time"),
  prothrombinTime: text("prothrombin_time"),
  inr: text("inr"),
  aptt: text("aptt"),
  dDimer: text("d_dimer"),
  
  // BLOOD GROUP & RH
  bloodGroup: text("blood_group"),
  rhFactor: text("rh_factor"),
  
  // HORMONES
  tsh: text("tsh"),
  t3: text("t3"),
  t4: text("t4"),
  ft3: text("ft3"),
  ft4: text("ft4"),
  lh: text("lh"),
  fsh: text("fsh"),
  
  // ARTERIAL BLOOD GASES
  abgDate: text("abg_date"),
  abgPh: text("abg_ph"),
  abgPaco2: text("abg_paco2"),
  abgPao2: text("abg_pao2"),
  abgHco3: text("abg_hco3"),
  abgO2Saturation: text("abg_o2_saturation"),
  abgLactate: text("abg_lactate"),
  
  // ULTRASONOGRAPHY
  usgRk: text("usg_rk"),
  usgLk: text("usg_lk"),
  usgProstate: text("usg_prostate"),
  usgResUrine: text("usg_res_urine"),
  usgFindings: text("usg_findings"),
  
  // X-RAY
  chestXrayFindings: text("chest_xray_findings"),
  otherXrayFindings: text("other_xray_findings"),
  
  // ECG
  ecgFindings: text("ecg_findings"),
  
  // ECHO CARDIOGRAPHY & COLOUR DOPPLER
  echoLvef: text("echo_lvef"),
  echoIvs: text("echo_ivs"),
  echoLvpw: text("echo_lvpw"),
  echoEe: text("echo_ee"),
  echoFindings: text("echo_findings"),
  
  // ANGIOGRAPHY
  angioLtMain: text("angio_lt_main"),
  angioLad: text("angio_lad"),
  angioLcx: text("angio_lcx"),
  angioRca: text("angio_rca"),
  angioFindings: text("angio_findings"),
  
  // CT & MRI
  ctScanFindings: text("ct_scan_findings"),
  mriFindings: text("mri_findings"),
  
  // OTHER
  otherInvestigations: text("other_investigations"),
  
  // BODY FLUIDS (CSF/Pleural/Sputum/BAL/Pericardial/Peritoneal/Synovial/Abscess)
  bodyFluidType: text("body_fluid_type"),
  bodyFluidOrganism: text("body_fluid_organism"),
  bodyFluidSensitivity: text("body_fluid_sensitivity"),
  bodyFluidTlc: text("body_fluid_tlc"),
  bodyFluidRbc: text("body_fluid_rbc"),
  bodyFluidSugar: text("body_fluid_sugar"),
  bodyFluidProteins: text("body_fluid_proteins"),
  
  // Legacy fields for backward compatibility
  hbPcv: text("hb_pcv"),
  tlc: text("tlc"),
  dlcPlemb: text("dlc_plemb"),
  parasites: text("parasites"),
  btCt: text("bt_ct"),
  ptAptt: text("pt_aptt"),
  bloodSugarFasting: text("blood_sugar_fasting"),
  ppRandom: text("pp_random"),
  bun: text("bun"),
  srCreatinine: text("sr_creatinine"),
  srNaKCl: text("sr_na_k_cl"),
  srCalPhosMag: text("sr_cal_phos_mag"),
  acidPhosUricAcid: text("acid_phos_uric_acid"),
  srBilirubinTotal: text("sr_bilirubin_total"),
  bilirubinDirectIndirect: text("bilirubin_direct_indirect"),
  sgotSgpt: text("sgot_sgpt"),
  srAlkphos: text("sr_alkphos"),
  srProteinsTotal: text("sr_proteins_total"),
  viralMarkers: text("viral_markers"),
  srAmylaseLipase: text("sr_amylase_lipase"),
  srLdh: text("sr_ldh"),
  tropi: text("tropi"),
  hdlLdlVldl: text("hdl_ldl_vldl"),
  stoolRoutine: text("stool_routine"),
  sputumExamination: text("sputum_examination"),
  ecg: text("ecg"),
  echo2d: text("echo_2d"),
  usg: text("usg"),
  doppler: text("doppler"),
  xrays: text("xrays"),
  ctScanMri: text("ct_scan_mri"),
  histopathology: text("histopathology"),
  fluidAnalysis: text("fluid_analysis"),
  
  nurseId: varchar("nurse_id"),
  nurseName: text("nurse_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIpdInvestigationChartSchema = createInsertSchema(ipdInvestigationChart).omit({
  id: true,
  createdAt: true,
});
export type InsertIpdInvestigationChart = z.infer<typeof insertIpdInvestigationChartSchema>;
export type IpdInvestigationChart = typeof ipdInvestigationChart.$inferSelect;

// Audit Log for Patient Monitoring (NABH Compliance)
export const patientMonitoringAuditLog = pgTable("patient_monitoring_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  tableName: text("table_name").notNull(),
  recordId: varchar("record_id").notNull(),
  action: text("action").notNull(), // CREATE, UPDATE, VIEW
  previousData: text("previous_data"), // JSON snapshot
  newData: text("new_data"), // JSON snapshot
  nurseId: varchar("nurse_id").notNull(),
  nurseName: text("nurse_name"),
  deviceId: text("device_id"),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertPatientMonitoringAuditLogSchema = createInsertSchema(patientMonitoringAuditLog).omit({
  id: true,
  timestamp: true,
});
export type InsertPatientMonitoringAuditLog = z.infer<typeof insertPatientMonitoringAuditLogSchema>;
export type PatientMonitoringAuditLog = typeof patientMonitoringAuditLog.$inferSelect;

// ========== BED MANAGEMENT MODULE ==========
// NABH-Compliant Hospital Bed Management System

// Bed Occupancy Status Enum
export const bedOccupancyStatusEnum = pgEnum("bed_occupancy_status", [
  "AVAILABLE", "OCCUPIED", "CLEANING", "BLOCKED", "MAINTENANCE"
]);

// Bed Category Enum
export const bedCategoryTypeEnum = pgEnum("bed_category_type", [
  "GENERAL_WARD", "SEMI_PRIVATE", "PRIVATE", "DELUXE", "SUITE",
  "ICU", "HDU", "NICU", "PICU", "ISOLATION", "DAY_CARE", "EMERGENCY"
]);

// Bed Category Master (defines rules per category)
export const bedCategories = pgTable("bed_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  description: text("description"),
  categoryType: text("category_type").notNull(), // GENERAL_WARD, ICU, etc.
  serviceEntitlements: text("service_entitlements"), // JSON array of entitled services
  monitoringRequirements: text("monitoring_requirements"), // JSON: vitals frequency, nursing ratio
  transferEligibility: text("transfer_eligibility"), // JSON: which categories can transfer to/from
  documentationIntensity: text("documentation_intensity").default("STANDARD"), // STANDARD, HIGH, CRITICAL
  maxDayCareDurationHours: integer("max_day_care_duration_hours"), // For day-care beds
  requiresIcuAdmission: boolean("requires_icu_admission").default(false),
  requiresPediatricPatient: boolean("requires_pediatric_patient").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBedCategorySchema = createInsertSchema(bedCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBedCategory = z.infer<typeof insertBedCategorySchema>;
export type BedCategory = typeof bedCategories.$inferSelect;

// Bed Master (individual physical beds)
export const beds = pgTable("beds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bedNumber: text("bed_number").notNull(),
  bedName: text("bed_name"),
  categoryId: varchar("category_id").notNull(),
  wardName: text("ward_name").notNull(),
  floor: text("floor").notNull(),
  department: text("department").notNull(), // General, ICU, Pediatric, Emergency
  occupancyStatus: text("occupancy_status").default("AVAILABLE"), // AVAILABLE, OCCUPIED, CLEANING, BLOCKED, MAINTENANCE
  currentPatientId: varchar("current_patient_id"),
  currentAdmissionId: varchar("current_admission_id"),
  hasOxygenCapability: boolean("has_oxygen_capability").default(false),
  hasVentilatorCapability: boolean("has_ventilator_capability").default(false),
  isIsolationBed: boolean("is_isolation_bed").default(false),
  infectionControlFlag: boolean("infection_control_flag").default(false),
  ppeProtocolRequired: boolean("ppe_protocol_required").default(false),
  bedStartDatetime: timestamp("bed_start_datetime"),
  lastOccupiedAt: timestamp("last_occupied_at"),
  lastCleanedAt: timestamp("last_cleaned_at"),
  lastMaintenanceAt: timestamp("last_maintenance_at"),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBedSchema = createInsertSchema(beds).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBed = z.infer<typeof insertBedSchema>;
export type Bed = typeof beds.$inferSelect;

// Bed Transfers (Immutable audit trail for bed movements)
export const bedTransfers = pgTable("bed_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  admissionId: varchar("admission_id").notNull(),
  fromBedId: varchar("from_bed_id").notNull(),
  fromBedNumber: text("from_bed_number").notNull(),
  fromWard: text("from_ward").notNull(),
  toBedId: varchar("to_bed_id").notNull(),
  toBedNumber: text("to_bed_number").notNull(),
  toWard: text("to_ward").notNull(),
  transferReason: text("transfer_reason").notNull(), // MEDICAL_CONDITION, PATIENT_REQUEST, ICU_ESCALATION, ICU_DOWNGRADE, ISOLATION, OTHER
  transferReasonDetails: text("transfer_reason_details"),
  doctorAuthorizationId: varchar("doctor_authorization_id").notNull(),
  doctorName: text("doctor_name").notNull(),
  transferSequenceNumber: integer("transfer_sequence_number").notNull(),
  transferDatetime: timestamp("transfer_datetime").notNull(),
  createdBy: varchar("created_by").notNull(),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBedTransferSchema = createInsertSchema(bedTransfers).omit({
  id: true,
  createdAt: true,
});
export type InsertBedTransfer = z.infer<typeof insertBedTransferSchema>;
export type BedTransfer = typeof bedTransfers.$inferSelect;

// Bed Allocation History (Records each bed allocation)
export const bedAllocations = pgTable("bed_allocations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  admissionId: varchar("admission_id").notNull(),
  bedId: varchar("bed_id").notNull(),
  bedNumber: text("bed_number").notNull(),
  categoryId: varchar("category_id").notNull(),
  categoryName: text("category_name").notNull(),
  wardName: text("ward_name").notNull(),
  allocationDatetime: timestamp("allocation_datetime").notNull(),
  releaseDatetime: timestamp("release_datetime"),
  releaseReason: text("release_reason"), // DISCHARGE, TRANSFER, DEATH, LAMA
  isDayCare: boolean("is_day_care").default(false),
  expectedDuration: integer("expected_duration"), // For day-care in hours
  isOverstay: boolean("is_overstay").default(false),
  allocatedBy: varchar("allocated_by").notNull(),
  allocatedByName: text("allocated_by_name"),
  releasedBy: varchar("released_by"),
  releasedByName: text("released_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBedAllocationSchema = createInsertSchema(bedAllocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBedAllocation = z.infer<typeof insertBedAllocationSchema>;
export type BedAllocation = typeof bedAllocations.$inferSelect;

// Bed Audit Log (Immutable - NABH Compliance)
export const bedAuditLog = pgTable("bed_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bedId: varchar("bed_id").notNull(),
  bedNumber: text("bed_number").notNull(),
  action: text("action").notNull(), // ALLOCATE, RELEASE, TRANSFER, STATUS_CHANGE, CLEANING_START, CLEANING_COMPLETE, BLOCK, UNBLOCK
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  patientId: varchar("patient_id"),
  patientName: text("patient_name"),
  admissionId: varchar("admission_id"),
  details: text("details"), // JSON for additional context
  userId: varchar("user_id").notNull(),
  userName: text("user_name").notNull(),
  userRole: text("user_role").notNull(),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertBedAuditLogSchema = createInsertSchema(bedAuditLog).omit({
  id: true,
  timestamp: true,
});
export type InsertBedAuditLog = z.infer<typeof insertBedAuditLogSchema>;
export type BedAuditLog = typeof bedAuditLog.$inferSelect;

// ========== BLOOD BANK MODULE ==========

// Blood Group Enum
export const bloodGroupEnum = pgEnum("blood_group", ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);

// Blood Component Type Enum
export const bloodComponentEnum = pgEnum("blood_component", [
  "WHOLE_BLOOD", "PRBC", "PLATELET", "FFP", "CRYOPRECIPITATE", "GRANULOCYTES"
]);

// Blood Unit Status Enum
export const bloodUnitStatusEnum = pgEnum("blood_unit_status", [
  "COLLECTED", "TESTING", "QUARANTINE", "AVAILABLE", "RESERVED", "ISSUED", "TRANSFUSED", "RETURNED", "EXPIRED", "DISPOSED"
]);

// Blood Bank Service Groups (10 NABH-compliant groups)
export const bloodServiceGroups = pgTable("blood_service_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBloodServiceGroupSchema = createInsertSchema(bloodServiceGroups).omit({
  id: true,
  createdAt: true,
});
export type InsertBloodServiceGroup = z.infer<typeof insertBloodServiceGroupSchema>;
export type BloodServiceGroup = typeof bloodServiceGroups.$inferSelect;

// Blood Bank Services (Individual services under each group)
export const bloodServices = pgTable("blood_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  isMandatory: boolean("is_mandatory").default(false),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBloodServiceSchema = createInsertSchema(bloodServices).omit({
  id: true,
  createdAt: true,
});
export type InsertBloodService = z.infer<typeof insertBloodServiceSchema>;
export type BloodService = typeof bloodServices.$inferSelect;

// Blood Donors
export const bloodDonors = pgTable("blood_donors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  donorId: text("donor_id").notNull().unique(), // DN-YYYYMMDD-XXXX
  name: text("name").notNull(),
  bloodGroup: text("blood_group").notNull(),
  rhFactor: text("rh_factor").notNull(), // Positive/Negative
  dateOfBirth: text("date_of_birth"),
  age: integer("age"),
  gender: text("gender").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  aadharNumber: text("aadhar_number"),
  occupation: text("occupation"),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  hemoglobinLevel: decimal("hemoglobin_level", { precision: 4, scale: 1 }),
  bloodPressure: text("blood_pressure"),
  pulseRate: integer("pulse_rate"),
  totalDonations: integer("total_donations").default(0),
  lastDonationDate: text("last_donation_date"),
  nextEligibleDate: text("next_eligible_date"),
  isDeferredPermanent: boolean("is_deferred_permanent").default(false),
  deferralReason: text("deferral_reason"),
  deferralEndDate: text("deferral_end_date"),
  eligibilityStatus: text("eligibility_status").default("ELIGIBLE"), // ELIGIBLE, TEMPORARILY_DEFERRED, PERMANENTLY_DEFERRED
  consentGiven: boolean("consent_given").default(false),
  consentDate: text("consent_date"),
  registeredBy: varchar("registered_by"),
  registeredByName: text("registered_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBloodDonorSchema = createInsertSchema(bloodDonors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBloodDonor = z.infer<typeof insertBloodDonorSchema>;
export type BloodDonor = typeof bloodDonors.$inferSelect;

// Blood Storage Facilities (Refrigerators/Freezers)
export const bloodStorageFacilities = pgTable("blood_storage_facilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityCode: text("facility_code").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(), // REFRIGERATOR, FREEZER, PLATELET_AGITATOR
  location: text("location").notNull(),
  capacity: integer("capacity").notNull(), // Number of units
  currentOccupancy: integer("current_occupancy").default(0),
  minTemperature: decimal("min_temperature", { precision: 5, scale: 2 }).notNull(),
  maxTemperature: decimal("max_temperature", { precision: 5, scale: 2 }).notNull(),
  currentTemperature: decimal("current_temperature", { precision: 5, scale: 2 }),
  lastTemperatureReading: timestamp("last_temperature_reading"),
  isOperational: boolean("is_operational").default(true),
  hasTemperatureBreach: boolean("has_temperature_breach").default(false),
  componentTypes: text("component_types"), // CSV of allowed component types
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBloodStorageFacilitySchema = createInsertSchema(bloodStorageFacilities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBloodStorageFacility = z.infer<typeof insertBloodStorageFacilitySchema>;
export type BloodStorageFacility = typeof bloodStorageFacilities.$inferSelect;

// Blood Storage Temperature Logs (Immutable)
export const bloodTemperatureLogs = pgTable("blood_temperature_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull(),
  temperature: decimal("temperature", { precision: 5, scale: 2 }).notNull(),
  isBreach: boolean("is_breach").default(false),
  breachType: text("breach_type"), // HIGH, LOW
  recordedBy: varchar("recorded_by"),
  recordedByName: text("recorded_by_name"),
  notes: text("notes"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertBloodTemperatureLogSchema = createInsertSchema(bloodTemperatureLogs).omit({
  id: true,
  timestamp: true,
});
export type InsertBloodTemperatureLog = z.infer<typeof insertBloodTemperatureLogSchema>;
export type BloodTemperatureLog = typeof bloodTemperatureLogs.$inferSelect;

// Blood Units (Core inventory)
export const bloodUnits = pgTable("blood_units", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  unitId: text("unit_id").notNull().unique(), // BU-YYYYMMDD-XXXX (Barcode)
  componentType: text("component_type").notNull(),
  bloodGroup: text("blood_group").notNull(),
  rhFactor: text("rh_factor").notNull(),
  volume: integer("volume").notNull(), // in mL
  donorId: varchar("donor_id").notNull(),
  donorName: text("donor_name").notNull(),
  collectionDate: text("collection_date").notNull(),
  collectionTime: text("collection_time"),
  collectionServiceId: varchar("collection_service_id"),
  testingServiceId: varchar("testing_service_id"),
  storageServiceId: varchar("storage_service_id"),
  issueServiceId: varchar("issue_service_id"),
  storageFacilityId: varchar("storage_facility_id"),
  status: text("status").notNull().default("COLLECTED"),
  expiryDate: text("expiry_date").notNull(),
  expiryTime: text("expiry_time"),
  isExpired: boolean("is_expired").default(false),
  isTestingComplete: boolean("is_testing_complete").default(false),
  testingResults: text("testing_results"), // JSON with all test results
  crossMatchResults: text("cross_match_results"), // JSON
  isCompatible: boolean("is_compatible"),
  reservedForPatientId: varchar("reserved_for_patient_id"),
  reservedForPatientName: text("reserved_for_patient_name"),
  issuedToPatientId: varchar("issued_to_patient_id"),
  issuedToPatientName: text("issued_to_patient_name"),
  issuedDate: text("issued_date"),
  issuedBy: varchar("issued_by"),
  issuedByName: text("issued_by_name"),
  issueDepartment: text("issue_department"), // ICU, OT, IPD, EMERGENCY
  transfusionStartTime: text("transfusion_start_time"),
  transfusionEndTime: text("transfusion_end_time"),
  transfusionNotes: text("transfusion_notes"),
  hasReaction: boolean("has_reaction").default(false),
  returnedDate: text("returned_date"),
  returnReason: text("return_reason"),
  disposalDate: text("disposal_date"),
  disposalReason: text("disposal_reason"),
  disposalAuthorizedBy: varchar("disposal_authorized_by"),
  disposalAuthorizedByName: text("disposal_authorized_by_name"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBloodUnitSchema = createInsertSchema(bloodUnits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBloodUnit = z.infer<typeof insertBloodUnitSchema>;
export type BloodUnit = typeof bloodUnits.$inferSelect;

// Blood Transfusion Orders (Request to issue blood)
export const bloodTransfusionOrders = pgTable("blood_transfusion_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: text("order_id").notNull().unique(), // TO-YYYYMMDD-XXXX
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  patientBloodGroup: text("patient_blood_group").notNull(),
  patientRhFactor: text("patient_rh_factor").notNull(),
  admissionId: varchar("admission_id"),
  wardDepartment: text("ward_department").notNull(), // ICU, NICU, PICU, OT, IPD, EMERGENCY
  componentRequired: text("component_required").notNull(),
  unitsRequired: integer("units_required").notNull(),
  urgency: text("urgency").notNull().default("ROUTINE"), // ROUTINE, URGENT, EMERGENCY, MASSIVE_TRANSFUSION
  indication: text("indication").notNull(), // Reason for transfusion
  requestingDoctorId: varchar("requesting_doctor_id").notNull(),
  requestingDoctorName: text("requesting_doctor_name").notNull(),
  crossMatchRequired: boolean("cross_match_required").default(true),
  crossMatchStatus: text("cross_match_status").default("PENDING"), // PENDING, COMPATIBLE, INCOMPATIBLE
  status: text("status").notNull().default("PENDING"), // PENDING, APPROVED, ISSUED, COMPLETED, CANCELLED
  bloodUnitIds: text("blood_unit_ids"), // JSON array of assigned blood unit IDs
  approvedBy: varchar("approved_by"),
  approvedByName: text("approved_by_name"),
  approvedAt: timestamp("approved_at"),
  issuedBy: varchar("issued_by"),
  issuedByName: text("issued_by_name"),
  issuedAt: timestamp("issued_at"),
  completedAt: timestamp("completed_at"),
  cancelledReason: text("cancelled_reason"),
  notes: text("notes"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBloodTransfusionOrderSchema = createInsertSchema(bloodTransfusionOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBloodTransfusionOrder = z.infer<typeof insertBloodTransfusionOrderSchema>;
export type BloodTransfusionOrder = typeof bloodTransfusionOrders.$inferSelect;

// Blood Transfusion Reactions
export const bloodTransfusionReactions = pgTable("blood_transfusion_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reactionId: text("reaction_id").notNull().unique(), // TR-YYYYMMDD-XXXX
  bloodUnitId: varchar("blood_unit_id").notNull(),
  bloodUnitNumber: text("blood_unit_number").notNull(),
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  transfusionOrderId: varchar("transfusion_order_id"),
  reactionType: text("reaction_type").notNull(), // FEBRILE, ALLERGIC, HEMOLYTIC, ANAPHYLACTIC, TRALI, TACO, OTHER
  severity: text("severity").notNull(), // MILD, MODERATE, SEVERE, LIFE_THREATENING
  onsetTime: text("onset_time").notNull(),
  symptoms: text("symptoms").notNull(), // JSON array
  vitalSigns: text("vital_signs"), // JSON with vitals at reaction time
  immediateActions: text("immediate_actions"), // JSON array of interventions
  transfusionStopped: boolean("transfusion_stopped").default(true),
  doctorNotified: boolean("doctor_notified").default(false),
  doctorNotifiedTime: text("doctor_notified_time"),
  doctorId: varchar("doctor_id"),
  doctorName: text("doctor_name"),
  bloodBankNotified: boolean("blood_bank_notified").default(false),
  bloodBankNotifiedTime: text("blood_bank_notified_time"),
  outcome: text("outcome"), // RECOVERED, HOSPITALIZED, ICU_TRANSFER, DECEASED
  followUpRequired: boolean("follow_up_required").default(false),
  investigationNotes: text("investigation_notes"),
  reportedBy: varchar("reported_by").notNull(),
  reportedByName: text("reported_by_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBloodTransfusionReactionSchema = createInsertSchema(bloodTransfusionReactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBloodTransfusionReaction = z.infer<typeof insertBloodTransfusionReactionSchema>;
export type BloodTransfusionReaction = typeof bloodTransfusionReactions.$inferSelect;

// Blood Bank Audit Log (Immutable - NABH/FDA Compliance)
export const bloodBankAuditLog = pgTable("blood_bank_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull(), // DONOR, BLOOD_UNIT, TRANSFUSION_ORDER, STORAGE, SERVICE
  entityId: varchar("entity_id").notNull(),
  action: text("action").notNull(), // CREATE, UPDATE, STATUS_CHANGE, ISSUE, RETURN, DISPOSE, TEST, TEMP_BREACH
  previousValue: text("previous_value"), // JSON
  newValue: text("new_value"), // JSON
  serviceId: varchar("service_id"), // Link to blood service that triggered this
  serviceName: text("service_name"),
  details: text("details"),
  userId: varchar("user_id").notNull(),
  userName: text("user_name").notNull(),
  userRole: text("user_role").notNull(),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertBloodBankAuditLogSchema = createInsertSchema(bloodBankAuditLog).omit({
  id: true,
  timestamp: true,
});
export type InsertBloodBankAuditLog = z.infer<typeof insertBloodBankAuditLogSchema>;
export type BloodBankAuditLog = typeof bloodBankAuditLog.$inferSelect;

// ========== MEDICAL STORE INTEGRATION MODULE ==========
// Medical Store Types: IN_HOUSE (hospital pharmacy), THIRD_PARTY (external pharmacy)

// Medical Store Status Enum
export const medicalStoreStatusEnum = pgEnum("medical_store_status", ["ACTIVE", "INACTIVE", "SUSPENDED"]);

// Medical Stores table - stores managed by admin
export const medicalStores = pgTable("medical_stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeCode: text("store_code").notNull().unique(), // MS-001, MS-002
  storeName: text("store_name").notNull(),
  storeType: text("store_type").notNull().default("IN_HOUSE"), // IN_HOUSE, THIRD_PARTY
  ownerName: text("owner_name"),
  licenseNumber: text("license_number").notNull(),
  gstNumber: text("gst_number"),
  drugLicenseNumber: text("drug_license_number"),
  address: text("address").notNull(),
  city: text("city").notNull().default("Pune"),
  state: text("state").notNull().default("Maharashtra"),
  pincode: text("pincode"),
  phone: text("phone").notNull(),
  email: text("email"),
  website: text("website"),
  operatingHours: text("operating_hours").default("08:00 AM - 10:00 PM"),
  is24Hours: boolean("is_24_hours").default(false),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, INACTIVE, SUSPENDED
  hasInventoryAccess: boolean("has_inventory_access").default(false), // Only for IN_HOUSE
  canSubstituteMedicines: boolean("can_substitute_medicines").default(false),
  requiresDoctorApproval: boolean("requires_doctor_approval").default(true),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0"),
  maxDiscountPercentage: decimal("max_discount_percentage", { precision: 5, scale: 2 }).default("10"),
  notes: text("notes"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMedicalStoreSchema = createInsertSchema(medicalStores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMedicalStore = z.infer<typeof insertMedicalStoreSchema>;
export type MedicalStore = typeof medicalStores.$inferSelect;

// Medical Store Users - login credentials for store staff
export const medicalStoreUsers = pgTable("medical_store_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Link to users table
  storeId: varchar("store_id").notNull(), // Link to medical_stores
  staffRole: text("staff_role").notNull().default("PHARMACIST"), // MANAGER, PHARMACIST, BILLING_STAFF
  employeeId: text("employee_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMedicalStoreUserSchema = createInsertSchema(medicalStoreUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMedicalStoreUser = z.infer<typeof insertMedicalStoreUserSchema>;
export type MedicalStoreUser = typeof medicalStoreUsers.$inferSelect;

// Medical Store Inventory - store-specific stock (for third-party stores)
export const medicalStoreInventory = pgTable("medical_store_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").notNull(),
  medicineName: text("medicine_name").notNull(),
  genericName: text("generic_name"),
  brandName: text("brand_name"),
  strength: text("strength"),
  dosageForm: text("dosage_form"),
  batchNumber: text("batch_number"),
  expiryDate: text("expiry_date"),
  quantity: integer("quantity").notNull().default(0),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  mrp: decimal("mrp", { precision: 10, scale: 2 }),
  gstPercentage: decimal("gst_percentage", { precision: 5, scale: 2 }).default("12"),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMedicalStoreInventorySchema = createInsertSchema(medicalStoreInventory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMedicalStoreInventory = z.infer<typeof insertMedicalStoreInventorySchema>;
export type MedicalStoreInventory = typeof medicalStoreInventory.$inferSelect;

// Prescription Dispensing - tracks which prescriptions are dispensed by which store
export const prescriptionDispensing = pgTable("prescription_dispensing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dispensingNumber: text("dispensing_number").notNull().unique(), // DISP-2025-001
  prescriptionId: varchar("prescription_id").notNull(),
  prescriptionNumber: text("prescription_number"),
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  patientPhone: text("patient_phone"),
  storeId: varchar("store_id").notNull(),
  storeName: text("store_name").notNull(),
  dispensedBy: varchar("dispensed_by").notNull(),
  dispensedByName: text("dispensed_by_name").notNull(),
  dispensingStatus: text("dispensing_status").notNull().default("PENDING"), // PENDING, PARTIALLY_DISPENSED, FULLY_DISPENSED, CANCELLED
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  gstAmount: decimal("gst_amount", { precision: 10, scale: 2 }).default("0"),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentStatus: text("payment_status").notNull().default("PENDING"), // PENDING, PAID, PARTIAL, INSURANCE
  paymentMethod: text("payment_method"), // CASH, CARD, UPI, INSURANCE
  dispensedAt: timestamp("dispensed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPrescriptionDispensingSchema = createInsertSchema(prescriptionDispensing).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPrescriptionDispensing = z.infer<typeof insertPrescriptionDispensingSchema>;
export type PrescriptionDispensing = typeof prescriptionDispensing.$inferSelect;

// Dispensing Items - individual medicine items in a dispensing record
export const dispensingItems = pgTable("dispensing_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dispensingId: varchar("dispensing_id").notNull(),
  medicineName: text("medicine_name").notNull(),
  genericName: text("generic_name"),
  strength: text("strength"),
  dosageForm: text("dosage_form"),
  prescribedQuantity: integer("prescribed_quantity").notNull(),
  dispensedQuantity: integer("dispensed_quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  batchNumber: text("batch_number"),
  expiryDate: text("expiry_date"),
  isSubstitute: boolean("is_substitute").default(false),
  originalMedicine: text("original_medicine"), // If substitute, what was prescribed
  substitutionApprovedBy: varchar("substitution_approved_by"),
  status: text("status").notNull().default("DISPENSED"), // DISPENSED, UNAVAILABLE, PARTIAL
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDispensingItemSchema = createInsertSchema(dispensingItems).omit({
  id: true,
  createdAt: true,
});
export type InsertDispensingItem = z.infer<typeof insertDispensingItemSchema>;
export type DispensingItem = typeof dispensingItems.$inferSelect;

// Medical Store Access Logs - audit trail for prescription access
export const medicalStoreAccessLogs = pgTable("medical_store_access_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").notNull(),
  storeName: text("store_name").notNull(),
  userId: varchar("user_id").notNull(),
  userName: text("user_name").notNull(),
  action: text("action").notNull(), // LOGIN, LOGOUT, PRESCRIPTION_VIEW, PRESCRIPTION_DISPENSE, BILL_GENERATE
  prescriptionId: varchar("prescription_id"),
  prescriptionNumber: text("prescription_number"),
  patientId: varchar("patient_id"),
  patientName: text("patient_name"),
  details: text("details"),
  ipAddress: text("ip_address"),
  deviceInfo: text("device_info"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertMedicalStoreAccessLogSchema = createInsertSchema(medicalStoreAccessLogs).omit({
  id: true,
  timestamp: true,
});
export type InsertMedicalStoreAccessLog = z.infer<typeof insertMedicalStoreAccessLogSchema>;
export type MedicalStoreAccessLog = typeof medicalStoreAccessLogs.$inferSelect;

// Medical Store Billing - generated invoices
export const medicalStoreBills = pgTable("medical_store_bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billNumber: text("bill_number").notNull().unique(), // INV-2025-001
  dispensingId: varchar("dispensing_id").notNull(),
  storeId: varchar("store_id").notNull(),
  storeName: text("store_name").notNull(),
  storeAddress: text("store_address"),
  storeGst: text("store_gst"),
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  patientPhone: text("patient_phone"),
  patientAddress: text("patient_address"),
  doctorName: text("doctor_name"),
  prescriptionNumber: text("prescription_number"),
  itemsJson: text("items_json").notNull(), // JSON array of items
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  gstAmount: decimal("gst_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: text("payment_status").notNull().default("PENDING"), // PENDING, PAID, PARTIAL
  paymentMethod: text("payment_method"),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
  balanceAmount: decimal("balance_amount", { precision: 10, scale: 2 }).default("0"),
  billedBy: varchar("billed_by").notNull(),
  billedByName: text("billed_by_name").notNull(),
  billedAt: timestamp("billed_at").defaultNow(),
  isPrinted: boolean("is_printed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMedicalStoreBillSchema = createInsertSchema(medicalStoreBills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMedicalStoreBill = z.infer<typeof insertMedicalStoreBillSchema>;
export type MedicalStoreBill = typeof medicalStoreBills.$inferSelect;

// ==================== PATHOLOGY LAB MODULE ====================

// Pathology Lab Types Enum
export const labTypeEnum = pgEnum("lab_type", ["IN_HOUSE", "THIRD_PARTY"]);
export const sampleStatusEnum = pgEnum("sample_status", ["COLLECTED", "IN_TRANSIT", "RECEIVED", "REJECTED", "PROCESSED"]);
export const reportStatusEnum = pgEnum("report_status", ["PENDING", "IN_PROGRESS", "COMPLETED", "VERIFIED"]);

// Pathology Labs - registered labs (in-house and third-party)
export const pathologyLabs = pgTable("pathology_labs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  labName: text("lab_name").notNull(),
  labCode: text("lab_code").notNull().unique(),
  labType: text("lab_type").notNull().default("IN_HOUSE"), // IN_HOUSE, THIRD_PARTY
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  licenseNumber: text("license_number"),
  accreditation: text("accreditation"), // NABL, CAP, etc.
  operatingHours: text("operating_hours"),
  contactPerson: text("contact_person"),
  isActive: boolean("is_active").default(true),
  canAccessFullRecords: boolean("can_access_full_records").default(false), // Only in-house labs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPathologyLabSchema = createInsertSchema(pathologyLabs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPathologyLab = z.infer<typeof insertPathologyLabSchema>;
export type PathologyLab = typeof pathologyLabs.$inferSelect;

// Lab Test Catalog - master list of all available tests
export const labTestCatalog = pgTable("lab_test_catalog", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testCode: text("test_code").notNull().unique(),
  testName: text("test_name").notNull(),
  testCategory: text("test_category").notNull(), // Blood, Urine, Imaging, Biopsy, etc.
  sampleType: text("sample_type").notNull(), // Blood, Serum, Urine, Stool, etc.
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  turnaroundTime: text("turnaround_time"), // e.g., "24 hours", "2-3 days"
  normalRange: text("normal_range"), // Reference range as text/JSON
  instructions: text("instructions"), // Patient preparation instructions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLabTestCatalogSchema = createInsertSchema(labTestCatalog).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLabTestCatalog = z.infer<typeof insertLabTestCatalogSchema>;
export type LabTestCatalog = typeof labTestCatalog.$inferSelect;

// Lab Test Orders - orders placed by doctors
export const labTestOrders = pgTable("lab_test_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(), // LAB-2025-001
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  patientUhid: text("patient_uhid"), // Unique Hospital ID
  patientAge: text("patient_age"),
  patientGender: text("patient_gender"),
  doctorId: varchar("doctor_id").notNull(),
  doctorName: text("doctor_name").notNull(),
  testId: varchar("test_id").notNull(),
  testName: text("test_name").notNull(),
  testCode: text("test_code"),
  assignedLabId: varchar("assigned_lab_id"),
  assignedLabName: text("assigned_lab_name"),
  priority: text("priority").default("NORMAL"), // NORMAL, URGENT, CRITICAL
  clinicalNotes: text("clinical_notes"),
  suggestedTest: text("suggested_test"),
  orderStatus: text("order_status").default("PENDING"), // PENDING, ASSIGNED, SAMPLE_COLLECTED, IN_PROGRESS, COMPLETED
  orderedAt: timestamp("ordered_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLabTestOrderSchema = createInsertSchema(labTestOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLabTestOrder = z.infer<typeof insertLabTestOrderSchema>;
export type LabTestOrder = typeof labTestOrders.$inferSelect;

// Sample Collection Tracking
export const sampleCollections = pgTable("sample_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  orderNumber: text("order_number").notNull(),
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  testName: text("test_name").notNull(),
  sampleType: text("sample_type").notNull(),
  collectorName: text("collector_name").notNull(),
  collectorId: varchar("collector_id"),
  collectionLocation: text("collection_location"), // Ward, OPD, Home
  collectionDate: timestamp("collection_date").defaultNow(),
  sampleStatus: text("sample_status").default("COLLECTED"), // COLLECTED, IN_TRANSIT, RECEIVED, REJECTED, PROCESSED
  rejectionReason: text("rejection_reason"),
  receivedAt: timestamp("received_at"),
  receivedBy: text("received_by"),
  processedAt: timestamp("processed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSampleCollectionSchema = createInsertSchema(sampleCollections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSampleCollection = z.infer<typeof insertSampleCollectionSchema>;
export type SampleCollection = typeof sampleCollections.$inferSelect;

// Lab Reports - uploaded reports (supports both order-linked and direct uploads)
export const labReports = pgTable("lab_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportNumber: text("report_number").notNull().unique(), // RPT-2025-001
  orderId: varchar("order_id"), // Optional for direct uploads
  orderNumber: text("order_number").notNull(),
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  patientUhid: text("patient_uhid"),
  doctorId: varchar("doctor_id"), // Optional for direct uploads
  doctorName: text("doctor_name"),
  labId: varchar("lab_id").notNull(),
  labName: text("lab_name").notNull(),
  testId: varchar("test_id"), // Optional for direct uploads
  testName: text("test_name").notNull(),
  testCategory: text("test_category"),
  reportDate: timestamp("report_date").defaultNow(),
  reportStatus: text("report_status").default("PENDING"), // PENDING, IN_PROGRESS, COMPLETED, VERIFIED
  reportType: text("report_type").default("STRUCTURED"), // PDF, STRUCTURED
  pdfUrl: text("pdf_url"), // URL to uploaded PDF
  resultData: text("result_data"), // JSON with structured test results
  interpretation: text("interpretation"), // Normal, Abnormal, Critical
  remarks: text("remarks"),
  verifiedBy: text("verified_by"),
  verifiedAt: timestamp("verified_at"),
  isNotified: boolean("is_notified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLabReportSchema = createInsertSchema(labReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLabReport = z.infer<typeof insertLabReportSchema>;
export type LabReport = typeof labReports.$inferSelect;

// Lab Report Results - individual test parameters within a report
export const labReportResults = pgTable("lab_report_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").notNull(),
  parameterName: text("parameter_name").notNull(),
  value: text("value").notNull(),
  unit: text("unit"),
  normalRange: text("normal_range"),
  flag: text("flag"), // NORMAL, LOW, HIGH, CRITICAL
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLabReportResultSchema = createInsertSchema(labReportResults).omit({
  id: true,
  createdAt: true,
});
export type InsertLabReportResult = z.infer<typeof insertLabReportResultSchema>;
export type LabReportResult = typeof labReportResults.$inferSelect;

// Pathology Lab Access Logs - audit trail
export const pathologyLabAccessLogs = pgTable("pathology_lab_access_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  labId: varchar("lab_id").notNull(),
  labName: text("lab_name").notNull(),
  userId: varchar("user_id").notNull(),
  userName: text("user_name").notNull(),
  userRole: text("user_role").notNull(),
  action: text("action").notNull(), // LOGIN, LOGOUT, REPORT_VIEW, REPORT_UPLOAD, SAMPLE_UPDATE
  reportId: varchar("report_id"),
  patientId: varchar("patient_id"),
  patientName: text("patient_name"),
  details: text("details"),
  ipAddress: text("ip_address"),
  deviceInfo: text("device_info"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertPathologyLabAccessLogSchema = createInsertSchema(pathologyLabAccessLogs).omit({
  id: true,
  timestamp: true,
});
export type InsertPathologyLabAccessLog = z.infer<typeof insertPathologyLabAccessLogSchema>;
export type PathologyLabAccessLog = typeof pathologyLabAccessLogs.$inferSelect;

// Patient Barcodes - UHID-based secure barcode system for patient identification
export const patientBarcodes = pgTable("patient_barcodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  uhid: text("uhid").notNull().unique(),
  admissionType: text("admission_type").notNull(), // OPD, IPD
  encryptedToken: text("encrypted_token").notNull(),
  barcodeData: text("barcode_data").notNull(), // The actual barcode string
  wardBed: text("ward_bed"),
  treatingDoctor: text("treating_doctor"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const insertPatientBarcodeSchema = createInsertSchema(patientBarcodes).omit({
  id: true,
  createdAt: true,
});
export type InsertPatientBarcode = z.infer<typeof insertPatientBarcodeSchema>;
export type PatientBarcode = typeof patientBarcodes.$inferSelect;

// Barcode Scan Logs - Audit trail for all scan attempts (NABH compliance)
export const barcodeScanLogs = pgTable("barcode_scan_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  barcodeId: varchar("barcode_id"),
  uhid: text("uhid"),
  scannedBy: varchar("scanned_by").notNull(),
  scannedByName: text("scanned_by_name").notNull(),
  role: text("role").notNull(),
  allowed: boolean("allowed").notNull(),
  denialReason: text("denial_reason"),
  ipAddress: text("ip_address"),
  deviceInfo: text("device_info"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertBarcodeScanLogSchema = createInsertSchema(barcodeScanLogs).omit({
  id: true,
  timestamp: true,
});
export type InsertBarcodeScanLog = z.infer<typeof insertBarcodeScanLogSchema>;
export type BarcodeScanLog = typeof barcodeScanLogs.$inferSelect;

// ========== STAFF MANAGEMENT MODULE TABLES ==========

// Staff Master Profile - Enhanced staff profile linked to users
export const staffMaster = pgTable("staff_master", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // Links to users table (optional - can be linked later)
  employeeCode: text("employee_code").notNull().unique(), // Hospital-generated code
  fullName: text("full_name").notNull(),
  role: text("role").notNull(), // DOCTOR, NURSE, TECHNICIAN, PHARMACIST, ADMIN, OPD_MANAGER, etc.
  department: text("department"),
  designation: text("designation"),
  qualifications: text("qualifications"),
  email: text("email"),
  phone: text("phone"),
  joiningDate: text("joining_date"),
  employmentType: text("employment_type").default("FULL_TIME"), // FULL_TIME, PART_TIME, CONTRACT
  shiftType: text("shift_type").default("FIXED"), // FIXED, ROTATIONAL
  reportingManagerId: varchar("reporting_manager_id"), // Reference to another staff_master
  status: text("status").default("ACTIVE"), // ACTIVE, ON_LEAVE, SUSPENDED, RESIGNED
  photoUrl: text("photo_url"),
  emergencyContact: text("emergency_contact"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStaffMasterSchema = createInsertSchema(staffMaster).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertStaffMaster = z.infer<typeof insertStaffMasterSchema>;
export type StaffMaster = typeof staffMaster.$inferSelect;

// Shift Roster - Staff shift scheduling
export const shiftRoster = pgTable("shift_roster", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull(), // Reference to staff_master
  department: text("department"),
  shiftDate: text("shift_date").notNull(), // YYYY-MM-DD format
  shiftType: text("shift_type").notNull(), // MORNING, EVENING, NIGHT, ON_CALL
  startTime: text("start_time").notNull(), // HH:mm format
  endTime: text("end_time").notNull(), // HH:mm format
  status: text("status").default("SCHEDULED"), // SCHEDULED, COMPLETED, MISSED, CANCELLED
  assignedBy: varchar("assigned_by"), // User who assigned the shift
  overrideReason: text("override_reason"), // For emergency overrides
  notes: text("notes"),
  linkedAppointmentId: varchar("linked_appointment_id"), // Link to doctor appointment slots
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertShiftRosterSchema = createInsertSchema(shiftRoster).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertShiftRoster = z.infer<typeof insertShiftRosterSchema>;
export type ShiftRoster = typeof shiftRoster.$inferSelect;

// Task Logs - Staff duty/task logging
export const taskLogs = pgTable("task_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull(), // Reference to staff_master
  assignedBy: varchar("assigned_by"), // User who assigned the task
  department: text("department"),
  taskType: text("task_type").notNull(), // CLINICAL, ADMIN, EMERGENCY, ROUTINE, OTHER
  taskTitle: text("task_title").notNull(),
  taskDescription: text("task_description"),
  patientId: varchar("patient_id"), // Optional patient link
  patientName: text("patient_name"),
  shiftId: varchar("shift_id"), // Link to shift_roster
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  status: text("status").default("PENDING"), // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
  priority: text("priority").default("NORMAL"), // LOW, NORMAL, HIGH, URGENT
  completionNotes: text("completion_notes"),
  proofFileUrl: text("proof_file_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTaskLogSchema = createInsertSchema(taskLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTaskLog = z.infer<typeof insertTaskLogSchema>;
export type TaskLog = typeof taskLogs.$inferSelect;

// Attendance Logs - Staff attendance tracking
export const attendanceLogs = pgTable("attendance_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull(), // Reference to staff_master
  date: text("date").notNull(), // YYYY-MM-DD format
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  checkInMethod: text("check_in_method"), // BIOMETRIC, MANUAL, SYSTEM
  checkOutMethod: text("check_out_method"),
  status: text("status").default("PRESENT"), // PRESENT, ABSENT, HALF_DAY, LATE, ON_LEAVE
  shiftId: varchar("shift_id"), // Link to shift_roster
  workHours: text("work_hours"), // Calculated work hours
  isOvertime: boolean("is_overtime").default(false),
  overtimeHours: text("overtime_hours"),
  remarks: text("remarks"),
  approvedBy: varchar("approved_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAttendanceLogSchema = createInsertSchema(attendanceLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAttendanceLog = z.infer<typeof insertAttendanceLogSchema>;
export type AttendanceLog = typeof attendanceLogs.$inferSelect;

// Leave Requests - Staff leave management
export const leaveRequests = pgTable("leave_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull(), // Reference to staff_master
  leaveType: text("leave_type").notNull(), // CASUAL, SICK, EARNED, MATERNITY, PATERNITY, EMERGENCY, UNPAID
  startDate: text("start_date").notNull(), // YYYY-MM-DD format
  endDate: text("end_date").notNull(), // YYYY-MM-DD format
  totalDays: integer("total_days").notNull(),
  reason: text("reason").notNull(),
  status: text("status").default("PENDING"), // PENDING, DEPT_APPROVED, HR_APPROVED, APPROVED, REJECTED, CANCELLED
  deptApprovedBy: varchar("dept_approved_by"), // Department head approval
  deptApprovedAt: timestamp("dept_approved_at"),
  hrApprovedBy: varchar("hr_approved_by"), // HR final approval
  hrApprovedAt: timestamp("hr_approved_at"),
  rejectedBy: varchar("rejected_by"),
  rejectionReason: text("rejection_reason"),
  emergencyContact: text("emergency_contact"),
  attachmentUrl: text("attachment_url"), // Medical certificate, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type LeaveRequest = typeof leaveRequests.$inferSelect;

// Overtime Logs - Staff overtime tracking
export const overtimeLogs = pgTable("overtime_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull(), // Reference to staff_master
  date: text("date").notNull(), // YYYY-MM-DD format
  shiftId: varchar("shift_id"), // Link to shift_roster
  attendanceId: varchar("attendance_id"), // Link to attendance_logs
  scheduledEndTime: text("scheduled_end_time"),
  actualEndTime: text("actual_end_time"),
  overtimeHours: text("overtime_hours").notNull(),
  reason: text("reason"),
  status: text("status").default("PENDING"), // PENDING, APPROVED, REJECTED
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  payRate: text("pay_rate"), // Overtime pay rate multiplier
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOvertimeLogSchema = createInsertSchema(overtimeLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOvertimeLog = z.infer<typeof insertOvertimeLogSchema>;
export type OvertimeLog = typeof overtimeLogs.$inferSelect;

// Staff Performance Metrics - Performance tracking and scoring
export const staffPerformanceMetrics = pgTable("staff_performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull(), // Reference to staff_master
  periodType: text("period_type").notNull(), // WEEKLY, MONTHLY, QUARTERLY
  periodStart: text("period_start").notNull(), // YYYY-MM-DD format
  periodEnd: text("period_end").notNull(), // YYYY-MM-DD format
  attendancePercentage: text("attendance_percentage"), // 0-100
  taskCompletionRate: text("task_completion_rate"), // 0-100
  patientFeedbackScore: text("patient_feedback_score"), // 0-5
  overtimeHours: text("overtime_hours"),
  shiftMissCount: integer("shift_miss_count").default(0),
  lateCount: integer("late_count").default(0),
  leavesTaken: integer("leaves_taken").default(0),
  responseTimeAvg: text("response_time_avg"), // In minutes
  performanceScore: text("performance_score"), // Calculated weighted score
  aiNotes: text("ai_notes"), // AI-generated performance insights
  evaluatedBy: varchar("evaluated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStaffPerformanceMetricSchema = createInsertSchema(staffPerformanceMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertStaffPerformanceMetric = z.infer<typeof insertStaffPerformanceMetricSchema>;
export type StaffPerformanceMetric = typeof staffPerformanceMetrics.$inferSelect;

// Staff Roster Audit Logs - Audit trail for shift changes
export const rosterAuditLogs = pgTable("roster_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rosterId: varchar("roster_id").notNull(), // Reference to shift_roster
  action: text("action").notNull(), // CREATED, UPDATED, DELETED, OVERRIDE
  changedBy: varchar("changed_by").notNull(),
  changedByName: text("changed_by_name"),
  previousValue: text("previous_value"), // JSON of previous state
  newValue: text("new_value"), // JSON of new state
  reason: text("reason"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertRosterAuditLogSchema = createInsertSchema(rosterAuditLogs).omit({
  id: true,
  timestamp: true,
});
export type InsertRosterAuditLog = z.infer<typeof insertRosterAuditLogSchema>;
export type RosterAuditLog = typeof rosterAuditLogs.$inferSelect;

// ==================== INSURANCE MANAGEMENT MODULE ====================

// Insurance Providers Master - Admin managed
export const insuranceProviders = pgTable("insurance_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerName: text("provider_name").notNull(),
  providerType: text("provider_type").notNull(), // Cashless / Reimbursement / Both
  tpaName: text("tpa_name"),
  tpaContactPerson: text("tpa_contact_person"),
  tpaPhone: text("tpa_phone"),
  tpaEmail: text("tpa_email"),
  networkHospitals: boolean("network_hospitals").default(true),
  coverageType: text("coverage_type").notNull(), // IPD / OPD / Day Care / All
  roomRentLimit: text("room_rent_limit"),
  icuLimit: text("icu_limit"),
  coPayPercentage: text("co_pay_percentage"),
  exclusions: text("exclusions"),
  preAuthRequired: boolean("pre_auth_required").default(true),
  claimSubmissionMode: text("claim_submission_mode").default("Both"), // Online / Physical / Both
  averageClaimTatDays: integer("average_claim_tat_days"),
  documentsRequired: text("documents_required"), // JSON array of required documents
  activeStatus: boolean("active_status").default(true),
  createdByAdminId: varchar("created_by_admin_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInsuranceProviderSchema = createInsertSchema(insuranceProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertInsuranceProvider = z.infer<typeof insertInsuranceProviderSchema>;
export type InsuranceProvider = typeof insuranceProviders.$inferSelect;

// Patient Insurance - Insurance details for each patient
export const patientInsurance = pgTable("patient_insurance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(),
  insuranceProviderId: varchar("insurance_provider_id").notNull(),
  policyNumber: text("policy_number").notNull(),
  policyHolderName: text("policy_holder_name").notNull(),
  relationshipWithPatient: text("relationship_with_patient").default("Self"),
  policyStartDate: text("policy_start_date"),
  policyEndDate: text("policy_end_date"),
  sumInsured: text("sum_insured"),
  balanceSumInsured: text("balance_sum_insured"),
  tpaReferenceNumber: text("tpa_reference_number"),
  cashlessEligible: boolean("cashless_eligible").default(false),
  policyCopyUrl: text("policy_copy_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPatientInsuranceSchema = createInsertSchema(patientInsurance).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPatientInsurance = z.infer<typeof insertPatientInsuranceSchema>;
export type PatientInsurance = typeof patientInsurance.$inferSelect;

// Insurance Claims - Claim tracking and workflow
export const insuranceClaims = pgTable("insurance_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimNumber: text("claim_number").notNull().unique(),
  patientInsuranceId: varchar("patient_insurance_id").notNull(),
  patientId: varchar("patient_id").notNull(),
  admissionId: varchar("admission_id"), // Link to patient admission if IPD
  appointmentId: varchar("appointment_id"), // Link to appointment if OPD
  claimType: text("claim_type").notNull(), // Pre-Auth / Final Claim / Reimbursement
  status: text("status").default("DRAFT"), // DRAFT, SUBMITTED, UNDER_REVIEW, QUERY_RAISED, APPROVED, PARTIALLY_APPROVED, REJECTED, SETTLED
  diagnosis: text("diagnosis"),
  icdCodes: text("icd_codes"), // JSON array of ICD codes
  plannedProcedure: text("planned_procedure"),
  estimatedCost: text("estimated_cost"),
  approvedAmount: text("approved_amount"),
  settledAmount: text("settled_amount"),
  coPayAmount: text("co_pay_amount"),
  rejectionReason: text("rejection_reason"),
  rejectionNotes: text("rejection_notes"),
  queryDetails: text("query_details"),
  queryResponseDeadline: text("query_response_deadline"),
  preAuthNumber: text("pre_auth_number"),
  preAuthApprovedDate: text("pre_auth_approved_date"),
  preAuthExpiryDate: text("pre_auth_expiry_date"),
  doctorSignatureUrl: text("doctor_signature_url"),
  submittedBy: varchar("submitted_by"),
  submittedAt: timestamp("submitted_at"),
  processedBy: varchar("processed_by"),
  processedAt: timestamp("processed_at"),
  settledAt: timestamp("settled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInsuranceClaimSchema = createInsertSchema(insuranceClaims).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertInsuranceClaim = z.infer<typeof insertInsuranceClaimSchema>;
export type InsuranceClaim = typeof insuranceClaims.$inferSelect;

// Insurance Claim Documents - Document attachments
export const insuranceClaimDocuments = pgTable("insurance_claim_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull(),
  documentType: text("document_type").notNull(), // Policy Copy, ID Proof, Doctor Notes, Bills, Discharge Summary, Claim Form, Investigation Report, OT Notes, etc.
  documentName: text("document_name").notNull(),
  documentUrl: text("document_url").notNull(),
  fileSize: text("file_size"),
  mimeType: text("mime_type"),
  uploadedBy: varchar("uploaded_by"),
  uploadedByRole: text("uploaded_by_role"),
  verified: boolean("verified").default(false),
  verifiedBy: varchar("verified_by"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInsuranceClaimDocumentSchema = createInsertSchema(insuranceClaimDocuments).omit({
  id: true,
  createdAt: true,
});
export type InsertInsuranceClaimDocument = z.infer<typeof insertInsuranceClaimDocumentSchema>;
export type InsuranceClaimDocument = typeof insuranceClaimDocuments.$inferSelect;

// Insurance Claim Logs - Audit trail
export const insuranceClaimLogs = pgTable("insurance_claim_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull(),
  actionType: text("action_type").notNull(), // CREATED, STATUS_CHANGED, DOCUMENT_UPLOADED, QUERY_RAISED, QUERY_RESPONDED, APPROVED, REJECTED, SETTLED
  performedByRole: text("performed_by_role"),
  performedById: varchar("performed_by_id"),
  performedByName: text("performed_by_name"),
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  remarks: text("remarks"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertInsuranceClaimLogSchema = createInsertSchema(insuranceClaimLogs).omit({
  id: true,
  timestamp: true,
});
export type InsertInsuranceClaimLog = z.infer<typeof insertInsuranceClaimLogSchema>;
export type InsuranceClaimLog = typeof insuranceClaimLogs.$inferSelect;

// Insurance Provider Checklists - Custom document checklists per provider
export const insuranceProviderChecklists = pgTable("insurance_provider_checklists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull(),
  claimType: text("claim_type").notNull(), // Pre-Auth / Final Claim / Reimbursement
  documentType: text("document_type").notNull(),
  isRequired: boolean("is_required").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInsuranceProviderChecklistSchema = createInsertSchema(insuranceProviderChecklists).omit({
  id: true,
  createdAt: true,
});
export type InsertInsuranceProviderChecklist = z.infer<typeof insertInsuranceProviderChecklistSchema>;
export type InsuranceProviderChecklist = typeof insuranceProviderChecklists.$inferSelect;

// ===== FACE RECOGNITION & IDENTITY VERIFICATION SYSTEM =====

// Face Embeddings - Stores encrypted face biometric data
export const faceEmbeddings = pgTable("face_embeddings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // patient_id or staff_id
  userType: text("user_type").notNull(), // PATIENT, STAFF, DOCTOR, NURSE
  embeddingVector: text("embedding_vector").notNull(), // Encrypted 128D/512D embedding (JSON array)
  embeddingModelVersion: text("embedding_model_version").default("face-api-0.22.2"),
  faceQualityScore: decimal("face_quality_score"), // 0-1 quality score
  captureDeviceId: text("capture_device_id"),
  captureLocation: text("capture_location"), // OPD, Registration, Gate, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFaceEmbeddingSchema = createInsertSchema(faceEmbeddings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertFaceEmbedding = z.infer<typeof insertFaceEmbeddingSchema>;
export type FaceEmbedding = typeof faceEmbeddings.$inferSelect;

// Biometric Consent - Tracks user consent for face recognition
export const biometricConsent = pgTable("biometric_consent", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  userType: text("user_type").notNull(), // PATIENT, STAFF
  biometricType: text("biometric_type").default("FACE"), // FACE, FINGERPRINT
  consentStatus: boolean("consent_status").default(false),
  consentGivenAt: timestamp("consent_given_at"),
  consentGivenBy: varchar("consent_given_by"), // Who witnessed/recorded consent
  revokedAt: timestamp("revoked_at"),
  revokedBy: varchar("revoked_by"),
  revokedReason: text("revoked_reason"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBiometricConsentSchema = createInsertSchema(biometricConsent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBiometricConsent = z.infer<typeof insertBiometricConsentSchema>;
export type BiometricConsent = typeof biometricConsent.$inferSelect;

// Face Recognition Logs - Audit trail for all recognition attempts
export const faceRecognitionLogs = pgTable("face_recognition_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userType: text("user_type").notNull(), // PATIENT, STAFF
  matchedUserId: varchar("matched_user_id"), // NULL if no match
  confidenceScore: decimal("confidence_score").notNull(), // 0-1 similarity score
  thresholdUsed: decimal("threshold_used").default("0.78"),
  matchStatus: text("match_status").notNull(), // SUCCESS, FAILURE, MULTIPLE_MATCHES, LOW_QUALITY
  location: text("location"), // OPD, IPD, Gate, Lab, Pharmacy, etc.
  purpose: text("purpose"), // CHECK_IN, ATTENDANCE, VERIFICATION, DUPLICATE_CHECK
  deviceId: text("device_id"),
  inputImageQuality: decimal("input_image_quality"),
  processingTimeMs: integer("processing_time_ms"),
  performedBy: varchar("performed_by"), // Staff who initiated the scan
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFaceRecognitionLogSchema = createInsertSchema(faceRecognitionLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertFaceRecognitionLog = z.infer<typeof insertFaceRecognitionLogSchema>;
export type FaceRecognitionLog = typeof faceRecognitionLogs.$inferSelect;

// Face Attendance - Staff attendance via face scan
export const faceAttendance = pgTable("face_attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull(),
  punchType: text("punch_type").notNull(), // IN, OUT
  confidenceScore: decimal("confidence_score").notNull(),
  deviceId: text("device_id"),
  location: text("location"), // Main Gate, OPD Entrance, etc.
  recognitionLogId: varchar("recognition_log_id"), // Link to recognition log
  shiftId: varchar("shift_id"), // Link to staff shift
  isLateEntry: boolean("is_late_entry").default(false),
  isEarlyExit: boolean("is_early_exit").default(false),
  lateByMinutes: integer("late_by_minutes"),
  overtimeMinutes: integer("overtime_minutes"),
  notes: text("notes"),
  verifiedManually: boolean("verified_manually").default(false),
  verifiedBy: varchar("verified_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFaceAttendanceSchema = createInsertSchema(faceAttendance).omit({
  id: true,
  createdAt: true,
});
export type InsertFaceAttendance = z.infer<typeof insertFaceAttendanceSchema>;
export type FaceAttendance = typeof faceAttendance.$inferSelect;

// Face Recognition Settings - System configuration
export const faceRecognitionSettings = pgTable("face_recognition_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value").notNull(),
  description: text("description"),
  updatedBy: varchar("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFaceRecognitionSettingSchema = createInsertSchema(faceRecognitionSettings).omit({
  id: true,
  updatedAt: true,
});
export type InsertFaceRecognitionSetting = z.infer<typeof insertFaceRecognitionSettingSchema>;
export type FaceRecognitionSetting = typeof faceRecognitionSettings.$inferSelect;

// Duplicate Patient Alerts - Tracks potential duplicate patient detections
export const duplicatePatientAlerts = pgTable("duplicate_patient_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  newPatientId: varchar("new_patient_id").notNull(), // The newly registering patient
  existingPatientId: varchar("existing_patient_id").notNull(), // Potential duplicate
  confidenceScore: decimal("confidence_score").notNull(),
  alertStatus: text("alert_status").default("PENDING"), // PENDING, CONFIRMED_DUPLICATE, FALSE_POSITIVE, MERGED
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  mergedToPatientId: varchar("merged_to_patient_id"), // If merged, which patient ID was kept
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDuplicatePatientAlertSchema = createInsertSchema(duplicatePatientAlerts).omit({
  id: true,
  createdAt: true,
});
export type InsertDuplicatePatientAlert = z.infer<typeof insertDuplicatePatientAlertSchema>;
export type DuplicatePatientAlert = typeof duplicatePatientAlerts.$inferSelect;

// ========== REFERRAL MANAGEMENT SYSTEM ==========

// Referral Sources - External hospitals/clinics that refer patients
export const referralSources = pgTable("referral_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(), // Multi-tenant support
  sourceName: text("source_name").notNull(), // Hospital/Clinic name
  sourceType: text("source_type").notNull(), // HOSPITAL, CLINIC, DOCTOR, DIAGNOSTIC_CENTER, OTHER
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  specializations: text("specializations"), // Comma-separated specializations
  isActive: boolean("is_active").default(true),
  agreementDetails: text("agreement_details"), // Any referral agreement/commission details
  notes: text("notes"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertReferralSourceSchema = createInsertSchema(referralSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertReferralSource = z.infer<typeof insertReferralSourceSchema>;
export type ReferralSource = typeof referralSources.$inferSelect;

// Patient Referrals - Tracks patient referrals (both incoming and outgoing)
export const patientReferrals = pgTable("patient_referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(), // Multi-tenant support
  referralType: text("referral_type").notNull(), // REFER_TO, REFER_FROM
  patientId: varchar("patient_id"), // Link to patient if registered
  patientName: text("patient_name").notNull(),
  patientAge: integer("patient_age"),
  patientGender: text("patient_gender"),
  patientPhone: text("patient_phone"),
  
  // For REFER_FROM (incoming referrals)
  referredFromSourceId: varchar("referred_from_source_id"), // Link to referral_sources
  referredFromName: text("referred_from_name"), // Name if not in referral_sources
  referredFromDoctor: text("referred_from_doctor"),
  
  // For REFER_TO (outgoing referrals)
  referredToSourceId: varchar("referred_to_source_id"), // Link to referral_sources
  referredToName: text("referred_to_name"), // Name if not in referral_sources
  referredToDoctor: text("referred_to_doctor"),
  referredToDepartment: text("referred_to_department"),
  
  // Common fields
  referralDate: timestamp("referral_date").defaultNow(),
  appointmentDate: timestamp("appointment_date"), // Scheduled appointment date at referred facility
  diagnosis: text("diagnosis"),
  reasonForReferral: text("reason_for_referral").notNull(),
  clinicalHistory: text("clinical_history"),
  urgency: text("urgency").default("ROUTINE"), // EMERGENCY, URGENT, ROUTINE
  specialInstructions: text("special_instructions"),
  attachments: text("attachments"), // JSON array of file paths
  
  // Follow-up tracking
  status: text("status").default("PENDING"), // PENDING, ACCEPTED, REJECTED, COMPLETED, CANCELLED
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  followUpNotes: text("follow_up_notes"),
  
  // Outcome tracking (for outgoing referrals)
  outcomeReceived: boolean("outcome_received").default(false),
  outcomeDate: timestamp("outcome_date"),
  outcomeSummary: text("outcome_summary"),
  
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPatientReferralSchema = createInsertSchema(patientReferrals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPatientReferral = z.infer<typeof insertPatientReferralSchema>;
export type PatientReferral = typeof patientReferrals.$inferSelect;

// Hospital Service Departments - Categories of hospital services
export const hospitalServiceDepartments = pgTable("hospital_service_departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  iconKey: text("icon_key").default("Stethoscope"),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertHospitalServiceDepartmentSchema = createInsertSchema(hospitalServiceDepartments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertHospitalServiceDepartment = z.infer<typeof insertHospitalServiceDepartmentSchema>;
export type HospitalServiceDepartment = typeof hospitalServiceDepartments.$inferSelect;

// Hospital Services - Individual services offered by each department
export const hospitalServices = pgTable("hospital_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  departmentId: varchar("department_id").notNull(),
  name: text("name").notNull(),
  code: text("code"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertHospitalServiceSchema = createInsertSchema(hospitalServices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertHospitalService = z.infer<typeof insertHospitalServiceSchema>;
export type HospitalService = typeof hospitalServices.$inferSelect;

// ==========================================
// OPD Prescription Templates - Quick OPD Templates for auto-fill
// ==========================================

export const opdPrescriptionTemplates = pgTable("opd_prescription_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Template identification
  name: text("name").notNull(), // e.g., "Common Cold / Rhinitis"
  slug: text("slug").notNull().unique(), // URL-friendly identifier
  description: text("description"),
  category: text("category").default("General"), // Category for grouping templates
  
  // Template content (stored as JSON)
  symptoms: text("symptoms"), // JSON array of symptoms with multi-select options
  medicines: text("medicines"), // JSON array of medicine objects
  instructions: text("instructions"), // JSON object with general, diet, activity
  suggestedTests: text("suggested_tests"), // JSON array of test names with conditions
  followUpDays: integer("follow_up_days"), // Number of days for follow-up
  followUpNotes: text("follow_up_notes"),
  dietAdvice: text("diet_advice"),
  activityAdvice: text("activity_advice"),
  
  // Version control
  version: integer("version").default(1),
  parentTemplateId: varchar("parent_template_id"), // For tracking template lineage
  
  // Access control
  isSystemTemplate: boolean("is_system_template").default(false), // System templates cannot be deleted
  isPublic: boolean("is_public").default(true), // Public templates visible to all doctors
  createdBy: varchar("created_by"), // Doctor who created the template
  createdByName: text("created_by_name"),
  
  // Metadata
  usageCount: integer("usage_count").default(0), // Track how often template is used
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOpdPrescriptionTemplateSchema = createInsertSchema(opdPrescriptionTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOpdPrescriptionTemplate = z.infer<typeof insertOpdPrescriptionTemplateSchema>;
export type OpdPrescriptionTemplate = typeof opdPrescriptionTemplates.$inferSelect;

// Template Version History - For version control and rollback
export const opdTemplateVersions = pgTable("opd_template_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull(),
  version: integer("version").notNull(),
  
  // Snapshot of template content at this version
  name: text("name").notNull(),
  symptoms: text("symptoms"),
  medicines: text("medicines"),
  instructions: text("instructions"),
  suggestedTests: text("suggested_tests"),
  followUpDays: integer("follow_up_days"),
  dietAdvice: text("diet_advice"),
  activityAdvice: text("activity_advice"),
  
  // Change tracking
  changedBy: varchar("changed_by"),
  changedByName: text("changed_by_name"),
  changeNotes: text("change_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOpdTemplateVersionSchema = createInsertSchema(opdTemplateVersions).omit({
  id: true,
  createdAt: true,
});
export type InsertOpdTemplateVersion = z.infer<typeof insertOpdTemplateVersionSchema>;
export type OpdTemplateVersion = typeof opdTemplateVersions.$inferSelect;

// ==========================================
// ID Card Scanning & Alert System
// ==========================================

// ID Card Types
export const idCardTypeEnum = pgEnum("id_card_type", ["AADHAAR", "PAN", "DRIVING_LICENSE", "VOTER_ID", "PASSPORT", "OTHER"]);

// ID Card Scans - Stores scanned ID card data
export const idCardScans = pgTable("id_card_scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // ID Card Information
  idCardType: text("id_card_type").notNull(), // AADHAAR, PAN, DRIVING_LICENSE, VOTER_ID, PASSPORT, OTHER
  idNumber: text("id_number"),
  
  // Extracted Information
  extractedName: text("extracted_name"),
  extractedDob: text("extracted_dob"),
  extractedGender: text("extracted_gender"),
  extractedAddress: text("extracted_address"),
  calculatedAge: integer("calculated_age"),
  
  // Image Data (base64)
  frontImageData: text("front_image_data"),
  backImageData: text("back_image_data"),
  
  // OCR/QR Raw Data
  ocrRawData: text("ocr_raw_data"),
  qrRawData: text("qr_raw_data"),
  
  // Processing Status
  processingStatus: text("processing_status").default("pending"), // pending, processing, completed, failed
  processingNotes: text("processing_notes"),
  
  // Link to patient if registered
  patientId: varchar("patient_id"),
  
  // Metadata
  scannedBy: varchar("scanned_by"),
  scannedByName: text("scanned_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIdCardScanSchema = createInsertSchema(idCardScans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertIdCardScan = z.infer<typeof insertIdCardScanSchema>;
export type IdCardScan = typeof idCardScans.$inferSelect;

// Critical Alerts - For underage pregnancy and other critical conditions
export const criticalAlerts = pgTable("critical_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Alert Type
  alertType: text("alert_type").notNull(), // UNDERAGE_PREGNANCY, EMERGENCY, CRITICAL_CONDITION
  severity: text("severity").notNull().default("critical"), // critical, high, medium
  
  // Patient Information
  patientId: varchar("patient_id"),
  patientName: text("patient_name").notNull(),
  patientAge: integer("patient_age"),
  patientGender: text("patient_gender"),
  
  // Visit Details
  department: text("department"),
  visitReason: text("visit_reason"),
  visitType: text("visit_type"), // pregnancy_related, routine, emergency
  
  // Alert Details
  alertTitle: text("alert_title").notNull(),
  alertMessage: text("alert_message").notNull(),
  additionalNotes: text("additional_notes"),
  
  // ID Card Reference
  idCardScanId: varchar("id_card_scan_id"),
  
  // Status
  status: text("status").notNull().default("active"), // active, acknowledged, resolved, dismissed
  acknowledgedBy: varchar("acknowledged_by"),
  acknowledgedByName: text("acknowledged_by_name"),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedBy: varchar("resolved_by"),
  resolvedByName: text("resolved_by_name"),
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),
  
  // Metadata
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCriticalAlertSchema = createInsertSchema(criticalAlerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCriticalAlert = z.infer<typeof insertCriticalAlertSchema>;
export type CriticalAlert = typeof criticalAlerts.$inferSelect;

// ==========================================
// SUPER ADMIN PORTAL - Enterprise Controls
// ==========================================

// Audit Logs - Immutable system-wide audit trail
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Action Details
  action: text("action").notNull(), // CREATE, UPDATE, DELETE, APPROVE, LOCK, UNLOCK, LOGIN, LOGOUT
  module: text("module").notNull(), // BILLING, STOCK, SURGERY, MEDICINE, INSURANCE, CLAIMS, PACKAGES, USERS
  entityType: text("entity_type").notNull(), // bill, stock_item, surgery_package, medicine, etc.
  entityId: varchar("entity_id"),
  
  // User Information
  userId: varchar("user_id").notNull(),
  userName: text("user_name").notNull(),
  userRole: text("user_role").notNull(),
  
  // Change Details
  previousValue: text("previous_value"), // JSON stringified
  newValue: text("new_value"), // JSON stringified
  changeDescription: text("change_description"),
  
  // Context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  sessionId: varchar("session_id"),
  
  // Metadata
  severity: text("severity").default("info"), // info, warning, critical
  isFinancial: boolean("is_financial").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Financial Locks - Track locked financial records
export const financialLocks = pgTable("financial_locks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Lock Target
  entityType: text("entity_type").notNull(), // BILL, CLAIM, SETTLEMENT, PACKAGE_PRICE
  entityId: varchar("entity_id").notNull(),
  
  // Lock Status
  isLocked: boolean("is_locked").notNull().default(true),
  lockReason: text("lock_reason"),
  
  // Lock History
  lockedBy: varchar("locked_by").notNull(),
  lockedByName: text("locked_by_name").notNull(),
  lockedAt: timestamp("locked_at").defaultNow(),
  
  // Unlock (if applicable)
  unlockedBy: varchar("unlocked_by"),
  unlockedByName: text("unlocked_by_name"),
  unlockedAt: timestamp("unlocked_at"),
  unlockReason: text("unlock_reason"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFinancialLockSchema = createInsertSchema(financialLocks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertFinancialLock = z.infer<typeof insertFinancialLockSchema>;
export type FinancialLock = typeof financialLocks.$inferSelect;

// Role Permissions - Fine-grained permission matrix
export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  role: text("role").notNull(),
  module: text("module").notNull(), // BILLING, STOCK, SURGERY, MEDICINE, INSURANCE, CLAIMS, PACKAGES, USERS, REPORTS
  
  // Permission Flags
  canView: boolean("can_view").default(false),
  canCreate: boolean("can_create").default(false),
  canEdit: boolean("can_edit").default(false),
  canDelete: boolean("can_delete").default(false),
  canApprove: boolean("can_approve").default(false),
  canLock: boolean("can_lock").default(false),
  canUnlock: boolean("can_unlock").default(false),
  canExport: boolean("can_export").default(false),
  
  // Metadata
  description: text("description"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;

// Billing Records - OPD & IPD Bills with finalization
export const billingRecords = pgTable("billing_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Bill Information
  billNumber: text("bill_number").notNull().unique(),
  billType: text("bill_type").notNull(), // OPD, IPD
  patientId: varchar("patient_id"),
  patientName: text("patient_name").notNull(),
  
  // Services & Charges
  services: text("services"), // JSON array of services
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  
  // Payment Details
  paymentStatus: text("payment_status").default("pending"), // pending, partial, paid
  paymentMethod: text("payment_method"), // CASH, CARD, UPI, INSURANCE
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
  
  // Finalization Status
  status: text("status").default("draft"), // draft, pending_approval, approved, finalized, cancelled
  isLocked: boolean("is_locked").default(false),
  
  // Approval Workflow
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  approvedBy: varchar("approved_by"),
  approvedByName: text("approved_by_name"),
  approvedAt: timestamp("approved_at"),
  finalizedBy: varchar("finalized_by"),
  finalizedByName: text("finalized_by_name"),
  finalizedAt: timestamp("finalized_at"),
  
  // Metadata
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBillingRecordSchema = createInsertSchema(billingRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBillingRecord = z.infer<typeof insertBillingRecordSchema>;
export type BillingRecord = typeof billingRecords.$inferSelect;

// Stock Batches - Pharmacy inventory with batch tracking
export const stockBatches = pgTable("stock_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Medicine/Item Reference
  medicineId: varchar("medicine_id"),
  medicineName: text("medicine_name").notNull(),
  
  // Batch Information
  batchNumber: text("batch_number").notNull(),
  manufacturingDate: text("manufacturing_date"),
  expiryDate: text("expiry_date").notNull(),
  
  // Quantity & Pricing
  quantity: integer("quantity").notNull(),
  availableQuantity: integer("available_quantity").notNull(),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }).notNull(),
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
  mrp: decimal("mrp", { precision: 10, scale: 2 }).notNull(),
  gstPercentage: decimal("gst_percentage", { precision: 5, scale: 2 }).default("18"),
  
  // Supplier
  supplierId: varchar("supplier_id"),
  supplierName: text("supplier_name"),
  invoiceNumber: text("invoice_number"),
  
  // Status
  status: text("status").default("active"), // active, expired, depleted, recalled
  isLocked: boolean("is_locked").default(false),
  
  // Metadata
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStockBatchSchema = createInsertSchema(stockBatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertStockBatch = z.infer<typeof insertStockBatchSchema>;
export type StockBatch = typeof stockBatches.$inferSelect;

// Surgery Packages - Surgery costing and packages
export const surgeryPackages = pgTable("surgery_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Package Information
  packageCode: text("package_code").notNull().unique(),
  packageName: text("package_name").notNull(),
  surgeryType: text("surgery_type").notNull(),
  department: text("department"),
  
  // Cost Breakdown
  otCharges: decimal("ot_charges", { precision: 10, scale: 2 }).default("0"),
  surgeonFees: decimal("surgeon_fees", { precision: 10, scale: 2 }).default("0"),
  anesthesiaFees: decimal("anesthesia_fees", { precision: 10, scale: 2 }).default("0"),
  consumablesCost: decimal("consumables_cost", { precision: 10, scale: 2 }).default("0"),
  roomCharges: decimal("room_charges", { precision: 10, scale: 2 }).default("0"),
  nursingCharges: decimal("nursing_charges", { precision: 10, scale: 2 }).default("0"),
  medicinesCost: decimal("medicines_cost", { precision: 10, scale: 2 }).default("0"),
  diagnosticsCost: decimal("diagnostics_cost", { precision: 10, scale: 2 }).default("0"),
  miscCharges: decimal("misc_charges", { precision: 10, scale: 2 }).default("0"),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  
  // Package Pricing
  packagePrice: decimal("package_price", { precision: 10, scale: 2 }).notNull(),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0"),
  
  // Duration & Stay
  estimatedDuration: text("estimated_duration"), // e.g., "2-3 hours"
  expectedStayDays: integer("expected_stay_days"),
  
  // Status
  status: text("status").default("draft"), // draft, active, inactive
  isLocked: boolean("is_locked").default(false),
  effectiveFrom: text("effective_from"),
  effectiveTo: text("effective_to"),
  
  // Approval
  approvedBy: varchar("approved_by"),
  approvedByName: text("approved_by_name"),
  approvedAt: timestamp("approved_at"),
  
  // Metadata
  description: text("description"),
  inclusions: text("inclusions"), // JSON array
  exclusions: text("exclusions"), // JSON array
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSurgeryPackageSchema = createInsertSchema(surgeryPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSurgeryPackage = z.infer<typeof insertSurgeryPackageSchema>;
export type SurgeryPackage = typeof surgeryPackages.$inferSelect;

// Hospital Packages - OPD/IPD pricing packages
export const hospitalPackages = pgTable("hospital_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Package Information
  packageCode: text("package_code").notNull().unique(),
  packageName: text("package_name").notNull(),
  packageType: text("package_type").notNull(), // OPD, IPD, HEALTH_CHECKUP, DAYCARE
  department: text("department"),
  
  // Pricing
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0"),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }).notNull(),
  
  // Inclusions
  includedServices: text("included_services"), // JSON array
  includedTests: text("included_tests"), // JSON array
  includedConsultations: integer("included_consultations").default(1),
  
  // Validity
  effectiveFrom: text("effective_from"),
  effectiveTo: text("effective_to"),
  validityDays: integer("validity_days"), // Package validity after purchase
  
  // Status
  status: text("status").default("draft"), // draft, active, inactive, expired
  isLocked: boolean("is_locked").default(false),
  
  // Approval
  approvedBy: varchar("approved_by"),
  approvedByName: text("approved_by_name"),
  approvedAt: timestamp("approved_at"),
  
  // Metadata
  description: text("description"),
  termsConditions: text("terms_conditions"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertHospitalPackageSchema = createInsertSchema(hospitalPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertHospitalPackage = z.infer<typeof insertHospitalPackageSchema>;
export type HospitalPackage = typeof hospitalPackages.$inferSelect;

// Override Requests - Track all override requests requiring Super Admin approval
export const overrideRequests = pgTable("override_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Request Information
  requestType: text("request_type").notNull(), // UNLOCK_BILL, UNLOCK_STOCK, MODIFY_LOCKED, NEGATIVE_STOCK, PRICE_CHANGE
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  
  // Requester
  requestedBy: varchar("requested_by").notNull(),
  requestedByName: text("requested_by_name").notNull(),
  requestedByRole: text("requested_by_role").notNull(),
  requestReason: text("request_reason").notNull(),
  
  // Current vs Proposed Values
  currentValue: text("current_value"), // JSON
  proposedValue: text("proposed_value"), // JSON
  
  // Status
  status: text("status").default("pending"), // pending, approved, rejected
  priority: text("priority").default("normal"), // low, normal, high, urgent
  
  // Resolution
  resolvedBy: varchar("resolved_by"),
  resolvedByName: text("resolved_by_name"),
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOverrideRequestSchema = createInsertSchema(overrideRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOverrideRequest = z.infer<typeof insertOverrideRequestSchema>;
export type OverrideRequest = typeof overrideRequests.$inferSelect;

// Medicine Catalog - Master medicine database
export const medicineCatalog = pgTable("medicine_catalog", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Medicine Information
  medicineCode: text("medicine_code").notNull().unique(),
  brandName: text("brand_name").notNull(),
  genericName: text("generic_name").notNull(),
  saltComposition: text("salt_composition"),
  
  // Classification
  category: text("category"), // Antibiotic, Analgesic, etc.
  subCategory: text("sub_category"),
  therapeuticClass: text("therapeutic_class"),
  
  // Form & Strength
  dosageForm: text("dosage_form").notNull(), // Tablet, Capsule, Syrup, etc.
  strength: text("strength"), // 500mg, 10ml, etc.
  packSize: text("pack_size"), // 10 tablets, 100ml, etc.
  
  // Manufacturer
  manufacturer: text("manufacturer"),
  countryOfOrigin: text("country_of_origin").default("India"),
  
  // Pricing
  mrp: decimal("mrp", { precision: 10, scale: 2 }),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }),
  gstPercentage: decimal("gst_percentage", { precision: 5, scale: 2 }).default("12"),
  
  // Prescription Control
  isScheduled: boolean("is_scheduled").default(false),
  scheduleType: text("schedule_type"), // H, H1, X, G
  requiresPrescription: boolean("requires_prescription").default(true),
  
  // Status
  status: text("status").default("active"), // active, discontinued, banned
  isLocked: boolean("is_locked").default(false),
  
  // Version Control
  version: integer("version").default(1),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  
  // Metadata
  description: text("description"),
  sideEffects: text("side_effects"),
  contraindications: text("contraindications"),
  storageInstructions: text("storage_instructions"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMedicineCatalogSchema = createInsertSchema(medicineCatalog).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMedicineCatalog = z.infer<typeof insertMedicineCatalogSchema>;
export type MedicineCatalog = typeof medicineCatalog.$inferSelect;

// Hospital Departments List
export const HOSPITAL_DEPARTMENTS = [
  "Emergency",
  "Cardiology", 
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Oncology",
  "Ophthalmology",
  "ENT",
  "Dermatology",
  "Psychiatry",
  "Gynecology",
  "Urology",
  "Nephrology",
  "Gastroenterology",
  "Pulmonology",
  "Endocrinology",
  "Rheumatology",
  "Pathology",
  "Radiology",
  "Physiotherapy",
  "Dental",
  "General Medicine",
  "General Surgery",
  "ICU"
] as const;

export type HospitalDepartment = typeof HOSPITAL_DEPARTMENTS[number];

// Nurse Department Preferences - for scheduling and assignment
export const nurseDepartmentPreferences = pgTable("nurse_department_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nurseId: varchar("nurse_id").notNull().unique(), // References staff_members.id where role = NURSE
  nurseName: text("nurse_name").notNull(),
  primaryDepartment: text("primary_department").notNull(),
  secondaryDepartment: text("secondary_department").notNull(),
  tertiaryDepartment: text("tertiary_department").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(), // Nurse availability status (Assigned/Not Assigned)
  assignedRoom: text("assigned_room"), // Room number where nurse is currently assigned
  assignedDoctor: text("assigned_doctor"), // Doctor name the nurse is working with
  assignedPosition: text("assigned_position"), // Position type: Primary, Secondary, or Tertiary
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNurseDepartmentPreferencesSchema = createInsertSchema(nurseDepartmentPreferences)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .refine(
    (data) => {
      // Ensure all three departments are different
      const depts = [data.primaryDepartment, data.secondaryDepartment, data.tertiaryDepartment];
      return new Set(depts).size === 3;
    },
    { message: "All three department preferences must be unique" }
  );

export type InsertNurseDepartmentPreferences = z.infer<typeof insertNurseDepartmentPreferencesSchema>;
export type NurseDepartmentPreferences = typeof nurseDepartmentPreferences.$inferSelect;

// Department Nurse Assignments - department-centric view where each department has up to 3 nurses
export const departmentNurseAssignments = pgTable("department_nurse_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  departmentName: text("department_name").notNull().unique(),
  primaryNurseId: varchar("primary_nurse_id"),
  primaryNurseName: text("primary_nurse_name"),
  secondaryNurseId: varchar("secondary_nurse_id"),
  secondaryNurseName: text("secondary_nurse_name"),
  tertiaryNurseId: varchar("tertiary_nurse_id"),
  tertiaryNurseName: text("tertiary_nurse_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDepartmentNurseAssignmentsSchema = createInsertSchema(departmentNurseAssignments)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .refine(
    (data) => {
      const nurses = [data.primaryNurseId, data.secondaryNurseId, data.tertiaryNurseId].filter(Boolean);
      return new Set(nurses).size === nurses.length;
    },
    { message: "Each nurse can only occupy one priority per department" }
  );

export type InsertDepartmentNurseAssignments = z.infer<typeof insertDepartmentNurseAssignmentsSchema>;
export type DepartmentNurseAssignments = typeof departmentNurseAssignments.$inferSelect;

// ================== SMART OPD FLOW ENGINE ==================

// OPD Department Flows - Master configuration for department-specific clinical workflows
export const opdDepartmentFlows = pgTable("opd_department_flows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  departmentCode: text("department_code").notNull().unique(),
  departmentName: text("department_name").notNull(),
  flowType: text("flow_type").notNull(), // symptom_driven, score_driven, service_flow, imaging_flow
  
  // Symptom Configuration (JSON array of symptom objects)
  symptoms: text("symptoms").notNull(), // JSON: [{id, name, severity_levels, duration_options}]
  
  // Auto Observation Fields (JSON array)
  autoObservations: text("auto_observations").notNull(), // JSON: [{id, name, type, options, unit}]
  
  // Flow Logic Rules (JSON array of rule objects)
  flowLogicRules: text("flow_logic_rules").notNull(), // JSON: [{condition, action, priority}]
  
  // Suggested Tests/Investigations
  suggestedTests: text("suggested_tests"), // JSON: [{testName, condition, mandatory}]
  
  // Suggested Referrals
  suggestedReferrals: text("suggested_referrals"), // JSON: [{department, condition}]
  
  // Additional Configuration
  requiresVitals: boolean("requires_vitals").default(true),
  vitalsFields: text("vitals_fields"), // JSON: which vitals to capture
  
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOpdDepartmentFlowsSchema = createInsertSchema(opdDepartmentFlows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOpdDepartmentFlows = z.infer<typeof insertOpdDepartmentFlowsSchema>;
export type OpdDepartmentFlows = typeof opdDepartmentFlows.$inferSelect;

// OPD Consultations - Patient visit records with clinical data
export const opdConsultations = pgTable("opd_consultations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consultationNumber: text("consultation_number").notNull().unique(), // OPD-YYYYMMDD-XXXX format
  
  // Patient & Doctor Info
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  patientAge: integer("patient_age"),
  patientGender: text("patient_gender"),
  
  doctorId: varchar("doctor_id").notNull(),
  doctorName: text("doctor_name").notNull(),
  
  // Department & Flow
  departmentCode: text("department_code").notNull(),
  departmentName: text("department_name").notNull(),
  appointmentId: varchar("appointment_id"), // Link to appointment if booked
  
  // Visit Type
  visitType: text("visit_type").notNull().default("new"), // new, follow_up, review
  
  // Chief Complaints (Selected Symptoms)
  selectedSymptoms: text("selected_symptoms").notNull(), // JSON: [{symptomId, name, severity, duration, notes}]
  
  // Clinical Observations (Auto + Manual)
  observations: text("observations").notNull(), // JSON: [{fieldId, name, value, unit}]
  
  // Vitals Captured
  vitals: text("vitals"), // JSON: {bp, pulse, temp, spo2, rr, weight, height, bmi}
  
  // Flow Logic Results (Auto-generated suggestions)
  flowResults: text("flow_results"), // JSON: {suggestedTests: [], suggestedReferrals: [], alerts: []}
  
  // Clinical Notes
  clinicalNotes: text("clinical_notes"),
  diagnosis: text("diagnosis"),
  provisionalDiagnosis: text("provisional_diagnosis"),
  differentialDiagnosis: text("differential_diagnosis"),
  
  // Treatment Plan (OPD only - no IPD/surgery)
  treatmentPlan: text("treatment_plan"),
  medicationsAdvised: text("medications_advised"), // JSON: medications list
  
  // Investigations Ordered
  investigationsOrdered: text("investigations_ordered"), // JSON: [{testId, testName, priority, notes}]
  
  // Referrals Made
  referralsMade: text("referrals_made"), // JSON: [{department, doctorName, reason, priority}]
  
  // Follow-up
  followUpDate: timestamp("follow_up_date"),
  followUpNotes: text("follow_up_notes"),
  
  // Status
  status: text("status").notNull().default("in_progress"), // in_progress, completed, cancelled
  
  // Timestamps
  consultationDate: timestamp("consultation_date").defaultNow(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOpdConsultationsSchema = createInsertSchema(opdConsultations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOpdConsultations = z.infer<typeof insertOpdConsultationsSchema>;
export type OpdConsultations = typeof opdConsultations.$inferSelect;

// ========== Diagnostic Test Orders (from Prescriptions to Technician Portal) ==========
export const diagnosticTestOrders = pgTable("diagnostic_test_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Source Information
  prescriptionId: varchar("prescription_id"), // Link to prescription if from doctor
  consultationId: varchar("consultation_id"), // Link to OPD consultation
  icuChartId: varchar("icu_chart_id"), // Link to ICU chart if from ICU
  sessionId: varchar("session_id"), // Link to Patient Monitoring session
  source: text("source").default("PRESCRIPTION"), // PRESCRIPTION, OPD, ICU, PATIENT_MONITORING
  
  // Patient Information
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  patientAge: text("patient_age"),
  patientGender: text("patient_gender"),
  
  // Doctor Information
  doctorId: varchar("doctor_id").notNull(),
  doctorName: text("doctor_name").notNull(),
  
  // Test Information
  testName: text("test_name").notNull(),
  testType: text("test_type").notNull(), // MRI, CT, X-RAY, ECG, LAB, etc.
  department: text("department").notNull(), // Radiology, Pathology, Cardiology, etc.
  category: text("category"), // PATHOLOGY, RADIOLOGY, CARDIOLOGY, NEURO, PULMONARY, BLOOD_BANK, DIALYSIS, ENDOSCOPY
  
  // Priority & Status
  priority: text("priority").notNull().default("ROUTINE"), // ROUTINE, URGENT, STAT
  status: text("status").notNull().default("PENDING"), // PENDING, SAMPLE_COLLECTED, IN_PROGRESS, REPORT_UPLOADED, COMPLETED, CANCELLED
  sampleCollectedAt: timestamp("sample_collected_at"),
  sampleCollectedBy: text("sample_collected_by"),
  
  // Assignment
  assignedTechnicianId: varchar("assigned_technician_id"),
  assignedTechnicianName: text("assigned_technician_name"),
  
  // Notes
  clinicalNotes: text("clinical_notes"),
  specialInstructions: text("special_instructions"),
  
  // Report (when technician uploads)
  reportUrl: text("report_url"),
  reportFileName: text("report_file_name"),
  
  // Timestamps
  orderedDate: timestamp("ordered_date").defaultNow(),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDiagnosticTestOrdersSchema = createInsertSchema(diagnosticTestOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDiagnosticTestOrders = z.infer<typeof insertDiagnosticTestOrdersSchema>;
export type DiagnosticTestOrders = typeof diagnosticTestOrders.$inferSelect;

// ========== Technician Reports (Submitted by Technicians) ==========
export const technicianReports = pgTable("technician_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Link to Test Order
  testOrderId: varchar("test_order_id").notNull(),
  
  // Patient Information
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  
  // Doctor Information (for notifications)
  doctorId: varchar("doctor_id").notNull(),
  doctorName: text("doctor_name").notNull(),
  
  // Test Information
  testName: text("test_name").notNull(),
  testType: text("test_type").notNull(),
  department: text("department").notNull(),
  
  // Technician Information
  technicianId: varchar("technician_id").notNull(),
  technicianName: text("technician_name").notNull(),
  
  // Report Content
  findings: text("findings").notNull(),
  conclusion: text("conclusion").notNull(),
  recommendations: text("recommendations"),
  
  // File Attachment
  fileName: text("file_name"),
  fileType: text("file_type"),
  fileData: text("file_data"), // Base64 encoded file
  
  // Status
  status: text("status").notNull().default("SUBMITTED"), // DRAFT, SUBMITTED, VERIFIED, REJECTED
  verifiedBy: varchar("verified_by"),
  verifiedAt: timestamp("verified_at"),
  
  // Timestamps
  reportDate: timestamp("report_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTechnicianReportsSchema = createInsertSchema(technicianReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTechnicianReports = z.infer<typeof insertTechnicianReportsSchema>;
export type TechnicianReports = typeof technicianReports.$inferSelect;

// ========== ICU MONITORING SYSTEM ==========

// ICU Chart - Main record for each patient's daily ICU monitoring
export const icuCharts = pgTable("icu_charts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  age: text("age"),
  sex: text("sex"),
  bloodGroup: text("blood_group"),
  weight: text("weight"),
  diagnosis: text("diagnosis"),
  dateOfAdmission: text("date_of_admission"),
  ward: text("ward"),
  bedNo: text("bed_no"),
  chartDate: text("chart_date").notNull(), // Date of this chart
  admittingConsultant: text("admitting_consultant"),
  icuConsultant: text("icu_consultant"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIcuChartsSchema = createInsertSchema(icuCharts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertIcuCharts = z.infer<typeof insertIcuChartsSchema>;
export type IcuCharts = typeof icuCharts.$inferSelect;

// ICU Vital Chart - Hourly vital signs (24 hours)
export const icuVitalCharts = pgTable("icu_vital_charts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  hour: text("hour").notNull(), // 00:00 to 23:00
  temperature: text("temperature"),
  coreTemp: text("core_temp"),
  skinTemp: text("skin_temp"),
  pulse: text("pulse"),
  bp: text("bp"),
  cvp: text("cvp"),
  respiratoryRate: text("respiratory_rate"),
  spo2: text("spo2"),
  recordedBy: varchar("recorded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuVitalChartsSchema = createInsertSchema(icuVitalCharts).omit({ id: true, createdAt: true });
export type InsertIcuVitalCharts = z.infer<typeof insertIcuVitalChartsSchema>;
export type IcuVitalCharts = typeof icuVitalCharts.$inferSelect;

// Hemodynamic Monitoring
export const icuHemodynamicMonitoring = pgTable("icu_hemodynamic_monitoring", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  time: text("time").notNull(),
  heartRate: text("heart_rate"),
  map: text("map"), // Mean Arterial Pressure
  cvp: text("cvp"),
  icp: text("icp"), // Intracranial Pressure
  cpp: text("cpp"), // Cerebral Perfusion Pressure
  inotropeName: text("inotrope_name"),
  inotropeDose: text("inotrope_dose"),
  recordedBy: varchar("recorded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuHemodynamicMonitoringSchema = createInsertSchema(icuHemodynamicMonitoring).omit({ id: true, createdAt: true });
export type InsertIcuHemodynamicMonitoring = z.infer<typeof insertIcuHemodynamicMonitoringSchema>;
export type IcuHemodynamicMonitoring = typeof icuHemodynamicMonitoring.$inferSelect;

// Sedation Monitoring
export const icuSedationMonitoring = pgTable("icu_sedation_monitoring", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  time: text("time").notNull(),
  sedationScore: text("sedation_score"),
  drugName: text("drug_name"),
  dose: text("dose"),
  remarks: text("remarks"),
  recordedBy: varchar("recorded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuSedationMonitoringSchema = createInsertSchema(icuSedationMonitoring).omit({ id: true, createdAt: true });
export type InsertIcuSedationMonitoring = z.infer<typeof insertIcuSedationMonitoringSchema>;
export type IcuSedationMonitoring = typeof icuSedationMonitoring.$inferSelect;

// Ventilator Settings
export const icuVentilatorSettings = pgTable("icu_ventilator_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  time: text("time").notNull(),
  mode: text("mode"),
  fio2: text("fio2"),
  expTidalVolume: text("exp_tidal_volume"),
  expMinVolume: text("exp_min_volume"),
  setTidalVolume: text("set_tidal_volume"),
  setMinVolume: text("set_min_volume"),
  respRatePerMin: text("resp_rate_per_min"),
  spontaneousRrPerMin: text("spontaneous_rr_per_min"),
  simvRatePerMin: text("simv_rate_per_min"),
  peepCpap: text("peep_cpap"),
  autoPeep: text("auto_peep"),
  peakAirwayPressure: text("peak_airway_pressure"),
  pressureSupport: text("pressure_support"),
  ieRatio: text("ie_ratio"),
  recordedBy: varchar("recorded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuVentilatorSettingsSchema = createInsertSchema(icuVentilatorSettings).omit({ id: true, createdAt: true });
export type InsertIcuVentilatorSettings = z.infer<typeof insertIcuVentilatorSettingsSchema>;
export type IcuVentilatorSettings = typeof icuVentilatorSettings.$inferSelect;

// ABG Reports
export const icuAbgReports = pgTable("icu_abg_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  time: text("time").notNull(),
  ph: text("ph"),
  pco2: text("pco2"),
  po2: text("po2"),
  sbc: text("sbc"),
  be: text("be"),
  sao2: text("sao2"),
  svo2: text("svo2"),
  lactate: text("lactate"),
  recordedBy: varchar("recorded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuAbgReportsSchema = createInsertSchema(icuAbgReports).omit({ id: true, createdAt: true });
export type InsertIcuAbgReports = z.infer<typeof insertIcuAbgReportsSchema>;
export type IcuAbgReports = typeof icuAbgReports.$inferSelect;

// Airway Care (Secretions & Position)
export const icuAirwayCare = pgTable("icu_airway_care", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  time: text("time").notNull(),
  secretions: text("secretions"), // Yes/No
  secretionType: text("secretion_type"), // Thick/Thin
  patientPosition: text("patient_position"),
  airwayGuarded: text("airway_guarded"),
  recordedBy: varchar("recorded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuAirwayCareSchema = createInsertSchema(icuAirwayCare).omit({ id: true, createdAt: true });
export type InsertIcuAirwayCare = z.infer<typeof insertIcuAirwayCareSchema>;
export type IcuAirwayCare = typeof icuAirwayCare.$inferSelect;

// Daily Investigations
export const icuDailyInvestigations = pgTable("icu_daily_investigations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  hb: text("hb"),
  wbc: text("wbc"),
  urea: text("urea"),
  creatinine: text("creatinine"),
  electrolytes: text("electrolytes"),
  ptAptt: text("pt_aptt"),
  lfts: text("lfts"),
  bsl: text("bsl"),
  sputumRCulture: text("sputum_r_culture"),
  urineRCulture: text("urine_r_culture"),
  bloodCulture: text("blood_culture"),
  xrayChest: text("xray_chest"),
  abg: text("abg"),
  anyOther: text("any_other"),
  recordedBy: varchar("recorded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuDailyInvestigationsSchema = createInsertSchema(icuDailyInvestigations).omit({ id: true, createdAt: true });
export type InsertIcuDailyInvestigations = z.infer<typeof insertIcuDailyInvestigationsSchema>;
export type IcuDailyInvestigations = typeof icuDailyInvestigations.$inferSelect;

// Diabetic Flow Chart
export const icuDiabeticChart = pgTable("icu_diabetic_chart", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  time: text("time").notNull(),
  bsl: text("bsl"),
  insulin: text("insulin"),
  na: text("na"),
  k: text("k"),
  cl: text("cl"),
  recordedBy: varchar("recorded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuDiabeticChartSchema = createInsertSchema(icuDiabeticChart).omit({ id: true, createdAt: true });
export type InsertIcuDiabeticChart = z.infer<typeof insertIcuDiabeticChartSchema>;
export type IcuDiabeticChart = typeof icuDiabeticChart.$inferSelect;

// Play of the Day (Daily Notes)
export const icuPlayOfDay = pgTable("icu_play_of_day", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  notes: text("notes"),
  recordedBy: varchar("recorded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuPlayOfDaySchema = createInsertSchema(icuPlayOfDay).omit({ id: true, createdAt: true });
export type InsertIcuPlayOfDay = z.infer<typeof insertIcuPlayOfDaySchema>;
export type IcuPlayOfDay = typeof icuPlayOfDay.$inferSelect;

// Cuff Pressure
export const icuCuffPressure = pgTable("icu_cuff_pressure", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  morning: text("morning"),
  evening: text("evening"),
  night: text("night"),
  recordedBy: varchar("recorded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuCuffPressureSchema = createInsertSchema(icuCuffPressure).omit({ id: true, createdAt: true });
export type InsertIcuCuffPressure = z.infer<typeof insertIcuCuffPressureSchema>;
export type IcuCuffPressure = typeof icuCuffPressure.$inferSelect;

// ETT/Tracheostomy Details
export const icuEttTracheostomy = pgTable("icu_ett_tracheostomy", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  tubeType: text("tube_type"), // ETT or Tracheostomy
  size: text("size"),
  cutTiedAt: text("cut_tied_at"),
  recordedBy: varchar("recorded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuEttTracheostomySchema = createInsertSchema(icuEttTracheostomy).omit({ id: true, createdAt: true });
export type InsertIcuEttTracheostomy = z.infer<typeof insertIcuEttTracheostomySchema>;
export type IcuEttTracheostomy = typeof icuEttTracheostomy.$inferSelect;

// ICU Duration Summary
export const icuDuration = pgTable("icu_duration", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  daysIntubated: integer("days_intubated"),
  daysVentilated: integer("days_ventilated"),
  daysIcuStay: integer("days_icu_stay"),
  recordedBy: varchar("recorded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuDurationSchema = createInsertSchema(icuDuration).omit({ id: true, createdAt: true });
export type InsertIcuDuration = z.infer<typeof insertIcuDurationSchema>;
export type IcuDuration = typeof icuDuration.$inferSelect;

// Fluid Balance Target
export const icuFluidBalanceTarget = pgTable("icu_fluid_balance_target", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  targetIntake: text("target_intake"),
  targetOutput: text("target_output"),
  netBalanceGoal: text("net_balance_goal"),
  recordedBy: varchar("recorded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuFluidBalanceTargetSchema = createInsertSchema(icuFluidBalanceTarget).omit({ id: true, createdAt: true });
export type InsertIcuFluidBalanceTarget = z.infer<typeof insertIcuFluidBalanceTargetSchema>;
export type IcuFluidBalanceTarget = typeof icuFluidBalanceTarget.$inferSelect;

// Intake Chart (Hourly)
export const icuIntakeChart = pgTable("icu_intake_chart", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  timeSlot: text("time_slot").notNull(),
  line1: text("line1"),
  line2: text("line2"),
  line3: text("line3"),
  line4: text("line4"),
  line5: text("line5"),
  line6: text("line6"),
  totalIntake: text("total_intake"),
  recordedBy: varchar("recorded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuIntakeChartSchema = createInsertSchema(icuIntakeChart).omit({ id: true, createdAt: true });
export type InsertIcuIntakeChart = z.infer<typeof insertIcuIntakeChartSchema>;
export type IcuIntakeChart = typeof icuIntakeChart.$inferSelect;

// Output Chart (Hourly)
export const icuOutputChart = pgTable("icu_output_chart", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  timeSlot: text("time_slot").notNull(),
  urineHourly: text("urine_hourly"),
  otherLosses: text("other_losses"),
  totalOutput: text("total_output"),
  recordedBy: varchar("recorded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuOutputChartSchema = createInsertSchema(icuOutputChart).omit({ id: true, createdAt: true });
export type InsertIcuOutputChart = z.infer<typeof insertIcuOutputChartSchema>;
export type IcuOutputChart = typeof icuOutputChart.$inferSelect;

// Doctor's Medication Order
export const icuMedicationOrders = pgTable("icu_medication_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  srNo: integer("sr_no"),
  drugName: text("drug_name").notNull(),
  route: text("route"),
  dose: text("dose"),
  frequency: text("frequency"),
  time: text("time"),
  doctorSignature: text("doctor_signature"),
  doctorId: varchar("doctor_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuMedicationOrdersSchema = createInsertSchema(icuMedicationOrders).omit({ id: true, createdAt: true });
export type InsertIcuMedicationOrders = z.infer<typeof insertIcuMedicationOrdersSchema>;
export type IcuMedicationOrders = typeof icuMedicationOrders.$inferSelect;

// Nursing Remarks
export const icuNursingRemarks = pgTable("icu_nursing_remarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  time: text("time").notNull(),
  initials: text("initials"),
  remarks: text("remarks"),
  nurseId: varchar("nurse_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuNursingRemarksSchema = createInsertSchema(icuNursingRemarks).omit({ id: true, createdAt: true });
export type InsertIcuNursingRemarks = z.infer<typeof insertIcuNursingRemarksSchema>;
export type IcuNursingRemarks = typeof icuNursingRemarks.$inferSelect;

// Nursing Duty (Sisters on Duty)
export const icuNursingDuty = pgTable("icu_nursing_duty", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  shift: text("shift").notNull(), // Morning, Evening, Night
  name: text("name"),
  empNo: text("emp_no"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuNursingDutySchema = createInsertSchema(icuNursingDuty).omit({ id: true, createdAt: true });
export type InsertIcuNursingDuty = z.infer<typeof insertIcuNursingDutySchema>;
export type IcuNursingDuty = typeof icuNursingDuty.$inferSelect;

// Fluid Orders
export const icuFluidOrders = pgTable("icu_fluid_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  fluidName: text("fluid_name").notNull(),
  rate: text("rate"),
  duration: text("duration"),
  remarks: text("remarks"),
  orderedBy: varchar("ordered_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuFluidOrdersSchema = createInsertSchema(icuFluidOrders).omit({ id: true, createdAt: true });
export type InsertIcuFluidOrders = z.infer<typeof insertIcuFluidOrdersSchema>;
export type IcuFluidOrders = typeof icuFluidOrders.$inferSelect;

// Nutrition Chart
export const icuNutritionChart = pgTable("icu_nutrition_chart", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  typeOfFeed: text("type_of_feed"),
  route: text("route"),
  quantity: text("quantity"),
  frequency: text("frequency"),
  remarks: text("remarks"),
  recordedBy: varchar("recorded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuNutritionChartSchema = createInsertSchema(icuNutritionChart).omit({ id: true, createdAt: true });
export type InsertIcuNutritionChart = z.infer<typeof insertIcuNutritionChartSchema>;
export type IcuNutritionChart = typeof icuNutritionChart.$inferSelect;

// Body Marking / Pressure Sore Chart
export const icuBodyMarking = pgTable("icu_body_marking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  markedArea: text("marked_area"),
  typeOfInjury: text("type_of_injury"),
  grade: text("grade"),
  date: text("date"),
  remarks: text("remarks"),
  positionX: real("position_x"),
  positionY: real("position_y"),
  recordedBy: varchar("recorded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuBodyMarkingSchema = createInsertSchema(icuBodyMarking).omit({ id: true, createdAt: true });
export type InsertIcuBodyMarking = z.infer<typeof insertIcuBodyMarkingSchema>;
export type IcuBodyMarking = typeof icuBodyMarking.$inferSelect;

// Nurse Diary (Important Events During Shift)
export const icuNurseDiary = pgTable("icu_nurse_diary", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  time: text("time").notNull(),
  eventDescription: text("event_description"),
  nurseId: varchar("nurse_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuNurseDiarySchema = createInsertSchema(icuNurseDiary).omit({ id: true, createdAt: true });
export type InsertIcuNurseDiary = z.infer<typeof insertIcuNurseDiarySchema>;
export type IcuNurseDiary = typeof icuNurseDiary.$inferSelect;

// Once Only Drugs
export const icuOnceOnlyDrugs = pgTable("icu_once_only_drugs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  drugName: text("drug_name").notNull(),
  dose: text("dose"),
  route: text("route"),
  time: text("time"),
  doctorSign: text("doctor_sign"),
  doctorId: varchar("doctor_id"),
  timeGiven: text("time_given"),
  nurseSign: text("nurse_sign"),
  nurseId: varchar("nurse_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuOnceOnlyDrugsSchema = createInsertSchema(icuOnceOnlyDrugs).omit({ id: true, createdAt: true });
export type InsertIcuOnceOnlyDrugs = z.infer<typeof insertIcuOnceOnlyDrugsSchema>;
export type IcuOnceOnlyDrugs = typeof icuOnceOnlyDrugs.$inferSelect;

// Previous Day Notes
export const icuPreviousDayNotes = pgTable("icu_previous_day_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  notes: text("notes"),
  recordedBy: varchar("recorded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuPreviousDayNotesSchema = createInsertSchema(icuPreviousDayNotes).omit({ id: true, createdAt: true });
export type InsertIcuPreviousDayNotes = z.infer<typeof insertIcuPreviousDayNotesSchema>;
export type IcuPreviousDayNotes = typeof icuPreviousDayNotes.$inferSelect;

// Allergies & Special Precautions
export const icuAllergyPrecautions = pgTable("icu_allergy_precautions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  drugAllergy: text("drug_allergy"),
  foodAllergy: text("food_allergy"),
  otherAllergy: text("other_allergy"),
  specialPrecautions: text("special_precautions"),
  recordedBy: varchar("recorded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuAllergyPrecautionsSchema = createInsertSchema(icuAllergyPrecautions).omit({ id: true, createdAt: true });
export type InsertIcuAllergyPrecautions = z.infer<typeof insertIcuAllergyPrecautionsSchema>;
export type IcuAllergyPrecautions = typeof icuAllergyPrecautions.$inferSelect;

// Doctor & Nurse Notes (for ICU Charts)
export const icuDoctorNurseNotes = pgTable("icu_doctor_nurse_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  icuChartId: varchar("icu_chart_id").notNull(),
  noteType: text("note_type").notNull(), // "doctor" or "nurse"
  content: text("content").notNull(),
  priority: text("priority").default("normal"), // "normal", "important", "critical"
  shiftTime: text("shift_time"), // "morning", "evening", "night"
  recordedBy: varchar("recorded_by"),
  recordedByName: text("recorded_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIcuDoctorNurseNotesSchema = createInsertSchema(icuDoctorNurseNotes).omit({ id: true, createdAt: true });
export type InsertIcuDoctorNurseNotes = z.infer<typeof insertIcuDoctorNurseNotesSchema>;
export type IcuDoctorNurseNotes = typeof icuDoctorNurseNotes.$inferSelect;

// =====================================================
// OPERATION & OT MODULE - Surgical Workflow System
// =====================================================

// OT Case Status Enum
export const otCaseStatusEnum = pgEnum("ot_case_status", ["SCHEDULED", "PRE_OP", "INTRA_OP", "POST_OP", "COMPLETED", "CANCELLED"]);

// Master OT Case table - links to patient, OPD/IPD
export const otCases = pgTable("ot_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  uhid: text("uhid").notNull(),
  opdVisitId: varchar("opd_visit_id"),
  ipdAdmissionId: varchar("ipd_admission_id"),
  surgeonId: varchar("surgeon_id").notNull(),
  surgeonName: text("surgeon_name").notNull(),
  anaesthetistId: varchar("anaesthetist_id"),
  anaesthetistName: text("anaesthetist_name"),
  otRoom: text("ot_room").notNull(),
  procedureName: text("procedure_name").notNull(),
  procedureCode: text("procedure_code"),
  diagnosis: text("diagnosis"),
  scheduledDate: text("scheduled_date").notNull(),
  scheduledTime: text("scheduled_time").notNull(),
  estimatedDuration: integer("estimated_duration"), // in minutes
  urgencyLevel: text("urgency_level").default("elective"), // elective, urgent, emergency
  status: text("status").default("SCHEDULED"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOtCaseSchema = createInsertSchema(otCases).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOtCase = z.infer<typeof insertOtCaseSchema>;
export type OtCase = typeof otCases.$inferSelect;

// OT Case Team Members
export const otCaseTeam = pgTable("ot_case_team", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull(),
  staffId: varchar("staff_id").notNull(),
  staffName: text("staff_name").notNull(),
  role: text("role").notNull(), // SURGEON, ANAESTHETIST, OT_NURSE, ASSISTANT
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: varchar("assigned_by"),
});

export const insertOtCaseTeamSchema = createInsertSchema(otCaseTeam).omit({ id: true, assignedAt: true });
export type InsertOtCaseTeam = z.infer<typeof insertOtCaseTeamSchema>;
export type OtCaseTeam = typeof otCaseTeam.$inferSelect;

// Pre-Operative Assessment Form (replaces Pre-Op Counselling)
export const otPreopCounselling = pgTable("ot_preop_counselling", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull(),
  counsellingDateTime: timestamp("counselling_datetime").defaultNow(),
  // Operation Details
  dateOfOperation: text("date_of_operation"),
  timeOfOperation: text("time_of_operation"),
  operationTitle: text("operation_title"),
  surgeon: text("surgeon"),
  // Site & Preparation
  siteOrganAssociated: text("site_organ_associated"),
  timeOfLastMeal: text("time_of_last_meal"),
  bloodArranged: text("blood_arranged"),
  hoDrugInteraction: text("ho_drug_interaction"),
  // Medications
  preOpMedication: text("preop_medication"),
  preExposureProphylaxis: text("pre_exposure_prophylaxis"),
  otherMedicines: text("other_medicines"),
  // Diagnosis & Tests
  preOpDiagnosis: text("preop_diagnosis"),
  ecg: text("ecg"),
  bloodGroup: text("blood_group"),
  hiv: text("hiv"),
  echo: text("echo"),
  urea: text("urea"),
  hbsag: text("hbsag"),
  tmt: text("tmt"),
  creat: text("creat"),
  t3: text("t3"),
  // Physiological Conditions
  physiologicalConditions: text("physiological_conditions"),
  bp: text("bp"),
  rs: text("rs"),
  // Surgeon Remarks
  surgeonRemarks: text("surgeon_remarks"),
  nameOfSurgeon: text("name_of_surgeon"),
  surgeonSignature: text("surgeon_signature"),
  assessmentDate: text("assessment_date"),
  assessmentTime: text("assessment_time"),
  // Legacy fields (kept for backward compatibility)
  procedureExplained: boolean("procedure_explained").default(false),
  risksExplained: text("risks_explained"),
  alternativesDiscussed: text("alternatives_discussed"),
  expectedOutcome: text("expected_outcome"),
  recoveryTimeline: text("recovery_timeline"),
  patientQuestions: text("patient_questions"),
  patientUnderstandingConfirmed: boolean("patient_understanding_confirmed").default(false),
  patientSignature: text("patient_signature"),
  patientSignedAt: timestamp("patient_signed_at"),
  doctorSignature: text("doctor_signature"),
  doctorId: varchar("doctor_id"),
  doctorName: text("doctor_name"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtPreopCounsellingSchema = createInsertSchema(otPreopCounselling).omit({ id: true, createdAt: true });
export type InsertOtPreopCounselling = z.infer<typeof insertOtPreopCounsellingSchema>;
export type OtPreopCounselling = typeof otPreopCounselling.$inferSelect;

// Pre-Op Checklist (NABH Compliant - Hospital Template)
export const otPreopChecklist = pgTable("ot_preop_checklist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull(),
  // NABH-Style Checklist Items (25 items)
  generalConsentObtained: boolean("general_consent_obtained").default(false),
  surgeryConsentObtained: boolean("surgery_consent_obtained").default(false),
  anaesthesiaConsentObtained: boolean("anaesthesia_consent_obtained").default(false),
  specificConsent: boolean("specific_consent").default(false),
  areaPrepared: boolean("area_prepared").default(false),
  spinalEpiduralPrep: boolean("spinal_epidural_prep").default(false),
  jewelleryRemoved: boolean("jewellery_removed").default(false),
  denturesRemoved: boolean("dentures_removed").default(false),
  spectaclesRemoved: boolean("spectacles_removed").default(false),
  nailPolishRemoved: boolean("nail_polish_removed").default(false),
  hairPinsRemoved: boolean("hair_pins_removed").default(false),
  reportsCollected: boolean("reports_collected").default(false),
  preMedicationsGiven: boolean("pre_medications_given").default(false),
  preOpAntibioticsGiven: boolean("pre_op_antibiotics_given").default(false),
  hsMedicationsGiven: boolean("hs_medications_given").default(false),
  vitalSignsChecked: boolean("vital_signs_checked").default(false),
  ivLinesSecured: boolean("iv_lines_secured").default(false),
  bladderEmptied: boolean("bladder_emptied").default(false),
  mouthWashGiven: boolean("mouth_wash_given").default(false),
  bathGiven: boolean("bath_given").default(false),
  enemaGiven: boolean("enema_given").default(false),
  theatreDressGiven: boolean("theatre_dress_given").default(false),
  bloodArranged: boolean("blood_arranged").default(false),
  materialsSent: boolean("materials_sent").default(false),
  patientShiftedToOT: boolean("patient_shifted_to_ot").default(false),
  // Completion
  completedBy: varchar("completed_by"),
  completedByName: text("completed_by_name"),
  completedAt: timestamp("completed_at"),
  receivedByOTStaff: text("received_by_ot_staff"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtPreopChecklistSchema = createInsertSchema(otPreopChecklist).omit({ id: true, createdAt: true });
export type InsertOtPreopChecklist = z.infer<typeof insertOtPreopChecklistSchema>;
export type OtPreopChecklist = typeof otPreopChecklist.$inferSelect;

// Pre-Anaesthetic Evaluation (PAE) - Matches hospital template
export const otPreanaestheticEval = pgTable("ot_preanaesthetic_eval", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull(),
  evaluatedBy: varchar("evaluated_by"),
  evaluatedAt: timestamp("evaluated_at"),
  // HISTORY Section (Yes/No fields)
  historyCough: text("history_cough"),
  historyFever: text("history_fever"),
  historyUri: text("history_uri"),
  historyBrAsthma: text("history_br_asthma"),
  historyTuberculosis: text("history_tuberculosis"),
  historyChestPain: text("history_chest_pain"),
  historyPalpitations: text("history_palpitations"),
  historySyncope: text("history_syncope"),
  historyExternalDysponea: text("history_external_dysponea"),
  historyIhdOldAmi: text("history_ihd_old_ami"),
  historyHypertension: text("history_hypertension"),
  historySmoking: text("history_smoking"),
  historyAlcohol: text("history_alcohol"),
  historyTobacco: text("history_tobacco"),
  historyJaundice: text("history_jaundice"),
  historyBleedingTendencies: text("history_bleeding_tendencies"),
  historyDrugAllergy: text("history_drug_allergy"),
  historyPreviousSurgery: text("history_previous_surgery"),
  historyAnyOther: text("history_any_other"),
  // GENERAL EXAMINATION Section 1
  geBuilt: text("ge_built"),
  geFebrile: text("ge_febrile"),
  gePr: text("ge_pr"),
  geBp: text("ge_bp"),
  geRr: text("ge_rr"),
  gePallor: text("ge_pallor"),
  geJvp: text("ge_jvp"),
  geEdema: text("ge_edema"),
  geOralCavityJawOpening: text("ge_oral_cavity_jaw_opening"),
  geTeeth: text("ge_teeth"),
  geNeck: text("ge_neck"),
  geExtension: text("ge_extension"),
  // GENERAL EXAMINATION Section 2
  geCvs: text("ge_cvs"),
  geRs: text("ge_rs"),
  geAbd: text("ge_abd"),
  // INVESTIGATIONS Section
  invHb: text("inv_hb"),
  invBslF: text("inv_bsl_f"),
  invBslPp: text("inv_bsl_pp"),
  invBloodUrea: text("inv_blood_urea"),
  invSrCreatinine: text("inv_sr_creatinine"),
  invEcg: text("inv_ecg"),
  inv2dEcho: text("inv_2d_echo"),
  invCxr: text("inv_cxr"),
  // Anaesthetist Details
  anaesthetistName: text("anaesthetist_name"),
  anaesthetistSignature: text("anaesthetist_signature"),
  paeDate: text("pae_date"),
  paeTime: text("pae_time"),
  fitForSurgery: boolean("fit_for_surgery").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtPreanaestheticEvalSchema = createInsertSchema(otPreanaestheticEval).omit({ id: true, createdAt: true });
export type InsertOtPreanaestheticEval = z.infer<typeof insertOtPreanaestheticEvalSchema>;
export type OtPreanaestheticEval = typeof otPreanaestheticEval.$inferSelect;

// Surgical Safety Checklist (WHO Based)
// Surgical Safety Checklist - Matches hospital template
export const otSafetyChecklist = pgTable("ot_safety_checklist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull(),
  // BEFORE INDUCTION OF ANAESTHESIA
  patientConfirmed: text("patient_confirmed"), // Yes/No/N.A.
  siteMarked: text("site_marked"), // Yes/No/N.A.
  anaesthesiaSafetyCheck: text("anaesthesia_safety_check"), // Yes/No/N.A.
  pulseOxymeter: text("pulse_oxymeter"), // Yes/No/N.A.
  knownAllergy: text("known_allergy"), // Yes/No/N.A.
  difficultAirwayRisk: text("difficult_airway_risk"), // No / Yes and Equipment/Assistance Available
  bloodLossRisk: text("blood_loss_risk"), // No / Yes and adequate intravenous access and Fluids planned
  // BEFORE SKIN INCISION
  teamIntroduced: text("team_introduced"), // Yes/No/N.A.
  verballyConfirmed: text("verbally_confirmed"), // Yes/No/N.A.
  // ANTICIPATED CRITICAL EVENTS
  surgeonReviews: text("surgeon_reviews"), // Yes/No/N.A.
  anaesthesiaTeamReviews: text("anaesthesia_team_reviews"), // Yes/No/N.A.
  nursingTeamReviews: text("nursing_team_reviews"), // Yes/No/N.A.
  antibioticProphylaxis: text("antibiotic_prophylaxis"), // Yes/No/N.A.
  essentialImaging: text("essential_imaging"), // Yes/No/N.A.
  // BEFORE PATIENT LEAVES OPERATING ROOM
  procedureRecorded: text("procedure_recorded"), // Yes/No/N.A.
  instrumentCountCorrect: text("instrument_count_correct"), // Yes/No/N.A.
  specimenLabelled: text("specimen_labelled"), // Yes/No/N.A.
  equipmentProblems: text("equipment_problems"), // Yes/No/N.A.
  recoveryConcernsReviewed: text("recovery_concerns_reviewed"), // Yes/No/N.A.
  // Signatures
  surgeonName: text("surgeon_name"),
  surgeonSignature: text("surgeon_signature"),
  anaesthetistName: text("anaesthetist_name"),
  anaesthetistSignature: text("anaesthetist_signature"),
  otNurseName: text("ot_nurse_name"),
  otNurseSignature: text("ot_nurse_signature"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtSafetyChecklistSchema = createInsertSchema(otSafetyChecklist).omit({ id: true, createdAt: true });
export type InsertOtSafetyChecklist = z.infer<typeof insertOtSafetyChecklistSchema>;
export type OtSafetyChecklist = typeof otSafetyChecklist.$inferSelect;

// Pre-Op Assessment Form
export const otPreopAssessment = pgTable("ot_preop_assessment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull(),
  // Vitals
  temperature: text("temperature"),
  pulse: text("pulse"),
  bloodPressureSystolic: text("blood_pressure_systolic"),
  bloodPressureDiastolic: text("blood_pressure_diastolic"),
  respiratoryRate: text("respiratory_rate"),
  spo2: text("spo2"),
  weight: text("weight"),
  height: text("height"),
  bmi: text("bmi"),
  // Clinical Assessment
  generalCondition: text("general_condition"),
  levelOfConsciousness: text("level_of_consciousness"),
  painScore: integer("pain_score"),
  // Diagnosis
  primaryDiagnosis: text("primary_diagnosis"),
  secondaryDiagnosis: text("secondary_diagnosis"),
  comorbidities: text("comorbidities"),
  // Planned Procedure
  plannedProcedure: text("planned_procedure"),
  side: text("side"), // left, right, bilateral, midline
  specialEquipmentNeeded: text("special_equipment_needed"),
  // Consent
  consentVerified: boolean("consent_verified").default(false),
  consentType: text("consent_type"),
  // Assessment
  assessmentNotes: text("assessment_notes"),
  assessedBy: varchar("assessed_by"),
  assessedByName: text("assessed_by_name"),
  assessmentAt: timestamp("assessment_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtPreopAssessmentSchema = createInsertSchema(otPreopAssessment).omit({ id: true, createdAt: true });
export type InsertOtPreopAssessment = z.infer<typeof insertOtPreopAssessmentSchema>;
export type OtPreopAssessment = typeof otPreopAssessment.$inferSelect;

// Re-Evaluation Form (if patient condition changes)
export const otReEvaluation = pgTable("ot_re_evaluation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull(),
  reasonForReeval: text("reason_for_reeval"),
  changesSinceAssessment: text("changes_since_assessment"),
  newFindings: text("new_findings"),
  revisedPlan: text("revised_plan"),
  fitForSurgery: boolean("fit_for_surgery").default(true),
  postponementReason: text("postponement_reason"),
  reevalBy: varchar("reeval_by"),
  reevalByName: text("reeval_by_name"),
  reevalAt: timestamp("reeval_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtReEvaluationSchema = createInsertSchema(otReEvaluation).omit({ id: true, createdAt: true });
export type InsertOtReEvaluation = z.infer<typeof insertOtReEvaluationSchema>;
export type OtReEvaluation = typeof otReEvaluation.$inferSelect;

// Surgery Informed Consent
export const otConsentSurgery = pgTable("ot_consent_surgery", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull(),
  consentVersion: text("consent_version"),
  procedureName: text("procedure_name"),
  procedureExplanation: text("procedure_explanation"),
  risksExplained: text("risks_explained"),
  alternativesExplained: text("alternatives_explained"),
  additionalProceduresConsent: boolean("additional_procedures_consent").default(false),
  bloodTransfusionConsent: boolean("blood_transfusion_consent").default(false),
  photographyConsent: boolean("photography_consent").default(false),
  teachingConsent: boolean("teaching_consent").default(false),
  patientName: text("patient_name"),
  patientRelationship: text("patient_relationship"), // self, spouse, parent, guardian
  patientSignature: text("patient_signature"),
  patientSignedAt: timestamp("patient_signed_at"),
  witnessName: text("witness_name"),
  witnessSignature: text("witness_signature"),
  doctorId: varchar("doctor_id"),
  doctorName: text("doctor_name"),
  doctorSignature: text("doctor_signature"),
  doctorSignedAt: timestamp("doctor_signed_at"),
  language: text("language").default("english"), // english, hindi, marathi
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtConsentSurgerySchema = createInsertSchema(otConsentSurgery).omit({ id: true, createdAt: true });
export type InsertOtConsentSurgery = z.infer<typeof insertOtConsentSurgerySchema>;
export type OtConsentSurgery = typeof otConsentSurgery.$inferSelect;

// Anaesthesia Informed Consent
export const otConsentAnaesthesia = pgTable("ot_consent_anaesthesia", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull(),
  consentVersion: text("consent_version"),
  anaesthesiaType: text("anaesthesia_type"),
  anaesthesiaExplanation: text("anaesthesia_explanation"),
  risksExplained: text("risks_explained"),
  alternativesExplained: text("alternatives_explained"),
  postOpPainManagementExplained: boolean("postop_pain_management_explained").default(false),
  patientName: text("patient_name"),
  patientRelationship: text("patient_relationship"),
  patientSignature: text("patient_signature"),
  patientSignedAt: timestamp("patient_signed_at"),
  witnessName: text("witness_name"),
  witnessSignature: text("witness_signature"),
  anaesthetistId: varchar("anaesthetist_id"),
  anaesthetistName: text("anaesthetist_name"),
  anaesthetistSignature: text("anaesthetist_signature"),
  anaesthetistSignedAt: timestamp("anaesthetist_signed_at"),
  language: text("language").default("english"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtConsentAnaesthesiaSchema = createInsertSchema(otConsentAnaesthesia).omit({ id: true, createdAt: true });
export type InsertOtConsentAnaesthesia = z.infer<typeof insertOtConsentAnaesthesiaSchema>;
export type OtConsentAnaesthesia = typeof otConsentAnaesthesia.$inferSelect;

// Anaesthesia Record (Intra-Op)
export const otAnaesthesiaRecord = pgTable("ot_anaesthesia_record", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull(),
  anaesthesiaType: text("anaesthesia_type"), // general, spinal, epidural, local, regional, combined
  inductionTime: timestamp("induction_time"),
  intubationTime: timestamp("intubation_time"),
  extubationTime: timestamp("extubation_time"),
  anaesthesiaEndTime: timestamp("anaesthesia_end_time"),
  // Drugs Given (JSON array)
  inductionDrugs: text("induction_drugs"),
  maintenanceDrugs: text("maintenance_drugs"),
  muscleRelaxants: text("muscle_relaxants"),
  analgesics: text("analgesics"),
  antiemetics: text("antiemetics"),
  vasopressors: text("vasopressors"),
  otherDrugs: text("other_drugs"),
  // Airway
  airwayDevice: text("airway_device"), // ETT, LMA, mask
  airwaySize: text("airway_size"),
  intubationAttempts: integer("intubation_attempts"),
  ventilationMode: text("ventilation_mode"),
  tidalVolume: text("tidal_volume"),
  peep: text("peep"),
  // Fluids
  ivFluids: text("iv_fluids"),
  bloodProducts: text("blood_products"),
  estimatedBloodLoss: text("estimated_blood_loss"),
  urineOutput: text("urine_output"),
  // Vitals Trend (stored as JSON time series)
  vitalsTrend: text("vitals_trend"),
  // Monitoring
  monitoringDevices: text("monitoring_devices"),
  invasiveLines: text("invasive_lines"),
  // Complications
  complications: text("complications"),
  interventions: text("interventions"),
  // Notes
  anaesthesistNotes: text("anaesthesist_notes"),
  handoverNotes: text("handover_notes"),
  // Signatures
  anaesthetistId: varchar("anaesthetist_id"),
  anaesthetistName: text("anaesthetist_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtAnaesthesiaRecordSchema = createInsertSchema(otAnaesthesiaRecord).omit({ id: true, createdAt: true });
export type InsertOtAnaesthesiaRecord = z.infer<typeof insertOtAnaesthesiaRecordSchema>;
export type OtAnaesthesiaRecord = typeof otAnaesthesiaRecord.$inferSelect;

// Intra-Operative Time Log
export const otTimeLog = pgTable("ot_time_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull(),
  eventType: text("event_type").notNull(), // PATIENT_IN, ANAESTHESIA_START, INCISION, CRITICAL_EVENT, SPECIMEN_SENT, CLOSURE_START, CLOSURE_END, ANAESTHESIA_END, PATIENT_OUT
  eventTime: timestamp("event_time").notNull(),
  description: text("description"),
  recordedBy: varchar("recorded_by"),
  recordedByName: text("recorded_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtTimeLogSchema = createInsertSchema(otTimeLog).omit({ id: true, createdAt: true });
export type InsertOtTimeLog = z.infer<typeof insertOtTimeLogSchema>;
export type OtTimeLog = typeof otTimeLog.$inferSelect;

// Surgeon Notes (Operative Notes)
export const otSurgeonNotes = pgTable("ot_surgeon_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull(),
  preOpDiagnosis: text("preop_diagnosis"),
  postOpDiagnosis: text("postop_diagnosis"),
  procedurePerformed: text("procedure_performed"),
  indication: text("indication"),
  // Operative Details
  position: text("position"), // supine, prone, lateral, lithotomy
  incision: text("incision"),
  findings: text("findings"),
  procedureSteps: text("procedure_steps"),
  implants: text("implants"),
  // Specimens
  specimens: text("specimens"),
  specimenSentToLab: boolean("specimen_sent_to_lab").default(false),
  // Blood & Fluids
  estimatedBloodLoss: text("estimated_blood_loss"),
  bloodTransfused: text("blood_transfused"),
  fluidBalance: text("fluid_balance"),
  // Drains & Lines
  drainsPlaced: text("drains_placed"),
  cathetersPlaced: text("catheters_placed"),
  // Closure
  closureTechnique: text("closure_technique"),
  sutureMaterial: text("suture_material"),
  skinClosure: text("skin_closure"),
  dressing: text("dressing"),
  // Outcome
  complications: text("complications"),
  outcome: text("outcome"),
  // Post-Op Instructions
  postOpOrders: text("postop_orders"),
  antibiotics: text("antibiotics"),
  painManagement: text("pain_management"),
  dietInstructions: text("diet_instructions"),
  mobilizationPlan: text("mobilization_plan"),
  followUp: text("follow_up"),
  // Signatures
  surgeonId: varchar("surgeon_id"),
  surgeonName: text("surgeon_name"),
  assistantSurgeonName: text("assistant_surgeon_name"),
  dictatedAt: timestamp("dictated_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtSurgeonNotesSchema = createInsertSchema(otSurgeonNotes).omit({ id: true, createdAt: true });
export type InsertOtSurgeonNotes = z.infer<typeof insertOtSurgeonNotesSchema>;
export type OtSurgeonNotes = typeof otSurgeonNotes.$inferSelect;

// Post-Op Assessment
// Post-Operative Assessment - Matches hospital template
export const otPostopAssessment = pgTable("ot_postop_assessment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull(),
  // Operation Details
  operativeProcedure: text("operative_procedure"),
  operationCompletionTime: text("operation_completion_time"),
  // Post Anaesthesia Evaluation (JSON array of entries)
  postAnaesthesiaEval: text("post_anaesthesia_eval"), // JSON: [{time, bp, pulse, rr, spo2, airwayPatency}]
  // Aldrete Scorecard (JSON array of entries)
  aldreteScorecard: text("aldrete_scorecard"), // JSON: [{time, activity, respiration, consciousness, o2Saturation, circulation, totalScore}]
  // Progress Notes
  progressNotes: text("progress_notes"),
  // Discharge Details
  timePatientDischarged: text("time_patient_discharged"),
  timePostOpInstructionGiven: text("time_post_op_instruction_given"),
  // Vital signs at discharge
  dischargeTemp: text("discharge_temp"),
  dischargePulse: text("discharge_pulse"),
  dischargeRr: text("discharge_rr"),
  dischargeBp: text("discharge_bp"),
  // Surgeon/Anesthetist Approval
  surgeonAnaesthetistSign: text("surgeon_anaesthetist_sign"),
  surgeonAnaesthetistDate: text("surgeon_anaesthetist_date"),
  surgeonAnaesthetistTime: text("surgeon_anaesthetist_time"),
  // Recovery Nurse
  recoveryNurseSign: text("recovery_nurse_sign"),
  recoveryNurseDate: text("recovery_nurse_date"),
  recoveryNurseTime: text("recovery_nurse_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtPostopAssessmentSchema = createInsertSchema(otPostopAssessment).omit({ id: true, createdAt: true });
export type InsertOtPostopAssessment = z.infer<typeof insertOtPostopAssessmentSchema>;
export type OtPostopAssessment = typeof otPostopAssessment.$inferSelect;

// Post-Op Monitoring Chart
export const otMonitoringChart = pgTable("ot_monitoring_chart", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull(),
  recordTime: timestamp("record_time").notNull(),
  // Vitals
  temperature: text("temperature"),
  pulse: text("pulse"),
  bloodPressureSystolic: text("blood_pressure_systolic"),
  bloodPressureDiastolic: text("blood_pressure_diastolic"),
  respiratoryRate: text("respiratory_rate"),
  spo2: text("spo2"),
  painScore: integer("pain_score"),
  // Consciousness
  consciousnessLevel: text("consciousness_level"),
  pupilReaction: text("pupil_reaction"),
  // Intake/Output
  ivFluidIntake: text("iv_fluid_intake"),
  oralIntake: text("oral_intake"),
  urineOutput: text("urine_output"),
  drainOutput: text("drain_output"),
  // Wound
  woundCondition: text("wound_condition"),
  dressingCondition: text("dressing_condition"),
  // Flags
  hypotensionFlag: boolean("hypotension_flag").default(false),
  bleedingFlag: boolean("bleeding_flag").default(false),
  respiratoryDistressFlag: boolean("respiratory_distress_flag").default(false),
  painUncontrolledFlag: boolean("pain_uncontrolled_flag").default(false),
  // Notes
  notes: text("notes"),
  interventions: text("interventions"),
  recordedBy: varchar("recorded_by"),
  recordedByName: text("recorded_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtMonitoringChartSchema = createInsertSchema(otMonitoringChart).omit({ id: true, createdAt: true });
export type InsertOtMonitoringChart = z.infer<typeof insertOtMonitoringChartSchema>;
export type OtMonitoringChart = typeof otMonitoringChart.$inferSelect;

// Labour Chart (for obstetric surgeries)
export const otLabourChart = pgTable("ot_labour_chart", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull(),
  recordTime: timestamp("record_time").notNull(),
  // Labour Stage
  labourStage: text("labour_stage"), // 1st, 2nd, 3rd
  cervicalDilation: text("cervical_dilation"),
  cervicalEffacement: text("cervical_effacement"),
  fetalStation: text("fetal_station"),
  // Contractions
  contractionFrequency: text("contraction_frequency"),
  contractionDuration: text("contraction_duration"),
  contractionIntensity: text("contraction_intensity"),
  // Fetal Monitoring
  fetalHeartRate: text("fetal_heart_rate"),
  fetalHeartRateVariability: text("fhr_variability"),
  decelerations: text("decelerations"),
  // Maternal Vitals
  maternalPulse: text("maternal_pulse"),
  maternalBP: text("maternal_bp"),
  maternalTemp: text("maternal_temp"),
  // Membranes
  membraneStatus: text("membrane_status"), // intact, ruptured
  ruptureTime: timestamp("rupture_time"),
  amnioticFluidColor: text("amniotic_fluid_color"),
  // Interventions
  interventions: text("interventions"),
  medications: text("medications"),
  notes: text("notes"),
  recordedBy: varchar("recorded_by"),
  recordedByName: text("recorded_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtLabourChartSchema = createInsertSchema(otLabourChart).omit({ id: true, createdAt: true });
export type InsertOtLabourChart = z.infer<typeof insertOtLabourChartSchema>;
export type OtLabourChart = typeof otLabourChart.$inferSelect;

// Neonate Sheet (for deliveries)
// Assessment Sheet for Neonate - Matches hospital template
export const otNeonateSheet = pgTable("ot_neonate_sheet", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull(),
  // Mother & Baby Details
  mothersName: text("mothers_name"),
  sex: text("sex"), // M or F
  gestationalAge: text("gestational_age"),
  mothersBloodGroup: text("mothers_blood_group"),
  birthTime: text("birth_time"),
  birthWeight: text("birth_weight"),
  riskFactorsInMother: text("risk_factors_in_mother"),
  modeOfDelivery: text("mode_of_delivery"), // Planned / Emergency
  durationOfLeaking: text("duration_of_leaking"),
  reasonForIntervention: text("reason_for_intervention"),
  anaesthesiaUsed: text("anaesthesia_used"), // Spinal / General / Epidural
  // Investigation Sent
  invBloodGroup: text("inv_blood_group"), // Yes / No / Sample Problem
  invG6pd: text("inv_g6pd"), // Yes / No / Sample Problem
  invTsh: text("inv_tsh"), // Yes / No / Sample Problem
  // Resuscitation Notes
  resuscO2: text("resusc_o2"), // Given / Not Given
  resuscBagMaskVentilation: text("resusc_bag_mask_ventilation"),
  resuscOthers: text("resusc_others"),
  // APGAR Scores
  apgarAt1Min: text("apgar_at_1_min"),
  apgarAt5Min: text("apgar_at_5_min"),
  // On Examination
  examHr: text("exam_hr"),
  examRr: text("exam_rr"),
  examUmbilicalCord: text("exam_umbilical_cord"),
  examFemoralPulses: text("exam_femoral_pulses"),
  examSkullAndSpine: text("exam_skull_and_spine"),
  examLipsAndOralCavity: text("exam_lips_and_oral_cavity"),
  examAnalOpening: text("exam_anal_opening"),
  examLimbsAndHips: text("exam_limbs_and_hips"),
  examRs: text("exam_rs"),
  examCvs: text("exam_cvs"),
  examPa: text("exam_pa"),
  examCns: text("exam_cns"),
  examCry: text("exam_cry"),
  examSuck: text("exam_suck"),
  examTone: text("exam_tone"),
  examGrasp: text("exam_grasp"),
  examActivity: text("exam_activity"),
  // Treatment and Delivery
  treatmentToBeGiven: text("treatment_to_be_given"),
  deliveryAttendedByDr: text("delivery_attended_by_dr"),
  signatureDate: text("signature_date"),
  // Recording Info
  recordedBy: varchar("recorded_by"),
  recordedByName: text("recorded_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtNeonateSheetSchema = createInsertSchema(otNeonateSheet).omit({ id: true, createdAt: true });
export type InsertOtNeonateSheet = z.infer<typeof insertOtNeonateSheetSchema>;
export type OtNeonateSheet = typeof otNeonateSheet.$inferSelect;

// OT Audit Log
export const otAuditLog = pgTable("ot_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull(),
  entityType: text("entity_type").notNull(), // case, consent, checklist, etc.
  entityId: varchar("entity_id"),
  action: text("action").notNull(), // CREATE, UPDATE, VIEW, PRINT, SIGN
  fieldChanged: text("field_changed"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  metadata: text("metadata"),
  userId: varchar("user_id").notNull(),
  userName: text("user_name"),
  userRole: text("user_role"),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
})

export const insertOtAuditLogSchema = createInsertSchema(otAuditLog).omit({ id: true, timestamp: true });
export type InsertOtAuditLog = z.infer<typeof insertOtAuditLogSchema>;
export type OtAuditLog = typeof otAuditLog.$inferSelect;

// IPD Care Plan - Comprehensive care plan for admitted patients
export const ipdCarePlans = pgTable("ipd_care_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(), // Link to patient_monitoring_sessions
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  uhid: text("uhid"),
  age: integer("age"),
  sex: text("sex"),
  ipdNo: text("ipd_no"),
  ward: text("ward"),
  bedNo: text("bed_no"),
  provisionalDiagnosis: text("provisional_diagnosis"),
  carePlanDetails: text("care_plan_details"), // Curative, Preventive, Promotive, Rehabilitative aspects
  treatmentAdvised: text("treatment_advised"),
  investigationsAdvised: text("investigations_advised"),
  referralDepartments: text("referral_departments"), // JSON array of selected departments
  consultantNotesLog: text("consultant_notes_log"), // JSON array of {dateTime, notes} for inline notes
  departmentSpecialty: text("department_specialty"),
  treatingConsultantId: varchar("treating_consultant_id"),
  treatingConsultantName: text("treating_consultant_name"),
  consultantSignature: text("consultant_signature"),
  planDate: timestamp("plan_date").defaultNow(),
  planTime: text("plan_time"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIpdCarePlanSchema = createInsertSchema(ipdCarePlans).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertIpdCarePlan = z.infer<typeof insertIpdCarePlanSchema>;
export type IpdCarePlan = typeof ipdCarePlans.$inferSelect;

// IPD Care Plan Consultant Notes - Log of consultant notes over time
export const ipdCarePlanNotes = pgTable("ipd_care_plan_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  carePlanId: varchar("care_plan_id").notNull(), // Link to ipd_care_plans
  sessionId: varchar("session_id").notNull(),
  noteDate: timestamp("note_date").defaultNow(),
  noteTime: text("note_time"),
  consultantNotes: text("consultant_notes"),
  consultantId: varchar("consultant_id"),
  consultantName: text("consultant_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIpdCarePlanNotesSchema = createInsertSchema(ipdCarePlanNotes).omit({ id: true, createdAt: true });
export type InsertIpdCarePlanNotes = z.infer<typeof insertIpdCarePlanNotesSchema>;
export type IpdCarePlanNotes = typeof ipdCarePlanNotes.$inferSelect;

// IPD Initial Assessment Form - Comprehensive admission assessment
export const ipdInitialAssessment = pgTable("ipd_initial_assessment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name"),
  uhid: text("uhid"),
  age: integer("age"),
  sex: text("sex"),
  ipdNo: text("ipd_no"),
  ward: text("ward"),
  bedNo: text("bed_no"),
  
  // Basic Info
  patientReceivedDate: timestamp("patient_received_date"),
  patientReceivedTime: text("patient_received_time"),
  patientAccompaniedBy: text("patient_accompanied_by"), // Relatives/Self
  contactNo: text("contact_no"),
  allergies: text("allergies"), // Yes/No
  allergiesDetails: text("allergies_details"),
  vulnerable: text("vulnerable"), // Yes/No
  vulnerableDetails: text("vulnerable_details"),
  previousAdmission: text("previous_admission"), // Yes/No
  previousAdmissionUnderWhom: text("previous_admission_under_whom"),
  mlcDone: text("mlc_done"), // Yes/No
  mlcNo: text("mlc_no"),
  painScore: integer("pain_score"), // 0-10
  
  // Complaints & History (JSON: [{complaint, originDuration}])
  complaintsHistory: text("complaints_history"),
  
  // Medical History (JSON with Yes/No and Since When)
  hypertension: text("hypertension"),
  hypertensionSince: text("hypertension_since"),
  diabetes: text("diabetes"),
  diabetesSince: text("diabetes_since"),
  coronaryArteryDisease: text("coronary_artery_disease"),
  coronaryArteryDiseaseSince: text("coronary_artery_disease_since"),
  cerebroVascularDisease: text("cerebro_vascular_disease"),
  cerebroVascularDiseaseSince: text("cerebro_vascular_disease_since"),
  copdBronchialAsthma: text("copd_bronchial_asthma"),
  copdBronchialAsthmaSince: text("copd_bronchial_asthma_since"),
  tuberculosis: text("tuberculosis"),
  tuberculosisSince: text("tuberculosis_since"),
  otherMedicalIllness: text("other_medical_illness"),
  otherMedicalIllnessSince: text("other_medical_illness_since"),
  
  // Surgical History (JSON: [{procedure, when, complications}])
  surgicalHistory: text("surgical_history"),
  surgicalHistoryNote: text("surgical_history_note"),
  
  // Personal History
  smoking: text("smoking"),
  alcohol: text("alcohol"),
  tobaccoChewing: text("tobacco_chewing"),
  dietType: text("diet_type"), // Veg/Non-veg
  otherAddictions: text("other_addictions"),
  
  // Family History
  familyHypertension: text("family_hypertension"),
  familyDiabetes: text("family_diabetes"),
  familyIhd: text("family_ihd"),
  familyCva: text("family_cva"),
  familyCopdAsthma: text("family_copd_asthma"),
  familyTuberculosis: text("family_tuberculosis"),
  familyOtherSpecify: text("family_other_specify"),
  
  // Menstrual & Obstetric History
  menstrualCycle: text("menstrual_cycle"), // Regular/Irregular
  gpla: text("gpla"),
  lmp: text("lmp"),
  tubectomy: text("tubectomy"), // Done/Not Done
  edd: text("edd"),
  menarcheAge: text("menarche_age"),
  
  // Glasgow Coma Scale
  gcsEyeOpening: integer("gcs_eye_opening"), // 1-4
  gcsMotorResponse: integer("gcs_motor_response"), // 1-6
  gcsVerbalResponse: integer("gcs_verbal_response"), // 1-5
  gcsTotal: integer("gcs_total"), // /15
  
  // General Examination
  conscious: boolean("conscious"),
  oriented: boolean("oriented"),
  disoriented: boolean("disoriented"),
  pulseRate: text("pulse_rate"),
  bloodPressure: text("blood_pressure"),
  respiratoryRate: text("respiratory_rate"),
  rbs: text("rbs"),
  temperature: text("temperature"),
  weight: text("weight"),
  height: text("height"),
  bmi: text("bmi"),
  pallor: text("pallor"),
  icterus: text("icterus"),
  cyanosis: text("cyanosis"),
  clubbing: text("clubbing"),
  lymphadinopathy: text("lymphadinopathy"),
  oedema: text("oedema"),
  jvp: text("jvp"),
  heent: text("heent"), // Head/Eyes/Ears/Nose/Throat/Skin
  
  // Systemic Examination
  cvs: text("cvs"),
  rs: text("rs"),
  pa: text("pa"),
  cns: text("cns"),
  localExamination: text("local_examination"),
  
  // Special Examinations (status: Done/Declined/Not Indicated)
  rectalExamination: text("rectal_examination"),
  rectalExaminationStatus: text("rectal_examination_status"),
  breastExamination: text("breast_examination"),
  breastExaminationStatus: text("breast_examination_status"),
  pelvicExamination: text("pelvic_examination"),
  pelvicExaminationStatus: text("pelvic_examination_status"),
  woundExamination: text("wound_examination"),
  woundExaminationStatus: text("wound_examination_status"),
  
  // Investigation Advised (JSON: {cbc, esr, urineRM, rft, lft, rbs, fbs, ppbs, electrolyte, lipidProfile, bloodCS, urineCS, hbsAg, hiv, tsh, t3t4, hba1c, sCreatinine, others})
  investigationsAdvised: text("investigations_advised"),
  investigationsOthers: text("investigations_others"),
  
  // Provisional Diagnosis & Treatment
  provisionalDiagnosis: text("provisional_diagnosis"),
  treatment: text("treatment"),
  
  // Assessment Finished
  clinicalAssistantName: text("clinical_assistant_name"),
  clinicalAssistantSignature: text("clinical_assistant_signature"),
  clinicalAssistantDate: timestamp("clinical_assistant_date"),
  clinicalAssistantTime: text("clinical_assistant_time"),
  inchargeConsultantName: text("incharge_consultant_name"),
  inchargeConsultantSignature: text("incharge_consultant_signature"),
  inchargeConsultantDate: timestamp("incharge_consultant_date"),
  inchargeConsultantTime: text("incharge_consultant_time"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by"),
});

export const insertIpdInitialAssessmentSchema = createInsertSchema(ipdInitialAssessment).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertIpdInitialAssessment = z.infer<typeof insertIpdInitialAssessmentSchema>;
export type IpdInitialAssessment = typeof ipdInitialAssessment.$inferSelect;

// Indoor Consultation Sheet (Daily Progress Notes)
export const indoorConsultationSheet = pgTable("indoor_consultation_sheet", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name"),
  ipdNo: text("ipd_no"),
  ward: text("ward"),
  inChargeDoctor: text("in_charge_doctor"),
  
  // Entry fields
  entryDate: timestamp("entry_date").defaultNow(),
  entryTime: text("entry_time"),
  clinicalFindings: text("clinical_findings"), // Clinical Findings / Daily Progress Notes
  orders: text("orders"),
  
  recordedBy: text("recorded_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by"),
});

export const insertIndoorConsultationSheetSchema = createInsertSchema(indoorConsultationSheet).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertIndoorConsultationSheet = z.infer<typeof insertIndoorConsultationSheetSchema>;
export type IndoorConsultationSheet = typeof indoorConsultationSheet.$inferSelect;

// Doctor's Progress Sheet
export const doctorsProgressSheet = pgTable("doctors_progress_sheet", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name"),
  prnNo: text("prn_no"),
  age: text("age"),
  sex: text("sex"),
  ipdNo: text("ipd_no"),
  ward: text("ward"),
  bedNo: text("bed_no"),
  primaryConsultantName: text("primary_consultant_name"),
  
  // Entry fields - each row in the progress table
  entryDateTime: timestamp("entry_date_time").defaultNow(),
  investigationsAdvised: text("investigations_advised"),
  clinicalNotes: text("clinical_notes"),
  treatmentAdvised: text("treatment_advised"),
  treatmentConsultantName: text("treatment_consultant_name"),
  
  // Footer fields
  daysKeynotes: text("days_keynotes"),
  counsellingDoneByRmo: text("counselling_done_by_rmo"),
  counsellingDoneByConsultant: text("counselling_done_by_consultant"),
  relativePatientSign: text("relative_patient_sign"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by"),
});

export const insertDoctorsProgressSheetSchema = createInsertSchema(doctorsProgressSheet).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDoctorsProgressSheet = z.infer<typeof insertDoctorsProgressSheetSchema>;
export type DoctorsProgressSheet = typeof doctorsProgressSheet.$inferSelect;

// Doctor's Visit Sheet Table
export const doctorsVisitSheet = pgTable("doctors_visit_sheet", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name"),
  prnNo: text("prn_no"),
  age: text("age"),
  sex: text("sex"),
  ipdNo: text("ipd_no"),
  ward: text("ward"),
  bedNo: text("bed_no"),
  
  // Visit entry fields
  visitDate: timestamp("visit_date"),
  visitTime: text("visit_time"),
  nameOfDoctor: text("name_of_doctor"),
  visitType: text("visit_type"), // "routine" or "emergency"
  procedure: text("procedure"),
  doctorSign: text("doctor_sign"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by"),
});

export const insertDoctorsVisitSheetSchema = createInsertSchema(doctorsVisitSheet).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDoctorsVisitSheet = z.infer<typeof insertDoctorsVisitSheetSchema>;
export type DoctorsVisitSheet = typeof doctorsVisitSheet.$inferSelect;

// Surgery Notes Table
export const surgeryNotes = pgTable("surgery_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name"),
  prnNo: text("prn_no"),
  age: text("age"),
  sex: text("sex"),
  ipdNo: text("ipd_no"),
  ward: text("ward"),
  bedNo: text("bed_no"),
  
  // Surgery details
  doctorName: text("doctor_name"),
  mrn: text("mrn"),
  surgeryDate: timestamp("surgery_date"),
  nameOfSurgeon: text("name_of_surgeon"),
  preoperativeDiagnosis: text("preoperative_diagnosis"),
  surgeryPlanned: text("surgery_planned"),
  surgeryPerformed: text("surgery_performed"),
  surgeonName: text("surgeon_name"),
  assistant1: text("assistant_1"),
  assistant2: text("assistant_2"),
  typeOfAnaesthesia: text("type_of_anaesthesia"),
  anaesthetist1: text("anaesthetist_1"),
  anaesthetist2: text("anaesthetist_2"),
  operationStartedAt: text("operation_started_at"),
  operationCompletedAt: text("operation_completed_at"),
  operationNotes: text("operation_notes"),
  
  // Page 2 fields
  otherRelevantDetails: text("other_relevant_details"),
  bloodLoss: text("blood_loss"),
  postopVitalsPulse: text("postop_vitals_pulse"),
  postopVitalsBp: text("postop_vitals_bp"),
  postopVitalsSpo2: text("postop_vitals_spo2"),
  shiftPatientTo: text("shift_patient_to"),
  bloodTransfusion: text("blood_transfusion"), // "to_be_given" or "not_to_be_given"
  tissueSubjectForHpe: boolean("tissue_subject_for_hpe").default(false),
  surgeonSign: text("surgeon_sign"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by"),
});

export const insertSurgeryNotesSchema = createInsertSchema(surgeryNotes).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSurgeryNotes = z.infer<typeof insertSurgeryNotesSchema>;
export type SurgeryNotes = typeof surgeryNotes.$inferSelect;

// Nursing Progress Sheet - IPD Monitoring
export const nursingProgressSheet = pgTable("nursing_progress_sheet", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  patientId: varchar("patient_id"),
  patientName: varchar("patient_name"),
  prnNo: varchar("prn_no"),
  age: varchar("age"),
  sex: varchar("sex"),
  ipdNo: varchar("ipd_no"),
  ward: varchar("ward"),
  bedNo: varchar("bed_no"),
  allergicTo: text("allergic_to"),
  entryDateTime: timestamp("entry_date_time").defaultNow(),
  progressNotes: text("progress_notes"),
  signatureName: varchar("signature_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by"),
});

export const insertNursingProgressSheetSchema = createInsertSchema(nursingProgressSheet).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNursingProgressSheet = z.infer<typeof insertNursingProgressSheetSchema>;
export type NursingProgressSheet = typeof nursingProgressSheet.$inferSelect;

// Nursing Assessment & Care Plan - IPD Monitoring (Comprehensive Form)
export const nursingAssessmentCarePlan = pgTable("nursing_assessment_care_plan", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  patientId: varchar("patient_id"),
  
  // General Information (Image 1)
  patientReceivedDate: timestamp("patient_received_date"),
  patientReceivedTime: text("patient_received_time"),
  provisionalDiagnosis: text("provisional_diagnosis"),
  generalConsentSigned: text("general_consent_signed"), // Yes/No
  modeOfAccess: text("mode_of_access"), // Walking/Wheelchairs/Stretchers/Other
  patientAccompanied: text("patient_accompanied"), // Yes/No
  accompaniedName: text("accompanied_name"),
  vulnerable: text("vulnerable"), // Yes/No
  relation: text("relation"),
  contactNo: text("contact_no"),
  allergies: text("allergies"), // DRUG/FOOD/OTHER - JSON
  
  // Vital Signs
  temperature: text("temperature"),
  pulse: text("pulse"),
  breathsPerMin: text("breaths_per_min"),
  bp: text("bp"),
  respiratoryRate: text("respiratory_rate"),
  height: text("height"),
  weight: text("weight"),
  
  // A. Patient History (Yes/No for each)
  patientHistory: text("patient_history"), // JSON: {hypertension, diabetes, coronaryArteryDisease, cerebroVascularDisease, copdBronchialAsthma, tuberculosis, anyOther}
  
  // B. Functional Status (Independent/Assistance/Dependent)
  functionalStatus: text("functional_status"), // JSON: {walking, eating, bathing, dressing, toiletNeeds}
  
  // C. Orientation to Patient Environment (checkboxes)
  patientEnvironment: text("patient_environment"), // JSON array
  
  // D. Current Medication table
  currentMedications: text("current_medications"), // JSON array of {srNo, name, dose, frequency, dateTimeLastDose}
  medicinesBroughtToHospital: text("medicines_brought_to_hospital"), // Yes/No
  medicinesDisposition: text("medicines_disposition"), // Sent Home/Other Placement
  
  // Image 2 - Morse Fall Risk Assessment
  morseFallRiskScore: text("morse_fall_risk_score"),
  historyOfFall: text("history_of_fall"), // Yes/No
  secondaryDiagnosis: text("secondary_diagnosis"), // Yes/No
  ambulatoryAid: text("ambulatory_aid"), // Furniture/Crutches/cane/walker/None/Bed Rest/Wheelchair
  peripheryCentralLine: text("periphery_central_line"), // Yes/No
  gait: text("gait"), // No/Impaired/Weak
  mentalStatus: text("mental_status"), // Normal/Gesture Limitations/Oriented to own ability
  
  // Skin Assessment / Braden Scale
  bradenScaleTotal: text("braden_scale_total"),
  sensoryPerception: text("sensory_perception"), // 1-4
  degreeOfActivity: text("degree_of_activity"), // 1-4
  nutrition: text("nutrition"), // 1-4
  moisture: text("moisture"), // 1-4
  mobility: text("mobility"), // 1-4
  shearFriction: text("shear_friction"), // 1-3
  
  // Systemic Review (Y/N for each)
  neurologicalReview: text("neurological_review"), // JSON
  cardiovascularReview: text("cardiovascular_review"), // JSON
  urinaryReview: text("urinary_review"), // JSON
  respiratoryReview: text("respiratory_review"), // JSON
  gastroIntestinalReview: text("gastro_intestinal_review"), // JSON
  skinReview: text("skin_review"), // JSON
  
  // Image 3 - Communication
  vision: text("vision"), // OK/Impaired
  hearing: text("hearing"), // OK/Impaired
  languages: text("languages"),
  speech: text("speech"), // OK/Impaired
  obey: text("obey"), // OK/Impaired
  
  // Wounds
  woundsUlcerBedSore: text("wounds_ulcer_bed_sore"),
  woundsLocation: text("wounds_location"),
  woundsStage: text("wounds_stage"), // 1-4
  
  // Pain Score
  painScore: text("pain_score"), // 0-10
  
  // Patients Having Devices
  patientDevices: text("patient_devices"), // JSON: {centralLine, urethralCatheter, peripheralLine, rt, ventilation, lanfusion}
  
  // Nursing Care Documentation - Nutritional
  nutritionalAssessment: text("nutritional_assessment"), // JSON
  nutritionalScore: text("nutritional_score"),
  
  // Personal Hygiene (M/E/N shifts)
  personalHygiene: text("personal_hygiene"), // JSON: {bedBath, hairWash, eyeCare}
  dressingChange: text("dressing_change"),
  
  // Medication
  ivFluide: text("iv_fluide"),
  injection: text("injection"),
  medicine: text("medicine"),
  investigation: text("investigation"),
  
  // Blood Transfusion
  bloodGroup: text("blood_group"),
  previousBTReceived: text("previous_bt_received"), // Yes/No
  btStartTime: text("bt_start_time"),
  btFinishTime: text("bt_finish_time"),
  btName: text("bt_name"),
  btStaffNurse: text("bt_staff_nurse"),
  btRmoName: text("bt_rmo_name"),
  
  // Image 4 - Nursing Care Shifts
  nursingCareShifts: text("nursing_care_shifts"), // JSON: {mouthCare, backCare, positionChange, chestLimbPhysio, foleysCathCare, suction} each with morning/evening/night times and signs
  
  // Nursing Observations, Intervention, Remarks
  nursingObservations: text("nursing_observations"),
  nursingIntervention: text("nursing_intervention"),
  specificNeedsRemarks: text("specific_needs_remarks"),
  
  // Final Section
  admittingStaffNurse: text("admitting_staff_nurse"),
  empId: text("emp_id"),
  assessmentCompletingDate: timestamp("assessment_completing_date"),
  assessmentCompletingTime: text("assessment_completing_time"),
  signature: text("signature"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by"),
});

export const insertNursingAssessmentCarePlanSchema = createInsertSchema(nursingAssessmentCarePlan).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNursingAssessmentCarePlan = z.infer<typeof insertNursingAssessmentCarePlanSchema>;
export type NursingAssessmentCarePlan = typeof nursingAssessmentCarePlan.$inferSelect;
