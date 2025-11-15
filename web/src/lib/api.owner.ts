import { apiClient } from './api'

export type OwnerApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface OwnerApplication {
  id: string
  userId: string
  status: OwnerApplicationStatus
  notes?: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    email: string
    phone?: string | null
    role: string
    createdAt: string
  }
}

export interface OwnerApplicationListResponse {
  data: OwnerApplication[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export const ownerApi = {
  async listOwnerApplications(
    status?: OwnerApplicationStatus,
    page = 1,
    limit = 10,
  ): Promise<OwnerApplicationListResponse> {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    params.set('page', String(page))
    params.set('limit', String(limit))

    const res = await apiClient.get<OwnerApplication[]>(
      `/users/owner-applications?${params.toString()}`,
    )
    if (res.success && res.data && (res as any).pagination) {
      const pagination = (res as any).pagination
      return {
        data: res.data,
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
      }
    }
    throw new Error(res.message || 'Lấy danh sách yêu cầu chủ xe thất bại')
  },

  async approveOwnerApplication(applicationId: string) {
    const res = await apiClient.post<OwnerApplication>(
      `/users/owner-applications/${applicationId}/approve`,
    )
    if (res.success && res.data) return res.data
    throw new Error(res.message || 'Duyệt yêu cầu chủ xe thất bại')
  },

  async rejectOwnerApplication(applicationId: string, notes?: string) {
    const res = await apiClient.post<OwnerApplication>(
      `/users/owner-applications/${applicationId}/reject`,
      { notes },
    )
    if (res.success && res.data) return res.data
    throw new Error(res.message || 'Từ chối yêu cầu chủ xe thất bại')
  },
}
