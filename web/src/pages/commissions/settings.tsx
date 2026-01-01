import { useState } from 'react'
import type { CommissionSettingsResponse } from '@/services/api.admin-commission'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SettingsPanelProps {
  settings: CommissionSettingsResponse | undefined
  onUpdate: (rate: number) => void
  isUpdating: boolean
}

export function SettingsPanel({
  settings,
  onUpdate,
  isUpdating,
}: SettingsPanelProps) {
  const [rate, setRate] = useState<string>(
    settings ? (parseFloat(settings.commissionRate) * 100).toString() : '15',
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const rateNum = parseFloat(rate) / 100
    if (rateNum >= 0 && rateNum <= 1) {
      onUpdate(rateNum)
    }
  }

  return (
    <div className="rounded-lg bg-white border border-gray-200">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-800">
          Cài đặt tỷ lệ chiết khấu
        </h2>
      </div>
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="commission-rate">
              Tỷ lệ chiết khấu (%)
            </Label>
            <Input
              id="commission-rate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="15"
              className="max-w-xs"
            />
            <p className="text-xs text-gray-500">
              Tỷ lệ chiết khấu hiện tại:{' '}
              <span className="font-semibold">
                {settings
                  ? `${(parseFloat(settings.commissionRate) * 100).toFixed(2)}%`
                  : '—'}
              </span>
            </p>
          </div>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? 'Đang cập nhật...' : 'Cập nhật tỷ lệ'}
          </Button>
        </form>
      </div>
    </div>
  )
}

