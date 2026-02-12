'use client';

import { useState } from 'react';
import Header from '@/app/components/layout/Header';
import styles from './chat.module.css';

// Типы данных
interface Chat {
  id: number;
  username: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  isTyping?: boolean;
}

interface Message {
  id: number;
  chatId: number;
  sender: string;
  senderAvatar: string;
  content: string;
  time: string;
  isRead: boolean;
  isMyMessage: boolean;
  image?: string;
}

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<number | null>(1);
  const [messageInput, setMessageInput] = useState('');
  const [chats, setChats] = useState<Chat[]>([
    {
      id: 1,
      username: 'alex_design',
      avatar: '/tank.jpg',
      lastMessage: 'Привет! Как продвигается проект?',
      lastMessageTime: '12:34',
      unreadCount: 2,
      isOnline: true,
    },
    {
      id: 2,
      username: 'tobi',
      avatar: '/jdm.jpg',
      lastMessage: 'Скинул ссылку на конференцию',
      lastMessageTime: '10:22',
      unreadCount: 0,
      isOnline: false,
      isTyping: true,
    },
    {
      id: 3,
      username: 'mouse',
      avatar: '/zzz.jpg',
      lastMessage: 'Фото с закатом получилось супер!',
      lastMessageTime: 'вчера',
      unreadCount: 5,
      isOnline: true,
    },
    {
      id: 4,
      username: 'maria_tech',
      avatar: '/cat.jpg',
      lastMessage: 'Когда созвон по API?',
      lastMessageTime: 'вчера',
      unreadCount: 0,
      isOnline: false,
    },
    {
      id: 5,
      username: 'pavel_photo',
      avatar: '/68dd056ee60f9.jpg',
      lastMessage: 'Готовь камеру, на выходные отличная погода',
      lastMessageTime: '20 фев',
      unreadCount: 0,
      isOnline: true,
    },
    {
      id: 6,
      username: 'anna_travel',
      avatar: '/sakura.jpg',
      lastMessage: 'Барселона ждёт! ✈️',
      lastMessageTime: '19 фев',
      unreadCount: 0,
      isOnline: false,
    },
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      chatId: 1,
      sender: 'alex_design',
      senderAvatar: '/tank.jpg',
      content: 'Привет! Как продвигается работа над дизайн-системой?',
      time: '12:30',
      isRead: true,
      isMyMessage: false,
    },
    {
      id: 2,
      chatId: 1,
      sender: 'Вы',
      senderAvatar: '/cat.jpg',
      content: 'Привет! Почти закончил, осталось пару компонентов',
      time: '12:32',
      isRead: true,
      isMyMessage: true,
    },
    {
      id: 3,
      chatId: 1,
      sender: 'alex_design',
      senderAvatar: '/tank.jpg',
      content: 'Круто! Сможешь показать на демо сегодня?',
      time: '12:33',
      isRead: true,
      isMyMessage: false,
    },
    {
      id: 4,
      chatId: 1,
      sender: 'Вы',
      senderAvatar: '/cat.jpg',
      content: 'Да, без проблем. В 16:00 норм?',
      time: '12:34',
      isRead: true,
      isMyMessage: true,
    },
    {
      id: 5,
      chatId: 2,
      sender: 'tobi',
      senderAvatar: '/jdm.jpg',
      content: 'Привет! Скинул ссылку на конференцию по Next.js',
      time: '10:20',
      isRead: true,
      isMyMessage: false,
    },
    {
      id: 6,
      chatId: 2,
      sender: 'tobi',
      senderAvatar: '/jdm.jpg',
      content: 'Очень полезный доклад про Server Components',
      time: '10:21',
      isRead: true,
      isMyMessage: false,
    },
    {
      id: 7,
      chatId: 3,
      sender: 'mouse',
      senderAvatar: '/zzz.jpg',
      content: 'Смотри какое фото получилось! 📸',
      time: '23:15',
      isRead: false,
      isMyMessage: false,
      image: '/sakura.jpg',
    },
    {
      id: 8,
      chatId: 3,
      sender: 'mouse',
      senderAvatar: '/zzz.jpg',
      content: 'Закат в горах, ничто не сравнится с этим моментом',
      time: '23:16',
      isRead: false,
      isMyMessage: false,
    },
    {
      id: 9,
      chatId: 3,
      sender: 'Вы',
      senderAvatar: '/cat.jpg',
      content: 'Вау! Невероятный кадр 🔥',
      time: '08:45',
      isRead: true,
      isMyMessage: true,
    },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChat) return;

    const newMessage: Message = {
      id: messages.length + 1,
      chatId: selectedChat,
      sender: 'Вы',
      senderAvatar: '/cat.jpg',
      content: messageInput,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      isMyMessage: true,
    };

    setMessages([...messages, newMessage]);
    setMessageInput('');

    // Обновляем последнее сообщение в чате
    setChats(chats.map(chat => 
      chat.id === selectedChat 
        ? { 
            ...chat, 
            lastMessage: messageInput, 
            lastMessageTime: 'только что',
            unreadCount: 0 
          } 
        : chat
    ));
  };

  const selectedChatData = chats.find(chat => chat.id === selectedChat);
  const chatMessages = messages.filter(msg => msg.chatId === selectedChat);

  return (
    <div className={styles.container}>
      <Header />
      
      <div className={styles.content}>
        {/* Левая колонка - список чатов */}
        <div className={styles.chatsSection}>
          <div className={styles.chatsHeader}>
            <h2 className={styles.chatsTitle}>
              <span className={styles.chatsIcon}>💬</span>
              Чаты
            </h2>
            <button className={styles.newChatButton}>
              <span>✏️</span>
            </button>
          </div>

          <div className={styles.chatsSearch}>
            <span className={styles.searchIcon}>🔍</span>
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="Поиск среди чатов"
            />
          </div>

          <div className={styles.chatsList}>
            {chats.map((chat) => (
              <button
                key={chat.id}
                className={`${styles.chatItem} ${selectedChat === chat.id ? styles.active : ''}`}
                onClick={() => setSelectedChat(chat.id)}
              >
                <div className={styles.chatAvatarWrapper}>
                  <img className={styles.chatAvatar} src={chat.avatar} alt={chat.username} />
                  {chat.isOnline && <span className={styles.onlineIndicator} />}
                </div>
                <div className={styles.chatInfo}>
                  <div className={styles.chatHeader}>
                    <span className={styles.chatName}>{chat.username}</span>
                    <span className={styles.chatTime}>{chat.lastMessageTime}</span>
                  </div>
                  <div className={styles.chatPreview}>
                    {chat.isTyping ? (
                      <span className={styles.typingIndicator}>печатает...</span>
                    ) : (
                      <>
                        <span className={styles.lastMessage}>{chat.lastMessage}</span>
                        {chat.unreadCount > 0 && (
                          <span className={styles.unreadBadge}>{chat.unreadCount}</span>
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
        <div className={styles.messagesSection}>
          {selectedChatData ? (
            <>
              {/* Шапка чата */}
              <div className={styles.messagesHeader}>
                <div className={styles.chatUserInfo}>
                  <div className={styles.chatUserAvatarWrapper}>
                    <img 
                      className={styles.chatUserAvatar} 
                      src={selectedChatData.avatar} 
                      alt={selectedChatData.username} 
                    />
                    {selectedChatData.isOnline && <span className={styles.chatOnlineIndicator} />}
                  </div>
                  <div className={styles.chatUserDetails}>
                    <span className={styles.chatUserName}>{selectedChatData.username}</span>
                    <span className={styles.chatUserStatus}>
                      {selectedChatData.isOnline ? 'в сети' : 'был(а) недавно'}
                    </span>
                  </div>
                </div>
                <div className={styles.chatActions}>
                  <button className={styles.chatActionButton}>
                    <span>📞</span>
                  </button>
                  <button className={styles.chatActionButton}>
                    <span>📹</span>
                  </button>
                  <button className={styles.chatActionButton}>
                    <span>ℹ️</span>
                  </button>
                </div>
              </div>

              {/* Сообщения */}
              <div className={styles.messagesList}>
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`${styles.messageWrapper} ${message.isMyMessage ? styles.myMessage : styles.theirMessage}`}
                  >
                    {!message.isMyMessage && (
                      <img 
                        className={styles.messageAvatar} 
                        src={message.senderAvatar} 
                        alt={message.sender} 
                      />
                    )}
                    <div className={styles.messageContent}>
                      {message.image && (
                        <div className={styles.messageImage}>
                          <img src={message.image} alt="attachment" />
                        </div>
                      )}
                      <div className={styles.messageBubble}>
                        <p className={styles.messageText}>{message.content}</p>
                        <span className={styles.messageTime}>
                          {message.time}
                          {message.isMyMessage && (
                            <span className={styles.messageStatus}>
                              {message.isRead ? '✓✓' : '✓'}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Форма отправки сообщения */}
              <form onSubmit={handleSendMessage} className={styles.messageForm}>
                <button type="button" className={styles.attachButton}>
                  <span>📎</span>
                </button>
                <input
                  type="text"
                  className={styles.messageInput}
                  placeholder="Написать сообщение..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                />
                <button 
                  type="button" 
                  className={styles.emojiButton}
                >
                  <span>😊</span>
                </button>
                <button 
                  type="submit" 
                  className={styles.sendButton}
                  disabled={!messageInput.trim()}
                >
                  <span>📤</span>
                </button>
              </form>
            </>
          ) : (
            <div className={styles.noChatSelected}>
              <div className={styles.noChatIcon}>💬</div>
              <h3 className={styles.noChatTitle}>Выберите чат</h3>
              <p className={styles.noChatText}>Начните общение с друзьями</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}