"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { updateModule, type Module } from "@/app/actions/modules"
import { useRouter } from "next/navigation"

interface EditModuleDialogProps {
  module: Module
  companyId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onModuleUpdated?: () => void
}

export function EditModuleDialog({ module, companyId, open, onOpenChange, onModuleUpdated }: EditModuleDialogProps) {
  const [title, setTitle] = useState(module.title)
  const [description, setDescription] = useState(module.description || "")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Reset form when dialog opens or module changes
  useEffect(() => {
    if (open) {
      setTitle(module.title)
      setDescription(module.description || "")
    }
  }, [open, module.title, module.description])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      return
    }

    setIsLoading(true)
    
    try {
      const result = await updateModule(module.id, companyId, title, description)
      
      if (result.success) {
        onOpenChange(false)
        // Call the callback to refetch modules
        if (onModuleUpdated) {
          onModuleUpdated()
        }
        // Also refresh the router as backup
        router.refresh()
      } else {
        console.error("Failed to update module:", result.error)
        alert("Failed to update module. Please try again.")
      }
    } catch (error) {
      console.error("Error updating module:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] bg-card border-border" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Assessment</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update the title and description for this {module.type === 'exam' ? 'exam' : 'quiz'}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title" className="text-foreground">
                Title <span className="text-red-400">*</span>
              </Label>
              <Input
                id="edit-title"
                placeholder="e.g., JavaScript Fundamentals"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description" className="text-foreground">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe what this quiz covers..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-foreground text-sm text-muted-foreground">
                Type: <span className="font-medium text-foreground">{module.type === 'exam' ? 'Exam' : 'Quiz'}</span> (cannot be changed)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onOpenChange(false)
              }}
              disabled={isLoading}
              className="bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()} className="bg-emerald-600 hover:bg-emerald-700">
              {isLoading ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

