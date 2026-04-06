// lib/api/client.ts
import { 
  AuthSuccess, 
  RefreshRequest,
  UserDto,
  SearchUsersResponse,
  ListChatsResponse,
  ChatMessagesResponse,
  SendMessageResponse,
  CreatePrivateChatResponse,
  CreatePrivateChatRequest,
  SendMediaResponse,
  ErrorResponse,
  DeleteMessageResponse,
  DeleteMode,
  VoiceListenedResponse
} from './types';

const API_BASE_URL = 'https://dev5.pinkmoneyx.ru/api/v1';

function isErrorResponse(data: any): data is ErrorResponse {
  return data && typeof data === 'object' && 'error' in data;
}

class ApiClient {
  private getLocalStorage(key: string): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  }

  private setLocalStorage(key: string, value: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  }

  private removeLocalStorage(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = this.getLocalStorage('refresh_token');
    const deviceUuid = this.getLocalStorage('device_uuid');

    console.log('Attempting to refresh token with:', { refreshToken, deviceUuid });

    if (!refreshToken || !deviceUuid) {
      console.log('No refresh token or device UUID');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refresh_token: refreshToken,
          device_uuid: deviceUuid,
        }),
      });

      const data = await response.json();
      console.log('Refresh response:', { status: response.status, data });

      if (response.ok && !isErrorResponse(data)) {
        this.setLocalStorage('access_token', data.tokens.access_token);
        this.setLocalStorage('refresh_token', data.tokens.refresh_token);
        console.log('Token refreshed successfully');
        return true;
      } else {
        console.log('Refresh failed:', data.error?.message);
        // Если refresh не удался, очищаем все токены
        this.removeLocalStorage('access_token');
        this.removeLocalStorage('refresh_token');
        this.removeLocalStorage('session_uuid');
        this.removeLocalStorage('user');
      }
    } catch (error) {
      console.error('Refresh failed with error:', error);
    }

    return false;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const token = this.getLocalStorage('access_token');
    
    console.log(`Making request to ${endpoint} with token:`, token ? 'Token exists' : 'No token');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();
      console.log(`Response from ${endpoint}:`, { status: response.status, data });

      // Если 401 и это не запрос на refresh
      if (response.status === 401 && !endpoint.includes('/refresh')) {
        console.log('Got 401, attempting to refresh token...');
        
        if (retryCount < 1) {
          const refreshed = await this.refreshToken();
          
          if (refreshed) {
            console.log('Token refreshed, retrying request...');
            // Получаем новый токен
            const newToken = this.getLocalStorage('access_token');
            headers['Authorization'] = `Bearer ${newToken}`;
            
            // Повторяем запрос
            const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
              ...options,
              headers,
            });
            
            const retryData = await retryResponse.json();
            console.log(`Retry response from ${endpoint}:`, { status: retryResponse.status, data: retryData });
            
            if (!retryResponse.ok) {
              if (isErrorResponse(retryData)) {
                throw new Error(retryData.error?.message || 'Request failed');
              }
              throw new Error('Request failed');
            }
            
            return retryData as T;
          } else {
            console.log('Token refresh failed, redirecting to login');
            // Если не удалось обновить токен, перенаправляем на логин
            if (typeof window !== 'undefined') {
              // Очищаем все токены
              this.removeLocalStorage('access_token');
              this.removeLocalStorage('refresh_token');
              this.removeLocalStorage('session_uuid');
              this.removeLocalStorage('user');
              
              window.location.href = '/login';
            }
            throw new Error('Session expired');
          }
        }
      }

      if (isErrorResponse(data)) {
        throw new Error(data.error?.message || 'Request failed');
      }

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      return data as T;
    } catch (error) {
      console.error(`Request to ${endpoint} failed:`, error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error');
    }
  }

  async login(identifier: string, password: string, device: any): Promise<AuthSuccess> {
    const cleanDevice = {
      device_uuid: device.device_uuid,
      platform: 'web'
    };

    const body = {
      identifier,
      password,
      device: cleanDevice
    };

    console.log('Login request body:', body);

    const response = await this.request<AuthSuccess>('/auth/login/password', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    // После успешного логина, сохраняем токены
    if (response && response.tokens) {
      console.log('Login successful, saving tokens');
      this.setLocalStorage('access_token', response.tokens.access_token);
      this.setLocalStorage('refresh_token', response.tokens.refresh_token);
      this.setLocalStorage('session_uuid', response.session_uuid);
      this.setLocalStorage('user', JSON.stringify(response.user));
    }

    return response;
  }

  async getMe(): Promise<UserDto> {
    return this.request<UserDto>('/users/me');
  }

  async searchUsers(username: string, limit = 20): Promise<SearchUsersResponse> {
    return this.request<SearchUsersResponse>(
      `/users/search?username=${encodeURIComponent(username)}&limit=${limit}`
    );
  }

  async getChats(limit = 100): Promise<ListChatsResponse> {
    return this.request<ListChatsResponse>(`/chats?limit=${limit}`);
  }

  async getMessages(
    chatId: number, 
    beforeId?: number, 
    afterId?: number, 
    limit = 50
  ): Promise<ChatMessagesResponse> {
    let url = `/chats/${chatId}/messages?limit=${limit}`;
    if (beforeId) url += `&before_id=${beforeId}`;
    if (afterId) url += `&after_id=${afterId}`;
    return this.request<ChatMessagesResponse>(url);
  }

 async sendMessage(chatId: number, text: string, replyToId?: number | null): Promise<SendMessageResponse> {
  const body: any = {
    client_uuid: crypto.randomUUID(),
    text,
  };
  
  // Важно: добавляем reply_to_message_id если есть
  if (replyToId) {
    body.reply_to_message_id = replyToId;
    console.log('📎 REST reply_to_message_id:', replyToId);
  }
  
  console.log('📤 REST sendMessage body:', body);
  
  return this.request<SendMessageResponse>(`/chats/${chatId}/messages`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

  async createPrivateChat(peerUserId: number): Promise<CreatePrivateChatResponse> {
    return this.request<CreatePrivateChatResponse>('/chats/private', {
      method: 'POST',
      body: JSON.stringify({ peer_user_id: peerUserId }),
    });
  }

async sendMedia(chatId: number, formData: FormData): Promise<SendMediaResponse> {
  const token = this.getLocalStorage('access_token');
  
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Подробно логируем ВСЕ поля FormData
  console.log('📤 ===== COMPLETE FORM DATA DEBUG =====');
  const formDataEntries: any = {};
  let totalSize = 0;
  
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      formDataEntries[key] = {
        name: value.name,
        type: value.type,
        size: value.size,
        lastModified: new Date(value.lastModified).toISOString()
      };
      totalSize += value.size;
      console.log(`📤 Field: ${key} = File: ${value.name} (${value.type}, ${value.size} bytes)`);
    } else {
      formDataEntries[key] = value;
      console.log(`📤 Field: ${key} = ${value}`);
    }
  }
  
  console.log(`📤 Total data size: ${totalSize} bytes`);
  console.log('📤 FormData entries:', formDataEntries);
  console.log('📤 ===== END FORM DATA DEBUG =====');

  // Проверяем обязательные поля
  const requiredFields = ['client_uuid', 'items'];
  const hasMediaFields = Array.from(formData.keys()).some(key => key.startsWith('media_'));
  
  if (!hasMediaFields) {
    console.error('❌ No media files found in FormData');
    throw new Error('At least one media file is required');
  }

  requiredFields.forEach(field => {
    if (!formData.has(field)) {
      console.error(`❌ Missing required field: ${field}`);
      throw new Error(`${field} is required`);
    }
  });

  try {
    const url = `${API_BASE_URL}/chats/${chatId}/messages/media`;
    console.log(`📤 Sending media to: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });

    const responseText = await response.text();
    console.log(`📥 Raw response (${response.status}):`, responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse response as JSON');
      throw new Error('Invalid server response');
    }

    if (!response.ok) {
      console.error('❌ Server error details:', data);
      throw new Error(data.message || data.error || 'Failed to send media');
    }

    return data as SendMediaResponse;
  } catch (error) {
    console.error('❌ Error sending media:', error);
    throw error;
  }
}

  async logout(): Promise<void> {
  const refreshToken = this.getLocalStorage('refresh_token');
  const deviceUuid = this.getLocalStorage('device_uuid');
  const accessToken = this.getLocalStorage('access_token');

  console.log('Logging out with:', { refreshToken, deviceUuid, accessToken });

  if (refreshToken && deviceUuid) {
    try {
      // Важно: отправляем запрос с Authorization header
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}` // Добавляем токен в заголовок
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
          device_uuid: deviceUuid,
        }),
      });
      
      const data = await response.json();
      console.log('Logout response:', { status: response.status, data });
      
      // Если сервер вернул 401 при logout, пробуем без токена
      if (response.status === 401) {
        console.log('Got 401 on logout, retrying without token...');
        const retryResponse = await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            refresh_token: refreshToken,
            device_uuid: deviceUuid,
          }),
        });
        const retryData = await retryResponse.json();
        console.log('Retry logout response:', { status: retryResponse.status, data: retryData });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    }
  }

  // Очищаем localStorage
  this.removeLocalStorage('access_token');
  this.removeLocalStorage('refresh_token');
  this.removeLocalStorage('session_uuid');
  this.removeLocalStorage('device_uuid');
  this.removeLocalStorage('user');
  
  console.log('LocalStorage cleared');
  
  // Закрываем WebSocket соединение
  if (typeof window !== 'undefined') {
    // Импортируем websocketService и закрываем соединение
    const { websocketService } = await import('../websocket/websocket.service');
    websocketService.disconnect();
  }
}


async deleteMessage(chatId: number, messageId: number, mode: DeleteMode = 'for_me'): Promise<DeleteMessageResponse> {
  console.log(`🗑️ Deleting message ${messageId} from chat ${chatId} with mode: ${mode}`);
  
  // Используем правильный DELETE метод с query параметром
  const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages/${messageId}?mode=${mode}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${this.getLocalStorage('access_token')}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  console.log(`📥 Delete response:`, { status: response.status, data });

  if (!response.ok) {
    if (isErrorResponse(data)) {
      throw new Error(data.error?.message || 'Failed to delete message');
    }
    throw new Error(`HTTP error ${response.status}`);
  }

  return data as DeleteMessageResponse;
}

async markVoiceListened(chatId: number, messageId: number, attachmentId: number): Promise<VoiceListenedResponse> {
  return this.request<VoiceListenedResponse>(`/chats/${chatId}/messages/${messageId}/voice-listened`, {
    method: 'POST',
    body: JSON.stringify({ attachment_id: attachmentId }),
  });
}

async uploadAvatar(file: File): Promise<UserDto> {
  const token = this.getLocalStorage('access_token');
  
  const formData = new FormData();
  formData.append('avatar', file);

  console.log('📤 Uploading avatar:', file.name, file.type, file.size);

  const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const data = await response.json();
  console.log('📥 Avatar upload response:', { status: response.status, data });

  if (!response.ok) {
    if (isErrorResponse(data)) {
      throw new Error(data.error?.message || 'Failed to upload avatar');
    }
    throw new Error(`HTTP error ${response.status}`);
  }

  // Обновляем данные пользователя в localStorage
  this.setLocalStorage('user', JSON.stringify(data));
  
  return data as UserDto;
}
}



export const api = new ApiClient();