import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  BedDouble, Plus, RefreshCw, Settings, History, BarChart3,
  CheckCircle, XCircle, AlertTriangle, Clock, Trash2, Edit,
  Wind, Activity, Shield, Building2, Layers, ArrowRightLeft
} from "lucide-react";

type BedCategory = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  categoryType: string;
  documentationIntensity: string | null;
  maxDayCareDurationHours: number | null;
  requiresIcuAdmission: boolean | null;
  requiresPediatricPatient: boolean | null;
  isActive: boolean | null;
};

type Bed = {
  id: string;
  bedNumber: string;
  bedName: string | null;
  categoryId: string;
  wardName: string;
  floor: string;
  department: string;
  occupancyStatus: string | null;
  currentPatientId: string | null;
  currentAdmissionId: string | null;
  hasOxygenCapability: boolean | null;
  hasVentilatorCapability: boolean | null;
  isIsolationBed: boolean | null;
  infectionControlFlag: boolean | null;
  ppeProtocolRequired: boolean | null;
  isActive: boolean | null;
  lastCleanedAt: string | null;
  lastOccupiedAt: string | null;
  notes: string | null;
};

type BedStats = {
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  cleaningBeds: number;
  blockedBeds: number;
  maintenanceBeds: number;
  occupancyRate: number;
  isolationBeds: number;
  icuBeds: number;
  ventilatorCapable: number;
  oxygenCapable: number;
  totalCategories: number;
  byWard: Record<string, { total: number; occupied: number; available: number }>;
  byDepartment: Record<string, { total: number; occupied: number; available: number }>;
};

type AuditLog = {
  id: string;
  bedId: string;
  bedNumber: string;
  action: string;
  previousStatus: string | null;
  newStatus: string | null;
  patientId: string | null;
  patientName: string | null;
  userName: string;
  userRole: string;
  timestamp: string;
  details: string | null;
};

const CATEGORY_TYPES = [
  "GENERAL_WARD", "SEMI_PRIVATE", "PRIVATE", "DELUXE", "SUITE",
  "ICU", "HDU", "NICU", "PICU", "ISOLATION", "DAY_CARE", "EMERGENCY"
];

const DEPARTMENTS = ["General", "ICU", "Pediatric", "Emergency", "Surgical", "Maternity", "Oncology"];
const FLOORS = ["Ground", "1st Floor", "2nd Floor", "3rd Floor", "4th Floor", "5th Floor"];
const OCCUPANCY_STATUSES = ["AVAILABLE", "OCCUPIED", "CLEANING", "BLOCKED", "MAINTENANCE"];

const getStatusColor = (status: string | null) => {
  switch (status) {
    case "AVAILABLE": return "bg-green-500";
    case "OCCUPIED": return "bg-red-500";
    case "CLEANING": return "bg-yellow-500";
    case "BLOCKED": return "bg-gray-500";
    case "MAINTENANCE": return "bg-orange-500";
    default: return "bg-gray-400";
  }
};

const getStatusBadgeVariant = (status: string | null): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "AVAILABLE": return "default";
    case "OCCUPIED": return "destructive";
    case "CLEANING": return "secondary";
    case "BLOCKED": return "outline";
    case "MAINTENANCE": return "secondary";
    default: return "outline";
  }
};

export default function BedManagementPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddBed, setShowAddBed] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BedCategory | null>(null);
  const [editingBed, setEditingBed] = useState<Bed | null>(null);
  const [selectedWard, setSelectedWard] = useState<string>("all");

  const [newCategory, setNewCategory] = useState({
    name: "",
    code: "",
    description: "",
    categoryType: "GENERAL_WARD",
    documentationIntensity: "STANDARD",
    maxDayCareDurationHours: null as number | null,
    requiresIcuAdmission: false,
    requiresPediatricPatient: false,
    isActive: true
  });

  const [newBed, setNewBed] = useState({
    bedNumber: "",
    bedName: "",
    categoryId: "",
    wardName: "",
    floor: "Ground",
    department: "General",
    occupancyStatus: "AVAILABLE",
    hasOxygenCapability: false,
    hasVentilatorCapability: false,
    isIsolationBed: false,
    infectionControlFlag: false,
    ppeProtocolRequired: false,
    isActive: true,
    notes: ""
  });

  const { data: stats, isLoading: loadingStats } = useQuery<BedStats>({
    queryKey: ["/api/bed-management/stats"]
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery<BedCategory[]>({
    queryKey: ["/api/bed-management/categories"]
  });

  const { data: allBeds = [], isLoading: loadingBeds } = useQuery<Bed[]>({
    queryKey: ["/api/bed-management/beds"]
  });

  const { data: auditLogs = [], isLoading: loadingAudit } = useQuery<AuditLog[]>({
    queryKey: ["/api/bed-management/audit-log"]
  });

  const filteredBeds = selectedWard === "all" 
    ? allBeds 
    : allBeds.filter(b => b.wardName === selectedWard);

  const uniqueWards = [...new Set(allBeds.map(b => b.wardName))];

  const createCategoryMutation = useMutation({
    mutationFn: (data: typeof newCategory) => 
      apiRequest("POST", "/api/bed-management/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bed-management/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bed-management/stats"] });
      setShowAddCategory(false);
      setNewCategory({
        name: "", code: "", description: "", categoryType: "GENERAL_WARD",
        documentationIntensity: "STANDARD", maxDayCareDurationHours: null,
        requiresIcuAdmission: false, requiresPediatricPatient: false, isActive: true
      });
      toast({ title: "Category Created", description: "Bed category added successfully" });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<BedCategory>) => 
      apiRequest("PATCH", `/api/bed-management/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bed-management/categories"] });
      setEditingCategory(null);
      toast({ title: "Category Updated" });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/bed-management/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bed-management/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bed-management/stats"] });
      toast({ title: "Category Deleted" });
    }
  });

  const createBedMutation = useMutation({
    mutationFn: (data: typeof newBed) => 
      apiRequest("POST", "/api/bed-management/beds", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bed-management/beds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bed-management/stats"] });
      setShowAddBed(false);
      setNewBed({
        bedNumber: "", bedName: "", categoryId: "", wardName: "", floor: "Ground",
        department: "General", occupancyStatus: "AVAILABLE", hasOxygenCapability: false,
        hasVentilatorCapability: false, isIsolationBed: false, infectionControlFlag: false,
        ppeProtocolRequired: false, isActive: true, notes: ""
      });
      toast({ title: "Bed Created", description: "New bed added successfully" });
    }
  });

  const updateBedMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Bed>) => 
      apiRequest("PATCH", `/api/bed-management/beds/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bed-management/beds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bed-management/stats"] });
      setEditingBed(null);
      toast({ title: "Bed Updated" });
    }
  });

  const deleteBedMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/bed-management/beds/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bed-management/beds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bed-management/stats"] });
      toast({ title: "Bed Deleted" });
    }
  });

  const markCleanedMutation = useMutation({
    mutationFn: (bedId: string) => 
      apiRequest("POST", "/api/bed-management/mark-cleaned", { 
        bedId, 
        cleanedBy: "admin",
        cleanedByName: "Admin User"
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bed-management/beds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bed-management/stats"] });
      toast({ title: "Bed Marked as Cleaned", description: "Bed is now available" });
    }
  });

  if (loadingStats || loadingBeds) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]" data-testid="loading-spinner">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BedDouble className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Bed Management</h1>
            <p className="text-sm text-muted-foreground">NABH-Compliant Hospital Bed Control System</p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          {stats?.occupancyRate || 0}% Occupancy
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="dashboard" className="gap-2" data-testid="tab-dashboard">
            <BarChart3 className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="beds" className="gap-2" data-testid="tab-beds">
            <BedDouble className="h-4 w-4" /> Beds
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2" data-testid="tab-categories">
            <Layers className="h-4 w-4" /> Categories
          </TabsTrigger>
          <TabsTrigger value="transfers" className="gap-2" data-testid="tab-transfers">
            <ArrowRightLeft className="h-4 w-4" /> Transfers
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2" data-testid="tab-audit">
            <History className="h-4 w-4" /> Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary" data-testid="stat-total-beds">{stats?.totalBeds || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Beds</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600" data-testid="stat-available">{stats?.availableBeds || 0}</div>
                  <div className="text-sm text-muted-foreground">Available</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600" data-testid="stat-occupied">{stats?.occupiedBeds || 0}</div>
                  <div className="text-sm text-muted-foreground">Occupied</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{stats?.cleaningBeds || 0}</div>
                  <div className="text-sm text-muted-foreground">Cleaning</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{stats?.maintenanceBeds || 0}</div>
                  <div className="text-sm text-muted-foreground">Maintenance</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-600">{stats?.blockedBeds || 0}</div>
                  <div className="text-sm text-muted-foreground">Blocked</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats?.icuBeds || 0}</div>
                  <div className="text-sm text-muted-foreground">ICU Beds</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats?.isolationBeds || 0}</div>
                  <div className="text-sm text-muted-foreground">Isolation Beds</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-cyan-100 dark:bg-cyan-900">
                  <Wind className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats?.ventilatorCapable || 0}</div>
                  <div className="text-sm text-muted-foreground">Ventilator Ready</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats?.oxygenCapable || 0}</div>
                  <div className="text-sm text-muted-foreground">Oxygen Ready</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {stats?.byWard && Object.keys(stats.byWard).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Bed Utilization by Ward</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(stats.byWard).map(([ward, data]) => (
                    <div key={ward} className="p-4 rounded-lg border">
                      <div className="font-medium mb-2">{ward}</div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total:</span>
                        <span>{data.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Available:</span>
                        <span>{data.available}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-red-600">Occupied:</span>
                        <span>{data.occupied}</span>
                      </div>
                      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500" 
                          style={{ width: `${data.total > 0 ? (data.occupied / data.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="beds" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={selectedWard} onValueChange={setSelectedWard}>
                <SelectTrigger className="w-[200px]" data-testid="select-ward-filter">
                  <SelectValue placeholder="Filter by Ward" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wards</SelectItem>
                  {uniqueWards.map(ward => (
                    <SelectItem key={ward} value={ward}>{ward}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="outline">{filteredBeds.length} beds</Badge>
            </div>
            <Dialog open={showAddBed} onOpenChange={setShowAddBed}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-add-bed">
                  <Plus className="h-4 w-4" /> Add Bed
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Bed</DialogTitle>
                  <DialogDescription>Create a new bed record in the system</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Bed Number *</Label>
                    <Input 
                      value={newBed.bedNumber}
                      onChange={(e) => setNewBed({...newBed, bedNumber: e.target.value})}
                      placeholder="e.g., ICU-01"
                      data-testid="input-bed-number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bed Name</Label>
                    <Input 
                      value={newBed.bedName}
                      onChange={(e) => setNewBed({...newBed, bedName: e.target.value})}
                      placeholder="e.g., ICU Bed 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={newBed.categoryId} onValueChange={(v) => setNewBed({...newBed, categoryId: v})}>
                      <SelectTrigger data-testid="select-bed-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ward Name *</Label>
                    <Input 
                      value={newBed.wardName}
                      onChange={(e) => setNewBed({...newBed, wardName: e.target.value})}
                      placeholder="e.g., ICU Ward A"
                      data-testid="input-ward-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Floor *</Label>
                    <Select value={newBed.floor} onValueChange={(v) => setNewBed({...newBed, floor: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FLOORS.map(f => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department *</Label>
                    <Select value={newBed.department} onValueChange={(v) => setNewBed({...newBed, department: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={newBed.hasOxygenCapability}
                        onCheckedChange={(c) => setNewBed({...newBed, hasOxygenCapability: c})}
                      />
                      <Label>Oxygen Capability</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={newBed.hasVentilatorCapability}
                        onCheckedChange={(c) => setNewBed({...newBed, hasVentilatorCapability: c})}
                      />
                      <Label>Ventilator Ready</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={newBed.isIsolationBed}
                        onCheckedChange={(c) => setNewBed({...newBed, isIsolationBed: c, infectionControlFlag: c, ppeProtocolRequired: c})}
                      />
                      <Label>Isolation Bed</Label>
                    </div>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Notes</Label>
                    <Textarea 
                      value={newBed.notes}
                      onChange={(e) => setNewBed({...newBed, notes: e.target.value})}
                      placeholder="Additional notes about this bed..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddBed(false)}>Cancel</Button>
                  <Button 
                    onClick={() => createBedMutation.mutate(newBed)}
                    disabled={!newBed.bedNumber || !newBed.categoryId || !newBed.wardName || createBedMutation.isPending}
                    data-testid="button-save-bed"
                  >
                    {createBedMutation.isPending ? "Creating..." : "Create Bed"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredBeds.map(bed => {
              const category = categories.find(c => c.id === bed.categoryId);
              return (
                <Card key={bed.id} className={`relative ${!bed.isActive ? 'opacity-50' : ''}`} data-testid={`card-bed-${bed.id}`}>
                  <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getStatusColor(bed.occupancyStatus)}`} />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{bed.bedNumber}</CardTitle>
                      <div className="flex gap-1">
                        {bed.hasOxygenCapability && <Badge variant="outline" className="text-xs px-1">O2</Badge>}
                        {bed.hasVentilatorCapability && <Badge variant="outline" className="text-xs px-1">V</Badge>}
                        {bed.isIsolationBed && <Badge variant="destructive" className="text-xs px-1">ISO</Badge>}
                      </div>
                    </div>
                    <CardDescription>{bed.wardName} - {bed.floor}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <span>{category?.name || "Unknown"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dept:</span>
                        <span>{bed.department}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={getStatusBadgeVariant(bed.occupancyStatus)}>
                          {bed.occupancyStatus}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 gap-2">
                    {bed.occupancyStatus === "CLEANING" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => markCleanedMutation.mutate(bed.id)}
                        data-testid={`button-mark-cleaned-${bed.id}`}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" /> Cleaned
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setEditingBed(bed)}
                      data-testid={`button-edit-bed-${bed.id}`}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this bed?")) {
                          deleteBedMutation.mutate(bed.id);
                        }
                      }}
                      data-testid={`button-delete-bed-${bed.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {filteredBeds.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No beds found. Add your first bed to get started.
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-add-category">
                  <Plus className="h-4 w-4" /> Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Bed Category</DialogTitle>
                  <DialogDescription>Create a new bed category with rules and entitlements</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category Name *</Label>
                      <Input 
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                        placeholder="e.g., ICU Bed"
                        data-testid="input-category-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Code *</Label>
                      <Input 
                        value={newCategory.code}
                        onChange={(e) => setNewCategory({...newCategory, code: e.target.value.toUpperCase()})}
                        placeholder="e.g., ICU"
                        data-testid="input-category-code"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Category Type *</Label>
                    <Select value={newCategory.categoryType} onValueChange={(v) => setNewCategory({...newCategory, categoryType: v})}>
                      <SelectTrigger data-testid="select-category-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_TYPES.map(t => (
                          <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                      placeholder="Description of this bed category..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Documentation Intensity</Label>
                      <Select 
                        value={newCategory.documentationIntensity || "STANDARD"} 
                        onValueChange={(v) => setNewCategory({...newCategory, documentationIntensity: v})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STANDARD">Standard</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Max Day-Care Duration (hours)</Label>
                      <Input 
                        type="number"
                        value={newCategory.maxDayCareDurationHours || ""}
                        onChange={(e) => setNewCategory({...newCategory, maxDayCareDurationHours: e.target.value ? parseInt(e.target.value) : null})}
                        placeholder="Leave empty if N/A"
                      />
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={newCategory.requiresIcuAdmission}
                        onCheckedChange={(c) => setNewCategory({...newCategory, requiresIcuAdmission: c})}
                      />
                      <Label>Requires ICU Admission</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={newCategory.requiresPediatricPatient}
                        onCheckedChange={(c) => setNewCategory({...newCategory, requiresPediatricPatient: c})}
                      />
                      <Label>Pediatric Only</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddCategory(false)}>Cancel</Button>
                  <Button 
                    onClick={() => createCategoryMutation.mutate(newCategory)}
                    disabled={!newCategory.name || !newCategory.code || !newCategory.categoryType || createCategoryMutation.isPending}
                    data-testid="button-save-category"
                  >
                    {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => (
              <Card key={category.id} className={!category.isActive ? 'opacity-50' : ''} data-testid={`card-category-${category.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <Badge variant="outline">{category.code}</Badge>
                  </div>
                  <CardDescription>{category.categoryType.replace(/_/g, " ")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {category.description && (
                      <p className="text-muted-foreground">{category.description}</p>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Documentation:</span>
                      <span>{category.documentationIntensity || "Standard"}</span>
                    </div>
                    {category.maxDayCareDurationHours && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Day-Care:</span>
                        <span>{category.maxDayCareDurationHours} hours</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      {category.requiresIcuAdmission && <Badge variant="secondary">ICU Required</Badge>}
                      {category.requiresPediatricPatient && <Badge variant="secondary">Pediatric</Badge>}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setEditingCategory(category)}
                    data-testid={`button-edit-category-${category.id}`}
                  >
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this category?")) {
                        deleteCategoryMutation.mutate(category.id);
                      }
                    }}
                    data-testid={`button-delete-category-${category.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No categories found. Add your first bed category to get started.
            </div>
          )}
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bed Transfers</CardTitle>
              <CardDescription>View all bed transfer records (immutable audit trail)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                No transfer records yet. Transfers are logged when patients are moved between beds.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>NABH-compliant immutable audit trail for all bed operations</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAudit ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : auditLogs.length > 0 ? (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Bed</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Status Change</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {format(new Date(log.timestamp), "dd MMM yyyy HH:mm")}
                          </TableCell>
                          <TableCell className="font-medium">{log.bedNumber}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.action}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.previousStatus && log.newStatus ? (
                              <span>{log.previousStatus} → {log.newStatus}</span>
                            ) : log.newStatus ? (
                              <span>→ {log.newStatus}</span>
                            ) : "-"}
                          </TableCell>
                          <TableCell className="text-sm">{log.patientName || "-"}</TableCell>
                          <TableCell className="text-sm">{log.userName} ({log.userRole})</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No audit records yet. All bed operations will be logged here.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {editingBed && (
        <Dialog open={!!editingBed} onOpenChange={() => setEditingBed(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Bed: {editingBed.bedNumber}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Bed Number</Label>
                <Input 
                  value={editingBed.bedNumber}
                  onChange={(e) => setEditingBed({...editingBed, bedNumber: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editingBed.occupancyStatus || "AVAILABLE"} onValueChange={(v) => setEditingBed({...editingBed, occupancyStatus: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OCCUPANCY_STATUSES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ward Name</Label>
                <Input 
                  value={editingBed.wardName}
                  onChange={(e) => setEditingBed({...editingBed, wardName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={editingBed.department} onValueChange={(v) => setEditingBed({...editingBed, department: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={editingBed.hasOxygenCapability || false}
                    onCheckedChange={(c) => setEditingBed({...editingBed, hasOxygenCapability: c})}
                  />
                  <Label>Oxygen</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={editingBed.hasVentilatorCapability || false}
                    onCheckedChange={(c) => setEditingBed({...editingBed, hasVentilatorCapability: c})}
                  />
                  <Label>Ventilator</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={editingBed.isIsolationBed || false}
                    onCheckedChange={(c) => setEditingBed({...editingBed, isIsolationBed: c})}
                  />
                  <Label>Isolation</Label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={editingBed.isActive || false}
                  onCheckedChange={(c) => setEditingBed({...editingBed, isActive: c})}
                />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingBed(null)}>Cancel</Button>
              <Button onClick={() => updateBedMutation.mutate({ id: editingBed.id, ...editingBed })}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {editingCategory && (
        <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category: {editingCategory.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input 
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input 
                    value={editingCategory.code}
                    onChange={(e) => setEditingCategory({...editingCategory, code: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={editingCategory.description || ""}
                  onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={editingCategory.isActive || false}
                  onCheckedChange={(c) => setEditingCategory({...editingCategory, isActive: c})}
                />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
              <Button onClick={() => updateCategoryMutation.mutate({ id: editingCategory.id, ...editingCategory })}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
