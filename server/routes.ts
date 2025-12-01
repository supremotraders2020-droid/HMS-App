import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAppointmentSchema, insertInventoryItemSchema, insertInventoryTransactionSchema, insertStaffMemberSchema, insertInventoryPatientSchema, insertTrackingPatientSchema, insertMedicationSchema, insertMealSchema, insertVitalsSchema, insertConversationLogSchema, insertServicePatientSchema, insertAdmissionSchema, insertMedicalRecordSchema } from "@shared/schema";
import { getChatbotResponse, getChatbotStats } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
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
      res.status(201).json(newItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to create item" });
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

  const httpServer = createServer(app);

  return httpServer;
}
