import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Activity, Heart, Droplets, Thermometer, Clock, 
  FileText, Pill, AlertTriangle, Users, Shield,
  PlusCircle, RefreshCw, Download, Stethoscope,
  Wind, Syringe, FlaskConical, ClipboardList, Baby,
  BedDouble, FileCheck, Hospital, Timer, Info
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
  ipNumber: string;
  wardType: string;
  bedNumber: string;
  sessionDate: string;
  shift: string;
  attendingDoctorId?: string;
  primaryNurseId?: string;
  isOnVentilator: boolean;
  diagnosis?: string;
  sessionStatus: string;
  createdAt: string;
};

export default function PatientMonitoringPage() {
  const { toast } = useToast();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showNewSession, setShowNewSession] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    patientId: "",
    patientName: "",
    ipNumber: "",
    wardType: "ICU",
    bedNumber: "",
    sessionDate: format(new Date(), "yyyy-MM-dd"),
    shift: "MORNING",
    isOnVentilator: false,
    diagnosis: ""
  });

  const { data: sessions = [], isLoading: loadingSessions } = useQuery<Session[]>({
    queryKey: ["/api/patient-monitoring/sessions"]
  });

  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ["/api/patients/service"]
  });

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  const createSessionMutation = useMutation({
    mutationFn: (data: typeof newSessionData) => 
      apiRequest("POST", "/api/patient-monitoring/sessions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patient-monitoring/sessions"] });
      setShowNewSession(false);
      toast({ title: "Session Created", description: "New monitoring session started" });
    }
  });

  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find((p: any) => p.id.toString() === patientId);
    if (patient) {
      const patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.name || 'Unknown';
      setNewSessionData({
        ...newSessionData,
        patientId: patientId,
        patientName: patientName,
        ipNumber: patient.uhidNumber || `IP-${patient.id}`
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
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <Hospital className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Patient Monitoring</h1>
            <p className="text-sm text-muted-foreground">ICU Chart & Nursing Workflow (NABH-Compliant)</p>
          </div>
        </div>
        <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-session">
              <PlusCircle className="h-4 w-4 mr-2" /> New Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Start New Monitoring Session</DialogTitle>
              <DialogDescription>Create a 24-hour monitoring session for a patient</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Patient</Label>
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ward</Label>
                  <Select value={newSessionData.wardType} onValueChange={(v) => setNewSessionData({...newSessionData, wardType: v})}>
                    <SelectTrigger data-testid="select-ward">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WARDS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bed Number</Label>
                  <Input value={newSessionData.bedNumber} onChange={(e) => setNewSessionData({...newSessionData, bedNumber: e.target.value})} placeholder="e.g., ICU-5" data-testid="input-bed" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Session Date</Label>
                  <Input type="date" value={newSessionData.sessionDate} onChange={(e) => setNewSessionData({...newSessionData, sessionDate: e.target.value})} data-testid="input-date" />
                </div>
                <div className="space-y-2">
                  <Label>Starting Shift</Label>
                  <Select value={newSessionData.shift} onValueChange={(v) => setNewSessionData({...newSessionData, shift: v})}>
                    <SelectTrigger data-testid="select-shift">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIFTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Diagnosis</Label>
                <Textarea value={newSessionData.diagnosis} onChange={(e) => setNewSessionData({...newSessionData, diagnosis: e.target.value})} placeholder="Primary diagnosis..." data-testid="input-diagnosis" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ventilator" checked={newSessionData.isOnVentilator} onChange={(e) => setNewSessionData({...newSessionData, isOnVentilator: e.target.checked})} data-testid="checkbox-ventilator" />
                <Label htmlFor="ventilator">Patient on Ventilator</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewSession(false)}>Cancel</Button>
              <Button onClick={() => createSessionMutation.mutate(newSessionData)} disabled={!newSessionData.patientId} data-testid="button-create-session">
                Start Session
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 border-r bg-card overflow-auto">
          <div className="p-3 border-b">
            <h3 className="font-semibold text-sm text-muted-foreground">Active Sessions</h3>
          </div>
          <ScrollArea className="h-[calc(100vh-200px)]">
            {sessions.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active sessions</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div 
                  key={session.id} 
                  className={`p-3 cursor-pointer border-b hover-elevate ${selectedSessionId === session.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}
                  onClick={() => setSelectedSessionId(session.id)}
                  data-testid={`session-item-${session.id}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{session.patientName}</span>
                    <Badge variant={session.sessionStatus === "active" ? "default" : "secondary"} className="text-xs">
                      {session.sessionStatus}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div>{session.wardType} - Bed {session.bedNumber}</div>
                    <div>IP: {session.ipNumber} | {format(new Date(session.sessionDate), "dd MMM yyyy")}</div>
                  </div>
                  {session.isOnVentilator && (
                    <Badge variant="destructive" className="mt-1 text-xs">
                      <Wind className="h-3 w-3 mr-1" /> Ventilator
                    </Badge>
                  )}
                </div>
              ))
            )}
          </ScrollArea>
        </aside>

        <main className="flex-1 overflow-auto bg-muted/20 p-4">
          {!selectedSession ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Stethoscope className="h-16 w-16 mb-4 opacity-30" />
              <h2 className="text-xl font-medium mb-2">Select a Monitoring Session</h2>
              <p className="text-sm">Choose a session from the left panel or create a new one</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedSession.patientName}
                        {selectedSession.isOnVentilator && <Badge variant="destructive"><Wind className="h-3 w-3" /></Badge>}
                      </CardTitle>
                      <CardDescription>
                        IP: {selectedSession.ipNumber} | {selectedSession.wardType} - Bed {selectedSession.bedNumber} | {format(new Date(selectedSession.sessionDate), "EEEE, dd MMMM yyyy")}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" /> Export PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex flex-wrap h-auto gap-1 p-1 bg-card">
                  <TabsTrigger value="overview" className="text-xs"><Activity className="h-3 w-3 mr-1" />Overview</TabsTrigger>
                  <TabsTrigger value="vitals" className="text-xs"><Heart className="h-3 w-3 mr-1" />Vitals</TabsTrigger>
                  <TabsTrigger value="inotropes" className="text-xs"><Syringe className="h-3 w-3 mr-1" />Inotropes</TabsTrigger>
                  <TabsTrigger value="ventilator" className="text-xs"><Wind className="h-3 w-3 mr-1" />Ventilator</TabsTrigger>
                  <TabsTrigger value="abg-lab" className="text-xs"><FlaskConical className="h-3 w-3 mr-1" />ABG/Lab</TabsTrigger>
                  <TabsTrigger value="intake" className="text-xs"><Droplets className="h-3 w-3 mr-1" />Intake</TabsTrigger>
                  <TabsTrigger value="output" className="text-xs"><Droplets className="h-3 w-3 mr-1" />Output</TabsTrigger>
                  <TabsTrigger value="diabetic" className="text-xs"><Activity className="h-3 w-3 mr-1" />Diabetic</TabsTrigger>
                  <TabsTrigger value="mar" className="text-xs"><Pill className="h-3 w-3 mr-1" />MAR</TabsTrigger>
                  <TabsTrigger value="once-only" className="text-xs"><Pill className="h-3 w-3 mr-1" />Once-Only</TabsTrigger>
                  <TabsTrigger value="notes" className="text-xs"><FileText className="h-3 w-3 mr-1" />Shift Notes</TabsTrigger>
                  <TabsTrigger value="airway" className="text-xs"><BedDouble className="h-3 w-3 mr-1" />Lines/Tubes</TabsTrigger>
                  <TabsTrigger value="staff" className="text-xs"><Users className="h-3 w-3 mr-1" />Duty Staff</TabsTrigger>
                  <TabsTrigger value="allergies" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Allergies</TabsTrigger>
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
                  <VentilatorTab sessionId={selectedSession.id} isOnVentilator={selectedSession.isOnVentilator} />
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
              </Tabs>
            </div>
          )}
        </main>
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4" /> Session Info
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <div><span className="text-muted-foreground">Shift:</span> {session.shift}</div>
          <div><span className="text-muted-foreground">Ward:</span> {session.wardType}</div>
          <div><span className="text-muted-foreground">Bed:</span> {session.bedNumber}</div>
          <div><span className="text-muted-foreground">Status:</span> <Badge>{session.sessionStatus}</Badge></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Droplets className="h-4 w-4" /> Fluid Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <div><span className="text-muted-foreground">Total Intake:</span> {fluidBalance?.totalIntake || 0} ml</div>
          <div><span className="text-muted-foreground">Total Output:</span> {fluidBalance?.totalOutput || 0} ml</div>
          <div className={`font-semibold ${(fluidBalance?.netBalance || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
            Net Balance: {fluidBalance?.netBalance || 0} ml
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4" /> Latest Vitals
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Record vitals in the Vitals tab
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileCheck className="h-4 w-4" /> Diagnosis
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {session.diagnosis || "No diagnosis recorded"}
        </CardContent>
      </Card>
    </div>
  );
}

function VitalsTab({ sessionId }: { sessionId: string }) {
  const { toast } = useToast();
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
      toast({ title: "Vitals Saved" });
      setVitalsForm({ pulse: "", sbp: "", dbp: "", temperature: "", respiratoryRate: "", spo2: "" });
      setSelectedSlot("");
    }
  });

  const handleSave = () => {
    if (!selectedSlot) return;
    saveMutation.mutate({
      sessionId,
      hourSlot: selectedSlot,
      pulse: vitalsForm.pulse ? parseInt(vitalsForm.pulse) : null,
      systolicBp: vitalsForm.sbp ? parseInt(vitalsForm.sbp) : null,
      diastolicBp: vitalsForm.dbp ? parseInt(vitalsForm.dbp) : null,
      temperature: vitalsForm.temperature ? parseFloat(vitalsForm.temperature) : null,
      respiratoryRate: vitalsForm.respiratoryRate ? parseInt(vitalsForm.respiratoryRate) : null,
      spo2: vitalsForm.spo2 ? parseInt(vitalsForm.spo2) : null,
      recordedBy: "Current Nurse"
    });
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Hourly Vitals Chart (24 Hours)</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-vitals"><PlusCircle className="h-4 w-4 mr-1" /> Add Vitals</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Vitals</DialogTitle>
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
                <div><Label>Pulse (bpm)</Label><Input type="number" value={vitalsForm.pulse} onChange={(e) => setVitalsForm({...vitalsForm, pulse: e.target.value})} data-testid="input-pulse" /></div>
                <div><Label>SpO2 (%)</Label><Input type="number" value={vitalsForm.spo2} onChange={(e) => setVitalsForm({...vitalsForm, spo2: e.target.value})} data-testid="input-spo2" /></div>
                <div><Label>SBP (mmHg)</Label><Input type="number" value={vitalsForm.sbp} onChange={(e) => setVitalsForm({...vitalsForm, sbp: e.target.value})} data-testid="input-sbp" /></div>
                <div><Label>DBP (mmHg)</Label><Input type="number" value={vitalsForm.dbp} onChange={(e) => setVitalsForm({...vitalsForm, dbp: e.target.value})} data-testid="input-dbp" /></div>
                <div><Label>Temp (°C)</Label><Input type="number" step="0.1" value={vitalsForm.temperature} onChange={(e) => setVitalsForm({...vitalsForm, temperature: e.target.value})} data-testid="input-temp" /></div>
                <div><Label>RR (/min)</Label><Input type="number" value={vitalsForm.respiratoryRate} onChange={(e) => setVitalsForm({...vitalsForm, respiratoryRate: e.target.value})} data-testid="input-rr" /></div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={!selectedSlot} data-testid="button-save-vitals">Save Vitals</Button>
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
                    <TableCell>{v?.pulse || "-"}</TableCell>
                    <TableCell>{v ? `${v.systolicBp || "-"}/${v.diastolicBp || "-"}` : "-"}</TableCell>
                    <TableCell>{v?.temperature ? `${v.temperature}°C` : "-"}</TableCell>
                    <TableCell>{v?.respiratoryRate || "-"}</TableCell>
                    <TableCell>{v?.spo2 ? `${v.spo2}%` : "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{v?.recordedBy || "-"}</TableCell>
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
  const [form, setForm] = useState({ drugName: "", concentration: "", doseRate: "", pumpChannel: "" });

  const { data: records = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/inotropes/${sessionId}`]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/inotropes", data),
    onSuccess: () => { refetch(); toast({ title: "Inotrope Added" }); setForm({ drugName: "", concentration: "", doseRate: "", pumpChannel: "" }); }
  });

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Inotropes & Sedation</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-inotrope"><PlusCircle className="h-4 w-4 mr-1" /> Add Drug</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Inotrope/Sedation</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Drug Name</Label><Input value={form.drugName} onChange={(e) => setForm({...form, drugName: e.target.value})} placeholder="e.g., Noradrenaline" /></div>
              <div><Label>Concentration</Label><Input value={form.concentration} onChange={(e) => setForm({...form, concentration: e.target.value})} placeholder="e.g., 8mg/50ml" /></div>
              <div><Label>Dose Rate</Label><Input value={form.doseRate} onChange={(e) => setForm({...form, doseRate: e.target.value})} placeholder="e.g., 0.1 mcg/kg/min" /></div>
              <div><Label>Pump Channel</Label><Input value={form.pumpChannel} onChange={(e) => setForm({...form, pumpChannel: e.target.value})} placeholder="e.g., Channel 1" /></div>
            </div>
            <DialogFooter><Button onClick={() => saveMutation.mutate({ sessionId, ...form, recordedBy: "Nurse" })}>Save</Button></DialogFooter>
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
  const [form, setForm] = useState({ mode: "CMV", fio2: "", peep: "", tidalVolume: "", respiratoryRateSet: "" });

  const { data: records = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/ventilator/${sessionId}`],
    enabled: isOnVentilator
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/ventilator", data),
    onSuccess: () => { refetch(); toast({ title: "Ventilator Settings Saved" }); }
  });

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
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Record Settings</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Ventilator Settings</DialogTitle></DialogHeader>
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
            <DialogFooter>
              <Button onClick={() => saveMutation.mutate({ 
                sessionId, 
                mode: form.mode, 
                fio2: parseFloat(form.fio2) || null,
                peep: parseFloat(form.peep) || null,
                tidalVolume: parseInt(form.tidalVolume) || null,
                respiratoryRateSet: parseInt(form.respiratoryRateSet) || null,
                recordedBy: "Nurse"
              })}>Save</Button>
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
  const [form, setForm] = useState({ ph: "", pco2: "", po2: "", hco3: "", lactate: "", hemoglobin: "" });

  const { data: records = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/abg-lab/${sessionId}`]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/abg-lab", data),
    onSuccess: () => { refetch(); toast({ title: "ABG/Lab Results Saved" }); }
  });

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">ABG & Lab Results</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Results</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>ABG / Lab Results</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>pH</Label><Input type="number" step="0.01" value={form.ph} onChange={(e) => setForm({...form, ph: e.target.value})} placeholder="7.35-7.45" /></div>
              <div><Label>pCO2 (mmHg)</Label><Input type="number" value={form.pco2} onChange={(e) => setForm({...form, pco2: e.target.value})} placeholder="35-45" /></div>
              <div><Label>pO2 (mmHg)</Label><Input type="number" value={form.po2} onChange={(e) => setForm({...form, po2: e.target.value})} placeholder="80-100" /></div>
              <div><Label>HCO3 (mEq/L)</Label><Input type="number" step="0.1" value={form.hco3} onChange={(e) => setForm({...form, hco3: e.target.value})} placeholder="22-26" /></div>
              <div><Label>Lactate (mmol/L)</Label><Input type="number" step="0.1" value={form.lactate} onChange={(e) => setForm({...form, lactate: e.target.value})} /></div>
              <div><Label>Hemoglobin (g/dL)</Label><Input type="number" step="0.1" value={form.hemoglobin} onChange={(e) => setForm({...form, hemoglobin: e.target.value})} /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => saveMutation.mutate({ 
                sessionId, 
                ph: parseFloat(form.ph) || null,
                pco2: parseFloat(form.pco2) || null,
                po2: parseFloat(form.po2) || null,
                hco3: parseFloat(form.hco3) || null,
                lactate: parseFloat(form.lactate) || null,
                hemoglobin: parseFloat(form.hemoglobin) || null,
                recordedBy: "Lab"
              })}>Save</Button>
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
    onSuccess: () => { refetch(); queryClient.invalidateQueries({ queryKey: [`/api/patient-monitoring/fluid-balance/${sessionId}`] }); toast({ title: "Intake Saved" }); }
  });

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Intake Chart</CardTitle>
          <CardDescription>Total Intake: <span className="font-semibold text-primary">{fluidBalance?.totalIntake || 0} ml</span></CardDescription>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Intake</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Intake</DialogTitle></DialogHeader>
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
            <DialogFooter>
              <Button onClick={() => saveMutation.mutate({ 
                sessionId, 
                hourSlot: selectedSlot,
                ivLine1: parseInt(form.ivLine1) || 0,
                oral: parseInt(form.oral) || 0,
                ngTube: parseInt(form.ngTube) || 0,
                bloodProducts: parseInt(form.bloodProducts) || 0,
                recordedBy: "Nurse"
              })} disabled={!selectedSlot}>Save</Button>
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
    onSuccess: () => { refetch(); queryClient.invalidateQueries({ queryKey: [`/api/patient-monitoring/fluid-balance/${sessionId}`] }); toast({ title: "Output Saved" }); }
  });

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Output Chart</CardTitle>
          <CardDescription>Total Output: <span className="font-semibold text-primary">{fluidBalance?.totalOutput || 0} ml</span> | Net Balance: <span className={`font-semibold ${(fluidBalance?.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fluidBalance?.netBalance || 0} ml</span></CardDescription>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Output</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Output</DialogTitle></DialogHeader>
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
            <DialogFooter>
              <Button onClick={() => saveMutation.mutate({ 
                sessionId, 
                hourSlot: selectedSlot,
                urineOutput: parseInt(form.urineOutput) || 0,
                drainOutput: parseInt(form.drainOutput) || 0,
                vomitus: parseInt(form.vomitus) || 0,
                stool: parseInt(form.stool) || 0,
                recordedBy: "Nurse"
              })} disabled={!selectedSlot}>Save</Button>
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
  const [form, setForm] = useState({ bloodSugarLevel: "", insulinType: "", insulinDose: "", checkTime: "" });

  const { data: records = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/diabetic/${sessionId}`]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/diabetic", data),
    onSuccess: () => { refetch(); toast({ title: "Diabetic Record Saved" }); }
  });

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Diabetic Flow Chart</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Record</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Blood Sugar & Insulin</DialogTitle></DialogHeader>
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
              <div><Label>Blood Sugar Level (mg/dL)</Label><Input type="number" value={form.bloodSugarLevel} onChange={(e) => setForm({...form, bloodSugarLevel: e.target.value})} /></div>
              <div><Label>Insulin Type</Label><Input value={form.insulinType} onChange={(e) => setForm({...form, insulinType: e.target.value})} placeholder="e.g., Regular, NPH, Lantus" /></div>
              <div><Label>Insulin Dose (Units)</Label><Input type="number" value={form.insulinDose} onChange={(e) => setForm({...form, insulinDose: e.target.value})} /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => saveMutation.mutate({ 
                sessionId, 
                bloodSugarLevel: parseInt(form.bloodSugarLevel),
                checkTime: form.checkTime,
                insulinType: form.insulinType || null,
                insulinDose: form.insulinDose ? parseFloat(form.insulinDose) : null,
                recordedBy: "Nurse"
              })}>Save</Button>
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
  const [form, setForm] = useState({ medicineName: "", dose: "", route: "", frequency: "", scheduledTime: "" });

  const { data: records = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/mar/${sessionId}`]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/mar", data),
    onSuccess: () => { refetch(); toast({ title: "MAR Entry Added" }); }
  });

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Medication Administration Record (MAR)</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Medicine</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add MAR Entry</DialogTitle></DialogHeader>
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
            <DialogFooter>
              <Button onClick={() => saveMutation.mutate({ sessionId, ...form, status: "SCHEDULED", recordedBy: "Nurse" })}>Add</Button>
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
  const [form, setForm] = useState({ drugName: "", dose: "", route: "", indication: "" });

  const { data: records = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/once-only/${sessionId}`]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/once-only", data),
    onSuccess: () => { refetch(); toast({ title: "Once-Only Drug Added" }); }
  });

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Once-Only / STAT Drugs</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add STAT Drug</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Once-Only Drug</DialogTitle></DialogHeader>
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
            <DialogFooter>
              <Button onClick={() => saveMutation.mutate({ sessionId, ...form, givenBy: "Nurse", givenAt: new Date().toISOString() })}>Add</Button>
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
  const [form, setForm] = useState({ shift: "MORNING", noteType: "ASSESSMENT", noteContent: "" });

  const { data: records = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/shift-notes/${sessionId}`]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/shift-notes", data),
    onSuccess: () => { refetch(); toast({ title: "Shift Note Added" }); setForm({...form, noteContent: ""}); }
  });

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Nursing Shift Notes</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Note</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Shift Note</DialogTitle></DialogHeader>
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
            <DialogFooter>
              <Button onClick={() => saveMutation.mutate({ sessionId, ...form, nurseId: "current", nurseName: "Current Nurse" })}>Save Note</Button>
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
    onSuccess: () => { refetch(); toast({ title: "Lines & Tubes Saved" }); }
  });

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Airway, Lines & Tubes</CardTitle>
        {!record && (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Details</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Lines & Tubes Details</DialogTitle></DialogHeader>
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
              <DialogFooter>
                <Button onClick={() => saveMutation.mutate({ 
                  sessionId, 
                  airwayType: form.airwayType || null,
                  endotrachealTubeSize: form.endotrachealTubeSize || null,
                  centralLineType: form.centralLineType || null,
                  centralLineSite: form.centralLineSite || null,
                  centralLineInsertionDate: form.centralLineDate || null,
                  urinaryCatheterSize: form.urinaryCatheterSize || null,
                  urinaryCatheterInsertionDate: form.urinaryCatheterDate || null,
                  ngTubeSize: form.ngTubeSize || null,
                  ngTubeInsertionDate: form.ngTubeDate || null
                })}>Save</Button>
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
  const [form, setForm] = useState({ staffName: "", staffRole: "NURSE", shift: "MORNING" });

  const { data: records = [], refetch } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/duty-staff/${sessionId}`]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/duty-staff", data),
    onSuccess: () => { refetch(); toast({ title: "Staff Assignment Added" }); }
  });

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Duty Staff Assignments</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Staff</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Assign Duty Staff</DialogTitle></DialogHeader>
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
            <DialogFooter>
              <Button onClick={() => saveMutation.mutate({ sessionId, ...form, staffId: "staff-" + Date.now() })}>Assign</Button>
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
  const [form, setForm] = useState({ knownAllergies: "", drugAllergies: "", foodAllergies: "", isolationPrecautions: "", fallRisk: false, pressureUlcerRisk: false });

  const { data: record, refetch } = useQuery<any>({
    queryKey: [`/api/patient-monitoring/allergies/${sessionId}`]
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/patient-monitoring/allergies", data),
    onSuccess: () => { refetch(); toast({ title: "Allergies & Precautions Saved" }); }
  });

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Allergies & Precautions</CardTitle>
        {!record && (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Details</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Patient Allergies & Precautions</DialogTitle></DialogHeader>
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
              <DialogFooter>
                <Button onClick={() => saveMutation.mutate({ sessionId, ...form })}>Save</Button>
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
