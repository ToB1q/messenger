// app/store/chatStore.ts
import { create } from 'zustand';
import { api } from '../lib/api/client';
import { websocketService, WebSocketEvent } from '../lib/websocket/websocket.service';
import type { 
  ChatListItem, 
  ChatMessageItem,
  ListChatsResponse,
  ChatMessagesResponse,
  MediaItem,
  DeleteMode
} from '../lib/api/types';

interface ChatStore {
  chats: ChatListItem[];
  messages: Record<number, ChatMessageItem[]>;
  selectedChat: number | null;
  isLoading: boolean;
  isLoadingMessages: Record<number, boolean>;
  error: string | null;
  replyToMessage: ChatMessageItem | null;
  deleteConfirmation: {
    show: boolean;
    message: ChatMessageItem | null;
  };
  
   
  fetchChats: () => Promise<void>;
   fetchMessages: (chatId: number, shouldMarkAsRead?: boolean) => Promise<void>;
  sendMessage: (chatId: number, text: string, replyToId?: number | null) => Promise<void>;
  setSelectedChat: (chatId: number | null) => void;
  initWebSocket: () => void;
  closeWebSocket: () => void;
  addMessage: (chatId: number, message: ChatMessageItem) => void;
  updateMessageRead: (chatId: number, maxMessageId: number) => void;
  updateChatPresence: (userId: number, isOnline: boolean, lastSeenAt?: string | null) => void;
  updateChatTyping: (chatId: number, userId: number, isTyping: boolean) => void;
  setReplyToMessage: (message: ChatMessageItem | null) => void;
  sendMedia: (chatId: number, files: File[], caption?: string, replyToId?: number | null) => Promise<void>;
  checkUserStatusViaAPI: (userId: number) => Promise<void>;
  deleteMessage: (chatId: number, messageId: number, mode?: DeleteMode) => Promise<void>;
  showDeleteConfirmation: (message: ChatMessageItem) => void;
  hideDeleteConfirmation: () => void;
  sendVoiceMessage: (chatId: number, audioBlob: Blob, duration: number, waveform: number[], replyToId?: number | null) => Promise<void>;

}

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  messages: {},
  selectedChat: null,
  isLoading: false,
  isLoadingMessages: {},
  error: null,
replyToMessage: null,

  initWebSocket: () => {
  console.log('📡 Initializing WebSocket...');
  
  websocketService.addListener((event) => {
    console.log('📩 WebSocket event received:', JSON.stringify(event, null, 2));
    
    let currentUserId = 0;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        currentUserId = JSON.parse(userStr).id;
      }
    } catch (e) {
      console.error('Failed to parse user', e);
    }
    
    switch (event.type) {
      case 'message.deleted': {
  console.log('🗑️ Message deleted via WebSocket:', event.payload);
  const { chat_id, message_id } = event.payload;
  
  set((state) => {
    const currentMessages = state.messages[chat_id] || [];
    const updatedMessages = currentMessages.filter(msg => msg.id !== message_id);
    
    // Обновляем последнее сообщение в чате если нужно
    let updatedChats = state.chats;
    if (updatedMessages.length > 0) {
      const lastMessage = updatedMessages[updatedMessages.length - 1];
      updatedChats = state.chats.map(chat => 
        chat.chat_id === chat_id
          ? { ...chat, last_message: lastMessage }
          : chat
      );
    } else {
      updatedChats = state.chats.map(chat => 
        chat.chat_id === chat_id
          ? { ...chat, last_message: null }
          : chat
      );
    }

    return {
      messages: {
        ...state.messages,
        [chat_id]: updatedMessages
      },
      chats: updatedChats
    };
  });
  break;
}

case 'voice.listened.updated': {
  console.log('👂 Voice listened updated:', event.payload);
  const { chat_id, message_id, attachment_id, listened_at } = event.payload;
  
  set((state) => {
    const messages = state.messages[chat_id] || [];
    const updatedMessages = messages.map(msg => {
      if (msg.id === message_id && msg.attachments) {
        const updatedAttachments = msg.attachments.map(att => 
          att.id === attachment_id 
            ? { ...att, listened_by_peer: true, listened_at }
            : att
        );
        return { ...msg, attachments: updatedAttachments };
      }
      return msg;
    });
    
    return {
      messages: {
        ...state.messages,
        [chat_id]: updatedMessages
      }
    };
  });
  break;
}

      case 'message.created': {
        const message = event.payload.message;
        console.log('💬 New message created:', message);
        
        // Обновляем сообщения в реальном времени
        set((state) => {
          const chatId = message.chat_id;
          const currentMessages = state.messages[chatId] || [];
          
          // Проверяем, есть ли уже такое сообщение
          const exists = currentMessages.some(
            m => m.id === message.id || 
            (m.client_uuid && message.client_uuid && m.client_uuid === message.client_uuid)
          );
          
          if (exists) {
            console.log('Message already exists, updating instead of adding');
            // Если сообщение уже есть (например, временное), обновляем его
            const updatedMessages = currentMessages.map(msg => 
              (msg.client_uuid && message.client_uuid && msg.client_uuid === message.client_uuid) 
                ? message 
                : msg
            );
            
            return {
              messages: {
                ...state.messages,
                [chatId]: updatedMessages
              }
            };
          }
          
          // Если сообщения нет, добавляем новое
          console.log('Adding new message to chat', chatId);
          const newMessages = [...currentMessages, message].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          
          // Обновляем последнее сообщение в чате
          const updatedChats = state.chats.map(chat => 
            chat.chat_id === chatId 
              ? { ...chat, last_message: message }
              : chat
          );
          
          // Если сообщение от другого пользователя и чат не выбран, увеличиваем счетчик
          if (message.sender_user_id !== currentUserId && chatId !== state.selectedChat) {
            updatedChats.forEach(chat => {
              if (chat.chat_id === chatId) {
                chat.unread_count = (chat.unread_count || 0) + 1;
              }
            });
          }
          
          return {
            messages: {
              ...state.messages,
              [chatId]: newMessages
            },
            chats: updatedChats
          };
        });
        break;
      }

      case 'message.ack':
        console.log('✅ Message acknowledged:', event.payload);
        if (event.payload.client_uuid) {
          set((state) => {
            const chatId = event.payload.chat_id;
            const messages = state.messages[chatId] || [];
            const updatedMessages = messages.map(msg => 
              msg.client_uuid === event.payload.client_uuid 
                ? { ...msg, id: event.payload.message_id }
                : msg
            );
            
            return {
              messages: {
                ...state.messages,
                [chatId]: updatedMessages
              }
            };
          });
        }
        break;

        case 'message.delete.ack': {
  console.log('✅ Message delete acknowledged:', event.payload);
  const { request_id, chat_id, message_id } = event.payload;
  
  // Удаляем из pendingDeletes
  if (websocketService.pendingDeletes) {
    websocketService.pendingDeletes.delete(request_id);
  }
  
  // Сообщение уже удалено оптимистично, ничего не делаем
  break;
}
case 'message.delete.error': {
  console.log('❌ Message delete error:', event.payload);
  const { request_id, chat_id, message_id, error } = event.payload;
  
  // Если сервер вернул ошибку, восстанавливаем сообщение
  if (request_id) {
    // Находим сообщение по ID и восстанавливаем его
    // Для этого нужно где-то хранить удаленные сообщения
    console.log('Restoring message due to delete error');
    
    // Здесь можно добавить логику восстановления
    // Например, перезагрузить сообщения для этого чата
    get().fetchMessages(chat_id, false);
  }
  break;
}

      case 'read.updated': {
  console.log('👁️ Read updated:', event.payload);
  const { chat_id, max_message_id, reader_user_id } = event.payload;
  
  // Получаем текущего пользователя
  let currentUserId = 0;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      currentUserId = JSON.parse(userStr).id;
    }
  } catch (e) {
    console.error('Failed to parse user', e);
  }

  // Обновляем статус прочтения для сообщений
  set((state) => {
    const currentMessages = state.messages[chat_id] || [];
    const updatedMessages = currentMessages.map(msg => 
      msg.id <= max_message_id ? { ...msg, is_read: true } : msg
    );

    // Обновляем счетчик непрочитанных только если это прочитал другой пользователь
    const updatedChats = state.chats.map(chat => 
      chat.chat_id === chat_id
        ? { 
            ...chat, 
            // Обновляем peer_last_read_message_id если это прочитал собеседник
            peer_last_read_message_id: reader_user_id !== currentUserId 
              ? max_message_id 
              : chat.peer_last_read_message_id
          }
        : chat
    );

    return {
      messages: {
        ...state.messages,
        [chat_id]: updatedMessages
      },
      chats: updatedChats
    };
  });
  
  break;
}

      case 'typing.updated': {
        console.log('✏️ Typing updated:', event.payload);
        get().updateChatTyping(
          event.payload.chat_id, 
          event.payload.user_id, 
          event.payload.is_typing
        );
        break;
      }

      case 'presence.updated': {
        console.log('🟢 Presence updated:', event.payload);
        const { user_id, is_online, last_seen_at } = event.payload;
        get().updateChatPresence(user_id, is_online, last_seen_at);
        break;
      }

      case 'read.ack':
        console.log('👁️ Read ack:', event.payload);
        break;

      case 'pong':
        console.log('🏓 Pong received:', event.payload);
        break;

      default:
        console.log('Unknown event type:', event.type);
    }
  });

  console.log('🚀 Connecting WebSocket...');
  websocketService.connect();

},
deleteConfirmation: {
  show: false,
  message: null
},

showDeleteConfirmation: (message: ChatMessageItem) => {
  console.log('🗑️ Show delete confirmation for message:', message.id);
  set({ 
    deleteConfirmation: { 
      show: true, 
      message 
    } 
  });
},

hideDeleteConfirmation: () => {
  set({ 
    deleteConfirmation: { 
      show: false, 
      message: null 
    } 
  });
},

deleteMessage: async (chatId: number, messageId: number, mode: DeleteMode = 'for_me') => {
  console.log(`🗑️ Deleting message ${messageId} from chat ${chatId} with mode: ${mode}`);
  
  try {
    let currentUserId = 0;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        currentUserId = JSON.parse(userStr).id;
      }
    } catch (e) {
      console.error('Failed to parse user', e);
    }

    const messages = get().messages[chatId] || [];
    const message = messages.find(m => m.id === messageId);
    
    if (!message) {
      throw new Error('Message not found');
    }

    if (mode === 'for_everyone' && message.sender_user_id !== currentUserId) {
      alert('Нельзя удалить чужое сообщение для всех');
      return;
    }

    // Сохраняем сообщение для возможного восстановления при ошибке
    const deletedMessage = { ...message };
    
    // Оптимистично удаляем сообщение локально
    set((state) => {
      const currentMessages = state.messages[chatId] || [];
      const updatedMessages = currentMessages.filter(msg => msg.id !== messageId);
      
      let updatedChats = state.chats;
      if (updatedMessages.length > 0) {
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        updatedChats = state.chats.map(chat => 
          chat.chat_id === chatId
            ? { ...chat, last_message: lastMessage }
            : chat
        );
      } else {
        updatedChats = state.chats.map(chat => 
          chat.chat_id === chatId
            ? { ...chat, last_message: null }
            : chat
        );
      }

      return {
        messages: {
          ...state.messages,
          [chatId]: updatedMessages
        },
        chats: updatedChats
      };
    });

    get().hideDeleteConfirmation();

    // Отправляем DELETE запрос
    try {
      const response = await api.deleteMessage(chatId, messageId, mode);
      console.log('✅ Message deleted successfully:', response);
    } catch (error: unknown) {
      console.error('❌ Error deleting message:', error);
      
      // Если ошибка, восстанавливаем сообщение
      set((state) => {
        const currentMessages = state.messages[chatId] || [];
        const updatedMessages = [...currentMessages, deletedMessage].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        return {
          messages: {
            ...state.messages,
            [chatId]: updatedMessages
          }
        };
      });
      
      // Проверяем тип ошибки и показываем соответствующее сообщение
      if (error instanceof Error) {
        if (error.message?.includes('403')) {
          alert('Нет прав на удаление этого сообщения');
        } else if (error.message?.includes('404')) {
          alert('Сообщение не найдено');
        } else {
          alert('Ошибка при удалении сообщения: ' + error.message);
        }
      } else {
        alert('Ошибка при удалении сообщения');
      }
    }

  } catch (error: unknown) {
    console.error('❌ Error in deleteMessage:', error);
    if (error instanceof Error) {
      alert('Ошибка при удалении сообщения: ' + error.message);
    } else {
      alert('Ошибка при удалении сообщения');
    }
  }
},


sendMedia: async (chatId: number, files: File[], caption: string = '', replyToId?: number | null) => {
  console.log(`📸 Sending media to chat ${chatId}:`, files.length, 'files');
  
  try {
    const clientUuid = crypto.randomUUID();

    // Создаем FormData
    const formData = new FormData();
    formData.append('client_uuid', clientUuid);
    
    if (caption) {
      formData.append('caption', caption);
    }
    
    if (replyToId) {
      formData.append('reply_to_message_id', replyToId.toString());
    }

    // Функция для получения размеров изображения
    const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
    };

    // Функция для получения длительности видео
    const getVideoDuration = (file: File): Promise<number> => {
      return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(video.src);
          resolve(Math.round(video.duration * 1000)); // в миллисекундах
        };
        video.onerror = reject;
        video.src = URL.createObjectURL(file);
      });
    };

    // Получаем размеры для всех файлов
    const items = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const kind = file.type.startsWith('video/') ? 'video' : 'photo';
      
      let width = 0;
      let height = 0;
      let duration_ms = null;

      try {
        if (kind === 'photo') {
          const dimensions = await getImageDimensions(file);
          width = dimensions.width;
          height = dimensions.height;
          console.log(`📏 Image ${i} dimensions:`, width, 'x', height);
        } else {
          duration_ms = await getVideoDuration(file);
          // Для видео также можно получить размеры первого кадра
          console.log(`🎥 Video ${i} duration:`, duration_ms, 'ms');
        }
      } catch (error) {
        console.warn(`⚠️ Could not get dimensions for file ${i}:`, error);
      }

      const fieldName = `media_${i}`;
      formData.append(fieldName, file);

      items.push({
        slot: i,
        kind: kind,
        file_field: fieldName,
        preview_file_field: null, // для видео можно добавить превью позже
        mime_type: file.type,
        original_file_name: file.name,
        width: width,
        height: height,
        duration_ms: duration_ms
      });
    }

    // Добавляем items как JSON строку
    formData.append('items', JSON.stringify(items));
    console.log('📤 Items with dimensions:', JSON.stringify(items, null, 2));

    // Получаем токен
    const token = localStorage.getItem('access_token');

    // Отправляем запрос
    const response = await fetch(`https://dev5.pinkmoneyx.ru/api/v1/chats/${chatId}/messages/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const responseText = await response.text();
    console.log('📥 Media response:', response.status, responseText);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.log('✅ Media sent successfully:', data);
    
    return data;
    
  } catch (error) {
    console.error('❌ Error sending media:', error);
    throw error;
  }
},



  closeWebSocket: () => {
    console.log('🔌 Closing WebSocket...');
    websocketService.disconnect();
  },

  fetchChats: async () => {
    console.log('📋 Fetching chats...');
    set({ isLoading: true, error: null });
    try {
      const response = await api.getChats() as ListChatsResponse;
      console.log('📋 Chats fetched:', response.chats.length);
      set({ chats: response.chats, isLoading: false });
      get().initWebSocket();
    } catch (error: any) {
      console.error('❌ Error fetching chats:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  fetchMessages: async (chatId: number, shouldMarkAsRead: boolean = true) => {
  console.log(`📥 Fetching messages for chat ${chatId}...`);
  
  if (get().isLoadingMessages[chatId]) {
    console.log('Already loading messages for this chat');
    return;
  }
  
  set((state) => ({ 
    isLoadingMessages: { ...state.isLoadingMessages, [chatId]: true },
    error: null 
  }));
  
  try {
    const response = await api.getMessages(chatId) as ChatMessagesResponse;
    console.log(`📥 Messages fetched for chat ${chatId}:`, response.messages.length);
    
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: response.messages
      },
      isLoadingMessages: { ...state.isLoadingMessages, [chatId]: false }
    }));
    
    // Отмечаем как прочитанные ТОЛЬКО если чат выбран И пользователь на странице
    if (shouldMarkAsRead && get().selectedChat === chatId && document.visibilityState === 'visible') {
      const maxId = Math.max(...response.messages.map(m => m.id));
      if (maxId) {
        console.log(`👁️ Marking messages as read up to ${maxId}`);
        websocketService.markAsRead(chatId, maxId);
      }
    }
  } catch (error: any) {
    console.error(`❌ Error fetching messages for chat ${chatId}:`, error);
    set((state) => ({ 
      error: error.message, 
      isLoadingMessages: { ...state.isLoadingMessages, [chatId]: false }
    }));
  }
},


  sendMessage: async (chatId: number, text: string, replyToId?: number | null) => {
  console.log(`📤 Sending message to chat ${chatId}:`, text, replyToId ? `(reply to ${replyToId})` : '');
  
  try {
    let currentUserId = 0;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        currentUserId = JSON.parse(userStr).id;
      }
    } catch (e) {
      console.error('Failed to parse user', e);
    }

    const clientUuid = crypto.randomUUID();

    // Получаем текст сообщения, на которое отвечаем
    let replyToText = null;
    if (replyToId) {
      const replyMessage = get().replyToMessage;
      replyToText = replyMessage?.text || null;
    }

    const tempMessage: ChatMessageItem = {
      id: Date.now(),
      chat_id: chatId,
      sender_user_id: currentUserId,
      text: text,
      created_at: new Date().toISOString(),
      is_read: false,
      client_uuid: clientUuid,
      type: 'text',
      reply_to_message_id: replyToId || null,  // Важно: это поле должно быть
      reply_to_text: replyToText  // Текст сообщения, на которое отвечаем
    };

    console.log('📝 Temporary message with reply:', tempMessage);
    get().addMessage(chatId, tempMessage);
    
    // Очищаем reply после отправки
    set({ replyToMessage: null });

    // Отправляем через WebSocket с reply_to_message_id
    const sent = websocketService.sendMessage(chatId, text, clientUuid, replyToId);
    
    if (!sent) {
      console.log('⚠️ WebSocket not available, using REST fallback');
      
      try {
        // В REST fallback тоже передаем replyToId
        const response = await api.sendMessage(chatId, text, replyToId);
        console.log('✅ REST response with reply:', response);
        
        set((state) => {
          const currentMessages = state.messages[chatId] || [];
          const updatedMessages = currentMessages.map(msg => 
            msg.client_uuid === clientUuid ? response.message : msg
          );
          
          return {
            messages: {
              ...state.messages,
              [chatId]: updatedMessages
            }
          };
        });
        
        set((state) => ({
          chats: state.chats.map(chat => 
            chat.chat_id === chatId 
              ? { ...chat, last_message: response.message }
              : chat
          )
        }));
      } catch (restError) {
        console.error('❌ REST fallback failed:', restError);
      }
    }
  } catch (error: any) {
    console.error('❌ Error in sendMessage:', error);
    set({ error: error.message });
  }
},


   addMessage: (chatId: number, message: ChatMessageItem) => {
  console.log(`➕ Adding/updating message in chat ${chatId}:`, message);
  
  set((state) => {
    const currentMessages = state.messages[chatId] || [];
    
    // Проверяем, есть ли уже такое сообщение
    const existingIndex = currentMessages.findIndex(
      m => m.id === message.id || 
      (m.client_uuid && message.client_uuid && m.client_uuid === message.client_uuid)
    );
    
    let newMessages;
    if (existingIndex !== -1) {
      // Обновляем существующее сообщение
      console.log('Updating existing message at index', existingIndex);
      newMessages = [...currentMessages];
      newMessages[existingIndex] = message;
    } else {
      // Добавляем новое сообщение
      console.log('Adding new message');
      newMessages = [...currentMessages, message];
    }
    
    // Сортируем по времени
    newMessages.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Обновляем последнее сообщение в чате
    const updatedChats = state.chats.map(chat => 
      chat.chat_id === chatId 
        ? { ...chat, last_message: message }
        : chat
    );

    return {
      messages: {
        ...state.messages,
        [chatId]: newMessages
      },
      chats: updatedChats
    };
  });
},

  updateMessageRead: (chatId: number, maxMessageId: number) => {
    set((state) => {
      const currentMessages = state.messages[chatId] || [];
      
      const updatedMessages = currentMessages.map(msg => 
        msg.id <= maxMessageId ? { ...msg, is_read: true } : msg
      );

      return {
        messages: {
          ...state.messages,
          [chatId]: updatedMessages
        }
      };
    });
  },

  updateChatPresence: (userId: number, isOnline: boolean, lastSeenAt?: string | null) => {
    console.log(`🟢 Updating presence for user ${userId}:`, isOnline ? 'online' : 'offline', lastSeenAt);
    
    set((state) => {
      const updatedChats = state.chats.map(chat => {
        if (chat.peer_user.user_id === userId) {
          return {
            ...chat,
            peer_online: isOnline,
            peer_last_seen_at: lastSeenAt !== undefined ? lastSeenAt : chat.peer_last_seen_at
          };
        }
        return chat;
      });

      return { chats: updatedChats };
    });
  },

  updateChatTyping: (chatId: number, userId: number, isTyping: boolean) => {
    console.log(`✏️ Updating typing for chat ${chatId}, user ${userId}:`, isTyping);
    
    set((state) => {
      const updatedChats = state.chats.map(chat => {
        if (chat.chat_id === chatId && chat.peer_user.user_id === userId) {
          return {
            ...chat,
            peer_typing: isTyping,
            peer_typing_expires_at: isTyping 
              ? new Date(Date.now() + 5000).toISOString() 
              : null
          };
        }
        return chat;
      });

      return { chats: updatedChats };
    });
  },

  checkUserStatusViaAPI: async (userId: number) => {
  console.log(`🌐 Checking user ${userId} status via API`);
  try {
    const response = await api.getChats() as ListChatsResponse;
    const updatedChat = response.chats.find(c => c.peer_user.user_id === userId);
    
    if (updatedChat) {
      set((state) => ({
        chats: state.chats.map(chat => 
          chat.peer_user.user_id === userId
            ? { 
                ...chat, 
                peer_online: updatedChat.peer_online,
                peer_last_seen_at: updatedChat.peer_last_seen_at 
              }
            : chat
        )
      }));
    }
  } catch (error) {
    console.error('❌ Error checking user status:', error);
  }
},
 
  setSelectedChat: (chatId: number | null) => {
  console.log(`🎯 Selected chat changed to:`, chatId);
  set({ selectedChat: chatId });
  
  if (chatId) {
    const currentMessages = get().messages[chatId];
    if (!currentMessages || currentMessages.length === 0) {
      // При первом открытии не отмечаем как прочитанные автоматически
      get().fetchMessages(chatId, false);
    } else {
      // Если сообщения уже загружены, отмечаем как прочитанные только если чат активен
      const maxId = Math.max(...currentMessages.map(m => m.id));
      if (maxId && document.visibilityState === 'visible') {
        console.log(`👁️ Marking messages as read up to ${maxId}`);
        websocketService.markAsRead(chatId, maxId);
        
        // Обновляем локальный статус
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: state.messages[chatId].map(msg => ({ ...msg, is_read: true }))
          },
          chats: state.chats.map(chat => 
            chat.chat_id === chatId
              ? { ...chat, unread_count: 0 }
              : chat
          )
        }));
      }
    }
    
    const selectedChat = get().chats.find(c => c.chat_id === chatId);
    if (selectedChat) {
      get().checkUserStatusViaAPI(selectedChat.peer_user.user_id);
    }
  }
},

sendVoiceMessage: async (chatId: number, audioBlob: Blob, duration: number, waveform: number[], replyToId?: number | null) => {
  console.log(`🎤 Sending voice message to chat ${chatId}, duration: ${duration}s, blob type: ${audioBlob.type}`);
  
  try {
    let currentUserId = 0;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        currentUserId = JSON.parse(userStr).id;
      }
    } catch (e) {
      console.error('Failed to parse user', e);
    }

    const clientUuid = crypto.randomUUID();

    let replyToText = null;
    if (replyToId) {
      const replyMessage = get().replyToMessage;
      replyToText = replyMessage?.text || null;
    }

    // СОЗДАЕМ ВРЕМЕННОЕ СООБЩЕНИЕ
    const tempMessage: ChatMessageItem = {
      id: Date.now(),
      chat_id: chatId,
      sender_user_id: currentUserId,
      text: '',
      created_at: new Date().toISOString(),
      is_read: false,
      client_uuid: clientUuid,
      type: 'media',
      reply_to_message_id: replyToId || null,
      reply_to_text: replyToText,
      attachments: [{
        id: Date.now(),
        kind: 'voice',
        sort_order: 0,
        file_id: 0,
        preview_file_id: null,
        width: null,
        height: null,
        duration_ms: duration * 1000,
        content_type: audioBlob.type,
        size_bytes: audioBlob.size,
        waveform: waveform,
        listened_by_peer: false
      }]
    };

    get().addMessage(chatId, tempMessage);
    
    if (replyToId) {
      set({ replyToMessage: null });
    }

    // Создаем FormData
    const formData = new FormData();
    formData.append('client_uuid', clientUuid);
    
    if (replyToId) {
      formData.append('reply_to_message_id', replyToId.toString());
    }

    // Определяем правильное расширение файла на основе MIME типа
    let fileExtension = 'm4a';
    let mimeType = audioBlob.type;
    
    if (audioBlob.type.includes('mp4')) {
      fileExtension = 'm4a';
      mimeType = 'audio/mp4';
    } else if (audioBlob.type.includes('aac')) {
      fileExtension = 'aac';
      mimeType = 'audio/aac';
    } else if (audioBlob.type.includes('m4a')) {
      fileExtension = 'm4a';
      mimeType = 'audio/m4a';
    } else {
      // Если тип не поддерживается, пробуем конвертировать или используем audio/mp4
      console.warn('Unsupported mime type, using audio/mp4');
      mimeType = 'audio/mp4';
      fileExtension = 'm4a';
    }

    const fileName = `voice_${Date.now()}.${fileExtension}`;
    
    // Создаем новый файл с правильным MIME типом
    const audioFile = new File([audioBlob], fileName, { type: mimeType });
    formData.append('media_0', audioFile);

    // Создаем items для голосового сообщения
    const items = [{
      slot: 0,
      kind: 'voice' as const,
      file_field: 'media_0',
      preview_file_field: null,
      mime_type: mimeType,
      original_file_name: fileName,
      width: null,
      height: null,
      duration_ms: duration * 1000,
      waveform: waveform
    }];

    formData.append('items', JSON.stringify(items));
    console.log('📤 Sending voice message with items:', JSON.stringify(items, null, 2));

    const token = localStorage.getItem('access_token');

    const response = await fetch(`https://dev5.pinkmoneyx.ru/api/v1/chats/${chatId}/messages/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const responseText = await response.text();
    console.log('📥 Voice response:', response.status, responseText);

    if (!response.ok) {
      // Если ошибка, удаляем временное сообщение
      set((state) => {
        const currentMessages = state.messages[chatId] || [];
        const updatedMessages = currentMessages.filter(msg => msg.client_uuid !== clientUuid);
        
        return {
          messages: {
            ...state.messages,
            [chatId]: updatedMessages
          }
        };
      });
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.log('✅ Voice sent successfully:', data);
    
    // Заменяем временное сообщение на реальное
    set((state) => {
      const currentMessages = state.messages[chatId] || [];
      const updatedMessages = currentMessages.map(msg => 
        msg.client_uuid === clientUuid ? data.message : msg
      );
      
      return {
        messages: {
          ...state.messages,
          [chatId]: updatedMessages
        }
      };
    });
    
    return data;
    
  } catch (error) {
    console.error('❌ Error sending voice message:', error);
    throw error;
  }
},

  setReplyToMessage: (message: ChatMessageItem | null) => {
  console.log('📝 Setting reply message:', message);
  set({ replyToMessage: message });
},
})); 