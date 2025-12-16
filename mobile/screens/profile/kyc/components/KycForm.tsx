import { Controller } from "react-hook-form";
import { ActivityIndicator, Text } from "react-native";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useKycForm } from "@/hooks/forms/profile.forms";
import { useSubmitKyc } from "@/hooks/auth/auth.mutation";

export default function KycForm() {
  const form = useKycForm();
  const mutation = useSubmitKyc();

  const onSubmit = (values: any) => {
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

    mutation.mutate(payload);
  };

  return (
    <>
      <Text className="text-base text-gray-600 mb-4">
        Vui lòng cung cấp thông tin và hình ảnh giấy tờ để xác thực danh tính.
      </Text>

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
          />
        )}
      />

      <Controller
        control={form.control}
        name="dob"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <Input
            label="Ngày sinh"
            placeholder="YYYY-MM-DD"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
          />
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
          />
        )}
      />

      <Controller
        control={form.control}
        name="licenseType"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <Input
            label="Hạng GPLX (A1, A2, ...)"
            placeholder="VD: A1"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
          />
        )}
      />

      <Controller
        control={form.control}
        name="idCardFront"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <Input
            label="Ảnh CMND/CCCD mặt trước (URL)"
            placeholder="Nhập đường dẫn ảnh"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
          />
        )}
      />

      <Controller
        control={form.control}
        name="idCardBack"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <Input
            label="Ảnh CMND/CCCD mặt sau (URL)"
            placeholder="Nhập đường dẫn ảnh"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
          />
        )}
      />

      <Controller
        control={form.control}
        name="licenseFront"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <Input
            label="Ảnh GPLX mặt trước (URL)"
            placeholder="Nhập đường dẫn ảnh"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
          />
        )}
      />

      <Controller
        control={form.control}
        name="licenseBack"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <Input
            label="Ảnh GPLX mặt sau (URL)"
            placeholder="Nhập đường dẫn ảnh"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
          />
        )}
      />

      <Controller
        control={form.control}
        name="selfieImg"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <Input
            label="Ảnh selfie với giấy tờ (URL)"
            placeholder="Nhập đường dẫn ảnh"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
          />
        )}
      />

      <Button
        onPress={form.handleSubmit(onSubmit)}
        disabled={mutation.isPending}
        className="mt-4"
        size="lg"
      >
        {mutation.isPending ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          "Gửi xác thực KYC"
        )}
      </Button>
    </>
  );
}
