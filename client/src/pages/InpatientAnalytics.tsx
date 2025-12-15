import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  AlertTriangle,
  Heart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Lightbulb,
  User,
  Pill,
  Utensils,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface PatientAnalysis {
  patientId: string;
  patientName: string;
  roomNumber: string;
  admissionDate: string;
  daysAdmitted: number;
  vitalsTrend: 'STABLE' | 'IMPROVING' | 'DECLINING' | 'CRITICAL';
  lastVitals: {
    bp: string;
    pulse: number;
    temperature: number;
    spO2: number;
    recordedAt: string;
  } | null;
  mealCompliance: number;
  medicationAdherence: number;
  healthScore: number;
  criticalAlerts: string[];
}

interface NurseWorkload {
  nurseId: string;
  nurseName: string;
  patientsAssigned: number;
  activitiesCount: number;
  efficiencyScore: number;
  workloadLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'OVERLOADED';
}

interface InventoryUsage {
  itemId: string;
  itemName: string;
  category: string;
  totalIssued: number;
  totalWasted: number;
  wastageRate: number;
  estimatedCost: number;
  stockStatus: 'ADEQUATE' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';
}

interface InpatientAnalyticsData {
  patientAnalysis: PatientAnalysis[];
  nurseWorkload: NurseWorkload[];
  inventoryUsage: InventoryUsage[];
  criticalAlerts: string[];
  keyInsights: string[];
  summary: {
    totalAdmitted: number;
    criticalPatients: number;
    avgMealCompliance: number;
    avgMedicationAdherence: number;
    totalWastage: number;
    wasteCostTotal: number;
  };
}

function SummaryCard({ title, value, subtitle, icon: Icon, variant }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  variant?: 'default' | 'warning' | 'success' | 'danger';
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger': return 'border-rose-500/30 bg-rose-500/5';
      case 'warning': return 'border-amber-500/30 bg-amber-500/5';
      case 'success': return 'border-emerald-500/30 bg-emerald-500/5';
      default: return '';
    }
  };

  const getIconStyles = () => {
    switch (variant) {
      case 'danger': return 'text-rose-500';
      case 'warning': return 'text-amber-500';
      case 'success': return 'text-emerald-500';
      default: return 'text-primary';
    }
  };

  return (
    <Card className={getVariantStyles()} data-testid={`card-summary-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${getIconStyles()}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function VitalsTrendBadge({ trend }: { trend: string }) {
  switch (trend) {
    case 'STABLE':
      return <Badge variant="secondary" className="gap-1"><Minus className="h-3 w-3" /> Stable</Badge>;
    case 'IMPROVING':
      return <Badge className="gap-1 bg-emerald-500"><TrendingUp className="h-3 w-3" /> Improving</Badge>;
    case 'DECLINING':
      return <Badge variant="outline" className="gap-1 text-amber-600 border-amber-600"><TrendingDown className="h-3 w-3" /> Declining</Badge>;
    case 'CRITICAL':
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Critical</Badge>;
    default:
      return <Badge variant="secondary">{trend}</Badge>;
  }
}

function WorkloadBadge({ level }: { level: string }) {
  switch (level) {
    case 'LOW':
      return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">Low</Badge>;
    case 'MODERATE':
      return <Badge variant="secondary">Moderate</Badge>;
    case 'HIGH':
      return <Badge variant="outline" className="text-amber-600 border-amber-600">High</Badge>;
    case 'OVERLOADED':
      return <Badge variant="destructive">Overloaded</Badge>;
    default:
      return <Badge variant="secondary">{level}</Badge>;
  }
}

function StockStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'ADEQUATE':
      return <Badge className="bg-emerald-500">Adequate</Badge>;
    case 'LOW':
      return <Badge variant="outline" className="text-amber-600 border-amber-600">Low</Badge>;
    case 'CRITICAL':
      return <Badge variant="destructive">Critical</Badge>;
    case 'OUT_OF_STOCK':
      return <Badge variant="destructive" className="bg-rose-700">Out of Stock</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function InpatientAnalytics() {
  const { data, isLoading, refetch, isRefetching } = useQuery<InpatientAnalyticsData>({
    queryKey: ["/api/ai/inpatient-analytics"],
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Unable to load analytics</h2>
        <p className="text-muted-foreground mb-4">Please try refreshing the page.</p>
        <Button onClick={() => refetch()} data-testid="button-retry">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  const { summary, patientAnalysis, nurseWorkload, inventoryUsage, criticalAlerts, keyInsights } = data;

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <Activity className="h-6 w-6 text-primary" />
              Patient Analytics
            </h1>
            <p className="text-muted-foreground">Real-time insights for admitted patients, nurse workload, and inventory usage</p>
          </div>
          <Button 
            onClick={() => refetch()} 
            disabled={isRefetching}
            variant="outline"
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Admitted"
            value={summary.totalAdmitted}
            subtitle="Current inpatients"
            icon={Users}
          />
          <SummaryCard
            title="Critical Patients"
            value={summary.criticalPatients}
            subtitle="Require immediate attention"
            icon={AlertTriangle}
            variant={summary.criticalPatients > 0 ? 'danger' : 'success'}
          />
          <SummaryCard
            title="Meal Compliance"
            value={`${summary.avgMealCompliance}%`}
            subtitle="Average consumption"
            icon={Utensils}
            variant={summary.avgMealCompliance < 70 ? 'warning' : 'success'}
          />
          <SummaryCard
            title="Wastage Cost"
            value={`₹${summary.wasteCostTotal.toLocaleString()}`}
            subtitle={`${summary.totalWastage} items wasted`}
            icon={Package}
            variant={summary.wasteCostTotal > 500 ? 'warning' : 'default'}
          />
        </div>

        {criticalAlerts.length > 0 && (
          <Card className="border-rose-500/50 bg-rose-500/5" data-testid="card-critical-alerts">
            <CardHeader className="pb-2">
              <CardTitle className="text-rose-600 dark:text-rose-400 flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5" />
                Critical Alerts ({criticalAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {criticalAlerts.map((alert, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm" data-testid={`text-alert-${idx}`}>
                    <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {keyInsights.length > 0 && (
          <Card data-testid="card-key-insights">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {keyInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm" data-testid={`text-insight-${idx}`}>
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="patients" className="space-y-4">
          <TabsList>
            <TabsTrigger value="patients" data-testid="tab-patients">
              <Heart className="h-4 w-4 mr-2" /> Patient Health
            </TabsTrigger>
            <TabsTrigger value="nurses" data-testid="tab-nurses">
              <User className="h-4 w-4 mr-2" /> Nurse Workload
            </TabsTrigger>
            <TabsTrigger value="inventory" data-testid="tab-inventory">
              <Package className="h-4 w-4 mr-2" /> Inventory Usage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Patient Health Analysis</CardTitle>
                <CardDescription>Vitals trends, meal compliance, and medication adherence for admitted patients</CardDescription>
              </CardHeader>
              <CardContent>
                {patientAnalysis.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No admitted patients found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-medium">Patient</th>
                          <th className="text-left py-3 px-2 font-medium">Room</th>
                          <th className="text-left py-3 px-2 font-medium">Days</th>
                          <th className="text-left py-3 px-2 font-medium">Vitals Trend</th>
                          <th className="text-left py-3 px-2 font-medium">Last Vitals</th>
                          <th className="text-left py-3 px-2 font-medium">Meal</th>
                          <th className="text-left py-3 px-2 font-medium">Meds</th>
                          <th className="text-left py-3 px-2 font-medium">Health</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientAnalysis.map((patient) => (
                          <tr key={patient.patientId} className="border-b hover:bg-muted/50" data-testid={`row-patient-${patient.patientId}`}>
                            <td className="py-3 px-2 font-medium">{patient.patientName}</td>
                            <td className="py-3 px-2">{patient.roomNumber || 'N/A'}</td>
                            <td className="py-3 px-2">{patient.daysAdmitted}</td>
                            <td className="py-3 px-2">
                              <VitalsTrendBadge trend={patient.vitalsTrend} />
                            </td>
                            <td className="py-3 px-2 text-xs">
                              {patient.lastVitals ? (
                                <div className="space-y-0.5">
                                  <div>BP: {patient.lastVitals.bp}</div>
                                  <div>SpO2: {patient.lastVitals.spO2}%</div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No data</span>
                              )}
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <Progress value={patient.mealCompliance} className="w-16 h-2" />
                                <span className={patient.mealCompliance < 50 ? 'text-rose-500' : ''}>{patient.mealCompliance}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <Progress value={patient.medicationAdherence} className="w-16 h-2" />
                                <span>{patient.medicationAdherence}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <Badge variant={patient.healthScore >= 70 ? 'secondary' : 'destructive'}>
                                {patient.healthScore}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nurses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Nurse Workload Distribution</CardTitle>
                <CardDescription>Patient assignments and activity levels for nursing staff</CardDescription>
              </CardHeader>
              <CardContent>
                {nurseWorkload.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No nurse data available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {nurseWorkload.map((nurse) => (
                      <Card key={nurse.nurseId} className="hover-elevate" data-testid={`card-nurse-${nurse.nurseId}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">{nurse.nurseName}</h3>
                            <WorkloadBadge level={nurse.workloadLevel} />
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Patients Assigned</span>
                              <span className="font-medium">{nurse.patientsAssigned}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Activities</span>
                              <span className="font-medium">{nurse.activitiesCount}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Efficiency</span>
                              <div className="flex items-center gap-2">
                                <Progress value={nurse.efficiencyScore} className="w-16 h-2" />
                                <span className="font-medium">{nurse.efficiencyScore}%</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Usage & Wastage</CardTitle>
                <CardDescription>Track inventory consumption and identify wastage patterns</CardDescription>
              </CardHeader>
              <CardContent>
                {inventoryUsage.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No inventory transaction data</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-medium">Item</th>
                          <th className="text-left py-3 px-2 font-medium">Category</th>
                          <th className="text-right py-3 px-2 font-medium">Issued</th>
                          <th className="text-right py-3 px-2 font-medium">Wasted</th>
                          <th className="text-right py-3 px-2 font-medium">Wastage Rate</th>
                          <th className="text-right py-3 px-2 font-medium">Cost</th>
                          <th className="text-left py-3 px-2 font-medium">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryUsage.map((item) => (
                          <tr 
                            key={item.itemId} 
                            className={`border-b hover:bg-muted/50 ${(item.wastageRate || 0) > 20 ? 'bg-rose-500/5' : ''}`}
                            data-testid={`row-inventory-${item.itemId}`}
                          >
                            <td className="py-3 px-2 font-medium">{item.itemName}</td>
                            <td className="py-3 px-2 text-muted-foreground">{item.category}</td>
                            <td className="py-3 px-2 text-right">{item.totalIssued}</td>
                            <td className="py-3 px-2 text-right">
                              <span className={item.totalWasted > 0 ? 'text-rose-500' : ''}>
                                {item.totalWasted}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <span className={(item.wastageRate || 0) > 20 ? 'text-rose-500 font-medium' : ''}>
                                {(item.wastageRate || 0).toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right">₹{(item.estimatedCost || 0).toFixed(2)}</td>
                            <td className="py-3 px-2">
                              <StockStatusBadge status={item.stockStatus} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
