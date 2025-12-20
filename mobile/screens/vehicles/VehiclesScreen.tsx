import { useState } from "react";
import {
  StatusBar,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Tabs } from "@/components/ui/tabs";
import VehiclesList from "./components/VehiclesList";
import RentalsList from "./components/RentalsList";
import { vehicleStatusLabels, rentalStatusLabels } from "./types";
import type { Vehicle, Rental } from "./types";
import HeaderBase from "@/components/header/HeaderBase";
import { useQuery } from "@tanstack/react-query";
import { apiVehicle } from "@/services/api.vehicle";
import { COLORS } from "@/constants/colors";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function VehiclesScreen() {
  const router = useRouter();
  const [activeMainTab, setActiveMainTab] = useState("vehicles");
  const [activeVehicleStatus, setActiveVehicleStatus] = useState("ALL");
  const [activeRentalStatus, setActiveRentalStatus] = useState("CONFIRMED");

  // Fetch all vehicles from API
  const {
    data: vehiclesData,
    isLoading: isLoadingVehicles,
    isError: isErrorVehicles,
  } = useQuery({
    queryKey: ["myVehicles", "ALL"],
    queryFn: () => apiVehicle.getMyVehicles(), // Fetch all vehicles (no status filter)
  });

  const allVehicles = vehiclesData?.items || [];

  const vehicleStatusTabs = [
    { label: "Tất cả", value: "ALL" },
    { label: vehicleStatusLabels.PENDING, value: "PENDING" },
    { label: vehicleStatusLabels.APPROVED, value: "APPROVED" },
    { label: vehicleStatusLabels.REJECTED, value: "REJECTED" },
    { label: vehicleStatusLabels.MAINTENANCE, value: "MAINTENANCE" },
    { label: vehicleStatusLabels.HIDDEN, value: "HIDDEN" },
  ];

  const rentalStatusTabs = [
    { label: "Tất cả", value: "ALL" },
    { label: rentalStatusLabels.PENDING_PAYMENT, value: "PENDING_PAYMENT" },
    { label: rentalStatusLabels.AWAIT_APPROVAL, value: "AWAIT_APPROVAL" },
    { label: rentalStatusLabels.CONFIRMED, value: "CONFIRMED" },
    { label: rentalStatusLabels.ON_TRIP, value: "ON_TRIP" },
    { label: rentalStatusLabels.COMPLETED, value: "COMPLETED" },
    { label: rentalStatusLabels.CANCELLED, value: "CANCELLED" },
    { label: rentalStatusLabels.DISPUTED, value: "DISPUTED" },
  ];

  // Filter vehicles by status
  const getVehiclesByStatus = (status: string): Vehicle[] => {
    if (status === "ALL") {
      return allVehicles;
    }
    return allVehicles.filter((vehicle) => vehicle.status === status);
  };

  const getRentalsByStatus = (status: string): Rental[] => {
    // TODO: Implement API call for rentals when available
    // For now, return empty array
    return [];
  };

  const renderVehiclesContent = () => {
    if (isLoadingVehicles) {
      return (
        <View className="flex-1 items-center justify-center bg-gray-50">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-4 text-gray-600">Đang tải danh sách xe...</Text>
        </View>
      );
    }

    if (isErrorVehicles) {
      return (
        <View className="flex-1 items-center justify-center bg-gray-50 px-4">
          <Text className="text-red-600 text-center mb-4">
            Không thể tải danh sách xe. Vui lòng thử lại.
          </Text>
        </View>
      );
    }

    return (
      <Tabs
        tabs={vehicleStatusTabs.map((tab) => {
          const vehicles = getVehiclesByStatus(tab.value);
          return {
            label: tab.label,
            value: tab.value,
            route: "",
            content: <VehiclesList vehicles={vehicles} />,
          };
        })}
        variant="inline"
        defaultActiveTab={activeVehicleStatus}
        onTabChange={(value) => setActiveVehicleStatus(value)}
      />
    );
  };

  const renderRentalsContent = () => {
    return (
      <Tabs
        tabs={rentalStatusTabs.map((tab) => {
          const rentals = getRentalsByStatus(tab.value);
          return {
            label: tab.label,
            value: tab.value,
            route: "",
            content: <RentalsList rentals={rentals} />,
          };
        })}
        variant="inline"
        defaultActiveTab={activeRentalStatus}
        onTabChange={(value) => setActiveRentalStatus(value)}
      />
    );
  };

  const handleAddVehicle = () => {
    router.push("/(tabs)/vehicles/create");
  };

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "left", "right"]}
      >
        <HeaderBase title="Xe và Đơn thuê" showBackButton />

        <Tabs
          tabs={[
            {
              label: "Xe của tôi",
              value: "vehicles",
              route: "",
              content: renderVehiclesContent(),
            },
            {
              label: "Đơn thuê xe",
              value: "rentals",
              route: "",
              content: renderRentalsContent(),
            },
          ]}
          variant="pill"
          defaultActiveTab={activeMainTab}
          onTabChange={(value) => setActiveMainTab(value)}
          contentClassName="flex-1"
        />

        {/* Floating Action Button - chỉ hiện khi tab "Xe của tôi" active */}
        {activeMainTab === "vehicles" && (
          <TouchableOpacity
            style={styles.fab}
            onPress={handleAddVehicle}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});
