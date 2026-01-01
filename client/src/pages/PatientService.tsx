import { useState, useRef, useCallback, useEffect } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
  File,
  Check,
  ChevronsUpDown,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { insertServicePatientSchema, insertMedicalRecordSchema } from "@shared/schema";
import type { ServicePatient, MedicalRecord, PatientConsent, Doctor, IdCardScan, CriticalAlert } from "@shared/schema";
import { z } from "zod";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Printer, FileCheck, CreditCard, Camera, ScanLine, AlertTriangle, ImageIcon } from "lucide-react";

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

type UserRole = "ADMIN" | "DOCTOR" | "PATIENT" | "NURSE" | "OPD_MANAGER" | "MEDICAL_STORE" | "PATHOLOGY_LAB";

interface PatientServiceProps {
  currentRole?: UserRole;
  currentUserId?: string;
}

export default function PatientService({ currentRole = "ADMIN", currentUserId }: PatientServiceProps) {
  const [activeTab, setActiveTab] = useState("patients");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<ServicePatient | null>(null);
  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false);
  const [showNewRecordDialog, setShowNewRecordDialog] = useState(false);
  const [showPatientDetailDialog, setShowPatientDetailDialog] = useState(false);
  const [showRecordDetailDialog, setShowRecordDetailDialog] = useState(false);
  const [showDeleteRecordDialog, setShowDeleteRecordDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; data: string; type: string } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [patientPopoverOpen, setPatientPopoverOpen] = useState(false);
  const [useCustomPatientId, setUseCustomPatientId] = useState(false);
  const [consentSearchQuery, setConsentSearchQuery] = useState("");
  const [showNewConsentDialog, setShowNewConsentDialog] = useState(false);
  const [showConsentDetailDialog, setShowConsentDetailDialog] = useState(false);
  const [showDeleteConsentDialog, setShowDeleteConsentDialog] = useState(false);
  const [selectedConsent, setSelectedConsent] = useState<PatientConsent | null>(null);
  const [consentFile, setConsentFile] = useState<{ name: string; data: string; type: string } | null>(null);
  const [consentFileError, setConsentFileError] = useState<string | null>(null);
  const [consentPatientPopoverOpen, setConsentPatientPopoverOpen] = useState(false);
  const [consentPatientId, setConsentPatientId] = useState("");
  const [consentTitle, setConsentTitle] = useState("");
  const [consentDescription, setConsentDescription] = useState("");
  const [consentType, setConsentType] = useState("");
  const [isReferredPatient, setIsReferredPatient] = useState(false);
  const [referralSourceId, setReferralSourceId] = useState("");
  const [referredFromName, setReferredFromName] = useState("");
  const [referredFromDoctor, setReferredFromDoctor] = useState("");
  const [referralDiagnosis, setReferralDiagnosis] = useState("");
  const [referralReason, setReferralReason] = useState("");
  const [referralUrgency, setReferralUrgency] = useState("CRITICAL");
  const [referralClinicalHistory, setReferralClinicalHistory] = useState("");
  const [referralSpecialInstructions, setReferralSpecialInstructions] = useState("");
  
  // ID Card Scanning States
  const [selectedIdCardType, setSelectedIdCardType] = useState<string>("");
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [extractedAge, setExtractedAge] = useState<number | null>(null);
  const [extractedData, setExtractedData] = useState<{
    name: string;
    dob: string;
    gender: string;
    idNumber: string;
    address: string;
    age: number | null;
  }>({ name: "", dob: "", gender: "", idNumber: "", address: "", age: null });
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [showIdCardPatientForm, setShowIdCardPatientForm] = useState(false);
  const [idCardDepartment, setIdCardDepartment] = useState("");
  const [idCardVisitReason, setIdCardVisitReason] = useState("");
  const [idCardVisitType, setIdCardVisitType] = useState("");
  
  // Camera capture states
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<"front" | "back">("front");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();
  
  // Camera cleanup function (ref-based to avoid dependency issues)
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoReady(false);
  }, []);
  
  // Start camera function
  const startCamera = useCallback(async () => {
    // Stop any existing stream first
    stopCamera();
    
    setCameraError(null);
    setIsCameraLoading(true);
    setIsVideoReady(false);
    
    // Check for secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      setCameraError("Camera access requires a secure connection (HTTPS). Please use HTTPS or localhost.");
      setIsCameraLoading(false);
      return;
    }
    
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.");
      setIsCameraLoading(false);
      return;
    }
    
    try {
      // Try with environment-facing camera first (for mobile)
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch {
        // Fallback to any available camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video metadata to load before playing
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                setIsCameraLoading(false);
                setIsVideoReady(true);
              })
              .catch(err => {
                console.error("Error playing video:", err);
                setCameraError("Failed to start video playback. Please try again.");
                setIsCameraLoading(false);
              });
          }
        };
        
        // Timeout fallback in case metadata doesn't load
        const timeoutId = setTimeout(() => {
          setIsCameraLoading(false);
        }, 3000);
        
        // Clear timeout when video loads
        videoRef.current.oncanplay = () => {
          clearTimeout(timeoutId);
        };
      } else {
        setIsCameraLoading(false);
      }
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      setIsCameraLoading(false);
      
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setCameraError("Camera permission denied. Please allow camera access in your browser settings and try again.");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setCameraError("No camera found. Please connect a camera or use the Upload option.");
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          setCameraError("Camera is in use by another application. Please close other apps using the camera.");
        } else if (err.name === "OverconstrainedError") {
          setCameraError("Camera configuration error. Please use the Upload option.");
        } else if (err.name === "AbortError") {
          setCameraError("Camera request was aborted. Please try again.");
        } else {
          setCameraError(`Camera error: ${err.message}. Please use the Upload option.`);
        }
      } else {
        setCameraError("Unable to access camera. Please use the Upload option instead.");
      }
    }
  }, [stopCamera]);
  
  // Capture photo from video stream
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      toast({
        title: "Capture Failed",
        description: "Camera not ready. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Validate video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast({
        title: "Capture Failed",
        description: "Video stream not ready. Please wait for camera to initialize.",
        variant: "destructive"
      });
      return;
    }
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast({
        title: "Capture Failed",
        description: "Unable to capture image. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to data URL
    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    
    // Validate the image data is not empty
    if (!imageData || imageData === "data:," || imageData.length < 100) {
      toast({
        title: "Capture Failed", 
        description: "Image capture failed. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    // Set the appropriate image based on target
    if (cameraTarget === "front") {
      setFrontImage(imageData);
    } else {
      setBackImage(imageData);
    }
    
    // Close camera dialog
    stopCamera();
    setShowCameraDialog(false);
    
    toast({
      title: "Photo Captured",
      description: `${cameraTarget === "front" ? "Front" : "Back"} side of ID card captured successfully.`
    });
  }, [cameraTarget, stopCamera, toast]);
  
  // Open camera dialog
  const openCameraDialog = useCallback((target: "front" | "back") => {
    setCameraTarget(target);
    setCameraError(null);
    setShowCameraDialog(true);
  }, []);
  
  // Effect to start camera when dialog opens (stable dependencies)
  useEffect(() => {
    if (showCameraDialog) {
      startCamera();
      
      // Add timeout - if camera doesn't become ready in 5 seconds, show error
      const timeoutId = setTimeout(() => {
        if (!isVideoReady && !cameraError) {
          setCameraError("Camera access timed out. This may be due to browser restrictions in web-based environments. Please use the Upload option instead.");
          stopCamera();
        }
      }, 5000);
      
      return () => clearTimeout(timeoutId);
    } else {
      stopCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCameraDialog]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Referral sources for referred patients
  type ReferralSource = {
    id: string;
    sourceName: string;
    sourceType: string;
    contactPerson: string | null;
    phone: string | null;
    specializations: string | null;
  };

  const { data: referralSources = [] } = useQuery<ReferralSource[]>({
    queryKey: ["/api/referral-sources"],
  });

  // For NURSE: fetch only assigned patients, for others: fetch all patients
  const { data: patients = [], isLoading: patientsLoading } = useQuery<ServicePatient[]>({
    queryKey: currentRole === "NURSE" && currentUserId 
      ? ["/api/patients/assigned", currentUserId]
      : ["/api/patients/service"],
  });

  const { data: medicalRecords = [], isLoading: recordsLoading } = useQuery<MedicalRecord[]>({
    queryKey: ["/api/medical-records"],
  });

  const { data: patientConsents = [], isLoading: consentsLoading } = useQuery<PatientConsent[]>({
    queryKey: ["/api/patient-consents"],
  });

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
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
      const response = await apiRequest("POST", "/api/patients/service", data);
      const patientData = await response.json();
      
      // If patient is referred, create a referral record
      if (isReferredPatient && (referralSourceId || referredFromName)) {
        await apiRequest("POST", "/api/referrals", {
          referralType: "REFER_FROM",
          patientId: patientData.id,
          patientName: `${data.firstName} ${data.lastName}`,
          patientPhone: data.phone || null,
          patientGender: data.gender || null,
          referredFromSourceId: referralSourceId || null,
          referredFromName: referredFromName || null,
          referredFromDoctor: referredFromDoctor || null,
          diagnosis: referralDiagnosis || null,
          reasonForReferral: referralReason || "Referred for treatment",
          clinicalHistory: referralClinicalHistory || null,
          urgency: referralUrgency || "ROUTINE",
          specialInstructions: referralSpecialInstructions || null,
          status: "ACCEPTED",
          referralDate: new Date().toISOString(),
        });
      }
      
      return patientData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients/service"] });
      queryClient.invalidateQueries({ queryKey: ["/api/referrals"] });
      toast({ title: "Patient Registered", description: isReferredPatient ? "Patient and referral record created successfully" : "New patient has been added to the system successfully" });
      setShowNewPatientDialog(false);
      patientForm.reset();
      // Reset referral fields
      setIsReferredPatient(false);
      setReferralSourceId("");
      setReferredFromName("");
      setReferredFromDoctor("");
      setReferralDiagnosis("");
      setReferralReason("");
      setReferralUrgency("ROUTINE");
      setReferralClinicalHistory("");
      setReferralSpecialInstructions("");
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

  const deleteRecordMutation = useMutation({
    mutationFn: async (recordId: string) => {
      return await apiRequest("DELETE", `/api/medical-records/${recordId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
      toast({ title: "Record Deleted", description: "Medical record has been deleted successfully" });
      setShowDeleteRecordDialog(false);
      setSelectedRecord(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete medical record", variant: "destructive" });
    },
  });

  // Consent form mutations
  const createConsentMutation = useMutation({
    mutationFn: async () => {
      if (!consentFile || !consentPatientId || !consentTitle || !consentType) {
        throw new Error("Missing required fields");
      }
      const payload = {
        patientId: consentPatientId,
        consentType: consentType,
        title: consentTitle,
        description: consentDescription,
        fileName: consentFile.name,
        fileData: consentFile.data,
        fileType: consentFile.type,
        uploadedBy: "Admin",
      };
      return await apiRequest("POST", "/api/patient-consents", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patient-consents"] });
      toast({ title: "Consent Form Uploaded", description: "Patient consent form has been uploaded successfully" });
      setShowNewConsentDialog(false);
      resetConsentForm();
    },
    onError: () => {
      toast({ title: "Upload Failed", description: "Failed to upload consent form", variant: "destructive" });
    },
  });

  const deleteConsentMutation = useMutation({
    mutationFn: async (consentId: string) => {
      return await apiRequest("DELETE", `/api/patient-consents/${consentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patient-consents"] });
      toast({ title: "Consent Deleted", description: "Patient consent form has been deleted successfully" });
      setShowDeleteConsentDialog(false);
      setSelectedConsent(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete consent form", variant: "destructive" });
    },
  });

  const resetConsentForm = () => {
    setConsentPatientId("");
    setConsentTitle("");
    setConsentDescription("");
    setConsentType("");
    setConsentFile(null);
    setConsentFileError(null);
  };

  const handleConsentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setConsentFileError("Only PDF files are allowed");
      setConsentFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setConsentFileError("File size exceeds 2MB limit");
      setConsentFile(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      setConsentFile({
        name: file.name,
        data: base64Data,
        type: file.type,
      });
      setConsentFileError(null);
    };
    reader.onerror = () => {
      setConsentFileError("Failed to read file");
      setConsentFile(null);
    };
    reader.readAsDataURL(file);
  };

  const handleViewConsent = (consent: PatientConsent) => {
    setSelectedConsent(consent);
    setShowConsentDetailDialog(true);
  };

  const handleDownloadConsent = (consent: PatientConsent) => {
    if (consent.fileData && consent.fileName) {
      const link = document.createElement('a');
      link.href = consent.fileData;
      link.download = consent.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Download Started", description: `Downloading ${consent.fileName}` });
    }
  };

  const handlePrintConsent = (consent: PatientConsent) => {
    if (consent.fileData) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>${consent.title}</title></head>
            <body style="margin:0;padding:0;">
              <embed src="${consent.fileData}" type="application/pdf" width="100%" height="100%" />
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
      }
    }
  };

  const handleDeleteConsent = (consent: PatientConsent) => {
    setSelectedConsent(consent);
    setShowDeleteConsentDialog(true);
  };

  const confirmDeleteConsent = () => {
    if (selectedConsent) {
      deleteConsentMutation.mutate(selectedConsent.id);
    }
  };

  const handleViewRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setShowRecordDetailDialog(true);
  };

  const handleDownloadRecord = (record: MedicalRecord) => {
    if (record.fileData && record.fileName) {
      const link = document.createElement('a');
      link.href = record.fileData;
      link.download = record.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Download Started", description: `Downloading ${record.fileName}` });
    } else {
      toast({ title: "No File", description: "This record has no attached file to download", variant: "destructive" });
    }
  };

  const handleDeleteRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setShowDeleteRecordDialog(true);
  };

  const confirmDeleteRecord = () => {
    if (selectedRecord) {
      deleteRecordMutation.mutate(selectedRecord.id);
    }
  };

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

  // Filter patients - for NURSE role, only show assigned patients
  const roleFilteredPatients = currentRole === "NURSE" && currentUserId
    ? patients.filter((patient) => patient.assignedNurseId === currentUserId)
    : patients;

  const filteredPatients = roleFilteredPatients.filter((patient) =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const physicians = doctors.map(d => d.name.startsWith("Dr.") ? d.name : `Dr. ${d.name}`);
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
                  Nigdi, Pimpri-Chinchwad
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
          <TabsList className={`grid w-full ${currentRole === "NURSE" || currentRole === "OPD_MANAGER" ? "grid-cols-2" : "grid-cols-3"} lg:w-auto lg:inline-grid gap-1 bg-blue-50 dark:bg-slate-800 p-1 mb-6`}>
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
            {currentRole !== "NURSE" && currentRole !== "OPD_MANAGER" && (
              <TabsTrigger 
                value="consents" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white" 
                data-testid="tab-consents"
              >
                <FileCheck className="h-4 w-4" />
                Consent Forms
              </TabsTrigger>
            )}
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
                    <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <UserPlus className="h-5 w-5 text-blue-600" />
                          Register New Patient
                        </DialogTitle>
                        <DialogDescription>
                          Enter patient demographic and contact information
                        </DialogDescription>
                      </DialogHeader>
                      
                      {/* ID Card Scanning & Alert System */}
                      <div className="mb-4 p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-900/20">
                        <div className="flex items-center gap-2 mb-3">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-blue-900 dark:text-blue-100">ID Card Scanning & Alert System</h3>
                        </div>
                        
                        {/* ID Card Type Dropdown */}
                        <div className="mb-3">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">ID Card Type</label>
                          <Select value={selectedIdCardType} onValueChange={setSelectedIdCardType}>
                            <SelectTrigger className="w-full h-10" data-testid="select-id-card-type">
                              <SelectValue placeholder="Select ID card type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                              <SelectItem value="pan">PAN Card</SelectItem>
                              <SelectItem value="driving_license">Driving License</SelectItem>
                              <SelectItem value="voter_id">Voter ID</SelectItem>
                              <SelectItem value="passport">Passport</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Front and Back Scan Buttons */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <Button 
                              type="button"
                              variant="outline"
                              className={`w-full ${frontImage ? 'bg-green-100 border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-400' : 'bg-white dark:bg-slate-800'}`}
                              onClick={() => {
                                setCameraTarget("front");
                                setCameraError(null);
                                setShowCameraDialog(true);
                              }}
                              data-testid="button-scan-front"
                            >
                              {frontImage ? (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  Front Captured
                                </>
                              ) : (
                                <>
                                  <Camera className="h-4 w-4 mr-2" />
                                  Scan Front Side
                                </>
                              )}
                            </Button>
                          </div>
                          <div>
                            <Button 
                              type="button"
                              variant="outline"
                              className={`w-full ${backImage ? 'bg-green-100 border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-400' : 'bg-white dark:bg-slate-800'}`}
                              onClick={() => {
                                setCameraTarget("back");
                                setCameraError(null);
                                setShowCameraDialog(true);
                              }}
                              data-testid="button-scan-back"
                            >
                              {backImage ? (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  Back Captured
                                </>
                              ) : (
                                <>
                                  <Camera className="h-4 w-4 mr-2" />
                                  Scan Back Side
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        {/* Image Previews */}
                        {(frontImage || backImage) && (
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            {frontImage && (
                              <div className="relative">
                                <img src={frontImage} alt="Front of ID" className="w-full h-20 object-cover rounded border" />
                                <Badge variant="secondary" className="absolute top-1 left-1 text-xs">Front</Badge>
                                <Button 
                                  type="button"
                                  size="icon"
                                  variant="destructive"
                                  className="absolute top-1 right-1 h-5 w-5"
                                  onClick={() => setFrontImage(null)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            {backImage && (
                              <div className="relative">
                                <img src={backImage} alt="Back of ID" className="w-full h-20 object-cover rounded border" />
                                <Badge variant="secondary" className="absolute top-1 left-1 text-xs">Back</Badge>
                                <Button 
                                  type="button"
                                  size="icon"
                                  variant="destructive"
                                  className="absolute top-1 right-1 h-5 w-5"
                                  onClick={() => setBackImage(null)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Process OCR Button */}
                        {(frontImage || backImage) && (
                          <Button 
                            type="button"
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            onClick={async () => {
                              if (!selectedIdCardType) {
                                toast({
                                  title: "Select ID Type",
                                  description: "Please select an ID card type before processing.",
                                  variant: "destructive"
                                });
                                return;
                              }
                              
                              setIsProcessingOcr(true);
                              await new Promise(resolve => setTimeout(resolve, 1500));
                              
                              const simulatedData = {
                                firstName: "Priya",
                                lastName: "Sharma",
                                dob: "2008-03-15",
                                gender: "Female",
                                address: "45 Gandhi Nagar, Pune, Maharashtra - 411001",
                                idNumber: selectedIdCardType === "aadhaar" ? "1234 5678 9012" : 
                                          selectedIdCardType === "pan" ? "ABCDE1234F" :
                                          selectedIdCardType === "passport" ? "J1234567" : "DL-1234567890"
                              };
                              
                              const today = new Date();
                              const birthDate = new Date(simulatedData.dob);
                              let calculatedAge = today.getFullYear() - birthDate.getFullYear();
                              const monthDiff = today.getMonth() - birthDate.getMonth();
                              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                calculatedAge--;
                              }
                              setExtractedAge(calculatedAge);
                              
                              patientForm.setValue("firstName", simulatedData.firstName);
                              patientForm.setValue("lastName", simulatedData.lastName);
                              patientForm.setValue("dateOfBirth", simulatedData.dob);
                              patientForm.setValue("gender", simulatedData.gender);
                              patientForm.setValue("address", simulatedData.address);
                              
                              setIsProcessingOcr(false);
                              
                              toast({
                                title: "OCR Complete",
                                description: `Extracted: ${simulatedData.firstName} ${simulatedData.lastName}, Age: ${calculatedAge} years, ID: ${simulatedData.idNumber}`
                              });
                            }}
                            disabled={isProcessingOcr}
                            data-testid="button-process-ocr"
                          >
                            {isProcessingOcr ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing OCR...
                              </>
                            ) : (
                              <>
                                <ScanLine className="h-4 w-4 mr-2" />
                                Process OCR & Auto-Fill
                              </>
                            )}
                          </Button>
                        )}
                        
                        {/* Extracted Age Display */}
                        {extractedAge !== null && (
                          <div className="mt-3 p-2 bg-white dark:bg-slate-800 rounded border">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-600 dark:text-slate-400">Calculated Age:</span>
                              <Badge variant={extractedAge < 18 ? "destructive" : "secondary"}>
                                {extractedAge} years {extractedAge < 18 && "(Minor)"}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <Form {...patientForm}>
                        <form onSubmit={patientForm.handleSubmit((data) => createPatientMutation.mutate(data))} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                          <Separator />
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Referral Information</p>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="isReferredPatient"
                                checked={isReferredPatient}
                                onChange={(e) => setIsReferredPatient(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                                data-testid="checkbox-is-referred"
                              />
                              <label htmlFor="isReferredPatient" className="text-sm text-slate-600 dark:text-slate-300">
                                This patient was referred from outside
                              </label>
                            </div>
                          </div>

                          {isReferredPatient && (
                            <div className="space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Referred From Source</label>
                                  <Select value={referralSourceId} onValueChange={setReferralSourceId}>
                                    <SelectTrigger className="h-11 mt-1" data-testid="select-referral-source">
                                      <SelectValue placeholder="Select referral source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {referralSources.filter(s => s.sourceType === "Doctor").map((source) => (
                                        <SelectItem key={source.id} value={source.id}>
                                          {source.sourceName} ({source.specializations || source.sourceType})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Or Enter Manually</label>
                                  <Input
                                    className="h-11 mt-1"
                                    placeholder="Referring doctor/clinic name"
                                    value={referredFromName}
                                    onChange={(e) => setReferredFromName(e.target.value)}
                                    data-testid="input-referred-from-name"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Referring Doctor Name</label>
                                  <Input
                                    className="h-11 mt-1"
                                    placeholder="Dr. Name"
                                    value={referredFromDoctor}
                                    onChange={(e) => setReferredFromDoctor(e.target.value)}
                                    data-testid="input-referred-doctor"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Urgency</label>
                                  <Select value={referralUrgency} onValueChange={setReferralUrgency}>
                                    <SelectTrigger className="h-11 mt-1" data-testid="select-referral-urgency">
                                      <SelectValue placeholder="Select urgency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="CRITICAL">Critical</SelectItem>
                                      <SelectItem value="EMERGENCY">Emergency</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Diagnosis</label>
                                <Input
                                  className="h-11 mt-1"
                                  placeholder="Primary diagnosis or suspected condition"
                                  value={referralDiagnosis}
                                  onChange={(e) => setReferralDiagnosis(e.target.value)}
                                  data-testid="input-referral-diagnosis"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Reason for Referral *</label>
                                <Textarea
                                  className="mt-1"
                                  placeholder="Why was the patient referred?"
                                  value={referralReason}
                                  onChange={(e) => setReferralReason(e.target.value)}
                                  data-testid="input-referral-reason"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Clinical History</label>
                                <Textarea
                                  className="mt-1"
                                  placeholder="Relevant clinical history and findings"
                                  value={referralClinicalHistory}
                                  onChange={(e) => setReferralClinicalHistory(e.target.value)}
                                  data-testid="input-clinical-history"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Special Instructions</label>
                                <Textarea
                                  className="mt-1"
                                  placeholder="Any special instructions from the referring doctor"
                                  value={referralSpecialInstructions}
                                  onChange={(e) => setReferralSpecialInstructions(e.target.value)}
                                  data-testid="input-special-instructions"
                                />
                              </div>
                            </div>
                          )}

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
                  <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
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
                            <FormItem className="flex flex-col">
                              <div className="flex items-center justify-between">
                                <FormLabel>Patient *</FormLabel>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setUseCustomPatientId(!useCustomPatientId);
                                    field.onChange("");
                                  }}
                                  className="text-xs"
                                >
                                  {useCustomPatientId ? "Select from list" : "Enter username"}
                                </Button>
                              </div>
                              {useCustomPatientId ? (
                                <FormControl>
                                  <Input
                                    placeholder="Enter patient username (e.g., john_doe)"
                                    value={field.value}
                                    onChange={field.onChange}
                                    className="h-11"
                                    data-testid="input-patient-username"
                                  />
                                </FormControl>
                              ) : (
                                <Popover open={patientPopoverOpen} onOpenChange={setPatientPopoverOpen}>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={patientPopoverOpen}
                                        className={cn(
                                          "h-11 w-full justify-between",
                                          !field.value && "text-muted-foreground"
                                        )}
                                        data-testid="select-patient-record"
                                      >
                                        {field.value
                                          ? patients.find((p) => p.id === field.value)
                                              ? `${patients.find((p) => p.id === field.value)?.firstName} ${patients.find((p) => p.id === field.value)?.lastName}`
                                              : field.value
                                          : "Select patient"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[400px] p-0" align="start">
                                    <Command>
                                      <CommandInput placeholder="Search patients..." data-testid="input-patient-search" />
                                      <CommandList>
                                        <CommandEmpty>No patient found.</CommandEmpty>
                                        <CommandGroup>
                                          {patients.map((p) => (
                                            <CommandItem
                                              key={p.id}
                                              value={`${p.firstName} ${p.lastName}`}
                                              onSelect={() => {
                                                field.onChange(p.id);
                                                setPatientPopoverOpen(false);
                                              }}
                                              data-testid={`patient-option-${p.id}`}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  field.value === p.id ? "opacity-100" : "opacity-0"
                                                )}
                                              />
                                              <div className="flex flex-col">
                                                <span>{p.firstName} {p.lastName}</span>
                                                {p.phone && (
                                                  <span className="text-xs text-muted-foreground">{p.phone}</span>
                                                )}
                                              </div>
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              )}
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
                              <div className="flex items-center gap-1">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  onClick={() => handleViewRecord(record)}
                                  data-testid={`button-view-record-${record.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                  onClick={() => handleDownloadRecord(record)}
                                  disabled={!record.fileData}
                                  data-testid={`button-download-record-${record.id}`}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={() => handleDeleteRecord(record)}
                                  data-testid={`button-delete-record-${record.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1 text-xs text-slate-400">
                                <Clock className="h-3 w-3" />
                                {formatDate(record.recordDate)}
                              </div>
                              {record.fileName && (
                                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                  <File className="h-3 w-3" />
                                  <span className="truncate max-w-[100px]">{record.fileName}</span>
                                </div>
                              )}
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

          {/* Consent Forms Tab */}
          <TabsContent value="consents" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileCheck className="h-5 w-5 text-green-600" />
                    Patient Consent Forms
                  </CardTitle>
                  <CardDescription>Upload and manage patient consent forms (PDF)</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search consent forms..."
                      value={consentSearchQuery}
                      onChange={(e) => setConsentSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                      data-testid="input-search-consents"
                    />
                  </div>
                  <Dialog open={showNewConsentDialog} onOpenChange={(open) => {
                    setShowNewConsentDialog(open);
                    if (!open) resetConsentForm();
                  }}>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700" data-testid="button-new-consent">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Consent
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Upload className="h-5 w-5 text-green-600" />
                          Upload Patient Consent Form
                        </DialogTitle>
                        <DialogDescription>
                          Upload a signed consent form (PDF only, max 2MB)
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {/* Patient Selection */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Patient *</label>
                          <Popover open={consentPatientPopoverOpen} onOpenChange={setConsentPatientPopoverOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between"
                                data-testid="select-consent-patient"
                              >
                                {consentPatientId
                                  ? patients.find((p) => p.id === consentPatientId)
                                    ? `${patients.find((p) => p.id === consentPatientId)?.firstName} ${patients.find((p) => p.id === consentPatientId)?.lastName}`
                                    : "Patient not found"
                                  : "Select patient..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Search patients..." />
                                <CommandList>
                                  <CommandEmpty>No patient found.</CommandEmpty>
                                  <CommandGroup>
                                    {patients.map((patient) => (
                                      <CommandItem
                                        key={patient.id}
                                        value={`${patient.firstName} ${patient.lastName}`}
                                        onSelect={() => {
                                          setConsentPatientId(patient.id);
                                          setConsentPatientPopoverOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            consentPatientId === patient.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {patient.firstName} {patient.lastName}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Consent Type */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Consent Type *</label>
                          <Select value={consentType} onValueChange={setConsentType}>
                            <SelectTrigger data-testid="select-consent-type">
                              <SelectValue placeholder="Select consent type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General Consent</SelectItem>
                              <SelectItem value="surgery">Surgery Consent</SelectItem>
                              <SelectItem value="treatment">Treatment Consent</SelectItem>
                              <SelectItem value="admission">Admission Consent</SelectItem>
                              <SelectItem value="discharge">Discharge Consent</SelectItem>
                              <SelectItem value="hipaa">HIPAA Authorization</SelectItem>
                              <SelectItem value="research">Research Consent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Title *</label>
                          <Input
                            placeholder="e.g., Surgical Procedure Consent"
                            value={consentTitle}
                            onChange={(e) => setConsentTitle(e.target.value)}
                            data-testid="input-consent-title"
                          />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Description</label>
                          <Textarea
                            placeholder="Brief description of the consent form..."
                            value={consentDescription}
                            onChange={(e) => setConsentDescription(e.target.value)}
                            className="resize-none"
                            rows={3}
                            data-testid="input-consent-description"
                          />
                        </div>

                        {/* File Upload */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">PDF File *</label>
                          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center">
                            {consentFile ? (
                              <div className="flex items-center justify-center gap-3">
                                <File className="h-8 w-8 text-green-600" />
                                <div className="text-left">
                                  <p className="font-medium text-slate-900 dark:text-white">{consentFile.name}</p>
                                  <p className="text-sm text-slate-500">Ready to upload</p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setConsentFile(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div>
                                <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                                <p className="text-sm text-slate-500 mb-2">
                                  Drag and drop or click to upload
                                </p>
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  onChange={handleConsentFileUpload}
                                  className="hidden"
                                  id="consent-file-upload"
                                  data-testid="input-consent-file"
                                />
                                <label htmlFor="consent-file-upload">
                                  <Button type="button" variant="outline" size="sm" asChild>
                                    <span>Select PDF File</span>
                                  </Button>
                                </label>
                              </div>
                            )}
                          </div>
                          {consentFileError && (
                            <p className="text-sm text-red-500">{consentFileError}</p>
                          )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowNewConsentDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => createConsentMutation.mutate()}
                            disabled={!consentPatientId || !consentType || !consentTitle || !consentFile || createConsentMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                            data-testid="button-submit-consent"
                          >
                            {createConsentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Upload Consent
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {consentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                  </div>
                ) : patientConsents.length === 0 ? (
                  <div className="text-center py-12">
                    <FileCheck className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No consent forms</h3>
                    <p className="text-slate-500 dark:text-slate-400">Upload patient consent forms to get started</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {patientConsents
                      .filter(consent => 
                        consent.title.toLowerCase().includes(consentSearchQuery.toLowerCase()) ||
                        consent.consentType.toLowerCase().includes(consentSearchQuery.toLowerCase()) ||
                        getPatientName(consent.patientId).toLowerCase().includes(consentSearchQuery.toLowerCase())
                      )
                      .map((consent) => (
                        <Card 
                          key={consent.id} 
                          className="hover-elevate cursor-pointer transition-all"
                          data-testid={`card-consent-${consent.id}`}
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                                  <FileCheck className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                  <Badge variant="outline" className="mb-1 capitalize">{consent.consentType}</Badge>
                                  <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1">{consent.title}</h3>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  onClick={() => handleViewConsent(consent)}
                                  data-testid={`button-view-consent-${consent.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                  onClick={() => handleDownloadConsent(consent)}
                                  data-testid={`button-download-consent-${consent.id}`}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                  onClick={() => handlePrintConsent(consent)}
                                  data-testid={`button-print-consent-${consent.id}`}
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={() => handleDeleteConsent(consent)}
                                  data-testid={`button-delete-consent-${consent.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {consent.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
                                {consent.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-sm text-slate-500">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {getPatientName(consent.patientId)}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-slate-400">
                                <Clock className="h-3 w-3" />
                                {consent.uploadedAt ? new Date(consent.uploadedAt).toLocaleDateString() : "N/A"}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-2">
                              <File className="h-3 w-3" />
                              <span className="truncate max-w-[150px]">{consent.fileName}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>

      {/* Patient Detail Dialog */}
      <Dialog open={showPatientDetailDialog} onOpenChange={setShowPatientDetailDialog}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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

      {/* View Record Detail Dialog */}
      <Dialog open={showRecordDetailDialog} onOpenChange={setShowRecordDetailDialog}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-record-detail">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Medical Record Details
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${getRecordTypeConfig(selectedRecord.recordType).className}`}>
                  {(() => {
                    const TypeIcon = getRecordTypeConfig(selectedRecord.recordType).icon;
                    return <TypeIcon className="h-6 w-6" />;
                  })()}
                </div>
                <div>
                  <Badge variant="outline">{getRecordTypeConfig(selectedRecord.recordType).label}</Badge>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{selectedRecord.title}</h3>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500">Description</p>
                  <p className="text-slate-900 dark:text-white">{selectedRecord.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Patient</p>
                    <p className="font-medium flex items-center gap-1">
                      <User className="h-4 w-4 text-slate-400" />
                      {getPatientName(selectedRecord.patientId)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Physician</p>
                    <p className="font-medium flex items-center gap-1">
                      <Stethoscope className="h-4 w-4 text-slate-400" />
                      {selectedRecord.physician}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Date</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-4 w-4 text-slate-400" />
                    {formatDate(selectedRecord.recordDate)}
                  </p>
                </div>
                
                {selectedRecord.fileName && (
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Attached File</p>
                    <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <File className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium truncate max-w-[180px]">{selectedRecord.fileName}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadRecord(selectedRecord)}
                        data-testid="button-download-in-dialog"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowRecordDetailDialog(false)}>
                  Close
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setShowRecordDetailDialog(false);
                    handleDeleteRecord(selectedRecord);
                  }}
                  data-testid="button-delete-from-view"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Record
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Record Confirmation Dialog */}
      <Dialog open={showDeleteRecordDialog} onOpenChange={setShowDeleteRecordDialog}>
        <DialogContent className="max-w-md" data-testid="dialog-delete-record">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Medical Record
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. The medical record will be permanently deleted from the system.
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">
                  You are about to delete:
                </p>
                <p className="font-semibold text-red-900 dark:text-red-100 mt-1">
                  {selectedRecord.title}
                </p>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  Patient: {getPatientName(selectedRecord.patientId)}
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteRecordDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDeleteRecord}
                  disabled={deleteRecordMutation.isPending}
                  data-testid="button-confirm-delete-record"
                >
                  {deleteRecordMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Delete Record
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Consent Detail Dialog */}
      <Dialog open={showConsentDetailDialog} onOpenChange={setShowConsentDetailDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-consent-detail">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-green-600" />
              Consent Form Details
            </DialogTitle>
          </DialogHeader>
          {selectedConsent && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/50">
                  <FileCheck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <Badge variant="outline" className="capitalize">{selectedConsent.consentType}</Badge>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{selectedConsent.title}</h3>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                {selectedConsent.description && (
                  <div>
                    <p className="text-sm text-slate-500">Description</p>
                    <p className="text-slate-900 dark:text-white">{selectedConsent.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Patient</p>
                    <p className="font-medium flex items-center gap-1">
                      <User className="h-4 w-4 text-slate-400" />
                      {getPatientName(selectedConsent.patientId)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Uploaded By</p>
                    <p className="font-medium">{selectedConsent.uploadedBy || "Admin"}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Upload Date</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-4 w-4 text-slate-400" />
                    {selectedConsent.uploadedAt ? new Date(selectedConsent.uploadedAt).toLocaleString() : "N/A"}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500 mb-2">PDF File</p>
                  <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <File className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium truncate max-w-[200px]">{selectedConsent.fileName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadConsent(selectedConsent)}
                        data-testid="button-download-consent-dialog"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePrintConsent(selectedConsent)}
                        data-testid="button-print-consent-dialog"
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Print
                      </Button>
                    </div>
                  </div>
                </div>

                {/* PDF Preview */}
                <div>
                  <p className="text-sm text-slate-500 mb-2">Preview</p>
                  <div className="border rounded-lg overflow-hidden h-[400px]">
                    <iframe
                      src={selectedConsent.fileData}
                      className="w-full h-full"
                      title="PDF Preview"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowConsentDetailDialog(false)}>
                  Close
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setShowConsentDetailDialog(false);
                    handleDeleteConsent(selectedConsent);
                  }}
                  data-testid="button-delete-consent-from-view"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Consent
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Consent Confirmation Dialog */}
      <Dialog open={showDeleteConsentDialog} onOpenChange={setShowDeleteConsentDialog}>
        <DialogContent className="max-w-md" data-testid="dialog-delete-consent">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Consent Form
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. The consent form will be permanently deleted from the system.
            </DialogDescription>
          </DialogHeader>
          {selectedConsent && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">
                  You are about to delete:
                </p>
                <p className="font-semibold text-red-900 dark:text-red-100 mt-1">
                  {selectedConsent.title}
                </p>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  Patient: {getPatientName(selectedConsent.patientId)}
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteConsentDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDeleteConsent}
                  disabled={deleteConsentMutation.isPending}
                  data-testid="button-confirm-delete-consent"
                >
                  {deleteConsentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Delete Consent
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Camera Capture Dialog */}
      <Dialog open={showCameraDialog} onOpenChange={(open) => {
        if (!open) {
          stopCamera();
        }
        setShowCameraDialog(open);
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Capture {cameraTarget === "front" ? "Front" : "Back"} Side of ID Card
            </DialogTitle>
            <DialogDescription>
              Use camera to scan or upload an image of the ID card.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {isCameraLoading && (
              <div className="flex flex-col items-center justify-center py-12 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                <p className="text-sm text-slate-600 dark:text-slate-400">Starting camera...</p>
              </div>
            )}
            
            {cameraError && (
              <div className="flex flex-col items-center justify-center py-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
                <p className="text-sm text-red-600 dark:text-red-400 text-center px-4">{cameraError}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center px-4">
                  You can upload an image file instead of using the camera.
                </p>
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={startCamera}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" /> Retry Camera
                  </Button>
                  <label className="cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const imageData = ev.target?.result as string;
                            if (cameraTarget === "front") {
                              setFrontImage(imageData);
                            } else {
                              setBackImage(imageData);
                            }
                            stopCamera();
                            setShowCameraDialog(false);
                            toast({
                              title: "Image Uploaded",
                              description: `${cameraTarget === "front" ? "Front" : "Back"} side of ID card uploaded successfully.`
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      data-testid="input-upload-fallback"
                    />
                    <Button variant="outline" size="sm" asChild>
                      <span><Upload className="h-4 w-4 mr-1" /> Upload Instead</span>
                    </Button>
                  </label>
                </div>
              </div>
            )}
            
            {!isCameraLoading && !cameraError && (
              <>
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted
                    className="w-full h-64 object-cover"
                    data-testid="video-camera-preview"
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-white/30 m-4 rounded pointer-events-none" />
                  {!isVideoReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-center text-white">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p className="text-sm">Waiting for camera stream...</p>
                        <p className="text-xs text-white/60 mt-1">If camera doesn't appear, use Upload option</p>
                      </div>
                    </div>
                  )}
                  {isVideoReady && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      Live
                    </div>
                  )}
                </div>
                
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="flex flex-col gap-3">
                  <div className="flex justify-center gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCameraDialog(false)}
                      data-testid="button-camera-cancel"
                    >
                      Cancel
                    </Button>
                    <label className="cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const imageData = ev.target?.result as string;
                              if (cameraTarget === "front") {
                                setFrontImage(imageData);
                              } else {
                                setBackImage(imageData);
                              }
                              stopCamera();
                              setShowCameraDialog(false);
                              toast({
                                title: "Image Uploaded",
                                description: `${cameraTarget === "front" ? "Front" : "Back"} side of ID card uploaded successfully.`
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        data-testid="input-upload-image"
                      />
                      <Button className="bg-green-600 hover:bg-green-700" asChild>
                        <span><Upload className="h-4 w-4 mr-1" /> Upload Image</span>
                      </Button>
                    </label>
                    <Button 
                      variant="outline"
                      onClick={capturePhoto}
                      disabled={isCameraLoading || !isVideoReady}
                      data-testid="button-camera-capture"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {isVideoReady ? "Capture" : "Waiting..."}
                    </Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Camera may not work in web-based environments. Use Upload for best results.
                  </p>
                </div>
              </>
            )}
          </div>
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
                Gat No, 167, Sahyog Nager,<br />
                Triveni Nagar, Nigdi, Pimpri-Chinchwad,<br />
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
