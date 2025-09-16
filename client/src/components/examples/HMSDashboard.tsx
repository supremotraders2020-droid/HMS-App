import HMSDashboard from '../HMSDashboard'

export default function HMSDashboardExample() {
  return (
    <div className="p-6">
      <HMSDashboard 
        currentRole="DOCTOR"
        userName="Dr. Sarah Wilson"
        hospitalName="City General Hospital"
      />
    </div>
  )
}