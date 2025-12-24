# HMS Core - PATIENT Role Documentation

## Overview
The Patient Portal provides patients with access to their medical information, appointment management, and communication with healthcare providers at Gravity Hospital.

## User Role: PATIENT

### Access Permissions
- View personal medical records
- Book and manage appointments
- View prescriptions and medication schedules
- Access health tips and notifications
- View assigned doctors and nurses
- Download consent forms
- View billing information

---

## Feature 1: Patient Dashboard

### Purpose
Central hub for patient information and quick actions.

### Components
1. **Welcome Section**
   - Patient name and greeting
   - Quick access cards

2. **Upcoming Appointments Card**
   - Next scheduled appointment
   - Doctor name and specialty
   - Date, time, and location
   - Quick action buttons

3. **Active Prescriptions Card**
   - Current medication list
   - Dosage information
   - Prescription status

4. **Health Tips Card**
   - AI-generated daily health tips
   - Personalized based on conditions
   - Multi-language support (English/Hindi/Marathi)

### Navigation
- Dashboard (Home)
- My Appointments
- My Prescriptions
- Medical Records
- Health Tips
- Profile Settings
- Notifications

---

## Feature 2: Appointment Management

### 2.1 View Appointments
- List of all appointments (past and upcoming)
- Filter by status: scheduled, completed, cancelled
- Sort by date
- Appointment details view

### 2.2 Book New Appointment
**Steps:**
1. Select hospital location (10 branches in Pune)
2. Select department/specialty
3. Choose preferred doctor
4. Select date from available slots
5. Choose time slot (30-minute intervals)
6. Enter symptoms/reason for visit
7. Confirm booking

**Available Locations:**
- Gravity Hospital - Koregaon Park
- Gravity Hospital - Hinjewadi
- Gravity Hospital - Kothrud
- Gravity Hospital - Wakad
- Gravity Hospital - Viman Nagar
- Gravity Hospital - Baner
- Gravity Hospital - Aundh
- Gravity Hospital - Kalyani Nagar
- Gravity Hospital - Pimpri
- Gravity Hospital - Nigdi (Main)

### 2.3 Appointment Actions
- View appointment details
- Cancel appointment (with reason)
- Reschedule appointment
- View Google Maps location

---

## Feature 3: Prescription Management

### 3.1 View Prescriptions
- List of all prescriptions
- Status: draft, awaiting_signature, finalized, void
- Filter by date range
- Search by medication name

### 3.2 Prescription Details
- Doctor information
- Diagnosis
- Medication list with:
  - Drug name
  - Dosage
  - Frequency
  - Duration
  - Special instructions
- Auto-generated medication schedule

### 3.3 Medication Schedule
- Daily medication reminders
- Time-based alerts
- Meal timing (pre/post meal)
- Track compliance

---

## Feature 4: Medical Records

### 4.1 View Medical History
- Complete medical record access
- Record types:
  - Lab Results
  - Radiology Reports
  - Discharge Summaries
  - Clinical Notes
  - Surgical Reports

### 4.2 Document Access
- Download reports
- View attached files
- Date-wise organization

---

## Feature 5: Health Tips & Wellness

### 5.1 AI-Powered Health Tips
- Daily personalized health tips
- Based on patient conditions
- OpenAI GPT-4o powered
- Multi-language support

### 5.2 Disease Information
- Pre-seeded disease catalog:
  - Diabetes Type 2
  - Hypertension
  - Tuberculosis
  - Dengue
  - Asthma
- Symptoms and precautions
- Diet recommendations
- Lifestyle modifications

### 5.3 Diet Plans
- Indian diet recommendations
- ICMR/MoHFW guidelines
- Condition-specific plans
- Meal timing suggestions

---

## Feature 6: Profile Management

### 6.1 Personal Information
- Full name
- Date of birth
- Gender
- Blood type
- Contact details

### 6.2 Emergency Contacts
- Name
- Relationship
- Phone number

### 6.3 Medical Information
- Known allergies
- Chronic conditions
- Current medications

---

## Feature 7: Notifications

### 7.1 Notification Types
- Appointment reminders
- Medication reminders
- Health tips
- Hospital announcements
- Birthday wishes

### 7.2 Notification Channels
- In-app push notifications
- Email notifications
- SMS notifications
- WhatsApp notifications

### 7.3 Real-time Updates
- WebSocket-based delivery
- Instant notification popup
- Notification center

---

## Feature 8: Consent Forms

### 8.1 Available Forms
- View assigned consent forms
- 14 trilingual templates available
- Categories:
  - Medico-Legal
  - Surgical
  - Diagnostic
  - Treatment
  - Maternal

### 8.2 Form Access
- View PDF preview
- Download forms
- Print functionality

---

## Feature 9: Billing Information

### 9.1 View Bills
- Current and past bills
- Bill breakdown:
  - Room charges
  - Doctor consultation
  - Lab tests
  - Medicines
  - Inventory charges

### 9.2 Payment Status
- Pending payments
- Payment history
- Payment methods

---

## API Endpoints Used

| Feature | Endpoint | Method |
|---------|----------|--------|
| Login | /api/auth/login | POST |
| Profile | /api/patient-profiles/:id | GET |
| Appointments | /api/appointments | GET |
| Book Appointment | /api/appointments | POST |
| Prescriptions | /api/prescriptions | GET |
| Medical Records | /api/medical-records | GET |
| Health Tips | /api/health-tips | GET |
| Notifications | /api/user-notifications/:userId | GET |
| Bills | /api/patient-bills | GET |

---

## Security & Privacy

### Data Protection
- Session-based authentication
- Role-based access control
- Encrypted data transmission
- HIPAA-compliant storage

### Access Restrictions
- Can only view own records
- Cannot modify medical records
- Limited to assigned healthcare team

---

## Support

### Contact Hospital
- Call: Hospital helpline
- Email: Support email
- Chat: AI-powered chatbot

### Chatbot Features
- OpenAI GPT-4o powered
- Context-aware responses
- General health queries
- Appointment assistance
- Hospital information
