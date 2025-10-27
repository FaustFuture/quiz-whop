"use client"

import { useState, useEffect } from "react"
import { AddModuleDialog } from "@/components/add-module-dialog"
import { SortableModulesList } from "@/components/sortable-modules-list"
import { getModules, type Module } from "@/app/actions/modules"

interface ModulesSectionProps {
  companyId: string
  initialModules: Module[]
}

export function ModulesSection({ companyId, initialModules }: ModulesSectionProps) {
  const [modules, setModules] = useState<Module[]>(initialModules)
  const [isLoading, setIsLoading] = useState(false)

  const refetchModules = async () => {
    setIsLoading(true)
    try {
      const updatedModules = await getModules(companyId)
      setModules(updatedModules)
    } catch (error) {
      console.error("Error refetching modules:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Modules</h2>
        <AddModuleDialog companyId={companyId} onModuleCreated={refetchModules} />
      </div>
      
      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-gray-400">Loading modules...</p>
        </div>
      ) : modules.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-gray-400">
            No modules yet. Click "Add Module" to create your first quiz module.
          </p>
        </div>
      ) : (
        <SortableModulesList modules={modules} companyId={companyId} onModuleDeleted={refetchModules} />
      )}
    </div>
  )
}
