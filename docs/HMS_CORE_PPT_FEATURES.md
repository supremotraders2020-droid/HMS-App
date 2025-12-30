# HMS Core - Complete Feature List for PPT Presentation
## Hospital Management System - Gravity Hospital

---

# SLIDE 1: SYSTEM OVERVIEW

## HMS Core - Hospital Management System
- **Hospital**: Gravity Hospital, Pune
- **User Roles**: 7 distinct roles
- **Departments**: 24 departments
- **Services**: 4,830+ hospital services
- **Pathology Tests**: 1,148 tests across 10 categories
- **Technology**: React, Node.js, PostgreSQL, OpenAI GPT-4o

---

# SLIDE 2: PATIENT CARE FLOW (END-TO-END WORKFLOW)

```
PATIENT JOURNEY FLOW:

1. REGISTRATION (OPD Manager/Admin)
   ↓
2. APPOINTMENT BOOKING (Patient/OPD Manager)
   ↓
3. CHECK-IN & IDENTITY (Biometric/Face Recognition)
   ↓
4. DOCTOR CONSULTATION (Doctor)
   ↓
5. LAB TESTS ORDERED (Doctor → Pathology Lab)
   ↓
6. SAMPLE COLLECTION & RESULTS (Pathology Lab)
   ↓
7. PRESCRIPTION CREATED (Doctor)
   ↓
8. MEDICINE DISPENSING (Medical Store)
   ↓
9. ADMISSION (If Required - Nurse/Admin)
   ↓
10. PATIENT MONITORING (Nurse/Doctor)
    ↓
11. DISCHARGE & BILLING (Admin)
```

---

# SLIDE 3: 7 USER ROLES OVERVIEW

| Role | Primary Function | Access Level |
|------|------------------|--------------|
| ADMIN | System Management | Full Access |
| DOCTOR | Patient Care & Treatment | Clinical Access |
| NURSE | Patient Monitoring & Care | Nursing Access |
| OPD_MANAGER | Outpatient Operations | OPD Access |
| PATIENT | Self-Service Portal | Personal Records |
| PATHOLOGY_LAB | Laboratory Operations | Lab Access |
| MEDICAL_STORE | Pharmacy Operations | Pharmacy Access |

---

# SLIDE 4-6: ADMIN FEATURES

## ADMIN - System Administrator

### 4.1 User Management
- Create, Edit, Delete users
- Assign roles (7 role types)
- Password management
- Account activation/deactivation
- Login audit logs

### 4.2 Hospital Settings
- Hospital profile management
- Department configuration
- Location & contact details
- Operating hours
- Google Maps integration

### 4.3 System Settings
- Theme customization (6 themes)
- Light/Dark mode
- Notification preferences
- Session timeout settings
- Security configurations

### 4.4 OPD Service Management
- Doctor schedules
- Appointment slot configuration
- 30-minute slot management
- Real-time availability
- Appointment status tracking

### 4.5 Patient Service
- Patient registration
- Demographics management
- Admission/Discharge
- Insurance tracking
- Medical records management

### 4.6 Inventory Management
- Stock management (Disposables, Medicines, Equipment)
- Low stock alerts
- Transaction logging
- Reorder level configuration
- Supplier management

### 4.7 Equipment Servicing
- Asset inventory
- Maintenance scheduling
- Service history
- AMC (Annual Maintenance Contract) management
- Equipment status tracking

### 4.8 Bed Management (NABH Compliant)
- Bed categories (General, Semi-Private, Private, ICU, NICU, PICU)
- Real-time availability
- Automated allocation
- Transfer logs
- Discharge workflows
- Occupancy analytics

### 4.9 Oxygen Tracking System (NABH Compliant)
- Cylinder management (B, D, Jumbo types)
- Status tracking (Full, In-Use, Empty)
- Movement logging
- Patient-wise consumption
- LMO readings
- Low stock alerts

### 4.10 Biomedical Waste Management (CPCB Compliant)
- 4 waste categories (Yellow, Red, White, Blue)
- Barcode generation
- Storage monitoring
- Vendor management
- Compliance reports (Daily, Monthly, MPCB, Annual)

### 4.11 Swab Contamination Monitoring (NABH Compliant)
- OT & ICU surveillance
- Auto-interpretation (PASS/ACCEPTABLE/FAIL)
- CAPA generation
- Audit logging
- Trend analysis

### 4.12 Consent Forms Management
- 14 trilingual templates (English/Hindi/Marathi)
- Categories: Legal, Surgical, Diagnostic, Treatment, Maternal
- PDF preview & download
- Version tracking
- Print functionality

### 4.13 AI Analytics Dashboard
- Doctor efficiency metrics
- Nurse efficiency metrics
- OPD efficiency analytics
- Hospital Health Index
- Compliance Risk monitoring
- Predictive analytics (ICU load, Oxygen demand)
- Anomaly detection

### 4.14 Patient Analytics
- Admission trends
- Department-wise statistics
- Demographics analysis
- Length of stay analysis
- Readmission rates

### 4.15 Medical Stores Management
- In-House & Third-Party stores
- Prescription flow monitoring
- Dispensing status tracking
- Billing overview

### 4.16 Pathology Lab Oversight
- Test order monitoring
- Sample tracking
- Result validation oversight
- Quality control compliance

### 4.17 Hospital Services & Surgeries
- 24 departments management
- 4,830+ services catalog
- Service pricing
- Add/Edit/Delete services
- Department configuration

### 4.18 Face Recognition System
- Biometric enrollment
- Patient duplicate detection
- Staff attendance
- Recognition settings
- Audit logs

### 4.19 Disease Knowledge Module
- Pre-seeded diseases (Diabetes, Hypertension, TB, Dengue, Asthma)
- Indian diet plans (ICMR/MoHFW guidelines)
- Medication schedules
- AI-powered personalization

### 4.20 Notification Service
- Multi-channel (Push, Email, SMS, WhatsApp)
- Priority levels
- Role-based filtering
- WebSocket real-time delivery

### 4.21 Chatbot Service (AI-Powered)
- OpenAI GPT-4o integration
- Context-aware responses
- Patient query handling
- Health information

---

# SLIDE 7-8: DOCTOR FEATURES

## DOCTOR - Medical Practitioner

### 7.1 Daily Oath Confirmation
- Mandatory daily login requirement
- Professional commitment acknowledgment

### 7.2 Dashboard
- Today's appointments
- Pending consultations
- Patient statistics
- Quick actions

### 7.3 Schedule Management
- View own schedule
- Time slot configuration
- Availability settings
- Leave management

### 7.4 Appointment Management
- View appointments
- Patient queue
- Consultation status
- Appointment history

### 7.5 Patient Management
- Patient search
- Medical history view
- Demographics access
- Previous visits

### 7.6 Prescription Management
- Create prescriptions
- Draft → Awaiting Signature → Finalized → Void workflow
- Medicine search (Indian medicine database)
- Dosage & frequency
- Auto-generated medication schedules
- Vitals recording
- Digital signature

### 7.7 Lab Test Ordering
- Order pathology tests
- Select from 1,148 tests
- Priority marking (Routine, Urgent, STAT)
- View results

### 7.8 Patient Monitoring
- ICU charts access
- Vitals review
- Nursing notes
- Critical alerts

### 7.9 Disease Knowledge Access
- Disease information
- Treatment protocols
- Diet recommendations
- Medication guidelines

### 7.10 OPD Service Access
- View OPD schedules
- Patient queue management
- Consultation completion

### 7.11 Patient Service Access
- View patient records
- Admission management
- Medical records creation

### 7.12 Biometric Verification
- Patient identity verification
- Face recognition access

### 7.13 Notifications
- Appointment alerts
- Critical value notifications
- Patient updates

### 7.14 Chatbot Assistant
- AI-powered assistance
- Clinical information
- Query handling

### 7.15 Hospital Services View
- Browse 24 departments
- View 4,830+ services
- Search functionality (Read-only)

---

# SLIDE 9-10: NURSE FEATURES

## NURSE - Nursing Staff

### 9.1 Dashboard
- Assigned patients
- Shift information
- Pending tasks
- Quick actions

### 9.2 Patient Care
- Patient rounds
- Care documentation
- Task completion
- Handoff notes

### 9.3 Patient Tracking
- Admission workflow
- Doctor visit scheduling
- Patient status updates
- Location tracking

### 9.4 Patient Monitoring (NABH Compliant ICU Chart)
14 Sub-modules for 24-hour data collection:
1. Vitals recording
2. Inotropes management
3. Ventilator settings
4. ABG (Arterial Blood Gas)
5. Intake/Output charts
6. Medication administration
7. Nursing assessments
8. Pain assessment
9. Fall risk assessment
10. Pressure ulcer assessment
11. Nutrition monitoring
12. IV line management
13. Catheter care
14. Special instructions

- Shift-based logging
- Version control
- Critical alerts

### 9.5 Vitals Management
- Temperature
- Blood Pressure
- Heart Rate
- SpO2
- Respiratory Rate
- Pain Score

### 9.6 Inventory Access
- View stock levels
- Request supplies
- Consume items
- Low stock visibility

### 9.7 Oxygen Tracking
- Cylinder status
- Patient-wise consumption
- Movement logging

### 9.8 Biometric Service
- Patient verification
- Face recognition access

### 9.9 Patient Barcode
- Barcode scanning
- Patient identification
- Wristband verification

### 9.10 Staff Management
- Schedule viewing
- Team coordination
- Shift management

### 9.11 Disease Knowledge Access
- Patient education
- Care protocols
- Diet information

### 9.12 Notifications
- Task reminders
- Critical alerts
- Shift notifications

### 9.13 Chatbot Assistant
- Query support
- Information access

### 9.14 Hospital Services View
- Browse services (Read-only)
- Search departments

---

# SLIDE 11: OPD MANAGER FEATURES

## OPD_MANAGER - Outpatient Department Manager

### 11.1 Dashboard
- OPD statistics
- Today's appointments
- Doctor availability
- Queue status

### 11.2 OPD Service Management
- Appointment scheduling
- Doctor schedule management
- Slot availability
- Walk-in management

### 11.3 Patient Service
- Patient registration
- Demographics entry
- Insurance verification
- Appointment booking

### 11.4 Prescription Access
- View prescriptions
- Print prescriptions
- Status tracking

### 11.5 Biometric Service
- Patient verification
- Face recognition enrollment
- Identity confirmation

### 11.6 Staff Management
- OPD staff coordination
- Schedule management
- Attendance tracking

### 11.7 Disease Knowledge Access
- Patient education materials
- Information sharing

### 11.8 Notifications
- Appointment alerts
- Queue updates
- System notifications

### 11.9 Hospital Services View
- Browse 24 departments
- View 4,830+ services
- Search functionality (Read-only)

---

# SLIDE 12: PATIENT FEATURES

## PATIENT - Hospital Patient

### 12.1 Patient Portal Dashboard
- Upcoming appointments
- Recent visits
- Health summary
- Quick actions

### 12.2 OPD Booking
- View available doctors
- Select specialty
- Choose time slot
- Book appointment
- Reschedule/Cancel

### 12.3 Health Records
- View medical history
- Download reports
- Lab results
- Prescription history

### 12.4 Admission Tracking
- View admission status
- Room/Bed information
- Doctor assignments
- Treatment plan visibility

### 12.5 Test Results
- View lab reports
- Download PDF
- Historical comparison

### 12.6 Prescription Access
- View prescriptions
- Medication schedule
- Pharmacy sharing

### 12.7 Chatbot Service (AI-Powered)
- Health queries
- Appointment assistance
- General information
- Symptom guidance

### 12.8 Notifications
- Appointment reminders
- Lab result alerts
- Prescription ready
- Bill notifications

### 12.9 Profile Management
- Update personal details
- Emergency contacts
- Insurance information

### 12.10 Hospital Services View
- Browse available services
- View department information
- Search by specialty (Read-only)

---

# SLIDE 13-14: PATHOLOGY LAB FEATURES

## PATHOLOGY_LAB - Laboratory Staff

### 13.1 Lab Dashboard
- Pending tests
- Samples today
- Results pending
- Critical values
- Reports ready

### 13.2 Test Order Management
- View test orders from doctors
- Order prioritization (Routine, Urgent, STAT)
- Order status tracking
- Order → Sample → Processing → Result → Report flow

### 13.3 Sample Collection
- Patient identity verification
- Sample barcode generation
- Container & tube color coding
- Collection time recording
- Fasting status tracking
- Special handling notes
- Chain of custody

### 13.4 Sample Types Supported
| Type | Container |
|------|-----------|
| Serum | SST (Yellow/Red) |
| Plasma | EDTA (Purple) |
| Whole Blood | EDTA (Purple) |
| Coagulation | Citrate (Blue) |
| Glucose | Fluoride (Gray) |
| Urine | Sterile Container |
| Stool | Stool Container |
| CSF | Sterile Tube |
| Tissue | Formalin |

### 13.5 Test Processing
- Batch processing
- Analyzer integration
- Worklist management
- Processing time tracking

### 13.6 Test Categories (1,148 Tests)
| Category | Test Count |
|----------|------------|
| Hematology | 180+ |
| Biochemistry | 250+ |
| Microbiology | 150+ |
| Serology & Immunology | 120+ |
| Histopathology | 100+ |
| Clinical Pathology | 150+ |
| Endocrinology | 90+ |
| Tumor Markers | 40+ |
| Immunology | 80+ |
| Genetics & Molecular | 50+ |

### 13.7 Result Entry & Validation
- Result value entry
- Normal range comparison
- Auto-flagging (Normal, High, Low, Critical)
- Delta checks (historical comparison)
- Validation workflow
- Approval/Rejection

### 13.8 Critical Value Alerts
- Immediate notification to doctor
- Documentation of notification
- Acknowledgment tracking
- Patient safety compliance

### 13.9 Report Generation
- Individual test reports
- Profile reports (multiple tests)
- Cumulative reports (historical)
- Preliminary reports (urgent)
- Final reports (complete)
- PDF generation
- Email/SMS delivery

### 13.10 Quality Control (QC)
- Internal QC (IQC)
  - Daily QC runs
  - Level 1/2/3 controls
  - Levey-Jennings charts
  - Westgard rules
- External QA (EQAS)
  - Proficiency testing
  - Certification records

### 13.11 Lab Inventory
- Reagent management
- Consumables tracking
- Calibrators & Controls
- Expiry monitoring
- FIFO usage
- Stock alerts

### 13.12 Equipment Maintenance
- Daily/Weekly/Monthly maintenance
- Calibration records
- Temperature logs
- Service history

### 13.13 Hospital Services Access
- Browse lab services
- View 1,148 pathology tests
- Search by test name (Read-only)

---

# SLIDE 15-16: MEDICAL STORE FEATURES

## MEDICAL_STORE - Pharmacy Staff

### 15.1 Store Dashboard
- Pending prescriptions
- Today's dispensed count
- Low stock items
- Pending bills
- Expiring soon

### 15.2 Store Types
- **IN_HOUSE**: Hospital's internal pharmacy
- **THIRD_PARTY**: External pharmacy partners

### 15.3 Prescription Management
- View hospital prescriptions
- Prescription sharing from doctors
- Status tracking:
  - PENDING
  - PARTIALLY_DISPENSED
  - FULLY_DISPENSED

### 15.4 Medicine Dispensing Workflow
```
Receive Prescription
    ↓
Verify Patient Identity
    ↓
Check Stock Availability
    ↓
Dispense Medicines
    ↓
Record Batch & Expiry
    ↓
Generate Bill
    ↓
Collect Payment
    ↓
Complete Transaction
```

### 15.5 Partial Dispensing
- Dispense available items
- Note pending items
- Schedule follow-up
- Status: PARTIALLY_DISPENSED

### 15.6 Billing & Invoicing
- Auto-generated bills
- GST calculation
- Discount application
- Payment methods:
  - CASH
  - CARD
  - UPI
  - INSURANCE

### 15.7 Insurance Processing
- Coverage verification
- Co-pay calculation
- Claim generation
- Reimbursement tracking

### 15.8 Medicine Substitution
- Generic alternatives
- Doctor approval workflow
- Patient consent
- Price comparison
- Substitution documentation

### 15.9 Inventory Management
- Current stock levels
- Reorder level tracking
- Expiry date monitoring
- FIFO stock rotation
- Low stock alerts
- Out of stock items

### 15.10 Stock Operations
- **Stock In**: Receive from suppliers
  - Invoice verification
  - Batch recording
  - Expiry tracking
  - GRN generation
- **Stock Out**: Dispensing/Transfer/Return
- **Stock Adjustment**: Physical count variance

### 15.11 Medicine Database
- Indian medicine catalog
- Brand & generic names
- Composition details
- Drug schedules (H, H1, X, OTC)
- Contraindications
- Side effects

### 15.12 Drug Schedule Compliance
| Schedule | Requirement |
|----------|-------------|
| Schedule H | Prescription required |
| Schedule H1 | Strict record keeping |
| Schedule X | Special license |
| OTC | No prescription |

### 15.13 Expiry Management
- 30/60/90 day alerts
- Near-expiry consumption
- Expired item disposal
- Return to supplier

### 15.14 Audit & Compliance
- Full transaction logs
- Prescription records (2 years)
- Bill records (7 years)
- Narcotics register (5 years)

### 15.15 Hospital Services Access
- Browse pharmacy services
- View medicine catalog
- Search by medicine name (Read-only)

---

# SLIDE 17: 24 DEPARTMENTS

## Hospital Departments

1. Emergency
2. Cardiology
3. Neurology
4. Orthopedics
5. Pediatrics
6. Oncology
7. Ophthalmology
8. ENT (Ear, Nose, Throat)
9. Dermatology
10. Psychiatry
11. Gynecology
12. Urology
13. Nephrology
14. Gastroenterology
15. Pulmonology
16. Endocrinology
17. Rheumatology
18. Pathology
19. Radiology
20. Physiotherapy
21. Dental
22. General Medicine
23. General Surgery
24. ICU (Intensive Care Unit)

---

# SLIDE 18: CROSS-ROLE WORKFLOWS

## Key Inter-Role Workflows

### Workflow 1: OPD Consultation Flow
```
Patient books appointment
    ↓
OPD Manager schedules slot
    ↓
Patient checks in (Biometric)
    ↓
Doctor consults patient
    ↓
Doctor creates prescription
    ↓
Prescription goes to Medical Store
    ↓
Medical Store dispenses
    ↓
Patient receives medicine
```

### Workflow 2: Lab Test Flow
```
Doctor orders lab test
    ↓
Order received by Pathology Lab
    ↓
Patient sample collected
    ↓
Sample processed
    ↓
Results entered & validated
    ↓
Report generated
    ↓
Doctor receives notification
    ↓
Doctor reviews & updates treatment
```

### Workflow 3: Admission Flow
```
Doctor recommends admission
    ↓
OPD Manager initiates admission
    ↓
Admin allocates bed
    ↓
Nurse receives patient
    ↓
Nurse monitors vitals
    ↓
Doctor visits daily
    ↓
Lab tests ordered as needed
    ↓
Medications via Medical Store
    ↓
Discharge by Doctor/Admin
```

### Workflow 4: Prescription to Pharmacy
```
Doctor finalizes prescription
    ↓
Status: AWAITING_SIGNATURE → FINALIZED
    ↓
Prescription visible to Medical Store
    ↓
Medical Store verifies patient
    ↓
Stock checked
    ↓
Medicines dispensed
    ↓
Bill generated with GST
    ↓
Payment collected
    ↓
Status: FULLY_DISPENSED
```

---

# SLIDE 19: HOSPITAL SERVICES SUMMARY

## Services & Surgeries Catalog

| Department | Service Count | Sample Services |
|------------|---------------|-----------------|
| Cardiology | 200+ | ECG, Echo, Angiography, CABG |
| Neurology | 150+ | EEG, MRI Brain, Stroke Care |
| Orthopedics | 180+ | Joint Replacement, Fracture Fixation |
| Pathology | 1,148 | Blood Tests, Cultures, Biopsies |
| Radiology | 120+ | X-Ray, CT, MRI, Ultrasound |
| General Surgery | 250+ | Appendectomy, Hernia Repair |
| Gynecology | 180+ | Cesarean, Hysterectomy |
| Pediatrics | 150+ | Vaccinations, Growth Monitoring |
| ICU | 100+ | Ventilator Support, Critical Care |
| Emergency | 80+ | Trauma Care, Resuscitation |

**Total: 4,830+ Services**

---

# SLIDE 20: ACCESS CONTROL MATRIX

## Feature Visibility by Role

| Feature | ADMIN | DOCTOR | NURSE | OPD | PATIENT | LAB | STORE |
|---------|:-----:|:------:|:-----:|:---:|:-------:|:---:|:-----:|
| User Management | Edit | - | - | - | - | - | - |
| Hospital Services | Edit | View | View | View | View | View | View |
| OPD Service | Full | View | - | Full | Book | - | - |
| Prescriptions | Full | Create | View | View | View | - | View |
| Lab Tests | Full | Order | - | - | View | Full | - |
| Dispensing | Full | - | - | - | - | - | Full |
| Patient Monitoring | Full | Full | Full | - | - | - | - |
| AI Analytics | Full | - | - | - | - | - | - |
| Inventory | Full | - | View | - | - | Lab | Store |
| Notifications | Full | Own | Own | Own | Own | Lab | Store |

---

# SLIDE 21: TECHNOLOGY STACK

## Technical Architecture

### Frontend
- React 18 + TypeScript
- Radix UI + shadcn/ui
- Tailwind CSS
- TanStack Query v5
- Wouter (Routing)
- Framer Motion (Animations)

### Backend
- Node.js + Express
- Drizzle ORM
- PostgreSQL (Neon Serverless)
- WebSockets (Real-time)
- bcrypt (Password Hashing)
- Express Sessions

### AI Integration
- OpenAI GPT-4o
- Chatbot Service
- Health Tips
- Personalized Care Plans

### Security
- AES-256 Encryption
- Session-based Auth
- Role-based Access Control
- HIPAA Compliance
- Audit Logging

---

# SLIDE 22: COMPLIANCE & STANDARDS

## Regulatory Compliance

| Standard | Module |
|----------|--------|
| NABH | Bed Management, Oxygen Tracking, ICU Charts, Swab Monitoring, Lab QC |
| CPCB | Biomedical Waste Management |
| HIPAA | Patient Data Protection, Biometric Security |
| ICMR/MoHFW | Disease Knowledge, Diet Plans |
| Drug Control | Medicine Database, Schedule Compliance |
| GST | Pharmacy Billing |

---

# SLIDE 23: LOGIN CREDENTIALS (FOR DEMO)

## Quick Test Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | admin.suhas.nair | Admin@123 |
| Doctor | dr.anil.kulkarni | Doctor@123 |
| Nurse | nurse.asha.patil | Nurse@123 |
| OPD Manager | opd.mahesh.patil | OPD@123 |
| Patient | rohan.patil | Patient@123 |
| Pathology Lab | lab.ramesh.kulkarni | Lab@123 |
| Medical Store | store.rajesh.verma | Store@123 |

---

# SLIDE 24: KEY HIGHLIGHTS

## Why HMS Core?

1. **Complete Solution**: 21 integrated modules
2. **7 User Roles**: Tailored dashboards for each
3. **24 Departments**: Comprehensive hospital coverage
4. **4,830+ Services**: Full service catalog
5. **1,148 Lab Tests**: Complete pathology support
6. **AI-Powered**: GPT-4o chatbot & analytics
7. **Compliance Ready**: NABH, CPCB, HIPAA
8. **Real-time**: WebSocket notifications
9. **Secure**: AES-256 encryption, RBAC
10. **Multi-language**: English/Hindi/Marathi consents

---

*HMS Core - Transforming Hospital Management for Gravity Hospital*
