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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Available Modules</h2>
        <p className="text-muted-foreground">
          Select a module to take the exam
        </p>
      </div>
      
      {modules.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No modules available yet. Please check back later.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
    <Card className="relative group hover:shadow-md transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-xl">{module.title}</CardTitle>
            {module.description && (
              <CardDescription className="mt-2 line-clamp-2">
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
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Previous Score
                  </span>
                  <Trophy className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {Math.round(result.score)}%
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({result.correct_answers}/{result.total_questions} correct)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Created {new Date(module.created_at).toLocaleDateString()}</span>
              </div>
              
              <Link href={`/dashboard/${companyId}/modules/${module.id}/exam`}>
                <Button className="w-full gap-2">
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
