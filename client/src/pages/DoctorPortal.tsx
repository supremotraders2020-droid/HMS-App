import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import PatientMonitoringPage from "./PatientMonitoringPage";
import IcuMonitoringPage from "./IcuMonitoringPage";
import StaffSelfService from "@/components/StaffSelfService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { IntegerInput, NumericInput } from "@/components/validated-inputs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { format, getDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import type { DoctorPatient, Prescription, DoctorSchedule, Appointment, DoctorProfile, UserNotification, MedicalRecord, ServicePatient } from "@shared/schema";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  LayoutDashboard,
  Calendar as CalendarIcon,
  Users,
  FileText,
  Bell,
  Settings,
  LogOut,
  Search,
  Plus,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Stethoscope,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  User,
  Heart,
  Pill,
  ClipboardList,
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  Hospital,
  Camera,
  Loader2,
  ArrowLeft,
  ExternalLink,
  MonitorCheck,
  Save,
  Home,
  UserCheck,
  Scissors,
  Download
} from "lucide-react";
import HospitalServices from "@/pages/HospitalServices";
import hospitalLogo from "@assets/LOGO_1_1765346562770.png";
import DoctorOathModal from "@/components/DoctorOathModal";
import PrescriptionCreationModal from "@/components/PrescriptionCreationModal";

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

interface DoctorPortalProps {
  doctorName: string;
  hospitalName: string;
  doctorId?: string;
  onLogout: () => void;
}

const BLOOD_GROUP_COLORS: Record<string, string> = {
  "A+": "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  "A-": "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  "B+": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "B-": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "O+": "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  "O-": "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  "AB+": "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  "AB-": "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

export default function DoctorPortal({ doctorName, hospitalName, doctorId = "doc-1", onLogout }: DoctorPortalProps) {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<{
    id: string;
    patientName: string;
    patientPhone: string;
    patientEmail: string;
    patientAge: string;
    patientGender: string;
    bloodGroup: string;
    patientAddress: string;
    lastVisit: string;
    medicalRecords?: MedicalRecord[];
  } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [oathAccepted, setOathAccepted] = useState(false);
  
  const todayDate = format(new Date(), "yyyy-MM-dd");
  
  const { data: oathStatus, isLoading: oathLoading } = useQuery<{ accepted: boolean }>({
    queryKey: ['/api/doctor-oath', doctorId, todayDate],
    enabled: !!doctorId,
  });
  
  // Fetch all doctors to find matching doctor ID for notifications
  const { data: allDoctors = [] } = useQuery<{ id: string; name: string; specialty: string }[]>({
    queryKey: ['/api/doctors'],
  });
  
  // Find the doctor's ID from the doctors table - check multiple ways:
  // 1. Check if doctorId directly matches a doctor ID
  // 2. Try to match by name
  // 3. Fall back to first doctor for demo purposes
  const matchedDoctor = allDoctors.find(d => d.id === doctorId) ||
    allDoctors.find(d => 
      d.name.toLowerCase().includes(doctorName.toLowerCase()) || 
      doctorName.toLowerCase().includes(d.name.replace('Dr. ', '').toLowerCase())
    ) ||
    allDoctors[0]; // Fallback to first doctor for demo
  const effectiveDoctorId = matchedDoctor?.id || doctorId;
  
  // Fetch doctor mappings from time slots to find the correct user ID for notifications
  const { data: doctorMappingsForNotif = [] } = useQuery<{ doctorId: string; doctorName: string }[]>({
    queryKey: ['/api/time-slots/doctor-mappings'],
  });
  
  // Find the correct user ID for notifications by matching doctor name with time slot mappings
  // Time slot doctorId is the actual user ID used for notifications
  const currentDoctorNameForMatch = matchedDoctor?.name?.toLowerCase() || doctorName.toLowerCase();
  const matchedTimeSlotMapping = doctorMappingsForNotif.find(m => {
    const mappingName = m.doctorName?.toLowerCase() || '';
    const normalizedCurrent = currentDoctorNameForMatch.replace('dr. ', '').trim();
    const normalizedMapping = mappingName.replace('dr. ', '').trim();
    return normalizedMapping.includes(normalizedCurrent) || normalizedCurrent.includes(normalizedMapping);
  });
  // Use time slot doctorId (which is user ID) for notifications, fall back to original doctorId
  const notificationUserId = matchedTimeSlotMapping?.doctorId || doctorId;
  
  // Real-time database notifications with WebSocket support
  const { 
    notifications, 
    unreadNotifications, 
    unreadCount: unreadNotificationCount, 
    isLoading: notificationsLoading,
    markAsRead: markNotificationRead,
    markAllAsRead: markAllNotificationsRead,
    deleteNotification
  } = useNotifications({ userId: notificationUserId, userRole: "DOCTOR" });
  const [editingSchedule, setEditingSchedule] = useState<{day: string; slots: DoctorSchedule[]} | null>(null);
  const [slotsToDelete, setSlotsToDelete] = useState<string[]>([]);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<UserNotification | null>(null);
  const [notificationDetailOpen, setNotificationDetailOpen] = useState(false);
  const [addPrescriptionDialogOpen, setAddPrescriptionDialogOpen] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [selectedPatientForRx, setSelectedPatientForRx] = useState<string>("");
  const [selectedPatientRecordId, setSelectedPatientRecordId] = useState<string>("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [addScheduleDialogOpen, setAddScheduleDialogOpen] = useState(false);
  const [addAppointmentDialogOpen, setAddAppointmentDialogOpen] = useState(false);
  const [appointmentDetailsOpen, setAppointmentDetailsOpen] = useState(false);
  const [viewPrescriptionDialogOpen, setViewPrescriptionDialogOpen] = useState(false);
  const [editPrescriptionDialogOpen, setEditPrescriptionDialogOpen] = useState(false);
  const [viewPatientDialogOpen, setViewPatientDialogOpen] = useState(false);
  const [editPatientDialogOpen, setEditPatientDialogOpen] = useState(false);
  const [viewRecordDialogOpen, setViewRecordDialogOpen] = useState(false);
  const [selectedViewRecord, setSelectedViewRecord] = useState<MedicalRecord | null>(null);
  const [editingPrescription, setEditingPrescription] = useState<{diagnosis: string; medicines: string[]; instructions: string}>({diagnosis: "", medicines: [], instructions: ""});
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(undefined);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [calendarSlotSheetOpen, setCalendarSlotSheetOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: `Dr. ${doctorName}`,
    specialty: "",
    email: `${doctorName.toLowerCase().replace(' ', '.')}@gravityhospital.com`,
    phone: "+91 98765 00000",
    qualifications: "MBBS, MD",
    experience: "5+ Years",
    bio: "",
    department: "",
    languages: "English, Hindi, Marathi",
    consultationFee: "₹500"
  });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Template Management State
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: 'general',
    symptoms: [] as string[],
    medicines: [] as any[],
    instructions: '',
    suggestedTests: [] as string[],
    followUpDays: 7,
    dietAdvice: '',
    activityAdvice: '',
    isPublic: true
  });
  const [symptomInput, setSymptomInput] = useState('');
  const [testInput, setTestInput] = useState('');
  const [medicineInput, setMedicineInput] = useState({
    medicineName: '',
    dosageForm: 'Tab',
    strength: '',
    frequency: '1',
    mealTiming: 'after_food',
    duration: 5,
    durationUnit: 'days'
  });

  // Fetch patients from API - default fetcher joins query keys as path segments
  const { data: patients = [], isLoading: patientsLoading } = useQuery<DoctorPatient[]>({
    queryKey: ['/api/doctor-patients', doctorId],
  });

  // Fetch prescriptions from API
  const { data: prescriptions = [], isLoading: prescriptionsLoading } = useQuery<Prescription[]>({
    queryKey: ['/api/prescriptions/doctor', doctorId],
  });

  // Fetch schedules from API
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery<DoctorSchedule[]>({
    queryKey: ['/api/doctor-schedules', doctorId],
  });

  // Fetch appointments from API
  const { data: allAppointments = [], isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
  });

  // Fetch doctor mappings from time slots (maps time slot doctorId to doctorName)
  const { data: doctorMappings = [] } = useQuery<{ doctorId: string; doctorName: string }[]>({
    queryKey: ['/api/time-slots/doctor-mappings'],
  });

  // Fetch doctor profile from API
  const { data: profileData, isLoading: profileLoading } = useQuery<DoctorProfile>({
    queryKey: ['/api/doctor-profiles', doctorId],
    retry: false,
  });

  // Fetch all medical records to show patient files in prescription form
  const { data: allMedicalRecords = [] } = useQuery<MedicalRecord[]>({
    queryKey: ['/api/medical-records'],
  });

  // Fetch medical records assigned to this doctor
  const { data: doctorMedicalRecords = [], isLoading: doctorRecordsLoading } = useQuery<MedicalRecord[]>({
    queryKey: ['/api/doctors', doctorId, 'medical-records'],
  });

  // Fetch diagnostic reports for this doctor (tests ordered by this doctor)
  const { data: diagnosticReports = [], isLoading: diagnosticReportsLoading } = useQuery<any[]>({
    queryKey: ['/api/doctors', doctorId, 'diagnostic-reports'],
    refetchInterval: 3000, // Real-time sync
  });

  // Fetch service patients to display in Patient Records section
  const { data: servicePatients = [] } = useQuery<ServicePatient[]>({
    queryKey: ['/api/patients/service'],
  });

  // Fetch OPD templates for template management
  const { data: opdTemplates = [] } = useQuery<any[]>({
    queryKey: ['/api/opd-templates']
  });

  // Sync profile form with API data when it loads
  useEffect(() => {
    const specialty = matchedDoctor?.specialty || "Specialist";
    if (profileData) {
      setProfileForm({
        fullName: profileData.fullName || `Dr. ${doctorName}`,
        specialty: profileData.specialty || specialty,
        email: profileData.email || `${doctorName.toLowerCase().replace(' ', '.')}@gravityhospital.com`,
        phone: profileData.phone || "+91 98765 00000",
        qualifications: profileData.qualifications || "MBBS, MD",
        experience: profileData.experience || "5+ Years",
        bio: profileData.bio || "",
        department: profileData.department || `${specialty} Department`,
        languages: profileData.languages || "English, Hindi, Marathi",
        consultationFee: profileData.consultationFee || "₹500"
      });
    } else if (matchedDoctor) {
      setProfileForm(prev => ({
        ...prev,
        specialty: specialty,
        department: `${specialty} Department`
      }));
    }
  }, [profileData, doctorName, matchedDoctor]);

  // Mutations for CRUD operations
  const createPrescriptionMutation = useMutation({
    mutationFn: (prescription: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiRequest('POST', '/api/prescriptions', prescription),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions/doctor', doctorId] });
      toast({ title: "Prescription created successfully" });
      setAddPrescriptionDialogOpen(false);
      setPatientSearchQuery("");
      setSelectedPatientForRx("");
      setShowPatientDropdown(false);
    },
    onError: () => toast({ title: "Failed to create prescription", variant: "destructive" }),
  });

  const updatePrescriptionMutation = useMutation({
    mutationFn: (data: { id: string; prescription: Partial<Prescription> }) =>
      apiRequest('PATCH', `/api/prescriptions/${data.id}`, data.prescription),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions/doctor', doctorId] });
      toast({ title: "Prescription updated successfully" });
      setEditPrescriptionDialogOpen(false);
      setSelectedPrescription(null);
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: (schedule: Omit<DoctorSchedule, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiRequest('POST', '/api/doctor-schedules', schedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doctor-schedules', doctorId] });
      toast({ title: "Schedule added successfully" });
      setAddScheduleDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to add schedule", variant: "destructive" }),
  });

  const deletePatientMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/doctor-patients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doctor-patients', doctorId] });
      toast({ title: "Patient removed successfully" });
    },
    onError: () => toast({ title: "Failed to remove patient", variant: "destructive" }),
  });

  const deletePrescriptionMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/prescriptions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions/doctor', doctorId] });
      toast({ title: "Prescription deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete prescription", variant: "destructive" }),
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/doctor-schedules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doctor-schedules', doctorId] });
      toast({ title: "Schedule deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete schedule", variant: "destructive" }),
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, updates, showToast = false }: { id: string; updates: Partial<DoctorSchedule>; showToast?: boolean }) =>
      apiRequest('PATCH', `/api/doctor-schedules/${id}`, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/doctor-schedules', doctorId] });
      if (variables.showToast) {
        toast({ title: "Schedule updated successfully" });
      }
    },
    onError: () => toast({ title: "Failed to update schedule", variant: "destructive" }),
  });

  const createAppointmentMutation = useMutation({
    mutationFn: (appointment: { patientName: string; patientPhone: string; patientEmail?: string; doctorId: string; appointmentDate: string; timeSlot: string; symptoms?: string; status: string }) =>
      apiRequest('POST', '/api/appointments', appointment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({ title: "Appointment created successfully" });
      setAddAppointmentDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to create appointment", variant: "destructive" }),
  });

  const confirmAppointmentMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest('PATCH', `/api/appointments/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({ title: "Appointment confirmed", description: "The patient has been notified" });
    },
    onError: () => toast({ title: "Failed to confirm appointment", variant: "destructive" }),
  });

  const completeAppointmentMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest('PATCH', `/api/appointments/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({ title: "Appointment completed successfully" });
    },
    onError: () => toast({ title: "Failed to complete appointment", variant: "destructive" }),
  });

  const cancelAppointmentMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest('PATCH', `/api/appointments/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({ title: "Appointment cancelled" });
    },
    onError: () => toast({ title: "Failed to cancel appointment", variant: "destructive" }),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (updates: Partial<typeof profileForm>) =>
      apiRequest('PATCH', `/api/doctor-profiles/${doctorId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doctor-profiles', doctorId] });
      queryClient.invalidateQueries({ queryKey: ['/api/doctors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/by-username'] });
      toast({ title: "Profile updated successfully" });
    },
    onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
  });

  // Template mutations
  const createTemplateMutation = useMutation({
    mutationFn: async (template: any) => {
      const res = await apiRequest('POST', '/api/opd-templates', template);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/opd-templates'] });
      setTemplateDialogOpen(false);
      resetTemplateForm();
      toast({ title: 'Template created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create template', variant: 'destructive' });
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, template }: { id: string; template: any }) => {
      const res = await apiRequest('PATCH', `/api/opd-templates/${id}`, template);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/opd-templates'] });
      setTemplateDialogOpen(false);
      setEditingTemplate(null);
      resetTemplateForm();
      toast({ title: 'Template updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update template', variant: 'destructive' });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/opd-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/opd-templates'] });
      toast({ title: 'Template deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete template', variant: 'destructive' });
    }
  });

  // Template helper functions
  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      category: 'general',
      symptoms: [],
      medicines: [],
      instructions: '',
      suggestedTests: [],
      followUpDays: 7,
      dietAdvice: '',
      activityAdvice: '',
      isPublic: true
    });
    setSymptomInput('');
    setTestInput('');
    setMedicineInput({
      medicineName: '',
      dosageForm: 'Tab',
      strength: '',
      frequency: '1',
      mealTiming: 'after_food',
      duration: 5,
      durationUnit: 'days'
    });
  };

  const handleSaveTemplate = () => {
    if (!templateForm.name.trim()) {
      toast({ title: 'Please enter a template name', variant: 'destructive' });
      return;
    }
    const templateData = {
      ...templateForm,
      slug: templateForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    };

    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, template: templateData });
    } else {
      createTemplateMutation.mutate(templateData);
    }
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    const safeParseArray = (val: any) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return []; }
      }
      return [];
    };
    setTemplateForm({
      name: template.name || '',
      category: template.category || 'general',
      symptoms: safeParseArray(template.symptoms),
      medicines: safeParseArray(template.medicines),
      instructions: template.instructions || '',
      suggestedTests: safeParseArray(template.suggestedTests),
      followUpDays: template.followUpDays || 7,
      dietAdvice: template.dietAdvice || '',
      activityAdvice: template.activityAdvice || '',
      isPublic: template.isPublic ?? true
    });
    setTemplateDialogOpen(true);
  };

  const addSymptom = () => {
    if (symptomInput.trim() && !templateForm.symptoms.includes(symptomInput.trim())) {
      setTemplateForm(prev => ({ ...prev, symptoms: [...prev.symptoms, symptomInput.trim()] }));
      setSymptomInput('');
    }
  };

  const removeSymptom = (symptom: string) => {
    setTemplateForm(prev => ({ ...prev, symptoms: prev.symptoms.filter(s => s !== symptom) }));
  };

  const addTest = () => {
    if (testInput.trim() && !templateForm.suggestedTests.includes(testInput.trim())) {
      setTemplateForm(prev => ({ ...prev, suggestedTests: [...prev.suggestedTests, testInput.trim()] }));
      setTestInput('');
    }
  };

  const removeTest = (test: string) => {
    setTemplateForm(prev => ({ ...prev, suggestedTests: prev.suggestedTests.filter(t => t !== test) }));
  };

  const addMedicine = () => {
    if (medicineInput.medicineName.trim()) {
      setTemplateForm(prev => ({ ...prev, medicines: [...prev.medicines, { ...medicineInput }] }));
      setMedicineInput({
        medicineName: '',
        dosageForm: 'Tab',
        strength: '',
        frequency: '1',
        mealTiming: 'after_food',
        duration: 5,
        durationUnit: 'days'
      });
    }
  };

  const removeMedicine = (idx: number) => {
    setTemplateForm(prev => ({ ...prev, medicines: prev.medicines.filter((_, i) => i !== idx) }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const response = await fetch(`/api/doctor-profiles/${doctorId}/photo`, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!response.ok) throw new Error('Upload failed');
      queryClient.invalidateQueries({ queryKey: ['/api/doctor-profiles', doctorId] });
      toast({ title: "Photo uploaded successfully" });
    } catch {
      toast({ title: "Failed to upload photo", variant: "destructive" });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    setIsDeletingPhoto(true);
    try {
      const response = await fetch(`/api/doctor-profiles/${doctorId}/photo`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Delete failed');
      queryClient.invalidateQueries({ queryKey: ['/api/doctor-profiles', doctorId] });
      toast({ title: "Photo deleted successfully" });
    } catch {
      toast({ title: "Failed to delete photo", variant: "destructive" });
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileForm);
  };

  const today = new Date().toISOString().split('T')[0];
  // Filter appointments by doctorId, doctor name, OR by department matching doctor's specialty
  const doctorSpecialty = matchedDoctor?.specialty?.toLowerCase() || '';
  const currentDoctorName = matchedDoctor?.name?.toLowerCase() || doctorName.toLowerCase();
  
  // Get all time slot doctor IDs that belong to this doctor (by name matching)
  const doctorTimeSlotIds = new Set<string>();
  doctorMappings.forEach((mapping) => {
    const mappingDoctorName = mapping.doctorName?.toLowerCase() || '';
    const normalizedCurrentName = currentDoctorName.replace('dr. ', '').trim();
    const normalizedMappingName = mappingDoctorName.replace('dr. ', '').trim();
    if (normalizedMappingName.includes(normalizedCurrentName) || 
        normalizedCurrentName.includes(normalizedMappingName) ||
        normalizedMappingName === normalizedCurrentName) {
      doctorTimeSlotIds.add(mapping.doctorId);
    }
  });
  
  const doctorAppointments = allAppointments.filter(a => {
    // Match by effectiveDoctorId (doctors table)
    if (a.doctorId && a.doctorId === effectiveDoctorId) return true;
    // Match by time slot's doctorId (for appointments booked via OPD)
    if (a.doctorId && doctorTimeSlotIds.has(a.doctorId)) return true;
    // Match by department if doctorId is not set (legacy appointments)
    if (!a.doctorId && a.department?.toLowerCase() === doctorSpecialty) return true;
    return false;
  });
  const todayAppointments = doctorAppointments.filter(a => a.appointmentDate === today);
  const pendingAppointments = doctorAppointments.filter(a => a.status === "pending" || a.status === "scheduled");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"><CheckCircle className="h-3 w-3 mr-1" />Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return null;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment": return <CalendarIcon className="h-4 w-4 text-blue-500" />;
      case "patient": return <User className="h-4 w-4 text-green-500" />;
      case "prescription": return <Pill className="h-4 w-4 text-orange-500" />;
      case "schedule": return <CalendarDays className="h-4 w-4 text-purple-500" />;
      case "profile": return <User className="h-4 w-4 text-indigo-500" />;
      case "admission": return <Hospital className="h-4 w-4 text-teal-500" />;
      case "system": return <Settings className="h-4 w-4 text-purple-500" />;
      case "report": return <FileText className="h-4 w-4 text-amber-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationIconLarge = (type: string) => {
    switch (type) {
      case "appointment": return <CalendarIcon className="h-6 w-6 text-blue-500" />;
      case "patient": return <User className="h-6 w-6 text-green-500" />;
      case "prescription": return <Pill className="h-6 w-6 text-orange-500" />;
      case "schedule": return <CalendarDays className="h-6 w-6 text-purple-500" />;
      case "profile": return <User className="h-6 w-6 text-indigo-500" />;
      case "admission": return <Hospital className="h-6 w-6 text-teal-500" />;
      case "system": return <Settings className="h-6 w-6 text-purple-500" />;
      case "report": return <FileText className="h-6 w-6 text-amber-500" />;
      default: return <Bell className="h-6 w-6" />;
    }
  };

  const openNotificationDetail = (notif: UserNotification) => {
    const updatedNotif = { ...notif, isRead: true };
    setSelectedNotification(updatedNotif);
    setNotificationDetailOpen(true);
    if (!notif.isRead) {
      markNotificationRead(notif.id);
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "appointment": return "Appointment";
      case "patient": return "Patient";
      case "prescription": return "Prescription";
      case "schedule": return "Schedule Change";
      case "profile": return "Profile Update";
      case "admission": return "Admission";
      case "system": return "System Update";
      case "report": return "Report";
      default: return "Notification";
    }
  };

  const parseMetadata = (metadata: string | null): Record<string, unknown> => {
    if (!metadata) return {};
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  };

  // Derive patients from medical records assigned to this doctor
  const patientsFromRecords = (() => {
    // Get medical records where physician matches this doctor
    const doctorRecords = allMedicalRecords.filter(record => {
      const physicianName = record.physician?.toLowerCase().replace(/^dr\.?\s*/i, '').trim() || '';
      const docName = doctorName.toLowerCase().replace(/^dr\.?\s*/i, '').trim();
      return physicianName.includes(docName) || docName.includes(physicianName) ||
             physicianName.split(' ')[0] === docName.split(' ')[0];
    });
    
    // Map to unique patients from service_patients
    const patientMap = new Map<string, {
      id: string;
      patientName: string;
      patientPhone: string;
      patientEmail: string;
      patientAge: string;
      patientGender: string;
      bloodGroup: string;
      patientAddress: string;
      lastVisit: string;
      medicalRecords: MedicalRecord[];
    }>();
    
    doctorRecords.forEach(record => {
      const servicePatient = servicePatients.find(sp => sp.id === record.patientId);
      if (servicePatient && !patientMap.has(servicePatient.id)) {
        patientMap.set(servicePatient.id, {
          id: servicePatient.id,
          patientName: `${servicePatient.firstName} ${servicePatient.lastName}`,
          patientPhone: servicePatient.phone || 'N/A',
          patientEmail: servicePatient.email || 'N/A',
          patientAge: servicePatient.dateOfBirth ? String(new Date().getFullYear() - new Date(servicePatient.dateOfBirth).getFullYear()) : 'N/A',
          patientGender: servicePatient.gender || 'O',
          bloodGroup: '',
          patientAddress: servicePatient.address || 'N/A',
          lastVisit: record.recordDate ? format(new Date(record.recordDate), 'MMM dd, yyyy') : 'N/A',
          medicalRecords: doctorRecords.filter(r => r.patientId === servicePatient.id)
        });
      }
    });
    
    return Array.from(patientMap.values());
  })();

  const filteredPatients = patientsFromRecords.filter(p => 
    p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.patientPhone && p.patientPhone.includes(searchQuery)) ||
    (p.patientEmail && p.patientEmail.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Derive unique patients from appointments booked with this doctor
  const appointmentPatients = (() => {
    const patientMap = new Map<string, {name: string; phone: string; id?: string}>();
    doctorAppointments.forEach(apt => {
      const key = apt.patientName.toLowerCase().trim();
      if (!patientMap.has(key)) {
        patientMap.set(key, {
          name: apt.patientName,
          phone: apt.patientPhone || "",
          id: apt.patientId || undefined
        });
      }
    });
    return Array.from(patientMap.values());
  })();

  const getDayNameFromDate = (date: Date): string => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[getDay(date)];
  };

  const handleCalendarDateClick = (date: Date | undefined) => {
    if (date) {
      setSelectedCalendarDate(date);
      setCalendarSlotSheetOpen(true);
    } else if (selectedCalendarDate) {
      // If clicking the same date (deselect), reopen the sheet
      setCalendarSlotSheetOpen(true);
    }
  };

  const getSchedulesForDate = (date: Date | undefined): DoctorSchedule[] => {
    if (!date) return [];
    const dateStr = format(date, 'yyyy-MM-dd');
    return schedules.filter(s => s.specificDate === dateStr);
  };

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const menuItems = [
    { id: "dashboard", title: "Dashboard", icon: LayoutDashboard },
    { id: "appointments", title: "Appointments", icon: CalendarIcon },
    { id: "schedules", title: "Schedules", icon: CalendarDays },
    { id: "patients", title: "Patients", icon: Users },
    { id: "prescriptions", title: "Prescriptions", icon: FileText },
    { id: "medical-records", title: "Medical Records", icon: ClipboardList },
    { id: "diagnostic-reports", title: "Diagnostic Reports", icon: Activity },
    { id: "templates", title: "Rx Templates", icon: ClipboardList },
    { id: "patient-monitoring", title: "Patient Monitoring", icon: MonitorCheck },
    { id: "icu-monitoring", title: "ICU Monitoring", icon: Heart },
    { id: "hospital-services", title: "Services & Surgeries", icon: Scissors },
    { id: "staff-management", title: "Staff Management", icon: UserCheck },
    { id: "notifications", title: "Notifications", icon: Bell, badge: unreadNotifications.length },
    { id: "profile", title: "Profile", icon: Settings },
  ];

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header with gradient accent */}
      <div className="relative rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border border-primary/10">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="text-welcome">
            Welcome back, <span className="text-primary">Dr. {doctorName}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Here's your clinical overview for today</p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent" />
        <Stethoscope className="absolute right-6 top-1/2 -translate-y-1/2 h-20 w-20 text-primary/10" />
      </div>

      {/* Enhanced Stat Cards Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Today's Appointments Card */}
        <Card className="group relative border-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent hover-elevate transition-all duration-300" data-testid="stat-today-appointments">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Appointments</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <CalendarIcon className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-today-count">{todayAppointments.length}</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                <TrendingUp className="h-3 w-3" />
                <span>+2</span>
              </div>
              <span className="text-muted-foreground">from yesterday</span>
            </div>
          </CardContent>
        </Card>

        {/* Pending Appointments Card */}
        <Card className="group relative border-0 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent hover-elevate transition-all duration-300" data-testid="stat-pending">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl md:text-4xl font-bold text-amber-600 dark:text-amber-400" data-testid="text-pending-count">{pendingAppointments.length}</div>
            <p className="text-xs text-muted-foreground mt-2">Requires confirmation</p>
          </CardContent>
        </Card>

        {/* Total Patients Card */}
        <Card className="group relative border-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent hover-elevate transition-all duration-300" data-testid="stat-patients">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl md:text-4xl font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-patients-count">{patients.length}</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                <TrendingUp className="h-3 w-3" />
                <span>+12</span>
              </div>
              <span className="text-muted-foreground">this week</span>
            </div>
          </CardContent>
        </Card>

        {/* Prescriptions Card */}
        <Card className="group relative border-0 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent hover-elevate transition-all duration-300" data-testid="stat-prescriptions">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prescriptions</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FileText className="h-5 w-5 text-violet-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl md:text-4xl font-bold text-violet-600 dark:text-violet-400">{prescriptions.length}</div>
            <p className="text-xs text-muted-foreground mt-2">Written today</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid - Appointments & Notifications */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Today's Appointments - Takes more space */}
        <Card className="lg:col-span-3 border-0 shadow-lg shadow-black/5 dark:shadow-black/20" data-testid="card-today-schedule">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Today's Appointments</CardTitle>
                  <CardDescription className="text-xs">Your scheduled appointments for today</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {todayAppointments.length} scheduled
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ScrollArea className="h-[320px] pr-4">
              <div className="space-y-3">
                {todayAppointments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No appointments today</p>
                    <p className="text-xs mt-1">Your schedule is clear</p>
                  </div>
                ) : (
                  todayAppointments.slice(0, 6).map((apt, index) => (
                    <div 
                      key={apt.id} 
                      className="group flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-primary/20 cursor-pointer transition-all duration-200"
                      onClick={() => { setSelectedAppointment(apt); setActiveSection("appointments"); }}
                      data-testid={`appointment-item-${apt.id}`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                            {apt.patientName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold group-hover:text-primary transition-colors">{apt.patientName}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{apt.symptoms || "General consultation"}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5">
                        <p className="font-mono text-sm font-semibold bg-muted px-2.5 py-1 rounded-lg">{apt.timeSlot}</p>
                        {getStatusBadge(apt.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="outline" className="w-full group" onClick={() => setActiveSection("appointments")} data-testid="button-view-all-appointments">
              View All Appointments
              <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardFooter>
        </Card>

        {/* Recent Notifications - Compact sidebar */}
        <Card className="lg:col-span-2 border-0 shadow-lg shadow-black/5 dark:shadow-black/20" data-testid="card-notifications">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center relative">
                  <Bell className="h-5 w-5 text-primary" />
                  {unreadNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold animate-pulse">
                      {unreadNotifications.length}
                    </span>
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">Notifications</CardTitle>
                  <CardDescription className="text-xs">Latest updates and alerts</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ScrollArea className="h-[320px] pr-4">
              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No notifications</p>
                    <p className="text-xs mt-1">You're all caught up</p>
                  </div>
                ) : (
                  notifications.slice(0, 6).map((notif, index) => (
                    <div 
                      key={notif.id} 
                      className={`group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                        notif.isRead 
                          ? 'bg-muted/20 hover:bg-muted/40' 
                          : 'bg-primary/5 border border-primary/20 hover:bg-primary/10'
                      }`}
                      onClick={() => openNotificationDetail(notif)}
                      data-testid={`notification-item-${notif.id}`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="shrink-0 mt-0.5">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium line-clamp-1 ${!notif.isRead ? 'text-primary' : ''}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.message}</p>
                      </div>
                      {!notif.isRead && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5 animate-pulse" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="outline" className="w-full group" onClick={() => setActiveSection("notifications")} data-testid="button-view-all-notifications">
              View All Notifications
              <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );

  const renderPatients = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-patients-title">Patient Records</h1>
        <p className="text-muted-foreground">Manage your patient database</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search patients by name, phone, or email..." 
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-patients"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPatients.map((patient) => (
          <Card key={patient.id} className="hover-elevate" data-testid={`patient-card-${patient.id}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {patient.patientName.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg" data-testid={`patient-name-${patient.id}`}>{patient.patientName}</CardTitle>
                    <CardDescription>{patient.patientAge || 'N/A'} years, {patient.patientGender === "M" ? "Male" : patient.patientGender === "F" ? "Female" : "Other"}</CardDescription>
                  </div>
                </div>
                <Badge className={BLOOD_GROUP_COLORS[patient.bloodGroup || ""] || "bg-gray-100"}>
                  {patient.bloodGroup || "N/A"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{patient.patientPhone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{patient.patientEmail || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{patient.patientAddress || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Last visit: {patient.lastVisit}</span>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1" 
                onClick={() => { setSelectedPatient(patient); setViewPatientDialogOpen(true); }}
                data-testid={`button-view-patient-${patient.id}`}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1" 
                onClick={() => { setSelectedPatient(patient); setEditPatientDialogOpen(true); }}
                data-testid={`button-edit-patient-${patient.id}`}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No patients found matching your search</p>
        </div>
      )}
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-6">
      <div>
          <h1 className="text-2xl font-bold" data-testid="text-appointments-title">Appointments</h1>
          <p className="text-muted-foreground">Manage your appointment schedule</p>
        </div>

      <Tabs defaultValue="today">
        <TabsList data-testid="tabs-appointments">
          <TabsTrigger value="today" data-testid="tab-today">Today ({todayAppointments.length})</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">Pending ({pendingAppointments.length})</TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">All ({doctorAppointments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <div className="space-y-4">
            {todayAppointments.map((apt) => (
              <Card key={apt.id} className="hover-elevate" data-testid={`appointment-card-${apt.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold" data-testid={`apt-patient-${apt.id}`}>{apt.patientName}</h4>
                        <p className="text-sm text-muted-foreground">{apt.symptoms || "General checkup"}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">Consultation</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{apt.timeSlot}</p>
                      <p className="text-sm text-muted-foreground">{apt.appointmentDate}</p>
                      <div className="mt-1">{getStatusBadge(apt.status)}</div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="gap-2 border-t bg-muted/20">
                  {apt.status === "pending" && (
                    <Button size="sm" className="flex-1" onClick={() => confirmAppointmentMutation.mutate(apt.id)} disabled={confirmAppointmentMutation.isPending} data-testid={`button-confirm-${apt.id}`}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {confirmAppointmentMutation.isPending ? "..." : "Confirm"}
                    </Button>
                  )}
                  {apt.status === "confirmed" && (
                    <Button size="sm" className="flex-1" onClick={() => completeAppointmentMutation.mutate(apt.id)} disabled={completeAppointmentMutation.isPending} data-testid={`button-complete-${apt.id}`}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {completeAppointmentMutation.isPending ? "..." : "Complete"}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => { setSelectedAppointment(apt); setAppointmentDetailsOpen(true); }} data-testid={`button-view-apt-${apt.id}`}>
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setActiveSection("prescriptions"); setAddPrescriptionDialogOpen(true); }} data-testid={`button-prescribe-${apt.id}`}>
                    <FileText className="h-4 w-4 mr-1" />
                    Prescribe
                  </Button>
                  {apt.status !== "cancelled" && apt.status !== "completed" && (
                    <Button variant="destructive" size="sm" onClick={() => cancelAppointmentMutation.mutate(apt.id)} disabled={cancelAppointmentMutation.isPending} data-testid={`button-cancel-${apt.id}`}>
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <div className="space-y-4">
            {pendingAppointments.map((apt) => (
              <Card key={apt.id} className="hover-elevate" data-testid={`pending-apt-${apt.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{apt.patientName}</h4>
                        <p className="text-sm text-muted-foreground">{apt.symptoms || "General checkup"}</p>
                        <Badge variant="outline" className="mt-1">Consultation</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{apt.appointmentDate} at {apt.timeSlot}</p>
                      {getStatusBadge(apt.status)}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="gap-2 border-t bg-muted/20">
                  <Button size="sm" className="flex-1" onClick={() => confirmAppointmentMutation.mutate(apt.id)} disabled={confirmAppointmentMutation.isPending}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {confirmAppointmentMutation.isPending ? "..." : "Confirm"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setSelectedAppointment(apt); setAppointmentDetailsOpen(true); }}>
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setActiveSection("prescriptions"); setAddPrescriptionDialogOpen(true); }}>
                    <FileText className="h-4 w-4 mr-1" />
                    Prescribe
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => cancelAppointmentMutation.mutate(apt.id)} disabled={cancelAppointmentMutation.isPending}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <div className="space-y-4">
            {doctorAppointments.map((apt) => (
              <Card key={apt.id} className="hover-elevate" data-testid={`all-apt-${apt.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{apt.patientName}</h4>
                        <p className="text-sm text-muted-foreground">{apt.symptoms || "General checkup"}</p>
                        <Badge variant="outline" className="mt-1">Consultation</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{apt.appointmentDate}</p>
                      <p className="text-sm text-muted-foreground">{apt.timeSlot}</p>
                      <div className="mt-1">{getStatusBadge(apt.status)}</div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="gap-2 border-t bg-muted/20">
                  <Button variant="outline" size="sm" onClick={() => { setSelectedAppointment(apt); setAppointmentDetailsOpen(true); }}>
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setActiveSection("prescriptions"); setAddPrescriptionDialogOpen(true); }}>
                    <FileText className="h-4 w-4 mr-1" />
                    Prescribe
                  </Button>
                  {apt.status !== "cancelled" && apt.status !== "completed" && (
                    <Button variant="destructive" size="sm" onClick={() => cancelAppointmentMutation.mutate(apt.id)} disabled={cancelAppointmentMutation.isPending}>
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  const openScheduleEditor = (day: string) => {
    const daySlots = schedules.filter(s => s.day === day);
    setEditingSchedule({ day, slots: daySlots });
    setSlotsToDelete([]); // Reset slots to delete when opening editor
    setScheduleDialogOpen(true);
  };

  const toggleDayAvailability = (day: string) => {
    const daySchedules = schedules.filter(s => s.day === day);
    daySchedules.forEach(schedule => {
      updateScheduleMutation.mutate({ id: schedule.id, updates: { isAvailable: !schedule.isAvailable } });
    });
    toast({
      title: "Schedule Updated",
      description: `${day} availability has been toggled`,
    });
  };

  const saveScheduleChanges = () => {
    if (editingSchedule) {
      // First delete any slots marked for deletion
      slotsToDelete.forEach(slotId => {
        if (!slotId.startsWith('new-')) {
          deleteScheduleMutation.mutate(slotId);
        }
      });
      
      // Then save/update remaining slots
      editingSchedule.slots.forEach(slot => {
        if (slot.id.startsWith('new-')) {
          createScheduleMutation.mutate({
            doctorId,
            day: slot.day,
            specificDate: slot.specificDate || null,
            startTime: slot.startTime,
            endTime: slot.endTime,
            slotType: slot.slotType,
            location: slot.location || null,
            maxPatients: slot.maxPatients,
            isAvailable: slot.isAvailable,
          });
        } else {
          // Only send updatable fields, exclude id, createdAt, updatedAt
          const { id, createdAt, updatedAt, ...updateFields } = slot;
          updateScheduleMutation.mutate({ id: slot.id, updates: updateFields });
        }
      });
      setScheduleDialogOpen(false);
      setEditingSchedule(null);
      setSlotsToDelete([]);
      toast({
        title: "Schedule Saved",
        description: `${editingSchedule.day} schedule has been updated`,
      });
    }
  };

  const updateSlotTime = (slotId: string, field: "startTime" | "endTime" | "slotType", value: string) => {
    if (editingSchedule) {
      setEditingSchedule({
        ...editingSchedule,
        slots: editingSchedule.slots.map(s => 
          s.id === slotId ? { ...s, [field]: value } : s
        )
      });
    }
  };

  const addNewSlot = () => {
    if (editingSchedule) {
      const newSlot: DoctorSchedule = {
        id: `new-${Date.now()}`,
        doctorId: doctorId,
        day: editingSchedule.day,
        specificDate: null,
        startTime: "14:00",
        endTime: "18:00",
        slotType: "OPD",
        location: "Gravity Hospital - Nigdi (Main)",
        maxPatients: 20,
        isAvailable: true,
        createdAt: null,
        updatedAt: null,
      };
      setEditingSchedule({
        ...editingSchedule,
        slots: [...editingSchedule.slots, newSlot]
      });
    }
  };

  const removeSlot = (slotId: string) => {
    if (editingSchedule && editingSchedule.slots.length > 1) {
      // Track existing slots for deletion (not new slots)
      if (!slotId.startsWith('new-')) {
        setSlotsToDelete(prev => [...prev, slotId]);
      }
      setEditingSchedule({
        ...editingSchedule,
        slots: editingSchedule.slots.filter(s => s.id !== slotId)
      });
    }
  };

  const renderSchedules = () => {
    // Calculate schedule statistics
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaySlots = schedules.filter(s => s.specificDate === today && s.isAvailable);
    
    // Calculate week boundaries with start/end of day for accurate filtering
    const now = new Date();
    const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);
    thisWeekEnd.setHours(23, 59, 59, 999);
    
    const weekSlots = schedules.filter(s => {
      if (!s.specificDate || !s.isAvailable) return false;
      const slotDate = new Date(s.specificDate + 'T00:00:00');
      return slotDate >= thisWeekStart && slotDate <= thisWeekEnd;
    });
    const totalAvailableSlots = schedules.filter(s => s.isAvailable).length;
    // Use doctor-specific appointments for pending count
    const doctorAppointments = allAppointments.filter(a => a.doctorId === doctorId);
    const pendingAppointments = doctorAppointments.filter(a => a.status === 'pending' || a.status === 'scheduled').length;

    return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20" data-testid="stat-today-slots">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Today's Slots</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{todaySlots.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20" data-testid="stat-week-slots">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{weekSlots.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20" data-testid="stat-total-slots">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Available</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalAvailableSlots}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20" data-testid="stat-pending">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingAppointments}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <CalendarDays className="h-3 w-3 mr-1" />
            {format(calendarMonth, "MMMM yyyy")}
          </Badge>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            data-testid="button-prev-month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            data-testid="button-next-month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCalendarMonth(new Date())}
            data-testid="button-today"
          >
            Today
          </Button>
        </div>
        <Button onClick={() => openScheduleEditor("Monday")} className="shadow-lg" data-testid="button-add-slot">
          <Plus className="h-4 w-4 mr-2" />
          Add Time Slot
        </Button>
      </div>

      <Card className="overflow-hidden" data-testid="card-schedule-calendar">
        <CardContent className="p-0">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 bg-muted/50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => {
              return (
                <div 
                  key={day}
                  className={`py-4 px-2 text-center font-semibold text-sm ${idx > 0 ? 'border-l border-border/30' : ''}`}
                  data-testid={`overview-${day.toLowerCase()}`}
                >
                  {day}
                </div>
              );
            })}
          </div>
          
          <CalendarUI
            mode="single"
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            selected={selectedCalendarDate}
            onSelect={handleCalendarDateClick}
            className="w-full p-0"
            classNames={{
              months: "w-full",
              month: "w-full",
              caption: "hidden",
              caption_label: "hidden",
              nav: "hidden",
              nav_button: "hidden",
              nav_button_previous: "hidden",
              nav_button_next: "hidden",
              table: "w-full border-collapse",
              head_row: "hidden",
              head_cell: "hidden",
              row: "grid grid-cols-7 w-full",
              cell: "relative min-h-[100px] p-3 text-left align-top hover:bg-primary/5 hover:shadow-inner transition-all duration-200 cursor-pointer border-t border-r border-border/20 flex-1",
              day: "font-medium text-base",
              day_selected: "text-primary font-bold",
              day_today: "text-primary font-bold",
              day_outside: "text-muted-foreground/30",
              day_disabled: "text-muted-foreground/30",
              day_hidden: "invisible",
            }}
            modifiers={{
              hasSlots: (date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                return schedules.some(s => s.specificDate === dateStr && s.isAvailable);
              }
            }}
            modifiersStyles={{
              hasSlots: { }
            }}
            components={{
              DayContent: ({ date }) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const daySlots = schedules.filter(s => s.specificDate === dateStr && s.isAvailable);
                const slotCount = daySlots.length;
                const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;
                const isPast = new Date(dateStr) < new Date(format(new Date(), 'yyyy-MM-dd'));
                
                // Heat-map coloring based on slot count
                const getSlotBadgeStyle = () => {
                  if (slotCount === 0) return "";
                  if (slotCount === 1) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400";
                  if (slotCount <= 3) return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400";
                  return "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400";
                };
                
                return (
                  <div className={`flex flex-col gap-1 w-full h-full ${isPast ? 'opacity-50' : ''}`}>
                    <span className={`text-base ${isToday ? 'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center' : ''} ${slotCount > 0 && !isToday ? 'font-semibold text-foreground' : ''}`}>
                      {date.getDate()}
                    </span>
                    {slotCount > 0 && (
                      <div className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 w-fit ${getSlotBadgeStyle()}`}>
                        <Clock className="h-3 w-3" />
                        {slotCount}
                      </div>
                    )}
                  </div>
                );
              }
            }}
            data-testid="monthly-calendar"
          />
        </CardContent>
      </Card>

      <Sheet open={calendarSlotSheetOpen} onOpenChange={setCalendarSlotSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto" data-testid="sheet-day-slots">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              {selectedCalendarDate ? format(selectedCalendarDate, "EEEE, MMMM d, yyyy") : "Select a Date"}
            </SheetTitle>
            <SheetDescription>
              Manage time slots for this day
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h4 className="font-medium">Time Slots</h4>
              <Button 
                size="sm"
                onClick={() => {
                  if (selectedCalendarDate) {
                    const dayName = getDayNameFromDate(selectedCalendarDate);
                    const dateStr = format(selectedCalendarDate, 'yyyy-MM-dd');
                    createScheduleMutation.mutate({
                      doctorId,
                      day: dayName,
                      specificDate: dateStr,
                      startTime: "09:00 AM",
                      endTime: "12:00 PM",
                      slotType: "OPD",
                      location: "Gravity Hospital - Nigdi (Main)",
                      maxPatients: 20,
                      isAvailable: true,
                    });
                  }
                }}
                data-testid="button-add-slot-sheet"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Slot
              </Button>
            </div>
            
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-4 pr-4">
                {getSchedulesForDate(selectedCalendarDate).length > 0 ? (
                  getSchedulesForDate(selectedCalendarDate).map((slot) => (
                    <Card 
                      key={slot.id} 
                      className={`${!slot.isAvailable ? 'opacity-60 border-dashed' : ''}`} 
                      data-testid={`sheet-slot-${slot.id}`}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={slot.isAvailable}
                              onCheckedChange={(checked) => {
                                updateScheduleMutation.mutate({ 
                                  id: slot.id, 
                                  updates: { isAvailable: checked } 
                                });
                              }}
                              data-testid={`switch-slot-${slot.id}`}
                            />
                            <span className="text-sm">{slot.isAvailable ? 'Available' : 'Unavailable'}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteScheduleMutation.mutate(slot.id)}
                            data-testid={`button-delete-slot-${slot.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Start Time</Label>
                            <Select 
                              value={slot.startTime} 
                              onValueChange={(v) => updateScheduleMutation.mutate({ id: slot.id, updates: { startTime: v }})}
                            >
                              <SelectTrigger data-testid={`select-start-${slot.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {["06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"].map(t => (
                                  <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">End Time</Label>
                            <Select 
                              value={slot.endTime} 
                              onValueChange={(v) => updateScheduleMutation.mutate({ id: slot.id, updates: { endTime: v }})}
                            >
                              <SelectTrigger data-testid={`select-end-${slot.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {["07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM"].map(t => (
                                  <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Location</Label>
                            <Select 
                              value={slot.location || "Gravity Hospital - Nigdi (Main)"} 
                              onValueChange={(v) => updateScheduleMutation.mutate({ id: slot.id, updates: { location: v }})}
                            >
                              <SelectTrigger data-testid={`select-location-${slot.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Gravity Hospital - Koregaon Park">Gravity Hospital - Koregaon Park</SelectItem>
                                <SelectItem value="Gravity Hospital - Hinjewadi">Gravity Hospital - Hinjewadi</SelectItem>
                                <SelectItem value="Gravity Hospital - Kothrud">Gravity Hospital - Kothrud</SelectItem>
                                <SelectItem value="Gravity Hospital - Wakad">Gravity Hospital - Wakad</SelectItem>
                                <SelectItem value="Gravity Hospital - Viman Nagar">Gravity Hospital - Viman Nagar</SelectItem>
                                <SelectItem value="Gravity Hospital - Baner">Gravity Hospital - Baner</SelectItem>
                                <SelectItem value="Gravity Hospital - Aundh">Gravity Hospital - Aundh</SelectItem>
                                <SelectItem value="Gravity Hospital - Kalyani Nagar">Gravity Hospital - Kalyani Nagar</SelectItem>
                                <SelectItem value="Gravity Hospital - Pimpri">Gravity Hospital - Pimpri</SelectItem>
                                <SelectItem value="Gravity Hospital - Nigdi (Main)">Gravity Hospital - Nigdi (Main)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Max Patients</Label>
                            <Select 
                              value={String(slot.maxPatients)} 
                              onValueChange={(v) => updateScheduleMutation.mutate({ id: slot.id, updates: { maxPatients: parseInt(v) }})}
                            >
                              <SelectTrigger data-testid={`select-max-${slot.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[5, 10, 15, 20, 25, 30, 40, 50].map(n => (
                                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">No slots for this day</p>
                    <p className="text-muted-foreground mb-4">Click "Add Slot" above to create availability</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {getSchedulesForDate(selectedCalendarDate).length > 0 && (
              <div className="pt-4 border-t mt-4">
                <Button 
                  className="w-full"
                  onClick={() => {
                    setCalendarSlotSheetOpen(false);
                    toast({ title: "Schedule updated successfully" });
                  }}
                  data-testid="button-save-slots"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-lg" data-testid="dialog-edit-schedule">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Edit {editingSchedule?.day} Schedule
            </DialogTitle>
            <DialogDescription>
              Manage your time slots and OPD assignments
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[400px] overflow-auto">
            {editingSchedule?.slots.map((slot, idx) => (
              <Card key={slot.id} data-testid={`slot-editor-${idx}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium">Slot {idx + 1}</span>
                    {editingSchedule.slots.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeSlot(slot.id)}
                        data-testid={`button-remove-slot-${idx}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Select 
                        value={slot.startTime} 
                        onValueChange={(v) => updateSlotTime(slot.id, "startTime", v)}
                      >
                        <SelectTrigger data-testid={`select-start-${idx}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Select 
                        value={slot.endTime} 
                        onValueChange={(v) => updateSlotTime(slot.id, "endTime", v)}
                      >
                        <SelectTrigger data-testid={`select-end-${idx}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM"].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Select 
                      value={slot.slotType} 
                      onValueChange={(v) => updateSlotTime(slot.id, "slotType", v)}
                    >
                      <SelectTrigger data-testid={`select-opd-${idx}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Gravity Hospital - Koregaon Park">Gravity Hospital - Koregaon Park</SelectItem>
                        <SelectItem value="Gravity Hospital - Hinjewadi">Gravity Hospital - Hinjewadi</SelectItem>
                        <SelectItem value="Gravity Hospital - Kothrud">Gravity Hospital - Kothrud</SelectItem>
                        <SelectItem value="Gravity Hospital - Wakad">Gravity Hospital - Wakad</SelectItem>
                        <SelectItem value="Gravity Hospital - Viman Nagar">Gravity Hospital - Viman Nagar</SelectItem>
                        <SelectItem value="Gravity Hospital - Baner">Gravity Hospital - Baner</SelectItem>
                        <SelectItem value="Gravity Hospital - Aundh">Gravity Hospital - Aundh</SelectItem>
                        <SelectItem value="Gravity Hospital - Kalyani Nagar">Gravity Hospital - Kalyani Nagar</SelectItem>
                        <SelectItem value="Gravity Hospital - Pimpri">Gravity Hospital - Pimpri</SelectItem>
                        <SelectItem value="Gravity Hospital - Nigdi (Main)">Gravity Hospital - Nigdi (Main)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button variant="outline" className="w-full" onClick={addNewSlot} data-testid="button-add-new-slot">
            <Plus className="h-4 w-4 mr-2" />
            Add Another Slot
          </Button>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)} data-testid="button-cancel-schedule">
              Cancel
            </Button>
            <Button onClick={saveScheduleChanges} data-testid="button-save-schedule">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
  };

  const renderPrescriptions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-prescriptions-title">Prescriptions</h1>
          <p className="text-muted-foreground">Manage and create prescriptions</p>
        </div>
        <Button onClick={() => setAddPrescriptionDialogOpen(true)} data-testid="button-new-prescription">
          <Plus className="h-4 w-4 mr-2" />
          New Prescription
        </Button>
        <PrescriptionCreationModal
          open={addPrescriptionDialogOpen}
          onClose={() => {
            setAddPrescriptionDialogOpen(false);
            setPatientSearchQuery("");
            setSelectedPatientForRx("");
            setSelectedPatientRecordId("");
            setShowPatientDropdown(false);
          }}
          doctorId={doctorId}
          doctorName={doctorName}
          userRole="DOCTOR"
          userName={doctorName}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
            queryClient.invalidateQueries({ queryKey: ['/api/prescriptions/doctor', doctorId] });
          }}
        />
      </div>

      <div className="grid gap-4">
        {prescriptions.map((rx) => (
          <Card key={rx.id} className="hover-elevate" data-testid={`prescription-card-${rx.id}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{rx.patientName}</CardTitle>
                    <CardDescription>{rx.prescriptionDate}</CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid={`button-rx-menu-${rx.id}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete this prescription for ${rx.patientName}?`)) {
                          deletePrescriptionMutation.mutate(rx.id);
                        }
                      }}
                      data-testid={`button-delete-rx-${rx.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Diagnosis</p>
                <p className="font-medium">{rx.diagnosis}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Medicines</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {rx.medicines.map((med, idx) => (
                    <Badge key={idx} variant="secondary" className="font-normal">
                      <Pill className="h-3 w-3 mr-1" />
                      {med}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Instructions</p>
                <p className="text-sm">{rx.instructions}</p>
              </div>
              {rx.patientRecordId && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Patient Record</p>
                  {(() => {
                    const record = allMedicalRecords.find(r => r.id === rx.patientRecordId);
                    return record ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="font-normal">
                          <FileText className="h-3 w-3 mr-1" />
                          {record.title} - {record.recordType}
                        </Badge>
                        {record.fileName && (
                          <Badge variant="secondary" className="font-normal text-xs">
                            {record.fileName}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Record not found</p>
                    );
                  })()}
                </div>
              )}
            </CardContent>
            <CardFooter className="gap-2 border-t bg-muted/20">
              <Button variant="outline" size="sm" onClick={() => {
                setSelectedPrescription(rx);
                setViewPrescriptionDialogOpen(true);
              }} data-testid={`button-view-rx-${rx.id}`}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const vitals = rx.vitals ? JSON.parse(rx.vitals) : null;
                const printContent = `
                  <html>
                    <head>
                      <title>Prescription - ${rx.patientName}</title>
                      <style>
                        body { font-family: Arial, sans-serif; padding: 40px; font-size: 14px; line-height: 1.5; }
                        .header { text-align: center; border-bottom: 2px solid #1a56db; padding-bottom: 15px; margin-bottom: 25px; }
                        .hospital { font-size: 26px; font-weight: bold; color: #1a56db; }
                        .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
                        .section { margin: 18px 0; }
                        .section-title { font-weight: bold; color: #1a56db; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px; }
                        .label { font-weight: 600; color: #374151; }
                        .value { color: #111; margin-top: 3px; }
                        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
                        .grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
                        .medicines { margin-top: 10px; }
                        .medicine { background: #f3f4f6; padding: 8px 12px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #1a56db; }
                        .medicine-name { font-weight: 600; }
                        .medicine-details { font-size: 13px; color: #4b5563; }
                        .footer { margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px; }
                        .signature-line { margin-top: 40px; text-align: right; }
                        .signature-line .line { border-top: 1px solid #333; width: 200px; margin-left: auto; margin-bottom: 5px; }
                        .note-box { background: #fef3c7; border: 1px solid #fbbf24; padding: 10px; border-radius: 6px; font-size: 13px; }
                        @media print { body { padding: 20px; } }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <div class="hospital">Gravity Hospital</div>
                        <div class="subtitle">Medical Prescription</div>
                      </div>
                      
                      <!-- Patient Details -->
                      <div class="section">
                        <div class="section-title">Patient Details</div>
                        <div class="grid-3">
                          <div><span class="label">Name:</span> <span class="value">${rx.patientName}</span></div>
                          <div><span class="label">Age:</span> <span class="value">${rx.patientAge || 'N/A'}</span></div>
                          <div><span class="label">Gender:</span> <span class="value">${rx.patientGender || 'N/A'}</span></div>
                        </div>
                        <div class="grid-2" style="margin-top: 10px;">
                          <div><span class="label">Patient ID:</span> <span class="value">${rx.patientId}</span></div>
                          <div><span class="label">Date:</span> <span class="value">${rx.prescriptionDate}</span></div>
                        </div>
                      </div>
                      
                      <!-- Vitals -->
                      ${vitals ? `
                      <div class="section">
                        <div class="section-title">Vitals</div>
                        <div class="grid-5">
                          <div><span class="label">BP:</span> ${vitals.bp || 'N/A'}</div>
                          <div><span class="label">Sugar:</span> ${vitals.sugar || 'N/A'}</div>
                          <div><span class="label">Pulse:</span> ${vitals.pulse || 'N/A'}</div>
                          <div><span class="label">Weight:</span> ${vitals.weight || 'N/A'}</div>
                          <div><span class="label">Temp:</span> ${vitals.temp || 'N/A'}</div>
                        </div>
                      </div>
                      ` : ''}
                      
                      <!-- Clinical Notes -->
                      ${(rx.patientComplaints || rx.doctorObservations || rx.pastHistoryReference || rx.knownAllergies) ? `
                      <div class="section">
                        <div class="section-title">Clinical Notes</div>
                        ${rx.patientComplaints ? `<div style="margin-bottom: 8px;"><span class="label">Patient Complaints:</span> <span class="value">${rx.patientComplaints}</span></div>` : ''}
                        ${rx.doctorObservations ? `<div style="margin-bottom: 8px;"><span class="label">Doctor Observations:</span> <span class="value">${rx.doctorObservations}</span></div>` : ''}
                        ${rx.pastHistoryReference ? `<div style="margin-bottom: 8px;"><span class="label">Past History Reference:</span> <span class="value">${rx.pastHistoryReference}</span></div>` : ''}
                        ${rx.knownAllergies ? `<div><span class="label">Known Allergies:</span> <span class="value" style="color: #dc2626;">${rx.knownAllergies}</span></div>` : ''}
                      </div>
                      ` : ''}
                      
                      <!-- Chief Complaints -->
                      ${rx.chiefComplaints ? `
                      <div class="section">
                        <div class="section-title">Chief Complaints</div>
                        <div class="value">${rx.chiefComplaints}</div>
                      </div>
                      ` : ''}
                      
                      <!-- Diagnosis -->
                      <div class="section">
                        <div class="section-title">Diagnosis</div>
                        <div class="grid-2">
                          <div><span class="label">Primary Diagnosis:</span> <span class="value">${rx.diagnosis}</span></div>
                          ${rx.provisionalDiagnosis ? `<div><span class="label">Provisional:</span> <span class="value">${rx.provisionalDiagnosis}</span></div>` : ''}
                        </div>
                      </div>
                      
                      <!-- Medicines -->
                      <div class="section">
                        <div class="section-title">Medicines</div>
                        <div class="medicines">
                          ${rx.medicines.map(m => `<div class="medicine"><span class="medicine-name">${m}</span></div>`).join('')}
                        </div>
                      </div>
                      
                      <!-- Instructions -->
                      ${rx.instructions ? `
                      <div class="section">
                        <div class="section-title">Instructions</div>
                        <div class="value">${rx.instructions}</div>
                      </div>
                      ` : ''}
                      
                      <!-- Tests Advised -->
                      ${rx.suggestedTest ? `
                      <div class="section">
                        <div class="section-title">Tests Advised</div>
                        <div class="value">${rx.suggestedTest}</div>
                      </div>
                      ` : ''}
                      
                      <!-- Diet & Precautions -->
                      ${(rx.dietAdvice || rx.activityAdvice) ? `
                      <div class="section">
                        <div class="section-title">Diet & Precautions</div>
                        ${rx.dietAdvice ? `<div style="margin-bottom: 8px;"><span class="label">Diet Advice:</span> <span class="value">${rx.dietAdvice}</span></div>` : ''}
                        ${rx.activityAdvice ? `<div><span class="label">Activity Advice:</span> <span class="value">${rx.activityAdvice}</span></div>` : ''}
                      </div>
                      ` : ''}
                      
                      ${rx.followUpDate ? `
                      <div class="section">
                        <div class="section-title">Follow-up</div>
                        <div class="value">${rx.followUpDate}</div>
                      </div>
                      ` : ''}
                      
                      <div class="footer">
                        <div class="signature-line">
                          <div class="line"></div>
                          <div>Dr. ${rx.signedByName || doctorName}</div>
                          <div style="font-size: 12px; color: #666;">${rx.doctorRegistrationNo ? `Reg. No: ${rx.doctorRegistrationNo}` : ''}</div>
                        </div>
                        <div style="margin-top: 20px; font-size: 12px; color: #666;">
                          <div>Gravity Hospital - Pimpri-Chinchwad</div>
                          <div>Prescription #: ${rx.prescriptionNumber || rx.id}</div>
                        </div>
                      </div>
                    </body>
                  </html>
                `;
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(printContent);
                  printWindow.document.close();
                  printWindow.print();
                }
              }} data-testid={`button-print-rx-${rx.id}`}>
                <FileText className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                setSelectedPrescription(rx);
                setEditingPrescription({
                  diagnosis: rx.diagnosis,
                  medicines: rx.medicines,
                  instructions: rx.instructions || ""
                });
                setEditPrescriptionDialogOpen(true);
              }} data-testid={`button-edit-rx-${rx.id}`}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );

  // Handle download medical record
  const handleDownloadDoctorRecord = (record: MedicalRecord) => {
    if (record.fileData && record.fileName) {
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
      toast({
        title: "No file available",
        description: "This record does not have a file attached",
        variant: "destructive"
      });
    }
  };

  // Get patient names for records - moved to component scope for dialog access
  const getPatientName = (patientId: string) => {
    const patient = servicePatients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  };

  const renderMedicalRecords = () => {
    const getRecordIcon = (recordType: string) => {
      switch (recordType?.toLowerCase()) {
        case 'lab_result':
          return <Activity className="h-5 w-5 text-purple-600" />;
        case 'diagnosis':
          return <Stethoscope className="h-5 w-5 text-blue-600" />;
        case 'treatment':
          return <Heart className="h-5 w-5 text-red-600" />;
        case 'prescription':
          return <Pill className="h-5 w-5 text-green-600" />;
        default:
          return <FileText className="h-5 w-5 text-gray-600" />;
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-medical-records-title">Medical Records</h1>
          <p className="text-muted-foreground">View medical records assigned to you by admin</p>
        </div>

        {doctorRecordsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : doctorMedicalRecords.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Medical Records Assigned</h3>
            <p className="text-muted-foreground">Medical records assigned to you by admin will appear here</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {doctorMedicalRecords.map((record) => (
              <Card key={record.id} className="hover-elevate" data-testid={`medical-record-card-${record.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                      {getRecordIcon(record.recordType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold" data-testid={`record-title-${record.id}`}>{record.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          <User className="h-3 w-3 mr-1" />
                          {getPatientName(record.patientId)}
                        </Badge>
                        <span className="hidden sm:inline">-</span>
                        <span className="hidden sm:inline">{record.recordType}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{record.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {record.recordDate ? format(new Date(record.recordDate), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                      <Badge variant={record.fileData ? "default" : "secondary"} className="mt-1">
                        {record.fileData ? "Has File" : "No File"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => {
                          setSelectedViewRecord(record);
                          setViewRecordDialogOpen(true);
                        }}
                        data-testid={`button-view-record-${record.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleDownloadDoctorRecord(record)}
                        disabled={!record.fileData}
                        data-testid={`button-download-record-${record.id}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {record.fileName && (
                    <div className="mt-2 pl-16">
                      <Badge variant="outline" className="text-xs font-normal">
                        <FileText className="h-3 w-3 mr-1" />
                        {record.fileName}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderDiagnosticReports = () => {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-diagnostic-reports-title">Diagnostic Reports</h1>
          <p className="text-muted-foreground">View diagnostic test reports from tests you ordered</p>
        </div>

        {diagnosticReportsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : diagnosticReports.length === 0 ? (
          <Card className="p-8 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Diagnostic Reports</h3>
            <p className="text-muted-foreground">Reports from tests you ordered will appear here once submitted by technicians</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {diagnosticReports.map((report: any) => (
              <Card key={report.id} className="hover-elevate" data-testid={`diagnostic-report-${report.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold" data-testid={`report-title-${report.id}`}>{report.testName}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          <User className="h-3 w-3 mr-1" />
                          {report.patientName || 'Unknown Patient'}
                        </Badge>
                        <span className="hidden sm:inline">-</span>
                        <span className="hidden sm:inline">{report.department}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{report.conclusion}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {report.reportDate ? format(new Date(report.reportDate), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                      <Badge variant="default" className="bg-green-500 mt-1">
                        {report.status || 'Submitted'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => {
                          const printContent = `
                            <html>
                            <head>
                              <title>Diagnostic Report - ${report.testName}</title>
                              <style>
                                body { font-family: Arial, sans-serif; padding: 40px; }
                                .header { text-align: center; border-bottom: 2px solid #1a56db; padding-bottom: 15px; margin-bottom: 25px; }
                                .hospital { font-size: 26px; font-weight: bold; color: #1a56db; }
                                .section { margin: 18px 0; }
                                .section-title { font-weight: bold; color: #1a56db; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px; }
                                .label { font-weight: 600; color: #374151; }
                                .value { color: #111; margin-top: 3px; }
                              </style>
                            </head>
                            <body>
                              <div class="header">
                                <div class="hospital">Gravity Hospital</div>
                                <div>Diagnostic Report</div>
                              </div>
                              <div class="section">
                                <div class="section-title">Test Details</div>
                                <p><span class="label">Test Name:</span> ${report.testName}</p>
                                <p><span class="label">Patient:</span> ${report.patientName}</p>
                                <p><span class="label">Department:</span> ${report.department}</p>
                                <p><span class="label">Date:</span> ${report.reportDate ? format(new Date(report.reportDate), 'yyyy-MM-dd') : 'N/A'}</p>
                                <p><span class="label">Technician:</span> ${report.technicianName}</p>
                              </div>
                              <div class="section">
                                <div class="section-title">Findings</div>
                                <p>${report.findings || 'N/A'}</p>
                              </div>
                              <div class="section">
                                <div class="section-title">Conclusion</div>
                                <p>${report.conclusion || 'N/A'}</p>
                              </div>
                              ${report.recommendations ? `<div class="section"><div class="section-title">Recommendations</div><p>${report.recommendations}</p></div>` : ''}
                            </body>
                            </html>
                          `;
                          const printWindow = window.open('', '_blank');
                          if (printWindow) {
                            printWindow.document.write(printContent);
                            printWindow.document.close();
                          }
                        }}
                        data-testid={`button-view-diagnostic-${report.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => {
                          if (report.fileData) {
                            const link = document.createElement('a');
                            link.href = report.fileData;
                            link.download = report.fileName || `diagnostic-report-${report.id}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          } else {
                            toast({
                              title: "No File Available",
                              description: "This report doesn't have an attached file.",
                              variant: "destructive"
                            });
                          }
                        }}
                        disabled={!report.fileData}
                        data-testid={`button-download-diagnostic-${report.id}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {report.fileName && (
                    <div className="mt-2 pl-16">
                      <Badge variant="outline" className="text-xs font-normal">
                        <FileText className="h-3 w-3 mr-1" />
                        {report.fileName}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTemplates = () => {
    const myTemplates = opdTemplates.filter((t: any) => t.createdBy === doctorId && !t.isSystemTemplate);
    const systemTemplates = opdTemplates.filter((t: any) => t.isSystemTemplate);
    const otherTemplates = opdTemplates.filter((t: any) => t.createdBy !== doctorId && !t.isSystemTemplate && t.isPublic);

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-templates-title">Prescription Templates</h1>
            <p className="text-muted-foreground">Create and manage quick prescription templates</p>
          </div>
          <Button onClick={() => { setEditingTemplate(null); resetTemplateForm(); setTemplateDialogOpen(true); }} data-testid="button-new-template">
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        <Tabs defaultValue="my-templates">
          <TabsList data-testid="tabs-templates">
            <TabsTrigger value="my-templates" data-testid="tab-my-templates">My Templates ({myTemplates.length})</TabsTrigger>
            <TabsTrigger value="system" data-testid="tab-system-templates">System Templates ({systemTemplates.length})</TabsTrigger>
            <TabsTrigger value="shared" data-testid="tab-shared-templates">Shared ({otherTemplates.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="my-templates" className="mt-4">
            {myTemplates.length === 0 ? (
              <Card className="p-8 text-center" data-testid="empty-my-templates">
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No custom templates yet</h3>
                <p className="text-muted-foreground mb-4">Create your own prescription templates to speed up your workflow</p>
                <Button onClick={() => { setEditingTemplate(null); resetTemplateForm(); setTemplateDialogOpen(true); }} data-testid="button-create-first-template">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Template
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myTemplates.map((template: any) => (
                  <Card key={template.id} className="hover-elevate" data-testid={`template-card-${template.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="capitalize">{template.category}</CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-template-menu-${template.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditTemplate(template)} data-testid={`button-edit-template-${template.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this template?')) {
                                  deleteTemplateMutation.mutate(template.id);
                                }
                              }}
                              data-testid={`button-delete-template-${template.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(template.symptoms) ? template.symptoms : []).slice(0, 3).map((s: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                        {(Array.isArray(template.symptoms) ? template.symptoms : []).length > 3 && (
                          <Badge variant="outline" className="text-xs">+{(template.symptoms as string[]).length - 3} more</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Pill className="h-3 w-3" />
                        <span>{(Array.isArray(template.medicines) ? template.medicines : []).length} medicines</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Activity className="h-3 w-3" />
                        <span>Used {template.usageCount || 0} times</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="system" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {systemTemplates.map((template: any) => (
                <Card key={template.id} className="hover-elevate border-primary/20" data-testid={`system-template-card-${template.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <Badge variant="default" className="text-xs">System</Badge>
                        </div>
                        <CardDescription className="capitalize">{template.category}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(template.symptoms) ? template.symptoms : []).slice(0, 3).map((s: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Pill className="h-3 w-3" />
                      <span>{(Array.isArray(template.medicines) ? template.medicines : []).length} medicines</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Activity className="h-3 w-3" />
                      <span>Used {template.usageCount || 0} times</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="shared" className="mt-4">
            {otherTemplates.length === 0 ? (
              <Card className="p-8 text-center" data-testid="empty-shared-templates">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No shared templates</h3>
                <p className="text-muted-foreground">Templates shared by other doctors will appear here</p>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {otherTemplates.map((template: any) => (
                  <Card key={template.id} className="hover-elevate" data-testid={`shared-template-card-${template.id}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="capitalize">By {template.createdByName || 'Unknown'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(template.symptoms) ? template.symptoms : []).slice(0, 3).map((s: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Pill className="h-3 w-3" />
                        <span>{(Array.isArray(template.medicines) ? template.medicines : []).length} medicines</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={templateDialogOpen} onOpenChange={(open) => { setTemplateDialogOpen(open); if (!open) { setEditingTemplate(null); resetTemplateForm(); }}}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-template">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
              <DialogDescription>
                {editingTemplate ? 'Update your prescription template' : 'Create a reusable prescription template'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template Name *</Label>
                  <Input
                    id="templateName"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Common Cold Treatment"
                    data-testid="input-template-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateCategory">Category</Label>
                  <Select value={templateForm.category} onValueChange={(v) => setTemplateForm(prev => ({ ...prev, category: v }))}>
                    <SelectTrigger id="templateCategory" data-testid="select-template-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="respiratory">Respiratory</SelectItem>
                      <SelectItem value="gastrointestinal">Gastrointestinal</SelectItem>
                      <SelectItem value="cardiovascular">Cardiovascular</SelectItem>
                      <SelectItem value="musculoskeletal">Musculoskeletal</SelectItem>
                      <SelectItem value="dermatological">Dermatological</SelectItem>
                      <SelectItem value="neurological">Neurological</SelectItem>
                      <SelectItem value="infectious">Infectious Disease</SelectItem>
                      <SelectItem value="endocrine">Endocrine</SelectItem>
                      <SelectItem value="obstetric">Obstetric/Gynecological</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Symptoms</Label>
                <div className="flex gap-2">
                  <Input
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSymptom())}
                    placeholder="Add symptom and press Enter"
                    data-testid="input-symptom"
                  />
                  <Button type="button" variant="outline" onClick={addSymptom} data-testid="button-add-symptom">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {templateForm.symptoms.map((s, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {s}
                      <XCircle className="h-3 w-3 cursor-pointer" onClick={() => removeSymptom(s)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Medicines</Label>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <Input
                    value={medicineInput.medicineName}
                    onChange={(e) => setMedicineInput(prev => ({ ...prev, medicineName: e.target.value }))}
                    placeholder="Medicine name"
                    data-testid="input-medicine-name"
                  />
                  <Input
                    value={medicineInput.strength}
                    onChange={(e) => setMedicineInput(prev => ({ ...prev, strength: e.target.value }))}
                    placeholder="Strength (e.g., 500mg)"
                    data-testid="input-medicine-strength"
                  />
                  <Select value={medicineInput.frequency} onValueChange={(v) => setMedicineInput(prev => ({ ...prev, frequency: v }))}>
                    <SelectTrigger data-testid="select-medicine-frequency">
                      <SelectValue placeholder="Frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Once daily</SelectItem>
                      <SelectItem value="2">Twice daily</SelectItem>
                      <SelectItem value="3">Thrice daily</SelectItem>
                      <SelectItem value="4">Four times daily</SelectItem>
                      <SelectItem value="sos">SOS/As needed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={addMedicine} data-testid="button-add-medicine">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {templateForm.medicines.map((med, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{med.medicineName}</span>
                        {med.strength && <Badge variant="outline">{med.strength}</Badge>}
                        <Badge variant="secondary">{med.frequency === 'sos' ? 'SOS' : `${med.frequency}x daily`}</Badge>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeMedicine(i)} data-testid={`button-remove-medicine-${i}`}>
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="templateInstructions">Instructions</Label>
                <Textarea
                  id="templateInstructions"
                  value={templateForm.instructions}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="General instructions for the patient..."
                  rows={3}
                  data-testid="textarea-instructions"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="templateDiet">Diet Advice</Label>
                  <Textarea
                    id="templateDiet"
                    value={templateForm.dietAdvice}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, dietAdvice: e.target.value }))}
                    placeholder="Dietary recommendations..."
                    rows={2}
                    data-testid="textarea-diet"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateActivity">Activity Advice</Label>
                  <Textarea
                    id="templateActivity"
                    value={templateForm.activityAdvice}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, activityAdvice: e.target.value }))}
                    placeholder="Activity/rest recommendations..."
                    rows={2}
                    data-testid="textarea-activity"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Suggested Tests</Label>
                <div className="flex gap-2">
                  <Input
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTest())}
                    placeholder="Add test and press Enter"
                    data-testid="input-test"
                  />
                  <Button type="button" variant="outline" onClick={addTest} data-testid="button-add-test">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {templateForm.suggestedTests.map((t, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {t}
                      <XCircle className="h-3 w-3 cursor-pointer" onClick={() => removeTest(t)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="templateFollowUp">Follow-up (days)</Label>
                  <IntegerInput
                    id="templateFollowUp"
                    min={1}
                    value={templateForm.followUpDays.toString()}
                    onValueChange={(value) => setTemplateForm(prev => ({ ...prev, followUpDays: parseInt(value) || 7 }))}
                    data-testid="input-followup-days"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch
                      checked={templateForm.isPublic}
                      onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, isPublic: checked }))}
                      data-testid="switch-public"
                    />
                    <span className="text-sm">{templateForm.isPublic ? 'Public (visible to other doctors)' : 'Private (only you can see)'}</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setTemplateDialogOpen(false)} data-testid="button-cancel-template">
                Cancel
              </Button>
              <Button 
                onClick={handleSaveTemplate} 
                disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                data-testid="button-save-template"
              >
                {(createTemplateMutation.isPending || updateTemplateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const renderNotifications = () => {
    const getNotificationBgColor = (type: string) => {
      switch (type) {
        case 'appointment': return 'bg-blue-100 dark:bg-blue-900';
        case 'patient': return 'bg-green-100 dark:bg-green-900';
        case 'prescription': return 'bg-orange-100 dark:bg-orange-900';
        case 'schedule': return 'bg-purple-100 dark:bg-purple-900';
        case 'admission': return 'bg-teal-100 dark:bg-teal-900';
        case 'report': return 'bg-amber-100 dark:bg-amber-900';
        default: return 'bg-purple-100 dark:bg-purple-900';
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-notifications-title">Notifications</h1>
            <p className="text-muted-foreground">Stay updated with latest alerts</p>
          </div>
          <div className="flex items-center gap-3">
            {unreadNotificationCount > 0 && (
              <Badge variant="destructive" className="px-3 py-1" data-testid="badge-unread-count">
                {unreadNotificationCount} unread
              </Badge>
            )}
            <Button variant="outline" onClick={() => markAllNotificationsRead()} data-testid="button-mark-all-read">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList data-testid="tabs-notifications">
            <TabsTrigger value="all" data-testid="tab-notif-all">All ({notifications.length})</TabsTrigger>
            <TabsTrigger value="unread" data-testid="tab-notif-unread">Unread ({unreadNotifications.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="space-y-3">
              {notifications.length > 0 ? notifications.map((notif) => (
                <Card 
                  key={notif.id} 
                  className={`hover-elevate cursor-pointer ${!notif.isRead ? 'border-primary/50' : ''}`}
                  onClick={() => openNotificationDetail(notif)}
                  data-testid={`notif-card-${notif.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getNotificationBgColor(notif.type)}`}>
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`font-medium truncate ${!notif.isRead ? 'text-primary' : ''}`}>{notif.title}</h4>
                          <div className="flex items-center gap-2 shrink-0">
                            {!notif.isRead && <div className="h-2 w-2 rounded-full bg-primary" />}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{notif.createdAt ? new Date(notif.createdAt).toLocaleString() : 'Just now'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No notifications yet.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="unread" className="mt-4">
            <div className="space-y-3">
              {unreadNotifications.length > 0 ? (
                unreadNotifications.map((notif) => (
                  <Card 
                    key={notif.id} 
                    className="hover-elevate cursor-pointer border-primary/50"
                    onClick={() => openNotificationDetail(notif)}
                    data-testid={`unread-notif-${notif.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getNotificationBgColor(notif.type)}`}>
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-medium text-primary truncate">{notif.title}</h4>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">{notif.createdAt ? new Date(notif.createdAt).toLocaleString() : 'Just now'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
                  <p className="text-muted-foreground">All caught up! No unread notifications.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={notificationDetailOpen} onOpenChange={setNotificationDetailOpen}>
          <DialogContent className="max-w-lg" data-testid="dialog-notification-detail">
            <DialogHeader>
              <div className="flex items-center gap-3">
                {selectedNotification && (
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${getNotificationBgColor(selectedNotification.type)}`}>
                    {getNotificationIconLarge(selectedNotification.type)}
                  </div>
                )}
                <div>
                  <DialogTitle data-testid="text-notification-detail-title">{selectedNotification?.title}</DialogTitle>
                  <DialogDescription className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {selectedNotification ? getNotificationTypeLabel(selectedNotification.type) : ''}
                    </Badge>
                    {selectedNotification?.isRead ? (
                      <Badge variant="secondary" className="text-xs">Read</Badge>
                    ) : (
                      <Badge variant="default" className="text-xs">Unread</Badge>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Message</h4>
                <p className="text-sm" data-testid="text-notification-message">{selectedNotification?.message}</p>
              </div>

              {selectedNotification?.metadata && Object.keys(parseMetadata(selectedNotification.metadata)).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Details</h4>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    {Object.entries(parseMetadata(selectedNotification.metadata)).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="text-sm font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedNotification?.relatedEntityType && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Related To</h4>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-muted-foreground">Type:</span>
                      <Badge variant="outline" className="capitalize">{selectedNotification.relatedEntityType}</Badge>
                    </div>
                    {selectedNotification.relatedEntityId && (
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <span className="text-sm text-muted-foreground">Reference:</span>
                        <span className="text-sm font-mono text-xs">{selectedNotification.relatedEntityId}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Received</span>
                <span data-testid="text-notification-time">
                  {selectedNotification?.createdAt 
                    ? new Date(selectedNotification.createdAt).toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Just now'}
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (selectedNotification) {
                    deleteNotification(selectedNotification.id);
                  }
                  setNotificationDetailOpen(false);
                  setSelectedNotification(null);
                }}
                data-testid="button-delete-notification"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button onClick={() => setNotificationDetailOpen(false)} data-testid="button-close-notification">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    );
  };

  const renderProfile = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-profile-title">Doctor Profile</h1>
        <p className="text-muted-foreground">Manage your personal and professional information</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1" data-testid="card-profile-photo">
          <CardContent className="pt-6 text-center">
            <div className="relative inline-block">
              <Avatar className="h-32 w-32 mx-auto">
                {profileData?.photoUrl ? (
                  <AvatarImage src={profileData.photoUrl} alt="Profile" />
                ) : null}
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                  {doctorName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                ref={photoInputRef}
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                data-testid="input-photo-upload"
              />
            </div>
            <h3 className="text-xl font-semibold mt-4">{profileForm.fullName}</h3>
            <p className="text-muted-foreground">{profileForm.specialty}</p>
            <Badge className="mt-2">Senior Consultant</Badge>
            <div className="flex gap-2 w-full mt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => photoInputRef.current?.click()}
                disabled={isUploadingPhoto || isDeletingPhoto}
                data-testid="button-change-photo"
              >
                {isUploadingPhoto ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
                ) : (
                  <><Camera className="h-4 w-4 mr-2" />{profileData?.photoUrl ? "Change" : "Add Photo"}</>
                )}
              </Button>
              {profileData?.photoUrl && (
                <Button 
                  variant="outline" 
                  className="text-red-500 hover:text-red-600"
                  onClick={handleDeletePhoto}
                  disabled={isDeletingPhoto || isUploadingPhoto}
                  data-testid="button-delete-photo"
                >
                  {isDeletingPhoto ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2" data-testid="card-profile-details">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input 
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                  data-testid="input-full-name" 
                />
              </div>
              <div className="space-y-2">
                <Label>Specialty</Label>
                <Input 
                  value={profileForm.specialty}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, specialty: e.target.value }))}
                  data-testid="input-specialty" 
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  data-testid="input-email" 
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input 
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  data-testid="input-phone" 
                />
              </div>
              <div className="space-y-2">
                <Label>Qualifications</Label>
                <Input 
                  value={profileForm.qualifications}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, qualifications: e.target.value }))}
                  data-testid="input-qualifications" 
                />
              </div>
              <div className="space-y-2">
                <Label>Experience</Label>
                <Input 
                  value={profileForm.experience}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, experience: e.target.value }))}
                  data-testid="input-experience" 
                />
              </div>
              <div className="space-y-2">
                <Label>Languages</Label>
                <Input 
                  value={profileForm.languages}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, languages: e.target.value }))}
                  data-testid="input-languages" 
                />
              </div>
              <div className="space-y-2">
                <Label>Consultation Fee</Label>
                <Input 
                  value={profileForm.consultationFee}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, consultationFee: e.target.value }))}
                  data-testid="input-consultation-fee" 
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Bio</Label>
                <Textarea 
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Write a brief bio about yourself..."
                  className="min-h-[100px]"
                  data-testid="input-bio" 
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending}
              data-testid="button-save-profile"
            >
              {updateProfileMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card data-testid="card-hospital-info">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hospital className="h-5 w-5 text-primary" />
            Hospital Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Hospital Name</p>
              <p className="font-medium">{hospitalName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Department</p>
              <Input 
                value={profileForm.department}
                onChange={(e) => setProfileForm(prev => ({ ...prev, department: e.target.value }))}
                data-testid="input-department" 
              />
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">Gat No, 167, Sahyog Nager, Triveni Nagar, Nigdi, Pimpri-Chinchwad, Maharashtra 411062</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard": return renderDashboard();
      case "patients": return renderPatients();
      case "appointments": return renderAppointments();
      case "schedules": return renderSchedules();
      case "prescriptions": return renderPrescriptions();
      case "medical-records": return renderMedicalRecords();
      case "diagnostic-reports": return renderDiagnosticReports();
      case "templates": return renderTemplates();
      case "patient-monitoring": return <PatientMonitoringPage />;
      case "icu-monitoring": return <IcuMonitoringPage userRole="DOCTOR" userId={doctorId} onBack={() => setActiveSection("dashboard")} />;
      case "hospital-services": return <HospitalServices currentUserRole="DOCTOR" />;
      case "staff-management": return <StaffSelfService userId={doctorId} userName={doctorName} userRole="DOCTOR" />;
      case "notifications": return renderNotifications();
      case "profile": return renderProfile();
      default: return renderDashboard();
    }
  };

  const hasAcceptedOath = oathStatus?.accepted || oathAccepted;
  
  if (oathLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {!hasAcceptedOath && (
        <DoctorOathModal
          doctorId={doctorId}
          doctorName={doctorName}
          onOathAccepted={() => setOathAccepted(true)}
        />
      )}
      
      <SidebarProvider style={sidebarStyle as React.CSSProperties}>
        <div className={`flex h-screen w-full overflow-hidden ${!hasAcceptedOath ? 'pointer-events-none blur-sm' : ''}`}>
          <Sidebar className="glass-sidebar">
            <SidebarHeader className="py-4 px-3">
              <div className="relative">
                <img 
                  src={hospitalLogo} 
                  alt="Gravity Hospital" 
                  className="w-full max-w-[210px] h-[56px] object-contain transition-transform duration-300 hover:scale-105"
                  data-testid="img-doctor-portal-logo"
                />
              </div>
              {/* Doctor Profile Card */}
              <div className="mt-4 p-3 bg-gradient-to-br from-cyan-100 via-blue-50 to-sky-50 dark:from-cyan-900/40 dark:via-blue-800/30 dark:to-sky-900/20 rounded-xl border border-white/40 dark:border-slate-700/40 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-cyan-500/20">
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-semibold">
                      {(profileForm.fullName || doctorName).replace(/^Dr\.?\s*/i, '').split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-semibold text-foreground truncate" data-testid="text-doctor-name">
                      {profileForm.fullName || `Dr. ${doctorName}`}
                    </p>
                    <Badge variant="default" className="text-xs mt-1 shadow-sm" data-testid="badge-role">
                      DOCTOR
                    </Badge>
                  </div>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent>
              {/* Dashboard Section */}
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">Dashboard</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild data-testid="nav-dashboard">
                        <Button
                          variant="ghost"
                          className={`w-full justify-start group relative overflow-visible rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                            activeSection === 'dashboard' 
                              ? 'bg-gradient-to-r from-cyan-100 to-teal-100 dark:from-cyan-900/40 dark:to-teal-900/30 border border-cyan-200/50 dark:border-cyan-700/30' 
                              : 'hover:bg-gradient-to-r hover:from-cyan-50/80 hover:to-teal-50/60 dark:hover:from-cyan-900/30 dark:hover:to-teal-900/20'
                          }`}
                          onClick={() => setActiveSection('dashboard')}
                        >
                          <div className={`p-1.5 rounded-lg mr-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm ${
                            activeSection === 'dashboard'
                              ? 'bg-gradient-to-br from-cyan-500 to-teal-600 text-white'
                              : 'bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-800/50 dark:to-teal-800/40 text-cyan-600 dark:text-cyan-400 group-hover:from-cyan-500 group-hover:to-teal-600 group-hover:text-white'
                          }`}>
                            <Home className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-medium">Dashboard</span>
                        </Button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {/* Core Services Section */}
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">Clinical Services</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {menuItems.filter(item => ['appointments', 'patients', 'prescriptions', 'medical-records', 'templates', 'patient-monitoring', 'icu-monitoring', 'hospital-services'].includes(item.id)).map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton asChild data-testid={`nav-${item.id}`}>
                          <Button
                            variant="ghost"
                            className={`w-full justify-start group relative overflow-visible rounded-xl transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5 ${
                              activeSection === item.id 
                                ? 'bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/30 border border-emerald-200/50 dark:border-emerald-700/30' 
                                : 'hover:bg-gradient-to-r hover:from-emerald-50/80 hover:to-teal-50/60 dark:hover:from-emerald-900/30 dark:hover:to-teal-900/20'
                            }`}
                            onClick={() => setActiveSection(item.id)}
                          >
                            <div className={`p-1.5 rounded-lg mr-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md group-hover:shadow-emerald-500/20 ${
                              activeSection === item.id
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md'
                                : 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-800/50 dark:to-teal-800/40 text-emerald-600 dark:text-emerald-400 group-hover:from-emerald-500 group-hover:to-teal-600 group-hover:text-white'
                            }`}>
                              <item.icon className="h-3.5 w-3.5" />
                            </div>
                            <span className={`font-medium transition-colors duration-200 ${activeSection === item.id ? 'text-emerald-700 dark:text-emerald-400' : 'group-hover:text-emerald-700 dark:group-hover:text-emerald-400'}`}>
                              {item.title}
                            </span>
                            {item.badge && item.badge > 0 && (
                              <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0 h-4">
                                {item.badge}
                              </Badge>
                            )}
                          </Button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {/* Schedule & Communication Section */}
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">Schedule & Alerts</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {menuItems.filter(item => ['schedules', 'staff-management', 'notifications'].includes(item.id)).map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton asChild data-testid={`nav-${item.id}`}>
                          <Button
                            variant="ghost"
                            className={`w-full justify-start group relative overflow-visible rounded-xl transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5 ${
                              activeSection === item.id 
                                ? 'bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/30 border border-amber-200/50 dark:border-amber-700/30' 
                                : 'hover:bg-gradient-to-r hover:from-amber-50/80 hover:to-orange-50/60 dark:hover:from-amber-900/30 dark:hover:to-orange-900/20'
                            }`}
                            onClick={() => setActiveSection(item.id)}
                          >
                            <div className={`p-1.5 rounded-lg mr-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md group-hover:shadow-amber-500/20 ${
                              activeSection === item.id
                                ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md'
                                : 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-800/50 dark:to-orange-800/40 text-amber-600 dark:text-amber-400 group-hover:from-amber-500 group-hover:to-orange-600 group-hover:text-white'
                            }`}>
                              <item.icon className="h-3.5 w-3.5" />
                            </div>
                            <span className={`font-medium transition-colors duration-200 ${activeSection === item.id ? 'text-amber-700 dark:text-amber-400' : 'group-hover:text-amber-700 dark:group-hover:text-amber-400'}`}>
                              {item.title}
                            </span>
                            {item.badge && item.badge > 0 && (
                              <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0 h-4 animate-pulse">
                                {item.badge}
                              </Badge>
                            )}
                          </Button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {/* Profile Section */}
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">Settings</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild data-testid="nav-profile">
                        <Button
                          variant="ghost"
                          className={`w-full justify-start group relative overflow-visible rounded-xl transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5 ${
                            activeSection === 'profile' 
                              ? 'bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/30 border border-violet-200/50 dark:border-violet-700/30' 
                              : 'hover:bg-gradient-to-r hover:from-violet-50/80 hover:to-purple-50/60 dark:hover:from-violet-900/30 dark:hover:to-purple-900/20'
                          }`}
                          onClick={() => setActiveSection('profile')}
                        >
                          <div className={`p-1.5 rounded-lg mr-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md group-hover:shadow-violet-500/20 ${
                            activeSection === 'profile'
                              ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md'
                              : 'bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-800/50 dark:to-purple-800/40 text-violet-600 dark:text-violet-400 group-hover:from-violet-500 group-hover:to-purple-600 group-hover:text-white'
                          }`}>
                            <Settings className="h-3.5 w-3.5" />
                          </div>
                          <span className={`font-medium transition-colors duration-200 ${activeSection === 'profile' ? 'text-violet-700 dark:text-violet-400' : 'group-hover:text-violet-700 dark:group-hover:text-violet-400'}`}>
                            Profile
                          </span>
                        </Button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-4 border-t border-sidebar-border/50">
              <Button 
                variant="outline" 
                className="w-full group relative overflow-visible bg-gradient-to-r from-rose-50/80 to-red-50/60 hover:from-rose-100 hover:to-red-100 dark:from-rose-900/30 dark:to-red-900/20 dark:hover:from-rose-800/40 dark:hover:to-red-800/30 border border-rose-200/50 dark:border-rose-700/30 rounded-xl transition-all duration-300 hover:shadow-md hover:shadow-rose-500/10" 
                onClick={onLogout} 
                data-testid="button-logout"
              >
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 text-white mr-3 transition-transform duration-300 group-hover:scale-110 shadow-sm">
                  <LogOut className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium text-rose-700 dark:text-rose-400 group-data-[collapsible=icon]:hidden">Sign Out</span>
              </Button>
            </SidebarFooter>
          </Sidebar>

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <header className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b bg-background/95 backdrop-blur shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger data-testid="button-sidebar-toggle" className="shrink-0" />
              <Separator orientation="vertical" className="h-6 hidden sm:block" />
              <div className="min-w-0">
                <h2 className="font-semibold capitalize truncate text-sm sm:text-base">{activeSection}</h2>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative h-9 w-9"
                onClick={() => setActiveSection("notifications")}
                data-testid="button-header-notifications"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] sm:text-xs flex items-center justify-center">
                    {unreadNotifications.length}
                  </span>
                )}
              </Button>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
            {renderContent()}
          </main>
        </div>
      </div>

      {/* Appointment Details Dialog - placed at root level so it's accessible from all sections */}
      <Dialog open={appointmentDetailsOpen} onOpenChange={setAppointmentDetailsOpen}>
        <DialogContent className="max-w-lg" data-testid="dialog-appointment-details">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle data-testid="text-apt-detail-title">Appointment Details</DialogTitle>
                <DialogDescription>
                  {selectedAppointment?.patientName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Patient Name</h4>
                  <p className="text-sm font-medium" data-testid="apt-detail-patient">{selectedAppointment.patientName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                  <Badge variant={selectedAppointment.status === 'confirmed' ? 'default' : selectedAppointment.status === 'completed' ? 'secondary' : 'outline'}>
                    {selectedAppointment.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Date</h4>
                  <p className="text-sm" data-testid="apt-detail-date">{selectedAppointment.appointmentDate}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Time</h4>
                  <p className="text-sm" data-testid="apt-detail-time">{selectedAppointment.timeSlot}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Department</h4>
                  <p className="text-sm" data-testid="apt-detail-department">{selectedAppointment.department || 'General'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Location</h4>
                  {(() => {
                    const locationData = LOCATIONS.find(l => l.name === selectedAppointment.location) || LOCATIONS[9];
                    return (
                      <div className="space-y-1">
                        <p className="text-sm" data-testid="apt-detail-location">{locationData.name}</p>
                        <p className="text-xs text-muted-foreground">{locationData.address}</p>
                        <a 
                          href={locationData.mapUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                          data-testid="link-apt-location-map"
                        >
                          <MapPin className="h-3 w-3" />
                          <span>View on Google Maps</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Symptoms / Reason</h4>
                <p className="text-sm bg-muted/50 rounded-lg p-3" data-testid="apt-detail-symptoms">
                  {selectedAppointment.symptoms || 'General consultation'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setAppointmentDetailsOpen(false)} data-testid="button-close-apt-details">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Prescription Dialog */}
      <Dialog open={viewPrescriptionDialogOpen} onOpenChange={setViewPrescriptionDialogOpen}>
        <DialogContent className="max-w-lg" data-testid="dialog-view-prescription">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle data-testid="text-view-rx-title">Prescription Details</DialogTitle>
                <DialogDescription>
                  {selectedPrescription?.patientName} - {selectedPrescription?.prescriptionDate}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {selectedPrescription && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 py-4 pr-4">
                {/* Patient Details */}
                <div>
                  <h4 className="text-xs font-semibold text-primary uppercase mb-2">Patient Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Name:</span>
                      <p className="text-sm font-medium" data-testid="view-rx-patient">{selectedPrescription.patientName}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Age / Gender:</span>
                      <p className="text-sm">{selectedPrescription.patientAge || 'N/A'} / {selectedPrescription.patientGender || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Patient ID:</span>
                      <p className="text-sm font-mono text-xs">{selectedPrescription.patientId}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Date:</span>
                      <p className="text-sm">{selectedPrescription.prescriptionDate}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Vitals */}
                {selectedPrescription.vitals && (() => {
                  const vitals = JSON.parse(selectedPrescription.vitals);
                  return (vitals.bp || vitals.sugar || vitals.pulse || vitals.weight || vitals.temp) ? (
                    <div>
                      <h4 className="text-xs font-semibold text-primary uppercase mb-2">Vitals</h4>
                      <div className="grid grid-cols-5 gap-2 text-sm">
                        <div><span className="text-muted-foreground">BP:</span> {vitals.bp || 'N/A'}</div>
                        <div><span className="text-muted-foreground">Sugar:</span> {vitals.sugar || 'N/A'}</div>
                        <div><span className="text-muted-foreground">Pulse:</span> {vitals.pulse || 'N/A'}</div>
                        <div><span className="text-muted-foreground">Weight:</span> {vitals.weight || 'N/A'}</div>
                        <div><span className="text-muted-foreground">Temp:</span> {vitals.temp || 'N/A'}</div>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Clinical Notes */}
                {(selectedPrescription.patientComplaints || selectedPrescription.doctorObservations || selectedPrescription.pastHistoryReference || selectedPrescription.knownAllergies) && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-xs font-semibold text-primary uppercase mb-2">Clinical Notes</h4>
                      <div className="space-y-2 text-sm">
                        {selectedPrescription.patientComplaints && (
                          <div><span className="text-muted-foreground">Patient Complaints:</span> {selectedPrescription.patientComplaints}</div>
                        )}
                        {selectedPrescription.doctorObservations && (
                          <div><span className="text-muted-foreground">Doctor Observations:</span> {selectedPrescription.doctorObservations}</div>
                        )}
                        {selectedPrescription.pastHistoryReference && (
                          <div><span className="text-muted-foreground">Past History Reference:</span> {selectedPrescription.pastHistoryReference}</div>
                        )}
                        {selectedPrescription.knownAllergies && (
                          <div><span className="text-muted-foreground">Known Allergies:</span> <span className="text-red-600">{selectedPrescription.knownAllergies}</span></div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Chief Complaints */}
                {selectedPrescription.chiefComplaints && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-xs font-semibold text-primary uppercase mb-2">Chief Complaints</h4>
                      <p className="text-sm">{selectedPrescription.chiefComplaints}</p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Diagnosis */}
                <div>
                  <h4 className="text-xs font-semibold text-primary uppercase mb-2">Diagnosis</h4>
                  <p className="text-sm bg-muted/50 rounded-lg p-3" data-testid="view-rx-diagnosis">{selectedPrescription.diagnosis}</p>
                  {selectedPrescription.provisionalDiagnosis && (
                    <p className="text-xs text-muted-foreground mt-1">Provisional: {selectedPrescription.provisionalDiagnosis}</p>
                  )}
                </div>

                <Separator />

                {/* Medicines */}
                <div>
                  <h4 className="text-xs font-semibold text-primary uppercase mb-2">Medicines</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPrescription.medicines.map((med, idx) => (
                      <Badge key={idx} variant="secondary" className="font-normal">
                        <Pill className="h-3 w-3 mr-1" />
                        {med}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                {selectedPrescription.instructions && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-xs font-semibold text-primary uppercase mb-2">Instructions</h4>
                      <p className="text-sm bg-muted/50 rounded-lg p-3" data-testid="view-rx-instructions">{selectedPrescription.instructions}</p>
                    </div>
                  </>
                )}

                {/* Tests Advised */}
                {selectedPrescription.suggestedTest && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-xs font-semibold text-primary uppercase mb-2">Tests Advised</h4>
                      <p className="text-sm">{selectedPrescription.suggestedTest}</p>
                    </div>
                  </>
                )}

                {/* Diet & Precautions */}
                {(selectedPrescription.dietAdvice || selectedPrescription.activityAdvice) && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-xs font-semibold text-primary uppercase mb-2">Diet & Precautions</h4>
                      <div className="space-y-1 text-sm">
                        {selectedPrescription.dietAdvice && <p><span className="text-muted-foreground">Diet:</span> {selectedPrescription.dietAdvice}</p>}
                        {selectedPrescription.activityAdvice && <p><span className="text-muted-foreground">Activity:</span> {selectedPrescription.activityAdvice}</p>}
                      </div>
                    </div>
                  </>
                )}

                {/* Follow-up */}
                {selectedPrescription.followUpDate && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-xs font-semibold text-primary uppercase mb-2">Follow-up Date</h4>
                      <p className="text-sm" data-testid="view-rx-followup">{selectedPrescription.followUpDate}</p>
                    </div>
                  </>
                )}

                {/* Status */}
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">Status:</span>
                    <Badge variant={selectedPrescription.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                      {selectedPrescription.prescriptionStatus || selectedPrescription.status}
                    </Badge>
                  </div>
                  {selectedPrescription.signedByName && (
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">Signed by:</span>
                      <p className="text-sm font-medium">{selectedPrescription.signedByName}</p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewPrescriptionDialogOpen(false)} data-testid="button-close-view-rx">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Prescription Dialog */}
      <Dialog open={editPrescriptionDialogOpen} onOpenChange={setEditPrescriptionDialogOpen}>
        <DialogContent className="max-w-lg" data-testid="dialog-edit-prescription">
          <DialogHeader>
            <DialogTitle data-testid="text-edit-rx-title">Edit Prescription</DialogTitle>
            <DialogDescription>
              Update prescription for {selectedPrescription?.patientName}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (selectedPrescription) {
              updatePrescriptionMutation.mutate({
                id: selectedPrescription.id,
                prescription: {
                  diagnosis: editingPrescription.diagnosis,
                  medicines: editingPrescription.medicines,
                  instructions: editingPrescription.instructions || null,
                }
              });
            }
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editDiagnosis">Diagnosis</Label>
              <Input 
                id="editDiagnosis" 
                value={editingPrescription.diagnosis}
                onChange={(e) => setEditingPrescription(prev => ({...prev, diagnosis: e.target.value}))}
                required 
                data-testid="input-edit-diagnosis" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editMedicines">Medicines (comma separated)</Label>
              <Textarea 
                id="editMedicines" 
                value={editingPrescription.medicines.join(', ')}
                onChange={(e) => setEditingPrescription(prev => ({
                  ...prev, 
                  medicines: e.target.value.split(',').map(m => m.trim()).filter(Boolean)
                }))}
                rows={3} 
                data-testid="input-edit-medicines" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editInstructions">Instructions</Label>
              <Textarea 
                id="editInstructions" 
                value={editingPrescription.instructions}
                onChange={(e) => setEditingPrescription(prev => ({...prev, instructions: e.target.value}))}
                rows={3} 
                data-testid="input-edit-instructions" 
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditPrescriptionDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updatePrescriptionMutation.isPending} data-testid="button-save-rx">
                {updatePrescriptionMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Patient Dialog */}
      <Dialog open={viewPatientDialogOpen} onOpenChange={setViewPatientDialogOpen}>
        <DialogContent className="max-w-lg" data-testid="dialog-view-patient">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {selectedPatient?.patientName?.split(' ').map((n: string) => n[0]).join('') || 'P'}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle data-testid="text-view-patient-name">{selectedPatient?.patientName}</DialogTitle>
                <DialogDescription>Patient Details</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Age</h4>
                  <p className="text-sm font-medium">{selectedPatient.patientAge || 'N/A'} years</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Gender</h4>
                  <p className="text-sm font-medium">
                    {selectedPatient.patientGender === 'M' ? 'Male' : selectedPatient.patientGender === 'F' ? 'Female' : 'Other'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedPatient.patientPhone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedPatient.patientEmail || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedPatient.patientAddress || 'N/A'}</span>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Blood Group</h4>
                  <Badge className={BLOOD_GROUP_COLORS[selectedPatient.bloodGroup || ""] || "bg-gray-100"}>
                    {selectedPatient.bloodGroup || 'N/A'}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Last Visit</h4>
                  <p className="text-sm">{selectedPatient.lastVisit || 'N/A'}</p>
                </div>
              </div>

              {selectedPatient.medicalRecords && selectedPatient.medicalRecords.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Medical Records ({selectedPatient.medicalRecords.length})</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedPatient.medicalRecords.map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium">{record.title}</p>
                            <p className="text-xs text-muted-foreground">{record.recordType}</p>
                          </div>
                          <Badge variant="outline">{record.recordDate ? format(new Date(record.recordDate), 'MMM dd, yyyy') : 'N/A'}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewPatientDialogOpen(false)} data-testid="button-close-view-patient">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={editPatientDialogOpen} onOpenChange={setEditPatientDialogOpen}>
        <DialogContent className="max-w-lg" data-testid="dialog-edit-patient">
          <DialogHeader>
            <DialogTitle data-testid="text-edit-patient-title">Edit Patient Information</DialogTitle>
            <DialogDescription>
              Update information for {selectedPatient?.patientName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editPatientName">Patient Name</Label>
              <Input id="editPatientName" value={selectedPatient?.patientName || ''} disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editPatientAge">Age</Label>
                <Input id="editPatientAge" value={selectedPatient?.patientAge || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPatientGender">Gender</Label>
                <Input id="editPatientGender" value={selectedPatient?.patientGender === 'M' ? 'Male' : selectedPatient?.patientGender === 'F' ? 'Female' : 'Other'} disabled />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPatientPhone">Phone</Label>
              <Input id="editPatientPhone" value={selectedPatient?.patientPhone || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPatientEmail">Email</Label>
              <Input id="editPatientEmail" value={selectedPatient?.patientEmail || ''} disabled />
            </div>
            <p className="text-xs text-muted-foreground">
              Patient information can only be updated through the Patient Service module or by the patient themselves.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPatientDialogOpen(false)} data-testid="button-close-edit-patient">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Medical Record Dialog */}
      <Dialog open={viewRecordDialogOpen} onOpenChange={setViewRecordDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-view-record">
          <DialogHeader>
            <DialogTitle data-testid="text-view-record-title">{selectedViewRecord?.title || 'Medical Record'}</DialogTitle>
            <DialogDescription>
              Record details for patient {getPatientName(selectedViewRecord?.patientId || '')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedViewRecord && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Record Type</Label>
                  <p className="font-medium">{selectedViewRecord.recordType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">{selectedViewRecord.recordDate ? format(new Date(selectedViewRecord.recordDate), 'MMM dd, yyyy') : 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Physician</Label>
                <p className="font-medium">{selectedViewRecord.physician || 'N/A'}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="font-medium">{selectedViewRecord.description || 'No description provided'}</p>
              </div>
              
              {selectedViewRecord.fileName && (
                <div>
                  <Label className="text-muted-foreground">Attached File</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">
                      <FileText className="h-3 w-3 mr-1" />
                      {selectedViewRecord.fileName}
                    </Badge>
                    {selectedViewRecord.fileData && (
                      <Button size="sm" variant="outline" onClick={() => handleDownloadDoctorRecord(selectedViewRecord)}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {selectedViewRecord.fileData && selectedViewRecord.fileName?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) && (
                <div>
                  <Label className="text-muted-foreground">Image Preview</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <img 
                      src={`data:image/*;base64,${selectedViewRecord.fileData}`}
                      alt={selectedViewRecord.fileName}
                      className="max-w-full max-h-96 object-contain mx-auto"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRecordDialogOpen(false)} data-testid="button-close-view-record">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </SidebarProvider>
    </>
  );
}
