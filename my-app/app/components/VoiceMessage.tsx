// app/components/VoiceMessage.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './VoiceMessage.module.css';

interface VoiceMessageProps {
  audioUrl: string;
  duration: number;
  waveform: number[];
  isMyMessage: boolean;
  isListened?: boolean;
  messageTime?: string; // Добавлено время сообщения
  onPlay?: () => void;
  onEnded?: () => void;
}

export default function VoiceMessage({
  audioUrl,
  duration,
  waveform,
  isMyMessage,
  isListened,
  messageTime,
  onPlay,
  onEnded
}: VoiceMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    audioRef.current = new Audio(audioUrl);
    
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('ended', handleEnded);
    audioRef.current.addEventListener('play', () => setIsPlaying(true));
    audioRef.current.addEventListener('pause', () => setIsPlaying(false));
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, [audioUrl]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress((audioRef.current.currentTime / duration) * 100);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setProgress(0);
    onEnded?.();
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
        onPlay?.();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Визуализация waveform с прогрессом
  const renderWaveform = () => {
    const progressIndex = Math.floor((progress / 100) * waveform.length);
    
    return waveform.map((value, index) => {
      const height = (value / 31) * 30;
      const isPlayed = index <= progressIndex;
      
      return (
        <div
          key={index}
          className={`${styles.waveformBar} ${isPlayed ? styles.played : ''}`}
          style={{ height: `${height}px` }}
        />
      );
    });
  };

  return (
    <div className={`${styles.voiceMessage} ${isMyMessage ? styles.myMessage : styles.theirMessage}`}>
      <button className={styles.playButton} onClick={togglePlay}>
        {isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 19 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>
      
      <div className={styles.waveformContainer} ref={waveformRef}>
        <div className={styles.waveform}>
          {renderWaveform()}
        </div>
        <div className={styles.timeInfo}>
          <span className={styles.timeText}>{formatTime(isPlaying ? currentTime : duration)}</span>
          <div className={styles.messageMeta}>
            {messageTime && (
              <span className={styles.messageTime}>{messageTime}</span>
            )}
            <div className={styles.statusIcons}>
              {!isMyMessage && isListened && (
                <img
                  className={styles.voiceStatusIcon}
                  src="/read.svg"
                  alt="Прослушано"
                />
              )}
              {isMyMessage && (
                <img
                  className={styles.voiceStatusIcon}
                  src={isListened ? '/read.svg' : '/not-read.svg'}
                  alt={isListened ? 'Прослушано' : 'Отправлено'}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 