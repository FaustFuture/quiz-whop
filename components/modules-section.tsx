import { AddModuleDialog } from "@/components/add-module-dialog"
import { SortableModulesList } from "@/components/sortable-modules-list"
import { getModules, type Module } from "@/app/actions/modules"

interface ModulesSectionProps {
  companyId: string
}

export async function ModulesSection({ companyId }: ModulesSectionProps) {
  const modules = await getModules(companyId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Modules</h2>
        <AddModuleDialog companyId={companyId} />
      </div>
      
      {modules.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No modules yet. Click "Add Module" to create your first quiz module.
          </p>
        </div>
      ) : (
        <SortableModulesList modules={modules} companyId={companyId} />
      )}
    </div>
  )
}
