import type { ChatItem } from "./types";

export const mockChats: ChatItem[] = [
  {
    id: "1",
    name: "Nguyễn Văn A",
    lastMessage: "Xe của bạn còn không?",
    time: "10:30",
    unread: 2,
  },
  {
    id: "2",
    name: "Trần Thị B",
    lastMessage: "Cảm ơn bạn nhé!",
    time: "09:15",
    unread: 0,
  },
  {
    id: "3",
    name: "Lê Văn C",
    lastMessage: "Tôi sẽ đến vào 2h chiều",
    time: "Hôm qua",
    unread: 1,
  },
  {
    id: "4",
    name: "Phạm Thị D",
    lastMessage: "Đã nhận được tiền cọc",
    time: "Hôm qua",
    unread: 0,
  },
  {
    id: "5",
    name: "Hoàng Văn E",
    lastMessage: "Xe đang ở đâu vậy?",
    time: "2 ngày trước",
    unread: 0,
  },
];
