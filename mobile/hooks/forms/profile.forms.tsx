import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateProfileSchema,
  kycFormSchema,
  UpdateProfileInput,
  KycFormInput,
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
export function useKycForm(defaultValues?: Partial<KycFormInput>) {
  const form = useForm<KycFormInput>({
    resolver: zodResolver(kycFormSchema),
    defaultValues: {
      citizenId: defaultValues?.citizenId || "",
      fullNameInId: defaultValues?.fullNameInId || "",
      dob: defaultValues?.dob || "",
      addressInId: defaultValues?.addressInId || "",
      driverLicense: defaultValues?.driverLicense || "",
      licenseType: defaultValues?.licenseType || "",
      idCardFront: defaultValues?.idCardFront || "",
      idCardBack: defaultValues?.idCardBack || "",
      licenseFront: defaultValues?.licenseFront || "",
      licenseBack: defaultValues?.licenseBack || "",
      selfieImg: defaultValues?.selfieImg || "",
    },
    mode: "onChange",
  });

  return form;
}
