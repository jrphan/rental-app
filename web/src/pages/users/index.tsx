import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { adminUsersApi } from '@/services/api.admin-users'
import type {
  AdminUserListResponse,
  KycStatus,
  UserRole,
} from '@/types/auth.types'
import { UsersListTable } from './list'

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>()
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>()
  const [phoneVerifiedFilter, setPhoneVerifiedFilter] = useState<
    boolean | undefined
  >()
  const [kycStatusFilter, setKycStatusFilter] = useState<KycStatus | undefined>()
  const [search, setSearch] = useState('')

  const { data, isLoading, isError, refetch, isFetching } =
    useQuery<AdminUserListResponse>({
      queryKey: [
        'adminUsers',
        {
          page,
          limit,
          role: roleFilter,
          isActive: activeFilter,
          isPhoneVerified: phoneVerifiedFilter,
          kycStatus: kycStatusFilter,
          search,
        },
      ],
      queryFn: () =>
        adminUsersApi.list({
          page,
          limit,
          role: roleFilter,
          isActive: activeFilter,
          isPhoneVerified: phoneVerifiedFilter,
          kycStatus: kycStatusFilter,
          search,
        }),
    })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const currentPage = data?.page ?? page
  const pageSize = data?.limit ?? limit

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    setPage(newPage)
  }

  const handleChangeFilters = (updates: {
    role?: UserRole | 'all'
    isActive?: boolean | 'all'
    isPhoneVerified?: boolean | 'all'
    kycStatus?: KycStatus | 'all'
    search?: string
  }) => {
    if ('role' in updates) {
      setRoleFilter(updates.role === 'all' ? undefined : (updates.role as UserRole))
    }
    if ('isActive' in updates) {
      setActiveFilter(
        updates.isActive === 'all' ? undefined : (updates.isActive as boolean),
      )
    }
    if ('isPhoneVerified' in updates) {
      setPhoneVerifiedFilter(
        updates.isPhoneVerified === 'all'
          ? undefined
          : (updates.isPhoneVerified as boolean),
      )
    }
    if ('kycStatus' in updates) {
      setKycStatusFilter(
        updates.kycStatus === 'all'
          ? undefined
          : (updates.kycStatus as KycStatus),
      )
    }
    if ('search' in updates && typeof updates.search === 'string') {
      setSearch(updates.search)
    }
    setPage(1)
  }

  return (
    <div className="rounded-lg bg-white border border-gray-200 h-fit">
      <UsersListTable
        items={items}
        isLoading={isLoading}
        isError={isError}
        isFetching={isFetching}
        onRefetch={() => refetch()}
        page={currentPage}
        limit={pageSize}
        total={total}
        onPageChange={handlePageChange}
        filters={{
          role: roleFilter,
          isActive: activeFilter,
          isPhoneVerified: phoneVerifiedFilter,
          kycStatus: kycStatusFilter,
          search,
        }}
        onChangeFilters={handleChangeFilters}
      />
    </div>
  )
}
