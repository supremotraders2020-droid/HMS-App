# Medical Store User Standard Operating Procedure (SOP)
## HMS Core - Hospital Management System

**Version**: 1.0  
**Effective Date**: December 2024  
**Applicable To**: All Medical Store Staff at Gravity Hospital  
**Document Type**: User Manual & SOP

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Login Process](#2-login-process)
3. [Medical Store Dashboard Overview](#3-medical-store-dashboard-overview)
4. [Prescription Management](#4-prescription-management)
5. [Medicine Dispensing](#5-medicine-dispensing)
6. [Inventory Management](#6-inventory-management)
7. [Billing & Invoicing](#7-billing--invoicing)
8. [Medicine Substitution](#8-medicine-substitution)
9. [Stock Management](#9-stock-management)
10. [Medicine Database](#10-medicine-database)
11. [Hospital Services Integration](#11-hospital-services-integration)
12. [Notifications](#12-notifications)
13. [Compliance & Audit](#13-compliance--audit)
14. [Real Data Importance](#14-real-data-importance)
15. [Best Practices](#15-best-practices)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Introduction

### 1.1 Purpose
This Standard Operating Procedure provides comprehensive guidance for Medical Store staff using the HMS Core Hospital Management System. It covers all features for pharmacy operations including prescription handling, medicine dispensing, billing, and inventory management.

### 1.2 Scope
This SOP applies to all pharmacy personnel with the MEDICAL_STORE role in HMS Core, including:
- Pharmacists
- Pharmacy Technicians
- Store Managers
- Dispensing Staff
- Pharmacy Assistants

### 1.3 Medical Store Types

HMS Core supports two types of medical stores:

| Store Type | Description |
|------------|-------------|
| IN_HOUSE | Hospital's internal pharmacy |
| THIRD_PARTY | External pharmacy partners |

### 1.4 Medical Store Role Capabilities

| Feature | Access Level |
|---------|-------------|
| Dashboard | Full Access (Store-specific view) |
| Prescription Viewing | View hospital prescriptions |
| Medicine Dispensing | Full Access |
| Billing & Invoicing | Full Access |
| Medicine Substitution | Request/Approve |
| Store Inventory | Full Access |
| Medicine Database | Full Access |
| Hospital Services | View Medicine Services |
| Notifications | Store-related notifications |

### 1.5 Features NOT Available to Medical Store Users

| Feature | Reason |
|---------|--------|
| User Management | Admin function |
| Hospital Settings | Admin function |
| System Settings | Admin function |
| Patient Tracking | Clinical function |
| OPD Service | OPD Manager function |
| Prescription Creation | Doctor function |
| Consent Forms | Doctor/Admin function |
| Patient Monitoring | Nursing function |
| AI Analytics | Admin function |

### 1.6 Medical Store Responsibilities in HMS Core

- Receive and process prescriptions
- Dispense medications accurately
- Manage store inventory
- Handle medicine substitutions
- Generate bills and invoices
- Maintain compliance records
- Track stock levels and expiry
- Coordinate with clinical staff

---

## 2. Login Process

### 2.1 Step-by-Step Login

**Step 1: Access the Application**
- Open your web browser (Chrome, Firefox, Edge recommended)
- Navigate to the HMS Core URL provided by IT department
- The login page will display

**Step 2: Enter Credentials**
- Enter your assigned username (format: `store.firstname.lastname`)
- Enter your password
- Click the "Login" button

**Step 3: Authentication**
- The system validates your credentials
- If successful, you will be redirected to the Medical Store Dashboard
- If unsuccessful, check your credentials and try again

### 2.2 Default Medical Store Credentials

| # | Name | Username | Password | Role | Store Type |
|---|------|----------|----------|------|------------|
| 1 | Rajesh Verma | store.rajesh.verma | Store@123 | MEDICAL_STORE | IN_HOUSE |
| 2 | Priya Sharma | store.priya.sharma | Store@123 | MEDICAL_STORE | IN_HOUSE |
| 3 | Sunil Patil | store.sunil.patil | Store@123 | MEDICAL_STORE | IN_HOUSE |
| 4 | Kavita Mehta | store.kavita.mehta | Store@123 | MEDICAL_STORE | THIRD_PARTY |
| 5 | Amit Kulkarni | store.amit.kulkarni | Store@123 | MEDICAL_STORE | THIRD_PARTY |

### 2.3 Security Guidelines
- Never share your login credentials
- Log out when leaving the workstation
- Change password if compromised
- Report any unauthorized access
- Maintain patient prescription confidentiality
- Follow drug control regulations

---

## 3. Medical Store Dashboard Overview

### 3.1 Dashboard Components

The Medical Store Dashboard is designed for efficient pharmacy workflow:

**Welcome Section**
- Personalized greeting with your name
- Current date and time
- Store information (IN_HOUSE/THIRD_PARTY)

**Statistics Cards**
| Card | Information | Action Required |
|------|-------------|-----------------|
| Pending Prescriptions | Prescriptions awaiting dispensing | Process prescriptions |
| Today's Dispensed | Medicines dispensed today | Track daily volume |
| Low Stock Items | Items below reorder level | Reorder stock |
| Pending Bills | Bills awaiting payment | Follow up |
| Expiring Soon | Medicines expiring within 30 days | Manage expiry |

**Quick Actions**
- View Pending Prescriptions
- Dispense Medicine
- Check Stock
- Generate Bill
- View Low Stock Alerts

**Recent Activity**
- Prescriptions received
- Medicines dispensed
- Bills generated
- Stock updates

### 3.2 Navigation Sidebar

The Medical Store sidebar shows accessible modules:

| Menu Item | Function |
|-----------|----------|
| Dashboard | Return to main dashboard |
| Prescriptions | View and process prescriptions |
| Dispensing | Medicine dispensing workflow |
| Inventory | Manage store inventory |
| Billing | Generate and manage bills |
| Medicine Database | Search medicine catalog |
| Stock Management | Stock in/out, expiry tracking |
| Hospital Services | View medicine services |
| Notifications | View store notifications |

---

## 4. Prescription Management

### 4.1 Purpose
View and process prescriptions from hospital doctors.

### 4.2 Prescription Sharing Flow

```
Doctor Creates Prescription → Finalized → Available to Medical Store → Patient Collects → Dispensed
```

### 4.3 Viewing Prescriptions

**Step 1: Navigate to Prescriptions**
- Click "Prescriptions" in sidebar

**Step 2: View Prescription List**
| Filter | Options |
|--------|---------|
| Status | Pending, Partially Dispensed, Fully Dispensed |
| Date | Today, This Week, Custom Range |
| Patient | Search by name or UHID |
| Doctor | Filter by prescribing doctor |

**Step 3: Prescription Information**
| Field | Description |
|-------|-------------|
| Prescription ID | Unique identifier (PR-YYYY-NNNN) |
| Patient Name | Patient details |
| UHID | Unique Hospital ID |
| Doctor | Prescribing physician |
| Date | Prescription date |
| Medicines | List of prescribed medicines |
| Status | Pending, Partially, Fully Dispensed |

### 4.4 Prescription Status Workflow

| Status | Description |
|--------|-------------|
| PENDING | Not yet dispensed |
| PARTIALLY_DISPENSED | Some medicines dispensed |
| FULLY_DISPENSED | All medicines dispensed |

### 4.5 Prescription Details

**Opening Prescription:**
1. Click on prescription in list
2. View full prescription details:

| Section | Content |
|---------|---------|
| Patient Info | Name, Age, Gender, UHID |
| Doctor Info | Name, Specialty, Registration |
| Clinical | Diagnosis, Complaints |
| Medicines | Drug list with dosage |
| Instructions | Special instructions |
| Vitals | Recorded vitals (if any) |

### 4.6 Medicine List in Prescription

| Field | Description |
|-------|-------------|
| Medicine Name | Drug name (brand/generic) |
| Dosage Form | Tablet, Capsule, Syrup, etc. |
| Strength | 500mg, 250mg, etc. |
| Frequency | Once daily, Twice daily, etc. |
| Duration | Number of days |
| Quantity | Total quantity needed |
| Instructions | Before/After food, etc. |

---

## 5. Medicine Dispensing

### 5.1 Purpose
Accurately dispense medicines as per prescriptions.

### 5.2 Dispensing Workflow

```
Select Prescription → Verify Patient → Check Stock → Dispense → Bill → Complete
```

### 5.3 Step-by-Step Dispensing

**Step 1: Select Prescription**
- Open pending prescription
- Click "Dispense"

**Step 2: Verify Patient Identity**
- Confirm patient name and UHID
- Check patient photo if available
- Verify prescription date validity

**Step 3: Review Medicines**
| Check | Action |
|-------|--------|
| Stock Availability | Verify in-stock items |
| Expiry Date | Check not expired |
| Batch Number | Record for traceability |
| Quantity | Match prescription quantity |

**Step 4: Dispense Each Medicine**
1. Scan or select medicine
2. Enter quantity dispensed
3. Record batch number
4. Note expiry date
5. Mark as dispensed

**Step 5: Handle Partial Dispensing**
- If some medicines unavailable:
  - Mark available items as dispensed
  - Note pending items
  - Status becomes "Partially Dispensed"
  - Schedule follow-up

**Step 6: Complete Dispensing**
- All items dispensed
- Generate bill
- Print receipt
- Patient signature (if required)

### 5.4 Dispensing Record

| Field | Description |
|-------|-------------|
| Dispensing ID | Unique transaction ID |
| Prescription ID | Linked prescription |
| Patient | Patient details |
| Dispensed By | Your name |
| Date/Time | When dispensed |
| Medicines | List with batch/expiry |
| Bill Number | Linked bill |

### 5.5 Partial Dispensing

**When to use:**
- Medicine out of stock
- Insufficient quantity
- Patient financial constraints
- Insurance coverage limits

**Process:**
1. Dispense available items
2. Document pending items
3. Status: PARTIALLY_DISPENSED
4. Patient notified when stock arrives
5. Complete dispensing later

---

## 6. Inventory Management

### 6.1 Purpose
Manage medical store inventory efficiently.

### 6.2 Inventory Dashboard

| Metric | Description |
|--------|-------------|
| Total Items | Number of unique medicines |
| In Stock | Items with available quantity |
| Low Stock | Below reorder level |
| Out of Stock | Zero quantity |
| Expiring Soon | Within 30/60/90 days |

### 6.3 Viewing Inventory

**Step 1: Navigate to Inventory**
- Click "Inventory" in sidebar

**Step 2: View Stock List**
| Column | Description |
|--------|-------------|
| Medicine Name | Drug name |
| Category | Tablet, Syrup, etc. |
| Current Stock | Available quantity |
| Reorder Level | Minimum stock threshold |
| Unit | Strips, Bottles, etc. |
| MRP | Maximum retail price |
| Expiry | Nearest expiry date |

**Step 3: Filter Inventory**
| Filter | Options |
|--------|---------|
| Category | Tablet, Capsule, Syrup, Injection |
| Stock Status | In Stock, Low, Out of Stock |
| Expiry | Within 30, 60, 90 days |
| Manufacturer | Filter by company |

### 6.4 Stock Alerts

| Alert Type | Trigger | Action |
|------------|---------|--------|
| Low Stock | Below reorder level | Reorder |
| Out of Stock | Zero quantity | Urgent reorder |
| Expiring | Within 30 days | Return/Consume |
| Expired | Past expiry date | Remove from stock |

---

## 7. Billing & Invoicing

### 7.1 Purpose
Generate bills and manage payments for dispensed medicines.

### 7.2 Bill Generation

**Step 1: After Dispensing**
- Click "Generate Bill"

**Step 2: Bill Details**
| Field | Description |
|-------|-------------|
| Bill Number | Auto-generated |
| Patient | Patient details |
| Date | Bill date |
| Items | Dispensed medicines |
| Quantity | Each item quantity |
| Rate | Unit price |
| Amount | Item total |
| Discount | Applied discounts |
| GST | Tax amount |
| Total | Final amount |

### 7.3 GST Calculation

| GST Rate | Applicable Items |
|----------|------------------|
| 0% | Essential medicines |
| 5% | Most medicines |
| 12% | Certain categories |
| 18% | Non-essential items |

### 7.4 Payment Methods

| Method | Process |
|--------|---------|
| CASH | Receive cash, give change |
| CARD | Process card payment |
| UPI | Scan QR, verify payment |
| INSURANCE | Verify coverage, claim |

### 7.5 Insurance Billing

**Process:**
1. Verify patient insurance
2. Check medicine coverage
3. Calculate patient co-pay
4. Generate insurance claim
5. Submit for reimbursement

### 7.6 Bill Status

| Status | Description |
|--------|-------------|
| PENDING | Awaiting payment |
| PAID | Fully paid |
| PARTIAL | Partially paid |
| CANCELLED | Bill cancelled |

### 7.7 Print/Export

- Print bill for patient
- Print duplicate for records
- Export to PDF
- Email to patient

---

## 8. Medicine Substitution

### 8.1 Purpose
Handle generic or alternative medicine substitutions.

### 8.2 When to Substitute

| Reason | Action |
|--------|--------|
| Original unavailable | Offer equivalent |
| Patient preference | Generic option |
| Cost concern | Lower-cost alternative |
| Insurance coverage | Covered medicine |

### 8.3 Substitution Process

**Step 1: Identify Need**
- Medicine out of stock
- Patient requests alternative

**Step 2: Find Equivalent**
- Search by generic name
- Check composition match
- Verify dosage equivalence

**Step 3: Request Approval**
- If prescription medicine:
  - Contact prescribing doctor
  - Document approval
  - Substitute with consent

**Step 4: Record Substitution**
| Field | Description |
|-------|-------------|
| Original Medicine | Prescribed medicine |
| Substitute | Alternative dispensed |
| Reason | Why substituted |
| Approved By | Doctor/Patient consent |
| Date/Time | When substituted |

### 8.4 Substitution Rules

| Rule | Requirement |
|------|-------------|
| Same Generic | Must match generic composition |
| Same Strength | Same dosage strength |
| Same Form | Same dosage form (Tab/Cap) |
| Approval | Doctor approval for Schedule H/H1 |
| Documentation | Complete substitution record |

---

## 9. Stock Management

### 9.1 Purpose
Manage stock intake, transfers, and adjustments.

### 9.2 Stock In (Receiving)

**Step 1: Receive Shipment**
- Verify against purchase order
- Check quantity and condition

**Step 2: Record Stock In**
| Field | Description |
|-------|-------------|
| Supplier | Vendor name |
| Invoice No | Supplier invoice |
| Date | Receipt date |
| Items | Medicine list |
| Batch | Batch numbers |
| Expiry | Expiry dates |
| Quantity | Received quantity |
| Rate | Purchase price |

**Step 3: Update Inventory**
- Scan or enter items
- System updates stock
- Generate GRN (Goods Receipt Note)

### 9.3 Stock Out

**Types of Stock Out:**
| Type | Description |
|------|-------------|
| Dispensing | Patient sales |
| Transfer | To other department |
| Return | To supplier |
| Expired | Expired stock removal |
| Damaged | Damaged stock removal |

### 9.4 Expiry Management

**Expiry Tracking:**
1. View expiring items (30/60/90 days)
2. Plan consumption or return
3. Mark as expired when due
4. Document disposal
5. Update inventory

**FIFO (First In, First Out):**
- Dispense older batches first
- Track by batch date
- Minimize wastage

### 9.5 Stock Adjustment

**When to Adjust:**
- Physical count variance
- Damage or breakage
- Theft or loss

**Process:**
1. Click "Stock Adjustment"
2. Select medicine
3. Enter actual count
4. System calculates difference
5. Enter reason
6. Approve adjustment

---

## 10. Medicine Database

### 10.1 Purpose
Access comprehensive medicine information.

### 10.2 Searching Medicines

**Step 1: Navigate to Medicine Database**
- Click "Medicine Database" in sidebar

**Step 2: Search Options**
| Search By | Example |
|-----------|---------|
| Brand Name | Crocin, Dolo |
| Generic Name | Paracetamol |
| Composition | Paracetamol 500mg |
| Manufacturer | Cipla, Sun Pharma |
| Category | Analgesic, Antibiotic |

### 10.3 Medicine Information

| Field | Description |
|-------|-------------|
| Brand Name | Commercial name |
| Generic Name | Chemical name |
| Composition | Active ingredients |
| Strength | Dosage strength |
| Form | Tablet, Capsule, Syrup |
| Pack Size | Units per pack |
| MRP | Maximum retail price |
| Manufacturer | Company name |
| Schedule | H, H1, X, OTC |
| Uses | Common indications |
| Side Effects | Known side effects |
| Contraindications | When not to use |

### 10.4 Drug Schedules

| Schedule | Requirement |
|----------|-------------|
| Schedule H | Prescription required |
| Schedule H1 | Strict prescription, record keeping |
| Schedule X | Special license required |
| OTC | Over the counter, no prescription |

---

## 11. Hospital Services Integration

### 11.1 Accessing Medicine Services

The HMS Core Hospital Services module includes comprehensive pharmacy services:

**Step 1: Navigate to Hospital Services**
- Click "Hospital Services" in sidebar

**Step 2: Filter by Medical Store**
- Select relevant departments
- Browse available services

### 11.2 Service Categories for Medical Store

| Category | Services |
|----------|----------|
| Dispensing | Medicine dispensing charges |
| Consultation | Pharmacist consultation |
| Compounding | Custom formulation |
| Delivery | Home delivery services |
| Emergency | Emergency dispensing |

---

## 12. Notifications

### 12.1 Notification Types

| Type | Description |
|------|-------------|
| New Prescription | Prescription received |
| Low Stock | Stock below threshold |
| Expiry Alert | Medicine expiring soon |
| Payment Due | Pending bill reminder |
| Substitution Request | Approval needed |
| Stock Received | Inventory updated |

### 12.2 Viewing Notifications

**Step 1: Access Notifications**
- Click bell icon in header

**Step 2: View Notification List**
- Priority indicators
- Timestamps
- Action buttons

**Step 3: Respond to Notifications**
- Mark as read
- Take required action
- Document response

---

## 13. Compliance & Audit

### 13.1 Regulatory Compliance

| Regulation | Requirement |
|------------|-------------|
| Drug Control | License display, record keeping |
| GST | Proper billing and returns |
| Schedule H/H1 | Prescription records |
| Narcotics | Special register maintenance |
| FSSAI | Food/supplement licensing |

### 13.2 Record Keeping

| Record | Retention |
|--------|-----------|
| Prescriptions | 2 years |
| Bills | 7 years |
| Purchase Records | 5 years |
| Narcotics Register | 5 years |
| Expiry Returns | 3 years |

### 13.3 Audit Trail

Every transaction logged:
- User who performed action
- Timestamp
- Action details
- Before/after values
- IP address

---

## 14. Real Data Importance

### 14.1 Why Accurate Store Data is Critical

| Data | Impact |
|------|--------|
| Stock Levels | Availability for patients |
| Expiry Dates | Patient safety |
| Batch Numbers | Traceability |
| Billing | Revenue accuracy |
| Substitutions | Treatment effectiveness |

### 14.2 Data Entry Standards

| Standard | Practice |
|----------|----------|
| Accuracy | Double-check all entries |
| Timeliness | Update stock immediately |
| Completeness | Record all batch/expiry info |
| Verification | Verify prescription authenticity |

### 14.3 Impact of Errors

| Error | Consequence |
|-------|-------------|
| Wrong medicine | Patient harm |
| Quantity error | Under/over treatment |
| Expiry missed | Patient safety risk |
| Billing error | Revenue loss/overcharge |
| Stock mismatch | Availability issues |

---

## 15. Best Practices

### 15.1 Dispensing Safety
- Verify prescription authenticity
- Confirm patient identity
- Check for drug interactions
- Explain usage to patient
- Document completely

### 15.2 Inventory Management
- Regular stock counts
- FIFO for stock rotation
- Monitor expiry dates
- Maintain reorder levels
- Document all movements

### 15.3 Billing Accuracy
- Verify item prices
- Apply correct GST
- Process insurance properly
- Issue proper receipts
- Maintain records

### 15.4 Communication
- Notify doctors of unavailable medicines
- Inform patients of substitutions
- Respond to queries promptly
- Escalate issues appropriately

---

## 16. Troubleshooting

### 16.1 Common Issues

| Issue | Solution |
|-------|----------|
| Prescription not visible | Check status, refresh |
| Stock discrepancy | Physical count, adjust |
| Billing error | Void and recreate |
| System slow | Check network, contact IT |
| Print failure | Check printer connection |

### 16.2 Escalation Path

1. Store Staff → Store Manager
2. Store Manager → Pharmacy Head
3. Pharmacy Head → Hospital Administration

### 16.3 Support Contacts

| Issue Type | Contact |
|------------|---------|
| Technical | IT Helpdesk |
| Regulatory | Compliance Officer |
| Supplier | Procurement |
| Clinical | Medical Director |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | December 2024 | Initial release |

---

*This SOP is proprietary to Gravity Hospital and HMS Core development team.*
