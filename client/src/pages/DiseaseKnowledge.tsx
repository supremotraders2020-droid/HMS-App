import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { 
  BookOpen, 
  Utensils, 
  Pill, 
  Activity, 
  Heart,
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  Sparkles,
  ClipboardList,
  Users,
  Brain,
  Leaf,
  Wind,
  Bug,
  Bone,
  RefreshCw,
  ChevronRight,
  Target,
  Calendar,
  Clock
} from "lucide-react";

interface Disease {
  id: string;
  diseaseName: string;
  alternateNames: string | null;
  category: string;
  affectedSystem: string;
  shortDescription: string;
  causes: string;
  riskFactors: string;
  symptoms: string;
  emergencySigns: string | null;
  clinicalParameters: string | null;
  dosList: string | null;
  dontsList: string | null;
  activityRecommendations: string | null;
  monitoringGuidelines: string | null;
  isActive: boolean;
}

interface DietTemplate {
  id: string;
  diseaseId: string;
  templateName: string;
  dietType: string;
  mealPlan: string;
  foodsToAvoid: string | null;
  foodsToLimit: string | null;
  portionGuidance: string | null;
  hydrationGuidance: string | null;
}

interface MedicationSchedule {
  id: string;
  diseaseId: string;
  medicineCategory: string;
  typicalTiming: string;
  beforeAfterFood: string;
  missedDoseInstructions: string | null;
  storageGuidelines: string | null;
  interactionWarnings: string | null;
}

interface PatientAssignment {
  id: string;
  patientId: string;
  diseaseId: string;
  severity: string;
  diagnosedDate: string;
  assignedBy: string;
  assignedByName: string | null;
  opdIpdStatus: string;
}

interface CarePlan {
  id: string;
  patientId: string;
  assignmentId: string;
  personalizedDiet: string | null;
  personalizedSchedule: string | null;
  personalizedLifestyle: string | null;
  personalizedMonitoring: string | null;
  aiGeneratedAt: string;
  generatedByName: string | null;
}

const categoryIcons: Record<string, any> = {
  metabolic: Brain,
  cardiovascular: Heart,
  respiratory: Wind,
  infectious: Bug,
  neuro: Brain,
  other: Bone,
};

const categoryColors: Record<string, string> = {
  metabolic: "bg-purple-100 text-purple-700 border-purple-200",
  cardiovascular: "bg-red-100 text-red-700 border-red-200",
  respiratory: "bg-blue-100 text-blue-700 border-blue-200",
  infectious: "bg-yellow-100 text-yellow-700 border-yellow-200",
  neuro: "bg-pink-100 text-pink-700 border-pink-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function DiseaseKnowledge() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("catalog");
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: diseases = [], isLoading: diseasesLoading } = useQuery<Disease[]>({
    queryKey: ["/api/diseases"],
  });

  const { data: dietTemplates = [] } = useQuery<DietTemplate[]>({
    queryKey: ["/api/diet-templates"],
  });

  const { data: medicationSchedules = [] } = useQuery<MedicationSchedule[]>({
    queryKey: ["/api/medication-schedules"],
  });

  const { data: assignments = [] } = useQuery<PatientAssignment[]>({
    queryKey: ["/api/patient-disease-assignments"],
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/diseases/seed");
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: data.message });
      queryClient.invalidateQueries({ queryKey: ["/api/diseases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/diet-templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medication-schedules"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to seed data", description: error.message, variant: "destructive" });
    },
  });

  const filteredDiseases = diseases.filter(disease => {
    const matchesCategory = categoryFilter === "all" || disease.category === categoryFilter;
    const matchesSearch = disease.diseaseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         disease.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const parseJSON = (str: string | null): any[] => {
    if (!str) return [];
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  const parseJSONObject = (str: string | null): any => {
    if (!str) return {};
    try {
      return JSON.parse(str);
    } catch {
      return {};
    }
  };

  const getCategoryIcon = (category: string) => {
    const Icon = categoryIcons[category] || Stethoscope;
    return <Icon className="w-4 h-4" />;
  };

  const getDiseaseTemplates = (diseaseId: string) => {
    return {
      diet: dietTemplates.filter(t => t.diseaseId === diseaseId),
      medication: medicationSchedules.filter(m => m.diseaseId === diseaseId),
    };
  };

  const getDiseaseName = (diseaseId: string) => {
    const disease = diseases.find(d => d.id === diseaseId);
    return disease?.diseaseName || "Unknown";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Disease Knowledge & Care Plans
          </h1>
          <p className="text-muted-foreground">Indian clinical guidelines for diet, medication scheduling & lifestyle</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => seedMutation.mutate()} 
            disabled={seedMutation.isPending}
            data-testid="button-seed-diseases"
          >
            {seedMutation.isPending ? "Seeding..." : "Seed Disease Data"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/diseases"] });
              queryClient.invalidateQueries({ queryKey: ["/api/diet-templates"] });
              queryClient.invalidateQueries({ queryKey: ["/api/medication-schedules"] });
            }} 
            data-testid="button-refresh"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="catalog" data-testid="tab-catalog">
            <BookOpen className="w-4 h-4 mr-2" />Disease Catalog
          </TabsTrigger>
          <TabsTrigger value="diet" data-testid="tab-diet">
            <Utensils className="w-4 h-4 mr-2" />Diet Plans
          </TabsTrigger>
          <TabsTrigger value="medication" data-testid="tab-medication">
            <Pill className="w-4 h-4 mr-2" />Medication Schedules
          </TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            <Users className="w-4 h-4 mr-2" />Patient Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search diseases..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-diseases"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48" data-testid="select-category">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="metabolic">Metabolic</SelectItem>
                <SelectItem value="cardiovascular">Cardiovascular</SelectItem>
                <SelectItem value="respiratory">Respiratory</SelectItem>
                <SelectItem value="infectious">Infectious</SelectItem>
                <SelectItem value="neuro">Neurological</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {diseasesLoading ? (
            <div className="text-center py-8">Loading diseases...</div>
          ) : filteredDiseases.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No diseases found</h3>
                <p className="text-muted-foreground mb-4">Click "Seed Disease Data" to populate the database with common Indian diseases.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDiseases.map((disease) => (
                <Card key={disease.id} className="hover-elevate cursor-pointer" onClick={() => setSelectedDisease(disease)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(disease.category)}
                        <CardTitle className="text-lg">{disease.diseaseName}</CardTitle>
                      </div>
                      <Badge variant="outline" className={categoryColors[disease.category]}>
                        {disease.category}
                      </Badge>
                    </div>
                    {disease.alternateNames && (
                      <p className="text-xs text-muted-foreground">{disease.alternateNames}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{disease.shortDescription}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{disease.affectedSystem}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Dialog open={!!selectedDisease} onOpenChange={() => setSelectedDisease(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedDisease && getCategoryIcon(selectedDisease.category)}
                  {selectedDisease?.diseaseName}
                </DialogTitle>
                <DialogDescription>{selectedDisease?.shortDescription}</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh]">
                {selectedDisease && (
                  <div className="space-y-4 pr-4">
                    <Accordion type="multiple" defaultValue={["overview", "symptoms", "parameters"]}>
                      <AccordionItem value="overview">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2"><Stethoscope className="w-4 h-4" />Disease Overview</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-semibold text-sm mb-1">Causes</h4>
                              <ul className="list-disc list-inside text-sm text-muted-foreground">
                                {parseJSON(selectedDisease.causes).map((cause, i) => (
                                  <li key={i}>{cause}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-1">Risk Factors</h4>
                              <div className="flex flex-wrap gap-1">
                                {parseJSON(selectedDisease.riskFactors).map((factor, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">{factor}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="symptoms">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2"><Activity className="w-4 h-4" />Symptoms & Warning Signs</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Common Symptoms</h4>
                              <ul className="space-y-1">
                                {parseJSON(selectedDisease.symptoms).map((symptom, i) => (
                                  <li key={i} className="text-sm flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    {symptom}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-2 text-red-600">Emergency Signs</h4>
                              <ul className="space-y-1">
                                {parseJSON(selectedDisease.emergencySigns).map((sign, i) => (
                                  <li key={i} className="text-sm flex items-center gap-2 text-red-600">
                                    <AlertTriangle className="w-3 h-3" />
                                    {sign}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="parameters">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2"><Target className="w-4 h-4" />Clinical Parameters</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {Object.entries(parseJSONObject(selectedDisease.clinicalParameters)).map(([key, values]: [string, any]) => (
                              <div key={key} className="flex items-center justify-between p-2 border rounded">
                                <span className="font-medium text-sm capitalize">{key.replace(/_/g, " ")}</span>
                                <div className="flex gap-2 text-xs">
                                  <Badge variant="outline" className="bg-green-50 text-green-700">Normal: {values.normal}</Badge>
                                  <Badge variant="outline" className="bg-amber-50 text-amber-700">Target: {values.target}</Badge>
                                  <Badge variant="outline" className="bg-red-50 text-red-700">Danger: {values.danger}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="dosdonts">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2"><ClipboardList className="w-4 h-4" />Do's & Don'ts</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-sm mb-2 text-green-600">Do's</h4>
                              <ul className="space-y-1">
                                {parseJSON(selectedDisease.dosList).map((item, i) => (
                                  <li key={i} className="text-sm flex items-center gap-2">
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-2 text-red-600">Don'ts</h4>
                              <ul className="space-y-1">
                                {parseJSON(selectedDisease.dontsList).map((item, i) => (
                                  <li key={i} className="text-sm flex items-center gap-2">
                                    <XCircle className="w-3 h-3 text-red-500" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="lifestyle">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2"><Leaf className="w-4 h-4" />Activity & Lifestyle</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {Object.entries(parseJSONObject(selectedDisease.activityRecommendations)).map(([key, value]: [string, any]) => (
                              <div key={key} className="flex items-center justify-between p-2 border rounded">
                                <span className="font-medium text-sm capitalize">{key}</span>
                                <span className="text-sm text-muted-foreground">{value}</span>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="monitoring">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2"><Calendar className="w-4 h-4" />Monitoring Schedule</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {Object.entries(parseJSONObject(selectedDisease.monitoringGuidelines)).map(([frequency, items]: [string, any]) => (
                              <div key={frequency} className="p-2 border rounded">
                                <span className="font-medium text-sm capitalize">{frequency}</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {(Array.isArray(items) ? items : [items]).map((item: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
                      <AlertTriangle className="w-4 h-4 inline mr-2" />
                      <strong>Disclaimer:</strong> This information is for educational purposes only and does not replace consultation with a registered medical practitioner.
                    </div>
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="diet" className="space-y-4">
          <h2 className="text-xl font-semibold">Indian Diet Plans by Disease</h2>
          {dietTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Utensils className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No diet templates yet</h3>
                <p className="text-muted-foreground">Seed disease data to generate diet templates.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {dietTemplates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.templateName}</CardTitle>
                      <Badge variant="outline">{template.dietType === "both" ? "Veg & Non-Veg" : template.dietType}</Badge>
                    </div>
                    <CardDescription>For {getDiseaseName(template.diseaseId)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(parseJSONObject(template.mealPlan)).map(([meal, food]: [string, any]) => (
                        <div key={meal} className="flex items-start gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="font-medium capitalize">{meal.replace(/_/g, " ")}:</span>
                            <span className="text-muted-foreground ml-1">{food}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {template.foodsToAvoid && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-semibold text-red-600 mb-2">Foods to Avoid</h4>
                        <div className="flex flex-wrap gap-1">
                          {parseJSON(template.foodsToAvoid).map((food, i) => (
                            <Badge key={i} variant="destructive" className="text-xs">{food}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="medication" className="space-y-4">
          <h2 className="text-xl font-semibold">Medication Schedule Templates</h2>
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800 mb-4">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            <strong>Note:</strong> These are timing guidelines only, NOT prescriptions. Always follow your doctor's advice.
          </div>
          {medicationSchedules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Pill className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No medication schedules yet</h3>
                <p className="text-muted-foreground">Seed disease data to generate medication schedule templates.</p>
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Disease</TableHead>
                  <TableHead>Medicine Category</TableHead>
                  <TableHead>Timing</TableHead>
                  <TableHead>Food Relation</TableHead>
                  <TableHead>Missed Dose</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicationSchedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{getDiseaseName(schedule.diseaseId)}</TableCell>
                    <TableCell>{schedule.medicineCategory}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{schedule.typicalTiming}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={schedule.beforeAfterFood === "before" ? "outline" : "secondary"}>
                        {schedule.beforeAfterFood === "before" ? "Before Food" : schedule.beforeAfterFood === "after" ? "After Food" : "With Food"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {schedule.missedDoseInstructions || "Consult doctor"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Patient Disease Assignments</h2>
          </div>
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
                <p className="text-muted-foreground">Doctors can assign diseases to patients from the Doctor Portal.</p>
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Disease</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Diagnosed Date</TableHead>
                  <TableHead>Assigned By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-mono">{assignment.patientId}</TableCell>
                    <TableCell className="font-medium">{getDiseaseName(assignment.diseaseId)}</TableCell>
                    <TableCell>
                      <Badge variant={assignment.severity === "severe" ? "destructive" : assignment.severity === "moderate" ? "outline" : "secondary"}>
                        {assignment.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{assignment.opdIpdStatus}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(assignment.diagnosedDate), "MMM d, yyyy")}</TableCell>
                    <TableCell>{assignment.assignedByName || assignment.assignedBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}