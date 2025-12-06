import { useState } from "react";
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
import type { DoctorPatient, Prescription, DoctorSchedule, Appointment } from "@shared/schema";
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
  Hospital
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
        <Button data-testid="button-add-new-patient">
          <Plus className="h-4 w-4 mr-2" />
          Add Patient
        </Button>
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
        <Button data-testid="button-create-appointment">
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
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
                    <Button size="sm" className="flex-1" data-testid={`button-confirm-${apt.id}`}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Confirm
                    </Button>
                  )}
                  {apt.status === "confirmed" && (
                    <Button size="sm" className="flex-1" data-testid={`button-complete-${apt.id}`}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                  )}
                  <Button variant="outline" size="sm" data-testid={`button-view-apt-${apt.id}`}>
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  <Button variant="outline" size="sm" data-testid={`button-prescribe-${apt.id}`}>
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
        <Button data-testid="button-new-prescription">
          <Plus className="h-4 w-4 mr-2" />
          New Prescription
        </Button>
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
            <Avatar className="h-32 w-32 mx-auto">
              <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                {doctorName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-semibold mt-4">Dr. {doctorName}</h3>
            <p className="text-muted-foreground">Cardiologist</p>
            <Badge className="mt-2">Senior Consultant</Badge>
            <Button variant="outline" className="w-full mt-4" data-testid="button-change-photo">
              Change Photo
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
                <Input defaultValue={`Dr. ${doctorName}`} data-testid="input-full-name" />
              </div>
              <div className="space-y-2">
                <Label>Specialty</Label>
                <Input defaultValue="Cardiology" data-testid="input-specialty" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input defaultValue={`${doctorName.toLowerCase().replace(' ', '.')}@galaxyhospital.com`} data-testid="input-email" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input defaultValue="+91 98765 00000" data-testid="input-phone" />
              </div>
              <div className="space-y-2">
                <Label>Qualifications</Label>
                <Input defaultValue="MBBS, MD (Cardiology), DM" data-testid="input-qualifications" />
              </div>
              <div className="space-y-2">
                <Label>Experience</Label>
                <Input defaultValue="15+ Years" data-testid="input-experience" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button data-testid="button-save-profile">Save Changes</Button>
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
              <p className="font-medium">Cardiology Department</p>
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
