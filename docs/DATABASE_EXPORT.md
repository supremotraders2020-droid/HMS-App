# HMS Core - Database Export

## Database Summary

| Table | Row Count |
|-------|-----------|
| users | 48 |
| doctors | 4 |
| appointments | 92 |
| service_patients | 26 |
| prescriptions | 9 |
| inventory_items | 18 |
| beds | 19 |
| equipment | 11 |
| consent_templates | 14 |
| notifications | 0 |
| activity_logs | 139 |

## Complete Table Listing (105 Tables)

### Core User Management
1. users - User accounts and authentication
2. doctors - Doctor registry
3. doctor_profiles - Extended doctor information
4. patient_profiles - Extended patient information

### Appointment & Scheduling
5. appointments - Patient appointments
6. schedules - Doctor schedules
7. doctor_schedules - Doctor availability
8. doctor_time_slots - Time slot management

### Patient Management
9. service_patients - Patient demographics
10. tracking_patients - Inpatient tracking
11. inventory_patients - Patient inventory usage
12. admissions - Hospital admissions
13. doctor_patients - Doctor-patient assignments

### Medical Records
14. medical_records - Clinical documentation
15. prescriptions - Medication prescriptions
16. prescription_items - Individual prescription items
17. medications - Administered medications
18. medicines - Medicine database

### Patient Monitoring (14 ICU Modules)
19. patient_monitoring_sessions - ICU monitoring sessions
20. vitals - Patient vitals
21. vitals_hourly - Hourly vital readings
22. inotropes_sedation - Inotrope & sedation records
23. ventilator_settings - Ventilator parameters
24. abg_lab_results - ABG & lab values
25. intake_hourly - Intake chart
26. output_hourly - Output chart
27. diabetic_flow - Diabetic monitoring
28. medication_admin_records - Medication administration
29. once_only_drugs - One-time medications
30. nursing_shift_notes - Shift diary
31. airway_lines_tubes - Airway management
32. duty_staff_assignments - Staff on duty
33. patient_allergies_precautions - Allergies & precautions
34. patient_monitoring_audit_log - Audit trail

### Inventory Management
35. inventory_items - Stock items
36. inventory_transactions - Stock transactions
37. staff_members - Staff registry

### Equipment Servicing
38. equipment - Hospital equipment
39. service_history - Service records

### Notification System
40. notifications - Hospital notifications
41. user_notifications - User-specific notifications
42. hospital_team_members - Team directory

### Consent Management
43. consent_templates - Consent form templates
44. consent_forms - Signed consent forms
45. patient_consents - Patient consent records

### Bed Management
46. beds - Hospital beds
47. bed_categories - Bed category definitions
48. bed_allocations - Bed allocation history
49. bed_transfers - Bed transfer records
50. bed_audit_log - Bed change audit trail

### Blood Bank
51. blood_units - Blood unit inventory
52. blood_donors - Donor registry
53. blood_transfusion_orders - Transfusion orders
54. blood_transfusion_reactions - Reaction records
55. blood_storage_facilities - Storage facilities
56. blood_temperature_logs - Temperature monitoring
57. blood_service_groups - Service categories
58. blood_services - Service definitions
59. blood_bank_audit_log - Audit trail

### Oxygen Tracking
60. oxygen_cylinders - Cylinder inventory
61. cylinder_movements - Movement tracking
62. oxygen_consumption - Usage records
63. lmo_readings - LMO readings
64. oxygen_alerts - Low stock alerts

### Biomedical Waste Management
65. bmw_bags - Waste bags
66. bmw_movements - Movement tracking
67. bmw_pickups - Vendor pickups
68. bmw_disposals - Disposal records
69. bmw_vendors - CBWTF vendors
70. bmw_storage_rooms - Storage locations
71. bmw_incidents - Incident reports
72. bmw_reports - Compliance reports

### Swab Contamination Monitoring
73. swab_collection - Swab samples
74. swab_lab_results - Lab results
75. swab_capa_actions - Corrective actions
76. swab_area_master - Area definitions
77. swab_organism_master - Organism catalog
78. swab_sampling_site_master - Sampling sites
79. swab_audit_logs - Audit trail

### Disease Knowledge & Diet
80. disease_catalog - Disease information
81. diet_templates - Diet plans
82. medication_schedule_templates - Med schedules
83. patient_disease_assignments - Patient conditions
84. personalized_care_plans - Care plans

### AI Intelligence Layer
85. ai_analytics_snapshots - Metric snapshots
86. ai_metric_catalog - Metric definitions
87. ai_anomaly_events - Anomaly detection
88. ai_prediction_results - Predictions
89. ai_recommendations - AI suggestions
90. hospital_health_index - Hospital score

### Billing
91. patient_bills - Patient bills
92. bill_payments - Payment records

### Biometric
93. biometric_templates - Biometric data
94. biometric_verifications - Verification logs

### Other
95. activity_logs - System activity
96. conversation_logs - Chatbot logs
97. doctor_oath_confirmations - Daily oath
98. doctor_visits - Doctor visit schedules
99. meals - Patient meals
100. health_tips - Health tip content
101. hospital_settings - System settings
102. resolved_alerts - Resolved critical alerts
103. emergency_contacts - Emergency contacts

---

## Users Data (48 Users)

### ADMIN Users (7)
| Username | Name | Email |
|----------|------|-------|
| admin1 | Rajesh Sharma | rajesh.sharma@gravityhospital.com |
| admin2 | Priya Mehta | priya.mehta@gravityhospital.com |
| admin3 | Amit Patel | amit.patel@gravityhospital.com |
| admin4 | Sunita Rao | sunita.rao@gravityhospital.com |
| admin5 | Vikram Singh | vikram.singh@gravityhospital.com |
| vrushali | Vrushali Narkhede | vrushalinarkhede9@gmail.com |
| rohit | Rohit Sharma | rohit@gravityhospital.com |
| admin | admin | admin@school.com |

### DOCTOR Users (18)
| Username | Name | Email |
|----------|------|-------|
| doctor1 | Dr. Anil Kulkarni | anil.kulkarni@gravityhospital.com |
| doctor2 | Dr. Snehal Patil | snehal.patil@gravityhospital.com |
| doctor3 | Dr. Rahul Deshmukh | rahul.deshmukh@gravityhospital.com |
| doctor4 | Dr. Kavita Joshi | kavita.joshi@gravityhospital.com |
| doctor5 | Dr. Suresh Nair | suresh.nair@gravityhospital.com |
| ROHIT | Rohit Sharma | xyz@gmail.com |
| dr.anil.kulkarni | Dr. Anil Kulkarni | dr.anil.kulkarni@gravityhospital.in |
| dr.snehal.patil | Dr. Snehal Patil | dr.snehal.patil@gravityhospital.in |
| dr.vikram.deshpande | Dr. Vikram Deshpande | dr.vikram.deshpande@gravityhospital.in |
| dr.priyanka.joshi | Dr. Priyanka Joshi | dr.priyanka.joshi@gravityhospital.in |
| doctor | Praful pathak | praful@gravityhospital.com |
| dr.rajesh.bhosale | Dr. Rajesh Bhosale | dr.rajesh.bhosale@gravityhospital.in |
| dr.meena.sharma | Dr. Meena Sharma | dr.meena.sharma@gravityhospital.in |
| dr.sunil.gaikwad | Dr. Sunil Gaikwad | dr.sunil.gaikwad@gravityhospital.in |
| dr.kavita.deshmukh | Dr. Kavita Deshmukh | dr.kavita.deshmukh@gravityhospital.in |
| dr.amit.jadhav | Dr. Amit Jadhav | dr.amit.jadhav@gravityhospital.in |
| dr.sunita.pawar | Dr. Sunita Pawar | dr.sunita.pawar@gravityhospital.in |
| ajay | Ajay | qaz@gmail.com |
| jay | Dr. Jay Gupta | Gupta |
| kapil | Dr. Kapil Saxena | ahjg@gmailcom |
| anil | Dr. Anil Kumar | Kumar |

### NURSE Users (4)
| Username | Name | Email |
|----------|------|-------|
| priya | priya | student@school.com |
| riya | riya | alice@school.com |
| siya | siya | siya@gmail.com |
| tanu | tanu | tanu@gmail.com |

### OPD_MANAGER Users (7)
| Username | Name | Email |
|----------|------|-------|
| opd1 | Sachin Tendulkar | sachin.t@gravityhospital.com |
| opd2 | Neeta Ambani | neeta.a@gravityhospital.com |
| opd3 | Ramesh Iyer | ramesh.i@gravityhospital.com |
| opd4 | Geeta Phogat | geeta.p@gravityhospital.com |
| opd5 | Manish Malhotra | manish.m@gravityhospital.com |
| rahul | Rahul Verma | rahul@gravityhospital.com |
| opd | manager | opd@gravityhospital.com |

### PATIENT Users (12)
| Username | Name | Email |
|----------|------|-------|
| patient1 | Rahul Verma | rahul.verma@gmail.com |
| patient2 | Anjali Kapoor | anjali.kapoor@gmail.com |
| patient3 | Vikas Reddy | vikas.reddy@gmail.com |
| patient4 | Pooja Sharma | pooja.sharma@gmail.com |
| patient5 | Kiran Yadav | kiran.yadav@gmail.com |
| abhi | Abhi patil | dfgd@gmail.com |
| sinchan | Shinchan nohara | test@gmail.com |
| patient | Shruti Patil | teacher@school.com |

---

## Doctors Table (4 Doctors in OPD)

| Name | Specialty | Qualification | Experience | Rating |
|------|-----------|---------------|------------|--------|
| Kapil Saxena | Cardiology | MBBS | 5 years | 4.5 |
| Anil Kumar | Neurology | MBBS | 5 years | 4.5 |
| Jay Gupta | Orthopedics | MBBS | 5 years | 4.5 |
| Ajay | Pediatrics | MBBS | 5 years | 4.5 |

---

## Service Patients (26 Registered Patients)

| First Name | Last Name | Gender | Phone | Insurance Provider |
|------------|-----------|--------|-------|-------------------|
| Rohan | Patil | Male | +91 98201 11111 | Star Health |
| Priya | Sharma | Female | +91 98201 22222 | ICICI Lombard |
| Sanjay | Kulkarni | Male | +91 98201 33333 | Max Bupa |
| Anjali | Deshmukh | Female | +91 98201 44444 | Apollo Munich |
| Vikrant | Jadhav | Male | +91 98201 55555 | Star Health |
| Neha | Bhosale | Female | +91 98201 66666 | HDFC Ergo |
| Aditya | Gaikwad | Male | +91 98201 77777 | Religare |
| Sneha | Pawar | Female | +91 98201 88888 | ICICI Lombard |
| Rahul | Deshpande | Male | +91 98201 99999 | - |
| ... | ... | ... | ... | ... |

---

## Consent Templates (14 Templates)

| Template | Type | Category | Languages |
|----------|------|----------|-----------|
| Medico-Legal Consent | MEDICO_LEGAL | Legal | English, Hindi, Marathi |
| Operation Theatre Consent | OPERATION_THEATRE | Surgical | English, Hindi, Marathi |
| Low Prognosis Consent | LOW_PROGNOSIS | Treatment | English, Hindi, Marathi |
| Emergency Procedure Consent | EMERGENCY_PROCEDURE | Emergency | English, Hindi, Marathi |
| Patient Shifting Consent | PATIENT_SHIFTING | Administrative | English, Hindi, Marathi |
| Valuables Declaration | VALUABLES_DECLARATION | Administrative | English, Hindi, Marathi |
| Treatment Denial Consent | TREATMENT_DENIAL | Legal | English, Hindi, Marathi |
| DNR Consent | DNR | Legal | English, Hindi, Marathi |
| HIV Test Consent | HIV_TEST | Diagnostic | English, Hindi, Marathi |
| HBsAg Test Consent | HBSAG_TEST | Diagnostic | English, Hindi, Marathi |
| Anaesthesia Consent | ANAESTHESIA | Surgical | English, Hindi, Marathi |
| Surgery Consent | SURGERY | Surgical | English, Hindi, Marathi |
| Tubal Ligation Consent | TUBAL_LIGATION | Surgical | English, Hindi, Marathi |
| Blood Transfusion Consent | BLOOD_TRANSFUSION | Treatment | English, Hindi, Marathi |

---

## Equipment (11 Items)

| Name | Model | Next Due Date |
|------|-------|---------------|
| CT Scanner | GE Revolution | Various |
| MRI Machine | Siemens Magnetom | Various |
| X-Ray Machine | Philips DigitalDiagnost | Various |
| Ultrasound | Canon Aplio | Various |
| Ventilator | Drager Evita | Various |
| Defibrillator | Philips HeartStart | Various |
| Patient Monitor | GE Carescape | Various |
| Infusion Pump | BD Alaris | Various |
| ECG Machine | GE MAC | Various |
| Dialysis Machine | Fresenius 4008S | Various |
| Anesthesia Machine | Drager Perseus | Various |

---

## Beds (19 Beds)

### By Category
| Category | Count |
|----------|-------|
| ICU | 4 |
| General Ward | 8 |
| Private | 4 |
| Emergency | 3 |

### By Status
| Status | Count |
|--------|-------|
| Available | 12 |
| Occupied | 5 |
| Maintenance | 2 |

---

## Inventory Items (18 Items)

### Categories
- Disposables
- Syringes
- Gloves
- Medicines
- Equipment

### Sample Items
| Name | Category | Current Stock | Low Stock Threshold |
|------|----------|---------------|-------------------|
| Surgical Masks | Disposables | 500 | 100 |
| Latex Gloves | Gloves | 1000 | 200 |
| 5ml Syringe | Syringes | 300 | 50 |
| IV Sets | Disposables | 200 | 50 |
| Paracetamol 500mg | Medicines | 1000 | 200 |
| Amoxicillin 250mg | Medicines | 500 | 100 |
| Blood Pressure Monitor | Equipment | 20 | 5 |
| Pulse Oximeter | Equipment | 30 | 5 |

---

## Activity Logs (139 Entries)

Activity types recorded:
- Patient registration
- Appointment booking
- Prescription creation
- Inventory transactions
- User login/logout
- Bed allocations
- Medical record updates
- Consent form uploads

---

## Database Connection

```
DATABASE_URL: postgresql://...@...neon.tech/...
PGDATABASE: neondb
PGHOST: ...neon.tech
```

### ORM: Drizzle ORM
- Schema: shared/schema.ts
- Migrations: drizzle.config.ts
- Push: npm run db:push

---

## Export Notes

1. **Password Security**: User passwords are bcrypt-hashed (10 rounds)
2. **UUIDs**: All primary keys use gen_random_uuid()
3. **Timestamps**: All tables use defaultNow() for created_at
4. **Soft Deletes**: Most tables use is_active flag instead of deletion
5. **Audit Trail**: Critical tables have dedicated audit log tables
