"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { ModulesSection } from "@/components/modules-section";
import { MemberModulesViewWithFilter } from "@/components/member-modules-view-with-filter";
import { ResultsSidebar } from "@/components/results-sidebar";
import { CompanyLogoUpload } from "@/components/company-logo-upload";
import { type Module } from "@/app/actions/modules";
import { type Company } from "@/app/actions/company";

interface DashboardWithToggleProps {
	isAdmin: boolean;
	companyId: string;
	userId: string;
	companyName: string;
	companyData: Company | null;
	recentResults: any[];
	modules: Module[];
	memberModules: Module[];
	userResults: { [moduleId: string]: any };
}

export function DashboardWithToggle({
	isAdmin,
	companyId,
	userId,
	companyName,
	companyData,
	recentResults,
	modules,
	memberModules,
	userResults,
}: DashboardWithToggleProps) {
	const [showMemberView, setShowMemberView] = useState(false);

	return (
		<div className="min-h-screen bg-background">
			<header className="sticky top-0 z-50 border-b border-border bg-background">
				<div className="mx-auto px-2 sm:px-4 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
					{isAdmin && !showMemberView ? (
						<div className="flex-1 min-w-0">
							<CompanyLogoUpload
								companyId={companyId}
								currentLogoUrl={companyData?.logo_url || null}
								companyName={companyName}
							/>
						</div>
					) : (
						<div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
							{companyData?.logo_url ? (
								<img
									src={companyData.logo_url}
									alt={`${companyName} logo`}
									className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg object-cover flex-shrink-0"
								/>
							) : (
								<img
									src="/logo.svg"
									alt={`${companyName} logo`}
									className="themed-logo w-6 h-6 sm:w-8 sm:h-8 rounded-lg object-cover flex-shrink-0"
								/>
							)}
							<h1 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground truncate">
								{companyName}
							</h1>
						</div>
					)}

					<div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
						{isAdmin && (
							<div className="flex items-center gap-1.5 sm:gap-2">
								<span className="text-xs sm:text-sm text-foreground hidden sm:inline">Member View</span>
								<Switch
									checked={showMemberView}
									onCheckedChange={setShowMemberView}
								/>
							</div>
						)}
						{isAdmin && (
							<span className="text-xs sm:text-sm text-foreground hidden sm:inline">
								{showMemberView ? "" : "Admin"}
							</span>
						)}
					</div>
				</div>
			</header>

			{isAdmin && !showMemberView ? (
				<div className="flex flex-col lg:flex-row min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)]">
					<main className="flex-1 p-2 sm:p-4 lg:p-6 xl:p-8">
						<div className="max-w-7xl mx-auto">
							<ModulesSection companyId={companyId} initialModules={modules} />
						</div>
					</main>
					<aside className="lg:border-l lg:border-t border-border bg-background p-2 sm:p-4 lg:p-6 lg:w-80 xl:w-96">
						<ResultsSidebar results={recentResults} modules={modules} />
					</aside>
				</div>
			) : (
				<main className="container mx-auto p-2 sm:p-4 lg:p-6 xl:p-8">
					<MemberModulesViewWithFilter
						companyId={companyId}
						userId={userId}
						modules={memberModules}
						userResults={userResults}
					/>
				</main>
			)}
		</div>
	);
}
