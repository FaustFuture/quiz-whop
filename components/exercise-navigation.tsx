"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
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
	const searchParams = useSearchParams()

	// If a new exercise was just created, jump to it once on mount
	useEffect(() => {
		const newExerciseId = searchParams.get("exerciseId")
		if (!newExerciseId) return
		const idx = exercises.findIndex((e) => e.id === newExerciseId)
		if (idx !== -1) {
			setCurrentIndex(idx)
		}
		// only run on first render with current exercises list
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [exercises])

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

	// Broadcast whether the current exercise allows adding a new one
	useEffect(() => {
		const current = exercises[currentIndex]
		if (!current) return
		const hasTitle = !!current.question?.trim()
		const hasAnyOption = alternatives.length > 0
		const canAdd = hasTitle && hasAnyOption
		window.dispatchEvent(new CustomEvent("quizwhop:exercise-can-add", { detail: { canAdd } }))
	}, [exercises, currentIndex, alternatives])

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
		<div className="space-y-3 sm:space-y-4">
			{/* Navigation Info */}
			<div className="text-center text-xs sm:text-sm text-muted-foreground px-2">
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

			{/* Mobile Navigation Buttons */}
			<div className="flex items-center justify-between gap-2 sm:hidden px-2">
				<Button
					variant="outline"
					onClick={handlePrevious}
					disabled={!hasPrevious}
					className="flex-1 border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-accent hover:border-emerald-500 min-h-[44px]"
				>
					<ChevronLeft className="h-4 w-4 mr-1" />
					Previous
				</Button>
				<Button
					variant="outline"
					onClick={handleNext}
					disabled={!hasNext}
					className="flex-1 border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-accent hover:border-emerald-500 min-h-[44px]"
				>
					Next
					<ChevronRight className="h-4 w-4 ml-1" />
				</Button>
			</div>
		</div>
	)
}
