import { db } from "./db";
import { 
  appointments, doctors, vitals, medications, servicePatients, admissions,
  schedules, oxygenCylinders, bmwBags, equipment, patientConsents, inventoryItems,
  aiAnalyticsSnapshots, aiAnomalyEvents, aiRecommendations, hospitalHealthIndex,
  users, trackingPatients, prescriptions
} from "@shared/schema";
import { eq, and, gte, lte, sql, count, avg, desc } from "drizzle-orm";

// ========== DOCTOR EFFICIENCY ENGINE ==========

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

export async function calculateDoctorEfficiency(doctorId?: string): Promise<DoctorEfficiencyMetrics[]> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const periodStart = thirtyDaysAgo.toISOString().split('T')[0];
  const periodEnd = now.toISOString().split('T')[0];

  // Get all doctors or specific doctor
  const doctorsList = doctorId 
    ? await db.select().from(doctors).where(eq(doctors.id, doctorId))
    : await db.select().from(doctors);

  const results: DoctorEfficiencyMetrics[] = [];

  for (const doctor of doctorsList) {
    // Get appointments for this doctor
    const doctorAppointments = await db.select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctor.id),
          gte(appointments.appointmentDate, periodStart),
          lte(appointments.appointmentDate, periodEnd)
        )
      );

    const totalAppointments = doctorAppointments.length;
    const completedAppointments = doctorAppointments.filter(a => a.status === 'completed').length;
    const cancelledAppointments = doctorAppointments.filter(a => a.status === 'cancelled').length;

    // Calculate on-time rate (completed appointments / scheduled - cancelled)
    const scheduledCount = totalAppointments - cancelledAppointments;
    const onTimeRate = scheduledCount > 0 ? (completedAppointments / scheduledCount) * 100 : 85;

    // Get prescriptions count for this doctor
    const doctorPrescriptions = await db.select({ count: count() })
      .from(prescriptions)
      .where(eq(prescriptions.doctorId, doctor.id));
    
    const prescriptionCount = doctorPrescriptions[0]?.count || 0;
    
    // Prescription quality score (based on prescription to appointment ratio)
    const prescriptionQuality = completedAppointments > 0 
      ? Math.min(100, (Number(prescriptionCount) / completedAppointments) * 100)
      : 75;

    // Follow-up rate: Based on prescription-to-appointment ratio as a proxy
    // Higher prescription rate indicates proper follow-through on patient care
    const followUpRate = completedAppointments > 0 
      ? Math.min(100, (Number(prescriptionCount) / completedAppointments) * 80 + 20)
      : 70; // Industry benchmark default when no data

    // Workload balance (even distribution across days)
    const appointmentsByDay: { [key: string]: number } = {};
    doctorAppointments.forEach(apt => {
      const day = apt.appointmentDate;
      appointmentsByDay[day] = (appointmentsByDay[day] || 0) + 1;
    });
    const daysWithAppointments = Object.keys(appointmentsByDay).length;
    const avgPerDay = totalAppointments / Math.max(1, daysWithAppointments);
    const variance = Object.values(appointmentsByDay).reduce((sum, count) => 
      sum + Math.pow(count - avgPerDay, 2), 0) / Math.max(1, daysWithAppointments);
    const workloadBalance = Math.max(0, 100 - (variance * 10));

    // Calculate avg consultation time based on workload 
    // More appointments per day = shorter avg consultation (15-25 min range)
    const avgConsultationTime = avgPerDay > 0 
      ? Math.max(15, Math.min(25, 25 - (avgPerDay - 5) * 1.5))
      : 20; // Standard 20-minute benchmark when no data

    // Overall score (weighted average)
    const overallScore = (
      onTimeRate * 0.25 +
      prescriptionQuality * 0.20 +
      followUpRate * 0.20 +
      workloadBalance * 0.20 +
      Math.min(100, avgConsultationTime * 4) * 0.15
    );

    results.push({
      doctorId: doctor.id,
      doctorName: doctor.name,
      overallScore: Math.round(overallScore * 10) / 10,
      onTimeRate: Math.round(onTimeRate * 10) / 10,
      avgConsultationTime: Math.round(avgConsultationTime * 10) / 10,
      prescriptionQuality: Math.round(prescriptionQuality * 10) / 10,
      followUpRate: Math.round(followUpRate * 10) / 10,
      workloadBalance: Math.round(workloadBalance * 10) / 10,
      totalAppointments,
      completedAppointments
    });
  }

  return results;
}

// ========== NURSE EFFICIENCY ENGINE ==========

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

export async function calculateNurseEfficiency(nurseId?: string): Promise<NurseEfficiencyMetrics[]> {
  // Get nurses (users with NURSE role)
  const nurses = nurseId
    ? await db.select().from(users).where(and(eq(users.role, 'NURSE'), eq(users.id, nurseId)))
    : await db.select().from(users).where(eq(users.role, 'NURSE'));

  const results: NurseEfficiencyMetrics[] = [];
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (const nurse of nurses) {
    // Get patients assigned to this nurse
    const assignedPatients = await db.select()
      .from(servicePatients)
      .where(eq(servicePatients.assignedNurseId, nurse.id));

    const patientIds = assignedPatients.map(p => p.id);
    const patientsCount = patientIds.length;

    // Count vitals recorded by this nurse (from tracking patients)
    const vitalsRecorded = await db.select({ count: count() })
      .from(vitals)
      .where(eq(vitals.recordedBy, nurse.name || nurse.username));

    // Count medications administered
    const medsAdministered = await db.select({ count: count() })
      .from(medications)
      .where(eq(medications.administeredBy, nurse.name || nurse.username));

    const vitalsCount = vitalsRecorded[0]?.count || 0;
    const medsCount = medsAdministered[0]?.count || 0;

    // Calculate compliance rates
    // Vitals compliance: Should record vitals 3x/day per patient
    const expectedVitals = patientsCount * 7 * 3; // 7 days, 3 times per day
    const vitalsComplianceRate = expectedVitals > 0 
      ? Math.min(100, (Number(vitalsCount) / expectedVitals) * 100) 
      : 85;

    // Medication compliance: Based on recorded medications
    const expectedMeds = patientsCount * 7 * 4; // 7 days, 4 doses per day
    const medicationComplianceRate = expectedMeds > 0 
      ? Math.min(100, (Number(medsCount) / expectedMeds) * 100)
      : 82;

    // Alert response time: Derived from vitals recording frequency
    // More frequent vitals = better responsiveness (target: 5-15 min)
    const vitalsPerPatient = patientsCount > 0 ? Number(vitalsCount) / patientsCount : 0;
    const alertResponseTime = vitalsPerPatient > 20 ? 5 : vitalsPerPatient > 10 ? 8 : vitalsPerPatient > 5 ? 10 : 12;
    
    // Documentation accuracy: Based on medication compliance (proxy for proper documentation)
    const documentationAccuracy = medicationComplianceRate > 0 
      ? Math.min(100, 80 + (medicationComplianceRate / 100) * 20)
      : 85; // Industry benchmark default

    // Overall score
    const overallScore = (
      vitalsComplianceRate * 0.30 +
      medicationComplianceRate * 0.30 +
      Math.max(0, 100 - alertResponseTime * 5) * 0.20 + // Lower response time is better
      documentationAccuracy * 0.20
    );

    results.push({
      nurseId: nurse.id,
      nurseName: nurse.name || nurse.username,
      overallScore: Math.round(overallScore * 10) / 10,
      vitalsComplianceRate: Math.round(vitalsComplianceRate * 10) / 10,
      medicationComplianceRate: Math.round(medicationComplianceRate * 10) / 10,
      alertResponseTime: Math.round(alertResponseTime * 10) / 10,
      documentationAccuracy: Math.round(documentationAccuracy * 10) / 10,
      patientsAssigned: patientsCount,
      vitalsRecorded: Number(vitalsCount),
      medicationsAdministered: Number(medsCount)
    });
  }

  return results;
}

// ========== OPD INTELLIGENCE ENGINE ==========

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

export async function calculateOPDIntelligence(): Promise<OPDMetrics> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const periodStart = thirtyDaysAgo.toISOString().split('T')[0];
  const periodEnd = now.toISOString().split('T')[0];

  // Get all appointments in period
  const allAppointments = await db.select()
    .from(appointments)
    .where(
      and(
        gte(appointments.appointmentDate, periodStart),
        lte(appointments.appointmentDate, periodEnd)
      )
    );

  // Get all schedules to calculate slot utilization
  const allSchedules = await db.select()
    .from(schedules)
    .where(
      and(
        gte(schedules.date, periodStart),
        lte(schedules.date, periodEnd)
      )
    );

  const totalSlots = allSchedules.length;
  const bookedSlots = allSchedules.filter(s => s.isBooked).length;
  const slotUtilization = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;

  const totalAppointments = allAppointments.length;
  const completedAppointments = allAppointments.filter(a => a.status === 'completed').length;
  const cancelledAppointments = allAppointments.filter(a => a.status === 'cancelled').length;

  // No-show rate (scheduled but not completed or cancelled)
  const scheduledNotCompleted = allAppointments.filter(a => 
    a.status !== 'completed' && a.status !== 'cancelled' && 
    new Date(a.appointmentDate) < now
  ).length;
  const noShowRate = totalAppointments > 0 
    ? (scheduledNotCompleted / totalAppointments) * 100 
    : 0;

  // Throughput rate (completed per day)
  const daysInPeriod = 30;
  const throughputRate = completedAppointments / daysInPeriod;

  // Avg wait time: Derived from slot utilization and throughput
  // Higher utilization = longer wait times (10-25 min range)
  const avgWaitTime = slotUtilization > 0 
    ? Math.min(25, Math.max(10, 10 + (slotUtilization / 100) * 15))
    : 15; // Standard 15-minute benchmark when no data

  // Peak hours analysis
  const hourCounts: { [hour: string]: number } = {};
  allAppointments.forEach(apt => {
    const hour = apt.timeSlot?.split(':')[0] || '10';
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  const sortedHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => `${hour}:00`);

  // Department breakdown
  const departmentCounts: { [dept: string]: number } = {};
  allAppointments.forEach(apt => {
    const dept = apt.department || 'General';
    departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
  });
  const departmentBreakdown = Object.entries(departmentCounts)
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count);

  // Overall OPD score
  const overallScore = (
    slotUtilization * 0.25 +
    Math.max(0, 100 - noShowRate * 2) * 0.25 +
    Math.max(0, 100 - avgWaitTime * 2) * 0.25 +
    Math.min(100, throughputRate * 10) * 0.25
  );

  return {
    overallScore: Math.round(overallScore * 10) / 10,
    slotUtilization: Math.round(slotUtilization * 10) / 10,
    avgWaitTime: Math.round(avgWaitTime * 10) / 10,
    noShowRate: Math.round(noShowRate * 10) / 10,
    throughputRate: Math.round(throughputRate * 10) / 10,
    totalSlots,
    bookedSlots,
    totalAppointments,
    completedAppointments,
    cancelledAppointments,
    peakHours: sortedHours,
    departmentBreakdown
  };
}

// ========== HOSPITAL HEALTH INDEX ENGINE ==========

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

export async function calculateHospitalHealthIndex(): Promise<HospitalHealthMetrics> {
  const today = new Date().toISOString().split('T')[0];

  // Get component scores
  const doctorMetrics = await calculateDoctorEfficiency();
  const nurseMetrics = await calculateNurseEfficiency();
  const opdMetrics = await calculateOPDIntelligence();

  // Calculate average scores
  const doctorEfficiencyScore = doctorMetrics.length > 0
    ? doctorMetrics.reduce((sum, d) => sum + d.overallScore, 0) / doctorMetrics.length
    : 75;

  const nurseEfficiencyScore = nurseMetrics.length > 0
    ? nurseMetrics.reduce((sum, n) => sum + n.overallScore, 0) / nurseMetrics.length
    : 75;

  const opdScore = opdMetrics.overallScore;

  // Calculate compliance score
  const complianceScore = await calculateComplianceScore();

  // Resource utilization (equipment, oxygen, inventory)
  const resourceUtilization = await calculateResourceUtilization();

  // Patient satisfaction (based on completed appointments, low cancellations)
  const patientSatisfaction = Math.min(100, 
    70 + (opdMetrics.completedAppointments / Math.max(1, opdMetrics.totalAppointments)) * 30
  );

  // Cost efficiency (based on inventory management, waste minimization)
  const costEfficiency = await calculateCostEfficiency();

  // Workflow delay index (lower is better)
  const workflowDelayIndex = 100 - (opdMetrics.avgWaitTime * 2);

  // Calculate overall score (weighted average)
  const overallScore = (
    doctorEfficiencyScore * 0.20 +
    nurseEfficiencyScore * 0.15 +
    opdScore * 0.20 +
    complianceScore * 0.15 +
    resourceUtilization * 0.10 +
    patientSatisfaction * 0.10 +
    workflowDelayIndex * 0.10
  );

  // Determine trend (compare with yesterday)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const previousIndex = await db.select()
    .from(hospitalHealthIndex)
    .where(eq(hospitalHealthIndex.date, yesterdayStr))
    .limit(1);

  let trend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 'STABLE';
  if (previousIndex.length > 0) {
    const diff = overallScore - Number(previousIndex[0].overallScore);
    if (diff > 2) trend = 'IMPROVING';
    else if (diff < -2) trend = 'DECLINING';
  }

  // Generate insights
  const insights: string[] = [];
  if (doctorEfficiencyScore > 80) insights.push('Doctor efficiency is excellent');
  if (doctorEfficiencyScore < 60) insights.push('Doctor efficiency needs improvement');
  if (opdScore > 75) insights.push('OPD operations running smoothly');
  if (opdMetrics.noShowRate > 15) insights.push('High no-show rate detected');
  if (resourceUtilization < 70) insights.push('Resources underutilized');
  if (complianceScore > 85) insights.push('Compliance standards met');

  // Detect anomalies
  const anomalies: { type: string; severity: string; message: string }[] = [];
  if (opdMetrics.noShowRate > 20) {
    anomalies.push({ type: 'NO_SHOW_SPIKE', severity: 'HIGH', message: 'No-show rate exceeds 20%' });
  }
  if (doctorEfficiencyScore < 50) {
    anomalies.push({ type: 'EFFICIENCY_DROP', severity: 'CRITICAL', message: 'Doctor efficiency critically low' });
  }

  // Generate recommendations
  const recommendations: { priority: string; title: string; description: string }[] = [];
  if (opdMetrics.noShowRate > 10) {
    recommendations.push({
      priority: 'HIGH',
      title: 'Reduce No-Show Rate',
      description: 'Implement SMS reminders 24h and 2h before appointments'
    });
  }
  if (opdMetrics.avgWaitTime > 20) {
    recommendations.push({
      priority: 'MEDIUM',
      title: 'Optimize Wait Times',
      description: 'Consider staggered appointment scheduling'
    });
  }
  if (resourceUtilization < 75) {
    recommendations.push({
      priority: 'LOW',
      title: 'Improve Resource Utilization',
      description: 'Review equipment allocation and scheduling'
    });
  }

  return {
    date: today,
    overallScore: Math.round(overallScore * 10) / 10,
    doctorEfficiencyScore: Math.round(doctorEfficiencyScore * 10) / 10,
    nurseEfficiencyScore: Math.round(nurseEfficiencyScore * 10) / 10,
    opdScore: Math.round(opdScore * 10) / 10,
    complianceScore: Math.round(complianceScore * 10) / 10,
    resourceUtilization: Math.round(resourceUtilization * 10) / 10,
    patientSatisfaction: Math.round(patientSatisfaction * 10) / 10,
    costEfficiency: Math.round(costEfficiency * 10) / 10,
    workflowDelayIndex: Math.round(workflowDelayIndex * 10) / 10,
    trend,
    insights,
    anomalies,
    recommendations
  };
}

// ========== COMPLIANCE & RISK ENGINE ==========

async function calculateComplianceScore(): Promise<number> {
  // BMW compliance
  const bmwBagsResult = await db.select({ count: count() }).from(bmwBags);
  const disposedBags = await db.select({ count: count() })
    .from(bmwBags)
    .where(eq(bmwBags.status, 'DISPOSED'));
  
  const bmwCompliance = bmwBagsResult[0]?.count 
    ? (Number(disposedBags[0]?.count) / Number(bmwBagsResult[0].count)) * 100 
    : 85;

  // Oxygen safety (cylinders in good condition)
  const allCylinders = await db.select({ count: count() }).from(oxygenCylinders);
  const safeCylinders = await db.select({ count: count() })
    .from(oxygenCylinders)
    .where(eq(oxygenCylinders.status, 'IN_USE'));
  
  const oxygenSafety = allCylinders[0]?.count 
    ? Math.min(100, 70 + (Number(safeCylinders[0]?.count) / Number(allCylinders[0].count)) * 30)
    : 80;

  // Consent coverage
  const allPatients = await db.select({ count: count() }).from(servicePatients);
  const patientsWithConsent = await db.select({ count: count() }).from(patientConsents);
  
  const consentCoverage = allPatients[0]?.count 
    ? Math.min(100, (Number(patientsWithConsent[0]?.count) / Number(allPatients[0].count)) * 100)
    : 75;

  // Equipment servicing compliance
  const allEquipment = await db.select({ count: count() }).from(equipment);
  const upToDateEquipment = await db.select({ count: count() })
    .from(equipment)
    .where(eq(equipment.status, 'up-to-date'));
  
  const equipmentCompliance = allEquipment[0]?.count
    ? (Number(upToDateEquipment[0]?.count) / Number(allEquipment[0].count)) * 100
    : 80;

  // Overall compliance score
  return (bmwCompliance * 0.25 + oxygenSafety * 0.25 + consentCoverage * 0.25 + equipmentCompliance * 0.25);
}

async function calculateResourceUtilization(): Promise<number> {
  // Equipment utilization
  const totalEquipment = await db.select({ count: count() }).from(equipment);
  const activeEquipment = await db.select({ count: count() })
    .from(equipment)
    .where(eq(equipment.status, 'up-to-date'));
  
  const equipmentUtilization = totalEquipment[0]?.count
    ? (Number(activeEquipment[0]?.count) / Number(totalEquipment[0].count)) * 100
    : 75;

  // Oxygen cylinder utilization
  const totalCylinders = await db.select({ count: count() }).from(oxygenCylinders);
  const inUseCylinders = await db.select({ count: count() })
    .from(oxygenCylinders)
    .where(eq(oxygenCylinders.status, 'IN_USE'));
  
  const oxygenUtilization = totalCylinders[0]?.count
    ? (Number(inUseCylinders[0]?.count) / Number(totalCylinders[0].count)) * 100
    : 60;

  // Inventory utilization (items not at low stock)
  const totalItems = await db.select({ count: count() }).from(inventoryItems);
  const adequateItems = await db.select()
    .from(inventoryItems)
    .where(sql`${inventoryItems.currentStock} > ${inventoryItems.lowStockThreshold}`);
  
  const inventoryHealth = totalItems[0]?.count
    ? (adequateItems.length / Number(totalItems[0].count)) * 100
    : 80;

  return (equipmentUtilization * 0.4 + oxygenUtilization * 0.3 + inventoryHealth * 0.3);
}

async function calculateCostEfficiency(): Promise<number> {
  // Based on inventory waste, expired items, etc.
  const lowStockItems = await db.select()
    .from(inventoryItems)
    .where(sql`${inventoryItems.currentStock} <= ${inventoryItems.lowStockThreshold}`);
  
  const totalItems = await db.select({ count: count() }).from(inventoryItems);
  
  // Lower waste items = better cost efficiency
  const wasteRatio = totalItems[0]?.count 
    ? (lowStockItems.length / Number(totalItems[0].count))
    : 0.1;

  return Math.max(0, 100 - (wasteRatio * 100));
}

// ========== PREDICTIVE ENGINE ==========

interface PredictionResult {
  predictionType: string;
  predictedValue: number;
  confidenceLevel: number;
  lowerBound: number;
  upperBound: number;
  predictionDate: string;
  insights: string;
}

export async function generatePredictions(): Promise<PredictionResult[]> {
  const predictions: PredictionResult[] = [];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // ICU load prediction - based on current admissions
  const currentAdmissions = await db.select({ count: count() })
    .from(trackingPatients)
    .where(eq(trackingPatients.status, 'admitted'));
  
  const icuLoad = Number(currentAdmissions[0]?.count) || 0;
  // Use 5% growth factor based on typical hospital patterns
  const predictedIcuLoad = Math.max(0, Math.round(icuLoad * 1.05));

  predictions.push({
    predictionType: 'ICU_LOAD',
    predictedValue: predictedIcuLoad,
    confidenceLevel: 75,
    lowerBound: Math.max(0, icuLoad - 2),
    upperBound: icuLoad + 3,
    predictionDate: tomorrowStr,
    insights: `Based on ${icuLoad} current admissions with 5% growth factor`
  });

  // Appointment volume prediction - based on 7-day rolling average
  const recentAppointments = await db.select({ count: count() })
    .from(appointments)
    .where(gte(appointments.appointmentDate, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]));

  const weeklyTotal = Number(recentAppointments[0]?.count) || 0;
  const avgDaily = Math.round(weeklyTotal / 7);
  // Predict same as average with slight buffer
  const predictedAppointments = avgDaily;

  predictions.push({
    predictionType: 'APPOINTMENT_VOLUME',
    predictedValue: predictedAppointments,
    confidenceLevel: 85,
    lowerBound: Math.max(0, avgDaily - 3),
    upperBound: avgDaily + 3,
    predictionDate: tomorrowStr,
    insights: `Based on 7-day average of ${weeklyTotal} total appointments`
  });

  // Oxygen demand prediction - based on current usage and ICU load
  const activeCylinders = await db.select({ count: count() })
    .from(oxygenCylinders)
    .where(eq(oxygenCylinders.status, 'IN_USE'));

  const currentDemand = Number(activeCylinders[0]?.count) || 0;
  // Correlate with ICU load - more patients = potentially more oxygen
  const predictedDemand = Math.round(currentDemand + (predictedIcuLoad > icuLoad ? 1 : 0));

  predictions.push({
    predictionType: 'OXYGEN_DEMAND',
    predictedValue: predictedDemand,
    confidenceLevel: 75,
    lowerBound: Math.max(0, predictedDemand - 4),
    upperBound: predictedDemand + 4,
    predictionDate: tomorrowStr,
    insights: 'Based on current usage and patient load'
  });

  return predictions;
}

// ========== INPATIENT ANALYTICS ENGINE ==========

interface PatientHealthAnalysis {
  patientId: string;
  patientName: string;
  room: string;
  diagnosis: string;
  daysAdmitted: number;
  vitalsTrend: 'STABLE' | 'IMPROVING' | 'DECLINING' | 'CRITICAL';
  mealCompliance: number;
  medicationAdherence: number;
  overallHealthScore: number;
  criticalAlerts: string[];
  latestVitals: {
    temperature?: string;
    heartRate?: number;
    bloodPressure?: string;
    oxygenSaturation?: number;
    recordedAt?: Date;
  };
}

interface NurseWorkloadAnalysis {
  nurseId: string;
  nurseName: string;
  patientsAssigned: number;
  vitalsRecorded: number;
  mealsServed: number;
  medicationsGiven: number;
  efficiencyScore: number;
  workloadLevel: 'LOW' | 'OPTIMAL' | 'HIGH' | 'OVERLOADED';
}

interface InventoryUsageAnalysis {
  itemId: string;
  itemName: string;
  category: string;
  totalIssued: number;
  totalWasted: number;
  wastageRate: number;
  wasteCost: number;
  currentStock: number;
  stockStatus: 'ADEQUATE' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';
}

interface InpatientAnalyticsDashboard {
  patientAnalysis: PatientHealthAnalysis[];
  nurseWorkload: NurseWorkloadAnalysis[];
  inventoryUsage: InventoryUsageAnalysis[];
  criticalAlerts: { type: string; severity: string; message: string; patientId?: string }[];
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

export async function calculateInpatientAnalytics(): Promise<InpatientAnalyticsDashboard> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Get all admitted patients
  const admittedPatients = await db.select()
    .from(trackingPatients)
    .where(eq(trackingPatients.status, 'admitted'));

  // Get all nurses
  const nurses = await db.select()
    .from(users)
    .where(eq(users.role, 'NURSE'));

  // Get all vitals, meals, medications from last 7 days
  const allVitals = await db.select().from(vitals)
    .where(gte(vitals.recordedAt, sevenDaysAgo));
  
  const { meals } = await import("@shared/schema");
  const allMeals = await db.select().from(meals)
    .where(gte(meals.servedAt, sevenDaysAgo));
  
  const allMedications = await db.select().from(medications)
    .where(gte(medications.administeredAt, sevenDaysAgo));

  // Get inventory transactions
  const { inventoryTransactions } = await import("@shared/schema");
  const allTransactions = await db.select().from(inventoryTransactions)
    .where(gte(inventoryTransactions.createdAt, sevenDaysAgo));
  
  const allInventoryItems = await db.select().from(inventoryItems);

  const patientAnalysis: PatientHealthAnalysis[] = [];
  const criticalAlerts: { type: string; severity: string; message: string; patientId?: string }[] = [];
  const keyInsights: string[] = [];

  // Analyze each patient
  for (const patient of admittedPatients) {
    const patientVitals = allVitals.filter(v => v.patientId === patient.id)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
    
    const patientMeals = allMeals.filter(m => m.patientId === patient.id);
    const patientMeds = allMedications.filter(m => m.patientId === patient.id);
    
    const daysAdmitted = Math.ceil((now.getTime() - patient.admissionDate.getTime()) / (24 * 60 * 60 * 1000));
    
    // Calculate meal compliance (avg consumption percentage)
    const mealCompliance = patientMeals.length > 0
      ? patientMeals.reduce((sum, m) => sum + (m.consumptionPercentage || 100), 0) / patientMeals.length
      : 100;

    // Calculate medication adherence (expected: 3 meds/day)
    const expectedMeds = daysAdmitted * 3;
    const medicationAdherence = expectedMeds > 0 
      ? Math.min(100, (patientMeds.length / expectedMeds) * 100)
      : 100;

    // Analyze vitals trend
    let vitalsTrend: 'STABLE' | 'IMPROVING' | 'DECLINING' | 'CRITICAL' = 'STABLE';
    const patientAlerts: string[] = [];
    
    if (patientVitals.length > 0) {
      const latest = patientVitals[0];
      
      // Check for critical vitals
      if (latest.oxygenSaturation && latest.oxygenSaturation < 92) {
        vitalsTrend = 'CRITICAL';
        patientAlerts.push(`CRITICAL: Low oxygen saturation (${latest.oxygenSaturation}%)`);
        criticalAlerts.push({ type: 'VITALS', severity: 'CRITICAL', message: `${patient.name}: Low SpO2 (${latest.oxygenSaturation}%)`, patientId: patient.id });
      }
      if (latest.heartRate && (latest.heartRate > 100 || latest.heartRate < 50)) {
        if (vitalsTrend !== 'CRITICAL') vitalsTrend = 'DECLINING';
        patientAlerts.push(`Abnormal heart rate (${latest.heartRate} bpm)`);
      }
      if (latest.bloodPressureSystolic && latest.bloodPressureSystolic > 160) {
        patientAlerts.push(`High blood pressure (${latest.bloodPressureSystolic}/${latest.bloodPressureDiastolic})`);
        criticalAlerts.push({ type: 'VITALS', severity: 'HIGH', message: `${patient.name}: Elevated BP`, patientId: patient.id });
      }
      if (latest.temperature && parseFloat(latest.temperature) > 100) {
        patientAlerts.push(`Fever detected (${latest.temperature}°F)`);
      }
      
      // Compare with previous readings
      if (patientVitals.length >= 2) {
        const previous = patientVitals[1];
        if (latest.oxygenSaturation && previous.oxygenSaturation) {
          if (latest.oxygenSaturation > previous.oxygenSaturation + 2) vitalsTrend = 'IMPROVING';
          else if (latest.oxygenSaturation < previous.oxygenSaturation - 2 && vitalsTrend !== 'CRITICAL') vitalsTrend = 'DECLINING';
        }
      }
    }

    // Check for poor meal intake
    if (mealCompliance < 50) {
      patientAlerts.push(`Poor meal intake (${mealCompliance.toFixed(0)}% consumption)`);
      criticalAlerts.push({ type: 'NUTRITION', severity: 'MEDIUM', message: `${patient.name}: Poor meal consumption`, patientId: patient.id });
    }

    // Calculate overall health score
    const vitalsScore = vitalsTrend === 'CRITICAL' ? 30 : vitalsTrend === 'DECLINING' ? 50 : vitalsTrend === 'IMPROVING' ? 85 : 75;
    const overallHealthScore = (vitalsScore * 0.4) + (mealCompliance * 0.3) + (medicationAdherence * 0.3);

    const latestVitals = patientVitals[0] || {};
    patientAnalysis.push({
      patientId: patient.id,
      patientName: patient.name,
      room: patient.room,
      diagnosis: patient.diagnosis,
      daysAdmitted,
      vitalsTrend,
      mealCompliance: Math.round(mealCompliance * 10) / 10,
      medicationAdherence: Math.round(medicationAdherence * 10) / 10,
      overallHealthScore: Math.round(overallHealthScore * 10) / 10,
      criticalAlerts: patientAlerts,
      latestVitals: {
        temperature: latestVitals.temperature || undefined,
        heartRate: latestVitals.heartRate || undefined,
        bloodPressure: latestVitals.bloodPressureSystolic ? `${latestVitals.bloodPressureSystolic}/${latestVitals.bloodPressureDiastolic}` : undefined,
        oxygenSaturation: latestVitals.oxygenSaturation || undefined,
        recordedAt: latestVitals.recordedAt
      }
    });
  }

  // Analyze nurse workload
  const nurseWorkload: NurseWorkloadAnalysis[] = [];
  for (const nurse of nurses) {
    const nurseVitals = allVitals.filter(v => v.recordedBy === nurse.name || v.recordedBy === nurse.username);
    const nurseMeals = allMeals.filter(m => m.servedBy === nurse.name || m.servedBy === nurse.username);
    const nurseMeds = allMedications.filter(m => m.administeredBy === nurse.name || m.administeredBy === nurse.username);
    
    const uniquePatients = new Set([
      ...nurseVitals.map(v => v.patientId),
      ...nurseMeals.map(m => m.patientId),
      ...nurseMeds.map(m => m.patientId)
    ]);
    
    const patientsAssigned = uniquePatients.size;
    const totalActivities = nurseVitals.length + nurseMeals.length + nurseMeds.length;
    
    // Efficiency: activities per patient per day (expected ~5 activities/patient/day)
    const expectedActivities = patientsAssigned * 7 * 5;
    const efficiencyScore = expectedActivities > 0 
      ? Math.min(100, (totalActivities / expectedActivities) * 100)
      : patientsAssigned > 0 ? 50 : 80;
    
    let workloadLevel: 'LOW' | 'OPTIMAL' | 'HIGH' | 'OVERLOADED' = 'OPTIMAL';
    if (patientsAssigned === 0) workloadLevel = 'LOW';
    else if (patientsAssigned <= 2) workloadLevel = 'OPTIMAL';
    else if (patientsAssigned <= 4) workloadLevel = 'HIGH';
    else workloadLevel = 'OVERLOADED';

    nurseWorkload.push({
      nurseId: nurse.id,
      nurseName: nurse.name || nurse.username,
      patientsAssigned,
      vitalsRecorded: nurseVitals.length,
      mealsServed: nurseMeals.length,
      medicationsGiven: nurseMeds.length,
      efficiencyScore: Math.round(efficiencyScore * 10) / 10,
      workloadLevel
    });
  }

  // Analyze inventory usage and wastage
  const inventoryUsage: InventoryUsageAnalysis[] = [];
  let totalWastage = 0;
  let wasteCostTotal = 0;

  for (const item of allInventoryItems) {
    const itemTransactions = allTransactions.filter(t => t.itemId === item.id);
    const issued = itemTransactions.filter(t => t.type === 'ISSUE').reduce((sum, t) => sum + t.quantity, 0);
    const wasted = itemTransactions.filter(t => t.type === 'DISPOSE').reduce((sum, t) => sum + t.quantity, 0);
    const wasteCost = wasted * parseFloat(item.cost);
    
    totalWastage += wasted;
    wasteCostTotal += wasteCost;
    
    const wastageRate = issued > 0 ? (wasted / (issued + wasted)) * 100 : 0;
    
    let stockStatus: 'ADEQUATE' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK' = 'ADEQUATE';
    if (item.currentStock === 0) stockStatus = 'OUT_OF_STOCK';
    else if (item.currentStock < item.lowStockThreshold / 2) stockStatus = 'CRITICAL';
    else if (item.currentStock < item.lowStockThreshold) stockStatus = 'LOW';

    if (stockStatus === 'OUT_OF_STOCK' || stockStatus === 'CRITICAL') {
      criticalAlerts.push({ type: 'INVENTORY', severity: stockStatus === 'OUT_OF_STOCK' ? 'CRITICAL' : 'HIGH', message: `${item.name}: ${stockStatus.replace('_', ' ')}` });
    }

    if (wastageRate > 10) {
      criticalAlerts.push({ type: 'WASTAGE', severity: 'MEDIUM', message: `${item.name}: High wastage rate (${wastageRate.toFixed(1)}%)` });
    }

    inventoryUsage.push({
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      totalIssued: issued,
      totalWasted: wasted,
      wastageRate: Math.round(wastageRate * 10) / 10,
      wasteCost: Math.round(wasteCost * 100) / 100,
      currentStock: item.currentStock,
      stockStatus
    });
  }

  // Generate insights
  const criticalPatients = patientAnalysis.filter(p => p.vitalsTrend === 'CRITICAL').length;
  const avgMealCompliance = patientAnalysis.length > 0 
    ? patientAnalysis.reduce((sum, p) => sum + p.mealCompliance, 0) / patientAnalysis.length : 100;
  const avgMedicationAdherence = patientAnalysis.length > 0
    ? patientAnalysis.reduce((sum, p) => sum + p.medicationAdherence, 0) / patientAnalysis.length : 100;

  if (criticalPatients > 0) keyInsights.push(`${criticalPatients} patient(s) require immediate attention`);
  if (avgMealCompliance < 70) keyInsights.push(`Overall meal compliance is low (${avgMealCompliance.toFixed(1)}%)`);
  if (avgMealCompliance >= 85) keyInsights.push(`Good meal compliance across patients (${avgMealCompliance.toFixed(1)}%)`);
  if (wasteCostTotal > 500) keyInsights.push(`High inventory wastage cost: ₹${wasteCostTotal.toFixed(2)}`);
  
  const overloadedNurses = nurseWorkload.filter(n => n.workloadLevel === 'OVERLOADED').length;
  if (overloadedNurses > 0) keyInsights.push(`${overloadedNurses} nurse(s) are overloaded - consider redistribution`);
  
  const lowStockItems = inventoryUsage.filter(i => i.stockStatus === 'CRITICAL' || i.stockStatus === 'OUT_OF_STOCK').length;
  if (lowStockItems > 0) keyInsights.push(`${lowStockItems} inventory item(s) need immediate restocking`);

  return {
    patientAnalysis,
    nurseWorkload,
    inventoryUsage,
    criticalAlerts,
    keyInsights,
    summary: {
      totalAdmitted: admittedPatients.length,
      criticalPatients,
      avgMealCompliance: Math.round(avgMealCompliance * 10) / 10,
      avgMedicationAdherence: Math.round(avgMedicationAdherence * 10) / 10,
      totalWastage,
      wasteCostTotal: Math.round(wasteCostTotal * 100) / 100
    }
  };
}

// Export all engine functions
export const aiEngines = {
  calculateDoctorEfficiency,
  calculateNurseEfficiency,
  calculateOPDIntelligence,
  calculateHospitalHealthIndex,
  calculateComplianceScore,
  calculateResourceUtilization,
  calculateCostEfficiency,
  generatePredictions,
  calculateInpatientAnalytics
};
