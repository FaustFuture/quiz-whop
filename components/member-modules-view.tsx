import { getModules, type Module } from "@/app/actions/modules"
import { getResultsByUserAndModule } from "@/app/actions/results"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Play, RotateCcw, Trophy } from "lucide-react"
import Link from "next/link"

interface MemberModulesViewProps {
  companyId: string
  userId: string
}

export async function MemberModulesView({ companyId, userId }: MemberModulesViewProps) {
  const modules = await getModules(companyId)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-white">Available Modules</h2>
        <p className="text-gray-400">
          Select a module to take the exam
        </p>
      </div>
      
      {modules.length === 0 ? (
        <div className="rounded-xl border border-gray-200/10 bg-[#141414] p-12 text-center">
          <p className="text-gray-400">
            No modules available yet. Please check back later.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {modules.map((module) => (
            <ModuleExamCard 
              key={module.id} 
              module={module} 
              companyId={companyId} 
              userId={userId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface ModuleExamCardProps {
  module: Module
  companyId: string
  userId: string
}

async function ModuleExamCard({ module, companyId, userId }: ModuleExamCardProps) {
  // Fetch the most recent result for this user and module
  const result = await getResultsByUserAndModule(userId, module.id)
  const hasResult = result !== null
  
  return (
    <Card className="relative group hover:shadow-xl transition-all border-gray-200/10 bg-[#141414] hover:bg-[#1a1a1a] hover:border-emerald-500/50">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-2xl text-white">{module.title}</CardTitle>
            {module.description && (
              <CardDescription className="mt-2 line-clamp-2 text-gray-400">
                {module.description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {hasResult ? (
            <>
              {/* Show previous result */}
              <div className="rounded-xl bg-[#1a1a1a] border border-gray-200/10 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-400">
                    Previous Score
                  </span>
                  <Trophy className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${
                    result.score >= 70 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {Math.round(result.score)}%
                  </span>
                  <span className="text-sm text-gray-500">
                    ({result.correct_answers}/{result.total_questions} correct)
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Taken {new Date(result.submitted_at).toLocaleDateString()}
                </p>
              </div>
              
              {/* Retake button */}
              <Link href={`/dashboard/${companyId}/modules/${module.id}/exam`}>
                <Button className="w-full gap-2 bg-black border-gray-200/10 text-gray-400 hover:text-white hover:bg-gray-800 hover:border-emerald-500" variant="outline">
                  <RotateCcw className="h-4 w-4" />
                  Retake Exam
                </Button>
              </Link>
            </>
          ) : (
            <>
              {/* No result yet - show take exam */}
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <span>Created {new Date(module.created_at).toLocaleDateString()}</span>
              </div>
              
              <Link href={`/dashboard/${companyId}/modules/${module.id}/exam`}>
                <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Play className="h-4 w-4" />
                  Take Exam
                </Button>
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
