import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Fingerprint, 
  ScanFace, 
  Shield, 
  ShieldCheck,
  ShieldAlert,
  Lock,
  Users,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  AlertTriangle,
  Loader2,
  UserPlus,
  Search,
  History,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  HeartPulse,
  Scan,
  FileCheck,
  RefreshCw,
  Camera,
  UserCheck,
  UserX,
  Eye,
  Download,
  Sparkles,
  Video,
  VideoOff
} from "lucide-react";
import type { BiometricTemplate, BiometricVerification, ServicePatient } from "@shared/schema";

interface BiometricStats {
  totalPatients: number;
  totalTemplates: number;
  verificationsToday: number;
  successfulVerifications: number;
  fingerprintTemplates: number;
  faceTemplates: number;
}

interface FaceRecognitionStats {
  total: number;
  successful: number;
  failed: number;
  avgConfidence: number;
  activeEmbeddings: number;
  patientEmbeddings: number;
  staffEmbeddings: number;
  pendingDuplicateAlerts: number;
  settings: Record<string, string>;
}

interface RecognitionLog {
  id: string;
  userType: string;
  matchedUserId: string | null;
  confidenceScore: string;
  matchStatus: string;
  location: string;
  purpose: string;
  createdAt: string;
}

interface FaceDetection {
  box: { x: number; y: number; width: number; height: number };
  score: number;
}

const storeFormSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  biometricType: z.enum(["fingerprint", "face"], {
    required_error: "Biometric type is required",
  }),
  quality: z.coerce.number().min(0).max(100).optional(),
});

const verifyFormSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  biometricType: z.enum(["fingerprint", "face"], {
    required_error: "Biometric type is required",
  }),
});

type StoreFormData = z.infer<typeof storeFormSchema>;
type VerifyFormData = z.infer<typeof verifyFormSchema>;

export default function BiometricService() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [scanningBiometric, setScanningBiometric] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    confidenceScore: number;
    patientId: string;
  } | null>(null);
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const verifyVideoRef = useRef<HTMLVideoElement>(null);
  const verifyCanvasRef = useRef<HTMLCanvasElement>(null);
  const verifyOverlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const verifyAnimationFrameRef = useRef<number | null>(null);

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isVerifyCapturing, setIsVerifyCapturing] = useState(false);
  const [capturedFace, setCapturedFace] = useState<string | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserType, setSelectedUserType] = useState("PATIENT");
  const [recognitionResult, setRecognitionResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentDetection, setCurrentDetection] = useState<FaceDetection | null>(null);
  const [verifyCurrentDetection, setVerifyCurrentDetection] = useState<FaceDetection | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [faceQuality, setFaceQuality] = useState(0);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [savedUserInfo, setSavedUserInfo] = useState<{userId: string; userType: string} | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<BiometricStats>({
    queryKey: ["/api/biometric/stats"],
  });

  const { data: faceStats } = useQuery<FaceRecognitionStats>({
    queryKey: ["/api/face-recognition/stats"],
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery<BiometricTemplate[]>({
    queryKey: ["/api/biometric/templates"],
  });

  const { data: verifications = [], isLoading: verificationsLoading } = useQuery<BiometricVerification[]>({
    queryKey: ["/api/biometric/verifications"],
  });

  const { data: recognitionLogs = [] } = useQuery<RecognitionLog[]>({
    queryKey: ["/api/face-recognition/logs"],
  });

  const { data: patients = [] } = useQuery<ServicePatient[]>({
    queryKey: ["/api/patients/service"],
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const storeForm = useForm<StoreFormData>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      patientId: "",
      biometricType: "fingerprint",
      quality: 90,
    },
  });

  const verifyForm = useForm<VerifyFormData>({
    resolver: zodResolver(verifyFormSchema),
    defaultValues: {
      patientId: "",
      biometricType: "fingerprint",
    },
  });

  useEffect(() => {
    const loadModels = async () => {
      try {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/dist/face-api.js';
        script.async = true;
        script.onload = async () => {
          try {
            const modelPath = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model';
            await (window as any).faceapi.nets.ssdMobilenetv1.loadFromUri(modelPath);
            await (window as any).faceapi.nets.faceLandmark68Net.loadFromUri(modelPath);
            await (window as any).faceapi.nets.faceRecognitionNet.loadFromUri(modelPath);
            await (window as any).faceapi.nets.faceExpressionNet.loadFromUri(modelPath);
            setIsModelLoaded(true);
            toast({ title: "Face recognition models loaded (SSD MobileNet)" });
          } catch (modelError) {
            console.error("Error loading face-api models:", modelError);
            toast({ title: "Failed to load face models", description: "Check console for details", variant: "destructive" });
          }
        };
        script.onerror = () => {
          toast({ title: "Failed to load face-api library", variant: "destructive" });
        };
        document.body.appendChild(script);
      } catch (error) {
        console.error("Error loading face-api:", error);
        toast({ title: "Failed to load face recognition models", variant: "destructive" });
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    setSelectedUserId("");
  }, [selectedUserType]);

  const consentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/face-recognition/consent", data);
    },
    onSuccess: () => {
      toast({ title: "Consent recorded successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to record consent", description: error.message, variant: "destructive" });
    },
  });

  const embeddingMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/face-recognition/embeddings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/face-recognition/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/biometric/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/biometric/templates"] });
      setSavedUserInfo({ userId: selectedUserId, userType: selectedUserType });
      setSuccessDialogOpen(true);
      setCapturedFace(null);
      setFaceDescriptor(null);
      setCurrentDetection(null);
      stopCamera();
    },
    onError: (error: any) => {
      toast({ title: "Failed to save face data", description: error.message, variant: "destructive" });
    },
  });

  const matchMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/face-recognition/match", data);
      return response.json();
    },
    onSuccess: (result) => {
      setRecognitionResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/face-recognition/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/biometric/verifications"] });
    },
    onError: (error: any) => {
      toast({ title: "Recognition failed", description: error.message, variant: "destructive" });
    },
  });

  const storeMutation = useMutation({
    mutationFn: async (data: StoreFormData) => {
      setScanningBiometric(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const simulatedTemplateData = `BIOMETRIC_TEMPLATE_${data.biometricType}_${Date.now()}`;
      
      const response = await apiRequest("POST", `/api/biometric/${data.patientId}`, {
        biometricType: data.biometricType,
        templateData: simulatedTemplateData,
        quality: data.quality || 90,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setScanningBiometric(false);
      toast({
        title: "Biometric Stored Successfully",
        description: `Template stored with AES-256 encryption. ID: ${data.templateId?.slice(0, 8)}...`,
      });
      storeForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/biometric/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/biometric/templates"] });
    },
    onError: () => {
      setScanningBiometric(false);
      toast({
        title: "Storage Error",
        description: "Failed to store biometric template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: VerifyFormData) => {
      setScanningBiometric(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const response = await apiRequest("POST", "/api/biometric/verify", {
        patientId: data.patientId,
        biometricType: data.biometricType,
        templateData: `VERIFY_${Date.now()}`,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setScanningBiometric(false);
      setVerificationResult({
        verified: data.verified,
        confidenceScore: data.confidenceScore,
        patientId: data.patientId,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/biometric/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/biometric/verifications"] });
    },
    onError: () => {
      setScanningBiometric(false);
      toast({
        title: "Verification Failed",
        description: "Unable to verify biometric data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const drawFaceOverlay = useCallback((detection: FaceDetection | null, isAnalyzing: boolean, overlayCanvas: HTMLCanvasElement | null, video: HTMLVideoElement | null) => {
    if (!overlayCanvas || !video) return;

    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;

    overlayCanvas.width = video.videoWidth || 640;
    overlayCanvas.height = video.videoHeight || 480;
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    if (detection) {
      const { x, y, width, height } = detection.box;
      const time = Date.now() / 1000;
      
      ctx.strokeStyle = isAnalyzing ? `hsl(${(time * 60) % 360}, 100%, 50%)` : '#22c55e';
      ctx.lineWidth = 3;
      
      const cornerLength = 20;
      ctx.beginPath();
      ctx.moveTo(x, y + cornerLength);
      ctx.lineTo(x, y);
      ctx.lineTo(x + cornerLength, y);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(x + width - cornerLength, y);
      ctx.lineTo(x + width, y);
      ctx.lineTo(x + width, y + cornerLength);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(x + width, y + height - cornerLength);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x + width - cornerLength, y + height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(x + cornerLength, y + height);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x, y + height - cornerLength);
      ctx.stroke();

      if (isAnalyzing) {
        const scanLineY = y + ((time * 100) % height);
        const gradient = ctx.createLinearGradient(x, scanLineY - 10, x, scanLineY + 10);
        gradient.addColorStop(0, 'rgba(34, 197, 94, 0)');
        gradient.addColorStop(0.5, 'rgba(34, 197, 94, 0.8)');
        gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, scanLineY - 10, width, 20);
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x, y - 30, 120, 25);
      ctx.fillStyle = '#fff';
      ctx.font = '14px sans-serif';
      ctx.fillText(`Quality: ${(detection.score * 100).toFixed(0)}%`, x + 8, y - 12);
    }
  }, []);

  const l2Normalize = useCallback((vector: number[]): number[] => {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) return vector;
    return vector.map(val => val / norm);
  }, []);

  const detectFaceContinuously = useCallback(async () => {
    if (!videoRef.current || !isModelLoaded || !isCapturing) return;

    const faceApi = (window as any).faceapi;
    const detection = await faceApi.detectSingleFace(
      videoRef.current, 
      new faceApi.SsdMobilenetv1Options({ minConfidence: 0.5 })
    );

    if (detection) {
      const box = detection.box;
      setCurrentDetection({
        box: { x: box.x, y: box.y, width: box.width, height: box.height },
        score: detection.score
      });
      setFaceQuality(detection.score * 100);
    } else {
      setCurrentDetection(null);
      setFaceQuality(0);
    }

    drawFaceOverlay(currentDetection, isScanning, overlayCanvasRef.current, videoRef.current);
    animationFrameRef.current = requestAnimationFrame(detectFaceContinuously);
  }, [isModelLoaded, isCapturing, currentDetection, isScanning, drawFaceOverlay]);

  const detectFaceForVerify = useCallback(async () => {
    if (!verifyVideoRef.current || !isModelLoaded || !isVerifyCapturing) return;

    const faceApi = (window as any).faceapi;
    const detection = await faceApi.detectSingleFace(
      verifyVideoRef.current, 
      new faceApi.SsdMobilenetv1Options({ minConfidence: 0.5 })
    );

    if (detection) {
      const box = detection.box;
      setVerifyCurrentDetection({
        box: { x: box.x, y: box.y, width: box.width, height: box.height },
        score: detection.score
      });
    } else {
      setVerifyCurrentDetection(null);
    }

    drawFaceOverlay(verifyCurrentDetection, isScanning, verifyOverlayCanvasRef.current, verifyVideoRef.current);
    verifyAnimationFrameRef.current = requestAnimationFrame(detectFaceForVerify);
  }, [isModelLoaded, isVerifyCapturing, verifyCurrentDetection, isScanning, drawFaceOverlay]);

  useEffect(() => {
    if (isCapturing && isModelLoaded) {
      animationFrameRef.current = requestAnimationFrame(detectFaceContinuously);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCapturing, isModelLoaded, detectFaceContinuously]);

  useEffect(() => {
    if (isVerifyCapturing && isModelLoaded) {
      verifyAnimationFrameRef.current = requestAnimationFrame(detectFaceForVerify);
    }
    return () => {
      if (verifyAnimationFrameRef.current) {
        cancelAnimationFrame(verifyAnimationFrameRef.current);
      }
    };
  }, [isVerifyCapturing, isModelLoaded, detectFaceForVerify]);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.pause();
      if (videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
    
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }
    
    setIsCapturing(false);
    setCurrentDetection(null);
    setIsScanning(false);
    setScanProgress(0);
    setIsProcessing(false);
  }, []);

  const stopVerifyCamera = useCallback(() => {
    if (verifyAnimationFrameRef.current) {
      cancelAnimationFrame(verifyAnimationFrameRef.current);
      verifyAnimationFrameRef.current = null;
    }
    
    if (verifyVideoRef.current) {
      verifyVideoRef.current.pause();
      if (verifyVideoRef.current.srcObject) {
        const tracks = (verifyVideoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        verifyVideoRef.current.srcObject = null;
      }
    }
    
    if (verifyOverlayCanvasRef.current) {
      const ctx = verifyOverlayCanvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, verifyOverlayCanvasRef.current.width, verifyOverlayCanvasRef.current.height);
    }
    
    setIsVerifyCapturing(false);
    setVerifyCurrentDetection(null);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({ 
          title: "Camera not supported", 
          description: "Your browser doesn't support camera access. Please use a modern browser.", 
          variant: "destructive" 
        });
        return;
      }
      
      stopCamera();
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 }, 
          facingMode: "user" 
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCapturing(true);
        toast({ title: "Camera started", description: "Position your face in the center of the frame" });
      }
    } catch (error: any) {
      console.error("Error accessing camera:", error);
      let message = "Please check camera permissions in your browser settings.";
      if (error.name === "NotAllowedError") {
        message = "Camera access denied. Please allow camera permissions and try again.";
      } else if (error.name === "NotFoundError") {
        message = "No camera found. Please connect a camera and try again.";
      } else if (error.name === "NotReadableError") {
        message = "Camera is in use by another application. Please close other apps using the camera.";
      }
      toast({ title: "Failed to access camera", description: message, variant: "destructive" });
    }
  }, [toast, stopCamera]);

  const startVerifyCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({ 
          title: "Camera not supported", 
          description: "Your browser doesn't support camera access. Try opening in a new browser tab.", 
          variant: "destructive" 
        });
        return;
      }
      
      stopVerifyCamera();
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 }, 
          facingMode: "user" 
        } 
      });
      
      if (verifyVideoRef.current) {
        verifyVideoRef.current.srcObject = stream;
        await verifyVideoRef.current.play();
        setIsVerifyCapturing(true);
        toast({ title: "Camera started for verification" });
      }
    } catch (error: any) {
      console.error("Error accessing camera:", error);
      let message = "Please check camera permissions or try opening in a new browser tab.";
      if (error.name === "NotAllowedError") {
        message = "Camera access denied. Please allow camera permissions and try again.";
      } else if (error.name === "NotFoundError") {
        message = "No camera found. Please connect a camera and try again.";
      } else if (error.name === "NotReadableError") {
        message = "Camera is in use by another application.";
      } else if (error.name === "OverconstrainedError") {
        message = "Camera doesn't meet requirements. Try a different camera.";
      }
      toast({ title: "Failed to access camera", description: message, variant: "destructive" });
    }
  }, [toast, stopVerifyCamera]);

  const captureAndAnalyzeFace = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isModelLoaded) return;
    
    setIsScanning(true);
    setIsProcessing(true);
    setScanProgress(0);
    
    const progressInterval = setInterval(() => {
      setScanProgress(prev => Math.min(prev + 10, 90));
    }, 200);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0);
      
      const faceApi = (window as any).faceapi;
      const detection = await faceApi
        .detectSingleFace(video, new faceApi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      clearInterval(progressInterval);
      setScanProgress(100);
      
      if (detection) {
        const qualityScore = detection.detection.score * 100;
        
        if (qualityScore < 50) {
          toast({ 
            title: "Low quality face capture", 
            description: "Please improve lighting and face position", 
            variant: "destructive" 
          });
          setTimeout(() => {
            setIsScanning(false);
            setIsProcessing(false);
            setScanProgress(0);
          }, 500);
          return;
        }
        
        const rawDescriptor = Array.from(detection.descriptor) as number[];
        const normalizedDescriptor = l2Normalize(rawDescriptor);
        
        setCapturedFace(canvas.toDataURL('image/jpeg', 0.8));
        setFaceDescriptor(normalizedDescriptor);
        setFaceQuality(qualityScore);
        toast({ 
          title: "Face Analysis Complete (SSD MobileNet)", 
          description: `Quality: ${qualityScore.toFixed(1)}% | 128-d L2 Normalized` 
        });
      } else {
        toast({ title: "No face detected", description: "Please ensure your face is clearly visible", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error capturing face:", error);
      clearInterval(progressInterval);
      toast({ title: "Face capture failed", variant: "destructive" });
    }
    
    setTimeout(() => {
      setIsScanning(false);
      setIsProcessing(false);
      setScanProgress(0);
    }, 500);
  }, [isModelLoaded, toast, l2Normalize]);

  const captureAndVerifyFace = useCallback(async () => {
    if (!verifyVideoRef.current || !verifyCanvasRef.current || !isModelLoaded) return;
    
    setIsScanning(true);
    setIsProcessing(true);
    setScanProgress(0);
    setRecognitionResult(null);
    
    const progressInterval = setInterval(() => {
      setScanProgress(prev => Math.min(prev + 10, 90));
    }, 200);
    
    try {
      const video = verifyVideoRef.current;
      const canvas = verifyCanvasRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0);
      
      const faceApi = (window as any).faceapi;
      const detection = await faceApi
        .detectSingleFace(video, new faceApi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      clearInterval(progressInterval);
      setScanProgress(100);
      
      if (detection) {
        const rawDescriptor = Array.from(detection.descriptor) as number[];
        const normalizedDescriptor = l2Normalize(rawDescriptor);
        setFaceDescriptor(normalizedDescriptor);
        toast({ title: "Face captured, searching for match..." });
        
        matchMutation.mutate({
          embeddingVector: normalizedDescriptor,
          userType: selectedUserType,
          purpose: "VERIFICATION",
          location: "BIOMETRIC_SERVICE",
        });
      } else {
        toast({ title: "No face detected", variant: "destructive" });
      }
    } catch (error) {
      clearInterval(progressInterval);
      toast({ title: "Face capture failed", variant: "destructive" });
    }
    
    setTimeout(() => {
      setIsScanning(false);
      setIsProcessing(false);
      setScanProgress(0);
    }, 500);
  }, [isModelLoaded, toast, l2Normalize, selectedUserType, matchMutation]);

  const handleSaveEmbedding = () => {
    if (!faceDescriptor || !selectedUserId) {
      toast({ title: "Please select a user and capture a face", variant: "destructive" });
      return;
    }
    
    consentMutation.mutate({
      userId: selectedUserId,
      userType: selectedUserType,
      consentStatus: true,
    }, {
      onSuccess: () => {
        embeddingMutation.mutate({
          userId: selectedUserId,
          userType: selectedUserType,
          embeddingVector: faceDescriptor,
          faceQualityScore: faceQuality,
          captureLocation: "REGISTRATION",
        });
      },
    });
  };

  const handleFaceRecognition = () => {
    if (!faceDescriptor) {
      toast({ title: "Please capture a face first", variant: "destructive" });
      return;
    }
    
    matchMutation.mutate({
      embeddingVector: faceDescriptor,
      userType: selectedUserType,
      purpose: "VERIFICATION",
      location: "BIOMETRIC_SERVICE",
    });
  };

  const handleStore = (data: StoreFormData) => {
    storeMutation.mutate(data);
  };

  const handleVerify = (data: VerifyFormData) => {
    setVerificationResult(null);
    verifyMutation.mutate(data);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : patientId;
  };

  const getPatientDisplay = (patient: ServicePatient) => {
    return `${patient.firstName} ${patient.lastName}`;
  };

  const getUserName = (userId: string) => {
    const user = users?.find(u => String(u.id) === String(userId));
    return user?.name || user?.username || userId;
  };

  const getFilteredUsers = () => {
    return users?.filter(u => {
      if (selectedUserType === "PATIENT") return u.role === "PATIENT";
      if (selectedUserType === "DOCTOR") return u.role === "DOCTOR";
      if (selectedUserType === "NURSE") return u.role === "NURSE";
      if (selectedUserType === "STAFF") return !["PATIENT", "DOCTOR", "NURSE", "ADMIN"].includes(u.role);
      return false;
    }) || [];
  };

  const watchedBiometricType = storeForm.watch("biometricType");

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-900 dark:to-slate-950 flex flex-col">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="bg-white/10 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <HeartPulse className="h-5 w-5 sm:h-8 sm:w-8" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-semibold truncate" data-testid="text-hospital-name">
                  Gravity Hospital
                </h1>
                <p className="text-blue-100 text-xs sm:text-sm flex items-center gap-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">Nigdi, Pimpri-Chinchwad</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs" data-testid="badge-hipaa">
                <ShieldCheck className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">HIPAA </span>Compliant
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs" data-testid="badge-encryption">
                <Lock className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">AES-256 </span>Encrypted
              </Badge>
              <Badge 
                className={`text-xs ${isModelLoaded ? "bg-green-500/20 text-green-100 border-green-400/30" : "bg-yellow-500/20 text-yellow-100 border-yellow-400/30"}`}
                data-testid="badge-model-status"
              >
                <ScanFace className="h-3 w-3 mr-1" />
                {isModelLoaded ? "Face AI Ready" : "Loading AI..."}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border-b shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-2 sm:p-3 rounded-xl flex-shrink-0">
                <Fingerprint className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white" data-testid="text-page-title">
                  Biometric Service
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Fingerprint & Face Recognition System
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="w-full sm:w-auto" data-testid="button-refresh" onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/biometric/stats"] });
                queryClient.invalidateQueries({ queryKey: ["/api/face-recognition/stats"] });
              }}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 gap-1 bg-blue-50 dark:bg-slate-800 p-1">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white px-1 sm:px-3" 
              data-testid="tab-dashboard"
            >
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger 
              value="store" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white px-1 sm:px-3" 
              data-testid="tab-store"
            >
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Enroll Patient</span>
              <span className="sm:hidden">Enroll</span>
            </TabsTrigger>
            <TabsTrigger 
              value="verify" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white px-1 sm:px-3" 
              data-testid="tab-verify"
            >
              <Scan className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Verify Identity</span>
              <span className="sm:hidden">Verify</span>
            </TabsTrigger>
            <TabsTrigger 
              value="logs" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white px-1 sm:px-3" 
              data-testid="tab-logs"
            >
              <FileCheck className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Audit Logs</span>
              <span className="sm:hidden">Logs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {statsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="border-l-4 border-l-blue-500" data-testid="card-total-patients">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Enrolled Patients
                      </CardTitle>
                      <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg">
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {stats?.totalPatients || 0}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        With biometric data stored
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500" data-testid="card-registered-faces">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Registered Faces
                      </CardTitle>
                      <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-lg">
                        <ScanFace className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {faceStats?.activeEmbeddings || 0}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                          Patients: {faceStats?.patientEmbeddings || 0}
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                          Staff: {faceStats?.staffEmbeddings || 0}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500" data-testid="card-successful-matches">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Successful Matches
                      </CardTitle>
                      <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {faceStats?.successful || 0}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Face recognition matches
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-amber-500" data-testid="card-alerts">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Pending Alerts
                      </CardTitle>
                      <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {faceStats?.pendingDuplicateAlerts || 0}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Duplicate face alerts
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card data-testid="card-security-status">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Shield className="h-5 w-5 text-blue-600" />
                        Security Status
                      </CardTitle>
                      <CardDescription>
                        System security and compliance overview
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-500 p-2 rounded-full">
                            <ShieldCheck className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <span className="font-medium text-slate-900 dark:text-white">Encryption</span>
                            <p className="text-xs text-slate-500">Data protection active</p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500 hover:bg-emerald-600">AES-256-CBC</Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-500 p-2 rounded-full">
                            <ScanFace className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <span className="font-medium text-slate-900 dark:text-white">Face AI Model</span>
                            <p className="text-xs text-slate-500">SSD MobileNet v1</p>
                          </div>
                        </div>
                        <Badge className={isModelLoaded ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"}>
                          {isModelLoaded ? "Loaded" : "Loading"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-500 p-2 rounded-full">
                            <FileCheck className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <span className="font-medium text-slate-900 dark:text-white">HIPAA Compliance</span>
                            <p className="text-xs text-slate-500">Healthcare data standards</p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500 hover:bg-emerald-600">Compliant</Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-500 p-2 rounded-full">
                            <Database className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <span className="font-medium text-slate-900 dark:text-white">Face Embeddings</span>
                            <p className="text-xs text-slate-500">128-D L2 Normalized</p>
                          </div>
                        </div>
                        <Badge className="bg-blue-500 hover:bg-blue-600">Secure</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-recent-activity">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="h-5 w-5 text-blue-600" />
                        Recent Activity
                      </CardTitle>
                      <CardDescription>
                        Latest verification and recognition attempts
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {recognitionLogs.length === 0 && verifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                          <History className="h-12 w-12 mb-3" />
                          <p className="font-medium">No Recent Activity</p>
                          <p className="text-sm">Activity history will appear here</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {recognitionLogs.slice(0, 5).map((log) => (
                            <div 
                              key={log.id} 
                              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                              data-testid={`log-${log.id}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${
                                  log.matchStatus === "MATCHED" 
                                    ? "bg-emerald-100 dark:bg-emerald-900/50" 
                                    : "bg-red-100 dark:bg-red-900/50"
                                }`}>
                                  {log.matchStatus === "MATCHED" ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-slate-900 dark:text-white">
                                    {log.matchedUserId ? getUserName(log.matchedUserId) : "Unknown"}
                                  </p>
                                  <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <ScanFace className="h-3 w-3" />
                                    {log.userType} - {log.purpose}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant={log.matchStatus === "MATCHED" ? "default" : "destructive"} className="mb-1">
                                  {(parseFloat(log.confidenceScore) * 100).toFixed(0)}%
                                </Badge>
                                <p className="text-xs text-slate-400">
                                  {formatDate(log.createdAt)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="store" className="space-y-6 mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card data-testid="card-face-capture">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Camera className="h-5 w-5 text-blue-600" />
                    Face Capture
                  </CardTitle>
                  <CardDescription>
                    Capture face data using camera for biometric enrollment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md flex items-start gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
                    <span>Camera requires browser permissions. If camera fails, try opening in a new browser tab with HTTPS.</span>
                  </div>
                  <div className="relative bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden aspect-video">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      muted 
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <canvas 
                      ref={overlayCanvasRef} 
                      className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {!isCapturing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Button onClick={startCamera} disabled={!isModelLoaded} size="lg" data-testid="button-start-camera">
                          <Camera className="mr-2 h-5 w-5" />
                          Start Camera
                        </Button>
                      </div>
                    )}
                    
                    {isScanning && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                        <div className="bg-black/70 rounded-lg p-4 text-center">
                          <Sparkles className="h-8 w-8 animate-pulse text-green-400 mx-auto mb-2" />
                          <p className="text-white font-medium">Analyzing Face...</p>
                          <Progress value={scanProgress} className="mt-2 w-32" />
                        </div>
                      </div>
                    )}
                    
                    {currentDetection && !isScanning && (
                      <div className="absolute bottom-4 left-4 bg-black/70 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 text-white text-sm">
                          <div className={`w-2 h-2 rounded-full ${faceQuality > 70 ? 'bg-green-500' : faceQuality > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                          Face Detected - Quality: {faceQuality.toFixed(0)}%
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={captureAndAnalyzeFace} 
                      disabled={!isCapturing || isProcessing || !currentDetection}
                      className="flex-1"
                      size="lg"
                      data-testid="button-capture-face"
                    >
                      {isProcessing ? (
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <ScanFace className="mr-2 h-5 w-5" />
                      )}
                      {isProcessing ? "Analyzing..." : "Capture & Analyze Face"}
                    </Button>
                    <Button 
                      onClick={stopCamera} 
                      variant="outline"
                      disabled={!isCapturing}
                      data-testid="button-stop-camera"
                    >
                      <VideoOff className="h-4 w-4" />
                    </Button>
                  </div>

                  {capturedFace && (
                    <div className="space-y-4 p-4 border-2 border-green-500 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <div className="flex items-center gap-4">
                        <img 
                          src={capturedFace} 
                          alt="Captured face" 
                          className="w-24 h-24 rounded-lg object-cover border-2 border-green-500"
                        />
                        <div className="flex-1">
                          <Badge className="mb-2 bg-green-500">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Face Analysis Complete
                          </Badge>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            128-dimensional face embedding generated
                          </p>
                          <p className="text-sm font-medium text-green-600">
                            Quality Score: {faceQuality.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-register-face">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Fingerprint className="h-5 w-5 text-blue-600" />
                    Register Biometric
                  </CardTitle>
                  <CardDescription>
                    Link captured face to a patient or staff member
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>User Type</Label>
                    <Select value={selectedUserType} onValueChange={setSelectedUserType}>
                      <SelectTrigger data-testid="select-user-type">
                        <SelectValue placeholder="Select user type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PATIENT">Patient</SelectItem>
                        <SelectItem value="STAFF">Staff</SelectItem>
                        <SelectItem value="DOCTOR">Doctor</SelectItem>
                        <SelectItem value="NURSE">Nurse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Select User ({getFilteredUsers().length} available)</Label>
                    <Select 
                      value={selectedUserId || undefined} 
                      onValueChange={(val) => setSelectedUserId(val)}
                    >
                      <SelectTrigger data-testid="select-user">
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {getFilteredUsers().length === 0 ? (
                          <div className="p-4 text-center text-slate-500">No users found for this type</div>
                        ) : (
                          getFilteredUsers().map(user => (
                            <SelectItem key={user.id} value={String(user.id)}>
                              {user.name || user.username} ({user.role})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {!faceDescriptor && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/50 rounded-lg space-y-2 border border-amber-300">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-amber-800 dark:text-amber-200">Step Required</span>
                      </div>
                      <p className="text-sm text-amber-600 dark:text-amber-300">
                        First click "Capture & Analyze Face" button above to capture the face before saving.
                      </p>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800 dark:text-blue-200">Privacy Notice</span>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      By registering, consent is given for biometric data storage. 
                      Only encrypted face embeddings are stored, not raw images.
                    </p>
                  </div>

                  <Button 
                    onClick={handleSaveEmbedding}
                    disabled={!faceDescriptor || !selectedUserId || embeddingMutation.isPending || consentMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                    data-testid="button-save-face"
                  >
                    {embeddingMutation.isPending || consentMutation.isPending ? (
                      <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-5 w-5" />
                    )}
                    Save Face Data to Database
                  </Button>

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Fingerprint className="h-4 w-4" />
                      <span className="text-sm font-medium">Or use simulated fingerprint enrollment</span>
                    </div>
                    
                    <Form {...storeForm}>
                      <form onSubmit={storeForm.handleSubmit(handleStore)} className="space-y-4">
                        <FormField
                          control={storeForm.control}
                          name="patientId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700 dark:text-slate-300">Select Patient</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger className="h-11" data-testid="select-patient-store">
                                    <SelectValue placeholder="Choose a patient..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {patients.map((patient) => (
                                    <SelectItem key={patient.id} value={patient.id}>
                                      {getPatientDisplay(patient)} ({patient.id.slice(0, 8)})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          variant="outline"
                          className="w-full h-11"
                          disabled={storeMutation.isPending || scanningBiometric}
                          data-testid="button-capture-fingerprint"
                        >
                          {scanningBiometric ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Scanning...
                            </>
                          ) : (
                            <>
                              <Fingerprint className="h-4 w-4 mr-2" />
                              Simulate Fingerprint Capture
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card data-testid="card-registered-templates">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="h-5 w-5 text-blue-600" />
                  Registered Biometric Templates
                </CardTitle>
                <CardDescription>
                  All enrolled patient biometric data with encryption status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                    <Database className="h-10 w-10 mb-2" />
                    <p className="font-medium">No Templates Registered</p>
                    <p className="text-sm">Enrolled biometric templates will appear here</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                      <div 
                        key={template.id}
                        className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:shadow-md transition-shadow"
                        data-testid={`template-${template.id}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${
                              template.biometricType === "fingerprint" 
                                ? "bg-blue-100 dark:bg-blue-900/50" 
                                : "bg-purple-100 dark:bg-purple-900/50"
                            }`}>
                              {template.biometricType === "fingerprint" ? (
                                <Fingerprint className="h-5 w-5 text-blue-600" />
                              ) : (
                                <ScanFace className="h-5 w-5 text-purple-600" />
                              )}
                            </div>
                            <span className="font-medium capitalize text-slate-900 dark:text-white">
                              {template.biometricType}
                            </span>
                          </div>
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                            <span>Patient:</span>
                            <span className="font-medium">{getPatientName(template.patientId)}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                            <span>Quality:</span>
                            <span className="font-medium">{template.quality}%</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                            <span>Created:</span>
                            <span className="text-xs">{formatDate(template.createdAt)}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t flex items-center gap-1 text-xs text-emerald-600">
                          <Lock className="h-3 w-3" />
                          <span>AES-256 Encrypted</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verify" className="space-y-6 mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card data-testid="card-face-verification">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Eye className="h-5 w-5 text-blue-600" />
                    Face Verification
                  </CardTitle>
                  <CardDescription>
                    Verify identity using live face recognition
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md flex items-start gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
                    <span>Camera requires browser permissions. If camera fails, try opening in a new browser tab with HTTPS.</span>
                  </div>
                  <div className="relative bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden aspect-video">
                    <video 
                      ref={verifyVideoRef} 
                      autoPlay 
                      muted 
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <canvas 
                      ref={verifyOverlayCanvasRef} 
                      className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    />
                    <canvas ref={verifyCanvasRef} className="hidden" />
                    
                    {!isVerifyCapturing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Button onClick={startVerifyCamera} disabled={!isModelLoaded} data-testid="button-verify-start-camera">
                          <Camera className="mr-2 h-4 w-4" />
                          Start Camera
                        </Button>
                      </div>
                    )}
                    
                    {verifyCurrentDetection && (
                      <div className="absolute bottom-4 left-4 bg-black/70 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 text-white text-sm">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Face Detected
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Search Type</Label>
                    <Select value={selectedUserType} onValueChange={setSelectedUserType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PATIENT">Patient</SelectItem>
                        <SelectItem value="STAFF">Staff</SelectItem>
                        <SelectItem value="DOCTOR">Doctor</SelectItem>
                        <SelectItem value="NURSE">Nurse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={captureAndVerifyFace}
                      disabled={!isVerifyCapturing || isProcessing || matchMutation.isPending}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      data-testid="button-verify-capture"
                    >
                      {matchMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Matching...
                        </>
                      ) : isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <ScanFace className="mr-2 h-4 w-4" />
                          Scan Face
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={handleFaceRecognition}
                      disabled={!faceDescriptor || matchMutation.isPending}
                      variant="secondary"
                      className="flex-1"
                      data-testid="button-verify-match"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Find Match
                    </Button>
                    <Button 
                      onClick={stopVerifyCamera} 
                      variant="outline"
                      disabled={!isVerifyCapturing}
                    >
                      <VideoOff className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-recognition-result">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Recognition Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {matchMutation.isPending ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-16 w-16 mx-auto mb-4 text-blue-600 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-300 font-medium">Searching database...</p>
                        <p className="text-sm text-slate-400 mt-1">Comparing face against {selectedUserType.toLowerCase()} records</p>
                      </div>
                    </div>
                  ) : recognitionResult ? (
                    <div className="space-y-4">
                      <div className={`p-6 rounded-lg text-center ${
                        recognitionResult.matched 
                          ? "bg-green-100 dark:bg-green-900/30" 
                          : "bg-red-100 dark:bg-red-900/30"
                      }`}>
                        {recognitionResult.matched ? (
                          <UserCheck className="h-16 w-16 mx-auto text-green-600 mb-4" />
                        ) : (
                          <UserX className="h-16 w-16 mx-auto text-red-600 mb-4" />
                        )}
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          {recognitionResult.matched ? "Identity Verified" : "No Match Found"}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 mt-2">
                          Confidence: {(recognitionResult.confidenceScore * 100).toFixed(1)}%
                        </p>
                      </div>

                      {recognitionResult.matched && (
                        <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          {recognitionResult.multipleMatches && (
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded border border-amber-300 dark:border-amber-700 mb-3">
                              <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Multiple matches found ({recognitionResult.matchCount}). Showing best match.
                              </p>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-500">User Name</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{getUserName(recognitionResult.matchedUserId)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">User ID</span>
                            <span className="font-mono text-slate-900 dark:text-white text-xs">{recognitionResult.matchedUserId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">User Type</span>
                            <Badge>{recognitionResult.matchedUserType}</Badge>
                          </div>
                          {recognitionResult.processingTimeMs && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Processing Time</span>
                              <span className="text-slate-900 dark:text-white">{recognitionResult.processingTimeMs}ms</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400">
                      <div className="text-center">
                        <ScanFace className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>Scan a face to see results</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card data-testid="card-fingerprint-verify">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Fingerprint className="h-5 w-5 text-blue-600" />
                  Fingerprint Verification (Simulated)
                </CardTitle>
                <CardDescription>
                  Fallback fingerprint verification option
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...verifyForm}>
                  <form onSubmit={verifyForm.handleSubmit(handleVerify)} className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={verifyForm.control}
                        name="patientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 dark:text-slate-300">Patient ID</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter patient ID..."
                                className="h-11"
                                data-testid="input-patient-id-verify"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={verifyForm.control}
                        name="biometricType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 dark:text-slate-300">Verification Method</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "fingerprint"}>
                              <FormControl>
                                <SelectTrigger className="h-11" data-testid="select-biometric-type-verify">
                                  <SelectValue placeholder="Select method..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="fingerprint">
                                  <div className="flex items-center gap-2">
                                    <Fingerprint className="h-4 w-4 text-blue-600" />
                                    <span>Fingerprint Scan</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="face">
                                  <div className="flex items-center gap-2">
                                    <ScanFace className="h-4 w-4 text-purple-600" />
                                    <span>Face Recognition</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                      disabled={verifyMutation.isPending || scanningBiometric}
                      data-testid="button-verify-identity"
                    >
                      {scanningBiometric ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Scan className="h-4 w-4 mr-2" />
                          Verify Identity
                        </>
                      )}
                    </Button>
                  </form>
                </Form>

                {verificationResult && (
                  <div className={`mt-6 p-4 rounded-lg ${
                    verificationResult.verified 
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" 
                      : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  }`}>
                    <div className="flex items-center gap-3">
                      {verificationResult.verified ? (
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      ) : (
                        <XCircle className="h-8 w-8 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {verificationResult.verified ? "Identity Verified" : "Verification Failed"}
                        </p>
                        <p className="text-sm text-slate-500">
                          Confidence: {verificationResult.confidenceScore}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6 mt-6">
            <Card data-testid="card-recognition-logs">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                  Face Recognition Audit Logs
                </CardTitle>
                <CardDescription>
                  All face recognition attempts with timestamps and confidence scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recognitionLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                    <History className="h-12 w-12 mb-3" />
                    <p className="font-medium">No Recognition Logs</p>
                    <p className="text-sm">Face recognition attempts will appear here</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>User Type</TableHead>
                        <TableHead>Matched User</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recognitionLogs.map((log) => (
                        <TableRow key={log.id} data-testid={`log-row-${log.id}`}>
                          <TableCell className="text-sm">
                            {formatDate(log.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.userType}</Badge>
                          </TableCell>
                          <TableCell>
                            {log.matchedUserId ? getUserName(log.matchedUserId) : "-"}
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {log.purpose}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {(parseFloat(log.confidenceScore) * 100).toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={log.matchStatus === "MATCHED" ? "default" : "destructive"}>
                              {log.matchStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-biometric-verifications">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Fingerprint className="h-5 w-5 text-blue-600" />
                  Biometric Verification History
                </CardTitle>
                <CardDescription>
                  All fingerprint and face verification attempts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {verificationsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : verifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                    <History className="h-10 w-10 mb-2" />
                    <p className="font-medium">No Verification History</p>
                    <p className="text-sm">Verification attempts will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {verifications.map((verification) => (
                      <div 
                        key={verification.id} 
                        className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                        data-testid={`verification-${verification.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            verification.isMatch 
                              ? "bg-emerald-100 dark:bg-emerald-900/50" 
                              : "bg-red-100 dark:bg-red-900/50"
                          }`}>
                            {verification.isMatch ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {getPatientName(verification.patientId)}
                            </p>
                            <p className="text-sm text-slate-500 flex items-center gap-2">
                              {verification.biometricType === "fingerprint" ? (
                                <Fingerprint className="h-3 w-3" />
                              ) : (
                                <ScanFace className="h-3 w-3" />
                              )}
                              {verification.biometricType === "fingerprint" ? "Fingerprint" : "Face"} verification
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={verification.isMatch ? "default" : "destructive"}>
                            {verification.confidenceScore}%
                          </Badge>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDate(verification.verifiedAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Face Data Saved Successfully
            </DialogTitle>
            <DialogDescription>
              The face embedding has been securely stored in the database.
            </DialogDescription>
          </DialogHeader>
          {savedUserInfo && (
            <div className="space-y-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex justify-between">
                <span className="text-slate-500">User ID:</span>
                <span className="font-mono">{savedUserInfo.userId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">User Type:</span>
                <Badge>{savedUserInfo.userType}</Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSuccessDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
