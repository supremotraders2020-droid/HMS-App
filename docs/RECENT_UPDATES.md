# Gravity AI Manager - Recent Updates & Changelog

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
