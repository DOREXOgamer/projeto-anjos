"use client"

import { AppSidebar, useSidebarState } from "@/components/app-sidebar"
import { RequireAuth } from "@/components/auth/require-auth"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sidebarCollapsed = useSidebarState()

  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <AppSidebar />
        <main
          className={cn(
            "min-h-screen transition-all duration-300",
            sidebarCollapsed ? "md:ml-[72px]" : "md:ml-64",
          )}
        >
          <div className="p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </RequireAuth>
  )
}
