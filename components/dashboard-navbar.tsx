import { ThemeToggle } from "@/components/theme-toggle"

interface DashboardNavbarProps {
  companyName: string
}

export function DashboardNavbar({ companyName }: DashboardNavbarProps) {
  return (
    <nav className="border-b bg-background">
      <div className="flex h-16 items-center px-6 justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{companyName}</h1>
        </div>
        <ThemeToggle />
      </div>
    </nav>
  )
}
