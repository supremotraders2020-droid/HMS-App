import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Brain,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Stethoscope,
  Heart,
  Building2,
  LineChart,
  BarChart3,
  PieChart,
  RefreshCw,
  Lightbulb,
  Target,
  Zap
} from "lucide-react";

interface DoctorEfficiencyMetrics {
  doctorId: string;
  doctorName: string;
  overallScore: number;
  onTimeRate: number;
  avgConsultationTime: number;
  prescriptionQuality: number;
  followUpRate: number;
  workloadBalance: number;
  totalAppointments: number;
  completedAppointments: number;
}

interface NurseEfficiencyMetrics {
  nurseId: string;
  nurseName: string;
  overallScore: number;
  vitalsComplianceRate: number;
  medicationComplianceRate: number;
  alertResponseTime: number;
  documentationAccuracy: number;
  patientsAssigned: number;
  vitalsRecorded: number;
  medicationsAdministered: number;
}

interface OPDMetrics {
  overallScore: number;
  slotUtilization: number;
  avgWaitTime: number;
  noShowRate: number;
  throughputRate: number;
  totalSlots: number;
  bookedSlots: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  peakHours: string[];
  departmentBreakdown: { department: string; count: number }[];
}

interface HospitalHealthMetrics {
  date: string;
  overallScore: number;
  doctorEfficiencyScore: number;
  nurseEfficiencyScore: number;
  opdScore: number;
  complianceScore: number;
  resourceUtilization: number;
  patientSatisfaction: number;
  costEfficiency: number;
  workflowDelayIndex: number;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  insights: string[];
  anomalies: { type: string; severity: string; message: string }[];
  recommendations: { priority: string; title: string; description: string }[];
}

interface PredictionResult {
  predictionType: string;
  predictedValue: number;
  confidenceLevel: number;
  lowerBound: number;
  upperBound: number;
  predictionDate: string;
  insights: string;
}

interface AIDashboardData {
  doctorEfficiency: DoctorEfficiencyMetrics[];
  nurseEfficiency: NurseEfficiencyMetrics[];
  opdIntelligence: OPDMetrics;
  hospitalHealth: HospitalHealthMetrics;
  predictions: PredictionResult[];
}

function ScoreCard({ title, score, icon: Icon, trend, description, gradient }: {
  title: string;
  score: number;
  icon: any;
  trend?: 'up' | 'down' | 'stable';
  description?: string;
  gradient?: string;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  const getGradient = (score: number) => {
    if (gradient) return gradient;
    if (score >= 80) return "from-emerald-500/20 via-teal-500/10 to-cyan-500/5 dark:from-emerald-500/30 dark:via-teal-500/20 dark:to-cyan-500/10";
    if (score >= 60) return "from-amber-500/20 via-orange-500/10 to-yellow-500/5 dark:from-amber-500/30 dark:via-orange-500/20 dark:to-yellow-500/10";
    return "from-rose-500/20 via-red-500/10 to-pink-500/5 dark:from-rose-500/30 dark:via-red-500/20 dark:to-pink-500/10";
  };

  const getIconBg = (score: number) => {
    if (score >= 80) return "from-emerald-500 to-teal-600";
    if (score >= 60) return "from-amber-500 to-orange-600";
    return "from-rose-500 to-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "[&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-teal-500";
    if (score >= 60) return "[&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500";
    return "[&>div]:bg-gradient-to-r [&>div]:from-rose-500 [&>div]:to-red-500";
  };

  return (
    <Card 
      className={`hover-elevate overflow-hidden relative bg-gradient-to-br ${getGradient(score)} border-0 shadow-lg hover:shadow-xl transition-all duration-300`}
      data-testid={`score-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm" />
      <CardContent className="p-5 relative">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${getIconBg(score)} shadow-lg`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
              trend === 'up' ? 'bg-emerald-100 dark:bg-emerald-900/50' :
              trend === 'down' ? 'bg-rose-100 dark:bg-rose-900/50' :
              'bg-slate-100 dark:bg-slate-800'
            }`}>
              {trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
              {trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />}
              {trend === 'stable' && <Minus className="h-3.5 w-3.5 text-slate-500" />}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-1">
            <p className={`text-3xl font-bold ${getScoreColor(score)}`}>{score.toFixed(1)}</p>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
          {description && <p className="text-xs text-muted-foreground/80">{description}</p>}
        </div>
        <Progress value={score} className={`mt-3 h-2 bg-slate-200/50 dark:bg-slate-700/50 ${getProgressColor(score)}`} />
      </CardContent>
    </Card>
  );
}

function MetricRow({ label, value, unit, target, isHigherBetter = true }: {
  label: string;
  value: number;
  unit?: string;
  target?: number;
  isHigherBetter?: boolean;
}) {
  const isGood = target 
    ? (isHigherBetter ? value >= target : value <= target)
    : (isHigherBetter ? value >= 75 : value <= 25);

  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-semibold ${isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {value.toFixed(1)}{unit}
        </span>
        <div className={`p-1 rounded-full ${isGood ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-amber-100 dark:bg-amber-900/50'}`}>
          {isGood ? (
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function AIAnalytics() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: dashboardData, isLoading, refetch, isFetching } = useQuery<AIDashboardData>({
    queryKey: ['/api/ai/dashboard'],
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/30 dark:via-purple-950/20 dark:to-fuchsia-950/10">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl border border-white/20">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative p-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full">
              <Brain className="h-10 w-10 text-white animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">AI Analytics</p>
            <p className="text-sm text-muted-foreground">Analyzing hospital data...</p>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-fuchsia-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  const hospitalHealth = dashboardData?.hospitalHealth;
  const doctorMetrics = dashboardData?.doctorEfficiency || [];
  const nurseMetrics = dashboardData?.nurseEfficiency || [];
  const opdMetrics = dashboardData?.opdIntelligence;
  const predictions = dashboardData?.predictions || [];

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'IMPROVING': return 'up';
      case 'DECLINING': return 'down';
      default: return 'stable';
    }
  };

  return (
    <div className="h-full flex flex-col" data-testid="ai-analytics-page">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 dark:from-violet-500/20 dark:via-purple-500/15 dark:to-fuchsia-500/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-400/20 to-purple-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl blur-lg opacity-50" />
              <div className="relative p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                <Brain className="h-7 w-7 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                AI Intelligence Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">Real-time hospital performance analytics powered by AI</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-violet-200 dark:border-violet-800 hover:border-violet-300 dark:hover:border-violet-700 shadow-sm"
            data-testid="button-refresh-ai"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex w-full mb-4 overflow-x-auto" data-testid="ai-tabs">
              <TabsTrigger value="overview" className="flex-1 min-w-0" data-testid="tab-overview">
                <Building2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="doctors" className="flex-1 min-w-0" data-testid="tab-doctors">
                <Stethoscope className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Doctors</span>
              </TabsTrigger>
              <TabsTrigger value="nurses" className="flex-1 min-w-0" data-testid="tab-nurses">
                <Heart className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Nurses</span>
              </TabsTrigger>
              <TabsTrigger value="opd" className="flex-1 min-w-0" data-testid="tab-opd">
                <Users className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">OPD</span>
              </TabsTrigger>
              <TabsTrigger value="predictions" className="flex-1 min-w-0" data-testid="tab-predictions">
                <LineChart className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Predictions</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ScoreCard
                  title="Hospital Health Index"
                  score={hospitalHealth?.overallScore || 0}
                  icon={Building2}
                  trend={getTrendIcon(hospitalHealth?.trend)}
                  description={`Trend: ${hospitalHealth?.trend || 'N/A'}`}
                />
                <ScoreCard
                  title="Doctor Efficiency"
                  score={hospitalHealth?.doctorEfficiencyScore || 0}
                  icon={Stethoscope}
                />
                <ScoreCard
                  title="Nurse Efficiency"
                  score={hospitalHealth?.nurseEfficiencyScore || 0}
                  icon={Heart}
                />
                <ScoreCard
                  title="OPD Performance"
                  score={hospitalHealth?.opdScore || 0}
                  icon={Users}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ScoreCard
                  title="Compliance Score"
                  score={hospitalHealth?.complianceScore || 0}
                  icon={CheckCircle}
                />
                <ScoreCard
                  title="Resource Utilization"
                  score={hospitalHealth?.resourceUtilization || 0}
                  icon={BarChart3}
                />
                <ScoreCard
                  title="Patient Satisfaction"
                  score={hospitalHealth?.patientSatisfaction || 0}
                  icon={Activity}
                />
                <ScoreCard
                  title="Cost Efficiency"
                  score={hospitalHealth?.costEfficiency || 0}
                  icon={PieChart}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="overflow-hidden" data-testid="card-insights">
                  <CardHeader className="pb-3 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/5 dark:from-amber-500/20 dark:via-yellow-500/15 dark:to-orange-500/10">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 shadow-sm">
                        <Lightbulb className="h-4 w-4 text-white" />
                      </div>
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      {hospitalHealth?.insights?.length ? (
                        hospitalHealth.insights.map((insight, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-50/50 to-yellow-50/30 dark:from-amber-900/20 dark:to-yellow-900/10 border border-amber-200/50 dark:border-amber-800/30">
                            <div className="p-1 rounded-full bg-amber-100 dark:bg-amber-900/50">
                              <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <span className="text-sm">{insight}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No insights available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden" data-testid="card-recommendations">
                  <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/5 dark:from-blue-500/20 dark:via-indigo-500/15 dark:to-violet-500/10">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
                        <Target className="h-4 w-4 text-white" />
                      </div>
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {hospitalHealth?.recommendations?.length ? (
                        hospitalHealth.recommendations.map((rec, i) => (
                          <div key={i} className="p-3 rounded-lg bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-800/50 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/30">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="font-medium text-sm">{rec.title}</span>
                              <Badge variant={rec.priority === 'HIGH' ? 'destructive' : rec.priority === 'MEDIUM' ? 'secondary' : 'outline'}>
                                {rec.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{rec.description}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No recommendations</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {hospitalHealth?.anomalies && hospitalHealth.anomalies.length > 0 && (
                <Card className="border-red-200 dark:border-red-800" data-testid="card-anomalies">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-5 w-5" />
                      Anomalies Detected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {hospitalHealth.anomalies.map((anomaly, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                          <span className="text-sm">{anomaly.message}</span>
                          <Badge variant="destructive">{anomaly.severity}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="doctors" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    Doctor Efficiency Analysis
                  </CardTitle>
                  <CardDescription>Individual performance metrics for all doctors</CardDescription>
                </CardHeader>
                <CardContent>
                  {doctorMetrics.length > 0 ? (
                    <div className="space-y-4">
                      {doctorMetrics.map((doctor) => (
                        <Card key={doctor.doctorId} className="hover-elevate" data-testid={`doctor-card-${doctor.doctorId}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-semibold">{doctor.doctorName}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {doctor.completedAppointments}/{doctor.totalAppointments} appointments completed
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={`text-2xl font-bold ${doctor.overallScore >= 75 ? 'text-green-600' : doctor.overallScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {doctor.overallScore.toFixed(1)}
                                </p>
                                <p className="text-xs text-muted-foreground">Overall Score</p>
                              </div>
                            </div>
                            <Separator className="my-3" />
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                              <MetricRow label="On-Time Rate" value={doctor.onTimeRate} unit="%" target={80} />
                              <MetricRow label="Consultation Time" value={doctor.avgConsultationTime} unit=" min" target={25} isHigherBetter={false} />
                              <MetricRow label="Prescription Quality" value={doctor.prescriptionQuality} unit="%" target={70} />
                              <MetricRow label="Follow-up Rate" value={doctor.followUpRate} unit="%" target={60} />
                              <MetricRow label="Workload Balance" value={doctor.workloadBalance} unit="%" target={70} />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No doctor data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="nurses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Nurse Efficiency Analysis
                  </CardTitle>
                  <CardDescription>Individual performance metrics for nursing staff</CardDescription>
                </CardHeader>
                <CardContent>
                  {nurseMetrics.length > 0 ? (
                    <div className="space-y-4">
                      {nurseMetrics.map((nurse) => (
                        <Card key={nurse.nurseId} className="hover-elevate" data-testid={`nurse-card-${nurse.nurseId}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-semibold">{nurse.nurseName}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {nurse.patientsAssigned} patients assigned
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={`text-2xl font-bold ${nurse.overallScore >= 75 ? 'text-green-600' : nurse.overallScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {nurse.overallScore.toFixed(1)}
                                </p>
                                <p className="text-xs text-muted-foreground">Overall Score</p>
                              </div>
                            </div>
                            <Separator className="my-3" />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <MetricRow label="Vitals Compliance" value={nurse.vitalsComplianceRate} unit="%" target={80} />
                              <MetricRow label="Medication Compliance" value={nurse.medicationComplianceRate} unit="%" target={80} />
                              <MetricRow label="Response Time" value={nurse.alertResponseTime} unit=" min" target={10} isHigherBetter={false} />
                              <MetricRow label="Documentation" value={nurse.documentationAccuracy} unit="%" target={85} />
                            </div>
                            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                              <span>Vitals Recorded: {nurse.vitalsRecorded}</span>
                              <span>Medications Given: {nurse.medicationsAdministered}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No nurse data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="opd" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ScoreCard
                  title="Overall OPD Score"
                  score={opdMetrics?.overallScore || 0}
                  icon={Users}
                />
                <ScoreCard
                  title="Slot Utilization"
                  score={opdMetrics?.slotUtilization || 0}
                  icon={Clock}
                />
                <Card className="hover-elevate">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Avg Wait Time</span>
                    </div>
                    <p className="text-2xl font-bold">{opdMetrics?.avgWaitTime?.toFixed(1) || 0} min</p>
                  </CardContent>
                </Card>
                <Card className="hover-elevate">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Daily Throughput</span>
                    </div>
                    <p className="text-2xl font-bold">{opdMetrics?.throughputRate?.toFixed(1) || 0}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Appointment Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Slots</span>
                        <span className="font-medium">{opdMetrics?.totalSlots || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Booked Slots</span>
                        <span className="font-medium">{opdMetrics?.bookedSlots || 0}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Appointments</span>
                        <span className="font-medium">{opdMetrics?.totalAppointments || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Completed</span>
                        <span className="font-medium text-green-600">{opdMetrics?.completedAppointments || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Cancelled</span>
                        <span className="font-medium text-red-600">{opdMetrics?.cancelledAppointments || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">No-Show Rate</span>
                        <span className="font-medium text-yellow-600">{opdMetrics?.noShowRate?.toFixed(1) || 0}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Department Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {opdMetrics?.departmentBreakdown?.length ? (
                        opdMetrics.departmentBreakdown.slice(0, 6).map((dept, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm">{dept.department}</span>
                            <Badge variant="secondary">{dept.count}</Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No department data</p>
                      )}
                    </div>
                    {opdMetrics?.peakHours && opdMetrics.peakHours.length > 0 && (
                      <>
                        <Separator className="my-3" />
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Peak Hours</p>
                          <div className="flex gap-2 flex-wrap">
                            {opdMetrics.peakHours.map((hour, i) => (
                              <Badge key={i} variant="outline">{hour}</Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="predictions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-primary" />
                    AI Predictions
                  </CardTitle>
                  <CardDescription>Forecasts based on historical data patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  {predictions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {predictions.map((prediction, i) => (
                        <Card key={i} className="hover-elevate" data-testid={`prediction-card-${prediction.predictionType}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <Badge variant="outline">{prediction.predictionType.replace(/_/g, ' ')}</Badge>
                              <span className="text-xs text-muted-foreground">{prediction.predictionDate}</span>
                            </div>
                            <div className="text-center py-3">
                              <p className="text-3xl font-bold text-primary">{prediction.predictedValue}</p>
                              <p className="text-xs text-muted-foreground">
                                Range: {prediction.lowerBound.toFixed(0)} - {prediction.upperBound.toFixed(0)}
                              </p>
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-2">
                              <span className="text-xs text-muted-foreground">Confidence:</span>
                              <Progress value={prediction.confidenceLevel} className="w-20 h-1.5" />
                              <span className="text-xs font-medium">{prediction.confidenceLevel}%</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3 text-center">{prediction.insights}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No predictions available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
