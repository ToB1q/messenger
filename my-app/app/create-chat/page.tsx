// app/create-chat/page.tsx - упрощенная версия
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api/client';

export default function CreateChatPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    try {
      const response = await api.createPrivateChat(parseInt(userId));
      router.push(`/chat/${response.chat_id}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка при создании чата');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '100px 20px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Создать чат</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          placeholder="ID пользователя"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '10px 20px', background: '#0088cc', color: 'white', border: 'none' }}
        >
          {loading ? 'Создание...' : 'Создать чат'}
        </button>
      </form>
    </div>
  );
}