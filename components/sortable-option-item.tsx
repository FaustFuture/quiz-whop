"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Edit, Trash2, MoreVertical, Check, X, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { type Alternative } from "@/app/actions/alternatives"
import { updateAlternative, deleteAlternative } from "@/app/actions/alternatives"
import { useRouter } from "next/navigation"

interface SortableOptionItemProps {
  option: Alternative
  exerciseId: string
}

export function SortableOptionItem({ option, exerciseId }: SortableOptionItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(option.content)
  const [editedExplanation, setEditedExplanation] = useState(option.explanation || "")
  const [editedIsCorrect, setEditedIsCorrect] = useState(option.is_correct)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleSave = async () => {
    if (!editedContent.trim()) {
      alert("Option content cannot be empty.")
      return
    }
    setIsSaving(true)
    try {
      const result = await updateAlternative(option.id, exerciseId, {
        content: editedContent,
        is_correct: editedIsCorrect,
        explanation: editedExplanation || null,
      })
      if (result.success) {
        setIsEditing(false)
        router.refresh()
      } else {
        console.error("Failed to save option:", result.error)
        alert("Failed to save option. Please try again.")
      }
    } catch (error) {
      console.error("Error saving option:", error)
      alert("An error occurred while saving. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedContent(option.content)
    setEditedExplanation(option.explanation || "")
    setEditedIsCorrect(option.is_correct)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this option?")) {
      return
    }
    setIsDeleting(true)
    try {
      const result = await deleteAlternative(option.id, exerciseId)
      if (result.success) {
        router.refresh()
      } else {
        console.error("Failed to delete option:", result.error)
        alert(result.error || "Failed to delete option. Please try again.")
      }
    } catch (error) {
      console.error("Error deleting option:", error)
      alert("An error occurred while deleting. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCorrectnessToggle = async () => {
    try {
      const result = await updateAlternative(option.id, exerciseId, {
        is_correct: !option.is_correct
      })
      
      if (result.success) {
        router.refresh()
      } else {
        console.error("Failed to update option correctness:", result.error)
        alert("Failed to update option. Please try again.")
      }
    } catch (error) {
      console.error("Error updating option correctness:", error)
      alert("An error occurred while updating. Please try again.")
    }
  }

  if (isEditing) {
    return (
      <Card className="border-emerald-500 bg-emerald-500/10">
        <CardContent className="p-4">
          <div className="grid gap-3">
            <Input
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Option content"
              className="bg-[#1a1a1a] border-gray-200/10 text-white"
              autoFocus
            />
            <Textarea
              value={editedExplanation}
              onChange={(e) => setEditedExplanation(e.target.value)}
              placeholder="Explanation (optional)"
              className="bg-[#1a1a1a] border-gray-200/10 text-white"
              rows={2}
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`edit-is-correct-${option.id}`}
                checked={editedIsCorrect}
                onCheckedChange={(checked) => setEditedIsCorrect(checked as boolean)}
                className="border-gray-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
              />
              <label
                htmlFor={`edit-is-correct-${option.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300"
              >
                This is the correct answer
              </label>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                <Check className="w-3 h-3 mr-1" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} disabled={isSaving} className="bg-black border-gray-200/10 text-gray-400 hover:text-white hover:bg-gray-800">
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`group ${option.is_correct ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-gray-200/10 bg-[#1a1a1a]'} ${
        isDragging ? 'opacity-50 z-50' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Checkbox
                checked={option.is_correct}
                onCheckedChange={handleCorrectnessToggle}
                className="border-gray-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
              />
              <span className="font-medium text-gray-200">{option.content}</span>
            </div>
            {option.explanation && (
              <p className="text-sm text-gray-400 ml-6">
                {option.explanation}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Drag Handle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 cursor-grab active:cursor-grabbing opacity-60 hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-300"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-3 w-3" />
              <span className="sr-only">Drag to reorder</span>
            </Button>
            
            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                  disabled={isDeleting}
                >
                  <MoreVertical className="h-3 w-3" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-gray-200/10">
                <DropdownMenuItem onClick={() => setIsEditing(true)} className="text-gray-300 focus:bg-gray-800 focus:text-white">
                  <Edit className="mr-2 h-3 w-3" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
