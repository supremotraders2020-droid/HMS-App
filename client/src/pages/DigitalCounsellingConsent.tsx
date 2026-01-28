import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  FileCheck,
  Download,
  Save,
  User,
  Calendar,
  Clock,
  Stethoscope,
  PenTool,
  Eraser,
  Languages,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  GraduationCap
} from "lucide-react";

interface UserInfo {
  id: string;
  username: string;
  name: string;
  role: string;
  tenantId: string;
  hospitalName: string;
}

interface DigitalCounsellingConsentProps {
  currentUser: UserInfo;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone?: string;
  email?: string;
  address?: string;
}

const COUNSELLING_CONTENT = {
  english: {
    title: "PATIENT COUNSELLING, EDUCATION & DOCUMENTATION CONSENT FORM",
    sections: [
      {
        heading: "1. COUNSELLING & EDUCATION EXPLANATION",
        content: [
          "I have been provided with comprehensive counselling and education about my medical condition, diagnosis, and the treatment plan recommended by the medical team.",
          "The healthcare providers have explained to me in a language I understand:",
          "• The nature of my illness/condition and its implications",
          "• The recommended treatment options, including their benefits and risks",
          "• Alternative treatment options available, if any",
          "• The expected outcomes and potential complications",
          "• The importance of following the prescribed treatment regimen",
          "• Lifestyle modifications and preventive measures",
          "• Warning signs and symptoms that require immediate medical attention",
          "I have been given the opportunity to ask questions, and all my queries have been answered satisfactorily."
        ]
      },
      {
        heading: "2. DOCUMENTATION & CONFIDENTIALITY",
        content: [
          "I understand and consent to the following regarding documentation and confidentiality:",
          "• My medical records and personal information will be maintained in accordance with applicable laws and hospital policies",
          "• My health information may be shared with other healthcare providers involved in my care",
          "• My records may be used for quality improvement, medical education, and research purposes in a de-identified manner",
          "• I have the right to access my medical records upon request",
          "• The hospital maintains strict confidentiality protocols to protect my privacy",
          "• Any disclosure of my health information to third parties will require my explicit consent, except as required by law"
        ]
      },
      {
        heading: "3. VOLUNTARY CONSENT DECLARATION",
        content: [
          "I hereby declare that:",
          "• This consent is given voluntarily without any coercion or undue influence",
          "• I have had sufficient time to consider the information provided",
          "• I understand that I have the right to withdraw my consent at any time",
          "• I have provided accurate and complete information about my medical history",
          "• I agree to cooperate with the medical team and follow the recommended treatment plan",
          "• I understand the importance of attending follow-up appointments and complying with prescribed medications",
          "By signing below, I confirm that I have read and understood this consent form, or it has been read and explained to me in a language I understand."
        ]
      }
    ]
  },
  hindi: {
    title: "रोगी परामर्श, शिक्षा एवं दस्तावेज़ीकरण सहमति पत्र",
    sections: [
      {
        heading: "1. परामर्श एवं शिक्षा विवरण",
        content: [
          "मुझे मेरी चिकित्सा स्थिति, निदान और चिकित्सा दल द्वारा अनुशंसित उपचार योजना के बारे में व्यापक परामर्श और शिक्षा प्रदान की गई है।",
          "स्वास्थ्य सेवा प्रदाताओं ने मुझे मेरी समझ की भाषा में समझाया है:",
          "• मेरी बीमारी/स्थिति की प्रकृति और इसके प्रभाव",
          "• अनुशंसित उपचार विकल्प, उनके लाभ और जोखिम सहित",
          "• उपलब्ध वैकल्पिक उपचार विकल्प, यदि कोई हो",
          "• अपेक्षित परिणाम और संभावित जटिलताएं",
          "• निर्धारित उपचार नियम का पालन करने का महत्व",
          "• जीवनशैली में संशोधन और निवारक उपाय",
          "• चेतावनी के संकेत और लक्षण जिनके लिए तुरंत चिकित्सा ध्यान देने की आवश्यकता है",
          "मुझे प्रश्न पूछने का अवसर दिया गया है, और मेरे सभी प्रश्नों का संतोषजनक उत्तर दिया गया है।"
        ]
      },
      {
        heading: "2. दस्तावेज़ीकरण एवं गोपनीयता",
        content: [
          "मैं दस्तावेज़ीकरण और गोपनीयता के संबंध में निम्नलिखित को समझता/समझती हूं और सहमति देता/देती हूं:",
          "• मेरे चिकित्सा रिकॉर्ड और व्यक्तिगत जानकारी लागू कानूनों और अस्पताल नीतियों के अनुसार बनाए रखी जाएगी",
          "• मेरी स्वास्थ्य जानकारी मेरी देखभाल में शामिल अन्य स्वास्थ्य सेवा प्रदाताओं के साथ साझा की जा सकती है",
          "• मेरे रिकॉर्ड का उपयोग गुणवत्ता सुधार, चिकित्सा शिक्षा और अनुसंधान उद्देश्यों के लिए किया जा सकता है",
          "• अनुरोध पर मुझे अपने चिकित्सा रिकॉर्ड तक पहुंचने का अधिकार है",
          "• अस्पताल मेरी गोपनीयता की रक्षा के लिए सख्त गोपनीयता प्रोटोकॉल बनाए रखता है",
          "• तीसरे पक्ष को मेरी स्वास्थ्य जानकारी के किसी भी प्रकटीकरण के लिए मेरी स्पष्ट सहमति की आवश्यकता होगी, कानून द्वारा आवश्यक होने को छोड़कर"
        ]
      },
      {
        heading: "3. स्वैच्छिक सहमति घोषणा",
        content: [
          "मैं एतद्द्वारा घोषित करता/करती हूं कि:",
          "• यह सहमति बिना किसी दबाव या अनुचित प्रभाव के स्वेच्छा से दी गई है",
          "• मुझे प्रदान की गई जानकारी पर विचार करने के लिए पर्याप्त समय मिला है",
          "• मैं समझता/समझती हूं कि मुझे किसी भी समय अपनी सहमति वापस लेने का अधिकार है",
          "• मैंने अपने चिकित्सा इतिहास के बारे में सटीक और पूर्ण जानकारी प्रदान की है",
          "• मैं चिकित्सा दल के साथ सहयोग करने और अनुशंसित उपचार योजना का पालन करने के लिए सहमत हूं",
          "• मैं फॉलो-अप अपॉइंटमेंट में भाग लेने और निर्धारित दवाओं का पालन करने के महत्व को समझता/समझती हूं",
          "नीचे हस्ताक्षर करके, मैं पुष्टि करता/करती हूं कि मैंने इस सहमति पत्र को पढ़ा और समझा है, या इसे मुझे मेरी समझ की भाषा में पढ़कर समझाया गया है।"
        ]
      }
    ]
  },
  marathi: {
    title: "रुग्ण समुपदेशन, शिक्षण आणि दस्तऐवजीकरण संमती पत्र",
    sections: [
      {
        heading: "1. समुपदेशन आणि शिक्षण स्पष्टीकरण",
        content: [
          "मला माझ्या वैद्यकीय स्थिती, निदान आणि वैद्यकीय संघाने शिफारस केलेल्या उपचार योजनेबद्दल सर्वसमावेशक समुपदेशन आणि शिक्षण प्रदान करण्यात आले आहे.",
          "आरोग्य सेवा प्रदात्यांनी मला माझ्या समजेच्या भाषेत समजावून सांगितले आहे:",
          "• माझ्या आजाराचे/स्थितीचे स्वरूप आणि त्याचे परिणाम",
          "• शिफारस केलेले उपचार पर्याय, त्यांचे फायदे आणि जोखीम यासह",
          "• उपलब्ध पर्यायी उपचार पर्याय, असल्यास",
          "• अपेक्षित परिणाम आणि संभाव्य गुंतागुंत",
          "• निर्धारित उपचार पद्धतीचे पालन करण्याचे महत्त्व",
          "• जीवनशैलीतील बदल आणि प्रतिबंधात्मक उपाय",
          "• चेतावणी चिन्हे आणि लक्षणे ज्यांना त्वरित वैद्यकीय लक्ष आवश्यक आहे",
          "मला प्रश्न विचारण्याची संधी देण्यात आली आहे, आणि माझ्या सर्व प्रश्नांची समाधानकारक उत्तरे दिली गेली आहेत."
        ]
      },
      {
        heading: "2. दस्तऐवजीकरण आणि गोपनीयता",
        content: [
          "दस्तऐवजीकरण आणि गोपनीयतेबाबत मी खालील गोष्टी समजतो/समजते आणि संमती देतो/देते:",
          "• माझे वैद्यकीय नोंदी आणि वैयक्तिक माहिती लागू कायदे आणि हॉस्पिटल धोरणांनुसार राखली जाईल",
          "• माझ्या आरोग्य माहितीची माझ्या काळजीमध्ये सहभागी इतर आरोग्य सेवा प्रदात्यांशी देवाणघेवाण केली जाऊ शकते",
          "• माझ्या नोंदींचा वापर गुणवत्ता सुधारणा, वैद्यकीय शिक्षण आणि संशोधन हेतूंसाठी केला जाऊ शकतो",
          "• विनंतीनुसार माझ्या वैद्यकीय नोंदींमध्ये प्रवेश करण्याचा मला अधिकार आहे",
          "• हॉस्पिटल माझ्या गोपनीयतेचे रक्षण करण्यासाठी कठोर गोपनीयता प्रोटोकॉल राखते",
          "• तृतीय पक्षांना माझ्या आरोग्य माहितीच्या कोणत्याही प्रकटीकरणासाठी माझ्या स्पष्ट संमतीची आवश्यकता असेल, कायद्याने आवश्यक असल्याशिवाय"
        ]
      },
      {
        heading: "3. ऐच्छिक संमती घोषणा",
        content: [
          "मी येथे घोषित करतो/करते की:",
          "• ही संमती कोणत्याही दबावाशिवाय किंवा अयोग्य प्रभावाशिवाय स्वेच्छेने दिली गेली आहे",
          "• प्रदान केलेल्या माहितीचा विचार करण्यासाठी मला पुरेसा वेळ मिळाला आहे",
          "• मला माहित आहे की मला कधीही माझी संमती मागे घेण्याचा अधिकार आहे",
          "• मी माझ्या वैद्यकीय इतिहासाबद्दल अचूक आणि पूर्ण माहिती दिली आहे",
          "• मी वैद्यकीय संघाशी सहकार्य करण्यास आणि शिफारस केलेल्या उपचार योजनेचे पालन करण्यास सहमत आहे",
          "• मला फॉलो-अप भेटींना उपस्थित राहण्याचे आणि निर्धारित औषधांचे पालन करण्याचे महत्त्व समजते",
          "खाली स्वाक्षरी करून, मी पुष्टी करतो/करते की मी हा संमती फॉर्म वाचला आणि समजला आहे, किंवा मला माझ्या समजेच्या भाषेत वाचून समजावून सांगितला आहे."
        ]
      }
    ]
  }
};

export default function DigitalCounsellingConsent({ currentUser }: DigitalCounsellingConsentProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState("english");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorDesignation, setDoctorDesignation] = useState("");
  const [witnessName, setWitnessName] = useState("");
  const [witnessRelation, setWitnessRelation] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [isWitnessSigned, setIsWitnessSigned] = useState(false);
  
  const patientCanvasRef = useRef<HTMLCanvasElement>(null);
  const witnessCanvasRef = useRef<HTMLCanvasElement>(null);
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formattedTime = currentDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const { data: patients = [], isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ['/api/service-patients'],
    queryFn: async () => {
      const res = await fetch('/api/service-patients', {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
        },
        credentials: 'include',
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const selectedPatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null;

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const saveConsentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/digital-consents', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/digital-consents'] });
      toast({
        title: "Consent Saved Successfully",
        description: "The digital consent has been recorded in the system.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to save consent",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const initCanvas = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  useEffect(() => {
    initCanvas(patientCanvasRef.current);
    initCanvas(witnessCanvasRef.current);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>, isWitness: boolean = false) => {
    const canvas = isWitness ? witnessCanvasRef.current : patientCanvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>, isWitness: boolean = false) => {
    if (!isDrawing) return;
    const canvas = isWitness ? witnessCanvasRef.current : patientCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    }
  };

  const handleMouseUp = (isWitness: boolean = false) => {
    setIsDrawing(false);
    if (isWitness) {
      setIsWitnessSigned(true);
    } else {
      setIsSigned(true);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>, isWitness: boolean = false) => {
    e.preventDefault();
    const canvas = isWitness ? witnessCanvasRef.current : patientCanvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      ctx.beginPath();
      ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>, isWitness: boolean = false) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = isWitness ? witnessCanvasRef.current : patientCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
      ctx.stroke();
    }
  };

  const handleTouchEnd = (isWitness: boolean = false) => {
    setIsDrawing(false);
    if (isWitness) {
      setIsWitnessSigned(true);
    } else {
      setIsSigned(true);
    }
  };

  const clearSignature = (isWitness: boolean = false) => {
    const canvas = isWitness ? witnessCanvasRef.current : patientCanvasRef.current;
    initCanvas(canvas);
    if (isWitness) {
      setIsWitnessSigned(false);
    } else {
      setIsSigned(false);
    }
  };

  const getSignatureData = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  };

  const handleSaveConsent = async () => {
    if (!selectedPatient) {
      toast({
        title: "No Patient Selected",
        description: "Please select a patient before saving the consent.",
        variant: "destructive",
      });
      return;
    }

    if (!isSigned) {
      toast({
        title: "Signature Required",
        description: "Please provide patient/guardian signature.",
        variant: "destructive",
      });
      return;
    }

    if (!doctorName) {
      toast({
        title: "Doctor Name Required",
        description: "Please enter the doctor's name.",
        variant: "destructive",
      });
      return;
    }

    const patientSignature = getSignatureData(patientCanvasRef.current);
    const witnessSignature = getSignatureData(witnessCanvasRef.current);

    const consentData = {
      patientId: selectedPatient.id,
      patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      patientUhid: selectedPatient.id.substring(0, 8).toUpperCase(),
      patientAge: calculateAge(selectedPatient.dateOfBirth).toString(),
      patientGender: selectedPatient.gender,
      consentType: "COUNSELLING_EDUCATION",
      consentTitle: "Patient Counselling, Education & Documentation Consent",
      language: selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1),
      patientSignature,
      witnessSignature: isWitnessSigned ? witnessSignature : null,
      witnessName: witnessName || null,
      witnessRelation: witnessRelation || null,
      doctorName,
      doctorDesignation: doctorDesignation || null,
      consentContent: JSON.stringify(COUNSELLING_CONTENT[selectedLanguage as keyof typeof COUNSELLING_CONTENT]),
      createdBy: currentUser.id,
    };

    await saveConsentMutation.mutateAsync(consentData);
  };

  const handleDownloadPDF = async () => {
    if (!selectedPatient) {
      toast({
        title: "No Patient Selected",
        description: "Please select a patient before downloading.",
        variant: "destructive",
      });
      return;
    }

    try {
      const patientSignature = getSignatureData(patientCanvasRef.current);
      const witnessSignature = isWitnessSigned ? getSignatureData(witnessCanvasRef.current) : null;
      
      const response = await fetch('/api/digital-consents/download-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
        },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
          patientUhid: selectedPatient.id.substring(0, 8).toUpperCase(),
          patientAge: calculateAge(selectedPatient.dateOfBirth).toString(),
          patientGender: selectedPatient.gender,
          consentType: "COUNSELLING_EDUCATION",
          language: selectedLanguage,
          patientSignature,
          witnessSignature,
          witnessName,
          witnessRelation,
          doctorName,
          doctorDesignation,
          date: formattedDate,
          time: formattedTime,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const html = await response.text();
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }

      toast({
        title: "Print Window Opened",
        description: "Use your browser's 'Save as PDF' option in the print dialog.",
      });
    } catch {
      toast({
        title: "Download Failed",
        description: "Failed to generate the consent form. Please try again.",
        variant: "destructive",
      });
    }
  };

  const content = COUNSELLING_CONTENT[selectedLanguage as keyof typeof COUNSELLING_CONTENT];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation('/consent-forms')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Consent Forms
          </Button>
          <Badge variant="outline" className="gap-1">
            <Languages className="h-3 w-3" />
            Trilingual Form
          </Badge>
        </div>

        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl md:text-2xl">Digital Patient Counselling Consent</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Counselling, Education & Documentation Consent Form
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Select Patient
                </Label>
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                  <SelectTrigger>
                    <SelectValue placeholder={patientsLoading ? "Loading..." : "Choose patient..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName} - {patient.gender}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formattedDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formattedTime}
                  </span>
                </div>
              </div>
            </div>

            {!selectedPatient && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-5 w-5" />
                <span>Please select a patient to proceed with the consent form.</span>
              </div>
            )}

            {selectedPatient && (
              <>
                <Tabs value={selectedLanguage} onValueChange={setSelectedLanguage} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="english" className="gap-1">
                      <span className="hidden sm:inline">English</span>
                      <span className="sm:hidden">EN</span>
                    </TabsTrigger>
                    <TabsTrigger value="hindi" className="gap-1">
                      <span className="hidden sm:inline">हिंदी</span>
                      <span className="sm:hidden">HI</span>
                    </TabsTrigger>
                    <TabsTrigger value="marathi" className="gap-1">
                      <span className="hidden sm:inline">मराठी</span>
                      <span className="sm:hidden">MR</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="english" className="mt-6 space-y-6">
                    <Card className="bg-gradient-to-r from-cyan-50/50 to-teal-50/50 dark:from-cyan-950/20 dark:to-teal-950/20 border-cyan-200/50">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-primary mb-3">Patient Information</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Name:</span>
                            <p className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">UHID:</span>
                            <p className="font-medium">{selectedPatient.id.substring(0, 8).toUpperCase()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Age:</span>
                            <p className="font-medium">{calculateAge(selectedPatient.dateOfBirth)} years</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Gender:</span>
                            <p className="font-medium">{selectedPatient.gender}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-6">
                      <h2 className="text-lg font-bold text-center text-primary border-b pb-2">{content.title}</h2>
                      {content.sections.map((section, idx) => (
                        <div key={idx} className="space-y-3">
                          <h3 className="font-semibold text-primary">{section.heading}</h3>
                          <div className="space-y-2 text-sm leading-relaxed">
                            {section.content.map((line, lineIdx) => (
                              <p key={lineIdx} className={line.startsWith('•') ? 'pl-4' : ''}>
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="hindi" className="mt-6 space-y-6">
                    <div className="space-y-6">
                      <h2 className="text-lg font-bold text-center text-primary border-b pb-2">{content.title}</h2>
                      {content.sections.map((section, idx) => (
                        <div key={idx} className="space-y-3">
                          <h3 className="font-semibold text-primary">{section.heading}</h3>
                          <div className="space-y-2 text-sm leading-relaxed">
                            {section.content.map((line, lineIdx) => (
                              <p key={lineIdx} className={line.startsWith('•') ? 'pl-4' : ''}>
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="marathi" className="mt-6 space-y-6">
                    <div className="space-y-6">
                      <h2 className="text-lg font-bold text-center text-primary border-b pb-2">{content.title}</h2>
                      {content.sections.map((section, idx) => (
                        <div key={idx} className="space-y-3">
                          <h3 className="font-semibold text-primary">{section.heading}</h3>
                          <div className="space-y-2 text-sm leading-relaxed">
                            {section.content.map((line, lineIdx) => (
                              <p key={lineIdx} className={line.startsWith('•') ? 'pl-4' : ''}>
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator className="my-6" />

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      Doctor Details
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label>Doctor Name *</Label>
                        <Input
                          placeholder="Enter doctor's name"
                          value={doctorName}
                          onChange={(e) => setDoctorName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Designation</Label>
                        <Input
                          placeholder="e.g., Consultant Physician"
                          value={doctorDesignation}
                          onChange={(e) => setDoctorDesignation(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Witness Details (Optional)
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label>Witness Name</Label>
                        <Input
                          placeholder="Enter witness name"
                          value={witnessName}
                          onChange={(e) => setWitnessName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Relation to Patient</Label>
                        <Input
                          placeholder="e.g., Spouse, Parent, Guardian"
                          value={witnessRelation}
                          onChange={(e) => setWitnessRelation(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <PenTool className="h-4 w-4 text-primary" />
                        Patient/Guardian Signature *
                      </Label>
                      <Button variant="ghost" size="sm" onClick={() => clearSignature(false)} className="gap-1">
                        <Eraser className="h-3 w-3" />
                        Clear
                      </Button>
                    </div>
                    <div className="border-2 border-dashed border-primary/30 rounded-lg overflow-hidden bg-white">
                      <canvas
                        ref={patientCanvasRef}
                        width={300}
                        height={120}
                        className="w-full touch-none cursor-crosshair"
                        onMouseDown={(e) => handleMouseDown(e, false)}
                        onMouseMove={(e) => handleMouseMove(e, false)}
                        onMouseUp={() => handleMouseUp(false)}
                        onMouseLeave={() => handleMouseUp(false)}
                        onTouchStart={(e) => handleTouchStart(e, false)}
                        onTouchMove={(e) => handleTouchMove(e, false)}
                        onTouchEnd={() => handleTouchEnd(false)}
                      />
                    </div>
                    {isSigned && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Signature captured
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <PenTool className="h-4 w-4 text-muted-foreground" />
                        Witness Signature (Optional)
                      </Label>
                      <Button variant="ghost" size="sm" onClick={() => clearSignature(true)} className="gap-1">
                        <Eraser className="h-3 w-3" />
                        Clear
                      </Button>
                    </div>
                    <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden bg-white">
                      <canvas
                        ref={witnessCanvasRef}
                        width={300}
                        height={120}
                        className="w-full touch-none cursor-crosshair"
                        onMouseDown={(e) => handleMouseDown(e, true)}
                        onMouseMove={(e) => handleMouseMove(e, true)}
                        onMouseUp={() => handleMouseUp(true)}
                        onMouseLeave={() => handleMouseUp(true)}
                        onTouchStart={(e) => handleTouchStart(e, true)}
                        onTouchMove={(e) => handleTouchMove(e, true)}
                        onTouchEnd={() => handleTouchEnd(true)}
                      />
                    </div>
                    {isWitnessSigned && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Witness signature captured
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={handleDownloadPDF}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button
                    onClick={handleSaveConsent}
                    disabled={saveConsentMutation.isPending}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saveConsentMutation.isPending ? "Saving..." : "Save Consent"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
