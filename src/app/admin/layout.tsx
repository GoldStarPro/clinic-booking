import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { DashboardShell } from '@/components/DashboardShell'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeSwitcher />
      <DashboardShell role="ADMIN">{children}</DashboardShell>
    </>
  )
}
