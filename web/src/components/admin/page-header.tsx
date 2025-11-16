import { ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  showBackButton?: boolean
  backTo?: string
  className?: string
}

export function PageHeader({
  title,
  description,
  action,
  showBackButton = false,
  backTo,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (backTo) {
      navigate({ to: backTo })
    } else {
      navigate({ to: '/admin/dashboard' })
    }
  }

  return (
    <div className={cn('mb-6', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    </div>
  )
}
