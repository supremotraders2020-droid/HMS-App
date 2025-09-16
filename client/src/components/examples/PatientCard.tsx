import PatientCard from '../PatientCard'

export default function PatientCardExample() {
  const mockPatient = {
    id: "1",
    name: "John Martinez",
    age: 45,
    gender: "M" as const,
    phone: "(555) 123-4567",
    address: "123 Main St, City, State 12345",
    condition: "Hypertension, Type 2 Diabetes",
    status: "ADMITTED" as const,
    room: "A-205",
    admissionDate: "Dec 15, 2024",
    lastVisit: "Dec 14, 2024",
    urgency: "MEDIUM" as const
  };

  return (
    <div className="p-6 max-w-md">
      <PatientCard 
        patient={mockPatient}
        onViewDetails={(id) => console.log('View details for patient:', id)}
        onUpdateStatus={(id, status) => console.log('Update status:', id, status)}
      />
    </div>
  )
}