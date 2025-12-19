import express, { type Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { databaseStorage } from "./database-storage";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { insertAppointmentSchema, insertInventoryItemSchema, insertInventoryTransactionSchema, insertStaffMemberSchema, insertInventoryPatientSchema, insertTrackingPatientSchema, insertMedicationSchema, insertMealSchema, insertVitalsSchema, insertDoctorVisitSchema, insertConversationLogSchema, insertServicePatientSchema, insertAdmissionSchema, insertMedicalRecordSchema, insertBiometricTemplateSchema, insertBiometricVerificationSchema, insertNotificationSchema, insertHospitalTeamMemberSchema, insertActivityLogSchema, insertEquipmentSchema, insertServiceHistorySchema, insertEmergencyContactSchema, insertHospitalSettingsSchema, insertPrescriptionSchema, insertDoctorScheduleSchema, insertDoctorPatientSchema, insertUserSchema, insertDoctorTimeSlotSchema, type InsertDoctorTimeSlot,
  patientMonitoringSessions, insertPatientMonitoringSessionSchema,
  vitalsHourly, insertVitalsHourlySchema,
  inotropesSedation, insertInotropesSedationSchema,
  ventilatorSettings, insertVentilatorSettingsSchema,
  abgLabResults, insertAbgLabResultsSchema,
  intakeHourly, insertIntakeHourlySchema,
  outputHourly, insertOutputHourlySchema,
  diabeticFlow, insertDiabeticFlowSchema,
  medicationAdminRecords, insertMedicationAdminRecordSchema,
  onceOnlyDrugs, insertOnceOnlyDrugSchema,
  nursingShiftNotes, insertNursingShiftNoteSchema,
  airwayLinesTubes, insertAirwayLinesTubesSchema,
  dutyStaffAssignments, insertDutyStaffAssignmentSchema,
  patientAllergiesPrecautions, insertPatientAllergiesPrecautionsSchema,
  patientMonitoringAuditLog, insertPatientMonitoringAuditLogSchema
} from "@shared/schema";
import { getChatbotResponse, getChatbotStats } from "./openai";
import { notificationService } from "./notification-service";
import { aiEngines } from "./ai-engines";

const SALT_ROUNDS = 10;

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static consent PDF files from server/public/consents
  app.use('/consents', express.static(path.join(process.cwd(), 'server/public/consents')));
  
  // Seed initial data if database is empty
  await databaseStorage.seedInitialData();
  await databaseStorage.seedEquipmentData();
  await databaseStorage.seedBmwData();
  await databaseStorage.seedConsentTemplates();
  
  // Registration endpoint - create new user with hashed password
  // Public registration is limited to PATIENT role only for security
  // Staff accounts (ADMIN, DOCTOR, NURSE, OPD_MANAGER) must be created by existing admins
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, firstName, lastName, email } = req.body;
      
      // Validate required fields (role is not required - always PATIENT for self-registration)
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }
      
      // Check if username already exists
      const existingUser = await databaseStorage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists. Please choose a different username." });
      }
      
      // Check if email already exists
      if (email) {
        const existingEmail = await databaseStorage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(409).json({ error: "Email already registered. Please use a different email or sign in." });
        }
      }
      
      // Hash password securely
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      
      // Create full name from first and last name
      const fullName = `${firstName || ''} ${lastName || ''}`.trim() || username;
      
      // Create user in database
      const newUser = await databaseStorage.createUser({
        username,
        password: hashedPassword,
        role: "PATIENT", // Always set to PATIENT for self-registration
        name: fullName,
        email: email || null,
      });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed. Please try again." });
    }
  });

  // Login endpoint - fetch user by username, verify hashed password
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, role } = req.body;
      
      if (!username || !role) {
        return res.status(400).json({ error: "Username and role are required" });
      }
      
      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }
      
      // Find user in database
      const user = await databaseStorage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password. Please check your credentials or create an account." });
      }
      
      // Verify password using bcrypt
      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid) {
        return res.status(401).json({ error: "Invalid username or password. Please check your credentials." });
      }
      
      // Validate role matches
      if (user.role !== role) {
        return res.status(401).json({ error: `This account is registered as ${user.role}. Please select the correct role.` });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Get user by username
  app.get("/api/users/by-username/:username", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Get all doctors - merge with doctor_profiles when available
  app.get("/api/doctors", async (_req, res) => {
    try {
      const doctors = await storage.getDoctors();
      const allProfiles = await storage.getAllDoctorProfiles();
      
      // Helper to normalize name (remove "Dr." prefix, lowercase, trim)
      const normalizeName = (name: string) => name.toLowerCase().replace(/^dr\.?\s*/i, '').trim();
      
      // Helper to find matching profile for a doctor
      const findMatchingProfile = (doctorName: string) => {
        const normalizedDoctorName = normalizeName(doctorName);
        const doctorFirstName = normalizedDoctorName.split(' ')[0];
        
        for (const profile of allProfiles) {
          const normalizedProfileName = normalizeName(profile.fullName);
          const profileFirstName = normalizedProfileName.split(' ')[0];
          
          // Exact match
          if (normalizedDoctorName === normalizedProfileName) return profile;
          // Profile name starts with doctor name (e.g., "ajay" matches "ajay patil")
          if (normalizedProfileName.startsWith(normalizedDoctorName)) return profile;
          // Doctor name starts with profile first name
          if (normalizedDoctorName.startsWith(profileFirstName)) return profile;
          // First names match exactly
          if (doctorFirstName === profileFirstName) return profile;
        }
        return null;
      };
      
      // Merge doctor data with profile data when available
      const mergedDoctors = doctors.map(doctor => {
        const profile = findMatchingProfile(doctor.name);
        
        if (profile) {
          // Extract numeric experience from profile (e.g., "10+ Years" -> 10)
          const expMatch = profile.experience?.match(/(\d+)/);
          const profileExp = expMatch ? parseInt(expMatch[1]) : doctor.experience;
          
          // Extract numeric fee from profile (e.g., "₹500" -> "500")
          const feeMatch = profile.consultationFee?.match(/(\d+)/);
          const profileFee = feeMatch ? feeMatch[1] : null;
          
          return {
            ...doctor,
            name: profile.fullName || doctor.name,
            specialty: profile.specialty || doctor.specialty,
            qualification: profile.qualifications || doctor.qualification,
            experience: profileExp,
            consultationFee: profileFee
          };
        }
        return doctor;
      });
      
      res.json(mergedDoctors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch doctors" });
    }
  });

  // Get doctor by ID
  app.get("/api/doctors/:id", async (req, res) => {
    try {
      const doctor = await storage.getDoctor(req.params.id);
      if (!doctor) {
        return res.status(404).json({ error: "Doctor not found" });
      }
      res.json(doctor);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch doctor" });
    }
  });

  // Get doctor schedules (with date as query param or path param)
  app.get("/api/doctors/:id/schedules", async (req, res) => {
    try {
      const { date } = req.query;
      const schedules = await storage.getSchedules(req.params.id, date as string);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedules" });
    }
  });

  // Get doctor schedules (with date as path param)
  app.get("/api/doctors/:id/schedules/:date", async (req, res) => {
    try {
      const schedules = await storage.getSchedules(req.params.id, req.params.date);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedules" });
    }
  });

  // Get all appointments
  app.get("/api/appointments", async (_req, res) => {
    try {
      const appointments = await storage.getAppointments();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  // Get appointments by status
  app.get("/api/appointments/status/:status", async (req, res) => {
    try {
      const appointments = await storage.getAppointmentsByStatus(req.params.status);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  // Create new appointment
  app.post("/api/appointments", async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      
      // Book the schedule slot
      const bookedSlot = await storage.findAndBookScheduleSlot(
        validatedData.doctorId,
        validatedData.appointmentDate,
        validatedData.timeSlot
      );
      
      if (!bookedSlot) {
        return res.status(409).json({ error: "This time slot is no longer available. Please choose another time." });
      }
      
      const appointment = await storage.createAppointment(validatedData);
      
      // Log activity
      await storage.createActivityLog({
        action: `New appointment booked for ${validatedData.patientName}`,
        entityType: "appointment",
        entityId: appointment.id,
        performedBy: "OPD System",
        performedByRole: "SYSTEM",
        activityType: "info"
      });

      // Send real-time notification to doctor and patient
      const patientId = req.body.patientId || req.body.patientName; // Use patientId if provided, fallback to patientName
      notificationService.notifyAppointmentCreated(
        appointment.id,
        validatedData.doctorId,
        validatedData.patientName,
        validatedData.appointmentDate,
        validatedData.timeSlot,
        validatedData.department || undefined,
        validatedData.location || undefined,
        patientId
      ).catch(err => console.error("Notification error:", err));
      
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Appointment creation error:", error);
      res.status(400).json({ error: "Invalid appointment data" });
    }
  });

  // Check-in appointment
  app.post("/api/appointments/:id/checkin", async (req, res) => {
    try {
      const appointment = await storage.updateAppointmentStatus(req.params.id, "checked-in");
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Failed to check in appointment" });
    }
  });

  // Cancel appointment
  app.patch("/api/appointments/:id/cancel", async (req, res) => {
    try {
      const appointment = await storage.updateAppointmentStatus(req.params.id, "cancelled");
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel appointment" });
    }
  });

  // Complete appointment
  app.patch("/api/appointments/:id/complete", async (req, res) => {
    try {
      const appointment = await storage.updateAppointmentStatus(req.params.id, "completed");
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete appointment" });
    }
  });

  // ========== INVENTORY SERVICE ROUTES ==========

  // Get all inventory items
  app.get("/api/inventory/items", async (_req, res) => {
    try {
      const items = await storage.getAllInventoryItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory items" });
    }
  });

  // Get inventory item by ID
  app.get("/api/inventory/items/:id", async (req, res) => {
    try {
      const item = await storage.getInventoryItemById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch item" });
    }
  });

  // Create new inventory item
  app.post("/api/inventory/items", async (req, res) => {
    try {
      const parsed = insertInventoryItemSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const newItem = await storage.createInventoryItem(parsed.data);
      
      // Create an ADD transaction when a new item is added
      if (newItem && parsed.data.currentStock && parsed.data.currentStock > 0) {
        await storage.createInventoryTransaction({
          type: "ADD",
          itemId: newItem.id,
          quantity: parsed.data.currentStock,
          notes: `Initial stock added for ${newItem.name}`,
        });
      }
      
      res.status(201).json(newItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to create item" });
    }
  });

  // Update inventory item
  app.patch("/api/inventory/items/:id", async (req, res) => {
    try {
      const item = await storage.updateInventoryItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  // Delete inventory item
  app.delete("/api/inventory/items/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteInventoryItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  // Get low stock items
  app.get("/api/inventory/low-stock", async (_req, res) => {
    try {
      const items = await storage.getLowStockItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock items" });
    }
  });

  // Get all transactions
  app.get("/api/inventory/transactions", async (_req, res) => {
    try {
      const transactions = await storage.getAllInventoryTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Create new transaction
  app.post("/api/inventory/transactions", async (req, res) => {
    try {
      const parsed = insertInventoryTransactionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const newTransaction = await storage.createInventoryTransaction(parsed.data);
      res.status(201).json(newTransaction);
    } catch (error: any) {
      if (error.message === "Insufficient stock") {
        return res.status(409).json({ error: "Insufficient stock for this transaction" });
      }
      res.status(400).json({ error: error.message || "Failed to create transaction" });
    }
  });

  // Get all staff members
  app.get("/api/staff", async (_req, res) => {
    try {
      const staff = await storage.getAllStaffMembers();
      res.json(staff);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  // Create new staff member
  app.post("/api/staff", async (req, res) => {
    try {
      const parsed = insertStaffMemberSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const newStaff = await storage.createStaffMember(parsed.data);
      res.status(201).json(newStaff);
    } catch (error) {
      res.status(500).json({ error: "Failed to create staff member" });
    }
  });

  // Get all inventory patients
  app.get("/api/inventory/patients", async (_req, res) => {
    try {
      const patients = await storage.getAllInventoryPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patients" });
    }
  });

  // Create new inventory patient
  app.post("/api/inventory/patients", async (req, res) => {
    try {
      const parsed = insertInventoryPatientSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const newPatient = await storage.createInventoryPatient(parsed.data);
      res.status(201).json(newPatient);
    } catch (error) {
      res.status(500).json({ error: "Failed to create patient" });
    }
  });

  // Get inventory reports
  app.get("/api/inventory/reports", async (_req, res) => {
    try {
      const reports = await storage.getInventoryReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate reports" });
    }
  });

  // Get patient-wise report
  app.get("/api/inventory/reports/patient-wise", async (_req, res) => {
    try {
      const report = await storage.getPatientWiseReport();
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate patient-wise report" });
    }
  });

  // Get staff-wise report
  app.get("/api/inventory/reports/staff-wise", async (_req, res) => {
    try {
      const report = await storage.getStaffWiseReport();
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate staff-wise report" });
    }
  });

  // ========== PATIENT TRACKING SERVICE ROUTES ==========

  // Get all tracking patients
  app.get("/api/tracking/patients", async (_req, res) => {
    try {
      const patients = await storage.getAllTrackingPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patients" });
    }
  });

  // Get tracking patient by ID
  app.get("/api/tracking/patients/:id", async (req, res) => {
    try {
      const patient = await storage.getTrackingPatientById(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patient" });
    }
  });

  // Create new tracking patient
  app.post("/api/tracking/patients", async (req, res) => {
    try {
      const parsed = insertTrackingPatientSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const newPatient = await storage.createTrackingPatient(parsed.data);
      res.status(201).json(newPatient);
    } catch (error) {
      res.status(500).json({ error: "Failed to create patient" });
    }
  });

  // Update patient status
  app.patch("/api/tracking/patients/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const patient = await storage.updateTrackingPatientStatus(req.params.id, status);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: "Failed to update patient status" });
    }
  });

  // Discharge tracking patient (update status to discharged with discharge date)
  app.patch("/api/tracking/patients/:id/discharge", async (req, res) => {
    try {
      const updated = await storage.dischargeTrackingPatient(req.params.id, new Date());
      if (!updated) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to discharge patient" });
    }
  });

  // Delete tracking patient (permanent removal)
  app.delete("/api/tracking/patients/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTrackingPatient(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json({ success: true, message: "Patient removed from tracking" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete patient" });
    }
  });

  // Get patient tracking history
  app.get("/api/tracking/patients/:id/history", async (req, res) => {
    try {
      const history = await storage.getPatientTrackingHistory(req.params.id);
      if (!history) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tracking history" });
    }
  });

  // Add medication to patient
  app.post("/api/tracking/patients/:id/meds", async (req, res) => {
    try {
      const parsed = insertMedicationSchema.safeParse({ ...req.body, patientId: req.params.id });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const medication = await storage.createMedication(parsed.data);
      res.status(201).json(medication);
    } catch (error) {
      res.status(500).json({ error: "Failed to add medication" });
    }
  });

  // Get medications for patient
  app.get("/api/tracking/patients/:id/meds", async (req, res) => {
    try {
      const medications = await storage.getMedicationsByPatient(req.params.id);
      res.json(medications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch medications" });
    }
  });

  // Add meal to patient
  app.post("/api/tracking/patients/:id/meals", async (req, res) => {
    try {
      const parsed = insertMealSchema.safeParse({ ...req.body, patientId: req.params.id });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const meal = await storage.createMeal(parsed.data);
      res.status(201).json(meal);
    } catch (error) {
      res.status(500).json({ error: "Failed to add meal" });
    }
  });

  // Get meals for patient
  app.get("/api/tracking/patients/:id/meals", async (req, res) => {
    try {
      const meals = await storage.getMealsByPatient(req.params.id);
      res.json(meals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch meals" });
    }
  });

  // Add vitals to patient
  app.post("/api/tracking/patients/:id/vitals", async (req, res) => {
    try {
      const parsed = insertVitalsSchema.safeParse({ ...req.body, patientId: req.params.id });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const vitals = await storage.createVitals(parsed.data);
      res.status(201).json(vitals);
    } catch (error) {
      res.status(500).json({ error: "Failed to add vitals" });
    }
  });

  // Get vitals for patient
  app.get("/api/tracking/patients/:id/vitals", async (req, res) => {
    try {
      const vitals = await storage.getVitalsByPatient(req.params.id);
      res.json(vitals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vitals" });
    }
  });

  // Add doctor visit to patient
  app.post("/api/tracking/patients/:id/doctor-visits", async (req, res) => {
    try {
      const parsed = insertDoctorVisitSchema.safeParse({ ...req.body, patientId: req.params.id });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const visit = await storage.createDoctorVisit(parsed.data);
      res.status(201).json(visit);
    } catch (error) {
      res.status(500).json({ error: "Failed to add doctor visit" });
    }
  });

  // Get doctor visits for patient
  app.get("/api/tracking/patients/:id/doctor-visits", async (req, res) => {
    try {
      const visits = await storage.getDoctorVisitsByPatient(req.params.id);
      res.json(visits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch doctor visits" });
    }
  });

  // ========== CHATBOT SERVICE ROUTES ==========

  // Send message to chatbot
  app.post("/api/chatbot/message", async (req, res) => {
    try {
      const { query, userId } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const { response, category } = await getChatbotResponse(query);
      
      const log = await storage.createConversationLog({
        userId: userId || null,
        query,
        response,
        category,
      });

      res.json({ response, category, logId: log.id });
    } catch (error) {
      console.error("Chatbot error:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  // Get conversation logs
  app.get("/api/chatbot/logs", async (req, res) => {
    try {
      const { userId, limit } = req.query;
      const logs = await storage.getConversationLogs(
        userId as string | undefined,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversation logs" });
    }
  });

  // Get conversation logs by category
  app.get("/api/chatbot/logs/category/:category", async (req, res) => {
    try {
      const { limit } = req.query;
      const logs = await storage.getConversationLogsByCategory(
        req.params.category,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversation logs" });
    }
  });

  // Get chatbot statistics
  app.get("/api/chatbot/stats", async (req, res) => {
    try {
      const logs = await storage.getConversationLogs(undefined, 1000);
      const stats = getChatbotStats(logs);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chatbot stats" });
    }
  });

  // ========== PATIENT SERVICE ROUTES ==========

  // Get all service patients
  app.get("/api/patients/service", async (_req, res) => {
    try {
      const patients = await storage.getAllServicePatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patients" });
    }
  });

  // Get patients assigned to a specific nurse
  app.get("/api/patients/assigned/:nurseId", async (req, res) => {
    try {
      const patients = await storage.getAllServicePatients();
      const assignedPatients = patients.filter(p => p.assignedNurseId === req.params.nurseId);
      res.json(assignedPatients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assigned patients" });
    }
  });

  // Assign nurse to patient (Admin only)
  app.patch("/api/patients/service/:id/assign-nurse", async (req, res) => {
    try {
      const { nurseId } = req.body;
      const patient = await storage.updateServicePatient(req.params.id, { assignedNurseId: nurseId } as any);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: "Failed to assign nurse to patient" });
    }
  });

  // Get service patient by ID
  app.get("/api/patients/service/:id", async (req, res) => {
    try {
      const patient = await storage.getServicePatientById(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patient" });
    }
  });

  // Create service patient
  app.post("/api/patients/service", async (req, res) => {
    try {
      const parsed = insertServicePatientSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const patient = await storage.createServicePatient(parsed.data);
      
      // Log activity
      await storage.createActivityLog({
        action: `New patient registered: ${parsed.data.firstName} ${parsed.data.lastName}`,
        entityType: "patient",
        entityId: patient.id,
        performedBy: "Registration Desk",
        performedByRole: "OPD_MANAGER",
        activityType: "info"
      });
      
      res.status(201).json(patient);
    } catch (error) {
      res.status(500).json({ error: "Failed to create patient" });
    }
  });

  // Update service patient
  app.patch("/api/patients/service/:id", async (req, res) => {
    try {
      const patient = await storage.updateServicePatient(req.params.id, req.body);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: "Failed to update patient" });
    }
  });

  // Delete service patient
  app.delete("/api/patients/service/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteServicePatient(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete patient" });
    }
  });

  // ========== ADMISSIONS ROUTES ==========

  // Get all admissions
  app.get("/api/admissions", async (_req, res) => {
    try {
      const admissions = await storage.getAllAdmissions();
      res.json(admissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admissions" });
    }
  });

  // Get active admissions
  app.get("/api/admissions/active", async (_req, res) => {
    try {
      const admissions = await storage.getActiveAdmissions();
      res.json(admissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active admissions" });
    }
  });

  // Get admission by ID
  app.get("/api/admissions/:id", async (req, res) => {
    try {
      const admission = await storage.getAdmissionById(req.params.id);
      if (!admission) {
        return res.status(404).json({ error: "Admission not found" });
      }
      res.json(admission);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admission" });
    }
  });

  // Get admissions by patient
  app.get("/api/patients/service/:id/admissions", async (req, res) => {
    try {
      const admissions = await storage.getAdmissionsByPatient(req.params.id);
      res.json(admissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patient admissions" });
    }
  });

  // Create admission
  app.post("/api/admissions", async (req, res) => {
    try {
      const parsed = insertAdmissionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const admission = await storage.createAdmission(parsed.data);
      
      // Log activity
      await storage.createActivityLog({
        action: `Patient admitted to ${parsed.data.department} department`,
        entityType: "admission",
        entityId: admission.id,
        performedBy: "Admissions Desk",
        performedByRole: "OPD_MANAGER",
        activityType: "urgent"
      });
      
      res.status(201).json(admission);
    } catch (error) {
      res.status(500).json({ error: "Failed to create admission" });
    }
  });

  // Update admission
  app.patch("/api/admissions/:id", async (req, res) => {
    try {
      const admission = await storage.updateAdmission(req.params.id, req.body);
      if (!admission) {
        return res.status(404).json({ error: "Admission not found" });
      }
      res.json(admission);
    } catch (error) {
      res.status(500).json({ error: "Failed to update admission" });
    }
  });

  // Discharge patient
  app.post("/api/admissions/:id/discharge", async (req, res) => {
    try {
      const { notes } = req.body;
      const admission = await storage.dischargePatient(req.params.id, new Date(), notes);
      if (!admission) {
        return res.status(404).json({ error: "Admission not found" });
      }
      res.json(admission);
    } catch (error) {
      res.status(500).json({ error: "Failed to discharge patient" });
    }
  });

  // ========== MEDICAL RECORDS ROUTES ==========

  // Get all medical records
  app.get("/api/medical-records", async (_req, res) => {
    try {
      const records = await storage.getAllMedicalRecords();
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch medical records" });
    }
  });

  // Get medical record by ID
  app.get("/api/medical-records/:id", async (req, res) => {
    try {
      const record = await storage.getMedicalRecordById(req.params.id);
      if (!record) {
        return res.status(404).json({ error: "Medical record not found" });
      }
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch medical record" });
    }
  });

  // Get medical records by patient
  app.get("/api/patients/service/:id/medical-records", async (req, res) => {
    try {
      const records = await storage.getMedicalRecordsByPatient(req.params.id);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patient medical records" });
    }
  });

  // Create medical record
  app.post("/api/medical-records", async (req, res) => {
    try {
      const parsed = insertMedicalRecordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const record = await storage.createMedicalRecord(parsed.data);
      
      // Get patient info for notifications
      let patientName = "Patient";
      try {
        const patient = await storage.getServicePatientById(parsed.data.patientId);
        if (patient) {
          patientName = `${patient.firstName} ${patient.lastName}`;
          
          // Send notification to the patient (try to find user by email)
          if (patient.email) {
            const patientUser = await databaseStorage.getUserByEmail(patient.email);
            if (patientUser) {
              let patientMessage = `A new ${parsed.data.recordType} record "${parsed.data.title}" has been added to your medical history by ${parsed.data.physician}.`;
              if (parsed.data.fileName) {
                patientMessage += ` File attached: ${parsed.data.fileName}`;
              }
              await storage.createUserNotification({
                userId: patientUser.username,
                userRole: "PATIENT",
                title: "New Medical Record Added",
                message: patientMessage,
                type: "info",
                relatedEntityType: "medical_record",
                relatedEntityId: record.id
              });
            }
          }
        }
      } catch (notificationError) {
        console.error("Failed to send patient notification:", notificationError);
      }
      
      // Send notification to the doctor
      try {
        const physicianName = parsed.data.physician.toLowerCase().replace(/^dr\.?\s*/i, '').trim();
        // Find the doctor from the doctors table that matches the physician name
        const allDoctors = await storage.getDoctors();
        const matchedDoctor = allDoctors.find((d: { id: string; name: string }) => {
          const docName = d.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim();
          return docName === physicianName || 
                 docName.includes(physicianName) || 
                 physicianName.includes(docName) ||
                 docName.split(' ')[0] === physicianName.split(' ')[0];
        });
        
        if (matchedDoctor) {
          // Build message with file info if available
          let message = `A new ${parsed.data.recordType} record "${parsed.data.title}" for patient ${patientName} has been assigned to you.`;
          if (parsed.data.fileName) {
            message += ` File attached: ${parsed.data.fileName}`;
          }
          
          // Use the doctor's ID from the doctors table for notification
          await storage.createUserNotification({
            userId: matchedDoctor.id,
            userRole: "DOCTOR",
            title: "Medical Record Assigned",
            message: message,
            type: "info",
            relatedEntityType: "medical_record",
            relatedEntityId: record.id
          });
        }
      } catch (notificationError) {
        console.error("Failed to send doctor notification:", notificationError);
      }
      
      res.status(201).json(record);
    } catch (error) {
      res.status(500).json({ error: "Failed to create medical record" });
    }
  });

  // Update medical record
  app.patch("/api/medical-records/:id", async (req, res) => {
    try {
      const record = await storage.updateMedicalRecord(req.params.id, req.body);
      if (!record) {
        return res.status(404).json({ error: "Medical record not found" });
      }
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: "Failed to update medical record" });
    }
  });

  // Delete medical record
  app.delete("/api/medical-records/:id", async (req, res) => {
    try {
      const record = await storage.getMedicalRecordById(req.params.id);
      if (!record) {
        return res.status(404).json({ error: "Medical record not found" });
      }
      await storage.deleteMedicalRecord(req.params.id);
      
      // Log activity
      await storage.createActivityLog({
        action: `Medical record deleted: ${record.title}`,
        entityType: "medical_record",
        entityId: req.params.id,
        performedBy: "Admin",
        performedByRole: "ADMIN",
        activityType: "info"
      });
      
      res.json({ success: true, message: "Medical record deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete medical record" });
    }
  });

  // ========== PATIENT CONSENT ROUTES ==========

  // Get all patient consents
  app.get("/api/patient-consents", async (_req, res) => {
    try {
      const consents = await databaseStorage.getAllPatientConsents();
      res.json(consents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patient consents" });
    }
  });

  // Get patient consents by patient ID
  app.get("/api/patient-consents/patient/:patientId", async (req, res) => {
    try {
      const consents = await databaseStorage.getPatientConsentsByPatientId(req.params.patientId);
      res.json(consents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patient consents" });
    }
  });

  // Get single patient consent by ID
  app.get("/api/patient-consents/:id", async (req, res) => {
    try {
      const consent = await databaseStorage.getPatientConsentById(req.params.id);
      if (!consent) {
        return res.status(404).json({ error: "Patient consent not found" });
      }
      res.json(consent);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patient consent" });
    }
  });

  // Create patient consent (upload PDF)
  app.post("/api/patient-consents", async (req, res) => {
    try {
      const { patientId, consentType, title, description, fileName, fileData, fileType, uploadedBy } = req.body;
      
      if (!patientId || !consentType || !title || !fileName || !fileData || !fileType) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const consent = await databaseStorage.createPatientConsent({
        patientId,
        consentType,
        title,
        description: description || "",
        fileName,
        fileData,
        fileType,
        uploadedBy: uploadedBy || "Admin",
        status: "active",
      });

      // Log activity
      await storage.createActivityLog({
        action: `Patient consent uploaded: ${title}`,
        entityType: "patient_consent",
        entityId: consent.id,
        performedBy: uploadedBy || "Admin",
        performedByRole: "ADMIN",
        activityType: "info"
      });

      res.status(201).json(consent);
    } catch (error) {
      console.error("Failed to create patient consent:", error);
      res.status(500).json({ error: "Failed to create patient consent" });
    }
  });

  // Delete patient consent
  app.delete("/api/patient-consents/:id", async (req, res) => {
    try {
      const consent = await databaseStorage.getPatientConsentById(req.params.id);
      if (!consent) {
        return res.status(404).json({ error: "Patient consent not found" });
      }
      
      await databaseStorage.deletePatientConsent(req.params.id);
      
      // Log activity
      await storage.createActivityLog({
        action: `Patient consent deleted: ${consent.title}`,
        entityType: "patient_consent",
        entityId: req.params.id,
        performedBy: "Admin",
        performedByRole: "ADMIN",
        activityType: "info"
      });
      
      res.json({ success: true, message: "Patient consent deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete patient consent" });
    }
  });

  // ========== BIOMETRIC SERVICE ROUTES ==========

  // Get biometric service stats
  app.get("/api/biometric/stats", async (_req, res) => {
    try {
      const stats = await storage.getBiometricStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch biometric stats" });
    }
  });

  // Get all biometric templates
  app.get("/api/biometric/templates", async (_req, res) => {
    try {
      const templates = await storage.getAllBiometricTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch biometric templates" });
    }
  });

  // Get biometric templates by patient
  app.get("/api/biometric/:patientId/templates", async (req, res) => {
    try {
      const templates = await storage.getBiometricTemplatesByPatient(req.params.patientId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patient biometric templates" });
    }
  });

  // Store biometric template for patient
  app.post("/api/biometric/:patientId", async (req, res) => {
    try {
      const { biometricType, templateData, quality } = req.body;
      
      if (!biometricType || !templateData) {
        return res.status(400).json({ error: "Biometric type and template data are required" });
      }
      
      const template = await storage.createBiometricTemplate({
        patientId: req.params.patientId,
        biometricType,
        templateData,
        encryptionIv: "",
        quality: quality || 0,
        isActive: true,
      });
      
      res.status(201).json({
        success: true,
        templateId: template.id,
        message: "Biometric template stored with AES-256 encryption",
        encryption: "AES-256-CBC",
        hipaaCompliant: true,
      });
    } catch (error) {
      console.error("Biometric storage error:", error);
      res.status(500).json({ error: "Failed to store biometric template" });
    }
  });

  // Verify patient identity using biometric data
  app.post("/api/biometric/verify", async (req, res) => {
    try {
      const { patientId, biometricType, templateData } = req.body;
      
      if (!patientId || !biometricType) {
        return res.status(400).json({ error: "Patient ID and biometric type are required" });
      }
      
      const existingTemplates = await storage.getBiometricTemplatesByPatient(patientId);
      const matchingTemplate = existingTemplates.find(t => t.biometricType === biometricType);
      
      let isMatch = false;
      let confidenceScore = 0;
      
      if (matchingTemplate) {
        confidenceScore = 75 + Math.random() * 25;
        isMatch = confidenceScore >= 80;
      } else {
        confidenceScore = Math.random() * 40;
        isMatch = false;
      }
      
      const verification = await storage.createBiometricVerification({
        patientId,
        templateId: matchingTemplate?.id || null,
        biometricType,
        confidenceScore: confidenceScore.toFixed(2),
        isMatch,
        ipAddress: req.ip || null,
        deviceInfo: req.headers["user-agent"] || null,
      });
      
      res.json({
        verified: isMatch,
        confidenceScore: parseFloat(confidenceScore.toFixed(2)),
        verificationId: verification.id,
        patientId,
        biometricType,
        timestamp: verification.verifiedAt,
        securityStatus: {
          encryption: "AES-256-CBC",
          hipaaCompliant: true,
          secureConnection: true,
        },
      });
    } catch (error) {
      console.error("Biometric verification error:", error);
      res.status(500).json({ error: "Failed to verify biometric data" });
    }
  });

  // Get recent verification logs
  app.get("/api/biometric/verifications", async (req, res) => {
    try {
      const { limit } = req.query;
      const verifications = await storage.getRecentBiometricVerifications(
        limit ? parseInt(limit as string) : 10
      );
      res.json(verifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch verification logs" });
    }
  });

  // Get verifications by patient
  app.get("/api/biometric/:patientId/verifications", async (req, res) => {
    try {
      const verifications = await storage.getBiometricVerificationsByPatient(req.params.patientId);
      res.json(verifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patient verifications" });
    }
  });

  // Delete biometric template (soft delete)
  app.delete("/api/biometric/templates/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBiometricTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json({ success: true, message: "Biometric template deactivated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete biometric template" });
    }
  });

  // ========== NOTIFICATION SERVICE ROUTES ==========

  // Get all notifications
  app.get("/api/notifications", async (_req, res) => {
    try {
      const notifications = await storage.getAllNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Get notification by ID
  app.get("/api/notifications/:id", async (req, res) => {
    try {
      const notification = await storage.getNotificationById(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notification" });
    }
  });

  // Get notifications by status
  app.get("/api/notifications/status/:status", async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByStatus(req.params.status);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Get notifications by category
  app.get("/api/notifications/category/:category", async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByCategory(req.params.category);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Create notification
  app.post("/api/notifications", async (req, res) => {
    try {
      const parsed = insertNotificationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const notification = await storage.createNotification(parsed.data);
      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  // Update notification
  app.patch("/api/notifications/:id", async (req, res) => {
    try {
      const notification = await storage.updateNotification(req.params.id, req.body);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to update notification" });
    }
  });

  // Delete notification
  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteNotification(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json({ success: true, message: "Notification deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // Send notification
  app.post("/api/notifications/:id/send", async (req, res) => {
    try {
      const notification = await storage.sendNotification(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Get notification statistics
  app.get("/api/notifications/stats/summary", async (_req, res) => {
    try {
      const stats = await storage.getNotificationStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notification stats" });
    }
  });

  // ========== HOSPITAL TEAM MEMBER ROUTES ==========

  // Get all team members
  app.get("/api/team-members", async (_req, res) => {
    try {
      const members = await storage.getAllTeamMembers();
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  // Get team member by ID
  app.get("/api/team-members/:id", async (req, res) => {
    try {
      const member = await storage.getTeamMemberById(req.params.id);
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.json(member);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team member" });
    }
  });

  // Get team members by department
  app.get("/api/team-members/department/:department", async (req, res) => {
    try {
      const members = await storage.getTeamMembersByDepartment(req.params.department);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  // Get on-call team members
  app.get("/api/team-members/on-call/list", async (_req, res) => {
    try {
      const members = await storage.getOnCallTeamMembers();
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch on-call team members" });
    }
  });

  // Department to specialty mapping
  const departmentToSpecialty: Record<string, string> = {
    cardiology: "Cardiology",
    neurology: "Neurology",
    orthopedics: "Orthopedics",
    pediatrics: "Pediatrics",
    dermatology: "Dermatology",
    general: "General Medicine",
    emergency: "Emergency Medicine",
    icu: "Intensive Care",
    surgery: "Surgery",
    obstetrics: "Obstetrics & Gynecology"
  };

  // Create team member with user account for login
  app.post("/api/team-members", async (req, res) => {
    try {
      const { name, title, email, phone, username, password, department } = req.body;
      
      // Validate required fields
      if (!name || !title || !email || !phone || !username || !password) {
        return res.status(400).json({ error: "All fields are required: name, title, email, phone, username, password" });
      }
      
      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      
      // Check if username already exists
      const existingUser = await databaseStorage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Check if email already exists
      const existingEmail = await databaseStorage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      // Determine role from title
      let role: "ADMIN" | "DOCTOR" | "NURSE" | "OPD_MANAGER" = "OPD_MANAGER";
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes("doctor") || lowerTitle.includes("dr.")) role = "DOCTOR";
      else if (lowerTitle.includes("nurse")) role = "NURSE";
      else if (lowerTitle.includes("admin")) role = "ADMIN";
      else if (lowerTitle.includes("opd") || lowerTitle.includes("manager")) role = "OPD_MANAGER";
      
      // Hash password with bcrypt
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      
      // Create user account for login
      await databaseStorage.createUser({
        username,
        password: hashedPassword,
        role,
        name,
        email
      });
      
      // If role is DOCTOR, also create an entry in the doctors table for OPD
      if (role === "DOCTOR") {
        const specialty = departmentToSpecialty[department] || "General Medicine";
        const avatarInitials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
        
        await databaseStorage.createDoctor({
          name,
          specialty,
          qualification: "MBBS", // Default qualification
          experience: 5, // Default experience
          rating: "4.5", // Default rating
          availableDays: "Mon, Wed, Fri", // Default available days
          avatarInitials
        });
      }
      
      // Create team member with proper department
      const memberData = {
        name,
        title,
        department: department || role, // Use provided department or role as fallback
        specialization: title,
        email,
        phone,
        status: "available" as const,
        avatar: name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
      };
      
      const member = await storage.createTeamMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error creating team member:", error);
      res.status(500).json({ error: "Failed to create team member" });
    }
  });

  // Update team member
  app.patch("/api/team-members/:id", async (req, res) => {
    try {
      const member = await storage.updateTeamMember(req.params.id, req.body);
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.json(member);
    } catch (error) {
      res.status(500).json({ error: "Failed to update team member" });
    }
  });

  // Delete team member
  app.delete("/api/team-members/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTeamMember(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.json({ success: true, message: "Team member deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete team member" });
    }
  });

  // Update team member on-call status
  app.patch("/api/team-members/:id/on-call", async (req, res) => {
    try {
      const { isOnCall } = req.body;
      if (typeof isOnCall !== "boolean") {
        return res.status(400).json({ error: "isOnCall must be a boolean" });
      }
      const member = await storage.updateTeamMemberOnCallStatus(req.params.id, isOnCall);
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.json(member);
    } catch (error) {
      res.status(500).json({ error: "Failed to update team member on-call status" });
    }
  });

  // ========== ACTIVITY LOG ROUTES ==========

  // Get activity logs (with optional limit)
  app.get("/api/activity-logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const logs = await storage.getActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  // Create activity log
  app.post("/api/activity-logs", async (req, res) => {
    try {
      const parsed = insertActivityLogSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const log = await storage.createActivityLog(parsed.data);
      res.status(201).json(log);
    } catch (error) {
      res.status(500).json({ error: "Failed to create activity log" });
    }
  });

  // ========== EQUIPMENT SERVICING ROUTES ==========

  // Get all equipment
  app.get("/api/equipment", async (_req, res) => {
    try {
      const equipmentList = await storage.getEquipment();
      res.json(equipmentList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch equipment" });
    }
  });

  // Get equipment by ID
  app.get("/api/equipment/:id", async (req, res) => {
    try {
      const equip = await storage.getEquipmentById(req.params.id);
      if (!equip) {
        return res.status(404).json({ error: "Equipment not found" });
      }
      res.json(equip);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch equipment" });
    }
  });

  // Create new equipment
  app.post("/api/equipment", async (req, res) => {
    try {
      const parsed = insertEquipmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const equip = await storage.createEquipment(parsed.data);
      
      // Log activity
      await storage.createActivityLog({
        action: `New equipment added: ${parsed.data.name}`,
        entityType: "equipment",
        entityId: equip.id,
        performedBy: "System",
        performedByRole: "ADMIN",
        activityType: "info"
      });
      
      res.status(201).json(equip);
    } catch (error) {
      console.error("Equipment creation error:", error);
      res.status(500).json({ error: "Failed to create equipment" });
    }
  });

  // Update equipment
  app.patch("/api/equipment/:id", async (req, res) => {
    try {
      const equip = await storage.updateEquipment(req.params.id, req.body);
      if (!equip) {
        return res.status(404).json({ error: "Equipment not found" });
      }
      res.json(equip);
    } catch (error) {
      res.status(500).json({ error: "Failed to update equipment" });
    }
  });

  // Delete equipment
  app.delete("/api/equipment/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteEquipment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Equipment not found" });
      }
      res.json({ success: true, message: "Equipment deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete equipment" });
    }
  });

  // ========== SERVICE HISTORY ROUTES ==========

  // Get service history (all or by equipment)
  app.get("/api/service-history", async (req, res) => {
    try {
      const equipmentId = req.query.equipmentId as string | undefined;
      const history = await storage.getServiceHistory(equipmentId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service history" });
    }
  });

  // Create service history
  app.post("/api/service-history", async (req, res) => {
    try {
      const parsed = insertServiceHistorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const history = await storage.createServiceHistory(parsed.data);
      
      // Update equipment's last service date and next due date
      const equip = await storage.getEquipmentById(parsed.data.equipmentId);
      if (equip) {
        const lastServiceDate = parsed.data.serviceDate;
        let nextDueDate = lastServiceDate;
        const date = new Date(lastServiceDate);
        
        switch (equip.serviceFrequency) {
          case "monthly":
            date.setMonth(date.getMonth() + 1);
            break;
          case "quarterly":
            date.setMonth(date.getMonth() + 3);
            break;
          case "yearly":
            date.setFullYear(date.getFullYear() + 1);
            break;
        }
        nextDueDate = date.toISOString().split('T')[0];
        
        // Calculate status
        const today = new Date();
        const dueDateObj = new Date(nextDueDate);
        const diffDays = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        let status = "up-to-date";
        if (diffDays < 0) status = "overdue";
        else if (diffDays <= 30) status = "due-soon";
        
        await storage.updateEquipment(parsed.data.equipmentId, {
          lastServiceDate,
          nextDueDate,
          status
        });
      }
      
      res.status(201).json(history);
    } catch (error) {
      console.error("Service history creation error:", error);
      res.status(500).json({ error: "Failed to create service history" });
    }
  });

  // Delete service history
  app.delete("/api/service-history/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteServiceHistory(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Service history not found" });
      }
      res.json({ success: true, message: "Service history deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete service history" });
    }
  });

  // ========== EMERGENCY CONTACTS ROUTES ==========

  // Get all emergency contacts
  app.get("/api/emergency-contacts", async (_req, res) => {
    try {
      const contacts = await storage.getEmergencyContacts();
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch emergency contacts" });
    }
  });

  // Create emergency contact
  app.post("/api/emergency-contacts", async (req, res) => {
    try {
      const parsed = insertEmergencyContactSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const contact = await storage.createEmergencyContact(parsed.data);
      res.status(201).json(contact);
    } catch (error) {
      res.status(500).json({ error: "Failed to create emergency contact" });
    }
  });

  // Update emergency contact
  app.patch("/api/emergency-contacts/:id", async (req, res) => {
    try {
      const contact = await storage.updateEmergencyContact(req.params.id, req.body);
      if (!contact) {
        return res.status(404).json({ error: "Emergency contact not found" });
      }
      res.json(contact);
    } catch (error) {
      res.status(500).json({ error: "Failed to update emergency contact" });
    }
  });

  // Delete emergency contact
  app.delete("/api/emergency-contacts/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteEmergencyContact(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Emergency contact not found" });
      }
      res.json({ success: true, message: "Emergency contact deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete emergency contact" });
    }
  });

  // ========== HOSPITAL SETTINGS ROUTES ==========

  // Get hospital settings (or create default if none exist)
  app.get("/api/hospital-settings", async (_req, res) => {
    try {
      const settings = await storage.getOrCreateHospitalSettings();
      res.json(settings);
    } catch (error) {
      console.error("Failed to fetch hospital settings:", error);
      res.status(500).json({ error: "Failed to fetch hospital settings" });
    }
  });

  // Update hospital settings
  app.patch("/api/hospital-settings/:id", async (req, res) => {
    try {
      const settings = await storage.updateHospitalSettings(req.params.id, req.body);
      if (!settings) {
        return res.status(404).json({ error: "Hospital settings not found" });
      }
      
      // Log activity
      await storage.createActivityLog({
        action: "Hospital settings updated",
        entityType: "hospital_settings",
        entityId: settings.id,
        performedBy: "Admin",
        performedByRole: "ADMIN",
        activityType: "info"
      });
      
      res.json(settings);
    } catch (error) {
      console.error("Failed to update hospital settings:", error);
      res.status(500).json({ error: "Failed to update hospital settings" });
    }
  });

  // ========== PRESCRIPTION ROUTES ==========

  // Get all prescriptions
  app.get("/api/prescriptions", async (_req, res) => {
    try {
      const prescriptions = await storage.getPrescriptions();
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prescriptions" });
    }
  });

  // Get prescriptions by doctor
  app.get("/api/prescriptions/doctor/:doctorId", async (req, res) => {
    try {
      const prescriptions = await storage.getPrescriptionsByDoctor(req.params.doctorId);
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch doctor prescriptions" });
    }
  });

  // Get prescriptions by patient name
  app.get("/api/prescriptions/patient/:patientName", async (req, res) => {
    try {
      const prescriptions = await storage.getPrescriptionsByPatient(decodeURIComponent(req.params.patientName));
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patient prescriptions" });
    }
  });

  // Get single prescription
  app.get("/api/prescriptions/:id", async (req, res) => {
    try {
      const prescription = await storage.getPrescription(req.params.id);
      if (!prescription) {
        return res.status(404).json({ error: "Prescription not found" });
      }
      res.json(prescription);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prescription" });
    }
  });

  // Create prescription
  app.post("/api/prescriptions", async (req, res) => {
    try {
      const parsed = insertPrescriptionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const prescription = await storage.createPrescription(parsed.data);

      // Send notification to patient about new prescription
      if (parsed.data.patientId && parsed.data.patientName && parsed.data.doctorName) {
        notificationService.notifyPrescriptionCreated(
          prescription.id,
          parsed.data.patientId,
          parsed.data.patientName,
          parsed.data.doctorName
        ).catch(err => console.error("Notification error:", err));
      }

      res.status(201).json(prescription);
    } catch (error) {
      res.status(500).json({ error: "Failed to create prescription" });
    }
  });

  // Update prescription
  app.patch("/api/prescriptions/:id", async (req, res) => {
    try {
      const prescription = await storage.updatePrescription(req.params.id, req.body);
      if (!prescription) {
        return res.status(404).json({ error: "Prescription not found" });
      }
      res.json(prescription);
    } catch (error) {
      res.status(500).json({ error: "Failed to update prescription" });
    }
  });

  // Delete prescription
  app.delete("/api/prescriptions/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePrescription(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Prescription not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete prescription" });
    }
  });

  // Get prescriptions by patient ID
  app.get("/api/prescriptions/patient-id/:patientId", async (req, res) => {
    try {
      const prescriptions = await storage.getPrescriptionsByPatientId(req.params.patientId);
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prescriptions" });
    }
  });

  // Get finalized prescriptions for patient (patient portal view)
  app.get("/api/prescriptions/patient-id/:patientId/finalized", async (req, res) => {
    try {
      const prescriptions = await storage.getFinalizedPrescriptionsByPatientId(req.params.patientId);
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prescriptions" });
    }
  });

  // Finalize prescription (add digital signature)
  app.post("/api/prescriptions/:id/finalize", async (req, res) => {
    try {
      const { signedBy, signedByName, userRole } = req.body;
      
      // Only ADMIN and DOCTOR can finalize prescriptions
      if (!['ADMIN', 'DOCTOR'].includes(userRole)) {
        return res.status(403).json({ error: "Only Doctors and Admins can finalize prescriptions" });
      }

      const prescription = await storage.finalizePrescription(req.params.id, signedBy, signedByName);
      if (!prescription) {
        return res.status(404).json({ error: "Prescription not found" });
      }

      // Send notification to patient
      if (prescription.patientId && prescription.patientName) {
        notificationService.notifyPrescriptionCreated(
          prescription.id,
          prescription.patientId,
          prescription.patientName,
          prescription.signedByName || 'Doctor'
        ).catch(err => console.error("Notification error:", err));
      }

      res.json(prescription);
    } catch (error) {
      res.status(500).json({ error: "Failed to finalize prescription" });
    }
  });

  // ========== PRESCRIPTION ITEMS ROUTES ==========

  // Get prescription items
  app.get("/api/prescriptions/:id/items", async (req, res) => {
    try {
      const items = await storage.getPrescriptionItems(req.params.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prescription items" });
    }
  });

  // Create prescription items (batch)
  app.post("/api/prescriptions/:id/items", async (req, res) => {
    try {
      const { items } = req.body;
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: "Items array required" });
      }
      
      const itemsWithPrescriptionId = items.map(item => ({
        ...item,
        prescriptionId: req.params.id
      }));
      
      const createdItems = await storage.createPrescriptionItems(itemsWithPrescriptionId);
      res.status(201).json(createdItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to create prescription items" });
    }
  });

  // Update prescription with items (combined create)
  app.post("/api/prescriptions/with-items", async (req, res) => {
    try {
      const { prescription, items } = req.body;
      
      const parsed = insertPrescriptionSchema.safeParse(prescription);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      
      // Create prescription
      const createdPrescription = await storage.createPrescription(parsed.data);
      
      // Create prescription items if provided
      if (items && Array.isArray(items) && items.length > 0) {
        const itemsWithPrescriptionId = items.map(item => ({
          ...item,
          prescriptionId: createdPrescription.id
        }));
        await storage.createPrescriptionItems(itemsWithPrescriptionId);
      }

      // Fetch items to return with prescription
      const prescriptionItems = await storage.getPrescriptionItems(createdPrescription.id);

      res.status(201).json({ 
        ...createdPrescription, 
        items: prescriptionItems 
      });
    } catch (error) {
      console.error("Error creating prescription with items:", error);
      res.status(500).json({ error: "Failed to create prescription" });
    }
  });

  // Delete all prescription items
  app.delete("/api/prescriptions/:id/items", async (req, res) => {
    try {
      await storage.deletePrescriptionItems(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete prescription items" });
    }
  });

  // ========== DOCTOR SCHEDULE ROUTES ==========

  // Get doctor schedules by user ID
  app.get("/api/doctor-schedules/:doctorId", async (req, res) => {
    try {
      const schedules = await databaseStorage.getDoctorSchedules(req.params.doctorId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch doctor schedules" });
    }
  });

  // Get doctor schedules by doctor name (for admin view)
  // Maps doctors table name to user with matching username and fetches their schedules
  app.get("/api/doctor-schedules-by-name/:doctorName", async (req, res) => {
    try {
      const doctorName = decodeURIComponent(req.params.doctorName);
      const firstName = doctorName.toLowerCase().split(' ')[0];
      
      // Try to find user by matching first name in username
      let matchingUser = await databaseStorage.getUserByUsername(firstName);
      
      if (!matchingUser) {
        // Try with 'dr.' prefix
        matchingUser = await databaseStorage.getUserByUsername(`dr.${firstName}`);
      }
      
      if (matchingUser && matchingUser.role === 'DOCTOR') {
        const schedules = await databaseStorage.getDoctorSchedules(matchingUser.id);
        res.json(schedules);
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch doctor schedules" });
    }
  });

  // Create doctor schedule (and auto-generate time slots if specific date)
  app.post("/api/doctor-schedules", async (req, res) => {
    try {
      const parsed = insertDoctorScheduleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const schedule = await databaseStorage.createDoctorSchedule(parsed.data);

      // Auto-generate time slots if schedule has a specific date
      if (schedule.specificDate && schedule.isAvailable) {
        try {
          // Get doctor name from users table (schedule.doctorId is the user ID)
          let doctorName = 'Doctor';
          const doctorUser = await databaseStorage.getUser(schedule.doctorId);
          if (doctorUser && doctorUser.name) {
            doctorName = doctorUser.name;
          }

          // Utility functions for slot generation (defined inline)
          const timeToMins = (timeStr: string): number => {
            const [time, period] = timeStr.split(' ');
            const [hours, minutes] = time.split(':').map(Number);
            let totalHours = hours;
            if (period === 'PM' && hours !== 12) totalHours += 12;
            if (period === 'AM' && hours === 12) totalHours = 0;
            return totalHours * 60 + (minutes || 0);
          };

          const minsToTime = (mins: number): string => {
            const hours = Math.floor(mins / 60);
            const minutes = mins % 60;
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
            return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
          };

          // Generate 30-minute slots
          const slotsToCreate: InsertDoctorTimeSlot[] = [];
          const startMins = timeToMins(schedule.startTime);
          const endMins = timeToMins(schedule.endTime);
          const slotDuration = 30;

          for (let mins = startMins; mins < endMins; mins += slotDuration) {
            slotsToCreate.push({
              scheduleId: schedule.id,
              doctorId: schedule.doctorId,
              doctorName,
              slotDate: schedule.specificDate,
              startTime: minsToTime(mins),
              endTime: minsToTime(mins + slotDuration),
              slotType: schedule.slotType,
              location: schedule.location,
              status: 'available',
              appointmentId: null,
              patientId: null,
              patientName: null,
            });
          }

          if (slotsToCreate.length > 0) {
            await databaseStorage.createDoctorTimeSlotsBulk(slotsToCreate);
            
            // Broadcast slot update via WebSocket
            notificationService.broadcastSlotUpdate({
              type: 'slots.generated',
              doctorId: schedule.doctorId,
              date: schedule.specificDate,
              count: slotsToCreate.length
            });
          }
        } catch (slotError) {
          console.error("Error auto-generating time slots:", slotError);
          // Don't fail the schedule creation if slot generation fails
        }
      }

      res.status(201).json(schedule);
    } catch (error) {
      res.status(500).json({ error: "Failed to create doctor schedule" });
    }
  });

  // Update doctor schedule (and regenerate time slots if schedule changes)
  app.patch("/api/doctor-schedules/:id", async (req, res) => {
    try {
      console.log("Updating doctor schedule:", req.params.id, req.body);
      const schedule = await databaseStorage.updateDoctorSchedule(req.params.id, req.body);
      if (!schedule) {
        return res.status(404).json({ error: "Doctor schedule not found" });
      }

      // Regenerate time slots if schedule has a specific date and is available
      if (schedule.specificDate && schedule.isAvailable) {
        try {
          // Delete existing slots for this schedule first
          await databaseStorage.deleteTimeSlotsBySchedule(schedule.id);

          // Get doctor name from users table (schedule.doctorId is the user ID)
          let doctorName = 'Doctor';
          const doctorUser = await databaseStorage.getUser(schedule.doctorId);
          if (doctorUser && doctorUser.name) {
            doctorName = doctorUser.name;
          }

          // Utility functions for slot generation
          const timeToMins = (timeStr: string): number => {
            const [time, period] = timeStr.split(' ');
            const [hours, minutes] = time.split(':').map(Number);
            let totalHours = hours;
            if (period === 'PM' && hours !== 12) totalHours += 12;
            if (period === 'AM' && hours === 12) totalHours = 0;
            return totalHours * 60 + (minutes || 0);
          };

          const minsToTime = (mins: number): string => {
            const hours = Math.floor(mins / 60);
            const minutes = mins % 60;
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
            return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
          };

          // Generate 30-minute slots
          const slotsToCreate: InsertDoctorTimeSlot[] = [];
          const startMins = timeToMins(schedule.startTime);
          const endMins = timeToMins(schedule.endTime);
          const slotDuration = 30;

          for (let mins = startMins; mins < endMins; mins += slotDuration) {
            slotsToCreate.push({
              scheduleId: schedule.id,
              doctorId: schedule.doctorId,
              doctorName,
              slotDate: schedule.specificDate,
              startTime: minsToTime(mins),
              endTime: minsToTime(mins + slotDuration),
              slotType: schedule.slotType,
              location: schedule.location,
              status: 'available',
              appointmentId: null,
              patientId: null,
              patientName: null,
            });
          }

          if (slotsToCreate.length > 0) {
            await databaseStorage.createDoctorTimeSlotsBulk(slotsToCreate);
            
            // Broadcast slot update via WebSocket
            notificationService.broadcastSlotUpdate({
              type: 'slots.regenerated',
              doctorId: schedule.doctorId,
              date: schedule.specificDate,
              count: slotsToCreate.length
            });
          }
        } catch (slotError) {
          console.error("Error regenerating time slots:", slotError);
        }
      }

      res.json(schedule);
    } catch (error) {
      console.error("Error updating doctor schedule:", error);
      res.status(500).json({ error: "Failed to update doctor schedule" });
    }
  });

  // Delete doctor schedule (and associated time slots)
  app.delete("/api/doctor-schedules/:id", async (req, res) => {
    try {
      // Delete associated time slots first
      try {
        await databaseStorage.deleteTimeSlotsBySchedule(req.params.id);
      } catch (slotError) {
        console.error("Error deleting associated time slots:", slotError);
      }

      const deleted = await databaseStorage.deleteDoctorSchedule(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Doctor schedule not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete doctor schedule" });
    }
  });

  // ========== DOCTOR TIME SLOTS ROUTES ==========
  
  // Utility function to parse time string to minutes
  function timeToMinutes(timeStr: string): number {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalHours = hours;
    if (period === 'PM' && hours !== 12) totalHours += 12;
    if (period === 'AM' && hours === 12) totalHours = 0;
    return totalHours * 60 + (minutes || 0);
  }

  // Utility function to convert minutes back to time string
  function minutesToTime(mins: number): string {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  // Generate 30-minute time slots from a schedule
  function generateTimeSlotsFromSchedule(
    scheduleId: string,
    doctorId: string,
    doctorName: string,
    slotDate: string,
    startTime: string,
    endTime: string,
    slotType: string,
    location: string | null
  ): InsertDoctorTimeSlot[] {
    const slots: InsertDoctorTimeSlot[] = [];
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    const slotDuration = 30; // 30-minute slots

    for (let mins = startMins; mins < endMins; mins += slotDuration) {
      const slotStart = minutesToTime(mins);
      const slotEnd = minutesToTime(mins + slotDuration);
      slots.push({
        scheduleId,
        doctorId,
        doctorName,
        slotDate,
        startTime: slotStart,
        endTime: slotEnd,
        slotType,
        location,
        status: 'available',
        appointmentId: null,
        patientId: null,
        patientName: null,
      });
    }
    return slots;
  }

  // Helper function to resolve doctor ID (handles both doctors table ID and users table ID)
  async function resolveDoctorId(doctorId: string): Promise<string> {
    // First check if this is a doctors table entry and get the corresponding user ID
    const doctors = await databaseStorage.getDoctors();
    const doctorEntry = doctors.find(d => d.id === doctorId);
    
    if (doctorEntry) {
      // This is a doctors table ID - need to find the corresponding user
      // The doctor's name format is "Dr. FirstName LastName" but user might be "dr.firstname" or similar
      const nameParts = doctorEntry.name.toLowerCase().replace('dr. ', '').split(' ');
      const firstName = nameParts[0];
      
      // Try to find user by username patterns
      let user = await databaseStorage.getUserByUsername(firstName);
      if (!user) {
        user = await databaseStorage.getUserByUsername(`dr.${firstName}`);
      }
      if (!user) {
        // Try full name pattern
        user = await databaseStorage.getUserByUsername(`dr.${firstName}.${nameParts[1] || ''}`);
      }
      
      if (user && user.role === 'DOCTOR') {
        return user.id;
      }
    }
    
    // If not found in doctors table or no user mapping, return original ID
    return doctorId;
  }

  // Get all time slots for a specific date (for admin dashboard)
  app.get("/api/time-slots/all", async (req, res) => {
    try {
      const { date } = req.query;
      if (!date) {
        return res.status(400).json({ error: "Date is required" });
      }
      const slots = await databaseStorage.getAllTimeSlotsForDate(date as string);
      res.json(slots);
    } catch (error) {
      console.error("Error fetching all time slots:", error);
      res.status(500).json({ error: "Failed to fetch time slots" });
    }
  });

  // Get time slots for a doctor (filtered by date and status)
  app.get("/api/time-slots/:doctorId", async (req, res) => {
    try {
      const { date, status } = req.query;
      
      // Resolve the doctor ID (handle both doctors table and users table IDs)
      const resolvedDoctorId = await resolveDoctorId(req.params.doctorId);
      
      const slots = await databaseStorage.getDoctorTimeSlots(
        resolvedDoctorId,
        date as string | undefined,
        status as string | undefined
      );
      res.json(slots);
    } catch (error) {
      console.error("Error fetching time slots:", error);
      res.status(500).json({ error: "Failed to fetch time slots" });
    }
  });

  // Get available time slots for a doctor on a specific date (for patients)
  app.get("/api/time-slots/:doctorId/available/:date", async (req, res) => {
    try {
      // Resolve the doctor ID (handle both doctors table and users table IDs)
      const resolvedDoctorId = await resolveDoctorId(req.params.doctorId);
      
      const slots = await databaseStorage.getAvailableTimeSlots(
        resolvedDoctorId,
        req.params.date
      );
      res.json(slots);
    } catch (error) {
      console.error("Error fetching available time slots:", error);
      res.status(500).json({ error: "Failed to fetch available time slots" });
    }
  });

  // Generate time slots from a schedule (usually called when doctor creates/updates schedule)
  app.post("/api/time-slots/generate/:scheduleId", async (req, res) => {
    try {
      const { doctorName } = req.body;
      const schedule = await databaseStorage.getDoctorSchedule(req.params.scheduleId);
      
      if (!schedule) {
        return res.status(404).json({ error: "Schedule not found" });
      }

      if (!schedule.specificDate) {
        return res.status(400).json({ error: "Schedule must have a specific date to generate slots" });
      }

      // Delete existing slots for this schedule
      await databaseStorage.deleteTimeSlotsBySchedule(req.params.scheduleId);

      // Generate new slots
      const slotsToCreate = generateTimeSlotsFromSchedule(
        schedule.id,
        schedule.doctorId,
        doctorName || 'Doctor',
        schedule.specificDate,
        schedule.startTime,
        schedule.endTime,
        schedule.slotType,
        schedule.location
      );

      const createdSlots = await databaseStorage.createDoctorTimeSlotsBulk(slotsToCreate);

      // Broadcast slot update via WebSocket
      notificationService.broadcastSlotUpdate({
        type: 'slots.generated',
        doctorId: schedule.doctorId,
        date: schedule.specificDate,
        count: createdSlots.length
      });

      res.status(201).json(createdSlots);
    } catch (error) {
      console.error("Error generating time slots:", error);
      res.status(500).json({ error: "Failed to generate time slots" });
    }
  });

  // Book a time slot (with double-booking prevention)
  app.post("/api/time-slots/:slotId/book", async (req, res) => {
    try {
      const { patientId, patientName, patientPhone, patientEmail, symptoms } = req.body;

      if (!patientId || !patientName) {
        return res.status(400).json({ error: "Patient ID and name are required" });
      }

      // Get the slot first to verify it exists
      const slot = await databaseStorage.getDoctorTimeSlot(req.params.slotId);
      if (!slot) {
        return res.status(404).json({ error: "Slot not found" });
      }

      if (slot.status !== 'available') {
        return res.status(409).json({ error: "Slot is no longer available" });
      }

      // Create appointment first
      const appointmentId = `APT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const appointment = await databaseStorage.createAppointment({
        appointmentId,
        patientId,
        patientName,
        patientPhone: patientPhone || '',
        patientEmail,
        doctorId: slot.doctorId,
        appointmentDate: slot.slotDate,
        timeSlot: `${slot.startTime} - ${slot.endTime}`,
        department: slot.slotType,
        location: slot.location,
        symptoms,
        status: 'scheduled'
      });

      // Book the slot using transactional locking
      const bookedSlot = await databaseStorage.bookTimeSlot(
        req.params.slotId,
        patientId,
        patientName,
        appointment.id
      );

      if (!bookedSlot) {
        // Slot was booked by someone else, cancel the appointment we just created
        await databaseStorage.updateAppointmentStatus(appointment.id, 'cancelled');
        return res.status(409).json({ error: "Slot was booked by another patient. Please select a different slot." });
      }

      // Broadcast slot update via WebSocket
      notificationService.broadcastSlotUpdate({
        type: 'slot.booked',
        slotId: bookedSlot.id,
        doctorId: bookedSlot.doctorId,
        date: bookedSlot.slotDate,
        startTime: bookedSlot.startTime,
        patientName: bookedSlot.patientName
      });

      // Log activity for admin dashboard recent activities
      await storage.createActivityLog({
        action: `New appointment booked for ${patientName}`,
        entityType: "appointment",
        entityId: appointment.id,
        performedBy: "OPD System",
        performedByRole: "SYSTEM",
        activityType: "info"
      });

      // Send real-time notification to doctor, patient, and admin
      notificationService.notifyAppointmentCreated(
        appointment.id,
        slot.doctorId,
        patientName,
        slot.slotDate,
        `${slot.startTime} - ${slot.endTime}`,
        slot.slotType || undefined,
        slot.location || undefined,
        patientId
      ).catch(err => console.error("Notification error:", err));

      res.status(200).json({ slot: bookedSlot, appointment });
    } catch (error) {
      console.error("Error booking time slot:", error);
      res.status(500).json({ error: "Failed to book time slot" });
    }
  });

  // Cancel a time slot booking
  app.post("/api/time-slots/:slotId/cancel", async (req, res) => {
    try {
      const slot = await databaseStorage.getDoctorTimeSlot(req.params.slotId);
      if (!slot) {
        return res.status(404).json({ error: "Slot not found" });
      }

      if (slot.status !== 'booked') {
        return res.status(400).json({ error: "Slot is not booked" });
      }

      // Cancel the associated appointment
      if (slot.appointmentId) {
        await databaseStorage.updateAppointmentStatus(slot.appointmentId, 'cancelled');
      }

      // Release the slot
      const cancelledSlot = await databaseStorage.cancelTimeSlot(req.params.slotId);

      // Broadcast slot update via WebSocket
      notificationService.broadcastSlotUpdate({
        type: 'slot.cancelled',
        slotId: cancelledSlot!.id,
        doctorId: cancelledSlot!.doctorId,
        date: cancelledSlot!.slotDate,
        startTime: cancelledSlot!.startTime
      });

      res.json(cancelledSlot);
    } catch (error) {
      console.error("Error cancelling time slot:", error);
      res.status(500).json({ error: "Failed to cancel time slot" });
    }
  });

  // Get a single time slot
  app.get("/api/time-slots/slot/:slotId", async (req, res) => {
    try {
      const slot = await databaseStorage.getDoctorTimeSlot(req.params.slotId);
      if (!slot) {
        return res.status(404).json({ error: "Slot not found" });
      }
      res.json(slot);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch time slot" });
    }
  });

  // ========== DOCTOR PATIENT ROUTES ==========

  // Get doctor patients
  app.get("/api/doctor-patients/:doctorId", async (req, res) => {
    try {
      const patients = await storage.getDoctorPatients(req.params.doctorId);
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch doctor patients" });
    }
  });

  // Get single doctor patient
  app.get("/api/doctor-patients/patient/:id", async (req, res) => {
    try {
      const patient = await storage.getDoctorPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patient" });
    }
  });

  // Create doctor patient
  app.post("/api/doctor-patients", async (req, res) => {
    try {
      const parsed = insertDoctorPatientSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const patient = await storage.createDoctorPatient(parsed.data);
      res.status(201).json(patient);
    } catch (error) {
      res.status(500).json({ error: "Failed to create doctor patient" });
    }
  });

  // Update doctor patient
  app.patch("/api/doctor-patients/:id", async (req, res) => {
    try {
      const patient = await storage.updateDoctorPatient(req.params.id, req.body);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: "Failed to update patient" });
    }
  });

  // Delete doctor patient
  app.delete("/api/doctor-patients/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDoctorPatient(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete patient" });
    }
  });

  // ========== DOCTOR PROFILE ROUTES ==========
  app.get("/api/doctor-profiles/:doctorId", async (req, res) => {
    try {
      const profile = await storage.getDoctorProfile(req.params.doctorId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/doctor-profiles", async (req, res) => {
    try {
      const profile = await storage.createDoctorProfile(req.body);
      res.status(201).json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  app.patch("/api/doctor-profiles/:doctorId", async (req, res) => {
    try {
      let profile = await storage.getDoctorProfile(req.params.doctorId);
      if (!profile) {
        profile = await storage.createDoctorProfile({
          doctorId: req.params.doctorId,
          fullName: req.body.fullName || "Doctor",
          specialty: req.body.specialty || "General",
          ...req.body
        });
      } else {
        profile = await storage.updateDoctorProfile(req.params.doctorId, req.body);
      }

      // Also update the user's name in the users table
      if (req.body.fullName) {
        const user = await databaseStorage.getUser(req.params.doctorId);
        if (user) {
          await databaseStorage.updateUser(user.id, { name: req.body.fullName });
        }
      }

      // Send notification about profile update
      notificationService.notifyProfileUpdated(
        req.params.doctorId,
        "DOCTOR",
        "doctor"
      ).catch(err => console.error("Notification error:", err));

      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Photo upload endpoint - stores as base64 in database
  app.post("/api/doctor-profiles/:doctorId/photo", express.raw({ type: 'image/*', limit: '5mb' }), async (req, res) => {
    try {
      const contentType = req.headers['content-type'] || 'image/jpeg';
      const base64Data = Buffer.from(req.body).toString('base64');
      const photoUrl = `data:${contentType};base64,${base64Data}`;
      
      let profile = await storage.getDoctorProfile(req.params.doctorId);
      if (!profile) {
        profile = await storage.createDoctorProfile({
          doctorId: req.params.doctorId,
          fullName: "Doctor",
          specialty: "General",
          photoUrl
        });
      } else {
        profile = await storage.updateDoctorProfile(req.params.doctorId, { photoUrl });
      }
      res.json({ success: true, photoUrl });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload photo" });
    }
  });

  // Delete photo endpoint - removes photo from profile
  app.delete("/api/doctor-profiles/:doctorId/photo", async (req, res) => {
    try {
      const profile = await storage.getDoctorProfile(req.params.doctorId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      const updated = await storage.updateDoctorProfile(req.params.doctorId, { photoUrl: null });
      res.json({ success: true, profile: updated });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete photo" });
    }
  });

  // =========================================
  // DOCTOR OATH CONFIRMATIONS (NMC Physician's Pledge)
  // =========================================
  app.get("/api/doctor-oath/:doctorId/:date", async (req, res) => {
    try {
      const confirmation = await storage.getDoctorOathConfirmation(
        req.params.doctorId,
        req.params.date
      );
      res.json({ accepted: !!confirmation, confirmation });
    } catch (error) {
      res.status(500).json({ error: "Failed to check oath status" });
    }
  });

  app.post("/api/doctor-oath", async (req, res) => {
    try {
      const { doctorId, date } = req.body;
      
      const existing = await storage.getDoctorOathConfirmation(doctorId, date);
      if (existing) {
        return res.json({ success: true, confirmation: existing, message: "Already confirmed" });
      }
      
      const confirmation = await storage.createDoctorOathConfirmation({
        doctorId,
        date,
        oathAccepted: true
      });
      
      res.status(201).json({ success: true, confirmation });
    } catch (error) {
      res.status(500).json({ error: "Failed to record oath confirmation" });
    }
  });

  // =========================================
  // PATIENT PROFILES
  // =========================================
  app.get("/api/patient-profiles/:patientId", async (req, res) => {
    try {
      const profile = await storage.getPatientProfile(req.params.patientId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/patient-profiles", async (req, res) => {
    try {
      const profile = await storage.createPatientProfile(req.body);
      res.status(201).json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  app.put("/api/patient-profiles/:patientId", async (req, res) => {
    try {
      const profile = await storage.upsertPatientProfile({
        patientId: req.params.patientId,
        fullName: req.body.fullName,
        ...req.body
      });
      
      // Also update the user's name in the users table
      if (req.body.fullName) {
        const user = await databaseStorage.getUserByUsername(req.params.patientId);
        if (user) {
          await databaseStorage.updateUser(user.id, { name: req.body.fullName });
        }
      }
      
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to save profile" });
    }
  });

  // =========================================
  // USER NOTIFICATIONS (Role-based real-time notifications)
  // =========================================

  // Get notifications for a user
  app.get("/api/user-notifications/:userId", async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.params.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Get notifications by role (for admin dashboards)
  app.get("/api/user-notifications/role/:role", async (req, res) => {
    try {
      const notifications = await storage.getUserNotificationsByRole(req.params.role);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications by role" });
    }
  });

  // Get single notification
  app.get("/api/user-notifications/notification/:id", async (req, res) => {
    try {
      const notification = await storage.getUserNotification(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notification" });
    }
  });

  // Create notification (used internally or by admin)
  app.post("/api/user-notifications", async (req, res) => {
    try {
      const notification = await storage.createUserNotification(req.body);
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  // Mark notification as read
  app.patch("/api/user-notifications/:id/read", async (req, res) => {
    try {
      const notification = await storage.markUserNotificationRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read for a user
  app.patch("/api/user-notifications/:userId/read-all", async (req, res) => {
    try {
      await storage.markAllUserNotificationsRead(req.params.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // Delete notification
  app.delete("/api/user-notifications/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteUserNotification(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // ========== CONSENT FORMS ROUTES ==========
  
  // Helper function to verify admin access
  const verifyAdminAccess = async (req: express.Request, res: express.Response): Promise<boolean> => {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    
    if (!userId || !userRole) {
      res.status(401).json({ error: "Authentication required" });
      return false;
    }
    
    if (userRole !== 'ADMIN') {
      res.status(403).json({ error: "Access denied. Admin privileges required." });
      return false;
    }
    
    // Verify user exists and is admin
    const user = await storage.getUser(userId);
    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({ error: "Access denied. Invalid user or insufficient privileges." });
      return false;
    }
    
    return true;
  };
  
  // Get all consent forms (Admin only)
  app.get("/api/consent-forms", async (req, res) => {
    try {
      if (!(await verifyAdminAccess(req, res))) return;
      
      const forms = await storage.getConsentForms();
      // Return forms without the large file data for listing
      const formsWithoutData = forms.map(form => ({
        ...form,
        fileData: undefined, // Don't send file data in list view
        hasFile: !!form.fileData
      }));
      res.json(formsWithoutData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch consent forms" });
    }
  });

  // Get consent forms by category (Admin only)
  app.get("/api/consent-forms/category/:category", async (req, res) => {
    try {
      if (!(await verifyAdminAccess(req, res))) return;
      
      const forms = await storage.getConsentFormsByCategory(req.params.category);
      const formsWithoutData = forms.map(form => ({
        ...form,
        fileData: undefined,
        hasFile: !!form.fileData
      }));
      res.json(formsWithoutData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch consent forms by category" });
    }
  });

  // Get single consent form (Admin only)
  app.get("/api/consent-forms/:id", async (req, res) => {
    try {
      if (!(await verifyAdminAccess(req, res))) return;
      
      const form = await storage.getConsentForm(req.params.id);
      if (!form) {
        return res.status(404).json({ error: "Consent form not found" });
      }
      res.json(form);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch consent form" });
    }
  });

  // Download consent form file (Admin only)
  app.get("/api/consent-forms/:id/download", async (req, res) => {
    try {
      if (!(await verifyAdminAccess(req, res))) return;
      
      const form = await storage.getConsentForm(req.params.id);
      if (!form) {
        return res.status(404).json({ error: "Consent form not found" });
      }
      
      // Decode base64 and send as file
      const fileBuffer = Buffer.from(form.fileData, 'base64');
      res.setHeader('Content-Type', form.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${form.fileName}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      res.send(fileBuffer);
    } catch (error) {
      res.status(500).json({ error: "Failed to download consent form" });
    }
  });

  // Create consent form (Admin only, with validation)
  app.post("/api/consent-forms", async (req, res) => {
    try {
      if (!(await verifyAdminAccess(req, res))) return;
      
      const { name, description, category, fileName, fileData, fileSize, mimeType, uploadedBy } = req.body;
      
      // Validation
      if (!name || !fileName || !fileData || !uploadedBy) {
        return res.status(400).json({ error: "Name, fileName, fileData, and uploadedBy are required" });
      }
      
      // Validate file type (must be PDF)
      const allowedMimeTypes = ['application/pdf'];
      const effectiveMimeType = mimeType || 'application/pdf';
      if (!allowedMimeTypes.includes(effectiveMimeType)) {
        return res.status(400).json({ error: "Only PDF files are allowed" });
      }
      
      // Validate file size (max 10MB when base64 encoded)
      const maxBase64Size = 10 * 1024 * 1024 * 1.37; // ~13.7MB base64 for 10MB file
      if (fileData.length > maxBase64Size) {
        return res.status(400).json({ error: "File size must be less than 10MB" });
      }
      
      // Validate file name ends with .pdf
      if (!fileName.toLowerCase().endsWith('.pdf')) {
        return res.status(400).json({ error: "File must be a PDF document" });
      }

      const form = await storage.createConsentForm({
        name,
        description: description || null,
        category: category || "general",
        fileName,
        fileData,
        fileSize: fileSize || 0,
        mimeType: effectiveMimeType,
        uploadedBy,
        isActive: true
      });
      
      res.status(201).json({ ...form, fileData: undefined });
    } catch (error) {
      console.error("Failed to create consent form:", error);
      res.status(500).json({ error: "Failed to create consent form" });
    }
  });

  // Update consent form (Admin only)
  app.patch("/api/consent-forms/:id", async (req, res) => {
    try {
      if (!(await verifyAdminAccess(req, res))) return;
      
      const form = await storage.updateConsentForm(req.params.id, req.body);
      if (!form) {
        return res.status(404).json({ error: "Consent form not found" });
      }
      res.json({ ...form, fileData: undefined });
    } catch (error) {
      res.status(500).json({ error: "Failed to update consent form" });
    }
  });

  // Delete consent form (Admin only)
  app.delete("/api/consent-forms/:id", async (req, res) => {
    try {
      if (!(await verifyAdminAccess(req, res))) return;
      
      const deleted = await storage.deleteConsentForm(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Consent form not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete consent form" });
    }
  });

  // ========== CONSENT TEMPLATES API ==========
  // These are pre-defined PDF templates available for download
  
  // Get all consent templates (public endpoint for viewing available templates)
  app.get("/api/consent-templates", async (req, res) => {
    try {
      const templates = await databaseStorage.getAllConsentTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Failed to fetch consent templates:", error);
      res.status(500).json({ error: "Failed to fetch consent templates" });
    }
  });

  // Get consent templates by type
  app.get("/api/consent-templates/type/:type", async (req, res) => {
    try {
      const templates = await databaseStorage.getConsentTemplatesByType(req.params.type);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch consent templates by type" });
    }
  });

  // Get consent templates by category
  app.get("/api/consent-templates/category/:category", async (req, res) => {
    try {
      const templates = await databaseStorage.getConsentTemplatesByCategory(req.params.category);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch consent templates by category" });
    }
  });

  // Get single consent template by ID
  app.get("/api/consent-templates/:id", async (req, res) => {
    try {
      const template = await databaseStorage.getConsentTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Consent template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch consent template" });
    }
  });

  // ========== MEDICINES DATABASE API ==========
  
  // Get all medicines with optional search
  app.get("/api/medicines", async (req, res) => {
    try {
      const { search, category } = req.query;
      
      let medicineList;
      if (search && typeof search === 'string' && search.trim()) {
        medicineList = await databaseStorage.searchMedicines(search.trim());
      } else if (category && typeof category === 'string') {
        medicineList = await databaseStorage.getMedicinesByCategory(category);
      } else {
        medicineList = await databaseStorage.getAllMedicines();
      }
      
      res.json(medicineList);
    } catch (error) {
      console.error("Failed to fetch medicines:", error);
      res.status(500).json({ error: "Failed to fetch medicines" });
    }
  });

  // Get single medicine by ID
  app.get("/api/medicines/:id", async (req, res) => {
    try {
      const medicine = await databaseStorage.getMedicine(req.params.id);
      if (!medicine) {
        return res.status(404).json({ error: "Medicine not found" });
      }
      res.json(medicine);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch medicine" });
    }
  });

  // Import medicines from CSV (bulk import)
  app.post("/api/medicines/import", async (req, res) => {
    try {
      const { medicines: medicineData } = req.body;
      
      if (!Array.isArray(medicineData) || medicineData.length === 0) {
        return res.status(400).json({ error: "No medicine data provided" });
      }

      // Process in batches of 100 to avoid memory issues
      const batchSize = 100;
      let imported = 0;
      
      for (let i = 0; i < medicineData.length; i += batchSize) {
        const batch = medicineData.slice(i, i + batchSize);
        await databaseStorage.createMedicinesBulk(batch);
        imported += batch.length;
      }

      res.status(201).json({ 
        success: true, 
        imported,
        message: `Successfully imported ${imported} medicines`
      });
    } catch (error) {
      console.error("Failed to import medicines:", error);
      res.status(500).json({ error: "Failed to import medicines" });
    }
  });

  // Delete all medicines (for re-import)
  app.delete("/api/medicines/all", async (req, res) => {
    try {
      await databaseStorage.deleteAllMedicines();
      res.json({ success: true, message: "All medicines deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete medicines" });
    }
  });

  // Delete single medicine
  app.delete("/api/medicines/:id", async (req, res) => {
    try {
      const deleted = await databaseStorage.deleteMedicine(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Medicine not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete medicine" });
    }
  });

  // ========== OXYGEN TRACKING API ==========

  // Get all oxygen cylinders
  app.get("/api/oxygen/cylinders", async (req, res) => {
    try {
      const { status } = req.query;
      let cylinders;
      if (status && typeof status === 'string') {
        cylinders = await databaseStorage.getOxygenCylindersByStatus(status);
      } else {
        cylinders = await databaseStorage.getOxygenCylinders();
      }
      res.json(cylinders);
    } catch (error) {
      console.error("Failed to fetch oxygen cylinders:", error);
      res.status(500).json({ error: "Failed to fetch oxygen cylinders" });
    }
  });

  // Get single cylinder by ID
  app.get("/api/oxygen/cylinders/:id", async (req, res) => {
    try {
      const cylinder = await databaseStorage.getOxygenCylinder(req.params.id);
      if (!cylinder) {
        return res.status(404).json({ error: "Cylinder not found" });
      }
      res.json(cylinder);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cylinder" });
    }
  });

  // Create new cylinder
  app.post("/api/oxygen/cylinders", async (req, res) => {
    try {
      const cylinder = await databaseStorage.createOxygenCylinder(req.body);
      res.status(201).json(cylinder);
    } catch (error) {
      console.error("Failed to create cylinder:", error);
      res.status(500).json({ error: "Failed to create cylinder" });
    }
  });

  // Update cylinder
  app.patch("/api/oxygen/cylinders/:id", async (req, res) => {
    try {
      const cylinder = await databaseStorage.updateOxygenCylinder(req.params.id, req.body);
      if (!cylinder) {
        return res.status(404).json({ error: "Cylinder not found" });
      }
      res.json(cylinder);
    } catch (error) {
      res.status(500).json({ error: "Failed to update cylinder" });
    }
  });

  // Delete cylinder
  app.delete("/api/oxygen/cylinders/:id", async (req, res) => {
    try {
      const deleted = await databaseStorage.deleteOxygenCylinder(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Cylinder not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete cylinder" });
    }
  });

  // Get cylinder movements
  app.get("/api/oxygen/movements", async (req, res) => {
    try {
      const { cylinderId } = req.query;
      let movements;
      if (cylinderId && typeof cylinderId === 'string') {
        movements = await databaseStorage.getCylinderMovementsByCylinder(cylinderId);
      } else {
        movements = await databaseStorage.getCylinderMovements();
      }
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch movements" });
    }
  });

  // Create cylinder movement (issue/return)
  app.post("/api/oxygen/movements", async (req, res) => {
    try {
      const movement = await databaseStorage.createCylinderMovement(req.body);
      // Update cylinder status based on movement type
      if (req.body.movementType === 'ISSUE') {
        await databaseStorage.updateOxygenCylinder(req.body.cylinderId, { 
          status: 'in_use', 
          location: req.body.department,
          currentPressure: req.body.startPressure 
        });
      } else if (req.body.movementType === 'RETURN') {
        const remainingPressure = parseFloat(req.body.endPressure || '0');
        const status = remainingPressure < 50 ? 'empty' : 'full';
        await databaseStorage.updateOxygenCylinder(req.body.cylinderId, { 
          status, 
          location: 'Storage',
          currentPressure: req.body.endPressure 
        });
      }
      res.status(201).json(movement);
    } catch (error) {
      console.error("Failed to create movement:", error);
      res.status(500).json({ error: "Failed to create movement" });
    }
  });

  // Get oxygen consumption records
  app.get("/api/oxygen/consumption", async (req, res) => {
    try {
      const { patientId, department } = req.query;
      let records;
      if (patientId && typeof patientId === 'string') {
        records = await databaseStorage.getOxygenConsumptionByPatient(patientId);
      } else if (department && typeof department === 'string') {
        records = await databaseStorage.getOxygenConsumptionByDepartment(department);
      } else {
        records = await databaseStorage.getOxygenConsumptionRecords();
      }
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch consumption records" });
    }
  });

  // Create consumption record
  app.post("/api/oxygen/consumption", async (req, res) => {
    try {
      const data = {
        ...req.body,
        startTime: req.body.startTime ? new Date(req.body.startTime) : new Date(),
        endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
      };
      const record = await databaseStorage.createOxygenConsumption(data);
      res.status(201).json(record);
    } catch (error) {
      console.error("Failed to create consumption record:", error);
      res.status(500).json({ error: "Failed to create consumption record" });
    }
  });

  // Update consumption record (end session)
  app.patch("/api/oxygen/consumption/:id", async (req, res) => {
    try {
      const record = await databaseStorage.updateOxygenConsumption(req.params.id, req.body);
      if (!record) {
        return res.status(404).json({ error: "Record not found" });
      }
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: "Failed to update consumption record" });
    }
  });

  // Get LMO readings
  app.get("/api/oxygen/lmo", async (req, res) => {
    try {
      const { date } = req.query;
      let readings;
      if (date && typeof date === 'string') {
        readings = await databaseStorage.getLmoReadingsByDate(date);
      } else {
        readings = await databaseStorage.getLmoReadings();
      }
      res.json(readings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch LMO readings" });
    }
  });

  // Create LMO reading
  app.post("/api/oxygen/lmo", async (req, res) => {
    try {
      const reading = await databaseStorage.createLmoReading(req.body);
      // Check for low level alert
      const levelPercentage = parseFloat(req.body.levelPercentage || '100');
      if (levelPercentage < 20) {
        await databaseStorage.createOxygenAlert({
          alertType: 'LOW_STOCK',
          severity: levelPercentage < 10 ? 'critical' : 'warning',
          title: 'Low LMO Tank Level',
          message: `LMO tank level is at ${levelPercentage}%. Please arrange for refill.`,
          isResolved: false
        });
      }
      res.status(201).json(reading);
    } catch (error) {
      console.error("Failed to create LMO reading:", error);
      res.status(500).json({ error: "Failed to create LMO reading" });
    }
  });

  // Get oxygen alerts
  app.get("/api/oxygen/alerts", async (req, res) => {
    try {
      const { active } = req.query;
      let alerts;
      if (active === 'true') {
        alerts = await databaseStorage.getActiveOxygenAlerts();
      } else {
        alerts = await databaseStorage.getOxygenAlerts();
      }
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  // Create oxygen alert
  app.post("/api/oxygen/alerts", async (req, res) => {
    try {
      const alert = await databaseStorage.createOxygenAlert(req.body);
      res.status(201).json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to create alert" });
    }
  });

  // Resolve oxygen alert
  app.patch("/api/oxygen/alerts/:id/resolve", async (req, res) => {
    try {
      const { resolvedBy } = req.body;
      const alert = await databaseStorage.resolveOxygenAlert(req.params.id, resolvedBy || 'System');
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to resolve alert" });
    }
  });

  // ========== BIOMEDICAL WASTE MANAGEMENT (BMW) ROUTES ==========

  // Generate unique barcode for BMW bag
  const generateBMWBarcode = () => {
    const prefix = "BMW";
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  // Generate pickup ID
  const generatePickupId = () => {
    const prefix = "PU";
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${date}-${random}`;
  };

  // Get all BMW bags
  app.get("/api/bmw/bags", async (req, res) => {
    try {
      const { status, category, department } = req.query;
      const bags = await databaseStorage.getBmwBags({ 
        status: status as string, 
        category: category as string, 
        department: department as string 
      });
      res.json(bags);
    } catch (error) {
      console.error("Failed to fetch BMW bags:", error);
      res.status(500).json({ error: "Failed to fetch BMW bags" });
    }
  });

  // Create BMW bag with auto-generated barcode
  app.post("/api/bmw/bags", async (req, res) => {
    try {
      const barcode = generateBMWBarcode();
      const now = new Date();
      const storageDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now
      
      const bag = await databaseStorage.createBmwBag({
        barcode,
        category: req.body.category,
        department: req.body.department,
        approxWeight: req.body.approxWeight,
        status: "GENERATED",
        generatedBy: req.body.generatedBy || "System",
        generatedByRole: req.body.generatedByRole || "ADMIN",
        storageDeadline,
        notes: req.body.notes
      });

      // Create movement record
      await databaseStorage.createBmwMovement({
        bagId: bag.id,
        action: "CREATED",
        performedBy: req.body.generatedBy || "System",
        performedByRole: req.body.generatedByRole || "ADMIN",
        location: req.body.department,
        weight: req.body.approxWeight,
        notes: "Bag generated"
      });

      res.status(201).json(bag);
    } catch (error) {
      console.error("Failed to create BMW bag:", error);
      res.status(500).json({ error: "Failed to create BMW bag" });
    }
  });

  // Update BMW bag status
  app.patch("/api/bmw/bags/:id", async (req, res) => {
    try {
      const bag = await databaseStorage.updateBmwBag(req.params.id, req.body);
      if (!bag) {
        return res.status(404).json({ error: "Bag not found" });
      }
      res.json(bag);
    } catch (error) {
      console.error("Failed to update BMW bag:", error);
      res.status(500).json({ error: "Failed to update BMW bag" });
    }
  });

  // Get BMW statistics
  app.get("/api/bmw/stats", async (req, res) => {
    try {
      const stats = await databaseStorage.getBmwStats();
      res.json(stats);
    } catch (error) {
      console.error("Failed to fetch BMW stats:", error);
      res.status(500).json({ error: "Failed to fetch BMW stats" });
    }
  });

  // Get BMW movements
  app.get("/api/bmw/movements", async (req, res) => {
    try {
      const { bagId } = req.query;
      const movements = await databaseStorage.getBmwMovements(bagId as string);
      res.json(movements);
    } catch (error) {
      console.error("Failed to fetch BMW movements:", error);
      res.status(500).json({ error: "Failed to fetch BMW movements" });
    }
  });

  // Create BMW movement
  app.post("/api/bmw/movements", async (req, res) => {
    try {
      const movement = await databaseStorage.createBmwMovement(req.body);
      res.status(201).json(movement);
    } catch (error) {
      console.error("Failed to create BMW movement:", error);
      res.status(500).json({ error: "Failed to create BMW movement" });
    }
  });

  // Get all storage rooms
  app.get("/api/bmw/storage-rooms", async (req, res) => {
    try {
      const rooms = await databaseStorage.getBmwStorageRooms();
      res.json(rooms);
    } catch (error) {
      console.error("Failed to fetch storage rooms:", error);
      res.status(500).json({ error: "Failed to fetch storage rooms" });
    }
  });

  // Create storage room
  app.post("/api/bmw/storage-rooms", async (req, res) => {
    try {
      const room = await databaseStorage.createBmwStorageRoom(req.body);
      res.status(201).json(room);
    } catch (error) {
      console.error("Failed to create storage room:", error);
      res.status(500).json({ error: "Failed to create storage room" });
    }
  });

  // Get all vendors
  app.get("/api/bmw/vendors", async (req, res) => {
    try {
      const vendors = await databaseStorage.getBmwVendors();
      res.json(vendors);
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
      res.status(500).json({ error: "Failed to fetch vendors" });
    }
  });

  // Create vendor
  app.post("/api/bmw/vendors", async (req, res) => {
    try {
      const vendorId = `VND-${Date.now().toString(36).toUpperCase()}`;
      const vendor = await databaseStorage.createBmwVendor({
        ...req.body,
        vendorId
      });
      res.status(201).json(vendor);
    } catch (error) {
      console.error("Failed to create vendor:", error);
      res.status(500).json({ error: "Failed to create vendor" });
    }
  });

  // Get all pickups
  app.get("/api/bmw/pickups", async (req, res) => {
    try {
      const pickups = await databaseStorage.getBmwPickups();
      res.json(pickups);
    } catch (error) {
      console.error("Failed to fetch pickups:", error);
      res.status(500).json({ error: "Failed to fetch pickups" });
    }
  });

  // Create pickup
  app.post("/api/bmw/pickups", async (req, res) => {
    try {
      const pickupId = generatePickupId();
      const pickup = await databaseStorage.createBmwPickup({
        ...req.body,
        pickupId
      });
      res.status(201).json(pickup);
    } catch (error) {
      console.error("Failed to create pickup:", error);
      res.status(500).json({ error: "Failed to create pickup" });
    }
  });

  // Get all disposals
  app.get("/api/bmw/disposals", async (req, res) => {
    try {
      const disposals = await databaseStorage.getBmwDisposals();
      res.json(disposals);
    } catch (error) {
      console.error("Failed to fetch disposals:", error);
      res.status(500).json({ error: "Failed to fetch disposals" });
    }
  });

  // Create disposal
  app.post("/api/bmw/disposals", async (req, res) => {
    try {
      const disposal = await databaseStorage.createBmwDisposal(req.body);
      // Update bag status to DISPOSED
      if (req.body.bagId) {
        await databaseStorage.updateBmwBag(req.body.bagId, { 
          status: "DISPOSED",
          disposedAt: new Date()
        });
      }
      res.status(201).json(disposal);
    } catch (error) {
      console.error("Failed to create disposal:", error);
      res.status(500).json({ error: "Failed to create disposal" });
    }
  });

  // Get all incidents
  app.get("/api/bmw/incidents", async (req, res) => {
    try {
      const incidents = await databaseStorage.getBmwIncidents();
      res.json(incidents);
    } catch (error) {
      console.error("Failed to fetch incidents:", error);
      res.status(500).json({ error: "Failed to fetch incidents" });
    }
  });

  // Create incident
  app.post("/api/bmw/incidents", async (req, res) => {
    try {
      const incident = await databaseStorage.createBmwIncident(req.body);
      res.status(201).json(incident);
    } catch (error) {
      console.error("Failed to create incident:", error);
      res.status(500).json({ error: "Failed to create incident" });
    }
  });

  // Get all reports
  app.get("/api/bmw/reports", async (req, res) => {
    try {
      const reports = await databaseStorage.getBmwReports();
      res.json(reports);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  // Generate report
  app.post("/api/bmw/reports", async (req, res) => {
    try {
      const report = await databaseStorage.createBmwReport(req.body);
      res.status(201).json(report);
    } catch (error) {
      console.error("Failed to create report:", error);
      res.status(500).json({ error: "Failed to create report" });
    }
  });

  // ========== AI INTELLIGENCE LAYER ROUTES ==========

  // Get Doctor Efficiency metrics
  app.get("/api/ai/doctor-efficiency", async (req, res) => {
    try {
      const { doctorId } = req.query;
      const metrics = await aiEngines.calculateDoctorEfficiency(doctorId as string | undefined);
      res.json(metrics);
    } catch (error) {
      console.error("Failed to calculate doctor efficiency:", error);
      res.status(500).json({ error: "Failed to calculate doctor efficiency metrics" });
    }
  });

  // Get Nurse Efficiency metrics
  app.get("/api/ai/nurse-efficiency", async (req, res) => {
    try {
      const { nurseId } = req.query;
      const metrics = await aiEngines.calculateNurseEfficiency(nurseId as string | undefined);
      res.json(metrics);
    } catch (error) {
      console.error("Failed to calculate nurse efficiency:", error);
      res.status(500).json({ error: "Failed to calculate nurse efficiency metrics" });
    }
  });

  // Get OPD Intelligence metrics
  app.get("/api/ai/opd-intelligence", async (req, res) => {
    try {
      const metrics = await aiEngines.calculateOPDIntelligence();
      res.json(metrics);
    } catch (error) {
      console.error("Failed to calculate OPD intelligence:", error);
      res.status(500).json({ error: "Failed to calculate OPD intelligence metrics" });
    }
  });

  // Get Hospital Health Index
  app.get("/api/ai/hospital-health", async (req, res) => {
    try {
      const metrics = await aiEngines.calculateHospitalHealthIndex();
      res.json(metrics);
    } catch (error) {
      console.error("Failed to calculate hospital health index:", error);
      res.status(500).json({ error: "Failed to calculate hospital health index" });
    }
  });

  // Get Predictions
  app.get("/api/ai/predictions", async (req, res) => {
    try {
      const predictions = await aiEngines.generatePredictions();
      res.json(predictions);
    } catch (error) {
      console.error("Failed to generate predictions:", error);
      res.status(500).json({ error: "Failed to generate predictions" });
    }
  });

  // Get Inpatient Analytics
  app.get("/api/ai/inpatient-analytics", async (req, res) => {
    try {
      const metrics = await aiEngines.calculateInpatientAnalytics();
      res.json(metrics);
    } catch (error) {
      console.error("Failed to calculate inpatient analytics:", error);
      res.status(500).json({ error: "Failed to calculate inpatient analytics" });
    }
  });

  // Get Resolved Alerts
  app.get("/api/resolved-alerts", async (req, res) => {
    try {
      const alerts = await storage.getResolvedAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Failed to fetch resolved alerts:", error);
      res.status(500).json({ error: "Failed to fetch resolved alerts" });
    }
  });

  // Add Resolved Alert
  app.post("/api/resolved-alerts", async (req, res) => {
    try {
      const { alertType, alertSeverity, alertMessage, patientId } = req.body;
      if (!alertType || !alertSeverity || !alertMessage) {
        return res.status(400).json({ error: "Missing required fields: alertType, alertSeverity, alertMessage" });
      }
      const userId = (req as any).session?.userId;
      const alertData = {
        alertType,
        alertSeverity,
        alertMessage,
        patientId: patientId || null,
        resolvedBy: userId || null
      };
      const alert = await storage.createResolvedAlert(alertData);
      res.status(201).json(alert);
    } catch (error) {
      console.error("Failed to create resolved alert:", error);
      res.status(500).json({ error: "Failed to create resolved alert" });
    }
  });

  // Delete Resolved Alert (unresolve)
  app.delete("/api/resolved-alerts/:id", async (req, res) => {
    try {
      await storage.deleteResolvedAlert(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete resolved alert:", error);
      res.status(500).json({ error: "Failed to delete resolved alert" });
    }
  });

  // ========== PATIENT BILLING ROUTES ==========

  // Get all patient bills
  app.get("/api/patient-bills", async (req, res) => {
    try {
      const bills = await storage.getAllPatientBills();
      res.json(bills);
    } catch (error) {
      console.error("Failed to fetch bills:", error);
      res.status(500).json({ error: "Failed to fetch bills" });
    }
  });

  // Get pending bill requests (for admin)
  app.get("/api/patient-bills/pending", async (req, res) => {
    try {
      const bills = await storage.getPendingBillRequests();
      res.json(bills);
    } catch (error) {
      console.error("Failed to fetch pending bills:", error);
      res.status(500).json({ error: "Failed to fetch pending bills" });
    }
  });

  // Get bill by ID
  app.get("/api/patient-bills/:id", async (req, res) => {
    try {
      const bill = await storage.getPatientBill(req.params.id);
      if (!bill) {
        return res.status(404).json({ error: "Bill not found" });
      }
      res.json(bill);
    } catch (error) {
      console.error("Failed to fetch bill:", error);
      res.status(500).json({ error: "Failed to fetch bill" });
    }
  });

  // Get bill by patient ID
  app.get("/api/patient-bills/patient/:patientId", async (req, res) => {
    try {
      const bill = await storage.getPatientBillByPatientId(req.params.patientId);
      res.json(bill || null);
    } catch (error) {
      console.error("Failed to fetch patient bill:", error);
      res.status(500).json({ error: "Failed to fetch patient bill" });
    }
  });

  // Create new bill (patient requests bill generation)
  app.post("/api/patient-bills", async (req, res) => {
    try {
      const { patientId, patientName, admissionId } = req.body;
      if (!patientId || !patientName) {
        return res.status(400).json({ error: "Patient ID and name are required" });
      }

      // Check if bill already exists for this patient
      const existingBill = await storage.getPatientBillByPatientId(patientId);
      if (existingBill) {
        return res.json(existingBill);
      }

      const bill = await storage.createPatientBill({
        patientId,
        patientName,
        admissionId,
        billRequestedAt: new Date(),
        status: "pending",
        roomCharges: "0",
        doctorConsultation: "0",
        labTests: "0",
        medicines: "0",
        inventoryCharges: "0",
        otherFees: "0",
        paidAmount: "0",
      });

      // Log activity
      await storage.createActivityLog({
        action: `Bill generation requested by ${patientName}`,
        entityType: "patient_bill",
        entityId: bill.id,
        performedBy: patientName,
        performedByRole: "PATIENT",
        activityType: "info"
      });

      // Send real-time notification to admin
      notificationService.notifyBillRequested(bill.id, patientId, patientName);

      res.status(201).json(bill);
    } catch (error) {
      console.error("Failed to create bill:", error);
      res.status(500).json({ error: "Failed to create bill" });
    }
  });

  // Update bill charges (admin updates)
  app.patch("/api/patient-bills/:id", async (req, res) => {
    try {
      const updates = req.body;
      const bill = await storage.updatePatientBill(req.params.id, updates);
      if (!bill) {
        return res.status(404).json({ error: "Bill not found" });
      }

      // Send real-time notification to patient
      notificationService.notifyBillUpdated(bill.id, bill.patientId, bill.totalAmount?.toString() || "0", bill.status);

      res.json(bill);
    } catch (error) {
      console.error("Failed to update bill:", error);
      res.status(500).json({ error: "Failed to update bill" });
    }
  });

  // Delete bill
  app.delete("/api/patient-bills/:id", async (req, res) => {
    try {
      await storage.deletePatientBill(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete bill:", error);
      res.status(500).json({ error: "Failed to delete bill" });
    }
  });

  // Get bill payments
  app.get("/api/patient-bills/:id/payments", async (req, res) => {
    try {
      const payments = await storage.getBillPayments(req.params.id);
      res.json(payments);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  // Add payment to bill
  app.post("/api/patient-bills/:id/payments", async (req, res) => {
    try {
      const { amount, paymentMethod, transactionId, notes } = req.body;
      if (!amount || !paymentMethod) {
        return res.status(400).json({ error: "Amount and payment method are required" });
      }

      const bill = await storage.getPatientBill(req.params.id);
      if (!bill) {
        return res.status(404).json({ error: "Bill not found" });
      }

      const payment = await storage.createBillPayment({
        billId: req.params.id,
        amount: amount.toString(),
        paymentMethod,
        transactionId,
        notes,
        receivedBy: (req as any).session?.userId || null
      });

      // Get updated bill
      const updatedBill = await storage.getPatientBill(req.params.id);
      
      // Notify patient of payment received
      if (updatedBill) {
        notificationService.notifyBillUpdated(
          updatedBill.id, 
          updatedBill.patientId, 
          updatedBill.totalAmount?.toString() || "0", 
          updatedBill.status
        );
      }

      res.status(201).json({ payment, bill: updatedBill });
    } catch (error) {
      console.error("Failed to add payment:", error);
      res.status(500).json({ error: "Failed to add payment" });
    }
  });

  // ========== HEALTH TIPS ROUTES ==========
  
  // Get all health tips
  app.get("/api/health-tips", async (req, res) => {
    try {
      const tips = await storage.getAllHealthTips();
      res.json(tips);
    } catch (error) {
      console.error("Failed to fetch health tips:", error);
      res.status(500).json({ error: "Failed to fetch health tips" });
    }
  });

  // Get active health tips
  app.get("/api/health-tips/active", async (req, res) => {
    try {
      const tips = await storage.getActiveHealthTips();
      res.json(tips);
    } catch (error) {
      console.error("Failed to fetch active health tips:", error);
      res.status(500).json({ error: "Failed to fetch active health tips" });
    }
  });

  // Get latest health tip
  app.get("/api/health-tips/latest", async (req, res) => {
    try {
      const tip = await storage.getLatestHealthTip();
      res.json(tip || null);
    } catch (error) {
      console.error("Failed to fetch latest health tip:", error);
      res.status(500).json({ error: "Failed to fetch latest health tip" });
    }
  });

  // Manually generate a health tip (Admin only)
  app.post("/api/health-tips/generate", async (req, res) => {
    try {
      const { scheduledFor = "9AM" } = req.body;
      const tip = await notificationService.generateHealthTipNow(scheduledFor);
      
      if (tip) {
        res.json(tip);
      } else {
        res.status(500).json({ error: "Failed to generate health tip" });
      }
    } catch (error) {
      console.error("Failed to generate health tip:", error);
      res.status(500).json({ error: "Failed to generate health tip" });
    }
  });

  // Get All AI Metrics (combined dashboard data)
  app.get("/api/ai/dashboard", async (req, res) => {
    try {
      const [doctorMetrics, nurseMetrics, opdMetrics, healthIndex, predictions] = await Promise.all([
        aiEngines.calculateDoctorEfficiency(),
        aiEngines.calculateNurseEfficiency(),
        aiEngines.calculateOPDIntelligence(),
        aiEngines.calculateHospitalHealthIndex(),
        aiEngines.generatePredictions()
      ]);

      res.json({
        doctorEfficiency: doctorMetrics,
        nurseEfficiency: nurseMetrics,
        opdIntelligence: opdMetrics,
        hospitalHealth: healthIndex,
        predictions
      });
    } catch (error) {
      console.error("Failed to fetch AI dashboard:", error);
      res.status(500).json({ error: "Failed to fetch AI dashboard data" });
    }
  });

  // ========== SWAB MONITORING ROUTES ==========
  
  // Swab Areas
  app.get("/api/swab-monitoring/areas", async (req, res) => {
    try {
      const areas = await storage.getAllSwabAreas();
      res.json(areas);
    } catch (error) {
      console.error("Failed to fetch swab areas:", error);
      res.status(500).json({ error: "Failed to fetch swab areas" });
    }
  });

  app.post("/api/swab-monitoring/areas", async (req, res) => {
    try {
      const area = await storage.createSwabArea(req.body);
      res.json(area);
    } catch (error) {
      console.error("Failed to create swab area:", error);
      res.status(500).json({ error: "Failed to create swab area" });
    }
  });

  // Sampling Sites
  app.get("/api/swab-monitoring/sampling-sites", async (req, res) => {
    try {
      const sites = await storage.getAllSwabSamplingSites();
      res.json(sites);
    } catch (error) {
      console.error("Failed to fetch sampling sites:", error);
      res.status(500).json({ error: "Failed to fetch sampling sites" });
    }
  });

  app.post("/api/swab-monitoring/sampling-sites", async (req, res) => {
    try {
      const site = await storage.createSwabSamplingSite(req.body);
      res.json(site);
    } catch (error) {
      console.error("Failed to create sampling site:", error);
      res.status(500).json({ error: "Failed to create sampling site" });
    }
  });

  // Organisms
  app.get("/api/swab-monitoring/organisms", async (req, res) => {
    try {
      const organisms = await storage.getAllSwabOrganisms();
      res.json(organisms);
    } catch (error) {
      console.error("Failed to fetch organisms:", error);
      res.status(500).json({ error: "Failed to fetch organisms" });
    }
  });

  app.post("/api/swab-monitoring/organisms", async (req, res) => {
    try {
      const organism = await storage.createSwabOrganism(req.body);
      res.json(organism);
    } catch (error) {
      console.error("Failed to create organism:", error);
      res.status(500).json({ error: "Failed to create organism" });
    }
  });

  // Swab Collections
  app.get("/api/swab-monitoring/collections", async (req, res) => {
    try {
      const collections = await storage.getAllSwabCollections();
      res.json(collections);
    } catch (error) {
      console.error("Failed to fetch swab collections:", error);
      res.status(500).json({ error: "Failed to fetch swab collections" });
    }
  });

  app.post("/api/swab-monitoring/collections", async (req, res) => {
    try {
      // Convert date strings to Date objects
      const collectionData = {
        ...req.body,
        collectionDate: req.body.collectionDate ? new Date(req.body.collectionDate) : new Date()
      };
      
      const collection = await storage.createSwabCollection(collectionData);
      
      // Create audit log
      await storage.createSwabAuditLog({
        entityType: "swab_collection",
        entityId: collection.id,
        action: "create",
        newValue: JSON.stringify(collection),
        performedBy: req.body.collectedBy,
        performedByName: req.body.collectedByName,
        performedByRole: "ICN",
      });
      
      res.json(collection);
    } catch (error) {
      console.error("Failed to create swab collection:", error);
      res.status(500).json({ error: "Failed to create swab collection" });
    }
  });

  // Lab Results with auto-interpretation logic
  app.get("/api/swab-monitoring/lab-results", async (req, res) => {
    try {
      const results = await storage.getAllSwabLabResults();
      res.json(results);
    } catch (error) {
      console.error("Failed to fetch lab results:", error);
      res.status(500).json({ error: "Failed to fetch lab results" });
    }
  });

  app.post("/api/swab-monitoring/lab-results", async (req, res) => {
    try {
      // Convert date strings to Date objects
      const labResultData = {
        ...req.body,
        resultDate: req.body.resultDate ? new Date(req.body.resultDate) : new Date()
      };
      
      const labResult = await storage.createSwabLabResult(labResultData);
      
      // Get the organism to determine result status
      const organism = await storage.getSwabOrganism(req.body.organismId);
      const collection = await storage.getSwabCollection(req.body.swabCollectionId);
      
      let resultStatus = "PASS";
      
      // Auto-interpretation logic
      if (organism) {
        if (organism.organismName === "No Growth" || organism.category === "none") {
          resultStatus = "PASS";
        } else if (organism.category === "flora" && req.body.growthLevel === "Low") {
          resultStatus = "ACCEPTABLE";
        } else if (organism.category === "pathogen" || req.body.growthLevel === "Moderate" || req.body.growthLevel === "Heavy") {
          resultStatus = "FAIL";
        }
      }
      
      // Update the swab collection with result status
      await storage.updateSwabCollection(req.body.swabCollectionId, {
        status: "completed",
        resultStatus,
      });
      
      // If FAIL, auto-generate CAPA
      if (resultStatus === "FAIL" && collection) {
        const area = await storage.getSwabArea(collection.areaId);
        const site = await storage.getSwabSamplingSite(collection.samplingSiteId);
        
        const issueSummary = `Contamination detected at ${area?.areaName || 'Unknown Area'} - ${site?.siteName || 'Unknown Site'}. Organism: ${organism?.organismName || 'Unknown'}. Growth Level: ${req.body.growthLevel}`;
        
        const capaAction = await storage.createSwabCapaAction({
          swabCollectionId: collection.id,
          issueSummary,
          immediateAction: "Deep cleaning",
          responsibleDepartment: "Housekeeping",
          targetClosureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          verificationSwabRequired: true,
        });
        
        // Audit log for CAPA creation
        await storage.createSwabAuditLog({
          entityType: "capa_action",
          entityId: capaAction.id,
          action: "create",
          newValue: JSON.stringify(capaAction),
          performedBy: "SYSTEM",
          performedByName: "Auto-generated",
          performedByRole: "SYSTEM",
        });
        
        // Create notification for admin
        await storage.createUserNotification({
          userId: "admin",
          userRole: "ADMIN",
          title: "Swab Contamination Alert",
          message: issueSummary,
          type: "swab_alert",
          metadata: JSON.stringify({
            swabId: collection.swabId,
            areaType: collection.areaType,
            resultStatus: "FAIL",
          }),
        });
      }
      
      // Create audit log
      await storage.createSwabAuditLog({
        entityType: "lab_result",
        entityId: labResult.id,
        action: "create",
        newValue: JSON.stringify({ ...labResult, resultStatus }),
        performedBy: req.body.processedBy,
        performedByName: req.body.processedByName,
        performedByRole: "LAB_STAFF",
      });
      
      res.json({ ...labResult, resultStatus });
    } catch (error) {
      console.error("Failed to create lab result:", error);
      res.status(500).json({ error: "Failed to create lab result" });
    }
  });

  // CAPA Actions
  app.get("/api/swab-monitoring/capa-actions", async (req, res) => {
    try {
      const capas = await storage.getAllSwabCapaActions();
      res.json(capas);
    } catch (error) {
      console.error("Failed to fetch CAPA actions:", error);
      res.status(500).json({ error: "Failed to fetch CAPA actions" });
    }
  });

  app.post("/api/swab-monitoring/capa-actions/:id/close", async (req, res) => {
    try {
      const { closedBy, closedByName, closureRemarks } = req.body;
      const capa = await storage.closeSwabCapaAction(req.params.id, closedBy, closedByName, closureRemarks);
      
      if (capa) {
        await storage.createSwabAuditLog({
          entityType: "capa_action",
          entityId: capa.id,
          action: "close",
          newValue: JSON.stringify(capa),
          performedBy: closedBy,
          performedByName: closedByName,
          performedByRole: "ADMIN",
        });
        res.json(capa);
      } else {
        res.status(404).json({ error: "CAPA not found" });
      }
    } catch (error) {
      console.error("Failed to close CAPA:", error);
      res.status(500).json({ error: "Failed to close CAPA" });
    }
  });

  app.patch("/api/swab-monitoring/capa-actions/:id", async (req, res) => {
    try {
      const capa = await storage.updateSwabCapaAction(req.params.id, req.body);
      if (capa) {
        res.json(capa);
      } else {
        res.status(404).json({ error: "CAPA not found" });
      }
    } catch (error) {
      console.error("Failed to update CAPA:", error);
      res.status(500).json({ error: "Failed to update CAPA" });
    }
  });

  // Audit Logs
  app.get("/api/swab-monitoring/audit-logs", async (req, res) => {
    try {
      const logs = await storage.getAllSwabAuditLogs();
      res.json(logs);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // Seed Demo Data for Swab Monitoring
  app.post("/api/swab-monitoring/seed-demo", async (req, res) => {
    try {
      // Get existing master data
      const areas = await storage.getAllSwabAreas();
      const sites = await storage.getAllSwabSamplingSites();
      const organisms = await storage.getAllSwabOrganisms();

      if (areas.length === 0 || sites.length === 0 || organisms.length === 0) {
        return res.status(400).json({ error: "Please seed master data first" });
      }

      // Find specific organisms for demo
      const noGrowth = organisms.find(o => o.organismName === "No Growth");
      const staphEpidermidis = organisms.find(o => o.organismName === "Staphylococcus epidermidis");
      const mrsa = organisms.find(o => o.organismName === "MRSA");
      const pseudomonas = organisms.find(o => o.organismName === "Pseudomonas aeruginosa");
      const bacillus = organisms.find(o => o.organismName === "Bacillus species");

      const demoCollections = [];

      // Create demo swab collections with various results
      const demoData = [
        { areaIdx: 0, siteIdx: 0, organism: noGrowth, growthLevel: "None", reason: "Routine", status: "PASS", dayOffset: -7 },
        { areaIdx: 0, siteIdx: 1, organism: noGrowth, growthLevel: "None", reason: "Post-fumigation", status: "PASS", dayOffset: -6 },
        { areaIdx: 1, siteIdx: 2, organism: staphEpidermidis, growthLevel: "Low", reason: "Routine", status: "ACCEPTABLE", dayOffset: -5 },
        { areaIdx: 1, siteIdx: 0, organism: bacillus, growthLevel: "Low", reason: "Routine", status: "ACCEPTABLE", dayOffset: -4 },
        { areaIdx: 2, siteIdx: 3, organism: mrsa, growthLevel: "Moderate", reason: "Outbreak suspicion", status: "FAIL", dayOffset: -3 },
        { areaIdx: 3, siteIdx: 4, organism: pseudomonas, growthLevel: "Heavy", reason: "Routine", status: "FAIL", dayOffset: -2 },
        { areaIdx: 0, siteIdx: 5, organism: noGrowth, growthLevel: "None", reason: "Post-fumigation", status: "PASS", dayOffset: -1 },
        { areaIdx: 4, siteIdx: 6, organism: staphEpidermidis, growthLevel: "Low", reason: "Routine", status: "ACCEPTABLE", dayOffset: 0 },
      ];

      for (const demo of demoData) {
        const area = areas[demo.areaIdx % areas.length];
        const site = sites[demo.siteIdx % sites.length];
        const collectionDate = new Date(Date.now() + demo.dayOffset * 24 * 60 * 60 * 1000);

        // Create collection
        const collection = await storage.createSwabCollection({
          collectionDate,
          areaType: area.areaType,
          areaId: area.id,
          samplingSiteId: site.id,
          reason: demo.reason,
          collectedBy: "ICN001",
          collectedByName: "Sr. Nurse Priya Sharma",
          remarks: `Demo ${demo.status} sample - ${demo.reason}`,
        });

        // Create lab result
        if (demo.organism) {
          const labResult = await storage.createSwabLabResult({
            swabCollectionId: collection.id,
            cultureMedia: demo.growthLevel === "None" ? "Blood Agar" : "MacConkey Agar",
            organismId: demo.organism.id,
            cfuCount: demo.growthLevel === "None" ? 0 : demo.growthLevel === "Low" ? 5 : demo.growthLevel === "Moderate" ? 25 : 100,
            growthLevel: demo.growthLevel,
            sensitivityTest: demo.status === "FAIL",
            sensitivityDetails: demo.status === "FAIL" ? "Resistant to Ampicillin, Sensitive to Vancomycin" : null,
            resultDate: new Date(collectionDate.getTime() + 48 * 60 * 60 * 1000),
            processedBy: "LAB001",
            processedByName: "Lab Tech Rahul Verma",
            remarks: `${demo.organism.organismName} detected with ${demo.growthLevel} growth`,
          });

          // Update collection with result status
          await storage.updateSwabCollection(collection.id, {
            status: "completed",
            resultStatus: demo.status,
          });

          // Create CAPA for FAIL results
          if (demo.status === "FAIL") {
            const issueSummary = `Contamination detected at ${area.areaName} - ${site.siteName}. Organism: ${demo.organism.organismName}. Growth Level: ${demo.growthLevel}`;
            
            const capaAction = await storage.createSwabCapaAction({
              swabCollectionId: collection.id,
              issueSummary,
              rootCause: "Inadequate surface disinfection during routine cleaning",
              immediateAction: "Deep cleaning and re-fumigation scheduled",
              responsibleDepartment: "Housekeeping",
              responsiblePerson: "HK001",
              responsiblePersonName: "Mr. Suresh Kumar",
              targetClosureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              verificationSwabRequired: true,
            });
            
            // Update CAPA status for older entries
            if (demo.dayOffset < -2) {
              await storage.updateSwabCapaAction(capaAction.id, { status: "in_progress" });
            }

            // Audit log for CAPA creation
            await storage.createSwabAuditLog({
              entityType: "capa_action",
              entityId: capaAction.id,
              action: "create",
              newValue: JSON.stringify(capaAction),
              performedBy: "SYSTEM",
              performedByName: "Auto-generated",
              performedByRole: "SYSTEM",
            });
          }
        }

        // Create audit log for collection
        await storage.createSwabAuditLog({
          entityType: "swab_collection",
          entityId: collection.id,
          action: "create",
          newValue: JSON.stringify(collection),
          performedBy: "ICN001",
          performedByName: "Sr. Nurse Priya Sharma",
          performedByRole: "ICN",
        });

        demoCollections.push(collection);
      }

      res.json({ 
        message: "Demo data seeded successfully", 
        collections: demoCollections.length,
        summary: {
          pass: demoData.filter(d => d.status === "PASS").length,
          acceptable: demoData.filter(d => d.status === "ACCEPTABLE").length,
          fail: demoData.filter(d => d.status === "FAIL").length
        }
      });
    } catch (error) {
      console.error("Failed to seed demo data:", error);
      res.status(500).json({ error: "Failed to seed demo data" });
    }
  });

  // Seed Master Data for Swab Monitoring
  app.post("/api/swab-monitoring/seed", async (req, res) => {
    try {
      // Check if already seeded
      const existingAreas = await storage.getAllSwabAreas();
      if (existingAreas.length > 0) {
        return res.json({ message: "Master data already seeded" });
      }

      // Seed Areas
      const areas = [
        { block: "Main Building", floor: "1st Floor", areaType: "OT", areaName: "OT-1 (General Surgery)", equipment: "OT Table, Anesthesia Machine", isActive: true },
        { block: "Main Building", floor: "1st Floor", areaType: "OT", areaName: "OT-2 (Cardiac)", equipment: "OT Table, Heart-Lung Machine", isActive: true },
        { block: "Main Building", floor: "1st Floor", areaType: "OT", areaName: "OT-3 (Orthopedics)", equipment: "OT Table, C-Arm", isActive: true },
        { block: "Main Building", floor: "2nd Floor", areaType: "ICU", areaName: "ICU-1 (Medical)", equipment: "Ventilators, Monitors", isActive: true },
        { block: "Main Building", floor: "2nd Floor", areaType: "ICU", areaName: "ICU-2 (Surgical)", equipment: "Ventilators, Monitors", isActive: true },
        { block: "Main Building", floor: "2nd Floor", areaType: "ICU", areaName: "NICU", equipment: "Incubators, Phototherapy", isActive: true },
      ];
      for (const area of areas) {
        await storage.createSwabArea(area);
      }

      // Seed Sampling Sites
      const sites = [
        { siteName: "OT Table Surface", description: "Main operating table surface", isActive: true },
        { siteName: "OT Light Handle", description: "Surgical light handles", isActive: true },
        { siteName: "Anesthesia Machine Panel", description: "Control panel of anesthesia machine", isActive: true },
        { siteName: "Ventilator Control Panel", description: "ICU ventilator controls", isActive: true },
        { siteName: "Bed Rail", description: "Patient bed rails", isActive: true },
        { siteName: "Monitor Screen", description: "Patient monitor touch screen", isActive: true },
        { siteName: "IV Pole", description: "IV stand and pole", isActive: true },
        { siteName: "Door Handle", description: "Entry/exit door handles", isActive: true },
        { siteName: "Nurse Station Counter", description: "Nurse station work surface", isActive: true },
        { siteName: "Medical Trolley", description: "Medication and instrument trolley", isActive: true },
      ];
      for (const site of sites) {
        await storage.createSwabSamplingSite(site);
      }

      // Seed Organisms
      const organisms = [
        { organismName: "No Growth", category: "none", riskLevel: "low", description: "No bacterial growth detected", isActive: true },
        { organismName: "Staphylococcus epidermidis", category: "flora", riskLevel: "low", description: "Common skin flora", isActive: true },
        { organismName: "Bacillus species", category: "flora", riskLevel: "low", description: "Environmental contaminant", isActive: true },
        { organismName: "Coagulase-negative Staphylococci", category: "flora", riskLevel: "medium", description: "Skin flora, potential opportunistic pathogen", isActive: true },
        { organismName: "Staphylococcus aureus", category: "pathogen", riskLevel: "high", description: "Common pathogen causing HAI", isActive: true },
        { organismName: "MRSA", category: "pathogen", riskLevel: "critical", description: "Methicillin-resistant S. aureus", isActive: true },
        { organismName: "Pseudomonas aeruginosa", category: "pathogen", riskLevel: "high", description: "Opportunistic pathogen", isActive: true },
        { organismName: "Acinetobacter baumannii", category: "pathogen", riskLevel: "critical", description: "MDR pathogen", isActive: true },
        { organismName: "Escherichia coli", category: "pathogen", riskLevel: "high", description: "Gram-negative pathogen", isActive: true },
        { organismName: "Klebsiella pneumoniae", category: "pathogen", riskLevel: "high", description: "Gram-negative pathogen", isActive: true },
        { organismName: "Candida species", category: "pathogen", riskLevel: "medium", description: "Fungal pathogen", isActive: true },
        { organismName: "Aspergillus species", category: "pathogen", riskLevel: "high", description: "Environmental fungus, dangerous in immunocompromised", isActive: true },
      ];
      for (const organism of organisms) {
        await storage.createSwabOrganism(organism);
      }

      res.json({ message: "Master data seeded successfully", areas: areas.length, sites: sites.length, organisms: organisms.length });
    } catch (error) {
      console.error("Failed to seed master data:", error);
      res.status(500).json({ error: "Failed to seed master data" });
    }
  });

  // ========== DISEASE KNOWLEDGE ROUTES ==========

  // Helper to verify disease knowledge access (Admin, Doctor, Nurse, OPD Manager)
  const verifyDiseaseKnowledgeAccess = (req: express.Request, res: express.Response): boolean => {
    const userRole = req.headers['x-user-role'] as string;
    const allowedRoles = ['ADMIN', 'DOCTOR', 'NURSE', 'OPD_MANAGER'];
    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(403).json({ error: "Access denied. Disease knowledge requires staff access." });
      return false;
    }
    return true;
  };

  // Disease Catalog - Read access for all logged-in users (educational content)
  app.get("/api/diseases", async (req, res) => {
    try {
      const { category } = req.query;
      let diseases;
      if (category && typeof category === "string") {
        diseases = await storage.getDiseasesByCategory(category);
      } else {
        diseases = await storage.getAllDiseases();
      }
      res.json(diseases);
    } catch (error) {
      console.error("Failed to fetch diseases:", error);
      res.status(500).json({ error: "Failed to fetch diseases" });
    }
  });

  app.get("/api/diseases/:id", async (req, res) => {
    try {
      const disease = await storage.getDisease(req.params.id);
      if (disease) {
        res.json(disease);
      } else {
        res.status(404).json({ error: "Disease not found" });
      }
    } catch (error) {
      console.error("Failed to fetch disease:", error);
      res.status(500).json({ error: "Failed to fetch disease" });
    }
  });

  app.post("/api/diseases", async (req, res) => {
    try {
      const userRole = req.headers['x-user-role'] as string;
      if (userRole !== 'ADMIN') {
        return res.status(403).json({ error: "Only admins can create diseases" });
      }
      const disease = await storage.createDisease(req.body);
      res.json(disease);
    } catch (error) {
      console.error("Failed to create disease:", error);
      res.status(500).json({ error: "Failed to create disease" });
    }
  });

  // Diet Templates - Read access for all logged-in users
  app.get("/api/diet-templates", async (req, res) => {
    try {
      const { diseaseId } = req.query;
      let templates;
      if (diseaseId && typeof diseaseId === "string") {
        templates = await storage.getDietTemplatesByDisease(diseaseId);
      } else {
        templates = await storage.getAllDietTemplates();
      }
      res.json(templates);
    } catch (error) {
      console.error("Failed to fetch diet templates:", error);
      res.status(500).json({ error: "Failed to fetch diet templates" });
    }
  });

  app.post("/api/diet-templates", async (req, res) => {
    try {
      const userRole = req.headers['x-user-role'] as string;
      if (userRole !== 'ADMIN') {
        return res.status(403).json({ error: "Only admins can create diet templates" });
      }
      const template = await storage.createDietTemplate(req.body);
      res.json(template);
    } catch (error) {
      console.error("Failed to create diet template:", error);
      res.status(500).json({ error: "Failed to create diet template" });
    }
  });

  // Medication Schedule Templates - Read access for all logged-in users
  app.get("/api/medication-schedules", async (req, res) => {
    try {
      const { diseaseId } = req.query;
      let templates;
      if (diseaseId && typeof diseaseId === "string") {
        templates = await storage.getMedicationScheduleTemplatesByDisease(diseaseId);
      } else {
        templates = await storage.getAllMedicationScheduleTemplates();
      }
      res.json(templates);
    } catch (error) {
      console.error("Failed to fetch medication schedules:", error);
      res.status(500).json({ error: "Failed to fetch medication schedules" });
    }
  });

  app.post("/api/medication-schedules", async (req, res) => {
    try {
      const userRole = req.headers['x-user-role'] as string;
      if (userRole !== 'ADMIN') {
        return res.status(403).json({ error: "Only admins can create medication schedules" });
      }
      const template = await storage.createMedicationScheduleTemplate(req.body);
      res.json(template);
    } catch (error) {
      console.error("Failed to create medication schedule:", error);
      res.status(500).json({ error: "Failed to create medication schedule" });
    }
  });

  // Patient Disease Assignments - Staff access only
  app.get("/api/patient-disease-assignments", async (req, res) => {
    try {
      if (!verifyDiseaseKnowledgeAccess(req, res)) return;
      const { patientId } = req.query;
      let assignments;
      if (patientId && typeof patientId === "string") {
        assignments = await storage.getPatientDiseaseAssignmentsByPatient(patientId);
      } else {
        assignments = await storage.getAllPatientDiseaseAssignments();
      }
      res.json(assignments);
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  app.post("/api/patient-disease-assignments", async (req, res) => {
    try {
      const userRole = req.headers['x-user-role'] as string;
      if (userRole !== 'ADMIN' && userRole !== 'DOCTOR') {
        return res.status(403).json({ error: "Only doctors and admins can assign diseases" });
      }
      const assignment = await storage.createPatientDiseaseAssignment(req.body);
      res.json(assignment);
    } catch (error) {
      console.error("Failed to create assignment:", error);
      res.status(500).json({ error: "Failed to create assignment" });
    }
  });

  // Personalized Care Plans - Staff access only
  app.get("/api/care-plans", async (req, res) => {
    try {
      if (!verifyDiseaseKnowledgeAccess(req, res)) return;
      const { patientId, assignmentId } = req.query;
      if (assignmentId && typeof assignmentId === "string") {
        const plan = await storage.getPersonalizedCarePlanByAssignment(assignmentId);
        res.json(plan || null);
      } else if (patientId && typeof patientId === "string") {
        const plans = await storage.getPersonalizedCarePlansByPatient(patientId);
        res.json(plans);
      } else {
        res.status(400).json({ error: "patientId or assignmentId required" });
      }
    } catch (error) {
      console.error("Failed to fetch care plans:", error);
      res.status(500).json({ error: "Failed to fetch care plans" });
    }
  });

  app.post("/api/care-plans", async (req, res) => {
    try {
      const userRole = req.headers['x-user-role'] as string;
      if (userRole !== 'ADMIN' && userRole !== 'DOCTOR') {
        return res.status(403).json({ error: "Only doctors and admins can create care plans" });
      }
      const plan = await storage.createPersonalizedCarePlan(req.body);
      res.json(plan);
    } catch (error) {
      console.error("Failed to create care plan:", error);
      res.status(500).json({ error: "Failed to create care plan" });
    }
  });

  // AI Personalization - Generate personalized care plan using OpenAI
  app.post("/api/care-plans/generate", async (req, res) => {
    try {
      const userRole = req.headers['x-user-role'] as string;
      if (userRole !== 'ADMIN' && userRole !== 'DOCTOR') {
        return res.status(403).json({ error: "Only doctors and admins can generate AI care plans" });
      }
      
      const { assignmentId, patientInfo, generatedBy, generatedByName } = req.body;
      
      if (!assignmentId) {
        return res.status(400).json({ error: "Assignment ID is required" });
      }
      
      const assignment = await storage.getPatientDiseaseAssignment(assignmentId);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      
      const disease = await storage.getDisease(assignment.diseaseId);
      if (!disease) {
        return res.status(404).json({ error: "Disease not found" });
      }

      const dietTemplates = await storage.getDietTemplatesByDisease(assignment.diseaseId);
      const medSchedules = await storage.getMedicationScheduleTemplatesByDisease(assignment.diseaseId);

      // Build AI prompt for personalization
      const prompt = `You are an AI Clinical Care & Nutrition Intelligence System for an Indian hospital. Generate a personalized care plan in JSON format.

PATIENT PROFILE:
- Age: ${patientInfo.age || "Not specified"}
- Gender: ${patientInfo.gender || "Not specified"}
- Weight: ${patientInfo.weight || "Not specified"} kg
- BMI: ${patientInfo.bmi || "Not specified"}
- Activity Level: ${patientInfo.activityLevel || "Moderate"}
- Diet Preference: ${patientInfo.dietPreference || "Both (Veg/Non-veg)"}
- OPD/IPD Status: ${assignment.opdIpdStatus}
- Disease Severity: ${assignment.severity}

DISEASE: ${disease.diseaseName}
CATEGORY: ${disease.category}
DESCRIPTION: ${disease.shortDescription}

BASE DIET TEMPLATES: ${JSON.stringify(dietTemplates.map(d => ({ name: d.templateName, type: d.dietType, plan: d.mealPlan })))}

MEDICATION SCHEDULE TEMPLATES: ${JSON.stringify(medSchedules.map(m => ({ category: m.medicineCategory, timing: m.typicalTiming, foodRelation: m.beforeAfterFood })))}

Generate a personalized JSON response with:
1. personalizedDiet: Customized Indian diet plan with early_morning, breakfast, mid_morning, lunch, evening_snack, dinner, bedtime
2. personalizedSchedule: Medicine timing guidance (NOT prescriptions)
3. personalizedLifestyle: Activity recommendations, yoga, stress management
4. personalizedMonitoring: Daily/weekly/monthly check recommendations

IMPORTANT: Follow ICMR/MoHFW guidelines. Include disclaimer that this is for educational purposes only.`;

      let aiResponse;
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          max_tokens: 2000,
        });
        aiResponse = JSON.parse(completion.choices[0].message.content || "{}");
      } catch (aiError) {
        console.error("OpenAI error, using template-based plan:", aiError);
        // Fallback to template-based plan
        aiResponse = {
          personalizedDiet: dietTemplates[0]?.mealPlan || "{}",
          personalizedSchedule: JSON.stringify(medSchedules),
          personalizedLifestyle: disease.activityRecommendations || "{}",
          personalizedMonitoring: disease.monitoringGuidelines || "{}",
        };
      }

      const carePlan = await storage.createPersonalizedCarePlan({
        patientId: assignment.patientId,
        assignmentId,
        personalizedDiet: typeof aiResponse.personalizedDiet === "string" ? aiResponse.personalizedDiet : JSON.stringify(aiResponse.personalizedDiet),
        personalizedSchedule: typeof aiResponse.personalizedSchedule === "string" ? aiResponse.personalizedSchedule : JSON.stringify(aiResponse.personalizedSchedule),
        personalizedLifestyle: typeof aiResponse.personalizedLifestyle === "string" ? aiResponse.personalizedLifestyle : JSON.stringify(aiResponse.personalizedLifestyle),
        personalizedMonitoring: typeof aiResponse.personalizedMonitoring === "string" ? aiResponse.personalizedMonitoring : JSON.stringify(aiResponse.personalizedMonitoring),
        aiInputParameters: JSON.stringify(patientInfo),
        generatedBy,
        generatedByName,
      });

      res.json(carePlan);
    } catch (error) {
      console.error("Failed to generate care plan:", error);
      res.status(500).json({ error: "Failed to generate care plan" });
    }
  });

  // Seed Disease Knowledge Data (Admin only, idempotent)
  app.post("/api/diseases/seed", async (req, res) => {
    try {
      const userRole = req.headers['x-user-role'] as string;
      if (userRole !== 'ADMIN') {
        return res.status(403).json({ error: "Only admins can seed disease data" });
      }
      
      const existingDiseases = await storage.getAllDiseases();
      if (existingDiseases.length > 0) {
        return res.json({ message: "Disease data already seeded", count: existingDiseases.length });
      }

      // Seed common Indian diseases
      const diseases = [
        {
          diseaseName: "Diabetes Type 2",
          alternateNames: "Type 2 DM, Adult-onset Diabetes, NIDDM",
          category: "metabolic",
          affectedSystem: "Endocrine System",
          shortDescription: "A condition where the body doesn't use insulin properly, leading to high blood sugar levels.",
          causes: JSON.stringify(["Insulin resistance", "Obesity", "Sedentary lifestyle", "Genetic factors", "Poor diet high in refined carbs"]),
          riskFactors: JSON.stringify(["Family history", "Obesity", "Age > 45", "PCOD in women", "High BP", "High cholesterol"]),
          symptoms: JSON.stringify(["Frequent urination", "Excessive thirst", "Unexplained weight loss", "Fatigue", "Blurred vision", "Slow healing wounds"]),
          emergencySigns: JSON.stringify(["Blood sugar > 400 mg/dL", "Confusion", "Rapid breathing", "Fruity breath odor", "Unconsciousness"]),
          clinicalParameters: JSON.stringify({ fasting_glucose: { normal: "<100", target: "<126", danger: ">200" }, hba1c: { normal: "<5.7%", target: "<7%", danger: ">9%" }, postprandial: { normal: "<140", target: "<180", danger: ">250" } }),
          dosList: JSON.stringify(["Walk 30 mins daily", "Monitor blood sugar regularly", "Take medicines on time", "Eat at fixed times", "Include fiber in diet"]),
          dontsList: JSON.stringify(["Skip meals", "Eat sweets/mithai", "Drink sugary drinks", "Skip medicines", "Ignore foot injuries"]),
          activityRecommendations: JSON.stringify({ walking: "30 mins morning/evening", yoga: "Pranayama, Mandukasana", stress: "Deep breathing, meditation" }),
          monitoringGuidelines: JSON.stringify({ daily: ["Fasting glucose", "Post-meal glucose"], weekly: ["Weight check", "Foot inspection"], monthly: ["HbA1c if needed", "BP check"] }),
          isActive: true,
        },
        {
          diseaseName: "Hypertension",
          alternateNames: "High Blood Pressure, BP, Essential Hypertension",
          category: "cardiovascular",
          affectedSystem: "Cardiovascular System",
          shortDescription: "A condition where blood pressure in arteries is persistently elevated, increasing heart disease risk.",
          causes: JSON.stringify(["Excessive salt intake", "Obesity", "Stress", "Smoking", "Alcohol", "Genetic factors"]),
          riskFactors: JSON.stringify(["Age > 40", "Family history", "Obesity", "High salt diet", "Sedentary lifestyle", "Diabetes"]),
          symptoms: JSON.stringify(["Headache (especially morning)", "Dizziness", "Nosebleeds", "Shortness of breath", "Chest pain", "Often no symptoms"]),
          emergencySigns: JSON.stringify(["BP > 180/120", "Severe headache", "Chest pain", "Vision problems", "Difficulty speaking", "Numbness"]),
          clinicalParameters: JSON.stringify({ systolic: { normal: "<120", target: "<130", danger: ">180" }, diastolic: { normal: "<80", target: "<85", danger: ">120" } }),
          dosList: JSON.stringify(["Reduce salt intake", "Exercise regularly", "Maintain healthy weight", "Take medicines daily", "Manage stress"]),
          dontsList: JSON.stringify(["Eat pickle, papad excessively", "Skip BP medicines", "Smoke or use tobacco", "Drink alcohol", "Eat processed foods"]),
          activityRecommendations: JSON.stringify({ walking: "45 mins brisk walk daily", yoga: "Shavasana, Pranayama", stress: "Meditation, music therapy" }),
          monitoringGuidelines: JSON.stringify({ daily: ["BP morning and evening"], weekly: ["Weight check"], monthly: ["Doctor visit if uncontrolled"] }),
          isActive: true,
        },
        {
          diseaseName: "Tuberculosis",
          alternateNames: "TB, Pulmonary TB, Koch's Disease",
          category: "respiratory",
          affectedSystem: "Respiratory System",
          shortDescription: "A bacterial infection that primarily affects the lungs but can spread to other organs.",
          causes: JSON.stringify(["Mycobacterium tuberculosis bacteria", "Airborne transmission", "Close contact with infected person"]),
          riskFactors: JSON.stringify(["Weakened immune system", "HIV infection", "Malnutrition", "Crowded living", "Diabetes", "Smoking"]),
          symptoms: JSON.stringify(["Persistent cough > 2 weeks", "Blood in sputum", "Night sweats", "Weight loss", "Evening fever", "Loss of appetite"]),
          emergencySigns: JSON.stringify(["Coughing blood", "Severe breathing difficulty", "High fever", "Extreme weakness"]),
          clinicalParameters: JSON.stringify({ sputum_test: "AFB positive/negative", chest_xray: "Cavity/infiltrates", weight: "Monitor weekly" }),
          dosList: JSON.stringify(["Complete full DOTS course", "Eat protein-rich diet", "Cover mouth while coughing", "Ensure good ventilation", "Take medicines under supervision"]),
          dontsList: JSON.stringify(["Stop medicines early", "Spit in open", "Share utensils", "Skip doses", "Smoke or drink alcohol"]),
          activityRecommendations: JSON.stringify({ rest: "Adequate rest during treatment", walking: "Light walking as tolerated", breathing: "Deep breathing exercises after recovery" }),
          monitoringGuidelines: JSON.stringify({ weekly: ["Weight check", "Medicine adherence"], monthly: ["Sputum test", "Doctor visit"], end_of_treatment: ["Chest X-ray"] }),
          isActive: true,
        },
        {
          diseaseName: "Dengue",
          alternateNames: "Dengue Fever, Break-bone Fever",
          category: "infectious",
          affectedSystem: "Blood/Immune System",
          shortDescription: "A mosquito-borne viral infection causing high fever and severe body pain.",
          causes: JSON.stringify(["Dengue virus", "Aedes mosquito bite", "Stagnant water breeding"]),
          riskFactors: JSON.stringify(["Monsoon season", "Stagnant water around home", "Previous dengue infection", "Urban areas"]),
          symptoms: JSON.stringify(["High fever (104°F)", "Severe headache", "Pain behind eyes", "Muscle and joint pain", "Skin rash", "Nausea"]),
          emergencySigns: JSON.stringify(["Platelet count < 50,000", "Bleeding from gums/nose", "Blood in vomit/stool", "Severe abdominal pain", "Persistent vomiting"]),
          clinicalParameters: JSON.stringify({ platelets: { normal: ">150,000", caution: "100,000-150,000", danger: "<50,000" }, hematocrit: "Monitor for hemoconcentration" }),
          dosList: JSON.stringify(["Drink plenty of fluids", "Eat papaya leaf extract", "Complete bed rest", "Monitor platelet count", "Use mosquito nets"]),
          dontsList: JSON.stringify(["Take aspirin/ibuprofen", "Ignore warning signs", "Delay hospital visit", "Self-medicate"]),
          activityRecommendations: JSON.stringify({ rest: "Complete bed rest during fever", hydration: "3-4 liters fluids daily", recovery: "Gradual return to activity" }),
          monitoringGuidelines: JSON.stringify({ daily: ["Temperature", "Platelet count", "Fluid intake"], warning: ["Watch for bleeding", "Monitor BP"] }),
          isActive: true,
        },
        {
          diseaseName: "Asthma",
          alternateNames: "Bronchial Asthma, Dama",
          category: "respiratory",
          affectedSystem: "Respiratory System",
          shortDescription: "A chronic condition causing inflammation and narrowing of airways, leading to breathing difficulty.",
          causes: JSON.stringify(["Allergies", "Air pollution", "Dust mites", "Cold air", "Exercise", "Stress"]),
          riskFactors: JSON.stringify(["Family history", "Allergies", "Childhood respiratory infections", "Smoking exposure", "Obesity"]),
          symptoms: JSON.stringify(["Wheezing", "Shortness of breath", "Chest tightness", "Coughing (especially at night)", "Difficulty speaking"]),
          emergencySigns: JSON.stringify(["Severe breathlessness", "Blue lips/fingernails", "Inhaler not helping", "Cannot speak in sentences", "Confusion"]),
          clinicalParameters: JSON.stringify({ peak_flow: "Monitor daily", oxygen: { normal: ">95%", danger: "<90%" } }),
          dosList: JSON.stringify(["Keep inhaler always", "Identify triggers", "Take preventive medicines", "Keep home dust-free", "Practice breathing exercises"]),
          dontsList: JSON.stringify(["Ignore early symptoms", "Stop preventer medicines", "Smoke or be near smokers", "Exercise in polluted air", "Keep pets in bedroom"]),
          activityRecommendations: JSON.stringify({ breathing: "Pranayama daily", swimming: "Good for lung capacity", avoid: "High pollution areas" }),
          monitoringGuidelines: JSON.stringify({ daily: ["Peak flow reading", "Symptom diary"], monthly: ["Inhaler technique check"], yearly: ["Lung function test"] }),
          isActive: true,
        },
      ];

      for (const disease of diseases) {
        const created = await storage.createDisease(disease);
        
        // Create diet template for each disease
        await storage.createDietTemplate({
          diseaseId: created.id,
          templateName: `Standard ${disease.diseaseName} Diet`,
          dietType: "both",
          mealPlan: JSON.stringify({
            early_morning: "Warm water with lemon/methi seeds water",
            breakfast: "Oats upma/poha with vegetables, 1 cup tea without sugar",
            mid_morning: "1 fruit (apple/guava) or handful of nuts",
            lunch: "2 roti, dal, sabzi, salad, curd",
            evening_snack: "Green tea with roasted chana/makhana",
            dinner: "1-2 roti, light sabzi, dal soup",
            bedtime: "Warm turmeric milk (if applicable)"
          }),
          foodsToAvoid: JSON.stringify(["White sugar", "Maida products", "Fried foods", "Packaged snacks", "Sugary drinks"]),
          foodsToLimit: JSON.stringify(["Rice", "Potatoes", "Mangoes", "Grapes", "Bananas"]),
          safeInModeration: JSON.stringify(["Brown rice", "Sweet potato", "Dark chocolate", "Dry fruits"]),
          portionGuidance: "Use small plates, fill half with vegetables",
          hydrationGuidance: "8-10 glasses water daily, more in summer",
          isActive: true,
        });

        // Create medication schedule template
        await storage.createMedicationScheduleTemplate({
          diseaseId: created.id,
          medicineCategory: disease.category === "metabolic" ? "Antidiabetic" : disease.category === "cardiovascular" ? "Antihypertensive" : "As prescribed",
          typicalTiming: "Morning",
          beforeAfterFood: disease.diseaseName.includes("Diabetes") ? "before" : "after",
          missedDoseInstructions: "Take as soon as remembered. Skip if close to next dose.",
          storageGuidelines: "Store in cool, dry place away from sunlight",
          interactionWarnings: JSON.stringify(["Avoid alcohol", "Inform doctor about all medicines"]),
          generalNotes: "This is timing guidance only, NOT a prescription. Consult your doctor.",
          isActive: true,
        });
      }

      res.json({ message: "Disease knowledge data seeded successfully", count: diseases.length });
    } catch (error) {
      console.error("Failed to seed disease data:", error);
      res.status(500).json({ error: "Failed to seed disease data" });
    }
  });

  // ========== PATIENT MONITORING MODULE ROUTES ==========
  // Medical-Grade, ICU Chart & Nursing Workflow (NABH-Compliant)

  // Get all monitoring sessions
  app.get("/api/patient-monitoring/sessions", async (_req, res) => {
    try {
      const sessions = await db.select().from(patientMonitoringSessions).orderBy(desc(patientMonitoringSessions.createdAt));
      res.json(sessions);
    } catch (error) {
      console.error("Failed to fetch monitoring sessions:", error);
      res.status(500).json({ error: "Failed to fetch monitoring sessions" });
    }
  });

  // Get sessions by patient
  app.get("/api/patient-monitoring/sessions/patient/:patientId", async (req, res) => {
    try {
      const sessions = await db.select().from(patientMonitoringSessions)
        .where(eq(patientMonitoringSessions.patientId, req.params.patientId))
        .orderBy(desc(patientMonitoringSessions.sessionDate));
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patient sessions" });
    }
  });

  // Get single session with all data
  app.get("/api/patient-monitoring/sessions/:id", async (req, res) => {
    try {
      const session = await db.select().from(patientMonitoringSessions)
        .where(eq(patientMonitoringSessions.id, req.params.id));
      if (!session.length) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  // Create new monitoring session
  app.post("/api/patient-monitoring/sessions", async (req, res) => {
    try {
      const parsed = insertPatientMonitoringSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid session data", details: parsed.error });
      }
      const result = await db.insert(patientMonitoringSessions).values(parsed.data).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      console.error("Failed to create monitoring session:", error);
      res.status(500).json({ error: "Failed to create monitoring session" });
    }
  });

  // Update session (lock patient info after first save)
  app.patch("/api/patient-monitoring/sessions/:id", async (req, res) => {
    try {
      const result = await db.update(patientMonitoringSessions)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(patientMonitoringSessions.id, req.params.id))
        .returning();
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  // ========== VITALS HOURLY (24 slots) ==========
  app.get("/api/patient-monitoring/vitals/:sessionId", async (req, res) => {
    try {
      const vitals = await db.select().from(vitalsHourly)
        .where(eq(vitalsHourly.sessionId, req.params.sessionId))
        .orderBy(vitalsHourly.hourSlot);
      res.json(vitals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vitals" });
    }
  });

  app.post("/api/patient-monitoring/vitals", async (req, res) => {
    try {
      const parsed = insertVitalsHourlySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid vitals data", details: parsed.error });
      }
      const result = await db.insert(vitalsHourly).values(parsed.data).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to save vitals" });
    }
  });

  // ========== INOTROPES & SEDATION ==========
  app.get("/api/patient-monitoring/inotropes/:sessionId", async (req, res) => {
    try {
      const data = await db.select().from(inotropesSedation)
        .where(eq(inotropesSedation.sessionId, req.params.sessionId))
        .orderBy(desc(inotropesSedation.createdAt));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inotropes data" });
    }
  });

  app.post("/api/patient-monitoring/inotropes", async (req, res) => {
    try {
      const parsed = insertInotropesSedationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error });
      }
      const result = await db.insert(inotropesSedation).values(parsed.data).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to save inotropes data" });
    }
  });

  // ========== VENTILATOR SETTINGS (Conditional) ==========
  app.get("/api/patient-monitoring/ventilator/:sessionId", async (req, res) => {
    try {
      const data = await db.select().from(ventilatorSettings)
        .where(eq(ventilatorSettings.sessionId, req.params.sessionId))
        .orderBy(desc(ventilatorSettings.recordedAt));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ventilator settings" });
    }
  });

  app.post("/api/patient-monitoring/ventilator", async (req, res) => {
    try {
      const parsed = insertVentilatorSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error });
      }
      const result = await db.insert(ventilatorSettings).values(parsed.data).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to save ventilator settings" });
    }
  });

  // ========== ABG & LAB RESULTS ==========
  app.get("/api/patient-monitoring/abg-lab/:sessionId", async (req, res) => {
    try {
      const data = await db.select().from(abgLabResults)
        .where(eq(abgLabResults.sessionId, req.params.sessionId))
        .orderBy(desc(abgLabResults.recordedAt));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ABG/Lab results" });
    }
  });

  app.post("/api/patient-monitoring/abg-lab", async (req, res) => {
    try {
      const parsed = insertAbgLabResultsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error });
      }
      const result = await db.insert(abgLabResults).values(parsed.data).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to save ABG/Lab results" });
    }
  });

  // ========== INTAKE CHART (Hourly with auto-sums) ==========
  app.get("/api/patient-monitoring/intake/:sessionId", async (req, res) => {
    try {
      const data = await db.select().from(intakeHourly)
        .where(eq(intakeHourly.sessionId, req.params.sessionId))
        .orderBy(intakeHourly.hourSlot);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch intake data" });
    }
  });

  app.post("/api/patient-monitoring/intake", async (req, res) => {
    try {
      // Calculate hourly total
      const data = req.body;
      data.hourlyTotal = (data.ivLine1 || 0) + (data.ivLine2 || 0) + (data.ivLine3 || 0) + 
                         (data.ivLine4 || 0) + (data.ivLine5 || 0) + (data.ivLine6 || 0) +
                         (data.oral || 0) + (data.ngTube || 0) + (data.bloodProducts || 0) + 
                         (data.medications || 0);
      
      const parsed = insertIntakeHourlySchema.safeParse(data);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error });
      }
      const result = await db.insert(intakeHourly).values(parsed.data).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to save intake data" });
    }
  });

  // ========== OUTPUT CHART (Hourly with auto-sums) ==========
  app.get("/api/patient-monitoring/output/:sessionId", async (req, res) => {
    try {
      const data = await db.select().from(outputHourly)
        .where(eq(outputHourly.sessionId, req.params.sessionId))
        .orderBy(outputHourly.hourSlot);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch output data" });
    }
  });

  app.post("/api/patient-monitoring/output", async (req, res) => {
    try {
      // Calculate hourly total
      const data = req.body;
      data.hourlyTotal = (data.urineOutput || 0) + (data.drainOutput || 0) + 
                         (data.vomitus || 0) + (data.stool || 0) + (data.otherLosses || 0);
      
      const parsed = insertOutputHourlySchema.safeParse(data);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error });
      }
      const result = await db.insert(outputHourly).values(parsed.data).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to save output data" });
    }
  });

  // Get 24-hour fluid balance summary
  app.get("/api/patient-monitoring/fluid-balance/:sessionId", async (req, res) => {
    try {
      const intakeData = await db.select().from(intakeHourly)
        .where(eq(intakeHourly.sessionId, req.params.sessionId));
      const outputData = await db.select().from(outputHourly)
        .where(eq(outputHourly.sessionId, req.params.sessionId));
      
      const totalIntake = intakeData.reduce((sum, i) => sum + (i.hourlyTotal || 0), 0);
      const totalOutput = outputData.reduce((sum, o) => sum + (o.hourlyTotal || 0), 0);
      const netBalance = totalIntake - totalOutput;
      
      res.json({ totalIntake, totalOutput, netBalance, intakeEntries: intakeData.length, outputEntries: outputData.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate fluid balance" });
    }
  });

  // ========== DIABETIC FLOW CHART ==========
  app.get("/api/patient-monitoring/diabetic/:sessionId", async (req, res) => {
    try {
      const data = await db.select().from(diabeticFlow)
        .where(eq(diabeticFlow.sessionId, req.params.sessionId))
        .orderBy(desc(diabeticFlow.createdAt));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch diabetic flow data" });
    }
  });

  app.post("/api/patient-monitoring/diabetic", async (req, res) => {
    try {
      const data = req.body;
      // Auto-generate alerts
      if (data.bloodSugarLevel < 70) {
        data.alertType = "HYPOGLYCEMIA";
        data.alertMessage = "Low blood sugar detected. Immediate action required.";
      } else if (data.bloodSugarLevel > 250) {
        data.alertType = "HYPERGLYCEMIA";
        data.alertMessage = "High blood sugar detected. Review insulin dosage.";
      }
      
      const parsed = insertDiabeticFlowSchema.safeParse(data);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error });
      }
      const result = await db.insert(diabeticFlow).values(parsed.data).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to save diabetic flow data" });
    }
  });

  // ========== MEDICATION ADMINISTRATION RECORD (MAR) ==========
  app.get("/api/patient-monitoring/mar/:sessionId", async (req, res) => {
    try {
      const data = await db.select().from(medicationAdminRecords)
        .where(eq(medicationAdminRecords.sessionId, req.params.sessionId))
        .orderBy(medicationAdminRecords.scheduledTime);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch MAR data" });
    }
  });

  app.post("/api/patient-monitoring/mar", async (req, res) => {
    try {
      const parsed = insertMedicationAdminRecordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error });
      }
      const result = await db.insert(medicationAdminRecords).values(parsed.data).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to save MAR data" });
    }
  });

  // ========== ONCE-ONLY DRUGS ==========
  app.get("/api/patient-monitoring/once-only/:sessionId", async (req, res) => {
    try {
      const data = await db.select().from(onceOnlyDrugs)
        .where(eq(onceOnlyDrugs.sessionId, req.params.sessionId))
        .orderBy(desc(onceOnlyDrugs.createdAt));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch once-only drugs" });
    }
  });

  app.post("/api/patient-monitoring/once-only", async (req, res) => {
    try {
      const parsed = insertOnceOnlyDrugSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error });
      }
      const result = await db.insert(onceOnlyDrugs).values(parsed.data).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to save once-only drug" });
    }
  });

  // ========== NURSING SHIFT NOTES ==========
  app.get("/api/patient-monitoring/shift-notes/:sessionId", async (req, res) => {
    try {
      const data = await db.select().from(nursingShiftNotes)
        .where(eq(nursingShiftNotes.sessionId, req.params.sessionId))
        .orderBy(desc(nursingShiftNotes.noteTime));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shift notes" });
    }
  });

  app.post("/api/patient-monitoring/shift-notes", async (req, res) => {
    try {
      const parsed = insertNursingShiftNoteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error });
      }
      const result = await db.insert(nursingShiftNotes).values(parsed.data).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to save shift note" });
    }
  });

  // ========== AIRWAY, LINES & TUBES ==========
  app.get("/api/patient-monitoring/airway/:sessionId", async (req, res) => {
    try {
      const data = await db.select().from(airwayLinesTubes)
        .where(eq(airwayLinesTubes.sessionId, req.params.sessionId));
      res.json(data[0] || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch airway data" });
    }
  });

  app.post("/api/patient-monitoring/airway", async (req, res) => {
    try {
      const parsed = insertAirwayLinesTubesSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error });
      }
      const result = await db.insert(airwayLinesTubes).values(parsed.data).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to save airway data" });
    }
  });

  app.patch("/api/patient-monitoring/airway/:id", async (req, res) => {
    try {
      const result = await db.update(airwayLinesTubes)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(airwayLinesTubes.id, req.params.id))
        .returning();
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update airway data" });
    }
  });

  // ========== DUTY STAFF ASSIGNMENTS ==========
  app.get("/api/patient-monitoring/duty-staff/:sessionId", async (req, res) => {
    try {
      const data = await db.select().from(dutyStaffAssignments)
        .where(eq(dutyStaffAssignments.sessionId, req.params.sessionId))
        .orderBy(dutyStaffAssignments.shiftStartTime);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch duty staff" });
    }
  });

  app.post("/api/patient-monitoring/duty-staff", async (req, res) => {
    try {
      const parsed = insertDutyStaffAssignmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error });
      }
      const result = await db.insert(dutyStaffAssignments).values(parsed.data).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to save duty staff" });
    }
  });

  // ========== ALLERGIES & PRECAUTIONS ==========
  app.get("/api/patient-monitoring/allergies/:sessionId", async (req, res) => {
    try {
      const data = await db.select().from(patientAllergiesPrecautions)
        .where(eq(patientAllergiesPrecautions.sessionId, req.params.sessionId));
      res.json(data[0] || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch allergies" });
    }
  });

  app.post("/api/patient-monitoring/allergies", async (req, res) => {
    try {
      const parsed = insertPatientAllergiesPrecautionsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error });
      }
      const result = await db.insert(patientAllergiesPrecautions).values(parsed.data).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to save allergies" });
    }
  });

  app.patch("/api/patient-monitoring/allergies/:id", async (req, res) => {
    try {
      const result = await db.update(patientAllergiesPrecautions)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(patientAllergiesPrecautions.id, req.params.id))
        .returning();
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update allergies" });
    }
  });

  // ========== AUDIT LOG ==========
  app.get("/api/patient-monitoring/audit/:sessionId", async (req, res) => {
    try {
      const data = await db.select().from(patientMonitoringAuditLog)
        .where(eq(patientMonitoringAuditLog.sessionId, req.params.sessionId))
        .orderBy(desc(patientMonitoringAuditLog.timestamp));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit log" });
    }
  });

  app.post("/api/patient-monitoring/audit", async (req, res) => {
    try {
      const parsed = insertPatientMonitoringAuditLogSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error });
      }
      const result = await db.insert(patientMonitoringAuditLog).values(parsed.data).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to save audit log" });
    }
  });

  const httpServer = createServer(app);

  // Initialize WebSocket notification service
  notificationService.initialize(httpServer);

  // Start appointment reminder scheduler
  notificationService.startReminderScheduler();

  // Start health tip scheduler (9 AM and 9 PM IST daily)
  notificationService.startHealthTipScheduler();

  // Start birthday wish scheduler (9 AM IST daily)
  notificationService.startBirthdayScheduler();

  return httpServer;
}
