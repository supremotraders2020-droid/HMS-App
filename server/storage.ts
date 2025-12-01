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
}

export const storage = new MemStorage();
