import { vehicleStatusLabels, rentalStatusLabels } from "./types";

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

export const formatDate = (dateString: string) => {
  // Parse date string và xử lý đúng timezone
  // Nếu dateString là "YYYY-MM-DD", parse như local date để tránh lệch timezone
  let date: Date;

  // Nếu là format "YYYY-MM-DD" (date-only), parse như local date
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split("-").map(Number);
    date = new Date();
    date.setFullYear(year, month - 1, day);
    date.setHours(12, 0, 0, 0); // Set giữa ngày để tránh lệch timezone
  } else {
    // Với ISO string có time, parse bình thường
    date = new Date(dateString);
  }

  // Format với local timezone (không dùng UTC) để hiển thị đúng ngày
  return date.toLocaleDateString("vi-VN", {
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

export const getRentalStatusStyles = (status: string) => {
  switch (status) {
    case "PENDING_PAYMENT":
      return { backgroundColor: "#FEF3C7", color: "#92400E" }; // yellow-100 / yellow-700
    case "AWAIT_APPROVAL":
      return { backgroundColor: "#DBEAFE", color: "#1D4ED8" }; // blue-100 / blue-700
    case "CONFIRMED":
      return { backgroundColor: "#ECFCCB", color: "#166534" }; // green-100 / green-700
    case "ON_TRIP":
      return { backgroundColor: "#F5F3FF", color: "#6D28D9" }; // purple-100 / purple-700
    case "COMPLETED":
      return { backgroundColor: "#F3F4F6", color: "#374151" }; // gray-100 / gray-700
    case "CANCELLED":
      return { backgroundColor: "#FEF2F2", color: "#991B1B" }; // red-100 / red-700
    case "DISPUTED":
      return { backgroundColor: "#FFF7ED", color: "#C2410C" }; // orange-100 / orange-700
    default:
      return { backgroundColor: "#F3F4F6", color: "#374151" };
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
