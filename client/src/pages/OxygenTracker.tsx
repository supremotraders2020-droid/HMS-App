import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Cylinder, Plus, ArrowRight, ArrowLeft, AlertTriangle, CheckCircle, 
  Clock, Droplets, Activity, QrCode, Building2, User, Search,
  RefreshCw, Gauge, Thermometer, FileText, Bell
} from "lucide-react";
import type { OxygenCylinder, CylinderMovement, OxygenConsumption, LmoReading, OxygenAlert } from "@shared/schema";

const departments = [
  "ICU", "Emergency", "General Ward", "OT", "NICU", "CCU", "Dialysis", "Recovery", "Isolation Ward"
];

const cylinderTypes = ["B-type", "D-type", "Jumbo"];
const cylinderStatuses = ["full", "in_use", "empty", "for_refilling", "for_testing"];

export default function OxygenTracker() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("stock");
  const [showAddCylinder, setShowAddCylinder] = useState(false);
  const [showIssueCylinder, setShowIssueCylinder] = useState(false);
  const [showReturnCylinder, setShowReturnCylinder] = useState(false);
  const [showAddConsumption, setShowAddConsumption] = useState(false);
  const [showAddLmoReading, setShowAddLmoReading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: cylinders = [], isLoading: cylindersLoading } = useQuery<OxygenCylinder[]>({
    queryKey: ['/api/oxygen/cylinders'],
  });

  const { data: movements = [] } = useQuery<CylinderMovement[]>({
    queryKey: ['/api/oxygen/movements'],
  });

  const { data: consumption = [] } = useQuery<OxygenConsumption[]>({
    queryKey: ['/api/oxygen/consumption'],
  });

  const { data: lmoReadings = [] } = useQuery<LmoReading[]>({
    queryKey: ['/api/oxygen/lmo'],
  });

  const { data: alerts = [] } = useQuery<OxygenAlert[]>({
    queryKey: ['/api/oxygen/alerts'],
  });

  const activeAlerts = alerts.filter(a => !a.isResolved);

  const createCylinderMutation = useMutation({
    mutationFn: (data: Partial<OxygenCylinder>) => apiRequest('POST', '/api/oxygen/cylinders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/oxygen/cylinders'] });
      setShowAddCylinder(false);
      toast({ title: "Cylinder added successfully" });
    },
    onError: () => toast({ title: "Failed to add cylinder", variant: "destructive" })
  });

  const createMovementMutation = useMutation({
    mutationFn: (data: Partial<CylinderMovement>) => apiRequest('POST', '/api/oxygen/movements', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/oxygen/cylinders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/oxygen/movements'] });
      setShowIssueCylinder(false);
      setShowReturnCylinder(false);
      toast({ title: "Movement recorded successfully" });
    },
    onError: () => toast({ title: "Failed to record movement", variant: "destructive" })
  });

  const createConsumptionMutation = useMutation({
    mutationFn: (data: Partial<OxygenConsumption>) => apiRequest('POST', '/api/oxygen/consumption', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/oxygen/consumption'] });
      setShowAddConsumption(false);
      toast({ title: "Consumption recorded successfully" });
    },
    onError: () => toast({ title: "Failed to record consumption", variant: "destructive" })
  });

  const createLmoReadingMutation = useMutation({
    mutationFn: (data: Partial<LmoReading>) => apiRequest('POST', '/api/oxygen/lmo', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/oxygen/lmo'] });
      queryClient.invalidateQueries({ queryKey: ['/api/oxygen/alerts'] });
      setShowAddLmoReading(false);
      toast({ title: "LMO reading recorded successfully" });
    },
    onError: () => toast({ title: "Failed to record LMO reading", variant: "destructive" })
  });

  const resolveAlertMutation = useMutation({
    mutationFn: (id: string) => apiRequest('PATCH', `/api/oxygen/alerts/${id}/resolve`, { resolvedBy: 'Admin' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/oxygen/alerts'] });
      toast({ title: "Alert resolved" });
    }
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      full: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      in_use: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      empty: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      for_refilling: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      for_testing: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    };
    return <Badge className={colors[status] || ""}>{status.replace('_', ' ')}</Badge>;
  };

  const filteredCylinders = cylinders.filter(c => {
    const matchesSearch = c.cylinderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.vendor?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stockStats = {
    total: cylinders.length,
    full: cylinders.filter(c => c.status === 'full').length,
    inUse: cylinders.filter(c => c.status === 'in_use').length,
    empty: cylinders.filter(c => c.status === 'empty').length,
    forRefilling: cylinders.filter(c => c.status === 'for_refilling').length,
    forTesting: cylinders.filter(c => c.status === 'for_testing').length,
  };

  const latestLmoReading = lmoReadings[0];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cylinder className="h-6 w-6 text-primary" />
            Oxygen Tracker
          </h1>
          <p className="text-muted-foreground">NABH Compliant Oxygen Management System</p>
        </div>
        {activeAlerts.length > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Bell className="h-4 w-4" />
            {activeAlerts.length} Active Alert{activeAlerts.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cylinders</CardTitle>
            <Cylinder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Full</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stockStats.full}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Use</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stockStats.inUse}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empty/Refilling</CardTitle>
            <RefreshCw className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stockStats.empty + stockStats.forRefilling}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LMO Tank</CardTitle>
            <Droplets className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">
              {latestLmoReading ? `${latestLmoReading.levelPercentage}%` : 'N/A'}
            </div>
            {latestLmoReading && (
              <Progress value={parseFloat(latestLmoReading.levelPercentage || '0')} className="mt-2" />
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="stock" data-testid="tab-stock">Cylinder Stock</TabsTrigger>
          <TabsTrigger value="movements" data-testid="tab-movements">Issue/Return</TabsTrigger>
          <TabsTrigger value="consumption" data-testid="tab-consumption">Consumption</TabsTrigger>
          <TabsTrigger value="lmo" data-testid="tab-lmo">LMO Tank</TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">
            Alerts {activeAlerts.length > 0 && <Badge variant="destructive" className="ml-1">{activeAlerts.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cylinder Stock Register</CardTitle>
                  <CardDescription>Track all oxygen cylinders with QR codes</CardDescription>
                </div>
                <Dialog open={showAddCylinder} onOpenChange={setShowAddCylinder}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-cylinder">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Cylinder
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Cylinder</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      createCylinderMutation.mutate({
                        cylinderCode: formData.get('cylinderCode') as string,
                        cylinderType: formData.get('cylinderType') as string,
                        capacity: formData.get('capacity') as string,
                        filledPressure: formData.get('filledPressure') as string,
                        currentPressure: formData.get('filledPressure') as string,
                        status: 'full',
                        vendor: formData.get('vendor') as string,
                        purityCertificateDate: formData.get('purityCertificateDate') as string,
                        hydrostaticTestDate: formData.get('hydrostaticTestDate') as string,
                        location: 'Storage'
                      });
                    }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cylinderCode">Cylinder Code/QR</Label>
                          <Input id="cylinderCode" name="cylinderCode" placeholder="CYL-001" required />
                        </div>
                        <div>
                          <Label htmlFor="cylinderType">Type</Label>
                          <Select name="cylinderType" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {cylinderTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="capacity">Capacity (Liters)</Label>
                          <Input id="capacity" name="capacity" type="number" placeholder="47" required />
                        </div>
                        <div>
                          <Label htmlFor="filledPressure">Filled Pressure (PSI)</Label>
                          <Input id="filledPressure" name="filledPressure" type="number" placeholder="2200" required />
                        </div>
                        <div>
                          <Label htmlFor="vendor">Vendor</Label>
                          <Input id="vendor" name="vendor" placeholder="Vendor name" />
                        </div>
                        <div>
                          <Label htmlFor="purityCertificateDate">Purity Certificate Date</Label>
                          <Input id="purityCertificateDate" name="purityCertificateDate" type="date" />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="hydrostaticTestDate">Hydrostatic Test Date</Label>
                          <Input id="hydrostaticTestDate" name="hydrostaticTestDate" type="date" />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={createCylinderMutation.isPending}>
                        {createCylinderMutation.isPending ? "Adding..." : "Add Cylinder"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by code or vendor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-cylinders"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {cylinderStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {cylindersLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading cylinders...</div>
              ) : filteredCylinders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {cylinders.length === 0 ? "No cylinders registered yet. Add your first cylinder." : "No cylinders match your search."}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Pressure</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Vendor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCylinders.map((cylinder) => (
                      <TableRow key={cylinder.id} data-testid={`row-cylinder-${cylinder.id}`}>
                        <TableCell className="font-mono font-medium">
                          <div className="flex items-center gap-2">
                            <QrCode className="h-4 w-4 text-muted-foreground" />
                            {cylinder.cylinderCode}
                          </div>
                        </TableCell>
                        <TableCell>{cylinder.cylinderType}</TableCell>
                        <TableCell>{cylinder.capacity}L</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Gauge className="h-4 w-4 text-muted-foreground" />
                            {cylinder.currentPressure || cylinder.filledPressure} PSI
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(cylinder.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {cylinder.location || 'Storage'}
                          </div>
                        </TableCell>
                        <TableCell>{cylinder.vendor || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cylinder Movement Register</CardTitle>
                  <CardDescription>Issue and return log for oxygen cylinders</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={showIssueCylinder} onOpenChange={setShowIssueCylinder}>
                    <DialogTrigger asChild>
                      <Button variant="outline" data-testid="button-issue-cylinder">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Issue Cylinder
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Issue Cylinder to Department</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const cylinderId = formData.get('cylinderId') as string;
                        const cylinder = cylinders.find(c => c.id === cylinderId);
                        createMovementMutation.mutate({
                          cylinderId,
                          cylinderCode: cylinder?.cylinderCode || '',
                          movementType: 'ISSUE',
                          department: formData.get('department') as string,
                          startPressure: formData.get('startPressure') as string,
                          issuedBy: formData.get('issuedBy') as string,
                          receivedBy: formData.get('receivedBy') as string,
                        });
                      }} className="space-y-4">
                        <div>
                          <Label htmlFor="cylinderId">Select Cylinder</Label>
                          <Select name="cylinderId" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select full cylinder" />
                            </SelectTrigger>
                            <SelectContent>
                              {cylinders.filter(c => c.status === 'full').map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.cylinderCode} ({c.cylinderType})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="department">Department</Label>
                          <Select name="department" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map(dept => (
                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="startPressure">Start Pressure (PSI)</Label>
                          <Input id="startPressure" name="startPressure" type="number" placeholder="2200" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="issuedBy">Issued By</Label>
                            <Input id="issuedBy" name="issuedBy" placeholder="Staff name" required />
                          </div>
                          <div>
                            <Label htmlFor="receivedBy">Received By</Label>
                            <Input id="receivedBy" name="receivedBy" placeholder="Nurse name" required />
                          </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={createMovementMutation.isPending}>
                          {createMovementMutation.isPending ? "Processing..." : "Issue Cylinder"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showReturnCylinder} onOpenChange={setShowReturnCylinder}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-return-cylinder">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Return Cylinder
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Return Cylinder from Department</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const cylinderId = formData.get('cylinderId') as string;
                        const cylinder = cylinders.find(c => c.id === cylinderId);
                        createMovementMutation.mutate({
                          cylinderId,
                          cylinderCode: cylinder?.cylinderCode || '',
                          movementType: 'RETURN',
                          department: cylinder?.location || 'Unknown',
                          endPressure: formData.get('endPressure') as string,
                          acknowledgedBy: formData.get('acknowledgedBy') as string,
                        });
                      }} className="space-y-4">
                        <div>
                          <Label htmlFor="cylinderId">Select Cylinder</Label>
                          <Select name="cylinderId" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select in-use cylinder" />
                            </SelectTrigger>
                            <SelectContent>
                              {cylinders.filter(c => c.status === 'in_use').map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.cylinderCode} - {c.location}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="endPressure">Remaining Pressure (PSI)</Label>
                          <Input id="endPressure" name="endPressure" type="number" placeholder="50" required />
                        </div>
                        <div>
                          <Label htmlFor="acknowledgedBy">Acknowledged By</Label>
                          <Input id="acknowledgedBy" name="acknowledgedBy" placeholder="Staff name" required />
                        </div>
                        <Button type="submit" className="w-full" disabled={createMovementMutation.isPending}>
                          {createMovementMutation.isPending ? "Processing..." : "Return Cylinder"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No movements recorded yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Cylinder</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Pressure</TableHead>
                      <TableHead>Staff</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {new Date(movement.movementDate!).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{movement.cylinderCode}</TableCell>
                        <TableCell>
                          <Badge variant={movement.movementType === 'ISSUE' ? 'default' : 'secondary'}>
                            {movement.movementType === 'ISSUE' ? <ArrowRight className="h-3 w-3 mr-1" /> : <ArrowLeft className="h-3 w-3 mr-1" />}
                            {movement.movementType}
                          </Badge>
                        </TableCell>
                        <TableCell>{movement.department}</TableCell>
                        <TableCell>
                          {movement.movementType === 'ISSUE' 
                            ? `${movement.startPressure} PSI`
                            : `${movement.endPressure} PSI remaining`
                          }
                        </TableCell>
                        <TableCell>
                          {movement.movementType === 'ISSUE'
                            ? `${movement.issuedBy} → ${movement.receivedBy}`
                            : movement.acknowledgedBy
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consumption" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Patient-wise Oxygen Consumption</CardTitle>
                  <CardDescription>Track oxygen usage per patient with flow rate and duration</CardDescription>
                </div>
                <Dialog open={showAddConsumption} onOpenChange={setShowAddConsumption}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-consumption">
                      <Plus className="h-4 w-4 mr-2" />
                      Record Consumption
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Oxygen Consumption</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      createConsumptionMutation.mutate({
                        patientName: formData.get('patientName') as string,
                        department: formData.get('department') as string,
                        flowRate: formData.get('flowRate') as string,
                        startTime: new Date(),
                        recordedBy: formData.get('recordedBy') as string,
                        notes: formData.get('notes') as string,
                      });
                    }} className="space-y-4">
                      <div>
                        <Label htmlFor="patientName">Patient Name</Label>
                        <Input id="patientName" name="patientName" placeholder="Patient name" required />
                      </div>
                      <div>
                        <Label htmlFor="department">Department</Label>
                        <Select name="department" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="flowRate">Flow Rate (LPM)</Label>
                        <Input id="flowRate" name="flowRate" type="number" step="0.5" placeholder="2" required />
                      </div>
                      <div>
                        <Label htmlFor="recordedBy">Recorded By</Label>
                        <Input id="recordedBy" name="recordedBy" placeholder="Nurse name" required />
                      </div>
                      <div>
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Input id="notes" name="notes" placeholder="Additional notes" />
                      </div>
                      <Button type="submit" className="w-full" disabled={createConsumptionMutation.isPending}>
                        {createConsumptionMutation.isPending ? "Recording..." : "Start Recording"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {consumption.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No consumption records yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Flow Rate</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Recorded By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consumption.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {record.patientName}
                          </div>
                        </TableCell>
                        <TableCell>{record.department}</TableCell>
                        <TableCell>{record.flowRate} LPM</TableCell>
                        <TableCell>{new Date(record.startTime).toLocaleString()}</TableCell>
                        <TableCell>
                          {record.totalConsumption 
                            ? `${record.totalConsumption} L` 
                            : <Badge variant="outline">Active</Badge>
                          }
                        </TableCell>
                        <TableCell>{record.recordedBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lmo" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>LMO Tank Daily Dip Register</CardTitle>
                  <CardDescription>Daily liquid medical oxygen tank readings</CardDescription>
                </div>
                <Dialog open={showAddLmoReading} onOpenChange={setShowAddLmoReading}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-lmo-reading">
                      <Plus className="h-4 w-4 mr-2" />
                      Record Reading
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record LMO Tank Reading</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const now = new Date();
                      createLmoReadingMutation.mutate({
                        tankId: 'MAIN',
                        readingDate: now.toISOString().split('T')[0],
                        readingTime: now.toTimeString().split(' ')[0],
                        levelPercentage: formData.get('levelPercentage') as string,
                        volumeLiters: formData.get('volumeLiters') as string,
                        pressure: formData.get('pressure') as string,
                        temperature: formData.get('temperature') as string,
                        recordedBy: formData.get('recordedBy') as string,
                        notes: formData.get('notes') as string,
                      });
                    }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="levelPercentage">Level (%)</Label>
                          <Input id="levelPercentage" name="levelPercentage" type="number" min="0" max="100" placeholder="75" required />
                        </div>
                        <div>
                          <Label htmlFor="volumeLiters">Volume (Liters)</Label>
                          <Input id="volumeLiters" name="volumeLiters" type="number" placeholder="5000" />
                        </div>
                        <div>
                          <Label htmlFor="pressure">Pressure (PSI)</Label>
                          <Input id="pressure" name="pressure" type="number" placeholder="150" />
                        </div>
                        <div>
                          <Label htmlFor="temperature">Temperature (°C)</Label>
                          <Input id="temperature" name="temperature" type="number" placeholder="-183" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="recordedBy">Recorded By</Label>
                        <Input id="recordedBy" name="recordedBy" placeholder="Staff name" required />
                      </div>
                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Input id="notes" name="notes" placeholder="Any observations" />
                      </div>
                      <Button type="submit" className="w-full" disabled={createLmoReadingMutation.isPending}>
                        {createLmoReadingMutation.isPending ? "Recording..." : "Record Reading"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {latestLmoReading && (
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Droplets className="h-4 w-4" />
                        Level
                      </div>
                      <div className="text-2xl font-bold">{latestLmoReading.levelPercentage}%</div>
                      <Progress value={parseFloat(latestLmoReading.levelPercentage)} className="mt-2" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Activity className="h-4 w-4" />
                        Volume
                      </div>
                      <div className="text-2xl font-bold">{latestLmoReading.volumeLiters || '-'} L</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Gauge className="h-4 w-4" />
                        Pressure
                      </div>
                      <div className="text-2xl font-bold">{latestLmoReading.pressure || '-'} PSI</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Thermometer className="h-4 w-4" />
                        Temperature
                      </div>
                      <div className="text-2xl font-bold">{latestLmoReading.temperature || '-'}°C</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {lmoReadings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No LMO readings recorded yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Level %</TableHead>
                      <TableHead>Volume (L)</TableHead>
                      <TableHead>Pressure</TableHead>
                      <TableHead>Temp</TableHead>
                      <TableHead>Recorded By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lmoReadings.map((reading) => (
                      <TableRow key={reading.id}>
                        <TableCell>{reading.readingDate}</TableCell>
                        <TableCell>{reading.readingTime}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {reading.levelPercentage}%
                            <Progress value={parseFloat(reading.levelPercentage)} className="w-16" />
                          </div>
                        </TableCell>
                        <TableCell>{reading.volumeLiters || '-'}</TableCell>
                        <TableCell>{reading.pressure || '-'} PSI</TableCell>
                        <TableCell>{reading.temperature || '-'}°C</TableCell>
                        <TableCell>{reading.recordedBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Oxygen Alerts
              </CardTitle>
              <CardDescription>System alerts for low stock, testing due, and abnormal usage</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                  <p>No alerts. All systems operating normally.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <Card key={alert.id} className={alert.isResolved ? 'opacity-60' : ''}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {alert.severity === 'critical' ? (
                              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                            ) : alert.severity === 'warning' ? (
                              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                            ) : (
                              <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{alert.title}</h4>
                                <Badge variant={
                                  alert.severity === 'critical' ? 'destructive' : 
                                  alert.severity === 'warning' ? 'default' : 'secondary'
                                }>
                                  {alert.severity}
                                </Badge>
                                {alert.isResolved && <Badge variant="outline">Resolved</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(alert.createdAt!).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {!alert.isResolved && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => resolveAlertMutation.mutate(alert.id)}
                              disabled={resolveAlertMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                          )}
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
    </div>
  );
}