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

function ScoreCard({ title, score, icon: Icon, trend, description }: {
  title: string;
  score: number;
  icon: any;
  trend?: 'up' | 'down' | 'stable';
  description?: string;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/30";
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  return (
    <Card className="hover-elevate" data-testid={`score-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-lg ${getBgColor(score)}`}>
            <Icon className={`h-5 w-5 ${getScoreColor(score)}`} />
          </div>
          {trend && (
            <div className="flex items-center gap-1">
              {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
              {trend === 'stable' && <Minus className="h-4 w-4 text-muted-foreground" />}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={`text-2xl font-bold ${getScoreColor(score)}`}>{score.toFixed(1)}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <Progress value={score} className="mt-2 h-1.5" />
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
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-medium ${isGood ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
          {value.toFixed(1)}{unit}
        </span>
        {isGood ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        )}
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
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <Brain className="h-12 w-12 animate-pulse text-primary" />
          <p className="text-muted-foreground">Loading AI Analytics...</p>
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
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">AI Intelligence Dashboard</h1>
            <p className="text-sm text-muted-foreground">Real-time hospital performance analytics</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          data-testid="button-refresh-ai"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 mb-4" data-testid="ai-tabs">
              <TabsTrigger value="overview" data-testid="tab-overview">
                <Building2 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="doctors" data-testid="tab-doctors">
                <Stethoscope className="h-4 w-4 mr-2" />
                Doctors
              </TabsTrigger>
              <TabsTrigger value="nurses" data-testid="tab-nurses">
                <Heart className="h-4 w-4 mr-2" />
                Nurses
              </TabsTrigger>
              <TabsTrigger value="opd" data-testid="tab-opd">
                <Users className="h-4 w-4 mr-2" />
                OPD
              </TabsTrigger>
              <TabsTrigger value="predictions" data-testid="tab-predictions">
                <LineChart className="h-4 w-4 mr-2" />
                Predictions
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
                <Card data-testid="card-insights">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {hospitalHealth?.insights?.length ? (
                        hospitalHealth.insights.map((insight, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                            <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <span className="text-sm">{insight}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No insights available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-recommendations">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="h-5 w-5 text-blue-500" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {hospitalHealth?.recommendations?.length ? (
                        hospitalHealth.recommendations.map((rec, i) => (
                          <div key={i} className="p-3 rounded-lg border">
                            <div className="flex items-center justify-between mb-1">
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
                    {opdMetrics?.peakHours?.length > 0 && (
                      <>
                        <Separator className="my-3" />
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Peak Hours</p>
                          <div className="flex gap-2">
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
