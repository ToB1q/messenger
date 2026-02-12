'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import feed from '../feed/page';
import styles from './auth.module.css';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(isLogin ? 'Вход' : 'Регистрация', { phone, password, name });
    router.replace('feed');
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Левая часть с брендингом */}
        <div className={styles.brandSection}>
          <div className={styles.brandContent}>
            <div className={styles.logoWrapper}>
              <div className={styles.logo}>
                <span className={styles.logoText}>M</span>
              </div>
              <span className={styles.brandName}>Messenger</span>
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

        {/* Правая часть с формой */}
        <div className={styles.formSection}>
          <div className={styles.formContainer}>
            {/* Заголовок формы */}
            <div className={styles.formHeader}>
              <div className={styles.mobileLogo}>
                <div className={styles.mobileLogoIcon}>
                  <span className={styles.mobileLogoText}>M</span>
                </div>
              </div>
              <h2 className={styles.formTitle}>
                {isLogin ? 'Добро пожаловать!' : 'Создать аккаунт'}
              </h2>
              <p className={styles.formSubtitle}>
                {isLogin 
                  ? 'Войдите в свой аккаунт' 
                  : 'Зарегистрируйтесь для начала работы'}
              </p>
            </div>

            {/* Форма */}
            <form onSubmit={handleSubmit} className={styles.form}>
              {!isLogin && (
                <div className={styles.inputGroup}>
                  <label htmlFor="name" className={styles.label}>
                    Имя пользователя
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={styles.input}
                    placeholder="Анна Иванова"
                    required={!isLogin}
                  />
                </div>
              )}

              <div className={styles.inputGroup}>
                <label htmlFor="phone" className={styles.label}>
                  Номер телефона
                </label>
                <div className={styles.phoneInputWrapper}>
                  <span className={styles.phonePrefix}>+7</span>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={styles.phoneInput}
                    placeholder="(999) 123-45-67"
                    required
                  />
                </div>
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
                />
              </div>

              {isLogin && (
                <div className={styles.forgotPassword}>
                  <button type="button" className={styles.forgotButton}>
                    Забыли пароль?
                  </button>
                </div>
              )}

              <button
                type="submit"
                className={styles.submitButton}
              >
                {isLogin ? 'Войти' : 'Зарегистрироваться'}
              </button>

              {isLogin && (
                <>
                  <div className={styles.divider}>
                    <span className={styles.dividerText}>Или войдите через</span>
                  </div>

                  <div className={styles.socialButtons}>
                    <button
                      type="button"
                      className={styles.socialButton}
                    >
                      <img className={styles.socialIcon} src="/telegram.png" alt="" />
                      <span className={styles.socialLabel}>Telegram</span>
                    </button>
                    <button
                      type="button"
                      className={styles.socialButton}
                    >
                      <img className={styles.socialIcon} src="/google.png" alt="" />
                      <span className={styles.socialLabel}>Google</span>
                    </button>
                  </div>
                </>
              )}
            </form>

            {/* Переключатель между входом и регистрацией */}
            <div className={styles.switchSection}>
              <p className={styles.switchText}>
                {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className={styles.switchButton}
                >
                  {isLogin ? 'Создать аккаунт' : 'Войти'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}