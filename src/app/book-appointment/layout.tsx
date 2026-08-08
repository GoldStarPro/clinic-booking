import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { DashboardShell } from '@/components/DashboardShell'

export default function BookAppointmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeSwitcher />
      <DashboardShell role="PATIENT" title="Book visit">
        {children}
      </DashboardShell>
    </>
  )
}
