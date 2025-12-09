import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateProfileSchema,
  kycSubmissionSchema,
  UpdateProfileInput,
  KycSubmissionInput,
} from "@/schemas/profile.schema";

/**
 * Hook cho form cập nhật profile
 */
export function useUpdateProfileForm(
  defaultValues?: Partial<UpdateProfileInput>
) {
  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: defaultValues?.firstName || "",
      lastName: defaultValues?.lastName || "",
      avatar: defaultValues?.avatar || "",
      dateOfBirth: defaultValues?.dateOfBirth || "",
      gender: defaultValues?.gender,
      bio: defaultValues?.bio || "",
      address: defaultValues?.address || "",
      cityId: defaultValues?.cityId || "",
      zipCode: defaultValues?.zipCode || "",
      phone: defaultValues?.phone || "",
    },
    mode: "onChange",
  });

  return form;
}

/**
 * Hook cho form KYC submission
 */
export function useKycSubmissionForm() {
  const form = useForm<KycSubmissionInput>({
    resolver: zodResolver(kycSubmissionSchema),
    defaultValues: {
      idNumber: "",
      idCardFrontUrl: "",
      idCardBackUrl: "",
      driverLicenseUrl: "",
      selfieUrl: "",
      notes: "",
    },
    mode: "onChange",
  });

  return form;
}
