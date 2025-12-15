import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  CheckCircle,
  Check,
  Clock,
  Thermometer,
  Droplets,
  Calendar,
  BedDouble,
  ArrowRight,
  Undo2
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

interface CriticalAlert {
  type: string;
  severity: string;
  message: string;
  patientId?: string;
}

interface ResolvedAlertDB {
  id: string;
  alertType: string;
  alertSeverity: string;
  alertMessage: string;
  patientId?: string | null;
  resolvedBy?: string | null;
  resolvedAt: string;
}

interface InpatientAnalyticsData {
  patientAnalysis: PatientAnalysis[];
  nurseWorkload: NurseWorkload[];
  inventoryUsage: InventoryUsage[];
  criticalAlerts: CriticalAlert[];
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
      case 'danger': return 'border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-rose-500/5';
      case 'warning': return 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-500/5';
      case 'success': return 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5';
      default: return 'bg-gradient-to-br from-primary/5 to-transparent';
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
    <Card className={`${getVariantStyles()} transition-all duration-200`} data-testid={`card-summary-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-full ${variant === 'danger' ? 'bg-rose-500/10' : variant === 'warning' ? 'bg-amber-500/10' : variant === 'success' ? 'bg-emerald-500/10' : 'bg-primary/10'}`}>
          <Icon className={`h-4 w-4 ${getIconStyles()}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
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

function getHealthScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-rose-500';
}

function getHealthScoreBg(score: number) {
  if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/30';
  if (score >= 60) return 'bg-amber-500/10 border-amber-500/30';
  return 'bg-rose-500/10 border-rose-500/30';
}

function PatientCard({ patient }: { patient: PatientAnalysis }) {
  return (
    <Card className="hover-elevate transition-all duration-200" data-testid={`card-patient-${patient.patientId}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getHealthScoreBg(patient.healthScore)}`}>
              <span className={`text-lg font-bold ${getHealthScoreColor(patient.healthScore)}`}>{patient.healthScore}</span>
            </div>
            <div>
              <h3 className="font-semibold text-base">{patient.patientName}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BedDouble className="h-3 w-3" />
                <span>Room {patient.roomNumber || 'N/A'}</span>
              </div>
            </div>
          </div>
          <VitalsTrendBadge trend={patient.vitalsTrend} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Day</span>
            <span className="font-medium ml-auto">{patient.daysAdmitted}</span>
          </div>
          {patient.lastVitals && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <Heart className="h-4 w-4 text-rose-400" />
                <span className="text-muted-foreground">BP</span>
                <span className="font-medium ml-auto">{patient.lastVitals.bp}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Droplets className="h-4 w-4 text-blue-400" />
                <span className="text-muted-foreground">SpO2</span>
                <span className="font-medium ml-auto">{patient.lastVitals.spO2}%</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Thermometer className="h-4 w-4 text-amber-400" />
                <span className="text-muted-foreground">Temp</span>
                <span className="font-medium ml-auto">{patient.lastVitals.temperature}°F</span>
              </div>
            </>
          )}
        </div>

        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Utensils className="h-3 w-3" /> Meal Compliance
              </span>
              <span className={`font-medium ${patient.mealCompliance < 50 ? 'text-rose-500' : ''}`}>{patient.mealCompliance}%</span>
            </div>
            <Progress value={patient.mealCompliance} className="h-1.5" />
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Pill className="h-3 w-3" /> Medication Adherence
              </span>
              <span className="font-medium">{patient.medicationAdherence}%</span>
            </div>
            <Progress value={patient.medicationAdherence} className="h-1.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertCard({ 
  alert, 
  index, 
  onResolve, 
  isResolved = false,
  onUnresolve,
  resolvedAt
}: { 
  alert: CriticalAlert | { type: string; severity: string; message: string }; 
  index: number; 
  onResolve?: () => void;
  isResolved?: boolean;
  onUnresolve?: () => void;
  resolvedAt?: string;
}) {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'border-rose-500/50 bg-gradient-to-r from-rose-500/10 to-transparent';
      case 'high': return 'border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-transparent';
      case 'medium': return 'border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 to-transparent';
      default: return 'border-blue-500/50 bg-gradient-to-r from-blue-500/10 to-transparent';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-rose-500" />;
      case 'high': return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default: return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <Card 
      className={`${isResolved ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-75' : getSeverityColor(alert.severity)} transition-all duration-200`}
      data-testid={`card-alert-${index}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {isResolved ? (
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            ) : (
              getSeverityIcon(alert.severity)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={isResolved ? "secondary" : "outline"} className="text-xs">
                {alert.type}
              </Badge>
              {!isResolved && (
                <Badge 
                  variant={alert.severity.toLowerCase() === 'critical' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {alert.severity}
                </Badge>
              )}
            </div>
            <p className={`text-sm ${isResolved ? 'line-through text-muted-foreground' : ''}`}>
              {alert.message}
            </p>
            {isResolved && resolvedAt && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Resolved: {new Date(resolvedAt).toLocaleString()}
              </p>
            )}
          </div>
          <div className="shrink-0">
            {isResolved ? (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={onUnresolve}
                className="h-8 text-xs"
                data-testid={`button-unresolve-${index}`}
              >
                <Undo2 className="h-3 w-3 mr-1" />
                Undo
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                onClick={onResolve}
                className="h-8 text-xs border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10"
                data-testid={`button-resolve-${index}`}
              >
                <Check className="h-3 w-3 mr-1" />
                Resolve
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type InsightType = 'patients' | 'nurses' | 'inventory' | null;

function parseInsightType(insight: string): InsightType {
  const lowerInsight = insight.toLowerCase();
  if (lowerInsight.includes('patient') && (lowerInsight.includes('attention') || lowerInsight.includes('critical'))) {
    return 'patients';
  }
  if (lowerInsight.includes('nurse') && lowerInsight.includes('overload')) {
    return 'nurses';
  }
  if (lowerInsight.includes('inventory') || lowerInsight.includes('restock') || lowerInsight.includes('stock')) {
    return 'inventory';
  }
  return null;
}

function InsightDetailDialog({
  open,
  onOpenChange,
  insightType,
  insightText,
  patientAnalysis,
  nurseWorkload,
  inventoryUsage
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insightType: InsightType;
  insightText: string;
  patientAnalysis: PatientAnalysis[];
  nurseWorkload: NurseWorkload[];
  inventoryUsage: InventoryUsage[];
}) {
  const getCriticalPatients = () => patientAnalysis.filter(p => p.vitalsTrend === 'CRITICAL' || p.healthScore < 60);
  const getOverloadedNurses = () => nurseWorkload.filter(n => n.workloadLevel === 'OVERLOADED');
  const getLowStockItems = () => inventoryUsage.filter(i => ['LOW', 'CRITICAL', 'OUT_OF_STOCK'].includes(i.stockStatus));

  const getDialogTitle = () => {
    switch (insightType) {
      case 'patients': return 'Critical Patients';
      case 'nurses': return 'Overloaded Nurses';
      case 'inventory': return 'Low Stock Inventory';
      default: return 'Details';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden" data-testid="dialog-insight-detail">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {insightType === 'patients' && <AlertTriangle className="h-5 w-5 text-rose-500" />}
            {insightType === 'nurses' && <User className="h-5 w-5 text-amber-500" />}
            {insightType === 'inventory' && <Package className="h-5 w-5 text-blue-500" />}
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>{insightText}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {insightType === 'patients' && (
            <div className="space-y-3">
              {getCriticalPatients().length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No critical patients currently</p>
              ) : (
                getCriticalPatients().map((patient) => (
                  <Card key={patient.patientId} className="p-3" data-testid={`dialog-patient-${patient.patientId}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-semibold">{patient.patientName}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <BedDouble className="h-3 w-3" /> Room {patient.roomNumber || 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthScoreBg(patient.healthScore)}`}>
                          Score: {patient.healthScore}
                        </div>
                        <VitalsTrendBadge trend={patient.vitalsTrend} />
                      </div>
                    </div>
                    {patient.lastVitals && (
                      <div className="grid grid-cols-4 gap-2 text-xs mt-2">
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-rose-400" />
                          <span>BP: {patient.lastVitals.bp}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-blue-400" />
                          <span>Pulse: {patient.lastVitals.pulse}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Droplets className="h-3 w-3 text-cyan-400" />
                          <span>SpO2: {patient.lastVitals.spO2}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Thermometer className="h-3 w-3 text-amber-400" />
                          <span>Temp: {patient.lastVitals.temperature}°F</span>
                        </div>
                      </div>
                    )}
                    {patient.criticalAlerts.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-rose-500 font-medium">Alerts:</p>
                        <ul className="text-xs text-muted-foreground">
                          {patient.criticalAlerts.map((alert, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-rose-400" /> {alert}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          )}

          {insightType === 'nurses' && (
            <div className="space-y-3">
              {getOverloadedNurses().length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No overloaded nurses currently</p>
              ) : (
                getOverloadedNurses().map((nurse) => (
                  <Card key={nurse.nurseId} className="p-3" data-testid={`dialog-nurse-${nurse.nurseId}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-amber-500" />
                        </div>
                        <h4 className="font-semibold">{nurse.nurseName}</h4>
                      </div>
                      <WorkloadBadge level={nurse.workloadLevel} />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Patients</p>
                        <p className="font-medium">{nurse.patientsAssigned}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Activities</p>
                        <p className="font-medium">{nurse.activitiesCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Efficiency</p>
                        <p className="font-medium">{nurse.efficiencyScore}%</p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {insightType === 'inventory' && (
            <div className="space-y-3">
              {getLowStockItems().length === 0 ? (
                <p className="text-center text-muted-foreground py-4">All inventory items are adequately stocked</p>
              ) : (
                getLowStockItems().map((item) => (
                  <Card key={item.itemId} className="p-3" data-testid={`dialog-inventory-${item.itemId}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{item.itemName}</h4>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                      <StockStatusBadge status={item.stockStatus} />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Issued</p>
                        <p className="font-medium">{item.totalIssued || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Wasted</p>
                        <p className="font-medium text-rose-500">{item.totalWasted || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Cost Impact</p>
                        <p className="font-medium">₹{(item.estimatedCost || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function InpatientAnalytics() {
  const [alertsTab, setAlertsTab] = useState<'active' | 'resolved'>('active');
  const [selectedInsight, setSelectedInsight] = useState<{ type: InsightType; text: string } | null>(null);
  const [patientFilter, setPatientFilter] = useState<'ALL' | 'CRITICAL' | 'DECLINING' | 'STABLE' | 'IMPROVING'>('ALL');

  const { data, isLoading, refetch, isRefetching } = useQuery<InpatientAnalyticsData>({
    queryKey: ["/api/ai/inpatient-analytics"],
    refetchInterval: 60000,
  });

  const { data: resolvedAlerts = [] } = useQuery<ResolvedAlertDB[]>({
    queryKey: ["/api/resolved-alerts"],
    refetchInterval: 5000,
    staleTime: 0,
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (alert: CriticalAlert) => {
      return apiRequest("POST", "/api/resolved-alerts", {
        alertType: alert.type,
        alertSeverity: alert.severity,
        alertMessage: alert.message,
        patientId: alert.patientId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resolved-alerts"] });
    },
  });

  const unresolveAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/resolved-alerts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resolved-alerts"] });
    },
  });

  const handleResolveAlert = (alert: CriticalAlert) => {
    resolveAlertMutation.mutate(alert);
  };

  const handleUnresolveAlert = (id: string) => {
    unresolveAlertMutation.mutate(id);
  };

  const getActiveAlerts = () => {
    if (!data) return [];
    const resolvedMessages = new Set(resolvedAlerts.map(a => a.alertMessage));
    return data.criticalAlerts.filter(alert => {
      const message = typeof alert === 'string' ? alert : alert.message;
      return !resolvedMessages.has(message);
    });
  };

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

  const { summary, patientAnalysis, nurseWorkload, inventoryUsage, keyInsights } = data;
  const activeAlerts = getActiveAlerts();

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              Patient Analytics
            </h1>
            <p className="text-muted-foreground text-sm md:text-base mt-1">Real-time insights for admitted patients, nurse workload, and inventory usage</p>
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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

        {(activeAlerts.length > 0 || resolvedAlerts.length > 0) && (
          <Card data-testid="card-alerts-section">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                  Alerts Management
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={alertsTab === 'active' ? 'default' : 'outline'}
                    onClick={() => setAlertsTab('active')}
                    className="text-xs"
                    data-testid="button-active-alerts"
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Active ({activeAlerts.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={alertsTab === 'resolved' ? 'default' : 'outline'}
                    onClick={() => setAlertsTab('resolved')}
                    className="text-xs"
                    data-testid="button-resolved-alerts"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Resolved ({resolvedAlerts.length})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {alertsTab === 'active' ? (
                activeAlerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-emerald-500 opacity-50" />
                    <p>All alerts have been resolved</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {activeAlerts.map((alert, idx) => (
                      <AlertCard 
                        key={idx} 
                        alert={typeof alert === 'string' ? { type: 'Alert', severity: 'medium', message: alert } : alert}
                        index={idx}
                        onResolve={() => handleResolveAlert(
                          typeof alert === 'string' ? { type: 'Alert', severity: 'medium', message: alert } : alert
                        )}
                      />
                    ))}
                  </div>
                )
              ) : (
                resolvedAlerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No resolved alerts yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {resolvedAlerts.map((alert, idx) => (
                      <AlertCard 
                        key={alert.id} 
                        alert={{ type: alert.alertType, severity: alert.alertSeverity, message: alert.alertMessage }}
                        index={idx}
                        isResolved
                        resolvedAt={alert.resolvedAt}
                        onUnresolve={() => handleUnresolveAlert(alert.id)}
                      />
                    ))}
                  </div>
                )
              )}
            </CardContent>
          </Card>
        )}

        {keyInsights.length > 0 && (
          <Card data-testid="card-key-insights">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-1.5 rounded-lg bg-amber-500/10">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                </div>
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {keyInsights.map((insight, idx) => {
                  const insightType = parseInsightType(insight);
                  const isClickable = insightType !== null;
                  return (
                    <li key={idx}>
                      <button
                        onClick={() => isClickable && setSelectedInsight({ type: insightType, text: insight })}
                        className={`w-full flex items-start gap-2 text-sm p-2 rounded-lg bg-muted/30 text-left transition-all ${isClickable ? 'cursor-pointer hover-elevate' : 'cursor-default'}`}
                        data-testid={`button-insight-${idx}`}
                        disabled={!isClickable}
                      >
                        <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{insight}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="patients" className="space-y-4">
          <TabsList className="w-full sm:w-auto flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="patients" data-testid="tab-patients" className="flex-1 sm:flex-none">
              <Heart className="h-4 w-4 mr-2" /> Patients
            </TabsTrigger>
            <TabsTrigger value="nurses" data-testid="tab-nurses" className="flex-1 sm:flex-none">
              <User className="h-4 w-4 mr-2" /> Nurses
            </TabsTrigger>
            <TabsTrigger value="inventory" data-testid="tab-inventory" className="flex-1 sm:flex-none">
              <Package className="h-4 w-4 mr-2" /> Inventory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patients" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Patient Health Analysis</h2>
                <p className="text-sm text-muted-foreground">Click a category to filter patients</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {patientAnalysis.length} patients
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <button
                onClick={() => setPatientFilter('ALL')}
                className={`p-3 rounded-lg border transition-all text-left ${patientFilter === 'ALL' ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover-elevate'}`}
                data-testid="filter-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">All</span>
                </div>
                <span className="text-2xl font-bold">{patientAnalysis.length}</span>
              </button>
              
              <button
                onClick={() => setPatientFilter('CRITICAL')}
                className={`p-3 rounded-lg border transition-all text-left ${patientFilter === 'CRITICAL' ? 'ring-2 ring-rose-500 border-rose-500 bg-rose-500/10' : 'border-rose-500/30 bg-rose-500/5 hover-elevate'}`}
                data-testid="filter-critical"
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                  <span className="text-sm font-medium text-rose-500">Critical</span>
                </div>
                <span className="text-2xl font-bold text-rose-500">{patientAnalysis.filter(p => p.vitalsTrend === 'CRITICAL').length}</span>
              </button>
              
              <button
                onClick={() => setPatientFilter('DECLINING')}
                className={`p-3 rounded-lg border transition-all text-left ${patientFilter === 'DECLINING' ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-500/10' : 'border-amber-500/30 bg-amber-500/5 hover-elevate'}`}
                data-testid="filter-declining"
              >
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-500">Declining</span>
                </div>
                <span className="text-2xl font-bold text-amber-500">{patientAnalysis.filter(p => p.vitalsTrend === 'DECLINING').length}</span>
              </button>
              
              <button
                onClick={() => setPatientFilter('STABLE')}
                className={`p-3 rounded-lg border transition-all text-left ${patientFilter === 'STABLE' ? 'ring-2 ring-muted-foreground border-muted-foreground bg-muted/20' : 'hover-elevate'}`}
                data-testid="filter-stable"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Minus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Stable</span>
                </div>
                <span className="text-2xl font-bold">{patientAnalysis.filter(p => p.vitalsTrend === 'STABLE').length}</span>
              </button>
              
              <button
                onClick={() => setPatientFilter('IMPROVING')}
                className={`p-3 rounded-lg border transition-all text-left ${patientFilter === 'IMPROVING' ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/10' : 'border-emerald-500/30 bg-emerald-500/5 hover-elevate'}`}
                data-testid="filter-improving"
              >
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-500">Improving</span>
                </div>
                <span className="text-2xl font-bold text-emerald-500">{patientAnalysis.filter(p => p.vitalsTrend === 'IMPROVING').length}</span>
              </button>
            </div>

            {patientAnalysis.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No admitted patients found</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {patientFilter !== 'ALL' && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Showing: {patientFilter.charAt(0) + patientFilter.slice(1).toLowerCase()} patients
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setPatientFilter('ALL')}
                      className="h-6 text-xs"
                      data-testid="button-clear-filter"
                    >
                      Clear filter
                    </Button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {patientAnalysis
                    .filter(p => patientFilter === 'ALL' || p.vitalsTrend === patientFilter)
                    .map((patient) => (
                      <PatientCard key={patient.patientId} patient={patient} />
                    ))
                  }
                  {patientAnalysis.filter(p => patientFilter === 'ALL' || p.vitalsTrend === patientFilter).length === 0 && (
                    <Card className="col-span-full">
                      <CardContent className="py-8">
                        <div className="text-center text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No {patientFilter.toLowerCase()} patients found</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="nurses" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Nurse Workload Distribution</h2>
                <p className="text-sm text-muted-foreground">Patient assignments and activity levels</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {nurseWorkload.length} nurses
              </Badge>
            </div>
            {nurseWorkload.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No nurse data available</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nurseWorkload.map((nurse) => (
                  <Card key={nurse.nurseId} className="hover-elevate transition-all duration-200" data-testid={`card-nurse-${nurse.nurseId}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="font-semibold">{nurse.nurseName}</h3>
                        </div>
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
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-muted-foreground">Efficiency</span>
                            <span className="font-medium">{nurse.efficiencyScore}%</span>
                          </div>
                          <Progress value={nurse.efficiencyScore} className="h-1.5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Inventory Usage & Wastage</h2>
                <p className="text-sm text-muted-foreground">Track consumption and identify wastage patterns</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {inventoryUsage.length} items
              </Badge>
            </div>
            {inventoryUsage.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No inventory transaction data</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left py-3 px-4 font-medium">Item</th>
                          <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">Category</th>
                          <th className="text-right py-3 px-4 font-medium">Issued</th>
                          <th className="text-right py-3 px-4 font-medium">Wasted</th>
                          <th className="text-right py-3 px-4 font-medium hidden md:table-cell">Wastage Rate</th>
                          <th className="text-right py-3 px-4 font-medium hidden lg:table-cell">Cost</th>
                          <th className="text-left py-3 px-4 font-medium">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryUsage.map((item) => (
                          <tr 
                            key={item.itemId} 
                            className={`border-b hover:bg-muted/30 transition-colors ${(item.wastageRate || 0) > 20 ? 'bg-rose-500/5' : ''}`}
                            data-testid={`row-inventory-${item.itemId}`}
                          >
                            <td className="py-3 px-4 font-medium">{item.itemName}</td>
                            <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{item.category}</td>
                            <td className="py-3 px-4 text-right">{item.totalIssued}</td>
                            <td className="py-3 px-4 text-right">
                              <span className={item.totalWasted > 0 ? 'text-rose-500' : ''}>
                                {item.totalWasted}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right hidden md:table-cell">
                              <span className={(item.wastageRate || 0) > 20 ? 'text-rose-500 font-medium' : ''}>
                                {(item.wastageRate || 0).toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right hidden lg:table-cell">₹{(item.estimatedCost || 0).toFixed(2)}</td>
                            <td className="py-3 px-4">
                              <StockStatusBadge status={item.stockStatus} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <InsightDetailDialog
          open={selectedInsight !== null}
          onOpenChange={(open) => !open && setSelectedInsight(null)}
          insightType={selectedInsight?.type || null}
          insightText={selectedInsight?.text || ''}
          patientAnalysis={patientAnalysis}
          nurseWorkload={nurseWorkload}
          inventoryUsage={inventoryUsage}
        />
      </div>
    </ScrollArea>
  );
}
