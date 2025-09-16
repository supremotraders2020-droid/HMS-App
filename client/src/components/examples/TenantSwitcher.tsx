import TenantSwitcher from '../TenantSwitcher'

export default function TenantSwitcherExample() {
  const mockCurrentHospital = {
    id: "1",
    name: "City General Hospital",
    location: "Downtown",
    status: "ACTIVE" as const,
    patientCount: 1234
  };

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-medium">Hospital Context Switcher</h3>
      <TenantSwitcher 
        currentHospital={mockCurrentHospital}
        onHospitalChange={(hospital) => console.log('Hospital changed to:', hospital)}
      />
      <p className="text-sm text-muted-foreground">
        This component manages multi-tenant context switching
      </p>
    </div>
  )
}