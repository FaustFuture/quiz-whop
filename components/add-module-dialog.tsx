"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createModule } from "@/app/actions/modules"
import { useRouter } from "next/navigation"

interface AddModuleDialogProps {
  companyId: string
  onModuleCreated?: () => void
}

export function AddModuleDialog({ companyId, onModuleCreated }: AddModuleDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      return
    }

    setIsLoading(true)
    
    try {
      const result = await createModule(companyId, title, description)
      
      if (result.success) {
        setTitle("")
        setDescription("")
        setOpen(false)
        // Call the callback to refetch modules
        if (onModuleCreated) {
          onModuleCreated()
        }
        // Also refresh the router as backup
        router.refresh()
      } else {
        console.error("Failed to create module:", result.error)
        alert("Failed to create module. Please try again.")
      }
    } catch (error) {
      console.error("Error creating module:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          Add Module
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] bg-card border-border">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Module</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new quiz module. Fill in the title and description below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-foreground">
                Title <span className="text-red-400">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., JavaScript Fundamentals"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-foreground">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this module covers..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()} className="bg-emerald-600 hover:bg-emerald-700">
              {isLoading ? "Creating..." : "Create Module"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
