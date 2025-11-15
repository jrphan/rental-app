import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  kycReviewSchema,
  kycRejectSchema,
  ownerReviewSchema,
  KycReviewInput,
  KycRejectInput,
  OwnerReviewInput,
} from '@/schemas/review.schema'

/**
 * Hook cho form review KYC (approve - optional notes)
 */
export function useKycReviewForm() {
  const form = useForm<KycReviewInput>({
    resolver: zodResolver(kycReviewSchema),
    defaultValues: {
      reviewNotes: '',
    },
    mode: 'onChange',
  })

  return form
}

/**
 * Hook cho form reject KYC (required notes)
 */
export function useKycRejectForm() {
  const form = useForm<KycRejectInput>({
    resolver: zodResolver(kycRejectSchema),
    defaultValues: {
      reviewNotes: '',
    },
    mode: 'onChange',
  })

  return form
}

/**
 * Hook cho form review Owner Application (reject - optional notes)
 */
export function useOwnerReviewForm() {
  const form = useForm<OwnerReviewInput>({
    resolver: zodResolver(ownerReviewSchema),
    defaultValues: {
      reviewNotes: '',
    },
    mode: 'onChange',
  })

  return form
}
