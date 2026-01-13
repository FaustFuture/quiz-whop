"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, X, ChevronRight, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { type Exercise } from "@/app/actions/exercises";
import { type Alternative } from "@/app/actions/alternatives";
import {
  saveExamResult,
  getUserRetakeStats,
  getResultWithAnswers,
  type AnswerSubmission,
} from "@/app/actions/results";
import { hasExamRetakeAccess } from "@/app/actions/users";
import Image from "next/image";

interface ExamQuestion extends Exercise {
  alternatives: Alternative[];
}

interface ExamInterfaceProps {
  questions: ExamQuestion[];
  moduleTitle: string;
  companyId: string;
  moduleId: string;
  userId: string;
  userName: string;
  moduleType: "module" | "exam";
  isUnlocked: boolean;
}

interface AnswerRecord {
  questionId: string;
  selectedAlternativeId: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export function ExamInterface({
  questions,
  moduleTitle,
  companyId,
  moduleId,
  userId,
  userName,
  moduleType,
  isUnlocked,
}: ExamInterfaceProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selectedAlternativeId, setSelectedAlternativeId] = useState<
    string | null
  >(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [viewResults, setViewResults] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [fullscreenVideo, setFullscreenVideo] = useState<string | null>(null);
  const [retakeStats, setRetakeStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [hasRetakeAccess, setHasRetakeAccess] = useState<boolean | null>(null);
  // Track if user has completed this exam (from DB or current session)
  const [hasCompletedExam, setHasCompletedExam] = useState(false);
  const questionStartTime = useRef<number>(Date.now());
  const searchParams = useSearchParams();

  const currentQuestion = questions[currentQuestionIndex];
  const [imageSize, setImageSize] = useState<
    "aspect-ratio" | "large" | "medium" | "small"
  >(
    (currentQuestion.image_display_size as
      | "aspect-ratio"
      | "large"
      | "medium"
      | "small") || "aspect-ratio"
  );
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Function to reload retake stats and access
  const reloadRetakeData = async () => {
    try {
      const stats = await getUserRetakeStats(userId, moduleId);
      if (stats.success && stats.data) {
        setRetakeStats(stats.data);
      }
    } catch (error) {
      console.error("Error reloading retake stats:", error);
    }

    if (moduleType === "exam") {
      try {
        const access = await hasExamRetakeAccess(moduleId, userId);
        if (access.success) {
          setHasRetakeAccess(access.data ?? false);
        } else {
          setHasRetakeAccess(false);
        }
      } catch (error) {
        console.error("Error reloading retake access:", error);
        setHasRetakeAccess(false);
      }
    }
  };

  // Load retake stats and access on component mount
  useEffect(() => {
    // If opened with view=results, show results immediately
    const viewParam = searchParams?.get("view");
    if (viewParam === "results" || viewParam === "1") {
      setViewResults(true);
    }

    const loadRetakeStats = async () => {
      try {
        const stats = await getUserRetakeStats(userId, moduleId);
        if (stats.success && stats.data) {
          setRetakeStats(stats.data);
          const totalAttempts = stats.data.totalAttempts || 0;

          // Mark as completed if user has any previous attempts
          if (totalAttempts > 0) {
            setHasCompletedExam(true);
          }

          // If we are in review mode and have attempts, hydrate answers from latest attempt
          if (
            (viewParam === "results" || viewParam === "1") &&
            totalAttempts > 0
          ) {
            const latestAttemptId = stats.data.attempts?.[0]?.id;
            if (latestAttemptId) {
              const detailed = await getResultWithAnswers(latestAttemptId);
              if (detailed.success && detailed.data) {
                const hydrated = (detailed.data.answers || []).map(
                  (a: any) => ({
                    questionId: a.exercise_id,
                    selectedAlternativeId: a.selected_alternative_id,
                    isCorrect: !!a.is_correct,
                    timeSpentSeconds: a.time_spent_seconds ?? 0,
                  })
                ) as any;
                setAnswers(hydrated as any);
              }
            }
          }
          return totalAttempts;
        }
      } catch (error) {
        console.error("Error loading retake stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
      return 0;
    };

    const loadRetakeAccess = async (totalAttempts: number) => {
      if (moduleType === "exam") {
        try {
          const access = await hasExamRetakeAccess(moduleId, userId);
          if (access.success) {
            const allowed = access.data ?? false;
            setHasRetakeAccess(allowed);
            // Only force results if the user has already attempted at least once AND doesn't have retake access
            // Don't force if they're explicitly viewing results via URL param
            const isViewingResults =
              viewParam === "results" || viewParam === "1";
            if (!allowed && totalAttempts > 0 && !isViewingResults) {
              setViewResults(true);
            }
          } else {
            setHasRetakeAccess(false);
            const isViewingResults =
              viewParam === "results" || viewParam === "1";
            if (totalAttempts > 0 && !isViewingResults) {
              setViewResults(true);
            }
          }
        } catch (error) {
          console.error("Error loading retake access:", error);
          setHasRetakeAccess(false);
          const isViewingResults = viewParam === "results" || viewParam === "1";
          if (totalAttempts > 0 && !isViewingResults) {
            setViewResults(true);
          }
        }
      } else {
        // For modules, always allow retake
        setHasRetakeAccess(true);
      }
    };

    // Load stats first, then access (which needs totalAttempts)
    loadRetakeStats().then((totalAttempts) => {
      loadRetakeAccess(totalAttempts);
    });
  }, [userId, moduleId, moduleType, searchParams]);

  const getImageHeightClass = () => {
    switch (imageSize) {
      case "large":
        return "h-[50vh]";
      case "medium":
        return "h-[35vh]";
      case "small":
        return "h-[25vh]";
      case "aspect-ratio":
      default:
        return "h-auto";
    }
  };

  const renderImages = (imgs: string[]) => {
    if (imgs.length === 0) return null;

    const layout =
      (currentQuestion as any).image_layout ||
      (imgs.length === 2
        ? "horizontal"
        : imgs.length === 3
        ? "carousel"
        : "grid");

    if (imgs.length === 1) {
      return (
        <div className="relative w-full mb-4 rounded-lg overflow-hidden bg-muted border border-border group">
          <div
            className={`relative w-full ${getImageHeightClass()} flex items-center justify-center`}
          >
            <Image
              src={imgs[0]}
              alt="Question image"
              width={800}
              height={600}
              className={`w-full ${getImageHeightClass()} object-cover rounded-lg`}
            />
            <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs font-bold rounded">
              1
            </div>
            <button
              onClick={() => setFullscreenImage(imgs[0])}
              className="absolute top-2 right-2 p-2 sm:p-2.5 bg-black/50 rounded-lg text-white hover:bg-black/70 active:bg-black/80 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
              aria-label="Fullscreen image"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      );
    }

    // Multiple images - render based on layout
    if (imgs.length === 2) {
      if (layout === "vertical") {
        return (
          <div
            className={`relative w-full mb-4 rounded-lg overflow-hidden bg-muted border border-border p-1 sm:p-2 ${getImageHeightClass()}`}
          >
            <div className="grid grid-cols-1 gap-1 sm:gap-2 h-full">
              {imgs.map((u, i) => (
                <div key={i} className="relative w-full h-full group">
                  <img
                    src={u}
                    alt={`Question image ${i + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-xs font-bold rounded">
                    {i + 1}
                  </div>
                  <button
                    onClick={() => setFullscreenImage(u)}
                    className="absolute top-1 right-1 p-1.5 sm:p-1 bg-black/50 rounded text-white hover:bg-black/70 active:bg-black/80 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
                    aria-label="Fullscreen image"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      } else {
        // horizontal
        return (
          <div
            className={`relative w-full mb-4 rounded-lg overflow-hidden bg-muted border border-border p-1 sm:p-2 ${getImageHeightClass()}`}
          >
            <div className="grid grid-cols-2 gap-1 sm:gap-2 h-full">
              {imgs.map((u, i) => (
                <div key={i} className="relative w-full h-full group">
                  <img
                    src={u}
                    alt={`Question image ${i + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-xs font-bold rounded">
                    {i + 1}
                  </div>
                  <button
                    onClick={() => setFullscreenImage(u)}
                    className="absolute top-1 right-1 p-1.5 sm:p-1 bg-black/50 rounded text-white hover:bg-black/70 active:bg-black/80 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
                    aria-label="Fullscreen image"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      }
    }

    if (imgs.length === 3) {
      return (
        <div
          className={`relative w-full mb-4 rounded-lg overflow-hidden bg-muted border border-border p-1 sm:p-2 ${getImageHeightClass()}`}
        >
          <div className="flex gap-2 sm:gap-4 h-full overflow-x-auto scrollbar-hide">
            {imgs.map((u, i) => (
              <div
                key={i}
                className="relative w-[280px] sm:w-80 h-full group flex-shrink-0"
              >
                <img
                  src={u}
                  alt={`Question image ${i + 1}`}
                  className="w-full h-full object-cover rounded"
                />
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-xs font-bold rounded">
                  {i + 1}
                </div>
                <button
                  onClick={() => setFullscreenImage(u)}
                  className="absolute top-1 right-1 p-1.5 sm:p-1 bg-black/50 rounded text-white hover:bg-black/70 active:bg-black/80 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
                  aria-label="Fullscreen image"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (imgs.length === 4) {
      if (layout === "carousel") {
        return (
          <div
            className={`relative w-full mb-4 rounded-lg overflow-hidden bg-muted border border-border p-1 sm:p-2 ${getImageHeightClass()}`}
          >
            <div className="flex gap-2 sm:gap-4 h-full overflow-x-auto scrollbar-hide">
              {imgs.map((u, i) => (
                <div
                  key={i}
                  className="relative w-[280px] sm:w-80 h-full group flex-shrink-0"
                >
                  <img
                    src={u}
                    alt={`Question image ${i + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-xs font-bold rounded">
                    {i + 1}
                  </div>
                  <button
                    onClick={() => setFullscreenImage(u)}
                    className="absolute top-1 right-1 p-1.5 sm:p-1 bg-black/50 rounded text-white hover:bg-black/70 active:bg-black/80 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
                    aria-label="Fullscreen image"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      } else {
        // grid (2x2)
        return (
          <div
            className={`relative w-full mb-4 rounded-lg overflow-hidden bg-muted border border-border p-1 sm:p-2 ${getImageHeightClass()}`}
          >
            <div className="grid grid-cols-2 gap-1 sm:gap-2 h-full">
              {imgs.map((u, i) => (
                <div key={i} className="relative w-full h-full group">
                  <img
                    src={u}
                    alt={`Question image ${i + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-xs font-bold rounded">
                    {i + 1}
                  </div>
                  <button
                    onClick={() => setFullscreenImage(u)}
                    className="absolute top-1 right-1 p-1.5 sm:p-1 bg-black/50 rounded text-white hover:bg-black/70 active:bg-black/80 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
                    aria-label="Fullscreen image"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      }
    }

    // Fallback to grid for any other number of images
    return (
      <div
        className={`relative w-full mb-4 rounded-lg overflow-hidden bg-muted border border-border p-1 sm:p-2 ${getImageHeightClass()}`}
      >
        <div className="grid grid-cols-2 gap-1 sm:gap-2 h-full">
          {imgs.map((u, i) => (
            <div key={i} className="relative w-full h-full group">
              <img
                src={u}
                alt={`Question image ${i + 1}`}
                className="w-full h-full object-cover rounded"
              />
              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-xs font-bold rounded">
                {i + 1}
              </div>
              <button
                onClick={() => setFullscreenImage(u)}
                className="absolute top-1 right-1 p-1.5 sm:p-1 bg-black/50 rounded text-white hover:bg-black/70 active:bg-black/80 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
                aria-label="Fullscreen image"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Check if this question has already been answered and reset timer
  useEffect(() => {
    const existingAnswer = answers.find(
      (a) => a.questionId === currentQuestion.id
    );
    if (existingAnswer) {
      setSelectedAlternativeId(existingAnswer.selectedAlternativeId);
      setHasAnswered(true);
    } else {
      setSelectedAlternativeId(null);
      setHasAnswered(false);
      // Reset timer for new question
      questionStartTime.current = Date.now();
    }
  }, [currentQuestionIndex, answers, currentQuestion.id]);

  // Update image size when question changes
  useEffect(() => {
    setImageSize(
      (currentQuestion.image_display_size as
        | "aspect-ratio"
        | "large"
        | "medium"
        | "small") || "aspect-ratio"
    );
  }, [currentQuestion.image_display_size]);

  const handleAlternativeSelect = (alternativeId: string) => {
    // For exams:
    // - First attempt (hasCompletedExam = false): always allowed, no grant needed
    // - Retake (hasCompletedExam = true): only allowed if admin granted retake access
    // - While loading (hasRetakeAccess = null): allow if first attempt, block if retake
    if (moduleType === "exam" && hasCompletedExam) {
      // User has completed exam before - need explicit retake access
      if (hasRetakeAccess !== true) {
        return;
      }
    }
    // Can only select if not yet answered
    if (hasAnswered) return;

    setSelectedAlternativeId(alternativeId);

    // Find the selected alternative to check if it's correct
    const selectedAlternative = currentQuestion.alternatives.find(
      (a) => a.id === alternativeId
    );
    if (!selectedAlternative) return;

    // Calculate time spent on this question
    const timeSpent = Math.floor(
      (Date.now() - questionStartTime.current) / 1000
    );

    // Mark as answered and save the answer
    setHasAnswered(true);

    const newAnswer: AnswerRecord = {
      questionId: currentQuestion.id,
      selectedAlternativeId: alternativeId,
      isCorrect: selectedAlternative.is_correct,
      timeSpentSeconds: timeSpent,
    };

    setAnswers((prev) => [...prev, newAnswer]);
  };

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Last question - save results to database
      setIsSaving(true);

      // The current question's answer should already be in the answers array
      // Calculate correct answers from all answers
      const correctAnswers = answers.filter((a) => a.isCorrect).length;
      const totalQuestions = questions.length;
      const scorePercentage = (correctAnswers / totalQuestions) * 100;

      // Prepare answers for database
      const answerSubmissions: AnswerSubmission[] = answers.map((answer) => ({
        exerciseId: answer.questionId,
        selectedAlternativeId: answer.selectedAlternativeId,
        isCorrect: answer.isCorrect,
        timeSpentSeconds: answer.timeSpentSeconds,
      }));

      // Save to database
      const result = await saveExamResult(
        userId,
        userName,
        moduleId,
        scorePercentage,
        totalQuestions,
        correctAnswers,
        answerSubmissions
      );

      if (result.success) {
        console.log("Exam results saved successfully!", result);
        // Mark exam as completed - this prevents retaking without access
        setHasCompletedExam(true);
        // Reload retake stats after saving to get updated attempt count
        await reloadRetakeData();
      } else {
        console.error("Failed to save exam results:", result.error);
        // Still mark as completed even if save fails (they answered all questions)
        setHasCompletedExam(true);
      }

      setIsSaving(false);
      setShowResults(true);
    }
  };

  const getAlternativeStyle = (alternativeId: string, isCorrect: boolean) => {
    if (!hasAnswered) {
      return "border-border hover:border-primary cursor-pointer";
    }

    if (alternativeId === selectedAlternativeId) {
      if (isCorrect) {
        return "border-green-500 bg-green-50 dark:bg-green-950";
      } else {
        return "border-red-500 bg-red-50 dark:bg-red-950";
      }
    }

    // Show the correct answer if user selected wrong
    if (
      isCorrect &&
      !currentQuestion.alternatives.find((a) => a.id === selectedAlternativeId)
        ?.is_correct
    ) {
      return "border-green-500 bg-green-50 dark:bg-green-950";
    }

    return "border-border opacity-50";
  };

  const getAlternativeIcon = (alternativeId: string, isCorrect: boolean) => {
    if (!hasAnswered) return null;

    if (alternativeId === selectedAlternativeId) {
      if (isCorrect) {
        return <Check className="h-5 w-5 text-green-600" />;
      } else {
        return <X className="h-5 w-5 text-red-600" />;
      }
    }

    // Show the correct answer if user selected wrong
    if (
      isCorrect &&
      !currentQuestion.alternatives.find((a) => a.id === selectedAlternativeId)
        ?.is_correct
    ) {
      return <Check className="h-5 w-5 text-green-600" />;
    }

    return null;
  };

  // Preview helpers for review mode (read-only view)
  const getPreviewStyle = (
    alternativeId: string,
    isCorrect: boolean,
    selectedId: string | null
  ) => {
    if (!selectedId) return "border-border opacity-50";
    if (alternativeId === selectedId) {
      return isCorrect
        ? "border-green-500 bg-green-50 dark:bg-green-950"
        : "border-red-500 bg-red-50 dark:bg-red-950";
    }
    if (
      isCorrect &&
      !currentQuestion.alternatives.find((a) => a.id === selectedId)?.is_correct
    ) {
      return "border-green-500 bg-green-50 dark:bg-green-950";
    }
    return "border-border opacity-50";
  };

  const getPreviewIcon = (
    alternativeId: string,
    isCorrect: boolean,
    selectedId: string | null
  ) => {
    if (!selectedId) return null;
    if (alternativeId === selectedId) {
      return isCorrect ? (
        <Check className="h-5 w-5 text-green-600" />
      ) : (
        <X className="h-5 w-5 text-red-600" />
      );
    }
    if (
      isCorrect &&
      !currentQuestion.alternatives.find((a) => a.id === selectedId)?.is_correct
    ) {
      return <Check className="h-5 w-5 text-green-600" />;
    }
    return null;
  };

  // Completed summary view only when finishing an attempt
  if (showResults) {
    const correctAnswers = answers.filter((a) => a.isCorrect).length;
    const totalQuestions = questions.length;
    const scorePercentage = (correctAnswers / totalQuestions) * 100;

    return (
      <div className="max-w-2xl mx-auto px-2 sm:px-4">
        <Card className="border-gray-200/10">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl text-center">
              {moduleType === "module" ? "Quiz Results" : "Exam Results"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4">
                {scorePercentage.toFixed(0)}%
              </div>
              <p className="text-base sm:text-lg text-muted-foreground">
                You got {correctAnswers} out of {totalQuestions} questions
                correct
              </p>

              {/* Retake Statistics */}
              {!isLoadingStats &&
                retakeStats &&
                retakeStats.totalAttempts > 0 && (
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                      Your Quiz History
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-primary">
                          {retakeStats.totalAttempts}
                        </div>
                        <div className="text-muted-foreground">
                          Total Attempts
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-green-600">
                          {retakeStats.bestScore}%
                        </div>
                        <div className="text-muted-foreground">Best Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">
                          {retakeStats.latestScore}%
                        </div>
                        <div className="text-muted-foreground">
                          Latest Score
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-purple-600">
                          {retakeStats.averageScore}%
                        </div>
                        <div className="text-muted-foreground">
                          Average Score
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-base sm:text-lg">
                Question Breakdown
              </h3>
              {questions.map((question, index) => {
                const answer = answers.find(
                  (a) => a.questionId === question.id
                );
                return (
                  <div
                    key={question.id}
                    className="flex items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border"
                  >
                    <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                      {answer?.isCorrect ? (
                        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base">
                        Question {index + 1}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground break-words">
                        {question.question}
                      </p>
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                      {question.weight} {question.weight === 1 ? "pt" : "pts"}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 p-4 sm:p-6 pt-0">
            <Button
              onClick={() => router.push(`/dashboard/${companyId}`)}
              className="w-full sm:w-auto min-w-[140px] min-h-[44px]"
            >
              Back to Dashboard
            </Button>
            {/* Only show "Back to Quiz/Exam" if it's a module OR if exam with retake access */}
            {viewResults &&
              (moduleType === "module" || hasRetakeAccess === true) && (
                <Button
                  variant="outline"
                  onClick={() => setViewResults(false)}
                  className="w-full sm:w-auto min-w-[140px] min-h-[44px]"
                >
                  Back to {moduleType === "module" ? "Quiz" : "Exam"}
                </Button>
              )}
            {/* Modules always allow retake */}
            {moduleType === "module" && (
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentQuestionIndex(0);
                  setAnswers([]);
                  setSelectedAlternativeId(null);
                  setHasAnswered(false);
                  setShowResults(false);
                  setViewResults(false);
                }}
                className="w-full sm:w-auto min-w-[140px] min-h-[44px]"
              >
                Retake Quiz
              </Button>
            )}
            {/* Exams ONLY show retake button if explicitly granted access */}
            {moduleType === "exam" && hasRetakeAccess === true && (
              <Button
                variant="outline"
                onClick={() => {
                  // Reset exam state to start retake (keep hasCompletedExam true)
                  // The retake access grant will be consumed when results are saved
                  setCurrentQuestionIndex(0);
                  setAnswers([]);
                  setSelectedAlternativeId(null);
                  setHasAnswered(false);
                  setShowResults(false);
                  setViewResults(false);
                }}
                className="w-full sm:w-auto min-w-[140px] min-h-[44px]"
              >
                Retake Exam
              </Button>
            )}
            {moduleType === "exam" && hasRetakeAccess === false && (
              <div className="text-center text-xs sm:text-sm text-muted-foreground w-full">
                This exam cannot be retaken unless granted access by an
                administrator.
              </div>
            )}
            {moduleType === "exam" && hasRetakeAccess === null && (
              <div className="text-center text-xs sm:text-sm text-muted-foreground w-full">
                Checking retake access...
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Read-only review mode: user navigates questions, cannot answer; shows correct/selected
  if (viewResults) {
    const reviewAnswer =
      answers.find((a) => a.questionId === currentQuestion.id) || null;
    const selectedId = reviewAnswer ? reviewAnswer.selectedAlternativeId : null;
    return (
      <div className="max-w-2xl mx-auto px-2 sm:px-4">
        <Card className="mb-4 sm:mb-6 border-border">
          <CardHeader className="p-4 sm:p-6">
            {/* Video if available */}
            {currentQuestion.video_url && (
              <div className="relative w-full mb-4 rounded-lg overflow-hidden border border-border bg-black group">
                {/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(
                  currentQuestion.video_url
                ) ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${(() => {
                      const m = currentQuestion.video_url!.match(
                        /(?:v=|youtu\.be\/)([^&\/?#]+)/
                      );
                      return m ? m[1] : "";
                    })()}`}
                    className="w-full aspect-video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : /^https?:\/\/(www\.)?vimeo\.com\//.test(
                    currentQuestion.video_url
                  ) ? (
                  <iframe
                    src={currentQuestion.video_url.replace(
                      "vimeo.com",
                      "player.vimeo.com/video"
                    )}
                    className="w-full aspect-video"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video controls className="w-full aspect-video">
                    <source src={currentQuestion.video_url} />
                  </video>
                )}
                <button
                  onClick={() => setFullscreenVideo(currentQuestion.video_url!)}
                  className="absolute top-2 right-2 p-2 sm:p-2.5 bg-black/50 rounded-lg text-white hover:bg-black/70 active:bg-black/80 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
                  aria-label="Fullscreen video"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            )}
            {(() => {
              const imgs: string[] =
                (currentQuestion as any).image_urls &&
                (currentQuestion as any).image_urls.length > 0
                  ? (currentQuestion as any).image_urls.slice(0, 4)
                  : currentQuestion.image_url
                  ? [currentQuestion.image_url]
                  : [];
              return renderImages(imgs);
            })()}
            <CardTitle className="text-lg sm:text-xl lg:text-2xl">
              {currentQuestion.question}
            </CardTitle>
            {currentQuestion.weight > 1 && (
              <p className="text-xs sm:text-sm text-muted-foreground">
                {currentQuestion.weight} points
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0">
            {currentQuestion.alternatives.map((alternative) => (
              <div
                key={alternative.id}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${getPreviewStyle(
                  alternative.id,
                  alternative.is_correct,
                  selectedId
                )}`}
              >
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="flex-1 min-w-0">
                    {(() => {
                      const imgs: string[] =
                        (alternative as any).image_urls &&
                        (alternative as any).image_urls.length > 0
                          ? (alternative as any).image_urls.slice(0, 4)
                          : (alternative as any).image_url
                          ? [(alternative as any).image_url]
                          : [];
                      if (imgs.length === 0) return null;
                      if (imgs.length === 1) {
                        return (
                          <div className="mb-2 relative w-full pt-[56%] bg-muted rounded border overflow-hidden group">
                            <img
                              src={imgs[0]}
                              alt="Option image"
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFullscreenImage(imgs[0]);
                              }}
                              className="absolute top-1 right-1 p-1.5 sm:p-1 bg-black/50 rounded text-white hover:bg-black/70 active:bg-black/80 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
                              aria-label="Fullscreen image"
                            >
                              <Maximize2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      }
                      return (
                        <div className="mb-2 grid grid-cols-2 gap-2">
                          {imgs.map((u, i) => (
                            <div
                              key={i}
                              className="relative w-full pt-[100%] bg-muted rounded border overflow-hidden group"
                            >
                              <img
                                src={u}
                                alt={`Option image ${i + 1}`}
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFullscreenImage(u);
                                }}
                                className="absolute top-1 right-1 p-1 bg-black/50 rounded text-white hover:bg-black/70 active:bg-black/80 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
                                aria-label="Fullscreen image"
                              >
                                <Maximize2 className="w-2.5 h-2.5 sm:w-2 sm:h-2" />
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                    <p className="font-medium text-sm sm:text-base">
                      {alternative.content}
                    </p>
                    {alternative.explanation &&
                      (alternative.id === selectedId ||
                        alternative.is_correct) && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                          {alternative.explanation}
                        </p>
                      )}
                  </div>
                  <div className="flex-shrink-0">
                    {getPreviewIcon(
                      alternative.id,
                      alternative.is_correct,
                      selectedId
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-end p-4 sm:p-6 pt-0">
            <Button
              onClick={() => {
                if (currentQuestionIndex < questions.length - 1) {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                } else {
                  setCurrentQuestionIndex(0);
                }
              }}
              className="gap-2 w-full sm:w-auto min-h-[44px]"
            >
              {currentQuestionIndex < questions.length - 1 ? (
                <>
                  Next Question <ChevronRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Start Over <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Navigation Dots */}
        <div className="flex justify-center gap-1.5 sm:gap-2 flex-wrap px-2">
          {questions.map((_, index) => {
            const isCurrent = index === currentQuestionIndex;
            const hasAttempt = answers.some(
              (a) => a.questionId === questions[index].id
            );
            return (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`h-2 rounded-full transition-all touch-manipulation ${
                  isCurrent
                    ? "w-8 bg-primary"
                    : hasAttempt
                    ? "w-2 bg-green-500"
                    : "w-2 bg-secondary"
                }`}
                aria-label={`Go to question ${index + 1}`}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // Show loading state while determining exam access for exams
  // This prevents race conditions where users could interact before access is determined
  if (moduleType === "exam" && isLoadingStats) {
    return (
      <div className="max-w-2xl mx-auto px-2 sm:px-4">
        <Card>
          <CardContent className="p-6 sm:p-12 text-center">
            <p className="text-base sm:text-lg text-muted-foreground">
              Loading exam...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-2 sm:px-4">
        <Card>
          <CardContent className="p-6 sm:p-12 text-center">
            <p className="text-base sm:text-lg text-muted-foreground">
              This module doesn't have any questions yet.
            </p>
            <Button
              className="mt-4 min-w-[140px] min-h-[44px]"
              onClick={() => router.push(`/dashboard/${companyId}`)}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4">
      {/* Progress Bar */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
          <span className="text-xs sm:text-sm font-medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
            {answers.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewResults(true)}
                className="min-w-[100px] sm:min-w-[120px] text-xs sm:text-sm"
              >
                View Results
              </Button>
            )}
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="mb-4 sm:mb-6 border-border">
        <CardHeader className="p-4 sm:p-6">
          {/* Video if available */}
          {currentQuestion.video_url && (
            <div className="relative w-full mb-4 rounded-lg overflow-hidden border border-border bg-black group">
              {/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(
                currentQuestion.video_url
              ) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${(() => {
                    const m = currentQuestion.video_url!.match(
                      /(?:v=|youtu\.be\/)([^&/?#]+)/
                    );
                    return m ? m[1] : "";
                  })()}`}
                  className="w-full aspect-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : /^https?:\/\/(www\.)?vimeo\.com\//.test(
                  currentQuestion.video_url
                ) ? (
                <iframe
                  src={currentQuestion.video_url.replace(
                    "vimeo.com",
                    "player.vimeo.com/video"
                  )}
                  className="w-full aspect-video"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video controls className="w-full aspect-video">
                  <source src={currentQuestion.video_url} />
                </video>
              )}
              <button
                onClick={() => setFullscreenVideo(currentQuestion.video_url!)}
                className="absolute top-2 right-2 p-2 sm:p-2.5 bg-black/50 rounded-lg text-white hover:bg-black/70 active:bg-black/80 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
                aria-label="Fullscreen video"
              >
                <Maximize2 className="w-4 h-4 sm:w-4 sm:h-4" />
              </button>
            </div>
          )}
          {(() => {
            const imgs: string[] =
              (currentQuestion as any).image_urls &&
              (currentQuestion as any).image_urls.length > 0
                ? (currentQuestion as any).image_urls.slice(0, 4)
                : currentQuestion.image_url
                ? [currentQuestion.image_url]
                : [];
            return renderImages(imgs);
          })()}

          <CardTitle className="text-lg sm:text-xl lg:text-2xl">
            {currentQuestion.question}
          </CardTitle>
          {currentQuestion.weight > 1 && (
            <p className="text-xs sm:text-sm text-muted-foreground">
              {currentQuestion.weight} points
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0">
          {currentQuestion.alternatives.map((alternative) => (
            <div
              key={alternative.id}
              onClick={() => handleAlternativeSelect(alternative.id)}
              className={`p-3 sm:p-4 rounded-lg border-2 transition-all cursor-pointer touch-manipulation min-h-[44px] ${getAlternativeStyle(
                alternative.id,
                alternative.is_correct
              )} ${!hasAnswered ? "hover:shadow-md active:scale-[0.98]" : ""}`}
            >
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  {(() => {
                    const imgs: string[] =
                      (alternative as any).image_urls &&
                      (alternative as any).image_urls.length > 0
                        ? (alternative as any).image_urls.slice(0, 4)
                        : (alternative as any).image_url
                        ? [(alternative as any).image_url]
                        : [];
                    if (imgs.length === 0) return null;
                    if (imgs.length === 1) {
                      return (
                        <div
                          className="mb-2 relative w-full pt-[56%] bg-muted rounded border overflow-hidden group"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAlternativeSelect(alternative.id);
                          }}
                        >
                          <img
                            src={imgs[0]}
                            alt="Option image"
                            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFullscreenImage(imgs[0]);
                            }}
                            className="absolute top-1 right-1 p-1.5 sm:p-1 bg-black/50 rounded text-white hover:bg-black/70 active:bg-black/80 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
                            aria-label="Fullscreen image"
                          >
                            <Maximize2 className="w-3 h-3 sm:w-3 sm:h-3" />
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div className="mb-2 grid grid-cols-2 gap-2">
                        {imgs.map((u, i) => (
                          <div
                            key={i}
                            className="relative w-full pt-[100%] bg-muted rounded border overflow-hidden group"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAlternativeSelect(alternative.id);
                            }}
                          >
                            <img
                              src={u}
                              alt={`Option image ${i + 1}`}
                              className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFullscreenImage(u);
                              }}
                              className="absolute top-1 right-1 p-1 bg-black/50 rounded text-white hover:bg-black/70 active:bg-black/80 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
                              aria-label="Fullscreen image"
                            >
                              <Maximize2 className="w-2.5 h-2.5 sm:w-2 sm:h-2" />
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  <p className="font-medium text-sm sm:text-base">
                    {alternative.content}
                  </p>
                  {hasAnswered &&
                    alternative.explanation &&
                    (alternative.id === selectedAlternativeId ||
                      alternative.is_correct) && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-2">
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
        <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-0 p-4 sm:p-6 pt-0">
          <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
            {hasAnswered ? (
              selectedAlternativeId &&
              currentQuestion.alternatives.find(
                (a) => a.id === selectedAlternativeId
              )?.is_correct ? (
                <span className="text-green-600 font-medium">
                  Correct! Great job!
                </span>
              ) : (
                <span className="text-red-600 font-medium">
                  Incorrect. Review the correct answer above.
                </span>
              )
            ) : (
              <span>Select an answer to continue</span>
            )}
          </div>
          <Button
            onClick={handleNext}
            disabled={!hasAnswered || isSaving}
            className="gap-2 w-full sm:w-auto min-h-[44px] order-1 sm:order-2"
          >
            {isSaving ? (
              "Saving Results..."
            ) : currentQuestionIndex < questions.length - 1 ? (
              <>
                Next Question <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              <>
                View Results <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Question Navigation Dots */}
      <div className="flex justify-center gap-1.5 sm:gap-2 flex-wrap px-2">
        {questions.map((_, index) => {
          const isAnswered = answers.some(
            (a) => a.questionId === questions[index].id
          );
          const isCurrent = index === currentQuestionIndex;

          return (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`h-2 rounded-full transition-all touch-manipulation ${
                isCurrent
                  ? "w-8 bg-primary"
                  : isAnswered
                  ? "w-2 bg-green-500"
                  : "w-2 bg-secondary"
              }`}
              aria-label={`Go to question ${index + 1}`}
            />
          );
        })}
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 sm:p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-3 sm:p-2 bg-black/70 rounded-lg text-white hover:bg-black/80 active:bg-black/90 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
              aria-label="Close fullscreen"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
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

      {/* Fullscreen Video Modal */}
      {fullscreenVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 sm:p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              onClick={() => setFullscreenVideo(null)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-3 sm:p-2 bg-black/70 rounded-lg text-white hover:bg-black/80 active:bg-black/90 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
              aria-label="Close fullscreen"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <div className="w-full h-full flex items-center justify-center px-2">
              {/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(
                fullscreenVideo
              ) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${(() => {
                    const m = fullscreenVideo.match(
                      /(?:v=|youtu\.be\/)([^&/?#]+)/
                    );
                    return m ? m[1] : "";
                  })()}`}
                  className="aspect-video w-full max-w-full max-h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : /^https?:\/\/(www\.)?vimeo\.com\//.test(fullscreenVideo) ? (
                <iframe
                  src={fullscreenVideo.replace(
                    "vimeo.com",
                    "player.vimeo.com/video"
                  )}
                  className="aspect-video w-full max-w-full max-h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  controls
                  className="max-w-full max-h-full object-contain w-full"
                >
                  <source src={fullscreenVideo} />
                </video>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
