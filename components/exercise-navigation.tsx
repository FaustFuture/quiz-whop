"use client"

import { useState, useEffect } from "react"
import { ExerciseCard } from "@/components/exercise-card"
import { type Exercise } from "@/app/actions/exercises"
import { type Alternative } from "@/app/actions/alternatives"
import { getAlternatives } from "@/app/actions/alternatives"

interface ExerciseNavigationProps {
  exercises: Exercise[]
  moduleId: string
}

export function ExerciseNavigation({ exercises, moduleId }: ExerciseNavigationProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [alternatives, setAlternatives] = useState<Alternative[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load alternatives for the current exercise
  useEffect(() => {
    const loadAlternatives = async () => {
      if (exercises.length > 0 && currentIndex < exercises.length) {
        setIsLoading(true)
        try {
          const currentExercise = exercises[currentIndex]
          const alts = await getAlternatives(currentExercise.id)
          setAlternatives(alts)
        } catch (error) {
          console.error("Error loading alternatives:", error)
          setAlternatives([])
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadAlternatives()
  }, [exercises, currentIndex])

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleExerciseDeleted = () => {
    console.log('Exercise deleted, current index:', currentIndex, 'total exercises:', exercises.length)
    
    // Handle different deletion scenarios:
    if (currentIndex >= exercises.length - 1) {
      // Deleting the last exercise - move to previous if available
      if (currentIndex > 0) {
        console.log('Moving to previous exercise')
        setCurrentIndex(currentIndex - 1)
      } else {
        console.log('Deleting only exercise, staying at index 0')
      }
    } else {
      // Deleting any other exercise (including first) - stay on same index
      // The next exercise will move up to fill the gap
      console.log('Deleting non-last exercise, staying at same index')
    }
    
    // Use a small delay before refresh to ensure state updates
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  if (exercises.length === 0) {
    return null
  }

  const currentExercise = exercises[currentIndex]
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < exercises.length - 1

  return (
    <div className="space-y-4">
      {/* Navigation Info */}
      <div className="text-center text-sm text-muted-foreground">
        Exercise {currentIndex + 1} of {exercises.length}
      </div>
      
      {/* Exercise Card */}
      <ExerciseCard 
        exercises={exercises}
        currentIndex={currentIndex}
        moduleId={moduleId}
        alternatives={alternatives}
        onNavigatePrevious={handlePrevious}
        onNavigateNext={handleNext}
        onExerciseDeleted={handleExerciseDeleted}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        isLoading={isLoading}
      />
    </div>
  )
}
