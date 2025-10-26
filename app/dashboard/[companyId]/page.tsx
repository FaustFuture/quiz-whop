import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { DashboardNavbar } from "@/components/dashboard-navbar";
import { ModulesSection } from "@/components/modules-section";
import { MemberModulesView } from "@/components/member-modules-view";
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

	return (
		<div className="min-h-screen bg-background">
			<DashboardNavbar companyName={companyName} />
			<main className="container mx-auto p-6">
				<DebugAccess access={access} company={company} user={user} />
				{isAdmin ? (
					<ModulesSection companyId={companyId} />
				) : (
					<MemberModulesView companyId={companyId} />
				)}
			</main>
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
