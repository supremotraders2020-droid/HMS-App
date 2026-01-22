import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IntegerInput, NumericInput } from "@/components/validated-inputs";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { 
  Activity, Heart, Droplets, Thermometer, Clock, 
  FileText, Pill, AlertTriangle, Users, Shield,
  PlusCircle, RefreshCw, Download, Stethoscope,
  Wind, Syringe, FlaskConical, ClipboardList, Baby,
  BedDouble, FileCheck, Hospital, Timer, Info, CalendarDays, ArrowLeft,
  Beaker, Plus, CheckCircle, XCircle, Loader2, Eye, Trash2, Edit, Printer, ClipboardCheck
} from "lucide-react";

// Reusable hospital print header HTML
const getHospitalPrintHeader = () => `
  <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0;">
    <div style="text-align: center;">
      <img src="/hospital-logo.png" alt="Gravity Hospital" style="height: 70px; margin-bottom: 8px;" onerror="this.style.display='none'" />
      <div style="color: #6B3FA0; font-size: 18px; font-weight: bold; margin-bottom: 4px;">Gravity Hospital & Research Centre</div>
      <div style="font-size: 11px; color: #4a5568; line-height: 1.4;">
        Gat No. 167, Sahyog Nagar, Triveni Nagar Chowk, Pimpri-Chinchwad, Maharashtra - 411062
      </div>
      <div style="font-size: 11px; color: #4a5568; font-weight: 600;">Contact: 7796513130, 7769651310</div>
    </div>
  </div>
`;

// Reusable print styles - Enhanced tabular format
const getPrintStyles = () => `
  body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
  h1 { text-align: center; background: #333; color: #fff; padding: 8px 12px; margin: 15px 0; font-size: 14px; font-weight: bold; }
  h2, h3 { color: #1a1a1a; margin: 15px 0 8px 0; font-size: 12px; background: #e5e5e5; padding: 6px 10px; font-weight: bold; }
  h4 { color: #333; margin: 12px 0 6px 0; font-size: 11px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  .section-title { background: #e5e5e5; padding: 5px 10px; margin: 15px 0 8px 0; font-weight: bold; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
  th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; font-size: 11px; vertical-align: top; }
  th { background: #f0f0f0; font-weight: 600; text-align: center; }
  .label-cell { background: #f9f9f9; font-weight: 600; width: 25%; }
  .value-cell { width: 25%; }
  .check-cell { text-align: center; width: 50px; }
  .no-data { color: #666; font-style: italic; margin: 10px 0; text-align: center; padding: 20px; border: 1px solid #ccc; }
  .summary-row { background: #f0f0f0; font-weight: bold; }
  .two-col { display: flex; gap: 20px; margin-bottom: 15px; }
  .two-col > div { flex: 1; }
  .text-box { border: 1px solid #333; padding: 8px; min-height: 60px; margin-bottom: 10px; }
  .signature-section { margin-top: 20px; border-top: 1px solid #333; padding-top: 10px; }
  .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #333; color: #666; font-size: 10px; text-align: center; }
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  @page { margin: 15mm; }
`;

// Open print window helper
const openPrintWindow = (title: string, content: string) => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
      <head>
        <title>${title}</title>
        <style>${getPrintStyles()}</style>
      </head>
      <body>
        ${getHospitalPrintHeader()}
        ${content}
        <div class="footer">
          Generated on ${format(new Date(), "dd/MM/yyyy HH:mm")} | Gravity Hospital & Research Centre
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  }
};
import { Checkbox } from "@/components/ui/checkbox";

const HOUR_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
  "00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00"
];

const SHIFTS = ["MORNING", "EVENING", "NIGHT"] as const;

type Session = {
  id: string;
  patientId: string;
  patientName: string;
  uhid: string;
  age: number;
  sex: string;
  ward: string;
  bedNumber: string;
  sessionDate: string;
  primaryDiagnosis: string;
  admittingConsultant: string;
  isVentilated: boolean;
  isLocked: boolean;
  createdAt: string;
};

export default function PatientMonitoringPage() {
  const { toast } = useToast();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showNewSession, setShowNewSession] = useState(false);
  const [selectedPatientFilter, setSelectedPatientFilter] = useState<string>("all");
  const [patientTypeFilter, setPatientTypeFilter] = useState<"current" | "old">("current");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "date">("list"); // "list" shows patient list, "date" shows sessions for selected date
  const [newSessionData, setNewSessionData] = useState({
    patientId: "",
    patientName: "",
    uhid: "",
    age: 30,
    sex: "Male",
    admissionDateTime: new Date(),
    ward: "",
    bedNumber: "",
    bloodGroup: "",
    weightKg: "",
    primaryDiagnosis: "",
    admittingConsultant: "",
    isVentilated: false,
    sessionDate: format(new Date(), "yyyy-MM-dd"),
    createdBy: "system",
    createdByName: "System"
  });

  const { data: sessions = [], isLoading: loadingSessions } = useQuery<Session[]>({
    queryKey: ["/api/patient-monitoring/sessions"]
  });

  // Check for session ID passed from Patient Tracking
  useEffect(() => {
    const storedSessionId = sessionStorage.getItem('selectedMonitoringSession');
    if (storedSessionId && sessions.length > 0) {
      const session = sessions.find(s => s.id === storedSessionId);
      if (session) {
        setSelectedSessionId(storedSessionId);
        setSelectedDate(new Date(session.sessionDate));
        setShowCalendar(false);
        sessionStorage.removeItem('selectedMonitoringSession');
      }
    }
  }, [sessions]);

  // Fetch all admitted/tracking patients (not just ICU) with real-time refresh
  const { data: admittedPatients = [], isLoading: loadingAdmittedPatients } = useQuery<any[]>({
    queryKey: ["/api/tracking/patients"],
    refetchInterval: 5000, // Real-time refresh every 5 seconds
  });

  // Fallback to all patients for existing sessions display
  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ["/api/patients/service"]
  });

  const { data: doctors = [] } = useQuery<any[]>({
    queryKey: ["/api/doctors"]
  });

  // Fetch all unique ward names from bed management
  const { data: allBeds = [] } = useQuery<any[]>({
    queryKey: ["/api/bed-management/beds"],
    enabled: showNewSession,
  });
  
  // Extract unique ward names from beds
  const wardNames = Array.from(new Set(allBeds.map((bed: any) => bed.wardName).filter(Boolean))).sort();

  // Fetch available beds for the selected ward with real-time refresh
  const { data: availableBeds = [], isLoading: loadingBeds } = useQuery<any[]>({
    queryKey: ["/api/bed-management/beds/ward/available", newSessionData.ward],
    queryFn: async () => {
      const response = await fetch(`/api/bed-management/beds/ward/${newSessionData.ward}/available`);
      if (!response.ok) throw new Error("Failed to fetch available beds");
      return response.json();
    },
    enabled: !!newSessionData.ward && showNewSession,
    refetchInterval: 3000, // Auto-refresh every 3 seconds for real-time updates
  });

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  // Filter sessions by patient type (current = last 7 days, old = older than 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const sessionsFilteredByType = sessions.filter(session => {
    const sessionDate = parseISO(session.sessionDate);
    if (patientTypeFilter === "current") {
      return sessionDate >= sevenDaysAgo;
    } else {
      return sessionDate < sevenDaysAgo;
    }
  });

  const uniquePatients = Array.from(
    new Map(sessionsFilteredByType.map(s => [s.patientId, { id: s.patientId, name: s.patientName, uhid: s.uhid }])).values()
  );

  const filteredSessions = sessionsFilteredByType.filter(session => {
    const matchesPatient = selectedPatientFilter === "all" || session.patientId === selectedPatientFilter;
    const matchesDate = selectedDate ? isSameDay(parseISO(session.sessionDate), selectedDate) : false;
    return matchesPatient && matchesDate;
  });

  const sessionDates = sessionsFilteredByType
    .filter(s => selectedPatientFilter === "all" || s.patientId === selectedPatientFilter)
    .map(s => parseISO(s.sessionDate));

  const createSessionMutation = useMutation({
    mutationFn: (data: typeof newSessionData) => {
      const payload = {
        ...data,
        admissionDateTime: data.admissionDateTime instanceof Date 
          ? data.admissionDateTime.toISOString() 
          : data.admissionDateTime
      };
      return apiRequest("POST", "/api/patient-monitoring/sessions", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patient-monitoring/sessions"] });
      setShowNewSession(false);
      toast({ title: "Session Created", description: "New monitoring session started" });
    },
    onError: (error: any) => {
      console.error("Session creation error:", error);
      toast({ 
        title: "Failed to Create Session", 
        description: error?.message || "Please check all required fields and try again",
        variant: "destructive"
      });
    }
  });

  const handlePatientSelect = (patientId: string) => {
    // Find from all admitted/tracking patients
    const trackingPatient = admittedPatients.find((p: any) => p.id.toString() === patientId);
    if (trackingPatient) {
      const patientName = trackingPatient.name || `${trackingPatient.firstName || ''} ${trackingPatient.lastName || ''}`.trim() || 'Unknown';
      setNewSessionData({
        ...newSessionData,
        patientId: patientId,
        patientName: patientName,
        uhid: trackingPatient.uhidNumber || trackingPatient.uhid || `UHID-${trackingPatient.id.slice(0, 8)}`,
        age: trackingPatient.age || 30,
        sex: trackingPatient.gender || "Male",
        bloodGroup: trackingPatient.bloodType || trackingPatient.bloodGroup || "",
        primaryDiagnosis: trackingPatient.diagnosis || trackingPatient.primaryDiagnosis || ""
      });
      return;
    }
    
    // Fallback to general patients list
    const patient = patients.find((p: any) => p.id.toString() === patientId);
    if (patient) {
      const patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.name || 'Unknown';
      const birthDate = patient.dateOfBirth ? new Date(patient.dateOfBirth) : null;
      const age = birthDate ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 30;
      setNewSessionData({
        ...newSessionData,
        patientId: patientId,
        patientName: patientName,
        uhid: patient.uhidNumber || `UHID-${patient.id.slice(0, 8)}`,
        age: age,
        sex: patient.gender || "Male",
        bloodGroup: patient.bloodGroup || ""
      });
    }
  };

  if (loadingSessions) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] page-background-subtle">
      <div className="px-3 sm:px-6 py-3 sm:py-4 border-b bg-gradient-to-r from-primary/5 to-transparent space-y-3 sm:space-y-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="p-2 sm:p-3 rounded-xl bg-primary/10 shrink-0">
              <Hospital className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">IPD Monitoring</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">ICU Chart & Nursing Workflow (NABH-Compliant)</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
              <button
                onClick={() => setPatientTypeFilter("current")}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  patientTypeFilter === "current" 
                    ? "bg-background text-foreground shadow-sm" 
                    : "hover:bg-background/50"
                }`}
                data-testid="tab-current-patient"
              >
                <Users className="h-4 w-4 mr-1.5" />
                Current Patient
              </button>
              <button
                onClick={() => setPatientTypeFilter("old")}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  patientTypeFilter === "old" 
                    ? "bg-background text-foreground shadow-sm" 
                    : "hover:bg-background/50"
                }`}
                data-testid="tab-old-patient"
              >
                <Clock className="h-4 w-4 mr-1.5" />
                Old Patient
              </button>
            </div>
            <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-new-session">
                  <PlusCircle className="h-4 w-4" /> <span>New Session</span>
                </Button>
              </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Start New Monitoring Session</DialogTitle>
              <DialogDescription>Create a 24-hour monitoring session for a patient</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-auto">
              <div className="space-y-2">
                <Label>Select Admitted Patient *</Label>
                <Select onValueChange={handlePatientSelect} disabled={loadingAdmittedPatients}>
                  <SelectTrigger data-testid="select-patient">
                    <SelectValue placeholder={loadingAdmittedPatients ? "Loading patients..." : "Select patient"} />
                  </SelectTrigger>
                  <SelectContent>
                    {admittedPatients.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No admitted patients found
                      </div>
                    ) : (
                      admittedPatients.map((p: any) => {
                        const displayName = p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown Patient';
                        const wardInfo = p.ward || p.currentWard || p.department || '';
                        return (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {displayName}{wardInfo ? ` - ${wardInfo}` : ''}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
                {newSessionData.patientName && (
                  <div className="text-xs text-muted-foreground">
                    Selected: {newSessionData.patientName} | UHID: {newSessionData.uhid} | Age: {newSessionData.age} | Sex: {newSessionData.sex}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ward *</Label>
                  <Select value={newSessionData.ward || undefined} onValueChange={(v) => setNewSessionData({...newSessionData, ward: v, bedNumber: ""})}>
                    <SelectTrigger data-testid="select-ward">
                      <SelectValue placeholder="Select ward" />
                    </SelectTrigger>
                    <SelectContent>
                      {wardNames.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Loading wards...
                        </div>
                      ) : (
                        wardNames.map((w: string) => <SelectItem key={w} value={w}>{w}</SelectItem>)
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bed Number *</Label>
                  <Select 
                    value={newSessionData.bedNumber} 
                    onValueChange={(v) => setNewSessionData({...newSessionData, bedNumber: v})}
                    disabled={!newSessionData.ward || loadingBeds}
                  >
                    <SelectTrigger data-testid="select-bed">
                      <SelectValue placeholder={
                        !newSessionData.ward 
                          ? "Select ward first" 
                          : loadingBeds 
                            ? "Loading beds..." 
                            : availableBeds.length === 0 
                              ? "No available beds" 
                              : "Select bed"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBeds.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No available beds in {newSessionData.ward}
                        </div>
                      ) : (
                        availableBeds.map((bed: any) => (
                          <SelectItem key={bed.id} value={bed.bedNumber}>
                            {bed.bedNumber} - {bed.bedType || 'Standard'}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {newSessionData.ward && availableBeds.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {availableBeds.length} bed{availableBeds.length !== 1 ? 's' : ''} available
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Session Date *</Label>
                  <Input type="date" value={newSessionData.sessionDate} onChange={(e) => setNewSessionData({...newSessionData, sessionDate: e.target.value})} data-testid="input-date" />
                </div>
                <div className="space-y-2">
                  <Label>Admitting Consultant *</Label>
                  <Select 
                    value={newSessionData.admittingConsultant} 
                    onValueChange={(v) => setNewSessionData({...newSessionData, admittingConsultant: v})}
                  >
                    <SelectTrigger data-testid="select-consultant">
                      <SelectValue placeholder="Select Doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor: any) => (
                        <SelectItem key={doctor.id} value={doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`}>
                          {doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`} - {doctor.specialization || 'General'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Primary Diagnosis *</Label>
                <Textarea value={newSessionData.primaryDiagnosis} onChange={(e) => setNewSessionData({...newSessionData, primaryDiagnosis: e.target.value})} placeholder="Primary diagnosis..." data-testid="input-diagnosis" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ventilator" checked={newSessionData.isVentilated} onChange={(e) => setNewSessionData({...newSessionData, isVentilated: e.target.checked})} data-testid="checkbox-ventilator" />
                <Label htmlFor="ventilator">Patient on Ventilator</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewSession(false)}>Cancel</Button>
              <Button 
                onClick={() => createSessionMutation.mutate(newSessionData)} 
                disabled={!newSessionData.patientId || !newSessionData.ward || !newSessionData.bedNumber || !newSessionData.primaryDiagnosis || !newSessionData.admittingConsultant || createSessionMutation.isPending} 
                data-testid="button-create-session"
              >
                {createSessionMutation.isPending ? "Creating..." : "Start Session"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          </div>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Select value={selectedPatientFilter} onValueChange={setSelectedPatientFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-patient-filter">
                <SelectValue placeholder="All Patients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patients</SelectItem>
                {uniquePatients.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.uhid})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={showCalendar ? "default" : "outline"} 
              size="icon" 
              onClick={() => setShowCalendar(!showCalendar)}
              data-testid="button-toggle-calendar"
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
            {selectedDate && filteredSessions.length > 0 && (
              <Badge variant="default" className="text-xs gap-1">
                {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} on {format(selectedDate, "dd MMM")}
              </Badge>
            )}
          </div>
        </div>

        {showCalendar && (
          <Card className="border-primary/20 bg-gradient-to-br from-card to-card/80 shadow-lg max-w-fit mx-auto">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Session Calendar</CardTitle>
                    <CardDescription className="text-xs">Select a date to view sessions</CardDescription>
                  </div>
                </div>
                {selectedDate && (
                  <Badge className="gap-1 text-sm px-3 py-1">
                    {format(selectedDate, "dd MMM yyyy")}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  if (date) {
                    setViewMode("date");
                  }
                }}
                modifiers={{ hasSession: sessionDates }}
                modifiersStyles={{ 
                  hasSession: { 
                    fontWeight: 'bold', 
                    backgroundColor: 'hsl(var(--primary) / 0.15)',
                    borderRadius: '6px'
                  } 
                }}
                className="rounded-lg border"
                data-testid="calendar-date-picker"
              />
              <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-primary/15 border border-primary/30" />
                  <span>Has sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-primary" />
                  <span>Selected</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex-1 overflow-auto bg-background p-6">
        {/* LIST MODE - Show patient list based on Current/Old tab */}
        {viewMode === "list" && patientTypeFilter === "old" && sessionsFilteredByType.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Old Patient Records (Before Last 7 Days)
              </h3>
              <Badge variant="secondary" className="text-sm">
                {uniquePatients.length} patient{uniquePatients.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uniquePatients.map((patient) => {
                const patientSessions = sessionsFilteredByType.filter(s => s.patientId === patient.id);
                const latestSession = patientSessions[0];
                return (
                  <Card 
                    key={patient.id} 
                    className="cursor-pointer hover-elevate"
                    onClick={() => {
                      if (latestSession) {
                        setSelectedPatientFilter(patient.id);
                        setSelectedDate(parseISO(latestSession.sessionDate));
                        setViewMode("date");
                      }
                    }}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium block truncate">{patient.name}</span>
                          <span className="text-sm text-muted-foreground">UHID: {patient.uhid}</span>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {patientSessions.length} session{patientSessions.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <Clock className="h-3 w-3" />
                        <span>Last: {latestSession ? format(parseISO(latestSession.sessionDate), "dd MMM yyyy") : "N/A"}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Click a patient card to view their session details, or use the calendar to select a specific date.
            </p>
          </div>
        ) : viewMode === "list" && patientTypeFilter === "old" && sessionsFilteredByType.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <Clock className="h-12 w-12 opacity-40" />
            </div>
            <h2 className="text-xl font-medium mb-2">No Old Patient Records</h2>
            <p className="text-sm text-center max-w-md">
              No monitoring sessions older than 7 days found. Old patient records will appear here after 7 days from their session date.
            </p>
          </div>
        ) : viewMode === "list" && patientTypeFilter === "current" && sessionsFilteredByType.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                Current Patient Records (Last 7 Days)
              </h3>
              <Badge variant="secondary" className="text-sm">
                {uniquePatients.length} patient{uniquePatients.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uniquePatients.map((patient) => {
                const patientSessions = sessionsFilteredByType.filter(s => s.patientId === patient.id);
                const latestSession = patientSessions[0];
                return (
                  <Card 
                    key={patient.id} 
                    className="cursor-pointer hover-elevate"
                    onClick={() => {
                      if (latestSession) {
                        setSelectedPatientFilter(patient.id);
                        setSelectedDate(parseISO(latestSession.sessionDate));
                        setViewMode("date");
                      }
                    }}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium block truncate">{patient.name}</span>
                          <span className="text-sm text-muted-foreground">UHID: {patient.uhid}</span>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {patientSessions.length} session{patientSessions.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <CalendarDays className="h-3 w-3" />
                        <span>Last: {latestSession ? format(parseISO(latestSession.sessionDate), "dd MMM yyyy") : "N/A"}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Click a patient card to view their session details, or use the calendar to select a specific date.
            </p>
          </div>
        ) : viewMode === "list" && patientTypeFilter === "current" && sessionsFilteredByType.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <Users className="h-12 w-12 opacity-40" />
            </div>
            <h2 className="text-xl font-medium mb-2">No Current Patient Records</h2>
            <p className="text-sm text-center max-w-md">
              No monitoring sessions found in the last 7 days. Click "New Session" to create a monitoring session for a patient.
            </p>
            <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowNewSession(true)}>
              <PlusCircle className="h-4 w-4" /> Create New Session
            </Button>
          </div>
        ) : viewMode === "date" && selectedDate && filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 mb-4" 
              onClick={() => {
                setViewMode("list");
                setSelectedDate(undefined);
                setSelectedSessionId(null);
              }}
            >
              <ArrowLeft className="h-4 w-4" /> Back to Patient List
            </Button>
            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <FileText className="h-12 w-12 opacity-40" />
            </div>
            <h2 className="text-xl font-medium mb-2">No Sessions on {format(selectedDate, "dd MMM yyyy")}</h2>
            <p className="text-sm text-center max-w-md">
              {selectedPatientFilter !== "all" 
                ? "No sessions found for the selected patient on this date. Try selecting a different date or patient." 
                : "No monitoring sessions recorded for this date. Select a highlighted date on the calendar to view sessions."}
            </p>
            <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowNewSession(true)}>
              <PlusCircle className="h-4 w-4" /> Create New Session
            </Button>
          </div>
        ) : viewMode === "date" && selectedDate && !selectedSession ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2" 
                onClick={() => {
                  setViewMode("list");
                  setSelectedDate(undefined);
                  setSelectedSessionId(null);
                }}
              >
                <ArrowLeft className="h-4 w-4" /> Back to Patient List
              </Button>
              <h3 className="text-lg font-medium">
                Sessions for {format(selectedDate, "EEEE, dd MMMM yyyy")}
              </h3>
              <Badge variant="secondary" className="text-sm">
                {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSessions.map((session) => (
                <Card 
                  key={session.id} 
                  className={`cursor-pointer hover-elevate ${
                    selectedSessionId === session.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedSessionId(session.id)}
                  data-testid={`session-card-${session.id}`}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium block truncate">{session.patientName}</span>
                        <span className="text-sm text-muted-foreground">{session.ward} - Bed {session.bedNumber}</span>
                      </div>
                      <Badge variant={session.isLocked ? "secondary" : "default"} className="text-xs shrink-0">
                        {session.isLocked ? "Locked" : "Active"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <span>UHID: {session.uhid}</span>
                      <span>|</span>
                      <span>{format(new Date(session.sessionDate), "dd MMM yyyy")}</span>
                    </div>
                    {session.isVentilated && (
                      <Badge variant="destructive" className="mt-2 text-xs gap-1">
                        <Wind className="h-3 w-3" /> Ventilator
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2" 
                  onClick={() => {
                    setViewMode("list");
                    setSelectedDate(undefined);
                    setSelectedSessionId(null);
                  }}
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Patient List
                </Button>
                <span className="text-muted-foreground">/</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2" 
                  onClick={() => setSelectedSessionId(null)}
                  data-testid="button-back-to-sessions"
                >
                  Back to {format(selectedDate!, "dd MMM")} Sessions
                </Button>
              </div>
              <div className="flex items-start justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-card to-card/50 border">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">{selectedSession.patientName.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold">{selectedSession.patientName}</h2>
                      {selectedSession.isVentilated && (
                        <Badge variant="destructive" className="gap-1">
                          <Wind className="h-3 w-3" /> Ventilator
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      UHID: <span className="font-mono">{selectedSession.uhid}</span> | {selectedSession.ward} - Bed {selectedSession.bedNumber} | {format(new Date(selectedSession.sessionDate), "EEEE, dd MMMM yyyy")}
                    </p>
                  </div>
                </div>
                <Button 
                variant="outline" 
                className="gap-2 shrink-0"
                onClick={async () => {
                  toast({ title: "Generating Report", description: "Fetching all patient data..." });
                  try {
                    const sessionId = selectedSession.id;
                    const fetchOpts = { credentials: 'include' as RequestCredentials };
                    
                    const fetchData = async (url: string) => {
                      try {
                        const r = await fetch(url, fetchOpts);
                        if (r.ok) {
                          const data = await r.json();
                          return Array.isArray(data) ? data : [];
                        }
                        return [];
                      } catch {
                        return [];
                      }
                    };
                    
                    const [vitals, injections, mar, ventilator, abgLab, intake, output, diabetic, onceOnly, shiftNotes, airway, dutyStaff, allergies] = await Promise.all([
                      fetchData(`/api/patient-monitoring/vitals/${sessionId}`),
                      fetchData(`/api/patient-monitoring/inotropes/${sessionId}`),
                      fetchData(`/api/patient-monitoring/mar/${sessionId}`),
                      fetchData(`/api/patient-monitoring/ventilator/${sessionId}`),
                      fetchData(`/api/patient-monitoring/abg-lab/${sessionId}`),
                      fetchData(`/api/patient-monitoring/intake/${sessionId}`),
                      fetchData(`/api/patient-monitoring/output/${sessionId}`),
                      fetchData(`/api/patient-monitoring/diabetic/${sessionId}`),
                      fetchData(`/api/patient-monitoring/once-only/${sessionId}`),
                      fetchData(`/api/patient-monitoring/shift-notes/${sessionId}`),
                      fetchData(`/api/patient-monitoring/airway/${sessionId}`),
                      fetchData(`/api/patient-monitoring/duty-staff/${sessionId}`),
                      fetchData(`/api/patient-monitoring/allergies/${sessionId}`)
                    ]);
                    
                    const formatDate = (d: string | null | undefined) => {
                      if (!d) return '-';
                      try { return new Date(d).toLocaleDateString('en-IN'); } catch { return '-'; }
                    };
                    const formatTime = (d: string | null | undefined) => {
                      if (!d) return '-';
                      try { return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); } catch { return '-'; }
                    };
                    
                    const generateTable = (title: string, headers: string[], rows: any[], renderRow: (r: any) => string) => {
                      if (!rows || !Array.isArray(rows) || rows.length === 0) return `<h2>${title}</h2><p class="no-data">No data recorded</p>`;
                      try {
                        const headerHtml = headers.map(h => `<th>${h}</th>`).join('');
                        const bodyHtml = rows.map(r => { try { return renderRow(r); } catch { return '<tr><td colspan="99">Error</td></tr>'; } }).join('');
                        return `<h2>${title}</h2><table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
                      } catch { return `<h2>${title}</h2><p class="no-data">Error loading data</p>`; }
                    };

                    const printContent = `
                      <html>
                      <head>
                        <title>IPD Monitoring Report - ${selectedSession.patientName}</title>
                        <style>
                          body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; }
                          .hospital-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0; }
                          .hospital-logo { display: flex; align-items: center; }
                          .logo-img { height: 60px; }
                          .hospital-details { text-align: right; }
                          .hospital-title { color: #6B3FA0; font-size: 16px; font-weight: bold; margin-bottom: 4px; }
                          .hospital-address { font-size: 11px; color: #4a5568; line-height: 1.4; }
                          .hospital-contact { font-size: 11px; color: #4a5568; font-weight: 600; }
                          h1 { color: #1a365d; border-bottom: 2px solid #3182ce; padding-bottom: 10px; font-size: 18px; margin-top: 10px; }
                          h2 { color: #2d3748; margin-top: 25px; font-size: 14px; background: #f7fafc; padding: 8px; border-left: 3px solid #3182ce; }
                          .header { margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                          .info-row { display: flex; gap: 8px; }
                          .label { font-weight: bold; color: #4a5568; min-width: 100px; }
                          table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 15px; }
                          th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
                          th { background: #edf2f7; font-weight: 600; }
                          tr:nth-child(even) { background: #f7fafc; }
                          .no-data { color: #a0aec0; font-style: italic; margin: 10px 0; }
                          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 10px; }
                          @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
                          @page { margin: 15mm; }
                        </style>
                      </head>
                      <body>
                        <div class="hospital-header">
                          <div class="hospital-logo">
                            <img src="/hospital-logo.png" alt="Gravity Hospital" class="logo-img" />
                          </div>
                          <div class="hospital-details">
                            <div class="hospital-title">Gravity Hospital & Research Centre</div>
                            <div class="hospital-address">
                              Gat No. 167, Sahyog Nagar, Triveni Nagar Chowk,<br/>
                              Pimpri-Chinchwad, Maharashtra - 411062
                            </div>
                            <div class="hospital-contact">Contact: 7796513130, 7769651310</div>
                          </div>
                        </div>
                        <h1>IPD Monitoring Report</h1>
                        <div class="header">
                          <div class="info-row"><span class="label">Patient Name:</span> ${selectedSession.patientName}</div>
                          <div class="info-row"><span class="label">UHID:</span> ${selectedSession.uhid}</div>
                          <div class="info-row"><span class="label">Ward/Bed:</span> ${selectedSession.ward} - Bed ${selectedSession.bedNumber}</div>
                          <div class="info-row"><span class="label">Session Date:</span> ${format(new Date(selectedSession.sessionDate), "dd MMMM yyyy")}</div>
                          <div class="info-row"><span class="label">Diagnosis:</span> ${selectedSession.primaryDiagnosis || "Not recorded"}</div>
                          <div class="info-row"><span class="label">Consultant:</span> ${selectedSession.admittingConsultant || "Not assigned"}</div>
                          <div class="info-row"><span class="label">Ventilator:</span> ${selectedSession.isVentilated ? "Yes" : "No"}</div>
                          <div class="info-row"><span class="label">Admission Date:</span> ${formatDate(selectedSession.admissionDate)}</div>
                        </div>

                        ${generateTable('Vitals', ['Time', 'HR', 'BP', 'Temp', 'RR', 'SpO2', 'Staff'], vitals, (r: any) => 
                          `<tr><td>${r.hourSlot || formatTime(r.createdAt)}</td><td>${r.heartRate || '-'}</td><td>${r.systolicBp || '-'}/${r.diastolicBp || '-'}</td><td>${r.temperature ? r.temperature + '°C' : '-'}</td><td>${r.respiratoryRate || '-'}</td><td>${r.spo2 ? r.spo2 + '%' : '-'}</td><td>${r.nurseName || '-'}</td></tr>`
                        )}

                        ${generateTable('Injections', ['Injection Name', 'Diagnosis', 'Date', 'Staff Name'], injections, (r: any) => 
                          `<tr><td>${r.drugName || '-'}</td><td>${r.diagnosis || '-'}</td><td>${formatDate(r.startTime || r.createdAt)}</td><td>${r.nurseName || '-'}</td></tr>`
                        )}

                        ${generateTable('Medicines', ['Medicine Name', 'Diagnosis', 'Date', 'Staff Name'], mar, (r: any) => 
                          `<tr><td>${r.drugName || r.medicineName || '-'}</td><td>${r.diagnosis || '-'}</td><td>${formatDate(r.scheduledTime || r.createdAt)}</td><td>${r.nurseName || '-'}</td></tr>`
                        )}

                        ${generateTable('Ventilator Settings', ['Time', 'Mode', 'FiO2', 'PEEP', 'Tidal Vol', 'RR Set'], ventilator, (r: any) => 
                          `<tr><td>${formatTime(r.createdAt)}</td><td>${r.mode || '-'}</td><td>${r.fio2 || '-'}%</td><td>${r.peep || '-'}</td><td>${r.tidalVolume || '-'}</td><td>${r.respiratoryRateSet || '-'}</td></tr>`
                        )}

                        ${generateTable('ABG / Lab Values', ['Time', 'pH', 'pCO2', 'pO2', 'HCO3', 'Lactate', 'Na', 'K'], abgLab, (r: any) => 
                          `<tr><td>${formatTime(r.createdAt)}</td><td>${r.ph || '-'}</td><td>${r.pco2 || '-'}</td><td>${r.po2 || '-'}</td><td>${r.hco3 || '-'}</td><td>${r.lactate || '-'}</td><td>${r.sodium || '-'}</td><td>${r.potassium || '-'}</td></tr>`
                        )}

                        ${generateTable('Intake', ['Time', 'Type', 'Volume (ml)', 'Route', 'Staff'], intake, (r: any) => 
                          `<tr><td>${r.hourSlot || formatTime(r.createdAt)}</td><td>${r.intakeType || '-'}</td><td>${r.volume || '-'}</td><td>${r.route || '-'}</td><td>${r.nurseName || '-'}</td></tr>`
                        )}

                        ${generateTable('Output', ['Time', 'Type', 'Volume (ml)', 'Color', 'Staff'], output, (r: any) => 
                          `<tr><td>${r.hourSlot || formatTime(r.createdAt)}</td><td>${r.outputType || '-'}</td><td>${r.volume || '-'}</td><td>${r.color || '-'}</td><td>${r.nurseName || '-'}</td></tr>`
                        )}

                        ${generateTable('Diabetic Monitoring', ['Time', 'Blood Sugar', 'Insulin Type', 'Insulin Dose', 'Alert'], diabetic, (r: any) => 
                          `<tr><td>${r.checkTime || formatTime(r.createdAt)}</td><td>${r.bloodSugarLevel || '-'} mg/dL</td><td>${r.insulinType || '-'}</td><td>${r.insulinDose || '-'}</td><td>${r.alertType || '-'}</td></tr>`
                        )}

                        ${generateTable('Once-Only Medications', ['Drug Name', 'Dose', 'Route', 'Indication', 'Given At', 'Given By'], onceOnly, (r: any) => 
                          `<tr><td>${r.drugName || '-'}</td><td>${r.dose || '-'}</td><td>${r.route || '-'}</td><td>${r.indication || '-'}</td><td>${formatTime(r.givenAt || r.createdAt)}</td><td>${r.givenBy || '-'}</td></tr>`
                        )}

                        ${generateTable('Shift Notes', ['Shift', 'Notes', 'Staff', 'Time'], shiftNotes, (r: any) => 
                          `<tr><td>${r.shift || '-'}</td><td>${r.notes || '-'}</td><td>${r.nurseName || '-'}</td><td>${formatTime(r.createdAt)}</td></tr>`
                        )}

                        ${generateTable('Lines & Tubes / Airway', ['Type', 'Site', 'Size', 'Inserted Date', 'Due Date', 'Status'], airway, (r: any) => 
                          `<tr><td>${r.lineType || '-'}</td><td>${r.site || '-'}</td><td>${r.size || '-'}</td><td>${formatDate(r.insertedDate)}</td><td>${formatDate(r.dueDate)}</td><td>${r.status || '-'}</td></tr>`
                        )}

                        ${generateTable('Duty Staff', ['Shift', 'Staff Name', 'Role', 'Date'], dutyStaff, (r: any) => 
                          `<tr><td>${r.shift || '-'}</td><td>${r.staffName || '-'}</td><td>${r.role || '-'}</td><td>${formatDate(r.createdAt)}</td></tr>`
                        )}

                        ${generateTable('Allergies', ['Allergen', 'Type', 'Severity', 'Reaction', 'Reported By'], allergies, (r: any) => 
                          `<tr><td>${r.allergen || '-'}</td><td>${r.allergenType || '-'}</td><td>${r.severity || '-'}</td><td>${r.reaction || '-'}</td><td>${r.reportedBy || '-'}</td></tr>`
                        )}

                        <div class="footer">
                          <p>Generated on ${format(new Date(), "dd/MM/yyyy HH:mm")} | Gravity Hospital & Research Centre - IPD Monitoring System</p>
                        </div>
                      </body>
                      </html>
                    `;
                    
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(printContent);
                      printWindow.document.close();
                      printWindow.focus();
                      setTimeout(() => {
                        printWindow.print();
                      }, 500);
                    }
                    toast({ title: "Report Ready", description: "Print dialog opened" });
                  } catch (error) {
                    toast({ title: "Error", description: "Failed to generate report", variant: "destructive" });
                  }
                }}
                data-testid="button-export-pdf"
              >
                  <Download className="h-4 w-4" /> Print
                </Button>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="inline-flex flex-wrap h-auto gap-1 p-1.5 bg-muted/50 rounded-lg">
                  <TabsTrigger value="overview" className="text-xs gap-1.5 data-[state=active]:bg-background"><Activity className="h-3.5 w-3.5" />Overview</TabsTrigger>
                  <TabsTrigger value="vitals" className="text-xs gap-1.5 data-[state=active]:bg-background"><Heart className="h-3.5 w-3.5" />Vitals</TabsTrigger>
                  <TabsTrigger value="inotropes" className="text-xs gap-1.5 data-[state=active]:bg-background"><Syringe className="h-3.5 w-3.5" />Injection</TabsTrigger>
                  <TabsTrigger value="intake" className="text-xs gap-1.5 data-[state=active]:bg-background"><Droplets className="h-3.5 w-3.5" />Intake</TabsTrigger>
                  <TabsTrigger value="output" className="text-xs gap-1.5 data-[state=active]:bg-background"><Droplets className="h-3.5 w-3.5" />Output</TabsTrigger>
                  <TabsTrigger value="diabetic" className="text-xs gap-1.5 data-[state=active]:bg-background"><Activity className="h-3.5 w-3.5" />Diabetic</TabsTrigger>
                  <TabsTrigger value="mar" className="text-xs gap-1.5 data-[state=active]:bg-background"><Pill className="h-3.5 w-3.5" />Medicines</TabsTrigger>
                  <TabsTrigger value="notes" className="text-xs gap-1.5 data-[state=active]:bg-background"><FileText className="h-3.5 w-3.5" />Shift Notes</TabsTrigger>
                  <TabsTrigger value="staff" className="text-xs gap-1.5 data-[state=active]:bg-background"><Users className="h-3.5 w-3.5" />Nurse Notes</TabsTrigger>
                  <TabsTrigger value="allergies" className="text-xs gap-1.5 data-[state=active]:bg-background"><AlertTriangle className="h-3.5 w-3.5" />Allergies</TabsTrigger>
                  <TabsTrigger value="investigation" className="text-xs gap-1.5 data-[state=active]:bg-background"><ClipboardList className="h-3.5 w-3.5" />Investigation</TabsTrigger>
                  <TabsTrigger value="care-plan" className="text-xs gap-1.5 data-[state=active]:bg-background"><FileCheck className="h-3.5 w-3.5" />Care Plan</TabsTrigger>
                  <TabsTrigger value="tests" className="text-xs gap-1.5 data-[state=active]:bg-background"><Beaker className="h-3.5 w-3.5" />Tests</TabsTrigger>
                  <TabsTrigger value="initial-assessment" className="text-xs gap-1.5 data-[state=active]:bg-background"><ClipboardList className="h-3.5 w-3.5" />Initial Assessment</TabsTrigger>
                  <TabsTrigger value="indoor-consultation" className="text-xs gap-1.5 data-[state=active]:bg-background"><FileText className="h-3.5 w-3.5" />Indoor Continuation Sheet</TabsTrigger>
                  <TabsTrigger value="doctors-progress" className="text-xs gap-1.5 data-[state=active]:bg-background"><Stethoscope className="h-3.5 w-3.5" />Doctor's Progress Sheet</TabsTrigger>
                  <TabsTrigger value="doctors-visit" className="text-xs gap-1.5 data-[state=active]:bg-background"><Users className="h-3.5 w-3.5" />Doctor's Visit Sheet</TabsTrigger>
                  <TabsTrigger value="surgery-notes" className="text-xs gap-1.5 data-[state=active]:bg-background"><Hospital className="h-3.5 w-3.5" />Surgery Notes</TabsTrigger>
                  <TabsTrigger value="nursing-progress" className="text-xs gap-1.5 data-[state=active]:bg-background"><FileText className="h-3.5 w-3.5" />Nursing Progress Sheet</TabsTrigger>
                  <TabsTrigger value="nursing-assessment" className="text-xs gap-1.5 data-[state=active]:bg-background"><ClipboardCheck className="h-3.5 w-3.5" />Nursing Assessment & Care Plan</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <OverviewTab session={selectedSession} />
                </TabsContent>
                <TabsContent value="vitals">
                  <VitalsTab sessionId={selectedSession.id} />
                </TabsContent>
                <TabsContent value="inotropes">
                  <InotropesTab sessionId={selectedSession.id} />
                </TabsContent>
                <TabsContent value="intake">
                  <IntakeTab sessionId={selectedSession.id} />
                </TabsContent>
                <TabsContent value="output">
                  <OutputTab sessionId={selectedSession.id} />
                </TabsContent>
                <TabsContent value="diabetic">
                  <DiabeticTab sessionId={selectedSession.id} />
                </TabsContent>
                <TabsContent value="mar">
                  <MARTab sessionId={selectedSession.id} />
                </TabsContent>
                <TabsContent value="notes">
                  <ShiftNotesTab sessionId={selectedSession.id} />
                </TabsContent>
                <TabsContent value="staff">
                  <DutyStaffTab sessionId={selectedSession.id} />
                </TabsContent>
                <TabsContent value="allergies">
                  <AllergiesTab sessionId={selectedSession.id} />
                </TabsContent>
                <TabsContent value="investigation">
                  <InvestigationChartTab sessionId={selectedSession.id} />
                </TabsContent>
                <TabsContent value="care-plan">
                  <CarePlanTab session={selectedSession} />
                </TabsContent>
                <TabsContent value="tests">
                  <TestsTab sessionId={selectedSession.id} patientId={selectedSession.patientId} patientName={selectedSession.patientName} admittingConsultant={selectedSession.admittingConsultant} />
                </TabsContent>
                <TabsContent value="initial-assessment">
                  <InitialAssessmentTab session={selectedSession} />
                </TabsContent>
                <TabsContent value="indoor-consultation">
                  <IndoorConsultationTab session={selectedSession} />
                </TabsContent>
                <TabsContent value="doctors-progress">
                  <DoctorsProgressTab session={selectedSession} />
                </TabsContent>
                <TabsContent value="doctors-visit">
                  <DoctorsVisitTab session={selectedSession} />
                </TabsContent>
                <TabsContent value="surgery-notes">
                  <SurgeryNotesTab session={selectedSession} />
                </TabsContent>
                <TabsContent value="nursing-progress">
                  <NursingProgressTab session={selectedSession} />
                </TabsContent>
                <TabsContent value="nursing-assessment">
                  <NursingAssessmentCarePlanTab sessionId={selectedSession?.id || ""} />
                </TabsContent>
              </Tabs>
            </div>
          )}
      </div>
    </div>
  );
}

type FluidBalance = { totalIntake: number; totalOutput: number; netBalance: number; intakeEntries: number; outputEntries: number };
type AirwayRecord = { id: string; airwayType: string; endotrachealTubeSize?: string; centralLineType?: string; centralLineSite?: string; urinaryCatheterSize?: string; ngTubeSize?: string };
type AllergiesRecord = { id: string; knownAllergies?: string; drugAllergies?: string; foodAllergies?: string; isolationPrecautions?: string; fallRisk?: boolean; pressureUlcerRisk?: boolean };

function OverviewTab({ session }: { session: Session }) {
  const { data: fluidBalance } = useQuery<FluidBalance>({
    queryKey: [`/api/patient-monitoring/fluid-balance/${session.id}`],
    enabled: !!session.id
  });

  const { data: vitals = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/vitals/${session.id}`],
    enabled: !!session.id
  });

  const { data: diabeticData = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/diabetic/${session.id}`],
    enabled: !!session.id
  });

  const { data: intakeData = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/intake/${session.id}`],
    enabled: !!session.id
  });

  const { data: outputData = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/output/${session.id}`],
    enabled: !!session.id
  });

  const { data: shiftNotes = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/shift-notes/${session.id}`],
    enabled: !!session.id
  });

  const { data: marData = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/mar/${session.id}`],
    enabled: !!session.id
  });

  const latestVitals = vitals.length > 0 ? vitals[vitals.length - 1] : null;
  const latestBSL = diabeticData.length > 0 ? diabeticData[diabeticData.length - 1] : null;

  const ivFluids = intakeData.filter((i: any) => i.intakeType === "IV Fluid" || i.intakeType === "IV_FLUID");
  const oralFluids = intakeData.filter((i: any) => i.intakeType === "Oral" || i.intakeType === "ORAL");
  const totalIV = ivFluids.reduce((sum: number, i: any) => sum + (i.volume || 0), 0);
  const totalOral = oralFluids.reduce((sum: number, i: any) => sum + (i.volume || 0), 0);

  return (
    <div className="space-y-6 mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 bg-blue-500/5">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <div className="p-1.5 rounded-md bg-blue-500/10">
                <Info className="h-4 w-4" />
              </div>
              Session Info
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ward</span>
              <span className="font-medium">{session.ward}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bed</span>
              <span className="font-medium">{session.bedNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Consultant</span>
              <span className="font-medium text-xs">{session.admittingConsultant}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={session.isLocked ? "secondary" : "default"}>
                {session.isLocked ? "Locked" : "Active"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3 bg-cyan-500/5">
            <CardTitle className="text-sm flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
              <div className="p-1.5 rounded-md bg-cyan-500/10">
                <Droplets className="h-4 w-4" />
              </div>
              Fluid Balance (I/O)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Intake</span>
              <span className="font-medium text-green-600">{fluidBalance?.totalIntake || 0} ml</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Output</span>
              <span className="font-medium text-orange-600">{fluidBalance?.totalOutput || 0} ml</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm items-center">
              <span className="text-muted-foreground font-medium">Net Balance</span>
              <span className={`font-bold text-lg ${(fluidBalance?.netBalance || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {(fluidBalance?.netBalance || 0) >= 0 ? '+' : ''}{fluidBalance?.netBalance || 0} ml
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3 bg-rose-500/5">
            <CardTitle className="text-sm flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <div className="p-1.5 rounded-md bg-rose-500/10">
                <Heart className="h-4 w-4" />
              </div>
              Latest Vitals
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {latestVitals ? (
              <>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Thermometer className="h-3 w-3 text-orange-500" />
                    <span className="text-muted-foreground">Temp:</span>
                    <span className="font-medium">{latestVitals.temperature || "-"}°C</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-500" />
                    <span className="text-muted-foreground">Pulse:</span>
                    <span className="font-medium">{latestVitals.heartRate || "-"}/min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-blue-500" />
                    <span className="text-muted-foreground">BP:</span>
                    <span className="font-medium">{latestVitals.systolicBp || "-"}/{latestVitals.diastolicBp || "-"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wind className="h-3 w-3 text-teal-500" />
                    <span className="text-muted-foreground">Resp:</span>
                    <span className="font-medium">{latestVitals.respiratoryRate || "-"}/min</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground">SpO2:</span>
                  <span className={`font-bold ${(latestVitals.spo2 || 0) >= 95 ? 'text-green-600' : (latestVitals.spo2 || 0) >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {latestVitals.spo2 || "-"}%
                  </span>
                  <span className="text-muted-foreground ml-2">@ {latestVitals.hourSlot}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No vitals recorded yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3 bg-amber-500/5">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <div className="p-1.5 rounded-md bg-amber-500/10">
                <FileCheck className="h-4 w-4" />
              </div>
              Diagnosis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm font-medium">{session.primaryDiagnosis || "No diagnosis recorded"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-purple-500/5">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <div className="p-1.5 rounded-md bg-purple-500/10">
                <Activity className="h-4 w-4" />
              </div>
              BSL (Blood Sugar Level)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            {diabeticData.length > 0 ? (
              <div className="space-y-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs py-1">Time</TableHead>
                      <TableHead className="text-xs py-1">Value</TableHead>
                      <TableHead className="text-xs py-1">Insulin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diabeticData.slice(-4).map((d: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs py-1">{d.hourSlot || d.timeSlot}</TableCell>
                        <TableCell className={`text-xs py-1 font-medium ${(d.bloodSugar || 0) > 180 ? 'text-red-600' : (d.bloodSugar || 0) < 70 ? 'text-orange-600' : 'text-green-600'}`}>
                          {d.bloodSugar || "-"} mg/dL
                        </TableCell>
                        <TableCell className="text-xs py-1">{d.insulinDose ? `${d.insulinDose}U` : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No BSL readings recorded</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-indigo-500/5">
            <CardTitle className="text-sm flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <div className="p-1.5 rounded-md bg-indigo-500/10">
                <Syringe className="h-4 w-4" />
              </div>
              IV / Oral Fluids
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Syringe className="h-3 w-3" /> IV Fluids
              </span>
              <span className="font-medium text-blue-600">{totalIV} ml</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Droplets className="h-3 w-3" /> Oral Fluids
              </span>
              <span className="font-medium text-green-600">{totalOral} ml</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm font-medium">
              <span>Total Fluids</span>
              <span className="text-cyan-600">{totalIV + totalOral} ml</span>
            </div>
            {ivFluids.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium">Recent IV:</span> {ivFluids.slice(-2).map((f: any) => f.description || f.fluidType).join(", ")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-teal-500/5">
            <CardTitle className="text-sm flex items-center gap-2 text-teal-600 dark:text-teal-400">
              <div className="p-1.5 rounded-md bg-teal-500/10">
                <Pill className="h-4 w-4" />
              </div>
              Drugs / Medicines Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            {marData.length > 0 ? (
              <div className="space-y-1">
                {marData.slice(0, 4).map((m: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-xs border-b pb-1 last:border-0">
                    <span className="font-medium truncate max-w-[120px]">{m.drugName}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">{m.dose} {m.route}</span>
                      {m.administeredAt ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <Clock className="h-3 w-3 text-orange-500" />
                      )}
                    </div>
                  </div>
                ))}
                {marData.length > 4 && (
                  <p className="text-xs text-muted-foreground text-center">+{marData.length - 4} more medications</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No medications scheduled</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-emerald-500/5">
            <CardTitle className="text-sm flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <div className="p-1.5 rounded-md bg-emerald-500/10">
                <Heart className="h-4 w-4" />
              </div>
              Vitals Trend (Temp/Pulse/BP/Resp)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            {vitals.length > 0 ? (
              <ScrollArea className="h-[140px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs py-1 w-16">Time</TableHead>
                      <TableHead className="text-xs py-1">Temp</TableHead>
                      <TableHead className="text-xs py-1">Pulse</TableHead>
                      <TableHead className="text-xs py-1">BP</TableHead>
                      <TableHead className="text-xs py-1">Resp</TableHead>
                      <TableHead className="text-xs py-1">SpO2</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vitals.slice(-6).reverse().map((v: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs py-1 font-medium">{v.hourSlot}</TableCell>
                        <TableCell className="text-xs py-1">{v.temperature || "-"}°C</TableCell>
                        <TableCell className="text-xs py-1">{v.heartRate || "-"}</TableCell>
                        <TableCell className="text-xs py-1">{v.systolicBp || "-"}/{v.diastolicBp || "-"}</TableCell>
                        <TableCell className="text-xs py-1">{v.respiratoryRate || "-"}</TableCell>
                        <TableCell className={`text-xs py-1 font-medium ${(v.spo2 || 0) >= 95 ? 'text-green-600' : 'text-orange-600'}`}>{v.spo2 || "-"}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground">No vitals recorded for today</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-orange-500/5">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <div className="p-1.5 rounded-md bg-orange-500/10">
                <FileText className="h-4 w-4" />
              </div>
              Nurse Notes (Shift-wise)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            {shiftNotes.length > 0 ? (
              <ScrollArea className="h-[140px]">
                <div className="space-y-2">
                  {shiftNotes.slice(-3).reverse().map((n: any, i: number) => (
                    <div key={i} className="border-l-2 border-orange-400 pl-2 py-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] px-1 py-0">{n.shift}</Badge>
                        <span>{n.nurseName || "Nurse"}</span>
                      </div>
                      <p className="text-xs mt-1 line-clamp-2">{n.observation || n.noteContent || n.generalNotes || n.notes || "No notes"}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground">No shift notes recorded</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-2 bg-slate-500/5">
          <CardTitle className="text-sm flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <div className="p-1.5 rounded-md bg-slate-500/10">
              <Droplets className="h-4 w-4" />
            </div>
            Intake-Output Chart (24-Hour Summary)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
                <Plus className="h-3 w-3" /> INTAKE
              </h4>
              {intakeData.length > 0 ? (
                <div className="space-y-1">
                  {intakeData.slice(-5).map((i: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-xs border-b pb-1">
                      <span className="text-muted-foreground">{i.hourSlot} - {i.intakeType || i.fluidType}</span>
                      <span className="font-medium text-green-600">+{i.volume || i.amount} ml</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold pt-1 border-t-2">
                    <span>Total Intake</span>
                    <span className="text-green-600">{fluidBalance?.totalIntake || 0} ml</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No intake recorded</p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium text-orange-600 mb-2 flex items-center gap-1">
                <XCircle className="h-3 w-3" /> OUTPUT
              </h4>
              {outputData.length > 0 ? (
                <div className="space-y-1">
                  {outputData.slice(-5).map((o: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-xs border-b pb-1">
                      <span className="text-muted-foreground">{o.hourSlot} - {o.outputType || o.type}</span>
                      <span className="font-medium text-orange-600">-{o.volume || o.amount} ml</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold pt-1 border-t-2">
                    <span>Total Output</span>
                    <span className="text-orange-600">{fluidBalance?.totalOutput || 0} ml</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No output recorded</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function VitalsTab({ sessionId }: { sessionId: string }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [vitalsForm, setVitalsForm] = useState({
    pulse: "", sbp: "", dbp: "", temperature: "", respiratoryRate: "", spo2: ""
  });

  const { data: vitals = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/vitals/${sessionId}`]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/vitals", data),
    onSuccess: () => {
      refetch();
      toast({ title: "Vitals Saved", description: "Record added successfully" });
      setVitalsForm({ pulse: "", sbp: "", dbp: "", temperature: "", respiratoryRate: "", spo2: "" });
      setSelectedSlot("");
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save vitals", variant: "destructive" });
    }
  });

  const handleSave = () => {
    if (!selectedSlot) return;
    saveMutation.mutate({
      sessionId,
      hourSlot: selectedSlot,
      heartRate: vitalsForm.pulse ? parseInt(vitalsForm.pulse) : null,
      systolicBp: vitalsForm.sbp ? parseInt(vitalsForm.sbp) : null,
      diastolicBp: vitalsForm.dbp ? parseInt(vitalsForm.dbp) : null,
      temperature: vitalsForm.temperature ? vitalsForm.temperature : null,
      respiratoryRate: vitalsForm.respiratoryRate ? parseInt(vitalsForm.respiratoryRate) : null,
      spo2: vitalsForm.spo2 ? parseInt(vitalsForm.spo2) : null,
      nurseId: "system-nurse",
      nurseName: "ICU Nurse"
    });
  };

  const handlePrint = () => {
    const rows = HOUR_SLOTS.map(slot => {
      const v = vitals.find((x: any) => x.hourSlot === slot);
      return `<tr>
        <td style="text-align:center;font-weight:bold;">${slot}</td>
        <td style="text-align:center;">${v?.heartRate || '-'}</td>
        <td style="text-align:center;">${v ? `${v.systolicBp || '-'}/${v.diastolicBp || '-'}` : '-'}</td>
        <td style="text-align:center;">${v?.temperature ? `${v.temperature}°C` : '-'}</td>
        <td style="text-align:center;">${v?.respiratoryRate || '-'}</td>
        <td style="text-align:center;">${v?.spo2 ? `${v.spo2}%` : '-'}</td>
        <td style="text-align:center;">${v?.nurseName || '-'}</td>
      </tr>`;
    }).join('');
    const content = `
      <h1>HOURLY VITALS CHART (24 HOURS)</h1>
      <table>
        <thead>
          <tr>
            <th style="width:80px;">Time Slot</th>
            <th>Pulse (bpm)</th>
            <th>BP (mmHg)</th>
            <th>Temp (°C)</th>
            <th>RR (/min)</th>
            <th>SpO2 (%)</th>
            <th>Staff Name</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="signature-section">
        <table>
          <tr>
            <td class="label-cell">Reviewed By:</td>
            <td class="value-cell"></td>
            <td class="label-cell">Date:</td>
            <td class="value-cell">${format(new Date(), 'dd/MM/yyyy')}</td>
          </tr>
        </table>
      </div>
    `;
    openPrintWindow('Vitals Chart', content);
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-lg">Hourly Vitals Chart (24 Hours)</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-vitals"><PlusCircle className="h-4 w-4 mr-1" /> Add Vitals</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Vitals</DialogTitle>
              <DialogDescription>Enter patient vital signs for the selected time slot</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Hour Slot</Label>
                <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                  <SelectTrigger><SelectValue placeholder="Select time..." /></SelectTrigger>
                  <SelectContent>
                    {HOUR_SLOTS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Pulse (bpm)</Label><IntegerInput value={vitalsForm.pulse} onValueChange={(value) => setVitalsForm({...vitalsForm, pulse: value})} min={30} max={250} data-testid="input-pulse" /></div>
                <div><Label>SpO2 (%)</Label><IntegerInput value={vitalsForm.spo2} onValueChange={(value) => setVitalsForm({...vitalsForm, spo2: value})} min={50} max={100} data-testid="input-spo2" /></div>
                <div><Label>SBP (mmHg)</Label><IntegerInput value={vitalsForm.sbp} onValueChange={(value) => setVitalsForm({...vitalsForm, sbp: value})} min={50} max={250} data-testid="input-sbp" /></div>
                <div><Label>DBP (mmHg)</Label><IntegerInput value={vitalsForm.dbp} onValueChange={(value) => setVitalsForm({...vitalsForm, dbp: value})} min={30} max={150} data-testid="input-dbp" /></div>
                <div><Label>Temp (°C)</Label><NumericInput value={vitalsForm.temperature} onValueChange={(value) => setVitalsForm({...vitalsForm, temperature: value})} allowDecimal={true} data-testid="input-temp" /></div>
                <div><Label>RR (/min)</Label><IntegerInput value={vitalsForm.respiratoryRate} onValueChange={(value) => setVitalsForm({...vitalsForm, respiratoryRate: value})} min={5} max={60} data-testid="input-rr" /></div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={!selectedSlot || saveMutation.isPending} data-testid="button-save-vitals">
                {saveMutation.isPending ? "Saving..." : "Save Vitals"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Time</TableHead>
                <TableHead>Pulse</TableHead>
                <TableHead>BP</TableHead>
                <TableHead>Temp</TableHead>
                <TableHead>RR</TableHead>
                <TableHead>SpO2</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {HOUR_SLOTS.map(slot => {
                const v = vitals.find((x: any) => x.hourSlot === slot);
                return (
                  <TableRow key={slot} className={v ? "" : "opacity-50"}>
                    <TableCell className="font-medium">{slot}</TableCell>
                    <TableCell>{v?.heartRate || "-"}</TableCell>
                    <TableCell>{v ? `${v.systolicBp || "-"}/${v.diastolicBp || "-"}` : "-"}</TableCell>
                    <TableCell>{v?.temperature ? `${v.temperature}°C` : "-"}</TableCell>
                    <TableCell>{v?.respiratoryRate || "-"}</TableCell>
                    <TableCell>{v?.spo2 ? `${v.spo2}%` : "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{v?.nurseName || "-"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function InotropesTab({ sessionId }: { sessionId: string }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ injectionName: "", diagnosis: "", date: format(new Date(), "yyyy-MM-dd"), nurseId: "", nurseName: "" });

  const { data: records = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/inotropes/${sessionId}`]
  });

  const { data: nurses = [] } = useQuery<any[]>({
    queryKey: ["/api/users/nurses"]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/inotropes", data),
    onSuccess: () => { 
      refetch(); 
      toast({ title: "Injection Added", description: "Record saved successfully" }); 
      setForm({ injectionName: "", diagnosis: "", date: format(new Date(), "yyyy-MM-dd"), nurseId: "", nurseName: "" });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save injection", variant: "destructive" });
    }
  });

  const handleSave = () => {
    saveMutation.mutate({ 
      sessionId, 
      drugName: form.injectionName,
      diagnosis: form.diagnosis,
      startTime: new Date(form.date).toISOString(),
      nurseId: form.nurseId,
      nurseName: form.nurseName
    });
  };

  const handleNurseChange = (nurseId: string) => {
    const selectedNurse = nurses.find((n: any) => n.id === nurseId);
    setForm({ ...form, nurseId, nurseName: selectedNurse?.fullName || "" });
  };

  const handlePrint = () => {
    const rows = records.map((r: any, idx: number) => 
      `<tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td>${r.drugName || '-'}</td>
        <td>${r.diagnosis || '-'}</td>
        <td style="text-align:center;">${r.startTime ? format(new Date(r.startTime), 'dd/MM/yyyy') : '-'}</td>
        <td style="text-align:center;">${r.startTime ? format(new Date(r.startTime), 'HH:mm') : '-'}</td>
        <td>${r.nurseName || '-'}</td>
      </tr>`
    ).join('');
    const content = `
      <h1>INJECTIONS & MEDICATION RECORD</h1>
      ${records.length ? `
        <table>
          <thead>
            <tr>
              <th style="width:40px;">S.No</th>
              <th>Injection Name</th>
              <th>Diagnosis/Indication</th>
              <th style="width:100px;">Date</th>
              <th style="width:80px;">Time</th>
              <th>Administered By</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr class="summary-row">
              <td colspan="6" style="text-align:right;">Total Injections: ${records.length}</td>
            </tr>
          </tfoot>
        </table>
      ` : '<div class="no-data">No injections recorded</div>'}
      <div class="signature-section">
        <table>
          <tr>
            <td class="label-cell">Verified By:</td>
            <td class="value-cell"></td>
            <td class="label-cell">Date:</td>
            <td class="value-cell">${format(new Date(), 'dd/MM/yyyy')}</td>
          </tr>
        </table>
      </div>
    `;
    openPrintWindow('Injections', content);
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-lg">Injections & Medication</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-inotrope"><PlusCircle className="h-4 w-4 mr-1" /> Add Injection</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Injection</DialogTitle>
              <DialogDescription>Add injection/medication details</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Injection Name</Label><Input value={form.injectionName} onChange={(e) => setForm({...form, injectionName: e.target.value})} placeholder="e.g., Noradrenaline" /></div>
              <div><Label>Diagnosis</Label><Input value={form.diagnosis} onChange={(e) => setForm({...form, diagnosis: e.target.value})} placeholder="e.g., Septic Shock" /></div>
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} /></div>
              <div>
                <Label>Staff Name</Label>
                <Select value={form.nurseId} onValueChange={handleNurseChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select nurse" />
                  </SelectTrigger>
                  <SelectContent>
                    {nurses.map((nurse: any) => (
                      <SelectItem key={nurse.id} value={nurse.id}>{nurse.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={!form.injectionName || !form.nurseId || saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No injections/medications recorded</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Injection Name</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Staff Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.drugName}</TableCell>
                  <TableCell>{r.diagnosis || "-"}</TableCell>
                  <TableCell>{r.startTime ? format(new Date(r.startTime), "dd/MM/yyyy") : format(new Date(r.createdAt), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{r.nurseName || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function VentilatorTab({ sessionId, isOnVentilator }: { sessionId: string; isOnVentilator: boolean }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ mode: "CMV", fio2: "", peep: "", tidalVolume: "", respiratoryRateSet: "" });

  const { data: records = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/ventilator/${sessionId}`],
    enabled: isOnVentilator
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/ventilator", data),
    onSuccess: () => { 
      refetch(); 
      toast({ title: "Ventilator Settings Saved", description: "Record saved successfully" });
      setForm({ mode: "CMV", fio2: "", peep: "", tidalVolume: "", respiratoryRateSet: "" });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    }
  });

  const handleSave = () => {
    saveMutation.mutate({ 
      sessionId, 
      ventilationMode: form.mode, 
      fio2: form.fio2 ? parseInt(form.fio2) : null,
      peepCpap: form.peep || null,
      setTidalVolume: form.tidalVolume ? parseInt(form.tidalVolume) : null,
      respiratoryRateSet: form.respiratoryRateSet ? parseInt(form.respiratoryRateSet) : null,
      shift: "MORNING",
      nurseId: "system-nurse",
      nurseName: "ICU Nurse"
    });
  };

  if (!isOnVentilator) {
    return (
      <Card className="mt-4">
        <CardContent className="text-center py-12">
          <Wind className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Patient is not on ventilator</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Ventilator Settings</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Record Settings</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ventilator Settings</DialogTitle>
              <DialogDescription>Record current ventilator parameters</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Mode</Label>
                <Select value={form.mode} onValueChange={(v) => setForm({...form, mode: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["CMV", "SIMV", "PSV", "CPAP", "BiPAP", "PRVC", "APRV"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>FiO2 (%)</Label><Input type="number" value={form.fio2} onChange={(e) => setForm({...form, fio2: e.target.value})} /></div>
              <div><Label>PEEP (cmH2O)</Label><Input type="number" value={form.peep} onChange={(e) => setForm({...form, peep: e.target.value})} /></div>
              <div><Label>Tidal Volume (ml)</Label><Input type="number" value={form.tidalVolume} onChange={(e) => setForm({...form, tidalVolume: e.target.value})} /></div>
              <div><Label>RR Set (/min)</Label><Input type="number" value={form.respiratoryRateSet} onChange={(e) => setForm({...form, respiratoryRateSet: e.target.value})} /></div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No ventilator settings recorded</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>FiO2</TableHead>
                <TableHead>PEEP</TableHead>
                <TableHead>TV</TableHead>
                <TableHead>RR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{format(new Date(r.recordedAt), "HH:mm")}</TableCell>
                  <TableCell><Badge>{r.mode}</Badge></TableCell>
                  <TableCell>{r.fio2}%</TableCell>
                  <TableCell>{r.peep}</TableCell>
                  <TableCell>{r.tidalVolume}</TableCell>
                  <TableCell>{r.respiratoryRateSet}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ABGLabTab({ sessionId }: { sessionId: string }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ph: "", pco2: "", po2: "", hco3: "", lactate: "", hemoglobin: "" });

  const { data: records = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/abg-lab/${sessionId}`]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/abg-lab", data),
    onSuccess: () => { 
      refetch(); 
      toast({ title: "ABG/Lab Results Saved", description: "Record added successfully" });
      setForm({ ph: "", pco2: "", po2: "", hco3: "", lactate: "", hemoglobin: "" });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save results", variant: "destructive" });
    }
  });

  const handleSave = () => {
    saveMutation.mutate({ 
      sessionId, 
      ph: form.ph || null,
      pco2: form.pco2 || null,
      po2: form.po2 || null,
      hco3: form.hco3 || null,
      lactate: form.lactate || null,
      hb: form.hemoglobin || null,
      nurseId: "system-nurse",
      nurseName: "Lab Tech"
    });
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">ABG & Lab Results</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Results</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ABG / Lab Results</DialogTitle>
              <DialogDescription>Enter blood gas and laboratory values</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>pH</Label><Input type="number" step="0.01" value={form.ph} onChange={(e) => setForm({...form, ph: e.target.value})} placeholder="7.35-7.45" /></div>
              <div><Label>pCO2 (mmHg)</Label><Input type="number" value={form.pco2} onChange={(e) => setForm({...form, pco2: e.target.value})} placeholder="35-45" /></div>
              <div><Label>pO2 (mmHg)</Label><Input type="number" value={form.po2} onChange={(e) => setForm({...form, po2: e.target.value})} placeholder="80-100" /></div>
              <div><Label>HCO3 (mEq/L)</Label><Input type="number" step="0.1" value={form.hco3} onChange={(e) => setForm({...form, hco3: e.target.value})} placeholder="22-26" /></div>
              <div><Label>Lactate (mmol/L)</Label><Input type="number" step="0.1" value={form.lactate} onChange={(e) => setForm({...form, lactate: e.target.value})} /></div>
              <div><Label>Hemoglobin (g/dL)</Label><Input type="number" step="0.1" value={form.hemoglobin} onChange={(e) => setForm({...form, hemoglobin: e.target.value})} /></div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No ABG/Lab results recorded</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>pH</TableHead>
                <TableHead>pCO2</TableHead>
                <TableHead>pO2</TableHead>
                <TableHead>HCO3</TableHead>
                <TableHead>Lactate</TableHead>
                <TableHead>Hb</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{format(new Date(r.recordedAt), "HH:mm")}</TableCell>
                  <TableCell className={r.ph < 7.35 || r.ph > 7.45 ? "text-red-600 font-medium" : ""}>{r.ph}</TableCell>
                  <TableCell>{r.pco2}</TableCell>
                  <TableCell>{r.po2}</TableCell>
                  <TableCell>{r.hco3}</TableCell>
                  <TableCell className={r.lactate > 2 ? "text-red-600 font-medium" : ""}>{r.lactate}</TableCell>
                  <TableCell>{r.hemoglobin}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function IntakeTab({ sessionId }: { sessionId: string }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [form, setForm] = useState({ ivLine1: "", oral: "", ngTube: "", bloodProducts: "" });

  const { data: records = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/intake/${sessionId}`]
  });

  const { data: fluidBalance } = useQuery<FluidBalance>({
    queryKey: [`/api/patient-monitoring/fluid-balance/${sessionId}`]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/intake", data),
    onSuccess: () => { 
      refetch(); 
      queryClient.invalidateQueries({ queryKey: [`/api/patient-monitoring/fluid-balance/${sessionId}`] }); 
      toast({ title: "Intake Saved", description: "Record added successfully" });
      setForm({ ivLine1: "", oral: "", ngTube: "", bloodProducts: "" });
      setSelectedSlot("");
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save intake", variant: "destructive" });
    }
  });

  const handleSave = () => {
    saveMutation.mutate({ 
      sessionId, 
      hourSlot: selectedSlot,
      ivLine1: parseInt(form.ivLine1) || 0,
      oral: parseInt(form.oral) || 0,
      ngTube: parseInt(form.ngTube) || 0,
      bloodProducts: parseInt(form.bloodProducts) || 0,
      nurseId: "system-nurse",
      nurseName: "ICU Nurse"
    });
  };

  const handlePrint = () => {
    const rows = HOUR_SLOTS.map(slot => {
      const r = records.find((x: any) => x.hourSlot === slot);
      const total = (r?.ivLine1 || 0) + (r?.oral || 0) + (r?.ngTube || 0) + (r?.bloodProducts || 0);
      return `<tr>
        <td style="text-align:center;font-weight:bold;">${slot}</td>
        <td style="text-align:center;">${r?.ivLine1 || '-'}</td>
        <td style="text-align:center;">${r?.oral || '-'}</td>
        <td style="text-align:center;">${r?.ngTube || '-'}</td>
        <td style="text-align:center;">${r?.bloodProducts || '-'}</td>
        <td style="text-align:center;font-weight:bold;">${total || '-'}</td>
      </tr>`;
    }).join('');
    const content = `
      <h1>FLUID INTAKE CHART (24 HOURS)</h1>
      <table>
        <thead>
          <tr>
            <th style="width:80px;">Time Slot</th>
            <th>IV Line 1 (ml)</th>
            <th>Oral (ml)</th>
            <th>NG Tube (ml)</th>
            <th>Blood Products (ml)</th>
            <th style="background:#d4edda;">Total (ml)</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr class="summary-row">
            <td colspan="5" style="text-align:right;font-weight:bold;">TOTAL INTAKE:</td>
            <td style="text-align:center;font-weight:bold;background:#d4edda;">${fluidBalance?.totalIntake || 0} ml</td>
          </tr>
        </tfoot>
      </table>
      <div class="signature-section">
        <table>
          <tr>
            <td class="label-cell">Recorded By:</td>
            <td class="value-cell"></td>
            <td class="label-cell">Date:</td>
            <td class="value-cell">${format(new Date(), 'dd/MM/yyyy')}</td>
          </tr>
        </table>
      </div>
    `;
    openPrintWindow('Intake Chart', content);
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="text-lg">Intake Chart</CardTitle>
          <CardDescription>Total Intake: <span className="font-semibold text-primary">{fluidBalance?.totalIntake || 0} ml</span></CardDescription>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Intake</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Intake</DialogTitle>
              <DialogDescription>Enter fluid intake for the selected hour</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Hour Slot</Label>
                <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                  <SelectTrigger><SelectValue placeholder="Select time..." /></SelectTrigger>
                  <SelectContent>{HOUR_SLOTS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>IV Line 1 (ml)</Label><Input type="number" value={form.ivLine1} onChange={(e) => setForm({...form, ivLine1: e.target.value})} /></div>
                <div><Label>Oral (ml)</Label><Input type="number" value={form.oral} onChange={(e) => setForm({...form, oral: e.target.value})} /></div>
                <div><Label>NG Tube (ml)</Label><Input type="number" value={form.ngTube} onChange={(e) => setForm({...form, ngTube: e.target.value})} /></div>
                <div><Label>Blood Products (ml)</Label><Input type="number" value={form.bloodProducts} onChange={(e) => setForm({...form, bloodProducts: e.target.value})} /></div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={!selectedSlot || saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>IV Line 1</TableHead>
                <TableHead>Oral</TableHead>
                <TableHead>NG Tube</TableHead>
                <TableHead>Blood</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {HOUR_SLOTS.map(slot => {
                const r = records.find((x: any) => x.hourSlot === slot);
                return (
                  <TableRow key={slot} className={r ? "" : "opacity-50"}>
                    <TableCell className="font-medium">{slot}</TableCell>
                    <TableCell>{r?.ivLine1 || "-"}</TableCell>
                    <TableCell>{r?.oral || "-"}</TableCell>
                    <TableCell>{r?.ngTube || "-"}</TableCell>
                    <TableCell>{r?.bloodProducts || "-"}</TableCell>
                    <TableCell className="font-semibold">{r?.hourlyTotal || "-"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function OutputTab({ sessionId }: { sessionId: string }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [form, setForm] = useState({ urineOutput: "", drainOutput: "", vomitus: "", stool: "" });

  const { data: records = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/output/${sessionId}`]
  });

  const { data: fluidBalance } = useQuery<FluidBalance>({
    queryKey: [`/api/patient-monitoring/fluid-balance/${sessionId}`]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/output", data),
    onSuccess: () => { 
      refetch(); 
      queryClient.invalidateQueries({ queryKey: [`/api/patient-monitoring/fluid-balance/${sessionId}`] }); 
      toast({ title: "Output Saved", description: "Record added successfully" });
      setForm({ urineOutput: "", drainOutput: "", vomitus: "", stool: "" });
      setSelectedSlot("");
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save output", variant: "destructive" });
    }
  });

  const handleSave = () => {
    saveMutation.mutate({ 
      sessionId, 
      hourSlot: selectedSlot,
      urineOutput: parseInt(form.urineOutput) || 0,
      drainOutput: parseInt(form.drainOutput) || 0,
      vomitus: parseInt(form.vomitus) || 0,
      stool: parseInt(form.stool) || 0,
      nurseId: "system-nurse",
      nurseName: "ICU Nurse"
    });
  };

  const handlePrint = () => {
    const rows = HOUR_SLOTS.map(slot => {
      const r = records.find((x: any) => x.hourSlot === slot);
      const total = (r?.urineOutput || 0) + (r?.drainOutput || 0) + (r?.vomitus || 0) + (r?.stool || 0);
      return `<tr>
        <td style="text-align:center;font-weight:bold;">${slot}</td>
        <td style="text-align:center;">${r?.urineOutput || '-'}</td>
        <td style="text-align:center;">${r?.drainOutput || '-'}</td>
        <td style="text-align:center;">${r?.vomitus || '-'}</td>
        <td style="text-align:center;">${r?.stool || '-'}</td>
        <td style="text-align:center;font-weight:bold;">${total || '-'}</td>
      </tr>`;
    }).join('');
    const netBalance = (fluidBalance?.totalIntake || 0) - (fluidBalance?.totalOutput || 0);
    const content = `
      <h1>FLUID OUTPUT CHART (24 HOURS)</h1>
      <table>
        <thead>
          <tr>
            <th style="width:80px;">Time Slot</th>
            <th>Urine (ml)</th>
            <th>Drain (ml)</th>
            <th>Vomitus (ml)</th>
            <th>Stool (ml)</th>
            <th style="background:#f8d7da;">Total (ml)</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr class="summary-row">
            <td colspan="5" style="text-align:right;font-weight:bold;">TOTAL OUTPUT:</td>
            <td style="text-align:center;font-weight:bold;background:#f8d7da;">${fluidBalance?.totalOutput || 0} ml</td>
          </tr>
        </tfoot>
      </table>
      <h3>FLUID BALANCE SUMMARY</h3>
      <table>
        <tr>
          <td class="label-cell">Total Intake:</td>
          <td class="value-cell" style="text-align:center;">${fluidBalance?.totalIntake || 0} ml</td>
          <td class="label-cell">Total Output:</td>
          <td class="value-cell" style="text-align:center;">${fluidBalance?.totalOutput || 0} ml</td>
        </tr>
        <tr>
          <td class="label-cell">Net Balance:</td>
          <td colspan="3" style="text-align:center;font-weight:bold;${netBalance >= 0 ? 'color:green;' : 'color:red;'}">${netBalance >= 0 ? '+' : ''}${netBalance} ml</td>
        </tr>
      </table>
      <div class="signature-section">
        <table>
          <tr>
            <td class="label-cell">Recorded By:</td>
            <td class="value-cell"></td>
            <td class="label-cell">Date:</td>
            <td class="value-cell">${format(new Date(), 'dd/MM/yyyy')}</td>
          </tr>
        </table>
      </div>
    `;
    openPrintWindow('Output Chart', content);
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="text-lg">Output Chart</CardTitle>
          <CardDescription>Total Output: <span className="font-semibold text-primary">{fluidBalance?.totalOutput || 0} ml</span> | Net Balance: <span className={`font-semibold ${(fluidBalance?.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fluidBalance?.netBalance || 0} ml</span></CardDescription>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Output</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Output</DialogTitle>
              <DialogDescription>Enter fluid output for the selected hour</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Hour Slot</Label>
                <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                  <SelectTrigger><SelectValue placeholder="Select time..." /></SelectTrigger>
                  <SelectContent>{HOUR_SLOTS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Urine (ml)</Label><Input type="number" value={form.urineOutput} onChange={(e) => setForm({...form, urineOutput: e.target.value})} /></div>
                <div><Label>Drain (ml)</Label><Input type="number" value={form.drainOutput} onChange={(e) => setForm({...form, drainOutput: e.target.value})} /></div>
                <div><Label>Vomitus (ml)</Label><Input type="number" value={form.vomitus} onChange={(e) => setForm({...form, vomitus: e.target.value})} /></div>
                <div><Label>Stool (ml)</Label><Input type="number" value={form.stool} onChange={(e) => setForm({...form, stool: e.target.value})} /></div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={!selectedSlot || saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Urine</TableHead>
                <TableHead>Drain</TableHead>
                <TableHead>Vomitus</TableHead>
                <TableHead>Stool</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {HOUR_SLOTS.map(slot => {
                const r = records.find((x: any) => x.hourSlot === slot);
                return (
                  <TableRow key={slot} className={r ? "" : "opacity-50"}>
                    <TableCell className="font-medium">{slot}</TableCell>
                    <TableCell>{r?.urineOutput || "-"}</TableCell>
                    <TableCell>{r?.drainOutput || "-"}</TableCell>
                    <TableCell>{r?.vomitus || "-"}</TableCell>
                    <TableCell>{r?.stool || "-"}</TableCell>
                    <TableCell className="font-semibold">{r?.hourlyTotal || "-"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function DiabeticTab({ sessionId }: { sessionId: string }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ bloodSugarLevel: "", insulinType: "", insulinDose: "", checkTime: "" });

  const { data: records = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/diabetic/${sessionId}`]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/diabetic", data),
    onSuccess: () => { 
      refetch(); 
      toast({ title: "Diabetic Record Saved", description: "Record added successfully" });
      setForm({ bloodSugarLevel: "", insulinType: "", insulinDose: "", checkTime: "" });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save record", variant: "destructive" });
    }
  });

  const handleSave = () => {
    saveMutation.mutate({ 
      sessionId, 
      bloodSugarLevel: parseInt(form.bloodSugarLevel),
      recordedTime: new Date().toISOString(),
      insulinType: form.insulinType || null,
      insulinDose: form.insulinDose || null,
      nurseId: "system-nurse",
      nurseName: "ICU Nurse"
    });
  };

  const handlePrint = () => {
    const rows = records.map((r: any, idx: number) => 
      `<tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="text-align:center;">${r.checkTime || format(new Date(r.createdAt), 'HH:mm')}</td>
        <td style="text-align:center;font-weight:bold;">${r.bloodSugarLevel || '-'}</td>
        <td>${r.insulinType || '-'}</td>
        <td style="text-align:center;">${r.insulinDose || '-'}</td>
        <td style="text-align:center;${r.alertType === 'HIGH' ? 'color:red;font-weight:bold;' : r.alertType === 'LOW' ? 'color:orange;font-weight:bold;' : ''}">${r.alertType || 'Normal'}</td>
        <td style="text-align:center;">${r.createdAt ? format(new Date(r.createdAt), 'dd/MM/yyyy') : '-'}</td>
      </tr>`
    ).join('');
    const content = `
      <h1>DIABETIC FLOW CHART</h1>
      ${records.length ? `
        <table>
          <thead>
            <tr>
              <th style="width:40px;">S.No</th>
              <th style="width:100px;">Check Time</th>
              <th>Blood Sugar (mg/dL)</th>
              <th>Insulin Type</th>
              <th style="width:80px;">Dose (Units)</th>
              <th style="width:80px;">Alert</th>
              <th style="width:100px;">Date</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr class="summary-row">
              <td colspan="7" style="text-align:right;">Total Records: ${records.length}</td>
            </tr>
          </tfoot>
        </table>
      ` : '<div class="no-data">No diabetic records</div>'}
      <h3>REFERENCE VALUES</h3>
      <table>
        <tr>
          <td class="label-cell">Fasting (Pre-Meal):</td>
          <td class="value-cell">80-130 mg/dL</td>
          <td class="label-cell">Post-Meal (2hr):</td>
          <td class="value-cell">&lt;180 mg/dL</td>
        </tr>
        <tr>
          <td class="label-cell">Low (Hypoglycemia):</td>
          <td class="value-cell" style="color:orange;">&lt;70 mg/dL</td>
          <td class="label-cell">High (Hyperglycemia):</td>
          <td class="value-cell" style="color:red;">&gt;250 mg/dL</td>
        </tr>
      </table>
      <div class="signature-section">
        <table>
          <tr>
            <td class="label-cell">Monitored By:</td>
            <td class="value-cell"></td>
            <td class="label-cell">Date:</td>
            <td class="value-cell">${format(new Date(), 'dd/MM/yyyy')}</td>
          </tr>
        </table>
      </div>
    `;
    openPrintWindow('Diabetic Chart', content);
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-lg">Diabetic Flow Chart</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Record</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Blood Sugar & Insulin</DialogTitle>
              <DialogDescription>Record blood sugar level and insulin administration</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Check Time</Label>
                <Select value={form.checkTime} onValueChange={(v) => setForm({...form, checkTime: v})}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {["Pre-Breakfast", "Post-Breakfast", "Pre-Lunch", "Post-Lunch", "Pre-Dinner", "Post-Dinner", "Bedtime", "3 AM", "Random"].map(t => 
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Blood Sugar Level (mg/dL)</Label><IntegerInput value={form.bloodSugarLevel} onValueChange={(value) => setForm({...form, bloodSugarLevel: value})} min={20} max={600} /></div>
              <div><Label>Insulin Type</Label><Input value={form.insulinType} onChange={(e) => setForm({...form, insulinType: e.target.value})} placeholder="e.g., Regular, NPH, Lantus" /></div>
              <div><Label>Insulin Dose (Units)</Label><IntegerInput value={form.insulinDose} onValueChange={(value) => setForm({...form, insulinDose: value})} min={1} max={200} /></div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={!form.bloodSugarLevel || saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No diabetic records</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Check</TableHead>
                <TableHead>BSL</TableHead>
                <TableHead>Insulin</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Alert</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{format(new Date(r.createdAt), "HH:mm")}</TableCell>
                  <TableCell>{r.checkTime}</TableCell>
                  <TableCell className={r.bloodSugarLevel < 70 ? "text-red-600 font-bold" : r.bloodSugarLevel > 250 ? "text-orange-600 font-bold" : ""}>{r.bloodSugarLevel}</TableCell>
                  <TableCell>{r.insulinType || "-"}</TableCell>
                  <TableCell>{r.insulinDose || "-"}</TableCell>
                  <TableCell>
                    {r.alertType && <Badge variant="destructive">{r.alertType}</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function MARTab({ sessionId }: { sessionId: string }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ medicineName: "", diagnosis: "", date: format(new Date(), "yyyy-MM-dd"), nurseId: "", nurseName: "" });

  const { data: records = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/mar/${sessionId}`]
  });

  const { data: nurses = [] } = useQuery<any[]>({
    queryKey: ["/api/users/nurses"]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/mar", data),
    onSuccess: () => { 
      refetch(); 
      toast({ title: "Medicine Entry Added", description: "Medication recorded successfully" });
      setForm({ medicineName: "", diagnosis: "", date: format(new Date(), "yyyy-MM-dd"), nurseId: "", nurseName: "" });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save medication", variant: "destructive" });
    }
  });

  const handleSave = () => {
    saveMutation.mutate({ 
      sessionId, 
      drugName: form.medicineName,
      diagnosis: form.diagnosis,
      scheduledTime: new Date(form.date).toISOString(),
      nurseId: form.nurseId,
      nurseName: form.nurseName,
      status: "GIVEN"
    });
  };

  const handleNurseChange = (nurseId: string) => {
    const selectedNurse = nurses.find((n: any) => n.id === nurseId);
    setForm({ ...form, nurseId, nurseName: selectedNurse?.fullName || "" });
  };

  const handlePrint = () => {
    const rows = records.map((r: any, idx: number) => 
      `<tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td>${r.drugName || r.medicineName || '-'}</td>
        <td>${r.diagnosis || '-'}</td>
        <td style="text-align:center;">${r.scheduledTime ? format(new Date(r.scheduledTime), 'dd/MM/yyyy') : '-'}</td>
        <td style="text-align:center;">${r.scheduledTime ? format(new Date(r.scheduledTime), 'HH:mm') : '-'}</td>
        <td>${r.nurseName || '-'}</td>
      </tr>`
    ).join('');
    const content = `
      <h1>MEDICATION ADMINISTRATION RECORD</h1>
      ${records.length ? `
        <table>
          <thead>
            <tr>
              <th style="width:40px;">S.No</th>
              <th>Medicine Name</th>
              <th>Diagnosis/Indication</th>
              <th style="width:100px;">Date</th>
              <th style="width:80px;">Time</th>
              <th>Administered By</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr class="summary-row">
              <td colspan="6" style="text-align:right;">Total Medicines: ${records.length}</td>
            </tr>
          </tfoot>
        </table>
      ` : '<div class="no-data">No medicines recorded</div>'}
      <div class="signature-section">
        <table>
          <tr>
            <td class="label-cell">Verified By:</td>
            <td class="value-cell"></td>
            <td class="label-cell">Date:</td>
            <td class="value-cell">${format(new Date(), 'dd/MM/yyyy')}</td>
          </tr>
        </table>
      </div>
    `;
    openPrintWindow('Medicines', content);
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-lg">Medicines</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Medicine</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Medicine</DialogTitle>
              <DialogDescription>Record medication administration</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Medicine Name</Label><Input value={form.medicineName} onChange={(e) => setForm({...form, medicineName: e.target.value})} placeholder="e.g., Paracetamol 500mg" /></div>
              <div><Label>Diagnosis</Label><Input value={form.diagnosis} onChange={(e) => setForm({...form, diagnosis: e.target.value})} placeholder="e.g., Fever, Infection" /></div>
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} /></div>
              <div>
                <Label>Staff Name</Label>
                <Select value={form.nurseId} onValueChange={handleNurseChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select nurse" />
                  </SelectTrigger>
                  <SelectContent>
                    {nurses.map((nurse: any) => (
                      <SelectItem key={nurse.id} value={nurse.id}>{nurse.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={!form.medicineName || !form.nurseId || saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No medicines recorded</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine Name</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Staff Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.drugName || r.medicineName}</TableCell>
                  <TableCell>{r.diagnosis || "-"}</TableCell>
                  <TableCell>{r.scheduledTime ? format(new Date(r.scheduledTime), "dd/MM/yyyy") : format(new Date(r.createdAt), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{r.nurseName || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function OnceOnlyTab({ sessionId }: { sessionId: string }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ drugName: "", dose: "", route: "", indication: "" });

  const { data: records = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/once-only/${sessionId}`]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/once-only", data),
    onSuccess: () => { 
      refetch(); 
      toast({ title: "Once-Only Drug Added", description: "STAT medication recorded" });
      setForm({ drugName: "", dose: "", route: "", indication: "" });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save drug", variant: "destructive" });
    }
  });

  const handleSave = () => {
    saveMutation.mutate({ 
      sessionId, 
      drugName: form.drugName,
      dose: form.dose,
      route: form.route,
      timeOrdered: new Date().toISOString(),
      nurseId: "system-nurse",
      nurseName: "ICU Nurse"
    });
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Once-Only / STAT Drugs</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add STAT Drug</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Once-Only Drug</DialogTitle>
              <DialogDescription>Add a single-dose or STAT medication</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Drug Name</Label><Input value={form.drugName} onChange={(e) => setForm({...form, drugName: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Dose</Label><Input value={form.dose} onChange={(e) => setForm({...form, dose: e.target.value})} /></div>
                <div><Label>Route</Label>
                  <Select value={form.route} onValueChange={(v) => setForm({...form, route: v})}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{["IV", "IM", "Oral", "SC"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Indication</Label><Textarea value={form.indication} onChange={(e) => setForm({...form, indication: e.target.value})} /></div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={!form.drugName || !form.dose || !form.route || saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No once-only drugs administered</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drug</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Given At</TableHead>
                <TableHead>By</TableHead>
                <TableHead>Indication</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.drugName}</TableCell>
                  <TableCell>{r.dose}</TableCell>
                  <TableCell>{r.route}</TableCell>
                  <TableCell className="text-xs">{r.givenAt ? format(new Date(r.givenAt), "HH:mm") : "-"}</TableCell>
                  <TableCell>{r.givenBy}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{r.indication}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ShiftNotesTab({ sessionId }: { sessionId: string }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ shift: "MORNING", noteType: "ASSESSMENT", noteContent: "", staffName: "", staffRole: "NURSE" });

  const { data: records = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/shift-notes/${sessionId}`]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/shift-notes", data),
    onSuccess: () => { 
      refetch(); 
      toast({ title: "Shift Note Added", description: "Note saved successfully" }); 
      setForm({...form, noteContent: "", staffName: ""});
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save note", variant: "destructive" });
    }
  });

  const handleSave = () => {
    saveMutation.mutate({ 
      sessionId, 
      shift: form.shift,
      eventType: form.noteType,
      observation: form.noteContent,
      noteTime: new Date().toISOString(),
      nurseId: "system-nurse",
      nurseName: form.staffName || "Staff",
      staffRole: form.staffRole
    });
  };

  const handlePrint = () => {
    const groupedByShift: Record<string, any[]> = {};
    records.forEach((r: any) => {
      const shift = r.shift || 'Unspecified';
      if (!groupedByShift[shift]) groupedByShift[shift] = [];
      groupedByShift[shift].push(r);
    });
    
    let content = `<h1>NURSING SHIFT NOTES</h1>`;
    
    if (records.length) {
      Object.entries(groupedByShift).forEach(([shift, shiftRecords]) => {
        content += `<h3>${shift} Shift</h3>`;
        const rows = shiftRecords.map((r: any, idx: number) => 
          `<tr>
            <td style="text-align:center;">${idx + 1}</td>
            <td style="text-align:center;">${r.noteTime ? format(new Date(r.noteTime), 'HH:mm') : '-'}</td>
            <td>${r.eventType || '-'}</td>
            <td style="white-space:pre-wrap;">${r.observation || '-'}</td>
            <td>${r.nurseName || '-'}</td>
            <td style="text-align:center;">${r.staffRole || 'NURSE'}</td>
          </tr>`
        ).join('');
        content += `<table>
          <thead>
            <tr>
              <th style="width:40px;">S.No</th>
              <th style="width:80px;">Time</th>
              <th style="width:120px;">Event Type</th>
              <th>Notes/Observation</th>
              <th style="width:150px;">Staff Name</th>
              <th style="width:80px;">Role</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;
      });
      content += `<div class="summary-row" style="padding:8px;background:#f0f0f0;margin:10px 0;">Total Notes: ${records.length}</div>`;
    } else {
      content += '<div class="no-data">No shift notes recorded</div>';
    }
    
    content += `<div class="signature-section">
      <table>
        <tr>
          <td class="label-cell">Reviewed By:</td>
          <td class="value-cell"></td>
          <td class="label-cell">Date:</td>
          <td class="value-cell">${format(new Date(), 'dd/MM/yyyy')}</td>
        </tr>
      </table>
    </div>`;
    openPrintWindow('Shift Notes', content);
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-lg">Nursing Shift Notes</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Note</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Shift Note</DialogTitle>
              <DialogDescription>Record nursing observation or note</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Staff Name</Label>
                  <Input value={form.staffName} onChange={(e) => setForm({...form, staffName: e.target.value})} placeholder="Enter staff name" />
                </div>
                <div><Label>Role</Label>
                  <Select value={form.staffRole} onValueChange={(v) => setForm({...form, staffRole: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["NURSE", "DOCTOR", "RESIDENT", "INTERN", "TECHNICIAN"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Shift</Label>
                  <Select value={form.shift} onValueChange={(v) => setForm({...form, shift: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SHIFTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Type</Label>
                  <Select value={form.noteType} onValueChange={(v) => setForm({...form, noteType: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["ASSESSMENT", "INTERVENTION", "OBSERVATION", "HANDOVER", "CRITICAL"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Note Content</Label><Textarea value={form.noteContent} onChange={(e) => setForm({...form, noteContent: e.target.value})} rows={4} /></div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={!form.noteContent || saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save Note"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No shift notes recorded</p>
        ) : (
          <div className="space-y-3">
            {records.map((r: any) => (
              <Card key={r.id} className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-2">
                    <Badge>{r.shift}</Badge>
                    <Badge variant="outline">{r.noteType}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{format(new Date(r.noteTime), "dd/MM HH:mm")} - {r.nurseName} ({r.staffRole || 'NURSE'})</span>
                </div>
                <p className="text-sm">{r.observation || r.noteContent || "No content"}</p>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AirwayTab({ sessionId }: { sessionId: string }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ 
    airwayType: "", endotrachealTubeSize: "", 
    centralLineType: "", centralLineSite: "", centralLineDate: "",
    urinaryCatheterSize: "", urinaryCatheterDate: "",
    ngTubeSize: "", ngTubeDate: ""
  });

  const { data: record, refetch } = useQuery<any>({
    queryKey: [`/api/patient-monitoring/airway/${sessionId}`]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/airway", data),
    onSuccess: () => { 
      refetch(); 
      toast({ title: "Lines & Tubes Saved", description: "Record saved successfully" });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save data", variant: "destructive" });
    }
  });

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Airway, Lines & Tubes</CardTitle>
        {!record && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Details</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Lines & Tubes Details</DialogTitle>
                <DialogDescription>Record airway, lines, and tubes information</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4 pr-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Airway</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Airway Type</Label>
                        <Select value={form.airwayType} onValueChange={(v) => setForm({...form, airwayType: v})}>
                          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            {["Natural", "ETT", "Tracheostomy", "LMA"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>ET Tube Size</Label><Input value={form.endotrachealTubeSize} onChange={(e) => setForm({...form, endotrachealTubeSize: e.target.value})} placeholder="e.g., 7.5" /></div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Central Line</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Type</Label><Input value={form.centralLineType} onChange={(e) => setForm({...form, centralLineType: e.target.value})} placeholder="e.g., Triple Lumen" /></div>
                      <div><Label>Site</Label><Input value={form.centralLineSite} onChange={(e) => setForm({...form, centralLineSite: e.target.value})} placeholder="e.g., Right IJV" /></div>
                      <div><Label>Insertion Date</Label><Input type="date" value={form.centralLineDate} onChange={(e) => setForm({...form, centralLineDate: e.target.value})} /></div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Urinary Catheter</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Size (Fr)</Label><Input value={form.urinaryCatheterSize} onChange={(e) => setForm({...form, urinaryCatheterSize: e.target.value})} /></div>
                      <div><Label>Insertion Date</Label><Input type="date" value={form.urinaryCatheterDate} onChange={(e) => setForm({...form, urinaryCatheterDate: e.target.value})} /></div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">NG/Ryles Tube</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Size (Fr)</Label><Input value={form.ngTubeSize} onChange={(e) => setForm({...form, ngTubeSize: e.target.value})} /></div>
                      <div><Label>Insertion Date</Label><Input type="date" value={form.ngTubeDate} onChange={(e) => setForm({...form, ngTubeDate: e.target.value})} /></div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button variant="outline" type="button">Cancel</Button>
                </DialogClose>
                <Button 
                  onClick={() => saveMutation.mutate({ 
                    sessionId, 
                    ettSize: form.endotrachealTubeSize || null,
                    tracheostomyDetails: form.airwayType === "Tracheostomy" ? form.airwayType : null,
                    centralLineDetails: form.centralLineType ? `${form.centralLineType} - ${form.centralLineSite}` : null,
                    centralLineInsertDate: form.centralLineDate || null,
                    foleyDetails: form.urinaryCatheterSize ? `${form.urinaryCatheterSize} Fr` : null,
                    foleyInsertDate: form.urinaryCatheterDate || null,
                    nurseId: "system-nurse",
                    nurseName: "ICU Nurse"
                  })}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {!record ? (
          <p className="text-muted-foreground text-center py-8">No lines/tubes data recorded</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-3">
              <h4 className="font-medium mb-2">Airway</h4>
              <div className="text-sm space-y-1">
                <div><span className="text-muted-foreground">Type:</span> {record.airwayType || "Natural"}</div>
                {record.endotrachealTubeSize && <div><span className="text-muted-foreground">ET Size:</span> {record.endotrachealTubeSize}</div>}
              </div>
            </Card>
            <Card className="p-3">
              <h4 className="font-medium mb-2">Central Line</h4>
              <div className="text-sm space-y-1">
                <div><span className="text-muted-foreground">Type:</span> {record.centralLineType || "-"}</div>
                <div><span className="text-muted-foreground">Site:</span> {record.centralLineSite || "-"}</div>
              </div>
            </Card>
            <Card className="p-3">
              <h4 className="font-medium mb-2">Urinary Catheter</h4>
              <div className="text-sm space-y-1">
                <div><span className="text-muted-foreground">Size:</span> {record.urinaryCatheterSize ? `${record.urinaryCatheterSize} Fr` : "-"}</div>
              </div>
            </Card>
            <Card className="p-3">
              <h4 className="font-medium mb-2">NG Tube</h4>
              <div className="text-sm space-y-1">
                <div><span className="text-muted-foreground">Size:</span> {record.ngTubeSize ? `${record.ngTubeSize} Fr` : "-"}</div>
              </div>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DutyStaffTab({ sessionId }: { sessionId: string }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ 
    dateTime: new Date().toISOString().slice(0, 16), 
    nursesNotes: "", 
    staffSignEmpNo: "" 
  });

  const { data: records = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/duty-staff/${sessionId}`]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/duty-staff", data),
    onSuccess: () => { 
      refetch(); 
      toast({ title: "Nurse Note Added", description: "Note saved successfully" });
      setForm({ dateTime: new Date().toISOString().slice(0, 16), nursesNotes: "", staffSignEmpNo: "" });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save note", variant: "destructive" });
    }
  });

  const handleSave = () => {
    saveMutation.mutate({ 
      sessionId, 
      shift: "GENERAL",
      nurseId: "nurse-" + Date.now(),
      nurseName: form.staffSignEmpNo,
      nursesNotes: form.nursesNotes,
      staffSignEmpNo: form.staffSignEmpNo,
      shiftStartTime: new Date(form.dateTime).toISOString()
    });
  };

  const handlePrint = () => {
    const rows = records.map((r: any, idx: number) => 
      `<tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="text-align:center;">${r.shiftStartTime ? format(new Date(r.shiftStartTime), 'dd/MM/yyyy') : '-'}</td>
        <td style="text-align:center;">${r.shiftStartTime ? format(new Date(r.shiftStartTime), 'HH:mm') : '-'}</td>
        <td style="white-space:pre-wrap;">${r.nursesNotes || r.observation || '-'}</td>
        <td>${r.staffSignEmpNo || r.nurseName || '-'}</td>
      </tr>`
    ).join('');
    const content = `
      <h1>NURSES NOTES</h1>
      ${records.length ? `
        <table>
          <thead>
            <tr>
              <th style="width:40px;">S.No</th>
              <th style="width:100px;">Date</th>
              <th style="width:80px;">Time</th>
              <th>Nurses Notes / Observations</th>
              <th style="width:180px;">Staff Sign & Emp No.</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr class="summary-row">
              <td colspan="5" style="text-align:right;">Total Notes: ${records.length}</td>
            </tr>
          </tfoot>
        </table>
      ` : '<div class="no-data">No nurse notes recorded</div>'}
      <div class="signature-section">
        <table>
          <tr>
            <td class="label-cell">Reviewed By:</td>
            <td class="value-cell"></td>
            <td class="label-cell">Date:</td>
            <td class="value-cell">${format(new Date(), 'dd/MM/yyyy')}</td>
          </tr>
        </table>
      </div>
    `;
    openPrintWindow('Nurses Notes', content);
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-lg">Nurses Notes</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Note</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Nurse Note</DialogTitle>
              <DialogDescription>Record nursing observation</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Date & Time</Label>
                <Input type="datetime-local" value={form.dateTime} onChange={(e) => setForm({...form, dateTime: e.target.value})} />
              </div>
              <div><Label>Nurses Notes</Label>
                <Textarea value={form.nursesNotes} onChange={(e) => setForm({...form, nursesNotes: e.target.value})} rows={5} placeholder="Enter nursing observations, patient status, treatments..." />
              </div>
              <div><Label>Staff Sign & Emp No.</Label>
                <Input value={form.staffSignEmpNo} onChange={(e) => setForm({...form, staffSignEmpNo: e.target.value})} placeholder="Nurse name & employee number" />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={!form.nursesNotes || saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save Note"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No nurse notes recorded</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Date & Time</TableHead>
                  <TableHead>Nurses Notes</TableHead>
                  <TableHead className="w-40">Staff Sign & Emp No.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {r.shiftStartTime ? format(new Date(r.shiftStartTime), "dd MMM yyyy HH:mm") : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="max-w-md">{r.nursesNotes || r.observation || "-"}</div>
                    </TableCell>
                    <TableCell className="text-sm">{r.staffSignEmpNo || r.nurseName || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AllergiesTab({ sessionId }: { sessionId: string }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ knownAllergies: "", drugAllergies: "", foodAllergies: "", isolationPrecautions: "", fallRisk: false, pressureUlcerRisk: false });

  const { data: record, refetch } = useQuery<any>({
    queryKey: [`/api/patient-monitoring/allergies/${sessionId}`]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/allergies", data),
    onSuccess: () => { 
      refetch(); 
      toast({ title: "Allergies & Precautions Saved", description: "Record saved successfully" });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save data", variant: "destructive" });
    }
  });

  const handlePrint = () => {
    const content = record ? `
      <h1>ALLERGIES & PRECAUTIONS</h1>
      <h3>Allergy Information</h3>
      <table>
        <tr>
          <td class="label-cell" style="width:30%;">Known Allergies:</td>
          <td style="width:70%;">${record.knownAllergies || 'None reported'}</td>
        </tr>
        <tr>
          <td class="label-cell">Drug Allergies:</td>
          <td>${record.drugAllergies || 'None reported'}</td>
        </tr>
        <tr>
          <td class="label-cell">Food Allergies:</td>
          <td>${record.foodAllergies || 'None reported'}</td>
        </tr>
      </table>
      <h3>Special Precautions</h3>
      <table>
        <tr>
          <td class="label-cell" style="width:30%;">Isolation Precautions:</td>
          <td style="width:70%;">${record.isolationPrecautions || 'None'}</td>
        </tr>
      </table>
      <h3>Risk Assessment</h3>
      <table>
        <tr>
          <td class="label-cell" style="width:30%;">Fall Risk:</td>
          <td style="width:20%;text-align:center;${record.fallRisk ? 'background:#f8d7da;color:red;font-weight:bold;' : ''}">${record.fallRisk ? 'YES' : 'No'}</td>
          <td class="label-cell" style="width:30%;">Pressure Ulcer Risk:</td>
          <td style="width:20%;text-align:center;${record.pressureUlcerRisk ? 'background:#f8d7da;color:red;font-weight:bold;' : ''}">${record.pressureUlcerRisk ? 'YES' : 'No'}</td>
        </tr>
      </table>
      <div class="signature-section">
        <table>
          <tr>
            <td class="label-cell">Recorded By:</td>
            <td class="value-cell"></td>
            <td class="label-cell">Date:</td>
            <td class="value-cell">${format(new Date(), 'dd/MM/yyyy')}</td>
          </tr>
        </table>
      </div>
    ` : `<h1>ALLERGIES & PRECAUTIONS</h1><div class="no-data">No allergy data recorded</div>`;
    openPrintWindow('Allergies', content);
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-lg">Allergies & Precautions</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          {!record && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Details</Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Patient Allergies & Precautions</DialogTitle>
                <DialogDescription>Record patient allergies and special precautions</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div><Label>Known Allergies</Label><Textarea value={form.knownAllergies} onChange={(e) => setForm({...form, knownAllergies: e.target.value})} placeholder="List all known allergies..." /></div>
                <div><Label>Drug Allergies</Label><Textarea value={form.drugAllergies} onChange={(e) => setForm({...form, drugAllergies: e.target.value})} placeholder="List specific drug allergies..." /></div>
                <div><Label>Food Allergies</Label><Input value={form.foodAllergies} onChange={(e) => setForm({...form, foodAllergies: e.target.value})} placeholder="e.g., Peanuts, Shellfish" /></div>
                <div><Label>Isolation Precautions</Label>
                  <Select value={form.isolationPrecautions} onValueChange={(v) => setForm({...form, isolationPrecautions: v})}>
                    <SelectTrigger><SelectValue placeholder="Select if applicable..." /></SelectTrigger>
                    <SelectContent>
                      {["None", "Contact", "Droplet", "Airborne", "Reverse Isolation"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="fallRisk" checked={form.fallRisk} onChange={(e) => setForm({...form, fallRisk: e.target.checked})} />
                    <Label htmlFor="fallRisk">Fall Risk</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="pressureRisk" checked={form.pressureUlcerRisk} onChange={(e) => setForm({...form, pressureUlcerRisk: e.target.checked})} />
                    <Label htmlFor="pressureRisk">Pressure Ulcer Risk</Label>
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button variant="outline" type="button">Cancel</Button>
                </DialogClose>
                <Button 
                  onClick={() => saveMutation.mutate({ 
                    sessionId, 
                    drugAllergies: form.drugAllergies || null,
                    foodAllergies: form.foodAllergies || null,
                    specialPrecautions: form.isolationPrecautions || null,
                    nurseId: "system-nurse",
                    nurseName: "ICU Nurse"
                  })}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!record ? (
          <p className="text-muted-foreground text-center py-8">No allergies/precautions recorded</p>
        ) : (
          <div className="space-y-4">
            {record.knownAllergies && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-600">Known Allergies</h4>
                  <p className="text-sm">{record.knownAllergies}</p>
                </div>
              </div>
            )}
            {record.drugAllergies && (
              <div className="flex items-start gap-2">
                <Pill className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-600">Drug Allergies</h4>
                  <p className="text-sm">{record.drugAllergies}</p>
                </div>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              {record.isolationPrecautions && record.isolationPrecautions !== "None" && (
                <Badge variant="destructive">{record.isolationPrecautions} Isolation</Badge>
              )}
              {record.fallRisk && <Badge variant="destructive">Fall Risk</Badge>}
              {record.pressureUlcerRisk && <Badge variant="destructive">Pressure Ulcer Risk</Badge>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InvestigationChartTab({ sessionId }: { sessionId: string }) {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    investigationDate: new Date().toISOString().split("T")[0],
    bloodGroup: "", hiv: "", hbsag: "", hcv: "",
    hbPcv: "", tlc: "", dlcPlemb: "", esr: "", platelets: "", parasites: "", btCt: "", ptAptt: "",
    bloodSugarFasting: "", ppRandom: "",
    bun: "", srCreatinine: "", srNaKCl: "", srCalPhosMag: "", acidPhosUricAcid: "",
    srBilirubinTotal: "", bilirubinDirectIndirect: "", sgotSgpt: "", srAlkphos: "", srProteinsTotal: "", albumin: "", viralMarkers: "", srAmylaseLipase: "",
    cpkMb: "", srLdh: "", tropi: "",
    totalCholesterol: "", triglycerides: "", hdlLdlVldl: "",
    urineRoutine: "", stoolRoutine: "", sputumExamination: "",
    ecg: "", echo2d: "", usg: "", doppler: "", xrays: "", ctScanMri: "", histopathology: "", fluidAnalysis: "", otherInvestigations: ""
  });

  const { data: investigations = [], refetch } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/sessions", sessionId, "investigation-chart"]
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/patient-monitoring/sessions/${sessionId}/investigation-chart`, data),
    onSuccess: () => {
      refetch();
      setShowAddForm(false);
      setNewEntry({ investigationDate: new Date().toISOString().split("T")[0], bloodGroup: "", hiv: "", hbsag: "", hcv: "", hbPcv: "", tlc: "", dlcPlemb: "", esr: "", platelets: "", parasites: "", btCt: "", ptAptt: "", bloodSugarFasting: "", ppRandom: "", bun: "", srCreatinine: "", srNaKCl: "", srCalPhosMag: "", acidPhosUricAcid: "", srBilirubinTotal: "", bilirubinDirectIndirect: "", sgotSgpt: "", srAlkphos: "", srProteinsTotal: "", albumin: "", viralMarkers: "", srAmylaseLipase: "", cpkMb: "", srLdh: "", tropi: "", totalCholesterol: "", triglycerides: "", hdlLdlVldl: "", urineRoutine: "", stoolRoutine: "", sputumExamination: "", ecg: "", echo2d: "", usg: "", doppler: "", xrays: "", ctScanMri: "", histopathology: "", fluidAnalysis: "", otherInvestigations: "" });
      toast({ title: "Investigation Entry Added" });
    },
  });

  const LAB_SECTIONS = [
    { title: "Screening", fields: [
      { key: "bloodGroup", label: "Blood Group" }, { key: "hiv", label: "HIV" }, { key: "hbsag", label: "HBSAg" }, { key: "hcv", label: "HCV" }
    ]},
    { title: "HAEMATOLOGY", fields: [
      { key: "hbPcv", label: "HB / PCV" }, { key: "tlc", label: "TLC" }, { key: "dlcPlemb", label: "DLC - P/L/E/M/B" }, { key: "esr", label: "ESR" },
      { key: "platelets", label: "PLATELETS" }, { key: "parasites", label: "PARASITES" }, { key: "btCt", label: "BT / CT" }, { key: "ptAptt", label: "PT / APTT" },
      { key: "bloodSugarFasting", label: "BLOOD SUGAR FASTING" }, { key: "ppRandom", label: "PP / RANDOM" }
    ]},
    { title: "RENAL FUNCTION TESTS", fields: [
      { key: "bun", label: "BUN" }, { key: "srCreatinine", label: "SR. CREATININE" }, { key: "srNaKCl", label: "SR. NA / K / CL" },
      { key: "srCalPhosMag", label: "SR. CAL. / PHOS. / MAG." }, { key: "acidPhosUricAcid", label: "ACID PHOS. / URIC ACID" }
    ]},
    { title: "LIVER FUNCTION TESTS", fields: [
      { key: "srBilirubinTotal", label: "SR. BILIRUBIN - TOTAL" }, { key: "bilirubinDirectIndirect", label: "DIRECT / INDIRECT" },
      { key: "sgotSgpt", label: "S.G.O.T. / S.G.P.T." }, { key: "srAlkphos", label: "SR. ALKPHOS." },
      { key: "srProteinsTotal", label: "SR. PROTEINS - TOTAL" }, { key: "albumin", label: "ALBUMIN" },
      { key: "viralMarkers", label: "VIRAL MARKERS" }, { key: "srAmylaseLipase", label: "SR. AMYLASE / LIPASE" }
    ]},
    { title: "CARDIAC ENZYMES", fields: [
      { key: "cpkMb", label: "CPK MB" }, { key: "srLdh", label: "SR. LDH" }, { key: "tropi", label: "TROPI" }
    ]},
    { title: "LIPID PROFILE", fields: [
      { key: "totalCholesterol", label: "TOTAL CHOLESTEROL" }, { key: "triglycerides", label: "TRIGLYCERIDES" }, { key: "hdlLdlVldl", label: "HDL / LDL / VLDL" }
    ]},
    { title: "OTHER TESTS", fields: [
      { key: "urineRoutine", label: "URINE ROUTINE" }, { key: "stoolRoutine", label: "STOOL ROUTINE" }, { key: "sputumExamination", label: "SPUTUM EXAMINATION" }
    ]}
  ];

  const IMAGING_SECTIONS = [
    { title: "IMAGING & DIAGNOSTICS", fields: [
      { key: "ecg", label: "ECG" }, { key: "echo2d", label: "2D ECHO" }, { key: "usg", label: "USG" }, { key: "doppler", label: "DOPPLER" },
      { key: "xrays", label: "X-RAYS" }, { key: "ctScanMri", label: "CT SCAN / MRI" }, { key: "histopathology", label: "HISTOPATHOLOGY" },
      { key: "fluidAnalysis", label: "FLUID ANALYSIS" }, { key: "otherInvestigations", label: "OTHER INVESTIGATIONS" }
    ]}
  ];

  const handlePrint = () => {
    let content = `<h1>IPD INVESTIGATION CHART</h1>`;
    
    if (investigations.length) {
      investigations.forEach((inv: any, invIdx: number) => {
        content += `<h3>Investigation Entry #${invIdx + 1} - ${inv.investigationDate ? format(new Date(inv.investigationDate), 'dd/MM/yyyy') : 'Date Unknown'}</h3>`;
        
        const allSections = [...LAB_SECTIONS, ...IMAGING_SECTIONS];
        allSections.forEach(section => {
          const sectionRows = section.fields.map(f => {
            const val = inv[f.key];
            return val ? `<tr>
              <td class="label-cell">${f.label}:</td>
              <td class="value-cell">${val}</td>
            </tr>` : null;
          }).filter(Boolean).join('');
          
          if (sectionRows) {
            content += `<h4>${section.title}</h4>
              <table>
                <tbody>${sectionRows}</tbody>
              </table>`;
          }
        });
      });
    } else {
      content += '<div class="no-data">No investigation records</div>';
    }
    
    content += `<div class="signature-section">
      <table>
        <tr>
          <td class="label-cell">Ordered By:</td>
          <td class="value-cell"></td>
          <td class="label-cell">Date:</td>
          <td class="value-cell">${format(new Date(), 'dd/MM/yyyy')}</td>
        </tr>
      </table>
    </div>`;
    openPrintWindow('Investigation Chart', content);
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="h-5 w-5" /> Investigation Chart
        </CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} data-testid="button-add-investigation">
            <PlusCircle className="h-4 w-4 mr-1" /> Add Entry
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showAddForm && (
          <Card className="p-4 mb-4 border-dashed">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="w-32">Date</Label>
                <Input type="date" value={newEntry.investigationDate} onChange={e => setNewEntry(prev => ({ ...prev, investigationDate: e.target.value }))} className="w-auto" data-testid="input-investigation-date" />
              </div>
              
              {LAB_SECTIONS.map(section => (
                <div key={section.title}>
                  <h4 className="font-medium text-sm bg-muted p-2 rounded mb-2">{section.title}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {section.fields.map(f => (
                      <div key={f.key} className="space-y-1">
                        <Label className="text-xs">{f.label}</Label>
                        <Input value={(newEntry as any)[f.key]} onChange={e => setNewEntry(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.label} className="h-8 text-sm" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {IMAGING_SECTIONS.map(section => (
                <div key={section.title}>
                  <h4 className="font-medium text-sm bg-muted p-2 rounded mb-2">{section.title}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {section.fields.map(f => (
                      <div key={f.key} className="space-y-1">
                        <Label className="text-xs">{f.label}</Label>
                        <Textarea value={(newEntry as any)[f.key]} onChange={e => setNewEntry(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={`${f.label} findings/report`} className="h-16 text-sm" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button onClick={() => addMutation.mutate({ ...newEntry, investigationDate: new Date(newEntry.investigationDate) })} disabled={addMutation.isPending} data-testid="button-save-investigation">
                  Save Entry
                </Button>
              </div>
            </div>
          </Card>
        )}

        {investigations.length === 0 && !showAddForm ? (
          <p className="text-muted-foreground text-center py-8">No investigation records. Click "Add Entry" to create one.</p>
        ) : (
          <div className="space-y-4">
            {investigations.map((inv: any) => (
              <Card key={inv.id} className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <Badge variant="outline" className="text-sm">{format(new Date(inv.investigationDate), "dd MMM yyyy")}</Badge>
                  <span className="text-xs text-muted-foreground">By: {inv.nurseName || "Staff"}</span>
                </div>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {inv.bloodGroup && <div className="flex gap-2"><Badge>Blood Group: {inv.bloodGroup}</Badge>{inv.hiv && <Badge variant="outline">HIV: {inv.hiv}</Badge>}{inv.hbsag && <Badge variant="outline">HBSAg: {inv.hbsag}</Badge>}{inv.hcv && <Badge variant="outline">HCV: {inv.hcv}</Badge>}</div>}
                    
                    {LAB_SECTIONS.map(section => {
                      const hasData = section.fields.some(f => inv[f.key]);
                      if (!hasData) return null;
                      return (
                        <div key={section.title}>
                          <h5 className="text-xs font-semibold text-muted-foreground mb-1">{section.title}</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            {section.fields.filter(f => inv[f.key]).map(f => (
                              <div key={f.key} className="flex justify-between border-b pb-1">
                                <span className="text-muted-foreground text-xs">{f.label}:</span>
                                <span className="font-medium">{inv[f.key]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {IMAGING_SECTIONS.map(section => {
                      const hasData = section.fields.some(f => inv[f.key]);
                      if (!hasData) return null;
                      return (
                        <div key={section.title}>
                          <h5 className="text-xs font-semibold text-muted-foreground mb-1">{section.title}</h5>
                          <div className="space-y-2">
                            {section.fields.filter(f => inv[f.key]).map(f => (
                              <div key={f.key} className="text-sm">
                                <span className="font-medium">{f.label}:</span>
                                <p className="text-muted-foreground ml-2">{inv[f.key]}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Test categories for diagnostic tests
const TEST_CATEGORIES = {
  PATHOLOGY: {
    label: "Pathology / Lab Tests",
    icon: "beaker",
    color: "purple",
    tests: [
      { name: "Complete Blood Count (CBC)", type: "PATHOLOGY", department: "Pathology" },
      { name: "Comprehensive Metabolic Panel (CMP)", type: "PATHOLOGY", department: "Pathology" },
      { name: "Liver Function Test (LFT)", type: "PATHOLOGY", department: "Pathology" },
      { name: "Renal Function Test (RFT/KFT)", type: "PATHOLOGY", department: "Pathology" },
      { name: "Coagulation Profile (PT/INR/aPTT)", type: "PATHOLOGY", department: "Pathology" },
      { name: "Arterial Blood Gas (ABG)", type: "PATHOLOGY", department: "Pathology" },
      { name: "Blood Culture & Sensitivity", type: "PATHOLOGY", department: "Microbiology" },
      { name: "Urine Culture & Sensitivity", type: "PATHOLOGY", department: "Microbiology" },
      { name: "Procalcitonin (PCT)", type: "PATHOLOGY", department: "Pathology" },
      { name: "C-Reactive Protein (CRP)", type: "PATHOLOGY", department: "Pathology" },
      { name: "D-Dimer", type: "PATHOLOGY", department: "Pathology" },
      { name: "Serum Lactate", type: "PATHOLOGY", department: "Pathology" },
      { name: "Troponin I/T", type: "PATHOLOGY", department: "Pathology" },
      { name: "BNP/NT-proBNP", type: "PATHOLOGY", department: "Pathology" },
      { name: "Thyroid Profile (T3/T4/TSH)", type: "PATHOLOGY", department: "Pathology" },
    ]
  },
  RADIOLOGY: {
    label: "Radiology & Imaging",
    icon: "scan",
    color: "blue",
    tests: [
      // X-RAY - Chest
      { name: "X-Ray Chest PA View", type: "RADIOLOGY", department: "Radiology" },
      { name: "X-Ray Chest AP View", type: "RADIOLOGY", department: "Radiology" },
      { name: "X-Ray Chest Lateral View", type: "RADIOLOGY", department: "Radiology" },
      // X-RAY - Abdomen
      { name: "X-Ray Abdomen Erect", type: "RADIOLOGY", department: "Radiology" },
      { name: "X-Ray Abdomen Supine", type: "RADIOLOGY", department: "Radiology" },
      // X-RAY - Spine
      { name: "X-Ray Cervical Spine", type: "RADIOLOGY", department: "Radiology" },
      { name: "X-Ray Dorsal/Thoracic Spine", type: "RADIOLOGY", department: "Radiology" },
      { name: "X-Ray Lumbar Spine", type: "RADIOLOGY", department: "Radiology" },
      { name: "X-Ray Whole Spine", type: "RADIOLOGY", department: "Radiology" },
      // X-RAY - Limbs & Joints
      { name: "X-Ray Shoulder Joint", type: "RADIOLOGY", department: "Radiology" },
      { name: "X-Ray Elbow Joint", type: "RADIOLOGY", department: "Radiology" },
      { name: "X-Ray Wrist Joint", type: "RADIOLOGY", department: "Radiology" },
      { name: "X-Ray Hand with Fingers", type: "RADIOLOGY", department: "Radiology" },
      { name: "X-Ray Hip Joint", type: "RADIOLOGY", department: "Radiology" },
      { name: "X-Ray Knee Joint", type: "RADIOLOGY", department: "Radiology" },
      { name: "X-Ray Ankle Joint", type: "RADIOLOGY", department: "Radiology" },
      { name: "X-Ray Foot with Toes", type: "RADIOLOGY", department: "Radiology" },
      // X-RAY - Skull & Face
      { name: "X-Ray Skull (AP/Lateral)", type: "RADIOLOGY", department: "Radiology" },
      { name: "X-Ray PNS (Para Nasal Sinuses)", type: "RADIOLOGY", department: "Radiology" },
      { name: "X-Ray Mandible", type: "RADIOLOGY", department: "Radiology" },
      { name: "X-Ray Nasal Bone", type: "RADIOLOGY", department: "Radiology" },
      // X-RAY - Special Studies
      { name: "IVP (Intravenous Pyelogram)", type: "RADIOLOGY", department: "Radiology" },
      { name: "MCU (Micturating Cystourethrogram)", type: "RADIOLOGY", department: "Radiology" },
      { name: "HSG (Hysterosalpingography)", type: "RADIOLOGY", department: "Radiology" },
      { name: "Barium Swallow", type: "RADIOLOGY", department: "Radiology" },
      { name: "Barium Meal Study", type: "RADIOLOGY", department: "Radiology" },
      { name: "Barium Enema", type: "RADIOLOGY", department: "Radiology" },
      { name: "Portable X-Ray (Bedside)", type: "RADIOLOGY", department: "Radiology" },
      // USG - General
      { name: "USG Whole Abdomen", type: "RADIOLOGY", department: "Radiology" },
      { name: "USG Upper Abdomen", type: "RADIOLOGY", department: "Radiology" },
      { name: "USG Lower Abdomen", type: "RADIOLOGY", department: "Radiology" },
      { name: "USG KUB (Kidney Ureter Bladder)", type: "RADIOLOGY", department: "Radiology" },
      { name: "USG Pelvis (Male/Female)", type: "RADIOLOGY", department: "Radiology" },
      // USG - Obstetric & Gynec
      { name: "USG Early Pregnancy (Dating)", type: "RADIOLOGY", department: "Radiology" },
      { name: "USG NT Scan (Nuchal Translucency)", type: "RADIOLOGY", department: "Radiology" },
      { name: "USG Anomaly Scan (Level II)", type: "RADIOLOGY", department: "Radiology" },
      { name: "USG Growth Scan (Level III)", type: "RADIOLOGY", department: "Radiology" },
      { name: "USG Obstetric Doppler", type: "RADIOLOGY", department: "Radiology" },
      { name: "USG TVS (Transvaginal Sonography)", type: "RADIOLOGY", department: "Radiology" },
      // USG - Small Parts
      { name: "USG Thyroid & Neck", type: "RADIOLOGY", department: "Radiology" },
      { name: "USG Breast Bilateral", type: "RADIOLOGY", department: "Radiology" },
      { name: "USG Scrotum & Testes", type: "RADIOLOGY", department: "Radiology" },
      { name: "USG Soft Tissue (Local)", type: "RADIOLOGY", department: "Radiology" },
      // USG - Doppler Studies
      { name: "Carotid Artery Doppler", type: "RADIOLOGY", department: "Radiology" },
      { name: "Venous Doppler - Lower Limb", type: "RADIOLOGY", department: "Radiology" },
      { name: "Venous Doppler - Upper Limb", type: "RADIOLOGY", department: "Radiology" },
      { name: "Arterial Doppler - Lower Limb", type: "RADIOLOGY", department: "Radiology" },
      { name: "Arterial Doppler - Upper Limb", type: "RADIOLOGY", department: "Radiology" },
      { name: "Renal Artery Doppler", type: "RADIOLOGY", department: "Radiology" },
      { name: "Portal Vein Doppler", type: "RADIOLOGY", department: "Radiology" },
      // USG - Interventional
      { name: "USG Guided FNAC", type: "RADIOLOGY", department: "Radiology" },
      { name: "USG Guided Biopsy", type: "RADIOLOGY", department: "Radiology" },
      { name: "USG Guided Drainage", type: "RADIOLOGY", department: "Radiology" },
      { name: "Bedside USG - POCUS", type: "RADIOLOGY", department: "ICU" },
      // CT SCAN - Brain
      { name: "CT Brain Plain", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Brain with Contrast", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Brain Trauma Protocol", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Brain Stroke Protocol", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Brain Angiography (CTA)", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Brain Venography (CTV)", type: "RADIOLOGY", department: "Radiology" },
      // CT SCAN - Head & Neck
      { name: "CT PNS (Para Nasal Sinuses)", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Orbit & Eye", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Temporal Bone", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Neck Soft Tissue", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Neck Angiography", type: "RADIOLOGY", department: "Radiology" },
      // CT SCAN - Chest
      { name: "CT Chest Plain", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Chest with Contrast", type: "RADIOLOGY", department: "Radiology" },
      { name: "HRCT Chest (High Resolution)", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Pulmonary Angiography (CTPA)", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Chest Trauma Protocol", type: "RADIOLOGY", department: "Radiology" },
      // CT SCAN - Abdomen & Pelvis
      { name: "CT Abdomen Plain", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Abdomen with Contrast", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT KUB (Kidney Ureter Bladder)", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Abdomen + Pelvis (Whole)", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Triple Phase Liver", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Pancreas Protocol", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Urography", type: "RADIOLOGY", department: "Radiology" },
      // CT SCAN - Spine
      { name: "CT Cervical Spine", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Dorsal/Thoracic Spine", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Lumbar Spine", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Whole Spine", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Spine Trauma Protocol", type: "RADIOLOGY", department: "Radiology" },
      // CT SCAN - Cardiac & Vascular
      { name: "CT Coronary Angiography", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Aortogram", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Peripheral Angiography", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Renal Angiography", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Mesenteric Angiography", type: "RADIOLOGY", department: "Radiology" },
      // MRI - Brain
      { name: "MRI Brain Plain", type: "RADIOLOGY", department: "Radiology" },
      { name: "MRI Brain with Contrast", type: "RADIOLOGY", department: "Radiology" },
      { name: "MRI Brain Epilepsy Protocol", type: "RADIOLOGY", department: "Radiology" },
      { name: "MRI Brain Stroke Protocol", type: "RADIOLOGY", department: "Radiology" },
      { name: "MRI Brain Tumor Protocol", type: "RADIOLOGY", department: "Radiology" },
      { name: "MRI Brain Angiography (MRA)", type: "RADIOLOGY", department: "Radiology" },
      { name: "MR Venography (MRV)", type: "RADIOLOGY", department: "Radiology" },
      // MRI - Spine
      { name: "MRI Cervical Spine", type: "RADIOLOGY", department: "Radiology" },
      { name: "MRI Dorsal/Thoracic Spine", type: "RADIOLOGY", department: "Radiology" },
      { name: "MRI Lumbar Spine", type: "RADIOLOGY", department: "Radiology" },
      { name: "MRI Whole Spine Screening", type: "RADIOLOGY", department: "Radiology" },
      // MRI - Head & Neck
      { name: "MRI Orbit & Eye", type: "RADIOLOGY", department: "Radiology" },
      { name: "MRI PNS (Para Nasal Sinuses)", type: "RADIOLOGY", department: "Radiology" },
      { name: "MRI Internal Auditory Canal (IAC)", type: "RADIOLOGY", department: "Radiology" },
      { name: "MRI Neck Soft Tissue", type: "RADIOLOGY", department: "Radiology" },
      // MRI - Chest & Abdomen
      { name: "MRI Liver (Hepatobiliary)", type: "RADIOLOGY", department: "Radiology" },
      { name: "MRCP (MR Cholangiopancreatography)", type: "RADIOLOGY", department: "Radiology" },
      { name: "MRI Pancreas", type: "RADIOLOGY", department: "Radiology" },
      { name: "MRI Abdomen", type: "RADIOLOGY", department: "Radiology" },
      { name: "MRI Pelvis", type: "RADIOLOGY", department: "Radiology" },
      // MRI - Musculoskeletal
      { name: "MRI Knee Joint", type: "RADIOLOGY", department: "Radiology" },
      { name: "MRI Shoulder Joint", type: "RADIOLOGY", department: "Radiology" },
      { name: "MRI Ankle Joint", type: "RADIOLOGY", department: "Radiology" },
      { name: "MRI Wrist Joint", type: "RADIOLOGY", department: "Radiology" },
      { name: "MRI Hip Joint", type: "RADIOLOGY", department: "Radiology" },
      { name: "MRI Elbow Joint", type: "RADIOLOGY", department: "Radiology" },
      // MRI - Cardiac & Vascular
      { name: "Cardiac MRI", type: "RADIOLOGY", department: "Cardiology" },
      { name: "MR Angiography - Peripheral", type: "RADIOLOGY", department: "Radiology" },
      { name: "MR Renal Angiography", type: "RADIOLOGY", department: "Radiology" },
      // Special Radiology
      { name: "CT Enterography", type: "RADIOLOGY", department: "Radiology" },
      { name: "MR Enterography", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Fistulogram", type: "RADIOLOGY", department: "Radiology" },
      { name: "MR Fistulogram", type: "RADIOLOGY", department: "Radiology" },
      { name: "PET-CT Scan", type: "RADIOLOGY", department: "Nuclear Medicine" },
      { name: "Bone Densitometry (DEXA Scan)", type: "RADIOLOGY", department: "Radiology" },
      { name: "Mammography (Digital)", type: "RADIOLOGY", department: "Radiology" },
      { name: "2D Echocardiography", type: "RADIOLOGY", department: "Cardiology" },
    ]
  },
  CARDIOLOGY: {
    label: "Cardiology Tests",
    icon: "heart",
    color: "red",
    tests: [
      { name: "12-Lead ECG", type: "CARDIOLOGY", department: "Cardiology" },
      { name: "Cardiac Enzymes", type: "CARDIOLOGY", department: "Pathology" },
      { name: "Stress Test/TMT", type: "CARDIOLOGY", department: "Cardiology" },
      { name: "Holter Monitoring", type: "CARDIOLOGY", department: "Cardiology" },
      { name: "Coronary Angiography", type: "CARDIOLOGY", department: "Cath Lab" },
    ]
  },
  NEURO: {
    label: "Neurological Tests",
    icon: "brain",
    color: "indigo",
    tests: [
      { name: "EEG", type: "NEURO", department: "Neurology" },
      { name: "Nerve Conduction Study (NCS)", type: "NEURO", department: "Neurology" },
      { name: "Lumbar Puncture/CSF Analysis", type: "NEURO", department: "Neurology" },
      { name: "Transcranial Doppler", type: "NEURO", department: "Neurology" },
    ]
  },
  PULMONARY: {
    label: "Pulmonary Tests",
    icon: "wind",
    color: "cyan",
    tests: [
      { name: "Pulmonary Function Test (PFT)", type: "PULMONARY", department: "Pulmonology" },
      { name: "Bronchoscopy", type: "PULMONARY", department: "Pulmonology" },
      { name: "Sputum Culture", type: "PULMONARY", department: "Microbiology" },
      { name: "BAL (Bronchoalveolar Lavage)", type: "PULMONARY", department: "Pulmonology" },
    ]
  },
  BLOOD_BANK: {
    label: "Blood Bank",
    icon: "droplet",
    color: "rose",
    tests: [
      { name: "Blood Grouping & Rh Typing", type: "BLOOD_BANK", department: "Blood Bank" },
      { name: "Cross Match", type: "BLOOD_BANK", department: "Blood Bank" },
      { name: "Coombs Test (Direct/Indirect)", type: "BLOOD_BANK", department: "Blood Bank" },
      { name: "Blood Component Request", type: "BLOOD_BANK", department: "Blood Bank" },
    ]
  },
  DIALYSIS: {
    label: "Dialysis & Renal",
    icon: "filter",
    color: "amber",
    tests: [
      { name: "Hemodialysis", type: "DIALYSIS", department: "Nephrology" },
      { name: "CRRT (Continuous Renal Replacement)", type: "DIALYSIS", department: "ICU" },
      { name: "Peritoneal Dialysis", type: "DIALYSIS", department: "Nephrology" },
      { name: "Dialysis Adequacy (Kt/V)", type: "DIALYSIS", department: "Nephrology" },
    ]
  },
  ENDOSCOPY: {
    label: "Endoscopy & Cath Lab",
    icon: "scan",
    color: "green",
    tests: [
      { name: "Upper GI Endoscopy", type: "ENDOSCOPY", department: "Gastroenterology" },
      { name: "Colonoscopy", type: "ENDOSCOPY", department: "Gastroenterology" },
      { name: "ERCP", type: "ENDOSCOPY", department: "Gastroenterology" },
      { name: "Coronary Angiography", type: "ENDOSCOPY", department: "Cath Lab" },
      { name: "Pacemaker Implantation", type: "ENDOSCOPY", department: "Cath Lab" },
    ]
  }
};

function TestsTab({ sessionId, patientId, patientName, admittingConsultant }: { sessionId: string; patientId: string; patientName: string; admittingConsultant?: string }) {
  const { toast } = useToast();
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [selectedTests, setSelectedTests] = useState<{name: string; type: string; department: string; category: string}[]>([]);
  const [priority, setPriority] = useState("ROUTINE");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [doctorName, setDoctorName] = useState(admittingConsultant || "");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["PATHOLOGY"]);
  const [viewingReport, setViewingReport] = useState<{url: string; testName: string} | null>(null);

  const { data: tests = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/sessions", sessionId, "tests"],
    refetchInterval: 5000,
  });

  const orderTestsMutation = useMutation({
    mutationFn: async (testData: any) => {
      return apiRequest("POST", `/api/patient-monitoring/sessions/${sessionId}/tests`, testData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patient-monitoring/sessions", sessionId, "tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/technician/pending-tests"] });
      setShowOrderDialog(false);
      setSelectedTests([]);
      setClinicalNotes("");
      toast({ title: "Tests ordered successfully" });
    },
    onError: () => {
      toast({ title: "Failed to order tests", variant: "destructive" });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ testId, status }: { testId: string; status: string }) => {
      return apiRequest("PATCH", `/api/diagnostic-test-orders/${testId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patient-monitoring/sessions", sessionId, "tests"] });
      toast({ title: "Test status updated" });
    },
  });

  const handleOrderTests = () => {
    if (!doctorName || selectedTests.length === 0) {
      toast({ title: "Please select tests and enter doctor name", variant: "destructive" });
      return;
    }

    selectedTests.forEach(test => {
      orderTestsMutation.mutate({
        testName: test.name,
        testType: test.type,
        department: test.department,
        category: test.category,
        priority,
        clinicalNotes,
        doctorName,
        patientId,
        patientName,
      });
    });
  };

  const toggleTest = (test: {name: string; type: string; department: string}, category: string) => {
    const exists = selectedTests.find(t => t.name === test.name && t.category === category);
    if (exists) {
      setSelectedTests(selectedTests.filter(t => !(t.name === test.name && t.category === category)));
    } else {
      setSelectedTests([...selectedTests, { ...test, category }]);
    }
  };

  const isTestSelected = (testName: string, category: string) => {
    return selectedTests.some(t => t.name === testName && t.category === category);
  };

  const toggleCategory = (category: string) => {
    if (expandedCategories.includes(category)) {
      setExpandedCategories(expandedCategories.filter(c => c !== category));
    } else {
      setExpandedCategories([...expandedCategories, category]);
    }
  };

  const groupedTests = tests.reduce((acc: Record<string, any[]>, test: any) => {
    const cat = test.category || "PATHOLOGY";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(test);
    return acc;
  }, {});

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending</Badge>;
      case "SAMPLE_COLLECTED":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Sample Collected</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">In Progress</Badge>;
      case "REPORT_UPLOADED":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Report Ready</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handlePrint = () => {
    let content = `<h1>DIAGNOSTIC TESTS ORDER SHEET</h1>`;
    
    if (tests.length) {
      Object.entries(groupedTests).forEach(([category, catTests]) => {
        const catLabel = TEST_CATEGORIES[category as keyof typeof TEST_CATEGORIES]?.label || category;
        content += `<h3>${catLabel}</h3>`;
        const rows = catTests.map((t: any, idx: number) => 
          `<tr>
            <td style="text-align:center;">${idx + 1}</td>
            <td>${t.testName || '-'}</td>
            <td style="text-align:center;">${t.department || '-'}</td>
            <td style="text-align:center;${t.status === 'COMPLETED' ? 'background:#d4edda;' : t.status === 'PENDING' ? 'background:#fff3cd;' : ''}">${t.status || '-'}</td>
            <td>${t.doctorName || '-'}</td>
            <td style="text-align:center;">${t.createdAt ? format(new Date(t.createdAt), 'dd/MM/yyyy') : '-'}</td>
            <td style="text-align:center;">${t.createdAt ? format(new Date(t.createdAt), 'HH:mm') : '-'}</td>
          </tr>`
        ).join('');
        content += `<table>
          <thead>
            <tr>
              <th style="width:40px;">S.No</th>
              <th>Test Name</th>
              <th style="width:120px;">Department</th>
              <th style="width:100px;">Status</th>
              <th style="width:150px;">Ordered By</th>
              <th style="width:100px;">Date</th>
              <th style="width:80px;">Time</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;
      });
      content += `<div class="summary-row" style="padding:8px;background:#f0f0f0;margin:10px 0;">Total Tests Ordered: ${tests.length}</div>`;
    } else {
      content += '<div class="no-data">No tests ordered</div>';
    }
    
    content += `<div class="signature-section">
      <table>
        <tr>
          <td class="label-cell">Ordered By (Doctor):</td>
          <td class="value-cell"></td>
          <td class="label-cell">Date:</td>
          <td class="value-cell">${format(new Date(), 'dd/MM/yyyy')}</td>
        </tr>
      </table>
    </div>`;
    const printContent = content;
    openPrintWindow('Diagnostic Tests', content);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Beaker className="w-5 h-5 text-purple-500" />
          Diagnostic Tests
        </CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-order-test-pm">
                <Plus className="w-4 h-4 mr-1" />
                Order Tests
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Diagnostic Tests - {patientName}</DialogTitle>
              <DialogDescription>Select tests from categories and order them for the patient.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ordering Doctor</Label>
                  <Input 
                    value={doctorName} 
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Dr. Name"
                  />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ROUTINE">Routine</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                      <SelectItem value="STAT">STAT (Emergency)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Select Tests from Multiple Categories</Label>
                <ScrollArea className="h-64 border rounded-md p-2 mt-1">
                  <div className="space-y-2">
                    {Object.entries(TEST_CATEGORIES).map(([categoryKey, category]) => (
                      <div key={categoryKey} className="border rounded-md overflow-hidden">
                        <button
                          type="button"
                          className="w-full flex items-center justify-between p-2 bg-muted/50 hover-elevate text-left"
                          onClick={() => toggleCategory(categoryKey)}
                        >
                          <span className="font-medium text-sm">{category.label}</span>
                          <div className="flex items-center gap-2">
                            {selectedTests.filter(t => t.category === categoryKey).length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {selectedTests.filter(t => t.category === categoryKey).length} selected
                              </Badge>
                            )}
                            {expandedCategories.includes(categoryKey) ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                          </div>
                        </button>
                        {expandedCategories.includes(categoryKey) && (
                          <div className="p-2 space-y-1">
                            {category.tests.map((test) => (
                              <label key={test.name} className="flex items-center gap-2 p-2 rounded hover-elevate cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isTestSelected(test.name, categoryKey)}
                                  onChange={() => toggleTest(test, categoryKey)}
                                  className="rounded"
                                />
                                <span className="text-sm">{test.name}</span>
                                <Badge variant="outline" className="ml-auto text-xs">{test.department}</Badge>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {selectedTests.length > 0 && (
                <div>
                  <Label>Selected Tests ({selectedTests.length})</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTests.map((test, idx) => (
                      <Badge key={`${test.category}-${test.name}-${idx}`} variant="secondary" className="gap-1">
                        {test.name}
                        <span className="text-xs opacity-70">({TEST_CATEGORIES[test.category as keyof typeof TEST_CATEGORIES]?.label.split(' ')[0]})</span>
                        <XCircle 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => setSelectedTests(selectedTests.filter(t => !(t.name === test.name && t.category === test.category)))}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Clinical Notes (Optional)</Label>
                <Textarea 
                  value={clinicalNotes} 
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Add clinical context or special instructions..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowOrderDialog(false)}>Cancel</Button>
                <Button 
                  onClick={handleOrderTests} 
                  disabled={selectedTests.length === 0 || !doctorName || orderTestsMutation.isPending}
                >
                  {orderTestsMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                  Order {selectedTests.length} Test{selectedTests.length !== 1 ? "s" : ""}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : tests.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No diagnostic tests ordered yet</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTests).map(([category, catTests]) => (
              <div key={category}>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">
                  {TEST_CATEGORIES[category as keyof typeof TEST_CATEGORIES]?.label || category}
                </h4>
                <div className="space-y-2">
                  {catTests.map((test: any) => (
                    <div key={test.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{test.testName}</div>
                        <div className="text-xs text-muted-foreground">
                          {test.department} | Ordered: {format(new Date(test.createdAt), "dd MMM yyyy HH:mm")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {test.status === "COMPLETED" && test.reportUrl && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setViewingReport({ url: test.reportUrl, testName: test.testName })}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = test.reportUrl;
                                link.download = test.reportFileName || `${test.testName}_Report.pdf`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          </>
                        )}
                        {getStatusBadge(test.status)}
                        {test.status === "PENDING" && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ testId: test.id, status: "SAMPLE_COLLECTED" })}
                          >
                            Mark Sample Collected
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Report Viewing Dialog */}
        <Dialog open={!!viewingReport} onOpenChange={() => setViewingReport(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Test Report - {viewingReport?.testName}</DialogTitle>
              <DialogDescription>Uploaded test report from the technician</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              {viewingReport?.url && (
                viewingReport.url.startsWith('data:image') ? (
                  <img 
                    src={viewingReport.url} 
                    alt={`Report for ${viewingReport.testName}`}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg border"
                  />
                ) : viewingReport.url.startsWith('data:application/pdf') ? (
                  <embed 
                    src={viewingReport.url}
                    type="application/pdf"
                    className="w-full h-[70vh] rounded-lg border"
                  />
                ) : (
                  <div className="text-center">
                    <p className="mb-4">Unable to preview this file type.</p>
                    <Button onClick={() => window.open(viewingReport.url, '_blank')}>
                      Open in New Tab
                    </Button>
                  </div>
                )
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Care Plan Tab - Comprehensive patient care planning
const REFERRAL_DEPARTMENTS = [
  "Medicine", "Surgery", "Ortho", "Obs & Gynes", "Oncology", "ENT", 
  "Opthalmic", "Neuro", "Pead", "Psychiatry", "Physiotherapy", "Diabetics"
];

function CarePlanTab({ session }: { session: Session }) {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [newConsultantNote, setNewConsultantNote] = useState("");
  const [newNoteDateTime, setNewNoteDateTime] = useState({ date: format(new Date(), "yyyy-MM-dd"), time: format(new Date(), "HH:mm") });
  const [formData, setFormData] = useState({
    provisionalDiagnosis: "",
    carePlanDetails: "",
    treatmentAdvised: "",
    investigationsAdvised: "",
    departmentSpecialty: "",
    treatingConsultantName: session.admittingConsultant || "",
    planTime: format(new Date(), "HH:mm"),
    consultantNotesLog: [] as { dateTime: string; notes: string }[],
  });

  const { data: carePlans = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/care-plan/${session.id}`],
    enabled: !!session.id
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/patient-monitoring/care-plan", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Care Plan created successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/patient-monitoring/care-plan/${session.id}`] });
      resetForm();
      setShowAddForm(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to create care plan", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/patient-monitoring/care-plan/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Care Plan updated successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/patient-monitoring/care-plan/${session.id}`] });
      resetForm();
      setEditingPlan(null);
      setShowAddForm(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update care plan", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      provisionalDiagnosis: "",
      carePlanDetails: "",
      treatmentAdvised: "",
      investigationsAdvised: "",
      departmentSpecialty: "",
      treatingConsultantName: session.admittingConsultant || "",
      planTime: format(new Date(), "HH:mm"),
      consultantNotesLog: [],
    });
    setSelectedDepartments([]);
    setNewConsultantNote("");
    setNewNoteDateTime({ date: format(new Date(), "yyyy-MM-dd"), time: format(new Date(), "HH:mm") });
  };

  const handleSubmit = () => {
    if (!formData.provisionalDiagnosis.trim()) {
      toast({ title: "Validation Error", description: "Provisional Diagnosis is required", variant: "destructive" });
      return;
    }

    const payload = {
      sessionId: session.id,
      patientId: session.patientId,
      patientName: session.patientName,
      uhid: session.uhid,
      age: session.age,
      sex: session.sex,
      ward: session.ward,
      bedNo: session.bedNumber,
      provisionalDiagnosis: formData.provisionalDiagnosis.trim(),
      carePlanDetails: formData.carePlanDetails.trim(),
      treatmentAdvised: formData.treatmentAdvised.trim(),
      investigationsAdvised: formData.investigationsAdvised.trim(),
      referralDepartments: JSON.stringify(selectedDepartments),
      departmentSpecialty: formData.departmentSpecialty.trim(),
      treatingConsultantName: formData.treatingConsultantName.trim(),
      consultantNotesLog: JSON.stringify(formData.consultantNotesLog),
      planTime: formData.planTime,
    };

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    let notesLog: { dateTime: string; notes: string }[] = [];
    try {
      notesLog = JSON.parse(plan.consultantNotesLog || "[]");
    } catch {
      notesLog = [];
    }
    setFormData({
      provisionalDiagnosis: plan.provisionalDiagnosis || "",
      carePlanDetails: plan.carePlanDetails || "",
      treatmentAdvised: plan.treatmentAdvised || "",
      investigationsAdvised: plan.investigationsAdvised || "",
      departmentSpecialty: plan.departmentSpecialty || "",
      treatingConsultantName: plan.treatingConsultantName || "",
      planTime: plan.planTime || format(new Date(), "HH:mm"),
      consultantNotesLog: notesLog,
    });
    try {
      setSelectedDepartments(JSON.parse(plan.referralDepartments || "[]"));
    } catch {
      setSelectedDepartments([]);
    }
    setShowAddForm(true);
  };

  const toggleDepartment = (dept: string) => {
    setSelectedDepartments(prev => 
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  const handlePrint = () => {
    const content = `
      <h1>NURSING ASSESSMENT & CARE PLAN</h1>
      
      <h3>Patient Information</h3>
      <table>
        <tr>
          <td class="label-cell">Patient Name:</td>
          <td class="value-cell">${session.patientName || '-'}</td>
          <td class="label-cell">UHID:</td>
          <td class="value-cell">${session.uhid || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Ward:</td>
          <td class="value-cell">${session.ward || '-'}</td>
          <td class="label-cell">Bed No.:</td>
          <td class="value-cell">${session.bedNumber || '-'}</td>
        </tr>
      </table>
      
      <h3>Care Plan Details</h3>
      ${carePlans.length ? `
        <table>
          <thead>
            <tr>
              <th style="width:40px;">S.No</th>
              <th>Provisional Diagnosis</th>
              <th>Treatment Advised</th>
              <th>Investigations Advised</th>
              <th style="width:120px;">Treating Consultant</th>
              <th style="width:90px;">Date</th>
            </tr>
          </thead>
          <tbody>
            ${carePlans.map((p: any, idx: number) => `
              <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td>${p.provisionalDiagnosis || '-'}</td>
                <td>${p.treatmentAdvised || '-'}</td>
                <td>${p.investigationsAdvised || '-'}</td>
                <td>${p.treatingConsultantName || '-'}</td>
                <td style="text-align:center;">${p.createdAt ? format(new Date(p.createdAt), 'dd/MM/yyyy') : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="summary-row">
              <td colspan="6" style="text-align:right;">Total Care Plans: ${carePlans.length}</td>
            </tr>
          </tfoot>
        </table>
      ` : '<div class="no-data">No care plans created</div>'}
      
      <div class="signature-section">
        <table>
          <tr>
            <td class="label-cell">Nurse Sign:</td>
            <td class="value-cell"></td>
            <td class="label-cell">Consultant Sign:</td>
            <td class="value-cell"></td>
          </tr>
          <tr>
            <td class="label-cell">Date:</td>
            <td class="value-cell">${format(new Date(), 'dd/MM/yyyy')}</td>
            <td class="label-cell">Date:</td>
            <td class="value-cell">${format(new Date(), 'dd/MM/yyyy')}</td>
          </tr>
        </table>
      </div>
    `;
    openPrintWindow('Care Plan', content);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Care Plan
          </CardTitle>
          <CardDescription>
            Comprehensive care plan with treatment, investigations, and referrals
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          {!showAddForm && (
            <Button onClick={() => { resetForm(); setEditingPlan(null); setShowAddForm(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Care Plan
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showAddForm ? (
          <div className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Hospital className="h-4 w-4" />
                Patient Information
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-muted-foreground">Patient:</span> {session.patientName}</div>
                <div><span className="text-muted-foreground">UHID:</span> {session.uhid}</div>
                <div><span className="text-muted-foreground">Age/Sex:</span> {session.age} / {session.sex}</div>
                <div><span className="text-muted-foreground">Ward/Bed:</span> {session.ward} / {session.bedNumber}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Provisional Diagnosis *</Label>
              <Textarea
                value={formData.provisionalDiagnosis}
                onChange={(e) => setFormData(prev => ({ ...prev, provisionalDiagnosis: e.target.value }))}
                placeholder="Patient is under my consultation & has been provisionally diagnosed as..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Care Plan Details</Label>
              <CardDescription className="text-xs">With respect to Curative, Preventive, Promotive, Rehabilitative aspects</CardDescription>
              <Textarea
                value={formData.carePlanDetails}
                onChange={(e) => setFormData(prev => ({ ...prev, carePlanDetails: e.target.value }))}
                placeholder="The management will be as per the following plan of care..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Treatment Advised</Label>
              <Textarea
                value={formData.treatmentAdvised}
                onChange={(e) => setFormData(prev => ({ ...prev, treatmentAdvised: e.target.value }))}
                placeholder="Treatment details..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Investigations Advised</Label>
              <Textarea
                value={formData.investigationsAdvised}
                onChange={(e) => setFormData(prev => ({ ...prev, investigationsAdvised: e.target.value }))}
                placeholder="Investigations to be done..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Refer to Department(s)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-muted/30 rounded-lg">
                {REFERRAL_DEPARTMENTS.map(dept => (
                  <div key={dept} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`dept-${dept}`}
                      checked={selectedDepartments.includes(dept)}
                      onChange={() => toggleDepartment(dept)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor={`dept-${dept}`} className="text-sm cursor-pointer">{dept}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-medium">Consultant Notes</Label>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[200px] border-r">Date & Time</TableHead>
                      <TableHead>Consultant Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.consultantNotesLog.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-4 text-muted-foreground text-sm">
                          No consultant notes added yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      formData.consultantNotesLog.map((note, index) => (
                        <TableRow key={index}>
                          <TableCell className="border-r text-sm">{note.dateTime}</TableCell>
                          <TableCell className="text-sm whitespace-pre-wrap">{note.notes}</TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow>
                      <TableCell className="border-r p-2">
                        <div className="flex gap-1">
                          <Input
                            type="date"
                            value={newNoteDateTime.date}
                            onChange={(e) => setNewNoteDateTime(prev => ({ ...prev, date: e.target.value }))}
                            className="h-8 text-sm"
                          />
                          <Input
                            type="time"
                            value={newNoteDateTime.time}
                            onChange={(e) => setNewNoteDateTime(prev => ({ ...prev, time: e.target.value }))}
                            className="h-8 text-sm w-24"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="flex gap-2">
                          <Input
                            value={newConsultantNote}
                            onChange={(e) => setNewConsultantNote(e.target.value)}
                            placeholder="Enter consultant notes..."
                            className="h-8 text-sm flex-1"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (newConsultantNote.trim()) {
                                const dateTime = `${newNoteDateTime.date} ${newNoteDateTime.time}`;
                                setFormData(prev => ({
                                  ...prev,
                                  consultantNotesLog: [...prev.consultantNotesLog, { dateTime, notes: newConsultantNote.trim() }]
                                }));
                                setNewConsultantNote("");
                                setNewNoteDateTime({ date: format(new Date(), "yyyy-MM-dd"), time: format(new Date(), "HH:mm") });
                              }
                            }}
                            className="h-8"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department / Specialty</Label>
                <Input
                  value={formData.departmentSpecialty}
                  onChange={(e) => setFormData(prev => ({ ...prev, departmentSpecialty: e.target.value }))}
                  placeholder="Specialty details..."
                />
              </div>
              <div className="space-y-2">
                <Label>Treating Consultant</Label>
                <Input
                  value={formData.treatingConsultantName}
                  onChange={(e) => setFormData(prev => ({ ...prev, treatingConsultantName: e.target.value }))}
                  placeholder="Dr. Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={format(new Date(), "yyyy-MM-dd")} disabled />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={formData.planTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, planTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => { setShowAddForm(false); setEditingPlan(null); }}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingPlan ? "Update Care Plan" : "Save Care Plan"}
              </Button>
            </div>
          </div>
        ) : carePlans.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No care plans created yet</p>
            <p className="text-sm">Click "New Care Plan" to create one</p>
          </div>
        ) : (
          <div className="space-y-6">
            {carePlans.map((plan: any) => {
              let referralDepts: string[] = [];
              try { referralDepts = JSON.parse(plan.referralDepartments || "[]"); } catch {}
              
              return (
                <Card key={plan.id} className="border">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Care Plan - {plan.planDate ? format(new Date(plan.planDate), "dd MMM yyyy") : "N/A"}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{plan.planTime || ""}</Badge>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(plan)}>
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {plan.provisionalDiagnosis && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Provisional Diagnosis</Label>
                        <p className="text-sm mt-1">{plan.provisionalDiagnosis}</p>
                      </div>
                    )}
                    {plan.carePlanDetails && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Care Plan (Curative, Preventive, Promotive, Rehabilitative)</Label>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{plan.carePlanDetails}</p>
                      </div>
                    )}
                    {plan.treatmentAdvised && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Treatment Advised</Label>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{plan.treatmentAdvised}</p>
                      </div>
                    )}
                    {plan.investigationsAdvised && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Investigations Advised</Label>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{plan.investigationsAdvised}</p>
                      </div>
                    )}
                    {referralDepts.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Referral Departments</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {referralDepts.map(dept => (
                            <Badge key={dept} variant="secondary" className="text-xs">{dept}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-4 pt-2 border-t">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Consultant:</span> {plan.treatingConsultantName || "N/A"}
                      </div>
                      {plan.departmentSpecialty && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Specialty:</span> {plan.departmentSpecialty}
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-sm font-medium mb-3 block">Consultant Notes</Label>
                      <ConsultantNotesDisplay consultantNotesLog={plan.consultantNotesLog} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConsultantNotesDisplay({ consultantNotesLog }: { consultantNotesLog?: string | null }) {
  const notes: { dateTime: string; notes: string }[] = (() => {
    if (!consultantNotesLog) return [];
    try {
      return JSON.parse(consultantNotesLog);
    } catch {
      return [];
    }
  })();

  if (notes.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No consultant notes yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Date & Time</TableHead>
            <TableHead>Consultant Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notes.map((note, index) => (
            <TableRow key={index}>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {note.dateTime}
              </TableCell>
              <TableCell className="text-sm whitespace-pre-wrap">{note.notes}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ========== IPD INITIAL ASSESSMENT FORM TAB ==========
const PAIN_SCORES = [
  { value: 0, label: "No Hurt" },
  { value: 2, label: "Hurts Little Bit" },
  { value: 4, label: "Hurts Little More" },
  { value: 6, label: "Hurts Even More" },
  { value: 8, label: "Hurts Whole Lot" },
  { value: 10, label: "Hurts Worst" },
];

const GCS_EYE = [
  { value: 4, label: "Spontaneous" },
  { value: 3, label: "To Speech" },
  { value: 2, label: "To Pain" },
  { value: 1, label: "No Response" },
];

const GCS_MOTOR = [
  { value: 6, label: "Spontaneous Movements" },
  { value: 5, label: "Localizes to pain" },
  { value: 4, label: "Withdraws to pain" },
  { value: 3, label: "Flexion to pain" },
  { value: 2, label: "Extension to pain" },
  { value: 1, label: "No Motor Response" },
];

const GCS_VERBAL = [
  { value: 5, label: "Normal Verbal Output" },
  { value: 4, label: "Confused" },
  { value: 3, label: "Inappropriate words" },
  { value: 2, label: "Incomprehensible sounds" },
  { value: 1, label: "No Verbal Response" },
];

const INVESTIGATIONS_LIST = [
  { key: "cbc", label: "CBC" },
  { key: "esr", label: "ESR" },
  { key: "urineRM", label: "URINE R/M" },
  { key: "rft", label: "RFT" },
  { key: "lft", label: "LFT" },
  { key: "rbsTest", label: "RBS" },
  { key: "fbs", label: "FBS" },
  { key: "ppbs", label: "PPBS" },
  { key: "electrolyte", label: "S. ELECTROLYTE" },
  { key: "lipidProfile", label: "LIPID PROFILE" },
  { key: "bloodCS", label: "BLOOD C/S" },
  { key: "urineCS", label: "URINE C/S" },
  { key: "hbsAg", label: "Hbs AG" },
  { key: "hiv", label: "HIV" },
  { key: "tsh", label: "TSH" },
  { key: "t3t4", label: "T3, T4" },
  { key: "hba1c", label: "HBA 1c" },
  { key: "sCreatinine", label: "S. CREATININE" },
];

function InitialAssessmentTab({ session }: { session: Session }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(1);
  
  const sectionTabs = [
    { id: 1, label: "1. General Info" },
    { id: 2, label: "2. Medical History" },
    { id: 3, label: "3. Examination" },
    { id: 4, label: "4. Diagnosis" },
  ];
  
  const defaultFormData = {
    patientReceivedDate: format(new Date(), "yyyy-MM-dd"),
    patientReceivedTime: format(new Date(), "HH:mm"),
    patientAccompaniedBy: "Relatives",
    contactNo: "",
    allergies: "No",
    allergiesDetails: "",
    vulnerable: "No",
    vulnerableDetails: "",
    previousAdmission: "No",
    previousAdmissionUnderWhom: "",
    mlcDone: "No",
    mlcNo: "",
    painScore: 0,
    complaintsHistory: JSON.stringify([{ complaint: "", originDuration: "" }]),
    hypertension: "No", hypertensionSince: "",
    diabetes: "No", diabetesSince: "",
    coronaryArteryDisease: "No", coronaryArteryDiseaseSince: "",
    cerebroVascularDisease: "No", cerebroVascularDiseaseSince: "",
    copdBronchialAsthma: "No", copdBronchialAsthmaSince: "",
    tuberculosis: "No", tuberculosisSince: "",
    otherMedicalIllness: "", otherMedicalIllnessSince: "",
    surgicalHistory: JSON.stringify([{ procedure: "", when: "", complications: "" }]),
    surgicalHistoryNote: "",
    smoking: "No", alcohol: "No", tobaccoChewing: "No", dietType: "Veg", otherAddictions: "",
    familyHypertension: "No", familyDiabetes: "No", familyIhd: "No", familyCva: "No",
    familyCopdAsthma: "No", familyTuberculosis: "No", familyOtherSpecify: "",
    menstrualCycle: "Regular", gpla: "", lmp: "", tubectomy: "Not Done", edd: "", menarcheAge: "",
    gcsEyeOpening: 4, gcsMotorResponse: 6, gcsVerbalResponse: 5,
    conscious: true, oriented: true, disoriented: false,
    pulseRate: "", bloodPressure: "", respiratoryRate: "", rbs: "", temperature: "",
    weight: "", height: "", bmi: "",
    pallor: "No", icterus: "No", cyanosis: "No", clubbing: "No",
    lymphadinopathy: "No", oedema: "No", jvp: "No", heent: "",
    cvs: "", rs: "", pa: "", cns: "", localExamination: "",
    rectalExamination: "", rectalExaminationStatus: "Not Indicated",
    breastExamination: "", breastExaminationStatus: "Not Indicated",
    pelvicExamination: "", pelvicExaminationStatus: "Not Indicated",
    woundExamination: "", woundExaminationStatus: "Not Indicated",
    investigationsAdvised: JSON.stringify({}),
    investigationsOthers: "",
    provisionalDiagnosis: "",
    treatment: "",
    clinicalAssistantName: "",
    clinicalAssistantDate: format(new Date(), "yyyy-MM-dd"),
    clinicalAssistantTime: format(new Date(), "HH:mm"),
    inchargeConsultantName: session.admittingConsultant || "",
    inchargeConsultantDate: format(new Date(), "yyyy-MM-dd"),
    inchargeConsultantTime: format(new Date(), "HH:mm"),
  };

  const [formData, setFormData] = useState(defaultFormData);

  const { data: assessments = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/initial-assessment/${session.id}`],
    enabled: !!session.id
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/patient-monitoring/initial-assessment", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Initial Assessment saved successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/patient-monitoring/initial-assessment/${session.id}`] });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/patient-monitoring/initial-assessment/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Initial Assessment updated successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/patient-monitoring/initial-assessment/${session.id}`] });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setShowForm(false);
    setEditingId(null);
    setActiveSection(1);
  };

  const handleEdit = (assessment: any) => {
    setFormData({
      ...defaultFormData,
      ...assessment,
      patientReceivedDate: assessment.patientReceivedDate ? format(new Date(assessment.patientReceivedDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      clinicalAssistantDate: assessment.clinicalAssistantDate ? format(new Date(assessment.clinicalAssistantDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      inchargeConsultantDate: assessment.inchargeConsultantDate ? format(new Date(assessment.inchargeConsultantDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    });
    setEditingId(assessment.id);
    setActiveSection(1);
    setShowForm(true);
  };

  const handleSubmit = () => {
    const payload = {
      ...formData,
      sessionId: session.id,
      patientId: session.patientId,
      patientName: session.patientName,
      uhid: session.uhid,
      age: session.age,
      sex: session.sex,
      ipdNo: session.ipdNo,
      ward: session.ward,
      bedNo: session.bedNo,
      gcsTotal: (formData.gcsEyeOpening || 0) + (formData.gcsMotorResponse || 0) + (formData.gcsVerbalResponse || 0),
      patientReceivedDate: formData.patientReceivedDate ? new Date(formData.patientReceivedDate) : null,
      clinicalAssistantDate: formData.clinicalAssistantDate ? new Date(formData.clinicalAssistantDate) : null,
      inchargeConsultantDate: formData.inchargeConsultantDate ? new Date(formData.inchargeConsultantDate) : null,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getComplaints = (): { complaint: string; originDuration: string }[] => {
    try {
      return JSON.parse(formData.complaintsHistory || "[]");
    } catch { return [{ complaint: "", originDuration: "" }]; }
  };

  const setComplaints = (complaints: { complaint: string; originDuration: string }[]) => {
    updateField("complaintsHistory", JSON.stringify(complaints));
  };

  const getSurgicalHistory = (): { procedure: string; when: string; complications: string }[] => {
    try {
      return JSON.parse(formData.surgicalHistory || "[]");
    } catch { return [{ procedure: "", when: "", complications: "" }]; }
  };

  const setSurgicalHistory = (history: { procedure: string; when: string; complications: string }[]) => {
    updateField("surgicalHistory", JSON.stringify(history));
  };

  const getInvestigations = (): Record<string, boolean> => {
    try {
      return JSON.parse(formData.investigationsAdvised || "{}");
    } catch { return {}; }
  };

  const setInvestigation = (key: string, value: boolean) => {
    const inv = getInvestigations();
    inv[key] = value;
    updateField("investigationsAdvised", JSON.stringify(inv));
  };

  const handlePrint = () => {
    const a = assessments[0];
    if (!a) {
      openPrintWindow('Initial Assessment', '<h1>IPD INITIAL ASSESSMENT FORM</h1><div class="no-data">No assessment recorded</div>');
      return;
    }
    
    const parseJsonSafe = (str: string) => { try { return JSON.parse(str || '[]'); } catch { return []; } };
    const complaints = parseJsonSafe(a.complaintsHistory);
    const surgicalHist = parseJsonSafe(a.surgicalHistory);
    const gcsTotal = (a.gcsEyeOpening || 0) + (a.gcsMotorResponse || 0) + (a.gcsVerbalResponse || 0);
    
    const content = `
      <h1>IPD INITIAL ASSESSMENT FORM</h1>
      
      <h3>1. General Information</h3>
      <table>
        <tr>
          <td class="label-cell">Patient Received Date:</td>
          <td class="value-cell">${a.patientReceivedDate ? format(new Date(a.patientReceivedDate), 'dd/MM/yyyy') : '-'}</td>
          <td class="label-cell">Time:</td>
          <td class="value-cell">${a.patientReceivedTime || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Mode of Arrival:</td>
          <td class="value-cell">${a.modeOfArrival || '-'}</td>
          <td class="label-cell">Referred By:</td>
          <td class="value-cell">${a.referredBy || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Accompanied By:</td>
          <td class="value-cell">${a.patientAccompaniedBy || '-'}</td>
          <td class="label-cell">Contact No:</td>
          <td class="value-cell">${a.contactNo || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Allergies:</td>
          <td class="value-cell">${a.allergies || '-'} ${a.allergiesDetails ? `(${a.allergiesDetails})` : ''}</td>
          <td class="label-cell">Vulnerable:</td>
          <td class="value-cell">${a.vulnerable || '-'} ${a.vulnerableDetails ? `(${a.vulnerableDetails})` : ''}</td>
        </tr>
      </table>
      
      <h4>Chief Complaints</h4>
      ${complaints.length ? `<table>
        <thead><tr><th style="width:40px;">S.No</th><th>Complaint</th><th style="width:150px;">Duration</th></tr></thead>
        <tbody>${complaints.map((c: any, i: number) => `<tr><td style="text-align:center;">${i+1}</td><td>${c.complaint || '-'}</td><td style="text-align:center;">${c.originDuration || '-'}</td></tr>`).join('')}</tbody>
      </table>` : '<p style="color:#666;">No complaints recorded</p>'}
      
      <h3>2. Medical History</h3>
      <table>
        <tr>
          <td class="label-cell" style="width:25%;">Hypertension:</td>
          <td class="value-cell" style="width:25%;">${a.hypertension || '-'} ${a.hypertensionSince ? `(Since: ${a.hypertensionSince})` : ''}</td>
          <td class="label-cell" style="width:25%;">Diabetes:</td>
          <td class="value-cell" style="width:25%;">${a.diabetes || '-'} ${a.diabetesSince ? `(Since: ${a.diabetesSince})` : ''}</td>
        </tr>
        <tr>
          <td class="label-cell">CAD:</td>
          <td class="value-cell">${a.coronaryArteryDisease || '-'}</td>
          <td class="label-cell">CVD:</td>
          <td class="value-cell">${a.cerebroVascularDisease || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">COPD/Asthma:</td>
          <td class="value-cell">${a.copdAsthma || '-'}</td>
          <td class="label-cell">Thyroid:</td>
          <td class="value-cell">${a.thyroidDisorder || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Kidney Disease:</td>
          <td class="value-cell">${a.kidneyDisease || '-'}</td>
          <td class="label-cell">Liver Disease:</td>
          <td class="value-cell">${a.liverDisease || '-'}</td>
        </tr>
      </table>
      
      <h4>Surgical History</h4>
      ${surgicalHist.length ? `<table>
        <thead><tr><th style="width:40px;">S.No</th><th>Procedure</th><th style="width:120px;">When</th><th>Complications</th></tr></thead>
        <tbody>${surgicalHist.map((s: any, i: number) => `<tr><td style="text-align:center;">${i+1}</td><td>${s.procedure || '-'}</td><td style="text-align:center;">${s.when || '-'}</td><td>${s.complications || '-'}</td></tr>`).join('')}</tbody>
      </table>` : '<p style="color:#666;">No surgical history</p>'}
      
      <h3>3. Examination</h3>
      <h4>Glasgow Coma Scale (GCS)</h4>
      <table>
        <tr>
          <td class="label-cell">Eye Opening:</td>
          <td class="value-cell" style="text-align:center;">${a.gcsEyeOpening || '-'}/4</td>
          <td class="label-cell">Motor Response:</td>
          <td class="value-cell" style="text-align:center;">${a.gcsMotorResponse || '-'}/6</td>
          <td class="label-cell">Verbal Response:</td>
          <td class="value-cell" style="text-align:center;">${a.gcsVerbalResponse || '-'}/5</td>
        </tr>
        <tr>
          <td colspan="6" style="text-align:center;font-weight:bold;background:#f0f0f0;">TOTAL GCS SCORE: ${gcsTotal}/15</td>
        </tr>
      </table>
      
      <h4>Vital Signs</h4>
      <table>
        <tr>
          <td class="label-cell">Pulse Rate:</td>
          <td class="value-cell">${a.pulseRate || '-'} bpm</td>
          <td class="label-cell">Blood Pressure:</td>
          <td class="value-cell">${a.bloodPressure || '-'} mmHg</td>
          <td class="label-cell">Temperature:</td>
          <td class="value-cell">${a.temperature || '-'} °F</td>
        </tr>
        <tr>
          <td class="label-cell">Respiratory Rate:</td>
          <td class="value-cell">${a.respiratoryRate || '-'} /min</td>
          <td class="label-cell">SpO2:</td>
          <td class="value-cell">${a.spo2 || '-'} %</td>
          <td class="label-cell">Weight:</td>
          <td class="value-cell">${a.weight || '-'} kg</td>
        </tr>
        <tr>
          <td class="label-cell">Height:</td>
          <td class="value-cell">${a.height || '-'} cm</td>
          <td class="label-cell">BMI:</td>
          <td class="value-cell">${a.bmi || '-'} kg/m²</td>
          <td colspan="2"></td>
        </tr>
      </table>
      
      <h3>4. Diagnosis & Plan</h3>
      <table>
        <tr>
          <td class="label-cell" style="width:30%;">Provisional Diagnosis:</td>
          <td style="width:70%;">${a.provisionalDiagnosis || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Final Diagnosis:</td>
          <td>${a.finalDiagnosis || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Treatment Plan:</td>
          <td>${a.treatmentPlan || '-'}</td>
        </tr>
      </table>
      
      <div class="signature-section">
        <table>
          <tr>
            <td class="label-cell">Clinical Assistant:</td>
            <td class="value-cell">${a.clinicalAssistantName || ''}</td>
            <td class="label-cell">Date:</td>
            <td class="value-cell">${a.clinicalAssistantDate ? format(new Date(a.clinicalAssistantDate), 'dd/MM/yyyy') : '-'}</td>
          </tr>
          <tr>
            <td class="label-cell">Incharge Consultant:</td>
            <td class="value-cell">${a.inchargeConsultantName || ''}</td>
            <td class="label-cell">Date:</td>
            <td class="value-cell">${a.inchargeConsultantDate ? format(new Date(a.inchargeConsultantDate), 'dd/MM/yyyy') : '-'}</td>
          </tr>
        </table>
      </div>
    `;
    openPrintWindow('Initial Assessment', content);
  };

  if (isLoading) return <div className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5" />
            IPD Initial Assessment Form
          </CardTitle>
          <p className="text-sm text-muted-foreground">Comprehensive assessment on admission</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          {!showForm && (
            <Button onClick={() => { setFormData(defaultFormData); setEditingId(null); setActiveSection(1); setShowForm(true); }} className="gap-1">
              <Plus className="h-4 w-4" /> New Assessment
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showForm ? (
          <div className="space-y-4">
            {/* Section Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {sectionTabs.map(tab => (
                <Button
                  key={tab.id}
                  size="sm"
                  variant={activeSection === tab.id ? "default" : "outline"}
                  onClick={() => setActiveSection(tab.id)}
                  className="text-xs"
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Section 1: General Info */}
            {activeSection === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-base border-b pb-2">General Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><Label>Patient Received Date</Label><Input type="date" value={formData.patientReceivedDate} onChange={(e) => updateField("patientReceivedDate", e.target.value)} /></div>
                  <div><Label>Time</Label><Input type="time" value={formData.patientReceivedTime} onChange={(e) => updateField("patientReceivedTime", e.target.value)} /></div>
                  <div><Label>Accompanied By</Label>
                    <Select value={formData.patientAccompaniedBy} onValueChange={(v) => updateField("patientAccompaniedBy", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Relatives">Relatives</SelectItem>
                        <SelectItem value="Self">Self</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Contact No.</Label><Input value={formData.contactNo} onChange={(e) => updateField("contactNo", e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-3">
                    <Label>Allergies:</Label>
                    <div className="flex gap-2">{["Yes", "No"].map(v => (<label key={v} className="flex items-center gap-1"><input type="radio" checked={formData.allergies === v} onChange={() => updateField("allergies", v)} />{v}</label>))}</div>
                  </div>
                  {formData.allergies === "Yes" && <div><Label>Details</Label><Input value={formData.allergiesDetails} onChange={(e) => updateField("allergiesDetails", e.target.value)} /></div>}
                  <div className="flex items-center gap-3">
                    <Label>Vulnerable:</Label>
                    <div className="flex gap-2">{["Yes", "No"].map(v => (<label key={v} className="flex items-center gap-1"><input type="radio" checked={formData.vulnerable === v} onChange={() => updateField("vulnerable", v)} />{v}</label>))}</div>
                  </div>
                  {formData.vulnerable === "Yes" && <div><Label>Details</Label><Input value={formData.vulnerableDetails} onChange={(e) => updateField("vulnerableDetails", e.target.value)} /></div>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-3">
                    <Label>Previous Admission:</Label>
                    <div className="flex gap-2">{["Yes", "No"].map(v => (<label key={v} className="flex items-center gap-1"><input type="radio" checked={formData.previousAdmission === v} onChange={() => updateField("previousAdmission", v)} />{v}</label>))}</div>
                  </div>
                  {formData.previousAdmission === "Yes" && <div><Label>Under Whom</Label><Input value={formData.previousAdmissionUnderWhom} onChange={(e) => updateField("previousAdmissionUnderWhom", e.target.value)} /></div>}
                  <div className="flex items-center gap-3">
                    <Label>MLC Done:</Label>
                    <div className="flex gap-2">{["Yes", "No"].map(v => (<label key={v} className="flex items-center gap-1"><input type="radio" checked={formData.mlcDone === v} onChange={() => updateField("mlcDone", v)} />{v}</label>))}</div>
                  </div>
                  {formData.mlcDone === "Yes" && <div><Label>MLC No.</Label><Input value={formData.mlcNo} onChange={(e) => updateField("mlcNo", e.target.value)} /></div>}
                </div>
                <div>
                  <Label className="mb-2 block">Pain Score (0-10)</Label>
                  <div className="flex flex-wrap gap-2">
                    {PAIN_SCORES.map(ps => (
                      <Button key={ps.value} size="sm" variant={formData.painScore === ps.value ? "default" : "outline"} onClick={() => updateField("painScore", ps.value)}>
                        {ps.value} - {ps.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <h3 className="font-semibold text-base border-b pb-2 mt-6">Complaints & History of Present Illness</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Complaint</TableHead>
                      <TableHead>Origin / Duration</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getComplaints().map((c, i) => (
                      <TableRow key={i}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell><Input value={c.complaint} onChange={(e) => { const arr = [...getComplaints()]; arr[i].complaint = e.target.value; setComplaints(arr); }} /></TableCell>
                        <TableCell><Input value={c.originDuration} onChange={(e) => { const arr = [...getComplaints()]; arr[i].originDuration = e.target.value; setComplaints(arr); }} /></TableCell>
                        <TableCell><Button size="icon" variant="ghost" onClick={() => { const arr = getComplaints().filter((_, idx) => idx !== i); setComplaints(arr.length ? arr : [{ complaint: "", originDuration: "" }]); }}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button size="sm" variant="outline" onClick={() => setComplaints([...getComplaints(), { complaint: "", originDuration: "" }])} className="mt-2"><Plus className="h-4 w-4 mr-1" />Add Row</Button>
              </div>
            )}

            {/* Section 2: Medical History */}
            {activeSection === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-base border-b pb-2">Medical History</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Particulars</TableHead>
                      <TableHead className="w-32">Status</TableHead>
                      <TableHead>Since When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { label: "Hypertension", field: "hypertension", sinceField: "hypertensionSince" },
                      { label: "Diabetes", field: "diabetes", sinceField: "diabetesSince" },
                      { label: "Coronary Artery Disease", field: "coronaryArteryDisease", sinceField: "coronaryArteryDiseaseSince" },
                      { label: "Cerebro Vascular Disease", field: "cerebroVascularDisease", sinceField: "cerebroVascularDiseaseSince" },
                      { label: "COPD / Bronchial Asthma", field: "copdBronchialAsthma", sinceField: "copdBronchialAsthmaSince" },
                      { label: "Tuberculosis", field: "tuberculosis", sinceField: "tuberculosisSince" },
                    ].map(item => (
                      <TableRow key={item.field}>
                        <TableCell>{item.label}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">{["Yes", "No"].map(v => (<label key={v} className="flex items-center gap-1"><input type="radio" checked={(formData as any)[item.field] === v} onChange={() => updateField(item.field, v)} />{v}</label>))}</div>
                        </TableCell>
                        <TableCell><Input value={(formData as any)[item.sinceField]} onChange={(e) => updateField(item.sinceField, e.target.value)} placeholder="e.g., 5 years" /></TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell><Input value={formData.otherMedicalIllness} onChange={(e) => updateField("otherMedicalIllness", e.target.value)} placeholder="Any Other (Significant Medical Illness)" /></TableCell>
                      <TableCell></TableCell>
                      <TableCell><Input value={formData.otherMedicalIllnessSince} onChange={(e) => updateField("otherMedicalIllnessSince", e.target.value)} /></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <h3 className="font-semibold text-base border-b pb-2 mt-6">Surgical History</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Name of Surgical Procedure</TableHead>
                      <TableHead>Undergone When</TableHead>
                      <TableHead>Any Complications</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getSurgicalHistory().map((s, i) => (
                      <TableRow key={i}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell><Input value={s.procedure} onChange={(e) => { const arr = [...getSurgicalHistory()]; arr[i].procedure = e.target.value; setSurgicalHistory(arr); }} /></TableCell>
                        <TableCell><Input value={s.when} onChange={(e) => { const arr = [...getSurgicalHistory()]; arr[i].when = e.target.value; setSurgicalHistory(arr); }} /></TableCell>
                        <TableCell><Input value={s.complications} onChange={(e) => { const arr = [...getSurgicalHistory()]; arr[i].complications = e.target.value; setSurgicalHistory(arr); }} /></TableCell>
                        <TableCell><Button size="icon" variant="ghost" onClick={() => { const arr = getSurgicalHistory().filter((_, idx) => idx !== i); setSurgicalHistory(arr.length ? arr : [{ procedure: "", when: "", complications: "" }]); }}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button size="sm" variant="outline" onClick={() => setSurgicalHistory([...getSurgicalHistory(), { procedure: "", when: "", complications: "" }])} className="mt-2"><Plus className="h-4 w-4 mr-1" />Add Row</Button>
                <div className="mt-3">
                  <Label>Note (In case of complication please mention the place of surgery)</Label>
                  <Textarea value={formData.surgicalHistoryNote} onChange={(e) => updateField("surgicalHistoryNote", e.target.value)} rows={2} />
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div>
                    <h3 className="font-semibold text-base border-b pb-2 mb-3">Personal History</h3>
                    <div className="space-y-3">
                      {[
                        { label: "Smoking", field: "smoking" },
                        { label: "Alcohol", field: "alcohol" },
                        { label: "Tobacco Chewing", field: "tobaccoChewing" },
                      ].map(item => (
                        <div key={item.field} className="flex items-center justify-between">
                          <Label>{item.label}</Label>
                          <div className="flex gap-2">{["Yes", "No"].map(v => (<label key={v} className="flex items-center gap-1"><input type="radio" checked={(formData as any)[item.field] === v} onChange={() => updateField(item.field, v)} />{v}</label>))}</div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between">
                        <Label>Diet</Label>
                        <div className="flex gap-2">{["Veg", "Non-veg"].map(v => (<label key={v} className="flex items-center gap-1"><input type="radio" checked={formData.dietType === v} onChange={() => updateField("dietType", v)} />{v}</label>))}</div>
                      </div>
                      <div><Label>Other Addictions</Label><Input value={formData.otherAddictions} onChange={(e) => updateField("otherAddictions", e.target.value)} /></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base border-b pb-2 mb-3">Family History</h3>
                    <div className="space-y-3">
                      {[
                        { label: "Hypertension", field: "familyHypertension" },
                        { label: "Diabetes", field: "familyDiabetes" },
                        { label: "IHD", field: "familyIhd" },
                        { label: "CVA", field: "familyCva" },
                        { label: "COPD/B Asthma", field: "familyCopdAsthma" },
                        { label: "Tuberculosis", field: "familyTuberculosis" },
                      ].map(item => (
                        <div key={item.field} className="flex items-center justify-between">
                          <Label>{item.label}</Label>
                          <div className="flex gap-2">{["Yes", "No"].map(v => (<label key={v} className="flex items-center gap-1"><input type="radio" checked={(formData as any)[item.field] === v} onChange={() => updateField(item.field, v)} />{v}</label>))}</div>
                        </div>
                      ))}
                      <div><Label>Other Specify</Label><Input value={formData.familyOtherSpecify} onChange={(e) => updateField("familyOtherSpecify", e.target.value)} /></div>
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold text-base border-b pb-2 mt-6">Menstrual History & Obstetric History</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div><Label>Cycle</Label>
                    <Select value={formData.menstrualCycle} onValueChange={(v) => updateField("menstrualCycle", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Regular">Regular</SelectItem>
                        <SelectItem value="Irregular">Irregular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>GPLA</Label><Input value={formData.gpla} onChange={(e) => updateField("gpla", e.target.value)} /></div>
                  <div><Label>LMP</Label><Input value={formData.lmp} onChange={(e) => updateField("lmp", e.target.value)} /></div>
                  <div><Label>Tubectomy</Label>
                    <Select value={formData.tubectomy} onValueChange={(v) => updateField("tubectomy", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Done">Done</SelectItem>
                        <SelectItem value="Not Done">Not Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>EDD</Label><Input value={formData.edd} onChange={(e) => updateField("edd", e.target.value)} /></div>
                  <div><Label>Menarche Age (yr)</Label><Input value={formData.menarcheAge} onChange={(e) => updateField("menarcheAge", e.target.value)} /></div>
                </div>
              </div>
            )}

            {/* Section 3: Examination */}
            {activeSection === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-base border-b pb-2 flex items-center gap-2">
                  Glasgow Coma Scale: Score <Badge variant="secondary">{(formData.gcsEyeOpening || 0) + (formData.gcsMotorResponse || 0) + (formData.gcsVerbalResponse || 0)}/15</Badge>
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label className="mb-2 block">Eye Opening</Label>
                    {GCS_EYE.map(g => (
                      <label key={g.value} className="flex items-center gap-2 mb-1">
                        <input type="radio" checked={formData.gcsEyeOpening === g.value} onChange={() => updateField("gcsEyeOpening", g.value)} />
                        {g.label} ({g.value})
                      </label>
                    ))}
                  </div>
                  <div>
                    <Label className="mb-2 block">Motor Response</Label>
                    {GCS_MOTOR.map(g => (
                      <label key={g.value} className="flex items-center gap-2 mb-1">
                        <input type="radio" checked={formData.gcsMotorResponse === g.value} onChange={() => updateField("gcsMotorResponse", g.value)} />
                        {g.label} ({g.value})
                      </label>
                    ))}
                  </div>
                  <div>
                    <Label className="mb-2 block">Verbal Response</Label>
                    {GCS_VERBAL.map(g => (
                      <label key={g.value} className="flex items-center gap-2 mb-1">
                        <input type="radio" checked={formData.gcsVerbalResponse === g.value} onChange={() => updateField("gcsVerbalResponse", g.value)} />
                        {g.label} ({g.value})
                      </label>
                    ))}
                  </div>
                </div>

                <h3 className="font-semibold text-base border-b pb-2 mt-6">General Examination</h3>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2"><Checkbox checked={formData.conscious} onCheckedChange={(c) => updateField("conscious", c)} />Conscious</label>
                  <label className="flex items-center gap-2"><Checkbox checked={formData.oriented} onCheckedChange={(c) => updateField("oriented", c)} />Oriented</label>
                  <label className="flex items-center gap-2"><Checkbox checked={formData.disoriented} onCheckedChange={(c) => updateField("disoriented", c)} />Disoriented</label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div><Label>PR (Beats/Min)</Label><Input value={formData.pulseRate} onChange={(e) => updateField("pulseRate", e.target.value)} /></div>
                  <div><Label>BP (mm of Hg)</Label><Input value={formData.bloodPressure} onChange={(e) => updateField("bloodPressure", e.target.value)} /></div>
                  <div><Label>RR (Breaths/min)</Label><Input value={formData.respiratoryRate} onChange={(e) => updateField("respiratoryRate", e.target.value)} /></div>
                  <div><Label>RBS</Label><Input value={formData.rbs} onChange={(e) => updateField("rbs", e.target.value)} /></div>
                  <div><Label>TEMP (F)</Label><Input value={formData.temperature} onChange={(e) => updateField("temperature", e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><Label>WT (Kgs)</Label><Input value={formData.weight} onChange={(e) => updateField("weight", e.target.value)} /></div>
                  <div><Label>HEIGHT (cms)</Label><Input value={formData.height} onChange={(e) => updateField("height", e.target.value)} /></div>
                  <div><Label>BMI</Label><Input value={formData.bmi} onChange={(e) => updateField("bmi", e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "PALLOR", field: "pallor" },
                    { label: "ICTERUS", field: "icterus" },
                    { label: "CYANOSIS", field: "cyanosis" },
                    { label: "CLUBBING", field: "clubbing" },
                    { label: "LYMPHADINOPATHY", field: "lymphadinopathy" },
                    { label: "OEDEMA", field: "oedema" },
                    { label: "JVP", field: "jvp" },
                  ].map(item => (
                    <div key={item.field} className="flex items-center justify-between">
                      <Label className="text-xs">{item.label}</Label>
                      <div className="flex gap-2">{["Yes", "No"].map(v => (<label key={v} className="flex items-center gap-1 text-xs"><input type="radio" checked={(formData as any)[item.field] === v} onChange={() => updateField(item.field, v)} />{v}</label>))}</div>
                    </div>
                  ))}
                </div>
                <div><Label>Head/EYES/EARS/NOSE/THROAT/SKIN</Label><Textarea value={formData.heent} onChange={(e) => updateField("heent", e.target.value)} rows={2} /></div>

                <h3 className="font-semibold text-base border-b pb-2 mt-6">Systemic Examination</h3>
                <div className="space-y-3">
                  <div><Label>CVS</Label><Textarea value={formData.cvs} onChange={(e) => updateField("cvs", e.target.value)} rows={2} /></div>
                  <div><Label>RS</Label><Textarea value={formData.rs} onChange={(e) => updateField("rs", e.target.value)} rows={2} /></div>
                  <div><Label>PA</Label><Textarea value={formData.pa} onChange={(e) => updateField("pa", e.target.value)} rows={2} /></div>
                  <div><Label>CNS</Label><Textarea value={formData.cns} onChange={(e) => updateField("cns", e.target.value)} rows={2} /></div>
                  <div><Label>Local Examination</Label><Textarea value={formData.localExamination} onChange={(e) => updateField("localExamination", e.target.value)} rows={2} /></div>
                </div>

                <h3 className="font-semibold text-base border-b pb-2 mt-6">Special Examinations</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Examination</TableHead>
                      <TableHead>Findings</TableHead>
                      <TableHead className="w-40">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { label: "Rectal Examination", field: "rectalExamination", statusField: "rectalExaminationStatus" },
                      { label: "Examination of Breasts", field: "breastExamination", statusField: "breastExaminationStatus" },
                      { label: "Pelvic Examination / External Genitalia", field: "pelvicExamination", statusField: "pelvicExaminationStatus" },
                      { label: "Local Examination of Wound", field: "woundExamination", statusField: "woundExaminationStatus" },
                    ].map(item => (
                      <TableRow key={item.field}>
                        <TableCell>{item.label}</TableCell>
                        <TableCell><Input value={(formData as any)[item.field]} onChange={(e) => updateField(item.field, e.target.value)} /></TableCell>
                        <TableCell>
                          <Select value={(formData as any)[item.statusField]} onValueChange={(v) => updateField(item.statusField, v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Done">Done</SelectItem>
                              <SelectItem value="Declined">Declined</SelectItem>
                              <SelectItem value="Not Indicated">Not Indicated</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Section 4: Diagnosis */}
            {activeSection === 4 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-base border-b pb-2">Investigation Advised</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {INVESTIGATIONS_LIST.map(inv => (
                    <label key={inv.key} className="flex items-center gap-2">
                      <Checkbox checked={getInvestigations()[inv.key] || false} onCheckedChange={(c) => setInvestigation(inv.key, !!c)} />
                      <span className="text-sm">{inv.label}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-3"><Label>Others</Label><Input value={formData.investigationsOthers} onChange={(e) => updateField("investigationsOthers", e.target.value)} /></div>

                <h3 className="font-semibold text-base border-b pb-2 mt-6">Provisional Diagnosis & Treatment</h3>
                <div className="space-y-3">
                  <div><Label>Provisional Diagnosis</Label><Textarea value={formData.provisionalDiagnosis} onChange={(e) => updateField("provisionalDiagnosis", e.target.value)} rows={3} /></div>
                  <div><Label>Treatment (E.g. Medication, IV Fluid, Monitoring, Diet, Position etc.)</Label><Textarea value={formData.treatment} onChange={(e) => updateField("treatment", e.target.value)} rows={3} /></div>
                </div>

                <h3 className="font-semibold text-base border-b pb-2 mt-6">Assessment Finished</h3>
                <div className="grid md:grid-cols-4 gap-3">
                  <div className="md:col-span-2"><Label>Name of Clinical Assistant: Dr.</Label><Input value={formData.clinicalAssistantName} onChange={(e) => updateField("clinicalAssistantName", e.target.value)} /></div>
                  <div><Label>Date</Label><Input type="date" value={formData.clinicalAssistantDate} onChange={(e) => updateField("clinicalAssistantDate", e.target.value)} /></div>
                  <div><Label>Time</Label><Input type="time" value={formData.clinicalAssistantTime} onChange={(e) => updateField("clinicalAssistantTime", e.target.value)} /></div>
                </div>
                <div className="grid md:grid-cols-4 gap-3">
                  <div className="md:col-span-2"><Label>Incharge Consultant Name: Dr.</Label><Input value={formData.inchargeConsultantName} onChange={(e) => updateField("inchargeConsultantName", e.target.value)} /></div>
                  <div><Label>Date</Label><Input type="date" value={formData.inchargeConsultantDate} onChange={(e) => updateField("inchargeConsultantDate", e.target.value)} /></div>
                  <div><Label>Time</Label><Input type="time" value={formData.inchargeConsultantTime} onChange={(e) => updateField("inchargeConsultantTime", e.target.value)} /></div>
                </div>
              </div>
            )}

            {/* Navigation and Action Buttons */}
            <div className="flex justify-between items-center gap-2 pt-4 border-t">
              <div className="flex gap-2">
                {activeSection > 1 && (
                  <Button variant="outline" onClick={() => setActiveSection(activeSection - 1)}>
                    Previous
                  </Button>
                )}
                {activeSection < 4 && (
                  <Button variant="outline" onClick={() => setActiveSection(activeSection + 1)}>
                    Next
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  {editingId ? "Update Assessment" : "Save Assessment"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Display existing assessments */
          assessments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No initial assessment recorded yet. Click "New Assessment" to create one.
            </div>
          ) : (
            <div className="space-y-4">
              {assessments.map((assessment: any) => (
                <Card key={assessment.id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        Assessment - {assessment.createdAt ? format(new Date(assessment.createdAt), "dd MMM yyyy HH:mm") : ""}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Provisional Diagnosis: {assessment.provisionalDiagnosis || "Not specified"}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(assessment)}>
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground text-xs">Pain Score</Label>
                        <p>{assessment.painScore ?? "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">GCS Score</Label>
                        <p>{assessment.gcsTotal ?? "N/A"}/15</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Incharge Consultant</Label>
                        <p>{assessment.inchargeConsultantName || "N/A"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

// ========== INDOOR CONSULTATION SHEET TAB ==========
function IndoorConsultationTab({ session }: { session: Session }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const defaultFormData = {
    entryDate: format(new Date(), "yyyy-MM-dd"),
    entryTime: format(new Date(), "HH:mm"),
    clinicalFindings: "",
    orders: "",
    recordedBy: "",
  };

  const [formData, setFormData] = useState(defaultFormData);

  const { data: entries = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/indoor-consultation/${session.id}`],
    enabled: !!session.id
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/patient-monitoring/indoor-consultation", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Entry saved successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/patient-monitoring/indoor-consultation/${session.id}`] });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/patient-monitoring/indoor-consultation/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Entry updated successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/patient-monitoring/indoor-consultation/${session.id}`] });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/patient-monitoring/indoor-consultation/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Entry deleted successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/patient-monitoring/indoor-consultation/${session.id}`] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (entry: any) => {
    setFormData({
      entryDate: entry.entryDate ? format(new Date(entry.entryDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      entryTime: entry.entryTime || format(new Date(), "HH:mm"),
      clinicalFindings: entry.clinicalFindings || "",
      orders: entry.orders || "",
      recordedBy: entry.recordedBy || "",
    });
    setEditingId(entry.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    const payload = {
      ...formData,
      sessionId: session.id,
      patientId: session.patientId,
      patientName: session.patientName,
      ward: session.ward,
      inChargeDoctor: session.admittingConsultant,
      entryDate: formData.entryDate ? new Date(formData.entryDate) : new Date(),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePrint = () => {
    const content = `
      <h1>INDOOR CONTINUATION SHEET</h1>
      <h3>Patient Information</h3>
      <table>
        <tr>
          <td class="label-cell">Patient Name:</td>
          <td class="value-cell">${session.patientName}</td>
          <td class="label-cell">UHID:</td>
          <td class="value-cell">${session.uhid}</td>
        </tr>
        <tr>
          <td class="label-cell">Ward:</td>
          <td class="value-cell">${session.ward || 'N/A'}</td>
          <td class="label-cell">Admitting Consultant:</td>
          <td class="value-cell">${session.admittingConsultant || 'N/A'}</td>
        </tr>
      </table>
      
      <h3>Daily Progress Notes</h3>
      ${entries.length ? `
        <table>
          <thead>
            <tr>
              <th style="width:40px;">S.No</th>
              <th style="width:100px;">Date</th>
              <th style="width:80px;">Time</th>
              <th>Clinical Findings / Daily Progress Notes</th>
              <th>Orders</th>
            </tr>
          </thead>
          <tbody>
            ${entries.map((e: any, idx: number) => 
              `<tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td style="text-align:center;">${e.entryDate ? format(new Date(e.entryDate), 'dd/MM/yyyy') : '-'}</td>
                <td style="text-align:center;">${e.entryTime || '-'}</td>
                <td style="white-space:pre-wrap;">${e.clinicalFindings || '-'}</td>
                <td style="white-space:pre-wrap;">${e.orders || '-'}</td>
              </tr>`
            ).join('')}
          </tbody>
          <tfoot>
            <tr class="summary-row">
              <td colspan="5" style="text-align:right;">Total Entries: ${entries.length}</td>
            </tr>
          </tfoot>
        </table>
      ` : '<div class="no-data">No entries recorded</div>'}
      
      <div class="signature-section">
        <table>
          <tr>
            <td class="label-cell">Consultant Sign:</td>
            <td class="value-cell"></td>
            <td class="label-cell">Date:</td>
            <td class="value-cell">${format(new Date(), 'dd/MM/yyyy')}</td>
          </tr>
        </table>
      </div>
    `;
    openPrintWindow('Indoor Continuation Sheet - ' + session.patientName, content);
  };

  if (isLoading) return <div className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Indoor Continuation Sheet
          </CardTitle>
          <p className="text-sm text-muted-foreground">Daily Progress Notes & Clinical Findings</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          {!showForm && (
            <Button onClick={() => { setFormData(defaultFormData); setEditingId(null); setShowForm(true); }} className="gap-1">
              <Plus className="h-4 w-4" /> Add Entry
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Patient Info Header */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-muted/50 rounded-lg text-sm">
          <div><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{session.patientName}</span></div>
          <div><span className="text-muted-foreground">Ward:</span> <span className="font-medium">{session.ward || "N/A"}</span></div>
          <div><span className="text-muted-foreground">In Charge Doctor:</span> <span className="font-medium">{session.admittingConsultant || "N/A"}</span></div>
          <div><span className="text-muted-foreground">UHID:</span> <span className="font-medium">{session.uhid}</span></div>
        </div>

        {showForm ? (
          <div className="space-y-4 border rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={formData.entryDate} onChange={(e) => updateField("entryDate", e.target.value)} />
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" value={formData.entryTime} onChange={(e) => updateField("entryTime", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Clinical Findings / Daily Progress Notes</Label>
              <Textarea 
                value={formData.clinicalFindings} 
                onChange={(e) => updateField("clinicalFindings", e.target.value)} 
                rows={5} 
                placeholder="Enter clinical findings, examination notes, progress updates..."
              />
            </div>
            <div>
              <Label>Orders</Label>
              <Textarea 
                value={formData.orders} 
                onChange={(e) => updateField("orders", e.target.value)} 
                rows={4} 
                placeholder="Enter orders, medication changes, investigations, instructions..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {editingId ? "Update Entry" : "Save Entry"}
              </Button>
            </div>
          </div>
        ) : (
          entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No entries recorded yet. Click "Add Entry" to add daily progress notes.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-36 whitespace-nowrap">Date & Time</TableHead>
                    <TableHead>Clinical Findings / Daily Progress Notes</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead className="w-20 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {entry.entryDate ? format(new Date(entry.entryDate), "dd MMM yyyy") : "-"}<br/>
                        <span className="text-muted-foreground">{entry.entryTime || "-"}</span>
                      </TableCell>
                      <TableCell className="text-sm whitespace-pre-wrap max-w-md">{entry.clinicalFindings || "-"}</TableCell>
                      <TableCell className="text-sm whitespace-pre-wrap max-w-sm">{entry.orders || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(entry)}><Edit className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(entry.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

// Doctor's Progress Sheet Tab
function DoctorsProgressTab({ session }: { session: Session }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    primaryConsultantName: session.admittingConsultant || "",
    entryDateTime: new Date().toISOString(),
    investigationsAdvised: "",
    clinicalNotes: "",
    treatmentAdvised: "",
    treatmentConsultantName: "",
    daysKeynotes: "",
    counsellingDoneByRmo: "",
    counsellingDoneByConsultant: "",
    relativePatientSign: ""
  });

  const { data: entries = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/doctors-progress/${session.id}`],
    enabled: !!session.id
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/patient-monitoring/doctors-progress", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Entry saved successfully" });
      refetch();
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to save entry", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/patient-monitoring/doctors-progress/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Entry updated successfully" });
      refetch();
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update entry", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/patient-monitoring/doctors-progress/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Entry deleted" });
      refetch();
    },
    onError: () => {
      toast({ title: "Failed to delete entry", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      primaryConsultantName: session.admittingConsultant || "",
      entryDateTime: new Date().toISOString(),
      investigationsAdvised: "",
      clinicalNotes: "",
      treatmentAdvised: "",
      treatmentConsultantName: "",
      daysKeynotes: "",
      counsellingDoneByRmo: "",
      counsellingDoneByConsultant: "",
      relativePatientSign: ""
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    const payload = {
      sessionId: session.id,
      patientId: session.patientId,
      patientName: session.patientName,
      prnNo: session.uhid,
      age: session.age,
      sex: session.sex,
      ipdNo: session.ipdNumber,
      ward: session.ward,
      bedNo: session.bedNumber,
      ...formData
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (entry: any) => {
    setFormData({
      primaryConsultantName: entry.primaryConsultantName || "",
      entryDateTime: entry.entryDateTime || new Date().toISOString(),
      investigationsAdvised: entry.investigationsAdvised || "",
      clinicalNotes: entry.clinicalNotes || "",
      treatmentAdvised: entry.treatmentAdvised || "",
      treatmentConsultantName: entry.treatmentConsultantName || "",
      daysKeynotes: entry.daysKeynotes || "",
      counsellingDoneByRmo: entry.counsellingDoneByRmo || "",
      counsellingDoneByConsultant: entry.counsellingDoneByConsultant || "",
      relativePatientSign: entry.relativePatientSign || ""
    });
    setEditingId(entry.id);
    setShowForm(true);
  };

  const handlePrint = () => {
    const rows = entries.map((e: any) => 
      `<tr>
        <td>${e.entryDateTime ? format(new Date(e.entryDateTime), 'dd/MM/yyyy HH:mm') : '-'}</td>
        <td>${e.investigationsAdvised || '-'}</td>
        <td style="white-space:pre-wrap">${e.clinicalNotes || '-'}</td>
        <td>${e.treatmentAdvised || '-'}<br/><small>By: ${e.treatmentConsultantName || '-'}</small></td>
      </tr>`
    ).join('');

    const latestEntry = entries[0];
    const content = `
      <h1>Doctor's Progress Sheet</h1>
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <div><strong>Patient:</strong> ${session.patientName}</div>
        <div><strong>PRN No:</strong> ${session.uhid}</div>
        <div><strong>Age/Sex:</strong> ${session.age || '-'} / ${session.sex || '-'}</div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <div><strong>Ward:</strong> ${session.ward || '-'}</div>
        <div><strong>Bed No:</strong> ${session.bedNumber || '-'}</div>
        <div><strong>Primary Consultant:</strong> ${latestEntry?.primaryConsultantName || session.admittingConsultant || '-'}</div>
      </div>
      ${entries.length ? `
        <table>
          <thead>
            <tr>
              <th style="width:120px">Date/Time</th>
              <th>Investigations Advised</th>
              <th>Clinical Notes</th>
              <th>Treatment Advised</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        ${latestEntry?.daysKeynotes ? `<div style="margin-top:15px;border:1px solid #333;padding:10px;"><strong>Day's Keynotes:</strong><br/>${latestEntry.daysKeynotes}</div>` : ''}
        <div style="margin-top:15px;display:flex;gap:30px;">
          <div><strong>Counselling done by - RMO:</strong> ${latestEntry?.counsellingDoneByRmo || '____________'}</div>
          <div><strong>Consultant:</strong> ${latestEntry?.counsellingDoneByConsultant || '____________'}</div>
        </div>
        <div style="margin-top:30px;"><strong>Relatives / Patient Sign:</strong> ${latestEntry?.relativePatientSign || '________________________'}</div>
      ` : '<p class="no-data">No progress entries recorded</p>'}
    `;
    openPrintWindow("Doctor's Progress Sheet", content);
  };

  if (isLoading) return <div className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="h-5 w-5" />
            Doctor's Progress Sheet
          </CardTitle>
          <p className="text-sm text-muted-foreground">Daily progress notes by treating consultant</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          {!showForm && (
            <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1">
              <Plus className="h-4 w-4" /> Add Entry
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showForm ? (
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label>Primary Consultant's Name</Label>
                <Input 
                  value={formData.primaryConsultantName} 
                  onChange={(e) => setFormData({ ...formData, primaryConsultantName: e.target.value })}
                  placeholder="Enter consultant name"
                />
              </div>
              <div>
                <Label>Date & Time</Label>
                <Input 
                  type="datetime-local" 
                  value={formData.entryDateTime ? format(new Date(formData.entryDateTime), "yyyy-MM-dd'T'HH:mm") : ""} 
                  onChange={(e) => setFormData({ ...formData, entryDateTime: new Date(e.target.value).toISOString() })}
                />
              </div>
              <div>
                <Label>Treatment Consultant Name</Label>
                <Input 
                  value={formData.treatmentConsultantName} 
                  onChange={(e) => setFormData({ ...formData, treatmentConsultantName: e.target.value })}
                  placeholder="Consultant advising treatment"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Investigations Advised</Label>
                <Textarea 
                  value={formData.investigationsAdvised} 
                  onChange={(e) => setFormData({ ...formData, investigationsAdvised: e.target.value })}
                  placeholder="List investigations..."
                  rows={4}
                />
              </div>
              <div>
                <Label>Clinical Notes</Label>
                <Textarea 
                  value={formData.clinicalNotes} 
                  onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                  placeholder="Enter clinical notes..."
                  rows={4}
                />
              </div>
              <div>
                <Label>Treatment Advised by Consultant</Label>
                <Textarea 
                  value={formData.treatmentAdvised} 
                  onChange={(e) => setFormData({ ...formData, treatmentAdvised: e.target.value })}
                  placeholder="Treatment plan..."
                  rows={4}
                />
              </div>
            </div>

            <div>
              <Label>Day's Keynotes</Label>
              <Textarea 
                value={formData.daysKeynotes} 
                onChange={(e) => setFormData({ ...formData, daysKeynotes: e.target.value })}
                placeholder="Important notes for the day..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Counselling done by: RMO</Label>
                <Input 
                  value={formData.counsellingDoneByRmo} 
                  onChange={(e) => setFormData({ ...formData, counsellingDoneByRmo: e.target.value })}
                  placeholder="RMO name"
                />
              </div>
              <div>
                <Label>Consultant</Label>
                <Input 
                  value={formData.counsellingDoneByConsultant} 
                  onChange={(e) => setFormData({ ...formData, counsellingDoneByConsultant: e.target.value })}
                  placeholder="Consultant name"
                />
              </div>
            </div>

            <div>
              <Label>Relatives / Patient Sign</Label>
              <Input 
                value={formData.relativePatientSign} 
                onChange={(e) => setFormData({ ...formData, relativePatientSign: e.target.value })}
                placeholder="Name of relative/patient who signed"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {editingId ? "Update" : "Save"} Entry
              </Button>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No progress entries recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36 whitespace-nowrap">Date/Time</TableHead>
                  <TableHead>Investigations</TableHead>
                  <TableHead>Clinical Notes</TableHead>
                  <TableHead>Treatment Advised</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {entry.entryDateTime ? format(new Date(entry.entryDateTime), "dd MMM yyyy") : "-"}<br/>
                      <span className="text-muted-foreground">{entry.entryDateTime ? format(new Date(entry.entryDateTime), "HH:mm") : ""}</span>
                    </TableCell>
                    <TableCell className="text-sm whitespace-pre-wrap max-w-xs">{entry.investigationsAdvised || "-"}</TableCell>
                    <TableCell className="text-sm whitespace-pre-wrap max-w-md">{entry.clinicalNotes || "-"}</TableCell>
                    <TableCell className="text-sm whitespace-pre-wrap max-w-sm">
                      {entry.treatmentAdvised || "-"}
                      {entry.treatmentConsultantName && <div className="text-xs text-muted-foreground mt-1">By: {entry.treatmentConsultantName}</div>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(entry)}><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(entry.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Doctor's Visit Sheet Tab
function DoctorsVisitTab({ session }: { session: Session }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    visitTime: format(new Date(), 'HH:mm'),
    nameOfDoctor: "",
    visitType: "routine",
    procedure: "",
    doctorSign: ""
  });

  const { data: entries = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/doctors-visit/${session.id}`],
    enabled: !!session.id
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/patient-monitoring/doctors-visit", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Visit entry saved successfully" });
      refetch();
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to save visit entry", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/patient-monitoring/doctors-visit/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Visit entry updated successfully" });
      refetch();
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update visit entry", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/patient-monitoring/doctors-visit/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Visit entry deleted" });
      refetch();
    },
    onError: () => {
      toast({ title: "Failed to delete visit entry", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      visitDate: new Date().toISOString().split('T')[0],
      visitTime: format(new Date(), 'HH:mm'),
      nameOfDoctor: "",
      visitType: "routine",
      procedure: "",
      doctorSign: ""
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    const payload = {
      sessionId: session.id,
      patientId: session.patientId,
      patientName: session.patientName,
      prnNo: session.uhid,
      age: session.age,
      sex: session.sex,
      ipdNo: session.ipdNumber,
      ward: session.ward,
      bedNo: session.bedNumber,
      visitDate: formData.visitDate ? new Date(formData.visitDate).toISOString() : new Date().toISOString(),
      ...formData
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (entry: any) => {
    setFormData({
      visitDate: entry.visitDate ? format(new Date(entry.visitDate), 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
      visitTime: entry.visitTime || format(new Date(), 'HH:mm'),
      nameOfDoctor: entry.nameOfDoctor || "",
      visitType: entry.visitType || "routine",
      procedure: entry.procedure || "",
      doctorSign: entry.doctorSign || ""
    });
    setEditingId(entry.id);
    setShowForm(true);
  };

  const handlePrint = () => {
    const content = `
      <h1>DOCTOR'S VISIT SHEET</h1>
      
      <h3>Patient Information</h3>
      <table>
        <tr>
          <td class="label-cell">Patient Name:</td>
          <td class="value-cell">${session.patientName || '-'}</td>
          <td class="label-cell">PRN No.:</td>
          <td class="value-cell">${session.uhid || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Age:</td>
          <td class="value-cell">${session.age || '-'}</td>
          <td class="label-cell">Sex:</td>
          <td class="value-cell">${session.sex || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Ward:</td>
          <td class="value-cell">${session.ward || '-'}</td>
          <td class="label-cell">Bed No.:</td>
          <td class="value-cell">${session.bedNumber || '-'}</td>
        </tr>
      </table>
      
      <h3>Visit Records</h3>
      ${entries.length ? `
        <table>
          <thead>
            <tr>
              <th style="width:40px;">S.No</th>
              <th style="width:90px;">Date</th>
              <th style="width:70px;">Time</th>
              <th>Name of Doctor</th>
              <th style="width:80px;">Visit Type</th>
              <th>Procedure</th>
              <th style="width:100px;">Sign</th>
            </tr>
          </thead>
          <tbody>
            ${entries.map((e: any, idx: number) => `
              <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td style="text-align:center;">${e.visitDate ? format(new Date(e.visitDate), 'dd/MM/yyyy') : '-'}</td>
                <td style="text-align:center;">${e.visitTime || '-'}</td>
                <td>${e.nameOfDoctor || '-'}</td>
                <td style="text-align:center;">${e.visitType === 'routine' ? 'Routine' : 'Emergency'}</td>
                <td>${e.procedure || '-'}</td>
                <td>${e.doctorSign || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="summary-row">
              <td colspan="7" style="text-align:right;">Total Visits: ${entries.length} | Routine: ${entries.filter((e: any) => e.visitType === 'routine').length} | Emergency: ${entries.filter((e: any) => e.visitType === 'emergency').length}</td>
            </tr>
          </tfoot>
        </table>
      ` : '<div class="no-data">No visit entries recorded</div>'}
      
      <div class="signature-section">
        <table>
          <tr>
            <td class="label-cell">Ward In-Charge Sign:</td>
            <td class="value-cell"></td>
            <td class="label-cell">Date:</td>
            <td class="value-cell">${format(new Date(), 'dd/MM/yyyy')}</td>
          </tr>
        </table>
      </div>
    `;
    openPrintWindow("Doctor's Visit Sheet", content);
  };

  if (isLoading) return <div className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Doctor's Visit Sheet
          </CardTitle>
          <p className="text-sm text-muted-foreground">Record of doctor visits to the patient</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          {!showForm && (
            <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1">
              <Plus className="h-4 w-4" /> Add Visit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showForm ? (
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Date</Label>
                <Input 
                  type="date" 
                  value={formData.visitDate} 
                  onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input 
                  type="time" 
                  value={formData.visitTime} 
                  onChange={(e) => setFormData({ ...formData, visitTime: e.target.value })}
                />
              </div>
              <div>
                <Label>Name of Doctor</Label>
                <Input 
                  value={formData.nameOfDoctor} 
                  onChange={(e) => setFormData({ ...formData, nameOfDoctor: e.target.value })}
                  placeholder="Doctor's name"
                />
              </div>
              <div>
                <Label>Visit Type</Label>
                <Select value={formData.visitType} onValueChange={(v) => setFormData({ ...formData, visitType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Procedure</Label>
                <Textarea 
                  value={formData.procedure} 
                  onChange={(e) => setFormData({ ...formData, procedure: e.target.value })}
                  placeholder="Procedure performed (if any)"
                  rows={2}
                />
              </div>
              <div>
                <Label>Doctor's Signature/Name</Label>
                <Input 
                  value={formData.doctorSign} 
                  onChange={(e) => setFormData({ ...formData, doctorSign: e.target.value })}
                  placeholder="Signature"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {editingId ? "Update" : "Save"} Visit
              </Button>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No visit entries recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28 whitespace-nowrap">Date</TableHead>
                  <TableHead className="w-20">Time</TableHead>
                  <TableHead>Name of Doctor</TableHead>
                  <TableHead className="w-24 text-center">Visit Type</TableHead>
                  <TableHead>Procedure</TableHead>
                  <TableHead className="w-24">Sign</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {entry.visitDate ? format(new Date(entry.visitDate), "dd MMM yyyy") : "-"}
                    </TableCell>
                    <TableCell className="text-sm">{entry.visitTime || "-"}</TableCell>
                    <TableCell className="text-sm">{entry.nameOfDoctor || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={entry.visitType === "emergency" ? "destructive" : "secondary"}>
                        {entry.visitType === "emergency" ? "Emergency" : "Routine"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{entry.procedure || "-"}</TableCell>
                    <TableCell className="text-sm">{entry.doctorSign || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(entry)}><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(entry.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Surgery Notes Tab
function SurgeryNotesTab({ session }: { session: Session }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    doctorName: "",
    mrn: session.uhid || "",
    surgeryDate: new Date().toISOString().split('T')[0],
    nameOfSurgeon: "",
    preoperativeDiagnosis: "",
    surgeryPlanned: "",
    surgeryPerformed: "",
    surgeonName: "",
    assistant1: "",
    assistant2: "",
    typeOfAnaesthesia: "",
    anaesthetist1: "",
    anaesthetist2: "",
    operationStartedAt: "",
    operationCompletedAt: "",
    operationNotes: "",
    otherRelevantDetails: "",
    bloodLoss: "",
    postopVitalsPulse: "",
    postopVitalsBp: "",
    postopVitalsSpo2: "",
    shiftPatientTo: "",
    bloodTransfusion: "not_to_be_given",
    tissueSubjectForHpe: false,
    surgeonSign: ""
  });

  const { data: entries = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/surgery-notes/${session.id}`],
    enabled: !!session.id
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/patient-monitoring/surgery-notes", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Surgery note saved successfully" });
      refetch();
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to save surgery note", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/patient-monitoring/surgery-notes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Surgery note updated successfully" });
      refetch();
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update surgery note", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/patient-monitoring/surgery-notes/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Surgery note deleted" });
      refetch();
    },
    onError: () => {
      toast({ title: "Failed to delete surgery note", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      doctorName: "",
      mrn: session.uhid || "",
      surgeryDate: new Date().toISOString().split('T')[0],
      nameOfSurgeon: "",
      preoperativeDiagnosis: "",
      surgeryPlanned: "",
      surgeryPerformed: "",
      surgeonName: "",
      assistant1: "",
      assistant2: "",
      typeOfAnaesthesia: "",
      anaesthetist1: "",
      anaesthetist2: "",
      operationStartedAt: "",
      operationCompletedAt: "",
      operationNotes: "",
      otherRelevantDetails: "",
      bloodLoss: "",
      postopVitalsPulse: "",
      postopVitalsBp: "",
      postopVitalsSpo2: "",
      shiftPatientTo: "",
      bloodTransfusion: "not_to_be_given",
      tissueSubjectForHpe: false,
      surgeonSign: ""
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    const payload = {
      sessionId: session.id,
      patientId: session.patientId,
      patientName: session.patientName,
      prnNo: session.uhid,
      age: session.age,
      sex: session.sex,
      ipdNo: session.ipdNumber,
      ward: session.ward,
      bedNo: session.bedNumber,
      doctorName: formData.doctorName,
      mrn: formData.mrn,
      surgeryDate: formData.surgeryDate ? new Date(formData.surgeryDate).toISOString() : new Date().toISOString(),
      nameOfSurgeon: formData.nameOfSurgeon,
      preoperativeDiagnosis: formData.preoperativeDiagnosis,
      surgeryPlanned: formData.surgeryPlanned,
      surgeryPerformed: formData.surgeryPerformed,
      surgeonName: formData.surgeonName,
      assistant1: formData.assistant1,
      assistant2: formData.assistant2,
      typeOfAnaesthesia: formData.typeOfAnaesthesia,
      anaesthetist1: formData.anaesthetist1,
      anaesthetist2: formData.anaesthetist2,
      operationStartedAt: formData.operationStartedAt,
      operationCompletedAt: formData.operationCompletedAt,
      operationNotes: formData.operationNotes,
      otherRelevantDetails: formData.otherRelevantDetails,
      bloodLoss: formData.bloodLoss,
      postopVitalsPulse: formData.postopVitalsPulse,
      postopVitalsBp: formData.postopVitalsBp,
      postopVitalsSpo2: formData.postopVitalsSpo2,
      shiftPatientTo: formData.shiftPatientTo,
      bloodTransfusion: formData.bloodTransfusion,
      tissueSubjectForHpe: formData.tissueSubjectForHpe,
      surgeonSign: formData.surgeonSign
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (entry: any) => {
    setFormData({
      doctorName: entry.doctorName || "",
      mrn: entry.mrn || session.uhid || "",
      surgeryDate: entry.surgeryDate ? format(new Date(entry.surgeryDate), 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
      nameOfSurgeon: entry.nameOfSurgeon || "",
      preoperativeDiagnosis: entry.preoperativeDiagnosis || "",
      surgeryPlanned: entry.surgeryPlanned || "",
      surgeryPerformed: entry.surgeryPerformed || "",
      surgeonName: entry.surgeonName || "",
      assistant1: entry.assistant1 || "",
      assistant2: entry.assistant2 || "",
      typeOfAnaesthesia: entry.typeOfAnaesthesia || "",
      anaesthetist1: entry.anaesthetist1 || "",
      anaesthetist2: entry.anaesthetist2 || "",
      operationStartedAt: entry.operationStartedAt || "",
      operationCompletedAt: entry.operationCompletedAt || "",
      operationNotes: entry.operationNotes || "",
      otherRelevantDetails: entry.otherRelevantDetails || "",
      bloodLoss: entry.bloodLoss || "",
      postopVitalsPulse: entry.postopVitalsPulse || "",
      postopVitalsBp: entry.postopVitalsBp || "",
      postopVitalsSpo2: entry.postopVitalsSpo2 || "",
      shiftPatientTo: entry.shiftPatientTo || "",
      bloodTransfusion: entry.bloodTransfusion || "not_to_be_given",
      tissueSubjectForHpe: entry.tissueSubjectForHpe || false,
      surgeonSign: entry.surgeonSign || ""
    });
    setEditingId(entry.id);
    setShowForm(true);
  };

  const handlePrint = () => {
    const e = entries[0];
    if (!e) {
      toast({ title: "No surgery notes to print", variant: "destructive" });
      return;
    }

    const content = `
      <h1>SURGERY NOTES</h1>
      
      <h3>Patient Information</h3>
      <table>
        <tr>
          <td class="label-cell">Patient Name:</td>
          <td class="value-cell">${session.patientName || '-'}</td>
          <td class="label-cell">UHID/PRN:</td>
          <td class="value-cell">${session.uhid || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Age:</td>
          <td class="value-cell">${session.age || '-'}</td>
          <td class="label-cell">Sex:</td>
          <td class="value-cell">${session.sex || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Ward:</td>
          <td class="value-cell">${session.ward || '-'}</td>
          <td class="label-cell">Bed No.:</td>
          <td class="value-cell">${session.bedNumber || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Surgery Date:</td>
          <td class="value-cell">${e.surgeryDate ? format(new Date(e.surgeryDate), 'dd/MM/yyyy') : '-'}</td>
          <td class="label-cell">MRN:</td>
          <td class="value-cell">${e.mrn || session.uhid || '-'}</td>
        </tr>
      </table>
      
      <h3>Surgical Team</h3>
      <table>
        <tr>
          <td class="label-cell">Name of Surgeon:</td>
          <td colspan="3">${e.nameOfSurgeon || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Surgeon Name:</td>
          <td colspan="3">${e.surgeonName || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Assistant 1:</td>
          <td class="value-cell">${e.assistant1 || '-'}</td>
          <td class="label-cell">Assistant 2:</td>
          <td class="value-cell">${e.assistant2 || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Type of Anaesthesia:</td>
          <td colspan="3">${e.typeOfAnaesthesia || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Anaesthetist 1:</td>
          <td class="value-cell">${e.anaesthetist1 || '-'}</td>
          <td class="label-cell">Anaesthetist 2:</td>
          <td class="value-cell">${e.anaesthetist2 || '-'}</td>
        </tr>
      </table>
      
      <h3>Surgery Details</h3>
      <table>
        <tr>
          <td class="label-cell" style="width:25%;">Preoperative Diagnosis:</td>
          <td colspan="3">${e.preoperativeDiagnosis || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Surgery Planned:</td>
          <td class="value-cell">${e.surgeryPlanned || '-'}</td>
          <td class="label-cell">Surgery Performed:</td>
          <td class="value-cell">${e.surgeryPerformed || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Operation Started:</td>
          <td class="value-cell">${e.operationStartedAt || '-'}</td>
          <td class="label-cell">Operation Completed:</td>
          <td class="value-cell">${e.operationCompletedAt || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Operation Notes:</td>
          <td colspan="3" style="white-space:pre-wrap;">${e.operationNotes || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Other Details:</td>
          <td colspan="3">${e.otherRelevantDetails || '-'}</td>
        </tr>
      </table>
      
      <h3>Post-Operative Details</h3>
      <table>
        <tr>
          <td class="label-cell">Blood Loss:</td>
          <td class="value-cell">${e.bloodLoss || '-'} ml</td>
          <td class="label-cell">Blood Transfusion:</td>
          <td class="value-cell">${e.bloodTransfusion === 'to_be_given' ? 'To Be Given' : 'Not To Be Given'}</td>
        </tr>
        <tr>
          <td class="label-cell">Postop Pulse:</td>
          <td class="value-cell">${e.postopVitalsPulse || '-'}</td>
          <td class="label-cell">Postop BP:</td>
          <td class="value-cell">${e.postopVitalsBp || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Postop SpO2:</td>
          <td class="value-cell">${e.postopVitalsSpo2 || '-'}%</td>
          <td class="label-cell">Shift Patient To:</td>
          <td class="value-cell">${e.shiftPatientTo || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Tissue Subject For HPE:</td>
          <td colspan="3">${e.tissueSubjectForHpe ? 'Yes' : 'No'}</td>
        </tr>
      </table>
      
      <div class="signature-section">
        <table>
          <tr>
            <td class="label-cell">Surgeon Signature:</td>
            <td class="value-cell">${e.surgeonSign || ''}</td>
            <td class="label-cell">Date:</td>
            <td class="value-cell">${e.surgeryDate ? format(new Date(e.surgeryDate), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}</td>
          </tr>
        </table>
      </div>
    `;
    openPrintWindow("Surgery Notes", content);
  };

  if (isLoading) return <div className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hospital className="h-5 w-5" />
            Surgery Notes
          </CardTitle>
          <p className="text-sm text-muted-foreground">Complete surgery documentation</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          {!showForm && (
            <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1">
              <Plus className="h-4 w-4" /> Add Surgery Note
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showForm ? (
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold border-b pb-2">Surgery Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Doctor Name</Label>
                <Input value={formData.doctorName} onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })} placeholder="Doctor name" />
              </div>
              <div>
                <Label>MRN</Label>
                <Input value={formData.mrn} onChange={(e) => setFormData({ ...formData, mrn: e.target.value })} placeholder="MRN" />
              </div>
              <div>
                <Label>Surgery Date</Label>
                <Input type="date" value={formData.surgeryDate} onChange={(e) => setFormData({ ...formData, surgeryDate: e.target.value })} />
              </div>
              <div>
                <Label>Name of Surgeon</Label>
                <Input value={formData.nameOfSurgeon} onChange={(e) => setFormData({ ...formData, nameOfSurgeon: e.target.value })} placeholder="Surgeon name" />
              </div>
            </div>

            <div>
              <Label>Preoperative Diagnosis</Label>
              <Textarea value={formData.preoperativeDiagnosis} onChange={(e) => setFormData({ ...formData, preoperativeDiagnosis: e.target.value })} rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Surgery Planned</Label>
                <Textarea value={formData.surgeryPlanned} onChange={(e) => setFormData({ ...formData, surgeryPlanned: e.target.value })} rows={2} />
              </div>
              <div>
                <Label>Surgery Performed</Label>
                <Textarea value={formData.surgeryPerformed} onChange={(e) => setFormData({ ...formData, surgeryPerformed: e.target.value })} rows={2} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Surgeon Name</Label>
                <Input value={formData.surgeonName} onChange={(e) => setFormData({ ...formData, surgeonName: e.target.value })} />
              </div>
              <div>
                <Label>Assistant 1</Label>
                <Input value={formData.assistant1} onChange={(e) => setFormData({ ...formData, assistant1: e.target.value })} />
              </div>
              <div>
                <Label>Assistant 2</Label>
                <Input value={formData.assistant2} onChange={(e) => setFormData({ ...formData, assistant2: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Type of Anaesthesia</Label>
                <Input value={formData.typeOfAnaesthesia} onChange={(e) => setFormData({ ...formData, typeOfAnaesthesia: e.target.value })} />
              </div>
              <div>
                <Label>Anaesthetist 1</Label>
                <Input value={formData.anaesthetist1} onChange={(e) => setFormData({ ...formData, anaesthetist1: e.target.value })} />
              </div>
              <div>
                <Label>Anaesthetist 2</Label>
                <Input value={formData.anaesthetist2} onChange={(e) => setFormData({ ...formData, anaesthetist2: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Operation Started At</Label>
                <Input type="time" value={formData.operationStartedAt} onChange={(e) => setFormData({ ...formData, operationStartedAt: e.target.value })} />
              </div>
              <div>
                <Label>Operation Completed At</Label>
                <Input type="time" value={formData.operationCompletedAt} onChange={(e) => setFormData({ ...formData, operationCompletedAt: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Operation Notes</Label>
              <Textarea value={formData.operationNotes} onChange={(e) => setFormData({ ...formData, operationNotes: e.target.value })} rows={4} />
            </div>

            <h3 className="font-semibold border-b pb-2 pt-4">Post-Operation Details</h3>
            <div>
              <Label>Other Relevant Details</Label>
              <Textarea value={formData.otherRelevantDetails} onChange={(e) => setFormData({ ...formData, otherRelevantDetails: e.target.value })} rows={3} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <Label>Blood Loss</Label>
                <Input value={formData.bloodLoss} onChange={(e) => setFormData({ ...formData, bloodLoss: e.target.value })} placeholder="ml" />
              </div>
              <div>
                <Label>Postop Pulse</Label>
                <Input value={formData.postopVitalsPulse} onChange={(e) => setFormData({ ...formData, postopVitalsPulse: e.target.value })} placeholder="P-" />
              </div>
              <div>
                <Label>Postop BP</Label>
                <Input value={formData.postopVitalsBp} onChange={(e) => setFormData({ ...formData, postopVitalsBp: e.target.value })} placeholder="BP-" />
              </div>
              <div>
                <Label>Postop SpO2</Label>
                <Input value={formData.postopVitalsSpo2} onChange={(e) => setFormData({ ...formData, postopVitalsSpo2: e.target.value })} placeholder="SpO2-" />
              </div>
              <div>
                <Label>Shift Patient To</Label>
                <Input value={formData.shiftPatientTo} onChange={(e) => setFormData({ ...formData, shiftPatientTo: e.target.value })} placeholder="Ward/ICU" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Blood Transfusion</Label>
                <Select value={formData.bloodTransfusion} onValueChange={(v) => setFormData({ ...formData, bloodTransfusion: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="to_be_given">To Be Given</SelectItem>
                    <SelectItem value="not_to_be_given">Not To Be Given</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input 
                  type="checkbox" 
                  id="tissueHpe"
                  checked={formData.tissueSubjectForHpe} 
                  onChange={(e) => setFormData({ ...formData, tissueSubjectForHpe: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="tissueHpe">Tissue Subject For HPE</Label>
              </div>
              <div>
                <Label>Surgeon Signature/Name</Label>
                <Input value={formData.surgeonSign} onChange={(e) => setFormData({ ...formData, surgeonSign: e.target.value })} placeholder="Signature" />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {editingId ? "Update" : "Save"} Surgery Note
              </Button>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No surgery notes recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28 whitespace-nowrap">Date</TableHead>
                  <TableHead>Surgeon</TableHead>
                  <TableHead>Surgery Performed</TableHead>
                  <TableHead>Anaesthesia</TableHead>
                  <TableHead className="w-24">Duration</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {entry.surgeryDate ? format(new Date(entry.surgeryDate), "dd MMM yyyy") : "-"}
                    </TableCell>
                    <TableCell className="text-sm">{entry.surgeonName || entry.nameOfSurgeon || "-"}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{entry.surgeryPerformed || "-"}</TableCell>
                    <TableCell className="text-sm">{entry.typeOfAnaesthesia || "-"}</TableCell>
                    <TableCell className="text-sm">
                      {entry.operationStartedAt && entry.operationCompletedAt 
                        ? `${entry.operationStartedAt} - ${entry.operationCompletedAt}` 
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(entry)}><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(entry.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Nursing Progress Sheet Tab
function NursingProgressTab({ session }: { session: Session }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    allergicTo: "",
    entryDateTime: new Date().toISOString().slice(0, 16),
    progressNotes: "",
    signatureName: ""
  });

  const { data: entries = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/nursing-progress/${session.id}`],
    enabled: !!session.id
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/patient-monitoring/nursing-progress", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Nursing progress entry saved successfully" });
      refetch();
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to save nursing progress entry", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/patient-monitoring/nursing-progress/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Nursing progress entry updated successfully" });
      refetch();
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update nursing progress entry", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/patient-monitoring/nursing-progress/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Nursing progress entry deleted" });
      refetch();
    },
    onError: () => {
      toast({ title: "Failed to delete nursing progress entry", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      allergicTo: "",
      entryDateTime: new Date().toISOString().slice(0, 16),
      progressNotes: "",
      signatureName: ""
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    const payload = {
      sessionId: session.id,
      patientId: session.patientId,
      patientName: session.patientName,
      prnNo: session.uhid,
      age: session.age,
      sex: session.sex,
      ipdNo: session.ipdNumber,
      ward: session.ward,
      bedNo: session.bedNumber,
      allergicTo: formData.allergicTo,
      entryDateTime: formData.entryDateTime ? new Date(formData.entryDateTime).toISOString() : new Date().toISOString(),
      progressNotes: formData.progressNotes,
      signatureName: formData.signatureName
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (entry: any) => {
    setFormData({
      allergicTo: entry.allergicTo || "",
      entryDateTime: entry.entryDateTime ? format(new Date(entry.entryDateTime), "yyyy-MM-dd'T'HH:mm") : new Date().toISOString().slice(0, 16),
      progressNotes: entry.progressNotes || "",
      signatureName: entry.signatureName || ""
    });
    setEditingId(entry.id);
    setShowForm(true);
  };

  const handlePrint = () => {
    const allEntries = entries.length > 0 ? entries : [];
    const content = `
      <h1>NURSING PROGRESS SHEET</h1>
      
      <h3>Patient Information</h3>
      <table>
        <tr>
          <td class="label-cell">Patient Name:</td>
          <td class="value-cell">${session.patientName || '-'}</td>
          <td class="label-cell">UHID:</td>
          <td class="value-cell">${session.uhid || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Age:</td>
          <td class="value-cell">${session.age || '-'}</td>
          <td class="label-cell">Sex:</td>
          <td class="value-cell">${session.sex || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Ward:</td>
          <td class="value-cell">${session.ward || '-'}</td>
          <td class="label-cell">Bed No.:</td>
          <td class="value-cell">${session.bedNumber || '-'}</td>
        </tr>
        <tr>
          <td class="label-cell">Allergic To:</td>
          <td colspan="3" class="value-cell">${allEntries[0]?.allergicTo || '-'}</td>
        </tr>
      </table>
      
      <h3>Progress Notes</h3>
      ${allEntries.length ? `
        <table>
          <thead>
            <tr>
              <th style="width:40px;">S.No</th>
              <th style="width:120px;">Date / Time</th>
              <th>Progress Notes</th>
              <th style="width:150px;">Signature & Name</th>
            </tr>
          </thead>
          <tbody>
            ${allEntries.map((e: any, idx: number) => `
              <tr>
                <td style="text-align:center;vertical-align:top;">${idx + 1}</td>
                <td style="text-align:center;vertical-align:top;">${e.entryDateTime ? format(new Date(e.entryDateTime), "dd/MM/yyyy HH:mm") : '-'}</td>
                <td style="vertical-align:top;white-space:pre-wrap;">${e.progressNotes || '-'}</td>
                <td style="vertical-align:top;">${e.signatureName || '-'}</td>
              </tr>`).join('')}
          </tbody>
          <tfoot>
            <tr class="summary-row">
              <td colspan="4" style="text-align:right;">Total Entries: ${allEntries.length}</td>
            </tr>
          </tfoot>
        </table>
      ` : '<div class="no-data">No entries recorded</div>'}
      
      <div class="signature-section">
        <table>
          <tr>
            <td class="label-cell">Nurse In-Charge Sign:</td>
            <td class="value-cell"></td>
            <td class="label-cell">Date:</td>
            <td class="value-cell">${format(new Date(), 'dd/MM/yyyy')}</td>
          </tr>
        </table>
      </div>
    `;
    openPrintWindow("Nursing Progress Sheet", content);
  };

  if (isLoading) return <div className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Nursing Progress Sheet
          </CardTitle>
          <p className="text-sm text-muted-foreground">Track nursing observations and progress notes</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          {!showForm && (
            <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1">
              <Plus className="h-4 w-4" /> Add Entry
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showForm ? (
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold border-b pb-2">Nursing Progress Entry</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Allergic To</Label>
                <Input 
                  value={formData.allergicTo} 
                  onChange={(e) => setFormData({ ...formData, allergicTo: e.target.value })} 
                  placeholder="Enter allergies (if any)"
                />
              </div>
              <div>
                <Label>Date / Time</Label>
                <Input 
                  type="datetime-local" 
                  value={formData.entryDateTime} 
                  onChange={(e) => setFormData({ ...formData, entryDateTime: e.target.value })} 
                />
              </div>
            </div>
            <div>
              <Label>Progress Notes</Label>
              <Textarea 
                value={formData.progressNotes} 
                onChange={(e) => setFormData({ ...formData, progressNotes: e.target.value })} 
                rows={6}
                placeholder="Enter nursing observations, patient condition, treatments administered, etc."
              />
            </div>
            <div className="w-1/2">
              <Label>Signature & Name</Label>
              <Input 
                value={formData.signatureName} 
                onChange={(e) => setFormData({ ...formData, signatureName: e.target.value })} 
                placeholder="Nurse name/signature"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {editingId ? "Update" : "Save"} Entry
              </Button>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No nursing progress entries recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Date / Time</TableHead>
                  <TableHead>Progress Notes</TableHead>
                  <TableHead className="w-40">Signature & Name</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {entry.entryDateTime ? format(new Date(entry.entryDateTime), "dd MMM yyyy HH:mm") : "-"}
                    </TableCell>
                    <TableCell className="text-sm max-w-md">
                      <div className="line-clamp-2">{entry.progressNotes || "-"}</div>
                    </TableCell>
                    <TableCell className="text-sm">{entry.signatureName || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(entry)}><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(entry.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ========== NURSING ASSESSMENT & CARE PLAN TAB ==========
function NursingAssessmentCarePlanTab({ sessionId }: { sessionId: string }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(1);
  
  const defaultForm = {
    patientReceivedDate: new Date().toISOString().split('T')[0],
    patientReceivedTime: "",
    provisionalDiagnosis: "",
    generalConsentSigned: "Yes",
    modeOfAccess: "Walking",
    patientAccompanied: "No",
    accompaniedName: "",
    vulnerable: "No",
    relation: "",
    contactNo: "",
    allergies: JSON.stringify({ drug: "", food: "", other: "" }),
    temperature: "",
    pulse: "",
    breathsPerMin: "",
    bp: "",
    respiratoryRate: "",
    height: "",
    weight: "",
    patientHistory: JSON.stringify({
      hypertension: "No", diabetes: "No", coronaryArteryDisease: "No",
      cerebroVascularDisease: "No", copdBronchialAsthma: "No", tuberculosis: "No", anyOther: ""
    }),
    functionalStatus: JSON.stringify({
      walking: "Independent", eating: "Independent", bathing: "Independent",
      dressing: "Independent", toiletNeeds: "Independent"
    }),
    patientEnvironment: JSON.stringify([]),
    currentMedications: JSON.stringify([{ srNo: 1, name: "", dose: "", frequency: "", dateTimeLastDose: "" }]),
    medicinesBroughtToHospital: "No",
    medicinesDisposition: "",
    morseFallRiskScore: "",
    historyOfFall: "No",
    secondaryDiagnosis: "No",
    ambulatoryAid: "None",
    peripheryCentralLine: "No",
    gait: "No",
    mentalStatus: "Oriented to own ability",
    bradenScaleTotal: "",
    sensoryPerception: "4",
    degreeOfActivity: "4",
    nutrition: "4",
    moisture: "4",
    mobility: "4",
    shearFriction: "3",
    neurologicalReview: JSON.stringify({
      paralysis: "N", dizziness: "N", oriented: "Y", jointsStiffness: "N",
      tremors: "N", headache: "N", responsive: "Y", contractures: "N"
    }),
    cardiovascularReview: JSON.stringify({
      chestPain: "N", pulseRegular: "Y", pulseTone: "Y", painScore: "",
      hypertensive: "N", hypotensive: "N"
    }),
    urinaryReview: JSON.stringify({
      catheter: "N", incontinence: "N", frequency: "N", insertionDate: "",
      retention: "N", hematuria: "N"
    }),
    respiratoryReview: JSON.stringify({
      gasping: "N", tachypnoea: "N", dyspnea: "N", cough: "N",
      wheeze: "N", bradypnoea: "N", heamoptysis: "N", sputum: ""
    }),
    gastroIntestinalReview: JSON.stringify({
      constipation: "N", distention: "N", nausea: "N", laparotomy: "N", nbm: "N",
      diarrhoea: "N", tenderness: "N", vomiting: "N", colostomy: "N"
    }),
    skinReview: JSON.stringify({
      pale: "N", cyanotic: "N", dehydrated: "N", jaundice: "N", flushed: "N", normal: "Y"
    }),
    vision: "OK",
    hearing: "OK",
    languages: "",
    speech: "OK",
    obey: "OK",
    woundsUlcerBedSore: "No",
    woundsLocation: "",
    woundsStage: "",
    painScore: "0",
    patientDevices: JSON.stringify({
      centralLine: "N", urethralCatheter: "N", peripheralLine: "N",
      rt: "N", ventilation: "N", lanfusion: "N"
    }),
    nutritionalAssessment: JSON.stringify({
      decreasedFoodIntake: "3", weightLoss: "3", motility: "3", hospitalisation: "3"
    }),
    nutritionalScore: "",
    personalHygiene: JSON.stringify({ bedBath: { m: "", e: "", n: "" }, hairWash: { m: "", e: "", n: "" }, eyeCare: { m: "", e: "", n: "" } }),
    dressingChange: "",
    ivFluide: "",
    injection: "",
    medicine: "",
    investigation: "",
    bloodGroup: "",
    previousBTReceived: "No",
    btStartTime: "",
    btFinishTime: "",
    btName: "",
    btStaffNurse: "",
    btRmoName: "",
    nursingCareShifts: JSON.stringify({}),
    nursingObservations: "",
    nursingIntervention: "",
    specificNeedsRemarks: "",
    admittingStaffNurse: "",
    empId: "",
    assessmentCompletingDate: new Date().toISOString().split('T')[0],
    assessmentCompletingTime: "",
    signature: ""
  };
  
  const [form, setForm] = useState<Record<string, any>>(defaultForm);

  const { data: records = [], refetch, isLoading } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/nursing-assessment/${sessionId}`],
    enabled: !!sessionId
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/nursing-assessment", data),
    onSuccess: () => { 
      refetch(); 
      toast({ title: "Assessment Saved", description: "Nursing Assessment & Care Plan saved successfully" });
      setForm(defaultForm);
      setDialogOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to save assessment", variant: "destructive" });
    }
  });

  const handleSave = () => {
    saveMutation.mutate({ sessionId, ...form });
  };

  const updateJsonField = (fieldName: string, key: string, value: any) => {
    try {
      const current = JSON.parse(form[fieldName] || '{}');
      current[key] = value;
      setForm({ ...form, [fieldName]: JSON.stringify(current) });
    } catch {
      setForm({ ...form, [fieldName]: JSON.stringify({ [key]: value }) });
    }
  };

  const getJsonValue = (fieldName: string, key: string) => {
    try {
      const parsed = JSON.parse(form[fieldName] || '{}');
      return parsed[key] || "";
    } catch {
      return "";
    }
  };

  const handlePrint = (record?: any) => {
    const data = record || (records.length > 0 ? records[0] : null);
    if (!data) return;
    
    const parseJson = (str: string) => {
      try { return JSON.parse(str || '{}'); } catch { return {}; }
    };
    
    const patientHistory = parseJson(data.patientHistory);
    const functionalStatus = parseJson(data.functionalStatus);
    const allergies = parseJson(data.allergies);
    const currentMedications = parseJson(data.currentMedications) || [];
    const neurologicalReview = parseJson(data.neurologicalReview);
    const cardiovascularReview = parseJson(data.cardiovascularReview);
    const urinaryReview = parseJson(data.urinaryReview);
    const respiratoryReview = parseJson(data.respiratoryReview);
    const gastroIntestinalReview = parseJson(data.gastroIntestinalReview);
    const skinReview = parseJson(data.skinReview);
    const patientDevices = parseJson(data.patientDevices);
    const nutritionalAssessment = parseJson(data.nutritionalAssessment);
    const personalHygiene = parseJson(data.personalHygiene);
    const nursingCareShifts = parseJson(data.nursingCareShifts);

    const content = `
      <h1 style="text-align:center;background:#333;color:#fff;padding:8px;margin-bottom:15px;">IPD NURSING ASSESSMENT & CARE PLAN</h1>
      
      <h3 style="background:#e5e5e5;padding:5px 10px;margin:10px 0;">General Information</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:15px;">
        <tr><td style="border:1px solid #333;padding:5px;width:25%"><strong>Patient Received Date:</strong></td><td style="border:1px solid #333;padding:5px;width:25%">${data.patientReceivedDate ? format(new Date(data.patientReceivedDate), 'dd/MM/yyyy') : '-'}</td>
            <td style="border:1px solid #333;padding:5px;width:25%"><strong>Time:</strong></td><td style="border:1px solid #333;padding:5px;width:25%">${data.patientReceivedTime || '-'}</td></tr>
        <tr><td style="border:1px solid #333;padding:5px"><strong>Provisional Diagnosis:</strong></td><td colspan="3" style="border:1px solid #333;padding:5px">${data.provisionalDiagnosis || '-'}</td></tr>
        <tr><td style="border:1px solid #333;padding:5px"><strong>General Consent Signed:</strong></td><td style="border:1px solid #333;padding:5px">${data.generalConsentSigned || '-'}</td>
            <td style="border:1px solid #333;padding:5px"><strong>Mode of Access:</strong></td><td style="border:1px solid #333;padding:5px">${data.modeOfAccess || '-'}</td></tr>
        <tr><td style="border:1px solid #333;padding:5px"><strong>Patient Accompanied:</strong></td><td style="border:1px solid #333;padding:5px">${data.patientAccompanied || '-'}</td>
            <td style="border:1px solid #333;padding:5px"><strong>If yes, Name:</strong></td><td style="border:1px solid #333;padding:5px">${data.accompaniedName || '-'}</td></tr>
        <tr><td style="border:1px solid #333;padding:5px"><strong>Vulnerable:</strong></td><td style="border:1px solid #333;padding:5px">${data.vulnerable || '-'}</td>
            <td style="border:1px solid #333;padding:5px"><strong>Relation:</strong></td><td style="border:1px solid #333;padding:5px">${data.relation || '-'}</td></tr>
        <tr><td style="border:1px solid #333;padding:5px"><strong>Contact No:</strong></td><td style="border:1px solid #333;padding:5px">${data.contactNo || '-'}</td>
            <td style="border:1px solid #333;padding:5px"><strong>Allergies:</strong></td><td style="border:1px solid #333;padding:5px">Drug: ${allergies.drug || '-'}, Food: ${allergies.food || '-'}, Other: ${allergies.other || '-'}</td></tr>
      </table>
      
      <h4 style="margin:10px 0;">Vital Signs</h4>
      <table style="width:100%;border-collapse:collapse;margin-bottom:15px;">
        <tr><td style="border:1px solid #333;padding:5px"><strong>TEMP:</strong> ${data.temperature || '-'} °F</td>
            <td style="border:1px solid #333;padding:5px"><strong>Pulse:</strong> ${data.pulse || '-'}</td>
            <td style="border:1px solid #333;padding:5px"><strong>Breaths/min:</strong> ${data.breathsPerMin || '-'}</td>
            <td style="border:1px solid #333;padding:5px"><strong>BP:</strong> ${data.bp || '-'} mmHg</td>
            <td style="border:1px solid #333;padding:5px"><strong>HT:</strong> ${data.height || '-'} CM</td>
            <td style="border:1px solid #333;padding:5px"><strong>WT:</strong> ${data.weight || '-'} Kg</td></tr>
      </table>

      <div style="display:flex;gap:20px;margin-bottom:15px;">
        <div style="flex:1;">
          <h4 style="margin:10px 0;">A. Patient History</h4>
          <table style="width:100%;border-collapse:collapse;">
            <tr><th style="border:1px solid #333;padding:5px;text-align:left;">Condition</th><th style="border:1px solid #333;padding:5px;width:50px;">YES</th><th style="border:1px solid #333;padding:5px;width:50px;">NO</th></tr>
            <tr><td style="border:1px solid #333;padding:5px;">1. Hypertension</td><td style="border:1px solid #333;padding:5px;text-align:center;">${patientHistory.hypertension === 'Yes' ? '✓' : ''}</td><td style="border:1px solid #333;padding:5px;text-align:center;">${patientHistory.hypertension === 'No' ? '✓' : ''}</td></tr>
            <tr><td style="border:1px solid #333;padding:5px;">2. Diabetes</td><td style="border:1px solid #333;padding:5px;text-align:center;">${patientHistory.diabetes === 'Yes' ? '✓' : ''}</td><td style="border:1px solid #333;padding:5px;text-align:center;">${patientHistory.diabetes === 'No' ? '✓' : ''}</td></tr>
            <tr><td style="border:1px solid #333;padding:5px;">3. Coronary Artery Disease</td><td style="border:1px solid #333;padding:5px;text-align:center;">${patientHistory.coronaryArteryDisease === 'Yes' ? '✓' : ''}</td><td style="border:1px solid #333;padding:5px;text-align:center;">${patientHistory.coronaryArteryDisease === 'No' ? '✓' : ''}</td></tr>
            <tr><td style="border:1px solid #333;padding:5px;">4. Cerebro Vascular Disease</td><td style="border:1px solid #333;padding:5px;text-align:center;">${patientHistory.cerebroVascularDisease === 'Yes' ? '✓' : ''}</td><td style="border:1px solid #333;padding:5px;text-align:center;">${patientHistory.cerebroVascularDisease === 'No' ? '✓' : ''}</td></tr>
            <tr><td style="border:1px solid #333;padding:5px;">5. COPD / Bronchial Asthma</td><td style="border:1px solid #333;padding:5px;text-align:center;">${patientHistory.copdBronchialAsthma === 'Yes' ? '✓' : ''}</td><td style="border:1px solid #333;padding:5px;text-align:center;">${patientHistory.copdBronchialAsthma === 'No' ? '✓' : ''}</td></tr>
            <tr><td style="border:1px solid #333;padding:5px;">6. Tuberculosis</td><td style="border:1px solid #333;padding:5px;text-align:center;">${patientHistory.tuberculosis === 'Yes' ? '✓' : ''}</td><td style="border:1px solid #333;padding:5px;text-align:center;">${patientHistory.tuberculosis === 'No' ? '✓' : ''}</td></tr>
            <tr><td style="border:1px solid #333;padding:5px;">7. Any Other</td><td colspan="2" style="border:1px solid #333;padding:5px;">${patientHistory.anyOther || '-'}</td></tr>
          </table>
        </div>
        <div style="flex:1;">
          <h4 style="margin:10px 0;">B. Functional</h4>
          <table style="width:100%;border-collapse:collapse;">
            <tr><th style="border:1px solid #333;padding:5px;text-align:left;">Activity</th><th style="border:1px solid #333;padding:5px;">Independent</th><th style="border:1px solid #333;padding:5px;">Assistance</th><th style="border:1px solid #333;padding:5px;">Dependent</th></tr>
            <tr><td style="border:1px solid #333;padding:5px;">Walking</td><td style="border:1px solid #333;padding:5px;text-align:center;">${functionalStatus.walking === 'Independent' ? '✓' : ''}</td><td style="border:1px solid #333;padding:5px;text-align:center;">${functionalStatus.walking === 'Assistance' ? '✓' : ''}</td><td style="border:1px solid #333;padding:5px;text-align:center;">${functionalStatus.walking === 'Dependent' ? '✓' : ''}</td></tr>
            <tr><td style="border:1px solid #333;padding:5px;">Eating</td><td style="border:1px solid #333;padding:5px;text-align:center;">${functionalStatus.eating === 'Independent' ? '✓' : ''}</td><td style="border:1px solid #333;padding:5px;text-align:center;">${functionalStatus.eating === 'Assistance' ? '✓' : ''}</td><td style="border:1px solid #333;padding:5px;text-align:center;">${functionalStatus.eating === 'Dependent' ? '✓' : ''}</td></tr>
            <tr><td style="border:1px solid #333;padding:5px;">Bathing</td><td style="border:1px solid #333;padding:5px;text-align:center;">${functionalStatus.bathing === 'Independent' ? '✓' : ''}</td><td style="border:1px solid #333;padding:5px;text-align:center;">${functionalStatus.bathing === 'Assistance' ? '✓' : ''}</td><td style="border:1px solid #333;padding:5px;text-align:center;">${functionalStatus.bathing === 'Dependent' ? '✓' : ''}</td></tr>
            <tr><td style="border:1px solid #333;padding:5px;">Dressing</td><td style="border:1px solid #333;padding:5px;text-align:center;">${functionalStatus.dressing === 'Independent' ? '✓' : ''}</td><td style="border:1px solid #333;padding:5px;text-align:center;">${functionalStatus.dressing === 'Assistance' ? '✓' : ''}</td><td style="border:1px solid #333;padding:5px;text-align:center;">${functionalStatus.dressing === 'Dependent' ? '✓' : ''}</td></tr>
            <tr><td style="border:1px solid #333;padding:5px;">Toilet Needs</td><td style="border:1px solid #333;padding:5px;text-align:center;">${functionalStatus.toiletNeeds === 'Independent' ? '✓' : ''}</td><td style="border:1px solid #333;padding:5px;text-align:center;">${functionalStatus.toiletNeeds === 'Assistance' ? '✓' : ''}</td><td style="border:1px solid #333;padding:5px;text-align:center;">${functionalStatus.toiletNeeds === 'Dependent' ? '✓' : ''}</td></tr>
          </table>
        </div>
      </div>

      <p style="margin-bottom:15px;"><strong>Medicines brought to the hospital:</strong> ${data.medicinesBroughtToHospital || 'No'} | <strong>Disposition:</strong> ${data.medicinesDisposition || '-'}</p>

      <div style="page-break-before:always;"></div>
      <h3 style="background:#e5e5e5;padding:5px 10px;margin:10px 0;">MORSE FALL RISK ASSESSMENT : TOTAL SCORE: ${data.morseFallRiskScore || '-'}</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:15px;">
        <tr><th style="border:1px solid #333;padding:5px;">Risk Factor</th><th style="border:1px solid #333;padding:5px;">Value</th><th style="border:1px solid #333;padding:5px;">Risk Factor</th><th style="border:1px solid #333;padding:5px;">Value</th></tr>
        <tr><td style="border:1px solid #333;padding:5px;">History of Fall</td><td style="border:1px solid #333;padding:5px;">${data.historyOfFall || '-'}</td>
            <td style="border:1px solid #333;padding:5px;">Periphery/Central Line</td><td style="border:1px solid #333;padding:5px;">${data.peripheryCentralLine || '-'}</td></tr>
        <tr><td style="border:1px solid #333;padding:5px;">Secondary Diagnosis</td><td style="border:1px solid #333;padding:5px;">${data.secondaryDiagnosis || '-'}</td>
            <td style="border:1px solid #333;padding:5px;">Gait</td><td style="border:1px solid #333;padding:5px;">${data.gait || '-'}</td></tr>
        <tr><td style="border:1px solid #333;padding:5px;">Ambulatory Aid</td><td style="border:1px solid #333;padding:5px;">${data.ambulatoryAid || '-'}</td>
            <td style="border:1px solid #333;padding:5px;">Mental Status</td><td style="border:1px solid #333;padding:5px;">${data.mentalStatus || '-'}</td></tr>
      </table>

      <h4 style="margin:10px 0;">SKIN ASSESSMENT / BRADEN SCALE: TOTAL SCORE: ${data.bradenScaleTotal || '-'}</h4>
      <table style="width:100%;border-collapse:collapse;margin-bottom:15px;">
        <tr><td style="border:1px solid #333;padding:5px;"><strong>Sensory Perception:</strong> ${data.sensoryPerception || '-'}</td>
            <td style="border:1px solid #333;padding:5px;"><strong>Activity:</strong> ${data.degreeOfActivity || '-'}</td>
            <td style="border:1px solid #333;padding:5px;"><strong>Nutrition:</strong> ${data.nutrition || '-'}</td></tr>
        <tr><td style="border:1px solid #333;padding:5px;"><strong>Moisture:</strong> ${data.moisture || '-'}</td>
            <td style="border:1px solid #333;padding:5px;"><strong>Mobility:</strong> ${data.mobility || '-'}</td>
            <td style="border:1px solid #333;padding:5px;"><strong>Shear Friction:</strong> ${data.shearFriction || '-'}</td></tr>
      </table>

      <h4 style="margin:10px 0;">SYSTEMIC REVIEW</h4>
      <table style="width:100%;border-collapse:collapse;margin-bottom:15px;">
        <tr><th colspan="4" style="border:1px solid #333;padding:5px;background:#f0f0f0;">NEUROLOGICAL</th><th colspan="4" style="border:1px solid #333;padding:5px;background:#f0f0f0;">CARDIOVASCULAR</th></tr>
        <tr><td style="border:1px solid #333;padding:5px;">Paralysis</td><td style="border:1px solid #333;padding:5px;">${neurologicalReview.paralysis || '-'}</td>
            <td style="border:1px solid #333;padding:5px;">Tremors</td><td style="border:1px solid #333;padding:5px;">${neurologicalReview.tremors || '-'}</td>
            <td style="border:1px solid #333;padding:5px;">Chest Pain</td><td style="border:1px solid #333;padding:5px;">${cardiovascularReview.chestPain || '-'}</td>
            <td style="border:1px solid #333;padding:5px;">Hypertensive</td><td style="border:1px solid #333;padding:5px;">${cardiovascularReview.hypertensive || '-'}</td></tr>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:15px;">
        <tr><th colspan="4" style="border:1px solid #333;padding:5px;background:#f0f0f0;">URINARY</th><th colspan="4" style="border:1px solid #333;padding:5px;background:#f0f0f0;">RESPIRATORY</th></tr>
        <tr><td style="border:1px solid #333;padding:5px;">Catheter</td><td style="border:1px solid #333;padding:5px;">${urinaryReview.catheter || '-'}</td>
            <td style="border:1px solid #333;padding:5px;">Retention</td><td style="border:1px solid #333;padding:5px;">${urinaryReview.retention || '-'}</td>
            <td style="border:1px solid #333;padding:5px;">Gasping</td><td style="border:1px solid #333;padding:5px;">${respiratoryReview.gasping || '-'}</td>
            <td style="border:1px solid #333;padding:5px;">Wheeze</td><td style="border:1px solid #333;padding:5px;">${respiratoryReview.wheeze || '-'}</td></tr>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:15px;">
        <tr><th colspan="4" style="border:1px solid #333;padding:5px;background:#f0f0f0;">GASTRO-INTESTINAL</th><th colspan="4" style="border:1px solid #333;padding:5px;background:#f0f0f0;">SKIN</th></tr>
        <tr><td style="border:1px solid #333;padding:5px;">Constipation</td><td style="border:1px solid #333;padding:5px;">${gastroIntestinalReview.constipation || '-'}</td>
            <td style="border:1px solid #333;padding:5px;">Diarrhoea</td><td style="border:1px solid #333;padding:5px;">${gastroIntestinalReview.diarrhoea || '-'}</td>
            <td style="border:1px solid #333;padding:5px;">Pale</td><td style="border:1px solid #333;padding:5px;">${skinReview.pale || '-'}</td>
            <td style="border:1px solid #333;padding:5px;">Normal</td><td style="border:1px solid #333;padding:5px;">${skinReview.normal || '-'}</td></tr>
      </table>

      <div style="page-break-before:always;"></div>
      <h3 style="background:#e5e5e5;padding:5px 10px;margin:10px 0;">COMMUNICATION & WOUNDS</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:15px;">
        <tr><td style="border:1px solid #333;padding:5px;"><strong>Vision:</strong> ${data.vision || '-'}</td>
            <td style="border:1px solid #333;padding:5px;"><strong>Hearing:</strong> ${data.hearing || '-'}</td>
            <td style="border:1px solid #333;padding:5px;"><strong>Speech:</strong> ${data.speech || '-'}</td>
            <td style="border:1px solid #333;padding:5px;"><strong>Obey:</strong> ${data.obey || '-'}</td>
            <td style="border:1px solid #333;padding:5px;"><strong>Languages:</strong> ${data.languages || '-'}</td></tr>
        <tr><td style="border:1px solid #333;padding:5px;"><strong>Ulcer/Bed Sore:</strong> ${data.woundsUlcerBedSore || '-'}</td>
            <td style="border:1px solid #333;padding:5px;"><strong>Location:</strong> ${data.woundsLocation || '-'}</td>
            <td style="border:1px solid #333;padding:5px;"><strong>Stage:</strong> ${data.woundsStage || '-'}</td>
            <td colspan="2" style="border:1px solid #333;padding:5px;"><strong>Pain Score:</strong> ${data.painScore || '0'}</td></tr>
      </table>

      <h4 style="margin:10px 0;">PATIENTS HAVING DEVICES</h4>
      <table style="width:100%;border-collapse:collapse;margin-bottom:15px;">
        <tr><td style="border:1px solid #333;padding:5px;">Central Line: ${patientDevices.centralLine || '-'}</td>
            <td style="border:1px solid #333;padding:5px;">Urethral Catheter: ${patientDevices.urethralCatheter || '-'}</td>
            <td style="border:1px solid #333;padding:5px;">Peripheral Line: ${patientDevices.peripheralLine || '-'}</td></tr>
        <tr><td style="border:1px solid #333;padding:5px;">RT: ${patientDevices.rt || '-'}</td>
            <td style="border:1px solid #333;padding:5px;">Ventilation: ${patientDevices.ventilation || '-'}</td>
            <td style="border:1px solid #333;padding:5px;">Lanfusion: ${patientDevices.lanfusion || '-'}</td></tr>
      </table>

      <h4 style="margin:10px 0;">NUTRITIONAL ASSESSMENT</h4>
      <table style="width:100%;border-collapse:collapse;margin-bottom:15px;">
        <tr><th style="border:1px solid #333;padding:5px;">Criteria</th><th style="border:1px solid #333;padding:5px;">Score</th></tr>
        <tr><td style="border:1px solid #333;padding:5px;">Decreased food intake</td><td style="border:1px solid #333;padding:5px;">${nutritionalAssessment.decreasedFoodIntake || '-'}</td></tr>
        <tr><td style="border:1px solid #333;padding:5px;">Weight Loss</td><td style="border:1px solid #333;padding:5px;">${nutritionalAssessment.weightLoss || '-'}</td></tr>
        <tr><td style="border:1px solid #333;padding:5px;">Motility</td><td style="border:1px solid #333;padding:5px;">${nutritionalAssessment.motility || '-'}</td></tr>
        <tr><td style="border:1px solid #333;padding:5px;">Hospitalisation</td><td style="border:1px solid #333;padding:5px;">${nutritionalAssessment.hospitalisation || '-'}</td></tr>
        <tr><td style="border:1px solid #333;padding:5px;"><strong>Total Score</strong></td><td style="border:1px solid #333;padding:5px;"><strong>${data.nutritionalScore || '-'}</strong></td></tr>
      </table>

      <h4 style="margin:10px 0;">BLOOD TRANSFUSION</h4>
      <table style="width:100%;border-collapse:collapse;margin-bottom:15px;">
        <tr><td style="border:1px solid #333;padding:5px"><strong>Blood Group:</strong> ${data.bloodGroup || '-'}</td>
            <td style="border:1px solid #333;padding:5px"><strong>Previous BT:</strong> ${data.previousBTReceived || '-'}</td>
            <td style="border:1px solid #333;padding:5px"><strong>BT Start:</strong> ${data.btStartTime || '-'}</td>
            <td style="border:1px solid #333;padding:5px"><strong>BT Finish:</strong> ${data.btFinishTime || '-'}</td></tr>
        <tr><td style="border:1px solid #333;padding:5px"><strong>Name:</strong> ${data.btName || '-'}</td>
            <td style="border:1px solid #333;padding:5px"><strong>Staff Nurse:</strong> ${data.btStaffNurse || '-'}</td>
            <td colspan="2" style="border:1px solid #333;padding:5px"><strong>RMO Name:</strong> ${data.btRmoName || '-'}</td></tr>
      </table>

      <div style="page-break-before:always;"></div>
      <h3 style="background:#e5e5e5;padding:5px 10px;margin:10px 0;">NURSING CARE & OBSERVATIONS</h3>
      
      <h4 style="margin:10px 0;">Nursing Observations:</h4>
      <div style="border:1px solid #333;padding:10px;min-height:80px;margin-bottom:15px;">${data.nursingObservations || '-'}</div>
      
      <h4 style="margin:10px 0;">Nursing Intervention:</h4>
      <div style="border:1px solid #333;padding:10px;min-height:80px;margin-bottom:15px;">${data.nursingIntervention || '-'}</div>
      
      <h4 style="margin:10px 0;">Any Specific Needs / Remarks:</h4>
      <div style="border:1px solid #333;padding:10px;min-height:80px;margin-bottom:15px;">${data.specificNeedsRemarks || '-'}</div>

      <table style="width:100%;border-collapse:collapse;margin-top:20px;">
        <tr><td style="border:1px solid #333;padding:10px;width:50%"><strong>Name of Admitting Staff Nurse:</strong> ${data.admittingStaffNurse || '-'}</td>
            <td style="border:1px solid #333;padding:10px"><strong>Emp ID:</strong> ${data.empId || '-'}</td></tr>
        <tr><td style="border:1px solid #333;padding:10px"><strong>Assessment Date:</strong> ${data.assessmentCompletingDate ? format(new Date(data.assessmentCompletingDate), 'dd/MM/yyyy') : '-'}</td>
            <td style="border:1px solid #333;padding:10px"><strong>Time:</strong> ${data.assessmentCompletingTime || '-'}</td></tr>
        <tr><td colspan="2" style="border:1px solid #333;padding:10px;text-align:right;"><strong>Sign:</strong> ${data.signature || '_________________'}</td></tr>
      </table>
      <p style="text-align:right;font-size:10px;margin-top:10px;">IH/Nursing/F-01.00</p>
    `;
    openPrintWindow('Nursing Assessment & Care Plan', content);
  };

  const renderSection1 = () => (
    <div className="space-y-4">
      <h4 className="font-semibold text-lg border-b pb-2">General Information</h4>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Patient Received Date</Label><Input type="date" value={form.patientReceivedDate} onChange={e => setForm({...form, patientReceivedDate: e.target.value})} /></div>
        <div><Label>Time</Label><Input type="time" value={form.patientReceivedTime} onChange={e => setForm({...form, patientReceivedTime: e.target.value})} /></div>
        <div><Label>General Consent Signed</Label>
          <Select value={form.generalConsentSigned} onValueChange={v => setForm({...form, generalConsentSigned: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Provisional Diagnosis</Label><Input value={form.provisionalDiagnosis} onChange={e => setForm({...form, provisionalDiagnosis: e.target.value})} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Mode of Access</Label>
          <Select value={form.modeOfAccess} onValueChange={v => setForm({...form, modeOfAccess: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Walking">Walking</SelectItem><SelectItem value="Wheelchairs">Wheelchairs</SelectItem><SelectItem value="Stretchers">Stretchers</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Patient Accompanied</Label>
          <Select value={form.patientAccompanied} onValueChange={v => setForm({...form, patientAccompanied: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>If yes, Name</Label><Input value={form.accompaniedName} onChange={e => setForm({...form, accompaniedName: e.target.value})} /></div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div><Label>Vulnerable</Label>
          <Select value={form.vulnerable} onValueChange={v => setForm({...form, vulnerable: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Relation</Label><Input value={form.relation} onChange={e => setForm({...form, relation: e.target.value})} /></div>
        <div><Label>Contact No</Label><Input value={form.contactNo} onChange={e => setForm({...form, contactNo: e.target.value})} /></div>
      </div>
      
      <h4 className="font-semibold mt-4">Allergies</h4>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Drug</Label><Input value={getJsonValue('allergies', 'drug')} onChange={e => updateJsonField('allergies', 'drug', e.target.value)} /></div>
        <div><Label>Food</Label><Input value={getJsonValue('allergies', 'food')} onChange={e => updateJsonField('allergies', 'food', e.target.value)} /></div>
        <div><Label>Other</Label><Input value={getJsonValue('allergies', 'other')} onChange={e => updateJsonField('allergies', 'other', e.target.value)} /></div>
      </div>

      <h4 className="font-semibold mt-4">Vital Signs</h4>
      <div className="grid grid-cols-4 gap-3">
        <div><Label>TEMP (°F)</Label><Input value={form.temperature} onChange={e => setForm({...form, temperature: e.target.value})} /></div>
        <div><Label>Pulse</Label><Input value={form.pulse} onChange={e => setForm({...form, pulse: e.target.value})} /></div>
        <div><Label>Breaths/min</Label><Input value={form.breathsPerMin} onChange={e => setForm({...form, breathsPerMin: e.target.value})} /></div>
        <div><Label>BP (mmHg)</Label><Input value={form.bp} onChange={e => setForm({...form, bp: e.target.value})} /></div>
        <div><Label>HT (CM)</Label><Input value={form.height} onChange={e => setForm({...form, height: e.target.value})} /></div>
        <div><Label>WT (Kg)</Label><Input value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} /></div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <h4 className="font-semibold mb-2">A. Patient History</h4>
          {['hypertension', 'diabetes', 'coronaryArteryDisease', 'cerebroVascularDisease', 'copdBronchialAsthma', 'tuberculosis'].map((condition, idx) => (
            <div key={condition} className="flex items-center gap-2 mb-1">
              <span className="w-48 text-sm">{idx + 1}. {condition.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
              <Select value={getJsonValue('patientHistory', condition)} onValueChange={v => updateJsonField('patientHistory', condition, v)}>
                <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-1">
            <span className="w-48 text-sm">7. Any Other:</span>
            <Input className="h-8" value={getJsonValue('patientHistory', 'anyOther')} onChange={e => updateJsonField('patientHistory', 'anyOther', e.target.value)} />
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">B. Functional</h4>
          {['walking', 'eating', 'bathing', 'dressing', 'toiletNeeds'].map(activity => (
            <div key={activity} className="flex items-center gap-2 mb-1">
              <span className="w-24 text-sm">{activity.charAt(0).toUpperCase() + activity.slice(1)}</span>
              <Select value={getJsonValue('functionalStatus', activity)} onValueChange={v => updateJsonField('functionalStatus', activity, v)}>
                <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Independent">Independent</SelectItem><SelectItem value="Assistance">Assistance</SelectItem><SelectItem value="Dependent">Dependent</SelectItem></SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div><Label>Medicines brought to hospital</Label>
          <Select value={form.medicinesBroughtToHospital} onValueChange={v => setForm({...form, medicinesBroughtToHospital: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Disposition</Label>
          <Select value={form.medicinesDisposition} onValueChange={v => setForm({...form, medicinesDisposition: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Sent Home">Sent Home</SelectItem><SelectItem value="Other Placement">Other Placement</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderSection2 = () => (
    <div className="space-y-4">
      <h4 className="font-semibold text-lg border-b pb-2">MORSE FALL RISK ASSESSMENT</h4>
      <p className="text-sm text-muted-foreground">High Risk - 45, Moderate Risk: 25-44, Low Risk: 0-24</p>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Total Score</Label><Input value={form.morseFallRiskScore} onChange={e => setForm({...form, morseFallRiskScore: e.target.value})} /></div>
        <div><Label>History of Fall</Label>
          <Select value={form.historyOfFall} onValueChange={v => setForm({...form, historyOfFall: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Yes">Yes (25)</SelectItem><SelectItem value="No">No (0)</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Secondary Diagnosis</Label>
          <Select value={form.secondaryDiagnosis} onValueChange={v => setForm({...form, secondaryDiagnosis: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Yes">Yes (15)</SelectItem><SelectItem value="No">No (0)</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Ambulatory Aid</Label>
          <Select value={form.ambulatoryAid} onValueChange={v => setForm({...form, ambulatoryAid: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Furniture">Furniture</SelectItem><SelectItem value="Crutches/cane/walker">Crutches/cane/walker</SelectItem><SelectItem value="None">None</SelectItem><SelectItem value="Bed Rest">Bed Rest</SelectItem><SelectItem value="Wheelchair">Wheelchair</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Periphery/Central Line</Label>
          <Select value={form.peripheryCentralLine} onValueChange={v => setForm({...form, peripheryCentralLine: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Yes">Yes (20)</SelectItem><SelectItem value="No">No (0)</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Gait</Label>
          <Select value={form.gait} onValueChange={v => setForm({...form, gait: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="No">No (0)</SelectItem><SelectItem value="Impaired">Impaired (20)</SelectItem><SelectItem value="Weak">Weak (10)</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Mental Status</Label>
          <Select value={form.mentalStatus} onValueChange={v => setForm({...form, mentalStatus: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Normal/Bed rest/immobile">Normal/Bed rest/immobile</SelectItem><SelectItem value="Gesture Limitations">Gesture Limitations</SelectItem><SelectItem value="Oriented to own ability">Oriented to own ability</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      <h4 className="font-semibold text-lg border-b pb-2 mt-6">SKIN ASSESSMENT / BRADEN SCALE</h4>
      <div className="grid grid-cols-4 gap-3">
        <div><Label>Total Score</Label><Input value={form.bradenScaleTotal} onChange={e => setForm({...form, bradenScaleTotal: e.target.value})} /></div>
        <div><Label>Sensory Perception (1-4)</Label>
          <Select value={form.sensoryPerception} onValueChange={v => setForm({...form, sensoryPerception: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="4">4-No Impairment</SelectItem><SelectItem value="3">3-Slightly Limited</SelectItem><SelectItem value="2">2-Very Limited</SelectItem><SelectItem value="1">1-Completed Limited</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Degree of Activity (1-4)</Label>
          <Select value={form.degreeOfActivity} onValueChange={v => setForm({...form, degreeOfActivity: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="4">4-Walks Frequently</SelectItem><SelectItem value="3">3-Walks Occasionally</SelectItem><SelectItem value="2">2-Chair Fast</SelectItem><SelectItem value="1">1-Bed Fast</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Nutrition (1-4)</Label>
          <Select value={form.nutrition} onValueChange={v => setForm({...form, nutrition: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="4">4-Excellent</SelectItem><SelectItem value="3">3-Adequate</SelectItem><SelectItem value="2">2-In-Adequate</SelectItem><SelectItem value="1">1-Very Poor</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Moisture (1-4)</Label>
          <Select value={form.moisture} onValueChange={v => setForm({...form, moisture: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="4">4-Rarely Moist</SelectItem><SelectItem value="3">3-Occasionally Moist</SelectItem><SelectItem value="2">2-Very Moist</SelectItem><SelectItem value="1">1-Constantly Moist</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Mobility (1-4)</Label>
          <Select value={form.mobility} onValueChange={v => setForm({...form, mobility: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="4">4-No Limitation</SelectItem><SelectItem value="3">3-Slightly Limited</SelectItem><SelectItem value="2">2-Very Limited</SelectItem><SelectItem value="1">1-Completely Immobile</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Shear Friction (1-3)</Label>
          <Select value={form.shearFriction} onValueChange={v => setForm({...form, shearFriction: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="3">3-No Problem Apparent</SelectItem><SelectItem value="2">2-Potential Problem</SelectItem><SelectItem value="1">1-Problem Present</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      <h4 className="font-semibold text-lg border-b pb-2 mt-6">SYSTEMIC REVIEW</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h5 className="font-medium mb-2">Neurological (Y/N)</h5>
          <div className="grid grid-cols-2 gap-2">
            {['paralysis', 'dizziness', 'oriented', 'jointsStiffness', 'tremors', 'headache', 'responsive', 'contractures'].map(item => (
              <div key={item} className="flex items-center gap-1">
                <span className="text-sm w-24">{item.charAt(0).toUpperCase() + item.slice(1)}</span>
                <Select value={getJsonValue('neurologicalReview', item)} onValueChange={v => updateJsonField('neurologicalReview', item, v)}>
                  <SelectTrigger className="w-16 h-7"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Y">Y</SelectItem><SelectItem value="N">N</SelectItem></SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h5 className="font-medium mb-2">Cardiovascular (Y/N)</h5>
          <div className="grid grid-cols-2 gap-2">
            {['chestPain', 'pulseRegular', 'pulseTone', 'hypertensive', 'hypotensive'].map(item => (
              <div key={item} className="flex items-center gap-1">
                <span className="text-sm w-24">{item.replace(/([A-Z])/g, ' $1')}</span>
                <Select value={getJsonValue('cardiovascularReview', item)} onValueChange={v => updateJsonField('cardiovascularReview', item, v)}>
                  <SelectTrigger className="w-16 h-7"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Y">Y</SelectItem><SelectItem value="N">N</SelectItem></SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <h5 className="font-medium mb-2">Urinary (Y/N)</h5>
          <div className="grid grid-cols-2 gap-2">
            {['catheter', 'incontinence', 'frequency', 'retention', 'hematuria'].map(item => (
              <div key={item} className="flex items-center gap-1">
                <span className="text-sm w-24">{item.charAt(0).toUpperCase() + item.slice(1)}</span>
                <Select value={getJsonValue('urinaryReview', item)} onValueChange={v => updateJsonField('urinaryReview', item, v)}>
                  <SelectTrigger className="w-16 h-7"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Y">Y</SelectItem><SelectItem value="N">N</SelectItem></SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h5 className="font-medium mb-2">Respiratory (Y/N)</h5>
          <div className="grid grid-cols-2 gap-2">
            {['gasping', 'tachypnoea', 'dyspnea', 'cough', 'wheeze', 'bradypnoea', 'heamoptysis'].map(item => (
              <div key={item} className="flex items-center gap-1">
                <span className="text-sm w-24">{item.charAt(0).toUpperCase() + item.slice(1)}</span>
                <Select value={getJsonValue('respiratoryReview', item)} onValueChange={v => updateJsonField('respiratoryReview', item, v)}>
                  <SelectTrigger className="w-16 h-7"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Y">Y</SelectItem><SelectItem value="N">N</SelectItem></SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <h5 className="font-medium mb-2">Gastro-Intestinal (Y/N)</h5>
          <div className="grid grid-cols-2 gap-2">
            {['constipation', 'distention', 'nausea', 'laparotomy', 'nbm', 'diarrhoea', 'tenderness', 'vomiting', 'colostomy'].map(item => (
              <div key={item} className="flex items-center gap-1">
                <span className="text-sm w-24">{item.charAt(0).toUpperCase() + item.slice(1)}</span>
                <Select value={getJsonValue('gastroIntestinalReview', item)} onValueChange={v => updateJsonField('gastroIntestinalReview', item, v)}>
                  <SelectTrigger className="w-16 h-7"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Y">Y</SelectItem><SelectItem value="N">N</SelectItem></SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h5 className="font-medium mb-2">Skin (Y/N)</h5>
          <div className="grid grid-cols-2 gap-2">
            {['pale', 'cyanotic', 'dehydrated', 'jaundice', 'flushed', 'normal'].map(item => (
              <div key={item} className="flex items-center gap-1">
                <span className="text-sm w-24">{item.charAt(0).toUpperCase() + item.slice(1)}</span>
                <Select value={getJsonValue('skinReview', item)} onValueChange={v => updateJsonField('skinReview', item, v)}>
                  <SelectTrigger className="w-16 h-7"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Y">Y</SelectItem><SelectItem value="N">N</SelectItem></SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSection3 = () => (
    <div className="space-y-4">
      <h4 className="font-semibold text-lg border-b pb-2">COMMUNICATION</h4>
      <div className="grid grid-cols-5 gap-3">
        <div><Label>Vision</Label>
          <Select value={form.vision} onValueChange={v => setForm({...form, vision: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="OK">OK</SelectItem><SelectItem value="Impaired">Impaired</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Hearing</Label>
          <Select value={form.hearing} onValueChange={v => setForm({...form, hearing: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="OK">OK</SelectItem><SelectItem value="Impaired">Impaired</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Languages</Label><Input value={form.languages} onChange={e => setForm({...form, languages: e.target.value})} /></div>
        <div><Label>Speech</Label>
          <Select value={form.speech} onValueChange={v => setForm({...form, speech: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="OK">OK</SelectItem><SelectItem value="Impaired">Impaired</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Obey</Label>
          <Select value={form.obey} onValueChange={v => setForm({...form, obey: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="OK">OK</SelectItem><SelectItem value="Impaired">Impaired</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      <h4 className="font-semibold mt-4">WOUNDS</h4>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Ulcer/Bed Sore</Label>
          <Select value={form.woundsUlcerBedSore} onValueChange={v => setForm({...form, woundsUlcerBedSore: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Location</Label><Input value={form.woundsLocation} onChange={e => setForm({...form, woundsLocation: e.target.value})} /></div>
        <div><Label>Stage (1-4)</Label>
          <Select value={form.woundsStage} onValueChange={v => setForm({...form, woundsStage: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="1">Stage 1: Red Coloration</SelectItem><SelectItem value="2">Stage 2: Skin Break Only</SelectItem><SelectItem value="3">Stage 3: Fat Exposed</SelectItem><SelectItem value="4">Stage 4: Muscle/Bone Exposed</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      <h4 className="font-semibold mt-4">PAIN SCORE (0-10)</h4>
      <div className="w-48">
        <Select value={form.painScore} onValueChange={v => setForm({...form, painScore: v})}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{[0,1,2,3,4,5,6,7,8,9,10].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <h4 className="font-semibold mt-4">PATIENTS HAVING DEVICES (Y/N)</h4>
      <div className="grid grid-cols-3 gap-3">
        {['centralLine', 'urethralCatheter', 'peripheralLine', 'rt', 'ventilation', 'lanfusion'].map(device => (
          <div key={device} className="flex items-center gap-2">
            <span className="text-sm w-32">{device.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
            <Select value={getJsonValue('patientDevices', device)} onValueChange={v => updateJsonField('patientDevices', device, v)}>
              <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Y">Y</SelectItem><SelectItem value="N">N</SelectItem></SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <h4 className="font-semibold text-lg border-b pb-2 mt-6">NUTRITIONAL ASSESSMENT</h4>
      <div className="grid grid-cols-4 gap-3">
        <div><Label>Decreased food intake</Label>
          <Select value={getJsonValue('nutritionalAssessment', 'decreasedFoodIntake')} onValueChange={v => updateJsonField('nutritionalAssessment', 'decreasedFoodIntake', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="0">0-Severe Loss</SelectItem><SelectItem value="1">1-Moderate Loss</SelectItem><SelectItem value="2">2-Mild Loss</SelectItem><SelectItem value="3">3-No Loss</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Weight Loss</Label>
          <Select value={getJsonValue('nutritionalAssessment', 'weightLoss')} onValueChange={v => updateJsonField('nutritionalAssessment', 'weightLoss', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="0">0-&gt;5 Kg</SelectItem><SelectItem value="1">1-1 to 3 Kg</SelectItem><SelectItem value="2">2-Don't Know</SelectItem><SelectItem value="3">3-No Loss</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Motility</Label>
          <Select value={getJsonValue('nutritionalAssessment', 'motility')} onValueChange={v => updateJsonField('nutritionalAssessment', 'motility', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="0">0-Bed ridden</SelectItem><SelectItem value="1">1-Mobile With Assist</SelectItem><SelectItem value="2">2-Ambulatory</SelectItem><SelectItem value="3">3-Fully Mobile</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Hospitalisation</Label>
          <Select value={getJsonValue('nutritionalAssessment', 'hospitalisation')} onValueChange={v => updateJsonField('nutritionalAssessment', 'hospitalisation', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="0">0-Yes</SelectItem><SelectItem value="1">1-Taken OPD Rx</SelectItem><SelectItem value="3">3-No</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
      <div className="w-48 mt-2"><Label>Nutritional Score</Label><Input value={form.nutritionalScore} onChange={e => setForm({...form, nutritionalScore: e.target.value})} /></div>

      <h4 className="font-semibold mt-4">BLOOD TRANSFUSION</h4>
      <div className="grid grid-cols-4 gap-3">
        <div><Label>Blood Group</Label><Input value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup: e.target.value})} /></div>
        <div><Label>Previous BT Received</Label>
          <Select value={form.previousBTReceived} onValueChange={v => setForm({...form, previousBTReceived: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>BT Start Time</Label><Input type="time" value={form.btStartTime} onChange={e => setForm({...form, btStartTime: e.target.value})} /></div>
        <div><Label>BT Finish Time</Label><Input type="time" value={form.btFinishTime} onChange={e => setForm({...form, btFinishTime: e.target.value})} /></div>
        <div><Label>Name</Label><Input value={form.btName} onChange={e => setForm({...form, btName: e.target.value})} /></div>
        <div><Label>Staff Nurse</Label><Input value={form.btStaffNurse} onChange={e => setForm({...form, btStaffNurse: e.target.value})} /></div>
        <div><Label>RMO Name</Label><Input value={form.btRmoName} onChange={e => setForm({...form, btRmoName: e.target.value})} /></div>
      </div>
    </div>
  );

  const renderSection4 = () => (
    <div className="space-y-4">
      <h4 className="font-semibold text-lg border-b pb-2">NURSING CARE</h4>
      
      <h4 className="font-semibold mt-4">Nursing Observations</h4>
      <Textarea rows={4} value={form.nursingObservations} onChange={e => setForm({...form, nursingObservations: e.target.value})} placeholder="Enter nursing observations..." />
      
      <h4 className="font-semibold mt-4">Nursing Intervention</h4>
      <Textarea rows={4} value={form.nursingIntervention} onChange={e => setForm({...form, nursingIntervention: e.target.value})} placeholder="Enter nursing intervention..." />
      
      <h4 className="font-semibold mt-4">Any Specific Needs / Remarks</h4>
      <Textarea rows={4} value={form.specificNeedsRemarks} onChange={e => setForm({...form, specificNeedsRemarks: e.target.value})} placeholder="Enter specific needs or remarks..." />

      <h4 className="font-semibold text-lg border-b pb-2 mt-6">ASSESSMENT COMPLETION</h4>
      <div className="grid grid-cols-4 gap-3">
        <div><Label>Admitting Staff Nurse</Label><Input value={form.admittingStaffNurse} onChange={e => setForm({...form, admittingStaffNurse: e.target.value})} /></div>
        <div><Label>Emp ID</Label><Input value={form.empId} onChange={e => setForm({...form, empId: e.target.value})} /></div>
        <div><Label>Assessment Date</Label><Input type="date" value={form.assessmentCompletingDate} onChange={e => setForm({...form, assessmentCompletingDate: e.target.value})} /></div>
        <div><Label>Time</Label><Input type="time" value={form.assessmentCompletingTime} onChange={e => setForm({...form, assessmentCompletingTime: e.target.value})} /></div>
      </div>
      <div className="w-64"><Label>Signature</Label><Input value={form.signature} onChange={e => setForm({...form, signature: e.target.value})} /></div>
    </div>
  );

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-lg">Nursing Assessment & Care Plan</CardTitle>
        <div className="flex gap-2">
          {records.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => handlePrint()}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Assessment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>IPD Nursing Assessment & Care Plan</DialogTitle>
                <DialogDescription>Complete the comprehensive nursing assessment form</DialogDescription>
              </DialogHeader>
              <div className="flex gap-2 mb-4 border-b pb-2">
                <Button size="sm" variant={activeSection === 1 ? "default" : "outline"} onClick={() => setActiveSection(1)}>1. General Info</Button>
                <Button size="sm" variant={activeSection === 2 ? "default" : "outline"} onClick={() => setActiveSection(2)}>2. Risk Assessment</Button>
                <Button size="sm" variant={activeSection === 3 ? "default" : "outline"} onClick={() => setActiveSection(3)}>3. Care Documentation</Button>
                <Button size="sm" variant={activeSection === 4 ? "default" : "outline"} onClick={() => setActiveSection(4)}>4. Nursing Care</Button>
              </div>
              <ScrollArea className="h-[60vh] pr-4">
                {activeSection === 1 && renderSection1()}
                {activeSection === 2 && renderSection2()}
                {activeSection === 3 && renderSection3()}
                {activeSection === 4 && renderSection4()}
              </ScrollArea>
              <DialogFooter className="gap-2 mt-4">
                {activeSection > 1 && <Button variant="outline" onClick={() => setActiveSection(activeSection - 1)}>Previous</Button>}
                {activeSection < 4 && <Button variant="outline" onClick={() => setActiveSection(activeSection + 1)}>Next</Button>}
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Save Assessment"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : records.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No nursing assessments recorded</p>
        ) : (
          <div className="space-y-3">
            {records.map((record: any) => (
              <Card key={record.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Assessment Date: {record.assessmentCompletingDate ? format(new Date(record.assessmentCompletingDate), 'dd MMM yyyy') : format(new Date(record.createdAt), 'dd MMM yyyy')}</p>
                    <p className="text-sm text-muted-foreground">Diagnosis: {record.provisionalDiagnosis || '-'}</p>
                    <p className="text-sm text-muted-foreground">Staff Nurse: {record.admittingStaffNurse || '-'} | Emp ID: {record.empId || '-'}</p>
                    <div className="flex gap-4 mt-2">
                      <Badge variant="outline">Morse Fall Score: {record.morseFallRiskScore || '-'}</Badge>
                      <Badge variant="outline">Braden Score: {record.bradenScaleTotal || '-'}</Badge>
                      <Badge variant="outline">Pain Score: {record.painScore || '-'}</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handlePrint(record)}><Printer className="h-4 w-4 mr-1" /> Print</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
