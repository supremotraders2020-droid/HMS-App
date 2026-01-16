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
    queryKey: ["/api/ot-cases", statusFilter],
    queryFn: async () => {
      const url = statusFilter !== "all" 
        ? `/api/ot-cases?status=${statusFilter}` 
        : "/api/ot-cases";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch OT cases");
      return response.json();
    },
  });

  // Fetch patients from Patient Tracking (admitted patients)
  const { data: trackingPatients = [] } = useQuery<any[]>({
    queryKey: ["/api/tracking/patients"],
  });

  // Map tracking patients to the format needed for OT case creation
  const admittedPatients = trackingPatients.map((tp: any) => ({
    id: tp.patientId || tp.id,
    patientName: tp.patientName || "Unknown Patient",
    uhid: tp.uhid || "",
    age: tp.age,
    gender: tp.gender,
    bedNumber: tp.bedNumber,
    department: tp.department,
    diagnosis: tp.diagnosis,
  }));

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
    const patient = admittedPatients.find((p: any) => p.id === patientId);
    const surgeonId = formData.get("surgeonId") as string;
    const surgeon = doctors.find((d) => d.id === surgeonId);

    createCaseMutation.mutate({
      patientId,
      patientName: patient?.patientName || "",
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
                patients={admittedPatients}
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
  patients: any[]; 
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
              {patients.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No admitted patients found. Please admit a patient first.
                </div>
              ) : patients.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.patientName}
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
  const [activeForm, setActiveForm] = useState<string | null>(null);

  const { data: counselling } = useQuery({
    queryKey: ["/api/ot-cases", caseId, "preop-counselling"],
    enabled: activeForm === "counselling",
  });

  const { data: checklist } = useQuery({
    queryKey: ["/api/ot-cases", caseId, "preop-checklist"],
    enabled: activeForm === "checklist",
  });

  const { data: pae } = useQuery({
    queryKey: ["/api/ot-cases", caseId, "preanaesthetic-eval"],
    enabled: activeForm === "pae",
  });

  const { data: safety } = useQuery({
    queryKey: ["/api/ot-cases", caseId, "safety-checklist"],
    enabled: activeForm === "safety",
  });

  const saveCounsellingMutation = useMutation({
    mutationFn: (formData: any) => {
      const existingId = data?.counselling?.id;
      if (existingId) {
        return apiRequest("PATCH", `/api/ot-cases/${caseId}/preop-counselling/${existingId}`, formData);
      }
      return apiRequest("POST", `/api/ot-cases/${caseId}/preop-counselling`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ot-cases", caseId] });
      toast({ title: "Saved", description: "Pre-op counselling recorded" });
      setActiveForm(null);
    },
  });

  const saveChecklistMutation = useMutation({
    mutationFn: (formData: any) => {
      const existingId = data?.checklist?.id;
      if (existingId) {
        return apiRequest("PATCH", `/api/ot-cases/${caseId}/preop-checklist/${existingId}`, formData);
      }
      return apiRequest("POST", `/api/ot-cases/${caseId}/preop-checklist`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ot-cases", caseId] });
      toast({ title: "Saved", description: "Pre-op checklist completed" });
      setActiveForm(null);
    },
  });

  const savePaeMutation = useMutation({
    mutationFn: (formData: any) => {
      const existingId = data?.pae?.id;
      if (existingId) {
        return apiRequest("PATCH", `/api/ot-cases/${caseId}/preanaesthetic-eval/${existingId}`, formData);
      }
      return apiRequest("POST", `/api/ot-cases/${caseId}/preanaesthetic-eval`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ot-cases", caseId] });
      toast({ title: "Saved", description: "Pre-anaesthetic evaluation recorded" });
      setActiveForm(null);
    },
  });

  const saveSafetyMutation = useMutation({
    mutationFn: (formData: any) => {
      const existingId = data?.safetyChecklist?.id;
      if (existingId) {
        return apiRequest("PATCH", `/api/ot-cases/${caseId}/safety-checklist/${existingId}`, formData);
      }
      return apiRequest("POST", `/api/ot-cases/${caseId}/safety-checklist`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ot-cases", caseId] });
      toast({ title: "Saved", description: "Safety checklist completed" });
      setActiveForm(null);
    },
  });

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
            <Dialog open={activeForm === section.key} onOpenChange={(open) => setActiveForm(open ? section.key : null)}>
              <DialogTrigger asChild>
                <Button size="sm" variant={section.done ? "outline" : "default"} className="w-full mt-2">
                  {section.done ? "View / Edit" : "Complete"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {section.icon}
                    {section.title}
                  </DialogTitle>
                </DialogHeader>
                {section.key === "counselling" && (
                  <CounsellingForm 
                    existing={counselling}
                    onSubmit={(d) => saveCounsellingMutation.mutate(d)}
                    isLoading={saveCounsellingMutation.isPending}
                  />
                )}
                {section.key === "checklist" && (
                  <ChecklistForm 
                    existing={checklist}
                    onSubmit={(d) => saveChecklistMutation.mutate(d)}
                    isLoading={saveChecklistMutation.isPending}
                  />
                )}
                {section.key === "pae" && (
                  <PAEForm 
                    existing={pae}
                    onSubmit={(d) => savePaeMutation.mutate(d)}
                    isLoading={savePaeMutation.isPending}
                  />
                )}
                {section.key === "safety" && (
                  <SafetyChecklistForm 
                    existing={safety}
                    onSubmit={(d) => saveSafetyMutation.mutate(d)}
                    isLoading={saveSafetyMutation.isPending}
                  />
                )}
                {(section.key === "consent_surgery" || section.key === "consent_anaesthesia") && (
                  <div className="text-center py-8 text-muted-foreground">
                    Consent forms are managed through the Consent Forms module.
                    <Button variant="outline" className="mt-4">
                      Go to Consent Forms
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>
    </div>
  );
}

function CounsellingForm({ existing, onSubmit, isLoading }: { existing: any; onSubmit: (d: any) => void; isLoading: boolean }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      counselledBy: formData.get("counselledBy"),
      counselledAt: new Date().toISOString(),
      attendees: formData.get("attendees"),
      procedureExplained: formData.get("procedureExplained") === "on",
      risksExplained: formData.get("risksExplained") === "on",
      alternativesDiscussed: formData.get("alternativesDiscussed") === "on",
      expectedOutcome: formData.get("expectedOutcome"),
      questionsAnswered: formData.get("questionsAnswered") === "on",
      patientUnderstanding: formData.get("patientUnderstanding"),
      notes: formData.get("notes"),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Counselled By</Label>
          <Input name="counselledBy" defaultValue={existing?.counselledBy} placeholder="Doctor/Staff name" required />
        </div>
        <div className="space-y-2">
          <Label>Attendees (Patient/Family)</Label>
          <Input name="attendees" defaultValue={existing?.attendees} placeholder="e.g., Patient, Spouse" />
        </div>
      </div>

      <div className="space-y-3 border rounded-lg p-4">
        <h4 className="font-medium">Counselling Checklist</h4>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="procedureExplained" defaultChecked={existing?.procedureExplained} className="h-4 w-4" />
            Procedure explained in detail
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="risksExplained" defaultChecked={existing?.risksExplained} className="h-4 w-4" />
            Risks and complications explained
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="alternativesDiscussed" defaultChecked={existing?.alternativesDiscussed} className="h-4 w-4" />
            Alternative treatments discussed
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="questionsAnswered" defaultChecked={existing?.questionsAnswered} className="h-4 w-4" />
            Patient questions answered
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Expected Outcome</Label>
        <Select name="expectedOutcome" defaultValue={existing?.expectedOutcome || "good"}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="excellent">Excellent - Full recovery expected</SelectItem>
            <SelectItem value="good">Good - Significant improvement expected</SelectItem>
            <SelectItem value="fair">Fair - Partial improvement possible</SelectItem>
            <SelectItem value="guarded">Guarded - Uncertain outcome</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Patient Understanding Level</Label>
        <Select name="patientUnderstanding" defaultValue={existing?.patientUnderstanding || "adequate"}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="excellent">Excellent - Full understanding</SelectItem>
            <SelectItem value="adequate">Adequate - Understands key points</SelectItem>
            <SelectItem value="limited">Limited - Requires family support</SelectItem>
            <SelectItem value="minimal">Minimal - Interpreter/advocate needed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Additional Notes</Label>
        <Textarea name="notes" defaultValue={existing?.notes} placeholder="Any additional counselling notes..." />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Counselling Record"}
        </Button>
      </div>
    </form>
  );
}

function ChecklistForm({ existing, onSubmit, isLoading }: { existing: any; onSubmit: (d: any) => void; isLoading: boolean }) {
  const checklistItems = [
    { key: "generalConsentObtained", label: "General Consent Obtained?" },
    { key: "surgeryConsentObtained", label: "Surgery/Procedural Consent Obtained?" },
    { key: "anaesthesiaConsentObtained", label: "Anaesthesia Consent Obtained?" },
    { key: "specificConsent", label: "Specific Consent? (if applicable)" },
    { key: "areaPrepared", label: "Prepared the area for Operation?" },
    { key: "spinalEpiduralPrep", label: "Prepared patient for Spinal/Epidural etc...?" },
    { key: "jewelleryRemoved", label: "Removed Jewellery?" },
    { key: "denturesRemoved", label: "Removed Dentures?" },
    { key: "spectaclesRemoved", label: "Removed Spectacles / Contact Lens?" },
    { key: "nailPolishRemoved", label: "Removed Nail Polish / Make up?" },
    { key: "hairPinsRemoved", label: "Removed Hair Pins / Clips?" },
    { key: "reportsCollected", label: "Reports of Lab, ECG, X-Ray etc.. collected & attached to file?" },
    { key: "preMedicationsGiven", label: "Pre-Medications given and charged?" },
    { key: "preOpAntibioticsGiven", label: "Pre-Operative antibiotics given? Test Dose/Full Dose" },
    { key: "hsMedicationsGiven", label: "H. S. Medications given?" },
    { key: "vitalSignsChecked", label: "Vital Signs checked?" },
    { key: "ivLinesSecured", label: "I. V. Lines secured?" },
    { key: "bladderEmptied", label: "Bladder emptied / Catheterization done with time?" },
    { key: "mouthWashGiven", label: "Mouth Wash / Gargles given?" },
    { key: "bathGiven", label: "Bath given?" },
    { key: "enemaGiven", label: "Enaema / Bowel Wash given? (if indicated)" },
    { key: "theatreDressGiven", label: "Patient's theatre dress given?" },
    { key: "bloodArranged", label: "Blood arranged, consent taken, mentioned no of units?" },
    { key: "materialsSent", label: "Materials, Drugs, Equipments sent with the patient?" },
    { key: "patientShiftedToOT", label: "Patient shifted to OT?" },
  ];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const checkedItems: Record<string, boolean> = {};
    checklistItems.forEach(item => {
      checkedItems[item.key] = formData.get(item.key) === "on";
    });
    onSubmit({
      ...checkedItems,
      completedBy: formData.get("completedBy"),
      completedAt: new Date().toISOString(),
      remarks: formData.get("remarks"),
      receivedByOTStaff: formData.get("receivedByOTStaff"),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Name of the Staff</Label>
        <Input name="completedBy" defaultValue={existing?.completedBy} placeholder="Staff name" required />
      </div>

      <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
        <h4 className="font-medium mb-3">Pre-Operative Checklist Items</h4>
        <div className="space-y-2">
          {checklistItems.map((item, idx) => (
            <label key={item.key} className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded">
              <input 
                type="checkbox" 
                name={item.key} 
                defaultChecked={existing?.[item.key]} 
                className="h-4 w-4 mt-0.5" 
              />
              <span className="text-sm">[{idx + 1}] {item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Received to the O.T. by / Name of OT Staff</Label>
        <Input name="receivedByOTStaff" defaultValue={existing?.receivedByOTStaff} placeholder="OT Staff name" />
      </div>

      <div className="space-y-2">
        <Label>Remarks / Notes</Label>
        <Textarea name="remarks" defaultValue={existing?.remarks} placeholder="Any additional notes or exceptions..." />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Complete Checklist"}
        </Button>
      </div>
    </form>
  );
}

function PAEForm({ existing, onSubmit, isLoading }: { existing: any; onSubmit: (d: any) => void; isLoading: boolean }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      evaluatedBy: formData.get("evaluatedBy"),
      evaluatedAt: new Date().toISOString(),
      asaGrade: formData.get("asaGrade"),
      mallampatiScore: formData.get("mallampatiScore"),
      airwayAssessment: formData.get("airwayAssessment"),
      heartRate: parseInt(formData.get("heartRate") as string) || null,
      bloodPressureSystolic: parseInt(formData.get("bpSystolic") as string) || null,
      bloodPressureDiastolic: parseInt(formData.get("bpDiastolic") as string) || null,
      spo2: parseInt(formData.get("spo2") as string) || null,
      temperature: parseFloat(formData.get("temperature") as string) || null,
      weight: parseFloat(formData.get("weight") as string) || null,
      height: parseFloat(formData.get("height") as string) || null,
      comorbidities: formData.get("comorbidities"),
      currentMedications: formData.get("currentMedications"),
      allergies: formData.get("allergies"),
      previousAnaesthesia: formData.get("previousAnaesthesia"),
      anaesthesiaPlan: formData.get("anaesthesiaPlan"),
      riskCategory: formData.get("riskCategory"),
      specialConsiderations: formData.get("specialConsiderations"),
      fitForSurgery: formData.get("fitForSurgery") === "on",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Evaluated By (Anaesthetist)</Label>
          <Input name="evaluatedBy" defaultValue={existing?.evaluatedBy} placeholder="Dr. Name" required />
        </div>
        <div className="space-y-2">
          <Label>ASA Grade *</Label>
          <Select name="asaGrade" defaultValue={existing?.asaGrade || ""} required>
            <SelectTrigger>
              <SelectValue placeholder="Select ASA Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="I">ASA I - Healthy patient</SelectItem>
              <SelectItem value="II">ASA II - Mild systemic disease</SelectItem>
              <SelectItem value="III">ASA III - Severe systemic disease</SelectItem>
              <SelectItem value="IV">ASA IV - Life-threatening disease</SelectItem>
              <SelectItem value="V">ASA V - Moribund patient</SelectItem>
              <SelectItem value="VI">ASA VI - Brain-dead organ donor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Mallampati Score</Label>
          <Select name="mallampatiScore" defaultValue={existing?.mallampatiScore || ""}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="I">Class I - Soft palate, fauces, uvula visible</SelectItem>
              <SelectItem value="II">Class II - Soft palate, fauces, partial uvula</SelectItem>
              <SelectItem value="III">Class III - Soft palate, base of uvula</SelectItem>
              <SelectItem value="IV">Class IV - Hard palate only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Airway Assessment</Label>
          <Select name="airwayAssessment" defaultValue={existing?.airwayAssessment || "normal"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="difficult">Anticipated Difficult</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Risk Category</Label>
          <Select name="riskCategory" defaultValue={existing?.riskCategory || "low"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low Risk</SelectItem>
              <SelectItem value="moderate">Moderate Risk</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="space-y-2">
          <Label>Heart Rate (bpm)</Label>
          <Input name="heartRate" type="number" defaultValue={existing?.heartRate} placeholder="72" />
        </div>
        <div className="space-y-2">
          <Label>BP Systolic</Label>
          <Input name="bpSystolic" type="number" defaultValue={existing?.bloodPressureSystolic} placeholder="120" />
        </div>
        <div className="space-y-2">
          <Label>BP Diastolic</Label>
          <Input name="bpDiastolic" type="number" defaultValue={existing?.bloodPressureDiastolic} placeholder="80" />
        </div>
        <div className="space-y-2">
          <Label>SpO2 (%)</Label>
          <Input name="spo2" type="number" defaultValue={existing?.spo2} placeholder="98" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Weight (kg)</Label>
          <Input name="weight" type="number" step="0.1" defaultValue={existing?.weight} placeholder="70" />
        </div>
        <div className="space-y-2">
          <Label>Height (cm)</Label>
          <Input name="height" type="number" defaultValue={existing?.height} placeholder="170" />
        </div>
        <div className="space-y-2">
          <Label>Temperature (°C)</Label>
          <Input name="temperature" type="number" step="0.1" defaultValue={existing?.temperature} placeholder="36.5" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Comorbidities</Label>
          <Textarea name="comorbidities" defaultValue={existing?.comorbidities} placeholder="DM, HTN, CAD, etc." />
        </div>
        <div className="space-y-2">
          <Label>Current Medications</Label>
          <Textarea name="currentMedications" defaultValue={existing?.currentMedications} placeholder="List current medications" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Known Allergies</Label>
          <Input name="allergies" defaultValue={existing?.allergies} placeholder="NKDA or list allergies" />
        </div>
        <div className="space-y-2">
          <Label>Previous Anaesthesia History</Label>
          <Input name="previousAnaesthesia" defaultValue={existing?.previousAnaesthesia} placeholder="Uneventful / Complications" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Anaesthesia Plan</Label>
        <Select name="anaesthesiaPlan" defaultValue={existing?.anaesthesiaPlan || ""}>
          <SelectTrigger>
            <SelectValue placeholder="Select anaesthesia type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GA_ETT">General Anaesthesia (ETT)</SelectItem>
            <SelectItem value="GA_LMA">General Anaesthesia (LMA)</SelectItem>
            <SelectItem value="GA_MASK">General Anaesthesia (Mask)</SelectItem>
            <SelectItem value="SPINAL">Spinal Anaesthesia</SelectItem>
            <SelectItem value="EPIDURAL">Epidural Anaesthesia</SelectItem>
            <SelectItem value="CSE">Combined Spinal-Epidural</SelectItem>
            <SelectItem value="REGIONAL">Regional Block</SelectItem>
            <SelectItem value="LOCAL">Local Anaesthesia</SelectItem>
            <SelectItem value="MAC">Monitored Anaesthesia Care</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Special Considerations</Label>
        <Textarea name="specialConsiderations" defaultValue={existing?.specialConsiderations} placeholder="Difficult airway, aspiration risk, cardiac precautions, etc." />
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="fitForSurgery" defaultChecked={existing?.fitForSurgery !== false} className="h-4 w-4" />
          <span className="font-medium">Patient is fit for surgery under proposed anaesthesia</span>
        </label>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Evaluation"}
        </Button>
      </div>
    </form>
  );
}

function SafetyChecklistForm({ existing, onSubmit, isLoading }: { existing: any; onSubmit: (d: any) => void; isLoading: boolean }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      signInCompletedBy: formData.get("signInCompletedBy"),
      signInCompletedAt: new Date().toISOString(),
      patientConfirmedIdentity: formData.get("patientConfirmedIdentity") === "on",
      siteMarkedConfirmed: formData.get("siteMarkedConfirmed") === "on",
      anaesthesiaSafetyChecked: formData.get("anaesthesiaSafetyChecked") === "on",
      pulseOximeterFunctioning: formData.get("pulseOximeterFunctioning") === "on",
      allergyConfirmed: formData.get("allergyConfirmed") === "on",
      difficultAirwayRisk: formData.get("difficultAirwayRisk"),
      aspirationRisk: formData.get("aspirationRisk"),
      bloodLossRisk: formData.get("bloodLossRisk"),
      timeOutDone: formData.get("timeOutDone") === "on",
      teamIntroduced: formData.get("teamIntroduced") === "on",
      procedureConfirmed: formData.get("procedureConfirmed") === "on",
      antibioticGiven: formData.get("antibioticGiven") === "on",
      imagingDisplayed: formData.get("imagingDisplayed") === "on",
      signOutDone: formData.get("signOutDone") === "on",
      specimenLabeled: formData.get("specimenLabeled") === "on",
      instrumentCountCorrect: formData.get("instrumentCountCorrect") === "on",
      equipmentIssues: formData.get("equipmentIssues"),
      recoveryPlan: formData.get("recoveryPlan"),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Completed By</Label>
        <Input name="signInCompletedBy" defaultValue={existing?.signInCompletedBy} placeholder="Circulating Nurse name" required />
      </div>

      <Tabs defaultValue="signin" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="signin">Sign In (Before Induction)</TabsTrigger>
          <TabsTrigger value="timeout">Time Out (Before Incision)</TabsTrigger>
          <TabsTrigger value="signout">Sign Out (Before Exit)</TabsTrigger>
        </TabsList>

        <TabsContent value="signin" className="space-y-3 pt-4">
          <h4 className="font-medium">Before Induction of Anaesthesia</h4>
          <div className="space-y-2 border rounded-lg p-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="patientConfirmedIdentity" defaultChecked={existing?.patientConfirmedIdentity} className="h-4 w-4" />
              Patient has confirmed identity, site, procedure, and consent
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="siteMarkedConfirmed" defaultChecked={existing?.siteMarkedConfirmed} className="h-4 w-4" />
              Site marked / Not applicable
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="anaesthesiaSafetyChecked" defaultChecked={existing?.anaesthesiaSafetyChecked} className="h-4 w-4" />
              Anaesthesia safety check completed
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="pulseOximeterFunctioning" defaultChecked={existing?.pulseOximeterFunctioning} className="h-4 w-4" />
              Pulse oximeter on patient and functioning
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="allergyConfirmed" defaultChecked={existing?.allergyConfirmed} className="h-4 w-4" />
              Known allergy status confirmed
            </label>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Difficult Airway / Aspiration Risk?</Label>
              <Select name="difficultAirwayRisk" defaultValue={existing?.difficultAirwayRisk || "no"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes_prepared">Yes, and equipment/assistance available</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Aspiration Risk?</Label>
              <Select name="aspirationRisk" defaultValue={existing?.aspirationRisk || "no"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes_prepared">Yes, RSI planned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Risk of Blood Loss more than 500ml?</Label>
              <Select name="bloodLossRisk" defaultValue={existing?.bloodLossRisk || "no"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes_prepared">Yes, blood products available</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeout" className="space-y-3 pt-4">
          <h4 className="font-medium">Before Skin Incision (Time Out)</h4>
          <div className="space-y-2 border rounded-lg p-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="timeOutDone" defaultChecked={existing?.timeOutDone} className="h-4 w-4" />
              Time Out performed
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="teamIntroduced" defaultChecked={existing?.teamIntroduced} className="h-4 w-4" />
              All team members introduced by name and role
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="procedureConfirmed" defaultChecked={existing?.procedureConfirmed} className="h-4 w-4" />
              Surgeon, anaesthetist, nurse verbally confirm patient, site, procedure
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="antibioticGiven" defaultChecked={existing?.antibioticGiven} className="h-4 w-4" />
              Antibiotic prophylaxis given within last 60 minutes (or N/A)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="imagingDisplayed" defaultChecked={existing?.imagingDisplayed} className="h-4 w-4" />
              Essential imaging displayed (or N/A)
            </label>
          </div>
        </TabsContent>

        <TabsContent value="signout" className="space-y-3 pt-4">
          <h4 className="font-medium">Before Patient Leaves Operating Room</h4>
          <div className="space-y-2 border rounded-lg p-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="signOutDone" defaultChecked={existing?.signOutDone} className="h-4 w-4" />
              Sign Out performed
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="specimenLabeled" defaultChecked={existing?.specimenLabeled} className="h-4 w-4" />
              Specimen labelled correctly (or N/A)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="instrumentCountCorrect" defaultChecked={existing?.instrumentCountCorrect} className="h-4 w-4" />
              Instrument, sponge, and needle counts complete
            </label>
          </div>
          <div className="space-y-2">
            <Label>Equipment Issues (if any)</Label>
            <Input name="equipmentIssues" defaultValue={existing?.equipmentIssues} placeholder="None, or describe issues" />
          </div>
          <div className="space-y-2">
            <Label>Key Recovery Concerns</Label>
            <Textarea name="recoveryPlan" defaultValue={existing?.recoveryPlan} placeholder="Post-op care instructions, monitoring requirements..." />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end border-t pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Safety Checklist"}
        </Button>
      </div>
    </form>
  );
}

function IntraOpPhase({ caseId, data }: { caseId: string; data: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeForm, setActiveForm] = useState<string | null>(null);

  const saveAnaesthesiaMutation = useMutation({
    mutationFn: (formData: any) => {
      const existingId = data?.anaesthesiaRecord?.id;
      if (existingId) {
        return apiRequest("PATCH", `/api/ot-cases/${caseId}/anaesthesia-record/${existingId}`, formData);
      }
      return apiRequest("POST", `/api/ot-cases/${caseId}/anaesthesia-record`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ot-cases", caseId] });
      toast({ title: "Saved", description: "Anaesthesia record updated" });
      setActiveForm(null);
    },
  });

  const saveTimeLogMutation = useMutation({
    mutationFn: (formData: any) => apiRequest("POST", `/api/ot-cases/${caseId}/time-log`, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ot-cases", caseId] });
      toast({ title: "Saved", description: "Time log entry added" });
    },
  });

  const saveSurgeonNotesMutation = useMutation({
    mutationFn: (formData: any) => {
      const existingId = data?.surgeonNotes?.id;
      if (existingId) {
        return apiRequest("PATCH", `/api/ot-cases/${caseId}/surgeon-notes/${existingId}`, formData);
      }
      return apiRequest("POST", `/api/ot-cases/${caseId}/surgeon-notes`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ot-cases", caseId] });
      toast({ title: "Saved", description: "Surgeon notes saved" });
      setActiveForm(null);
    },
  });

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
            <Dialog open={activeForm === section.key} onOpenChange={(open) => setActiveForm(open ? section.key : null)}>
              <DialogTrigger asChild>
                <Button size="sm" variant={section.done ? "outline" : "default"} className="w-full mt-2">
                  {section.done ? "View / Edit" : "Record"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {section.icon}
                    {section.title}
                  </DialogTitle>
                </DialogHeader>
                {section.key === "anaesthesia" && (
                  <AnaesthesiaRecordForm 
                    existing={data?.anaesthesiaRecord}
                    onSubmit={(d) => saveAnaesthesiaMutation.mutate(d)}
                    isLoading={saveAnaesthesiaMutation.isPending}
                  />
                )}
                {section.key === "timelog" && (
                  <TimeLogForm 
                    existing={data?.timeLog}
                    onSubmit={(d) => saveTimeLogMutation.mutate(d)}
                    isLoading={saveTimeLogMutation.isPending}
                  />
                )}
                {section.key === "notes" && (
                  <SurgeonNotesForm 
                    existing={data?.surgeonNotes}
                    onSubmit={(d) => saveSurgeonNotesMutation.mutate(d)}
                    isLoading={saveSurgeonNotesMutation.isPending}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnaesthesiaRecordForm({ existing, onSubmit, isLoading }: { existing: any; onSubmit: (d: any) => void; isLoading: boolean }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      anaesthetistId: formData.get("anaesthetistId"),
      anaesthesiaType: formData.get("anaesthesiaType"),
      inductionTime: formData.get("inductionTime"),
      airwayManagement: formData.get("airwayManagement"),
      ettSize: formData.get("ettSize"),
      intubationAttempts: parseInt(formData.get("intubationAttempts") as string) || 1,
      inductionAgents: formData.get("inductionAgents"),
      maintenanceAgents: formData.get("maintenanceAgents"),
      muscleRelaxants: formData.get("muscleRelaxants"),
      analgesics: formData.get("analgesics"),
      ivFluids: formData.get("ivFluids"),
      bloodProducts: formData.get("bloodProducts"),
      urineOutput: formData.get("urineOutput"),
      estimatedBloodLoss: formData.get("estimatedBloodLoss"),
      complications: formData.get("complications"),
      reversalAgents: formData.get("reversalAgents"),
      extubationTime: formData.get("extubationTime"),
      postOpDisposition: formData.get("postOpDisposition"),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Anaesthetist</Label>
          <Input name="anaesthetistId" defaultValue={existing?.anaesthetistId} placeholder="Dr. Name" required />
        </div>
        <div className="space-y-2">
          <Label>Anaesthesia Type</Label>
          <Select name="anaesthesiaType" defaultValue={existing?.anaesthesiaType || ""}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="GA_ETT">General (ETT)</SelectItem>
              <SelectItem value="GA_LMA">General (LMA)</SelectItem>
              <SelectItem value="SPINAL">Spinal</SelectItem>
              <SelectItem value="EPIDURAL">Epidural</SelectItem>
              <SelectItem value="CSE">Combined Spinal-Epidural</SelectItem>
              <SelectItem value="REGIONAL">Regional Block</SelectItem>
              <SelectItem value="LOCAL">Local</SelectItem>
              <SelectItem value="MAC">Monitored Anaesthesia Care</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Induction Time</Label>
          <Input name="inductionTime" type="time" defaultValue={existing?.inductionTime} />
        </div>
        <div className="space-y-2">
          <Label>Airway Management</Label>
          <Select name="airwayManagement" defaultValue={existing?.airwayManagement || ""}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ETT">Endotracheal Tube</SelectItem>
              <SelectItem value="LMA">LMA</SelectItem>
              <SelectItem value="MASK">Face Mask</SelectItem>
              <SelectItem value="NATURAL">Natural Airway</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>ETT Size / LMA Size</Label>
          <Input name="ettSize" defaultValue={existing?.ettSize} placeholder="e.g., 7.5" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Induction Agents</Label>
          <Input name="inductionAgents" defaultValue={existing?.inductionAgents} placeholder="e.g., Propofol 150mg, Fentanyl 100mcg" />
        </div>
        <div className="space-y-2">
          <Label>Maintenance Agents</Label>
          <Input name="maintenanceAgents" defaultValue={existing?.maintenanceAgents} placeholder="e.g., Sevoflurane 2%, O2/Air" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Muscle Relaxants</Label>
          <Input name="muscleRelaxants" defaultValue={existing?.muscleRelaxants} placeholder="e.g., Rocuronium 50mg" />
        </div>
        <div className="space-y-2">
          <Label>Analgesics</Label>
          <Input name="analgesics" defaultValue={existing?.analgesics} placeholder="e.g., Morphine 4mg, Paracetamol 1g" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>IV Fluids</Label>
          <Input name="ivFluids" defaultValue={existing?.ivFluids} placeholder="e.g., RL 1500ml" />
        </div>
        <div className="space-y-2">
          <Label>Blood Products</Label>
          <Input name="bloodProducts" defaultValue={existing?.bloodProducts} placeholder="e.g., 1 unit PRBC" />
        </div>
        <div className="space-y-2">
          <Label>Est. Blood Loss (ml)</Label>
          <Input name="estimatedBloodLoss" type="number" defaultValue={existing?.estimatedBloodLoss} placeholder="200" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Urine Output (ml)</Label>
          <Input name="urineOutput" defaultValue={existing?.urineOutput} placeholder="e.g., 350ml" />
        </div>
        <div className="space-y-2">
          <Label>Complications</Label>
          <Input name="complications" defaultValue={existing?.complications} placeholder="None, or describe" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Reversal Agents</Label>
          <Input name="reversalAgents" defaultValue={existing?.reversalAgents} placeholder="e.g., Neostigmine + Glycopyrrolate" />
        </div>
        <div className="space-y-2">
          <Label>Extubation Time</Label>
          <Input name="extubationTime" type="time" defaultValue={existing?.extubationTime} />
        </div>
        <div className="space-y-2">
          <Label>Post-Op Disposition</Label>
          <Select name="postOpDisposition" defaultValue={existing?.postOpDisposition || "PACU"}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PACU">PACU / Recovery</SelectItem>
              <SelectItem value="ICU">ICU</SelectItem>
              <SelectItem value="HDU">HDU</SelectItem>
              <SelectItem value="WARD">Ward (Direct)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Anaesthesia Record"}
        </Button>
      </div>
    </form>
  );
}

function TimeLogForm({ existing, onSubmit, isLoading }: { existing: any[]; onSubmit: (d: any) => void; isLoading: boolean }) {
  const [eventType, setEventType] = useState("");
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      eventType: formData.get("eventType"),
      eventTime: formData.get("eventTime"),
      recordedBy: formData.get("recordedBy"),
      notes: formData.get("notes"),
    });
    (e.target as HTMLFormElement).reset();
  };

  const timeEvents = [
    { value: "patient_in_ot", label: "Patient In OT" },
    { value: "anaesthesia_start", label: "Anaesthesia Start" },
    { value: "surgery_start", label: "Surgery Start (Incision)" },
    { value: "specimen_sent", label: "Specimen Sent" },
    { value: "surgery_end", label: "Surgery End (Closure)" },
    { value: "anaesthesia_end", label: "Anaesthesia End" },
    { value: "patient_out_ot", label: "Patient Out of OT" },
    { value: "patient_to_recovery", label: "Patient to Recovery" },
    { value: "custom", label: "Custom Event" },
  ];

  return (
    <div className="space-y-4">
      {existing && existing.length > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Recorded Events</h4>
          <div className="space-y-2">
            {existing.map((entry: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4 text-sm p-2 bg-muted/50 rounded">
                <span className="font-mono">{entry.eventTime}</span>
                <span className="font-medium">{entry.eventType?.replace(/_/g, " ")}</span>
                {entry.notes && <span className="text-muted-foreground">- {entry.notes}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
        <h4 className="font-medium">Add New Time Entry</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Event Type</Label>
            <Select name="eventType" value={eventType} onValueChange={setEventType}>
              <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
              <SelectContent>
                {timeEvents.map(ev => (
                  <SelectItem key={ev.value} value={ev.value}>{ev.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Time</Label>
            <Input name="eventTime" type="time" required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Recorded By</Label>
            <Input name="recordedBy" placeholder="Staff name" required />
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input name="notes" placeholder="Any additional notes" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Time Entry"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function SurgeonNotesForm({ existing, onSubmit, isLoading }: { existing: any; onSubmit: (d: any) => void; isLoading: boolean }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      surgeonId: formData.get("surgeonId"),
      assistants: formData.get("assistants"),
      scrubNurse: formData.get("scrubNurse"),
      circulatingNurse: formData.get("circulatingNurse"),
      position: formData.get("position"),
      incision: formData.get("incision"),
      findings: formData.get("findings"),
      procedurePerformed: formData.get("procedurePerformed"),
      specimens: formData.get("specimens"),
      drains: formData.get("drains"),
      closureTechnique: formData.get("closureTechnique"),
      complications: formData.get("complications"),
      postOpInstructions: formData.get("postOpInstructions"),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Lead Surgeon</Label>
          <Input name="surgeonId" defaultValue={existing?.surgeonId} placeholder="Dr. Name" required />
        </div>
        <div className="space-y-2">
          <Label>Assistants</Label>
          <Input name="assistants" defaultValue={existing?.assistants} placeholder="Dr. A, Dr. B" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Scrub Nurse</Label>
          <Input name="scrubNurse" defaultValue={existing?.scrubNurse} placeholder="Nurse name" />
        </div>
        <div className="space-y-2">
          <Label>Circulating Nurse</Label>
          <Input name="circulatingNurse" defaultValue={existing?.circulatingNurse} placeholder="Nurse name" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Patient Position</Label>
          <Select name="position" defaultValue={existing?.position || ""}>
            <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="supine">Supine</SelectItem>
              <SelectItem value="prone">Prone</SelectItem>
              <SelectItem value="lateral">Lateral</SelectItem>
              <SelectItem value="lithotomy">Lithotomy</SelectItem>
              <SelectItem value="trendelenburg">Trendelenburg</SelectItem>
              <SelectItem value="reverse_trendelenburg">Reverse Trendelenburg</SelectItem>
              <SelectItem value="sitting">Sitting</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Incision Type</Label>
          <Input name="incision" defaultValue={existing?.incision} placeholder="e.g., Midline, Pfannenstiel" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Operative Findings</Label>
        <Textarea name="findings" defaultValue={existing?.findings} placeholder="Describe intra-operative findings..." className="min-h-[80px]" />
      </div>

      <div className="space-y-2">
        <Label>Procedure Performed</Label>
        <Textarea name="procedurePerformed" defaultValue={existing?.procedurePerformed} placeholder="Step-by-step description of procedure..." className="min-h-[100px]" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Specimens Sent</Label>
          <Input name="specimens" defaultValue={existing?.specimens} placeholder="e.g., Gallbladder for HPE" />
        </div>
        <div className="space-y-2">
          <Label>Drains Placed</Label>
          <Input name="drains" defaultValue={existing?.drains} placeholder="e.g., Abdominal drain 28Fr" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Closure Technique</Label>
          <Input name="closureTechnique" defaultValue={existing?.closureTechnique} placeholder="e.g., Vicryl 1-0, Skin staples" />
        </div>
        <div className="space-y-2">
          <Label>Complications</Label>
          <Input name="complications" defaultValue={existing?.complications} placeholder="None, or describe" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Post-Operative Instructions</Label>
        <Textarea name="postOpInstructions" defaultValue={existing?.postOpInstructions} placeholder="Diet, activity, medications, follow-up..." />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Surgeon Notes"}
        </Button>
      </div>
    </form>
  );
}

function PostOpPhase({ caseId, data }: { caseId: string; data: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeForm, setActiveForm] = useState<string | null>(null);

  const saveAssessmentMutation = useMutation({
    mutationFn: (formData: any) => apiRequest("POST", `/api/ot-cases/${caseId}/postop-assessment`, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ot-cases", caseId] });
      toast({ title: "Saved", description: "Post-op assessment recorded" });
    },
  });

  const saveMonitoringMutation = useMutation({
    mutationFn: (formData: any) => apiRequest("POST", `/api/ot-cases/${caseId}/monitoring-chart`, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ot-cases", caseId] });
      toast({ title: "Saved", description: "Monitoring entry added" });
    },
  });

  const saveLabourMutation = useMutation({
    mutationFn: (formData: any) => apiRequest("POST", `/api/ot-cases/${caseId}/labour-chart`, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ot-cases", caseId] });
      toast({ title: "Saved", description: "Labour chart entry added" });
    },
  });

  const saveNeonateMutation = useMutation({
    mutationFn: (formData: any) => {
      const existingId = data?.neonateSheet?.id;
      if (existingId) {
        return apiRequest("PATCH", `/api/ot-cases/${caseId}/neonate-sheet/${existingId}`, formData);
      }
      return apiRequest("POST", `/api/ot-cases/${caseId}/neonate-sheet`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ot-cases", caseId] });
      toast({ title: "Saved", description: "Neonate sheet saved" });
      setActiveForm(null);
    },
  });

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
            <Dialog open={activeForm === section.key} onOpenChange={(open) => setActiveForm(open ? section.key : null)}>
              <DialogTrigger asChild>
                <Button size="sm" variant={section.done ? "outline" : "default"} className="w-full mt-2">
                  {section.done ? "View / Add" : "Record"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {section.icon}
                    {section.title}
                  </DialogTitle>
                </DialogHeader>
                {section.key === "assessment" && (
                  <PostOpAssessmentForm 
                    existing={data?.assessments}
                    onSubmit={(d) => saveAssessmentMutation.mutate(d)}
                    isLoading={saveAssessmentMutation.isPending}
                  />
                )}
                {section.key === "monitoring" && (
                  <MonitoringChartForm 
                    existing={data?.monitoringChart}
                    onSubmit={(d) => saveMonitoringMutation.mutate(d)}
                    isLoading={saveMonitoringMutation.isPending}
                  />
                )}
                {section.key === "labour" && (
                  <LabourChartForm 
                    existing={data?.labourChart}
                    onSubmit={(d) => saveLabourMutation.mutate(d)}
                    isLoading={saveLabourMutation.isPending}
                  />
                )}
                {section.key === "neonate" && (
                  <NeonateSheetForm 
                    existing={data?.neonateSheet}
                    onSubmit={(d) => saveNeonateMutation.mutate(d)}
                    isLoading={saveNeonateMutation.isPending}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>
    </div>
  );
}

function PostOpAssessmentForm({ existing, onSubmit, isLoading }: { existing: any[]; onSubmit: (d: any) => void; isLoading: boolean }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      assessedBy: formData.get("assessedBy"),
      assessedAt: new Date().toISOString(),
      consciousnessLevel: formData.get("consciousnessLevel"),
      painScore: parseInt(formData.get("painScore") as string) || null,
      heartRate: parseInt(formData.get("heartRate") as string) || null,
      bloodPressure: formData.get("bloodPressure"),
      respiratoryRate: parseInt(formData.get("respiratoryRate") as string) || null,
      spo2: parseInt(formData.get("spo2") as string) || null,
      temperature: parseFloat(formData.get("temperature") as string) || null,
      nauseaVomiting: formData.get("nauseaVomiting"),
      urineOutput: formData.get("urineOutput"),
      drainOutput: formData.get("drainOutput"),
      woundStatus: formData.get("woundStatus"),
      mobilization: formData.get("mobilization"),
      oralIntake: formData.get("oralIntake"),
      complications: formData.get("complications"),
      notes: formData.get("notes"),
    });
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="space-y-4">
      {existing && existing.length > 0 && (
        <div className="border rounded-lg p-4 max-h-[200px] overflow-y-auto">
          <h4 className="font-medium mb-2">Previous Assessments</h4>
          <div className="space-y-2 text-sm">
            {existing.map((a: any, idx: number) => (
              <div key={idx} className="p-2 bg-muted/50 rounded flex justify-between">
                <span>{format(new Date(a.assessedAt), "MMM dd, HH:mm")} - {a.assessedBy}</span>
                <span>Pain: {a.painScore}/10, SpO2: {a.spo2}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
        <h4 className="font-medium">New Post-Op Assessment</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Assessed By</Label>
            <Input name="assessedBy" placeholder="Dr./Nurse name" required />
          </div>
          <div className="space-y-2">
            <Label>Consciousness Level</Label>
            <Select name="consciousnessLevel" defaultValue="alert">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alert">Alert & Oriented</SelectItem>
                <SelectItem value="drowsy">Drowsy but Rousable</SelectItem>
                <SelectItem value="confused">Confused</SelectItem>
                <SelectItem value="unresponsive">Unresponsive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3">
          <div className="space-y-2">
            <Label>Pain Score (0-10)</Label>
            <Input name="painScore" type="number" min="0" max="10" placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label>Heart Rate</Label>
            <Input name="heartRate" type="number" placeholder="72" />
          </div>
          <div className="space-y-2">
            <Label>BP (mmHg)</Label>
            <Input name="bloodPressure" placeholder="120/80" />
          </div>
          <div className="space-y-2">
            <Label>SpO2 (%)</Label>
            <Input name="spo2" type="number" placeholder="98" />
          </div>
          <div className="space-y-2">
            <Label>Temp (°C)</Label>
            <Input name="temperature" type="number" step="0.1" placeholder="36.5" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Nausea/Vomiting</Label>
            <Select name="nauseaVomiting" defaultValue="none">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="mild">Mild Nausea</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="severe">Severe Vomiting</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Urine Output</Label>
            <Input name="urineOutput" placeholder="e.g., 200ml" />
          </div>
          <div className="space-y-2">
            <Label>Drain Output</Label>
            <Input name="drainOutput" placeholder="e.g., 50ml serosanguinous" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Wound Status</Label>
            <Select name="woundStatus" defaultValue="clean">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="clean">Clean & Dry</SelectItem>
                <SelectItem value="minimal_ooze">Minimal Ooze</SelectItem>
                <SelectItem value="soaked">Dressing Soaked</SelectItem>
                <SelectItem value="infection">Signs of Infection</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mobilization</Label>
            <Select name="mobilization" defaultValue="bedrest">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bedrest">Bed Rest</SelectItem>
                <SelectItem value="sitting">Sitting Up</SelectItem>
                <SelectItem value="standing">Standing with Support</SelectItem>
                <SelectItem value="walking">Walking</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Oral Intake</Label>
            <Select name="oralIntake" defaultValue="nil">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nil">Nil by Mouth</SelectItem>
                <SelectItem value="sips">Sips of Water</SelectItem>
                <SelectItem value="liquids">Clear Liquids</SelectItem>
                <SelectItem value="soft">Soft Diet</SelectItem>
                <SelectItem value="regular">Regular Diet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Complications (if any)</Label>
          <Input name="complications" placeholder="None, or describe" />
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea name="notes" placeholder="Additional observations..." />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Add Assessment"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function MonitoringChartForm({ existing, onSubmit, isLoading }: { existing: any[]; onSubmit: (d: any) => void; isLoading: boolean }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      recordedBy: formData.get("recordedBy"),
      recordedAt: new Date().toISOString(),
      heartRate: parseInt(formData.get("heartRate") as string) || null,
      bloodPressureSystolic: parseInt(formData.get("bpSystolic") as string) || null,
      bloodPressureDiastolic: parseInt(formData.get("bpDiastolic") as string) || null,
      respiratoryRate: parseInt(formData.get("respiratoryRate") as string) || null,
      spo2: parseInt(formData.get("spo2") as string) || null,
      temperature: parseFloat(formData.get("temperature") as string) || null,
      painScore: parseInt(formData.get("painScore") as string) || null,
      consciousness: formData.get("consciousness"),
      ivFluids: formData.get("ivFluids"),
      medications: formData.get("medications"),
      urineOutput: formData.get("urineOutput"),
      notes: formData.get("notes"),
    });
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="space-y-4">
      {existing && existing.length > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Monitoring History</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Time</th>
                  <th className="p-2">HR</th>
                  <th className="p-2">BP</th>
                  <th className="p-2">RR</th>
                  <th className="p-2">SpO2</th>
                  <th className="p-2">Temp</th>
                  <th className="p-2">Pain</th>
                </tr>
              </thead>
              <tbody>
                {existing.slice(-10).map((m: any, idx: number) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{format(new Date(m.recordedAt), "HH:mm")}</td>
                    <td className="p-2 text-center">{m.heartRate}</td>
                    <td className="p-2 text-center">{m.bloodPressureSystolic}/{m.bloodPressureDiastolic}</td>
                    <td className="p-2 text-center">{m.respiratoryRate}</td>
                    <td className="p-2 text-center">{m.spo2}%</td>
                    <td className="p-2 text-center">{m.temperature}°C</td>
                    <td className="p-2 text-center">{m.painScore}/10</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
        <h4 className="font-medium">Add Monitoring Entry</h4>
        
        <div className="space-y-2">
          <Label>Recorded By</Label>
          <Input name="recordedBy" placeholder="Nurse name" required />
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="space-y-2">
            <Label>Heart Rate (bpm)</Label>
            <Input name="heartRate" type="number" placeholder="72" />
          </div>
          <div className="space-y-2">
            <Label>BP Systolic</Label>
            <Input name="bpSystolic" type="number" placeholder="120" />
          </div>
          <div className="space-y-2">
            <Label>BP Diastolic</Label>
            <Input name="bpDiastolic" type="number" placeholder="80" />
          </div>
          <div className="space-y-2">
            <Label>RR (/min)</Label>
            <Input name="respiratoryRate" type="number" placeholder="16" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="space-y-2">
            <Label>SpO2 (%)</Label>
            <Input name="spo2" type="number" placeholder="98" />
          </div>
          <div className="space-y-2">
            <Label>Temperature (°C)</Label>
            <Input name="temperature" type="number" step="0.1" placeholder="36.5" />
          </div>
          <div className="space-y-2">
            <Label>Pain Score (0-10)</Label>
            <Input name="painScore" type="number" min="0" max="10" placeholder="2" />
          </div>
          <div className="space-y-2">
            <Label>Consciousness</Label>
            <Select name="consciousness" defaultValue="alert">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alert">Alert</SelectItem>
                <SelectItem value="drowsy">Drowsy</SelectItem>
                <SelectItem value="confused">Confused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>IV Fluids Running</Label>
            <Input name="ivFluids" placeholder="e.g., NS @ 100ml/hr" />
          </div>
          <div className="space-y-2">
            <Label>Medications Given</Label>
            <Input name="medications" placeholder="e.g., Paracetamol 1g" />
          </div>
          <div className="space-y-2">
            <Label>Urine Output</Label>
            <Input name="urineOutput" placeholder="e.g., 100ml" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Input name="notes" placeholder="Any observations" />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Entry"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function LabourChartForm({ existing, onSubmit, isLoading }: { existing: any[]; onSubmit: (d: any) => void; isLoading: boolean }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      recordedBy: formData.get("recordedBy"),
      recordedAt: new Date().toISOString(),
      cervicalDilation: parseInt(formData.get("cervicalDilation") as string) || null,
      effacement: formData.get("effacement"),
      station: formData.get("station"),
      fetalHeartRate: parseInt(formData.get("fetalHeartRate") as string) || null,
      contractionFrequency: formData.get("contractionFrequency"),
      contractionDuration: formData.get("contractionDuration"),
      membranes: formData.get("membranes"),
      liquorColor: formData.get("liquorColor"),
      maternalPulse: parseInt(formData.get("maternalPulse") as string) || null,
      maternalBP: formData.get("maternalBP"),
      urineOutput: formData.get("urineOutput"),
      notes: formData.get("notes"),
    });
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="space-y-4">
      {existing && existing.length > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Labour Progress</h4>
          <div className="space-y-2 text-sm max-h-[150px] overflow-y-auto">
            {existing.map((l: any, idx: number) => (
              <div key={idx} className="p-2 bg-muted/50 rounded flex justify-between">
                <span>{format(new Date(l.recordedAt), "HH:mm")}</span>
                <span>Dilation: {l.cervicalDilation}cm, FHR: {l.fetalHeartRate}bpm</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
        <h4 className="font-medium">Add Labour Chart Entry</h4>
        
        <div className="space-y-2">
          <Label>Recorded By</Label>
          <Input name="recordedBy" placeholder="Midwife/Doctor name" required />
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="space-y-2">
            <Label>Cervical Dilation (cm)</Label>
            <Input name="cervicalDilation" type="number" min="0" max="10" placeholder="5" />
          </div>
          <div className="space-y-2">
            <Label>Effacement</Label>
            <Select name="effacement" defaultValue="">
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0%</SelectItem>
                <SelectItem value="25">25%</SelectItem>
                <SelectItem value="50">50%</SelectItem>
                <SelectItem value="75">75%</SelectItem>
                <SelectItem value="100">100%</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Station</Label>
            <Select name="station" defaultValue="">
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="-3">-3</SelectItem>
                <SelectItem value="-2">-2</SelectItem>
                <SelectItem value="-1">-1</SelectItem>
                <SelectItem value="0">0 (Engaged)</SelectItem>
                <SelectItem value="+1">+1</SelectItem>
                <SelectItem value="+2">+2</SelectItem>
                <SelectItem value="+3">+3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fetal Heart Rate</Label>
            <Input name="fetalHeartRate" type="number" placeholder="140" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="space-y-2">
            <Label>Contraction Freq</Label>
            <Input name="contractionFrequency" placeholder="e.g., 3 in 10 min" />
          </div>
          <div className="space-y-2">
            <Label>Contraction Duration</Label>
            <Input name="contractionDuration" placeholder="e.g., 40-50 sec" />
          </div>
          <div className="space-y-2">
            <Label>Membranes</Label>
            <Select name="membranes" defaultValue="">
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="intact">Intact</SelectItem>
                <SelectItem value="srom">SROM</SelectItem>
                <SelectItem value="arom">AROM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Liquor Color</Label>
            <Select name="liquorColor" defaultValue="">
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">Clear</SelectItem>
                <SelectItem value="meconium_thin">Thin Meconium</SelectItem>
                <SelectItem value="meconium_thick">Thick Meconium</SelectItem>
                <SelectItem value="blood_stained">Blood Stained</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Maternal Pulse</Label>
            <Input name="maternalPulse" type="number" placeholder="80" />
          </div>
          <div className="space-y-2">
            <Label>Maternal BP</Label>
            <Input name="maternalBP" placeholder="120/80" />
          </div>
          <div className="space-y-2">
            <Label>Urine Output</Label>
            <Input name="urineOutput" placeholder="e.g., 100ml" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea name="notes" placeholder="Observations, interventions..." />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Entry"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function NeonateSheetForm({ existing, onSubmit, isLoading }: { existing: any; onSubmit: (d: any) => void; isLoading: boolean }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      recordedBy: formData.get("recordedBy"),
      birthTime: formData.get("birthTime"),
      gender: formData.get("gender"),
      birthWeight: parseFloat(formData.get("birthWeight") as string) || null,
      birthLength: parseFloat(formData.get("birthLength") as string) || null,
      headCircumference: parseFloat(formData.get("headCircumference") as string) || null,
      apgar1min: parseInt(formData.get("apgar1min") as string) || null,
      apgar5min: parseInt(formData.get("apgar5min") as string) || null,
      apgar10min: parseInt(formData.get("apgar10min") as string) || null,
      resuscitationRequired: formData.get("resuscitationRequired") === "on",
      resuscitationDetails: formData.get("resuscitationDetails"),
      cordBloodCollected: formData.get("cordBloodCollected") === "on",
      vitaminKGiven: formData.get("vitaminKGiven") === "on",
      bcgGiven: formData.get("bcgGiven") === "on",
      opvGiven: formData.get("opvGiven") === "on",
      hepatitisB0Given: formData.get("hepatitisB0Given") === "on",
      skinToSkinContact: formData.get("skinToSkinContact") === "on",
      initiatedBreastfeeding: formData.get("initiatedBreastfeeding") === "on",
      breastfeedingTime: formData.get("breastfeedingTime"),
      congenitalAnomalies: formData.get("congenitalAnomalies"),
      nicu_required: formData.get("nicuRequired") === "on",
      nicuReason: formData.get("nicuReason"),
      notes: formData.get("notes"),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Recorded By</Label>
          <Input name="recordedBy" defaultValue={existing?.recordedBy} placeholder="Paediatrician/Nurse" required />
        </div>
        <div className="space-y-2">
          <Label>Birth Time</Label>
          <Input name="birthTime" type="time" defaultValue={existing?.birthTime} required />
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select name="gender" defaultValue={existing?.gender || ""}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="ambiguous">Ambiguous</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Birth Weight (kg)</Label>
          <Input name="birthWeight" type="number" step="0.01" defaultValue={existing?.birthWeight} placeholder="3.2" />
        </div>
        <div className="space-y-2">
          <Label>Length (cm)</Label>
          <Input name="birthLength" type="number" step="0.1" defaultValue={existing?.birthLength} placeholder="50" />
        </div>
        <div className="space-y-2">
          <Label>Head Circumference (cm)</Label>
          <Input name="headCircumference" type="number" step="0.1" defaultValue={existing?.headCircumference} placeholder="35" />
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3">APGAR Scores</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>1 Minute</Label>
            <Input name="apgar1min" type="number" min="0" max="10" defaultValue={existing?.apgar1min} placeholder="8" />
          </div>
          <div className="space-y-2">
            <Label>5 Minutes</Label>
            <Input name="apgar5min" type="number" min="0" max="10" defaultValue={existing?.apgar5min} placeholder="9" />
          </div>
          <div className="space-y-2">
            <Label>10 Minutes (if needed)</Label>
            <Input name="apgar10min" type="number" min="0" max="10" defaultValue={existing?.apgar10min} placeholder="" />
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3">Resuscitation</h4>
        <label className="flex items-center gap-2 text-sm mb-2">
          <input type="checkbox" name="resuscitationRequired" defaultChecked={existing?.resuscitationRequired} className="h-4 w-4" />
          Resuscitation Required
        </label>
        <div className="space-y-2">
          <Label>Details (if required)</Label>
          <Input name="resuscitationDetails" defaultValue={existing?.resuscitationDetails} placeholder="e.g., Suction, O2, PPV" />
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3">Immediate Care & Vaccinations</h4>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="vitaminKGiven" defaultChecked={existing?.vitaminKGiven} className="h-4 w-4" />
            Vitamin K Given
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="bcgGiven" defaultChecked={existing?.bcgGiven} className="h-4 w-4" />
            BCG Given
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="opvGiven" defaultChecked={existing?.opvGiven} className="h-4 w-4" />
            OPV 0 Given
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="hepatitisB0Given" defaultChecked={existing?.hepatitisB0Given} className="h-4 w-4" />
            Hepatitis B 0 Given
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="cordBloodCollected" defaultChecked={existing?.cordBloodCollected} className="h-4 w-4" />
            Cord Blood Collected
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="skinToSkinContact" defaultChecked={existing?.skinToSkinContact} className="h-4 w-4" />
            Skin-to-Skin Contact Done
          </label>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3">Breastfeeding Initiation</h4>
        <label className="flex items-center gap-2 text-sm mb-2">
          <input type="checkbox" name="initiatedBreastfeeding" defaultChecked={existing?.initiatedBreastfeeding} className="h-4 w-4" />
          Breastfeeding Initiated within 1 hour
        </label>
        <div className="space-y-2">
          <Label>Time of First Breastfeed</Label>
          <Input name="breastfeedingTime" type="time" defaultValue={existing?.breastfeedingTime} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Congenital Anomalies</Label>
          <Input name="congenitalAnomalies" defaultValue={existing?.congenitalAnomalies} placeholder="None, or describe" />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="nicuRequired" defaultChecked={existing?.nicu_required} className="h-4 w-4" />
            NICU Admission Required
          </label>
          <Input name="nicuReason" defaultValue={existing?.nicuReason} placeholder="Reason for NICU" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Additional Notes</Label>
        <Textarea name="notes" defaultValue={existing?.notes} placeholder="Any additional observations..." />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Neonate Sheet"}
        </Button>
      </div>
    </form>
  );
}
