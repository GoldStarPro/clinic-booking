import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { DashboardShell } from '@/components/DashboardShell'

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeSwitcher />
      <DashboardShell role="DOCTOR">{children}</DashboardShell>
    </>
  )
}
