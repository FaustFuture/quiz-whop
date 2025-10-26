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
import { createExercise } from "@/app/actions/exercises"
import { useRouter } from "next/navigation"

interface AddExerciseDialogProps {
  moduleId: string
}

export function AddExerciseDialog({ moduleId }: AddExerciseDialogProps) {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [weight, setWeight] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!question.trim()) {
      return
    }

    setIsLoading(true)
    
    try {
      const result = await createExercise(moduleId, question, imageUrl, weight)
      
      if (result.success) {
        setQuestion("")
        setImageUrl("")
        setWeight(1)
        setOpen(false)
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Exercise
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Exercise</DialogTitle>
            <DialogDescription>
              Add a new exercise to this module. The weight determines how many points this exercise is worth.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="question">
                Question <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="question"
                placeholder="e.g., What is the output of console.log('Hello' + 'World')?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                autoFocus
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="imageUrl">Image URL (optional)</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                type="url"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="weight">Weight (Points)</Label>
              <Input
                id="weight"
                type="number"
                min="1"
                max="10"
                value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value) || 1)}
                className="w-24"
              />
              <p className="text-sm text-muted-foreground">
                How many points this exercise is worth (1-10)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !question.trim()}>
              {isLoading ? "Creating..." : "Create Exercise"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
