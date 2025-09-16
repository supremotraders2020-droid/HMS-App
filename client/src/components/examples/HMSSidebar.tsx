import HMSSidebar from '../HMSSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

export default function HMSSidebarExample() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem"
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <HMSSidebar 
          currentRole="DOCTOR"
          currentUser={{
            name: "Dr. Sarah Wilson",
            hospitalName: "City General Hospital"
          }}
          onNavigate={(path) => console.log('Navigate to:', path)}
          onLogout={() => console.log('Logout clicked')}
        />
        <div className="flex-1 p-4">
          <p className="text-muted-foreground">Main content area</p>
        </div>
      </div>
    </SidebarProvider>
  )
}