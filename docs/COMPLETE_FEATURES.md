# HMS Core - Complete Feature Documentation

## System Overview
HMS Core is a comprehensive Hospital Management System for Gravity Hospital with 21+ specialized modules. The system supports 7 user roles with role-based access control, 24 departments with 4,830+ hospital services including 1,148 pathology tests.

**Last Updated:** January 2026

---

## User Roles

| Role | Access Level | Primary Functions |
|------|--------------|-------------------|
| ADMIN | Full Access | System management, user management, all modules |
| DOCTOR | Clinical | Patient care, prescriptions, schedules, monitoring |
| NURSE | Clinical | Patient monitoring, medication administration |
| OPD_MANAGER | Operational | OPD operations, appointments, scheduling |
| PATIENT | Limited | View own records, book appointments |
| PATHOLOGY_LAB | Lab Operations | Test orders, sample collection, result entry, reports |
| MEDICAL_STORE | Pharmacy | Prescriptions, dispensing, billing, stock management |

---

## Module 1: Authentication & Access Control

### Features
- Session-based authentication with bcrypt password hashing (10 rounds)
- Role-based UI filtering
- Daily Doctor Oath requirement (NMC Physician's Pledge)
- Multi-session support with WebSocket notifications

### Login Flow
1. Enter username and password
2. Role-specific dashboard redirection
3. For DOCTOR: Daily oath acceptance required

---

## Module 2: User Management (ADMIN Only)

### Features
- Create/Edit/Delete users
- Role assignment
- Password management
- User search and filtering
- Activity monitoring

### User Types
- 5 Admin accounts
- 18+ Doctor accounts
- 4 Nurse accounts
- 7 OPD Manager accounts
- 12+ Patient accounts

---

## Module 3: OPD Service

### 3.1 Doctor Scheduling
- Create time slots per doctor
- Location-based scheduling (10 branches)
- Day-wise availability
- Real-time slot status

### 3.2 Appointment Booking
- Patient self-booking
- OPD Manager booking
- 30-minute slot intervals
- Google Maps integration
- Status tracking: scheduled, completed, cancelled

### 3.3 Locations (10 Pune Branches)
1. Koregaon Park
2. Hinjewadi
3. Kothrud
4. Wakad
5. Viman Nagar
6. Baner
7. Aundh
8. Kalyani Nagar
9. Pimpri
10. Nigdi (Main)

---

## Module 4: Patient Service

### Features
- Patient demographics management
- Medical history tracking
- Insurance information
- Emergency contacts
- Document uploads
- Consent form management

### Patient Information
- Personal details
- Blood type
- Allergies
- Chronic conditions
- Insurance provider/number

---

## Module 5: Patient Tracking

### Features
- Admission workflow
- Department assignment
- Room/bed allocation
- Doctor visit scheduling
- Status tracking: admitted, discharged, transferred

---

## Module 6: Patient Monitoring (NABH Compliant - 14 Sub-modules)

### ICU Chart System
24-hour data collection with shift-based logging

#### Sub-modules
1. **Patient Sessions** - ICU admission management
2. **Vitals Hourly** - Temperature, HR, BP, SpO2, RR
3. **Inotropes & Sedation** - Drug infusions, RASS/GCS scores
4. **Ventilator Settings** - All ventilation parameters
5. **ABG & Lab Values** - Blood gas analysis, lab reports
6. **Intake Chart** - IV lines, oral, NG tube, blood products
7. **Output Chart** - Urine, drain, vomitus, stool
8. **Diabetic Flow** - Blood sugar, insulin dosing
9. **Medication Administration Record** - MAR with compliance tracking
10. **Once-Only Drugs** - PRN medications
11. **Nursing Shift Notes** - Observations and handover
12. **Airway, Lines & Tubes** - ETT, central lines, Foley
13. **Staff on Duty** - Nurse assignments per shift
14. **Allergies & Precautions** - Always visible banner

### Critical Alerts
- Automatic alerts for abnormal values
- Real-time notification to assigned staff
- Alert resolution tracking

---

## Module 7: Prescription Management

### Features
- Multi-medicine prescriptions
- Auto-generated medication schedules
- Status workflow: draft → awaiting_signature → finalized → void
- Digital signature support
- Prescription history

### Prescription Details
- Patient information
- Diagnosis
- Medications with dosage
- Frequency and duration
- Special instructions

---

## Module 8: Consent Forms Management

### 14 Trilingual Templates
All forms available in English, Hindi, and Marathi

#### Categories
**Legal (4 forms)**
1. Medico-Legal Consent
2. Treatment Denial Consent
3. DNR Consent
4. Valuables Declaration

**Surgical (4 forms)**
5. Operation Theatre Consent
6. Anaesthesia Consent
7. Surgery Consent
8. Tubal Ligation Consent

**Diagnostic (2 forms)**
9. HIV Test Consent
10. HBsAg Test Consent

**Treatment (3 forms)**
11. Low Prognosis Consent
12. Blood Transfusion Consent
13. Emergency Procedure Consent

**Administrative (1 form)**
14. Patient Shifting Consent

### Features
- PDF preview
- Download functionality
- Print support
- Version tracking

---

## Module 9: Inventory Service

### Features
- Stock management with categories
- Low stock alerts
- Transaction logging (Issue, Return, Dispose)
- Staff-wise tracking
- Patient-wise usage

### Categories
- Disposables
- Syringes
- Gloves
- Medicines
- Equipment

---

## Module 10: Equipment Servicing

### Features
- Asset inventory with serial numbers
- Maintenance scheduling
- Service history tracking
- AMC management
- Due date alerts

---

## Module 11: Bed Management (ADMIN Only, NABH Compliant)

### Features
- Centralized bed control
- Category-based management
- Automated allocation
- Transfer logging with authorization
- Discharge workflows
- Status tracking

### Bed Categories
- General Ward
- Semi-Private
- Private
- Deluxe
- Suite
- ICU
- HDU
- NICU
- PICU
- Isolation
- Day Care
- Emergency

### Bed Statuses
- Available
- Occupied
- Cleaning
- Blocked
- Maintenance

### Dashboard Analytics
- Occupancy rates
- Category-wise availability
- Transfer statistics

---

## Module 12: Biomedical Waste Management (CPCB Compliant)

### Waste Categories
1. **Yellow** - Infectious waste (incineration)
2. **Red** - Contaminated recyclables (autoclaving)
3. **White** - Sharps (shredding)
4. **Blue** - Glass waste (chemical treatment)

### Features
- Barcode generation per bag
- Weight tracking
- Storage room monitoring
- Vendor management (CBWTF)
- Compliance reporting

### Workflows
1. Bag generation
2. Collection by housekeeping
3. Storage (48-hour limit)
4. Vendor pickup
5. Disposal verification

---

## Module 13: Oxygen Tracking System (NABH Compliant)

### Cylinder Management
- Types: B, D, Jumbo
- Status: Full, In-Use, Empty, Maintenance
- Movement logging

### Features
- Patient-wise consumption tracking
- LMO (Liquid Medical Oxygen) readings
- Low stock alerts
- Return tracking

---

## Module 14: Blood Bank (NABH/FDA Compliant)

### 10 Service Groups
1. Collection
2. Testing
3. Processing
4. Storage
5. Inventory
6. Cross-matching
7. Issue
8. Transfusion
9. Reactions
10. Quality Control

### Features
- Donor registry
- Blood unit lifecycle
- Component separation
- Temperature monitoring
- Transfusion reactions logging
- Expiry management

### Blood Components
- Whole Blood
- PRBC (Packed Red Blood Cells)
- Platelets
- FFP (Fresh Frozen Plasma)
- Cryoprecipitate
- Granulocytes

---

## Module 15: OT & ICU Swab Contamination Monitoring

### NABH-Compliant Environmental Surveillance

### Features
- Swab collection scheduling
- Lab result entry
- Auto-interpretation (PASS/ACCEPTABLE/FAIL)
- CAPA generation
- Full audit logging

### Master Data
- Area definitions
- Organism catalog
- Sampling site definitions

---

## Module 16: Disease Knowledge, Diet & Medication Scheduling

### Pre-seeded Diseases
1. Diabetes Type 2
2. Hypertension
3. Tuberculosis
4. Dengue
5. Asthma

### Features
- Disease information (ICMR/MoHFW guidelines)
- Indian diet plans
- Medication schedule templates
- AI-powered personalization (OpenAI GPT-4o)

---

## Module 17: Notification Service

### Channels
- Push notifications (WebSocket)
- Email
- SMS
- WhatsApp

### Priorities
- Low
- Medium
- High
- Critical

### Categories
- Health tips
- Hospital updates
- Emergency alerts
- OPD announcements
- Disease alerts
- General

### Features
- Role-based filtering
- Scheduled notifications
- Real-time delivery via WebSocket
- Read/unread tracking

---

## Module 18: AI Intelligence Layer (OpenAI GPT-4o)

### AI Engines
1. Doctor Efficiency Analysis
2. Nurse Efficiency Analysis
3. OPD Intelligence
4. Hospital Health Index
5. Compliance Risk Assessment
6. Predictive Analytics

### Features
- Analytics snapshots
- Anomaly detection
- Predictions (ICU load, oxygen demand)
- AI recommendations
- Hospital Health Index (daily score)

---

## Module 19: Patient Billing

### Charge Categories
- Room charges
- Doctor consultation
- Lab tests
- Medicines
- Inventory charges

### Features
- Bill generation
- Payment tracking
- Status: pending, partial, paid, cancelled
- Payment history

---

## Module 20: Chatbot Service

### Features
- OpenAI GPT-4o powered
- Context-aware responses
- Patient query handling
- Hospital information
- Multi-language support

---

## Module 21: Activity Logging

### Tracked Actions
- User login/logout
- Patient registration
- Appointment management
- Prescription activities
- Inventory transactions
- Medical record updates
- Consent form actions

### Log Details
- Action type
- Entity affected
- Performed by (user/role)
- Timestamp
- Activity type (info/success/urgent/warning)

---

## Module 22: Biometric Service

### Features
- Fingerprint recognition
- Facial recognition
- AES-256 encryption
- HIPAA compliance
- Verification logging

---

## Module 23: Pathology Lab Portal

### Features
- Complete test order management
- Sample collection with barcode tracking
- Test processing and result entry
- Report generation with validation
- Quality control (IQC/EQAS)
- Lab inventory management
- Walk-in patient report creation

### Test Catalog
- 1,148 pathology tests across 10 categories
- All departments visible with expandable sections
- Test details dialog with complete information:
  - Sample type and turnaround time
  - Price and normal range
  - Description and patient instructions
- Searchable test selection

### Walk-in Patient Reports
- Patient information form (name, age, gender, phone, address)
- Referred by field for external referrals
- Searchable test selection from full catalog
- Report details entry (result value, unit, interpretation, findings, conclusion)
- Auto-generated WALKIN-prefixed order numbers
- Staff notifications for admin/nurse

### Report Status Workflow
```
ORDERED → SAMPLE_COLLECTED → PROCESSING → COMPLETED → VERIFIED → DELIVERED
```

---

## Module 24: Medical Store Portal

### Features
- Prescription viewing from hospital doctors
- Medicine dispensing workflow
- Billing with GST calculation
- Medicine substitution approval
- Store inventory management
- Stock level and expiry tracking

### Store Types
| Type | Description |
|------|-------------|
| IN_HOUSE | Hospital's internal pharmacy |
| THIRD_PARTY | External pharmacy partners |

### Dispensing Status
```
PENDING → PARTIALLY_DISPENSED → FULLY_DISPENSED
```

### Payment Methods
- CASH
- CARD
- UPI
- INSURANCE

---

## Module 25: Hospital Services Catalog

### Overview
Comprehensive catalog of 4,830+ services across 24 departments.

### Departments (24)
1. Emergency
2. Cardiology
3. Neurology
4. Orthopedics
5. Pediatrics
6. Oncology
7. Ophthalmology
8. ENT
9. Dermatology
10. Psychiatry
11. Gynecology
12. Urology
13. Nephrology
14. Gastroenterology
15. Pulmonology
16. Endocrinology
17. Rheumatology
18. Pathology (1,148 tests)
19. Radiology
20. Physiotherapy
21. Dental
22. General Medicine
23. General Surgery
24. ICU

### Service Information
- Service code and name
- Department mapping
- Price and duration
- Description

---

## Technical Specifications

### Frontend
- React 18 with TypeScript
- Tailwind CSS with shadcn/ui
- Radix UI components
- TanStack Query v5
- Wouter routing
- Framer Motion animations

### Backend
- Node.js with Express
- Drizzle ORM
- PostgreSQL (Neon serverless)
- WebSocket for real-time
- Session-based auth

### Security
- bcrypt (10 rounds)
- Express Sessions
- Role-based access
- Audit logging
- Encrypted biometrics

### Integrations
- OpenAI GPT-4o
- Google Maps
- Email/SMS/WhatsApp (configured)

---

## Compliance Standards

- **NABH** - National Accreditation Board for Hospitals
- **CPCB** - Central Pollution Control Board (BMW)
- **FDA** - Blood Bank regulations
- **HIPAA** - Biometric data protection
- **ICMR/MoHFW** - Medical guidelines
