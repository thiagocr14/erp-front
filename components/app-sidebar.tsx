'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Warehouse,
  BarChart3,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/vendas', label: 'Vendas', icon: ShoppingCart },
  { href: '/orcamentos', label: 'Orçamentos', icon: FileText },
  { href: '/estoque', label: 'Estoque', icon: Warehouse },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
  <Package className="h-5 w-5 text-primary-foreground" />
</div>
<div className="flex flex-col">
  <span className="text-sm font-semibold text-sidebar-foreground">
    WIP Importações
  </span>
  <span className="text-xs text-muted-foreground">Gestão de Estoque</span>
</div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User & Logout */}
      <div className="border-t border-border p-3">
        {user && (
          <div className="mb-3 px-3">
            <p className="text-sm font-medium text-sidebar-foreground">
              {user.nome}
            </p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
