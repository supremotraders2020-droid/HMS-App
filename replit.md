# Gravity AI Manager - Hospital Management System

## Overview
Gravity AI Manager is a comprehensive Hospital Management System designed for Gravity Hospital. It provides specialized dashboards and workflows for nine distinct user roles, aiming to enhance clinical clarity, professional trust, and operational efficiency. The system integrates AI for advanced decision-making and manages 24 departments offering over 4,830 hospital services, including 1,148 pathology tests. The project's vision is to deliver an AI-powered healthcare management solution that streamlines hospital operations and improves patient care.

## User Preferences
- Preferred communication style: Simple, everyday language
- Real data only: All doctor and nurse data must be added by admin (no mock/dummy data)
- Multi-language support: English/Hindi/Marathi for consent forms (Trilingual)

## System Architecture

### UI/UX Decisions
The system follows Material Design 3 principles, adapted for healthcare, with support for light/dark modes and multiple theme color systems (Healthcare Blue, Medical Teal, Clinical Green, Warm Coral, Purple, Indigo). Role-based UI filtering ensures users see only relevant information and actions.

### Technical Implementations
The frontend uses React 18 with TypeScript, Radix UI and shadcn/ui for components, Tailwind CSS for styling, Wouter for routing, TanStack Query v5 for server state management, React Hook Form with Zod for validation, Framer Motion for animations, and Lucide React for icons.

The backend is built with Node.js and Express, utilizing Drizzle ORM for type-safe database interactions, PostgreSQL (Neon) as the serverless database, bcrypt for password hashing, Express Sessions for authentication, and WebSockets for real-time notifications. OpenAI GPT-4o is integrated for AI services.

### Feature Specifications
Gravity AI Manager includes 23 core modules with robust role-based access control (RBAC) for SUPER_ADMIN, ADMIN, DOCTOR, NURSE, OPD_MANAGER, PATIENT, PATHOLOGY_LAB, MEDICAL_STORE, and TECHNICIAN roles. Key features include:
- **Authentication & RBAC**: Session-based authentication and role-based UI filtering.
- **OPD Service & Smart OPD Consultation**: Doctor scheduling, appointment booking, Google Maps integration, department-specific clinical workflows, symptom-driven forms, auto-observations, and intelligent test/referral suggestions using a flow logic rule engine.
- **Patient Management**: Demographics, admission, medical records, insurance, tracking, and NABH-compliant ICU Chart & Nursing Workflow.
- **Inventory Service**: Stock management with alerts.
- **Biometric Service**: Fingerprint/facial recognition with AES-256 encryption and HIPAA compliance.
- **Equipment Servicing**: Asset inventory, maintenance scheduling, and AMC management.
- **Bed Management**: NABH-compliant centralized control, automated allocation, and discharge workflows.
- **Notification Service**: Multi-channel (Push, Email, SMS, WhatsApp) and multi-priority notifications.
- **Chatbot Service**: OpenAI GPT-powered for context-aware information.
- **Biomedical Waste Management (BMW)**: CPCB-compliant tracking.
- **Oxygen Tracking System**: NABH-compliant cylinder management and consumption tracking.
- **Consent Forms Management**: 14 trilingual templates with version tracking.
- **Prescription Management**: Comprehensive workflow with auto-generated medication schedules.
- **Medicine Database**: Searchable database of Indian medicines.
- **OT & ICU Swab Contamination Monitoring**: NABH-compliant environmental surveillance.
- **Disease Knowledge, Diet & Medication Scheduling**: AI-powered clinical knowledge, Indian diet plans, and personalized medication schedules using OpenAI GPT-4o, adhering to ICMR/MoHFW guidelines.
- **AI Intelligence Layer**: Hospital-wide analytics and predictions (Doctor/Nurse/OPD efficiency, Hospital Health Index, Compliance Risk, ICU load, oxygen demand) using AI Analytics Snapshots and Anomaly Detection.
- **Medical Store Integration**: Prescription sharing, dispensing, billing with GST, and audit logging.
- **Pathology Lab Service**: Test order management, sample collection (barcode tracking), result entry, and report generation.
- **Face Recognition Identity Verification**: Privacy-compliant biometric verification for patient identification and staff attendance.
- **Hospital Services Module**: Catalog of 4,830+ services across 24 departments.
- **Super Admin Portal**: Enterprise-level control for system settings, user/role management, billing, stock control, packages, claims, and audit logs.
- **ID Card Scanning & Alert System**: Dual-mode patient registration via ID card scanning with critical alert generation.
- **Nurse Department Preferences**: Nurses select 3 unique department preferences for scheduling.
- **Technician Portal**: Dedicated portal for diagnostic technicians for pending tests, report uploads, and notifications.

### System Design Choices
- **Role-Based Access Control**: Strict hierarchical permissions across all modules.
- **Session-Based Authentication**: Secure user sessions.
- **Real-time Capabilities**: WebSockets for instant notifications and data updates.
- **Microservice-like Architecture**: Logical separation of concerns.
- **Database Schema**: Extensive schema with over 60 tables.
- **Scalability**: Utilizes serverless PostgreSQL (Neon) and a robust Node.js backend.
- **Security & Data Isolation**: Patient data isolation, staff authentication via `staff_master` table, and comprehensive audit trails.
- **Critical Architecture Note**: All `staff_master` operations (CRUD) must use `databaseStorage.*` functions for persistence, as `storage.*` is in-memory. Login validation for specific roles also depends on an "ACTIVE" `staff_master` entry.
- **Team Members (hospital_team_members)**: ALL CRUD operations on team members (`/api/team-members`) now use `databaseStorage.*` for persistence across server restarts. The `storage.*` in-memory store is NO LONGER used for team member data. Both User Management and OPD Doctors pull from the same persistent DB source (`databaseStorage.getAllTeamMembers()` filtered by title).

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL.
- **Drizzle ORM**: Type-safe ORM for PostgreSQL.
- **@neondatabase/serverless**: For WebSocket connection pooling to the database.

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