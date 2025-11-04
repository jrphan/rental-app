import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { vehiclesApi } from "@/lib/api.vehicles";
import { useToast } from "@/lib/toast";

export default function VehicleCreateScreen() {
  const router = useRouter();
  const toast = useToast();
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("2020");
  const [color, setColor] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [dailyRate, setDailyRate] = useState("200000");
  const [depositAmount, setDepositAmount] = useState("1000000");

  const createMutation = useMutation({
    mutationFn: async () =>
      vehiclesApi.create({
        vehicleTypeId: "car",
        brand,
        model,
        year: Number(year),
        color,
        licensePlate,
        dailyRate: Number(dailyRate),
        depositAmount: Number(depositAmount),
      } as any),
    onSuccess: () => {
      toast.showSuccess("Đã tạo xe (DRAFT)", { title: "Thành công" });
      router.back();
    },
    onError: (e: any) => {
      toast.showError(e?.message || "Tạo xe thất bại", { title: "Lỗi" });
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <ScrollView
        className="px-6"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="flex-row items-center mb-6 pt-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-base text-gray-900">‹ Quay lại</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Đăng xe mới</Text>
        </View>
        <View className="gap-4">
          <TextInput
            placeholder="Hãng"
            className="border border-gray-300 rounded-lg px-4 py-3"
            value={brand}
            onChangeText={setBrand}
          />
          <TextInput
            placeholder="Dòng xe"
            className="border border-gray-300 rounded-lg px-4 py-3"
            value={model}
            onChangeText={setModel}
          />
          <TextInput
            placeholder="Năm"
            keyboardType="numeric"
            className="border border-gray-300 rounded-lg px-4 py-3"
            value={year}
            onChangeText={setYear}
          />
          <TextInput
            placeholder="Màu"
            className="border border-gray-300 rounded-lg px-4 py-3"
            value={color}
            onChangeText={setColor}
          />
          <TextInput
            placeholder="Biển số"
            className="border border-gray-300 rounded-lg px-4 py-3"
            value={licensePlate}
            onChangeText={setLicensePlate}
          />
          <TextInput
            placeholder="Giá ngày (đ)"
            keyboardType="numeric"
            className="border border-gray-300 rounded-lg px-4 py-3"
            value={dailyRate}
            onChangeText={setDailyRate}
          />
          <TextInput
            placeholder="Tiền cọc (đ)"
            keyboardType="numeric"
            className="border border-gray-300 rounded-lg px-4 py-3"
            value={depositAmount}
            onChangeText={setDepositAmount}
          />
        </View>
        <TouchableOpacity
          className="mt-6 bg-orange-600 rounded-lg px-4 py-3 items-center"
          onPress={() => createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          <Text className="text-white font-semibold">Tạo xe</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
