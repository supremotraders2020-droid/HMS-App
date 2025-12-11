# HMS Core - Hospital Management System

## Overview
HMS Core is a comprehensive Hospital Management System designed for Gravity Hospital, offering role-based access for various healthcare professionals (Administrators, Doctors, Nurses, OPD Managers, and Patients). It provides specialized dashboards and workflows tailored to each role, focusing on clinical clarity, professional trust, and efficient healthcare workflows. The system adheres to Material Design 3 principles adapted for the healthcare industry. It includes modules for OPD management, patient services, inventory, patient tracking, biometrics, equipment servicing, chatbot, notifications, biomedical waste management, oxygen tracking, consent forms, prescription management, and a medicine database.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React and TypeScript, utilizing a component-based architecture. Key features include:
- **UI Framework**: Radix UI primitives with shadcn/ui for accessibility.
- **Styling**: Tailwind CSS with custom healthcare-specific design variables.
- **Routing**: Wouter for client-side routing.
- **State Management**: TanStack Query for server state and React hooks for local state.
- **Theme System**: Custom provider supporting light/dark modes and multi-theme color systems (Healthcare Blue, Medical Teal, Clinical Green, Warm Coral, Purple, Indigo).
- **Animations**: Framer Motion for fluid UI animations.

### Backend Architecture
The backend is a Node.js/Express application with TypeScript:
- **Server Framework**: Express.js for robust API handling.
- **Database ORM**: Drizzle ORM for type-safe database interactions.
- **API Design**: RESTful endpoints prefixed with `/api`.
- **Storage Layer**: Abstracted `IStorage` interface with a PostgreSQL implementation.
- **Development Setup**: Vite for hot module replacement.
- **Password Security**: bcrypt hashing with 10 salt rounds.

### Core Modules
The system comprises several core modules:
- **OPD Service**: Doctor scheduling, appointment booking, and reminders.
- **Patient Service**: Demographics, admission, medical records, and insurance.
- **Inventory Service**: Stock management, alerts, and transaction logging.
- **Patient Tracking Service**: Real-time patient monitoring, medication, meals, vitals, doctor visit tracking, and activity timelines.
- **Biometric Service**: Fingerprint/facial recognition, AES-256 encryption, HIPAA compliance.
- **Equipment Servicing**: Asset inventory, maintenance scheduling, and service history.
- **Chatbot Service**: OpenAI GPT-powered, context-aware information.
- **Notification Service**: Multi-channel delivery (Push, Email, SMS, WhatsApp) with priority levels.
- **Biomedical Waste Management (BMW)**: CPCB-compliant tracking of waste bags, categories, storage, pickups, disposal, and compliance reporting.
- **Oxygen Tracking System**: NABH-compliant cylinder inventory, movement logging, consumption tracking, LMO readings, and alerts.
- **Consent Forms Management**: Template-based form generation, PDF handling, signature capture, and status tracking.
- **Prescription Management**: Doctor prescription creation, medicine database integration, and history.
- **Medicine Database**: Searchable database of Indian medicines with dosage and composition.

### Multi-Tenant Design
The system supports multi-tenancy at the application level, isolating data for each hospital. Users are assigned to a specific hospital context with role-based access.

### Authentication and Authorization
- **Role-Based Access Control (RBAC)**: Five roles (ADMIN, DOCTOR, PATIENT, NURSE, OPD_MANAGER) with hierarchical permissions.
- **NURSE Restrictions**: Nurses can only view assigned patients, receive patient-specific notifications, and have no access to Equipment Servicing or Consent Forms.
- **Session Management**: Express session handling with secure authentication.
- **Daily Doctor Oath (NMC Physician's Pledge)**: Doctors must accept the NMC Physician's Pledge on first login each day. Blocks access until accepted, with database tracking of doctor_id, date, and timestamp.

### Design System Integration
A comprehensive design system is integrated, featuring:
- Healthcare-specific color palettes and semantic colors.
- Multi-theme support (6 distinct color themes).
- Professional typography (Inter font family).
- Extensive, accessible, and responsive UI components optimized for healthcare.

## External Dependencies

### Database and ORM
- **Neon Database**: Serverless PostgreSQL-compatible database.
- **Drizzle ORM**: Type-safe ORM for database operations.
- **@neondatabase/serverless**: Connection pooling with WebSocket support.

### UI and Styling
- **Radix UI**: Accessible primitive UI components.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **Class Variance Authority**: Type-safe component variant management.
- **Framer Motion**: Animation library.

### Development and Build Tools
- **Vite**: Fast development server and build tool.
- **TypeScript**: Static type checking.
- **ESBuild**: Fast production bundling.
- **TSX**: TypeScript execution for development.

### Frontend State and Data Management
- **TanStack Query**: Server state management and caching.
- **React Hook Form**: Form validation and management.
- **Wouter**: Lightweight routing.
- **Date-fns**: Date manipulation utilities.

### Backend Infrastructure
- **Express.js**: Web application framework.
- **Connect-pg-simple**: PostgreSQL session store.
- **WebSocket Support**: Real-time communication.
- **bcrypt**: Secure password hashing.

### Validation and Schema Management
- **Zod**: Runtime type validation.
- **Drizzle-Zod**: Integration between Drizzle schema and Zod.
- **React Hook Form Resolvers**: Zod integration for client-side form validation.

### AI Integration
- **OpenAI API**: For the GPT-powered chatbot service.