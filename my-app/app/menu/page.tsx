'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/layout/Header';
import styles from './menu.module.css';
import { useTheme } from '@/app/context/ThemeContext';
import { api } from '../lib/api/client';
import { websocketService } from '../lib/websocket/websocket.service';

export default function MenuPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('menu');
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Загружаем данные пользователя при монтировании
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    }
  }, []);

  // Функция выхода
  const handleLogout = async () => {
  try {
    // Отправляем статус офлайн через WebSocket
    if (websocketService.isActive()) {
      // Даем время на отправку
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    await api.logout();
    router.push('/login');
  } catch (error) {
    console.error('Logout error:', error);
    router.push('/login');
  }
};

  return (
    <div className={styles.container}>
      <Header />
      
      <div className={styles.content}>
        {/* Левая колонка - профиль и основное меню */}
        <div className={styles.profileSection}>
          {/* Шапка профиля */}
          <div className={styles.profileHeader}>
            <div className={styles.profileAvatar}>
              <img src="/cat.jpg" alt="Profile" className={styles.avatarImage} />
            </div>
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>
                <h1 className={styles.name}>
                  {user?.full_name || user?.username || 'ToB1'}
                </h1>
                <span className={styles.verifiedBadge}>✔</span>
              </div>
              <div className={styles.profileContact}>
                <span className={styles.phone}>{user?.email || 'user@example.com'}</span>
                <span className={styles.username}>@{user?.username || 'username'}</span>
              </div>
            </div>
          </div>

          {/* Кнопка редактирования */}
          <button className={styles.editButton}>
            <span className={styles.editIcon}>✎</span>
            Редактировать профиль
          </button>

          {/* Статистика */}
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>142</span>
              <span className={styles.statLabel}>Сообщений</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>28</span>
              <span className={styles.statLabel}>Контактов</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>89</span>
              <span className={styles.statLabel}>Лайков</span>
            </div>
          </div>

          {/* Premium баннер */}
          <div className={styles.premiumBanner}>
            <div className={styles.premiumContent}>
              <img className={styles.premiumIcon} src="/yellowStar.png" alt="" />
              <div className={styles.premiumText}>
                <span className={styles.premiumTitle}>Премиум</span>
                <span className={styles.premiumSubtitle}>Разблокируйте возможности</span>
              </div>
            </div>
            <button className={styles.premiumButton}>→</button>
          </div>

          {/* Навигационные пункты */}
          <nav className={styles.navMenu}>
            <button className={styles.navItem}>
              <img className={styles.navIcon} src="/star.png" alt="" />
              <span className={styles.navLabel}>Избранное</span>
              <span className={styles.navArrow}>→</span>
            </button>
            <button className={styles.navItem}>
              <img className={styles.navIcon} src="/phoneCall.png" alt="" />
              <span className={styles.navLabel}>Звонки</span>
              <span className={styles.navArrow}>→</span>
            </button>
          </nav>
        </div>

        {/* Правая колонка - дополнительные разделы */}
        <div className={styles.menuSection}>
          <div className={styles.menuGrid}>
            {/* Настройки */}
            <div className={styles.menuCard}>
              <div className={styles.menuCardHeader}>
                <img className={styles.menuCardIcon} src="/setting.png" alt="" />
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
                  <span>Тема</span>
                  <div 
                    className={styles.themeButton}
                    onClick={toggleTheme}
                    role="button"  // Добавляем семантическую роль для доступности
                    tabIndex={0}   // Делаем элемент фокусируемым
                    aria-label="Переключить тему"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        toggleTheme();
                      }
                    }}
                  >
                    <img 
                      src={theme === 'light' ? '/moon.svg' : '/sun.svg'} 
                      alt={theme === 'light' ? 'Темная тема' : 'Светлая тема'}
                      className={styles.themeIcon}
                    />
                  </div>
                </button>
                <button className={styles.menuCardItem}>
                  <span>Язык</span>
                  <span className={styles.menuCardValue}>Русский</span>
                </button>
              </div>
            </div>

            {/* Медиа */}
            <div className={styles.menuCard}>
              <div className={styles.menuCardHeader}>
                <img className={styles.menuCardIcon} src="/media.png" alt="" />
                <h3 className={styles.menuCardTitle}>Медиа</h3>
              </div>
              <div className={styles.menuCardItems}>
                <button className={styles.menuCardItem}>
                  <span>Фотографии</span>
                  <span className={styles.menuCardCount}>24</span>
                </button>
                <button className={styles.menuCardItem}>
                  <span>Видео</span>
                  <span className={styles.menuCardCount}>12</span>
                </button>
                <button className={styles.menuCardItem}>
                  <span>Файлы</span>
                  <span className={styles.menuCardCount}>8</span>
                </button>
              </div>
            </div>

            {/* Помощь */}
            <div className={styles.menuCard}>
              <div className={styles.menuCardHeader}>
                <img className={styles.menuCardIcon} src="/help.png" alt="" />
                <h3 className={styles.menuCardTitle}>Помощь</h3>
              </div>
              <div className={styles.menuCardItems}>
                <button className={styles.menuCardItem}>
                  <span>FAQ</span>
                  <span className={styles.menuCardArrow}>→</span>
                </button>
                <button className={styles.menuCardItem}>
                  <span>Поддержка</span>
                  <span className={styles.menuCardArrow}>→</span>
                </button>
                <button className={styles.menuCardItem}>
                  <span>О приложении</span>
                  <span className={styles.menuCardValue}>v1.0.0</span>
                </button>
              </div>
            </div>

            {/* Аккаунт */}
            <div className={styles.menuCard}>
              <div className={styles.menuCardHeader}>
                <img className={styles.menuCardIcon} src="/userIcon.png" alt="" />
                <h3 className={styles.menuCardTitle}>Аккаунт</h3>
              </div>
              <div className={styles.menuCardItems}>
                <button className={styles.menuCardItem}>
                  <span>Безопасность</span>
                  <span className={styles.menuCardArrow}>→</span>
                </button>
                <button className={styles.menuCardItem}>
                  <span>Приватность</span>
                  <span className={styles.menuCardArrow}>→</span>
                </button>
                <button 
                  className={`${styles.menuCardItem} ${styles.logoutButton}`}
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <span>{isLoggingOut ? 'Выход...' : 'Выйти'}</span>
                  {isLoggingOut ? (
                    <span className={styles.logoutSpinner}></span>
                  ) : (
                    <span className={styles.menuCardArrow}>→</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}