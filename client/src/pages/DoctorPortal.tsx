import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import type { DoctorPatient, Prescription, DoctorSchedule, Appointment, DoctorProfile, UserNotification, MedicalRecord } from "@shared/schema";
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
  ExternalLink
} from "lucide-react";
import hospitalLogo from "@assets/LOGO_1_1765346562770.png";
import DoctorOathModal from "@/components/DoctorOathModal";

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
  const [activeSection, setActiveSection] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<DoctorPatient | null>(null);
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
  
  // Real-time database notifications with WebSocket support
  const { 
    notifications, 
    unreadNotifications, 
    unreadCount: unreadNotificationCount, 
    isLoading: notificationsLoading,
    markAsRead: markNotificationRead,
    markAllAsRead: markAllNotificationsRead,
    deleteNotification
  } = useNotifications({ userId: effectiveDoctorId, userRole: "DOCTOR" });
  const [editingSchedule, setEditingSchedule] = useState<{day: string; slots: DoctorSchedule[]} | null>(null);
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

  // Fetch doctor profile from API
  const { data: profileData, isLoading: profileLoading } = useQuery<DoctorProfile>({
    queryKey: ['/api/doctor-profiles', doctorId],
    retry: false,
  });

  // Fetch all medical records to show patient files in prescription form
  const { data: allMedicalRecords = [] } = useQuery<MedicalRecord[]>({
    queryKey: ['/api/medical-records'],
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
    mutationFn: ({ id, updates }: { id: string; updates: Partial<DoctorSchedule> }) =>
      apiRequest('PATCH', `/api/doctor-schedules/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doctor-schedules', doctorId] });
      toast({ title: "Schedule updated successfully" });
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
      apiRequest('POST', `/api/appointments/${id}/checkin`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({ title: "Appointment confirmed successfully" });
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
      toast({ title: "Profile updated successfully" });
    },
    onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
  });

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
  const doctorAppointments = allAppointments.filter(a => a.doctorId === effectiveDoctorId);
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

  const filteredPatients = patients.filter(p => 
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
    { id: "notifications", title: "Notifications", icon: Bell, badge: unreadNotifications.length },
    { id: "profile", title: "Profile", icon: Settings },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      <div>
          <h1 className="text-2xl font-bold" data-testid="text-welcome">Welcome, Dr. {doctorName}</h1>
          <p className="text-muted-foreground">Here's your overview for today</p>
        </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-elevate" data-testid="stat-today-appointments">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-today-count">{todayAppointments.length}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +2 from yesterday
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="stat-pending">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Appointments</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-count">{pendingAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Requires confirmation</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="stat-patients">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-patients-count">{patients.length}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +12 this week
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="stat-prescriptions">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescriptions Today</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prescriptions.length}</div>
            <p className="text-xs text-muted-foreground">Written today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card data-testid="card-today-schedule">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Today's Appointments
            </CardTitle>
            <CardDescription>Your scheduled appointments for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayAppointments.slice(0, 4).map((apt) => (
                <div 
                  key={apt.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-elevate cursor-pointer"
                  onClick={() => { setSelectedAppointment(apt); setActiveSection("appointments"); }}
                  data-testid={`appointment-item-${apt.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{apt.patientName}</p>
                      <p className="text-sm text-muted-foreground">{apt.symptoms || "General checkup"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{apt.timeSlot}</p>
                    {getStatusBadge(apt.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => setActiveSection("appointments")} data-testid="button-view-all-appointments">
              View All Appointments
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>

        <Card data-testid="card-notifications">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Recent Notifications
              {unreadNotifications.length > 0 && (
                <Badge variant="destructive" className="ml-2">{unreadNotifications.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>Latest updates and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 4).map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer hover-elevate ${notif.isRead ? 'bg-muted/30' : 'bg-primary/5 border border-primary/20'}`}
                    onClick={() => openNotificationDetail(notif)}
                    data-testid={`notification-item-${notif.id}`}
                  >
                    {getNotificationIcon(notif.type)}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${!notif.isRead ? 'text-primary' : ''}`}>{notif.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!notif.isRead && <div className="h-2 w-2 rounded-full bg-primary" />}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => setActiveSection("notifications")} data-testid="button-view-all-notifications">
              View All Notifications
              <ChevronRight className="h-4 w-4 ml-2" />
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
              <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-patient-${patient.id}`}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button variant="outline" size="sm" className="flex-1" data-testid={`button-edit-patient-${patient.id}`}>
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
                  <div className="flex items-center justify-between">
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
                  <div className="flex items-center justify-between">
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
                  <div className="flex items-center justify-between">
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
          updateScheduleMutation.mutate({ id: slot.id, updates: slot });
        }
      });
      setScheduleDialogOpen(false);
      setEditingSchedule(null);
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
        location: null,
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
      setEditingSchedule({
        ...editingSchedule,
        slots: editingSchedule.slots.filter(s => s.id !== slotId)
      });
    }
  };

  const renderSchedules = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={() => openScheduleEditor("Monday")} data-testid="button-add-slot">
          <Plus className="h-4 w-4 mr-2" />
          Add Time Slot
        </Button>
      </div>

      <Card data-testid="card-schedule-calendar">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Schedule Calendar
              </CardTitle>
              <CardDescription>Your weekly availability and monthly view</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold min-w-[140px] text-center">
                {format(calendarMonth, "MMMM yyyy")}
              </span>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                data-testid="button-next-month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-7 gap-1 text-center border border-border/50 rounded-lg overflow-hidden">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => {
              const fullDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][idx];
              const daySlots = schedules.filter(s => s.day === fullDay && s.isAvailable);
              const hasSlots = daySlots.length > 0;
              return (
                <div 
                  key={day}
                  className={`py-3 px-2 cursor-pointer transition-all ${hasSlots ? 'bg-green-600/20 dark:bg-green-700/30 hover:bg-green-600/30 dark:hover:bg-green-700/40' : 'bg-muted/30 hover:bg-muted/50'} ${idx > 0 ? 'border-l border-border/30' : ''}`}
                  onClick={() => openScheduleEditor(fullDay)}
                  data-testid={`overview-${day.toLowerCase()}`}
                >
                  <p className="font-medium text-sm">{day}</p>
                  <p className={`text-xs mt-0.5 ${hasSlots ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>
                    {hasSlots ? `${daySlots.length} slot${daySlots.length > 1 ? 's' : ''}` : 'Off'}
                  </p>
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
              cell: "relative min-h-[90px] p-3 text-left align-top hover:bg-muted/30 transition-colors cursor-pointer border-t border-border/20 flex-1",
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
                const hasSlots = daySlots.length > 0;
                return (
                  <div className="flex flex-col gap-1">
                    <span className={hasSlots ? "text-green-600 dark:text-green-400 font-semibold" : ""}>{date.getDate()}</span>
                    {hasSlots && (
                      <span className="text-xs text-amber-500">
                        {daySlots.length} slot{daySlots.length > 1 ? 's' : ''}
                      </span>
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
            <div className="flex items-center justify-between">
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
                      startTime: "09:00",
                      endTime: "12:00",
                      slotType: "OPD",
                      location: null,
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
            
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-4 pr-4">
                {getSchedulesForDate(selectedCalendarDate).length > 0 ? (
                  getSchedulesForDate(selectedCalendarDate).map((slot) => (
                    <Card 
                      key={slot.id} 
                      className={`${!slot.isAvailable ? 'opacity-60 border-dashed' : ''}`} 
                      data-testid={`sheet-slot-${slot.id}`}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
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
                              value={slot.slotType} 
                              onValueChange={(v) => updateScheduleMutation.mutate({ id: slot.id, updates: { slotType: v }})}
                            >
                              <SelectTrigger data-testid={`select-dept-${slot.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pune - Koregaon Park">Pune - Koregaon Park</SelectItem>
                                <SelectItem value="Pune - Shivaji Nagar">Pune - Shivaji Nagar</SelectItem>
                                <SelectItem value="Pune - Kothrud">Pune - Kothrud</SelectItem>
                                <SelectItem value="Pune - Hadapsar">Pune - Hadapsar</SelectItem>
                                <SelectItem value="Pune - Wakad">Pune - Wakad</SelectItem>
                                <SelectItem value="Pune - Baner">Pune - Baner</SelectItem>
                                <SelectItem value="Pune - Aundh">Pune - Aundh</SelectItem>
                                <SelectItem value="Pune - Viman Nagar">Pune - Viman Nagar</SelectItem>
                                <SelectItem value="Pune - Hinjewadi">Pune - Hinjewadi</SelectItem>
                                <SelectItem value="Pune - Deccan">Pune - Deccan</SelectItem>
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
                  <div className="flex items-center justify-between">
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
                        <SelectItem value="Pune - Koregaon Park">Pune - Koregaon Park</SelectItem>
                        <SelectItem value="Pune - Shivaji Nagar">Pune - Shivaji Nagar</SelectItem>
                        <SelectItem value="Pune - Kothrud">Pune - Kothrud</SelectItem>
                        <SelectItem value="Pune - Hadapsar">Pune - Hadapsar</SelectItem>
                        <SelectItem value="Pune - Wakad">Pune - Wakad</SelectItem>
                        <SelectItem value="Pune - Baner">Pune - Baner</SelectItem>
                        <SelectItem value="Pune - Aundh">Pune - Aundh</SelectItem>
                        <SelectItem value="Pune - Viman Nagar">Pune - Viman Nagar</SelectItem>
                        <SelectItem value="Pune - Hinjewadi">Pune - Hinjewadi</SelectItem>
                        <SelectItem value="Pune - Deccan">Pune - Deccan</SelectItem>
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

  const renderPrescriptions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-prescriptions-title">Prescriptions</h1>
          <p className="text-muted-foreground">Manage and create prescriptions</p>
        </div>
        <Dialog open={addPrescriptionDialogOpen} onOpenChange={(open) => {
          setAddPrescriptionDialogOpen(open);
          if (!open) {
            setPatientSearchQuery("");
            setSelectedPatientForRx("");
            setSelectedPatientRecordId("");
            setShowPatientDropdown(false);
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-prescription">
              <Plus className="h-4 w-4 mr-2" />
              New Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Prescription</DialogTitle>
              <DialogDescription>Create a prescription for a patient</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const medicinesStr = formData.get('medicines') as string;
              const patientName = formData.get('patientName') as string;
              createPrescriptionMutation.mutate({
                doctorId,
                doctorName: doctorName,
                patientId: `rx-patient-${Date.now()}`,
                patientName: patientName,
                diagnosis: formData.get('diagnosis') as string,
                medicines: medicinesStr.split(',').map(m => m.trim()).filter(Boolean),
                instructions: formData.get('instructions') as string || null,
                prescriptionDate: formData.get('prescriptionDate') as string,
                followUpDate: formData.get('followUpDate') as string || null,
                status: 'active',
              });
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rxPatientName">Patient Name *</Label>
                  <div className="relative">
                    <Input 
                      id="rxPatientName" 
                      name="patientName" 
                      required 
                      value={selectedPatientForRx || patientSearchQuery}
                      onChange={(e) => {
                        setPatientSearchQuery(e.target.value);
                        setSelectedPatientForRx("");
                        setShowPatientDropdown(true);
                      }}
                      onFocus={() => setShowPatientDropdown(true)}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowPatientDropdown(false);
                        }, 200);
                      }}
                      placeholder="Type to search patients..."
                      autoComplete="off"
                      data-testid="input-rx-patient-name" 
                    />
                    <input type="hidden" name="patientNameHidden" value={selectedPatientForRx || patientSearchQuery} />
                    {showPatientDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {appointmentPatients.length > 0 && (
                          <div className="p-2">
                            <p className="text-xs font-medium text-muted-foreground px-2 py-1">Patients with Appointments</p>
                            {appointmentPatients
                              .filter(p => 
                                !patientSearchQuery || 
                                p.name.toLowerCase().includes(patientSearchQuery.toLowerCase())
                              )
                              .slice(0, 10)
                              .map((patient, index) => (
                                <button
                                  key={patient.id || `apt-patient-${index}`}
                                  type="button"
                                  className="w-full px-3 py-2 text-left hover-elevate rounded-md flex items-center gap-2"
                                  onClick={() => {
                                    setSelectedPatientForRx(patient.name);
                                    setPatientSearchQuery("");
                                    setShowPatientDropdown(false);
                                  }}
                                  data-testid={`patient-option-${index}`}
                                >
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">{patient.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">{patient.name}</p>
                                    {patient.phone && <p className="text-xs text-muted-foreground">{patient.phone}</p>}
                                  </div>
                                </button>
                              ))}
                          </div>
                        )}
                        {patientSearchQuery && !appointmentPatients.some(p => p.name.toLowerCase() === patientSearchQuery.toLowerCase()) && (
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left hover-elevate flex items-center gap-2 border-t"
                            onClick={() => {
                              setSelectedPatientForRx(patientSearchQuery);
                              setShowPatientDropdown(false);
                            }}
                          >
                            <Plus className="h-4 w-4 text-primary" />
                            <span>Add "{patientSearchQuery}" as new patient</span>
                          </button>
                        )}
                        {appointmentPatients.length === 0 && !patientSearchQuery && (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No patients with appointments found. Type a name to add a new patient.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prescriptionDate">Date *</Label>
                  <Input id="prescriptionDate" name="prescriptionDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} data-testid="input-prescription-date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis *</Label>
                <Input id="diagnosis" name="diagnosis" required data-testid="input-diagnosis" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicines">Medicines (comma separated) *</Label>
                <Textarea id="medicines" name="medicines" placeholder="e.g., Paracetamol 500mg, Amoxicillin 250mg" required rows={3} data-testid="input-medicines" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea id="instructions" name="instructions" placeholder="Dosage instructions and special notes" rows={3} data-testid="input-instructions" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="followUpDate">Follow-up Date</Label>
                <Input id="followUpDate" name="followUpDate" type="date" data-testid="input-followup-date" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setAddPrescriptionDialogOpen(false);
                  setPatientSearchQuery("");
                  setSelectedPatientForRx("");
                  setSelectedPatientRecordId("");
                  setShowPatientDropdown(false);
                }}>Cancel</Button>
                <Button type="submit" disabled={createPrescriptionMutation.isPending} data-testid="button-submit-prescription">
                  {createPrescriptionMutation.isPending ? "Creating..." : "Create Prescription"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
                const printContent = `
                  <html>
                    <head>
                      <title>Prescription - ${rx.patientName}</title>
                      <style>
                        body { font-family: Arial, sans-serif; padding: 40px; }
                        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
                        .hospital { font-size: 24px; font-weight: bold; color: #1a56db; }
                        .section { margin: 20px 0; }
                        .label { font-weight: bold; color: #666; }
                        .value { margin-top: 5px; }
                        .medicines { display: flex; gap: 10px; flex-wrap: wrap; }
                        .medicine { background: #e5e7eb; padding: 5px 10px; border-radius: 5px; }
                        .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <div class="hospital">Gravity Hospital</div>
                        <div>Medical Prescription</div>
                      </div>
                      <div class="section">
                        <div class="label">Patient Name</div>
                        <div class="value">${rx.patientName}</div>
                      </div>
                      <div class="section">
                        <div class="label">Date</div>
                        <div class="value">${rx.prescriptionDate}</div>
                      </div>
                      <div class="section">
                        <div class="label">Diagnosis</div>
                        <div class="value">${rx.diagnosis}</div>
                      </div>
                      <div class="section">
                        <div class="label">Medicines</div>
                        <div class="medicines">${rx.medicines.map(m => `<span class="medicine">${m}</span>`).join('')}</div>
                      </div>
                      <div class="section">
                        <div class="label">Instructions</div>
                        <div class="value">${rx.instructions || 'N/A'}</div>
                      </div>
                      ${rx.followUpDate ? `<div class="section"><div class="label">Follow-up Date</div><div class="value">${rx.followUpDate}</div></div>` : ''}
                      <div class="footer">
                        <div>Prescribed by: Dr. ${doctorName}</div>
                        <div>Gravity Hospital - Pimpri-Chinchwad</div>
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
        <div className={`flex h-screen w-full ${!hasAcceptedOath ? 'pointer-events-none blur-sm' : ''}`}>
          <Sidebar>
            <SidebarHeader className="py-3 px-2">
                <img 
                  src={hospitalLogo} 
                  alt="Gravity Hospital" 
                  className="w-full max-w-[210px] h-[56px] object-contain"
                  data-testid="img-doctor-portal-logo"
                />
            </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton asChild data-testid={`nav-${item.id}`}>
                        <Button
                          variant={activeSection === item.id ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => setActiveSection(item.id)}
                        >
                          <item.icon className="h-4 w-4 mr-2" />
                          <span className="flex-1 text-left">{item.title}</span>
                          {item.badge && item.badge > 0 && (
                            <Badge variant="destructive" className="ml-auto">{item.badge}</Badge>
                          )}
                        </Button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4">
            <div className="p-3 bg-card rounded-lg mb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {doctorName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Dr. {doctorName}</p>
                  <p className="text-xs text-muted-foreground">{matchedDoctor?.specialty || 'Specialist'}</p>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={onLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-2 p-3 border-b bg-background/95 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h2 className="font-semibold capitalize">{activeSection}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => setActiveSection("notifications")}
                data-testid="button-header-notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                    {unreadNotifications.length}
                  </span>
                )}
              </Button>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
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
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Patient Name</h4>
                  <p className="text-sm font-medium" data-testid="view-rx-patient">{selectedPrescription.patientName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                  <Badge variant={selectedPrescription.status === 'active' ? 'default' : 'secondary'}>
                    {selectedPrescription.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Diagnosis</h4>
                <p className="text-sm bg-muted/50 rounded-lg p-3" data-testid="view-rx-diagnosis">{selectedPrescription.diagnosis}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Medicines</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPrescription.medicines.map((med, idx) => (
                    <Badge key={idx} variant="secondary" className="font-normal">
                      <Pill className="h-3 w-3 mr-1" />
                      {med}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Instructions</h4>
                <p className="text-sm bg-muted/50 rounded-lg p-3" data-testid="view-rx-instructions">{selectedPrescription.instructions || 'No special instructions'}</p>
              </div>

              {selectedPrescription.followUpDate && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Follow-up Date</h4>
                  <p className="text-sm" data-testid="view-rx-followup">{selectedPrescription.followUpDate}</p>
                </div>
              )}
            </div>
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
      </SidebarProvider>
    </>
  );
}
