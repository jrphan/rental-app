import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  Dimensions, // <--- THÊM Dimensions
  Platform, // <--- THÊM Platform để fix style nếu cần
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { vehiclesApi } from "@/lib/api.vehicles";
import { VehicleCard } from "@/components/vehicle/vehicle-card";
import { useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SearchForm } from "@/components/search/search-form";

//  SỬA ĐỔI 1: Import chuẩn, bỏ đoạn try-catch require cũ đi
import MultiSlider from "@ptomasroos/react-native-multi-slider";

// Tính toán chiều rộng cho Slider (Màn hình - 40px padding của Modal)
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDER_WIDTH = SCREEN_WIDTH - 40 - 40; // Trừ padding modal (20*2) và padding trong (nếu có)

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    location?: string;
    startDate?: string;
    endDate?: string;
    cityId?: string;
  }>();

  // ... (Giữ nguyên các phần state filter, cityId, vehicleTypes...)
  const [filter, setFilter] = useState<{
    sort?: "price_asc" | "price_desc" | "distance" | "rating";
    vehicleTypeIds?: string[];
    minPrice?: number;
    maxPrice?: number;
  }>({});
  const [cityId, setCityId] = useState<string | undefined>(
    (params as any).cityId
  );

  const { data: vehicleTypes } = useQuery({
    queryKey: ["vehicle-types"],
    queryFn: () => vehiclesApi.getTypes(),
    staleTime: 1000 * 60 * 5,
  });

  const [page] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(
    params.location || "TP. Hồ Chí Minh"
  );
  const [startDate, setStartDate] = useState(
    params.startDate ? new Date(params.startDate) : new Date()
  );
  const [endDate, setEndDate] = useState(
    params.endDate
      ? new Date(params.endDate)
      : new Date(Date.now() + 24 * 60 * 60 * 1000)
  );
  const [showFilter, setShowFilter] = useState(false);

  // ... (Giữ nguyên useQuery data, hasFilterChanged, onRefresh, handleSearch...)
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "vehicles-search",
      {
        page,
        location,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        cityId,
        filter,
      },
    ],
    queryFn: () =>
      vehiclesApi.listPublic({
        page,
        limit: 20,
        cityId,
        vehicleTypeIds: filter.vehicleTypeIds,
        minPrice: filter.minPrice,
        maxPrice: filter.maxPrice,
        sort: filter.sort,
      }),
    enabled: true,
  });

  const hasFilterChanged = !!(
    filter.sort ||
    (filter.vehicleTypeIds && filter.vehicleTypeIds.length) ||
    filter.minPrice ||
    filter.maxPrice
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSearch = (searchParams: {
    location: string;
    startDate: Date;
    endDate: Date;
    cityId?: string;
  }) => {
    setLocation(searchParams.location);
    setStartDate(searchParams.startDate);
    setEndDate(searchParams.endDate);
    if (searchParams.cityId) setCityId(searchParams.cityId);
  };

  const applyFilter = (newFilter: typeof filter) => {
    setFilter(newFilter);
    setShowFilter(false);
    refetch();
  };

  // State tạm thời để kéo thả mượt mà hơn (tránh re-render toàn bộ list khi đang kéo)
  const [multiSliderValue, setMultiSliderValue] = useState([
    filter.minPrice ?? 0,
    filter.maxPrice ?? 2000000,
  ]);

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={["top", "left", "right"]}
    >
      <View className="flex-1">
        {/* ... (Giữ nguyên phần Header và List xe) ... */}
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 -ml-2"
            >
              <MaterialIcons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <View className="flex-1 items-center">
              <Text className="text-xl font-bold text-gray-900">
                Tìm kiếm xe
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowFilter(true)}
              className="p-2"
            >
              <MaterialIcons
                name="filter-list"
                size={24}
                color={hasFilterChanged ? "#EF4444" : "#111827"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle List with Search Form */}
        {isLoading && !data ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-600">Đang tải kết quả...</Text>
          </View>
        ) : !data?.items || data.items.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <MaterialIcons name="search-off" size={64} color="#9CA3AF" />
            <Text className="mt-4 text-lg font-semibold text-gray-900">
              Không tìm thấy xe
            </Text>
            <Text className="mt-2 text-center text-gray-600">
              Không có xe nào phù hợp với tiêu chí tìm kiếm của bạn
            </Text>
          </View>
        ) : (
          <FlatList
            data={data.items}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
              <>
                <View className="pt-4">
                  <SearchForm
                    initialLocation={location}
                    initialStartDate={startDate}
                    initialEndDate={endDate}
                    onSearch={handleSearch}
                  />
                </View>
                {/* Results Header */}
                <View className="px-6 py-3 bg-white border-b border-gray-200">
                  <Text className="text-base font-semibold text-gray-900">
                    {data?.total
                      ? `${data.total} xe được tìm thấy`
                      : "Đang tìm kiếm..."}
                  </Text>
                </View>
              </>
            }
            renderItem={({ item }) => (
              <View className="px-6">
                <VehicleCard vehicle={item} />
              </View>
            )}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilter}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilter(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowFilter(false)}
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.45)",
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#fff",
              padding: 20,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              minHeight: "80%", // Chiều cao modal
            }}
          >
            {/* Header with close icon */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 22, fontWeight: "700" }}>Bộ lọc</Text>
              <TouchableOpacity
                onPress={() => setShowFilter(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#F3F4F6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Sort Section */}
              <Text
                style={{ marginBottom: 8, fontWeight: "600", fontSize: 16 }}
              >
                Sắp xếp
              </Text>
              {[
                { key: "price_asc", label: "Giá tăng dần" },
                { key: "price_desc", label: "Giá giảm dần" },
                { key: "distance", label: "Khoảng cách" },
                { key: "rating", label: "Đánh giá" },
              ].map((s) => {
                const selected = filter.sort === s.key;
                return (
                  <TouchableOpacity
                    key={s.key}
                    onPress={() =>
                      setFilter((f) => ({ ...f, sort: s.key as any }))
                    }
                    style={{
                      paddingVertical: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? "#EA580C" : "#111",
                        fontSize: 16,
                      }}
                    >
                      {s.label}
                    </Text>
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        borderWidth: 1,
                        borderColor: selected ? "#EA580C" : "#D1D5DB",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {selected && (
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: "#EA580C",
                          }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Vehicle types */}
              <Text
                style={{
                  marginTop: 18,
                  marginBottom: 8,
                  fontWeight: "600",
                  fontSize: 16,
                }}
              >
                Loại xe
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {vehicleTypes?.map((t: any) => {
                  const selected = filter.vehicleTypeIds?.includes(t.id);
                  return (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => {
                        setFilter((cur) => {
                          const ids = cur.vehicleTypeIds || [];
                          return {
                            ...cur,
                            vehicleTypeIds: ids.includes(t.id)
                              ? ids.filter((x) => x !== t.id)
                              : [...ids, t.id],
                          };
                        });
                      }}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: selected ? "#EA580C" : "#DDD",
                        backgroundColor: selected ? "#FFF7ED" : "#FFF", // Thêm màu nền nhạt
                        margin: 4,
                      }}
                    >
                      <Text style={{ color: selected ? "#EA580C" : "#000" }}>
                        {t.description || t.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Price range with MultiSlider */}
              <Text
                style={{
                  marginTop: 18,
                  marginBottom: 8,
                  fontWeight: "600",
                  fontSize: 16,
                }}
              >
                Khoảng giá (VND) mỗi ngày
              </Text>
              <View
                style={{ paddingHorizontal: 10, alignItems: "center" }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: "#EA580C",
                    marginBottom: 10,
                    fontWeight: "500",
                  }}
                >
                  {multiSliderValue[0].toLocaleString("vi-VN")} đ -{" "}
                  {multiSliderValue[1].toLocaleString("vi-VN")} đ
                </Text>

                {/* 👇 SỬA ĐỔI 2: Component MultiSlider Chính thức */}
                <MultiSlider
                  values={[
                    filter.minPrice ?? 0,
                    filter.maxPrice ?? 2000000,
                  ]}
                  sliderLength={SLIDER_WIDTH} // Chiều rộng slider
                  onValuesChange={(values) => setMultiSliderValue(values)} // Cập nhật UI khi đang kéo
                  onValuesChangeFinish={(values) =>
                    setFilter((f) => ({
                      ...f,
                      minPrice: values[0],
                      maxPrice: values[1],
                    }))
                  } // Chỉ update filter khi thả tay ra (tối ưu performace)
                  min={0}
                  max={2000000}
                  step={50000}
                  allowOverlap={false} // Không cho 2 nút chồng lên nhau
                  snapped
                  // Custom Style cho giống design system của app
                  selectedStyle={{
                    backgroundColor: "#EA580C", // Màu cam cho đoạn giữa
                  }}
                  unselectedStyle={{
                    backgroundColor: "#E5E7EB", // Màu xám cho đoạn chưa chọn
                  }}
                  containerStyle={{
                    height: 40,
                  }}
                  trackStyle={{
                    height: 4,
                    borderRadius: 2,
                  }}
                  markerStyle={{
                    backgroundColor: "#FFFFFF",
                    height: 24,
                    width: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: "#EA580C",
                    shadowColor: "#000",
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                  }}
                />
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 18,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setFilter({});
                  setMultiSliderValue([0, 2000000]); // Reset cả slider visual
                }}
                style={{ padding: 12 }}
              >
                <Text style={{ color: "#6B7280", fontSize: 16 }}>
                  Đặt lại
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => applyFilter(filter)}
                style={{
                  backgroundColor: "#EA580C",
                  paddingVertical: 12,
                  paddingHorizontal: 32,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Áp dụng
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}