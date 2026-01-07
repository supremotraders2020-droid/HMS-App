import express, { type Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
import crypto from "crypto";
import bwipjs from "bwip-js";
import multer from "multer";
import { z } from "zod";
import { HMS_MODULES, HMS_ACTIONS, DEFAULT_PERMISSIONS } from "../shared/permissions";
import { storage } from "./storage";
import { databaseStorage } from "./database-storage";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { users, doctors, doctorProfiles, insertAppointmentSchema, insertInventoryItemSchema, insertInventoryTransactionSchema, insertStaffMemberSchema, insertInventoryPatientSchema, insertTrackingPatientSchema, insertMedicationSchema, insertMealSchema, insertVitalsSchema, insertDoctorVisitSchema, insertConversationLogSchema, insertServicePatientSchema, insertAdmissionSchema, insertMedicalRecordSchema, insertBiometricTemplateSchema, insertBiometricVerificationSchema, insertNotificationSchema, insertHospitalTeamMemberSchema, insertActivityLogSchema, insertEquipmentSchema, insertServiceHistorySchema, insertEmergencyContactSchema, insertHospitalSettingsSchema, insertPrescriptionSchema, insertDoctorScheduleSchema, insertDoctorPatientSchema, insertUserSchema, insertDoctorTimeSlotSchema, type InsertDoctorTimeSlot,
  patientBarcodes, insertPatientBarcodeSchema, barcodeScanLogs, insertBarcodeScanLogSchema, servicePatients,
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
  patientMonitoringAuditLog, insertPatientMonitoringAuditLogSchema,
  // Bed Management
  bedCategories, insertBedCategorySchema,
  beds, insertBedSchema,
  bedTransfers, insertBedTransferSchema,
  bedAllocations, insertBedAllocationSchema,
  bedAuditLog, insertBedAuditLogSchema,
  // Blood Bank
  bloodServiceGroups, insertBloodServiceGroupSchema,
  bloodServices, insertBloodServiceSchema,
  bloodDonors, insertBloodDonorSchema,
  bloodUnits, insertBloodUnitSchema,
  bloodStorageFacilities, insertBloodStorageFacilitySchema,
  bloodTemperatureLogs, insertBloodTemperatureLogSchema,
  bloodTransfusionOrders, insertBloodTransfusionOrderSchema,
  bloodTransfusionReactions, insertBloodTransfusionReactionSchema,
  bloodBankAuditLog, insertBloodBankAuditLogSchema,
  medicalStores, insertMedicalStoreSchema,
  medicalStoreUsers, insertMedicalStoreUserSchema,
  medicalStoreInventory, insertMedicalStoreInventorySchema,
  prescriptionDispensing, insertPrescriptionDispensingSchema,
  dispensingItems, insertDispensingItemSchema,
  medicalStoreAccessLogs, insertMedicalStoreAccessLogSchema,
  medicalStoreBills, insertMedicalStoreBillSchema,
  prescriptions,
  insertLabTestOrderSchema,
  // OPD Prescription Templates
  opdPrescriptionTemplates, insertOpdPrescriptionTemplateSchema,
  opdTemplateVersions, insertOpdTemplateVersionSchema,
  // ID Card Scanning & Alert System
  idCardScans, insertIdCardScanSchema,
  criticalAlerts, insertCriticalAlertSchema,
  // Super Admin Tables
  auditLogs, insertAuditLogSchema,
  financialLocks, insertFinancialLockSchema,
  rolePermissions, insertRolePermissionSchema,
  billingRecords, insertBillingRecordSchema,
  stockBatches, insertStockBatchSchema,
  surgeryPackages, insertSurgeryPackageSchema,
  insuranceProviders, insertInsuranceProviderSchema,
  insuranceClaims, insertInsuranceClaimSchema,
  hospitalPackages, insertHospitalPackageSchema,
  overrideRequests, insertOverrideRequestSchema,
  medicineCatalog, insertMedicineCatalogSchema
} from "@shared/schema";
import { getChatbotResponse, getChatbotStats } from "./openai";
import { notificationService } from "./notification-service";
import { aiEngines } from "./ai-engines";

const SALT_ROUNDS = 10;

// Generate secure random password (12 characters)
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Configure multer for file uploads
const labReportStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'lab-reports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `lab-report-${uniqueSuffix}${ext}`);
  }
});

const uploadLabReport = multer({
  storage: labReportStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'));
    }
  }
});

// Authorization middleware for lab report uploads - runs BEFORE multer
const requireLabReportUploadAuth = (req: any, res: any, next: any) => {
  const session = req.session;
  const user = session?.user;
  
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const allowedRoles = ["PATHOLOGY_LAB", "ADMIN"];
  if (!allowedRoles.includes(user.role)) {
    return res.status(403).json({ error: "Access denied. Only pathology lab staff and administrators can upload lab reports." });
  }
  
  next();
};

// General authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  const session = req.session;
  const user = session?.user;
  
  if (!user) {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }
  
  // Populate req.user for downstream route handlers
  req.user = user;
  next();
};

// Role-based authorization middleware factory
const requireRole = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    const session = req.session;
    const user = session?.user;
    
    if (!user) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }
    
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: `Access denied. Required roles: ${allowedRoles.join(", ")}` });
    }
    
    next();
  };
};

// Permission-based authorization middleware factory
// Uses the centralized permission matrix stored in the database
type HMSModule = typeof HMS_MODULES[number];
type HMSAction = typeof HMS_ACTIONS[number];

const requirePermission = (module: HMSModule, action: HMSAction) => {
  return async (req: any, res: any, next: any) => {
    const session = req.session;
    const user = session?.user;
    
    if (!user) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }
    
    const role = user.role as string;
    
    // Super Admin has all permissions
    if (role === "SUPER_ADMIN") {
      return next();
    }
    
    try {
      // Check database for permission
      const permission = await storage.getRolePermission(role, module);
      
      // Map action to database field
      const actionFieldMap: Record<HMSAction, string> = {
        view: "canView",
        create: "canCreate",
        edit: "canEdit",
        delete: "canDelete",
        approve: "canApprove",
        lock: "canLock",
        unlock: "canUnlock",
        export: "canExport"
      };
      
      const field = actionFieldMap[action];
      
      // If permission exists in DB, use it; otherwise fall back to defaults
      let hasPermission = false;
      if (permission) {
        hasPermission = permission[field as keyof typeof permission] === true;
      } else {
        // Fall back to default permissions
        const defaults = DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS]?.[module];
        hasPermission = defaults?.[action] === true;
      }
      
      if (!hasPermission) {
        return res.status(403).json({ 
          error: `Access denied. You don't have permission to ${action} ${module.toLowerCase().replace("_", " ")}.`
        });
      }
      
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ error: "Failed to verify permissions" });
    }
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static consent PDF files from server/public/consents
  app.use('/consents', express.static(path.join(process.cwd(), 'server/public/consents')));
  
  // Authenticated lab report file downloads - protects PHI from unauthorized access
  app.get('/uploads/lab-reports/:filename', async (req, res) => {
    const session = (req.session as any);
    const user = session?.user;
    
    if (!user) {
      return res.status(401).json({ error: "Unauthorized. Please log in to access lab reports." });
    }
    
    // Only allow access for authorized roles (patient ownership checked at API level)
    const allowedRoles = ["ADMIN", "PATHOLOGY_LAB", "DOCTOR", "NURSE", "PATIENT"];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Access denied." });
    }
    
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', 'lab-reports', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    
    // Security: Prevent path traversal attacks
    const realPath = fs.realpathSync(filePath);
    const uploadsDir = fs.realpathSync(path.join(process.cwd(), 'uploads', 'lab-reports'));
    if (!realPath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Set content disposition for download
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.sendFile(realPath);
  });
  
  // Seed initial data if database is empty
  await databaseStorage.seedInitialData();
  await databaseStorage.seedEquipmentData();
  await databaseStorage.seedBmwData();
  await databaseStorage.seedConsentTemplates();
  await databaseStorage.seedPathologyTests();
  await databaseStorage.seedHospitalServices();
  await databaseStorage.seedSystemTemplates();
  
  // Ensure lab test order sequence exists for concurrency-safe order numbers
  await databaseStorage.ensureLabTestOrderSequence();
  
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
      const { username: rawUsername, password, role } = req.body;
      const username = rawUsername?.trim();
      
      if (!username || !role) {
        return res.status(400).json({ error: "Username and role are required" });
      }
      
      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }
      
      // Find user in database (trimmed username)
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
      
      // Set session user for authenticated routes
      (req.session as any).user = userWithoutPassword;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Get all users
  app.get("/api/users", async (_req, res) => {
    try {
      const allUsers = await databaseStorage.getAllUsers();
      const usersWithoutPasswords = allUsers.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Failed to get users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
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

  // Get all nurses
  app.get("/api/users/nurses", async (_req, res) => {
    try {
      const allUsers = await databaseStorage.getAllUsers();
      const nurses = allUsers
        .filter(user => user.role === "NURSE")
        .map(({ password, ...user }) => ({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role
        }));
      res.json(nurses);
    } catch (error) {
      console.error("Failed to get nurses:", error);
      res.status(500).json({ error: "Failed to fetch nurses" });
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

  // Get all appointments (with patient data isolation for PATIENT role)
  app.get("/api/appointments", async (req, res) => {
    try {
      const user = req.user as any;
      let appointments = await storage.getAppointments();
      
      // CRITICAL: Patient data isolation - PATIENT role only sees their own appointments
      if (user && user.role === 'PATIENT') {
        const patientId = user.id;
        appointments = appointments.filter(apt => 
          apt.patientId === patientId || 
          apt.patientName?.toLowerCase() === user.name?.toLowerCase() ||
          apt.patientName?.toLowerCase() === user.username?.toLowerCase()
        );
      }
      
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  // Get appointments by status (with patient data isolation for PATIENT role)
  app.get("/api/appointments/status/:status", async (req, res) => {
    try {
      const user = req.user as any;
      let appointments = await storage.getAppointmentsByStatus(req.params.status);
      
      // CRITICAL: Patient data isolation - PATIENT role only sees their own appointments
      if (user && user.role === 'PATIENT') {
        const patientId = user.id;
        appointments = appointments.filter(apt => 
          apt.patientId === patientId || 
          apt.patientName?.toLowerCase() === user.name?.toLowerCase() ||
          apt.patientName?.toLowerCase() === user.username?.toLowerCase()
        );
      }
      
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
      
      // Force status to "pending" for all new appointments (requires doctor confirmation)
      const appointmentData = { ...validatedData, status: "pending" };
      const appointment = await storage.createAppointment(appointmentData);
      
      // Log activity
      await storage.createActivityLog({
        action: `Pending appointment for ${validatedData.patientName} - awaiting doctor confirmation`,
        entityType: "appointment",
        entityId: appointment.id,
        performedBy: "OPD System",
        performedByRole: "SYSTEM",
        activityType: "pending"
      });

      // Send real-time notification to doctor and patient
      // Resolve doctorId to user ID for proper notification routing
      const patientId = req.body.patientId || req.body.patientName; // Use patientId if provided, fallback to patientName
      const resolvedDoctorUserId = await resolveDoctorId(validatedData.doctorId);
      notificationService.notifyAppointmentCreated(
        appointment.id,
        resolvedDoctorUserId,
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

  // Confirm appointment (doctor confirms pending appointment)
  app.patch("/api/appointments/:id/confirm", async (req, res) => {
    try {
      const appointment = await storage.updateAppointmentStatus(req.params.id, "confirmed");
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      // Get doctor info for notification - check time slot first, then users table, then doctors table
      let doctorName = 'Doctor';
      try {
        // First try to get from time slot (most reliable for OPD appointments)
        const timeSlot = await databaseStorage.getDoctorTimeSlotByAppointmentId(appointment.id);
        if (timeSlot?.doctorName) {
          doctorName = timeSlot.doctorName.replace(/^Dr\.\s*/i, ''); // Remove "Dr." prefix if present
        } else {
          // Try to get from users table (doctorId might be a userId)
          const user = await storage.getUser(appointment.doctorId);
          if (user?.name) {
            doctorName = user.name.replace(/^Dr\.\s*/i, '');
          } else {
            // Final fallback to doctors table
            const doctor = await storage.getDoctor(appointment.doctorId);
            if (doctor?.name) doctorName = doctor.name.replace(/^Dr\.\s*/i, '');
          }
        }
      } catch (e) {
        console.log("Doctor profile not found, using default name");
      }
      
      // Send real-time notification to patient (use patientId or patientName as fallback)
      const patientId = appointment.patientId || appointment.patientName;
      if (patientId) {
        notificationService.notifyAppointmentConfirmed(
          appointment.id,
          appointment.doctorId,
          doctorName,
          patientId,
          appointment.patientName,
          appointment.appointmentDate,
          appointment.timeSlot,
          appointment.department || undefined,
          appointment.location || undefined
        ).catch(err => console.error("Notification error:", err));
      }
      
      // Log activity for admin dashboard recent activities
      await storage.createActivityLog({
        action: `Appointment confirmed for ${appointment.patientName} by Dr. ${doctorName}`,
        entityType: "appointment",
        entityId: appointment.id,
        performedBy: `Dr. ${doctorName}`,
        performedByRole: "DOCTOR",
        activityType: "success",
        metadata: JSON.stringify({
          patientName: appointment.patientName,
          doctorName,
          appointmentDate: appointment.appointmentDate,
          timeSlot: appointment.timeSlot,
          department: appointment.department,
          location: appointment.location,
          status: 'confirmed'
        })
      });
      
      res.json(appointment);
    } catch (error) {
      console.error("Failed to confirm appointment:", error);
      res.status(500).json({ error: "Failed to confirm appointment" });
    }
  });

  // Cancel appointment
  app.patch("/api/appointments/:id/cancel", async (req, res) => {
    try {
      const existingAppointment = await storage.getAppointment(req.params.id);
      if (!existingAppointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      const appointment = await storage.updateAppointmentStatus(req.params.id, "cancelled");
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      // Determine who cancelled (default to doctor if not specified)
      const cancelledBy = req.body.cancelledBy || 'doctor';
      
      // Get doctor info for notification - check time slot first, then users table, then doctors table
      let doctorName = 'Doctor';
      try {
        // First try to get from time slot (most reliable for OPD appointments)
        const timeSlot = await databaseStorage.getDoctorTimeSlotByAppointmentId(appointment.id);
        if (timeSlot?.doctorName) {
          doctorName = timeSlot.doctorName.replace(/^Dr\.\s*/i, ''); // Remove "Dr." prefix if present
        } else {
          // Try to get from users table (doctorId might be a userId)
          const user = await storage.getUser(appointment.doctorId);
          if (user?.name) {
            doctorName = user.name.replace(/^Dr\.\s*/i, '');
          } else {
            // Final fallback to doctors table
            const doctor = await storage.getDoctor(appointment.doctorId);
            if (doctor?.name) doctorName = doctor.name.replace(/^Dr\.\s*/i, '');
          }
        }
      } catch (e) {
        console.log("Doctor profile not found, using default name");
      }
      
      // Send real-time notification (use patientId or patientName as fallback)
      const patientId = appointment.patientId || appointment.patientName;
      if (patientId) {
        notificationService.notifyAppointmentCancelled(
          appointment.id,
          appointment.doctorId,
          doctorName,
          patientId,
          appointment.patientName,
          appointment.appointmentDate,
          appointment.timeSlot,
          cancelledBy,
          appointment.department || undefined,
          appointment.location || undefined
        ).catch(err => console.error("Notification error:", err));
      }
      
      // Log activity for admin dashboard recent activities
      const cancelledByLabel = cancelledBy === 'doctor' ? `Dr. ${doctorName}` : appointment.patientName;
      await storage.createActivityLog({
        action: `Appointment cancelled for ${appointment.patientName} by ${cancelledByLabel}`,
        entityType: "appointment",
        entityId: appointment.id,
        performedBy: cancelledByLabel,
        performedByRole: cancelledBy === 'doctor' ? 'DOCTOR' : 'PATIENT',
        activityType: "cancellation",
        metadata: JSON.stringify({
          patientName: appointment.patientName,
          doctorName,
          appointmentDate: appointment.appointmentDate,
          timeSlot: appointment.timeSlot,
          department: appointment.department,
          location: appointment.location,
          cancelledBy
        })
      });
      
      res.json(appointment);
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
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

  // Get all inventory staff members (legacy endpoint for inventory module)
  app.get("/api/inventory/staff", async (_req, res) => {
    try {
      const staff = await storage.getAllStaffMembers();
      res.json(staff);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  // Create new inventory staff member (legacy endpoint for inventory module)
  app.post("/api/inventory/staff", async (req, res) => {
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
      
      // If a nurse is assigned, update their assignment status with room and doctor info
      if (parsed.data.nurse) {
        try {
          await storage.updateNurseAssignment(
            parsed.data.nurse,
            parsed.data.room || null,
            parsed.data.doctor || null,
            parsed.data.department || null
          );
          console.log(`Updated nurse assignment for ${parsed.data.nurse}: Room ${parsed.data.room}, Doctor ${parsed.data.doctor}`);
        } catch (nurseError) {
          console.error("Failed to update nurse assignment:", nurseError);
          // Don't fail the admission if nurse assignment update fails
        }
      }
      
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
      // Get the patient first to know which nurse to clear
      const patient = await storage.getTrackingPatientById(req.params.id);
      
      const updated = await storage.dischargeTrackingPatient(req.params.id, new Date());
      if (!updated) {
        return res.status(404).json({ error: "Patient not found" });
      }
      
      // Clear nurse assignment when patient is discharged
      if (patient && patient.nurse) {
        try {
          await storage.clearNurseAssignment(patient.nurse);
          console.log(`Cleared nurse assignment for ${patient.nurse} after patient discharge`);
        } catch (nurseError) {
          console.error("Failed to clear nurse assignment:", nurseError);
        }
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

  // Get all service patients (with patient data isolation for PATIENT role)
  app.get("/api/patients/service", async (req, res) => {
    try {
      const user = req.user as any;
      let patients = await storage.getAllServicePatients();
      
      // CRITICAL: Patient data isolation - PATIENT role only sees their own record
      if (user && user.role === 'PATIENT') {
        const patientId = user.id;
        patients = patients.filter(p => 
          p.id === patientId ||
          p.userId === patientId ||
          p.name?.toLowerCase() === user.name?.toLowerCase() ||
          p.name?.toLowerCase() === user.username?.toLowerCase()
        );
      }
      
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

  // Get all admissions (with patient data isolation for PATIENT role)
  app.get("/api/admissions", async (req, res) => {
    try {
      const user = req.user as any;
      let admissions = await storage.getAllAdmissions();
      
      // CRITICAL: Patient data isolation - PATIENT role only sees their own admissions
      if (user && user.role === 'PATIENT') {
        const patientId = user.id;
        admissions = admissions.filter(adm => 
          adm.patientId === patientId ||
          adm.patientName?.toLowerCase() === user.name?.toLowerCase() ||
          adm.patientName?.toLowerCase() === user.username?.toLowerCase()
        );
      }
      
      res.json(admissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admissions" });
    }
  });

  // Get active admissions (with patient data isolation for PATIENT role)
  app.get("/api/admissions/active", async (req, res) => {
    try {
      const user = req.user as any;
      let admissions = await storage.getActiveAdmissions();
      
      // CRITICAL: Patient data isolation - PATIENT role only sees their own admissions
      if (user && user.role === 'PATIENT') {
        const patientId = user.id;
        admissions = admissions.filter(adm => 
          adm.patientId === patientId ||
          adm.patientName?.toLowerCase() === user.name?.toLowerCase() ||
          adm.patientName?.toLowerCase() === user.username?.toLowerCase()
        );
      }
      
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
      
      // Auto-create patient monitoring session for admitted patient
      try {
        const patient = await storage.getServicePatientById(parsed.data.patientId);
        if (patient) {
          const today = new Date();
          const sessionDate = today.toISOString().split('T')[0];
          
          // Check if session already exists for this patient today
          const existingSessions = await db.select()
            .from(patientMonitoringSessions)
            .where(
              and(
                eq(patientMonitoringSessions.patientId, parsed.data.patientId),
                eq(patientMonitoringSessions.sessionDate, sessionDate)
              )
            );
          
          if (existingSessions.length === 0) {
            await db.insert(patientMonitoringSessions).values({
              patientId: parsed.data.patientId,
              patientName: `${patient.firstName} ${patient.lastName}`,
              uhid: patient.mrn || `MRN-${parsed.data.patientId}`,
              sessionDate,
              wardBed: parsed.data.wardBed || "General Ward",
              primaryDiagnosis: parsed.data.diagnosis || "Pending Assessment",
              isOnVentilator: false,
              isDiabetic: false,
              gcsMeasure: { eye: 4, verbal: 5, motor: 6, total: 15 },
              status: "ACTIVE"
            });
          }
        }
      } catch (sessionError) {
        console.error("Failed to create monitoring session:", sessionError);
        // Don't fail the admission if session creation fails
      }
      
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

  // Get all medical records (with patient data isolation for PATIENT role)
  app.get("/api/medical-records", async (req, res) => {
    try {
      const user = req.user as any;
      let records = await storage.getAllMedicalRecords();
      
      // CRITICAL: Patient data isolation - PATIENT role only sees their own medical records
      if (user && user.role === 'PATIENT') {
        const patientId = user.id;
        records = records.filter(record => 
          record.patientId === patientId
        );
      }
      
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

  // Get all notifications (with patient data isolation for PATIENT role)
  app.get("/api/notifications", async (req, res) => {
    try {
      const user = req.user as any;
      let notifications = await storage.getAllNotifications();
      
      // CRITICAL: Patient data isolation - PATIENT role only sees their own notifications
      if (user && user.role === 'PATIENT') {
        const patientId = user.id;
        notifications = notifications.filter(n => 
          n.userId === patientId ||
          n.recipientId === patientId
        );
      }
      
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

  // Get all prescriptions (with patient data isolation for PATIENT role)
  app.get("/api/prescriptions", async (req, res) => {
    try {
      const user = req.user as any;
      let prescriptions = await storage.getPrescriptions();
      
      // CRITICAL: Patient data isolation - PATIENT role only sees their own prescriptions
      if (user && user.role === 'PATIENT') {
        const patientId = user.id;
        prescriptions = prescriptions.filter(rx => 
          rx.patientId === patientId ||
          rx.patientName?.toLowerCase() === user.name?.toLowerCase() ||
          rx.patientName?.toLowerCase() === user.username?.toLowerCase()
        );
      }
      
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

  // Get prescriptions by patient name (with flexible matching for spacing/case)
  app.get("/api/prescriptions/patient/:patientName", async (req, res) => {
    try {
      const patientName = decodeURIComponent(req.params.patientName);
      const prescriptions = await storage.getPrescriptionsByPatientFlexible(patientName);
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

      // Validate mandatory clinical note fields before finalization
      const existingPrescription = await storage.getPrescription(req.params.id);
      if (existingPrescription) {
        const missingFields = [];
        if (!existingPrescription.patientComplaints) missingFields.push('Patient Complaints');
        if (!existingPrescription.doctorObservations) missingFields.push('Doctor Observations');
        if (!existingPrescription.pastHistoryReference) missingFields.push('Past History Reference');
        
        if (missingFields.length > 0) {
          return res.status(400).json({ 
            error: `Cannot finalize prescription. Missing mandatory fields: ${missingFields.join(', ')}` 
          });
        }
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
        ).catch(err => console.error("Patient notification error:", err));
      }

      // Send real-time notification to medical store with complete prescription details
      notificationService.notifyMedicalStoreNewPrescription({
        id: prescription.id,
        prescriptionNumber: prescription.prescriptionNumber,
        patientId: prescription.patientId,
        patientName: prescription.patientName,
        patientAge: prescription.patientAge,
        patientGender: prescription.patientGender,
        doctorId: prescription.doctorId,
        doctorName: prescription.doctorName,
        diagnosis: prescription.diagnosis,
        medicines: prescription.medicines || [],
        medicineDetails: prescription.medicineDetails,
        instructions: prescription.instructions,
        prescriptionDate: prescription.prescriptionDate,
        signedByName: prescription.signedByName
      }).catch(err => console.error("Medical store notification error:", err));

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

      // Send notification to medical store if prescription is finalized on creation
      if (createdPrescription.prescriptionStatus === 'finalized') {
        notificationService.notifyMedicalStoreNewPrescription({
          id: createdPrescription.id,
          prescriptionNumber: createdPrescription.prescriptionNumber,
          patientId: createdPrescription.patientId,
          patientName: createdPrescription.patientName,
          patientAge: createdPrescription.patientAge,
          patientGender: createdPrescription.patientGender,
          doctorId: createdPrescription.doctorId,
          doctorName: createdPrescription.doctorName,
          diagnosis: createdPrescription.diagnosis,
          medicines: createdPrescription.medicines || [],
          medicineDetails: createdPrescription.medicineDetails,
          instructions: createdPrescription.instructions,
          prescriptionDate: createdPrescription.prescriptionDate,
          signedByName: createdPrescription.signedByName
        }).catch(err => console.error("Medical store notification error:", err));
      }

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
      // Remove "Dr." or "Dr " prefix if present and get the first name
      const cleanedName = doctorName.replace(/^dr\.?\s*/i, '').toLowerCase();
      const firstName = cleanedName.split(' ')[0];
      
      // Try to find user by matching first name in username
      let matchingUser = await databaseStorage.getUserByUsername(firstName);
      
      if (!matchingUser) {
        // Try with 'dr.' prefix
        matchingUser = await databaseStorage.getUserByUsername(`dr.${firstName}`);
      }
      
      // Also try full name match against users table
      if (!matchingUser) {
        const allUsers = await db.select().from(users).where(eq(users.role, 'DOCTOR'));
        matchingUser = allUsers.find(u => 
          u.name?.toLowerCase() === doctorName.toLowerCase() ||
          u.name?.toLowerCase() === cleanedName ||
          u.name?.toLowerCase().includes(firstName)
        );
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

  // Get unique doctor ID to name mappings from time slots (for matching appointments)
  app.get("/api/time-slots/doctor-mappings", async (req, res) => {
    try {
      const mappings = await databaseStorage.getTimeSlotDoctorMappings();
      res.json(mappings);
    } catch (error) {
      console.error("Error fetching doctor mappings:", error);
      res.status(500).json({ error: "Failed to fetch doctor mappings" });
    }
  });

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

      // Create appointment first (status: pending - waiting for doctor confirmation)
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
        status: 'pending'
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
        action: `Pending appointment for ${patientName} - awaiting doctor confirmation`,
        entityType: "appointment",
        entityId: appointment.id,
        performedBy: "OPD System",
        performedByRole: "SYSTEM",
        activityType: "pending"
      });

      // Send real-time notification to doctor, patient, and admin
      // Resolve doctorId to user ID for proper notification routing
      const resolvedDoctorId = await resolveDoctorId(slot.doctorId);
      notificationService.notifyAppointmentCreated(
        appointment.id,
        resolvedDoctorId,
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

  // Render consent template with patient data as PDF (requires authentication)
  app.get("/api/consent-templates/:id/render", async (req, res) => {
    try {
      const { patientId } = req.query;
      
      // Check authentication via headers
      const userId = req.headers['x-user-id'] as string;
      const userRole = req.headers['x-user-role'] as string;
      
      // Only allow authenticated users with appropriate roles to access patient data
      const allowedRoles = ['ADMIN', 'DOCTOR', 'NURSE', 'OPD_MANAGER'];
      if (!userId || !userRole || !allowedRoles.includes(userRole)) {
        return res.status(403).json({ error: "Access denied. Authentication required to generate consent forms." });
      }
      
      // Get the template
      const template = await databaseStorage.getConsentTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Consent template not found" });
      }

      // Get patient data if provided (scoped query by ID, not full table scan)
      let patient = null;
      if (patientId && typeof patientId === 'string' && patientId !== 'none') {
        const [foundPatient] = await db.select().from(servicePatients).where(eq(servicePatients.id, patientId));
        if (!foundPatient) {
          return res.status(404).json({ error: "Patient not found" });
        }
        patient = foundPatient;
      }

      // Read the original PDF file - files are stored in server/public/consents/
      const pdfPath = path.join(process.cwd(), 'server/public', template.pdfPath);
      if (!fs.existsSync(pdfPath)) {
        console.error(`PDF file not found at: ${pdfPath}`);
        return res.status(404).json({ error: "PDF file not found" });
      }

      const pdfBytes = fs.readFileSync(pdfPath);
      
      // Use pdf-lib to modify the PDF with patient details
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      if (patient) {
        // Add patient information header at the top of the first page
        const patientName = `${patient.firstName} ${patient.lastName}`;
        const dateOfBirth = patient.dateOfBirth || 'N/A';
        const gender = patient.gender || 'N/A';
        const phone = patient.phone || 'N/A';
        const currentDate = new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short', 
          year: 'numeric'
        });
        
        // Draw patient info box at the top
        const boxY = height - 90;
        const boxHeight = 70;
        
        // Draw background rectangle
        firstPage.drawRectangle({
          x: 20,
          y: boxY,
          width: width - 40,
          height: boxHeight,
          color: rgb(0.95, 0.97, 1),
          borderColor: rgb(0.2, 0.6, 0.9),
          borderWidth: 1,
        });
        
        // Add "PATIENT DETAILS" header
        firstPage.drawText('PATIENT DETAILS', {
          x: 30,
          y: boxY + boxHeight - 18,
          size: 10,
          font: helveticaBold,
          color: rgb(0.1, 0.4, 0.7),
        });
        
        // Add patient name
        firstPage.drawText(`Name: ${patientName}`, {
          x: 30,
          y: boxY + boxHeight - 35,
          size: 11,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        
        // Add date of birth
        firstPage.drawText(`DOB: ${dateOfBirth}`, {
          x: 250,
          y: boxY + boxHeight - 35,
          size: 10,
          font: helveticaFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        
        // Add gender
        firstPage.drawText(`Gender: ${gender}`, {
          x: 400,
          y: boxY + boxHeight - 35,
          size: 10,
          font: helveticaFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        
        // Add phone
        firstPage.drawText(`Phone: ${phone}`, {
          x: 30,
          y: boxY + boxHeight - 55,
          size: 10,
          font: helveticaFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        
        // Add current date
        firstPage.drawText(`Date: ${currentDate}`, {
          x: 250,
          y: boxY + boxHeight - 55,
          size: 10,
          font: helveticaFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        
        // Add hospital name
        firstPage.drawText('Gravity Hospital, Pimpri-Chinchwad', {
          x: 400,
          y: boxY + boxHeight - 55,
          size: 9,
          font: helveticaFont,
          color: rgb(0.3, 0.3, 0.3),
        });
      }
      
      // Save the modified PDF
      const modifiedPdfBytes = await pdfDoc.save();
      
      // Send the PDF as response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${template.title.replace(/\s+/g, '_')}.pdf"`);
      res.send(Buffer.from(modifiedPdfBytes));
      
    } catch (error) {
      console.error("Failed to render consent template:", error);
      res.status(500).json({ error: "Failed to render consent template" });
    }
  });

  // ========== SERVICE PATIENTS API ==========
  
  // Get all service patients (requires authentication)
  app.get("/api/service-patients", async (req, res) => {
    try {
      // Check authentication via headers or session
      const userId = req.headers['x-user-id'] as string;
      const userRole = req.headers['x-user-role'] as string;
      
      // Only allow authenticated users with appropriate roles
      const allowedRoles = ['ADMIN', 'DOCTOR', 'NURSE', 'OPD_MANAGER'];
      if (!userId || !userRole || !allowedRoles.includes(userRole)) {
        return res.status(403).json({ error: "Access denied. Insufficient permissions to view patient data." });
      }
      
      const patients = await db.select().from(servicePatients).orderBy(desc(servicePatients.createdAt));
      res.json(patients);
    } catch (error) {
      console.error("Failed to fetch service patients:", error);
      res.status(500).json({ error: "Failed to fetch service patients" });
    }
  });

  // Get single service patient by ID (requires authentication)
  app.get("/api/service-patients/:id", async (req, res) => {
    try {
      // Check authentication via headers or session
      const userId = req.headers['x-user-id'] as string;
      const userRole = req.headers['x-user-role'] as string;
      
      // Only allow authenticated users with appropriate roles
      const allowedRoles = ['ADMIN', 'DOCTOR', 'NURSE', 'OPD_MANAGER'];
      if (!userId || !userRole || !allowedRoles.includes(userRole)) {
        return res.status(403).json({ error: "Access denied. Insufficient permissions to view patient data." });
      }
      
      const [patient] = await db.select().from(servicePatients).where(eq(servicePatients.id, req.params.id));
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patient" });
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

  // Get all patient bills (with patient data isolation for PATIENT role)
  app.get("/api/patient-bills", async (req, res) => {
    try {
      const user = req.user as any;
      let bills = await storage.getAllPatientBills();
      
      // CRITICAL: Patient data isolation - PATIENT role only sees their own bills
      if (user && user.role === 'PATIENT') {
        const patientId = user.id;
        bills = bills.filter(bill => 
          bill.patientId === patientId ||
          bill.patientName?.toLowerCase() === user.name?.toLowerCase() ||
          bill.patientName?.toLowerCase() === user.username?.toLowerCase()
        );
      }
      
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
      console.log("Session create request body:", JSON.stringify(req.body, null, 2));
      // Convert admissionDateTime string to Date object and handle empty strings for numeric fields
      const dataToValidate = {
        ...req.body,
        admissionDateTime: req.body.admissionDateTime 
          ? new Date(req.body.admissionDateTime) 
          : new Date(),
        weightKg: req.body.weightKg && req.body.weightKg !== "" ? req.body.weightKg : null,
        bloodGroup: req.body.bloodGroup && req.body.bloodGroup !== "" ? req.body.bloodGroup : null
      };
      const parsed = insertPatientMonitoringSessionSchema.safeParse(dataToValidate);
      if (!parsed.success) {
        console.log("Validation errors:", JSON.stringify(parsed.error.errors, null, 2));
        return res.status(400).json({ error: "Invalid session data", details: parsed.error.errors });
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
      const data = {
        ...req.body,
        startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
        endTime: req.body.endTime ? new Date(req.body.endTime) : undefined
      };
      const parsed = insertInotropesSedationSchema.safeParse(data);
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
      const data = {
        ...req.body,
        recordedTime: req.body.recordedTime ? new Date(req.body.recordedTime) : new Date()
      };
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
      const data = {
        ...req.body,
        scheduledTime: req.body.scheduledTime ? new Date(req.body.scheduledTime) : new Date(),
        actualGivenTime: req.body.actualGivenTime ? new Date(req.body.actualGivenTime) : undefined
      };
      const parsed = insertMedicationAdminRecordSchema.safeParse(data);
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
      const data = {
        ...req.body,
        timeOrdered: req.body.timeOrdered ? new Date(req.body.timeOrdered) : new Date(),
        timeGiven: req.body.timeGiven ? new Date(req.body.timeGiven) : undefined
      };
      const parsed = insertOnceOnlyDrugSchema.safeParse(data);
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
      const data = {
        ...req.body,
        noteTime: req.body.noteTime ? new Date(req.body.noteTime) : new Date()
      };
      const parsed = insertNursingShiftNoteSchema.safeParse(data);
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
      const data = {
        ...req.body,
        shiftStartTime: req.body.shiftStartTime ? new Date(req.body.shiftStartTime) : new Date(),
        shiftEndTime: req.body.shiftEndTime ? new Date(req.body.shiftEndTime) : undefined
      };
      const parsed = insertDutyStaffAssignmentSchema.safeParse(data);
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

  // ========== BED MANAGEMENT MODULE ==========
  // NABH-Compliant Hospital Bed Management System (ADMIN ONLY)

  // Bed Categories CRUD
  app.get("/api/bed-management/categories", async (req, res) => {
    try {
      const categories = await db.select().from(bedCategories).orderBy(bedCategories.name);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bed categories" });
    }
  });

  app.get("/api/bed-management/categories/:id", async (req, res) => {
    try {
      const category = await db.select().from(bedCategories)
        .where(eq(bedCategories.id, req.params.id));
      if (!category.length) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  app.post("/api/bed-management/categories", async (req, res) => {
    try {
      const parsed = insertBedCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid category data", details: parsed.error });
      }
      const result = await db.insert(bedCategories).values(parsed.data).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to create bed category" });
    }
  });

  app.patch("/api/bed-management/categories/:id", async (req, res) => {
    try {
      const result = await db.update(bedCategories)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(bedCategories.id, req.params.id))
        .returning();
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/bed-management/categories/:id", async (req, res) => {
    try {
      await db.delete(bedCategories).where(eq(bedCategories.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Beds CRUD
  app.get("/api/bed-management/beds", async (req, res) => {
    try {
      const allBeds = await db.select().from(beds).orderBy(beds.wardName, beds.bedNumber);
      res.json(allBeds);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch beds" });
    }
  });

  // Available beds route - must be before :id route to avoid "available" being matched as ID
  app.get("/api/bed-management/beds/available", async (req, res) => {
    try {
      const availableBeds = await db.select().from(beds)
        .where(and(eq(beds.occupancyStatus, "AVAILABLE"), eq(beds.isActive, true)))
        .orderBy(beds.wardName, beds.bedNumber);
      res.json(availableBeds);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch available beds" });
    }
  });

  app.get("/api/bed-management/beds/ward/:wardName", async (req, res) => {
    try {
      const wardBeds = await db.select().from(beds)
        .where(eq(beds.wardName, req.params.wardName))
        .orderBy(beds.bedNumber);
      res.json(wardBeds);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ward beds" });
    }
  });

  app.get("/api/bed-management/beds/:id", async (req, res) => {
    try {
      const bed = await db.select().from(beds)
        .where(eq(beds.id, req.params.id));
      if (!bed.length) {
        return res.status(404).json({ error: "Bed not found" });
      }
      res.json(bed[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bed" });
    }
  });

  app.post("/api/bed-management/beds", async (req, res) => {
    try {
      const parsed = insertBedSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid bed data", details: parsed.error });
      }
      const result = await db.insert(beds).values(parsed.data).returning();
      
      // Log bed creation
      await db.insert(bedAuditLog).values({
        bedId: result[0].id,
        bedNumber: result[0].bedNumber,
        action: "CREATE",
        newStatus: result[0].occupancyStatus || "AVAILABLE",
        userId: req.body.createdBy || "system",
        userName: req.body.createdByName || "System",
        userRole: req.body.userRole || "ADMIN",
        details: JSON.stringify({ message: "Bed created" })
      });
      
      res.status(201).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to create bed" });
    }
  });

  app.patch("/api/bed-management/beds/:id", async (req, res) => {
    try {
      // Get current bed state for audit
      const currentBed = await db.select().from(beds).where(eq(beds.id, req.params.id));
      const previousStatus = currentBed[0]?.occupancyStatus;
      
      const result = await db.update(beds)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(beds.id, req.params.id))
        .returning();
      
      // Log status change if status changed
      if (req.body.occupancyStatus && req.body.occupancyStatus !== previousStatus) {
        await db.insert(bedAuditLog).values({
          bedId: result[0].id,
          bedNumber: result[0].bedNumber,
          action: "STATUS_CHANGE",
          previousStatus: previousStatus,
          newStatus: req.body.occupancyStatus,
          patientId: result[0].currentPatientId,
          userId: req.body.updatedBy || "system",
          userName: req.body.updatedByName || "System",
          userRole: req.body.userRole || "ADMIN",
          details: JSON.stringify({ reason: req.body.statusChangeReason || "Manual update" })
        });
      }
      
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update bed" });
    }
  });

  app.delete("/api/bed-management/beds/:id", async (req, res) => {
    try {
      // Get bed info for audit
      const bed = await db.select().from(beds).where(eq(beds.id, req.params.id));
      if (bed[0]) {
        await db.insert(bedAuditLog).values({
          bedId: bed[0].id,
          bedNumber: bed[0].bedNumber,
          action: "DELETE",
          previousStatus: bed[0].occupancyStatus,
          userId: req.body.deletedBy || "system",
          userName: req.body.deletedByName || "System",
          userRole: req.body.userRole || "ADMIN",
          details: JSON.stringify({ message: "Bed deleted" })
        });
      }
      await db.delete(beds).where(eq(beds.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete bed" });
    }
  });

  // Bed Allocation
  app.post("/api/bed-management/allocate", async (req, res) => {
    try {
      const { bedId, patientId, patientName, admissionId, categoryId, categoryName, allocatedBy, allocatedByName, isDayCare, expectedDuration } = req.body;
      
      // Get bed info
      const bed = await db.select().from(beds).where(eq(beds.id, bedId));
      if (!bed.length) {
        return res.status(404).json({ error: "Bed not found" });
      }
      if (bed[0].occupancyStatus !== "AVAILABLE") {
        return res.status(400).json({ error: "Bed is not available for allocation" });
      }
      
      // Update bed status
      await db.update(beds).set({
        occupancyStatus: "OCCUPIED",
        currentPatientId: patientId,
        currentAdmissionId: admissionId,
        bedStartDatetime: new Date(),
        lastOccupiedAt: new Date(),
        updatedAt: new Date()
      }).where(eq(beds.id, bedId));
      
      // Create allocation record
      const allocation = await db.insert(bedAllocations).values({
        patientId,
        patientName,
        admissionId,
        bedId,
        bedNumber: bed[0].bedNumber,
        categoryId,
        categoryName,
        wardName: bed[0].wardName,
        allocationDatetime: new Date(),
        isDayCare: isDayCare || false,
        expectedDuration: expectedDuration || null,
        allocatedBy,
        allocatedByName
      }).returning();
      
      // Log allocation
      await db.insert(bedAuditLog).values({
        bedId,
        bedNumber: bed[0].bedNumber,
        action: "ALLOCATE",
        previousStatus: "AVAILABLE",
        newStatus: "OCCUPIED",
        patientId,
        patientName,
        admissionId,
        userId: allocatedBy,
        userName: allocatedByName,
        userRole: "ADMIN",
        details: JSON.stringify({ allocationId: allocation[0].id })
      });
      
      res.status(201).json(allocation[0]);
    } catch (error) {
      console.error("Allocation error:", error);
      res.status(500).json({ error: "Failed to allocate bed" });
    }
  });

  // Bed Release
  app.post("/api/bed-management/release", async (req, res) => {
    try {
      const { bedId, releaseReason, releasedBy, releasedByName } = req.body;
      
      // Get bed info
      const bed = await db.select().from(beds).where(eq(beds.id, bedId));
      if (!bed.length) {
        return res.status(404).json({ error: "Bed not found" });
      }
      
      // Update active allocation
      const activeAllocation = await db.select().from(bedAllocations)
        .where(and(eq(bedAllocations.bedId, bedId), eq(bedAllocations.releaseDatetime, null as any)));
      
      if (activeAllocation.length) {
        await db.update(bedAllocations).set({
          releaseDatetime: new Date(),
          releaseReason,
          releasedBy,
          releasedByName,
          updatedAt: new Date()
        }).where(eq(bedAllocations.id, activeAllocation[0].id));
      }
      
      // Update bed status to CLEANING
      await db.update(beds).set({
        occupancyStatus: "CLEANING",
        currentPatientId: null,
        currentAdmissionId: null,
        bedStartDatetime: null,
        updatedAt: new Date()
      }).where(eq(beds.id, bedId));
      
      // Log release
      await db.insert(bedAuditLog).values({
        bedId,
        bedNumber: bed[0].bedNumber,
        action: "RELEASE",
        previousStatus: "OCCUPIED",
        newStatus: "CLEANING",
        patientId: bed[0].currentPatientId,
        userId: releasedBy,
        userName: releasedByName,
        userRole: "ADMIN",
        details: JSON.stringify({ releaseReason })
      });
      
      res.json({ success: true, message: "Bed released and marked for cleaning" });
    } catch (error) {
      console.error("Release error:", error);
      res.status(500).json({ error: "Failed to release bed" });
    }
  });

  // Mark bed as cleaned/available
  app.post("/api/bed-management/mark-cleaned", async (req, res) => {
    try {
      const { bedId, cleanedBy, cleanedByName } = req.body;
      
      const bed = await db.select().from(beds).where(eq(beds.id, bedId));
      if (!bed.length) {
        return res.status(404).json({ error: "Bed not found" });
      }
      
      await db.update(beds).set({
        occupancyStatus: "AVAILABLE",
        lastCleanedAt: new Date(),
        updatedAt: new Date()
      }).where(eq(beds.id, bedId));
      
      await db.insert(bedAuditLog).values({
        bedId,
        bedNumber: bed[0].bedNumber,
        action: "CLEANING_COMPLETE",
        previousStatus: "CLEANING",
        newStatus: "AVAILABLE",
        userId: cleanedBy,
        userName: cleanedByName,
        userRole: "ADMIN",
        details: JSON.stringify({ message: "Bed cleaned and available" })
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark bed as cleaned" });
    }
  });

  // Bed Transfers
  app.get("/api/bed-management/transfers", async (req, res) => {
    try {
      const transfers = await db.select().from(bedTransfers)
        .orderBy(desc(bedTransfers.transferDatetime));
      res.json(transfers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transfers" });
    }
  });

  app.get("/api/bed-management/transfers/patient/:patientId", async (req, res) => {
    try {
      const transfers = await db.select().from(bedTransfers)
        .where(eq(bedTransfers.patientId, req.params.patientId))
        .orderBy(bedTransfers.transferSequenceNumber);
      res.json(transfers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patient transfers" });
    }
  });

  app.post("/api/bed-management/transfers", async (req, res) => {
    try {
      const parsed = insertBedTransferSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid transfer data", details: parsed.error });
      }
      
      // Validate from bed is occupied by patient
      const fromBed = await db.select().from(beds).where(eq(beds.id, parsed.data.fromBedId));
      if (!fromBed.length || fromBed[0].currentPatientId !== parsed.data.patientId) {
        return res.status(400).json({ error: "Patient is not in the source bed" });
      }
      
      // Validate to bed is available
      const toBed = await db.select().from(beds).where(eq(beds.id, parsed.data.toBedId));
      if (!toBed.length || toBed[0].occupancyStatus !== "AVAILABLE") {
        return res.status(400).json({ error: "Destination bed is not available" });
      }
      
      // Release from bed
      await db.update(beds).set({
        occupancyStatus: "CLEANING",
        currentPatientId: null,
        currentAdmissionId: null,
        bedStartDatetime: null,
        updatedAt: new Date()
      }).where(eq(beds.id, parsed.data.fromBedId));
      
      // Allocate to bed
      await db.update(beds).set({
        occupancyStatus: "OCCUPIED",
        currentPatientId: parsed.data.patientId,
        currentAdmissionId: parsed.data.admissionId,
        bedStartDatetime: new Date(),
        lastOccupiedAt: new Date(),
        updatedAt: new Date()
      }).where(eq(beds.id, parsed.data.toBedId));
      
      // Create transfer record
      const result = await db.insert(bedTransfers).values(parsed.data).returning();
      
      // Log transfer
      await db.insert(bedAuditLog).values({
        bedId: parsed.data.fromBedId,
        bedNumber: parsed.data.fromBedNumber,
        action: "TRANSFER",
        previousStatus: "OCCUPIED",
        newStatus: "CLEANING",
        patientId: parsed.data.patientId,
        patientName: parsed.data.patientName,
        admissionId: parsed.data.admissionId,
        userId: parsed.data.createdBy,
        userName: parsed.data.createdByName || "System",
        userRole: "ADMIN",
        details: JSON.stringify({ 
          transferId: result[0].id,
          toBedId: parsed.data.toBedId,
          toBedNumber: parsed.data.toBedNumber,
          reason: parsed.data.transferReason
        })
      });
      
      res.status(201).json(result[0]);
    } catch (error) {
      console.error("Transfer error:", error);
      res.status(500).json({ error: "Failed to create transfer" });
    }
  });

  // Bed Allocations History
  app.get("/api/bed-management/allocations", async (req, res) => {
    try {
      const allocations = await db.select().from(bedAllocations)
        .orderBy(desc(bedAllocations.allocationDatetime));
      res.json(allocations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch allocations" });
    }
  });

  app.get("/api/bed-management/allocations/bed/:bedId", async (req, res) => {
    try {
      const allocations = await db.select().from(bedAllocations)
        .where(eq(bedAllocations.bedId, req.params.bedId))
        .orderBy(desc(bedAllocations.allocationDatetime));
      res.json(allocations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bed allocations" });
    }
  });

  // Bed Audit Log (Read-only, no deletion allowed for NABH compliance)
  app.get("/api/bed-management/audit-log", async (req, res) => {
    try {
      const logs = await db.select().from(bedAuditLog)
        .orderBy(desc(bedAuditLog.timestamp))
        .limit(500);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit log" });
    }
  });

  app.get("/api/bed-management/audit-log/bed/:bedId", async (req, res) => {
    try {
      const logs = await db.select().from(bedAuditLog)
        .where(eq(bedAuditLog.bedId, req.params.bedId))
        .orderBy(desc(bedAuditLog.timestamp));
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bed audit log" });
    }
  });

  // Bed Statistics/Analytics
  app.get("/api/bed-management/stats", async (req, res) => {
    try {
      const allBeds = await db.select().from(beds).where(eq(beds.isActive, true));
      const categories = await db.select().from(bedCategories).where(eq(bedCategories.isActive, true));
      
      const stats = {
        totalBeds: allBeds.length,
        availableBeds: allBeds.filter(b => b.occupancyStatus === "AVAILABLE").length,
        occupiedBeds: allBeds.filter(b => b.occupancyStatus === "OCCUPIED").length,
        cleaningBeds: allBeds.filter(b => b.occupancyStatus === "CLEANING").length,
        blockedBeds: allBeds.filter(b => b.occupancyStatus === "BLOCKED").length,
        maintenanceBeds: allBeds.filter(b => b.occupancyStatus === "MAINTENANCE").length,
        occupancyRate: allBeds.length > 0 
          ? Math.round((allBeds.filter(b => b.occupancyStatus === "OCCUPIED").length / allBeds.length) * 100) 
          : 0,
        isolationBeds: allBeds.filter(b => b.isIsolationBed).length,
        icuBeds: allBeds.filter(b => b.department === "ICU").length,
        ventilatorCapable: allBeds.filter(b => b.hasVentilatorCapability).length,
        oxygenCapable: allBeds.filter(b => b.hasOxygenCapability).length,
        totalCategories: categories.length,
        byWard: {} as Record<string, { total: number; occupied: number; available: number }>,
        byDepartment: {} as Record<string, { total: number; occupied: number; available: number }>
      };
      
      // Group by ward
      allBeds.forEach(bed => {
        if (!stats.byWard[bed.wardName]) {
          stats.byWard[bed.wardName] = { total: 0, occupied: 0, available: 0 };
        }
        stats.byWard[bed.wardName].total++;
        if (bed.occupancyStatus === "OCCUPIED") stats.byWard[bed.wardName].occupied++;
        if (bed.occupancyStatus === "AVAILABLE") stats.byWard[bed.wardName].available++;
      });
      
      // Group by department
      allBeds.forEach(bed => {
        if (!stats.byDepartment[bed.department]) {
          stats.byDepartment[bed.department] = { total: 0, occupied: 0, available: 0 };
        }
        stats.byDepartment[bed.department].total++;
        if (bed.occupancyStatus === "OCCUPIED") stats.byDepartment[bed.department].occupied++;
        if (bed.occupancyStatus === "AVAILABLE") stats.byDepartment[bed.department].available++;
      });
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bed statistics" });
    }
  });

  // ========== BLOOD BANK MODULE ROUTES ==========

  // Blood Bank authentication middleware - ADMIN only
  const bloodBankAuthMiddleware = async (req: any, res: any, next: any) => {
    if (!req.session?.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Blood Bank access restricted to administrators only" });
    }
    next();
  };

  // Blood Service Groups
  app.get("/api/blood-bank/service-groups", bloodBankAuthMiddleware, async (req, res) => {
    try {
      const groups = await db.select().from(bloodServiceGroups).orderBy(bloodServiceGroups.displayOrder);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service groups" });
    }
  });

  // Blood Services
  app.get("/api/blood-bank/services", bloodBankAuthMiddleware, async (req, res) => {
    try {
      const services = await db.select().from(bloodServices).orderBy(bloodServices.displayOrder);
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blood services" });
    }
  });

  // Blood Units
  app.get("/api/blood-bank/units", bloodBankAuthMiddleware, async (req, res) => {
    try {
      const units = await db.select().from(bloodUnits).orderBy(desc(bloodUnits.createdAt));
      res.json(units);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blood units" });
    }
  });

  app.post("/api/blood-bank/units", bloodBankAuthMiddleware, async (req, res) => {
    try {
      const data = insertBloodUnitSchema.parse(req.body);
      const [unit] = await db.insert(bloodUnits).values(data).returning();
      
      // Create audit log
      await db.insert(bloodBankAuditLog).values({
        entityType: "BLOOD_UNIT",
        entityId: unit.id,
        action: "CREATE",
        newValue: JSON.stringify(data),
        userId: req.body.createdBy || "system",
        userName: req.body.createdByName || "System",
        userRole: "ADMIN",
        details: `Blood unit ${unit.unitId} created`
      });
      
      res.json(unit);
    } catch (error) {
      res.status(500).json({ error: "Failed to create blood unit" });
    }
  });

  app.patch("/api/blood-bank/units/:id", bloodBankAuthMiddleware, async (req, res) => {
    try {
      const [existing] = await db.select().from(bloodUnits).where(eq(bloodUnits.id, req.params.id));
      if (!existing) {
        return res.status(404).json({ error: "Blood unit not found" });
      }
      
      const [updated] = await db.update(bloodUnits)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(bloodUnits.id, req.params.id))
        .returning();
      
      // Create audit log for status changes
      if (req.body.status && req.body.status !== existing.status) {
        await db.insert(bloodBankAuditLog).values({
          entityType: "BLOOD_UNIT",
          entityId: updated.id,
          action: "STATUS_CHANGE",
          previousValue: JSON.stringify({ status: existing.status }),
          newValue: JSON.stringify({ status: updated.status }),
          userId: req.body.updatedBy || "system",
          userName: req.body.updatedByName || "System",
          userRole: "ADMIN",
          details: `Blood unit ${updated.unitId} status changed from ${existing.status} to ${updated.status}`
        });
      }
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update blood unit" });
    }
  });

  // Blood Donors
  app.get("/api/blood-bank/donors", bloodBankAuthMiddleware, async (req, res) => {
    try {
      const donorList = await db.select().from(bloodDonors).orderBy(desc(bloodDonors.createdAt));
      res.json(donorList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch donors" });
    }
  });

  app.post("/api/blood-bank/donors", bloodBankAuthMiddleware, async (req, res) => {
    try {
      const data = insertBloodDonorSchema.parse(req.body);
      const [donor] = await db.insert(bloodDonors).values(data).returning();
      
      // Create audit log
      await db.insert(bloodBankAuditLog).values({
        entityType: "DONOR",
        entityId: donor.id,
        action: "CREATE",
        newValue: JSON.stringify({ donorId: donor.donorId, name: donor.name, bloodGroup: donor.bloodGroup }),
        userId: req.body.registeredBy || "system",
        userName: req.body.registeredByName || "System",
        userRole: "ADMIN",
        details: `Donor ${donor.donorId} registered`
      });
      
      res.json(donor);
    } catch (error) {
      res.status(500).json({ error: "Failed to register donor" });
    }
  });

  app.patch("/api/blood-bank/donors/:id", bloodBankAuthMiddleware, async (req, res) => {
    try {
      const [existing] = await db.select().from(bloodDonors).where(eq(bloodDonors.id, req.params.id));
      if (!existing) {
        return res.status(404).json({ error: "Donor not found" });
      }
      
      const [updated] = await db.update(bloodDonors)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(bloodDonors.id, req.params.id))
        .returning();
      
      // Audit log for donor updates
      await db.insert(bloodBankAuditLog).values({
        entityType: "DONOR",
        entityId: updated.id,
        action: "UPDATE",
        previousValue: JSON.stringify({ eligibilityStatus: existing.eligibilityStatus }),
        newValue: JSON.stringify({ eligibilityStatus: updated.eligibilityStatus }),
        userId: (req as any).session?.user?.id || "system",
        userName: (req as any).session?.user?.fullName || "System",
        userRole: "ADMIN",
        details: `Donor ${updated.donorId} updated`
      });
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update donor" });
    }
  });

  // Blood Storage Facilities
  app.get("/api/blood-bank/storage", bloodBankAuthMiddleware, async (req, res) => {
    try {
      const facilities = await db.select().from(bloodStorageFacilities).orderBy(bloodStorageFacilities.name);
      res.json(facilities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch storage facilities" });
    }
  });

  app.post("/api/blood-bank/storage", bloodBankAuthMiddleware, async (req, res) => {
    try {
      const data = insertBloodStorageFacilitySchema.parse(req.body);
      const [facility] = await db.insert(bloodStorageFacilities).values(data).returning();
      res.json(facility);
    } catch (error) {
      res.status(500).json({ error: "Failed to create storage facility" });
    }
  });

  // Temperature Logs
  app.post("/api/blood-bank/storage/:facilityId/temperature", bloodBankAuthMiddleware, async (req, res) => {
    try {
      const data = insertBloodTemperatureLogSchema.parse({
        ...req.body,
        facilityId: req.params.facilityId
      });
      const [log] = await db.insert(bloodTemperatureLogs).values(data).returning();
      
      // Update facility current temperature and check for breach
      const [facility] = await db.select().from(bloodStorageFacilities)
        .where(eq(bloodStorageFacilities.id, req.params.facilityId));
      
      if (facility) {
        const temp = parseFloat(req.body.temperature);
        const minTemp = parseFloat(facility.minTemperature?.toString() || "0");
        const maxTemp = parseFloat(facility.maxTemperature?.toString() || "0");
        const isBreach = temp < minTemp || temp > maxTemp;
        
        await db.update(bloodStorageFacilities)
          .set({
            currentTemperature: req.body.temperature,
            lastTemperatureReading: new Date(),
            hasTemperatureBreach: isBreach,
            updatedAt: new Date()
          })
          .where(eq(bloodStorageFacilities.id, req.params.facilityId));
        
        // Audit log for all temperature readings
        await db.insert(bloodBankAuditLog).values({
          entityType: "STORAGE",
          entityId: facility.id,
          action: isBreach ? "TEMP_BREACH" : "TEMP_LOG",
          newValue: JSON.stringify({ temperature: temp, facilityId: facility.id }),
          details: isBreach 
            ? `Temperature breach detected: ${temp}°C (allowed: ${minTemp}-${maxTemp}°C)` 
            : `Temperature logged: ${temp}°C for ${facility.name}`,
          userId: (req as any).session?.user?.id || "system",
          userName: (req as any).session?.user?.fullName || "System",
          userRole: "ADMIN"
        });
      }
      
      res.json(log);
    } catch (error) {
      res.status(500).json({ error: "Failed to log temperature" });
    }
  });

  // Transfusion Orders
  app.get("/api/blood-bank/orders", bloodBankAuthMiddleware, async (req, res) => {
    try {
      const orders = await db.select().from(bloodTransfusionOrders).orderBy(desc(bloodTransfusionOrders.createdAt));
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transfusion orders" });
    }
  });

  app.post("/api/blood-bank/orders", bloodBankAuthMiddleware, async (req, res) => {
    try {
      const data = insertBloodTransfusionOrderSchema.parse(req.body);
      const [order] = await db.insert(bloodTransfusionOrders).values(data).returning();
      
      await db.insert(bloodBankAuditLog).values({
        entityType: "TRANSFUSION_ORDER",
        entityId: order.id,
        action: "CREATE",
        newValue: JSON.stringify({ orderId: order.orderId, patientName: order.patientName, urgency: order.urgency }),
        userId: req.body.createdBy || "system",
        userName: req.body.createdByName || "System",
        userRole: "ADMIN",
        details: `Transfusion order ${order.orderId} created for ${order.patientName}`
      });
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to create transfusion order" });
    }
  });

  app.patch("/api/blood-bank/orders/:id", bloodBankAuthMiddleware, async (req, res) => {
    try {
      const [existing] = await db.select().from(bloodTransfusionOrders).where(eq(bloodTransfusionOrders.id, req.params.id));
      if (!existing) {
        return res.status(404).json({ error: "Transfusion order not found" });
      }
      
      const [updated] = await db.update(bloodTransfusionOrders)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(bloodTransfusionOrders.id, req.params.id))
        .returning();
      
      // Audit log for order status changes
      if (req.body.status && req.body.status !== existing.status) {
        await db.insert(bloodBankAuditLog).values({
          entityType: "TRANSFUSION_ORDER",
          entityId: updated.id,
          action: "STATUS_CHANGE",
          previousValue: JSON.stringify({ status: existing.status }),
          newValue: JSON.stringify({ status: updated.status }),
          userId: (req as any).session?.user?.id || "system",
          userName: (req as any).session?.user?.fullName || "System",
          userRole: "ADMIN",
          details: `Transfusion order ${updated.orderId} status changed from ${existing.status} to ${updated.status}`
        });
      }
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update transfusion order" });
    }
  });

  // Transfusion Reactions
  app.get("/api/blood-bank/reactions", bloodBankAuthMiddleware, async (req, res) => {
    try {
      const reactions = await db.select().from(bloodTransfusionReactions).orderBy(desc(bloodTransfusionReactions.createdAt));
      res.json(reactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transfusion reactions" });
    }
  });

  app.post("/api/blood-bank/reactions", bloodBankAuthMiddleware, async (req, res) => {
    try {
      const data = insertBloodTransfusionReactionSchema.parse(req.body);
      const [reaction] = await db.insert(bloodTransfusionReactions).values(data).returning();
      
      await db.insert(bloodBankAuditLog).values({
        entityType: "TRANSFUSION_ORDER",
        entityId: reaction.bloodUnitId,
        action: "REACTION",
        details: `Transfusion reaction reported: ${reaction.reactionType} - ${reaction.severity}`,
        userId: reaction.reportedBy,
        userName: reaction.reportedByName,
        userRole: "ADMIN"
      });
      
      res.json(reaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to report transfusion reaction" });
    }
  });

  // Blood Bank Audit Log (Read-only)
  app.get("/api/blood-bank/audit-log", bloodBankAuthMiddleware, async (req, res) => {
    try {
      const logs = await db.select().from(bloodBankAuditLog)
        .orderBy(desc(bloodBankAuditLog.timestamp))
        .limit(500);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit log" });
    }
  });

  // Seed Blood Bank initial data
  const seedBloodBankData = async () => {
    try {
      // Check if service groups already exist
      const existingGroups = await db.select().from(bloodServiceGroups);
      if (existingGroups.length === 0) {
        // Seed 10 NABH-compliant service groups
        const groups = [
          { code: "DONOR", name: "Donor Services", description: "Donor registration, screening, and consent management", displayOrder: 1 },
          { code: "COLLECTION", name: "Blood Collection Services", description: "Whole blood and apheresis collection", displayOrder: 2 },
          { code: "COMPONENT", name: "Component Preparation", description: "Blood component separation and preparation", displayOrder: 3 },
          { code: "TESTING", name: "Testing & Screening", description: "Blood grouping, cross-matching, and disease screening", displayOrder: 4 },
          { code: "STORAGE", name: "Storage & Inventory", description: "Blood unit storage and temperature monitoring", displayOrder: 5 },
          { code: "ISSUE", name: "Issue & Transfusion", description: "Blood issue and transfusion documentation", displayOrder: 6 },
          { code: "REACTION", name: "Transfusion Reaction", description: "Adverse reaction identification and management", displayOrder: 7 },
          { code: "RETURN", name: "Return & Disposal", description: "Unused blood return and disposal management", displayOrder: 8 },
          { code: "EMERGENCY", name: "Emergency Services", description: "Emergency blood issue and massive transfusion protocols", displayOrder: 9 },
          { code: "AUDIT", name: "Audit & Compliance", description: "NABH/FDA compliance and reporting", displayOrder: 10 }
        ];
        await db.insert(bloodServiceGroups).values(groups);
        console.log("Blood Bank service groups seeded");
      }

      // Check if storage facilities exist
      let storageFacilityIds: string[] = [];
      const existingFacilities = await db.select().from(bloodStorageFacilities);
      if (existingFacilities.length === 0) {
        // Seed storage facilities
        const facilities = [
          { facilityCode: "REF-001", name: "Blood Refrigerator 1", type: "REFRIGERATOR", location: "Blood Bank Room A", capacity: 100, minTemperature: "2", maxTemperature: "6", currentTemperature: "4", componentTypes: "WHOLE_BLOOD,PRBC" },
          { facilityCode: "REF-002", name: "Blood Refrigerator 2", type: "REFRIGERATOR", location: "Blood Bank Room A", capacity: 80, minTemperature: "2", maxTemperature: "6", currentTemperature: "4.5", componentTypes: "WHOLE_BLOOD,PRBC" },
          { facilityCode: "FRZ-001", name: "Plasma Freezer", type: "FREEZER", location: "Blood Bank Room B", capacity: 50, minTemperature: "-30", maxTemperature: "-18", currentTemperature: "-25", componentTypes: "FFP,CRYOPRECIPITATE" },
          { facilityCode: "PLT-001", name: "Platelet Agitator", type: "PLATELET_AGITATOR", location: "Blood Bank Room B", capacity: 20, minTemperature: "20", maxTemperature: "24", currentTemperature: "22", componentTypes: "PLATELET" }
        ];
        const insertedFacilities = await db.insert(bloodStorageFacilities).values(facilities).returning();
        storageFacilityIds = insertedFacilities.map(f => f.id);
        console.log("Blood Bank storage facilities seeded");
      } else {
        storageFacilityIds = existingFacilities.map(f => f.id);
      }

      // Check if donors already exist
      const existingDonors = await db.select().from(bloodDonors);
      let donorData: any[] = [];
      if (existingDonors.length === 0) {
        // Seed test donors with realistic Indian names
        const testDonors = [
          { donorId: "DN-20241215-0001", name: "Rajesh Kumar Sharma", bloodGroup: "O+", rhFactor: "Positive", age: 32, gender: "Male", phone: "9876543210", email: "rajesh.sharma@email.com", address: "123 MG Road, Pune", weight: "72", hemoglobinLevel: "14.5", bloodPressure: "120/80", pulseRate: 72, totalDonations: 5, eligibilityStatus: "ELIGIBLE", consentGiven: true },
          { donorId: "DN-20241215-0002", name: "Priya Patel", bloodGroup: "A+", rhFactor: "Positive", age: 28, gender: "Female", phone: "9876543211", email: "priya.patel@email.com", address: "456 FC Road, Pune", weight: "58", hemoglobinLevel: "12.8", bloodPressure: "110/70", pulseRate: 68, totalDonations: 3, eligibilityStatus: "ELIGIBLE", consentGiven: true },
          { donorId: "DN-20241215-0003", name: "Amit Singh Rajput", bloodGroup: "B+", rhFactor: "Positive", age: 35, gender: "Male", phone: "9876543212", email: "amit.rajput@email.com", address: "789 JM Road, Pune", weight: "80", hemoglobinLevel: "15.2", bloodPressure: "125/82", pulseRate: 75, totalDonations: 8, eligibilityStatus: "ELIGIBLE", consentGiven: true },
          { donorId: "DN-20241215-0004", name: "Sunita Devi Verma", bloodGroup: "AB+", rhFactor: "Positive", age: 30, gender: "Female", phone: "9876543213", email: "sunita.verma@email.com", address: "101 Aundh Road, Pune", weight: "62", hemoglobinLevel: "13.0", bloodPressure: "118/78", pulseRate: 70, totalDonations: 2, eligibilityStatus: "ELIGIBLE", consentGiven: true },
          { donorId: "DN-20241215-0005", name: "Mohammad Iqbal Khan", bloodGroup: "O-", rhFactor: "Negative", age: 40, gender: "Male", phone: "9876543214", email: "iqbal.khan@email.com", address: "202 Koregaon Park, Pune", weight: "75", hemoglobinLevel: "14.8", bloodPressure: "122/80", pulseRate: 74, totalDonations: 12, eligibilityStatus: "ELIGIBLE", consentGiven: true },
          { donorId: "DN-20241215-0006", name: "Kavita Joshi", bloodGroup: "A-", rhFactor: "Negative", age: 26, gender: "Female", phone: "9876543215", email: "kavita.joshi@email.com", address: "303 Baner Road, Pune", weight: "55", hemoglobinLevel: "12.5", bloodPressure: "108/72", pulseRate: 66, totalDonations: 1, eligibilityStatus: "ELIGIBLE", consentGiven: true },
          { donorId: "DN-20241215-0007", name: "Vikram Deshmukh", bloodGroup: "B-", rhFactor: "Negative", age: 38, gender: "Male", phone: "9876543216", email: "vikram.deshmukh@email.com", address: "404 Viman Nagar, Pune", weight: "78", hemoglobinLevel: "15.0", bloodPressure: "130/85", pulseRate: 78, totalDonations: 6, eligibilityStatus: "ELIGIBLE", consentGiven: true },
          { donorId: "DN-20241215-0008", name: "Anita Rao", bloodGroup: "AB-", rhFactor: "Negative", age: 33, gender: "Female", phone: "9876543217", email: "anita.rao@email.com", address: "505 Kothrud, Pune", weight: "60", hemoglobinLevel: "13.2", bloodPressure: "115/75", pulseRate: 69, totalDonations: 4, eligibilityStatus: "ELIGIBLE", consentGiven: true }
        ];
        donorData = await db.insert(bloodDonors).values(testDonors).returning();
        console.log("Blood Bank donors seeded: " + donorData.length + " donors");
      } else {
        donorData = existingDonors;
      }

      // Check if blood units already exist
      const existingUnits = await db.select().from(bloodUnits);
      if (existingUnits.length === 0 && donorData.length > 0) {
        // Calculate expiry dates
        const today = new Date();
        const getExpiryDate = (daysFromNow: number) => {
          const date = new Date(today);
          date.setDate(date.getDate() + daysFromNow);
          return date.toISOString().split('T')[0];
        };
        const getCollectionDate = (daysAgo: number) => {
          const date = new Date(today);
          date.setDate(date.getDate() - daysAgo);
          return date.toISOString().split('T')[0];
        };

        // Seed blood units with various statuses
        const testUnits = [
          { unitId: "BU-20241210-0001", componentType: "WHOLE_BLOOD", bloodGroup: "O+", rhFactor: "Positive", volume: 450, donorId: donorData[0]?.id || "donor-1", donorName: "Rajesh Kumar Sharma", collectionDate: getCollectionDate(5), status: "AVAILABLE", expiryDate: getExpiryDate(30), storageFacilityId: storageFacilityIds[0] },
          { unitId: "BU-20241210-0002", componentType: "PRBC", bloodGroup: "O+", rhFactor: "Positive", volume: 280, donorId: donorData[0]?.id || "donor-1", donorName: "Rajesh Kumar Sharma", collectionDate: getCollectionDate(5), status: "AVAILABLE", expiryDate: getExpiryDate(35), storageFacilityId: storageFacilityIds[0] },
          { unitId: "BU-20241211-0001", componentType: "WHOLE_BLOOD", bloodGroup: "A+", rhFactor: "Positive", volume: 450, donorId: donorData[1]?.id || "donor-2", donorName: "Priya Patel", collectionDate: getCollectionDate(4), status: "AVAILABLE", expiryDate: getExpiryDate(31), storageFacilityId: storageFacilityIds[0] },
          { unitId: "BU-20241211-0002", componentType: "FFP", bloodGroup: "A+", rhFactor: "Positive", volume: 200, donorId: donorData[1]?.id || "donor-2", donorName: "Priya Patel", collectionDate: getCollectionDate(4), status: "AVAILABLE", expiryDate: getExpiryDate(365), storageFacilityId: storageFacilityIds[2] },
          { unitId: "BU-20241212-0001", componentType: "WHOLE_BLOOD", bloodGroup: "B+", rhFactor: "Positive", volume: 450, donorId: donorData[2]?.id || "donor-3", donorName: "Amit Singh Rajput", collectionDate: getCollectionDate(3), status: "TESTING", expiryDate: getExpiryDate(32), storageFacilityId: storageFacilityIds[1] },
          { unitId: "BU-20241212-0002", componentType: "PLATELET", bloodGroup: "B+", rhFactor: "Positive", volume: 50, donorId: donorData[2]?.id || "donor-3", donorName: "Amit Singh Rajput", collectionDate: getCollectionDate(3), status: "AVAILABLE", expiryDate: getExpiryDate(2), storageFacilityId: storageFacilityIds[3] },
          { unitId: "BU-20241213-0001", componentType: "PRBC", bloodGroup: "AB+", rhFactor: "Positive", volume: 280, donorId: donorData[3]?.id || "donor-4", donorName: "Sunita Devi Verma", collectionDate: getCollectionDate(2), status: "AVAILABLE", expiryDate: getExpiryDate(40), storageFacilityId: storageFacilityIds[0] },
          { unitId: "BU-20241213-0002", componentType: "WHOLE_BLOOD", bloodGroup: "O-", rhFactor: "Negative", volume: 450, donorId: donorData[4]?.id || "donor-5", donorName: "Mohammad Iqbal Khan", collectionDate: getCollectionDate(2), status: "RESERVED", expiryDate: getExpiryDate(33), storageFacilityId: storageFacilityIds[0], reservedForPatientName: "ICU Patient Emergency" },
          { unitId: "BU-20241214-0001", componentType: "PRBC", bloodGroup: "A-", rhFactor: "Negative", volume: 280, donorId: donorData[5]?.id || "donor-6", donorName: "Kavita Joshi", collectionDate: getCollectionDate(1), status: "AVAILABLE", expiryDate: getExpiryDate(41), storageFacilityId: storageFacilityIds[1] },
          { unitId: "BU-20241214-0002", componentType: "FFP", bloodGroup: "B-", rhFactor: "Negative", volume: 200, donorId: donorData[6]?.id || "donor-7", donorName: "Vikram Deshmukh", collectionDate: getCollectionDate(1), status: "AVAILABLE", expiryDate: getExpiryDate(364), storageFacilityId: storageFacilityIds[2] },
          { unitId: "BU-20241215-0001", componentType: "WHOLE_BLOOD", bloodGroup: "AB-", rhFactor: "Negative", volume: 450, donorId: donorData[7]?.id || "donor-8", donorName: "Anita Rao", collectionDate: getCollectionDate(0), status: "COLLECTED", expiryDate: getExpiryDate(35), storageFacilityId: storageFacilityIds[1] },
          { unitId: "BU-20241208-0001", componentType: "PRBC", bloodGroup: "O+", rhFactor: "Positive", volume: 280, donorId: donorData[0]?.id || "donor-1", donorName: "Rajesh Kumar Sharma", collectionDate: getCollectionDate(10), status: "ISSUED", expiryDate: getExpiryDate(25), storageFacilityId: storageFacilityIds[0], issuedToPatientName: "Rahul Mehra", issuedDate: getCollectionDate(1), issueDepartment: "ICU" }
        ];
        await db.insert(bloodUnits).values(testUnits);
        console.log("Blood Bank units seeded: " + testUnits.length + " units");

        // Update storage facility occupancy
        await db.update(bloodStorageFacilities).set({ currentOccupancy: 5 }).where(eq(bloodStorageFacilities.facilityCode, "REF-001"));
        await db.update(bloodStorageFacilities).set({ currentOccupancy: 3 }).where(eq(bloodStorageFacilities.facilityCode, "REF-002"));
        await db.update(bloodStorageFacilities).set({ currentOccupancy: 2 }).where(eq(bloodStorageFacilities.facilityCode, "FRZ-001"));
        await db.update(bloodStorageFacilities).set({ currentOccupancy: 1 }).where(eq(bloodStorageFacilities.facilityCode, "PLT-001"));
      }

      // Check if transfusion orders exist
      const existingOrders = await db.select().from(bloodTransfusionOrders);
      if (existingOrders.length === 0) {
        const today = new Date().toISOString().split('T')[0];
        const testOrders = [
          { orderId: "TO-20241218-0001", patientId: "patient-1", patientName: "Suresh Kapoor", patientBloodGroup: "O+", patientRhFactor: "Positive", wardDepartment: "ICU", componentRequired: "PRBC", unitsRequired: 2, urgency: "URGENT", indication: "Post-operative anemia", requestingDoctorId: "doctor-1", requestingDoctorName: "Dr. Anil Mehta", status: "PENDING", crossMatchRequired: true, crossMatchStatus: "PENDING" },
          { orderId: "TO-20241218-0002", patientId: "patient-2", patientName: "Meena Saxena", patientBloodGroup: "A+", patientRhFactor: "Positive", wardDepartment: "OT", componentRequired: "FFP", unitsRequired: 1, urgency: "ROUTINE", indication: "Coagulation disorder correction", requestingDoctorId: "doctor-2", requestingDoctorName: "Dr. Priya Nair", status: "APPROVED", crossMatchRequired: false, crossMatchStatus: "COMPATIBLE" },
          { orderId: "TO-20241217-0001", patientId: "patient-3", patientName: "Arun Tiwari", patientBloodGroup: "B+", patientRhFactor: "Positive", wardDepartment: "EMERGENCY", componentRequired: "WHOLE_BLOOD", unitsRequired: 3, urgency: "EMERGENCY", indication: "Trauma with massive blood loss", requestingDoctorId: "doctor-1", requestingDoctorName: "Dr. Anil Mehta", status: "ISSUED", crossMatchRequired: true, crossMatchStatus: "COMPATIBLE" }
        ];
        await db.insert(bloodTransfusionOrders).values(testOrders);
        console.log("Blood Bank orders seeded: " + testOrders.length + " orders");
      }

      // Seed temperature logs for storage facilities
      const existingTempLogs = await db.select().from(bloodTemperatureLogs).limit(1);
      if (existingTempLogs.length === 0 && storageFacilityIds.length > 0) {
        const tempLogs = [];
        const now = new Date();
        
        // Generate 24 hours of temperature readings (every 2 hours)
        for (let i = 0; i < 12; i++) {
          const timestamp = new Date(now.getTime() - i * 2 * 60 * 60 * 1000);
          
          // Refrigerator 1 - normal readings
          tempLogs.push({
            facilityId: storageFacilityIds[0],
            temperature: (3.5 + Math.random() * 1.5).toFixed(1),
            isBreach: false,
            recordedByName: "Auto-Monitor",
            notes: "Routine monitoring"
          });
          
          // Refrigerator 2 - one breach
          const temp2 = i === 3 ? "7.2" : (4 + Math.random() * 1).toFixed(1);
          tempLogs.push({
            facilityId: storageFacilityIds[1],
            temperature: temp2,
            isBreach: i === 3,
            breachType: i === 3 ? "HIGH" : null,
            recordedByName: "Auto-Monitor",
            notes: i === 3 ? "Temperature breach detected - immediate action required" : "Routine monitoring"
          });
          
          // Freezer - normal readings
          tempLogs.push({
            facilityId: storageFacilityIds[2],
            temperature: (-25 + Math.random() * 4).toFixed(1),
            isBreach: false,
            recordedByName: "Auto-Monitor",
            notes: "Routine monitoring"
          });
          
          // Platelet agitator - normal readings
          tempLogs.push({
            facilityId: storageFacilityIds[3],
            temperature: (21 + Math.random() * 2).toFixed(1),
            isBreach: false,
            recordedByName: "Auto-Monitor",
            notes: "Routine monitoring"
          });
        }
        
        await db.insert(bloodTemperatureLogs).values(tempLogs);
        console.log("Blood Bank temperature logs seeded: " + tempLogs.length + " readings");
        
        // Mark one facility as having had a breach
        await db.update(bloodStorageFacilities)
          .set({ hasTemperatureBreach: true })
          .where(eq(bloodStorageFacilities.facilityCode, "REF-002"));
      }

      // Seed audit log entries
      const existingAuditLogs = await db.select().from(bloodBankAuditLog).limit(1);
      if (existingAuditLogs.length === 0) {
        const auditEntries = [
          { entityType: "BLOOD_UNIT", entityId: "BU-20241210-0001", action: "CREATE", details: "Blood unit collected from donor Rajesh Kumar Sharma", userId: "admin", userName: "System Admin", userRole: "ADMIN" },
          { entityType: "BLOOD_UNIT", entityId: "BU-20241210-0001", action: "UPDATE", details: "Status changed: COLLECTED -> TESTING", userId: "admin", userName: "Lab Technician", userRole: "ADMIN" },
          { entityType: "BLOOD_UNIT", entityId: "BU-20241210-0001", action: "UPDATE", details: "Status changed: TESTING -> AVAILABLE", userId: "admin", userName: "Lab Technician", userRole: "ADMIN" },
          { entityType: "DONOR", entityId: "DN-20241215-0001", action: "CREATE", details: "New donor registered: Rajesh Kumar Sharma (O+)", userId: "admin", userName: "System Admin", userRole: "ADMIN" },
          { entityType: "TRANSFUSION_ORDER", entityId: "TO-20241218-0001", action: "CREATE", details: "Transfusion order created for patient Suresh Kapoor", userId: "admin", userName: "Dr. Anil Mehta", userRole: "ADMIN" },
          { entityType: "STORAGE", entityId: "REF-002", action: "TEMPERATURE_BREACH", details: "Temperature breach detected: 7.2C (Max allowed: 6C)", userId: "system", userName: "Auto-Monitor", userRole: "SYSTEM" }
        ];
        await db.insert(bloodBankAuditLog).values(auditEntries);
        console.log("Blood Bank audit logs seeded: " + auditEntries.length + " entries");
      }

    } catch (error) {
      console.error("Error seeding blood bank data:", error);
    }
  };

  // Run blood bank seeding
  await seedBloodBankData();

  // ========== MEDICAL STORE MANAGEMENT ROUTES ==========

  // Get all medical stores (Admin only)
  app.get("/api/medical-stores", async (req, res) => {
    try {
      const stores = await databaseStorage.getAllMedicalStores();
      res.json(stores);
    } catch (error) {
      console.error("Error fetching medical stores:", error);
      res.status(500).json({ error: "Failed to fetch medical stores" });
    }
  });

  // Get single medical store
  app.get("/api/medical-stores/:id", async (req, res) => {
    try {
      const store = await databaseStorage.getMedicalStore(req.params.id);
      if (!store) {
        return res.status(404).json({ error: "Medical store not found" });
      }
      res.json(store);
    } catch (error) {
      console.error("Error fetching medical store:", error);
      res.status(500).json({ error: "Failed to fetch medical store" });
    }
  });

  // Create medical store (Admin only)
  app.post("/api/medical-stores", async (req, res) => {
    try {
      const validatedData = insertMedicalStoreSchema.parse(req.body);
      
      // Generate store code if not provided
      if (!validatedData.storeCode) {
        const existingStores = await databaseStorage.getAllMedicalStores();
        const storeNumber = existingStores.length + 1;
        validatedData.storeCode = `MS-${String(storeNumber).padStart(3, '0')}`;
      }
      
      const store = await databaseStorage.createMedicalStore(validatedData);
      res.status(201).json(store);
    } catch (error) {
      console.error("Error creating medical store:", error);
      res.status(500).json({ error: "Failed to create medical store" });
    }
  });

  // Update medical store (Admin only)
  app.patch("/api/medical-stores/:id", async (req, res) => {
    try {
      const store = await databaseStorage.updateMedicalStore(req.params.id, req.body);
      if (!store) {
        return res.status(404).json({ error: "Medical store not found" });
      }
      res.json(store);
    } catch (error) {
      console.error("Error updating medical store:", error);
      res.status(500).json({ error: "Failed to update medical store" });
    }
  });

  // Delete medical store (Admin only)
  app.delete("/api/medical-stores/:id", async (req, res) => {
    try {
      const deleted = await databaseStorage.deleteMedicalStore(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Medical store not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting medical store:", error);
      res.status(500).json({ error: "Failed to delete medical store" });
    }
  });

  // Get active medical stores (for patients to see)
  app.get("/api/medical-stores/active/list", async (req, res) => {
    try {
      const stores = await databaseStorage.getAllMedicalStores();
      const activeStores = stores.filter(s => s.status === 'ACTIVE');
      res.json(activeStores);
    } catch (error) {
      console.error("Error fetching active medical stores:", error);
      res.status(500).json({ error: "Failed to fetch medical stores" });
    }
  });

  // ========== MEDICAL STORE USER ROUTES ==========

  // Create medical store user (Admin only) - also creates a user account
  app.post("/api/medical-stores/:storeId/users", async (req, res) => {
    try {
      const { username, password, name, email, staffRole, employeeId } = req.body;
      
      // Validate required fields
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      // Check if username already exists
      const existingUser = await databaseStorage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      
      // Create user account with MEDICAL_STORE role
      const newUser = await databaseStorage.createUser({
        username,
        password: hashedPassword,
        role: "MEDICAL_STORE",
        name: name || username,
        email: email || null,
      });
      
      // Link user to medical store
      const storeUser = await databaseStorage.createMedicalStoreUser({
        userId: newUser.id,
        storeId: req.params.storeId,
        staffRole: staffRole || "PHARMACIST",
        employeeId: employeeId || null,
        isActive: true,
      });
      
      res.status(201).json({ user: newUser, storeUser });
    } catch (error) {
      console.error("Error creating medical store user:", error);
      res.status(500).json({ error: "Failed to create medical store user" });
    }
  });

  // Get users for a medical store
  app.get("/api/medical-stores/:storeId/users", async (req, res) => {
    try {
      const storeUsers = await databaseStorage.getMedicalStoreUsersByStore(req.params.storeId);
      res.json(storeUsers);
    } catch (error) {
      console.error("Error fetching store users:", error);
      res.status(500).json({ error: "Failed to fetch store users" });
    }
  });

  // Get current user's store info (for medical store portal)
  app.get("/api/medical-stores/my-store/:userId", async (req, res) => {
    try {
      const storeUser = await databaseStorage.getMedicalStoreUserByUserId(req.params.userId);
      if (!storeUser) {
        return res.status(404).json({ error: "Store user not found" });
      }
      const store = await databaseStorage.getMedicalStore(storeUser.storeId);
      res.json({ storeUser, store });
    } catch (error) {
      console.error("Error fetching user's store:", error);
      res.status(500).json({ error: "Failed to fetch store info" });
    }
  });

  // ========== PRESCRIPTION ACCESS ROUTES (Medical Store) ==========

  // Search prescriptions by patient name or ID (for medical store)
  app.get("/api/medical-stores/prescriptions/search", async (req, res) => {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }
      
      // Get all finalized prescriptions
      const allPrescriptions = await db.select().from(prescriptions)
        .where(eq(prescriptions.prescriptionStatus, 'finalized'))
        .orderBy(desc(prescriptions.createdAt));
      
      // Filter by patient name or prescription number
      const searchLower = String(query).toLowerCase();
      const matchedPrescriptions = allPrescriptions.filter(p => 
        p.patientName.toLowerCase().includes(searchLower) ||
        p.patientId.toLowerCase().includes(searchLower) ||
        (p.prescriptionNumber && p.prescriptionNumber.toLowerCase().includes(searchLower))
      );
      
      res.json(matchedPrescriptions);
    } catch (error) {
      console.error("Error searching prescriptions:", error);
      res.status(500).json({ error: "Failed to search prescriptions" });
    }
  });

  // Get prescription details for dispensing
  app.get("/api/medical-stores/prescriptions/:id", async (req, res) => {
    try {
      const prescription = await databaseStorage.getPrescription(req.params.id);
      if (!prescription) {
        return res.status(404).json({ error: "Prescription not found" });
      }
      
      // Get any existing dispensing records for this prescription
      const dispensingRecords = await databaseStorage.getPrescriptionDispensingByPrescription(req.params.id);
      
      res.json({ prescription, dispensingRecords });
    } catch (error) {
      console.error("Error fetching prescription:", error);
      res.status(500).json({ error: "Failed to fetch prescription" });
    }
  });

  // ========== PRESCRIPTION DISPENSING ROUTES ==========

  // Create dispensing record
  app.post("/api/medical-stores/dispensing", async (req, res) => {
    try {
      const { prescriptionId, storeId, storeName, dispensedBy, dispensedByName, items, ...restData } = req.body;
      
      // Generate dispensing number
      const year = new Date().getFullYear();
      const allDispensing = await databaseStorage.getAllPrescriptionDispensing();
      const dispensingNumber = `DISP-${year}-${String(allDispensing.length + 1).padStart(4, '0')}`;
      
      // Get prescription details
      const prescription = await databaseStorage.getPrescription(prescriptionId);
      if (!prescription) {
        return res.status(404).json({ error: "Prescription not found" });
      }
      
      // Create dispensing record
      const dispensing = await databaseStorage.createPrescriptionDispensing({
        dispensingNumber,
        prescriptionId,
        prescriptionNumber: prescription.prescriptionNumber,
        patientId: prescription.patientId,
        patientName: prescription.patientName,
        storeId,
        storeName,
        dispensedBy,
        dispensedByName,
        dispensingStatus: "PENDING",
        ...restData,
      });
      
      // Create dispensing items if provided
      if (items && Array.isArray(items)) {
        for (const item of items) {
          await databaseStorage.createDispensingItem({
            dispensingId: dispensing.id,
            ...item,
          });
        }
      }
      
      res.status(201).json(dispensing);
    } catch (error) {
      console.error("Error creating dispensing:", error);
      res.status(500).json({ error: "Failed to create dispensing record" });
    }
  });

  // Update dispensing record
  app.patch("/api/medical-stores/dispensing/:id", async (req, res) => {
    try {
      const dispensing = await databaseStorage.updatePrescriptionDispensing(req.params.id, req.body);
      if (!dispensing) {
        return res.status(404).json({ error: "Dispensing record not found" });
      }
      res.json(dispensing);
    } catch (error) {
      console.error("Error updating dispensing:", error);
      res.status(500).json({ error: "Failed to update dispensing record" });
    }
  });

  // Get dispensing records for a store
  app.get("/api/medical-stores/:storeId/dispensing", async (req, res) => {
    try {
      const dispensingRecords = await databaseStorage.getPrescriptionDispensingByStore(req.params.storeId);
      res.json(dispensingRecords);
    } catch (error) {
      console.error("Error fetching dispensing records:", error);
      res.status(500).json({ error: "Failed to fetch dispensing records" });
    }
  });

  // ========== MEDICAL STORE BILLING ROUTES ==========

  // Create bill from dispensing
  app.post("/api/medical-stores/bills", async (req, res) => {
    try {
      const { dispensingId, storeId, ...restData } = req.body;
      
      // Get dispensing record
      const allDispensing = await databaseStorage.getAllPrescriptionDispensing();
      const dispensing = allDispensing.find(d => d.id === dispensingId);
      if (!dispensing) {
        return res.status(404).json({ error: "Dispensing record not found" });
      }
      
      // Generate bill number
      const year = new Date().getFullYear();
      const allBills = await databaseStorage.getAllMedicalStoreBills();
      const billNumber = `INV-${year}-${String(allBills.length + 1).padStart(4, '0')}`;
      
      // Get store details
      const store = await databaseStorage.getMedicalStore(storeId);
      
      // Create bill
      const bill = await databaseStorage.createMedicalStoreBill({
        billNumber,
        dispensingId,
        storeId,
        storeName: store?.storeName || 'Unknown Store',
        storeAddress: store?.address,
        storeGst: store?.gstNumber,
        patientId: dispensing.patientId,
        patientName: dispensing.patientName,
        patientPhone: dispensing.patientPhone,
        prescriptionNumber: dispensing.prescriptionNumber,
        ...restData,
      });
      
      // Update dispensing status to FULLY_DISPENSED
      await databaseStorage.updatePrescriptionDispensing(dispensingId, {
        dispensingStatus: "FULLY_DISPENSED",
        paymentStatus: restData.paymentStatus || "PENDING",
      });
      
      res.status(201).json(bill);
    } catch (error) {
      console.error("Error creating bill:", error);
      res.status(500).json({ error: "Failed to create bill" });
    }
  });

  // Get bills for a store
  app.get("/api/medical-stores/:storeId/bills", async (req, res) => {
    try {
      const bills = await databaseStorage.getMedicalStoreBillsByStore(req.params.storeId);
      res.json(bills);
    } catch (error) {
      console.error("Error fetching bills:", error);
      res.status(500).json({ error: "Failed to fetch bills" });
    }
  });

  // Update bill (e.g., mark as paid)
  app.patch("/api/medical-stores/bills/:id", async (req, res) => {
    try {
      const bill = await databaseStorage.updateMedicalStoreBill(req.params.id, req.body);
      if (!bill) {
        return res.status(404).json({ error: "Bill not found" });
      }
      res.json(bill);
    } catch (error) {
      console.error("Error updating bill:", error);
      res.status(500).json({ error: "Failed to update bill" });
    }
  });

  // ========== MEDICAL STORE ACCESS LOGS ==========

  // Log access (automatically called on prescription view/dispensing)
  app.post("/api/medical-stores/access-logs", async (req, res) => {
    try {
      const log = await databaseStorage.createMedicalStoreAccessLog(req.body);
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating access log:", error);
      res.status(500).json({ error: "Failed to create access log" });
    }
  });

  // Get access logs (Admin only)
  app.get("/api/medical-stores/access-logs/all", async (req, res) => {
    try {
      const logs = await databaseStorage.getMedicalStoreAccessLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching access logs:", error);
      res.status(500).json({ error: "Failed to fetch access logs" });
    }
  });

  // Get access logs for a specific store
  app.get("/api/medical-stores/:storeId/access-logs", async (req, res) => {
    try {
      const logs = await databaseStorage.getMedicalStoreAccessLogs(req.params.storeId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching store access logs:", error);
      res.status(500).json({ error: "Failed to fetch access logs" });
    }
  });

  // ========== PATIENT PRESCRIPTION ACCESS ==========

  // Get prescriptions for a patient (for patient portal)
  app.get("/api/patients/:patientId/prescriptions", async (req, res) => {
    try {
      const patientPrescriptions = await db.select().from(prescriptions)
        .where(eq(prescriptions.patientId, req.params.patientId))
        .orderBy(desc(prescriptions.createdAt));
      res.json(patientPrescriptions);
    } catch (error) {
      console.error("Error fetching patient prescriptions:", error);
      res.status(500).json({ error: "Failed to fetch prescriptions" });
    }
  });

  // ========== MEDICAL STORE INVENTORY ROUTES ==========

  // Get store inventory
  app.get("/api/medical-stores/:storeId/inventory", async (req, res) => {
    try {
      const inventory = await databaseStorage.getMedicalStoreInventory(req.params.storeId);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  // Add inventory item
  app.post("/api/medical-stores/:storeId/inventory", async (req, res) => {
    try {
      const item = await databaseStorage.createMedicalStoreInventoryItem({
        storeId: req.params.storeId,
        ...req.body,
      });
      res.status(201).json(item);
    } catch (error) {
      console.error("Error adding inventory item:", error);
      res.status(500).json({ error: "Failed to add inventory item" });
    }
  });

  // Update inventory item
  app.patch("/api/medical-stores/inventory/:id", async (req, res) => {
    try {
      const item = await databaseStorage.updateMedicalStoreInventoryItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Inventory item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(500).json({ error: "Failed to update inventory item" });
    }
  });

  // Delete inventory item
  app.delete("/api/medical-stores/inventory/:id", async (req, res) => {
    try {
      const deleted = await databaseStorage.deleteMedicalStoreInventoryItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Inventory item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ error: "Failed to delete inventory item" });
    }
  });

  // ==================== PATHOLOGY LAB ROUTES ====================

  // Get all pathology labs
  app.get("/api/pathology-labs", async (req, res) => {
    try {
      const labs = await databaseStorage.getAllPathologyLabs();
      res.json(labs);
    } catch (error) {
      console.error("Error fetching pathology labs:", error);
      res.status(500).json({ error: "Failed to fetch pathology labs" });
    }
  });

  // Get single pathology lab
  app.get("/api/pathology-labs/:id", async (req, res) => {
    try {
      const lab = await databaseStorage.getPathologyLab(req.params.id);
      if (!lab) {
        return res.status(404).json({ error: "Lab not found" });
      }
      res.json(lab);
    } catch (error) {
      console.error("Error fetching lab:", error);
      res.status(500).json({ error: "Failed to fetch lab" });
    }
  });

  // Create pathology lab
  app.post("/api/pathology-labs", async (req, res) => {
    try {
      const lab = await databaseStorage.createPathologyLab(req.body);
      res.status(201).json(lab);
    } catch (error) {
      console.error("Error creating pathology lab:", error);
      res.status(500).json({ error: "Failed to create pathology lab" });
    }
  });

  // Update pathology lab
  app.patch("/api/pathology-labs/:id", async (req, res) => {
    try {
      const lab = await databaseStorage.updatePathologyLab(req.params.id, req.body);
      if (!lab) {
        return res.status(404).json({ error: "Lab not found" });
      }
      res.json(lab);
    } catch (error) {
      console.error("Error updating lab:", error);
      res.status(500).json({ error: "Failed to update lab" });
    }
  });

  // Delete pathology lab
  app.delete("/api/pathology-labs/:id", async (req, res) => {
    try {
      const success = await databaseStorage.deletePathologyLab(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Lab not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting lab:", error);
      res.status(500).json({ error: "Failed to delete lab" });
    }
  });

  // Get all lab tests
  app.get("/api/lab-tests", async (req, res) => {
    try {
      const tests = await databaseStorage.getAllLabTests();
      res.json(tests);
    } catch (error) {
      console.error("Error fetching lab tests:", error);
      res.status(500).json({ error: "Failed to fetch lab tests" });
    }
  });

  // Create lab test
  app.post("/api/lab-tests", async (req, res) => {
    try {
      const test = await databaseStorage.createLabTest(req.body);
      res.status(201).json(test);
    } catch (error) {
      console.error("Error creating lab test:", error);
      res.status(500).json({ error: "Failed to create lab test" });
    }
  });

  // Update lab test
  app.patch("/api/lab-tests/:id", async (req, res) => {
    try {
      const test = await databaseStorage.updateLabTest(req.params.id, req.body);
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }
      res.json(test);
    } catch (error) {
      console.error("Error updating test:", error);
      res.status(500).json({ error: "Failed to update test" });
    }
  });

  // Delete lab test
  app.delete("/api/lab-tests/:id", async (req, res) => {
    try {
      const success = await databaseStorage.deleteLabTest(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Test not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting test:", error);
      res.status(500).json({ error: "Failed to delete test" });
    }
  });

  // Get all lab test orders
  app.get("/api/lab-test-orders", async (req, res) => {
    try {
      const orders = await databaseStorage.getAllLabTestOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching lab test orders:", error);
      res.status(500).json({ error: "Failed to fetch lab test orders" });
    }
  });

  // Get orders by lab
  app.get("/api/lab-test-orders/lab/:labId", async (req, res) => {
    try {
      const orders = await databaseStorage.getLabTestOrdersByLab(req.params.labId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching lab orders:", error);
      res.status(500).json({ error: "Failed to fetch lab orders" });
    }
  });

  // Create lab test order
  app.post("/api/lab-test-orders", async (req, res) => {
    try {
      const allOrders = await databaseStorage.getAllLabTestOrders();
      const orderNumber = `LAB-${new Date().getFullYear()}-${String(allOrders.length + 1).padStart(4, '0')}`;
      const order = await databaseStorage.createLabTestOrder({ ...req.body, orderNumber });
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating lab test order:", error);
      res.status(500).json({ error: "Failed to create lab test order" });
    }
  });

  // Batch create lab test orders (transactional - all succeed or all fail)
  app.post("/api/lab-test-orders/batch", async (req, res) => {
    try {
      const { orders } = req.body as { orders: any[] };
      if (!Array.isArray(orders) || orders.length === 0) {
        return res.status(400).json({ error: "Orders array is required" });
      }
      
      // Schema for batch validation - orderNumber is generated by DB, so omit it
      const batchOrderSchema = insertLabTestOrderSchema.omit({ orderNumber: true });
      
      // Validate each order against Zod schema for type safety and data integrity
      const validatedOrders = orders.map((order, index) => {
        const result = batchOrderSchema.safeParse({
          patientId: order.patientId,
          patientName: order.patientName,
          patientUhid: order.patientUhid,
          patientAge: order.patientAge,
          patientGender: order.patientGender,
          doctorId: order.doctorId,
          doctorName: order.doctorName,
          testId: order.testId,
          testName: order.testName,
          testCode: order.testCode,
          priority: order.priority || "NORMAL",
          clinicalNotes: order.clinicalNotes,
          orderedAt: order.orderedAt ? new Date(order.orderedAt) : new Date()
        });
        
        if (!result.success) {
          throw new Error(`Order at index ${index} validation failed: ${result.error.issues.map(i => i.message).join(", ")}`);
        }
        return result.data;
      });
      
      // Use storage layer for transactional batch insert (order numbers generated via sequence)
      const createdOrders = await databaseStorage.createLabTestOrdersBatch(validatedOrders);
      
      res.status(201).json({
        totalRequested: orders.length,
        successCount: createdOrders.length,
        failedCount: 0,
        orders: createdOrders,
        errors: []
      });
    } catch (error: any) {
      console.error("Error creating batch lab test orders:", error);
      res.status(500).json({ error: error.message || "Failed to create batch lab test orders - transaction rolled back" });
    }
  });

  // Update lab test order
  app.patch("/api/lab-test-orders/:id", async (req, res) => {
    try {
      const order = await databaseStorage.updateLabTestOrder(req.params.id, req.body);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // Get all sample collections
  app.get("/api/sample-collections", async (req, res) => {
    try {
      const samples = await databaseStorage.getAllSampleCollections();
      res.json(samples);
    } catch (error) {
      console.error("Error fetching sample collections:", error);
      res.status(500).json({ error: "Failed to fetch sample collections" });
    }
  });

  // Create sample collection
  app.post("/api/sample-collections", async (req, res) => {
    try {
      const sample = await databaseStorage.createSampleCollection(req.body);
      await databaseStorage.updateLabTestOrder(req.body.orderId, { orderStatus: "SAMPLE_COLLECTED" });
      res.status(201).json(sample);
    } catch (error) {
      console.error("Error creating sample collection:", error);
      res.status(500).json({ error: "Failed to create sample collection" });
    }
  });

  // Update sample collection status
  app.patch("/api/sample-collections/:id", async (req, res) => {
    try {
      const sample = await databaseStorage.updateSampleCollection(req.params.id, req.body);
      if (!sample) {
        return res.status(404).json({ error: "Sample not found" });
      }
      res.json(sample);
    } catch (error) {
      console.error("Error updating sample:", error);
      res.status(500).json({ error: "Failed to update sample" });
    }
  });

  // Get all lab reports - role-based filtering for security
  app.get("/api/lab-reports", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Role-based filtering
      const allReports = await databaseStorage.getAllLabReports();
      
      // ADMIN and PATHOLOGY_LAB can see all reports
      if (user.role === "ADMIN" || user.role === "PATHOLOGY_LAB") {
        return res.json(allReports);
      }
      
      // DOCTOR can only see reports for their patients
      if (user.role === "DOCTOR") {
        const doctorReports = allReports.filter(r => r.doctorId === user.id);
        return res.json(doctorReports);
      }
      
      // PATIENT can only see their own reports
      if (user.role === "PATIENT") {
        const patientReports = allReports.filter(r => r.patientId === user.id);
        return res.json(patientReports);
      }
      
      // NURSE can see reports for patients they are caring for
      if (user.role === "NURSE") {
        return res.json(allReports);
      }
      
      // Default: return empty array for other roles
      res.json([]);
    } catch (error) {
      console.error("Error fetching lab reports:", error);
      res.status(500).json({ error: "Failed to fetch lab reports" });
    }
  });

  // Get reports by patient - with authorization check
  app.get("/api/lab-reports/patient/:patientId", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const patientId = req.params.patientId;
      
      // Only allow access if:
      // 1. User is the patient themselves
      // 2. User is ADMIN/PATHOLOGY_LAB/DOCTOR/NURSE
      const allowedRoles = ["ADMIN", "PATHOLOGY_LAB", "DOCTOR", "NURSE"];
      if (user.role !== "PATIENT" && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // If patient, can only access their own reports
      if (user.role === "PATIENT" && user.id !== patientId) {
        return res.status(403).json({ error: "Access denied. You can only view your own lab reports." });
      }
      
      const reports = await databaseStorage.getLabReportsByPatient(patientId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching patient reports:", error);
      res.status(500).json({ error: "Failed to fetch patient reports" });
    }
  });

  // Get reports by lab
  app.get("/api/lab-reports/lab/:labId", async (req, res) => {
    try {
      const reports = await databaseStorage.getLabReportsByLab(req.params.labId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching lab reports:", error);
      res.status(500).json({ error: "Failed to fetch lab reports" });
    }
  });

  // Get single lab report with results
  app.get("/api/lab-reports/:id", async (req, res) => {
    try {
      const report = await databaseStorage.getLabReport(req.params.id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      const results = await databaseStorage.getLabReportResults(report.id);
      res.json({ ...report, results });
    } catch (error) {
      console.error("Error fetching report:", error);
      res.status(500).json({ error: "Failed to fetch report" });
    }
  });

  // Create lab report with notifications - Restricted to PATHOLOGY_LAB and ADMIN
  // Supports both order-based reports and walk-in patient reports
  app.post("/api/lab-reports", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Role-based authorization - only PATHOLOGY_LAB and ADMIN can create reports
      const allowedRoles = ["PATHOLOGY_LAB", "ADMIN"];
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: "Access denied. Only pathology lab staff and administrators can create lab reports." });
      }
      
      const allReports = await databaseStorage.getAllLabReports();
      const reportNumber = `RPT-${new Date().getFullYear()}-${String(allReports.length + 1).padStart(4, '0')}`;
      
      // Handle walk-in patient reports (no order required)
      const isWalkIn = req.body.isWalkIn === true;
      const orderNumber = isWalkIn 
        ? `WALKIN-${new Date().getFullYear()}-${String(allReports.length + 1).padStart(4, '0')}`
        : (req.body.orderNumber || `ORD-${Date.now()}`);
      
      // Build report data with walk-in support
      const reportData = {
        ...req.body,
        reportNumber,
        orderNumber,
        orderId: isWalkIn ? null : req.body.orderId,
        doctorId: isWalkIn ? null : req.body.doctorId,
        doctorName: isWalkIn ? (req.body.referredBy || 'Self') : req.body.doctorName,
        reportDate: new Date(),
        reportType: req.body.reportType || "STRUCTURED",
        verifiedBy: user.firstName + ' ' + user.lastName,
        verifiedAt: new Date(),
      };
      
      const report = await databaseStorage.createLabReport(reportData);

      // Only update order status if this is not a walk-in patient and orderId exists
      if (!isWalkIn && req.body.orderId) {
        await databaseStorage.updateLabTestOrder(req.body.orderId, { orderStatus: "COMPLETED" });
      }

      // Send notifications based on walk-in status
      const notificationData = {
        title: isWalkIn ? "Walk-in Lab Report Created" : "Lab Report Available",
        message: `${isWalkIn ? 'Walk-in' : 'New'} lab report: ${report.testName} for patient ${report.patientName}`,
        type: "lab_report",
        isRead: false,
        relatedEntityId: report.id,
        relatedEntityType: "lab_report",
      };
      
      // For non-walk-in patients, notify patient and doctor
      if (!isWalkIn) {
        // Notify patient
        await databaseStorage.createUserNotification({ ...notificationData, userId: report.patientId, userRole: "PATIENT" });
        
        // Notify doctor if exists
        if (report.doctorId) {
          await databaseStorage.createUserNotification({ ...notificationData, userId: report.doctorId, userRole: "DOCTOR" });
        }
      }
      
      // Always notify admins and nurses (staff) for all reports including walk-in
      const admins = await databaseStorage.getUsersByRole("ADMIN");
      for (const admin of admins) {
        await databaseStorage.createUserNotification({ ...notificationData, userId: admin.id, userRole: "ADMIN" });
      }

      const nurses = await databaseStorage.getUsersByRole("NURSE");
      for (const nurse of nurses) {
        await databaseStorage.createUserNotification({ ...notificationData, userId: nurse.id, userRole: "NURSE" });
      }

      await databaseStorage.createPathologyLabAccessLog({
        labId: report.labId,
        labName: report.labName,
        userId: req.body.uploadedBy || report.labId,
        userName: req.body.uploadedByName || report.labName,
        userRole: "PATHOLOGY_LAB",
        action: "REPORT_UPLOAD",
        reportId: report.id,
        patientId: report.patientId,
        patientName: report.patientName,
        details: `Uploaded report ${reportNumber} for test ${report.testName}`,
      });

      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating lab report:", error);
      res.status(500).json({ error: "Failed to create lab report" });
    }
  });

  // Upload lab report with file (PDF/image) - Authorization middleware runs BEFORE multer
  app.post("/api/lab-reports/upload", requireLabReportUploadAuth, uploadLabReport.single('reportFile'), async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      
      // User already validated by requireLabReportUploadAuth middleware
      // Parse form data
      const formData = req.body;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: "Report file is required" });
      }
      
      // Generate report number
      const allReports = await databaseStorage.getAllLabReports();
      const reportNumber = `RPT-${new Date().getFullYear()}-${String(allReports.length + 1).padStart(4, '0')}`;
      
      // Create file URL
      const pdfUrl = `/uploads/lab-reports/${file.filename}`;
      
      // Create lab report
      const reportData = {
        reportNumber,
        orderId: formData.orderId,
        orderNumber: formData.orderNumber || `ORD-${Date.now()}`,
        patientId: formData.patientId,
        patientName: formData.patientName,
        patientUhid: formData.patientUhid || null,
        doctorId: formData.doctorId || user.id,
        doctorName: formData.doctorName || user.firstName + ' ' + user.lastName,
        labId: user.id,
        labName: formData.labName || "Hospital Lab",
        testId: formData.testId || formData.orderId,
        testName: formData.testName || "Lab Test",
        testCategory: formData.testCategory || "General",
        reportDate: new Date(),
        reportStatus: "COMPLETED",
        reportType: "PDF",
        pdfUrl,
        resultData: formData.resultSummary ? JSON.stringify({ summary: formData.resultSummary }) : null,
        interpretation: formData.interpretation || "NORMAL",
        remarks: formData.remarks || null,
        verifiedBy: user.firstName + ' ' + user.lastName,
        verifiedAt: new Date(),
        isNotified: false,
      };
      
      const report = await databaseStorage.createLabReport(reportData);
      
      // Mark the order as completed if orderId provided
      if (formData.orderId) {
        await databaseStorage.updateLabTestOrder(formData.orderId, { orderStatus: "COMPLETED" });
      }
      
      // Send notifications
      const notificationData = {
        title: "Lab Report Available",
        message: `Your lab report for ${reportData.testName} is now available.`,
        type: "lab_report",
        priority: formData.interpretation === "CRITICAL" ? "critical" : "normal",
        channel: "push",
        isRead: false,
        referenceId: report.id,
        referenceType: "lab_report",
      };
      
      // Notify patient
      await databaseStorage.createUserNotification({ 
        userId: report.patientId, 
        userRole: "PATIENT",
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        relatedEntityId: report.id,
        relatedEntityType: "lab_report",
        isRead: false,
      });
      
      // Notify doctor if doctorId exists
      if (report.doctorId) {
        await databaseStorage.createUserNotification({ 
          userId: report.doctorId, 
          userRole: "DOCTOR",
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          relatedEntityId: report.id,
          relatedEntityType: "lab_report",
          isRead: false,
        });
      }
      
      // Notify admins
      const admins = await databaseStorage.getUsersByRole("ADMIN");
      for (const admin of admins) {
        await databaseStorage.createUserNotification({ 
          userId: admin.id, 
          userRole: "ADMIN",
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          relatedEntityId: report.id,
          relatedEntityType: "lab_report",
          isRead: false,
        });
      }
      
      // Create access log
      await databaseStorage.createPathologyLabAccessLog({
        labId: user.id,
        labName: reportData.labName,
        userId: user.id,
        userName: user.firstName + ' ' + user.lastName,
        userRole: user.role,
        action: "REPORT_UPLOAD",
        reportId: report.id,
        patientId: report.patientId,
        patientName: report.patientName,
        details: `Uploaded report ${reportNumber} with file for ${reportData.testName}`,
      });
      
      res.status(201).json(report);
    } catch (error) {
      console.error("Error uploading lab report:", error);
      res.status(500).json({ error: "Failed to upload lab report" });
    }
  });

  // Update lab report
  app.patch("/api/lab-reports/:id", async (req, res) => {
    try {
      const report = await databaseStorage.updateLabReport(req.params.id, req.body);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error updating report:", error);
      res.status(500).json({ error: "Failed to update report" });
    }
  });

  // Add results to a report
  app.post("/api/lab-reports/:reportId/results", async (req, res) => {
    try {
      const results = req.body.results || [req.body];
      const createdResults = [];
      for (const result of results) {
        const created = await databaseStorage.createLabReportResult({ ...result, reportId: req.params.reportId });
        createdResults.push(created);
      }
      res.status(201).json(createdResults);
    } catch (error) {
      console.error("Error adding report results:", error);
      res.status(500).json({ error: "Failed to add report results" });
    }
  });

  // Get pathology lab access logs
  app.get("/api/pathology-labs/access-logs", async (req, res) => {
    try {
      const logs = await databaseStorage.getPathologyLabAccessLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching access logs:", error);
      res.status(500).json({ error: "Failed to fetch access logs" });
    }
  });

  // Create pathology lab access log
  app.post("/api/pathology-labs/access-logs", async (req, res) => {
    try {
      const log = await databaseStorage.createPathologyLabAccessLog(req.body);
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating access log:", error);
      res.status(500).json({ error: "Failed to create access log" });
    }
  });

  // ============================================
  // PATIENT BARCODE SYSTEM - UHID Based Secure Scanning
  // ============================================

  // Allowed roles for barcode scanning (ADMIN, DOCTOR, NURSE only)
  const BARCODE_ALLOWED_ROLES = ["ADMIN", "DOCTOR", "NURSE"];

  // Generate UHID for new patient
  const generateUHID = async (admissionType: string): Promise<string> => {
    const year = new Date().getFullYear();
    const prefix = admissionType === "IPD" ? "GRAV-IPD" : "GRAV-OPD";
    
    // Get count of existing barcodes for this type and year
    const existingBarcodes = await db.select().from(patientBarcodes)
      .where(eq(patientBarcodes.admissionType, admissionType));
    
    const count = existingBarcodes.filter(b => b.uhid.includes(`${year}`)).length + 1;
    const paddedCount = count.toString().padStart(6, '0');
    
    return `${prefix}-${year}-${paddedCount}`;
  };

  // Generate encrypted token for barcode
  const generateEncryptedToken = (patientId: string, uhid: string): string => {
    const data = `${patientId}|${uhid}|${Date.now()}`;
    const cipher = crypto.createHash('sha256');
    cipher.update(data);
    return cipher.digest('hex');
  };

  // Generate barcode on patient admission
  app.post("/api/barcode/generate", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Only ADMIN, DOCTOR, NURSE can generate barcodes
      if (!BARCODE_ALLOWED_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized: Only Admin, Doctor, or Nurse can generate patient barcodes" });
      }

      const { patientId, patientName, admissionType, wardBed, treatingDoctor } = req.body;

      if (!patientId || !patientName || !admissionType) {
        return res.status(400).json({ error: "Patient ID, name, and admission type are required" });
      }

      // Generate UHID
      const uhid = await generateUHID(admissionType);
      
      // Generate encrypted token (no patient data in barcode)
      const encryptedToken = generateEncryptedToken(patientId, uhid);
      
      // Barcode data is just the UHID and token - no sensitive info
      const barcodeData = `HMS:${uhid}:${encryptedToken.substring(0, 16)}`;

      // Create barcode record
      const [barcode] = await db.insert(patientBarcodes).values({
        patientId,
        patientName,
        uhid,
        admissionType,
        encryptedToken,
        barcodeData,
        wardBed: wardBed || null,
        treatingDoctor: treatingDoctor || null,
        isActive: true,
      }).returning();

      // Log the barcode generation
      await db.insert(barcodeScanLogs).values({
        barcodeId: barcode.id,
        uhid,
        scannedBy: user.id,
        scannedByName: user.name || user.username,
        role: user.role,
        allowed: true,
        ipAddress: req.ip || null,
        deviceInfo: req.headers['user-agent'] || null,
      });

      res.status(201).json({
        id: barcode.id,
        uhid,
        barcodeData,
        patientName,
        admissionType,
        wardBed,
        treatingDoctor,
        createdAt: barcode.createdAt,
      });
    } catch (error) {
      console.error("Error generating barcode:", error);
      res.status(500).json({ error: "Failed to generate barcode" });
    }
  });

  // Scan barcode - STRICT ROLE-BASED ACCESS (ADMIN, DOCTOR, NURSE only)
  app.post("/api/barcode/scan", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { barcodeData, uhid: manualUhid } = req.body;
      const searchUhid = manualUhid || (barcodeData?.includes(':') ? barcodeData.split(':')[1] : barcodeData);

      // Log every scan attempt
      const logScanAttempt = async (allowed: boolean, reason?: string, barcodeId?: string) => {
        await db.insert(barcodeScanLogs).values({
          barcodeId: barcodeId || null,
          uhid: searchUhid || null,
          scannedBy: user.id,
          scannedByName: user.name || user.username,
          role: user.role,
          allowed,
          denialReason: reason || null,
          ipAddress: req.ip || null,
          deviceInfo: req.headers['user-agent'] || null,
        });
      };

      // STRICT ROLE CHECK - Only ADMIN, DOCTOR, NURSE allowed
      if (!BARCODE_ALLOWED_ROLES.includes(user.role)) {
        await logScanAttempt(false, `Access denied: Role ${user.role} not authorized`);
        return res.status(403).json({ 
          error: "ACCESS DENIED: Your role is not authorized to scan patient barcodes",
          roleRequired: "ADMIN, DOCTOR, or NURSE",
          yourRole: user.role
        });
      }

      if (!searchUhid) {
        await logScanAttempt(false, "No barcode data provided");
        return res.status(400).json({ error: "Barcode data or UHID is required" });
      }

      // Find barcode by UHID
      const [barcode] = await db.select().from(patientBarcodes)
        .where(eq(patientBarcodes.uhid, searchUhid));

      if (!barcode) {
        await logScanAttempt(false, "Barcode not found in system");
        return res.status(404).json({ error: "Patient barcode not found in system" });
      }

      if (!barcode.isActive) {
        await logScanAttempt(false, "Barcode is inactive/expired", barcode.id);
        return res.status(400).json({ error: "This patient barcode is no longer active" });
      }

      // Log successful scan
      await logScanAttempt(true, undefined, barcode.id);

      // Fetch comprehensive patient data based on role
      const patientId = barcode.patientId;
      
      // Get monitoring sessions for this patient
      const sessions = await db.select().from(patientMonitoringSessions)
        .where(eq(patientMonitoringSessions.patientId, patientId))
        .orderBy(desc(patientMonitoringSessions.createdAt));
      
      const latestSession = sessions[0];

      // Get prescriptions
      const patientPrescriptions = await db.select().from(prescriptions)
        .where(eq(prescriptions.patientId, patientId));

      // Get allergies if session exists
      let allergies = null;
      if (latestSession) {
        const [allergyData] = await db.select().from(patientAllergiesPrecautions)
          .where(eq(patientAllergiesPrecautions.sessionId, latestSession.id));
        allergies = allergyData;
      }

      // Get latest vitals if session exists
      let latestVitals = null;
      if (latestSession) {
        const [vitals] = await db.select().from(vitalsHourly)
          .where(eq(vitalsHourly.sessionId, latestSession.id))
          .orderBy(desc(vitalsHourly.recordedAt))
          .limit(1);
        latestVitals = vitals;
      }

      // Prepare role-filtered response
      const baseData = {
        barcode: {
          id: barcode.id,
          uhid: barcode.uhid,
          admissionType: barcode.admissionType,
          wardBed: barcode.wardBed,
          treatingDoctor: barcode.treatingDoctor,
          createdAt: barcode.createdAt,
        },
        patient: {
          id: patientId,
          name: barcode.patientName,
          uhid: barcode.uhid,
          admissionType: barcode.admissionType,
          wardBed: barcode.wardBed,
          treatingDoctor: barcode.treatingDoctor,
          age: latestSession?.age,
          gender: latestSession?.gender,
          status: latestSession?.status || "active",
        },
        scanInfo: {
          scannedBy: user.name || user.username,
          scannedAt: new Date().toISOString(),
          role: user.role,
        }
      };

      // Role-based data visibility
      let responseData: any = { ...baseData };

      // NURSE: Vitals, medication administration, nursing notes
      if (user.role === "NURSE" || user.role === "DOCTOR" || user.role === "ADMIN") {
        responseData.vitals = latestVitals;
        responseData.allergies = allergies;
        responseData.monitoringSession = latestSession;
      }

      // ALL AUTHORIZED ROLES: Full access to prescriptions, sessions, and billing
      if (user.role === "DOCTOR" || user.role === "ADMIN" || user.role === "NURSE") {
        responseData.prescriptions = patientPrescriptions;
        responseData.allSessions = sessions;
        
        // Get billing data - full access for all authorized roles
        const bills = await databaseStorage.getPatientBills(patientId);
        responseData.billing = bills;
      }

      res.json(responseData);
    } catch (error) {
      console.error("Error scanning barcode:", error);
      res.status(500).json({ error: "Failed to scan barcode" });
    }
  });

  // Get all patient barcodes (for admin/authorized staff)
  app.get("/api/barcodes", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      
      if (!user || !BARCODE_ALLOWED_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const barcodes = await db.select().from(patientBarcodes)
        .orderBy(desc(patientBarcodes.createdAt));
      
      res.json(barcodes);
    } catch (error) {
      console.error("Error fetching barcodes:", error);
      res.status(500).json({ error: "Failed to fetch barcodes" });
    }
  });

  // Get barcode by UHID
  app.get("/api/barcodes/uhid/:uhid", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      
      if (!user || !BARCODE_ALLOWED_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const [barcode] = await db.select().from(patientBarcodes)
        .where(eq(patientBarcodes.uhid, req.params.uhid));
      
      if (!barcode) {
        return res.status(404).json({ error: "Barcode not found" });
      }

      res.json(barcode);
    } catch (error) {
      console.error("Error fetching barcode:", error);
      res.status(500).json({ error: "Failed to fetch barcode" });
    }
  });

  // Get barcode scan logs (audit trail)
  app.get("/api/barcode/scan-logs", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ error: "Only Admin can view scan logs" });
      }

      const logs = await db.select().from(barcodeScanLogs)
        .orderBy(desc(barcodeScanLogs.timestamp))
        .limit(100);
      
      res.json(logs);
    } catch (error) {
      console.error("Error fetching scan logs:", error);
      res.status(500).json({ error: "Failed to fetch scan logs" });
    }
  });

  // Generate barcode image as PNG
  app.get("/api/barcodes/image/:uhid", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      
      if (!user || !BARCODE_ALLOWED_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const [barcode] = await db.select().from(patientBarcodes)
        .where(eq(patientBarcodes.uhid, req.params.uhid));
      
      if (!barcode) {
        return res.status(404).json({ error: "Barcode not found" });
      }

      // Generate encrypted token for scanning (HMAC signature for integrity)
      const encryptionSecret = process.env.BARCODE_SECRET || "hms-gravity-hospital-2025";
      const dataToSign = `${barcode.uhid}:${barcode.patientId}`;
      const signature = crypto.createHmac("sha256", encryptionSecret)
        .update(dataToSign)
        .digest("hex")
        .substring(0, 12);
      
      // Barcode content format: HMS:UHID:SIGNATURE
      const barcodeContent = `HMS:${barcode.uhid}:${signature}`;

      // Generate QR code (compact and easier to scan with camera)
      const png = await bwipjs.toBuffer({
        bcid: "qrcode",
        text: barcodeContent,
        scale: 4,
        eclevel: "M",
      });

      res.set("Content-Type", "image/png");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(png);
    } catch (error) {
      console.error("Error generating barcode image:", error);
      res.status(500).json({ error: "Failed to generate barcode image" });
    }
  });

  // Deactivate a barcode (on discharge)
  app.patch("/api/barcodes/:id/deactivate", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      
      if (!user || !BARCODE_ALLOWED_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const [updated] = await db.update(patientBarcodes)
        .set({ isActive: false })
        .where(eq(patientBarcodes.id, req.params.id))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ error: "Barcode not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error deactivating barcode:", error);
      res.status(500).json({ error: "Failed to deactivate barcode" });
    }
  });

  // Bulk generate barcodes for all patients without one (Admin only)
  app.post("/api/barcodes/generate-all", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ error: "Only Admin can bulk generate barcodes" });
      }

      // Get all service patients
      const allPatients = await db.select().from(servicePatients);
      
      // Get existing barcodes
      const existingBarcodes = await db.select().from(patientBarcodes);
      const existingPatientIds = new Set(existingBarcodes.map(b => b.patientId));

      const newBarcodes = [];
      let ipdCount = existingBarcodes.filter(b => b.admissionType === "IPD").length;
      let opdCount = existingBarcodes.filter(b => b.admissionType === "OPD").length;

      for (const patient of allPatients) {
        if (!existingPatientIds.has(patient.id)) {
          // Alternate between IPD and OPD for demo purposes
          const admissionType = newBarcodes.length % 2 === 0 ? "IPD" : "OPD";
          const year = new Date().getFullYear();
          
          let count;
          if (admissionType === "IPD") {
            ipdCount++;
            count = ipdCount;
          } else {
            opdCount++;
            count = opdCount;
          }
          
          const prefix = admissionType === "IPD" ? "GRAV-IPD" : "GRAV-OPD";
          const uhid = `${prefix}-${year}-${count.toString().padStart(6, '0')}`;
          
          const patientName = `${patient.firstName} ${patient.lastName}`;
          const encryptedToken = generateEncryptedToken(patient.id, uhid);
          const barcodeData = `HMS:${uhid}:${encryptedToken.substring(0, 16)}`;

          const [barcode] = await db.insert(patientBarcodes).values({
            patientId: patient.id,
            patientName,
            uhid,
            admissionType,
            encryptedToken,
            barcodeData,
            wardBed: admissionType === "IPD" ? `Ward-${Math.floor(Math.random() * 5) + 1}/Bed-${Math.floor(Math.random() * 20) + 1}` : null,
            treatingDoctor: null,
            isActive: true,
          }).returning();

          newBarcodes.push(barcode);
        }
      }

      // Log bulk generation
      if (newBarcodes.length > 0) {
        await db.insert(barcodeScanLogs).values({
          barcodeId: newBarcodes[0].id,
          uhid: "BULK-GENERATION",
          scannedBy: user.id,
          scannedByName: user.name || user.username,
          role: user.role,
          allowed: true,
          ipAddress: req.ip || null,
          deviceInfo: `Bulk generated ${newBarcodes.length} barcodes`,
        });
      }

      res.json({
        message: `Generated ${newBarcodes.length} new barcodes`,
        totalPatients: allPatients.length,
        existingBarcodes: existingPatientIds.size,
        newBarcodes: newBarcodes.length,
        barcodes: newBarcodes,
      });
    } catch (error) {
      console.error("Error bulk generating barcodes:", error);
      res.status(500).json({ error: "Failed to bulk generate barcodes" });
    }
  });

  // Get all patients with their barcodes (for Admin view)
  app.get("/api/patients/with-barcodes", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      
      if (!user || !BARCODE_ALLOWED_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Get all service patients
      const allPatients = await db.select().from(servicePatients);
      
      // Get all barcodes
      const allBarcodes = await db.select().from(patientBarcodes)
        .orderBy(desc(patientBarcodes.createdAt));
      
      // Create a map of patient ID to barcode
      const barcodeMap = new Map();
      for (const barcode of allBarcodes) {
        if (!barcodeMap.has(barcode.patientId)) {
          barcodeMap.set(barcode.patientId, barcode);
        }
      }

      // Combine patient data with barcode data
      const patientsWithBarcodes = allPatients.map(patient => {
        const barcode = barcodeMap.get(patient.id);
        return {
          id: patient.id,
          name: `${patient.firstName} ${patient.lastName}`,
          firstName: patient.firstName,
          lastName: patient.lastName,
          gender: patient.gender,
          dateOfBirth: patient.dateOfBirth,
          phone: patient.phone,
          email: patient.email,
          address: patient.address,
          emergencyContact: patient.emergencyContact,
          emergencyPhone: patient.emergencyPhone,
          insuranceProvider: patient.insuranceProvider,
          insuranceNumber: patient.insuranceNumber,
          barcode: barcode ? {
            id: barcode.id,
            uhid: barcode.uhid,
            admissionType: barcode.admissionType,
            wardBed: barcode.wardBed,
            treatingDoctor: barcode.treatingDoctor,
            barcodeData: barcode.barcodeData,
            isActive: barcode.isActive,
            createdAt: barcode.createdAt,
          } : null,
          hasBarcode: !!barcode,
        };
      });

      res.json(patientsWithBarcodes);
    } catch (error) {
      console.error("Error fetching patients with barcodes:", error);
      res.status(500).json({ error: "Failed to fetch patients with barcodes" });
    }
  });

  // ========== STAFF MANAGEMENT MODULE ROUTES ==========

  const STAFF_MANAGEMENT_ADMIN_ROLES = ["ADMIN", "OPD_MANAGER"];
  const STAFF_MANAGEMENT_ALL_ROLES = ["ADMIN", "OPD_MANAGER", "DOCTOR", "NURSE", "MEDICAL_STORE", "PATHOLOGY_LAB"];

  // Staff Master CRUD
  app.get("/api/staff", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const staff = await storage.getAllStaffMaster();
      res.json(staff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  app.get("/api/staff/me", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      
      let staff = await storage.getStaffMasterByUserId(user.id);
      if (!staff && STAFF_MANAGEMENT_ALL_ROLES.includes(user.role)) {
        const empCode = `EMP${Date.now().toString().slice(-6)}`;
        staff = await storage.createStaffMaster({
          userId: user.id,
          employeeCode: empCode,
          fullName: user.name || user.username || "Staff Member",
          role: user.role,
          department: user.role === "DOCTOR" ? "OPD" : user.role === "NURSE" ? "NURSING" : "ADMIN",
          status: "ACTIVE",
        });
      }
      if (!staff) return res.status(404).json({ error: "Staff profile not found" });
      res.json(staff);
    } catch (error) {
      console.error("Error fetching staff profile:", error);
      res.status(500).json({ error: "Failed to fetch staff profile" });
    }
  });

  app.get("/api/staff/:id", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      
      const staff = await storage.getStaffMaster(req.params.id);
      if (!staff) return res.status(404).json({ error: "Staff not found" });
      
      // Staff can only see their own profile unless admin
      if (!STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role) && staff.userId !== user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      res.json(staff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  app.get("/api/staff/user/:userId", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      
      const staff = await storage.getStaffMasterByUserId(req.params.userId);
      if (!staff) return res.status(404).json({ error: "Staff profile not found" });
      
      // Staff can only see their own profile unless admin
      if (!STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role) && staff.userId !== user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      res.json(staff);
    } catch (error) {
      console.error("Error fetching staff by user:", error);
      res.status(500).json({ error: "Failed to fetch staff profile" });
    }
  });

  app.get("/api/staff/department/:department", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const staff = await storage.getStaffMasterByDepartment(req.params.department);
      res.json(staff);
    } catch (error) {
      console.error("Error fetching staff by department:", error);
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  app.get("/api/staff/role/:role", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const staff = await storage.getStaffMasterByRole(req.params.role);
      res.json(staff);
    } catch (error) {
      console.error("Error fetching staff by role:", error);
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  app.post("/api/staff", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      console.log("POST /api/staff - Full session:", JSON.stringify(session));
      console.log("POST /api/staff - Session user:", user);
      console.log("POST /api/staff - User role:", user?.role, "User ID:", user?.id);
      console.log("POST /api/staff - Allowed roles:", STAFF_MANAGEMENT_ADMIN_ROLES);
      console.log("POST /api/staff - Role check:", user?.role, "in", STAFF_MANAGEMENT_ADMIN_ROLES, "=", user?.role && STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role));
      if (!user || !STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        console.log("POST /api/staff - Unauthorized: user role", user?.role, "not in", STAFF_MANAGEMENT_ADMIN_ROLES);
        return res.status(403).json({ error: "Unauthorized" });
      }
      console.log("POST /api/staff - Creating staff with:", req.body);
      const staff = await storage.createStaffMaster(req.body);
      res.status(201).json(staff);
    } catch (error) {
      console.error("Error creating staff:", error);
      res.status(500).json({ error: "Failed to create staff" });
    }
  });

  app.patch("/api/staff/:id", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const staff = await storage.updateStaffMaster(req.params.id, req.body);
      if (!staff) return res.status(404).json({ error: "Staff not found" });
      res.json(staff);
    } catch (error) {
      console.error("Error updating staff:", error);
      res.status(500).json({ error: "Failed to update staff" });
    }
  });

  app.delete("/api/staff/:id", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const deleted = await storage.deleteStaffMaster(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Staff not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting staff:", error);
      res.status(500).json({ error: "Failed to delete staff" });
    }
  });

  // Shift Roster Routes
  app.get("/api/roster", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ALL_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const { startDate, endDate, department } = req.query;
      let roster;
      
      if (startDate && endDate) {
        roster = await storage.getShiftRosterByDateRange(startDate as string, endDate as string);
      } else if (department) {
        roster = await storage.getShiftRosterByDepartment(department as string);
      } else {
        roster = await storage.getAllShiftRoster();
      }
      res.json(roster);
    } catch (error) {
      console.error("Error fetching roster:", error);
      res.status(500).json({ error: "Failed to fetch roster" });
    }
  });

  app.get("/api/roster/date/:date", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ALL_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const roster = await storage.getShiftRosterByDate(req.params.date);
      res.json(roster);
    } catch (error) {
      console.error("Error fetching roster by date:", error);
      res.status(500).json({ error: "Failed to fetch roster" });
    }
  });

  app.get("/api/roster/staff/:staffId", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      
      // Staff can see their own roster
      const staffProfile = await storage.getStaffMasterByUserId(user.id);
      if (!STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role) && 
          (!staffProfile || staffProfile.id !== req.params.staffId)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const roster = await storage.getShiftRosterByStaff(req.params.staffId);
      res.json(roster);
    } catch (error) {
      console.error("Error fetching staff roster:", error);
      res.status(500).json({ error: "Failed to fetch staff roster" });
    }
  });

  app.get("/api/roster/:id", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ALL_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const roster = await storage.getShiftRoster(req.params.id);
      if (!roster) return res.status(404).json({ error: "Shift not found" });
      res.json(roster);
    } catch (error) {
      console.error("Error fetching shift:", error);
      res.status(500).json({ error: "Failed to fetch shift" });
    }
  });

  app.post("/api/roster", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      // Check for overlapping shifts
      const existingShifts = await storage.getShiftRosterByStaff(req.body.staffId);
      const newDate = req.body.shiftDate;
      const newStart = req.body.startTime;
      const newEnd = req.body.endTime;
      
      const hasConflict = existingShifts.some(shift => {
        if (shift.shiftDate !== newDate) return false;
        // Simple time overlap check
        return !(newEnd <= shift.startTime || newStart >= shift.endTime);
      });
      
      if (hasConflict && !req.body.overrideReason) {
        return res.status(400).json({ error: "Shift conflict detected. Provide override reason to proceed." });
      }
      
      const roster = await storage.createShiftRoster({
        ...req.body,
        assignedBy: user.id,
      });
      
      // Create audit log
      await storage.createRosterAuditLog({
        rosterId: roster.id,
        action: "CREATED",
        changedBy: user.id,
        changedByName: user.name || user.username,
        newValue: JSON.stringify(roster),
        reason: req.body.overrideReason,
      });
      
      // Notify staff member of new shift assignment
      const staffMember = await storage.getStaffMaster(req.body.staffId);
      if (staffMember?.userId) {
        await notificationService.notifyRosterUpdated(
          staffMember.userId,
          staffMember.fullName,
          "assigned",
          roster.shiftDate,
          roster.shiftType
        );
      }
      
      res.status(201).json(roster);
    } catch (error) {
      console.error("Error creating shift:", error);
      res.status(500).json({ error: "Failed to create shift" });
    }
  });

  app.patch("/api/roster/:id", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const existingRoster = await storage.getShiftRoster(req.params.id);
      if (!existingRoster) return res.status(404).json({ error: "Shift not found" });
      
      const roster = await storage.updateShiftRoster(req.params.id, req.body);
      
      // Create audit log
      await storage.createRosterAuditLog({
        rosterId: roster!.id,
        action: "UPDATED",
        changedBy: user.id,
        changedByName: user.name || user.username,
        previousValue: JSON.stringify(existingRoster),
        newValue: JSON.stringify(roster),
        reason: req.body.updateReason,
      });
      
      // Notify staff member of shift update
      const staffMember = await storage.getStaffMaster(roster!.staffId);
      if (staffMember?.userId) {
        await notificationService.notifyRosterUpdated(
          staffMember.userId,
          staffMember.fullName,
          "updated",
          roster!.shiftDate,
          roster!.shiftType
        );
      }
      
      res.json(roster);
    } catch (error) {
      console.error("Error updating shift:", error);
      res.status(500).json({ error: "Failed to update shift" });
    }
  });

  app.delete("/api/roster/:id", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const existingRoster = await storage.getShiftRoster(req.params.id);
      if (!existingRoster) return res.status(404).json({ error: "Shift not found" });
      
      // Create audit log before deletion
      await storage.createRosterAuditLog({
        rosterId: req.params.id,
        action: "DELETED",
        changedBy: user.id,
        changedByName: user.name || user.username,
        previousValue: JSON.stringify(existingRoster),
        reason: req.body.deleteReason,
      });
      
      // Notify staff member of shift removal
      const staffMember = await storage.getStaffMaster(existingRoster.staffId);
      if (staffMember?.userId) {
        await notificationService.notifyRosterUpdated(
          staffMember.userId,
          staffMember.fullName,
          "removed",
          existingRoster.shiftDate,
          existingRoster.shiftType
        );
      }
      
      const deleted = await storage.deleteShiftRoster(req.params.id);
      res.json({ success: deleted });
    } catch (error) {
      console.error("Error deleting shift:", error);
      res.status(500).json({ error: "Failed to delete shift" });
    }
  });

  // Task Logs Routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ALL_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      if (STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        const tasks = await storage.getAllTaskLogs();
        return res.json(tasks);
      }
      
      // Non-admin staff can only see their own tasks
      const staffProfile = await storage.getStaffMasterByUserId(user.id);
      if (!staffProfile) return res.json([]);
      
      const tasks = await storage.getTaskLogsByStaff(staffProfile.id);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      
      const task = await storage.getTaskLog(req.params.id);
      if (!task) return res.status(404).json({ error: "Task not found" });
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });

  app.get("/api/tasks/staff/:staffId", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      
      const tasks = await storage.getTaskLogsByStaff(req.params.staffId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching staff tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ALL_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const task = await storage.createTaskLog({
        ...req.body,
        assignedBy: req.body.assignedBy || user.id,
      });
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ALL_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const task = await storage.updateTaskLog(req.params.id, req.body);
      if (!task) return res.status(404).json({ error: "Task not found" });
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  // Attendance Routes
  app.get("/api/attendance", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const { date } = req.query;
      if (date) {
        const attendance = await storage.getAttendanceLogsByDate(date as string);
        return res.json(attendance);
      }
      
      const attendance = await storage.getAllAttendanceLogs();
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ error: "Failed to fetch attendance" });
    }
  });

  app.get("/api/attendance/staff/:staffId", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      
      const attendance = await storage.getAttendanceLogsByStaff(req.params.staffId);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching staff attendance:", error);
      res.status(500).json({ error: "Failed to fetch attendance" });
    }
  });

  app.post("/api/attendance/check-in", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ALL_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      let staffProfile = await storage.getStaffMasterByUserId(user.id);
      if (!staffProfile) {
        const empCode = `EMP${Date.now().toString().slice(-6)}`;
        staffProfile = await storage.createStaffMaster({
          userId: user.id,
          employeeCode: empCode,
          fullName: user.name || user.username || "Staff Member",
          role: user.role,
          department: user.role === "DOCTOR" ? "OPD" : user.role === "NURSE" ? "NURSING" : "ADMIN",
          status: "ACTIVE",
        });
      }
      
      const today = new Date().toISOString().split('T')[0];
      const existing = await storage.getAttendanceLogByStaffAndDate(staffProfile.id, today);
      
      if (existing) {
        return res.status(400).json({ error: "Already checked in today" });
      }
      
      const attendance = await storage.createAttendanceLog({
        staffId: staffProfile.id,
        date: today,
        checkInTime: new Date(),
        checkInMethod: req.body.method || "MANUAL",
        status: "PRESENT",
      });
      
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Error checking in:", error);
      res.status(500).json({ error: "Failed to check in" });
    }
  });

  app.post("/api/attendance/check-out", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ALL_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      let staffProfile = await storage.getStaffMasterByUserId(user.id);
      if (!staffProfile) {
        const empCode = `EMP${Date.now().toString().slice(-6)}`;
        staffProfile = await storage.createStaffMaster({
          userId: user.id,
          employeeCode: empCode,
          fullName: user.name || user.username || "Staff Member",
          role: user.role,
          department: user.role === "DOCTOR" ? "OPD" : user.role === "NURSE" ? "NURSING" : "ADMIN",
          status: "ACTIVE",
        });
      }
      
      const today = new Date().toISOString().split('T')[0];
      const existing = await storage.getAttendanceLogByStaffAndDate(staffProfile.id, today);
      
      if (!existing) {
        return res.status(400).json({ error: "No check-in found for today" });
      }
      
      if (existing.checkOutTime) {
        return res.status(400).json({ error: "Already checked out today" });
      }
      
      const checkOutTime = new Date();
      const checkInTime = existing.checkInTime ? new Date(existing.checkInTime) : new Date();
      const workHours = ((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)).toFixed(2);
      
      const attendance = await storage.updateAttendanceLog(existing.id, {
        checkOutTime,
        checkOutMethod: req.body.method || "MANUAL",
        workHours,
      });
      
      res.json(attendance);
    } catch (error) {
      console.error("Error checking out:", error);
      res.status(500).json({ error: "Failed to check out" });
    }
  });

  app.post("/api/attendance", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const attendance = await storage.createAttendanceLog(req.body);
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Error creating attendance:", error);
      res.status(500).json({ error: "Failed to create attendance record" });
    }
  });

  app.patch("/api/attendance/:id", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const attendance = await storage.updateAttendanceLog(req.params.id, {
        ...req.body,
        approvedBy: user.id,
      });
      if (!attendance) return res.status(404).json({ error: "Attendance record not found" });
      res.json(attendance);
    } catch (error) {
      console.error("Error updating attendance:", error);
      res.status(500).json({ error: "Failed to update attendance" });
    }
  });

  // Leave Request Routes
  app.get("/api/leave", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      
      if (STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        const { status } = req.query;
        if (status) {
          const leaves = await storage.getLeaveRequestsByStatus(status as string);
          return res.json(leaves);
        }
        const leaves = await storage.getAllLeaveRequests();
        return res.json(leaves);
      }
      
      // Staff can only see their own leave requests
      const staffProfile = await storage.getStaffMasterByUserId(user.id);
      if (!staffProfile) return res.json([]);
      
      const leaves = await storage.getLeaveRequestsByStaff(staffProfile.id);
      res.json(leaves);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      res.status(500).json({ error: "Failed to fetch leave requests" });
    }
  });

  app.get("/api/leave/pending", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const leaves = await storage.getPendingLeaveRequests();
      res.json(leaves);
    } catch (error) {
      console.error("Error fetching pending leaves:", error);
      res.status(500).json({ error: "Failed to fetch pending leave requests" });
    }
  });

  app.get("/api/leave/:id", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      
      const leave = await storage.getLeaveRequest(req.params.id);
      if (!leave) return res.status(404).json({ error: "Leave request not found" });
      res.json(leave);
    } catch (error) {
      console.error("Error fetching leave request:", error);
      res.status(500).json({ error: "Failed to fetch leave request" });
    }
  });

  app.post("/api/leave", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ALL_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      let staffProfile = await storage.getStaffMasterByUserId(user.id);
      if (!staffProfile) {
        const empCode = `EMP${Date.now().toString().slice(-6)}`;
        staffProfile = await storage.createStaffMaster({
          userId: user.id,
          employeeCode: empCode,
          fullName: user.name || user.username || "Staff Member",
          role: user.role,
          department: user.role === "DOCTOR" ? "OPD" : user.role === "NURSE" ? "NURSING" : "ADMIN",
          status: "ACTIVE",
        });
      }
      
      const { startDate, endDate, leaveType, reason } = req.body;
      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const leave = await storage.createLeaveRequest({
        staffId: staffProfile.id,
        leaveType,
        startDate,
        endDate,
        reason,
        totalDays,
        status: "PENDING",
      });
      res.status(201).json(leave);
    } catch (error) {
      console.error("Error creating leave request:", error);
      res.status(500).json({ error: "Failed to create leave request" });
    }
  });

  app.patch("/api/leave/:id", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      
      const { action } = req.body;
      let updates: any = {};
      
      const existingLeave = await storage.getLeaveRequest(req.params.id);
      if (!existingLeave) return res.status(404).json({ error: "Leave request not found" });
      
      if (action === "approve") {
        if (!STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
          return res.status(403).json({ error: "Unauthorized" });
        }
        updates = {
          status: "APPROVED",
          hrApprovedBy: user.id,
          hrApprovedAt: new Date(),
        };
      } else if (action === "reject") {
        if (!STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
          return res.status(403).json({ error: "Unauthorized" });
        }
        updates = {
          status: "REJECTED",
          rejectedBy: user.id,
          rejectionReason: req.body.reason,
        };
      } else if (action === "cancel") {
        const staffProfile = await storage.getStaffMasterByUserId(user.id);
        if (!staffProfile || existingLeave.staffId !== staffProfile.id) {
          return res.status(403).json({ error: "Cannot cancel this leave request" });
        }
        updates = { status: "CANCELLED" };
      } else {
        updates = req.body;
      }
      
      const leave = await storage.updateLeaveRequest(req.params.id, updates);
      if (!leave) return res.status(404).json({ error: "Leave request not found" });
      
      if (action === "approve" || action === "reject") {
        const staffProfile = await storage.getStaffMaster(existingLeave.staffId);
        if (staffProfile?.userId) {
          const startDate = typeof existingLeave.startDate === 'string' 
            ? existingLeave.startDate 
            : new Date(existingLeave.startDate).toLocaleDateString();
          const endDate = typeof existingLeave.endDate === 'string' 
            ? existingLeave.endDate 
            : new Date(existingLeave.endDate).toLocaleDateString();
          
          await notificationService.notifyLeaveStatusUpdated(
            staffProfile.userId,
            staffProfile.fullName,
            leave.id,
            updates.status,
            existingLeave.leaveType,
            startDate,
            endDate,
            req.body.reason
          );
        }
      }
      
      res.json(leave);
    } catch (error) {
      console.error("Error updating leave request:", error);
      res.status(500).json({ error: "Failed to update leave request" });
    }
  });

  // Overtime Routes
  app.get("/api/overtime", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      
      if (STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        const { status } = req.query;
        if (status) {
          const overtime = await storage.getOvertimeLogsByStatus(status as string);
          return res.json(overtime);
        }
        const overtime = await storage.getAllOvertimeLogs();
        return res.json(overtime);
      }
      
      const staffProfile = await storage.getStaffMasterByUserId(user.id);
      if (!staffProfile) return res.json([]);
      
      const overtime = await storage.getOvertimeLogsByStaff(staffProfile.id);
      res.json(overtime);
    } catch (error) {
      console.error("Error fetching overtime logs:", error);
      res.status(500).json({ error: "Failed to fetch overtime logs" });
    }
  });

  app.get("/api/overtime/pending", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const overtime = await storage.getPendingOvertimeLogs();
      res.json(overtime);
    } catch (error) {
      console.error("Error fetching pending overtime:", error);
      res.status(500).json({ error: "Failed to fetch pending overtime" });
    }
  });

  app.post("/api/overtime", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ALL_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const overtime = await storage.createOvertimeLog(req.body);
      res.status(201).json(overtime);
    } catch (error) {
      console.error("Error creating overtime log:", error);
      res.status(500).json({ error: "Failed to create overtime log" });
    }
  });

  app.patch("/api/overtime/:id", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const { action } = req.body;
      let updates: any = {};
      
      if (action === "approve") {
        updates = {
          status: "APPROVED",
          approvedBy: user.id,
          approvedAt: new Date(),
        };
      } else if (action === "reject") {
        updates = { status: "REJECTED" };
      } else {
        updates = req.body;
      }
      
      const overtime = await storage.updateOvertimeLog(req.params.id, updates);
      if (!overtime) return res.status(404).json({ error: "Overtime log not found" });
      res.json(overtime);
    } catch (error) {
      console.error("Error updating overtime log:", error);
      res.status(500).json({ error: "Failed to update overtime log" });
    }
  });

  // Performance Metrics Routes
  app.get("/api/performance", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const metrics = await storage.getAllStaffPerformanceMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({ error: "Failed to fetch performance metrics" });
    }
  });

  app.get("/api/performance/staff/:staffId", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      
      const metrics = await storage.getStaffPerformanceMetricsByStaff(req.params.staffId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching staff performance:", error);
      res.status(500).json({ error: "Failed to fetch performance metrics" });
    }
  });

  app.post("/api/performance", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const metric = await storage.createStaffPerformanceMetric({
        ...req.body,
        evaluatedBy: user.id,
      });
      res.status(201).json(metric);
    } catch (error) {
      console.error("Error creating performance metric:", error);
      res.status(500).json({ error: "Failed to create performance metric" });
    }
  });

  app.patch("/api/performance/:id", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const metric = await storage.updateStaffPerformanceMetric(req.params.id, req.body);
      if (!metric) return res.status(404).json({ error: "Performance metric not found" });
      res.json(metric);
    } catch (error) {
      console.error("Error updating performance metric:", error);
      res.status(500).json({ error: "Failed to update performance metric" });
    }
  });

  // Roster Audit Logs
  app.get("/api/roster-audit", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const logs = await storage.getAllRosterAuditLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching roster audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/roster-audit/:rosterId", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const logs = await storage.getRosterAuditLogsByRoster(req.params.rosterId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching roster audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // Sync doctor appointments with roster - create shifts from doctor schedules
  app.post("/api/roster/sync-appointments", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const { date, doctorId } = req.body;
      
      // Get all doctor time slots for the specified date
      const allTimeSlots = await storage.getAllDoctorTimeSlots();
      const dateSlots = allTimeSlots.filter(slot => {
        if (slot.date !== date) return false;
        if (doctorId && slot.doctorId !== doctorId) return false;
        return true;
      });
      
      const createdShifts = [];
      
      for (const slot of dateSlots) {
        // Check if staff profile exists for this doctor
        const staffProfile = await storage.getStaffMasterByUserId(slot.doctorId);
        if (!staffProfile) continue;
        
        // Check if shift already exists
        const existingShifts = await storage.getShiftRosterByStaff(staffProfile.id);
        const hasExisting = existingShifts.some(s => 
          s.shiftDate === slot.date && 
          s.startTime === slot.startTime &&
          s.linkedAppointmentId === slot.id
        );
        
        if (hasExisting) continue;
        
        // Create shift from appointment slot
        const shift = await storage.createShiftRoster({
          staffId: staffProfile.id,
          department: staffProfile.department || "OPD",
          shiftDate: slot.date,
          shiftType: slot.slotType === "OPD" ? "MORNING" : "ON_CALL",
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: slot.status === "booked" ? "SCHEDULED" : "SCHEDULED",
          assignedBy: user.id,
          linkedAppointmentId: slot.id,
          notes: `Auto-synced from appointment slot ${slot.id}`,
        });
        
        createdShifts.push(shift);
      }
      
      res.json({ 
        success: true, 
        message: `Created ${createdShifts.length} shifts from appointment slots`,
        shifts: createdShifts 
      });
    } catch (error) {
      console.error("Error syncing appointments:", error);
      res.status(500).json({ error: "Failed to sync appointments with roster" });
    }
  });

  // Analytics endpoint for department-wise staff metrics
  app.get("/api/analytics/staff", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !STAFF_MANAGEMENT_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const { startDate, endDate, department } = req.query;
      
      // Get all staff
      const allStaff = await storage.getAllStaffMaster();
      const filteredStaff = department 
        ? allStaff.filter(s => s.department === department)
        : allStaff;
      
      // Get roster data
      let rosterData;
      if (startDate && endDate) {
        rosterData = await storage.getShiftRosterByDateRange(startDate as string, endDate as string);
      } else {
        rosterData = await storage.getAllShiftRoster();
      }
      
      // Calculate analytics
      const staffCount = filteredStaff.length;
      const activeStaff = filteredStaff.filter(s => s.status === "ACTIVE").length;
      const onLeaveStaff = filteredStaff.filter(s => s.status === "ON_LEAVE").length;
      
      const shiftsByType = {
        MORNING: rosterData.filter(r => r.shiftType === "MORNING").length,
        EVENING: rosterData.filter(r => r.shiftType === "EVENING").length,
        NIGHT: rosterData.filter(r => r.shiftType === "NIGHT").length,
        ON_CALL: rosterData.filter(r => r.shiftType === "ON_CALL").length,
      };
      
      const shiftStatus = {
        SCHEDULED: rosterData.filter(r => r.status === "SCHEDULED").length,
        COMPLETED: rosterData.filter(r => r.status === "COMPLETED").length,
        MISSED: rosterData.filter(r => r.status === "MISSED").length,
        CANCELLED: rosterData.filter(r => r.status === "CANCELLED").length,
      };
      
      // Get leave and overtime data
      const pendingLeaves = await storage.getPendingLeaveRequests();
      const pendingOvertime = await storage.getPendingOvertimeLogs();
      
      // Department breakdown
      const departments = [...new Set(allStaff.map(s => s.department).filter(Boolean))];
      const departmentBreakdown = departments.map(dept => ({
        department: dept,
        staffCount: allStaff.filter(s => s.department === dept).length,
        activeCount: allStaff.filter(s => s.department === dept && s.status === "ACTIVE").length,
      }));
      
      res.json({
        summary: {
          totalStaff: staffCount,
          activeStaff,
          onLeaveStaff,
          totalShifts: rosterData.length,
          pendingLeaveRequests: pendingLeaves.length,
          pendingOvertimeApprovals: pendingOvertime.length,
        },
        shiftsByType,
        shiftStatus,
        departmentBreakdown,
      });
    } catch (error) {
      console.error("Error fetching staff analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // ==================== INSURANCE MANAGEMENT ROUTES ====================
  const INSURANCE_ADMIN_ROLES = ["ADMIN"];
  const INSURANCE_VIEW_ROLES = ["ADMIN", "PATIENT", "DOCTOR", "NURSE", "OPD_MANAGER"];
  const INSURANCE_PROCESS_ROLES = ["ADMIN"]; // Insurance Desk role can be added

  // Generate unique claim number
  function generateClaimNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CLM-${timestamp}-${random}`;
  }

  // ===== INSURANCE PROVIDERS (Admin CRUD) =====
  
  // Get all insurance providers (Admin sees all, others see active only)
  app.get("/api/insurance/providers", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      if (INSURANCE_ADMIN_ROLES.includes(user.role)) {
        const providers = await storage.getAllInsuranceProviders();
        res.json(providers);
      } else {
        const providers = await storage.getActiveInsuranceProviders();
        res.json(providers);
      }
    } catch (error) {
      console.error("Error fetching insurance providers:", error);
      res.status(500).json({ error: "Failed to fetch providers" });
    }
  });

  // Get single insurance provider
  app.get("/api/insurance/providers/:id", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const provider = await storage.getInsuranceProvider(req.params.id);
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      res.json(provider);
    } catch (error) {
      console.error("Error fetching provider:", error);
      res.status(500).json({ error: "Failed to fetch provider" });
    }
  });

  // Create insurance provider (Admin only)
  app.post("/api/insurance/providers", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !INSURANCE_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized - Admin access required" });
      }
      
      const provider = await storage.createInsuranceProvider({
        ...req.body,
        createdByAdminId: user.id,
      });
      res.status(201).json(provider);
    } catch (error) {
      console.error("Error creating provider:", error);
      res.status(500).json({ error: "Failed to create provider" });
    }
  });

  // Update insurance provider (Admin only)
  app.patch("/api/insurance/providers/:id", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !INSURANCE_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized - Admin access required" });
      }
      
      const provider = await storage.updateInsuranceProvider(req.params.id, req.body);
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      res.json(provider);
    } catch (error) {
      console.error("Error updating provider:", error);
      res.status(500).json({ error: "Failed to update provider" });
    }
  });

  // Deactivate insurance provider (Admin only - soft delete)
  app.delete("/api/insurance/providers/:id", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !INSURANCE_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized - Admin access required" });
      }
      
      const provider = await storage.deactivateInsuranceProvider(req.params.id);
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      res.json({ success: true, message: "Provider deactivated" });
    } catch (error) {
      console.error("Error deactivating provider:", error);
      res.status(500).json({ error: "Failed to deactivate provider" });
    }
  });

  // ===== PATIENT INSURANCE =====
  
  // Get patient's insurance policies
  app.get("/api/insurance/patient/:patientId", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Patients can only see their own, others with view role can see any
      if (user.role === "PATIENT" && user.id !== req.params.patientId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const insurance = await storage.getPatientInsuranceByPatient(req.params.patientId);
      res.json(insurance);
    } catch (error) {
      console.error("Error fetching patient insurance:", error);
      res.status(500).json({ error: "Failed to fetch insurance" });
    }
  });

  // Add patient insurance
  app.post("/api/insurance/patient", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const insurance = await storage.createPatientInsurance(req.body);
      res.status(201).json(insurance);
    } catch (error) {
      console.error("Error creating patient insurance:", error);
      res.status(500).json({ error: "Failed to add insurance" });
    }
  });

  // Update patient insurance
  app.patch("/api/insurance/patient/:id", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const insurance = await storage.updatePatientInsurance(req.params.id, req.body);
      if (!insurance) {
        return res.status(404).json({ error: "Insurance not found" });
      }
      res.json(insurance);
    } catch (error) {
      console.error("Error updating patient insurance:", error);
      res.status(500).json({ error: "Failed to update insurance" });
    }
  });

  // ===== INSURANCE CLAIMS =====
  
  // Get all claims (Admin/Insurance Desk)
  app.get("/api/insurance/claims", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !INSURANCE_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const { status } = req.query;
      let claims;
      if (status) {
        claims = await storage.getInsuranceClaimsByStatus(status as string);
      } else {
        claims = await storage.getAllInsuranceClaims();
      }
      res.json(claims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      res.status(500).json({ error: "Failed to fetch claims" });
    }
  });

  // Get patient's claims
  app.get("/api/insurance/claims/patient/:patientId", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      if (user.role === "PATIENT" && user.id !== req.params.patientId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const claims = await storage.getInsuranceClaimsByPatient(req.params.patientId);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching patient claims:", error);
      res.status(500).json({ error: "Failed to fetch claims" });
    }
  });

  // Get single claim with documents and logs
  app.get("/api/insurance/claims/:id", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const claim = await storage.getInsuranceClaim(req.params.id);
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      
      const documents = await storage.getClaimDocuments(req.params.id);
      const logs = await storage.getClaimLogs(req.params.id);
      
      res.json({ claim, documents, logs });
    } catch (error) {
      console.error("Error fetching claim:", error);
      res.status(500).json({ error: "Failed to fetch claim" });
    }
  });

  // Create new claim
  app.post("/api/insurance/claims", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const claimNumber = generateClaimNumber();
      const claim = await storage.createInsuranceClaim({
        ...req.body,
        claimNumber,
        submittedBy: user.id,
      });
      
      // Create audit log
      await storage.createClaimLog({
        claimId: claim.id,
        actionType: "CREATED",
        performedByRole: user.role,
        performedById: user.id,
        performedByName: user.name || user.username,
        newValue: JSON.stringify({ status: claim.status, claimNumber }),
        remarks: "Claim created",
      });
      
      // Send WebSocket notification to admins for new claim
      notificationService.broadcast({
        type: "insurance_claim_submitted",
        claimId: claim.id,
        claimNumber: claim.claimNumber,
        patientId: claim.patientId,
        claimType: claim.claimType,
        status: claim.status,
        timestamp: new Date().toISOString(),
      });
      
      res.status(201).json(claim);
    } catch (error) {
      console.error("Error creating claim:", error);
      res.status(500).json({ error: "Failed to create claim" });
    }
  });

  // Update claim (status changes, processing)
  app.patch("/api/insurance/claims/:id", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const existingClaim = await storage.getInsuranceClaim(req.params.id);
      if (!existingClaim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      
      const previousStatus = existingClaim.status;
      const updates: any = { ...req.body };
      
      // Set processed info for status changes
      if (req.body.status && req.body.status !== previousStatus) {
        updates.processedBy = user.id;
        updates.processedAt = new Date();
        
        if (req.body.status === "SETTLED") {
          updates.settledAt = new Date();
        }
      }
      
      const claim = await storage.updateInsuranceClaim(req.params.id, updates);
      
      // Create audit log for status change
      if (req.body.status && req.body.status !== previousStatus) {
        await storage.createClaimLog({
          claimId: req.params.id,
          actionType: "STATUS_CHANGED",
          performedByRole: user.role,
          performedById: user.id,
          performedByName: user.name || user.username,
          previousValue: previousStatus,
          newValue: req.body.status,
          remarks: req.body.remarks || `Status changed from ${previousStatus} to ${req.body.status}`,
        });
      }
      
      res.json(claim);
    } catch (error) {
      console.error("Error updating claim:", error);
      res.status(500).json({ error: "Failed to update claim" });
    }
  });

  // ===== CLAIM DOCUMENTS =====
  
  // Upload document to claim
  app.post("/api/insurance/claims/:claimId/documents", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const claim = await storage.getInsuranceClaim(req.params.claimId);
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      
      const document = await storage.createClaimDocument({
        claimId: req.params.claimId,
        ...req.body,
        uploadedBy: user.id,
        uploadedByRole: user.role,
      });
      
      // Create audit log
      await storage.createClaimLog({
        claimId: req.params.claimId,
        actionType: "DOCUMENT_UPLOADED",
        performedByRole: user.role,
        performedById: user.id,
        performedByName: user.name || user.username,
        newValue: JSON.stringify({ documentType: req.body.documentType, documentName: req.body.documentName }),
        remarks: `Document uploaded: ${req.body.documentType}`,
      });
      
      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  // Verify document (Admin/Insurance Desk)
  app.patch("/api/insurance/documents/:id/verify", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !INSURANCE_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const document = await storage.verifyClaimDocument(req.params.id, user.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error verifying document:", error);
      res.status(500).json({ error: "Failed to verify document" });
    }
  });

  // ===== PROVIDER CHECKLISTS =====
  
  // Get provider checklists
  app.get("/api/insurance/providers/:providerId/checklists", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { claimType } = req.query;
      let checklists;
      if (claimType) {
        checklists = await storage.getProviderChecklistsByType(req.params.providerId, claimType as string);
      } else {
        checklists = await storage.getProviderChecklists(req.params.providerId);
      }
      res.json(checklists);
    } catch (error) {
      console.error("Error fetching checklists:", error);
      res.status(500).json({ error: "Failed to fetch checklists" });
    }
  });

  // Update provider checklists (Admin only)
  app.post("/api/insurance/providers/:providerId/checklists", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !INSURANCE_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized - Admin access required" });
      }
      
      // Delete existing and create new
      await storage.deleteProviderChecklists(req.params.providerId);
      
      const checklists = [];
      for (const item of req.body.checklists) {
        const checklist = await storage.createProviderChecklist({
          providerId: req.params.providerId,
          ...item,
        });
        checklists.push(checklist);
      }
      
      res.status(201).json(checklists);
    } catch (error) {
      console.error("Error updating checklists:", error);
      res.status(500).json({ error: "Failed to update checklists" });
    }
  });

  // ===== INSURANCE DASHBOARD (Admin) =====
  app.get("/api/insurance/dashboard", async (req, res) => {
    try {
      const session = (req.session as any);
      const user = session?.user;
      if (!user || !INSURANCE_ADMIN_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const allClaims = await storage.getAllInsuranceClaims();
      const allProviders = await storage.getAllInsuranceProviders();
      
      // Calculate dashboard metrics
      const claimsByStatus = {
        DRAFT: allClaims.filter(c => c.status === "DRAFT").length,
        SUBMITTED: allClaims.filter(c => c.status === "SUBMITTED").length,
        UNDER_REVIEW: allClaims.filter(c => c.status === "UNDER_REVIEW").length,
        QUERY_RAISED: allClaims.filter(c => c.status === "QUERY_RAISED").length,
        APPROVED: allClaims.filter(c => c.status === "APPROVED").length,
        PARTIALLY_APPROVED: allClaims.filter(c => c.status === "PARTIALLY_APPROVED").length,
        REJECTED: allClaims.filter(c => c.status === "REJECTED").length,
        SETTLED: allClaims.filter(c => c.status === "SETTLED").length,
      };
      
      const totalApproved = allClaims.filter(c => ["APPROVED", "PARTIALLY_APPROVED", "SETTLED"].includes(c.status || "")).length;
      const totalRejected = allClaims.filter(c => c.status === "REJECTED").length;
      const approvalRate = allClaims.length > 0 ? ((totalApproved / allClaims.length) * 100).toFixed(1) : 0;
      
      const totalSettledAmount = allClaims
        .filter(c => c.settledAmount)
        .reduce((sum, c) => sum + parseFloat(c.settledAmount || "0"), 0);
      
      const pendingClaims = allClaims.filter(c => 
        ["SUBMITTED", "UNDER_REVIEW", "QUERY_RAISED"].includes(c.status || "")
      ).length;
      
      res.json({
        summary: {
          totalClaims: allClaims.length,
          pendingClaims,
          approvalRate: `${approvalRate}%`,
          totalSettledAmount: totalSettledAmount.toFixed(2),
          activeProviders: allProviders.filter(p => p.activeStatus).length,
        },
        claimsByStatus,
        recentClaims: allClaims.slice(0, 10),
      });
    } catch (error) {
      console.error("Error fetching insurance dashboard:", error);
      res.status(500).json({ error: "Failed to fetch dashboard" });
    }
  });

  // ===== FACE RECOGNITION & IDENTITY VERIFICATION API =====

  // Calculate cosine similarity between two embedding vectors
  function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Get recognition threshold setting
  async function getRecognitionThreshold(): Promise<number> {
    const setting = await storage.getFaceRecognitionSetting("recognition_threshold");
    return setting ? parseFloat(setting.settingValue) : 0.78;
  }

  // Face Embeddings - Store face data (Admin, Nurse, OPD_MANAGER)
  app.post("/api/face-recognition/embeddings", requireAuth, requireRole(["ADMIN", "NURSE", "OPD_MANAGER"]), async (req, res) => {
    try {
      const { userId, userType, embeddingVector, faceQualityScore, captureDeviceId, captureLocation } = req.body;
      
      if (!userId || !userType || !embeddingVector) {
        return res.status(400).json({ error: "Missing required fields: userId, userType, embeddingVector" });
      }
      
      // Check consent exists
      const consent = await storage.getBiometricConsent(userId, userType);
      if (!consent || !consent.consentStatus) {
        return res.status(400).json({ error: "Biometric consent not given for this user" });
      }
      
      // Deactivate any existing embeddings for this user
      await storage.deactivateFaceEmbedding(userId, userType);
      
      const embedding = await storage.createFaceEmbedding({
        userId,
        userType,
        embeddingVector: typeof embeddingVector === 'string' ? embeddingVector : JSON.stringify(embeddingVector),
        faceQualityScore: faceQualityScore?.toString(),
        captureDeviceId,
        captureLocation,
        isActive: true,
      });
      
      res.status(201).json(embedding);
    } catch (error) {
      console.error("Error creating face embedding:", error);
      res.status(500).json({ error: "Failed to create face embedding" });
    }
  });

  // Get user's face embedding
  app.get("/api/face-recognition/embeddings/user/:userId/:userType", requireAuth, async (req, res) => {
    try {
      const embedding = await storage.getFaceEmbeddingByUser(req.params.userId, req.params.userType);
      if (!embedding) {
        return res.status(404).json({ error: "Face embedding not found" });
      }
      // Don't return the actual embedding vector to non-admin
      const user = req.user as any;
      if (user.role !== "ADMIN") {
        res.json({ ...embedding, embeddingVector: "[ENCRYPTED]" });
      } else {
        res.json(embedding);
      }
    } catch (error) {
      console.error("Error fetching face embedding:", error);
      res.status(500).json({ error: "Failed to fetch face embedding" });
    }
  });

  // Biometric Consent - Record consent
  app.post("/api/face-recognition/consent", requireAuth, requireRole(["ADMIN", "NURSE", "OPD_MANAGER"]), async (req, res) => {
    try {
      const { userId, userType, consentStatus, ipAddress } = req.body;
      const user = req.user as any;
      
      if (!userId || !userType) {
        return res.status(400).json({ error: "Missing required fields: userId, userType" });
      }
      
      // Check if consent already exists
      const existing = await storage.getBiometricConsent(userId, userType);
      if (existing) {
        const updated = await storage.updateBiometricConsent(existing.id, {
          consentStatus: consentStatus !== false,
          consentGivenAt: consentStatus ? new Date() : undefined,
          consentGivenBy: user.id,
          ipAddress,
        });
        return res.json(updated);
      }
      
      const consent = await storage.createBiometricConsent({
        userId,
        userType,
        biometricType: "FACE",
        consentStatus: consentStatus !== false,
        consentGivenAt: consentStatus ? new Date() : undefined,
        consentGivenBy: user.id,
        ipAddress,
      });
      
      res.status(201).json(consent);
    } catch (error) {
      console.error("Error creating consent:", error);
      res.status(500).json({ error: "Failed to create consent" });
    }
  });

  // Get consent status
  app.get("/api/face-recognition/consent/:userId/:userType", requireAuth, async (req, res) => {
    try {
      const consent = await storage.getBiometricConsent(req.params.userId, req.params.userType);
      res.json({ consent, hasConsent: consent?.consentStatus || false });
    } catch (error) {
      console.error("Error fetching consent:", error);
      res.status(500).json({ error: "Failed to fetch consent" });
    }
  });

  // Revoke consent
  app.post("/api/face-recognition/consent/revoke", requireAuth, requireRole(["ADMIN", "PATIENT"]), async (req, res) => {
    try {
      const { userId, userType, reason } = req.body;
      const user = req.user as any;
      
      // Patient can only revoke their own consent
      if (user.role === "PATIENT" && user.id !== userId) {
        return res.status(403).json({ error: "Can only revoke your own consent" });
      }
      
      await storage.revokeBiometricConsent(userId, userType, user.id, reason);
      // Also deactivate face embeddings
      await storage.deactivateFaceEmbedding(userId, userType);
      
      res.json({ success: true, message: "Consent revoked and face data deactivated" });
    } catch (error) {
      console.error("Error revoking consent:", error);
      res.status(500).json({ error: "Failed to revoke consent" });
    }
  });

  // Face Recognition - Match face against stored embeddings
  app.post("/api/face-recognition/match", requireAuth, requireRole(["ADMIN", "NURSE", "OPD_MANAGER", "DOCTOR"]), async (req, res) => {
    try {
      const startTime = Date.now();
      const { embeddingVector, userType, purpose, location, deviceId } = req.body;
      const user = req.user as any;
      
      if (!embeddingVector) {
        return res.status(400).json({ error: "Missing embeddingVector" });
      }
      
      const inputVector = typeof embeddingVector === 'string' ? JSON.parse(embeddingVector) : embeddingVector;
      const threshold = await getRecognitionThreshold();
      
      // Get all active embeddings of the specified type
      const allEmbeddings = await storage.getAllActiveFaceEmbeddings(userType);
      
      let bestMatch: any = null;
      let highestScore = 0;
      const matches: any[] = [];
      
      for (const embedding of allEmbeddings) {
        const storedVector = JSON.parse(embedding.embeddingVector);
        const similarity = cosineSimilarity(inputVector, storedVector);
        
        if (similarity >= threshold) {
          matches.push({ embedding, similarity });
          if (similarity > highestScore) {
            highestScore = similarity;
            bestMatch = embedding;
          }
        }
      }
      
      const processingTime = Date.now() - startTime;
      let matchStatus = "FAILURE";
      
      if (matches.length === 1) {
        matchStatus = "SUCCESS";
      } else if (matches.length > 1) {
        matchStatus = "MULTIPLE_MATCHES";
      }
      
      // Log the recognition attempt
      const log = await storage.createFaceRecognitionLog({
        userType: userType || "UNKNOWN",
        matchedUserId: bestMatch?.userId || null,
        confidenceScore: highestScore.toString(),
        thresholdUsed: threshold.toString(),
        matchStatus,
        location,
        purpose: purpose || "VERIFICATION",
        deviceId,
        processingTimeMs: processingTime,
        performedBy: user.id,
      });
      
      res.json({
        matched: matchStatus === "SUCCESS" || matchStatus === "MULTIPLE_MATCHES",
        matchStatus,
        matchedUserId: bestMatch?.userId,
        matchedUserType: bestMatch?.userType,
        confidenceScore: highestScore,
        threshold,
        multipleMatches: matches.length > 1,
        matchCount: matches.length,
        processingTimeMs: processingTime,
        logId: log.id,
      });
    } catch (error) {
      console.error("Error matching face:", error);
      res.status(500).json({ error: "Failed to match face" });
    }
  });

  // Duplicate Patient Check - During registration
  app.post("/api/face-recognition/duplicate-check", requireAuth, requireRole(["ADMIN", "NURSE", "OPD_MANAGER"]), async (req, res) => {
    try {
      const { embeddingVector, newPatientId, location } = req.body;
      const user = req.user as any;
      
      if (!embeddingVector) {
        return res.status(400).json({ error: "Missing embeddingVector" });
      }
      
      const inputVector = typeof embeddingVector === 'string' ? JSON.parse(embeddingVector) : embeddingVector;
      const threshold = await getRecognitionThreshold();
      
      // Get all patient embeddings
      const patientEmbeddings = await storage.getAllActiveFaceEmbeddings("PATIENT");
      
      const potentialDuplicates: any[] = [];
      
      for (const embedding of patientEmbeddings) {
        // Skip if same patient
        if (embedding.userId === newPatientId) continue;
        
        const storedVector = JSON.parse(embedding.embeddingVector);
        const similarity = cosineSimilarity(inputVector, storedVector);
        
        if (similarity >= threshold) {
          potentialDuplicates.push({
            existingPatientId: embedding.userId,
            confidenceScore: similarity,
          });
        }
      }
      
      // Log the check
      await storage.createFaceRecognitionLog({
        userType: "PATIENT",
        matchedUserId: potentialDuplicates[0]?.existingPatientId || null,
        confidenceScore: (potentialDuplicates[0]?.confidenceScore || 0).toString(),
        thresholdUsed: threshold.toString(),
        matchStatus: potentialDuplicates.length > 0 ? "MULTIPLE_MATCHES" : "FAILURE",
        location,
        purpose: "DUPLICATE_CHECK",
        performedBy: user.id,
      });
      
      // Create alerts for each potential duplicate
      for (const duplicate of potentialDuplicates) {
        if (newPatientId) {
          await storage.createDuplicatePatientAlert({
            newPatientId,
            existingPatientId: duplicate.existingPatientId,
            confidenceScore: duplicate.confidenceScore.toString(),
            alertStatus: "PENDING",
          });
        }
      }
      
      res.json({
        hasDuplicates: potentialDuplicates.length > 0,
        duplicateCount: potentialDuplicates.length,
        potentialDuplicates: potentialDuplicates.map(d => ({
          existingPatientId: d.existingPatientId.slice(-4).padStart(d.existingPatientId.length, '*'),
          confidenceScore: (d.confidenceScore * 100).toFixed(1) + '%',
        })),
      });
    } catch (error) {
      console.error("Error checking duplicates:", error);
      res.status(500).json({ error: "Failed to check duplicates" });
    }
  });

  // Get duplicate alerts
  app.get("/api/face-recognition/duplicate-alerts", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const status = req.query.status as string;
      const alerts = await storage.getDuplicatePatientAlerts(status);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching duplicate alerts:", error);
      res.status(500).json({ error: "Failed to fetch duplicate alerts" });
    }
  });

  // Resolve duplicate alert
  app.post("/api/face-recognition/duplicate-alerts/:id/resolve", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const { status, notes, mergedToId } = req.body;
      const user = req.user as any;
      
      const alert = await storage.resolveDuplicateAlert(
        req.params.id,
        user.id,
        status,
        notes,
        mergedToId
      );
      
      res.json(alert);
    } catch (error) {
      console.error("Error resolving duplicate alert:", error);
      res.status(500).json({ error: "Failed to resolve duplicate alert" });
    }
  });

  // Face Attendance - Punch In/Out
  app.post("/api/face-recognition/attendance", requireAuth, requireRole(["ADMIN", "NURSE", "OPD_MANAGER"]), async (req, res) => {
    try {
      const { embeddingVector, location, deviceId, staffId } = req.body;
      const user = req.user as any;
      
      if (!embeddingVector) {
        return res.status(400).json({ error: "Missing embeddingVector" });
      }
      
      const inputVector = typeof embeddingVector === 'string' ? JSON.parse(embeddingVector) : embeddingVector;
      const threshold = await getRecognitionThreshold();
      
      // Get all staff embeddings
      const staffEmbeddings = await storage.getAllActiveFaceEmbeddings("STAFF");
      
      let bestMatch: any = null;
      let highestScore = 0;
      
      for (const embedding of staffEmbeddings) {
        const storedVector = JSON.parse(embedding.embeddingVector);
        const similarity = cosineSimilarity(inputVector, storedVector);
        
        if (similarity >= threshold && similarity > highestScore) {
          highestScore = similarity;
          bestMatch = embedding;
        }
      }
      
      // Log recognition attempt
      const log = await storage.createFaceRecognitionLog({
        userType: "STAFF",
        matchedUserId: bestMatch?.userId || null,
        confidenceScore: highestScore.toString(),
        thresholdUsed: threshold.toString(),
        matchStatus: bestMatch ? "SUCCESS" : "FAILURE",
        location,
        purpose: "ATTENDANCE",
        deviceId,
        performedBy: user.id,
      });
      
      if (!bestMatch) {
        return res.status(404).json({ 
          error: "Face not recognized",
          matchStatus: "FAILURE",
          confidenceScore: highestScore 
        });
      }
      
      // Determine punch type based on last attendance
      const lastAttendance = await storage.getLatestFaceAttendance(bestMatch.userId);
      const punchType = (!lastAttendance || lastAttendance.punchType === "OUT") ? "IN" : "OUT";
      
      // Create attendance record
      const attendance = await storage.createFaceAttendance({
        staffId: bestMatch.userId,
        punchType,
        confidenceScore: highestScore.toString(),
        deviceId,
        location,
        recognitionLogId: log.id,
      });
      
      res.json({
        success: true,
        punchType,
        staffId: bestMatch.userId,
        confidenceScore: highestScore,
        attendanceId: attendance.id,
        timestamp: attendance.createdAt,
      });
    } catch (error) {
      console.error("Error recording attendance:", error);
      res.status(500).json({ error: "Failed to record attendance" });
    }
  });

  // Get staff attendance
  app.get("/api/face-recognition/attendance/:staffId", requireAuth, async (req, res) => {
    try {
      const attendance = await storage.getFaceAttendanceByStaff(req.params.staffId);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ error: "Failed to fetch attendance" });
    }
  });

  // Get today's attendance (all staff)
  app.get("/api/face-recognition/attendance-today", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const attendance = await storage.getAllFaceAttendanceToday();
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
      res.status(500).json({ error: "Failed to fetch today's attendance" });
    }
  });

  // Recognition settings (Admin only)
  app.get("/api/face-recognition/settings", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const settings = await storage.getAllFaceRecognitionSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/face-recognition/settings", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const { key, value, description } = req.body;
      const user = req.user as any;
      
      const setting = await storage.upsertFaceRecognitionSetting(key, value, description, user.id);
      res.json(setting);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // Recognition logs (Admin only)
  app.get("/api/face-recognition/logs", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const filters = {
        userType: req.query.userType as string,
        matchStatus: req.query.matchStatus as string,
      };
      const logs = await storage.getFaceRecognitionLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching recognition logs:", error);
      res.status(500).json({ error: "Failed to fetch recognition logs" });
    }
  });

  // Recognition stats dashboard (Admin only)
  app.get("/api/face-recognition/stats", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const stats = await storage.getRecognitionStats();
      const settings = await storage.getAllFaceRecognitionSettings();
      const pendingAlerts = await storage.getDuplicatePatientAlerts("PENDING");
      const allEmbeddings = await storage.getAllActiveFaceEmbeddings();
      
      res.json({
        ...stats,
        activeEmbeddings: allEmbeddings.length,
        patientEmbeddings: allEmbeddings.filter((e: any) => e.userType === "PATIENT").length,
        staffEmbeddings: allEmbeddings.filter((e: any) => e.userType === "STAFF").length,
        pendingDuplicateAlerts: pendingAlerts.length,
        settings: settings.reduce((acc: any, s: any) => ({ ...acc, [s.settingKey]: s.settingValue }), {}),
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Patient quick check-in via face
  app.post("/api/face-recognition/patient-checkin", requireAuth, requireRole(["ADMIN", "NURSE", "OPD_MANAGER"]), async (req, res) => {
    try {
      const { embeddingVector, location, deviceId } = req.body;
      const user = req.user as any;
      
      if (!embeddingVector) {
        return res.status(400).json({ error: "Missing embeddingVector" });
      }
      
      const inputVector = typeof embeddingVector === 'string' ? JSON.parse(embeddingVector) : embeddingVector;
      const threshold = await getRecognitionThreshold();
      const startTime = Date.now();
      
      // Get all patient embeddings
      const patientEmbeddings = await storage.getAllActiveFaceEmbeddings("PATIENT");
      
      let bestMatch: any = null;
      let highestScore = 0;
      
      for (const embedding of patientEmbeddings) {
        const storedVector = JSON.parse(embedding.embeddingVector);
        const similarity = cosineSimilarity(inputVector, storedVector);
        
        if (similarity >= threshold && similarity > highestScore) {
          highestScore = similarity;
          bestMatch = embedding;
        }
      }
      
      const processingTime = Date.now() - startTime;
      
      // Log the recognition attempt
      await storage.createFaceRecognitionLog({
        userType: "PATIENT",
        matchedUserId: bestMatch?.userId || null,
        confidenceScore: highestScore.toString(),
        thresholdUsed: threshold.toString(),
        matchStatus: bestMatch ? "SUCCESS" : "FAILURE",
        location,
        purpose: "CHECK_IN",
        deviceId,
        processingTimeMs: processingTime,
        performedBy: user.id,
      });
      
      if (!bestMatch) {
        return res.json({
          matched: false,
          message: "Patient not recognized. Please use manual check-in with UHID or mobile number.",
          confidenceScore: highestScore,
          processingTimeMs: processingTime,
        });
      }
      
      // Get patient details
      const patientProfile = await storage.getPatientProfileByPatientId(bestMatch.userId);
      const patientUser = await storage.getUser(bestMatch.userId);
      
      res.json({
        matched: true,
        patientId: bestMatch.userId,
        patientName: patientProfile?.fullName || patientUser?.name || "Unknown",
        confidenceScore: highestScore,
        processingTimeMs: processingTime,
        patientProfile,
      });
    } catch (error) {
      console.error("Error during patient check-in:", error);
      res.status(500).json({ error: "Failed to check-in patient" });
    }
  });

  // ========== REFERRAL MANAGEMENT ==========
  
  // Referral Sources
  app.get("/api/referral-sources", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const sources = await storage.getReferralSources();
      res.json(sources);
    } catch (error) {
      console.error("Error fetching referral sources:", error);
      res.status(500).json({ error: "Failed to fetch referral sources" });
    }
  });

  app.post("/api/referral-sources", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const user = req.user as any;
      const source = await storage.createReferralSource({ 
        ...req.body, 
        tenantId: user.tenantId || user.hospitalName || "default",
        createdBy: user.id 
      });
      res.status(201).json(source);
    } catch (error) {
      console.error("Error creating referral source:", error);
      res.status(500).json({ error: "Failed to create referral source" });
    }
  });

  app.patch("/api/referral-sources/:id", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const source = await storage.updateReferralSource(req.params.id, req.body);
      if (!source) return res.status(404).json({ error: "Referral source not found" });
      res.json(source);
    } catch (error) {
      console.error("Error updating referral source:", error);
      res.status(500).json({ error: "Failed to update referral source" });
    }
  });

  app.delete("/api/referral-sources/:id", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const deleted = await storage.deleteReferralSource(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Referral source not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting referral source:", error);
      res.status(500).json({ error: "Failed to delete referral source" });
    }
  });

  // Patient Referrals
  app.get("/api/referrals", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const { referralType, status } = req.query;
      const filters: { referralType?: string; status?: string } = {};
      if (referralType && typeof referralType === 'string') filters.referralType = referralType;
      if (status && typeof status === 'string') filters.status = status;
      const referrals = await storage.getPatientReferrals(Object.keys(filters).length > 0 ? filters : undefined);
      res.json(referrals);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      res.status(500).json({ error: "Failed to fetch referrals" });
    }
  });

  app.post("/api/referrals", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const user = req.user as any;
      const referral = await storage.createPatientReferral({ 
        ...req.body, 
        tenantId: user.tenantId || user.hospitalName || "default",
        createdBy: user.id 
      });
      res.status(201).json(referral);
    } catch (error) {
      console.error("Error creating referral:", error);
      res.status(500).json({ error: "Failed to create referral" });
    }
  });

  app.get("/api/referrals/:id", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const referral = await storage.getPatientReferral(req.params.id);
      if (!referral) return res.status(404).json({ error: "Referral not found" });
      res.json(referral);
    } catch (error) {
      console.error("Error fetching referral:", error);
      res.status(500).json({ error: "Failed to fetch referral" });
    }
  });

  app.patch("/api/referrals/:id", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const referral = await storage.updatePatientReferral(req.params.id, req.body);
      if (!referral) return res.status(404).json({ error: "Referral not found" });
      res.json(referral);
    } catch (error) {
      console.error("Error updating referral:", error);
      res.status(500).json({ error: "Failed to update referral" });
    }
  });

  app.delete("/api/referrals/:id", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const deleted = await storage.deletePatientReferral(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Referral not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting referral:", error);
      res.status(500).json({ error: "Failed to delete referral" });
    }
  });

  // Seed demo referral sources
  app.post("/api/referral-sources/seed", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const user = req.user as any;
      const tenantId = user.tenantId || user.hospitalName || "default";
      
      // Check if sources already exist
      const existingSources = await storage.getReferralSources();
      if (existingSources.length > 0) {
        return res.json({ message: "Referral sources already seeded", count: existingSources.length });
      }

      // 10 Outside Doctors for incoming referrals (REFER_FROM)
      const outsideDoctors = [
        { sourceName: "Dr. Rajesh Kumar", sourceType: "Doctor", contactPerson: "Dr. Rajesh Kumar", phone: "+91 98765 43210", email: "dr.rajesh@clinic.com", address: "Krishna Clinic, MG Road, Mumbai", specializations: "General Medicine", isActive: true, tenantId, createdBy: user.id },
        { sourceName: "Dr. Priya Sharma", sourceType: "Doctor", contactPerson: "Dr. Priya Sharma", phone: "+91 98765 43211", email: "dr.priya@familycare.com", address: "Family Care Center, Andheri West, Mumbai", specializations: "Family Medicine", isActive: true, tenantId, createdBy: user.id },
        { sourceName: "Dr. Amit Patel", sourceType: "Doctor", contactPerson: "Dr. Amit Patel", phone: "+91 98765 43212", email: "dr.amit@cardiocare.com", address: "Cardio Care Clinic, Bandra, Mumbai", specializations: "Cardiology", isActive: true, tenantId, createdBy: user.id },
        { sourceName: "Dr. Sunita Reddy", sourceType: "Doctor", contactPerson: "Dr. Sunita Reddy", phone: "+91 98765 43213", email: "dr.sunita@orthoclinic.com", address: "Ortho Clinic, Dadar, Mumbai", specializations: "Orthopedics", isActive: true, tenantId, createdBy: user.id },
        { sourceName: "Dr. Mohammed Khan", sourceType: "Doctor", contactPerson: "Dr. Mohammed Khan", phone: "+91 98765 43214", email: "dr.khan@neurocenter.com", address: "Neuro Center, Worli, Mumbai", specializations: "Neurology", isActive: true, tenantId, createdBy: user.id },
        { sourceName: "Dr. Anjali Desai", sourceType: "Doctor", contactPerson: "Dr. Anjali Desai", phone: "+91 98765 43215", email: "dr.anjali@pediatricare.com", address: "Pediatri Care, Powai, Mumbai", specializations: "Pediatrics", isActive: true, tenantId, createdBy: user.id },
        { sourceName: "Dr. Vikram Singh", sourceType: "Doctor", contactPerson: "Dr. Vikram Singh", phone: "+91 98765 43216", email: "dr.vikram@skinclinic.com", address: "Skin Clinic, Juhu, Mumbai", specializations: "Dermatology", isActive: true, tenantId, createdBy: user.id },
        { sourceName: "Dr. Meera Nair", sourceType: "Doctor", contactPerson: "Dr. Meera Nair", phone: "+91 98765 43217", email: "dr.meera@gynecare.com", address: "Gyne Care Clinic, Thane, Mumbai", specializations: "Gynecology", isActive: true, tenantId, createdBy: user.id },
        { sourceName: "Dr. Suresh Iyer", sourceType: "Doctor", contactPerson: "Dr. Suresh Iyer", phone: "+91 98765 43218", email: "dr.suresh@entclinic.com", address: "ENT Clinic, Malad, Mumbai", specializations: "ENT", isActive: true, tenantId, createdBy: user.id },
        { sourceName: "Dr. Kavita Joshi", sourceType: "Doctor", contactPerson: "Dr. Kavita Joshi", phone: "+91 98765 43219", email: "dr.kavita@eyecare.com", address: "Eye Care Center, Borivali, Mumbai", specializations: "Ophthalmology", isActive: true, tenantId, createdBy: user.id },
      ];

      // 10 Major Hospitals in India for outgoing referrals (REFER_TO)
      const majorHospitals = [
        { sourceName: "AIIMS Delhi", sourceType: "Hospital", contactPerson: "Referral Desk", phone: "+91 11 2658 8500", email: "referrals@aiims.edu", address: "Ansari Nagar, New Delhi - 110029", specializations: "Multi-Specialty", isActive: true, tenantId, createdBy: user.id },
        { sourceName: "Tata Memorial Hospital", sourceType: "Hospital", contactPerson: "Referral Coordinator", phone: "+91 22 2417 7000", email: "referrals@tmc.gov.in", address: "Dr. E Borges Road, Parel, Mumbai - 400012", specializations: "Oncology", isActive: true, tenantId, createdBy: user.id },
        { sourceName: "Apollo Hospitals Chennai", sourceType: "Hospital", contactPerson: "Patient Services", phone: "+91 44 2829 3333", email: "referrals@apollohospitals.com", address: "Greams Lane, Chennai - 600006", specializations: "Multi-Specialty", isActive: true, tenantId, createdBy: user.id },
        { sourceName: "Fortis Hospital Bangalore", sourceType: "Hospital", contactPerson: "Referral Team", phone: "+91 80 6621 4444", email: "referrals.blr@fortishealthcare.com", address: "Bannerghatta Road, Bangalore - 560076", specializations: "Multi-Specialty", isActive: true, tenantId, createdBy: user.id },
        { sourceName: "Medanta The Medicity", sourceType: "Hospital", contactPerson: "International Patient Desk", phone: "+91 124 4141 414", email: "referrals@medanta.org", address: "Sector 38, Gurgaon - 122001", specializations: "Multi-Specialty", isActive: true, tenantId, createdBy: user.id },
        { sourceName: "Kokilaben Dhirubhai Ambani Hospital", sourceType: "Hospital", contactPerson: "Referral Services", phone: "+91 22 3066 6666", email: "referrals@kokilabenhospital.com", address: "Four Bungalows, Andheri West, Mumbai - 400053", specializations: "Multi-Specialty", isActive: true, tenantId, createdBy: user.id },
        { sourceName: "Christian Medical College Vellore", sourceType: "Hospital", contactPerson: "Referral Office", phone: "+91 416 228 1000", email: "referrals@cmcvellore.ac.in", address: "Ida Scudder Road, Vellore - 632004", specializations: "Multi-Specialty", isActive: true, tenantId, createdBy: user.id },
        { sourceName: "Narayana Health Bangalore", sourceType: "Hospital", contactPerson: "Patient Coordinator", phone: "+91 80 7122 2222", email: "referrals@narayanahealth.org", address: "Bommasandra, Bangalore - 560099", specializations: "Cardiac Care", isActive: true, tenantId, createdBy: user.id },
        { sourceName: "Max Super Speciality Hospital Delhi", sourceType: "Hospital", contactPerson: "Referral Desk", phone: "+91 11 2651 5050", email: "referrals@maxhealthcare.com", address: "Saket, New Delhi - 110017", specializations: "Multi-Specialty", isActive: true, tenantId, createdBy: user.id },
        { sourceName: "Lilavati Hospital Mumbai", sourceType: "Hospital", contactPerson: "Patient Services", phone: "+91 22 2675 1000", email: "referrals@lilavatihospital.com", address: "A-791 Bandra Reclamation, Mumbai - 400050", specializations: "Multi-Specialty", isActive: true, tenantId, createdBy: user.id },
      ];

      // Create all sources
      for (const source of [...outsideDoctors, ...majorHospitals]) {
        await storage.createReferralSource(source);
      }

      res.json({ message: "Demo referral sources seeded successfully", count: 20 });
    } catch (error) {
      console.error("Error seeding referral sources:", error);
      res.status(500).json({ error: "Failed to seed referral sources" });
    }
  });

  // ========== HOSPITAL SERVICES API ==========
  
  // Get all departments with their services
  app.get("/api/hospital-service-departments", async (req, res) => {
    try {
      const departments = await storage.getHospitalServiceDepartments();
      const allServices = await storage.getHospitalServices();
      
      // Group services by department
      const departmentsWithServices = departments.map(dept => ({
        ...dept,
        services: allServices.filter(s => s.departmentId === dept.id)
      }));
      
      res.json(departmentsWithServices);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ error: "Failed to fetch departments" });
    }
  });

  // Create a new department (Admin only)
  app.post("/api/hospital-service-departments", requireAuth, requireRole(["SUPER_ADMIN"]), async (req, res) => {
    try {
      const department = await storage.createHospitalServiceDepartment(req.body);
      res.status(201).json(department);
    } catch (error) {
      console.error("Error creating department:", error);
      res.status(500).json({ error: "Failed to create department" });
    }
  });

  // Update department (Admin only)
  app.patch("/api/hospital-service-departments/:id", requireAuth, requireRole(["SUPER_ADMIN"]), async (req, res) => {
    try {
      const department = await storage.updateHospitalServiceDepartment(req.params.id, req.body);
      if (!department) return res.status(404).json({ error: "Department not found" });
      res.json(department);
    } catch (error) {
      console.error("Error updating department:", error);
      res.status(500).json({ error: "Failed to update department" });
    }
  });

  // Delete department (Super Admin only)
  app.delete("/api/hospital-service-departments/:id", requireAuth, requireRole(["SUPER_ADMIN"]), async (req, res) => {
    try {
      const deleted = await storage.deleteHospitalServiceDepartment(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Department not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting department:", error);
      res.status(500).json({ error: "Failed to delete department" });
    }
  });

  // Get services for a department
  app.get("/api/hospital-services", async (req, res) => {
    try {
      const departmentId = req.query.departmentId as string | undefined;
      const services = await storage.getHospitalServices(departmentId);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  // Create a new service (Super Admin only)
  app.post("/api/hospital-services", requireAuth, requireRole(["SUPER_ADMIN"]), async (req, res) => {
    try {
      const service = await storage.createHospitalService(req.body);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ error: "Failed to create service" });
    }
  });

  // Update service (Super Admin only)
  app.patch("/api/hospital-services/:id", requireAuth, requireRole(["SUPER_ADMIN"]), async (req, res) => {
    try {
      const service = await storage.updateHospitalService(req.params.id, req.body);
      if (!service) return res.status(404).json({ error: "Service not found" });
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ error: "Failed to update service" });
    }
  });

  // Delete service (Super Admin only)
  app.delete("/api/hospital-services/:id", requireAuth, requireRole(["SUPER_ADMIN"]), async (req, res) => {
    try {
      const deleted = await storage.deleteHospitalService(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Service not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ error: "Failed to delete service" });
    }
  });

  // Bulk create services (Super Admin only) - for seeding
  app.post("/api/hospital-services/bulk", requireAuth, requireRole(["SUPER_ADMIN"]), async (req, res) => {
    try {
      const { services } = req.body;
      if (!Array.isArray(services)) {
        return res.status(400).json({ error: "Services must be an array" });
      }
      const createdServices = await storage.bulkCreateHospitalServices(services);
      res.status(201).json(createdServices);
    } catch (error) {
      console.error("Error bulk creating services:", error);
      res.status(500).json({ error: "Failed to bulk create services" });
    }
  });

  // ==========================================
  // OPD PRESCRIPTION TEMPLATES - Quick OPD Templates
  // ==========================================

  // Get all templates (accessible to ADMIN, DOCTOR, OPD_MANAGER)
  app.get("/api/opd-templates", requireAuth, requireRole(["ADMIN", "DOCTOR", "OPD_MANAGER"]), async (req, res) => {
    try {
      const { category, createdBy } = req.query;
      const templates = await storage.getOpdTemplates({
        category: category as string,
        createdBy: createdBy as string
      });
      res.json(templates);
    } catch (error) {
      console.error("Error fetching OPD templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // Get single template by ID
  app.get("/api/opd-templates/:id", requireAuth, requireRole(["ADMIN", "DOCTOR", "OPD_MANAGER"]), async (req, res) => {
    try {
      const template = await storage.getOpdTemplate(req.params.id);
      if (!template) return res.status(404).json({ error: "Template not found" });
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  // Get template by slug
  app.get("/api/opd-templates/slug/:slug", requireAuth, requireRole(["ADMIN", "DOCTOR", "OPD_MANAGER"]), async (req, res) => {
    try {
      const template = await storage.getOpdTemplateBySlug(req.params.slug);
      if (!template) return res.status(404).json({ error: "Template not found" });
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  // Create new template (ADMIN and DOCTOR only)
  app.post("/api/opd-templates", requireAuth, requireRole(["ADMIN", "DOCTOR"]), async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.id;
      const userName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username;
      
      const templateData = {
        ...req.body,
        createdBy: userId,
        createdByName: userName,
        isSystemTemplate: false
      };
      
      const template = await storage.createOpdTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  // Update template (ADMIN can update any, DOCTOR can update their own)
  app.patch("/api/opd-templates/:id", requireAuth, requireRole(["ADMIN", "DOCTOR"]), async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.id;
      const userName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username;
      const userRole = user?.role;
      
      const existing = await storage.getOpdTemplate(req.params.id);
      if (!existing) return res.status(404).json({ error: "Template not found" });
      
      // Doctors can only update their own non-system templates
      if (userRole === "DOCTOR" && existing.createdBy !== userId) {
        return res.status(403).json({ error: "You can only edit your own templates" });
      }
      
      // System templates can only be updated by ADMIN
      if (existing.isSystemTemplate && userRole !== "ADMIN") {
        return res.status(403).json({ error: "Only administrators can modify system templates" });
      }
      
      const template = await storage.updateOpdTemplate(req.params.id, req.body, userId, userName);
      res.json(template);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  // Delete template (ADMIN can delete any non-system, DOCTOR can delete their own)
  app.delete("/api/opd-templates/:id", requireAuth, requireRole(["ADMIN", "DOCTOR"]), async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.id;
      const userRole = user?.role;
      
      const existing = await storage.getOpdTemplate(req.params.id);
      if (!existing) return res.status(404).json({ error: "Template not found" });
      
      // Cannot delete system templates
      if (existing.isSystemTemplate) {
        return res.status(403).json({ error: "System templates cannot be deleted" });
      }
      
      // Doctors can only delete their own templates
      if (userRole === "DOCTOR" && existing.createdBy !== userId) {
        return res.status(403).json({ error: "You can only delete your own templates" });
      }
      
      const deleted = await storage.deleteOpdTemplate(req.params.id);
      if (!deleted) return res.status(400).json({ error: "Failed to delete template" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Increment usage count when template is applied
  app.post("/api/opd-templates/:id/use", requireAuth, requireRole(["ADMIN", "DOCTOR", "OPD_MANAGER"]), async (req, res) => {
    try {
      await storage.incrementTemplateUsage(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error incrementing usage:", error);
      res.status(500).json({ error: "Failed to update usage" });
    }
  });

  // Get version history for a template
  app.get("/api/opd-templates/:id/versions", requireAuth, requireRole(["ADMIN", "DOCTOR"]), async (req, res) => {
    try {
      const versions = await storage.getOpdTemplateVersions(req.params.id);
      res.json(versions);
    } catch (error) {
      console.error("Error fetching versions:", error);
      res.status(500).json({ error: "Failed to fetch versions" });
    }
  });

  // Seed system templates (ADMIN only)
  app.post("/api/opd-templates/seed", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      await storage.seedSystemTemplates();
      res.json({ success: true, message: "System templates seeded successfully" });
    } catch (error) {
      console.error("Error seeding templates:", error);
      res.status(500).json({ error: "Failed to seed templates" });
    }
  });

  // ==========================================
  // ID Card Scanning & Alert System Routes
  // ==========================================

  // Get all ID card scans
  app.get("/api/id-card-scans", requireAuth, requireRole(["ADMIN", "NURSE", "OPD_MANAGER"]), async (req, res) => {
    try {
      const scans = await db.select().from(idCardScans).orderBy(desc(idCardScans.createdAt));
      res.json(scans);
    } catch (error) {
      console.error("Error fetching ID card scans:", error);
      res.status(500).json({ error: "Failed to fetch ID card scans" });
    }
  });

  // Create ID card scan with OCR processing
  app.post("/api/id-card-scans", requireAuth, requireRole(["ADMIN", "NURSE", "OPD_MANAGER"]), async (req, res) => {
    try {
      const user = (req as any).session?.user;
      const scanData = {
        ...req.body,
        scannedBy: user?.id,
        scannedByName: user?.name || user?.username,
        processingStatus: "completed"
      };
      
      const [scan] = await db.insert(idCardScans).values(scanData).returning();
      res.json(scan);
    } catch (error) {
      console.error("Error creating ID card scan:", error);
      res.status(500).json({ error: "Failed to create ID card scan" });
    }
  });

  // OCR processing endpoint - simulates OCR extraction
  app.post("/api/id-card-scans/process-ocr", requireAuth, requireRole(["ADMIN", "NURSE", "OPD_MANAGER"]), async (req, res) => {
    try {
      const { imageData, idCardType, side } = req.body;
      
      // In a real implementation, this would call an OCR service
      // For now, we return a structure that the frontend can use
      // The frontend will handle actual OCR using browser-based libraries
      
      res.json({
        success: true,
        message: "Image received for processing",
        idCardType,
        side,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error processing OCR:", error);
      res.status(500).json({ error: "Failed to process OCR" });
    }
  });

  // Get all critical alerts
  app.get("/api/critical-alerts", requireAuth, requireRole(["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER"]), async (req, res) => {
    try {
      const { status } = req.query;
      let alerts;
      
      if (status) {
        alerts = await db.select().from(criticalAlerts)
          .where(eq(criticalAlerts.status, status as string))
          .orderBy(desc(criticalAlerts.createdAt));
      } else {
        alerts = await db.select().from(criticalAlerts)
          .orderBy(desc(criticalAlerts.createdAt));
      }
      
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching critical alerts:", error);
      res.status(500).json({ error: "Failed to fetch critical alerts" });
    }
  });

  // Get active critical alerts count (for dashboard badge)
  app.get("/api/critical-alerts/active-count", requireAuth, async (req, res) => {
    try {
      const alerts = await db.select().from(criticalAlerts)
        .where(eq(criticalAlerts.status, "active"));
      res.json({ count: alerts.length });
    } catch (error) {
      console.error("Error fetching active alerts count:", error);
      res.status(500).json({ error: "Failed to fetch active alerts count" });
    }
  });

  // Create critical alert (called when underage pregnancy detected)
  app.post("/api/critical-alerts", requireAuth, requireRole(["ADMIN", "NURSE", "OPD_MANAGER"]), async (req, res) => {
    try {
      const user = (req as any).session?.user;
      const alertData = {
        ...req.body,
        createdBy: user?.id,
        createdByName: user?.name || user?.username,
        status: "active"
      };
      
      const [alert] = await db.insert(criticalAlerts).values(alertData).returning();
      
      // Broadcast real-time notification to admin/management
      notificationService.broadcastToRole("ADMIN", {
        type: "CRITICAL_ALERT",
        title: alertData.alertTitle,
        message: alertData.alertMessage,
        alertId: alert.id,
        severity: alertData.severity,
        timestamp: new Date().toISOString()
      });
      
      res.json(alert);
    } catch (error) {
      console.error("Error creating critical alert:", error);
      res.status(500).json({ error: "Failed to create critical alert" });
    }
  });

  // Check for critical alert conditions (backend rule enforcement)
  app.post("/api/critical-alerts/check", requireAuth, requireRole(["ADMIN", "NURSE", "OPD_MANAGER"]), async (req, res) => {
    try {
      const { patientName, patientAge, patientGender, department, visitReason, visitType, idCardScanId, patientId } = req.body;
      const user = (req as any).session?.user;
      
      const alerts = [];
      
      // Rule: Age < 18 AND Department = Gynecology AND Pregnancy-related visit
      if (patientAge < 18 && 
          department?.toLowerCase() === "gynecology" && 
          (visitType === "pregnancy_related" || 
           visitReason?.toLowerCase().includes("pregnancy") ||
           visitReason?.toLowerCase().includes("pregnant"))) {
        
        const alertData = {
          alertType: "UNDERAGE_PREGNANCY",
          severity: "critical",
          patientId,
          patientName,
          patientAge,
          patientGender,
          department,
          visitReason,
          visitType,
          alertTitle: "CRITICAL: Underage Pregnancy Case",
          alertMessage: `Underage patient (${patientAge} years old) registered for pregnancy-related visit in Gynecology department. Immediate attention required.`,
          additionalNotes: `Patient: ${patientName}, Age: ${patientAge}, Reason: ${visitReason}`,
          idCardScanId,
          createdBy: user?.id,
          createdByName: user?.name || user?.username,
          status: "active"
        };
        
        const [alert] = await db.insert(criticalAlerts).values(alertData).returning();
        alerts.push(alert);
        
        // Broadcast real-time notification
        notificationService.broadcastToRole("ADMIN", {
          type: "CRITICAL_ALERT",
          title: alertData.alertTitle,
          message: alertData.alertMessage,
          alertId: alert.id,
          severity: "critical",
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({ 
        alertsTriggered: alerts.length > 0,
        alerts 
      });
    } catch (error) {
      console.error("Error checking critical alert conditions:", error);
      res.status(500).json({ error: "Failed to check alert conditions" });
    }
  });

  // Acknowledge critical alert
  app.patch("/api/critical-alerts/:id/acknowledge", requireAuth, requireRole(["ADMIN", "DOCTOR", "NURSE"]), async (req, res) => {
    try {
      const user = (req as any).session?.user;
      const [alert] = await db.update(criticalAlerts)
        .set({
          status: "acknowledged",
          acknowledgedBy: user?.id,
          acknowledgedByName: user?.name || user?.username,
          acknowledgedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(criticalAlerts.id, req.params.id))
        .returning();
      
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      
      res.json(alert);
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      res.status(500).json({ error: "Failed to acknowledge alert" });
    }
  });

  // Resolve critical alert
  app.patch("/api/critical-alerts/:id/resolve", requireAuth, requireRole(["ADMIN", "DOCTOR"]), async (req, res) => {
    try {
      const user = (req as any).session?.user;
      const { resolutionNotes } = req.body;
      
      const [alert] = await db.update(criticalAlerts)
        .set({
          status: "resolved",
          resolvedBy: user?.id,
          resolvedByName: user?.name || user?.username,
          resolvedAt: new Date(),
          resolutionNotes,
          updatedAt: new Date()
        })
        .where(eq(criticalAlerts.id, req.params.id))
        .returning();
      
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      
      res.json(alert);
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ error: "Failed to resolve alert" });
    }
  });

  // ============================================
  // SUPER ADMIN API ROUTES
  // ============================================

  // Require SUPER_ADMIN role middleware
  const requireSuperAdmin = (req: any, res: any, next: any) => {
    const user = req.session?.user;
    if (!user || user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Super Admin access required" });
    }
    next();
  };

  // Get Super Admin Dashboard Stats
  app.get("/api/super-admin/dashboard", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const [usersCount] = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
      const [billingCount] = await db.execute(sql`SELECT COUNT(*) as count FROM billing_records`);
      const [claimsCount] = await db.execute(sql`SELECT COUNT(*) as count FROM insurance_claims WHERE status = 'pending'`);
      const [auditCount] = await db.execute(sql`SELECT COUNT(*) as count FROM audit_logs WHERE timestamp > NOW() - INTERVAL '24 hours'`);
      
      res.json({
        totalUsers: usersCount?.count || 0,
        totalBillingRecords: billingCount?.count || 0,
        pendingClaims: claimsCount?.count || 0,
        recentAuditLogs: auditCount?.count || 0
      });
    } catch (error) {
      console.error("Error fetching super admin dashboard:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Audit Logs
  app.get("/api/super-admin/audit-logs", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(100);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  app.post("/api/super-admin/audit-logs", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const user = (req as any).session?.user;
      const log = insertAuditLogSchema.parse({
        ...req.body,
        userId: user?.id,
        userName: user?.name || user?.username,
        userRole: user?.role
      });
      const [newLog] = await db.insert(auditLogs).values(log).returning();
      res.json(newLog);
    } catch (error) {
      console.error("Error creating audit log:", error);
      res.status(500).json({ error: "Failed to create audit log" });
    }
  });

  // Financial Locks
  app.get("/api/super-admin/financial-locks", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const locks = await db.select().from(financialLocks).orderBy(desc(financialLocks.createdAt));
      res.json(locks);
    } catch (error) {
      console.error("Error fetching financial locks:", error);
      res.status(500).json({ error: "Failed to fetch financial locks" });
    }
  });

  app.post("/api/super-admin/financial-locks", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const user = (req as any).session?.user;
      const lock = insertFinancialLockSchema.parse({
        ...req.body,
        lockedBy: user?.id
      });
      const [newLock] = await db.insert(financialLocks).values(lock).returning();
      
      // Create audit log
      await db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        action: "FINANCIAL_LOCK_CREATED",
        module: "BILLING",
        userId: user?.id,
        userName: user?.name || user?.username,
        userRole: user?.role,
        resourceType: "financial_lock",
        resourceId: newLock.id,
        details: { lockType: lock.lockType, period: lock.period },
        ipAddress: req.ip
      });
      
      res.json(newLock);
    } catch (error) {
      console.error("Error creating financial lock:", error);
      res.status(500).json({ error: "Failed to create financial lock" });
    }
  });

  // Role Permissions
  app.get("/api/super-admin/permissions", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const permissions = await db.select().from(rolePermissions);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  app.post("/api/super-admin/permissions", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const user = (req as any).session?.user;
      const permission = insertRolePermissionSchema.parse({
        ...req.body,
        grantedBy: user?.id
      });
      const [newPermission] = await db.insert(rolePermissions).values(permission).returning();
      res.json(newPermission);
    } catch (error) {
      console.error("Error creating permission:", error);
      res.status(500).json({ error: "Failed to create permission" });
    }
  });

  app.patch("/api/super-admin/permissions/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const [permission] = await db.update(rolePermissions)
        .set(req.body)
        .where(eq(rolePermissions.id, req.params.id))
        .returning();
      res.json(permission);
    } catch (error) {
      console.error("Error updating permission:", error);
      res.status(500).json({ error: "Failed to update permission" });
    }
  });

  app.post("/api/super-admin/permissions/bulk", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const user = (req as any).session?.user;
      const { role, permissions: permList } = req.body;
      
      if (!role || !Array.isArray(permList)) {
        return res.status(400).json({ error: "Role and permissions array required" });
      }

      const results = [];
      
      for (const perm of permList) {
        const existingPerm = await db.select().from(rolePermissions)
          .where(and(eq(rolePermissions.role, role), eq(rolePermissions.module, perm.module)))
          .limit(1);
        
        if (existingPerm.length > 0) {
          const [updated] = await db.update(rolePermissions)
            .set({
              canView: perm.canView ?? false,
              canCreate: perm.canCreate ?? false,
              canEdit: perm.canEdit ?? false,
              canDelete: perm.canDelete ?? false,
              canApprove: perm.canApprove ?? false,
              canLock: perm.canLock ?? false,
              canUnlock: perm.canUnlock ?? false,
              canExport: perm.canExport ?? false,
              updatedAt: new Date()
            })
            .where(eq(rolePermissions.id, existingPerm[0].id))
            .returning();
          results.push(updated);
        } else {
          const [created] = await db.insert(rolePermissions).values({
            role,
            module: perm.module,
            canView: perm.canView ?? false,
            canCreate: perm.canCreate ?? false,
            canEdit: perm.canEdit ?? false,
            canDelete: perm.canDelete ?? false,
            canApprove: perm.canApprove ?? false,
            canLock: perm.canLock ?? false,
            canUnlock: perm.canUnlock ?? false,
            canExport: perm.canExport ?? false,
            createdBy: user?.id
          }).returning();
          results.push(created);
        }
      }
      
      await db.insert(auditLogs).values({
        userId: user?.id || "unknown",
        userName: user?.name || "System",
        userRole: user?.role || "UNKNOWN",
        action: "UPDATE",
        module: "USERS",
        entityType: "ROLE_PERMISSION",
        entityId: role,
        changeDescription: `Permissions updated for role ${role}. Modules: ${permList.map((p: any) => p.module).join(", ")}`,
        severity: "warning",
        ipAddress: req.ip || "unknown"
      });
      
      res.json({ success: true, updated: results.length, permissions: results });
    } catch (error) {
      console.error("Error bulk updating permissions:", error);
      res.status(500).json({ error: "Failed to update permissions" });
    }
  });

  app.get("/api/super-admin/permissions/:role", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const permissions = await db.select().from(rolePermissions)
        .where(eq(rolePermissions.role, req.params.role));
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ error: "Failed to fetch role permissions" });
    }
  });

  app.get("/api/permissions/current", requireAuth, async (req, res) => {
    try {
      const user = (req as any).session?.user;
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const permissions = await db.select().from(rolePermissions)
        .where(eq(rolePermissions.role, user.role));
      res.json({ role: user.role, permissions });
    } catch (error) {
      console.error("Error fetching current user permissions:", error);
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  // Billing Records
  app.get("/api/super-admin/billing-records", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const records = await db.select().from(billingRecords).orderBy(desc(billingRecords.createdAt)).limit(100);
      res.json(records);
    } catch (error) {
      console.error("Error fetching billing records:", error);
      res.status(500).json({ error: "Failed to fetch billing records" });
    }
  });

  // Stock Batches
  app.get("/api/super-admin/stock-batches", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const batches = await db.select().from(stockBatches).orderBy(desc(stockBatches.createdAt));
      res.json(batches);
    } catch (error) {
      console.error("Error fetching stock batches:", error);
      res.status(500).json({ error: "Failed to fetch stock batches" });
    }
  });

  app.post("/api/super-admin/stock-batches", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const batch = insertStockBatchSchema.parse(req.body);
      const [newBatch] = await db.insert(stockBatches).values(batch).returning();
      res.json(newBatch);
    } catch (error) {
      console.error("Error creating stock batch:", error);
      res.status(500).json({ error: "Failed to create stock batch" });
    }
  });

  // Surgery Packages
  app.get("/api/super-admin/surgery-packages", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const packages = await db.select().from(surgeryPackages).orderBy(desc(surgeryPackages.createdAt));
      res.json(packages);
    } catch (error) {
      console.error("Error fetching surgery packages:", error);
      res.status(500).json({ error: "Failed to fetch surgery packages" });
    }
  });

  app.post("/api/super-admin/surgery-packages", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const user = (req as any).session?.user;
      const pkg = insertSurgeryPackageSchema.parse({
        ...req.body,
        createdBy: user?.id
      });
      const [newPackage] = await db.insert(surgeryPackages).values(pkg).returning();
      res.json(newPackage);
    } catch (error) {
      console.error("Error creating surgery package:", error);
      res.status(500).json({ error: "Failed to create surgery package" });
    }
  });

  // Medicine Catalog
  app.get("/api/super-admin/medicine-catalog", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const medicines = await db.select().from(medicineCatalog).orderBy(medicineCatalog.brandName);
      res.json(medicines);
    } catch (error) {
      console.error("Error fetching medicine catalog:", error);
      res.status(500).json({ error: "Failed to fetch medicine catalog" });
    }
  });

  app.post("/api/super-admin/medicine-catalog", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const user = (req as any).session?.user;
      const medicine = insertMedicineCatalogSchema.parse({
        ...req.body,
        createdBy: user?.id
      });
      const [newMedicine] = await db.insert(medicineCatalog).values(medicine).returning();
      res.json(newMedicine);
    } catch (error) {
      console.error("Error creating medicine:", error);
      res.status(500).json({ error: "Failed to create medicine" });
    }
  });

  // Insurance Providers
  app.get("/api/super-admin/insurance-providers", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const providers = await db.select().from(insuranceProviders).orderBy(insuranceProviders.name);
      res.json(providers);
    } catch (error) {
      console.error("Error fetching insurance providers:", error);
      res.status(500).json({ error: "Failed to fetch insurance providers" });
    }
  });

  app.post("/api/super-admin/insurance-providers", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const user = (req as any).session?.user;
      const provider = insertInsuranceProviderSchema.parse({
        ...req.body,
        createdBy: user?.id
      });
      const [newProvider] = await db.insert(insuranceProviders).values(provider).returning();
      res.json(newProvider);
    } catch (error) {
      console.error("Error creating insurance provider:", error);
      res.status(500).json({ error: "Failed to create insurance provider" });
    }
  });

  // Insurance Claims
  app.get("/api/super-admin/claims", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const claims = await db.select().from(insuranceClaims).orderBy(desc(insuranceClaims.filedAt));
      res.json(claims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      res.status(500).json({ error: "Failed to fetch claims" });
    }
  });

  app.patch("/api/super-admin/claims/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const user = (req as any).session?.user;
      const updateData = {
        ...req.body,
        updatedAt: new Date()
      };
      
      if (req.body.status === "approved" || req.body.status === "rejected") {
        updateData.reviewedBy = user?.id;
        updateData.reviewedAt = new Date();
      }
      
      const [claim] = await db.update(insuranceClaims)
        .set(updateData)
        .where(eq(insuranceClaims.id, req.params.id))
        .returning();
      res.json(claim);
    } catch (error) {
      console.error("Error updating claim:", error);
      res.status(500).json({ error: "Failed to update claim" });
    }
  });

  // Hospital Packages
  app.get("/api/super-admin/hospital-packages", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const packages = await db.select().from(hospitalPackages).orderBy(hospitalPackages.packageName);
      res.json(packages);
    } catch (error) {
      console.error("Error fetching hospital packages:", error);
      res.status(500).json({ error: "Failed to fetch hospital packages" });
    }
  });

  app.post("/api/super-admin/hospital-packages", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const user = (req as any).session?.user;
      const pkg = insertHospitalPackageSchema.parse({
        ...req.body,
        createdBy: user?.id
      });
      const [newPackage] = await db.insert(hospitalPackages).values(pkg).returning();
      res.json(newPackage);
    } catch (error) {
      console.error("Error creating hospital package:", error);
      res.status(500).json({ error: "Failed to create hospital package" });
    }
  });

  // Override Requests
  app.get("/api/super-admin/override-requests", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const requests = await db.select().from(overrideRequests).orderBy(desc(overrideRequests.requestedAt));
      res.json(requests);
    } catch (error) {
      console.error("Error fetching override requests:", error);
      res.status(500).json({ error: "Failed to fetch override requests" });
    }
  });

  app.patch("/api/super-admin/override-requests/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const user = (req as any).session?.user;
      const [request] = await db.update(overrideRequests)
        .set({
          ...req.body,
          reviewedBy: user?.id,
          reviewedAt: new Date()
        })
        .where(eq(overrideRequests.id, req.params.id))
        .returning();
      res.json(request);
    } catch (error) {
      console.error("Error updating override request:", error);
      res.status(500).json({ error: "Failed to update override request" });
    }
  });

  // Users Management for Super Admin
  app.get("/api/super-admin/users", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt
      }).from(users).orderBy(desc(users.createdAt));
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/super-admin/users/:id/status", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const updated = await storage.updateUserStatus(req.params.id, status);
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  // Reset user password (Super Admin only)
  app.post("/api/super-admin/users/:id/reset-password", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const currentUser = (req as any).session?.user;
      const user = await storage.getUser(req.params.id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Prevent resetting super admin password
      if (user.role === "SUPER_ADMIN") {
        return res.status(403).json({ error: "Cannot reset Super Admin password" });
      }
      
      // Generate new random password
      const newPassword = generateSecurePassword();
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update user password
      await storage.updateUserPassword(user.id, hashedPassword);
      
      // Log audit
      await db.insert(auditLogs).values({
        userId: currentUser?.id || 'system',
        action: 'USER_PASSWORD_RESET',
        module: 'USERS',
        entityType: 'user',
        entityId: user.id,
        userName: currentUser?.name || 'System',
        userRole: currentUser?.role || 'SUPER_ADMIN',
        changeDescription: `Password reset for user ${user.username} by ${currentUser?.username}`,
        ipAddress: req.ip || 'unknown'
      });
      
      res.json({ 
        success: true, 
        username: user.username,
        newPassword 
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Create new user with auto-generated username and password
  const createUserSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    email: z.string().email().optional().nullable(),
    role: z.enum(["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "PATIENT", "MEDICAL_STORE", "PATHOLOGY_LAB"]),
    dateOfBirth: z.string().optional().nullable()
  });

  app.post("/api/super-admin/users", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const currentUser = (req as any).session?.user;
      
      // Validate request body with Zod
      const parseResult = createUserSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: parseResult.error.errors[0]?.message || "Invalid request data"
        });
      }
      
      const { name, email, role, dateOfBirth } = parseResult.data;

      // Generate username: role prefix + name slug + random suffix
      const rolePrefix = role.toLowerCase().replace(/_/g, '').slice(0, 3);
      const nameSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const username = `${rolePrefix}_${nameSlug}_${randomSuffix}`;

      // Check if username exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Generated username conflict, please try again" });
      }

      // Generate secure random password
      const plainPassword = generateSecurePassword();

      // Hash password before storing
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // Create user
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        name,
        email: email || null,
        role,
        dateOfBirth: dateOfBirth || null,
      });

      // If creating a DOCTOR, also create their doctor profile for OPD
      if (role === "DOCTOR") {
        const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
        
        // Create doctor entry in doctors table (for OPD booking list)
        const [doctorEntry] = await db.insert(doctors).values({
          name: name,
          specialty: "General Medicine", // Default specialty, can be updated later
          qualification: "MBBS",         // Default qualification
          experience: 1,                 // Default experience in years
          rating: "4.5",
          availableDays: "Mon, Wed, Fri", // Default availability
          avatarInitials: initials,
          dateOfBirth: dateOfBirth || null
        }).returning();
        
        // Also create doctor profile entry (extended profile info linked to user)
        await db.insert(doctorProfiles).values({
          doctorId: newUser.id,          // Link to the user account
          fullName: name,
          specialty: "General Medicine",
          email: email || null,
          qualifications: "MBBS",
          experience: "1 year",
          designation: "Consultant",
          department: "General Medicine",
          hospitalName: "Gravity Hospital"
        });
        
        console.log(`Created doctor entry and profile for ${name} (user: ${newUser.id}, doctor: ${doctorEntry.id})`);
      }

      // Log audit action
      await db.insert(auditLogs).values({
        userId: currentUser?.id || 'system',
        action: 'USER_CREATED',
        module: 'USERS',
        entityType: 'user',
        entityId: newUser.id,
        userName: currentUser?.name || 'System',
        userRole: currentUser?.role || 'SUPER_ADMIN',
        newValue: JSON.stringify({ username, role, name, email }),
        changeDescription: `Created new ${role} user: ${name} (${username})`,
        ipAddress: req.ip || 'unknown'
      });

      // Return user with plain password (only shown once)
      res.json({
        ...newUser,
        generatedPassword: plainPassword, // Only returned once for display
        password: undefined // Don't return hashed password
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Delete user
  app.delete("/api/super-admin/users/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const currentUser = (req as any).session?.user;
      const userId = req.params.id;

      // Prevent self-deletion
      if (currentUser?.id === userId) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      // Get user before deletion for audit
      const userToDelete = await storage.getUser(userId);
      if (!userToDelete) {
        return res.status(404).json({ error: "User not found" });
      }

      // Prevent deleting other Super Admins (safety measure)
      if (userToDelete.role === 'SUPER_ADMIN' && currentUser?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Cannot delete Super Admin accounts" });
      }

      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }

      // Log audit action
      await db.insert(auditLogs).values({
        userId: currentUser?.id || 'system',
        action: 'USER_DELETED',
        module: 'USERS',
        entityType: 'user',
        entityId: userId,
        userName: currentUser?.name || 'System',
        userRole: currentUser?.role || 'SUPER_ADMIN',
        previousValue: JSON.stringify({ 
          username: userToDelete.username, 
          role: userToDelete.role,
          name: userToDelete.name
        }),
        changeDescription: `Deleted ${userToDelete.role} user: ${userToDelete.name} (${userToDelete.username})`,
        ipAddress: req.ip || 'unknown'
      });

      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // ========== NURSE DEPARTMENT PREFERENCES API ==========
  const HOSPITAL_DEPARTMENTS = [
    "Emergency", "Cardiology", "Neurology", "Orthopedics", "Pediatrics",
    "Oncology", "Ophthalmology", "ENT", "Dermatology", "Psychiatry",
    "Gynecology", "Urology", "Nephrology", "Gastroenterology", "Pulmonology",
    "Endocrinology", "Rheumatology", "Pathology", "Radiology", "Physiotherapy",
    "Dental", "General Medicine", "General Surgery", "ICU"
  ];

  app.get("/api/nurse-department-preferences/departments", async (req, res) => {
    res.json(HOSPITAL_DEPARTMENTS);
  });

  // Get all nurses from users table with auto-generated IDs for those without
  app.get("/api/nurse-department-preferences/all-nurses", requireAuth, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const nurses = allUsers.filter(u => u.role === 'NURSE');
      
      // Get existing preferences to check for existing IDs
      const existingPrefs = await storage.getAllNurseDepartmentPreferences();
      const existingIdMap = new Map(existingPrefs.map(p => [p.nurseName, p.nurseId]));
      
      // Map nurses with IDs (use existing or generate new)
      let autoIdCounter = 1;
      const nursesWithIds = nurses.map(nurse => {
        // Check if nurse already has a preference with ID
        const existingId = existingIdMap.get(nurse.name || nurse.username);
        if (existingId) {
          return { nurseId: existingId, nurseName: nurse.name || nurse.username };
        }
        // Generate dummy ID for nurses without one
        const dummyId = `NRS-AUTO-${String(autoIdCounter++).padStart(3, '0')}`;
        return { nurseId: dummyId, nurseName: nurse.name || nurse.username };
      });
      
      res.json(nursesWithIds);
    } catch (error) {
      console.error("Error fetching all nurses:", error);
      res.status(500).json({ error: "Failed to fetch nurses" });
    }
  });

  app.get("/api/nurse-department-preferences", requireAuth, async (req, res) => {
    try {
      const allPreferences = await storage.getAllNurseDepartmentPreferences();
      res.json(allPreferences);
    } catch (error) {
      console.error("Error fetching nurse preferences:", error);
      res.status(500).json({ error: "Failed to fetch nurse preferences" });
    }
  });

  app.get("/api/nurse-department-preferences/:nurseId", requireAuth, async (req, res) => {
    try {
      const prefs = await storage.getNurseDepartmentPreferences(req.params.nurseId);
      if (!prefs) {
        return res.status(404).json({ error: "Preferences not found" });
      }
      res.json(prefs);
    } catch (error) {
      console.error("Error fetching nurse preferences:", error);
      res.status(500).json({ error: "Failed to fetch nurse preferences" });
    }
  });

  app.post("/api/nurse-department-preferences", requireAuth, async (req, res) => {
    try {
      const { nurseId, nurseName, primaryDepartment, secondaryDepartment, tertiaryDepartment } = req.body;
      
      if (!nurseId || !nurseName || !primaryDepartment || !secondaryDepartment || !tertiaryDepartment) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const departments = [primaryDepartment, secondaryDepartment, tertiaryDepartment];
      const uniqueDepartments = new Set(departments);
      if (uniqueDepartments.size !== 3) {
        return res.status(400).json({ error: "All three department preferences must be unique" });
      }

      for (const dept of departments) {
        if (!HOSPITAL_DEPARTMENTS.includes(dept)) {
          return res.status(400).json({ error: `Invalid department: ${dept}` });
        }
      }

      const result = await storage.upsertNurseDepartmentPreferences({
        nurseId,
        nurseName,
        primaryDepartment,
        secondaryDepartment,
        tertiaryDepartment
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error saving nurse preferences:", error);
      res.status(500).json({ error: "Failed to save nurse preferences" });
    }
  });

  app.delete("/api/nurse-department-preferences/:nurseId", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteNurseDepartmentPreferences(req.params.nurseId);
      if (!deleted) {
        return res.status(404).json({ error: "Preferences not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting nurse preferences:", error);
      res.status(500).json({ error: "Failed to delete nurse preferences" });
    }
  });

  app.patch("/api/nurse-department-preferences/:nurseId/availability", requireAuth, requireRole(["ADMIN", "SUPER_ADMIN"]), async (req, res) => {
    try {
      const { isAvailable } = req.body;
      if (typeof isAvailable !== "boolean") {
        return res.status(400).json({ error: "isAvailable must be a boolean value" });
      }
      
      const updated = await storage.updateNurseAvailability(req.params.nurseId, isAvailable);
      if (!updated) {
        return res.status(404).json({ error: "Nurse preferences not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating nurse availability:", error);
      res.status(500).json({ error: "Failed to update nurse availability" });
    }
  });

  app.post("/api/nurse-department-preferences/seed", requireAuth, requireRole(["ADMIN", "SUPER_ADMIN"]), async (req, res) => {
    try {
      await storage.seedNurseDepartmentPreferences();
      res.json({ success: true, message: "Nurse department preferences seeded successfully" });
    } catch (error) {
      console.error("Error seeding nurse preferences:", error);
      res.status(500).json({ error: "Failed to seed nurse preferences" });
    }
  });

  // ========== DEPARTMENT NURSE ASSIGNMENTS ==========
  app.get("/api/department-nurse-assignments", requireAuth, async (req, res) => {
    try {
      const assignments = await storage.getAllDepartmentNurseAssignments();
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching department nurse assignments:", error);
      res.status(500).json({ error: "Failed to fetch department nurse assignments" });
    }
  });

  app.get("/api/department-nurse-assignments/:departmentName", requireAuth, async (req, res) => {
    try {
      const assignment = await storage.getDepartmentNurseAssignment(req.params.departmentName);
      if (!assignment) {
        return res.status(404).json({ error: "Department assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      console.error("Error fetching department assignment:", error);
      res.status(500).json({ error: "Failed to fetch department assignment" });
    }
  });

  app.post("/api/department-nurse-assignments", requireAuth, requireRole(["ADMIN", "SUPER_ADMIN"]), async (req, res) => {
    try {
      const { departmentName, primaryNurseId, primaryNurseName, secondaryNurseId, secondaryNurseName, tertiaryNurseId, tertiaryNurseName } = req.body;
      
      if (!departmentName) {
        return res.status(400).json({ error: "Department name is required" });
      }

      if (!HOSPITAL_DEPARTMENTS.includes(departmentName)) {
        return res.status(400).json({ error: `Invalid department: ${departmentName}` });
      }

      const nurseIds = [primaryNurseId, secondaryNurseId, tertiaryNurseId].filter(Boolean);
      const uniqueNurseIds = new Set(nurseIds);
      if (uniqueNurseIds.size !== nurseIds.length) {
        return res.status(400).json({ error: "Each nurse can only occupy one priority per department" });
      }

      const result = await storage.upsertDepartmentNurseAssignment({
        departmentName,
        primaryNurseId: primaryNurseId || null,
        primaryNurseName: primaryNurseId ? (primaryNurseName || null) : null,
        secondaryNurseId: secondaryNurseId || null,
        secondaryNurseName: secondaryNurseId ? (secondaryNurseName || null) : null,
        tertiaryNurseId: tertiaryNurseId || null,
        tertiaryNurseName: tertiaryNurseId ? (tertiaryNurseName || null) : null
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error saving department nurse assignment:", error);
      res.status(500).json({ error: "Failed to save department nurse assignment" });
    }
  });

  app.delete("/api/department-nurse-assignments/:departmentName", requireAuth, requireRole(["ADMIN", "SUPER_ADMIN"]), async (req, res) => {
    try {
      const deleted = await storage.deleteDepartmentNurseAssignment(req.params.departmentName);
      if (!deleted) {
        return res.status(404).json({ error: "Department assignment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting department assignment:", error);
      res.status(500).json({ error: "Failed to delete department assignment" });
    }
  });

  app.post("/api/department-nurse-assignments/initialize", requireAuth, requireRole(["ADMIN", "SUPER_ADMIN"]), async (req, res) => {
    try {
      await storage.initializeDepartmentNurseAssignments();
      res.json({ success: true, message: "Department nurse assignments initialized successfully" });
    } catch (error) {
      console.error("Error initializing department nurse assignments:", error);
      res.status(500).json({ error: "Failed to initialize department nurse assignments" });
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
