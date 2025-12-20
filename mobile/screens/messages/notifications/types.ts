export interface NotificationItem {
  id: string;
  type: "booking" | "message" | "payment" | "system" | "success" | "warning";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  // Thông tin gốc từ API để navigate
  originalType?: "SYSTEM" | "PROMOTION" | "RENTAL_UPDATE" | "PAYMENT" | "KYC_UPDATE";
  originalData?: Record<string, any>;
}

