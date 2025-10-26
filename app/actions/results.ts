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
    // First, create the result record
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

    revalidatePath(`/dashboard/[companyId]/modules/[moduleId]`, "page")
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
    const [result, answers] = await Promise.all([
      supabase.from("results").select("*").eq("id", resultId).single(),
      supabase
        .from("exam_answers")
        .select(`
          *,
          exercises:exercise_id (
            id,
            question,
            image_url,
            weight
          ),
          alternatives:selected_alternative_id (
            id,
            content,
            is_correct,
            explanation
          )
        `)
        .eq("result_id", resultId)
        .order("created_at", { ascending: true }),
    ])

    if (result.error) {
      console.error("Error fetching result:", result.error)
      return { success: false, error: result.error.message }
    }

    if (answers.error) {
      console.error("Error fetching answers:", answers.error)
      return { success: false, error: answers.error.message }
    }

    return {
      success: true,
      data: {
        result: result.data,
        answers: answers.data,
      },
    }
  } catch (error) {
    console.error("Error fetching result with answers:", error)
    return { success: false, error: "Failed to fetch result details" }
  }
}

