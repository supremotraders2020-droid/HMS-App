import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Plus,
  MapPin,
  Hash,
  CalendarClock,
  Info,
  Eye,
  Building2
} from "lucide-react";

type ServiceFrequency = "monthly" | "quarterly" | "yearly";

interface Equipment {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  lastServiceDate: string | null;
  nextDueDate: string;
  status: "up-to-date" | "due-soon" | "overdue";
  location: string;
  serviceFrequency?: ServiceFrequency;
  companyName?: string;
  contactNumber?: string;
  emergencyNumber?: string;
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
  { id: "eq1", name: "X-Ray Machine", model: "GE Definium 656", serialNumber: "XR-2024-001", lastServiceDate: "2024-11-15", nextDueDate: "2025-02-15", status: "up-to-date", location: "Radiology Dept", serviceFrequency: "quarterly", companyName: "GE Healthcare India", contactNumber: "+91 1800 103 4800", emergencyNumber: "+91 98765 11111" },
  { id: "eq2", name: "MRI Scanner", model: "Siemens MAGNETOM", serialNumber: "MR-2024-002", lastServiceDate: "2024-10-20", nextDueDate: "2024-12-20", status: "due-soon", location: "Imaging Center", serviceFrequency: "quarterly", companyName: "Siemens Healthineers", contactNumber: "+91 1800 209 1800", emergencyNumber: "+91 98765 22222" },
  { id: "eq3", name: "CT Scanner", model: "Philips Ingenuity", serialNumber: "CT-2024-003", lastServiceDate: "2024-08-10", nextDueDate: "2024-11-10", status: "overdue", location: "Radiology Dept", serviceFrequency: "quarterly", companyName: "Philips Healthcare", contactNumber: "+91 1800 102 2929", emergencyNumber: "+91 98765 33333" },
  { id: "eq4", name: "Ultrasound System", model: "GE LOGIQ E10", serialNumber: "US-2024-004", lastServiceDate: "2024-11-25", nextDueDate: "2025-02-25", status: "up-to-date", location: "OBG Dept", serviceFrequency: "quarterly", companyName: "GE Healthcare India", contactNumber: "+91 1800 103 4800", emergencyNumber: "+91 98765 11111" },
  { id: "eq5", name: "ECG Machine", model: "Philips PageWriter", serialNumber: "ECG-2024-005", lastServiceDate: "2024-11-01", nextDueDate: "2025-01-01", status: "due-soon", location: "Cardiology", serviceFrequency: "monthly", companyName: "Philips Healthcare", contactNumber: "+91 1800 102 2929", emergencyNumber: "+91 98765 33333" },
  { id: "eq6", name: "Ventilator", model: "Draeger Evita V500", serialNumber: "VT-2024-006", lastServiceDate: "2024-09-15", nextDueDate: "2024-11-15", status: "overdue", location: "ICU", serviceFrequency: "monthly", companyName: "Draeger Medical India", contactNumber: "+91 1800 123 4567", emergencyNumber: "+91 98765 44444" },
  { id: "eq7", name: "Defibrillator", model: "Philips HeartStart", serialNumber: "DF-2024-007", lastServiceDate: "2024-11-20", nextDueDate: "2025-02-20", status: "up-to-date", location: "Emergency", serviceFrequency: "quarterly", companyName: "Philips Healthcare", contactNumber: "+91 1800 102 2929", emergencyNumber: "+91 98765 33333" },
  { id: "eq8", name: "Anesthesia Machine", model: "GE Aisys CS2", serialNumber: "AN-2024-008", lastServiceDate: "2024-10-05", nextDueDate: "2024-12-05", status: "due-soon", location: "Operation Theater", serviceFrequency: "monthly", companyName: "GE Healthcare India", contactNumber: "+91 1800 103 4800", emergencyNumber: "+91 98765 11111" },
  { id: "eq9", name: "Patient Monitor", model: "Philips IntelliVue", serialNumber: "PM-2024-009", lastServiceDate: "2024-11-10", nextDueDate: "2025-01-10", status: "up-to-date", location: "ICU", serviceFrequency: "monthly", companyName: "Philips Healthcare", contactNumber: "+91 1800 102 2929", emergencyNumber: "+91 98765 33333" },
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
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contactCategory, setContactCategory] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(MOCK_EQUIPMENT);
  const [showAddEquipmentDialog, setShowAddEquipmentDialog] = useState(false);
  const [serviceFrequency, setServiceFrequency] = useState<ServiceFrequency>("quarterly");
  const [lastServiceDateInput, setLastServiceDateInput] = useState("");
  const [calculatedNextDueDate, setCalculatedNextDueDate] = useState("");
  const [upcomingFilter, setUpcomingFilter] = useState<"all" | ServiceFrequency>("all");
  const { toast } = useToast();

  const upToDateCount = equipmentList.filter(e => e.status === "up-to-date").length;
  const dueSoonCount = equipmentList.filter(e => e.status === "due-soon").length;
  const overdueCount = equipmentList.filter(e => e.status === "overdue").length;

  const calculateStatus = (nextDueDate: string): "up-to-date" | "due-soon" | "overdue" => {
    const today = new Date();
    const dueDate = new Date(nextDueDate);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "overdue";
    if (diffDays <= 30) return "due-soon";
    return "up-to-date";
  };

  const calculateNextDueDate = (lastService: string, frequency: ServiceFrequency): string => {
    if (!lastService) return "";
    const date = new Date(lastService);
    switch (frequency) {
      case "monthly":
        date.setMonth(date.getMonth() + 1);
        break;
      case "quarterly":
        date.setMonth(date.getMonth() + 3);
        break;
      case "yearly":
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    return date.toISOString().split('T')[0];
  };

  const getFrequencyLabel = (frequency?: ServiceFrequency): string => {
    switch (frequency) {
      case "monthly": return "Monthly";
      case "quarterly": return "Quarterly";
      case "yearly": return "Yearly";
      default: return "Not Set";
    }
  };

  const getFrequencyBadgeColor = (frequency?: ServiceFrequency): string => {
    switch (frequency) {
      case "monthly": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "quarterly": return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      case "yearly": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  useEffect(() => {
    if (lastServiceDateInput && serviceFrequency) {
      setCalculatedNextDueDate(calculateNextDueDate(lastServiceDateInput, serviceFrequency));
    }
  }, [lastServiceDateInput, serviceFrequency]);

  const openDetailModal = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setDetailModalOpen(true);
  };

  const handleAddEquipment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const manufacturer = formData.get("manufacturer") as string;
    const serialNumber = formData.get("serialNumber") as string;
    const location = formData.get("location") as string;
    const lastServiceDate = formData.get("lastServiceDate") as string;
    const manualNextDueDate = formData.get("nextDueDate") as string;
    const companyName = formData.get("companyName") as string;
    const contactNumber = formData.get("contactNumber") as string;
    const emergencyNumber = formData.get("emergencyNumber") as string;
    
    const nextDueDate = calculatedNextDueDate || manualNextDueDate;

    if (!name || !manufacturer || !serialNumber || !location || !nextDueDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields. Either enter Last Service Date for auto-calculation or manually enter Next Due Date.",
        variant: "destructive",
      });
      return;
    }

    const newEquipment: Equipment = {
      id: `eq-${Date.now()}`,
      name,
      model: manufacturer,
      serialNumber,
      location,
      lastServiceDate: lastServiceDate || null,
      nextDueDate,
      status: calculateStatus(nextDueDate),
      serviceFrequency,
      companyName: companyName || undefined,
      contactNumber: contactNumber || undefined,
      emergencyNumber: emergencyNumber || undefined,
    };

    setEquipmentList([...equipmentList, newEquipment]);
    setShowAddEquipmentDialog(false);
    setLastServiceDateInput("");
    setCalculatedNextDueDate("");
    setServiceFrequency("quarterly");
    toast({
      title: "Equipment Added",
      description: `${name} has been added successfully with ${getFrequencyLabel(serviceFrequency).toLowerCase()} service frequency.`,
    });
  };

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
    return equipmentList.filter(e => e.nextDueDate === dateStr);
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
                <div className="text-2xl font-bold" data-testid="text-total-count">{equipmentList.length}</div>
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

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Equipment List</h2>
            <Button onClick={() => setShowAddEquipmentDialog(true)} data-testid="button-add-equipment">
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {equipmentList.map((equipment) => (
              <Card key={equipment.id} className="hover-elevate cursor-pointer" onClick={() => openDetailModal(equipment)} data-testid={`equipment-card-${equipment.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg" data-testid={`equipment-name-${equipment.id}`}>{equipment.name}</CardTitle>
                      <CardDescription>{equipment.model}</CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(equipment.status)}
                      <Badge className={`text-xs ${getFrequencyBadgeColor(equipment.serviceFrequency)}`}>
                        {getFrequencyLabel(equipment.serviceFrequency)}
                      </Badge>
                    </div>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      openHistoryModal(equipment);
                    }}
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarClock className="h-5 w-5 text-primary" />
                    Upcoming Services
                  </CardTitle>
                  <CardDescription>Click on any item to view details and service history</CardDescription>
                </div>
                <Select value={upcomingFilter} onValueChange={(value) => setUpcomingFilter(value as "all" | ServiceFrequency)}>
                  <SelectTrigger className="w-[160px]" data-testid="select-frequency-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Frequencies</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(() => {
                  const filteredEquipment = equipmentList.filter(e => {
                    if (e.status === "up-to-date") return false;
                    if (upcomingFilter === "all") return true;
                    return e.serviceFrequency === upcomingFilter;
                  });
                  
                  if (filteredEquipment.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 mx-auto text-green-500/50 mb-3" />
                        <p className="text-muted-foreground">
                          {upcomingFilter === "all" 
                            ? "All equipment is up-to-date!" 
                            : `No ${getFrequencyLabel(upcomingFilter as ServiceFrequency).toLowerCase()} services pending`}
                        </p>
                      </div>
                    );
                  }
                  
                  return filteredEquipment.map((equipment) => (
                    <div 
                      key={equipment.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-elevate cursor-pointer transition-all"
                      onClick={() => openDetailModal(equipment)}
                      data-testid={`upcoming-service-${equipment.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${getStatusColor(equipment.status)}`} />
                        <div>
                          <p className="font-medium">{equipment.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">{equipment.location}</p>
                            <Badge className={`text-xs ${getFrequencyBadgeColor(equipment.serviceFrequency)}`}>
                              {getFrequencyLabel(equipment.serviceFrequency)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-medium">{equipment.nextDueDate}</p>
                          {getStatusBadge(equipment.status)}
                        </div>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ));
                })()}
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

      <Dialog open={showAddEquipmentDialog} onOpenChange={(open) => {
        setShowAddEquipmentDialog(open);
        if (!open) {
          setLastServiceDateInput("");
          setCalculatedNextDueDate("");
          setServiceFrequency("quarterly");
        }
      }}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-add-equipment">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add New Equipment
            </DialogTitle>
            <DialogDescription>
              Add a new piece of equipment to the servicing schedule
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEquipment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Equipment Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., X-Ray Machine"
                required
                data-testid="input-equipment-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer / Model *</Label>
              <Input
                id="manufacturer"
                name="manufacturer"
                placeholder="e.g., GE Definium 656"
                required
                data-testid="input-manufacturer"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number *</Label>
                <Input
                  id="serialNumber"
                  name="serialNumber"
                  placeholder="e.g., XR-2024-001"
                  required
                  data-testid="input-serial-number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g., Radiology Dept"
                  required
                  data-testid="input-location"
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Service Frequency *</Label>
              <Select 
                value={serviceFrequency} 
                onValueChange={(value) => setServiceFrequency(value as ServiceFrequency)}
              >
                <SelectTrigger data-testid="select-service-frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly (Every 3 months)</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Next due date will be calculated automatically based on last service date
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastServiceDate">Last Service Date</Label>
                <Input
                  id="lastServiceDate"
                  name="lastServiceDate"
                  type="date"
                  value={lastServiceDateInput}
                  onChange={(e) => setLastServiceDateInput(e.target.value)}
                  data-testid="input-last-service-date"
                />
                <p className="text-xs text-muted-foreground">Optional - Auto-calculates Next Due Date</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextDueDate">Next Due Date *</Label>
                <Input
                  id="nextDueDate"
                  name="nextDueDate"
                  type="date"
                  value={calculatedNextDueDate}
                  onChange={(e) => !lastServiceDateInput && setCalculatedNextDueDate(e.target.value)}
                  readOnly={!!lastServiceDateInput}
                  className={lastServiceDateInput ? "bg-muted" : ""}
                  required={!calculatedNextDueDate}
                  data-testid="input-next-due-date"
                />
                {calculatedNextDueDate && lastServiceDateInput ? (
                  <p className="text-xs text-green-600 dark:text-green-400">Auto-calculated from frequency</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Enter manually or set Last Service Date</p>
                )}
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Service Provider Details
              </h4>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  placeholder="e.g., GE Healthcare India"
                  data-testid="input-company-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    name="contactNumber"
                    type="tel"
                    placeholder="+91 1800 xxx xxxx"
                    data-testid="input-contact-number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyNumber" className="text-red-600 dark:text-red-400">Emergency Number</Label>
                  <Input
                    id="emergencyNumber"
                    name="emergencyNumber"
                    type="tel"
                    placeholder="+91 98765 xxxxx"
                    className="border-red-200 dark:border-red-900 focus:ring-red-500"
                    data-testid="input-emergency-number"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddEquipmentDialog(false)}
                data-testid="button-cancel-add-equipment"
              >
                Cancel
              </Button>
              <Button type="submit" data-testid="button-submit-add-equipment">
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-equipment-detail">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Equipment Details
            </DialogTitle>
            <DialogDescription>
              Full details and service history for {selectedEquipment?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEquipment && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{selectedEquipment.name}</h3>
                  <p className="text-muted-foreground">{selectedEquipment.model}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedEquipment.status)}
                  <Badge className={getFrequencyBadgeColor(selectedEquipment.serviceFrequency)}>
                    {getFrequencyLabel(selectedEquipment.serviceFrequency)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Hash className="h-4 w-4" />
                    Serial Number
                  </div>
                  <p className="font-mono font-medium">{selectedEquipment.serialNumber}</p>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <MapPin className="h-4 w-4" />
                    Location
                  </div>
                  <p className="font-medium">{selectedEquipment.location}</p>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Calendar className="h-4 w-4" />
                    Last Service
                  </div>
                  <p className="font-medium">{selectedEquipment.lastServiceDate || "N/A"}</p>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <CalendarClock className="h-4 w-4" />
                    Next Due
                  </div>
                  <p className="font-medium">{selectedEquipment.nextDueDate}</p>
                </Card>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-4">
                  <Phone className="h-4 w-4 text-primary" />
                  Service Provider Contact
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Building2 className="h-4 w-4" />
                      Company Name
                    </div>
                    <p className="font-medium">{selectedEquipment.companyName || "Not specified"}</p>
                  </Card>
                  <Card className="p-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Phone className="h-4 w-4" />
                      Contact Number
                    </div>
                    <p className="font-medium">{selectedEquipment.contactNumber || "Not specified"}</p>
                  </Card>
                  <Card className="p-3 border-red-200 dark:border-red-900">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mb-1">
                      <AlertTriangle className="h-4 w-4" />
                      Emergency Number
                    </div>
                    <p className="font-medium text-red-600 dark:text-red-400">{selectedEquipment.emergencyNumber || "Not specified"}</p>
                  </Card>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-4">
                  <History className="h-4 w-4 text-primary" />
                  Service History
                </h4>
                <ScrollArea className="max-h-[250px]">
                  <div className="space-y-3">
                    {getEquipmentHistory(selectedEquipment.id).length > 0 ? (
                      getEquipmentHistory(selectedEquipment.id).map((history) => (
                        <Card key={history.id} className="p-4" data-testid={`detail-history-${history.id}`}>
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
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">No service history found for this equipment</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setDetailModalOpen(false);
                  openHistoryModal(selectedEquipment);
                }}>
                  <History className="h-4 w-4 mr-2" />
                  Full History View
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
