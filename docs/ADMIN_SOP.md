# Administrator Standard Operating Procedure (SOP)
## HMS Core - Hospital Management System

**Version**: 1.1  
**Effective Date**: January 2026  
**Applicable To**: All System Administrators at Gravity Hospital  
**Document Type**: User Manual & SOP  
**Last Updated**: January 9, 2026

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Login Process](#2-login-process)
3. [Admin Dashboard Overview](#3-admin-dashboard-overview)
4. [User Management](#4-user-management)
5. [Hospital Settings](#5-hospital-settings)
6. [System Settings](#6-system-settings)
7. [OPD Service Management](#7-opd-service-management)
8. [Patient Service Management](#8-patient-service-management)
9. [Patient Tracking](#9-patient-tracking)
10. [Inventory Service](#10-inventory-service)
11. [Equipment Servicing](#11-equipment-servicing)
12. [Oxygen Tracking System](#12-oxygen-tracking-system)
13. [Biomedical Waste Management](#13-biomedical-waste-management)
14. [Swab Contamination Monitoring](#14-swab-contamination-monitoring)
15. [Consent Forms Management](#15-consent-forms-management)
16. [Patient Monitoring](#16-patient-monitoring)
17. [Disease Knowledge Module](#17-disease-knowledge-module)
18. [AI Analytics Dashboard](#18-ai-analytics-dashboard)
19. [Patient Analytics](#19-patient-analytics)
20. [Notification Service](#20-notification-service)
21. [Chatbot Service](#21-chatbot-service)
22. [Biometric Service](#22-biometric-service)
23. [Real Data Importance](#23-real-data-importance)
24. [AI Analysis Features](#24-ai-analysis-features)
25. [Best Practices](#25-best-practices)
26. [Troubleshooting](#26-troubleshooting)

---

## 1. Introduction

### 1.1 Purpose
This Standard Operating Procedure provides comprehensive guidance for administrators managing the HMS Core Hospital Management System. It covers all features from user management to AI analytics.

### 1.2 Scope
This SOP applies to users with the ADMIN role who have full system access, including:
- System Administrators
- Hospital IT Managers
- Operations Managers
- Quality Assurance Officers

### 1.3 Administrator Role Capabilities

| Feature | Access Level |
|---------|-------------|
| User Management | Full Access (Create, Edit, Delete users) |
| Hospital Settings | Full Access |
| System Settings | Full Access |
| All Clinical Services | Full Access |
| AI Analytics | Full Access |
| Patient Analytics | Full Access |
| Consent Forms | Full Access |
| Equipment Servicing | Full Access |
| Biomedical Waste | Full Access |
| Oxygen Tracking | Full Access |
| Swab Monitoring | Full Access |
| All Notifications | Full Access |

### 1.4 Administrator Responsibilities

- Manage all user accounts and permissions
- Configure hospital-wide settings
- Monitor system health and performance
- Ensure regulatory compliance
- Oversee data quality and integrity
- Manage equipment and inventory
- Generate compliance reports
- Monitor AI analytics and insights

---

## 2. Login Process

### 2.1 Step-by-Step Login

**Step 1: Access the Application**
- Open your web browser (Chrome, Firefox, Edge recommended)
- Navigate to the HMS Core URL
- The login page will display

**Step 2: Enter Credentials**
- Enter your admin username (format: `admin.firstname.lastname`)
- Enter your password
- Click the "Login" button

**Step 3: Authentication**
- The system validates your credentials
- If successful, you will be redirected to the Admin Dashboard
- If unsuccessful, check your credentials and try again

### 2.2 Default Admin Credentials
| Username | Password |
|----------|----------|
| admin.suhas.nair | Admin@123 |

### 2.3 Security Guidelines
- Change default password immediately upon first login
- Use strong passwords (minimum 12 characters, mixed case, numbers, symbols)
- Never share admin credentials
- Enable two-factor authentication when available
- Log out when leaving the workstation
- Review login audit logs regularly
- Report unauthorized access attempts immediately

---

## 3. Admin Dashboard Overview

### 3.1 Dashboard Components

The Admin Dashboard provides a comprehensive view of hospital operations:

**Statistics Overview**
| Card | Information |
|------|-------------|
| Total Patients | Active patients in system |
| Today's Appointments | Scheduled appointments |
| Staff Members | Total registered staff |
| Pending Tasks | Items requiring attention |
| Low Stock Items | Inventory alerts |
| Equipment Due | Upcoming service dates |

**Quick Actions Panel**
- Add New User
- View Reports
- System Settings
- Generate Backup

**Activity Feed**
- Recent user logins
- System events
- Critical alerts
- Compliance notifications

### 3.2 Navigation Sidebar

The admin sidebar provides access to ALL modules:

| Category | Menu Items |
|----------|------------|
| **Core** | Dashboard |
| **Administration** | User Management, Hospital Settings, System Settings |
| **Clinical** | OPD Service, Patient Service, Patient Tracking |
| **Operations** | Inventory Service, Equipment Servicing |
| **Compliance** | Oxygen Tracker, Biowaste Management, Swab Monitoring |
| **Clinical Support** | Disease Knowledge, Patient Monitoring, Consents |
| **Analytics** | AI Analytics, Patient Analytics |
| **Communication** | Notification Service, Chatbot Service |

---

## 4. User Management

### 4.1 Purpose
Manage all hospital staff accounts including doctors, nurses, OPD managers, pathology lab staff, medical store staff, and other administrators.

### 4.2 Accessing User Management

**Step 1: Navigate to User Management**
- Click "User Management" in sidebar

**Step 2: View User List**
- All registered users displayed
- Search and filter capabilities
- Role-based filtering

### 4.3 Adding New Users

**Step 1: Click "Add User"**
- New user form opens

**Step 2: Fill User Details**
| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| Full Name | Yes | Complete name | Dr. Anil Kumar |
| Username | Yes | Login username | dr.anil.kumar |
| Password | Yes | Initial password | Doctor@123 |
| Email | Yes | Contact email | anil.kumar@hospital.com |
| Phone | Yes | Contact number | +91 9876543210 |
| Role | Yes | User role | DOCTOR, NURSE, OPD_MANAGER, ADMIN, PATHOLOGY_LAB, MEDICAL_STORE |
| Department | No | Hospital department | Cardiology |

**Step 3: Assign Role**
| Role | Description |
|------|-------------|
| ADMIN | Full system access |
| DOCTOR | Clinical access, prescriptions, patients |
| NURSE | Patient care, monitoring, limited admin |
| OPD_MANAGER | OPD operations, scheduling |
| PATIENT | Personal records only |
| PATHOLOGY_LAB | Lab tests, sample management, results, QC |
| MEDICAL_STORE | Pharmacy operations, dispensing, billing |

**Step 4: Save User**
- Click "Create User"
- User receives login credentials via email

### 4.4 Editing Users

**Step 1: Find User**
- Search by name or filter by role

**Step 2: Click Edit**
- Edit icon on user card

**Step 3: Modify Details**
- Update required fields
- Change role if needed

**Step 4: Save Changes**
- Click "Save"
- Changes take effect immediately

### 4.5 Deactivating Users

**Step 1: Find User**
- Locate user in list

**Step 2: Click Deactivate**
- User status changes to inactive
- Cannot login until reactivated

**Note**: Never delete users with associated records. Deactivate instead for audit trail.

### 4.6 Password Reset

**Step 1: Find User**
- Locate user in list

**Step 2: Click Reset Password**
- Generate new temporary password
- Send to user email

### 4.7 Importance for Real Data

| Why Accurate User Data Matters |
|-------------------------------|
| **Access Control**: Wrong roles create security risks |
| **Audit Trail**: User actions tracked by ID |
| **Notifications**: Contact info for alerts |
| **Compliance**: Regulatory requirements for staff records |
| **AI Analysis**: Staff efficiency metrics need accurate data |

---

## 5. Hospital Settings

### 5.1 Purpose
Configure hospital-wide information and operational parameters.

### 5.2 Accessing Hospital Settings

**Step 1: Navigate to Hospital Settings**
- Click "Hospital Settings" in sidebar

### 5.3 Basic Information

| Field | Description | Example |
|-------|-------------|---------|
| Hospital Name | Official name | Gravity Hospital |
| Address | Full address | 123 Healthcare Road, Pune |
| Phone | Main contact | +91 20 12345678 |
| Email | Official email | info@gravityhospital.com |
| Website | Hospital website | www.gravityhospital.com |
| Established Year | Founding year | 2010 |
| License Number | Medical license | MH/PVT/2010/1234 |
| Registration Number | Govt registration | REG2010001234 |

### 5.4 Operational Settings

| Setting | Description | Example |
|---------|-------------|---------|
| Emergency Hours | Emergency timings | 24x7 |
| OPD Hours | Outpatient timings | 9:00 AM - 6:00 PM |
| Visiting Hours | Patient visiting | 4:00 PM - 6:00 PM |
| Max Patients/Day | Daily capacity | 500 |
| Appointment Slot Duration | Default slot length | 30 minutes |
| Emergency Wait Time | Target wait time | 15 minutes |

### 5.5 Facility Information

| Setting | Description | Example |
|---------|-------------|---------|
| Total Beds | All beds | 200 |
| ICU Beds | Intensive care | 30 |
| Emergency Beds | Emergency department | 20 |
| Operation Theaters | Total OTs | 8 |
| Departments | List of departments | Cardiology, Neurology, etc. |

### 5.6 Saving Settings

**Step 1: Modify Required Fields**
- Update any field

**Step 2: Click Save**
- Click "Save" button for each section
- Changes apply hospital-wide immediately

### 5.7 Importance for Real Data

| Why Accurate Hospital Settings Matter |
|--------------------------------------|
| **Patient Information**: Printed on reports and prescriptions |
| **Scheduling**: Slot duration affects appointment system |
| **Capacity Planning**: AI uses capacity for predictions |
| **Legal Compliance**: License info for regulatory audits |
| **Emergency Response**: Contact info for emergencies |

---

## 6. System Settings

### 6.1 Purpose
Configure technical system parameters, security settings, and backup procedures.

### 6.2 System Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Maintenance Mode | Enable/disable system | Off |
| Auto Backup | Automatic backups | On |
| Session Timeout | Auto-logout time | 30 minutes |
| Max Login Attempts | Failed attempts before lockout | 5 |
| Password Expiry | Days until password reset | 90 days |
| Data Retention | Record retention period | 365 days |

### 6.3 Notification Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Email Notifications | Enable email alerts | On |
| SMS Notifications | Enable SMS alerts | On |
| System Alerts | System-wide alerts | On |
| Appointment Reminders | Patient reminders | On |
| Emergency Alerts | Critical notifications | On |
| Maintenance Notifications | System updates | Off |

### 6.4 Security Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Two-Factor Auth | 2FA requirement | Off |
| IP Whitelist | Allowed IP addresses | (none) |
| Encryption Level | Data encryption | AES-256 |
| Audit Logging | Track all actions | On |
| Password Complexity | Strength requirement | High |

### 6.5 Backup Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Auto Backup Enabled | Automatic backups | On |
| Backup Frequency | How often | Daily |
| Retention Period | How long to keep | 30 days |
| Backup Location | Storage location | Internal Storage |

### 6.6 Manual Actions

**Manual Backup**
1. Click "Manual Backup"
2. Backup initiated immediately
3. Status shown on completion

**System Restart**
1. Click "Schedule Restart"
2. Confirm restart time
3. Users notified automatically

### 6.7 Importance for Real Data

| Why System Settings Matter |
|---------------------------|
| **Data Protection**: Backup ensures no data loss |
| **Security**: Prevents unauthorized access |
| **Compliance**: Audit logging for regulations |
| **Performance**: Optimal system operation |
| **Recovery**: Quick restoration if needed |

---

## 7. OPD Service Management

### 7.1 Purpose
Oversee outpatient department operations, doctor schedules, and appointment management.

### 7.2 Features Available

| Feature | Description |
|---------|-------------|
| Doctor List | View all registered doctors |
| Schedule Management | View/manage all schedules |
| Time Slots | View generated slots |
| Appointments | View all appointments |
| Locations | Manage 10 Pune hospital locations |
| Reports | OPD utilization reports |

### 7.3 Managing Doctor Schedules

**View All Schedules**
1. Navigate to OPD Service
2. View schedules by doctor or day
3. Filter by location or slot type

**Modify Schedules**
1. Select doctor
2. Edit schedule slots
3. Save changes

### 7.4 Appointment Oversight

**View All Appointments**
- See appointments across all doctors
- Filter by date, status, doctor
- Export appointment lists

**Cancel Appointments**
1. Select appointment
2. Click "Cancel"
3. Patient receives notification

### 7.5 Location Management

Manage 10 Pune hospital locations:
- Main Building - OPD
- Emergency Block
- Specialty Wing
- Diagnostic Center
- Day Care Center
- Rehabilitation Unit
- Pediatric Block
- Maternity Wing
- Research Center
- Administrative Block

### 7.6 Importance for Real Data

| Why OPD Data Matters |
|---------------------|
| **Scheduling Accuracy**: Prevents double-booking |
| **Patient Care**: Ensures timely consultations |
| **Resource Planning**: AI uses data for predictions |
| **Wait Time Analysis**: Improves patient satisfaction |
| **Staff Allocation**: Optimizes doctor utilization |

---

## 8. Patient Service Management

### 8.1 Purpose
Manage patient demographics, admissions, medical records, and nurse assignments.

### 8.2 Features Available

| Tab | Functions |
|-----|-----------|
| Patients | View all patients, demographics |
| Admissions | Active admissions, room allocation |
| Medical Records | All patient records |
| Documents | Uploaded files and reports |

### 8.3 Managing Patients

**View All Patients**
1. Navigate to Patient Service
2. See all registered patients
3. Search by name, ID, or phone

**Add New Patient**
1. Click "Add Patient"
2. Fill demographics
3. Assign to nurse if needed
4. Save patient

**Edit Patient**
1. Select patient
2. Click Edit
3. Update information
4. Save changes

### 8.4 Managing Admissions

**View Admissions**
- Active admissions listed
- Room assignments shown
- Admitting physician displayed

**New Admission**
1. Select patient
2. Click "Admit"
3. Fill admission details:
   - Department
   - Room number
   - Admitting physician
   - Primary diagnosis
4. Save admission

**Discharge Patient**
1. Select admission
2. Click "Discharge"
3. Complete discharge summary
4. Confirm discharge

### 8.5 Nurse Assignment

**Assign Nurse to Patient**
1. Select patient
2. Click "Assign Nurse"
3. Select nurse from list
4. Confirm assignment

**Reassign Nurse**
1. View current assignment
2. Click "Reassign"
3. Select new nurse
4. Confirm change

### 8.6 Importance for Real Data

| Why Patient Data Matters |
|-------------------------|
| **Clinical Safety**: Treatment depends on accurate info |
| **Insurance Claims**: Requires correct patient details |
| **Legal Compliance**: Medical records are legal documents |
| **AI Predictions**: Patient patterns analyzed |
| **Continuity of Care**: History informs treatment |

---

## 9. Patient Tracking

### 9.1 Purpose
Track admitted patients through their hospital journey from admission to discharge.

### 9.2 Features Available

| Tab | Function |
|-----|----------|
| All Patients | View all tracked patients |
| Admit Patient | New admissions |
| Doctor Visit | Schedule doctor rounds |
| Billing | Generate and manage bills |

### 9.3 Patient Tracking Workflow

```
Admission → Room Assignment → Doctor Visits → Treatment → Billing → Discharge
```

### 9.4 Managing Doctor Visits

**Schedule Visit**
1. Select patient
2. Click "Schedule Visit"
3. Select doctor
4. Set date and time
5. Save visit

**Complete Visit**
1. Select scheduled visit
2. Click "Complete"
3. Add visit notes
4. Save

### 9.5 Billing Management

**Generate Bill**
1. Select patient
2. Click "Generate Bill"
3. Review charges:
   - Room charges (per day)
   - Doctor consultation
   - Lab tests
   - Medicines
   - Procedures
   - Other fees
4. Generate total

**Process Payment**
1. Open bill
2. Click "Add Payment"
3. Enter payment details:
   - Amount
   - Method (Cash, Card, UPI, Insurance)
   - Transaction ID
4. Record payment

**Bill Status**
| Status | Description |
|--------|-------------|
| Pending | Bill generated, no payment |
| Partial | Some payment received |
| Paid | Fully paid |
| Cancelled | Bill cancelled |

### 9.6 Importance for Real Data

| Why Tracking Data Matters |
|--------------------------|
| **Revenue Accuracy**: Billing depends on real data |
| **Length of Stay**: AI analyzes admission patterns |
| **Resource Utilization**: Room and bed occupancy |
| **Discharge Planning**: Timely discharge process |
| **Audit Compliance**: Financial records accuracy |

---

## 10. Inventory Service

### 10.1 Purpose
Manage hospital inventory including medical supplies, medicines, and equipment consumables.

### 10.2 Features Available

| Tab | Function |
|-----|----------|
| Dashboard | Stock overview, alerts |
| Items | All inventory items |
| Transactions | Issue/Return/Dispose history |
| Issue | Issue items to staff/patients |
| Reports | Usage and stock reports |

### 10.3 Inventory Categories

| Category | Examples |
|----------|----------|
| Disposables | Gloves, masks, gowns |
| Syringes | Various sizes |
| Gloves | Sterile, non-sterile |
| Medicines | Drugs, injections |
| Equipment | Medical devices |

### 10.4 Managing Items

**Add New Item**
1. Click "Add Item"
2. Fill details:
   | Field | Description |
   |-------|-------------|
   | Name | Item name |
   | Category | Select category |
   | Current Stock | Initial quantity |
   | Low Stock Threshold | Alert level |
   | Unit | pcs, box, pack |
   | Cost | Unit cost |
   | Supplier | Vendor name |
3. Save item

**Edit Item**
1. Select item
2. Click Edit
3. Update details
4. Save changes

**Delete Item**
1. Select item (no transactions)
2. Click Delete
3. Confirm deletion

### 10.5 Transactions

**Issue Items**
1. Go to Issue tab
2. Select item
3. Enter quantity
4. Select staff member
5. Optionally select patient
6. Add notes
7. Submit transaction

**Return Items**
1. Go to Transactions tab
2. Click "Return"
3. Select original transaction
4. Enter return quantity
5. Add notes
6. Submit return

**Dispose Items**
1. Go to Transactions tab
2. Click "Dispose"
3. Select item
4. Enter quantity
5. Add reason
6. Submit disposal

### 10.6 Low Stock Alerts

**View Alerts**
- Dashboard shows low stock items
- Items below threshold highlighted

**Respond to Alerts**
1. Review low stock list
2. Place reorder
3. Update stock when received

### 10.7 Importance for Real Data

| Why Inventory Data Matters |
|---------------------------|
| **Supply Chain**: Accurate stock prevents shortages |
| **Cost Control**: Usage tracking reduces waste |
| **Patient Care**: Essential supplies always available |
| **AI Forecasting**: Predicts future needs |
| **Audit Trail**: Every transaction logged |

---

## 11. Equipment Servicing

### 11.1 Purpose
Manage hospital equipment maintenance schedules, service history, and emergency contacts.

### 11.2 Features Available

| Tab | Function |
|-----|----------|
| Equipment | All equipment list |
| Service History | Past maintenance records |
| Emergency Contacts | Service provider contacts |

### 11.3 Equipment Status

| Status | Description | Color |
|--------|-------------|-------|
| Up-to-date | Recently serviced | Green |
| Due Soon | Service upcoming | Yellow |
| Overdue | Past due date | Red |

### 11.4 Managing Equipment

**Add Equipment**
1. Click "Add Equipment"
2. Fill details:
   | Field | Description |
   |-------|-------------|
   | Name | Equipment name |
   | Model | Model number |
   | Serial Number | Unique identifier |
   | Location | Department/Room |
   | Service Frequency | Monthly/Quarterly/Yearly |
   | Company Name | Manufacturer/Service provider |
   | Contact Number | Service contact |
   | Emergency Number | 24/7 support |
3. Save equipment

**Edit Equipment**
1. Select equipment
2. Click Edit
3. Update details
4. Save changes

### 11.5 Service History

**Log Service**
1. Select equipment
2. Click "Log Service"
3. Fill details:
   - Service date
   - Technician name
   - Description
   - Cost
4. Save service record

**View History**
1. Select equipment
2. Click "View History"
3. See all past services

### 11.6 Emergency Contacts

| Service Type | Purpose |
|--------------|---------|
| Medical Help | Emergency medical assistance |
| Fire Service | Fire emergencies |
| Police | Security emergencies |
| Plumber | Water/Plumbing issues |
| Electrician | Electrical emergencies |
| Lift Service | Elevator issues |
| IT Support | Technical issues |

**Add Contact**
1. Click "Add Contact"
2. Fill details:
   - Name
   - Service type
   - Phone number
   - Primary contact (Yes/No)
3. Save contact

### 11.7 Importance for Real Data

| Why Equipment Data Matters |
|---------------------------|
| **Patient Safety**: Well-maintained equipment ensures safety |
| **Regulatory Compliance**: Service records for audits |
| **Cost Planning**: Maintenance budget forecasting |
| **Downtime Prevention**: Proactive scheduling |
| **AI Analysis**: Equipment efficiency tracking |

---

## 12. Oxygen Tracking System

### 12.1 Purpose
NABH-compliant management of medical oxygen cylinders and LMO (Liquid Medical Oxygen) tanks.

### 12.2 Features Available

| Tab | Function |
|-----|----------|
| Stock | Cylinder inventory |
| Movements | Issue/Return tracking |
| Consumption | Patient usage records |
| LMO | Tank readings |
| Alerts | Low stock and test alerts |

### 12.3 Cylinder Types

| Type | Capacity | Use |
|------|----------|-----|
| B-type | Small | Portable |
| D-type | Medium | Ward use |
| Jumbo | Large | ICU/Emergency |

### 12.4 Cylinder Status

| Status | Description |
|--------|-------------|
| Full | Ready for use |
| In Use | Currently deployed |
| Empty | Needs refilling |
| For Refilling | Sent for refill |
| For Testing | Hydrostatic test due |

### 12.5 Managing Cylinders

**Add Cylinder**
1. Click "Add Cylinder"
2. Fill details:
   - Cylinder code (unique barcode)
   - Type (B-type, D-type, Jumbo)
   - Capacity (liters)
   - Filled pressure (psi)
   - Vendor
   - Purity certificate date
   - Last hydrostatic test date
3. Save cylinder

**Issue Cylinder**
1. Click "Issue Cylinder"
2. Select cylinder
3. Select department
4. Record pressure
5. Enter receiver name
6. Submit issue

**Return Cylinder**
1. Click "Return Cylinder"
2. Select issued cylinder
3. Record return pressure
4. Add notes
5. Submit return

### 12.6 LMO Tank Readings

**Record Daily Reading**
1. Go to LMO tab
2. Click "Add Reading"
3. Enter:
   - Tank ID
   - Level percentage
   - Volume (liters)
   - Pressure
   - Temperature
   - Recorded by
4. Save reading

### 12.7 Alerts

| Alert Type | Trigger |
|------------|---------|
| Low Stock | Below minimum cylinders |
| Over Consumption | Unusual usage spike |
| Test Due | Hydrostatic test approaching |
| Refill Needed | Empty cylinders count |

### 12.8 Importance for Real Data

| Why Oxygen Data Matters |
|------------------------|
| **Life-Critical**: Oxygen shortages can be fatal |
| **Compliance**: NABH requires accurate tracking |
| **Consumption Analysis**: AI predicts demand |
| **Vendor Management**: Accurate refill orders |
| **Emergency Preparedness**: Know available supply |

---

## 13. Biomedical Waste Management

### 13.1 Purpose
CPCB-compliant tracking of biomedical waste from generation to final disposal.

### 13.2 Features Available

| Tab | Function |
|-----|----------|
| Overview | Dashboard and statistics |
| Bags | Waste bag management |
| Pickups | Vendor pickup scheduling |
| Storage | Storage room monitoring |
| Incidents | Incident reporting |
| Reports | Compliance reports |

### 13.3 BMW Categories

| Category | Color | Description |
|----------|-------|-------------|
| YELLOW | Yellow | Anatomical, pathological, infectious waste |
| RED | Red | Contaminated recyclable waste (tubing, catheters) |
| WHITE | White | Sharps (needles, blades, scalpels) |
| BLUE | Blue | Glassware, metallic implants |

### 13.4 Bag Generation

**Generate Bag Barcode**
1. Click "Generate Bag"
2. Select category
3. Select department
4. Enter approximate weight
5. Add notes
6. Generate barcode
7. Print and attach to bag

### 13.5 Bag Workflow

```
GENERATED → COLLECTED → STORED → PICKED_UP → DISPOSED
```

### 13.6 Managing Pickups

**Schedule Pickup**
1. Go to Pickups tab
2. Click "Schedule Pickup"
3. Fill details:
   - Select vendor
   - Pickup date
   - Pickup time
   - Vehicle number
   - Driver name
4. Save pickup

**Complete Pickup**
1. When vendor arrives
2. Scan all bags
3. Record handover signature
4. Mark as complete

### 13.7 Storage Rooms

**Monitor Storage**
- View current occupancy
- Check temperature
- See last cleaning date

**Add Storage Room**
1. Click "Add Room"
2. Enter:
   - Room name
   - Location
   - Capacity (bags)
3. Save room

### 13.8 Incident Reporting

| Incident Type | Description |
|---------------|-------------|
| Needle Stick | Needle injury to staff |
| Spill | Waste spillage |
| Exposure | Contamination exposure |
| Other | Other incidents |

**Report Incident**
1. Go to Incidents tab
2. Click "Report Incident"
3. Fill details:
   - Type
   - Severity
   - Location
   - Description
   - Action taken
4. Submit report

### 13.9 Reports

| Report Type | Frequency |
|-------------|-----------|
| Daily | Daily summary |
| Weekly | Week-end report |
| Monthly | Monthly compliance |
| Annual | Yearly audit report |
| MPCB | Regulatory submission |

### 13.10 Importance for Real Data

| Why BMW Data Matters |
|---------------------|
| **Legal Compliance**: CPCB regulations require accurate records |
| **Public Safety**: Proper disposal protects environment |
| **Staff Safety**: Incident tracking prevents injuries |
| **Audit Ready**: Complete trail for inspections |
| **AI Analysis**: Waste pattern analysis for optimization |

---

## 14. Swab Contamination Monitoring

### 14.1 Purpose
NABH-compliant environmental surveillance of OT and ICU areas for contamination.

### 14.2 Features Available

| Tab | Function |
|-----|----------|
| Dashboard | Overview and statistics |
| Collection | Swab collection records |
| Lab Results | Test results |
| CAPA | Corrective actions |
| Reports | Compliance reports |
| Masters | Area, site, organism masters |

### 14.3 Interpretation Logic

| Condition | Result |
|-----------|--------|
| No Growth / None category | PASS |
| Flora + Low growth | ACCEPTABLE |
| Pathogen OR Moderate/Heavy growth | FAIL |

### 14.4 Collection Process

**Record Swab Collection**
1. Go to Collection tab
2. Click "New Collection"
3. Fill details:
   - Collection date
   - Area type (OT/ICU)
   - Specific area
   - Sampling site
   - Reason (Routine/Post-fumigation/Outbreak)
   - Collected by
4. Generate swab ID
5. Save collection

### 14.5 Lab Results

**Enter Lab Results**
1. Go to Lab Results tab
2. Find pending swab
3. Click "Enter Result"
4. Fill details:
   - Organism found
   - Growth level (None/Low/Moderate/Heavy)
   - Tested by
   - Verified by
5. Auto-interpretation calculated
6. Save result

### 14.6 CAPA Management

**Auto-Generated CAPA**
- FAIL results automatically trigger CAPA
- 7-day closure target

**CAPA Workflow**
1. View open CAPAs
2. Assign responsible person
3. Define action
4. Set target date
5. Track progress
6. Close with effectiveness check

### 14.7 Master Data

**Areas**
- 6 OT/ICU areas defined
- Block, floor, area type, equipment

**Sampling Sites**
- 10 sampling sites
- Work surface, equipment, environment

**Organisms**
- 12 organisms tracked
- Category: Pathogen, Flora, None
- Risk level: Low to Critical

### 14.8 Importance for Real Data

| Why Swab Data Matters |
|----------------------|
| **Infection Control**: Prevents hospital-acquired infections |
| **NABH Compliance**: Required for accreditation |
| **Patient Safety**: Clean environment protects patients |
| **Staff Safety**: Identifies contamination risks |
| **AI Analysis**: Pattern detection for outbreaks |

---

## 15. Consent Forms Management

### 15.1 Purpose
Manage trilingual consent form templates for various procedures and treatments.

### 15.2 Available Templates (13)

| Category | Forms |
|----------|-------|
| Legal & Administrative | Medico-Legal Register, DAMA/LAMA, Digital Consent Form |
| Surgical & Procedural | OT Register, Anaesthesia, Surgery, Tubal Ligation, Plastic Surgery |
| Diagnostic & Testing | HIV Test, HBsAg Test, Injection Consent (OPD) |
| Treatment | Blood Transfusion |
| Maternal & Neonatal | Newborn Baby Consent |

### 15.3 Languages

All templates available in:
- English
- Hindi (हिंदी)
- Marathi (मराठी)

### 15.4 Using Consent Forms

**Browse Templates**
1. Navigate to Consents
2. Filter by category
3. Search by name

**View Template**
1. Click on form card
2. Preview opens in new tab

**Download Template**
1. Click Download icon
2. PDF downloads to device

**Print Template**
1. Click Print icon
2. Print dialog opens
3. Print for patient signature

### 15.5 Importance for Real Data

| Why Consent Data Matters |
|-------------------------|
| **Legal Protection**: Documented patient consent |
| **Informed Consent**: Patient understands procedure |
| **Regulatory Compliance**: Required by law |
| **Audit Trail**: Record of all consents |
| **Risk Management**: Reduces legal liability |

---

## 16. Patient Monitoring

### 16.1 Purpose
Oversee NABH-compliant ICU charts and nursing workflows across all critical care patients.

### 16.2 Admin Access Level

As admin, you can:
- View all monitoring sessions
- Review all patient data
- Access all 14 sub-modules
- Generate monitoring reports
- View audit trails

### 16.3 Monitoring Sub-modules

| Module | Data Tracked |
|--------|-------------|
| Vitals Hourly | HR, BP, SpO2, Temp (24 slots) |
| Inotropes & Sedation | Drug infusions, RASS/GCS |
| Ventilator | Mode, FiO2, Tidal Volume, PEEP |
| ABG & Labs | Blood gases, cultures |
| Intake Chart | IV, oral, NG tube (hourly) |
| Output Chart | Urine, drains, vomitus |
| Diabetic Flow | BSL, insulin, electrolytes |
| MAR | Medication administration |
| Once-Only Drugs | PRN medications |
| Nursing Notes | Shift observations |
| Devices | Airways, lines, tubes |
| Skin Care | Pressure ulcer prevention |
| Fall Risk | Morse Fall Scale |

### 16.4 Admin Oversight

**Review Sessions**
1. View all active sessions
2. Filter by ward, date, nurse
3. Audit any session

**Quality Checks**
- Verify data completeness
- Check signature compliance
- Review critical alerts

### 16.5 Importance for Real Data

| Why Monitoring Data Matters |
|----------------------------|
| **Patient Safety**: Critical care decisions depend on data |
| **NABH Compliance**: Required documentation |
| **Shift Handover**: Continuity of care |
| **AI Alerts**: Deterioration detection |
| **Legal Records**: Medico-legal protection |

---

## 17. Disease Knowledge Module

### 17.1 Purpose
Manage AI-powered disease information, diet plans, and medication scheduling for patient education.

### 17.2 Admin Capabilities

- View all disease entries
- Add new diseases
- Edit disease information
- Manage diet templates
- Configure medication schedules
- Review AI-generated plans

### 17.3 Managing Diseases

**Add New Disease**
1. Click "Add Disease"
2. Fill comprehensive details:
   - Disease name
   - Alternate names
   - Category
   - Affected system
   - Description
   - Causes
   - Risk factors
   - Symptoms
   - Emergency signs
   - Clinical parameters
   - Do's and Don'ts
   - Activity recommendations
3. Save disease

**Add Diet Template**
1. Select disease
2. Click "Add Diet Plan"
3. Enter meal plans (Indian context)
4. Define restrictions
5. Save template

### 17.4 Importance for Real Data

| Why Disease Knowledge Matters |
|-----------------------------|
| **Evidence-Based Care**: Accurate medical information |
| **Patient Education**: Improves compliance |
| **AI Personalization**: Uses data for recommendations |
| **Outcome Improvement**: Better disease management |

---

## 18. AI Analytics Dashboard

### 18.1 Purpose
Hospital-wide AI-powered analytics and predictions for operational excellence.

### 18.2 Analytics Engines

| Engine | Metrics |
|--------|---------|
| Doctor Efficiency | Consultation time, patients/day, prescription quality |
| Nurse Efficiency | Patients assigned, response time, documentation |
| OPD Intelligence | Wait time, throughput, no-show rate |
| Hospital Health | Overall health index (0-100) |
| Compliance Risk | Regulatory compliance scores |
| Predictive | ICU load, oxygen demand forecasting |

### 18.3 Hospital Health Index

**Score Interpretation**
| Score | Status |
|-------|--------|
| 80-100 | Excellent |
| 60-79 | Good |
| 40-59 | Needs Improvement |
| 0-39 | Critical |

**Components**
- Doctor efficiency score
- Nurse efficiency score
- OPD performance score
- Compliance score
- Resource utilization
- Patient satisfaction
- Cost efficiency

### 18.4 Predictions

**Available Predictions**
- Tomorrow's OPD load
- ICU bed demand
- Oxygen consumption
- Staff requirements

### 18.5 Recommendations

AI generates actionable recommendations:
- Efficiency improvements
- Compliance fixes
- Resource optimization
- Cost savings opportunities

### 18.6 Importance for Real Data

| Why AI Analytics Matter |
|------------------------|
| **Data-Driven Decisions**: Insights from real operations |
| **Proactive Management**: Predict issues before they occur |
| **Resource Optimization**: Reduce waste, improve efficiency |
| **Compliance Monitoring**: Continuous risk assessment |
| **Performance Tracking**: Objective staff metrics |

---

## 19. Patient Analytics

### 19.1 Purpose
Comprehensive patient data analytics and population health insights.

### 19.2 Available Analytics

| Category | Metrics |
|----------|---------|
| Demographics | Age distribution, gender ratio |
| Admissions | Trends, length of stay |
| Diagnoses | Common conditions |
| Outcomes | Recovery rates, readmissions |
| Satisfaction | Patient feedback |

### 19.3 Reports

Generate reports for:
- Patient flow analysis
- Disease prevalence
- Treatment outcomes
- Resource utilization

---

## 20. Notification Service

### 20.1 Purpose
Create and manage hospital-wide notifications across all channels.

### 20.2 Notification Types

| Type | Audience |
|------|----------|
| Health Tips | All patients |
| Hospital Updates | All staff |
| Emergency | Specific departments |
| Appointment Reminders | Patients with bookings |
| System Alerts | Administrators |

### 20.3 Channels

| Channel | Description |
|---------|-------------|
| Push | In-app notifications |
| Email | Email delivery |
| SMS | Text messages |
| WhatsApp | WhatsApp messages |

### 20.4 Priority Levels

| Priority | Use |
|----------|-----|
| Critical | Emergencies, system failures |
| High | Important updates |
| Medium | General notifications |
| Low | Informational |

### 20.5 Creating Notifications

**Step 1: Click "Create Notification"**

**Step 2: Fill Details**
- Title
- Message content
- Category
- Priority
- Channels to use
- Target audience
- Schedule (optional)

**Step 3: Send or Schedule**
- Send immediately OR
- Schedule for later

### 20.6 Importance for Real Data

| Why Notification Data Matters |
|-----------------------------|
| **Timely Communication**: Critical alerts reach staff |
| **Patient Engagement**: Reminders reduce no-shows |
| **Compliance**: Required notifications documented |
| **AI Analysis**: Communication patterns analyzed |

---

## 21. Chatbot Service

### 21.1 Purpose
AI-powered chatbot for hospital information and query resolution.

### 21.2 Admin Capabilities

- View all conversation logs
- Review query patterns
- Improve responses
- Monitor accuracy

### 21.3 Conversation Logs

View:
- User queries
- Bot responses
- Categories
- Timestamps

### 21.4 Importance for Real Data

| Why Chatbot Data Matters |
|-------------------------|
| **Service Improvement**: Identify common queries |
| **AI Training**: Improve response accuracy |
| **Patient Insights**: Understand patient needs |

---

## 22. Biometric Service

### 22.1 Purpose
Patient identity verification using fingerprint and facial recognition.

### 22.2 Admin Capabilities

- View all biometric templates
- Review verification logs
- Monitor accuracy
- Manage devices

### 22.3 Security Features

- AES-256 encryption
- Confidence scoring
- Audit logging
- HIPAA compliance

---

## 23. Real Data Importance

### 23.1 Why HMS Core Requires Real Data

HMS Core explicitly prohibits mock or dummy data because:

**Clinical Safety**
- Treatment decisions based on real patient data
- Wrong data can lead to fatal errors
- Emergency response depends on accurate information

**Regulatory Compliance**
- NABH accreditation requires accurate records
- Legal requirements for medical documentation
- Audit trails must reflect reality

**AI System Accuracy**
- All AI models trained on real patterns
- Mock data skews predictions and recommendations
- Hospital health index becomes meaningless with fake data

**Financial Integrity**
- Billing accuracy depends on real transactions
- Insurance claims require accurate patient data
- Inventory costs tracked in real-time

**Operational Excellence**
- Scheduling optimization needs real patterns
- Resource planning based on actual usage
- Staff efficiency metrics require real activities

### 23.2 Data Quality Responsibilities

As Admin, ensure:
- All user accounts have correct information
- Hospital settings reflect actual operations
- Staff enter data in real-time
- Regular data audits are performed
- Outdated information is updated
- Duplicates are merged

### 23.3 Data Entry Standards

| Standard | Description |
|----------|-------------|
| Timeliness | Enter data immediately |
| Accuracy | Verify before saving |
| Completeness | Fill all required fields |
| Consistency | Use standard formats |
| Verification | Double-check critical data |

---

## 24. AI Analysis Features

### 24.1 How AI Uses Admin-Managed Data

**User Management Data**
- Staff efficiency calculations
- Role-based performance metrics
- Workload distribution analysis

**Hospital Settings Data**
- Capacity utilization calculations
- Operating hours optimization
- Resource planning

**System Settings Data**
- Security compliance monitoring
- Backup success tracking
- System health assessment

**Operational Data**
- All inventory, equipment, oxygen, BMW data
- Used for compliance scoring
- Resource forecasting

### 24.2 AI-Generated Insights for Admins

| Insight Type | Value |
|--------------|-------|
| Efficiency Gaps | Identify underperforming areas |
| Compliance Risks | Flag potential violations |
| Cost Savings | Recommend optimizations |
| Demand Predictions | Forecast resource needs |
| Anomaly Detection | Unusual patterns alert |

### 24.3 Maximizing AI Value

| Action | AI Benefit |
|--------|------------|
| Complete user profiles | Better staff analytics |
| Accurate hospital settings | Correct capacity metrics |
| Real-time data entry | Timely predictions |
| Regular audits | Clean data for AI |
| Monitor recommendations | Continuous improvement |

---

## 25. Best Practices

### 25.1 Daily Admin Routine

| Time | Action |
|------|--------|
| Start of Day | Check system alerts, review overnight activity |
| Morning | Review AI analytics, address critical items |
| Midday | Monitor operations, respond to requests |
| Afternoon | Process admin tasks, user management |
| End of Day | Verify backups, review compliance, log out |

### 25.2 Weekly Tasks

| Task | Purpose |
|------|---------|
| User audit | Verify all accounts active/accurate |
| Inventory review | Check stock levels |
| Equipment check | Review service schedules |
| Report generation | Compliance documentation |
| AI review | Analyze recommendations |

### 25.3 Monthly Tasks

| Task | Purpose |
|------|---------|
| Security audit | Review access logs |
| Backup verification | Test backup restoration |
| Performance review | Analyze system metrics |
| Compliance check | Verify regulatory requirements |
| Staff training | Address knowledge gaps |

### 25.4 Security Best Practices

- Use unique, strong passwords
- Enable two-factor authentication
- Review access logs regularly
- Remove inactive users promptly
- Keep system updated
- Monitor unusual activity

---

## 26. Troubleshooting

### 26.1 Common Issues

| Issue | Solution |
|-------|----------|
| User cannot login | Verify credentials, check account status |
| Slow performance | Check system load, clear cache |
| Data not saving | Check internet connection, retry |
| Reports not generating | Verify data availability, try again |
| Notifications not sending | Check channel configuration |
| Backup failed | Check storage space, retry manually |

### 26.2 Escalation Path

| Level | Contact |
|-------|---------|
| Level 1 | Internal IT Support |
| Level 2 | System Administrator |
| Level 3 | Vendor Support |
| Emergency | On-call IT Manager |

### 26.3 Emergency Procedures

**System Down**
1. Check network connectivity
2. Verify server status
3. Contact IT support
4. Activate backup procedures
5. Notify affected departments

**Data Breach**
1. Isolate affected systems
2. Document incident
3. Notify IT Security
4. Follow breach protocol
5. Report to management

### 26.4 Support Contacts

| Issue Type | Contact |
|------------|---------|
| Technical | IT Helpdesk |
| System Errors | System Administrator |
| Training | HR Department |
| Policy | Hospital Administrator |

---

## Appendix A: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl + S | Save current form |
| Ctrl + N | New item |
| Ctrl + F | Find/Search |
| Esc | Close dialog |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| NABH | National Accreditation Board for Hospitals |
| CPCB | Central Pollution Control Board |
| BMW | Biomedical Waste Management |
| LMO | Liquid Medical Oxygen |
| CAPA | Corrective and Preventive Action |
| OPD | Out-Patient Department |
| ICU | Intensive Care Unit |
| OT | Operation Theater |
| MAR | Medication Administration Record |
| RBAC | Role-Based Access Control |

---

## Recent Updates (January 2026)

### New Role: TECHNICIAN

A ninth role has been added to the system:

| Role | Description | Access |
|------|-------------|--------|
| TECHNICIAN | Diagnostic technicians | Patient Monitoring tests only |

**Technician Workflow Isolation:**
- Technicians receive tests ONLY from Patient Monitoring module
- Tests ordered via Prescription Management route to Medical Store
- Reduces notification noise and focuses technician attention

### Dashboard Statistics Updates

Dashboard stat cards now reflect accurate real-time data:

| Card | Data Source |
|------|-------------|
| Active Patients | `tracking_patients` table (actual hospital patients) |
| Critical Alerts | `/api/critical-alerts` endpoint |
| Pending Tests | Patient Monitoring source tests only |

### OPD Scheduling Enhancements

**Schedule-Based Availability:**
- Doctor cards show real-time slot availability based on schedule configuration
- Non-working days display informative message with scheduled working days
- Doctor identity mapping via `doctorTableId` for reliable schedule matching

### Smart OPD Flow Engine

24 department-specific consultation workflows now available:
- Symptom-driven forms with auto-observations
- Intelligent test and referral suggestions
- Department-specific clinical workflows

**Departments covered:** Cardiothoracic Surgery, Cardiovascular Surgery, Cathlab, Vascular Surgery, ENT, General Surgery, ICU & Casualty, Neuro Surgery, OBGY, Oncology, Orthopedic Surgery, Pediatrics (3 subspecialties), Pain Management, Plastic Surgery, Uro Surgery, Pathology, Radiology, Rehabilitation, Gastroenterology

### ICU Patient Monitoring

27 monitoring data tables for comprehensive critical care:
- NABH-compliant 24-hour data collection
- Shift-based logging (Morning/Evening/Night)
- Critical value alerts with auto-escalation
- Integration with Technician Portal for diagnostic tests

---

## Document Control

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.1 | January 2026 | Added Technician Portal, Dashboard updates, OPD scheduling enhancements, Smart OPD Flow | HMS Core Team |
| 1.0 | December 2024 | Initial release | HMS Core Team |

---

*This SOP is part of the HMS Core Hospital Management System documentation.*
*For updates, refer to the latest version in the docs folder.*
