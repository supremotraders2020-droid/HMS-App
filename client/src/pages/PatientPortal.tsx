import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IntegerInput, NumericInput } from "@/components/validated-inputs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { format, formatDistanceToNow } from "date-fns";
import type { Doctor, Appointment, MedicalRecord, UserNotification, Prescription, ServicePatient, PatientConsent, DoctorTimeSlot, PatientBill, DoctorSchedule, MedicalStore, InsuranceProvider, InsuranceClaim, PatientInsurance } from "@shared/schema";
import { DialogFooter } from "@/components/ui/dialog";
import { 
  Home,
  Calendar,
  FileText,
  Building2,
  Bell,
  Users,
  User,
  Clock,
  Star,
  ChevronRight,
  Activity,
  Heart,
  Pill,
  Syringe,
  TestTube,
  FileImage,
  Download,
  Eye,
  CreditCard,
  IndianRupee,
  BedDouble,
  Stethoscope,
  MessageCircle,
  Send,
  Bot,
  CheckCircle,
  Info,
  LogOut,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  MapPin,
  ExternalLink,
  BookOpen,
  Utensils,
  AlertTriangle,
  Leaf,
  Apple,
  Store,
  Package,
  Shield,
  Plus,
  FileCheck,
  XCircle,
  Scissors,
  ClipboardList
} from "lucide-react";
import HospitalServices from "@/pages/HospitalServices";
import hospitalLogo from "@assets/LOGO_1_1765346562770.png";
import ThemeToggle from "@/components/ThemeToggle";

interface PatientPortalProps {
  patientId: string;
  patientName: string;
  username: string;
  onLogout: () => void;
}

const DEPARTMENTS = [
  { id: "cardiology", name: "Cardiology", icon: Heart, color: "text-red-500" },
  { id: "neurology", name: "Neurology", icon: Activity, color: "text-purple-500" },
  { id: "orthopedics", name: "Orthopedics", icon: Building2, color: "text-blue-500" },
  { id: "pediatrics", name: "Pediatrics", icon: Users, color: "text-green-500" },
  { id: "dermatology", name: "Dermatology", icon: Sparkles, color: "text-pink-500" },
  { id: "general", name: "General Medicine", icon: Stethoscope, color: "text-teal-500" },
];

const LOCATIONS = [
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

interface PatientProfile {
  id?: string;
  patientId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  gender: string | null;
  emergencyContactName: string | null;
  emergencyContactRelation: string | null;
  emergencyContactPhone: string | null;
  allergies: string | null;
  chronicConditions: string | null;
  address: string | null;
}

export default function PatientPortal({ patientId, patientName, username, onLogout }: PatientPortalProps) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [symptoms, setSymptoms] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "bot"; content: string }>>([
    { role: "bot", content: "Hello! I'm your healthcare assistant. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [selectedNotification, setSelectedNotification] = useState<UserNotification | null>(null);
  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState<MedicalRecord | null>(null);
  const [viewRecordDialogOpen, setViewRecordDialogOpen] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [claimForm, setClaimForm] = useState({
    claimType: "Reimbursement",
    insuranceProviderId: "",
    policyNumber: "",
    diagnosis: "",
    plannedProcedure: "",
    estimatedCost: "",
    remarks: "",
  });
  const { toast } = useToast();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: patientName,
    email: "patient@email.com",
    phone: "+91 98765 43210",
    dateOfBirth: "1990-05-15",
    bloodType: "o_positive",
    gender: "male",
    emergencyContactName: "John Doe",
    emergencyContactRelation: "Spouse",
    emergencyContactPhone: "+91 98765 43211",
    allergies: "Penicillin, Shellfish",
    chronicConditions: "Hypertension (controlled)"
  });

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  const { data: medicalStores = [] } = useQuery<MedicalStore[]>({
    queryKey: ["/api/medical-stores"],
    queryFn: async () => {
      const response = await fetch("/api/medical-stores");
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: insuranceProviders = [] } = useQuery<InsuranceProvider[]>({
    queryKey: ["/api/insurance/providers"],
    queryFn: async () => {
      const response = await fetch("/api/insurance/providers");
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: patientInsurances = [] } = useQuery<PatientInsurance[]>({
    queryKey: ["/api/insurance/patient", patientId],
    queryFn: async () => {
      const response = await fetch(`/api/insurance/patient/${patientId}`);
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: myClaims = [], refetch: refetchClaims } = useQuery<InsuranceClaim[]>({
    queryKey: ["/api/insurance/claims/patient", patientId],
    queryFn: async () => {
      const response = await fetch(`/api/insurance/claims/patient/${patientId}`);
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Fetch service patients to find the one matching this user's email
  const { data: servicePatients = [] } = useQuery<ServicePatient[]>({
    queryKey: ["/api/patients/service"],
  });

  // Fetch user data to get email for matching with service_patients
  const { data: userData } = useQuery<{ id: string; email: string | null }>({
    queryKey: ['/api/users/by-username', username],
  });

  // Fetch patient profile from API using username (stable identifier)
  const { data: profileData } = useQuery<PatientProfile>({
    queryKey: ['/api/patient-profiles', username],
    retry: false,
  });

  // Sync profile form with API data when it loads
  useEffect(() => {
    if (profileData) {
      setProfileForm({
        fullName: profileData.fullName || patientName,
        email: profileData.email || "patient@email.com",
        phone: profileData.phone || "+91 98765 43210",
        dateOfBirth: profileData.dateOfBirth || "1990-05-15",
        bloodType: profileData.bloodType || "o_positive",
        gender: profileData.gender || "male",
        emergencyContactName: profileData.emergencyContactName || "John Doe",
        emergencyContactRelation: profileData.emergencyContactRelation || "Spouse",
        emergencyContactPhone: profileData.emergencyContactPhone || "+91 98765 43211",
        allergies: profileData.allergies || "",
        chronicConditions: profileData.chronicConditions || ""
      });
    }
  }, [profileData, patientName]);

  // Save profile mutation using username (stable identifier)
  const saveProfileMutation = useMutation({
    mutationFn: async (profile: typeof profileForm) => {
      const response = await apiRequest('PUT', `/api/patient-profiles/${username}`, {
        patientId: username,
        ...profile
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patient-profiles', username] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/by-username', username] });
      toast({ title: "Profile Updated", description: "Your profile has been saved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save profile", variant: "destructive" });
    }
  });

  // Submit insurance claim mutation
  const submitClaimMutation = useMutation({
    mutationFn: async (claimData: typeof claimForm) => {
      const payload = {
        patientId,
        patientInsuranceId: claimData.insuranceProviderId,
        claimType: claimData.claimType,
        diagnosis: claimData.diagnosis,
        plannedProcedure: claimData.plannedProcedure,
        estimatedCost: claimData.estimatedCost,
        remarks: claimData.remarks || null,
        status: "SUBMITTED",
      };
      const response = await apiRequest('POST', '/api/insurance/claims', payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/claims/patient", patientId] });
      setShowClaimDialog(false);
      setClaimForm({
        claimType: "Reimbursement",
        insuranceProviderId: "",
        policyNumber: "",
        diagnosis: "",
        plannedProcedure: "",
        estimatedCost: "",
        remarks: "",
      });
      toast({ title: "Claim Submitted", description: "Your insurance claim has been submitted for review" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit claim", variant: "destructive" });
    }
  });

  // Book appointment mutation
  const bookAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: {
      slotId?: string;
      doctorId: string;
      patientId: string;
      patientName: string;
      patientPhone: string;
      appointmentDate: string;
      timeSlot: string;
      department: string;
      location: string;
      reason: string;
    }) => {
      // If we have a slot ID from the new API, use the transactional booking endpoint
      if (appointmentData.slotId) {
        const response = await apiRequest('POST', `/api/time-slots/${appointmentData.slotId}/book`, {
          patientId: appointmentData.patientId,
          patientName: appointmentData.patientName,
          patientPhone: appointmentData.patientPhone,
          symptoms: appointmentData.reason,
        });
        return response.json();
      }
      
      // Fallback to legacy appointment endpoint
      const response = await apiRequest('POST', '/api/appointments', {
        ...appointmentData,
        symptoms: appointmentData.reason,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      // Invalidate the specific time slots query with doctor and date params
      queryClient.invalidateQueries({ 
        queryKey: ["/api/time-slots/available", variables.doctorId, variables.appointmentDate] 
      });
      // Also invalidate all time slots queries as a fallback
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === '/api/time-slots/available'
      });
      toast({ 
        title: "Appointment Booked!", 
        description: `Your appointment has been scheduled. You will receive a confirmation.`
      });
      setSelectedDoctor(null);
      setSelectedDate("");
      setSelectedSlot("");
      setSelectedLocation("");
      setSelectedDepartment("");
      setSymptoms("");
    },
    onError: (error: any) => {
      const isSlotAlreadyBooked = error?.message?.includes('no longer available') || 
                                   error?.message?.includes('already booked') ||
                                   error?.status === 409;
      toast({ 
        title: "Booking Failed", 
        description: isSlotAlreadyBooked 
          ? "This slot is already booked, please select another slot." 
          : (error?.message || "Failed to book appointment. Please try again."), 
        variant: "destructive" 
      });
    }
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  // Fetch medical records with real-time sync (refetch every 3 seconds)
  const { data: medicalRecords = [], isLoading: recordsLoading } = useQuery<MedicalRecord[]>({
    queryKey: ["/api/medical-records"],
    refetchInterval: 3000, // Real-time sync every 3 seconds
  });

  // Fetch real notifications for this patient with real-time sync using the notifications hook
  const { 
    notifications: userNotifications, 
    markAsRead, 
    markAllAsRead,
    unreadCount 
  } = useNotifications({
    userId: username,
    userRole: "patient",
    enabled: true
  });

  // Fetch prescriptions for this patient by name with flexible matching
  const { data: patientPrescriptions = [], isLoading: prescriptionsLoading } = useQuery<Prescription[]>({
    queryKey: [`/api/prescriptions/patient/${encodeURIComponent(patientName)}`],
    refetchInterval: 3000, // Real-time sync
  });

  // Fetch consent forms for this patient
  const { data: allConsents = [] } = useQuery<PatientConsent[]>({
    queryKey: ['/api/patient-consents'],
    refetchInterval: 3000, // Real-time sync
  });

  // Fetch patient bill
  const { data: patientBill, refetch: refetchBill } = useQuery<PatientBill | null>({
    queryKey: ['/api/patient-bills/patient', username],
    refetchInterval: 3000, // Real-time sync
  });

  // Fetch disease catalog for Health Guide section
  const { data: diseases = [], isLoading: diseasesLoading } = useQuery<any[]>({
    queryKey: ['/api/diseases'],
  });

  // Fetch diet templates for Health Guide section
  const { data: dietTemplates = [] } = useQuery<any[]>({
    queryKey: ['/api/diet-templates'],
  });

  // Fetch medication schedules for Health Guide section
  const { data: medicationSchedules = [] } = useQuery<any[]>({
    queryKey: ['/api/medication-schedules'],
  });

  // Fetch lab reports for this patient
  const { data: labReports = [], isLoading: labReportsLoading } = useQuery<any[]>({
    queryKey: [`/api/lab-reports/patient/${username}`],
  });

  // State for Health Guide section
  const [selectedDisease, setSelectedDisease] = useState<any | null>(null);
  const [diseaseSearchQuery, setDiseaseSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Filter diseases based on search and category
  const filteredDiseases = diseases.filter((disease: any) => {
    const matchesSearch = disease.diseaseName.toLowerCase().includes(diseaseSearchQuery.toLowerCase()) ||
      (disease.alternateNames && disease.alternateNames.toLowerCase().includes(diseaseSearchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || disease.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get diet template for a disease
  const getDietForDisease = (diseaseId: string) => {
    return dietTemplates.find((t: any) => t.diseaseId === diseaseId);
  };

  // Get medication schedule for a disease
  const getMedicationForDisease = (diseaseId: string) => {
    return medicationSchedules.find((s: any) => s.diseaseId === diseaseId);
  };

  // Generate bill mutation
  const generateBillMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/patient-bills', {
        patientId: username,
        patientName: patientName,
      });
      return response.json();
    },
    onSuccess: () => {
      refetchBill();
      toast({ 
        title: "Bill Request Sent", 
        description: "Admin has been notified. Your bill will be updated shortly." 
      });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to request bill generation", 
        variant: "destructive" 
      });
    }
  });

  // Listen for bill updates via WebSocket
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws/notifications?userId=${username}&userRole=PATIENT`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'bill_updated' || data.event === 'bill_updated') {
          refetchBill();
          toast({
            title: "Bill Updated",
            description: `Your bill has been updated. Total: ₹${data.totalAmount || 'N/A'}`,
          });
        }
      } catch (e) {
        console.error("WebSocket message parse error:", e);
      }
    };

    return () => ws.close();
  }, [username, refetchBill]);

  // Fetch doctor schedules to determine available locations and time slots
  const selectedDoctorData = doctors.find(d => d.id === selectedDoctor);
  const { data: doctorSchedules = [] } = useQuery<DoctorSchedule[]>({
    queryKey: ["/api/doctor-schedules-by-name", selectedDoctorData?.name],
    enabled: !!selectedDoctor && !!selectedDoctorData?.name,
    staleTime: 0,
  });

  // Generate available slots from doctor schedules
  const getScheduleBasedSlots = (): { value: string; label: string; location: string | null }[] => {
    if (!selectedDate || doctorSchedules.length === 0) return [];

    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const dayName = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' });

    // Find schedule blocks for the selected day - prioritize specific date matches
    const daySchedules = doctorSchedules.filter(s => {
      if (s.specificDate === selectedDate && s.isAvailable) return true;
      if (!s.specificDate && s.day === dayName && s.isAvailable) return true;
      return false;
    });

    if (daySchedules.length === 0) return [];

    const slots: { value: string; label: string; location: string | null }[] = [];
    
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
        const timeLabel = minsToTime(mins);
        slots.push({
          value: timeLabel,
          label: timeLabel,
          location: schedule.location || null,
        });
      }
    }

    // Filter out already-booked slots
    const bookedTimes = appointments
      .filter(apt => 
        apt.appointmentDate === selectedDate && 
        apt.status !== 'cancelled'
      )
      .map(apt => apt.timeSlot?.split(' - ')[0] || apt.timeSlot);

    // Sort slots from AM to PM (morning to evening)
    return slots
      .filter(slot => !bookedTimes.includes(slot.value))
      .sort((a, b) => timeToMins(a.value) - timeToMins(b.value));
  };

  const scheduleBasedSlots = getScheduleBasedSlots();

  // Get unique locations from schedule-based slots
  const availableLocations = (() => {
    const locations = new Set<string>();
    scheduleBasedSlots.forEach(slot => {
      if (slot.location) locations.add(slot.location);
    });
    return Array.from(locations);
  })();

  // Fetch available time slots from the new API (only available slots for patients)
  const { data: availableTimeSlots = [] } = useQuery<DoctorTimeSlot[]>({
    queryKey: ["/api/time-slots/available", selectedDoctor, selectedDate],
    queryFn: async () => {
      if (!selectedDoctor || !selectedDate) return [];
      const response = await fetch(`/api/time-slots/${selectedDoctor}/available/${selectedDate}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedDoctor && !!selectedDate,
    staleTime: 0,
  });

  // WebSocket listener for real-time slot updates
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws/notifications?userId=${username}&userRole=PATIENT`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'slot_update') {
          // Refresh all available slots queries when slot status changes
          queryClient.invalidateQueries({ 
            predicate: (query) => {
              const key = query.queryKey;
              return Array.isArray(key) && key[0] === '/api/time-slots/available';
            }
          });
        }
      } catch (e) {
        console.error("WebSocket message parse error:", e);
      }
    };

    return () => ws.close();
  }, [username]);

  // Find the service_patient that matches this user's email or name
  const userEmail = userData?.email || profileData?.email || profileForm.email;
  const normalizedPatientName = patientName.toLowerCase().trim();
  
  // Find all matching service patients (by email or name)
  const matchingServicePatients = servicePatients.filter(sp => {
    // Match by email
    if (sp.email && userEmail && sp.email.toLowerCase() === userEmail.toLowerCase()) {
      return true;
    }
    // Match by name (first + last)
    const spFullName = `${sp.firstName || ''} ${sp.lastName || ''}`.toLowerCase().trim();
    if (spFullName && normalizedPatientName && (
      spFullName === normalizedPatientName ||
      spFullName.includes(normalizedPatientName) ||
      normalizedPatientName.includes(spFullName)
    )) {
      return true;
    }
    return false;
  });
  
  const matchingServicePatientIds = matchingServicePatients.map(sp => sp.id);

  // Filter records for this patient (by username, userId, patientName, or service_patient ID)
  const patientRecords = medicalRecords.filter(r => 
    r.patientId === username || 
    r.patientId === patientId || 
    r.patientId === patientName ||
    matchingServicePatientIds.includes(r.patientId)
  );

  // Filter consent forms for this patient
  const patientConsents = allConsents.filter(c => 
    c.patientId === username || 
    c.patientId === patientId || 
    c.patientId === patientName ||
    matchingServicePatientIds.includes(c.patientId)
  );

  const upcomingAppointments = appointments.filter(a => a.status === "scheduled");
  const unreadNotifications = unreadCount;

  // Static fallback time slots (used when no API slots exist)
  const fallbackTimeSlots: { value: string; label: string; slotId?: string }[] = [
    { value: "09:00", label: "09:00 AM" },
    { value: "09:30", label: "09:30 AM" },
    { value: "10:00", label: "10:00 AM" },
    { value: "10:30", label: "10:30 AM" },
    { value: "11:00", label: "11:00 AM" },
    { value: "11:30", label: "11:30 AM" },
    { value: "14:00", label: "02:00 PM" },
    { value: "14:30", label: "02:30 PM" },
    { value: "15:00", label: "03:00 PM" },
    { value: "15:30", label: "03:30 PM" },
    { value: "16:00", label: "04:00 PM" },
    { value: "16:30", label: "04:30 PM" },
  ];

  // Convert API time slots to the format expected by the UI
  const getAvailableSlots = () => {
    // Helper to convert time string to minutes for sorting
    const timeToMins = (timeStr: string): number => {
      const [time, period] = timeStr.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let totalHours = hours;
      if (period === 'PM' && hours !== 12) totalHours += 12;
      if (period === 'AM' && hours === 12) totalHours = 0;
      return totalHours * 60 + (minutes || 0);
    };

    // If we have slots from the new API, use those
    if (availableTimeSlots.length > 0) {
      return availableTimeSlots
        .map(slot => ({
          value: slot.startTime,
          label: `${slot.startTime} - ${slot.endTime}`,
          slotId: slot.id,
        }))
        .sort((a, b) => timeToMins(a.value) - timeToMins(b.value));
    }

    // Use schedule-based slots when available - filter by selected location
    if (scheduleBasedSlots.length > 0) {
      let filteredSlots = scheduleBasedSlots;
      if (selectedLocation) {
        filteredSlots = scheduleBasedSlots.filter(slot => slot.location === selectedLocation);
      }
      return filteredSlots
        .map(slot => ({
          value: slot.value,
          label: slot.label,
        }))
        .sort((a, b) => timeToMins(a.value) - timeToMins(b.value));
    }
    
    // Fallback: filter from static slots based on existing appointments
    if (!selectedDoctor || !selectedDate) return fallbackTimeSlots;
    const bookedSlots = appointments
      .filter(a => 
        a.doctorId === selectedDoctor && 
        a.appointmentDate === selectedDate &&
        a.status !== "cancelled" && 
        a.status !== "completed"
      )
      .map(a => a.timeSlot);
    return fallbackTimeSlots.filter(slot => !bookedSlots.includes(slot.value));
  };

  const availableSlots = getAvailableSlots();

  // Handle view medical record
  const handleViewRecord = (record: MedicalRecord) => {
    setSelectedMedicalRecord(record);
    setViewRecordDialogOpen(true);
  };

  // Handle download medical record
  const handleDownloadRecord = (record: MedicalRecord) => {
    if (record.fileData && record.fileName) {
      // Create download link
      const link = document.createElement('a');
      link.href = record.fileData;
      link.download = record.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Download Started",
        description: `Downloading ${record.fileName}`,
      });
    } else {
      // No file to download, generate a text summary
      const content = `
Medical Record: ${record.title}
Type: ${record.recordType}
Physician: ${record.physician}
Date: ${record.recordDate ? format(new Date(record.recordDate), 'PPP') : 'N/A'}
Description: ${record.description}
      `.trim();
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${record.title.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: "Download Started",
        description: `Downloading summary for ${record.title}`,
      });
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    setChatMessages(prev => [...prev, { role: "user", content: chatInput }]);
    
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        role: "bot", 
        content: "Thank you for your message. Our healthcare team will assist you shortly. For urgent matters, please call our helpline at +91 20 1234 5678." 
      }]);
    }, 1000);
    
    setChatInput("");
  };

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: "opd", label: "Book Appointment", icon: Calendar, color: "text-sky-500", bg: "bg-sky-500/10" },
    { id: "prescriptions", label: "Prescriptions", icon: Pill, color: "text-teal-500", bg: "bg-teal-500/10" },
    { id: "lab-reports", label: "Lab Reports", icon: TestTube, color: "text-blue-500", bg: "bg-blue-500/10" },
    { id: "records", label: "Health Records", icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10" },
    { id: "medical-stores", label: "Medical Stores", icon: Store, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { id: "insurance", label: "Insurance Claims", icon: CreditCard, color: "text-rose-500", bg: "bg-rose-500/10" },
    { id: "health-guide", label: "Health Guide", icon: BookOpen, color: "text-green-500", bg: "bg-green-500/10" },
    { id: "admission", label: "Admission", icon: BedDouble, color: "text-orange-500", bg: "bg-orange-500/10" },
    { id: "hospital-services", label: "Services & Surgeries", icon: Scissors, color: "text-pink-500", bg: "bg-pink-500/10" },
    { id: "notifications", label: "Notifications", icon: Bell, color: "text-amber-500", bg: "bg-amber-500/10", badge: unreadNotifications },
    { id: "team", label: "Our Doctors", icon: Users, color: "text-cyan-500", bg: "bg-cyan-500/10" },
    { id: "chatbot", label: "Health Assistant", icon: MessageCircle, color: "text-violet-500", bg: "bg-violet-500/10" },
    { id: "profile", label: "My Profile", icon: User, color: "text-slate-500", bg: "bg-slate-500/10" },
  ];

  const getRecordIcon = (type: string) => {
    switch (type) {
      case "lab_report": return <TestTube className="h-5 w-5 text-blue-500" />;
      case "prescription": return <Pill className="h-5 w-5 text-green-500" />;
      case "diagnostic": return <FileImage className="h-5 w-5 text-purple-500" />;
      case "vaccination": return <Syringe className="h-5 w-5 text-orange-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment": return <Calendar className="h-5 w-5 text-blue-500" />;
      case "lab_result": return <TestTube className="h-5 w-5 text-green-500" />;
      case "payment": return <CreditCard className="h-5 w-5 text-orange-500" />;
      case "health_tip": return <Sparkles className="h-5 w-5 text-green-500" />;
      default: return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  function PatientSidebar() {
    return (
      <Sidebar collapsible="icon">
        <SidebarHeader className="py-3 px-2 border-b">
            <img 
              src={hospitalLogo} 
              alt="Gravity Hospital" 
              className="w-full max-w-[210px] h-[56px] object-contain group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10"
              data-testid="img-patient-portal-logo"
            />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 px-2">
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton 
                      onClick={() => setActiveSection(item.id)}
                      isActive={activeSection === item.id}
                      tooltip={item.label}
                      data-testid={`nav-${item.id}`}
                      className={`rounded-xl transition-all duration-200 ${
                        activeSection === item.id 
                          ? `${item.bg} border border-current/10` 
                          : ""
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                      </div>
                      <span className={`flex-1 font-medium ${activeSection === item.id ? item.color : ""}`}>{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-5 text-xs group-data-[collapsible=icon]:hidden">
                          {item.badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary">
                {patientName.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="font-medium truncate" data-testid="text-patient-name">{patientName}</p>
              <p className="text-xs text-muted-foreground">Patient</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:px-2" 
            onClick={onLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 group-data-[collapsible=icon]:mr-0 mr-2" />
            <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
    );
  }

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        const isDataLoading = appointmentsLoading || recordsLoading || prescriptionsLoading;
        return (
          <motion.div 
            className="space-y-6"
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={prefersReducedMotion ? {} : { duration: 0.3 }}
          >
            {/* Enhanced Welcome Banner with gradient, decorative elements, and animations */}
            <motion.div 
              className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-emerald-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl"
              initial={prefersReducedMotion ? {} : { y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={prefersReducedMotion ? {} : { duration: 0.5, ease: "easeOut" }}
            >
              {/* Animated background decorations - only animate if reduced motion not preferred */}
              {!prefersReducedMotion && (
                <>
                  <motion.div 
                    className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/5 rounded-full -translate-y-24 sm:-translate-y-32 translate-x-24 sm:translate-x-32"
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div 
                    className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/5 rounded-full translate-y-16 sm:translate-y-24 -translate-x-16 sm:-translate-x-24"
                    animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  />
                  {/* Floating particles */}
                  <motion.div 
                    className="absolute top-1/4 right-1/4 w-2 h-2 bg-white/20 rounded-full"
                    animate={{ y: [-10, 10, -10], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div 
                    className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-white/15 rounded-full"
                    animate={{ y: [10, -10, 10], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  />
                </>
              )}
              {/* Static decorations for reduced motion */}
              {prefersReducedMotion && (
                <>
                  <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/5 rounded-full -translate-y-24 sm:-translate-y-32 translate-x-24 sm:translate-x-32" />
                  <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/5 rounded-full translate-y-16 sm:translate-y-24 -translate-x-16 sm:-translate-x-24" />
                </>
              )}
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
                  <motion.div 
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Heart className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </motion.div>
                  <div>
                    <motion.p 
                      className="text-white/80 text-sm font-medium"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      Good to see you!
                    </motion.p>
                    <motion.h2 
                      className="text-xl sm:text-2xl lg:text-3xl font-bold" 
                      data-testid="text-welcome"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      Welcome back, {patientName}!
                    </motion.h2>
                  </div>
                </div>
                <motion.p 
                  className="text-white/90 max-w-lg text-sm sm:text-base leading-relaxed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Your health, our priority. Here's your personalized health summary and quick access to all your medical services.
                </motion.p>
              </div>
            </motion.div>

            {/* Enhanced Stat Cards with animations and loading skeletons */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
              {[
                { 
                  id: "total-appointments", 
                  title: "Total Appointments", 
                  value: appointments.length, 
                  subtitle: "Lifetime visits", 
                  icon: Calendar, 
                  color: "blue",
                  gradient: "from-blue-500 to-blue-600"
                },
                { 
                  id: "upcoming", 
                  title: "Upcoming", 
                  value: upcomingAppointments.length, 
                  subtitle: "Scheduled appointments", 
                  icon: Clock, 
                  color: "emerald",
                  gradient: "from-emerald-500 to-emerald-600"
                },
                { 
                  id: "records", 
                  title: "Health Records", 
                  value: patientRecords.length, 
                  subtitle: "Medical documents", 
                  icon: FileText, 
                  color: "purple",
                  gradient: "from-purple-500 to-purple-600"
                },
                { 
                  id: "bills", 
                  title: "Pending Bills", 
                  value: `₹${patientBill?.status === 'pending' ? Number(patientBill.totalAmount || 0).toLocaleString('en-IN') : '0'}`, 
                  subtitle: "Outstanding amount", 
                  icon: IndianRupee, 
                  color: "orange",
                  gradient: "from-orange-500 to-orange-600"
                }
              ].map((stat, index) => (
                <motion.div
                  key={stat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
                >
                  <Card 
                    className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300" 
                    data-testid={`card-${stat.id}`}
                    role="region"
                    aria-label={`${stat.title}: ${stat.value}`}
                  >
                    {/* Subtle gradient background on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 relative">
                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                      <motion.div 
                        className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 text-${stat.color}-500`} />
                      </motion.div>
                    </CardHeader>
                    <CardContent className="relative">
                      {isDataLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-8 w-16" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      ) : (
                        <>
                          <motion.div 
                            className={`text-2xl sm:text-3xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}
                            data-testid={`text-${stat.id}`}
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.4, type: "spring", stiffness: 200 }}
                          >
                            {stat.value}
                          </motion.div>
                          <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Enhanced Cards with better styling and animations */}
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 h-full" data-testid="card-upcoming-appointments" role="region" aria-label="Upcoming Appointments">
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
                        <motion.div 
                          className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-blue-500/10 flex items-center justify-center"
                          whileHover={{ scale: 1.1 }}
                        >
                          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                        </motion.div>
                        <span>Upcoming Appointments</span>
                      </CardTitle>
                      {upcomingAppointments.length > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.6, type: "spring" }}
                        >
                          <Badge variant="secondary" className="text-xs">{upcomingAppointments.length} scheduled</Badge>
                        </motion.div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <AnimatePresence mode="wait">
                      {isDataLoading ? (
                        <motion.div 
                          key="loading"
                          className="p-4 space-y-3"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                              <Skeleton className="h-9 w-9 rounded-lg" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      ) : upcomingAppointments.length > 0 ? (
                        <motion.div
                          key="content"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          {/* Mobile-friendly list view */}
                          <div className="block sm:hidden divide-y">
                            {upcomingAppointments.slice(0, 5).map((apt, idx) => {
                              const locationData = LOCATIONS.find(l => l.name === (apt as any).location) || LOCATIONS[9];
                              return (
                                <motion.div 
                                  key={apt.id} 
                                  className="p-4 hover:bg-muted/30 transition-colors"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  data-testid={`appointment-mobile-${apt.id}`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <Stethoscope className="h-5 w-5 text-blue-500" />
                                      </div>
                                      <div>
                                        <p className="font-semibold text-sm">Consultation</p>
                                        <p className="text-xs text-muted-foreground">{apt.appointmentDate} at {apt.timeSlot}</p>
                                      </div>
                                    </div>
                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs shrink-0">
                                      {apt.status || "Scheduled"}
                                    </Badge>
                                  </div>
                                  <div className="mt-3 flex justify-end">
                                    <a 
                                      href={locationData.mapUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400"
                                    >
                                      <MapPin className="h-3 w-3" />
                                      View on Map
                                    </a>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                          {/* Desktop table view */}
                          <div className="hidden sm:block overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/50">
                                  <TableHead className="font-semibold">Doctor</TableHead>
                                  <TableHead className="font-semibold">Date</TableHead>
                                  <TableHead className="font-semibold">Time</TableHead>
                                  <TableHead className="font-semibold">Status</TableHead>
                                  <TableHead className="font-semibold text-right">Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {upcomingAppointments.slice(0, 5).map((apt, idx) => {
                                  const locationData = LOCATIONS.find(l => l.name === (apt as any).location) || LOCATIONS[9];
                                  return (
                                    <motion.tr 
                                      key={apt.id} 
                                      className="hover:bg-muted/30 transition-colors border-b"
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.05 }}
                                      data-testid={`appointment-row-${apt.id}`}
                                    >
                                      <TableCell>
                                        <div className="flex items-center gap-3">
                                          <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                            <Stethoscope className="h-4 w-4 text-blue-500" />
                                          </div>
                                          <div>
                                            <p className="font-medium">Consultation</p>
                                            <p className="text-xs text-muted-foreground">ID: {apt.doctorId?.slice(0, 8)}</p>
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell className="font-medium text-blue-600 dark:text-blue-400">{apt.appointmentDate}</TableCell>
                                      <TableCell>{apt.timeSlot}</TableCell>
                                      <TableCell>
                                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                          {apt.status || "Scheduled"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <a 
                                          href={locationData.mapUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                          data-testid={`link-apt-map-${apt.id}`}
                                        >
                                          <MapPin className="h-3 w-3" />
                                          Map
                                        </a>
                                      </TableCell>
                                    </motion.tr>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="empty"
                          className="text-center py-8 sm:py-12 px-4"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <motion.div 
                            className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 mx-auto flex items-center justify-center mb-4 shadow-inner"
                            animate={prefersReducedMotion ? {} : { y: [0, -5, 0] }}
                            transition={prefersReducedMotion ? {} : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-blue-400" />
                          </motion.div>
                          <h4 className="font-semibold text-foreground mb-1">No Upcoming Appointments</h4>
                          <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">Schedule a visit with one of our specialists today</p>
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button onClick={() => setActiveSection("opd")} data-testid="button-book-from-empty" className="shadow-md">
                              <Plus className="h-4 w-4 mr-2" />
                              Book Appointment
                            </Button>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 h-full" data-testid="card-recent-records" role="region" aria-label="Recent Health Records">
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
                        <motion.div 
                          className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"
                          whileHover={{ scale: 1.1 }}
                        >
                          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                        </motion.div>
                        <span>Recent Health Records</span>
                      </CardTitle>
                      {(patientPrescriptions.length > 0 || patientRecords.length > 0) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.7, type: "spring" }}
                        >
                          <Badge variant="secondary" className="text-xs">{patientPrescriptions.length + patientRecords.length} records</Badge>
                        </motion.div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <AnimatePresence mode="wait">
                      {isDataLoading ? (
                        <motion.div 
                          key="loading"
                          className="p-4 space-y-3"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                              <Skeleton className="h-8 w-8 rounded-lg" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-3 w-1/3" />
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      ) : (patientPrescriptions.length > 0 || patientRecords.length > 0) ? (
                        <motion.div
                          key="content"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          {/* Mobile-friendly list view */}
                          <div className="block sm:hidden divide-y">
                            {patientPrescriptions.slice(0, 3).map((prescription, idx) => (
                              <motion.div 
                                key={`rx-${prescription.id}`}
                                className="p-4 hover:bg-muted/30 transition-colors"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                      <Pill className="h-5 w-5 text-emerald-500" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-sm truncate">{prescription.diagnosis}</p>
                                      <p className="text-xs text-muted-foreground">Dr. {prescription.doctorName}</p>
                                    </div>
                                  </div>
                                  <Badge className={prescription.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'} variant="secondary">
                                    {prescription.status}
                                  </Badge>
                                </div>
                              </motion.div>
                            ))}
                            {patientRecords.slice(0, 2).map((record, idx) => (
                              <motion.div 
                                key={record.id}
                                className="p-4 hover:bg-muted/30 transition-colors"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: (patientPrescriptions.length + idx) * 0.05 }}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                                      {getRecordIcon(record.recordType)}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-sm truncate">{record.title}</p>
                                      <p className="text-xs text-muted-foreground capitalize">{record.recordType?.replace('_', ' ')}</p>
                                    </div>
                                  </div>
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    className="shrink-0"
                                    onClick={() => handleViewRecord(record)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                          {/* Desktop table view */}
                          <div className="hidden sm:block overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/50">
                                  <TableHead className="font-semibold">Type</TableHead>
                                  <TableHead className="font-semibold">Details</TableHead>
                                  <TableHead className="font-semibold">Date</TableHead>
                                  <TableHead className="font-semibold">Status</TableHead>
                                  <TableHead className="font-semibold text-right">Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {patientPrescriptions.slice(0, 3).map((prescription, idx) => (
                                  <motion.tr 
                                    key={`rx-${prescription.id}`} 
                                    className="hover:bg-muted/30 transition-colors border-b" 
                                    data-testid={`prescription-row-${prescription.id}`}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                  >
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                          <Pill className="h-4 w-4 text-emerald-500" />
                                        </div>
                                        <span className="text-sm font-medium">Prescription</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <p className="font-medium truncate max-w-[150px]">{prescription.diagnosis}</p>
                                      <p className="text-xs text-muted-foreground">Dr. {prescription.doctorName}</p>
                                    </TableCell>
                                    <TableCell className="text-sm">{prescription.prescriptionDate ? format(new Date(prescription.prescriptionDate), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                                    <TableCell>
                                      <Badge className={prescription.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}>
                                        {prescription.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button size="sm" variant="ghost">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </motion.tr>
                                ))}
                                {patientRecords.slice(0, 2).map((record, idx) => (
                                  <motion.tr 
                                    key={record.id} 
                                    className="hover:bg-muted/30 transition-colors border-b" 
                                    data-testid={`record-row-${record.id}`}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: (patientPrescriptions.length + idx) * 0.05 }}
                                  >
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                          {getRecordIcon(record.recordType)}
                                        </div>
                                        <span className="text-sm font-medium capitalize">{record.recordType?.replace('_', ' ')}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <p className="font-medium truncate max-w-[150px]">{record.title}</p>
                                    </TableCell>
                                    <TableCell className="text-sm">{record.recordDate ? format(new Date(record.recordDate), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                                    <TableCell>
                                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Record</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={() => handleViewRecord(record)}
                                        data-testid={`button-view-record-${record.id}`}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </motion.tr>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="empty"
                          className="text-center py-8 sm:py-12 px-4"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <motion.div 
                            className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 mx-auto flex items-center justify-center mb-4 shadow-inner"
                            animate={prefersReducedMotion ? {} : { y: [0, -5, 0] }}
                            transition={prefersReducedMotion ? {} : { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                          >
                            <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-400" />
                          </motion.div>
                          <h4 className="font-semibold text-foreground mb-1">No Health Records Yet</h4>
                          <p className="text-sm text-muted-foreground max-w-xs mx-auto">Your medical records, prescriptions, and lab reports will appear here</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                  <CardFooter className="border-t p-3 sm:p-4">
                    <motion.div className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setActiveSection("records")}
                        data-testid="button-view-all-records"
                      >
                        View All Records
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </motion.div>
                  </CardFooter>
                </Card>
              </motion.div>
            </div>

            {/* Enhanced Quick Actions with animations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
            >
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300" data-testid="card-quick-actions" role="region" aria-label="Quick Actions">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
                    <motion.div 
                      className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/10 flex items-center justify-center"
                      whileHover={{ scale: 1.1, rotate: 10 }}
                    >
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </motion.div>
                    <div>
                      <span>Quick Actions</span>
                      <CardDescription className="font-normal mt-0.5 text-sm">Common tasks at your fingertips</CardDescription>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: "Book Appointment", desc: "Schedule a visit", icon: Calendar, section: "opd", gradient: "from-blue-500 to-blue-600", shadow: "shadow-blue-500/30", hoverBg: "hover:bg-blue-50 dark:hover:bg-blue-950/20" },
                      { label: "View Records", desc: "Medical history", icon: FileText, section: "records", gradient: "from-emerald-500 to-emerald-600", shadow: "shadow-emerald-500/30", hoverBg: "hover:bg-emerald-50 dark:hover:bg-emerald-950/20" },
                      { label: "Pay Bills", desc: "Pending payments", icon: CreditCard, section: "admission", gradient: "from-orange-500 to-orange-600", shadow: "shadow-orange-500/30", hoverBg: "hover:bg-orange-50 dark:hover:bg-orange-950/20" },
                      { label: "Health Assistant", desc: "24/7 support", icon: MessageCircle, section: "chatbot", gradient: "from-purple-500 to-purple-600", shadow: "shadow-purple-500/30", hoverBg: "hover:bg-purple-50 dark:hover:bg-purple-950/20" },
                    ].map((action, index) => (
                      <motion.button
                        key={action.label}
                        onClick={() => setActiveSection(action.section)}
                        className={`group flex flex-col items-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl border bg-card ${action.hoverBg} transition-all duration-300 text-center focus:outline-none focus:ring-2 focus:ring-primary/50`}
                        data-testid={`action-${action.section}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 + index * 0.1, type: "spring", stiffness: 300 }}
                        whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.2)" }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div 
                          className={`h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg ${action.shadow}`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <action.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                        </motion.div>
                        <div>
                          <p className="font-semibold text-foreground text-sm sm:text-base">{action.label}</p>
                          <p className="text-xs text-muted-foreground hidden sm:block">{action.desc}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        );

      case "opd":
        return (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Enhanced Header with animation */}
            <motion.div 
              className="relative rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-blue-500 p-4 sm:p-6 text-white shadow-xl overflow-hidden"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-50 rounded-2xl" />
              {/* Floating decorations - respect reduced motion */}
              {prefersReducedMotion ? (
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
              ) : (
                <motion.div 
                  className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 6, repeat: Infinity }}
                />
              )}
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <motion.div 
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </motion.div>
                <div>
                  <motion.h2 
                    className="text-xl sm:text-2xl font-bold" 
                    data-testid="text-opd-title"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Book an Appointment
                  </motion.h2>
                  <motion.p 
                    className="text-white/80 text-sm sm:text-base"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Choose a department and doctor to schedule your visit
                  </motion.p>
                </div>
              </div>
            </motion.div>

            {/* Department selection with animations */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {DEPARTMENTS.map((dept, index) => (
                <motion.div
                  key={dept.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 + 0.2 }}
                >
                  <Card 
                    className={`cursor-pointer text-center transition-all h-full ${selectedDepartment === dept.name ? "ring-2 ring-primary bg-primary/5 shadow-lg" : "hover:shadow-md"}`}
                    onClick={() => {
                      if (selectedDepartment === dept.name) {
                        setSelectedDepartment("");
                        setSelectedDoctor(null);
                      } else {
                        setSelectedDepartment(dept.name);
                        setSelectedDoctor(null);
                      }
                    }}
                    data-testid={`dept-${dept.id}`}
                  >
                    <CardContent className="pt-4 sm:pt-6 pb-4">
                      <motion.div 
                        className={`h-10 w-10 sm:h-12 sm:w-12 mx-auto rounded-xl ${selectedDepartment === dept.name ? "bg-primary/20" : "bg-muted"} flex items-center justify-center mb-2 sm:mb-3`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <dept.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${dept.color}`} />
                      </motion.div>
                      <p className="font-medium text-xs sm:text-sm">{dept.name}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {selectedDepartment ? `${selectedDepartment} Doctors` : "Available Doctors"}
                </h3>
                {selectedDepartment && (
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedDepartment(""); setSelectedDoctor(null); }}>
                    Show All
                  </Button>
                )}
              </div>
              {(() => {
                const filteredDoctors = selectedDepartment 
                  ? doctors.filter((d: any) => d.specialty?.toLowerCase().includes(selectedDepartment.toLowerCase()) || selectedDepartment.toLowerCase().includes(d.specialty?.toLowerCase()))
                  : doctors;
                
                if (filteredDoctors.length === 0) {
                  return (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">
                        {selectedDepartment ? `No doctors available in ${selectedDepartment}. Try selecting a different department.` : "No doctors available. Please check back later."}
                      </p>
                    </Card>
                  );
                }
                
                return (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredDoctors.map((doctor: any) => (
                    <Card 
                      key={doctor.id} 
                      className={`cursor-pointer transition-all ${selectedDoctor === doctor.id ? "ring-2 ring-primary" : "hover-elevate"}`}
                      onClick={() => setSelectedDoctor(doctor.id)}
                      data-testid={`doctor-card-${doctor.id}`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-14 w-14 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary text-base font-semibold">
                              {doctor.avatarInitials || doctor.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate" data-testid={`doctor-name-${doctor.id}`}>{doctor.name}</h4>
                            <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                            <p className="text-xs text-muted-foreground truncate">{doctor.qualification}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium text-yellow-500">{doctor.rating}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {doctor.experience} yrs exp
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            Available
                          </Badge>
                          <span className="text-sm font-semibold">₹{doctor.consultationFee || '500'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                );
              })()}
            </div>

            {selectedDoctor && (() => {
              const doctorData = doctors.find(d => d.id === selectedDoctor);
              const doctorDepartment = doctorData?.specialty || selectedDepartment || "General Medicine";
              
              return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
              <Card className="border-primary shadow-lg" data-testid="card-booking-form">
                <CardHeader>
                  <CardTitle>Select Date & Time</CardTitle>
                  <CardDescription>Choose your preferred appointment slot for {doctorData?.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <div className="flex items-center h-9 px-3 border rounded-md bg-muted/50">
                        <span className="text-sm" data-testid="text-department">{doctorDepartment}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Preferred Date</Label>
                      <Input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(""); setSelectedLocation(""); }}
                        min={new Date().toISOString().split("T")[0]}
                        data-testid="input-appointment-date"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                        <SelectTrigger data-testid="select-location">
                          <SelectValue placeholder={availableLocations.length === 0 && selectedDate ? "No locations available for this date" : "Select location"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableLocations.length > 0 ? (
                            availableLocations.map((locName) => {
                              const loc = LOCATIONS.find(l => l.name === locName);
                              return (
                                <SelectItem key={locName} value={locName}>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{locName}</span>
                                  </div>
                                </SelectItem>
                              );
                            })
                          ) : (
                            LOCATIONS.map((loc) => (
                              <SelectItem key={loc.id} value={loc.name}>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span>{loc.name}</span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {selectedLocation && (() => {
                        const loc = LOCATIONS.find(l => l.name === selectedLocation);
                        return loc ? (
                          <div className="mt-2 p-2 bg-muted/50 rounded-md text-sm">
                            <p className="text-muted-foreground">{loc.address}</p>
                            <a 
                              href={loc.mapUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline mt-1"
                              data-testid="link-location-preview"
                            >
                              <MapPin className="h-3 w-3" />
                              <span>View on Google Maps</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <div className="space-y-2">
                      <Label>Available Slots</Label>
                      <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                        <SelectTrigger data-testid="select-time-slot">
                          <SelectValue placeholder={availableSlots.length === 0 ? "No slots available" : "Select time slot"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSlots.length === 0 ? (
                            <SelectItem value="" disabled>No available slots for this date</SelectItem>
                          ) : (
                            availableSlots.map(slot => (
                              <SelectItem key={slot.value} value={slot.value}>{slot.label}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Textarea 
                    placeholder="Describe your symptoms or reason for visit (optional)"
                    className="min-h-[80px]"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    data-testid="input-symptoms"
                  />
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    disabled={!selectedDate || !selectedSlot || !selectedLocation || bookAppointmentMutation.isPending}
                    onClick={() => {
                      // Find the slot ID from the selected slot value
                      const selectedSlotData = availableSlots.find(s => s.value === selectedSlot);
                      bookAppointmentMutation.mutate({
                        slotId: selectedSlotData?.slotId, // Use slot ID for transactional booking
                        doctorId: selectedDoctor || '', // selectedDoctor is already the doctor ID string
                        patientId: username,
                        patientName: patientName,
                        patientPhone: profileForm.phone || "+91 98765 43210",
                        appointmentDate: selectedDate,
                        timeSlot: selectedSlotData?.label || selectedSlot,
                        department: doctorDepartment,
                        location: selectedLocation,
                        reason: symptoms || "General consultation"
                      });
                    }}
                    data-testid="button-confirm-booking"
                  >
                    {bookAppointmentMutation.isPending ? "Booking..." : "Confirm Booking"}
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
              </motion.div>
              );
            })()}
          </motion.div>
        );

      case "records":
        return (
          <div className="space-y-6">
            {/* Enhanced Header */}
            <div className="relative rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 p-6 text-white shadow-lg">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-50 rounded-2xl" />
              <div className="relative flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold" data-testid="text-records-title">Health Records</h2>
                  <p className="text-white/80">View and download your medical documents</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div></div>
              <div className="flex gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search records..." className="pl-10 w-64" data-testid="input-search-records" />
                </div>
                <Select>
                  <SelectTrigger className="w-40" data-testid="select-filter-records">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="lab_report">Lab Reports</SelectItem>
                    <SelectItem value="prescription">Prescriptions</SelectItem>
                    <SelectItem value="diagnostic">Diagnostics</SelectItem>
                    <SelectItem value="vaccination">Vaccinations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Prescriptions Section - Table Layout */}
            {patientPrescriptions.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Pill className="h-4 w-4 text-green-500" />
                      </div>
                      My Prescriptions
                    </CardTitle>
                    <Badge variant="secondary">{patientPrescriptions.length} total</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Doctor</TableHead>
                        <TableHead className="font-semibold">Diagnosis</TableHead>
                        <TableHead className="font-semibold">Medicines</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patientPrescriptions.map((rx) => (
                        <TableRow key={rx.id} className="hover:bg-muted/30" data-testid={`prescription-row-${rx.id}`}>
                          <TableCell className="font-medium">{rx.prescriptionDate}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Stethoscope className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <span>{rx.doctorName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium truncate max-w-[150px]" data-testid={`rx-diagnosis-${rx.id}`}>{rx.diagnosis}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {rx.medicines.slice(0, 2).map((med, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs font-normal">
                                  {med}
                                </Badge>
                              ))}
                              {rx.medicines.length > 2 && (
                                <Badge variant="outline" className="text-xs">+{rx.medicines.length - 2}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={rx.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}>
                              {rx.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => {
                                const rxData = rx as any;
                                const vitals = rxData.vitals ? (typeof rxData.vitals === 'string' ? JSON.parse(rxData.vitals) : rxData.vitals) : null;
                                
                                const vitalsHtml = vitals ? '<div class="section"><div class="section-title">Vitals</div><div class="grid-5"><div><span class="label">BP:</span> ' + (vitals.bp || 'N/A') + '</div><div><span class="label">Sugar:</span> ' + (vitals.sugar || 'N/A') + '</div><div><span class="label">Pulse:</span> ' + (vitals.pulse || 'N/A') + '</div><div><span class="label">Weight:</span> ' + (vitals.weight || 'N/A') + '</div><div><span class="label">Temp:</span> ' + (vitals.temp || 'N/A') + '</div></div></div>' : '';
                                
                                const clinicalNotesHtml = (rxData.patientComplaints || rxData.doctorObservations || rxData.pastHistoryReference || rxData.knownAllergies) ? '<div class="section"><div class="section-title">Clinical Notes</div>' + (rxData.patientComplaints ? '<div style="margin-bottom: 8px;"><span class="label">Patient Complaints:</span> <span class="value">' + rxData.patientComplaints + '</span></div>' : '') + (rxData.doctorObservations ? '<div style="margin-bottom: 8px;"><span class="label">Doctor Observations:</span> <span class="value">' + rxData.doctorObservations + '</span></div>' : '') + (rxData.pastHistoryReference ? '<div style="margin-bottom: 8px;"><span class="label">Past History Reference:</span> <span class="value">' + rxData.pastHistoryReference + '</span></div>' : '') + (rxData.knownAllergies ? '<div><span class="label">Known Allergies:</span> <span class="value" style="color: #dc2626;">' + rxData.knownAllergies + '</span></div>' : '') + '</div>' : '';
                                
                                const chiefComplaintsHtml = rxData.chiefComplaints ? '<div class="section"><div class="section-title">Chief Complaints</div><div class="value">' + rxData.chiefComplaints + '</div></div>' : '';
                                
                                const provisionalHtml = rxData.provisionalDiagnosis ? '<div><span class="label">Provisional:</span> <span class="value">' + rxData.provisionalDiagnosis + '</span></div>' : '';
                                
                                const medicinesHtml = (rxData.medicines || []).map((m: any) => '<div class="medicine"><span class="medicine-name">' + (typeof m === 'string' ? m : (m.name + ' ' + (m.dosage || '') + ' - ' + (m.frequency || ''))) + '</span></div>').join('');
                                
                                const instructionsHtml = rxData.instructions ? '<div class="section"><div class="section-title">Instructions</div><div class="value">' + rxData.instructions + '</div></div>' : '';
                                
                                const testsHtml = rxData.suggestedTest ? '<div class="section"><div class="section-title">Tests Advised</div><div class="value">' + rxData.suggestedTest + '</div></div>' : '';
                                
                                const dietHtml = (rxData.dietAdvice || rxData.activityAdvice) ? '<div class="section"><div class="section-title">Diet & Precautions</div>' + (rxData.dietAdvice ? '<div style="margin-bottom: 8px;"><span class="label">Diet Advice:</span> <span class="value">' + rxData.dietAdvice + '</span></div>' : '') + (rxData.activityAdvice ? '<div><span class="label">Activity Advice:</span> <span class="value">' + rxData.activityAdvice + '</span></div>' : '') + '</div>' : '';
                                
                                const followUpHtml = rxData.followUpDate ? '<div class="section"><div class="section-title">Follow-up</div><div class="value">' + rxData.followUpDate + '</div></div>' : '';
                                
                                const regNoHtml = rxData.doctorRegistrationNo ? '<div style="font-size: 12px; color: #666;">Reg. No: ' + rxData.doctorRegistrationNo + '</div>' : '';
                                
                                const printContent = '<html><head><title>Prescription - ' + rxData.patientName + '</title><style>body { font-family: Arial, sans-serif; padding: 40px; font-size: 14px; line-height: 1.5; }.header { text-align: center; border-bottom: 2px solid #1a56db; padding-bottom: 15px; margin-bottom: 25px; }.hospital { font-size: 26px; font-weight: bold; color: #1a56db; }.subtitle { font-size: 14px; color: #666; margin-top: 5px; }.section { margin: 18px 0; }.section-title { font-weight: bold; color: #1a56db; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px; }.label { font-weight: 600; color: #374151; }.value { color: #111; margin-top: 3px; }.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }.grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }.medicines { margin-top: 10px; }.medicine { background: #f3f4f6; padding: 8px 12px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #1a56db; }.medicine-name { font-weight: 600; }.footer { margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px; }.signature-line { margin-top: 40px; text-align: right; }.signature-line .line { border-top: 1px solid #333; width: 200px; margin-left: auto; margin-bottom: 5px; }@media print { body { padding: 20px; } }</style></head><body><div class="header"><div class="hospital">Gravity Hospital</div><div class="subtitle">Medical Prescription</div></div><div class="section"><div class="section-title">Patient Details</div><div class="grid-3"><div><span class="label">Name:</span> <span class="value">' + rxData.patientName + '</span></div><div><span class="label">Age:</span> <span class="value">' + (rxData.patientAge || 'N/A') + '</span></div><div><span class="label">Gender:</span> <span class="value">' + (rxData.patientGender || 'N/A') + '</span></div></div><div class="grid-2" style="margin-top: 10px;"><div><span class="label">Patient ID:</span> <span class="value">' + rxData.patientId + '</span></div><div><span class="label">Date:</span> <span class="value">' + (rxData.prescriptionDate || 'N/A') + '</span></div></div></div>' + vitalsHtml + clinicalNotesHtml + chiefComplaintsHtml + '<div class="section"><div class="section-title">Diagnosis</div><div class="grid-2"><div><span class="label">Primary Diagnosis:</span> <span class="value">' + (rxData.diagnosis || 'N/A') + '</span></div>' + provisionalHtml + '</div></div><div class="section"><div class="section-title">Medicines</div><div class="medicines">' + medicinesHtml + '</div></div>' + instructionsHtml + testsHtml + dietHtml + followUpHtml + '<div class="footer"><div class="signature-line"><div class="line"></div><div>Dr. ' + rxData.doctorName + '</div>' + regNoHtml + '</div><div style="margin-top: 20px; font-size: 12px; color: #666;"><div>Gravity Hospital - Pimpri-Chinchwad</div></div></div></body></html>';
                                
                                const printWindow = window.open('', '_blank');
                                if (printWindow) {
                                  printWindow.document.write(printContent);
                                  printWindow.document.close();
                                  printWindow.print();
                                }
                              }}
                              data-testid={`button-print-rx-${rx.id}`}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Medical Records Section - Table Layout */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Medical Documents ({patientRecords.length})
              </h3>
              <div className="grid gap-4">
                {patientRecords.length > 0 ? patientRecords.map((record) => (
                  <Card key={record.id} className="hover-elevate" data-testid={`record-card-${record.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                          {getRecordIcon(record.recordType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold" data-testid={`record-title-${record.id}`}>{record.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{record.physician}</span>
                            <span className="hidden sm:inline">-</span>
                            <span className="hidden sm:inline">{record.recordType}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {record.recordDate ? format(new Date(record.recordDate), 'yyyy-MM-dd') : 'N/A'}
                          </p>
                          <Badge variant={record.fileData ? "default" : "secondary"} className="mt-1">
                            {record.fileData ? "Has File" : "No File"}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleViewRecord(record)}
                            data-testid={`button-view-${record.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleDownloadRecord(record)}
                            data-testid={`button-download-${record.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No medical documents found</p>
                      <p className="text-sm text-muted-foreground mt-1">Your medical documents will appear here once uploaded by your healthcare provider</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Consent Forms Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                My Consent Forms ({patientConsents.length})
              </h3>
              <div className="grid gap-4">
                {patientConsents.length > 0 ? patientConsents.map((consent) => (
                  <Card key={consent.id} className="hover-elevate" data-testid={`consent-card-${consent.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0">
                              {consent.consentType}
                            </Badge>
                          </div>
                          <h4 className="font-semibold mt-1" data-testid={`consent-title-${consent.id}`}>{consent.title}</h4>
                          <p className="text-sm text-muted-foreground">{consent.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {consent.fileName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {consent.uploadedAt ? format(new Date(consent.uploadedAt), 'MM/dd/yyyy') : 'N/A'}
                          </p>
                          <Badge variant={consent.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                            {consent.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => {
                              if (consent.fileData) {
                                window.open(consent.fileData, '_blank');
                              }
                            }}
                            data-testid={`button-view-consent-${consent.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => {
                              if (consent.fileData && consent.fileName) {
                                const link = document.createElement('a');
                                link.href = consent.fileData;
                                link.download = consent.fileName;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                toast({
                                  title: "Download Started",
                                  description: `Downloading ${consent.fileName}`,
                                });
                              }
                            }}
                            data-testid={`button-download-consent-${consent.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No consent forms found</p>
                      <p className="text-sm text-muted-foreground mt-1">Your consent forms will appear here once uploaded by your healthcare provider</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Medical Record View Dialog */}
            <Dialog open={viewRecordDialogOpen} onOpenChange={setViewRecordDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {selectedMedicalRecord?.title}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedMedicalRecord?.recordType} - {selectedMedicalRecord?.recordDate ? format(new Date(selectedMedicalRecord.recordDate), 'PPP') : 'N/A'}
                  </DialogDescription>
                </DialogHeader>
                {selectedMedicalRecord && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Physician</p>
                        <p className="font-medium">{selectedMedicalRecord.physician}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Record Type</p>
                        <p className="font-medium">{selectedMedicalRecord.recordType}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Description</p>
                      <p className="mt-1">{selectedMedicalRecord.description || 'No description provided'}</p>
                    </div>

                    {selectedMedicalRecord.fileData && (
                      <div className="border rounded-lg p-4">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Attached File</p>
                        {selectedMedicalRecord.fileType?.startsWith('image/') ? (
                          <img 
                            src={selectedMedicalRecord.fileData} 
                            alt={selectedMedicalRecord.title}
                            className="max-w-full max-h-96 object-contain rounded"
                          />
                        ) : selectedMedicalRecord.fileType === 'application/pdf' ? (
                          <iframe 
                            src={selectedMedicalRecord.fileData} 
                            className="w-full h-96 border-0 rounded"
                            title={selectedMedicalRecord.title}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <span>{selectedMedicalRecord.fileName || 'Attached file'}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {!selectedMedicalRecord.fileData && (
                      <div className="border rounded-lg p-4 text-center text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No file attached to this record</p>
                      </div>
                    )}

                    <div className="flex gap-2 justify-end">
                      {selectedMedicalRecord.fileData && (
                        <Button variant="outline" onClick={() => handleDownloadRecord(selectedMedicalRecord)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                      <Button onClick={() => setViewRecordDialogOpen(false)}>
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        );

      case "admission":
        return (
          <div className="space-y-6">
            {/* Enhanced Header */}
            <div className="relative rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-6 text-white shadow-lg">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-50 rounded-2xl" />
              <div className="relative flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <BedDouble className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold" data-testid="text-admission-title">Admission & Billing</h2>
                  <p className="text-white/80">View your current admission status and billing</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card data-testid="card-admission-info">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BedDouble className="h-5 w-5 text-primary" />
                    Current Admission
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-700 dark:text-green-300">Active Admission</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Admitted on December 15, 2024
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Ward/Room</span>
                      <span className="font-medium" data-testid="text-ward">Ward A - Room 205</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Bed Number</span>
                      <span className="font-medium" data-testid="text-bed">Bed 2</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Attending Doctor</span>
                      <span className="font-medium" data-testid="text-doctor">Dr. Priya Sharma</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Diagnosis</span>
                      <span className="font-medium" data-testid="text-diagnosis">Routine Observation</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Expected Discharge</span>
                      <span className="font-medium" data-testid="text-discharge">December 18, 2024</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-billing">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-primary" />
                    Billing Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!patientBill ? (
                    <div className="text-center py-6">
                      <IndianRupee className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No bill generated yet</p>
                      <Button 
                        onClick={() => generateBillMutation.mutate()}
                        disabled={generateBillMutation.isPending}
                        data-testid="button-generate-bill"
                      >
                        {generateBillMutation.isPending ? "Requesting..." : "Generate Bill"}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Click to request bill generation. Admin will be notified.
                      </p>
                    </div>
                  ) : (
                    <>
                      {patientBill.status === "pending" && parseFloat(patientBill.totalAmount?.toString() || "0") === 0 && (
                        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 mb-4">
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            Bill requested. Waiting for admin to add charges...
                          </p>
                        </div>
                      )}
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Room Charges ({patientBill.roomDays || 1} days)</span>
                          <span className="font-medium" data-testid="text-room-charges">
                            ₹{parseFloat(patientBill.roomCharges?.toString() || "0").toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Doctor Consultation</span>
                          <span className="font-medium" data-testid="text-doctor-consultation">
                            ₹{parseFloat(patientBill.doctorConsultation?.toString() || "0").toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Lab Tests</span>
                          <span className="font-medium" data-testid="text-lab-tests">
                            ₹{parseFloat(patientBill.labTests?.toString() || "0").toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Medicines</span>
                          <span className="font-medium" data-testid="text-medicines">
                            ₹{parseFloat(patientBill.medicines?.toString() || "0").toLocaleString('en-IN')}
                          </span>
                        </div>
                        {parseFloat(patientBill.inventoryCharges?.toString() || "0") > 0 && (
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Inventory/Equipment</span>
                            <span className="font-medium" data-testid="text-inventory">
                              ₹{parseFloat(patientBill.inventoryCharges?.toString() || "0").toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                        {parseFloat(patientBill.otherFees?.toString() || "0") > 0 && (
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">
                              {patientBill.otherFeesDescription || "Other Fees"}
                            </span>
                            <span className="font-medium" data-testid="text-other-fees">
                              ₹{parseFloat(patientBill.otherFees?.toString() || "0").toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between py-2 border-b text-lg font-semibold">
                          <span>Total</span>
                          <span data-testid="text-total">
                            ₹{parseFloat(patientBill.totalAmount?.toString() || "0").toLocaleString('en-IN')}
                          </span>
                        </div>
                        {parseFloat(patientBill.paidAmount?.toString() || "0") > 0 && (
                          <div className="flex justify-between py-2 border-b text-green-600">
                            <span>Paid</span>
                            <span data-testid="text-paid">
                              - ₹{parseFloat(patientBill.paidAmount?.toString() || "0").toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                        <div className={`flex justify-between py-2 text-lg font-bold ${
                          parseFloat(patientBill.balanceDue?.toString() || "0") > 0 ? "text-orange-600" : "text-green-600"
                        }`}>
                          <span>Balance Due</span>
                          <span data-testid="text-balance">
                            ₹{parseFloat(patientBill.balanceDue?.toString() || "0").toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {patientBill.status === "paid" ? (
                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-green-700 dark:text-green-300 font-medium">Fully Paid</span>
                          </div>
                        </div>
                      ) : parseFloat(patientBill.balanceDue?.toString() || "0") > 0 ? (
                        <Button className="w-full" data-testid="button-pay-now">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Now
                        </Button>
                      ) : null}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "hospital-services":
        return <HospitalServices currentUserRole="PATIENT" />;

      case "notifications":
        const parseMetadata = (metadata: string | null) => {
          if (!metadata) return {};
          try {
            return JSON.parse(metadata);
          } catch {
            return {};
          }
        };

        return (
          <div className="space-y-6">
            {/* Enhanced Header */}
            <div className="relative rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-6 text-white shadow-lg">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-50 rounded-2xl" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Bell className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold" data-testid="text-notifications-title">Notifications</h2>
                    <p className="text-white/80">Stay updated with your health alerts</p>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  data-testid="button-mark-all-read"
                  onClick={() => markAllAsRead()}
                >
                  Mark all as read
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {userNotifications.length === 0 ? (
                <Card className="p-8 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No notifications yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Book an appointment to receive updates</p>
                </Card>
              ) : (
                userNotifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`hover-elevate cursor-pointer ${!notification.isRead ? "border-primary bg-primary/5" : ""}`}
                    onClick={() => {
                      setSelectedNotification(notification);
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                    }}
                    data-testid={`notification-card-${notification.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          !notification.isRead ? "bg-primary/10" : "bg-muted"
                        }`}>
                          {getNotificationIcon(notification.type || "general")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold" data-testid={`notification-title-${notification.id}`}>{notification.title}</h4>
                            {!notification.isRead && (
                              <span className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) : 'Just now'}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" data-testid={`button-notification-action-${notification.id}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedNotification && getNotificationIcon(selectedNotification.type || "general")}
                    {selectedNotification?.title}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedNotification?.createdAt 
                      ? format(new Date(selectedNotification.createdAt), 'PPpp') 
                      : 'Just now'}
                  </DialogDescription>
                </DialogHeader>
                {selectedNotification && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">{selectedNotification.message}</p>
                    
                    {selectedNotification.type === "appointment" && selectedNotification.metadata && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Appointment Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          {(() => {
                            const meta = parseMetadata(selectedNotification.metadata);
                            return (
                              <>
                                {meta.appointmentDate && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Date:</span>
                                    <span className="font-medium">{meta.appointmentDate}</span>
                                  </div>
                                )}
                                {meta.appointmentTime && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Time:</span>
                                    <span className="font-medium">{meta.appointmentTime}</span>
                                  </div>
                                )}
                                {meta.department && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Department:</span>
                                    <span className="font-medium">{meta.department}</span>
                                  </div>
                                )}
                                {meta.location && (() => {
                                  const locationData = LOCATIONS.find(l => l.name === meta.location || l.id === meta.location);
                                  return (
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Location:</span>
                                        <span className="font-medium">{meta.location}</span>
                                      </div>
                                      {locationData && (
                                        <a 
                                          href={locationData.mapUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 text-primary hover:underline"
                                          data-testid="link-location-map"
                                        >
                                          <MapPin className="h-4 w-4" />
                                          <span>View on Google Maps</span>
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      )}
                                    </div>
                                  );
                                })()}
                              </>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    )}
                    
                    <Button 
                      className="w-full" 
                      onClick={() => setSelectedNotification(null)}
                    >
                      Close
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Medical Record View Dialog */}
            <Dialog open={viewRecordDialogOpen} onOpenChange={setViewRecordDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {selectedMedicalRecord?.title}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedMedicalRecord?.recordType} - {selectedMedicalRecord?.recordDate ? format(new Date(selectedMedicalRecord.recordDate), 'PPP') : 'N/A'}
                  </DialogDescription>
                </DialogHeader>
                {selectedMedicalRecord && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Physician</p>
                        <p className="font-medium">{selectedMedicalRecord.physician}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Record Type</p>
                        <p className="font-medium">{selectedMedicalRecord.recordType}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Description</p>
                      <p className="mt-1">{selectedMedicalRecord.description || 'No description provided'}</p>
                    </div>

                    {selectedMedicalRecord.fileData && (
                      <div className="border rounded-lg p-4">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Attached File</p>
                        {selectedMedicalRecord.fileType?.startsWith('image/') ? (
                          <img 
                            src={selectedMedicalRecord.fileData} 
                            alt={selectedMedicalRecord.title}
                            className="max-w-full max-h-96 object-contain rounded"
                          />
                        ) : selectedMedicalRecord.fileType === 'application/pdf' ? (
                          <iframe 
                            src={selectedMedicalRecord.fileData} 
                            className="w-full h-96 border-0 rounded"
                            title={selectedMedicalRecord.title}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <span>{selectedMedicalRecord.fileName || 'Attached file'}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {!selectedMedicalRecord.fileData && (
                      <div className="border rounded-lg p-4 text-center text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No file attached to this record</p>
                      </div>
                    )}

                    <div className="flex gap-2 justify-end">
                      {selectedMedicalRecord.fileData && (
                        <Button variant="outline" onClick={() => handleDownloadRecord(selectedMedicalRecord)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                      <Button onClick={() => setViewRecordDialogOpen(false)}>
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        );

      case "team":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-team-title">Our Medical Team</h2>
              <p className="text-muted-foreground">Meet our experienced healthcare professionals</p>
            </div>

            {doctors.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No doctors available. Please check back later.</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {doctors.map((doctor: any) => (
                  <Card key={doctor.id} className="hover-elevate" data-testid={`team-card-${doctor.id}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-14 w-14 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary text-base font-semibold">
                            {doctor.avatarInitials || doctor.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold" data-testid={`team-name-${doctor.id}`}>{doctor.name}</h4>
                          <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                          <p className="text-xs text-muted-foreground truncate">{doctor.qualification}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium text-yellow-500">{doctor.rating}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {doctor.experience} yrs exp
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          Available
                        </Badge>
                        <span className="text-sm font-semibold">₹{doctor.consultationFee || '500'}</span>
                      </div>
                      <Button 
                        className="w-full mt-4" 
                        onClick={() => {
                          setActiveSection("opd");
                          setSelectedDoctor(doctor.id);
                        }}
                        data-testid={`button-book-doctor-${doctor.id}`}
                      >
                        Book Appointment
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case "prescriptions":
        return (
          <div className="space-y-6">
            {/* Enhanced Header */}
            <div className="relative rounded-2xl bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 p-6 text-white shadow-lg">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-50 rounded-2xl" />
              <div className="relative flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Pill className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold" data-testid="text-prescriptions-title">My Prescriptions</h2>
                  <p className="text-white/80">View and manage your prescriptions</p>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              <Card className="text-center p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-teal-600 dark:text-teal-400">{patientPrescriptions.length}</div>
                <p className="text-xs text-muted-foreground">Total Prescriptions</p>
              </Card>
              <Card className="text-center p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{patientPrescriptions.filter(p => p.prescriptionStatus === 'finalized').length}</div>
                <p className="text-xs text-muted-foreground">Finalized</p>
              </Card>
              <Card className="text-center p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{patientPrescriptions.filter(p => p.prescriptionStatus === 'draft').length}</div>
                <p className="text-xs text-muted-foreground">Pending</p>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {patientPrescriptions.length > 0 ? (
                patientPrescriptions.map((prescription) => (
                  <Card key={prescription.id} className="hover-elevate border-0 shadow-md" data-testid={`card-prescription-${prescription.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-md">
                            <ClipboardList className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardDescription className="text-xs">
                              {prescription.createdAt ? format(new Date(prescription.createdAt), "MMM dd, yyyy") : "-"}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge 
                          variant="secondary"
                          className={
                            prescription.prescriptionStatus === "finalized" 
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0" 
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0"
                          }
                        >
                          {prescription.prescriptionStatus}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="font-medium">Dr. {prescription.doctorName}</span>
                      </div>
                      {prescription.diagnosis && (
                        <div className="text-sm p-3 rounded-lg bg-muted/50">
                          <span className="text-muted-foreground">Diagnosis: </span>
                          <span className="font-medium">{prescription.diagnosis}</span>
                        </div>
                      )}
                      {prescription.medicines && prescription.medicines.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-sm text-muted-foreground">Medicines:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {(prescription.medicines as any[]).slice(0, 3).map((med, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800">
                                <Pill className="h-3 w-3 mr-1 text-teal-600 dark:text-teal-400" />
                                {med.name || med}
                              </Badge>
                            ))}
                            {(prescription.medicines as any[]).length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{(prescription.medicines as any[]).length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      <Separator className="my-3" />
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            const rx = prescription as any;
                            const vitals = rx.vitals ? (typeof rx.vitals === 'string' ? JSON.parse(rx.vitals) : rx.vitals) : null;
                            
                            const vitalsHtml = vitals ? '<div class="section"><div class="section-title">Vitals</div><div class="grid-5"><div><span class="label">BP:</span> ' + (vitals.bp || 'N/A') + '</div><div><span class="label">Sugar:</span> ' + (vitals.sugar || 'N/A') + '</div><div><span class="label">Pulse:</span> ' + (vitals.pulse || 'N/A') + '</div><div><span class="label">Weight:</span> ' + (vitals.weight || 'N/A') + '</div><div><span class="label">Temp:</span> ' + (vitals.temp || 'N/A') + '</div></div></div>' : '';
                            
                            const clinicalNotesHtml = (rx.patientComplaints || rx.doctorObservations || rx.pastHistoryReference || rx.knownAllergies) ? '<div class="section"><div class="section-title">Clinical Notes</div>' + (rx.patientComplaints ? '<div style="margin-bottom: 8px;"><span class="label">Patient Complaints:</span> <span class="value">' + rx.patientComplaints + '</span></div>' : '') + (rx.doctorObservations ? '<div style="margin-bottom: 8px;"><span class="label">Doctor Observations:</span> <span class="value">' + rx.doctorObservations + '</span></div>' : '') + (rx.pastHistoryReference ? '<div style="margin-bottom: 8px;"><span class="label">Past History Reference:</span> <span class="value">' + rx.pastHistoryReference + '</span></div>' : '') + (rx.knownAllergies ? '<div><span class="label">Known Allergies:</span> <span class="value" style="color: #dc2626;">' + rx.knownAllergies + '</span></div>' : '') + '</div>' : '';
                            
                            const chiefComplaintsHtml = rx.chiefComplaints ? '<div class="section"><div class="section-title">Chief Complaints</div><div class="value">' + rx.chiefComplaints + '</div></div>' : '';
                            
                            const provisionalHtml = rx.provisionalDiagnosis ? '<div><span class="label">Provisional:</span> <span class="value">' + rx.provisionalDiagnosis + '</span></div>' : '';
                            
                            const medicinesHtml = (rx.medicines || []).map((m: any) => '<div class="medicine"><span class="medicine-name">' + (typeof m === 'string' ? m : (m.name + ' ' + (m.dosage || '') + ' - ' + (m.frequency || ''))) + '</span></div>').join('');
                            
                            const instructionsHtml = rx.instructions ? '<div class="section"><div class="section-title">Instructions</div><div class="value">' + rx.instructions + '</div></div>' : '';
                            
                            const testsHtml = rx.suggestedTest ? '<div class="section"><div class="section-title">Tests Advised</div><div class="value">' + rx.suggestedTest + '</div></div>' : '';
                            
                            const dietHtml = (rx.dietAdvice || rx.activityAdvice) ? '<div class="section"><div class="section-title">Diet & Precautions</div>' + (rx.dietAdvice ? '<div style="margin-bottom: 8px;"><span class="label">Diet Advice:</span> <span class="value">' + rx.dietAdvice + '</span></div>' : '') + (rx.activityAdvice ? '<div><span class="label">Activity Advice:</span> <span class="value">' + rx.activityAdvice + '</span></div>' : '') + '</div>' : '';
                            
                            const followUpHtml = rx.followUpDate ? '<div class="section"><div class="section-title">Follow-up</div><div class="value">' + rx.followUpDate + '</div></div>' : '';
                            
                            const regNoHtml = rx.doctorRegistrationNo ? '<div style="font-size: 12px; color: #666;">Reg. No: ' + rx.doctorRegistrationNo + '</div>' : '';
                            
                            const printContent = '<html><head><title>Prescription - ' + rx.patientName + '</title><style>body { font-family: Arial, sans-serif; padding: 40px; font-size: 14px; line-height: 1.5; }.header { text-align: center; border-bottom: 2px solid #1a56db; padding-bottom: 15px; margin-bottom: 25px; }.hospital { font-size: 26px; font-weight: bold; color: #1a56db; }.subtitle { font-size: 14px; color: #666; margin-top: 5px; }.section { margin: 18px 0; }.section-title { font-weight: bold; color: #1a56db; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px; }.label { font-weight: 600; color: #374151; }.value { color: #111; margin-top: 3px; }.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }.grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }.medicines { margin-top: 10px; }.medicine { background: #f3f4f6; padding: 8px 12px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #1a56db; }.medicine-name { font-weight: 600; }.footer { margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px; }.signature-line { margin-top: 40px; text-align: right; }.signature-line .line { border-top: 1px solid #333; width: 200px; margin-left: auto; margin-bottom: 5px; }@media print { body { padding: 20px; } }</style></head><body><div class="header"><div class="hospital">Gravity Hospital</div><div class="subtitle">Medical Prescription</div></div><div class="section"><div class="section-title">Patient Details</div><div class="grid-3"><div><span class="label">Name:</span> <span class="value">' + rx.patientName + '</span></div><div><span class="label">Age:</span> <span class="value">' + (rx.patientAge || 'N/A') + '</span></div><div><span class="label">Gender:</span> <span class="value">' + (rx.patientGender || 'N/A') + '</span></div></div><div class="grid-2" style="margin-top: 10px;"><div><span class="label">Patient ID:</span> <span class="value">' + rx.patientId + '</span></div><div><span class="label">Date:</span> <span class="value">' + (rx.prescriptionDate || (rx.createdAt ? new Date(rx.createdAt).toISOString().split('T')[0] : 'N/A')) + '</span></div></div></div>' + vitalsHtml + clinicalNotesHtml + chiefComplaintsHtml + '<div class="section"><div class="section-title">Diagnosis</div><div class="grid-2"><div><span class="label">Primary Diagnosis:</span> <span class="value">' + (rx.diagnosis || 'N/A') + '</span></div>' + provisionalHtml + '</div></div><div class="section"><div class="section-title">Medicines</div><div class="medicines">' + medicinesHtml + '</div></div>' + instructionsHtml + testsHtml + dietHtml + followUpHtml + '<div class="footer"><div class="signature-line"><div class="line"></div><div>Dr. ' + rx.doctorName + '</div>' + regNoHtml + '</div><div style="margin-top: 20px; font-size: 12px; color: #666;"><div>Gravity Hospital - Pimpri-Chinchwad</div></div></div></body></html>';
                            
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              printWindow.document.write(printContent);
                              printWindow.document.close();
                            }
                          }}
                          data-testid={`button-view-prescription-${prescription.id}`}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setActiveSection("medical-stores")}
                          data-testid={`button-buy-medicines-${prescription.id}`}
                        >
                          <Store className="h-4 w-4 mr-2" />
                          Buy Medicines
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="col-span-full" data-testid="card-no-prescriptions">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Pill className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Prescriptions Yet</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm">
                      Your prescriptions will appear here after your doctor consultations.
                    </p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setActiveSection("opd")}
                      data-testid="button-book-appointment-prescriptions"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Appointment
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      case "lab-reports":
        return (
          <div className="space-y-6">
            {/* Enhanced Header */}
            <div className="relative rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-6 text-white shadow-lg">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-50 rounded-2xl" />
              <div className="relative flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <TestTube className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold" data-testid="text-lab-reports-title">My Lab Reports</h2>
                  <p className="text-white/80">View your pathology test results and lab reports</p>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              <Card className="text-center p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{labReports.length}</div>
                <p className="text-xs text-muted-foreground">Total Reports</p>
              </Card>
              <Card className="text-center p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{labReports.filter((r: any) => r.reportStatus === 'VERIFIED').length}</div>
                <p className="text-xs text-muted-foreground">Verified</p>
              </Card>
              <Card className="text-center p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{labReports.filter((r: any) => r.reportStatus === 'IN_PROGRESS').length}</div>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </Card>
            </div>

            {labReportsLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-3">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : labReports.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {labReports.map((report: any) => (
                  <Card key={report.id} className="hover-elevate" data-testid={`card-lab-report-${report.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base font-mono flex items-center gap-2">
                            <TestTube className="h-4 w-4 text-blue-500" />
                            {report.reportNumber}
                          </CardTitle>
                          <CardDescription>
                            {report.reportDate ? format(new Date(report.reportDate), "MMM dd, yyyy") : "-"}
                          </CardDescription>
                        </div>
                        <Badge 
                          className={
                            report.reportStatus === "VERIFIED"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : report.reportStatus === "COMPLETED"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : report.reportStatus === "IN_PROGRESS"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                          }
                        >
                          {report.reportStatus}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{report.testName || "Lab Test"}</span>
                        </div>
                        {report.labName && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            <span>{report.labName}</span>
                          </div>
                        )}
                        {report.doctorName && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Stethoscope className="h-4 w-4" />
                            <span>Ordered by Dr. {report.doctorName}</span>
                          </div>
                        )}
                      </div>
                      
                      {report.reportSummary && (
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Summary:</strong> {report.reportSummary}
                          </p>
                        </div>
                      )}

                      {report.criticalFlags && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                          <p className="text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            <strong>Critical:</strong> {report.criticalFlags}
                          </p>
                        </div>
                      )}

                      <Separator />
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            if (report.pdfUrl) {
                              const link = document.createElement('a');
                              link.href = report.pdfUrl;
                              link.download = `${report.reportNumber || 'lab-report'}.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            } else {
                              const content = `
Lab Report: ${report.reportNumber}
Date: ${report.reportDate ? format(new Date(report.reportDate), "MMM dd, yyyy") : "-"}
Test: ${report.testName || "Lab Test"}
Lab: ${report.labName || "N/A"}
Status: ${report.reportStatus}

Summary: ${report.reportSummary || report.resultData ? JSON.parse(report.resultData || "{}").summary : "N/A"}
${report.criticalFlags ? `\nCritical Notes: ${report.criticalFlags}` : ""}
${report.remarks ? `\nRemarks: ${report.remarks}` : ""}
                              `.trim();
                              const blob = new Blob([content], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `${report.reportNumber || 'lab-report'}.txt`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              URL.revokeObjectURL(url);
                            }
                            toast({
                              title: "Download Started",
                              description: `Downloading ${report.reportNumber}`,
                            });
                          }}
                          data-testid={`button-download-report-${report.id}`}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            if (report.pdfUrl) {
                              window.open(report.pdfUrl, '_blank');
                            } else {
                              toast({
                                title: "Report Details",
                                description: report.reportSummary || report.remarks || "Full report details available on request.",
                              });
                            }
                          }}
                          data-testid={`button-view-report-${report.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {report.pdfUrl ? "View PDF" : "View Details"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="col-span-full" data-testid="card-no-lab-reports">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <TestTube className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No Lab Reports Yet</h3>
                  <p className="text-muted-foreground mt-2 max-w-sm">
                    Your lab test results will appear here once your doctor orders tests and the lab uploads reports.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "medical-stores":
        return (
          <div className="space-y-6">
            {/* Enhanced Header */}
            <div className="relative rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500 p-6 text-white shadow-lg">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-50 rounded-2xl" />
              <div className="relative flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Store className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold" data-testid="text-medical-stores-title">Medical Stores</h2>
                  <p className="text-white/80">Find authorized pharmacies to buy your prescribed medicines</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {medicalStores.length > 0 ? (
                medicalStores.map((store: any) => (
                  <Card key={store.id} className="hover-elevate" data-testid={`card-store-${store.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Store className="h-5 w-5 text-primary" />
                            {store.storeName}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {store.address}
                          </CardDescription>
                        </div>
                        <Badge 
                          className={
                            store.storeType === "IN_HOUSE" 
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" 
                              : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                          }
                        >
                          {store.storeType === "IN_HOUSE" ? "Hospital Pharmacy" : "Partner Store"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {store.phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Phone:</span>
                            <span>{store.phone}</span>
                          </div>
                        )}
                        {store.operatingHours && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{store.operatingHours}</span>
                          </div>
                        )}
                      </div>
                      {store.storeType === "IN_HOUSE" && (
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <CheckCircle className="h-4 w-4 inline mr-2" />
                            Hospital pharmacy with direct prescription access
                          </p>
                        </div>
                      )}
                      <Separator />
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" data-testid={`button-call-store-${store.id}`}>
                          Call Store
                        </Button>
                        <Button 
                          className="flex-1"
                          onClick={() => {
                            if (store.mapUrl) {
                              window.open(store.mapUrl, '_blank');
                            }
                          }}
                          data-testid={`button-directions-${store.id}`}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Directions
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="col-span-full" data-testid="card-no-stores">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Store className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Medical Stores Available</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm">
                      Partner medical stores will be displayed here once available.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            <Card data-testid="card-hospital-pharmacy-info">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Hospital Pharmacy Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">Direct Prescription Access</h4>
                      <p className="text-sm text-muted-foreground">No need to carry paper prescriptions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">Insurance Integration</h4>
                      <p className="text-sm text-muted-foreground">Seamless billing with your insurance</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <Pill className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">Genuine Medicines</h4>
                      <p className="text-sm text-muted-foreground">Verified quality and authenticity</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "insurance":
        const claimStatusColors: Record<string, string> = {
          DRAFT: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
          SUBMITTED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
          UNDER_REVIEW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
          QUERY_RAISED: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
          APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
          PARTIALLY_APPROVED: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
          REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
          SETTLED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        };
        return (
          <div className="space-y-6">
            {/* Enhanced Header */}
            <div className="relative rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-pink-500 p-6 text-white shadow-lg">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-50 rounded-2xl" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold" data-testid="text-insurance-title">Insurance Claims</h2>
                    <p className="text-white/80">Submit and track your insurance claims</p>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setShowClaimDialog(true)} data-testid="button-new-claim">
                  <Plus className="h-4 w-4 mr-2" />
                  New Claim
                </Button>
              </div>
            </div>

            <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
              <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Submit Insurance Claim
                    </DialogTitle>
                    <DialogDescription>
                      Fill in the details to submit a new insurance claim for review
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    submitClaimMutation.mutate(claimForm);
                  }}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Claim Type</Label>
                        <Select
                          value={claimForm.claimType}
                          onValueChange={(value) => setClaimForm(prev => ({ ...prev, claimType: value }))}
                        >
                          <SelectTrigger data-testid="select-claim-type">
                            <SelectValue placeholder="Select claim type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pre-Auth">Pre-Authorization</SelectItem>
                            <SelectItem value="Final Claim">Final Claim</SelectItem>
                            <SelectItem value="Reimbursement">Reimbursement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Your Insurance Policy</Label>
                        {patientInsurances.length === 0 ? (
                          <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted">
                            No insurance policies on file. Contact the hospital to add your insurance details.
                          </div>
                        ) : (
                          <Select
                            value={claimForm.insuranceProviderId}
                            onValueChange={(value) => {
                              const selected = patientInsurances.find(pi => pi.id === value);
                              setClaimForm(prev => ({ 
                                ...prev, 
                                insuranceProviderId: value,
                                policyNumber: selected?.policyNumber || ""
                              }));
                            }}
                          >
                            <SelectTrigger data-testid="select-insurance-policy">
                              <SelectValue placeholder="Select your insurance policy" />
                            </SelectTrigger>
                            <SelectContent>
                              {patientInsurances.map((pi) => {
                                const provider = insuranceProviders.find(p => p.id === pi.insuranceProviderId);
                                return (
                                  <SelectItem key={pi.id} value={pi.id}>
                                    {provider?.providerName || "Unknown"} - {pi.policyNumber}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Policy Number</Label>
                        <Input
                          placeholder="Policy number"
                          value={claimForm.policyNumber}
                          readOnly
                          className="bg-muted"
                          data-testid="input-policy-number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Diagnosis / Condition</Label>
                        <Textarea
                          placeholder="Describe your medical condition or diagnosis"
                          value={claimForm.diagnosis}
                          onChange={(e) => setClaimForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                          data-testid="input-diagnosis"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Treatment / Procedure</Label>
                        <Input
                          placeholder="Treatment or procedure planned/done"
                          value={claimForm.plannedProcedure}
                          onChange={(e) => setClaimForm(prev => ({ ...prev, plannedProcedure: e.target.value }))}
                          data-testid="input-procedure"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Estimated Cost (INR)</Label>
                        <NumericInput
                          placeholder="Enter estimated treatment cost"
                          value={claimForm.estimatedCost}
                          onValueChange={(value) => setClaimForm(prev => ({ ...prev, estimatedCost: value }))}
                          allowDecimal={true}
                          data-testid="input-estimated-cost"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowClaimDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitClaimMutation.isPending} data-testid="button-submit-claim">
                        {submitClaimMutation.isPending ? "Submitting..." : "Submit Claim"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
            </Dialog>

            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card data-testid="card-total-claims">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Claims</p>
                      <p className="text-2xl font-bold">{myClaims.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-pending-claims">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                      <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Review</p>
                      <p className="text-2xl font-bold">
                        {myClaims.filter(c => ["SUBMITTED", "UNDER_REVIEW", "QUERY_RAISED"].includes(c.status || "")).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-approved-claims">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Approved / Settled</p>
                      <p className="text-2xl font-bold">
                        {myClaims.filter(c => ["APPROVED", "PARTIALLY_APPROVED", "SETTLED"].includes(c.status || "")).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card data-testid="card-claims-list">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  Your Claims
                </CardTitle>
                <CardDescription>Track the status of your submitted claims</CardDescription>
              </CardHeader>
              <CardContent>
                {myClaims.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Claims Yet</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                      You haven't submitted any insurance claims. Click "New Claim" to submit your first claim.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {myClaims.map((claim) => (
                        <div key={claim.id} className="p-4 border rounded-lg hover:bg-accent/5 transition-colors" data-testid={`claim-card-${claim.id}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-sm text-primary font-medium">
                                  {claim.claimNumber}
                                </span>
                                <Badge className={claimStatusColors[claim.status || "DRAFT"]}>
                                  {claim.status?.replace("_", " ")}
                                </Badge>
                                <Badge variant="outline">{claim.claimType}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                <span className="font-medium">Diagnosis:</span> {claim.diagnosis || "N/A"}
                              </p>
                              {claim.plannedProcedure && (
                                <p className="text-sm text-muted-foreground mb-1">
                                  <span className="font-medium">Procedure:</span> {claim.plannedProcedure}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                {claim.estimatedCost && (
                                  <span className="flex items-center gap-1">
                                    <IndianRupee className="h-3 w-3" />
                                    Estimated: {claim.estimatedCost}
                                  </span>
                                )}
                                {claim.approvedAmount && (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="h-3 w-3" />
                                    Approved: {claim.approvedAmount}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <p>Submitted</p>
                              <p className="font-medium">
                                {claim.submittedAt ? format(new Date(claim.submittedAt), "MMM d, yyyy") : format(new Date(claim.createdAt!), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          {claim.rejectionReason && (
                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <p className="text-sm text-red-800 dark:text-red-300">
                                <XCircle className="h-4 w-4 inline mr-2" />
                                <span className="font-medium">Rejection Reason:</span> {claim.rejectionReason}
                              </p>
                            </div>
                          )}
                          {claim.queryDetails && (
                            <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                              <p className="text-sm text-orange-800 dark:text-orange-300">
                                <AlertTriangle className="h-4 w-4 inline mr-2" />
                                <span className="font-medium">Query:</span> {claim.queryDetails}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "chatbot":
        return (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Enhanced Header */}
            <div className="relative rounded-2xl bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 p-6 text-white shadow-lg">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-50 rounded-2xl" />
              <div className="relative flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Health Assistant</h2>
                  <p className="text-white/80">AI-powered 24/7 healthcare support</p>
                </div>
              </div>
            </div>

            <Card className="h-[500px] flex flex-col border-0 shadow-md" data-testid="card-chatbot">
              <CardHeader className="border-b bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-md">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Chat with AI Assistant</CardTitle>
                    <CardDescription className="text-xs">Ask about symptoms, medications, or general health queries</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {chatMessages.map((msg, idx) => (
                      <div 
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        data-testid={`chat-message-${idx}`}
                      >
                        <div className={`
                          max-w-[80%] rounded-2xl px-4 py-2
                          ${msg.role === "user" 
                            ? "bg-primary text-primary-foreground rounded-br-sm" 
                            : "bg-muted rounded-bl-sm"
                          }
                        `}>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="border-t p-4">
                <div className="flex gap-2 w-full">
                  <Input 
                    placeholder="Type your message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    data-testid="input-chat-message"
                  />
                  <Button onClick={handleSendMessage} data-testid="button-send-chat">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        );

      case "profile":
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Enhanced Header */}
            <div className="relative rounded-2xl bg-gradient-to-r from-slate-600 via-slate-500 to-zinc-500 p-6 text-white shadow-lg">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-50 rounded-2xl" />
              <div className="relative flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold" data-testid="text-profile-title">My Profile</h2>
                  <p className="text-white/80">Manage your personal information</p>
                </div>
              </div>
            </div>

            <Card className="border-0 shadow-md" data-testid="card-profile">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      {patientName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold" data-testid="text-profile-name">{patientName}</h3>
                    <p className="text-muted-foreground">Patient ID: GH-2024-001</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input 
                      value={profileForm.fullName} 
                      onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})}
                      data-testid="input-profile-name" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      type="email" 
                      value={profileForm.email} 
                      onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                      data-testid="input-profile-email" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input 
                      value={profileForm.phone} 
                      onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                      data-testid="input-profile-phone" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input 
                      type="date" 
                      value={profileForm.dateOfBirth} 
                      onChange={(e) => setProfileForm({...profileForm, dateOfBirth: e.target.value})}
                      data-testid="input-profile-dob" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Blood Type</Label>
                    <Select 
                      value={profileForm.bloodType} 
                      onValueChange={(value) => setProfileForm({...profileForm, bloodType: value})}
                    >
                      <SelectTrigger data-testid="select-blood-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a_positive">A+</SelectItem>
                        <SelectItem value="a_negative">A-</SelectItem>
                        <SelectItem value="b_positive">B+</SelectItem>
                        <SelectItem value="b_negative">B-</SelectItem>
                        <SelectItem value="ab_positive">AB+</SelectItem>
                        <SelectItem value="ab_negative">AB-</SelectItem>
                        <SelectItem value="o_positive">O+</SelectItem>
                        <SelectItem value="o_negative">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select 
                      value={profileForm.gender} 
                      onValueChange={(value) => setProfileForm({...profileForm, gender: value})}
                    >
                      <SelectTrigger data-testid="select-gender">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-4">Emergency Contact</h4>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input 
                        value={profileForm.emergencyContactName} 
                        onChange={(e) => setProfileForm({...profileForm, emergencyContactName: e.target.value})}
                        data-testid="input-emergency-name" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Relation</Label>
                      <Input 
                        value={profileForm.emergencyContactRelation} 
                        onChange={(e) => setProfileForm({...profileForm, emergencyContactRelation: e.target.value})}
                        data-testid="input-emergency-relation" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input 
                        value={profileForm.emergencyContactPhone} 
                        onChange={(e) => setProfileForm({...profileForm, emergencyContactPhone: e.target.value})}
                        data-testid="input-emergency-phone" 
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-4">Medical Information</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Known Allergies</Label>
                      <Textarea 
                        placeholder="List any known allergies..."
                        value={profileForm.allergies}
                        onChange={(e) => setProfileForm({...profileForm, allergies: e.target.value})}
                        data-testid="input-allergies"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Chronic Conditions</Label>
                      <Textarea 
                        placeholder="List any chronic conditions..."
                        value={profileForm.chronicConditions}
                        onChange={(e) => setProfileForm({...profileForm, chronicConditions: e.target.value})}
                        data-testid="input-conditions"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={() => saveProfileMutation.mutate(profileForm)}
                  disabled={saveProfileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {saveProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        );

      case "health-guide":
        return (
          <div className="space-y-6">
            {/* Enhanced Header */}
            <div className="relative rounded-2xl bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 p-6 text-white shadow-lg">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-50 rounded-2xl" />
              <div className="relative flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold" data-testid="text-health-guide-title">Health Guide</h2>
                  <p className="text-white/80">Learn about diseases, diet plans, and medication timing guidance</p>
                </div>
              </div>
            </div>

            <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Disclaimer:</strong> This information is for educational purposes only and should not be considered medical advice. 
                    Always consult your doctor before making any changes to your diet or medication. Medication schedules shown are 
                    timing guidance only, NOT prescriptions.
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search diseases..."
                  value={diseaseSearchQuery}
                  onChange={(e) => setDiseaseSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-disease-search"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-disease-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="metabolic">Metabolic</SelectItem>
                  <SelectItem value="cardiovascular">Cardiovascular</SelectItem>
                  <SelectItem value="respiratory">Respiratory</SelectItem>
                  <SelectItem value="infectious">Infectious</SelectItem>
                  <SelectItem value="neuro">Neurological</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {diseasesLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-16 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredDiseases.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Diseases Found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or category filter.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDiseases.map((disease: any) => (
                  <Card 
                    key={disease.id} 
                    className="hover-elevate cursor-pointer"
                    onClick={() => setSelectedDisease(disease)}
                    data-testid={`card-disease-${disease.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-lg">{disease.diseaseName}</CardTitle>
                          {disease.alternateNames && (
                            <CardDescription className="text-xs">{disease.alternateNames}</CardDescription>
                          )}
                        </div>
                        <Badge variant="outline" className="capitalize text-xs">
                          {disease.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {disease.shortDescription}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-primary">
                        <span>Learn more</span>
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Dialog open={!!selectedDisease} onOpenChange={(open) => !open && setSelectedDisease(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                {selectedDisease && (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-xl">{selectedDisease.diseaseName}</DialogTitle>
                      <DialogDescription>
                        {selectedDisease.alternateNames && <span className="italic">{selectedDisease.alternateNames}</span>}
                        <Badge variant="outline" className="ml-2 capitalize">{selectedDisease.category}</Badge>
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-4">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Info className="h-4 w-4 text-blue-500" />
                          About
                        </h4>
                        <p className="text-sm text-muted-foreground">{selectedDisease.shortDescription}</p>
                      </div>

                      <Separator />

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-2 text-green-600 dark:text-green-400">Do's</h4>
                          <ul className="space-y-1">
                            {(() => {
                              try {
                                const dosList = JSON.parse(selectedDisease.dosList || '[]');
                                return dosList.map((item: string, idx: number) => (
                                  <li key={idx} className="text-sm flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>{item}</span>
                                  </li>
                                ));
                              } catch { return <li className="text-sm text-muted-foreground">No recommendations available</li>; }
                            })()}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2 text-red-600 dark:text-red-400">Don'ts</h4>
                          <ul className="space-y-1">
                            {(() => {
                              try {
                                const dontsList = JSON.parse(selectedDisease.dontsList || '[]');
                                return dontsList.map((item: string, idx: number) => (
                                  <li key={idx} className="text-sm flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                    <span>{item}</span>
                                  </li>
                                ));
                              } catch { return <li className="text-sm text-muted-foreground">No recommendations available</li>; }
                            })()}
                          </ul>
                        </div>
                      </div>

                      <Separator />

                      {getDietForDisease(selectedDisease.id) && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Utensils className="h-4 w-4 text-orange-500" />
                            Diet Plan
                          </h4>
                          {(() => {
                            const diet = getDietForDisease(selectedDisease.id);
                            if (!diet) return null;
                            try {
                              const mealPlan = typeof diet.mealPlan === 'string' ? JSON.parse(diet.mealPlan) : diet.mealPlan;
                              return (
                                <div className="space-y-4">
                                  <div className="grid gap-2">
                                    {Object.entries(mealPlan).map(([time, meal]: [string, any]) => (
                                      <div key={time} className="flex items-start gap-3 p-2 bg-muted/50 rounded-lg">
                                        <div className="w-28 font-medium text-sm capitalize">
                                          {time.replace(/_/g, ' ')}:
                                        </div>
                                        <div className="text-sm text-muted-foreground flex-1">{meal}</div>
                                      </div>
                                    ))}
                                  </div>
                                  {diet.foodsToAvoid && (
                                    <div>
                                      <h5 className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Foods to Avoid:</h5>
                                      <p className="text-sm text-muted-foreground">
                                        {(() => {
                                          try {
                                            return JSON.parse(diet.foodsToAvoid).join(', ');
                                          } catch { return diet.foodsToAvoid; }
                                        })()}
                                      </p>
                                    </div>
                                  )}
                                  {diet.hydrationGuidance && (
                                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                                      <Leaf className="h-4 w-4" />
                                      <span>Hydration: {diet.hydrationGuidance}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            } catch { return <p className="text-sm text-muted-foreground">Diet information not available</p>; }
                          })()}
                        </div>
                      )}

                      {getMedicationForDisease(selectedDisease.id) && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Pill className="h-4 w-4 text-purple-500" />
                              Medication Timing Guidance
                            </h4>
                            {(() => {
                              const med = getMedicationForDisease(selectedDisease.id);
                              if (!med) return null;
                              return (
                                <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                                  <CardContent className="p-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Category:</span>
                                        <span className="ml-2 font-medium">{med.medicineCategory}</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Typical Timing:</span>
                                        <span className="ml-2 font-medium">{med.typicalTiming}</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Before/After Food:</span>
                                        <span className="ml-2 font-medium capitalize">{med.beforeAfterFood}</span>
                                      </div>
                                    </div>
                                    {med.missedDoseInstructions && (
                                      <div className="text-sm">
                                        <span className="text-muted-foreground">If dose is missed:</span>
                                        <span className="ml-2">{med.missedDoseInstructions}</span>
                                      </div>
                                    )}
                                    {med.generalNotes && (
                                      <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-2">
                                        {med.generalNotes}
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })()}
                          </div>
                        </>
                      )}

                      {selectedDisease.emergencySigns && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-semibold mb-2 text-red-600 dark:text-red-400 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              Emergency Signs - Seek Immediate Help
                            </h4>
                            <ul className="grid md:grid-cols-2 gap-2">
                              {(() => {
                                try {
                                  return JSON.parse(selectedDisease.emergencySigns).map((sign: string, idx: number) => (
                                    <li key={idx} className="text-sm flex items-center gap-2 text-red-700 dark:text-red-300">
                                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                      {sign}
                                    </li>
                                  ));
                                } catch { return null; }
                              })()}
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full overflow-hidden">
        <PatientSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="h-14 sm:h-16 border-b bg-card px-3 sm:px-4 flex items-center justify-between gap-2 lg:px-6 shrink-0">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-semibold truncate" data-testid="text-page-title">
                  {navigationItems.find(n => n.id === activeSection)?.label || "Dashboard"}
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Gravity Hospital, Nigdi
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Button 
                size="icon" 
                variant="ghost"
                onClick={() => setActiveSection("notifications")}
                className="relative h-9 w-9"
                data-testid="button-header-notifications"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
                )}
              </Button>
              <ThemeToggle />
            </div>
          </header>

          <ScrollArea className="flex-1">
            <main className="p-3 sm:p-4 lg:p-6 space-y-4">
              {renderContent()}
            </main>
          </ScrollArea>
        </div>
      </div>
    </SidebarProvider>
  );
}
