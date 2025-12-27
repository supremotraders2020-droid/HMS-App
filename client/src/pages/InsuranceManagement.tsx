import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, Building2, FileText, Users, Clock, CheckCircle, 
  Plus, Edit, Trash2, Eye, AlertCircle, XCircle,
  TrendingUp, IndianRupee, Calendar, ClipboardCheck
} from "lucide-react";

type InsuranceProvider = {
  id: string;
  providerName: string;
  providerType: string;
  tpaName: string | null;
  tpaContactPerson: string | null;
  tpaPhone: string | null;
  tpaEmail: string | null;
  networkHospitals: boolean;
  coverageType: string;
  roomRentLimit: string | null;
  icuLimit: string | null;
  coPayPercentage: string | null;
  exclusions: string | null;
  preAuthRequired: boolean;
  claimSubmissionMode: string;
  averageClaimTatDays: number | null;
  documentsRequired: string | null;
  activeStatus: boolean;
  createdAt: string;
};

type InsuranceClaim = {
  id: string;
  claimNumber: string;
  patientInsuranceId: string;
  patientId: string;
  claimType: string;
  status: string;
  diagnosis: string | null;
  estimatedCost: string | null;
  approvedAmount: string | null;
  settledAmount: string | null;
  rejectionReason: string | null;
  createdAt: string;
};

type DashboardData = {
  summary: {
    totalClaims: number;
    pendingClaims: number;
    approvalRate: string;
    totalSettledAmount: string;
    activeProviders: number;
  };
  claimsByStatus: Record<string, number>;
  recentClaims: InsuranceClaim[];
};

const PROVIDER_TYPES = ["Cashless", "Reimbursement", "Both"];
const COVERAGE_TYPES = ["IPD", "OPD", "Day Care", "All"];
const SUBMISSION_MODES = ["Online", "Physical", "Both"];
const CLAIM_STATUSES = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "QUERY_RAISED", "APPROVED", "PARTIALLY_APPROVED", "REJECTED", "SETTLED"];

export default function InsuranceManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<InsuranceProvider | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null);

  const { data: providers = [], isLoading: providersLoading } = useQuery<InsuranceProvider[]>({
    queryKey: ["/api/insurance/providers"],
  });

  const { data: claims = [], isLoading: claimsLoading } = useQuery<InsuranceClaim[]>({
    queryKey: ["/api/insurance/claims"],
  });

  const { data: dashboard, isLoading: dashboardLoading } = useQuery<DashboardData>({
    queryKey: ["/api/insurance/dashboard"],
  });

  const createProviderMutation = useMutation({
    mutationFn: async (data: Partial<InsuranceProvider>) => {
      return await apiRequest("POST", "/api/insurance/providers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/providers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/dashboard"] });
      setIsProviderDialogOpen(false);
      setEditingProvider(null);
      toast({ title: "Provider created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create provider", variant: "destructive" });
    },
  });

  const updateProviderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsuranceProvider> }) => {
      return await apiRequest("PATCH", `/api/insurance/providers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/providers"] });
      setIsProviderDialogOpen(false);
      setEditingProvider(null);
      toast({ title: "Provider updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update provider", variant: "destructive" });
    },
  });

  const deactivateProviderMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/insurance/providers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/providers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/dashboard"] });
      toast({ title: "Provider deactivated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to deactivate provider", variant: "destructive" });
    },
  });

  const updateClaimMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsuranceClaim> }) => {
      return await apiRequest("PATCH", `/api/insurance/claims/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/dashboard"] });
      setSelectedClaim(null);
      toast({ title: "Claim updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update claim", variant: "destructive" });
    },
  });

  const handleProviderSubmit = (formData: FormData) => {
    const data = {
      providerName: formData.get("providerName") as string,
      providerType: formData.get("providerType") as string,
      coverageType: formData.get("coverageType") as string,
      tpaName: formData.get("tpaName") as string || null,
      tpaContactPerson: formData.get("tpaContactPerson") as string || null,
      tpaPhone: formData.get("tpaPhone") as string || null,
      tpaEmail: formData.get("tpaEmail") as string || null,
      roomRentLimit: formData.get("roomRentLimit") as string || null,
      icuLimit: formData.get("icuLimit") as string || null,
      coPayPercentage: formData.get("coPayPercentage") as string || null,
      exclusions: formData.get("exclusions") as string || null,
      claimSubmissionMode: formData.get("claimSubmissionMode") as string || "Both",
      averageClaimTatDays: parseInt(formData.get("averageClaimTatDays") as string) || null,
      preAuthRequired: formData.get("preAuthRequired") === "on",
      networkHospitals: formData.get("networkHospitals") === "on",
    };

    if (editingProvider) {
      updateProviderMutation.mutate({ id: editingProvider.id, data });
    } else {
      createProviderMutation.mutate(data);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      DRAFT: "secondary",
      SUBMITTED: "default",
      UNDER_REVIEW: "default",
      QUERY_RAISED: "outline",
      APPROVED: "default",
      PARTIALLY_APPROVED: "default",
      REJECTED: "destructive",
      SETTLED: "default",
    };
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-800",
      SUBMITTED: "bg-blue-100 text-blue-800",
      UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
      QUERY_RAISED: "bg-orange-100 text-orange-800",
      APPROVED: "bg-green-100 text-green-800",
      PARTIALLY_APPROVED: "bg-lime-100 text-lime-800",
      REJECTED: "bg-red-100 text-red-800",
      SETTLED: "bg-emerald-100 text-emerald-800",
    };
    return <Badge className={colors[status] || ""} variant={variants[status] || "default"}>{status.replace(/_/g, " ")}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Insurance Management</h1>
          <p className="text-muted-foreground">Manage insurance providers, claims, and track settlements</p>
        </div>
        <Shield className="h-10 w-10 text-primary" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">
            <TrendingUp className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="providers" data-testid="tab-providers">
            <Building2 className="h-4 w-4 mr-2" />
            Providers
          </TabsTrigger>
          <TabsTrigger value="claims" data-testid="tab-claims">
            <FileText className="h-4 w-4 mr-2" />
            Claims
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {dashboardLoading ? (
            <div className="text-center py-8">Loading dashboard...</div>
          ) : dashboard ? (
            <>
              <div className="grid gap-4 md:grid-cols-5">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-total-claims">{dashboard.summary.totalClaims}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-claims">{dashboard.summary.pendingClaims}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600" data-testid="text-approval-rate">{dashboard.summary.approvalRate}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">Total Settled</CardTitle>
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-settled-amount">₹{dashboard.summary.totalSettledAmount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-active-providers">{dashboard.summary.activeProviders}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Claims by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(dashboard.claimsByStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          {getStatusBadge(status)}
                          <span className="font-semibold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Claims</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {dashboard.recentClaims.map((claim) => (
                          <div key={claim.id} className="flex items-center justify-between p-2 border rounded-lg">
                            <div>
                              <p className="font-medium">{claim.claimNumber}</p>
                              <p className="text-sm text-muted-foreground">{claim.claimType}</p>
                            </div>
                            {getStatusBadge(claim.status)}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p>No dashboard data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Insurance Providers</h2>
            <Dialog open={isProviderDialogOpen} onOpenChange={setIsProviderDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-provider" onClick={() => setEditingProvider(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Provider
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProvider ? "Edit Provider" : "Add Insurance Provider"}</DialogTitle>
                  <DialogDescription>
                    {editingProvider ? "Update insurance provider details" : "Add a new insurance provider to the system"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleProviderSubmit(new FormData(e.currentTarget)); }}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="providerName">Provider Name *</Label>
                        <Input id="providerName" name="providerName" required defaultValue={editingProvider?.providerName || ""} data-testid="input-provider-name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="providerType">Provider Type *</Label>
                        <Select name="providerType" defaultValue={editingProvider?.providerType || "Both"}>
                          <SelectTrigger data-testid="select-provider-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROVIDER_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="coverageType">Coverage Type *</Label>
                        <Select name="coverageType" defaultValue={editingProvider?.coverageType || "All"}>
                          <SelectTrigger data-testid="select-coverage-type">
                            <SelectValue placeholder="Select coverage" />
                          </SelectTrigger>
                          <SelectContent>
                            {COVERAGE_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="claimSubmissionMode">Submission Mode</Label>
                        <Select name="claimSubmissionMode" defaultValue={editingProvider?.claimSubmissionMode || "Both"}>
                          <SelectTrigger data-testid="select-submission-mode">
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBMISSION_MODES.map((mode) => (
                              <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />
                    <h4 className="font-medium">TPA Details</h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tpaName">TPA Name</Label>
                        <Input id="tpaName" name="tpaName" defaultValue={editingProvider?.tpaName || ""} data-testid="input-tpa-name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tpaContactPerson">TPA Contact Person</Label>
                        <Input id="tpaContactPerson" name="tpaContactPerson" defaultValue={editingProvider?.tpaContactPerson || ""} data-testid="input-tpa-contact" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tpaPhone">TPA Phone</Label>
                        <Input id="tpaPhone" name="tpaPhone" defaultValue={editingProvider?.tpaPhone || ""} data-testid="input-tpa-phone" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tpaEmail">TPA Email</Label>
                        <Input id="tpaEmail" name="tpaEmail" type="email" defaultValue={editingProvider?.tpaEmail || ""} data-testid="input-tpa-email" />
                      </div>
                    </div>

                    <Separator />
                    <h4 className="font-medium">Coverage Limits</h4>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="roomRentLimit">Room Rent Limit</Label>
                        <Input id="roomRentLimit" name="roomRentLimit" placeholder="₹ per day" defaultValue={editingProvider?.roomRentLimit || ""} data-testid="input-room-limit" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="icuLimit">ICU Limit</Label>
                        <Input id="icuLimit" name="icuLimit" placeholder="₹ per day" defaultValue={editingProvider?.icuLimit || ""} data-testid="input-icu-limit" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="coPayPercentage">Co-Pay %</Label>
                        <Input id="coPayPercentage" name="coPayPercentage" placeholder="e.g., 10" defaultValue={editingProvider?.coPayPercentage || ""} data-testid="input-copay" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="averageClaimTatDays">Average Claim TAT (Days)</Label>
                      <Input id="averageClaimTatDays" name="averageClaimTatDays" type="number" defaultValue={editingProvider?.averageClaimTatDays || ""} data-testid="input-tat" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="exclusions">Exclusions</Label>
                      <Textarea id="exclusions" name="exclusions" placeholder="List any exclusions..." defaultValue={editingProvider?.exclusions || ""} data-testid="input-exclusions" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch id="preAuthRequired" name="preAuthRequired" defaultChecked={editingProvider?.preAuthRequired ?? true} />
                        <Label htmlFor="preAuthRequired">Pre-Authorization Required</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="networkHospitals" name="networkHospitals" defaultChecked={editingProvider?.networkHospitals ?? true} />
                        <Label htmlFor="networkHospitals">Network Hospitals Available</Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsProviderDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createProviderMutation.isPending || updateProviderMutation.isPending} data-testid="button-save-provider">
                      {editingProvider ? "Update Provider" : "Add Provider"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {providersLoading ? (
            <div className="text-center py-8">Loading providers...</div>
          ) : providers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No insurance providers added yet</p>
                <p className="text-sm text-muted-foreground">Click "Add Provider" to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {providers.map((provider) => (
                <Card key={provider.id} className={!provider.activeStatus ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{provider.providerName}</CardTitle>
                        <CardDescription>{provider.tpaName || "No TPA"}</CardDescription>
                      </div>
                      <Badge variant={provider.activeStatus ? "default" : "secondary"}>
                        {provider.activeStatus ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span>{provider.providerType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Coverage:</span>
                        <span>{provider.coverageType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pre-Auth:</span>
                        <span>{provider.preAuthRequired ? "Required" : "Not Required"}</span>
                      </div>
                      {provider.coPayPercentage && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Co-Pay:</span>
                          <span>{provider.coPayPercentage}%</span>
                        </div>
                      )}
                      {provider.averageClaimTatDays && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg TAT:</span>
                          <span>{provider.averageClaimTatDays} days</span>
                        </div>
                      )}
                    </div>
                    <Separator className="my-4" />
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => { setEditingProvider(provider); setIsProviderDialogOpen(true); }}
                        data-testid={`button-edit-provider-${provider.id}`}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {provider.activeStatus && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deactivateProviderMutation.mutate(provider.id)}
                          data-testid={`button-deactivate-provider-${provider.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="claims" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Insurance Claims</h2>
          </div>

          {claimsLoading ? (
            <div className="text-center py-8">Loading claims...</div>
          ) : claims.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No claims found</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <table className="w-full">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left p-3 font-medium">Claim Number</th>
                        <th className="text-left p-3 font-medium">Type</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Estimated</th>
                        <th className="text-left p-3 font-medium">Approved</th>
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claims.map((claim) => (
                        <tr key={claim.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{claim.claimNumber}</td>
                          <td className="p-3">{claim.claimType}</td>
                          <td className="p-3">{getStatusBadge(claim.status)}</td>
                          <td className="p-3">{claim.estimatedCost ? `₹${claim.estimatedCost}` : "-"}</td>
                          <td className="p-3">{claim.approvedAmount ? `₹${claim.approvedAmount}` : "-"}</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {new Date(claim.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" data-testid={`button-view-claim-${claim.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {["SUBMITTED", "UNDER_REVIEW", "QUERY_RAISED"].includes(claim.status) && (
                                <Select 
                                  value={claim.status}
                                  onValueChange={(value) => updateClaimMutation.mutate({ id: claim.id, data: { status: value } })}
                                >
                                  <SelectTrigger className="w-[140px] h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CLAIM_STATUSES.map((status) => (
                                      <SelectItem key={status} value={status}>{status.replace(/_/g, " ")}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
