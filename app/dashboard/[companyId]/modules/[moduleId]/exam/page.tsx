import { headers } from "next/headers"
import { whopsdk } from "@/lib/whop-sdk"
import { DashboardNavbar } from "@/components/dashboard-navbar"
import { getModules } from "@/app/actions/modules"
import { getExercises } from "@/app/actions/exercises"
import { getAlternatives } from "@/app/actions/alternatives"
import { ExamInterface } from "@/components/exam-interface"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface ExamPageProps {
  params: Promise<{ companyId: string; moduleId: string }>
}

export default async function ExamPage({ params }: ExamPageProps) {
  const { companyId, moduleId } = await params
  
  // Ensure the user is logged in on whop
  const { userId } = await whopsdk.verifyUserToken(await headers())

  // Fetch the company data
  const company = await whopsdk.companies.retrieve(companyId)
  
  // Get company name, fallback to ID if name is not available
  const companyName = (company as any).name || (company as any).title || companyId

  // Get modules to find the current module
  const modules = await getModules(companyId)
  const module = modules.find((m) => m.id === moduleId)

  if (!module) {
    notFound()
  }

  // Fetch exercises for this module
  const exercises = await getExercises(moduleId)

  // Fetch alternatives for each exercise
  const questionsWithAlternatives = await Promise.all(
    exercises.map(async (exercise) => {
      const alternatives = await getAlternatives(exercise.id)
      return {
        ...exercise,
        alternatives
      }
    })
  )

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar companyName={companyName} />
      <main className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/dashboard/${companyId}`}>
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Modules
            </Button>
          </Link>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">{module.title}</h1>
            {module.description && (
              <p className="text-lg text-muted-foreground">
                {module.description}
              </p>
            )}
          </div>
        </div>

        {/* Exam Interface */}
        <ExamInterface
          questions={questionsWithAlternatives}
          moduleTitle={module.title}
          companyId={companyId}
          moduleId={moduleId}
          userId={userId}
        />
      </main>
    </div>
  )
}
