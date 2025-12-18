import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { 
  FlaskConical, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Activity,
  FileText,
  Settings,
  RefreshCw,
  Download,
  Search,
  Beaker,
  ClipboardList,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Building2,
  MapPin
} from "lucide-react";

interface SwabArea {
  id: string;
  block: string;
  floor: string;
  areaType: string;
  areaName: string;
  equipment: string | null;
  isActive: boolean;
  createdAt: string | null;
}

interface SwabSamplingSite {
  id: string;
  siteName: string;
  description: string | null;
  isActive: boolean;
  createdAt: string | null;
}

interface SwabOrganism {
  id: string;
  organismName: string;
  category: string;
  riskLevel: string;
  description: string | null;
  isActive: boolean;
  createdAt: string | null;
}

interface SwabCollection {
  id: string;
  swabId: string;
  collectionDate: string;
  areaType: string;
  areaId: string;
  samplingSiteId: string;
  reason: string;
  collectedBy: string;
  collectedByName: string | null;
  remarks: string | null;
  status: string;
  resultStatus: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface SwabLabResult {
  id: string;
  swabCollectionId: string;
  cultureMedia: string;
  organismId: string;
  cfuCount: number | null;
  growthLevel: string;
  sensitivityTest: boolean | null;
  sensitivityDetails: string | null;
  resultDate: string;
  processedBy: string;
  processedByName: string | null;
  remarks: string | null;
  createdAt: string | null;
}

interface SwabCapaAction {
  id: string;
  swabCollectionId: string;
  issueSummary: string;
  rootCause: string | null;
  immediateAction: string;
  responsibleDepartment: string;
  responsiblePerson: string | null;
  responsiblePersonName: string | null;
  targetClosureDate: string;
  verificationSwabRequired: boolean | null;
  verificationSwabId: string | null;
  status: string;
  closedBy: string | null;
  closedByName: string | null;
  closedAt: string | null;
  closureRemarks: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

const swabCollectionSchema = z.object({
  areaType: z.string().min(1, "Area type is required"),
  areaId: z.string().min(1, "Area is required"),
  samplingSiteId: z.string().min(1, "Sampling site is required"),
  reason: z.string().min(1, "Reason is required"),
  collectedBy: z.string().min(1, "Collector ID is required"),
  collectedByName: z.string().optional(),
  remarks: z.string().optional(),
  collectionDate: z.date(),
});

const labResultSchema = z.object({
  swabCollectionId: z.string().min(1, "Swab collection is required"),
  cultureMedia: z.string().min(1, "Culture media is required"),
  organismId: z.string().min(1, "Organism is required"),
  cfuCount: z.number().optional(),
  growthLevel: z.string().min(1, "Growth level is required"),
  sensitivityTest: z.boolean().default(false),
  sensitivityDetails: z.string().optional(),
  processedBy: z.string().min(1, "Processor ID is required"),
  processedByName: z.string().optional(),
  remarks: z.string().optional(),
  resultDate: z.date(),
});

export default function SwabMonitoring() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [showLabResultDialog, setShowLabResultDialog] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<SwabCollection | null>(null);

  const { data: areas = [] } = useQuery<SwabArea[]>({
    queryKey: ["/api/swab-monitoring/areas"],
  });

  const { data: samplingSites = [] } = useQuery<SwabSamplingSite[]>({
    queryKey: ["/api/swab-monitoring/sampling-sites"],
  });

  const { data: organisms = [] } = useQuery<SwabOrganism[]>({
    queryKey: ["/api/swab-monitoring/organisms"],
  });

  const { data: collections = [], isLoading: collectionsLoading } = useQuery<SwabCollection[]>({
    queryKey: ["/api/swab-monitoring/collections"],
  });

  const { data: labResults = [] } = useQuery<SwabLabResult[]>({
    queryKey: ["/api/swab-monitoring/lab-results"],
  });

  const { data: capaActions = [] } = useQuery<SwabCapaAction[]>({
    queryKey: ["/api/swab-monitoring/capa-actions"],
  });

  const collectionForm = useForm<z.infer<typeof swabCollectionSchema>>({
    resolver: zodResolver(swabCollectionSchema),
    defaultValues: {
      areaType: "",
      areaId: "",
      samplingSiteId: "",
      reason: "",
      collectedBy: "",
      collectedByName: "",
      remarks: "",
      collectionDate: new Date(),
    },
  });

  const labResultForm = useForm<z.infer<typeof labResultSchema>>({
    resolver: zodResolver(labResultSchema),
    defaultValues: {
      swabCollectionId: "",
      cultureMedia: "",
      organismId: "",
      cfuCount: undefined,
      growthLevel: "",
      sensitivityTest: false,
      sensitivityDetails: "",
      processedBy: "",
      processedByName: "",
      remarks: "",
      resultDate: new Date(),
    },
  });

  const createCollectionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof swabCollectionSchema>) => {
      const response = await apiRequest("POST", "/api/swab-monitoring/collections", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Swab collection created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/swab-monitoring/collections"] });
      setShowCollectionDialog(false);
      collectionForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create collection", description: error.message, variant: "destructive" });
    },
  });

  const createLabResultMutation = useMutation({
    mutationFn: async (data: z.infer<typeof labResultSchema>) => {
      const response = await apiRequest("POST", "/api/swab-monitoring/lab-results", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Lab result recorded successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/swab-monitoring/lab-results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/swab-monitoring/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/swab-monitoring/capa-actions"] });
      setShowLabResultDialog(false);
      labResultForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to record lab result", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "in_lab":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Beaker className="w-3 h-3 mr-1" />In Lab</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getResultBadge = (result: string | null) => {
    switch (result) {
      case "PASS":
        return <Badge className="bg-green-500 text-white"><CheckCircle2 className="w-3 h-3 mr-1" />PASS</Badge>;
      case "ACCEPTABLE":
        return <Badge className="bg-amber-500 text-white"><AlertCircle className="w-3 h-3 mr-1" />ACCEPTABLE</Badge>;
      case "FAIL":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />FAIL</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getCapaStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Open</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><RefreshCw className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "pending_verification":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" />Pending Verification</Badge>;
      case "closed":
        return <Badge className="bg-green-500 text-white"><CheckCircle2 className="w-3 h-3 mr-1" />Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAreaName = (areaId: string) => {
    const area = areas.find(a => a.id === areaId);
    return area ? `${area.areaName} (${area.block})` : areaId;
  };

  const getSiteName = (siteId: string) => {
    const site = samplingSites.find(s => s.id === siteId);
    return site ? site.siteName : siteId;
  };

  const getOrganismName = (organismId: string) => {
    const organism = organisms.find(o => o.id === organismId);
    return organism ? organism.organismName : organismId;
  };

  const passCount = collections.filter(c => c.resultStatus === "PASS").length;
  const failCount = collections.filter(c => c.resultStatus === "FAIL").length;
  const acceptableCount = collections.filter(c => c.resultStatus === "ACCEPTABLE").length;
  const pendingCount = collections.filter(c => c.status === "pending").length;
  const openCapaCount = capaActions.filter(c => c.status === "open" || c.status === "in_progress").length;

  const otCollections = collections.filter(c => c.areaType === "OT");
  const icuCollections = collections.filter(c => c.areaType === "ICU");
  const otContaminationRate = otCollections.length > 0 ? (otCollections.filter(c => c.resultStatus === "FAIL").length / otCollections.length * 100).toFixed(1) : "0";
  const icuContaminationRate = icuCollections.length > 0 ? (icuCollections.filter(c => c.resultStatus === "FAIL").length / icuCollections.length * 100).toFixed(1) : "0";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="w-6 h-6" />
            OT & ICU Swab Contamination Monitoring
          </h1>
          <p className="text-muted-foreground">NABH-compliant environmental surveillance for infection control</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/swab-monitoring"] })} data-testid="button-refresh-swab">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard"><Activity className="w-4 h-4 mr-2" />Dashboard</TabsTrigger>
          <TabsTrigger value="collection" data-testid="tab-collection"><FlaskConical className="w-4 h-4 mr-2" />Collection</TabsTrigger>
          <TabsTrigger value="lab-results" data-testid="tab-lab-results"><Beaker className="w-4 h-4 mr-2" />Lab Results</TabsTrigger>
          <TabsTrigger value="capa" data-testid="tab-capa"><AlertTriangle className="w-4 h-4 mr-2" />CAPA</TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports"><FileText className="w-4 h-4 mr-2" />Reports</TabsTrigger>
          <TabsTrigger value="masters" data-testid="tab-masters"><Settings className="w-4 h-4 mr-2" />Masters</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Swabs</CardTitle>
                <FlaskConical className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{collections.length}</div>
                <p className="text-xs text-muted-foreground">{pendingCount} pending lab results</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{passCount}</div>
                <p className="text-xs text-muted-foreground">{acceptableCount} acceptable</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fail Count</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{failCount}</div>
                <p className="text-xs text-muted-foreground">{openCapaCount} open CAPA</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">OT Contamination</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{otContaminationRate}%</div>
                <p className="text-xs text-muted-foreground">{otCollections.length} total samples</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ICU Contamination</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{icuContaminationRate}%</div>
                <p className="text-xs text-muted-foreground">{icuCollections.length} total samples</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Collections</CardTitle>
                <CardDescription>Latest swab samples collected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {collections.slice(0, 5).map((collection) => (
                    <div key={collection.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{collection.swabId}</p>
                        <p className="text-sm text-muted-foreground">
                          {getAreaName(collection.areaId)} - {getSiteName(collection.samplingSiteId)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(collection.status)}
                        {collection.resultStatus && getResultBadge(collection.resultStatus)}
                      </div>
                    </div>
                  ))}
                  {collections.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No collections yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Open CAPA Actions</CardTitle>
                <CardDescription>Corrective actions requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {capaActions.filter(c => c.status !== "closed").slice(0, 5).map((capa) => (
                    <div key={capa.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{capa.immediateAction}</p>
                        <p className="text-sm text-muted-foreground">{capa.responsibleDepartment}</p>
                      </div>
                      {getCapaStatusBadge(capa.status)}
                    </div>
                  ))}
                  {capaActions.filter(c => c.status !== "closed").length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No open CAPA actions</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="collection" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Swab Collection</h2>
            <Dialog open={showCollectionDialog} onOpenChange={setShowCollectionDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-collection">
                  <Plus className="w-4 h-4 mr-2" />
                  New Collection
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Swab Collection</DialogTitle>
                  <DialogDescription>Record a new environmental swab sample</DialogDescription>
                </DialogHeader>
                <Form {...collectionForm}>
                  <form onSubmit={collectionForm.handleSubmit((data) => createCollectionMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={collectionForm.control}
                        name="areaType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Area Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-area-type">
                                  <SelectValue placeholder="Select area type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="OT">Operation Theatre (OT)</SelectItem>
                                <SelectItem value="ICU">Intensive Care Unit (ICU)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={collectionForm.control}
                        name="areaId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Area</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-area">
                                  <SelectValue placeholder="Select area" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {areas.filter(a => a.isActive && (collectionForm.watch("areaType") === "" || a.areaType === collectionForm.watch("areaType"))).map((area) => (
                                  <SelectItem key={area.id} value={area.id}>
                                    {area.areaName} - {area.block}, {area.floor}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={collectionForm.control}
                        name="samplingSiteId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sampling Site</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-sampling-site">
                                  <SelectValue placeholder="Select sampling site" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {samplingSites.filter(s => s.isActive).map((site) => (
                                  <SelectItem key={site.id} value={site.id}>{site.siteName}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={collectionForm.control}
                        name="reason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reason</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-reason">
                                  <SelectValue placeholder="Select reason" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Routine">Routine</SelectItem>
                                <SelectItem value="Post-fumigation">Post-fumigation</SelectItem>
                                <SelectItem value="Outbreak suspicion">Outbreak suspicion</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={collectionForm.control}
                        name="collectedBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Collected By (Staff ID)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter staff ID" data-testid="input-collected-by" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={collectionForm.control}
                        name="collectedByName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Collector Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter name" data-testid="input-collector-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={collectionForm.control}
                      name="remarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Remarks</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Optional remarks" data-testid="input-remarks" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={createCollectionMutation.isPending} data-testid="button-submit-collection">
                        {createCollectionMutation.isPending ? "Creating..." : "Create Collection"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Swab ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Collected By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collections.map((collection) => (
                    <TableRow key={collection.id} data-testid={`row-collection-${collection.id}`}>
                      <TableCell className="font-mono">{collection.swabId}</TableCell>
                      <TableCell>{format(new Date(collection.collectionDate), "MMM d, yyyy HH:mm")}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{collection.areaType}</Badge>
                        <span className="ml-2">{getAreaName(collection.areaId)}</span>
                      </TableCell>
                      <TableCell>{getSiteName(collection.samplingSiteId)}</TableCell>
                      <TableCell>{collection.reason}</TableCell>
                      <TableCell>{collection.collectedByName || collection.collectedBy}</TableCell>
                      <TableCell>{getStatusBadge(collection.status)}</TableCell>
                      <TableCell>{getResultBadge(collection.resultStatus)}</TableCell>
                    </TableRow>
                  ))}
                  {collections.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No swab collections yet. Click "New Collection" to add one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lab-results" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Lab Results</h2>
            <Dialog open={showLabResultDialog} onOpenChange={setShowLabResultDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-lab-result">
                  <Plus className="w-4 h-4 mr-2" />
                  Enter Lab Result
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Enter Lab Result</DialogTitle>
                  <DialogDescription>Record laboratory test results for a swab sample</DialogDescription>
                </DialogHeader>
                <Form {...labResultForm}>
                  <form onSubmit={labResultForm.handleSubmit((data) => createLabResultMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={labResultForm.control}
                        name="swabCollectionId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Swab Collection</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-swab-collection">
                                  <SelectValue placeholder="Select swab" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {collections.filter(c => c.status === "pending" || c.status === "in_lab").map((collection) => (
                                  <SelectItem key={collection.id} value={collection.id}>
                                    {collection.swabId} - {getAreaName(collection.areaId)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={labResultForm.control}
                        name="cultureMedia"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Culture Media</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-culture-media">
                                  <SelectValue placeholder="Select media" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Blood Agar">Blood Agar</SelectItem>
                                <SelectItem value="MacConkey Agar">MacConkey Agar</SelectItem>
                                <SelectItem value="Sabouraud Dextrose Agar">Sabouraud Dextrose Agar</SelectItem>
                                <SelectItem value="Chocolate Agar">Chocolate Agar</SelectItem>
                                <SelectItem value="Mueller-Hinton Agar">Mueller-Hinton Agar</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={labResultForm.control}
                        name="organismId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organism Detected</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-organism">
                                  <SelectValue placeholder="Select organism" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {organisms.filter(o => o.isActive).map((organism) => (
                                  <SelectItem key={organism.id} value={organism.id}>{organism.organismName}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={labResultForm.control}
                        name="growthLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Growth Level</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-growth-level">
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="None">None</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Moderate">Moderate</SelectItem>
                                <SelectItem value="Heavy">Heavy</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={labResultForm.control}
                        name="cfuCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CFU Count</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                value={field.value ?? ""}
                                placeholder="Colony forming units" 
                                data-testid="input-cfu-count" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={labResultForm.control}
                        name="processedBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Processed By (Lab Staff ID)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter staff ID" data-testid="input-processed-by" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={labResultForm.control}
                      name="remarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Remarks</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Optional remarks" data-testid="input-lab-remarks" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={createLabResultMutation.isPending} data-testid="button-submit-lab-result">
                        {createLabResultMutation.isPending ? "Saving..." : "Save Result"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Swab ID</TableHead>
                    <TableHead>Result Date</TableHead>
                    <TableHead>Culture Media</TableHead>
                    <TableHead>Organism</TableHead>
                    <TableHead>CFU Count</TableHead>
                    <TableHead>Growth Level</TableHead>
                    <TableHead>Processed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {labResults.map((result) => {
                    const collection = collections.find(c => c.id === result.swabCollectionId);
                    return (
                      <TableRow key={result.id} data-testid={`row-lab-result-${result.id}`}>
                        <TableCell className="font-mono">{collection?.swabId || "N/A"}</TableCell>
                        <TableCell>{format(new Date(result.resultDate), "MMM d, yyyy HH:mm")}</TableCell>
                        <TableCell>{result.cultureMedia}</TableCell>
                        <TableCell>{getOrganismName(result.organismId)}</TableCell>
                        <TableCell>{result.cfuCount || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={result.growthLevel === "None" ? "outline" : result.growthLevel === "Heavy" ? "destructive" : "secondary"}>
                            {result.growthLevel}
                          </Badge>
                        </TableCell>
                        <TableCell>{result.processedByName || result.processedBy}</TableCell>
                      </TableRow>
                    );
                  })}
                  {labResults.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No lab results yet. Enter results for pending swab collections.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capa" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">CAPA (Corrective & Preventive Actions)</h2>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Issue Summary</TableHead>
                    <TableHead>Immediate Action</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Target Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verification Required</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {capaActions.map((capa) => (
                    <TableRow key={capa.id} data-testid={`row-capa-${capa.id}`}>
                      <TableCell className="max-w-xs truncate">{capa.issueSummary}</TableCell>
                      <TableCell>{capa.immediateAction}</TableCell>
                      <TableCell>{capa.responsibleDepartment}</TableCell>
                      <TableCell>{format(new Date(capa.targetClosureDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>{getCapaStatusBadge(capa.status)}</TableCell>
                      <TableCell>
                        {capa.verificationSwabRequired ? (
                          <Badge variant="outline">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {capaActions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No CAPA actions. CAPA is auto-generated when swab results fail.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <h2 className="text-xl font-semibold">NABH-Ready Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover-elevate">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Monthly OT Swab Report
                </CardTitle>
                <CardDescription>Environmental surveillance summary for OT areas</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" data-testid="button-download-ot-report">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover-elevate">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  ICU Environmental Report
                </CardTitle>
                <CardDescription>ICU contamination trends and analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" data-testid="button-download-icu-report">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover-elevate">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Fumigation Validation
                </CardTitle>
                <CardDescription>Post-fumigation swab success rates</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" data-testid="button-download-fumigation-report">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover-elevate">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  CAPA Closure Report
                </CardTitle>
                <CardDescription>Corrective action completion summary</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" data-testid="button-download-capa-report">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover-elevate">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  NABH Evidence Pack
                </CardTitle>
                <CardDescription>Complete infection control documentation</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" data-testid="button-download-nabh-report">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="masters" className="space-y-4">
          <h2 className="text-xl font-semibold">Master Data Configuration</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Area Master
                </CardTitle>
                <CardDescription>OT and ICU locations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {areas.map((area) => (
                    <div key={area.id} className="flex items-center justify-between p-2 border rounded" data-testid={`area-${area.id}`}>
                      <div>
                        <p className="font-medium">{area.areaName}</p>
                        <p className="text-xs text-muted-foreground">{area.block}, {area.floor}</p>
                      </div>
                      <Badge variant="outline">{area.areaType}</Badge>
                    </div>
                  ))}
                  {areas.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No areas configured</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Sampling Sites
                </CardTitle>
                <CardDescription>Swab collection points</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {samplingSites.map((site) => (
                    <div key={site.id} className="flex items-center justify-between p-2 border rounded" data-testid={`site-${site.id}`}>
                      <div>
                        <p className="font-medium">{site.siteName}</p>
                        {site.description && <p className="text-xs text-muted-foreground">{site.description}</p>}
                      </div>
                      {site.isActive ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  ))}
                  {samplingSites.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No sampling sites configured</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Beaker className="w-5 h-5" />
                  Organism Master
                </CardTitle>
                <CardDescription>Detectable organisms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {organisms.map((organism) => (
                    <div key={organism.id} className="flex items-center justify-between p-2 border rounded" data-testid={`organism-${organism.id}`}>
                      <div>
                        <p className="font-medium">{organism.organismName}</p>
                        <p className="text-xs text-muted-foreground">{organism.category}</p>
                      </div>
                      <Badge variant={organism.riskLevel === "critical" ? "destructive" : organism.riskLevel === "high" ? "outline" : "secondary"}>
                        {organism.riskLevel}
                      </Badge>
                    </div>
                  ))}
                  {organisms.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No organisms configured</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}