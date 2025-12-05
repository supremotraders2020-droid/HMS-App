import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Wrench,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
  Flame,
  Shield,
  Wifi,
  Truck,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Heart,
  History,
  IndianRupee,
  User,
  FileText,
  Settings,
  Filter,
  ExternalLink,
  Plus
} from "lucide-react";

interface Equipment {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  lastServiceDate: string | null;
  nextDueDate: string;
  status: "up-to-date" | "due-soon" | "overdue";
  location: string;
}

interface ServiceHistory {
  id: string;
  equipmentId: string;
  serviceDate: string;
  technician: string;
  description: string;
  cost: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  serviceType: string;
  phoneNumber: string;
  isPrimary: boolean;
  isActive: boolean;
}

const MOCK_EQUIPMENT: Equipment[] = [
  { id: "eq1", name: "X-Ray Machine", model: "GE Definium 656", serialNumber: "XR-2024-001", lastServiceDate: "2024-11-15", nextDueDate: "2025-02-15", status: "up-to-date", location: "Radiology Dept" },
  { id: "eq2", name: "MRI Scanner", model: "Siemens MAGNETOM", serialNumber: "MR-2024-002", lastServiceDate: "2024-10-20", nextDueDate: "2024-12-20", status: "due-soon", location: "Imaging Center" },
  { id: "eq3", name: "CT Scanner", model: "Philips Ingenuity", serialNumber: "CT-2024-003", lastServiceDate: "2024-08-10", nextDueDate: "2024-11-10", status: "overdue", location: "Radiology Dept" },
  { id: "eq4", name: "Ultrasound System", model: "GE LOGIQ E10", serialNumber: "US-2024-004", lastServiceDate: "2024-11-25", nextDueDate: "2025-02-25", status: "up-to-date", location: "OBG Dept" },
  { id: "eq5", name: "ECG Machine", model: "Philips PageWriter", serialNumber: "ECG-2024-005", lastServiceDate: "2024-11-01", nextDueDate: "2025-01-01", status: "due-soon", location: "Cardiology" },
  { id: "eq6", name: "Ventilator", model: "Draeger Evita V500", serialNumber: "VT-2024-006", lastServiceDate: "2024-09-15", nextDueDate: "2024-11-15", status: "overdue", location: "ICU" },
  { id: "eq7", name: "Defibrillator", model: "Philips HeartStart", serialNumber: "DF-2024-007", lastServiceDate: "2024-11-20", nextDueDate: "2025-02-20", status: "up-to-date", location: "Emergency" },
  { id: "eq8", name: "Anesthesia Machine", model: "GE Aisys CS2", serialNumber: "AN-2024-008", lastServiceDate: "2024-10-05", nextDueDate: "2024-12-05", status: "due-soon", location: "Operation Theater" },
  { id: "eq9", name: "Patient Monitor", model: "Philips IntelliVue", serialNumber: "PM-2024-009", lastServiceDate: "2024-11-10", nextDueDate: "2025-01-10", status: "up-to-date", location: "ICU" },
];

const MOCK_SERVICE_HISTORY: ServiceHistory[] = [
  { id: "sh1", equipmentId: "eq1", serviceDate: "2024-11-15", technician: "Rajesh Kumar", description: "Annual maintenance, calibration completed, tube replacement", cost: "₹45,000" },
  { id: "sh2", equipmentId: "eq1", serviceDate: "2024-08-10", technician: "Amit Sharma", description: "Quarterly inspection and cleaning", cost: "₹15,000" },
  { id: "sh3", equipmentId: "eq1", serviceDate: "2024-05-05", technician: "Rajesh Kumar", description: "Software update and system optimization", cost: "₹8,000" },
  { id: "sh4", equipmentId: "eq2", serviceDate: "2024-10-20", technician: "Suresh Reddy", description: "Coil replacement and calibration", cost: "₹1,25,000" },
  { id: "sh5", equipmentId: "eq2", serviceDate: "2024-07-15", technician: "Suresh Reddy", description: "Helium refill and system check", cost: "₹85,000" },
  { id: "sh6", equipmentId: "eq3", serviceDate: "2024-08-10", technician: "Vikram Singh", description: "Gantry alignment and detector calibration", cost: "₹55,000" },
];

const MOCK_EMERGENCY_CONTACTS: EmergencyContact[] = [
  { id: "ec1", name: "City Ambulance Service", serviceType: "Medical Help", phoneNumber: "+91 102", isPrimary: true, isActive: true },
  { id: "ec2", name: "Hospital Emergency", serviceType: "Medical Help", phoneNumber: "+91 20 1234 5678", isPrimary: true, isActive: true },
  { id: "ec3", name: "Fire Brigade", serviceType: "Fire Service", phoneNumber: "+91 101", isPrimary: true, isActive: true },
  { id: "ec4", name: "Police Control Room", serviceType: "Police", phoneNumber: "+91 100", isPrimary: true, isActive: true },
  { id: "ec5", name: "Sharma Plumbing Works", serviceType: "Plumber", phoneNumber: "+91 98765 12345", isPrimary: true, isActive: true },
  { id: "ec6", name: "Quick Fix Plumbers", serviceType: "Plumber", phoneNumber: "+91 98765 67890", isPrimary: false, isActive: true },
  { id: "ec7", name: "PowerTech Electricals", serviceType: "Electrician", phoneNumber: "+91 97654 32100", isPrimary: true, isActive: true },
  { id: "ec8", name: "City Electricians", serviceType: "Electrician", phoneNumber: "+91 97654 11111", isPrimary: false, isActive: true },
  { id: "ec9", name: "Otis Elevator Service", serviceType: "Lift Service", phoneNumber: "+91 1800 123 4567", isPrimary: true, isActive: true },
  { id: "ec10", name: "TechSupport IT Solutions", serviceType: "IT Support", phoneNumber: "+91 88888 77777", isPrimary: true, isActive: true },
  { id: "ec11", name: "Network Solutions", serviceType: "IT Support", phoneNumber: "+91 88888 66666", isPrimary: false, isActive: true },
];

const SERVICE_TYPE_ICONS: Record<string, any> = {
  "Medical Help": Heart,
  "Fire Service": Flame,
  "Police": Shield,
  "Plumber": Droplets,
  "Electrician": Zap,
  "Lift Service": Truck,
  "IT Support": Wifi,
};

const SERVICE_TYPE_COLORS: Record<string, string> = {
  "Medical Help": "text-red-500 bg-red-50 dark:bg-red-950",
  "Fire Service": "text-orange-500 bg-orange-50 dark:bg-orange-950",
  "Police": "text-blue-500 bg-blue-50 dark:bg-blue-950",
  "Plumber": "text-cyan-500 bg-cyan-50 dark:bg-cyan-950",
  "Electrician": "text-yellow-500 bg-yellow-50 dark:bg-yellow-950",
  "Lift Service": "text-purple-500 bg-purple-50 dark:bg-purple-950",
  "IT Support": "text-green-500 bg-green-50 dark:bg-green-950",
};

export default function EquipmentServicing() {
  const [activeTab, setActiveTab] = useState("equipment");
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contactCategory, setContactCategory] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { toast } = useToast();

  const upToDateCount = MOCK_EQUIPMENT.filter(e => e.status === "up-to-date").length;
  const dueSoonCount = MOCK_EQUIPMENT.filter(e => e.status === "due-soon").length;
  const overdueCount = MOCK_EQUIPMENT.filter(e => e.status === "overdue").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "up-to-date": return "bg-green-500";
      case "due-soon": return "bg-yellow-500";
      case "overdue": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "up-to-date": 
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"><CheckCircle className="h-3 w-3 mr-1" />Up-to-date</Badge>;
      case "due-soon": 
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"><Clock className="h-3 w-3 mr-1" />Due Soon</Badge>;
      case "overdue": 
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"><AlertTriangle className="h-3 w-3 mr-1" />Overdue</Badge>;
      default: 
        return null;
    }
  };

  const getEquipmentHistory = (equipmentId: string) => {
    return MOCK_SERVICE_HISTORY.filter(h => h.equipmentId === equipmentId);
  };

  const openHistoryModal = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setHistoryModalOpen(true);
  };

  const filteredContacts = MOCK_EMERGENCY_CONTACTS.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phoneNumber.includes(searchQuery);
    
    if (contactCategory === "all") return matchesSearch;
    if (contactCategory === "medical") return matchesSearch && contact.serviceType === "Medical Help";
    if (contactCategory === "maintenance") return matchesSearch && ["Plumber", "Electrician", "Lift Service"].includes(contact.serviceType);
    if (contactCategory === "security") return matchesSearch && ["Police", "Fire Service"].includes(contact.serviceType);
    if (contactCategory === "technical") return matchesSearch && contact.serviceType === "IT Support";
    return matchesSearch;
  });

  const getContactCategoryCount = (category: string) => {
    if (category === "all") return MOCK_EMERGENCY_CONTACTS.length;
    if (category === "medical") return MOCK_EMERGENCY_CONTACTS.filter(c => c.serviceType === "Medical Help").length;
    if (category === "maintenance") return MOCK_EMERGENCY_CONTACTS.filter(c => ["Plumber", "Electrician", "Lift Service"].includes(c.serviceType)).length;
    if (category === "security") return MOCK_EMERGENCY_CONTACTS.filter(c => ["Police", "Fire Service"].includes(c.serviceType)).length;
    if (category === "technical") return MOCK_EMERGENCY_CONTACTS.filter(c => c.serviceType === "IT Support").length;
    return 0;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const getServiceEventsForDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return MOCK_EQUIPMENT.filter(e => e.nextDueDate === dateStr);
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);

  const renderCalendar = () => {
    const days = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const events = getServiceEventsForDay(day);
      const hasOverdue = events.some(e => e.status === "overdue");
      const hasDueSoon = events.some(e => e.status === "due-soon");
      const hasUpToDate = events.some(e => e.status === "up-to-date");

      days.push(
        <div 
          key={day} 
          className={`p-2 border rounded-lg min-h-[60px] cursor-pointer hover:bg-muted/50 transition-colors ${
            events.length > 0 ? "bg-muted/30" : ""
          }`}
          data-testid={`calendar-day-${day}`}
        >
          <span className="text-sm font-medium">{day}</span>
          <div className="flex gap-1 mt-1 flex-wrap">
            {hasOverdue && <div className="h-2 w-2 rounded-full bg-red-500" />}
            {hasDueSoon && <div className="h-2 w-2 rounded-full bg-yellow-500" />}
            {hasUpToDate && <div className="h-2 w-2 rounded-full bg-green-500" />}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map(name => (
          <div key={name} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {name}
          </div>
        ))}
        {days}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Wrench className="h-6 w-6 text-primary" />
          Equipment Servicing & Emergency
        </h1>
        <p className="text-muted-foreground">Manage equipment maintenance schedules and emergency contacts</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3" data-testid="tabs-main">
          <TabsTrigger value="equipment" className="flex items-center gap-2" data-testid="tab-equipment">
            <Wrench className="h-4 w-4" />
            Equipment
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2" data-testid="tab-calendar">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="emergency" className="flex items-center gap-2" data-testid="tab-emergency">
            <Phone className="h-4 w-4" />
            Emergency
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="hover-elevate" data-testid="stat-total">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-count">{MOCK_EQUIPMENT.length}</div>
                <p className="text-xs text-muted-foreground">All registered equipment</p>
              </CardContent>
            </Card>
            <Card className="hover-elevate" data-testid="stat-uptodate">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Up-to-date</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="text-uptodate-count">{upToDateCount}</div>
                <p className="text-xs text-muted-foreground">Recently serviced</p>
              </CardContent>
            </Card>
            <Card className="hover-elevate" data-testid="stat-duesoon">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600" data-testid="text-duesoon-count">{dueSoonCount}</div>
                <p className="text-xs text-muted-foreground">Service approaching</p>
              </CardContent>
            </Card>
            <Card className="hover-elevate" data-testid="stat-overdue">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600" data-testid="text-overdue-count">{overdueCount}</div>
                <p className="text-xs text-muted-foreground">Needs attention</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {MOCK_EQUIPMENT.map((equipment) => (
              <Card key={equipment.id} className="hover-elevate" data-testid={`equipment-card-${equipment.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg" data-testid={`equipment-name-${equipment.id}`}>{equipment.name}</CardTitle>
                      <CardDescription>{equipment.model}</CardDescription>
                    </div>
                    {getStatusBadge(equipment.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Serial Number</p>
                      <p className="font-mono font-medium">{equipment.serialNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="font-medium">{equipment.location}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Service</p>
                      <p className="font-medium">{equipment.lastServiceDate || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Next Due</p>
                      <p className="font-medium">{equipment.nextDueDate}</p>
                    </div>
                  </div>
                  <div className={`h-1 rounded-full ${getStatusColor(equipment.status)}`} />
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => openHistoryModal(equipment)}
                    data-testid={`button-history-${equipment.id}`}
                  >
                    <History className="h-4 w-4 mr-2" />
                    View History
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <Card data-testid="card-calendar">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Service Calendar
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    data-testid="button-prev-month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium min-w-[150px] text-center" data-testid="text-current-month">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    data-testid="button-next-month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>View upcoming equipment service schedules</CardDescription>
            </CardHeader>
            <CardContent>
              {renderCalendar()}
              
              <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">Up-to-date</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="text-sm text-muted-foreground">Due Soon</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm text-muted-foreground">Overdue</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-upcoming-services">
            <CardHeader>
              <CardTitle>Upcoming Services This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_EQUIPMENT.filter(e => e.status !== "up-to-date").map((equipment) => (
                  <div 
                    key={equipment.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    data-testid={`upcoming-service-${equipment.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${getStatusColor(equipment.status)}`} />
                      <div>
                        <p className="font-medium">{equipment.name}</p>
                        <p className="text-sm text-muted-foreground">{equipment.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{equipment.nextDueDate}</p>
                      {getStatusBadge(equipment.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="hover-elevate" data-testid="stat-contacts">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{MOCK_EMERGENCY_CONTACTS.length}</div>
                <p className="text-xs text-muted-foreground">All emergency contacts</p>
              </CardContent>
            </Card>
            <Card className="hover-elevate" data-testid="stat-primary">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Primary Contacts</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{MOCK_EMERGENCY_CONTACTS.filter(c => c.isPrimary).length}</div>
                <p className="text-xs text-muted-foreground">First responders</p>
              </CardContent>
            </Card>
            <Card className="hover-elevate" data-testid="stat-types">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Service Types</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{new Set(MOCK_EMERGENCY_CONTACTS.map(c => c.serviceType)).size}</div>
                <p className="text-xs text-muted-foreground">Categories covered</p>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-emergency-contacts">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    Emergency Contacts
                  </CardTitle>
                  <CardDescription>Quick access to emergency services</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search contacts..." 
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-contacts"
                  />
                  {searchQuery && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                      onClick={() => setSearchQuery("")}
                      data-testid="button-clear-search"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={contactCategory} onValueChange={setContactCategory} className="mb-6">
                <TabsList className="flex-wrap h-auto gap-1" data-testid="tabs-contact-category">
                  <TabsTrigger value="all" data-testid="tab-all">
                    All <Badge variant="secondary" className="ml-1">{getContactCategoryCount("all")}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="medical" data-testid="tab-medical">
                    Medical <Badge variant="secondary" className="ml-1">{getContactCategoryCount("medical")}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="maintenance" data-testid="tab-maintenance">
                    Maintenance <Badge variant="secondary" className="ml-1">{getContactCategoryCount("maintenance")}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="security" data-testid="tab-security">
                    Security <Badge variant="secondary" className="ml-1">{getContactCategoryCount("security")}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="technical" data-testid="tab-technical">
                    Technical <Badge variant="secondary" className="ml-1">{getContactCategoryCount("technical")}</Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="grid gap-4 md:grid-cols-2">
                {filteredContacts.map((contact) => {
                  const Icon = SERVICE_TYPE_ICONS[contact.serviceType] || Phone;
                  const colorClass = SERVICE_TYPE_COLORS[contact.serviceType] || "text-gray-500 bg-gray-50";
                  
                  return (
                    <Card key={contact.id} className="hover-elevate" data-testid={`contact-card-${contact.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold" data-testid={`contact-name-${contact.id}`}>{contact.name}</h4>
                              {contact.isPrimary && (
                                <Badge variant="default" className="text-xs">Primary</Badge>
                              )}
                              {!contact.isPrimary && (
                                <Badge variant="secondary" className="text-xs">Backup</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{contact.serviceType}</p>
                            <p className="font-mono text-lg mt-1" data-testid={`contact-phone-${contact.id}`}>{contact.phoneNumber}</p>
                          </div>
                          <Button 
                            className="shrink-0"
                            onClick={() => {
                              window.location.href = `tel:${contact.phoneNumber.replace(/\s/g, '')}`;
                              toast({ title: "Calling...", description: `Dialing ${contact.name}` });
                            }}
                            data-testid={`button-call-${contact.id}`}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredContacts.length === 0 && (
                <div className="text-center py-12">
                  <Phone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No contacts found matching your search</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-history">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Service History - {selectedEquipment?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedEquipment?.model} | {selectedEquipment?.serialNumber}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-4">
              {selectedEquipment && getEquipmentHistory(selectedEquipment.id).length > 0 ? (
                getEquipmentHistory(selectedEquipment.id).map((history) => (
                  <Card key={history.id} data-testid={`history-item-${history.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{history.serviceDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{history.technician}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="text-sm text-muted-foreground">{history.description}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-lg font-semibold">
                            <IndianRupee className="h-4 w-4" />
                            {history.cost.replace("₹", "")}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No service history found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
