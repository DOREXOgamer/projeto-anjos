"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./auth-provider"
import { AccessDenied } from "./access-denied"
import { Spinner } from "@/components/ui/spinner"
import type { Permission } from "@/lib/permissions"
import { hasPermission } from "@/lib/permissions"

export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/")
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!hasPermission(user, permission)) {
    return <AccessDenied />
  }

  return <>{children}</>
}
