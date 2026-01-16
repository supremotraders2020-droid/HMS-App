import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Scissors, Plus, Search, Calendar as CalendarIcon, Clock, User, 
  FileText, ClipboardList, CheckCircle, AlertCircle, Activity,
  Users, ChevronRight, ArrowLeft, Stethoscope
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OperationOTPageProps {
  userRole: string;
  userId: string;
}

interface OtCase {
  id: string;
  patientId: string;
  patientName: string;
  uhid?: string;
  age?: number;
  gender?: string;
  surgeonId: string;
  surgeonName?: string;
  anaesthetistId?: string;
  anaesthetistName?: string;
  procedureName: string;
  procedureCode?: string;
  scheduledDate: string;
  scheduledTime?: string;
  otRoom?: string;
  priority: string;
  status: string;
  diagnosis?: string;
  surgeryType?: string;
  estimatedDuration?: number;
  createdAt: string;
  updatedAt?: string;
}

interface TrackingPatient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  uhid?: string;
  age?: number;
  gender?: string;
}

interface Doctor {
  id: string;
  name: string;
  specialty?: string;
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  in_prep: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  in_progress: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  postponed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

const priorityColors: Record<string, string> = {
  elective: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  urgent: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  emergency: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export default function OperationOTPage({ userRole, userId }: OperationOTPageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedCase, setSelectedCase] = useState<OtCase | null>(null);
  const [showNewCaseDialog, setShowNewCaseDialog] = useState(false);
  const [activePhase, setActivePhase] = useState("preop");

  const { data: otCases = [], isLoading } = useQuery<OtCase[]>({
    queryKey: ["/api/ot-cases", statusFilter !== "all" ? { status: statusFilter } : {}],
  });

  const { data: patients = [] } = useQuery<TrackingPatient[]>({
    queryKey: ["/api/tracking-patients"],
  });

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  const createCaseMutation = useMutation({
    mutationFn: async (data: Partial<OtCase>) => {
      return await apiRequest("POST", "/api/ot-cases", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ot-cases"] });
      toast({ title: "Success", description: "OT case created successfully" });
      setShowNewCaseDialog(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create OT case", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/ot-cases/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ot-cases"] });
      toast({ title: "Success", description: "Status updated" });
    },
  });

  const filteredCases = otCases.filter((c) => {
    const matchesSearch = 
      c.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.procedureName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.uhid?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    
    const matchesDate = !selectedDate || c.scheduledDate === format(selectedDate, "yyyy-MM-dd");
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleCreateCase = (formData: FormData) => {
    const patientId = formData.get("patientId") as string;
    const patient = patients.find((p) => p.id === patientId);
    const surgeonId = formData.get("surgeonId") as string;
    const surgeon = doctors.find((d) => d.id === surgeonId);

    createCaseMutation.mutate({
      patientId,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : "",
      uhid: patient?.uhid,
      age: patient?.age,
      gender: patient?.gender,
      surgeonId,
      surgeonName: surgeon?.name,
      procedureName: formData.get("procedureName") as string,
      scheduledDate: formData.get("scheduledDate") as string,
      scheduledTime: formData.get("scheduledTime") as string,
      otRoom: formData.get("otRoom") as string,
      priority: formData.get("priority") as string || "elective",
      status: "scheduled",
      diagnosis: formData.get("diagnosis") as string,
      surgeryType: formData.get("surgeryType") as string,
      estimatedDuration: parseInt(formData.get("estimatedDuration") as string) || 60,
    });
  };

  if (selectedCase) {
    return (
      <CaseDetailView 
        otCase={selectedCase} 
        onBack={() => setSelectedCase(null)}
        userRole={userRole}
        userId={userId}
        activePhase={activePhase}
        setActivePhase={setActivePhase}
        updateStatus={(status) => updateStatusMutation.mutate({ id: selectedCase.id, status })}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scissors className="h-6 w-6 text-primary" />
            Operation & OT Management
          </h1>
          <p className="text-muted-foreground">Manage surgical cases and operation theatre workflows</p>
        </div>
        {["SUPER_ADMIN", "ADMIN", "DOCTOR"].includes(userRole) && (
          <Dialog open={showNewCaseDialog} onOpenChange={setShowNewCaseDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New OT Case
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Operation</DialogTitle>
              </DialogHeader>
              <NewCaseForm 
                patients={patients}
                doctors={doctors}
                onSubmit={handleCreateCase}
                isLoading={createCaseMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Today's Surgeries"
          value={otCases.filter(c => c.scheduledDate === format(new Date(), "yyyy-MM-dd")).length}
          icon={<CalendarIcon className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="In Progress"
          value={otCases.filter(c => c.status === "in_progress").length}
          icon={<Activity className="h-5 w-5" />}
          color="orange"
        />
        <StatCard
          title="Completed Today"
          value={otCases.filter(c => c.status === "completed" && c.scheduledDate === format(new Date(), "yyyy-MM-dd")).length}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          title="Pending Prep"
          value={otCases.filter(c => c.status === "scheduled" || c.status === "in_prep").length}
          icon={<ClipboardList className="h-5 w-5" />}
          color="yellow"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>OT Cases</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_prep">In Prep</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {selectedDate ? format(selectedDate, "MMM dd") : "All Dates"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                  />
                  {selectedDate && (
                    <div className="p-2 border-t">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedDate(undefined)} className="w-full">
                        Clear Date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading cases...</div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No OT cases found. {userRole === "ADMIN" || userRole === "DOCTOR" ? "Click 'New OT Case' to schedule one." : ""}
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredCases.map((c) => (
                  <CaseCard key={c.id} otCase={c} onClick={() => setSelectedCase(c)} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
    green: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
    yellow: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400",
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={cn("p-3 rounded-full", colorClasses[color])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CaseCard({ otCase, onClick }: { otCase: OtCase; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="p-4 border rounded-lg hover-elevate cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold">{otCase.patientName}</span>
            {otCase.uhid && <Badge variant="outline" className="text-xs">{otCase.uhid}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mb-2">{otCase.procedureName}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {format(new Date(otCase.scheduledDate), "MMM dd, yyyy")}
            </span>
            {otCase.scheduledTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {otCase.scheduledTime}
              </span>
            )}
            {otCase.surgeonName && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Dr. {otCase.surgeonName}
              </span>
            )}
            {otCase.otRoom && (
              <span>OT: {otCase.otRoom}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className={statusColors[otCase.status] || statusColors.scheduled}>
            {otCase.status.replace("_", " ")}
          </Badge>
          <Badge className={priorityColors[otCase.priority] || priorityColors.elective}>
            {otCase.priority}
          </Badge>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

function NewCaseForm({ 
  patients, 
  doctors, 
  onSubmit, 
  isLoading 
}: { 
  patients: TrackingPatient[]; 
  doctors: Doctor[]; 
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(new FormData(e.currentTarget)); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="patientId">Patient *</Label>
          <Select name="patientId" required>
            <SelectTrigger>
              <SelectValue placeholder="Select patient" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} {p.uhid ? `(${p.uhid})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="surgeonId">Lead Surgeon *</Label>
          <Select name="surgeonId" required>
            <SelectTrigger>
              <SelectValue placeholder="Select surgeon" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  Dr. {d.name} {d.specialty ? `(${d.specialty})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="procedureName">Procedure Name *</Label>
        <Input name="procedureName" placeholder="e.g., Laparoscopic Cholecystectomy" required />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduledDate">Date *</Label>
          <Input name="scheduledDate" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduledTime">Time</Label>
          <Input name="scheduledTime" type="time" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="otRoom">OT Room</Label>
          <Select name="otRoom">
            <SelectTrigger>
              <SelectValue placeholder="Select OT" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OT-1">OT-1</SelectItem>
              <SelectItem value="OT-2">OT-2</SelectItem>
              <SelectItem value="OT-3">OT-3</SelectItem>
              <SelectItem value="OT-4">OT-4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select name="priority" defaultValue="elective">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="elective">Elective</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="surgeryType">Surgery Type</Label>
          <Select name="surgeryType">
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="major">Major</SelectItem>
              <SelectItem value="minor">Minor</SelectItem>
              <SelectItem value="day_care">Day Care</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedDuration">Duration (min)</Label>
          <Input name="estimatedDuration" type="number" placeholder="60" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="diagnosis">Diagnosis</Label>
        <Textarea name="diagnosis" placeholder="Pre-operative diagnosis" />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Schedule Operation"}
        </Button>
      </div>
    </form>
  );
}

interface CaseDetailViewProps {
  otCase: OtCase;
  onBack: () => void;
  userRole: string;
  userId: string;
  activePhase: string;
  setActivePhase: (phase: string) => void;
  updateStatus: (status: string) => void;
}

function CaseDetailView({ otCase, onBack, userRole, activePhase, setActivePhase, updateStatus }: CaseDetailViewProps) {
  const { data: fullCase } = useQuery({
    queryKey: ["/api/ot-cases", otCase.id, "full"],
    queryFn: async () => {
      const response = await fetch(`/api/ot-cases/${otCase.id}/full`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
  });

  const phaseStatus = (phase: string) => {
    if (phase === "preop") {
      return fullCase?.preOp?.checklist ? "complete" : "pending";
    }
    if (phase === "intraop") {
      return fullCase?.intraOp?.surgeonNotes ? "complete" : otCase.status === "in_progress" ? "active" : "pending";
    }
    if (phase === "postop") {
      return otCase.status === "completed" ? "complete" : "pending";
    }
    return "pending";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cases
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                {otCase.procedureName}
              </CardTitle>
              <CardDescription>
                {otCase.patientName} {otCase.uhid && `(${otCase.uhid})`} | 
                {otCase.age && ` ${otCase.age}y`} {otCase.gender && `/ ${otCase.gender}`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={statusColors[otCase.status]}>{otCase.status.replace("_", " ")}</Badge>
              <Badge className={priorityColors[otCase.priority]}>{otCase.priority}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Date:</span>
              <p className="font-medium">{format(new Date(otCase.scheduledDate), "MMM dd, yyyy")}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Time:</span>
              <p className="font-medium">{otCase.scheduledTime || "Not set"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Surgeon:</span>
              <p className="font-medium">{otCase.surgeonName ? `Dr. ${otCase.surgeonName}` : "Not assigned"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">OT Room:</span>
              <p className="font-medium">{otCase.otRoom || "Not assigned"}</p>
            </div>
          </div>

          {["SUPER_ADMIN", "ADMIN", "DOCTOR"].includes(userRole) && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">Update Status:</span>
              {otCase.status === "scheduled" && (
                <Button size="sm" variant="outline" onClick={() => updateStatus("in_prep")}>
                  Start Prep
                </Button>
              )}
              {otCase.status === "in_prep" && (
                <Button size="sm" onClick={() => updateStatus("in_progress")}>
                  Start Surgery
                </Button>
              )}
              {otCase.status === "in_progress" && (
                <Button size="sm" variant="default" onClick={() => updateStatus("completed")}>
                  Complete Surgery
                </Button>
              )}
              {["scheduled", "in_prep"].includes(otCase.status) && (
                <Button size="sm" variant="destructive" onClick={() => updateStatus("cancelled")}>
                  Cancel
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-4 py-4">
        <PhaseIndicator 
          label="Pre-Op" 
          status={phaseStatus("preop")} 
          active={activePhase === "preop"}
          onClick={() => setActivePhase("preop")}
        />
        <div className="h-px w-12 bg-border" />
        <PhaseIndicator 
          label="Intra-Op" 
          status={phaseStatus("intraop")} 
          active={activePhase === "intraop"}
          onClick={() => setActivePhase("intraop")}
        />
        <div className="h-px w-12 bg-border" />
        <PhaseIndicator 
          label="Post-Op" 
          status={phaseStatus("postop")} 
          active={activePhase === "postop"}
          onClick={() => setActivePhase("postop")}
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          {activePhase === "preop" && (
            <PreOpPhase caseId={otCase.id} data={fullCase?.preOp} consents={fullCase?.consents} />
          )}
          {activePhase === "intraop" && (
            <IntraOpPhase caseId={otCase.id} data={fullCase?.intraOp} />
          )}
          {activePhase === "postop" && (
            <PostOpPhase caseId={otCase.id} data={fullCase?.postOp} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PhaseIndicator({ label, status, active, onClick }: { label: string; status: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 p-3 rounded-lg transition-all",
        active ? "bg-primary/10 ring-2 ring-primary" : "hover-elevate"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center",
        status === "complete" ? "bg-green-500 text-white" :
        status === "active" ? "bg-orange-500 text-white" :
        "bg-muted text-muted-foreground"
      )}>
        {status === "complete" ? <CheckCircle className="h-4 w-4" /> : 
         status === "active" ? <Activity className="h-4 w-4" /> :
         <Clock className="h-4 w-4" />}
      </div>
      <span className={cn("text-sm font-medium", active && "text-primary")}>{label}</span>
    </button>
  );
}

function PreOpPhase({ caseId, data, consents }: { caseId: string; data: any; consents: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sections = [
    { key: "counselling", title: "Pre-Op Counselling", icon: <Users className="h-4 w-4" />, done: !!data?.counselling },
    { key: "checklist", title: "Pre-Op Checklist", icon: <ClipboardList className="h-4 w-4" />, done: !!data?.checklist },
    { key: "pae", title: "Pre-Anaesthetic Evaluation", icon: <Stethoscope className="h-4 w-4" />, done: !!data?.pae },
    { key: "safety", title: "Safety Checklist (WHO)", icon: <CheckCircle className="h-4 w-4" />, done: !!data?.safetyChecklist },
    { key: "consent_surgery", title: "Surgical Consent", icon: <FileText className="h-4 w-4" />, done: !!consents?.surgery },
    { key: "consent_anaesthesia", title: "Anaesthesia Consent", icon: <FileText className="h-4 w-4" />, done: !!consents?.anaesthesia },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Pre-Operative Phase</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => (
          <div
            key={section.key}
            className={cn(
              "p-4 border rounded-lg",
              section.done ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" : "bg-muted/30"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {section.icon}
              <span className="font-medium">{section.title}</span>
              {section.done && <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />}
            </div>
            <Button size="sm" variant={section.done ? "outline" : "default"} className="w-full mt-2">
              {section.done ? "View / Edit" : "Complete"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function IntraOpPhase({ caseId, data }: { caseId: string; data: any }) {
  const sections = [
    { key: "anaesthesia", title: "Anaesthesia Record", icon: <Activity className="h-4 w-4" />, done: !!data?.anaesthesiaRecord },
    { key: "timelog", title: "Time Log", icon: <Clock className="h-4 w-4" />, done: data?.timeLog?.length > 0 },
    { key: "notes", title: "Surgeon Notes", icon: <FileText className="h-4 w-4" />, done: !!data?.surgeonNotes },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Intra-Operative Phase</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((section) => (
          <div
            key={section.key}
            className={cn(
              "p-4 border rounded-lg",
              section.done ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" : "bg-muted/30"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {section.icon}
              <span className="font-medium">{section.title}</span>
              {section.done && <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />}
            </div>
            <Button size="sm" variant={section.done ? "outline" : "default"} className="w-full mt-2">
              {section.done ? "View / Edit" : "Record"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PostOpPhase({ caseId, data }: { caseId: string; data: any }) {
  const sections = [
    { key: "assessment", title: "Post-Op Assessment", icon: <ClipboardList className="h-4 w-4" />, done: data?.assessments?.length > 0 },
    { key: "monitoring", title: "Monitoring Chart", icon: <Activity className="h-4 w-4" />, done: data?.monitoringChart?.length > 0 },
    { key: "labour", title: "Labour Chart", icon: <FileText className="h-4 w-4" />, done: data?.labourChart?.length > 0, obstetric: true },
    { key: "neonate", title: "Neonate Sheet", icon: <Users className="h-4 w-4" />, done: !!data?.neonateSheet, obstetric: true },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Post-Operative Phase</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map((section) => (
          <div
            key={section.key}
            className={cn(
              "p-4 border rounded-lg",
              section.done ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" : "bg-muted/30"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {section.icon}
              <span className="font-medium">{section.title}</span>
              {section.done && <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />}
            </div>
            {section.obstetric && (
              <p className="text-xs text-muted-foreground mb-2">Obstetric cases only</p>
            )}
            <Button size="sm" variant={section.done ? "outline" : "default"} className="w-full mt-2">
              {section.done ? "View / Add" : "Record"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
