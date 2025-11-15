import { headers } from "next/headers"
import { whopsdk } from "@/lib/whop-sdk"
import { DashboardNavbar } from "@/components/dashboard-navbar"
import { getModules } from "@/app/actions/modules"
import { getExercises } from "@/app/actions/exercises"
import { getAlternatives } from "@/app/actions/alternatives"
import { getCompany } from "@/app/actions/company"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AddExerciseDialog } from "@/components/add-exercise-dialog"
import { ExerciseNavigation } from "@/components/exercise-navigation"
import { RetakeStatsDialog } from "@/components/retake-stats-dialog"
import { ExamGrantRetake } from "@/components/exam-grant-retake"
import { ExamLockToggle } from "@/components/exam-lock-toggle"

interface ModulePageProps {
	params: Promise<{ companyId: string; moduleId: string }>
}

export default async function ModulePage({ params }: ModulePageProps) {
	const { companyId, moduleId } = await params

	// Ensure the user is logged in on whop
	const { userId } = await whopsdk.verifyUserToken(await headers())

	// Fetch the company data, module, and exercises
	const [company, modules, exercises, companyRecord] = await Promise.all([
		whopsdk.companies.retrieve(companyId),
		getModules(companyId),
		getExercises(moduleId),
		getCompany(companyId),
	])

	const module = modules.find((m) => m.id === moduleId)

	if (!module) {
		notFound()
	}

	// Fetch alternatives for the first exercise (if any)
	const alternatives = exercises.length > 0 ? await getAlternatives(exercises[0].id) : []

	// Get company name, fallback to ID if name is not available
	const companyName = (company as any).name || (company as any).title || companyId

	return (
		<div className="min-h-screen bg-background">
			<DashboardNavbar companyName={companyName} logoUrl={companyRecord?.logo_url || null} />

			<main className="container mx-auto p-2 sm:p-4 lg:p-6 xl:p-8">
				{/* Header */}
				<div className="mb-4 sm:mb-6 lg:mb-8">
					<Link href={`/dashboard/${companyId}`}>
						<Button variant="ghost" className="mb-3 sm:mb-4 lg:mb-6 gap-2 text-muted-foreground hover:text-foreground hover:bg-accent text-xs sm:text-sm min-h-[44px]">
							<ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
							Back to Dashboard
						</Button>
					</Link>

					<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
						<div className="flex-1 min-w-0">
							<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground break-words">{module.title}</h1>
							{module.description && (
								<p className="mt-2 text-sm sm:text-base lg:text-lg text-muted-foreground break-words">
									{module.description}
								</p>
							)}
						</div>
						<div className="flex items-center gap-2 flex-wrap">
							<ExamLockToggle
								moduleId={moduleId}
								companyId={companyId}
								isUnlocked={module.is_unlocked}
								moduleType={module.type}
							/>
							<ExamGrantRetake moduleId={moduleId} companyId={companyId} moduleType={module.type} />
							<RetakeStatsDialog moduleId={moduleId} moduleTitle={module.title} moduleType={module.type} />
							<AddExerciseDialog moduleId={moduleId} />
						</div>
					</div>
				</div>

				{/* Exercises Section */}
				<div className="space-y-4 sm:space-y-6">
					<div className="flex items-center justify-between">
						<h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
							Exercises ({exercises.length})
						</h2>
					</div>

					{exercises.length === 0 ? (
						<div className="rounded-xl border border-border bg-card p-6 sm:p-8 lg:p-12 text-center">
							<p className="text-sm sm:text-base text-muted-foreground">
								No exercises yet. Click "Add Exercise" to create your first exercise.
							</p>
						</div>
					) : (
						<div className="max-w-4xl mx-auto">
							<ExerciseNavigation
								exercises={exercises}
								moduleId={moduleId}
							/>
						</div>
					)}
				</div>
			</main>
		</div>
	)
}
