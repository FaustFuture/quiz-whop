"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createExercise } from "@/app/actions/exercises"
import { useRouter } from "next/navigation"

interface AddExerciseDialogProps {
  moduleId: string
}

export function AddExerciseDialog({ moduleId }: AddExerciseDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleCreateExercise = async () => {
    setIsLoading(true)
    
    try {
      const result = await createExercise(moduleId, "", "", 1)
      
      if (result.success) {
        router.refresh()
      } else {
        console.error("Failed to create exercise:", result.error)
        alert("Failed to create exercise. Please try again.")
      }
    } catch (error) {
      console.error("Error creating exercise:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleCreateExercise}
      disabled={isLoading}
      className="gap-2 bg-emerald-600 hover:bg-emerald-700"
    >
      <Plus className="h-4 w-4" />
      {isLoading ? "Creating..." : "Add Exercise"}
    </Button>
  )
}
