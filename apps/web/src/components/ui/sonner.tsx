import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ richColors: _richColors, toastOptions, ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      richColors={false}
      className="toaster group"
      toastOptions={{
        ...toastOptions,
        classNames: {
          toast:
            'group toast !bg-card !text-card-foreground !border !border-border !shadow-md !rounded-xl',
          title: 'text-sm font-medium',
          description: 'text-sm text-muted-foreground',
          icon: 'shrink-0',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
