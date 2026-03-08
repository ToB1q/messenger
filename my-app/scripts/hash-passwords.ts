import { hashPassword } from '@/app/lib/auth/password';
import { query } from '@/app/lib/db';

async function hashAllPasswords() {
  try {
    // Получаем всех пользователей
    const users = await query('SELECT id, password_hash FROM users') as any[];
    
    for (const user of users) {
      // Здесь нужно заменить 'qwerty123' на реальные пароли
      // Для теста используем один пароль для всех
      const hashedPassword = await hashPassword('qwerty123');
      
      await query(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [hashedPassword, user.id]
      );
      
      console.log(`Updated password for user ID: ${user.id}`);
    }
    
    console.log('All passwords hashed successfully');
  } catch (error) {
    console.error('Error hashing passwords:', error);
  } finally {
    process.exit();
  }
}

// Запускаем скрипт
hashAllPasswords();