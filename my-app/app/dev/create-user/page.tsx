'use client';

import { useState } from 'react';

export default function CreateUserPage() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    full_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/dev/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({ success: true, message: 'Пользователь успешно создан!' });
        setFormData({ email: '', username: '', password: '', full_name: '' });
      } else {
        setResult({ success: false, error: data.error || 'Ошибка при создании' });
      }
    } catch (error) {
      setResult({ success: false, error: 'Ошибка соединения' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Примеры готовых пользователей
  const examples = [
    { email: 'test@example.com', username: 'testuser', password: 'qwerty123', full_name: 'Test User' },
    { email: 'alex@example.com', username: 'alex_design', password: 'qwerty123', full_name: 'Alex Designer' },
    { email: 'anna@example.com', username: 'anna_travel', password: 'qwerty123', full_name: 'Anna Travel' },
  ];

  const fillExample = (example: typeof examples[0]) => {
    setFormData(example);
  };

  return (
    <div style={{
      maxWidth: '500px',
      margin: '50px auto',
      padding: '30px',
      background: 'white',
      borderRadius: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ marginBottom: '20px', color: '#1F2937' }}>Создание пользователя (Dev)</h1>
      
      {/* Примеры */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '10px', color: '#4B5563' }}>Быстрое заполнение:</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => fillExample(ex)}
              style={{
                padding: '8px 16px',
                background: '#E5E7EB',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {ex.username}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#374151' }}>
            Email:
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#374151' }}>
            Username:
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#374151' }}>
            Полное имя:
          </label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#374151' }}>
            Пароль:
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
        </div>

        {result && (
          <div style={{
            padding: '10px',
            marginBottom: '20px',
            background: result.success ? '#D1FAE5' : '#FEE2E2',
            color: result.success ? '#065F46' : '#991B1B',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            {result.success ? result.message : result.error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: '#2563EB',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Создание...' : 'Создать пользователя'}
        </button>
      </form>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#6B7280' }}>
        <p>⚠️ Этот endpoint доступен только в режиме разработки</p>
        <p>После создания пользователя вы сможете войти с указанными email/username и паролем</p>
      </div>
    </div>
  );
}