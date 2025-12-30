# Pathology Lab User Standard Operating Procedure (SOP)
## HMS Core - Hospital Management System

**Version**: 1.0  
**Effective Date**: December 2024  
**Applicable To**: All Pathology Lab Staff at Gravity Hospital  
**Document Type**: User Manual & SOP

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Login Process](#2-login-process)
3. [Pathology Lab Dashboard Overview](#3-pathology-lab-dashboard-overview)
4. [Test Order Management](#4-test-order-management)
5. [Sample Collection](#5-sample-collection)
6. [Test Processing](#6-test-processing)
7. [Result Entry & Validation](#7-result-entry--validation)
8. [Report Generation](#8-report-generation)
9. [Quality Control](#9-quality-control)
10. [Inventory Management](#10-inventory-management)
11. [Equipment Maintenance](#11-equipment-maintenance)
12. [Hospital Services Integration](#12-hospital-services-integration)
13. [Notifications](#13-notifications)
14. [Real Data Importance](#14-real-data-importance)
15. [Best Practices](#15-best-practices)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Introduction

### 1.1 Purpose
This Standard Operating Procedure provides comprehensive guidance for Pathology Lab staff using the HMS Core Hospital Management System. It covers all features for laboratory operations including test management, sample processing, result entry, and quality control.

### 1.2 Scope
This SOP applies to all laboratory personnel with the PATHOLOGY_LAB role in HMS Core, including:
- Lab Technicians
- Lab Supervisors
- Phlebotomists
- Lab Managers
- Biochemists
- Microbiologists
- Histopathologists

### 1.3 Pathology Lab Role Capabilities

| Feature | Access Level |
|---------|-------------|
| Dashboard | Full Access (Lab-specific view) |
| Test Order Management | Full Access |
| Sample Collection | Full Access |
| Test Processing | Full Access |
| Result Entry | Full Access |
| Report Generation | Full Access |
| Quality Control | Full Access |
| Lab Inventory | Full Access |
| Equipment Status | View Access |
| Hospital Services | View Lab Services (1,148 tests) |
| Notifications | Lab-related notifications |

### 1.4 Features NOT Available to Pathology Lab Users

| Feature | Reason |
|---------|--------|
| User Management | Admin function |
| Hospital Settings | Admin function |
| System Settings | Admin function |
| Patient Tracking | Clinical function |
| OPD Service | OPD Manager function |
| Prescriptions | Doctor function |
| Consent Forms | Doctor/Admin function |
| Biomedical Waste | Admin/Nurse function |
| AI Analytics | Admin function |

### 1.5 Pathology Lab Responsibilities in HMS Core

- Process laboratory test orders
- Collect and manage patient samples
- Perform and document tests
- Enter and validate results
- Generate lab reports
- Maintain quality control records
- Manage lab inventory and supplies
- Coordinate with clinical staff

---

## 2. Login Process

### 2.1 Step-by-Step Login

**Step 1: Access the Application**
- Open your web browser (Chrome, Firefox, Edge recommended)
- Navigate to the HMS Core URL provided by IT department
- The login page will display

**Step 2: Enter Credentials**
- Enter your assigned username (format: `lab.firstname.lastname`)
- Enter your password
- Click the "Login" button

**Step 3: Authentication**
- The system validates your credentials
- If successful, you will be redirected to the Pathology Lab Dashboard
- If unsuccessful, check your credentials and try again

### 2.2 Default Pathology Lab Credentials

| # | Name | Username | Password | Role | Department |
|---|------|----------|----------|------|------------|
| 1 | Dr. Ramesh Kulkarni | lab.ramesh.kulkarni | Lab@123 | PATHOLOGY_LAB | Biochemistry |
| 2 | Priya Mehta | lab.priya.mehta | Lab@123 | PATHOLOGY_LAB | Hematology |
| 3 | Sunil Patel | lab.sunil.patel | Lab@123 | PATHOLOGY_LAB | Microbiology |
| 4 | Kavita Sharma | lab.kavita.sharma | Lab@123 | PATHOLOGY_LAB | Histopathology |
| 5 | Amit Deshmukh | lab.amit.deshmukh | Lab@123 | PATHOLOGY_LAB | Clinical Pathology |

### 2.3 Security Guidelines
- Never share your login credentials
- Log out when leaving the workstation
- Change password if compromised
- Report any unauthorized access
- Use only assigned computers
- Maintain patient data confidentiality

---

## 3. Pathology Lab Dashboard Overview

### 3.1 Dashboard Components

The Pathology Lab Dashboard is designed for efficient lab workflow:

**Welcome Section**
- Personalized greeting with your name
- Current date and time
- Lab section information

**Statistics Cards**
| Card | Information | Action Required |
|------|-------------|-----------------|
| Pending Tests | Tests awaiting processing | Process samples |
| Samples Today | Samples collected today | Track collections |
| Results Pending | Tests awaiting result entry | Enter results |
| Critical Values | Abnormal results needing alert | Notify immediately |
| Reports Ready | Reports awaiting delivery | Distribute reports |

**Quick Actions**
- View Pending Tests
- Collect Sample
- Enter Result
- Generate Report
- View Quality Control

**Recent Activity**
- Sample collections
- Tests completed
- Results validated
- Reports generated

### 3.2 Navigation Sidebar

The Pathology Lab sidebar shows accessible modules:

| Menu Item | Function |
|-----------|----------|
| Dashboard | Return to main dashboard |
| Test Orders | View and manage test orders |
| Sample Collection | Manage sample collection |
| Test Processing | Process and track tests |
| Result Entry | Enter test results |
| Reports | Generate and view reports |
| Quality Control | QC records and logs |
| Lab Inventory | Manage lab supplies |
| Hospital Services | View available lab tests |
| Notifications | View lab notifications |

---

## 4. Test Order Management

### 4.1 Purpose
Manage laboratory test orders received from doctors and OPD.

### 4.2 Viewing Test Orders

**Step 1: Navigate to Test Orders**
- Click "Test Orders" in sidebar

**Step 2: View Order List**
- All pending test orders displayed
- Filter by priority, date, or test type

**Step 3: Order Information**
| Field | Description |
|-------|-------------|
| Order ID | Unique order identifier |
| Patient Name | Patient details |
| UHID | Unique Hospital ID |
| Ordering Doctor | Doctor who ordered |
| Tests Ordered | List of tests |
| Priority | Routine, Urgent, STAT |
| Order Date/Time | When ordered |
| Status | Pending, In Progress, Completed |

### 4.3 Test Order Status Workflow

```
ORDERED → SAMPLE_COLLECTED → PROCESSING → RESULT_ENTERED → VALIDATED → REPORTED
```

### 4.4 Prioritizing Orders

| Priority | TAT (Turnaround Time) | Action |
|----------|----------------------|--------|
| STAT | 1-2 hours | Immediate processing |
| Urgent | 4-6 hours | Priority processing |
| Routine | 24-48 hours | Standard processing |

### 4.5 Available Test Categories

HMS Core includes 1,148 pathology tests across categories:

| Category | Test Count | Examples |
|----------|------------|----------|
| Hematology | 180+ | CBC, ESR, Blood Film |
| Biochemistry | 250+ | LFT, KFT, Lipid Profile |
| Microbiology | 150+ | Culture, Sensitivity |
| Serology | 120+ | ELISA, Rapid Tests |
| Histopathology | 100+ | Biopsy, FNAC |
| Clinical Pathology | 150+ | Urine, Stool |
| Immunology | 80+ | ANA, RF |
| Endocrinology | 90+ | Thyroid, Hormones |
| Tumor Markers | 40+ | CEA, AFP, PSA |
| Genetics | 50+ | DNA, PCR |

---

## 5. Sample Collection

### 5.1 Purpose
Document and manage patient sample collection.

### 5.2 Sample Collection Process

**Step 1: Receive Collection Request**
- View pending collections from orders
- Verify patient identity

**Step 2: Collect Sample**
1. Verify patient details (name, UHID, DOB)
2. Check test requirements (fasting, timing)
3. Prepare collection containers
4. Collect appropriate sample
5. Label with barcode

**Step 3: Record Collection**
| Field | Description |
|-------|-------------|
| Sample ID | Auto-generated barcode |
| Sample Type | Blood, Urine, Stool, Tissue, etc. |
| Collection Time | Date and time |
| Collector Name | Your name |
| Volume/Quantity | Amount collected |
| Container Type | Tube color, container |
| Fasting Status | Fasting/Non-fasting |
| Special Handling | Cold chain, light protection |

### 5.3 Sample Types and Containers

| Sample Type | Container | Color Code | Tests |
|-------------|-----------|------------|-------|
| Serum | SST | Yellow/Red | Biochemistry |
| Plasma | EDTA | Purple | Hematology |
| Whole Blood | EDTA | Purple | CBC, Blood Film |
| Plasma (Coagulation) | Citrate | Blue | PT, aPTT |
| Blood Sugar | Fluoride | Gray | Glucose |
| Urine | Sterile Container | - | Urine R/M, Culture |
| Stool | Stool Container | - | Stool R/M, Culture |
| CSF | Sterile Tube | - | CSF Analysis |
| Tissue | Formalin | - | Histopathology |

### 5.4 Sample Rejection Criteria

| Reason | Action |
|--------|--------|
| Hemolyzed sample | Recollect |
| Clotted sample (when not required) | Recollect |
| Insufficient quantity | Recollect |
| Wrong container | Recollect |
| Unlabeled sample | Reject |
| Delayed transport | Recollect |
| Patient ID mismatch | Verify and recollect |

### 5.5 Sample Tracking

- Each sample gets unique barcode
- Scan at each processing step
- Track location and status
- Full chain of custody

---

## 6. Test Processing

### 6.1 Purpose
Document the processing of samples and running of tests.

### 6.2 Processing Workflow

**Step 1: Receive Sample in Lab**
- Scan sample barcode
- Verify sample condition
- Log receipt time

**Step 2: Process Sample**
- Centrifuge if required
- Separate serum/plasma
- Prepare aliquots

**Step 3: Load on Analyzer**
- Select appropriate analyzer
- Load samples with worklist
- Start analysis

**Step 4: Record Processing**
| Field | Description |
|-------|-------------|
| Batch ID | Processing batch number |
| Analyzer | Equipment used |
| Start Time | Analysis start |
| End Time | Analysis completion |
| Technician | Processing technician |

### 6.3 Test Categories and Methods

| Category | Method | Equipment |
|----------|--------|-----------|
| Hematology | Automated Cell Counting | Hematology Analyzer |
| Biochemistry | Spectrophotometry | Auto Analyzer |
| Immunoassay | ELISA, CLIA | Immunoassay Analyzer |
| Microbiology | Culture, PCR | Incubator, PCR Machine |
| Coagulation | Clotting Time | Coagulation Analyzer |
| Blood Banking | Cross Match | Manual/Automated |

---

## 7. Result Entry & Validation

### 7.1 Purpose
Enter, review, and validate test results before reporting.

### 7.2 Result Entry Process

**Step 1: Navigate to Result Entry**
- Click "Result Entry" in sidebar

**Step 2: Select Test Order**
- Search by Order ID, Patient Name, or Sample ID
- Open result entry form

**Step 3: Enter Results**
| Field | Description |
|-------|-------------|
| Test Parameter | Specific test name |
| Result Value | Numeric or text result |
| Unit | Measurement unit |
| Normal Range | Reference range |
| Flag | Normal, High, Low, Critical |
| Method | Testing method used |
| Comments | Additional observations |

**Step 4: Auto-Interpretation**
- System flags abnormal results
- Critical values highlighted
- Panic value alerts generated

### 7.3 Normal Ranges (Examples)

| Test | Normal Range | Critical Low | Critical High |
|------|--------------|--------------|---------------|
| Hemoglobin | Male: 13-17 g/dL, Female: 12-15 g/dL | <7 g/dL | >20 g/dL |
| Fasting Glucose | 70-100 mg/dL | <50 mg/dL | >500 mg/dL |
| Creatinine | 0.7-1.3 mg/dL | - | >10 mg/dL |
| Potassium | 3.5-5.0 mEq/L | <2.5 mEq/L | >6.5 mEq/L |
| Platelet Count | 150,000-400,000/μL | <50,000/μL | >1,000,000/μL |

### 7.4 Result Validation

**Validation Steps:**
1. Review all entered results
2. Check for errors or inconsistencies
3. Compare with previous results (delta check)
4. Verify critical values
5. Approve or reject results

**Validation Status:**
| Status | Meaning |
|--------|---------|
| Pending | Awaiting validation |
| Approved | Validated and ready for report |
| Rejected | Needs rechecking or rerun |
| On Hold | Awaiting clarification |

### 7.5 Critical Value Notification

**When critical value detected:**
1. System generates alert
2. Notify ordering doctor immediately
3. Document notification time
4. Record acknowledgment
5. Update patient record

---

## 8. Report Generation

### 8.1 Purpose
Generate and distribute lab reports to patients and doctors.

### 8.2 Report Types

| Report Type | Content |
|-------------|---------|
| Individual Test | Single test result |
| Profile Report | Multiple related tests |
| Cumulative Report | Historical comparison |
| Preliminary Report | Urgent partial results |
| Final Report | Complete validated results |

### 8.3 Generating Reports

**Step 1: Navigate to Reports**
- Click "Reports" in sidebar

**Step 2: Select Order**
- Search completed orders
- Select order for report

**Step 3: Generate Report**
- Click "Generate Report"
- Review report preview
- Confirm generation

**Step 4: Report Content**
| Section | Information |
|---------|-------------|
| Header | Hospital logo, name, accreditation |
| Patient Info | Name, UHID, Age, Gender, Doctor |
| Sample Info | Collection date, sample type |
| Results | All test results with flags |
| Interpretation | Comments and interpretation |
| Signatures | Technician, Pathologist |
| Footer | Report date, disclaimer |

### 8.4 Report Distribution

| Method | Process |
|--------|---------|
| Print | Generate PDF, print |
| Email | Send to patient email |
| Portal | Available in patient portal |
| SMS | Notification with link |

---

## 9. Quality Control

### 9.1 Purpose
Maintain quality standards through regular QC procedures.

### 9.2 Daily QC Procedures

**Internal Quality Control (IQC)**
1. Run QC samples before patient samples
2. Record QC values
3. Verify within acceptable range
4. Document any deviations

**QC Levels:**
| Level | Purpose |
|-------|---------|
| Level 1 (Low) | Low range accuracy |
| Level 2 (Normal) | Normal range accuracy |
| Level 3 (High) | High range accuracy |

### 9.3 QC Recording

| Field | Description |
|-------|-------------|
| QC Date/Time | When QC performed |
| Analyzer | Equipment used |
| QC Level | Low, Normal, High |
| Expected Value | Target value |
| Obtained Value | Actual result |
| Status | Pass/Fail |
| Action | If failed, corrective action |

### 9.4 Levey-Jennings Charts

- Track QC trends over time
- Identify systematic errors
- Westgard rules applied
- Document out-of-control events

### 9.5 External Quality Assessment (EQAS)

- Participate in external proficiency testing
- Record EQAS results
- Document corrective actions
- Maintain certification records

---

## 10. Inventory Management

### 10.1 Purpose
Manage laboratory supplies and reagents.

### 10.2 Lab Inventory Categories

| Category | Examples |
|----------|----------|
| Reagents | Diagnostic kits, chemicals |
| Consumables | Tubes, containers, pipettes |
| Calibrators | Calibration materials |
| Controls | QC materials |
| Supplies | Gloves, masks, labels |

### 10.3 Managing Inventory

**View Stock**
- Current stock levels
- Expiry dates
- Reorder levels

**Request Stock**
1. Click "Request Stock"
2. Select item
3. Enter quantity
4. Submit request

**Receive Stock**
1. Scan incoming items
2. Verify quantity and expiry
3. Update inventory
4. Store appropriately

### 10.4 Expiry Tracking

- System alerts for near-expiry items
- FIFO (First In, First Out) usage
- Document expired item disposal

---

## 11. Equipment Maintenance

### 11.1 Purpose
Track and maintain laboratory equipment.

### 11.2 Equipment List

| Equipment | Maintenance Frequency |
|-----------|----------------------|
| Hematology Analyzer | Daily, Weekly, Monthly |
| Biochemistry Analyzer | Daily, Weekly, Monthly |
| Centrifuge | Weekly, Monthly |
| Microscope | Daily, Monthly |
| Refrigerator | Daily temperature log |
| Incubator | Daily temperature log |

### 11.3 Maintenance Records

| Field | Description |
|-------|-------------|
| Equipment ID | Unique identifier |
| Maintenance Type | Daily, Calibration, Service |
| Date | When performed |
| Performed By | Technician name |
| Observations | Findings |
| Action Taken | Repairs, replacements |
| Next Due | Next maintenance date |

---

## 12. Hospital Services Integration

### 12.1 Accessing Lab Services Catalog

The HMS Core Hospital Services module includes 1,148 pathology tests:

**Step 1: Navigate to Hospital Services**
- Click "Hospital Services" in sidebar

**Step 2: Filter by Pathology**
- Select "Pathology" department
- Browse available tests

**Step 3: Test Information**
| Field | Description |
|-------|-------------|
| Test Code | Unique test identifier |
| Test Name | Full test name |
| Category | Biochemistry, Hematology, etc. |
| Sample Type | Required sample |
| Container | Collection container |
| TAT | Turnaround time |
| Price | Test cost |
| Preparation | Patient preparation |

### 12.2 Test Categories in Hospital Services

| Category | Test Count |
|----------|------------|
| Hematology | 180+ tests |
| Biochemistry | 250+ tests |
| Microbiology | 150+ tests |
| Serology & Immunology | 120+ tests |
| Histopathology | 100+ tests |
| Clinical Pathology | 150+ tests |
| Endocrinology | 90+ tests |
| Tumor Markers | 40+ tests |
| Genetics & Molecular | 50+ tests |
| Special Tests | 18+ tests |

---

## 13. Notifications

### 13.1 Notification Types

| Type | Description |
|------|-------------|
| New Orders | New test orders received |
| Critical Values | Panic value alerts |
| QC Alerts | QC failures |
| Expiry Alerts | Reagent expiry warnings |
| Equipment Alerts | Maintenance due |
| Result Pending | Results awaiting entry |

### 13.2 Viewing Notifications

**Step 1: Access Notifications**
- Click bell icon in header

**Step 2: View Notification List**
- Priority badges
- Timestamps
- Action buttons

**Step 3: Respond to Notifications**
- Mark as read
- Take required action
- Document response

---

## 14. Real Data Importance

### 14.1 Why Accurate Lab Data is Critical

| Data | Impact |
|------|--------|
| Patient ID | Correct patient, correct report |
| Sample Details | Sample integrity |
| Results | Treatment decisions |
| QC Records | Regulatory compliance |
| Inventory | Supply availability |

### 14.2 Data Entry Standards

| Standard | Practice |
|----------|----------|
| Accuracy | Double-check all entries |
| Timeliness | Enter results promptly |
| Completeness | Fill all required fields |
| Verification | Verify patient identity |

### 14.3 Impact of Errors

| Error | Consequence |
|-------|-------------|
| Wrong patient | Incorrect treatment |
| Wrong result | Misdiagnosis |
| Missed critical value | Delayed treatment |
| Poor QC | Unreliable results |

---

## 15. Best Practices

### 15.1 Sample Handling
- Proper labeling immediately after collection
- Follow cold chain requirements
- Process samples within stability window
- Document all rejections

### 15.2 Result Entry
- Enter results promptly
- Flag abnormal values
- Notify critical values immediately
- Document all comments

### 15.3 Quality Control
- Run QC before patient samples
- Document all QC results
- Investigate out-of-control events
- Maintain calibration records

### 15.4 Communication
- Notify doctors of critical values
- Respond to queries promptly
- Document all communications
- Escalate issues appropriately

---

## 16. Troubleshooting

### 16.1 Common Issues

| Issue | Solution |
|-------|----------|
| Sample barcode not scanning | Enter manually, check printer |
| Result entry error | Contact supervisor to correct |
| QC failure | Rerun QC, check reagents |
| Equipment error | Follow troubleshooting guide |
| System slow | Check network, contact IT |

### 16.2 Escalation Path

1. Lab Technician → Lab Supervisor
2. Lab Supervisor → Lab Manager
3. Lab Manager → Hospital Administration

### 16.3 Support Contacts

| Issue Type | Contact |
|------------|---------|
| Technical | IT Helpdesk |
| Clinical | Lab Manager |
| Equipment | Vendor Support |
| Quality | QA Department |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | December 2024 | Initial release |

---

*This SOP is proprietary to Gravity Hospital and HMS Core development team.*
