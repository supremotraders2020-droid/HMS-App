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

const departments: ServiceDepartment[] = [
  {
    id: "general-guidelines",
    name: "General Guidelines",
    icon: FileText,
    description: "Hospital general policies and patient care guidelines",
    services: []
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
    services: []
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
    services: []
  },
  {
    id: "cardiovascular-surgery",
    name: "Cardiovascular Surgery",
    icon: Heart,
    description: "Blood vessel and heart surgery",
    services: []
  },
  {
    id: "cathlab",
    name: "Cathlab",
    icon: Activity,
    description: "Cardiac catheterization and interventional procedures",
    services: []
  },
  {
    id: "vascular-surgery",
    name: "Vascular Surgery",
    icon: Activity,
    description: "Blood vessel surgical procedures",
    services: []
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
