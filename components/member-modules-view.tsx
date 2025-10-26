import { getModules, type Module } from "@/app/actions/modules"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Play } from "lucide-react"
import Link from "next/link"

interface MemberModulesViewProps {
  companyId: string
}

export async function MemberModulesView({ companyId }: MemberModulesViewProps) {
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
            <ModuleExamCard key={module.id} module={module} companyId={companyId} />
          ))}
        </div>
      )}
    </div>
  )
}

interface ModuleExamCardProps {
  module: Module
  companyId: string
}

function ModuleExamCard({ module, companyId }: ModuleExamCardProps) {
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Created {new Date(module.created_at).toLocaleDateString()}</span>
          </div>
          
          <Link href={`/dashboard/${companyId}/modules/${module.id}/exam`}>
            <Button className="w-full gap-2">
              <Play className="h-4 w-4" />
              Take Exam
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
