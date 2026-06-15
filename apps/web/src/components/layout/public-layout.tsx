import { Outlet, Link } from '@tanstack/react-router'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { LanguageToggle } from '@/components/shared/language-toggle'
import { Button } from '@/components/ui/button'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.webp" alt="Mediamedicine" className="h-7 w-7 object-contain" />
            <span className="font-bold text-sm">mediamedicine</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/corporate/about" className="hover:text-foreground transition-colors">
              Hakkında
            </Link>
            <Link to="/corporate/privacy" className="hover:text-foreground transition-colors">
              Gizlilik
            </Link>
            <Link to="/corporate/terms" className="hover:text-foreground transition-colors">
              Kullanım Koşulları
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Link to="/auth/login">
              <Button variant="outline" size="sm">
                Giriş Yap
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button size="sm">Katıl</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.webp" alt="Mediamedicine" className="h-5 w-5 object-contain" />
              <span className="text-sm font-medium">mediamedicine</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <Link to="/corporate/about" className="hover:text-foreground">Hakkında</Link>
              <Link to="/corporate/privacy" className="hover:text-foreground">Gizlilik</Link>
              <Link to="/corporate/terms" className="hover:text-foreground">Kullanım Koşulları</Link>
            </div>
            <p className="text-xs text-muted-foreground">© 2026 Mediamedicine. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
