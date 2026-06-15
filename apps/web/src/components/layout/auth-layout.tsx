import { Outlet } from '@tanstack/react-router'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { LanguageToggle } from '@/components/shared/language-toggle'

export function AuthLayout() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-background flex items-center justify-center p-4">
      {/* Gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 right-0 w-[600px] h-[600px] rounded-full bg-cyan-200/40 dark:bg-cyan-900/20 blur-3xl" />
        <div className="absolute -bottom-1/4 left-0 w-[600px] h-[600px] rounded-full bg-purple-300/30 dark:bg-purple-900/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-sky-200/30 dark:bg-sky-900/20 blur-3xl" />
      </div>

      {/* Top controls */}
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[400px]">
        <Outlet />
      </div>
    </div>
  )
}
