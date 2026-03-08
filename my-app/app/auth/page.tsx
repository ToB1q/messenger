'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './auth.module.css';
import Link from 'next/link';

type AuthStep = 'email' | 'code' | 'profile';

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(38);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validateEmail = (email: string) => {
    if (!email.trim()) return 'Email не может быть пустым';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Введите корректный email';
    if (/[а-яА-Я]/.test(email)) return 'Email не может содержать русские буквы';
    if (/\s/.test(email)) return 'Email не может содержать пробелы';
    return '';
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }
    // Отправляем код на email
    console.log('Отправляем код на:', email);
    setStep('code');
    // Запускаем таймер
    setTimer(38);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Автоматически переходим к следующему полю
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      console.log('Проверяем код:', fullCode);
      setStep('profile');
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Пароли не совпадают');
      return;
    }
    if (password.length < 8) {
      alert('Пароль должен быть минимум 8 символов');
      return;
    }
    console.log('Завершаем регистрацию:', { email, name, username, password });
    router.replace('/feed');
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  const handleChangeEmail = () => {
    setStep('email');
  };

  const formatTime = (seconds: number) => {
    return seconds.toString().padStart(2, '0') + 'с';
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

        {/* Правая часть с формой */}
        <div className={styles.formSection}>
          <div className={styles.formContainer}>
            {/* Мобильное лого */}
            <div className={styles.mobileLogo}>
              <img className={styles.mobileLogoIcon} src="/Logo.jpg" alt="Phoenix" />
            </div>

            {/* Шаг 1: Ввод email */}
            {step === 'email' && (
              <>
                <div className={styles.formHeader}>
                  <h2 className={styles.formTitle}>Регистрация</h2>
                  <p className={styles.formSubtitle}>
                    Укажите email, мы отправим код подтверждения
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit} className={styles.form}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="email" className={styles.label}>
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError('');
                      }}
                      className={`${styles.input} ${emailError ? styles.inputError : ''}`}
                      placeholder="name@example.com"
                      required
                    />
                    {emailError && (
                      <span className={styles.errorMessage}>{emailError}</span>
                    )}
                  </div>

                  <button type="submit" className={styles.submitButton}>
                    Получить код
                  </button>
                </form>

                <div className={styles.switchSection}>
                  <p className={styles.switchText}>
                     <Link href="/login" className={styles.switchButton}>
                        Войти
                      </Link>
                  </p>
                </div>
              </>
            )}

            {/* Шаг 2: Ввод кода */}
            {step === 'code' && (
              <>
                <div className={styles.formHeader}>
                  <h2 className={styles.formTitle}>Код из письма</h2>
                  <p className={styles.formSubtitle}>
                    Мы отправили код на {email}
                  </p>
                </div>

                <form onSubmit={handleCodeSubmit} className={styles.form}>
                  <div className={styles.codeInputGroup}>
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        id={`code-${index}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        className={styles.codeInput}
                      />
                    ))}
                  </div>

                  <button 
                    type="submit" 
                    className={styles.submitButton}
                    disabled={code.join('').length !== 6}
                  >
                    Подтвердить
                  </button>
                </form>

                <div className={styles.codeActions}>
                  <div className={styles.resendSection}>
                    {timer > 0 ? (
                      <span className={styles.resendTimer}>
                        Отправить код повторно через {formatTime(timer)}
                      </span>
                    ) : (
                      <button className={styles.resendButton}>
                        Отправить код повторно
                      </button>
                    )}
                  </div>
                  
                  <button 
                    onClick={handleChangeEmail}
                    className={styles.changeEmailButton}
                  >
                    Изменить email
                  </button>
                </div>

                <div className={styles.switchSection}>
                  <p className={styles.switchText}>
                    <button
                      onClick={handleBackToLogin}
                      className={styles.switchButton}
                    >
                      Вернуться ко входу
                    </button>
                  </p>
                </div>
              </>
            )}

            {/* Шаг 3: Заполнение профиля */}
            {step === 'profile' && (
              <>
                <div className={styles.formHeader}>
                  <h2 className={styles.formTitle}>Профиль</h2>
                  <p className={styles.formSubtitle}>
                    Завершите регистрацию для {email}
                  </p>
                </div>

                <form onSubmit={handleProfileSubmit} className={styles.form}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="name" className={styles.label}>
                      Имя
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={styles.input}
                      placeholder="Имя и фамилия"
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="username" className={styles.label}>
                      Username
                    </label>
                    <div className={styles.usernameWrapper}>
                      <span className={styles.usernamePrefix}>@</span>
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={styles.usernameInput}
                        placeholder="username"
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
                      placeholder="Минимум 8 символов"
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="confirmPassword" className={styles.label}>
                      Подтверждение
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={styles.input}
                      placeholder="Повторите пароль"
                      required
                    />
                  </div>

                  <button type="submit" className={styles.submitButton}>
                    Завершить регистрацию
                  </button>
                </form>

                <div className={styles.switchSection}>
                  <p className={styles.switchText}>
                    <button
                      onClick={handleBackToLogin}
                      className={styles.switchButton}
                    >
                      Вернуться ко входу
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}