import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Stethoscope,
  ClipboardList,
  Activity,
  Beaker,
  UserCheck,
  AlertTriangle,
  ChevronRight,
  Building2,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  Loader2,
  Plus,
  FileText,
  ArrowRight,
  Lightbulb,
  Heart,
  ThermometerSun,
  Droplets,
  Wind
} from "lucide-react";
import type { OpdDepartmentFlows, OpdConsultations, ServicePatient, Doctor } from "@shared/schema";

const getPatientFullName = (p: ServicePatient) => `${p.firstName} ${p.lastName}`;
const getPatientAge = (p: ServicePatient) => {
  if (!p.dateOfBirth) return undefined;
  const birth = new Date(p.dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

type SymptomConfig = {
  id: string;
  name: string;
  severity_levels: string[];
  duration_options: string[];
  location?: string[];
  red_flags?: string[];
};

type ObservationConfig = {
  id: string;
  name: string;
  type: string;
  options?: string[];
  unit?: string;
  min?: number;
  max?: number;
};

type SelectedSymptom = {
  symptomId: string;
  name: string;
  severity: string;
  duration: string;
  notes: string;
};

type ObservationValue = {
  fieldId: string;
  name: string;
  value: string;
  unit?: string;
};

type VitalsData = {
  bp_systolic: string;
  bp_diastolic: string;
  pulse: string;
  temp: string;
  spo2: string;
  rr: string;
  weight: string;
  height: string;
};

export default function SmartOPDConsultation() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("department");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedPatient, setSelectedPatient] = useState<ServicePatient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [visitType, setVisitType] = useState<string>("new");
  
  const [selectedSymptoms, setSelectedSymptoms] = useState<SelectedSymptom[]>([]);
  const [observations, setObservations] = useState<ObservationValue[]>([]);
  const [vitals, setVitals] = useState<VitalsData>({
    bp_systolic: "", bp_diastolic: "", pulse: "", temp: "", spo2: "", rr: "", weight: "", height: ""
  });
  
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  
  const [flowSuggestions, setFlowSuggestions] = useState<{
    suggestedTests: any[];
    suggestedReferrals: any[];
    alerts: string[];
  }>({ suggestedTests: [], suggestedReferrals: [], alerts: [] });
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");

  const { data: opdFlows = [] } = useQuery<OpdDepartmentFlows[]>({
    queryKey: ["/api/opd-flows"],
  });

  const { data: patients = [] } = useQuery<ServicePatient[]>({
    queryKey: ["/api/service-patients"],
  });

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  const selectedFlow = opdFlows.find(f => f.departmentCode === selectedDepartment);
  const symptoms: SymptomConfig[] = selectedFlow ? JSON.parse(selectedFlow.symptoms || "[]") : [];
  const autoObservations: ObservationConfig[] = selectedFlow ? JSON.parse(selectedFlow.autoObservations || "[]") : [];
  const vitalsFields: string[] = selectedFlow ? JSON.parse(selectedFlow.vitalsFields || "[]") : [];

  const filteredPatients = patients.filter(p => 
    getPatientFullName(p).toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.id?.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const applyRulesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/opd-flows/apply-rules", {
        departmentCode: selectedDepartment,
        selectedSymptoms,
        observations
      });
      return response.json();
    },
    onSuccess: (data) => {
      setFlowSuggestions(data);
      setShowSuggestions(true);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to get suggestions", variant: "destructive" });
    }
  });

  const createConsultationMutation = useMutation({
    mutationFn: async () => {
      const consultationData = {
        patientId: selectedPatient?.id || "",
        patientName: selectedPatient ? getPatientFullName(selectedPatient) : "",
        patientAge: selectedPatient ? getPatientAge(selectedPatient) : undefined,
        patientGender: selectedPatient?.gender,
        doctorId: selectedDoctor?.id || "",
        doctorName: selectedDoctor?.name || "",
        departmentCode: selectedDepartment,
        departmentName: selectedFlow?.departmentName || "",
        visitType,
        selectedSymptoms: JSON.stringify(selectedSymptoms),
        observations: JSON.stringify(observations),
        vitals: JSON.stringify(vitals),
        flowResults: JSON.stringify(flowSuggestions),
        clinicalNotes,
        diagnosis,
        treatmentPlan,
        status: "completed"
      };
      const response = await apiRequest("POST", "/api/opd-consultations", consultationData);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "OPD Consultation saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/opd-consultations"] });
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save consultation", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setSelectedDepartment("");
    setSelectedPatient(null);
    setSelectedDoctor(null);
    setSelectedSymptoms([]);
    setObservations([]);
    setVitals({ bp_systolic: "", bp_diastolic: "", pulse: "", temp: "", spo2: "", rr: "", weight: "", height: "" });
    setClinicalNotes("");
    setDiagnosis("");
    setTreatmentPlan("");
    setFlowSuggestions({ suggestedTests: [], suggestedReferrals: [], alerts: [] });
    setActiveTab("department");
  };

  const toggleSymptom = (symptom: SymptomConfig) => {
    const exists = selectedSymptoms.find(s => s.symptomId === symptom.id);
    if (exists) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s.symptomId !== symptom.id));
    } else {
      setSelectedSymptoms([...selectedSymptoms, {
        symptomId: symptom.id,
        name: symptom.name,
        severity: symptom.severity_levels[0] || "",
        duration: symptom.duration_options[0] || "",
        notes: ""
      }]);
    }
  };

  const updateSymptom = (symptomId: string, field: keyof SelectedSymptom, value: string) => {
    setSelectedSymptoms(selectedSymptoms.map(s => 
      s.symptomId === symptomId ? { ...s, [field]: value } : s
    ));
  };

  const updateObservation = (fieldId: string, name: string, value: string, unit?: string) => {
    const existing = observations.find(o => o.fieldId === fieldId);
    if (existing) {
      setObservations(observations.map(o => o.fieldId === fieldId ? { ...o, value } : o));
    } else {
      setObservations([...observations, { fieldId, name, value, unit }]);
    }
  };

  const canProceedToSymptoms = selectedDepartment && selectedPatient && selectedDoctor;
  const canProceedToObservations = selectedSymptoms.length > 0;
  const canSubmit = canProceedToSymptoms && canProceedToObservations;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <Stethoscope className="h-6 w-6 text-primary" />
              Smart OPD Consultation
            </h1>
            <p className="text-muted-foreground">Department-specific clinical workflow engine (OPD only)</p>
          </div>
          <Badge variant="outline" className="text-sm">
            {opdFlows.length} Departments Configured
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="department" data-testid="tab-department">
              <Building2 className="h-4 w-4 mr-1" />
              Department
            </TabsTrigger>
            <TabsTrigger value="symptoms" disabled={!canProceedToSymptoms} data-testid="tab-symptoms">
              <ClipboardList className="h-4 w-4 mr-1" />
              Symptoms
            </TabsTrigger>
            <TabsTrigger value="observations" disabled={!canProceedToObservations} data-testid="tab-observations">
              <Activity className="h-4 w-4 mr-1" />
              Observations
            </TabsTrigger>
            <TabsTrigger value="suggestions" disabled={!canProceedToObservations} data-testid="tab-suggestions">
              <Lightbulb className="h-4 w-4 mr-1" />
              Suggestions
            </TabsTrigger>
            <TabsTrigger value="summary" disabled={!canSubmit} data-testid="tab-summary">
              <FileText className="h-4 w-4 mr-1" />
              Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="department" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Select Department
                  </CardTitle>
                  <CardDescription>Choose the OPD department for this consultation</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="grid gap-2">
                      {opdFlows.map(flow => (
                        <Button
                          key={flow.departmentCode}
                          variant={selectedDepartment === flow.departmentCode ? "default" : "outline"}
                          className="justify-start h-auto py-3 px-4"
                          onClick={() => setSelectedDepartment(flow.departmentCode)}
                          data-testid={`button-dept-${flow.departmentCode}`}
                        >
                          <div className="text-left">
                            <div className="font-medium">{flow.departmentName}</div>
                            <div className="text-xs text-muted-foreground">
                              {flow.flowType === "symptom_driven" && "Symptom-based flow"}
                              {flow.flowType === "score_driven" && "Score-based flow"}
                              {flow.flowType === "service_flow" && "Service workflow"}
                              {flow.flowType === "imaging_flow" && "Imaging workflow"}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Select Patient
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      placeholder="Search by name or ID..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="mb-4"
                      data-testid="input-patient-search"
                    />
                    <ScrollArea className="h-[150px]">
                      <div className="space-y-2">
                        {filteredPatients.slice(0, 10).map(patient => (
                          <Button
                            key={patient.id}
                            variant={selectedPatient?.id === patient.id ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={() => setSelectedPatient(patient)}
                            data-testid={`button-patient-${patient.id}`}
                          >
                            <User className="h-4 w-4 mr-2" />
                            {getPatientFullName(patient)} ({patient.id.slice(0, 8)})
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Select Doctor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={selectedDoctor?.id || ""} onValueChange={(val) => {
                      const doc = doctors.find(d => d.id === val);
                      setSelectedDoctor(doc || null);
                    }}>
                      <SelectTrigger data-testid="select-doctor">
                        <SelectValue placeholder="Choose consulting doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map(doc => (
                          <SelectItem key={doc.id} value={doc.id} data-testid={`option-doctor-${doc.id}`}>
                            {doc.name} - {doc.specialty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Visit Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={visitType} onValueChange={setVisitType}>
                      <SelectTrigger data-testid="select-visit-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New Visit</SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </div>
            </div>

            {canProceedToSymptoms && (
              <div className="flex justify-end">
                <Button onClick={() => setActiveTab("symptoms")} data-testid="button-next-symptoms">
                  Next: Symptoms <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="symptoms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Chief Complaints - {selectedFlow?.departmentName}
                </CardTitle>
                <CardDescription>Select symptoms reported by the patient</CardDescription>
              </CardHeader>
              <CardContent>
                {symptoms.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    This department uses a service workflow without symptom capture.
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {symptoms.map(symptom => {
                      const isSelected = selectedSymptoms.find(s => s.symptomId === symptom.id);
                      return (
                        <Card key={symptom.id} className={isSelected ? "border-primary" : ""}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={!!isSelected}
                                onCheckedChange={() => toggleSymptom(symptom)}
                                data-testid={`checkbox-symptom-${symptom.id}`}
                              />
                              <div className="flex-1 space-y-3">
                                <Label className="font-medium cursor-pointer" onClick={() => toggleSymptom(symptom)}>
                                  {symptom.name}
                                </Label>
                                {isSelected && (
                                  <div className="space-y-2">
                                    <Select
                                      value={isSelected.severity}
                                      onValueChange={(val) => updateSymptom(symptom.id, "severity", val)}
                                    >
                                      <SelectTrigger className="h-8" data-testid={`select-severity-${symptom.id}`}>
                                        <SelectValue placeholder="Severity" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {symptom.severity_levels.map(level => (
                                          <SelectItem key={level} value={level}>{level}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Select
                                      value={isSelected.duration}
                                      onValueChange={(val) => updateSymptom(symptom.id, "duration", val)}
                                    >
                                      <SelectTrigger className="h-8" data-testid={`select-duration-${symptom.id}`}>
                                        <SelectValue placeholder="Duration" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {symptom.duration_options.map(opt => (
                                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      placeholder="Additional notes..."
                                      value={isSelected.notes}
                                      onChange={(e) => updateSymptom(symptom.id, "notes", e.target.value)}
                                      className="h-8"
                                      data-testid={`input-notes-${symptom.id}`}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("department")} data-testid="button-back-department">
                Back
              </Button>
              <Button onClick={() => setActiveTab("observations")} disabled={!canProceedToObservations} data-testid="button-next-observations">
                Next: Observations <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="observations" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {selectedFlow?.requiresVitals && vitalsFields.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      Vitals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {vitalsFields.includes("bp") && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>BP Systolic</Label>
                          <Input
                            type="number"
                            placeholder="mmHg"
                            value={vitals.bp_systolic}
                            onChange={(e) => setVitals({...vitals, bp_systolic: e.target.value})}
                            data-testid="input-bp-systolic"
                          />
                        </div>
                        <div>
                          <Label>BP Diastolic</Label>
                          <Input
                            type="number"
                            placeholder="mmHg"
                            value={vitals.bp_diastolic}
                            onChange={(e) => setVitals({...vitals, bp_diastolic: e.target.value})}
                            data-testid="input-bp-diastolic"
                          />
                        </div>
                      </div>
                    )}
                    {vitalsFields.includes("pulse") && (
                      <div>
                        <Label className="flex items-center gap-1">
                          <Activity className="h-3 w-3" /> Pulse
                        </Label>
                        <Input
                          type="number"
                          placeholder="bpm"
                          value={vitals.pulse}
                          onChange={(e) => setVitals({...vitals, pulse: e.target.value})}
                          data-testid="input-pulse"
                        />
                      </div>
                    )}
                    {vitalsFields.includes("temp") && (
                      <div>
                        <Label className="flex items-center gap-1">
                          <ThermometerSun className="h-3 w-3" /> Temperature
                        </Label>
                        <Input
                          type="number"
                          placeholder="°F"
                          step="0.1"
                          value={vitals.temp}
                          onChange={(e) => setVitals({...vitals, temp: e.target.value})}
                          data-testid="input-temp"
                        />
                      </div>
                    )}
                    {vitalsFields.includes("spo2") && (
                      <div>
                        <Label className="flex items-center gap-1">
                          <Droplets className="h-3 w-3" /> SpO2
                        </Label>
                        <Input
                          type="number"
                          placeholder="%"
                          value={vitals.spo2}
                          onChange={(e) => setVitals({...vitals, spo2: e.target.value})}
                          data-testid="input-spo2"
                        />
                      </div>
                    )}
                    {vitalsFields.includes("rr") && (
                      <div>
                        <Label className="flex items-center gap-1">
                          <Wind className="h-3 w-3" /> Respiratory Rate
                        </Label>
                        <Input
                          type="number"
                          placeholder="/min"
                          value={vitals.rr}
                          onChange={(e) => setVitals({...vitals, rr: e.target.value})}
                          data-testid="input-rr"
                        />
                      </div>
                    )}
                    {vitalsFields.includes("weight") && (
                      <div>
                        <Label>Weight (kg)</Label>
                        <Input
                          type="number"
                          placeholder="kg"
                          value={vitals.weight}
                          onChange={(e) => setVitals({...vitals, weight: e.target.value})}
                          data-testid="input-weight"
                        />
                      </div>
                    )}
                    {vitalsFields.includes("height") && (
                      <div>
                        <Label>Height (cm)</Label>
                        <Input
                          type="number"
                          placeholder="cm"
                          value={vitals.height}
                          onChange={(e) => setVitals({...vitals, height: e.target.value})}
                          data-testid="input-height"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Clinical Observations
                  </CardTitle>
                  <CardDescription>Department-specific examination findings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {autoObservations.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No specific observations for this department.</p>
                  ) : (
                    autoObservations.map(obs => (
                      <div key={obs.id}>
                        <Label>{obs.name} {obs.unit && `(${obs.unit})`}</Label>
                        {obs.type === "select" && obs.options ? (
                          <Select
                            value={observations.find(o => o.fieldId === obs.id)?.value || ""}
                            onValueChange={(val) => updateObservation(obs.id, obs.name, val, obs.unit)}
                          >
                            <SelectTrigger data-testid={`select-obs-${obs.id}`}>
                              <SelectValue placeholder={`Select ${obs.name}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {obs.options.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : obs.type === "number" ? (
                          <Input
                            type="number"
                            min={obs.min}
                            max={obs.max}
                            placeholder={obs.unit || ""}
                            value={observations.find(o => o.fieldId === obs.id)?.value || ""}
                            onChange={(e) => updateObservation(obs.id, obs.name, e.target.value, obs.unit)}
                            data-testid={`input-obs-${obs.id}`}
                          />
                        ) : obs.type === "date" ? (
                          <Input
                            type="date"
                            value={observations.find(o => o.fieldId === obs.id)?.value || ""}
                            onChange={(e) => updateObservation(obs.id, obs.name, e.target.value)}
                            data-testid={`input-obs-${obs.id}`}
                          />
                        ) : (
                          <Input
                            placeholder={`Enter ${obs.name}`}
                            value={observations.find(o => o.fieldId === obs.id)?.value || ""}
                            onChange={(e) => updateObservation(obs.id, obs.name, e.target.value, obs.unit)}
                            data-testid={`input-obs-${obs.id}`}
                          />
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("symptoms")} data-testid="button-back-symptoms">
                Back
              </Button>
              <Button onClick={() => {
                applyRulesMutation.mutate();
                setActiveTab("suggestions");
              }} data-testid="button-get-suggestions">
                {applyRulesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Lightbulb className="h-4 w-4 mr-2" />
                )}
                Get Smart Suggestions
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Beaker className="h-5 w-5 text-blue-500" />
                    Suggested Investigations
                  </CardTitle>
                  <CardDescription>Based on symptoms and clinical rules</CardDescription>
                </CardHeader>
                <CardContent>
                  {flowSuggestions.suggestedTests.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No specific tests suggested. Click "Get Smart Suggestions" to analyze.</p>
                  ) : (
                    <div className="space-y-2">
                      {flowSuggestions.suggestedTests.map((test, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <Checkbox defaultChecked data-testid={`checkbox-test-${idx}`} />
                            <span>{test.testName}</span>
                          </div>
                          <Badge variant={test.priority === "urgent" ? "destructive" : "secondary"}>
                            {test.priority}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-green-500" />
                    Suggested Referrals
                  </CardTitle>
                  <CardDescription>Recommended specialty consultations</CardDescription>
                </CardHeader>
                <CardContent>
                  {flowSuggestions.suggestedReferrals.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No referrals suggested based on current findings.</p>
                  ) : (
                    <div className="space-y-2">
                      {flowSuggestions.suggestedReferrals.map((ref, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                          <Checkbox defaultChecked data-testid={`checkbox-referral-${idx}`} />
                          <Building2 className="h-4 w-4" />
                          <span>{ref.department}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {flowSuggestions.alerts.length > 0 && (
              <Card className="border-yellow-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-600">
                    <AlertTriangle className="h-5 w-5" />
                    Clinical Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1">
                    {flowSuggestions.alerts.map((alert, idx) => (
                      <li key={idx} className="text-yellow-700">{alert}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("observations")} data-testid="button-back-observations">
                Back
              </Button>
              <Button onClick={() => setActiveTab("summary")} data-testid="button-next-summary">
                Next: Summary <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Consultation Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Patient</p>
                      <p className="font-medium">{selectedPatient ? getPatientFullName(selectedPatient) : ""}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Doctor</p>
                      <p className="font-medium">{selectedDoctor?.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Department</p>
                      <p className="font-medium">{selectedFlow?.departmentName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Visit Type</p>
                      <p className="font-medium capitalize">{visitType.replace("_", " ")}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Chief Complaints</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSymptoms.map(s => (
                        <Badge key={s.symptomId} variant="outline">{s.name}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Clinical Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Diagnosis</Label>
                    <Textarea
                      placeholder="Enter diagnosis..."
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      data-testid="textarea-diagnosis"
                    />
                  </div>
                  <div>
                    <Label>Clinical Notes</Label>
                    <Textarea
                      placeholder="Additional clinical notes..."
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      data-testid="textarea-clinical-notes"
                    />
                  </div>
                  <div>
                    <Label>Treatment Plan (OPD)</Label>
                    <Textarea
                      placeholder="Medications, advice, follow-up..."
                      value={treatmentPlan}
                      onChange={(e) => setTreatmentPlan(e.target.value)}
                      data-testid="textarea-treatment-plan"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("suggestions")} data-testid="button-back-suggestions">
                Back
              </Button>
              <Button onClick={() => createConsultationMutation.mutate()} disabled={createConsultationMutation.isPending} data-testid="button-save-consultation">
                {createConsultationMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Complete Consultation
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
