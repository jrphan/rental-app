import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsWidgetProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: number | null
  description?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary'
}

const variantStyles = {
  default: {
    icon: 'text-gray-600',
    bg: 'bg-gray-100',
  },
  success: {
    icon: 'text-green-600',
    bg: 'bg-green-100',
  },
  warning: {
    icon: 'text-yellow-600',
    bg: 'bg-yellow-100',
  },
  danger: {
    icon: 'text-red-600',
    bg: 'bg-red-100',
  },
  primary: {
    icon: 'text-blue-600',
    bg: 'bg-blue-100',
  },
}

export function StatsWidget({
  title,
  value,
  icon: Icon,
  trend,
  description,
  variant = 'default',
}: StatsWidgetProps) {
  const styles = variantStyles[variant]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
          {trend !== null && trend !== undefined && (
            <p
              className={cn(
                'text-xs mt-1',
                trend >= 0 ? 'text-green-600' : 'text-red-600',
              )}
            >
              {trend >= 0 ? '+' : ''}
              {trend}%
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', styles.bg)}>
          <Icon className={cn('h-6 w-6', styles.icon)} />
        </div>
      </div>
    </div>
  )
}

