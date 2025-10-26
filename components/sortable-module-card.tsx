"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Trash2, MoreVertical, GripVertical } from "lucide-react"
import { useRouter } from "next/navigation"
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
import { type Module } from "@/app/actions/modules"
import { deleteModule } from "@/app/actions/modules"

interface SortableModuleCardProps {
  module: Module
  companyId: string
  isActive?: boolean
}

export function SortableModuleCard({ module, companyId, isActive = false }: SortableModuleCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id })


  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    if (!confirm("Are you sure you want to delete this module? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    
    try {
      const result = await deleteModule(module.id, companyId)
      
      if (result.success) {
        router.refresh()
      } else {
        console.error("Failed to delete module:", result.error)
        alert("Failed to delete module. Please try again.")
      }
    } catch (error) {
      console.error("Error deleting module:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCardClick = () => {
    router.push(`/dashboard/${companyId}/modules/${module.id}`)
  }

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`relative group hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50 w-80 h-48 ${
        isDragging ? 'opacity-50 z-50' : ''
      }`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-xl">{module.title}</CardTitle>
            {module.description && (
              <CardDescription className="mt-2 line-clamp-2">
                {module.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Drag Handle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
              <span className="sr-only">Drag to reorder</span>
            </Button>
            
            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isDeleting}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Created {new Date(module.created_at).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}
