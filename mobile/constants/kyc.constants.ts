/**
 * KYC Status Constants
 * Đồng bộ với enum KycStatus trong backend schema
 */
export const KYC_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  NEEDS_UPDATE: "NEEDS_UPDATE",
} as const;

/**
 * KYC Status Labels (Vietnamese)
 */
export const KYC_STATUS_LABELS = {
  [KYC_STATUS.PENDING]: "Đang chờ duyệt",
  [KYC_STATUS.APPROVED]: "Đã được duyệt",
  [KYC_STATUS.REJECTED]: "Bị từ chối",
  [KYC_STATUS.NEEDS_UPDATE]: "Cần cập nhật",
} as const;

/**
 * KYC Status Colors (Tailwind CSS classes)
 */
export const KYC_STATUS_COLORS = {
  [KYC_STATUS.PENDING]: "bg-yellow-500",
  [KYC_STATUS.APPROVED]: "bg-green-500",
  [KYC_STATUS.REJECTED]: "bg-red-500",
  [KYC_STATUS.NEEDS_UPDATE]: "bg-orange-500",
} as const;

/**
 * KYC Status Background Colors (for badges)
 */
export const KYC_STATUS_BG_COLORS = {
  [KYC_STATUS.PENDING]: "bg-yellow-50",
  [KYC_STATUS.APPROVED]: "bg-green-50",
  [KYC_STATUS.REJECTED]: "bg-red-50",
  [KYC_STATUS.NEEDS_UPDATE]: "bg-orange-50",
} as const;

/**
 * KYC Status Border Colors
 */
export const KYC_STATUS_BORDER_COLORS = {
  [KYC_STATUS.PENDING]: "border-yellow-200",
  [KYC_STATUS.APPROVED]: "border-green-200",
  [KYC_STATUS.REJECTED]: "border-red-200",
  [KYC_STATUS.NEEDS_UPDATE]: "border-orange-200",
} as const;

/**
 * KYC Status Icon Colors
 */
export const KYC_STATUS_ICON_COLORS = {
  [KYC_STATUS.PENDING]: "#F59E0B",
  [KYC_STATUS.APPROVED]: "#10B981",
  [KYC_STATUS.REJECTED]: "#EF4444",
  [KYC_STATUS.NEEDS_UPDATE]: "#F97316",
} as const;

/**
 * KYC Status Icons (MaterialIcons)
 */
export const KYC_STATUS_ICONS = {
  [KYC_STATUS.PENDING]: "pending",
  [KYC_STATUS.APPROVED]: "check-circle",
  [KYC_STATUS.REJECTED]: "cancel",
  [KYC_STATUS.NEEDS_UPDATE]: "update",
} as const;

/**
 * Helper function to get KYC status label
 */
export const getKycStatusLabel = (status: string): string => {
  return KYC_STATUS_LABELS[status as keyof typeof KYC_STATUS_LABELS] || status;
};

/**
 * Helper function to get KYC status color
 */
export const getKycStatusColor = (status: string): string => {
  return KYC_STATUS_COLORS[status as keyof typeof KYC_STATUS_COLORS] || "bg-gray-500";
};

/**
 * Helper function to get KYC status background color
 */
export const getKycStatusBgColor = (status: string): string => {
  return KYC_STATUS_BG_COLORS[status as keyof typeof KYC_STATUS_BG_COLORS] || "bg-gray-50";
};

/**
 * Helper function to get KYC status border color
 */
export const getKycStatusBorderColor = (status: string): string => {
  return KYC_STATUS_BORDER_COLORS[status as keyof typeof KYC_STATUS_BORDER_COLORS] || "border-gray-200";
};

/**
 * Helper function to get KYC status icon color
 */
export const getKycStatusIconColor = (status: string): string => {
  return KYC_STATUS_ICON_COLORS[status as keyof typeof KYC_STATUS_ICON_COLORS] || "#6B7280";
};

/**
 * Helper function to get KYC status icon name
 */
export const getKycStatusIcon = (status: string): string => {
  return KYC_STATUS_ICONS[status as keyof typeof KYC_STATUS_ICONS] || "help";
};

