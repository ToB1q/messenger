'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageTitle, setPageTitle] = useState('');

  // Определяем заголовок страницы на основе пути
  useEffect(() => {
    if (title) {
      setPageTitle(title);
      return;
    }

    switch (pathname) {
      case '/feed':
        setPageTitle('Лента');
        break;
      case '/chat':
        setPageTitle('Чаты');
        break;
      case '/menu':
        setPageTitle('Меню');
        break;
      case '/profile':
        setPageTitle('Профиль');
        break;
      case '/settings':
        setPageTitle('Настройки');
        break;
      default:
        if (pathname?.startsWith('/chat/')) {
          setPageTitle('Чат');
        } else {
          setPageTitle('Messenger');
        }
    }
  }, [pathname, title]);

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setTimeout(() => {
        document.getElementById('search-input')?.focus();
      }, 100);
    } else {
      setSearchQuery('');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Поиск:', searchQuery);
    // Здесь будет логика поиска
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        {/* Левая часть - логотип и название страницы */}
        <div className={styles.leftSection}>
          <Link href="/feed" className={styles.logo}>
            <div className={styles.logoIcon}>
              <span className={styles.logoText}>M</span>
            </div>
            <span className={styles.brandName}>Messenger</span>
          </Link>
          
          {pageTitle && (
            <>
              <span className={styles.separator}>/</span>
              <span className={styles.pageTitle}>{pageTitle}</span>
            </>
          )}
        </div>

        {/* Правая часть - навигация и действия */}
        <div className={styles.rightSection}>
          {/* Поиск */}
          <div className={styles.searchContainer}>
            <button 
              className={`${styles.iconButton} ${isSearchOpen ? styles.active : ''}`}
              onClick={toggleSearch}
              aria-label="Поиск"
            >
              <img src="/search.svg" alt="" className={styles.icon}/>
            </button>
            
            {isSearchOpen && (
              <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
                <input
                  id="search-input"
                  type="text"
                  className={styles.searchInput}
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    className={styles.clearButton}
                    onClick={() => setSearchQuery('')}
                  >
                    ✕
                  </button>
                )}
              </form>
            )}
          </div>

          {/* Навигация */}
          <nav className={styles.nav}>
            <Link 
              href="/feed" 
              className={`${styles.navItem} ${pathname === '/feed' ? styles.active : ''}`}
            >
              <img src="/ribbon.svg" alt="" className={styles.navIcon}/>
              <span className={styles.navLabel}>Лента</span>
            </Link>
            
            <Link 
              href="chat/" 
              className={`${styles.navItem} ${pathname === '/chat' || pathname?.startsWith('/chat/') ? styles.active : ''}`}
            >
              <img src="/chat.svg" alt="" className={styles.navIcon}/>
              <span className={styles.navLabel}>Чаты</span>
            </Link>
            
            <Link 
              href="/menu" 
              className={`${styles.navItem} ${pathname === '/menu' ? styles.active : ''}`}
            >
              <img src="/menu.svg" alt="" className={styles.navIcon}/>
              <span className={styles.navLabel}>Меню</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}