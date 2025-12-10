# HMS Core - Hospital Management System

## Overview

HMS Core is a comprehensive healthcare management system configured for **Gravity Hospital** at Gat No, 167, Sahyog Nager, Triveni Nagar, Chowk, Pimpri-Chinchwad, Maharashtra 411062. The system provides role-based access control for different healthcare professionals (Administrators, Doctors, Nurses, OPD Managers, and Patients) with specialized dashboards and workflows for each role. Built with a focus on clinical clarity, professional trust, and efficient healthcare workflows, the system follows Material Design 3 principles adapted for healthcare industry requirements.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built using React with TypeScript, implementing a component-based architecture with the following key decisions:
- **UI Framework**: Radix UI primitives with shadcn/ui components for accessibility and consistency
- **Styling**: Tailwind CSS with custom design system variables for healthcare-specific color schemes
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and React hooks for local state
- **Theme System**: Custom theme provider supporting light/dark modes with healthcare-appropriate color palettes

### Backend Architecture
The backend follows a Node.js/Express architecture with the following structure:
- **Server Framework**: Express.js with TypeScript for type safety
- **Database ORM**: Drizzle ORM providing type-safe database operations
- **API Design**: RESTful endpoints with /api prefix for clear separation
- **Storage Layer**: Abstracted storage interface (IStorage) allowing for easy switching between implementations
- **Development Setup**: Vite integration for hot module replacement and development tooling

### Multi-Tenant Design
The system implements multi-tenancy at the application level:
- **Hospital Context**: Each hospital operates as a separate tenant with isolated data
- **Tenant Switching**: UI components support switching between hospital contexts
- **Role-Based Access**: Each user belongs to a specific hospital and has defined roles within that context
- **Data Isolation**: Database schema designed to maintain separation between hospital data

### Authentication and Authorization
- **Role-Based Access Control**: Five distinct user roles (ADMIN, DOCTOR, PATIENT, NURSE, OPD_MANAGER)
- **Hierarchical Permissions**: Different dashboard views and feature access based on user roles
- **Session Management**: Express session handling with secure authentication flows
- **Multi-Hospital Access**: Users can potentially access multiple hospital contexts

### Design System Integration
The architecture incorporates a comprehensive design system:
- **Healthcare-Specific Colors**: Medical blue primary palette with semantic colors for different states
- **Professional Typography**: Inter font family for clinical clarity
- **Component Library**: Extensive set of healthcare-optimized UI components
- **Accessibility**: WCAG 2.1 AA compliance built into component architecture

## External Dependencies

### Database and ORM
- **Neon Database**: PostgreSQL-compatible serverless database for scalable healthcare data storage
- **Drizzle ORM**: Type-safe database operations with schema migration support
- **Connection Pooling**: @neondatabase/serverless with WebSocket support for efficient connections

### UI and Styling
- **Radix UI**: Comprehensive set of accessible primitive components for form controls, dialogs, and navigation
- **Tailwind CSS**: Utility-first CSS framework with custom healthcare theme configuration
- **Lucide React**: Icon library providing medical and healthcare-specific iconography
- **Class Variance Authority**: Type-safe component variant management

### Development and Build Tools
- **Vite**: Fast development server and build tool with React plugin support
- **TypeScript**: Static type checking across frontend and backend
- **ESBuild**: Fast bundling for production builds
- **TSX**: TypeScript execution for development server

### Frontend State and Data Management
- **TanStack Query**: Server state management, caching, and synchronization
- **React Hook Form**: Form validation and management with healthcare form requirements
- **Wouter**: Lightweight routing solution for single-page application navigation
- **Date-fns**: Date manipulation utilities for appointment scheduling and medical records

### Backend Infrastructure
- **Express.js**: Web application framework with middleware support
- **Connect-pg-simple**: PostgreSQL session store for persistent user sessions
- **WebSocket Support**: Real-time capabilities for critical healthcare notifications

### Validation and Schema Management
- **Zod**: Runtime type validation for API endpoints and form data
- **Drizzle-Zod**: Integration between database schema and validation logic
- **React Hook Form Resolvers**: Zod integration for client-side form validation