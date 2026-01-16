# Gravity AI Manager - Complete User Modules Documentation

## Table of Contents
1. [Overview](#overview)
2. [User Role Hierarchy](#user-role-hierarchy)
3. [Super Admin Modules](#1-super-admin-modules)
4. [Admin Modules](#2-admin-modules)
5. [Doctor Modules](#3-doctor-modules)
6. [Nurse Modules](#4-nurse-modules)
7. [OPD Manager Modules](#5-opd-manager-modules)
8. [Patient Modules](#6-patient-modules)
9. [Pathology Lab Modules](#7-pathology-lab-modules)
10. [Medical Store Modules](#8-medical-store-modules)
11. [Technician Modules](#9-technician-modules)
12. [Permission Matrix Summary](#permission-matrix-summary)

---

## Overview

Gravity AI Manager is a comprehensive Hospital Management System designed for Gravity Hospital. The system implements strict **Role-Based Access Control (RBAC)** ensuring each user type only sees and accesses relevant modules and data. This document provides a detailed breakdown of all modules available to each user role.

**Total Modules**: 24 Core Modules  
**Total Departments**: 24  
**Total Hospital Services**: 4,830+  
**Total Pathology Tests**: 1,148  

---

## User Role Hierarchy

```
                    SUPER_ADMIN (Highest Authority)
                           |
                         ADMIN
                           |
        +------------------+------------------+
        |                  |                  |
     DOCTOR             NURSE           OPD_MANAGER
        |                  |                  |
        +------------------+------------------+
                           |
        +------------------+------------------+------------------+
        |                  |                  |                  |
     PATIENT        PATHOLOGY_LAB      MEDICAL_STORE        TECHNICIAN
```

---

# 1. SUPER ADMIN Modules

**Role Description**: Enterprise-level control center with the highest privilege layer. Super Admin has complete access to all system functions including critical administrative operations that even Admin cannot perform.

**Portal**: Super Admin Portal (Dedicated Interface)

## 1.1 Dashboard
| Feature | Description |
|---------|-------------|
| System Metrics | Real-time overview of hospital operations, user counts, and system health |
| Active Users | Count of currently active users by role |
| Database Statistics | Record counts across all major tables |
| System Alerts | Critical notifications requiring Super Admin attention |

## 1.2 User Roles & Permissions
| Feature | Description |
|---------|-------------|
| Complete User CRUD | Create, Read, Update, Delete all user accounts |
| Auto-Generated Credentials | Secure username and password generation with bcrypt hashing |
| Role Assignment | Assign any of the 9 roles to users |
| Status Toggle | Activate/Deactivate user accounts |
| User Deletion | Permanently remove users with confirmation dialog |
| Permission Matrix | Fine-grained CRUD controls per module per role |
| Credential Display Modal | One-time display of generated credentials |

## 1.3 Billing Finalization
| Feature | Description |
|---------|-------------|
| Financial Locking Workflows | Lock billing records to prevent modifications |
| Invoice Finalization | Mark invoices as final and non-editable |
| Period Closing | Close financial periods for audit compliance |
| Override Controls | Override locked records with proper authorization |

## 1.4 Stock & Pharmacy Control
| Feature | Description |
|---------|-------------|
| Batch Management | Track medicine batches with manufacturing and expiry dates |
| Expiry Tracking | Alerts for medicines approaching expiration |
| Stock Adjustments | Manual adjustments with audit trail |
| Vendor Management | Manage pharmacy vendors and suppliers |
| Reorder Controls | Set reorder levels and automatic alerts |

## 1.5 Surgery Packages
| Feature | Description |
|---------|-------------|
| Package Creation | Create comprehensive surgery packages |
| OT Fee Management | Operating Theater charges configuration |
| Surgeon Fee Structure | Consultant and assisting surgeon fees |
| Anesthesia Fee Configuration | Anesthesiologist charges by type |
| Package Pricing | All-inclusive package price calculation |
| Component Breakdown | Detailed cost breakdown per component |

## 1.6 Medicine Database
| Feature | Description |
|---------|-------------|
| Salt Composition | Active ingredients and their proportions |
| Dosage Forms | Tablet, capsule, syrup, injection, etc. |
| MRP Management | Maximum Retail Price tracking |
| Brand Management | Multiple brands for same salt composition |
| Drug Interactions | Known drug interaction warnings |
| Manufacturer Info | Manufacturing company details |

## 1.7 Insurance Providers
| Feature | Description |
|---------|-------------|
| TPA Integration | Third Party Administrator configurations |
| Coverage Limits | Maximum coverage amounts per policy type |
| Network Hospitals | Partner hospital network management |
| Policy Templates | Standard insurance policy configurations |
| Claim Rules | Automated claim eligibility rules |

## 1.8 Claims Management
| Feature | Description |
|---------|-------------|
| Approval Workflows | Multi-level claim approval process |
| Rejection Reasons | Standardized rejection code management |
| Claim Status Tracking | Pending, Approved, Rejected, Settled |
| Settlement Processing | Final settlement amount calculations |
| Dispute Resolution | Handle claim disputes and appeals |

## 1.9 Hospital Packages
| Feature | Description |
|---------|-------------|
| Health Checkup Packages | Annual, Executive, Comprehensive packages |
| Package Components | Tests and consultations included |
| Validity Periods | Package validity configuration |
| Promotional Packages | Special offer packages |
| Corporate Packages | Tailored packages for corporate clients |

## 1.10 Audit Logs
| Feature | Description |
|---------|-------------|
| Immutable Action Trail | Complete record of all system actions |
| 50+ Action Types | User create, delete, login, data changes, etc. |
| User Action Tracking | Who did what and when |
| IP Address Logging | Source IP for security |
| Data Change History | Before and after values |
| Export Functionality | Export logs for compliance audits |

## 1.11 System Settings
| Feature | Description |
|---------|-------------|
| Hospital Configuration | Name, address, contact, logo |
| Operating Hours | Hospital operational schedule |
| Department Configuration | Add, modify, deactivate departments |
| Global Settings | System-wide configurations |
| Email/SMS Configuration | Communication channel settings |
| Backup Settings | Database backup configurations |

**Permissions**: ALL modules - Full CRUD + Approve + Lock/Unlock + Export

---

# 2. ADMIN Modules

**Role Description**: Hospital Administrator with comprehensive management capabilities for day-to-day operations. Cannot access Super Admin-exclusive functions like system settings finalization or complete user deletion.

**Portal**: Staff Portal with HMSSidebar Navigation

## 2.1 Dashboard
| Feature | Description |
|---------|-------------|
| Operations Overview | Daily admissions, discharges, appointments |
| Occupancy Rates | Bed occupancy by department |
| Staff Overview | Staff on duty today |
| Quick Stats | Key performance indicators |
| Recent Activities | Latest system activities |

## 2.2 User Management
| Feature | Description |
|---------|-------------|
| Staff User Creation | Create DOCTOR, NURSE, OPD_MANAGER accounts |
| Auto Staff Entry | Automatic staff_master entry creation |
| Password Reset | Reset user passwords |
| Role Modification | Change user roles (within limits) |
| Status Management | Activate/deactivate staff accounts |

## 2.3 Patient Service
| Feature | Description |
|---------|-------------|
| Patient Registration | New patient registration with demographics |
| Patient Search | Search by name, phone, patient ID |
| Medical History | View complete patient medical history |
| Insurance Tracking | Patient insurance policy management |
| Emergency Contacts | Maintain emergency contact information |
| Photo Capture | Patient photograph for identification |

## 2.4 OPD Service
| Feature | Description |
|---------|-------------|
| Appointment Management | Schedule, reschedule, cancel appointments |
| Doctor Scheduling | Manage doctor availability and time slots |
| Multi-Location Support | 10 hospital locations in Pune |
| Real-time Slot Status | Available, booked, blocked slots |
| Google Maps Integration | Location navigation links |
| Walk-in Management | Handle walk-in patients |

## 2.5 Patient Tracking Service
| Feature | Description |
|---------|-------------|
| Admission Workflow | IPD admission process management |
| Doctor Visit Scheduling | Schedule doctor rounds |
| Patient Status Tracking | Real-time patient location/status |
| Transfer Management | Inter-department transfers |
| Discharge Planning | Discharge preparation and execution |

## 2.6 Staff Management
| Feature | Description |
|---------|-------------|
| Staff Directory | Complete staff listing |
| Department Assignment | Assign staff to departments |
| Shift Management | Staff shift scheduling |
| Nurse Department Preferences | 3 department preference selection |
| Attendance Overview | Staff attendance records |
| Contact Information | Staff contact details |

## 2.7 Bed Management
| Feature | Description |
|---------|-------------|
| Bed Categories | ICU, General, Semi-Private, Private, NICU, etc. |
| Bed Master Records | Complete bed inventory |
| Automated Allocation | Smart bed assignment |
| Transfer Logs | Bed transfer history |
| Discharge Workflows | Cleaning and preparation status |
| Status Tracking | Available, Occupied, Cleaning, Blocked, Maintenance |
| Occupancy Analytics | Real-time occupancy dashboards |

## 2.8 Inventory Service
| Feature | Description |
|---------|-------------|
| Stock Management | Disposables, medicines, equipment |
| Low Stock Alerts | Automatic notifications for low inventory |
| Transaction Logging | All stock movements tracked |
| Expiry Tracking | Items approaching expiration |
| Reorder Reports | Items needing restock |
| Vendor Purchase Orders | Generate POs to vendors |

## 2.9 Equipment Servicing
| Feature | Description |
|---------|-------------|
| Asset Inventory | Complete equipment registry |
| Maintenance Scheduling | Preventive maintenance calendar |
| Service History | Complete service records |
| AMC Management | Annual Maintenance Contract tracking |
| Calibration Records | Equipment calibration tracking |
| Breakdown Reporting | Equipment failure documentation |

## 2.10 Biomedical Waste Management (BMW)
| Feature | Description |
|---------|-------------|
| CPCB Compliance | Central Pollution Control Board standards |
| Waste Categories | Yellow, Red, White, Blue segregation |
| Barcode Generation | Waste bag identification codes |
| Storage Monitoring | Temporary storage tracking |
| Vendor Management | Waste disposal vendor contracts |
| Compliance Reporting | Regulatory report generation |
| Collection Schedules | Waste pickup scheduling |

## 2.11 Oxygen Tracking
| Feature | Description |
|---------|-------------|
| Cylinder Management | B, D, Jumbo type cylinders |
| Status Tracking | Full, In-Use, Empty, Maintenance |
| Movement Logging | Cylinder location history |
| Patient Consumption | Per-patient oxygen usage |
| LMO Readings | Liquid Medical Oxygen levels |
| Low Stock Alerts | Automatic refill notifications |

## 2.12 Swab Contamination Monitoring
| Feature | Description |
|---------|-------------|
| Environmental Surveillance | OT and ICU contamination monitoring |
| Auto-Interpretation | PASS/ACCEPTABLE/FAIL logic |
| CAPA Generation | Corrective Action Preventive Action |
| Audit Logging | Complete test result history |
| Trend Analysis | Contamination trend reports |

## 2.13 Face Recognition
| Feature | Description |
|---------|-------------|
| Identity Verification | Patient identity confirmation |
| Staff Attendance | Facial recognition attendance |
| Duplicate Detection | Prevent duplicate registrations |
| Recognition Confidence | Match confidence scoring |
| Statistics Dashboard | Recognition attempt analytics |
| Settings Management | Threshold and quality configurations |

## 2.14 Consent Forms
| Feature | Description |
|---------|-------------|
| 14 Templates | Legal, surgical, diagnostic, treatment, maternal |
| Trilingual Support | English, Hindi, Marathi |
| PDF Preview | View forms before printing |
| Download/Print | Physical form generation |
| Version Tracking | Form version history |
| Digital Signature Integration | E-signature support |

## 2.15 Notifications
| Feature | Description |
|---------|-------------|
| Multi-Channel | Push, Email, SMS, WhatsApp |
| Priority Levels | Critical, High, Medium, Low |
| Role-Based Filtering | Targeted notifications |
| Broadcast Capability | System-wide announcements |
| Notification History | Complete delivery history |
| Template Management | Notification templates |

## 2.16 Hospital Services
| Feature | Description |
|---------|-------------|
| Service Catalog | 4,830+ services across 24 departments |
| Pricing Management | Service price configuration |
| Duration Tracking | Service duration estimates |
| Department Mapping | Service-to-department links |
| Service Search | Quick service lookup |

## 2.17 AI Analytics
| Feature | Description |
|---------|-------------|
| Doctor Efficiency | Doctor performance analytics |
| Nurse Efficiency | Nursing staff analytics |
| OPD Efficiency | Outpatient department metrics |
| Hospital Health Index | Overall hospital performance score |
| Compliance Risk | Regulatory compliance tracking |
| Predictive Analytics | ICU load, oxygen demand forecasting |
| Anomaly Detection | Unusual pattern identification |

## 2.18 Reports & Analytics
| Feature | Description |
|---------|-------------|
| Operational Reports | Daily, weekly, monthly summaries |
| Financial Reports | Revenue, collections, outstanding |
| Clinical Reports | Admission, discharge statistics |
| Export Functionality | PDF, Excel export options |

**Permissions**: Full access to all listed modules with Create, Edit, Delete capabilities. Cannot access Super Admin-only functions.

---

# 3. DOCTOR Modules

**Role Description**: Medical practitioner with access to clinical workflows, patient management, and prescription capabilities. Requires daily oath acceptance before accessing the portal.

**Portal**: Doctor Portal (Dedicated Interface with Oath Verification)

## 3.1 Daily Oath Requirement
| Feature | Description |
|---------|-------------|
| Daily Verification | Oath must be accepted daily before portal access |
| Oath Modal | Prominent display of medical oath |
| Acceptance Logging | Oath acceptance recorded with timestamp |
| Access Block | Portal blurred until oath accepted |

## 3.2 Dashboard
| Feature | Description |
|---------|-------------|
| Today's Appointments | Scheduled appointments for the day |
| Pending Actions | Prescriptions awaiting signature, pending reviews |
| Patient Overview | Recently seen patients |
| Notification Feed | Important alerts and updates |
| Quick Stats | Today's patients, prescriptions, pending tasks |

## 3.3 Appointments
| Feature | Description |
|---------|-------------|
| Schedule View | Daily, weekly appointment calendar |
| Appointment Details | Patient info, reason for visit |
| Status Management | Confirmed, Completed, No-Show |
| Patient History Quick Access | View patient records from appointment |
| Time Slot Management | Manage personal availability |

## 3.4 My Patients
| Feature | Description |
|---------|-------------|
| Patient List | All patients under care |
| Medical History | Complete patient medical records |
| Vital Signs | Latest vitals recording |
| Lab Results | Recent lab test results |
| Imaging Reports | X-ray, MRI, CT reports |
| Treatment Plans | Active treatment protocols |
| Progress Notes | Clinical notes and observations |

## 3.5 Prescriptions
| Feature | Description |
|---------|-------------|
| Create Prescription | New prescription creation |
| Medicine Selection | Search from medicine database |
| Dosage Instructions | Frequency, duration, special instructions |
| Draft Status | Save drafts for later completion |
| Awaiting Signature | Prescriptions pending finalization |
| Digital Signature | Finalize with digital signature |
| Void Capability | Cancel incorrect prescriptions |
| Prescription History | Complete prescription history |
| Template Management | Personal prescription templates |

## 3.6 Schedule Management
| Feature | Description |
|---------|-------------|
| Personal Schedule | Configure weekly schedule |
| Leave Management | Mark leave days |
| Time Slot Configuration | 30-minute appointment slots |
| Multi-Location Scheduling | Schedule across hospital branches |
| Block Slots | Block slots for meetings, procedures |

## 3.7 Patient Monitoring
| Feature | Description |
|---------|-------------|
| ICU Chart Access | View ICU patient charts |
| Nursing Notes | Access nursing observations |
| Vitals Monitoring | Real-time vital signs |
| Critical Alerts | High-priority patient alerts |
| Order Entry | Order tests, medications |
| Investigation Chart | View/record comprehensive lab and imaging results |
| Allergies & Precautions | View/add drug/food allergies and special precautions |

## 3.8 Hospital Services
| Feature | Description |
|---------|-------------|
| Service Ordering | Order procedures and services |
| Service Catalog Browse | View available services |
| Referral Services | Refer to specialist services |

## 3.9 Notifications
| Feature | Description |
|---------|-------------|
| Patient Updates | Lab results, critical values |
| Appointment Reminders | Upcoming appointment alerts |
| System Announcements | Hospital-wide notices |
| Emergency Alerts | Emergency patient alerts |

## 3.10 Profile
| Feature | Description |
|---------|-------------|
| Personal Information | Update contact details |
| Qualifications | Medical degrees and certifications |
| Specialization | Primary and sub-specializations |
| Photo Management | Profile photo upload |
| Digital Signature Setup | Configure e-signature |

**Permissions**: View patients, Create/Edit prescriptions with approval rights, View OPD/IPD, View pathology reports, View consent forms, View notifications.

---

# 4. NURSE Modules

**Role Description**: Nursing staff with access to patient care workflows, vitals documentation, medication administration, and bed management capabilities.

**Portal**: Staff Portal with HMSSidebar Navigation (Filtered by Role)

## 4.1 Dashboard
| Feature | Description |
|---------|-------------|
| Ward Overview | Patients in assigned ward/department |
| Pending Tasks | Medications due, vitals to record |
| Critical Patients | High-acuity patient alerts |
| Shift Summary | Current shift patient assignments |
| Quick Actions | Common task shortcuts |

## 4.2 Patient Monitoring (16 Sub-modules)
| Sub-module | Description |
|------------|-------------|
| Vitals Recording | Heart rate, BP, temperature, SpO2, respiratory rate |
| Inotropes Tracking | Vasopressor and inotrope infusions |
| Ventilator Settings | Mechanical ventilation parameters |
| ABG (Arterial Blood Gas) | Blood gas analysis logging |
| Intake/Output Charts | Fluid balance monitoring |
| Medication Administration | Drug administration recording |
| Nursing Notes | Shift observations and notes |
| Pain Assessment | Pain scale documentation |
| Fall Risk Assessment | Patient fall risk evaluation |
| Pressure Ulcer Risk | Skin integrity monitoring |
| GCS (Glasgow Coma Scale) | Neurological assessment |
| Fluid Balance | 24-hour fluid calculations |
| Blood Transfusion | Transfusion monitoring |
| Procedure Log | Bedside procedures documentation |
| Allergies & Precautions | Drug/food allergies, isolation precautions, risk flags |
| Investigation Chart | 50+ lab tests and imaging fields (Blood, Renal, Liver, Cardiac, Lipid, Imaging) |

**Features**:
- Shift-based logging (Morning, Evening, Night)
- Version control for all entries
- Critical value alerts
- 24-hour data collection
- NABH-compliant documentation
- Comprehensive investigation tracking with date-based entries

## 4.3 Bed Management
| Feature | Description |
|---------|-------------|
| Bed Status View | Current bed occupancy |
| Patient Assignment | Assign patients to beds |
| Transfer Initiation | Request bed transfers |
| Cleaning Status | Mark beds for cleaning |
| Quick Bed Search | Find available beds |

## 4.4 Patient Records (View)
| Feature | Description |
|---------|-------------|
| Patient Details | View patient demographics |
| Medical History | Access medical history |
| Current Orders | Active medical orders |
| Allergies | Patient allergy information |
| Care Plans | Active nursing care plans |

## 4.5 Prescriptions (View Only)
| Feature | Description |
|---------|-------------|
| Active Prescriptions | Current medications |
| Medication Schedule | Timing for medication administration |
| PRN Medications | As-needed medication list |
| Medication History | Past prescriptions |

## 4.6 Oxygen Tracking
| Feature | Description |
|---------|-------------|
| Cylinder Status | Current cylinder levels |
| Patient Allocation | Assign cylinders to patients |
| Usage Recording | Log oxygen consumption |
| Refill Requests | Request cylinder refills |

## 4.7 Department Preferences
| Feature | Description |
|---------|-------------|
| Primary Department | First choice department |
| Secondary Department | Second choice department |
| Tertiary Department | Third choice department |
| Preference Updates | Modify department preferences |

## 4.8 Consent Forms (View)
| Feature | Description |
|---------|-------------|
| Form Access | View signed consent forms |
| Verification | Verify consent status |
| Print Capability | Print forms for records |

## 4.9 Notifications
| Feature | Description |
|---------|-------------|
| Patient Alerts | Critical patient notifications |
| Medication Reminders | Due medication alerts |
| Shift Updates | Shift change notifications |
| Emergency Codes | Emergency response alerts |

## 4.10 Self-Service Profile
| Feature | Description |
|---------|-------------|
| Personal Details | Update contact information |
| Emergency Contact | Personal emergency contacts |
| Training Records | Certifications and training |
| Leave Requests | Request time off |

**Permissions**: View patients, Edit vitals and nursing records, View prescriptions, View/Edit bed management, View OPD/IPD, View/Edit oxygen tracking, View consent forms, View notifications.

---

# 5. OPD MANAGER Modules

**Role Description**: Outpatient Department Manager responsible for patient registration, appointment scheduling, billing, and front-desk operations.

**Portal**: Staff Portal with HMSSidebar Navigation (Filtered by Role)

## 5.1 Dashboard
| Feature | Description |
|---------|-------------|
| Today's Appointments | All scheduled appointments |
| Patient Queue | Current waiting patients |
| Registration Stats | Today's new registrations |
| Revenue Summary | Today's collections |
| Doctor Availability | Doctors currently available |

## 5.2 Patient Registration
| Feature | Description |
|---------|-------------|
| New Registration | Register new patients |
| ID Card Scanning | Aadhaar/PAN/Voter ID extraction |
| Camera Capture | Patient photo capture |
| Demographics Entry | Complete demographic information |
| Insurance Details | Insurance policy registration |
| Emergency Contacts | Emergency contact setup |
| Duplicate Check | Prevent duplicate registrations |
| Patient ID Generation | Unique patient ID creation |

## 5.3 Appointment Booking
| Feature | Description |
|---------|-------------|
| Doctor Selection | Choose from available doctors |
| Specialty Filter | Filter by medical specialty |
| Location Selection | Select hospital branch (10 locations) |
| Time Slot Selection | 30-minute slot availability |
| Booking Confirmation | Appointment confirmation |
| Rescheduling | Change appointment date/time |
| Cancellation | Cancel with reason |
| Walk-in Booking | Immediate appointments |

## 5.4 OPD Service Management
| Feature | Description |
|---------|-------------|
| Queue Management | Patient queue organization |
| Check-in Process | Patient arrival marking |
| Token System | Queue token generation |
| Wait Time Display | Estimated wait times |
| Doctor Reassignment | Change assigned doctor |

## 5.5 Billing
| Feature | Description |
|---------|-------------|
| Bill Generation | Create patient bills |
| Service Addition | Add services to bill |
| Discount Application | Apply authorized discounts |
| Payment Collection | Record payments (Cash, Card, UPI) |
| Receipt Printing | Generate payment receipts |
| Pending Bills | Track outstanding amounts |
| Bill History | Patient billing history |

## 5.6 Patient Records (View/Edit)
| Feature | Description |
|---------|-------------|
| Patient Search | Find patients by various criteria |
| Record Updates | Update patient information |
| Contact Modification | Change contact details |
| Insurance Updates | Modify insurance information |

## 5.7 Face Recognition
| Feature | Description |
|---------|-------------|
| Patient Identification | Verify patient identity |
| Quick Check-in | Facial recognition check-in |
| Duplicate Detection | Identify potential duplicates |

## 5.8 Consent Forms (View)
| Feature | Description |
|---------|-------------|
| Form Access | View consent form templates |
| Print Forms | Print blank forms for signing |
| Status Verification | Check consent status |

## 5.9 Notifications
| Feature | Description |
|---------|-------------|
| Send Notifications | Send patient notifications |
| Appointment Reminders | Trigger appointment reminders |
| System Alerts | Receive system notifications |
| Broadcast Messages | Department announcements |

**Permissions**: Full OPD access with Create/Edit/Delete for patients and appointments, Create billing, View consent forms, View/Create notifications.

---

# 6. PATIENT Modules

**Role Description**: Hospital patient with access to personal health information, appointments, prescriptions, and health services through a dedicated patient portal.

**Portal**: Patient Portal (Dedicated Mobile-Friendly Interface)

## 6.1 Dashboard
| Feature | Description |
|---------|-------------|
| Welcome Banner | Personalized greeting |
| Health Summary | Key health statistics |
| Total Appointments | Lifetime visit count |
| Upcoming Appointments | Scheduled appointments |
| Health Records Count | Available medical documents |
| Pending Bills | Outstanding payment amount |

## 6.2 Book Appointment
| Feature | Description |
|---------|-------------|
| Doctor Selection | Browse available doctors |
| Specialty Filter | Filter by specialty |
| Location Selection | Choose hospital branch |
| Date Selection | Pick appointment date |
| Time Slot Selection | Choose available 30-minute slot |
| Booking Confirmation | Appointment confirmation |
| Appointment History | Past and future appointments |

## 6.3 Prescriptions
| Feature | Description |
|---------|-------------|
| Active Prescriptions | Currently active medications |
| Prescription Details | Dosage, frequency, duration |
| Medication Schedule | When to take medications |
| Past Prescriptions | Historical prescriptions |
| Download/Print | Print prescriptions |
| Share with Pharmacy | Send to medical store |

## 6.4 Lab Reports
| Feature | Description |
|---------|-------------|
| Recent Reports | Latest lab test results |
| Report Details | Complete test parameters |
| Normal Range Comparison | Compare with normal values |
| Historical Reports | Past test results |
| Download Reports | PDF download capability |
| Trend View | Parameter trends over time |

## 6.5 Health Records
| Feature | Description |
|---------|-------------|
| Medical Documents | All medical records |
| Imaging Reports | X-ray, MRI, CT reports |
| Discharge Summaries | Hospital stay summaries |
| Document Categories | Organized by type |
| Download Capability | PDF downloads |

## 6.6 Medical Stores
| Feature | Description |
|---------|-------------|
| Nearby Stores | Hospital and partner pharmacies |
| Store Types | In-house and third-party |
| Share Prescription | Send prescription to store |
| Medicine Availability | Check stock availability |
| Contact Information | Store contact details |

## 6.7 Insurance Claims
| Feature | Description |
|---------|-------------|
| Active Claims | Current claim status |
| Claim History | Past claim records |
| Policy Details | Insurance policy information |
| Claim Documents | Required documentation |

## 6.8 Services & Surgeries
| Feature | Description |
|---------|-------------|
| Service Catalog | Available hospital services |
| Surgery Packages | Surgical package options |
| Price Information | Service pricing |
| Book Services | Request services |

## 6.9 Our Doctors
| Feature | Description |
|---------|-------------|
| Doctor Directory | All hospital doctors |
| Specialty Browse | Browse by specialty |
| Doctor Profiles | Qualifications, experience |
| Availability Check | Doctor schedule view |

## 6.10 Health Guide (Disease Knowledge)
| Feature | Description |
|---------|-------------|
| Disease Information | Pre-seeded disease knowledge |
| Diet Plans | Indian diet recommendations |
| Medication Info | Understanding medications |
| AI-Powered Personalization | Personalized health tips |
| ICMR/MoHFW Guidelines | Evidence-based information |

## 6.11 Health Assistant (AI Chatbot)
| Feature | Description |
|---------|-------------|
| 24/7 Availability | Always available assistance |
| Health Queries | Answer health questions |
| Appointment Help | Booking assistance |
| Navigation Help | Portal navigation guidance |
| GPT-4o Powered | Advanced AI responses |

## 6.12 Notifications
| Feature | Description |
|---------|-------------|
| Appointment Reminders | Upcoming appointment alerts |
| Lab Result Alerts | New results available |
| Health Tips | Periodic health advice |
| Hospital Announcements | General notifications |
| Birthday Wishes | Birthday greetings |

## 6.13 My Profile
| Feature | Description |
|---------|-------------|
| Personal Details | View/update demographics |
| Contact Information | Phone, email, address |
| Emergency Contacts | Emergency contact list |
| Insurance Details | Policy information |
| Preferences | Notification preferences |

## 6.14 Admission
| Feature | Description |
|---------|-------------|
| Admission Status | Current admission details |
| Room Information | Bed/room assignment |
| Attending Team | Doctors and nurses assigned |
| Estimated Discharge | Expected discharge date |

**Permissions**: View own dashboard, View own appointments, View own prescriptions, View own billing, View own notifications. **Strict data isolation ensures patients only see their own data.**

---

# 7. PATHOLOGY LAB Modules

**Role Description**: Laboratory staff responsible for test processing, sample management, result entry, and quality control in the pathology department.

**Portal**: Pathology Lab Portal (Dedicated Interface)

## 7.1 Dashboard
| Feature | Description |
|---------|-------------|
| Pending Tests | Tests awaiting processing |
| Samples Received | Today's sample count |
| Reports Completed | Completed reports today |
| Critical Values | Tests with critical results |
| TAT Compliance | Turnaround time metrics |

## 7.2 Test Orders
| Feature | Description |
|---------|-------------|
| Incoming Orders | New test requests |
| Order Details | Patient info, tests requested |
| Sample Requirements | Required sample types |
| Priority Marking | Urgent, Routine, STAT |
| Order Acknowledgment | Accept and process orders |

## 7.3 Sample Collection
| Feature | Description |
|---------|-------------|
| Collection Workflow | Sample collection process |
| Barcode Generation | Sample identification codes |
| Sample Tracking | Real-time sample location |
| Collection Status | Collected, Pending, Rejected |
| Quality Checks | Sample adequacy verification |

## 7.4 Test Processing
| Feature | Description |
|---------|-------------|
| Worklist Management | Tests to be processed |
| Equipment Interface | Analyzer integration |
| Result Entry | Manual and auto result entry |
| Validation | Result verification |
| Repeat Testing | Re-run requests |

## 7.5 Walk-in Reports
| Feature | Description |
|---------|-------------|
| Direct Registration | Patients without prior orders |
| WALKIN-Prefix | Auto-generated order numbers |
| Quick Entry | Streamlined registration |
| Staff Notifications | Alert when completed |

## 7.6 Available Tests (1,148 Tests)
| Category | Test Count |
|----------|------------|
| Hematology | ~150 tests |
| Biochemistry | ~200 tests |
| Microbiology | ~100 tests |
| Serology | ~100 tests |
| Histopathology | ~150 tests |
| Clinical Pathology | ~100 tests |
| Endocrinology | ~100 tests |
| Tumor Markers | ~80 tests |
| Immunology | ~100 tests |
| Genetics | ~68 tests |

**Test Details Display**:
- Sample type required
- Turnaround time
- Price
- Normal range
- Description
- Patient instructions

## 7.7 Result Entry & Validation
| Feature | Description |
|---------|-------------|
| Result Input | Enter test results |
| Normal Range Check | Automatic flagging |
| Critical Value Alerts | High/low critical alerts |
| Supervisor Review | Results requiring approval |
| Final Authorization | Report finalization |

## 7.8 Report Generation
| Feature | Description |
|---------|-------------|
| Auto-Formatting | Standard report templates |
| Digital Signature | Authorized signatory |
| PDF Generation | Downloadable reports |
| Printing | Physical report printing |
| Report Delivery | Patient notification |

## 7.9 Quality Control
| Feature | Description |
|---------|-------------|
| IQC (Internal QC) | Daily quality checks |
| EQAS Participation | External quality assessment |
| Westgard Rules | QC rule application |
| Corrective Actions | QC failure handling |
| QC Reports | Quality statistics |

## 7.10 Lab Inventory
| Feature | Description |
|---------|-------------|
| Reagent Tracking | Reagent stock levels |
| Consumables | Tubes, tips, slides |
| Expiry Monitoring | Expired item alerts |
| Reorder Alerts | Low stock notifications |
| Usage Tracking | Consumption tracking |

## 7.11 Notifications
| Feature | Description |
|---------|-------------|
| New Order Alerts | Incoming test orders |
| Critical Value Alerts | Urgent result notifications |
| QC Failures | Quality control alerts |
| System Messages | Administrative notices |

## 7.12 Reports & Analytics
| Feature | Description |
|---------|-------------|
| Productivity Reports | Tests per technician |
| TAT Reports | Turnaround time analysis |
| Volume Reports | Test volume statistics |
| Revenue Reports | Lab revenue tracking |
| Export Options | PDF, Excel export |

**Permissions**: Full pathology access with Create/Edit/Approve for lab operations, View patients, View/Export reports, View notifications.

---

# 8. MEDICAL STORE Modules

**Role Description**: Pharmacy staff responsible for prescription dispensing, medication management, inventory control, and billing for pharmacy operations.

**Portal**: Medical Store Portal (Dedicated Interface)

## 8.1 Dashboard
| Feature | Description |
|---------|-------------|
| Pending Prescriptions | Prescriptions awaiting dispensing |
| Today's Sales | Total sales amount |
| Low Stock Alerts | Medicines needing reorder |
| Expired Items | Items past expiration |
| Revenue Summary | Daily/weekly revenue |

## 8.2 Prescription Queue
| Feature | Description |
|---------|-------------|
| Incoming Prescriptions | Prescriptions from doctors/patients |
| Prescription Status | PENDING, PARTIALLY_DISPENSED, FULLY_DISPENSED |
| Patient Information | Patient details for verification |
| Doctor Details | Prescribing doctor information |
| Priority Handling | Urgent prescription marking |

## 8.3 Medication Dispensing
| Feature | Description |
|---------|-------------|
| Medicine Selection | Select from inventory |
| Quantity Dispensing | Record quantity given |
| Batch Selection | Choose from available batches |
| Substitution | Generic/alternative suggestions |
| Substitution Approval | Doctor approval for substitutes |
| Label Printing | Medication labels |
| Dispensing Record | Complete dispensing log |

## 8.4 Medicine Database (View/Edit)
| Feature | Description |
|---------|-------------|
| Medicine Search | Search by name, salt, brand |
| Stock Levels | Current inventory quantities |
| Batch Details | Manufacturing, expiry dates |
| Price Information | MRP and selling price |
| Alternative Medicines | Generic equivalents |

## 8.5 Stock Management
| Feature | Description |
|---------|-------------|
| Stock Receipt | Record new stock arrivals |
| Stock Adjustment | Inventory corrections |
| Stock Transfer | Inter-location transfers |
| Dead Stock | Non-moving inventory |
| Return Processing | Supplier returns |

## 8.6 Billing
| Feature | Description |
|---------|-------------|
| Bill Generation | Create pharmacy bills |
| GST Calculation | Automatic tax calculation |
| Discount Application | Apply valid discounts |
| Payment Methods | CASH, CARD, UPI, INSURANCE |
| Receipt Printing | Transaction receipts |
| Credit Sales | Credit account management |

## 8.7 Store Configuration
| Feature | Description |
|---------|-------------|
| Store Type | IN_HOUSE or THIRD_PARTY |
| Operating Hours | Store timing |
| Contact Details | Phone, address |
| Location Mapping | Hospital branch association |

## 8.8 Expiry Management
| Feature | Description |
|---------|-------------|
| Expiring Soon | Items expiring within 90 days |
| Expired Items | Past expiration items |
| Return to Vendor | Expired item returns |
| Write-off | Expired item disposal |
| Expiry Reports | Comprehensive expiry tracking |

## 8.9 Audit & Compliance
| Feature | Description |
|---------|-------------|
| Transaction Log | All sales recorded |
| Dispensing History | Complete dispensing trail |
| Controlled Substances | Schedule drug tracking |
| Compliance Reports | Regulatory compliance |

## 8.10 Notifications
| Feature | Description |
|---------|-------------|
| New Prescriptions | Incoming prescription alerts |
| Low Stock Alerts | Reorder notifications |
| Expiry Warnings | Upcoming expirations |
| Substitution Requests | Pending approvals |

**Permissions**: Full stock management access, View prescriptions, View/Edit medicine database, Create billing, View notifications.

---

# 9. TECHNICIAN Modules

**Role Description**: Diagnostic department technicians handling imaging and diagnostic procedures (MRI, CT Scan, X-Ray, ECG, Echo, EEG, Sonography, etc.).

**Portal**: Technician Portal (Dedicated Interface)

## 9.1 Dashboard
| Feature | Description |
|---------|-------------|
| Pending Scans | Procedures awaiting completion |
| Reports Uploaded | Completed reports today |
| Today's Procedures | Scheduled for today |
| Urgent Requests | High-priority procedures |

## 9.2 Pending Tests Tab
| Feature | Description |
|---------|-------------|
| Ordered Tests | Diagnostic tests ordered by doctors |
| Patient Information | Patient details |
| Test Type | MRI, CT, X-Ray, ECG, etc. |
| Priority Level | Routine, Urgent, STAT |
| Ordering Doctor | Doctor who requested |
| Special Instructions | Preparation requirements |

## 9.3 Test Processing
| Feature | Description |
|---------|-------------|
| Patient Check-in | Confirm patient arrival |
| Procedure Start | Begin procedure recording |
| Equipment Selection | Assign equipment used |
| Procedure Notes | Technical observations |
| Completion Marking | Mark procedure complete |

## 9.4 Report Upload
| Feature | Description |
|---------|-------------|
| File Attachment | Upload report files |
| Supported Formats | PDF, DICOM, JPEG, PNG |
| Report Description | Findings summary |
| Quality Check | Image quality verification |
| Upload Confirmation | Successful upload notification |

## 9.5 Completed Reports History
| Feature | Description |
|---------|-------------|
| All Completed | History of completed reports |
| Search/Filter | Find specific reports |
| Report Download | Access uploaded files |
| Patient Lookup | Search by patient |
| Date Range Filter | Filter by date |

## 9.6 Test Notifications
| Feature | Description |
|---------|-------------|
| Suggested Diagnostics | Tests suggested by doctors |
| New Order Alerts | Incoming test orders |
| Priority Alerts | Urgent procedure notifications |
| System Messages | Administrative notices |

## 9.7 Automatic Notifications (Triggered on Report Submission)
| Recipient | Notification Type |
|-----------|-------------------|
| Patient | Report available notification |
| Ordering Doctor | Report ready for review |
| Admin | Report completion logged |

## 9.8 Supported Diagnostic Departments
| Department | Procedures |
|------------|------------|
| Radiology | X-Ray, CT Scan, MRI |
| Sonography | Ultrasound, Echo |
| Cardiology | ECG, Stress Test |
| Neurology | EEG, EMG |
| Nuclear Medicine | PET, Bone Scan |

**Permissions**: View pending diagnostic tests, Upload reports, View completed reports, Receive notifications, Trigger automatic notifications.

---

# Permission Matrix Summary

## CRUD Permissions by Role

| Module | Super Admin | Admin | Doctor | Nurse | OPD Manager | Patient | Pathology Lab | Medical Store | Technician |
|--------|:-----------:|:-----:|:------:|:-----:|:-----------:|:-------:|:-------------:|:-------------:|:----------:|
| Dashboard | FULL | V | V | V | V | V (Own) | V | V | V |
| Users | FULL | CRUD | - | - | - | - | - | - | - |
| Patients | FULL | CRUD | VE | VE | VCE | V (Own) | V | - | V |
| Appointments | FULL | CRUD+A | VE | V | CRUD | V (Own) | - | - | - |
| Billing | FULL | VCE | - | - | VC | V (Own) | - | VC | - |
| Stock | FULL | VCE | - | - | - | - | - | VCE | - |
| Surgery | FULL | VCE | V | - | - | - | - | - | - |
| Medicine | FULL | VCE | V | - | - | - | - | VE | - |
| Insurance | FULL | VCE | - | - | - | V | - | - | - |
| Claims | FULL | VCE+A | - | - | - | V (Own) | - | - | - |
| Packages | FULL | VCE | - | - | - | V | - | - | - |
| Reports | FULL | V+E | - | - | - | - | V+E | - | - |
| Audit Logs | FULL | V | - | - | - | - | - | - | - |
| Bed Management | FULL | VCE | - | VE | - | - | - | - | - |
| OPD | FULL | VCE | V | V | VCE | - | - | - | - |
| IPD | FULL | VCE | V | V | - | - | - | - | - |
| Pathology | FULL | V | V | - | - | V (Own) | FULL+A | - | - |
| Prescriptions | FULL | V | VCE+A | V | - | V (Own) | - | V | - |
| Equipment | FULL | VCE | - | - | - | - | - | - | VCE |
| BMW | FULL | VCE | - | - | - | - | - | - | - |
| Oxygen | FULL | VCE | - | VE | - | - | - | - | - |
| Consent Forms | FULL | V | V | V | V | - | - | - | - |
| Notifications | FULL | VC | V | V | VC | V (Own) | V | V | V |
| Settings | FULL | VE | - | - | - | - | - | - | - |
| Technician Tests | - | V | V | - | - | - | - | - | FULL |

**Legend**:
- FULL = All operations (View, Create, Edit, Delete, Approve, Lock, Unlock, Export)
- V = View only
- C = Create
- E = Edit
- D = Delete
- A = Approve
- VCE = View, Create, Edit
- CRUD = Create, Read, Update, Delete
- Own = Only own data visible

---

## Data Isolation Rules

1. **Patients** can ONLY see their own:
   - Appointments
   - Prescriptions
   - Lab reports
   - Health records
   - Billing
   - Notifications

2. **Doctors** can see:
   - Their own appointments
   - Patients assigned to them
   - Prescriptions they created

3. **Nurses** can see:
   - Patients in their assigned department
   - Bed management for assigned wards

4. **Technicians** can see:
   - Pending tests in their department
   - Reports they uploaded

5. **Pathology Lab** can see:
   - All lab orders
   - All samples
   - All lab reports

6. **Medical Store** can see:
   - All prescriptions shared with pharmacy
   - Complete medicine inventory

---

## Security Measures

| Measure | Description |
|---------|-------------|
| Session Authentication | Express Sessions stored in PostgreSQL |
| Password Hashing | bcrypt with 10 rounds |
| Role Verification | Server-side role checks on every API call |
| Staff Validation | Staff must exist in staff_master table |
| Audit Logging | All critical actions logged |
| Data Encryption | Sensitive data encrypted (biometrics) |
| HIPAA Compliance | Healthcare data protection standards |
| NABH Compliance | Indian healthcare accreditation standards |

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-08 | Gravity AI Manager | Initial comprehensive documentation |

---

**End of Document**
