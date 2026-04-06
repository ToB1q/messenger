// app/search/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/layout/Header';
import Avatar from '@/app/components/Avatar';
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
      setUsers(response.users.filter(user => !user.is_self));
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
      router.push(`/chat`);
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
          <div className={styles.header}>
            <h1 className={styles.title}>Поиск пользователей</h1>
            <p className={styles.subtitle}>Найдите собеседника по username</p>
          </div>
          
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.searchInputWrapper}>
              <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Введите username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                minLength={2}
              />
            </div>
            <button 
              type="submit" 
              className={styles.searchButton}
              disabled={loading || searchQuery.length < 2}
            >
              {loading ? 'Поиск...' : 'Найти'}
            </button>
          </form>

          {loading && (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Поиск пользователей...</p>
            </div>
          )}

          {!loading && users.length === 0 && searchQuery && (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>🔍</div>
              <h3 className={styles.emptyStateTitle}>Пользователи не найдены</h3>
              <p className={styles.emptyStateText}>
                Попробуйте изменить поисковый запрос
              </p>
            </div>
          )}

          <div className={styles.resultsList}>
            {users.map((user) => (
              <div key={user.user_id} className={styles.userCard}>
                <div className={styles.userInfo}>
                  <Avatar
                    userId={user.user_id}
                    fullName={user.full_name}
                    username={user.username}
                    size="medium"
                  />
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
                  {creatingChat === user.user_id ? (
                    <>
                      <span className={styles.buttonSpinner}></span>
                      Создание...
                    </>
                  ) : (
                    <>
                      {/* <img src="/pen.png" alt="" /> */}
                      Написать
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}