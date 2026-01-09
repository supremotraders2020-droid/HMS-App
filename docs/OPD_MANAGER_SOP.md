# OPD Manager Standard Operating Procedure (SOP)
## HMS Core - Hospital Management System

**Version**: 1.1  
**Effective Date**: January 2026  
**Applicable To**: All OPD Managers at Gravity Hospital  
**Document Type**: User Manual & SOP  
**Last Updated**: January 9, 2026

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Login Process](#2-login-process)
3. [OPD Manager Dashboard Overview](#3-opd-manager-dashboard-overview)
4. [OPD Service - Primary Module](#4-opd-service---primary-module)
5. [Doctor Schedule Management](#5-doctor-schedule-management)
6. [Time Slot Management](#6-time-slot-management)
7. [Appointment Management](#7-appointment-management)
8. [Hospital Locations](#8-hospital-locations)
9. [Patient Service](#9-patient-service)
10. [Prescription Management](#10-prescription-management)
11. [Disease Knowledge](#11-disease-knowledge)
12. [Real Data Importance](#12-real-data-importance)
13. [AI Analysis Features](#13-ai-analysis-features)
14. [Best Practices](#14-best-practices)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Introduction

### 1.1 Purpose
This Standard Operating Procedure provides comprehensive guidance for OPD Managers using the HMS Core Hospital Management System. It covers all features available for managing outpatient department operations, focusing on scheduling, appointments, and patient flow.

### 1.2 Scope
This SOP applies to all OPD management staff with the OPD_MANAGER role in HMS Core, including:
- OPD Managers
- OPD Coordinators
- Scheduling Coordinators
- Front Desk Supervisors
- Appointment Managers

### 1.3 OPD Manager Role Capabilities

| Feature | Access Level |
|---------|-------------|
| Dashboard | Full Access (OPD-specific view) |
| OPD Service | Full Access (Primary Module) |
| Patient Service | View Access |
| Prescription Management | Create Drafts Only |
| Disease Knowledge | View Access |

### 1.4 Features NOT Available to OPD Managers

| Feature | Reason |
|---------|--------|
| User Management | Admin function |
| Hospital Settings | Admin function |
| System Settings | Admin function |
| Inventory Service | Admin/Nurse function |
| Patient Tracking | Admin/Doctor/Nurse function |
| Biometric Service | Admin/Doctor/Nurse function |
| Equipment Servicing | Admin function |
| Oxygen Tracker | Admin/Nurse function |
| Biomedical Waste | Admin function |
| Swab Monitoring | Admin function |
| Patient Monitoring | Clinical function |
| AI Analytics | Admin function |
| Patient Analytics | Admin function |
| Consent Forms | Admin function |
| Notification Service | Limited access |

### 1.5 OPD Manager Responsibilities in HMS Core

- Manage doctor schedules and availability
- Create and monitor time slots
- Handle appointment bookings
- Monitor patient wait times
- Coordinate with doctors for schedule changes
- Manage patient queue and flow
- Create prescription drafts for doctor review
- Ensure OPD efficiency metrics

---

## 2. Login Process

### 2.1 Step-by-Step Login

**Step 1: Access the Application**
- Open your web browser (Chrome, Firefox, Edge recommended)
- Navigate to the HMS Core URL provided by IT department
- The login page will display

**Step 2: Enter Credentials**
- Enter your assigned username (format: `opd.firstname.lastname`)
- Enter your password
- Click the "Login" button

**Step 3: Authentication**
- The system validates your credentials
- If successful, you will be redirected to the OPD Manager Dashboard
- If unsuccessful, check your credentials and try again

### 2.2 Default OPD Manager Credentials
| Username | Password |
|----------|----------|
| opd.mahesh.nair | OPD@123 |

### 2.3 Security Guidelines
- Never share your login credentials
- Log out when leaving the workstation
- Change password if compromised
- Report any unauthorized access
- Use only assigned computers

---

## 3. OPD Manager Dashboard Overview

### 3.1 Dashboard Components

The OPD Manager Dashboard is specifically designed for OPD operations:

**Welcome Section**
- Personalized greeting with your name
- Current date and time
- OPD operational hours

**Statistics Cards**
| Card | Information | Action Required |
|------|-------------|-----------------|
| Queue Length | Current patients waiting | Manage queue flow |
| Average Wait | Average wait time today | Optimize scheduling |
| Completed Today | Consultations completed | Track performance |
| Delayed Appointments | Late or rescheduled | Follow up |

**Quick Actions**
- View Today's Schedule
- Book Appointment
- Check Slot Availability
- View Patient Queue

**OPD Summary**
- Today's appointment count
- Doctor availability status
- Peak hour indicators
- No-show tracking

### 3.2 Navigation Sidebar

The OPD Manager sidebar shows accessible modules:

| Menu Item | Function |
|-----------|----------|
| Dashboard | Return to main dashboard |
| OPD Service | Primary module - schedules, slots, appointments |
| Patient Service | View patient records |
| Prescriptions | Create prescription drafts |
| Disease Knowledge | View disease information |

### 3.3 Understanding Your Dashboard Stats

**Queue Length**
- Real-time count of waiting patients
- Updates automatically
- High numbers indicate need for action

**Average Wait**
- Calculated from check-in to consultation
- Target: Under 30 minutes
- Affects patient satisfaction

**Completed Today**
- Running count of finished appointments
- Compare with scheduled count
- Track doctor productivity

**Delayed Appointments**
- Appointments running behind schedule
- Requires immediate attention
- May need patient notification

---

## 4. OPD Service - Primary Module

### 4.1 Purpose
This is your PRIMARY module for managing all outpatient department operations, including doctor schedules, time slots, and appointments.

### 4.2 Accessing OPD Service

**Step 1: Navigate to OPD Service**
- Click "OPD Service" in sidebar

**Step 2: View OPD Dashboard**
- Overview of today's operations
- Doctor availability summary
- Appointment statistics

### 4.3 OPD Service Tabs

| Tab | Function |
|-----|----------|
| Doctors | View and manage doctor list |
| Schedules | Manage doctor schedules |
| Time Slots | View generated slots |
| Appointments | Manage all appointments |
| Locations | Hospital location management |

### 4.4 Doctor List

**Viewing Doctors**
1. Click "Doctors" tab
2. See all registered doctors
3. Filter by department/specialty

**Doctor Information**
| Field | Description |
|-------|-------------|
| Name | Doctor's full name |
| Specialty | Medical specialty |
| Department | Hospital department |
| Contact | Phone/Email |
| Status | Active/Inactive |

### 4.5 Understanding Doctor Availability

| Status | Meaning |
|--------|---------|
| Available | Has open slots today |
| Busy | All slots booked |
| On Leave | Not available |
| Limited | Few slots remaining |

---

## 5. Doctor Schedule Management

### 5.1 Purpose
Create and manage doctor schedules that generate time slots for patient appointments.

### 5.2 Viewing Schedules

**Step 1: Go to Schedules Tab**
- Click "Schedules" tab in OPD Service

**Step 2: View Existing Schedules**
- List of all doctor schedules
- Filter by doctor, day, location
- See active vs. inactive schedules

### 5.3 Schedule Components

| Field | Description | Example |
|-------|-------------|---------|
| Doctor | Assigned doctor | Dr. Anil Kumar |
| Day of Week | Weekly recurring day | Monday |
| Start Time | Consultation start | 09:00 |
| End Time | Consultation end | 13:00 |
| Slot Duration | Each slot length | 30 minutes |
| Location | Hospital location | Main Building - OPD |
| Max Patients | Maximum per slot | 1 |
| Slot Type | Regular/Special/Emergency | Regular |

### 5.4 Creating a New Schedule

**Step 1: Click "Add Schedule"**
- Schedule form opens

**Step 2: Fill Schedule Details**

| Field | Required | Instructions |
|-------|----------|--------------|
| Select Doctor | Yes | Choose from dropdown |
| Day of Week | Yes | Monday to Sunday |
| Start Time | Yes | Use 24-hour format (09:00) |
| End Time | Yes | Must be after start time |
| Slot Duration | Yes | Usually 15, 20, or 30 minutes |
| Location | Yes | Select hospital location |
| Max Patients | Yes | Usually 1 per slot |
| Slot Type | Yes | Regular, Special, or Emergency |
| Is Active | Yes | Enable/disable schedule |

**Step 3: Save Schedule**
- Click "Create Schedule"
- System validates inputs
- Time slots are auto-generated

### 5.5 Editing Schedules

**Step 1: Find Schedule**
- Search by doctor or day

**Step 2: Click Edit**
- Edit icon on schedule card

**Step 3: Modify Details**
- Change any field
- Note: Changes affect future slots only

**Step 4: Save Changes**
- Click "Save"
- Existing booked appointments NOT affected

### 5.6 Deactivating Schedules

**When to Deactivate**
- Doctor on extended leave
- Schedule no longer needed
- Temporary suspension

**Steps**
1. Find schedule
2. Toggle "Is Active" to Off
3. Save changes
4. No new slots generated

### 5.7 Schedule Best Practices

| Practice | Reason |
|----------|--------|
| Buffer between schedules | Allow for overruns |
| 30-min slots for new patients | More time needed |
| 15-min slots for follow-ups | Routine visits |
| Avoid back-to-back locations | Travel time needed |
| Morning + Afternoon sessions | Break for doctors |

---

## 6. Time Slot Management

### 6.1 Purpose
View and manage time slots generated from schedules.

### 6.2 How Slots Are Generated

```
Schedule Created → System Auto-Generates Slots → Slots Available for Booking
```

**Example:**
- Schedule: Monday, 09:00-13:00, 30-min slots
- Generated Slots: 09:00, 09:30, 10:00, 10:30, 11:00, 11:30, 12:00, 12:30
- Total: 8 slots

### 6.3 Viewing Time Slots

**Step 1: Go to Time Slots Tab**
- Click "Time Slots" tab

**Step 2: Filter Slots**
| Filter | Purpose |
|--------|---------|
| Date | View specific date |
| Doctor | Filter by doctor |
| Status | Available, Booked, Cancelled |
| Location | Filter by location |

**Step 3: View Slot Details**
- Click on any slot to see details

### 6.4 Slot Status

| Status | Color | Meaning |
|--------|-------|---------|
| Available | Green | Open for booking |
| Booked | Blue | Patient scheduled |
| Completed | Gray | Consultation done |
| Cancelled | Red | Cancelled (slot reopened) |
| No-Show | Orange | Patient didn't arrive |

### 6.5 Managing Slots

**Block Slot**
1. Select available slot
2. Click "Block"
3. Enter reason (doctor meeting, emergency, etc.)
4. Slot becomes unavailable

**Unblock Slot**
1. Select blocked slot
2. Click "Unblock"
3. Slot becomes available

**Override Slot**
1. For emergency bookings
2. Select any slot
3. Click "Override"
4. Book patient (marks as emergency)

### 6.6 Slot Utilization

**Monitor Key Metrics**
| Metric | Target | Action if Below |
|--------|--------|-----------------|
| Utilization Rate | >80% | Promote availability |
| No-Show Rate | <10% | Send reminders |
| Cancellation Rate | <15% | Improve confirmation |

---

## 7. Appointment Management

### 7.1 Purpose
Book, modify, and manage patient appointments.

### 7.2 Viewing Appointments

**Step 1: Go to Appointments Tab**
- Click "Appointments" tab

**Step 2: View Appointment List**
- All appointments displayed
- Default: Today's appointments

**Step 3: Filter Appointments**
| Filter | Options |
|--------|---------|
| Date | Today, Tomorrow, Date range |
| Doctor | Select specific doctor |
| Status | All, Booked, Completed, Cancelled, No-Show |
| Patient | Search by name |

### 7.3 Booking a New Appointment

**Step 1: Click "Book Appointment"**
- Appointment form opens

**Step 2: Select Patient**
| Option | Action |
|--------|--------|
| Existing Patient | Search by name, phone, or ID |
| New Patient | Click "Register New Patient" |

**Step 3: Select Doctor**
- Choose doctor from list
- See available slots

**Step 4: Select Date**
- Choose appointment date
- System shows available slots

**Step 5: Select Time Slot**
- View available slots
- Click to select

**Step 6: Add Appointment Details**
| Field | Required | Description |
|-------|----------|-------------|
| Reason | Yes | Chief complaint |
| Priority | No | Routine, Urgent, Emergency |
| Notes | No | Additional information |

**Step 7: Confirm Appointment**
- Review details
- Click "Book Appointment"
- Confirmation displayed

### 7.4 Appointment Status Workflow

```
BOOKED → CHECK-IN → IN-CONSULTATION → COMPLETED
              ↓              ↓
         NO-SHOW      CANCELLED
```

### 7.5 Managing Appointment Status

**Check-In Patient**
1. Patient arrives at OPD
2. Find appointment
3. Click "Check-In"
4. Patient added to queue

**Mark In-Consultation**
1. Doctor calls patient
2. Find appointment
3. Click "In-Consultation"
4. Wait time recorded

**Complete Appointment**
1. Consultation finished
2. Find appointment
3. Click "Complete"
4. Ready for billing

**Cancel Appointment**
1. Find appointment
2. Click "Cancel"
3. Enter reason
4. Slot reopened (optional)
5. Patient notified

**Mark No-Show**
1. Patient didn't arrive
2. Find appointment
3. Click "No-Show"
4. Record for analytics

### 7.6 Rescheduling Appointments

**Step 1: Find Original Appointment**
- Search by patient or date

**Step 2: Click "Reschedule"**
- Reschedule dialog opens

**Step 3: Select New Slot**
- Choose new date and time
- Must be available slot

**Step 4: Confirm Reschedule**
- Click "Reschedule"
- Original slot freed
- Patient notified

### 7.7 Appointment Reminders

**Automatic Reminders**
- 24 hours before appointment
- 1 hour before appointment
- Via SMS, Email, or WhatsApp

**Manual Reminder**
1. Find appointment
2. Click "Send Reminder"
3. Select channel
4. Reminder sent

### 7.8 Wait Time Management

**Current Wait Time**
- Calculated automatically
- From check-in to consultation

**Reducing Wait Times**
| Action | Impact |
|--------|--------|
| Accurate slot duration | Better scheduling |
| Buffer time between slots | Handle overruns |
| Monitor queue in real-time | Proactive management |
| Communicate delays | Patient satisfaction |

---

## 8. Hospital Locations

### 8.1 Purpose
Manage the 10 Pune hospital locations for OPD services.

### 8.2 Available Locations

| Location | Description |
|----------|-------------|
| Main Building - OPD | Primary outpatient area |
| Emergency Block | Emergency consultations |
| Specialty Wing | Specialist clinics |
| Diagnostic Center | Lab and imaging |
| Day Care Center | Short procedures |
| Rehabilitation Unit | Physio and rehab |
| Pediatric Block | Children's OPD |
| Maternity Wing | Obstetrics OPD |
| Research Center | Clinical trials |
| Administrative Block | Admin offices |

### 8.3 Viewing Locations

**Step 1: Go to Locations Tab**
- Click "Locations" tab

**Step 2: View Location Details**
- Name, address, contact
- Operating hours
- Available services

### 8.4 Location-Based Scheduling

**Assign Doctor to Location**
- Each schedule tied to location
- Doctor can have multiple location schedules
- Avoid overlapping locations

**Patient Direction**
- Appointment shows location
- Google Maps integration
- Room/floor information

---

## 9. Patient Service

### 9.1 Purpose
View patient records to support appointment management.

### 9.2 Access Level
As OPD Manager, you have VIEW access to patient records:
- Demographics
- Appointment history
- Basic medical information

### 9.3 Viewing Patients

**Step 1: Navigate to Patient Service**
- Click "Patient Service" in sidebar

**Step 2: Search Patient**
- Search by name, phone, or ID
- Filter by registration date

**Step 3: View Patient Card**
| Information | Available |
|-------------|-----------|
| Name, Age, Gender | Yes |
| Contact Information | Yes |
| Blood Group | Yes |
| Allergies (visible warning) | Yes |
| Appointment History | Yes |
| Medical Records | Limited |

### 9.4 Using Patient Info for Appointments

**Before Booking**
- Check patient history
- Note any allergies
- Review previous appointments
- Identify preferred doctor

---

## 10. Prescription Management

### 10.1 Purpose
Create prescription drafts for doctor review and finalization.

### 10.2 Access Level
As OPD Manager, you can:
- Create prescription DRAFTS only
- Cannot finalize prescriptions
- Cannot add digital signature

### 10.3 Prescription Workflow

```
OPD Manager Creates Draft → Doctor Reviews → Doctor Signs/Finalizes → Patient Receives
```

### 10.4 Creating a Prescription Draft

**Step 1: Access Prescriptions**
- From patient profile OR
- From completed appointment

**Step 2: Click "Create Prescription"**

**Step 3: Fill Patient Information Tab**
| Field | Auto-filled | Editable |
|-------|-------------|----------|
| Patient Name | Yes | No |
| Age/Gender | Yes | No |
| UHID | Yes | No |
| Date | Yes | No |
| Doctor | Select | Yes |

**Step 4: Fill Clinical Tab**
| Field | Description |
|-------|-------------|
| Chief Complaint | Patient's main concern |
| Diagnosis | Preliminary diagnosis |
| History | Relevant medical history |

**Step 5: Record Vitals (if available)**
| Vital | Unit |
|-------|------|
| Blood Pressure | mmHg |
| Blood Sugar | mg/dL |
| Pulse | bpm |
| Weight | kg |
| Temperature | °C |

**Step 6: Add Medicines**
1. Click "Add Medicine"
2. Search medicine database
3. Select medicine
4. Enter:
   | Field | Example |
   |-------|---------|
   | Dose | 500mg |
   | Frequency | Twice daily |
   | Duration | 5 days |
   | Instructions | After food |

**Step 7: Add Instructions**
- General advice
- Follow-up date
- Tests ordered

**Step 8: Save as Draft**
- Click "Save Draft"
- Status: DRAFT
- Awaits doctor review

### 10.5 Why OPD Managers Cannot Finalize

| Reason | Explanation |
|--------|-------------|
| Medical Responsibility | Doctor must verify treatment |
| Legal Requirement | Prescription requires doctor signature |
| Patient Safety | Clinical judgment needed |
| Regulatory Compliance | Medical council requirements |

### 10.6 Draft Status

| Status | Meaning |
|--------|---------|
| Draft | Created by OPD Manager, awaiting doctor |
| Awaiting Signature | Doctor reviewed, pending signature |
| Finalized | Doctor signed, complete |
| Void | Cancelled prescription |

---

## 11. Disease Knowledge

### 11.1 Purpose
Access disease information to support patient communication.

### 11.2 Accessing Disease Knowledge

**Step 1: Navigate to Disease Knowledge**
- Click "Disease Knowledge" in sidebar

**Step 2: Browse or Search**
- View by category
- Search by disease name

### 11.3 Available Information

| Category | Examples |
|----------|----------|
| Metabolic | Diabetes Type 2 |
| Cardiovascular | Hypertension |
| Respiratory | Asthma |
| Infectious | Tuberculosis, Dengue |
| Other | Various conditions |

### 11.4 Using for Patient Communication

**Pre-Appointment**
- Understand patient's condition
- Prepare relevant questions
- Set appropriate expectations

**Post-Appointment**
- Explain basic information
- Share do's and don'ts
- Diet recommendations
- Follow-up importance

---

## 12. Real Data Importance

### 12.1 Why Accurate OPD Data is Critical

Your data entry directly impacts hospital operations. HMS Core requires real data because:

**Patient Care**
| Data | Impact |
|------|--------|
| Correct Patient Info | Right treatment for right patient |
| Accurate Appointment Times | Efficient patient flow |
| Proper Slot Management | No double-booking |
| Complete Records | Continuity of care |

**Operational Efficiency**
| Data | Impact |
|------|--------|
| Schedule Accuracy | Doctor utilization |
| Wait Time Recording | Performance metrics |
| No-Show Tracking | Overbooking decisions |
| Cancellation Reasons | Process improvement |

**Financial Impact**
| Data | Impact |
|------|--------|
| Appointment Count | Revenue tracking |
| Consultation Completion | Billing accuracy |
| Resource Utilization | Cost management |

**AI System Accuracy**
| Data | AI Use |
|------|--------|
| Wait Times | Predict peak hours |
| No-Show Patterns | Recommend overbooking |
| Doctor Performance | Efficiency scoring |
| Patient Flow | Optimize scheduling |

### 12.2 Data Entry Standards

| Standard | Practice |
|----------|----------|
| Timeliness | Update appointment status immediately |
| Accuracy | Verify patient details before booking |
| Completeness | Fill all required fields |
| Consistency | Use standard formats |

### 12.3 Common Data Errors to Avoid

| Error | Correct Practice |
|-------|------------------|
| Wrong patient selected | Verify name and ID |
| Incorrect time slot | Double-check before confirming |
| Missing contact info | Always verify phone number |
| Delayed status updates | Update in real-time |
| Incomplete reason for visit | Get specific complaint |

### 12.4 Your Data Quality Responsibilities

1. Verify patient identity before booking
2. Update appointment status in real-time
3. Record accurate wait times
4. Document cancellation reasons
5. Track no-shows
6. Ensure complete prescription drafts

---

## 13. AI Analysis Features

### 13.1 How AI Uses OPD Data

**Scheduling Optimization**
- Analyzes historical appointment patterns
- Predicts busy days and times
- Recommends optimal slot duration
- Suggests schedule adjustments

**Wait Time Prediction**
- Monitors real-time queue
- Predicts delays
- Alerts for long wait times
- Recommends interventions

**No-Show Prediction**
- Analyzes patient history
- Identifies high-risk appointments
- Recommends confirmation calls
- Suggests overbooking strategy

**Doctor Efficiency**
- Tracks consultation duration
- Measures patients per session
- Identifies productivity patterns
- Benchmarks against peers

### 13.2 OPD Intelligence Metrics

| Metric | What It Measures | Target |
|--------|------------------|--------|
| Average Wait Time | Patient satisfaction | <30 min |
| Slot Utilization | Resource efficiency | >80% |
| No-Show Rate | Appointment reliability | <10% |
| Throughput | Patients per hour | Varies |
| On-Time Start | Schedule adherence | >90% |

### 13.3 AI-Generated Recommendations

| Recommendation | Example |
|----------------|---------|
| Schedule Adjustment | "Consider adding afternoon slots on Tuesdays" |
| Overbooking | "Overbook by 10% for Dr. Kumar based on no-show history" |
| Wait Time Alert | "Current wait exceeds 45 minutes - consider action" |
| Peak Hour Warning | "Tomorrow 10-11 AM predicted to be busy" |

### 13.4 How to Help AI Work Better

| Your Action | AI Benefit |
|-------------|------------|
| Real-time status updates | Accurate wait time calculation |
| Complete appointment records | Better pattern recognition |
| Accurate no-show marking | Improved predictions |
| Consistent data entry | Reliable analytics |

---

## 14. Best Practices

### 14.1 Daily OPD Manager Routine

| Time | Action |
|------|--------|
| Before OPD Opens | Review today's schedule, check doctor availability |
| OPD Start | Monitor check-ins, manage queue |
| Throughout Day | Track wait times, handle walk-ins |
| Midday | Review morning performance, adjust afternoon |
| Before Close | Complete all status updates |
| End of Day | Review metrics, prepare tomorrow |

### 14.2 Schedule Management Best Practices

| Practice | Benefit |
|----------|---------|
| Review schedules weekly | Catch conflicts early |
| Buffer time between sessions | Handle overruns |
| Confirm doctor availability daily | Avoid last-minute cancellations |
| Balance new vs. follow-up slots | Appropriate time allocation |

### 14.3 Appointment Management Best Practices

| Practice | Benefit |
|----------|---------|
| Verify patient details | Avoid errors |
| Confirm appointments 24h before | Reduce no-shows |
| Update status immediately | Accurate metrics |
| Document cancellation reasons | Process improvement |
| Manage walk-ins systematically | Fair patient handling |

### 14.4 Patient Communication Best Practices

| Situation | Communication |
|-----------|---------------|
| Long Wait | Inform patient proactively |
| Doctor Delayed | Give estimated time |
| Cancellation | Offer immediate rescheduling |
| Confirmation | Clear time and location |

### 14.5 Queue Management Tips

| Tip | Implementation |
|-----|----------------|
| Visual Queue Display | Help patients know position |
| Regular Updates | Announce delays |
| Priority Handling | Elderly, emergencies |
| Smooth Check-In | Reduce bottlenecks |

---

## 15. Troubleshooting

### 15.1 Common Issues

| Issue | Solution |
|-------|----------|
| Cannot log in | Check credentials, contact IT |
| Schedule not saving | Verify all fields, check conflicts |
| Slots not generating | Check schedule is active |
| Appointment booking fails | Verify slot available, patient exists |
| Cannot find patient | Try different search terms |
| Prescription draft not saving | Fill all required fields |

### 15.2 Schedule Conflicts

**Symptoms**
- Error when creating schedule
- Overlapping time message

**Resolution**
1. Check existing schedules for same doctor/time
2. Adjust times to avoid overlap
3. Consider different locations

### 15.3 Missing Time Slots

**Symptoms**
- No slots shown for a doctor
- Expected slots not appearing

**Resolution**
1. Check if schedule is active
2. Verify date is not a holiday
3. Check schedule date range
4. Contact admin if issue persists

### 15.4 Patient Not Found

**Symptoms**
- Search returns no results
- Patient claims to be registered

**Resolution**
1. Try phone number search
2. Try partial name match
3. Check for spelling variations
4. May need new registration

### 15.5 Escalation Path

| Issue Type | Contact |
|------------|---------|
| Technical Issues | IT Helpdesk |
| Schedule Conflicts | OPD Supervisor |
| Patient Complaints | Customer Service |
| Doctor Availability | Medical Coordinator |

### 15.6 Emergency Procedures

**Doctor Absence**
1. Check for substitute doctor
2. Contact patients to reschedule
3. Update system immediately
4. Document reason

**System Down**
1. Use paper appointment log
2. Manual patient tracking
3. Enter data when system restored
4. Follow downtime procedures

---

## Appendix A: Quick Reference - Time Slots

**Standard Slot Durations**
| Visit Type | Duration |
|------------|----------|
| New Patient | 30 minutes |
| Follow-up | 15 minutes |
| Complex Case | 45 minutes |
| Procedure | 60 minutes |

**Slot Generation**
- 4-hour session with 30-min slots = 8 slots
- 4-hour session with 15-min slots = 16 slots

---

## Appendix B: Quick Reference - Appointment Status

| Status | Color | Next Action |
|--------|-------|-------------|
| Booked | Blue | Wait for patient arrival |
| Checked-In | Yellow | Move to queue |
| In-Consultation | Orange | Wait for completion |
| Completed | Green | Ready for billing |
| Cancelled | Red | Slot reopened |
| No-Show | Gray | Record for analytics |

---

## Appendix C: Hospital Locations with Contacts

| Location | Contact | Hours |
|----------|---------|-------|
| Main Building - OPD | Ext. 100 | 8:00 AM - 8:00 PM |
| Emergency Block | Ext. 101 | 24x7 |
| Specialty Wing | Ext. 102 | 9:00 AM - 6:00 PM |
| Diagnostic Center | Ext. 103 | 7:00 AM - 9:00 PM |
| Day Care Center | Ext. 104 | 8:00 AM - 4:00 PM |
| Rehabilitation Unit | Ext. 105 | 9:00 AM - 5:00 PM |
| Pediatric Block | Ext. 106 | 9:00 AM - 7:00 PM |
| Maternity Wing | Ext. 107 | 24x7 |
| Research Center | Ext. 108 | 9:00 AM - 5:00 PM |
| Administrative Block | Ext. 109 | 9:00 AM - 5:00 PM |

---

## Appendix D: Abbreviations

| Abbreviation | Meaning |
|--------------|---------|
| OPD | Out-Patient Department |
| HMS | Hospital Management System |
| UHID | Unique Health ID |
| Rx | Prescription |
| F/U | Follow-up |
| N/S | No-Show |
| Appt | Appointment |
| Pt | Patient |
| Dr | Doctor |
| Dept | Department |

---

## Appendix E: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl + N | New Appointment |
| Ctrl + F | Find Patient |
| Ctrl + S | Save |
| Esc | Close Dialog |
| Enter | Confirm Selection |

---

## Recent Updates (January 2026)

### Schedule-Based Availability Display

The OPD Service now shows improved doctor availability information:

**Doctor Card Changes:**
- When a doctor HAS schedule for selected date: Shows "X available, Y booked / Z total"
- When a doctor has NO schedule for selected date: Shows "No clinic hours for this date (Available: Mon, Wed, Fri)"

**Slot Panel Improvements:**
- Slot detail panel only displays time slots when doctor has active schedule for selected date
- Non-working days show informative message with list of doctor's scheduled working days
- Schedule blocks remain visible to show overall availability pattern

**How to Use:**
1. Navigate to OPD Service → Doctors tab
2. Select a date using the date picker
3. Doctor cards automatically update to show availability for that date
4. Click on a doctor to view available time slots
5. If no slots available, check the displayed working days and select appropriate date

### Doctor Identity Mapping

The system now uses reliable `doctorTableId` mapping:
- Eliminates issues with name variations (Dr. prefix, duplicate names)
- Ensures accurate schedule-to-appointment reconciliation
- Improves reporting accuracy

---

## Document Control

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.1 | January 2026 | Added schedule-based availability display, doctor identity mapping | HMS Core Team |
| 1.0 | December 2024 | Initial release | HMS Core Team |

---

*This SOP is part of the HMS Core Hospital Management System documentation.*
*For updates, refer to the latest version in the docs folder.*
