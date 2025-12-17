import type { KycStatus } from '@/types/auth.types'

export function StatusBadge({ status }: { status: KycStatus }) {
  const map: Record<
    KycStatus,
    { label: string; className: string; dotClass: string }
  > = {
    PENDING: {
      label: 'Chờ duyệt',
      className: 'bg-amber-50 text-amber-800 ring-amber-600/20',
      dotClass: 'bg-amber-500',
    },
    APPROVED: {
      label: 'Đã duyệt',
      className: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
      dotClass: 'bg-emerald-500',
    },
    REJECTED: {
      label: 'Từ chối',
      className: 'bg-red-50 text-red-800 ring-red-600/20',
      dotClass: 'bg-red-500',
    },
    NEEDS_UPDATE: {
      label: 'Cần bổ sung',
      className: 'bg-blue-50 text-blue-800 ring-blue-600/20',
      dotClass: 'bg-blue-500',
    },
  }

  const cfg = map[status]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass}`} />
      {cfg.label}
    </span>
  )
}
