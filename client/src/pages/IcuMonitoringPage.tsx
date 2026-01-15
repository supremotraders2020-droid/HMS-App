import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Activity, Heart, Wind, Droplets, Pill, ClipboardList, Users, Clock, Plus, Search, Calendar, User, Thermometer, BarChart3, FileText, AlertTriangle, Stethoscope, Syringe, Beaker, FlaskConical, Scale, Timer, BedDouble, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Pencil, Check, X } from "lucide-react";
import type { IcuCharts, ServicePatient } from "@shared/schema";

function EditableCell({ 
  value, 
  onSave, 
  canEdit,
  type = "text"
}: { 
  value: string | number | null; 
  onSave: (newValue: string) => void;
  canEdit: boolean;
  type?: "text" | "number";
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value || ""));

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(String(value || ""));
    setIsEditing(false);
  };

  if (!canEdit) {
    return <span>{value || "-"}</span>;
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="h-7 w-16 text-xs px-1"
          type={type}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
        />
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave}>
          <Check className="h-3 w-3 text-green-600" />
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancel}>
          <X className="h-3 w-3 text-red-600" />
        </Button>
      </div>
    );
  }

  return (
    <div 
      className="cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded group flex items-center justify-center gap-1"
      onClick={() => setIsEditing(true)}
    >
      <span>{value || "-"}</span>
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50" />
    </div>
  );
}

interface IcuMonitoringPageProps {
  userRole: string;
  userId?: string;
  onBack?: () => void;
}

const HOURS_24 = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

export default function IcuMonitoringPage({ userRole, userId, onBack }: IcuMonitoringPageProps) {
  const { toast } = useToast();
  const [selectedChart, setSelectedChart] = useState<IcuCharts | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");
  
  const [newChart, setNewChart] = useState({
    patientId: "",
    patientName: "",
    age: "",
    sex: "",
    bloodGroup: "",
    weight: "",
    diagnosis: "",
    dateOfAdmission: format(new Date(), "yyyy-MM-dd"),
    ward: "ICU",
    bedNo: "",
    chartDate: format(new Date(), "yyyy-MM-dd"),
    admittingConsultant: "",
    icuConsultant: "",
    assignedNurse: "",
  });

  const { data: icuCharts = [], isLoading: chartsLoading } = useQuery<IcuCharts[]>({
    queryKey: ["/api/icu-charts"],
    refetchInterval: 5000, // Real-time refresh every 5 seconds
  });

  // Fetch admitted patients for dropdown
  const { data: admittedPatients = [], refetch: refetchPatients } = useQuery<any[]>({
    queryKey: ["/api/icu/admitted-patients"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch available ICU beds for dropdown
  const { data: availableBeds = [], refetch: refetchBeds } = useQuery<any[]>({
    queryKey: ["/api/icu/available-beds"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch ICU doctors for dropdown
  const { data: icuDoctors = [], refetch: refetchDoctors } = useQuery<any[]>({
    queryKey: ["/api/icu/doctors"],
    refetchInterval: 60000, // Auto-refresh every minute
  });

  // Fetch ICU nurses for dropdown
  const { data: icuNurses = [], refetch: refetchNurses } = useQuery<any[]>({
    queryKey: ["/api/icu/nurses"],
    refetchInterval: 60000, // Auto-refresh every minute
  });

  const { data: completeChart } = useQuery({
    queryKey: ["/api/icu-charts", selectedChart?.id, "complete"],
    enabled: !!selectedChart?.id,
  });

  const createChartMutation = useMutation({
    mutationFn: async (data: typeof newChart) => {
      return apiRequest("POST", "/api/icu-charts", { ...data, createdBy: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/icu-charts"] });
      setShowCreateDialog(false);
      setNewChart({
        patientId: "",
        patientName: "",
        age: "",
        sex: "",
        bloodGroup: "",
        weight: "",
        diagnosis: "",
        dateOfAdmission: format(new Date(), "yyyy-MM-dd"),
        ward: "ICU",
        bedNo: "",
        chartDate: format(new Date(), "yyyy-MM-dd"),
        admittingConsultant: "",
        icuConsultant: "",
        assignedNurse: "",
      });
      // Refresh dropdowns after chart creation
      refetchPatients();
      refetchBeds();
      toast({ title: "ICU Chart created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create ICU chart", variant: "destructive" });
    },
  });

  const filteredCharts = icuCharts.filter(chart => 
    chart.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chart.bedNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chart.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePatientSelect = (patientId: string) => {
    const patient = admittedPatients.find(p => p.id === patientId);
    if (patient) {
      setNewChart(prev => ({
        ...prev,
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        age: patient.dateOfBirth ? String(Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))) : "",
        sex: patient.gender || "",
        bloodGroup: patient.bloodType || "",
        dateOfAdmission: patient.admissionDate || format(new Date(), "yyyy-MM-dd"),
      }));
    }
  };

  const handleBedSelect = (bedNumber: string) => {
    setNewChart(prev => ({ ...prev, bedNo: bedNumber }));
    // Trigger refresh of available beds after selection
    refetchBeds();
  };

  const handleDoctorSelect = (doctorName: string, field: 'admittingConsultant' | 'icuConsultant') => {
    setNewChart(prev => ({ ...prev, [field]: doctorName }));
  };

  const canEdit = userRole === "DOCTOR" || userRole === "NURSE" || userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  if (selectedChart) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedChart(null)} data-testid="button-back-to-list">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>
          <div>
            <h2 className="text-xl font-bold">{selectedChart.patientName}</h2>
            <p className="text-sm text-muted-foreground">
              Bed: {selectedChart.bedNo} | Chart Date: {selectedChart.chartDate}
            </p>
          </div>
        </div>

        <IcuChartDetail 
          chart={selectedChart} 
          completeData={completeChart}
          canEdit={canEdit}
          userId={userId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack} data-testid="button-back" className="shrink-0">
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
              <span className="truncate">ICU Monitoring</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Comprehensive ICU patient monitoring and charting</p>
          </div>
        </div>

        {canEdit && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-icu-chart">
                <Plus className="w-4 h-4 mr-2" />
                New ICU Chart
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New ICU Chart</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Admitted Patient</Label>
                    <Select onValueChange={handlePatientSelect}>
                      <SelectTrigger data-testid="select-patient">
                        <SelectValue placeholder={admittedPatients.length === 0 ? "No admitted patients" : "Select patient"} />
                      </SelectTrigger>
                      <SelectContent>
                        {admittedPatients.map(patient => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.firstName} {patient.lastName} - {patient.wardType || "Ward"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Chart Date</Label>
                    <Input
                      type="date"
                      value={newChart.chartDate}
                      onChange={e => setNewChart(prev => ({ ...prev, chartDate: e.target.value }))}
                      data-testid="input-chart-date"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input
                      value={newChart.age}
                      onChange={e => setNewChart(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="Age"
                      data-testid="input-age"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sex</Label>
                    <Select value={newChart.sex} onValueChange={v => setNewChart(prev => ({ ...prev, sex: v }))}>
                      <SelectTrigger data-testid="select-sex">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Blood Group</Label>
                    <Select value={newChart.bloodGroup} onValueChange={v => setNewChart(prev => ({ ...prev, bloodGroup: v }))}>
                      <SelectTrigger data-testid="select-blood-group">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                          <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input
                      value={newChart.weight}
                      onChange={e => setNewChart(prev => ({ ...prev, weight: e.target.value }))}
                      placeholder="Weight in kg"
                      data-testid="input-weight"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ICU Bed Number</Label>
                    <Select value={newChart.bedNo} onValueChange={handleBedSelect}>
                      <SelectTrigger data-testid="select-bed-no">
                        <SelectValue placeholder={availableBeds.length === 0 ? "No available ICU beds" : "Select ICU bed"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBeds.map(bed => (
                          <SelectItem key={bed.id} value={bed.bedNumber}>
                            {bed.bedNumber} {bed.hasVentilatorCapability ? "(Ventilator)" : ""} {bed.isIsolationBed ? "(Isolation)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Diagnosis</Label>
                  <Textarea
                    value={newChart.diagnosis}
                    onChange={e => setNewChart(prev => ({ ...prev, diagnosis: e.target.value }))}
                    placeholder="Primary diagnosis"
                    data-testid="textarea-diagnosis"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Admitting Consultant</Label>
                    <Select value={newChart.admittingConsultant} onValueChange={v => handleDoctorSelect(v, 'admittingConsultant')}>
                      <SelectTrigger data-testid="select-admitting-consultant">
                        <SelectValue placeholder={icuDoctors.length === 0 ? "No doctors available" : "Select doctor"} />
                      </SelectTrigger>
                      <SelectContent>
                        {icuDoctors.map(doctor => (
                          <SelectItem key={doctor.id} value={doctor.fullName}>
                            Dr. {doctor.fullName} - {doctor.department || "General"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>ICU Consultant</Label>
                    <Select value={newChart.icuConsultant} onValueChange={v => handleDoctorSelect(v, 'icuConsultant')}>
                      <SelectTrigger data-testid="select-icu-consultant">
                        <SelectValue placeholder={icuDoctors.length === 0 ? "No doctors available" : "Select ICU consultant"} />
                      </SelectTrigger>
                      <SelectContent>
                        {icuDoctors.map(doctor => (
                          <SelectItem key={doctor.id} value={doctor.fullName}>
                            Dr. {doctor.fullName} - {doctor.department || "General"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={() => createChartMutation.mutate(newChart)}
                  disabled={!newChart.patientName || !newChart.chartDate || createChartMutation.isPending}
                  data-testid="button-create-chart"
                >
                  {createChartMutation.isPending ? "Creating..." : "Create ICU Chart"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by patient name, bed number, or diagnosis..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="max-w-md"
          data-testid="input-search-icu"
        />
      </div>

      {chartsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredCharts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No ICU charts found</p>
            {canEdit && (
              <Button className="mt-4" onClick={() => setShowCreateDialog(true)} data-testid="button-create-first">
                Create First ICU Chart
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCharts.map(chart => (
            <Card 
              key={chart.id} 
              className="cursor-pointer hover-elevate"
              onClick={() => setSelectedChart(chart)}
              data-testid={`card-icu-chart-${chart.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{chart.patientName}</CardTitle>
                  <Badge variant="outline">{chart.bedNo}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Chart Date: {chart.chartDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>{chart.age} yrs, {chart.sex}</span>
                  </div>
                  {chart.diagnosis && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Stethoscope className="w-4 h-4 mt-0.5" />
                      <span className="line-clamp-2">{chart.diagnosis}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function IcuChartDetail({ chart, completeData, canEdit, userId }: {
  chart: IcuCharts;
  completeData: any;
  canEdit: boolean;
  userId?: string;
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("vitals");

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Blood Group:</span>
              <span className="ml-2 font-medium">{chart.bloodGroup || "N/A"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Weight:</span>
              <span className="ml-2 font-medium">{chart.weight || "N/A"} kg</span>
            </div>
            <div>
              <span className="text-muted-foreground">ICU Consultant:</span>
              <span className="ml-2 font-medium">{chart.icuConsultant || "N/A"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Admission Date:</span>
              <span className="ml-2 font-medium">{chart.dateOfAdmission || "N/A"}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <ScrollArea className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="vitals" className="gap-1" data-testid="tab-vitals">
                <Heart className="w-3 h-3" /> Vitals
              </TabsTrigger>
              <TabsTrigger value="ventilator" className="gap-1" data-testid="tab-ventilator">
                <Wind className="w-3 h-3" /> Ventilator
              </TabsTrigger>
              <TabsTrigger value="hemodynamic" className="gap-1" data-testid="tab-hemodynamic">
                <Activity className="w-3 h-3" /> Hemodynamic
              </TabsTrigger>
              <TabsTrigger value="fluid" className="gap-1" data-testid="tab-fluid">
                <Droplets className="w-3 h-3" /> I/O Balance
              </TabsTrigger>
              <TabsTrigger value="medications" className="gap-1" data-testid="tab-medications">
                <Pill className="w-3 h-3" /> Medications
              </TabsTrigger>
              <TabsTrigger value="labs" className="gap-1" data-testid="tab-labs">
                <FlaskConical className="w-3 h-3" /> Labs/ABG
              </TabsTrigger>
              <TabsTrigger value="nursing" className="gap-1" data-testid="tab-nursing">
                <ClipboardList className="w-3 h-3" /> Nursing
              </TabsTrigger>
              <TabsTrigger value="body" className="gap-1" data-testid="tab-body">
                <User className="w-3 h-3" /> Body Chart
              </TabsTrigger>
              <TabsTrigger value="tests" className="gap-1" data-testid="tab-tests">
                <Beaker className="w-3 h-3" /> Tests
              </TabsTrigger>
            </TabsList>
          </ScrollArea>

          <TabsContent value="vitals" className="mt-4">
            <VitalsSection chartId={chart.id} data={completeData?.vitalCharts || []} canEdit={canEdit} userId={userId} />
          </TabsContent>

          <TabsContent value="ventilator" className="mt-4">
            <VentilatorSection chartId={chart.id} data={completeData?.ventilator || []} canEdit={canEdit} userId={userId} />
          </TabsContent>

          <TabsContent value="hemodynamic" className="mt-4">
            <HemodynamicSection chartId={chart.id} data={completeData?.hemodynamic || []} canEdit={canEdit} userId={userId} />
          </TabsContent>

          <TabsContent value="fluid" className="mt-4">
            <FluidBalanceSection 
              chartId={chart.id} 
              intakeData={completeData?.intakeChart || []} 
              outputData={completeData?.outputChart || []}
              targetData={completeData?.fluidBalanceTarget}
              canEdit={canEdit} 
              userId={userId} 
            />
          </TabsContent>

          <TabsContent value="medications" className="mt-4">
            <MedicationsSection 
              chartId={chart.id} 
              ordersData={completeData?.medicationOrders || []}
              onceOnlyData={completeData?.onceOnlyDrugs || []}
              canEdit={canEdit} 
              userId={userId} 
            />
          </TabsContent>

          <TabsContent value="labs" className="mt-4">
            <LabsSection 
              chartId={chart.id} 
              abgData={completeData?.abgReports || []}
              investigationsData={completeData?.dailyInvestigations}
              diabeticData={completeData?.diabeticChart || []}
              canEdit={canEdit} 
              userId={userId} 
            />
          </TabsContent>

          <TabsContent value="nursing" className="mt-4">
            <NursingSection 
              chartId={chart.id} 
              remarksData={completeData?.nursingRemarks || []}
              dutyData={completeData?.nursingDuty || []}
              diaryData={completeData?.nurseDiary || []}
              canEdit={canEdit} 
              userId={userId} 
            />
          </TabsContent>

          <TabsContent value="body" className="mt-4">
            <BodyChartSection 
              chartId={chart.id} 
              markingsData={completeData?.bodyMarkings || []}
              allergyData={completeData?.allergyPrecautions}
              canEdit={canEdit} 
              userId={userId} 
            />
          </TabsContent>

          <TabsContent value="tests" className="mt-4">
            <TestsSection 
              chartId={chart.id}
              patientId={chart.patientId || ""}
              patientName={chart.patientName || ""}
              canEdit={canEdit}
              userId={userId}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function VitalsSection({ chartId, data, canEdit, userId }: { chartId: string; data: any[]; canEdit: boolean; userId?: string }) {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    hour: "",
    temperature: "",
    pulse: "",
    bp: "",
    respiratoryRate: "",
    spo2: "",
    cvp: "",
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/icu-charts/${chartId}/vitals`, { ...newEntry, recordedBy: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/icu-charts", chartId, "complete"] });
      setShowAddForm(false);
      setNewEntry({ hour: "", temperature: "", pulse: "", bp: "", respiratoryRate: "", spo2: "", cvp: "" });
      toast({ title: "Vital signs recorded" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: string }) => {
      return apiRequest("PATCH", `/api/icu-vitals/${id}`, { [field]: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/icu-charts", chartId, "complete"] });
      toast({ title: "Vital updated" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-500" />
          Vital Signs (24-hour Chart)
        </h3>
        {canEdit && (
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} data-testid="button-add-vitals">
            <Plus className="w-4 h-4 mr-1" />
            Record Vitals
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Time</Label>
              <Select value={newEntry.hour} onValueChange={v => setNewEntry(prev => ({ ...prev, hour: v }))}>
                <SelectTrigger data-testid="select-vitals-hour">
                  <SelectValue placeholder="Select hour" />
                </SelectTrigger>
                <SelectContent>
                  {HOURS_24.map(h => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Temp (°F)</Label>
              <Input
                value={newEntry.temperature}
                onChange={e => setNewEntry(prev => ({ ...prev, temperature: e.target.value }))}
                placeholder="98.6"
                data-testid="input-vitals-temp"
              />
            </div>
            <div className="space-y-2">
              <Label>Pulse (bpm)</Label>
              <Input
                value={newEntry.pulse}
                onChange={e => setNewEntry(prev => ({ ...prev, pulse: e.target.value }))}
                placeholder="72"
                data-testid="input-vitals-pulse"
              />
            </div>
            <div className="space-y-2">
              <Label>BP (mmHg)</Label>
              <Input
                value={newEntry.bp}
                onChange={e => setNewEntry(prev => ({ ...prev, bp: e.target.value }))}
                placeholder="120/80"
                data-testid="input-vitals-bp"
              />
            </div>
            <div className="space-y-2">
              <Label>RR (/min)</Label>
              <Input
                value={newEntry.respiratoryRate}
                onChange={e => setNewEntry(prev => ({ ...prev, respiratoryRate: e.target.value }))}
                placeholder="16"
                data-testid="input-vitals-rr"
              />
            </div>
            <div className="space-y-2">
              <Label>SpO2 (%)</Label>
              <Input
                value={newEntry.spo2}
                onChange={e => setNewEntry(prev => ({ ...prev, spo2: e.target.value }))}
                placeholder="98"
                data-testid="input-vitals-spo2"
              />
            </div>
            <div className="space-y-2">
              <Label>CVP (cmH2O)</Label>
              <Input
                value={newEntry.cvp}
                onChange={e => setNewEntry(prev => ({ ...prev, cvp: e.target.value }))}
                placeholder="8"
                data-testid="input-vitals-cvp"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => addMutation.mutate()} disabled={!newEntry.hour || addMutation.isPending} data-testid="button-save-vitals">
                Save
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-muted">
              <th className="border p-2 text-left">Time</th>
              <th className="border p-2">Temp</th>
              <th className="border p-2">Pulse</th>
              <th className="border p-2">BP</th>
              <th className="border p-2">RR</th>
              <th className="border p-2">SpO2</th>
              <th className="border p-2">CVP</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="border p-4 text-center text-muted-foreground">
                  No vital signs recorded. {canEdit && "Click 'Record Vitals' to add data."}
                </td>
              </tr>
            ) : (
              data.map((entry: any) => (
                <tr key={entry.id}>
                  <td className="border p-2 font-medium">{entry.hour}</td>
                  <td className="border p-2 text-center">
                    <EditableCell value={entry.temperature} canEdit={canEdit} onSave={(v) => updateMutation.mutate({ id: entry.id, field: "temperature", value: v })} />
                  </td>
                  <td className="border p-2 text-center">
                    <EditableCell value={entry.pulse} canEdit={canEdit} onSave={(v) => updateMutation.mutate({ id: entry.id, field: "pulse", value: v })} />
                  </td>
                  <td className="border p-2 text-center">
                    <EditableCell value={entry.bp} canEdit={canEdit} onSave={(v) => updateMutation.mutate({ id: entry.id, field: "bp", value: v })} />
                  </td>
                  <td className="border p-2 text-center">
                    <EditableCell value={entry.respiratoryRate} canEdit={canEdit} onSave={(v) => updateMutation.mutate({ id: entry.id, field: "respiratoryRate", value: v })} />
                  </td>
                  <td className="border p-2 text-center">
                    <EditableCell value={entry.spo2} canEdit={canEdit} onSave={(v) => updateMutation.mutate({ id: entry.id, field: "spo2", value: v })} />
                  </td>
                  <td className="border p-2 text-center">
                    <EditableCell value={entry.cvp} canEdit={canEdit} onSave={(v) => updateMutation.mutate({ id: entry.id, field: "cvp", value: v })} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VentilatorSection({ chartId, data, canEdit, userId }: { chartId: string; data: any[]; canEdit: boolean; userId?: string }) {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    time: "",
    mode: "",
    fio2: "",
    setTidalVolume: "",
    respRatePerMin: "",
    peepCpap: "",
    pressureSupport: "",
    ieRatio: "",
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/icu-charts/${chartId}/ventilator`, { ...newEntry, recordedBy: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/icu-charts", chartId, "complete"] });
      setShowAddForm(false);
      setNewEntry({ time: "", mode: "", fio2: "", setTidalVolume: "", respRatePerMin: "", peepCpap: "", pressureSupport: "", ieRatio: "" });
      toast({ title: "Ventilator settings recorded" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: string }) => {
      return apiRequest("PATCH", `/api/icu-ventilator/${id}`, { [field]: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/icu-charts", chartId, "complete"] });
      toast({ title: "Ventilator setting updated" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Wind className="w-4 h-4 text-blue-500" />
          Ventilator Parameters
        </h3>
        {canEdit && (
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} data-testid="button-add-ventilator">
            <Plus className="w-4 h-4 mr-1" />
            Record Settings
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Time</Label>
              <Select value={newEntry.time} onValueChange={v => setNewEntry(prev => ({ ...prev, time: v }))}>
                <SelectTrigger data-testid="select-vent-time">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {HOURS_24.map(h => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select value={newEntry.mode} onValueChange={v => setNewEntry(prev => ({ ...prev, mode: v }))}>
                <SelectTrigger data-testid="select-vent-mode">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {["CMV", "SIMV", "PSV", "CPAP", "BiPAP", "PCV", "VCV"].map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>FiO2 (%)</Label>
              <Input
                value={newEntry.fio2}
                onChange={e => setNewEntry(prev => ({ ...prev, fio2: e.target.value }))}
                placeholder="40"
                data-testid="input-vent-fio2"
              />
            </div>
            <div className="space-y-2">
              <Label>Tidal Vol (mL)</Label>
              <Input
                value={newEntry.setTidalVolume}
                onChange={e => setNewEntry(prev => ({ ...prev, setTidalVolume: e.target.value }))}
                placeholder="500"
                data-testid="input-vent-tv"
              />
            </div>
            <div className="space-y-2">
              <Label>RR (/min)</Label>
              <Input
                value={newEntry.respRatePerMin}
                onChange={e => setNewEntry(prev => ({ ...prev, respRatePerMin: e.target.value }))}
                placeholder="12"
                data-testid="input-vent-rr"
              />
            </div>
            <div className="space-y-2">
              <Label>PEEP/CPAP</Label>
              <Input
                value={newEntry.peepCpap}
                onChange={e => setNewEntry(prev => ({ ...prev, peepCpap: e.target.value }))}
                placeholder="5"
                data-testid="input-vent-peep"
              />
            </div>
            <div className="space-y-2">
              <Label>PS</Label>
              <Input
                value={newEntry.pressureSupport}
                onChange={e => setNewEntry(prev => ({ ...prev, pressureSupport: e.target.value }))}
                placeholder="10"
                data-testid="input-vent-ps"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => addMutation.mutate()} disabled={!newEntry.time || addMutation.isPending} data-testid="button-save-vent">
                Save
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-muted">
              <th className="border p-2 text-left">Time</th>
              <th className="border p-2">Mode</th>
              <th className="border p-2">FiO2</th>
              <th className="border p-2">TV</th>
              <th className="border p-2">RR</th>
              <th className="border p-2">PEEP</th>
              <th className="border p-2">PS</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="border p-4 text-center text-muted-foreground">
                  No ventilator settings recorded. {canEdit && "Click 'Record Settings' to add data."}
                </td>
              </tr>
            ) : (
              data.map((entry: any) => (
                <tr key={entry.id}>
                  <td className="border p-2 font-medium">{entry.time}</td>
                  <td className="border p-2 text-center">
                    <EditableCell value={entry.mode} canEdit={canEdit} onSave={(v) => updateMutation.mutate({ id: entry.id, field: "mode", value: v })} />
                  </td>
                  <td className="border p-2 text-center">
                    <EditableCell value={entry.fio2} canEdit={canEdit} onSave={(v) => updateMutation.mutate({ id: entry.id, field: "fio2", value: v })} />
                  </td>
                  <td className="border p-2 text-center">
                    <EditableCell value={entry.setTidalVolume} canEdit={canEdit} onSave={(v) => updateMutation.mutate({ id: entry.id, field: "setTidalVolume", value: v })} />
                  </td>
                  <td className="border p-2 text-center">
                    <EditableCell value={entry.respRatePerMin} canEdit={canEdit} onSave={(v) => updateMutation.mutate({ id: entry.id, field: "respRatePerMin", value: v })} />
                  </td>
                  <td className="border p-2 text-center">
                    <EditableCell value={entry.peepCpap} canEdit={canEdit} onSave={(v) => updateMutation.mutate({ id: entry.id, field: "peepCpap", value: v })} />
                  </td>
                  <td className="border p-2 text-center">
                    <EditableCell value={entry.pressureSupport} canEdit={canEdit} onSave={(v) => updateMutation.mutate({ id: entry.id, field: "pressureSupport", value: v })} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HemodynamicSection({ chartId, data, canEdit, userId }: { chartId: string; data: any[]; canEdit: boolean; userId?: string }) {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    time: "",
    heartRate: "",
    map: "",
    cvp: "",
    inotropeName: "",
    inotropeDose: "",
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/icu-charts/${chartId}/hemodynamic`, { ...newEntry, recordedBy: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/icu-charts", chartId, "complete"] });
      setShowAddForm(false);
      setNewEntry({ time: "", heartRate: "", map: "", cvp: "", inotropeName: "", inotropeDose: "" });
      toast({ title: "Hemodynamic data recorded" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: string }) => {
      return apiRequest("PATCH", `/api/icu-hemodynamic/${id}`, { [field]: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/icu-charts", chartId, "complete"] });
      toast({ title: "Hemodynamic data updated" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-500" />
          Hemodynamic Monitoring
        </h3>
        {canEdit && (
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} data-testid="button-add-hemo">
            <Plus className="w-4 h-4 mr-1" />
            Record Data
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Time</Label>
              <Select value={newEntry.time} onValueChange={v => setNewEntry(prev => ({ ...prev, time: v }))}>
                <SelectTrigger data-testid="select-hemo-time">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {HOURS_24.map(h => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Heart Rate</Label>
              <Input
                value={newEntry.heartRate}
                onChange={e => setNewEntry(prev => ({ ...prev, heartRate: e.target.value }))}
                placeholder="72"
                data-testid="input-hemo-hr"
              />
            </div>
            <div className="space-y-2">
              <Label>MAP (mmHg)</Label>
              <Input
                value={newEntry.map}
                onChange={e => setNewEntry(prev => ({ ...prev, map: e.target.value }))}
                placeholder="85"
                data-testid="input-hemo-map"
              />
            </div>
            <div className="space-y-2">
              <Label>CVP</Label>
              <Input
                value={newEntry.cvp}
                onChange={e => setNewEntry(prev => ({ ...prev, cvp: e.target.value }))}
                placeholder="8"
                data-testid="input-hemo-cvp"
              />
            </div>
            <div className="space-y-2">
              <Label>Inotrope</Label>
              <Input
                value={newEntry.inotropeName}
                onChange={e => setNewEntry(prev => ({ ...prev, inotropeName: e.target.value }))}
                placeholder="Noradrenaline"
                data-testid="input-hemo-inotrope"
              />
            </div>
            <div className="space-y-2">
              <Label>Dose</Label>
              <Input
                value={newEntry.inotropeDose}
                onChange={e => setNewEntry(prev => ({ ...prev, inotropeDose: e.target.value }))}
                placeholder="0.1 mcg/kg/min"
                data-testid="input-hemo-dose"
              />
            </div>
          </div>
          <Button className="mt-4" onClick={() => addMutation.mutate()} disabled={!newEntry.time || addMutation.isPending} data-testid="button-save-hemo">
            Save
          </Button>
        </Card>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-muted">
              <th className="border p-2 text-left">Time</th>
              <th className="border p-2">HR</th>
              <th className="border p-2">MAP</th>
              <th className="border p-2">CVP</th>
              <th className="border p-2">Inotrope</th>
              <th className="border p-2">Dose</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="border p-4 text-center text-muted-foreground">
                  No hemodynamic data recorded. {canEdit && "Click 'Record Data' to add data."}
                </td>
              </tr>
            ) : (
              data.map((entry: any) => (
                <tr key={entry.id}>
                  <td className="border p-2 font-medium">{entry.time}</td>
                  <td className="border p-2 text-center">
                    <EditableCell value={entry.heartRate} canEdit={canEdit} onSave={(v) => updateMutation.mutate({ id: entry.id, field: "heartRate", value: v })} />
                  </td>
                  <td className="border p-2 text-center">
                    <EditableCell value={entry.map} canEdit={canEdit} onSave={(v) => updateMutation.mutate({ id: entry.id, field: "map", value: v })} />
                  </td>
                  <td className="border p-2 text-center">
                    <EditableCell value={entry.cvp} canEdit={canEdit} onSave={(v) => updateMutation.mutate({ id: entry.id, field: "cvp", value: v })} />
                  </td>
                  <td className="border p-2 text-center">
                    <EditableCell value={entry.inotropeName} canEdit={canEdit} onSave={(v) => updateMutation.mutate({ id: entry.id, field: "inotropeName", value: v })} />
                  </td>
                  <td className="border p-2 text-center">
                    <EditableCell value={entry.inotropeDose} canEdit={canEdit} onSave={(v) => updateMutation.mutate({ id: entry.id, field: "inotropeDose", value: v })} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FluidBalanceSection({ chartId, intakeData, outputData, targetData, canEdit, userId }: { 
  chartId: string; 
  intakeData: any[]; 
  outputData: any[]; 
  targetData: any;
  canEdit: boolean; 
  userId?: string 
}) {
  const totalIntake = intakeData.reduce((sum, e) => sum + (parseFloat(e.totalIntake) || 0), 0);
  const totalOutput = outputData.reduce((sum, e) => sum + (parseFloat(e.totalOutput) || 0), 0);
  const balance = totalIntake - totalOutput;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Droplets className="w-4 h-4 text-cyan-500" />
        24-Hour Fluid Balance
      </h3>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-sm text-muted-foreground">Total Intake</div>
          <div className="text-2xl font-bold text-green-600">{totalIntake} mL</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-muted-foreground">Total Output</div>
          <div className="text-2xl font-bold text-red-600">{totalOutput} mL</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-muted-foreground">Net Balance</div>
          <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {balance >= 0 ? '+' : ''}{balance} mL
          </div>
        </Card>
      </div>

      {targetData && (
        <Card className="p-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>Target Intake: <span className="font-medium">{targetData.targetIntake || "Not set"}</span></div>
            <div>Target Output: <span className="font-medium">{targetData.targetOutput || "Not set"}</span></div>
            <div>Goal: <span className="font-medium">{targetData.netBalanceGoal || "Not set"}</span></div>
          </div>
        </Card>
      )}

      <div className="text-sm text-muted-foreground">
        Detailed hourly intake/output records can be added via the monitoring forms.
      </div>
    </div>
  );
}

function MedicationsSection({ chartId, ordersData, onceOnlyData, canEdit, userId }: { 
  chartId: string; 
  ordersData: any[]; 
  onceOnlyData: any[];
  canEdit: boolean; 
  userId?: string 
}) {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOrder, setNewOrder] = useState({
    drugName: "",
    dose: "",
    route: "",
    frequency: "",
    time: "",
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/icu-charts/${chartId}/medication-orders`, { ...newOrder, doctorId: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/icu-charts", chartId, "complete"] });
      setShowAddForm(false);
      setNewOrder({ drugName: "", dose: "", route: "", frequency: "", time: "" });
      toast({ title: "Medication order added" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: string }) => {
      return apiRequest("PATCH", `/api/icu-medication/${id}`, { [field]: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/icu-charts", chartId, "complete"] });
      toast({ title: "Medication order updated" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Pill className="w-4 h-4 text-orange-500" />
            Doctor's Medication Orders
          </h3>
          {canEdit && (
            <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} data-testid="button-add-med">
              <Plus className="w-4 h-4 mr-1" />
              Add Order
            </Button>
          )}
        </div>

        {showAddForm && (
          <Card className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Drug Name</Label>
                <Input
                  value={newOrder.drugName}
                  onChange={e => setNewOrder(prev => ({ ...prev, drugName: e.target.value }))}
                  placeholder="Drug name"
                  data-testid="input-med-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Dose</Label>
                <Input
                  value={newOrder.dose}
                  onChange={e => setNewOrder(prev => ({ ...prev, dose: e.target.value }))}
                  placeholder="e.g., 500mg"
                  data-testid="input-med-dose"
                />
              </div>
              <div className="space-y-2">
                <Label>Route</Label>
                <Select value={newOrder.route} onValueChange={v => setNewOrder(prev => ({ ...prev, route: v }))}>
                  <SelectTrigger data-testid="select-med-route">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {["IV", "IM", "SC", "PO", "Oral", "Topical", "Inhalation"].map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={newOrder.frequency} onValueChange={v => setNewOrder(prev => ({ ...prev, frequency: v }))}>
                  <SelectTrigger data-testid="select-med-freq">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {["OD", "BD", "TDS", "QID", "Q4H", "Q6H", "Q8H", "Q12H", "PRN", "STAT"].map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={() => addMutation.mutate()} disabled={!newOrder.drugName || addMutation.isPending} data-testid="button-save-med">
                  Save
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2 text-left">Sr</th>
                <th className="border p-2 text-left">Drug Name</th>
                <th className="border p-2">Dose</th>
                <th className="border p-2">Route</th>
                <th className="border p-2">Frequency</th>
              </tr>
            </thead>
            <tbody>
              {ordersData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="border p-4 text-center text-muted-foreground">
                    No medication orders. {canEdit && "Click 'Add Order' to add medications."}
                  </td>
                </tr>
              ) : (
                ordersData.map((order: any, idx: number) => (
                  <tr key={order.id}>
                    <td className="border p-2">{idx + 1}</td>
                    <td className="border p-2 font-medium">
                      <EditableCell value={order.drugName} canEdit={canEdit} onSave={(v) => updateMutation.mutate({ id: order.id, field: "drugName", value: v })} />
                    </td>
                    <td className="border p-2 text-center">
                      <EditableCell value={order.dose} canEdit={canEdit} onSave={(v) => updateMutation.mutate({ id: order.id, field: "dose", value: v })} />
                    </td>
                    <td className="border p-2 text-center">
                      <EditableCell value={order.route} canEdit={canEdit} onSave={(v) => updateMutation.mutate({ id: order.id, field: "route", value: v })} />
                    </td>
                    <td className="border p-2 text-center">
                      <EditableCell value={order.frequency} canEdit={canEdit} onSave={(v) => updateMutation.mutate({ id: order.id, field: "frequency", value: v })} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Syringe className="w-4 h-4" />
          Once Only / STAT Drugs
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2 text-left">Drug</th>
                <th className="border p-2">Dose</th>
                <th className="border p-2">Route</th>
                <th className="border p-2">Ordered Time</th>
                <th className="border p-2">Given Time</th>
              </tr>
            </thead>
            <tbody>
              {onceOnlyData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="border p-4 text-center text-muted-foreground">
                    No STAT orders
                  </td>
                </tr>
              ) : (
                onceOnlyData.map((drug: any) => (
                  <tr key={drug.id}>
                    <td className="border p-2 font-medium">{drug.drugName}</td>
                    <td className="border p-2 text-center">{drug.dose || "-"}</td>
                    <td className="border p-2 text-center">{drug.route || "-"}</td>
                    <td className="border p-2 text-center">{drug.time || "-"}</td>
                    <td className="border p-2 text-center">{drug.timeGiven || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LabsSection({ chartId, abgData, investigationsData, diabeticData, canEdit, userId }: { 
  chartId: string; 
  abgData: any[]; 
  investigationsData: any;
  diabeticData: any[];
  canEdit: boolean; 
  userId?: string 
}) {
  const { toast } = useToast();
  
  const updateAbgMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: string }) => {
      return apiRequest("PATCH", `/api/icu-abg/${id}`, { [field]: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/icu-charts", chartId, "complete"] });
      toast({ title: "ABG data updated" });
    },
  });

  const updateDiabeticMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: string }) => {
      return apiRequest("PATCH", `/api/icu-diabetic/${id}`, { [field]: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/icu-charts", chartId, "complete"] });
      toast({ title: "Diabetic chart updated" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-emerald-500" />
          ABG Reports
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2 text-left">Time</th>
                <th className="border p-2">pH</th>
                <th className="border p-2">pCO2</th>
                <th className="border p-2">pO2</th>
                <th className="border p-2">BE</th>
                <th className="border p-2">SaO2</th>
                <th className="border p-2">Lactate</th>
              </tr>
            </thead>
            <tbody>
              {abgData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border p-4 text-center text-muted-foreground">
                    No ABG reports recorded.
                  </td>
                </tr>
              ) : (
                abgData.map((entry: any) => (
                  <tr key={entry.id}>
                    <td className="border p-2 font-medium">{entry.time}</td>
                    <td className="border p-2 text-center">
                      <EditableCell value={entry.ph} canEdit={canEdit} onSave={(v) => updateAbgMutation.mutate({ id: entry.id, field: "ph", value: v })} />
                    </td>
                    <td className="border p-2 text-center">
                      <EditableCell value={entry.pco2} canEdit={canEdit} onSave={(v) => updateAbgMutation.mutate({ id: entry.id, field: "pco2", value: v })} />
                    </td>
                    <td className="border p-2 text-center">
                      <EditableCell value={entry.po2} canEdit={canEdit} onSave={(v) => updateAbgMutation.mutate({ id: entry.id, field: "po2", value: v })} />
                    </td>
                    <td className="border p-2 text-center">
                      <EditableCell value={entry.be} canEdit={canEdit} onSave={(v) => updateAbgMutation.mutate({ id: entry.id, field: "be", value: v })} />
                    </td>
                    <td className="border p-2 text-center">
                      <EditableCell value={entry.sao2} canEdit={canEdit} onSave={(v) => updateAbgMutation.mutate({ id: entry.id, field: "sao2", value: v })} />
                    </td>
                    <td className="border p-2 text-center">
                      <EditableCell value={entry.lactate} canEdit={canEdit} onSave={(v) => updateAbgMutation.mutate({ id: entry.id, field: "lactate", value: v })} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Beaker className="w-4 h-4" />
          Daily Investigations
        </h4>
        {investigationsData ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-2 bg-muted rounded">Hb: <span className="font-medium">{investigationsData.hb || "-"}</span></div>
            <div className="p-2 bg-muted rounded">WBC: <span className="font-medium">{investigationsData.wbc || "-"}</span></div>
            <div className="p-2 bg-muted rounded">Creatinine: <span className="font-medium">{investigationsData.creatinine || "-"}</span></div>
            <div className="p-2 bg-muted rounded">Urea: <span className="font-medium">{investigationsData.urea || "-"}</span></div>
            <div className="p-2 bg-muted rounded">Electrolytes: <span className="font-medium">{investigationsData.electrolytes || "-"}</span></div>
            <div className="p-2 bg-muted rounded">BSL: <span className="font-medium">{investigationsData.bsl || "-"}</span></div>
            <div className="p-2 bg-muted rounded">LFTs: <span className="font-medium">{investigationsData.lfts || "-"}</span></div>
            <div className="p-2 bg-muted rounded">PT/APTT: <span className="font-medium">{investigationsData.ptAptt || "-"}</span></div>
          </div>
        ) : (
          <p className="text-muted-foreground">No investigations recorded</p>
        )}
      </div>

      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Scale className="w-4 h-4" />
          Diabetic Flow Chart
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2 text-left">Time</th>
                <th className="border p-2">BSL</th>
                <th className="border p-2">Insulin</th>
                <th className="border p-2">Na</th>
                <th className="border p-2">K</th>
                <th className="border p-2">Cl</th>
              </tr>
            </thead>
            <tbody>
              {diabeticData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border p-4 text-center text-muted-foreground">
                    No diabetic chart entries recorded.
                  </td>
                </tr>
              ) : (
                diabeticData.map((entry: any) => (
                  <tr key={entry.id}>
                    <td className="border p-2 font-medium">{entry.time}</td>
                    <td className="border p-2 text-center">
                      <EditableCell value={entry.bsl} canEdit={canEdit} onSave={(v) => updateDiabeticMutation.mutate({ id: entry.id, field: "bsl", value: v })} />
                    </td>
                    <td className="border p-2 text-center">
                      <EditableCell value={entry.insulin} canEdit={canEdit} onSave={(v) => updateDiabeticMutation.mutate({ id: entry.id, field: "insulin", value: v })} />
                    </td>
                    <td className="border p-2 text-center">
                      <EditableCell value={entry.na} canEdit={canEdit} onSave={(v) => updateDiabeticMutation.mutate({ id: entry.id, field: "na", value: v })} />
                    </td>
                    <td className="border p-2 text-center">
                      <EditableCell value={entry.k} canEdit={canEdit} onSave={(v) => updateDiabeticMutation.mutate({ id: entry.id, field: "k", value: v })} />
                    </td>
                    <td className="border p-2 text-center">
                      <EditableCell value={entry.cl} canEdit={canEdit} onSave={(v) => updateDiabeticMutation.mutate({ id: entry.id, field: "cl", value: v })} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NursingSection({ chartId, remarksData, dutyData, diaryData, canEdit, userId }: { 
  chartId: string; 
  remarksData: any[]; 
  dutyData: any[];
  diaryData: any[];
  canEdit: boolean; 
  userId?: string 
}) {
  const { toast } = useToast();
  const [showAddRemark, setShowAddRemark] = useState(false);
  const [newRemark, setNewRemark] = useState({ time: "", remarks: "" });

  const addRemarkMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/icu-charts/${chartId}/nursing-remarks`, { ...newRemark, nurseId: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/icu-charts", chartId, "complete"] });
      setShowAddRemark(false);
      setNewRemark({ time: "", remarks: "" });
      toast({ title: "Nursing remark added" });
    },
  });

  const updateRemarkMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: string }) => {
      return apiRequest("PATCH", `/api/icu-nursing-remark/${id}`, { [field]: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/icu-charts", chartId, "complete"] });
      toast({ title: "Nursing remark updated" });
    },
  });

  const updateDiaryMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: string }) => {
      return apiRequest("PATCH", `/api/icu-nurse-diary/${id}`, { [field]: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/icu-charts", chartId, "complete"] });
      toast({ title: "Diary entry updated" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-pink-500" />
            Nursing Remarks
          </h3>
          {canEdit && (
            <Button size="sm" onClick={() => setShowAddRemark(!showAddRemark)} data-testid="button-add-remark">
              <Plus className="w-4 h-4 mr-1" />
              Add Remark
            </Button>
          )}
        </div>

        {showAddRemark && (
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Time</Label>
                <Select value={newRemark.time} onValueChange={v => setNewRemark(prev => ({ ...prev, time: v }))}>
                  <SelectTrigger data-testid="select-remark-time">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS_24.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Remarks</Label>
                <Textarea
                  value={newRemark.remarks}
                  onChange={e => setNewRemark(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Nursing observations..."
                  data-testid="textarea-remark"
                />
              </div>
            </div>
            <Button className="mt-4" onClick={() => addRemarkMutation.mutate()} disabled={!newRemark.time || !newRemark.remarks || addRemarkMutation.isPending} data-testid="button-save-remark">
              Save
            </Button>
          </Card>
        )}

        <div className="space-y-2">
          {remarksData.length === 0 ? (
            <p className="text-muted-foreground">No nursing remarks. {canEdit && "Click 'Add Remark' to record observations."}</p>
          ) : (
            remarksData.map((remark: any) => (
              <Card key={remark.id} className="p-3">
                <div className="flex items-start gap-2">
                  <Badge variant="outline">{remark.time}</Badge>
                  <div className="flex-1 text-sm">
                    <EditableCell value={remark.remarks} canEdit={canEdit} onSave={(v) => updateRemarkMutation.mutate({ id: remark.id, field: "remarks", value: v })} />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Users className="w-4 h-4" />
          Sisters on Duty
        </h4>
        <div className="grid grid-cols-3 gap-4">
          {["Morning", "Evening", "Night"].map(shift => {
            const duty = dutyData.find((d: any) => d.shift === shift);
            return (
              <Card key={shift} className="p-3">
                <div className="text-sm text-muted-foreground">{shift} Shift</div>
                <div className="font-medium">{duty?.name || "Not assigned"}</div>
                {duty?.empNo && <div className="text-xs text-muted-foreground">ID: {duty.empNo}</div>}
              </Card>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Nurse Diary (Important Events)
        </h4>
        <div className="space-y-2">
          {diaryData.length === 0 ? (
            <p className="text-muted-foreground">No diary entries recorded.</p>
          ) : (
            diaryData.map((entry: any) => (
              <Card key={entry.id} className="p-3">
                <div className="flex items-start gap-2">
                  <Badge variant="secondary">{entry.time}</Badge>
                  <div className="flex-1 text-sm">
                    <EditableCell value={entry.eventDescription} canEdit={canEdit} onSave={(v) => updateDiaryMutation.mutate({ id: entry.id, field: "eventDescription", value: v })} />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function BodyChartSection({ chartId, markingsData, allergyData, canEdit, userId }: { 
  chartId: string; 
  markingsData: any[]; 
  allergyData: any;
  canEdit: boolean; 
  userId?: string 
}) {
  const { toast } = useToast();
  const [selectedMarker, setSelectedMarker] = useState<{x: number; y: number} | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMarking, setNewMarking] = useState({ markedArea: "", typeOfInjury: "", grade: "" });
  const imgContainerRef = React.useRef<HTMLDivElement>(null);
  
  const updateMarkingMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: string }) => {
      return apiRequest("PATCH", `/api/icu-body-marking/${id}`, { [field]: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/icu-charts", chartId, "complete"] });
      toast({ title: "Body marking updated" });
    },
  });

  const addMarkingMutation = useMutation({
    mutationFn: async (data: { chartId: string; markedArea: string; typeOfInjury: string; grade: string; positionX: number; positionY: number }) => {
      return apiRequest("POST", `/api/icu-body-marking`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/icu-charts", chartId, "complete"] });
      toast({ title: "Body marking added successfully" });
      setSelectedMarker(null);
      setShowAddDialog(false);
      setNewMarking({ markedArea: "", typeOfInjury: "", grade: "" });
    },
    onError: () => {
      toast({ title: "Failed to add body marking", variant: "destructive" });
    }
  });

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canEdit) return;
    
    const container = imgContainerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setSelectedMarker({ x, y });
    setShowAddDialog(true);
  };

  const handleSaveMarking = () => {
    if (!selectedMarker || !newMarking.markedArea) {
      toast({ title: "Please enter the marked area", variant: "destructive" });
      return;
    }
    
    addMarkingMutation.mutate({
      chartId,
      markedArea: newMarking.markedArea,
      typeOfInjury: newMarking.typeOfInjury || "Pressure Sore",
      grade: newMarking.grade || "1",
      positionX: selectedMarker.x,
      positionY: selectedMarker.y
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-500" />
          Body Marking / Pressure Sore Chart
        </h3>
        {canEdit && (
          <p className="text-sm text-muted-foreground">Click on the body diagram to add a marking</p>
        )}
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex justify-center">
            <div 
              ref={imgContainerRef}
              onClick={handleImageClick}
              className={`relative max-h-80 border rounded-lg p-2 ${canEdit ? 'cursor-crosshair hover:border-primary' : ''}`}
              style={{ width: 'fit-content' }}
            >
              <img 
                src="/body-diagram.png" 
                alt="Body diagram for marking pressure sores" 
                className="max-h-72 object-contain pointer-events-none select-none"
                draggable={false}
              />
              {selectedMarker && (
                <div 
                  className="absolute w-5 h-5 bg-red-500 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 animate-pulse z-10"
                  style={{ left: `${selectedMarker.x}%`, top: `${selectedMarker.y}%` }}
                />
              )}
              {markingsData.map((marking: any, index: number) => (
                marking.positionX !== undefined && marking.positionY !== undefined && (
                  <div 
                    key={marking.id || index}
                    className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2 z-10 hover:scale-125 transition-transform"
                    style={{ left: `${marking.positionX}%`, top: `${marking.positionY}%` }}
                    title={`${marking.markedArea}: ${marking.typeOfInjury} (Grade ${marking.grade})`}
                  />
                )
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium">Recorded Markings</h4>
            {markingsData.length === 0 ? (
              <p className="text-muted-foreground">No body markings recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border p-2 text-left">Area</th>
                      <th className="border p-2">Type</th>
                      <th className="border p-2">Grade</th>
                      <th className="border p-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {markingsData.map((marking: any) => (
                      <tr key={marking.id}>
                        <td className="border p-2">
                          <EditableCell value={marking.markedArea} canEdit={canEdit} onSave={(v) => updateMarkingMutation.mutate({ id: marking.id, field: "markedArea", value: v })} />
                        </td>
                        <td className="border p-2 text-center">
                          <EditableCell value={marking.typeOfInjury} canEdit={canEdit} onSave={(v) => updateMarkingMutation.mutate({ id: marking.id, field: "typeOfInjury", value: v })} />
                        </td>
                        <td className="border p-2 text-center">
                          <EditableCell value={marking.grade} canEdit={canEdit} onSave={(v) => updateMarkingMutation.mutate({ id: marking.id, field: "grade", value: v })} />
                        </td>
                        <td className="border p-2 text-center">
                          <EditableCell value={marking.date} canEdit={canEdit} onSave={(v) => updateMarkingMutation.mutate({ id: marking.id, field: "date", value: v })} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Allergies & Special Precautions
        </h4>
        {allergyData ? (
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Drug Allergy:</span>
                <span className="ml-2 font-medium">{allergyData.drugAllergy || "None"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Food Allergy:</span>
                <span className="ml-2 font-medium">{allergyData.foodAllergy || "None"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Other Allergy:</span>
                <span className="ml-2 font-medium">{allergyData.otherAllergy || "None"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Special Precautions:</span>
                <span className="ml-2 font-medium">{allergyData.specialPrecautions || "None"}</span>
              </div>
            </div>
          </Card>
        ) : (
          <p className="text-muted-foreground">No allergy information recorded</p>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) {
          setSelectedMarker(null);
          setNewMarking({ markedArea: "", typeOfInjury: "", grade: "" });
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Body Marking</DialogTitle>
            <DialogDescription>
              Enter details for the marked area on the body diagram.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="markedArea">Marked Area *</Label>
              <Input
                id="markedArea"
                placeholder="e.g., Left shoulder, Right hip"
                value={newMarking.markedArea}
                onChange={(e) => setNewMarking(prev => ({ ...prev, markedArea: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="typeOfInjury">Type of Injury</Label>
              <Select value={newMarking.typeOfInjury} onValueChange={(v) => setNewMarking(prev => ({ ...prev, typeOfInjury: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pressure Sore">Pressure Sore</SelectItem>
                  <SelectItem value="Wound">Wound</SelectItem>
                  <SelectItem value="Bruise">Bruise</SelectItem>
                  <SelectItem value="Ulcer">Ulcer</SelectItem>
                  <SelectItem value="Rash">Rash</SelectItem>
                  <SelectItem value="Swelling">Swelling</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Grade / Severity</Label>
              <Select value={newMarking.grade} onValueChange={(v) => setNewMarking(prev => ({ ...prev, grade: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Grade 1 - Mild</SelectItem>
                  <SelectItem value="2">Grade 2 - Moderate</SelectItem>
                  <SelectItem value="3">Grade 3 - Severe</SelectItem>
                  <SelectItem value="4">Grade 4 - Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setSelectedMarker(null);
              setNewMarking({ markedArea: "", typeOfInjury: "", grade: "" });
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveMarking} disabled={addMarkingMutation.isPending}>
              {addMarkingMutation.isPending ? "Saving..." : "Save Marking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Test Categories with all tests from hospital list
const TEST_CATEGORIES = {
  PATHOLOGY: {
    name: "Pathology / Lab Tests",
    icon: FlaskConical,
    color: "text-purple-500",
    tests: [
      { name: "Complete Blood Count (CBC)", type: "LAB", department: "Pathology" },
      { name: "Hemoglobin (Hb)", type: "LAB", department: "Pathology" },
      { name: "Total / Differential Count", type: "LAB", department: "Pathology" },
      { name: "Platelet Count", type: "LAB", department: "Pathology" },
      { name: "ESR", type: "LAB", department: "Pathology" },
      { name: "Peripheral Smear", type: "LAB", department: "Pathology" },
      { name: "Blood Group & Rh Typing", type: "LAB", department: "Pathology" },
      { name: "Coagulation Profile (PT, INR, APTT)", type: "LAB", department: "Pathology" },
      { name: "Bleeding Time / Clotting Time", type: "LAB", department: "Pathology" },
      { name: "Reticulocyte Count", type: "LAB", department: "Pathology" },
      { name: "Fasting / PP Blood Sugar", type: "LAB", department: "Biochemistry" },
      { name: "HbA1c", type: "LAB", department: "Biochemistry" },
      { name: "Lipid Profile", type: "LAB", department: "Biochemistry" },
      { name: "Liver Function Test (LFT)", type: "LAB", department: "Biochemistry" },
      { name: "Kidney Function Test (KFT)", type: "LAB", department: "Biochemistry" },
      { name: "Electrolytes (Na, K, Cl)", type: "LAB", department: "Biochemistry" },
      { name: "Serum Calcium / Phosphorus", type: "LAB", department: "Biochemistry" },
      { name: "Uric Acid", type: "LAB", department: "Biochemistry" },
      { name: "Amylase / Lipase", type: "LAB", department: "Biochemistry" },
      { name: "Cardiac Enzymes (Troponin, CK-MB)", type: "LAB", department: "Biochemistry" },
      { name: "Thyroid Profile (T3, T4, TSH)", type: "LAB", department: "Biochemistry" },
      { name: "CRP", type: "LAB", department: "Serology" },
      { name: "ASO", type: "LAB", department: "Serology" },
      { name: "RA Factor", type: "LAB", department: "Serology" },
      { name: "ANA", type: "LAB", department: "Serology" },
      { name: "HIV", type: "LAB", department: "Serology" },
      { name: "HBsAg", type: "LAB", department: "Serology" },
      { name: "HCV", type: "LAB", department: "Serology" },
      { name: "Dengue (NS1, IgM, IgG)", type: "LAB", department: "Serology" },
      { name: "Widal Test", type: "LAB", department: "Serology" },
      { name: "VDRL", type: "LAB", department: "Serology" },
      { name: "Urine Culture", type: "LAB", department: "Microbiology" },
      { name: "Blood Culture", type: "LAB", department: "Microbiology" },
      { name: "Sputum Culture", type: "LAB", department: "Microbiology" },
      { name: "Stool Examination", type: "LAB", department: "Microbiology" },
      { name: "Gram Stain", type: "LAB", department: "Microbiology" },
      { name: "AFB / CBNAAT", type: "LAB", department: "Microbiology" },
      { name: "KOH Mount", type: "LAB", department: "Microbiology" },
      { name: "Sensitivity Testing", type: "LAB", department: "Microbiology" },
    ]
  },
  RADIOLOGY: {
    name: "Radiology & Imaging",
    icon: BarChart3,
    color: "text-blue-500",
    tests: [
      // X-RAY - Chest
      { name: "X-Ray Chest PA View", type: "X-RAY", department: "Radiology" },
      { name: "X-Ray Chest AP View", type: "X-RAY", department: "Radiology" },
      { name: "X-Ray Chest Lateral View", type: "X-RAY", department: "Radiology" },
      // X-RAY - Abdomen
      { name: "X-Ray Abdomen Erect", type: "X-RAY", department: "Radiology" },
      { name: "X-Ray Abdomen Supine", type: "X-RAY", department: "Radiology" },
      // X-RAY - Spine
      { name: "X-Ray Cervical Spine", type: "X-RAY", department: "Radiology" },
      { name: "X-Ray Dorsal/Thoracic Spine", type: "X-RAY", department: "Radiology" },
      { name: "X-Ray Lumbar Spine", type: "X-RAY", department: "Radiology" },
      { name: "X-Ray Whole Spine", type: "X-RAY", department: "Radiology" },
      // X-RAY - Limbs & Joints
      { name: "X-Ray Shoulder Joint", type: "X-RAY", department: "Radiology" },
      { name: "X-Ray Elbow Joint", type: "X-RAY", department: "Radiology" },
      { name: "X-Ray Wrist Joint", type: "X-RAY", department: "Radiology" },
      { name: "X-Ray Hand with Fingers", type: "X-RAY", department: "Radiology" },
      { name: "X-Ray Hip Joint", type: "X-RAY", department: "Radiology" },
      { name: "X-Ray Knee Joint", type: "X-RAY", department: "Radiology" },
      { name: "X-Ray Ankle Joint", type: "X-RAY", department: "Radiology" },
      { name: "X-Ray Foot with Toes", type: "X-RAY", department: "Radiology" },
      // X-RAY - Skull & Face
      { name: "X-Ray Skull (AP/Lateral)", type: "X-RAY", department: "Radiology" },
      { name: "X-Ray PNS (Para Nasal Sinuses)", type: "X-RAY", department: "Radiology" },
      { name: "X-Ray Mandible", type: "X-RAY", department: "Radiology" },
      { name: "X-Ray Nasal Bone", type: "X-RAY", department: "Radiology" },
      // X-RAY - Special
      { name: "IVP (Intravenous Pyelogram)", type: "X-RAY", department: "Radiology" },
      { name: "MCU (Micturating Cystourethrogram)", type: "X-RAY", department: "Radiology" },
      { name: "HSG (Hysterosalpingography)", type: "X-RAY", department: "Radiology" },
      { name: "Barium Swallow", type: "X-RAY", department: "Radiology" },
      { name: "Barium Meal Study", type: "X-RAY", department: "Radiology" },
      { name: "Barium Enema", type: "X-RAY", department: "Radiology" },
      // USG - General
      { name: "USG Whole Abdomen", type: "ULTRASOUND", department: "Radiology" },
      { name: "USG Upper Abdomen", type: "ULTRASOUND", department: "Radiology" },
      { name: "USG Lower Abdomen", type: "ULTRASOUND", department: "Radiology" },
      { name: "USG KUB (Kidney Ureter Bladder)", type: "ULTRASOUND", department: "Radiology" },
      { name: "USG Pelvis (Male/Female)", type: "ULTRASOUND", department: "Radiology" },
      // USG - Obstetric & Gynec
      { name: "USG Early Pregnancy (Dating)", type: "ULTRASOUND", department: "Radiology" },
      { name: "USG NT Scan (Nuchal Translucency)", type: "ULTRASOUND", department: "Radiology" },
      { name: "USG Anomaly Scan (Level II)", type: "ULTRASOUND", department: "Radiology" },
      { name: "USG Growth Scan (Level III)", type: "ULTRASOUND", department: "Radiology" },
      { name: "USG Obstetric Doppler", type: "ULTRASOUND", department: "Radiology" },
      { name: "USG TVS (Transvaginal Sonography)", type: "ULTRASOUND", department: "Radiology" },
      // USG - Small Parts
      { name: "USG Thyroid & Neck", type: "ULTRASOUND", department: "Radiology" },
      { name: "USG Breast Bilateral", type: "ULTRASOUND", department: "Radiology" },
      { name: "USG Scrotum & Testes", type: "ULTRASOUND", department: "Radiology" },
      { name: "USG Soft Tissue (Local)", type: "ULTRASOUND", department: "Radiology" },
      // USG - Doppler Studies
      { name: "Carotid Artery Doppler", type: "DOPPLER", department: "Radiology" },
      { name: "Venous Doppler - Lower Limb", type: "DOPPLER", department: "Radiology" },
      { name: "Venous Doppler - Upper Limb", type: "DOPPLER", department: "Radiology" },
      { name: "Arterial Doppler - Lower Limb", type: "DOPPLER", department: "Radiology" },
      { name: "Arterial Doppler - Upper Limb", type: "DOPPLER", department: "Radiology" },
      { name: "Renal Artery Doppler", type: "DOPPLER", department: "Radiology" },
      { name: "Portal Vein Doppler", type: "DOPPLER", department: "Radiology" },
      // USG - Interventional
      { name: "USG Guided FNAC", type: "ULTRASOUND", department: "Radiology" },
      { name: "USG Guided Biopsy", type: "ULTRASOUND", department: "Radiology" },
      { name: "USG Guided Drainage", type: "ULTRASOUND", department: "Radiology" },
      // CT SCAN - Brain
      { name: "CT Brain Plain", type: "CT", department: "Radiology" },
      { name: "CT Brain with Contrast", type: "CT", department: "Radiology" },
      { name: "CT Brain Trauma Protocol", type: "CT", department: "Radiology" },
      { name: "CT Brain Stroke Protocol", type: "CT", department: "Radiology" },
      { name: "CT Brain Angiography (CTA)", type: "CT", department: "Radiology" },
      { name: "CT Brain Venography (CTV)", type: "CT", department: "Radiology" },
      // CT SCAN - Head & Neck
      { name: "CT PNS (Para Nasal Sinuses)", type: "CT", department: "Radiology" },
      { name: "CT Orbit & Eye", type: "CT", department: "Radiology" },
      { name: "CT Temporal Bone", type: "CT", department: "Radiology" },
      { name: "CT Neck Soft Tissue", type: "CT", department: "Radiology" },
      { name: "CT Neck Angiography", type: "CT", department: "Radiology" },
      // CT SCAN - Chest
      { name: "CT Chest Plain", type: "CT", department: "Radiology" },
      { name: "CT Chest with Contrast", type: "CT", department: "Radiology" },
      { name: "HRCT Chest (High Resolution)", type: "CT", department: "Radiology" },
      { name: "CT Pulmonary Angiography (CTPA)", type: "CT", department: "Radiology" },
      { name: "CT Chest Trauma Protocol", type: "CT", department: "Radiology" },
      // CT SCAN - Abdomen & Pelvis
      { name: "CT Abdomen Plain", type: "CT", department: "Radiology" },
      { name: "CT Abdomen with Contrast", type: "CT", department: "Radiology" },
      { name: "CT KUB (Kidney Ureter Bladder)", type: "CT", department: "Radiology" },
      { name: "CT Abdomen + Pelvis (Whole)", type: "CT", department: "Radiology" },
      { name: "CT Triple Phase Liver", type: "CT", department: "Radiology" },
      { name: "CT Pancreas Protocol", type: "CT", department: "Radiology" },
      { name: "CT Urography", type: "CT", department: "Radiology" },
      // CT SCAN - Spine
      { name: "CT Cervical Spine", type: "CT", department: "Radiology" },
      { name: "CT Dorsal/Thoracic Spine", type: "CT", department: "Radiology" },
      { name: "CT Lumbar Spine", type: "CT", department: "Radiology" },
      { name: "CT Whole Spine", type: "CT", department: "Radiology" },
      { name: "CT Spine Trauma Protocol", type: "CT", department: "Radiology" },
      // CT SCAN - Cardiac & Vascular
      { name: "CT Coronary Angiography", type: "CT", department: "Radiology" },
      { name: "CT Aortogram", type: "CT", department: "Radiology" },
      { name: "CT Peripheral Angiography", type: "CT", department: "Radiology" },
      { name: "CT Renal Angiography", type: "CT", department: "Radiology" },
      { name: "CT Mesenteric Angiography", type: "CT", department: "Radiology" },
      // MRI - Brain
      { name: "MRI Brain Plain", type: "MRI", department: "Radiology" },
      { name: "MRI Brain with Contrast", type: "MRI", department: "Radiology" },
      { name: "MRI Brain Epilepsy Protocol", type: "MRI", department: "Radiology" },
      { name: "MRI Brain Stroke Protocol", type: "MRI", department: "Radiology" },
      { name: "MRI Brain Tumor Protocol", type: "MRI", department: "Radiology" },
      { name: "MRI Brain Angiography (MRA)", type: "MRI", department: "Radiology" },
      { name: "MR Venography (MRV)", type: "MRI", department: "Radiology" },
      // MRI - Spine
      { name: "MRI Cervical Spine", type: "MRI", department: "Radiology" },
      { name: "MRI Dorsal/Thoracic Spine", type: "MRI", department: "Radiology" },
      { name: "MRI Lumbar Spine", type: "MRI", department: "Radiology" },
      { name: "MRI Whole Spine Screening", type: "MRI", department: "Radiology" },
      // MRI - Head & Neck
      { name: "MRI Orbit & Eye", type: "MRI", department: "Radiology" },
      { name: "MRI PNS (Para Nasal Sinuses)", type: "MRI", department: "Radiology" },
      { name: "MRI Internal Auditory Canal (IAC)", type: "MRI", department: "Radiology" },
      { name: "MRI Neck Soft Tissue", type: "MRI", department: "Radiology" },
      // MRI - Chest & Abdomen
      { name: "MRI Liver (Hepatobiliary)", type: "MRI", department: "Radiology" },
      { name: "MRCP (MR Cholangiopancreatography)", type: "MRI", department: "Radiology" },
      { name: "MRI Pancreas", type: "MRI", department: "Radiology" },
      { name: "MRI Abdomen", type: "MRI", department: "Radiology" },
      { name: "MRI Pelvis", type: "MRI", department: "Radiology" },
      // MRI - Musculoskeletal
      { name: "MRI Knee Joint", type: "MRI", department: "Radiology" },
      { name: "MRI Shoulder Joint", type: "MRI", department: "Radiology" },
      { name: "MRI Ankle Joint", type: "MRI", department: "Radiology" },
      { name: "MRI Wrist Joint", type: "MRI", department: "Radiology" },
      { name: "MRI Hip Joint", type: "MRI", department: "Radiology" },
      { name: "MRI Elbow Joint", type: "MRI", department: "Radiology" },
      // MRI - Cardiac & Vascular
      { name: "Cardiac MRI", type: "MRI", department: "Cardiology" },
      { name: "MR Angiography - Peripheral", type: "MRI", department: "Radiology" },
      { name: "MR Renal Angiography", type: "MRI", department: "Radiology" },
      // Special Radiology
      { name: "CT Enterography", type: "CT", department: "Radiology" },
      { name: "MR Enterography", type: "MRI", department: "Radiology" },
      { name: "CT Fistulogram", type: "CT", department: "Radiology" },
      { name: "MR Fistulogram", type: "MRI", department: "Radiology" },
      { name: "PET-CT Scan", type: "IMAGING", department: "Nuclear Medicine" },
      { name: "Bone Densitometry (DEXA Scan)", type: "IMAGING", department: "Radiology" },
      { name: "Mammography (Digital)", type: "IMAGING", department: "Radiology" },
    ]
  },
  CARDIOLOGY: {
    name: "Cardiology Diagnostics",
    icon: Heart,
    color: "text-red-500",
    tests: [
      { name: "ECG", type: "ECG", department: "Cardiology" },
      { name: "2D Echo", type: "ECHO", department: "Cardiology" },
      { name: "TMT (Stress Test)", type: "TMT", department: "Cardiology" },
      { name: "Holter Monitoring", type: "HOLTER", department: "Cardiology" },
      { name: "ABPM (24-hr BP Monitoring)", type: "ABPM", department: "Cardiology" },
      { name: "Cardiac Doppler", type: "DOPPLER", department: "Cardiology" },
    ]
  },
  NEURO: {
    name: "Neuro Diagnostics",
    icon: Activity,
    color: "text-cyan-500",
    tests: [
      { name: "EEG", type: "EEG", department: "Neurology" },
      { name: "EMG", type: "EMG", department: "Neurology" },
      { name: "NCV (Nerve Conduction Velocity)", type: "NCV", department: "Neurology" },
    ]
  },
  PULMONARY: {
    name: "Pulmonary Tests",
    icon: Wind,
    color: "text-green-500",
    tests: [
      { name: "Pulmonary Function Test (PFT)", type: "PFT", department: "Pulmonology" },
      { name: "Spirometry", type: "PFT", department: "Pulmonology" },
      { name: "Peak Flow Test", type: "PFT", department: "Pulmonology" },
      { name: "Sleep Study (Polysomnography)", type: "SLEEP", department: "Pulmonology" },
      { name: "ABG (Arterial Blood Gas)", type: "ABG", department: "Pulmonology" },
    ]
  },
  BLOOD_BANK: {
    name: "Blood Bank",
    icon: Droplets,
    color: "text-rose-500",
    tests: [
      { name: "Blood Grouping", type: "BB", department: "Blood Bank" },
      { name: "Cross Matching", type: "BB", department: "Blood Bank" },
      { name: "Antibody Screening", type: "BB", department: "Blood Bank" },
      { name: "Component Separation", type: "BB", department: "Blood Bank" },
      { name: "Transfusion Compatibility Testing", type: "BB", department: "Blood Bank" },
    ]
  },
  DIALYSIS: {
    name: "Dialysis",
    icon: Syringe,
    color: "text-amber-500",
    tests: [
      { name: "Pre-Dialysis Assessment", type: "DIALYSIS", department: "Nephrology" },
      { name: "Post-Dialysis Vitals", type: "DIALYSIS", department: "Nephrology" },
      { name: "Dialysis Adequacy Tests", type: "DIALYSIS", department: "Nephrology" },
      { name: "Access Flow Check", type: "DIALYSIS", department: "Nephrology" },
    ]
  },
  ENDOSCOPY: {
    name: "Endoscopy / Cath Lab",
    icon: Stethoscope,
    color: "text-indigo-500",
    tests: [
      { name: "Upper GI Endoscopy", type: "ENDO", department: "Gastroenterology" },
      { name: "Colonoscopy", type: "ENDO", department: "Gastroenterology" },
      { name: "Sigmoidoscopy", type: "ENDO", department: "Gastroenterology" },
      { name: "Bronchoscopy", type: "ENDO", department: "Pulmonology" },
      { name: "Coronary Angiography", type: "CATH", department: "Cardiology" },
      { name: "Peripheral Angiography", type: "CATH", department: "Cardiology" },
      { name: "Temporary Pacemaker Setup", type: "CATH", department: "Cardiology" },
    ]
  },
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  SAMPLE_COLLECTED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  IN_PROGRESS: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  REPORT_UPLOADED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

function TestsSection({ chartId, patientId, patientName, canEdit, userId }: { 
  chartId: string; 
  patientId: string;
  patientName: string;
  canEdit: boolean; 
  userId?: string 
}) {
  const { toast } = useToast();
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("PATHOLOGY");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [priority, setPriority] = useState("ROUTINE");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  const { data: tests = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/icu-charts", chartId, "tests"],
    refetchInterval: 5000,
  });

  const { data: doctors = [] } = useQuery<any[]>({
    queryKey: ["/api/doctors"],
  });

  const orderTestsMutation = useMutation({
    mutationFn: async (testData: any) => {
      return apiRequest("POST", `/api/icu-charts/${chartId}/tests`, testData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/icu-charts", chartId, "tests"] });
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
      return apiRequest("PATCH", `/api/diagnostic-test-orders/${testId}/status`, { status, sampleCollectedBy: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/icu-charts", chartId, "tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/technician/pending-tests"] });
      toast({ title: "Test status updated" });
    },
  });

  const handleOrderTests = () => {
    if (!selectedDoctorId || selectedTests.length === 0) {
      toast({ title: "Please select tests and choose a doctor", variant: "destructive" });
      return;
    }

    const category = TEST_CATEGORIES[selectedCategory as keyof typeof TEST_CATEGORIES];
    selectedTests.forEach(testName => {
      const test = category.tests.find(t => t.name === testName);
      if (test) {
        orderTestsMutation.mutate({
          testName: test.name,
          testType: test.type,
          department: test.department,
          category: selectedCategory,
          priority,
          clinicalNotes,
          doctorId: userId || "",
          doctorName,
          patientId,
          patientName,
        });
      }
    });
  };

  const groupedTests = tests.reduce((acc: Record<string, any[]>, test: any) => {
    const cat = test.category || "PATHOLOGY";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(test);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Beaker className="w-4 h-4 text-purple-500" />
          Diagnostic Tests
        </h3>
        {canEdit && (
          <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-order-test">
                <Plus className="w-4 h-4 mr-1" />
                Perform Tests
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Perform Diagnostic Tests - {patientName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ordering Doctor</Label>
                    <Select 
                      value={selectedDoctorId} 
                      onValueChange={(value) => {
                        setSelectedDoctorId(value);
                        const doctor = doctors.find((d: any) => d.id?.toString() === value);
                        if (doctor) {
                          setDoctorName(`Dr. ${doctor.name}`);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor: any) => (
                          <SelectItem key={doctor.id} value={doctor.id?.toString()}>
                            Dr. {doctor.name} - {doctor.specialty || doctor.department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ROUTINE">Routine</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                        <SelectItem value="STAT">STAT (Immediate)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Test Category</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(TEST_CATEGORIES).map(([key, cat]) => {
                      const Icon = cat.icon;
                      return (
                        <Button
                          key={key}
                          variant={selectedCategory === key ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setSelectedCategory(key);
                            setSelectedTests([]);
                          }}
                          className="gap-1"
                        >
                          <Icon className={`w-3 h-3 ${cat.color}`} />
                          {cat.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label>Select Tests</Label>
                  <ScrollArea className="h-48 border rounded-md p-2 mt-2">
                    <div className="space-y-1">
                      {TEST_CATEGORIES[selectedCategory as keyof typeof TEST_CATEGORIES]?.tests.map(test => (
                        <div key={test.name} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={test.name}
                            checked={selectedTests.includes(test.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTests([...selectedTests, test.name]);
                              } else {
                                setSelectedTests(selectedTests.filter(t => t !== test.name));
                              }
                            }}
                            className="rounded"
                          />
                          <label htmlFor={test.name} className="text-sm cursor-pointer flex-1">
                            {test.name}
                            <span className="text-muted-foreground ml-2">({test.department})</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  {selectedTests.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedTests.length} test(s) selected
                    </p>
                  )}
                </div>

                <div>
                  <Label>Clinical Notes</Label>
                  <Textarea
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="Any special instructions or clinical notes..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowOrderDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleOrderTests}
                    disabled={orderTestsMutation.isPending || selectedTests.length === 0}
                  >
                    {orderTestsMutation.isPending ? "Ordering..." : `Order ${selectedTests.length} Test(s)`}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading tests...</div>
      ) : tests.length === 0 ? (
        <Card className="p-8 text-center">
          <Beaker className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No tests ordered for this patient yet</p>
          {canEdit && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setShowOrderDialog(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Order First Test
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(TEST_CATEGORIES).map(([categoryKey, category]) => {
            const categoryTests = groupedTests[categoryKey] || [];
            if (categoryTests.length === 0) return null;

            const Icon = category.icon;
            return (
              <Card key={categoryKey} className="p-4">
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <Icon className={`w-4 h-4 ${category.color}`} />
                  {category.name}
                  <Badge variant="secondary">{categoryTests.length}</Badge>
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-2">Test Name</th>
                        <th className="text-left p-2">Priority</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Ordered By</th>
                        <th className="text-left p-2">Date</th>
                        {canEdit && <th className="text-left p-2">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {categoryTests.map((test: any) => (
                        <tr key={test.id} className="border-b">
                          <td className="p-2 font-medium">{test.testName}</td>
                          <td className="p-2">
                            <Badge variant={test.priority === "STAT" ? "destructive" : test.priority === "URGENT" ? "default" : "secondary"}>
                              {test.priority}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[test.status] || STATUS_COLORS.PENDING}`}>
                              {test.status?.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="p-2">{test.doctorName}</td>
                          <td className="p-2">
                            {test.orderedDate ? format(new Date(test.orderedDate), "dd/MM/yyyy HH:mm") : "-"}
                          </td>
                          {canEdit && (
                            <td className="p-2">
                              {test.status === "PENDING" && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateStatusMutation.mutate({ testId: test.id, status: "SAMPLE_COLLECTED" })}
                                >
                                  Collect Sample
                                </Button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
