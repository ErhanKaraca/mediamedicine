import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function AppFooter() {
  return (
    <footer className="border-t border-border bg-background py-5">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© 2026 Mediamedicine. Tüm hakları saklıdır.</span>
          <nav className="flex flex-wrap gap-1">
            <Button variant="link" className="h-auto px-2 py-0 text-xs text-muted-foreground" asChild>
              <Link to="/corporate/about">Hakkımızda</Link>
            </Button>
            <Button variant="link" className="h-auto px-2 py-0 text-xs text-muted-foreground" asChild>
              <Link to="/corporate/privacy">Gizlilik</Link>
            </Button>
            <Button variant="link" className="h-auto px-2 py-0 text-xs text-muted-foreground" asChild>
              <Link to="/corporate/terms">Kullanım Koşulları</Link>
            </Button>
          </nav>
        </div>
      </div>
    </footer>
  )
}
