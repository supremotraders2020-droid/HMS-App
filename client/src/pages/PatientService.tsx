import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Users, 
  UserPlus, 
  BedDouble, 
  FileText, 
  Search, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  Stethoscope,
  Shield,
  Building,
  ClipboardList,
  UserCheck,
  LogOut,
  Plus,
  Loader2
} from "lucide-react";
import { insertServicePatientSchema, insertAdmissionSchema, insertMedicalRecordSchema } from "@shared/schema";
import type { ServicePatient, Admission, MedicalRecord } from "@shared/schema";
import { z } from "zod";

const patientFormSchema = insertServicePatientSchema.extend({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
});

const admissionFormSchema = insertAdmissionSchema.extend({
  patientId: z.string().min(1, "Patient is required"),
  department: z.string().min(1, "Department is required"),
  admittingPhysician: z.string().min(1, "Physician is required"),
});

const medicalRecordFormSchema = insertMedicalRecordSchema.extend({
  patientId: z.string().min(1, "Patient is required"),
  recordType: z.string().min(1, "Record type is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  physician: z.string().min(1, "Physician is required"),
});

export default function PatientService() {
  const [activeTab, setActiveTab] = useState("patients");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<ServicePatient | null>(null);
  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false);
  const [showNewAdmissionDialog, setShowNewAdmissionDialog] = useState(false);
  const [showNewRecordDialog, setShowNewRecordDialog] = useState(false);
  const { toast } = useToast();

  const { data: patients = [], isLoading: patientsLoading } = useQuery<ServicePatient[]>({
    queryKey: ["/api/patients/service"],
  });

  const { data: admissions = [], isLoading: admissionsLoading } = useQuery<Admission[]>({
    queryKey: ["/api/admissions"],
  });

  const { data: activeAdmissions = [] } = useQuery<Admission[]>({
    queryKey: ["/api/admissions/active"],
  });

  const { data: medicalRecords = [], isLoading: recordsLoading } = useQuery<MedicalRecord[]>({
    queryKey: ["/api/medical-records"],
  });

  const patientForm = useForm({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      phone: "",
      email: "",
      address: "",
      emergencyContact: "",
      emergencyPhone: "",
      insuranceProvider: "",
      insuranceNumber: "",
    },
  });

  const admissionForm = useForm({
    resolver: zodResolver(admissionFormSchema),
    defaultValues: {
      patientId: "",
      department: "",
      roomNumber: "",
      admittingPhysician: "",
      primaryDiagnosis: "",
      notes: "",
    },
  });

  const recordForm = useForm({
    resolver: zodResolver(medicalRecordFormSchema),
    defaultValues: {
      patientId: "",
      recordType: "",
      title: "",
      description: "",
      physician: "",
    },
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: z.infer<typeof patientFormSchema>) => {
      return await apiRequest("POST", "/api/patients/service", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients/service"] });
      toast({ title: "Success", description: "Patient registered successfully" });
      setShowNewPatientDialog(false);
      patientForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to register patient", variant: "destructive" });
    },
  });

  const createAdmissionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof admissionFormSchema>) => {
      return await apiRequest("POST", "/api/admissions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admissions/active"] });
      toast({ title: "Success", description: "Patient admitted successfully" });
      setShowNewAdmissionDialog(false);
      admissionForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create admission", variant: "destructive" });
    },
  });

  const dischargeMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      return await apiRequest("POST", `/api/admissions/${id}/discharge`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admissions/active"] });
      toast({ title: "Success", description: "Patient discharged successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to discharge patient", variant: "destructive" });
    },
  });

  const createRecordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof medicalRecordFormSchema>) => {
      return await apiRequest("POST", "/api/medical-records", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-records"] });
      toast({ title: "Success", description: "Medical record created successfully" });
      setShowNewRecordDialog(false);
      recordForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create record", variant: "destructive" });
    },
  });

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : "Unknown";
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      admitted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      discharged: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
      transferred: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    };
    return styles[status] || styles.admitted;
  };

  const getRecordTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      diagnosis: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      treatment: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      prescription: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      lab_result: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      note: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    };
    return styles[type] || styles.note;
  };

  const filteredPatients = patients.filter((patient) =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const departments = ["Cardiology", "Orthopedics", "General Medicine", "Pediatrics", "Dermatology", "Neurology", "Gynecology", "Oncology"];
  const physicians = ["Dr. Priya Sharma", "Dr. Rajesh Kumar", "Dr. Amit Singh", "Dr. Kavita Joshi", "Dr. Neha Verma", "Dr. Arjun Patel"];
  const recordTypes = [
    { value: "diagnosis", label: "Diagnosis" },
    { value: "treatment", label: "Treatment" },
    { value: "prescription", label: "Prescription" },
    { value: "lab_result", label: "Lab Result" },
    { value: "note", label: "Clinical Note" },
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Patient Service</h1>
            <p className="text-muted-foreground">Manage patient demographics, admissions, and medical records</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patients.length}</p>
                <p className="text-sm text-muted-foreground">Total Patients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <BedDouble className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeAdmissions.length}</p>
                <p className="text-sm text-muted-foreground">Active Admissions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{medicalRecords.length}</p>
                <p className="text-sm text-muted-foreground">Medical Records</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <ClipboardList className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{admissions.length}</p>
                <p className="text-sm text-muted-foreground">Total Admissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="patients" className="flex items-center gap-2" data-testid="tab-patients">
            <Users className="h-4 w-4" />
            Patients
          </TabsTrigger>
          <TabsTrigger value="admissions" className="flex items-center gap-2" data-testid="tab-admissions">
            <BedDouble className="h-4 w-4" />
            Admissions
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2" data-testid="tab-records">
            <FileText className="h-4 w-4" />
            Medical Records
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patients">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>Patient Registry</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                    data-testid="input-search-patients"
                  />
                </div>
                <Dialog open={showNewPatientDialog} onOpenChange={setShowNewPatientDialog}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-new-patient">
                      <UserPlus className="h-4 w-4 mr-2" />
                      New Patient
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Register New Patient</DialogTitle>
                    </DialogHeader>
                    <Form {...patientForm}>
                      <form onSubmit={patientForm.handleSubmit((data) => createPatientMutation.mutate(data))} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={patientForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-first-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={patientForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-last-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={patientForm.control}
                            name="dateOfBirth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date of Birth *</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} data-testid="input-dob" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={patientForm.control}
                            name="gender"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Gender *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-gender">
                                      <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={patientForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-phone" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={patientForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} data-testid="input-email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={patientForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Textarea {...field} data-testid="input-address" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={patientForm.control}
                            name="emergencyContact"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Emergency Contact</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-emergency-contact" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={patientForm.control}
                            name="emergencyPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Emergency Phone</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-emergency-phone" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={patientForm.control}
                            name="insuranceProvider"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Insurance Provider</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-insurance-provider" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={patientForm.control}
                            name="insuranceNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Insurance Number</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-insurance-number" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button type="button" variant="outline" onClick={() => setShowNewPatientDialog(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createPatientMutation.isPending} data-testid="button-submit-patient">
                            {createPatientMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Register Patient
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {patientsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No patients found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPatients.map((patient) => (
                    <Card key={patient.id} className="hover-elevate cursor-pointer" onClick={() => setSelectedPatient(patient)} data-testid={`card-patient-${patient.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-primary/10 rounded-full">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{patient.firstName} {patient.lastName}</h3>
                            <p className="text-sm text-muted-foreground">{patient.gender} • {patient.dateOfBirth}</p>
                            <div className="mt-2 space-y-1">
                              {patient.phone && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {patient.phone}
                                </div>
                              )}
                              {patient.email && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate">{patient.email}</span>
                                </div>
                              )}
                              {patient.insuranceProvider && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Shield className="h-3 w-3 text-green-600" />
                                  <span className="text-green-600">{patient.insuranceProvider}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admissions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>Admissions</CardTitle>
              <Dialog open={showNewAdmissionDialog} onOpenChange={setShowNewAdmissionDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="button-new-admission">
                    <Plus className="h-4 w-4 mr-2" />
                    New Admission
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Patient Admission</DialogTitle>
                  </DialogHeader>
                  <Form {...admissionForm}>
                    <form onSubmit={admissionForm.handleSubmit((data) => createAdmissionMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={admissionForm.control}
                        name="patientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Patient *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-admission-patient">
                                  <SelectValue placeholder="Select patient" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {patients.map((patient) => (
                                  <SelectItem key={patient.id} value={patient.id}>
                                    {patient.firstName} {patient.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={admissionForm.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-department">
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {departments.map((dept) => (
                                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={admissionForm.control}
                        name="roomNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., 301A" data-testid="input-room" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={admissionForm.control}
                        name="admittingPhysician"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Admitting Physician *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-physician">
                                  <SelectValue placeholder="Select physician" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {physicians.map((doc) => (
                                  <SelectItem key={doc} value={doc}>{doc}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={admissionForm.control}
                        name="primaryDiagnosis"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Diagnosis</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-diagnosis" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={admissionForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea {...field} data-testid="input-admission-notes" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setShowNewAdmissionDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createAdmissionMutation.isPending} data-testid="button-submit-admission">
                          {createAdmissionMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Admit Patient
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {admissionsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : admissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BedDouble className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No admissions found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {admissions.map((admission) => (
                    <Card key={admission.id} className="p-4" data-testid={`card-admission-${admission.id}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-muted rounded-lg">
                            <BedDouble className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{getPatientName(admission.patientId)}</h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge className={getStatusBadge(admission.status)}>{admission.status}</Badge>
                              <span className="text-sm text-muted-foreground">{admission.department}</span>
                              {admission.roomNumber && (
                                <span className="text-sm text-muted-foreground">• Room {admission.roomNumber}</span>
                              )}
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Stethoscope className="h-3 w-3" />
                                {admission.admittingPhysician}
                              </div>
                              {admission.primaryDiagnosis && (
                                <p className="mt-1">{admission.primaryDiagnosis}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-3 w-3" />
                                Admitted: {admission.admissionDate ? new Date(admission.admissionDate).toLocaleDateString() : "N/A"}
                                {admission.dischargeDate && (
                                  <span>• Discharged: {new Date(admission.dischargeDate).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        {admission.status === "admitted" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => dischargeMutation.mutate({ id: admission.id })}
                            disabled={dischargeMutation.isPending}
                            data-testid={`button-discharge-${admission.id}`}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Discharge
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>Medical Records</CardTitle>
              <Dialog open={showNewRecordDialog} onOpenChange={setShowNewRecordDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="button-new-record">
                    <Plus className="h-4 w-4 mr-2" />
                    New Record
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Medical Record</DialogTitle>
                  </DialogHeader>
                  <Form {...recordForm}>
                    <form onSubmit={recordForm.handleSubmit((data) => createRecordMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={recordForm.control}
                        name="patientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Patient *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-record-patient">
                                  <SelectValue placeholder="Select patient" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {patients.map((patient) => (
                                  <SelectItem key={patient.id} value={patient.id}>
                                    {patient.firstName} {patient.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={recordForm.control}
                        name="recordType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Record Type *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-record-type">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {recordTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={recordForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-record-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={recordForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description *</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={4} data-testid="input-record-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={recordForm.control}
                        name="physician"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Physician *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-record-physician">
                                  <SelectValue placeholder="Select physician" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {physicians.map((doc) => (
                                  <SelectItem key={doc} value={doc}>{doc}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setShowNewRecordDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createRecordMutation.isPending} data-testid="button-submit-record">
                          {createRecordMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Create Record
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {recordsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : medicalRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No medical records found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {medicalRecords.map((record) => (
                    <Card key={record.id} className="p-4" data-testid={`card-record-${record.id}`}>
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{record.title}</h3>
                              <p className="text-sm text-muted-foreground">{getPatientName(record.patientId)}</p>
                            </div>
                            <Badge className={getRecordTypeBadge(record.recordType)}>
                              {record.recordType.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm mt-2">{record.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Stethoscope className="h-3 w-3" />
                              {record.physician}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {record.recordDate ? new Date(record.recordDate).toLocaleDateString() : "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedPatient && (
        <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Patient Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedPatient.firstName} {selectedPatient.lastName}</h2>
                  <p className="text-muted-foreground">{selectedPatient.gender} • DOB: {selectedPatient.dateOfBirth}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {selectedPatient.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedPatient.phone}</span>
                  </div>
                )}
                {selectedPatient.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate">{selectedPatient.email}</span>
                  </div>
                )}
              </div>

              {selectedPatient.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{selectedPatient.address}</span>
                </div>
              )}

              {(selectedPatient.emergencyContact || selectedPatient.emergencyPhone) && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">Emergency Contact</p>
                  <p className="text-sm">{selectedPatient.emergencyContact}</p>
                  {selectedPatient.emergencyPhone && (
                    <p className="text-sm text-muted-foreground">{selectedPatient.emergencyPhone}</p>
                  )}
                </div>
              )}

              {(selectedPatient.insuranceProvider || selectedPatient.insuranceNumber) && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Insurance Information
                  </p>
                  {selectedPatient.insuranceProvider && (
                    <p className="text-sm">{selectedPatient.insuranceProvider}</p>
                  )}
                  {selectedPatient.insuranceNumber && (
                    <p className="text-sm text-muted-foreground">Policy: {selectedPatient.insuranceNumber}</p>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
