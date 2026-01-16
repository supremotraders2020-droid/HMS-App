# Doctor Standard Operating Procedure (SOP)
## HMS Core - Hospital Management System

**Version**: 1.1  
**Effective Date**: January 2026  
**Applicable To**: All Doctors at Gravity Hospital  
**Document Type**: User Manual & SOP  
**Last Updated**: January 9, 2026

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Login Process](#2-login-process)
3. [Daily Oath Confirmation](#3-daily-oath-confirmation)
4. [Doctor Dashboard Overview](#4-doctor-dashboard-overview)
5. [Schedule Management](#5-schedule-management)
6. [Appointment Management](#6-appointment-management)
7. [Patient Management](#7-patient-management)
8. [Prescription Management](#8-prescription-management)
9. [Patient Monitoring](#9-patient-monitoring)
10. [Disease Knowledge Module](#10-disease-knowledge-module)
11. [Notifications](#11-notifications)
12. [Chatbot Assistant](#12-chatbot-assistant)
13. [OPD Service Access](#13-opd-service-access)
14. [Patient Service Access](#14-patient-service-access)
15. [Biometric Service](#15-biometric-service)
16. [Real Data Importance](#16-real-data-importance)
17. [AI Analysis Features](#17-ai-analysis-features)
18. [Best Practices](#18-best-practices)
19. [Troubleshooting](#19-troubleshooting)

---

## 1. Introduction

### 1.1 Purpose
This Standard Operating Procedure provides step-by-step guidance for doctors using the HMS Core Hospital Management System. It covers all features available to doctors, from login to patient care management.

### 1.2 Scope
This SOP applies to all medical practitioners with the DOCTOR role in HMS Core, including:
- Consultants
- Specialists
- Resident Doctors
- Visiting Doctors

### 1.3 Doctor Role Capabilities

| Feature | Access Level |
|---------|-------------|
| Dashboard | Full Access |
| Schedule Management | Full Access (Own schedules) |
| Appointment Management | Full Access |
| Patient Management | Full Access |
| Prescription Creation | Full Access (Create, Sign, Finalize) |
| Patient Monitoring | Full Access (View & Create) |
| Disease Knowledge | Full Access |
| Notifications | Full Access (Own notifications) |
| Chatbot | Full Access |
| OPD Service | View & Manage |
| Patient Service | View & Manage |
| Biometric Service | View Access |

---

## 2. Login Process

### 2.1 Step-by-Step Login

**Step 1: Access the Application**
- Open your web browser (Chrome, Firefox, Edge recommended)
- Navigate to the HMS Core URL provided by IT department
- The login page will display

**Step 2: Enter Credentials**
- Enter your assigned username (format: `dr.firstname.lastname`)
- Enter your password
- Click the "Login" button

**Step 3: Authentication**
- The system validates your credentials
- If successful, you will be redirected to the Doctor Portal
- If unsuccessful, check your credentials and try again

### 2.2 Default Doctor Credentials (For Testing)
| Username | Password |
|----------|----------|
| dr.anil.kulkarni | Doctor@123 |

### 2.3 Security Guidelines
- Never share your login credentials
- Change your password regularly
- Log out when leaving the workstation
- Report any suspicious activity to IT

---

## 3. Daily Oath Confirmation

### 3.1 Purpose
The NMC (National Medical Commission) Physician's Pledge is a daily ethical commitment that doctors must accept before accessing patient care features.

### 3.2 Process

**Step 1: Oath Modal Appears**
- Upon login, a modal dialog appears with the NMC Physician's Pledge
- The oath text is displayed in full

**Step 2: Read and Accept**
- Carefully read the pledge text
- Click "I Accept the Oath" button

**Step 3: Confirmation**
- The system records your oath acceptance with timestamp
- You now have full access to all doctor features
- The oath is valid for 24 hours (until midnight)

### 3.3 Importance
- **Legal Compliance**: Required by NMC regulations
- **Ethical Practice**: Reaffirms commitment to patient care
- **Audit Trail**: Creates a daily log of ethical commitment
- **Professional Standards**: Maintains medical practice integrity

### 3.4 What Happens Without Oath Acceptance
- Limited access to non-clinical features only
- Cannot view patient records
- Cannot create prescriptions
- Cannot access appointments

---

## 4. Doctor Dashboard Overview

### 4.1 Dashboard Components

The Doctor Portal dashboard provides an at-a-glance view of your daily activities:

**Welcome Section**
- Personalized greeting with your name
- Current date and time
- Hospital name display

**Statistics Cards**
| Card | Information |
|------|-------------|
| Today's Appointments | Number of scheduled appointments |
| Total Patients | Your registered patient count |
| Pending Prescriptions | Prescriptions awaiting action |
| Notifications | Unread notification count |

**Quick Actions**
- View Today's Appointments
- Create New Prescription
- Manage Schedule
- View All Patients

**Today's Appointments Card**
- Shows first 4 appointments of the day
- Patient name, symptoms, time slot
- Status badge (Scheduled, Completed, Cancelled)
- Click to view full details

**Recent Notifications Card**
- Latest system notifications
- Appointment reminders
- Patient updates
- System alerts

### 4.2 Navigation Sidebar

The sidebar provides access to all doctor features:

| Menu Item | Function |
|-----------|----------|
| Dashboard | Return to main dashboard |
| Appointments | View and manage appointments |
| My Patients | Patient list management |
| Schedule | Manage availability |
| Prescriptions | Create and view prescriptions |
| OPD Service | OPD scheduling view |
| Patient Service | Patient records |
| Patient Tracking | Track admitted patients |
| Biometric Service | Patient biometrics |
| Disease Knowledge | Disease information |
| Patient Monitoring | ICU/Critical care monitoring |
| Chatbot Service | AI assistant |
| Notification Service | All notifications |

---

## 5. Schedule Management

### 5.1 Purpose
Schedule management allows you to define your availability for patient appointments.

### 5.2 Viewing Your Schedule

**Step 1: Navigate to Schedule**
- Click "Schedule" in the sidebar or dashboard

**Step 2: View Weekly Overview**
- 7-day grid shows availability at a glance
- Green indicates available slots
- Gray indicates no slots

**Step 3: View Monthly Calendar**
- Full month calendar view
- Dates with slots are highlighted
- Click any date to view/edit slots

### 5.3 Creating New Schedule Slots

**Step 1: Click on a Day/Date**
- Select the day in weekly view OR
- Click a specific date in calendar

**Step 2: Open Schedule Editor**
- Schedule dialog opens
- View existing slots for that day

**Step 3: Add New Slot**
- Click "Add Slot" button
- Fill in required fields:

| Field | Description | Example |
|-------|-------------|---------|
| Start Time | Slot start | 09:00 AM |
| End Time | Slot end | 12:00 PM |
| Slot Type | Type of consultation | OPD, Surgery, Consultation |
| Location | Hospital location | Main Building - OPD |
| Max Patients | Patients per slot | 10 |

**Step 4: Save Changes**
- Click "Save Schedule"
- System generates 30-minute time slots automatically
- Slots become available for booking

### 5.4 Editing Existing Slots

**Step 1: Open Schedule Editor**
- Click on the day with existing slots

**Step 2: Modify Slot**
- Change time, type, or location
- Toggle availability on/off

**Step 3: Save Changes**
- Click "Save Schedule"

### 5.5 Deleting Slots

**Step 1: Open Schedule Editor**
- Click on the day

**Step 2: Remove Slot**
- Click delete icon next to the slot
- Confirm deletion

**Important**: Deleting a slot will cancel any booked appointments in that slot.

### 5.6 Importance for Real Data

| Why Accurate Scheduling Matters |
|--------------------------------|
| Patients book based on your availability |
| OPD managers rely on this for planning |
| AI analytics use scheduling data for efficiency metrics |
| Prevents double-booking and conflicts |
| Enables accurate appointment reminders |

---

## 6. Appointment Management

### 6.1 Viewing Appointments

**Step 1: Navigate to Appointments**
- Click "Appointments" in sidebar

**Step 2: View by Tab**
| Tab | Shows |
|-----|-------|
| Today | Today's appointments |
| Upcoming | Future appointments |
| Past | Completed appointments |
| All | All appointments |

**Step 3: Appointment Details**
Each appointment card shows:
- Patient name and photo
- Appointment time
- Symptoms/Reason for visit
- Status badge
- Location

### 6.2 Managing Appointments

**Completing an Appointment**
1. Click on the appointment
2. Review patient information
3. Click "Complete" button
4. Appointment moves to "Completed" status
5. Optionally create a prescription

**Cancelling an Appointment**
1. Click on the appointment
2. Click "Cancel" button
3. Confirm cancellation
4. Patient receives notification

**Creating Prescription from Appointment**
1. Click "Create Prescription" button
2. Patient details auto-populate
3. Fill prescription form
4. Save as draft or finalize

### 6.3 Appointment Notifications
- Automatic reminders 5 minutes before
- Real-time notifications for new bookings
- Cancellation alerts

### 6.4 Importance for Real Data

| Why Accurate Appointment Data Matters |
|--------------------------------------|
| Patient care continuity depends on accurate records |
| AI analyzes consultation patterns for efficiency |
| Billing is linked to completed appointments |
| Follow-up scheduling relies on past visits |
| Hospital analytics track doctor utilization |

---

## 7. Patient Management

### 7.1 Viewing Patient List

**Step 1: Navigate to My Patients**
- Click "My Patients" in sidebar

**Step 2: View Patient Cards**
Each patient card shows:
- Patient name
- Age and gender
- Blood group
- Last visit date
- Contact information
- Status (Active/Inactive)

**Step 3: Search Patients**
- Use search bar to find patients by name
- Filter by status if needed

### 7.2 Viewing Patient Details

**Step 1: Click on Patient Card**
- Full patient profile opens

**Step 2: Review Information**
| Section | Contents |
|---------|----------|
| Demographics | Name, Age, Gender, Contact |
| Medical | Blood group, Allergies, History |
| Visits | Past appointments and records |
| Prescriptions | All prescriptions issued |
| Documents | Uploaded medical documents |

### 7.3 Adding New Patient

**Step 1: Click "Add Patient"**
- New patient form opens

**Step 2: Enter Patient Details**
| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Full patient name |
| Age | Yes | Patient age |
| Gender | Yes | Male/Female/Other |
| Phone | Yes | Contact number |
| Email | No | Email address |
| Address | No | Residential address |
| Blood Group | No | Blood type |
| Allergies | No | Known allergies |
| Medical History | No | Past medical history |

**Step 3: Save Patient**
- Click "Save Patient"
- Patient added to your list

### 7.4 Editing Patient Information

**Step 1: Open Patient Details**
- Click on patient card

**Step 2: Click Edit**
- Edit button enables form fields

**Step 3: Update Information**
- Modify required fields
- Add new allergies or medical history

**Step 4: Save Changes**
- Click "Save"

### 7.5 Importance for Real Data

| Why Accurate Patient Data Matters |
|----------------------------------|
| **Clinical Safety**: Allergy information prevents adverse reactions |
| **Treatment Continuity**: Medical history informs current treatment |
| **AI Recommendations**: Disease knowledge uses patient data for personalized plans |
| **Emergency Care**: Blood group and allergies critical in emergencies |
| **Prescription Accuracy**: Demographics affect dosage calculations |
| **Follow-up Care**: Contact information enables reminders |

---

## 8. Prescription Management

### 8.1 Prescription Workflow

```
Create Draft → Add Medicines → Review → Sign & Finalize → Patient Receives
```

### 8.2 Creating a New Prescription

**Step 1: Navigate to Prescriptions**
- Click "Prescriptions" in sidebar OR
- Click "Create Prescription" from appointment

**Step 2: Start New Prescription**
- Click "New Prescription" button

**Step 3: Fill Patient Information Tab**
| Field | Auto-filled | Description |
|-------|-------------|-------------|
| Patient Name | If from appointment | Select or enter patient |
| Age | Yes | From patient records |
| Gender | Yes | From patient records |
| Blood Group | Yes | From patient records |
| Allergies | Yes | Critical information |

**Step 4: Fill Clinical Tab**
| Field | Description |
|-------|-------------|
| Chief Complaints | Patient's main symptoms |
| Diagnosis | Your diagnosis |
| Provisional Diagnosis | If not confirmed |
| Past Medical History | Relevant history |

**Step 5: Record Vitals**
| Vital | Unit |
|-------|------|
| Blood Pressure | mmHg (e.g., 120/80) |
| Blood Sugar | mg/dL |
| Pulse | bpm |
| Weight | kg |
| Temperature | °F or °C |

**Step 6: Add Medicines Tab**
For each medicine:
| Field | Description | Example |
|-------|-------------|---------|
| Medicine Name | Search medicine database | Paracetamol 500mg |
| Dosage Form | Tab, Cap, Syrup, Inj | Tab |
| Strength | Medication strength | 500mg |
| Frequency | Times per day | 3x daily |
| Meal Timing | Before/After/With food | After food |
| Duration | Number of days | 5 days |
| Special Instructions | Any special notes | Take with water |

**Step 7: Instructions Tab**
| Field | Description |
|-------|-------------|
| General Instructions | Care instructions |
| Diet Advice | Dietary recommendations |
| Activity Advice | Physical activity guidelines |
| Investigations | Tests to be done |
| Follow-up Date | Next visit date |

**Step 8: Save Prescription**
| Option | Result |
|--------|--------|
| Save as Draft | Prescription saved but not finalized |
| Sign & Finalize | Your digital signature added, prescription complete |

### 8.3 Prescription Status Flow

| Status | Description | Actions Available |
|--------|-------------|-------------------|
| Draft | Initial creation | Edit, Delete, Sign |
| Awaiting Signature | Ready for doctor signature | Sign, Edit |
| Finalized | Signed and complete | View, Print only |
| Void | Cancelled | View only |

### 8.4 Signing Prescriptions

**Step 1: Open Draft Prescription**
- View prescription details

**Step 2: Review All Information**
- Verify patient details
- Check medicines and dosages
- Review instructions

**Step 3: Click "Sign & Finalize"**
- Digital signature modal appears
- Confirm with your credentials

**Step 4: Confirmation**
- Prescription number generated (PR-YYYY-NNNN)
- Status changes to "Finalized"
- Patient receives notification

### 8.5 Printing Prescriptions

**Step 1: Open Finalized Prescription**

**Step 2: Click "Print"**
- Professional prescription format generated
- Includes:
  - Hospital header
  - Doctor details and registration number
  - Patient information
  - All medicines with schedule
  - Instructions
  - Doctor's digital signature
  - Prescription number

### 8.6 Medicine Database Integration

**Searching Medicines**
- Type medicine name in search field
- Autocomplete shows matches from database
- Select medicine to auto-fill details

**Medicine Information Available**
- Brand name
- Generic name
- Strength options
- Company name
- Category
- Common uses

### 8.7 Importance for Real Data

| Why Accurate Prescription Data Matters |
|---------------------------------------|
| **Patient Safety**: Wrong medicine/dosage can be fatal |
| **Legal Compliance**: Prescriptions are legal documents |
| **AI Analysis**: Prescription patterns analyzed for drug interactions |
| **Pharmacy Integration**: Accurate data ensures correct dispensing |
| **Medical Records**: Prescriptions form part of patient history |
| **Insurance Claims**: Required for claim processing |
| **Audit Trail**: Required for regulatory compliance |

---

## 9. Patient Monitoring

### 9.1 Purpose
The Patient Monitoring module provides NABH-compliant ICU charts and nursing workflows for critically ill patients requiring 24-hour monitoring.

### 9.2 Accessing Patient Monitoring

**Step 1: Navigate to Patient Monitoring**
- Click "Patient Monitoring" in sidebar

**Step 2: View Active Sessions**
- List of patients with active monitoring sessions
- Session date and shift information

### 9.3 Viewing Patient Monitoring Data

**Step 1: Select Patient Session**
- Click on patient name

**Step 2: Navigate Monitoring Tabs**

| Tab | Data Available |
|-----|----------------|
| Vitals | Hourly HR, BP, SpO2, Temperature |
| I/O Chart | Intake and Output hourly totals |
| Inotropes | Drug infusions, RASS/GCS scores |
| Ventilator | Ventilation settings if applicable |
| ABG & Labs | Blood gas and lab results |
| Diabetic | BSL, insulin, electrolytes |
| Medications | MAR - Given/Held/Missed |
| Nursing Notes | Shift observations |
| Devices | Airway, lines, tubes tracking |
| Skin Care | Pressure care and wound assessment |
| Fall Risk | Morse Fall Scale |
| Allergies | Drug/food allergies, isolation precautions, risk flags |
| Investigation Chart | Comprehensive lab tests and imaging results |

### 9.4 Reviewing Critical Data

**Vitals Hourly**
- 24-hour grid showing all vital signs
- Color coding for abnormal values
- Trend visualization

**Intake/Output Balance**
- Hourly fluid intake from all sources
- Output tracking (urine, drains, etc.)
- 24-hour balance calculation

**Medication Administration Record**
- View what was given and when
- Identify missed doses
- Review nurse signatures

### 9.5 Creating Doctor Orders

**Step 1: Open Patient Session**

**Step 2: Add Order**
- Medication orders
- Investigation orders
- Diet modifications
- Activity orders

**Step 3: Sign Order**
- Digital signature required
- Nurse receives notification

### 9.6 Investigation Chart

**Purpose**: Review comprehensive lab test and imaging results for IPD patients

**Viewing Investigation Data**
1. Click "Investigation" tab in Patient Monitoring
2. View all investigation entries by date

**Available Investigation Categories**

| Category | Tests Included |
|----------|----------------|
| Screening | Blood Group, HIV, HBSAg, HCV |
| Haematology | HB/PCV, TLC, DLC, ESR, Platelets, BT/CT, PT/APTT, Blood Sugar |
| Renal Function | BUN, Creatinine, Electrolytes (Na/K/Cl, Ca/Phos/Mag) |
| Liver Function | Bilirubin, SGOT/SGPT, Alkaline Phosphatase, Proteins, Viral Markers |
| Cardiac Enzymes | CPK-MB, LDH, Troponin |
| Lipid Profile | Cholesterol, Triglycerides, HDL/LDL/VLDL |
| Other Tests | Urine Routine, Stool Routine, Sputum Examination |
| Imaging | ECG, 2D Echo, USG, Doppler, X-Rays, CT/MRI, Histopathology, Fluid Analysis |

**Reviewing Investigation History**
- All entries displayed with date and nurse attribution
- Expandable sections for each category
- Track trends over multiple entries

### 9.7 Allergies & Precautions

**Purpose**: View patient allergies and special precautions for safe treatment

**Viewing Allergy Information**
1. Click "Allergies" tab in Patient Monitoring
2. View recorded allergies and precautions

**Available Fields**

| Field | Description |
|-------|-------------|
| Drug Allergies | Specific drug reactions |
| Food Allergies | Food-related allergies |
| Isolation Precautions | None, Contact, Droplet, Airborne, Reverse |
| Fall Risk | Fall risk assessment flag |
| Pressure Ulcer Risk | Pressure ulcer risk flag |

### 9.8 Importance for Real Data

| Why Accurate Monitoring Data Matters |
|-------------------------------------|
| **Critical Care**: Real-time decisions based on vitals |
| **Trend Analysis**: AI detects deterioration patterns |
| **Medication Safety**: MAR prevents double-dosing |
| **Fluid Balance**: Critical for kidney function |
| **NABH Compliance**: Required documentation |
| **Handover Accuracy**: Shift-to-shift continuity |
| **Mortality Prevention**: Early warning of deterioration |

---

## 10. Disease Knowledge Module

### 10.1 Purpose
AI-powered clinical knowledge system providing disease information, diet plans, and medication scheduling guidance for Indian clinical context.

### 10.2 Accessing Disease Knowledge

**Step 1: Navigate to Disease Knowledge**
- Click "Disease Knowledge" in sidebar

**Step 2: Browse or Search**
- View disease categories
- Search specific diseases

### 10.3 Available Diseases

Pre-seeded diseases include:
- Diabetes Type 2
- Hypertension
- Tuberculosis
- Dengue
- Asthma

### 10.4 Disease Information Structure

For each disease:

| Section | Contents |
|---------|----------|
| Overview | Description, causes, risk factors |
| Symptoms | Common and emergency signs |
| Clinical Parameters | Normal/Target/Danger ranges |
| Do's and Don'ts | Patient guidelines |
| Diet Plans | Indian diet recommendations |
| Medication Timing | When to take medicines |
| Activity Recommendations | Exercise and lifestyle |
| Follow-up Schedule | Monitoring frequency |

### 10.5 Using for Patient Education

**Step 1: Search Disease**
- Find patient's condition

**Step 2: View Details**
- Review recommendations

**Step 3: Generate Care Plan**
- Click "Generate Personalized Plan"
- AI creates patient-specific recommendations

**Step 4: Share with Patient**
- Print or share digitally

### 10.6 AI-Powered Personalization

The system uses OpenAI GPT-4o to:
- Customize diet plans for patient preferences
- Adjust recommendations for comorbidities
- Generate personalized activity plans
- Create medication schedules

### 10.7 Importance for Real Data

| Why Disease Knowledge Data Matters |
|-----------------------------------|
| **Evidence-Based Care**: Recommendations from ICMR/MoHFW guidelines |
| **Patient Compliance**: Culturally appropriate diet improves adherence |
| **AI Accuracy**: Personalization depends on accurate patient data |
| **Outcome Tracking**: Follow-up schedules ensure monitoring |
| **Chronic Disease Management**: Long-term care planning |

---

## 11. Notifications

### 11.1 Notification Types

| Type | Description |
|------|-------------|
| Appointment | New bookings, cancellations, reminders |
| Prescription | Prescription requests, signature needed |
| Patient | New patient assignments, updates |
| System | Important announcements |
| Emergency | Critical alerts requiring immediate attention |

### 11.2 Viewing Notifications

**Step 1: Access Notifications**
- Click bell icon in header OR
- Click "Notification Service" in sidebar

**Step 2: View Notification List**
- Unread notifications highlighted
- Priority badges (Critical, High, Medium, Low)
- Timestamp for each

**Step 3: Mark as Read**
- Click notification to view details
- Click "Mark as Read" or "Mark All as Read"

### 11.3 Real-Time Notifications

The system uses WebSocket for instant notifications:
- No page refresh needed
- Desktop notifications (if enabled)
- Badge count updates automatically

### 11.4 Importance for Real Data

| Why Notification Data Matters |
|------------------------------|
| **Timely Response**: Critical alerts need immediate action |
| **Patient Safety**: Appointment reminders prevent no-shows |
| **Audit Trail**: Notification logs for compliance |
| **AI Analysis**: Response patterns analyzed for efficiency |

---

## 12. Chatbot Assistant

### 12.1 Purpose
AI-powered chatbot for quick hospital information and query resolution.

### 12.2 Accessing Chatbot

**Step 1: Click Chatbot Service**
- Available from sidebar

**Step 2: Type Query**
- Natural language questions
- Hospital-specific queries

### 12.3 Chatbot Capabilities

| Query Type | Examples |
|------------|----------|
| Hospital Info | "What are OPD hours?" |
| Policies | "What is the admission process?" |
| Contacts | "Emergency contact numbers?" |
| General Medical | "What is hypertension?" |

### 12.4 Conversation Logging
- All conversations logged for quality improvement
- Used to improve AI responses

---

## 13. OPD Service Access

### 13.1 Doctor Access Level
Doctors can view:
- Doctor schedules
- Appointment bookings
- Location information

### 13.2 Features Available

| Feature | Access |
|---------|--------|
| View Doctors | Yes |
| View Schedules | Yes |
| Book Appointments (for patients) | Yes |
| Manage Own Schedule | Via Schedule section |

---

## 14. Patient Service Access

### 14.1 Features Available

| Feature | Access |
|---------|--------|
| View Patients | Yes |
| View Admissions | Yes |
| View Medical Records | Yes |
| Create Medical Records | Yes |
| View Consents | Limited |

### 14.2 Creating Medical Records

**Step 1: Select Patient**
- Navigate to patient profile

**Step 2: Add Record**
- Click "Add Medical Record"

**Step 3: Fill Details**
| Field | Description |
|-------|-------------|
| Record Type | Consultation, Lab, Imaging |
| Title | Record title |
| Description | Detailed notes |
| Attachment | Upload files if any |

**Step 4: Save**
- Record added to patient history
- Patient receives notification

---

## 15. Biometric Service

### 15.1 Purpose
Patient identity verification using fingerprint/facial recognition.

### 15.2 Doctor Access
- View verification logs
- Verify patient identity
- Access patient records via biometric

### 15.3 Usage
Primarily used for:
- Patient check-in verification
- Record access confirmation
- Surgery patient identification

---

## 16. Real Data Importance

### 16.1 Why Real Data Matters

HMS Core is designed to work with **real patient data only**. The system explicitly prohibits mock or dummy data because:

**Clinical Safety**
- Treatment decisions based on incorrect data can harm patients
- Medication dosages depend on accurate weight, age, allergies
- Emergency care requires real blood group and medical history

**AI Analytics Accuracy**
- AI models trained on real patterns
- Mock data skews predictions
- Efficiency metrics become meaningless

**Legal Compliance**
- Medical records are legal documents
- Prescriptions require accurate information
- Audit trails must reflect reality

**Hospital Operations**
- Inventory management depends on real usage
- Scheduling optimization needs real patterns
- Billing accuracy requires real data

### 16.2 Data Entry Best Practices

| Practice | Reason |
|----------|--------|
| Enter data immediately | Prevents memory errors |
| Verify patient identity | Prevents wrong-patient errors |
| Double-check medications | Prevents prescription errors |
| Record all allergies | Prevents adverse reactions |
| Update changes promptly | Keeps records current |
| Complete all required fields | Ensures data completeness |

### 16.3 Data Quality Indicators

HMS Core tracks:
- Completion rate of patient profiles
- Prescription accuracy
- Appointment completion rate
- Documentation timeliness

---

## 17. AI Analysis Features

### 17.1 How AI Uses Your Data

The HMS Core AI Intelligence Layer analyzes doctor activities to provide insights:

**Doctor Efficiency Analysis**
| Metric | What It Measures |
|--------|------------------|
| Consultation Time | Average time per patient |
| Prescription Quality | Complete, signed prescriptions |
| Schedule Utilization | Filled vs. available slots |
| Patient Outcomes | Follow-up compliance |

**Predictive Analytics**
- Appointment demand forecasting
- Patient load predictions
- Resource requirement estimation

### 17.2 AI-Powered Features Available to Doctors

**Disease Knowledge Personalization**
- AI generates personalized care plans
- Diet recommendations for specific patients
- Medication timing optimization

**Health Tips Generation**
- AI creates seasonal health tips
- Weather-based health advisories
- Targeted patient education

**Chatbot Intelligence**
- Context-aware responses
- Hospital-specific information
- Query pattern learning

### 17.3 How to Maximize AI Benefits

| Action | AI Benefit |
|--------|------------|
| Complete patient profiles | Better personalized recommendations |
| Record vitals accurately | Trend detection and alerts |
| Fill prescription details | Drug interaction analysis |
| Update schedules regularly | Better appointment forecasting |
| Document outcomes | Improved treatment recommendations |

### 17.4 AI Ethics and Privacy

- All AI analysis is anonymized for hospital-wide metrics
- Individual patient data protected
- Doctor performance metrics are private
- AI recommendations are suggestions, not mandates

---

## 18. Best Practices

### 18.1 Daily Routine

| Time | Action |
|------|--------|
| Start of Day | Log in, accept oath, review schedule |
| Before Each Patient | Review patient history, allergies |
| During Consultation | Record notes, prescribe if needed |
| After Consultation | Update records, mark complete |
| End of Day | Review pending tasks, log out |

### 18.2 Prescription Best Practices

- Always search medicine database for accurate names
- Include all allergies before prescribing
- Specify meal timing for all medicines
- Add special instructions when needed
- Sign prescriptions promptly

### 18.3 Schedule Management

- Update schedule weekly
- Block time for emergencies
- Specify correct locations
- Set appropriate patient limits

### 18.4 Documentation Standards

- Complete all required fields
- Use standard medical terminology
- Document time-sensitive information immediately
- Attach relevant files and reports

---

## 19. Troubleshooting

### 19.1 Common Issues

| Issue | Solution |
|-------|----------|
| Cannot log in | Check credentials, contact IT |
| Oath modal not appearing | Refresh page, clear cache |
| Schedule not saving | Check internet connection |
| Prescription not printing | Check browser pop-up blocker |
| Notifications not appearing | Check browser notification settings |
| Patient not found | Use search, verify spelling |

### 19.2 Support Contacts

| Issue Type | Contact |
|------------|---------|
| Technical Issues | IT Helpdesk |
| System Errors | System Administrator |
| Training Needs | HR Department |
| Policy Questions | Medical Director |

### 19.3 Reporting Bugs

If you encounter system issues:
1. Note the exact steps to reproduce
2. Take screenshot if possible
3. Report to IT with details
4. Follow up if not resolved

---

## Appendix A: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl + S | Save current form |
| Ctrl + P | Print prescription |
| Esc | Close dialog |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| OPD | Out-Patient Department |
| MAR | Medication Administration Record |
| NABH | National Accreditation Board for Hospitals |
| NMC | National Medical Commission |
| RASS | Richmond Agitation-Sedation Scale |
| GCS | Glasgow Coma Scale |
| BSL | Blood Sugar Level |
| ABG | Arterial Blood Gas |

---

## Recent Updates (January 2026)

### Smart OPD Consultation Flow

The OPD Service now features department-specific clinical workflows:

**24 Department Workflows:**
- Each department has customized consultation flow
- Symptom-driven forms with auto-generated observations
- Intelligent test and referral suggestions based on symptoms

**How to Use:**
1. Open patient consultation from Appointments
2. System automatically detects patient's department
3. Follow the guided workflow with department-specific forms
4. Review auto-generated observations and suggested tests
5. Accept or modify recommendations before finalizing

### Enhanced Schedule Display

**Doctor Card Improvements:**
- See real-time availability for any selected date
- Non-working days show list of scheduled working days
- Slot counts display: available, booked, and total

**Slot Panel Updates:**
- Only shows time slots when you have schedule for selected date
- Non-working days display informative message
- Schedule blocks visible to show overall availability pattern

### ICU Patient Monitoring Integration

**Ordering Diagnostic Tests:**
- Tests ordered from Patient Monitoring → Tests Tab route to Technician Portal
- Technicians are automatically notified for Patient Monitoring tests
- Results visible across all authorized roles once uploaded

**Workflow:**
1. Open ICU patient monitoring session
2. Navigate to Tests tab
3. Order diagnostic test with urgency level
4. Technician receives notification
5. View results when uploaded

### Diagnostic Report Visibility

- Diagnostic reports now visible across all authorized user roles
- Reports ordered from Patient Monitoring accessible to Doctors, Nurses, Technicians
- Working notification system ensures timely alerts

---

## Document Control

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.1 | January 2026 | Added Smart OPD Flow, Enhanced scheduling, ICU integration | HMS Core Team |
| 1.0 | December 2024 | Initial release | HMS Core Team |

---

*This SOP is part of the HMS Core Hospital Management System documentation.*
*For updates, refer to the latest version in the docs folder.*
