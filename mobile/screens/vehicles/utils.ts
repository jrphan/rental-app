import { vehicleStatusLabels, rentalStatusLabels } from "./types";

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const getRentalStatusColor = (status: string) => {
  switch (status) {
    case "PENDING_PAYMENT":
      return "bg-yellow-100 text-yellow-700";
    case "AWAIT_APPROVAL":
      return "bg-blue-100 text-blue-700";
    case "CONFIRMED":
      return "bg-green-100 text-green-700";
    case "ON_TRIP":
      return "bg-purple-100 text-purple-700";
    case "COMPLETED":
      return "bg-gray-100 text-gray-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    case "DISPUTED":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export const getVehicleStatusLabel = (
  status: keyof typeof vehicleStatusLabels
) => {
  return vehicleStatusLabels[status] || status;
};

export const getRentalStatusLabel = (
  status: keyof typeof rentalStatusLabels
) => {
  return rentalStatusLabels[status] || status;
};

