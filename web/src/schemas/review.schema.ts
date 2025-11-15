import { z } from 'zod'

/**
 * Schema cho form review KYC (approve/reject)
 */
export const kycReviewSchema = z.object({
  reviewNotes: z
    .string()
    .max(500, 'Ghi chú không được vượt quá 500 ký tự')
    .optional()
    .or(z.literal('')),
})

export type KycReviewInput = z.infer<typeof kycReviewSchema>

/**
 * Schema cho form reject KYC (bắt buộc có reviewNotes)
 */
export const kycRejectSchema = z.object({
  reviewNotes: z
    .string()
    .min(1, 'Vui lòng nhập lý do từ chối')
    .max(500, 'Lý do từ chối không được vượt quá 500 ký tự'),
})

export type KycRejectInput = z.infer<typeof kycRejectSchema>

/**
 * Schema cho form review Owner Application (reject)
 */
export const ownerReviewSchema = z.object({
  reviewNotes: z
    .string()
    .max(500, 'Ghi chú không được vượt quá 500 ký tự')
    .optional()
    .or(z.literal('')),
})

export type OwnerReviewInput = z.infer<typeof ownerReviewSchema>
