import { headers } from "next/headers"
import { whopsdk } from "@/lib/whop-sdk"
import { DashboardNavbar } from "@/components/dashboard-navbar"
import { getModules } from "@/app/actions/modules"
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
          
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-2">{module.title}</h1>
            {module.description && (
              <p className="text-lg text-muted-foreground mb-8">
                {module.description}
              </p>
            )}
          </div>
        </div>

        {/* Exam Content */}
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg border border-dashed p-12 text-center">
            <h2 className="text-2xl font-semibold mb-4">Exam Coming Soon</h2>
            <p className="text-muted-foreground mb-6">
              The exam functionality is currently under development. 
              You'll be able to take quizzes and track your progress here.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Multiple choice questions</p>
              <p>• Real-time scoring</p>
              <p>• Progress tracking</p>
              <p>• Results history</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
