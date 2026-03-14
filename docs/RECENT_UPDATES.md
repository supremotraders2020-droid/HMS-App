# Gravity AI Manager - Recent Updates & Changelog

## Version 2.6.0 - March 2026

### Patient Movement History — Real-Time Cross-Page Sync

**Date:** March 14, 2026
**Impacted Roles:** NURSE, DOCTOR, ADMIN, OPD_MANAGER

#### Features:
1. **Unified History Timeline Across All Three Pages**
   - Patient Tracking, Patient Service, and Patient Barcode pages now show the same live movement history
   - All three use the identical query key `["/api/tracking/patients", patientId, "movements"]` — TanStack Query's shared cache means a single action instantly updates all open pages

2. **Real-Time Refresh Configuration**
   - `refetchInterval: 10000` (10 seconds) — reduced from 30 seconds
   - `staleTime: 0` — data considered immediately stale after any invalidation
   - `refetchOnWindowFocus: true` — re-fetches when nurse switches back to the browser tab

3. **Movement Timeline Added to Patient Barcode Page**
   - History tab now includes the `PatientMovementTimeline` component (previously missing)
   - Matches by patient name to find the tracking patient UUID, then fetches all movements
   - Shows admission, ICU transfer, ward transfer, and discharge events with color-coded cards

4. **Automatic Cache Invalidation**
   - Every ICU transfer, ward transfer, admit, and discharge in Patient Tracking automatically invalidates the movements cache for all patients via TanStack Query prefix matching

#### Technical Details:
- All three pages share the same `PatientMovementTimeline` component pattern
- TanStack Query prefix `["/api/tracking/patients"]` covers all nested movement queries
- PatientService history profile query also tightened to `refetchInterval: 10000, staleTime: 0`

---

### Bed Management Restructure

**Date:** March 14, 2026
**Impacted Roles:** ADMIN, SUPER_ADMIN, NURSE, DOCTOR, OPD_MANAGER

#### Changes Made:
1. **Removed Wards:**
   - "Standard" (STD-01) — removed from database and seed
   - "Semi Special Room AC" (SSR-01) — removed from database and seed

2. **Added Casualty Ward:**
   - New ward: **Casualty** (bed CAS-01)
   - Floor: Ground Floor, Department: Emergency
   - Equipped with oxygen capability
   - New bed category: `cat-casualty` (code: CAS)

3. **General Ward Bed Count Updates:**
   - **General Ward (F):** 10 beds → **7 beds** (GF-01 to GF-07)
   - **General Ward (M):** 10 beds → **8 beds** (GM-01 to GM-08)

4. **Final Ward Configuration:**

| Ward | Beds | Floor | Department |
|------|------|-------|------------|
| Casualty | 1 | Ground Floor | Emergency |
| General Ward (F) | 7 | 1st Floor | General Medicine |
| General Ward (M) | 8 | 1st Floor | General Medicine |
| ICU | 1 | 2nd Floor | Critical Care |
| NICU | 1 | 2nd Floor | NICU |
| Orbit | 1 | 2nd Floor | HDU |
| Horizon | 1 | Ground Floor | Infectious Disease |
| Nova | 1 | 1st Floor | Day Care |
| Nexus | 1 | 3rd Floor | General |

**Total Active Beds: 22**

#### Technical Details:
- Database updated directly via SQL — all changes reflected immediately
- Seed code in `server/database-storage.ts` updated to match
- `cat-semi-private` bed category replaced by `cat-casualty` in seed data

---

### Bug Fix: Available Rooms Not Showing in Admit Patient Form

**Date:** March 14, 2026
**Impacted Roles:** NURSE, ADMIN, DOCTOR

#### Issue:
The "Room Number" dropdown in the Admit Patient form showed "No rooms available" even though 22 beds existed in the database.

#### Root Cause:
The seed data inserted beds with `occupancyStatus: "available"` (lowercase), but the API route `/api/bed-management/beds/available` queried with `eq(beds.occupancyStatus, "AVAILABLE")` (uppercase). The case mismatch caused zero results.

#### Fix:
- All 22 beds in the database updated to uppercase `"AVAILABLE"`
- Seed code updated to use uppercase throughout: `"AVAILABLE"`, `"OCCUPIED"`, etc.
- Two additional query comparisons in `database-storage.ts` also corrected to uppercase
- All subsequent status changes (admit, discharge, transfer) already used uppercase consistently

---

### Bug Fix: Failed to Save Output in Patient Monitoring

**Date:** March 14, 2026
**Impacted Roles:** NURSE

#### Issue:
Saving fluid output records in Patient Monitoring → Output tab threw "Failed to save output" error toast.

#### Root Cause:
In the POST `/api/patient-monitoring/output` route, the `hourlyTotal` calculation used JavaScript `+` with mixed string and number types:
```js
// BEFORE — vomitus and stool are strings (e.g., "3", "12")
data.hourlyTotal = (data.urineOutput || 0) + (data.drainOutput || 0) +
                   (data.vomitus || 0) + (data.stool || 0) + ...;
// Result: 3 + 34 + "3" + "12" = "37312" (string!) → fails integer schema check
```

#### Fix:
```js
// AFTER — all values wrapped with Number() before summing
const urineNum = Number(data.urineOutput) || 0;
const drainNum = Number(data.drainOutput) || 0;
const vomitusNum = Number(data.vomitus) || 0;
const stoolNum = Number(data.stool) || 0;
const otherNum = Number(data.otherLosses) || 0;
data.hourlyTotal = urineNum + drainNum + vomitusNum + stoolNum + otherNum;
// Result: 3 + 34 + 3 + 12 + 0 = 52 (integer) → passes schema check ✓
```

---

## Version 2.5.1 - January 2026

### IPD Investigation Chart Module

**Date:** January 16, 2026  
**Impacted Roles:** NURSE, DOCTOR, ADMIN

#### Features:
1. **Comprehensive Investigation Chart Tab**
   - New tab in Patient Monitoring module after Allergies
   - 50+ investigation fields covering all major diagnostic categories
   - Date-based entries with nurse attribution

2. **Lab Test Sections:**
   - **Screening**: Blood Group, HIV, HBSAg, HCV
   - **Haematology**: HB/PCV, TLC, DLC, ESR, Platelets, Parasites, BT/CT, PT/APTT, Blood Sugar
   - **Renal Function Tests**: BUN, Sr. Creatinine, Electrolytes (Na/K/Cl, Ca/Phos/Mag)
   - **Liver Function Tests**: Bilirubin, SGOT/SGPT, Alk Phos, Proteins, Viral Markers, Amylase/Lipase
   - **Cardiac Enzymes**: CPK-MB, Sr. LDH, Troponin
   - **Lipid Profile**: Cholesterol, Triglycerides, HDL/LDL/VLDL
   - **Other Tests**: Urine Routine, Stool Routine, Sputum Examination

3. **Imaging & Diagnostics Section:**
   - ECG, 2D Echo, USG, Doppler
   - X-Rays, CT Scan / MRI
   - Histopathology, Fluid Analysis
   - Other Investigations (free text)

#### Technical Details:
- New database table: `ipd_investigation_chart` with 50+ columns
- API endpoints: GET/POST `/api/patient-monitoring/sessions/:sessionId/investigation-chart`
- PATCH endpoint: `/api/patient-monitoring/investigation-chart/:id`
- Organized UI with collapsible sections and date-based entries

---

### ICU Allergy & Precautions Add Form

**Date:** January 16, 2026  
**Impacted Roles:** NURSE, DOCTOR

#### Features:
1. **Add Allergy Button**
   - Appears when no allergy data exists for patient session
   - Form includes Drug Allergies, Food Allergies, Isolation Precautions
   - Fall Risk and Pressure Ulcer Risk checkboxes

2. **Field Details:**
   - Drug Allergies (textarea)
   - Food Allergies (text input)
   - Isolation Precautions dropdown (None, Contact, Droplet, Airborne, Reverse)
   - Special precautions toggles

---

## Version 2.5.0 - January 2026

### OPD Scheduling Enhancements

**Date:** January 9, 2026  
**Impacted Roles:** OPD_MANAGER, ADMIN, SUPER_ADMIN, DOCTOR

#### Changes Made:
1. **Schedule-Based Availability Display**
   - Doctor cards now show real-time slot availability based on schedule configuration
   - When doctors have clinic hours for selected date: Shows "X available, Y booked / Z total"
   - When doctors don't have clinic hours: Shows "No clinic hours for this date (Available: [scheduled days])"

2. **Doctor Identity Mapping**
   - Implemented `doctorTableId` mapping between `doctors` table and `users` table
   - Ensures accurate schedule matching and appointment reconciliation
   - Eliminates name-based matching issues (Dr. prefix variations, duplicate names)

3. **Slot Panel Improvements**
   - Slot detail panel only shows time slots when doctor has schedule for selected date
   - Non-working days show informative message with list of scheduled working days
   - Schedule blocks display remains visible to show doctor's overall availability pattern

#### Technical Details:
- New API endpoint: `/api/schedule-availability` returns per-doctor availability with metadata
- Response includes: `hasScheduleToday`, `scheduledDays`, `doctorTableId`, slot counts
- Frontend uses exact ID matching for reliable doctor-to-schedule correlation

---

### Technician Portal Workflow Isolation

**Date:** January 2026  
**Impacted Roles:** TECHNICIAN, NURSE, DOCTOR, ADMIN

#### Changes Made:
1. **Source-Based Test Filtering**
   - Technician Portal now exclusively receives tests from Patient Monitoring module
   - Tests ordered via Prescription Management route to different workflow (Medical Store)
   - Clear separation of diagnostic test processing paths

2. **Notification Isolation**
   - Technician notifications only triggered for Patient Monitoring test orders
   - Prescription-based test orders do not generate technician notifications
   - Reduces notification noise and focuses technician attention on appropriate tasks

3. **Dashboard Updates**
   - Pending tests count reflects only PATIENT_MONITORING source tests
   - Clear indication of test source in portal interface

#### Workflow Summary:
| Test Source | Processing Path | Notification Target |
|------------|-----------------|---------------------|
| Patient Monitoring → Tests Tab | Technician Portal | TECHNICIAN role |
| Prescription Management | Medical Store | MEDICAL_STORE role |

---

### Dashboard Real-Time Statistics

**Date:** January 2026  
**Impacted Roles:** ADMIN, SUPER_ADMIN, NURSE, DOCTOR

#### Changes Made:
1. **Active Patients Card**
   - Now displays real count from `tracking_patients` table
   - Shows patients currently being tracked in the hospital
   - Previously showed appointment count (incorrect metric)

2. **Critical Alerts Card**
   - Displays actual critical alert count from `/api/critical-alerts` endpoint
   - Matches the data shown in Critical Alerts Panel
   - Real-time reflection of patient safety concerns

3. **Data Accuracy Improvements**
   - All dashboard stat cards now use correct data sources
   - Consistent data between summary cards and detailed panels

---

### Smart OPD Flow Engine Updates

**Date:** December 2025 - January 2026  
**Impacted Roles:** DOCTOR, OPD_MANAGER

#### Features:
1. **24 Department-Specific Workflows**
   - Each department has customized consultation flow
   - Symptom-driven forms with auto-observations
   - Intelligent test and referral suggestions

2. **Departments Covered:**
   - Cardiothoracic Surgery, Cardiovascular Surgery, Cathlab
   - Vascular Surgery, Day Care & Minor Procedure, ENT
   - General Surgery, ICU & Casualty, Maxillo Facial Surgery
   - Neuro Surgery, OBGY & Gynaecology, Oncology
   - Orthopedic Surgery, Paediatric specialties (3)
   - Pain Management, Plastic Surgery, Uro Surgery
   - Pathology, Radiology, Rehabilitation Services
   - Gastroenterology

---

### ICU Patient Monitoring System

**Date:** December 2025  
**Impacted Roles:** NURSE, DOCTOR, TECHNICIAN

#### Features:
1. **27 Monitoring Data Tables**
   - Comprehensive vital signs tracking
   - Ventilator parameters
   - Input/Output monitoring
   - Critical care assessments

2. **NABH Compliance**
   - 24-hour data collection workflows
   - Shift-based logging (Morning/Evening/Night)
   - Critical value alerts with auto-escalation

3. **Integration with Technician Portal**
   - Diagnostic test orders from Patient Monitoring → Technician Portal
   - Report visibility across all authorized roles

---

## Previous Updates

### Version 2.4.0 - December 2025
- Face Recognition Identity Verification
- ID Card Scanning & Alert System
- Nurse Department Preferences
- Hospital Services Module (4,830+ services)

### Version 2.3.0 - November 2025
- Pathology Lab Service with barcode tracking
- Medical Store Integration with GST billing
- AI Intelligence Layer with analytics snapshots

### Version 2.2.0 - October 2025
- Super Admin Portal
- Claims Management
- Surgery/Hospital Packages

---

## Migration Notes

### For Existing Users:
1. **OPD Managers**: Review doctor schedule configurations to ensure accurate slot display
2. **Technicians**: All pending tests are now from Patient Monitoring only
3. **Nurses**: Use Patient Monitoring → Tests tab for diagnostic orders requiring technician processing
4. **Admins**: Dashboard statistics now reflect accurate real-time data

### For System Administrators:
1. Ensure `doctor_schedules` table has proper `doctorId` references to `users` table
2. Verify existing appointments have correct `doctorId` values for reconciliation
3. Review notification settings for role-based routing

---

## Support

For questions about these updates, contact:
- Technical Issues: System Administrator
- Workflow Questions: Department Head
- Training Requests: Hospital Administration
