export interface NotificationItem {
  id: string;
  type: "booking" | "message" | "payment" | "system" | "success" | "warning";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

