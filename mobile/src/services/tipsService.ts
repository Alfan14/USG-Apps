import { apiClient } from './api';
import { PregnancyTip } from '../types';
import { mapCategoryToIcon, mapCategoryToLabel } from '../utils/formatters';
import { storage } from '../utils/storage';

const BOOKMARKS_STORAGE_KEY = 'bloom_saved_tips_ids';

export function mapBackendTip(raw: any, isBookmarked = false): PregnancyTip {
  return {
    id: raw.id,
    title: raw.title,
    summary: raw.summary,
    content: raw.content,
    category: mapCategoryToLabel(raw.category),
    categoryIcon: mapCategoryToIcon(raw.category),
    readTime: `Baca ${raw.read_time_minutes || 3} menit`,
    imageUrl: raw.image_url || raw.imageUrl || undefined,
    trimester: raw.trimester,
    minWeek: raw.min_week ?? raw.minWeek,
    maxWeek: raw.max_week ?? raw.maxWeek,
    isBookmarked,
  };
}

class TipsService {
  private savedTipIds: Set<string> = new Set();

  async loadBookmarks(): Promise<Set<string>> {
    try {
      const data = await storage.getItem(BOOKMARKS_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.savedTipIds = new Set(parsed);
      }
    } catch {
      // Abaikan jika belum ada
    }
    return this.savedTipIds;
  }

  async getTips(params?: {
    trimester?: number;
    week?: number;
    category?: string;
  }): Promise<PregnancyTip[]> {
    await this.loadBookmarks();

    const response = await apiClient.get('/patient/tips', { params });
    const rawList = response.data?.tips || [];

    return rawList.map((item: any) =>
      mapBackendTip(item, this.savedTipIds.has(item.id))
    );
  }

  async getTipById(id: string): Promise<PregnancyTip> {
    await this.loadBookmarks();

    const response = await apiClient.get(`/patient/tips/${id}`);
    if (response.data?.tip) {
      return mapBackendTip(response.data.tip, this.savedTipIds.has(id));
    }
    throw new Error('Artikel edukasi tidak ditemukan.');
  }

  async toggleBookmark(tipId: string): Promise<boolean> {
    await this.loadBookmarks();

    const isCurrentlySaved = this.savedTipIds.has(tipId);
    if (isCurrentlySaved) {
      this.savedTipIds.delete(tipId);
    } else {
      this.savedTipIds.add(tipId);
    }

    try {
      await storage.setItem(
        BOOKMARKS_STORAGE_KEY,
        JSON.stringify(Array.from(this.savedTipIds))
      );
    } catch {
      // Ignore
    }

    return !isCurrentlySaved;
  }
}

export const tipsService = new TipsService();
