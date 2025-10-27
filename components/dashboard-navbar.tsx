interface DashboardNavbarProps {
  companyName: string
}

export function DashboardNavbar({ companyName }: DashboardNavbarProps) {
  return (
    <nav className="border-b border-gray-200/10 bg-background">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{companyName}</h1>
        </div>
      </div>
    </nav>
  )
}
