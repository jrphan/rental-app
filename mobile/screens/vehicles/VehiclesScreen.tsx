import { useState } from "react";
import { StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Tabs } from "@/components/ui/tabs";
import VehiclesList from "./components/VehiclesList";
import RentalsList from "./components/RentalsList";
import { mockVehicles, mockRentals } from "./mockData";
import { vehicleStatusLabels, rentalStatusLabels } from "./types";
import type { Vehicle, Rental } from "./types";
import HeaderBase from "@/components/header/HeaderBase";

export default function VehiclesScreen() {
  const [activeMainTab, setActiveMainTab] = useState("vehicles");
  const [activeVehicleStatus, setActiveVehicleStatus] = useState("APPROVED");
  const [activeRentalStatus, setActiveRentalStatus] = useState("CONFIRMED");

  const vehicleStatusTabs = [
    { label: "Tất cả", value: "ALL" },
    { label: vehicleStatusLabels.DRAFT, value: "DRAFT" },
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

  const getVehiclesByStatus = (status: string): Vehicle[] => {
    if (status === "ALL") {
      return Object.values(mockVehicles).flat();
    }
    return mockVehicles[status as keyof typeof mockVehicles] || [];
  };

  const getRentalsByStatus = (status: string): Rental[] => {
    if (status === "ALL") {
      return Object.values(mockRentals).flat();
    }
    return mockRentals[status as keyof typeof mockRentals] || [];
  };

  const renderVehiclesContent = () => {
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
      </SafeAreaView>
    </>
  );
}
