import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { kycFormSchema, KycFormInput } from "@/schemas/profile.schema";

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
