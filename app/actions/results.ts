"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export type Result = {
  id: string
  user_id: string
  module_id: string
  score: number
  total_questions: number
  correct_answers: number
  submitted_at: string
  created_at: string
}

export type ExamAnswer = {
  id: string
  result_id: string
  exercise_id: string
  selected_alternative_id: string
  is_correct: boolean
  time_spent_seconds: number
  created_at: string
}

export type AnswerSubmission = {
  exerciseId: string
  selectedAlternativeId: string
  isCorrect: boolean
  timeSpentSeconds?: number
}

export async function saveExamResult(
  userId: string,
  moduleId: string,
  score: number,
  totalQuestions: number,
  correctAnswers: number,
  answers: AnswerSubmission[]
) {
  try {
    // First, delete any existing results for this user and module
    // This ensures only the latest attempt is kept (overwrite behavior)
    const { data: existingResults } = await supabase
      .from("results")
      .select("id")
      .eq("user_id", userId)
      .eq("module_id", moduleId)

    if (existingResults && existingResults.length > 0) {
      // Delete exam_answers for existing results (will cascade delete via FK)
      const resultIds = existingResults.map(r => r.id)
      await supabase
        .from("exam_answers")
        .delete()
        .in("result_id", resultIds)
      
      // Delete old results
      await supabase
        .from("results")
        .delete()
        .eq("user_id", userId)
        .eq("module_id", moduleId)
    }

    // Create the new result record
    const { data: result, error: resultError } = await supabase
      .from("results")
      .insert({
        user_id: userId,
        module_id: moduleId,
        score,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
      })
      .select()
      .single()

    if (resultError) {
      console.error("Error creating result:", resultError)
      return { success: false, error: resultError.message }
    }

    // Then, create all the exam_answers records
    const examAnswersData = answers.map((answer) => ({
      result_id: result.id,
      exercise_id: answer.exerciseId,
      selected_alternative_id: answer.selectedAlternativeId,
      is_correct: answer.isCorrect,
      time_spent_seconds: answer.timeSpentSeconds || 0,
    }))

    const { error: answersError } = await supabase
      .from("exam_answers")
      .insert(examAnswersData)

    if (answersError) {
      console.error("Error creating exam answers:", answersError)
      // If answers fail, delete the result to maintain data integrity
      await supabase.from("results").delete().eq("id", result.id)
      return { success: false, error: answersError.message }
    }

    revalidatePath(`/dashboard/[companyId]`, "page")
    return { success: true, data: result }
  } catch (error) {
    console.error("Error saving exam result:", error)
    return { success: false, error: "Failed to save exam result" }
  }
}

export async function getResultsByUser(userId: string): Promise<Result[]> {
  try {
    const { data, error } = await supabase
      .from("results")
      .select("*")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })

    if (error) {
      console.error("Error fetching results:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching results:", error)
    return []
  }
}

export async function getResultsByUserAndModule(
  userId: string,
  moduleId: string
): Promise<Result | null> {
  try {
    const { data, error } = await supabase
      .from("results")
      .select("*")
      .eq("user_id", userId)
      .eq("module_id", moduleId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // If no results found, return null (not an error)
      if (error.code === 'PGRST116') {
        return null
      }
      console.error("Error fetching result:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error fetching result:", error)
    return null
  }
}

export async function getResultsByModule(moduleId: string): Promise<Result[]> {
  try {
    const { data, error } = await supabase
      .from("results")
      .select("*")
      .eq("module_id", moduleId)
      .order("submitted_at", { ascending: false })

    if (error) {
      console.error("Error fetching results:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching results:", error)
    return []
  }
}

export type ResultWithModule = Result & {
  module_title: string
}

export async function getRecentResults(
  companyId: string,
  limit: number = 10
): Promise<ResultWithModule[]> {
  try {
    const { data, error } = await supabase
      .from("results")
      .select(`
        *,
        modules!inner (
          title,
          company_id
        )
      `)
      .eq("modules.company_id", companyId)
      .order("submitted_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching recent results:", error)
      return []
    }

    // Transform the data to flatten the module information
    const results = data?.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      module_id: item.module_id,
      score: item.score,
      total_questions: item.total_questions,
      correct_answers: item.correct_answers,
      submitted_at: item.submitted_at,
      created_at: item.created_at,
      module_title: item.modules?.title || "Unknown Module",
    })) || []

    return results
  } catch (error) {
    console.error("Error fetching recent results:", error)
    return []
  }
}

export async function getExamAnswers(resultId: string): Promise<ExamAnswer[]> {
  try {
    const { data, error } = await supabase
      .from("exam_answers")
      .select("*")
      .eq("result_id", resultId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching exam answers:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching exam answers:", error)
    return []
  }
}

export async function getResultWithAnswers(resultId: string) {
  try {
    // First get the result
    const { data: result, error: resultError } = await supabase
      .from("results")
      .select("*")
      .eq("id", resultId)
      .single()

    if (resultError) {
      console.error("Error fetching result:", resultError)
      return { success: false, error: resultError.message }
    }

    // Then get exam_answers
    const { data: examAnswers, error: answersError } = await supabase
      .from("exam_answers")
      .select("*")
      .eq("result_id", resultId)
      .order("created_at", { ascending: true })

    if (answersError) {
      console.error("Error fetching exam answers:", answersError)
      return { success: false, error: answersError.message }
    }

    // Now fetch exercises and alternatives separately for each answer
    const answersWithDetails = await Promise.all(
      examAnswers.map(async (answer) => {
        const [exercise, alternative] = await Promise.all([
          supabase
            .from("exercises")
            .select("id, question, image_url, weight")
            .eq("id", answer.exercise_id)
            .single(),
          supabase
            .from("alternatives")
            .select("id, content, is_correct, explanation")
            .eq("id", answer.selected_alternative_id)
            .single(),
        ])

        return {
          ...answer,
          exercises: exercise.data,
          alternatives: alternative.data,
        }
      })
    )

    return {
      success: true,
      data: {
        result: result,
        answers: answersWithDetails,
      },
    }
  } catch (error) {
    console.error("Error fetching result with answers:", error)
    return { success: false, error: "Failed to fetch result details" }
  }
}

