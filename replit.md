# HMS Core - Hospital Management System

## Overview
HMS Core is a comprehensive Hospital Management System designed for Gravity Hospital, offering role-based access for various healthcare professionals (Administrators, Doctors, Nurses, OPD Managers, and Patients). It provides specialized dashboards and workflows tailored to each role, focusing on clinical clarity, professional trust, and efficient healthcare workflows. The system adheres to Material Design 3 principles adapted for the healthcare industry.

## User Preferences
- Preferred communication style: Simple, everyday language
- Real data only: All doctor and nurse data must be added by admin (no mock/dummy data)
- Multi-language support: English/Marathi for consent forms

## System Architecture

### Frontend Architecture
The frontend is built with React and TypeScript, utilizing a component-based architecture:
- **UI Framework**: Radix UI primitives with shadcn/ui for accessibility
- **Styling**: Tailwind CSS with custom healthcare-specific design variables
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state and React hooks for local state
- **Theme System**: Custom provider supporting light/dark modes and multi-theme color systems (Healthcare Blue, Medical Teal, Clinical Green, Warm Coral, Purple, Indigo)
- **Animations**: Framer Motion for fluid UI animations

### Backend Architecture
The backend is a Node.js/Express application with TypeScript:
- **Server Framework**: Express.js for robust API handling
- **Database ORM**: Drizzle ORM for type-safe database interactions
- **API Design**: RESTful endpoints prefixed with `/api`
- **Storage Layer**: Abstracted `IStorage` interface with PostgreSQL implementation
- **Development Setup**: Vite for hot module replacement
- **Password Security**: bcrypt hashing with 10 salt rounds

### Core Modules

#### 1. OPD Service
- Doctor scheduling and availability management
- Appointment booking with time slot selection
- Automatic appointment reminders (5-minute scheduler)
- Google Maps integration for 10 Pune hospital locations

#### 2. Patient Service
- Patient demographics and registration
- Admission management
- Medical records with doctor assignment
- Insurance information tracking
- Patient notifications on medical record creation

#### 3. Inventory Service
- Stock management with alerts
- Transaction logging
- Low stock notifications

#### 4. Patient Tracking Service
- Real-time patient monitoring
- Medication tracking
- Meal scheduling
- Vitals recording
- Doctor visit tracking
- Activity timelines

#### 5. Biometric Service
- Fingerprint/facial recognition support
- AES-256 encryption
- HIPAA compliance

#### 6. Equipment Servicing
- Asset inventory management
- Maintenance scheduling
- Service history tracking
- AMC (Annual Maintenance Contract) management

#### 7. Chatbot Service
- OpenAI GPT-powered assistance
- Context-aware hospital information
- Patient query handling

#### 8. Notification Service
- Multi-channel delivery (Push, Email, SMS, WhatsApp)
- Priority levels (Critical, High, Medium, Low)
- WebSocket real-time notifications
- Role-based notification filtering

#### 9. Biomedical Waste Management (BMW)
- CPCB-compliant waste tracking
- Four waste categories (Yellow, Red, White, Blue)
- Barcode generation for waste bags
- Storage room monitoring
- Vendor management for pickups
- Disposal tracking
- Compliance reporting (Daily, Monthly, MPCB, Annual)
- Report filtering and download functionality

#### 10. Oxygen Tracking System
- NABH-compliant cylinder inventory
- Movement logging between locations
- Consumption tracking
- LMO (Liquid Medical Oxygen) readings
- Low stock alerts
- Cylinder lifecycle management

#### 11. Consent Forms Management
- Template-based form generation
- PDF handling and preview
- Digital signature capture
- Status tracking (Pending, Signed, Expired)
- 10 pre-loaded consent templates:
  - Medico-Legal Consent
  - Operation Theatre Consent
  - HIV Test Consent
  - HBsAg Test Consent
  - Anaesthesia Consent
  - Surgery Consent
  - Tubal Ligation Consent
  - Blood Transfusion Consent
  - DAMA/LAMA Consent
  - General Hospital Consent
- Bilingual support (English/Marathi)

#### 12. Prescription Management
- Comprehensive prescription creation modal with tabbed interface (Patient Info, Clinical, Medicines, Instructions)
- Enhanced schema with prescriptionNumber (PR-YYYY-NNNN format), vitals, diagnosis, signature metadata
- Prescription Items table for detailed medicine entries
- Role-based access control:
  - Admin/Doctor: Can create, draft, and finalize prescriptions with digital signature
  - OPD Manager: Can only create drafts (no finalization)
  - Patient: View finalized prescriptions only
- Prescription workflow: draft → awaiting_signature → finalized → void
- Auto-generated medication schedules from frequency:
  - 1x = Morning
  - 2x = Morning, Night
  - 3x = Morning, Afternoon, Night
  - 4x = Morning, Afternoon, Evening, Night
- Medicine database search integration
- Vitals recording (BP, Sugar, Pulse, Weight, Temp)
- Chief complaints and diagnosis capture
- Diet advice and activity recommendations
- Follow-up date tracking
- Patient notifications on prescription finalization
- Print functionality with professional formatting

#### 13. Medicine Database
- Searchable database of Indian medicines
- Dosage information

#### 14. OT & ICU Swab Contamination Monitoring
- NABH-compliant environmental surveillance for infection control
- 7 database tables: Area Master, Sampling Site Master, Organism Master, Swab Collection, Lab Results, CAPA Actions, Audit Logs
- Six-tab interface: Dashboard, Collection, Lab Results, CAPA, Reports, Masters
- Auto-interpretation logic:
  - No Growth / None category = PASS
  - Flora + Low growth = ACCEPTABLE
  - Pathogen or Moderate/Heavy growth = FAIL
- Auto-CAPA generation for failed swabs with 7-day closure target
- Admin notifications on contamination alerts
- Full audit logging for NABH compliance
- Master data: 6 OT/ICU areas, 10 sampling sites, 12 organisms (flora + pathogens)

#### 15. Disease Knowledge, Diet & Medication Scheduling
- Comprehensive disease catalog for Indian clinical context
- 5 database tables: disease_catalog, diet_templates, medication_schedule_templates, patient_disease_assignments, personalized_care_plans
- Four-tab interface: Disease Catalog, Diet Plans, Medication Schedules, Patient Assignments
- AI-powered personalization using OpenAI GPT-4o with fallback to template-based plans
- Pre-seeded diseases: Diabetes Type 2, Hypertension, Tuberculosis, Dengue, Asthma
- Indian diet plans with culturally-relevant meal options (roti, dal, sabzi, etc.)
- Medication schedule templates (timing guidance only, NOT prescriptions)
- Disease categories: metabolic, cardiovascular, respiratory, infectious, neuro, other
- Clinical parameters with normal/target/danger ranges
- Do's and Don'ts lists for each disease
- Activity recommendations including yoga, walking, stress management
- Monitoring guidelines (daily/weekly/monthly checks)
- Educational disclaimers throughout (not medical advice)
- Role access: Admin, Doctor, Nurse, OPD Manager (Patients view from Patient Portal)
- ICMR/MoHFW guideline compliance

### Authentication and Authorization

#### Role-Based Access Control (RBAC)
Five user roles with hierarchical permissions:
1. **ADMIN**: Full system access, user management, all modules
2. **DOCTOR**: Patient care, prescriptions, medical records, equipment servicing
3. **NURSE**: Assigned patients only, patient tracking, simplified notifications
4. **OPD_MANAGER**: OPD operations, scheduling, limited notifications
5. **PATIENT**: Own records, appointments, notifications

#### Role Restrictions
- **NURSE Restrictions**: 
  - Can only view assigned patients
  - Receives patient-specific notifications only
  - No access to Equipment Servicing
  - No access to Consent Forms
  - No OPD Service access

- **OPD_MANAGER Restrictions**:
  - Limited notification service access
  - No Consent Forms access

#### Security Features
- Session-based authentication with Express sessions
- bcrypt password hashing (10 salt rounds)
- Daily Doctor Oath (NMC Physician's Pledge) requirement
- Secure session storage with PostgreSQL

### Default User Credentials
- **Admin**: admin.suhas.nair / Admin@123
- **Doctor**: dr.anil.kulkarni / Doctor@123
- **Patient**: rohan.patil / Patient@123
- **OPD Manager**: opd.mahesh.nair / OPD@123

### Real Data (Added by Admin)
- **Doctors**: Kapil Saxena (Cardiology), Anil Kumar (Neurology), Jay Gupta (Orthopedics), Ajay (Pediatrics)
- **Nurses**: priya, riya, siya, tanu

## External Dependencies

### Database and ORM
- **Neon Database**: Serverless PostgreSQL-compatible database
- **Drizzle ORM**: Type-safe ORM for database operations
- **@neondatabase/serverless**: Connection pooling with WebSocket support

### UI and Styling
- **Radix UI**: Accessible primitive UI components
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Class Variance Authority**: Type-safe component variant management
- **Framer Motion**: Animation library

### Development and Build Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Static type checking
- **ESBuild**: Fast production bundling
- **TSX**: TypeScript execution for development

### Frontend State and Data Management
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form validation and management
- **Wouter**: Lightweight routing
- **Date-fns**: Date manipulation utilities

### Backend Infrastructure
- **Express.js**: Web application framework
- **Connect-pg-simple**: PostgreSQL session store
- **WebSocket Support**: Real-time communication
- **bcrypt**: Secure password hashing

### Validation and Schema Management
- **Zod**: Runtime type validation
- **Drizzle-Zod**: Integration between Drizzle schema and Zod
- **React Hook Form Resolvers**: Zod integration for client-side form validation

### AI Integration
- **OpenAI API**: For the GPT-powered chatbot service

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
│   └── schema.ts           # Database schema and types
├── public/
│   └── consents/           # PDF consent templates
└── replit.md               # Project documentation
```

## Recent Updates
- Resolved alerts database persistence: Patient Analytics resolved alerts now persist in database (not localStorage) so all admin users see same alert status
- BMW report filtering: Click report type buttons to filter Generated Reports list
- Report preview dialogs with detailed statistics
- Patient notifications on medical record creation
- Medical records dropdown fetches only admin-created doctors
- Info button functionality across all portals
