import { type User, type InsertUser, type Doctor, type InsertDoctor, type Schedule, type InsertSchedule, type Appointment, type InsertAppointment, type InventoryItem, type InsertInventoryItem, type StaffMember, type InsertStaffMember, type InventoryPatient, type InsertInventoryPatient, type InventoryTransaction, type InsertInventoryTransaction, type TrackingPatient, type InsertTrackingPatient, type Medication, type InsertMedication, type Meal, type InsertMeal, type Vitals, type InsertVitals, type DoctorVisit, type InsertDoctorVisit, type ConversationLog, type InsertConversationLog, type ServicePatient, type InsertServicePatient, type Admission, type InsertAdmission, type MedicalRecord, type InsertMedicalRecord, type BiometricTemplate, type InsertBiometricTemplate, type BiometricVerification, type InsertBiometricVerification, type Notification, type InsertNotification, type HospitalTeamMember, type InsertHospitalTeamMember, type ActivityLog, type InsertActivityLog, type Equipment, type InsertEquipment, type ServiceHistory, type InsertServiceHistory, type EmergencyContact, type InsertEmergencyContact, type HospitalSettings, type InsertHospitalSettings, type Prescription, type InsertPrescription, type DoctorSchedule, type InsertDoctorSchedule, type DoctorPatient, type InsertDoctorPatient, type DoctorProfile, type InsertDoctorProfile, type PatientProfile, type InsertPatientProfile, type UserNotification, type InsertUserNotification, type ConsentForm, type InsertConsentForm, type Medicine, type InsertMedicine, type DoctorOathConfirmation, type InsertDoctorOathConfirmation, type ConsentTemplate, type InsertConsentTemplate } from "@shared/schema";
import { randomUUID, randomBytes, createCipheriv, createDecipheriv } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getDoctors(): Promise<Doctor[]>;
  getDoctor(id: string): Promise<Doctor | undefined>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  
  getSchedules(doctorId: string, date?: string): Promise<Schedule[]>;
  getSchedulesByDate(date: string): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateScheduleBookedStatus(id: string, isBooked: boolean): Promise<Schedule | undefined>;
  findAndBookScheduleSlot(doctorId: string, date: string, timeSlot: string): Promise<Schedule | undefined>;
  
  getAppointments(): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  getAppointmentsByStatus(status: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointmentStatus(id: string, status: string): Promise<Appointment | undefined>;
  
  // Inventory Items
  getAllInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItemById(id: string): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  updateInventoryItemStock(id: string, newStock: number): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: string): Promise<boolean>;
  getLowStockItems(): Promise<InventoryItem[]>;
  
  // Staff Members
  getAllStaffMembers(): Promise<StaffMember[]>;
  getStaffMemberById(id: string): Promise<StaffMember | undefined>;
  createStaffMember(staff: InsertStaffMember): Promise<StaffMember>;
  
  // Inventory Patients
  getAllInventoryPatients(): Promise<InventoryPatient[]>;
  getInventoryPatientById(id: string): Promise<InventoryPatient | undefined>;
  createInventoryPatient(patient: InsertInventoryPatient): Promise<InventoryPatient>;
  
  // Inventory Transactions
  getAllInventoryTransactions(): Promise<InventoryTransaction[]>;
  getTransactionsByItem(itemId: string): Promise<InventoryTransaction[]>;
  getTransactionsByPatient(patientId: string): Promise<InventoryTransaction[]>;
  getTransactionsByStaff(staffId: string): Promise<InventoryTransaction[]>;
  createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction>;
  
  // Reports
  getInventoryReports(): Promise<any>;
  getPatientWiseReport(): Promise<any[]>;
  getStaffWiseReport(): Promise<any[]>;
  
  // Patient Tracking
  getAllTrackingPatients(): Promise<TrackingPatient[]>;
  getTrackingPatientById(id: string): Promise<TrackingPatient | undefined>;
  createTrackingPatient(patient: InsertTrackingPatient): Promise<TrackingPatient>;
  updateTrackingPatientStatus(id: string, status: string): Promise<TrackingPatient | undefined>;
  dischargeTrackingPatient(id: string, dischargeDate: Date): Promise<TrackingPatient | undefined>;
  deleteTrackingPatient(id: string): Promise<boolean>;
  
  // Medications
  getMedicationsByPatient(patientId: string): Promise<Medication[]>;
  createMedication(medication: InsertMedication): Promise<Medication>;
  
  // Meals
  getMealsByPatient(patientId: string): Promise<Meal[]>;
  createMeal(meal: InsertMeal): Promise<Meal>;
  
  // Vitals
  getVitalsByPatient(patientId: string): Promise<Vitals[]>;
  createVitals(vitals: InsertVitals): Promise<Vitals>;
  
  // Doctor Visits
  getDoctorVisitsByPatient(patientId: string): Promise<DoctorVisit[]>;
  createDoctorVisit(visit: InsertDoctorVisit): Promise<DoctorVisit>;
  
  // Patient Tracking History
  getPatientTrackingHistory(patientId: string): Promise<any>;
  
  // Chatbot Service
  createConversationLog(log: InsertConversationLog): Promise<ConversationLog>;
  getConversationLogs(userId?: string, limit?: number): Promise<ConversationLog[]>;
  getConversationLogsByCategory(category: string, limit?: number): Promise<ConversationLog[]>;
  
  // Patient Service
  getAllServicePatients(): Promise<ServicePatient[]>;
  getServicePatientById(id: string): Promise<ServicePatient | undefined>;
  createServicePatient(patient: InsertServicePatient): Promise<ServicePatient>;
  updateServicePatient(id: string, patient: Partial<InsertServicePatient>): Promise<ServicePatient | undefined>;
  deleteServicePatient(id: string): Promise<boolean>;
  
  // Admissions
  getAllAdmissions(): Promise<Admission[]>;
  getActiveAdmissions(): Promise<Admission[]>;
  getAdmissionById(id: string): Promise<Admission | undefined>;
  getAdmissionsByPatient(patientId: string): Promise<Admission[]>;
  createAdmission(admission: InsertAdmission): Promise<Admission>;
  updateAdmission(id: string, admission: Partial<InsertAdmission>): Promise<Admission | undefined>;
  dischargePatient(id: string, dischargeDate: Date, notes?: string): Promise<Admission | undefined>;
  
  // Medical Records
  getAllMedicalRecords(): Promise<MedicalRecord[]>;
  getMedicalRecordById(id: string): Promise<MedicalRecord | undefined>;
  getMedicalRecordsByPatient(patientId: string): Promise<MedicalRecord[]>;
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;
  updateMedicalRecord(id: string, record: Partial<InsertMedicalRecord>): Promise<MedicalRecord | undefined>;
  deleteMedicalRecord(id: string): Promise<boolean>;
  
  // Biometric Service
  getAllBiometricTemplates(): Promise<BiometricTemplate[]>;
  getBiometricTemplateById(id: string): Promise<BiometricTemplate | undefined>;
  getBiometricTemplatesByPatient(patientId: string): Promise<BiometricTemplate[]>;
  createBiometricTemplate(template: InsertBiometricTemplate): Promise<BiometricTemplate>;
  updateBiometricTemplate(id: string, template: Partial<InsertBiometricTemplate>): Promise<BiometricTemplate | undefined>;
  deleteBiometricTemplate(id: string): Promise<boolean>;
  
  // Biometric Verifications
  getAllBiometricVerifications(): Promise<BiometricVerification[]>;
  getRecentBiometricVerifications(limit?: number): Promise<BiometricVerification[]>;
  getBiometricVerificationsByPatient(patientId: string): Promise<BiometricVerification[]>;
  createBiometricVerification(verification: InsertBiometricVerification): Promise<BiometricVerification>;
  
  // Biometric Stats
  getBiometricStats(): Promise<{
    totalPatients: number;
    totalTemplates: number;
    verificationsToday: number;
    successfulVerifications: number;
    fingerprintTemplates: number;
    faceTemplates: number;
  }>;
  
  // Notification Service
  getAllNotifications(): Promise<Notification[]>;
  getNotificationById(id: string): Promise<Notification | undefined>;
  getNotificationsByStatus(status: string): Promise<Notification[]>;
  getNotificationsByCategory(category: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: string, notification: Partial<InsertNotification>): Promise<Notification | undefined>;
  deleteNotification(id: string): Promise<boolean>;
  sendNotification(id: string): Promise<Notification | undefined>;
  getNotificationStats(): Promise<{
    totalSent: number;
    pendingCount: number;
    byChannel: Record<string, number>;
    byCategory: Record<string, number>;
  }>;
  
  // Hospital Team Members
  getAllTeamMembers(): Promise<HospitalTeamMember[]>;
  getTeamMemberById(id: string): Promise<HospitalTeamMember | undefined>;
  getTeamMembersByDepartment(department: string): Promise<HospitalTeamMember[]>;
  getOnCallTeamMembers(): Promise<HospitalTeamMember[]>;
  createTeamMember(member: InsertHospitalTeamMember): Promise<HospitalTeamMember>;
  updateTeamMember(id: string, member: Partial<InsertHospitalTeamMember>): Promise<HospitalTeamMember | undefined>;
  deleteTeamMember(id: string): Promise<boolean>;
  updateTeamMemberOnCallStatus(id: string, isOnCall: boolean): Promise<HospitalTeamMember | undefined>;
  
  // Activity Logs
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  
  // Equipment Servicing
  getEquipment(): Promise<Equipment[]>;
  getEquipmentById(id: string): Promise<Equipment | undefined>;
  createEquipment(equip: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: string, updates: Partial<InsertEquipment>): Promise<Equipment | undefined>;
  deleteEquipment(id: string): Promise<boolean>;
  
  // Service History
  getServiceHistory(equipmentId?: string): Promise<ServiceHistory[]>;
  createServiceHistory(history: InsertServiceHistory): Promise<ServiceHistory>;
  deleteServiceHistory(id: string): Promise<boolean>;
  
  // Emergency Contacts
  getEmergencyContacts(): Promise<EmergencyContact[]>;
  createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact>;
  updateEmergencyContact(id: string, updates: Partial<InsertEmergencyContact>): Promise<EmergencyContact | undefined>;
  deleteEmergencyContact(id: string): Promise<boolean>;
  
  // Hospital Settings
  getHospitalSettings(): Promise<HospitalSettings | undefined>;
  createHospitalSettings(settings: InsertHospitalSettings): Promise<HospitalSettings>;
  updateHospitalSettings(id: string, updates: Partial<InsertHospitalSettings>): Promise<HospitalSettings | undefined>;
  getOrCreateHospitalSettings(): Promise<HospitalSettings>;

  // Prescriptions
  getPrescriptions(): Promise<Prescription[]>;
  getPrescriptionsByDoctor(doctorId: string): Promise<Prescription[]>;
  getPrescriptionsByPatient(patientName: string): Promise<Prescription[]>;
  getPrescription(id: string): Promise<Prescription | undefined>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: string, updates: Partial<InsertPrescription>): Promise<Prescription | undefined>;
  deletePrescription(id: string): Promise<boolean>;

  // Doctor Schedules
  getDoctorSchedules(doctorId: string): Promise<DoctorSchedule[]>;
  getDoctorSchedule(id: string): Promise<DoctorSchedule | undefined>;
  createDoctorSchedule(schedule: InsertDoctorSchedule): Promise<DoctorSchedule>;
  updateDoctorSchedule(id: string, updates: Partial<InsertDoctorSchedule>): Promise<DoctorSchedule | undefined>;
  deleteDoctorSchedule(id: string): Promise<boolean>;

  // Doctor Patients
  getDoctorPatients(doctorId: string): Promise<DoctorPatient[]>;
  getDoctorPatient(id: string): Promise<DoctorPatient | undefined>;
  createDoctorPatient(patient: InsertDoctorPatient): Promise<DoctorPatient>;
  updateDoctorPatient(id: string, updates: Partial<InsertDoctorPatient>): Promise<DoctorPatient | undefined>;
  deleteDoctorPatient(id: string): Promise<boolean>;
  
  // Doctor Profiles
  getDoctorProfile(doctorId: string): Promise<DoctorProfile | undefined>;
  createDoctorProfile(profile: InsertDoctorProfile): Promise<DoctorProfile>;
  updateDoctorProfile(doctorId: string, profile: Partial<InsertDoctorProfile>): Promise<DoctorProfile | undefined>;
  
  // Patient Profiles
  getPatientProfile(patientId: string): Promise<PatientProfile | undefined>;
  createPatientProfile(profile: InsertPatientProfile): Promise<PatientProfile>;
  updatePatientProfile(patientId: string, profile: Partial<InsertPatientProfile>): Promise<PatientProfile | undefined>;
  upsertPatientProfile(profile: InsertPatientProfile): Promise<PatientProfile>;
  
  // User Notifications (role-based notifications for Doctor, Patient, Admin, etc.)
  getUserNotifications(userId: string): Promise<UserNotification[]>;
  getUserNotificationsByRole(userRole: string): Promise<UserNotification[]>;
  getUserNotification(id: string): Promise<UserNotification | undefined>;
  createUserNotification(notification: InsertUserNotification): Promise<UserNotification>;
  markUserNotificationRead(id: string): Promise<UserNotification | undefined>;
  markAllUserNotificationsRead(userId: string): Promise<void>;
  deleteUserNotification(id: string): Promise<boolean>;
  
  // Consent Forms
  getConsentForms(): Promise<ConsentForm[]>;
  getConsentForm(id: string): Promise<ConsentForm | undefined>;
  getConsentFormsByCategory(category: string): Promise<ConsentForm[]>;
  createConsentForm(form: InsertConsentForm): Promise<ConsentForm>;
  updateConsentForm(id: string, updates: Partial<InsertConsentForm>): Promise<ConsentForm | undefined>;
  deleteConsentForm(id: string): Promise<boolean>;
  
  // Medicines Database
  getAllMedicines(): Promise<Medicine[]>;
  getMedicine(id: string): Promise<Medicine | undefined>;
  getMedicinesByCategory(category: string): Promise<Medicine[]>;
  searchMedicines(query: string): Promise<Medicine[]>;
  createMedicine(medicine: InsertMedicine): Promise<Medicine>;
  createMedicinesBulk(medicines: InsertMedicine[]): Promise<Medicine[]>;
  deleteMedicine(id: string): Promise<boolean>;
  deleteAllMedicines(): Promise<boolean>;
  
  // Doctor Oath Confirmations
  getDoctorOathConfirmation(doctorId: string, date: string): Promise<DoctorOathConfirmation | undefined>;
  createDoctorOathConfirmation(confirmation: InsertDoctorOathConfirmation): Promise<DoctorOathConfirmation>;
  
  // Consent Templates
  getAllConsentTemplates(): Promise<ConsentTemplate[]>;
  getConsentTemplate(id: string): Promise<ConsentTemplate | undefined>;
  getConsentTemplatesByType(consentType: string): Promise<ConsentTemplate[]>;
  getConsentTemplatesByCategory(category: string): Promise<ConsentTemplate[]>;
  createConsentTemplate(template: InsertConsentTemplate): Promise<ConsentTemplate>;
  updateConsentTemplate(id: string, updates: Partial<InsertConsentTemplate>): Promise<ConsentTemplate | undefined>;
  deleteConsentTemplate(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private doctors: Map<string, Doctor>;
  private schedules: Map<string, Schedule>;
  private appointments: Map<string, Appointment>;
  private appointmentCounter: number;
  
  // Inventory data stores
  private inventoryItems: Map<string, InventoryItem>;
  private staffMembers: Map<string, StaffMember>;
  private inventoryPatients: Map<string, InventoryPatient>;
  private inventoryTransactions: Map<string, InventoryTransaction>;
  private patientIdCounter: number;
  
  // Patient Tracking data stores
  private trackingPatients: Map<string, TrackingPatient>;
  private medications: Map<string, Medication>;
  private meals: Map<string, Meal>;
  private vitalsRecords: Map<string, Vitals>;
  private doctorVisits: Map<string, DoctorVisit>;
  
  // Chatbot data stores
  private conversationLogs: Map<string, ConversationLog>;
  
  // Patient Service data stores
  private servicePatients: Map<string, ServicePatient>;
  private admissionsData: Map<string, Admission>;
  private medicalRecordsData: Map<string, MedicalRecord>;
  
  // Biometric Service data stores
  private biometricTemplates: Map<string, BiometricTemplate>;
  private biometricVerifications: Map<string, BiometricVerification>;
  
  // Notification Service data stores
  private notificationsData: Map<string, Notification>;
  private hospitalTeamMembers: Map<string, HospitalTeamMember>;

  constructor() {
    this.users = new Map();
    this.doctors = new Map();
    this.schedules = new Map();
    this.appointments = new Map();
    this.appointmentCounter = 1;
    
    // Inventory initialization
    this.inventoryItems = new Map();
    this.staffMembers = new Map();
    this.inventoryPatients = new Map();
    this.inventoryTransactions = new Map();
    this.patientIdCounter = 1;
    
    // Patient Tracking initialization
    this.trackingPatients = new Map();
    this.medications = new Map();
    this.meals = new Map();
    this.vitalsRecords = new Map();
    this.doctorVisits = new Map();
    
    // Chatbot initialization
    this.conversationLogs = new Map();
    
    // Patient Service initialization
    this.servicePatients = new Map();
    this.admissionsData = new Map();
    this.medicalRecordsData = new Map();
    
    // Biometric Service initialization
    this.biometricTemplates = new Map();
    this.biometricVerifications = new Map();
    
    // Notification Service initialization
    this.notificationsData = new Map();
    this.hospitalTeamMembers = new Map();
    
    this.initializeDefaultData();
    this.initializeInventoryData();
    this.initializePatientTrackingData();
    this.initializePatientServiceData();
    this.initializeBiometricData();
    this.initializeNotificationData();
  }

  private initializeDemoUsers() {
    // Demo users: 5 per role (ADMIN, DOCTOR, NURSE, OPD_MANAGER, PATIENT)
    const demoUsers = [
      // Administrators
      { username: "admin1", password: "Admin@123", role: "ADMIN", name: "Rajesh Sharma", email: "rajesh.sharma@gravity.hospital" },
      { username: "admin2", password: "Admin@123", role: "ADMIN", name: "Priya Kulkarni", email: "priya.kulkarni@gravity.hospital" },
      { username: "admin3", password: "Admin@123", role: "ADMIN", name: "Anil Deshmukh", email: "anil.deshmukh@gravity.hospital" },
      { username: "admin4", password: "Admin@123", role: "ADMIN", name: "Sunita Joshi", email: "sunita.joshi@gravity.hospital" },
      { username: "admin5", password: "Admin@123", role: "ADMIN", name: "Vijay Pawar", email: "vijay.pawar@gravity.hospital" },
      // Doctors
      { username: "doctor1", password: "Doctor@123", role: "DOCTOR", name: "Dr. Priya Sharma", email: "dr.sharma@gravity.hospital" },
      { username: "doctor2", password: "Doctor@123", role: "DOCTOR", name: "Dr. Rajesh Kumar", email: "dr.kumar@gravity.hospital" },
      { username: "doctor3", password: "Doctor@123", role: "DOCTOR", name: "Dr. Sneha Patel", email: "dr.patel@gravity.hospital" },
      { username: "doctor4", password: "Doctor@123", role: "DOCTOR", name: "Dr. Amit Singh", email: "dr.singh@gravity.hospital" },
      { username: "doctor5", password: "Doctor@123", role: "DOCTOR", name: "Dr. Kavita Joshi", email: "dr.joshi@gravity.hospital" },
      // Nurses
      { username: "nurse1", password: "Nurse@123", role: "NURSE", name: "Anjali Patel", email: "anjali.patel@gravity.hospital" },
      { username: "nurse2", password: "Nurse@123", role: "NURSE", name: "Rekha Sharma", email: "rekha.sharma@gravity.hospital" },
      { username: "nurse3", password: "Nurse@123", role: "NURSE", name: "Meena Gupta", email: "meena.gupta@gravity.hospital" },
      { username: "nurse4", password: "Nurse@123", role: "NURSE", name: "Suman Reddy", email: "suman.reddy@gravity.hospital" },
      { username: "nurse5", password: "Nurse@123", role: "NURSE", name: "Kavitha Nair", email: "kavitha.nair@gravity.hospital" },
      // OPD Managers
      { username: "opd1", password: "OPD@123", role: "OPD_MANAGER", name: "Rahul Mehta", email: "rahul.mehta@gravity.hospital" },
      { username: "opd2", password: "OPD@123", role: "OPD_MANAGER", name: "Neha Kulkarni", email: "neha.kulkarni@gravity.hospital" },
      { username: "opd3", password: "OPD@123", role: "OPD_MANAGER", name: "Suresh Patil", email: "suresh.patil@gravity.hospital" },
      { username: "opd4", password: "OPD@123", role: "OPD_MANAGER", name: "Anita Verma", email: "anita.verma@gravity.hospital" },
      { username: "opd5", password: "OPD@123", role: "OPD_MANAGER", name: "Deepak Jain", email: "deepak.jain@gravity.hospital" },
      // Patients
      { username: "patient1", password: "Patient@123", role: "PATIENT", name: "Rahul Mehta", email: "rahul.mehta@gmail.com" },
      { username: "patient2", password: "Patient@123", role: "PATIENT", name: "Anita Desai", email: "anita.desai@gmail.com" },
      { username: "patient3", password: "Patient@123", role: "PATIENT", name: "Vikram Reddy", email: "vikram.reddy@gmail.com" },
      { username: "patient4", password: "Patient@123", role: "PATIENT", name: "Meera Nair", email: "meera.nair@gmail.com" },
      { username: "patient5", password: "Patient@123", role: "PATIENT", name: "Sanjay Gupta", email: "sanjay.gupta@gmail.com" },
    ];

    demoUsers.forEach(user => {
      const id = randomUUID();
      this.users.set(id, {
        id,
        username: user.username,
        password: user.password,
        role: user.role,
        name: user.name,
        email: user.email,
      });
    });
  }

  private initializeDefaultData() {    
    const defaultDoctors = [
      { name: "Dr. Priya Sharma", specialty: "Cardiology", qualification: "MD Cardiology, DM", experience: 15, rating: "4.9", availableDays: "Mon-Fri", avatarInitials: "PS" },
      { name: "Dr. Rajesh Kumar", specialty: "Orthopedics", qualification: "MS Orthopedics", experience: 12, rating: "4.8", availableDays: "Mon-Sat", avatarInitials: "RK" },
      { name: "Dr. Sneha Patel", specialty: "Dermatology", qualification: "MD Dermatology", experience: 10, rating: "4.7", availableDays: "Tue-Sat", avatarInitials: "SP" },
      { name: "Dr. Amit Singh", specialty: "General Medicine", qualification: "MBBS, MD", experience: 8, rating: "4.6", availableDays: "Mon-Sat", avatarInitials: "AS" },
      { name: "Dr. Kavita Joshi", specialty: "Pediatrics", qualification: "MD Pediatrics", experience: 14, rating: "4.9", availableDays: "Mon-Fri", avatarInitials: "KJ" },
      { name: "Dr. Arjun Mehta", specialty: "Neurology", qualification: "DM Neurology", experience: 18, rating: "4.8", availableDays: "Mon-Sat", avatarInitials: "AM" },
    ];

    defaultDoctors.forEach(doc => {
      const id = randomUUID();
      const doctor: Doctor = { ...doc, id };
      this.doctors.set(id, doctor);
    });

    const timeSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
    const today = new Date();
    
    this.doctors.forEach((doctor) => {
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = new Date(today);
        date.setDate(date.getDate() + dayOffset);
        const dateStr = date.toISOString().split('T')[0];
        
        timeSlots.forEach((slot) => {
          const scheduleId = randomUUID();
          const isBooked = Math.random() < 0.3;
          const schedule: Schedule = {
            id: scheduleId,
            doctorId: doctor.id,
            date: dateStr,
            timeSlot: slot,
            isBooked
          };
          this.schedules.set(scheduleId, schedule);
        });
      }
    });

    const sampleAppointments = [
      { patientName: "Rahul Mehta", patientPhone: "+91 98765 43210", patientEmail: "rahul@email.com", symptoms: "Chest pain and shortness of breath", status: "scheduled" },
      { patientName: "Anita Desai", patientPhone: "+91 87654 32109", patientEmail: "anita@email.com", symptoms: "Knee pain after walking", status: "scheduled" },
      { patientName: "Vikram Reddy", patientPhone: "+91 76543 21098", patientEmail: "vikram@email.com", symptoms: "Skin rash on arms", status: "checked-in" },
      { patientName: "Meera Nair", patientPhone: "+91 65432 10987", patientEmail: "meera@email.com", symptoms: "Fever and cold for 3 days", status: "completed" },
      { patientName: "Sanjay Gupta", patientPhone: "+91 54321 09876", patientEmail: "sanjay@email.com", symptoms: "Child vaccination", status: "scheduled" },
    ];

    const doctorIds = Array.from(this.doctors.keys());
    sampleAppointments.forEach((apt, index) => {
      const id = randomUUID();
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + Math.floor(index / 2));
      
      this.appointments.set(id, {
        id,
        appointmentId: `APT-${String(this.appointmentCounter++).padStart(3, '0')}`,
        patientName: apt.patientName,
        patientPhone: apt.patientPhone,
        patientEmail: apt.patientEmail,
        doctorId: doctorIds[index % doctorIds.length],
        appointmentDate: appointmentDate.toISOString().split('T')[0],
        timeSlot: ["09:00", "10:00", "11:00", "14:00", "15:00"][index % 5],
        symptoms: apt.symptoms,
        status: apt.status,
        createdAt: new Date()
      });
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      role: insertUser.role ?? "PATIENT",
      name: insertUser.name ?? null,
      email: insertUser.email ?? null,
    };
    this.users.set(id, user);
    return user;
  }

  async getDoctors(): Promise<Doctor[]> {
    return Array.from(this.doctors.values());
  }

  async getDoctor(id: string): Promise<Doctor | undefined> {
    return this.doctors.get(id);
  }

  async createDoctor(insertDoctor: InsertDoctor): Promise<Doctor> {
    const id = randomUUID();
    const doctor: Doctor = { 
      ...insertDoctor, 
      id,
      rating: insertDoctor.rating ?? "4.5"
    };
    this.doctors.set(id, doctor);
    return doctor;
  }

  async getSchedules(doctorId: string, date?: string): Promise<Schedule[]> {
    const today = new Date().toISOString().split('T')[0];
    const filterDate = date || today;
    return Array.from(this.schedules.values()).filter(
      (schedule) => schedule.doctorId === doctorId && schedule.date === filterDate
    );
  }

  async getSchedulesByDate(date: string): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(
      (schedule) => schedule.date === date
    );
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const id = randomUUID();
    const schedule: Schedule = { 
      ...insertSchedule, 
      id,
      isBooked: insertSchedule.isBooked ?? false
    };
    this.schedules.set(id, schedule);
    return schedule;
  }

  async updateScheduleBookedStatus(id: string, isBooked: boolean): Promise<Schedule | undefined> {
    const schedule = this.schedules.get(id);
    if (schedule) {
      schedule.isBooked = isBooked;
      this.schedules.set(id, schedule);
    }
    return schedule;
  }

  async findAndBookScheduleSlot(doctorId: string, date: string, timeSlot: string): Promise<Schedule | undefined> {
    const schedule = Array.from(this.schedules.values()).find(
      (s) => s.doctorId === doctorId && s.date === date && s.timeSlot === timeSlot && !s.isBooked
    );
    if (schedule) {
      schedule.isBooked = true;
      this.schedules.set(schedule.id, schedule);
    }
    return schedule;
  }

  async getAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getAppointmentsByStatus(status: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.status === status
    );
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    const appointment: Appointment = {
      ...insertAppointment,
      id,
      appointmentId: `APT-${String(this.appointmentCounter++).padStart(3, '0')}`,
      status: insertAppointment.status ?? "scheduled",
      patientEmail: insertAppointment.patientEmail ?? null,
      symptoms: insertAppointment.symptoms ?? null,
      createdAt: new Date()
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async updateAppointmentStatus(id: string, status: string): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (appointment) {
      appointment.status = status;
      this.appointments.set(id, appointment);
    }
    return appointment;
  }

  // ========== INVENTORY INITIALIZATION ==========
  private initializeInventoryData() {
    // Default inventory items
    const defaultItems = [
      { name: "Disposable Syringes 5ml", category: "syringes", currentStock: 500, lowStockThreshold: 100, unit: "pieces", cost: "5.50", supplier: "MedSupply Co.", description: "Sterile disposable syringes" },
      { name: "Surgical Gloves (M)", category: "gloves", currentStock: 200, lowStockThreshold: 50, unit: "pairs", cost: "12.00", supplier: "SafeHands Inc.", description: "Latex-free surgical gloves" },
      { name: "Surgical Gloves (L)", category: "gloves", currentStock: 150, lowStockThreshold: 50, unit: "pairs", cost: "12.00", supplier: "SafeHands Inc.", description: "Latex-free surgical gloves" },
      { name: "Cotton Swabs", category: "disposables", currentStock: 1000, lowStockThreshold: 200, unit: "pieces", cost: "0.50", supplier: "CleanMed Ltd.", description: "Sterile cotton swabs" },
      { name: "Bandages 4 inch", category: "disposables", currentStock: 300, lowStockThreshold: 75, unit: "rolls", cost: "8.00", supplier: "WoundCare Plus", description: "Elastic bandage rolls" },
      { name: "IV Cannula 20G", category: "disposables", currentStock: 80, lowStockThreshold: 50, unit: "pieces", cost: "25.00", supplier: "MedSupply Co.", description: "Intravenous cannula" },
      { name: "Face Masks N95", category: "disposables", currentStock: 45, lowStockThreshold: 100, unit: "pieces", cost: "15.00", supplier: "ProtectHealth", description: "N95 respiratory masks" },
      { name: "Paracetamol 500mg", category: "medicines", currentStock: 1500, lowStockThreshold: 300, unit: "tablets", cost: "2.00", supplier: "PharmaCare", description: "Fever and pain relief" },
      { name: "Blood Pressure Monitor", category: "equipment", currentStock: 10, lowStockThreshold: 3, unit: "units", cost: "2500.00", supplier: "MedEquip Ltd.", description: "Digital BP monitor" },
    ];

    defaultItems.forEach(item => {
      const id = randomUUID();
      const inventoryItem: InventoryItem = {
        ...item,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
        supplier: item.supplier ?? null,
        description: item.description ?? null,
      };
      this.inventoryItems.set(id, inventoryItem);
    });

    // Default staff members
    const defaultStaff = [
      { name: "Nurse Priya Sharma", role: "nurse", email: "priya.sharma@galaxy.hospital", phone: "+91 98765 11111", department: "General Ward" },
      { name: "Nurse Anjali Patel", role: "nurse", email: "anjali.patel@galaxy.hospital", phone: "+91 98765 22222", department: "ICU" },
      { name: "Dr. Rajesh Kumar", role: "doctor", email: "rajesh.kumar@galaxy.hospital", phone: "+91 98765 33333", department: "Orthopedics" },
      { name: "Tech. Suresh Rao", role: "technician", email: "suresh.rao@galaxy.hospital", phone: "+91 98765 44444", department: "Lab" },
      { name: "Admin Meera Joshi", role: "administrator", email: "meera.joshi@galaxy.hospital", phone: "+91 98765 55555", department: "Admin" },
    ];

    defaultStaff.forEach(staff => {
      const id = randomUUID();
      const staffMember: StaffMember = {
        ...staff,
        id,
        createdAt: new Date(),
        email: staff.email ?? null,
        phone: staff.phone ?? null,
        department: staff.department ?? null,
      };
      this.staffMembers.set(id, staffMember);
    });

    // Default patients for inventory
    const defaultPatients = [
      { patientId: "P-10001", name: "Rahul Mehta", phone: "+91 98765 43210", address: "Chikhali, Pune" },
      { patientId: "P-10002", name: "Anita Desai", phone: "+91 87654 32109", address: "Wakad, Pune" },
      { patientId: "P-10003", name: "Vikram Reddy", phone: "+91 76543 21098", address: "Hinjewadi, Pune" },
    ];

    defaultPatients.forEach(patient => {
      const id = randomUUID();
      const invPatient: InventoryPatient = {
        ...patient,
        id,
        createdAt: new Date(),
        phone: patient.phone ?? null,
        address: patient.address ?? null,
      };
      this.inventoryPatients.set(id, invPatient);
    });

    // Sample transactions
    const itemIds = Array.from(this.inventoryItems.keys());
    const staffIds = Array.from(this.staffMembers.keys());
    const patientIds = Array.from(this.inventoryPatients.keys());

    const sampleTransactions = [
      { type: "ISSUE", itemId: itemIds[0], quantity: 10, staffId: staffIds[0], patientId: patientIds[0], notes: "For patient treatment" },
      { type: "ISSUE", itemId: itemIds[1], quantity: 5, staffId: staffIds[1], patientId: patientIds[1], notes: "Surgical procedure" },
      { type: "RETURN", itemId: itemIds[0], quantity: 2, staffId: staffIds[0], patientId: null, notes: "Unused syringes returned" },
      { type: "DISPOSE", itemId: itemIds[3], quantity: 20, staffId: staffIds[3], patientId: null, notes: "Expired items disposed" },
    ];

    sampleTransactions.forEach(tx => {
      const id = randomUUID();
      const item = this.inventoryItems.get(tx.itemId);
      if (!item) return;
      
      let newStock = item.currentStock;
      if (tx.type === "ISSUE" || tx.type === "DISPOSE") {
        newStock = Math.max(0, item.currentStock - tx.quantity);
      } else if (tx.type === "RETURN") {
        newStock = item.currentStock + tx.quantity;
      }
      
      item.currentStock = newStock;
      this.inventoryItems.set(tx.itemId, item);
      
      const transaction: InventoryTransaction = {
        id,
        type: tx.type,
        itemId: tx.itemId,
        quantity: tx.quantity,
        staffId: tx.staffId ?? null,
        patientId: tx.patientId ?? null,
        notes: tx.notes ?? null,
        remainingStock: newStock,
        totalCost: String(Number(item.cost) * tx.quantity),
        createdAt: new Date(),
      };
      this.inventoryTransactions.set(id, transaction);
    });
  }

  // ========== INVENTORY ITEMS METHODS ==========
  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values()).sort(
      (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
    );
  }

  async getInventoryItemById(id: string): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(id);
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const id = randomUUID();
    const inventoryItem: InventoryItem = {
      ...item,
      id,
      currentStock: item.currentStock ?? 0,
      lowStockThreshold: item.lowStockThreshold ?? 10,
      unit: item.unit ?? "units",
      supplier: item.supplier ?? null,
      description: item.description ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.inventoryItems.set(id, inventoryItem);
    return inventoryItem;
  }

  async updateInventoryItemStock(id: string, newStock: number): Promise<InventoryItem | undefined> {
    const item = this.inventoryItems.get(id);
    if (item) {
      item.currentStock = newStock;
      item.updatedAt = new Date();
      this.inventoryItems.set(id, item);
    }
    return item;
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values()).filter(
      item => item.currentStock <= item.lowStockThreshold
    );
  }

  async updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const existing = this.inventoryItems.get(id);
    if (existing) {
      const updated: InventoryItem = {
        ...existing,
        ...item,
        id: existing.id,
        updatedAt: new Date(),
      };
      this.inventoryItems.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    return this.inventoryItems.delete(id);
  }

  // ========== STAFF MEMBERS METHODS ==========
  async getAllStaffMembers(): Promise<StaffMember[]> {
    return Array.from(this.staffMembers.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getStaffMemberById(id: string): Promise<StaffMember | undefined> {
    return this.staffMembers.get(id);
  }

  async createStaffMember(staff: InsertStaffMember): Promise<StaffMember> {
    const id = randomUUID();
    const staffMember: StaffMember = {
      ...staff,
      id,
      email: staff.email ?? null,
      phone: staff.phone ?? null,
      department: staff.department ?? null,
      createdAt: new Date(),
    };
    this.staffMembers.set(id, staffMember);
    return staffMember;
  }

  // ========== INVENTORY PATIENTS METHODS ==========
  async getAllInventoryPatients(): Promise<InventoryPatient[]> {
    return Array.from(this.inventoryPatients.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getInventoryPatientById(id: string): Promise<InventoryPatient | undefined> {
    return this.inventoryPatients.get(id);
  }

  async createInventoryPatient(patient: InsertInventoryPatient): Promise<InventoryPatient> {
    const id = randomUUID();
    const invPatient: InventoryPatient = {
      ...patient,
      id,
      phone: patient.phone ?? null,
      address: patient.address ?? null,
      createdAt: new Date(),
    };
    this.inventoryPatients.set(id, invPatient);
    return invPatient;
  }

  // ========== INVENTORY TRANSACTIONS METHODS ==========
  async getAllInventoryTransactions(): Promise<InventoryTransaction[]> {
    return Array.from(this.inventoryTransactions.values()).sort(
      (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
    );
  }

  async getTransactionsByItem(itemId: string): Promise<InventoryTransaction[]> {
    return Array.from(this.inventoryTransactions.values()).filter(
      tx => tx.itemId === itemId
    ).sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getTransactionsByPatient(patientId: string): Promise<InventoryTransaction[]> {
    return Array.from(this.inventoryTransactions.values()).filter(
      tx => tx.patientId === patientId
    ).sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getTransactionsByStaff(staffId: string): Promise<InventoryTransaction[]> {
    return Array.from(this.inventoryTransactions.values()).filter(
      tx => tx.staffId === staffId
    ).sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction> {
    const item = await this.getInventoryItemById(transaction.itemId);
    if (!item) throw new Error("Item not found");

    let newStock = item.currentStock;
    if (transaction.type === "ISSUE" || transaction.type === "DISPOSE") {
      newStock = item.currentStock - transaction.quantity;
    } else if (transaction.type === "RETURN") {
      newStock = item.currentStock + transaction.quantity;
    }

    if (newStock < 0) throw new Error("Insufficient stock");

    await this.updateInventoryItemStock(transaction.itemId, newStock);

    const id = randomUUID();
    const newTransaction: InventoryTransaction = {
      id,
      type: transaction.type,
      itemId: transaction.itemId,
      quantity: transaction.quantity,
      staffId: transaction.staffId ?? null,
      patientId: transaction.patientId ?? null,
      notes: transaction.notes ?? null,
      remainingStock: newStock,
      totalCost: String(Number(item.cost) * transaction.quantity),
      createdAt: new Date(),
    };
    this.inventoryTransactions.set(id, newTransaction);
    return newTransaction;
  }

  // ========== REPORTS METHODS ==========
  async getInventoryReports(): Promise<any> {
    const items = await this.getAllInventoryItems();
    const transactions = await this.getAllInventoryTransactions();
    const lowStockItems = await this.getLowStockItems();
    
    const totalValue = items.reduce((sum, item) => sum + (Number(item.cost) * item.currentStock), 0);
    
    return {
      totalItems: items.length,
      totalTransactions: transactions.length,
      lowStockItems: lowStockItems.length,
      outOfStockItems: items.filter(item => item.currentStock === 0).length,
      totalValue,
      items,
      lowStock: lowStockItems,
    };
  }

  async getPatientWiseReport(): Promise<any[]> {
    const patients = await this.getAllInventoryPatients();
    const transactions = await this.getAllInventoryTransactions();
    
    return patients.map(patient => {
      const patientTx = transactions.filter(tx => tx.patientId === patient.id);
      const totalCost = patientTx.reduce((sum, tx) => sum + Number(tx.totalCost || 0), 0);
      const totalIssued = patientTx.filter(tx => tx.type === "ISSUE").reduce((sum, tx) => sum + tx.quantity, 0);
      const totalReturned = patientTx.filter(tx => tx.type === "RETURN").reduce((sum, tx) => sum + tx.quantity, 0);
      
      return {
        patientId: patient.id,
        patientName: patient.name,
        patientCode: patient.patientId,
        totalTransactions: patientTx.length,
        totalCost,
        totalItemsIssued: totalIssued,
        totalItemsReturned: totalReturned,
      };
    }).filter(p => p.totalTransactions > 0);
  }

  async getStaffWiseReport(): Promise<any[]> {
    const staff = await this.getAllStaffMembers();
    const transactions = await this.getAllInventoryTransactions();
    
    return staff.map(s => {
      const staffTx = transactions.filter(tx => tx.staffId === s.id);
      const totalCost = staffTx.reduce((sum, tx) => sum + Number(tx.totalCost || 0), 0);
      const totalIssued = staffTx.filter(tx => tx.type === "ISSUE").reduce((sum, tx) => sum + tx.quantity, 0);
      const totalReturned = staffTx.filter(tx => tx.type === "RETURN").reduce((sum, tx) => sum + tx.quantity, 0);
      const totalDisposed = staffTx.filter(tx => tx.type === "DISPOSE").reduce((sum, tx) => sum + tx.quantity, 0);
      
      return {
        staffId: s.id,
        staffName: s.name,
        role: s.role,
        totalTransactions: staffTx.length,
        totalCost,
        totalItemsIssued: totalIssued,
        totalItemsReturned: totalReturned,
        totalItemsDisposed: totalDisposed,
      };
    }).filter(s => s.totalTransactions > 0);
  }

  // ========== PATIENT TRACKING INITIALIZATION ==========
  private initializePatientTrackingData() {
    // Default tracking patients
    const defaultPatients = [
      { name: "Rahul Mehta", age: 45, gender: "Male", room: "301A", diagnosis: "Pneumonia", status: "admitted", doctor: "Dr. Priya Sharma" },
      { name: "Anita Desai", age: 38, gender: "Female", room: "205B", diagnosis: "Post-surgery recovery", status: "admitted", doctor: "Dr. Rajesh Kumar" },
      { name: "Vikram Reddy", age: 62, gender: "Male", room: "ICU-1", diagnosis: "Cardiac monitoring", status: "critical", doctor: "Dr. Priya Sharma" },
      { name: "Meera Nair", age: 28, gender: "Female", room: "402C", diagnosis: "Diabetes management", status: "admitted", doctor: "Dr. Amit Singh" },
      { name: "Sanjay Gupta", age: 55, gender: "Male", room: "310A", diagnosis: "Hypertension", status: "admitted", doctor: "Dr. Kavita Joshi" },
    ];

    const patientIds: string[] = [];
    defaultPatients.forEach(patient => {
      const id = randomUUID();
      patientIds.push(id);
      const trackingPatient: TrackingPatient = {
        ...patient,
        id,
        department: "General Medicine",
        notes: null,
        admissionDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        dischargeDate: null,
      };
      this.trackingPatients.set(id, trackingPatient);
    });

    // Sample medications
    const sampleMedications = [
      { patientId: patientIds[0], name: "Amoxicillin", dosage: "500mg", route: "Oral", frequency: "Every 8 hours", administeredBy: "Nurse Priya Sharma", notes: "Take with food" },
      { patientId: patientIds[0], name: "Paracetamol", dosage: "650mg", route: "Oral", frequency: "Every 6 hours", administeredBy: "Nurse Anjali Patel", notes: "For fever" },
      { patientId: patientIds[1], name: "Ibuprofen", dosage: "400mg", route: "Oral", frequency: "Every 8 hours", administeredBy: "Nurse Priya Sharma", notes: "For pain management" },
      { patientId: patientIds[2], name: "Aspirin", dosage: "75mg", route: "Oral", frequency: "Once daily", administeredBy: "Nurse Anjali Patel", notes: "Blood thinner" },
      { patientId: patientIds[3], name: "Metformin", dosage: "500mg", route: "Oral", frequency: "Twice daily", administeredBy: "Nurse Priya Sharma", notes: "With meals" },
    ];

    sampleMedications.forEach(med => {
      const id = randomUUID();
      const medication: Medication = {
        ...med,
        id,
        administeredAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        notes: med.notes ?? null,
      };
      this.medications.set(id, medication);
    });

    // Sample meals
    const sampleMeals = [
      { patientId: patientIds[0], mealType: "Breakfast", description: "Oatmeal with fruits", calories: 350, consumptionPercentage: 80, servedBy: "Kitchen Staff", notes: "Low sodium" },
      { patientId: patientIds[0], mealType: "Lunch", description: "Grilled chicken with vegetables", calories: 450, consumptionPercentage: 75, servedBy: "Kitchen Staff", notes: null },
      { patientId: patientIds[1], mealType: "Dinner", description: "Fish curry with rice", calories: 500, consumptionPercentage: 90, servedBy: "Kitchen Staff", notes: "Soft diet" },
      { patientId: patientIds[2], mealType: "Breakfast", description: "Toast with eggs", calories: 300, consumptionPercentage: 50, servedBy: "ICU Staff", notes: "Cardiac diet" },
      { patientId: patientIds[3], mealType: "Lunch", description: "Dal with roti", calories: 400, consumptionPercentage: 100, servedBy: "Kitchen Staff", notes: "Diabetic friendly" },
    ];

    sampleMeals.forEach(meal => {
      const id = randomUUID();
      const mealRecord: Meal = {
        ...meal,
        id,
        servedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        dietaryRestrictions: null,
        calories: meal.calories ?? null,
        notes: meal.notes ?? null,
      };
      this.meals.set(id, mealRecord);
    });

    // Sample vitals
    const sampleVitals = [
      { patientId: patientIds[0], temperature: "98.6", heartRate: 72, bloodPressureSystolic: 120, bloodPressureDiastolic: 80, respiratoryRate: 16, oxygenSaturation: 98, recordedBy: "Nurse Priya Sharma", notes: "All vitals normal" },
      { patientId: patientIds[1], temperature: "99.2", heartRate: 78, bloodPressureSystolic: 130, bloodPressureDiastolic: 85, respiratoryRate: 18, oxygenSaturation: 97, recordedBy: "Nurse Anjali Patel", notes: "Slight elevation in temperature" },
      { patientId: patientIds[2], temperature: "98.4", heartRate: 88, bloodPressureSystolic: 145, bloodPressureDiastolic: 92, respiratoryRate: 20, oxygenSaturation: 94, recordedBy: "ICU Nurse", notes: "Monitor BP closely" },
      { patientId: patientIds[3], temperature: "98.8", heartRate: 70, bloodPressureSystolic: 118, bloodPressureDiastolic: 78, respiratoryRate: 14, oxygenSaturation: 99, recordedBy: "Nurse Priya Sharma", notes: "Stable" },
      { patientId: patientIds[4], temperature: "98.6", heartRate: 82, bloodPressureSystolic: 155, bloodPressureDiastolic: 95, respiratoryRate: 17, oxygenSaturation: 96, recordedBy: "Nurse Anjali Patel", notes: "Hypertension noted" },
    ];

    sampleVitals.forEach(vital => {
      const id = randomUUID();
      const vitalsRecord: Vitals = {
        ...vital,
        id,
        recordedAt: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000),
        temperature: vital.temperature ?? null,
        heartRate: vital.heartRate ?? null,
        bloodPressureSystolic: vital.bloodPressureSystolic ?? null,
        bloodPressureDiastolic: vital.bloodPressureDiastolic ?? null,
        respiratoryRate: vital.respiratoryRate ?? null,
        oxygenSaturation: vital.oxygenSaturation ?? null,
        notes: vital.notes ?? null,
      };
      this.vitalsRecords.set(id, vitalsRecord);
    });
  }

  // ========== PATIENT TRACKING METHODS ==========
  async getAllTrackingPatients(): Promise<TrackingPatient[]> {
    return Array.from(this.trackingPatients.values()).sort(
      (a, b) => b.admissionDate.getTime() - a.admissionDate.getTime()
    );
  }

  async getTrackingPatientById(id: string): Promise<TrackingPatient | undefined> {
    return this.trackingPatients.get(id);
  }

  async createTrackingPatient(patient: InsertTrackingPatient): Promise<TrackingPatient> {
    const id = randomUUID();
    const trackingPatient: TrackingPatient = {
      id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      department: patient.department,
      room: patient.room,
      diagnosis: patient.diagnosis,
      doctor: patient.doctor,
      notes: patient.notes ?? null,
      admissionDate: new Date(),
      dischargeDate: null,
      status: "admitted",
    };
    this.trackingPatients.set(id, trackingPatient);
    return trackingPatient;
  }

  async updateTrackingPatientStatus(id: string, status: string): Promise<TrackingPatient | undefined> {
    const patient = this.trackingPatients.get(id);
    if (patient) {
      patient.status = status;
      this.trackingPatients.set(id, patient);
    }
    return patient;
  }

  async dischargeTrackingPatient(id: string, dischargeDate: Date): Promise<TrackingPatient | undefined> {
    const patient = this.trackingPatients.get(id);
    if (patient) {
      patient.status = "discharged";
      patient.dischargeDate = dischargeDate;
      this.trackingPatients.set(id, patient);
    }
    return patient;
  }

  async deleteTrackingPatient(id: string): Promise<boolean> {
    const patient = this.trackingPatients.get(id);
    if (!patient) return false;
    
    // Delete associated medications, meals, and vitals
    const medications = Array.from(this.medications.values()).filter(m => m.patientId === id);
    medications.forEach(m => this.medications.delete(m.id));
    
    const meals = Array.from(this.meals.values()).filter(m => m.patientId === id);
    meals.forEach(m => this.meals.delete(m.id));
    
    const vitals = Array.from(this.vitalsRecords.values()).filter(v => v.patientId === id);
    vitals.forEach(v => this.vitalsRecords.delete(v.id));
    
    // Delete the patient
    this.trackingPatients.delete(id);
    return true;
  }

  // ========== MEDICATIONS METHODS ==========
  async getMedicationsByPatient(patientId: string): Promise<Medication[]> {
    return Array.from(this.medications.values()).filter(
      m => m.patientId === patientId
    ).sort((a, b) => b.administeredAt.getTime() - a.administeredAt.getTime());
  }

  async createMedication(medication: InsertMedication): Promise<Medication> {
    const id = randomUUID();
    const med: Medication = {
      id,
      patientId: medication.patientId,
      name: medication.name,
      dosage: medication.dosage,
      route: medication.route,
      frequency: medication.frequency,
      administeredBy: medication.administeredBy,
      administeredAt: new Date(),
      notes: medication.notes ?? null,
    };
    this.medications.set(id, med);
    return med;
  }

  // ========== MEALS METHODS ==========
  async getMealsByPatient(patientId: string): Promise<Meal[]> {
    return Array.from(this.meals.values()).filter(
      m => m.patientId === patientId
    ).sort((a, b) => b.servedAt.getTime() - a.servedAt.getTime());
  }

  async createMeal(meal: InsertMeal): Promise<Meal> {
    const id = randomUUID();
    const mealRecord: Meal = {
      id,
      patientId: meal.patientId,
      mealType: meal.mealType,
      description: meal.description,
      servedBy: meal.servedBy,
      servedAt: new Date(),
      consumptionPercentage: meal.consumptionPercentage ?? 100,
      calories: meal.calories ?? null,
      dietaryRestrictions: meal.dietaryRestrictions ?? null,
      notes: meal.notes ?? null,
    };
    this.meals.set(id, mealRecord);
    return mealRecord;
  }

  // ========== VITALS METHODS ==========
  async getVitalsByPatient(patientId: string): Promise<Vitals[]> {
    return Array.from(this.vitalsRecords.values()).filter(
      v => v.patientId === patientId
    ).sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
  }

  async createVitals(vitals: InsertVitals): Promise<Vitals> {
    const id = randomUUID();
    const vitalsRecord: Vitals = {
      id,
      patientId: vitals.patientId,
      recordedBy: vitals.recordedBy,
      recordedAt: new Date(),
      temperature: vitals.temperature ?? null,
      heartRate: vitals.heartRate ?? null,
      bloodPressureSystolic: vitals.bloodPressureSystolic ?? null,
      bloodPressureDiastolic: vitals.bloodPressureDiastolic ?? null,
      respiratoryRate: vitals.respiratoryRate ?? null,
      oxygenSaturation: vitals.oxygenSaturation ?? null,
      notes: vitals.notes ?? null,
    };
    this.vitalsRecords.set(id, vitalsRecord);
    return vitalsRecord;
  }

  // ========== DOCTOR VISITS METHODS ==========
  async getDoctorVisitsByPatient(patientId: string): Promise<DoctorVisit[]> {
    return Array.from(this.doctorVisits.values()).filter(
      v => v.patientId === patientId
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createDoctorVisit(visit: InsertDoctorVisit): Promise<DoctorVisit> {
    const id = randomUUID();
    const doctorVisit: DoctorVisit = {
      id,
      patientId: visit.patientId,
      visitDate: visit.visitDate,
      visitTime: visit.visitTime,
      doctorName: visit.doctorName ?? null,
      notes: visit.notes ?? null,
      status: visit.status ?? "scheduled",
      createdAt: new Date(),
      createdBy: visit.createdBy,
    };
    this.doctorVisits.set(id, doctorVisit);
    return doctorVisit;
  }

  // ========== PATIENT TRACKING HISTORY ==========
  async getPatientTrackingHistory(patientId: string): Promise<any> {
    const patient = await this.getTrackingPatientById(patientId);
    if (!patient) return null;

    const medications = await this.getMedicationsByPatient(patientId);
    const meals = await this.getMealsByPatient(patientId);
    const vitals = await this.getVitalsByPatient(patientId);

    return {
      patient,
      medications,
      meals,
      vitals,
    };
  }

  // ========== PATIENT SERVICE INITIALIZATION ==========
  private initializePatientServiceData() {
    const defaultPatients = [
      { firstName: "Rahul", lastName: "Mehta", dateOfBirth: "1980-05-15", gender: "Male", phone: "+91 98765 43210", email: "rahul.mehta@email.com", address: "Chikhali, Pune", emergencyContact: "Sunita Mehta", emergencyPhone: "+91 98765 43211", insuranceProvider: "Star Health", insuranceNumber: "STH-2024-001" },
      { firstName: "Anita", lastName: "Desai", dateOfBirth: "1987-08-22", gender: "Female", phone: "+91 87654 32109", email: "anita.desai@email.com", address: "Wakad, Pune", emergencyContact: "Suresh Desai", emergencyPhone: "+91 87654 32110", insuranceProvider: "HDFC Ergo", insuranceNumber: "HDF-2024-002" },
      { firstName: "Vikram", lastName: "Reddy", dateOfBirth: "1962-03-10", gender: "Male", phone: "+91 76543 21098", email: "vikram.reddy@email.com", address: "Hinjewadi, Pune", emergencyContact: "Lakshmi Reddy", emergencyPhone: "+91 76543 21099", insuranceProvider: "ICICI Lombard", insuranceNumber: "ICL-2024-003" },
      { firstName: "Meera", lastName: "Nair", dateOfBirth: "1995-11-28", gender: "Female", phone: "+91 65432 10987", email: "meera.nair@email.com", address: "Pimple Saudagar, Pune", emergencyContact: "Krishnan Nair", emergencyPhone: "+91 65432 10988", insuranceProvider: "Bajaj Allianz", insuranceNumber: "BAL-2024-004" },
      { firstName: "Sanjay", lastName: "Gupta", dateOfBirth: "1968-07-04", gender: "Male", phone: "+91 54321 09876", email: "sanjay.gupta@email.com", address: "Aundh, Pune", emergencyContact: "Priya Gupta", emergencyPhone: "+91 54321 09877", insuranceProvider: "Max Bupa", insuranceNumber: "MBP-2024-005" },
    ];

    const patientIds: string[] = [];
    defaultPatients.forEach(patient => {
      const id = randomUUID();
      patientIds.push(id);
      const servicePatient: ServicePatient = {
        ...patient,
        id,
        phone: patient.phone ?? null,
        email: patient.email ?? null,
        address: patient.address ?? null,
        emergencyContact: patient.emergencyContact ?? null,
        emergencyPhone: patient.emergencyPhone ?? null,
        insuranceProvider: patient.insuranceProvider ?? null,
        insuranceNumber: patient.insuranceNumber ?? null,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      };
      this.servicePatients.set(id, servicePatient);
    });

    // Sample admissions
    const sampleAdmissions = [
      { patientId: patientIds[0], department: "Cardiology", roomNumber: "301A", admittingPhysician: "Dr. Priya Sharma", primaryDiagnosis: "Chest pain evaluation", status: "admitted", notes: "Monitoring required" },
      { patientId: patientIds[1], department: "Orthopedics", roomNumber: "205B", admittingPhysician: "Dr. Rajesh Kumar", primaryDiagnosis: "Knee replacement surgery", status: "admitted", notes: "Post-operative care" },
      { patientId: patientIds[2], department: "General Medicine", roomNumber: "ICU-1", admittingPhysician: "Dr. Amit Singh", primaryDiagnosis: "Cardiac monitoring", status: "admitted", notes: "Critical care required" },
      { patientId: patientIds[3], department: "Endocrinology", roomNumber: "402C", admittingPhysician: "Dr. Kavita Joshi", primaryDiagnosis: "Diabetes management", status: "discharged", notes: "Discharged with medication" },
    ];

    sampleAdmissions.forEach(admission => {
      const id = randomUUID();
      const admissionRecord: Admission = {
        ...admission,
        id,
        admissionDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        dischargeDate: admission.status === "discharged" ? new Date() : null,
        roomNumber: admission.roomNumber ?? null,
        primaryDiagnosis: admission.primaryDiagnosis ?? null,
        notes: admission.notes ?? null,
        createdAt: new Date(),
      };
      this.admissionsData.set(id, admissionRecord);
    });

    // Sample medical records
    const sampleRecords = [
      { patientId: patientIds[0], recordType: "diagnosis", title: "Essential Hypertension", description: "BP 145/92 mmHg. Prescribed Amlodipine 5mg once daily.", physician: "Dr. Priya Sharma" },
      { patientId: patientIds[0], recordType: "lab_result", title: "Complete Blood Count", description: "Hemoglobin 14.2 g/dL, WBC 6500/μL, Platelets 250000/μL. All values within normal range.", physician: "Dr. Priya Sharma" },
      { patientId: patientIds[1], recordType: "treatment", title: "Knee Arthroscopy", description: "Successful minimally invasive surgery. Patient tolerated procedure well.", physician: "Dr. Rajesh Kumar" },
      { patientId: patientIds[1], recordType: "prescription", title: "Post-surgical Medication", description: "Tramadol 50mg for pain, Cefixime 200mg antibiotic course for 5 days.", physician: "Dr. Rajesh Kumar" },
      { patientId: patientIds[2], recordType: "diagnosis", title: "Atrial Fibrillation", description: "ECG shows irregular heart rhythm. Started on Warfarin therapy.", physician: "Dr. Amit Singh" },
      { patientId: patientIds[3], recordType: "note", title: "Follow-up Consultation", description: "Patient managing diabetes well. HbA1c reduced to 6.8%. Continue current medication.", physician: "Dr. Kavita Joshi" },
    ];

    sampleRecords.forEach(record => {
      const id = randomUUID();
      const medicalRecord: MedicalRecord = {
        ...record,
        id,
        recordDate: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        fileName: null,
        fileData: null,
        fileType: null,
      };
      this.medicalRecordsData.set(id, medicalRecord);
    });
  }

  // ========== CHATBOT SERVICE METHODS ==========
  async createConversationLog(log: InsertConversationLog): Promise<ConversationLog> {
    const id = randomUUID();
    const conversationLog: ConversationLog = {
      ...log,
      id,
      userId: log.userId ?? null,
      category: log.category ?? null,
      timestamp: new Date(),
    };
    this.conversationLogs.set(id, conversationLog);
    return conversationLog;
  }

  async getConversationLogs(userId?: string, limit = 50): Promise<ConversationLog[]> {
    let logs = Array.from(this.conversationLogs.values());
    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }
    logs.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });
    return logs.slice(0, limit);
  }

  async getConversationLogsByCategory(category: string, limit = 50): Promise<ConversationLog[]> {
    return Array.from(this.conversationLogs.values())
      .filter(log => log.category === category)
      .sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, limit);
  }

  // ========== PATIENT SERVICE METHODS ==========
  async getAllServicePatients(): Promise<ServicePatient[]> {
    return Array.from(this.servicePatients.values()).sort(
      (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
    );
  }

  async getServicePatientById(id: string): Promise<ServicePatient | undefined> {
    return this.servicePatients.get(id);
  }

  async createServicePatient(patient: InsertServicePatient): Promise<ServicePatient> {
    const id = randomUUID();
    const servicePatient: ServicePatient = {
      ...patient,
      id,
      phone: patient.phone ?? null,
      email: patient.email ?? null,
      address: patient.address ?? null,
      emergencyContact: patient.emergencyContact ?? null,
      emergencyPhone: patient.emergencyPhone ?? null,
      insuranceProvider: patient.insuranceProvider ?? null,
      insuranceNumber: patient.insuranceNumber ?? null,
      createdAt: new Date(),
    };
    this.servicePatients.set(id, servicePatient);
    return servicePatient;
  }

  async updateServicePatient(id: string, patient: Partial<InsertServicePatient>): Promise<ServicePatient | undefined> {
    const existing = this.servicePatients.get(id);
    if (!existing) return undefined;
    
    const updated: ServicePatient = { ...existing, ...patient };
    this.servicePatients.set(id, updated);
    return updated;
  }

  async deleteServicePatient(id: string): Promise<boolean> {
    return this.servicePatients.delete(id);
  }

  // ========== ADMISSIONS METHODS ==========
  async getAllAdmissions(): Promise<Admission[]> {
    return Array.from(this.admissionsData.values()).sort(
      (a, b) => (b.admissionDate?.getTime() ?? 0) - (a.admissionDate?.getTime() ?? 0)
    );
  }

  async getActiveAdmissions(): Promise<Admission[]> {
    return Array.from(this.admissionsData.values())
      .filter(admission => admission.status === "admitted")
      .sort((a, b) => (b.admissionDate?.getTime() ?? 0) - (a.admissionDate?.getTime() ?? 0));
  }

  async getAdmissionById(id: string): Promise<Admission | undefined> {
    return this.admissionsData.get(id);
  }

  async getAdmissionsByPatient(patientId: string): Promise<Admission[]> {
    return Array.from(this.admissionsData.values())
      .filter(admission => admission.patientId === patientId)
      .sort((a, b) => (b.admissionDate?.getTime() ?? 0) - (a.admissionDate?.getTime() ?? 0));
  }

  async createAdmission(admission: InsertAdmission): Promise<Admission> {
    const id = randomUUID();
    const admissionRecord: Admission = {
      ...admission,
      id,
      admissionDate: new Date(),
      dischargeDate: null,
      roomNumber: admission.roomNumber ?? null,
      primaryDiagnosis: admission.primaryDiagnosis ?? null,
      status: admission.status ?? "admitted",
      notes: admission.notes ?? null,
      createdAt: new Date(),
    };
    this.admissionsData.set(id, admissionRecord);
    return admissionRecord;
  }

  async updateAdmission(id: string, admission: Partial<InsertAdmission>): Promise<Admission | undefined> {
    const existing = this.admissionsData.get(id);
    if (!existing) return undefined;
    
    const updated: Admission = { ...existing, ...admission };
    this.admissionsData.set(id, updated);
    return updated;
  }

  async dischargePatient(id: string, dischargeDate: Date, notes?: string): Promise<Admission | undefined> {
    const admission = this.admissionsData.get(id);
    if (!admission) return undefined;
    
    admission.status = "discharged";
    admission.dischargeDate = dischargeDate;
    if (notes) {
      admission.notes = notes;
    }
    this.admissionsData.set(id, admission);
    return admission;
  }

  // ========== MEDICAL RECORDS METHODS ==========
  async getAllMedicalRecords(): Promise<MedicalRecord[]> {
    return Array.from(this.medicalRecordsData.values()).sort(
      (a, b) => (b.recordDate?.getTime() ?? 0) - (a.recordDate?.getTime() ?? 0)
    );
  }

  async getMedicalRecordById(id: string): Promise<MedicalRecord | undefined> {
    return this.medicalRecordsData.get(id);
  }

  async getMedicalRecordsByPatient(patientId: string): Promise<MedicalRecord[]> {
    return Array.from(this.medicalRecordsData.values())
      .filter(record => record.patientId === patientId)
      .sort((a, b) => (b.recordDate?.getTime() ?? 0) - (a.recordDate?.getTime() ?? 0));
  }

  async createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord> {
    const id = randomUUID();
    const medicalRecord: MedicalRecord = {
      ...record,
      id,
      recordDate: new Date(),
      createdAt: new Date(),
      fileName: record.fileName ?? null,
      fileData: record.fileData ?? null,
      fileType: record.fileType ?? null,
    };
    this.medicalRecordsData.set(id, medicalRecord);
    return medicalRecord;
  }

  async updateMedicalRecord(id: string, record: Partial<InsertMedicalRecord>): Promise<MedicalRecord | undefined> {
    const existing = this.medicalRecordsData.get(id);
    if (!existing) return undefined;
    
    const updated: MedicalRecord = { ...existing, ...record };
    this.medicalRecordsData.set(id, updated);
    return updated;
  }

  async deleteMedicalRecord(id: string): Promise<boolean> {
    return this.medicalRecordsData.delete(id);
  }

  // ========== BIOMETRIC SERVICE METHODS ==========
  
  private initializeBiometricData() {
    // Sample biometric templates linked to service patients
    const sampleTemplates = [
      { patientId: "patient-001", biometricType: "fingerprint", quality: 95 },
      { patientId: "patient-002", biometricType: "face", quality: 88 },
      { patientId: "patient-003", biometricType: "fingerprint", quality: 92 },
      { patientId: "patient-001", biometricType: "face", quality: 90 },
    ];

    sampleTemplates.forEach(template => {
      const id = randomUUID();
      const iv = randomBytes(16).toString("hex");
      const encryptedData = this.encryptBiometricData(`SIMULATED_TEMPLATE_${template.patientId}_${template.biometricType}`);
      
      const biometricTemplate: BiometricTemplate = {
        id,
        patientId: template.patientId,
        biometricType: template.biometricType,
        templateData: encryptedData.encrypted,
        encryptionIv: encryptedData.iv,
        quality: template.quality,
        isActive: true,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      };
      this.biometricTemplates.set(id, biometricTemplate);
    });

    // Sample verification logs
    const sampleVerifications = [
      { patientId: "patient-001", biometricType: "fingerprint", confidenceScore: "98.5", isMatch: true },
      { patientId: "patient-002", biometricType: "face", confidenceScore: "87.3", isMatch: true },
      { patientId: "patient-003", biometricType: "fingerprint", confidenceScore: "45.2", isMatch: false },
      { patientId: "patient-001", biometricType: "face", confidenceScore: "92.1", isMatch: true },
      { patientId: "unknown", biometricType: "fingerprint", confidenceScore: "23.4", isMatch: false },
    ];

    sampleVerifications.forEach(verification => {
      const id = randomUUID();
      const templates = Array.from(this.biometricTemplates.values())
        .filter(t => t.patientId === verification.patientId && t.biometricType === verification.biometricType);
      
      const biometricVerification: BiometricVerification = {
        id,
        patientId: verification.patientId,
        templateId: templates[0]?.id || null,
        biometricType: verification.biometricType,
        confidenceScore: verification.confidenceScore,
        isMatch: verification.isMatch,
        verifiedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        ipAddress: "192.168.1." + Math.floor(Math.random() * 255),
        deviceInfo: "Biometric Scanner v2.1",
      };
      this.biometricVerifications.set(id, biometricVerification);
    });
  }

  private encryptBiometricData(data: string): { encrypted: string; iv: string } {
    const algorithm = "aes-256-cbc";
    const key = process.env.BIOMETRIC_ENCRYPTION_KEY || randomBytes(32).toString("hex").slice(0, 32);
    const iv = randomBytes(16);
    
    const cipher = createCipheriv(algorithm, Buffer.from(key.padEnd(32, "0").slice(0, 32)), iv);
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    return { encrypted, iv: iv.toString("hex") };
  }

  private decryptBiometricData(encrypted: string, ivHex: string): string {
    const algorithm = "aes-256-cbc";
    const key = process.env.BIOMETRIC_ENCRYPTION_KEY || randomBytes(32).toString("hex").slice(0, 32);
    const iv = Buffer.from(ivHex, "hex");
    
    const decipher = createDecipheriv(algorithm, Buffer.from(key.padEnd(32, "0").slice(0, 32)), iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  }

  async getAllBiometricTemplates(): Promise<BiometricTemplate[]> {
    return Array.from(this.biometricTemplates.values())
      .filter(t => t.isActive)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getBiometricTemplateById(id: string): Promise<BiometricTemplate | undefined> {
    return this.biometricTemplates.get(id);
  }

  async getBiometricTemplatesByPatient(patientId: string): Promise<BiometricTemplate[]> {
    return Array.from(this.biometricTemplates.values())
      .filter(t => t.patientId === patientId && t.isActive)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async createBiometricTemplate(template: InsertBiometricTemplate): Promise<BiometricTemplate> {
    const id = randomUUID();
    const encrypted = this.encryptBiometricData(template.templateData);
    
    const biometricTemplate: BiometricTemplate = {
      id,
      patientId: template.patientId,
      biometricType: template.biometricType,
      templateData: encrypted.encrypted,
      encryptionIv: encrypted.iv,
      quality: template.quality ?? 0,
      isActive: template.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.biometricTemplates.set(id, biometricTemplate);
    return biometricTemplate;
  }

  async updateBiometricTemplate(id: string, template: Partial<InsertBiometricTemplate>): Promise<BiometricTemplate | undefined> {
    const existing = this.biometricTemplates.get(id);
    if (!existing) return undefined;
    
    let updatedData = existing.templateData;
    let updatedIv = existing.encryptionIv;
    
    if (template.templateData) {
      const encrypted = this.encryptBiometricData(template.templateData);
      updatedData = encrypted.encrypted;
      updatedIv = encrypted.iv;
    }
    
    const updated: BiometricTemplate = {
      ...existing,
      ...template,
      templateData: updatedData,
      encryptionIv: updatedIv,
      updatedAt: new Date(),
    };
    this.biometricTemplates.set(id, updated);
    return updated;
  }

  async deleteBiometricTemplate(id: string): Promise<boolean> {
    const template = this.biometricTemplates.get(id);
    if (!template) return false;
    
    template.isActive = false;
    template.updatedAt = new Date();
    this.biometricTemplates.set(id, template);
    return true;
  }

  async getAllBiometricVerifications(): Promise<BiometricVerification[]> {
    return Array.from(this.biometricVerifications.values())
      .sort((a, b) => (b.verifiedAt?.getTime() ?? 0) - (a.verifiedAt?.getTime() ?? 0));
  }

  async getRecentBiometricVerifications(limit: number = 10): Promise<BiometricVerification[]> {
    return Array.from(this.biometricVerifications.values())
      .sort((a, b) => (b.verifiedAt?.getTime() ?? 0) - (a.verifiedAt?.getTime() ?? 0))
      .slice(0, limit);
  }

  async getBiometricVerificationsByPatient(patientId: string): Promise<BiometricVerification[]> {
    return Array.from(this.biometricVerifications.values())
      .filter(v => v.patientId === patientId)
      .sort((a, b) => (b.verifiedAt?.getTime() ?? 0) - (a.verifiedAt?.getTime() ?? 0));
  }

  async createBiometricVerification(verification: InsertBiometricVerification): Promise<BiometricVerification> {
    const id = randomUUID();
    
    const biometricVerification: BiometricVerification = {
      id,
      patientId: verification.patientId,
      templateId: verification.templateId ?? null,
      biometricType: verification.biometricType,
      confidenceScore: verification.confidenceScore,
      isMatch: verification.isMatch,
      verifiedAt: new Date(),
      ipAddress: verification.ipAddress ?? null,
      deviceInfo: verification.deviceInfo ?? null,
    };
    this.biometricVerifications.set(id, biometricVerification);
    return biometricVerification;
  }

  async getBiometricStats(): Promise<{
    totalPatients: number;
    totalTemplates: number;
    verificationsToday: number;
    successfulVerifications: number;
    fingerprintTemplates: number;
    faceTemplates: number;
  }> {
    const templates = Array.from(this.biometricTemplates.values()).filter(t => t.isActive);
    const verifications = Array.from(this.biometricVerifications.values());
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const verificationsToday = verifications.filter(v => 
      v.verifiedAt && v.verifiedAt >= today
    ).length;
    
    const successfulVerifications = verifications.filter(v => v.isMatch).length;
    
    const uniquePatients = new Set(templates.map(t => t.patientId)).size;
    
    return {
      totalPatients: uniquePatients,
      totalTemplates: templates.length,
      verificationsToday,
      successfulVerifications,
      fingerprintTemplates: templates.filter(t => t.biometricType === "fingerprint").length,
      faceTemplates: templates.filter(t => t.biometricType === "face").length,
    };
  }

  // ========== NOTIFICATION SERVICE METHODS ==========
  
  private initializeNotificationData() {
    // Sample team members
    const sampleTeamMembers = [
      { name: "Dr. Priya Sharma", title: "Chief Medical Officer", department: "emergency_medicine", specialization: "Emergency Medicine", email: "priya.sharma@galaxy.hospital", phone: "+91 98765 43210", isOnCall: true, status: "available" },
      { name: "Dr. Rajesh Kumar", title: "Senior Cardiologist", department: "cardiology", specialization: "Interventional Cardiology", email: "rajesh.kumar@galaxy.hospital", phone: "+91 98765 43211", isOnCall: false, status: "available" },
      { name: "Dr. Anjali Patel", title: "Head of Pediatrics", department: "pediatrics", specialization: "Pediatric Care", email: "anjali.patel@galaxy.hospital", phone: "+91 98765 43212", isOnCall: true, status: "busy" },
      { name: "Dr. Suresh Reddy", title: "Orthopedic Surgeon", department: "orthopedics", specialization: "Joint Replacement", email: "suresh.reddy@galaxy.hospital", phone: "+91 98765 43213", isOnCall: false, status: "available" },
      { name: "Dr. Meera Gupta", title: "Neurologist", department: "neurology", specialization: "Stroke Care", email: "meera.gupta@galaxy.hospital", phone: "+91 98765 43214", isOnCall: true, status: "available" },
      { name: "Dr. Vikram Singh", title: "General Surgeon", department: "general_surgery", specialization: "Laparoscopic Surgery", email: "vikram.singh@galaxy.hospital", phone: "+91 98765 43215", isOnCall: false, status: "offline" },
      { name: "Dr. Kavita Joshi", title: "Radiologist", department: "radiology", specialization: "Diagnostic Imaging", email: "kavita.joshi@galaxy.hospital", phone: "+91 98765 43216", isOnCall: false, status: "available" },
      { name: "Dr. Arjun Mehta", title: "Pathologist", department: "pathology", specialization: "Clinical Pathology", email: "arjun.mehta@galaxy.hospital", phone: "+91 98765 43217", isOnCall: false, status: "available" },
      { name: "Nurse Sunita Verma", title: "Head Nurse", department: "emergency_medicine", specialization: "Emergency Care", email: "sunita.verma@galaxy.hospital", phone: "+91 98765 43218", isOnCall: true, status: "available" },
      { name: "Mr. Ramesh Nair", title: "Hospital Administrator", department: "administration", specialization: "Operations Management", email: "ramesh.nair@galaxy.hospital", phone: "+91 98765 43219", isOnCall: false, status: "available" },
    ];

    sampleTeamMembers.forEach(member => {
      const id = randomUUID();
      const teamMember: HospitalTeamMember = {
        id,
        name: member.name,
        title: member.title,
        department: member.department,
        specialization: member.specialization,
        email: member.email,
        phone: member.phone,
        photoUrl: null,
        isOnCall: member.isOnCall,
        status: member.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.hospitalTeamMembers.set(id, teamMember);
    });

    // Sample notifications
    const sampleNotifications = [
      { title: "OPD Timings Changed for Diwali Holidays", message: "Please note that OPD will operate from 9 AM to 2 PM from Nov 10-15, 2024. Emergency services will continue 24/7.", category: "opd_announcements", priority: "high", channels: ["push", "email", "sms"], status: "sent" },
      { title: "New COVID-19 Vaccination Drive", message: "We are launching a new vaccination drive for booster doses starting Monday. Register at the OPD counter.", category: "hospital_updates", priority: "medium", channels: ["push", "email"], status: "sent" },
      { title: "Emergency Blood Donation Camp", message: "Urgent! Blood donation camp this weekend. All blood groups needed. Contact reception for details.", category: "emergency", priority: "critical", channels: ["push", "email", "sms", "whatsapp"], status: "sent" },
      { title: "Stay Hydrated During Summer", message: "Health Tip: Drink at least 8 glasses of water daily. Include fruits like watermelon and cucumber in your diet.", category: "health_tips", priority: "low", channels: ["push", "whatsapp"], status: "sent" },
      { title: "New MRI Machine Installation", message: "We are pleased to announce the installation of a new 3 Tesla MRI machine. Now available for advanced diagnostic imaging.", category: "hospital_updates", priority: "medium", channels: ["email"], status: "scheduled" },
      { title: "Monsoon Health Advisory", message: "Protect yourself from monsoon diseases. Avoid street food and stagnant water. Get vaccinated for flu.", category: "disease_alerts", priority: "high", channels: ["push", "sms"], status: "draft" },
    ];

    sampleNotifications.forEach(notif => {
      const id = randomUUID();
      const notification: Notification = {
        id,
        title: notif.title,
        message: notif.message,
        category: notif.category,
        priority: notif.priority,
        channels: notif.channels,
        scheduledAt: notif.status === "scheduled" ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
        mediaFiles: null,
        attachedLink: null,
        status: notif.status,
        createdBy: "System Admin",
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        sentAt: notif.status === "sent" ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
      };
      this.notificationsData.set(id, notification);
    });
  }

  async getAllNotifications(): Promise<Notification[]> {
    return Array.from(this.notificationsData.values())
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getNotificationById(id: string): Promise<Notification | undefined> {
    return this.notificationsData.get(id);
  }

  async getNotificationsByStatus(status: string): Promise<Notification[]> {
    return Array.from(this.notificationsData.values())
      .filter(n => n.status === status)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getNotificationsByCategory(category: string): Promise<Notification[]> {
    return Array.from(this.notificationsData.values())
      .filter(n => n.category === category)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const newNotification: Notification = {
      id,
      title: notification.title,
      message: notification.message,
      category: notification.category,
      priority: notification.priority ?? "medium",
      channels: notification.channels,
      scheduledAt: notification.scheduledAt ?? null,
      mediaFiles: notification.mediaFiles ?? null,
      attachedLink: notification.attachedLink ?? null,
      status: notification.status ?? "draft",
      createdBy: notification.createdBy ?? null,
      createdAt: new Date(),
      sentAt: null,
    };
    this.notificationsData.set(id, newNotification);
    return newNotification;
  }

  async updateNotification(id: string, notification: Partial<InsertNotification>): Promise<Notification | undefined> {
    const existing = this.notificationsData.get(id);
    if (!existing) return undefined;
    
    const updated: Notification = { ...existing, ...notification };
    this.notificationsData.set(id, updated);
    return updated;
  }

  async deleteNotification(id: string): Promise<boolean> {
    return this.notificationsData.delete(id);
  }

  async sendNotification(id: string): Promise<Notification | undefined> {
    const notification = this.notificationsData.get(id);
    if (!notification) return undefined;
    
    notification.status = "sent";
    notification.sentAt = new Date();
    this.notificationsData.set(id, notification);
    return notification;
  }

  async getNotificationStats(): Promise<{
    totalSent: number;
    pendingCount: number;
    byChannel: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    const notifications = Array.from(this.notificationsData.values());
    
    const totalSent = notifications.filter(n => n.status === "sent").length;
    const pendingCount = notifications.filter(n => n.status === "draft" || n.status === "scheduled").length;
    
    const byChannel: Record<string, number> = { push: 0, email: 0, sms: 0, whatsapp: 0 };
    const byCategory: Record<string, number> = {};
    
    notifications.filter(n => n.status === "sent").forEach(n => {
      n.channels.forEach(channel => {
        byChannel[channel] = (byChannel[channel] || 0) + 1;
      });
      byCategory[n.category] = (byCategory[n.category] || 0) + 1;
    });
    
    return { totalSent, pendingCount, byChannel, byCategory };
  }

  // Hospital Team Members methods
  async getAllTeamMembers(): Promise<HospitalTeamMember[]> {
    return Array.from(this.hospitalTeamMembers.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getTeamMemberById(id: string): Promise<HospitalTeamMember | undefined> {
    return this.hospitalTeamMembers.get(id);
  }

  async getTeamMembersByDepartment(department: string): Promise<HospitalTeamMember[]> {
    return Array.from(this.hospitalTeamMembers.values())
      .filter(m => m.department === department)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getOnCallTeamMembers(): Promise<HospitalTeamMember[]> {
    return Array.from(this.hospitalTeamMembers.values())
      .filter(m => m.isOnCall)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async createTeamMember(member: InsertHospitalTeamMember): Promise<HospitalTeamMember> {
    const id = randomUUID();
    const newMember: HospitalTeamMember = {
      id,
      name: member.name,
      title: member.title,
      department: member.department,
      specialization: member.specialization ?? null,
      email: member.email,
      phone: member.phone,
      photoUrl: member.photoUrl ?? null,
      isOnCall: member.isOnCall ?? false,
      status: member.status ?? "available",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.hospitalTeamMembers.set(id, newMember);
    return newMember;
  }

  async updateTeamMember(id: string, member: Partial<InsertHospitalTeamMember>): Promise<HospitalTeamMember | undefined> {
    const existing = this.hospitalTeamMembers.get(id);
    if (!existing) return undefined;
    
    const updated: HospitalTeamMember = { 
      ...existing, 
      ...member, 
      updatedAt: new Date() 
    };
    this.hospitalTeamMembers.set(id, updated);
    return updated;
  }

  async deleteTeamMember(id: string): Promise<boolean> {
    return this.hospitalTeamMembers.delete(id);
  }

  async updateTeamMemberOnCallStatus(id: string, isOnCall: boolean): Promise<HospitalTeamMember | undefined> {
    const member = this.hospitalTeamMembers.get(id);
    if (!member) return undefined;
    
    member.isOnCall = isOnCall;
    member.updatedAt = new Date();
    this.hospitalTeamMembers.set(id, member);
    return member;
  }

  // ========== ACTIVITY LOG METHODS ==========
  private activityLogsData: Map<string, ActivityLog> = new Map();

  async getActivityLogs(limit?: number): Promise<ActivityLog[]> {
    const logs = Array.from(this.activityLogsData.values())
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
    return limit ? logs.slice(0, limit) : logs;
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const id = randomUUID();
    const newLog: ActivityLog = {
      id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId ?? null,
      performedBy: log.performedBy,
      performedByRole: log.performedByRole ?? null,
      details: log.details ?? null,
      activityType: log.activityType ?? "info",
      createdAt: new Date(),
    };
    this.activityLogsData.set(id, newLog);
    return newLog;
  }

  // ========== EQUIPMENT SERVICING STUB METHODS ==========
  private equipmentData: Map<string, Equipment> = new Map();
  private serviceHistoryData: Map<string, ServiceHistory> = new Map();
  private emergencyContactsData: Map<string, EmergencyContact> = new Map();

  async getEquipment(): Promise<Equipment[]> {
    return Array.from(this.equipmentData.values());
  }

  async getEquipmentById(id: string): Promise<Equipment | undefined> {
    return this.equipmentData.get(id);
  }

  async createEquipment(equip: InsertEquipment): Promise<Equipment> {
    const id = randomUUID();
    const newEquip: Equipment = {
      id,
      name: equip.name,
      model: equip.model,
      serialNumber: equip.serialNumber,
      lastServiceDate: equip.lastServiceDate ?? null,
      nextDueDate: equip.nextDueDate,
      status: equip.status ?? "up-to-date",
      location: equip.location,
      serviceFrequency: equip.serviceFrequency ?? "quarterly",
      companyName: equip.companyName ?? null,
      contactNumber: equip.contactNumber ?? null,
      emergencyNumber: equip.emergencyNumber ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.equipmentData.set(id, newEquip);
    return newEquip;
  }

  async updateEquipment(id: string, updates: Partial<InsertEquipment>): Promise<Equipment | undefined> {
    const existing = this.equipmentData.get(id);
    if (!existing) return undefined;
    const updated: Equipment = { ...existing, ...updates, updatedAt: new Date() };
    this.equipmentData.set(id, updated);
    return updated;
  }

  async deleteEquipment(id: string): Promise<boolean> {
    return this.equipmentData.delete(id);
  }

  async getServiceHistory(equipmentId?: string): Promise<ServiceHistory[]> {
    const history = Array.from(this.serviceHistoryData.values());
    if (equipmentId) {
      return history.filter(h => h.equipmentId === equipmentId);
    }
    return history;
  }

  async createServiceHistory(history: InsertServiceHistory): Promise<ServiceHistory> {
    const id = randomUUID();
    const newHistory: ServiceHistory = {
      id,
      equipmentId: history.equipmentId,
      serviceDate: history.serviceDate,
      technician: history.technician,
      description: history.description,
      cost: history.cost,
      createdAt: new Date(),
    };
    this.serviceHistoryData.set(id, newHistory);
    return newHistory;
  }

  async deleteServiceHistory(id: string): Promise<boolean> {
    return this.serviceHistoryData.delete(id);
  }

  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    return Array.from(this.emergencyContactsData.values());
  }

  async createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact> {
    const id = randomUUID();
    const newContact: EmergencyContact = {
      id,
      name: contact.name,
      serviceType: contact.serviceType,
      phoneNumber: contact.phoneNumber,
      isPrimary: contact.isPrimary ?? false,
      isActive: contact.isActive ?? true,
      createdAt: new Date(),
    };
    this.emergencyContactsData.set(id, newContact);
    return newContact;
  }

  async updateEmergencyContact(id: string, updates: Partial<InsertEmergencyContact>): Promise<EmergencyContact | undefined> {
    const existing = this.emergencyContactsData.get(id);
    if (!existing) return undefined;
    const updated: EmergencyContact = { ...existing, ...updates };
    this.emergencyContactsData.set(id, updated);
    return updated;
  }

  async deleteEmergencyContact(id: string): Promise<boolean> {
    return this.emergencyContactsData.delete(id);
  }

  // Hospital Settings stub methods
  private hospitalSettingsData: HospitalSettings | null = null;

  async getHospitalSettings(): Promise<HospitalSettings | undefined> {
    return this.hospitalSettingsData ?? undefined;
  }

  async createHospitalSettings(settings: InsertHospitalSettings): Promise<HospitalSettings> {
    const newSettings: HospitalSettings = {
      id: randomUUID(),
      ...settings,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.hospitalSettingsData = newSettings;
    return newSettings;
  }

  async updateHospitalSettings(id: string, updates: Partial<InsertHospitalSettings>): Promise<HospitalSettings | undefined> {
    if (!this.hospitalSettingsData || this.hospitalSettingsData.id !== id) return undefined;
    this.hospitalSettingsData = { ...this.hospitalSettingsData, ...updates, updatedAt: new Date() };
    return this.hospitalSettingsData;
  }

  async getOrCreateHospitalSettings(): Promise<HospitalSettings> {
    if (this.hospitalSettingsData) return this.hospitalSettingsData;
    return this.createHospitalSettings({
      name: "Gravity Hospital",
      address: "Chikhali, Pimpri-Chinchwad",
      phone: "+91 20 2745 8900",
      email: "info@gravityhospital.in",
    });
  }

  // Prescription stub methods
  private prescriptionsData = new Map<string, Prescription>();

  async getPrescriptions(): Promise<Prescription[]> {
    return Array.from(this.prescriptionsData.values());
  }

  async getPrescriptionsByDoctor(doctorId: string): Promise<Prescription[]> {
    return Array.from(this.prescriptionsData.values()).filter(p => p.doctorId === doctorId);
  }

  async getPrescriptionsByPatient(patientName: string): Promise<Prescription[]> {
    return Array.from(this.prescriptionsData.values()).filter(p => p.patientName === patientName);
  }

  async getPrescription(id: string): Promise<Prescription | undefined> {
    return this.prescriptionsData.get(id);
  }

  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    const id = randomUUID();
    const newPrescription: Prescription = { id, ...prescription, createdAt: new Date(), updatedAt: new Date() };
    this.prescriptionsData.set(id, newPrescription);
    return newPrescription;
  }

  async updatePrescription(id: string, updates: Partial<InsertPrescription>): Promise<Prescription | undefined> {
    const existing = this.prescriptionsData.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.prescriptionsData.set(id, updated);
    return updated;
  }

  async deletePrescription(id: string): Promise<boolean> {
    return this.prescriptionsData.delete(id);
  }

  // Doctor Schedule stub methods
  private doctorSchedulesData = new Map<string, DoctorSchedule>();

  async getDoctorSchedules(doctorId: string): Promise<DoctorSchedule[]> {
    return Array.from(this.doctorSchedulesData.values()).filter(s => s.doctorId === doctorId);
  }

  async getDoctorSchedule(id: string): Promise<DoctorSchedule | undefined> {
    return this.doctorSchedulesData.get(id);
  }

  async createDoctorSchedule(schedule: InsertDoctorSchedule): Promise<DoctorSchedule> {
    const id = randomUUID();
    const newSchedule: DoctorSchedule = { id, ...schedule, createdAt: new Date(), updatedAt: new Date() };
    this.doctorSchedulesData.set(id, newSchedule);
    return newSchedule;
  }

  async updateDoctorSchedule(id: string, updates: Partial<InsertDoctorSchedule>): Promise<DoctorSchedule | undefined> {
    const existing = this.doctorSchedulesData.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.doctorSchedulesData.set(id, updated);
    return updated;
  }

  async deleteDoctorSchedule(id: string): Promise<boolean> {
    return this.doctorSchedulesData.delete(id);
  }

  // Doctor Patient stub methods
  private doctorPatientsData = new Map<string, DoctorPatient>();

  async getDoctorPatients(doctorId: string): Promise<DoctorPatient[]> {
    return Array.from(this.doctorPatientsData.values()).filter(p => p.doctorId === doctorId);
  }

  async getDoctorPatient(id: string): Promise<DoctorPatient | undefined> {
    return this.doctorPatientsData.get(id);
  }

  async createDoctorPatient(patient: InsertDoctorPatient): Promise<DoctorPatient> {
    const id = randomUUID();
    const newPatient: DoctorPatient = { id, ...patient, createdAt: new Date(), updatedAt: new Date() };
    this.doctorPatientsData.set(id, newPatient);
    return newPatient;
  }

  async updateDoctorPatient(id: string, updates: Partial<InsertDoctorPatient>): Promise<DoctorPatient | undefined> {
    const existing = this.doctorPatientsData.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.doctorPatientsData.set(id, updated);
    return updated;
  }

  async deleteDoctorPatient(id: string): Promise<boolean> {
    return this.doctorPatientsData.delete(id);
  }

  // Doctor Profiles stub methods
  private doctorProfilesData = new Map<string, DoctorProfile>();

  async getDoctorProfile(doctorId: string): Promise<DoctorProfile | undefined> {
    return Array.from(this.doctorProfilesData.values()).find(p => p.doctorId === doctorId);
  }

  async createDoctorProfile(profile: InsertDoctorProfile): Promise<DoctorProfile> {
    const id = randomUUID();
    const newProfile: DoctorProfile = { id, ...profile, createdAt: new Date(), updatedAt: new Date() };
    this.doctorProfilesData.set(id, newProfile);
    return newProfile;
  }

  async updateDoctorProfile(doctorId: string, updates: Partial<InsertDoctorProfile>): Promise<DoctorProfile | undefined> {
    const existing = Array.from(this.doctorProfilesData.values()).find(p => p.doctorId === doctorId);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.doctorProfilesData.set(existing.id, updated);
    return updated;
  }

  // Patient Profiles stub methods
  private patientProfilesData = new Map<string, PatientProfile>();

  async getPatientProfile(patientId: string): Promise<PatientProfile | undefined> {
    return Array.from(this.patientProfilesData.values()).find(p => p.patientId === patientId);
  }

  async createPatientProfile(profile: InsertPatientProfile): Promise<PatientProfile> {
    const id = randomUUID();
    const newProfile: PatientProfile = { id, ...profile, createdAt: new Date(), updatedAt: new Date() };
    this.patientProfilesData.set(id, newProfile);
    return newProfile;
  }

  async updatePatientProfile(patientId: string, updates: Partial<InsertPatientProfile>): Promise<PatientProfile | undefined> {
    const existing = Array.from(this.patientProfilesData.values()).find(p => p.patientId === patientId);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.patientProfilesData.set(existing.id, updated);
    return updated;
  }

  async upsertPatientProfile(profile: InsertPatientProfile): Promise<PatientProfile> {
    const existing = await this.getPatientProfile(profile.patientId);
    if (existing) {
      return (await this.updatePatientProfile(profile.patientId, profile))!;
    }
    return this.createPatientProfile(profile);
  }

  // User Notifications stub methods
  private userNotificationsData = new Map<string, UserNotification>();

  async getUserNotifications(userId: string): Promise<UserNotification[]> {
    return Array.from(this.userNotificationsData.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getUserNotificationsByRole(userRole: string): Promise<UserNotification[]> {
    return Array.from(this.userNotificationsData.values())
      .filter(n => n.userRole === userRole)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getUserNotification(id: string): Promise<UserNotification | undefined> {
    return this.userNotificationsData.get(id);
  }

  async createUserNotification(notification: InsertUserNotification): Promise<UserNotification> {
    const id = randomUUID();
    const newNotification: UserNotification = { id, ...notification, isRead: false, createdAt: new Date() };
    this.userNotificationsData.set(id, newNotification);
    return newNotification;
  }

  async markUserNotificationRead(id: string): Promise<UserNotification | undefined> {
    const existing = this.userNotificationsData.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, isRead: true };
    this.userNotificationsData.set(id, updated);
    return updated;
  }

  async markAllUserNotificationsRead(userId: string): Promise<void> {
    for (const [id, notification] of this.userNotificationsData) {
      if (notification.userId === userId) {
        this.userNotificationsData.set(id, { ...notification, isRead: true });
      }
    }
  }

  async deleteUserNotification(id: string): Promise<boolean> {
    return this.userNotificationsData.delete(id);
  }

  // Consent Forms stub methods
  private consentFormsData = new Map<string, ConsentForm>();

  async getConsentForms(): Promise<ConsentForm[]> {
    return Array.from(this.consentFormsData.values())
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async getConsentForm(id: string): Promise<ConsentForm | undefined> {
    return this.consentFormsData.get(id);
  }

  async getConsentFormsByCategory(category: string): Promise<ConsentForm[]> {
    return Array.from(this.consentFormsData.values())
      .filter(f => f.category === category)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async createConsentForm(form: InsertConsentForm): Promise<ConsentForm> {
    const id = randomUUID();
    const newForm: ConsentForm = { id, ...form, createdAt: new Date(), updatedAt: new Date() };
    this.consentFormsData.set(id, newForm);
    return newForm;
  }

  async updateConsentForm(id: string, updates: Partial<InsertConsentForm>): Promise<ConsentForm | undefined> {
    const existing = this.consentFormsData.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.consentFormsData.set(id, updated);
    return updated;
  }

  async deleteConsentForm(id: string): Promise<boolean> {
    return this.consentFormsData.delete(id);
  }
}

import { databaseStorage } from "./database-storage";

// Use DatabaseStorage for persistent data storage
export const storage: IStorage = databaseStorage;
