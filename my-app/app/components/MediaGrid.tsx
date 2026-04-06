// app/components/MediaGrid.tsx
'use client';

import { useState } from 'react';
import type { Attachment } from '../lib/api/types';
import styles from './MediaGrid.module.css';

interface MediaGridProps {
  attachments: Attachment[];
  caption?: string;
  isMyMessage?: boolean;
  messageTime?: string;
  isRead?: boolean;
  onMediaClick?: (index: number) => void;
}

export default function MediaGrid({ 
  attachments, 
  caption, 
  isMyMessage,
  messageTime,
  isRead,
  onMediaClick 
}: MediaGridProps) {
  const [loaded, setLoaded] = useState<boolean[]>(new Array(attachments.length).fill(false));

  // Фильтруем только фото и видео для сетки (голосовые обрабатываются отдельно)
  const mediaAttachments = attachments.filter(att => att.kind === 'photo' || att.kind === 'video');

  if (mediaAttachments.length === 0) return null;

  const getGridClass = (count: number) => {
    if (count === 1) return styles.grid1;
    if (count === 2) return styles.grid2;
    if (count === 3) return styles.grid3;
    if (count === 4) return styles.grid4;
    if (count === 5) return styles.grid5;
    if (count === 6) return styles.grid6;
    if (count === 7) return styles.grid7;
    if (count === 8) return styles.grid8;
    if (count === 9) return styles.grid9;
    return styles.gridMany;
  };

  const getItemClass = (index: number, total: number) => {
    if (total === 3) {
      if (index === 0) return styles.itemLarge;
      return styles.itemSmall;
    }
    if (total === 5) {
      if (index < 2) return styles.itemHalf;
    }
    if (total === 7) {
      if (index === 0) return styles.itemDouble;
    }
    return '';
  };

  return (
    <div className={styles.mediaContainer}>
      <div className={`${styles.mediaGrid} ${getGridClass(mediaAttachments.length)}`}>
        {mediaAttachments.map((attachment, index) => (
          <div
            key={attachment.id}
            className={`${styles.gridItem} ${getItemClass(index, mediaAttachments.length)}`}
            onClick={() => onMediaClick?.(index)}
          >
            {attachment.kind === 'photo' ? (
              <img
                src={`https://dev5.pinkmoneyx.ru/api/v1/files/${attachment.file_id}`}
                alt={`media-${index}`}
                className={`${styles.mediaImage} ${loaded[index] ? styles.loaded : ''}`}
                onLoad={() => {
                  const newLoaded = [...loaded];
                  newLoaded[index] = true;
                  setLoaded(newLoaded);
                }}
                loading="lazy"
              />
            ) : (
              <video
                src={`https://dev5.pinkmoneyx.ru/api/v1/files/${attachment.file_id}`}
                className={styles.mediaVideo}
                preload="metadata"
              />
            )}
            {!loaded[index] && attachment.kind === 'photo' && (
              <div className={styles.mediaPlaceholder}>
                <span>Загрузка...</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {caption && (
        <div className={`${styles.captionContainer} ${isMyMessage ? styles.myMessage : styles.theirMessage}`}>
          <p className={styles.captionText}>{caption}</p>
          {messageTime && (
            <span className={styles.captionTime}>
              {messageTime}
              {isMyMessage && (
                <img
                  className={styles.messageStatus}
                  src={isRead ? '/read.svg' : '/not-read.svg'}
                  alt={isRead ? 'Прочитано' : 'Отправлено'}
                />
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}