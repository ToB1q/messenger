// app/components/Avatar.tsx
'use client';

import { useState } from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
  userId: number;
  fullName?: string | null;
  username?: string | null;
  avatarFileId?: number | null;
  size?: 'small' | 'medium' | 'large';
  showOnline?: boolean;
  isOnline?: boolean;
  className?: string; // Добавляем возможность кастомного класса
  onClick?: () => void; // Добавляем обработчик клика
}

export default function Avatar({ 
  userId, 
  fullName, 
  username, 
  avatarFileId, 
  size = 'medium',
  showOnline = false,
  isOnline = false,
  className = '',
  onClick
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const getInitials = (): string => {
    if (fullName) {
      const names = fullName.split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
      }
      return fullName[0].toUpperCase();
    }
    if (username) {
      return username[0].toUpperCase();
    }
    return '?';
  };

  const getAvatarColor = (): string => {
    const colors = [
      '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
      '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
      '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722',
      '#795548', '#9E9E9E', '#607D8B'
    ];
    return colors[userId % colors.length];
  };

  const sizeClass = styles[size];
  const avatarStyle = {
    backgroundColor: getAvatarColor(),
  };

  return (
    <div 
      className={`${styles.avatarContainer} ${sizeClass} ${className}`}
      onClick={onClick}
    >
      {avatarFileId && !imageError ? (
        <img
          src={`https://dev5.pinkmoneyx.ru/api/v1/files/${avatarFileId}`}
          alt={fullName || username || 'User'}
          className={styles.avatarImage}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className={styles.avatarPlaceholder} style={avatarStyle}>
          {getInitials()}
        </div>
      )}
      {showOnline && isOnline && <span className={`${styles.onlineIndicator} ${styles[size]}`} />}
    </div>
  );
}