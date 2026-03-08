// app/store/chatStore.ts
import { create } from 'zustand';
import { api } from '../lib/api/client';
import { websocketService, WebSocketEvent } from '../lib/websocket/websocket.service';
import type { 
  ChatListItem, 
  ChatMessageItem,
  ListChatsResponse,
  ChatMessagesResponse 
} from '../lib/api/types';

interface ChatStore {
  chats: ChatListItem[];
  messages: ChatMessageItem[];
  selectedChat: number | null;
  isLoading: boolean;
  error: string | null;
  
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: number) => Promise<void>;
  sendMessage: (chatId: number, text: string) => Promise<void>;
  setSelectedChat: (chatId: number | null) => void;
  initWebSocket: () => void;
  closeWebSocket: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  messages: [],
  selectedChat: null,
  isLoading: false,
  error: null,

  initWebSocket: () => {
    console.log('Initializing WebSocket...');
    
    const handleWebSocketEvent = (event: WebSocketEvent) => {
      console.log('WebSocket event in store:', event);
      
      switch (event.type) {
        case 'message.created':
          set((state) => {
            const newMessages = [...state.messages, event.payload];
            const updatedChats = state.chats.map(chat => 
              chat.chat_id === event.payload.chat_id 
                ? { ...chat, last_message: event.payload }
                : chat
            );
            return { messages: newMessages, chats: updatedChats };
          });
          break;

        case 'message.ack':
          console.log('Message acknowledged:', event.payload);
          break;

        case 'read.updated':
          set((state) => {
            const updatedMessages = state.messages.map(msg => 
              msg.chat_id === event.payload.chat_id && msg.id <= event.payload.max_message_id
                ? { ...msg, is_read: true }
                : msg
            );
            return { messages: updatedMessages };
          });
          break;

        case 'typing.updated':
          set((state) => {
            const updatedChats = state.chats.map(chat => 
              chat.chat_id === event.payload.chat_id
                ? { 
                    ...chat, 
                    peer_typing: event.payload.is_typing,
                    peer_typing_expires_at: event.payload.is_typing 
                      ? new Date(Date.now() + 5000).toISOString() 
                      : null
                  }
                : chat
            );
            return { chats: updatedChats };
          });
          break;

        case 'presence.updated':
          set((state) => {
            const updatedChats = state.chats.map(chat => 
              chat.peer_user.user_id === event.payload.user_id
                ? { 
                    ...chat, 
                    peer_online: event.payload.is_online,
                    peer_last_seen_at: event.payload.last_seen_at
                  }
                : chat
            );
            return { chats: updatedChats };
          });
          break;
      }
    };

    websocketService.addListener(handleWebSocketEvent);
    websocketService.connect();
  },

  closeWebSocket: () => {
    websocketService.disconnect();
  },

  fetchChats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getChats() as ListChatsResponse;
      set({ chats: response.chats, isLoading: false });
      get().initWebSocket();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchMessages: async (chatId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getMessages(chatId) as ChatMessagesResponse;
      set({ messages: response.messages, isLoading: false });
      
      if (response.messages.length > 0) {
        const maxId = Math.max(...response.messages.map(m => m.id));
        websocketService.markAsRead(chatId, maxId);
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  sendMessage: async (chatId: number, text: string) => {
    try {
      const sent = websocketService.sendMessage(chatId, text);
      
      if (!sent) {
        console.log('WebSocket not available, using REST fallback');
        const response = await api.sendMessage(chatId, text);
        
        set((state) => ({
          messages: [...state.messages, response.message]
        }));
        
        set((state) => ({
          chats: state.chats.map(chat => 
            chat.chat_id === chatId 
              ? { ...chat, last_message: response.message }
              : chat
          )
        }));
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  setSelectedChat: (chatId: number | null) => {
    set({ selectedChat: chatId });
    if (chatId) {
      get().fetchMessages(chatId);
    }
  },
}));