import { useTheme } from 'next-themes'

export function useThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  return { theme, resolvedTheme, setTheme, toggleTheme }
}
