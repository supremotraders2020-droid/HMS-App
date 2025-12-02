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
7. [User & System Interconnections](#user--system-interconnections)
8. [Database Schema](#database-schema)
9. [API Endpoints](#api-endpoints)
10. [Security Features](#security-features)
11. [Login Credentials](#login-credentials)
12. [Design System](#design-system)

---

## Project Overview

HMS Core is a comprehensive Hospital Management System designed specifically for **Gravity Hospital**. It provides a complete digital healthcare management solution with role-based access control, specialized portals for different user types, and fully integrated internal services for all hospital operations.

### Key Highlights

| Feature | Description |
|---------|-------------|
| **Hospital** | Gravity Hospital (Single-Tenant) |
| **User Roles** | 5 distinct roles with specific permissions |
| **Total Users** | 43 pre-configured accounts |
| **Internal Services** | 8 fully integrated hospital services |
| **Portals** | 3 specialized portals (Patient, Doctor, Staff) |
| **Security** | AES-256 encryption, HIPAA compliance indicators |
| **Theme** | Light/Dark mode with medical-grade design |

---

## Hospital Information

### Gravity Hospital

| Field | Details |
|-------|---------|
| **Name** | Gravity Hospital |
| **Address** | Sane Chowk, Nair Colony, More Vasti |
| **City** | Chikhali, Pimpri-Chinchwad |
| **State** | Maharashtra |
| **PIN Code** | 411062 |
| **Country** | India |
| **Status** | Active |
| **System** | HMS Core v1.0 |

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

### Backend Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **TypeScript** | Type-safe development |
| **Drizzle ORM** | Database operations |
| **PostgreSQL** | Database (Neon) |
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
│  (Clinical care,    │  (Patient care,│  (OPD operations,│
│   prescriptions)    │   tracking)    │   scheduling)    │
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
| Patient Service | ✅ | ✅ | ✅ | ✅ | ❌ |
| Inventory Service | ✅ | ❌ | ✅ | ✅ | ❌ |
| Patient Tracking | ✅ | ✅ | ✅ | ✅ | ❌ |
| Biometric Service | ✅ | ✅ | ✅ | ❌ | ❌ |
| Notification Service | ✅ | ✅ | ✅ | ✅ | ✅ |
| Equipment Servicing | ✅ | ❌ | ✅ | ✅ | ❌ |
| Chatbot Service | ✅ | ✅ | ✅ | ❌ | ✅ |
| Doctor Portal | ❌ | ✅ | ❌ | ❌ | ❌ |
| Patient Portal | ❌ | ❌ | ❌ | ❌ | ✅ |

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
- Real-time appointment status tracking
- Medical history access
- Prescription viewer
- AI chatbot for health queries
- Push/Email/SMS notification preferences
- Emergency contact management

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
- Patient case history access
- Schedule editing with slot management
- Prescription creation and management
- Real-time notification center
- Blood group color-coded patient cards
- Appointment status management (confirm/complete/cancel)

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
- Equipment Servicing
- Chatbot Service
- Notification Service

---

## Internal Services

All services are fully integrated within the application - no external dependencies.

### 1. OPD Service

Outpatient Department management system.

| Tab | Functionality |
|-----|---------------|
| **Schedules** | View doctor schedules by date |
| **Book Appointment** | New patient appointment booking |
| **Appointments** | All appointments with status filters |
| **Check-In** | Patient arrival confirmation |
| **Team** | OPD staff directory |

**Key Features:**
- Real-time slot availability
- Appointment status workflow (Scheduled → Checked-in → Completed)
- Doctor specialty filtering
- Patient queue management

### 2. Patient Service

Comprehensive patient data management.

| Tab | Functionality |
|-----|---------------|
| **Patients** | Patient demographics and profiles |
| **Admissions** | Hospital admission management |
| **Medical Records** | Clinical documentation |
| **Statistics** | Patient analytics |

**Key Features:**
- Full patient registration
- Insurance information tracking
- Emergency contact management
- Admission workflow (Admit → In-treatment → Discharged)
- Medical record types (Lab Report, Diagnosis, Prescription, etc.)

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
| **Timeline** | Patient activity log |

**Vital Signs Tracked:**
- Temperature
- Heart Rate
- Blood Pressure (Systolic/Diastolic)
- Respiratory Rate
- Oxygen Saturation (SpO2)

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
- General

**Priority Levels:**
- Low
- Medium
- High
- Critical

### 8. Equipment Servicing

Medical equipment maintenance tracking.

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

### User Interaction Matrix

| From \ To | Patient | Doctor | Nurse | OPD Manager | Admin |
|-----------|:-------:|:------:|:-----:|:-----------:|:-----:|
| **Patient** | - | Books Appointment | - | - | - |
| **Doctor** | Treats Patient | - | Delegates Care | - | - |
| **Nurse** | Administers Care | Reports to Doctor | - | Reports Status | - |
| **OPD Manager** | Schedules | Manages Schedule | Coordinates | - | Reports |
| **Admin** | Manages Account | Manages Account | Manages Account | Manages Account | - |

### Service Dependencies

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
│  └───────────────────┬─────────────────────┘                      │
│                      │                                             │
│        ┌─────────────┼─────────────┐                              │
│        ▼             ▼             ▼                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                        │
│  │INVENTORY │  │BIOMETRIC │  │EQUIPMENT │                        │
│  │ SERVICE  │  │ SERVICE  │  │SERVICING │                        │
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
Patient Books Appointment
         │
         ▼
┌─────────────────┐
│ Status: SCHEDULED│
└────────┬────────┘
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
         │                            (Medications, Vitals, Meals)
         │
         └──► Follow-up Notification ──► Notification Service
```

### Patient Admission Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     PATIENT ADMISSION FLOW                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. REGISTRATION                                                  │
│     Patient Service → New Patient                                 │
│     └── Demographics, Emergency Contact, Insurance                │
│                                                                   │
│  2. BIOMETRIC ENROLLMENT                                         │
│     Biometric Service → Enroll Patient                           │
│     └── Fingerprint/Face Registration (AES-256 Encrypted)        │
│                                                                   │
│  3. ADMISSION                                                     │
│     Patient Service → New Admission                              │
│     └── Room Assignment, Department, Physician                   │
│                                                                   │
│  4. TRACKING BEGINS                                              │
│     Patient Tracking → Patient Monitored                         │
│     ├── Vitals recorded every 4 hours                           │
│     ├── Medications administered per schedule                    │
│     └── Meals served and tracked                                 │
│                                                                   │
│  5. INVENTORY USAGE                                              │
│     Inventory Service → Items Issued                             │
│     └── Medicines, Disposables linked to patient                 │
│                                                                   │
│  6. NOTIFICATIONS                                                │
│     Notification Service → Family Updates                        │
│     └── Status updates via Push/SMS/WhatsApp                     │
│                                                                   │
│  7. DISCHARGE                                                     │
│     Patient Service → Update Admission Status                    │
│     └── Status changed to "DISCHARGED"                           │
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
│  └────────────┘                └─────────────────┘                 │
│                                                                     │
│  PATIENT SERVICE                INVENTORY TABLES                    │
│  ┌─────────────────┐           ┌──────────────────┐                │
│  │service_patients │           │ inventory_items  │                │
│  ├─────────────────┤           ├──────────────────┤                │
│  │   admissions    │           │inventory_patients│                │
│  ├─────────────────┤           ├──────────────────┤                │
│  │ medical_records │           │  staff_members   │                │
│  └─────────────────┘           ├──────────────────┤                │
│                                │inventory_trans   │                │
│                                └──────────────────┘                │
│                                                                     │
│  BIOMETRIC TABLES               NOTIFICATION TABLES                 │
│  ┌──────────────────┐          ┌───────────────────┐               │
│  │biometric_templates│          │   notifications   │               │
│  ├──────────────────┤          ├───────────────────┤               │
│  │biometric_verify  │          │hospital_team_memb │               │
│  └──────────────────┘          └───────────────────┘               │
│                                                                     │
│  CHATBOT TABLES                                                    │
│  ┌──────────────────┐                                              │
│  │conversation_logs │                                              │
│  └──────────────────┘                                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | System authentication | id, username, password |
| `doctors` | Doctor profiles | name, specialty, experience, rating |
| `schedules` | Doctor availability | doctorId, date, timeSlot, isBooked |
| `appointments` | OPD bookings | patientName, doctorId, date, status |
| `service_patients` | Patient demographics | firstName, lastName, DOB, insurance |
| `admissions` | Hospital stays | patientId, department, roomNumber, status |
| `medical_records` | Clinical documents | patientId, recordType, description |
| `tracking_patients` | Admitted patients | name, room, diagnosis, doctor |
| `medications` | Drug administration | patientId, name, dosage, administeredBy |
| `vitals` | Vital signs | patientId, temperature, heartRate, BP |
| `meals` | Diet tracking | patientId, mealType, calories |
| `inventory_items` | Hospital supplies | name, category, currentStock |
| `inventory_transactions` | Stock movements | type, itemId, quantity |
| `biometric_templates` | Encrypted biometrics | patientId, templateData, quality |
| `biometric_verifications` | Verification logs | patientId, confidenceScore, isMatch |
| `conversation_logs` | Chatbot history | query, response, category |
| `notifications` | Hospital messages | title, message, channels, priority |
| `hospital_team_members` | Staff directory | name, department, phone, isOnCall |

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

---

## Security Features

### Authentication & Authorization

| Feature | Implementation |
|---------|----------------|
| **Password Hashing** | Secure password storage |
| **Session Management** | Express sessions with PostgreSQL store |
| **Role-Based Access** | 5 distinct user roles with permissions |
| **Route Protection** | Server-side and client-side guards |

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
| **Data Encryption** | AES-256 for sensitive data |
| **Audit Logging** | Biometric verification logs |
| **Access Control** | Role-based permission matrix |

---

## Login Credentials

### Quick Test Accounts

| Role | Username | Password |
|------|----------|----------|
| ADMIN | admin.suhas.nair | Admin@123 |
| DOCTOR | dr.anil.kulkarni | Doctor@123 |
| PATIENT | rohan.patil | Patient@123 |
| NURSE | nurse.asha.patil | Nurse@123 |
| OPD_MANAGER | opd.mahesh.patil | OPD@123 |

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

### Color Palette

| Color | CSS Variable | Usage |
|-------|--------------|-------|
| **Primary Blue** | `--primary` | Headers, buttons, links |
| **Medical Blue** | `#2563eb` | Hospital branding |
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
- Custom hospital-themed cards
- Medical-grade status badges

### Theme Support

| Mode | Background | Text |
|------|------------|------|
| **Light** | White/Gray | Dark Gray/Black |
| **Dark** | Dark Gray/Black | White/Light Gray |

---

## File Structure

```
hms-core/
├── client/
│   └── src/
│       ├── components/          # Reusable UI components
│       │   ├── ui/              # shadcn components
│       │   ├── HMSSidebar.tsx   # Main navigation
│       │   ├── HMSDashboard.tsx # Dashboard component
│       │   ├── AuthForms.tsx    # Login/Register
│       │   └── ThemeToggle.tsx  # Dark mode toggle
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
│       │   └── EquipmentServicing.tsx
│       ├── hooks/               # Custom hooks
│       ├── lib/                 # Utilities
│       └── App.tsx              # Main app with routing
├── server/
│   ├── routes.ts                # API endpoints
│   ├── storage.ts               # Database operations
│   └── index.ts                 # Server entry
├── shared/
│   └── schema.ts                # Database schema & types
├── credentials/                 # Login credential files
├── HMS_LOGIN_CREDENTIALS.md     # Quick reference
├── PROJECT_DOCUMENTATION.md     # This file
└── design_guidelines.md         # UI/UX guidelines
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 2024 | Initial release with all services |

---

## Support

**Gravity Hospital IT Department**

- **Address:** Sane Chowk, Nair Colony, More Vasti, Chikhali, Pimpri-Chinchwad, Maharashtra 411062
- **System:** HMS Core v1.0

---

*This document serves as the complete technical and operational reference for the Gravity Hospital Management System.*
