# HMS Core - Complete Project Documentation

## Gravity Hospital - Hospital Management System

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Hospital Information](#hospital-information)
3. [Technical Architecture](#technical-architecture)
4. [User Roles & Access Control](#user-roles--access-control)
5. [System Portals](#system-portals)
6. [Internal Services](#internal-services)
7. [New Modules (December 2025)](#new-modules-december-2025)
8. [User & System Interconnections](#user--system-interconnections)
9. [Database Schema](#database-schema)
10. [API Endpoints](#api-endpoints)
11. [Security Features](#security-features)
12. [Login Credentials](#login-credentials)
13. [Design System](#design-system)

---

## Project Overview

HMS Core is a comprehensive Hospital Management System designed specifically for **Gravity Hospital**. It provides a complete digital healthcare management solution with role-based access control, specialized portals for different user types, and fully integrated internal services for all hospital operations.

### Key Highlights

| Feature | Description |
|---------|-------------|
| **Hospital** | Gravity Hospital (Single-Tenant) |
| **User Roles** | 5 distinct roles with specific permissions |
| **Total Users** | 43 pre-configured accounts |
| **Internal Services** | 13 fully integrated hospital services |
| **Portals** | 3 specialized portals (Patient, Doctor, Staff) |
| **Security** | AES-256 encryption, bcrypt password hashing, HIPAA compliance indicators |
| **Theme** | Light/Dark mode with 6 color themes |
| **Responsive** | Fully responsive for mobile, tablet, and desktop |

---

## Hospital Information

### Gravity Hospital

| Field | Details |
|-------|---------|
| **Name** | Gravity Hospital |
| **Address** | Gat No, 167, Sahyog Nager, Triveni Nagar |
| **City** | Nigdi, Pimpri-Chinchwad |
| **State** | Maharashtra |
| **PIN Code** | 411062 |
| **Country** | India |
| **Status** | Active |
| **System** | HMS Core v2.0 |

### Hospital Departments

- Emergency Medicine
- Cardiology
- Neurology
- Orthopedics
- Pediatrics
- General Medicine
- Dermatology
- ENT (Ear, Nose, Throat)
- Gynecology
- Ophthalmology
- Psychiatry
- ICU (Intensive Care Unit)
- Operation Theater
- Radiology
- Pathology

### Service Locations (10 Pune Locations)

| Location | Area |
|----------|------|
| 1 | Kothrud, Pune |
| 2 | Wakad, Pune |
| 3 | Baner, Pune |
| 4 | Hinjewadi, Pune |
| 5 | Pimpri, Pune |
| 6 | Chikhali, Pune |
| 7 | Aundh, Pune |
| 8 | Viman Nagar, Pune |
| 9 | Koregaon Park, Pune |
| 10 | Hadapsar, Pune |

---

## Technical Architecture

### Frontend Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Component library |
| **Radix UI** | Accessible primitives |
| **Wouter** | Client-side routing |
| **TanStack Query** | Server state management |
| **React Hook Form** | Form handling |
| **Zod** | Schema validation |
| **Lucide React** | Icon library |
| **Framer Motion** | Animations |

### Backend Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **TypeScript** | Type-safe development |
| **Drizzle ORM** | Database operations |
| **PostgreSQL** | Database (Neon) |
| **bcrypt** | Password hashing (10 salt rounds) |
| **OpenAI API** | AI Chatbot integration |
| **Zod** | Request validation |

### Development Tools

| Tool | Purpose |
|------|---------|
| **Vite** | Build tool & dev server |
| **ESBuild** | Fast bundling |
| **TSX** | TypeScript execution |
| **Drizzle Kit** | Database migrations |

---

## User Roles & Access Control

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                        ADMIN                            │
│  (Full system access, user management, settings)        │
├─────────────────────────────────────────────────────────┤
│     DOCTOR          │     NURSE      │   OPD_MANAGER   │
│  (Clinical care,    │  (Assigned     │  (OPD operations,│
│   prescriptions)    │  patients only)│   scheduling)    │
├─────────────────────────────────────────────────────────┤
│                       PATIENT                           │
│         (Personal health, appointments)                 │
└─────────────────────────────────────────────────────────┘
```

### Role Permissions Matrix

| Feature | ADMIN | DOCTOR | NURSE | OPD_MANAGER | PATIENT |
|---------|:-----:|:------:|:-----:|:-----------:|:-------:|
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| Hospital Settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| OPD Service | ✅ | ✅ | ✅ | ✅ | ❌ |
| Patient Service | ✅ | ✅ | ✅* | ✅ | ❌ |
| Inventory Service | ✅ | ❌ | ✅ | ✅ | ❌ |
| Patient Tracking | ✅ | ✅ | ✅* | ✅ | ❌ |
| Biometric Service | ✅ | ✅ | ✅ | ❌ | ❌ |
| Notification Service | ✅ | ✅ | ✅* | ✅ | ✅ |
| Equipment Servicing | ✅ | ❌ | ❌ | ✅ | ❌ |
| Chatbot Service | ✅ | ✅ | ✅ | ❌ | ✅ |
| BMW Management | ✅ | ❌ | ✅ | ✅ | ❌ |
| Oxygen Tracking | ✅ | ✅ | ✅ | ✅ | ❌ |
| Consent Forms | ✅ | ✅ | ❌ | ✅ | ❌ |
| Medicine Database | ✅ | ✅ | ✅ | ✅ | ❌ |
| Doctor Portal | ❌ | ✅ | ❌ | ❌ | ❌ |
| Patient Portal | ❌ | ❌ | ❌ | ❌ | ✅ |

*NURSE restrictions: Only see assigned patients, patient-specific notifications, no Consent Forms access

### NURSE Portal Restrictions (Important)

Nurses have limited access compared to other staff roles:

| Restriction | Description |
|-------------|-------------|
| **Patient Access** | Only see patients assigned to them, not all patients |
| **Notifications** | Only receive notifications related to their assigned patients |
| **Equipment Servicing** | No access to Equipment Servicing module |
| **Consent Forms** | No access to Consent Forms tab in Patient Service |
| **Activity Log** | Only see activities related to their assigned patients |

### User Counts by Role

| Role | Count | Default Password |
|------|-------|------------------|
| ADMIN | 3 | Admin@123 |
| DOCTOR | 10 | Doctor@123 |
| PATIENT | 10 | Patient@123 |
| NURSE | 10 | Nurse@123 |
| OPD_MANAGER | 10 | OPD@123 |
| **Total** | **43** | - |

---

## System Portals

### 1. Patient Portal

Dedicated interface for patients with self-service healthcare management.

#### Sections (8 Total)

| Section | Icon | Description |
|---------|------|-------------|
| **Dashboard** | Home | Health overview with KPIs, upcoming appointments, health metrics |
| **OPD Booking** | Calendar | Book appointments with doctors by specialty and time slot |
| **Health Records** | FileText | View medical history, prescriptions, lab reports |
| **Admission Tracking** | Bed | Track current/past hospital admissions |
| **AI Health Chatbot** | Bot | 24/7 AI-powered health assistance |
| **Notifications** | Bell | Hospital updates, appointment reminders |
| **Team Directory** | Users | Contact hospital staff and doctors |
| **Profile Settings** | User | Personal information and preferences |

#### Patient Portal Features

- Personal health metrics dashboard
- Doctor availability and appointment booking
- Location-based appointment selection (10 Pune locations)
- Real-time appointment status tracking
- Medical history access
- Prescription viewer
- AI chatbot for health queries
- Push/Email/SMS notification preferences
- Emergency contact management
- Automatic appointment reminders (24h and 1h before)

### 2. Doctor Portal

Specialized clinical interface for healthcare providers.

#### Sections (7 Total)

| Section | Icon | Description |
|---------|------|-------------|
| **Dashboard** | LayoutDashboard | KPIs for appointments, patients, prescriptions |
| **Appointments** | Calendar | Today's schedule, pending, all appointments |
| **My Schedule** | Clock | Weekly schedule management with editable slots |
| **Patients** | Users | Patient list with search and detailed profiles |
| **Prescriptions** | FileText | Create and manage prescriptions |
| **Notifications** | Bell | Appointment alerts, patient updates |
| **My Profile** | User | Doctor profile and settings |

#### Doctor Portal Features

- Daily appointment overview
- Calendar-based scheduling
- Patient case history access
- Schedule editing with slot management
- Prescription creation and management
- Medicine database integration
- Real-time notification center
- Blood group color-coded patient cards
- Appointment status management (confirm/complete/cancel)
- Doctor visit tracking for admitted patients

### 3. Staff Dashboard (ADMIN, NURSE, OPD_MANAGER)

Comprehensive hospital management interface.

#### Navigation Structure

**Admin-Only Sections:**
- User Management
- Hospital Settings
- System Settings

**Shared Services:**
- Dashboard
- OPD Service
- Patient Service
- Inventory Service
- Patient Tracking
- Biometric Service
- Equipment Servicing (Not for NURSE)
- Chatbot Service
- Notification Service
- BMW Management
- Oxygen Tracking

---

## Internal Services

All services are fully integrated within the application - no external dependencies.

### 1. OPD Service

Outpatient Department management system.

| Tab | Functionality |
|-----|---------------|
| **Schedules** | View doctor schedules by date |
| **Book Appointment** | New patient appointment booking with location selection |
| **Appointments** | All appointments with status filters |
| **Check-In** | Patient arrival confirmation |
| **Team** | OPD staff directory |

**Key Features:**
- Real-time slot availability
- Calendar-based scheduling
- Location-based appointments (10 Pune locations)
- Appointment status workflow (Scheduled → Checked-in → Completed)
- Doctor specialty filtering
- Patient queue management
- Automatic reminders (24h and 1h before appointment)

### 2. Patient Service

Comprehensive patient data management.

| Tab | Functionality |
|-----|---------------|
| **Patients** | Patient demographics and profiles |
| **Admissions** | Hospital admission management |
| **Medical Records** | Clinical documentation |
| **Consent Forms** | Patient consent management (Not for NURSE) |
| **Statistics** | Patient analytics |

**Key Features:**
- Full patient registration
- Insurance information tracking
- Emergency contact management
- Admission workflow (Admit → In-treatment → Discharged)
- Medical record types (Lab Report, Diagnosis, Prescription, etc.)
- Consent form management with PDF support

### 3. Inventory Service

Hospital supplies and equipment tracking.

| Tab | Functionality |
|-----|---------------|
| **Dashboard** | Stock overview and alerts |
| **Items** | Inventory catalog |
| **Transactions** | Stock movements |
| **Issue/Return** | Item dispensing |
| **Reports** | Usage analytics |

**Categories:**
- Disposables
- Syringes
- Gloves
- Medicines
- Equipment

**Features:**
- Low stock alerts
- Issue to patient/staff
- Return tracking
- Cost calculation

### 4. Patient Tracking Service

Real-time admitted patient monitoring.

| Tab | Functionality |
|-----|---------------|
| **Patients** | Admitted patient list |
| **Medications** | Drug administration log |
| **Meals** | Diet tracking |
| **Vitals** | Vital signs monitoring |
| **Doctor Visits** | Schedule and track doctor rounds |
| **Timeline** | Patient activity log (role-based filtering) |

**Vital Signs Tracked:**
- Temperature
- Heart Rate
- Blood Pressure (Systolic/Diastolic)
- Respiratory Rate
- Oxygen Saturation (SpO2)

**Doctor Visit Features:**
- Schedule doctor rounds
- Record visit notes
- Track previous visits with timestamps
- Database persistence

**Activity Log Filtering:**
- ADMIN: See all patient activities
- NURSE: Only see activities for assigned patients

### 5. Biometric Service

Patient identity verification system.

| Tab | Functionality |
|-----|---------------|
| **Dashboard** | Verification statistics |
| **Enrollments** | Biometric registration |
| **Verifications** | Identity confirmation |
| **Audit Logs** | Security tracking |
| **Settings** | System configuration |

**Biometric Types:**
- Fingerprint (multi-finger support)
- Facial Recognition

**Security Features:**
- AES-256 encryption
- Quality scoring (0-100)
- Confidence threshold matching
- HIPAA compliance indicators
- Audit trail logging

### 6. Chatbot Service

AI-powered hospital assistant.

| Tab | Functionality |
|-----|---------------|
| **Chat** | Live AI conversation |
| **Logs** | Conversation history |
| **Statistics** | Usage analytics |
| **API Docs** | Integration guide |

**Query Categories:**
- FAQ (Hospital information)
- Insurance queries
- Doctor availability
- Appointments
- General inquiries

**Integration:**
- OpenAI GPT-powered responses
- Context-aware hospital information
- 24/7 availability

### 7. Notification Service

Multi-channel communication system.

| Tab | Functionality |
|-----|---------------|
| **Dashboard** | Notification analytics |
| **Notifications** | Message management |
| **Team** | Staff directory |

**Channels:**
- Push Notifications
- Email
- SMS
- WhatsApp

**Categories:**
- Health Tips
- Hospital Updates
- Emergency Alerts
- OPD Announcements
- Disease Alerts
- Appointment Reminders (Automatic)
- General

**Priority Levels:**
- Low
- Medium
- High
- Critical

**Automatic Reminders:**
- 24 hours before appointment
- 1 hour before appointment

### 8. Equipment Servicing

Medical equipment maintenance tracking. **Not accessible to NURSE role.**

| Tab | Functionality |
|-----|---------------|
| **Equipment** | Asset inventory |
| **Calendar** | Service schedule |
| **Emergency Contacts** | Vendor directory |

**Equipment Categories:**
- Radiology (X-Ray, CT, MRI)
- Cardiology (ECG, Defibrillator)
- ICU (Ventilators, Monitors)
- General (Ultrasound, Anesthesia)

**Service Status:**
- Up-to-date
- Due Soon
- Overdue

---

## New Modules (December 2025)

### 9. Biomedical Waste Management (BMW)

Complete CPCB-compliant waste tracking system for hospital biomedical waste.

| Tab | Functionality |
|-----|---------------|
| **Dashboard** | Waste overview and compliance status |
| **Bag Tracking** | Barcode-based waste bag lifecycle |
| **Storage Rooms** | Temporary storage monitoring |
| **Pickups** | Vendor pickup scheduling |
| **Disposals** | Final disposal records |
| **Incidents** | Injury/exposure reporting |
| **Reports** | Compliance reporting |
| **Vendors** | CBWTF vendor registry |

**Waste Categories (CPCB Color Coded):**

| Color | Category | Waste Type |
|-------|----------|------------|
| **Yellow** | Incineration | Anatomical, soiled, chemotherapy waste |
| **Red** | Autoclaving/Microwaving | Contaminated recyclables, tubing |
| **White** | Sharps | Needles, syringes, blades |
| **Blue** | Autoclaving + Shredding | Glassware, metallic sharps |

**Bag Status Workflow:**
```
CREATED → FILLED → SEALED → IN_STORAGE → PICKED_UP → DISPOSED
```

**Key Features:**
- Barcode-based bag tracking
- Weight recording (kg)
- Storage room capacity monitoring
- Vendor pickup scheduling
- Disposal method tracking (Incineration, Autoclaving, Deep Burial, etc.)
- Incident reporting (needle-stick injuries, spills, exposure)
- Compliance reports (Daily, Weekly, Monthly, Quarterly)

**Database Tables:**
- `bmwBags` - Core bag tracking
- `bmwMovements` - Bag movement history
- `bmwPickups` - Vendor pickup records
- `bmwDisposals` - Final disposal records
- `bmwVendors` - CBWTF vendor registry
- `bmwStorageRooms` - Temporary storage locations
- `bmwIncidents` - Incident reports
- `bmwReports` - Compliance reports

### 10. Oxygen Tracking System

NABH-compliant oxygen management for hospital oxygen supply.

| Tab | Functionality |
|-----|---------------|
| **Dashboard** | Oxygen inventory overview |
| **Cylinders** | Cylinder inventory management |
| **Movements** | Assignment and return logging |
| **Consumption** | Usage tracking by ward/patient |
| **LMO Readings** | Liquid Medical Oxygen tank levels |
| **Alerts** | Low stock and critical notifications |

**Cylinder Tracking:**

| Field | Description |
|-------|-------------|
| Serial Number | Unique cylinder identifier |
| Capacity | Cylinder size (liters) |
| Status | Full, In-Use, Empty, Under Maintenance |
| Location | Current ward/department |
| Last Fill Date | Most recent refill |

**Movement Types:**
- Issue to Ward
- Return to Storage
- Send for Refill
- Maintenance

**LMO (Liquid Medical Oxygen) Monitoring:**
- Tank level readings
- Daily consumption tracking
- Auto-alerts at threshold levels
- NABH compliance dashboard

**Alert Types:**
- Low Stock Warning
- Critical Level Alert
- Cylinder Expiry
- LMO Threshold

**Database Tables:**
- `oxygenCylinders` - Cylinder inventory
- `cylinderMovements` - Assignment/return logs
- `oxygenConsumption` - Usage tracking
- `lmoReadings` - LMO tank levels
- `oxygenAlerts` - System alerts

### 11. Consent Forms Management

Digital consent form management with PDF support.

| Tab | Functionality |
|-----|---------------|
| **Templates** | Consent form templates |
| **Patient Consents** | Signed consent records |
| **Pending** | Consents awaiting signature |

**Consent Types:**
- General Treatment Consent
- Surgical Consent
- Anesthesia Consent
- Blood Transfusion Consent
- Procedure-Specific Consent
- Research Participation Consent

**Features:**
- Template-based form generation
- PDF upload/download/print
- Patient signature capture
- Version control
- Expiry tracking
- Status tracking (Pending, Signed, Expired)

**Workflow:**
```
CREATE TEMPLATE → GENERATE FOR PATIENT → PATIENT SIGNS → ARCHIVE
```

**Database Tables:**
- `consentForms` - Consent templates
- `patientConsents` - Patient consent records

### 12. Prescription Management

Comprehensive prescription creation and management.

**Features:**
- Doctor prescription creation
- Medicine database integration
- Dosage and frequency selection
- Prescription printing/PDF
- Patient prescription history
- Digital prescription delivery

**Prescription Fields:**
- Patient information
- Medicine name (from database)
- Dosage
- Frequency
- Duration
- Special instructions
- Doctor signature

### 13. Medicine Database

Searchable database of Indian medicines for OPD management.

**Features:**
- 5000+ Indian medicines
- CSV import functionality for bulk updates
- Generic name search
- Brand name search
- Dosage information
- Composition details
- Category filtering

**Search Capabilities:**
- By generic name
- By brand name
- By manufacturer
- By category
- By composition

**OPD Manager Access:**
- Import medicines via CSV
- Add/Edit medicine entries
- Manage categories
- Update pricing

**Database Table:**
- `medicines` - Medicine database

---

## User & System Interconnections

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PATIENT PORTAL                              │
│  ┌─────────┐   ┌──────────┐   ┌─────────┐   ┌──────────────────┐   │
│  │Dashboard├───│OPD Booking├───│Chatbot  │───│Notifications     │   │
│  └────┬────┘   └────┬─────┘   └────┬────┘   └────────┬─────────┘   │
└───────┼─────────────┼──────────────┼─────────────────┼─────────────┘
        │             │              │                 │
        ▼             ▼              ▼                 ▼
┌───────────────────────────────────────────────────────────────────┐
│                        BACKEND API                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │Appointments│  │   Doctors  │  │  Chatbot   │  │Notifications│   │
│  │   API      │  │    API     │  │    API     │  │    API      │   │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬───────┘   │
└────────┼───────────────┼───────────────┼───────────────┼───────────┘
         │               │               │               │
         ▼               ▼               ▼               ▼
┌───────────────────────────────────────────────────────────────────┐
│                     POSTGRESQL DATABASE                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │appointments│  │  doctors   │  │conversation│  │notifications│   │
│  │            │  │  schedules │  │   _logs    │  │team_members │   │
│  └────────────┘  └────────────┘  └────────────┘  └────────────────┘│
└───────────────────────────────────────────────────────────────────┘
```

### Extended Service Dependencies

```
┌─────────────────────────────────────────────────────────────────────┐
│                        OPD SERVICE                                  │
│                            │                                        │
│              ┌─────────────┼─────────────┐                         │
│              ▼             ▼             ▼                         │
│     ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│     │  PATIENT   │  │  DOCTOR    │  │  SCHEDULE  │                │
│     │  SERVICE   │  │  DATA      │  │  DATA      │                │
│     └─────┬──────┘  └─────┬──────┘  └────────────┘                │
│           │               │                                        │
│           ▼               ▼                                        │
│  ┌─────────────────────────────────────────┐                      │
│  │            PATIENT TRACKING              │                      │
│  │  ┌────────────┐ ┌────────────┐ ┌───────┐│                      │
│  │  │Medications │ │   Vitals   │ │ Meals ││                      │
│  │  └────────────┘ └────────────┘ └───────┘│                      │
│  │  ┌────────────────────────────────────┐ │                      │
│  │  │         Doctor Visits              │ │                      │
│  │  └────────────────────────────────────┘ │                      │
│  └───────────────────┬─────────────────────┘                      │
│                      │                                             │
│    ┌─────────────────┼─────────────────┐                          │
│    ▼                 ▼                 ▼                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                        │
│  │INVENTORY │  │BIOMETRIC │  │EQUIPMENT │                        │
│  │ SERVICE  │  │ SERVICE  │  │SERVICING │                        │
│  └──────────┘  └──────────┘  └──────────┘                        │
│                      │                                             │
│    ┌─────────────────┼─────────────────┐                          │
│    ▼                 ▼                 ▼                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                        │
│  │   BMW    │  │  OXYGEN  │  │ CONSENT  │                        │
│  │MANAGEMENT│  │ TRACKING │  │  FORMS   │                        │
│  └──────────┘  └──────────┘  └──────────┘                        │
│                      │                                             │
│                      ▼                                             │
│              ┌──────────────┐                                     │
│              │ NOTIFICATION │                                     │
│              │   SERVICE    │                                     │
│              └──────────────┘                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Appointment Workflow

```
Patient Books Appointment (with Location Selection)
         │
         ▼
┌─────────────────┐
│ Status: SCHEDULED│◄──── Auto-reminder set (24h & 1h)
└────────┬────────┘
         │
         ▼ (24h before)
┌─────────────────────────┐
│ Reminder Notification    │──── Push/Email/SMS/WhatsApp
└─────────────────────────┘
         │
         ▼ (1h before)
┌─────────────────────────┐
│ Final Reminder           │──── Push/Email/SMS/WhatsApp
└─────────────────────────┘
         │
         ▼ (Patient arrives)
┌─────────────────┐
│ Status: CHECKED_IN│◄──── OPD Manager / Nurse
└────────┬────────┘
         │
         ▼ (Doctor consultation)
┌─────────────────┐
│ Status: COMPLETED │◄──── Doctor
└────────┬────────┘
         │
         ├──► If Admission Required ──► Patient Service (Admission)
         │                                    │
         │                                    ▼
         │                            Patient Tracking
         │                            (Medications, Vitals, Meals, Doctor Visits)
         │
         └──► Follow-up Notification ──► Notification Service
```

### BMW Waste Lifecycle

```
┌──────────────────────────────────────────────────────────────────┐
│                     BMW WASTE LIFECYCLE                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. BAG CREATION                                                 │
│     Generate barcode → Assign category (Yellow/Red/White/Blue)   │
│                                                                   │
│  2. FILLING                                                      │
│     Status: CREATED → FILLED                                     │
│     └── Record department, generated by                          │
│                                                                   │
│  3. SEALING                                                      │
│     Status: FILLED → SEALED                                      │
│     └── Record weight (kg), seal timestamp                       │
│                                                                   │
│  4. STORAGE                                                      │
│     Status: SEALED → IN_STORAGE                                  │
│     └── Assign to storage room, capacity check                   │
│                                                                   │
│  5. PICKUP                                                       │
│     Status: IN_STORAGE → PICKED_UP                               │
│     └── Vendor assigned, vehicle number, pickup manifest         │
│                                                                   │
│  6. DISPOSAL                                                     │
│     Status: PICKED_UP → DISPOSED                                 │
│     └── Disposal method, certificate number, final location      │
│                                                                   │
│  7. COMPLIANCE REPORTING                                         │
│     └── Daily, Weekly, Monthly, Quarterly reports                │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATABASE TABLES                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CORE TABLES                    TRACKING TABLES                     │
│  ┌────────────┐                ┌─────────────────┐                 │
│  │   users    │                │tracking_patients│                 │
│  ├────────────┤                ├─────────────────┤                 │
│  │   doctors  │◄───────────────│   medications   │                 │
│  ├────────────┤                ├─────────────────┤                 │
│  │  schedules │                │      meals      │                 │
│  ├────────────┤                ├─────────────────┤                 │
│  │appointments│                │     vitals      │                 │
│  ├────────────┤                ├─────────────────┤                 │
│  │prescriptions│               │  doctor_visits  │                 │
│  └────────────┘                └─────────────────┘                 │
│                                                                     │
│  PATIENT SERVICE                INVENTORY TABLES                    │
│  ┌─────────────────┐           ┌──────────────────┐                │
│  │service_patients │           │ inventory_items  │                │
│  ├─────────────────┤           ├──────────────────┤                │
│  │   admissions    │           │inventory_patients│                │
│  ├─────────────────┤           ├──────────────────┤                │
│  │ medical_records │           │  staff_members   │                │
│  ├─────────────────┤           ├──────────────────┤                │
│  │ consent_forms   │           │inventory_trans   │                │
│  ├─────────────────┤           └──────────────────┘                │
│  │patient_consents │                                               │
│  └─────────────────┘                                               │
│                                                                     │
│  BIOMETRIC TABLES               NOTIFICATION TABLES                 │
│  ┌──────────────────┐          ┌───────────────────┐               │
│  │biometric_templates│          │   notifications   │               │
│  ├──────────────────┤          ├───────────────────┤               │
│  │biometric_verify  │          │user_notifications │               │
│  └──────────────────┘          ├───────────────────┤               │
│                                │hospital_team_memb │               │
│  CHATBOT TABLES                └───────────────────┘               │
│  ┌──────────────────┐                                              │
│  │conversation_logs │          EQUIPMENT TABLES                    │
│  └──────────────────┘          ┌───────────────────┐               │
│                                │    equipment      │               │
│  MEDICINE TABLES               ├───────────────────┤               │
│  ┌──────────────────┐          │  service_history  │               │
│  │    medicines     │          └───────────────────┘               │
│  └──────────────────┘                                              │
│                                                                     │
│  BMW TABLES                     OXYGEN TABLES                       │
│  ┌──────────────────┐          ┌───────────────────┐               │
│  │    bmw_bags      │          │ oxygen_cylinders  │               │
│  ├──────────────────┤          ├───────────────────┤               │
│  │  bmw_movements   │          │cylinder_movements │               │
│  ├──────────────────┤          ├───────────────────┤               │
│  │   bmw_pickups    │          │oxygen_consumption │               │
│  ├──────────────────┤          ├───────────────────┤               │
│  │  bmw_disposals   │          │   lmo_readings    │               │
│  ├──────────────────┤          ├───────────────────┤               │
│  │   bmw_vendors    │          │  oxygen_alerts    │               │
│  ├──────────────────┤          └───────────────────┘               │
│  │bmw_storage_rooms │                                              │
│  ├──────────────────┤                                              │
│  │  bmw_incidents   │                                              │
│  ├──────────────────┤                                              │
│  │   bmw_reports    │                                              │
│  └──────────────────┘                                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | System authentication | id, username, password (bcrypt hashed) |
| `doctors` | Doctor profiles | name, specialty, experience, rating |
| `schedules` | Doctor availability | doctorId, date, timeSlot, isBooked |
| `appointments` | OPD bookings | patientName, doctorId, date, status, location |
| `service_patients` | Patient demographics | firstName, lastName, DOB, insurance |
| `admissions` | Hospital stays | patientId, department, roomNumber, status |
| `medical_records` | Clinical documents | patientId, recordType, description |
| `tracking_patients` | Admitted patients | name, room, diagnosis, doctor |
| `medications` | Drug administration | patientId, name, dosage, administeredBy |
| `vitals` | Vital signs | patientId, temperature, heartRate, BP |
| `meals` | Diet tracking | patientId, mealType, calories |
| `doctor_visits` | Doctor rounds | patientId, doctorName, visitTime, notes |
| `prescriptions` | Medical prescriptions | patientId, doctorId, medicines, dosage |
| `medicines` | Medicine database | genericName, brandName, dosage, composition |
| `consent_forms` | Consent templates | title, content, version |
| `patient_consents` | Patient consents | patientId, consentFormId, status, signedAt |
| `inventory_items` | Hospital supplies | name, category, currentStock |
| `inventory_transactions` | Stock movements | type, itemId, quantity |
| `biometric_templates` | Encrypted biometrics | patientId, templateData (AES-256), quality |
| `biometric_verifications` | Verification logs | patientId, confidenceScore, isMatch |
| `conversation_logs` | Chatbot history | query, response, category |
| `notifications` | Hospital messages | title, message, channels, priority |
| `user_notifications` | User-specific notifications | userId, notificationId, readAt |
| `hospital_team_members` | Staff directory | name, department, phone, isOnCall |
| `equipment` | Medical equipment | name, category, status, lastServiceDate |
| `service_history` | Equipment service logs | equipmentId, serviceDate, technician |
| `bmw_bags` | Waste bags | barcode, category, status, weight |
| `bmw_movements` | Bag movements | bagId, action, location, timestamp |
| `bmw_pickups` | Vendor pickups | vendorId, pickupDate, bagCount |
| `bmw_disposals` | Disposal records | bagId, method, certificateNumber |
| `bmw_vendors` | CBWTF vendors | name, license, contactInfo |
| `bmw_storage_rooms` | Storage locations | name, capacity, currentLoad |
| `bmw_incidents` | Incident reports | type, description, severity |
| `bmw_reports` | Compliance reports | reportType, period, data |
| `oxygen_cylinders` | Cylinder inventory | serialNumber, capacity, status |
| `cylinder_movements` | Movement logs | cylinderId, action, ward, timestamp |
| `oxygen_consumption` | Usage tracking | ward, consumedLiters, date |
| `lmo_readings` | LMO tank levels | tankLevel, readingTime |
| `oxygen_alerts` | System alerts | alertType, message, severity |

---

## API Endpoints

### Appointments API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments` | Get all appointments |
| GET | `/api/appointments/status/:status` | Filter by status |
| POST | `/api/appointments` | Create appointment |
| POST | `/api/appointments/:id/checkin` | Check-in patient |
| PATCH | `/api/appointments/:id/cancel` | Cancel appointment |

### Doctors API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | Get all doctors |
| GET | `/api/doctors/:id` | Get doctor by ID |
| GET | `/api/doctors/:id/schedules` | Get doctor schedules |

### Inventory API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/items` | Get all items |
| GET | `/api/inventory/items/low-stock` | Get low stock items |
| GET | `/api/inventory/transactions` | Get transactions |
| POST | `/api/inventory/transactions` | Create transaction |
| GET | `/api/inventory/reports` | Get inventory reports |

### Patient Service API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients/service` | Get all patients |
| GET | `/api/patients/assigned/:nurseId` | Get patients assigned to nurse |
| POST | `/api/patients/service` | Create patient |
| GET | `/api/admissions` | Get all admissions |
| GET | `/api/admissions/active` | Get active admissions |
| POST | `/api/admissions` | Create admission |
| PATCH | `/api/admissions/:id` | Update admission |
| GET | `/api/medical-records` | Get medical records |
| POST | `/api/medical-records` | Create medical record |

### Patient Tracking API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tracking/patients` | Get tracked patients |
| POST | `/api/tracking/patients` | Add patient to tracking |
| POST | `/api/tracking/medications` | Log medication |
| POST | `/api/tracking/meals` | Log meal |
| POST | `/api/tracking/vitals` | Log vitals |
| GET | `/api/tracking/doctor-visits/:patientId` | Get doctor visits |
| POST | `/api/tracking/doctor-visits` | Create doctor visit |

### Biometric API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/biometric/templates` | Get all templates |
| POST | `/api/biometric/enroll` | Enroll biometric |
| POST | `/api/biometric/verify` | Verify identity |
| GET | `/api/biometric/verifications` | Get verification logs |
| GET | `/api/biometric/stats` | Get statistics |

### Chatbot API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chatbot/message` | Send message |
| GET | `/api/chatbot/logs` | Get conversation logs |
| GET | `/api/chatbot/stats` | Get usage statistics |

### Notification API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get all notifications |
| POST | `/api/notifications` | Create notification |
| POST | `/api/notifications/:id/send` | Send notification |
| PATCH | `/api/notifications/:id` | Update notification |
| DELETE | `/api/notifications/:id` | Delete notification |
| GET | `/api/team-members` | Get team directory |

### BMW API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bmw/bags` | Get all bags |
| POST | `/api/bmw/bags` | Create bag |
| PATCH | `/api/bmw/bags/:id` | Update bag status |
| GET | `/api/bmw/movements` | Get movements |
| POST | `/api/bmw/movements` | Log movement |
| GET | `/api/bmw/pickups` | Get pickups |
| POST | `/api/bmw/pickups` | Schedule pickup |
| GET | `/api/bmw/disposals` | Get disposals |
| POST | `/api/bmw/disposals` | Record disposal |
| GET | `/api/bmw/vendors` | Get vendors |
| POST | `/api/bmw/vendors` | Add vendor |
| GET | `/api/bmw/storage-rooms` | Get storage rooms |
| GET | `/api/bmw/incidents` | Get incidents |
| POST | `/api/bmw/incidents` | Report incident |
| GET | `/api/bmw/reports` | Get reports |
| POST | `/api/bmw/reports` | Generate report |

### Oxygen API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/oxygen/cylinders` | Get all cylinders |
| POST | `/api/oxygen/cylinders` | Add cylinder |
| PATCH | `/api/oxygen/cylinders/:id` | Update cylinder |
| GET | `/api/oxygen/movements` | Get movements |
| POST | `/api/oxygen/movements` | Log movement |
| GET | `/api/oxygen/consumption` | Get consumption |
| POST | `/api/oxygen/consumption` | Record consumption |
| GET | `/api/oxygen/lmo-readings` | Get LMO readings |
| POST | `/api/oxygen/lmo-readings` | Add LMO reading |
| GET | `/api/oxygen/alerts` | Get alerts |

### Consent Forms API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/consent-forms` | Get all templates |
| POST | `/api/consent-forms` | Create template |
| GET | `/api/patient-consents` | Get patient consents |
| POST | `/api/patient-consents` | Create consent record |
| PATCH | `/api/patient-consents/:id` | Update consent status |

### Medicines API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/medicines` | Get all medicines |
| GET | `/api/medicines/search` | Search medicines |
| POST | `/api/medicines` | Add medicine |
| POST | `/api/medicines/import` | Import CSV |

---

## Security Features

### Authentication & Authorization

| Feature | Implementation |
|---------|----------------|
| **Password Hashing** | bcrypt with 10 salt rounds |
| **Session Management** | Express sessions with PostgreSQL store |
| **Role-Based Access** | 5 distinct user roles with permissions |
| **Route Protection** | Server-side and client-side guards |
| **NURSE Restrictions** | Server-side enforcement for assigned patients only |

### Data Protection

| Feature | Implementation |
|---------|----------------|
| **Biometric Encryption** | AES-256 encryption for templates |
| **Encryption IV** | Unique initialization vectors |
| **Database Security** | Neon PostgreSQL with TLS |
| **API Validation** | Zod schema validation |

### Compliance Indicators

| Standard | Status |
|----------|--------|
| **HIPAA** | Compliance indicators present |
| **CPCB** | BMW module follows guidelines |
| **NABH** | Oxygen tracking compliance |
| **Data Encryption** | AES-256 for sensitive data |
| **Audit Logging** | Biometric verification logs |
| **Access Control** | Role-based permission matrix |

---

## Login Credentials

### Quick Test Accounts

| Role | Username | Password |
|------|----------|----------|
| ADMIN | admin | 123456 |
| DOCTOR | doctor | 123456 |
| PATIENT | patient | 123456 |
| OPD_MANAGER | opd | 123456 |
| NURSE | nurse.asha.patil | Nurse@123 |

### All Administrators (3)

| Name | Username | Password |
|------|----------|----------|
| Dr. Suhas Nair | admin.suhas.nair | Admin@123 |
| Shweta Kulkarni | admin.shweta.kulkarni | Admin@123 |
| Ravi Sharma | admin.ravi.sharma | Admin@123 |

### All Doctors (10)

| Name | Username | Password | Specialty |
|------|----------|----------|-----------|
| Dr. Anil Kulkarni | dr.anil.kulkarni | Doctor@123 | Cardiology |
| Dr. Snehal Patil | dr.snehal.patil | Doctor@123 | Neurology |
| Dr. Vikram Deshpande | dr.vikram.deshpande | Doctor@123 | Orthopedics |
| Dr. Priyanka Joshi | dr.priyanka.joshi | Doctor@123 | Pediatrics |
| Dr. Rajesh Bhosale | dr.rajesh.bhosale | Doctor@123 | General Medicine |
| Dr. Meena Sharma | dr.meena.sharma | Doctor@123 | Dermatology |
| Dr. Sunil Gaikwad | dr.sunil.gaikwad | Doctor@123 | ENT |
| Dr. Kavita Deshmukh | dr.kavita.deshmukh | Doctor@123 | Gynecology |
| Dr. Amit Jadhav | dr.amit.jadhav | Doctor@123 | Ophthalmology |
| Dr. Sunita Pawar | dr.sunita.pawar | Doctor@123 | Psychiatry |

### All Patients (10)

| Name | Username | Password | Location |
|------|----------|----------|----------|
| Rohan Patil | rohan.patil | Patient@123 | Kothrud, Pune |
| Priya Sharma | priya.sharma | Patient@123 | Wakad, Pune |
| Sanjay Kulkarni | sanjay.kulkarni | Patient@123 | Baner, Pune |
| Anjali Deshmukh | anjali.deshmukh | Patient@123 | Hinjewadi, Pune |
| Vikrant Jadhav | vikrant.jadhav | Patient@123 | Pimpri, Pune |
| Neha Bhosale | neha.bhosale | Patient@123 | Chikhali, Pune |
| Aditya Gaikwad | aditya.gaikwad | Patient@123 | Aundh, Pune |
| Sneha Pawar | sneha.pawar | Patient@123 | Viman Nagar, Pune |
| Rahul Deshpande | rahul.deshpande | Patient@123 | Koregaon Park, Pune |
| Kavita Joshi | kavita.joshi | Patient@123 | Hadapsar, Pune |

### All Nurses (10)

| Name | Username | Password | Department |
|------|----------|----------|------------|
| Nurse Asha Patil | nurse.asha.patil | Nurse@123 | General Ward |
| Nurse Rekha Sharma | nurse.rekha.sharma | Nurse@123 | ICU |
| Nurse Sunita Kulkarni | nurse.sunita.kulkarni | Nurse@123 | Emergency |
| Nurse Pooja Deshmukh | nurse.pooja.deshmukh | Nurse@123 | Pediatrics |
| Nurse Meena Jadhav | nurse.meena.jadhav | Nurse@123 | OPD |
| Nurse Kavita Bhosale | nurse.kavita.bhosale | Nurse@123 | Surgery |
| Nurse Anjali Gaikwad | nurse.anjali.gaikwad | Nurse@123 | Cardiology |
| Nurse Priya Pawar | nurse.priya.pawar | Nurse@123 | Neurology |
| Nurse Neha Deshpande | nurse.neha.deshpande | Nurse@123 | Orthopedics |
| Nurse Snehal Joshi | nurse.snehal.joshi | Nurse@123 | Maternity |

### All OPD Managers (10)

| Name | Username | Password | Department |
|------|----------|----------|------------|
| Mahesh Patil | opd.mahesh.patil | OPD@123 | General OPD |
| Prashant Sharma | opd.prashant.sharma | OPD@123 | Cardiology OPD |
| Sandeep Kulkarni | opd.sandeep.kulkarni | OPD@123 | Neurology OPD |
| Rajesh Deshmukh | opd.rajesh.deshmukh | OPD@123 | Orthopedics OPD |
| Suresh Jadhav | opd.suresh.jadhav | OPD@123 | Pediatrics OPD |
| Ajay Bhosale | opd.ajay.bhosale | OPD@123 | ENT OPD |
| Vijay Gaikwad | opd.vijay.gaikwad | OPD@123 | Dermatology OPD |
| Nitin Pawar | opd.nitin.pawar | OPD@123 | Gynecology OPD |
| Prakash Deshpande | opd.prakash.deshpande | OPD@123 | Ophthalmology OPD |
| Avinash Joshi | opd.avinash.joshi | OPD@123 | Psychiatry OPD |

---

## Design System

### Color Themes (6 Available)

| Theme | Primary Color | Description |
|-------|---------------|-------------|
| **Healthcare Blue** | #2563eb | Default medical blue |
| **Medical Teal** | #0d9488 | Calming teal |
| **Clinical Green** | #16a34a | Fresh green |
| **Warm Coral** | #f97316 | Warm orange |
| **Purple** | #9333ea | Royal purple |
| **Indigo** | #4f46e5 | Deep indigo |

### Color Palette

| Color | CSS Variable | Usage |
|-------|--------------|-------|
| **Primary** | `--primary` | Headers, buttons, links |
| **Success Green** | `--success` | Confirmed, available |
| **Warning Yellow** | `--warning` | Due soon, pending |
| **Error Red** | `--destructive` | Critical, overdue |
| **Muted Gray** | `--muted` | Secondary text |

### Typography

| Element | Font | Weight |
|---------|------|--------|
| **Headings** | Inter | Bold (700) |
| **Body** | Inter | Regular (400) |
| **Labels** | Inter | Medium (500) |
| **Mono** | JetBrains Mono | Regular |

### Component Library

- shadcn/ui components
- Radix UI primitives
- Lucide React icons
- Framer Motion animations
- Custom hospital-themed cards
- Medical-grade status badges

### Theme Support

| Mode | Background | Text |
|------|------------|------|
| **Light** | White/Gray | Dark Gray/Black |
| **Dark** | Dark Gray/Black | White/Light Gray |

### Responsive Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| **sm** | 640px | Mobile phones |
| **md** | 768px | Tablets |
| **lg** | 1024px | Small laptops |
| **xl** | 1280px | Desktops |
| **2xl** | 1536px | Large monitors |

---

## File Structure

```
hms-core/
├── client/
│   └── src/
│       ├── components/          # Reusable UI components
│       │   ├── ui/              # shadcn components
│       │   ├── HMSSidebar.tsx   # Main navigation with role-based access
│       │   ├── HMSDashboard.tsx # Dashboard component
│       │   ├── AuthForms.tsx    # Login/Register
│       │   └── ThemeToggle.tsx  # Dark mode & theme toggle
│       ├── pages/               # Route components
│       │   ├── PatientPortal.tsx
│       │   ├── DoctorPortal.tsx
│       │   ├── OPDService.tsx
│       │   ├── PatientService.tsx
│       │   ├── InventoryService.tsx
│       │   ├── PatientTrackingService.tsx
│       │   ├── BiometricService.tsx
│       │   ├── ChatbotService.tsx
│       │   ├── NotificationService.tsx
│       │   ├── EquipmentServicing.tsx
│       │   ├── BiowastePage.tsx      # BMW Management
│       │   ├── OxygenTracker.tsx     # Oxygen Tracking
│       │   ├── ConsentForms.tsx      # Consent Management
│       │   ├── UserManagement.tsx
│       │   ├── HospitalSettings.tsx
│       │   └── SystemSettings.tsx
│       ├── hooks/               # Custom hooks
│       ├── lib/                 # Utilities
│       └── App.tsx              # Main app with routing
├── server/
│   ├── routes.ts                # API endpoints
│   ├── storage.ts               # Storage interface & MemStorage
│   ├── database-storage.ts      # PostgreSQL implementation
│   ├── db.ts                    # Database connection
│   └── index.ts                 # Server entry
├── shared/
│   └── schema.ts                # Database schema & types
├── credentials/                 # Login credential files
├── PROJECT_DOCUMENTATION.md     # This file
├── design_guidelines.md         # UI/UX guidelines
└── replit.md                    # Project summary
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | Dec 2025 | Added BMW, Oxygen Tracking, Consent Forms, Medicine Database, NURSE restrictions |
| 1.0.0 | Dec 2024 | Initial release with 8 core services |

---

## Support

**Gravity Hospital IT Department**

- **Address:** Gat No, 167, Sahyog Nager, Triveni Nagar, Nigdi, Pimpri-Chinchwad, Maharashtra 411062
- **System:** HMS Core v2.0

---

*This document serves as the complete technical and operational reference for the Gravity Hospital Management System.*
