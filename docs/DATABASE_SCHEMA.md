# HMS Core - Database Schema Documentation

## Overview
This document provides comprehensive documentation of all database tables used in the HMS Core Hospital Management System. The database uses PostgreSQL (Neon serverless) with Drizzle ORM for type-safe operations.

**Total Tables**: 60+  
**ORM**: Drizzle ORM  
**Database**: PostgreSQL (Neon Serverless)

---

## Table of Contents
1. [Authentication & Users](#1-authentication--users)
2. [Doctor Management](#2-doctor-management)
3. [Patient Management](#3-patient-management)
4. [Appointments & Scheduling](#4-appointments--scheduling)
5. [Inventory Management](#5-inventory-management)
6. [Patient Tracking](#6-patient-tracking)
7. [Biometric Service](#7-biometric-service)
8. [Notifications](#8-notifications)
9. [Equipment Servicing](#9-equipment-servicing)
10. [Hospital Settings](#10-hospital-settings)
11. [Prescriptions](#11-prescriptions)
12. [Consent Forms](#12-consent-forms)
13. [Medicines Database](#13-medicines-database)
14. [Oxygen Tracking](#14-oxygen-tracking)
15. [Biomedical Waste Management](#15-biomedical-waste-management)
16. [AI Intelligence Layer](#16-ai-intelligence-layer)
17. [Patient Billing](#17-patient-billing)
18. [Health Tips](#18-health-tips)
19. [Swab Contamination Monitoring](#19-swab-contamination-monitoring)
20. [Disease Knowledge Module](#20-disease-knowledge-module)
21. [Patient Monitoring Module](#21-patient-monitoring-module)

---

## 1. Authentication & Users

### users
Core user authentication table.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID, auto-generated |
| username | text | Unique login identifier |
| password | text | bcrypt hashed (10 rounds) |
| role | text | ADMIN, DOCTOR, NURSE, OPD_MANAGER, PATIENT |
| name | text | Display name |
| email | text | Email address |

### doctor_oath_confirmations
Daily NMC Physician's Pledge acceptance tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| doctor_id | varchar | Reference to doctor |
| date | text | YYYY-MM-DD format |
| oath_accepted | boolean | Confirmation flag |
| accepted_at | timestamp | Acceptance timestamp |

---

## 2. Doctor Management

### doctors
Basic doctor information for scheduling.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| name | text | Doctor's name |
| specialty | text | Medical specialty |
| qualification | text | Degrees and certifications |
| experience | integer | Years of experience |
| rating | text | Patient rating (default 4.5) |
| available_days | text | Comma-separated days |
| avatar_initials | text | Display initials |

### doctor_profiles
Extended doctor profile information.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| doctor_id | varchar | Reference to doctors table |
| full_name | text | Complete name |
| specialty | text | Medical specialty |
| email | text | Contact email |
| phone | text | Contact phone |
| qualifications | text | All qualifications |
| experience | text | Experience description |
| designation | text | Current designation |
| department | text | Hospital department |
| photo_url | text | Profile photo URL |
| bio | text | Biography |
| languages | text | Languages spoken |
| consultation_fee | text | Fee amount |
| hospital_name | text | Associated hospital |
| hospital_address | text | Hospital address |
| created_at | timestamp | Record creation |
| updated_at | timestamp | Last update |

### doctor_schedules
Date-specific availability slots.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| doctor_id | varchar | Reference to doctor |
| day | text | Day of week |
| specific_date | text | YYYY-MM-DD format |
| start_time | text | Slot start time |
| end_time | text | Slot end time |
| slot_type | text | OPD, Surgery, Consultation |
| location | text | Pune location |
| max_patients | integer | Maximum bookings |
| is_available | boolean | Availability flag |
| created_at | timestamp | Record creation |
| updated_at | timestamp | Last update |

### doctor_time_slots
Individual 30-minute appointment slots.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| schedule_id | varchar | Reference to schedules |
| doctor_id | varchar | Reference to doctor |
| doctor_name | text | Denormalized name |
| slot_date | text | YYYY-MM-DD format |
| start_time | text | HH:MM AM/PM format |
| end_time | text | HH:MM AM/PM format |
| slot_type | text | OPD, Surgery, Consultation |
| location | text | Appointment location |
| status | text | available, booked, cancelled, completed |
| appointment_id | varchar | Linked appointment |
| patient_id | varchar | Booked patient |
| patient_name | text | Patient name |
| booked_at | timestamp | Booking timestamp |
| created_at | timestamp | Record creation |
| updated_at | timestamp | Last update |

### doctor_patients
Patients assigned to doctors.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| doctor_id | varchar | Reference to doctor |
| patient_name | text | Patient name |
| patient_age | integer | Age |
| patient_gender | text | Gender |
| patient_phone | text | Contact phone |
| patient_email | text | Contact email |
| patient_address | text | Address |
| blood_group | text | Blood type |
| allergies | text | Known allergies |
| medical_history | text | Medical history |
| last_visit | text | Last visit date |
| status | text | active, inactive, discharged |
| created_at | timestamp | Record creation |
| updated_at | timestamp | Last update |

---

## 3. Patient Management

### patient_profiles
Extended patient profile information.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| patient_id | varchar | Reference to patient user |
| full_name | text | Complete name |
| email | text | Contact email |
| phone | text | Contact phone |
| date_of_birth | text | Birth date |
| blood_type | text | Blood group |
| gender | text | Gender |
| emergency_contact_name | text | Emergency contact |
| emergency_contact_relation | text | Relationship |
| emergency_contact_phone | text | Emergency phone |
| allergies | text | Known allergies |
| chronic_conditions | text | Chronic conditions |
| address | text | Address |
| created_at | timestamp | Record creation |
| updated_at | timestamp | Last update |

### service_patients
Patient demographics for admissions.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| first_name | text | First name |
| last_name | text | Last name |
| date_of_birth | text | Birth date |
| gender | text | Gender |
| phone | text | Contact phone |
| email | text | Contact email |
| address | text | Address |
| emergency_contact | text | Emergency contact name |
| emergency_phone | text | Emergency phone |
| insurance_provider | text | Insurance company |
| insurance_number | text | Policy number |
| assigned_nurse_id | varchar | Assigned nurse |
| created_at | timestamp | Record creation |

### admissions
Hospital admission records.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| patient_id | varchar | Reference to patient |
| admission_date | timestamp | Admission timestamp |
| discharge_date | timestamp | Discharge timestamp |
| department | text | Hospital department |
| room_number | text | Assigned room |
| admitting_physician | text | Admitting doctor |
| primary_diagnosis | text | Primary diagnosis |
| status | text | admitted, discharged |
| notes | text | Additional notes |
| created_at | timestamp | Record creation |

### medical_records
Patient medical records.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| patient_id | varchar | Reference to patient |
| record_date | timestamp | Record date |
| record_type | text | Type of record |
| title | text | Record title |
| description | text | Detailed description |
| physician | text | Recording physician |
| file_name | text | Attachment filename |
| file_data | text | Base64 file data |
| file_type | text | MIME type |
| created_at | timestamp | Record creation |

### patient_consents
Patient-specific consent forms.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| patient_id | varchar | Reference to patient |
| consent_type | text | Type of consent |
| title | text | Consent title |
| description | text | Description |
| file_name | text | PDF filename |
| file_data | text | Base64 PDF data |
| file_type | text | MIME type |
| uploaded_by | text | Uploader |
| uploaded_at | timestamp | Upload timestamp |
| status | text | active, expired |

---

## 4. Appointments & Scheduling

### schedules
Doctor schedule patterns.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| doctor_id | varchar | Reference to doctor |
| date | text | Schedule date |
| time_slot | text | Time slot |
| is_booked | boolean | Booking status |

### appointments
Patient appointment bookings.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| appointment_id | text | Human-readable ID |
| patient_id | varchar | Patient reference |
| patient_name | text | Patient name |
| patient_phone | text | Contact phone |
| patient_email | text | Contact email |
| doctor_id | varchar | Doctor reference |
| appointment_date | text | Appointment date |
| time_slot | text | Time slot |
| department | text | Department |
| location | text | Location |
| symptoms | text | Reported symptoms |
| status | text | scheduled, completed, cancelled |
| created_at | timestamp | Booking timestamp |

---

## 5. Inventory Management

### inventory_items
Stock inventory items.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| name | text | Item name |
| category | text | disposables, syringes, gloves, medicines, equipment |
| current_stock | integer | Current quantity |
| low_stock_threshold | integer | Alert threshold |
| unit | text | Unit of measure |
| cost | text | Unit cost |
| supplier | text | Supplier name |
| description | text | Item description |
| created_at | timestamp | Record creation |
| updated_at | timestamp | Last update |

### staff_members
Staff for inventory tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| name | text | Staff name |
| role | text | Staff role |
| email | text | Email |
| phone | text | Phone |
| department | text | Department |
| created_at | timestamp | Record creation |

### inventory_patients
Patients for inventory issue tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| patient_id | text | Patient identifier |
| name | text | Patient name |
| phone | text | Contact phone |
| address | text | Address |
| created_at | timestamp | Record creation |

### inventory_transactions
Stock transactions log.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| type | text | ISSUE, RETURN, DISPOSE |
| item_id | varchar | Reference to item |
| quantity | integer | Transaction quantity |
| staff_id | varchar | Staff member |
| patient_id | varchar | Patient (if applicable) |
| notes | text | Transaction notes |
| remaining_stock | integer | Stock after transaction |
| total_cost | text | Transaction cost |
| created_at | timestamp | Transaction timestamp |

---

## 6. Patient Tracking

### tracking_patients
Admitted patients for tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| name | text | Patient name |
| age | integer | Patient age |
| gender | text | Gender |
| department | text | Department |
| room | text | Room number |
| diagnosis | text | Diagnosis |
| admission_date | timestamp | Admission date |
| discharge_date | timestamp | Discharge date |
| status | text | admitted, discharged |
| doctor | text | Assigned doctor |
| notes | text | Notes |

### medications
Patient medication records.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| patient_id | varchar | Reference to patient |
| name | text | Medication name |
| dosage | text | Dosage |
| route | text | Administration route |
| frequency | text | Frequency |
| administered_at | timestamp | Administration time |
| administered_by | text | Nurse/staff |
| notes | text | Notes |

### meals
Patient meal records.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| patient_id | varchar | Reference to patient |
| meal_type | text | breakfast, lunch, dinner |
| description | text | Meal description |
| calories | integer | Calorie count |
| dietary_restrictions | text | Restrictions |
| consumption_percentage | integer | How much consumed |
| served_at | timestamp | Service time |
| served_by | text | Staff member |
| notes | text | Notes |

### vitals
Patient vital signs (general).

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| patient_id | varchar | Reference to patient |
| temperature | text | Body temperature |
| heart_rate | integer | Heart rate |
| blood_pressure_systolic | integer | Systolic BP |
| blood_pressure_diastolic | integer | Diastolic BP |
| respiratory_rate | integer | Respiratory rate |
| oxygen_saturation | integer | SpO2 |
| recorded_at | timestamp | Recording time |
| recorded_by | text | Staff member |
| notes | text | Notes |

### doctor_visits
Scheduled doctor visits.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| patient_id | varchar | Reference to patient |
| visit_date | text | Visit date |
| visit_time | text | Visit time |
| doctor_name | text | Doctor name |
| notes | text | Visit notes |
| status | text | scheduled, completed |
| created_at | timestamp | Creation time |
| created_by | text | Creator |

---

## 7. Biometric Service

### biometric_templates
Encrypted biometric data storage.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| patient_id | varchar | Reference to patient |
| biometric_type | text | fingerprint, face |
| template_data | text | AES-256 encrypted template |
| encryption_iv | text | Initialization vector |
| quality | integer | Quality score 0-100 |
| is_active | boolean | Active status |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

### biometric_verifications
Verification attempt logs.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| patient_id | varchar | Reference to patient |
| template_id | varchar | Reference to template |
| biometric_type | text | Verification type |
| confidence_score | decimal | Match confidence |
| is_match | boolean | Match result |
| verified_at | timestamp | Verification time |
| ip_address | text | Client IP |
| device_info | text | Device information |

---

## 8. Notifications

### notifications
System-wide notifications.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| title | text | Notification title |
| message | text | Notification content |
| category | text | health_tips, hospital_updates, emergency, etc. |
| priority | text | low, medium, high, critical |
| channels | text[] | push, email, sms, whatsapp |
| scheduled_at | timestamp | Scheduled time |
| media_files | text | JSON of media files |
| attached_link | text | Related link |
| status | text | draft, scheduled, sent, failed |
| created_by | text | Creator |
| created_at | timestamp | Creation time |
| sent_at | timestamp | Sent time |

### user_notifications
User-specific notifications.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| user_id | varchar | Target user |
| user_role | text | User role |
| type | text | appointment, prescription, etc. |
| title | text | Title |
| message | text | Message content |
| related_entity_id | varchar | Related entity |
| related_entity_type | text | Entity type |
| is_read | boolean | Read status |
| metadata | text | JSON metadata |
| created_at | timestamp | Creation time |

### hospital_team_members
Team directory for notifications.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| name | text | Member name |
| title | text | Job title |
| department | text | Department |
| specialization | text | Specialization |
| email | text | Email |
| phone | text | Phone |
| photo_url | text | Photo URL |
| is_on_call | boolean | On-call status |
| status | text | available, busy, offline |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

---

## 9. Equipment Servicing

### equipment
Hospital equipment inventory.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| name | text | Equipment name |
| model | text | Model number |
| serial_number | text | Unique serial |
| last_service_date | text | Last service |
| next_due_date | text | Next service due |
| status | text | up-to-date, due-soon, overdue |
| location | text | Equipment location |
| service_frequency | text | monthly, quarterly, yearly |
| company_name | text | Manufacturer/service company |
| contact_number | text | Contact phone |
| emergency_number | text | Emergency contact |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

### service_history
Equipment service records.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| equipment_id | varchar | Reference to equipment |
| service_date | text | Service date |
| technician | text | Technician name |
| description | text | Service description |
| cost | text | Service cost |
| created_at | timestamp | Creation time |

### emergency_contacts
Hospital emergency contacts.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| name | text | Contact name |
| service_type | text | Service type |
| phone_number | text | Phone number |
| is_primary | boolean | Primary contact |
| is_active | boolean | Active status |
| created_at | timestamp | Creation time |

---

## 10. Hospital Settings

### hospital_settings
Hospital configuration.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| name | text | Hospital name |
| address | text | Full address |
| phone | text | Main phone |
| email | text | Main email |
| website | text | Website URL |
| established_year | text | Year established |
| license_number | text | License number |
| registration_number | text | Registration |
| emergency_hours | text | Emergency timings |
| opd_hours | text | OPD timings |
| visiting_hours | text | Visiting hours |
| max_patients_per_day | text | Daily capacity |
| appointment_slot_duration | text | Slot duration |
| emergency_wait_time | text | Expected wait time |
| total_beds | text | Total beds |
| icu_beds | text | ICU beds |
| emergency_beds | text | Emergency beds |
| operation_theaters | text | Number of OTs |
| departments | text[] | Department list |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

---

## 11. Prescriptions

### prescriptions
Doctor prescriptions.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| prescription_number | text | PR-YYYY-NNNN format |
| patient_id | varchar | Patient reference |
| patient_name | text | Patient name |
| patient_age | text | Patient age |
| patient_gender | text | Gender |
| visit_id | varchar | OPD visit reference |
| doctor_id | varchar | Doctor reference |
| doctor_name | text | Doctor name |
| doctor_registration_no | text | Registration number |
| chief_complaints | text | Chief complaints |
| diagnosis | text | Diagnosis |
| provisional_diagnosis | text | Provisional diagnosis |
| vitals | text | JSON: BP, sugar, pulse, weight, temp |
| known_allergies | text | Known allergies |
| past_medical_history | text | Medical history |
| medicines | text[] | Medicine array |
| medicine_details | text | JSON medicine details |
| instructions | text | Instructions |
| diet_advice | text | Diet recommendations |
| activity_advice | text | Activity recommendations |
| investigations | text | Tests ordered |
| patient_record_id | varchar | Medical record reference |
| prescription_date | text | Prescription date |
| follow_up_date | text | Follow-up date |
| prescription_status | text | draft, awaiting_signature, finalized, void |
| status | text | active, completed, cancelled |
| created_by_role | text | Creator role |
| created_by_name | text | Creator name |
| signed_by | varchar | Signing doctor |
| signed_by_name | text | Signer name |
| signed_at | timestamp | Signature time |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

### prescription_items
Individual medicine entries.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| prescription_id | varchar | Reference to prescription |
| medicine_name | text | Medicine name |
| dosage_form | text | Tab, Syrup, Inj, Cap, etc. |
| strength | text | Strength (e.g., 5mg) |
| frequency | text | 1, 2, 3, 4 times per day |
| meal_timing | text | before_food, after_food, with_food |
| duration | integer | Number of days |
| duration_unit | text | days, weeks, months |
| schedule | text | JSON array of timings |
| special_instructions | text | Special instructions |
| quantity | integer | Total quantity |
| sort_order | integer | Display order |
| created_at | timestamp | Creation time |

---

## 12. Consent Forms

### consent_forms
Uploaded consent form PDFs.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| name | text | Form name |
| description | text | Description |
| category | text | general, surgery, treatment, etc. |
| file_name | text | Original filename |
| file_data | text | Base64 PDF data |
| file_size | integer | File size in bytes |
| mime_type | text | MIME type |
| uploaded_by | varchar | Uploader ID |
| is_active | boolean | Active status |
| created_at | timestamp | Upload time |
| updated_at | timestamp | Last update |

### consent_templates
Pre-defined consent form templates.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| title | text | Template title |
| consent_type | text | MEDICO_LEGAL, SURGERY, etc. |
| description | text | Template description |
| category | text | Legal & Administrative, Surgical, etc. |
| pdf_path | text | Path to PDF file |
| version | text | Template version |
| is_active | boolean | Active status |
| is_bilingual | boolean | Multilingual flag |
| languages | text | Supported languages |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

---

## 13. Medicines Database

### medicines
Indian medicine database.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| brand_name | text | Brand name |
| generic_name | text | Generic name |
| strength | text | Strength |
| dosage_form | text | Dosage form |
| company_name | text | Manufacturer |
| mrp | decimal | Maximum retail price |
| pack_size | text | Pack size |
| uses | text | Indications |
| category | text | Medicine category |
| created_at | timestamp | Creation time |

---

## 14. Oxygen Tracking

### oxygen_cylinders
Cylinder inventory.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| cylinder_code | text | QR/Barcode (unique) |
| cylinder_type | text | B-type, D-type, Jumbo |
| capacity | decimal | Capacity in liters |
| filled_pressure | decimal | Filled pressure (psi) |
| current_pressure | decimal | Current pressure (psi) |
| status | text | full, in_use, empty, for_refilling, for_testing |
| vendor | text | Vendor name |
| purity_certificate_date | text | Purity cert date |
| hydrostatic_test_date | text | Last hydro test |
| next_test_due_date | text | Next test due |
| location | text | Current location |
| last_updated | timestamp | Last update |
| created_at | timestamp | Creation time |

### cylinder_movements
Cylinder issue/return log.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| cylinder_id | varchar | Reference to cylinder |
| cylinder_code | text | Cylinder code |
| movement_type | text | ISSUE, RETURN |
| department | text | Department |
| start_pressure | decimal | Starting pressure |
| end_pressure | decimal | Ending pressure |
| issued_by | text | Issuer |
| received_by | text | Receiver |
| acknowledged_by | text | Acknowledger |
| notes | text | Notes |
| movement_date | timestamp | Movement time |

### oxygen_consumption
Patient oxygen usage.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| patient_id | varchar | Patient reference |
| patient_name | text | Patient name |
| department | text | Department |
| cylinder_id | varchar | Cylinder reference |
| cylinder_code | text | Cylinder code |
| flow_rate | decimal | LPM (liters per minute) |
| start_time | timestamp | Start time |
| end_time | timestamp | End time |
| total_hours | decimal | Total duration |
| total_consumption | decimal | Total consumed |
| recorded_by | text | Recorder |
| notes | text | Notes |
| created_at | timestamp | Creation time |

### lmo_readings
LMO tank daily readings.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| tank_id | text | Tank identifier |
| reading_date | text | Reading date |
| reading_time | text | Reading time |
| level_percentage | decimal | Tank level % |
| volume_liters | decimal | Volume in liters |
| pressure | decimal | Tank pressure |
| temperature | decimal | Tank temperature |
| recorded_by | text | Recorder |
| notes | text | Notes |
| created_at | timestamp | Creation time |

### oxygen_alerts
Oxygen system alerts.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| alert_type | text | LOW_STOCK, OVERCONSUMPTION, etc. |
| severity | text | info, warning, critical |
| title | text | Alert title |
| message | text | Alert message |
| related_cylinder_id | varchar | Related cylinder |
| is_resolved | boolean | Resolution status |
| resolved_by | text | Resolver |
| resolved_at | timestamp | Resolution time |
| created_at | timestamp | Creation time |

---

## 15. Biomedical Waste Management

### bmw_bags
Waste bag tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| barcode | text | Unique barcode |
| category | text | YELLOW, RED, WHITE, BLUE |
| department | text | Generating department |
| weight_kg | decimal | Bag weight |
| volume_liters | decimal | Bag volume |
| waste_items | text | Waste items list |
| generated_by | text | Generator |
| generated_at | timestamp | Generation time |
| status | text | GENERATED, COLLECTED, STORED, PICKED_UP, DISPOSED |
| storage_room_id | varchar | Storage room |
| pickup_id | varchar | Pickup reference |
| disposal_id | varchar | Disposal reference |
| notes | text | Notes |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

### bmw_movements
Waste movement log.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| bag_id | varchar | Bag reference |
| action | text | CREATED, COLLECTED, MOVED_TO_STORAGE, etc. |
| from_location | text | From location |
| to_location | text | To location |
| performed_by | text | Staff member |
| performed_at | timestamp | Action time |
| notes | text | Notes |

### bmw_pickups
Vendor pickup records.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| pickup_id | text | Pickup identifier |
| vendor_id | varchar | Vendor reference |
| vendor_name | text | Vendor name |
| scheduled_date | text | Scheduled date |
| scheduled_time | text | Scheduled time |
| actual_pickup_time | timestamp | Actual pickup |
| total_bags | integer | Number of bags |
| total_weight_kg | decimal | Total weight |
| category_breakdown | text | JSON breakdown by category |
| driver_name | text | Driver name |
| vehicle_number | text | Vehicle number |
| handover_signature | text | Signature data |
| received_by | text | Receiver |
| status | text | SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED |
| notes | text | Notes |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

### bmw_disposals
Waste disposal verification.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| pickup_id | varchar | Pickup reference |
| bag_id | varchar | Bag reference |
| method | text | AUTOCLAVE, INCINERATION, etc. |
| disposal_date | text | Disposal date |
| disposal_time | text | Disposal time |
| treatment_facility | text | CBWTF facility |
| certificate_url | text | Certificate upload |
| verified_by | text | Verifier |
| status | text | PENDING, TREATED, VERIFIED |
| notes | text | Notes |
| created_at | timestamp | Creation time |

### bmw_vendors
CBWTF vendor registry.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| vendor_id | text | Vendor identifier |
| name | text | Vendor name |
| company_name | text | Company name |
| contact_person | text | Contact person |
| phone | text | Phone |
| email | text | Email |
| address | text | Address |
| license_number | text | CPCB/SPCB license |
| license_expiry | text | License expiry |
| vehicle_numbers | text | Vehicle list |
| is_active | boolean | Active status |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

### bmw_storage_rooms
Temporary storage locations.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| name | text | Room name |
| location | text | Location |
| capacity | integer | Max bags |
| current_occupancy | integer | Current bags |
| is_active | boolean | Active status |
| last_cleaned_at | timestamp | Last cleaning |
| cleaned_by | text | Cleaner |
| temperature | decimal | Room temperature |
| notes | text | Notes |
| created_at | timestamp | Creation time |

### bmw_incidents
Incident reporting.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| incident_type | text | NEEDLE_STICK, SPILL, EXPOSURE, OTHER |
| severity | text | MINOR, MODERATE, MAJOR |
| department | text | Department |
| location | text | Location |
| description | text | Description |
| involved_personnel | text | Personnel involved |
| waste_category | text | Related category |
| bag_id | varchar | Related bag |
| action_taken | text | Action taken |
| reported_by | text | Reporter |
| reported_at | timestamp | Report time |
| resolved_at | timestamp | Resolution time |
| resolved_by | text | Resolver |
| status | text | REPORTED, INVESTIGATING, RESOLVED |
| notes | text | Notes |

### bmw_reports
Compliance reports.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| report_type | text | DAILY, WEEKLY, MONTHLY, ANNUAL, MPCB |
| report_period | text | Period identifier |
| start_date | text | Period start |
| end_date | text | Period end |
| total_bags_generated | integer | Total bags |
| total_weight_kg | decimal | Total weight |
| yellow_bags | integer | Yellow count |
| red_bags | integer | Red count |
| white_bags | integer | White count |
| blue_bags | integer | Blue count |
| disposed_bags | integer | Disposed count |
| pending_bags | integer | Pending count |
| incidents_count | integer | Incident count |
| generated_by | text | Generator |
| report_data | text | JSON detailed data |
| file_url | text | Report file URL |
| status | text | GENERATED, SUBMITTED, APPROVED |
| created_at | timestamp | Creation time |

---

## 16. AI Intelligence Layer

### ai_analytics_snapshots
Time-series metrics storage.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| engine_type | text | DOCTOR_EFFICIENCY, NURSE_EFFICIENCY, etc. |
| entity_id | varchar | Entity reference |
| entity_type | text | doctor, nurse, department, hospital |
| metric_name | text | Metric name |
| metric_value | decimal | Metric value |
| metric_unit | text | percentage, count, minutes, score |
| period_start | timestamp | Period start |
| period_end | timestamp | Period end |
| calculated_at | timestamp | Calculation time |

### ai_metric_catalog
Metric definitions.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| engine_type | text | Engine type |
| metric_name | text | Metric name |
| display_name | text | Display name |
| description | text | Description |
| metric_unit | text | Unit |
| target_value | decimal | Target value |
| warning_threshold | decimal | Warning threshold |
| critical_threshold | decimal | Critical threshold |
| is_higher_better | boolean | Direction |
| weight | decimal | Weight for composites |
| is_active | boolean | Active status |
| created_at | timestamp | Creation time |

### ai_anomaly_events
Detected anomalies.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| engine_type | text | Engine type |
| entity_id | varchar | Entity reference |
| entity_type | text | Entity type |
| anomaly_type | text | SPIKE, DROP, THRESHOLD_BREACH, PATTERN_BREAK |
| severity | text | LOW, MEDIUM, HIGH, CRITICAL |
| metric_name | text | Metric name |
| expected_value | decimal | Expected value |
| actual_value | decimal | Actual value |
| deviation | decimal | Deviation amount |
| description | text | Description |
| suggested_action | text | Suggested action |
| is_acknowledged | boolean | Acknowledgment status |
| acknowledged_by | text | Acknowledger |
| acknowledged_at | timestamp | Acknowledgment time |
| detected_at | timestamp | Detection time |

### ai_prediction_results
Forecasts and predictions.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| engine_type | text | Engine type |
| prediction_type | text | ICU_LOAD, OXYGEN_DEMAND, etc. |
| entity_id | varchar | Entity reference |
| entity_type | text | Entity type |
| prediction_date | timestamp | Predicted date |
| predicted_value | decimal | Predicted value |
| confidence_level | decimal | Confidence 0-100% |
| lower_bound | decimal | Lower bound |
| upper_bound | decimal | Upper bound |
| actual_value | decimal | Actual (filled later) |
| model_version | text | Model version |
| created_at | timestamp | Creation time |

### ai_recommendations
AI-generated suggestions.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| engine_type | text | Engine type |
| category | text | EFFICIENCY, COMPLIANCE, RESOURCE, COST, SAFETY |
| priority | text | LOW, MEDIUM, HIGH, CRITICAL |
| entity_id | varchar | Entity reference |
| entity_type | text | Entity type |
| title | text | Recommendation title |
| description | text | Description |
| expected_impact | text | Expected impact |
| estimated_savings | decimal | Estimated savings |
| implementation_difficulty | text | LOW, MEDIUM, HIGH |
| status | text | PENDING, IN_PROGRESS, IMPLEMENTED, DISMISSED |
| implemented_by | text | Implementer |
| implemented_at | timestamp | Implementation time |
| created_at | timestamp | Creation time |
| expires_at | timestamp | Expiration time |

### hospital_health_index
Daily health scores.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| date | text | YYYY-MM-DD (unique) |
| overall_score | decimal | Overall score 0-100 |
| doctor_efficiency_score | decimal | Doctor score |
| nurse_efficiency_score | decimal | Nurse score |
| opd_score | decimal | OPD score |
| compliance_score | decimal | Compliance score |
| resource_utilization | decimal | Resource score |
| patient_satisfaction | decimal | Satisfaction score |
| cost_efficiency | decimal | Cost score |
| workflow_delay_index | decimal | Delay index |
| trend | text | IMPROVING, STABLE, DECLINING |
| insights | text | JSON insights |
| calculated_at | timestamp | Calculation time |

### resolved_alerts
Resolved critical alerts.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| alert_type | text | Alert type |
| alert_severity | text | Severity |
| alert_message | text | Message |
| patient_id | varchar | Patient reference |
| resolved_by | varchar | Resolver |
| resolved_at | timestamp | Resolution time |

---

## 17. Patient Billing

### patient_bills
Patient billing records.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| patient_id | varchar | Patient reference |
| patient_name | text | Patient name |
| admission_id | varchar | Admission reference |
| room_charges | decimal | Room charges |
| room_days | integer | Number of days |
| doctor_consultation | decimal | Consultation fees |
| lab_tests | decimal | Lab test charges |
| medicines | decimal | Medicine charges |
| inventory_charges | decimal | Inventory charges |
| other_fees | decimal | Other fees |
| other_fees_description | text | Description |
| total_amount | decimal | Total bill |
| paid_amount | decimal | Amount paid |
| balance_due | decimal | Balance remaining |
| status | text | pending, partial, paid, cancelled |
| bill_requested_at | timestamp | Request time |
| last_updated_at | timestamp | Last update |
| created_at | timestamp | Creation time |
| created_by | varchar | Creator |
| updated_by | varchar | Updater |

### bill_payments
Individual payment records.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| bill_id | varchar | Bill reference |
| amount | decimal | Payment amount |
| payment_method | text | cash, card, upi, insurance |
| transaction_id | text | Transaction ID |
| notes | text | Notes |
| paid_at | timestamp | Payment time |
| received_by | varchar | Receiver |

---

## 18. Health Tips

### health_tips
AI-generated health tips.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| title | text | Tip title |
| content | text | Tip content |
| category | text | weather, climate, diet, trending, seasonal |
| weather_context | text | Weather conditions |
| season | text | summer, monsoon, winter, spring |
| priority | text | low, medium, high |
| target_audience | text | all, patients, elderly, children |
| generated_at | timestamp | Generation time |
| scheduled_for | text | 9AM or 9PM |
| is_active | boolean | Active status |

---

## 19. Swab Contamination Monitoring

### swab_area_master
Hospital area definitions.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| block | text | Block identifier |
| floor | text | Floor |
| area_type | text | OT, ICU |
| area_name | text | Area name |
| equipment | text | Equipment/Bed |
| is_active | boolean | Active status |
| created_at | timestamp | Creation time |

### swab_sampling_site_master
Sampling site definitions.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| site_name | text | Site name |
| description | text | Description |
| is_active | boolean | Active status |
| created_at | timestamp | Creation time |

### swab_organism_master
Organism definitions.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| organism_name | text | Organism name |
| category | text | pathogen, flora, none |
| risk_level | text | low, medium, high, critical |
| description | text | Description |
| is_active | boolean | Active status |
| created_at | timestamp | Creation time |

### swab_collection
Swab collection records.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| swab_id | text | Unique swab ID |
| collection_date | timestamp | Collection time |
| area_type | text | OT, ICU |
| area_id | varchar | Area reference |
| sampling_site_id | varchar | Site reference |
| reason | text | Routine, Post-fumigation, Outbreak |
| collected_by | varchar | Collector ID |
| collected_by_name | text | Collector name |
| remarks | text | Remarks |
| status | text | COLLECTED, SENT_TO_LAB, RESULT_RECEIVED |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

### swab_lab_results
Lab result records.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| swab_id | varchar | Swab reference |
| organism_id | varchar | Organism reference |
| organism_name | text | Organism name |
| growth_level | text | None, Low, Moderate, Heavy |
| interpretation | text | PASS, ACCEPTABLE, FAIL |
| result_date | timestamp | Result date |
| tested_by | text | Tester |
| verified_by | text | Verifier |
| remarks | text | Remarks |
| created_at | timestamp | Creation time |

### swab_capa_actions
Corrective actions.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| lab_result_id | varchar | Result reference |
| swab_id | varchar | Swab reference |
| capa_type | text | CORRECTIVE, PREVENTIVE |
| action_description | text | Action description |
| assigned_to | text | Assignee |
| target_date | timestamp | Target date |
| actual_date | timestamp | Actual completion |
| status | text | OPEN, IN_PROGRESS, CLOSED |
| effectiveness_check | text | Effectiveness check |
| verified_by | text | Verifier |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

### swab_audit_logs
Audit trail.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| entity_type | text | Entity type |
| entity_id | varchar | Entity reference |
| action | text | CREATE, UPDATE, DELETE |
| old_value | text | JSON old state |
| new_value | text | JSON new state |
| performed_by | varchar | Performer ID |
| performed_by_name | text | Performer name |
| performed_by_role | text | Performer role |
| ip_address | text | Client IP |
| created_at | timestamp | Action time |

---

## 20. Disease Knowledge Module

### disease_catalog
Disease master list.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| disease_name | text | Disease name (unique) |
| alternate_names | text | Alternate names |
| category | text | metabolic, cardiovascular, respiratory, etc. |
| affected_system | text | Body system affected |
| short_description | text | Layman description |
| causes | text | JSON causes |
| risk_factors | text | JSON risk factors |
| symptoms | text | JSON symptoms |
| emergency_signs | text | JSON emergency signs |
| clinical_parameters | text | JSON target values |
| dos_list | text | JSON do's |
| donts_list | text | JSON don'ts |
| activity_recommendations | text | JSON activities |
| monitoring_guidelines | text | JSON monitoring |
| follow_up_schedule | text | JSON follow-up |
| is_active | boolean | Active status |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

### diet_templates
Disease-specific diet plans.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| disease_id | varchar | Disease reference |
| template_name | text | Template name |
| diet_type | text | veg, non-veg, both |
| meal_plan | text | JSON meal plan |
| foods_to_avoid | text | JSON avoid list |
| foods_to_limit | text | JSON limit list |
| safe_in_moderation | text | JSON moderation list |
| portion_guidance | text | Portion guidance |
| hydration_guidance | text | Hydration guidance |
| special_notes | text | Special notes |
| is_active | boolean | Active status |
| created_at | timestamp | Creation time |

### medication_schedule_templates
Medication timing guidance.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| disease_id | varchar | Disease reference |
| medicine_category | text | Medicine category |
| typical_timing | text | Morning, Afternoon, etc. |
| before_after_food | text | before, after, with, empty_stomach |
| missed_dose_instructions | text | Missed dose guidance |
| storage_guidelines | text | Storage guidance |
| interaction_warnings | text | JSON interactions |
| general_notes | text | General notes |
| is_active | boolean | Active status |
| created_at | timestamp | Creation time |

### patient_disease_assignments
Patient-disease links.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| patient_id | varchar | Patient reference |
| disease_id | varchar | Disease reference |
| severity | text | mild, moderate, severe |
| diagnosed_date | timestamp | Diagnosis date |
| assigned_by | varchar | Doctor ID |
| assigned_by_name | text | Doctor name |
| comorbidities | text | JSON other diseases |
| opd_ipd_status | text | OPD, IPD |
| is_active | boolean | Active status |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

### personalized_care_plans
AI-generated care plans.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| patient_id | varchar | Patient reference |
| assignment_id | varchar | Assignment reference |
| personalized_diet | text | JSON diet plan |
| personalized_schedule | text | JSON medication timing |
| personalized_lifestyle | text | JSON activities |
| personalized_monitoring | text | JSON monitoring |
| ai_input_parameters | text | JSON AI inputs |
| ai_generated_at | timestamp | Generation time |
| generated_by | varchar | Doctor ID |
| generated_by_name | text | Doctor name |
| is_active | boolean | Active status |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

---

## 21. Patient Monitoring Module

### patient_monitoring_sessions
24-hour monitoring sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| patient_id | varchar | Patient reference |
| patient_name | text | Patient name |
| uhid | text | Hospital ID |
| age | integer | Age |
| sex | text | Gender |
| admission_datetime | timestamp | Admission time |
| ward | text | Ward |
| bed_number | text | Bed number |
| blood_group | text | Blood group |
| weight_kg | decimal | Weight |
| primary_diagnosis | text | Primary diagnosis |
| secondary_diagnosis | text | JSON secondary diagnoses |
| admitting_consultant | text | Admitting doctor |
| icu_consultant | text | ICU consultant |
| is_ventilated | boolean | Ventilator status |
| is_locked | boolean | Session locked |
| session_date | text | YYYY-MM-DD |
| session_start_time | timestamp | Session start |
| session_end_time | timestamp | Session end |
| created_by | varchar | Creator ID |
| created_by_name | text | Creator name |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

### vitals_hourly
Hourly vital signs (24 slots).

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| session_id | varchar | Session reference |
| hour_slot | text | Hour slot (08:00, 09:00, etc.) |
| heart_rate | integer | Heart rate |
| systolic_bp | integer | Systolic BP |
| diastolic_bp | integer | Diastolic BP |
| mean_arterial_pressure | integer | MAP |
| respiratory_rate | integer | Respiratory rate |
| spo2 | integer | SpO2 |
| temperature | decimal | Temperature |
| temperature_unit | text | C or F |
| cvp | decimal | CVP |
| icp | decimal | ICP |
| cpp | decimal | CPP |
| entry_method | text | MANUAL, DEVICE, AUTO |
| missed_reason | text | Reason if missed |
| nurse_id | varchar | Nurse ID |
| nurse_name | text | Nurse name |
| recorded_at | timestamp | Recording time |
| version | integer | Version for audit |

### inotropes_sedation
Inotrope and sedation tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| session_id | varchar | Session reference |
| drug_name | text | Drug name |
| concentration | text | Concentration |
| dose | text | Dose |
| rate | text | Rate (ml/hr or mcg/kg/min) |
| start_time | timestamp | Start time |
| end_time | timestamp | End time |
| route | text | Route |
| sedation_scale | text | RASS/GCS value |
| scale_type | text | RASS or GCS |
| nurse_remarks | text | Remarks |
| nurse_id | varchar | Nurse ID |
| nurse_name | text | Nurse name |
| created_at | timestamp | Creation time |
| version | integer | Version |

### ventilator_settings
Ventilator management.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| session_id | varchar | Session reference |
| ventilation_mode | text | Ventilation mode |
| fio2 | integer | FiO2 percentage |
| set_tidal_volume | integer | Set tidal volume |
| expired_tidal_volume | integer | Expired tidal volume |
| set_minute_volume | decimal | Set minute volume |
| expired_minute_volume | decimal | Expired minute volume |
| respiratory_rate_set | integer | Set respiratory rate |
| respiratory_rate_spontaneous | integer | Spontaneous rate |
| simv_rate | integer | SIMV rate |
| peep_cpap | decimal | PEEP/CPAP |
| auto_peep | decimal | Auto PEEP |
| peak_airway_pressure | decimal | Peak pressure |
| pressure_support | decimal | Pressure support |
| ie_ratio | text | I:E ratio |
| recorded_at | timestamp | Recording time |
| nurse_id | varchar | Nurse ID |
| nurse_name | text | Nurse name |
| shift | text | Shift |
| version | integer | Version |

### abg_lab_results
ABG and lab values.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| session_id | varchar | Session reference |
| ph | decimal | pH |
| pco2 | decimal | pCO2 |
| po2 | decimal | pO2 |
| hco3 | decimal | HCO3 |
| base_excess | decimal | Base excess |
| o2_saturation | decimal | O2 saturation |
| svo2 | decimal | SvO2 |
| lactate | decimal | Lactate |
| hb | decimal | Hemoglobin |
| wbc | decimal | WBC |
| urea | decimal | Urea |
| creatinine | decimal | Creatinine |
| sodium | decimal | Sodium |
| potassium | decimal | Potassium |
| chloride | decimal | Chloride |
| pt | decimal | PT |
| aptt | decimal | aPTT |
| lft | text | JSON LFT values |
| bsl | decimal | Blood sugar |
| blood_culture | text | Blood culture result |
| urine_culture | text | Urine culture |
| sputum_culture | text | Sputum culture |
| xray_chest | text | Chest X-ray |
| other_investigations | text | Other investigations |
| attachment_url | text | Attachment URL |
| attachment_type | text | Attachment type |
| recorded_at | timestamp | Recording time |
| nurse_id | varchar | Nurse ID |
| nurse_name | text | Nurse name |
| version | integer | Version |

### intake_hourly
Hourly intake chart.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| session_id | varchar | Session reference |
| hour_slot | text | Hour slot |
| iv_line_1 | integer | IV line 1 (ml) |
| iv_line_2 | integer | IV line 2 (ml) |
| iv_line_3 | integer | IV line 3 (ml) |
| iv_line_4 | integer | IV line 4 (ml) |
| iv_line_5 | integer | IV line 5 (ml) |
| iv_line_6 | integer | IV line 6 (ml) |
| oral | integer | Oral intake (ml) |
| ng_tube | integer | NG tube (ml) |
| blood_products | integer | Blood products (ml) |
| medications | integer | Medications (ml) |
| hourly_total | integer | Hourly total (ml) |
| nurse_id | varchar | Nurse ID |
| nurse_name | text | Nurse name |
| recorded_at | timestamp | Recording time |
| version | integer | Version |

### output_hourly
Hourly output chart.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| session_id | varchar | Session reference |
| hour_slot | text | Hour slot |
| urine_output | integer | Urine (ml) |
| drain_output | integer | Drain (ml) |
| drain_type | text | Drain type |
| vomitus | integer | Vomitus (ml) |
| stool | integer | Stool (ml) |
| other_losses | integer | Other losses (ml) |
| other_losses_description | text | Description |
| hourly_total | integer | Hourly total (ml) |
| nurse_id | varchar | Nurse ID |
| nurse_name | text | Nurse name |
| recorded_at | timestamp | Recording time |
| version | integer | Version |

### diabetic_flow
Diabetic flow chart.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| session_id | varchar | Session reference |
| recorded_time | timestamp | Recording time |
| blood_sugar_level | integer | BSL |
| insulin_type | text | Insulin type |
| insulin_dose | decimal | Insulin dose |
| route | text | Route |
| sodium | decimal | Sodium |
| potassium | decimal | Potassium |
| chloride | decimal | Chloride |
| alert_type | text | Alert type |
| alert_message | text | Alert message |
| nurse_id | varchar | Nurse ID |
| nurse_name | text | Nurse name |
| nurse_signature | text | Signature |
| created_at | timestamp | Creation time |
| version | integer | Version |

### medication_admin_records
Medication administration record (MAR).

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| session_id | varchar | Session reference |
| drug_name | text | Drug name |
| route | text | Route |
| dose | text | Dose |
| frequency | text | 1x, 2x, 3x, 4x |
| meal_timing | text | pre_meal, post_meal |
| scheduled_time | timestamp | Scheduled time |
| actual_given_time | timestamp | Actual time |
| status | text | GIVEN, HELD, MISSED |
| reason_not_given | text | Reason if not given |
| ordered_by | varchar | Doctor ID |
| ordered_by_name | text | Doctor name |
| nurse_id | varchar | Nurse ID |
| nurse_name | text | Nurse name |
| created_at | timestamp | Creation time |
| version | integer | Version |

### once_only_drugs
Once-only/PRN drugs.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| session_id | varchar | Session reference |
| drug_name | text | Drug name |
| dose | text | Dose |
| route | text | Route |
| time_ordered | timestamp | Order time |
| time_given | timestamp | Given time |
| doctor_id | varchar | Doctor ID |
| doctor_name | text | Doctor name |
| doctor_signature | text | Doctor signature |
| nurse_id | varchar | Nurse ID |
| nurse_name | text | Nurse name |
| nurse_signature | text | Nurse signature |
| created_at | timestamp | Creation time |
| version | integer | Version |

### nursing_shift_notes
Nursing remarks and shift diary.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| session_id | varchar | Session reference |
| note_time | timestamp | Note time |
| event_type | text | ROUTINE, EMERGENCY, CRITICAL |
| observation | text | Observation |
| action_taken | text | Action taken |
| doctor_informed | boolean | Doctor informed |
| doctor_name | text | Doctor name |
| shift | text | MORNING, EVENING, NIGHT |
| nurse_id | varchar | Nurse ID |
| nurse_name | text | Nurse name |
| nurse_initial | text | Nurse initials |
| created_at | timestamp | Creation time |
| version | integer | Version |

### airway_lines_tubes
Airway, lines, and tubes tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| session_id | varchar | Session reference |
| device_type | text | Device type |
| device_name | text | Device name |
| size | text | Size |
| site | text | Insertion site |
| inserted_by | text | Inserted by |
| insertion_date | timestamp | Insertion date |
| due_for_change | timestamp | Change due date |
| status | text | IN_SITU, REMOVED |
| removed_at | timestamp | Removal time |
| removed_by | text | Removed by |
| nurse_id | varchar | Nurse ID |
| nurse_name | text | Nurse name |
| created_at | timestamp | Creation time |
| version | integer | Version |

### skin_pressure_care
Skin and pressure care.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| session_id | varchar | Session reference |
| assessment_time | timestamp | Assessment time |
| braden_score | integer | Braden score |
| wound_location | text | Wound location |
| wound_stage | text | Wound stage |
| wound_size | text | Wound size |
| wound_description | text | Description |
| dressing_type | text | Dressing type |
| dressing_changed | boolean | Dressing changed |
| position_changed | boolean | Position changed |
| pressure_relief | text | Relief measures |
| nurse_id | varchar | Nurse ID |
| nurse_name | text | Nurse name |
| created_at | timestamp | Creation time |
| version | integer | Version |

### fall_risk_assessment
Fall risk assessment.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| session_id | varchar | Session reference |
| assessment_time | timestamp | Assessment time |
| morse_score | integer | Morse Fall Scale score |
| history_of_falls | boolean | Fall history |
| secondary_diagnosis | boolean | Secondary diagnosis |
| ambulatory_aid | text | Ambulatory aid |
| iv_therapy | boolean | IV therapy |
| gait | text | Gait assessment |
| mental_status | text | Mental status |
| risk_level | text | LOW, MEDIUM, HIGH |
| interventions | text | JSON interventions |
| nurse_id | varchar | Nurse ID |
| nurse_name | text | Nurse name |
| created_at | timestamp | Creation time |
| version | integer | Version |

---

## Activity & Audit Logging

### activity_logs
System activity logs.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| action | text | Action performed |
| entity_type | text | Entity type |
| entity_id | text | Entity ID |
| performed_by | text | Performer |
| performed_by_role | text | Role |
| details | text | Details |
| activity_type | text | info, success, urgent, warning |
| created_at | timestamp | Action time |

### conversation_logs
Chatbot conversation logs.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (PK) | UUID |
| user_id | text | User ID |
| query | text | User query |
| response | text | Bot response |
| category | text | Query category |
| timestamp | timestamp | Conversation time |

---

## Enums Reference

### User Roles
- ADMIN
- DOCTOR
- NURSE
- OPD_MANAGER
- PATIENT

### Inventory Categories
- disposables
- syringes
- gloves
- medicines
- equipment

### Transaction Types
- ISSUE
- RETURN
- DISPOSE

### BMW Categories
- YELLOW (Anatomical/Pathological)
- RED (Contaminated)
- WHITE (Sharps)
- BLUE (Glassware/Metal)

### BMW Status
- GENERATED
- COLLECTED
- STORED
- PICKED_UP
- DISPOSED

### Cylinder Status
- full
- in_use
- empty
- for_refilling
- for_testing

### Prescription Status
- draft
- awaiting_signature
- finalized
- void

### Bill Status
- pending
- partial
- paid
- cancelled

### Monitoring Shifts
- MORNING
- EVENING
- NIGHT

### MAR Status
- GIVEN
- HELD
- MISSED

---

*Documentation generated for HMS Core v2.0 - December 2024*
