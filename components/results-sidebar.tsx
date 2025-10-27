"use client"

import { useState, useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, CheckCircle, XCircle, Eye, Download, Filter } from "lucide-react"
import { type ResultWithModule } from "@/app/actions/results"
import { ResultDetailsModal } from "@/components/result-details-modal"
import { type Module } from "@/app/actions/modules"

interface ResultsSidebarProps {
  results: ResultWithModule[]
  modules: Module[]
}

export function ResultsSidebar({ results, modules }: ResultsSidebarProps) {
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null)
  const [selectedModuleId, setSelectedModuleId] = useState<string>("all")
  const [isExporting, setIsExporting] = useState(false)

  // Filter results based on selected module
  const filteredResults = useMemo(() => {
    if (selectedModuleId === "all") {
      return results
    }
    return results.filter(result => result.module_id === selectedModuleId)
  }, [results, selectedModuleId])

  // Generate CSV data
  const generateCSV = async () => {
    setIsExporting(true)
    try {
      if (selectedModuleId === "all") {
        // Export summary data for all modules
        const headers = [
          "User ID",
          "Module",
          "Score (%)",
          "Correct Answers",
          "Total Questions",
          "Submitted At"
        ]
        
        const csvData = filteredResults.map(result => [
          result.user_name || result.user_id,
          result.module_title,
          Math.round(result.score).toString(),
          result.correct_answers.toString(),
          result.total_questions.toString(),
          new Date(result.submitted_at).toLocaleString()
        ])
        
        const csvContent = [headers, ...csvData]
          .map(row => row.map(field => `"${field}"`).join(","))
          .join("\n")
        
        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `quiz-results-summary-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        // Export detailed data for specific module
        try {
          const detailedData = await fetchDetailedResults(filteredResults)
          const headers = [
            "User ID",
            "Module",
            "Score (%)",
            "Correct Answers",
            "Total Questions",
            "Submitted At",
            "Question Number",
            "Question Text",
            "Selected Answer",
            "Is Correct",
            "Time Spent (seconds)",
            "Explanation"
          ]
          
          const csvData = detailedData.flatMap(result => 
            result.answers.map((answer, index) => [
              result.user_name || result.user_id,
              result.module_title,
              Math.round(result.score).toString(),
              result.correct_answers.toString(),
              result.total_questions.toString(),
              new Date(result.submitted_at).toLocaleString(),
              (index + 1).toString(),
              answer.exercises?.question || "N/A",
              answer.alternatives?.content || "N/A",
              answer.is_correct ? "Yes" : "No",
              answer.time_spent_seconds.toString(),
              answer.alternatives?.explanation || ""
            ])
          )
          
          const csvContent = [headers, ...csvData]
            .map(row => row.map(field => `"${field}"`).join(","))
            .join("\n")
          
          const blob = new Blob([csvContent], { type: "text/csv" })
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `quiz-results-detailed-${modules.find(m => m.id === selectedModuleId)?.title?.replace(/[^a-zA-Z0-9]/g, '-') || 'module'}-${new Date().toISOString().split('T')[0]}.csv`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        } catch (error) {
          console.error("Error generating detailed CSV:", error)
          alert("Error generating detailed CSV. Please try again.")
        }
      }
    } finally {
      setIsExporting(false)
    }
  }

  // Fetch detailed results with exam answers
  const fetchDetailedResults = async (results: ResultWithModule[]) => {
    const detailedResults = await Promise.all(
      results.map(async (result) => {
        try {
          const response = await fetch(`/api/results/${result.id}/detailed`)
          if (!response.ok) {
            throw new Error(`Failed to fetch details for result ${result.id}`)
          }
          const data = await response.json()
          return {
            ...result,
            answers: data.answers || []
          }
        } catch (error) {
          console.error(`Error fetching details for result ${result.id}:`, error)
          return {
            ...result,
            answers: []
          }
        }
      })
    )
    return detailedResults
  }

  return (
    <>
      <Card className="h-full border-gray-200/10 bg-transparent">
        <CardHeader className="pb-4 border-b border-gray-200/10">
          <div className="space-y-4">
            <CardTitle className="text-xl flex items-center gap-2 text-white">
              <Trophy className="h-5 w-5 text-emerald-500" />
              Latest Results
            </CardTitle>
          
            {/* Module Filter */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Filter className="h-4 w-4" />
                Filter by Module
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {selectedModuleId === "all" 
                  ? "Summary export: Basic results for all modules" 
                  : "Detailed export: Includes individual question answers and explanations"
                }
              </p>
              <div className="flex items-center gap-2">
                <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                  <SelectTrigger className="bg-[#1a1a1a] border-gray-200/10 text-white h-9">
                    <SelectValue placeholder="All modules" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-200/10">
                    <SelectItem value="all" className="text-white focus:bg-gray-800">
                      All modules ({results.length})
                    </SelectItem>
                    {modules.map((module) => {
                      const moduleResultCount = results.filter(r => r.module_id === module.id).length
                      return (
                        <SelectItem 
                          key={module.id} 
                          value={module.id}
                          className="text-white focus:bg-gray-800"
                        >
                          {module.title} ({moduleResultCount})
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <Button
                  onClick={generateCSV}
                  size="icon"
                  className="h-9 w-9 bg-emerald-600 hover:bg-emerald-700"
                  disabled={filteredResults.length === 0 || isExporting}
                  title={
                    isExporting 
                      ? "Exporting..." 
                      : selectedModuleId === "all" 
                        ? "Download summary export with basic results for all modules" 
                        : "Download detailed export with individual question answers and explanations"
                  }
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            {filteredResults.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-400">
                  {selectedModuleId === "all" 
                    ? "No exam results yet." 
                    : "No results for this module."}
                </p>
                <p className="text-xs mt-2 text-gray-500">
                  {selectedModuleId === "all"
                    ? "Results will appear here when users complete exams."
                    : "Try selecting a different module or view all results."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200/10">
                {filteredResults.map((result) => (
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
                            {result.user_name || result.user_id}
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

