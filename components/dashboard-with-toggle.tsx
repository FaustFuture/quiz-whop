"use client"

import { useState } from "react"
import { Camera } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { ModulesSection } from "@/components/modules-section"
import { MemberModulesViewClient } from "@/components/member-modules-view-client"
import { ResultsSidebar } from "@/components/results-sidebar"
import { CompanyLogoUpload } from "@/components/company-logo-upload"
import { type Module } from "@/app/actions/modules"
import { type Company } from "@/app/actions/company"

interface DashboardWithToggleProps {
  isAdmin: boolean
  companyId: string
  userId: string
  companyName: string
  companyData: Company | null
  recentResults: any[]
  modules: Module[]
  memberModules: Module[]
  userResults: { [moduleId: string]: any }
}

export function DashboardWithToggle({
  isAdmin,
  companyId,
  userId,
  companyName,
  companyData,
  recentResults,
  modules,
  memberModules,
  userResults
}: DashboardWithToggleProps) {
  const [showMemberView, setShowMemberView] = useState(false)

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-gray-200/10 bg-[#0f0f0f]">
        <div className="mx-auto px-8 h-16 flex items-center justify-between">
          {isAdmin && !showMemberView ? (
            <CompanyLogoUpload 
              companyId={companyId}
              currentLogoUrl={companyData?.logo_url || null}
              companyName={companyName}
            />
          ) : (
            <div className="flex items-center gap-3">
              {companyData?.logo_url ? (
                <img
                  src={companyData.logo_url}
                  alt={`${companyName} logo`}
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                  <Camera className="w-4 h-4 text-gray-400" />
                </div>
              )}
              <h1 className="text-xl font-semibold text-white">{companyName}</h1>
            </div>
          )}
          
          <div className="flex items-center gap-4">
            {isAdmin && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Member View</span>
                <Switch
                  checked={showMemberView}
                  onCheckedChange={setShowMemberView}
                />
              </div>
            )}
            <span className="text-sm text-gray-400">
              {isAdmin && showMemberView ? "Member" : isAdmin ? "Admin" : "Member"}
            </span>
          </div>
        </div>
      </header>
      
      {isAdmin && !showMemberView ? (
        <div className="flex min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">
              <ModulesSection companyId={companyId} initialModules={modules} />
            </div>
          </main>
          <aside className="w-[400px] border-l border-gray-200/10 bg-[#0f0f0f] p-6">
            <ResultsSidebar results={recentResults} modules={modules} />
          </aside>
        </div>
      ) : (
        <main className="container mx-auto p-8">
          <MemberModulesViewClient 
            companyId={companyId} 
            userId={userId} 
            modules={memberModules}
            userResults={userResults}
          />
        </main>
      )}
    </div>
  )
}
