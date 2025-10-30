"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { grantExamRetakeByUsernames, searchCachedUsers } from "@/app/actions/users"
import { useRouter } from "next/navigation"
import { Users } from "lucide-react"

interface GrantRetakeDialogProps {
  moduleId: string
  companyId: string
}

export function GrantRetakeDialog({ moduleId, companyId }: GrantRetakeDialogProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<{ username: string; whop_user_id: string; name?: string | null }[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const parseUsernames = (txt: string): string[] => {
    return txt
      .split(/[,\n\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }

  // Autocomplete suggestions
  useEffect(() => {
    const q = input.trim()
    const t = setTimeout(async () => {
      if (!q) { setSuggestions([]); setShowDropdown(false); return }
      const res = await searchCachedUsers(q)
      if (res.success) {
        const items = (res.data as any[]).map((u) => ({ username: u.username, whop_user_id: u.whop_user_id, name: u.name }))
        const filtered = items.filter((u) => u.username && !selected.includes(u.username))
        setSuggestions(filtered)
        setShowDropdown(filtered.length > 0)
      }
    }, 200)
    return () => clearTimeout(t)
  }, [input, selected])

  const handleGrant = async () => {
    const usernames = selected.length > 0 ? selected : parseUsernames(input)
    if (usernames.length === 0) return
    setIsLoading(true)
    try {
      // Admin user id will be resolved in server using whop sdk from headers if needed; for now pass placeholder
      const res = await grantExamRetakeByUsernames(moduleId, usernames, "admin")
      if (!res.success) {
        alert(res.error || "Failed to grant retake")
        return
      }
      setOpen(false)
      setInput("")
      setSelected([])
      setSuggestions([])
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 min-w-[140px]">
          <Users className="h-4 w-4" />
          Grant Retake
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg [&>button]:text-foreground [&>button]:opacity-100 [&>button]:hover:opacity-100">
        <DialogHeader>
          <DialogTitle className="text-foreground">Grant Retake</DialogTitle>
          <DialogDescription className="text-foreground">Enter usernames separated by commas, spaces, or new lines.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selected.map((u) => (
                  <span key={u} className="px-2 py-1 rounded-full text-xs bg-muted text-foreground border border-border">
                    {u}
                    <button className="ml-2 text-muted-foreground hover:text-foreground" onClick={() => setSelected(selected.filter((x) => x !== u))}>×</button>
                  </span>
                ))}
              </div>
            )}
            <Input
              placeholder="username1, username2, ..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-foreground"
              onFocus={() => { if (suggestions.length > 0) setShowDropdown(true) }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            />
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-md border border-border bg-card shadow">
                {suggestions.map((sug) => (
                  <button
                    key={sug.whop_user_id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-foreground"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (!selected.includes(sug.username)) setSelected([...selected, sug.username])
                      setInput("")
                      setShowDropdown(false)
                    }}
                  >
                    {sug.username}{sug.name ? ` – ${sug.name}` : ""}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading} className="min-w-[100px] text-foreground">Cancel</Button>
            <Button onClick={handleGrant} disabled={isLoading} className="min-w-[100px]">{isLoading ? "Granting..." : "Grant"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


