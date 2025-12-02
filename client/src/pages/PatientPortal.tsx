import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import { format } from "date-fns";
import type { Doctor, Appointment } from "@shared/schema";
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

interface PatientPortalProps {
  patientName: string;
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

const MOCK_HEALTH_RECORDS = [
  { id: "1", type: "lab_report", title: "Complete Blood Count (CBC)", date: "2024-11-28", doctor: "Dr. Priya Sharma", department: "Pathology", status: "completed" },
  { id: "2", type: "prescription", title: "Medication Prescription", date: "2024-11-25", doctor: "Dr. Rajesh Kumar", department: "Cardiology", status: "active" },
  { id: "3", type: "diagnostic", title: "Chest X-Ray Report", date: "2024-11-20", doctor: "Dr. Kavita Joshi", department: "Radiology", status: "completed" },
  { id: "4", type: "vaccination", title: "COVID-19 Booster", date: "2024-10-15", doctor: "Dr. Anjali Patel", department: "General Medicine", status: "completed" },
  { id: "5", type: "lab_report", title: "Lipid Profile", date: "2024-10-10", doctor: "Dr. Priya Sharma", department: "Pathology", status: "completed" },
];

const MOCK_NOTIFICATIONS = [
  { id: "1", type: "appointment", title: "Appointment Reminder", message: "Your appointment with Dr. Rajesh Kumar is tomorrow at 10:00 AM", time: "2 hours ago", read: false },
  { id: "2", type: "lab_result", title: "Lab Results Ready", message: "Your CBC test results are now available. Click to view.", time: "1 day ago", read: false },
  { id: "3", type: "payment", title: "Payment Due", message: "Outstanding balance of ₹2,500 for consultation on Nov 25", time: "3 days ago", read: true },
  { id: "4", type: "general", title: "Health Tip", message: "Stay hydrated! Drink at least 8 glasses of water daily.", time: "1 week ago", read: true },
];

const MOCK_TEAM = [
  { id: "1", name: "Dr. Priya Sharma", specialty: "Cardiology", qualification: "MD, DM Cardiology", experience: 15, rating: 4.9, available: true },
  { id: "2", name: "Dr. Rajesh Kumar", specialty: "Neurology", qualification: "MD, DM Neurology", experience: 12, rating: 4.8, available: true },
  { id: "3", name: "Dr. Anjali Patel", specialty: "Pediatrics", qualification: "MD Pediatrics", experience: 10, rating: 4.9, available: false },
  { id: "4", name: "Dr. Suresh Reddy", specialty: "Orthopedics", qualification: "MS Orthopedics", experience: 18, rating: 4.7, available: true },
  { id: "5", name: "Dr. Meera Gupta", specialty: "Dermatology", qualification: "MD Dermatology", experience: 8, rating: 4.8, available: true },
  { id: "6", name: "Dr. Vikram Singh", specialty: "General Medicine", qualification: "MD Medicine", experience: 20, rating: 4.9, available: true },
];

export default function PatientPortal({ patientName, onLogout }: PatientPortalProps) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "bot"; content: string }>>([
    { role: "bot", content: "Hello! I'm your healthcare assistant. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const { toast } = useToast();

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const upcomingAppointments = appointments.filter(a => a.status === "scheduled");
  const unreadNotifications = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

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
        <SidebarHeader className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <h2 className="font-bold text-lg">Gravity Hospital</h2>
              <p className="text-xs text-muted-foreground">Patient Portal</p>
            </div>
          </div>
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
                  <div className="text-2xl font-bold" data-testid="text-records">{MOCK_HEALTH_RECORDS.length}</div>
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
                  {MOCK_HEALTH_RECORDS.slice(0, 3).map((record) => (
                    <div key={record.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50" data-testid={`record-item-${record.id}`}>
                      {getRecordIcon(record.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{record.title}</p>
                        <p className="text-xs text-muted-foreground">{record.date}</p>
                      </div>
                      <Button size="icon" variant="ghost" data-testid={`button-view-record-${record.id}`}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
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
                  className="cursor-pointer hover-elevate text-center"
                  onClick={() => toast({ title: "Department Selected", description: `Showing doctors in ${dept.name}` })}
                  data-testid={`dept-${dept.id}`}
                >
                  <CardContent className="pt-6">
                    <div className={`h-12 w-12 mx-auto rounded-xl bg-muted flex items-center justify-center mb-3`}>
                      <dept.icon className={`h-6 w-6 ${dept.color}`} />
                    </div>
                    <p className="font-medium text-sm">{dept.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Available Doctors</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(doctors.length > 0 ? doctors : MOCK_TEAM).map((doctor: any) => (
                  <Card 
                    key={doctor.id} 
                    className={`cursor-pointer transition-all ${selectedDoctor === doctor.id ? "ring-2 ring-primary" : "hover-elevate"}`}
                    onClick={() => setSelectedDoctor(doctor.id)}
                    data-testid={`doctor-card-${doctor.id}`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                            {doctor.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold" data-testid={`doctor-name-${doctor.id}`}>{doctor.name}</h4>
                          <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                          <p className="text-xs text-muted-foreground">{doctor.qualification}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">{doctor.rating}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {doctor.experience} yrs exp
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <Badge variant={doctor.available !== false ? "default" : "secondary"}>
                          {doctor.available !== false ? "Available" : "Busy"}
                        </Badge>
                        <span className="text-sm font-medium">₹500</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {selectedDoctor && (
              <Card className="border-primary" data-testid="card-booking-form">
                <CardHeader>
                  <CardTitle>Select Date & Time</CardTitle>
                  <CardDescription>Choose your preferred appointment slot</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Preferred Date</Label>
                      <Input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        data-testid="input-appointment-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Available Slots</Label>
                      <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                        <SelectTrigger data-testid="select-time-slot">
                          <SelectValue placeholder="Select time slot" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="09:00">09:00 AM</SelectItem>
                          <SelectItem value="10:00">10:00 AM</SelectItem>
                          <SelectItem value="11:00">11:00 AM</SelectItem>
                          <SelectItem value="14:00">02:00 PM</SelectItem>
                          <SelectItem value="15:00">03:00 PM</SelectItem>
                          <SelectItem value="16:00">04:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Textarea 
                    placeholder="Describe your symptoms or reason for visit (optional)"
                    className="min-h-[80px]"
                    data-testid="input-symptoms"
                  />
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    disabled={!selectedDate || !selectedSlot}
                    onClick={() => {
                      toast({ 
                        title: "Appointment Booked!", 
                        description: `Your appointment has been scheduled for ${selectedDate} at ${selectedSlot}`
                      });
                      setSelectedDoctor(null);
                      setSelectedDate("");
                      setSelectedSlot("");
                    }}
                    data-testid="button-confirm-booking"
                  >
                    Confirm Booking
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            )}
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

            <div className="grid gap-4">
              {MOCK_HEALTH_RECORDS.map((record) => (
                <Card key={record.id} className="hover-elevate" data-testid={`record-card-${record.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                        {getRecordIcon(record.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold" data-testid={`record-title-${record.id}`}>{record.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{record.doctor}</span>
                          <span className="hidden sm:inline">-</span>
                          <span className="hidden sm:inline">{record.department}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{record.date}</p>
                        <Badge variant={record.status === "active" ? "default" : "secondary"} className="mt-1">
                          {record.status}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" data-testid={`button-view-${record.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" data-testid={`button-download-${record.id}`}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold" data-testid="text-notifications-title">Notifications</h2>
                <p className="text-muted-foreground">Stay updated with your health alerts</p>
              </div>
              <Button variant="outline" size="sm" data-testid="button-mark-all-read">
                Mark all as read
              </Button>
            </div>

            <div className="space-y-3">
              {MOCK_NOTIFICATIONS.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`hover-elevate ${!notification.read ? "border-primary bg-primary/5" : ""}`}
                  data-testid={`notification-card-${notification.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        !notification.read ? "bg-primary/10" : "bg-muted"
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold" data-testid={`notification-title-${notification.id}`}>{notification.title}</h4>
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                      </div>
                      <Button size="sm" variant="ghost" data-testid={`button-notification-action-${notification.id}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "team":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-team-title">Our Medical Team</h2>
              <p className="text-muted-foreground">Meet our experienced healthcare professionals</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {MOCK_TEAM.map((doctor) => (
                <Card key={doctor.id} className="hover-elevate" data-testid={`team-card-${doctor.id}`}>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Avatar className="h-20 w-20 mx-auto mb-4">
                        <AvatarFallback className="bg-primary/10 text-primary text-xl">
                          {doctor.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <h4 className="font-semibold text-lg" data-testid={`team-name-${doctor.id}`}>{doctor.name}</h4>
                      <p className="text-primary font-medium">{doctor.specialty}</p>
                      <p className="text-sm text-muted-foreground">{doctor.qualification}</p>
                      
                      <div className="flex items-center justify-center gap-4 mt-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{doctor.rating}</span>
                        </div>
                        <Separator orientation="vertical" className="h-4" />
                        <span className="text-sm text-muted-foreground">
                          {doctor.experience} years
                        </span>
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                    <Input defaultValue={patientName} data-testid="input-profile-name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" defaultValue="patient@email.com" data-testid="input-profile-email" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input defaultValue="+91 98765 43210" data-testid="input-profile-phone" />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input type="date" defaultValue="1990-05-15" data-testid="input-profile-dob" />
                  </div>
                  <div className="space-y-2">
                    <Label>Blood Type</Label>
                    <Select defaultValue="o_positive">
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
                    <Select defaultValue="male">
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
                      <Input defaultValue="John Doe" data-testid="input-emergency-name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Relation</Label>
                      <Input defaultValue="Spouse" data-testid="input-emergency-relation" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input defaultValue="+91 98765 43211" data-testid="input-emergency-phone" />
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
                        defaultValue="Penicillin, Shellfish"
                        data-testid="input-allergies"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Chronic Conditions</Label>
                      <Textarea 
                        placeholder="List any chronic conditions..."
                        defaultValue="Hypertension (controlled)"
                        data-testid="input-conditions"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={() => toast({ title: "Profile Updated", description: "Your profile has been saved successfully" })}
                  data-testid="button-save-profile"
                >
                  Save Changes
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
                  Gravity Hospital, Chikhali
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
