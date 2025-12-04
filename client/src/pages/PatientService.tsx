import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Users, 
  UserPlus, 
  FileText, 
  Search, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  Stethoscope,
  Shield,
  Plus,
  Loader2,
  HeartPulse,
  Activity,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  User,
  Pill,
  TestTube,
  FileEdit,
  Clock,
  Globe,
  Upload,
  X,
  File
} from "lucide-react";
import { insertServicePatientSchema, insertMedicalRecordSchema } from "@shared/schema";
import type { ServicePatient, MedicalRecord } from "@shared/schema";
import { z } from "zod";

const patientFormSchema = insertServicePatientSchema.extend({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
});

const medicalRecordFormSchema = insertMedicalRecordSchema.extend({
  patientId: z.string().min(1, "Patient is required"),
  recordType: z.string().min(1, "Record type is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  physician: z.string().min(1, "Physician is required"),
});

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export default function PatientService() {
  const [activeTab, setActiveTab] = useState("patients");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<ServicePatient | null>(null);
  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false);
  const [showNewRecordDialog, setShowNewRecordDialog] = useState(false);
  const [showPatientDetailDialog, setShowPatientDetailDialog] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; data: string; type: string } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: patients = [], isLoading: patientsLoading } = useQuery<ServicePatient[]>({
    queryKey: ["/api/patients/service"],
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
      toast({ title: "Patient Registered", description: "New patient has been added to the system successfully" });
      setShowNewPatientDialog(false);
      patientForm.reset();
    },
    onError: () => {
      toast({ title: "Registration Failed", description: "Unable to register patient. Please try again.", variant: "destructive" });
    },
  });

  const createRecordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof medicalRecordFormSchema>) => {
      const payload = {
        ...data,
        fileName: uploadedFile?.name || null,
        fileData: uploadedFile?.data || null,
        fileType: uploadedFile?.type || null,
      };
      return await apiRequest("POST", "/api/medical-records", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-records"] });
      toast({ title: "Record Created", description: "Medical record added successfully" });
      setShowNewRecordDialog(false);
      recordForm.reset();
      setUploadedFile(null);
      setFileError(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create medical record", variant: "destructive" });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setFileError("File size exceeds 2MB limit");
      setUploadedFile(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      setUploadedFile({
        name: file.name,
        data: base64Data,
        type: file.type,
      });
      setFileError(null);
    };
    reader.onerror = () => {
      setFileError("Failed to read file");
      setUploadedFile(null);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFileError(null);
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : "Unknown";
  };

  const getRecordTypeConfig = (type: string) => {
    const configs: Record<string, { className: string; icon: typeof Stethoscope; label: string }> = {
      diagnosis: { className: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300", icon: Stethoscope, label: "Diagnosis" },
      treatment: { className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300", icon: Activity, label: "Treatment" },
      prescription: { className: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300", icon: Pill, label: "Prescription" },
      lab_result: { className: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300", icon: TestTube, label: "Lab Result" },
      note: { className: "bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-300", icon: FileEdit, label: "Clinical Note" },
    };
    return configs[type] || configs.note;
  };

  const filteredPatients = patients.filter((patient) =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const physicians = ["Dr. Anil Kulkarni", "Dr. Snehal Patil", "Dr. Vikram Deshpande", "Dr. Priyanka Joshi", "Dr. Rajesh Bhosale", "Dr. Meena Sharma"];
  const recordTypes = [
    { value: "diagnosis", label: "Diagnosis", icon: Stethoscope },
    { value: "treatment", label: "Treatment", icon: Activity },
    { value: "prescription", label: "Prescription", icon: Pill },
    { value: "lab_result", label: "Lab Result", icon: TestTube },
    { value: "note", label: "Clinical Note", icon: FileEdit },
  ];

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-900 dark:to-slate-950 flex flex-col">
      {/* Hospital Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-3 rounded-lg">
                <HeartPulse className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-xl font-semibold" data-testid="text-hospital-name">
                  Gravity Hospital
                </h1>
                <p className="text-blue-100 text-sm flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Chikhali, Pimpri-Chinchwad
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30" data-testid="badge-system">
                <Shield className="h-3 w-3 mr-1" />
                Patient Management System
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Page Title Section */}
      <div className="bg-white dark:bg-slate-900 border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-xl">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="text-page-title">
                  Patient Service
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Comprehensive patient demographics & medical records management
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries()} data-testid="button-refresh">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <Card className="border-l-4 border-l-blue-500" data-testid="card-total-patients">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Patients</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{patients.length}</p>
                  <p className="text-xs text-slate-400 mt-1">Registered in system</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-xl">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500" data-testid="card-medical-records">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Medical Records</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{medicalRecords.length}</p>
                  <p className="text-xs text-slate-400 mt-1">Total records</p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-xl">
                  <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid gap-1 bg-blue-50 dark:bg-slate-800 p-1 mb-6">
            <TabsTrigger 
              value="patients" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white" 
              data-testid="tab-patients"
            >
              <Users className="h-4 w-4" />
              Patients
            </TabsTrigger>
            <TabsTrigger 
              value="records" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white" 
              data-testid="tab-records"
            >
              <FileText className="h-4 w-4" />
              Medical Records
            </TabsTrigger>
          </TabsList>

          {/* Patients Tab */}
          <TabsContent value="patients" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                    Patient Registry
                  </CardTitle>
                  <CardDescription>Manage patient demographic information</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                      <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-new-patient">
                        <UserPlus className="h-4 w-4 mr-2" />
                        New Patient
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <UserPlus className="h-5 w-5 text-blue-600" />
                          Register New Patient
                        </DialogTitle>
                        <DialogDescription>
                          Enter patient demographic and contact information
                        </DialogDescription>
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
                                    <Input className="h-11" {...field} data-testid="input-first-name" />
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
                                    <Input className="h-11" {...field} data-testid="input-last-name" />
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
                                    <Input type="date" className="h-11" {...field} data-testid="input-dob" />
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
                                      <SelectTrigger className="h-11" data-testid="select-gender">
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
                                    <Input className="h-11" placeholder="+91 XXXXX XXXXX" {...field} data-testid="input-phone" />
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
                                    <Input type="email" className="h-11" placeholder="patient@email.com" {...field} data-testid="input-email" />
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
                                  <Textarea placeholder="Full address..." {...field} data-testid="input-address" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Separator />
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Emergency Contact</p>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={patientForm.control}
                              name="emergencyContact"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Contact Name</FormLabel>
                                  <FormControl>
                                    <Input className="h-11" {...field} data-testid="input-emergency-contact" />
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
                                  <FormLabel>Contact Phone</FormLabel>
                                  <FormControl>
                                    <Input className="h-11" {...field} data-testid="input-emergency-phone" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <Separator />
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Insurance Information</p>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={patientForm.control}
                              name="insuranceProvider"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Insurance Provider</FormLabel>
                                  <FormControl>
                                    <Input className="h-11" {...field} data-testid="input-insurance-provider" />
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
                                  <FormLabel>Policy Number</FormLabel>
                                  <FormControl>
                                    <Input className="h-11" {...field} data-testid="input-insurance-number" />
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
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createPatientMutation.isPending} data-testid="button-submit-patient">
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
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Users className="h-16 w-16 mb-4" />
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-300">No Patients Found</p>
                    <p className="text-sm">Register a new patient to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPatients.map((patient) => (
                      <Card 
                        key={patient.id} 
                        className="hover:shadow-md transition-shadow cursor-pointer border-slate-200 dark:border-slate-700"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowPatientDetailDialog(true);
                        }}
                        data-testid={`card-patient-${patient.id}`}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full flex-shrink-0">
                              <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                                {patient.firstName} {patient.lastName}
                              </h3>
                              <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                {patient.dateOfBirth}
                              </p>
                              {patient.phone && (
                                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                  <Phone className="h-3 w-3" />
                                  {patient.phone}
                                </p>
                              )}
                              {patient.email && (
                                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1 truncate">
                                  <Mail className="h-3 w-3" />
                                  {patient.email}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-4">
                            <Badge variant="outline" className="text-xs">
                              {patient.gender}
                            </Badge>
                            {patient.insuranceProvider && (
                              <Badge variant="secondary" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Insured
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical Records Tab */}
          <TabsContent value="records" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Medical Records
                  </CardTitle>
                  <CardDescription>Manage patient medical history and clinical notes</CardDescription>
                </div>
                <Dialog open={showNewRecordDialog} onOpenChange={setShowNewRecordDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700" data-testid="button-new-record">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Record
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-600" />
                        Create Medical Record
                      </DialogTitle>
                      <DialogDescription>
                        Add a new medical record entry for a patient
                      </DialogDescription>
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
                                  <SelectTrigger className="h-11" data-testid="select-patient-record">
                                    <SelectValue placeholder="Select patient" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {patients.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.firstName} {p.lastName}
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
                                  <SelectTrigger className="h-11" data-testid="select-record-type">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {recordTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      <div className="flex items-center gap-2">
                                        <type.icon className="h-4 w-4" />
                                        {type.label}
                                      </div>
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
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title *</FormLabel>
                              <FormControl>
                                <Input className="h-11" placeholder="Record title..." {...field} data-testid="input-record-title" />
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
                                  <SelectTrigger className="h-11" data-testid="select-record-physician">
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
                          control={recordForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Detailed description of the medical record..."
                                  className="min-h-[100px]"
                                  {...field} 
                                  data-testid="input-record-description" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Upload File (Max 2MB)</label>
                          {!uploadedFile ? (
                            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4">
                              <label 
                                htmlFor="file-upload" 
                                className="flex flex-col items-center justify-center cursor-pointer"
                              >
                                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                  Click to upload or drag and drop
                                </span>
                                <span className="text-xs text-slate-400 mt-1">
                                  PDF, DOC, DOCX, JPG, PNG (Max 2MB)
                                </span>
                                <input
                                  id="file-upload"
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                  onChange={handleFileUpload}
                                  data-testid="input-file-upload"
                                />
                              </label>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                              <div className="flex items-center gap-2">
                                <File className="h-5 w-5 text-purple-600" />
                                <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                                  {uploadedFile.name}
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={removeFile}
                                className="h-8 w-8 text-slate-500 hover:text-red-500"
                                data-testid="button-remove-file"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {fileError && (
                            <p className="text-sm text-red-500">{fileError}</p>
                          )}
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button type="button" variant="outline" onClick={() => setShowNewRecordDialog(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={createRecordMutation.isPending} data-testid="button-submit-record">
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
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                ) : medicalRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <FileText className="h-16 w-16 mb-4" />
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-300">No Medical Records</p>
                    <p className="text-sm">Add a medical record to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {medicalRecords.map((record) => {
                      const typeConfig = getRecordTypeConfig(record.recordType);
                      const TypeIcon = typeConfig.icon;
                      return (
                        <Card 
                          key={record.id} 
                          className="border-slate-200 dark:border-slate-700"
                          data-testid={`card-record-${record.id}`}
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${typeConfig.className}`}>
                                  <TypeIcon className="h-4 w-4" />
                                </div>
                                <div>
                                  <Badge variant="outline" className="mb-1">{typeConfig.label}</Badge>
                                  <h3 className="font-semibold text-slate-900 dark:text-white">{record.title}</h3>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
                              {record.description}
                            </p>
                            <div className="flex items-center justify-between text-sm text-slate-500">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {getPatientName(record.patientId)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Stethoscope className="h-3 w-3" />
                                {record.physician}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                              <Clock className="h-3 w-3" />
                              {formatDate(record.recordDate)}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Patient Detail Dialog */}
      <Dialog open={showPatientDetailDialog} onOpenChange={setShowPatientDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Patient Details
            </DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-4 rounded-full">
                  <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h3>
                  <Badge variant="outline">{selectedPatient.gender}</Badge>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Date of Birth</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {selectedPatient.dateOfBirth}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Phone</p>
                  <p className="font-medium flex items-center gap-1">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {selectedPatient.phone || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Email</p>
                  <p className="font-medium flex items-center gap-1 truncate">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {selectedPatient.email || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Address</p>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {selectedPatient.address || "—"}
                  </p>
                </div>
              </div>
              
              {(selectedPatient.emergencyContact || selectedPatient.emergencyPhone) && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Emergency Contact</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Name</p>
                        <p className="font-medium">{selectedPatient.emergencyContact || "—"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Phone</p>
                        <p className="font-medium">{selectedPatient.emergencyPhone || "—"}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {(selectedPatient.insuranceProvider || selectedPatient.insuranceNumber) && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Insurance</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Provider</p>
                        <p className="font-medium">{selectedPatient.insuranceProvider || "—"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Policy Number</p>
                        <p className="font-medium">{selectedPatient.insuranceNumber || "—"}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hospital Footer */}
      <div className="bg-slate-900 text-white mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">Gravity Hospital</h3>
              </div>
              <p className="text-slate-400 text-sm">
                Providing world-class healthcare with cutting-edge technology and compassionate care.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-400" />
                Address
              </h4>
              <p className="text-slate-400 text-sm" data-testid="text-footer-address">
                Sane Chowk, Nair Colony, More Vasti,<br />
                Chikhali, Pimpri-Chinchwad,<br />
                Maharashtra 411062
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-3">Contact Information</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-400" />
                  +91 20 1234 5678
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-400" />
                  info@gravityhospital.in
                </p>
                <p className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-400" />
                  www.gravityhospital.in
                </p>
              </div>
            </div>
          </div>
          <Separator className="my-4 bg-slate-700" />
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-slate-500">
            <p>© 2024 Gravity Hospital. All rights reserved.</p>
            <div className="flex items-center gap-4 mt-2 md:mt-0">
              <Badge variant="outline" className="border-slate-600 text-slate-400">
                <Shield className="h-3 w-3 mr-1" />
                HIPAA Compliant
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
