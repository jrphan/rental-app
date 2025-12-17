export interface NotificationItem {
  id: string;
  type: "booking" | "message" | "payment" | "system";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

