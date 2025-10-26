"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Edit, Trash2, MoreVertical, BookOpen, Check, X, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ImageUploadDialog } from "@/components/image-upload-dialog"
import { AddOptionDialog } from "@/components/add-option-dialog"
import { SortableOptionsList } from "@/components/sortable-options-list"
import { type Exercise } from "@/app/actions/exercises"
import { type Alternative } from "@/app/actions/alternatives"
import { deleteExercise, updateExercise } from "@/app/actions/exercises"
import { useRouter } from "next/navigation"

interface ExerciseCardProps {
  exercises: Exercise[]
  currentIndex: number
  moduleId: string
  alternatives: Alternative[]
  onNavigatePrevious?: () => void
  onNavigateNext?: () => void
  onExerciseDeleted?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
  isLoading?: boolean
}

export function ExerciseCard({ 
  exercises, 
  currentIndex, 
  moduleId, 
  alternatives,
  onNavigatePrevious,
  onNavigateNext,
  onExerciseDeleted,
  hasPrevious = false,
  hasNext = false,
  isLoading = false
}: ExerciseCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedQuestion, setEditedQuestion] = useState("")
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const router = useRouter()

  const currentExercise = exercises[currentIndex]

  const handleEditStart = () => {
    setEditedQuestion(currentExercise.question)
    setIsEditing(true)
  }

  const handleEditSave = async () => {
    if (!editedQuestion.trim()) {
      return
    }

    try {
      const result = await updateExercise(currentExercise.id, moduleId, {
        question: editedQuestion
      })
      
      if (result.success) {
        setIsEditing(false)
        router.refresh()
      } else {
        console.error("Failed to save question:", result.error)
        alert("Failed to save question. Please try again.")
      }
    } catch (error) {
      console.error("Error saving question:", error)
      alert("An error occurred while saving. Please try again.")
    }
  }

  const handleEditCancel = () => {
    setEditedQuestion("")
    setIsEditing(false)
  }

  const handleImageChange = async (imageUrl: string) => {
    try {
      const result = await updateExercise(currentExercise.id, moduleId, {
        image_url: imageUrl
      })
      
      if (result.success) {
        router.refresh()
      } else {
        console.error("Failed to update image:", result.error)
        alert("Failed to update image. Please try again.")
      }
    } catch (error) {
      console.error("Error updating image:", error)
      alert("An error occurred while updating the image. Please try again.")
    }
  }


  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this exercise? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    
    try {
      const result = await deleteExercise(currentExercise.id, moduleId)
      
      if (result.success) {
        // Call the callback to handle navigation logic
        if (onExerciseDeleted) {
          onExerciseDeleted()
        } else {
          // Fallback to refresh if no callback provided
          router.refresh()
        }
      } else {
        console.error("Failed to delete exercise:", result.error)
        alert("Failed to delete exercise. Please try again.")
      }
    } catch (error) {
      console.error("Error deleting exercise:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  if (!currentExercise) {
    return null
  }

  return (
    <div className="flex items-center gap-4">
      {/* Previous Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={onNavigatePrevious}
        disabled={!hasPrevious}
        className="shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Exercise Card */}
      <Card className="flex-1 min-h-[400px] w-[600px]">
        <CardHeader className="pb-3">
          {/* Clickable Image - Full Width */}
          <div 
            className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group relative mb-4"
            onClick={() => setImageDialogOpen(true)}
          >
            {currentExercise.image_url ? (
              <img
                src={currentExercise.image_url}
                alt="Exercise image"
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            <div className={`${currentExercise.image_url ? 'hidden' : ''} flex items-center justify-center`}>
              <Camera className="w-12 h-12 text-gray-400" />
            </div>
            {/* Camera overlay on hover */}
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <CardTitle className="text-lg">Exercise {currentIndex + 1}</CardTitle>
                <span className="text-sm text-muted-foreground">
                  ({currentExercise.weight} point{currentExercise.weight !== 1 ? 's' : ''})
                </span>
              </div>
              
              {/* Editable Question */}
              <div className="space-y-2">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editedQuestion}
                      onChange={(e) => setEditedQuestion(e.target.value)}
                      className="text-base"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleEditSave}
                        className="h-8 px-3"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEditCancel}
                        className="h-8 px-3"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <CardDescription 
                    className="text-base cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                    onClick={handleEditStart}
                  >
                    {currentExercise.question}
                  </CardDescription>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={isDeleting}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEditStart}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Question
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
            <CardContent className="flex flex-col h-full">
              {/* Options Section */}
              <div className="flex-1 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">Options ({alternatives.length})</h4>
                  <AddOptionDialog exerciseId={currentExercise.id} />
                </div>
                <SortableOptionsList 
                  alternatives={alternatives} 
                  exerciseId={currentExercise.id} 
                />
              </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-auto">
            <span>Created {new Date(currentExercise.created_at).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Next Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={onNavigateNext}
        disabled={!hasNext}
        className="shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Image Upload Dialog */}
      <ImageUploadDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        currentImageUrl={currentExercise.image_url || ""}
        onImageChange={handleImageChange}
      />
    </div>
  )
}
