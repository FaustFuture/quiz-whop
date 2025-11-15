import Image from "next/image"
interface DashboardNavbarProps {
	companyName: string
	logoUrl?: string | null
}

export function DashboardNavbar({ companyName, logoUrl }: DashboardNavbarProps) {
	return (
		<nav className="sticky top-0 z-50 border-b border-border bg-background">
			<div className="flex h-14 sm:h-16 items-center justify-between px-2 sm:px-4 lg:px-6 gap-2">
				<div className="flex items-center gap-2 flex-1 min-w-0">
					{logoUrl ? (
						<img
							src={logoUrl}
							alt={`${companyName} logo`}
							className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg object-cover flex-shrink-0"
						/>
					) : (
						<Image
							src="/logo.svg"
							alt="Logo"
							width={32}
							height={32}
							className="themed-logo rounded-lg w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
							priority
						/>
					)}
					<h1 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground truncate">{companyName}</h1>
				</div>
			</div>
		</nav>
	)
}
