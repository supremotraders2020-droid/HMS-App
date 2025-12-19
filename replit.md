# HMS Core - Hospital Management System

## Overview
HMS Core is a comprehensive Hospital Management System designed for Gravity Hospital, offering role-based access for various healthcare professionals (Administrators, Doctors, Nurses, OPD Managers, and Patients). It provides specialized dashboards and workflows tailored to each role, focusing on clinical clarity, professional trust, and efficient healthcare workflows. The system adheres to Material Design 3 principles adapted for the healthcare industry. The project aims to provide a robust, scalable, and intelligent platform for modern hospital management, integrating AI for enhanced decision-making and operational efficiency.

## User Preferences
- Preferred communication style: Simple, everyday language
- Real data only: All doctor and nurse data must be added by admin (no mock/dummy data)
- Multi-language support: English/Hindi/Marathi for consent forms (Trilingual)

## System Architecture

### UI/UX Decisions
The system implements Material Design 3 principles, adapted for healthcare. It supports light/dark modes and offers multiple theme color systems: Healthcare Blue, Medical Teal, Clinical Green, Warm Coral, Purple, and Indigo. Role-based UI filtering ensures users only see relevant information and actions.

### Technical Implementations
The frontend is built with React 18 and TypeScript, utilizing Radix UI and shadcn/ui for accessible components, Tailwind CSS for styling, Wouter for routing, TanStack Query v5 for server state, React Hook Form with Zod for validation, Framer Motion for animations, and Lucide React for icons.

The backend uses Node.js with Express, Drizzle ORM for type-safe database interactions, PostgreSQL (Neon) as the serverless database, bcrypt for password hashing (10 rounds), Express Sessions for authentication, and WebSockets for real-time notifications. OpenAI GPT-4o is integrated for AI services.

### Feature Specifications
HMS Core includes 18 core modules, with a strong emphasis on role-based access control for ADMIN, DOCTOR, NURSE, OPD_MANAGER, and PATIENT roles.

Key modules and features include:
- **Authentication & RBAC**: Session-based authentication, bcrypt hashing, daily Doctor Oath requirement, and role-based UI filtering.
- **OPD Service**: Doctor scheduling, appointment booking (30-minute slots), Google Maps integration for hospital locations, and real-time slot status.
- **Patient Service**: Patient demographics, admission management, medical records, insurance tracking, and patient notifications.
- **Patient Tracking Service**: Admission workflow, doctor visit scheduling, and patient status tracking.
- **Patient Monitoring Module**: NABH-compliant ICU Chart & Nursing Workflow with 14 sub-modules for 24-hour data collection (Vitals, Inotropes, Ventilator Settings, ABG, Intake/Output Charts, Medication Admin, etc.), supporting shift-based logging, version control, and critical alerts.
- **Inventory Service**: Stock management with alerts for disposables, medicines, and equipment, including transaction logging and low stock notifications.
- **Biometric Service**: Fingerprint/facial recognition with AES-256 encryption and HIPAA compliance.
- **Equipment Servicing**: Asset inventory, maintenance scheduling, service history, and AMC management.
- **Bed Management**: NABH-compliant centralized control with bed categories, master records, automated allocation, transfer logs, discharge workflows, and status tracking (Available, Occupied, Cleaning, Blocked, Maintenance). Includes dashboard analytics for occupancy rates.
- **Notification Service**: Multi-channel (Push, Email, SMS, WhatsApp) and multi-priority notifications with WebSocket real-time delivery and role-based filtering.
- **Chatbot Service**: OpenAI GPT-powered for context-aware information and patient query handling.
- **Biomedical Waste Management (BMW)**: CPCB-compliant tracking for Yellow, Red, White, and Blue categories, including barcode generation, storage monitoring, vendor management, and compliance reporting.
- **Oxygen Tracking System**: NABH-compliant cylinder management (B, D, Jumbo types), status tracking, movement logging, patient-wise consumption, LMO readings, and low stock alerts.
- **Consent Forms Management**: 14 trilingual templates (English, Hindi, Marathi) across legal, surgical, diagnostic, treatment, and maternal categories, with PDF preview, download, version tracking, and print functionality.
- **Prescription Management**: Comprehensive workflow with statuses (draft, awaiting_signature, finalized, void), auto-generated medication schedules, vitals recording, and role-based access for creation and finalization.
- **Medicine Database**: Searchable database of Indian medicines with detailed fields.
- **OT & ICU Swab Contamination Monitoring**: NABH-compliant environmental surveillance with auto-interpretation logic (PASS/ACCEPTABLE/FAIL), CAPA generation, and full audit logging.
- **Disease Knowledge, Diet & Medication Scheduling**: AI-powered clinical knowledge for pre-seeded diseases (Diabetes Type 2, Hypertension, Tuberculosis, Dengue, Asthma), Indian diet plans, medication schedule templates, and AI-powered personalization using OpenAI GPT-4o, adhering to ICMR/MoHFW guidelines.
- **AI Intelligence Layer**: Hospital-wide analytics and predictions including Doctor/Nurse/OPD efficiency, Hospital Health Index, Compliance Risk, and predictive analytics for ICU load and oxygen demand using AI Analytics Snapshots and Anomaly Detection.

### System Design Choices
- **Role-Based Access Control**: Strict hierarchical permissions for all modules and data.
- **Session-Based Authentication**: Secure user sessions managed via Express Sessions and stored in PostgreSQL.
- **Real-time Capabilities**: WebSockets for instant notifications and data updates.
- **Microservice-like Architecture**: Logical separation of concerns for various services (OPD, Patient, Inventory, etc.)
- **Database Schema**: Extensive schema with over 60 tables to support complex healthcare data.
- **Scalability**: Utilizes serverless PostgreSQL (Neon) and a robust Node.js backend to handle growth.

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL for scalable and reliable data storage.
- **Drizzle ORM**: Type-safe ORM for interacting with the PostgreSQL database.
- **@neondatabase/serverless**: Enables WebSocket connection pooling for efficient database access.

### UI/Styling
- **Radix UI**: Provides unstyled, accessible components for building the user interface.
- **Tailwind CSS**: A utility-first CSS framework for rapid and consistent styling.
- **Lucide React**: An open-source icon library for UI elements.
- **Framer Motion**: A production-ready motion library for React to implement animations.

### Backend
- **Express.js**: The web application framework for Node.js, forming the core of the backend.
- **connect-pg-simple**: PostgreSQL session store for persistent and secure user sessions.
- **bcrypt**: Library for hashing passwords securely.
- **ws**: A simple to use, blazing fast and thoroughly tested WebSocket client and server for Node.js.

### AI Integration
- **OpenAI API**: Utilized for GPT-4o, providing AI capabilities such as chatbot assistance, health tips, and personalized care plans within the system.