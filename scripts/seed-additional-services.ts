import { db } from "../server/db";
import { hospitalServiceDepartments, hospitalServices } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedAdditionalServices() {
  console.log("Starting additional services seeding...");

  const newDepartments = [
    { slug: "day-care-minor-procedure", name: "Day Care & Minor Procedure", description: "Day care and minor procedure services", iconKey: "Clock", displayOrder: 6 },
    { slug: "ent", name: "ENT", description: "Ear, Nose and Throat services", iconKey: "Ear", displayOrder: 7 },
    { slug: "general-surgery", name: "General Surgery", description: "General surgical procedures", iconKey: "Syringe", displayOrder: 8 },
    { slug: "icu-casualty", name: "ICU & Casualty", description: "ICU and Emergency services", iconKey: "Ambulance", displayOrder: 9 }
  ];

  const additionalVascularServices = [
    "TRENDELENBERG OPERATION", "VARICOSE VEINS", "CMV", "EMBOLECTOMIES+FASCIOTOMIES",
    "LUMBAR TYMPANECTOMY", "ON TABLE ANGIOS", "PDA", "THROMBECTOMIES WITH PATCH CLOSURES",
    "TRENDELENBERG + PHLEBECTOMIES", "ARTERIAL VENOUS FISTULA FOR ACCESS", "FEMORAL DIATAL BYPASS",
    "FEMORAL POPLITEAL-BYPASS", "LUMBAR SYMPATHECTOMY/CERVICAL SYMPATHECTOMY",
    "UPPER LIMBS BYPASS (AXILLARY DOWNWARD)", "VASCULAR TRAUMA TO LIMBS", "BRACHEAL/FEMORAL EMBOLECTOMIES",
    "AORTIC ANEURYSM-1", "AORTIC BYPASS-1", "CAROTID ENDARTERECTOMY", "CAROTID ENDARTERECTOMY PATCH CLOSURE",
    "CERVICAL RIB EX", "FE POP BYPASS/FEM FEM OVER", "MAJOR VASCULAR TRAUMA", "SUBCLAVIAN BYPASS",
    "TRANSPOSED BASILIC VEIN FISTULA", "AORTIC DISSECTIONS", "AXILLO FEMORAL BYPASS", "COMPLEX VASCULAR SURGERIES",
    "FEM DISTAL BYPASS", "PERIPHERAL ANEURYSMS", "HORACO ABDOMINAL ANEURYSMS BYPASSES", "AORTIC ANEURYSM-2",
    "AORTIC BYPASS-2", "MAJOR AV MALFORMATIONS", "THORASIC AORTIC ANEURYSMS", "Fistuloplasty",
    "Single segment angioplasty/ stent", "IVC Filter Implantation", "Periperal Thrombolysis", "IVC Filter-Removal",
    "Percutaneous Sclerotherapy", "Bilateral iliac stents in stenosis arteries",
    "Femoropopliteal interventions-DCB,STENT , multi ple segments", "Tibial interventions",
    "Aneurysms of extremities", "Acute DVT, Mechanical Thromboaspiration/ thrombolysis",
    "Coeliac/ SMA,Renal stenting", "Peripheral Angioplasty (Renal/Abdo/Aortic/Cerebral)",
    "Carotid Angioplasty", "Subclavian/ Vertebral - Angioplasty", "IVC/ Hepatic /central/iliac venoplasty (Adult)",
    "Renal Artery Embilization", "Aortobiiliac reconstruction", "Bilateral iliac stents in CTO",
    "Femoropopliteal atherectomy,mechanical thromboaspiration", "Hybrid procedures_ open surgery and endovascular",
    "Multisegment angioplasty/ stent in iliac/SFA/pop/tibial at one sitting", "AAA Stenting/Aortic disection",
    "Thoracic Aortic Aneurysm Endovascular Stent Grafting"
  ];

  const dayCareServices = [
    "Antenatel Profile", "BBM Acoustic India Bone Density BMD Spine Femur", "BERA", "Blood tubing ( Paediatric)",
    "Cerebral Palsey Clinic", "CPAP Titration", "Ear Wax Removal - 1 Ear", "Ear Wax Removal - 2 Ear",
    "EEG", "EEG-PORTABLE", "EMG & NCV", "EMG & NCV (All Four Limbs)", "EMG & NCV (PORTABLE)",
    "EMG (PORTABLE)", "EMG/NCV PORTABLE (OUTSOURCE)", "Evlt Machine Charges", "Fundus Photo ( Colour Only)",
    "CORONARY ARTERY CALCIUM SCORE", "MRCP", "NCV", "NCV (PORTABLE)", "Portable EEG Monitoring (24 Hrs)",
    "Portable Pulse Oximeter Charges", "PORTABLE SPIROMETRY CHARGES", "Renal Transplant Pre-Op",
    "Repetitive Nerve conduction study", "RNS (DECREMENTAL)", "Short Services in Day Care", "Six Minutes Walk Test",
    "SKIN PRICK TEST", "Spirometry (Post)", "SSEP", "Umbelical Catheterisation", "VEP (FLASH)",
    "VEP (PATTERN)", "VIDEO EEG 1HR", "VIDEO EEG 2HRS", "VIDEO EEG 4 HRS", "Articulation therapy",
    "Auditory verbal training", "BERA Plus ASSR (Audiometry)", "Functional Endoscopic Evaluation of Swallowing",
    "Neurogenic communication disorders therapy", "Neurogenic communication disorders Assessment",
    "Paediatric Speech & language assessment", "Sleep Endoscopy", "Special audiometry tests", "Speech Assessment",
    "Video Laryngoscopy", "Video otoscopy- Both Ear", "Voice Assessment", "Voice Therapy",
    "ACUTE PERITONIAL DIALYSIS", "ADDITIONAL CHARGES FOR IABP", "ADDITIONAL CHARGES -TRACHESTOMY",
    "AK POP/ AE POP", "AK SLAB/ AE SLAB", "ANAESTHETIST CHARGES", "ANKLE STRAPPING", "ARM TO CHEST STRAPPING",
    "Arterial Line Insertion", "Ascitic Tapping", "ASPIRATION OF HIP/KNEE/SHOULDER/WRIST/ELBOW/ANKLE",
    "Associate Surgeon Charges", "Barium/ Urography Neonatal enema Study", "BEDSIDE SKELETAL /TIBIA TRACTION",
    "BEDSIDE SKULL TRACTION", "BIMONTHLY POST - DIALYSIS PACKAGE", "BIMONTHLY PRE - DIALYSIS PACKAGE",
    "BK POP/ BE POP", "BK SLAB/ BE SLAB", "Bladder Wash", "BMD Paediatric", "BMD Spine Femur",
    "BMD Spine Femur Forum", "BONE MARROW ASPIRATION/BIOPSY (procedure charges)", "BOTOX INJ IN MINOR OT",
    "BUDDY STRAPPING", "BURN DRESSING", "C PAP", "Central Line Insertion",
    "CHEMICAL CAUTERIZATION (TCA/SIL. NITRATE) EAR/NOSE", "CHEMO PORT REMOVAL UNDER LA",
    "CLW SUTURING - MINOR (PLASTIC SURG)", "COLLAGEN APPLICATION FOR BURNS LESS THAN 1 PERCENT BSA (PLASTIC SURG)",
    "Complete PFT with DLCO", "COMPLEX DENTAL EXTRATION", "CORN EXCISION", "CR UNDER LA FOR PHALANGEAL FRACTURE",
    "Cryopreservation Charges", "CYSTOSCOPY BLADDER BIOPSY", "DEBRIDEMENT (LA/GA) (PAED)",
    "DENTAL SPLINTING FOR STABILIZATION OF TOOTH", "DIAGNOSTIC LARYNGOSCOPY WITH 70 DEGREE ENDOSCOPE",
    "Dialysis catheter removal", "Dialysis Charges", "Dialysis Line Insertion", "DJ STENTING WITH RIGID SCOPE",
    "DRESSING (CABG)", "E.C.G", "EAR LOBE REPAIR- UNILATERAL (PLASTIC SURG)", "EAR MICROSCOPY", "ECT charges",
    "EMERGENCY DEEP WOUND SUTURING & TENDON REPAIR", "EMG & NCV (All Four Limbs) PORTABLE", "ENT Minor Procedure",
    "Epidural catheter insertion", "EPLEY MANEUVER FOR VERTIGO", "Exchange Transfusion",
    "EXCISION OF INDEX FINGER GRANULOMA UNDER LA", "EXCISION OF MOLE / TATTOO (PLASTIC SURG)",
    "EXTERNAL FIXATOR REMOVAL UNDER LA (MINOR)", "EXTERNAL VENTRICULAR DRAINAGE (Bedside procedure)",
    "F.N.A.C (ENT)", "FEMORAL NERVE BLOCK (BEDSIDE PROCEDURE)", "Fibre optic intubation",
    "First Dialysis Charges", "FIXING OF DISLOCATED JAW WITH SIMPLE MANIPULATION", "Fnac Procedure Charge",
    "Foley's Catheterisation", "FOREIGN BODY REMOVAL- EAR/NOSE/THROAT (MINOR)", "FRAX Option",
    "GASTRIC ASPIRATION", "HEMATOMA ASPIRATION", "HICKMAN CATHTER RERMOVAL UNDER LA", "HSPL BMD Spine Femur Forum",
    "I&D (LA) MINOR", "ICD INSERTION (MINOR OT)", "ICU BEDSIDE PROCEDURE -FASCIOTOMY", "IITV SPINAL BLOCK",
    "Incision & Drainage of small to medium Abscess Under GA", "INTERCOSTALS NERVE (BEDSIDE PROCEDURE)",
    "Interstial BrachytherapyAnaethetistcharge (Level2)", "INTRA-ARTICULAR STEROID INJECTION (MINOR)",
    "INTRALESIONAL STEROID INJECTION FOR SUBMUCOUS FIBROSIS (EACH SITTING)", "INVASIVE VENTILATOR CHARGES (PER DAY)",
    "LABIAL SYNECHIOTOMY (PAED)", "Large Dressing (CABG)", "LASER FOR ROP (PER EYE)", "Layringoscopy charges",
    "LOCAL NON-INTRA ARTRICULAR INJ", "LUMBAR DRAIN PLACEMENT", "LYMPH NODE BIOPSY UNDER LA",
    "MAJOR DRESSINGS (Ortho / Diabitic foot)", "MAJOR WOUND CLOSURE (15CM & ABOVE)", "Medium Dressing",
    "Medium Dressing (Fistula)", "MINOR DRESSINGS", "MINOR DRESSINGS (DIABETIC FOOT)", "MULTISTICKS TEST",
    "MYOFASCIAL BLOCK/TRIGGER POINT INJECTION (BEDSIDE PROCEDURE)", "NASAL ENDOSCOPY", "NEEDLE LIVER BIOPSY",
    "NEEDLE LIVER BIOPSY/ FNAC OF INTERNAL ORGANS (PAED)", "OBTURATOR", "Oral Biopsy", "OT CHARGES HALF HOURLY",
    "OT CHARGES PER HOUR", "PCNL Dialator", "PERITONEAL DRIANAGE WITH LAVAGE", "Perm Cath Removal",
    "Phlebotomy procedure charge", "PILE BANDING/INJECTION OF PILE (LA)", "PLASTERING CHARGES (LARGE)",
    "PLASTERING CHARGES (MEDIUM)", "PLASTERING CHARGES (SMALL)", "PTB CASTING", "RECTAL BIOPSY",
    "RE-IMPLANTATION OF PULP OF FINGER (PROXIMAL PHALANX)", "REMOVAL OF DJ STENT", "REMOVAL OF FOLEYS CATHATER",
    "Removal Of Plaster", "REMOVAL OF SUPERFICIAL K-WIRE (MINOR)", "REMOVAL OF UNCOMPLICATED FINGER/TOE NAIL (MINOR)",
    "RIB STRAPPING", "R-J STRAPPING", "SCAR REVISION -SMALL (PLASTIC SURG)", "SEBACEOUS CYST EXCISION UNDER LA",
    "SEROMA ASPIRATION", "SIMPLE DENTAL EXTRACTION", "SINGLE LYMPH NODE BIOPSY-SIMPLE (GA) (PAED)",
    "SLED Dialysis", "Spirometry (Pre & Post)", "Spirometry (Pre)", "Spirometry Test Followup / PRE",
    "STANDBY PHYSICIAN/CARDIOLOGIST/SURGN CHARGES", "Stem Cell Infusion Charge", "STEM CELL PRESERVATION",
    "STEROID/SCLEROTHERAPY INJECTION IN HEMANGIOMA (GA)", "Suprapubic catheterisation", "Suture Removal & Dressing",
    "SUTURE REMOVAL (MINOR)", "SUTURE REMOVAL UNDER G.A - LEVEL 1", "Suturing charges (small)",
    "TEG TEST(Thromoelestography)-outsource", "TESTICULAR/SCROTAL BIOPSY", "TM JOINT REDUCTION OPD BASIS",
    "Total Body Composition", "TURP CUTTING LOOP", "URETHRAL DILATATION", "URETHRAL DILATATION (PAED) LA/GA",
    "Uroflowmetry study", "UROLOGY SCREENING PACKAGE", "USG GUIDED SUPRAPUBIC CATHETERISTION",
    "VACCUM DRESSING (BEDSIDE PROCEDURE)", "VACCUME DRESSING ( FOLLOW UP)", "VACCUME DRESSING (IST SITTING)",
    "Ventilator half day", "WAX REMOVAL", "Autologus Serum Treatment", "COSMOTOLOGY PROC IN MINOR OT(BOTOX)",
    "Cryo - Medium", "Cryo - small", "Glycolic acid peel", "Hand Peeling - 1 Session", "Hand Peeling - 6 Sessions",
    "MICRODERMA WITH PEEL", "Montreal Cognitive Assessment (MoCA)", "Only Peel", "RF Cautery-Large",
    "RF Cautery-medium", "RORSCHAH INK-BLOT TEST (ROR)", "Salicylic acid peel", "SR AFT 570 LASER TREATMENT",
    "ST AFT 800 LASER TREATMENT", "Acrobat I Stabilizer", "Adenbrooks Cognitive Examination 3 (ACE3)",
    "Admission Fees", "Alpha Bed Charges (xcell)", "Alpha Bed Disinfection Charges", "Amplatz Renal Dilator Set",
    "Apheresis Procedure charge", "Apollo RF Aspirating Ablator", "Apollo RF aspirating ablator (90D)",
    "Arotic Punch 3.5mm", "Arotic Punch 4.00mm", "Attendant charges", "Audio and Video recording charges",
    "AUTOCLAVE", "Barber Charge", "Barber Charges ( Head shaving/ hair cut)", "Barber Charges (Body Part Shaving)",
    "Barber Charges (Full body shaving)", "Bed Sheet", "Bili Blanket", "Bilirubin by Bilicheck",
    "Biopsy Gun", "Bipap machine charge", "Bipap Machine For Nasal Ventilation", "BIS MONITORING SENSOR",
    "Blood bag docking charges (JKRP)", "Blood component irradiation (OS-JKRP)", "Blood Culture Bottle",
    "Blood Glucose By Glucometer", "BMT Transplant Procedure charges", "Body Mass Analyses test",
    "Bone marrow Biopsy (package)", "Bronchoscopy with Lavage( BAL)", "BURN DRESSING (40 Percent)",
    "C - ARM", "C -PAP machine charge", "Cardiac Output Monitoring", "Cardiac Screening Package",
    "Childrens Apperception Test (CAT)", "Coablation", "Coablation Wand", "Cobalator Equipment",
    "Counseling child and parent (60 minutes child and 30 minutes parent)", "Courier Charges",
    "CPM MACHINE CHARGES", "CPM MACHINE CHARGES PER DAY", "CRFT bone grafting implant", "CRRT 12 HRS",
    "CRRT 24Hrs", "CSSD CHARGES", "CT -Abdomen Contrast (Outsource)", "Cvv HD Procedure Charge",
    "Cytosorb Device", "Developmental Assessment Scale for Indian Infants", "Diabetic Clinic registration Charge",
    "Dialysis Hepatitis B Vaccination", "Diet Councelling Charges", "Dietecian Charges",
    "Disposable Electrosurgical Snare", "Distal attachment", "Districath",
    "DSM Screening for Autism Spectrum Disorder and other disorders",
    "DSM Screening for Behavioural Disorders (ADHD/Conduct/ ODD)", "Dual Lumen Catheter Kit",
    "Duplicate CT / MRI film", "DUPLICATE FILMS & REPORTS (PER FILM)", "Duplicate X ray film",
    "Embalbing charge", "Endo GIA Ultra Universal Stapler", "Endo GIA Ultra Universal Stapler 12mm XL",
    "Extra Film", "Eye check", "Femoral Component", "FLEXIBLE CYSTOSCOPE -For Minor Procedure",
    "FLEXIBLE URTEROSCOPE", "Flotutrac Sensor", "Flowtron Equipment calf-58cm /DVT20",
    "Flowtron Equipment Charge- L501 /DVT10", "Flowtron Equipment- thigh /DVT40",
    "Flowtron Equipment-71cm- thigh L503 /DVT30", "Harmonic", "HARMONIC FOCUS", "Harmonic HD 1000",
    "Harmonic HD 1000i Shears", "Harmonic Lap (Ref-ACE36E)", "Harmonic Probe", "Hemoclip Olympus",
    "Hemorrohoid Proximate", "Hemostatic Matrix", "HFO CONSUMABLES", "HGT", "Home Visit Minor Dressing",
    "HOSPITAL UNIFORM CHARGES", "Implants Charges", "Intergard Woven", "Intra-articular Visco-supplementation",
    "Irradiation of Blood Bag", "Kamath - Binet Test of Intelligence", "Kidney Screening Package",
    "LASER CHARGES - GRADE B", "LASER CHARGES ( for Laser assisted surgeries) UPTO ONE HOUR",
    "LASER CHARGES (for Laser assisted surgeries)", "LASER CHARGES- GRADE A", "Liver Screening Package",
    "LMA 2.5", "LMA Advance", "LMA4 Classic", "Lone Star Retractor Colorectal", "M.R.I. Anaesthesia Charges",
    "MCMI (Adolescent and Adult)", "Meniscal Clinch", "MICRO DRILL", "MORTURY CHARGES PER DAY",
    "MSLT (DAY-TIME STUDY)", "Neonatologist Charges During Delivery", "Neuropsychological Assessment Battery for children",
    "Outside CROSS MATCH for FFP", "Outside CROSS MATCH for PC", "Outside CROSS MATCH for PCV",
    "Outside CROSS MATCH for SDP", "Outside CROSS MATCH for Whole Blood", "Packed Cell Tranfusion Charges",
    "Packed Cells - No Replace (OS)", "Paediatric Blood Bag", "Paediatric Cardiac Screening",
    "Palacos Cement", "PANTOTHAL INTERVIEW LEVEL-1", "PCV for Outside", "Phototherapy charges (double)",
    "Phototherpy charges(single)", "Plasma Pheresis & Filter", "Plasma Pheresis Filter Paediatric",
    "PLASMAPHERESIS", "Port Flushing charges", "Private Nurse Charges(12hrs)", "Psychiatry Counselling",
    "Psycho educational Test battery", "RDP(JKBB)", "RDP(OS) Issue", "Registration Fee", "Reload Gun",
    "ROP SCREENING", "Sanitization charges", "Screener for Child Anxiety Related Emotional Disorders (SCARED)",
    "S-Curved Urethral Dilator", "SDP for Outside", "SDP In house /OS (res)", "SDP Reservation (OS)",
    "Second Opinion Charges (CT/MRI)", "Sequin Form Board Test (SFB)", "Serv.Capsure Fixation",
    "Servo Humidifier", "Sevorane", "SINGLE DONAR PLATELET PROCEDURE(OS)", "SINGLE DONOR PLATELET PROCEDURE Tranfusion charges",
    "SKIN IQ", "SKIN IQ Disinfection Charges", "SMALL/MINOR DRESSING", "Speech and language assessment",
    "Speech and language therapy", "SPLIT NIGHT STUDY", "Steri Talc", "Stone Extractor NTSE-022115-UDH",
    "Suture Anchor", "Syringe Pump In Ward(perday)", "Taylor Manifest Anxiety Scale", "TEG", "Traction Rental",
    "Ureteral Dilator with 60cm", "Urine Ketone Sticks", "USG machine in OT: IV line access",
    "USG machine in OT: Regular", "Ventilator Per Day", "Volume view combo kit", "Warmer Blanket",
    "WARMER CHARGES", "Yellow Bulldog", "ZTCC SERVICE CHARGES FOR CADVOR (ORGAN) ALLOCATION"
  ];

  const entServices = [
    "AUROPLASTY (EAR LOBE REPAIR) LEVEL-1", "CAUTERIZATION OF TYMPANIC MEMBRANE UNDER G.A. LEVEL-1",
    "CLOSURE OF TRACHEOSTOMY LEVEL-1", "DIAGNOSTIC NASAL ENDOSCOPY WITH PACK REMOVAL -LEVEL 1",
    "DIAGNOSTIC SINUSCOPY LEVEL-1", "EAR POLYPECTOMY LEVEL-1", "ENT SURGERY LEVEL-1",
    "FOREIGN BODY REMOVAL (NOSE/EAR) UNDER GA LEVEL-1", "GRANULOMA EXCISION LEVEL-1", "I&D OF ABCESS LEVEL-1",
    "INFERIOR TURBINATE CAUTERIZATION LEVEL-1", "MYRINGOTOMY LEVEL-1", "NASAL PACKING FOR EPITAXIS (ANTERIOR) LEVEL-1",
    "ORAL SUTURING GRADE 1 (LIP/TONGUE/CHEEK) LEVEL-1", "SUPERFICIAL BIOPSY- MUCOUS MEMBRANE/GRANULATION LEVEL-1",
    "ADENOIDECTOMY LEVEL-2", "CERVICAL NODE EXCISION LEVEL-2",
    "ENDOSCOPIC CAUTERIZATION OF EPISTAXIS (UNCOMPLICATED) (LA) LEVEL-2", "ENT SURGERY LEVEL-2",
    "I&D PERITONSILLAR (QUINSY) LEVEL-2", "INTRA ORAL REMOVAL OF SUBMANDUBILAR DUCT STONES (Multiple) LEVEL-2",
    "MYRINGOTOMY WITH GROMMET INSERTION LEVEL-2", "NASAL BONE REDUCTION -LEVEL-2",
    "NASAL PACKING FOR EPISTAXIS (ANTERIOR/POSTERIOR) LEVEL-2", "OPENING OF YOUNG'S CLOSURE UNDER LA LEVEL-2",
    "ORAL SUTURING-MULTIPLE INJURY INCLUDING FACE/SCALP LEVEL-2", "RESECTION OF SUBMUCOUS RETENTION CYST OF LIP LEVEL-2",
    "Sleep Study (Level 2)", "SMR / SEPTOPLASTY LEVEL-2", "TONGUE TIE RELEASE LEVEL-2", "TURBINECTOMY LEVEL-2",
    "ADENOIDECTOMY BY COBLATION LEVEL-3", "DL SCOPY/ ML SCOPY/ CRICOPHARYNGOSCOPY LEVEL-3",
    "ENDOSCOPIC ADENOIDECTOMY WITH NASAL ENDOSCOPY LEVEL-3",
    "ENDOSCOPIC CAUTERIZATION OF EPISTAXIS (COMPLICATED) (GA) LEVEL-3", "ENT SURGERY LEVEL-3",
    "I&D ABCESS (UNCOMPLICATED) PARAPHARYNGEAL/RETROPHARYNGEAL LEVEL-3", "MEOTOMY- BILATERAL MIDDLE MEATUS LEVEL-3",
    "MYRINGOPLASTY LEVEL-3", "PERITONSILLAR AND PALATAL ABSCESS LEVEL-3", "PRE-AURICULAR SINUS EXCISION LEVEL-3",
    "REDUCTION OF # NASAL BONES & RELOCATION OF SEPTUM LEVEL-3",
    "SEPTOPLASTY WITH SPURECTOMY WITH CORRECTION OF CAUDAL DISLOCATION LEVEL-3",
    "SUBMANDIBULAR SALIVARY DUCT CALCULI REMOVAL & I/D OF ABSCESS OF DUCT LEVEL -3", "TONSILLECTOMY LEVEL-3",
    "YOUNG'S CLOSURE UNDER LA LEVEL-3", "ADENOIDECTOMY / TONSILLECTOMY WITH COBLATION TECHNIQUE (LEVEL 4)",
    "ADENOIDECTOMY WITH BIL.GROMMET L-4", "ENT SURGERY LEVEL-4", "ML SCOPY- UNILATERAL VOCAL CORD PATHOLOGY LEVEL-4",
    "OSSICULOPLASTY LEVEL-4", "SEPTOPLASTY WITH INFERIOR TURBINATE OR CAUTERIZATION LEVEL-4",
    "STYLOID PROCESS EXCISION LEVEL-4", "TONSILLOADENOIDECTOMY LEVEL-4", "TYPE-1 TYMPANOPLASTY LEVEL-4",
    "UNILATERAL AC POLYP- FRONTAL SINUS/ANTERIOR ETHMOIDAL SINUS LEVEL-4", "UNILATERAL FESS LEVEL-4",
    "BALLOON SINUPLASTY LEVEL-5", "BILATERAL AC POLYP ( MAXILLARY SINUS ) - LEVEL 5", "BILATERAL FESS LEVEL-5",
    "BILL.FESS WITH SEPTOPLASTY LEVEL-5", "ENDOSCOPIC ADENOIDECTOMY WITH MYRINGOTOMY LEVEL-5",
    "ENDOSCOPIC DCR LEVEL-5", "ENDOSCOPIC SEPTOPLASTY WITH TURBINECTOMY LEVEL-5",
    "ENT LEVEL-5 ASSOCIATE SURGEON CHARGES", "ENT SURGERY LEVEL-5",
    "ESOPHAGOSCOPY FOR FOREIGN BODY & DILATATION LEVEL-5", "ETHMOIDAL POLYP ( ANT./ POST.) - LEVEL 5",
    "EXPLORATORY TYMPANOTOMY LEVEL-5", "FESS- UNILATERAL INVOLVING ONLY ONE SINUS LEVEL-5", "HEMIGLOSSECTOMY L-5",
    "IMPLANTATION OF GOLD UPPER EYELID IN FN PLASTY LEVEL-5", "MASTOIDECTOMY WITH TYMPANOPLASTY LEVEL-5",
    "ML SCOPY WITH EXCISION OF BOTH VOCAL CORDS LEVEL-5", "OESO-PHAGOSCOPY FOR FOREIGNBODY & DILATION - LEVEL 5",
    "ORBITAL ABCESS LEVEL-5", "REVISION MYRINGOPLASTY LEVEL-5", "SUBMANDIBULAR SALIVARY GLAND EXCISION LEVEL-5",
    "SUBMANDIBULAR SALIVAY GLAND EXCISION - LEVEL 5", "TYMPANOPLASTY WITH PARTIAL OSSICULOPLASTY LEVEL-5",
    "UNILATERAL FESS WITH SEPTOPLASTY LEVEL-5", "ANT.COMMISSURE GROWTH - LEVEL 6",
    "BILATERAL FESS WITH MYRINGOTOMY LEVEL-6", "BILATERAL FESS WITH SEPTOPLASTY LEVEL-6",
    "ENT LEVEL-6 ASSOCIATE SURGEON CHARGES", "ENT SURGERY LEVEL-6", "EXCISION OF BRONCHIAL FISTULA LEVEL-6",
    "EXCISION OF SUBMANDIBULAR GLAND WITH HAEMANGIOMA LEVEL-6", "INJECTION LARYNGOPLASTY COMPLICATED - LEVEL 6",
    "MASTOIDECTOMY WITH COMPLICATIONS LEVEL-6", "MAXILLARY/ ETHMOIDAL (ANT./ POST.) - LEVEL 6",
    "ML SCOPY FOR COMPLICATED CONDITIONS LEVEL-6", "MULTIPLE FACIAL INJURY- MAXILLARY & MANDIBULAR FRACTURES LEVEL-6",
    "PARTIAL PINNA RECONSTRUCTION SURGERY LEVEL-6", "REINKE'S OEDEMA LEVEL-6", "REVISION TYMPANOPLASTY LEVEL-6",
    "RHINOPLASTY MINOR LEVEL-6", "STAPEDECTOMY (UNCOMPLICATED) LEVEL-6", "THYROPLASTY- UNCOMPLICATED LEVEL-6",
    "TYMPANOPLASTY WITH CONICAL MASTOIDECTOMY LEVEL-6", "TYMPANOPLASTY WITH TYPE 2 OSSICULOPLASTY LEVEL-6",
    "A) ( ORBITAL ) PANPOLYPOSIS B) COMP. ( MAXILLARY, ANTERIOR / POSTERIOR, ETHMOIDAL LEVEL-7",
    "AC POLYPECTOMY LEVEL-7", "BL FESS WITH SEPTOPLASTY WITH BILATERAL TURBINECTOMY LEVEL-7",
    "CANAL WALL DOWN TYMPANOPLASTY LEVEL-7", "ENDOLYMPHATIC SAC DECOMPRESSION LEVEL-7",
    "ENDOSCOPIC C.S.F LEAK REPAIR LEVEL-7", "ENT LEVEL-7 ASSOCIATE SURGEON CHARGES", "ENT SURGERY LEVEL-7",
    "EXCISN OF SEPTAL MASS & FESS WITH SEPTOPLASTY WITH TURB.CAUTERY & TURBINECTOMY LEV-7",
    "FESS UNILATERAL COMPLICATED FOR SINUSITIS LEVEL-7",
    "SEPTOPLASTY WITH BILAT. FESS WITH BILAT CAUTRY TO NASAL VARICUS LEVEL-7",
    "SEPTO-RHINOPLASTY WITH BILATERAL INF. TURBINOPLASTY LEVEL-7", "SUPERFICIAL PAROTIDECTOMY LEVEL-7",
    "TRACHEAL REPAIR/ RECONSTRUCTION LEVEL-7", "TYMPANOPLASTY WITH CORTICAL MASTOIDECTOMY WITH OSSICULOPLASTY LEVEL-7",
    "ANGIOFIBROMA COMPLICATED LEVEL-8", "B.A.H.A LEVEL-8",
    "BL EXTENSIVE FESS WITH EROSIVE FUNGAL SINUS/DISEASE LEVEL-8",
    "BL EXTENSIVE FESS WITH SEPTOPLASTY WITH INFERIOR TURBINOPLASTY LEVEL-8",
    "DL SCOPY WITH EXCISION OF BLEEDING ZENKERS DIVERTICULAM LEVEL-8", "ENT LEVEL-8 ASSOCIATE SURGEON CHARGES",
    "ENT SURGERY LEVEL-8", "FACIAL NERVE DECOMPRESSION LEVEL-8", "LABYRINTHECTOMY LEVEL-8",
    "OPTIC NERVE DECOMPRESSION LEVEL-8", "RADICAL MASTIODECTOMY WITH TYPE III TYMPANOPLASTY LEVEL -8",
    "SEPTO-RHINOPLASTY WITH TIP & ALA RECONSTRUCTION LEVEL-8",
    "STAPEDECTOMY COMPLICATED/ REVISION STAPEDECTOMY LEVEL-8", "SURGERY FOR SNORING LEVEL-8",
    "TYMPANOPLASTY WITH CANALPLASTY & OSSI. CHAIN RECONSTR. WT TITANIUM PROST./BOW CARTIL (CH. EXTRA) L-8",
    "ACOUSTIC NEUROMA LEVEL-9", "COCHLEAR IMPLANT LEVEL-9", "CONGENITAL ATRESIA OF E A C LEVEL-9",
    "ENT LEVEL-9 ASSOCIATE SURGEON CHARGES", "ENT SURGERY LEVEL-9", "FESS FOR CSF RHINORRHEA LEAK REPAIR LEVEL-9",
    "FESS FOR PITUITARY TUMOURS LEVEL-9", "Radical Parotidectomy & subtotal petrosectomy with R.N.D-LEVEL 9",
    "TOTAL PINNA RECONSTRUCTION LEVEL-9", "Assesment Charges(speech Therapy)", "Audiometry",
    "CORNEAL & SCLERAL TEAR REPAIR", "DIAGNOSTIC SLEEP STUDY", "DOCTOR'S INSTRUMENT CHARGES FOR ROP",
    "Foreign Body Removal - ENT", "Impedance Audiometry", "Otoacoustic Emission (OAE)", "Pure Tone Audiogram",
    "Sleep Study Reporting Charges", "Speech Therapy"
  ];

  const generalSurgeryServices = [
    "DEBRIDEMENT UNDER LA/SA LEVEL 1", "DIAGNOSTIC LARYNGOSCOPY LEVEL- 1",
    "EXCISION OF LUMP/CYST/LIPOMA (small size) UNDER LA LEVEL1",
    "EXCISION OF MEDIASTINAL CYST FOR RESPIRATORY DISTRESS LEVEL-9", "EXCISION OF SEBACEOUS CYST (LA) LEVEL 1",
    "EXCISION OF WART LEVEL1", "G.SURG. SURGERY LEVEL-1", "G.SURG. SURGERY LEVEL-1A",
    "ICD INSERTION UNDER ANAESTHESIA LEVEL-1", "INCISION & DRAINAGE OF ABCESS-SMALL LEVEL-1",
    "INSERTION OF ABDOMINAL DRAIN FOR PERFORATIVE PERITONITIS LA LEVEL-1", "LUMBAR DRAIN PLACEMENT LEVEL-1",
    "LYMPH NODE BIOPSY LEVEL 1", "PREPUCIAL ADHESIOLYSIS LEVEL-1", "PUNCH BIOPSY LEVEL-1",
    "REMOVAL OF HICKMAN CATHETER LEVEL-1", "REMOVAL OF UNCOMPLICATED FINGER/TOE NAIL UNDER LA",
    "SECONDARY SUTURING LEVEL 1", "TOE AMPUTATION LEVEL 1A", "CIRCUMCISION LEVEL-2",
    "CLOSURE OF BILATERAL INGUINAL HERNIA INCISION LEVEL-2", "DEBRIDEMENT OF WOUND LEVEL 2",
    "EXCISION OF LARGE COMPLICATED & INFECTED CYST UNDER LA LEVEL-2", "EXCISION OF LUMP/CYST/LIPOMA (GA) LEVEL 2",
    "EXCISION OF SINGLE FIBROADENOMA LEVEL2", "FISTULA - LOW FISTULECTOMY LEVEL-2", "G.SURG. SURGERY LEVEL-2",
    "GASTROSCOPY IN OT LEVEL -2", "INCISION & DRAINAGE OF SMALL ABSCESS - LEVEL 2",
    "INSERTION OF ABDOMINAL DRAIN FOR PERFORATIVE PERITONITIS GA LEVEL-2",
    "INTRA- ABDOMINAL ROLLER PACK REMOVAL L-2", "INTRA OPERATIVE ENDOSCOPY LEVEL-2",
    "LOCAL EXPLORATION OF STAB WOUND LEVEL2", "OMAYA CHAMBER / RESERVOIR PLACEMENT LEVEL 2",
    "RECTAL POLYPECTOMY LEVEL- 2", "REMOVAL OF MULTIPLE PALLETS FROM THE FACE LEVEL-2",
    "SECONDARY SUTURING- LARGE WOUND- (GA) LEVEL 2", "SPHINCTER STRETCHING / ANAL STRETCHING LEVEL 2",
    "SPHINCTER STRETCHING WITH EXCISION OF EXT. TAGS LEVEL-2",
    "SPHINCTERECTOMY FOR FISSURE/LATERAL SPHINCTERECTOMY LEVEL2",
    "TRACHEOSTOMY FISTULA CLOSURE / TRACHEOSTOMY LEVEL-2",
    "WEDGE RESECTION WITH PHENOLISATION WITH VANDON BOS PROCEDURE UNDER GA LEVEL-2",
    "ABDOMINAL WALL ABSCESS DEBRIDEMENT LEVEL-3", "ANAL STRETCHING WITH MANUAL EVACUATION OF FECES LEVEL-3",
    "BREAST LUMPTECTOMY - LEVEL 3", "CARBUNCLE EXCISION LEVEL-3", "COLOSTOMY ONLY LEVEL-3A",
    "DEEP CUT OVER ANT. SURFACE OF NECK LEVEL-3", "DIAGNOSTIC LAPAROSCOPY WITH/WITHOUT BIOPSY LEVEL-3",
    "ESOPHIGEAL DILATION UNDER GA LEVEL - 3", "EXCISION OF BILATERAL/MULTIPLE FIBROADENOMAS LEVEL 3",
    "EXCISION OF GANGRENOUS SKIN & SOFT TISSUE WITH INGUINAL LN LEVEL-3",
    "EXCISION OF GYNAECOMASTIA (UNILATERAL) LEVEL 3", "EXCISION OF MULTIPLE CYST LEVEL-3",
    "EXPLORATION OF MULTIPLE STAB WOUNDS (UPTO 3 WOUNDS) LEVEL-3", "EXTENSIVE DEBRIDEMENT OF WOUND-LEVEL 3",
    "FACIOTOMY FOR NECROTISING FASCITIS LEVEL-3", "FEEDING GASTROSTOMY/JEJUNOSTOMY LEVEL 3",
    "FISSURECTOMY WITH IRC FOR HAEMRROIDS LEVEL- 3", "FISSUREECTOMY / SPHINTERECTOMY LEVEL-3",
    "FISTULECTOMY WITH I&D FOR PERIANAL ABCESS LEVEL-3A", "G.SURG. SURGERY LEVEL-3",
    "GASTROSCOPIC FOREIGN BODY REMOVAL LEVEL-3", "HAEMORROIDECTOMY LEVEL-3", "HYDROCELE (UNILATERAL) LEVEL 3",
    "I&D PERIANAL ABCESS LEVEL-3", "I&D WITH DESLOUGHING SEQUESTERECTOMY OF FOOT LEVEL-3",
    "LARGE COMPLICATED ABCESS DRAINAGE LEVEL-3", "MULTIPLE FACIAL WOUNDS REPAIR LEVEL-3",
    "OMPH LECTOMY / UMBILICAL SINUS EXCISION LEVEL-3", "ORCHIDOPEXY LEVEL-3", "POLYPECTOMY LEVEL-3",
    "RELEASE OF TENDON LEVEL-3", "RELEASE OF TRIGGER FINGER LEVEL-3", "REPAIR OF CLEFT LIPS LEVEL-3",
    "REPAIR OF VENTRAL HERNIA WITH MESH LEVEL-3", "REPAIR OF MINOR FACIAL LACERATIONS LEVEL-3",
    "RETROAURICULAR / SUBMANDIBULAR ABSCESS I&D LEVEL-3", "SPLIT THICKNESS SKIN GRAFTING - SMALL AREA LEVEL-3",
    "SPLENECTOMY LEVEL-3", "SUPERFICIAL ABSCESS I&D LEVEL-3", "TONSILLECTOMY LEVEL-3",
    "ORCHIDOPEXY (BILATERAL) LEVEL-4", "INCISIONAL HERNIA REPAIR WITH MESH LEVEL-4",
    "INGUINAL HERNIA REPAIR (UNILATERAL) LEVEL-4", "APPENDICECTOMY LEVEL-4", "VARICOSE VEIN (STRIPPING) LEVEL-4",
    "CHOLECYSTECTOMY (OPEN) LEVEL-4", "LAPAROSCOPIC CHOLECYSTECTOMY LEVEL-4", "G.SURG. SURGERY LEVEL-4",
    "HEMORRHOIDECTOMY (STAPLER) LEVEL-4", "FISTULA IN ANO - HIGH LEVEL-4", "PILONIDAL SINUS EXCISION LEVEL-4",
    "THYROID SURGERY - HEMITHYROIDECTOMY LEVEL-4", "BREAST LUMP EXCISION LEVEL-4",
    "LAPAROSCOPIC HERNIA REPAIR (UNILATERAL) LEVEL-4", "UMBILICAL HERNIA REPAIR LEVEL-4",
    "INGUINAL HERNIA REPAIR (BILATERAL) LEVEL-5", "INCISIONAL HERNIA REPAIR - LARGE LEVEL-5",
    "LAPAROSCOPIC APPENDICECTOMY LEVEL-5", "THYROID SURGERY - TOTAL THYROIDECTOMY LEVEL-5",
    "MASTECTOMY - SIMPLE LEVEL-5", "G.SURG. SURGERY LEVEL-5", "LAPAROSCOPIC HERNIA REPAIR (BILATERAL) LEVEL-5",
    "GASTRIC SURGERY - GASTROJEJUNOSTOMY LEVEL-5", "BOWEL RESECTION - SMALL BOWEL LEVEL-5",
    "LAPAROSCOPIC COLOSTOMY LEVEL-5", "LAPAROSCOPIC ADHESIOLYSIS LEVEL-5",
    "MODIFIED RADICAL MASTECTOMY LEVEL-6", "COLECTOMY - PARTIAL LEVEL-6", "G.SURG. SURGERY LEVEL-6",
    "THYROID SURGERY WITH NECK DISSECTION LEVEL-6", "LAPAROSCOPIC FUNDOPLICATION LEVEL-6",
    "LAPAROSCOPIC SPLENECTOMY LEVEL-6", "HEPATIC SURGERY - LIVER BIOPSY/CYST LEVEL-6",
    "PANCREATIC SURGERY - DISTAL PANCREATECTOMY LEVEL-6", "BOWEL RESECTION - LARGE BOWEL LEVEL-6",
    "LAPAROSCOPIC COLORECTAL SURGERY LEVEL-6", "GASTRECTOMY - PARTIAL LEVEL-7", "G.SURG. SURGERY LEVEL-7",
    "HEPATIC SURGERY - HEPATECTOMY (SEGMENTAL) LEVEL-7", "RECTAL SURGERY - APR LEVEL-7",
    "PANCREATIC SURGERY - NECROSECTOMY LEVEL-7", "ESOPHAGEAL SURGERY - ESOPHAGECTOMY LEVEL-7",
    "LAPAROSCOPIC GASTRECTOMY LEVEL-7", "COLECTOMY - TOTAL LEVEL-7", "BILIARY SURGERY - CBD EXPLORATION LEVEL-7",
    "LAPAROSCOPIC LIVER SURGERY LEVEL-8", "GASTRECTOMY - TOTAL LEVEL-8", "G.SURG. SURGERY LEVEL-8",
    "PANCREATIC SURGERY - PANCREATICODUODENECTOMY (WHIPPLE) LEVEL-8", "HEPATIC SURGERY - MAJOR HEPATECTOMY LEVEL-8",
    "RECTAL SURGERY - LOW ANTERIOR RESECTION LEVEL-8", "ESOPHAGEAL SURGERY - TRANSHIATAL ESOPHAGECTOMY LEVEL-8",
    "COMPLEX BILIARY RECONSTRUCTION LEVEL-8", "LAPAROSCOPIC WHIPPLE LEVEL-9", "G.SURG. SURGERY LEVEL-9",
    "HEPATIC SURGERY - LIVER TRANSPLANT LEVEL-9", "MULTIVISCERAL RESECTION LEVEL-9",
    "COMPLEX ONCOLOGICAL SURGERY LEVEL-9", "TOTAL PROCTOCOLECTOMY WITH TERMINAL ILEOSTOMY LEVEL-9",
    "TRACHEAL RESECTION LEVEL-9", "VATS ESOPHAGECTOMY LEVEL-9", "WHIPPLE'S PANCREATICO-DUODENECTOMY LEVEL-9",
    "EXPL.LAP.FOR MULTIPLE STAB INJURIES OF ABD.& CHEST WITH 4 DIFFERENT ORGAN DAMAGE & ICD -LEV 9A",
    "COMPLICATED HIGH RISK ERCP", "Ligasure"
  ];

  const icuCasualtyServices = [
    "BMW Charges", "CASUALTY CONSULTATION (Day)", "CASUALTY CONSULTATION (Night)", "CLW SUTURING",
    "Defibrillator Pacing Pad", "IM Injection Given Charges", "Intermediate Procedure Charges",
    "IV Injection given charges", "IV Line Insersion", "LOCAL DEPOMEDROL INJECTION",
    "Major Procedure Charges", "Minor Dressing (Single)", "Minor Ot Charges Per Hr", "Minor OT -Half hr'ly",
    "Minor Procedure Charges", "Minor suturing (2 to 8 stiches)", "Minor suturing (upto 2 to 4 stitches)",
    "NASAL PACKING", "Nebulization Per Sitting", "Otoscopy", "Oxygen Charge Per Hr", "Oxygen Charges Per Day",
    "Oxygen mask", "Oxygen Per 15 Mts.", "PORTABLE VENTILATER TUBE", "Removal of Ryle's tube",
    "Ryles tube insertion", "SECONDARY SUTURING -OPD", "Short Services in Emergency",
    "Simple / Proctolysis Enema", "Skin Biopsy-procedure charges", "SMALL ASPIRATION ABCESS",
    "Steam Inhalation Per Sitting", "Suppository Insertion", "Suture Material Charges",
    "Therpetic Acitic Tapping", "Bronchoscopy (ICU)", "Calf Garment", "Dc Shock", "Dialysis Line Insertion",
    "Double/ Trible Lumen Cath Insersion", "Endotracheal Intubation", "Et Tube Holder", "Iabp Insersion (icu)",
    "Iabp Machine Charges Per Day", "Insertion Swan Ganz Catheter", "Intercoastal Drinage", "Lumbar Puncture",
    "Percutaneous Tracheostemy Consumables", "Percutaneous Trachestomy Procedure", "Pericardial Tapping",
    "Peritonial catheter insertion", "PICC Line Insertion", "PLEURAL TAPPING", "PLEURODESIS",
    "TEMPORARY PACING", "TRACHEOSTOMY(ICU)", "Ventilator - standby", "VENTRIC TAPPING"
  ];

  try {
    // Add new departments
    for (const deptData of newDepartments) {
      const existing = await db.select().from(hospitalServiceDepartments).where(eq(hospitalServiceDepartments.slug, deptData.slug));
      if (existing.length === 0) {
        const [dept] = await db.insert(hospitalServiceDepartments).values(deptData).returning();
        console.log(`Created department: ${dept.name}`);
        
        let servicesToAdd: string[] = [];
        if (deptData.slug === "day-care-minor-procedure") servicesToAdd = dayCareServices;
        else if (deptData.slug === "ent") servicesToAdd = entServices;
        else if (deptData.slug === "general-surgery") servicesToAdd = generalSurgeryServices;
        else if (deptData.slug === "icu-casualty") servicesToAdd = icuCasualtyServices;
        
        if (servicesToAdd.length > 0) {
          const servicesToInsert = servicesToAdd.map(name => ({ departmentId: dept.id, name }));
          await db.insert(hospitalServices).values(servicesToInsert);
          console.log(`Added ${servicesToAdd.length} services to ${dept.name}`);
        }
      } else {
        console.log(`Department ${deptData.name} already exists, skipping...`);
      }
    }

    // Add additional vascular surgery services
    const vascularDept = await db.select().from(hospitalServiceDepartments).where(eq(hospitalServiceDepartments.slug, "vascular-surgery"));
    if (vascularDept.length > 0) {
      const existingServices = await db.select().from(hospitalServices).where(eq(hospitalServices.departmentId, vascularDept[0].id));
      const existingNames = new Set(existingServices.map(s => s.name.toLowerCase()));
      
      const newVascularServices = additionalVascularServices.filter(name => !existingNames.has(name.toLowerCase()));
      if (newVascularServices.length > 0) {
        const servicesToInsert = newVascularServices.map(name => ({ departmentId: vascularDept[0].id, name }));
        await db.insert(hospitalServices).values(servicesToInsert);
        console.log(`Added ${newVascularServices.length} new services to Vascular Surgery`);
      } else {
        console.log("No new vascular surgery services to add");
      }
    }

    console.log("Additional services seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding additional services:", error);
    throw error;
  }
}

seedAdditionalServices()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
