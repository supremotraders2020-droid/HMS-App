import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Trash2, 
  Plus, 
  AlertTriangle, 
  Package, 
  Truck, 
  FileCheck,
  BarChart3,
  Clock,
  Scale,
  MapPin,
  Calendar,
  Download,
  Printer,
  QrCode,
  CheckCircle2,
  XCircle,
  Timer,
  Building2,
  TrendingUp,
  Archive,
  Activity,
  Shield
} from "lucide-react";
import type { BmwBag, BmwPickup, BmwStorageRoom, BmwVendor, BmwReport, BmwIncident } from "@shared/schema";

const BMW_CATEGORIES = [
  { value: "YELLOW", label: "Yellow - Infectious & Pathological", color: "bg-yellow-500", description: "Human anatomical waste, animal waste, microbiology waste" },
  { value: "RED", label: "Red - Contaminated Recyclable", color: "bg-red-500", description: "Contaminated waste (recyclable) - tubing, bottles, catheters" },
  { value: "WHITE", label: "White - Sharps", color: "bg-white border-2 border-gray-400", description: "Needles, syringes with fixed needles, scalpels, blades" },
  { value: "BLUE", label: "Blue - Glassware", color: "bg-blue-500", description: "Glassware, metallic body implants, broken glassware" }
];

const DEPARTMENTS = [
  "OPD", "ICU", "OT", "Emergency", "Laboratory", "Radiology", 
  "Pharmacy", "Ward A", "Ward B", "Ward C", "Pediatrics", "Maternity", "Dialysis"
];

const bagFormSchema = z.object({
  category: z.enum(["YELLOW", "RED", "WHITE", "BLUE"]),
  department: z.string().min(1, "Department is required"),
  approxWeight: z.string().min(1, "Weight is required"),
  notes: z.string().optional()
});

type BagFormData = z.infer<typeof bagFormSchema>;

export default function BiowastePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [generatedBarcode, setGeneratedBarcode] = useState<string | null>(null);
  const [reportPreview, setReportPreview] = useState<{ type: string; data: any } | null>(null);
  const [reportFilter, setReportFilter] = useState<string | null>(null);

  const form = useForm<BagFormData>({
    resolver: zodResolver(bagFormSchema),
    defaultValues: {
      category: "YELLOW",
      department: "",
      approxWeight: "",
      notes: ""
    }
  });

  const { data: bags = [], isLoading: bagsLoading } = useQuery<BmwBag[]>({
    queryKey: ['/api/bmw/bags']
  });

  const { data: storageRooms = [] } = useQuery<BmwStorageRoom[]>({
    queryKey: ['/api/bmw/storage-rooms']
  });

  const { data: vendors = [] } = useQuery<BmwVendor[]>({
    queryKey: ['/api/bmw/vendors']
  });

  const { data: pickups = [] } = useQuery<BmwPickup[]>({
    queryKey: ['/api/bmw/pickups']
  });

  const { data: reports = [] } = useQuery<BmwReport[]>({
    queryKey: ['/api/bmw/reports']
  });

  const { data: incidents = [] } = useQuery<BmwIncident[]>({
    queryKey: ['/api/bmw/incidents']
  });

  const { data: stats } = useQuery<{
    totalBags: number;
    pendingPickup: number;
    disposedToday: number;
    totalWeightKg: number;
    yellowBags: number;
    redBags: number;
    whiteBags: number;
    blueBags: number;
    storageAlerts: number;
  }>({
    queryKey: ['/api/bmw/stats']
  });

  const createBagMutation = useMutation({
    mutationFn: async (data: BagFormData) => {
      const res = await apiRequest("POST", "/api/bmw/bags", {
        ...data,
        approxWeight: data.approxWeight,
        generatedBy: "Admin",
        generatedByRole: "ADMIN"
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bmw/bags'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bmw/stats'] });
      setGeneratedBarcode(data.barcode);
      toast({
        title: "Waste Bag Generated",
        description: `Barcode: ${data.barcode}`,
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmitBag = (data: BagFormData) => {
    createBagMutation.mutate(data);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "YELLOW": return "bg-yellow-500 text-black";
      case "RED": return "bg-red-500 text-white";
      case "WHITE": return "bg-white text-black border border-gray-400";
      case "BLUE": return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "GENERATED": return <Badge variant="secondary">Generated</Badge>;
      case "COLLECTED": return <Badge variant="outline">Collected</Badge>;
      case "STORED": return <Badge className="bg-amber-500">In Storage</Badge>;
      case "PICKED_UP": return <Badge className="bg-blue-500">Picked Up</Badge>;
      case "DISPOSED": return <Badge className="bg-green-500">Disposed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingBags = bags.filter(b => b.status !== "DISPOSED");
  const storedBags = bags.filter(b => b.status === "STORED");
  const disposedBags = bags.filter(b => b.status === "DISPOSED");

  const getStorageTimeRemaining = (deadline: Date | string | null) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    if (diffMs <= 0) return { hours: 0, isOverdue: true };
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    return { hours, isOverdue: false };
  };

  const generateReportMutation = useMutation({
    mutationFn: async (reportType: string) => {
      const now = new Date();
      let startDate: string, endDate: string;
      
      switch (reportType) {
        case "DAILY":
          startDate = now.toISOString().split('T')[0];
          endDate = startDate;
          break;
        case "MONTHLY":
          startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
          break;
        case "MPCB":
          const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          const endOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
          startDate = startOfQuarter.toISOString().split('T')[0];
          endDate = endOfQuarter.toISOString().split('T')[0];
          break;
        case "ANNUAL":
          startDate = `${now.getFullYear()}-01-01`;
          endDate = `${now.getFullYear()}-12-31`;
          break;
        default:
          startDate = now.toISOString().split('T')[0];
          endDate = startDate;
      }

      const reportPeriod = reportType === "DAILY" ? startDate : `${startDate} to ${endDate}`;
      const res = await apiRequest("POST", "/api/bmw/reports", {
        reportType,
        reportPeriod,
        startDate,
        endDate,
        generatedBy: "Admin"
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bmw/reports'] });
      toast({
        title: "Report Generated",
        description: `${data.reportType} report generated successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const downloadReport = (report: BmwReport) => {
    const reportContent = `
BIOMEDICAL WASTE MANAGEMENT REPORT
===================================
Report Type: ${report.reportType}
Period: ${report.startDate} to ${report.endDate}
Generated: ${new Date().toLocaleString()}

SUMMARY
-------
Total Bags Generated: ${report.totalBagsGenerated}
Total Weight: ${report.totalWeightKg} kg

CATEGORY BREAKDOWN
------------------
Yellow (Infectious): ${report.yellowBags || 0} bags
Red (Contaminated): ${report.redBags || 0} bags
White (Sharps): ${report.whiteBags || 0} bags
Blue (Glassware): ${report.blueBags || 0} bags

COMPLIANCE STATUS
-----------------
This report is generated in compliance with CPCB and NABH guidelines.
All biomedical waste has been segregated, stored, and disposed as per regulations.

---
Gravity Hospital
NABH & CPCB Compliant BMW Tracking System
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BMW_${report.reportType}_Report_${report.startDate}_to_${report.endDate}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Downloaded",
      description: `${report.reportType} report downloaded successfully`,
    });
  };

  const showReportPreview = (reportType: string) => {
    const now = new Date();
    let startDate: string, endDate: string, periodLabel: string;
    
    switch (reportType) {
      case "DAILY":
        startDate = now.toISOString().split('T')[0];
        endDate = startDate;
        periodLabel = `Today (${startDate})`;
        break;
      case "MONTHLY":
        startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        periodLabel = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
        break;
      case "MPCB":
        const quarterNames = ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"];
        const quarter = Math.floor(now.getMonth() / 3);
        periodLabel = `${quarterNames[quarter]} ${now.getFullYear()}`;
        startDate = `${now.getFullYear()}-${String(quarter * 3 + 1).padStart(2, '0')}-01`;
        endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0).toISOString().split('T')[0];
        break;
      case "ANNUAL":
        startDate = `${now.getFullYear()}-01-01`;
        endDate = `${now.getFullYear()}-12-31`;
        periodLabel = `Year ${now.getFullYear()}`;
        break;
      default:
        startDate = now.toISOString().split('T')[0];
        endDate = startDate;
        periodLabel = startDate;
    }

    // Calculate stats from bags data
    const filteredBags = bags.filter(bag => {
      const bagDate = bag.createdAt ? new Date(bag.createdAt).toISOString().split('T')[0] : '';
      return bagDate >= startDate && bagDate <= endDate;
    });

    const yellowBags = filteredBags.filter(b => b.category === "YELLOW").length;
    const redBags = filteredBags.filter(b => b.category === "RED").length;
    const whiteBags = filteredBags.filter(b => b.category === "WHITE").length;
    const blueBags = filteredBags.filter(b => b.category === "BLUE").length;
    const totalWeight = filteredBags.reduce((sum, b) => sum + parseFloat(b.approxWeight || "0"), 0);
    const disposedBags = filteredBags.filter(b => b.status === "DISPOSED").length;
    const pendingBags = filteredBags.filter(b => b.status !== "DISPOSED").length;

    setReportPreview({
      type: reportType,
      data: {
        periodLabel,
        startDate,
        endDate,
        totalBags: filteredBags.length,
        yellowBags,
        redBags,
        whiteBags,
        blueBags,
        totalWeight: totalWeight.toFixed(2),
        disposedBags,
        pendingBags,
        bags: filteredBags
      }
    });
    setReportFilter(reportType);
  };

  const filteredReports = reportFilter 
    ? reports.filter(r => r.reportType === reportFilter)
    : reports;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/40 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-900/98 dark:to-green-950/20">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/25 to-emerald-600/15 shadow-lg">
                <Trash2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              Biomedical Waste Management
            </h1>
            <p className="text-muted-foreground">
              NABH & CPCB Compliant BMW Tracking System
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              CPCB Compliant
            </Badge>
            <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-generate-bag">
                  <Plus className="h-4 w-4" />
                  Generate Waste Bag
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Generate BMW Bag
                  </DialogTitle>
                  <DialogDescription>
                    Create a new biomedical waste bag with auto-generated barcode
                  </DialogDescription>
                </DialogHeader>
                
                {generatedBarcode ? (
                  <div className="space-y-4 py-4">
                    <div className="text-center p-6 border-2 border-dashed rounded-lg bg-muted/50">
                      <QrCode className="h-16 w-16 mx-auto mb-4 text-primary" />
                      <p className="text-2xl font-mono font-bold tracking-wider">{generatedBarcode}</p>
                      <p className="text-sm text-muted-foreground mt-2">Barcode generated successfully</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 gap-2">
                        <Printer className="h-4 w-4" />
                        Print Label
                      </Button>
                      <Button 
                        className="flex-1 gap-2"
                        onClick={() => {
                          setGeneratedBarcode(null);
                          setIsGenerateDialogOpen(false);
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Done
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitBag)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Waste Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-category">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {BMW_CATEGORIES.map((cat) => (
                                  <SelectItem key={cat.value} value={cat.value}>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded ${cat.color}`} />
                                      <span>{cat.label}</span>
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
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-department">
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {DEPARTMENTS.map((dept) => (
                                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="approxWeight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Approximate Weight (kg)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                placeholder="e.g., 2.5" 
                                {...field} 
                                data-testid="input-weight"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Any additional notes..." 
                                {...field} 
                                data-testid="input-notes"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full gap-2"
                        disabled={createBagMutation.isPending}
                        data-testid="button-submit-bag"
                      >
                        {createBagMutation.isPending ? (
                          <>Generating...</>
                        ) : (
                          <>
                            <QrCode className="h-4 w-4" />
                            Generate Barcode & Create Bag
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2 h-auto p-1.5 bg-muted/50">
            <TabsTrigger value="overview" className="gap-2 py-2" data-testid="tab-overview">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="bags" className="gap-2 py-2" data-testid="tab-bags">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Waste Bags</span>
            </TabsTrigger>
            <TabsTrigger value="storage" className="gap-2 py-2" data-testid="tab-storage">
              <Archive className="h-4 w-4" />
              <span className="hidden sm:inline">Storage</span>
            </TabsTrigger>
            <TabsTrigger value="pickups" className="gap-2 py-2" data-testid="tab-pickups">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Pickups</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2 py-2" data-testid="tab-reports">
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="glass-card border shadow-md stagger-item">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Bags Today</CardTitle>
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                    <Package className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalBags || bags.length}</div>
                  <p className="text-xs text-muted-foreground">Generated this period</p>
                </CardContent>
              </Card>

              <Card className="glass-card border shadow-md stagger-item">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Pickup</CardTitle>
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                    <Clock className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.pendingPickup || pendingBags.length}</div>
                  <p className="text-xs text-muted-foreground">Awaiting vendor pickup</p>
                </CardContent>
              </Card>

              <Card className="glass-card border shadow-md stagger-item">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Weight (kg)</CardTitle>
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg">
                    <Scale className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {stats?.totalWeightKg || bags.reduce((sum, b) => sum + parseFloat(b.approxWeight || "0"), 0).toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total waste weight</p>
                </CardContent>
              </Card>

              <Card className={`glass-card border shadow-md stagger-item ${(stats?.storageAlerts || 0) > 0 ? 'border-red-500' : ''}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Storage Alerts</CardTitle>
                  <div className={`p-2.5 rounded-xl text-white shadow-lg ${(stats?.storageAlerts || 0) > 0 ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.storageAlerts || 0}</div>
                  <p className="text-xs text-muted-foreground">48-hour limit warnings</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Waste by Category
                  </CardTitle>
                  <CardDescription>Color-coded BMW distribution</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {BMW_CATEGORIES.map((cat) => {
                    const count = bags.filter(b => b.category === cat.value).length;
                    const percentage = bags.length > 0 ? (count / bags.length) * 100 : 0;
                    return (
                      <div key={cat.value} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${cat.color}`} />
                            <span className="text-sm font-medium">{cat.value}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{count} bags</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest waste management actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    {bagsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="flex items-center gap-3 p-2">
                            <Skeleton className="h-8 w-8 rounded" />
                            <div className="flex-1 space-y-1">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : bags.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No waste bags generated yet</p>
                        <p className="text-sm">Start by generating a new waste bag</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {bags.slice(0, 5).map((bag) => (
                          <div key={bag.id} className="flex items-center gap-3 p-2 rounded-lg hover-elevate">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCategoryColor(bag.category)}`}>
                              <Package className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{bag.barcode}</p>
                              <p className="text-xs text-muted-foreground">{bag.department} • {bag.approxWeight} kg</p>
                            </div>
                            {getStatusBadge(bag.status)}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                  48-Hour Storage Compliance
                </CardTitle>
                <CardDescription>
                  As per CPCB guidelines, biomedical waste must not be stored for more than 48 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                {storedBags.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p>No bags currently in storage</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {storedBags.slice(0, 6).map((bag) => {
                      const timeRemaining = getStorageTimeRemaining(bag.storageDeadline);
                      return (
                        <div 
                          key={bag.id} 
                          className={`p-3 rounded-lg border ${timeRemaining?.isOverdue ? 'border-red-500 bg-red-50 dark:bg-red-950/30' : 'border-border bg-muted/30'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={getCategoryColor(bag.category)}>{bag.category}</Badge>
                            {timeRemaining?.isOverdue ? (
                              <Badge variant="destructive" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                Overdue
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <Timer className="h-3 w-3" />
                                {timeRemaining?.hours}h left
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-mono">{bag.barcode}</p>
                          <p className="text-xs text-muted-foreground">{bag.department}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bags" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  All Waste Bags
                </CardTitle>
                <CardDescription>
                  Complete list of generated biomedical waste bags
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bagsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                        <Skeleton className="h-10 w-10 rounded" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                    ))}
                  </div>
                ) : bags.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No waste bags generated</p>
                    <p className="text-sm mb-4">Start by generating your first biomedical waste bag</p>
                    <Button onClick={() => setIsGenerateDialogOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Generate First Bag
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {bags.map((bag) => (
                        <div 
                          key={bag.id} 
                          className="flex items-center gap-4 p-4 border rounded-lg hover-elevate transition-all"
                          data-testid={`bag-${bag.id}`}
                        >
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getCategoryColor(bag.category)}`}>
                            <Package className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-mono font-medium">{bag.barcode}</p>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Printer className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {bag.department}
                              </span>
                              <span className="flex items-center gap-1">
                                <Scale className="h-3 w-3" />
                                {bag.approxWeight} kg
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {bag.createdAt ? new Date(bag.createdAt).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                          {getStatusBadge(bag.status)}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="storage" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {storageRooms.length === 0 ? (
                <Card className="glass-card col-span-full">
                  <CardContent className="py-12 text-center">
                    <Archive className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-lg font-medium">No Storage Rooms Configured</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Set up storage room locations for waste management
                    </p>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Storage Room
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                storageRooms.map((room) => (
                  <Card key={room.id} className="glass-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Archive className="h-4 w-4" />
                        {room.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {room.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Occupancy</span>
                          <span className="text-sm font-medium">{room.currentOccupancy} / {room.capacity}</span>
                        </div>
                        <Progress value={(room.currentOccupancy / room.capacity) * 100} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Last cleaned: {room.lastCleanedAt ? new Date(room.lastCleanedAt).toLocaleDateString() : 'N/A'}</span>
                          {room.isActive ? (
                            <Badge variant="outline" className="text-green-600">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600">Inactive</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-amber-500" />
                  Bags in Storage
                </CardTitle>
                <CardDescription>
                  Monitor 48-hour storage compliance for all stored bags
                </CardDescription>
              </CardHeader>
              <CardContent>
                {storedBags.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p>No bags currently in storage</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {storedBags.map((bag) => {
                        const timeRemaining = getStorageTimeRemaining(bag.storageDeadline);
                        return (
                          <div 
                            key={bag.id}
                            className={`flex items-center gap-4 p-3 rounded-lg border ${
                              timeRemaining?.isOverdue 
                                ? 'border-red-500 bg-red-50 dark:bg-red-950/30' 
                                : (timeRemaining?.hours || 0) < 12 
                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                                : 'border-border'
                            }`}
                          >
                            <Badge className={getCategoryColor(bag.category)}>{bag.category}</Badge>
                            <div className="flex-1">
                              <p className="font-mono text-sm">{bag.barcode}</p>
                              <p className="text-xs text-muted-foreground">{bag.department} • {bag.approxWeight} kg</p>
                            </div>
                            {timeRemaining?.isOverdue ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                OVERDUE
                              </Badge>
                            ) : (
                              <Badge variant={(timeRemaining?.hours || 0) < 12 ? "outline" : "secondary"} className="gap-1">
                                <Clock className="h-3 w-3" />
                                {timeRemaining?.hours}h remaining
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pickups" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                      <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{pickups.filter(p => p.status === "SCHEDULED").length}</p>
                      <p className="text-sm text-muted-foreground">Scheduled Pickups</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                      <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{pickups.filter(p => p.status === "COMPLETED").length}</p>
                      <p className="text-sm text-muted-foreground">Completed Today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                      <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{vendors.filter(v => v.isActive).length}</p>
                      <p className="text-sm text-muted-foreground">Active Vendors</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    Pickup Schedule
                  </CardTitle>
                  <CardDescription>Vendor pickup management</CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Schedule Pickup
                </Button>
              </CardHeader>
              <CardContent>
                {pickups.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Truck className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No Pickups Scheduled</p>
                    <p className="text-sm">Schedule a vendor pickup for collected waste</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {pickups.map((pickup) => (
                        <div 
                          key={pickup.id}
                          className="p-4 border rounded-lg hover-elevate"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{pickup.pickupId}</Badge>
                              {pickup.status === "COMPLETED" ? (
                                <Badge className="bg-green-500">Completed</Badge>
                              ) : pickup.status === "IN_PROGRESS" ? (
                                <Badge className="bg-blue-500">In Progress</Badge>
                              ) : (
                                <Badge variant="secondary">Scheduled</Badge>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {pickup.pickupDate} at {pickup.pickupTime}
                            </span>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Vendor</p>
                              <p className="font-medium">{pickup.vendorName}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Bags</p>
                              <p className="font-medium">{pickup.totalBags}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Weight</p>
                              <p className="font-medium">{pickup.totalWeight} kg</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Vehicle</p>
                              <p className="font-medium">{pickup.vehicleNumber || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button 
                variant="outline" 
                className="h-auto py-6 flex-col gap-2"
                onClick={() => showReportPreview("DAILY")}
                data-testid="button-daily-report"
              >
                <Calendar className="h-6 w-6 text-blue-500" />
                <span className="font-medium">Daily Report</span>
                <span className="text-xs text-muted-foreground">Today's summary</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-6 flex-col gap-2"
                onClick={() => showReportPreview("MONTHLY")}
                data-testid="button-monthly-report"
              >
                <BarChart3 className="h-6 w-6 text-green-500" />
                <span className="font-medium">Monthly Report</span>
                <span className="text-xs text-muted-foreground">This month</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-6 flex-col gap-2"
                onClick={() => showReportPreview("MPCB")}
                data-testid="button-mpcb-report"
              >
                <FileCheck className="h-6 w-6 text-purple-500" />
                <span className="font-medium">MPCB Report</span>
                <span className="text-xs text-muted-foreground">Compliance format</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-6 flex-col gap-2"
                onClick={() => showReportPreview("ANNUAL")}
                data-testid="button-annual-report"
              >
                <Download className="h-6 w-6 text-amber-500" />
                <span className="font-medium">Annual Report</span>
                <span className="text-xs text-muted-foreground">Yearly summary</span>
              </Button>
            </div>

            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-primary" />
                      Generated Reports
                      {reportFilter && (
                        <Badge variant="secondary" className="ml-2">
                          {reportFilter} Only
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Download and review compliance reports
                    </CardDescription>
                  </div>
                  {reportFilter && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setReportFilter(null)}
                      data-testid="button-clear-filter"
                    >
                      Show All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {filteredReports.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileCheck className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">
                      {reportFilter ? `No ${reportFilter} Reports` : "No Reports Generated"}
                    </p>
                    <p className="text-sm">
                      {reportFilter ? `No ${reportFilter.toLowerCase()} reports have been saved yet` : "Generate your first compliance report"}
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {filteredReports.map((report) => (
                        <div 
                          key={report.id}
                          className="flex items-center gap-4 p-4 border rounded-lg hover-elevate"
                        >
                          <div className="p-2 rounded-lg bg-muted">
                            <FileCheck className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{report.reportType} Report</p>
                            <p className="text-sm text-muted-foreground">
                              {report.startDate} to {report.endDate}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{report.totalBagsGenerated} bags</p>
                            <p className="text-xs text-muted-foreground">{report.totalWeightKg} kg</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => downloadReport(report)}
                            data-testid={`button-download-report-${report.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Report Preview Dialog */}
      <Dialog open={!!reportPreview} onOpenChange={(open) => !open && setReportPreview(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              {reportPreview?.type} Report - {reportPreview?.data?.periodLabel}
            </DialogTitle>
            <DialogDescription>
              Biomedical Waste Summary for {reportPreview?.data?.startDate} to {reportPreview?.data?.endDate}
            </DialogDescription>
          </DialogHeader>
          
          {reportPreview && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-2xl font-bold text-foreground">{reportPreview.data.totalBags}</p>
                    <p className="text-xs text-muted-foreground">Total Bags</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-2xl font-bold text-foreground">{reportPreview.data.totalWeight} kg</p>
                    <p className="text-xs text-muted-foreground">Total Weight</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-2xl font-bold text-green-600">{reportPreview.data.disposedBags}</p>
                    <p className="text-xs text-muted-foreground">Disposed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-2xl font-bold text-amber-600">{reportPreview.data.pendingBags}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-foreground">Category Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <div className="w-4 h-4 rounded bg-yellow-500" />
                    <div>
                      <p className="font-medium text-foreground">{reportPreview.data.yellowBags}</p>
                      <p className="text-xs text-muted-foreground">Yellow</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="w-4 h-4 rounded bg-red-500" />
                    <div>
                      <p className="font-medium text-foreground">{reportPreview.data.redBags}</p>
                      <p className="text-xs text-muted-foreground">Red</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-500/10 border border-gray-500/30">
                    <div className="w-4 h-4 rounded bg-white border border-gray-400" />
                    <div>
                      <p className="font-medium text-foreground">{reportPreview.data.whiteBags}</p>
                      <p className="text-xs text-muted-foreground">White</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <div className="w-4 h-4 rounded bg-blue-500" />
                    <div>
                      <p className="font-medium text-foreground">{reportPreview.data.blueBags}</p>
                      <p className="text-xs text-muted-foreground">Blue</p>
                    </div>
                  </div>
                </div>
              </div>

              {reportPreview.data.bags.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 text-foreground">Waste Bags ({reportPreview.data.bags.length})</h4>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {reportPreview.data.bags.map((bag: BmwBag) => (
                        <div key={bag.id} className="flex items-center gap-3 p-2 border rounded-lg">
                          <Badge className={getCategoryColor(bag.category)}>{bag.category}</Badge>
                          <span className="text-sm text-foreground">{bag.department}</span>
                          <span className="text-sm text-muted-foreground">{bag.approxWeight} kg</span>
                          <span className="text-xs text-muted-foreground ml-auto">{bag.status}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    generateReportMutation.mutate(reportPreview.type);
                    setReportPreview(null);
                  }}
                  disabled={generateReportMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Save to Reports
                </Button>
                <Button variant="outline" onClick={() => setReportPreview(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
