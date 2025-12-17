import { Controller } from "react-hook-form";
import { ActivityIndicator, Text, View } from "react-native";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import GalleryField from "@/components/gallery/GalleryField";
import { useKycForm } from "@/hooks/forms/profile.forms";
import { useSubmitKyc } from "@/hooks/auth/auth.mutation";
import { useAuthStore } from "@/store/auth";
import { KYC_STATUS } from "@/constants/kyc.constants";
import { apiUser } from "@/services/api.user";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { LicenseType } from "@/schemas/profile.schema";

export default function KycForm() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  const form = useKycForm();
  const mutation = useSubmitKyc();

  // Lấy dữ liệu KYC hiện có để fill form
  const kycData = user?.kyc;

  // Format date từ ISO string sang format YYYY-MM-DD cho DatePicker
  const formatDateForForm = (dateString: string | null | undefined): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  // Fill form với dữ liệu KYC hiện có khi component mount hoặc kyc data thay đổi
  useEffect(() => {
    if (kycData) {
      form.reset({
        citizenId: kycData.citizenId || "",
        fullNameInId: kycData.fullNameInId || "",
        dob: formatDateForForm(kycData.dob),
        addressInId: kycData.addressInId || "",
        driverLicense: kycData.driverLicense || "",
        licenseType: (kycData.licenseType as LicenseType) || "",
        idCardFront: kycData.idCardFront || "",
        idCardBack: kycData.idCardBack || "",
        licenseFront: kycData.licenseFront || "",
        licenseBack: kycData.licenseBack || "",
        selfieImg: kycData.selfieImg || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kycData?.id]); // Reset form khi kyc id thay đổi

  const kyc = user?.kyc;
  const isFormDisabled =
    kyc?.status === KYC_STATUS.APPROVED || kyc?.status === KYC_STATUS.PENDING;
  const canSubmit =
    !kyc ||
    kyc.status === KYC_STATUS.REJECTED ||
    kyc.status === KYC_STATUS.NEEDS_UPDATE;

  const onSubmit = async (values: any) => {
    // Chuẩn hóa: convert "" -> undefined để backend không validate sai
    const normalize = (v: string | undefined) =>
      v && v.trim().length > 0 ? v.trim() : undefined;

    const payload = {
      citizenId: normalize(values.citizenId),
      fullNameInId: normalize(values.fullNameInId),
      dob: normalize(values.dob),
      addressInId: normalize(values.addressInId),
      driverLicense: normalize(values.driverLicense),
      licenseType: normalize(values.licenseType),
      idCardFront: normalize(values.idCardFront),
      idCardBack: normalize(values.idCardBack),
      licenseFront: normalize(values.licenseFront),
      licenseBack: normalize(values.licenseBack),
      selfieImg: normalize(values.selfieImg),
    };

    try {
      await mutation.mutateAsync(payload);
      // Sau khi submit thành công, lấy thông tin user mới nhất và sync store
      try {
        const updatedUser = await apiUser.getUserInfo();
        updateUser(updatedUser);
        // Invalidate query để refresh data
        queryClient.invalidateQueries({ queryKey: ["user", "sync"] });
      } catch (error) {
        console.error("Failed to sync user info after KYC submission:", error);
      }
    } catch (error) {
      // Error đã được handle trong useSubmitKyc hook
      console.error("KYC submission error:", error);
    }
  };

  return (
    <>
      {!isFormDisabled && (
        <Text className="text-base text-gray-600 mb-4">
          Vui lòng cung cấp thông tin và hình ảnh giấy tờ để xác thực danh tính.
        </Text>
      )}

      {isFormDisabled && (
        <View className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
          <Text className="text-sm text-gray-600">
            {kyc?.status === KYC_STATUS.APPROVED
              ? "Hồ sơ KYC của bạn đã được duyệt. Bạn không thể chỉnh sửa thông tin."
              : "Hồ sơ KYC của bạn đang được xem xét. Vui lòng chờ phản hồi từ hệ thống."}
          </Text>
        </View>
      )}

      <Controller
        control={form.control}
        name="citizenId"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <Input
            label="Số CMND/CCCD"
            placeholder="Nhập số CMND/CCCD"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            editable={!isFormDisabled}
          />
        )}
      />

      <Controller
        control={form.control}
        name="fullNameInId"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <Input
            label="Họ tên theo CMND/CCCD"
            placeholder="Nhập họ tên đúng như trên giấy tờ"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            editable={!isFormDisabled}
          />
        )}
      />

      <Controller
        control={form.control}
        name="dob"
        render={({ field: { value, onChange }, fieldState: { error } }) => (
          <View
            pointerEvents={isFormDisabled ? "none" : "auto"}
            style={{ opacity: isFormDisabled ? 0.6 : 1 }}
          >
            <DatePicker
              label="Ngày sinh"
              value={value}
              onChange={onChange}
              error={error?.message}
              mode="date"
              allowClear={true}
            />
          </View>
        )}
      />

      <Controller
        control={form.control}
        name="addressInId"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <Input
            label="Địa chỉ trên CMND/CCCD"
            placeholder="Nhập địa chỉ"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            editable={!isFormDisabled}
          />
        )}
      />

      <Controller
        control={form.control}
        name="driverLicense"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <Input
            label="Số giấy phép lái xe"
            placeholder="Nhập số GPLX"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            editable={!isFormDisabled}
          />
        )}
      />

      <Controller
        control={form.control}
        name="licenseType"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <Select
              label="Hạng GPLX (A1, A2, ...)"
              placeholder="Chọn hạng GPLX"
              options={[
                { label: "A1 - Xe máy dưới 175cc", value: "A1" },
                { label: "A2 - Xe máy trên 175cc", value: "A2" },
                { label: "A3 - Xe 3 bánh", value: "A3" },
                { label: "A4 - Máy kéo đến 1000kg", value: "A4" },
              ]}
              value={value || undefined}
              onValueChange={(val) => onChange(val)}
              disabled={isFormDisabled}
            />
            {error?.message ? (
              <Text className="mt-1 text-xs text-red-500">{error.message}</Text>
            ) : null}
          </>
        )}
      />

      <Controller
        control={form.control}
        name="idCardFront"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <View
            pointerEvents={isFormDisabled ? "none" : "auto"}
            style={{ opacity: isFormDisabled ? 0.6 : 1 }}
          >
            <GalleryField
              label="Ảnh CMND/CCCD mặt trước"
              folder="kyc-id-card"
              multiple={false}
              value={value ?? ""}
              onChange={onChange}
              error={error?.message}
            />
          </View>
        )}
      />

      <Controller
        control={form.control}
        name="idCardBack"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <View
            pointerEvents={isFormDisabled ? "none" : "auto"}
            style={{ opacity: isFormDisabled ? 0.6 : 1 }}
          >
            <GalleryField
              label="Ảnh CMND/CCCD mặt sau"
              folder="kyc-id-card"
              multiple={false}
              value={value ?? ""}
              onChange={onChange}
              error={error?.message}
            />
          </View>
        )}
      />

      <Controller
        control={form.control}
        name="licenseFront"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <View
            pointerEvents={isFormDisabled ? "none" : "auto"}
            style={{ opacity: isFormDisabled ? 0.6 : 1 }}
          >
            <GalleryField
              label="Ảnh GPLX mặt trước"
              folder="kyc-license"
              multiple={false}
              value={value ?? ""}
              onChange={onChange}
              error={error?.message}
            />
          </View>
        )}
      />

      <Controller
        control={form.control}
        name="licenseBack"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <View
            pointerEvents={isFormDisabled ? "none" : "auto"}
            style={{ opacity: isFormDisabled ? 0.6 : 1 }}
          >
            <GalleryField
              label="Ảnh GPLX mặt sau"
              folder="kyc-license"
              multiple={false}
              value={value ?? ""}
              onChange={onChange}
              error={error?.message}
            />
          </View>
        )}
      />

      <Controller
        control={form.control}
        name="selfieImg"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <View
            pointerEvents={isFormDisabled ? "none" : "auto"}
            style={{ opacity: isFormDisabled ? 0.6 : 1 }}
          >
            <GalleryField
              label="Ảnh selfie với giấy tờ"
              folder="kyc-selfie"
              multiple={false}
              value={value ?? ""}
              onChange={onChange}
              error={error?.message}
            />
          </View>
        )}
      />

      {canSubmit && (
        <Button
          onPress={form.handleSubmit(onSubmit)}
          disabled={mutation.isPending || isFormDisabled}
          className="mt-4"
          size="lg"
        >
          {mutation.isPending ? (
            <ActivityIndicator color="#FFF" />
          ) : kyc?.status === KYC_STATUS.REJECTED ||
            kyc?.status === KYC_STATUS.NEEDS_UPDATE ? (
            "Cập nhật và gửi lại"
          ) : (
            "Gửi xác thực KYC"
          )}
        </Button>
      )}
    </>
  );
}
