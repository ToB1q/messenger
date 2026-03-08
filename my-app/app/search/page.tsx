// app/search/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/layout/Header';
import { api } from '../lib/api/client';
import styles from './search.module.css';

interface User {
  user_id: number;
  username: string;
  full_name: string | null;
  is_self: boolean;
}

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingChat, setCreatingChat] = useState<number | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.length < 2) return;

    setLoading(true);
    try {
      const response = await api.searchUsers(searchQuery);
      setUsers(response.users.filter(user => !user.is_self)); // Исключаем себя
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChat = async (userId: number) => {
    setCreatingChat(userId);
    try {
      const response = await api.createPrivateChat(userId);
      console.log('Chat created:', response);
      
      // Перенаправляем в созданный чат
      router.push(`/chat/${response.chat_id}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Ошибка при создании чата');
    } finally {
      setCreatingChat(null);
    }
  };

  return (
    <div className={styles.container}>
      <Header />
      
      <div className={styles.content}>
        <div className={styles.searchSection}>
          <h1 className={styles.title}>Поиск пользователей</h1>
          
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Введите username (минимум 2 символа)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              minLength={2}
            />
            <button 
              type="submit" 
              className={styles.searchButton}
              disabled={loading || searchQuery.length < 2}
            >
              {loading ? 'Поиск...' : 'Найти'}
            </button>
          </form>

          <div className={styles.resultsList}>
            {users.length === 0 && !loading && searchQuery && (
              <p className={styles.noResults}>Пользователи не найдены</p>
            )}
            
            {users.map((user) => (
              <div key={user.user_id} className={styles.userCard}>
                <div className={styles.userInfo}>
                  <div className={styles.userAvatar}>
                    {/* Заглушка аватара с цветом */}
                    <div style={{ 
                      backgroundColor: `hsl(${user.user_id * 100 % 360}, 70%, 50%)`,
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {user.full_name?.[0] || user.username[0]}
                    </div>
                  </div>
                  <div className={styles.userDetails}>
                    <span className={styles.userName}>
                      {user.full_name || user.username}
                    </span>
                    <span className={styles.userUsername}>@{user.username}</span>
                  </div>
                </div>
                <button
                  className={styles.createChatButton}
                  onClick={() => handleCreateChat(user.user_id)}
                  disabled={creatingChat === user.user_id}
                >
                  {creatingChat === user.user_id ? 'Создание...' : 'Написать'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}