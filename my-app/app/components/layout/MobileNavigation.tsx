// components/layout/MobileNavigation.tsx
"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/app/context/ThemeContext';

export default function MobileNavigation() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Список путей, где НЕ нужно показывать навигацию
  const noNavPaths = ['/auth', '/login', '/register', '/'];
  
  // Не показываем навигацию на страницах авторизации или когда открыт чат
  if (!isMobile || noNavPaths.includes(pathname) || pathname?.startsWith('/chat/')) return null;

  return (
    <div className="mobileBottomNav">
      <Link href="/feed" className={`mobileNavItem ${pathname === '/feed' ? 'active' : ''}`}>
        <img src="/ribbon.svg" alt="Лента" className="mobileNavIcon" />
        <span className="mobileNavLabel">Лента</span>
      </Link>
      <Link href="/chat" className={`mobileNavItem ${pathname === '/chat' || pathname?.startsWith('/chat/') ? 'active' : ''}`}>
        <img src={theme === 'light' ? '/chat.svg' : '/chat-dark.svg'} alt="Чаты" className="mobileNavIcon" />
        <span className="mobileNavLabel">Чаты</span>
      </Link>
      <Link href="/menu" className={`mobileNavItem ${pathname === '/menu' ? 'active' : ''}`}>
        <img src="/menu.svg" alt="Меню" className="mobileNavIcon" />
        <span className="mobileNavLabel">Меню</span>
      </Link>
    </div>
  );
}