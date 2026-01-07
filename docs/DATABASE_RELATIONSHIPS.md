# HMS Core - Database Relationships Documentation

## Overview
This document describes the relationships between database tables in the HMS Core Hospital Management System.

---

## Entity Relationship Diagram (Conceptual)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION & USERS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  users ──────────────────────────────────────────────────────────────────┐  │
│    │                                                                     │  │
│    ├──> staff_master (1:1) - Required for staff roles to login          │  │
│    ├──> doctor_profiles (1:1)                                           │  │
│    ├──> patient_profiles (1:1)                                          │  │
│    ├──> doctor_oath_confirmations (1:N)                                 │  │
│    ├──> user_notifications (1:N)                                        │  │
│    └──> audit_logs (1:N) - All user actions logged                      │  │
│                                                                          │  │
│  Valid Roles: SUPER_ADMIN, ADMIN, DOCTOR, NURSE, OPD_MANAGER,           │  │
│               PATIENT, MEDICAL_STORE, PATHOLOGY_LAB                     │  │
│                                                                          │  │
└──────────────────────────────────────────────────────────────────────────┘  │
                                                                               │
┌─────────────────────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              OPD & SCHEDULING                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  doctors ────────────────────────────────────────────────────────────┐      │
│    │                                                                 │      │
│    ├──> doctor_schedules (1:N)                                      │      │
│    │        │                                                        │      │
│    │        └──> doctor_time_slots (1:N)                            │      │
│    │                   │                                             │      │
│    │                   └──> appointments (1:1)                       │      │
│    │                                                                 │      │
│    ├──> doctor_patients (1:N)                                       │      │
│    └──> prescriptions (1:N)                                         │      │
│                                                                      │      │
└──────────────────────────────────────────────────────────────────────┘      │
                                                                               │
┌─────────────────────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PATIENT SERVICES                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  service_patients ───────────────────────────────────────────────────┐      │
│    │                                                                 │      │
│    ├──> admissions (1:N)                                            │      │
│    │        │                                                        │      │
│    │        └──> patient_bills (1:1)                                │      │
│    │                   │                                             │      │
│    │                   └──> bill_payments (1:N)                      │      │
│    │                                                                 │      │
│    ├──> medical_records (1:N)                                       │      │
│    ├──> patient_consents (1:N)                                      │      │
│    ├──> patient_disease_assignments (1:N)                           │      │
│    │        │                                                        │      │
│    │        └──> personalized_care_plans (1:1)                      │      │
│    │                                                                 │      │
│    └──> patient_monitoring_sessions (1:N)                           │      │
│             │                                                        │      │
│             ├──> vitals_hourly (1:N)                                │      │
│             ├──> inotropes_sedation (1:N)                           │      │
│             ├──> ventilator_settings (1:N)                          │      │
│             ├──> abg_lab_results (1:N)                              │      │
│             ├──> intake_hourly (1:N)                                │      │
│             ├──> output_hourly (1:N)                                │      │
│             ├──> diabetic_flow (1:N)                                │      │
│             ├──> medication_admin_records (1:N)                     │      │
│             ├──> once_only_drugs (1:N)                              │      │
│             ├──> nursing_shift_notes (1:N)                          │      │
│             ├──> airway_lines_tubes (1:N)                           │      │
│             ├──> skin_pressure_care (1:N)                           │      │
│             └──> fall_risk_assessment (1:N)                         │      │
│                                                                      │      │
└──────────────────────────────────────────────────────────────────────┘      │
```

---

## Detailed Relationships

### 1. User Management

```
users (1) ────> (1) staff_master (for DOCTOR, NURSE, OPD_MANAGER, ADMIN roles)
users (1) ────> (1) doctor_profiles
users (1) ────> (1) patient_profiles
users (1) ────> (N) doctor_oath_confirmations
users (1) ────> (N) user_notifications
users (1) ────> (N) activity_logs (via performed_by)
users (1) ────> (N) audit_logs (for CREATE/DELETE actions)
```

**Key Relationships:**
- Staff roles (DOCTOR, NURSE, OPD_MANAGER, ADMIN) require staff_master entry to login
- staff_master is auto-created when Admin adds users through User Management
- Each user can have ONE doctor_profile OR ONE patient_profile based on role
- Doctors must have daily oath confirmations (doctor_oath_confirmations)
- All users receive role-specific notifications
- All user create/delete actions are logged in audit_logs

**Security & Data Isolation:**
- Patient data isolation: Patients can ONLY see their own data (appointments, notifications, health records)
- Staff authentication: Only users with ACTIVE staff_master entries can login for staff roles
- Audit trail: All user management actions are logged for NABH/HIPAA compliance

---

### 2. Doctor & Scheduling

```
doctors (1) ────> (N) doctor_schedules
doctor_schedules (1) ────> (N) doctor_time_slots
doctor_time_slots (1) ────> (0..1) appointments

doctors (1) ────> (N) doctor_patients
doctors (1) ────> (N) prescriptions
```

**Key Relationships:**
- Doctors have multiple schedules for different days/dates
- Each schedule generates multiple 30-minute time slots
- Time slots can be linked to ONE appointment when booked
- Doctors maintain their own patient list (doctor_patients)

---

### 3. Patient Management

```
service_patients (1) ────> (N) admissions
admissions (1) ────> (0..1) patient_bills
patient_bills (1) ────> (N) bill_payments

service_patients (1) ────> (N) medical_records
service_patients (1) ────> (N) patient_consents
service_patients (1) ────> (N) biometric_templates
biometric_templates (1) ────> (N) biometric_verifications
```

**Key Relationships:**
- Patients can have multiple admissions over time
- Each admission can have ONE associated bill
- Bills can have multiple partial payments
- Medical records and consents are linked to patients

---

### 4. Prescriptions

```
prescriptions (1) ────> (N) prescription_items
prescriptions (N) ────> (1) doctors (via doctor_id)
prescriptions (N) ────> (1) service_patients (via patient_id)
```

**Key Relationships:**
- Each prescription has multiple medicine items
- Prescriptions link patients to prescribing doctors
- Items contain detailed medicine information with schedules

---

### 5. Patient Monitoring (14 Sub-modules)

```
patient_monitoring_sessions (1) ────> (N) vitals_hourly
patient_monitoring_sessions (1) ────> (N) inotropes_sedation
patient_monitoring_sessions (1) ────> (N) ventilator_settings
patient_monitoring_sessions (1) ────> (N) abg_lab_results
patient_monitoring_sessions (1) ────> (N) intake_hourly
patient_monitoring_sessions (1) ────> (N) output_hourly
patient_monitoring_sessions (1) ────> (N) diabetic_flow
patient_monitoring_sessions (1) ────> (N) medication_admin_records
patient_monitoring_sessions (1) ────> (N) once_only_drugs
patient_monitoring_sessions (1) ────> (N) nursing_shift_notes
patient_monitoring_sessions (1) ────> (N) airway_lines_tubes
patient_monitoring_sessions (1) ────> (N) skin_pressure_care
patient_monitoring_sessions (1) ────> (N) fall_risk_assessment
```

**Key Relationships:**
- All monitoring data links to a 24-hour session
- Sessions are patient-specific and date-specific
- Hourly charts (vitals, intake, output) have 24 slots per session
- All records include nurse signature for audit trail

---

### 6. Inventory Management

```
inventory_items (1) ────> (N) inventory_transactions
inventory_transactions (N) ────> (1) staff_members
inventory_transactions (N) ────> (0..1) inventory_patients
```

**Key Relationships:**
- Transactions track all stock movements
- Staff members issue/receive inventory
- Patients may be linked for direct consumption tracking

---

### 7. Equipment Servicing

```
equipment (1) ────> (N) service_history
```

**Key Relationships:**
- Each equipment item has a complete service history
- Emergency contacts are hospital-wide, not equipment-specific

---

### 8. Oxygen Tracking

```
oxygen_cylinders (1) ────> (N) cylinder_movements
oxygen_cylinders (1) ────> (N) oxygen_consumption
oxygen_cylinders (1) ────> (N) oxygen_alerts
```

**Key Relationships:**
- Cylinders track all movements (issue/return)
- Patient consumption records link to specific cylinders
- Alerts can reference specific cylinders

---

### 9. Biomedical Waste Management

```
bmw_bags (N) ────> (1) bmw_storage_rooms
bmw_bags (N) ────> (1) bmw_pickups
bmw_bags (1) ────> (N) bmw_movements
bmw_pickups (N) ────> (1) bmw_vendors
bmw_pickups (1) ────> (N) bmw_disposals
```

**Key Relationships:**
- Bags are tracked from generation to disposal
- Bags move through storage rooms before pickup
- Vendors handle pickups and disposals
- Complete audit trail via movements table

---

### 10. Swab Contamination Monitoring

```
swab_collection (N) ────> (1) swab_area_master
swab_collection (N) ────> (1) swab_sampling_site_master
swab_collection (1) ────> (N) swab_lab_results
swab_lab_results (N) ────> (1) swab_organism_master
swab_lab_results (1) ────> (N) swab_capa_actions
```

**Key Relationships:**
- Collections reference area and site masters
- Each collection can have multiple lab results
- Failed results trigger CAPA actions
- Audit logs track all changes

---

### 11. Disease Knowledge Module

```
disease_catalog (1) ────> (N) diet_templates
disease_catalog (1) ────> (N) medication_schedule_templates
disease_catalog (1) ────> (N) patient_disease_assignments
patient_disease_assignments (1) ────> (0..1) personalized_care_plans
```

**Key Relationships:**
- Diseases have associated diet and medication templates
- Patients are assigned diseases with severity
- AI generates personalized care plans from templates

---

### 12. AI Intelligence Layer

```
ai_metric_catalog (defines) ────> ai_analytics_snapshots
ai_analytics_snapshots (generates) ────> ai_anomaly_events
ai_analytics_snapshots (generates) ────> ai_prediction_results
ai_anomaly_events (triggers) ────> ai_recommendations
hospital_health_index (aggregates) ────> all engines
```

**Key Relationships:**
- Metric catalog defines what gets tracked
- Snapshots store time-series data
- Anomalies and predictions come from snapshot analysis
- Health index aggregates all engine scores

---

## Foreign Key Constraints

The HMS Core uses **soft references** (varchar IDs) rather than enforced foreign keys. This provides:
- Flexibility in development
- Better handling of optional relationships
- Simplified data migrations

**Key ID Patterns:**
- `patient_id` - References service_patients or users
- `doctor_id` - References doctors or users with DOCTOR role
- `nurse_id` - References users with NURSE role
- `session_id` - References patient_monitoring_sessions
- `admission_id` - References admissions
- `prescription_id` - References prescriptions

---

## Cascade Behavior (Application-Level)

Since foreign keys are not enforced at database level, cascade operations are handled in application code:

**Delete Cascades:**
- Deleting a patient should soft-delete/archive related records
- Deleting a monitoring session should remove all related hourly records
- Deleting a prescription should remove all prescription items

**Update Propagation:**
- Patient name changes should update denormalized fields
- Doctor name changes should update prescriptions and schedules

---

## Index Recommendations

### High-Priority Indexes

```sql
-- Users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- Appointments
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Time Slots
CREATE INDEX idx_time_slots_doctor_date ON doctor_time_slots(doctor_id, slot_date);
CREATE INDEX idx_time_slots_status ON doctor_time_slots(status);

-- Prescriptions
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(prescription_status);

-- Monitoring Sessions
CREATE INDEX idx_monitoring_patient_date ON patient_monitoring_sessions(patient_id, session_date);

-- Vitals Hourly
CREATE INDEX idx_vitals_session ON vitals_hourly(session_id);

-- BMW Bags
CREATE INDEX idx_bmw_bags_status ON bmw_bags(status);
CREATE INDEX idx_bmw_bags_category ON bmw_bags(category);

-- Oxygen Cylinders
CREATE INDEX idx_cylinders_status ON oxygen_cylinders(status);
CREATE INDEX idx_cylinders_type ON oxygen_cylinders(cylinder_type);
```

---

## Data Integrity Rules

### Business Rules Enforced in Application

1. **Appointment Booking**
   - Cannot book already-booked time slots
   - Must check doctor availability before booking

2. **Prescription Workflow**
   - Only DOCTOR can finalize prescriptions
   - OPD_MANAGER can only create drafts
   - Once finalized, prescriptions cannot be edited (only voided)

3. **Patient Monitoring**
   - Sessions are locked after 24 hours
   - Version control prevents concurrent edit conflicts
   - Nurse signature required for all entries

4. **Consent Forms**
   - Templates are read-only after activation
   - Patient-specific consents require valid patient ID

5. **Billing**
   - Cannot delete bills with payments
   - Total amount auto-calculated from charges
   - Balance auto-calculated from payments

---

## Data Flow Diagrams

### OPD Appointment Flow
```
Doctor Creates Schedule
        │
        ▼
System Generates 30-min Slots
        │
        ▼
Patient Books Available Slot
        │
        ▼
Slot Status = "booked"
        │
        ▼
Appointment Created
        │
        ▼
Doctor Completes Visit
        │
        ▼
Prescription Created
        │
        ▼
Patient Notification Sent
```

### Patient Monitoring Flow
```
Nurse Creates Session
        │
        ▼
24-Hour Data Collection
   ├── Hourly Vitals
   ├── I/O Charts
   ├── Medications
   └── Nursing Notes
        │
        ▼
Shift Handover
        │
        ▼
Session Auto-locks at 24hrs
        │
        ▼
Audit Trail Complete
```

### BMW Waste Flow
```
Waste Generated (Bag Created)
        │
        ▼
Collected by Handler
        │
        ▼
Moved to Storage Room
        │
        ▼
Vendor Pickup Scheduled
        │
        ▼
Bags Picked Up
        │
        ▼
Disposal at CBWTF
        │
        ▼
Certificate Received
        │
        ▼
Status = DISPOSED
```

---

*Documentation generated for HMS Core v2.0 - December 2024*
