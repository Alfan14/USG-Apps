import { apiClient } from './api';
import { NotificationItem } from '../types';
import { formatDateToIndonesian } from '../utils/formatters';

export function mapBackendNotification(raw: any): NotificationItem {
  return {
    id: raw.id,
    title: raw.title,
    message: raw.message,
    time: formatDateToIndonesian(raw.created_at),
    read: Boolean(raw.is_read),
    type: raw.type || 'general',
    targetId: raw.target_id || undefined,
    createdAt: raw.created_at,
  };
}

class NotificationService {
  async getNotifications(): Promise<NotificationItem[]> {
    const response = await apiClient.get('/patient/notifications');
    const rawList = response.data?.notifications || [];
    return rawList.map(mapBackendNotification);
  }

  async markAllRead(): Promise<void> {
    await apiClient.patch('/patient/notifications/read-all');
  }

  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/patient/notifications/${id}/read`);
  }

  async registerPushToken(token: string, platform: 'android' | 'ios' | 'web' = 'android'): Promise<void> {
    await apiClient.post('/patient/push-token', {
      expo_push_token: token,
      device_platform: platform,
    });
  }
}

export const notificationService = new NotificationService();
