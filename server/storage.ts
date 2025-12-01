import { type User, type InsertUser, type Doctor, type InsertDoctor, type Schedule, type InsertSchedule, type Appointment, type InsertAppointment, type InventoryItem, type InsertInventoryItem, type StaffMember, type InsertStaffMember, type InventoryPatient, type InsertInventoryPatient, type InventoryTransaction, type InsertInventoryTransaction } from "@shared/schema";
import { randomUUID } from "crypto";

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
  updateInventoryItemStock(id: string, newStock: number): Promise<InventoryItem | undefined>;
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
    
    this.initializeDefaultData();
    this.initializeInventoryData();
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
    const user: User = { ...insertUser, id };
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
}

export const storage = new MemStorage();
