import { useState, useRef } from "react";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { DoctorPatient, Prescription, DoctorSchedule, Appointment, DoctorProfile } from "@shared/schema";
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
  Calendar,
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
  MoreVertical,
  Hospital,
  Camera,
  Loader2
} from "lucide-react";

interface DoctorPortalProps {
  doctorName: string;
  hospitalName: string;
  doctorId?: string;
  onLogout: () => void;
}

interface LocalNotification {
  id: string;
  title: string;
  message: string;
  type: "appointment" | "patient" | "system";
  isRead: boolean;
  createdAt: string;
}

const INITIAL_NOTIFICATIONS: LocalNotification[] = [
  { id: "n1", title: "New Appointment", message: "Rajesh Kumar has booked an appointment for Dec 2, 2024", type: "appointment", isRead: false, createdAt: "2024-12-01T08:00:00" },
  { id: "n2", title: "Lab Results Ready", message: "Blood test results for Amit Patel are available", type: "patient", isRead: false, createdAt: "2024-12-01T07:30:00" },
  { id: "n3", title: "Schedule Change", message: "Your Wednesday afternoon slot has been updated", type: "system", isRead: true, createdAt: "2024-11-30T16:00:00" },
  { id: "n4", title: "Appointment Cancelled", message: "Sunita Deshmukh cancelled her appointment for Dec 5", type: "appointment", isRead: true, createdAt: "2024-11-30T14:00:00" },
  { id: "n5", title: "System Update", message: "New prescription templates are now available", type: "system", isRead: true, createdAt: "2024-11-29T10:00:00" },
];

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
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [editingSchedule, setEditingSchedule] = useState<{day: string; slots: DoctorSchedule[]} | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [addPatientDialogOpen, setAddPatientDialogOpen] = useState(false);
  const [addPrescriptionDialogOpen, setAddPrescriptionDialogOpen] = useState(false);
  const [addScheduleDialogOpen, setAddScheduleDialogOpen] = useState(false);
  const [addAppointmentDialogOpen, setAddAppointmentDialogOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: `Dr. ${doctorName}`,
    specialty: "Cardiology",
    email: `${doctorName.toLowerCase().replace(' ', '.')}@gravityhospital.com`,
    phone: "+91 98765 00000",
    qualifications: "MBBS, MD (Cardiology), DM",
    experience: "15+ Years",
    bio: "",
    department: "Cardiology Department",
    languages: "English, Hindi, Marathi",
    consultationFee: "₹500"
  });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
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

  // Update profile form when data loads
  const updateProfileFormFromData = (data: DoctorProfile) => {
    setProfileForm({
      fullName: data.fullName || `Dr. ${doctorName}`,
      specialty: data.specialty || "Cardiology",
      email: data.email || `${doctorName.toLowerCase().replace(' ', '.')}@gravityhospital.com`,
      phone: data.phone || "+91 98765 00000",
      qualifications: data.qualifications || "MBBS, MD (Cardiology), DM",
      experience: data.experience || "15+ Years",
      bio: data.bio || "",
      department: data.department || "Cardiology Department",
      languages: data.languages || "English, Hindi, Marathi",
      consultationFee: data.consultationFee || "₹500"
    });
  };

  // Mutations for CRUD operations
  const createPatientMutation = useMutation({
    mutationFn: (patient: Omit<DoctorPatient, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiRequest('POST', '/api/doctor-patients', patient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doctor-patients', doctorId] });
      toast({ title: "Patient added successfully" });
      setAddPatientDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to add patient", variant: "destructive" }),
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: (prescription: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiRequest('POST', '/api/prescriptions', prescription),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions/doctor', doctorId] });
      toast({ title: "Prescription created successfully" });
      setAddPrescriptionDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to create prescription", variant: "destructive" }),
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

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileForm);
  };

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = allAppointments.filter(a => a.appointmentDate === today);
  const pendingAppointments = allAppointments.filter(a => a.status === "pending");
  const unreadNotifications = notifications.filter(n => !n.isRead);

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
      case "appointment": return <Calendar className="h-4 w-4 text-blue-500" />;
      case "patient": return <User className="h-4 w-4 text-green-500" />;
      case "system": return <Settings className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const filteredPatients = patients.filter(p => 
    p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.patientPhone && p.patientPhone.includes(searchQuery)) ||
    (p.patientEmail && p.patientEmail.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const menuItems = [
    { id: "dashboard", title: "Dashboard", icon: LayoutDashboard },
    { id: "appointments", title: "Appointments", icon: Calendar },
    { id: "schedules", title: "Schedules", icon: CalendarDays },
    { id: "patients", title: "Patients", icon: Users },
    { id: "prescriptions", title: "Prescriptions", icon: FileText },
    { id: "notifications", title: "Notifications", icon: Bell, badge: unreadNotifications.length },
    { id: "profile", title: "Profile", icon: Settings },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-welcome">Welcome, Dr. {doctorName}</h1>
          <p className="text-muted-foreground">Here's your overview for today</p>
        </div>
        <Button onClick={() => setActiveSection("appointments")} data-testid="button-new-appointment">
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-elevate" data-testid="stat-today-appointments">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
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
              <Calendar className="h-5 w-5 text-primary" />
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
              {notifications.slice(0, 4).map((notif) => (
                <div 
                  key={notif.id} 
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer ${notif.isRead ? 'bg-muted/30' : 'bg-primary/5 border border-primary/20'}`}
                  onClick={() => markNotificationRead(notif.id)}
                  data-testid={`notification-item-${notif.id}`}
                >
                  {getNotificationIcon(notif.type)}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!notif.isRead ? 'text-primary' : ''}`}>{notif.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                  </div>
                  {!notif.isRead && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
              ))}
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

      <Card data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks at your fingertips</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveSection("patients")} data-testid="button-add-patient">
              <Users className="h-5 w-5" />
              <span>Add Patient</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveSection("prescriptions")} data-testid="button-write-prescription">
              <FileText className="h-5 w-5" />
              <span>Write Prescription</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveSection("schedules")} data-testid="button-manage-schedule">
              <CalendarDays className="h-5 w-5" />
              <span>Manage Schedule</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveSection("appointments")} data-testid="button-view-appointments">
              <Calendar className="h-5 w-5" />
              <span>View Appointments</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPatients = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-patients-title">Patient Records</h1>
          <p className="text-muted-foreground">Manage your patient database</p>
        </div>
        <Dialog open={addPatientDialogOpen} onOpenChange={setAddPatientDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-new-patient">
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
              <DialogDescription>Enter patient details to add to your records</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createPatientMutation.mutate({
                doctorId,
                patientName: formData.get('patientName') as string,
                patientPhone: formData.get('patientPhone') as string,
                patientEmail: formData.get('patientEmail') as string || null,
                patientAge: parseInt(formData.get('patientAge') as string) || null,
                patientGender: formData.get('patientGender') as string || null,
                bloodGroup: formData.get('bloodGroup') as string || null,
                patientAddress: formData.get('patientAddress') as string || null,
                medicalHistory: formData.get('medicalHistory') as string || null,
                allergies: formData.get('allergies') as string || null,
                status: "active",
                lastVisit: new Date().toISOString().split('T')[0],
              });
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name *</Label>
                <Input id="patientName" name="patientName" required data-testid="input-patient-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientPhone">Phone *</Label>
                <Input id="patientPhone" name="patientPhone" required data-testid="input-patient-phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientEmail">Email</Label>
                <Input id="patientEmail" name="patientEmail" type="email" data-testid="input-patient-email" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="patientAge">Age</Label>
                  <Input id="patientAge" name="patientAge" type="number" data-testid="input-patient-age" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientGender">Gender</Label>
                  <Select name="patientGender">
                    <SelectTrigger data-testid="select-patient-gender">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                      <SelectItem value="O">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select name="bloodGroup">
                    <SelectTrigger data-testid="select-blood-group">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientAddress">Address</Label>
                <Input id="patientAddress" name="patientAddress" data-testid="input-patient-address" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicalHistory">Medical History</Label>
                <Textarea id="medicalHistory" name="medicalHistory" rows={3} data-testid="input-medical-history" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddPatientDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createPatientMutation.isPending} data-testid="button-submit-patient">
                  {createPatientMutation.isPending ? "Adding..." : "Add Patient"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-appointments-title">Appointments</h1>
          <p className="text-muted-foreground">Manage your appointment schedule</p>
        </div>
        <Dialog open={addAppointmentDialogOpen} onOpenChange={setAddAppointmentDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-appointment">
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
              <DialogDescription>Create a new appointment for a patient</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createAppointmentMutation.mutate({
                patientName: formData.get('patientName') as string,
                patientPhone: formData.get('patientPhone') as string,
                patientEmail: formData.get('patientEmail') as string || undefined,
                doctorId,
                appointmentDate: formData.get('appointmentDate') as string,
                timeSlot: formData.get('timeSlot') as string,
                symptoms: formData.get('symptoms') as string || undefined,
                status: "scheduled",
              });
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aptPatientName">Patient Name *</Label>
                  <Input id="aptPatientName" name="patientName" required data-testid="input-apt-patient-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aptPatientPhone">Phone *</Label>
                  <Input id="aptPatientPhone" name="patientPhone" required data-testid="input-apt-patient-phone" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="aptPatientEmail">Email</Label>
                <Input id="aptPatientEmail" name="patientEmail" type="email" data-testid="input-apt-patient-email" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appointmentDate">Date *</Label>
                  <Input id="appointmentDate" name="appointmentDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} data-testid="input-apt-date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeSlot">Time Slot *</Label>
                  <Select name="timeSlot" defaultValue="09:00 AM">
                    <SelectTrigger data-testid="select-time-slot">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="09:00 AM">09:00 AM</SelectItem>
                      <SelectItem value="09:30 AM">09:30 AM</SelectItem>
                      <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                      <SelectItem value="10:30 AM">10:30 AM</SelectItem>
                      <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                      <SelectItem value="11:30 AM">11:30 AM</SelectItem>
                      <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                      <SelectItem value="02:00 PM">02:00 PM</SelectItem>
                      <SelectItem value="02:30 PM">02:30 PM</SelectItem>
                      <SelectItem value="03:00 PM">03:00 PM</SelectItem>
                      <SelectItem value="03:30 PM">03:30 PM</SelectItem>
                      <SelectItem value="04:00 PM">04:00 PM</SelectItem>
                      <SelectItem value="04:30 PM">04:30 PM</SelectItem>
                      <SelectItem value="05:00 PM">05:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="symptoms">Symptoms / Reason</Label>
                <Textarea id="symptoms" name="symptoms" placeholder="Describe the symptoms or reason for visit" rows={3} data-testid="input-symptoms" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddAppointmentDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createAppointmentMutation.isPending} data-testid="button-submit-appointment">
                  {createAppointmentMutation.isPending ? "Creating..." : "Create Appointment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="today">
        <TabsList data-testid="tabs-appointments">
          <TabsTrigger value="today" data-testid="tab-today">Today ({todayAppointments.length})</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">Pending ({pendingAppointments.length})</TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">All ({allAppointments.length})</TabsTrigger>
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
                  <Button variant="outline" size="sm" data-testid={`button-view-apt-${apt.id}`}>
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setActiveSection("prescriptions"); setAddPrescriptionDialogOpen(true); }} data-testid={`button-prescribe-${apt.id}`}>
                    <FileText className="h-4 w-4 mr-1" />
                    Prescribe
                  </Button>
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
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{apt.appointmentDate} at {apt.timeSlot}</p>
                      {getStatusBadge(apt.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <div className="space-y-4">
            {allAppointments.map((apt) => (
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
            startTime: slot.startTime,
            endTime: slot.endTime,
            slotType: slot.slotType,
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
        startTime: "14:00",
        endTime: "18:00",
        slotType: "OPD",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-schedules-title">Weekly Schedule</h1>
          <p className="text-muted-foreground">Manage your OPD timings and availability</p>
        </div>
        <Button onClick={() => openScheduleEditor("Monday")} data-testid="button-add-slot">
          <Plus className="h-4 w-4 mr-2" />
          Add Time Slot
        </Button>
      </div>

      <Card data-testid="card-weekly-overview">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Weekly Overview
          </CardTitle>
          <CardDescription>Your availability across the week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 text-center mb-4">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => {
              const fullDay = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][idx];
              const daySlots = schedules.filter(s => s.day === fullDay && s.isAvailable);
              const hasSlots = daySlots.length > 0;
              return (
                <div 
                  key={day}
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${hasSlots ? 'bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-800' : 'bg-muted hover:bg-muted/80'}`}
                  onClick={() => openScheduleEditor(fullDay)}
                  data-testid={`overview-${day.toLowerCase()}`}
                >
                  <p className="font-medium text-sm">{day}</p>
                  <p className={`text-xs ${hasSlots ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'}`}>
                    {hasSlots ? `${daySlots.length} slot${daySlots.length > 1 ? 's' : ''}` : 'Off'}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
          const daySchedules = schedules.filter(s => s.day === day);
          const isAvailable = daySchedules.some(s => s.isAvailable);
          
          return (
            <Card key={day} className={!isAvailable ? "opacity-60" : ""} data-testid={`schedule-${day.toLowerCase()}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${isAvailable ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      <CalendarDays className={`h-6 w-6 ${isAvailable ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold">{day}</h4>
                      {isAvailable ? (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {daySchedules.filter(s => s.isAvailable).map((slot) => (
                            <Badge key={slot.id} variant="outline">
                              {slot.startTime} - {slot.endTime} ({slot.slotType})
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not Available</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={isAvailable} 
                      onCheckedChange={() => toggleDayAvailability(day)}
                      data-testid={`switch-${day.toLowerCase()}`} 
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => openScheduleEditor(day)}
                      data-testid={`button-edit-${day.toLowerCase()}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
                          {["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"].map(t => (
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
                          {["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>OPD / Department</Label>
                    <Select 
                      value={slot.slotType} 
                      onValueChange={(v) => updateSlotTime(slot.id, "slotType", v)}
                    >
                      <SelectTrigger data-testid={`select-opd-${idx}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cardiology OPD">Cardiology OPD</SelectItem>
                        <SelectItem value="General OPD">General OPD</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                        <SelectItem value="ICU Rounds">ICU Rounds</SelectItem>
                        <SelectItem value="Endocrinology">Endocrinology</SelectItem>
                        <SelectItem value="Neurology">Neurology</SelectItem>
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
        <Dialog open={addPrescriptionDialogOpen} onOpenChange={setAddPrescriptionDialogOpen}>
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
                  <Input id="rxPatientName" name="patientName" required data-testid="input-rx-patient-name" />
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
                <Button type="button" variant="outline" onClick={() => setAddPrescriptionDialogOpen(false)}>Cancel</Button>
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
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
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
            </CardContent>
            <CardFooter className="gap-2 border-t bg-muted/20">
              <Button variant="outline" size="sm" data-testid={`button-view-rx-${rx.id}`}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button variant="outline" size="sm" data-testid={`button-print-rx-${rx.id}`}>
                <FileText className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button variant="outline" size="sm" data-testid={`button-edit-rx-${rx.id}`}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-notifications-title">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with latest alerts</p>
        </div>
        <Button variant="outline" onClick={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))} data-testid="button-mark-all-read">
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark All Read
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList data-testid="tabs-notifications">
          <TabsTrigger value="all" data-testid="tab-notif-all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread" data-testid="tab-notif-unread">Unread ({unreadNotifications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="space-y-3">
            {notifications.map((notif) => (
              <Card 
                key={notif.id} 
                className={`hover-elevate cursor-pointer ${!notif.isRead ? 'border-primary/50' : ''}`}
                onClick={() => markNotificationRead(notif.id)}
                data-testid={`notif-card-${notif.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      notif.type === 'appointment' ? 'bg-blue-100 dark:bg-blue-900' :
                      notif.type === 'patient' ? 'bg-green-100 dark:bg-green-900' :
                      'bg-purple-100 dark:bg-purple-900'
                    }`}>
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium ${!notif.isRead ? 'text-primary' : ''}`}>{notif.title}</h4>
                        {!notif.isRead && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(notif.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="unread" className="mt-4">
          <div className="space-y-3">
            {unreadNotifications.length > 0 ? (
              unreadNotifications.map((notif) => (
                <Card 
                  key={notif.id} 
                  className="hover-elevate cursor-pointer border-primary/50"
                  onClick={() => markNotificationRead(notif.id)}
                  data-testid={`unread-notif-${notif.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        notif.type === 'appointment' ? 'bg-blue-100 dark:bg-blue-900' :
                        notif.type === 'patient' ? 'bg-green-100 dark:bg-green-900' :
                        'bg-purple-100 dark:bg-purple-900'
                      }`}>
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-primary">{notif.title}</h4>
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{new Date(notif.createdAt).toLocaleString()}</p>
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
    </div>
  );

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
            <Button 
              variant="outline" 
              className="w-full mt-4" 
              onClick={() => photoInputRef.current?.click()}
              disabled={isUploadingPhoto}
              data-testid="button-change-photo"
            >
              {isUploadingPhoto ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
              ) : (
                <><Camera className="h-4 w-4 mr-2" />Change Photo</>
              )}
            </Button>
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
              <p className="font-medium">Sane Chowk, Nair Colony, More Vasti, Chikhali, Pimpri-Chinchwad, Maharashtra 411062</p>
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

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold">Doctor Portal</span>
                <span className="text-xs text-muted-foreground truncate max-w-[140px]">{hospitalName}</span>
              </div>
            </div>
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
                  <p className="text-xs text-muted-foreground">Cardiologist</p>
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
    </SidebarProvider>
  );
}
