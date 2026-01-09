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
  Beaker, Plus, CheckCircle, XCircle, Loader2
} from "lucide-react";

const HOUR_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
  "00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00"
];

const SHIFTS = ["MORNING", "EVENING", "NIGHT"] as const;
const WARDS = ["ICU", "MICU", "SICU", "NICU", "CCU", "GENERAL", "EMERGENCY", "OT", "RECOVERY", "HDU"] as const;

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showCalendar, setShowCalendar] = useState(true);
  const [newSessionData, setNewSessionData] = useState({
    patientId: "",
    patientName: "",
    uhid: "",
    age: 30,
    sex: "Male",
    admissionDateTime: new Date(),
    ward: "ICU",
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

  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ["/api/patients/service"]
  });

  const { data: doctors = [] } = useQuery<any[]>({
    queryKey: ["/api/doctors"]
  });

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

  const uniquePatients = Array.from(
    new Map(sessions.map(s => [s.patientId, { id: s.patientId, name: s.patientName, uhid: s.uhid }])).values()
  );

  const filteredSessions = sessions.filter(session => {
    const matchesPatient = selectedPatientFilter === "all" || session.patientId === selectedPatientFilter;
    const matchesDate = selectedDate ? isSameDay(parseISO(session.sessionDate), selectedDate) : false;
    return matchesPatient && matchesDate;
  });

  const sessionDates = sessions
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
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <div className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Hospital className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Patient Monitoring</h1>
              <p className="text-sm text-muted-foreground">ICU Chart & Nursing Workflow (NABH-Compliant)</p>
            </div>
          </div>
          <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-new-session">
                <PlusCircle className="h-4 w-4" /> New Session
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Start New Monitoring Session</DialogTitle>
              <DialogDescription>Create a 24-hour monitoring session for a patient</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-auto">
              <div className="space-y-2">
                <Label>Select Patient *</Label>
                <Select onValueChange={handlePatientSelect}>
                  <SelectTrigger data-testid="select-patient">
                    <SelectValue placeholder="Search patient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p: any) => {
                      const displayName = `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.name || 'Unknown Patient';
                      return (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {displayName} - {p.uhidNumber || p.phone || `ID: ${p.id.slice(0, 8)}`}
                        </SelectItem>
                      );
                    })}
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
                  <Select value={newSessionData.ward} onValueChange={(v) => setNewSessionData({...newSessionData, ward: v, bedNumber: ""})}>
                    <SelectTrigger data-testid="select-ward">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WARDS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bed Number *</Label>
                  <Select 
                    value={newSessionData.bedNumber} 
                    onValueChange={(v) => setNewSessionData({...newSessionData, bedNumber: v})}
                    disabled={loadingBeds}
                  >
                    <SelectTrigger data-testid="select-bed">
                      <SelectValue placeholder={loadingBeds ? "Loading beds..." : availableBeds.length === 0 ? "No available beds" : "Select bed"} />
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
                  {availableBeds.length > 0 && (
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
                disabled={!newSessionData.patientId || !newSessionData.bedNumber || !newSessionData.primaryDiagnosis || !newSessionData.admittingConsultant || createSessionMutation.isPending} 
                data-testid="button-create-session"
              >
                {createSessionMutation.isPending ? "Creating..." : "Start Session"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                onSelect={setSelectedDate}
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
        {!selectedDate ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <CalendarDays className="h-12 w-12 text-primary opacity-60" />
            </div>
            <h2 className="text-xl font-medium mb-2">Select a Date</h2>
            <p className="text-sm text-center max-w-md">
              Use the calendar above to select a date and view monitoring sessions for that day.
              <br />Highlighted dates have recorded sessions.
            </p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
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
        ) : !selectedSession ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
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
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2" 
                onClick={() => setSelectedSessionId(null)}
                data-testid="button-back-to-sessions"
              >
                <ArrowLeft className="h-4 w-4" /> Back to {format(selectedDate, "dd MMM")} Sessions
              </Button>
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
                onClick={() => {
                  const printContent = document.createElement('div');
                  printContent.innerHTML = `
                    <html>
                    <head>
                      <title>Patient Monitoring Report - ${selectedSession.patientName}</title>
                      <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { color: #1a365d; border-bottom: 2px solid #3182ce; padding-bottom: 10px; }
                        h2 { color: #2d3748; margin-top: 20px; }
                        .header { margin-bottom: 20px; }
                        .info-row { display: flex; gap: 20px; margin: 5px 0; }
                        .label { font-weight: bold; color: #4a5568; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
                        th { background: #edf2f7; }
                        @media print { body { print-color-adjust: exact; } }
                      </style>
                    </head>
                    <body>
                      <h1>Patient Monitoring Report</h1>
                      <div class="header">
                        <div class="info-row"><span class="label">Patient:</span> ${selectedSession.patientName}</div>
                        <div class="info-row"><span class="label">UHID:</span> ${selectedSession.uhid}</div>
                        <div class="info-row"><span class="label">Ward:</span> ${selectedSession.ward} - Bed ${selectedSession.bedNumber}</div>
                        <div class="info-row"><span class="label">Date:</span> ${format(new Date(selectedSession.sessionDate), "dd MMMM yyyy")}</div>
                        <div class="info-row"><span class="label">Diagnosis:</span> ${selectedSession.primaryDiagnosis || "Not recorded"}</div>
                        <div class="info-row"><span class="label">Consultant:</span> ${selectedSession.admittingConsultant || "Not assigned"}</div>
                        <div class="info-row"><span class="label">Ventilator:</span> ${selectedSession.isVentilated ? "Yes" : "No"}</div>
                      </div>
                      <p style="margin-top: 30px; color: #718096; font-size: 12px;">Generated on ${format(new Date(), "dd/MM/yyyy HH:mm")}</p>
                    </body>
                    </html>
                  `;
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(printContent.innerHTML);
                    printWindow.document.close();
                    printWindow.focus();
                    setTimeout(() => {
                      printWindow.print();
                    }, 250);
                  }
                  toast({ title: "Export Ready", description: "Print dialog opened for PDF export" });
                }}
                data-testid="button-export-pdf"
              >
                  <Download className="h-4 w-4" /> Export PDF
                </Button>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="inline-flex flex-wrap h-auto gap-1 p-1.5 bg-muted/50 rounded-lg">
                  <TabsTrigger value="overview" className="text-xs gap-1.5 data-[state=active]:bg-background"><Activity className="h-3.5 w-3.5" />Overview</TabsTrigger>
                  <TabsTrigger value="vitals" className="text-xs gap-1.5 data-[state=active]:bg-background"><Heart className="h-3.5 w-3.5" />Vitals</TabsTrigger>
                  <TabsTrigger value="inotropes" className="text-xs gap-1.5 data-[state=active]:bg-background"><Syringe className="h-3.5 w-3.5" />Inotropes</TabsTrigger>
                  <TabsTrigger value="ventilator" className="text-xs gap-1.5 data-[state=active]:bg-background"><Wind className="h-3.5 w-3.5" />Ventilator</TabsTrigger>
                  <TabsTrigger value="abg-lab" className="text-xs gap-1.5 data-[state=active]:bg-background"><FlaskConical className="h-3.5 w-3.5" />ABG/Lab</TabsTrigger>
                  <TabsTrigger value="intake" className="text-xs gap-1.5 data-[state=active]:bg-background"><Droplets className="h-3.5 w-3.5" />Intake</TabsTrigger>
                  <TabsTrigger value="output" className="text-xs gap-1.5 data-[state=active]:bg-background"><Droplets className="h-3.5 w-3.5" />Output</TabsTrigger>
                  <TabsTrigger value="diabetic" className="text-xs gap-1.5 data-[state=active]:bg-background"><Activity className="h-3.5 w-3.5" />Diabetic</TabsTrigger>
                  <TabsTrigger value="mar" className="text-xs gap-1.5 data-[state=active]:bg-background"><Pill className="h-3.5 w-3.5" />MAR</TabsTrigger>
                  <TabsTrigger value="once-only" className="text-xs gap-1.5 data-[state=active]:bg-background"><Pill className="h-3.5 w-3.5" />Once-Only</TabsTrigger>
                  <TabsTrigger value="notes" className="text-xs gap-1.5 data-[state=active]:bg-background"><FileText className="h-3.5 w-3.5" />Shift Notes</TabsTrigger>
                  <TabsTrigger value="airway" className="text-xs gap-1.5 data-[state=active]:bg-background"><BedDouble className="h-3.5 w-3.5" />Lines/Tubes</TabsTrigger>
                  <TabsTrigger value="staff" className="text-xs gap-1.5 data-[state=active]:bg-background"><Users className="h-3.5 w-3.5" />Duty Staff</TabsTrigger>
                  <TabsTrigger value="allergies" className="text-xs gap-1.5 data-[state=active]:bg-background"><AlertTriangle className="h-3.5 w-3.5" />Allergies</TabsTrigger>
                  <TabsTrigger value="tests" className="text-xs gap-1.5 data-[state=active]:bg-background"><Beaker className="h-3.5 w-3.5" />Tests</TabsTrigger>
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
                <TabsContent value="ventilator">
                  <VentilatorTab sessionId={selectedSession.id} isOnVentilator={selectedSession.isVentilated} />
                </TabsContent>
                <TabsContent value="abg-lab">
                  <ABGLabTab sessionId={selectedSession.id} />
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
                <TabsContent value="once-only">
                  <OnceOnlyTab sessionId={selectedSession.id} />
                </TabsContent>
                <TabsContent value="notes">
                  <ShiftNotesTab sessionId={selectedSession.id} />
                </TabsContent>
                <TabsContent value="airway">
                  <AirwayTab sessionId={selectedSession.id} />
                </TabsContent>
                <TabsContent value="staff">
                  <DutyStaffTab sessionId={selectedSession.id} />
                </TabsContent>
                <TabsContent value="allergies">
                  <AllergiesTab sessionId={selectedSession.id} />
                </TabsContent>
                <TabsContent value="tests">
                  <TestsTab sessionId={selectedSession.id} patientId={selectedSession.patientId} patientName={selectedSession.patientName} admittingConsultant={selectedSession.admittingConsultant} />
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 bg-blue-500/5">
          <CardTitle className="text-sm flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <div className="p-1.5 rounded-md bg-blue-500/10">
              <Info className="h-4 w-4" />
            </div>
            Session Info
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
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
            <span className="font-medium">{session.admittingConsultant}</span>
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
            Fluid Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Intake</span>
            <span className="font-medium">{fluidBalance?.totalIntake || 0} ml</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Output</span>
            <span className="font-medium">{fluidBalance?.totalOutput || 0} ml</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm items-center">
            <span className="text-muted-foreground">Net Balance</span>
            <span className={`font-bold ${(fluidBalance?.netBalance || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Record vitals in the Vitals tab</p>
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

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Hourly Vitals Chart (24 Hours)</CardTitle>
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
  const [form, setForm] = useState({ drugName: "", concentration: "", doseRate: "", pumpChannel: "" });

  const { data: records = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/inotropes/${sessionId}`]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/inotropes", data),
    onSuccess: () => { 
      refetch(); 
      toast({ title: "Inotrope Added", description: "Record saved successfully" }); 
      setForm({ drugName: "", concentration: "", doseRate: "", pumpChannel: "" });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save inotrope", variant: "destructive" });
    }
  });

  const handleSave = () => {
    saveMutation.mutate({ 
      sessionId, 
      drugName: form.drugName,
      concentration: form.concentration,
      rate: form.doseRate,
      startTime: new Date().toISOString(),
      nurseId: "system-nurse",
      nurseName: "ICU Nurse"
    });
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Inotropes & Sedation</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-inotrope"><PlusCircle className="h-4 w-4 mr-1" /> Add Drug</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Inotrope/Sedation</DialogTitle>
              <DialogDescription>Add drug infusion details</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Drug Name</Label><Input value={form.drugName} onChange={(e) => setForm({...form, drugName: e.target.value})} placeholder="e.g., Noradrenaline" /></div>
              <div><Label>Concentration</Label><Input value={form.concentration} onChange={(e) => setForm({...form, concentration: e.target.value})} placeholder="e.g., 8mg/50ml" /></div>
              <div><Label>Dose Rate</Label><Input value={form.doseRate} onChange={(e) => setForm({...form, doseRate: e.target.value})} placeholder="e.g., 0.1 mcg/kg/min" /></div>
              <div><Label>Pump Channel</Label><Input value={form.pumpChannel} onChange={(e) => setForm({...form, pumpChannel: e.target.value})} placeholder="e.g., Channel 1" /></div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={!form.drugName || saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No inotropes/sedation recorded</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drug</TableHead>
                <TableHead>Concentration</TableHead>
                <TableHead>Dose Rate</TableHead>
                <TableHead>Pump</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.drugName}</TableCell>
                  <TableCell>{r.concentration}</TableCell>
                  <TableCell>{r.doseRate}</TableCell>
                  <TableCell>{r.pumpChannel}</TableCell>
                  <TableCell className="text-xs">{format(new Date(r.createdAt), "HH:mm")}</TableCell>
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

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Intake Chart</CardTitle>
          <CardDescription>Total Intake: <span className="font-semibold text-primary">{fluidBalance?.totalIntake || 0} ml</span></CardDescription>
        </div>
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

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Output Chart</CardTitle>
          <CardDescription>Total Output: <span className="font-semibold text-primary">{fluidBalance?.totalOutput || 0} ml</span> | Net Balance: <span className={`font-semibold ${(fluidBalance?.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fluidBalance?.netBalance || 0} ml</span></CardDescription>
        </div>
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

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Diabetic Flow Chart</CardTitle>
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
  const [form, setForm] = useState({ medicineName: "", dose: "", route: "", frequency: "", scheduledTime: "" });

  const { data: records = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/mar/${sessionId}`]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/mar", data),
    onSuccess: () => { 
      refetch(); 
      toast({ title: "MAR Entry Added", description: "Medication recorded successfully" });
      setForm({ medicineName: "", dose: "", route: "", frequency: "", scheduledTime: "" });
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
      dose: form.dose,
      route: form.route,
      frequency: form.frequency || "1x",
      scheduledTime: new Date().toISOString(),
      status: "GIVEN",
      nurseId: "system-nurse",
      nurseName: "ICU Nurse"
    });
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Medication Administration Record (MAR)</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Medicine</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add MAR Entry</DialogTitle>
              <DialogDescription>Record medication administration</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Medicine Name</Label><Input value={form.medicineName} onChange={(e) => setForm({...form, medicineName: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Dose</Label><Input value={form.dose} onChange={(e) => setForm({...form, dose: e.target.value})} placeholder="e.g., 500mg" /></div>
                <div><Label>Route</Label>
                  <Select value={form.route} onValueChange={(v) => setForm({...form, route: v})}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {["Oral", "IV", "IM", "SC", "Topical", "Inhaled", "Rectal", "Sublingual"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Frequency</Label><Input value={form.frequency} onChange={(e) => setForm({...form, frequency: e.target.value})} placeholder="e.g., TDS, BD" /></div>
                <div><Label>Scheduled Time</Label>
                  <Select value={form.scheduledTime} onValueChange={(v) => setForm({...form, scheduledTime: v})}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{HOUR_SLOTS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={!form.medicineName || !form.dose || !form.route || saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No medications scheduled</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.medicineName}</TableCell>
                  <TableCell>{r.dose}</TableCell>
                  <TableCell>{r.route}</TableCell>
                  <TableCell>{r.frequency}</TableCell>
                  <TableCell>{r.scheduledTime}</TableCell>
                  <TableCell><Badge variant={r.status === "GIVEN" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
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
  const [form, setForm] = useState({ shift: "MORNING", noteType: "ASSESSMENT", noteContent: "" });

  const { data: records = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/shift-notes/${sessionId}`]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/shift-notes", data),
    onSuccess: () => { 
      refetch(); 
      toast({ title: "Shift Note Added", description: "Note saved successfully" }); 
      setForm({...form, noteContent: ""});
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
      nurseName: "ICU Nurse"
    });
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Nursing Shift Notes</CardTitle>
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
                  <span className="text-xs text-muted-foreground">{format(new Date(r.noteTime), "dd/MM HH:mm")} - {r.nurseName}</span>
                </div>
                <p className="text-sm">{r.noteContent}</p>
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
  const [form, setForm] = useState({ staffName: "", staffRole: "NURSE", shift: "MORNING" });

  const { data: records = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/duty-staff/${sessionId}`]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/duty-staff", data),
    onSuccess: () => { 
      refetch(); 
      toast({ title: "Staff Assignment Added", description: "Staff assigned successfully" });
      setForm({ staffName: "", staffRole: "NURSE", shift: "MORNING" });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to assign staff", variant: "destructive" });
    }
  });

  const handleSave = () => {
    saveMutation.mutate({ 
      sessionId, 
      shift: form.shift,
      nurseId: "staff-" + Date.now(),
      nurseName: form.staffName,
      shiftStartTime: new Date().toISOString()
    });
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Duty Staff Assignments</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Staff</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Duty Staff</DialogTitle>
              <DialogDescription>Add staff member to this shift</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Staff Name</Label><Input value={form.staffName} onChange={(e) => setForm({...form, staffName: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Role</Label>
                  <Select value={form.staffRole} onValueChange={(v) => setForm({...form, staffRole: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["NURSE", "DOCTOR", "RESIDENT", "INTERN", "TECHNICIAN"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Shift</Label>
                  <Select value={form.shift} onValueChange={(v) => setForm({...form, shift: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SHIFTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={!form.staffName || saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Assign"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No staff assigned</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SHIFTS.map(shift => (
              <Card key={shift} className="p-3">
                <h4 className="font-medium mb-2">{shift} Shift</h4>
                <div className="space-y-1">
                  {records.filter((r: any) => r.shift === shift).map((r: any) => (
                    <div key={r.id} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">{r.staffRole}</Badge>
                      <span>{r.staffName}</span>
                    </div>
                  ))}
                  {records.filter((r: any) => r.shift === shift).length === 0 && (
                    <p className="text-xs text-muted-foreground">No staff assigned</p>
                  )}
                </div>
              </Card>
            ))}
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

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Allergies & Precautions</CardTitle>
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
      { name: "Chest X-Ray (CXR)", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Scan - Head", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Scan - Chest", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Scan - Abdomen", type: "RADIOLOGY", department: "Radiology" },
      { name: "CT Pulmonary Angiography (CTPA)", type: "RADIOLOGY", department: "Radiology" },
      { name: "MRI Brain", type: "RADIOLOGY", department: "Radiology" },
      { name: "USG Abdomen", type: "RADIOLOGY", department: "Radiology" },
      { name: "2D Echocardiography", type: "RADIOLOGY", department: "Cardiology" },
      { name: "Bedside USG - POCUS", type: "RADIOLOGY", department: "ICU" },
      { name: "Portable X-Ray", type: "RADIOLOGY", department: "Radiology" },
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Beaker className="w-5 h-5 text-purple-500" />
          Diagnostic Tests
        </CardTitle>
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
      </CardContent>
    </Card>
  );
}
