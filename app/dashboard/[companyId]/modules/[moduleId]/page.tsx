import { headers } from "next/headers"
import { whopsdk } from "@/lib/whop-sdk"
import { DashboardNavbar } from "@/components/dashboard-navbar"
import { getModules } from "@/app/actions/modules"
import { getExercises } from "@/app/actions/exercises"
import { getAlternatives } from "@/app/actions/alternatives"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AddExerciseDialog } from "@/components/add-exercise-dialog"
import { ExerciseNavigation } from "@/components/exercise-navigation"

interface ModulePageProps {
  params: Promise<{ companyId: string; moduleId: string }>
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { companyId, moduleId } = await params
  
  // Ensure the user is logged in on whop
  const { userId } = await whopsdk.verifyUserToken(await headers())

  // Fetch the company data, module, and exercises
  const [company, modules, exercises] = await Promise.all([
    whopsdk.companies.retrieve(companyId),
    getModules(companyId),
    getExercises(moduleId),
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
        </div>
      </header>

      <main className="container mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/${companyId}`}>
            <Button variant="ghost" className="mb-6 gap-2 text-gray-400 hover:text-white hover:bg-gray-800">
              <ArrowLeft className="h-4 w-4" />
              Back to Modules
            </Button>
          </Link>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white">{module.title}</h1>
              {module.description && (
                <p className="mt-2 text-lg text-gray-400">
                  {module.description}
                </p>
              )}
            </div>
            <AddExerciseDialog moduleId={moduleId} />
          </div>
        </div>

        {/* Exercises Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Exercises ({exercises.length})
            </h2>
          </div>
          
          {exercises.length === 0 ? (
            <div className="rounded-xl border border-gray-200/10 bg-[#141414] p-12 text-center">
              <p className="text-gray-400">
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
