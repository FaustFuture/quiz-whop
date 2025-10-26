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
	
	// Ensure the user is logged in on whop
	const { userId } = await whopsdk.verifyUserToken(await headers());

	// Fetch the necessary data from whop
	const [company, user, access] = await Promise.all([
		whopsdk.companies.retrieve(companyId),
		whopsdk.users.retrieve(userId),
		whopsdk.users.checkAccess(companyId, { id: userId }),
	]);


	console.log(company);
	console.log(user);
	console.log(access);
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
	if(access.access_level === "admin") {
		return true;
	}
	return false;
}
