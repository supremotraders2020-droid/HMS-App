# Technician Portal - Standard Operating Procedures

## Role Overview

**Role:** TECHNICIAN  
**Department:** Diagnostic Services  
**Access Level:** Specialized diagnostic processing

Diagnostic Technicians are responsible for processing diagnostic test orders from Patient Monitoring, uploading results, and ensuring timely delivery of reports to clinical teams.

---

## Core Responsibilities

### Primary Functions
1. Receive and process diagnostic test orders from Patient Monitoring
2. Collect samples and perform diagnostic procedures
3. Upload test results and reports (PDF/DICOM formats)
4. Maintain quality control standards
5. Ensure timely result delivery

### Scope of Work
| Task | Source | Action Required |
|------|--------|-----------------|
| Diagnostic Tests | Patient Monitoring → Tests Tab | Process in Technician Portal |
| Prescription Tests | Prescription Management | NOT in scope (Medical Store handles) |

---

## Daily Workflow

### Morning Shift Start
1. Log in to Gravity AI Manager
2. Review pending test notifications
3. Check Technician Portal dashboard for queue status
4. Prioritize STAT and critical tests

### Test Processing Workflow

#### Step 1: Review Pending Tests
1. Navigate to **Technician Portal**
2. View **Pending Tests** queue
3. Tests are sorted by priority:
   - STAT (Immediate)
   - Urgent (Within 2 hours)
   - Routine (Same day)
   - Scheduled (As per schedule)

#### Step 2: Accept Test Order
1. Click on test order to view details
2. Verify patient information
3. Check sample requirements
4. Click **Accept** to assign to self

#### Step 3: Sample Collection (if applicable)
1. Confirm patient identity (face recognition/ID)
2. Collect sample per protocol
3. Label sample with barcode
4. Log collection time in system

#### Step 4: Perform Test
1. Follow department-specific protocols
2. Document procedure details
3. Record equipment used
4. Note any anomalies

#### Step 5: Upload Results
1. Enter test results in system
2. Upload report file (PDF/DICOM)
3. Add technician notes if needed
4. Mark test as **Completed**

#### Step 6: Quality Check
1. Review results for accuracy
2. Verify normal/abnormal ranges
3. Flag critical values for immediate attention
4. Submit for pathologist review (if required)

---

## Critical Alerts & Escalation

### Immediate Escalation Required
| Condition | Action |
|-----------|--------|
| Critical Lab Value | Alert nursing station immediately |
| Sample Quality Issue | Contact ordering physician |
| Equipment Malfunction | Report to Biomedical Engineering |
| STAT Test Delay > 30 min | Escalate to Lab Supervisor |

### Critical Value Protocol
1. STOP current work
2. Verify critical value with repeat test
3. Call nursing station directly
4. Document notification in system
5. Log acknowledgment from clinical team

---

## Key Screens & Navigation

### Technician Portal Dashboard
- **Pending Tests**: Queue of tests awaiting processing
- **In Progress**: Tests currently being processed
- **Completed Today**: Today's completed tests
- **Statistics**: Daily/weekly performance metrics

### Test Order Detail View
- Patient demographics
- Test type and priority
- Ordering physician
- Sample requirements
- Special instructions
- Previous results (if available)

### Result Entry Screen
- Structured result input
- Reference range display
- Critical value flags
- Report upload area
- Notes section

---

## Data Entry Standards

### Required Fields for Result Entry
1. Test completion date/time
2. Result values (numeric/text)
3. Units of measurement
4. Interpretation (Normal/Abnormal/Critical)
5. Technician ID (auto-populated)

### Report Upload Requirements
- **Acceptable Formats**: PDF, DICOM
- **File Naming**: PatientID_TestType_Date
- **Maximum Size**: 25MB per file
- **Resolution**: Minimum 300 DPI for images

### Quality Documentation
- Record lot numbers for reagents
- Document calibration status
- Note any procedural deviations
- Include quality control results

---

## Notifications & Handoffs

### Incoming Notifications
| Notification Type | Source | Action |
|-------------------|--------|--------|
| New Test Order | Patient Monitoring | Review and accept |
| STAT Test Alert | System | Prioritize immediately |
| Sample Arrival | Lab Reception | Begin processing |
| QC Alert | Quality System | Review and resolve |

### Outgoing Communications
| Event | Notify | Method |
|-------|--------|--------|
| Critical Result | Nursing Station | Phone + System alert |
| Test Completed | Ordering Physician | System notification |
| Delayed Results | Supervisor | System escalation |
| Equipment Issue | Biomedical Eng. | Work order + call |

---

## Cross-Role Dependencies

### Works With:
- **NURSE**: Receives test orders from Patient Monitoring
- **DOCTOR**: Results visible in patient records
- **PATHOLOGY_LAB**: Complex tests may require pathologist review
- **ADMIN**: Performance reporting and resource allocation

### Does NOT Process:
- Prescription-based test orders (Medical Store workflow)
- Direct physician orders without Patient Monitoring entry
- External lab referrals (separate process)

---

## Important Notes

### Workflow Isolation
The Technician Portal is designed to process ONLY tests ordered through:
- **Patient Monitoring → Tests Tab**

Tests ordered through other channels (prescriptions, direct orders) follow different workflows and do NOT appear in the Technician Portal.

### Report Visibility
Once uploaded, test reports are visible to:
- Ordering physician (DOCTOR role)
- Assigned nursing staff (NURSE role)
- Hospital administrators (ADMIN, SUPER_ADMIN)
- Patient (PATIENT role - via patient portal)

### Audit Trail
All actions are logged including:
- Test acceptance timestamp
- Processing steps
- Result entry
- Report uploads
- Notification acknowledgments

---

## Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| No tests in queue | Verify login credentials, check filter settings |
| Cannot upload report | Check file format and size limits |
| Critical alert not sending | Verify nursing station contact, use phone backup |
| Equipment reading error | Run calibration, document issue, use backup unit |

### Support Contacts
- **Technical Issues**: IT Help Desk
- **Clinical Questions**: Lab Supervisor
- **Equipment Problems**: Biomedical Engineering
- **System Training**: HR/Training Department

---

## Compliance Requirements

### NABH Standards
- Follow sample handling protocols
- Maintain chain of custody
- Document temperature-sensitive handling
- Participate in proficiency testing

### Data Privacy
- Access only assigned patient data
- Do not share login credentials
- Log out when leaving workstation
- Report suspected breaches immediately

---

## Quick Reference

### Keyboard Shortcuts
- `Ctrl + N`: New sample entry
- `Ctrl + S`: Save current work
- `Ctrl + U`: Upload report
- `F5`: Refresh queue
- `Esc`: Cancel current action

### Priority Color Codes
- 🔴 **Red**: STAT - Immediate
- 🟠 **Orange**: Urgent - Within 2 hours
- 🟡 **Yellow**: Routine - Same day
- 🟢 **Green**: Scheduled - As planned

---

*Last Updated: January 2026*  
*Document Owner: Diagnostic Services Department*
