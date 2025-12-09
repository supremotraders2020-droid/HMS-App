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
  patientName: text("patient_name").notNull(),
  patientPhone: text("patient_phone").notNull(),
  patientEmail: text("patient_email"),
  doctorId: varchar("doctor_id").notNull(),
  appointmentDate: text("appointment_date").notNull(),
  timeSlot: text("time_slot").notNull(),
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertServicePatientSchema = createInsertSchema(servicePatients).omit({
  id: true,
  createdAt: true,
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
  address: text("address").notNull().default("sane chowk, Nair Colony, More Vasti, Chikhali, Pimpri-Chinchwad, Maharashtra 411062"),
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
  patientId: varchar("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  doctorId: varchar("doctor_id").notNull(),
  doctorName: text("doctor_name").notNull(),
  diagnosis: text("diagnosis").notNull(),
  medicines: text("medicines").array().notNull(), // Array of medicine strings like "Amlodipine 5mg - Once daily"
  instructions: text("instructions"),
  prescriptionDate: text("prescription_date").notNull(),
  followUpDate: text("follow_up_date"),
  status: text("status").notNull().default("active"), // 'active', 'completed', 'cancelled'
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
