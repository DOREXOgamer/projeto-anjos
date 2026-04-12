"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  BookOpen,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  BarChart3,
  Settings,
  Calendar,
  HelpCircle,
  UserCog,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuth } from "@/components/auth/auth-provider"
import type { UserRole } from "@/lib/auth"
import { hasPermission, PERMISSIONS, type Permission } from "@/lib/permissions"

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  roles?: UserRole[]
  permission?: Permission
}

const menuItems: Array<{ group: string; items: NavItem[] }> = [
  {
    group: "Principal",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    group: "Gestão",
    items: [
      { href: "/dashboard/alunos", label: "Alunos", icon: Users, permission: PERMISSIONS.ALUNOS },
      { href: "/dashboard/turmas", label: "Turmas", icon: GraduationCap, permission: PERMISSIONS.TURMAS },
      { href: "/dashboard/presenca", label: "Presença", icon: ClipboardCheck, permission: PERMISSIONS.PRESENCA },
      { href: "/dashboard/professores", label: "Professores", icon: UserCog, roles: ["DIRECTOR"] },
    ],
  },
  {
    group: "Pedagógico",
    items: [
      { href: "/dashboard/plano-aula", label: "Plano de Aula", icon: BookOpen, permission: PERMISSIONS.PLANO_AULA },
      { href: "/dashboard/calendario", label: "Calendário", icon: Calendar, permission: PERMISSIONS.CALENDARIO },
    ],
  },
  {
    group: "Relatórios",
    items: [{ href: "/dashboard/relatorios", label: "Relatórios", icon: BarChart3, roles: ["DIRECTOR"] }],
  },
]

const bottomMenuItems: NavItem[] = [
  { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings, roles: ["DIRECTOR"] },
  { href: "/dashboard/ajuda", label: "Ajuda", icon: HelpCircle },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const role = user?.role

  const canSee = (item: NavItem) => {
    if (!user) return false
    if (item.roles && (!role || !item.roles.includes(role))) return false
    if (item.permission && !hasPermission(user, item.permission)) return false
    return true
  }

  const visibleMenuItems = menuItems
    .map((group) => ({
      ...group,
      items: group.items.filter(canSee),
    }))
    .filter((group) => group.items.length > 0)

  const visibleBottomItems = bottomMenuItems.filter(canSee)

  // Persistir estado do menu
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved) setCollapsed(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed))
    window.dispatchEvent(new CustomEvent('sidebar-collapsed', { detail: collapsed }))
  }, [collapsed])

  const handleLogout = () => {
    logout()
    router.replace("/")
  }

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
    const isActive = pathname === href

    const linkContent = (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          collapsed ? "justify-center" : "",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )}
      >
        <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-sidebar-primary-foreground")} />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    )

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {label}
          </TooltipContent>
        </Tooltip>
      )
    }

    return linkContent
  }

  return (
    <TooltipProvider>
      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-sidebar text-sidebar-foreground shadow-md"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 md:translate-x-0 flex flex-col",
          collapsed ? "w-[72px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center border-b border-sidebar-border transition-all duration-300",
            collapsed ? "justify-center p-3" : "justify-between p-4",
          )}
        >
          <div className={cn("flex items-center gap-3 overflow-hidden", collapsed && "justify-center")}>
            <Image
              src="/logo.png"
              alt="Projeto Anjos Inocentes"
              width={48}
              height={48}
              className="object-contain flex-shrink-0"
              style={{ width: collapsed ? 40 : 48, height: 'auto' }}
            />
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sidebar-foreground text-sm truncate">
                  Anjos Inocentes
                </span>
                <span className="text-xs text-muted-foreground truncate">Sistema de Gestão</span>
              </div>
            )}
          </div>

          {/* Collapse button - Desktop only */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "hidden md:flex h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent",
              collapsed && "absolute -right-3 top-6 bg-sidebar border border-sidebar-border shadow-md rounded-full",
            )}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {visibleMenuItems.map((group) => (
            <div key={group.group}>
              {!collapsed && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.group}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink key={item.href} {...item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-sidebar-border p-3 space-y-1">
          {visibleBottomItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}

          {/* Logout */}
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Sair
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved) setCollapsed(JSON.parse(saved))

    const handleStorage = () => {
      const saved = localStorage.getItem('sidebar-collapsed')
      if (saved) setCollapsed(JSON.parse(saved))
    }

    window.addEventListener('storage', handleStorage)

    // Custom event for same-tab updates
    const handleCustom = (e: CustomEvent) => setCollapsed(e.detail)
    window.addEventListener('sidebar-collapsed' as any, handleCustom as any)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('sidebar-collapsed' as any, handleCustom as any)
    }
  }, [])

  return collapsed
}
