import React from "react";
import ChatList from "./components/ChatList";
import { mockChats } from "./mockData";

export default function ChatScreen() {
  return <ChatList data={mockChats} />;
}
