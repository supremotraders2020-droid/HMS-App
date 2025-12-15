# AI Analytics Intelligence Layer - Technical Documentation

## Overview

The HMS Core AI Analytics system provides real-time, data-driven insights into hospital operations. This document explains the calculation logic, data sources, and methodology behind each metric.

---

## 1. Doctor Efficiency Engine

### Purpose
Measures individual doctor performance based on appointment management, prescription quality, and workload distribution.

### Metrics & Calculations

| Metric | Formula | Data Source | Weight |
|--------|---------|-------------|--------|
| **On-Time Rate** | `(Completed Appointments / Scheduled Appointments) × 100` | `appointments` table | 25% |
| **Prescription Quality** | `(Prescriptions Issued / Completed Appointments) × 100` | `prescriptions` table | 20% |
| **Follow-Up Rate** | `(Prescription Count / Completed Appointments) × 80 + 20` | `prescriptions` table | 20% |
| **Workload Balance** | `100 - (Variance in daily appointments × 10)` | `appointments` table | 20% |
| **Avg Consultation Time** | `max(15, min(25, 25 - (avgPerDay - 5) × 1.5))` minutes | Derived from workload | 15% |

### Overall Score Formula
```
Overall Score = (On-Time Rate × 0.25) + (Prescription Quality × 0.20) + 
                (Follow-Up Rate × 0.20) + (Workload Balance × 0.20) + 
                (Consultation Time Score × 0.15)
```

### Benchmark Defaults
- **On-Time Rate**: 85% (when no scheduled appointments)
- **Prescription Quality**: 75% (industry standard)
- **Follow-Up Rate**: 70% (industry standard)
- **Consultation Time**: 20 minutes (standard benchmark)

---

## 2. Nurse Efficiency Engine

### Purpose
Evaluates nursing staff performance based on patient care compliance, response times, and documentation accuracy.

### Metrics & Calculations

| Metric | Formula | Data Source | Weight |
|--------|---------|-------------|--------|
| **Vitals Compliance Rate** | `(Vitals Recorded / Expected Vitals) × 100` | `vitals` table | 30% |
| **Medication Compliance Rate** | `(Medications Given / Expected Medications) × 100` | `medications` table | 30% |
| **Alert Response Time** | Derived from vitals frequency per patient | `vitals` table | 20% |
| **Documentation Accuracy** | `80 + (Medication Compliance / 100) × 20` | Derived | 20% |

### Expected Values
- **Expected Vitals**: `Patients Assigned × 7 days × 3 times/day = 21 per patient/week`
- **Expected Medications**: `Patients Assigned × 7 days × 4 doses/day = 28 per patient/week`

### Alert Response Time Logic
```
if vitalsPerPatient > 20: responseTime = 5 min (Excellent)
elif vitalsPerPatient > 10: responseTime = 8 min (Good)
elif vitalsPerPatient > 5: responseTime = 10 min (Average)
else: responseTime = 12 min (Needs Improvement)
```

### Overall Score Formula
```
Overall Score = (Vitals Compliance × 0.30) + (Medication Compliance × 0.30) + 
                ((100 - Response Time × 5) × 0.20) + (Documentation Accuracy × 0.20)
```

### Benchmark Defaults
- **Vitals Compliance**: 85% (when no patients assigned)
- **Medication Compliance**: 82% (industry standard)
- **Documentation Accuracy**: 85% (industry benchmark)

---

## 3. OPD Intelligence Engine

### Purpose
Analyzes outpatient department operations including slot utilization, wait times, and patient flow patterns.

### Metrics & Calculations

| Metric | Formula | Data Source |
|--------|---------|-------------|
| **Slot Utilization** | `(Booked Slots / Total Slots) × 100` | `schedules` table |
| **No-Show Rate** | `(Missed Appointments / Total Appointments) × 100` | `appointments` table |
| **Avg Wait Time** | `min(25, max(10, 10 + (slotUtilization / 100) × 15))` | Derived |
| **Throughput Rate** | `Completed Appointments / 30 days` | `appointments` table |

### Wait Time Logic
The average wait time is derived from slot utilization:
- Higher slot utilization → Longer wait times (busier OPD)
- Range: 10-25 minutes
- Formula: `10 + (utilization% / 100) × 15 minutes`

### Peak Hours Analysis
- Aggregates appointments by hour (extracted from `timeSlot`)
- Returns top 3 busiest hours
- Helps optimize scheduling

### Department Breakdown
- Groups appointments by department
- Sorted by volume (descending)
- Identifies high-demand specialties

### Overall Score Formula
```
Overall Score = (Slot Utilization × 0.25) + ((100 - No-Show Rate × 2) × 0.25) + 
                ((100 - Wait Time × 2) × 0.25) + (Throughput × 10 × 0.25)
```

### Benchmark Defaults
- **Avg Wait Time**: 15 minutes (when no slot data)

---

## 4. Hospital Health Index Engine

### Purpose
Provides an aggregated view of overall hospital performance combining all efficiency engines plus compliance and resource metrics.

### Component Scores

| Component | Weight | Source |
|-----------|--------|--------|
| **Doctor Efficiency** | 20% | Average of all doctor scores |
| **Nurse Efficiency** | 15% | Average of all nurse scores |
| **OPD Performance** | 20% | OPD Intelligence score |
| **Compliance Score** | 15% | Compliance Engine |
| **Resource Utilization** | 10% | Resource Engine |
| **Patient Satisfaction** | 10% | Derived from completion rate |
| **Workflow Delay Index** | 10% | `100 - (Wait Time × 2)` |

### Compliance Score Components (25% each)
1. **BMW Compliance**: `(Disposed Bags / Total Bags) × 100`
2. **Oxygen Safety**: `70 + (Active Cylinders / Total Cylinders) × 30`
3. **Consent Coverage**: `(Signed Consents / Total Patients) × 100`
4. **Equipment Compliance**: `(Up-to-Date Equipment / Total Equipment) × 100`

### Resource Utilization Components
1. **Equipment Utilization** (40%): Active equipment percentage
2. **Oxygen Utilization** (30%): In-use cylinders percentage
3. **Inventory Health** (30%): Items above low-stock threshold

### Patient Satisfaction Formula
```
Patient Satisfaction = 70 + (Completed Appointments / Total Appointments) × 30
```

### Trend Detection
Compares today's score with yesterday's stored score:
- **IMPROVING**: Difference > +2 points
- **STABLE**: Difference between -2 and +2
- **DECLINING**: Difference < -2 points

### Insights Generation
Automatic insights based on thresholds:
- Doctor efficiency > 80%: "Doctor efficiency is excellent"
- Doctor efficiency < 60%: "Doctor efficiency needs improvement"
- OPD score > 75%: "OPD operations running smoothly"
- No-show rate > 15%: "High no-show rate detected"
- Resource utilization < 70%: "Resources underutilized"
- Compliance > 85%: "Compliance standards met"

### Anomaly Detection
| Condition | Severity | Alert |
|-----------|----------|-------|
| No-show rate > 20% | HIGH | "No-show rate exceeds 20%" |
| Doctor efficiency < 50% | CRITICAL | "Doctor efficiency critically low" |

### Recommendation Engine
| Trigger | Priority | Recommendation |
|---------|----------|----------------|
| No-show > 10% | HIGH | Implement SMS reminders 24h and 2h before appointments |
| Wait time > 20 min | MEDIUM | Consider staggered appointment scheduling |
| Resource utilization < 75% | LOW | Review equipment allocation and scheduling |

---

## 5. Predictive Analytics Engine

### Purpose
Forecasts future operational metrics to enable proactive resource planning.

### Predictions

#### ICU Load Prediction
- **Data Source**: `trackingPatients` table (admitted status)
- **Method**: Current admissions × 1.05 (5% growth factor)
- **Confidence**: 75%
- **Bounds**: Current ± 2-3 patients

#### Appointment Volume Prediction
- **Data Source**: `appointments` table (last 7 days)
- **Method**: 7-day rolling average
- **Confidence**: 85%
- **Bounds**: Average ± 3 appointments

#### Oxygen Demand Prediction
- **Data Source**: `oxygenCylinders` table (IN_USE status)
- **Method**: Current demand + (1 if ICU increasing else 0)
- **Confidence**: 75%
- **Bounds**: Current ± 4 cylinders

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                          │
├──────────┬──────────┬──────────┬──────────┬──────────┬─────────┤
│ appoint- │ prescrip-│  vitals  │ medica-  │ schedules│ equip-  │
│  ments   │  tions   │          │  tions   │          │  ment   │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬────┘
     │          │          │          │          │          │
     ▼          ▼          ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI ENGINES LAYER                           │
├────────────────┬────────────────┬───────────────────────────────┤
│    Doctor      │     Nurse      │         OPD                   │
│   Efficiency   │   Efficiency   │     Intelligence              │
└───────┬────────┴───────┬────────┴──────────┬────────────────────┘
        │                │                   │
        ▼                ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                 HOSPITAL HEALTH INDEX                           │
├─────────────────────────────────────────────────────────────────┤
│  Aggregates all metrics + Compliance + Resources + Predictions  │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API ENDPOINTS                              │
├─────────────────────────────────────────────────────────────────┤
│  GET /api/ai/doctor-efficiency                                  │
│  GET /api/ai/nurse-efficiency                                   │
│  GET /api/ai/opd-intelligence                                   │
│  GET /api/ai/hospital-health                                    │
│  GET /api/ai/predictions                                        │
│  GET /api/ai/dashboard (combined)                               │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                              │
│              (AI Analytics Page - Admin Only)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Score Interpretation Guide

| Score Range | Rating | Color Code | Action Required |
|-------------|--------|------------|-----------------|
| 80-100 | Excellent | Green | Maintain current practices |
| 60-79 | Good | Yellow | Minor improvements recommended |
| 40-59 | Needs Attention | Orange | Review and address issues |
| 0-39 | Critical | Red | Immediate intervention required |

---

## Refresh & Update Frequency

- **Real-time Dashboard**: Auto-refresh every 60 seconds
- **Historical Snapshots**: Daily storage for trend analysis
- **Predictions**: Updated on each dashboard request

---

## Access Control

- **AI Analytics Dashboard**: ADMIN role only
- **API Endpoints**: Require authenticated ADMIN session
- **Data Sources**: Read-only access to operational tables

---

## Technical Implementation

- **Backend**: Node.js/Express with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Frontend**: React with TanStack Query
- **Calculations**: Deterministic (no random values)
- **Fallbacks**: Industry benchmark defaults when data unavailable
