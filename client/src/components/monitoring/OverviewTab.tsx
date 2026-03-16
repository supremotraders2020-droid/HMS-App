import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, FileCheck, Activity, Stethoscope, FileText,
  ClipboardList, Syringe, Pill, ClipboardCheck, Droplets,
  Wind, Hospital, Beaker, Heart
} from "lucide-react";

export type Session = {
  id: string;
  patientId: string;
  patientName: string;
  uhid: string;
  age: number;
  sex: string;
  ward: string;
  bedNumber: string;
  sessionDate: string;
  primaryDiagnosis: string;
  admittingConsultant: string;
  isVentilated: boolean;
  isLocked: boolean;
  createdAt: string;
};

export function OverviewTab({ session }: { session: Session }) {
  const { data: vitals = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/vitals/${session.id}`],
    enabled: !!session.id
  });

  const { data: injections = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/inotropes/${session.id}`],
    enabled: !!session.id
  });

  const { data: intakeData = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/intake/${session.id}`],
    enabled: !!session.id
  });

  const { data: outputData = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/output/${session.id}`],
    enabled: !!session.id
  });

  const { data: diabeticData = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/diabetic/${session.id}`],
    enabled: !!session.id
  });

  const { data: oxygenData = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/oxygen/${session.id}`],
    enabled: !!session.id
  });

  const { data: marData = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/mar/${session.id}`],
    enabled: !!session.id
  });

  const { data: shiftNotes = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/shift-notes/${session.id}`],
    enabled: !!session.id
  });

  const { data: dutyStaff = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/duty-staff/${session.id}`],
    enabled: !!session.id
  });

  const { data: allergies } = useQuery<any>({
    queryKey: [`/api/patient-monitoring/allergies/${session.id}`],
    enabled: !!session.id
  });

  const { data: investigation = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/sessions/${session.id}/investigation-chart`],
    enabled: !!session.id
  });

  const { data: carePlanData = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/care-plan/${session.id}`],
    enabled: !!session.id
  });
  const carePlan = carePlanData?.[0];

  const { data: tests = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/sessions/${session.id}/tests`],
    enabled: !!session.id
  });

  const { data: initialAssessmentData = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/initial-assessment/${session.id}`],
    enabled: !!session.id
  });
  const initialAssessment = initialAssessmentData?.[0];

  const { data: indoorConsultations = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/indoor-consultation/${session.id}`],
    enabled: !!session.id
  });

  const { data: doctorsVisits = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/doctors-visit/${session.id}`],
    enabled: !!session.id
  });

  const { data: surgeryNotes = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/surgery-notes/${session.id}`],
    enabled: !!session.id
  });

  const { data: nursingProgress = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/nursing-progress/${session.id}`],
    enabled: !!session.id
  });

  const { data: nursingAssessmentData = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/nursing-assessment/${session.id}`],
    enabled: !!session.id
  });
  const nursingAssessment = nursingAssessmentData?.[0];

  const formatTime = (d: string | null | undefined) => {
    if (!d) return '-';
    try { return format(new Date(d), 'HH:mm'); } catch { return '-'; }
  };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '-';
    try { return format(new Date(d), 'dd/MM/yyyy'); } catch { return '-'; }
  };

  const SectionHeader = ({ icon: Icon, title, count, color }: { icon: any; title: string; count: number; color: string }) => (
    <div className={`flex items-center gap-2 p-2 rounded-t-lg bg-${color}-500/10`}>
      <Icon className={`h-4 w-4 text-${color}-600 dark:text-${color}-400`} />
      <span className={`font-semibold text-sm text-${color}-600 dark:text-${color}-400`}>{title}</span>
      <Badge variant={count > 0 ? "default" : "secondary"} className="ml-auto text-[10px]">
        {count} {count === 1 ? 'record' : 'records'}
      </Badge>
    </div>
  );

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionHeader icon={AlertTriangle} title="Allergies & Precautions" count={allergies ? 1 : 0} color="red" />
          <CardContent className="p-2">
            {allergies ? (
              <div className="text-xs space-y-1">
                <div className="flex gap-2"><span className="font-medium w-24">Drug Allergies:</span><span>{allergies.drugAllergies || allergies.allergen || '-'}</span></div>
                <div className="flex gap-2"><span className="font-medium w-24">Food Allergies:</span><span>{allergies.foodAllergies || '-'}</span></div>
                <div className="flex gap-2"><span className="font-medium w-24">Precautions:</span><span>{allergies.specialPrecautions || allergies.reaction || '-'}</span></div>
              </div>
            ) : <p className="text-xs text-muted-foreground text-center py-2">No allergies recorded</p>}
          </CardContent>
        </Card>

        <Card>
          <SectionHeader icon={FileCheck} title="Care Plan" count={carePlan ? 1 : 0} color="emerald" />
          <CardContent className="p-2">
            {carePlan ? (
              <div className="text-xs space-y-1">
                <div><span className="font-medium">Diagnosis:</span> {carePlan.provisionalDiagnosis || '-'}</div>
                <div><span className="font-medium">Treatment:</span> {carePlan.treatmentAdvised || '-'}</div>
                <div><span className="font-medium">Investigations:</span> {carePlan.investigationsAdvised || '-'}</div>
                <div><span className="font-medium">Consultant:</span> {carePlan.treatingConsultantName || '-'}</div>
              </div>
            ) : <p className="text-xs text-muted-foreground text-center py-2">No care plan recorded</p>}
          </CardContent>
        </Card>

        <Card>
          <SectionHeader icon={Activity} title="Diabetic Monitoring" count={diabeticData.length} color="amber" />
          <CardContent className="p-2">
            {diabeticData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b"><th className="p-1 text-left">Time</th><th className="p-1">BSL</th><th className="p-1">Insulin</th><th className="p-1">Dose</th></tr></thead>
                  <tbody>
                    {diabeticData.slice(0, 5).map((r: any, i: number) => (
                      <tr key={i} className="border-b border-muted/30">
                        <td className="p-1 font-medium">{r.checkTime || formatTime(r.createdAt)}</td>
                        <td className="p-1 text-center">{r.bloodSugarLevel || '-'} mg/dL</td>
                        <td className="p-1 text-center">{r.insulinType || '-'}</td>
                        <td className="p-1 text-center">{r.insulinDose || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {diabeticData.length > 5 && <p className="text-[10px] text-muted-foreground mt-1 text-center">+{diabeticData.length - 5} more</p>}
              </div>
            ) : <p className="text-xs text-muted-foreground text-center py-2">No diabetic data recorded</p>}
          </CardContent>
        </Card>

        <Card>
          <SectionHeader icon={Stethoscope} title="Doctor's Visit Sheet" count={doctorsVisits.length} color="pink" />
          <CardContent className="p-2">
            {doctorsVisits.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b"><th className="p-1 text-left">Date</th><th className="p-1">Doctor</th><th className="p-1">Type</th></tr></thead>
                  <tbody>
                    {doctorsVisits.slice(0, 4).map((r: any, i: number) => (
                      <tr key={i} className="border-b border-muted/30">
                        <td className="p-1 font-medium">{formatDate(r.visitDate)}</td>
                        <td className="p-1 truncate max-w-[100px]">{r.nameOfDoctor || '-'}</td>
                        <td className="p-1 text-center">{r.visitType || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-xs text-muted-foreground text-center py-2">No visits recorded</p>}
          </CardContent>
        </Card>

        <Card>
          <SectionHeader icon={FileText} title="Indoor Continuation Sheet" count={indoorConsultations.length} color="slate" />
          <CardContent className="p-2">
            {indoorConsultations.length > 0 ? (
              <div className="space-y-1">
                {indoorConsultations.slice(0, 3).map((r: any, i: number) => (
                  <div key={i} className="text-xs border-b border-muted/30 pb-1">
                    <div className="flex justify-between"><span className="font-medium">{formatDate(r.entryDate)}</span><span className="text-muted-foreground">{r.inChargeDoctor}</span></div>
                    <p className="text-muted-foreground truncate">{r.clinicalFindings || '-'}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-muted-foreground text-center py-2">No records</p>}
          </CardContent>
        </Card>

        <Card>
          <SectionHeader icon={ClipboardList} title="Initial Assessment" count={initialAssessment ? 1 : 0} color="sky" />
          <CardContent className="p-2">
            {initialAssessment ? (
              <div className="text-xs space-y-1">
                <div><span className="font-medium">Received:</span> {formatDate(initialAssessment.patientReceivedDate)} {initialAssessment.patientReceivedTime || ''}</div>
                <div><span className="font-medium">Complaints:</span> {initialAssessment.complaintsHistory || '-'}</div>
                <div className="flex gap-4">
                  <span><span className="font-medium">Pulse:</span> {initialAssessment.pulseRate || '-'}</span>
                  <span><span className="font-medium">BP:</span> {initialAssessment.bloodPressure || '-'}</span>
                </div>
                <div><span className="font-medium">Diagnosis:</span> {initialAssessment.provisionalDiagnosis || '-'}</div>
              </div>
            ) : <p className="text-xs text-muted-foreground text-center py-2">No initial assessment</p>}
          </CardContent>
        </Card>

        <Card>
          <SectionHeader icon={Syringe} title="Injections" count={injections.length} color="purple" />
          <CardContent className="p-2">
            {injections.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b"><th className="p-1 text-left">Drug</th><th className="p-1">Dose</th><th className="p-1">Route</th><th className="p-1">Date</th></tr></thead>
                  <tbody>
                    {injections.slice(0, 5).map((r: any, i: number) => (
                      <tr key={i} className="border-b border-muted/30">
                        <td className="p-1 font-medium truncate max-w-[120px]">{r.drugName || '-'}</td>
                        <td className="p-1 text-center">{r.dose || '-'}</td>
                        <td className="p-1 text-center">{r.route || '-'}</td>
                        <td className="p-1 text-center">{formatDate(r.startTime || r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {injections.length > 5 && <p className="text-[10px] text-muted-foreground mt-1 text-center">+{injections.length - 5} more</p>}
              </div>
            ) : <p className="text-xs text-muted-foreground text-center py-2">No injections recorded</p>}
          </CardContent>
        </Card>

        <Card>
          <SectionHeader icon={Droplets} title="Intake" count={intakeData.length} color="green" />
          <CardContent className="p-2">
            {intakeData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b"><th className="p-1 text-left">Time</th><th className="p-1">Type</th><th className="p-1">Volume</th><th className="p-1">Route</th></tr></thead>
                  <tbody>
                    {intakeData.slice(0, 5).map((r: any, i: number) => (
                      <tr key={i} className="border-b border-muted/30">
                        <td className="p-1 font-medium">{r.hourSlot || r.timeSlot || formatTime(r.createdAt)}</td>
                        <td className="p-1 text-center">{r.intakeType || r.fluidType || '-'}</td>
                        <td className="p-1 text-center">{r.volume || r.oralFluids || '-'} ml</td>
                        <td className="p-1 text-center">{r.route || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {intakeData.length > 5 && <p className="text-[10px] text-muted-foreground mt-1 text-center">+{intakeData.length - 5} more</p>}
              </div>
            ) : <p className="text-xs text-muted-foreground text-center py-2">No intake recorded</p>}
          </CardContent>
        </Card>

        <Card>
          <SectionHeader icon={ClipboardList} title="Investigation Chart" count={investigation.length} color="cyan" />
          <CardContent className="p-2">
            {investigation.length > 0 ? (
              <div className="text-xs space-y-1">
                {investigation.slice(0, 1).map((inv: any, i: number) => (
                  <div key={i} className="grid grid-cols-2 gap-1">
                    <div><span className="font-medium">Blood Group:</span> {inv.bloodGroup || '-'}</div>
                    <div><span className="font-medium">HIV:</span> {inv.hiv || '-'}</div>
                    <div><span className="font-medium">HbsAg:</span> {inv.hbsag || '-'}</div>
                    <div><span className="font-medium">Hb:</span> {inv.hb || '-'}</div>
                    <div><span className="font-medium">WBC:</span> {inv.wbc || '-'}</div>
                    <div><span className="font-medium">Platelets:</span> {inv.platelets || '-'}</div>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-muted-foreground text-center py-2">No investigations</p>}
          </CardContent>
        </Card>

        <Card>
          <SectionHeader icon={Pill} title="Medicines (MAR)" count={marData.length} color="teal" />
          <CardContent className="p-2">
            {marData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b"><th className="p-1 text-left">Medicine</th><th className="p-1">Dose</th><th className="p-1">Freq</th><th className="p-1">Route</th></tr></thead>
                  <tbody>
                    {marData.slice(0, 5).map((r: any, i: number) => (
                      <tr key={i} className="border-b border-muted/30">
                        <td className="p-1 font-medium truncate max-w-[120px]">{r.drugName || r.medicineName || '-'}</td>
                        <td className="p-1 text-center">{r.dose || '-'}</td>
                        <td className="p-1 text-center">{r.frequency || '-'}</td>
                        <td className="p-1 text-center">{r.route || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {marData.length > 5 && <p className="text-[10px] text-muted-foreground mt-1 text-center">+{marData.length - 5} more</p>}
              </div>
            ) : <p className="text-xs text-muted-foreground text-center py-2">No medicines recorded</p>}
          </CardContent>
        </Card>

        <Card>
          <SectionHeader icon={ClipboardCheck} title="Nursing Assessment & Care Plan" count={nursingAssessment ? 1 : 0} color="stone" />
          <CardContent className="p-2">
            {nursingAssessment ? (
              <div className="text-xs space-y-1">
                <div><span className="font-medium">Diagnosis:</span> {nursingAssessment.provisionalDiagnosis || '-'}</div>
                <div>
                  <span className="font-medium">Patient History:</span>{' '}
                  {(() => {
                    const ph = nursingAssessment.patientHistory;
                    if (!ph) return '-';
                    try {
                      const obj = typeof ph === 'string' ? JSON.parse(ph) : ph;
                      if (typeof obj === 'object' && obj !== null) {
                        const positives = Object.entries(obj).filter(([, v]) => v && v !== 'No' && v !== 'false' && v !== false);
                        return positives.length > 0
                          ? positives.map(([k, v]) => `${k}: ${v}`).join(', ')
                          : 'No significant history';
                      }
                    } catch { /* not JSON */ }
                    return ph;
                  })()}
                </div>
                <div><span className="font-medium">Fall Risk Score:</span> {nursingAssessment.morseFallRiskScore || '-'}</div>
                {nursingAssessment.chiefComplaints && <div><span className="font-medium">Complaints:</span> {nursingAssessment.chiefComplaints}</div>}
              </div>
            ) : <p className="text-xs text-muted-foreground text-center py-2">No assessment recorded</p>}
          </CardContent>
        </Card>

        <Card>
          <SectionHeader icon={FileText} title="Nursing Progress Sheet" count={nursingProgress.length} color="yellow" />
          <CardContent className="p-2">
            {nursingProgress.length > 0 ? (
              <div className="space-y-1">
                {nursingProgress.slice(0, 3).map((r: any, i: number) => (
                  <div key={i} className="text-xs border-b border-muted/30 pb-1">
                    <div className="flex justify-between"><span className="font-medium">{formatDate(r.entryDateTime)}</span><span className="text-muted-foreground">{r.signatureName}</span></div>
                    <p className="text-muted-foreground truncate">{r.progressNotes || '-'}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-muted-foreground text-center py-2">No progress notes</p>}
          </CardContent>
        </Card>

        <Card>
          <SectionHeader icon={Droplets} title="Output" count={outputData.length} color="orange" />
          <CardContent className="p-2">
            {outputData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b"><th className="p-1 text-left">Time</th><th className="p-1">Urine</th><th className="p-1">Other</th><th className="p-1">Total</th></tr></thead>
                  <tbody>
                    {outputData.slice(0, 5).map((r: any, i: number) => (
                      <tr key={i} className="border-b border-muted/30">
                        <td className="p-1 font-medium">{r.hourSlot || r.timeSlot || formatTime(r.createdAt)}</td>
                        <td className="p-1 text-center">{r.urineHourly || r.volume || '-'}</td>
                        <td className="p-1 text-center">{r.otherLosses || '-'}</td>
                        <td className="p-1 text-center">{r.totalOutput || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {outputData.length > 5 && <p className="text-[10px] text-muted-foreground mt-1 text-center">+{outputData.length - 5} more</p>}
              </div>
            ) : <p className="text-xs text-muted-foreground text-center py-2">No output recorded</p>}
          </CardContent>
        </Card>

        <Card>
          <SectionHeader icon={Wind} title="Oxygen Monitoring" count={oxygenData.length} color="sky" />
          <CardContent className="p-2">
            {oxygenData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b"><th className="p-1 text-left">Time Slot</th><th className="p-1">Oxygen</th><th className="p-1">SpO2</th></tr></thead>
                  <tbody>
                    {oxygenData.slice(0, 5).map((r: any, i: number) => (
                      <tr key={i} className="border-b border-muted/30">
                        <td className="p-1 font-medium">{r.hour_slot || '-'}</td>
                        <td className="p-1 text-center font-semibold">{r.oxygen_liter || '-'}</td>
                        <td className="p-1 text-center">{r.spo2 ? `${r.spo2}%` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {oxygenData.length > 5 && <p className="text-[10px] text-muted-foreground mt-1 text-center">+{oxygenData.length - 5} more</p>}
              </div>
            ) : <p className="text-xs text-muted-foreground text-center py-2">No oxygen records</p>}
          </CardContent>
        </Card>

        <Card>
          <SectionHeader icon={Hospital} title="Surgery Notes" count={surgeryNotes.length} color="fuchsia" />
          <CardContent className="p-2">
            {surgeryNotes.length > 0 ? (
              <div className="text-xs space-y-1">
                {surgeryNotes.slice(0, 1).map((sn: any, i: number) => (
                  <div key={i}>
                    <div><span className="font-medium">Date:</span> {formatDate(sn.surgeryDate)}</div>
                    <div><span className="font-medium">Pre-op Dx:</span> {sn.preoperativeDiagnosis || '-'}</div>
                    <div><span className="font-medium">Surgery:</span> {sn.surgeryPerformed || sn.surgeryPlanned || '-'}</div>
                    <div><span className="font-medium">Surgeon:</span> {sn.surgeonName || sn.nameOfSurgeon || '-'}</div>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-muted-foreground text-center py-2">No surgery notes</p>}
          </CardContent>
        </Card>

        <Card>
          <SectionHeader icon={Beaker} title="Tests / Diagnostics" count={tests.length} color="violet" />
          <CardContent className="p-2">
            {tests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b"><th className="p-1 text-left">Test</th><th className="p-1">Status</th><th className="p-1">Priority</th></tr></thead>
                  <tbody>
                    {tests.slice(0, 4).map((r: any, i: number) => (
                      <tr key={i} className="border-b border-muted/30">
                        <td className="p-1 font-medium truncate max-w-[140px]">{r.testName || '-'}</td>
                        <td className="p-1 text-center"><Badge variant="outline" className="text-[9px]">{r.status || '-'}</Badge></td>
                        <td className="p-1 text-center">{r.priority || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-xs text-muted-foreground text-center py-2">No tests ordered</p>}
          </CardContent>
        </Card>

        <Card>
          <SectionHeader icon={Heart} title="Vitals" count={vitals.length} color="rose" />
          <CardContent className="p-2">
            {vitals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b"><th className="p-1 text-left">Time</th><th className="p-1">HR</th><th className="p-1">BP</th><th className="p-1">Temp</th><th className="p-1">SpO2</th><th className="p-1">Secretion</th><th className="p-1">Suction</th><th className="p-1">Urine Tube</th><th className="p-1">By</th></tr></thead>
                  <tbody>
                    {vitals.slice(0, 5).map((v: any, i: number) => (
                      <tr key={i} className="border-b border-muted/30">
                        <td className="p-1 font-medium">{v.hourSlot || formatTime(v.createdAt)}</td>
                        <td className="p-1 text-center">{v.heartRate || '-'}</td>
                        <td className="p-1 text-center">{v.systolicBp}/{v.diastolicBp}</td>
                        <td className="p-1 text-center">{v.temperature ? `${v.temperature}°C` : '-'}</td>
                        <td className="p-1 text-center">{v.spo2 ? `${v.spo2}%` : '-'}</td>
                        <td className="p-1 text-center">{v.secretion || '-'}</td>
                        <td className="p-1 text-center">{v.suction || '-'}</td>
                        <td className="p-1 text-center">{v.urineTube || '-'}</td>
                        <td className="p-1 text-center">{v.nurseName || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {vitals.length > 5 && <p className="text-[10px] text-muted-foreground mt-1 text-center">+{vitals.length - 5} more records</p>}
              </div>
            ) : <p className="text-xs text-muted-foreground text-center py-2">No vitals recorded</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
