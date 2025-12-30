# HMS Core - Feature List & Test Cases by User Role
## Hospital Management System - Gravity Hospital

---

# 1. ADMIN FEATURES & TEST CASES

| # | Feature | Description | Module |
|---|---------|-------------|--------|
| 1 | User Creation | Create new users with roles | User Management |
| 2 | User Edit | Modify user details | User Management |
| 3 | User Deactivation | Disable user accounts | User Management |
| 4 | Password Reset | Reset user passwords | User Management |
| 5 | Hospital Profile | Manage hospital details | Hospital Settings |
| 6 | Department Config | Configure departments | Hospital Settings |
| 7 | Theme Settings | Change system theme | System Settings |
| 8 | Doctor Scheduling | Create doctor schedules | OPD Service |
| 9 | Slot Configuration | Set appointment slots | OPD Service |
| 10 | Patient Registration | Register new patients | Patient Service |
| 11 | Admission Management | Manage admissions | Patient Service |
| 12 | Medical Records | Create/view records | Patient Service |
| 13 | Insurance Tracking | Manage insurance | Patient Service |
| 14 | Stock Management | Manage inventory | Inventory Service |
| 15 | Low Stock Alerts | View stock alerts | Inventory Service |
| 16 | Asset Inventory | Manage equipment | Equipment Servicing |
| 17 | Maintenance Schedule | Schedule maintenance | Equipment Servicing |
| 18 | Bed Categories | Configure bed types | Bed Management |
| 19 | Bed Allocation | Allocate beds | Bed Management |
| 20 | Bed Transfer | Transfer patients | Bed Management |
| 21 | Cylinder Management | Manage O2 cylinders | Oxygen Tracking |
| 22 | LMO Readings | Record LMO levels | Oxygen Tracking |
| 23 | Waste Categorization | Manage BMW | Biomedical Waste |
| 24 | Compliance Reports | Generate reports | Biomedical Waste |
| 25 | Swab Samples | Record swab tests | Swab Monitoring |
| 26 | CAPA Generation | Create CAPA reports | Swab Monitoring |
| 27 | Consent Templates | Manage consent forms | Consent Forms |
| 28 | PDF Generation | Generate consent PDFs | Consent Forms |
| 29 | AI Dashboard | View AI analytics | AI Analytics |
| 30 | Efficiency Metrics | View performance | AI Analytics |
| 31 | Patient Trends | Analyze trends | Patient Analytics |
| 32 | Disease Database | Manage diseases | Disease Knowledge |
| 33 | Diet Plans | Manage diet info | Disease Knowledge |
| 34 | Notification Send | Send notifications | Notification Service |
| 35 | Chatbot Access | Use AI chatbot | Chatbot Service |
| 36 | Biometric Enroll | Enroll faces | Biometric Service |
| 37 | Face Recognition | Verify identity | Biometric Service |
| 38 | Add Services | Add hospital services | Hospital Services |
| 39 | Edit Services | Modify services | Hospital Services |
| 40 | Delete Services | Remove services | Hospital Services |
| 41 | Search Services | Search by name/dept | Hospital Services |

## ADMIN TEST CASES

| TC# | Feature | Test Case | Steps | Expected Result |
|-----|---------|-----------|-------|-----------------|
| A01 | User Creation | Create new doctor | 1. Go to User Management 2. Click Add User 3. Fill details (Name, Username, Password, Role=DOCTOR) 4. Click Create | User created successfully, appears in list |
| A02 | User Creation | Create duplicate username | 1. Try creating user with existing username | Error: Username already exists |
| A03 | User Edit | Update user email | 1. Find user 2. Click Edit 3. Change email 4. Save | Email updated, changes reflected |
| A04 | User Deactivation | Deactivate user | 1. Find user 2. Click Deactivate | User status changes to inactive |
| A05 | Password Reset | Reset user password | 1. Find user 2. Click Reset Password 3. Enter new password | Password changed, user can login with new password |
| A06 | Hospital Profile | Update hospital name | 1. Go to Hospital Settings 2. Edit name 3. Save | Hospital name updated |
| A07 | Theme Settings | Change to dark mode | 1. Go to System Settings 2. Select Dark Mode | UI switches to dark theme |
| A08 | Doctor Scheduling | Create schedule | 1. Go to OPD Service 2. Select doctor 3. Set available days/times 4. Save | Schedule created, slots visible |
| A09 | Slot Configuration | Configure 30-min slots | 1. Edit schedule 2. Set slot duration 3. Save | Slots created with correct duration |
| A10 | Patient Registration | Register patient | 1. Go to Patient Service 2. Click Add Patient 3. Fill demographics 4. Save | Patient registered, UHID generated |
| A11 | Patient Registration | Register with existing phone | 1. Try registering with duplicate phone | Warning: Patient may already exist |
| A12 | Admission Management | Admit patient | 1. Select patient 2. Click Admit 3. Assign bed 4. Confirm | Patient admitted, bed status updated |
| A13 | Medical Records | Create record | 1. Select patient 2. Add medical record 3. Fill diagnosis 4. Save | Record created, linked to patient |
| A14 | Stock Management | Add stock item | 1. Go to Inventory 2. Add new item 3. Set quantity/reorder level | Item added to inventory |
| A15 | Low Stock Alerts | View alerts | 1. Go to Inventory 2. Check low stock section | Items below reorder level displayed |
| A16 | Asset Inventory | Add equipment | 1. Go to Equipment 2. Add new asset 3. Enter details | Equipment added to inventory |
| A17 | Maintenance Schedule | Schedule maintenance | 1. Select equipment 2. Schedule maintenance date | Maintenance scheduled, reminder set |
| A18 | Bed Categories | Add bed category | 1. Go to Bed Management 2. Add category (ICU, General) | Category created |
| A19 | Bed Allocation | Allocate bed | 1. Select admission 2. Assign available bed | Bed marked as occupied |
| A20 | Bed Transfer | Transfer patient | 1. Select occupied bed 2. Transfer to new bed | Transfer logged, beds updated |
| A21 | Cylinder Management | Add cylinder | 1. Go to Oxygen Tracker 2. Add cylinder with type 3. Set status | Cylinder added to inventory |
| A22 | LMO Readings | Record reading | 1. Enter LMO level 2. Save | Reading logged with timestamp |
| A23 | Waste Categorization | Add waste entry | 1. Go to BMW 2. Select category (Yellow/Red/White/Blue) 3. Enter weight | Entry recorded, barcode generated |
| A24 | Compliance Reports | Generate daily report | 1. Click Daily Report 2. Select date | PDF report generated |
| A25 | Swab Samples | Record swab | 1. Go to Swab Monitoring 2. Enter sample data 3. Save | Result auto-interpreted (PASS/FAIL) |
| A26 | Consent Templates | View template | 1. Go to Consent Forms 2. Select template 3. View | Template displayed in selected language |
| A27 | AI Dashboard | View analytics | 1. Go to AI Analytics 2. View metrics | Dashboard displays current analytics |
| A28 | Disease Database | Add disease | 1. Go to Disease Knowledge 2. Add disease 3. Enter details | Disease added to database |
| A29 | Notification Send | Send to role | 1. Create notification 2. Select role 3. Send | Notification delivered to all users of role |
| A30 | Chatbot Access | Ask question | 1. Open Chatbot 2. Type question | AI responds with relevant answer |
| A31 | Biometric Enroll | Enroll patient face | 1. Go to Biometric 2. Capture face 3. Save | Face embedding stored |
| A32 | Face Recognition | Verify patient | 1. Scan face 2. System matches | Patient identified with confidence score |
| A33 | Add Services | Add new service | 1. Go to Hospital Services 2. Expand department 3. Click Add Service 4. Enter name | Service added to department |
| A34 | Edit Services | Update service name | 1. Find service 2. Click Edit 3. Change name 4. Save | Service name updated |
| A35 | Delete Services | Remove service | 1. Find service 2. Click Delete 3. Confirm | Service removed from list |
| A36 | Search Services | Search by department | 1. Enter department name in search 2. View results | Matching departments displayed |
| A37 | Search Services | Search by service | 1. Enter service name in search 2. View results | Matching services highlighted |

---

# 2. DOCTOR FEATURES & TEST CASES

| # | Feature | Description | Module |
|---|---------|-------------|--------|
| 1 | Daily Oath | Confirm daily oath | Login |
| 2 | Dashboard View | View dashboard | Dashboard |
| 3 | Schedule View | View own schedule | Schedule Management |
| 4 | Availability Set | Set available times | Schedule Management |
| 5 | Appointment View | View appointments | Appointment Management |
| 6 | Patient Queue | Manage queue | Appointment Management |
| 7 | Patient Search | Find patients | Patient Management |
| 8 | History View | View patient history | Patient Management |
| 9 | Prescription Create | Create prescription | Prescription Management |
| 10 | Prescription Sign | Sign prescription | Prescription Management |
| 11 | Prescription Finalize | Finalize prescription | Prescription Management |
| 12 | Medicine Search | Search medicines | Prescription Management |
| 13 | Lab Test Order | Order lab tests | Lab Test Ordering |
| 14 | Lab Results View | View results | Lab Test Ordering |
| 15 | Patient Monitor | View ICU charts | Patient Monitoring |
| 16 | Vitals Review | Review vitals | Patient Monitoring |
| 17 | Disease Info | View disease info | Disease Knowledge |
| 18 | OPD Access | Access OPD service | OPD Service |
| 19 | Biometric Verify | Verify patient | Biometric Service |
| 20 | Notifications | View notifications | Notification Service |
| 21 | Chatbot Use | Use AI chatbot | Chatbot Service |
| 22 | Services View | Browse services | Hospital Services |
| 23 | Services Search | Search services | Hospital Services |

## DOCTOR TEST CASES

| TC# | Feature | Test Case | Steps | Expected Result |
|-----|---------|-----------|-------|-----------------|
| D01 | Daily Oath | Confirm oath on login | 1. Login as doctor 2. Read oath 3. Click Confirm | Access granted to portal |
| D02 | Daily Oath | Skip oath | 1. Login 2. Try to skip | Cannot proceed without confirmation |
| D03 | Dashboard View | View statistics | 1. Login 2. View dashboard | Today's appointments, pending tasks shown |
| D04 | Schedule View | Check schedule | 1. Go to Schedule 2. View calendar | Available slots and bookings displayed |
| D05 | Availability Set | Mark day off | 1. Go to Schedule 2. Mark day unavailable | Day blocked, no appointments allowed |
| D06 | Appointment View | View today's list | 1. Go to Appointments 2. Select today | Today's appointments listed |
| D07 | Patient Queue | Call next patient | 1. View queue 2. Click Next Patient | Patient called, status updated |
| D08 | Patient Search | Find by name | 1. Enter patient name 2. Search | Matching patients displayed |
| D09 | Patient Search | Find by UHID | 1. Enter UHID 2. Search | Patient record displayed |
| D10 | History View | View medical history | 1. Select patient 2. View history | All past records displayed |
| D11 | Prescription Create | Create new prescription | 1. Select patient 2. Create prescription 3. Add medicines | Draft prescription created |
| D12 | Prescription Create | Add multiple medicines | 1. Add medicine 1 2. Add medicine 2 3. Set dosages | All medicines added with schedules |
| D13 | Medicine Search | Search by brand name | 1. Type brand name 2. View suggestions | Matching medicines shown |
| D14 | Medicine Search | Search by generic name | 1. Type generic name 2. View suggestions | Matching medicines shown |
| D15 | Prescription Sign | Sign prescription | 1. Review prescription 2. Click Sign | Status changes to Awaiting Signature |
| D16 | Prescription Finalize | Finalize prescription | 1. Signed prescription 2. Click Finalize | Status changes to Finalized, visible to pharmacy |
| D17 | Lab Test Order | Order CBC test | 1. Select patient 2. Order Lab Test 3. Select CBC 4. Submit | Order sent to Pathology Lab |
| D18 | Lab Test Order | Order with STAT priority | 1. Order test 2. Set priority STAT | Order marked urgent |
| D19 | Lab Results View | View results | 1. Go to patient 2. View lab results | Results displayed with flags |
| D20 | Patient Monitor | View ICU chart | 1. Select ICU patient 2. View monitoring | 24-hour chart displayed |
| D21 | Vitals Review | Check current vitals | 1. Select patient 2. View vitals | Current vitals displayed |
| D22 | Disease Info | Search disease | 1. Go to Disease Knowledge 2. Search diabetes | Disease info, diet, medications shown |
| D23 | OPD Access | View OPD schedule | 1. Go to OPD Service 2. View schedule | OPD schedule displayed |
| D24 | Biometric Verify | Verify patient face | 1. Scan patient face | Patient identified |
| D25 | Notifications | View notification | 1. Click bell icon 2. Read notification | Notification details shown |
| D26 | Chatbot Use | Ask clinical question | 1. Open chatbot 2. Ask question | AI provides clinical response |
| D27 | Services View | Browse cardiology | 1. Go to Hospital Services 2. Expand Cardiology | Cardiology services listed |
| D28 | Services Search | Search ECG | 1. Type "ECG" in search | ECG service highlighted |
| D29 | Services View | Cannot edit | 1. Try to add/edit service | No add/edit buttons visible (read-only) |

---

# 3. NURSE FEATURES & TEST CASES

| # | Feature | Description | Module |
|---|---------|-------------|--------|
| 1 | Dashboard View | View dashboard | Dashboard |
| 2 | Assigned Patients | View patients | Patient Care |
| 3 | Care Documentation | Document care | Patient Care |
| 4 | Patient Tracking | Track patients | Patient Tracking |
| 5 | Status Update | Update status | Patient Tracking |
| 6 | Vitals Recording | Record vitals | Patient Monitoring |
| 7 | ICU Chart | Manage ICU chart | Patient Monitoring |
| 8 | Intake/Output | Record I/O | Patient Monitoring |
| 9 | Medication Admin | Administer meds | Patient Monitoring |
| 10 | Nursing Assessment | Complete assessment | Patient Monitoring |
| 11 | Pain Assessment | Assess pain | Patient Monitoring |
| 12 | Fall Risk | Assess fall risk | Patient Monitoring |
| 13 | Inventory View | View stock | Inventory Service |
| 14 | Stock Request | Request supplies | Inventory Service |
| 15 | Oxygen Status | Check O2 status | Oxygen Tracking |
| 16 | Biometric Verify | Verify patient | Biometric Service |
| 17 | Patient Barcode | Scan barcode | Patient Barcode |
| 18 | Notifications | View notifications | Notification Service |
| 19 | Chatbot Use | Use chatbot | Chatbot Service |
| 20 | Services View | Browse services | Hospital Services |
| 21 | Services Search | Search services | Hospital Services |

## NURSE TEST CASES

| TC# | Feature | Test Case | Steps | Expected Result |
|-----|---------|-----------|-------|-----------------|
| N01 | Dashboard View | View shift info | 1. Login 2. View dashboard | Shift patients and tasks shown |
| N02 | Assigned Patients | View patient list | 1. Go to Patient Care 2. View list | Assigned patients displayed |
| N03 | Care Documentation | Add care note | 1. Select patient 2. Add note 3. Save | Note saved with timestamp |
| N04 | Patient Tracking | Track location | 1. Go to Patient Tracking 2. View patient | Current location shown |
| N05 | Status Update | Update patient status | 1. Select patient 2. Update status 3. Save | Status updated |
| N06 | Vitals Recording | Record temperature | 1. Select patient 2. Enter temperature 3. Save | Vital recorded with time |
| N07 | Vitals Recording | Record all vitals | 1. Enter BP, HR, RR, SpO2, Temp 2. Save | All vitals recorded |
| N08 | Vitals Recording | Critical vital alert | 1. Enter abnormal value (e.g., BP 200/120) | Critical alert generated |
| N09 | ICU Chart | Add hourly entry | 1. Go to ICU Chart 2. Add hourly data 3. Save | Entry added to 24-hour chart |
| N10 | Intake/Output | Record intake | 1. Add oral/IV intake 2. Enter amount 3. Save | Intake recorded |
| N11 | Intake/Output | Record output | 1. Add urine/drain output 2. Enter amount | Output recorded, balance calculated |
| N12 | Medication Admin | Administer medication | 1. View scheduled meds 2. Mark as given 3. Sign | Medication marked as administered |
| N13 | Medication Admin | Skip medication | 1. Select medication 2. Mark as skipped 3. Enter reason | Skip recorded with reason |
| N14 | Nursing Assessment | Complete assessment | 1. Open assessment 2. Fill all sections 3. Submit | Assessment completed |
| N15 | Pain Assessment | Record pain score | 1. Assess pain 2. Enter score (0-10) 3. Save | Pain score recorded |
| N16 | Fall Risk | Assess fall risk | 1. Complete fall risk form 2. Calculate score | Risk level determined |
| N17 | Inventory View | Check stock | 1. Go to Inventory 2. Search item | Stock level displayed |
| N18 | Stock Request | Request supplies | 1. Select items 2. Enter quantity 3. Submit | Request sent to admin |
| N19 | Oxygen Status | Check cylinder | 1. Go to Oxygen Tracker 2. View cylinders | Cylinder statuses shown |
| N20 | Biometric Verify | Verify patient | 1. Scan patient face | Patient identity confirmed |
| N21 | Patient Barcode | Scan wristband | 1. Scan barcode 2. View patient | Patient details displayed |
| N22 | Notifications | View shift alerts | 1. Check notifications | Shift-related alerts shown |
| N23 | Chatbot Use | Ask care question | 1. Open chatbot 2. Ask question | Care-related answer provided |
| N24 | Services View | Browse services | 1. Go to Hospital Services 2. Expand departments | Services listed (read-only) |
| N25 | Services Search | Search service | 1. Type service name 2. View results | Service found |
| N26 | Services View | Cannot edit | 1. Try to modify service | No edit options available |

---

# 4. OPD MANAGER FEATURES & TEST CASES

| # | Feature | Description | Module |
|---|---------|-------------|--------|
| 1 | Dashboard View | View OPD stats | Dashboard |
| 2 | Appointment Book | Book appointments | OPD Service |
| 3 | Doctor Schedule | Manage schedules | OPD Service |
| 4 | Walk-in Manage | Handle walk-ins | OPD Service |
| 5 | Queue Management | Manage queue | OPD Service |
| 6 | Patient Register | Register patients | Patient Service |
| 7 | Insurance Verify | Verify insurance | Patient Service |
| 8 | Prescription View | View prescriptions | Prescriptions |
| 9 | Biometric Enroll | Enroll patient | Biometric Service |
| 10 | Staff Coordinate | Manage staff | Staff Management |
| 11 | Notifications | View notifications | Notification Service |
| 12 | Services View | Browse services | Hospital Services |
| 13 | Services Search | Search services | Hospital Services |

## OPD MANAGER TEST CASES

| TC# | Feature | Test Case | Steps | Expected Result |
|-----|---------|-----------|-------|-----------------|
| O01 | Dashboard View | View today's OPD | 1. Login 2. View dashboard | OPD statistics displayed |
| O02 | Appointment Book | Book appointment | 1. Select patient 2. Choose doctor 3. Select slot 4. Book | Appointment booked, confirmation shown |
| O03 | Appointment Book | Book full slot | 1. Try booking fully booked slot | Error: Slot not available |
| O04 | Doctor Schedule | View schedule | 1. Go to OPD Service 2. Select doctor | Doctor schedule displayed |
| O05 | Doctor Schedule | Modify schedule | 1. Edit doctor schedule 2. Add/remove slots 3. Save | Schedule updated |
| O06 | Walk-in Manage | Add walk-in | 1. Click Add Walk-in 2. Enter patient 3. Assign slot | Walk-in added to queue |
| O07 | Queue Management | View queue | 1. View current queue | Waiting patients listed |
| O08 | Queue Management | Prioritize patient | 1. Select patient 2. Move up in queue | Queue order updated |
| O09 | Patient Register | Register new patient | 1. Click New Patient 2. Fill form 3. Save | Patient registered, UHID assigned |
| O10 | Patient Register | Register with photo | 1. Register patient 2. Capture photo 3. Save | Patient with photo registered |
| O11 | Insurance Verify | Check insurance | 1. Select patient 2. Verify insurance details | Insurance status displayed |
| O12 | Prescription View | View prescription | 1. Select patient 2. View prescriptions | Prescription list shown |
| O13 | Prescription View | Print prescription | 1. Select prescription 2. Click Print | PDF generated |
| O14 | Biometric Enroll | Enroll face | 1. Go to Biometric 2. Capture face 3. Save | Face enrolled for patient |
| O15 | Staff Coordinate | View OPD staff | 1. Go to Staff Management 2. View OPD team | Staff list displayed |
| O16 | Notifications | View alerts | 1. Check notifications | OPD-related notifications shown |
| O17 | Services View | Browse departments | 1. Go to Hospital Services 2. Expand departments | Services listed |
| O18 | Services Search | Search service | 1. Search by name | Matching services shown |
| O19 | Services View | Cannot edit | 1. Attempt to modify | No edit buttons visible (read-only) |

---

# 5. PATIENT FEATURES & TEST CASES

| # | Feature | Description | Module |
|---|---------|-------------|--------|
| 1 | Portal Dashboard | View dashboard | Dashboard |
| 2 | Appointment Book | Book appointment | OPD Booking |
| 3 | Doctor Browse | Browse doctors | OPD Booking |
| 4 | Slot Selection | Select time slot | OPD Booking |
| 5 | Appointment Cancel | Cancel appointment | OPD Booking |
| 6 | Health Records | View records | Health Records |
| 7 | Report Download | Download reports | Health Records |
| 8 | Lab Results | View lab results | Test Results |
| 9 | Prescription View | View prescriptions | Prescriptions |
| 10 | Medication Schedule | View med schedule | Prescriptions |
| 11 | Admission Track | Track admission | Admission Tracking |
| 12 | Chatbot Use | Ask questions | Chatbot Service |
| 13 | Notifications | View notifications | Notification Service |
| 14 | Profile Update | Update profile | Profile |
| 15 | Services View | Browse services | Hospital Services |
| 16 | Services Search | Search services | Hospital Services |

## PATIENT TEST CASES

| TC# | Feature | Test Case | Steps | Expected Result |
|-----|---------|-----------|-------|-----------------|
| P01 | Portal Dashboard | View summary | 1. Login 2. View dashboard | Appointments, health summary shown |
| P02 | Doctor Browse | Search by specialty | 1. Go to OPD Booking 2. Select specialty | Doctors of specialty listed |
| P03 | Doctor Browse | View doctor profile | 1. Select doctor 2. View profile | Doctor details, schedule shown |
| P04 | Appointment Book | Book new appointment | 1. Select doctor 2. Choose date 3. Select slot 4. Confirm | Appointment booked |
| P05 | Slot Selection | View available slots | 1. Select doctor 2. Select date | Available slots highlighted |
| P06 | Slot Selection | Select unavailable | 1. Click booked slot | Cannot select, marked unavailable |
| P07 | Appointment Cancel | Cancel appointment | 1. View appointment 2. Click Cancel 3. Confirm | Appointment cancelled |
| P08 | Health Records | View history | 1. Go to Health Records 2. Browse records | Medical history displayed |
| P09 | Report Download | Download as PDF | 1. Select record 2. Click Download | PDF downloaded |
| P10 | Lab Results | View lab report | 1. Go to Test Results 2. Select test | Lab report displayed |
| P11 | Lab Results | View historical | 1. View all past results | Historical results shown |
| P12 | Prescription View | View prescription | 1. Go to Prescriptions 2. Select prescription | Prescription details shown |
| P13 | Medication Schedule | View schedule | 1. View prescription 2. Check schedule | Medication times displayed |
| P14 | Admission Track | Check admission | 1. Go to Admission Tracking | Admission status, bed info shown |
| P15 | Chatbot Use | Ask health question | 1. Open Chatbot 2. Ask question | Health information provided |
| P16 | Chatbot Use | Ask about appointment | 1. Ask about booking | Appointment help provided |
| P17 | Notifications | View reminders | 1. Check notifications | Appointment reminders shown |
| P18 | Profile Update | Update phone | 1. Go to Profile 2. Edit phone 3. Save | Phone number updated |
| P19 | Profile Update | Update emergency contact | 1. Edit emergency contact 2. Save | Contact updated |
| P20 | Services View | Browse services | 1. Go to Hospital Services 2. View list | Services displayed (read-only) |
| P21 | Services Search | Search service | 1. Type service name 2. View | Matching services shown |
| P22 | Services View | Cannot edit | 1. Try to modify | No edit options (read-only) |

---

# 6. PATHOLOGY LAB FEATURES & TEST CASES

| # | Feature | Description | Module |
|---|---------|-------------|--------|
| 1 | Lab Dashboard | View dashboard | Dashboard |
| 2 | Order View | View test orders | Test Order Management |
| 3 | Order Priority | Prioritize orders | Test Order Management |
| 4 | Sample Collection | Collect samples | Sample Collection |
| 5 | Barcode Generate | Generate barcode | Sample Collection |
| 6 | Sample Reject | Reject sample | Sample Collection |
| 7 | Test Processing | Process samples | Test Processing |
| 8 | Batch Processing | Process batch | Test Processing |
| 9 | Result Entry | Enter results | Result Entry |
| 10 | Result Validation | Validate results | Result Entry |
| 11 | Critical Alert | Flag critical | Result Entry |
| 12 | Report Generate | Generate report | Report Generation |
| 13 | Report Delivery | Deliver report | Report Generation |
| 14 | Daily QC | Run daily QC | Quality Control |
| 15 | EQAS Record | Record EQAS | Quality Control |
| 16 | Lab Inventory | Manage supplies | Lab Inventory |
| 17 | Expiry Track | Track expiry | Lab Inventory |
| 18 | Notifications | View notifications | Notification Service |
| 19 | Services View | Browse lab tests | Hospital Services |
| 20 | Services Search | Search tests | Hospital Services |

## PATHOLOGY LAB TEST CASES

| TC# | Feature | Test Case | Steps | Expected Result |
|-----|---------|-----------|-------|-----------------|
| L01 | Lab Dashboard | View pending | 1. Login 2. View dashboard | Pending tests count shown |
| L02 | Order View | View orders | 1. Go to Test Orders 2. View list | All pending orders displayed |
| L03 | Order View | Filter by priority | 1. Filter by STAT | Only STAT orders shown |
| L04 | Order Priority | Mark as STAT | 1. Select order 2. Change to STAT | Order priority updated |
| L05 | Sample Collection | Collect sample | 1. Select order 2. Record collection 3. Generate barcode | Sample registered, barcode printed |
| L06 | Sample Collection | Record fasting status | 1. Mark as fasting/non-fasting | Status recorded |
| L07 | Sample Collection | Select container | 1. Choose correct tube color | Container recorded |
| L08 | Barcode Generate | Print barcode | 1. Generate barcode 2. Print | Barcode label printed |
| L09 | Sample Reject | Reject hemolyzed | 1. Select sample 2. Reject with reason "Hemolyzed" | Sample rejected, recollection needed |
| L10 | Test Processing | Start processing | 1. Receive sample in lab 2. Mark processing | Processing started |
| L11 | Batch Processing | Process batch | 1. Create batch 2. Add samples 3. Start | Batch processing logged |
| L12 | Result Entry | Enter CBC result | 1. Select test 2. Enter values (Hb, WBC, Platelets) 3. Save | Results saved |
| L13 | Result Entry | Auto-flag abnormal | 1. Enter abnormal value | System flags as High/Low |
| L14 | Critical Alert | Critical value alert | 1. Enter critical value (e.g., K+ 6.8) | Alert generated, notify doctor |
| L15 | Result Validation | Validate results | 1. Review results 2. Click Validate | Results approved for report |
| L16 | Result Validation | Reject for rerun | 1. Review 2. Reject 3. Enter reason | Sent for rerun |
| L17 | Report Generate | Generate individual | 1. Select validated test 2. Generate report | PDF report created |
| L18 | Report Generate | Generate profile | 1. Select multiple tests 2. Generate | Combined profile report |
| L19 | Report Delivery | Email report | 1. Select report 2. Email to patient | Report emailed |
| L20 | Daily QC | Run Level 1 QC | 1. Run QC sample 2. Record result | QC logged |
| L21 | Daily QC | QC failure | 1. Record out-of-range QC | QC flagged, corrective action needed |
| L22 | EQAS Record | Record EQAS result | 1. Enter EQAS program result 2. Save | EQAS documented |
| L23 | Lab Inventory | Check stock | 1. Go to Lab Inventory 2. View reagents | Stock levels shown |
| L24 | Lab Inventory | Request reagent | 1. Select low stock item 2. Create request | Request submitted |
| L25 | Expiry Track | View expiring | 1. Filter by expiry 30 days | Near-expiry items listed |
| L26 | Notifications | View lab alerts | 1. Check notifications | Lab-specific alerts shown |
| L27 | Services View | Browse 1148 tests | 1. Go to Hospital Services 2. View Pathology | All 1148 tests listed |
| L28 | Services Search | Search by test name | 1. Type test name 2. Search | Test found |
| L29 | Services View | Cannot edit | 1. Try to modify test | No edit options (read-only) |

---

# 7. MEDICAL STORE FEATURES & TEST CASES

| # | Feature | Description | Module |
|---|---------|-------------|--------|
| 1 | Store Dashboard | View dashboard | Dashboard |
| 2 | Prescription View | View prescriptions | Prescription Management |
| 3 | Prescription Filter | Filter by status | Prescription Management |
| 4 | Patient Verify | Verify patient | Dispensing |
| 5 | Stock Check | Check availability | Dispensing |
| 6 | Dispense Medicine | Dispense items | Dispensing |
| 7 | Partial Dispense | Partial dispensing | Dispensing |
| 8 | Bill Generate | Generate bill | Billing |
| 9 | GST Calculate | Apply GST | Billing |
| 10 | Payment Process | Process payment | Billing |
| 11 | Insurance Claim | Process insurance | Billing |
| 12 | Substitution | Substitute medicine | Medicine Substitution |
| 13 | Inventory View | View stock | Inventory |
| 14 | Stock Alert | Low stock alert | Inventory |
| 15 | Stock In | Receive stock | Stock Management |
| 16 | Stock Adjust | Adjust stock | Stock Management |
| 17 | Expiry Manage | Manage expiry | Stock Management |
| 18 | Medicine Search | Search database | Medicine Database |
| 19 | Notifications | View notifications | Notification Service |
| 20 | Services View | Browse services | Hospital Services |
| 21 | Services Search | Search services | Hospital Services |

## MEDICAL STORE TEST CASES

| TC# | Feature | Test Case | Steps | Expected Result |
|-----|---------|-----------|-------|-----------------|
| M01 | Store Dashboard | View pending | 1. Login 2. View dashboard | Pending prescriptions count shown |
| M02 | Prescription View | View prescription | 1. Go to Prescriptions 2. Select prescription | Prescription details displayed |
| M03 | Prescription Filter | Filter pending | 1. Filter by PENDING status | Only pending prescriptions shown |
| M04 | Prescription Filter | Filter by date | 1. Select date range | Prescriptions in range shown |
| M05 | Patient Verify | Verify by UHID | 1. Enter UHID 2. Verify | Patient details confirmed |
| M06 | Stock Check | Check medicine stock | 1. Search medicine 2. View stock | Stock level, expiry shown |
| M07 | Stock Check | Out of stock | 1. Check unavailable medicine | Shows "Out of Stock" |
| M08 | Dispense Medicine | Dispense full order | 1. Select prescription 2. Dispense all items 3. Complete | All medicines dispensed, status FULLY_DISPENSED |
| M09 | Dispense Medicine | Record batch | 1. Enter batch number for each item | Batch numbers recorded |
| M10 | Partial Dispense | Dispense available | 1. Dispense available items only 2. Note pending | Status PARTIALLY_DISPENSED |
| M11 | Partial Dispense | Complete later | 1. Stock received 2. Dispense remaining | Status changes to FULLY_DISPENSED |
| M12 | Bill Generate | Create bill | 1. After dispensing 2. Generate bill | Bill with line items created |
| M13 | GST Calculate | Apply 5% GST | 1. Generate bill 2. Verify GST | GST calculated correctly |
| M14 | GST Calculate | Different rates | 1. Bill with multiple GST items | Each rate applied correctly |
| M15 | Payment Process | Cash payment | 1. Enter amount 2. Process cash | Payment recorded, receipt generated |
| M16 | Payment Process | Card payment | 1. Select card 2. Process | Card payment recorded |
| M17 | Payment Process | UPI payment | 1. Select UPI 2. Verify payment | UPI payment recorded |
| M18 | Insurance Claim | Process claim | 1. Verify insurance 2. Calculate co-pay 3. Submit | Claim generated |
| M19 | Substitution | Request substitute | 1. Medicine unavailable 2. Find generic 3. Request approval | Substitution request sent |
| M20 | Substitution | Approve substitute | 1. Doctor approves 2. Dispense substitute | Substitute dispensed |
| M21 | Inventory View | View stock levels | 1. Go to Inventory 2. Browse | All stock displayed |
| M22 | Stock Alert | View low stock | 1. Check alerts | Low stock items highlighted |
| M23 | Stock In | Receive shipment | 1. Enter supplier invoice 2. Add items 3. Confirm | Stock updated, GRN generated |
| M24 | Stock In | Record batch/expiry | 1. Enter batch 2. Enter expiry | Batch and expiry recorded |
| M25 | Stock Adjust | Physical count | 1. Count stock 2. Enter actual 3. Adjust | Stock adjusted, variance logged |
| M26 | Expiry Manage | View expiring 30 days | 1. Filter expiry 30 days | Near-expiry items listed |
| M27 | Expiry Manage | Mark expired | 1. Select expired 2. Mark as expired | Removed from available stock |
| M28 | Medicine Search | Search by brand | 1. Enter brand name | Brand medicine found |
| M29 | Medicine Search | Search by generic | 1. Enter generic name | All brands with generic shown |
| M30 | Medicine Search | View drug schedule | 1. Select medicine | Schedule (H/H1/X/OTC) shown |
| M31 | Notifications | View store alerts | 1. Check notifications | Store-specific alerts shown |
| M32 | Services View | Browse pharmacy services | 1. Go to Hospital Services | Pharmacy services shown |
| M33 | Services Search | Search service | 1. Type service name | Matching services found |
| M34 | Services View | Cannot edit | 1. Try to modify | No edit options (read-only) |

---

# SUMMARY: TOTAL FEATURES BY ROLE

| Role | Total Features | Test Cases |
|------|----------------|------------|
| ADMIN | 41 | 37 |
| DOCTOR | 23 | 29 |
| NURSE | 21 | 26 |
| OPD_MANAGER | 13 | 19 |
| PATIENT | 16 | 22 |
| PATHOLOGY_LAB | 20 | 29 |
| MEDICAL_STORE | 21 | 34 |
| **TOTAL** | **155** | **196** |

---

# CROSS-ROLE TEST CASES (INTEGRATION)

| TC# | Workflow | Test Case | Roles Involved | Steps | Expected Result |
|-----|----------|-----------|----------------|-------|-----------------|
| I01 | OPD Flow | Complete consultation | Patient, OPD, Doctor | 1. Patient books 2. OPD confirms 3. Doctor consults 4. Prescription created | Full flow completed |
| I02 | Lab Flow | Lab order to result | Doctor, Lab | 1. Doctor orders 2. Lab collects 3. Lab processes 4. Doctor views result | Result delivered to doctor |
| I03 | Pharmacy Flow | Prescription to dispense | Doctor, Store | 1. Doctor finalizes 2. Store receives 3. Store dispenses 4. Bill generated | Medicine dispensed |
| I04 | Admission Flow | Admit to discharge | Admin, Doctor, Nurse | 1. Doctor admits 2. Admin allocates bed 3. Nurse monitors 4. Doctor discharges | Complete admission cycle |
| I05 | Emergency Flow | Emergency patient | All roles | 1. Walk-in registered 2. Doctor attends 3. Labs ordered 4. Meds dispensed 5. Admitted | Emergency handled |

---

*HMS Core - Complete Feature & Test Case Documentation*
*Gravity Hospital - December 2024*
