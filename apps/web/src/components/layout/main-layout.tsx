import { Outlet } from '@tanstack/react-router'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppFooter } from '@/components/layout/app-footer'

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />

      {/* Content area — offset by fixed header */}
      <div className="flex-1 pt-14">
        <div className="mx-auto max-w-[1400px] px-4">
          <div className="flex gap-6">
            <AppSidebar />
            <main className="flex-1 min-w-0 py-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>

      <AppFooter />
    </div>
  )
}
