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
import { IntegerInput } from "@/components/validated-inputs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { 
  ArrowRightLeft, Building2, Plus, Edit, Trash2, Eye,
  ArrowUpRight, ArrowDownLeft, Phone, Mail, MapPin,
  Calendar, User, Stethoscope, CheckCircle, XCircle, Clock
} from "lucide-react";

type ReferralSource = {
  id: string;
  sourceName: string;
  sourceType: string;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  specialization: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type PatientReferral = {
  id: string;
  referralType: string;
  patientName: string;
  patientPhone: string | null;
  patientAge: number | null;
  patientGender: string | null;
  referralSourceId: string | null;
  referralSourceName: string | null;
  referredByDoctor: string | null;
  referredToDoctor: string | null;
  referredToHospital: string | null;
  department: string | null;
  diagnosis: string | null;
  reasonForReferral: string | null;
  urgency: string;
  status: string;
  referralDate: string;
  appointmentDate: string | null;
  followUpDate: string | null;
  outcome: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type User = {
  id: string;
  username: string;
  name: string;
  role: string;
  tenantId: string;
  hospitalName: string;
};

interface ReferralDataProps {
  currentUser: User;
}

const SOURCE_TYPES = ["Hospital", "Clinic", "Doctor", "Laboratory", "Pharmacy", "Other"];
const REFERRAL_STATUSES = ["PENDING", "ACCEPTED", "REJECTED", "COMPLETED", "CANCELLED"];
const URGENCY_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const DEPARTMENTS = ["General Medicine", "Surgery", "Cardiology", "Orthopedics", "Neurology", "Pediatrics", "Gynecology", "Oncology", "Dermatology", "ENT", "Ophthalmology", "Urology", "Psychiatry", "Other"];
const GENDERS = ["Male", "Female", "Other"];

export default function ReferralData({ currentUser }: ReferralDataProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("outgoing");
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const [isReferralDialogOpen, setIsReferralDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<ReferralSource | null>(null);
  const [editingReferral, setEditingReferral] = useState<PatientReferral | null>(null);
  const [referralType, setReferralType] = useState<"REFER_TO" | "REFER_FROM">("REFER_TO");
  const [selectedReferral, setSelectedReferral] = useState<PatientReferral | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { data: sources = [], isLoading: sourcesLoading } = useQuery<ReferralSource[]>({
    queryKey: ["/api/referral-sources"],
  });

  const { data: outgoingReferrals = [], isLoading: outgoingLoading } = useQuery<PatientReferral[]>({
    queryKey: ["/api/referrals?referralType=REFER_TO"],
  });

  const { data: incomingReferrals = [], isLoading: incomingLoading } = useQuery<PatientReferral[]>({
    queryKey: ["/api/referrals?referralType=REFER_FROM"],
  });

  const createSourceMutation = useMutation({
    mutationFn: async (data: Partial<ReferralSource>) => {
      return await apiRequest("POST", "/api/referral-sources", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referral-sources"] });
      setIsSourceDialogOpen(false);
      setEditingSource(null);
      toast({ title: "Referral source created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create referral source", variant: "destructive" });
    },
  });

  const updateSourceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ReferralSource> }) => {
      return await apiRequest("PATCH", `/api/referral-sources/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referral-sources"] });
      setIsSourceDialogOpen(false);
      setEditingSource(null);
      toast({ title: "Referral source updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update referral source", variant: "destructive" });
    },
  });

  const deleteSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/referral-sources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referral-sources"] });
      toast({ title: "Referral source deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete referral source", variant: "destructive" });
    },
  });

  const createReferralMutation = useMutation({
    mutationFn: async (data: Partial<PatientReferral>) => {
      return await apiRequest("POST", "/api/referrals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals"] });
      setIsReferralDialogOpen(false);
      setEditingReferral(null);
      toast({ title: "Referral created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create referral", variant: "destructive" });
    },
  });

  const updateReferralMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PatientReferral> }) => {
      return await apiRequest("PATCH", `/api/referrals/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals"] });
      setIsReferralDialogOpen(false);
      setEditingReferral(null);
      toast({ title: "Referral updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update referral", variant: "destructive" });
    },
  });

  const deleteReferralMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/referrals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals"] });
      toast({ title: "Referral deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete referral", variant: "destructive" });
    },
  });

  const seedDemoDataMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/referral-sources/seed", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referral-sources"] });
      toast({ title: "Demo data seeded successfully", description: "10 doctors and 10 hospitals added" });
    },
    onError: () => {
      toast({ title: "Failed to seed demo data", variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "ACCEPTED": return <Badge className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>;
      case "REJECTED": return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "COMPLETED": return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "CANCELLED": return <Badge variant="outline">Cancelled</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "LOW": return <Badge variant="outline">Low</Badge>;
      case "MEDIUM": return <Badge variant="secondary">Medium</Badge>;
      case "HIGH": return <Badge className="bg-orange-500">High</Badge>;
      case "CRITICAL": return <Badge variant="destructive">Critical</Badge>;
      default: return <Badge variant="outline">{urgency}</Badge>;
    }
  };

  const handleSourceSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      sourceName: formData.get("sourceName") as string,
      sourceType: formData.get("sourceType") as string,
      contactPerson: formData.get("contactPerson") as string || null,
      contactPhone: formData.get("contactPhone") as string || null,
      contactEmail: formData.get("contactEmail") as string || null,
      address: formData.get("address") as string || null,
      specialization: formData.get("specialization") as string || null,
      notes: formData.get("notes") as string || null,
      isActive: formData.get("isActive") === "true",
    };

    if (editingSource) {
      updateSourceMutation.mutate({ id: editingSource.id, data });
    } else {
      createSourceMutation.mutate(data);
    }
  };

  const handleReferralSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      referralType: referralType,
      patientName: formData.get("patientName") as string,
      patientPhone: formData.get("patientPhone") as string || null,
      patientAge: formData.get("patientAge") ? parseInt(formData.get("patientAge") as string) : null,
      patientGender: formData.get("patientGender") as string || null,
      referralSourceId: formData.get("referralSourceId") as string || null,
      referralSourceName: formData.get("referralSourceName") as string || null,
      referredByDoctor: formData.get("referredByDoctor") as string || null,
      referredToDoctor: formData.get("referredToDoctor") as string || null,
      referredToHospital: formData.get("referredToHospital") as string || null,
      department: formData.get("department") as string || null,
      diagnosis: formData.get("diagnosis") as string || null,
      reasonForReferral: formData.get("reasonForReferral") as string || null,
      urgency: formData.get("urgency") as string || "MEDIUM",
      status: formData.get("status") as string || "PENDING",
      referralDate: formData.get("referralDate") as string || new Date().toISOString().split("T")[0],
      appointmentDate: formData.get("appointmentDate") as string || null,
      followUpDate: formData.get("followUpDate") as string || null,
      outcome: formData.get("outcome") as string || null,
      notes: formData.get("notes") as string || null,
    };

    if (editingReferral) {
      updateReferralMutation.mutate({ id: editingReferral.id, data });
    } else {
      createReferralMutation.mutate(data);
    }
  };

  const ReferralCard = ({ referral, type }: { referral: PatientReferral; type: string }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {type === "REFER_TO" ? (
                <ArrowUpRight className="w-4 h-4 text-blue-500" />
              ) : (
                <ArrowDownLeft className="w-4 h-4 text-green-500" />
              )}
              <span className="font-medium">{referral.patientName}</span>
              {getStatusBadge(referral.status)}
              {getUrgencyBadge(referral.urgency)}
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              {referral.department && <p><Stethoscope className="w-3 h-3 inline mr-1" />{referral.department}</p>}
              {type === "REFER_TO" && referral.referredToHospital && (
                <p><Building2 className="w-3 h-3 inline mr-1" />To: {referral.referredToHospital}</p>
              )}
              {type === "REFER_FROM" && referral.referralSourceName && (
                <p><Building2 className="w-3 h-3 inline mr-1" />From: {referral.referralSourceName}</p>
              )}
              {referral.referralDate && (
                <p><Calendar className="w-3 h-3 inline mr-1" />{format(new Date(referral.referralDate), "dd MMM yyyy")}</p>
              )}
              {referral.diagnosis && <p className="truncate">Diagnosis: {referral.diagnosis}</p>}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button size="icon" variant="ghost" onClick={() => { setSelectedReferral(referral); setIsViewDialogOpen(true); }} data-testid={`button-view-referral-${referral.id}`}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => { setEditingReferral(referral); setReferralType(type as "REFER_TO" | "REFER_FROM"); setIsReferralDialogOpen(true); }} data-testid={`button-edit-referral-${referral.id}`}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => deleteReferralMutation.mutate(referral.id)} data-testid={`button-delete-referral-${referral.id}`}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6" />
            Referral Management
          </h1>
          <p className="text-muted-foreground">Track incoming and outgoing patient referrals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Outgoing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-blue-500" />
              {outgoingReferrals.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Incoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-green-500" />
              {incomingReferrals.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {[...outgoingReferrals, ...incomingReferrals].filter(r => r.status === "PENDING").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Referral Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sources.filter(s => s.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="outgoing" data-testid="tab-outgoing">
            <ArrowUpRight className="w-4 h-4 mr-1" />
            Refer To ({outgoingReferrals.length})
          </TabsTrigger>
          <TabsTrigger value="incoming" data-testid="tab-incoming">
            <ArrowDownLeft className="w-4 h-4 mr-1" />
            Refer From ({incomingReferrals.length})
          </TabsTrigger>
          <TabsTrigger value="sources" data-testid="tab-sources">
            <Building2 className="w-4 h-4 mr-1" />
            Sources ({sources.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="outgoing" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Outgoing Referrals (Refer To)</CardTitle>
                <CardDescription>Patients referred from our hospital to external facilities</CardDescription>
              </div>
              <Button onClick={() => { setReferralType("REFER_TO"); setEditingReferral(null); setIsReferralDialogOpen(true); }} data-testid="button-add-outgoing">
                <Plus className="w-4 h-4 mr-1" />
                Add Referral
              </Button>
            </CardHeader>
            <CardContent>
              {outgoingLoading ? (
                <p>Loading...</p>
              ) : outgoingReferrals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No outgoing referrals found</p>
              ) : (
                <ScrollArea className="h-[400px]">
                  {outgoingReferrals.map(referral => (
                    <ReferralCard key={referral.id} referral={referral} type="REFER_TO" />
                  ))}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incoming" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Incoming Referrals (Refer From)</CardTitle>
                <CardDescription>Patients referred to our hospital from external sources</CardDescription>
              </div>
              <Button onClick={() => { setReferralType("REFER_FROM"); setEditingReferral(null); setIsReferralDialogOpen(true); }} data-testid="button-add-incoming">
                <Plus className="w-4 h-4 mr-1" />
                Add Referral
              </Button>
            </CardHeader>
            <CardContent>
              {incomingLoading ? (
                <p>Loading...</p>
              ) : incomingReferrals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No incoming referrals found</p>
              ) : (
                <ScrollArea className="h-[400px]">
                  {incomingReferrals.map(referral => (
                    <ReferralCard key={referral.id} referral={referral} type="REFER_FROM" />
                  ))}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle>Referral Sources</CardTitle>
                <CardDescription>Manage hospitals, clinics, and doctors you refer patients to/from</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                {sources.length === 0 && (
                  <Button 
                    variant="outline" 
                    onClick={() => seedDemoDataMutation.mutate()} 
                    disabled={seedDemoDataMutation.isPending}
                    data-testid="button-seed-demo"
                  >
                    {seedDemoDataMutation.isPending ? "Seeding..." : "Seed Demo Data"}
                  </Button>
                )}
                <Button onClick={() => { setEditingSource(null); setIsSourceDialogOpen(true); }} data-testid="button-add-source">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Source
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sourcesLoading ? (
                <p>Loading...</p>
              ) : sources.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No referral sources found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sources.map(source => (
                    <Card key={source.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium">{source.sourceName}</h4>
                            <p className="text-sm text-muted-foreground">{source.sourceType}</p>
                          </div>
                          <Badge variant={source.isActive ? "default" : "secondary"}>
                            {source.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <Separator className="my-2" />
                        <div className="text-sm space-y-1">
                          {source.contactPerson && <p><User className="w-3 h-3 inline mr-1" />{source.contactPerson}</p>}
                          {source.contactPhone && <p><Phone className="w-3 h-3 inline mr-1" />{source.contactPhone}</p>}
                          {source.contactEmail && <p><Mail className="w-3 h-3 inline mr-1" />{source.contactEmail}</p>}
                          {source.specialization && <p><Stethoscope className="w-3 h-3 inline mr-1" />{source.specialization}</p>}
                        </div>
                        <div className="flex gap-1 mt-3">
                          <Button size="sm" variant="outline" onClick={() => { setEditingSource(source); setIsSourceDialogOpen(true); }} data-testid={`button-edit-source-${source.id}`}>
                            <Edit className="w-3 h-3 mr-1" />Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteSourceMutation.mutate(source.id)} data-testid={`button-delete-source-${source.id}`}>
                            <Trash2 className="w-3 h-3 mr-1" />Delete
                          </Button>
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

      <Dialog open={isSourceDialogOpen} onOpenChange={setIsSourceDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSource ? "Edit Referral Source" : "Add Referral Source"}</DialogTitle>
            <DialogDescription>Enter details of the hospital, clinic, or doctor</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSourceSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="sourceName">Name *</Label>
                <Input id="sourceName" name="sourceName" defaultValue={editingSource?.sourceName || ""} required data-testid="input-source-name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sourceType">Type *</Label>
                <Select name="sourceType" defaultValue={editingSource?.sourceType || "Hospital"}>
                  <SelectTrigger data-testid="select-source-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input id="contactPerson" name="contactPerson" defaultValue={editingSource?.contactPerson || ""} data-testid="input-contact-person" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactPhone">Phone</Label>
                  <Input id="contactPhone" name="contactPhone" defaultValue={editingSource?.contactPhone || ""} data-testid="input-contact-phone" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactEmail">Email</Label>
                <Input id="contactEmail" name="contactEmail" type="email" defaultValue={editingSource?.contactEmail || ""} data-testid="input-contact-email" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" name="address" defaultValue={editingSource?.address || ""} data-testid="input-address" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input id="specialization" name="specialization" defaultValue={editingSource?.specialization || ""} data-testid="input-specialization" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" defaultValue={editingSource?.notes || ""} data-testid="input-source-notes" />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="isActive" name="isActive" defaultChecked={editingSource?.isActive ?? true} value="true" data-testid="switch-is-active" />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSourceDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createSourceMutation.isPending || updateSourceMutation.isPending} data-testid="button-save-source">
                {editingSource ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isReferralDialogOpen} onOpenChange={setIsReferralDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReferral ? "Edit Referral" : referralType === "REFER_TO" ? "Add Outgoing Referral" : "Add Incoming Referral"}
            </DialogTitle>
            <DialogDescription>
              {referralType === "REFER_TO" ? "Refer a patient to another hospital or doctor" : "Record a patient referred to our hospital"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReferralSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="patientName">Patient Name *</Label>
                  <Input id="patientName" name="patientName" defaultValue={editingReferral?.patientName || ""} required data-testid="input-patient-name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="patientPhone">Patient Phone</Label>
                  <Input id="patientPhone" name="patientPhone" defaultValue={editingReferral?.patientPhone || ""} data-testid="input-patient-phone" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="patientAge">Age</Label>
                  <IntegerInput id="patientAge" name="patientAge" min={0} max={120} defaultValue={editingReferral?.patientAge?.toString() || ""} data-testid="input-patient-age" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="patientGender">Gender</Label>
                  <Select name="patientGender" defaultValue={editingReferral?.patientGender || ""}>
                    <SelectTrigger data-testid="select-patient-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="department">Department</Label>
                  <Select name="department" defaultValue={editingReferral?.department || ""}>
                    <SelectTrigger data-testid="select-department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {referralType === "REFER_FROM" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="referralSourceId">From Source</Label>
                    <Select name="referralSourceId" defaultValue={editingReferral?.referralSourceId || ""}>
                      <SelectTrigger data-testid="select-referral-source">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {sources.map(s => <SelectItem key={s.id} value={s.id}>{s.sourceName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="referralSourceName">Or Enter Name</Label>
                    <Input id="referralSourceName" name="referralSourceName" defaultValue={editingReferral?.referralSourceName || ""} placeholder="Hospital/Doctor name" data-testid="input-referral-source-name" />
                  </div>
                </div>
              )}

              {referralType === "REFER_TO" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="referredToHospital">Referred To Hospital</Label>
                    <Input id="referredToHospital" name="referredToHospital" defaultValue={editingReferral?.referredToHospital || ""} data-testid="input-referred-to-hospital" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="referredToDoctor">Referred To Doctor</Label>
                    <Input id="referredToDoctor" name="referredToDoctor" defaultValue={editingReferral?.referredToDoctor || ""} data-testid="input-referred-to-doctor" />
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="referredByDoctor">Referred By Doctor</Label>
                <Input id="referredByDoctor" name="referredByDoctor" defaultValue={editingReferral?.referredByDoctor || ""} data-testid="input-referred-by-doctor" />
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Textarea id="diagnosis" name="diagnosis" defaultValue={editingReferral?.diagnosis || ""} data-testid="input-diagnosis" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reasonForReferral">Reason for Referral</Label>
                <Textarea id="reasonForReferral" name="reasonForReferral" defaultValue={editingReferral?.reasonForReferral || ""} data-testid="input-reason" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="urgency">Urgency</Label>
                  <Select name="urgency" defaultValue={editingReferral?.urgency || "MEDIUM"}>
                    <SelectTrigger data-testid="select-urgency">
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      {URGENCY_LEVELS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={editingReferral?.status || "PENDING"}>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {REFERRAL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="referralDate">Referral Date *</Label>
                  <Input id="referralDate" name="referralDate" type="date" defaultValue={editingReferral?.referralDate?.split("T")[0] || new Date().toISOString().split("T")[0]} required data-testid="input-referral-date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="appointmentDate">Appointment Date</Label>
                  <Input id="appointmentDate" name="appointmentDate" type="date" defaultValue={editingReferral?.appointmentDate?.split("T")[0] || ""} data-testid="input-appointment-date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="followUpDate">Follow-up Date</Label>
                  <Input id="followUpDate" name="followUpDate" type="date" defaultValue={editingReferral?.followUpDate?.split("T")[0] || ""} data-testid="input-followup-date" />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="outcome">Outcome</Label>
                <Textarea id="outcome" name="outcome" defaultValue={editingReferral?.outcome || ""} data-testid="input-outcome" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" defaultValue={editingReferral?.notes || ""} data-testid="input-referral-notes" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsReferralDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createReferralMutation.isPending || updateReferralMutation.isPending} data-testid="button-save-referral">
                {editingReferral ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Referral Details</DialogTitle>
          </DialogHeader>
          {selectedReferral && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {selectedReferral.referralType === "REFER_TO" ? (
                  <Badge className="bg-blue-500"><ArrowUpRight className="w-3 h-3 mr-1" />Outgoing</Badge>
                ) : (
                  <Badge className="bg-green-500"><ArrowDownLeft className="w-3 h-3 mr-1" />Incoming</Badge>
                )}
                {getStatusBadge(selectedReferral.status)}
                {getUrgencyBadge(selectedReferral.urgency)}
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Patient Name</p>
                  <p className="font-medium">{selectedReferral.patientName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedReferral.patientPhone || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Age / Gender</p>
                  <p className="font-medium">{selectedReferral.patientAge || "-"} / {selectedReferral.patientGender || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-medium">{selectedReferral.department || "-"}</p>
                </div>
                {selectedReferral.referralType === "REFER_TO" && (
                  <>
                    <div>
                      <p className="text-muted-foreground">Referred To Hospital</p>
                      <p className="font-medium">{selectedReferral.referredToHospital || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Referred To Doctor</p>
                      <p className="font-medium">{selectedReferral.referredToDoctor || "-"}</p>
                    </div>
                  </>
                )}
                {selectedReferral.referralType === "REFER_FROM" && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Referred From</p>
                    <p className="font-medium">{selectedReferral.referralSourceName || "-"}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Referred By</p>
                  <p className="font-medium">{selectedReferral.referredByDoctor || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Referral Date</p>
                  <p className="font-medium">{selectedReferral.referralDate ? format(new Date(selectedReferral.referralDate), "dd MMM yyyy") : "-"}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground text-sm">Diagnosis</p>
                <p>{selectedReferral.diagnosis || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Reason for Referral</p>
                <p>{selectedReferral.reasonForReferral || "-"}</p>
              </div>
              {selectedReferral.outcome && (
                <div>
                  <p className="text-muted-foreground text-sm">Outcome</p>
                  <p>{selectedReferral.outcome}</p>
                </div>
              )}
              {selectedReferral.notes && (
                <div>
                  <p className="text-muted-foreground text-sm">Notes</p>
                  <p>{selectedReferral.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
