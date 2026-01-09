# Gravity AI Manager - Hospital Management System

## Overview
Gravity AI Manager is a comprehensive Hospital Management System for Gravity Hospital, offering role-based access for nine distinct user roles. It provides specialized dashboards and workflows to enhance clinical clarity, professional trust, and operational efficiency within a healthcare setting. The system integrates AI for advanced decision-making and features 24 departments with over 4,830 hospital services, including 1,148 pathology tests.

## User Preferences
- Preferred communication style: Simple, everyday language
- Real data only: All doctor and nurse data must be added by admin (no mock/dummy data)
- Multi-language support: English/Hindi/Marathi for consent forms (Trilingual)

## System Architecture

### UI/UX Decisions
The system adheres to Material Design 3 principles adapted for healthcare, supporting light/dark modes and multiple theme color systems (Healthcare Blue, Medical Teal, Clinical Green, Warm Coral, Purple, Indigo). Role-based UI filtering ensures relevant information and actions are displayed to each user.

### Technical Implementations
The frontend is built with React 18 and TypeScript, using Radix UI and shadcn/ui for accessible components, Tailwind CSS for styling, Wouter for routing, TanStack Query v5 for server state, React Hook Form with Zod for validation, Framer Motion for animations, and Lucide React for icons.

The backend uses Node.js with Express, Drizzle ORM for type-safe database interactions, PostgreSQL (Neon) as the serverless database, bcrypt for password hashing, Express Sessions for authentication, and WebSockets for real-time notifications. OpenAI GPT-4o is integrated for AI services.

### Feature Specifications
Gravity AI Manager encompasses 23 core modules with robust role-based access control (RBAC) for SUPER_ADMIN, ADMIN, DOCTOR, NURSE, OPD_MANAGER, PATIENT, PATHOLOGY_LAB, MEDICAL_STORE, and TECHNICIAN roles. Key features include:
- **Authentication & RBAC**: Session-based authentication, daily Doctor Oath, and role-based UI filtering.
- **OPD Service & Smart OPD Consultation**: Doctor scheduling, appointment booking, Google Maps integration, department-specific clinical workflows (24 departments), symptom-driven forms, auto-observations, and intelligent test/referral suggestions using a flow logic rule engine.
- **Patient Management**: Demographics, admission, medical records, insurance, tracking, and NABH-compliant ICU Chart & Nursing Workflow (24-hour data collection, shift-based logging, critical alerts).
- **Inventory Service**: Stock management with alerts for disposables, medicines, and equipment.
- **Biometric Service**: Fingerprint/facial recognition with AES-256 encryption and HIPAA compliance.
- **Equipment Servicing**: Asset inventory, maintenance scheduling, and AMC management.
- **Bed Management**: NABH-compliant centralized control, automated allocation, transfer logs, and discharge workflows.
- **Notification Service**: Multi-channel (Push, Email, SMS, WhatsApp) and multi-priority notifications with real-time delivery.
- **Chatbot Service**: OpenAI GPT-powered for context-aware information.
- **Biomedical Waste Management (BMW)**: CPCB-compliant tracking (Yellow, Red, White, Blue categories).
- **Oxygen Tracking System**: NABH-compliant cylinder management and consumption tracking.
- **Consent Forms Management**: 14 trilingual templates with version tracking.
- **Prescription Management**: Comprehensive workflow with auto-generated medication schedules.
- **Medicine Database**: Searchable database of Indian medicines.
- **OT & ICU Swab Contamination Monitoring**: NABH-compliant environmental surveillance with auto-interpretation.
- **Disease Knowledge, Diet & Medication Scheduling**: AI-powered clinical knowledge, Indian diet plans, and personalized medication schedules using OpenAI GPT-4o, adhering to ICMR/MoHFW guidelines.
- **AI Intelligence Layer**: Hospital-wide analytics and predictions (Doctor/Nurse/OPD efficiency, Hospital Health Index, Compliance Risk, ICU load, oxygen demand) using AI Analytics Snapshots and Anomaly Detection.
- **Medical Store Integration**: Prescription sharing, dispensing workflow, billing with GST, and audit logging.
- **Pathology Lab Service**: Test order management, sample collection (barcode tracking), result entry, report generation, quality control, lab inventory, and walk-in patient report generation.
- **Face Recognition Identity Verification**: Privacy-compliant biometric verification for patient identification and staff attendance using browser-based face detection (face-api.js).
- **Hospital Services Module**: Catalog of 4,830+ services across 24 departments.
- **Super Admin Portal**: Enterprise-level control for system settings, user/role management, billing finalization, stock control, surgery/hospital packages, claims management, and audit logs.
- **ID Card Scanning & Alert System**: Dual-mode patient registration via ID card scanning with critical alert generation.
- **Nurse Department Preferences**: Nurses select 3 unique department preferences for scheduling.
- **Technician Portal**: Dedicated portal for diagnostic technicians for pending tests, report uploads (PDF/DICOM), and notifications.

### System Design Choices
- **Role-Based Access Control**: Strict hierarchical permissions across all modules.
- **Session-Based Authentication**: Secure user sessions managed via Express Sessions.
- **Real-time Capabilities**: WebSockets for instant notifications and data updates.
- **Microservice-like Architecture**: Logical separation of concerns.
- **Database Schema**: Extensive schema with over 60 tables.
- **Scalability**: Utilizes serverless PostgreSQL (Neon) and a robust Node.js backend.
- **Security & Data Isolation**: Patient data isolation, staff authentication via `staff_master` table, and comprehensive audit trails.

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL.
- **Drizzle ORM**: Type-safe ORM for PostgreSQL.
- **@neondatabase/serverless**: Enables WebSocket connection pooling for database access.

### UI/Styling
- **Radix UI**: Unstyled, accessible components.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Open-source icon library.
- **Framer Motion**: Motion library for React animations.

### Backend
- **Express.js**: Node.js web application framework.
- **connect-pg-simple**: PostgreSQL session store.
- **bcrypt**: Password hashing library.
- **ws**: WebSocket client and server for Node.js.

### AI Integration
- **OpenAI API**: Utilized for GPT-4o for chatbot, health tips, and personalized care plans.

## Recent Enhancements (January 2026)

### OPD Scheduling Improvements
- **Schedule-Based Availability**: Doctor cards display real-time slot availability based on schedule configuration
- **Smart Display Logic**: When doctors have clinic hours, shows "X available, Y booked / Z total"; when no schedule exists for a date, shows "No clinic hours for this date (Available: [scheduled days])"
- **Doctor Identity Mapping**: Reliable `doctorTableId` mapping between `doctors` and `users` tables eliminates name-matching issues
- **Conditional Slot Panel**: Time slots only display when doctor has active schedule for selected date

### Technician Portal Workflow Isolation
- **Source-Based Test Filtering**: Technician Portal exclusively receives tests from Patient Monitoring module
- **Clear Workflow Separation**: Tests from Prescription Management route to Medical Store, not Technician Portal
- **Notification Isolation**: Technician notifications only triggered for Patient Monitoring test orders

### Dashboard Real-Time Statistics
- **Active Patients Card**: Shows actual count from `tracking_patients` table
- **Critical Alerts Card**: Displays real-time critical alert count from `/api/critical-alerts`
- **Data Consistency**: All dashboard stat cards use correct data sources

### Smart OPD Flow Engine
- **24 Department-Specific Workflows**: Each department has customized consultation flow
- **Symptom-Driven Forms**: Auto-generated observations based on symptom selection
- **Intelligent Suggestions**: Rule-based test and referral recommendations

### ICU Patient Monitoring
- **27 Monitoring Data Tables**: Comprehensive critical care tracking
- **NABH Compliance**: 24-hour data collection with shift-based logging
- **Critical Value Alerts**: Auto-escalation for abnormal values
- **Technician Integration**: Diagnostic test orders from Patient Monitoring route to Technician Portal

## Documentation Updates (January 2026)
- **docs/RECENT_UPDATES.md**: Comprehensive changelog for all recent changes
- **docs/TECHNICIAN_SOP.md**: New SOP for Technician role with workflow isolation details
- **docs/SUPER_ADMIN_SOP.md**: Enterprise control documentation for Super Admin
- **Updated SOPs**: OPD_MANAGER_SOP.md, ADMIN_SOP.md, DOCTOR_SOP.md updated with January 2026 changes
- **docs/PROJECT_DOCUMENTATION.md**: Updated with architecture changes and new features