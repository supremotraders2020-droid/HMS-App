import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Search, 
  Heart, 
  Baby, 
  Bone, 
  Brain, 
  Stethoscope, 
  Activity,
  Scissors,
  Radiation,
  Pill,
  TestTube,
  X,
  Building2,
  FileText
} from "lucide-react";

interface ServiceDepartment {
  id: string;
  name: string;
  icon: any;
  description: string;
  services: string[];
}

const bloodBankServices = [
  "ABO Grouping + RH Typing (Blood Group)",
  "Antibody Screening",
  "Antibody Titre At Room Temperature",
  "Antibody Titre For Anti A",
  "Antibody Titre For Anti B",
  "Antibody Titre For RH Factor",
  "Cold Antibody Titre",
  "Cross-Match",
  "Cryo precipitate (JKRP)",
  "CRYO Precipitate Without Replacement",
  "Cryopoor Plasma with Replacement",
  "Cryopoor Plasma without Replacement",
  "Direct Coomb's Test (DAT)",
  "Empty CPDA Bag",
  "FFP - No Replace",
  "FFP - No Replace (OS - PC)",
  "FFP - Replace",
  "HBs Ag. Donor (BB)",
  "Immune Anti A, Anti B Titre",
  "Indirect Coomb's Test",
  "Leukodepletion for packed cells",
  "Leukodepletion for platlet",
  "NAT tested FFP",
  "NAT tested FFP (with replace)",
  "NAT tested PRBC",
  "NAT tested PRBC (with replace)",
  "Packed Cells - No Replace",
  "Packed Cells - No Replace (OS-PC)",
  "Packed Cells - Replace",
  "Phlebotomy",
  "Phlebotomy (500ml)",
  "Pkg. For HBs Antigen HIV & HCV",
  "Platelet Concentrate - No Replace",
  "Platelet Concentrate - Replace",
  "Platelet concentrate (JKRP)",
  "Platelet Reservation",
  "Platelets (blood bank)",
  "Platelets To Other Hospital",
  "R.B.C. Filter",
  "Retesting Charge For Outside Blood Bank",
  "Single Donor Platelet Procedure",
  "Single Donor Platelet Testing Charges",
  "Single Donor Platlet kit charges",
  "Single Donor Platelet Procedure (InHouse)",
  "Transfer bag",
  "W.B.C. Filter",
  "Warm Antibody Titre",
  "Whole Blood - No Replace",
  "Whole Blood - Replace",
  "FFP for Outside",
  "FFP Tranfusion Charges",
  "Platelet Concentrate - No Replace(OS)",
  "Platelet/FFP Reservation (OS)",
  "Whole Blood - No Replace(OS)",
  "Whole Blood for Outside",
  "Whole Blood Tranfusion Charges"
];

const cardiothorasicSurgeryServices = [
  "AORTIC (GRADE 3)",
  "ASD Closure",
  "AVR",
  "AVSD",
  "BENTALL'S PROCEDURE (GRADE 3)",
  "CABG & PERICARDIECTOMY & PI VSD (GRADE III)",
  "CABG PLUS CAROTID (GRADE I)",
  "CABG PLUS DVR (GRADE III)",
  "CABG PLUS PLICATION (GRADE I)",
  "CABG PLUS SVR PLUS VALVE (GRADE-III)",
  "CABG PLUS VALVE PLUS MAZE (GRADE III)",
  "CABG PLUS VALVE REPAIR/REPLACEMENT (GRADE III)",
  "CABG PROCEDURE COST",
  "CABG WITH LOW EF (LESS THAN 25 PERCENT) GRADE II",
  "CABG WITH LOW EF (LESS THAN 35 PERCENT) GRADE I",
  "Complex Open Heart Surgery LEVEL 5",
  "DVR (Double Valve Replacement)",
  "LIGATION OF DUCTUS ARTERIOSIS",
  "LV CLOT REMOVAL",
  "MVR",
  "MYXOMA",
  "NON PUMP (closed heart) PAEDIATRIC PROCEDURE",
  "NON PUMP (closed heart) PAEDIATRIC PACKAGE",
  "PI LV REPAIR (GRADE III)",
  "RE-EXPLORATION OF CABG / VALVE",
  "REDO CABG (GRADE I)",
  "REDO VALVE (GRADE II)",
  "RE-REDO CABG (GRADE II)",
  "RSOV REPAIR (Sinus of valsalva aneurysm) GRADE I",
  "SURGICAL PACEMAKER INSERTION (PAED) - PROCEDURE",
  "SURGICAL PACEMAKER INSERTION PACKAGE (PAED)",
  "VALVE PLUS MAZE (GRADE1)"
];

const cardiovascularSurgeryServices = [
  "Simple Impacted Molar - Surgical Removal Level-1",
  "Chemical Pleurodesis (under LA) Level 2",
  "Low risk TOF Level 2",
  "Common atrium LEVEL 3",
  "TOF repair standard LEVEL 3",
  "TAPVC normal Level 4",
  "VATs with Pleurodesis - Simple Level 4",
  "Complex TAPVC LEVEL 5",
  "ABDOMINAL AORTIC ANEURYSM REPAIR",
  "AMPUTATION OF TOE/FOREFOOT",
  "AORTO-BIFEMORAL BYPASS",
  "ARTERIAL-VENOUS REPAIR TRAUMA",
  "AV FISTULA ANEURYSM",
  "AV FISTULA WITH VENOUS TRANSPOSITION",
  "AV FISTULA/GRAFT",
  "AV MALFORMATION",
  "AXILLO-FEMORAL BYPASS",
  "BILATERAL VARICOSE VEINS",
  "CAROTID ENDARTERECTOMY",
  "Closed Heart Non Pump-BT Shunt",
  "EXCISION OF IVC SARCOMA & IVC REPAIR",
  "FEM-DISTAL BYPASS",
  "FEMORAL EMBOLECTOMY (BILATERAL)",
  "FEMORAL EMBOLECTOMY (UNILATERAL)",
  "FEMORO-FEMORAL BYPASS",
  "FEMORO-POPLITEAL BYPASS",
  "INSERTION OF PERMACATH/HICKMAN S CATHETER",
  "PERFORATOR LIGATION",
  "PERICARDIAL PROCEDURE",
  "PERIPHERAL ARTERIAL EMBOLECTOMY (BILATERAL)",
  "PERIPHERAL ARTERIAL EMBOLECTOMY (UNILATERAL)",
  "PERMANENT PACEMAKER - DUAL CHAMBER (O.T.)",
  "PERMANENT PACEMAKER - SINGLE CHAMBER (O.T.)",
  "PSEUDOANERYSM REPAIR",
  "RE-DO / HIGH RISK / COMPLEX AV FISTULA",
  "REDO BYPASS SURGERY",
  "RE-EXPLORATION OF WOUND & RESUTURING",
  "REPAIR OF PERIPHERAL ARTERY ANEURYSM RUPTURE",
  "SECONDARY SUTURING (CARDIAC)",
  "THYMECTOMY (STERNOTOMY)",
  "VARICOSE VEIN STRIPPING",
  "WOUND DEBRIDEMENT"
];

const cathlabServices = [
  "COIL CLOSURE OF PDA (WITH ANAESTHESIA) PROCEDURE",
  "COIL CLOSURE OF PDA (WITHOUT ANAESTHESIA) PROCEDURE",
  "COMPLEX RF ABLATION (EP WITH RF ABLATION)",
  "Contrast Charges",
  "Cordis 5F C1",
  "CORONARY ANGIOGRAPHY PACKAGE",
  "CORONARY ANGIOPLASTY PACKAGE WITHOUT BALLOON",
  "CORONARY ANGIOPLASTY PROCEDURE CHARGES",
  "DC CARDIOVERSION OF ATRIAL FIBRILLATION",
  "DEVICE CLOSURE OF ASD (WITH ANESTHESIA) ADULT PROCEDURE",
  "DEVICE CLOSURE OF ASD (WITH ANESTHESIA) PROCEDURE",
  "DEVICE CLOSURE OF ASD (WITHOUT ANAESTHESIA) ADULT PROCEDURE",
  "DEVICE CLOSURE OF ASD (WITHOUT ANAESTHESIA) PROCEDURE",
  "DEVICE CLOSURE OF PDA (WITH ANESTHESIA) ADULT PROCEDURE",
  "DEVICE CLOSURE OF PDA (WITHOUT ANESTESIA) ADULT PROCEDURE",
  "DEVICE CLOSURE OF PDA (WITHOUT ANESTESIA) PROCEDURE",
  "DEVICE CLOSURE OF VSD (ADULT) PROCEDURE",
  "Diagnostic Fistulogram",
  "DSA - CEREBRAL/SPINAL ANGIOGRAPHY",
  "Endovascular Flow Diversion treatment for Aneurysm",
  "EP STUDY (DIAGNOSTIC)",
  "FEMORAL ARTERY ACCESS",
  "Fistuloplasty / Venoplasty",
  "FLUOROSCOPY",
  "FOREIGN BODY REMOVAL (CATH LAB)",
  "FTR (Fallopian tube recanulization)",
  "GI ANGIOGRAPHY",
  "GI EMBOLIZATION",
  "HEPATIC VENOGRAM",
  "Hickman Catheter + HD Catheter insertion (USG Guided)",
  "IABP INSERTION (CATH LAB)",
  "Implantable Cardioverter Defibrillator Implantation",
  "INSERTION OF PERCATH/HICKMEN CATH UNDER FLUROSCOPY",
  "INTRA-CORONARY THROMBOLYSIS AND CLOT ASPIRATION",
  "INTRACRANIAL CHEMICAL ANGIOPLASTY",
  "IVC FILTER IMPLANTATION",
  "IVC FILTER-REMOVAL",
  "IVC/HEPATIC VENOPLASTY (ADULT)",
  "IVC/HEPATIC VENOPLASTY (PAED)",
  "MECHANICAL CLOT RETRIVAL - ACUTE STROKE INTERVENTION",
  "Neuro surgeon fees - carotid/intracranial/vertebral stenting",
  "Neurosurgeon Charges - Cerebral/spinal Angiography",
  "Neurosurgeon Fees - COIL/AVM Embolization (Minor)",
  "Neurosurgeon Fees - Coil/AVM Embolization (Major)",
  "PACEMAKER BATTERY EXPLANTATION WITH TPI",
  "PDA COIL CLOSURE",
  "PDA DEVICE CLOSURE",
  "PERCUTANEOUS BILIARY (PTBD) - BRUSH CYTOLOGY",
  "PERCUTANEOUS SCLEROTHERAPY",
  "PERICARDIAL TAPPING (CATH LAB)",
  "PERIPHERAL THROMBOLYSIS",
  "PERIPHERAL ANGIOGRAPHY (RENAL/ABDO/AORTIC)",
  "PERIPHERAL ANGIOPLASTY (RENAL/ABDO/AORTIC/CEREBRAL)",
  "PERIPHERAL ARTERY BALLOON OCCLUSION",
  "PERIPHERAL EMBOLIZATION",
  "PERMCATH REMOVAL UNDER FLUROSCOPY GUIDANCE",
  "PPI - PERMANENT PACEMAKER INSERTION (DOUBLE CHAMBER)",
  "PPI - PERMANENT PACEMAKER INSERTION (SINGLE CHAMBER)",
  "PTBD EXTERNAL - INTERNAL DRAINAGE",
  "PTBD STENTING",
  "PTBD/PCN",
  "PTC GRAM (PERCUTANEOUS CHOLANGEOGRAM)",
  "PULMONARY ANGIOGRAPHY",
  "RBSK(23) - ASD DEVICE CLOSURE",
  "RBSK(26) - VSD DEVICE CLOSURE WITH PDA DEVICE",
  "RBSK(27) - VSD DEVICE CLOSURE WITH VSD DEVICE",
  "RBSK(28) - VSD DEVICE CLOSURE IN INFANTS",
  "RBSK(30) - PDA DEVICE CLOSURE",
  "RBSK(34) - PDA STENTING",
  "RBSK(53) - COARCTATION DILATATION WITH STENT",
  "RBSK(55) - COARCTATION REPAIR OF AORTA",
  "RENAL ARTERY EMBOLIZATION",
  "RF ABLATION (EP WITH RF ABLATION)",
  "SECOND STAGE CORONARY ANGIOPLASTY",
  "SECOND STAGE PERIPHERAL ANGIOPLASTY",
  "SPINAL EMBOLIZATION",
  "SUBCLAVIAN/VERTEBRAL - ANGIOPLASTY",
  "SUCTION THROMBO-ASPIRATION/THROMBOLYSIS",
  "TEMPORARY PACEMAKER (Cath Lab)",
  "THORACIC AORTIC ANEURYSM ENDOVASCULAR STENT GRAFTING",
  "TIPS/TRANSJUGLAR INTRAHEPATIC PORTO-SYSTEMIC STENT",
  "TRANSJUGLAR LIVER BIOPSY",
  "TYSHAK II BALLOON CATH",
  "UTERINE ARTERY EMBOLISATION"
];

const vascularSurgeryOTServices = [
  "TRENDELENBERG OPERATION",
  "VARICOSE VEINS",
  "CMV",
  "EMBOLECTOMIES + FASCIOTOMIES",
  "LUMBAR TYMPANECTOMY",
  "ON TABLE ANGIOS",
  "PDA",
  "THROMBECTOMIES WITH PATCH CLOSURES",
  "TRENDELENBERG + PHLEBECTOMIES",
  "ARTERIAL VENOUS FISTULA FOR ACCESS",
  "FEMORAL DISTAL BYPASS",
  "FEMORAL POPLITEAL-BYPASS",
  "LUMBAR SYMPATHECTOMY/CERVICAL SYMPATHECTOMY",
  "UPPER LIMBS BYPASS (AXILLARY DOWNWARD)",
  "VASCULAR TRAUMA TO LIMBS",
  "BRACHEAL/FEMORAL EMBOLECTOMIES",
  "AORTIC ANEURYSM-1",
  "AORTIC BYPASS-1",
  "CAROTID ENDARTERECTOMY",
  "CAROTID ENDARTERECTOMY PATCH CLOSURE",
  "CERVICAL RIB EX",
  "FE POP BYPASS/FEM FEM OVER",
  "MAJOR VASCULAR TRAUMA",
  "SUBCLAVIAN BYPASS",
  "TRANSPOSED BASILIC VEIN FISTULA",
  "AORTIC DISSECTIONS",
  "AXILLO FEMORAL BYPASS",
  "COMPLEX VASCULAR SURGERIES",
  "FEM DISTAL BYPASS",
  "PERIPHERAL ANEURYSMS",
  "THORACO ABDOMINAL ANEURYSMS BYPASSES",
  "AORTIC ANEURYSM-2",
  "AORTIC BYPASS-2",
  "MAJOR AV MALFORMATIONS",
  "THORASIC AORTIC ANEURYSMS"
];

const vascularSurgeryCathlabServices = [
  "Fistuloplasty",
  "Single segment angioplasty/stent",
  "IVC Filter Implantation",
  "Peripheral Thrombolysis",
  "IVC Filter-Removal",
  "Percutaneous Sclerotherapy",
  "Bilateral iliac stents in stenosis arteries",
  "Femoropopliteal interventions - DCB, STENT, multiple segments",
  "Tibial interventions",
  "Aneurysms of extremities",
  "Acute DVT, Mechanical Thromboaspiration/thrombolysis",
  "Coeliac/SMA, Renal stenting",
  "Peripheral Angioplasty (Renal/Abdo/Aortic/Cerebral)",
  "Carotid Angioplasty",
  "Subclavian/Vertebral - Angioplasty",
  "IVC/Hepatic/central/iliac venoplasty (Adult)",
  "Renal Artery Embolization",
  "Aortobiiliac reconstruction",
  "Bilateral iliac stents in CTO",
  "Femoropopliteal atherectomy, mechanical thromboaspiration",
  "Hybrid procedures - open surgery and endovascular",
  "Multisegment angioplasty/stent in iliac/SFA/pop/tibial",
  "AAA Stenting/Aortic dissection",
  "Thoracic Aortic Aneurysm Endovascular Stent Grafting"
];

const departments: ServiceDepartment[] = [
  {
    id: "general-guidelines",
    name: "General Guidelines",
    icon: FileText,
    description: "Hospital general policies and patient care guidelines",
    services: [
      "Tariff is confidential for authorized personnel only",
      "Day calculated on checkout time 12:00AM",
      "Emergency charges: 15% extra on Sundays & Public Holidays",
      "Security deposit required for credit patients",
      "Visiting hours: 12:00 noon - 1:00 pm & 5:00 pm - 7:00 pm",
      "ICU visiting hours: 12:00 pm onwards"
    ]
  },
  {
    id: "bed-charges",
    name: "Bed Charges with Room Description & Visit Charges",
    icon: Building2,
    description: "Room categories, bed types, and associated charges",
    services: []
  },
  {
    id: "blood-bank",
    name: "Blood Bank",
    icon: Heart,
    description: "Blood transfusion and donation services",
    services: bloodBankServices
  },
  {
    id: "birthing-suites",
    name: "Birthing Suites",
    icon: Baby,
    description: "Maternal and childbirth care services",
    services: []
  },
  {
    id: "cardiothorasic-surgery",
    name: "Cardiothorasic Surgery",
    icon: Heart,
    description: "Heart and chest surgical procedures",
    services: cardiothorasicSurgeryServices
  },
  {
    id: "cardiovascular-surgery",
    name: "Cardiovascular Surgery",
    icon: Heart,
    description: "Blood vessel and heart surgery",
    services: cardiovascularSurgeryServices
  },
  {
    id: "cathlab",
    name: "Cathlab",
    icon: Activity,
    description: "Cardiac catheterization and interventional procedures",
    services: cathlabServices
  },
  {
    id: "vascular-surgery",
    name: "Vascular Surgery",
    icon: Activity,
    description: "Blood vessel surgical procedures (OT & Cathlab)",
    services: [...vascularSurgeryOTServices, ...vascularSurgeryCathlabServices]
  },
  {
    id: "day-care",
    name: "Day Care & Minor Procedure",
    icon: Stethoscope,
    description: "Outpatient procedures and day surgeries",
    services: []
  },
  {
    id: "ent",
    name: "ENT",
    icon: Stethoscope,
    description: "Ear, Nose, and Throat treatments",
    services: []
  },
  {
    id: "general-surgery",
    name: "General Surgery",
    icon: Scissors,
    description: "Common surgical procedures",
    services: []
  },
  {
    id: "icu-casualty",
    name: "ICU & Casualty",
    icon: Activity,
    description: "Intensive care and emergency services",
    services: []
  },
  {
    id: "maxillo-facial",
    name: "Maxillo Facial",
    icon: Stethoscope,
    description: "Oral and maxillofacial surgery",
    services: []
  },
  {
    id: "neuro-surgery",
    name: "Neuro Surgery",
    icon: Brain,
    description: "Brain and nervous system surgeries",
    services: []
  },
  {
    id: "obgy-gynaec",
    name: "OBGY Gynaec",
    icon: Baby,
    description: "Obstetrics and gynecology services",
    services: []
  },
  {
    id: "oncology",
    name: "Oncology, Onco Surgery, Radiation Oncology",
    icon: Radiation,
    description: "Cancer treatment and surgery",
    services: []
  },
  {
    id: "orthopedic-surgery",
    name: "Orthopedic Surgery",
    icon: Bone,
    description: "Bone and joint surgical procedures",
    services: []
  },
  {
    id: "paediatric-ortho-surgery",
    name: "Paediatric Ortho Surgery",
    icon: Bone,
    description: "Children's orthopedic procedures",
    services: []
  },
  {
    id: "paediatric-gen-surgery",
    name: "Paediatric Gen Surgery",
    icon: Scissors,
    description: "Children's general surgery",
    services: []
  },
  {
    id: "paediatric-cardiac-unit",
    name: "Paediatric Cardiac Unit",
    icon: Heart,
    description: "Children's heart care services",
    services: []
  },
  {
    id: "pain-management",
    name: "Pain Management",
    icon: Pill,
    description: "Chronic pain treatment and therapy",
    services: []
  },
  {
    id: "plastic-surgery",
    name: "Plastic Surgery",
    icon: Scissors,
    description: "Reconstructive and cosmetic surgery",
    services: []
  },
  {
    id: "uro-surgery",
    name: "Uro Surgery",
    icon: Stethoscope,
    description: "Urological surgical procedures",
    services: []
  },
  {
    id: "pathology",
    name: "Pathology",
    icon: TestTube,
    description: "Laboratory and diagnostic services",
    services: []
  },
  {
    id: "radiology",
    name: "Radiology",
    icon: X,
    description: "Imaging and diagnostic radiology",
    services: []
  },
  {
    id: "rehab-services",
    name: "Rehab Services",
    icon: Activity,
    description: "Rehabilitation and physiotherapy",
    services: []
  },
  {
    id: "gastroentrology",
    name: "Gastroentrology",
    icon: Stethoscope,
    description: "Digestive system treatments",
    services: []
  }
];

export default function HospitalServices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.services.some(service => service.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent" data-testid="text-page-title">
              Hospital Services & Surgeries
            </h1>
            <p className="text-muted-foreground mt-1">
              Browse all available surgeries and services by department
            </p>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search departments or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-services"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((dept) => {
            const IconComponent = dept.icon;
            return (
              <Card 
                key={dept.id} 
                className="hover-elevate transition-all duration-200 cursor-pointer group"
                data-testid={`card-department-${dept.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold leading-tight">
                        {dept.name}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1 line-clamp-2">
                        {dept.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {dept.services.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Available Services
                      </p>
                      <ScrollArea className="h-24">
                        <div className="flex flex-wrap gap-1">
                          {dept.services.map((service, idx) => (
                            <Badge 
                              key={idx} 
                              variant="secondary" 
                              className="text-xs"
                              data-testid={`badge-service-${dept.id}-${idx}`}
                            >
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-4 text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        Services to be added by Admin
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredDepartments.length === 0 && (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <Search className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No departments found matching your search</p>
            </div>
          </Card>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Department Summary</CardTitle>
            <CardDescription>
              {departments.length} departments available at Gravity Hospital
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" value={expandedDepartments} onValueChange={setExpandedDepartments}>
              {departments.map((dept) => {
                const IconComponent = dept.icon;
                return (
                  <AccordionItem key={dept.id} value={dept.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-4 w-4 text-primary" />
                        <span>{dept.name}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-7 space-y-2">
                        <p className="text-sm text-muted-foreground">{dept.description}</p>
                        {dept.services.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {dept.services.map((service, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            Services will be added by the administrator
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
