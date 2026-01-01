import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface TopVehiclesTableProps {
  data: Array<{
    vehicleId: string
    brand: string
    model: string
    licensePlate: string
    rentalCount: number
    totalRevenue: string
  }>
}

export function TopVehiclesTable({ data }: TopVehiclesTableProps) {
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(parseFloat(amount))
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Top xe được thuê nhiều nhất
        </h2>
      </div>
      <div className="overflow-auto max-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Xe</TableHead>
              <TableHead>Biển số</TableHead>
              <TableHead>Số lần thuê</TableHead>
              <TableHead>Doanh thu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              data.map((vehicle, index) => (
                <TableRow key={vehicle.vehicleId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">
                        #{index + 1}
                      </span>
                      <span className="font-medium">
                        {vehicle.brand} {vehicle.model}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {vehicle.licensePlate}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {vehicle.rentalCount}
                  </TableCell>
                  <TableCell className="font-medium text-green-600">
                    {formatCurrency(vehicle.totalRevenue)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

