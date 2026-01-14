import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Stethoscope, 
  MapPin, 
  Phone, 
  Clock, 
  Calendar,
  Users,
  ClipboardList,
  UserCheck,
  Search,
  Star,
  Mail,
  Globe,
  Pill,
  Upload,
  FileText,
  Loader2,
  Building2,
  IndianRupee,
  Package,
  Tag,
  Trash2,
  ExternalLink,
  Printer
} from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PatientRegistrationModal, type SavedRegistrationData } from "@/components/PatientRegistrationModal";
import type { Doctor, Appointment, Schedule, Medicine, DoctorSchedule, DoctorTimeSlot } from "@shared/schema";
import { Eye } from "lucide-react";

const OPD_LOCATIONS = [
  { id: "koregaon_park", name: "Gravity Hospital - Koregaon Park", address: "Koregaon Park, Pune, Maharashtra 411001", mapUrl: "https://www.google.com/maps/search/?api=1&query=Koregaon+Park+Pune" },
  { id: "hinjewadi", name: "Gravity Hospital - Hinjewadi", address: "Hinjewadi, Pune, Maharashtra 411057", mapUrl: "https://www.google.com/maps/search/?api=1&query=Hinjewadi+Pune" },
  { id: "kothrud", name: "Gravity Hospital - Kothrud", address: "Kothrud, Pune, Maharashtra 411038", mapUrl: "https://www.google.com/maps/search/?api=1&query=Kothrud+Pune" },
  { id: "wakad", name: "Gravity Hospital - Wakad", address: "Wakad, Pimpri-Chinchwad, Maharashtra 411057", mapUrl: "https://www.google.com/maps/search/?api=1&query=Wakad+Pune" },
  { id: "viman_nagar", name: "Gravity Hospital - Viman Nagar", address: "Viman Nagar, Pune, Maharashtra 411014", mapUrl: "https://www.google.com/maps/search/?api=1&query=Viman+Nagar+Pune" },
  { id: "baner", name: "Gravity Hospital - Baner", address: "Baner, Pune, Maharashtra 411045", mapUrl: "https://www.google.com/maps/search/?api=1&query=Baner+Pune" },
  { id: "aundh", name: "Gravity Hospital - Aundh", address: "Aundh, Pune, Maharashtra 411007", mapUrl: "https://www.google.com/maps/search/?api=1&query=Aundh+Pune" },
  { id: "kalyani_nagar", name: "Gravity Hospital - Kalyani Nagar", address: "Kalyani Nagar, Pune, Maharashtra 411006", mapUrl: "https://www.google.com/maps/search/?api=1&query=Kalyani+Nagar+Pune" },
  { id: "pimpri", name: "Gravity Hospital - Pimpri", address: "Pimpri, Pimpri-Chinchwad, Maharashtra 411017", mapUrl: "https://www.google.com/maps/search/?api=1&query=Pimpri+Pune" },
  { id: "nigdi", name: "Gravity Hospital - Nigdi (Main)", address: "Gat No, 167, Sahyog Nager, Triveni Nagar, Nigdi, Pimpri-Chinchwad, Maharashtra 411062", mapUrl: "https://www.google.com/maps/search/?api=1&query=Gravity+Hospital+Nigdi+Pune" },
];

type TabType = "schedules" | "book" | "appointments" | "checkin" | "team" | "medicines";

export default function OPDService() {
  const [activeTab, setActiveTab] = useState<TabType>("schedules");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [slotFilters, setSlotFilters] = useState<Record<string, 'all' | 'available' | 'booked'>>({});
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [medicineSearch, setMedicineSearch] = useState("");
  const [medicineCategory, setMedicineCategory] = useState<string>("all");
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [showMedicineDetail, setShowMedicineDetail] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<DoctorTimeSlot | null>(null);
  const [showSlotDetail, setShowSlotDetail] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [checkinTimeFilter, setCheckinTimeFilter] = useState<string>("today");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Patient registration modal state
  const [showPatientRegistrationModal, setShowPatientRegistrationModal] = useState(false);
  const [registrationAppointmentData, setRegistrationAppointmentData] = useState<{
    appointmentId?: string;
    appointmentTime?: string;
    appointmentDate?: string;
    doctorName?: string;
    department?: string;
    patientName?: string;
    phone?: string;
  } | null>(null);
  
  // Saved registrations per appointment (keyed by appointmentId) - persisted to localStorage
  const [savedRegistrations, setSavedRegistrations] = useState<Record<string, SavedRegistrationData>>(() => {
    try {
      const stored = localStorage.getItem('opd_saved_registrations');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [pendingPrintAppointmentId, setPendingPrintAppointmentId] = useState<string | null>(null);
  const [printAfterSave, setPrintAfterSave] = useState(false);
  
  // Persist savedRegistrations to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('opd_saved_registrations', JSON.stringify(savedRegistrations));
    } catch {
      // localStorage might be full or unavailable
    }
  }, [savedRegistrations]);
  
  // Booking form state
  const [bookingDoctorId, setBookingDoctorId] = useState<string>("");
  const [bookingDate, setBookingDate] = useState<string>("");
  const [bookingTimeSlot, setBookingTimeSlot] = useState<string>("");
  const [bookingLocation, setBookingLocation] = useState<string>("");

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: schedules = [] } = useQuery<Schedule[]>({
    queryKey: ["/api/doctors", selectedDoctor, "schedules", selectedDate],
    enabled: !!selectedDoctor && !!selectedDate,
    staleTime: 0, // Always refetch to get real-time slot availability
  });

  // Fetch doctor's actual schedule blocks set by the doctor
  const selectedDoctorObj = doctors.find(d => d.id === selectedDoctor);
  const { data: doctorScheduleBlocks = [] } = useQuery<DoctorSchedule[]>({
    queryKey: ["/api/doctor-schedules-by-name", selectedDoctorObj?.name],
    enabled: !!selectedDoctor && !!selectedDoctorObj?.name,
    staleTime: 0,
  });

  // Fetch time slots from the new single-source-of-truth API
  const { data: timeSlots = [], refetch: refetchTimeSlots } = useQuery<DoctorTimeSlot[]>({
    queryKey: ["/api/time-slots", selectedDoctor, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/time-slots/${selectedDoctor}?date=${selectedDate}`);
      if (!response.ok) throw new Error("Failed to fetch time slots");
      return response.json();
    },
    enabled: !!selectedDoctor && !!selectedDate,
    staleTime: 0,
  });

  // Fetch all doctors' time slots for the selected date (for slot counts on cards)
  const { data: allDoctorSlots = [] } = useQuery<DoctorTimeSlot[]>({
    queryKey: ["/api/time-slots/all", selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/time-slots/all?date=${selectedDate}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedDate,
    staleTime: 0,
  });

  // Fetch schedule-based availability as fallback when no pre-generated slots exist
  interface ScheduleAvailability {
    doctorName: string;
    userId: string;
    doctorTableId: string | null;
    hasScheduleToday: boolean;
    scheduledDays: string[];
    available: number;
    booked: number;
    total: number;
  }
  const { data: scheduleAvailability = [] } = useQuery<ScheduleAvailability[]>({
    queryKey: ["/api/schedule-availability", selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/schedule-availability?date=${selectedDate}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedDate,
    staleTime: 0,
  });

  // Fetch booking form doctor's schedule blocks (for generating available slots)
  const bookingDoctor = doctors.find(d => d.id === bookingDoctorId);
  const { data: bookingDoctorSchedules = [] } = useQuery<DoctorSchedule[]>({
    queryKey: ["/api/doctor-schedules-by-name", bookingDoctor?.name],
    enabled: !!bookingDoctorId && !!bookingDoctor?.name,
    staleTime: 0,
  });

  // Get the schedule owner's ID (user ID) from the schedule blocks
  // This is needed because doctor_schedules.doctor_id references users table, not doctors table
  const scheduleOwnerId = bookingDoctorSchedules.length > 0 ? bookingDoctorSchedules[0].doctorId : null;

  // Fetch available time slots for booking form from the database
  const { data: bookingTimeSlots = [] } = useQuery<DoctorTimeSlot[]>({
    queryKey: ["/api/time-slots", scheduleOwnerId, bookingDate, "available"],
    queryFn: async () => {
      if (!scheduleOwnerId) return [];
      const response = await fetch(`/api/time-slots/${scheduleOwnerId}/available/${bookingDate}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!scheduleOwnerId && !!bookingDate,
    staleTime: 0,
  });

  // Generate available time slots from doctor's schedule blocks if no pre-generated slots exist
  const getBookingAvailableSlots = (): { time: string; location: string | null }[] => {
    // Helper to convert time to minutes for sorting
    const timeToMinsHelper = (timeStr: string): number => {
      const [time, period] = timeStr.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let totalHours = hours;
      if (period === 'PM' && hours !== 12) totalHours += 12;
      if (period === 'AM' && hours === 12) totalHours = 0;
      return totalHours * 60 + (minutes || 0);
    };

    // If we have pre-generated slots in the database, use those (sorted AM to PM)
    if (bookingTimeSlots.length > 0) {
      return bookingTimeSlots
        .map(slot => ({
          time: slot.startTime,
          location: slot.location,
        }))
        .sort((a, b) => timeToMinsHelper(a.time) - timeToMinsHelper(b.time));
    }

    // Otherwise, generate slots from the doctor's schedule blocks
    if (!bookingDate || bookingDoctorSchedules.length === 0) return [];

    const selectedDateObj = new Date(bookingDate + 'T00:00:00');
    const dayName = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' });

    // Find schedule blocks for the selected day - prioritize specific date matches, then fall back to day name
    const daySchedules = bookingDoctorSchedules.filter(s => {
      // First check for specific date matches
      if (s.specificDate === bookingDate && s.isAvailable) return true;
      // Then check for day name matches (only if no specificDate set)
      if (!s.specificDate && s.day === dayName && s.isAvailable) return true;
      return false;
    });

    if (daySchedules.length === 0) return [];

    // Generate 30-minute slots from each schedule block
    const slots: { time: string; location: string | null }[] = [];
    
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

    for (const schedule of daySchedules) {
      const startMins = timeToMins(schedule.startTime);
      const endMins = timeToMins(schedule.endTime);
      
      for (let mins = startMins; mins < endMins; mins += 30) {
        slots.push({
          time: minsToTime(mins),
          location: schedule.location || null,
        });
      }
    }

    // Normalize time to "HH:MM AM/PM" format for comparison
    const normalizeTime = (timeStr: string | null | undefined): string => {
      if (!timeStr) return '';
      // Handle "HH:MM" format (add AM/PM)
      if (!timeStr.includes('AM') && !timeStr.includes('PM')) {
        const [hours, mins] = timeStr.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${String(displayHours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${period}`;
      }
      return timeStr;
    };

    // Filter out already-booked slots by checking existing appointments
    const bookedTimes = appointments
      .filter(apt => 
        apt.appointmentDate === bookingDate && 
        apt.status !== 'cancelled' &&
        (apt.doctorId === bookingDoctorId || 
         apt.department?.toLowerCase() === bookingDoctor?.specialty?.toLowerCase())
      )
      .map(apt => normalizeTime(apt.timeSlot?.split(' - ')[0] || apt.timeSlot));

    // Sort slots from AM to PM (morning to evening)
    return slots
      .filter(slot => !bookedTimes.includes(slot.time))
      .sort((a, b) => timeToMins(a.time) - timeToMins(b.time));
  };

  const availableBookingSlots = getBookingAvailableSlots();

  // Get unique locations from available slots for the location dropdown
  const availableBookingLocations = (() => {
    const locations = new Set<string>();
    availableBookingSlots.forEach(slot => {
      if (slot.location) locations.add(slot.location);
    });
    return Array.from(locations);
  })();

  // Get legacy appointments for a doctor (booked via old system, not in time_slots table)
  const getLegacyAppointmentsForDoctor = (doctorId: string): DoctorTimeSlot[] => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (!doctor) return [];
    
    const legacyAppointments = appointments.filter(apt => {
      if (apt.status === 'cancelled' || apt.status === 'completed') return false;
      if (apt.appointmentDate !== selectedDate) return false;
      const matchesDepartment = apt.department?.toLowerCase() === doctor.specialty?.toLowerCase();
      const matchesDoctorId = apt.doctorId === doctorId;
      return matchesDepartment || matchesDoctorId;
    });
    
    // Convert to virtual time slots
    return legacyAppointments.map(apt => ({
      id: `legacy-${apt.id}`,
      scheduleId: `legacy-schedule-${apt.id}`,
      doctorId: doctorId,
      doctorName: doctor.name,
      slotDate: apt.appointmentDate,
      startTime: apt.timeSlot?.split(' - ')[0] || apt.timeSlot || 'N/A',
      endTime: apt.timeSlot?.split(' - ')[1] || '',
      slotType: 'legacy',
      location: null,
      status: 'booked' as const,
      patientId: null,
      patientName: apt.patientName,
      appointmentId: apt.id,
      bookedAt: apt.createdAt ? new Date(apt.createdAt) : null,
      createdAt: apt.createdAt ? new Date(apt.createdAt) : null,
      updatedAt: null,
    }));
  };

  // Helper to get schedule metadata for a doctor
  const getDoctorScheduleInfo = (doctorId: string): { hasScheduleToday: boolean; scheduledDays: string[] } | null => {
    // First try to match by doctorTableId (preferred - exact ID match)
    const scheduleMatchById = scheduleAvailability.find(sa => sa.doctorTableId === doctorId);
    if (scheduleMatchById) {
      return {
        hasScheduleToday: scheduleMatchById.hasScheduleToday,
        scheduledDays: scheduleMatchById.scheduledDays
      };
    }
    
    // Fallback to name matching if ID not found
    const doctor = doctors.find(d => d.id === doctorId);
    if (!doctor) return null;
    
    const doctorName = doctor.name.replace(/^Dr\.?\s*/i, '').toLowerCase();
    const scheduleMatch = scheduleAvailability.find(sa => {
      const saName = sa.doctorName.replace(/^Dr\.?\s*/i, '').toLowerCase();
      return saName === doctorName;
    });
    
    if (scheduleMatch) {
      return {
        hasScheduleToday: scheduleMatch.hasScheduleToday,
        scheduledDays: scheduleMatch.scheduledDays
      };
    }
    return null;
  };

  // Helper to get slot counts for a specific doctor
  // Uses doctorTableId for exact matching when available
  const getDoctorSlotCounts = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (!doctor) return { available: 0, booked: 0, total: 0, hasScheduleToday: false };
    
    // Match slots by doctor name (partial match to handle "Dr." prefix variations)
    // Also filter by selectedDate to ensure date-specific counts
    const doctorName = doctor.name.replace(/^Dr\.?\s*/i, '').toLowerCase();
    const doctorSlots = allDoctorSlots.filter(s => {
      const slotDoctorName = (s.doctorName || '').replace(/^Dr\.?\s*/i, '').toLowerCase();
      const nameMatches = slotDoctorName === doctorName;
      const dateMatches = s.slotDate === selectedDate;
      return nameMatches && dateMatches;
    });
    
    // If no pre-generated slots, use schedule-based availability as fallback
    if (doctorSlots.length === 0 && scheduleAvailability.length > 0) {
      // First try to match by doctorTableId (exact ID match)
      const scheduleMatchById = scheduleAvailability.find(sa => sa.doctorTableId === doctorId);
      if (scheduleMatchById) {
        return {
          available: scheduleMatchById.available,
          booked: scheduleMatchById.booked,
          total: scheduleMatchById.total,
          hasScheduleToday: scheduleMatchById.hasScheduleToday
        };
      }
      
      // Fallback to exact name match
      const scheduleMatch = scheduleAvailability.find(sa => {
        const saName = sa.doctorName.replace(/^Dr\.?\s*/i, '').toLowerCase();
        return saName === doctorName;
      });
      if (scheduleMatch) {
        return {
          available: scheduleMatch.available,
          booked: scheduleMatch.booked,
          total: scheduleMatch.total,
          hasScheduleToday: scheduleMatch.hasScheduleToday
        };
      }
    }
    
    // Also count legacy appointments (booked via /api/appointments without slot system)
    const legacyAppointments = appointments.filter(apt => {
      if (apt.status === 'cancelled' || apt.status === 'completed') return false;
      if (apt.appointmentDate !== selectedDate) return false;
      const matchesDepartment = apt.department?.toLowerCase() === doctor.specialty?.toLowerCase();
      const matchesDoctorId = apt.doctorId === doctorId;
      return matchesDepartment || matchesDoctorId;
    });
    
    // Create a set of legacy appointment times for quick lookup
    const legacyTimes = new Set(legacyAppointments.map(apt => apt.timeSlot?.split(' - ')[0] || apt.timeSlot));
    
    // Count slots considering legacy overlaps:
    // - A slot is "booked" if it's marked booked OR if there's a legacy appointment at that time
    // - A slot is "available" only if it's marked available AND no legacy appointment exists
    let available = 0;
    let booked = 0;
    
    for (const slot of doctorSlots) {
      if (slot.status === 'booked') {
        booked++;
      } else if (legacyTimes.has(slot.startTime)) {
        booked++; // Real slot is available but legacy appointment exists
      } else {
        available++;
      }
    }
    
    // Add legacy appointments that don't have corresponding real slots
    const realSlotTimes = new Set(doctorSlots.map(s => s.startTime));
    const uniqueLegacyCount = legacyAppointments.filter(apt => {
      const aptTime = apt.timeSlot?.split(' - ')[0] || apt.timeSlot;
      return !realSlotTimes.has(aptTime);
    }).length;
    
    booked += uniqueLegacyCount;
    const total = doctorSlots.length + uniqueLegacyCount;
    return { available, booked, total, hasScheduleToday: doctorSlots.length > 0 };
  };

  // WebSocket listener for real-time slot updates
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws/notifications?userId=admin&userRole=ADMIN`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'slots.generated' || data.type === 'slot.booked' || data.type === 'slot.cancelled' || data.type === 'slot_update') {
          queryClient.invalidateQueries({ queryKey: ["/api/time-slots"] });
          queryClient.invalidateQueries({ queryKey: ["/api/time-slots/all"] });
          queryClient.invalidateQueries({ queryKey: ["/api/doctor-schedules-by-name"] });
          if (data.type === 'slots.generated') {
            toast({
              title: "Slots Generated",
              description: `${data.count || 'New'} time slots are now available`,
            });
          } else if (data.type === 'slot.booked') {
            toast({
              title: "Slot Booked",
              description: data.patientName ? `Booked by ${data.patientName}` : 'Slot booked',
            });
          }
        }
      } catch (e) {
        console.error("WebSocket message parse error:", e);
      }
    };

    return () => ws.close();
  }, [toast]);

  // Medicines query with search support
  const { data: medicines = [], isLoading: medicinesLoading } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines", medicineSearch],
    queryFn: async () => {
      const searchParam = medicineSearch.trim() ? `?search=${encodeURIComponent(medicineSearch.trim())}` : "";
      const response = await fetch(`/api/medicines${searchParam}`);
      if (!response.ok) throw new Error("Failed to fetch medicines");
      return response.json();
    },
    enabled: activeTab === "medicines",
  });

  const bookAppointmentMutation = useMutation({
    mutationFn: async (data: {
      patientName: string;
      patientPhone: string;
      patientEmail?: string;
      doctorId: string;
      appointmentDate: string;
      timeSlot: string;
      symptoms?: string;
    }) => {
      return await apiRequest("POST", "/api/appointments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment Booked",
        description: "Your appointment has been scheduled successfully.",
      });
      setActiveTab("appointments");
    },
    onError: (error: Error) => {
      const message = error.message.includes("409") 
        ? "This time slot is no longer available. Please choose another time."
        : "Failed to book appointment. Please try again.";
      toast({
        title: "Booking Failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/appointments/${id}/checkin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Checked In",
        description: "Patient has been checked in successfully.",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/appointments/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Cancelled",
        description: "Appointment has been cancelled.",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      "checked-in": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    };
    return styles[status] || styles.scheduled;
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch = apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.appointmentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Helper function to filter appointments by time period
  const getDateRangeFilter = (filter: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case "today":
        return (date: string) => {
          const aptDate = new Date(date);
          return aptDate >= today && aptDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        };
      case "weekly":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        return (date: string) => {
          const aptDate = new Date(date);
          return aptDate >= weekStart && aptDate < weekEnd;
        };
      case "monthly":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return (date: string) => {
          const aptDate = new Date(date);
          return aptDate >= monthStart && aptDate <= monthEnd;
        };
      case "quarterly":
        const quarter = Math.floor(now.getMonth() / 3);
        const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        return (date: string) => {
          const aptDate = new Date(date);
          return aptDate >= quarterStart && aptDate <= quarterEnd;
        };
      case "yearly":
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31);
        return (date: string) => {
          const aptDate = new Date(date);
          return aptDate >= yearStart && aptDate <= yearEnd;
        };
      default:
        return () => true;
    }
  };

  const dateRangeFilter = getDateRangeFilter(checkinTimeFilter);
  
  // Include scheduled, confirmed, checked-in, and completed appointments in Check-in tab
  const scheduledAppointments = appointments.filter((apt) => 
    (apt.status === "scheduled" || apt.status === "confirmed" || apt.status === "checked-in" || apt.status === "completed") &&
    dateRangeFilter(apt.appointmentDate)
  );

  const getDoctorById = (id: string) => doctors.find((d) => d.id === id);

  // Handle registration save success
  const handleRegistrationSaveSuccess = (data: SavedRegistrationData) => {
    if (data.appointmentId) {
      setSavedRegistrations(prev => ({
        ...prev,
        [data.appointmentId!]: data
      }));
      
      // If print was pending, trigger print now
      if (printAfterSave && pendingPrintAppointmentId === data.appointmentId) {
        const apt = appointments.find(a => a.appointmentId === data.appointmentId);
        if (apt) {
          setTimeout(() => {
            executePrint(apt, data);
          }, 500);
        }
      }
    }
    setPendingPrintAppointmentId(null);
    setPrintAfterSave(false);
  };

  // Execute the actual print with registration data
  const executePrint = (apt: Appointment, regData: SavedRegistrationData) => {
    const doctor = getDoctorById(apt.doctorId);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const fullName = `${regData.prefix || ''} ${regData.firstName || ''} ${regData.middleName || ''} ${regData.surname || ''}`.trim();
    const maritalStatusMap: Record<string, string> = { 'SINGLE': 'Single', 'MARRIED': 'Married', 'DIVORCED': 'Divorced', 'WIDOWED': 'Widowed' };
    const genderMap: Record<string, string> = { 'M': 'Male', 'F': 'Female', 'O': 'Other' };

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Registration - ${fullName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; border-bottom: 3px solid #0066cc; padding-bottom: 20px; margin-bottom: 20px; }
          .logo { font-size: 28px; font-weight: bold; color: #0066cc; margin-bottom: 5px; }
          .hospital-name { font-size: 24px; font-weight: bold; color: #333; }
          .hospital-details { font-size: 12px; color: #666; margin-top: 5px; }
          .form-title { text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; background: #f0f0f0; padding: 10px; }
          .section { margin-bottom: 15px; }
          .section-title { font-size: 14px; font-weight: bold; background: #e8e8e8; padding: 8px; margin-bottom: 8px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
          .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0; }
          .field { border: 1px solid #ddd; padding: 6px 8px; }
          .field-label { font-size: 10px; color: #666; text-transform: uppercase; }
          .field-value { font-size: 13px; font-weight: 500; min-height: 18px; }
          .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 15px; }
          .signature-area { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 40px; }
          .signature-box { text-align: center; }
          .signature-line { border-top: 1px solid #333; width: 150px; margin-top: 40px; }
          @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">GRAVITY</div>
          <div class="hospital-name">GRAVITY HOSPITAL</div>
          <div class="hospital-details">
            Gat No, 167, Sahyog Nager, Triveni Nagar, Nigdi, Pimpri-Chinchwad, Maharashtra 411062<br/>
            Phone: +91-20-27654321 | Email: info@gravityhospital.com | Website: www.gravityhospital.com
          </div>
        </div>

        <div class="form-title">PATIENT REGISTRATION FORM</div>

        <div class="section">
          <div class="section-title">Personal Information</div>
          <div class="grid-4">
            <div class="field"><div class="field-label">Prefix</div><div class="field-value">${regData.prefix || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Surname</div><div class="field-value">${regData.surname || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Name</div><div class="field-value">${regData.firstName || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Middle Name</div><div class="field-value">${regData.middleName || 'N/A'}</div></div>
          </div>
          <div class="grid-4">
            <div class="field"><div class="field-label">Date of Birth</div><div class="field-value">${regData.dateOfBirth || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Age</div><div class="field-value">${regData.age || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Sex</div><div class="field-value">${genderMap[regData.gender || ''] || regData.gender || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Wt.(Kg)</div><div class="field-value">${regData.weight || 'N/A'}</div></div>
          </div>
          <div class="grid-4">
            <div class="field"><div class="field-label">Ht.(Cm)</div><div class="field-value">${regData.height || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Marital Status</div><div class="field-value">${maritalStatusMap[regData.maritalStatus || ''] || regData.maritalStatus || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Occupation</div><div class="field-value">${regData.occupation || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Allergy</div><div class="field-value">${regData.allergy || 'None'}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Appointment Details</div>
          <div class="grid-4">
            <div class="field"><div class="field-label">Appointment ID</div><div class="field-value">${apt.appointmentId || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Date</div><div class="field-value">${apt.appointmentDate || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Time</div><div class="field-value">${regData.appointmentTime || apt.timeSlot || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Language</div><div class="field-value">${regData.languagePreferred || 'N/A'}</div></div>
          </div>
          <div class="grid-2">
            <div class="field"><div class="field-label">Consulting Doctor / Referral</div><div class="field-value">${regData.referralDoctor || doctor?.name || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Department</div><div class="field-value">${doctor?.specialty || 'N/A'}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Contact Information</div>
          <div class="grid-4">
            <div class="field"><div class="field-label">Contact No / Mobile</div><div class="field-value">${regData.mobileNo || regData.phone || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Email ID</div><div class="field-value">${regData.email || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Ph.No (Off/Resi.)</div><div class="field-value">${regData.phoneOffice || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Country</div><div class="field-value">${regData.country || 'India'}</div></div>
          </div>
          <div class="grid-2">
            <div class="field"><div class="field-label">Address</div><div class="field-value">${regData.address || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Area / Locality</div><div class="field-value">${regData.area || 'N/A'}</div></div>
          </div>
          <div class="grid-4">
            <div class="field"><div class="field-label">State</div><div class="field-value">${regData.state || 'N/A'}</div></div>
            <div class="field"><div class="field-label">City</div><div class="field-value">${regData.city || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Pincode</div><div class="field-value">${regData.pincode || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Consultation Charges</div><div class="field-value">${regData.consultationCharges ? '₹' + regData.consultationCharges : 'N/A'}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Insurance Information</div>
          <div class="grid-2">
            <div class="field"><div class="field-label">Insurance Provider</div><div class="field-value">${regData.insuranceProvider || 'N/A'}</div></div>
            <div class="field"><div class="field-label">Insurance No. / Policy Number</div><div class="field-value">${regData.insuranceNumber || 'N/A'}</div></div>
          </div>
        </div>

        <div class="signature-area">
          <div class="signature-box">
            <div class="signature-line"></div>
            <p>Patient Signature</p>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <p>Staff Signature</p>
          </div>
        </div>

        <div class="footer">
          <p>This is a computer-generated document.</p>
          <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
        </div>

        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Print button click handler - check if registration saved, if not show modal first
  const handlePrintClick = (apt: Appointment) => {
    const doctor = getDoctorById(apt.doctorId);
    const savedReg = savedRegistrations[apt.appointmentId || ''];
    
    if (savedReg) {
      // Registration already saved, print directly
      executePrint(apt, savedReg);
    } else {
      // Open registration modal first, set flag to print after save
      setPendingPrintAppointmentId(apt.appointmentId || null);
      setPrintAfterSave(true);
      setRegistrationAppointmentData({
        appointmentId: apt.appointmentId || '',
        appointmentTime: apt.timeSlot || '',
        appointmentDate: apt.appointmentDate || '',
        doctorName: doctor?.name || '',
        department: doctor?.specialty || '',
        patientName: apt.patientName || '',
        phone: apt.patientPhone || '',
      });
      setShowPatientRegistrationModal(true);
    }
  };

  // VIEW button click handler - opens registration modal to view/edit
  const handleViewClick = (apt: Appointment) => {
    const doctor = getDoctorById(apt.doctorId);
    setRegistrationAppointmentData({
      appointmentId: apt.appointmentId || '',
      appointmentTime: apt.timeSlot || '',
      appointmentDate: apt.appointmentDate || '',
      doctorName: doctor?.name || '',
      department: doctor?.specialty || '',
      patientName: apt.patientName || '',
      phone: apt.patientPhone || '',
    });
    setPrintAfterSave(false);
    setPendingPrintAppointmentId(null);
    setShowPatientRegistrationModal(true);
  };

  // Print all patients in table format
  const printAllPatients = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const timeFilterLabels: Record<string, string> = {
      today: "Today",
      weekly: "This Week",
      monthly: "This Month",
      quarterly: "This Quarter",
      yearly: "This Year"
    };

    const patientRows = scheduledAppointments.map(apt => {
      const doctor = getDoctorById(apt.doctorId);
      return `
        <tr>
          <td>${apt.patientName}</td>
          <td>${apt.appointmentId || 'N/A'}</td>
          <td>${apt.appointmentDate}</td>
          <td>${apt.timeSlot || 'N/A'}</td>
          <td>${doctor?.name || 'N/A'}</td>
          <td>${doctor?.specialty || 'N/A'}</td>
          <td>${apt.status?.toUpperCase() || 'N/A'}</td>
          <td>${apt.patientPhone || 'N/A'}</td>
        </tr>
      `;
    }).join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Check-in Report - ${timeFilterLabels[checkinTimeFilter]}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; border-bottom: 3px solid #0066cc; padding-bottom: 20px; margin-bottom: 20px; }
          .logo { font-size: 28px; font-weight: bold; color: #0066cc; margin-bottom: 5px; }
          .hospital-name { font-size: 24px; font-weight: bold; color: #333; }
          .hospital-details { font-size: 12px; color: #666; margin-top: 5px; }
          .report-title { text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; background: #f0f0f0; padding: 10px; }
          .report-info { text-align: center; margin-bottom: 20px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th { background: #0066cc; color: white; padding: 10px 8px; text-align: left; font-weight: bold; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
          .total { text-align: right; font-weight: bold; margin-top: 15px; font-size: 14px; }
          @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">GRAVITY</div>
          <div class="hospital-name">GRAVITY HOSPITAL</div>
          <div class="hospital-details">
            Gat No, 167, Sahyog Nager, Triveni Nagar, Nigdi, Pimpri-Chinchwad, Maharashtra 411062<br/>
            Phone: +91-20-27654321 | Email: info@gravityhospital.com | Website: www.gravityhospital.com
          </div>
        </div>

        <div class="report-title">PATIENT CHECK-IN REPORT</div>
        <div class="report-info">
          Period: <strong>${timeFilterLabels[checkinTimeFilter]}</strong> | 
          Generated on: ${new Date().toLocaleString('en-IN')}
        </div>

        <table>
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Appointment ID</th>
              <th>Date</th>
              <th>Time</th>
              <th>Doctor</th>
              <th>Department</th>
              <th>Status</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            ${patientRows}
          </tbody>
        </table>

        <div class="total">Total Patients: ${scheduledAppointments.length}</div>

        <div class="footer">
          <p>This is a computer-generated report. No signature required.</p>
        </div>

        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const tabs = [
    { id: "schedules" as TabType, label: "Doctor Schedules", icon: Calendar },
    { id: "book" as TabType, label: "Book Appointment", icon: ClipboardList },
    { id: "appointments" as TabType, label: "Appointments", icon: ClipboardList },
    { id: "checkin" as TabType, label: "Check-in", icon: UserCheck },
    { id: "team" as TabType, label: "Our Team", icon: Users },
    { id: "medicines" as TabType, label: "Medicines", icon: Pill },
  ];

  // Get unique medicine categories for filtering
  const medicineCategories = Array.from(new Set(medicines.map(m => m.category))).sort();

  // Filter medicines by category
  const filteredMedicines = medicineCategory === "all" 
    ? medicines 
    : medicines.filter(m => m.category === medicineCategory);

  // Handle CSV import
  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      const medicineData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return {
          brandName: values[0] || "",
          genericName: values[1] || "",
          strength: values[2] || "",
          dosageForm: values[3] || "",
          companyName: values[4] || "",
          mrp: values[5] || "0",
          packSize: values[6] || "",
          uses: values[7] || "",
          category: values[8] || "General",
        };
      }).filter(m => m.brandName && m.genericName);

      const response = await apiRequest("POST", "/api/medicines/import", { medicines: medicineData });
      
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      toast({
        title: "Import Successful",
        description: `Successfully imported ${medicineData.length} medicines`,
      });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import Failed",
        description: "Failed to import medicines from CSV",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle view medicine details
  const handleViewMedicine = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setShowMedicineDetail(true);
  };

  const handleBookAppointment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    bookAppointmentMutation.mutate({
      patientName: formData.get("patientName") as string,
      patientPhone: formData.get("patientPhone") as string,
      patientEmail: formData.get("patientEmail") as string || undefined,
      doctorId: formData.get("doctorId") as string,
      appointmentDate: formData.get("appointmentDate") as string,
      timeSlot: formData.get("timeSlot") as string,
      symptoms: formData.get("symptoms") as string || undefined,
    });
  };

  return (
    <div className="min-h-screen page-background-mesh">
      {/* OPD Header */}
      <div className="bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground animate-fade-in">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Stethoscope className="h-6 w-6 sm:h-8 sm:w-8 shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold truncate">OPD - Outpatient Department</h1>
                <div className="flex items-center gap-2 text-primary-foreground/80 text-xs sm:text-sm">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <span className="truncate">OPD Wing, Gravity Hospital</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden xs:inline">OPD: </span>
                <span>+91 20 1234 5679</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span>Mon-Sat: 8AM-8PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b animate-slide-in-left">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-1 sm:gap-2 py-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={`h-10 sm:h-14 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-4 ${
                  activeTab === tab.id ? "bg-primary text-primary-foreground" : ""
                }`}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="hidden sm:inline truncate">{tab.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 animate-fade-in-up">
        {/* Doctor Schedules Tab */}
        {activeTab === "schedules" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="date-filter">Select Date</Label>
                <Input
                  id="date-filter"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  data-testid="input-date-filter"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {doctors.map((doctor) => {
                const slotCounts = getDoctorSlotCounts(doctor.id);
                const scheduleInfo = getDoctorScheduleInfo(doctor.id);
                const hasScheduleToday = slotCounts.hasScheduleToday;
                return (
                <Card key={doctor.id} className="hover-elevate" data-testid={`card-doctor-${doctor.id}`}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-lg">
                        {doctor.avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{doctor.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">{doctor.specialty}</Badge>
                      {hasScheduleToday ? (
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <button 
                            onClick={() => setSlotFilters(prev => ({ ...prev, [doctor.id]: prev[doctor.id] === 'available' ? 'all' : 'available' }))}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full cursor-pointer transition-all ${slotFilters[doctor.id] === 'available' ? 'ring-2 ring-green-500 bg-green-500/20' : 'hover:bg-green-500/10'}`}
                            data-testid={`filter-available-${doctor.id}`}
                          >
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-green-600 dark:text-green-400 font-medium">{slotCounts.available} available</span>
                          </button>
                          <button 
                            onClick={() => setSlotFilters(prev => ({ ...prev, [doctor.id]: prev[doctor.id] === 'booked' ? 'all' : 'booked' }))}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full cursor-pointer transition-all ${slotFilters[doctor.id] === 'booked' ? 'ring-2 ring-orange-500 bg-orange-500/20' : 'hover:bg-orange-500/10'}`}
                            data-testid={`filter-booked-${doctor.id}`}
                          >
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            <span className="text-orange-600 dark:text-orange-400 font-medium">{slotCounts.booked} booked</span>
                          </button>
                          <span className="text-muted-foreground">/ {slotCounts.total} total</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          <span className="text-muted-foreground">No clinic hours for this date</span>
                          {scheduleInfo?.scheduledDays && scheduleInfo.scheduledDays.length > 0 && (
                            <span className="text-muted-foreground/70">
                              (Available: {scheduleInfo.scheduledDays.join(', ')})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      variant={selectedDoctor === doctor.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDoctor(selectedDoctor === doctor.id ? "" : doctor.id)}
                      data-testid={`button-view-slots-${doctor.id}`}
                    >
                      {selectedDoctor === doctor.id ? "Hide Slots" : "View Slots"}
                    </Button>
                  </CardHeader>
                  {selectedDoctor === doctor.id && (
                    <CardContent>
                      <div className="space-y-4">
                        {/* Doctor's Scheduled Time Blocks */}
                        {doctorScheduleBlocks.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-sm font-medium text-muted-foreground">Doctor's Schedule</span>
                            <div className="grid gap-2">
                              {doctorScheduleBlocks.map((block) => (
                                <div 
                                  key={block.id} 
                                  className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20"
                                  data-testid={`schedule-block-${block.id}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Clock className="h-4 w-4 text-primary" />
                                    <div>
                                      <p className="font-medium text-sm">{block.day}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {block.startTime} - {block.endTime}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant={block.isAvailable ? "default" : "secondary"}>
                                    {block.location || "OPD"}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Show message when no schedule for selected date */}
                        {!hasScheduleToday && (
                          <div className="text-center py-6 text-muted-foreground">
                            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p>No clinic hours scheduled for this date</p>
                            {scheduleInfo?.scheduledDays && scheduleInfo.scheduledDays.length > 0 && (
                              <p className="text-sm mt-1">
                                This doctor is available on: {scheduleInfo.scheduledDays.join(', ')}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Individual Time Slots from Database + Legacy Appointments - only show when schedule exists */}
                        {hasScheduleToday && (
                          <>
                        <span className="text-sm text-muted-foreground">Time Slots (30-min intervals)</span>
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            // Combine real time slots with legacy appointments
                            const legacySlots = getLegacyAppointmentsForDoctor(doctor.id);
                            
                            // Create a map of legacy slot times for quick lookup
                            const legacyTimeMap = new Map(legacySlots.map(ls => [ls.startTime, ls]));
                            
                            // Merge: If a real slot overlaps with a legacy appointment, mark real slot as booked
                            const mergedRealSlots = timeSlots.map(slot => {
                              const legacyMatch = legacyTimeMap.get(slot.startTime);
                              if (legacyMatch && slot.status === 'available') {
                                // Override the real slot with legacy booking info
                                return {
                                  ...slot,
                                  status: 'booked' as const,
                                  patientName: legacyMatch.patientName,
                                  appointmentId: legacyMatch.appointmentId,
                                };
                              }
                              return slot;
                            });
                            
                            // Only add legacy slots that don't have a corresponding real slot
                            const realSlotTimes = timeSlots.map(s => s.startTime);
                            const uniqueLegacySlots = legacySlots.filter(ls => !realSlotTimes.includes(ls.startTime));
                            const combinedSlots = [...mergedRealSlots, ...uniqueLegacySlots];
                            
                            // Sort by time
                            combinedSlots.sort((a, b) => {
                              const timeA = a.startTime.replace(/(\d+):(\d+)\s*(AM|PM)/i, (_, h, m, p) => {
                                let hour = parseInt(h);
                                if (p.toUpperCase() === 'PM' && hour !== 12) hour += 12;
                                if (p.toUpperCase() === 'AM' && hour === 12) hour = 0;
                                return `${hour.toString().padStart(2, '0')}:${m}`;
                              });
                              const timeB = b.startTime.replace(/(\d+):(\d+)\s*(AM|PM)/i, (_, h, m, p) => {
                                let hour = parseInt(h);
                                if (p.toUpperCase() === 'PM' && hour !== 12) hour += 12;
                                if (p.toUpperCase() === 'AM' && hour === 12) hour = 0;
                                return `${hour.toString().padStart(2, '0')}:${m}`;
                              });
                              return timeA.localeCompare(timeB);
                            });
                            
                            return combinedSlots;
                          })()
                            .filter((slot) => {
                              const currentFilter = slotFilters[doctor.id] || 'all';
                              if (currentFilter === 'available') return slot.status === 'available';
                              if (currentFilter === 'booked') return slot.status === 'booked';
                              return true;
                            })
                            .map((slot) => (
                            <div
                              key={slot.id}
                              onClick={() => {
                                setSelectedSlot(slot);
                                setShowSlotDetail(true);
                              }}
                              className={`relative px-3 py-2 rounded-lg border-2 text-center cursor-pointer transition-all ${
                                slot.status === 'booked' 
                                  ? 'bg-muted border-muted-foreground/30 hover:bg-muted/80' 
                                  : 'border-primary/30 hover:border-primary hover:bg-primary/5'
                              }`}
                              data-testid={`slot-${slot.id}`}
                            >
                              <p className="text-sm font-medium">{slot.startTime}</p>
                              {slot.status === 'booked' && (
                                <p className="text-xs text-muted-foreground">{slot.patientName?.split(' ')[0] || 'Booked'}</p>
                              )}
                            </div>
                          ))}
                          {timeSlots.length === 0 && doctorScheduleBlocks.length > 0 && (
                            <div className="w-full text-center py-4">
                              <p className="text-sm text-muted-foreground mb-2">Doctor has schedule blocks but no individual slots generated yet.</p>
                              <p className="text-xs text-muted-foreground">Slots will be auto-generated when the doctor sets up specific date schedules.</p>
                            </div>
                          )}
                          {timeSlots.length === 0 && doctorScheduleBlocks.length === 0 && (
                            <p className="text-sm text-muted-foreground">No slots scheduled for this date</p>
                          )}
                        </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );})}
            </div>
          </div>
        )}

        {/* Book Appointment Tab */}
        {activeTab === "book" && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Book New Appointment</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Fill in the details below to schedule your visit
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleBookAppointment} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="patientName">Patient Name</Label>
                    <Input
                      id="patientName"
                      name="patientName"
                      placeholder="Enter full name"
                      required
                      data-testid="input-patient-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientPhone">Phone Number</Label>
                    <Input
                      id="patientPhone"
                      name="patientPhone"
                      placeholder="+91 XXXXX XXXXX"
                      required
                      data-testid="input-patient-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientEmail">Email (Optional)</Label>
                    <Input
                      id="patientEmail"
                      name="patientEmail"
                      type="email"
                      placeholder="email@example.com"
                      data-testid="input-patient-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctorId">Select Doctor</Label>
                    <Select 
                      name="doctorId" 
                      required
                      value={bookingDoctorId}
                      onValueChange={(value) => {
                        setBookingDoctorId(value);
                        setBookingTimeSlot("");
                        setBookingLocation("");
                      }}
                    >
                      <SelectTrigger data-testid="select-doctor">
                        <SelectValue placeholder="Choose a doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.name} - {doctor.specialty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appointmentDate">Appointment Date</Label>
                    <Input
                      id="appointmentDate"
                      name="appointmentDate"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      required
                      value={bookingDate}
                      onChange={(e) => {
                        setBookingDate(e.target.value);
                        setBookingTimeSlot("");
                        setBookingLocation("");
                      }}
                      data-testid="input-appointment-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeSlot">Time Slot</Label>
                    <Select 
                      name="timeSlot" 
                      required
                      value={bookingTimeSlot}
                      onValueChange={(value) => {
                        setBookingTimeSlot(value);
                        // Auto-set location from the selected slot
                        const selectedSlotData = availableBookingSlots.find(s => s.time === value);
                        if (selectedSlotData?.location) {
                          setBookingLocation(selectedSlotData.location);
                        }
                      }}
                      disabled={!bookingDoctorId || !bookingDate}
                    >
                      <SelectTrigger data-testid="select-time-slot">
                        <SelectValue placeholder={
                          !bookingDoctorId ? "Select doctor first" :
                          !bookingDate ? "Select date first" :
                          availableBookingSlots.length === 0 ? "No slots available" :
                          "Select time slot"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBookingSlots.length === 0 && bookingDoctorId && bookingDate ? (
                          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                            No available slots for this date.
                            <br />
                            <span className="text-xs">Doctor may not have scheduled hours on this day.</span>
                          </div>
                        ) : (
                          availableBookingSlots.map((slot) => (
                            <SelectItem key={slot.time} value={slot.time}>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{slot.time}</span>
                                {slot.location && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    @ {slot.location.replace('Gravity Hospital - ', '')}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="location">OPD Location</Label>
                    <Select 
                      name="location" 
                      required
                      value={bookingLocation}
                      onValueChange={setBookingLocation}
                      disabled={!bookingDoctorId || !bookingDate || availableBookingLocations.length === 0}
                    >
                      <SelectTrigger data-testid="select-opd-location">
                        <SelectValue placeholder={
                          !bookingDoctorId ? "Select doctor first" :
                          !bookingDate ? "Select date first" :
                          availableBookingLocations.length === 0 ? "No locations available" :
                          bookingLocation || "Select location"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBookingLocations.length === 0 && bookingDoctorId && bookingDate ? (
                          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                            No locations available for this date.
                          </div>
                        ) : (
                          availableBookingLocations.map((loc) => (
                            <SelectItem key={loc} value={loc}>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{loc}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="symptoms">Symptoms / Reason for Visit</Label>
                  <Textarea
                    id="symptoms"
                    name="symptoms"
                    placeholder="Describe your symptoms or reason for visit..."
                    className="min-h-[100px]"
                    data-testid="textarea-symptoms"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={bookAppointmentMutation.isPending}
                  data-testid="button-book-appointment"
                >
                  {bookAppointmentMutation.isPending ? "Booking..." : "Book Appointment"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Appointments Tab */}
        {activeTab === "appointments" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-appointments"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="checked-in">Checked In</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {filteredAppointments.map((apt) => {
                const doctor = getDoctorById(apt.doctorId);
                return (
                  <Card key={apt.id} className="hover-elevate" data-testid={`card-appointment-${apt.id}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary/50 text-primary-foreground">
                              {apt.patientName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{apt.patientName}</h3>
                            <p className="text-sm text-muted-foreground">{apt.appointmentId}</p>
                          </div>
                        </div>
                        <Badge className={getStatusBadge(apt.status)}>
                          {apt.status.replace("-", " ").toUpperCase()}
                        </Badge>
                      </div>
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{apt.patientPhone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{doctor?.name || (apt.department ? doctors.find(d => d.specialty?.toLowerCase() === apt.department?.toLowerCase())?.name : null) || `Dr. (${apt.department || 'Unknown'})`}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(apt.appointmentDate).toLocaleDateString('en-US', { 
                            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{apt.timeSlot}</span>
                        </div>
                        {apt.symptoms && (
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <ClipboardList className="h-4 w-4 mt-0.5" />
                            <span className="line-clamp-2">{apt.symptoms}</span>
                          </div>
                        )}
                        {(() => {
                          const locationData = OPD_LOCATIONS.find(l => l.name === (apt as any).location || l.id === (apt as any).location) || OPD_LOCATIONS[9];
                          return (
                            <div className="mt-2 p-2 bg-muted/50 rounded-md">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span className="font-medium">{locationData.name}</span>
                              </div>
                              <a 
                                href={locationData.mapUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-primary hover:underline mt-1 ml-6"
                                data-testid={`link-map-${apt.id}`}
                              >
                                <span>View on Google Maps</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          );
                        })()}
                      </div>
                      {apt.status === "scheduled" && (
                        <div className="flex gap-2 mt-4 pt-4 border-t">
                          <Button
                            size="sm"
                            onClick={() => checkInMutation.mutate(apt.id)}
                            disabled={checkInMutation.isPending}
                            data-testid={`button-checkin-${apt.id}`}
                          >
                            Check In
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelMutation.mutate(apt.id)}
                            disabled={cancelMutation.isPending}
                            data-testid={`button-cancel-${apt.id}`}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredAppointments.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No appointments found</p>
              </Card>
            )}
          </div>
        )}

        {/* Check-in Tab */}
        {activeTab === "checkin" && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-6 w-6 text-primary" />
                    <div>
                      <h2 className="text-lg font-semibold">Patient Check-in</h2>
                      <p className="text-sm text-muted-foreground">
                        {scheduledAppointments.length} patients
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={checkinTimeFilter} onValueChange={setCheckinTimeFilter}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Time period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="default"
                      onClick={printAllPatients}
                      disabled={scheduledAppointments.length === 0}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print All
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Patient Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Appointment Time</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Doctor</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Action</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">View</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Print</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduledAppointments.map((apt) => {
                        const doctor = getDoctorById(apt.doctorId);
                        const getCheckinStatusStyle = (status: string) => {
                          switch (status) {
                            case 'confirmed':
                              return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
                            case 'checked-in':
                              return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
                            case 'completed':
                              return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
                            default:
                              return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
                          }
                        };
                        const statusStyle = getCheckinStatusStyle(apt.status);
                        const isAlreadyCheckedIn = apt.status === 'checked-in' || apt.status === 'completed';
                        const openPatientRegistration = () => {
                          setRegistrationAppointmentData({
                            appointmentId: apt.appointmentId || '',
                            appointmentTime: apt.timeSlot || '',
                            appointmentDate: apt.appointmentDate || '',
                            doctorName: doctor?.name || '',
                            department: doctor?.specialty || '',
                            patientName: apt.patientName || '',
                            phone: apt.patientPhone || '',
                          });
                          setShowPatientRegistrationModal(true);
                        };
                        return (
                          <tr 
                            key={apt.id} 
                            className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                            data-testid={`row-checkin-${apt.id}`}
                          >
                            <td className="px-4 py-3">
                              <div 
                                className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors"
                                onDoubleClick={openPatientRegistration}
                                title="Double-click to open registration form"
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs">
                                    {apt.patientName.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{apt.patientName}</p>
                                  <p className="text-xs text-muted-foreground">{apt.appointmentId}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{apt.timeSlot}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm">{doctor?.name || 'N/A'}</span>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={statusStyle}>
                                {apt.status.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {isAlreadyCheckedIn ? (
                                <Badge variant="outline" className="text-muted-foreground">
                                  {apt.status === 'completed' ? 'Completed' : 'Checked-In'}
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => checkInMutation.mutate(apt.id)}
                                  disabled={checkInMutation.isPending}
                                  data-testid={`button-quick-checkin-${apt.id}`}
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Check-In
                                </Button>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleViewClick(apt)}
                                title="View/Edit patient registration form"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handlePrintClick(apt)}
                                title="Print patient registration form"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {scheduledAppointments.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No patients found for the selected time period</p>
              </Card>
            )}
          </div>
        )}

        {/* Our Team Tab */}
        {activeTab === "team" && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold">Our Medical Team</h2>
                    <p className="text-sm text-muted-foreground">
                      Meet our experienced healthcare professionals
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doctor) => (
                <Card key={doctor.id} className="hover-elevate" data-testid={`card-team-${doctor.id}`}>
                  <CardContent className="pt-6 text-center">
                    <Avatar className="h-24 w-24 mx-auto hover:scale-110 transition-transform">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-2xl">
                        {doctor.avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="mt-4 text-lg font-semibold">{doctor.name}</h3>
                    <Badge className="mt-2 bg-primary/10 text-primary">
                      {doctor.specialty}
                    </Badge>
                    <div className="flex items-center justify-center gap-1 mt-3">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{doctor.rating}</span>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <p>{doctor.experience}+ years experience</p>
                      <p>{doctor.qualification}</p>
                      <p>{doctor.availableDays}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Medicines Tab */}
        {activeTab === "medicines" && (
          <div className="space-y-6">
            {/* Header Card */}
            <Card className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <Pill className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">Medicine Database</h2>
                      <p className="text-sm text-muted-foreground">
                        Search and browse Indian medicines ({medicines.length} medicines)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".csv"
                      ref={fileInputRef}
                      onChange={handleCSVImport}
                      className="hidden"
                      data-testid="input-csv-upload"
                    />
                    <Button 
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting}
                      data-testid="button-import-csv"
                    >
                      {isImporting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {isImporting ? "Importing..." : "Import CSV"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by brand name, generic name, company, category or uses..."
                      value={medicineSearch}
                      onChange={(e) => setMedicineSearch(e.target.value)}
                      className="pl-10"
                      data-testid="input-medicine-search"
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <Select value={medicineCategory} onValueChange={setMedicineCategory}>
                      <SelectTrigger data-testid="select-medicine-category">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {medicineCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medicines Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Medicines List ({filteredMedicines.length} results)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {medicinesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading medicines...</span>
                  </div>
                ) : filteredMedicines.length === 0 ? (
                  <div className="text-center py-12">
                    <Pill className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      {medicines.length === 0 
                        ? "No medicines in database. Import a CSV to get started."
                        : "No medicines match your search criteria."
                      }
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Brand Name</TableHead>
                          <TableHead>Generic Name</TableHead>
                          <TableHead>Strength</TableHead>
                          <TableHead>Dosage Form</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead className="text-right">MRP (INR)</TableHead>
                          <TableHead>Pack Size</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMedicines.slice(0, 100).map((medicine) => (
                          <TableRow 
                            key={medicine.id} 
                            className="cursor-pointer hover:bg-muted/50"
                            data-testid={`row-medicine-${medicine.id}`}
                          >
                            <TableCell className="font-medium">{medicine.brandName}</TableCell>
                            <TableCell>{medicine.genericName}</TableCell>
                            <TableCell>{medicine.strength}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{medicine.dosageForm}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate">{medicine.companyName}</TableCell>
                            <TableCell className="text-right font-medium">
                              <span className="flex items-center justify-end gap-1">
                                <IndianRupee className="h-3 w-3" />
                                {medicine.mrp}
                              </span>
                            </TableCell>
                            <TableCell>{medicine.packSize}</TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                {medicine.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewMedicine(medicine)}
                                data-testid={`button-view-medicine-${medicine.id}`}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {filteredMedicines.length > 100 && (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        Showing first 100 of {filteredMedicines.length} results. Use search to narrow down.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Medicine Detail Dialog */}
      <Dialog open={showMedicineDetail} onOpenChange={setShowMedicineDetail}>
        <DialogContent className="max-w-2xl" data-testid="dialog-medicine-detail">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-green-600" />
              Medicine Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this medicine
            </DialogDescription>
          </DialogHeader>
          {selectedMedicine && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Pill className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedMedicine.brandName}</h3>
                  <p className="text-muted-foreground">{selectedMedicine.genericName}</p>
                  <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    {selectedMedicine.category}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Package className="h-4 w-4" />
                    Strength & Form
                  </div>
                  <p className="font-medium">{selectedMedicine.strength} - {selectedMedicine.dosageForm}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <IndianRupee className="h-4 w-4" />
                    MRP & Pack Size
                  </div>
                  <p className="font-medium">Rs. {selectedMedicine.mrp} / {selectedMedicine.packSize}</p>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Building2 className="h-4 w-4" />
                  Manufacturer
                </div>
                <p className="font-medium">{selectedMedicine.companyName}</p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mb-1">
                  <Tag className="h-4 w-4" />
                  Uses
                </div>
                <p className="text-blue-800 dark:text-blue-200">{selectedMedicine.uses}</p>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowMedicineDetail(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-t mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2">
              <Stethoscope className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold">Gravity Hospital</h2>
            </div>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Address</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Gat No, 167, Sahyog Nager,<br />
                Triveni Nagar, Nigdi,<br />
                Pimpri-Chinchwad,<br />
                Maharashtra 411062
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Phone className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Contact</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Main: +91 20 1234 5678</p>
                <p>Emergency: +91 20 1234 5680</p>
                <p>OPD: +91 20 1234 5679</p>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Timings</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>24/7 Emergency</p>
                <p>OPD: Mon-Sat 8AM-8PM</p>
                <p>Sun: 9AM-1PM</p>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Mail className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Online</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>info@galaxyhospital.com</p>
                <p>appointments@galaxyhospital.com</p>
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  <span>www.galaxyhospital.com</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Gravity Hospital. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Slot Detail Dialog */}
      <Dialog open={showSlotDetail} onOpenChange={setShowSlotDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Slot Details
            </DialogTitle>
            <DialogDescription>
              Time slot information for {selectedSlot?.doctorName}
            </DialogDescription>
          </DialogHeader>
          {selectedSlot && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Doctor</p>
                    <p className="font-medium">{selectedSlot.doctorName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium">{new Date(selectedSlot.slotDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="font-medium text-lg text-primary">{selectedSlot.startTime} - {selectedSlot.endTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant={selectedSlot.status === 'available' ? 'default' : 'secondary'} className="mt-1">
                      {selectedSlot.status === 'available' ? 'Available' : 'Booked'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {selectedSlot.status === 'booked' && selectedSlot.patientName && (
                <div className="p-4 rounded-lg border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/30">
                  <p className="text-xs text-muted-foreground mb-2">Booking Details</p>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">{selectedSlot.patientName}</span>
                  </div>
                </div>
              )}

              {selectedSlot.status === 'available' && (
                <div className="p-4 rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <UserCheck className="h-4 w-4" />
                    <span className="text-sm font-medium">This slot is available for booking</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Patient Registration Modal */}
      <PatientRegistrationModal
        open={showPatientRegistrationModal}
        onOpenChange={(open) => {
          setShowPatientRegistrationModal(open);
          if (!open) {
            setPrintAfterSave(false);
            setPendingPrintAppointmentId(null);
          }
        }}
        appointmentData={registrationAppointmentData || undefined}
        savedRegistration={registrationAppointmentData?.appointmentId ? savedRegistrations[registrationAppointmentData.appointmentId] : undefined}
        onSaveSuccess={handleRegistrationSaveSuccess}
        printAfterSave={printAfterSave}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
          setRegistrationAppointmentData(null);
        }}
      />
    </div>
  );
}
