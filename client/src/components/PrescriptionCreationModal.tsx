import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BloodPressureInput, IntegerInput, NumericInput, TextOnlyTextarea } from "@/components/validated-inputs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Trash2, Pill, FileText, Clock, AlertCircle, CheckCircle, Loader2, Save, Send, Printer, ChevronsUpDown, Check, X, Lightbulb, Filter, Sparkles, FileStack, Stethoscope, Building2, ClipboardList, Activity, Beaker, UserCheck, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Prescription, Medicine, ServicePatient, LabTestCatalog, OpdPrescriptionTemplate, OpdDepartmentFlows } from "@shared/schema";

interface MedicineItem {
  medicineName: string;
  dosageForm: string;
  strength: string;
  frequency: string;
  mealTiming: string;
  duration: number;
  durationUnit: string;
  specialInstructions: string;
  quantity: number;
}

interface Patient {
  id: string;
  name: string;
  age?: string;
  gender?: string;
  phone?: string;
}

interface PrescriptionCreationModalProps {
  open: boolean;
  onClose: () => void;
  doctorId: string;
  doctorName: string;
  doctorRegistrationNo?: string;
  userRole: 'ADMIN' | 'DOCTOR' | 'OPD_MANAGER';
  userName: string;
  patientId?: string;
  patientName?: string;
  patientAge?: string;
  patientGender?: string;
  visitId?: string;
  onSuccess?: () => void;
}

const DOSAGE_FORMS = [
  { value: 'Tab', label: 'Tablet' },
  { value: 'Cap', label: 'Capsule' },
  { value: 'Syrup', label: 'Syrup' },
  { value: 'Inj', label: 'Injection' },
  { value: 'Cream', label: 'Cream' },
  { value: 'Oint', label: 'Ointment' },
  { value: 'Drop', label: 'Drops' },
  { value: 'Inhaler', label: 'Inhaler' },
  { value: 'Susp', label: 'Suspension' },
  { value: 'Powder', label: 'Powder' },
];

const FREQUENCIES = [
  { value: '1', label: 'Once daily', schedule: ['Morning'] },
  { value: '2', label: 'Twice daily', schedule: ['Morning', 'Night'] },
  { value: '3', label: 'Three times daily', schedule: ['Morning', 'Afternoon', 'Night'] },
  { value: '4', label: 'Four times daily', schedule: ['Morning', 'Afternoon', 'Evening', 'Night'] },
];

const MEAL_TIMINGS = [
  { value: 'before_food', label: 'Before Food' },
  { value: 'after_food', label: 'After Food' },
  { value: 'with_food', label: 'With Food' },
  { value: 'empty_stomach', label: 'Empty Stomach' },
  { value: 'any', label: 'Anytime' },
];

const DURATION_UNITS = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
];

const getScheduleFromFrequency = (frequency: string): string[] => {
  const found = FREQUENCIES.find(f => f.value === frequency);
  return found ? found.schedule : ['Morning'];
};

const calculateQuantity = (frequency: string, duration: number, durationUnit: string): number => {
  let daysMultiplier = 1;
  if (durationUnit === 'weeks') daysMultiplier = 7;
  if (durationUnit === 'months') daysMultiplier = 30;
  
  const totalDays = duration * daysMultiplier;
  const timesPerDay = parseInt(frequency) || 1;
  
  return totalDays * timesPerDay;
};

export default function PrescriptionCreationModal({
  open,
  onClose,
  doctorId,
  doctorName,
  doctorRegistrationNo,
  userRole,
  userName,
  patientId: initialPatientId,
  patientName: initialPatientName,
  patientAge: initialPatientAge,
  patientGender: initialPatientGender,
  visitId,
  onSuccess
}: PrescriptionCreationModalProps) {
  const { toast } = useToast();
  
  // Patient info
  const [patientId, setPatientId] = useState(initialPatientId || '');
  const [patientName, setPatientName] = useState(initialPatientName || '');
  const [patientAge, setPatientAge] = useState(initialPatientAge || '');
  const [patientGender, setPatientGender] = useState(initialPatientGender || '');
  
  // Vitals
  const [vitals, setVitals] = useState({
    bp: '',
    sugar: '',
    pulse: '',
    weight: '',
    temp: '',
  });
  
  // Clinical info - New mandatory fields after Vitals
  const [patientComplaints, setPatientComplaints] = useState('');
  const [doctorObservations, setDoctorObservations] = useState('');
  const [pastHistoryReference, setPastHistoryReference] = useState('');
  
  // Clinical info
  const [chiefComplaints, setChiefComplaints] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('');
  const [knownAllergies, setKnownAllergies] = useState('');
  
  // Medicines
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [currentMedicine, setCurrentMedicine] = useState<MedicineItem>({
    medicineName: '',
    dosageForm: 'Tab',
    strength: '',
    frequency: '1',
    mealTiming: 'after_food',
    duration: 5,
    durationUnit: 'days',
    specialInstructions: '',
    quantity: 5,
  });
  
  // Instructions
  const [instructions, setInstructions] = useState('');
  const [dietAdvice, setDietAdvice] = useState('');
  const [activityAdvice, setActivityAdvice] = useState('');
  const [investigations, setInvestigations] = useState('');
  const [suggestedTests, setSuggestedTests] = useState<string[]>([]);
  const [suggestedTestsOpen, setSuggestedTestsOpen] = useState(false);
  const [suggestedTestsSearch, setSuggestedTestsSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [followUpDate, setFollowUpDate] = useState('');
  
  // Medicine search
  const [medicineSearch, setMedicineSearch] = useState('');
  
  // Fetch patients from database for dropdown
  const { data: patientsFromDB = [] } = useQuery<ServicePatient[]>({
    queryKey: ['/api/patients/service'],
  });
  
  // Fetch medicines for search
  const { data: medicineDatabase = [] } = useQuery<Medicine[]>({
    queryKey: ['/api/medicines'],
    enabled: medicineSearch.length > 1
  });

  // Fetch all lab tests from the pathology module for suggested tests
  const { data: labTestCatalog = [], isLoading: isLoadingLabTests } = useQuery<LabTestCatalog[]>({
    queryKey: ['/api/lab-tests'],
  });

  // Fetch OPD prescription templates for Quick Templates dropdown
  const { data: opdTemplates = [], isLoading: isLoadingTemplates } = useQuery<OpdPrescriptionTemplate[]>({
    queryKey: ['/api/opd-templates'],
  });

  // State for template selection
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');

  // Smart OPD state
  const [smartOpdDepartment, setSmartOpdDepartment] = useState<string>("");
  const [smartOpdSymptoms, setSmartOpdSymptoms] = useState<{id: string; name: string; severity: string; duration: string}[]>([]);
  const [smartOpdObservations, setSmartOpdObservations] = useState<{fieldId: string; name: string; value: string; unit?: string}[]>([]);
  const [smartOpdSuggestions, setSmartOpdSuggestions] = useState<{suggestedTests: any[]; suggestedReferrals: any[]; alerts: string[]}>({
    suggestedTests: [], suggestedReferrals: [], alerts: []
  });
  const [smartOpdStep, setSmartOpdStep] = useState<"department" | "symptoms" | "observations" | "suggestions">("department");

  // Fetch OPD flows for Smart OPD
  const { data: opdFlows = [] } = useQuery<OpdDepartmentFlows[]>({
    queryKey: ['/api/opd-flows'],
  });

  // Get current department config
  const currentDepartmentFlow = opdFlows.find(f => f.departmentCode === smartOpdDepartment);
  const departmentSymptoms: any[] = currentDepartmentFlow?.symptoms ? 
    (typeof currentDepartmentFlow.symptoms === 'string' ? JSON.parse(currentDepartmentFlow.symptoms) : currentDepartmentFlow.symptoms) : [];
  const departmentObservations: any[] = currentDepartmentFlow?.autoObservations ?
    (typeof currentDepartmentFlow.autoObservations === 'string' ? JSON.parse(currentDepartmentFlow.autoObservations) : currentDepartmentFlow.autoObservations) : [];

  // Toggle symptom selection
  const toggleSmartOpdSymptom = (symptom: any) => {
    const exists = smartOpdSymptoms.find(s => s.id === symptom.id);
    if (exists) {
      setSmartOpdSymptoms(smartOpdSymptoms.filter(s => s.id !== symptom.id));
    } else {
      setSmartOpdSymptoms([...smartOpdSymptoms, {
        id: symptom.id,
        name: symptom.name,
        severity: symptom.severity_levels?.[0] || "Mild",
        duration: symptom.duration_options?.[0] || "1-3 days"
      }]);
    }
  };

  // Update symptom details
  const updateSmartOpdSymptom = (symptomId: string, field: string, value: string) => {
    setSmartOpdSymptoms(smartOpdSymptoms.map(s => 
      s.id === symptomId ? { ...s, [field]: value } : s
    ));
  };

  // Update observation value
  const updateSmartOpdObservation = (fieldId: string, name: string, value: string, unit?: string) => {
    const existing = smartOpdObservations.find(o => o.fieldId === fieldId);
    if (existing) {
      setSmartOpdObservations(smartOpdObservations.map(o => o.fieldId === fieldId ? { ...o, value } : o));
    } else {
      setSmartOpdObservations([...smartOpdObservations, { fieldId, name, value, unit }]);
    }
  };

  // Track if Smart OPD suggestions have been applied
  const [smartOpdApplied, setSmartOpdApplied] = useState(false);

  // Apply Smart OPD rules mutation
  const applySmartOpdRulesMutation = useMutation({
    mutationFn: async () => {
      if (!smartOpdDepartment || smartOpdSymptoms.length === 0) {
        throw new Error("Please select a department and at least one symptom");
      }
      const res = await apiRequest("POST", "/api/opd-flows/apply-rules", {
        departmentCode: smartOpdDepartment,
        selectedSymptoms: smartOpdSymptoms.map(s => ({
          id: s.id,
          severity: s.severity,
          duration: s.duration
        })),
        observations: smartOpdObservations.map(o => ({
          fieldId: o.fieldId,
          value: o.value
        })),
        visitType: "new"
      });
      return res.json();
    },
    onSuccess: (data) => {
      setSmartOpdSuggestions({
        suggestedTests: data.suggestedTests || [],
        suggestedReferrals: data.suggestedReferrals || [],
        alerts: data.alerts || []
      });
      setSmartOpdStep("suggestions");
    },
    onError: (error: any) => {
      toast({
        title: "Smart OPD Error",
        description: error.message || "Failed to get suggestions",
        variant: "destructive"
      });
    }
  });

  // Apply Smart OPD data to prescription (called explicitly)
  const applySmartOpdToPrescription = () => {
    if (smartOpdApplied) return; // Prevent duplicate application
    
    // Apply suggested tests
    if (smartOpdSuggestions.suggestedTests.length > 0) {
      const testNames = smartOpdSuggestions.suggestedTests.map((t: any) => t.testName);
      setSuggestedTests(prev => Array.from(new Set([...prev, ...testNames])));
    }
    
    // Apply symptoms to patient complaints (only if not already present)
    if (smartOpdSymptoms.length > 0) {
      const symptomsText = smartOpdSymptoms.map(s => `${s.name} (${s.severity}, ${s.duration})`).join('; ');
      setPatientComplaints(prev => {
        if (prev.includes(symptomsText)) return prev;
        return prev ? `${prev}; ${symptomsText}` : symptomsText;
      });
    }
    
    setSmartOpdApplied(true);
    toast({ title: "Smart OPD Applied", description: "Symptoms and suggested tests have been added to the prescription" });
  };

  // Reset Smart OPD state when modal closes
  const resetSmartOpdState = () => {
    setSmartOpdDepartment("");
    setSmartOpdSymptoms([]);
    setSmartOpdObservations([]);
    setSmartOpdSuggestions({ suggestedTests: [], suggestedReferrals: [], alerts: [] });
    setSmartOpdStep("department");
    setSmartOpdApplied(false);
  };


  // Group templates by category
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, OpdPrescriptionTemplate[]> = {};
    opdTemplates.forEach(template => {
      const category = template.category || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(template);
    });
    return groups;
  }, [opdTemplates]);

  // Filter templates by search
  const filteredTemplates = useMemo(() => {
    if (!templateSearch) return opdTemplates;
    const search = templateSearch.toLowerCase();
    return opdTemplates.filter(t => 
      t.name.toLowerCase().includes(search) ||
      t.category?.toLowerCase().includes(search) ||
      t.description?.toLowerCase().includes(search)
    );
  }, [opdTemplates, templateSearch]);

  // Safe JSON parsing helper
  const safeJsonParse = (data: string | null | undefined, fallback: any = []) => {
    if (!data) return fallback;
    try {
      return JSON.parse(data);
    } catch {
      return fallback;
    }
  };

  // Apply template to form
  const applyTemplate = async (template: OpdPrescriptionTemplate) => {
    try {
      // Parse template data safely
      const templateMedicines = safeJsonParse(template.medicines as string, []);
      const templateSymptoms = safeJsonParse(template.symptoms as string, []);
      const templateInstructions = safeJsonParse(template.instructions as string, '');
      const templateTests = safeJsonParse(template.suggestedTests as string, []);

      // Auto-fill diagnosis with template name and symptoms
      const symptomsText = Array.isArray(templateSymptoms) ? templateSymptoms.join(', ') : '';
      setDiagnosis(template.name);
      setChiefComplaints(symptomsText);

      // Auto-fill medicines (with deduplication based on medicineName)
      if (Array.isArray(templateMedicines) && templateMedicines.length > 0) {
        const newMedicines: MedicineItem[] = templateMedicines.map((med: any) => ({
          medicineName: med.medicineName || '',
          dosageForm: med.dosageForm || 'Tab',
          strength: med.strength || '',
          frequency: med.frequency || '1',
          mealTiming: med.mealTiming || 'after_food',
          duration: med.duration || 5,
          durationUnit: med.durationUnit || 'days',
          specialInstructions: med.specialInstructions || '',
          quantity: calculateQuantity(med.frequency || '1', med.duration || 5, med.durationUnit || 'days'),
        }));
        
        // Deduplicate by medicine name (case-insensitive)
        setMedicines(prev => {
          const existingNames = new Set(prev.map(m => m.medicineName.toLowerCase()));
          const uniqueNewMedicines = newMedicines.filter(m => 
            !existingNames.has(m.medicineName.toLowerCase())
          );
          return [...prev, ...uniqueNewMedicines];
        });
      }

      // Auto-fill instructions (append only if not already present to avoid duplicates)
      if (templateInstructions) {
        setInstructions(prev => {
          if (!prev) return templateInstructions;
          if (prev.includes(templateInstructions)) return prev;
          return `${prev}\n${templateInstructions}`;
        });
      }

      // Auto-fill diet and activity advice (append only if not already present to avoid duplicates)
      if (template.dietAdvice) {
        const dietText = template.dietAdvice;
        setDietAdvice(prev => {
          if (!prev) return dietText;
          if (prev.includes(dietText)) return prev;
          return `${prev}\n${dietText}`;
        });
      }
      if (template.activityAdvice) {
        const activityText = template.activityAdvice;
        setActivityAdvice(prev => {
          if (!prev) return activityText;
          if (prev.includes(activityText)) return prev;
          return `${prev}\n${activityText}`;
        });
      }

      // Auto-fill suggested tests
      if (Array.isArray(templateTests) && templateTests.length > 0) {
        setSuggestedTests(prev => Array.from(new Set([...prev, ...templateTests])));
      }

      // Auto-fill follow-up date if specified
      if (template.followUpDays && template.followUpDays > 0) {
        const followUp = new Date();
        followUp.setDate(followUp.getDate() + template.followUpDays);
        setFollowUpDate(followUp.toISOString().split('T')[0]);
      }

      // Increment usage count
      await apiRequest('POST', `/api/opd-templates/${template.id}/use`);

      setTemplateOpen(false);
      setTemplateSearch('');

      toast({
        title: "Template Applied",
        description: `"${template.name}" template has been applied. Review and modify as needed.`,
      });
    } catch (error) {
      console.error("Error applying template:", error);
      toast({
        title: "Error",
        description: "Failed to apply template",
        variant: "destructive",
      });
    }
  };

  // Get unique categories from lab tests
  const testCategories = useMemo(() => {
    const categories = new Set(labTestCatalog.map(test => test.testCategory));
    return ['all', ...Array.from(categories).sort()];
  }, [labTestCatalog]);

  // Filter lab tests by category and search
  const filteredLabTests = useMemo(() => {
    return labTestCatalog.filter(test => {
      const matchesCategory = selectedCategory === 'all' || test.testCategory === selectedCategory;
      const matchesSearch = suggestedTestsSearch === '' || 
        test.testName.toLowerCase().includes(suggestedTestsSearch.toLowerCase()) ||
        test.testCode.toLowerCase().includes(suggestedTestsSearch.toLowerCase());
      return matchesCategory && matchesSearch && test.isActive;
    });
  }, [labTestCatalog, selectedCategory, suggestedTestsSearch]);

  // Group filtered tests by category for display
  const groupedTests = useMemo(() => {
    const groups: Record<string, LabTestCatalog[]> = {};
    filteredLabTests.forEach(test => {
      if (!groups[test.testCategory]) {
        groups[test.testCategory] = [];
      }
      groups[test.testCategory].push(test);
    });
    return groups;
  }, [filteredLabTests]);

  // Filter medicines based on search
  const filteredMedicines = medicineDatabase.filter(med => 
    med.brandName.toLowerCase().includes(medicineSearch.toLowerCase()) ||
    med.genericName?.toLowerCase().includes(medicineSearch.toLowerCase())
  ).slice(0, 10);

  // Update quantity when frequency or duration changes
  useEffect(() => {
    const qty = calculateQuantity(currentMedicine.frequency, currentMedicine.duration, currentMedicine.durationUnit);
    setCurrentMedicine(prev => ({ ...prev, quantity: qty }));
  }, [currentMedicine.frequency, currentMedicine.duration, currentMedicine.durationUnit]);

  // Reset form when modal opens with new patient
  useEffect(() => {
    if (open) {
      setPatientId(initialPatientId || '');
      setPatientName(initialPatientName || '');
      setPatientAge(initialPatientAge || '');
      setPatientGender(initialPatientGender || '');
    }
  }, [open, initialPatientId, initialPatientName, initialPatientAge, initialPatientGender]);

  // Handle patient selection from dropdown
  const handlePatientSelect = (selectedPatientId: string) => {
    const patient = patientsFromDB.find(p => p.id === selectedPatientId);
    if (patient) {
      setPatientId(patient.id);
      setPatientName(`${patient.firstName} ${patient.lastName}`);
      if (patient.dateOfBirth) {
        const dob = new Date(patient.dateOfBirth);
        const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        setPatientAge(`${age} years`);
      }
      setPatientGender(patient.gender?.toLowerCase() || '');
    }
  };

  const addMedicine = () => {
    if (!currentMedicine.medicineName.trim()) {
      toast({ title: "Please enter medicine name", variant: "destructive" });
      return;
    }
    
    setMedicines([...medicines, { ...currentMedicine }]);
    setCurrentMedicine({
      medicineName: '',
      dosageForm: 'Tab',
      strength: '',
      frequency: '1',
      mealTiming: 'after_food',
      duration: 5,
      durationUnit: 'days',
      specialInstructions: '',
      quantity: 5,
    });
    setMedicineSearch('');
  };

  const removeMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const selectMedicineFromSearch = (medicine: Medicine) => {
    setCurrentMedicine(prev => ({
      ...prev,
      medicineName: medicine.brandName,
      strength: medicine.strength || '',
    }));
    setMedicineSearch('');
  };

  // Create prescription mutation
  const createPrescriptionMutation = useMutation({
    mutationFn: async (finalize: boolean) => {
      // Auto-add medicine from form if it has a name and isn't already added
      let allMedicines = [...medicines];
      if (currentMedicine.medicineName.trim()) {
        allMedicines = [...allMedicines, { ...currentMedicine }];
      }
      
      const prescriptionData = {
        patientId,
        patientName,
        patientAge,
        patientGender,
        visitId: visitId || undefined,
        doctorId,
        doctorName,
        doctorRegistrationNo,
        chiefComplaints,
        diagnosis,
        provisionalDiagnosis,
        vitals: JSON.stringify(vitals),
        patientComplaints,
        doctorObservations,
        pastHistoryReference,
        knownAllergies,
        medicines: allMedicines.map(m => `${m.dosageForm} ${m.medicineName} ${m.strength} - ${FREQUENCIES.find(f => f.value === m.frequency)?.label || 'Once daily'}`),
        medicineDetails: JSON.stringify(allMedicines),
        instructions,
        dietAdvice,
        activityAdvice,
        investigations,
        suggestedTest: suggestedTests.join(', '),
        prescriptionDate: new Date().toISOString().split('T')[0],
        followUpDate: followUpDate || undefined,
        prescriptionStatus: finalize ? 'finalized' : 'draft',
        status: 'active',
        createdByRole: userRole,
        createdByName: userName,
      };

      const response = await apiRequest('POST', '/api/prescriptions/with-items', {
        prescription: prescriptionData,
        items: allMedicines,
      }) as any;

      // If finalizing, call finalize endpoint
      if (finalize && response?.id) {
        await apiRequest('POST', `/api/prescriptions/${response.id}/finalize`, {
          signedBy: doctorId,
          signedByName: doctorName,
          userRole,
        });
      }

      return response;
    },
    onSuccess: (_, finalize) => {
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions/doctor', doctorId] });
      toast({ 
        title: finalize ? "Prescription finalized successfully" : "Prescription saved as draft",
        description: finalize ? "Patient has been notified" : "You can finalize it later"
      });
      resetForm();
      onClose();
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to create prescription", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setPatientId('');
    setPatientName('');
    setPatientAge('');
    setPatientGender('');
    setVitals({ bp: '', sugar: '', pulse: '', weight: '', temp: '' });
    setPatientComplaints('');
    setDoctorObservations('');
    setPastHistoryReference('');
    setChiefComplaints('');
    setDiagnosis('');
    setProvisionalDiagnosis('');
    setKnownAllergies('');
    setMedicines([]);
    setInstructions('');
    setDietAdvice('');
    setActivityAdvice('');
    setInvestigations('');
    setSuggestedTests([]);
    setSuggestedTestsSearch('');
    setSelectedCategory('all');
    setFollowUpDate('');
    setCurrentMedicine({
      medicineName: '',
      dosageForm: 'Tab',
      strength: '',
      frequency: '1',
      mealTiming: 'after_food',
      duration: 5,
      durationUnit: 'days',
      specialInstructions: '',
      quantity: 5,
    });
  };

  // Reset all form state when modal opens or closes
  useEffect(() => {
    if (open) {
      // Reset form when modal opens for a new prescription
      resetForm();
      resetSmartOpdState();
      // If initial patient data is provided, set it after reset
      if (initialPatientId && patientsFromDB.length > 0) {
        const patient = patientsFromDB.find(p => p.id === initialPatientId);
        if (patient) {
          setPatientId(patient.id);
          setPatientName(`${patient.firstName} ${patient.lastName}`);
          setPatientAge(patient.dateOfBirth ? String(Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))) : '');
          setPatientGender(patient.gender || '');
        }
      }
    } else {
      // Reset when modal closes
      resetSmartOpdState();
    }
  }, [open, initialPatientId, patientsFromDB]);

  const canFinalize = userRole === 'ADMIN' || userRole === 'DOCTOR';
  
  // Check if current medicine form has data that can be added
  const hasUnaddedMedicine = currentMedicine.medicineName.trim() !== '';
  
  // Save Draft only needs patient selected
  const canSaveDraft = !!patientName;
  
  // Sign & Finalize needs everything complete - including mandatory fields
  const canFinalizeRx = patientName && diagnosis && patientComplaints && doctorObservations && pastHistoryReference && (medicines.length > 0 || hasUnaddedMedicine);
  
  // Legacy isValid for backward compatibility
  const isValid = canFinalizeRx;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) { resetSmartOpdState(); onClose(); } }}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            New Prescription
          </DialogTitle>
          <DialogDescription>
            Create a prescription for the patient. {!canFinalize && "(OPD Managers can only save drafts)"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          <Tabs defaultValue="patient" className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-4">
              <TabsTrigger value="patient" data-testid="tab-patient">Patient Info</TabsTrigger>
              <TabsTrigger value="clinical" data-testid="tab-clinical">Clinical</TabsTrigger>
              <TabsTrigger value="medicines" data-testid="tab-medicines">Medicines</TabsTrigger>
              <TabsTrigger value="instructions" data-testid="tab-instructions">Instructions</TabsTrigger>
              <TabsTrigger value="suggested-test" data-testid="tab-suggested-test">Suggested Test</TabsTrigger>
              <TabsTrigger value="smart-opd" data-testid="tab-smart-opd" className="flex items-center gap-1">
                <Stethoscope className="h-3 w-3" />
                Smart OPD
              </TabsTrigger>
            </TabsList>

            {/* Patient Info Tab */}
            <TabsContent value="patient" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Patient Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Patient from Database *</Label>
                    <Select value={patientId} onValueChange={handlePatientSelect}>
                      <SelectTrigger data-testid="select-patient-dropdown">
                        <SelectValue placeholder="Choose a patient..." />
                      </SelectTrigger>
                      <SelectContent>
                        {patientsFromDB.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.firstName} {patient.lastName} - {patient.gender}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Patient Name</Label>
                      <Input
                        data-testid="input-patient-name"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Auto-filled from selection"
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Patient ID</Label>
                      <Input
                        data-testid="input-patient-id"
                        value={patientId}
                        readOnly
                        className="bg-muted font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Age</Label>
                      <Input
                        data-testid="input-patient-age"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        placeholder="e.g., 45 years"
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Input
                        data-testid="input-patient-gender-display"
                        value={patientGender ? patientGender.charAt(0).toUpperCase() + patientGender.slice(1) : ''}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Vitals</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>BP (mmHg)</Label>
                    <BloodPressureInput
                      data-testid="input-vitals-bp"
                      value={vitals.bp}
                      onValueChange={(value) => setVitals({ ...vitals, bp: value })}
                      placeholder="120/80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sugar (mg/dL)</Label>
                    <IntegerInput
                      data-testid="input-vitals-sugar"
                      value={vitals.sugar}
                      onValueChange={(value) => setVitals({ ...vitals, sugar: value })}
                      placeholder="100"
                      min={20}
                      max={600}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pulse (bpm)</Label>
                    <IntegerInput
                      data-testid="input-vitals-pulse"
                      value={vitals.pulse}
                      onValueChange={(value) => setVitals({ ...vitals, pulse: value })}
                      placeholder="72"
                      min={30}
                      max={250}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <NumericInput
                      data-testid="input-vitals-weight"
                      value={vitals.weight}
                      onValueChange={(value) => setVitals({ ...vitals, weight: value })}
                      placeholder="70"
                      allowDecimal={true}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Temp (°F)</Label>
                    <NumericInput
                      data-testid="input-vitals-temp"
                      value={vitals.temp}
                      onValueChange={(value) => setVitals({ ...vitals, temp: value })}
                      placeholder="98.6"
                      allowDecimal={true}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Patient Complaints, Doctor Observations, Past History Reference - Required Fields */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Clinical Notes *</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientComplaints">Patient Complaints *</Label>
                    <Textarea
                      id="patientComplaints"
                      data-testid="input-patient-complaints"
                      value={patientComplaints}
                      onChange={(e) => setPatientComplaints(e.target.value)}
                      placeholder="Enter patient's complaints in their own words..."
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctorObservations">Doctor Observations *</Label>
                    <Textarea
                      id="doctorObservations"
                      data-testid="input-doctor-observations"
                      value={doctorObservations}
                      onChange={(e) => setDoctorObservations(e.target.value)}
                      placeholder="Enter clinical observations and findings..."
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pastHistoryReference">Past History Reference *</Label>
                    <Textarea
                      id="pastHistoryReference"
                      data-testid="input-past-history-reference"
                      value={pastHistoryReference}
                      onChange={(e) => setPastHistoryReference(e.target.value)}
                      placeholder="Reference to patient's past medical history, previous prescriptions, etc..."
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="knownAllergies">Known Allergies</Label>
                    <Input
                      id="knownAllergies"
                      data-testid="input-known-allergies"
                      value={knownAllergies}
                      onChange={(e) => setKnownAllergies(e.target.value)}
                      placeholder="e.g., Penicillin, Sulfa drugs"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Clinical Tab */}
            <TabsContent value="clinical" className="space-y-4">
              {/* Quick OPD Templates */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Quick OPD Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Popover open={templateOpen} onOpenChange={setTemplateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={templateOpen}
                          className="w-full justify-between"
                          data-testid="button-quick-template"
                        >
                          <div className="flex items-center gap-2">
                            <FileStack className="h-4 w-4" />
                            <span>Select a template to auto-fill prescription...</span>
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[500px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Search templates..."
                            value={templateSearch}
                            onValueChange={setTemplateSearch}
                            data-testid="input-template-search"
                          />
                          <CommandList>
                            {isLoadingTemplates ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                                Loading templates...
                              </div>
                            ) : filteredTemplates.length === 0 ? (
                              <CommandEmpty>No templates found.</CommandEmpty>
                            ) : (
                              Object.entries(groupedTemplates).map(([category, templates]) => {
                                const categoryTemplates = templates.filter(t =>
                                  !templateSearch ||
                                  t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                                  t.description?.toLowerCase().includes(templateSearch.toLowerCase())
                                );
                                if (categoryTemplates.length === 0) return null;
                                return (
                                  <CommandGroup key={category} heading={category}>
                                    {categoryTemplates.map((template) => (
                                      <CommandItem
                                        key={template.id}
                                        value={template.id}
                                        onSelect={() => applyTemplate(template)}
                                        className="flex items-start gap-2 py-2"
                                        data-testid={`template-item-${template.slug}`}
                                      >
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium">{template.name}</span>
                                            {template.isSystemTemplate && (
                                              <Badge variant="secondary" className="text-xs">System</Badge>
                                            )}
                                          </div>
                                          {template.description && (
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                              {template.description}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                            {template.followUpDays && (
                                              <span>Follow-up: {template.followUpDays} days</span>
                                            )}
                                            {template.usageCount && template.usageCount > 0 && (
                                              <span>Used: {template.usageCount}x</span>
                                            )}
                                          </div>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                );
                              })
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Templates will auto-fill diagnosis, medicines, instructions, diet advice, and suggested tests. You can modify after applying.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Chief Complaints</Label>
                    <Textarea
                      data-testid="input-chief-complaints"
                      value={chiefComplaints}
                      onChange={(e) => setChiefComplaints(e.target.value)}
                      placeholder="Enter patient's chief complaints..."
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Diagnosis *</Label>
                      <Textarea
                        data-testid="input-diagnosis"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="Enter diagnosis..."
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Provisional Diagnosis</Label>
                      <Textarea
                        data-testid="input-provisional-diagnosis"
                        value={provisionalDiagnosis}
                        onChange={(e) => setProvisionalDiagnosis(e.target.value)}
                        placeholder="If different from final diagnosis..."
                        rows={2}
                      />
                    </div>
                  </div>
                  </CardContent>
              </Card>
            </TabsContent>

            {/* Medicines Tab */}
            <TabsContent value="medicines" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    Add Medicine
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2 col-span-2 relative">
                      <Label>Medicine Name *</Label>
                      <Input
                        data-testid="input-medicine-name"
                        value={currentMedicine.medicineName || medicineSearch}
                        onChange={(e) => {
                          setMedicineSearch(e.target.value);
                          setCurrentMedicine(prev => ({ ...prev, medicineName: e.target.value }));
                        }}
                        placeholder="Type to search or enter medicine name"
                      />
                      {medicineSearch && filteredMedicines.length > 0 && (
                        <Card className="absolute z-10 w-full mt-1 max-h-48 overflow-auto">
                          <CardContent className="p-2">
                            {filteredMedicines.map((med) => (
                              <div
                                key={med.id}
                                className="p-2 hover-elevate cursor-pointer rounded text-sm"
                                onClick={() => selectMedicineFromSearch(med)}
                              >
                                <span className="font-medium">{med.brandName}</span>
                                {med.strength && <span className="text-muted-foreground ml-2">{med.strength}</span>}
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Form</Label>
                      <Select 
                        value={currentMedicine.dosageForm} 
                        onValueChange={(v) => setCurrentMedicine(prev => ({ ...prev, dosageForm: v }))}
                      >
                        <SelectTrigger data-testid="select-dosage-form">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOSAGE_FORMS.map(form => (
                            <SelectItem key={form.value} value={form.value}>{form.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Strength</Label>
                      <Input
                        data-testid="input-strength"
                        value={currentMedicine.strength}
                        onChange={(e) => setCurrentMedicine(prev => ({ ...prev, strength: e.target.value }))}
                        placeholder="e.g., 5mg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select 
                        value={currentMedicine.frequency} 
                        onValueChange={(v) => setCurrentMedicine(prev => ({ ...prev, frequency: v }))}
                      >
                        <SelectTrigger data-testid="select-frequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCIES.map(freq => (
                            <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Timing</Label>
                      <Select 
                        value={currentMedicine.mealTiming} 
                        onValueChange={(v) => setCurrentMedicine(prev => ({ ...prev, mealTiming: v }))}
                      >
                        <SelectTrigger data-testid="select-meal-timing">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MEAL_TIMINGS.map(timing => (
                            <SelectItem key={timing.value} value={timing.value}>{timing.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          data-testid="input-duration"
                          className="w-16"
                          value={currentMedicine.duration}
                          onChange={(e) => setCurrentMedicine(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                          min={1}
                        />
                        <Select 
                          value={currentMedicine.durationUnit} 
                          onValueChange={(v) => setCurrentMedicine(prev => ({ ...prev, durationUnit: v }))}
                        >
                          <SelectTrigger data-testid="select-duration-unit" className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DURATION_UNITS.map(unit => (
                              <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <Label>Special Instructions</Label>
                      <Input
                        data-testid="input-special-instructions"
                        value={currentMedicine.specialInstructions}
                        onChange={(e) => setCurrentMedicine(prev => ({ ...prev, specialInstructions: e.target.value }))}
                        placeholder="e.g., Take with warm water"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Auto Schedule</Label>
                      <div className="flex gap-1">
                        {getScheduleFromFrequency(currentMedicine.frequency).map(time => (
                          <Badge key={time} variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {time}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      onClick={addMedicine}
                      className="mt-6"
                      data-testid="button-add-medicine"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Medicine List */}
              {medicines.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Prescribed Medicines ({medicines.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {medicines.map((med, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{index + 1}.</span>
                              <Badge variant="outline">{med.dosageForm}</Badge>
                              <span className="font-medium">{med.medicineName}</span>
                              {med.strength && <span className="text-muted-foreground">{med.strength}</span>}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-2">
                              <span>{FREQUENCIES.find(f => f.value === med.frequency)?.label}</span>
                              <span>•</span>
                              <span>{MEAL_TIMINGS.find(t => t.value === med.mealTiming)?.label}</span>
                              <span>•</span>
                              <span>{med.duration} {med.durationUnit}</span>
                              <span>•</span>
                              <span>Qty: {med.quantity}</span>
                              {med.specialInstructions && (
                                <>
                                  <span>•</span>
                                  <span className="text-orange-600">{med.specialInstructions}</span>
                                </>
                              )}
                            </div>
                            <div className="flex gap-1 mt-1">
                              {getScheduleFromFrequency(med.frequency).map(time => (
                                <Badge key={time} variant="secondary" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {time}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMedicine(index)}
                            data-testid={`button-remove-medicine-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Instructions Tab */}
            <TabsContent value="instructions" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label>General Instructions</Label>
                    <Textarea
                      data-testid="input-instructions"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="Enter general instructions for the patient..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Diet Advice</Label>
                      <Textarea
                        data-testid="input-diet-advice"
                        value={dietAdvice}
                        onChange={(e) => setDietAdvice(e.target.value)}
                        placeholder="e.g., Avoid spicy food, increase water intake..."
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Activity Advice</Label>
                      <Textarea
                        data-testid="input-activity-advice"
                        value={activityAdvice}
                        onChange={(e) => setActivityAdvice(e.target.value)}
                        placeholder="e.g., Rest for 2 days, light walking..."
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Investigations Advised</Label>
                      <Textarea
                        data-testid="input-investigations"
                        value={investigations}
                        onChange={(e) => setInvestigations(e.target.value)}
                        placeholder="e.g., CBC, Blood Sugar, X-Ray..."
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Follow-up Date</Label>
                      <Input
                        type="date"
                        data-testid="input-follow-up-date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Suggested Test Tab - Modern Card UI */}
            <TabsContent value="suggested-test" className="space-y-4">
              {/* Header Card with Gradient */}
              <Card className="border-0 bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-transparent">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/20">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Suggested Tests</h3>
                      <p className="text-sm text-muted-foreground">
                        Select lab tests to recommend for additional diagnosis. Search from {labTestCatalog.length}+ available tests synced from Pathology module.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Filter & Search Card */}
              <Card>
                <CardContent className="pt-4 space-y-4">
                  {/* Category Filter */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-muted">
                        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <Label className="text-sm font-medium">Filter by Category:</Label>
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-[200px]" data-testid="select-test-category">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        {testCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category === 'all' ? 'All Categories' : category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCategory !== 'all' && (
                      <Badge variant="outline" className="bg-primary/10">
                        {filteredLabTests.length} tests in category
                      </Badge>
                    )}
                  </div>
                  
                  {/* Search Dropdown */}
                  <Popover open={suggestedTestsOpen} onOpenChange={setSuggestedTestsOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={suggestedTestsOpen}
                        className="w-full justify-between h-auto min-h-[44px] text-left border-dashed hover:border-primary/50 transition-colors"
                        data-testid="button-suggested-tests-dropdown"
                        disabled={isLoadingLabTests}
                      >
                        {isLoadingLabTests ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading tests...
                          </span>
                        ) : suggestedTests.length > 0 ? (
                          <span className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {suggestedTests.length} test{suggestedTests.length > 1 ? 's' : ''} selected
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Plus className="h-4 w-4" />
                            Click to search and select tests...
                          </span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                      <Command>
                        <CommandInput 
                          placeholder="Search tests by name or code..." 
                          value={suggestedTestsSearch}
                          onValueChange={setSuggestedTestsSearch}
                          data-testid="input-suggested-tests-search"
                        />
                        <CommandList className="max-h-[350px]">
                          <CommandEmpty>No tests found. Try a different search or category.</CommandEmpty>
                          {Object.entries(groupedTests).slice(0, 10).map(([category, tests]) => (
                            <CommandGroup key={category} heading={category}>
                              {tests.slice(0, 15).map((test) => (
                                <CommandItem
                                  key={test.id}
                                  value={test.testName}
                                  onSelect={() => {
                                    setSuggestedTests(prev => 
                                      prev.includes(test.testName)
                                        ? prev.filter(t => t !== test.testName)
                                        : [...prev, test.testName]
                                    );
                                  }}
                                  data-testid={`option-test-${test.testCode}`}
                                  className="cursor-pointer"
                                >
                                  <div className={`mr-2 h-4 w-4 rounded-sm border flex items-center justify-center ${
                                    suggestedTests.includes(test.testName) 
                                      ? "bg-primary border-primary" 
                                      : "border-muted-foreground/30"
                                  }`}>
                                    {suggestedTests.includes(test.testName) && (
                                      <Check className="h-3 w-3 text-primary-foreground" />
                                    )}
                                  </div>
                                  <div className="flex flex-col flex-1">
                                    <span className="truncate font-medium">{test.testName}</span>
                                    <span className="text-xs text-muted-foreground">{test.testCode} - {test.sampleType}</span>
                                  </div>
                                  <Badge variant="outline" className="ml-2 text-xs shrink-0">
                                    {test.price}
                                  </Badge>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          ))}
                          {Object.keys(groupedTests).length === 0 && filteredLabTests.length === 0 && !isLoadingLabTests && (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              No tests match your search criteria
                            </div>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>

              {/* Selected Tests Display */}
              {suggestedTests.length > 0 && (
                <Card className="border-green-500/30 bg-gradient-to-r from-green-500/5 to-transparent">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-green-500/20">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                        <CardTitle className="text-base">Selected Tests ({suggestedTests.length})</CardTitle>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSuggestedTests([])}
                        data-testid="button-clear-all-tests"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex flex-wrap gap-2">
                      {suggestedTests.map((testName) => (
                        <Badge
                          key={testName}
                          variant="secondary"
                          className="flex items-center gap-1 px-3 py-1.5 bg-background border hover:bg-muted transition-colors"
                          data-testid={`badge-selected-test-${testName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                        >
                          <span className="truncate max-w-[200px]">{testName}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20 rounded-full"
                            onClick={() => setSuggestedTests(prev => prev.filter(t => t !== testName))}
                            data-testid={`button-remove-test-${testName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {suggestedTests.length === 0 && !isLoadingLabTests && (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <div className="p-3 rounded-full bg-muted w-fit mx-auto mb-3">
                      <Lightbulb className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No tests selected yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Use the search above to find and select lab tests to recommend
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Smart OPD Tab - Clinical Workflow Engine */}
            <TabsContent value="smart-opd" className="space-y-4">
              <Card className="border-0 bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/20">
                        <Stethoscope className="h-5 w-5 text-cyan-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Smart OPD Consultation</h3>
                        <p className="text-sm text-muted-foreground">Department-specific clinical workflow engine</p>
                      </div>
                    </div>
                    <Badge variant="outline">{opdFlows.length} Departments</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Step Navigation */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Button
                  size="sm"
                  variant={smartOpdStep === "department" ? "default" : "outline"}
                  onClick={() => setSmartOpdStep("department")}
                  className="shrink-0"
                  data-testid="smart-opd-step-department"
                >
                  <Building2 className="h-3 w-3 mr-1" />
                  1. Department
                </Button>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                <Button
                  size="sm"
                  variant={smartOpdStep === "symptoms" ? "default" : "outline"}
                  onClick={() => setSmartOpdStep("symptoms")}
                  disabled={!smartOpdDepartment}
                  className="shrink-0"
                  data-testid="smart-opd-step-symptoms"
                >
                  <ClipboardList className="h-3 w-3 mr-1" />
                  2. Symptoms
                </Button>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                <Button
                  size="sm"
                  variant={smartOpdStep === "observations" ? "default" : "outline"}
                  onClick={() => setSmartOpdStep("observations")}
                  disabled={smartOpdSymptoms.length === 0}
                  className="shrink-0"
                  data-testid="smart-opd-step-observations"
                >
                  <Activity className="h-3 w-3 mr-1" />
                  3. Observations
                </Button>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                <Button
                  size="sm"
                  variant={smartOpdStep === "suggestions" ? "default" : "outline"}
                  onClick={() => smartOpdSymptoms.length > 0 && applySmartOpdRulesMutation.mutate()}
                  disabled={smartOpdSymptoms.length === 0}
                  className="shrink-0"
                  data-testid="smart-opd-step-suggestions"
                >
                  <Lightbulb className="h-3 w-3 mr-1" />
                  4. Suggestions
                </Button>
              </div>

              {/* Department Selection Step */}
              {smartOpdStep === "department" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building2 className="h-4 w-4" />
                      Select Department
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {opdFlows.length === 0 ? (
                      <div className="text-center py-8">
                        <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground mb-2">No OPD departments configured</p>
                        <p className="text-sm text-muted-foreground">Contact your administrator to set up department-specific clinical workflows.</p>
                      </div>
                    ) : (
                    <ScrollArea className="h-[300px] pr-2">
                      <div className="grid gap-2">
                        {opdFlows.map(flow => (
                          <Button
                            key={flow.departmentCode}
                            variant={smartOpdDepartment === flow.departmentCode ? "default" : "outline"}
                            className="justify-start h-auto py-3 px-4"
                            onClick={() => {
                              setSmartOpdDepartment(flow.departmentCode);
                              setSmartOpdSymptoms([]);
                              setSmartOpdObservations([]);
                              setSmartOpdSuggestions({ suggestedTests: [], suggestedReferrals: [], alerts: [] });
                              setSmartOpdStep("symptoms");
                            }}
                            data-testid={`smart-opd-dept-${flow.departmentCode}`}
                          >
                            <div className="text-left flex-1">
                              <div className="font-medium">{flow.departmentName}</div>
                              <div className="text-xs opacity-70">
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
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Symptoms Selection Step */}
              {smartOpdStep === "symptoms" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ClipboardList className="h-4 w-4" />
                      Select Symptoms - {currentDepartmentFlow?.departmentName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px] pr-2">
                      <div className="space-y-3">
                        {departmentSymptoms.map((symptom: any) => {
                          const isSelected = smartOpdSymptoms.find(s => s.id === symptom.id);
                          return (
                            <Card key={symptom.id} className={isSelected ? "border-primary" : ""}>
                              <CardContent className="p-3">
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    checked={!!isSelected}
                                    onCheckedChange={(checked) => {
                                      if (checked === true && !isSelected) {
                                        toggleSmartOpdSymptom(symptom);
                                      } else if (checked === false && isSelected) {
                                        toggleSmartOpdSymptom(symptom);
                                      }
                                    }}
                                    data-testid={`smart-opd-symptom-${symptom.id}`}
                                  />
                                  <div className="flex-1 space-y-2">
                                    <Label className="font-medium cursor-pointer" onClick={() => toggleSmartOpdSymptom(symptom)}>
                                      {symptom.name}
                                    </Label>
                                    {isSelected && (
                                      <div className="grid grid-cols-2 gap-2">
                                        <Select
                                          value={isSelected.severity}
                                          onValueChange={(val) => updateSmartOpdSymptom(symptom.id, "severity", val)}
                                        >
                                          <SelectTrigger className="h-8">
                                            <SelectValue placeholder="Severity" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {(symptom.severity_levels || ["Mild", "Moderate", "Severe"]).map((level: string) => (
                                              <SelectItem key={level} value={level}>{level}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <Select
                                          value={isSelected.duration}
                                          onValueChange={(val) => updateSmartOpdSymptom(symptom.id, "duration", val)}
                                        >
                                          <SelectTrigger className="h-8">
                                            <SelectValue placeholder="Duration" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {(symptom.duration_options || ["1-3 days", "3-7 days", "1-2 weeks", ">2 weeks"]).map((opt: string) => (
                                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                        {departmentSymptoms.length === 0 && (
                          <p className="text-center text-muted-foreground py-8">No symptoms configured for this department</p>
                        )}
                      </div>
                    </ScrollArea>
                    <div className="flex justify-between mt-4">
                      <Button variant="outline" onClick={() => setSmartOpdStep("department")}>Back</Button>
                      <Button onClick={() => setSmartOpdStep("observations")} disabled={smartOpdSymptoms.length === 0}>
                        Continue to Observations
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Observations Step */}
              {smartOpdStep === "observations" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="h-4 w-4" />
                      Clinical Observations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px] pr-2">
                      <div className="grid grid-cols-2 gap-4">
                        {departmentObservations.map((obs: any) => (
                          <div key={obs.id} className="space-y-1">
                            <Label className="text-sm">{obs.name} {obs.unit && `(${obs.unit})`}</Label>
                            {obs.type === "select" ? (
                              <Select
                                value={smartOpdObservations.find(o => o.fieldId === obs.id)?.value || ""}
                                onValueChange={(val) => updateSmartOpdObservation(obs.id, obs.name, val, obs.unit)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {(obs.options || []).map((opt: string) => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type={obs.type === "number" ? "number" : "text"}
                                placeholder={obs.name}
                                value={smartOpdObservations.find(o => o.fieldId === obs.id)?.value || ""}
                                onChange={(e) => updateSmartOpdObservation(obs.id, obs.name, e.target.value, obs.unit)}
                                className="h-9"
                              />
                            )}
                          </div>
                        ))}
                        {departmentObservations.length === 0 && (
                          <p className="col-span-2 text-center text-muted-foreground py-8">No specific observations for this department</p>
                        )}
                      </div>
                    </ScrollArea>
                    <div className="flex justify-between mt-4">
                      <Button variant="outline" onClick={() => setSmartOpdStep("symptoms")}>Back</Button>
                      <Button onClick={() => applySmartOpdRulesMutation.mutate()} disabled={applySmartOpdRulesMutation.isPending}>
                        {applySmartOpdRulesMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Lightbulb className="h-4 w-4 mr-2" />
                        )}
                        Get Smart Suggestions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Suggestions Step */}
              {smartOpdStep === "suggestions" && (
                <div className="space-y-4">
                  {smartOpdSuggestions.alerts.length > 0 && (
                    <Card className="border-red-500/50 bg-red-500/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 text-red-500">
                          <AlertCircle className="h-4 w-4" />
                          Clinical Alerts
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {smartOpdSuggestions.alerts.map((alert, idx) => (
                            <li key={idx}>{alert}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Beaker className="h-4 w-4 text-blue-500" />
                          Suggested Investigations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {smartOpdSuggestions.suggestedTests.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No specific tests suggested</p>
                        ) : (
                          <div className="space-y-2">
                            {smartOpdSuggestions.suggestedTests.map((test: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Checkbox defaultChecked />
                                  <span className="text-sm">{test.testName}</span>
                                </div>
                                <Badge variant={test.priority === "urgent" ? "destructive" : "secondary"} className="text-xs">
                                  {test.priority}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-green-500" />
                          Suggested Referrals
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {smartOpdSuggestions.suggestedReferrals.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No referrals suggested</p>
                        ) : (
                          <div className="space-y-2">
                            {smartOpdSuggestions.suggestedReferrals.map((ref: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                <span className="text-sm">{ref.department}</span>
                                <Badge variant="outline" className="text-xs">{ref.reason}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setSmartOpdStep("observations")}>Back</Button>
                    <Button onClick={applySmartOpdToPrescription} disabled={smartOpdApplied}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {smartOpdApplied ? "Applied" : "Apply to Prescription"}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <Separator className="my-4 flex-shrink-0" />

        <DialogFooter className="flex-shrink-0 flex justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {!canSaveDraft && (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span>Select a patient to save draft</span>
              </>
            )}
            {canSaveDraft && !canFinalizeRx && (
              <>
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <span>Draft ready. To finalize: {!diagnosis && 'add diagnosis'}{!diagnosis && (medicines.length === 0 && !hasUnaddedMedicine) ? ', ' : ''}{medicines.length === 0 && !hasUnaddedMedicine && 'add medicine'}</span>
              </>
            )}
            {canFinalizeRx && (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Ready to save or finalize</span>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              variant="secondary"
              disabled={!canSaveDraft || createPrescriptionMutation.isPending}
              onClick={() => createPrescriptionMutation.mutate(false)}
              data-testid="button-save-draft"
            >
              {createPrescriptionMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save Draft
            </Button>
            {canFinalize && (
              <Button
                disabled={!canFinalizeRx || createPrescriptionMutation.isPending}
                onClick={() => createPrescriptionMutation.mutate(true)}
                data-testid="button-finalize"
              >
                {createPrescriptionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                Sign & Finalize
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
