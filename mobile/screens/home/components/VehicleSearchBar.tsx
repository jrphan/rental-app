import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { COLORS } from "@/constants/colors";
import { Select } from "@/components/ui/select";
import { VIETNAM_CITIES } from "@/constants/city.constants";
import { DatePicker } from "@/components/ui/date-picker";

interface VehicleSearchBarProps {
  onSearch: (filters: {
    search?: string;
    city?: string;
    district?: string;
    startDate?: Date;
    endDate?: Date;
    lat?: number;
    lng?: number;
    radius?: number;
  }) => void;
  onCityChange?: (city: string) => void;
  onLocationChange?: (lat: number, lng: number) => void;
  onDateRangeChange?: (startDate?: Date, endDate?: Date) => void;
  location?: { city?: string; district?: string; lat?: number; lng?: number };
  dateRange?: { startDate?: Date; endDate?: Date };
}

export default function VehicleSearchBar({
  onSearch,
  onCityChange,
  onLocationChange,
  onDateRangeChange,
  location,
  dateRange,
}: VehicleSearchBarProps) {
  const [searchText, setSearchText] = useState("");

  const handleSearch = () => {
    onSearch({
      search: searchText || undefined,
      city: location?.city,
      district: location?.district,
      startDate: dateRange?.startDate,
      endDate: dateRange?.endDate,
      lat: location?.lat,
      lng: location?.lng,
      radius: location?.lat && location?.lng ? 10 : undefined,
    });
  };

  const formatDateForPicker = (date?: Date): string => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseDateFromPicker = (value: string): Date | undefined => {
    if (!value) return undefined;
    const date = new Date(value);
    if (isNaN(date.getTime())) return undefined;
    return date;
  };

  const handleStartDateChange = (value: string) => {
    const date = parseDateFromPicker(value);
    // Nếu chọn startDate sau endDate, tự động điều chỉnh endDate
    let newEndDate = dateRange?.endDate;
    if (date && dateRange?.endDate && date > dateRange.endDate) {
      newEndDate = undefined; // Xóa endDate nếu startDate > endDate
    }
    onDateRangeChange?.(date, newEndDate);
  };

  const handleEndDateChange = (value: string) => {
    const date = parseDateFromPicker(value);
    // Validation: endDate phải >= startDate
    if (date && dateRange?.startDate && date < dateRange.startDate) {
      // Nếu endDate < startDate, không cho phép và giữ nguyên endDate cũ
      return;
    }
    onDateRangeChange?.(dateRange?.startDate, date);
  };

  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-200 mt-4">
      {/* Search Input */}
      <View className="border border-gray-200 flex-row items-center bg-gray-50 rounded-xl px-4 py-3 mb-3">
        <MaterialIcons name="search" size={24} color="#6B7280" />
        <TextInput
          className="flex-1 ml-3 text-base text-gray-900"
          placeholder="Tìm kiếm thông tin xe..."
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <MaterialIcons name="clear" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Date Range Picker */}
      <View className="flex-row gap-2">
        <View className="flex-1">
          <DatePicker
            label="Từ ngày"
            value={formatDateForPicker(dateRange?.startDate)}
            onChange={handleStartDateChange}
            placeholder="Chọn ngày"
            mode="date"
            allowClear
            minimumDate={new Date()} // Không cho chọn ngày quá khứ
          />
        </View>
        <View className="flex-1">
          <DatePicker
            label="Đến ngày"
            value={formatDateForPicker(dateRange?.endDate)}
            onChange={handleEndDateChange}
            placeholder="Chọn ngày"
            mode="date"
            allowClear
            minimumDate={dateRange?.startDate || new Date()} // Phải >= startDate hoặc hôm nay
          />
          {dateRange?.startDate &&
            dateRange?.endDate &&
            dateRange.endDate < dateRange.startDate && (
              <Text className="mt-1 text-xs text-red-500">
                Ngày kết thúc phải sau ngày bắt đầu
              </Text>
            )}
        </View>
      </View>

      {/* Filters */}
      <View className="flex-row gap-2 mb-4">
        <View className="flex-1">
          <Select
            label=""
            options={VIETNAM_CITIES}
            value={location?.city}
            onValueChange={(city) => {
              onCityChange?.(city);
            }}
            placeholder="Chọn thành phố"
          />
        </View>
      </View>

      {/* Search Button */}
      <TouchableOpacity
        onPress={handleSearch}
        className="mt-3 bg-primary rounded-xl py-3 flex-row items-center justify-center"
        style={{ backgroundColor: COLORS.primary }}
      >
        <MaterialIcons name="search" size={20} color="#FFFFFF" />
        <Text className="ml-2 text-white font-semibold text-base">
          Tìm kiếm
        </Text>
      </TouchableOpacity>
    </View>
  );
}
