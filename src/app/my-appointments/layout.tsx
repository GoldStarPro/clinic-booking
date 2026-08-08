import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { DashboardShell } from '@/components/DashboardShell'

export default function MyAppointmentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeSwitcher />
      <DashboardShell role="PATIENT" title="My appointments">
        {children}
      </DashboardShell>
    </>
  )
}
