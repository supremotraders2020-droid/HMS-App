import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
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
import type { Doctor, Appointment, MedicalRecord, UserNotification, Prescription } from "@shared/schema";
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
  Sparkles
} from "lucide-react";
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
  { id: "koregaon_park", name: "Gravity Hospital - Koregaon Park" },
  { id: "hinjewadi", name: "Gravity Hospital - Hinjewadi" },
  { id: "kothrud", name: "Gravity Hospital - Kothrud" },
  { id: "wakad", name: "Gravity Hospital - Wakad" },
  { id: "viman_nagar", name: "Gravity Hospital - Viman Nagar" },
  { id: "baner", name: "Gravity Hospital - Baner" },
  { id: "aundh", name: "Gravity Hospital - Aundh" },
  { id: "kalyani_nagar", name: "Gravity Hospital - Kalyani Nagar" },
  { id: "pimpri", name: "Gravity Hospital - Pimpri" },
  { id: "nigdi", name: "Gravity Hospital - Nigdi (Main)" },
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
      toast({ title: "Profile Updated", description: "Your profile has been saved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save profile", variant: "destructive" });
    }
  });

  // Book appointment mutation
  const bookAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: {
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
      const response = await apiRequest('POST', '/api/appointments', {
        ...appointmentData,
        symptoms: appointmentData.reason,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
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
      toast({ 
        title: "Booking Failed", 
        description: error?.message || "Failed to book appointment. Please try again.", 
        variant: "destructive" 
      });
    }
  });

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  // Fetch medical records with real-time sync (refetch every 3 seconds)
  const { data: medicalRecords = [] } = useQuery<MedicalRecord[]>({
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

  // Fetch prescriptions for this patient
  const { data: patientPrescriptions = [] } = useQuery<Prescription[]>({
    queryKey: ['/api/prescriptions/patient', encodeURIComponent(patientName)],
    refetchInterval: 3000, // Real-time sync
  });

  // Filter records for this patient (by username)
  const patientRecords = medicalRecords.filter(r => 
    r.patientId === username || r.patientId === patientId || r.patientId === patientName
  );

  const upcomingAppointments = appointments.filter(a => a.status === "scheduled");
  const unreadNotifications = unreadCount;

  const allTimeSlots = [
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

  const getAvailableSlots = () => {
    if (!selectedDoctor || !selectedDate) return allTimeSlots;
    const bookedSlots = appointments
      .filter(a => 
        a.doctorId === selectedDoctor && 
        a.appointmentDate === selectedDate &&
        a.status !== "cancelled" && 
        a.status !== "completed"
      )
      .map(a => a.timeSlot);
    return allTimeSlots.filter(slot => !bookedSlots.includes(slot.value));
  };

  const availableSlots = getAvailableSlots();

  // Handle view medical record
  const handleViewRecord = (record: MedicalRecord) => {
    if (record.fileData) {
      // Open file in new tab
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>${record.title}</title></head>
            <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#1a1a1a;">
              ${record.fileType?.startsWith('image/') 
                ? `<img src="${record.fileData}" style="max-width:100%; max-height:100vh;" />`
                : record.fileType === 'application/pdf'
                  ? `<iframe src="${record.fileData}" style="width:100%; height:100vh; border:none;"></iframe>`
                  : `<div style="color:white; font-size:18px; padding:40px;">
                      <h2>${record.title}</h2>
                      <p><strong>Type:</strong> ${record.recordType}</p>
                      <p><strong>Physician:</strong> ${record.physician}</p>
                      <p><strong>Description:</strong> ${record.description}</p>
                      <p><strong>Date:</strong> ${record.recordDate ? format(new Date(record.recordDate), 'PPP') : 'N/A'}</p>
                    </div>`
              }
            </body>
          </html>
        `);
      }
    } else {
      // Show record details in toast if no file
      toast({
        title: record.title,
        description: `${record.description} - By ${record.physician}`,
      });
    }
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
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "opd", label: "Book Appointment", icon: Calendar },
    { id: "records", label: "Health Records", icon: FileText },
    { id: "admission", label: "Admission", icon: BedDouble },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadNotifications },
    { id: "team", label: "Our Doctors", icon: Users },
    { id: "chatbot", label: "Health Assistant", icon: MessageCircle },
    { id: "profile", label: "My Profile", icon: User },
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
              <SidebarMenu>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton 
                      onClick={() => setActiveSection(item.id)}
                      isActive={activeSection === item.id}
                      tooltip={item.label}
                      data-testid={`nav-${item.id}`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="flex-1">{item.label}</span>
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

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
              <h2 className="text-2xl font-bold mb-2" data-testid="text-welcome">Welcome back, {patientName}!</h2>
              <p className="opacity-90">Your health, our priority. Here's your health summary.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="hover-elevate" data-testid="card-total-appointments">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-appointments">{appointments.length || 12}</div>
                  <p className="text-xs text-muted-foreground">Lifetime visits</p>
                </CardContent>
              </Card>
              <Card className="hover-elevate" data-testid="card-upcoming">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-upcoming">{upcomingAppointments.length || 2}</div>
                  <p className="text-xs text-muted-foreground">Scheduled appointments</p>
                </CardContent>
              </Card>
              <Card className="hover-elevate" data-testid="card-records">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Health Records</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-records">{patientRecords.length}</div>
                  <p className="text-xs text-muted-foreground">Medical documents</p>
                </CardContent>
              </Card>
              <Card className="hover-elevate" data-testid="card-bills">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Bills</CardTitle>
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-bills">₹2,500</div>
                  <p className="text-xs text-muted-foreground">Outstanding amount</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card data-testid="card-upcoming-appointments">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Upcoming Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.slice(0, 3).map((apt) => (
                      <div key={apt.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50" data-testid={`appointment-item-${apt.id}`}>
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Stethoscope className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Doctor Consultation</p>
                          <p className="text-sm text-muted-foreground">Doctor ID: {apt.doctorId}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{apt.appointmentDate}</p>
                          <p className="text-sm text-muted-foreground">{apt.timeSlot}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No upcoming appointments</p>
                      <Button className="mt-4" onClick={() => setActiveSection("opd")} data-testid="button-book-from-empty">
                        Book Appointment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-recent-records">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Recent Health Records
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {patientRecords.length > 0 ? patientRecords.slice(0, 3).map((record) => (
                    <div key={record.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50" data-testid={`record-item-${record.id}`}>
                      {getRecordIcon(record.recordType)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{record.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {record.recordDate ? format(new Date(record.recordDate), 'yyyy-MM-dd') : 'N/A'}
                        </p>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleViewRecord(record)}
                        data-testid={`button-view-record-${record.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  )) : (
                    <p className="text-muted-foreground text-center py-4">No health records yet</p>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => setActiveSection("records")}
                    data-testid="button-view-all-records"
                  >
                    View All Records
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card data-testid="card-quick-actions">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks at your fingertips</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Book Appointment", icon: Calendar, section: "opd", color: "bg-blue-500" },
                    { label: "View Records", icon: FileText, section: "records", color: "bg-green-500" },
                    { label: "Pay Bills", icon: CreditCard, section: "admission", color: "bg-orange-500" },
                    { label: "Chat with Us", icon: MessageCircle, section: "chatbot", color: "bg-purple-500" },
                  ].map((action) => (
                    <button
                      key={action.label}
                      onClick={() => setActiveSection(action.section)}
                      className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors text-left"
                      data-testid={`action-${action.section}`}
                    >
                      <div className={`h-12 w-12 rounded-xl ${action.color} flex items-center justify-center`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <span className="font-medium">{action.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "opd":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" data-testid="text-opd-title">Book an Appointment</h2>
              <p className="text-muted-foreground">Choose a department and doctor to schedule your visit</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {DEPARTMENTS.map((dept) => (
                <Card 
                  key={dept.id} 
                  className={`cursor-pointer text-center transition-all ${selectedDepartment === dept.name ? "ring-2 ring-primary bg-primary/5" : "hover-elevate"}`}
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
                  <CardContent className="pt-6">
                    <div className={`h-12 w-12 mx-auto rounded-xl ${selectedDepartment === dept.name ? "bg-primary/20" : "bg-muted"} flex items-center justify-center mb-3`}>
                      <dept.icon className={`h-6 w-6 ${dept.color}`} />
                    </div>
                    <p className="font-medium text-sm">{dept.name}</p>
                  </CardContent>
                </Card>
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
                          <span className="text-sm font-semibold">₹500</span>
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
              <Card className="border-primary" data-testid="card-booking-form">
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
                      <Label>Location</Label>
                      <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                        <SelectTrigger data-testid="select-location">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOCATIONS.map((loc) => (
                            <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Preferred Date</Label>
                      <Input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(""); }}
                        min={new Date().toISOString().split("T")[0]}
                        data-testid="input-appointment-date"
                      />
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
                      bookAppointmentMutation.mutate({
                        doctorId: selectedDoctor,
                        patientId: username,
                        patientName: patientName,
                        patientPhone: profileForm.phone || "+91 98765 43210",
                        appointmentDate: selectedDate,
                        timeSlot: selectedSlot,
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
              );
            })()}
          </div>
        );

      case "records":
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold" data-testid="text-records-title">Health Records</h2>
                <p className="text-muted-foreground">View and download your medical documents</p>
              </div>
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

            {/* Prescriptions Section */}
            {patientPrescriptions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Pill className="h-5 w-5 text-green-500" />
                  My Prescriptions ({patientPrescriptions.length})
                </h3>
                <div className="grid gap-4">
                  {patientPrescriptions.map((rx) => (
                    <Card key={rx.id} className="hover-elevate" data-testid={`prescription-card-${rx.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <h4 className="font-semibold" data-testid={`rx-diagnosis-${rx.id}`}>{rx.diagnosis}</h4>
                              <Badge variant={rx.status === 'active' ? 'default' : 'secondary'}>
                                {rx.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Prescribed by {rx.doctorName} on {rx.prescriptionDate}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {rx.medicines.map((med, idx) => (
                                <Badge key={idx} variant="secondary" className="font-normal">
                                  <Pill className="h-3 w-3 mr-1" />
                                  {med}
                                </Badge>
                              ))}
                            </div>
                            {rx.instructions && (
                              <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                <strong>Instructions:</strong> {rx.instructions}
                              </p>
                            )}
                            {rx.followUpDate && (
                              <p className="text-sm text-primary">
                                <strong>Follow-up:</strong> {rx.followUpDate}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => {
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
                                        <div>Prescribed by: ${rx.doctorName}</div>
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
                              }}
                              data-testid={`button-print-rx-${rx.id}`}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Medical Records Section */}
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
          </div>
        );

      case "admission":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-admission-title">Admission Details</h2>
              <p className="text-muted-foreground">View your current admission status and billing</p>
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
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Room Charges (3 days)</span>
                      <span className="font-medium">₹6,000</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Doctor Consultation</span>
                      <span className="font-medium">₹2,500</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Lab Tests</span>
                      <span className="font-medium">₹3,500</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Medicines</span>
                      <span className="font-medium">₹1,500</span>
                    </div>
                    <div className="flex justify-between py-2 border-b text-lg font-semibold">
                      <span>Total</span>
                      <span data-testid="text-total">₹13,500</span>
                    </div>
                    <div className="flex justify-between py-2 border-b text-green-600">
                      <span>Paid</span>
                      <span data-testid="text-paid">- ₹11,000</span>
                    </div>
                    <div className="flex justify-between py-2 text-lg font-bold text-orange-600">
                      <span>Balance Due</span>
                      <span data-testid="text-balance">₹2,500</span>
                    </div>
                  </div>

                  <Button className="w-full" data-testid="button-pay-now">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold" data-testid="text-notifications-title">Notifications</h2>
                <p className="text-muted-foreground">Stay updated with your health alerts</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                data-testid="button-mark-all-read"
                onClick={() => markAllAsRead()}
              >
                Mark all as read
              </Button>
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
                                {meta.location && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Location:</span>
                                    <span className="font-medium">{meta.location}</span>
                                  </div>
                                )}
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
                        <span className="text-sm font-semibold">₹500</span>
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

      case "chatbot":
        return (
          <div className="max-w-2xl mx-auto">
            <Card className="h-[600px] flex flex-col" data-testid="card-chatbot">
              <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-primary/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle>Health Assistant</CardTitle>
                    <CardDescription>AI-powered healthcare support</CardDescription>
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
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-profile-title">My Profile</h2>
              <p className="text-muted-foreground">Manage your personal information</p>
            </div>

            <Card data-testid="card-profile">
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

      default:
        return null;
    }
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <PatientSidebar />
        <div className="flex flex-col flex-1">
          <header className="h-16 border-b bg-card px-4 flex items-center justify-between lg:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-lg font-semibold" data-testid="text-page-title">
                  {navigationItems.find(n => n.id === activeSection)?.label || "Dashboard"}
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Gravity Hospital, Nigdi
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="icon" 
                variant="ghost"
                onClick={() => setActiveSection("notifications")}
                className="relative"
                data-testid="button-header-notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
                )}
              </Button>
              <ThemeToggle />
            </div>
          </header>

          <ScrollArea className="flex-1">
            <main className="p-4 lg:p-6">
              {renderContent()}
            </main>
          </ScrollArea>
        </div>
      </div>
    </SidebarProvider>
  );
}
