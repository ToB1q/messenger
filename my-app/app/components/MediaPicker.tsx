// app/components/MediaPicker.tsx
'use client';

import { useState, useRef } from 'react';
import styles from './MediaPicker.module.css';

interface MediaPickerProps {
  onSelect: (files: File[]) => void;
  onClose: () => void;
  maxCount?: number;
}

export default function MediaPicker({ onSelect, onClose, maxCount = 9 }: MediaPickerProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  
console.log('📸 Selected files:', files.map(f => ({
    name: f.name,
    type: f.type,
    size: f.size,
    lastModified: new Date(f.lastModified).toISOString()
  })));

  // Проверяем лимит
  if (selectedFiles.length + files.length > maxCount) {
    alert(`Можно выбрать не более ${maxCount} файлов`);
    return;
  }

  // Проверяем размер (max 20MB)
  const maxSize = 20 * 1024 * 1024;
  const oversizedFiles = files.filter(f => f.size > maxSize);
  if (oversizedFiles.length > 0) {
    alert('Файлы не должны превышать 20MB');
    return;
  }

  // Проверяем тип
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];
  const invalidFiles = files.filter(f => !allowedTypes.includes(f.type));
  if (invalidFiles.length > 0) {
    alert('Поддерживаются только JPEG, PNG, GIF, WEBP и MP4');
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
    if (selectedFiles.length > 0) {
      setIsUploading(true);
      try {
        await onSelect(selectedFiles);
        onClose();
      } catch (error) {
        console.error('Error sending media:', error);
        alert('Ошибка при отправке');
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Выберите медиа</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          <button 
            className={styles.selectButton}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'Отправка...' : '+ Выбрать файлы'}
          </button>

          {selectedFiles.length > 0 && (
            <>
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
              </div>

              <div className={styles.footer}>
                <span>Выбрано: {selectedFiles.length}</span>
                <button 
                  className={styles.sendButton}
                  onClick={handleSend}
                  disabled={isUploading}
                >
                  {isUploading ? 'Отправка...' : 'Отправить'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}