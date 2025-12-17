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
  ExternalLink
} from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Doctor, Appointment, Schedule, Medicine, DoctorSchedule, DoctorTimeSlot } from "@shared/schema";

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
  const [slotFilter, setSlotFilter] = useState<'all' | 'available' | 'booked'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [medicineSearch, setMedicineSearch] = useState("");
  const [medicineCategory, setMedicineCategory] = useState<string>("all");
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [showMedicineDetail, setShowMedicineDetail] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  // Helper to get slot counts for a specific doctor
  // Note: doctorId in doctors table differs from doctorId in time_slots (user ID)
  // So we match by doctor name instead
  const getDoctorSlotCounts = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (!doctor) return { available: 0, booked: 0, total: 0 };
    
    // Match slots by doctor name (partial match to handle "Dr." prefix variations)
    const doctorName = doctor.name.replace(/^Dr\.?\s*/i, '').toLowerCase();
    const doctorSlots = allDoctorSlots.filter(s => {
      const slotDoctorName = (s.doctorName || '').replace(/^Dr\.?\s*/i, '').toLowerCase();
      return slotDoctorName.includes(doctorName) || doctorName.includes(slotDoctorName);
    });
    
    const available = doctorSlots.filter(s => s.status === 'available').length;
    const bookedSlots = doctorSlots.filter(s => s.status === 'booked').length;
    
    // Also count legacy appointments (booked via /api/appointments without slot system)
    // These are appointments for the selected date that match the doctor's specialty/department
    const legacyAppointments = appointments.filter(apt => {
      if (apt.status === 'cancelled' || apt.status === 'completed') return false;
      if (apt.appointmentDate !== selectedDate) return false;
      // Match by department (specialty)
      const matchesDepartment = apt.department?.toLowerCase() === doctor.specialty?.toLowerCase();
      // Or match by doctorId (if it was set)
      const matchesDoctorId = apt.doctorId === doctorId;
      return matchesDepartment || matchesDoctorId;
    });
    
    // Exclude legacy appointments that are already counted in booked slots
    const bookedSlotTimes = doctorSlots
      .filter(s => s.status === 'booked')
      .map(s => s.startTime);
    const uniqueLegacyCount = legacyAppointments.filter(apt => {
      const aptTime = apt.timeSlot?.split(' - ')[0] || apt.timeSlot;
      return !bookedSlotTimes.includes(aptTime);
    }).length;
    
    const booked = bookedSlots + uniqueLegacyCount;
    const total = doctorSlots.length + uniqueLegacyCount;
    return { available, booked, total };
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

  const scheduledAppointments = appointments.filter((apt) => apt.status === "scheduled");

  const getDoctorById = (id: string) => doctors.find((d) => d.id === id);

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
    <div className="min-h-screen bg-background">
      {/* OPD Header */}
      <div className="bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">OPD - Outpatient Department</h1>
                <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>OPD Wing, Gravity Hospital</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-lg">
                <Phone className="h-4 w-4" />
                <span className="text-sm">OPD: +91 20 1234 5679</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-lg">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Mon-Sat: 8AM-8PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 py-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={`h-14 flex items-center justify-center gap-2 ${
                  activeTab === tab.id ? "bg-primary text-primary-foreground" : ""
                }`}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-4 py-6">
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
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <button 
                          onClick={() => setSlotFilter(slotFilter === 'available' ? 'all' : 'available')}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full cursor-pointer transition-all ${slotFilter === 'available' ? 'ring-2 ring-green-500 bg-green-500/20' : 'hover:bg-green-500/10'}`}
                          data-testid="filter-available"
                        >
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-green-600 dark:text-green-400 font-medium">{slotCounts.available} available</span>
                        </button>
                        <button 
                          onClick={() => setSlotFilter(slotFilter === 'booked' ? 'all' : 'booked')}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full cursor-pointer transition-all ${slotFilter === 'booked' ? 'ring-2 ring-orange-500 bg-orange-500/20' : 'hover:bg-orange-500/10'}`}
                          data-testid="filter-booked"
                        >
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-orange-600 dark:text-orange-400 font-medium">{slotCounts.booked} booked</span>
                        </button>
                        <span className="text-muted-foreground">/ {slotCounts.total} total</span>
                      </div>
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
                                    {block.location || block.slotType}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Individual Time Slots from Database */}
                        <span className="text-sm text-muted-foreground">Time Slots (30-min intervals)</span>
                        <div className="flex flex-wrap gap-2">
                          {timeSlots
                            .filter((slot) => {
                              if (slotFilter === 'available') return slot.status === 'available';
                              if (slotFilter === 'booked') return slot.status === 'booked';
                              return true;
                            })
                            .map((slot) => (
                            <div
                              key={slot.id}
                              className={`relative px-3 py-2 rounded-lg border-2 text-center ${
                                slot.status === 'booked' 
                                  ? 'bg-muted border-muted-foreground/30' 
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
                    <Select name="doctorId" required>
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
                      data-testid="input-appointment-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeSlot">Time Slot</Label>
                    <Select name="timeSlot" required>
                      <SelectTrigger data-testid="select-time-slot">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"].map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="location">OPD Location</Label>
                    <Select name="location" required>
                      <SelectTrigger data-testid="select-opd-location">
                        <SelectValue placeholder="Select OPD location" />
                      </SelectTrigger>
                      <SelectContent>
                        {OPD_LOCATIONS.map((loc) => (
                          <SelectItem key={loc.id} value={loc.name}>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{loc.name}</span>
                            </div>
                          </SelectItem>
                        ))}
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
                <div className="flex items-center gap-3">
                  <UserCheck className="h-6 w-6 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold">Patient Check-in</h2>
                    <p className="text-sm text-muted-foreground">
                      {scheduledAppointments.length} patients waiting for check-in
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {scheduledAppointments.map((apt) => {
                const doctor = getDoctorById(apt.doctorId);
                return (
                  <Card key={apt.id} className="hover-elevate" data-testid={`card-checkin-${apt.id}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                              {apt.patientName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{apt.patientName}</h3>
                            <p className="text-sm text-muted-foreground">{apt.appointmentId}</p>
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          SCHEDULED
                        </Badge>
                      </div>
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{doctor?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{apt.timeSlot}</span>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-4"
                        onClick={() => checkInMutation.mutate(apt.id)}
                        disabled={checkInMutation.isPending}
                        data-testid={`button-quick-checkin-${apt.id}`}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Check In Patient
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {scheduledAppointments.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No patients waiting for check-in</p>
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
    </div>
  );
}
