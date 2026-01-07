# HMS Core - Complete Database Structure

## Overview

This document provides a complete overview of the database structure for Gravity Hospital Management System. The system uses PostgreSQL as the database with Drizzle ORM for type-safe operations.

---

## Table of Contents

1. [Users & Authentication](#1-users--authentication)
2. [Doctors & Scheduling](#2-doctors--scheduling)
3. [Appointments](#3-appointments)
4. [Inventory Management](#4-inventory-management)
5. [Patient Tracking Service](#5-patient-tracking-service)
6. [Chatbot Service](#6-chatbot-service)
7. [Patient Service](#7-patient-service)
8. [Biometric Service](#8-biometric-service)
9. [Notification Service](#9-notification-service)
10. [Entity Relationship Diagram](#10-entity-relationship-diagram)

---

## 1. Users & Authentication

### Table: `users`

Stores all system users including admins, doctors, nurses, OPD managers, patients, and specialized roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT UUID | Unique user identifier |
| `username` | TEXT | NOT NULL, UNIQUE | Login username |
| `password` | TEXT | NOT NULL | Hashed password (bcrypt, 10 rounds) |
| `role` | TEXT | NOT NULL, DEFAULT 'PATIENT' | User role (see valid roles below) |
| `name` | TEXT | NULLABLE | Full name of user |
| `email` | TEXT | NULLABLE | Email address |
| `date_of_birth` | TEXT | NULLABLE | Date of birth |
| `status` | TEXT | NOT NULL, DEFAULT 'ACTIVE' | ACTIVE or INACTIVE |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Account creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update time |
| `created_by` | VARCHAR | NULLABLE | ID of user who created this account |

**Valid Roles:** `SUPER_ADMIN`, `ADMIN`, `DOCTOR`, `NURSE`, `OPD_MANAGER`, `PATIENT`, `MEDICAL_STORE`, `PATHOLOGY_LAB`

### Table: `staff_master`

Staff authentication validation table. Staff roles require an ACTIVE entry here to login.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT UUID | Unique identifier |
| `user_id` | VARCHAR | NOT NULL | Reference to users table |
| `employee_id` | TEXT | UNIQUE | Unique employee ID |
| `name` | TEXT | NOT NULL | Staff full name |
| `role` | TEXT | NOT NULL | DOCTOR, NURSE, OPD_MANAGER, ADMIN |
| `department` | TEXT | NULLABLE | Hospital department |
| `specialization` | TEXT | NULLABLE | Medical specialization |
| `qualification` | TEXT | NULLABLE | Qualifications |
| `phone` | TEXT | NULLABLE | Contact phone |
| `email` | TEXT | NULLABLE | Contact email |
| `status` | TEXT | NOT NULL, DEFAULT 'ACTIVE' | ACTIVE or INACTIVE |
| `joining_date` | TEXT | NULLABLE | Date of joining |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update time |

**Security:** Auto-created when Admin adds users. Staff roles require ACTIVE staff_master entry to login.

---

## 2. Doctors & Scheduling

### Table: `doctors`

Stores doctor profiles and availability information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT UUID | Unique doctor identifier |
| `name` | TEXT | NOT NULL | Doctor's full name |
| `specialty` | TEXT | NOT NULL | Medical specialty (e.g., Cardiology, Pediatrics) |
| `qualification` | TEXT | NOT NULL | Degrees and certifications |
| `experience` | INTEGER | NOT NULL | Years of experience |
| `rating` | TEXT | NOT NULL, DEFAULT '4.5' | Average patient rating |
| `available_days` | TEXT | NOT NULL | Days available for appointments |
| `avatar_initials` | TEXT | NOT NULL | Initials for avatar display |

### Table: `schedules`

Stores time slots for doctor appointments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT UUID | Unique schedule identifier |
| `doctor_id` | VARCHAR | NOT NULL | Reference to doctors table |
| `date` | TEXT | NOT NULL | Appointment date |
| `time_slot` | TEXT | NOT NULL | Time slot (e.g., "10:00 AM - 10:30 AM") |
| `is_booked` | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether slot is booked |

---

## 3. Appointments

### Table: `appointments`

Stores patient appointment bookings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT UUID | Unique identifier |
| `appointment_id` | TEXT | NOT NULL, UNIQUE | Human-readable appointment ID |
| `patient_name` | TEXT | NOT NULL | Patient's full name |
| `patient_phone` | TEXT | NOT NULL | Patient's phone number |
| `patient_email` | TEXT | NULLABLE | Patient's email |
| `doctor_id` | VARCHAR | NOT NULL | Reference to doctors table |
| `appointment_date` | TEXT | NOT NULL | Date of appointment |
| `time_slot` | TEXT | NOT NULL | Time slot of appointment |
| `symptoms` | TEXT | NULLABLE | Patient's symptoms |
| `status` | TEXT | NOT NULL, DEFAULT 'scheduled' | Status: scheduled, completed, cancelled |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation time |

---

## 4. Inventory Management

### Table: `inventory_items`

Stores hospital inventory items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT UUID | Unique item identifier |
| `name` | TEXT | NOT NULL | Item name |
| `category` | TEXT | NOT NULL | Category: disposables, syringes, gloves, medicines, equipment |
| `current_stock` | INTEGER | NOT NULL, DEFAULT 0 | Current quantity in stock |
| `low_stock_threshold` | INTEGER | NOT NULL, DEFAULT 10 | Threshold for low stock alert |
| `unit` | TEXT | NOT NULL, DEFAULT 'units' | Unit of measurement |
| `cost` | TEXT | NOT NULL | Cost per unit |
| `supplier` | TEXT | NULLABLE | Supplier name |
| `description` | TEXT | NULLABLE | Item description |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update time |

### Table: `staff_members`

Stores hospital staff information for inventory management.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT UUID | Unique staff identifier |
| `name` | TEXT | NOT NULL | Staff member name |
| `role` | TEXT | NOT NULL | Role: doctor, nurse, technician, pharmacist, administrator |
| `email` | TEXT | NULLABLE | Email address |
| `phone` | TEXT | NULLABLE | Phone number |
| `department` | TEXT | NULLABLE | Department name |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |

### Table: `inventory_patients`

Stores patient information for inventory transactions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT UUID | Unique identifier |
| `patient_id` | TEXT | NOT NULL, UNIQUE | Human-readable patient ID |
| `name` | TEXT | NOT NULL | Patient name |
| `phone` | TEXT | NULLABLE | Phone number |
| `address` | TEXT | NULLABLE | Address |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |

### Table: `inventory_transactions`

Logs all inventory movements (issue, return, dispose).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT UUID | Unique transaction identifier |
| `type` | TEXT | NOT NULL | Transaction type: ISSUE, RETURN, DISPOSE |
| `item_id` | VARCHAR | NOT NULL | Reference to inventory_items |
| `quantity` | INTEGER | NOT NULL | Quantity involved |
| `staff_id` | VARCHAR | NULLABLE | Reference to staff_members |
| `patient_id` | VARCHAR | NULLABLE | Reference to inventory_patients |
| `notes` | TEXT | NULLABLE | Transaction notes |
| `remaining_stock` | INTEGER | NOT NULL | Stock after transaction |
| `total_cost` | TEXT | NULLABLE | Total cost of transaction |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Transaction time |

---

## 5. Patient Tracking Service

### Table: `tracking_patients`

Stores currently admitted patients for tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT UUID | Unique identifier |
| `name` | TEXT | NOT NULL | Patient name |
| `age` | INTEGER | NOT NULL | Patient age |
| `gender` | TEXT | NOT NULL | Gender: Male, Female, Other |
| `department` | TEXT | NOT NULL | Hospital department |
| `room` | TEXT | NOT NULL | Room number |
| `diagnosis` | TEXT | NOT NULL | Primary diagnosis |
| `admission_date` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Admission date and time |
| `discharge_date` | TIMESTAMP | NULLABLE | Discharge date (null if still admitted) |
| `status` | TEXT | NOT NULL, DEFAULT 'admitted' | Status: admitted, discharged |
| `doctor` | TEXT | NOT NULL | Attending doctor |
| `notes` | TEXT | NULLABLE | Additional notes |

### Table: `medications`

Tracks medications administered to patients.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT UUID | Unique identifier |
| `patient_id` | VARCHAR | NOT NULL | Reference to tracking_patients |
| `name` | TEXT | NOT NULL | Medication name |
| `dosage` | TEXT | NOT NULL | Dosage (e.g., "500mg") |
| `route` | TEXT | NOT NULL | Route: Oral, IV, IM, SC, Topical, etc. |
| `frequency` | TEXT | NOT NULL | Frequency (e.g., "Every 8 hours") |
| `administered_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Administration time |
| `administered_by` | TEXT | NOT NULL | Name of nurse/doctor |
| `notes` | TEXT | NULLABLE | Additional notes |

### Table: `meals`

Tracks patient meals and dietary information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT UUID | Unique identifier |
| `patient_id` | VARCHAR | NOT NULL | Reference to tracking_patients |
| `meal_type` | TEXT | NOT NULL | Type: Breakfast, Lunch, Dinner, Snack |
| `description` | TEXT | NOT NULL | Meal description |
| `calories` | INTEGER | NULLABLE | Calorie count |
| `dietary_restrictions` | TEXT | NULLABLE | Dietary restrictions |
| `consumption_percentage` | INTEGER | NOT NULL, DEFAULT 100 | Percentage consumed |
| `served_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Time meal was served |
| `served_by` | TEXT | NOT NULL | Staff who served meal |
| `notes` | TEXT | NULLABLE | Additional notes |

### Table: `vitals`

Records patient vital signs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT UUID | Unique identifier |
| `patient_id` | VARCHAR | NOT NULL | Reference to tracking_patients |
| `temperature` | TEXT | NULLABLE | Temperature in Fahrenheit |
| `heart_rate` | INTEGER | NULLABLE | Heart rate (BPM) |
| `blood_pressure_systolic` | INTEGER | NULLABLE | Systolic BP (mmHg) |
| `blood_pressure_diastolic` | INTEGER | NULLABLE | Diastolic BP (mmHg) |
| `respiratory_rate` | INTEGER | NULLABLE | Breaths per minute |
| `oxygen_saturation` | INTEGER | NULLABLE | SpO2 percentage |
| `recorded_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Recording time |
| `recorded_by` | TEXT | NOT NULL | Name of recorder |
| `notes` | TEXT | NULLABLE | Additional notes |

---

## 6. Chatbot Service

### Table: `conversation_logs`

Stores AI chatbot conversation history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT UUID | Unique identifier |
| `user_id` | TEXT | NULLABLE | User who initiated chat |
| `query` | TEXT | NOT NULL | User's question |
| `response` | TEXT | NOT NULL | AI response |
| `category` | TEXT | NULLABLE | Query category |
| `timestamp` | TIMESTAMP | DEFAULT NOW() | Conversation time |

---

## 7. Patient Service

### Table: `service_patients`

Stores comprehensive patient demographic information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT UUID | Unique patient identifier |
| `first_name` | TEXT | NOT NULL | Patient first name |
| `last_name` | TEXT | NOT NULL | Patient last name |
| `date_of_birth` | TEXT | NOT NULL | Date of birth |
| `gender` | TEXT | NOT NULL | Gender: Male, Female, Other |
| `phone` | TEXT | NULLABLE | Phone number |
| `email` | TEXT | NULLABLE | Email address |
| `address` | TEXT | NULLABLE | Full address |
| `emergency_contact` | TEXT | NULLABLE | Emergency contact name |
| `emergency_phone` | TEXT | NULLABLE | Emergency contact phone |
| `insurance_provider` | TEXT | NULLABLE | Insurance company name |
| `insurance_number` | TEXT | NULLABLE | Insurance policy number |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |

### Table: `admissions`

Tracks patient hospital admissions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT UUID | Unique admission identifier |
| `patient_id` | VARCHAR | NOT NULL | Reference to service_patients |
| `admission_date` | TIMESTAMP | DEFAULT NOW() | Admission date and time |
| `discharge_date` | TIMESTAMP | NULLABLE | Discharge date (null if admitted) |
| `department` | TEXT | NOT NULL | Hospital department |
| `room_number` | TEXT | NULLABLE | Room number |
| `admitting_physician` | TEXT | NOT NULL | Doctor name |
| `primary_diagnosis` | TEXT | NULLABLE | Primary diagnosis |
| `status` | TEXT | NOT NULL, DEFAULT 'admitted' | Status: admitted, discharged |
| `notes` | TEXT | NULLABLE | Additional notes |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |

### Table: `medical_records`

Stores patient medical records with optional file attachments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT UUID | Unique record identifier |
| `patient_id` | VARCHAR | NOT NULL | Reference to service_patients |
| `record_date` | TIMESTAMP | DEFAULT NOW() | Record date |
| `record_type` | TEXT | NOT NULL | Type: diagnosis, lab_result, treatment, prescription, note |
| `title` | TEXT | NOT NULL | Record title |
| `description` | TEXT | NOT NULL | Detailed description |
| `physician` | TEXT | NOT NULL | Recording physician |
| `file_name` | TEXT | NULLABLE | Attached file name |
| `file_data` | TEXT | NULLABLE | Base64 encoded file data |
| `file_type` | TEXT | NULLABLE | File MIME type |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |

---

## 8. Biometric Service

### Table: `biometric_templates`

Stores encrypted biometric data for patient verification.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT UUID | Unique template identifier |
| `patient_id` | VARCHAR | NOT NULL | Reference to patient |
| `biometric_type` | TEXT | NOT NULL | Type: fingerprint, face |
| `template_data` | TEXT | NOT NULL | AES-256 encrypted template |
| `encryption_iv` | TEXT | NOT NULL | Initialization vector for AES |
| `quality` | INTEGER | NOT NULL, DEFAULT 0 | Template quality score (0-100) |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether template is active |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update time |

### Table: `biometric_verifications`

Logs all biometric verification attempts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT UUID | Unique verification identifier |
| `patient_id` | VARCHAR | NOT NULL | Reference to patient |
| `template_id` | VARCHAR | NULLABLE | Reference to biometric_templates |
| `biometric_type` | TEXT | NOT NULL | Type: fingerprint, face |
| `confidence_score` | DECIMAL(5,2) | NOT NULL | Match confidence (0.00-100.00) |
| `is_match` | BOOLEAN | NOT NULL | Whether verification succeeded |
| `verified_at` | TIMESTAMP | DEFAULT NOW() | Verification time |
| `ip_address` | TEXT | NULLABLE | Client IP address |
| `device_info` | TEXT | NULLABLE | Device information |

---

## 9. Notification Service

### Table: `notifications`

Stores all hospital notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT UUID | Unique notification identifier |
| `title` | TEXT | NOT NULL | Notification title |
| `message` | TEXT | NOT NULL | Notification message body |
| `category` | TEXT | NOT NULL | Category: health_tips, hospital_updates, emergency, opd_announcements, disease_alerts, general |
| `priority` | TEXT | NOT NULL, DEFAULT 'medium' | Priority: low, medium, high, critical |
| `channels` | TEXT[] | NOT NULL | Array of channels: push, email, sms, whatsapp |
| `scheduled_at` | TIMESTAMP | NULLABLE | Scheduled send time |
| `media_files` | TEXT | NULLABLE | JSON string of media attachments |
| `attached_link` | TEXT | NULLABLE | Optional link |
| `status` | TEXT | NOT NULL, DEFAULT 'draft' | Status: draft, scheduled, sent, failed |
| `created_by` | TEXT | NULLABLE | Creator user ID |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation time |
| `sent_at` | TIMESTAMP | NULLABLE | Actual send time |

### Table: `hospital_team_members`

Stores hospital team directory for notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT UUID | Unique member identifier |
| `name` | TEXT | NOT NULL | Full name |
| `title` | TEXT | NOT NULL | Job title |
| `department` | TEXT | NOT NULL | Department name |
| `specialization` | TEXT | NULLABLE | Medical specialization |
| `email` | TEXT | NOT NULL | Email address |
| `phone` | TEXT | NOT NULL | Phone number |
| `photo_url` | TEXT | NULLABLE | Profile photo URL |
| `is_on_call` | BOOLEAN | NOT NULL, DEFAULT FALSE | Currently on call |
| `status` | TEXT | NOT NULL, DEFAULT 'available' | Status: available, busy, offline |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update time |

---

## 10. Entity Relationship Diagram

```
+------------------+     +------------------+     +------------------+
|      users       |     |     doctors      |     |    schedules     |
+------------------+     +------------------+     +------------------+
| id (PK)          |     | id (PK)          |     | id (PK)          |
| username         |     | name             |<----| doctor_id (FK)   |
| password         |     | specialty        |     | date             |
| role             |     | qualification    |     | time_slot        |
| name             |     | experience       |     | is_booked        |
| email            |     | rating           |     +------------------+
+------------------+     | available_days   |
                         | avatar_initials  |     +------------------+
                         +------------------+     |   appointments   |
                               ^                  +------------------+
                               |                  | id (PK)          |
                               +------------------| doctor_id (FK)   |
                                                  | appointment_id   |
                                                  | patient_name     |
                                                  | patient_phone    |
                                                  | appointment_date |
                                                  | time_slot        |
                                                  | symptoms         |
                                                  | status           |
                                                  +------------------+

+------------------+     +------------------+     +------------------------+
| inventory_items  |     | staff_members    |     | inventory_transactions |
+------------------+     +------------------+     +------------------------+
| id (PK)          |<----| id (PK)          |<----| id (PK)                |
| name             |     | name             |     | type                   |
| category         |     | role             |     | item_id (FK)           |
| current_stock    |     | email            |     | quantity               |
| low_stock_thresh |     | phone            |     | staff_id (FK)          |
| unit             |     | department       |     | patient_id (FK)        |
| cost             |     +------------------+     | remaining_stock        |
| supplier         |                              | total_cost             |
+------------------+     +------------------+     +------------------------+
                         | inventory_patients|          |
                         +------------------+<---------+
                         | id (PK)          |
                         | patient_id       |
                         | name             |
                         | phone            |
                         +------------------+

+------------------+     +------------------+     +------------------+
| tracking_patients|<-+  |   medications    |     |     vitals       |
+------------------+  |  +------------------+     +------------------+
| id (PK)          |  |  | id (PK)          |     | id (PK)          |
| name             |  +--| patient_id (FK)  |     | patient_id (FK)  |--+
| age              |  |  | name             |     | temperature      |  |
| gender           |  |  | dosage           |     | heart_rate       |  |
| department       |  |  | route            |     | bp_systolic      |  |
| room             |  |  | frequency        |     | bp_diastolic     |  |
| diagnosis        |  |  | administered_at  |     | respiratory_rate |  |
| admission_date   |  |  | administered_by  |     | oxygen_saturation|  |
| discharge_date   |  |  +------------------+     | recorded_at      |  |
| status           |  |                           | recorded_by      |  |
| doctor           |  |  +------------------+     +------------------+  |
| notes            |  |  |      meals       |                          |
+------------------+  |  +------------------+                          |
                      |  | id (PK)          |                          |
                      +--| patient_id (FK)  |<-------------------------+
                         | meal_type        |
                         | description      |
                         | calories         |
                         | served_at        |
                         | served_by        |
                         +------------------+

+------------------+     +------------------+     +------------------+
| service_patients |<-+  |    admissions    |     | medical_records  |
+------------------+  |  +------------------+     +------------------+
| id (PK)          |  |  | id (PK)          |     | id (PK)          |
| first_name       |  +--| patient_id (FK)  |     | patient_id (FK)  |--+
| last_name        |  |  | admission_date   |     | record_date      |  |
| date_of_birth    |  |  | discharge_date   |     | record_type      |  |
| gender           |  |  | department       |     | title            |  |
| phone            |  |  | room_number      |     | description      |  |
| email            |  |  | admitting_phys   |     | physician        |  |
| address          |  |  | primary_diagnosis|     | file_name        |  |
| emergency_contact|  |  | status           |     | file_data        |  |
| emergency_phone  |  |  | notes            |     | file_type        |  |
| insurance_prov   |  |  +------------------+     +------------------+  |
| insurance_num    |  |                                                 |
+------------------+  +-------------------------------------------------+

+----------------------+     +-------------------------+
| biometric_templates  |     | biometric_verifications |
+----------------------+     +-------------------------+
| id (PK)              |<----| id (PK)                 |
| patient_id           |     | patient_id              |
| biometric_type       |     | template_id (FK)        |
| template_data        |     | biometric_type          |
| encryption_iv        |     | confidence_score        |
| quality              |     | is_match                |
| is_active            |     | verified_at             |
+----------------------+     | ip_address              |
                             | device_info             |
                             +-------------------------+

+------------------+     +----------------------+
|   notifications  |     | hospital_team_members|
+------------------+     +----------------------+
| id (PK)          |     | id (PK)              |
| title            |     | name                 |
| message          |     | title                |
| category         |     | department           |
| priority         |     | specialization       |
| channels[]       |     | email                |
| scheduled_at     |     | phone                |
| media_files      |     | photo_url            |
| attached_link    |     | is_on_call           |
| status           |     | status               |
| created_by       |     +----------------------+
| sent_at          |
+------------------+

+------------------+
| conversation_logs|
+------------------+
| id (PK)          |
| user_id          |
| query            |
| response         |
| category         |
| timestamp        |
+------------------+
```

---

## Summary Statistics

| Service | Tables | Description |
|---------|--------|-------------|
| Authentication | 1 | User management and roles |
| Doctor Management | 2 | Doctor profiles and scheduling |
| Appointments | 1 | Patient appointment bookings |
| Inventory | 4 | Medical supplies and transactions |
| Patient Tracking | 4 | Inpatient monitoring (vitals, meds, meals) |
| Chatbot | 1 | AI conversation logging |
| Patient Service | 3 | Patient records and admissions |
| Biometric | 2 | Secure patient verification |
| Notification | 2 | Hospital communication system |
| **Total** | **20** | Complete HMS database |

---

## Demo Users

The system comes pre-configured with 25 demo users (5 per role):

| Role | Username Pattern | Password |
|------|------------------|----------|
| ADMIN | admin1-5 | Admin@123 |
| DOCTOR | doctor1-5 | Doctor@123 |
| NURSE | nurse1-5 | Nurse@123 |
| OPD_MANAGER | opd1-5 | OPD@123 |
| PATIENT | patient1-5 | Patient@123 |

---

## Hospital Configuration

- **Hospital Name:** Gravity Hospital
- **Location:** Chikhali, Pimpri-Chinchwad, Maharashtra 411062
- **Primary Color:** Medical Blue (#2563eb)

---

*Document generated for HMS Core - Gravity Hospital Management System*
