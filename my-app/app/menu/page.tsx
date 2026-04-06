// app/menu/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/layout/Header';
import Avatar from '@/app/components/Avatar';
import { api } from '../lib/api/client';
import styles from './menu.module.css';
import { useTheme } from '@/app/context/ThemeContext';

interface UserData {
  id: number;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_file_id: number | null;
  avatar_small_file_id: number | null;
}

export default function MenuPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [uploading, setUploading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats] = useState({
    friends: 24,
    groups: 8,
    photos: 156
  });

  // Функция для загрузки данных пользователя
  const loadUserData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Сначала пробуем получить из localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        console.log('✅ User data loaded from localStorage');
      } else {
        // Если нет в localStorage, запрашиваем с сервера
        console.log('📡 Fetching user data from server...');
        const userData = await api.getMe();
        setUser(userData);
        // Сохраняем в localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('✅ User data loaded from server');
      }
    } catch (err: any) {
      console.error('❌ Error loading user data:', err);
      setError(err.message || 'Ошибка загрузки данных');
      
      // Если ошибка авторизации, перенаправляем на логин
      if (err.message?.includes('401') || err.message?.includes('unauthorized')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Загружаем данные при монтировании
  useEffect(() => {
    loadUserData();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверяем размер (макс 5 МБ)
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимальный размер 5 МБ');
      return;
    }

    // Проверяем тип файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.type)) {
      alert('Поддерживаются только JPEG, PNG, WEBP и HEIC');
      return;
    }

    setUploading(true);
    try {
      const updatedUser = await api.uploadAvatar(file);
      setUser(updatedUser);
      // Обновляем данные в localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      alert('Аватар успешно обновлен');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      alert(error.message || 'Ошибка при загрузке аватара');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  const handleRetry = () => {
    loadUserData();
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.contentSpiner}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Загрузка профиля...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.content}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h3 className={styles.errorTitle}>Ошибка загрузки данных</h3>
            <p className={styles.errorText}>{error || 'Пользователь не найден'}</p>
            <button 
              className={styles.retryButton}
              onClick={handleRetry}
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
        {/* Левая колонка - профиль */}
        <div className={styles.profileSection}>
          <div className={styles.profileHeader}>
            <div className={styles.profileAvatar}>
              <Avatar
                userId={user.id}
                fullName={user.full_name}
                username={user.username}
                avatarFileId={user.avatar_file_id}
                size="large"
              />
              <label className={styles.avatarUploadLabel}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className={styles.avatarInput}
                />
                <div className={styles.avatarUploadOverlay}>
                  {uploading ? (
                    <div className={styles.uploadSpinner}></div>
                  ) : (
                    <span className={styles.editIcon}>✎</span>
                  )}
                </div>
              </label>
            </div>
            
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>
                <h2 className={styles.name}>{user.full_name || user.username}</h2>
                <span className={styles.verifiedBadge}>✓</span>
              </div>
              <div className={styles.profileContact}>
                <span className={styles.username}>@{user.username}</span>
                <span className={styles.phone}>{user.email}</span>
              </div>
            </div>
          </div>

          <button className={styles.editButton}>
            <span className={styles.editIcon}>✎</span>
            Редактировать профиль
          </button>

          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.friends}</span>
              <span className={styles.statLabel}>Друзья</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.groups}</span>
              <span className={styles.statLabel}>Группы</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.photos}</span>
              <span className={styles.statLabel}>Фото</span>
            </div>
          </div>

          <div className={styles.premiumBanner}>
            <div className={styles.premiumContent}>
              <span className={styles.premiumIcon}>⭐</span>
              <div className={styles.premiumText}>
                <span className={styles.premiumTitle}>Phoenix Premium</span>
                <span className={styles.premiumSubtitle}>Больше возможностей</span>
              </div>
            </div>
            <button className={styles.premiumButton}>→</button>
          </div>

          <nav className={styles.navMenu}>
            <button className={styles.navItem}>
              <img src="/star.png" alt="" className={styles.navIcon} />
              <span className={styles.navLabel}>Избраннок</span>
              <span className={styles.navArrow}>→</span>
            </button>
            <button className={styles.navItem}>
              <img src="/phoneCall.png" alt="" className={styles.navIcon} />
              <span className={styles.navLabel}>Звонки</span>
              <span className={styles.navArrow}>→</span>
            </button>
            <button className={`${styles.navItem} ${styles.logoutButton}`} onClick={handleLogout}>
              <span className={styles.navLabel}>Выйти</span>
              <span className={styles.navArrow}>→</span>
            </button>
          </nav>
        </div>

        {/* Правая колонка - меню */}
        <div className={styles.menuSection}>
          <div className={styles.menuGrid}>
            {/* Карточка чатов */}
            <div className={styles.menuCard}>
              <div className={styles.menuCardHeader}>
                <img src={theme === 'light' ? '/chat.svg' : '/chat-dark.svg'} alt="" className={styles.menuCardIcon}/>
                <h3 className={styles.menuCardTitle}>Чаты</h3>
              </div>
              <div className={styles.menuCardItems}>
                <button className={styles.menuCardItem} onClick={() => router.push('/chat')}>
                  <span>Все чаты</span>
                  <span className={styles.menuCardCount}>12</span>
                </button>
                <button className={styles.menuCardItem}>
                  <span>Непрочитанные</span>
                  <span className={styles.menuCardCount}>3</span>
                </button>
                <button className={styles.menuCardItem}>
                  <span>Закрепленные</span>
                  <span className={styles.menuCardArrow}>→</span>
                </button>
                <button className={styles.menuCardItem}>
                  <span>Архив</span>
                  <span className={styles.menuCardArrow}>→</span>
                </button>
              </div>
            </div>

            {/* Карточка медиа */}
            <div className={styles.menuCard}>
              <div className={styles.menuCardHeader}>
                <img src="/media.png" alt="" className={styles.menuCardIcon} />
                <h3 className={styles.menuCardTitle}>Медиа</h3>
              </div>
              <div className={styles.menuCardItems}>
                <button className={styles.menuCardItem}>
                  <span>Фото</span>
                  <span className={styles.menuCardValue}>156</span>
                </button>
                <button className={styles.menuCardItem}>
                  <span>Видео</span>
                  <span className={styles.menuCardValue}>23</span>
                </button>
                <button className={styles.menuCardItem}>
                  <span>Аудио</span>
                  <span className={styles.menuCardValue}>45</span>
                </button>
                <button className={styles.menuCardItem}>
                  <span>Файлы</span>
                  <span className={styles.menuCardValue}>12</span>
                </button>
              </div>
            </div>

            {/* Карточка настроек */}
            <div className={styles.menuCard}>
              <div className={styles.menuCardHeader}>
                <img src="/setting.png" alt="" className={styles.menuCardIcon} />
                <h3 className={styles.menuCardTitle}>Настройки</h3>
              </div>
              <div className={styles.menuCardItems}>
                <button className={styles.menuCardItem}>
                  <span>Уведомления</span>
                  <span className={styles.menuCardArrow}>→</span>
                </button>
                <button className={styles.menuCardItem}>
                  <span>Конфиденциальность</span>
                  <span className={styles.menuCardArrow}>→</span>
                </button>
                <button className={styles.menuCardItem}>
                  <span>Язык</span>
                  <span className={styles.menuCardValue}>Русский</span>
                </button>
                <button className={styles.menuCardItem}>
                  <span>Тема</span>
                  <span className={styles.menuCardValue}>Системная</span>
                </button>
              </div>
            </div>

            {/* Карточка поддержки */}
            <div className={styles.menuCard}>
              <div className={styles.menuCardHeader}>
                <img src="/help.png" alt="" className={styles.menuCardIcon} />
                <h3 className={styles.menuCardTitle}>Поддержка</h3>
              </div>
              <div className={styles.menuCardItems}>
                <button className={styles.menuCardItem}>
                  <span>Помощь</span>
                  <span className={styles.menuCardArrow}>→</span>
                </button>
                <button className={styles.menuCardItem}>
                  <span>Обратная связь</span>
                  <span className={styles.menuCardArrow}>→</span>
                </button>
                <button className={styles.menuCardItem}>
                  <span>О приложении</span>
                  <span className={styles.menuCardValue}>v1.0.0</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}