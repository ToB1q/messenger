// app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';
import { api } from '../lib/api/client'; // Исправленный импорт

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Проверяем, не авторизован ли уже пользователь
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      console.log('User already logged in, redirecting to chats');
      router.push('/chat');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Получаем или создаем device_uuid
      let deviceUuid = localStorage.getItem('device_uuid');
      if (!deviceUuid) {
        deviceUuid = crypto.randomUUID();
        localStorage.setItem('device_uuid', deviceUuid);
      }

      // Собираем информацию об устройстве (минимальный набор)
      const device = {
        device_uuid: deviceUuid,
        platform: 'web',
        // Эти поля опциональны, но могут быть полезны
        device_name: typeof navigator !== 'undefined' ? navigator.userAgent : 'web',
        locale: typeof navigator !== 'undefined' ? navigator.language : 'ru',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      console.log('Attempting login with:', { identifier, device });

      // Используем API клиент для входа
      const data = await api.login(identifier, password, device);
      
      console.log('Login successful:', data);

      // ВАЖНО: Сохраняем ВСЕ данные
      localStorage.setItem('access_token', data.tokens.access_token);
      localStorage.setItem('refresh_token', data.tokens.refresh_token);
      localStorage.setItem('session_uuid', data.session_uuid);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Проверяем, что сохранилось
      console.log('Saved access_token:', localStorage.getItem('access_token'));
      console.log('Saved refresh_token:', localStorage.getItem('refresh_token'));
      console.log('Saved user:', localStorage.getItem('user'));

      // Перенаправляем на список чатов (НЕ на feed)
      router.push('/chat');
      
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Более информативные сообщения об ошибках
      if (err.message?.includes('401')) {
        setError('Неверный логин или пароль');
      } else if (err.message?.includes('400')) {
        setError('Некорректный запрос. Проверьте введенные данные');
      } else if (err.message?.includes('Network')) {
        setError('Ошибка сети. Проверьте подключение к интернету');
      } else {
        setError(err.message || 'Ошибка при входе');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Левая часть с брендингом */}
        <div className={styles.brandSection}>
          <div className={styles.brandContent}>
            <div className={styles.logoWrapper}>
              <img className={styles.logo} src="/Logo.jpg" alt="Phoenix" />
              <span className={styles.brandName}>Phoenix</span>
            </div>
            
            <div className={styles.heroSection}>
              <h1 className={styles.heroTitle}>
                Общайтесь свободно,
                <br />
                <span className={styles.heroAccent}>оставайтесь на связи</span>
              </h1>
              <p className={styles.heroDescription}>
                Современный мессенджер с чатами и лентой новостей.
                Быстро, безопасно, удобно.
              </p>
            </div>

            <div className={styles.statsGrid}>
              {[
                { stat: '1M+', label: 'Активных пользователей' },
                { stat: '24/7', label: 'Поддержка' },
                { stat: '99.9%', label: 'Стабильность' },
                { stat: '100+', label: 'Стран' },
              ].map((item, i) => (
                <div key={i} className={styles.statCard}>
                  <div className={styles.statNumber}>{item.stat}</div>
                  <div className={styles.statLabel}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className={styles.copyright}>
            © 2026 Messenger. Все права защищены.
          </div>
        </div>

        {/* Правая часть с формой входа */}
        <div className={styles.formSection}>
          <div className={styles.formContainer}>
            {/* Мобильное лого */}
            <div className={styles.mobileLogo}>
              <img className={styles.mobileLogoIcon} src="/Logo.jpg" alt="Phoenix" />
            </div>

            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Добро пожаловать!</h2>
              <p className={styles.formSubtitle}>
                Войдите в свой аккаунт
              </p>
            </div>

            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="identifier" className={styles.label}>
                  Логин
                </label>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className={styles.input}
                  placeholder="Email или username"
                  required
                  disabled={loading}
                  autoComplete="username"
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.label}>
                  Пароль
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Введите пароль"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              <div className={styles.optionsRow}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className={styles.checkbox}
                    disabled={loading}
                  />
                  <span>Запомнить меня</span>
                </label>
                
                <button type="button" className={styles.forgotButton} disabled={loading}>
                  Забыли пароль?
                </button>
              </div>

              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Вход...' : 'Войти'}
              </button>

              <div className={styles.divider}>
                <span className={styles.dividerText}>Или войдите через</span>
              </div>

              <div className={styles.socialButtons}>
                <button type="button" className={styles.socialButton} disabled={loading}>
                  <img className={styles.socialIcon} src="/telegram.png" alt="Telegram" />
                  <span className={styles.socialLabel}>Telegram</span>
                </button>
                <button type="button" className={styles.socialButton} disabled={loading}>
                  <img className={styles.socialIcon} src="/google.png" alt="Google" />
                  <span className={styles.socialLabel}>Google</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}