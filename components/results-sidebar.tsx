import { getRecentResults } from "@/app/actions/results"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Clock, CheckCircle, XCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface ResultsSidebarProps {
  companyId: string
}

export async function ResultsSidebar({ companyId }: ResultsSidebarProps) {
  const recentResults = await getRecentResults(companyId, 10)

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Latest Results
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)]">
          {recentResults.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <p className="text-sm">No exam results yet.</p>
              <p className="text-xs mt-2">
                Results will appear here when users complete exams.
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-4">
              {recentResults.map((result, index) => (
                <div key={result.id}>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    {/* User Avatar */}
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="text-xs">
                        {result.user_id.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Result Details */}
                    <div className="flex-1 min-w-0">
                      {/* User ID */}
                      <p className="text-sm font-medium truncate">
                        {result.user_id}
                      </p>

                      {/* Module Title */}
                      <p className="text-xs text-muted-foreground truncate">
                        {result.module_title}
                      </p>

                      {/* Score and Stats */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-sm font-bold ${
                              result.score >= 70
                                ? "text-green-600"
                                : result.score >= 50
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {Math.round(result.score)}%
                          </span>
                        </div>

                        <span className="text-xs text-muted-foreground">•</span>

                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-muted-foreground">
                            {result.correct_answers}
                          </span>
                        </div>

                        <span className="text-xs text-muted-foreground">•</span>

                        <div className="flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-red-600" />
                          <span className="text-xs text-muted-foreground">
                            {result.total_questions - result.correct_answers}
                          </span>
                        </div>
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(result.submitted_at)}
                        </span>
                      </div>
                    </div>

                    {/* Score Badge */}
                    <div className="flex-shrink-0">
                      <div
                        className={`px-2 py-1 rounded-md text-xs font-semibold ${
                          result.score >= 70
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : result.score >= 50
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {result.score >= 70 ? "Pass" : "Fail"}
                      </div>
                    </div>
                  </div>
                  {index < recentResults.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "Just now"
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  } else {
    return date.toLocaleDateString()
  }
}

