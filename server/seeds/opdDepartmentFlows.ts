import { db } from "../db";
import { opdDepartmentFlows } from "@shared/schema";

export const OPD_DEPARTMENT_FLOW_DATA = [
  {
    departmentCode: "CTS",
    departmentName: "Cardiothoracic Surgery",
    flowType: "symptom_driven",
    symptoms: JSON.stringify([
      { id: "chest_pain", name: "Chest Pain", severity_levels: ["mild", "moderate", "severe"], duration_options: ["< 1 hour", "1-24 hours", "> 24 hours", "Intermittent"] },
      { id: "breathlessness", name: "Breathlessness", severity_levels: ["at rest", "on exertion", "NYHA I", "NYHA II", "NYHA III", "NYHA IV"], duration_options: ["acute", "chronic"] },
      { id: "palpitations", name: "Palpitations", severity_levels: ["mild", "moderate", "severe"], duration_options: ["occasional", "frequent", "continuous"] },
      { id: "fatigue", name: "Fatigue", severity_levels: ["mild", "moderate", "severe"], duration_options: ["recent", "chronic"] },
      { id: "syncope", name: "Syncope", severity_levels: ["single episode", "recurrent"], duration_options: ["recent", "chronic"] }
    ]),
    autoObservations: JSON.stringify([
      { id: "heart_sounds", name: "Heart Sounds", type: "select", options: ["S1 S2 Normal", "S3 Present", "S4 Present", "Abnormal"] },
      { id: "murmur_grade", name: "Murmur (Grade)", type: "select", options: ["None", "Grade I", "Grade II", "Grade III", "Grade IV", "Grade V", "Grade VI"] },
      { id: "jvp", name: "JVP", type: "select", options: ["Normal", "Elevated", "Not Visible"] },
      { id: "peripheral_edema", name: "Peripheral Edema", type: "select", options: ["None", "Pitting +", "Pitting ++", "Pitting +++"] },
      { id: "pulse_rhythm", name: "Pulse Rhythm", type: "select", options: ["Regular", "Irregular", "Irregularly Irregular"] }
    ]),
    flowLogicRules: JSON.stringify([
      { condition: { symptom: "chest_pain" }, action: { tests: ["ECG"], priority: "routine" } },
      { condition: { symptom: "chest_pain", modifier: "severe" }, action: { tests: ["ECG", "Troponin"], priority: "urgent" } },
      { condition: { symptom: "breathlessness" }, action: { tests: ["Chest X-Ray"], priority: "routine" } },
      { condition: { symptom: "breathlessness", modifier: "NYHA III" }, action: { tests: ["Echocardiography"], priority: "urgent" } },
      { condition: { symptom: "breathlessness", modifier: "NYHA IV" }, action: { tests: ["Echocardiography", "BNP"], priority: "urgent" } },
      { condition: { symptom: "palpitations" }, action: { tests: ["ECG", "Holter Monitor"], priority: "routine" } },
      { condition: { symptom: "syncope" }, action: { tests: ["ECG", "Holter Monitor"], referral: "Electrophysiology", priority: "urgent" } },
      { condition: { symptom: "fatigue", modifier: "severe" }, action: { tests: ["CBC", "Thyroid Profile"], priority: "routine" } }
    ]),
    suggestedTests: JSON.stringify([
      { testName: "ECG", condition: "chest_pain OR palpitations", mandatory: false },
      { testName: "Troponin", condition: "chest_pain + exertional", mandatory: false },
      { testName: "Echocardiography", condition: "breathlessness OR murmur", mandatory: false },
      { testName: "Chest X-Ray", condition: "breathlessness", mandatory: false }
    ]),
    suggestedReferrals: JSON.stringify([
      { department: "Cathlab", condition: "ECG abnormal" },
      { department: "Cardiac Rehab", condition: "post_consultation" }
    ]),
    requiresVitals: true,
    vitalsFields: JSON.stringify(["bp", "pulse", "spo2", "rr"]),
    sortOrder: 1
  },
  {
    departmentCode: "CVS",
    departmentName: "Cardiovascular Surgery",
    flowType: "symptom_driven",
    symptoms: JSON.stringify([
      { id: "limb_pain", name: "Limb Pain", severity_levels: ["mild", "moderate", "severe"], duration_options: ["acute", "chronic"] },
      { id: "claudication", name: "Claudication", severity_levels: ["mild", "moderate", "severe"], duration_options: ["< 100m", "100-500m", "> 500m"] },
      { id: "non_healing_ulcer", name: "Non-healing Ulcer", severity_levels: ["small", "medium", "large"], duration_options: ["< 2 weeks", "2-4 weeks", "> 4 weeks"] },
      { id: "limb_discoloration", name: "Limb Discoloration", severity_levels: ["mild", "moderate", "severe"], duration_options: ["recent", "chronic"] }
    ]),
    autoObservations: JSON.stringify([
      { id: "pulse_grading", name: "Pulse Grading", type: "select", options: ["0 - Absent", "1+ - Diminished", "2+ - Normal", "3+ - Bounding"] },
      { id: "limb_temperature", name: "Limb Temperature", type: "select", options: ["Cold", "Cool", "Warm", "Hot"] },
      { id: "capillary_refill", name: "Capillary Refill", type: "select", options: ["< 2 sec (Normal)", "2-4 sec (Delayed)", "> 4 sec (Prolonged)"] },
      { id: "edema", name: "Edema", type: "select", options: ["None", "Pitting +", "Pitting ++", "Pitting +++"] }
    ]),
    flowLogicRules: JSON.stringify([
      { condition: { symptom: "limb_pain" }, action: { tests: ["Doppler Ultrasound"], priority: "routine" } },
      { condition: { symptom: "limb_pain", modifier: "severe" }, action: { tests: ["Doppler Ultrasound", "CT Angiography"], priority: "urgent" } },
      { condition: { symptom: "claudication" }, action: { tests: ["ABI", "Doppler Ultrasound"], priority: "routine" } },
      { condition: { symptom: "claudication", modifier: "severe" }, action: { tests: ["ABI", "CT Angiography"], priority: "urgent" } },
      { condition: { symptom: "non_healing_ulcer" }, action: { tests: ["Infection Markers", "Doppler Ultrasound"], priority: "urgent" } },
      { condition: { symptom: "limb_discoloration" }, action: { tests: ["Doppler Ultrasound"], priority: "routine" } }
    ]),
    suggestedTests: JSON.stringify([
      { testName: "Ankle-Brachial Index (ABI)", condition: "claudication OR limb_pain", mandatory: false },
      { testName: "Doppler Ultrasound", condition: "any vascular symptom", mandatory: false },
      { testName: "CBC with ESR", condition: "ulcer", mandatory: false }
    ]),
    suggestedReferrals: JSON.stringify([
      { department: "Wound Care", condition: "ulcer present" },
      { department: "Vascular Surgery", condition: "severe claudication" }
    ]),
    requiresVitals: true,
    vitalsFields: JSON.stringify(["bp", "pulse"]),
    sortOrder: 2
  },
  {
    departmentCode: "CATH",
    departmentName: "Cathlab",
    flowType: "score_driven",
    symptoms: JSON.stringify([
      { id: "angina", name: "Angina", severity_levels: ["typical", "atypical"], duration_options: ["stable", "unstable", "new onset"] },
      { id: "dyspnea_on_exertion", name: "Dyspnea on Exertion", severity_levels: ["mild", "moderate", "severe"], duration_options: ["recent", "chronic"] },
      { id: "palpitations", name: "Palpitations", severity_levels: ["mild", "moderate", "severe"], duration_options: ["occasional", "frequent"] }
    ]),
    autoObservations: JSON.stringify([
      { id: "ecg_rhythm", name: "ECG Rhythm", type: "select", options: ["Sinus", "AF", "Flutter", "VT", "Other"] },
      { id: "bp_trend", name: "BP Trend", type: "select", options: ["Stable", "Increasing", "Decreasing", "Labile"] },
      { id: "heart_rate", name: "Heart Rate", type: "number", unit: "bpm" }
    ]),
    flowLogicRules: JSON.stringify([
      { condition: { symptom: "angina", modifier: "typical" }, action: { tests: ["Stress Test"], priority: "routine" } },
      { condition: { observation: "reduced_ef" }, action: { tests: ["Echo Review"], priority: "routine", note: "OPD only - no procedure" } }
    ]),
    suggestedTests: JSON.stringify([
      { testName: "Stress Test (TMT/Dobutamine)", condition: "typical angina", mandatory: false },
      { testName: "Echocardiography", condition: "dyspnea OR reduced EF", mandatory: false }
    ]),
    suggestedReferrals: JSON.stringify([
      { department: "Cardiothoracic Surgery", condition: "positive stress test" }
    ]),
    requiresVitals: true,
    vitalsFields: JSON.stringify(["bp", "pulse", "spo2"]),
    sortOrder: 3
  },
  {
    departmentCode: "VASC",
    departmentName: "Vascular Surgery",
    flowType: "symptom_driven",
    symptoms: JSON.stringify([
      { id: "leg_swelling", name: "Leg Swelling", severity_levels: ["mild", "moderate", "severe"], duration_options: ["acute", "chronic"] },
      { id: "varicose_veins", name: "Varicose Veins", severity_levels: ["Grade 1", "Grade 2", "Grade 3", "Grade 4"], duration_options: ["asymptomatic", "symptomatic"] },
      { id: "limb_heaviness", name: "Limb Heaviness", severity_levels: ["mild", "moderate", "severe"], duration_options: ["intermittent", "constant"] }
    ]),
    autoObservations: JSON.stringify([
      { id: "varicosity_grade", name: "Varicosity Grade", type: "select", options: ["C0", "C1", "C2", "C3", "C4", "C5", "C6"] },
      { id: "skin_pigmentation", name: "Skin Pigmentation", type: "select", options: ["None", "Mild", "Moderate", "Severe"] },
      { id: "ulcer_presence", name: "Ulcer Presence", type: "select", options: ["None", "Healing", "Active"] }
    ]),
    flowLogicRules: JSON.stringify([
      { condition: { symptom: "leg_swelling" }, action: { tests: ["Venous Doppler"], priority: "routine" } },
      { condition: { observation: "ulcer_presence", value: "Active" }, action: { tests: ["ABI"], priority: "urgent" } }
    ]),
    suggestedTests: JSON.stringify([
      { testName: "Venous Doppler", condition: "swelling OR varicose veins", mandatory: false },
      { testName: "ABI", condition: "ulcer", mandatory: false }
    ]),
    suggestedReferrals: JSON.stringify([
      { department: "Wound Care", condition: "active ulcer" }
    ]),
    requiresVitals: true,
    vitalsFields: JSON.stringify(["bp", "pulse"]),
    sortOrder: 4
  },
  {
    departmentCode: "DAYCARE",
    departmentName: "Day Care & Minor Procedure",
    flowType: "symptom_driven",
    symptoms: JSON.stringify([
      { id: "local_swelling", name: "Local Swelling", severity_levels: ["small", "medium", "large"], duration_options: ["< 1 week", "1-4 weeks", "> 4 weeks"] },
      { id: "pain", name: "Pain", severity_levels: ["VAS 1-3", "VAS 4-6", "VAS 7-10"], duration_options: ["acute", "chronic"] },
      { id: "redness", name: "Redness", severity_levels: ["mild", "moderate", "severe"], duration_options: ["recent", "spreading"] }
    ]),
    autoObservations: JSON.stringify([
      { id: "tenderness", name: "Tenderness", type: "select", options: ["None", "Mild", "Moderate", "Severe"] },
      { id: "local_temperature", name: "Local Temperature", type: "select", options: ["Normal", "Warm", "Hot"] },
      { id: "local_discharge", name: "Local Discharge", type: "select", options: ["None", "Serous", "Purulent", "Bloody"] }
    ]),
    flowLogicRules: JSON.stringify([
      { condition: { symptom: "redness", modifier: "spreading" }, action: { tests: ["CBC"], priority: "urgent" } },
      { condition: { symptom: "local_swelling" }, action: { tests: ["USG Local"], priority: "routine" } }
    ]),
    suggestedTests: JSON.stringify([
      { testName: "CBC", condition: "infection signs", mandatory: false },
      { testName: "USG Local", condition: "swelling", mandatory: false }
    ]),
    suggestedReferrals: JSON.stringify([
      { department: "General Surgery", condition: "requires intervention" }
    ]),
    requiresVitals: true,
    vitalsFields: JSON.stringify(["temp", "pulse"]),
    sortOrder: 5
  },
  {
    departmentCode: "ENT",
    departmentName: "ENT",
    flowType: "symptom_driven",
    symptoms: JSON.stringify([
      { id: "ear_pain", name: "Ear Pain", severity_levels: ["mild", "moderate", "severe"], duration_options: ["< 1 week", "1-2 weeks", "> 2 weeks"] },
      { id: "hearing_loss", name: "Hearing Loss", severity_levels: ["mild", "moderate", "severe"], duration_options: ["sudden", "gradual", "> 2 weeks"] },
      { id: "nasal_block", name: "Nasal Block", severity_levels: ["unilateral", "bilateral"], duration_options: ["intermittent", "constant"] },
      { id: "throat_pain", name: "Throat Pain", severity_levels: ["mild", "moderate", "severe"], duration_options: ["< 1 week", "1-2 weeks", "> 2 weeks"] },
      { id: "voice_change", name: "Voice Change", severity_levels: ["mild", "moderate", "severe"], duration_options: ["< 3 weeks", "> 3 weeks"] }
    ]),
    autoObservations: JSON.stringify([
      { id: "otoscopy", name: "Otoscopy", type: "text", options: [] },
      { id: "throat_exam", name: "Throat Exam", type: "text", options: [] },
      { id: "nasal_endoscopy", name: "Nasal Endoscopy (if indicated)", type: "select", options: ["Not Done", "Normal", "Abnormal - DNS", "Abnormal - Polyp", "Abnormal - Other"] }
    ]),
    flowLogicRules: JSON.stringify([
      { condition: { symptom: "ear_pain" }, action: { tests: ["Otoscopy"], priority: "routine" } },
      { condition: { symptom: "ear_pain", modifier: "severe" }, action: { tests: ["Otoscopy", "CT Temporal Bone"], priority: "urgent" } },
      { condition: { symptom: "hearing_loss" }, action: { tests: ["Audiometry"], priority: "routine" } },
      { condition: { symptom: "hearing_loss", modifier: "severe" }, action: { tests: ["Audiometry", "BERA"], priority: "urgent" } },
      { condition: { symptom: "nasal_block" }, action: { tests: ["X-Ray PNS"], priority: "routine" } },
      { condition: { symptom: "throat_pain" }, action: { tests: ["CBC"], priority: "routine" } },
      { condition: { symptom: "voice_change" }, action: { tests: ["Laryngoscopy"], priority: "routine" } }
    ]),
    suggestedTests: JSON.stringify([
      { testName: "Audiometry", condition: "hearing loss > 2 weeks", mandatory: false },
      { testName: "Laryngoscopy", condition: "voice change > 3 weeks", mandatory: false },
      { testName: "X-Ray PNS", condition: "nasal block chronic", mandatory: false }
    ]),
    suggestedReferrals: JSON.stringify([
      { department: "Speech Therapy", condition: "voice disorder" }
    ]),
    requiresVitals: true,
    vitalsFields: JSON.stringify(["temp"]),
    sortOrder: 6
  },
  {
    departmentCode: "GS",
    departmentName: "General Surgery",
    flowType: "symptom_driven",
    symptoms: JSON.stringify([
      { id: "abdominal_pain", name: "Abdominal Pain", severity_levels: ["mild", "moderate", "severe"], duration_options: ["acute", "chronic"], location: ["RUQ", "LUQ", "RLQ", "LLQ", "Epigastric", "Umbilical", "Generalized"] },
      { id: "lump", name: "Lump/Swelling", severity_levels: ["small", "medium", "large"], duration_options: ["< 1 month", "1-3 months", "> 3 months"] },
      { id: "hernia_symptoms", name: "Hernia Symptoms", severity_levels: ["reducible", "irreducible", "obstructed"], duration_options: ["recent", "chronic"] }
    ]),
    autoObservations: JSON.stringify([
      { id: "tenderness", name: "Tenderness", type: "select", options: ["None", "Mild", "Moderate", "Severe", "Rebound"] },
      { id: "guarding", name: "Guarding", type: "select", options: ["None", "Voluntary", "Involuntary"] },
      { id: "lump_mobility", name: "Lump Mobility", type: "select", options: ["Mobile", "Fixed", "Tethered to skin"] }
    ]),
    flowLogicRules: JSON.stringify([
      { condition: { symptom: "abdominal_pain" }, action: { tests: ["USG Abdomen"], priority: "routine" } },
      { condition: { symptom: "lump" }, action: { tests: ["USG", "FNAC if indicated"], priority: "routine" } }
    ]),
    suggestedTests: JSON.stringify([
      { testName: "USG Abdomen", condition: "abdominal pain", mandatory: false },
      { testName: "USG Local", condition: "lump", mandatory: false },
      { testName: "FNAC", condition: "suspicious lump", mandatory: false }
    ]),
    suggestedReferrals: JSON.stringify([
      { department: "Oncology", condition: "suspicious malignancy" }
    ]),
    requiresVitals: true,
    vitalsFields: JSON.stringify(["bp", "pulse", "temp"]),
    sortOrder: 7
  },
  {
    departmentCode: "ICU_CASUALTY",
    departmentName: "ICU & Casualty",
    flowType: "symptom_driven",
    symptoms: JSON.stringify([
      { id: "acute_pain", name: "Acute Pain", severity_levels: ["VAS 1-3", "VAS 4-6", "VAS 7-10"], duration_options: ["< 1 hour", "1-6 hours", "> 6 hours"] },
      { id: "breathlessness", name: "Breathlessness", severity_levels: ["mild", "moderate", "severe"], duration_options: ["acute", "progressive"] },
      { id: "dizziness", name: "Dizziness", severity_levels: ["mild", "moderate", "severe"], duration_options: ["episodic", "continuous"] }
    ]),
    autoObservations: JSON.stringify([
      { id: "gcs", name: "GCS", type: "number", unit: "/15", min: 3, max: 15 },
      { id: "vitals_trend", name: "Vitals Trend", type: "select", options: ["Stable", "Improving", "Deteriorating"] }
    ]),
    flowLogicRules: JSON.stringify([
      { condition: { symptom: "acute_pain" }, action: { tests: ["CBC", "ECG"], priority: "urgent" } },
      { condition: { symptom: "acute_pain", modifier: "VAS 7-10" }, action: { tests: ["ECG", "Troponin", "CBC"], priority: "urgent" } },
      { condition: { symptom: "breathlessness" }, action: { tests: ["Chest X-Ray", "SpO2"], priority: "urgent" } },
      { condition: { symptom: "breathlessness", modifier: "severe" }, action: { tests: ["ABG", "CT Chest"], priority: "urgent" } },
      { condition: { symptom: "dizziness" }, action: { tests: ["ECG", "Blood Sugar"], priority: "routine" } },
      { condition: { observation: "vitals_trend", value: "Deteriorating" }, action: { referral: "ICU Admission", priority: "urgent" } }
    ]),
    suggestedTests: JSON.stringify([
      { testName: "ECG", condition: "chest pain OR dizziness", mandatory: false },
      { testName: "CBC", condition: "any acute symptom", mandatory: false }
    ]),
    suggestedReferrals: JSON.stringify([
      { department: "Cardiology", condition: "abnormal ECG" },
      { department: "Neurology", condition: "altered consciousness" }
    ]),
    requiresVitals: true,
    vitalsFields: JSON.stringify(["bp", "pulse", "spo2", "rr", "temp"]),
    sortOrder: 8
  },
  {
    departmentCode: "MFS",
    departmentName: "Maxillo Facial Surgery",
    flowType: "symptom_driven",
    symptoms: JSON.stringify([
      { id: "facial_pain", name: "Facial Pain", severity_levels: ["mild", "moderate", "severe"], duration_options: ["acute", "chronic"] },
      { id: "swelling", name: "Facial Swelling", severity_levels: ["small", "medium", "large"], duration_options: ["< 1 week", "1-4 weeks", "> 4 weeks"] },
      { id: "jaw_stiffness", name: "Jaw Stiffness", severity_levels: ["mild", "moderate", "severe (trismus)"], duration_options: ["recent", "chronic"] }
    ]),
    autoObservations: JSON.stringify([
      { id: "jaw_rom", name: "Jaw ROM", type: "number", unit: "mm", min: 0, max: 60 },
      { id: "facial_symmetry", name: "Facial Symmetry", type: "select", options: ["Symmetric", "Asymmetric - Mild", "Asymmetric - Moderate", "Asymmetric - Severe"] },
      { id: "dental_alignment", name: "Dental Alignment", type: "select", options: ["Normal", "Malocclusion Class I", "Malocclusion Class II", "Malocclusion Class III"] }
    ]),
    flowLogicRules: JSON.stringify([
      { condition: { symptom: "swelling" }, action: { tests: ["X-Ray Face", "CT Face if indicated"], priority: "routine" } }
    ]),
    suggestedTests: JSON.stringify([
      { testName: "X-Ray Face/OPG", condition: "swelling OR trauma", mandatory: false },
      { testName: "CT Face", condition: "significant swelling", mandatory: false }
    ]),
    suggestedReferrals: JSON.stringify([
      { department: "ENT", condition: "nasal involvement" }
    ]),
    requiresVitals: true,
    vitalsFields: JSON.stringify(["temp"]),
    sortOrder: 9
  },
  {
    departmentCode: "NS",
    departmentName: "Neuro Surgery",
    flowType: "symptom_driven",
    symptoms: JSON.stringify([
      { id: "headache", name: "Headache", severity_levels: ["mild", "moderate", "severe", "thunderclap"], duration_options: ["acute", "chronic", "progressive"], red_flags: ["sudden onset", "worst headache", "with fever", "with neck stiffness"] },
      { id: "weakness", name: "Weakness", severity_levels: ["mild", "moderate", "severe"], duration_options: ["acute", "progressive"], location: ["unilateral", "bilateral", "focal"] },
      { id: "seizures", name: "Seizures", severity_levels: ["first episode", "recurrent"], duration_options: ["recent", "known epilepsy"] },
      { id: "vision_loss", name: "Vision Loss", severity_levels: ["partial", "complete"], duration_options: ["sudden", "gradual"] }
    ]),
    autoObservations: JSON.stringify([
      { id: "gcs", name: "GCS", type: "number", unit: "/15", min: 3, max: 15 },
      { id: "power_grading", name: "Power Grading", type: "select", options: ["0/5", "1/5", "2/5", "3/5", "4/5", "5/5"] },
      { id: "reflexes", name: "Reflexes", type: "select", options: ["Absent", "Diminished", "Normal", "Brisk", "Clonus"] }
    ]),
    flowLogicRules: JSON.stringify([
      { condition: { symptom: "headache", modifier: "red_flag" }, action: { tests: ["MRI Brain"], priority: "urgent" } },
      { condition: { symptom: "seizures", modifier: "first_episode" }, action: { tests: ["EEG", "MRI Brain"], priority: "routine" } }
    ]),
    suggestedTests: JSON.stringify([
      { testName: "MRI Brain", condition: "red flag headache OR first seizure", mandatory: false },
      { testName: "EEG", condition: "seizures", mandatory: false },
      { testName: "CT Brain", condition: "acute presentation", mandatory: false }
    ]),
    suggestedReferrals: JSON.stringify([
      { department: "Neurology", condition: "medical management needed" }
    ]),
    requiresVitals: true,
    vitalsFields: JSON.stringify(["bp", "pulse", "spo2"]),
    sortOrder: 10
  },
  {
    departmentCode: "OBGY",
    departmentName: "OBGY & Gynaecology",
    flowType: "symptom_driven",
    symptoms: JSON.stringify([
      { id: "irregular_menses", name: "Irregular Menses", severity_levels: ["mild", "moderate", "severe"], duration_options: ["< 3 months", "3-6 months", "> 6 months"] },
      { id: "pelvic_pain", name: "Pelvic Pain", severity_levels: ["mild", "moderate", "severe"], duration_options: ["acute", "chronic", "cyclical"] },
      { id: "pregnancy_complaint", name: "Pregnancy Complaint", severity_levels: ["mild", "moderate", "severe"], duration_options: ["first trimester", "second trimester", "third trimester"] },
      { id: "white_discharge", name: "White Discharge", severity_levels: ["mild", "moderate", "severe"], duration_options: ["recent", "chronic"] }
    ]),
    autoObservations: JSON.stringify([
      { id: "lmp", name: "LMP (Last Menstrual Period)", type: "date" },
      { id: "cycle_pattern", name: "Cycle Pattern", type: "select", options: ["Regular", "Irregular", "Oligomenorrhea", "Polymenorrhea", "Amenorrhea"] },
      { id: "per_speculum", name: "Per Speculum Findings", type: "text" }
    ]),
    flowLogicRules: JSON.stringify([
      { condition: { symptom: "pregnancy_complaint" }, action: { flow: "Antenatal", priority: "routine" } },
      { condition: { symptom: "pelvic_pain", modifier: "with_fever" }, action: { tests: ["USG Pelvis"], priority: "urgent" } }
    ]),
    suggestedTests: JSON.stringify([
      { testName: "USG Pelvis", condition: "pelvic pain OR irregular menses", mandatory: false },
      { testName: "Beta HCG", condition: "suspected pregnancy", mandatory: false },
      { testName: "CBC", condition: "heavy bleeding", mandatory: false }
    ]),
    suggestedReferrals: JSON.stringify([
      { department: "Infertility", condition: "trying to conceive" }
    ]),
    requiresVitals: true,
    vitalsFields: JSON.stringify(["bp", "pulse", "weight"]),
    sortOrder: 11
  },
  {
    departmentCode: "ONCO",
    departmentName: "Oncology / Onco Surgery / Radiation",
    flowType: "symptom_driven",
    symptoms: JSON.stringify([
      { id: "lump", name: "Lump", severity_levels: ["< 2 cm", "2-5 cm", "> 5 cm"], duration_options: ["< 1 month", "1-3 months", "> 3 months"] },
      { id: "weight_loss", name: "Unexplained Weight Loss", severity_levels: ["< 5%", "5-10%", "> 10%"], duration_options: ["< 3 months", "3-6 months", "> 6 months"] },
      { id: "bleeding", name: "Abnormal Bleeding", severity_levels: ["mild", "moderate", "severe"], duration_options: ["recent", "recurrent"] },
      { id: "pain", name: "Pain", severity_levels: ["VAS 1-3", "VAS 4-6", "VAS 7-10"], duration_options: ["localized", "radiating"] }
    ]),
    autoObservations: JSON.stringify([
      { id: "lump_size", name: "Lump Size", type: "text", unit: "cm" },
      { id: "fixity", name: "Fixity", type: "select", options: ["Mobile", "Fixed to skin", "Fixed to deeper structures", "Fixed to both"] },
      { id: "nodes", name: "Lymph Nodes", type: "select", options: ["Not Palpable", "Palpable - Mobile", "Palpable - Fixed", "Matted"] },
      { id: "ecog_score", name: "ECOG Score", type: "select", options: ["0 - Fully Active", "1 - Restricted Activity", "2 - Ambulatory >50%", "3 - Ambulatory <50%", "4 - Bedridden"] }
    ]),
    flowLogicRules: JSON.stringify([
      { condition: { symptom: "lump" }, action: { tests: ["Imaging", "Biopsy"], priority: "routine" } },
      { condition: { observation: "ecog_score", value: ">= 3" }, action: { plan: "Conservative OPD Management", priority: "routine" } }
    ]),
    suggestedTests: JSON.stringify([
      { testName: "Imaging (CT/MRI)", condition: "lump", mandatory: false },
      { testName: "Biopsy/FNAC", condition: "suspicious lump", mandatory: false },
      { testName: "CBC with ESR", condition: "weight loss", mandatory: false }
    ]),
    suggestedReferrals: JSON.stringify([
      { department: "Radiation Oncology", condition: "confirmed malignancy" },
      { department: "Pain Management", condition: "severe pain" }
    ]),
    requiresVitals: true,
    vitalsFields: JSON.stringify(["bp", "pulse", "weight"]),
    sortOrder: 12
  },
  {
    departmentCode: "ORTHO",
    departmentName: "Orthopedic Surgery",
    flowType: "symptom_driven",
    symptoms: JSON.stringify([
      { id: "joint_pain", name: "Joint Pain", severity_levels: ["mild", "moderate", "severe"], duration_options: ["acute", "chronic"], location: ["shoulder", "elbow", "wrist", "hip", "knee", "ankle", "spine"] },
      { id: "trauma", name: "Trauma", severity_levels: ["minor", "moderate", "major"], duration_options: ["recent", "old"] },
      { id: "swelling", name: "Swelling", severity_levels: ["mild", "moderate", "severe"], duration_options: ["acute", "chronic"] }
    ]),
    autoObservations: JSON.stringify([
      { id: "rom", name: "Range of Motion", type: "select", options: ["Full", "Mildly Restricted", "Moderately Restricted", "Severely Restricted"] },
      { id: "deformity", name: "Deformity", type: "select", options: ["None", "Mild", "Moderate", "Severe"] },
      { id: "weight_bearing", name: "Weight Bearing", type: "select", options: ["Full", "Partial", "Non-weight bearing"] }
    ]),
    flowLogicRules: JSON.stringify([
      { condition: { symptom: "trauma" }, action: { tests: ["X-Ray"], priority: "mandatory" } },
      { condition: { symptom: "joint_pain", modifier: "chronic" }, action: { tests: ["MRI"], priority: "optional" } }
    ]),
    suggestedTests: JSON.stringify([
      { testName: "X-Ray", condition: "trauma", mandatory: true },
      { testName: "MRI", condition: "chronic pain OR soft tissue injury", mandatory: false }
    ]),
    suggestedReferrals: JSON.stringify([
      { department: "Physiotherapy", condition: "post consultation" }
    ]),
    requiresVitals: true,
    vitalsFields: JSON.stringify(["bp", "pulse"]),
    sortOrder: 13
  },
  {
    departmentCode: "PED_ORTHO",
    departmentName: "Paediatric Orthopedics",
    flowType: "symptom_driven",
    symptoms: JSON.stringify([
      { id: "limb_deformity", name: "Limb Deformity", severity_levels: ["mild", "moderate", "severe"], duration_options: ["congenital", "acquired"] },
      { id: "gait_abnormality", name: "Gait Abnormality", severity_levels: ["mild", "moderate", "severe"], duration_options: ["recent", "progressive"] }
    ]),
    autoObservations: JSON.stringify([
      { id: "growth_percentile", name: "Growth Percentile", type: "number", unit: "%ile" },
      { id: "limb_alignment", name: "Limb Alignment", type: "select", options: ["Normal", "Varus", "Valgus", "Rotational"] }
    ]),
    flowLogicRules: JSON.stringify([
      { condition: { symptom: "limb_deformity" }, action: { tests: ["X-Ray"], priority: "routine" } }
    ]),
    suggestedTests: JSON.stringify([
      { testName: "X-Ray", condition: "deformity", mandatory: false }
    ]),
    suggestedReferrals: JSON.stringify([
      { department: "Pediatric Physiotherapy", condition: "post consultation" }
    ]),
    requiresVitals: true,
    vitalsFields: JSON.stringify(["weight", "height"]),
    sortOrder: 14
  },
  {
    departmentCode: "PED_GS",
    departmentName: "Paediatric General Surgery",
    flowType: "symptom_driven",
    symptoms: JSON.stringify([
      { id: "abdominal_pain", name: "Abdominal Pain", severity_levels: ["mild", "moderate", "severe"], duration_options: ["acute", "chronic"] },
      { id: "congenital_swelling", name: "Congenital Swelling", severity_levels: ["small", "medium", "large"], duration_options: ["since birth", "progressive"] }
    ]),
    autoObservations: JSON.stringify([
      { id: "weight", name: "Weight", type: "number", unit: "kg" },
      { id: "abdomen_exam", name: "Abdomen Exam", type: "text" }
    ]),
    flowLogicRules: JSON.stringify([
      { condition: { symptom: "abdominal_pain" }, action: { tests: ["USG Abdomen"], priority: "routine" } },
      { condition: { symptom: "congenital_swelling" }, action: { tests: ["Imaging Review"], priority: "routine" } }
    ]),
    suggestedTests: JSON.stringify([
      { testName: "USG Abdomen", condition: "pain", mandatory: false },
      { testName: "Imaging Review", condition: "congenital", mandatory: false }
    ]),
    suggestedReferrals: JSON.stringify([
      { department: "Pediatric Medicine", condition: "conservative management" }
    ]),
    requiresVitals: true,
    vitalsFields: JSON.stringify(["weight", "temp"]),
    sortOrder: 15
  },
  {
    departmentCode: "PED_CARD",
    departmentName: "Paediatric Cardiac Unit",
    flowType: "symptom_driven",
    symptoms: JSON.stringify([
      { id: "cyanosis", name: "Cyanosis", severity_levels: ["mild", "moderate", "severe"], duration_options: ["since birth", "progressive", "episodic"] },
      { id: "breathlessness", name: "Breathlessness", severity_levels: ["mild", "moderate", "severe"], duration_options: ["on feeding", "on exertion", "at rest"] }
    ]),
    autoObservations: JSON.stringify([
      { id: "spo2", name: "SpO2", type: "number", unit: "%" },
      { id: "murmur", name: "Murmur", type: "select", options: ["None", "Systolic", "Diastolic", "Continuous"] }
    ]),
    flowLogicRules: JSON.stringify([
      { condition: { observation: "murmur", value: "present" }, action: { tests: ["Echocardiography"], priority: "routine" } }
    ]),
    suggestedTests: JSON.stringify([
      { testName: "Echocardiography", condition: "murmur OR cyanosis", mandatory: false },
      { testName: "ECG", condition: "any cardiac symptom", mandatory: false }
    ]),
    suggestedReferrals: JSON.stringify([
      { department: "Cardiothoracic Surgery", condition: "significant defect" }
    ]),
    requiresVitals: true,
    vitalsFields: JSON.stringify(["spo2", "pulse", "weight"]),
    sortOrder: 16
  },
  {
    departmentCode: "PAIN",
    departmentName: "Pain Management",
    flowType: "score_driven",
    symptoms: JSON.stringify([
      { id: "chronic_pain", name: "Chronic Pain", severity_levels: ["VAS 1-3", "VAS 4-6", "VAS 7-10"], duration_options: ["> 3 months", "> 6 months", "> 1 year"] },
      { id: "back_pain", name: "Back Pain", severity_levels: ["mild", "moderate", "severe"], duration_options: ["acute", "chronic"], location: ["cervical", "thoracic", "lumbar", "sacral"] },
      { id: "neuralgia", name: "Neuralgia", severity_levels: ["mild", "moderate", "severe"], duration_options: ["intermittent", "constant"] }
    ]),
    autoObservations: JSON.stringify([
      { id: "vas_score", name: "VAS Score", type: "number", min: 0, max: 10 },
      { id: "functional_limitation", name: "Functional Limitation", type: "select", options: ["None", "Mild", "Moderate", "Severe", "Complete"] }
    ]),
    flowLogicRules: JSON.stringify([
      { condition: { observation: "vas_score", value: "> 6" }, action: { tests: ["Imaging"], referral: "Rehab", priority: "routine" } }
    ]),
    suggestedTests: JSON.stringify([
      { testName: "X-Ray Spine", condition: "back pain", mandatory: false },
      { testName: "MRI Spine", condition: "VAS > 6", mandatory: false }
    ]),
    suggestedReferrals: JSON.stringify([
      { department: "Rehabilitation", condition: "VAS > 6" },
      { department: "Neurosurgery", condition: "radiculopathy" }
    ]),
    requiresVitals: true,
    vitalsFields: JSON.stringify(["bp", "pulse"]),
    sortOrder: 17
  },
  {
    departmentCode: "PLASTIC",
    departmentName: "Plastic Surgery",
    flowType: "symptom_driven",
    symptoms: JSON.stringify([
      { id: "scar", name: "Scar", severity_levels: ["hypertrophic", "keloid", "atrophic"], duration_options: ["< 1 year", "1-2 years", "> 2 years"] },
      { id: "wound", name: "Wound", severity_levels: ["superficial", "partial thickness", "full thickness"], duration_options: ["healing", "non-healing"] },
      { id: "deformity", name: "Deformity", severity_levels: ["mild", "moderate", "severe"], duration_options: ["congenital", "acquired", "post-traumatic"] }
    ]),
    autoObservations: JSON.stringify([
      { id: "scar_size", name: "Scar Size", type: "text", unit: "cm" },
      { id: "healing_stage", name: "Healing Stage", type: "select", options: ["Inflammatory", "Proliferative", "Remodeling", "Mature"] },
      { id: "photo_capture", name: "Photo Capture", type: "file" }
    ]),
    flowLogicRules: JSON.stringify([
      { condition: { symptom: "wound", modifier: "non-healing" }, action: { tests: ["Infection Markers"], priority: "routine" } }
    ]),
    suggestedTests: JSON.stringify([
      { testName: "CBC with ESR", condition: "non-healing wound", mandatory: false },
      { testName: "Culture", condition: "infected wound", mandatory: false }
    ]),
    suggestedReferrals: JSON.stringify([
      { department: "Wound Care", condition: "complex wound" }
    ]),
    requiresVitals: true,
    vitalsFields: JSON.stringify(["temp"]),
    sortOrder: 18
  },
  {
    departmentCode: "URO",
    departmentName: "Uro Surgery",
    flowType: "score_driven",
    symptoms: JSON.stringify([
      { id: "burning_micturition", name: "Burning Micturition", severity_levels: ["mild", "moderate", "severe"], duration_options: ["acute", "chronic"] },
      { id: "frequency", name: "Frequency", severity_levels: ["mild", "moderate", "severe"], duration_options: ["recent", "chronic"] },
      { id: "retention", name: "Retention", severity_levels: ["partial", "complete"], duration_options: ["acute", "chronic"] },
      { id: "hematuria", name: "Hematuria", severity_levels: ["microscopic", "gross"], duration_options: ["single episode", "recurrent"] }
    ]),
    autoObservations: JSON.stringify([
      { id: "ipss_score", name: "IPSS Score", type: "number", min: 0, max: 35 },
      { id: "cva_tenderness", name: "CVA Tenderness", type: "select", options: ["None", "Left", "Right", "Bilateral"] }
    ]),
    flowLogicRules: JSON.stringify([
      { condition: { symptom: "frequency", modifier: "LUTS" }, action: { tests: ["USG KUB", "PSA"], priority: "routine" } },
      { condition: { symptom: "burning_micturition", modifier: "with_fever" }, action: { tests: ["Urine Culture"], priority: "urgent" } }
    ]),
    suggestedTests: JSON.stringify([
      { testName: "USG KUB", condition: "LUTS symptoms", mandatory: false },
      { testName: "PSA", condition: "male > 50 years", mandatory: false },
      { testName: "Urine Culture", condition: "fever OR burning", mandatory: false },
      { testName: "Urine Routine", condition: "any urinary symptom", mandatory: false }
    ]),
    suggestedReferrals: JSON.stringify([
      { department: "Nephrology", condition: "renal involvement" }
    ]),
    requiresVitals: true,
    vitalsFields: JSON.stringify(["bp", "temp"]),
    sortOrder: 19
  },
  {
    departmentCode: "PATH",
    departmentName: "Pathology",
    flowType: "service_flow",
    symptoms: JSON.stringify([]),
    autoObservations: JSON.stringify([]),
    flowLogicRules: JSON.stringify([
      { step: 1, action: "Order Received" },
      { step: 2, action: "Sample Collected" },
      { step: 3, action: "Processing" },
      { step: 4, action: "Report Upload" }
    ]),
    suggestedTests: JSON.stringify([]),
    suggestedReferrals: JSON.stringify([]),
    requiresVitals: false,
    vitalsFields: JSON.stringify([]),
    sortOrder: 20
  },
  {
    departmentCode: "RAD",
    departmentName: "Radiology",
    flowType: "imaging_flow",
    symptoms: JSON.stringify([]),
    autoObservations: JSON.stringify([]),
    flowLogicRules: JSON.stringify([
      { step: 1, action: "Imaging Request Received" },
      { step: 2, action: "Scan Execution" },
      { step: 3, action: "Report Dictation" },
      { step: 4, action: "Upload & Verification" }
    ]),
    suggestedTests: JSON.stringify([]),
    suggestedReferrals: JSON.stringify([]),
    requiresVitals: false,
    vitalsFields: JSON.stringify([]),
    sortOrder: 21
  },
  {
    departmentCode: "REHAB",
    departmentName: "Rehabilitation Services",
    flowType: "score_driven",
    symptoms: JSON.stringify([
      { id: "mobility_limitation", name: "Mobility Limitation", severity_levels: ["mild", "moderate", "severe"], duration_options: ["acute", "chronic"] },
      { id: "pain", name: "Pain", severity_levels: ["VAS 1-3", "VAS 4-6", "VAS 7-10"], duration_options: ["localized", "radiating"] }
    ]),
    autoObservations: JSON.stringify([
      { id: "functional_score", name: "Functional Score", type: "number", min: 0, max: 100 },
      { id: "progress_notes", name: "Progress Notes", type: "text" }
    ]),
    flowLogicRules: JSON.stringify([
      { condition: { observation: "improvement", value: "poor" }, action: { plan: "Plan Revision", priority: "routine" } }
    ]),
    suggestedTests: JSON.stringify([]),
    suggestedReferrals: JSON.stringify([
      { department: "Pain Management", condition: "persistent pain" },
      { department: "Orthopedics", condition: "structural issues" }
    ]),
    requiresVitals: true,
    vitalsFields: JSON.stringify(["bp", "pulse"]),
    sortOrder: 22
  },
  {
    departmentCode: "GASTRO",
    departmentName: "Gastroenterology",
    flowType: "symptom_driven",
    symptoms: JSON.stringify([
      { id: "abdominal_pain", name: "Abdominal Pain", severity_levels: ["mild", "moderate", "severe"], duration_options: ["acute", "chronic"], location: ["epigastric", "periumbilical", "RUQ", "LUQ", "RLQ", "LLQ", "generalized"] },
      { id: "vomiting", name: "Vomiting", severity_levels: ["mild", "moderate", "severe"], duration_options: ["acute", "chronic", "recurrent"] },
      { id: "diarrhea", name: "Diarrhea", severity_levels: ["mild", "moderate", "severe"], duration_options: ["acute", "chronic"] },
      { id: "jaundice", name: "Jaundice", severity_levels: ["mild", "moderate", "severe"], duration_options: ["recent", "progressive"] }
    ]),
    autoObservations: JSON.stringify([
      { id: "pain_quadrant", name: "Pain Quadrant", type: "select", options: ["Epigastric", "Periumbilical", "RUQ", "LUQ", "RLQ", "LLQ", "Generalized"] },
      { id: "liver_size", name: "Liver Size", type: "select", options: ["Normal", "Enlarged 1-2 cm", "Enlarged 2-4 cm", "Enlarged > 4 cm"] },
      { id: "stool_history", name: "Stool History", type: "text" }
    ]),
    flowLogicRules: JSON.stringify([
      { condition: { symptom: "jaundice" }, action: { tests: ["LFT", "USG Abdomen"], priority: "urgent" } },
      { condition: { symptom: "diarrhea", modifier: "chronic" }, action: { tests: ["Endoscopy"], priority: "routine" } }
    ]),
    suggestedTests: JSON.stringify([
      { testName: "LFT", condition: "jaundice", mandatory: false },
      { testName: "USG Abdomen", condition: "jaundice OR abdominal pain", mandatory: false },
      { testName: "Endoscopy (UGI/LGI)", condition: "chronic GI symptoms", mandatory: false },
      { testName: "Stool Routine", condition: "diarrhea", mandatory: false }
    ]),
    suggestedReferrals: JSON.stringify([
      { department: "General Surgery", condition: "surgical pathology" },
      { department: "Hepatology", condition: "liver disease" }
    ]),
    requiresVitals: true,
    vitalsFields: JSON.stringify(["bp", "pulse", "temp", "weight"]),
    sortOrder: 23
  }
];

export async function seedOpdDepartmentFlows() {
  console.log("Seeding OPD Department Flows...");
  
  for (const flow of OPD_DEPARTMENT_FLOW_DATA) {
    try {
      await db.insert(opdDepartmentFlows).values(flow).onConflictDoNothing();
      console.log(`  Seeded: ${flow.departmentName}`);
    } catch (error: any) {
      if (error.message?.includes("duplicate key")) {
        console.log(`  Skipped (exists): ${flow.departmentName}`);
      } else {
        console.error(`  Error seeding ${flow.departmentName}:`, error.message);
      }
    }
  }
  
  console.log("OPD Department Flows seeding complete!");
}

// Run if called directly
seedOpdDepartmentFlows();
