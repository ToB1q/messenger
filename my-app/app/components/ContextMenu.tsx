// app/components/ContextMenu.tsx
'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessageItem } from '../lib/api/types'; // Добавьте этот импорт
import styles from './ContextMenu.module.css';

interface ContextMenuProps {
  x: number;
  y: number;
  message: ChatMessageItem;
  isMyMessage: boolean;
  onClose: () => void;
  onReply: () => void;
  onDelete: () => void;
  onDeleteForEveryone?: () => void;
}

export default function ContextMenu({
  x,
  y,
  message,
  isMyMessage,
  onClose,
  onReply,
  onDelete,
  onDeleteForEveryone
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  // Адаптация позиции меню, чтобы не выходило за экран
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  return (
    <div 
      ref={menuRef}
      className={styles.contextMenu}
      style={{ left: adjustedX, top: adjustedY }}
    >
      <div className={styles.menuItem} onClick={onReply}>
        <span className={styles.menuIcon}>↩️</span>
        <span className={styles.menuText}>Ответить</span>
      </div>

      {isMyMessage && (
        <>
          <div className={styles.menuDivider} />
          <div className={styles.menuItem} onClick={onDelete}>
            <span className={styles.menuIcon}>🗑️</span>
            <span className={styles.menuText}>Удалить у себя</span>
          </div>
          <div className={styles.menuItem} onClick={onDeleteForEveryone}>
            <span className={styles.menuIcon}>⚠️</span>
            <span className={styles.menuText}>Удалить у всех</span>
          </div>
        </>
      )}
    </div>
  );
}