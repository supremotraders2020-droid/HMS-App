import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Inventory Enums
export const inventoryCategoryEnum = pgEnum("inventory_category", ["disposables", "syringes", "gloves", "medicines", "equipment"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["ISSUE", "RETURN", "DISPOSE"]);
export const staffRoleEnum = pgEnum("staff_role", ["doctor", "nurse", "technician", "pharmacist", "administrator"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

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
  room: text("room").notNull(),
  diagnosis: text("diagnosis").notNull(),
  admissionDate: timestamp("admission_date").notNull().defaultNow(),
  status: text("status").notNull().default("admitted"),
  doctor: text("doctor").notNull(),
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
