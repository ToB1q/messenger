'use client';

import { useState } from 'react';
import Header from '@/app/components/layout/Header';
import styles from './menu.module.css';

export default function MenuPage() {
  const [activeTab, setActiveTab] = useState('menu');

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
                <h1 className={styles.name}>ToB1</h1>
                <span className={styles.verifiedBadge}>✔</span>
              </div>
              <div className={styles.profileContact}>
                <span className={styles.phone}>+7 999 123 45 67</span>
                <span className={styles.username}>@tobiq</span>
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
                <button className={`${styles.menuCardItem} ${styles.logoutButton}`}>
                  <span>Выйти</span>
                  <span className={styles.menuCardArrow}>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}