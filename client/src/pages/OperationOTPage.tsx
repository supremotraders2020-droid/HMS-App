import { useState, useRef } from "react";
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
  Users, ChevronRight, ArrowLeft, Stethoscope, Printer, Heart
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

// Print helper function for OT forms
function printForm(title: string, content: string) {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - Gravity Hospital</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            h1 { color: #1a365d; border-bottom: 2px solid #2b6cb0; padding-bottom: 10px; font-size: 18px; }
            h2 { color: #2d3748; font-size: 14px; margin-top: 20px; }
            .header { background: #f7fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .field { margin: 8px 0; display: flex; }
            .field-label { font-weight: bold; width: 200px; color: #4a5568; }
            .field-value { flex: 1; }
            .checklist-item { padding: 4px 0; display: flex; align-items: center; gap: 8px; }
            .checked { color: #38a169; }
            .unchecked { color: #e53e3e; }
            .section { margin: 15px 0; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; }
            .footer { margin-top: 30px; font-size: 12px; color: #718096; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Gravity Hospital - ${title}</h1>
          ${content}
          <div class="footer">Generated on ${format(new Date(), "dd/MM/yyyy HH:mm")} | Gravity AI Manager</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  }
}

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
    id: tp.id,
    patientName: tp.name || tp.patientName || "Unknown Patient",
    uhid: tp.uhid || "",
    age: tp.age,
    gender: tp.gender,
    bedNumber: tp.room || tp.bedNumber || "",
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
            <PreOpPhase caseId={otCase.id} data={fullCase?.preOp} consents={fullCase?.consents} caseData={fullCase} />
          )}
          {activePhase === "intraop" && (
            <IntraOpPhase caseId={otCase.id} data={fullCase?.intraOp} caseData={fullCase} />
          )}
          {activePhase === "postop" && (
            <PostOpPhase caseId={otCase.id} data={fullCase?.postOp} caseData={fullCase} />
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

function PreOpPhase({ caseId, data, consents, caseData }: { caseId: string; data: any; consents: any; caseData: any }) {
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
      toast({ title: "Saved", description: "Pre-operative assessment recorded" });
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
    { key: "counselling", title: "Pre-Operative Assessment", icon: <Users className="h-4 w-4" />, done: !!data?.counselling },
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
                    caseData={caseData}
                  />
                )}
                {section.key === "checklist" && (
                  <ChecklistForm 
                    existing={checklist}
                    onSubmit={(d) => saveChecklistMutation.mutate(d)}
                    isLoading={saveChecklistMutation.isPending}
                    caseData={caseData}
                  />
                )}
                {section.key === "pae" && (
                  <PAEForm 
                    existing={pae}
                    onSubmit={(d) => savePaeMutation.mutate(d)}
                    isLoading={savePaeMutation.isPending}
                    caseData={caseData}
                  />
                )}
                {section.key === "safety" && (
                  <SafetyChecklistForm 
                    existing={safety}
                    onSubmit={(d) => saveSafetyMutation.mutate(d)}
                    isLoading={saveSafetyMutation.isPending}
                    caseData={caseData}
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

function CounsellingForm({ existing, onSubmit, isLoading, caseData }: { existing: any; onSubmit: (d: any) => void; isLoading: boolean; caseData?: any }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      dateOfOperation: formData.get("dateOfOperation"),
      timeOfOperation: formData.get("timeOfOperation"),
      operationTitle: formData.get("operationTitle"),
      surgeon: formData.get("surgeon"),
      siteOrganAssociated: formData.get("siteOrganAssociated"),
      timeOfLastMeal: formData.get("timeOfLastMeal"),
      bloodArranged: formData.get("bloodArranged"),
      hoDrugInteraction: formData.get("hoDrugInteraction"),
      preOpMedication: formData.get("preOpMedication"),
      preExposureProphylaxis: formData.get("preExposureProphylaxis"),
      otherMedicines: formData.get("otherMedicines"),
      preOpDiagnosis: formData.get("preOpDiagnosis"),
      ecg: formData.get("ecg"),
      bloodGroup: formData.get("bloodGroup"),
      hiv: formData.get("hiv"),
      echo: formData.get("echo"),
      urea: formData.get("urea"),
      hbsag: formData.get("hbsag"),
      tmt: formData.get("tmt"),
      creat: formData.get("creat"),
      t3: formData.get("t3"),
      physiologicalConditions: formData.get("physiologicalConditions"),
      bp: formData.get("bp"),
      rs: formData.get("rs"),
      surgeonRemarks: formData.get("surgeonRemarks"),
      nameOfSurgeon: formData.get("nameOfSurgeon"),
      surgeonSignature: formData.get("surgeonSignature"),
      assessmentDate: formData.get("assessmentDate"),
      assessmentTime: formData.get("assessmentTime"),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">GRAVITY HOSPITAL</h3>
              <p className="text-xs text-muted-foreground">Gat No. 167, Sahyog Nagar, Triveni Nagar, Nigdi</p>
              <p className="text-xs text-muted-foreground">Pimpri-Chinchwad, Maharashtra 411062</p>
              <p className="text-xs text-muted-foreground">Tel: +91 20 1234 5678 | Emergency: +91 20 1234 5680</p>
              <p className="text-xs text-muted-foreground">Email: info@gravityhospital.in</p>
            </div>
          </div>
          <div className="text-right text-sm space-y-1">
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 items-center text-xs">
              <span className="text-muted-foreground">Patient Name:</span>
              <Input name="preopPatientName" defaultValue={caseData?.patientName || ""} placeholder="Patient Name" className="text-xs" />
              <span className="text-muted-foreground">UHID No:</span>
              <Input name="preopUhid" defaultValue={caseData?.uhid || ""} placeholder="UHID" className="text-xs" />
              <span className="text-muted-foreground">Age/Gender:</span>
              <div className="flex gap-1">
                <Input name="preopAge" defaultValue={caseData?.patientAge || ""} placeholder="Age" className="text-xs w-14" />
                <Input name="preopGender" defaultValue={caseData?.patientGender || ""} placeholder="M/F" className="text-xs w-12" />
              </div>
              <span className="text-muted-foreground">Room/Bed:</span>
              <div className="flex gap-1">
                <Input name="preopRoom" defaultValue={caseData?.room || ""} placeholder="Room" className="text-xs" />
                <Input name="preopBed" defaultValue={caseData?.bedNumber || ""} placeholder="Bed" className="text-xs w-12" />
              </div>
              <span className="text-muted-foreground">Doctor:</span>
              <Input name="preopDoctor" defaultValue={caseData?.surgeonName || ""} placeholder="Doctor" className="text-xs" />
              <span className="text-muted-foreground">IPD No:</span>
              <Input name="preopIpdNo" defaultValue={caseData?.ipdNumber || ""} placeholder="IPD No" className="text-xs" />
              <span className="text-muted-foreground">DOA:</span>
              <Input name="preopDoa" type="date" defaultValue={caseData?.admissionDate ? format(new Date(caseData.admissionDate), "yyyy-MM-dd") : ""} className="text-xs" />
            </div>
          </div>
        </div>
        <div className="text-center border-t pt-3">
          <h2 className="font-bold text-lg">PRE OPERATIVE ASSESSMENT</h2>
        </div>
      </div>

      <div className="space-y-3 border rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Date of Operation</Label>
            <Input name="dateOfOperation" type="date" defaultValue={existing?.dateOfOperation || ""} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Time of Operation</Label>
            <Input name="timeOfOperation" type="time" defaultValue={existing?.timeOfOperation || ""} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Operation Title</Label>
          <Input name="operationTitle" defaultValue={existing?.operationTitle || caseData?.procedureName || ""} placeholder="Operation title" />
        </div>
        <div className="space-y-2">
          <Label>Surgeon</Label>
          <Input name="surgeon" defaultValue={existing?.surgeon || caseData?.surgeonName || ""} placeholder="Surgeon name" />
        </div>
      </div>

      <div className="space-y-3 border rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Site/Organ Associated</Label>
            <Input name="siteOrganAssociated" defaultValue={existing?.siteOrganAssociated || ""} placeholder="Site/Organ" />
          </div>
          <div className="space-y-2">
            <Label>Blood Arranged</Label>
            <Input name="bloodArranged" defaultValue={existing?.bloodArranged || ""} placeholder="Blood units arranged" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Time of Last Meal</Label>
          <Input name="timeOfLastMeal" defaultValue={existing?.timeOfLastMeal || ""} placeholder="Time of last meal" />
        </div>
      </div>

      <div className="space-y-3 border rounded-lg p-4">
        <div className="space-y-2">
          <Label>H/o Drug Interaction</Label>
          <Input name="hoDrugInteraction" defaultValue={existing?.hoDrugInteraction || ""} placeholder="History of drug interaction" />
        </div>
      </div>

      <div className="space-y-3 border rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Pre-Op Medication</Label>
            <Input name="preOpMedication" defaultValue={existing?.preOpMedication || ""} placeholder="Pre-Op medication" />
          </div>
          <div className="space-y-2">
            <Label>Other Medicines</Label>
            <Input name="otherMedicines" defaultValue={existing?.otherMedicines || ""} placeholder="Other medicines" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Pre Exposure Prophylaxis</Label>
          <Input name="preExposureProphylaxis" defaultValue={existing?.preExposureProphylaxis || ""} placeholder="Pre-exposure prophylaxis" />
        </div>
      </div>

      <div className="space-y-3 border rounded-lg p-4">
        <div className="space-y-2">
          <Label>Pre-op Diagnosis</Label>
          <Input name="preOpDiagnosis" defaultValue={existing?.preOpDiagnosis || caseData?.diagnosis || ""} placeholder="Pre-op diagnosis" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>ECG</Label>
            <Input name="ecg" defaultValue={existing?.ecg || ""} placeholder="ECG findings" />
          </div>
          <div className="space-y-2">
            <Label>Blood Group</Label>
            <Input name="bloodGroup" defaultValue={existing?.bloodGroup || ""} placeholder="Blood group" />
          </div>
          <div className="space-y-2">
            <Label>HIV</Label>
            <Input name="hiv" defaultValue={existing?.hiv || ""} placeholder="HIV status" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Echo</Label>
            <Input name="echo" defaultValue={existing?.echo || ""} placeholder="Echo findings" />
          </div>
          <div className="space-y-2">
            <Label>Urea</Label>
            <Input name="urea" defaultValue={existing?.urea || ""} placeholder="Urea value" />
          </div>
          <div className="space-y-2">
            <Label>HBsAg</Label>
            <Input name="hbsag" defaultValue={existing?.hbsag || ""} placeholder="HBsAg status" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>TMT</Label>
            <Input name="tmt" defaultValue={existing?.tmt || ""} placeholder="TMT findings" />
          </div>
          <div className="space-y-2">
            <Label>Creat</Label>
            <Input name="creat" defaultValue={existing?.creat || ""} placeholder="Creatinine value" />
          </div>
          <div className="space-y-2">
            <Label>T3</Label>
            <Input name="t3" defaultValue={existing?.t3 || ""} placeholder="T3 value" />
          </div>
        </div>
      </div>

      <div className="space-y-3 border rounded-lg p-4">
        <div className="space-y-2">
          <Label>Physiological Conditions</Label>
          <Input name="physiologicalConditions" defaultValue={existing?.physiologicalConditions || ""} placeholder="Physiological conditions" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>BP</Label>
            <Input name="bp" defaultValue={existing?.bp || ""} placeholder="Blood pressure" />
          </div>
          <div className="space-y-2">
            <Label>RS</Label>
            <Input name="rs" defaultValue={existing?.rs || ""} placeholder="Respiratory system" />
          </div>
        </div>
      </div>

      <div className="space-y-3 border rounded-lg p-4">
        <div className="space-y-2">
          <Label>Remarks of the Surgeon on Patient Assessment Findings</Label>
          <Textarea name="surgeonRemarks" defaultValue={existing?.surgeonRemarks || ""} placeholder="Surgeon's remarks on patient assessment findings..." rows={4} />
        </div>
      </div>

      <div className="space-y-3 border rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Name of Surgeon</Label>
            <Input name="nameOfSurgeon" defaultValue={existing?.nameOfSurgeon || caseData?.surgeonName || ""} placeholder="Surgeon name" />
          </div>
          <div className="space-y-2">
            <Label>Signature</Label>
            <Input name="surgeonSignature" defaultValue={existing?.surgeonSignature || ""} placeholder="Digital signature" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input name="assessmentDate" type="date" defaultValue={existing?.assessmentDate || format(new Date(), "yyyy-MM-dd")} />
          </div>
          <div className="space-y-2">
            <Label>Time</Label>
            <Input name="assessmentTime" type="time" defaultValue={existing?.assessmentTime || format(new Date(), "HH:mm")} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 sticky bottom-0 bg-background pt-2 pb-1">
        {existing && (
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              const form = (e.target as HTMLElement).closest('form');
              const getFormValue = (name: string) => {
                const input = form?.querySelector(`[name="${name}"]`) as HTMLInputElement;
                return input?.value || "";
              };
              const printPatientName = getFormValue('preopPatientName') || caseData?.patientName || "N/A";
              const printUhid = getFormValue('preopUhid') || caseData?.uhid || "N/A";
              const printAge = getFormValue('preopAge') || caseData?.patientAge || "N/A";
              const printGender = getFormValue('preopGender') || caseData?.patientGender || "N/A";
              const printRoom = getFormValue('preopRoom') || caseData?.room || "N/A";
              const printDoctor = getFormValue('preopDoctor') || caseData?.surgeonName || "N/A";
              const content = `
                <div class="header-section" style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                  <div>
                    <h2 style="margin: 0;">GRAVITY HOSPITAL</h2>
                    <p style="margin: 2px 0; font-size: 12px;">Gat No. 167, Sahyog Nagar, Triveni Nagar, Nigdi</p>
                    <p style="margin: 2px 0; font-size: 12px;">Pimpri-Chinchwad, Maharashtra 411062</p>
                    <p style="margin: 2px 0; font-size: 12px;">Tel: +91 20 1234 5678 | Emergency: +91 20 1234 5680</p>
                    <p style="margin: 2px 0; font-size: 12px;">Email: info@gravityhospital.in</p>
                  </div>
                  <div style="text-align: right; font-size: 12px;">
                    <p><strong>Patient Name:</strong> ${printPatientName}</p>
                    <p><strong>UHID No:</strong> ${printUhid}</p>
                    <p><strong>Age:</strong> ${printAge}/${printGender}</p>
                    <p><strong>Room:</strong> ${printRoom}</p>
                    <p><strong>Doctor:</strong> ${printDoctor}</p>
                  </div>
                </div>
                <h2 style="text-align: center; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 10px 0;">PRE OPERATIVE ASSESSMENT</h2>
                <div class="section">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="border: 1px solid #000; padding: 5px;"><strong>Date of Operation:</strong> ${existing.dateOfOperation || ""}</td><td style="border: 1px solid #000; padding: 5px;"><strong>Time of Operation:</strong> ${existing.timeOfOperation || ""}</td></tr>
                    <tr><td colspan="2" style="border: 1px solid #000; padding: 5px;"><strong>Operation Title:</strong> ${existing.operationTitle || ""}</td></tr>
                    <tr><td colspan="2" style="border: 1px solid #000; padding: 5px;"><strong>Surgeon:</strong> ${existing.surgeon || ""}</td></tr>
                  </table>
                </div>
                <div class="section" style="margin-top: 10px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="border: 1px solid #000; padding: 5px;"><strong>Site/Organ Associated:</strong> ${existing.siteOrganAssociated || ""}</td></tr>
                    <tr><td style="border: 1px solid #000; padding: 5px;"><strong>Time of Last Meal:</strong> ${existing.timeOfLastMeal || ""}</td><td style="border: 1px solid #000; padding: 5px;"><strong>Blood Arranged:</strong> ${existing.bloodArranged || ""}</td></tr>
                    <tr><td colspan="2" style="border: 1px solid #000; padding: 5px;"><strong>H/o Drug Interaction:</strong> ${existing.hoDrugInteraction || ""}</td></tr>
                  </table>
                </div>
                <div class="section" style="margin-top: 10px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="border: 1px solid #000; padding: 5px;"><strong>Pre-Op Medication:</strong> ${existing.preOpMedication || ""}</td></tr>
                    <tr><td style="border: 1px solid #000; padding: 5px;"><strong>Pre Exposure Prophylaxis:</strong> ${existing.preExposureProphylaxis || ""}</td><td style="border: 1px solid #000; padding: 5px;"><strong>Other Medicines:</strong> ${existing.otherMedicines || ""}</td></tr>
                  </table>
                </div>
                <div class="section" style="margin-top: 10px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td colspan="3" style="border: 1px solid #000; padding: 5px;"><strong>Pre-op Diagnosis:</strong> ${existing.preOpDiagnosis || ""}</td></tr>
                    <tr><td style="border: 1px solid #000; padding: 5px;"><strong>ECG:</strong> ${existing.ecg || ""}</td><td style="border: 1px solid #000; padding: 5px;"><strong>Blood Group:</strong> ${existing.bloodGroup || ""}</td><td style="border: 1px solid #000; padding: 5px;"><strong>HIV:</strong> ${existing.hiv || ""}</td></tr>
                    <tr><td style="border: 1px solid #000; padding: 5px;"><strong>Echo:</strong> ${existing.echo || ""}</td><td style="border: 1px solid #000; padding: 5px;"><strong>Urea:</strong> ${existing.urea || ""}</td><td style="border: 1px solid #000; padding: 5px;"><strong>HBsAg:</strong> ${existing.hbsag || ""}</td></tr>
                    <tr><td style="border: 1px solid #000; padding: 5px;"><strong>TMT:</strong> ${existing.tmt || ""}</td><td style="border: 1px solid #000; padding: 5px;"><strong>Creat:</strong> ${existing.creat || ""}</td><td style="border: 1px solid #000; padding: 5px;"><strong>T3:</strong> ${existing.t3 || ""}</td></tr>
                  </table>
                </div>
                <div class="section" style="margin-top: 10px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td colspan="2" style="border: 1px solid #000; padding: 5px;"><strong>Physiological Conditions:</strong> ${existing.physiologicalConditions || ""}</td></tr>
                    <tr><td style="border: 1px solid #000; padding: 5px;"><strong>BP:</strong> ${existing.bp || ""}</td><td style="border: 1px solid #000; padding: 5px;"><strong>RS:</strong> ${existing.rs || ""}</td></tr>
                  </table>
                </div>
                <div class="section" style="margin-top: 10px;">
                  <p><strong>Remarks of the Surgeon on Patient Assessment Findings:</strong></p>
                  <div style="border: 1px solid #000; min-height: 80px; padding: 10px;">${existing.surgeonRemarks || ""}</div>
                </div>
                <div class="section" style="margin-top: 20px;">
                  <table style="width: 100%;">
                    <tr><td><strong>Name of Surgeon:</strong> ${existing.nameOfSurgeon || ""}</td><td style="text-align: right;"><strong>Signature:</strong> ${existing.surgeonSignature || ""}</td></tr>
                    <tr><td><strong>Date:</strong> ${existing.assessmentDate || ""}</td><td style="text-align: right;"><strong>Time:</strong> ${existing.assessmentTime || ""}</td></tr>
                  </table>
                </div>
              `;
              printForm("Pre Operative Assessment", content);
            }}
          >
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Assessment"}
        </Button>
      </div>
    </form>
  );
}

function ChecklistForm({ existing, onSubmit, isLoading, caseData }: { existing: any; onSubmit: (d: any) => void; isLoading: boolean; caseData?: any }) {
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

      <div className="flex justify-end gap-2">
        {existing && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const checklistHtml = checklistItems.map((item, idx) => 
                `<div class="checklist-item"><span class="${existing[item.key] ? 'checked' : 'unchecked'}">[${existing[item.key] ? 'Yes' : 'No'}]</span> [${idx + 1}] ${item.label}</div>`
              ).join('');
              const patientName = caseData?.patientName || "N/A";
              const uhidNo = caseData?.uhid || "N/A";
              const age = caseData?.patientAge || "N/A";
              const room = caseData?.otRoom || "N/A";
              const doctor = caseData?.surgeonName || "N/A";
              const printWindow = window.open('', '_blank');
              if (printWindow) {
                printWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <title>Pre-Operative Checklist - Gravity Hospital</title>
                    <style>
                      * { margin: 0; padding: 0; box-sizing: border-box; }
                      body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
                      .main-title { color: #2563eb; font-size: 18px; font-style: italic; border-bottom: 3px solid #2563eb; padding-bottom: 8px; margin-bottom: 15px; }
                      .header-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
                      .hospital-info { flex: 1; }
                      .hospital-name { font-weight: bold; font-size: 14px; margin-bottom: 5px; }
                      .hospital-address { font-size: 11px; color: #333; line-height: 1.4; }
                      .patient-info { text-align: right; font-size: 11px; }
                      .patient-info p { margin: 3px 0; }
                      .section { margin: 15px 0; padding: 10px; border: 1px solid #e2e8f0; border-radius: 4px; }
                      .field { margin: 6px 0; display: flex; }
                      .field-label { font-weight: bold; width: 180px; }
                      .field-value { flex: 1; }
                      .checklist-item { padding: 4px 0; display: flex; align-items: center; gap: 8px; }
                      .checked { color: #16a34a; font-weight: bold; }
                      .unchecked { color: #dc2626; }
                      h2 { font-size: 14px; margin: 15px 0 10px 0; color: #1e3a5f; }
                      .footer { margin-top: 30px; font-size: 10px; color: #666; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; }
                      @media print { body { padding: 10px; } }
                    </style>
                  </head>
                  <body>
                    <div class="main-title">Gravity Hospital - Pre Operative Checklist</div>
                    <div class="header-section">
                      <div class="hospital-info">
                        <div class="hospital-name">GRAVITY HOSPITAL</div>
                        <div class="hospital-address">
                          Gat No. 167, Sahyog Nagar, Triveni Nagar, Nigdi<br>
                          Pimpri-Chinchwad, Maharashtra 411062<br>
                          Tel: +91 20 1234 5678 | Emergency: +91 20 1234 5680<br>
                          Email: info@gravityhospital.in
                        </div>
                      </div>
                      <div class="patient-info">
                        <p><strong>Patient Name:</strong> ${patientName}</p>
                        <p><strong>UHID No:</strong> ${uhidNo}</p>
                        <p><strong>Age:</strong> ${age}</p>
                        <p><strong>Room:</strong> ${room}</p>
                        <p><strong>Doctor:</strong> ${doctor}</p>
                      </div>
                    </div>
                    <div class="section">
                      <div class="field"><span class="field-label">Name of Staff:</span><span class="field-value">${existing.completedBy || "N/A"}</span></div>
                      <div class="field"><span class="field-label">Completed At:</span><span class="field-value">${existing.completedAt ? format(new Date(existing.completedAt), "dd/MM/yyyy HH:mm") : "N/A"}</span></div>
                    </div>
                    <h2>Pre-Operative Checklist Items</h2>
                    <div class="section">${checklistHtml}</div>
                    <div class="section">
                      <div class="field"><span class="field-label">Received by OT Staff:</span><span class="field-value">${existing.receivedByOTStaff || "N/A"}</span></div>
                      <div class="field"><span class="field-label">Remarks:</span><span class="field-value">${existing.remarks || "N/A"}</span></div>
                    </div>
                    <div class="footer">Generated on ${format(new Date(), "dd/MM/yyyy HH:mm")} | Gravity AI Manager</div>
                  </body>
                  </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => printWindow.print(), 250);
              }
            }}
          >
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Complete Checklist"}
        </Button>
      </div>
    </form>
  );
}

function PAEForm({ existing, onSubmit, isLoading, caseData }: { existing: any; onSubmit: (d: any) => void; isLoading: boolean; caseData?: any }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      evaluatedBy: formData.get("evaluatedBy"),
      evaluatedAt: new Date().toISOString(),
      historyCough: formData.get("historyCough"),
      historyFever: formData.get("historyFever"),
      historyUri: formData.get("historyUri"),
      historyBrAsthma: formData.get("historyBrAsthma"),
      historyTuberculosis: formData.get("historyTuberculosis"),
      historyChestPain: formData.get("historyChestPain"),
      historyPalpitations: formData.get("historyPalpitations"),
      historySyncope: formData.get("historySyncope"),
      historyExternalDysponea: formData.get("historyExternalDysponea"),
      historyIhdOldAmi: formData.get("historyIhdOldAmi"),
      historyHypertension: formData.get("historyHypertension"),
      historySmoking: formData.get("historySmoking"),
      historyAlcohol: formData.get("historyAlcohol"),
      historyTobacco: formData.get("historyTobacco"),
      historyJaundice: formData.get("historyJaundice"),
      historyBleedingTendencies: formData.get("historyBleedingTendencies"),
      historyDrugAllergy: formData.get("historyDrugAllergy"),
      historyPreviousSurgery: formData.get("historyPreviousSurgery"),
      historyAnyOther: formData.get("historyAnyOther"),
      geBuilt: formData.get("geBuilt"),
      geFebrile: formData.get("geFebrile"),
      gePr: formData.get("gePr"),
      geBp: formData.get("geBp"),
      geRr: formData.get("geRr"),
      gePallor: formData.get("gePallor"),
      geJvp: formData.get("geJvp"),
      geEdema: formData.get("geEdema"),
      geOralCavityJawOpening: formData.get("geOralCavityJawOpening"),
      geTeeth: formData.get("geTeeth"),
      geNeck: formData.get("geNeck"),
      geExtension: formData.get("geExtension"),
      geCvs: formData.get("geCvs"),
      geRs: formData.get("geRs"),
      geAbd: formData.get("geAbd"),
      invHb: formData.get("invHb"),
      invBslF: formData.get("invBslF"),
      invBslPp: formData.get("invBslPp"),
      invBloodUrea: formData.get("invBloodUrea"),
      invSrCreatinine: formData.get("invSrCreatinine"),
      invEcg: formData.get("invEcg"),
      inv2dEcho: formData.get("inv2dEcho"),
      invCxr: formData.get("invCxr"),
      anaesthetistName: formData.get("anaesthetistName"),
      anaesthetistSignature: formData.get("anaesthetistSignature"),
      paeDate: formData.get("paeDate"),
      paeTime: formData.get("paeTime"),
      fitForSurgery: formData.get("fitForSurgery") === "on",
    });
  };

  const printPAEForm = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Read editable form values - using PAE-specific input names
    const getInputValue = (name: string) => {
      const input = document.querySelector(`[name="${name}"]`) as HTMLInputElement;
      return input?.value || "";
    };
    const printPatientName = getInputValue('paePatientName') || caseData?.patientName || "N/A";
    const printUhid = getInputValue('paeUhid') || caseData?.uhid || "N/A";
    const printAge = getInputValue('paeAge') || caseData?.patientAge || caseData?.age || "N/A";
    const printGender = getInputValue('paeGender') || caseData?.patientGender || caseData?.gender || "N/A";
    const printRoom = getInputValue('paeRoom') || caseData?.room || "N/A";
    const printDoctor = getInputValue('paeDoctor') || caseData?.surgeonName || "N/A";
    const printIpdNo = getInputValue('paeIpdNo') || caseData?.ipdNumber || "N/A";
    const printDoa = getInputValue('paeDoa') || caseData?.admissionDate || "N/A";
    const printBed = getInputValue('paeBed') || caseData?.bedNumber || "N/A";

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pre Operative Anaesthetic Evaluation</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11px; padding: 15px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
          .hospital-info { text-align: left; }
          .hospital-name { font-size: 16px; font-weight: bold; display: flex; align-items: center; gap: 8px; }
          .hospital-icon { width: 30px; height: 30px; }
          .hospital-address { font-size: 10px; margin-top: 5px; }
          .patient-info { text-align: right; font-size: 10px; }
          .patient-info div { margin: 2px 0; }
          .form-title { text-align: center; font-size: 14px; font-weight: bold; text-decoration: underline; margin: 15px 0; }
          .section-title { font-weight: bold; text-decoration: underline; margin: 12px 0 8px 0; }
          .history-grid { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid #000; }
          .history-item { display: flex; justify-content: space-between; padding: 4px 8px; border-bottom: 1px solid #ccc; border-right: 1px solid #ccc; }
          .history-item:nth-child(3n) { border-right: none; }
          .ge-grid { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #000; }
          .ge-item { display: flex; padding: 4px 8px; border-bottom: 1px solid #ccc; border-right: 1px solid #ccc; }
          .ge-item:nth-child(2n) { border-right: none; }
          .ge-label { font-weight: bold; min-width: 120px; }
          .ge-value { flex: 1; border-bottom: 1px dotted #000; min-height: 16px; }
          .ge2-grid { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid #000; margin-top: 10px; }
          .ge2-item { display: flex; padding: 4px 8px; border-right: 1px solid #ccc; }
          .ge2-item:last-child { border-right: none; }
          .inv-row { display: grid; grid-template-columns: repeat(5, 1fr); border: 1px solid #000; border-bottom: none; }
          .inv-item { display: flex; padding: 4px 8px; border-right: 1px solid #ccc; }
          .inv-item:last-child { border-right: none; }
          .inv-full { border: 1px solid #000; border-top: none; padding: 4px 8px; display: flex; }
          .footer-row { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 10px; }
          .footer-item { display: flex; gap: 10px; }
          .footer-label { font-weight: bold; }
          .footer-value { border-bottom: 1px solid #000; min-width: 150px; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="hospital-info">
            <div class="hospital-name">
              <svg class="hospital-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
              GRAVITY HOSPITAL
            </div>
            <div class="hospital-address">
              Gat No. 167, Sahyog Nagar, Triveni Nagar, Nigdi<br/>
              Pimpri-Chinchwad, Maharashtra 411062<br/>
              Tel: +91 20 1234 5678 | Emergency: +91 20 1234 5680<br/>
              Email: info@gravityhospital.in
            </div>
          </div>
          <div class="patient-info">
            <div><strong>Patient Name:</strong> ${printPatientName}</div>
            <div><strong>UHID No:</strong> ${printUhid}</div>
            <div><strong>Age:</strong> ${printAge}/${printGender}</div>
            <div><strong>Room:</strong> ${printRoom}</div>
            <div><strong>Doctor:</strong> ${printDoctor}</div>
            <div><strong>IPD No:</strong> ${printIpdNo}</div>
            <div><strong>DOA:</strong> ${printDoa}</div>
            <div><strong>Bed No:</strong> ${printBed}</div>
          </div>
        </div>

        <div class="form-title">PRE OPERATIVE ANAESTHETIC EVALUATION</div>

        <div class="section-title">HISTORY:</div>
        <div class="history-grid">
          <div class="history-item"><span>Cough:</span><span>${existing?.historyCough || "___"}</span></div>
          <div class="history-item"><span>Palpitations:</span><span>${existing?.historyPalpitations || "___"}</span></div>
          <div class="history-item"><span>Alcohol:</span><span>${existing?.historyAlcohol || "___"}</span></div>
          <div class="history-item"><span>Fever:</span><span>${existing?.historyFever || "___"}</span></div>
          <div class="history-item"><span>Syncope:</span><span>${existing?.historySyncope || "___"}</span></div>
          <div class="history-item"><span>Tobacco:</span><span>${existing?.historyTobacco || "___"}</span></div>
          <div class="history-item"><span>URI:</span><span>${existing?.historyUri || "___"}</span></div>
          <div class="history-item"><span>External Dysponea:</span><span>${existing?.historyExternalDysponea || "___"}</span></div>
          <div class="history-item"><span>Jaundice:</span><span>${existing?.historyJaundice || "___"}</span></div>
          <div class="history-item"><span>Br.Asthma:</span><span>${existing?.historyBrAsthma || "___"}</span></div>
          <div class="history-item"><span>IHD/Old AMI:</span><span>${existing?.historyIhdOldAmi || "___"}</span></div>
          <div class="history-item"><span>Bleeding Tendencies:</span><span>${existing?.historyBleedingTendencies || "___"}</span></div>
          <div class="history-item"><span>Tuberculosis:</span><span>${existing?.historyTuberculosis || "___"}</span></div>
          <div class="history-item"><span>Hypertension:</span><span>${existing?.historyHypertension || "___"}</span></div>
          <div class="history-item"><span>Drug Allergy:</span><span>${existing?.historyDrugAllergy || "___"}</span></div>
          <div class="history-item"><span>Chest Pain:</span><span>${existing?.historyChestPain || "___"}</span></div>
          <div class="history-item"><span>Smoking:</span><span>${existing?.historySmoking || "___"}</span></div>
          <div class="history-item"><span>Previous Surgery:</span><span>${existing?.historyPreviousSurgery || "___"}</span></div>
          <div class="history-item" style="grid-column: span 3;"><span>Any Other History:</span><span>${existing?.historyAnyOther || "___"}</span></div>
        </div>

        <div class="section-title">GENERAL EXAMINATION:</div>
        <div class="ge-grid">
          <div class="ge-item"><span class="ge-label">Built:</span><span class="ge-value">${existing?.geBuilt || ""}</span></div>
          <div class="ge-item"><span class="ge-label">JVP:</span><span class="ge-value">${existing?.geJvp || ""}</span></div>
          <div class="ge-item"><span class="ge-label">Febrile:</span><span class="ge-value">${existing?.geFebrile || ""}</span></div>
          <div class="ge-item"><span class="ge-label">Edema:</span><span class="ge-value">${existing?.geEdema || ""}</span></div>
          <div class="ge-item"><span class="ge-label">P.R.:</span><span class="ge-value">${existing?.gePr || ""}</span></div>
          <div class="ge-item"><span class="ge-label">Oral Cavity/Jaw Opening:</span><span class="ge-value">${existing?.geOralCavityJawOpening || ""}</span></div>
          <div class="ge-item"><span class="ge-label">B.P.:</span><span class="ge-value">${existing?.geBp || ""}</span></div>
          <div class="ge-item"><span class="ge-label">Teeth:</span><span class="ge-value">${existing?.geTeeth || ""}</span></div>
          <div class="ge-item"><span class="ge-label">R.R.:</span><span class="ge-value">${existing?.geRr || ""}</span></div>
          <div class="ge-item"><span class="ge-label">Neck:</span><span class="ge-value">${existing?.geNeck || ""}</span></div>
          <div class="ge-item"><span class="ge-label">Pallor:</span><span class="ge-value">${existing?.gePallor || ""}</span></div>
          <div class="ge-item"><span class="ge-label">Extension:</span><span class="ge-value">${existing?.geExtension || ""}</span></div>
        </div>

        <div class="section-title">GENERAL EXAMINATION:</div>
        <div class="ge2-grid">
          <div class="ge2-item"><span class="ge-label">CVS:</span><span class="ge-value">${existing?.geCvs || ""}</span></div>
          <div class="ge2-item"><span class="ge-label">RS:</span><span class="ge-value">${existing?.geRs || ""}</span></div>
          <div class="ge2-item"><span class="ge-label">Abd:</span><span class="ge-value">${existing?.geAbd || ""}</span></div>
        </div>

        <div class="section-title">INVESTIGATIONS:</div>
        <div class="inv-row">
          <div class="inv-item"><span class="ge-label">Hb:</span><span class="ge-value">${existing?.invHb || ""}</span></div>
          <div class="inv-item"><span class="ge-label">BSL F:</span><span class="ge-value">${existing?.invBslF || ""}</span></div>
          <div class="inv-item"><span class="ge-label">BSL PP:</span><span class="ge-value">${existing?.invBslPp || ""}</span></div>
          <div class="inv-item"><span class="ge-label">Blood Urea:</span><span class="ge-value">${existing?.invBloodUrea || ""}</span></div>
          <div class="inv-item"><span class="ge-label">Sr.Creatinine:</span><span class="ge-value">${existing?.invSrCreatinine || ""}</span></div>
        </div>
        <div class="inv-full"><span class="ge-label">ECG:</span><span class="ge-value" style="flex:1;">${existing?.invEcg || ""}</span></div>
        <div class="inv-full"><span class="ge-label">2d Echo:</span><span class="ge-value" style="flex:1;">${existing?.inv2dEcho || ""}</span></div>
        <div class="inv-full"><span class="ge-label">CXR:</span><span class="ge-value" style="flex:1;">${existing?.invCxr || ""}</span></div>

        <div class="footer-row">
          <div class="footer-item"><span class="footer-label">Name of the Anaesthetist:</span><span class="footer-value">${existing?.anaesthetistName || ""}</span></div>
          <div class="footer-item"><span class="footer-label">Signature:</span><span class="footer-value">${existing?.anaesthetistSignature || ""}</span></div>
        </div>
        <div class="footer-row">
          <div class="footer-item"><span class="footer-label">Date:</span><span class="footer-value">${existing?.paeDate || ""}</span></div>
          <div class="footer-item"><span class="footer-label">Time:</span><span class="footer-value">${existing?.paeTime || ""}</span></div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border rounded-lg p-4 bg-muted/30 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 font-bold text-lg">
              <Heart className="h-6 w-6 text-primary" />
              GRAVITY HOSPITAL
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Gat No. 167, Sahyog Nagar, Triveni Nagar, Nigdi<br/>
              Pimpri-Chinchwad, Maharashtra 411062<br/>
              Tel: +91 20 1234 5678 | Emergency: +91 20 1234 5680<br/>
              Email: info@gravityhospital.in
            </div>
          </div>
          <div className="text-right text-sm space-y-1">
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 items-center text-xs">
              <span className="text-muted-foreground">Patient Name:</span>
              <Input name="paePatientName" defaultValue={caseData?.patientName || ""} placeholder="Patient Name" className="text-xs" />
              <span className="text-muted-foreground">UHID No:</span>
              <Input name="paeUhid" defaultValue={caseData?.uhid || ""} placeholder="UHID" className="text-xs" />
              <span className="text-muted-foreground">Age/Gender:</span>
              <div className="flex gap-1">
                <Input name="paeAge" defaultValue={caseData?.patientAge || caseData?.age || ""} placeholder="Age" className="text-xs w-14" />
                <Input name="paeGender" defaultValue={caseData?.patientGender || caseData?.gender || ""} placeholder="M/F" className="text-xs w-12" />
              </div>
              <span className="text-muted-foreground">Room/Bed:</span>
              <div className="flex gap-1">
                <Input name="paeRoom" defaultValue={caseData?.room || ""} placeholder="Room" className="text-xs" />
                <Input name="paeBed" defaultValue={caseData?.bedNumber || ""} placeholder="Bed" className="text-xs w-12" />
              </div>
              <span className="text-muted-foreground">Doctor:</span>
              <Input name="paeDoctor" defaultValue={caseData?.surgeonName || ""} placeholder="Doctor" className="text-xs" />
              <span className="text-muted-foreground">IPD No:</span>
              <Input name="paeIpdNo" defaultValue={caseData?.ipdNumber || ""} placeholder="IPD No" className="text-xs" />
              <span className="text-muted-foreground">DOA:</span>
              <Input name="paeDoa" type="date" defaultValue={caseData?.admissionDate ? format(new Date(caseData.admissionDate), "yyyy-MM-dd") : ""} className="text-xs" />
            </div>
          </div>
        </div>
      </div>

      <div className="text-center font-bold text-lg underline mb-4">PRE OPERATIVE ANAESTHETIC EVALUATION</div>

      <div className="border rounded-lg p-4">
        <h3 className="font-bold underline mb-3">HISTORY:</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-1">
              <Label className="text-sm">Cough:</Label>
              <Select name="historyCough" defaultValue={existing?.historyCough || ""}>
                <SelectTrigger className="w-24 h-8"><SelectValue placeholder="___" /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center border-b pb-1">
              <Label className="text-sm">Fever:</Label>
              <Select name="historyFever" defaultValue={existing?.historyFever || ""}>
                <SelectTrigger className="w-24 h-8"><SelectValue placeholder="___" /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center border-b pb-1">
              <Label className="text-sm">URI:</Label>
              <Select name="historyUri" defaultValue={existing?.historyUri || ""}>
                <SelectTrigger className="w-24 h-8"><SelectValue placeholder="___" /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center border-b pb-1">
              <Label className="text-sm">Br.Asthma:</Label>
              <Select name="historyBrAsthma" defaultValue={existing?.historyBrAsthma || ""}>
                <SelectTrigger className="w-24 h-8"><SelectValue placeholder="___" /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center border-b pb-1">
              <Label className="text-sm">Tuberculosis:</Label>
              <Select name="historyTuberculosis" defaultValue={existing?.historyTuberculosis || ""}>
                <SelectTrigger className="w-24 h-8"><SelectValue placeholder="___" /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center border-b pb-1">
              <Label className="text-sm">Chest Pain:</Label>
              <Select name="historyChestPain" defaultValue={existing?.historyChestPain || ""}>
                <SelectTrigger className="w-24 h-8"><SelectValue placeholder="___" /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-1">
              <Label className="text-sm">Palpitations:</Label>
              <Select name="historyPalpitations" defaultValue={existing?.historyPalpitations || ""}>
                <SelectTrigger className="w-24 h-8"><SelectValue placeholder="___" /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center border-b pb-1">
              <Label className="text-sm">Syncope:</Label>
              <Select name="historySyncope" defaultValue={existing?.historySyncope || ""}>
                <SelectTrigger className="w-24 h-8"><SelectValue placeholder="___" /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center border-b pb-1">
              <Label className="text-sm">External Dysponea:</Label>
              <Select name="historyExternalDysponea" defaultValue={existing?.historyExternalDysponea || ""}>
                <SelectTrigger className="w-24 h-8"><SelectValue placeholder="___" /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center border-b pb-1">
              <Label className="text-sm">IHD/Old AMI:</Label>
              <Select name="historyIhdOldAmi" defaultValue={existing?.historyIhdOldAmi || ""}>
                <SelectTrigger className="w-24 h-8"><SelectValue placeholder="___" /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center border-b pb-1">
              <Label className="text-sm">Hypertension:</Label>
              <Select name="historyHypertension" defaultValue={existing?.historyHypertension || ""}>
                <SelectTrigger className="w-24 h-8"><SelectValue placeholder="___" /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center border-b pb-1">
              <Label className="text-sm">Smoking:</Label>
              <Select name="historySmoking" defaultValue={existing?.historySmoking || ""}>
                <SelectTrigger className="w-24 h-8"><SelectValue placeholder="___" /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-1">
              <Label className="text-sm">Alcohol:</Label>
              <Select name="historyAlcohol" defaultValue={existing?.historyAlcohol || ""}>
                <SelectTrigger className="w-24 h-8"><SelectValue placeholder="___" /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center border-b pb-1">
              <Label className="text-sm">Tobacco:</Label>
              <Select name="historyTobacco" defaultValue={existing?.historyTobacco || ""}>
                <SelectTrigger className="w-24 h-8"><SelectValue placeholder="___" /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center border-b pb-1">
              <Label className="text-sm">Jaundice:</Label>
              <Select name="historyJaundice" defaultValue={existing?.historyJaundice || ""}>
                <SelectTrigger className="w-24 h-8"><SelectValue placeholder="___" /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center border-b pb-1">
              <Label className="text-sm">Bleeding Tendencies:</Label>
              <Select name="historyBleedingTendencies" defaultValue={existing?.historyBleedingTendencies || ""}>
                <SelectTrigger className="w-24 h-8"><SelectValue placeholder="___" /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center border-b pb-1">
              <Label className="text-sm">Drug Allergy:</Label>
              <Select name="historyDrugAllergy" defaultValue={existing?.historyDrugAllergy || ""}>
                <SelectTrigger className="w-24 h-8"><SelectValue placeholder="___" /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center border-b pb-1">
              <Label className="text-sm">Previous Surgery:</Label>
              <Select name="historyPreviousSurgery" defaultValue={existing?.historyPreviousSurgery || ""}>
                <SelectTrigger className="w-24 h-8"><SelectValue placeholder="___" /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Any Other History:</Label>
            <Input name="historyAnyOther" defaultValue={existing?.historyAnyOther || ""} className="flex-1 h-8" />
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="font-bold underline mb-3">GENERAL EXAMINATION:</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm w-24">Built:</Label>
              <Input name="geBuilt" defaultValue={existing?.geBuilt || ""} className="flex-1 h-8" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm w-24">Febrile:</Label>
              <Input name="geFebrile" defaultValue={existing?.geFebrile || ""} className="flex-1 h-8" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm w-24">P.R.:</Label>
              <Input name="gePr" defaultValue={existing?.gePr || ""} className="flex-1 h-8" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm w-24">B.P.:</Label>
              <Input name="geBp" defaultValue={existing?.geBp || ""} className="flex-1 h-8" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm w-24">R.R.:</Label>
              <Input name="geRr" defaultValue={existing?.geRr || ""} className="flex-1 h-8" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm w-24">Pallor:</Label>
              <Input name="gePallor" defaultValue={existing?.gePallor || ""} className="flex-1 h-8" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm w-40">JVP:</Label>
              <Input name="geJvp" defaultValue={existing?.geJvp || ""} className="flex-1 h-8" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm w-40">Edema:</Label>
              <Input name="geEdema" defaultValue={existing?.geEdema || ""} className="flex-1 h-8" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm w-40">Oral Cavity/Jaw Opening:</Label>
              <Input name="geOralCavityJawOpening" defaultValue={existing?.geOralCavityJawOpening || ""} className="flex-1 h-8" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm w-40">Teeth:</Label>
              <Input name="geTeeth" defaultValue={existing?.geTeeth || ""} className="flex-1 h-8" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm w-40">Neck:</Label>
              <Input name="geNeck" defaultValue={existing?.geNeck || ""} className="flex-1 h-8" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm w-40">Extension:</Label>
              <Input name="geExtension" defaultValue={existing?.geExtension || ""} className="flex-1 h-8" />
            </div>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="font-bold underline mb-3">GENERAL EXAMINATION:</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm w-12">CVS:</Label>
            <Input name="geCvs" defaultValue={existing?.geCvs || ""} className="flex-1 h-8" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm w-12">RS:</Label>
            <Input name="geRs" defaultValue={existing?.geRs || ""} className="flex-1 h-8" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm w-12">Abd:</Label>
            <Input name="geAbd" defaultValue={existing?.geAbd || ""} className="flex-1 h-8" />
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="font-bold underline mb-3">INVESTIGATIONS:</h3>
        <div className="grid grid-cols-5 gap-3 mb-3">
          <div className="flex items-center gap-1">
            <Label className="text-sm">Hb:</Label>
            <Input name="invHb" defaultValue={existing?.invHb || ""} className="flex-1 h-8" />
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-sm">BSL F:</Label>
            <Input name="invBslF" defaultValue={existing?.invBslF || ""} className="flex-1 h-8" />
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-sm">BSL PP:</Label>
            <Input name="invBslPp" defaultValue={existing?.invBslPp || ""} className="flex-1 h-8" />
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-sm">Blood Urea:</Label>
            <Input name="invBloodUrea" defaultValue={existing?.invBloodUrea || ""} className="flex-1 h-8" />
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-sm">Sr.Creatinine:</Label>
            <Input name="invSrCreatinine" defaultValue={existing?.invSrCreatinine || ""} className="flex-1 h-8" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm w-20">ECG:</Label>
            <Input name="invEcg" defaultValue={existing?.invEcg || ""} className="flex-1 h-8" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm w-20">2d Echo:</Label>
            <Input name="inv2dEcho" defaultValue={existing?.inv2dEcho || ""} className="flex-1 h-8" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm w-20">CXR:</Label>
            <Input name="invCxr" defaultValue={existing?.invCxr || ""} className="flex-1 h-8" />
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Name of the Anaesthetist:</Label>
            <Input name="anaesthetistName" defaultValue={existing?.anaesthetistName || ""} className="flex-1 h-8" required />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Signature:</Label>
            <Input name="anaesthetistSignature" defaultValue={existing?.anaesthetistSignature || ""} className="flex-1 h-8" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Date:</Label>
            <Input name="paeDate" type="date" defaultValue={existing?.paeDate || format(new Date(), "yyyy-MM-dd")} className="flex-1 h-8" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Time:</Label>
            <Input name="paeTime" type="time" defaultValue={existing?.paeTime || format(new Date(), "HH:mm")} className="flex-1 h-8" />
          </div>
        </div>
      </div>

      <input type="hidden" name="evaluatedBy" value={existing?.anaesthetistName || ""} />

      <div className="flex items-center justify-between border-t pt-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="fitForSurgery" defaultChecked={existing?.fitForSurgery !== false} className="h-4 w-4" />
          <span className="font-medium">Patient is fit for surgery under proposed anaesthesia</span>
        </label>
        <div className="flex gap-2">
          {existing && (
            <Button type="button" variant="outline" onClick={printPAEForm}>
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Evaluation"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function SafetyChecklistForm({ existing, onSubmit, isLoading, caseData }: { existing: any; onSubmit: (d: any) => void; isLoading: boolean; caseData?: any }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      patientConfirmed: formData.get("patientConfirmed"),
      siteMarked: formData.get("siteMarked"),
      anaesthesiaSafetyCheck: formData.get("anaesthesiaSafetyCheck"),
      pulseOxymeter: formData.get("pulseOxymeter"),
      knownAllergy: formData.get("knownAllergy"),
      difficultAirwayRisk: formData.get("difficultAirwayRisk"),
      bloodLossRisk: formData.get("bloodLossRisk"),
      teamIntroduced: formData.get("teamIntroduced"),
      verballyConfirmed: formData.get("verballyConfirmed"),
      surgeonReviews: formData.get("surgeonReviews"),
      anaesthesiaTeamReviews: formData.get("anaesthesiaTeamReviews"),
      nursingTeamReviews: formData.get("nursingTeamReviews"),
      antibioticProphylaxis: formData.get("antibioticProphylaxis"),
      essentialImaging: formData.get("essentialImaging"),
      procedureRecorded: formData.get("procedureRecorded"),
      instrumentCountCorrect: formData.get("instrumentCountCorrect"),
      specimenLabelled: formData.get("specimenLabelled"),
      equipmentProblems: formData.get("equipmentProblems"),
      recoveryConcernsReviewed: formData.get("recoveryConcernsReviewed"),
      surgeonName: formData.get("surgeonName"),
      surgeonSignature: formData.get("surgeonSignature"),
      anaesthetistName: formData.get("anaesthetistName"),
      anaesthetistSignature: formData.get("anaesthetistSignature"),
      otNurseName: formData.get("otNurseName"),
      otNurseSignature: formData.get("otNurseSignature"),
    });
  };

  const YesNoNaSelect = ({ name, defaultValue, label }: { name: string; defaultValue?: string; label: string }) => (
    <div className="flex items-center justify-between py-2 border-b">
      <span className="text-sm flex-1">{label}</span>
      <Select name={name} defaultValue={defaultValue || ""}>
        <SelectTrigger className="w-32"><SelectValue placeholder="Select" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="Yes">Yes</SelectItem>
          <SelectItem value="No">No</SelectItem>
          <SelectItem value="N.A.">N.A.</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Surgical Safety Checklist</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; font-size: 11px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
          .hospital-info { flex: 1; }
          .hospital-name { font-size: 16px; font-weight: bold; }
          .patient-info { flex: 1; text-align: right; font-size: 10px; }
          .patient-info div { margin: 2px 0; }
          .title { text-align: center; font-size: 14px; font-weight: bold; text-decoration: underline; margin: 15px 0; }
          .section-title { font-weight: bold; text-decoration: underline; margin: 12px 0 6px 0; }
          .checklist-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #ccc; }
          .checklist-label { flex: 1; }
          .checklist-value { width: 100px; text-align: center; font-weight: bold; }
          .signature-section { margin-top: 30px; }
          .signature-row { display: flex; justify-content: space-between; margin: 15px 0; }
          .signature-block { display: flex; gap: 20px; }
          .signature-line { border-bottom: 1px solid #000; min-width: 150px; }
          @media print { body { margin: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="hospital-info">
            <div class="hospital-name">GRAVITY HOSPITAL</div>
            <div>Gat No. 167, Sahyog Nagar, Triveni Nagar, Nigdi</div>
            <div>Pimpri-Chinchwad, Maharashtra 411062</div>
            <div>Tel: +91 20 1234 5678 | Emergency: +91 20 1234 5680</div>
            <div>Email: info@gravityhospital.in</div>
          </div>
          <div class="patient-info">
            <div><strong>Patient Name:</strong> ${caseData?.patientName || ''}</div>
            <div><strong>UHID No:</strong> ${caseData?.uhid || ''}</div>
            <div><strong>Age:</strong> ${caseData?.patientAge || ''} | <strong>IPD No:</strong> ${caseData?.ipdNo || ''}</div>
            <div><strong>Room:</strong> ${caseData?.room || ''} | <strong>DOA:</strong> ${caseData?.admissionDate ? new Date(caseData.admissionDate).toLocaleDateString() : ''}</div>
            <div><strong>Doctor:</strong> ${caseData?.primarySurgeonName || ''} | <strong>Bed No:</strong> ${caseData?.bedNo || ''}</div>
          </div>
        </div>
        
        <div class="title">SURGICAL SAFETY CHECKLIST</div>
        
        <div class="section-title">BEFORE INDUCTION OF ANAESTHESIA:</div>
        <div class="checklist-row"><span class="checklist-label">PATIENT HAS CONFIRMED: (Identity, Site, Procedure, Consent)</span><span class="checklist-value">${existing?.patientConfirmed || ''}</span></div>
        <div class="checklist-row"><span class="checklist-label">SITE MARKED / NOT APPLICABLE:</span><span class="checklist-value">${existing?.siteMarked || ''}</span></div>
        <div class="checklist-row"><span class="checklist-label">ANAESTHESIA SAFETY CHECK COMPLETED:</span><span class="checklist-value">${existing?.anaesthesiaSafetyCheck || ''}</span></div>
        <div class="checklist-row"><span class="checklist-label">PULSE OXYMETER ON PATIENT & FUNCTIONING:</span><span class="checklist-value">${existing?.pulseOxymeter || ''}</span></div>
        <div class="checklist-row"><span class="checklist-label">DOES PATIENT HAVE A KNOWN ALLERGY:</span><span class="checklist-value">${existing?.knownAllergy || ''}</span></div>
        <div class="checklist-row"><span class="checklist-label">DIFFICULT AIRWAY / ASPIRATION RISK:</span><span class="checklist-value">${existing?.difficultAirwayRisk || ''}</span></div>
        <div class="checklist-row"><span class="checklist-label">RISK OF >500 ML BLOOD LOSS:</span><span class="checklist-value">${existing?.bloodLossRisk || ''}</span></div>
        
        <div class="section-title">BEFORE SKIN INCISION:</div>
        <div class="checklist-row"><span class="checklist-label">CONFIRMED ALL TEAM MEMBERS HAVE INTRODUCED THEMSELVES BY NAME & ROLE:</span><span class="checklist-value">${existing?.teamIntroduced || ''}</span></div>
        <div class="checklist-row"><span class="checklist-label">SURGEON, ANAESTHESIA PROFESSIONAL AND NURSE VERBALLY CONFIRMED? (Patient, Site, Procedure)</span><span class="checklist-value">${existing?.verballyConfirmed || ''}</span></div>
        
        <div class="section-title">ANTICIPATED CRITICAL EVENTS:</div>
        <div class="checklist-row"><span class="checklist-label">SURGEON REVIEWS: WHAT ARE THE CRITICAL OR EXPECTED STEPS, OPERATIVE DURATION, ANTICIPATED BLOOD LOSS?</span><span class="checklist-value">${existing?.surgeonReviews || ''}</span></div>
        <div class="checklist-row"><span class="checklist-label">ANAESTHESIA TEAM REVIEWS: ARE THERE ANY PATIENT-SPECIFIC CONCERNS?</span><span class="checklist-value">${existing?.anaesthesiaTeamReviews || ''}</span></div>
        <div class="checklist-row"><span class="checklist-label">NURSING TEAM REVIEWS: HAS STERILITY (INCLUDING INDICATOR RESULTS) BEEN CONFIRMED? ARE THERE EQUIPMENT ISSUES OR ANY CONCERNS?</span><span class="checklist-value">${existing?.nursingTeamReviews || ''}</span></div>
        <div class="checklist-row"><span class="checklist-label">HAS ANTIBIOTIC PROPHYLAXIS BEEN GIVEN WITHIN THE LAST 60 MINUTES?</span><span class="checklist-value">${existing?.antibioticProphylaxis || ''}</span></div>
        <div class="checklist-row"><span class="checklist-label">IS ESSENTIAL IMAGING DISPLAYED?</span><span class="checklist-value">${existing?.essentialImaging || ''}</span></div>
        
        <div class="section-title">BEFORE PATIENT LEAVES OPERATING ROOM:</div>
        <div style="margin-left: 10px; font-weight: bold;">NURSE VERBALLY CONFIRMED WITH THE TEAM:</div>
        <div class="checklist-row" style="margin-left: 20px;"><span class="checklist-label">THE NAME OF THE PROCEDURE RECORDED</span><span class="checklist-value">${existing?.procedureRecorded || ''}</span></div>
        <div class="checklist-row" style="margin-left: 20px;"><span class="checklist-label">THAT INSTRUMENT, SPONGE AND NEEDLE COUNTS ARE CORRECT OR NOT APPLICABLE</span><span class="checklist-value">${existing?.instrumentCountCorrect || ''}</span></div>
        <div class="checklist-row" style="margin-left: 20px;"><span class="checklist-label">HOW THE SPECIMEN IS LABELLED (INCLUDING PATIENT NAME)</span><span class="checklist-value">${existing?.specimenLabelled || ''}</span></div>
        <div class="checklist-row" style="margin-left: 20px;"><span class="checklist-label">WHETHER THERE ARE ANY EQUIPMENT PROBLEMS TO BE ADDRESSED</span><span class="checklist-value">${existing?.equipmentProblems || ''}</span></div>
        <div class="checklist-row"><span class="checklist-label">SURGEON, ANAESTHESIA PROFESSIONAL AND NURSE REVIEW THE KEY CONCERNS FOR RECOVERY AND MANAGEMENT OF THIS PATIENT</span><span class="checklist-value">${existing?.recoveryConcernsReviewed || ''}</span></div>
        
        <div class="signature-section">
          <div class="signature-row">
            <div class="signature-block"><span>Name of Surgeon:</span><span class="signature-line">${existing?.surgeonName || ''}</span></div>
            <div class="signature-block"><span>Signature:</span><span class="signature-line">${existing?.surgeonSignature || ''}</span></div>
          </div>
          <div class="signature-row">
            <div class="signature-block"><span>Name of Anaesthetist:</span><span class="signature-line">${existing?.anaesthetistName || ''}</span></div>
            <div class="signature-block"><span>Signature:</span><span class="signature-line">${existing?.anaesthetistSignature || ''}</span></div>
          </div>
          <div class="signature-row">
            <div class="signature-block"><span>Name of OT Nurse:</span><span class="signature-line">${existing?.otNurseName || ''}</span></div>
            <div class="signature-block"><span>Signature:</span><span class="signature-line">${existing?.otNurseSignature || ''}</span></div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Hospital Header */}
      <div className="border-b-2 border-primary pb-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold">GRAVITY HOSPITAL</h2>
            <p className="text-sm text-muted-foreground">Gat No. 167, Sahyog Nagar, Triveni Nagar, Nigdi</p>
            <p className="text-sm text-muted-foreground">Pimpri-Chinchwad, Maharashtra 411062</p>
            <p className="text-sm text-muted-foreground">Tel: +91 20 1234 5678 | Emergency: +91 20 1234 5680</p>
            <p className="text-sm text-muted-foreground">Email: info@gravityhospital.in</p>
          </div>
          <div className="text-right text-sm">
            <div><span className="font-medium">Patient Name:</span> {caseData?.patientName || '-'}</div>
            <div><span className="font-medium">UHID No:</span> {caseData?.uhid || '-'}</div>
            <div><span className="font-medium">Age:</span> {caseData?.patientAge || '-'} | <span className="font-medium">IPD No:</span> {caseData?.ipdNo || '-'}</div>
            <div><span className="font-medium">Room:</span> {caseData?.room || '-'} | <span className="font-medium">DOA:</span> {caseData?.admissionDate ? new Date(caseData.admissionDate).toLocaleDateString() : '-'}</div>
            <div><span className="font-medium">Doctor:</span> {caseData?.primarySurgeonName || '-'} | <span className="font-medium">Bed No:</span> {caseData?.bedNo || '-'}</div>
          </div>
        </div>
      </div>

      <div className="text-center font-bold text-lg underline mb-4">SURGICAL SAFETY CHECKLIST</div>

      {/* BEFORE INDUCTION OF ANAESTHESIA */}
      <div className="border rounded-lg p-4">
        <h4 className="font-bold underline mb-3">BEFORE INDUCTION OF ANAESTHESIA:</h4>
        <YesNoNaSelect name="patientConfirmed" defaultValue={existing?.patientConfirmed} label="PATIENT HAS CONFIRMED: (Identity, Site, Procedure, Consent)" />
        <YesNoNaSelect name="siteMarked" defaultValue={existing?.siteMarked} label="SITE MARKED / NOT APPLICABLE:" />
        <YesNoNaSelect name="anaesthesiaSafetyCheck" defaultValue={existing?.anaesthesiaSafetyCheck} label="ANAESTHESIA SAFETY CHECK COMPLETED:" />
        <YesNoNaSelect name="pulseOxymeter" defaultValue={existing?.pulseOxymeter} label="PULSE OXYMETER ON PATIENT & FUNCTIONING:" />
        <YesNoNaSelect name="knownAllergy" defaultValue={existing?.knownAllergy} label="DOES PATIENT HAVE A KNOWN ALLERGY:" />
        
        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-sm flex-1">DIFFICULT AIRWAY / ASPIRATION RISK:</span>
          <Select name="difficultAirwayRisk" defaultValue={existing?.difficultAirwayRisk || ""}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="No">No</SelectItem>
              <SelectItem value="Yes and Equipment/Assistance Available">Yes and Equipment/Assistance Available</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center justify-between py-2">
          <span className="text-sm flex-1">RISK OF {'>'}500 ML BLOOD LOSS:</span>
          <Select name="bloodLossRisk" defaultValue={existing?.bloodLossRisk || ""}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="No">No</SelectItem>
              <SelectItem value="Yes and adequate IV access and Fluids planned">Yes and adequate IV access and Fluids planned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* BEFORE SKIN INCISION */}
      <div className="border rounded-lg p-4">
        <h4 className="font-bold underline mb-3">BEFORE SKIN INCISION:</h4>
        <YesNoNaSelect name="teamIntroduced" defaultValue={existing?.teamIntroduced} label="CONFIRMED ALL TEAM MEMBERS HAVE INTRODUCED THEMSELVES BY NAME & ROLE:" />
        <YesNoNaSelect name="verballyConfirmed" defaultValue={existing?.verballyConfirmed} label="SURGEON, ANAESTHESIA PROFESSIONAL AND NURSE VERBALLY CONFIRMED? (Patient, Site, Procedure)" />
      </div>

      {/* ANTICIPATED CRITICAL EVENTS */}
      <div className="border rounded-lg p-4">
        <h4 className="font-bold underline mb-3">ANTICIPATED CRITICAL EVENTS:</h4>
        <YesNoNaSelect name="surgeonReviews" defaultValue={existing?.surgeonReviews} label="SURGEON REVIEWS: WHAT ARE THE CRITICAL OR EXPECTED STEPS, OPERATIVE DURATION, ANTICIPATED BLOOD LOSS?" />
        <YesNoNaSelect name="anaesthesiaTeamReviews" defaultValue={existing?.anaesthesiaTeamReviews} label="ANAESTHESIA TEAM REVIEWS: ARE THERE ANY PATIENT-SPECIFIC CONCERNS?" />
        <YesNoNaSelect name="nursingTeamReviews" defaultValue={existing?.nursingTeamReviews} label="NURSING TEAM REVIEWS: HAS STERILITY (INCLUDING INDICATOR RESULTS) BEEN CONFIRMED? ARE THERE EQUIPMENT ISSUES OR ANY CONCERNS?" />
        <YesNoNaSelect name="antibioticProphylaxis" defaultValue={existing?.antibioticProphylaxis} label="HAS ANTIBIOTIC PROPHYLAXIS BEEN GIVEN WITHIN THE LAST 60 MINUTES?" />
        <YesNoNaSelect name="essentialImaging" defaultValue={existing?.essentialImaging} label="IS ESSENTIAL IMAGING DISPLAYED?" />
      </div>

      {/* BEFORE PATIENT LEAVES OPERATING ROOM */}
      <div className="border rounded-lg p-4">
        <h4 className="font-bold underline mb-3">BEFORE PATIENT LEAVES OPERATING ROOM:</h4>
        <p className="text-sm font-medium mb-2 ml-2">NURSE VERBALLY CONFIRMED WITH THE TEAM:</p>
        <div className="ml-4">
          <YesNoNaSelect name="procedureRecorded" defaultValue={existing?.procedureRecorded} label="THE NAME OF THE PROCEDURE RECORDED" />
          <YesNoNaSelect name="instrumentCountCorrect" defaultValue={existing?.instrumentCountCorrect} label="THAT INSTRUMENT, SPONGE AND NEEDLE COUNTS ARE CORRECT OR NOT APPLICABLE" />
          <YesNoNaSelect name="specimenLabelled" defaultValue={existing?.specimenLabelled} label="HOW THE SPECIMEN IS LABELLED (INCLUDING PATIENT NAME)" />
          <YesNoNaSelect name="equipmentProblems" defaultValue={existing?.equipmentProblems} label="WHETHER THERE ARE ANY EQUIPMENT PROBLEMS TO BE ADDRESSED" />
        </div>
        <YesNoNaSelect name="recoveryConcernsReviewed" defaultValue={existing?.recoveryConcernsReviewed} label="SURGEON, ANAESTHESIA PROFESSIONAL AND NURSE REVIEW THE KEY CONCERNS FOR RECOVERY AND MANAGEMENT OF THIS PATIENT" />
      </div>

      {/* Signatures */}
      <div className="border rounded-lg p-4">
        <h4 className="font-bold mb-3">SIGNATURES:</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Name of Surgeon</Label>
            <Input name="surgeonName" defaultValue={existing?.surgeonName} />
          </div>
          <div className="space-y-2">
            <Label>Signature</Label>
            <Input name="surgeonSignature" defaultValue={existing?.surgeonSignature} placeholder="Digital signature" />
          </div>
          <div className="space-y-2">
            <Label>Name of Anaesthetist</Label>
            <Input name="anaesthetistName" defaultValue={existing?.anaesthetistName} />
          </div>
          <div className="space-y-2">
            <Label>Signature</Label>
            <Input name="anaesthetistSignature" defaultValue={existing?.anaesthetistSignature} placeholder="Digital signature" />
          </div>
          <div className="space-y-2">
            <Label>Name of OT Nurse</Label>
            <Input name="otNurseName" defaultValue={existing?.otNurseName} />
          </div>
          <div className="space-y-2">
            <Label>Signature</Label>
            <Input name="otNurseSignature" defaultValue={existing?.otNurseSignature} placeholder="Digital signature" />
          </div>
        </div>
      </div>

      <div className="flex justify-between border-t pt-4">
        <Button type="button" variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Safety Checklist"}
        </Button>
      </div>
    </form>
  );
}

function IntraOpPhase({ caseId, data, caseData }: { caseId: string; data: any; caseData: any }) {
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
                    caseData={caseData}
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

function AnaesthesiaRecordForm({ existing, onSubmit, isLoading, caseData }: { existing: any; onSubmit: (d: any) => void; isLoading: boolean; caseData?: any }) {
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

  const printAnaesthesiaRecord = () => {
    const getInputValue = (name: string) => {
      const input = document.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLSelectElement;
      return input?.value || "";
    };
    const printPatientName = getInputValue('anaPatientName') || caseData?.patientName || "N/A";
    const printUhid = getInputValue('anaUhid') || caseData?.uhid || "N/A";
    const printAge = getInputValue('anaAge') || caseData?.patientAge || caseData?.age || "N/A";
    const printGender = getInputValue('anaGender') || caseData?.patientGender || caseData?.gender || "N/A";
    const printRoom = getInputValue('anaRoom') || caseData?.room || "N/A";
    const printDoctor = getInputValue('anaDoctor') || caseData?.surgeonName || "N/A";
    const printIpdNo = getInputValue('anaIpdNo') || caseData?.ipdNumber || "N/A";
    const printDoa = getInputValue('anaDoa') || caseData?.admissionDate || "N/A";
    const printBed = getInputValue('anaBed') || caseData?.bedNumber || "N/A";

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Anaesthesia Record</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11px; padding: 15px; }
          .header-table { width: 100%; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
          .header-table td { vertical-align: top; }
          .hospital-info { text-align: left; }
          .hospital-name { font-size: 16px; font-weight: bold; }
          .hospital-address { font-size: 10px; margin-top: 5px; }
          .patient-info { text-align: right; font-size: 10px; }
          .patient-info div { margin: 2px 0; }
          .form-title { text-align: center; font-size: 14px; font-weight: bold; text-decoration: underline; margin: 15px 0; }
          .section { margin-bottom: 15px; }
          .section-title { font-weight: bold; background: #f0f0f0; padding: 5px; margin-bottom: 8px; }
          .row { display: flex; margin-bottom: 6px; }
          .field { flex: 1; display: flex; }
          .label { font-weight: bold; min-width: 120px; }
          .value { flex: 1; border-bottom: 1px dotted #000; min-height: 16px; padding-left: 5px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td class="hospital-info" style="width: 50%;">
              <div class="hospital-name">GRAVITY HOSPITAL</div>
              <div class="hospital-address">
                Gat No. 167, Sahyog Nagar, Triveni Nagar, Nigdi<br/>
                Pimpri-Chinchwad, Maharashtra 411062<br/>
                Tel: +91 20 1234 5678 | Emergency: +91 20 1234 5680<br/>
                Email: info@gravityhospital.in
              </div>
            </td>
            <td class="patient-info" style="width: 50%;">
              <div><strong>Patient Name:</strong> ${printPatientName}</div>
              <div><strong>UHID No:</strong> ${printUhid}</div>
              <div><strong>Age/Gender:</strong> ${printAge} / ${printGender}</div>
              <div><strong>Room:</strong> ${printRoom}</div>
              <div><strong>Doctor:</strong> ${printDoctor}</div>
              <div><strong>IPD No:</strong> ${printIpdNo}</div>
              <div><strong>DOA:</strong> ${printDoa}</div>
              <div><strong>Bed No:</strong> ${printBed}</div>
            </td>
          </tr>
        </table>

        <div class="form-title">ANAESTHESIA RECORD</div>

        <div class="section">
          <div class="section-title">ANAESTHESIA DETAILS</div>
          <div class="grid-2">
            <div class="field"><span class="label">Anaesthetist:</span><span class="value">${existing?.anaesthetistId || "___"}</span></div>
            <div class="field"><span class="label">Anaesthesia Type:</span><span class="value">${existing?.anaesthesiaType || "___"}</span></div>
          </div>
          <div class="grid-3" style="margin-top: 8px;">
            <div class="field"><span class="label">Induction Time:</span><span class="value">${existing?.inductionTime || "___"}</span></div>
            <div class="field"><span class="label">Airway:</span><span class="value">${existing?.airwayManagement || "___"}</span></div>
            <div class="field"><span class="label">ETT/LMA Size:</span><span class="value">${existing?.ettSize || "___"}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">MEDICATIONS</div>
          <div class="grid-2">
            <div class="field"><span class="label">Induction Agents:</span><span class="value">${existing?.inductionAgents || "___"}</span></div>
            <div class="field"><span class="label">Maintenance:</span><span class="value">${existing?.maintenanceAgents || "___"}</span></div>
          </div>
          <div class="grid-2" style="margin-top: 8px;">
            <div class="field"><span class="label">Muscle Relaxants:</span><span class="value">${existing?.muscleRelaxants || "___"}</span></div>
            <div class="field"><span class="label">Analgesics:</span><span class="value">${existing?.analgesics || "___"}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">FLUID BALANCE</div>
          <div class="grid-3">
            <div class="field"><span class="label">IV Fluids:</span><span class="value">${existing?.ivFluids || "___"}</span></div>
            <div class="field"><span class="label">Blood Products:</span><span class="value">${existing?.bloodProducts || "___"}</span></div>
            <div class="field"><span class="label">Est. Blood Loss:</span><span class="value">${existing?.estimatedBloodLoss || "___"} ml</span></div>
          </div>
          <div class="grid-2" style="margin-top: 8px;">
            <div class="field"><span class="label">Urine Output:</span><span class="value">${existing?.urineOutput || "___"}</span></div>
            <div class="field"><span class="label">Complications:</span><span class="value">${existing?.complications || "None"}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">RECOVERY</div>
          <div class="grid-3">
            <div class="field"><span class="label">Reversal Agents:</span><span class="value">${existing?.reversalAgents || "___"}</span></div>
            <div class="field"><span class="label">Extubation Time:</span><span class="value">${existing?.extubationTime || "___"}</span></div>
            <div class="field"><span class="label">Post-Op Disposition:</span><span class="value">${existing?.postOpDisposition || "___"}</span></div>
          </div>
        </div>

        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
          <div style="text-align: center; width: 200px;">
            <div style="border-top: 1px solid #000; padding-top: 5px;">Anaesthetist Signature</div>
          </div>
          <div style="text-align: center; width: 200px;">
            <div style="border-top: 1px solid #000; padding-top: 5px;">Date & Time</div>
          </div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border rounded-lg p-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg">GRAVITY HOSPITAL</h3>
            <p className="text-xs text-muted-foreground">Multi-Specialty Hospital & Research Center</p>
            <p className="text-xs text-muted-foreground">Gat No. 167, Sahyog Nagar, Triveni Nagar, Nigdi, Pimpri-Chinchwad 411062</p>
            <p className="text-xs text-muted-foreground">Tel: +91 20 1234 5678 | Emergency: +91 20 1234 5680</p>
            <p className="text-xs text-muted-foreground">Email: info@gravityhospital.in</p>
          </div>
          <div className="text-right text-sm space-y-1">
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 items-center text-xs">
              <span className="text-muted-foreground">Patient Name:</span>
              <Input name="anaPatientName" defaultValue={caseData?.patientName || ""} placeholder="Patient Name" className="text-xs" />
              <span className="text-muted-foreground">UHID No:</span>
              <Input name="anaUhid" defaultValue={caseData?.uhid || ""} placeholder="UHID" className="text-xs" />
              <span className="text-muted-foreground">Age/Gender:</span>
              <div className="flex gap-1">
                <Input name="anaAge" defaultValue={caseData?.patientAge || caseData?.age || ""} placeholder="Age" className="text-xs w-14" />
                <Input name="anaGender" defaultValue={caseData?.patientGender || caseData?.gender || ""} placeholder="M/F" className="text-xs w-12" />
              </div>
              <span className="text-muted-foreground">Room/Bed:</span>
              <div className="flex gap-1">
                <Input name="anaRoom" defaultValue={caseData?.room || ""} placeholder="Room" className="text-xs" />
                <Input name="anaBed" defaultValue={caseData?.bedNumber || ""} placeholder="Bed" className="text-xs w-12" />
              </div>
              <span className="text-muted-foreground">Doctor:</span>
              <Input name="anaDoctor" defaultValue={caseData?.surgeonName || ""} placeholder="Doctor" className="text-xs" />
              <span className="text-muted-foreground">IPD No:</span>
              <Input name="anaIpdNo" defaultValue={caseData?.ipdNumber || ""} placeholder="IPD No" className="text-xs" />
              <span className="text-muted-foreground">DOA:</span>
              <Input name="anaDoa" type="date" defaultValue={caseData?.admissionDate ? format(new Date(caseData.admissionDate), "yyyy-MM-dd") : ""} className="text-xs" />
            </div>
          </div>
        </div>
      </div>
      
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

      <div className="flex justify-between">
        {existing && (
          <Button type="button" variant="outline" onClick={printAnaesthesiaRecord}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        )}
        <div className="flex-1" />
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

function PostOpPhase({ caseId, data, caseData }: { caseId: string; data: any; caseData?: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeForm, setActiveForm] = useState<string | null>(null);

  const saveAssessmentMutation = useMutation({
    mutationFn: (formData: any) => apiRequest("POST", `/api/ot-cases/${caseId}/postop-assessment`, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ot-cases", caseId] });
      toast({ title: "Saved", description: "Post-op assessment recorded" });
      setActiveForm(null);
    },
  });

  const saveMonitoringMutation = useMutation({
    mutationFn: (formData: any) => apiRequest("POST", `/api/ot-cases/${caseId}/monitoring-chart`, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ot-cases", caseId] });
      toast({ title: "Saved", description: "Monitoring entry added" });
      setActiveForm(null);
    },
  });

  const saveLabourMutation = useMutation({
    mutationFn: (formData: any) => apiRequest("POST", `/api/ot-cases/${caseId}/labour-chart`, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ot-cases", caseId] });
      toast({ title: "Saved", description: "Labour chart entry added" });
      setActiveForm(null);
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
                    existing={data?.assessments?.[0]}
                    onSubmit={(d) => saveAssessmentMutation.mutate(d)}
                    isLoading={saveAssessmentMutation.isPending}
                    caseData={caseData}
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
                    caseData={caseData}
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

function PostOpAssessmentForm({ existing, onSubmit, isLoading, caseData }: { existing: any; onSubmit: (d: any) => void; isLoading: boolean; caseData?: any }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [postAnaesthesiaRows, setPostAnaesthesiaRows] = useState<any[]>(() => {
    try { return existing?.postAnaesthesiaEval ? JSON.parse(existing.postAnaesthesiaEval) : [{ time: '', bp: '', pulse: '', rr: '', spo2: '', airwayPatency: '' }]; }
    catch { return [{ time: '', bp: '', pulse: '', rr: '', spo2: '', airwayPatency: '' }]; }
  });
  const [aldreteRows, setAldreteRows] = useState<any[]>(() => {
    try { return existing?.aldreteScorecard ? JSON.parse(existing.aldreteScorecard) : [{ time: '', activity: '', respiration: '', consciousness: '', o2Saturation: '', circulation: '', totalScore: '' }]; }
    catch { return [{ time: '', activity: '', respiration: '', consciousness: '', o2Saturation: '', circulation: '', totalScore: '' }]; }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      operativeProcedure: formData.get("operativeProcedure"),
      operationCompletionTime: formData.get("operationCompletionTime"),
      postAnaesthesiaEval: JSON.stringify(postAnaesthesiaRows),
      aldreteScorecard: JSON.stringify(aldreteRows),
      progressNotes: formData.get("progressNotes"),
      timePatientDischarged: formData.get("timePatientDischarged"),
      timePostOpInstructionGiven: formData.get("timePostOpInstructionGiven"),
      dischargeTemp: formData.get("dischargeTemp"),
      dischargePulse: formData.get("dischargePulse"),
      dischargeRr: formData.get("dischargeRr"),
      dischargeBp: formData.get("dischargeBp"),
      surgeonAnaesthetistSign: formData.get("surgeonAnaesthetistSign"),
      surgeonAnaesthetistDate: formData.get("surgeonAnaesthetistDate"),
      surgeonAnaesthetistTime: formData.get("surgeonAnaesthetistTime"),
      recoveryNurseSign: formData.get("recoveryNurseSign"),
      recoveryNurseDate: formData.get("recoveryNurseDate"),
      recoveryNurseTime: formData.get("recoveryNurseTime"),
    });
  };

  const updatePostAnaesthesiaRow = (idx: number, field: string, value: string) => {
    const updated = [...postAnaesthesiaRows];
    updated[idx] = { ...updated[idx], [field]: value };
    setPostAnaesthesiaRows(updated);
  };

  const addPostAnaesthesiaRow = () => {
    setPostAnaesthesiaRows([...postAnaesthesiaRows, { time: '', bp: '', pulse: '', rr: '', spo2: '', airwayPatency: '' }]);
  };

  const updateAldreteRow = (idx: number, field: string, value: string) => {
    const updated = [...aldreteRows];
    updated[idx] = { ...updated[idx], [field]: value };
    // Auto-calculate total score
    const row = updated[idx];
    const total = (parseInt(row.activity) || 0) + (parseInt(row.respiration) || 0) + 
                  (parseInt(row.consciousness) || 0) + (parseInt(row.o2Saturation) || 0) + 
                  (parseInt(row.circulation) || 0);
    updated[idx].totalScore = total.toString();
    setAldreteRows(updated);
  };

  const addAldreteRow = () => {
    setAldreteRows([...aldreteRows, { time: '', activity: '', respiration: '', consciousness: '', o2Saturation: '', circulation: '', totalScore: '' }]);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Get current form values
    const formData = formRef.current ? new FormData(formRef.current) : new FormData();
    const operativeProcedure = (formData.get("operativeProcedure") as string) || '';
    const operationCompletionTime = (formData.get("operationCompletionTime") as string) || '';
    const progressNotes = (formData.get("progressNotes") as string) || '';
    const timePatientDischarged = (formData.get("timePatientDischarged") as string) || '';
    const timePostOpInstructionGiven = (formData.get("timePostOpInstructionGiven") as string) || '';
    const dischargeTemp = (formData.get("dischargeTemp") as string) || '';
    const dischargePulse = (formData.get("dischargePulse") as string) || '';
    const dischargeRr = (formData.get("dischargeRr") as string) || '';
    const dischargeBp = (formData.get("dischargeBp") as string) || '';
    const surgeonAnaesthetistSign = (formData.get("surgeonAnaesthetistSign") as string) || '';
    const surgeonAnaesthetistDate = (formData.get("surgeonAnaesthetistDate") as string) || '';
    const surgeonAnaesthetistTime = (formData.get("surgeonAnaesthetistTime") as string) || '';
    const recoveryNurseSign = (formData.get("recoveryNurseSign") as string) || '';
    const recoveryNurseDate = (formData.get("recoveryNurseDate") as string) || '';
    const recoveryNurseTime = (formData.get("recoveryNurseTime") as string) || '';
    
    const postAnaesthesiaHtml = postAnaesthesiaRows.map(r => `
      <tr><td>${r.time || ''}</td><td>${r.bp || ''}</td><td>${r.pulse || ''}</td><td>${r.rr || ''}</td><td>${r.spo2 || ''}</td><td>${r.airwayPatency || ''}</td></tr>
    `).join('');
    
    const aldreteHtml = aldreteRows.map(r => `
      <tr><td>${r.time || ''}</td><td>${r.activity || ''}</td><td>${r.respiration || ''}</td><td>${r.consciousness || ''}</td><td>${r.o2Saturation || ''}</td><td>${r.circulation || ''}</td><td>${r.totalScore || ''}</td></tr>
    `).join('');
    
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Post-Operative Assessment</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; font-size: 11px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
          .hospital-info { flex: 1; }
          .hospital-name { font-size: 16px; font-weight: bold; }
          .patient-info { flex: 1; text-align: right; font-size: 10px; }
          .title { background: #333; color: white; text-align: center; padding: 5px; font-size: 12px; font-weight: bold; margin: 15px 0; }
          .field-row { display: flex; margin: 5px 0; }
          .field-row label { min-width: 150px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #000; padding: 5px; text-align: center; }
          th { background: #f0f0f0; }
          .section-title { font-weight: bold; margin: 15px 0 5px 0; }
          .signature-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .signature-block { display: flex; gap: 10px; }
          .signature-line { border-bottom: 1px solid #000; min-width: 100px; }
          .score-ref { font-size: 9px; margin: 10px 0; border: 1px solid #000; padding: 5px; }
          @media print { body { margin: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="hospital-info">
            <div class="hospital-name">GRAVITY HOSPITAL</div>
            <div>Gat No. 167, Sahyog Nagar, Triveni Nagar, Nigdi</div>
            <div>Pimpri-Chinchwad, Maharashtra 411062</div>
            <div>Tel: +91 20 1234 5678 | Emergency: +91 20 1234 5680</div>
            <div>Email: info@gravityhospital.in</div>
          </div>
          <div class="patient-info">
            <div><strong>Patient Name:</strong> ${caseData?.patientName || ''}</div>
            <div><strong>PRN No:</strong> ${caseData?.uhid || ''}</div>
            <div><strong>Age:</strong> ${caseData?.patientAge || ''} | <strong>Sex:</strong> ${caseData?.patientGender || ''}</div>
            <div><strong>IPD No:</strong> ${caseData?.ipdNo || ''}</div>
            <div><strong>Ward:</strong> ${caseData?.room || ''} | <strong>Bed No:</strong> ${caseData?.bedNo || ''}</div>
          </div>
        </div>
        
        <div class="title">Post-Operative Assessment</div>
        
        <div class="field-row"><label>Patient Name:</label><span>${caseData?.patientName || ''}</span><label style="margin-left:50px;">UHID/Case No:</label><span>${caseData?.uhid || ''}</span></div>
        <div class="field-row"><label>Age/Sex:</label><span>${caseData?.patientAge || ''} / ${caseData?.patientGender || ''}</span><label style="margin-left:50px;">Date:</label><span>${new Date().toLocaleDateString()}</span><label style="margin-left:50px;">Operative procedure done:</label><span>${operativeProcedure}</span></div>
        <div class="field-row"><label>Operation Completion Time:</label><span>${operationCompletionTime}</span></div>
        
        <div class="section-title">Post Anaesthesia Evaluation:</div>
        <table>
          <thead><tr><th>Time</th><th>BP</th><th>Pulse</th><th>RR</th><th>SPO2</th><th>Airway Patency</th></tr></thead>
          <tbody>${postAnaesthesiaHtml}</tbody>
        </table>
        
        <div class="section-title">Aldret Scorecard (10 = Total score, Score >= 9 required for discharge from recovery)</div>
        <table>
          <thead><tr><th>Time</th><th>Activity</th><th>Respiration</th><th>Consciousness</th><th>Oxygen Saturation</th><th>Circulation</th><th>Total Score</th></tr></thead>
          <tbody>${aldreteHtml}</tbody>
        </table>
        
        <div class="score-ref">
          <strong>Score Measures:</strong><br/>
          <strong>Activity:</strong> 2=Able to move 4 extremities, 1=Able to move 2 extremities, 0=Unable to move<br/>
          <strong>Respiration:</strong> 2=Able to breathe deeply and cough freely, 1=Dyspnoea/limited breathing, 0=Apnoeic or on mechanical ventilation<br/>
          <strong>Consciousness:</strong> 2=Fully awake, 1=Arousable on calling, 0=Not responding<br/>
          <strong>O2 Saturation:</strong> 2=Able to maintain O2 saturation > 92% on room air, 1=Needs O2 inhalation to maintain > 90%, 0=O2 saturation < 90% even with O2 supplement<br/>
          <strong>Circulation:</strong> 2=BP ± 20 mm of pre anaesthetic level, 1=BP ± 20-50 mm, 0=BP ± 50 mm of pre anaesthetic level
        </div>
        
        <div class="section-title">Progress notes:</div>
        <div style="border: 1px solid #000; min-height: 50px; padding: 5px;">${progressNotes}</div>
        
        <div class="field-row" style="margin-top: 15px;"><label>Time patient discharged:</label><span>${timePatientDischarged}</span><label style="margin-left:100px;">Time given post OP instruction sheet:</label><span>${timePostOpInstructionGiven}</span></div>
        
        <div class="field-row"><label>Vital signs at time of discharge:</label><span>T: ${dischargeTemp} P: ${dischargePulse} RR: ${dischargeRr} BP: ${dischargeBp}</span></div>
        
        <div class="signature-row" style="margin-top: 20px;">
          <span>Surgeon/Anesthetist approval for discharge:</span>
          <div class="signature-block"><span>Sign:</span><span class="signature-line">${surgeonAnaesthetistSign}</span></div>
          <div class="signature-block"><span>Date:</span><span class="signature-line">${surgeonAnaesthetistDate}</span></div>
          <div class="signature-block"><span>Time:</span><span class="signature-line">${surgeonAnaesthetistTime}</span></div>
        </div>
        
        <div class="signature-row">
          <span>Recovery Nurse:</span>
          <div class="signature-block"><span>Sign:</span><span class="signature-line">${recoveryNurseSign}</span></div>
          <div class="signature-block"><span>Date:</span><span class="signature-line">${recoveryNurseDate}</span></div>
          <div class="signature-block"><span>Time:</span><span class="signature-line">${recoveryNurseTime}</span></div>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
      {/* Hospital Header */}
      <div className="border-b-2 border-primary pb-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold">GRAVITY HOSPITAL</h2>
            <p className="text-sm text-muted-foreground">Gat No. 167, Sahyog Nagar, Triveni Nagar, Nigdi</p>
            <p className="text-sm text-muted-foreground">Pimpri-Chinchwad, Maharashtra 411062</p>
            <p className="text-sm text-muted-foreground">Tel: +91 20 1234 5678 | Emergency: +91 20 1234 5680</p>
            <p className="text-sm text-muted-foreground">Email: info@gravityhospital.in</p>
          </div>
          <div className="text-right text-sm">
            <div><span className="font-medium">Patient Name:</span> {caseData?.patientName || '-'}</div>
            <div><span className="font-medium">PRN No:</span> {caseData?.uhid || '-'}</div>
            <div><span className="font-medium">Age:</span> {caseData?.patientAge || '-'} | <span className="font-medium">Sex:</span> {caseData?.patientGender || '-'}</div>
            <div><span className="font-medium">IPD No:</span> {caseData?.ipdNo || '-'} | <span className="font-medium">Ward:</span> {caseData?.room || '-'}</div>
            <div><span className="font-medium">Bed No:</span> {caseData?.bedNo || '-'}</div>
          </div>
        </div>
      </div>

      <div className="text-center font-bold text-lg bg-primary text-primary-foreground py-2 rounded">Post-Operative Assessment</div>

      {/* Operation Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Operative procedure done</Label>
          <Input name="operativeProcedure" defaultValue={existing?.operativeProcedure} />
        </div>
        <div className="space-y-2">
          <Label>Operation Completion Time</Label>
          <Input name="operationCompletionTime" type="time" defaultValue={existing?.operationCompletionTime} />
        </div>
      </div>

      {/* Post Anaesthesia Evaluation Table */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-bold">Post Anaesthesia Evaluation:</h4>
          <Button type="button" variant="outline" size="sm" onClick={addPostAnaesthesiaRow}>+ Add Row</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left">Time</th>
                <th className="p-2 text-left">BP</th>
                <th className="p-2 text-left">Pulse</th>
                <th className="p-2 text-left">RR</th>
                <th className="p-2 text-left">SPO₂</th>
                <th className="p-2 text-left">Airway Patency</th>
              </tr>
            </thead>
            <tbody>
              {postAnaesthesiaRows.map((row, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-1"><Input value={row.time} onChange={e => updatePostAnaesthesiaRow(idx, 'time', e.target.value)} type="time" className="w-24" /></td>
                  <td className="p-1"><Input value={row.bp} onChange={e => updatePostAnaesthesiaRow(idx, 'bp', e.target.value)} placeholder="120/80" className="w-24" /></td>
                  <td className="p-1"><Input value={row.pulse} onChange={e => updatePostAnaesthesiaRow(idx, 'pulse', e.target.value)} placeholder="72" className="w-20" /></td>
                  <td className="p-1"><Input value={row.rr} onChange={e => updatePostAnaesthesiaRow(idx, 'rr', e.target.value)} placeholder="16" className="w-16" /></td>
                  <td className="p-1"><Input value={row.spo2} onChange={e => updatePostAnaesthesiaRow(idx, 'spo2', e.target.value)} placeholder="98" className="w-16" /></td>
                  <td className="p-1"><Input value={row.airwayPatency} onChange={e => updatePostAnaesthesiaRow(idx, 'airwayPatency', e.target.value)} placeholder="Patent" className="w-24" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Aldrete Scorecard */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-bold">Aldret Scorecard <span className="font-normal text-sm">(10 = Total score, Score {'>='} 9 required for discharge from recovery)</span></h4>
          <Button type="button" variant="outline" size="sm" onClick={addAldreteRow}>+ Add Row</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left">Time</th>
                <th className="p-2 text-left">Activity (0-2)</th>
                <th className="p-2 text-left">Respiration (0-2)</th>
                <th className="p-2 text-left">Consciousness (0-2)</th>
                <th className="p-2 text-left">O₂ Saturation (0-2)</th>
                <th className="p-2 text-left">Circulation (0-2)</th>
                <th className="p-2 text-left">Total Score</th>
              </tr>
            </thead>
            <tbody>
              {aldreteRows.map((row, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-1"><Input value={row.time} onChange={e => updateAldreteRow(idx, 'time', e.target.value)} type="time" className="w-24" /></td>
                  <td className="p-1">
                    <Select value={row.activity} onValueChange={v => updateAldreteRow(idx, 'activity', v)}>
                      <SelectTrigger className="w-20"><SelectValue placeholder="-" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="0">0</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-1">
                    <Select value={row.respiration} onValueChange={v => updateAldreteRow(idx, 'respiration', v)}>
                      <SelectTrigger className="w-20"><SelectValue placeholder="-" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="0">0</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-1">
                    <Select value={row.consciousness} onValueChange={v => updateAldreteRow(idx, 'consciousness', v)}>
                      <SelectTrigger className="w-20"><SelectValue placeholder="-" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="0">0</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-1">
                    <Select value={row.o2Saturation} onValueChange={v => updateAldreteRow(idx, 'o2Saturation', v)}>
                      <SelectTrigger className="w-20"><SelectValue placeholder="-" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="0">0</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-1">
                    <Select value={row.circulation} onValueChange={v => updateAldreteRow(idx, 'circulation', v)}>
                      <SelectTrigger className="w-20"><SelectValue placeholder="-" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="0">0</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-1 text-center font-bold">{row.totalScore || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Score Reference */}
        <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
          <strong>Score Measures:</strong><br/>
          <strong>Activity:</strong> 2=Able to move 4 extremities voluntarily, 1=Able to move 2 extremities, 0=Unable to move<br/>
          <strong>Respiration:</strong> 2=Able to breathe deeply and cough freely, 1=Dyspnoea/limited breathing, 0=Apnoeic or on mechanical ventilation<br/>
          <strong>Consciousness:</strong> 2=Fully awake, 1=Arousable on calling, 0=Not responding<br/>
          <strong>O₂ Saturation:</strong> 2=Able to maintain O₂ {'>'} 92% on room air, 1=Needs O₂ inhalation to maintain {'>'} 90%, 0=O₂ {'<'} 90% even with O₂ supplement<br/>
          <strong>Circulation:</strong> 2=BP ± 20mm of pre anaesthetic level, 1=BP ± 20-50mm, 0=BP ± 50mm of pre anaesthetic level
        </div>
      </div>

      {/* Progress Notes */}
      <div className="space-y-2">
        <Label className="font-bold">Progress notes:</Label>
        <Textarea name="progressNotes" defaultValue={existing?.progressNotes} placeholder="Enter progress notes..." />
      </div>

      {/* Discharge Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Time patient discharged</Label>
          <Input name="timePatientDischarged" type="time" defaultValue={existing?.timePatientDischarged} />
        </div>
        <div className="space-y-2">
          <Label>Time given post OP instruction sheet</Label>
          <Input name="timePostOpInstructionGiven" type="time" defaultValue={existing?.timePostOpInstructionGiven} />
        </div>
      </div>

      {/* Vital Signs at Discharge */}
      <div className="border rounded-lg p-4">
        <h4 className="font-bold mb-3">Vital signs at time of discharge:</h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>T (°C)</Label>
            <Input name="dischargeTemp" defaultValue={existing?.dischargeTemp} placeholder="36.5" />
          </div>
          <div className="space-y-2">
            <Label>P (Pulse)</Label>
            <Input name="dischargePulse" defaultValue={existing?.dischargePulse} placeholder="72" />
          </div>
          <div className="space-y-2">
            <Label>RR</Label>
            <Input name="dischargeRr" defaultValue={existing?.dischargeRr} placeholder="16" />
          </div>
          <div className="space-y-2">
            <Label>BP</Label>
            <Input name="dischargeBp" defaultValue={existing?.dischargeBp} placeholder="120/80" />
          </div>
        </div>
      </div>

      {/* Surgeon/Anesthetist Approval */}
      <div className="border rounded-lg p-4">
        <h4 className="font-bold mb-3">Surgeon/Anesthetist approval for discharge:</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Sign</Label>
            <Input name="surgeonAnaesthetistSign" defaultValue={existing?.surgeonAnaesthetistSign} />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input name="surgeonAnaesthetistDate" type="date" defaultValue={existing?.surgeonAnaesthetistDate} />
          </div>
          <div className="space-y-2">
            <Label>Time</Label>
            <Input name="surgeonAnaesthetistTime" type="time" defaultValue={existing?.surgeonAnaesthetistTime} />
          </div>
        </div>
      </div>

      {/* Recovery Nurse */}
      <div className="border rounded-lg p-4">
        <h4 className="font-bold mb-3">Recovery Nurse:</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Sign</Label>
            <Input name="recoveryNurseSign" defaultValue={existing?.recoveryNurseSign} />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input name="recoveryNurseDate" type="date" defaultValue={existing?.recoveryNurseDate} />
          </div>
          <div className="space-y-2">
            <Label>Time</Label>
            <Input name="recoveryNurseTime" type="time" defaultValue={existing?.recoveryNurseTime} />
          </div>
        </div>
      </div>

      <div className="flex justify-between border-t pt-4">
        <Button type="button" variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Assessment"}
        </Button>
      </div>
    </form>
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
                {existing.slice(-10).map((m: any, idx: number) => {
                  const timeValue = m.recordTime || m.recordedAt || m.createdAt;
                  let formattedTime = "--:--";
                  try {
                    if (timeValue) {
                      const date = new Date(timeValue);
                      if (!isNaN(date.getTime())) {
                        formattedTime = format(date, "HH:mm");
                      }
                    }
                  } catch (e) {
                    formattedTime = "--:--";
                  }
                  return (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{formattedTime}</td>
                      <td className="p-2 text-center">{m.heartRate || '-'}</td>
                      <td className="p-2 text-center">{m.bloodPressureSystolic || '-'}/{m.bloodPressureDiastolic || '-'}</td>
                      <td className="p-2 text-center">{m.respiratoryRate || '-'}</td>
                      <td className="p-2 text-center">{m.spo2 ? `${m.spo2}%` : '-'}</td>
                      <td className="p-2 text-center">{m.temperature ? `${m.temperature}°C` : '-'}</td>
                      <td className="p-2 text-center">{m.painScore !== null && m.painScore !== undefined ? `${m.painScore}/10` : '-'}</td>
                    </tr>
                  );
                })}
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
      recordTime: new Date().toISOString(),
      cervicalDilation: formData.get("cervicalDilation") || null,
      cervicalEffacement: formData.get("effacement") || null,
      fetalStation: formData.get("station") || null,
      fetalHeartRate: formData.get("fetalHeartRate") || null,
      contractionFrequency: formData.get("contractionFrequency") || null,
      contractionDuration: formData.get("contractionDuration") || null,
      membraneStatus: formData.get("membranes") || null,
      amnioticFluidColor: formData.get("liquorColor") || null,
      maternalPulse: formData.get("maternalPulse") || null,
      maternalBP: formData.get("maternalBP") || null,
      notes: formData.get("notes") || null,
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
                <span>{format(new Date(l.recordTime), "HH:mm")}</span>
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

function NeonateSheetForm({ existing, onSubmit, isLoading, caseData }: { existing: any; onSubmit: (d: any) => void; isLoading: boolean; caseData?: any }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      mothersName: formData.get("mothersName"),
      sex: formData.get("sex"),
      gestationalAge: formData.get("gestationalAge"),
      mothersBloodGroup: formData.get("mothersBloodGroup"),
      birthTime: formData.get("birthTime"),
      birthWeight: formData.get("birthWeight"),
      riskFactorsInMother: formData.get("riskFactorsInMother"),
      modeOfDelivery: formData.get("modeOfDelivery"),
      durationOfLeaking: formData.get("durationOfLeaking"),
      reasonForIntervention: formData.get("reasonForIntervention"),
      anaesthesiaUsed: formData.get("anaesthesiaUsed"),
      invBloodGroup: formData.get("invBloodGroup"),
      invG6pd: formData.get("invG6pd"),
      invTsh: formData.get("invTsh"),
      resuscO2: formData.get("resuscO2"),
      resuscBagMaskVentilation: formData.get("resuscBagMaskVentilation"),
      resuscOthers: formData.get("resuscOthers"),
      apgarAt1Min: formData.get("apgarAt1Min"),
      apgarAt5Min: formData.get("apgarAt5Min"),
      examHr: formData.get("examHr"),
      examRr: formData.get("examRr"),
      examUmbilicalCord: formData.get("examUmbilicalCord"),
      examFemoralPulses: formData.get("examFemoralPulses"),
      examSkullAndSpine: formData.get("examSkullAndSpine"),
      examLipsAndOralCavity: formData.get("examLipsAndOralCavity"),
      examAnalOpening: formData.get("examAnalOpening"),
      examLimbsAndHips: formData.get("examLimbsAndHips"),
      examRs: formData.get("examRs"),
      examCvs: formData.get("examCvs"),
      examPa: formData.get("examPa"),
      examCns: formData.get("examCns"),
      examCry: formData.get("examCry"),
      examSuck: formData.get("examSuck"),
      examTone: formData.get("examTone"),
      examGrasp: formData.get("examGrasp"),
      examActivity: formData.get("examActivity"),
      treatmentToBeGiven: formData.get("treatmentToBeGiven"),
      deliveryAttendedByDr: formData.get("deliveryAttendedByDr"),
      signatureDate: formData.get("signatureDate"),
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Assessment Sheet for Neonate</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
          .hospital-info { flex: 1; }
          .hospital-name { font-size: 16px; font-weight: bold; }
          .patient-info { flex: 1; text-align: right; font-size: 11px; }
          .patient-info div { margin: 2px 0; }
          .title { text-align: center; font-size: 14px; font-weight: bold; text-decoration: underline; margin: 15px 0; }
          .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
          .field { display: flex; align-items: flex-end; gap: 5px; }
          .field-label { font-weight: bold; white-space: nowrap; }
          .field-value { border-bottom: 1px solid #000; min-width: 100px; padding: 2px; flex: 1; }
          .section-title { font-weight: bold; text-decoration: underline; margin: 15px 0 8px 0; }
          .exam-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
          .full-width { grid-column: span 2; }
          .signature-section { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; }
          .signature-block { text-align: center; }
          .signature-line { border-top: 1px solid #000; width: 150px; margin-top: 40px; padding-top: 5px; }
          @media print { body { margin: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="hospital-info">
            <div class="hospital-name">GRAVITY HOSPITAL</div>
            <div>Gat No. 167, Sahyog Nagar, Triveni Nagar, Nigdi</div>
            <div>Pimpri-Chinchwad, Maharashtra 411062</div>
            <div>Tel: +91 20 1234 5678 | Emergency: +91 20 1234 5680</div>
            <div>Email: info@gravityhospital.in</div>
          </div>
          <div class="patient-info">
            <div><strong>Patient Name:</strong> ${caseData?.patientName || ''}</div>
            <div><strong>UHID No:</strong> ${caseData?.uhid || ''}</div>
            <div><strong>Age:</strong> ${caseData?.patientAge || ''} &nbsp;&nbsp; <strong>IPD No:</strong> ${caseData?.ipdNo || ''}</div>
            <div><strong>Room:</strong> ${caseData?.room || ''} &nbsp;&nbsp; <strong>DOA:</strong> ${caseData?.admissionDate ? new Date(caseData.admissionDate).toLocaleDateString() : ''}</div>
            <div><strong>Doctor:</strong> ${caseData?.primarySurgeonName || ''} &nbsp;&nbsp; <strong>Bed No:</strong> ${caseData?.bedNo || ''}</div>
          </div>
        </div>
        
        <div class="title">ASSESSMENT SHEET FOR NEONATE</div>
        
        <div class="form-grid">
          <div class="field"><span class="field-label">Mother's Name:</span><span class="field-value">${existing?.mothersName || ''}</span></div>
          <div class="field"><span class="field-label">Sex:</span><span class="field-value">${existing?.sex || ''}</span></div>
          <div class="field"><span class="field-label">Gestational Age:</span><span class="field-value">${existing?.gestationalAge || ''}</span></div>
          <div class="field"><span class="field-label">Mother's Blood Group:</span><span class="field-value">${existing?.mothersBloodGroup || ''}</span></div>
          <div class="field"><span class="field-label">Birth Time:</span><span class="field-value">${existing?.birthTime || ''}</span></div>
          <div class="field"><span class="field-label">Birth Weight:</span><span class="field-value">${existing?.birthWeight || ''}</span></div>
          <div class="field full-width"><span class="field-label">Risk factors in Mother:</span><span class="field-value">${existing?.riskFactorsInMother || ''}</span></div>
          <div class="field"><span class="field-label">Mode of delivery:</span><span class="field-value">${existing?.modeOfDelivery || ''}</span></div>
          <div class="field"><span class="field-label">Planned / Emergency</span></div>
          <div class="field full-width"><span class="field-label">Duration of leaking, if any:</span><span class="field-value">${existing?.durationOfLeaking || ''}</span></div>
          <div class="field full-width"><span class="field-label">Reason for intervention:</span><span class="field-value">${existing?.reasonForIntervention || ''}</span></div>
          <div class="field full-width"><span class="field-label">Anaesthesia Used:</span><span class="field-value">${existing?.anaesthesiaUsed || ''}</span> (Spinal / General / Epidural)</div>
        </div>
        
        <div class="section-title">Investigation Sent:</div>
        <div class="form-grid">
          <div class="field"><span class="field-label">Blood Group:</span><span class="field-value">${existing?.invBloodGroup || ''}</span> (Yes/No/Sample Problem)</div>
          <div class="field"><span class="field-label">G6PD:</span><span class="field-value">${existing?.invG6pd || ''}</span> (Yes/No/Sample Problem)</div>
          <div class="field"><span class="field-label">TSH:</span><span class="field-value">${existing?.invTsh || ''}</span> (Yes/No/Sample Problem)</div>
        </div>
        
        <div class="section-title">RESUSCITATION NOTES:</div>
        <div class="form-grid">
          <div class="field"><span class="field-label">O2:</span><span class="field-value">${existing?.resuscO2 || ''}</span> (Given / Not Given)</div>
          <div class="field"><span class="field-label">Bag and Mask Ventilation:</span><span class="field-value">${existing?.resuscBagMaskVentilation || ''}</span></div>
          <div class="field full-width"><span class="field-label">Others:</span><span class="field-value">${existing?.resuscOthers || ''}</span></div>
        </div>
        
        <div class="field" style="margin: 10px 0;"><span class="field-label">Apgar Score at 1 min and 5 min:</span><span class="field-value">${existing?.apgarAt1Min || ''} / ${existing?.apgarAt5Min || ''}</span></div>
        
        <div class="section-title">ON EXAMINATION:</div>
        <div class="exam-grid">
          <div class="field"><span class="field-label">HR</span><span class="field-value">${existing?.examHr || ''}</span></div>
          <div class="field"><span class="field-label">RR</span><span class="field-value">${existing?.examRr || ''}</span></div>
          <div class="field"><span class="field-label">Umbilical Cord</span><span class="field-value">${existing?.examUmbilicalCord || ''}</span></div>
          <div class="field"><span class="field-label">Femoral Pulses</span><span class="field-value">${existing?.examFemoralPulses || ''}</span></div>
          <div class="field"><span class="field-label">Skull and Spine</span><span class="field-value">${existing?.examSkullAndSpine || ''}</span></div>
          <div class="field"><span class="field-label">Lips and Oral Cavity</span><span class="field-value">${existing?.examLipsAndOralCavity || ''}</span></div>
          <div class="field"><span class="field-label">Anal Opening</span><span class="field-value">${existing?.examAnalOpening || ''}</span></div>
          <div class="field"><span class="field-label">Limbs and Hips</span><span class="field-value">${existing?.examLimbsAndHips || ''}</span></div>
          <div class="field"><span class="field-label">RS</span><span class="field-value">${existing?.examRs || ''}</span></div>
          <div class="field"><span class="field-label">CVS</span><span class="field-value">${existing?.examCvs || ''}</span></div>
          <div class="field"><span class="field-label">PA</span><span class="field-value">${existing?.examPa || ''}</span></div>
          <div class="field"><span class="field-label">CNS</span><span class="field-value">${existing?.examCns || ''}</span></div>
          <div class="field"><span class="field-label">Cry</span><span class="field-value">${existing?.examCry || ''}</span></div>
          <div class="field"><span class="field-label">Suck</span><span class="field-value">${existing?.examSuck || ''}</span></div>
          <div class="field"><span class="field-label">Tone</span><span class="field-value">${existing?.examTone || ''}</span></div>
          <div class="field"><span class="field-label">Grasp</span><span class="field-value">${existing?.examGrasp || ''}</span></div>
          <div class="field full-width"><span class="field-label">Activity</span><span class="field-value">${existing?.examActivity || ''}</span></div>
        </div>
        
        <div class="field" style="margin: 15px 0;"><span class="field-label">Treatment to be given:</span><span class="field-value" style="min-width: 400px;">${existing?.treatmentToBeGiven || ''}</span></div>
        
        <div class="field" style="margin: 15px 0;"><span class="field-label">Delivery attended by Dr.:</span><span class="field-value" style="min-width: 200px;">${existing?.deliveryAttendedByDr || ''}</span></div>
        
        <div class="signature-section">
          <div class="signature-block">
            <div class="signature-line">Signature</div>
          </div>
          <div class="signature-block">
            <div class="signature-line">Date: ${existing?.signatureDate || ''}</div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Hospital Header */}
      <div className="border-b-2 border-primary pb-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold">GRAVITY HOSPITAL</h2>
            <p className="text-sm text-muted-foreground">Gat No. 167, Sahyog Nagar, Triveni Nagar, Nigdi</p>
            <p className="text-sm text-muted-foreground">Pimpri-Chinchwad, Maharashtra 411062</p>
            <p className="text-sm text-muted-foreground">Tel: +91 20 1234 5678 | Emergency: +91 20 1234 5680</p>
            <p className="text-sm text-muted-foreground">Email: info@gravityhospital.in</p>
          </div>
          <div className="text-right text-sm">
            <div><span className="font-medium">Patient Name:</span> {caseData?.patientName || '-'}</div>
            <div><span className="font-medium">UHID No:</span> {caseData?.uhid || '-'}</div>
            <div><span className="font-medium">Age:</span> {caseData?.patientAge || '-'} | <span className="font-medium">IPD No:</span> {caseData?.ipdNo || '-'}</div>
            <div><span className="font-medium">Room:</span> {caseData?.room || '-'} | <span className="font-medium">DOA:</span> {caseData?.admissionDate ? new Date(caseData.admissionDate).toLocaleDateString() : '-'}</div>
            <div><span className="font-medium">Doctor:</span> {caseData?.primarySurgeonName || '-'} | <span className="font-medium">Bed No:</span> {caseData?.bedNo || '-'}</div>
          </div>
        </div>
      </div>

      <div className="text-center font-bold text-lg underline mb-4">ASSESSMENT SHEET FOR NEONATE</div>

      {/* Mother & Baby Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Mother's Name</Label>
          <Input name="mothersName" defaultValue={existing?.mothersName} />
        </div>
        <div className="space-y-2">
          <Label>Sex</Label>
          <Select name="sex" defaultValue={existing?.sex || ""}>
            <SelectTrigger><SelectValue placeholder="M / F" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="M">M</SelectItem>
              <SelectItem value="F">F</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Gestational Age</Label>
          <Input name="gestationalAge" defaultValue={existing?.gestationalAge} placeholder="e.g., 38 weeks" />
        </div>
        <div className="space-y-2">
          <Label>Mother's Blood Group</Label>
          <Input name="mothersBloodGroup" defaultValue={existing?.mothersBloodGroup} placeholder="e.g., A+ve" />
        </div>
        <div className="space-y-2">
          <Label>Birth Time</Label>
          <Input name="birthTime" defaultValue={existing?.birthTime} placeholder="e.g., 10:30 AM" />
        </div>
        <div className="space-y-2">
          <Label>Birth Weight</Label>
          <Input name="birthWeight" defaultValue={existing?.birthWeight} placeholder="e.g., 3.2 kg" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Risk factors in Mother</Label>
        <Input name="riskFactorsInMother" defaultValue={existing?.riskFactorsInMother} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Mode of delivery</Label>
          <Select name="modeOfDelivery" defaultValue={existing?.modeOfDelivery || ""}>
            <SelectTrigger><SelectValue placeholder="Planned / Emergency" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Planned">Planned</SelectItem>
              <SelectItem value="Emergency">Emergency</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Duration of leaking, if any</Label>
          <Input name="durationOfLeaking" defaultValue={existing?.durationOfLeaking} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Reason for intervention</Label>
        <Input name="reasonForIntervention" defaultValue={existing?.reasonForIntervention} />
      </div>

      <div className="space-y-2">
        <Label>Anaesthesia Used (Spinal / General / Epidural)</Label>
        <Select name="anaesthesiaUsed" defaultValue={existing?.anaesthesiaUsed || ""}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Spinal">Spinal</SelectItem>
            <SelectItem value="General">General</SelectItem>
            <SelectItem value="Epidural">Epidural</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Investigation Sent */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3 underline">Investigation Sent:</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Blood Group</Label>
            <Select name="invBloodGroup" defaultValue={existing?.invBloodGroup || ""}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
                <SelectItem value="Sample Problem">Sample Problem</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>G6PD</Label>
            <Select name="invG6pd" defaultValue={existing?.invG6pd || ""}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
                <SelectItem value="Sample Problem">Sample Problem</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>TSH</Label>
            <Select name="invTsh" defaultValue={existing?.invTsh || ""}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
                <SelectItem value="Sample Problem">Sample Problem</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Resuscitation Notes */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3 underline">RESUSCITATION NOTES:</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>O2 (Given / Not Given)</Label>
            <Select name="resuscO2" defaultValue={existing?.resuscO2 || ""}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Given">Given</SelectItem>
                <SelectItem value="Not Given">Not Given</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Bag and Mask Ventilation</Label>
            <Input name="resuscBagMaskVentilation" defaultValue={existing?.resuscBagMaskVentilation} />
          </div>
        </div>
        <div className="space-y-2 mt-3">
          <Label>Others</Label>
          <Input name="resuscOthers" defaultValue={existing?.resuscOthers} />
        </div>
      </div>

      {/* APGAR Score */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Apgar Score at 1 min</Label>
          <Input name="apgarAt1Min" defaultValue={existing?.apgarAt1Min} />
        </div>
        <div className="space-y-2">
          <Label>Apgar Score at 5 min</Label>
          <Input name="apgarAt5Min" defaultValue={existing?.apgarAt5Min} />
        </div>
      </div>

      {/* On Examination */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3 underline">ON EXAMINATION:</h4>
        <div className="grid grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">HR</Label>
            <Input name="examHr" defaultValue={existing?.examHr}  />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">RR</Label>
            <Input name="examRr" defaultValue={existing?.examRr}  />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Umbilical Cord</Label>
            <Input name="examUmbilicalCord" defaultValue={existing?.examUmbilicalCord}  />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Femoral Pulses</Label>
            <Input name="examFemoralPulses" defaultValue={existing?.examFemoralPulses}  />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Skull and Spine</Label>
            <Input name="examSkullAndSpine" defaultValue={existing?.examSkullAndSpine}  />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Lips and Oral Cavity</Label>
            <Input name="examLipsAndOralCavity" defaultValue={existing?.examLipsAndOralCavity}  />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Anal Opening</Label>
            <Input name="examAnalOpening" defaultValue={existing?.examAnalOpening}  />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Limbs and Hips</Label>
            <Input name="examLimbsAndHips" defaultValue={existing?.examLimbsAndHips}  />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">RS</Label>
            <Input name="examRs" defaultValue={existing?.examRs}  />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">CVS</Label>
            <Input name="examCvs" defaultValue={existing?.examCvs}  />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">PA</Label>
            <Input name="examPa" defaultValue={existing?.examPa}  />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">CNS</Label>
            <Input name="examCns" defaultValue={existing?.examCns}  />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cry</Label>
            <Input name="examCry" defaultValue={existing?.examCry}  />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Suck</Label>
            <Input name="examSuck" defaultValue={existing?.examSuck}  />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tone</Label>
            <Input name="examTone" defaultValue={existing?.examTone}  />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Grasp</Label>
            <Input name="examGrasp" defaultValue={existing?.examGrasp}  />
          </div>
        </div>
        <div className="space-y-2 mt-3">
          <Label>Activity</Label>
          <Input name="examActivity" defaultValue={existing?.examActivity} />
        </div>
      </div>

      {/* Treatment and Delivery */}
      <div className="space-y-2">
        <Label>Treatment to be given</Label>
        <Textarea name="treatmentToBeGiven" defaultValue={existing?.treatmentToBeGiven} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Delivery attended by Dr.</Label>
          <Input name="deliveryAttendedByDr" defaultValue={existing?.deliveryAttendedByDr} />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input name="signatureDate" type="date" defaultValue={existing?.signatureDate} />
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Neonate Sheet"}
        </Button>
      </div>
    </form>
  );
}
