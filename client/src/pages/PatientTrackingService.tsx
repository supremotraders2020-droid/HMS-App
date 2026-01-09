import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { IntegerInput, NumericInput } from "@/components/validated-inputs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  MapPin, 
  Phone, 
  Clock, 
  Plus,
  Search,
  Bed,
  Pill,
  Utensils,
  Heart,
  User,
  AlertCircle,
  ChevronRight,
  Thermometer,
  Trash2,
  LogOut,
  Check,
  ChevronsUpDown,
  Stethoscope,
  IndianRupee,
  Save,
  HeartPulse,
  History,
  Calendar,
  Wind,
  ExternalLink,
  ClipboardList,
  Droplets,
  Syringe,
  FileText,
  TestTube2,
  Clipboard,
  TrendingUp,
  TrendingDown,
  ArrowUpDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { TrackingPatient, Medication, Meal, Vitals, ServicePatient, Doctor, DoctorVisit, PatientBill } from "@shared/schema";

type TabType = "patients" | "admit" | "doctor_visits" | "billing";

export default function PatientTrackingService() {
  const [activeTab, setActiveTab] = useState<TabType>("patients");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [admitPatientPopoverOpen, setAdmitPatientPopoverOpen] = useState(false);
  const [selectedAdmitPatientName, setSelectedAdmitPatientName] = useState<string>("");
  const [vitalsPatientPopoverOpen, setVitalsPatientPopoverOpen] = useState(false);
  const [selectedVitalsPatientId, setSelectedVitalsPatientId] = useState<string>("");
  const [medsPatientPopoverOpen, setMedsPatientPopoverOpen] = useState(false);
  const [selectedMedsPatientId, setSelectedMedsPatientId] = useState<string>("");
  const [mealsPatientPopoverOpen, setMealsPatientPopoverOpen] = useState(false);
  const [selectedMealsPatientId, setSelectedMealsPatientId] = useState<string>("");
  const [doctorVisitPatientPopoverOpen, setDoctorVisitPatientPopoverOpen] = useState(false);
  const [selectedDoctorVisitPatientId, setSelectedDoctorVisitPatientId] = useState<string>("");
  const [historyPatient, setHistoryPatient] = useState<TrackingPatient | null>(null);
  const { toast } = useToast();

  // Fetch patient monitoring sessions to link tracking with monitoring
  const { data: monitoringSessions = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/sessions"],
  });

  // Helper to find monitoring session for a patient
  const findMonitoringSession = (patientName: string) => {
    return monitoringSessions.find((s: any) => 
      s.patientName?.toLowerCase() === patientName?.toLowerCase()
    );
  };

  // State for viewing monitoring details inline
  const [monitoringViewPatient, setMonitoringViewPatient] = useState<TrackingPatient | null>(null);
  const monitoringSession = monitoringViewPatient ? findMonitoringSession(monitoringViewPatient.name) : null;
  const monitoringSessionId = monitoringSession?.id;

  // Fetch all monitoring data for inline display
  const { data: monitoringVitals = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/vitals", monitoringSessionId],
    enabled: !!monitoringSessionId
  });

  const { data: monitoringInotropes = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/inotropes", monitoringSessionId],
    enabled: !!monitoringSessionId
  });

  const { data: monitoringVentilator = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/ventilator", monitoringSessionId],
    enabled: !!monitoringSessionId
  });

  const { data: monitoringIO = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/io", monitoringSessionId],
    enabled: !!monitoringSessionId
  });

  const { data: monitoringProcedures = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/procedures", monitoringSessionId],
    enabled: !!monitoringSessionId
  });

  const { data: monitoringTests = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/tests", monitoringSessionId],
    enabled: !!monitoringSessionId
  });

  const { data: monitoringNotes = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/notes", monitoringSessionId],
    enabled: !!monitoringSessionId
  });

  const { data: patients = [], isLoading: patientsLoading } = useQuery<TrackingPatient[]>({
    queryKey: ["/api/tracking/patients"],
  });

  const { data: servicePatients = [] } = useQuery<ServicePatient[]>({
    queryKey: ["/api/patients/service"],
  });

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  // Nurse department preferences for filtering nurses by department
  const { data: nurseDeptPreferences = [] } = useQuery<any[]>({
    queryKey: ["/api/nurse-department-preferences"],
  });

  // State for admit form department selection
  const [selectedAdmitDepartment, setSelectedAdmitDepartment] = useState<string>("");
  const [selectedAdmitDoctor, setSelectedAdmitDoctor] = useState<string>("");
  const [selectedAdmitNurse, setSelectedAdmitNurse] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");

  // Fetch available beds with real-time updates
  type AvailableBed = {
    id: string;
    bedNumber: string;
    bedName: string | null;
    wardName: string;
    floor: string;
    department: string;
  };
  const { data: availableBeds = [] } = useQuery<AvailableBed[]>({
    queryKey: ["/api/bed-management/beds/available"],
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  // Helper function to calculate days since a date
  const calculateDays = (dateString: string | Date | null | undefined): number => {
    if (!dateString) return 0;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filter doctors by department (matching specialty to department)
  const filteredDoctors = selectedAdmitDepartment
    ? doctors.filter(doc => {
        const specialty = doc.specialty?.toLowerCase() || "";
        const dept = selectedAdmitDepartment.toLowerCase();
        return specialty.includes(dept) || dept.includes(specialty) || specialty === "general" || dept === "general medicine";
      })
    : doctors;

  // Filter nurses by department (using their department preferences)
  const filteredNurses = selectedAdmitDepartment
    ? nurseDeptPreferences.filter(nurse => {
        return nurse.primaryDepartment === selectedAdmitDepartment ||
               nurse.secondaryDepartment === selectedAdmitDepartment ||
               nurse.tertiaryDepartment === selectedAdmitDepartment;
      })
    : nurseDeptPreferences;

  const { data: patientHistory } = useQuery<{
    patient: TrackingPatient;
    medications: Medication[];
    meals: Meal[];
    vitals: Vitals[];
  }>({
    queryKey: ["/api/tracking/patients", selectedPatientId, "history"],
    enabled: !!selectedPatientId,
  });

  const { data: doctorVisits = [] } = useQuery<DoctorVisit[]>({
    queryKey: ["/api/tracking/patients", selectedDoctorVisitPatientId, "doctor-visits"],
    enabled: !!selectedDoctorVisitPatientId,
  });

  // Billing state and queries
  const [selectedBillingPatientId, setSelectedBillingPatientId] = useState<string>("");
  const [billingPatientPopoverOpen, setBillingPatientPopoverOpen] = useState(false);
  const [billingForm, setBillingForm] = useState({
    roomCharges: "",
    roomDays: "1",
    doctorConsultation: "",
    labTests: "",
    medicines: "",
    inventoryCharges: "",
    otherFees: "",
    otherFeesDescription: "",
  });

  // Fetch all pending bills
  const { data: pendingBills = [], refetch: refetchBills } = useQuery<PatientBill[]>({
    queryKey: ["/api/patient-bills"],
    refetchInterval: 5000,
  });

  // Fetch selected patient's bill
  const { data: selectedPatientBill, refetch: refetchSelectedBill } = useQuery<PatientBill | null>({
    queryKey: ["/api/patient-bills/patient", selectedBillingPatientId],
    enabled: !!selectedBillingPatientId,
  });

  // Update billing form when selected patient bill changes
  useEffect(() => {
    if (selectedPatientBill) {
      setBillingForm({
        roomCharges: selectedPatientBill.roomCharges?.toString() || "",
        roomDays: selectedPatientBill.roomDays?.toString() || "1",
        doctorConsultation: selectedPatientBill.doctorConsultation?.toString() || "",
        labTests: selectedPatientBill.labTests?.toString() || "",
        medicines: selectedPatientBill.medicines?.toString() || "",
        inventoryCharges: selectedPatientBill.inventoryCharges?.toString() || "",
        otherFees: selectedPatientBill.otherFees?.toString() || "",
        otherFeesDescription: selectedPatientBill.otherFeesDescription || "",
      });
    } else {
      setBillingForm({
        roomCharges: "",
        roomDays: "1",
        doctorConsultation: "",
        labTests: "",
        medicines: "",
        inventoryCharges: "",
        otherFees: "",
        otherFeesDescription: "",
      });
    }
  }, [selectedPatientBill]);

  // Update bill mutation
  const updateBillMutation = useMutation({
    mutationFn: async (billId: string) => {
      const response = await apiRequest("PATCH", `/api/patient-bills/${billId}`, {
        roomCharges: billingForm.roomCharges || "0",
        roomDays: parseInt(billingForm.roomDays) || 1,
        doctorConsultation: billingForm.doctorConsultation || "0",
        labTests: billingForm.labTests || "0",
        medicines: billingForm.medicines || "0",
        inventoryCharges: billingForm.inventoryCharges || "0",
        otherFees: billingForm.otherFees || "0",
        otherFeesDescription: billingForm.otherFeesDescription,
      });
      return response.json();
    },
    onSuccess: () => {
      refetchSelectedBill();
      refetchBills();
      toast({
        title: "Bill Updated",
        description: "Bill has been updated and patient has been notified.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update bill. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate total for billing form
  const calculateBillTotal = () => {
    const room = parseFloat(billingForm.roomCharges) || 0;
    const doctor = parseFloat(billingForm.doctorConsultation) || 0;
    const lab = parseFloat(billingForm.labTests) || 0;
    const med = parseFloat(billingForm.medicines) || 0;
    const inv = parseFloat(billingForm.inventoryCharges) || 0;
    const other = parseFloat(billingForm.otherFees) || 0;
    return room + doctor + lab + med + inv + other;
  };

  const admitPatientMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      age: number;
      gender: string;
      department: string;
      room: string;
      diagnosis: string;
      doctor: string;
      nurse?: string;
      notes?: string;
    }) => {
      return await apiRequest("POST", "/api/tracking/patients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nurse-department-preferences"] });
      toast({
        title: "Patient Admitted",
        description: "Patient has been admitted successfully.",
      });
      setActiveTab("patients");
      setSelectedAdmitPatientName("");
      setSelectedAdmitDepartment("");
      setSelectedAdmitDoctor("");
      setSelectedAdmitNurse("");
      setSelectedRoom("");
      queryClient.invalidateQueries({ queryKey: ["/api/bed-management/beds/available"] });
    },
    onError: () => {
      toast({
        title: "Admission Failed",
        description: "Failed to admit patient. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addVitalsMutation = useMutation({
    mutationFn: async (data: {
      patientId: string;
      temperature?: string;
      heartRate?: number;
      bloodPressureSystolic?: number;
      bloodPressureDiastolic?: number;
      respiratoryRate?: number;
      oxygenSaturation?: number;
      recordedBy: string;
      notes?: string;
    }) => {
      return await apiRequest("POST", `/api/tracking/patients/${data.patientId}/vitals`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/patients"] });
      toast({
        title: "Vitals Recorded",
        description: "Patient vitals have been recorded successfully.",
      });
      setSelectedVitalsPatientId("");
    },
    onError: () => {
      toast({
        title: "Failed",
        description: "Failed to record vitals. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addMedicationMutation = useMutation({
    mutationFn: async (data: {
      patientId: string;
      name: string;
      dosage: string;
      route: string;
      frequency: string;
      administeredBy: string;
      notes?: string;
    }) => {
      return await apiRequest("POST", `/api/tracking/patients/${data.patientId}/meds`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/patients"] });
      toast({
        title: "Medication Added",
        description: "Medication has been administered successfully.",
      });
      setSelectedMedsPatientId("");
    },
    onError: () => {
      toast({
        title: "Failed",
        description: "Failed to add medication. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addMealMutation = useMutation({
    mutationFn: async (data: {
      patientId: string;
      mealType: string;
      description: string;
      calories?: number;
      servedBy: string;
      consumptionPercentage?: number;
      notes?: string;
    }) => {
      return await apiRequest("POST", `/api/tracking/patients/${data.patientId}/meals`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/patients"] });
      toast({
        title: "Meal Logged",
        description: "Meal has been logged successfully.",
      });
      setSelectedMealsPatientId("");
    },
    onError: () => {
      toast({
        title: "Failed",
        description: "Failed to log meal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addDoctorVisitMutation = useMutation({
    mutationFn: async (data: {
      patientId: string;
      visitDate: string;
      visitTime: string;
      createdBy: string;
      notes?: string;
    }) => {
      return await apiRequest("POST", `/api/tracking/patients/${data.patientId}/doctor-visits`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/patients", variables.patientId, "doctor-visits"] });
      toast({
        title: "Doctor Visit Scheduled",
        description: "Doctor visit has been scheduled successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed",
        description: "Failed to schedule doctor visit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/tracking/patients/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/patients"] });
      toast({
        title: "Status Updated",
        description: "Patient status has been updated.",
      });
    },
  });

  const dischargePatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      return await apiRequest("PATCH", `/api/tracking/patients/${patientId}/discharge`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/patients"] });
      toast({
        title: "Patient Discharged",
        description: "Patient has been discharged successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Discharge Failed",
        description: "Failed to discharge patient. Please try again.",
        variant: "destructive",
      });
    },
  });

  const switchToIcuMutation = useMutation({
    mutationFn: async (patient: TrackingPatient) => {
      const today = new Date().toISOString().split('T')[0];
      // Create ICU chart
      await apiRequest("POST", "/api/icu-charts", {
        patientId: patient.id,
        patientName: patient.name,
        age: patient.age?.toString() || "",
        sex: patient.gender || "",
        diagnosis: patient.diagnosis || "",
        dateOfAdmission: patient.admissionDate ? new Date(patient.admissionDate).toISOString().split('T')[0] : today,
        ward: "ICU",
        bedNo: patient.room || "",
        chartDate: today,
        admittingConsultant: patient.doctor || "",
        icuConsultant: patient.doctor || "",
      });
      // Update patient's ICU status
      return await apiRequest("PATCH", `/api/tracking/patients/${patient.id}/transfer-icu`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/icu-charts"] });
      toast({
        title: "Transferred to ICU",
        description: "Patient has been transferred to ICU. ICU chart created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Transfer Failed",
        description: "Failed to transfer patient to ICU. Please try again.",
        variant: "destructive",
      });
    },
  });

  const transferToWardMutation = useMutation({
    mutationFn: async (patientId: string) => {
      return await apiRequest("PATCH", `/api/tracking/patients/${patientId}/transfer-ward`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/icu-charts"] });
      toast({
        title: "Transferred to Ward",
        description: "Patient has been transferred from ICU to ward successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Transfer Failed",
        description: "Failed to transfer patient to ward. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      admitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      stable: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      discharged: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    };
    return styles[status] || styles.admitted;
  };

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.room.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || patient.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const criticalPatients = patients.filter(p => p.status === "critical");
  const admittedPatients = patients.filter(p => p.status === "admitted");

  const handleAdmitPatient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const notes = formData.get("notes") as string;
    const nurse = formData.get("nurse") as string;
    admitPatientMutation.mutate({
      name: formData.get("name") as string,
      age: parseInt(formData.get("age") as string),
      gender: formData.get("gender") as string,
      department: formData.get("department") as string,
      room: formData.get("room") as string,
      diagnosis: formData.get("diagnosis") as string,
      doctor: formData.get("doctor") as string,
      nurse: nurse || undefined,
      notes: notes || undefined,
    });
  };

  const handleAddVitals = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addVitalsMutation.mutate({
      patientId: formData.get("patientId") as string,
      temperature: formData.get("temperature") as string || undefined,
      heartRate: parseInt(formData.get("heartRate") as string) || undefined,
      bloodPressureSystolic: parseInt(formData.get("bpSystolic") as string) || undefined,
      bloodPressureDiastolic: parseInt(formData.get("bpDiastolic") as string) || undefined,
      respiratoryRate: parseInt(formData.get("respiratoryRate") as string) || undefined,
      oxygenSaturation: parseInt(formData.get("oxygenSaturation") as string) || undefined,
      recordedBy: formData.get("recordedBy") as string,
      notes: formData.get("notes") as string || undefined,
    });
  };

  const handleAddMedication = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addMedicationMutation.mutate({
      patientId: formData.get("patientId") as string,
      name: formData.get("name") as string,
      dosage: formData.get("dosage") as string,
      route: formData.get("route") as string,
      frequency: formData.get("frequency") as string,
      administeredBy: formData.get("administeredBy") as string,
      notes: formData.get("notes") as string || undefined,
    });
  };

  const handleAddMeal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addMealMutation.mutate({
      patientId: formData.get("patientId") as string,
      mealType: formData.get("mealType") as string,
      description: formData.get("description") as string,
      calories: parseInt(formData.get("calories") as string) || undefined,
      servedBy: formData.get("servedBy") as string,
      consumptionPercentage: parseInt(formData.get("consumption") as string) || 100,
      notes: formData.get("notes") as string || undefined,
    });
  };

  const handleAddDoctorVisit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addDoctorVisitMutation.mutate({
      patientId: formData.get("patientId") as string,
      visitDate: formData.get("visitDate") as string,
      visitTime: formData.get("visitTime") as string,
      createdBy: "Nurse",
      notes: formData.get("notes") as string || undefined,
    });
  };

  const tabs = [
    { id: "patients" as TabType, label: "All Patients", icon: Bed },
    { id: "admit" as TabType, label: "Admit Patient", icon: Plus },
    { id: "doctor_visits" as TabType, label: "Doctor Visit", icon: Stethoscope },
    { id: "billing" as TabType, label: "Billing", icon: IndianRupee },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Patient Tracking System</h1>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>Inpatient Wing, Gravity Hospital</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-lg">
                <Phone className="h-4 w-4" />
                <span className="text-sm">Nursing: +91 20 1234 5683</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-lg">
                <Clock className="h-4 w-4" />
                <span className="text-sm">24/7 Patient Care</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 mb-6 bg-muted/50 p-1 rounded-lg">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2"
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {activeTab === "patients" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Patients</p>
                      <p className="text-3xl font-bold">{patients.length}</p>
                    </div>
                    <Bed className="h-10 w-10 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Critical</p>
                      <p className="text-3xl font-bold text-red-600">{criticalPatients.length}</p>
                    </div>
                    <AlertCircle className="h-10 w-10 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Admitted</p>
                      <p className="text-3xl font-bold text-blue-600">{admittedPatients.length}</p>
                    </div>
                    <User className="h-10 w-10 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">ICU Beds</p>
                      <p className="text-3xl font-bold">{patients.filter(p => p.room.includes("ICU")).length}</p>
                    </div>
                    <Heart className="h-10 w-10 text-pink-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or room..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-patients"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48" data-testid="select-status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="admitted">Admitted</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="discharged">Discharged</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {patientsLoading ? (
              <div className="text-center py-8">Loading patients...</div>
            ) : (
              <div className="grid gap-4">
                {filteredPatients.map((patient) => (
                  <Card key={patient.id} data-testid={`card-patient-${patient.id}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <User className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{patient.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {patient.age} yrs, {patient.gender} | Room: {patient.room}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Diagnosis: {patient.diagnosis}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <Badge className={getStatusBadge(patient.status)}>{patient.status}</Badge>
                          {patient.isInIcu && (
                            <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">
                              <HeartPulse className="h-3 w-3 mr-1" />
                              In ICU
                            </Badge>
                          )}
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Attending</p>
                            <p className="font-medium">{patient.doctor}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Admitted</p>
                            <p className="font-medium">{new Date(patient.admissionDate).toLocaleDateString()}</p>
                          </div>
                          {patient.status === "discharged" && patient.dischargeDate && (
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Discharged</p>
                              <p className="font-medium">{new Date(patient.dischargeDate).toLocaleDateString()}</p>
                            </div>
                          )}
                          <Dialog open={monitoringViewPatient?.id === patient.id} onOpenChange={(open) => !open && setMonitoringViewPatient(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMonitoringViewPatient(patient)}
                                data-testid={`button-view-history-${patient.id}`}
                              >
                                View Details
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                              <DialogHeader className="border-b pb-3">
                                <DialogTitle className="flex items-center gap-3">
                                  <ClipboardList className="h-5 w-5 text-primary" />
                                  Patient Monitoring: {patient.name}
                                </DialogTitle>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <Badge variant="outline">{patient.age} yrs, {patient.gender}</Badge>
                                  <Badge variant="outline">Room: {patient.room}</Badge>
                                  <Badge className={getStatusBadge(patient.status)}>{patient.status}</Badge>
                                  {patient.isInIcu && (
                                    <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">
                                      <HeartPulse className="h-3 w-3 mr-1" />
                                      In ICU
                                    </Badge>
                                  )}
                                </div>
                              </DialogHeader>
                              
                              <ScrollArea className="flex-1 pr-4">
                                {!monitoringSession ? (
                                  <div className="py-8 text-center text-muted-foreground">
                                    <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No monitoring session found for this patient.</p>
                                    <p className="text-sm mt-1">Please create a monitoring session in Patient Monitoring first.</p>
                                  </div>
                                ) : (
                                  <Accordion type="multiple" defaultValue={["vitals", "overview"]} className="space-y-2">
                                    {/* Overview Section */}
                                    <AccordionItem value="overview" className="border rounded-lg px-4">
                                      <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-2">
                                          <Activity className="h-4 w-4 text-blue-500" />
                                          <span>Overview</span>
                                          <Badge variant="outline" className="ml-2 text-xs">Session Info</Badge>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
                                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                                            <p className="text-2xl font-bold text-blue-500">{monitoringVitals.length}</p>
                                            <p className="text-xs text-muted-foreground">Vitals Records</p>
                                          </div>
                                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                                            <p className="text-2xl font-bold text-purple-500">{monitoringInotropes.length}</p>
                                            <p className="text-xs text-muted-foreground">Inotrope Entries</p>
                                          </div>
                                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                                            <p className="text-2xl font-bold text-cyan-500">{monitoringIO.length}</p>
                                            <p className="text-xs text-muted-foreground">I/O Records</p>
                                          </div>
                                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                                            <p className="text-2xl font-bold text-orange-500">{monitoringTests.length}</p>
                                            <p className="text-xs text-muted-foreground">Tests Ordered</p>
                                          </div>
                                        </div>
                                        <div className="mt-3 p-3 border rounded-lg text-sm">
                                          <div className="grid grid-cols-2 gap-2">
                                            <div><span className="text-muted-foreground">Diagnosis:</span> <span className="font-medium">{patient.diagnosis}</span></div>
                                            <div><span className="text-muted-foreground">Doctor:</span> <span className="font-medium">{patient.doctor}</span></div>
                                            <div><span className="text-muted-foreground">Admitted:</span> <span className="font-medium">{new Date(patient.admissionDate).toLocaleDateString()}</span></div>
                                            <div><span className="text-muted-foreground">Session Date:</span> <span className="font-medium">{new Date(monitoringSession.sessionDate).toLocaleDateString()}</span></div>
                                          </div>
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>

                                    {/* Vitals Section */}
                                    <AccordionItem value="vitals" className="border rounded-lg px-4">
                                      <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-2">
                                          <Heart className="h-4 w-4 text-red-500" />
                                          <span>Vitals</span>
                                          <Badge variant="outline" className="ml-2 text-xs">{monitoringVitals.length} records</Badge>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        {monitoringVitals.length > 0 ? (
                                          <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {monitoringVitals.slice(0, 10).map((v: any) => (
                                              <div key={v.id} className="p-3 border rounded-lg text-sm">
                                                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                                  <span><strong>HR:</strong> {v.heartRate} bpm</span>
                                                  <span><strong>BP:</strong> {v.systolicBp}/{v.diastolicBp}</span>
                                                  <span><strong>SpO2:</strong> {v.spo2}%</span>
                                                  <span><strong>Temp:</strong> {v.temperature}°C</span>
                                                  <span><strong>RR:</strong> {v.respiratoryRate}/min</span>
                                                </div>
                                                <p className="text-muted-foreground mt-1 text-xs">
                                                  {v.timeSlot} - {new Date(v.recordedAt).toLocaleString()}
                                                </p>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-muted-foreground py-4 text-center">No vitals recorded</p>
                                        )}
                                      </AccordionContent>
                                    </AccordionItem>

                                    {/* Inotropes Section */}
                                    <AccordionItem value="inotropes" className="border rounded-lg px-4">
                                      <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-2">
                                          <Syringe className="h-4 w-4 text-purple-500" />
                                          <span>Inotropes & Medications</span>
                                          <Badge variant="outline" className="ml-2 text-xs">{monitoringInotropes.length} entries</Badge>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        {monitoringInotropes.length > 0 ? (
                                          <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {monitoringInotropes.map((i: any) => (
                                              <div key={i.id} className="p-3 border rounded-lg text-sm">
                                                <p className="font-medium">{i.drugName}</p>
                                                <div className="grid grid-cols-2 gap-2 mt-1 text-muted-foreground">
                                                  <span>Dose: {i.dose} {i.unit}</span>
                                                  <span>Rate: {i.rate} {i.rateUnit}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">{i.timeSlot}</p>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-muted-foreground py-4 text-center">No inotropes recorded</p>
                                        )}
                                      </AccordionContent>
                                    </AccordionItem>

                                    {/* Ventilator Section */}
                                    <AccordionItem value="ventilator" className="border rounded-lg px-4">
                                      <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-2">
                                          <Wind className="h-4 w-4 text-cyan-500" />
                                          <span>Ventilator Settings</span>
                                          <Badge variant="outline" className="ml-2 text-xs">{monitoringVentilator.length} records</Badge>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        {monitoringVentilator.length > 0 ? (
                                          <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {monitoringVentilator.map((v: any) => (
                                              <div key={v.id} className="p-3 border rounded-lg text-sm">
                                                <p className="font-medium">Mode: {v.mode}</p>
                                                <div className="grid grid-cols-3 gap-2 mt-1 text-muted-foreground">
                                                  <span>FiO2: {v.fio2}%</span>
                                                  <span>PEEP: {v.peep}</span>
                                                  <span>TV: {v.tidalVolume}ml</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">{v.timeSlot}</p>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-muted-foreground py-4 text-center">No ventilator settings recorded</p>
                                        )}
                                      </AccordionContent>
                                    </AccordionItem>

                                    {/* I/O Balance Section */}
                                    <AccordionItem value="io" className="border rounded-lg px-4">
                                      <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-2">
                                          <ArrowUpDown className="h-4 w-4 text-green-500" />
                                          <span>Intake/Output Balance</span>
                                          <Badge variant="outline" className="ml-2 text-xs">{monitoringIO.length} records</Badge>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        {monitoringIO.length > 0 ? (
                                          <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {monitoringIO.map((io: any) => (
                                              <div key={io.id} className="p-3 border rounded-lg text-sm flex items-center justify-between">
                                                <div>
                                                  <p className="font-medium flex items-center gap-1">
                                                    {io.type === 'intake' ? (
                                                      <TrendingUp className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                      <TrendingDown className="h-4 w-4 text-red-500" />
                                                    )}
                                                    {io.category}
                                                  </p>
                                                  <p className="text-xs text-muted-foreground">{io.description}</p>
                                                </div>
                                                <Badge variant={io.type === 'intake' ? 'default' : 'secondary'}>
                                                  {io.amount} ml
                                                </Badge>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-muted-foreground py-4 text-center">No I/O records</p>
                                        )}
                                      </AccordionContent>
                                    </AccordionItem>

                                    {/* Procedures Section */}
                                    <AccordionItem value="procedures" className="border rounded-lg px-4">
                                      <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-2">
                                          <Stethoscope className="h-4 w-4 text-indigo-500" />
                                          <span>Procedures</span>
                                          <Badge variant="outline" className="ml-2 text-xs">{monitoringProcedures.length} records</Badge>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        {monitoringProcedures.length > 0 ? (
                                          <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {monitoringProcedures.map((p: any) => (
                                              <div key={p.id} className="p-3 border rounded-lg text-sm">
                                                <p className="font-medium">{p.procedureName}</p>
                                                <p className="text-muted-foreground text-xs mt-1">{p.notes}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(p.performedAt).toLocaleString()}</p>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-muted-foreground py-4 text-center">No procedures recorded</p>
                                        )}
                                      </AccordionContent>
                                    </AccordionItem>

                                    {/* Tests Section */}
                                    <AccordionItem value="tests" className="border rounded-lg px-4">
                                      <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-2">
                                          <TestTube2 className="h-4 w-4 text-orange-500" />
                                          <span>Diagnostic Tests</span>
                                          <Badge variant="outline" className="ml-2 text-xs">{monitoringTests.length} orders</Badge>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        {monitoringTests.length > 0 ? (
                                          <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {monitoringTests.map((t: any) => (
                                              <div key={t.id} className="p-3 border rounded-lg text-sm flex items-center justify-between">
                                                <div>
                                                  <p className="font-medium">{t.testName}</p>
                                                  <p className="text-xs text-muted-foreground">{t.category} - {t.priority}</p>
                                                </div>
                                                <Badge variant={
                                                  t.status === 'COMPLETED' ? 'default' :
                                                  t.status === 'IN_PROGRESS' ? 'secondary' : 'outline'
                                                }>
                                                  {t.status}
                                                </Badge>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-muted-foreground py-4 text-center">No tests ordered</p>
                                        )}
                                      </AccordionContent>
                                    </AccordionItem>

                                    {/* Notes Section */}
                                    <AccordionItem value="notes" className="border rounded-lg px-4">
                                      <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-gray-500" />
                                          <span>Clinical Notes</span>
                                          <Badge variant="outline" className="ml-2 text-xs">{monitoringNotes.length} notes</Badge>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        {monitoringNotes.length > 0 ? (
                                          <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {monitoringNotes.map((n: any) => (
                                              <div key={n.id} className="p-3 border rounded-lg text-sm">
                                                <div className="flex items-center justify-between mb-1">
                                                  <Badge variant="outline">{n.noteType}</Badge>
                                                  <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</span>
                                                </div>
                                                <p className="text-muted-foreground">{n.content}</p>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-muted-foreground py-4 text-center">No notes recorded</p>
                                        )}
                                      </AccordionContent>
                                    </AccordionItem>
                                  </Accordion>
                                )}
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                          <Select
                            value={patient.status}
                            onValueChange={(status) => updateStatusMutation.mutate({ id: patient.id, status })}
                          >
                            <SelectTrigger className="w-32" data-testid={`select-status-${patient.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admitted">Admitted</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                              <SelectItem value="stable">Stable</SelectItem>
                              <SelectItem value="discharged">Discharged</SelectItem>
                            </SelectContent>
                          </Select>
                          {patient.status !== "discharged" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                {patient.isInIcu ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                    data-testid={`button-transfer-ward-${patient.id}`}
                                  >
                                    <Bed className="h-4 w-4 mr-1" />
                                    Transfer to Ward
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
                                    data-testid={`button-switch-icu-${patient.id}`}
                                  >
                                    <HeartPulse className="h-4 w-4 mr-1" />
                                    Switch to ICU
                                  </Button>
                                )}
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {patient.isInIcu ? "Transfer Patient to Ward" : "Transfer Patient to ICU"}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {patient.isInIcu 
                                      ? `Are you sure you want to transfer ${patient.name} from ICU to ward?`
                                      : `Are you sure you want to transfer ${patient.name} to ICU? An ICU monitoring chart will be created automatically with the patient's details.`
                                    }
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => patient.isInIcu 
                                      ? transferToWardMutation.mutate(patient.id)
                                      : switchToIcuMutation.mutate(patient)
                                    }
                                    className={patient.isInIcu ? "bg-orange-600 hover:bg-orange-700" : "bg-cyan-600 hover:bg-cyan-700"}
                                    data-testid={patient.isInIcu ? `button-confirm-transfer-ward-${patient.id}` : `button-confirm-switch-icu-${patient.id}`}
                                  >
                                    Confirm Transfer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          <Dialog open={historyPatient?.id === patient.id} onOpenChange={(open) => !open && setHistoryPatient(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                onClick={() => setHistoryPatient(patient)}
                                data-testid={`button-history-${patient.id}`}
                              >
                                <History className="h-4 w-4 mr-1" />
                                History
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <History className="h-5 w-5 text-purple-600" />
                                  Patient History - {patient.name}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6 mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        Patient Details
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Name:</span>
                                        <span className="font-medium">{patient.name}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Age:</span>
                                        <span>{patient.age} years</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Gender:</span>
                                        <span className="capitalize">{patient.gender}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Blood Group:</span>
                                        <span>{patient.bloodGroup || "N/A"}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Room:</span>
                                        <span>{patient.room}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Diagnosis:</span>
                                        <span>{patient.diagnosis || "N/A"}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Attending Doctor:</span>
                                        <span>{patient.attendingDoctor || "N/A"}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Status:</span>
                                        <Badge variant={patient.status === "critical" ? "destructive" : patient.status === "stable" ? "default" : "secondary"}>
                                          {patient.status}
                                        </Badge>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        Admission & Stay Duration
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Admission Date:</span>
                                        <span className="font-medium">
                                          {patient.admissionDate ? new Date(patient.admissionDate).toLocaleDateString() : "N/A"}
                                        </span>
                                      </div>
                                      <div className="border-t pt-3 space-y-2">
                                        <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                          <div className="flex items-center gap-2">
                                            <Bed className="h-4 w-4 text-blue-600" />
                                            <span className="text-blue-700 dark:text-blue-300">Total Hospital Stay:</span>
                                          </div>
                                          <span className="font-bold text-blue-700 dark:text-blue-300">
                                            {calculateDays(patient.admissionDate)} days
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                          <div className="flex items-center gap-2">
                                            <Bed className="h-4 w-4 text-green-600" />
                                            <span className="text-green-700 dark:text-green-300">General Ward:</span>
                                          </div>
                                          <span className="font-bold text-green-700 dark:text-green-300">
                                            {patient.isInIcu 
                                              ? (patient.icuTransferDate 
                                                  ? calculateDays(patient.admissionDate) - calculateDays(patient.icuTransferDate)
                                                  : 0)
                                              : calculateDays(patient.admissionDate)
                                            } days
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                          <div className="flex items-center gap-2">
                                            <HeartPulse className="h-4 w-4 text-red-600" />
                                            <span className="text-red-700 dark:text-red-300">ICU Stay:</span>
                                          </div>
                                          <span className="font-bold text-red-700 dark:text-red-300">
                                            {patient.isInIcu && patient.icuTransferDate 
                                              ? calculateDays(patient.icuTransferDate)
                                              : (patient.icuDays || 0)
                                            } days
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                                          <div className="flex items-center gap-2">
                                            <Wind className="h-4 w-4 text-cyan-600" />
                                            <span className="text-cyan-700 dark:text-cyan-300">Ventilator:</span>
                                          </div>
                                          <span className="font-bold text-cyan-700 dark:text-cyan-300">
                                            {patient.ventilatorDays || 0} days
                                          </span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>

                                <Card>
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                      <Activity className="h-4 w-4 text-muted-foreground" />
                                      Additional Information
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-2 text-sm">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Currently in ICU:</span>
                                        <Badge variant={patient.isInIcu ? "destructive" : "secondary"}>
                                          {patient.isInIcu ? "Yes" : "No"}
                                        </Badge>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Department:</span>
                                        <span>{patient.department || "N/A"}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Assigned Nurse:</span>
                                        <span>{patient.assignedNurse || "N/A"}</span>
                                      </div>
                                      {patient.icuTransferDate && (
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">ICU Transfer Date:</span>
                                          <span>{new Date(patient.icuTransferDate).toLocaleDateString()}</span>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "admit" && (
          <Card>
            <CardHeader>
              <CardTitle>Admit New Patient</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdmitPatient} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Patient Name</Label>
                    <input type="hidden" name="name" value={selectedAdmitPatientName} />
                    <Popover open={admitPatientPopoverOpen} onOpenChange={setAdmitPatientPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={admitPatientPopoverOpen}
                          className={cn(
                            "w-full justify-between h-10",
                            !selectedAdmitPatientName && "text-muted-foreground"
                          )}
                          data-testid="select-patient-name"
                        >
                          {selectedAdmitPatientName || "Select patient"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search patients..." data-testid="input-admit-patient-search" />
                          <CommandList>
                            <CommandEmpty>No patient found.</CommandEmpty>
                            <CommandGroup>
                              {servicePatients.map((patient) => (
                                <CommandItem
                                  key={patient.id}
                                  value={`${patient.firstName} ${patient.lastName}`}
                                  onSelect={(value) => {
                                    setSelectedAdmitPatientName(value);
                                    setAdmitPatientPopoverOpen(false);
                                  }}
                                  data-testid={`admit-patient-option-${patient.id}`}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedAdmitPatientName === `${patient.firstName} ${patient.lastName}` ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span>{patient.firstName} {patient.lastName}</span>
                                    {patient.phone && (
                                      <span className="text-xs text-muted-foreground">{patient.phone}</span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input type="number" name="age" required min="0" max="150" placeholder="Age" data-testid="input-age" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select name="gender" required>
                      <SelectTrigger data-testid="select-gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select 
                      name="department" 
                      required 
                      value={selectedAdmitDepartment}
                      onValueChange={(value) => {
                        setSelectedAdmitDepartment(value);
                        setSelectedAdmitDoctor("");
                        setSelectedAdmitNurse("");
                        setSelectedRoom("");
                      }}
                    >
                      <SelectTrigger data-testid="select-department">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        <SelectItem value="General Medicine">General Medicine</SelectItem>
                        <SelectItem value="Cardiology">Cardiology</SelectItem>
                        <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                        <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                        <SelectItem value="Neurology">Neurology</SelectItem>
                        <SelectItem value="Gynecology">Gynecology</SelectItem>
                        <SelectItem value="Pulmonology">Pulmonology</SelectItem>
                        <SelectItem value="Dermatology">Dermatology</SelectItem>
                        <SelectItem value="Gastroenterology">Gastroenterology</SelectItem>
                        <SelectItem value="Endocrinology">Endocrinology</SelectItem>
                        <SelectItem value="Nephrology">Nephrology</SelectItem>
                        <SelectItem value="Ophthalmology">Ophthalmology</SelectItem>
                        <SelectItem value="ICU">ICU</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                        <SelectItem value="ENT">ENT</SelectItem>
                        <SelectItem value="Oncology">Oncology</SelectItem>
                        <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                        <SelectItem value="Urology">Urology</SelectItem>
                        <SelectItem value="Rheumatology">Rheumatology</SelectItem>
                        <SelectItem value="Pathology">Pathology</SelectItem>
                        <SelectItem value="Radiology">Radiology</SelectItem>
                        <SelectItem value="Physiotherapy">Physiotherapy</SelectItem>
                        <SelectItem value="Dental">Dental</SelectItem>
                        <SelectItem value="General Surgery">General Surgery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room">Room Number</Label>
                    <Select 
                      name="room" 
                      required 
                      value={selectedRoom}
                      onValueChange={setSelectedRoom}
                    >
                      <SelectTrigger data-testid="select-room">
                        <SelectValue placeholder="Select available room" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        {availableBeds.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">No rooms available</div>
                        ) : (
                          availableBeds.map((bed) => (
                            <SelectItem key={bed.id} value={`${bed.wardName}-${bed.bedNumber}`}>
                              {bed.wardName} - {bed.bedNumber} ({bed.department}, Floor {bed.floor})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctor">Attending Doctor</Label>
                    <Select 
                      name="doctor" 
                      required 
                      value={selectedAdmitDoctor}
                      onValueChange={setSelectedAdmitDoctor}
                    >
                      <SelectTrigger data-testid="select-doctor">
                        <SelectValue placeholder={selectedAdmitDepartment ? "Select physician" : "Select department first"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        {!selectedAdmitDepartment ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">Please select a department first</div>
                        ) : filteredDoctors.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">No doctors available for this department</div>
                        ) : (
                          filteredDoctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.name}>
                              {doctor.name} - {doctor.specialty}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nurse">Attending Nurse</Label>
                    <Select 
                      name="nurse" 
                      value={selectedAdmitNurse}
                      onValueChange={setSelectedAdmitNurse}
                    >
                      <SelectTrigger data-testid="select-nurse">
                        <SelectValue placeholder={selectedAdmitDepartment ? "Select nurse (optional)" : "Select department first"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        {!selectedAdmitDepartment ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">Please select a department first</div>
                        ) : filteredNurses.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">No nurses assigned to this department</div>
                        ) : (
                          filteredNurses.map((nurse) => {
                            const deptLevel = nurse.primaryDepartment === selectedAdmitDepartment 
                              ? "Primary" 
                              : nurse.secondaryDepartment === selectedAdmitDepartment 
                                ? "Secondary" 
                                : "Tertiary";
                            return (
                              <SelectItem key={nurse.nurseId} value={nurse.nurseName}>
                                {nurse.nurseName} - {selectedAdmitDepartment} ({deptLevel})
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="diagnosis">Diagnosis</Label>
                    <Textarea name="diagnosis" required placeholder="Primary diagnosis" data-testid="input-diagnosis" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea name="notes" placeholder="Additional notes (optional)" data-testid="input-notes" />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={admitPatientMutation.isPending}
                  data-testid="button-admit-patient"
                >
                  {admitPatientMutation.isPending ? "Admitting..." : "Admit Patient"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === "doctor_visits" && (
          <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Schedule Doctor Visit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddDoctorVisit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientId">Select Patient</Label>
                    <input type="hidden" name="patientId" value={selectedDoctorVisitPatientId} />
                    <Popover open={doctorVisitPatientPopoverOpen} onOpenChange={setDoctorVisitPatientPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={doctorVisitPatientPopoverOpen}
                          className={cn(
                            "w-full justify-between h-10",
                            !selectedDoctorVisitPatientId && "text-muted-foreground"
                          )}
                          data-testid="button-select-doctor-visit-patient"
                        >
                          {selectedDoctorVisitPatientId
                            ? (() => {
                                const p = patients.find(p => p.id === selectedDoctorVisitPatientId);
                                return p ? `${p.name} (Room ${p.room})` : "Select patient";
                              })()
                            : "Select patient"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search patients..." data-testid="input-doctor-visit-patient-search" />
                          <CommandList>
                            <CommandEmpty>No patients found.</CommandEmpty>
                            <CommandGroup>
                              {patients.filter(p => p.status !== "discharged").map((p) => (
                                <CommandItem
                                  key={p.id}
                                  value={`${p.name} ${p.room}`}
                                  onSelect={() => {
                                    setSelectedDoctorVisitPatientId(p.id);
                                    setDoctorVisitPatientPopoverOpen(false);
                                  }}
                                  data-testid={`doctor-visit-patient-option-${p.id}`}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedDoctorVisitPatientId === p.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {p.name} - Room {p.room}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visitDate">Date</Label>
                    <Input type="date" name="visitDate" required data-testid="input-visit-date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visitTime">Time</Label>
                    <Input type="time" name="visitTime" required data-testid="input-visit-time" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea name="notes" placeholder="Any additional notes about the visit" data-testid="input-doctor-visit-notes" />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={addDoctorVisitMutation.isPending}
                  data-testid="button-schedule-doctor-visit"
                >
                  {addDoctorVisitMutation.isPending ? "Scheduling..." : "Update"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {selectedDoctorVisitPatientId && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Previous Visits
                  {(() => {
                    const p = patients.find(p => p.id === selectedDoctorVisitPatientId);
                    return p ? ` - ${p.name}` : "";
                  })()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {doctorVisits.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No previous visits recorded for this patient.</p>
                ) : (
                  <div className="space-y-3">
                    {doctorVisits.map((visit) => (
                      <div key={visit.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`doctor-visit-${visit.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <Stethoscope className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{visit.visitDate} at {visit.visitTime}</p>
                            {visit.notes && <p className="text-sm text-muted-foreground">{visit.notes}</p>}
                          </div>
                        </div>
                        <Badge variant={visit.status === "completed" ? "default" : visit.status === "cancelled" ? "destructive" : "secondary"}>
                          {visit.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          </>
        )}

        {activeTab === "billing" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Bills List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Pending Bill Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingBills.filter(b => b.status === "pending" && parseFloat(b.totalAmount?.toString() || "0") === 0).length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No pending bill requests.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingBills
                      .filter(b => b.status === "pending" && parseFloat(b.totalAmount?.toString() || "0") === 0)
                      .map((bill) => {
                        return (
                          <div
                            key={bill.id}
                            className={cn(
                              "p-4 rounded-lg border cursor-pointer transition-colors",
                              selectedBillingPatientId === bill.patientId
                                ? "border-primary bg-primary/5"
                                : "hover:bg-muted/50"
                            )}
                            onClick={() => setSelectedBillingPatientId(bill.patientId)}
                            data-testid={`pending-bill-${bill.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{bill.patientName}</p>
                                <p className="text-sm text-muted-foreground">ID: {bill.patientId}</p>
                              </div>
                              <Badge variant="secondary">Awaiting Charges</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Requested: {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* All Bills Section */}
                <div className="mt-6">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    All Patient Bills
                  </h4>
                  {pendingBills.filter(b => parseFloat(b.totalAmount?.toString() || "0") > 0).length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No processed bills yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {pendingBills
                        .filter(b => parseFloat(b.totalAmount?.toString() || "0") > 0)
                        .map((bill) => {
                          return (
                            <div
                              key={bill.id}
                              className={cn(
                                "p-3 rounded-lg border cursor-pointer transition-colors",
                                selectedBillingPatientId === bill.patientId
                                  ? "border-primary bg-primary/5"
                                  : "hover:bg-muted/50"
                              )}
                              onClick={() => setSelectedBillingPatientId(bill.patientId)}
                              data-testid={`bill-${bill.id}`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">{bill.patientName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Total: ₹{parseFloat(bill.totalAmount?.toString() || "0").toLocaleString('en-IN')}
                                  </p>
                                </div>
                                <Badge variant={
                                  bill.status === "paid" ? "default" :
                                  bill.status === "partial" ? "secondary" :
                                  "outline"
                                }>
                                  {bill.status}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bill Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  {selectedPatientBill ? "Edit Bill Charges" : "Select a Bill to Edit"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedBillingPatientId ? (
                  <div className="text-center py-8">
                    <IndianRupee className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Select a patient bill from the list to add or edit charges.</p>
                  </div>
                ) : !selectedPatientBill ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading bill details...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Patient Info */}
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium">{selectedPatientBill.patientName}</p>
                      <p className="text-sm text-muted-foreground">
                        Patient ID: {selectedPatientBill.patientId}
                      </p>
                    </div>

                    {/* Charge Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="roomCharges">Room Charges (₹)</Label>
                        <NumericInput
                          value={billingForm.roomCharges}
                          onValueChange={(value) => setBillingForm(f => ({ ...f, roomCharges: value }))}
                          placeholder="0"
                          data-testid="input-room-charges"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roomDays">Room Days</Label>
                        <IntegerInput
                          value={billingForm.roomDays}
                          onValueChange={(value) => setBillingForm(f => ({ ...f, roomDays: value }))}
                          min={1}
                          data-testid="input-room-days"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="doctorConsultation">Doctor Consultation (₹)</Label>
                        <NumericInput
                          value={billingForm.doctorConsultation}
                          onValueChange={(value) => setBillingForm(f => ({ ...f, doctorConsultation: value }))}
                          placeholder="0"
                          data-testid="input-doctor-consultation"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labTests">Lab Tests (₹)</Label>
                        <NumericInput
                          value={billingForm.labTests}
                          onValueChange={(value) => setBillingForm(f => ({ ...f, labTests: value }))}
                          placeholder="0"
                          data-testid="input-lab-tests"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="medicines">Medicines (₹)</Label>
                        <NumericInput
                          value={billingForm.medicines}
                          onValueChange={(value) => setBillingForm(f => ({ ...f, medicines: value }))}
                          placeholder="0"
                          data-testid="input-medicines"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inventoryCharges">Inventory/Equipment (₹)</Label>
                        <NumericInput
                          value={billingForm.inventoryCharges}
                          onValueChange={(value) => setBillingForm(f => ({ ...f, inventoryCharges: value }))}
                          placeholder="0"
                          data-testid="input-inventory-charges"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="otherFees">Other Fees (₹)</Label>
                        <NumericInput
                          value={billingForm.otherFees}
                          onValueChange={(value) => setBillingForm(f => ({ ...f, otherFees: value }))}
                          placeholder="0"
                          data-testid="input-other-fees"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="otherFeesDescription">Other Fees Description</Label>
                        <Input
                          value={billingForm.otherFeesDescription}
                          onChange={(e) => setBillingForm(f => ({ ...f, otherFeesDescription: e.target.value }))}
                          placeholder="e.g., Ambulance"
                          data-testid="input-other-fees-description"
                        />
                      </div>
                    </div>

                    {/* Calculated Total */}
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Calculated Total:</span>
                        <span className="text-xl font-bold" data-testid="text-calculated-total">
                          ₹{calculateBillTotal().toLocaleString('en-IN')}
                        </span>
                      </div>
                      {selectedPatientBill.paidAmount && parseFloat(selectedPatientBill.paidAmount.toString()) > 0 && (
                        <div className="flex justify-between items-center mt-2 text-green-600">
                          <span>Already Paid:</span>
                          <span>₹{parseFloat(selectedPatientBill.paidAmount.toString()).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>

                    {/* Save Button */}
                    <Button
                      className="w-full"
                      onClick={() => selectedPatientBill && updateBillMutation.mutate(selectedPatientBill.id)}
                      disabled={updateBillMutation.isPending}
                      data-testid="button-save-bill"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateBillMutation.isPending ? "Saving..." : "Save & Notify Patient"}
                    </Button>

                    {/* Bill Status */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Bill Status:</span>
                      <Badge variant={
                        selectedPatientBill.status === "paid" ? "default" :
                        selectedPatientBill.status === "partial" ? "secondary" :
                        "outline"
                      }>
                        {selectedPatientBill.status}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
