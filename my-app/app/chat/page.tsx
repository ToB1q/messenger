'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/app/components/layout/Header';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/app/store/chatStore';
import { websocketService } from '../lib/websocket/websocket.service';
import type { ChatListItem, ChatMessageItem, Attachment } from '../lib/api/types';
import styles from './chat.module.css';
import MediaPicker from '@/app/components/MediaPicker';
import MediaGrid from '@/app/components/MediaGrid';
import DeleteConfirmation from '@/app/components/DeleteConfirmation';
import ContextMenu from '@/app/components/ContextMenu';
import VoiceRecorder from '@/app/components/VoiceRecorder';
import VoiceMessage from '@/app/components/VoiceMessage';
import Avatar from '@/app/components/Avatar';
import { useTheme } from '@/app/context/ThemeContext';

export default function ChatPage() {
  const router = useRouter();
  
  const {
    chats,
    messages,
    selectedChat,
    isLoading,
    error,
    fetchChats,
    sendMessage,
    setSelectedChat,
    closeWebSocket
  } = useChatStore();

  const [messageInput, setMessageInput] = useState('');
  const [isMobileDialogOpen, setIsMobileDialogOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessageItem | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesListRef = useRef<HTMLDivElement>(null);

  // Получаем ID текущего пользователя
  const [currentUserId, setCurrentUserId] = useState<number>(0);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setCurrentUserId(JSON.parse(userStr).id);
      }
    } catch (e) {
      console.error('Failed to parse user', e);
    }
  }, []);
 
  // Форматирование времени для списка чатов
  const formatChatTime = (dateString: string | null): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays === 1) {
      return 'вчера';
    }
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  // Форматирование времени последнего визита
  const formatLastSeen = (lastSeenAt: string | null): string => {
    if (!lastSeenAt) return '';

    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) {
      if (diffMins === 1) return '1 минуту назад';
      if (diffMins >= 2 && diffMins <= 4) return `${diffMins} минуты назад`;
      if (diffMins >= 5 && diffMins <= 20) return `${diffMins} минут назад`;
      return `${diffMins} минут назад`;
    }
    if (diffHours < 24) {
      if (diffHours === 1) return '1 час назад';
      if (diffHours >= 2 && diffHours <= 4) return `${diffHours} часа назад`;
      return `${diffHours} часов назад`;
    }
    if (diffDays < 7) {
      if (diffDays === 1) return 'вчера';
      if (diffDays === 2) return 'позавчера';
      return `${diffDays} дня назад`;
    }

    return lastSeen.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long'
    });
  };

  useEffect(() => {
    fetchChats();

    return () => {
      if (closeWebSocket) {
        closeWebSocket();
      }
    };
  }, [fetchChats, closeWebSocket]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > 768) {
        setIsMobileDialogOpen(false);
        document.body.classList.remove('chat-open');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectedChatData = chats.find(chat => chat.chat_id === selectedChat);
  const chatMessages = selectedChat ? messages[selectedChat] || [] : [];

  useEffect(() => {
    if (messagesListRef.current && chatMessages.length > 0) {
      requestAnimationFrame(() => {
        if (messagesListRef.current) {
          messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
        }
      });
    }
  }, [chatMessages, selectedChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChat) return;

    console.log('📤 Sending with reply:', replyToMessage);
    console.log('📤 Reply ID:', replyToMessage?.id);
    console.log('📤 Reply text:', replyToMessage?.text);

    await sendMessage(selectedChat, messageInput, replyToMessage?.id);
    setMessageInput('');
    setReplyToMessage(null);
  };

  const handleTyping = (isCurrentlyTyping: boolean) => {
    if (!selectedChat) return;

    if (websocketService.isActive()) {
      websocketService.sendTyping(selectedChat, isCurrentlyTyping);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isCurrentlyTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        if (websocketService.isActive()) {
          websocketService.sendTyping(selectedChat, false);
        }
      }, 3000);
    }
  };

  const handleChatSelect = (chatId: number) => {
    setSelectedChat(chatId);
    if (windowWidth <= 768) {
      setIsMobileDialogOpen(true);
      document.body.classList.add('chat-open');
    }
  };

  const handleBackToChats = () => {
    setIsMobileDialogOpen(false);
    document.body.classList.remove('chat-open');
  };

  useEffect(() => {
    if (!selectedChat || !chatMessages.length) return;
    
    const handleFocus = () => {
      const maxId = Math.max(...chatMessages.map(m => m.id));
      if (maxId) {
        websocketService.markAsRead(selectedChat, maxId);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [selectedChat, chatMessages]);

  useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && selectedChat && chatMessages.length > 0) {
      // Когда страница становится видимой, проверяем статус прочтения
      const maxId = Math.max(...chatMessages.map(m => m.id));
      if (maxId) {
        const lastMessage = chatMessages[chatMessages.length - 1];
        // Если последнее сообщение от другого пользователя и не прочитано
        if (lastMessage.sender_user_id !== currentUserId && !lastMessage.is_read) {
          websocketService.markAsRead(selectedChat, maxId);
        }
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [selectedChat, chatMessages, currentUserId]);

  const handleReplyClick = (message: ChatMessageItem) => {
    setReplyToMessage(message);
    document.getElementById('message-input')?.focus();
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  const handleMediaSelect = async (files: File[], caption: string) => {
  if (!selectedChat) return;
  
  console.log('📸 Selected files:', files.map(f => f.name));
  console.log('📝 Caption:', caption);
  
  const imageFiles = files.filter(f => f.type.startsWith('image/'));
  const videoFiles = files.filter(f => f.type.startsWith('video/'));
  
  if (imageFiles.length > 0) {
    try {
      await useChatStore.getState().sendMedia(selectedChat, imageFiles, caption, replyToMessage?.id);
    } catch (error) {
      console.error('Error sending photos:', error);
      alert('Ошибка при отправке фото');
    }
  }
  
  if (videoFiles.length > 0) {
    alert('Видео пока в разработке');
  }
};

  const formatMessageTime = (dateString: string) => {
    return dateString && !isNaN(Date.parse(dateString))
      ? new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const [contextMenu, setContextMenu] = useState<{
  show: boolean;
  x: number;
  y: number;
  message: ChatMessageItem | null;
}>({
  show: false,
  x: 0,
  y: 0,
  message: null
});

// Функция для обработки правого клика
const handleContextMenu = (e: React.MouseEvent, message: ChatMessageItem) => {
  e.preventDefault();
  e.stopPropagation();
  
  setContextMenu({
    show: true,
    x: e.clientX,
    y: e.clientY,
    message
  });
};

// Функции для действий меню
const handleContextMenuReply = () => {
  if (contextMenu.message) {
    setReplyToMessage(contextMenu.message);
    document.getElementById('message-input')?.focus();
  }
  setContextMenu({ show: false, x: 0, y: 0, message: null });
};

const handleContextMenuDelete = () => {
  if (contextMenu.message) {
    useChatStore.getState().showDeleteConfirmation(contextMenu.message);
  }
  setContextMenu({ show: false, x: 0, y: 0, message: null });
};

const handleContextMenuDeleteForEveryone = () => {
  if (contextMenu.message && selectedChat) {
    if (confirm('Удалить сообщение для всех? Это действие нельзя отменить.')) {
      useChatStore.getState().deleteMessage(selectedChat, contextMenu.message.id, 'for_everyone');
    }
  }
  setContextMenu({ show: false, x: 0, y: 0, message: null });
};

const handleVoiceSend = async (audioBlob: Blob, duration: number, waveform: number[]) => {
  if (!selectedChat) return;
  
  console.log('🎤 handleVoiceSend: начало отправки');
  console.log('🎤 selectedChat:', selectedChat);
  console.log('🎤 duration:', duration);
  console.log('🎤 waveform length:', waveform.length);
  
  try {
    console.log('🎤 Отправка голосового сообщения...');
    await useChatStore.getState().sendVoiceMessage(
      selectedChat, 
      audioBlob, 
      duration, 
      waveform, 
      replyToMessage?.id
    );
    console.log('🎤 Голосовое успешно отправлено');
    
    // Явно закрываем запись после успешной отправки
    console.log('🎤 Закрываем интерфейс записи');
    setIsRecording(false);
    
  } catch (error) {
    console.error('❌ Error sending voice:', error);
    alert('Ошибка при отправке голосового сообщения');
    setIsRecording(false);
  }
};

  if (isLoading && chats.length === 0) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.content}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Загрузка чатов...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.content}>
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>{error}</p>
            <button
              className={styles.retryButton}
              onClick={() => fetchChats()}
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header />
 
      <div className={styles.content}>
        {/* Левая колонка - список чатов */}
        <div className={`${styles.chatsSection} ${isMobileDialogOpen ? styles.hideOnMobile : ''}`}>
          <div className={styles.chatsHeader}>
            <h2 className={styles.chatsTitle}>Чаты</h2>
            <button className={styles.newChatButton} onClick={() => router.push('/search')}>
              <img className={styles.chatsIcon} src="/pen.png" alt="Новый чат" />
            </button>
          </div>

          <div className={styles.chatsSearch}>
            <img className={styles.searchIcon} src="/search.svg" alt="Поиск" />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Поиск среди чатов"
            />
          </div>

          <div className={styles.chatsList}>
            {chats.map((chat) => (
              <button
                key={chat.chat_id}
                className={`${styles.chatItem} 
                  ${selectedChat === chat.chat_id && !isMobileDialogOpen ? styles.active : ''}
                  ${chat.unread_count > 0 && selectedChat !== chat.chat_id ? styles.newMessage : ''}
                `}
                onClick={() => handleChatSelect(chat.chat_id)}
              >
                <div className={styles.chatAvatarWrapper}>
                  <Avatar
                    userId={chat.peer_user.user_id}
                    fullName={chat.peer_user.full_name}
                    username={chat.peer_user.username}
                    avatarFileId={chat.peer_user.avatar_file_id}
                    size="medium"
                    showOnline={true}
                    isOnline={chat.peer_online}
                  />
                </div>
                <div className={styles.chatInfo}>
                  <div className={styles.chatHeader}>
                    <span className={styles.chatName}>
                      {chat.peer_user.full_name || chat.peer_user.username || 'Пользователь'}
                    </span>
                    <span className={styles.chatTime}>
                      {chat.last_message?.created_at ? formatChatTime(chat.last_message.created_at) : ''}
                    </span>
                  </div>
                  <div className={styles.chatPreview}>
                    {chat.peer_typing ? (
                      <span className={styles.typingIndicator}>печатает...</span>
                    ) : (
                      <>
                        <span className={styles.lastMessage}>
                          {chat.last_message?.text || 'Нет сообщений'}
                        </span>
                        {chat.unread_count > 0 && (
                          <span className={styles.unreadBadge}>
                            {chat.unread_count > 99 ? '99+' : chat.unread_count}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Правая колонка - переписка */}
        <div className={`${styles.messagesSection} ${isMobileDialogOpen ? styles.showOnMobile : ''}`}>
          {selectedChatData ? (
            <>
              <div className={styles.messagesHeader}>
                <div className={styles.mobileBackButton} onClick={handleBackToChats}>
                  <img className={styles.chatsIcon} src="/back.png" alt="Назад" />
                </div>
                <div className={styles.chatUserInfo}>
                  <div className={styles.chatUserAvatarWrapper}>
                    <Avatar
                      userId={selectedChatData.peer_user.user_id}
                      fullName={selectedChatData.peer_user.full_name}
                      username={selectedChatData.peer_user.username}
                      avatarFileId={selectedChatData.peer_user.avatar_file_id}
                      size="small"
                      showOnline={true}
                      isOnline={selectedChatData.peer_online}
                    />
                  </div>
                  <div className={styles.chatUserDetails}>
                    <span className={styles.chatUserName}>
                      {selectedChatData.peer_user.full_name || selectedChatData.peer_user.username || 'Пользователь'}
                    </span>
                    <span className={styles.chatUserStatus}>
                      {selectedChatData.peer_typing ? (
                        <span className={styles.typingStatus}>печатает...</span>
                      ) : selectedChatData.peer_online ? (
                        'в сети'
                      ) : (
                        `был(а) ${formatLastSeen(selectedChatData.peer_last_seen_at)}`
                      )}
                    </span>
                  </div>
                </div>
                <div className={styles.chatActions}>
                  <button className={styles.chatActionButton}>
                    <img className={styles.chatsIcon} src="/phoneCall.png" alt="Звонок" />
                  </button>
                  <button className={styles.chatActionButton}>
                    <img className={styles.chatsIcon} src="/videoCall.svg" alt="Видеозвонок" />
                  </button>
                  <button className={styles.chatActionButton}>
                    <img className={styles.chatsIcon} src="/menuDots.svg" alt="Меню" />
                  </button>
                </div>
              </div>

              <div className={styles.messagesList} ref={messagesListRef}>
                {chatMessages.length === 0 ? (
                  <div className={styles.noMessages}>
                    <p>Нет сообщений</p>
                    <span>Напишите первое сообщение</span>
                  </div>
                ) : (
                  chatMessages.map((message, index) => {
                    const messageKey = message.id
                      ? `msg-${message.id}`
                      : `temp-${message.chat_id}-${message.client_uuid || index}-${Date.now()}`;

                    const messageTime = formatMessageTime(message.created_at);
                    const isMyMessage = message.sender_user_id === currentUserId;

                    return (
                      <div
  key={messageKey}
  className={`${styles.messageWrapper} ${isMyMessage ? styles.myMessage : styles.theirMessage}`}
  onClick={() => handleReplyClick(message)}
  onContextMenu={(e) => handleContextMenu(e, message)}
>
  {!isMyMessage && (
    <img
      className={styles.messageAvatar}
      src={selectedChatData?.peer_user.avatar_file_id
        ? `/api/files/${selectedChatData.peer_user.avatar_file_id}`
        : '/default-avatar.png'
      }
      alt="avatar"
    />
  )}
  <div className={styles.messageContent}>
    {/* Отображение reply, если есть */}
    {message.reply_to_message_id && message.reply_to_text && (
      <div className={styles.replyPreview}>
        <div className={styles.replyLine}></div>
        <div className={styles.replyContent}>
          <span className={styles.replySender}>
            {isMyMessage ? 'Вы' : selectedChatData?.peer_user.full_name || 'Пользователь'}
          </span>
          <span className={styles.replyText}>{message.reply_to_text}</span>
        </div>
      </div>
    )}
    
    {/* Медиа сообщение (фото/видео) */}
{message.type === 'media' && message.attachments && message.attachments.some(a => a.kind === 'photo' || a.kind === 'video') && (
  <MediaGrid 
    attachments={message.attachments.filter(a => a.kind === 'photo' || a.kind === 'video')}
    caption={message.text}
    isMyMessage={isMyMessage}
    messageTime={messageTime}
    isRead={message.is_read}
    onMediaClick={(index) => {
      console.log('Open media viewer:', index);
    }}
  />
)}

{/* Голосовые сообщения */}
{message.type === 'media' && message.attachments && message.attachments.some(a => a.kind === 'voice') && (
  <div className={styles.voiceMessagesContainer}>
    {message.attachments
      .filter(a => a.kind === 'voice')
      .map((attachment, idx) => (
        <VoiceMessage
          key={attachment.id}
          audioUrl={`https://dev5.pinkmoneyx.ru/api/v1/files/${attachment.file_id}`}
          duration={attachment.duration_ms ? attachment.duration_ms / 1000 : 0}
          waveform={attachment.waveform || []}
          isMyMessage={isMyMessage}
          isListened={attachment.listened_by_peer}
          messageTime={messageTime} // Добавлено время сообщения
          onPlay={() => {
            // Отмечаем как прослушанное, когда пользователь начал воспроизведение
          }}
          onEnded={() => {
            // Когда голосовое дослушано до конца, отмечаем как прослушанное
            if (!isMyMessage && !attachment.listened_by_peer) {
              websocketService.sendVoiceListened(selectedChat!, message.id, attachment.id);
            }
          }}
        />
      ))}
  </div>
)}
    
    {/* Текстовое сообщение */}
    {message.type !== 'media' && message.text && (
      <div className={styles.messageBubble}>
        <p className={`${styles.messageText} ${message.text.length < 20 ? styles.shortMessage : ''}`}>
          {message.text}
        </p>
        <span className={`${styles.messageTime} ${message.text.length < 20 ? styles.timeInline : ''}`}>
          {messageTime}
          {isMyMessage && (
            <img
              className={styles.messageStatus}
              src={message.is_read ? '/read.svg' : '/not-read.svg'}
              alt={message.is_read ? 'Прочитано' : 'Отправлено'}
            />
          )}
        </span>
      </div>
    )}
  </div>
</div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {replyToMessage && (
                <div className={styles.replyContainer}>
                  <div className={styles.replyToMessage}>
                    <div className={styles.replyInfo}>
                      <span className={styles.replyLabel}>
                        Ответ для {replyToMessage.sender_user_id === currentUserId ? 'себя' : selectedChatData?.peer_user.full_name}
                      </span>
                      <span className={styles.replyTextPreview}>{replyToMessage.text}</span>
                    </div>
                    <button className={styles.closeReplyButton} onClick={handleCancelReply}>
                      ✕
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSendMessage} className={styles.messageForm}>
  <button 
    type="button" 
    className={styles.attachButton}
    onClick={() => setShowMediaPicker(true)}
  >
    <img className={styles.chatsIcon} src="/clip.png" alt="Прикрепить" />
  </button>
  
  {isRecording ? (
  <div className={styles.voiceRecorderWrapper}>
    <VoiceRecorder
      onSend={handleVoiceSend}
      onCancel={() => {
        console.log('🎤 onCancel вызван');
        setIsRecording(false);
      }}
    />
  </div>
  ) : (
    <>
      <input
        id="message-input"
        type="text"
        className={styles.messageInput}
        placeholder={replyToMessage ? "Введите ответ..." : "Написать сообщение..."}
        value={messageInput}
        onChange={(e) => {
          setMessageInput(e.target.value);
          handleTyping(e.target.value.length > 0);
        }}
        onBlur={() => handleTyping(false)}
      />
      
      <button type="button" className={styles.emojiButton}>
        <img className={styles.chatsIcon} src="/emoji.png" alt="Смайлик" />
      </button>
      
      {messageInput.trim() ? (
        <button
          type="submit"
          className={styles.sendButton}
        >
          <img className={styles.chatsIcon} src="/send.png" alt="Отправить" />
        </button>
      ) : (
        <button 
          type="button" 
          className={styles.voiceButton}
          onClick={() => setIsRecording(true)}
        >
          <img className={styles.chatsIcon} src="/microphone.png" alt="Голосовое" />
        </button>
      )}
    </>
  )}
</form>

              {showMediaPicker && (
              <MediaPicker
                onSelect={handleMediaSelect}
                onClose={() => setShowMediaPicker(false)}
                maxCount={10}
              />
            )}
            </>
          ) : (
            <div className={styles.noChatSelected}>
              <div className={styles.noChatIcon}>
                <img src={theme === 'light' ? '/chat.svg' : '/chat-dark.svg'} alt="Чат" className={styles.chatsIcon}/>
              </div>
              <h3 className={styles.noChatTitle}>Выберите чат</h3>
              <p className={styles.noChatText}>Начните общение с друзьями</p>
            </div>
          )}
        </div>
      </div>
      {contextMenu.show && contextMenu.message && (
  <ContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    message={contextMenu.message}
    isMyMessage={contextMenu.message.sender_user_id === currentUserId}
    onClose={() => setContextMenu({ show: false, x: 0, y: 0, message: null })}
    onReply={handleContextMenuReply}
    onDelete={handleContextMenuDelete}
    onDeleteForEveryone={handleContextMenuDeleteForEveryone}
  />
)}

<DeleteConfirmation />
    </div>
  );
}