import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator } from "react-native";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User } from "@/types/auth.types";
import { useUpdateProfile } from "@/hooks/auth/auth.mutation";
import { editProfileSchema, EditProfileInput } from "@/schemas/profile.schema";
import GalleryField from "@/components/gallery/GalleryField";

interface EditProfileFormProps {
  user: User | null;
}

export default function EditProfileForm({ user }: EditProfileFormProps) {
  const form = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      avatar: user?.avatar || "",
    },
  });

  const mutation = useUpdateProfile();

  const onSubmit = (data: EditProfileInput) => {
    const normalizeOptional = (value: string | null | undefined) => {
      if (!value) return null;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const payload = {
      fullName: data.fullName.trim(),
      email: normalizeOptional(data.email),
      avatar: normalizeOptional(data.avatar),
    };

    mutation.mutate(payload);
  };

  return (
    <>
      <Controller
        control={form.control}
        name="fullName"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <Input
            label="Họ và tên"
            placeholder="Nhập họ và tên"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            editable={!mutation.isPending}
          />
        )}
      />

      <Controller
        control={form.control}
        name="email"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <Input
            label="Email"
            placeholder="Nhập email"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            editable={!mutation.isPending}
          />
        )}
      />

      <Controller
        control={form.control}
        name="avatar"
        render={({
          field: { onChange, value },
          fieldState: { error },
        }) => (
          <GalleryField
            label="Ảnh đại diện"
            folder="avatar"
            multiple={false}
            value={value ?? ""}
            onChange={onChange}
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
          "Lưu thay đổi"
        )}
      </Button>
    </>
  );
}
