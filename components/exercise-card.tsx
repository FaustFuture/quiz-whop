"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Edit, Trash2, MoreVertical, BookOpen, Check, X, Camera } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { AddOptionDialog } from "@/components/add-option-dialog"
import { SortableOptionsList } from "@/components/sortable-options-list"
import { type Exercise } from "@/app/actions/exercises"
import { type Alternative } from "@/app/actions/alternatives"
import { deleteExercise, updateExercise, updateExerciseImageDisplaySize } from "@/app/actions/exercises"
import { uploadImageToStorage } from "@/app/actions/storage"
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
  const currentExercise = exercises[currentIndex]
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedQuestion, setEditedQuestion] = useState("")
  const [imageSize, setImageSize] = useState<"aspect-ratio" | "large" | "medium" | "small">(currentExercise.image_display_size as "aspect-ratio" | "large" | "medium" | "small" || "aspect-ratio")
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Update image size when exercise changes
  useEffect(() => {
    setImageSize(currentExercise.image_display_size as "aspect-ratio" | "large" | "medium" | "small" || "aspect-ratio")
  }, [currentExercise.image_display_size, currentIndex])

	// Reset edit state when navigating to a different exercise
	useEffect(() => {
		setIsEditing(false)
		setEditedQuestion("")
	}, [currentIndex, currentExercise.id])

  const getImageHeightClass = () => {
    switch (imageSize) {
      case "large":
        return "h-[50vh]"
      case "medium":
        return "h-[35vh]"
      case "small":
        return "h-[25vh]"
      case "aspect-ratio":
      default:
        return "h-auto"
    }
  }

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB.')
      return
    }

    setIsUploading(true)
    
    try {
      const result = await uploadImageToStorage(file)
      
      if (result.success && result.url) {
        await handleImageChange(result.url)
      } else {
        console.error("Failed to upload image:", result.error)
        alert("Failed to upload image. Please try again.")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("An error occurred while uploading the image. Please try again.")
    } finally {
      setIsUploading(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleImageClick = () => {
    if (isUploading) return
    fileInputRef.current?.click()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (isUploading) return

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))

    if (imageFile) {
      // Create a synthetic event to reuse the existing upload handler
      const syntheticEvent = {
        target: { files: [imageFile] }
      } as unknown as React.ChangeEvent<HTMLInputElement>
      
      handleFileUpload(syntheticEvent)
    } else {
      alert('Please drop an image file.')
    }
  }

  const handleImageSizeChange = async (newSize: "aspect-ratio" | "large" | "medium" | "small") => {
    setImageSize(newSize)
    
    try {
      const result = await updateExerciseImageDisplaySize(currentExercise.id, moduleId, newSize)
      
      if (!result.success) {
        console.error("Failed to update image display size:", result.error)
        // Revert the state if the update failed
        setImageSize(currentExercise.image_display_size as "aspect-ratio" | "large" | "medium" | "small" || "aspect-ratio")
        alert("Failed to save image size setting. Please try again.")
      }
    } catch (error) {
      console.error("Error updating image display size:", error)
      // Revert the state if the update failed
      setImageSize(currentExercise.image_display_size as "aspect-ratio" | "large" | "medium" | "small" || "aspect-ratio")
      alert("An error occurred while saving the image size setting. Please try again.")
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
        className="shrink-0 border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-accent hover:border-emerald-500"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Exercise Card */}
      <Card className="flex-1 min-h-[400px] w-[600px] border-border bg-card">
        <CardHeader className="pb-3">
          {/* Clickable Image - Full Width with Adjusted Height */}
          <div 
            className={`w-full bg-muted border border-border rounded-lg flex items-center justify-center cursor-pointer hover:bg-accent group relative mb-4 overflow-hidden ${
              isDragOver ? 'border-emerald-500 bg-emerald-500/10' : ''
            }`}
            onClick={handleImageClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
             {currentExercise.image_url ? (
               <img
                 src={currentExercise.image_url}
                 alt="Exercise image"
                 className={`w-full ${getImageHeightClass()} object-cover rounded-lg`}
                 onError={(e) => {
                   e.currentTarget.style.display = 'none'
                   e.currentTarget.nextElementSibling?.classList.remove('hidden')
                 }}
               />
             ) : (
               <div className="w-full h-40 flex items-center justify-center">
                 {isUploading ? (
                   <div className="flex flex-col items-center gap-2">
                     <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                     <span className="text-sm text-gray-400">Uploading...</span>
                   </div>
                 ) : isDragOver ? (
                   <div className="flex flex-col items-center gap-2">
                     <Camera className="w-12 h-12 text-emerald-500" />
                     <span className="text-sm text-emerald-500 font-medium">Drop image here</span>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center gap-2">
                     <Camera className="w-12 h-12 text-gray-600" />
                     <span className="text-sm text-gray-400">Click or drag image here</span>
                   </div>
                 )}
               </div>
             )}
            {/* Camera overlay on hover */}
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Image Size Selector */}
          {currentExercise.image_url && (
            <div className="mb-8">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Image Size:</label>
                <Select value={imageSize} onValueChange={handleImageSizeChange}>
                  <SelectTrigger className="w-40 bg-muted border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border">
                    <SelectItem value="aspect-ratio" className="text-foreground focus:bg-accent">
                      Original Size
                    </SelectItem>
                    <SelectItem value="large" className="text-foreground focus:bg-accent">
                      Large
                    </SelectItem>
                    <SelectItem value="medium" className="text-foreground focus:bg-accent">
                      Medium
                    </SelectItem>
                    <SelectItem value="small" className="text-foreground focus:bg-accent">
                      Small
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              
              {/* Editable Question */}
              <div className="space-y-2">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editedQuestion}
                      onChange={(e) => setEditedQuestion(e.target.value)}
                      placeholder="Enter the question for this exercise..."
                      className="text-base bg-background border border-border focus-visible:border-emerald-500 text-foreground placeholder:text-muted-foreground"
                      autoFocus
                    />
                    {!editedQuestion.trim() && (
                      <p className="text-xs text-red-400">Question title is required.</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleEditSave}
                        disabled={!editedQuestion.trim()}
                        className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEditCancel}
                        className="h-8 px-3 bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <CardDescription 
                    className="text-base cursor-pointer p-2 rounded text-muted-foreground border border-border bg-muted hover:bg-accent hover:border-emerald-500/50"
                    onClick={handleEditStart}
                  >
                    {currentExercise.question || "Add a question for this exercise..."}
                  </CardDescription>
                )}
              </div>
              {!isEditing && !currentExercise.question?.trim() && (
                <p className="text-xs text-red-400 mt-1">Question title is required.</p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                  disabled={isDeleting}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-muted border-border">
                <DropdownMenuItem onClick={handleEditStart} className="text-muted-foreground focus:bg-accent focus:text-foreground">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Question
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
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
                  <h4 className="text-sm font-medium text-foreground">Options ({alternatives.length})</h4>
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
        className="shrink-0 border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-accent hover:border-emerald-500"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  )
}
