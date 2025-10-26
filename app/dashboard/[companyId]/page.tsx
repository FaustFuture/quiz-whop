import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { DashboardNavbar } from "@/components/dashboard-navbar";
import { ModulesSection } from "@/components/modules-section";
import { MemberModulesView } from "@/components/member-modules-view";
import { ResultsSidebar } from "@/components/results-sidebar";
import { getRecentResults } from "@/app/actions/results";
import { DebugAccess } from "@/components/debug-access";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;
	
	// Get headers for debugging
	const headersList = await headers();
	console.log("Headers:", Object.fromEntries(headersList.entries()));
	
	// Ensure the user is logged in on whop
	const { userId } = await whopsdk.verifyUserToken(headersList);
	console.log("Verified User ID:", userId);

	// Fetch the necessary data from whop
	const [company, user, access] = await Promise.all([
		whopsdk.companies.retrieve(companyId),
		whopsdk.users.retrieve(userId),
		whopsdk.users.checkAccess(companyId, { id: userId }),
	]);

	console.log("Company:", company);
	console.log("User:", user);
	console.log("Access:", access);
	// Get company name, fallback to ID if name is not available
	const companyName = (company as any).name || (company as any).title || companyId;

	// Check if user is admin based on access data
	const isAdmin = checkUserIsAdmin(userId, company, access);

	// Fetch recent results for admin sidebar
	const recentResults = isAdmin ? await getRecentResults(companyId, 10) : [];

	return (
		<div className="min-h-screen bg-[#0a0a0a]">
			{/* Custom Header */}
			<header className="border-b border-gray-200/10 bg-[#0f0f0f]">
				<div className="container mx-auto px-6 h-16 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
							<span className="text-white font-bold text-sm">Q</span>
						</div>
						<h1 className="text-xl font-semibold text-white">{companyName}</h1>
					</div>
					<div className="flex items-center gap-4">
						<span className="text-sm text-gray-400">{isAdmin ? "Admin" : "Member"}</span>
					</div>
				</div>
			</header>
			
			{isAdmin ? (
				<div className="flex min-h-[calc(100vh-4rem)]">
					{/* Main Content */}
					<main className="flex-1 p-8">
						<div className="max-w-7xl mx-auto">
							<ModulesSection companyId={companyId} />
						</div>
					</main>
					
					{/* Sidebar */}
					<aside className="w-[400px] border-l border-gray-200/10 bg-[#0f0f0f] p-6">
						<ResultsSidebar results={recentResults} />
					</aside>
				</div>
			) : (
				<main className="container mx-auto p-8">
					<MemberModulesView companyId={companyId} userId={userId} />
				</main>
			)}
		</div>
	);
}

function checkUserIsAdmin(userId: string, company: any, access: any): boolean {
	console.log("Checking admin status for user:", userId);
	console.log("Company owner ID:", company?.owner_user?.id);
	console.log("Access data:", access);
	
	// Check if user is the company owner
	if (company?.owner_user?.id === userId) {
		console.log("User is company owner - granting admin access");
		return true;
	}
	
	// Check access level
	if (access?.access_level === "admin") {
		console.log("User has admin access level - granting admin access");
		return true;
	}
	
	// Check if user has access
	if (access?.has_access === true) {
		console.log("User has access but not admin level - member view");
		return false;
	}
	
	console.log("User has no access - member view");
	return false;
}
