# HMS Core - Hospital Management System

## Overview
HMS Core is a comprehensive Hospital Management System designed for Gravity Hospital, offering role-based access for various healthcare professionals (Administrators, Doctors, Nurses, OPD Managers, and Patients). It provides specialized dashboards and workflows tailored to each role, focusing on clinical clarity, professional trust, and efficient healthcare workflows. The system adheres to Material Design 3 principles adapted for the healthcare industry.

**Current Version**: 2.0  
**Last Updated**: December 2024  
**Total Database Tables**: 60+  
**Total Modules**: 18

## User Preferences
- Preferred communication style: Simple, everyday language
- Real data only: All doctor and nurse data must be added by admin (no mock/dummy data)
- Multi-language support: English/Hindi/Marathi for consent forms (Trilingual)

## Quick Start

### Default User Credentials
| Role | Username | Password |
|------|----------|----------|
| Admin | admin.suhas.nair | Admin@123 |
| Doctor | dr.anil.kulkarni | Doctor@123 |
| Patient | rohan.patil | Patient@123 |
| OPD Manager | opd.mahesh.nair | OPD@123 |

### Running the Application
- The workflow named 'Start application' runs `npm run dev`
- Express server for backend + Vite server for frontend
- Frontend binds to port 5000

## System Architecture

### Technology Stack

#### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 + TypeScript | UI Framework |
| Radix UI + shadcn/ui | Accessible UI Components |
| Tailwind CSS | Styling |
| Wouter | Client-side Routing |
| TanStack Query v5 | Server State Management |
| React Hook Form + Zod | Form Validation |
| Framer Motion | Animations |
| Lucide React | Icons |

#### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | Server Framework |
| Drizzle ORM | Type-safe Database ORM |
| PostgreSQL (Neon) | Serverless Database |
| bcrypt (10 rounds) | Password Hashing |
| Express Sessions | Authentication |
| WebSocket | Real-time Notifications |
| OpenAI GPT-4o | AI Services |

### Theme System
- Light/Dark mode support
- Multi-theme color systems: Healthcare Blue, Medical Teal, Clinical Green, Warm Coral, Purple, Indigo

## Core Modules (18 Total)

### 1. Authentication & RBAC
Five user roles with hierarchical permissions:

| Role | Access Level |
|------|-------------|
| ADMIN | Full system access, user management, all modules |
| DOCTOR | Patient care, prescriptions, medical records, equipment servicing |
| NURSE | Assigned patients only, patient tracking, simplified notifications |
| OPD_MANAGER | OPD operations, scheduling, limited notifications |
| PATIENT | Own records, appointments, notifications |

**Security Features**:
- Session-based authentication with PostgreSQL storage
- bcrypt password hashing (10 salt rounds)
- Daily Doctor Oath (NMC Physician's Pledge) requirement
- Role-based UI filtering

### 2. OPD Service
- Doctor scheduling and availability management
- Appointment booking with time slot selection
- 30-minute slot generation from schedules
- Automatic appointment reminders (5-minute scheduler)
- Google Maps integration for 10 Pune hospital locations
- Real-time slot status (available, booked, cancelled, completed)

### 3. Patient Service
- Patient demographics and registration
- Admission management with room allocation
- Medical records with doctor assignment
- Insurance information tracking
- Nurse-to-patient assignment
- Patient notifications on medical record creation

### 4. Patient Tracking Service
- 4 core tabs: All Patients, Admit Patient, Doctor Visit, Billing
- Admission workflow management
- Doctor visit scheduling
- Patient status tracking (admitted, discharged)

### 5. Patient Monitoring Module (14 Sub-modules)
NABH-compliant ICU Chart & Nursing Workflow with 24-hour data collection:

| Module | Description |
|--------|-------------|
| Patient Sessions | 24-hour monitoring periods |
| Vitals Hourly | HR, BP, SpO2, Temp (24 hourly slots) |
| Inotropes & Sedation | Drug infusions, RASS/GCS scores |
| Ventilator Settings | Mode, FiO2, Tidal Volume, PEEP |
| ABG & Lab Results | Blood gases, cultures, investigations |
| Intake Chart | IV lines, oral, NG tube (hourly) |
| Output Chart | Urine, drain, vomitus (hourly) |
| Diabetic Flow | BSL, insulin, electrolytes |
| Medication Admin (MAR) | Given/Held/Missed tracking |
| Once-Only Drugs | PRN and stat medications |
| Nursing Shift Notes | Observations, actions, handover |
| Airway/Lines/Tubes | Device insertion tracking |
| Skin & Pressure Care | Wound assessment, Braden scores |
| Fall Risk | Morse Fall Scale assessment |

**Features**:
- Shift-based logging (Morning/Evening/Night)
- Version control for audit trails
- Real-time data entry with nurse signature
- Critical alert generation

### 6. Inventory Service
- Stock management with alerts
- 5 categories: disposables, syringes, gloves, medicines, equipment
- Transaction logging (Issue, Return, Dispose)
- Low stock notifications
- Staff and patient tracking

### 7. Biometric Service
- Fingerprint/facial recognition support
- AES-256 encryption for templates
- Verification logging with confidence scores
- HIPAA compliance features

### 8. Equipment Servicing
- Asset inventory management
- Maintenance scheduling (monthly, quarterly, yearly)
- Service history tracking
- AMC (Annual Maintenance Contract) management
- Emergency contact directory

### 9. Notification Service
- Multi-channel delivery: Push, Email, SMS, WhatsApp
- Priority levels: Critical, High, Medium, Low
- WebSocket real-time notifications
- Role-based notification filtering
- Scheduled notifications

### 10. Chatbot Service
- OpenAI GPT-powered assistance
- Context-aware hospital information
- Patient query handling
- Conversation logging

### 11. Biomedical Waste Management (BMW)
CPCB-compliant waste tracking:

| Category | Color | Description |
|----------|-------|-------------|
| YELLOW | Yellow | Anatomical, pathological waste |
| RED | Red | Contaminated sharps, tubes |
| WHITE | White | Sharps (needles, blades) |
| BLUE | Blue | Glassware, metallic implants |

**Features**:
- Barcode generation for waste bags
- Storage room monitoring with temperature
- Vendor management for pickups
- Disposal tracking and verification
- Incident reporting (needle-stick, spills)
- Compliance reporting (Daily, Weekly, Monthly, Annual, MPCB)

### 12. Oxygen Tracking System
NABH-compliant cylinder management:

- Cylinder types: B-type, D-type, Jumbo
- Status tracking: full, in_use, empty, for_refilling, for_testing
- Movement logging (Issue/Return)
- Patient-wise consumption tracking
- LMO (Liquid Medical Oxygen) tank readings
- Low stock alerts
- Hydrostatic test scheduling

### 13. Consent Forms Management
**13 Trilingual Consent Templates** (English, Hindi, Marathi):

| Category | Forms |
|----------|-------|
| Legal & Administrative | Medico-Legal Register, DAMA/LAMA, Digital Consent Form |
| Surgical & Procedural | OT Register, Anaesthesia, Surgery, Tubal Ligation, Plastic Surgery |
| Diagnostic & Testing | HIV Test, HBsAg Test, Injection Consent (OPD) |
| Treatment | Blood Transfusion |
| Maternal & Neonatal | Newborn Baby Consent |

**Features**:
- PDF preview and download
- Version tracking (1.0/2.0)
- Category-based filtering
- Print functionality

### 14. Prescription Management
Comprehensive prescription workflow:

| Status | Description |
|--------|-------------|
| draft | Initial creation |
| awaiting_signature | Ready for doctor signature |
| finalized | Signed and complete |
| void | Cancelled prescription |

**Features**:
- Prescription Number: PR-YYYY-NNNN format
- Tabbed interface: Patient Info, Clinical, Medicines, Instructions
- Vitals recording: BP, Sugar, Pulse, Weight, Temperature
- Auto-generated medication schedules from frequency
- Role-based access:
  - Admin/Doctor: Create, draft, finalize with digital signature
  - OPD Manager: Create drafts only
  - Patient: View finalized only
- Medicine database search integration
- Print functionality with professional formatting

### 15. Medicine Database
- Searchable database of Indian medicines
- Fields: Brand name, Generic name, Strength, Dosage form
- Company, MRP, Pack size, Uses, Category

### 16. OT & ICU Swab Contamination Monitoring
NABH-compliant environmental surveillance:

**Auto-interpretation Logic**:
- No Growth / None category = PASS
- Flora + Low growth = ACCEPTABLE
- Pathogen or Moderate/Heavy growth = FAIL

**Features**:
- 7 database tables for complete tracking
- Six-tab interface: Dashboard, Collection, Lab Results, CAPA, Reports, Masters
- Auto-CAPA generation for failed swabs (7-day closure target)
- Master data: 6 OT/ICU areas, 10 sampling sites, 12 organisms
- Full audit logging for compliance

### 17. Disease Knowledge, Diet & Medication Scheduling
AI-powered clinical knowledge management:

**Pre-seeded Diseases**: Diabetes Type 2, Hypertension, Tuberculosis, Dengue, Asthma

**Features**:
- Comprehensive disease catalog for Indian clinical context
- Indian diet plans with culturally-relevant options (roti, dal, sabzi)
- Medication schedule templates (timing guidance, NOT prescriptions)
- AI-powered personalization using OpenAI GPT-4o
- Clinical parameters with normal/target/danger ranges
- Do's and Don'ts lists
- Activity recommendations (yoga, walking, stress management)
- ICMR/MoHFW guideline compliance

### 18. AI Intelligence Layer
Hospital-wide analytics and predictions:

| Engine | Purpose |
|--------|---------|
| Doctor Efficiency | Performance metrics |
| Nurse Efficiency | Workload distribution |
| OPD Intelligence | Wait time, throughput |
| Hospital Health | Daily health index (0-100) |
| Compliance Risk | Regulatory compliance |
| Predictive | ICU load, oxygen demand forecasting |

**Features**:
- AI Analytics Snapshots (time-series metrics)
- Anomaly Detection (spikes, threshold breaches)
- Recommendations with impact estimates
- Hospital Health Index scoring

## Role Restrictions

### NURSE Restrictions
- Can only view assigned patients
- Receives patient-specific notifications only
- No access to: Equipment Servicing, Consent Forms, OPD Service

### OPD_MANAGER Restrictions
- Limited notification service access
- No Consent Forms access
- Can create prescription drafts only (no finalization)

## Real Data (Added by Admin)
- **Doctors**: Kapil Saxena (Cardiology), Anil Kumar (Neurology), Jay Gupta (Orthopedics), Ajay (Pediatrics)
- **Nurses**: priya, riya, siya, tanu

## File Structure

```
├── client/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components for each module
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── App.tsx         # Main application entry
├── server/
│   ├── routes.ts           # API route definitions
│   ├── database-storage.ts # Database operations
│   ├── index.ts            # Server entry point
│   └── vite.ts             # Vite integration
├── shared/
│   └── schema.ts           # Database schema (60+ tables)
├── public/
│   └── consents/           # 13 PDF consent templates
├── docs/
│   ├── DATABASE_SCHEMA.md  # Detailed table documentation
│   └── DATABASE_RELATIONSHIPS.md # ER relationships
└── replit.md               # Project documentation
```

## API Design

All API endpoints are prefixed with `/api`:

### Key Endpoint Patterns
- `GET /api/{resource}` - List all
- `GET /api/{resource}/:id` - Get by ID
- `POST /api/{resource}` - Create new
- `PATCH /api/{resource}/:id` - Update
- `DELETE /api/{resource}/:id` - Delete

### Authentication Headers
```
x-user-id: {user_id}
x-user-role: {ADMIN|DOCTOR|NURSE|OPD_MANAGER|PATIENT}
```

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL
- **Drizzle ORM**: Type-safe ORM
- **@neondatabase/serverless**: WebSocket connection pooling

### UI/Styling
- **Radix UI**: Accessible primitives
- **Tailwind CSS**: Utility-first CSS
- **Lucide React**: Icon library
- **Framer Motion**: Animations

### Backend
- **Express.js**: Web framework
- **connect-pg-simple**: PostgreSQL session store
- **bcrypt**: Password hashing
- **ws**: WebSocket support

### AI Integration
- **OpenAI API**: GPT-4o for chatbot, health tips, personalized care plans

## Recent Updates (December 2024)
- Consent Forms updated to 13 trilingual templates with 5 categories
- Patient Monitoring Module with 14 NABH-compliant sub-modules
- Resolved alerts database persistence (not localStorage)
- BMW report filtering with preview dialogs
- Disease Knowledge module with AI personalization
- Enhanced prescription workflow with digital signatures

## Changelog

### v2.0 (December 2024)
- Added Patient Monitoring Module (14 sub-modules)
- Added Consent Forms Management (13 templates)
- Added Disease Knowledge Module
- Added AI Intelligence Layer
- Added Oxygen Tracking System
- Added BMW Management
- Added Swab Contamination Monitoring

### v1.0 (Initial Release)
- Core authentication and RBAC
- OPD Service with appointment booking
- Patient Service with admissions
- Inventory Service
- Notification Service
- Chatbot Service
