"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, CheckCircle, XCircle, Eye } from "lucide-react"
import { type ResultWithModule } from "@/app/actions/results"
import { ResultDetailsModal } from "@/components/result-details-modal"

interface ResultsSidebarProps {
  results: ResultWithModule[]
}

export function ResultsSidebar({ results }: ResultsSidebarProps) {
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null)

  return (
    <>
      <Card className="h-full border-gray-200/10 bg-transparent">
        <CardHeader className="pb-3 border-b border-gray-200/10">
          <CardTitle className="text-xl flex items-center gap-2 text-white">
            <Trophy className="h-5 w-5 text-emerald-500" />
            Latest Results
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-200px)]">
            {results.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-400">No exam results yet.</p>
                <p className="text-xs mt-2 text-gray-500">
                  Results will appear here when users complete exams.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => setSelectedResultId(result.id)}
                    className="w-full px-4 py-3 hover:bg-gray-800/50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Left: User and Module Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium truncate text-gray-200">
                            {result.user_id}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                              result.score >= 70
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {Math.round(result.score)}%
                          </span>
                        </div>
                        
                        <p className="text-xs text-gray-400 truncate mb-1">
                          {result.module_title}
                        </p>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-emerald-500" />
                            <span>{result.correct_answers}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-red-500" />
                            <span>{result.total_questions - result.correct_answers}</span>
                          </div>
                          <span>{formatRelativeTime(result.submitted_at)}</span>
                        </div>
                      </div>

                      {/* Right: View Icon */}
                      <Eye className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedResultId && (
        <ResultDetailsModal
          resultId={selectedResultId}
          open={selectedResultId !== null}
          onClose={() => setSelectedResultId(null)}
        />
      )}
    </>
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

