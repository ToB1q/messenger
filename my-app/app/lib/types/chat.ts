// app/lib/types/chat.ts
export interface User {
  id: number;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_color_index: number;
  avatar_file_id: number | null;
  avatar_small_file_id: number | null;
  last_seen_at: string | null;
}

export interface ChatMessage {
  id: number;
  chat_id: number;
  sender_user_id: number;
  client_uuid: string;
  type: string;
  text: string;
  created_at: string;
  is_read: boolean;
  sender?: User;
}

export interface ChatListItem {
  chat_id: number;
  peer_user: User;
  last_message: ChatMessage | null;
  unread_count: number;
  my_last_read_message_id: number | null;
  peer_last_read_message_id: number | null;
  peer_online: boolean;
  peer_last_seen_at: string | null;
  peer_typing: boolean;
  peer_typing_expires_at: string | null;
}

export interface ChatMessagesResponse {
  chat_id: number;
  messages: ChatMessage[];
  has_more: boolean;
}

export interface ListChatsResponse {
  chats: ChatListItem[];
}