import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  async get(key: string): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key });
      return value;
    } catch (error) {
      console.error(`StorageService.get error for key "${key}":`, error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await Preferences.set({ key, value });
    } catch (error) {
      console.error(`StorageService.set error for key "${key}":`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.error(`StorageService.remove error for key "${key}":`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await Preferences.clear();
    } catch (error) {
      console.error('StorageService.clear error:', error);
      throw error;
    }
  }

  async getObject<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      console.error(`StorageService.getObject parse error for key "${key}":`, error);
      return null;
    }
  }

  async setObject<T>(key: string, value: T): Promise<void> {
    const raw = JSON.stringify(value);
    await this.set(key, raw);
  }
}
