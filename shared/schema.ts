import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Role Enum
export const userRoleEnum = pgEnum("user_role", ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "PATIENT"]);

// Inventory Enums
export const inventoryCategoryEnum = pgEnum("inventory_category", ["disposables", "syringes", "gloves", "medicines", "equipment"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["ISSUE", "RETURN", "DISPOSE"]);
export const staffRoleEnum = pgEnum("staff_role", ["doctor", "nurse", "technician", "pharmacist", "administrator"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("PATIENT"),
  name: text("name"),
  email: text("email"),
});

const validRoles = ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "PATIENT"] as const;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  name: true,
  email: true,
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
  notes: text("notes"),
});

export const insertTrackingPatientSchema = createInsertSchema(trackingPatients).omit({
  id: true,
  admissionDate: true,
  status: true,
});
export type InsertTrackingPatient = z.infer<typeof insertTrackingPatientSchema>;
export type TrackingPatient = typeof trackingPatients.$inferSelect;

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
  knownAllergies: text("known_allergies"),
  pastMedicalHistory: text("past_medical_history"),
  medicines: text("medicines").array().notNull(), // Array of medicine strings like "Amlodipine 5mg - Once daily"
  medicineDetails: text("medicine_details"), // JSON array with detailed medicine info
  instructions: text("instructions"),
  dietAdvice: text("diet_advice"),
  activityAdvice: text("activity_advice"),
  investigations: text("investigations"),
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
