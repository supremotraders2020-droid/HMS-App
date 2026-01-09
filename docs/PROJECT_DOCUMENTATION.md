# HMS Core - Hospital Management System
## Complete Project Documentation

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Hospital Information](#hospital-information)
3. [System Features](#system-features)
4. [User Roles & Access Control](#user-roles--access-control)
5. [Module Descriptions](#module-descriptions)
6. [Use Cases](#use-cases)
7. [Technical Architecture](#technical-architecture)
8. [API Endpoints](#api-endpoints)
9. [Database Schema](#database-schema)
10. [Security Features](#security-features)
11. [Installation & Setup](#installation--setup)
12. [Recent Updates](#recent-updates)

---

## Project Overview

### About HMS Core
HMS Core (Hospital Management System Core) is a comprehensive, enterprise-grade hospital management solution designed specifically for **Gravity Hospital**. The system streamlines healthcare operations through role-based dashboards, automated workflows, and real-time communication features.

### Key Objectives
- **Efficient Patient Care**: Streamline patient registration, tracking, and medical record management
- **Staff Coordination**: Enable seamless collaboration between doctors, nurses, and administrative staff
- **Regulatory Compliance**: Meet CPCB (biomedical waste), NABH (oxygen tracking), and HIPAA standards
- **Real-time Operations**: Provide instant notifications, appointment reminders, and status updates
- **Accessibility**: Support for multiple themes, responsive design, and multi-language consent forms

### Target Users
- Super Administrators
- Hospital Administrators
- Medical Doctors
- Nursing Staff
- OPD (Outpatient Department) Managers
- Patients
- Pathology Lab Staff
- Medical Store Staff
- Diagnostic Technicians

### Key Highlights

| Feature | Description |
|---------|-------------|
| **Hospital** | Gravity Hospital (Single-Tenant) |
| **User Roles** | 9 roles: SUPER_ADMIN, ADMIN, DOCTOR, NURSE, OPD_MANAGER, PATIENT, PATHOLOGY_LAB, MEDICAL_STORE, TECHNICIAN |
| **Internal Services** | 24 departments with 4,830+ services (including 1,148 pathology tests) |
| **Portals** | 3 specialized portals (Patient, Doctor, Staff) |
| **Security** | AES-256 encryption, bcrypt password hashing, HIPAA compliance |
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
| **System** | HMS Core v2.5.0 |

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

| # | Location |
|---|----------|
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

## System Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| Role-Based Access | 9 distinct user roles with customized dashboards |
| Multi-Theme Support | 6 color themes (Healthcare Blue, Medical Teal, Clinical Green, Warm Coral, Purple, Indigo) |
| Dark/Light Mode | Full dark mode support for reduced eye strain |
| Real-time Notifications | WebSocket-powered instant updates |
| Responsive Design | Works on desktop, tablet, and mobile devices |
| AI Chatbot | OpenAI GPT-powered hospital assistant |
| PDF Generation | Consent forms with digital signatures |
| Barcode System | Biomedical waste bag tracking |
| Google Maps Integration | Location selection for appointments |

---

## User Roles & Access Control

### Role Hierarchy

```
+----------------------------------------------------------+
|                     SUPER_ADMIN                           |
|  (Enterprise control, system config, audit management)    |
+----------------------------------------------------------+
|                        ADMIN                              |
|  (Full system access, user management, settings)          |
+----------------------------------------------------------+
|     DOCTOR          |     NURSE      |   OPD_MANAGER     |
|  (Clinical care,    |  (Assigned     |  (OPD operations, |
|   prescriptions)    |  patients only)|   scheduling)     |
+----------------------------------------------------------+
|   PATHOLOGY_LAB     |  MEDICAL_STORE |   TECHNICIAN      |
|  (Lab tests,        |  (Dispensing,  |  (Diagnostic      |
|   sample mgmt)      |  pharmacy ops) |   testing)        |
+----------------------------------------------------------+
|                       PATIENT                             |
|         (Personal health, appointments)                   |
+----------------------------------------------------------+
```

### 1. ADMIN (Administrator)
**Full system access with complete control**

| Module | Access Level |
|--------|--------------|
| User Management | Full CRUD |
| OPD Service | Full Access |
| Patient Service | Full Access |
| Inventory | Full Access |
| Patient Tracking | Full Access |
| Biometric Service | Full Access |
| Equipment Servicing | Full Access |
| Notification Service | Full Access |
| BMW Management | Full Access |
| Oxygen Tracking | Full Access |
| Consent Forms | Full Access |
| Prescriptions | View Only |
| Medicine Database | Full Access |
| Chatbot | Full Access |

### 2. DOCTOR
**Clinical operations and patient care**

| Module | Access Level |
|--------|--------------|
| OPD Service | View Schedule, Manage Appointments |
| Patient Service | Full Access |
| Patient Tracking | Full Access |
| Equipment Servicing | Full Access |
| Notification Service | Full Access |
| Consent Forms | Full Access |
| Prescriptions | Full Access |
| Medicine Database | Read Only |
| Chatbot | Full Access |
| Daily Oath | Required on first login each day |

### 3. NURSE
**Patient care with restricted access**

| Module | Access Level |
|--------|--------------|
| Patient Tracking | Assigned Patients Only |
| Notification Service | Patient-Specific Only |
| Patient Service | Assigned Patients Only |

**Restrictions:**
- No access to OPD Service
- No access to Equipment Servicing
- No access to Consent Forms
- Cannot view unassigned patients

### 4. OPD_MANAGER
**Outpatient department operations**

| Module | Access Level |
|--------|--------------|
| OPD Service | Full Access |
| Patient Service | Limited Access |
| Notification Service | Limited Access |

**Restrictions:**
- No access to Consent Forms
- Limited notification capabilities

### 5. PATIENT
**Self-service portal**

| Module | Access Level |
|--------|--------------|
| Own Records | View Only |
| Appointments | Book & View |
| Notifications | View Own |
| Chatbot | Full Access |

### 6. PATHOLOGY_LAB
**Laboratory operations and diagnostics**

| Module | Access Level |
|--------|--------------|
| Test Orders | Full Access |
| Sample Collection | Full Access |
| Result Entry | Full Access |
| Report Generation | Full Access |
| Quality Control | Full Access |
| Lab Inventory | Full Access |
| Hospital Services | View Lab Services (1,148 tests) |
| Notifications | Lab-related only |

**Capabilities:**
- Process laboratory test orders
- Collect and manage patient samples
- Enter and validate test results
- Generate lab reports
- Maintain quality control records
- Manage lab inventory

### 7. MEDICAL_STORE
**Pharmacy and dispensing operations**

| Module | Access Level |
|--------|--------------|
| Prescriptions | View Hospital Prescriptions |
| Medicine Dispensing | Full Access |
| Billing & Invoicing | Full Access |
| Medicine Substitution | Request/Approve |
| Store Inventory | Full Access |
| Medicine Database | Full Access |
| Hospital Services | View Medicine Services |
| Notifications | Store-related only |

**Store Types:**
- IN_HOUSE: Hospital's internal pharmacy
- THIRD_PARTY: External pharmacy partners

**Capabilities:**
- Receive and process prescriptions
- Dispense medications accurately
- Generate bills with GST calculation
- Handle medicine substitutions
- Track stock levels and expiry
- Payment methods: CASH, CARD, UPI, INSURANCE

### Role Permissions Matrix

| Feature | ADMIN | DOCTOR | NURSE | OPD_MANAGER | PATIENT | PATHOLOGY_LAB | MEDICAL_STORE |
|---------|:-----:|:------:|:-----:|:-----------:|:-------:|:-------------:|:-------------:|
| User Management | Yes | No | No | No | No | No | No |
| OPD Service | Yes | Yes | No | Yes | No | No | No |
| Patient Service | Yes | Yes | Limited | Yes | No | View | View |
| Inventory Service | Yes | No | Yes | Yes | No | Lab Only | Store Only |
| Patient Tracking | Yes | Yes | Limited | Yes | No | No | No |
| Biometric Service | Yes | Yes | Yes | No | No | No | No |
| Equipment Servicing | Yes | Yes | No | Yes | No | Lab Equipment | No |
| Notification Service | Yes | Yes | Limited | Limited | Yes | Lab Only | Store Only |
| Chatbot Service | Yes | Yes | Yes | No | Yes | No | No |
| BMW Management | Yes | No | Yes | Yes | No | No | No |
| Oxygen Tracking | Yes | Yes | Yes | Yes | No | No | No |
| Consent Forms | Yes | Yes | No | No | No | No | No |
| Medicine Database | Yes | Yes | Yes | Yes | No | Yes | Yes |
| Hospital Services | Yes | Yes | Yes | Yes | No | Lab Services | Pharmacy |
| Doctor Portal | No | Yes | No | No | No | No | No |
| Patient Portal | No | No | No | No | Yes | No | No |
| Lab Operations | No | No | No | No | No | Yes | No |
| Pharmacy Operations | No | No | No | No | No | No | Yes |

---

## Module Descriptions

### 1. OPD Service (Outpatient Department)
Manages outpatient operations including doctor scheduling and appointment booking.

**Features:**
- Doctor availability management
- Time slot configuration
- Appointment booking with patient selection
- Automatic 5-minute reminder scheduling
- Appointment status tracking (Scheduled, In Progress, Completed, Cancelled)
- Google Maps integration for location selection

### 2. Patient Service
Comprehensive patient information management system.

**Features:**
- Patient registration with demographics
- Medical record creation and management
- Admission/discharge tracking
- Insurance information storage
- Doctor assignment to patients
- Automatic notification to patients when records are created

### 3. Inventory Service
Hospital inventory and stock management.

**Features:**
- Item catalog management
- Stock level tracking
- Low stock alerts
- Transaction logging (additions, removals, adjustments)
- Department-wise inventory allocation

### 4. Patient Tracking Service
Real-time patient monitoring and care tracking.

**Features:**
- Medication schedule tracking
- Meal planning and logging
- Vital signs recording (BP, heart rate, temperature, oxygen saturation)
- Doctor visit documentation
- Activity timeline view
- Nurse assignment management

### 5. Biometric Service
Secure patient identification system.

**Features:**
- Fingerprint recognition support
- Facial recognition capability
- AES-256 encryption for biometric data
- HIPAA-compliant data storage
- Audit trail logging

### 6. Equipment Servicing
Medical equipment maintenance management.

**Features:**
- Asset inventory with serial numbers
- Preventive maintenance scheduling
- Service history tracking
- AMC (Annual Maintenance Contract) management
- Equipment status monitoring (Active, Under Maintenance, Retired)
- Vendor management

### 7. Chatbot Service
AI-powered hospital assistant.

**Features:**
- OpenAI GPT integration
- Context-aware responses
- Hospital information queries
- Patient FAQ handling
- Appointment assistance
- General health information

### 8. Notification Service
Multi-channel communication system.

**Features:**
- Push notifications (real-time via WebSocket)
- Email notifications
- SMS notifications
- WhatsApp integration
- Priority levels (Critical, High, Medium, Low)
- Role-based notification filtering
- Notification history and read tracking

### 9. Biomedical Waste Management (BMW)
CPCB-compliant waste tracking system.

**Features:**
- Four waste categories:
  - **Yellow**: Infectious & Pathological waste
  - **Red**: Contaminated Recyclable waste
  - **White**: Sharps (needles, scalpels)
  - **Blue**: Glassware & metallic implants
- Barcode generation for each waste bag
- Storage room capacity monitoring
- Authorized vendor management
- Pickup scheduling and tracking
- Disposal documentation
- Compliance reporting:
  - Daily reports
  - Monthly summaries
  - MPCB quarterly reports
  - Annual compliance reports
- Report filtering by type
- Downloadable report files

**Bag Status Workflow:**
```
CREATED -> FILLED -> SEALED -> IN_STORAGE -> PICKED_UP -> DISPOSED
```

### 10. Oxygen Tracking System
NABH-compliant oxygen cylinder management.

**Features:**
- Cylinder inventory with serial numbers
- Size categories (Jumbo, Large, Medium, Small, Portable)
- Status tracking (Full, In Use, Empty, Under Maintenance)
- Location-wise distribution
- Movement logging between departments
- Consumption tracking
- LMO (Liquid Medical Oxygen) tank readings
- Low stock alerts
- Cylinder lifecycle management

### 11. Consent Forms Management
Digital consent form system with legal compliance.

**Features:**
- 10 pre-loaded consent templates:
  1. Medico-Legal Consent
  2. Operation Theatre Consent
  3. HIV Test Consent
  4. HBsAg Test Consent
  5. Anaesthesia Consent
  6. Surgery Consent
  7. Tubal Ligation Consent
  8. Blood Transfusion Consent
  9. DAMA/LAMA Consent
  10. General Hospital Consent
- PDF template preview
- Digital signature capture
- Status tracking (Pending, Signed, Expired)
- Bilingual support (English/Marathi)
- Patient-consent linking

### 12. Prescription Management
Doctor prescription workflow.

**Features:**
- Medicine selection from database
- Dosage specification
- Duration and frequency settings
- Prescription history
- Print functionality
- Patient-prescription linking

### 13. Medicine Database
Comprehensive Indian medicine reference.

**Features:**
- Searchable medicine catalog
- Generic and brand names
- Dosage information
- Composition details
- Manufacturer information
- CSV import capability for bulk updates

---

## Use Cases

### Use Case 1: Patient Registration and Admission
**Actor:** Administrator / OPD Manager

**Flow:**
1. Patient arrives at hospital reception
2. Staff searches for existing patient record
3. If new patient, creates registration with demographics
4. Collects insurance information if applicable
5. Assigns patient to appropriate department
6. System generates unique patient ID
7. Patient receives notification with registration details

### Use Case 2: Doctor Appointment Booking
**Actor:** Patient / OPD Manager

**Flow:**
1. Patient/Staff selects doctor from available list
2. Views doctor's available time slots
3. Selects preferred date and time
4. Confirms appointment booking
5. System creates appointment record
6. Patient receives confirmation notification
7. System schedules automatic 5-minute reminder
8. Doctor sees appointment in their schedule

### Use Case 3: Daily Doctor Login with Oath
**Actor:** Doctor

**Flow:**
1. Doctor logs into the system
2. System checks if oath taken today
3. If not taken, displays NMC Physician's Pledge
4. Doctor reads and accepts the oath
5. System records oath acceptance with timestamp
6. Doctor gains access to dashboard
7. Can now view patients, write prescriptions, access records

### Use Case 4: Patient Tracking by Nurse
**Actor:** Nurse

**Flow:**
1. Nurse logs in and sees assigned patients only
2. Selects patient from list
3. Records vital signs (BP, temperature, pulse, oxygen)
4. Logs medication administration
5. Documents meal consumption
6. Adds notes about patient condition
7. System updates patient timeline
8. Notifications sent to relevant doctors if critical

### Use Case 5: Biomedical Waste Bag Generation
**Actor:** Administrator / Waste Handler

**Flow:**
1. Staff generates new waste bag entry
2. Selects waste category (Yellow/Red/White/Blue)
3. Enters department origin
4. Specifies approximate weight
5. System generates unique barcode
6. Barcode printed and attached to bag
7. Bag moved to appropriate storage room
8. Storage room capacity updated

### Use Case 6: BMW Compliance Report Generation
**Actor:** Administrator

**Flow:**
1. Admin navigates to BMW Reports section
2. Clicks on report type (Daily/Monthly/MPCB/Annual)
3. System displays preview with statistics
4. Shows category breakdown and bag counts
5. Admin can save report to database
6. Generated reports appear in filtered list (filtered by type)
7. Reports can be downloaded as text files

### Use Case 7: Oxygen Cylinder Movement
**Actor:** Administrator / Nurse

**Flow:**
1. Staff identifies cylinder needing movement
2. Scans or selects cylinder from inventory
3. Specifies destination department
4. Records movement reason
5. System updates cylinder location
6. Movement logged in tracking history
7. Department inventories updated automatically

### Use Case 8: Consent Form Signing
**Actor:** Doctor / Patient

**Flow:**
1. Doctor initiates consent for procedure
2. Selects appropriate template (e.g., Surgery Consent)
3. Patient reviews PDF in preferred language
4. Patient provides digital signature
5. System captures signature and timestamp
6. Consent status updated to "Signed"
7. Signed consent attached to patient record

### Use Case 9: Prescription Creation
**Actor:** Doctor

**Flow:**
1. Doctor opens patient record
2. Navigates to prescription section
3. Searches medicine database
4. Selects medicines with dosage
5. Specifies frequency and duration
6. Adds special instructions
7. Saves prescription
8. Patient can view prescription in their portal
9. Prescription available for print

### Use Case 10: Equipment Maintenance Scheduling
**Actor:** Administrator

**Flow:**
1. Admin views equipment inventory
2. Identifies equipment due for maintenance
3. Creates maintenance schedule entry
4. Assigns to vendor or internal team
5. Equipment status changes to "Under Maintenance"
6. Maintenance completed and documented
7. Status returns to "Active"
8. Service history updated

### Use Case 11: Real-time Notification Flow
**Actor:** System / All Users

**Flow:**
1. Event triggers notification (appointment, alert, update)
2. System determines notification priority
3. Identifies target users based on role
4. Sends via appropriate channel (Push/Email/SMS/WhatsApp)
5. WebSocket pushes to connected users
6. Users receive instant notification
7. Notification logged in history
8. User can mark as read

### Use Case 12: Patient Using Chatbot
**Actor:** Patient

**Flow:**
1. Patient clicks on chatbot icon
2. Types question about hospital services
3. AI processes query with hospital context
4. Provides relevant response
5. Can answer about:
   - Visiting hours
   - Department locations
   - Doctor availability
   - General health queries
   - Hospital policies

---

## Technical Architecture

### Frontend Stack
```
React 18 + TypeScript
|-- Radix UI (Accessible primitives)
|-- shadcn/ui (Component library)
|-- Tailwind CSS (Styling)
|-- TanStack Query (Data fetching)
|-- React Hook Form (Form handling)
|-- Wouter (Routing)
|-- Framer Motion (Animations)
+-- Lucide React (Icons)
```

### Backend Stack
```
Node.js + Express + TypeScript
|-- Drizzle ORM (Database)
|-- Neon Database (PostgreSQL)
|-- bcrypt (Password hashing)
|-- Express Session (Auth)
|-- WebSocket (Real-time)
+-- OpenAI API (Chatbot)
```

### Database
- **Provider**: Neon (Serverless PostgreSQL)
- **ORM**: Drizzle ORM with type-safe queries
- **Migrations**: Drizzle Kit for schema management

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | User login |
| POST | /api/auth/logout | User logout |
| GET | /api/user | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | List all users |
| POST | /api/users | Create user |
| PATCH | /api/users/:id | Update user |
| DELETE | /api/users/:id | Delete user |

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/patients | List patients |
| GET | /api/patients/:id | Get patient |
| POST | /api/patients | Create patient |
| PATCH | /api/patients/:id | Update patient |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/appointments | List appointments |
| POST | /api/appointments | Book appointment |
| PATCH | /api/appointments/:id | Update appointment |

### Doctors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/doctors | List doctors |
| POST | /api/doctors | Add doctor |
| POST | /api/doctor-oath | Record daily oath |

### BMW (Biomedical Waste)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/bmw/bags | List waste bags |
| POST | /api/bmw/bags | Create bag |
| GET | /api/bmw/reports | List reports |
| POST | /api/bmw/reports | Generate report |
| GET | /api/bmw/stats | Get statistics |

### Oxygen Tracking
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/oxygen/cylinders | List cylinders |
| POST | /api/oxygen/cylinders | Add cylinder |
| POST | /api/oxygen/movements | Log movement |
| GET | /api/oxygen/readings | Get LMO readings |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | List notifications |
| POST | /api/notifications | Create notification |
| PATCH | /api/notifications/:id/read | Mark as read |

---

## Database Schema

### Core Tables
- **users**: System users with roles
- **patients**: Patient demographics
- **service_patients**: Medical service patients
- **doctors**: Doctor profiles with specialties
- **appointments**: Appointment bookings
- **medical_records**: Patient medical history

### Module Tables
- **inventory_items**: Stock inventory
- **inventory_transactions**: Stock movements
- **equipment**: Medical equipment
- **equipment_service_records**: Maintenance history
- **prescriptions**: Doctor prescriptions
- **medicines**: Medicine database

### BMW Tables
- **bmw_bags**: Waste bags with barcodes
- **bmw_storage_rooms**: Storage facilities
- **bmw_vendors**: Authorized vendors
- **bmw_pickups**: Pickup records
- **bmw_reports**: Compliance reports

### Oxygen Tables
- **oxygen_cylinders**: Cylinder inventory
- **oxygen_movements**: Movement logs
- **oxygen_consumption**: Usage records
- **lmo_readings**: Tank readings

### Other Tables
- **consent_templates**: Form templates
- **patient_consents**: Signed consents
- **notifications**: System notifications
- **doctor_oaths**: Daily oath records
- **activity_logs**: System audit trail

---

## Security Features

### Authentication
- Session-based authentication
- bcrypt password hashing (10 salt rounds)
- Secure session storage in PostgreSQL
- Automatic session expiry

### Authorization
- Role-based access control (RBAC)
- Route-level permission checks
- API endpoint protection
- Resource-level access validation

### Data Protection
- AES-256 encryption for biometric data
- Secure password storage
- HIPAA-compliant data handling
- Audit logging for sensitive operations

### Compliance
- CPCB standards for biomedical waste
- NABH guidelines for oxygen management
- HIPAA requirements for patient data

---

## Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- OpenAI API key (for chatbot)

### Environment Variables
```
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
SESSION_SECRET=your-secret-key
```

### Running the Application
```bash
# Install dependencies
npm install

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin.suhas.nair | Admin@123 |
| Doctor | dr.anil.kulkarni | Doctor@123 |
| Patient | rohan.patil | Patient@123 |
| OPD Manager | opd.mahesh.nair | OPD@123 |

### Real Data (Added by Admin)
- **Doctors**: Kapil Saxena (Cardiology), Anil Kumar (Neurology), Jay Gupta (Orthopedics), Ajay (Pediatrics)
- **Nurses**: priya, riya, siya, tanu

---

## Recent Updates

### January 2026

**OPD Scheduling Enhancements:**
- Schedule-based availability display on doctor cards
- Real-time slot availability with "X available, Y booked / Z total"
- Non-working days show informative message with scheduled days
- Doctor identity mapping via `doctorTableId` for reliable schedule matching
- New API endpoint: `/api/schedule-availability`

**Technician Portal & Workflow:**
- New TECHNICIAN role added (ninth user role)
- Workflow isolation: Technicians receive only Patient Monitoring tests
- Prescription-based tests route to Medical Store instead
- Dedicated portal with pending tests dashboard

**Smart OPD Flow Engine:**
- 24 department-specific consultation workflows
- Symptom-driven forms with auto-observations
- Intelligent test and referral suggestions
- Rule-based clinical logic engine

**ICU Patient Monitoring:**
- 27 comprehensive monitoring data tables
- NABH-compliant 24-hour data collection
- Shift-based logging (Morning/Evening/Night)
- Critical value alerts with auto-escalation
- Integration with Technician Portal

**Dashboard Updates:**
- Active Patients card shows real `tracking_patients` count
- Critical Alerts card displays actual critical alert count
- Consistent data between summary cards and detailed panels

### December 2025
- **BMW Report Filtering**: Click report type buttons (Daily/Monthly/MPCB/Annual) to filter the Generated Reports list to show only that type
- **Report Preview Dialogs**: Detailed statistics, category breakdown, and bag listings with "Save to Reports" option
- **Patient Notifications**: Automatic notifications sent to patients when medical records are created
- **Medical Records**: Dropdown now fetches only admin-created doctors (Kapil Saxena, Anil Kumar, Jay Gupta, Ajay)
- **Info Button**: Functionality implemented across all portals showing detailed activity popup

---

## Support & Contact

For technical support or queries regarding HMS Core, please contact the development team.

**Version**: 2.5.0  
**Last Updated**: January 2026  
**Developed for**: Gravity Hospital, Pune

---

*This documentation is proprietary to Gravity Hospital and HMS Core development team.*
