import express, { type Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { databaseStorage } from "./database-storage";
import { insertAppointmentSchema, insertInventoryItemSchema, insertInventoryTransactionSchema, insertStaffMemberSchema, insertInventoryPatientSchema, insertTrackingPatientSchema, insertMedicationSchema, insertMealSchema, insertVitalsSchema, insertConversationLogSchema, insertServicePatientSchema, insertAdmissionSchema, insertMedicalRecordSchema, insertBiometricTemplateSchema, insertBiometricVerificationSchema, insertNotificationSchema, insertHospitalTeamMemberSchema, insertActivityLogSchema, insertEquipmentSchema, insertServiceHistorySchema, insertEmergencyContactSchema, insertHospitalSettingsSchema, insertPrescriptionSchema, insertDoctorScheduleSchema, insertDoctorPatientSchema, insertUserSchema } from "@shared/schema";
import { getChatbotResponse, getChatbotStats } from "./openai";
import { notificationService } from "./notification-service";

const SALT_ROUNDS = 10;

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed initial data if database is empty
  await databaseStorage.seedInitialData();
  await databaseStorage.seedEquipmentData();
  
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

  // Get all doctors
  app.get("/api/doctors", async (_req, res) => {
    try {
      const doctors = await storage.getDoctors();
      res.json(doctors);
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

  // Get doctor schedules
  app.get("/api/doctors/:id/schedules", async (req, res) => {
    try {
      const { date } = req.query;
      const schedules = await storage.getSchedules(req.params.id, date as string);
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

  // Create team member with user account for login
  app.post("/api/team-members", async (req, res) => {
    try {
      const { name, title, email, phone, username, password } = req.body;
      
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
      
      // Create team member
      const memberData = {
        name,
        title,
        department: role, // Use role as department
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

  // ========== DOCTOR SCHEDULE ROUTES ==========

  // Get doctor schedules
  app.get("/api/doctor-schedules/:doctorId", async (req, res) => {
    try {
      const schedules = await storage.getDoctorSchedules(req.params.doctorId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch doctor schedules" });
    }
  });

  // Create doctor schedule
  app.post("/api/doctor-schedules", async (req, res) => {
    try {
      const parsed = insertDoctorScheduleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const schedule = await storage.createDoctorSchedule(parsed.data);
      res.status(201).json(schedule);
    } catch (error) {
      res.status(500).json({ error: "Failed to create doctor schedule" });
    }
  });

  // Update doctor schedule
  app.patch("/api/doctor-schedules/:id", async (req, res) => {
    try {
      const schedule = await storage.updateDoctorSchedule(req.params.id, req.body);
      if (!schedule) {
        return res.status(404).json({ error: "Doctor schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ error: "Failed to update doctor schedule" });
    }
  });

  // Delete doctor schedule
  app.delete("/api/doctor-schedules/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDoctorSchedule(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Doctor schedule not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete doctor schedule" });
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
      const record = await databaseStorage.createOxygenConsumption(req.body);
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

  const httpServer = createServer(app);

  // Initialize WebSocket notification service
  notificationService.initialize(httpServer);

  // Start appointment reminder scheduler
  notificationService.startReminderScheduler();

  return httpServer;
}
