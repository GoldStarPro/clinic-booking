import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { DashboardShell } from '@/components/DashboardShell'

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeSwitcher />
      <DashboardShell role="PATIENT">{children}</DashboardShell>
    </>
  )
}
