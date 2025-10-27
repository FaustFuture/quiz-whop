"use client"

import { useState } from "react"
import { MoreVertical, Trash2, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
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
import { Button } from "@/components/ui/button"
import { deleteModule, type Module } from "@/app/actions/modules"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ModuleCardProps {
  module: Module
  companyId: string
}

export function ModuleCard({ module, companyId }: ModuleCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const router = useRouter()

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    
    setIsDeleting(true)
    
    try {
      const result = await deleteModule(module.id, companyId)
      
      if (result.success) {
        router.refresh()
        setIsConfirmOpen(false)
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
      className="relative group hover:shadow-md transition-all cursor-pointer hover:border-primary/50"
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
                onClick={(e) => { e.stopPropagation(); setIsConfirmOpen(true) }}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Created {new Date(module.created_at).toLocaleDateString()}</span>
        </div>
      </CardContent>
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()} className="sm:max-w-md border-emerald-500/30">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-xl">Delete module?</DialogTitle>
              <DialogDescription>
                You are about to permanently delete <span className="font-medium text-emerald-400">{module.title}</span>. This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={(e) => { e.stopPropagation(); setIsConfirmOpen(false) }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              autoFocus
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
