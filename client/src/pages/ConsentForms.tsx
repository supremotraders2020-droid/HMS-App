import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  FileCheck, 
  Download, 
  Printer, 
  FileText,
  Search,
  Eye,
  Globe,
  Languages,
  ClipboardList,
  Stethoscope,
  TestTube,
  Heart,
  Baby,
  User,
  AlertCircle
} from "lucide-react";

interface UserInfo {
  id: string;
  username: string;
  name: string;
  role: string;
  tenantId: string;
  hospitalName: string;
}

interface ConsentFormsProps {
  currentUser: UserInfo;
}

interface ConsentTemplate {
  id: string;
  title: string;
  consentType: string;
  description: string | null;
  category: string;
  pdfPath: string;
  version: string;
  isActive: boolean;
  isBilingual: boolean;
  languages: string;
  createdAt: string;
  updatedAt: string;
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

const TEMPLATE_CATEGORIES = [
  { value: "all", label: "All Forms", icon: FileCheck },
  { value: "Legal & Administrative", label: "Legal & Administrative", icon: ClipboardList },
  { value: "Surgical & Procedural", label: "Surgical & Procedural", icon: Stethoscope },
  { value: "Diagnostic & Testing", label: "Diagnostic & Testing", icon: TestTube },
  { value: "Treatment", label: "Treatment", icon: Heart },
  { value: "Maternal & Neonatal", label: "Maternal & Neonatal", icon: Baby },
];

export default function ConsentForms({ currentUser }: ConsentFormsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const { toast } = useToast();

  const { data: templates = [], isLoading } = useQuery<ConsentTemplate[]>({
    queryKey: ['/api/consent-templates'],
    queryFn: async () => {
      const res = await fetch('/api/consent-templates', {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
        },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch consent templates');
      return res.json();
    },
  });

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
      if (!res.ok) {
        if (res.status === 403) {
          return []; // Return empty array if user doesn't have access
        }
        throw new Error('Failed to fetch patients');
      }
      return res.json();
    },
  });

  const selectedPatient = selectedPatientId && selectedPatientId !== 'none' 
    ? patients.find(p => p.id === selectedPatientId) 
    : null;

  const getPersonalizedPdfUrl = (template: ConsentTemplate, patientId: string) => {
    return `/api/consent-templates/${template.id}/render?patientId=${patientId}`;
  };

  const handleDownload = async (template: ConsentTemplate) => {
    try {
      if (selectedPatientId && selectedPatientId !== 'none') {
        const response = await fetch(getPersonalizedPdfUrl(template, selectedPatientId), {
          headers: {
            'x-user-id': currentUser.id,
            'x-user-role': currentUser.role,
          },
        });
        if (!response.ok) throw new Error('Failed to generate PDF');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const patientName = selectedPatient ? `${selectedPatient.firstName}_${selectedPatient.lastName}` : 'patient';
        link.download = `${template.title.replace(/\s+/g, '_')}_${patientName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast({ title: "Download started", description: `Consent form for ${selectedPatient?.firstName} ${selectedPatient?.lastName}` });
      } else {
        const link = document.createElement('a');
        link.href = template.pdfPath;
        link.download = template.pdfPath.split('/').pop() || 'consent-form.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Download started (blank form)" });
      }
    } catch {
      toast({ title: "Failed to download file", variant: "destructive" });
    }
  };

  const handleView = async (template: ConsentTemplate) => {
    if (selectedPatientId && selectedPatientId !== 'none') {
      try {
        const response = await fetch(getPersonalizedPdfUrl(template, selectedPatientId), {
          headers: {
            'x-user-id': currentUser.id,
            'x-user-role': currentUser.role,
          },
        });
        if (!response.ok) throw new Error('Failed to generate PDF');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      } catch {
        toast({ title: "Failed to view consent form", variant: "destructive" });
      }
    } else {
      window.open(template.pdfPath, '_blank');
    }
  };

  const handlePrint = async (template: ConsentTemplate) => {
    if (selectedPatientId && selectedPatientId !== 'none') {
      try {
        const response = await fetch(getPersonalizedPdfUrl(template, selectedPatientId), {
          headers: {
            'x-user-id': currentUser.id,
            'x-user-role': currentUser.role,
          },
        });
        if (!response.ok) throw new Error('Failed to generate PDF');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
        toast({ title: "Opening print dialog...", description: `Consent form for ${selectedPatient?.firstName} ${selectedPatient?.lastName}` });
      } catch {
        toast({ title: "Failed to print consent form", variant: "destructive" });
      }
    } else {
      const printWindow = window.open(template.pdfPath, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      toast({ title: "Opening print dialog..." });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Legal & Administrative': 
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'Surgical & Procedural': 
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'Diagnostic & Testing': 
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300';
      case 'Treatment': 
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'Maternal & Neonatal': 
        return 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300';
      default: 
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Legal & Administrative': return ClipboardList;
      case 'Surgical & Procedural': return Stethoscope;
      case 'Diagnostic & Testing': return TestTube;
      case 'Treatment': return Heart;
      case 'Maternal & Neonatal': return Baby;
      default: return FileText;
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryCounts = TEMPLATE_CATEGORIES.reduce((acc, cat) => {
    if (cat.value === 'all') {
      acc[cat.value] = templates.length;
    } else {
      acc[cat.value] = templates.filter(t => t.category === cat.value).length;
    }
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <FileCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            <span className="truncate">Consent Forms Library</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            13 trilingual consent forms (English, Hindi, Marathi) for comprehensive patient care
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Languages className="h-3 w-3" />
            Trilingual
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {templates.length} Forms
          </Badge>
        </div>
      </div>

      {/* Patient Selection Card */}
      <Card className="bg-gradient-to-r from-cyan-50/50 to-teal-50/50 dark:from-cyan-950/20 dark:to-teal-950/20 border-cyan-200/50 dark:border-cyan-800/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label className="text-sm font-medium">Select Patient</Label>
                <p className="text-xs text-muted-foreground">Patient details will be auto-filled in consent forms</p>
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger data-testid="select-patient">
                  <SelectValue placeholder={patientsLoading ? "Loading patients..." : "Choose a patient..."} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No patient (blank form)</span>
                  </SelectItem>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} - {patient.gender}, DOB: {patient.dateOfBirth}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPatient && (
              <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                <User className="h-3 w-3 mr-1" />
                {selectedPatient.firstName} {selectedPatient.lastName}
              </Badge>
            )}
          </div>
          {selectedPatient && (
            <div className="mt-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Full Name</span>
                  <p className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Date of Birth</span>
                  <p className="font-medium">{selectedPatient.dateOfBirth}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Gender</span>
                  <p className="font-medium">{selectedPatient.gender}</p>
                </div>
                {selectedPatient.phone && (
                  <div>
                    <span className="text-muted-foreground text-xs">Phone</span>
                    <p className="font-medium">{selectedPatient.phone}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {(!selectedPatientId || selectedPatientId === 'none') && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3 w-3" />
              <span>Select a patient to auto-fill their details in consent forms</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search consent forms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 max-w-md"
          data-testid="input-search"
        />
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0 mb-4">
          {TEMPLATE_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2 rounded-lg border"
                data-testid={`tab-${cat.value.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <Icon className="h-4 w-4 mr-1.5" />
                {cat.label}
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                  {categoryCounts[cat.value] || 0}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-0">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredTemplates.map((template) => {
              const CategoryIcon = getCategoryIcon(template.category);
              return (
                <Card key={template.id} className="hover-elevate" data-testid={`consent-template-card-${template.id}`}>
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <CategoryIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm sm:text-base leading-tight" data-testid={`template-title-${template.id}`}>
                          {template.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getCategoryColor(template.category)} data-testid={`template-category-${template.id}`}>
                            {template.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            v{template.version}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-3 sm:p-4 md:p-6 pt-0">
                    {template.description && (
                      <CardDescription className="text-xs sm:text-sm line-clamp-3">
                        {template.description}
                      </CardDescription>
                    )}
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Languages className="h-3 w-3" />
                      <span>{template.languages}</span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => handleView(template)}
                        data-testid={`button-view-${template.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => handleDownload(template)}
                        data-testid={`button-download-${template.id}`}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePrint(template)}
                        data-testid={`button-print-${template.id}`}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <Card className="p-12 text-center">
              <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No consent forms found</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "Try adjusting your search terms"
                  : "No forms available in this category"}
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
