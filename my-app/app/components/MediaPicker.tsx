// app/components/MediaPicker.tsx
'use client';

import { useState, useRef } from 'react';
import styles from './MediaPicker.module.css';

interface MediaPickerProps {
  onSelect: (files: File[], caption: string) => void;
  onClose: () => void;
  maxCount?: number;
}

export default function MediaPicker({ onSelect, onClose, maxCount = 10 }: MediaPickerProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Проверяем лимит
    if (selectedFiles.length + files.length > maxCount) {
      alert(`Можно выбрать не более ${maxCount} файлов`);
      return;
    }

    // Проверяем размер файлов (max 20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    const oversizedFiles = files.filter(f => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      alert('Некоторые файлы превышают 20MB');
      return;
    }

    // Проверяем типы файлов
    const invalidFiles = files.filter(f => !f.type.startsWith('image/') && !f.type.startsWith('video/'));
    if (invalidFiles.length > 0) {
      alert('Можно загружать только изображения и видео');
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);

    // Создаем превью
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      } else {
        // Для видео показываем иконку
        setPreviews(prev => [...prev, '/video-placeholder.png']);
      }
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    try {
      await onSelect(selectedFiles, caption);
      onClose();
    } catch (error) {
      console.error('Error sending media:', error);
      alert('Ошибка при отправке');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Отправить медиа</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {/* Кнопка выбора файлов */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          {selectedFiles.length === 0 ? (
            <div className={styles.emptyState}>
              <button 
                className={styles.selectButton}
                onClick={() => fileInputRef.current?.click()}
              >
                <span className={styles.plusIcon}>+</span>
                Выбрать файлы
              </button>
              <p className={styles.hint}>Поддерживаются JPEG, PNG, GIF, MP4 до 20MB</p>
            </div>
          ) : (
            <>
              {/* Сетка превью */}
              <div className={styles.previewGrid}>
                {previews.map((preview, index) => (
                  <div key={index} className={styles.previewItem}>
                    <img src={preview} alt={`preview-${index}`} />
                    <button 
                      className={styles.removeButton}
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                    >
                      ×
                    </button>
                    <div className={styles.fileInfo}>
                      {selectedFiles[index].name.length > 20 
                        ? selectedFiles[index].name.substring(0, 20) + '...' 
                        : selectedFiles[index].name}
                    </div>
                  </div>
                ))}
                
                {/* Кнопка добавления еще файлов */}
                {selectedFiles.length < maxCount && (
                  <button 
                    className={styles.addMoreButton}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <span className={styles.plusIcon}>+</span>
                    Добавить еще
                  </button>
                )}
              </div>

              {/* Поле для ввода подписи */}
              <div className={styles.captionInputContainer}>
                <textarea
                  className={styles.captionInput}
                  placeholder="Добавьте подпись к медиа (необязательно)..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  disabled={isUploading}
                />
              </div>

              {/* Кнопки действий */}
              <div className={styles.footer}>
                <div className={styles.fileCount}>
                  Выбрано: {selectedFiles.length} {selectedFiles.length === 1 ? 'файл' : 'файлов'}
                </div>
                <div className={styles.actions}>
                  <button 
                    className={styles.cancelButton}
                    onClick={onClose}
                    disabled={isUploading}
                  >
                    Отмена
                  </button>
                  <button 
                    className={styles.sendButton}
                    onClick={handleSend}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Отправка...' : 'Отправить'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}