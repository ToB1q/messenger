// app/components/DeleteConfirmation.tsx
'use client';

import { useChatStore } from '@/app/store/chatStore';
import styles from './DeleteConfirmation.module.css';

export default function DeleteConfirmation() {
  const { 
    deleteConfirmation, 
    hideDeleteConfirmation, 
    deleteMessage,
    selectedChat 
  } = useChatStore();

  if (!deleteConfirmation.show || !deleteConfirmation.message || !selectedChat) {
    return null;
  }

  const message = deleteConfirmation.message;
  const isMyMessage = message.sender_user_id === JSON.parse(localStorage.getItem('user') || '{}').id;

  const handleDeleteForMe = async () => {
    await deleteMessage(selectedChat, message.id, 'for_me');
  };

  const handleDeleteForEveryone = async () => {
    if (confirm('Удалить сообщение для всех? Это действие нельзя отменить.')) {
      await deleteMessage(selectedChat, message.id, 'for_everyone');
    }
  };

  return (
    <div className={styles.overlay} onClick={hideDeleteConfirmation}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Удалить сообщение</h3>
          <button className={styles.closeButton} onClick={hideDeleteConfirmation}>×</button>
        </div>

        <div className={styles.content}>
          <p className={styles.messagePreview}>
            "{message.text || (message.type === 'media' ? 'Медиа-сообщение' : '')}"
          </p>

          <div className={styles.options}>
            <button className={styles.optionButton} onClick={handleDeleteForMe}>
              <span className={styles.optionIcon}>🗑️</span>
              <div className={styles.optionText}>
                <span className={styles.optionTitle}>Удалить у себя</span>
                <span className={styles.optionDescription}>
                  Сообщение исчезнет только у вас
                </span>
              </div>
            </button>

            {isMyMessage && (
              <button className={styles.optionButton} onClick={handleDeleteForEveryone}>
                <span className={styles.optionIcon}>⚠️</span>
                <div className={styles.optionText}>
                  <span className={styles.optionTitle}>Удалить у всех</span>
                  <span className={styles.optionDescription}>
                    Сообщение исчезнет у всех участников чата
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}