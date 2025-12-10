import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  FileCheck, 
  Upload, 
  Download, 
  Printer, 
  Trash2, 
  MoreVertical, 
  Plus,
  FileText,
  Search,
  Filter,
  Eye
} from "lucide-react";

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  tenantId: string;
  hospitalName: string;
}

interface ConsentFormsProps {
  currentUser: User;
}

interface ConsentForm {
  id: string;
  name: string;
  description: string | null;
  category: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  isActive: boolean;
  hasFile: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: "general", label: "General Consent" },
  { value: "surgery", label: "Surgery Consent" },
  { value: "treatment", label: "Treatment Consent" },
  { value: "admission", label: "Admission Forms" },
  { value: "discharge", label: "Discharge Forms" },
  { value: "other", label: "Other" }
];

export default function ConsentForms({ currentUser }: ConsentFormsProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("general");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Helper to get auth headers
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'x-user-id': currentUser.id,
    'x-user-role': currentUser.role,
  });

  const { data: consentForms = [], isLoading } = useQuery<ConsentForm[]>({
    queryKey: ['/api/consent-forms'],
    queryFn: async () => {
      const res = await fetch('/api/consent-forms', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch consent forms');
      return res.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; category: string; file: File }) => {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(data.file);
      const fileData = await base64Promise;

      const res = await fetch('/api/consent-forms', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          category: data.category,
          fileName: data.file.name,
          fileData,
          fileSize: data.file.size,
          mimeType: data.file.type || 'application/pdf',
          uploadedBy: currentUser.username
        }),
      });
      if (!res.ok) throw new Error('Failed to upload consent form');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/consent-forms'] });
      toast({ title: "Consent form uploaded successfully" });
      resetUploadForm();
    },
    onError: () => toast({ title: "Failed to upload consent form", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/consent-forms/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete consent form');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/consent-forms'] });
      toast({ title: "Consent form deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete consent form", variant: "destructive" }),
  });

  const resetUploadForm = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setFormName("");
    setFormDescription("");
    setFormCategory("general");
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({ title: "Only PDF files are allowed", variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File size must be less than 10MB", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
      if (!formName) {
        setFormName(file.name.replace('.pdf', ''));
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !formName) {
      toast({ title: "Please select a file and enter a name", variant: "destructive" });
      return;
    }
    uploadMutation.mutate({
      name: formName,
      description: formDescription,
      category: formCategory,
      file: selectedFile
    });
  };

  const handleDownload = async (form: ConsentForm) => {
    try {
      const response = await fetch(`/api/consent-forms/${form.id}/download`, {
        headers: {
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
        },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = form.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Download started" });
    } catch {
      toast({ title: "Failed to download file", variant: "destructive" });
    }
  };

  const handlePrint = async (form: ConsentForm) => {
    try {
      const response = await fetch(`/api/consent-forms/${form.id}/download`, {
        headers: {
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
        },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch file');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      toast({ title: "Opening print dialog..." });
    } catch {
      toast({ title: "Failed to print file", variant: "destructive" });
    }
  };

  const handleView = async (form: ConsentForm) => {
    try {
      const response = await fetch(`/api/consent-forms/${form.id}/download`, {
        headers: {
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
        },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch file');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      toast({ title: "Failed to view file", variant: "destructive" });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'surgery': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'treatment': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'admission': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'discharge': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const filteredForms = consentForms.filter(form => {
    const matchesSearch = form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || form.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <FileCheck className="h-6 w-6 text-primary" />
            Consent Forms Management
          </h1>
          <p className="text-muted-foreground">Upload, download, and manage hospital consent forms</p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)} data-testid="button-upload-form">
          <Plus className="h-4 w-4 mr-2" />
          Upload Form
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search consent forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48" data-testid="select-category-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredForms.map((form) => (
          <Card key={form.id} className="hover-elevate" data-testid={`consent-form-card-${form.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate" data-testid={`form-name-${form.id}`}>
                      {form.name}
                    </CardTitle>
                    <CardDescription className="text-xs truncate">
                      {form.fileName}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid={`button-menu-${form.id}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleView(form)} data-testid={`button-view-${form.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload(form)} data-testid={`button-download-${form.id}`}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePrint(form)} data-testid={`button-print-${form.id}`}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => deleteMutation.mutate(form.id)}
                      data-testid={`button-delete-${form.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {form.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{form.description}</p>
              )}
              <div className="flex items-center justify-between">
                <Badge className={getCategoryColor(form.category)}>
                  {CATEGORIES.find(c => c.value === form.category)?.label || form.category}
                </Badge>
                <span className="text-xs text-muted-foreground">{formatFileSize(form.fileSize)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Uploaded: {formatDate(form.createdAt)}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDownload(form)}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handlePrint(form)}>
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredForms.length === 0 && !isLoading && (
        <Card className="p-12 text-center">
          <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No consent forms found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || categoryFilter !== 'all' 
              ? "Try adjusting your search or filter"
              : "Upload your first consent form to get started"}
          </p>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Form
          </Button>
        </Card>
      )}

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Consent Form</DialogTitle>
            <DialogDescription>
              Upload a PDF consent form to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select PDF File *</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
                data-testid="input-file"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to select a PDF file</p>
                    <p className="text-xs text-muted-foreground">Maximum size: 10MB</p>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Form Name *</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Surgery Consent Form"
                data-testid="input-form-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description of the consent form"
                rows={3}
                data-testid="input-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetUploadForm}>Cancel</Button>
            <Button 
              onClick={handleUpload} 
              disabled={uploadMutation.isPending || !selectedFile || !formName}
              data-testid="button-submit-upload"
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
