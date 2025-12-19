import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Droplet, 
  Users, 
  Thermometer, 
  ClipboardList, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Package,
  Plus,
  Search,
  RefreshCw,
  FileText,
  Activity,
  AlertCircle,
  Loader2
} from "lucide-react";
import type { 
  BloodUnit, 
  BloodDonor, 
  BloodStorageFacility, 
  BloodTransfusionOrder,
  BloodServiceGroup,
  BloodBankAuditLog 
} from "@shared/schema";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const COMPONENT_TYPES = ["WHOLE_BLOOD", "PRBC", "PLATELET", "FFP", "CRYOPRECIPITATE", "GRANULOCYTES"];
const URGENCY_LEVELS = ["ROUTINE", "URGENT", "EMERGENCY", "MASSIVE_TRANSFUSION"];

export default function BloodBankPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAddDonorModal, setShowAddDonorModal] = useState(false);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Queries
  const { data: bloodUnits = [], isLoading: unitsLoading } = useQuery<BloodUnit[]>({
    queryKey: ["/api/blood-bank/units"],
  });

  const { data: donors = [], isLoading: donorsLoading } = useQuery<BloodDonor[]>({
    queryKey: ["/api/blood-bank/donors"],
  });

  const { data: storageFacilities = [], isLoading: storageLoading } = useQuery<BloodStorageFacility[]>({
    queryKey: ["/api/blood-bank/storage"],
  });

  const { data: transfusionOrders = [], isLoading: ordersLoading } = useQuery<BloodTransfusionOrder[]>({
    queryKey: ["/api/blood-bank/orders"],
  });

  const { data: serviceGroups = [] } = useQuery<BloodServiceGroup[]>({
    queryKey: ["/api/blood-bank/service-groups"],
  });

  const { data: auditLogs = [] } = useQuery<BloodBankAuditLog[]>({
    queryKey: ["/api/blood-bank/audit-log"],
  });

  // Dashboard Stats
  const stats = {
    totalUnits: bloodUnits.length,
    availableUnits: bloodUnits.filter(u => u.status === "AVAILABLE").length,
    issuedUnits: bloodUnits.filter(u => u.status === "ISSUED").length,
    expiringSoon: bloodUnits.filter(u => {
      if (!u.expiryDate) return false;
      const expiry = new Date(u.expiryDate);
      const daysUntilExpiry = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 3 && daysUntilExpiry > 0 && u.status === "AVAILABLE";
    }).length,
    totalDonors: donors.length,
    eligibleDonors: donors.filter(d => d.eligibilityStatus === "ELIGIBLE").length,
    pendingOrders: transfusionOrders.filter(o => o.status === "PENDING").length,
    temperatureAlerts: storageFacilities.filter(f => f.hasTemperatureBreach).length
  };

  // Blood group inventory
  const bloodGroupInventory = BLOOD_GROUPS.map(group => ({
    group,
    count: bloodUnits.filter(u => u.bloodGroup === group && u.status === "AVAILABLE").length
  }));

  // Component type inventory
  const componentInventory = COMPONENT_TYPES.map(type => ({
    type: type.replace(/_/g, " "),
    count: bloodUnits.filter(u => u.componentType === type && u.status === "AVAILABLE").length
  }));

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
      AVAILABLE: { variant: "default", className: "bg-green-600" },
      COLLECTED: { variant: "secondary" },
      TESTING: { variant: "outline", className: "border-blue-500 text-blue-600" },
      QUARANTINE: { variant: "outline", className: "border-yellow-500 text-yellow-600" },
      RESERVED: { variant: "outline", className: "border-purple-500 text-purple-600" },
      ISSUED: { variant: "default", className: "bg-blue-600" },
      TRANSFUSED: { variant: "secondary" },
      RETURNED: { variant: "outline" },
      EXPIRED: { variant: "destructive" },
      DISPOSED: { variant: "destructive" }
    };
    const config = statusConfig[status] || { variant: "secondary" as const };
    return <Badge variant={config.variant} className={config.className}>{status}</Badge>;
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "EMERGENCY":
        return <Badge variant="destructive">Emergency</Badge>;
      case "URGENT":
        return <Badge variant="outline" className="border-orange-500 text-orange-600">Urgent</Badge>;
      case "MASSIVE_TRANSFUSION":
        return <Badge variant="destructive" className="bg-red-700">Massive Transfusion</Badge>;
      default:
        return <Badge variant="secondary">Routine</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Droplet className="h-6 w-6 text-red-500" />
            Blood Bank Management
          </h1>
          <p className="text-muted-foreground">
            NABH-compliant service-driven blood management system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/blood-bank"] });
              toast({ title: "Data refreshed" });
            }}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">
            <Activity className="h-4 w-4 mr-1" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="inventory" data-testid="tab-inventory">
            <Package className="h-4 w-4 mr-1" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="donors" data-testid="tab-donors">
            <Users className="h-4 w-4 mr-1" />
            Donors
          </TabsTrigger>
          <TabsTrigger value="storage" data-testid="tab-storage">
            <Thermometer className="h-4 w-4 mr-1" />
            Storage
          </TabsTrigger>
          <TabsTrigger value="orders" data-testid="tab-orders">
            <ClipboardList className="h-4 w-4 mr-1" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit">
            <FileText className="h-4 w-4 mr-1" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Units</CardTitle>
                <Droplet className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.availableUnits}</div>
                <p className="text-xs text-muted-foreground">of {stats.totalUnits} total units</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Registered Donors</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDonors}</div>
                <p className="text-xs text-muted-foreground">{stats.eligibleDonors} eligible</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <ClipboardList className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingOrders}</div>
                <p className="text-xs text-muted-foreground">awaiting processing</p>
              </CardContent>
            </Card>

            <Card className={stats.expiringSoon > 0 || stats.temperatureAlerts > 0 ? "border-yellow-500" : ""}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alerts</CardTitle>
                <AlertTriangle className={`h-4 w-4 ${stats.expiringSoon > 0 || stats.temperatureAlerts > 0 ? "text-yellow-500" : "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.expiringSoon + stats.temperatureAlerts}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.expiringSoon} expiring, {stats.temperatureAlerts} temp alerts
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Blood Group Inventory */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Blood Group Availability</CardTitle>
              <CardDescription>Current stock by blood group</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                {bloodGroupInventory.map(item => (
                  <div 
                    key={item.group}
                    className={`text-center p-4 rounded-lg border ${item.count === 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200' : 'bg-card'}`}
                  >
                    <div className="text-lg font-bold text-red-600">{item.group}</div>
                    <div className="text-2xl font-bold">{item.count}</div>
                    <div className="text-xs text-muted-foreground">units</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Component Inventory */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Component Availability</CardTitle>
              <CardDescription>Current stock by blood component type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {componentInventory.map(item => (
                  <div key={item.type} className="p-4 rounded-lg border bg-card">
                    <div className="text-sm font-medium truncate">{item.type}</div>
                    <div className="text-2xl font-bold">{item.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Service Groups */}
          {serviceGroups.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Service Categories</CardTitle>
                <CardDescription>NABH-compliant blood bank service groups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {serviceGroups.map(group => (
                    <div key={group.id} className="p-3 rounded-lg border bg-card hover-elevate">
                      <div className="font-medium text-sm">{group.name}</div>
                      <div className="text-xs text-muted-foreground">{group.code}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Blood Unit Inventory</CardTitle>
                <CardDescription>Manage blood units from collection to transfusion</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search units..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                    data-testid="input-search-units"
                  />
                </div>
                <Button onClick={() => setShowAddUnitModal(true)} data-testid="button-add-unit">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Unit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {unitsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : bloodUnits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No blood units registered</p>
                  <p className="text-sm">Add a new blood unit to get started</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unit ID</TableHead>
                        <TableHead>Blood Group</TableHead>
                        <TableHead>Component</TableHead>
                        <TableHead>Volume</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Collection Date</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Donor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bloodUnits
                        .filter(u => !searchQuery || 
                          u.unitId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.bloodGroup?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((unit) => (
                        <TableRow key={unit.id} data-testid={`row-unit-${unit.id}`}>
                          <TableCell className="font-mono text-sm">{unit.unitId}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-bold text-red-600 border-red-300">
                              {unit.bloodGroup}{unit.rhFactor === "Positive" ? "+" : "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>{unit.componentType?.replace(/_/g, " ")}</TableCell>
                          <TableCell>{unit.volume} mL</TableCell>
                          <TableCell>{getStatusBadge(unit.status || "COLLECTED")}</TableCell>
                          <TableCell>{unit.collectionDate}</TableCell>
                          <TableCell className={unit.isExpired ? "text-red-500 font-medium" : ""}>
                            {unit.expiryDate}
                          </TableCell>
                          <TableCell>{unit.donorName}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Donors Tab */}
        <TabsContent value="donors" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Donor Registry</CardTitle>
                <CardDescription>Manage blood donor information and eligibility</CardDescription>
              </div>
              <Button onClick={() => setShowAddDonorModal(true)} data-testid="button-add-donor">
                <Plus className="h-4 w-4 mr-1" />
                Register Donor
              </Button>
            </CardHeader>
            <CardContent>
              {donorsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : donors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No donors registered</p>
                  <p className="text-sm">Register a new donor to get started</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Donor ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Blood Group</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Total Donations</TableHead>
                        <TableHead>Eligibility</TableHead>
                        <TableHead>Next Eligible</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {donors.map((donor) => (
                        <TableRow key={donor.id} data-testid={`row-donor-${donor.id}`}>
                          <TableCell className="font-mono text-sm">{donor.donorId}</TableCell>
                          <TableCell className="font-medium">{donor.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-bold text-red-600 border-red-300">
                              {donor.bloodGroup}
                            </Badge>
                          </TableCell>
                          <TableCell>{donor.gender}</TableCell>
                          <TableCell>{donor.phone}</TableCell>
                          <TableCell>{donor.totalDonations || 0}</TableCell>
                          <TableCell>
                            {donor.eligibilityStatus === "ELIGIBLE" ? (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Eligible
                              </Badge>
                            ) : donor.eligibilityStatus === "TEMPORARILY_DEFERRED" ? (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                                <Clock className="h-3 w-3 mr-1" />
                                Deferred
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Permanent
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{donor.nextEligibleDate || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Storage Facilities</CardTitle>
              <CardDescription>Monitor blood storage units and temperature</CardDescription>
            </CardHeader>
            <CardContent>
              {storageLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : storageFacilities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Thermometer className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No storage facilities configured</p>
                  <p className="text-sm">Storage facilities will be seeded automatically</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {storageFacilities.map((facility) => (
                    <Card 
                      key={facility.id} 
                      className={facility.hasTemperatureBreach ? "border-red-500" : ""}
                      data-testid={`card-storage-${facility.id}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{facility.name}</CardTitle>
                          {facility.hasTemperatureBreach && (
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <CardDescription>{facility.facilityCode} - {facility.type}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Location:</span>
                          <span>{facility.location}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Capacity:</span>
                          <span>{facility.currentOccupancy || 0} / {facility.capacity} units</span>
                        </div>
                        <Progress 
                          value={((facility.currentOccupancy || 0) / facility.capacity) * 100} 
                          className="h-2"
                        />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Temperature:</span>
                          <span className={facility.hasTemperatureBreach ? "text-red-500 font-medium" : ""}>
                            {facility.currentTemperature}°C 
                            <span className="text-xs text-muted-foreground ml-1">
                              ({facility.minTemperature} - {facility.maxTemperature}°C)
                            </span>
                          </span>
                        </div>
                        <Badge variant={facility.isOperational ? "default" : "destructive"} className="w-full justify-center">
                          {facility.isOperational ? "Operational" : "Offline"}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transfusion Orders</CardTitle>
              <CardDescription>Manage blood transfusion requests</CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : transfusionOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No transfusion orders</p>
                  <p className="text-sm">Orders will appear when blood is requested</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Blood Group</TableHead>
                        <TableHead>Component</TableHead>
                        <TableHead>Units</TableHead>
                        <TableHead>Urgency</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Doctor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transfusionOrders.map((order) => (
                        <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                          <TableCell className="font-mono text-sm">{order.orderId}</TableCell>
                          <TableCell className="font-medium">{order.patientName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-bold text-red-600 border-red-300">
                              {order.patientBloodGroup}
                            </Badge>
                          </TableCell>
                          <TableCell>{order.componentRequired?.replace(/_/g, " ")}</TableCell>
                          <TableCell>{order.unitsRequired}</TableCell>
                          <TableCell>{getUrgencyBadge(order.urgency || "ROUTINE")}</TableCell>
                          <TableCell>{getStatusBadge(order.status || "PENDING")}</TableCell>
                          <TableCell>{order.wardDepartment}</TableCell>
                          <TableCell>{order.requestingDoctorName}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Audit Trail</CardTitle>
              <CardDescription>NABH/FDA compliant immutable audit log</CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No audit entries</p>
                  <p className="text-sm">Actions will be logged automatically</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id} data-testid={`row-audit-${log.id}`}>
                          <TableCell className="text-sm">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.entityType}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{log.action}</TableCell>
                          <TableCell>{log.serviceName || "-"}</TableCell>
                          <TableCell>{log.userName}</TableCell>
                          <TableCell>{log.userRole}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{log.details || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Donor Modal - Placeholder for now */}
      <Dialog open={showAddDonorModal} onOpenChange={setShowAddDonorModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register New Donor</DialogTitle>
            <DialogDescription>
              Add a new blood donor to the registry
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground text-center">
              Donor registration form will be implemented with full service workflow
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDonorModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Unit Modal - Placeholder for now */}
      <Dialog open={showAddUnitModal} onOpenChange={setShowAddUnitModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Blood Unit</DialogTitle>
            <DialogDescription>
              Register a new blood unit from collection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground text-center">
              Blood unit registration form will be implemented with full service workflow
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUnitModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
