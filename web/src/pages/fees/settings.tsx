import { useState, useEffect } from 'react'
import type { FeeSettingsResponse } from '@/services/api.admin-fee'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SettingsPanelProps {
  settings: FeeSettingsResponse | undefined
  onUpdate: (data: {
    deliveryFeePerKm: number
    insuranceRate50cc: number
    insuranceRateTayGa: number
    insuranceRateTayCon: number
    insuranceRateMoto: number
    insuranceRateDefault?: number
  }) => void
  isUpdating: boolean
}

export function SettingsPanel({
  settings,
  onUpdate,
  isUpdating,
}: SettingsPanelProps) {
  const [deliveryFeePerKm, setDeliveryFeePerKm] = useState<string>('10000')
  const [insuranceRate50cc, setInsuranceRate50cc] = useState<string>('20000')
  const [insuranceRateTayGa, setInsuranceRateTayGa] = useState<string>('30000')
  const [insuranceRateTayCon, setInsuranceRateTayCon] = useState<string>('50000')
  const [insuranceRateMoto, setInsuranceRateMoto] = useState<string>('50000')
  const [insuranceRateDefault, setInsuranceRateDefault] = useState<string>('30000')

  useEffect(() => {
    if (settings) {
      setDeliveryFeePerKm(parseFloat(settings.deliveryFeePerKm).toString())
      setInsuranceRate50cc(parseFloat(settings.insuranceRate50cc).toString())
      setInsuranceRateTayGa(parseFloat(settings.insuranceRateTayGa).toString())
      setInsuranceRateTayCon(parseFloat(settings.insuranceRateTayCon).toString())
      setInsuranceRateMoto(parseFloat(settings.insuranceRateMoto).toString())
      setInsuranceRateDefault(parseFloat(settings.insuranceRateDefault).toString())
    }
    
  }, [settings])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate({
      deliveryFeePerKm: parseFloat(deliveryFeePerKm),
      insuranceRate50cc: parseFloat(insuranceRate50cc),
      insuranceRateTayGa: parseFloat(insuranceRateTayGa),
      insuranceRateTayCon: parseFloat(insuranceRateTayCon),
      insuranceRateMoto: parseFloat(insuranceRateMoto),
      insuranceRateDefault: parseFloat(insuranceRateDefault),
    })
  }

  return (
    <div className="rounded-lg bg-white border border-gray-200">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-800">
          Cài đặt khoản phí
        </h2>
      </div>
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Delivery Fee */}
          <div className="space-y-2">
            <Label htmlFor="delivery-fee">
              Phí giao xe (VNĐ/km)
            </Label>
            <Input
              id="delivery-fee"
              type="number"
              min="0"
              step="1000"
              value={deliveryFeePerKm}
              onChange={(e) => setDeliveryFeePerKm(e.target.value)}
              placeholder="10000"
              className="max-w-xs"
            />
            <p className="text-xs text-gray-500">
              Phí giao xe hiện tại:{' '}
              <span className="font-semibold">
                {settings
                  ? `${parseFloat(settings.deliveryFeePerKm).toLocaleString('vi-VN')} VNĐ/km`
                  : '—'}
              </span>
            </p>
          </div>

          {/* Insurance Rates */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Phí bảo hiểm theo loại xe (VNĐ/ngày)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insurance-50cc">
                  50cc & Xe số
                </Label>
                <Input
                  id="insurance-50cc"
                  type="number"
                  min="0"
                  step="1000"
                  value={insuranceRate50cc}
                  onChange={(e) => setInsuranceRate50cc(e.target.value)}
                  placeholder="20000"
                />
                {settings && (
                  <p className="text-xs text-gray-500">
                    Hiện tại: {parseFloat(settings.insuranceRate50cc).toLocaleString('vi-VN')} VNĐ/ngày
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance-tayga">
                  Tay ga & Xe điện
                </Label>
                <Input
                  id="insurance-tayga"
                  type="number"
                  min="0"
                  step="1000"
                  value={insuranceRateTayGa}
                  onChange={(e) => setInsuranceRateTayGa(e.target.value)}
                  placeholder="30000"
                />
                {settings && (
                  <p className="text-xs text-gray-500">
                    Hiện tại: {parseFloat(settings.insuranceRateTayGa).toLocaleString('vi-VN')} VNĐ/ngày
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance-taycon">
                  Tay côn
                </Label>
                <Input
                  id="insurance-taycon"
                  type="number"
                  min="0"
                  step="1000"
                  value={insuranceRateTayCon}
                  onChange={(e) => setInsuranceRateTayCon(e.target.value)}
                  placeholder="50000"
                />
                {settings && (
                  <p className="text-xs text-gray-500">
                    Hiện tại: {parseFloat(settings.insuranceRateTayCon).toLocaleString('vi-VN')} VNĐ/ngày
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance-moto">
                  Mô tô
                </Label>
                <Input
                  id="insurance-moto"
                  type="number"
                  min="0"
                  step="1000"
                  value={insuranceRateMoto}
                  onChange={(e) => setInsuranceRateMoto(e.target.value)}
                  placeholder="50000"
                />
                {settings && (
                  <p className="text-xs text-gray-500">
                    Hiện tại: {parseFloat(settings.insuranceRateMoto).toLocaleString('vi-VN')} VNĐ/ngày
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance-default">
                  Mặc định (nếu không set giá trị)
                </Label>
                <Input
                  id="insurance-default"
                  type="number"
                  min="0"
                  step="1000"
                  value={insuranceRateDefault}
                  onChange={(e) => setInsuranceRateDefault(e.target.value)}
                  placeholder="30000"
                />
                {settings && (
                  <p className="text-xs text-gray-500">
                    Hiện tại: {parseFloat(settings.insuranceRateDefault).toLocaleString('vi-VN')} VNĐ/ngày
                  </p>
                )}
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? 'Đang cập nhật...' : 'Cập nhật cài đặt'}
          </Button>
        </form>
      </div>
    </div>
  )
}

