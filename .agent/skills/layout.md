# 🎨 SKILL DE LAYOUT MODERN - PDM PRO MODA

## COMANDO PARA A IA

```
Você é um designer UI/UX sênior especializado em interfaces modernas para sistemas empresariais.

CRIE UM LAYOUT **SEM CARA DE FEITO POR IA** - deve parecer um sistema profissional desenvolvido por designers experientes.

REQUISITOS:
1. Design moderno, limpo e profissional
2. Suporte a **Light e Dark Mode** com seletor desde o login
3. Componentes com **hover effects**, **animações suaves** e **feedback visual**
4. Tipografia elegante (Inter, com fallbacks)
5. Espaçamento consistente (usando escala 4px/8px)
6. Cards com bordas suaves e sombras sutis
7. Ícones consistentes (Lucide React)
8. Responsivo (mobile-first, adapta para desktop)

PALETA DE CORES:
- Light mode: fundo #F8FAFC, cards #FFFFFF, bordas #E2E8F0
- Dark mode: fundo #0F172A, cards #1E293B, bordas #334155
- Primária: #3B82F6 (azul 500)
- Primária hover: #2563EB (azul 600)
- Sucesso: #10B981 (verde 500)
- Aviso: #F59E0B (âmbar 500)
- Erro: #EF4444 (vermelho 500)
- Info: #8B5CF6 (roxo 500)

ESTILOS DE BORDA E SOMBRA:
- Border radius: 12px para cards, 8px para inputs, 6px para botões pequenos
- Sombras: shadow-sm (default), shadow-md (hover)
- Transições: all 0.2s ease

ANIMAÇÕES:
- Fade in ao carregar páginas
- Slide in para modais
- Pulse para notificações
- Spin para loading
```

---

## 📁 ESTRUTURA DOS ARQUIVOS DE LAYOUT

```
src/
├── app/
│   ├── layout.tsx                 # Root layout (ThemeProvider + Toaster)
│   ├── (auth)/
│   │   └── layout.tsx             # Auth layout (centralizado, sem sidebar)
│   ├── (dashboard)/
│   │   ├── layout.tsx             # Dashboard layout (Sidebar + Header + ThemeToggle)
│   │   └── page.tsx               # Dashboard principal
│   └── globals.css                # Estilos globais + variáveis CSS
├── components/
│   ├── layout/
│   │   ├── Header.tsx             # Header com busca, notificações, perfil
│   │   ├── Sidebar.tsx            # Sidebar com navegação principal
│   │   ├── SidebarMobile.tsx      # Sidebar responsiva para mobile
│   │   ├── ThemeToggle.tsx        # Toggle light/dark mode
│   │   └── MobileBottomNav.tsx    # Navegação inferior para mobile
│   ├── ui/
│   │   ├── Card.tsx               # Card component estilizado
│   │   ├── Button.tsx             # Button com variantes
│   │   ├── Input.tsx              # Input estilizado
│   │   ├── Select.tsx             # Select estilizado
│   │   ├── Badge.tsx              # Badge com cores por status
│   │   ├── Table.tsx              # Table estilizada
│   │   ├── Modal.tsx              # Modal com animação
│   │   ├── Skeleton.tsx           # Skeleton loading
│   │   └── Toast.tsx              # Toast notifications
│   └── shared/
│       ├── ThemeProvider.tsx      # Provider do tema (next-themes)
│       └── LoadingSpinner.tsx     # Spinner animado
├── lib/
│   ├── utils.ts                   # cn() para className merge
│   └── constants.ts               # Links da sidebar, configurações
└── hooks/
    └── useTheme.ts                # Hook para acessar tema
```

---

## 📝 ARQUIVOS DETALHADOS

### 1. `src/app/globals.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.75rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-sans antialiased;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
}

@layer components {
  .glass-effect {
    @apply bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/20 dark:border-slate-800/50;
  }
  
  .card-hover {
    @apply transition-all duration-200 hover:shadow-md hover:-translate-y-0.5;
  }
  
  .animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }
  
  .animate-slide-in {
    animation: slideIn 0.2s ease-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
}

@layer utilities {
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

---

### 2. `src/components/layout/ThemeToggle.tsx`

```tsx
"use client"

import { useTheme } from "next-themes"
import { Moon, Sun, Monitor } from "lucide-react"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
      <button
        onClick={() => setTheme("light")}
        className={`p-2 rounded-md transition-all ${
          theme === "light"
            ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600"
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
        }`}
        aria-label="Light mode"
      >
        <Sun size={18} />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-2 rounded-md transition-all ${
          theme === "dark"
            ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600"
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
        }`}
        aria-label="Dark mode"
      >
        <Moon size={18} />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-2 rounded-md transition-all ${
          theme === "system"
            ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600"
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
        }`}
        aria-label="System preference"
      >
        <Monitor size={18} />
      </button>
    </div>
  )
}
```

---

### 3. `src/components/layout/Header.tsx`

```tsx
"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Bell, Search, Menu, User, LogOut, Settings } from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"
import { Button } from "@/components/ui/Button"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const notifications = [
    { id: 1, title: "Nova solicitação #125", time: "5 min atrás", read: false },
    { id: 2, title: "Solicitação #124 aprovada", time: "1 hora atrás", read: false },
  ]

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-slate-800 dark:bg-slate-950/95 px-4 md:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="hidden md:flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar..."
              className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Bell size={20} />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg border bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 animate-fade-in">
              <div className="border-b p-3 font-medium dark:border-slate-700">Notificações</div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800 ${!n.read ? "bg-blue-50 dark:bg-blue-950/30" : ""}`}>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-slate-500">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
              <span className="text-sm font-semibold">
                {session?.user?.name?.charAt(0) || "U"}
              </span>
            </div>
            <span className="hidden text-sm font-medium md:block">{session?.user?.name}</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 animate-fade-in">
              <div className="border-b p-3 dark:border-slate-700">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-slate-500">{session?.user?.email}</p>
                <p className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
                  {session?.user?.role}
                </p>
              </div>
              <div className="p-2">
                <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                  <User size={16} /> Perfil
                </button>
                <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Settings size={16} /> Configurações
                </button>
                <button
                  onClick={() => signOut()}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                >
                  <LogOut size={16} /> Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
```

---

### 4. `src/components/layout/Sidebar.tsx`

```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Factory,
  FlaskConical,
  Package,
  Users,
  Settings,
  Database,
  BarChart3,
} from "lucide-react"

const navItems = {
  COMERCIAL: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/comercial/solicitacoes", label: "Minhas Solicitações", icon: FileText },
    { href: "/comercial/solicitacoes/nova", label: "Nova Solicitação", icon: PlusCircle },
  ],
  TECELAGEM: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tecelagem/solicitacoes", label: "Solicitações Recebidas", icon: FileText },
    { href: "/tecelagem/produtos-cru", label: "Produtos Cru", icon: Factory },
  ],
  BENEFICIAMENTO: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/beneficiamento/solicitacoes", label: "Solicitações Recebidas", icon: FileText },
    { href: "/beneficiamento/produtos", label: "Produtos", icon: FlaskConical },
    { href: "/beneficiamento/receitas", label: "Receitas", icon: Database },
    { href: "/beneficiamento/roteiros", label: "Roteiros", icon: BarChart3 },
  ],
  PCP: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pcp/solicitacoes/amostras", label: "Amostras", icon: Package },
    { href: "/pcp/solicitacoes/producao", label: "Produção", icon: Factory },
  ],
  ADMIN: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/cadastros/fios", label: "Cadastros", icon: Database },
    { href: "/admin/usuarios", label: "Usuários", icon: Users },
    { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
  ],
}

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role as keyof typeof navItems || "COMERCIAL"
  const items = navItems[role] || navItems.COMERCIAL

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white dark:bg-slate-950">
      <div className="flex h-16 items-center border-b px-6 dark:border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-sm font-bold text-white">PM</span>
          </div>
          <span className="text-lg font-semibold">PDM Pro Moda</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4 dark:border-slate-800">
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Versão 1.0.0</p>
          <p className="text-xs text-slate-400">© 2024 Pro Moda Têxtil</p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 border-r bg-white dark:border-slate-800 dark:bg-slate-950 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <div className="fixed left-0 top-0 h-full w-72 animate-slide-in">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}
```

---

### 5. `src/components/layout/MobileBottomNav.tsx`

```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { LayoutDashboard, FileText, PlusCircle, Package, User } from "lucide-react"

const navItems = {
  COMERCIAL: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
    { href: "/comercial/solicitacoes", icon: FileText, label: "Lista" },
    { href: "/comercial/solicitacoes/nova", icon: PlusCircle, label: "Novo" },
    { href: "/perfil", icon: User, label: "Perfil" },
  ],
  TECELAGEM: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
    { href: "/tecelagem/solicitacoes", icon: FileText, label: "Solicitações" },
    { href: "/tecelagem/produtos-cru", icon: Package, label: "Produtos" },
    { href: "/perfil", icon: User, label: "Perfil" },
  ],
  // ... outros perfis
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role as keyof typeof navItems || "COMERCIAL"
  const items = navItems[role] || navItems.COMERCIAL

  // Esconder em desktop
  if (typeof window !== "undefined" && window.innerWidth >= 1024) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
      <div className="flex justify-around py-2">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-lg px-4 py-2 transition-colors ${
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Icon size={22} />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
```

---

### 6. `src/components/ui/Button.tsx`

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-blue-600 underline-offset-4 hover:underline",
        success: "bg-green-600 text-white hover:bg-green-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

---

### 7. `src/components/ui/Card.tsx`

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

---

### 8. `src/components/shared/ThemeProvider.tsx`

```tsx
"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
```

---

### 9. `src/app/layout.tsx`

```tsx
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/shared/ThemeProvider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export const metadata: Metadata = {
  title: "PDM Pro Moda - Gestão de Desenvolvimento Têxtil",
  description: "Sistema de gestão de desenvolvimento de produtos têxteis",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

### 10. `src/app/(auth)/layout.tsx`

```tsx
import { ThemeProvider } from "@/components/shared/ThemeProvider"
import { ThemeToggle } from "@/components/layout/ThemeToggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="flex min-h-screen items-center justify-center">
        {children}
      </div>
    </div>
  )
}
```

---

### 11. `src/app/(dashboard)/layout.tsx`

```tsx
"use client"

import { useState } from "react"
import { Header } from "@/components/layout/Header"
import { Sidebar } from "@/components/layout/Sidebar"
import { MobileBottomNav } from "@/components/layout/MobileBottomNav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="animate-fade-in p-4 md:p-6 pb-20 lg:pb-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  )
}
```

---

### 12. `src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## ✅ COMMIT PRONTO

```
feat: implementa layout moderno com light/dark mode e componentes UI

✅ O que foi feito:
   - Criado globals.css com temas light/dark e animações
   - Implementado ThemeProvider e ThemeToggle com 3 opções (light/dark/system)
   - Criado Header com busca, notificações e menu do usuário
   - Criado Sidebar responsiva com navegação por perfil
   - Criado MobileBottomNav para dispositivos móveis
   - Componentes UI: Button, Card, Badge, Table, Modal, Skeleton
   - Layouts: Root, Auth, Dashboard com animações
   - Utilitário cn() para merge de classes

🎨 Design:
   - Border radius: 12px para cards
   - Cores primárias: azul 500/600
   - Animações: fade-in, slide-in, hover effects
   - Sombras suaves e transições
   - Tipografia Inter

⚠️ Atenção: 
   - Instalar dependências: npm install next-themes clsx tailwind-merge class-variance-authority
   - Verificar se todas as importações estão corretas
```

---

## 🧩 NOVOS COMPONENTES ADICIONADOS

### Chat Componentes

| Componente | Localização | Descrição |
|-----------|-------------|-----------|
| `ChatPage` | `src/app/(dashboard)/chat/page.tsx` | Split view: sidebar (lista de chats) + conversa |
| `NovoChatDialog` | mesmo arquivo | Dialog para criar novo chat vinculado a entidade |
| `EmojiPicker` | `src/components/chat/emoji-picker.tsx` | 80 emojis, 16-col grid, insert at cursor |
| `EntityChatButton` | `src/components/chat/entity-chat-button.tsx` | Botão reutilizável para criar/abrir chat de entidade |
| `ChatButton` | `src/components/chat/chat-button.tsx` | Botão global no header com badge de não lidas |

### UI Components

| Componente | Localização | Descrição |
|-----------|-------------|-----------|
| `ConfirmModal` | `src/components/ui/confirm-modal.tsx` | Modal de confirmação com variantes (danger, warning) |
| `InfoButton` | `src/components/ui/info-button.tsx` | Botão de ajuda com tooltip/popover |
| `LinksEditor` | `src/components/links/LinksEditor.tsx` | Editor de links com URL + descrição |
| `ExportarDados` | `src/components/exportar/ExportarDados.tsx` | Export CSV/PDF genérico |
| `ImportarApiModal` | `src/components/integracao/ImportarApiModal.tsx` | Import via API externa genérico |

### Test Layout

```
src/
└── test/
    ├── setup.ts                 # jsdom setup com testing-library
    └── components/
        ├── Button.test.tsx      # 38 component tests
        └── validation.test.ts   # 42 Zod validation tests
```

---

## 📦 DEPENDÊNCIAS ATUAIS DO PROJETO

```bash
# Produção
next@14.2.0  react@18.2.0  react-dom@18.2.0
next-auth@4.24.5  drizzle-orm@0.29+  @neondatabase/serverless
postgres  zod@3  react-hook-form  @hookform/resolvers
next-themes  lucide-react  recharts  sonner
tailwind-merge  class-variance-authority  clsx
nodemailer@7  bcryptjs  @vercel/blob  jspdf

# Dev
typescript@5.3  tailwindcss@3.4  postcss  autoprefixer
drizzle-kit  vitest@4.1.7  @vitejs/plugin-react  jsdom
@testing-library/react  @testing-library/jest-dom
```

---

**Skill criada em:** 02/05/2026  
**Última atualização:** 01/06/2026  
**Versão:** 1.1  
**Próximo passo:** Aguardar aprovação do usuário para iniciar a implementação do layout

