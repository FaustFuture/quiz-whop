"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Check, X, ChevronRight, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { type Exercise } from "@/app/actions/exercises"
import { type Alternative } from "@/app/actions/alternatives"
import { saveExamResult, type AnswerSubmission } from "@/app/actions/results"
import Image from "next/image"

interface ExamQuestion extends Exercise {
  alternatives: Alternative[]
}

interface ExamInterfaceProps {
  questions: ExamQuestion[]
  moduleTitle: string
  companyId: string
  moduleId: string
  userId: string
}

interface AnswerRecord {
  questionId: string
  selectedAlternativeId: string
  isCorrect: boolean
  timeSpentSeconds: number
}

export function ExamInterface({ questions, moduleTitle, companyId, moduleId, userId }: ExamInterfaceProps) {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [selectedAlternativeId, setSelectedAlternativeId] = useState<string | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
  const questionStartTime = useRef<number>(Date.now())

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  // Check if this question has already been answered and reset timer
  useEffect(() => {
    const existingAnswer = answers.find(a => a.questionId === currentQuestion.id)
    if (existingAnswer) {
      setSelectedAlternativeId(existingAnswer.selectedAlternativeId)
      setHasAnswered(true)
    } else {
      setSelectedAlternativeId(null)
      setHasAnswered(false)
      // Reset timer for new question
      questionStartTime.current = Date.now()
    }
  }, [currentQuestionIndex, answers, currentQuestion.id])

  const handleAlternativeSelect = (alternativeId: string) => {
    // Can only select if not yet answered
    if (hasAnswered) return

    setSelectedAlternativeId(alternativeId)
    
    // Find the selected alternative to check if it's correct
    const selectedAlternative = currentQuestion.alternatives.find(a => a.id === alternativeId)
    if (!selectedAlternative) return

    // Calculate time spent on this question
    const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000)

    // Mark as answered and save the answer
    setHasAnswered(true)
    
    const newAnswer: AnswerRecord = {
      questionId: currentQuestion.id,
      selectedAlternativeId: alternativeId,
      isCorrect: selectedAlternative.is_correct,
      timeSpentSeconds: timeSpent
    }

    setAnswers(prev => [...prev, newAnswer])
  }

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // Last question - save results to database
      setIsSaving(true)
      
      // The current question's answer should already be in the answers array
      // Calculate correct answers from all answers
      const correctAnswers = answers.filter(a => a.isCorrect).length
      const totalQuestions = questions.length
      const scorePercentage = (correctAnswers / totalQuestions) * 100
      
      // Prepare answers for database
      const answerSubmissions: AnswerSubmission[] = answers.map(answer => ({
        exerciseId: answer.questionId,
        selectedAlternativeId: answer.selectedAlternativeId,
        isCorrect: answer.isCorrect,
        timeSpentSeconds: answer.timeSpentSeconds
      }))
      
      // Save to database
      const result = await saveExamResult(
        userId,
        moduleId,
        scorePercentage,
        totalQuestions,
        correctAnswers,
        answerSubmissions
      )
      
      if (result.success) {
        console.log("Exam results saved successfully!", result)
      } else {
        console.error("Failed to save exam results:", result.error)
        // Still show results even if save fails
      }
      
      setIsSaving(false)
      setShowResults(true)
    }
  }

  const getAlternativeStyle = (alternativeId: string, isCorrect: boolean) => {
    if (!hasAnswered) {
      return "border-gray-200 hover:border-primary cursor-pointer"
    }

    if (alternativeId === selectedAlternativeId) {
      if (isCorrect) {
        return "border-green-500 bg-green-50 dark:bg-green-950"
      } else {
        return "border-red-500 bg-red-50 dark:bg-red-950"
      }
    }

    // Show the correct answer if user selected wrong
    if (isCorrect && !currentQuestion.alternatives.find(a => a.id === selectedAlternativeId)?.is_correct) {
      return "border-green-500 bg-green-50 dark:bg-green-950"
    }

    return "border-gray-200 opacity-50"
  }

  const getAlternativeIcon = (alternativeId: string, isCorrect: boolean) => {
    if (!hasAnswered) return null

    if (alternativeId === selectedAlternativeId) {
      if (isCorrect) {
        return <Check className="h-5 w-5 text-green-600" />
      } else {
        return <X className="h-5 w-5 text-red-600" />
      }
    }

    // Show the correct answer if user selected wrong
    if (isCorrect && !currentQuestion.alternatives.find(a => a.id === selectedAlternativeId)?.is_correct) {
      return <Check className="h-5 w-5 text-green-600" />
    }

    return null
  }

  if (showResults) {
    const correctAnswers = answers.filter(a => a.isCorrect).length
    const totalQuestions = questions.length
    const scorePercentage = (correctAnswers / totalQuestions) * 100

    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-center">Exam Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold mb-4">
                {scorePercentage.toFixed(0)}%
              </div>
              <p className="text-lg text-muted-foreground">
                You got {correctAnswers} out of {totalQuestions} questions correct
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Question Breakdown</h3>
              {questions.map((question, index) => {
                const answer = answers.find(a => a.questionId === question.id)
                return (
                  <div key={question.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="flex-shrink-0">
                      {answer?.isCorrect ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <X className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Question {index + 1}</p>
                      <p className="text-sm text-muted-foreground">{question.question}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {question.weight} {question.weight === 1 ? "point" : "points"}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button onClick={() => router.push(`/dashboard/${companyId}`)}>
              Back to Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setCurrentQuestionIndex(0)
                setAnswers([])
                setSelectedAlternativeId(null)
                setHasAnswered(false)
                setShowResults(false)
              }}
            >
              Retake Exam
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-lg text-muted-foreground">
              This module doesn't have any questions yet.
            </p>
            <Button 
              className="mt-4"
              onClick={() => router.push(`/dashboard/${companyId}`)}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="mb-6">
        <CardHeader>
          {currentQuestion.image_url && (
            <div className="relative w-full mb-4 rounded-lg overflow-hidden bg-[#1a1a1a] border border-gray-200/10">
              <div className="relative w-full max-h-64 flex items-center justify-center">
                <Image
                  src={currentQuestion.image_url}
                  alt="Question image"
                  width={800}
                  height={600}
                  className="w-full h-auto max-h-64 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setFullscreenImage(currentQuestion.image_url!)}
                />
                <button
                  onClick={() => setFullscreenImage(currentQuestion.image_url!)}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          <CardTitle className="text-2xl">
            {currentQuestion.question}
          </CardTitle>
          {currentQuestion.weight > 1 && (
            <p className="text-sm text-muted-foreground">
              {currentQuestion.weight} points
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.alternatives.map((alternative) => (
            <div
              key={alternative.id}
              onClick={() => handleAlternativeSelect(alternative.id)}
              className={`p-4 rounded-lg border-2 transition-all ${getAlternativeStyle(
                alternative.id,
                alternative.is_correct
              )} ${!hasAnswered ? "hover:shadow-md" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium">{alternative.content}</p>
                  {hasAnswered && alternative.explanation && (
                    alternative.id === selectedAlternativeId || alternative.is_correct
                  ) && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {alternative.explanation}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {getAlternativeIcon(alternative.id, alternative.is_correct)}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {hasAnswered ? (
              selectedAlternativeId && 
              currentQuestion.alternatives.find(a => a.id === selectedAlternativeId)?.is_correct ? (
                <span className="text-green-600 font-medium">Correct! Great job!</span>
              ) : (
                <span className="text-red-600 font-medium">Incorrect. Review the correct answer above.</span>
              )
            ) : (
              <span>Select an answer to continue</span>
            )}
          </div>
          <Button
            onClick={handleNext}
            disabled={!hasAnswered || isSaving}
            className="gap-2"
          >
            {isSaving ? (
              "Saving Results..."
            ) : currentQuestionIndex < questions.length - 1 ? (
              <>Next Question <ChevronRight className="h-4 w-4" /></>
            ) : (
              <>View Results <ChevronRight className="h-4 w-4" /></>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Question Navigation Dots */}
      <div className="flex justify-center gap-2">
        {questions.map((_, index) => {
          const isAnswered = answers.some(a => a.questionId === questions[index].id)
          const isCurrent = index === currentQuestionIndex
          
          return (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                isCurrent
                  ? "w-8 bg-primary"
                  : isAnswered
                  ? "w-2 bg-green-500"
                  : "w-2 bg-gray-300"
              }`}
            />
          )
        })}
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative max-w-[90vw] max-h-[90vh] p-4">
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <Image
              src={fullscreenImage}
              alt="Question image fullscreen"
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}

