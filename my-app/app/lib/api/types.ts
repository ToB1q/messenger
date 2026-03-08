// lib/api/types.ts
export interface DevicePayload {
  device_uuid: string;
  platform: string;
  device_name?: string;
  os_version?: string;
  app_version?: string;
  locale?: string;
  timezone?: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
  device: DevicePayload;
}

export interface RefreshRequest {
  refresh_token: string;
  device_uuid: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface UserDto {
  id: number;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_color_index: number;
  avatar_file_id: number | null;
  avatar_small_file_id: number | null;
  last_seen_at: string | null;
}

export interface AuthSuccess {
  user: UserDto;
  tokens: TokenPair;
  session_uuid: string;
}

export interface SearchUserItem {
  user_id: number;
  username: string;
  full_name: string | null;
  is_self: boolean;
}

export interface SearchUsersResponse {
  users: SearchUserItem[];
}

export interface CreatePrivateChatRequest {
  peer_user_id: number;
}

export interface CreatePrivateChatResponse {
  chat_id: number;
}

export interface ChatMessageItem {
  id: number;
  chat_id: number;
  sender_user_id: number;
  client_uuid: string;
  type: 'text' | 'media';  // Обновлено
  text: string;
  created_at: string;
  is_read: boolean;
  reply_to_message_id?: number | null;
  reply_to_text?: string | null;
  attachments?: Attachment[];  // Добавлено для медиа
}

export interface ChatPeerUser {
  user_id: number;
  username: string | null;
  full_name: string | null;
  avatar_color_index: number;
  avatar_file_id: number | null;
  avatar_small_file_id: number | null;
  last_seen_at: string | null;
}

export interface ChatListItem {
  chat_id: number;
  peer_user: ChatPeerUser;
  last_message: ChatMessageItem | null;
  unread_count: number;
  my_last_read_message_id: number | null;
  peer_last_read_message_id: number | null;
  peer_online: boolean;
  peer_last_seen_at: string | null;
  peer_typing: boolean;
  peer_typing_expires_at: string | null;
}

export interface ListChatsResponse {
  chats: ChatListItem[];
}

export interface ChatMessagesResponse {
  chat_id: number;
  messages: ChatMessageItem[];
  has_more: boolean;
}

export interface SendMessageRequest {
  client_uuid: string;
  text: string;
  reply_to_message_id?: number | null;
}

export interface SendMessageResponse {
  chat_id: number;
  message: ChatMessageItem;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface Attachment {
  id: number;
  kind: 'photo' | 'video';
  sort_order: number;
  file_id: number;
  preview_file_id: number | null;
  width: number;
  height: number;
  duration_ms: number | null;
  content_type: string;
  size_bytes: number;
}

export interface MediaItem {
  slot: number;
  kind: 'photo' | 'video';
  file_field: string;
  preview_file_field: string | null;
  mime_type: string;
  original_file_name: string;
  width: number;
  height: number;
  duration_ms: number | null;
}

export interface SendMediaRequest {
  client_uuid: string;
  caption?: string;
  reply_to_message_id?: number | null;
  items: MediaItem[];
}

export interface SendMediaResponse {
  chat_id: number;
  message: ChatMessageItem;
}