import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Pill, FileText, Clock, AlertCircle, CheckCircle, Loader2, Save, Send } from "lucide-react";
import type { Prescription, Medicine, ServicePatient } from "@shared/schema";

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
  
  // Clinical info
  const [chiefComplaints, setChiefComplaints] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('');
  const [knownAllergies, setKnownAllergies] = useState('');
  const [pastMedicalHistory, setPastMedicalHistory] = useState('');
  
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
        knownAllergies,
        pastMedicalHistory,
        medicines: allMedicines.map(m => `${m.dosageForm} ${m.medicineName} ${m.strength} - ${FREQUENCIES.find(f => f.value === m.frequency)?.label || 'Once daily'}`),
        medicineDetails: JSON.stringify(allMedicines),
        instructions,
        dietAdvice,
        activityAdvice,
        investigations,
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
    setChiefComplaints('');
    setDiagnosis('');
    setProvisionalDiagnosis('');
    setKnownAllergies('');
    setPastMedicalHistory('');
    setMedicines([]);
    setInstructions('');
    setDietAdvice('');
    setActivityAdvice('');
    setInvestigations('');
    setFollowUpDate('');
  };

  const canFinalize = userRole === 'ADMIN' || userRole === 'DOCTOR';
  
  // Check if current medicine form has data that can be added
  const hasUnaddedMedicine = currentMedicine.medicineName.trim() !== '';
  
  // Include unsaved medicine in validation - either have medicines in list OR have medicine in form
  const isValid = patientName && diagnosis && (medicines.length > 0 || hasUnaddedMedicine);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            New Prescription
          </DialogTitle>
          <DialogDescription>
            Create a prescription for the patient. {!canFinalize && "(OPD Managers can only save drafts)"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          <Tabs defaultValue="patient" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="patient" data-testid="tab-patient">Patient Info</TabsTrigger>
              <TabsTrigger value="clinical" data-testid="tab-clinical">Clinical</TabsTrigger>
              <TabsTrigger value="medicines" data-testid="tab-medicines">Medicines</TabsTrigger>
              <TabsTrigger value="instructions" data-testid="tab-instructions">Instructions</TabsTrigger>
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
                    <Input
                      data-testid="input-vitals-bp"
                      value={vitals.bp}
                      onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                      placeholder="120/80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sugar (mg/dL)</Label>
                    <Input
                      data-testid="input-vitals-sugar"
                      value={vitals.sugar}
                      onChange={(e) => setVitals({ ...vitals, sugar: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pulse (bpm)</Label>
                    <Input
                      data-testid="input-vitals-pulse"
                      value={vitals.pulse}
                      onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                      placeholder="72"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input
                      data-testid="input-vitals-weight"
                      value={vitals.weight}
                      onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                      placeholder="70"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Temp (°F)</Label>
                    <Input
                      data-testid="input-vitals-temp"
                      value={vitals.temp}
                      onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                      placeholder="98.6"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Clinical Tab */}
            <TabsContent value="clinical" className="space-y-4">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Known Allergies</Label>
                      <Input
                        data-testid="input-allergies"
                        value={knownAllergies}
                        onChange={(e) => setKnownAllergies(e.target.value)}
                        placeholder="e.g., Penicillin, Sulfa drugs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Past Medical History</Label>
                      <Input
                        data-testid="input-medical-history"
                        value={pastMedicalHistory}
                        onChange={(e) => setPastMedicalHistory(e.target.value)}
                        placeholder="e.g., Diabetes, Hypertension"
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
          </Tabs>
        </ScrollArea>

        <Separator className="my-4" />

        <DialogFooter className="flex justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {!isValid && (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span>
                  Missing: {!patientName && 'Patient (select from dropdown)'}{!patientName && diagnosis ? '' : (!patientName && !diagnosis ? ', ' : '')}{!diagnosis && 'Diagnosis (Clinical tab)'}{((!patientName || !diagnosis) && medicines.length === 0 && !hasUnaddedMedicine) ? ', ' : ''}{medicines.length === 0 && !hasUnaddedMedicine && 'Medicine (add at least one)'}
                </span>
              </>
            )}
            {isValid && (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Ready to save</span>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              variant="secondary"
              disabled={!isValid || createPrescriptionMutation.isPending}
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
                disabled={!isValid || createPrescriptionMutation.isPending}
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
