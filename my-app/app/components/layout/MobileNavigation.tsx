"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function MobileNavigation() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile || pathname === '/auth') return null;

  return (
    <div className="mobileBottomNav">
      <Link href="/feed" className={`mobileNavItem ${pathname === '/feed' ? 'active' : ''}`}>
        <img src="/ribbon.svg" alt="Лента" className="mobileNavIcon" />
        <span className="mobileNavLabel">Лента</span>
      </Link>
      <Link href="/chat" className={`mobileNavItem ${pathname === '/chat' || pathname?.startsWith('/chat/') ? 'active' : ''}`}>
        <img src="/chat.svg" alt="Чаты" className="mobileNavIcon" />
        <span className="mobileNavLabel">Чаты</span>
      </Link>
      <Link href="/menu" className={`mobileNavItem ${pathname === '/menu' ? 'active' : ''}`}>
        <img src="/menu.svg" alt="Меню" className="mobileNavIcon" />
        <span className="mobileNavLabel">Меню</span>
      </Link>
    </div>
  );
}