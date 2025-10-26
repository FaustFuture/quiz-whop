"use client"

import { useState, useEffect } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { createAlternative, getAlternatives } from "@/app/actions/alternatives"
import { useRouter } from "next/navigation"

interface AddOptionDialogProps {
  exerciseId: string
}

export function AddOptionDialog({ exerciseId }: AddOptionDialogProps) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [isCorrect, setIsCorrect] = useState(false)
  const [explanation, setExplanation] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [existingAlternatives, setExistingAlternatives] = useState<any[]>([])
  const [hasCorrectAlternative, setHasCorrectAlternative] = useState(false)
  const router = useRouter()

  // Check if this is the first alternative or if there are no correct alternatives
  useEffect(() => {
    const checkAlternatives = async () => {
      const alternatives = await getAlternatives(exerciseId)
      setExistingAlternatives(alternatives)
      setHasCorrectAlternative(alternatives.some(alt => alt.is_correct))
      
      // If this is the first alternative or no correct alternative exists, make it correct by default
      if (alternatives.length === 0 || !alternatives.some(alt => alt.is_correct)) {
        setIsCorrect(true)
      }
    }
    
    if (open) {
      checkAlternatives()
    }
  }, [exerciseId, open])

  const resetForm = () => {
    setContent("")
    setExplanation("")
    setIsCorrect(false)
    setExistingAlternatives([])
    setHasCorrectAlternative(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      return
    }

    setIsLoading(true)
    
    try {
      const result = await createAlternative(exerciseId, content, isCorrect, explanation)
      
      if (result.success) {
        resetForm()
        setOpen(false)
        router.refresh()
      } else {
        console.error("Failed to create alternative:", result.error)
        alert("Failed to create option. Please try again.")
      }
    } catch (error) {
      console.error("Error creating alternative:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Option
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Option</DialogTitle>
            <DialogDescription>
              Add a new answer option for this exercise. {existingAlternatives.length === 0 ? "This will be marked as correct by default since it's the first option." : "Mark it as correct if it's the right answer."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="content">
                Option Content <span className="text-destructive">*</span>
              </Label>
              <Input
                id="content"
                placeholder="e.g., Hello World"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                autoFocus
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-correct"
                checked={isCorrect}
                onCheckedChange={(checked) => setIsCorrect(checked as boolean)}
                disabled={existingAlternatives.length === 0 || !hasCorrectAlternative}
              />
              <Label htmlFor="is-correct" className="text-sm font-medium">
                {existingAlternatives.length === 0 || !hasCorrectAlternative 
                  ? "This is the correct answer (required for first option)" 
                  : "This is the correct answer"}
              </Label>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="explanation">Explanation (optional)</Label>
              <Textarea
                id="explanation"
                placeholder="Explain why this option is correct or incorrect..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={3}
              />
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
            <Button type="submit" disabled={isLoading || !content.trim()}>
              {isLoading ? "Adding..." : "Add Option"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
