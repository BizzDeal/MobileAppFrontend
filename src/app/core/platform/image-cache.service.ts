import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

@Injectable({
  providedIn: 'root',
})
export class ImageCacheService {
  private readonly CACHE_DIR = 'image_cache';
  private readonly inFlightRequests = new Map<string, Promise<string>>();
  
  // Revalidate cached files in the background if they are older than 24 hours
  private readonly REVALIDATE_INTERVAL_MS = 24 * 60 * 60 * 1000;
  // Track URLs already checked or revalidated during this active app session
  private readonly sessionCheckedUrls = new Set<string>();

  /**
   * Returns a local device file URI if cached on disk, downloads and caches the image
   * if not yet cached, or falls back to the original URL if running on Web or on error.
   *
   * Uses the "Stale-While-Revalidate" (SWR) Universal Pattern:
   * 1. If cached on disk -> returns local disk URI instantly (0ms network delay).
   * 2. If the cached file is older than the revalidation interval (or modified on server),
   *    it silently re-downloads and overwrites the disk file in the background so the next view is updated!
   */
  async getCachedImage(url: string | null | undefined): Promise<string> {
    if (!url || typeof url !== 'string') {
      return '';
    }

    // Do not attempt to cache non-HTTP URLs (e.g. data:, blob:, assets/, file://)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return url;
    }

    // On Web browsers, standard HTTP caching applies automatically.
    if (!Capacitor.isNativePlatform()) {
      return url;
    }

    // Prevent duplicate simultaneous downloads for the same image URL
    if (this.inFlightRequests.has(url)) {
      return this.inFlightRequests.get(url)!;
    }

    const cachePromise = this.fetchOrRevalidateImage(url);
    this.inFlightRequests.set(url, cachePromise);

    try {
      return await cachePromise;
    } finally {
      this.inFlightRequests.delete(url);
    }
  }

  private async fetchOrRevalidateImage(url: string): Promise<string> {
    const filename = this.generateSafeFilename(url);
    const filePath = `${this.CACHE_DIR}/${filename}`;

    // Ensure the cache folder exists
    try {
      await Filesystem.mkdir({
        path: this.CACHE_DIR,
        directory: Directory.Cache,
        recursive: true,
      });
    } catch {
      // Directory may already exist
    }

    // Check if image is already cached on disk
    try {
      const stat = await Filesystem.stat({
        path: filePath,
        directory: Directory.Cache,
      });

      if (stat && (stat.size === undefined || stat.size > 0)) {
        const { uri } = await Filesystem.getUri({
          path: filePath,
          directory: Directory.Cache,
        });
        const localFileUrl = Capacitor.convertFileSrc(uri);

        // Universal Stale-While-Revalidate check:
        // If the file is older than REVALIDATE_INTERVAL_MS and hasn't been revalidated this session,
        // silently check/update it in the background without blocking the instant UI render!
        const isExpired = stat.mtime && Date.now() - stat.mtime > this.REVALIDATE_INTERVAL_MS;
        if (isExpired && !this.sessionCheckedUrls.has(url)) {
          this.sessionCheckedUrls.add(url);
          // Trigger background update silently
          this.downloadAndSave(url, filePath).catch(() => {});
        }

        return localFileUrl;
      }
    } catch {
      // File does not exist yet; proceed to initial download
    }

    // If not cached at all, download synchronously before rendering
    return this.downloadAndSave(url, filePath);
  }

  private async downloadAndSave(url: string, filePath: string): Promise<string> {
    this.sessionCheckedUrls.add(url);

    try {
      await Filesystem.downloadFile({
        url,
        path: filePath,
        directory: Directory.Cache,
      });

      const { uri } = await Filesystem.getUri({
        path: filePath,
        directory: Directory.Cache,
      });
      return Capacitor.convertFileSrc(uri);
    } catch {
      // If direct native download fails (e.g., network or CORS quirk), fallback to fetch + write
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP status ${response.status}`);
        }
        const blob = await response.blob();
        const base64Data = await this.blobToBase64(blob);

        await Filesystem.writeFile({
          path: filePath,
          data: base64Data,
          directory: Directory.Cache,
        });

        const { uri } = await Filesystem.getUri({
          path: filePath,
          directory: Directory.Cache,
        });
        return Capacitor.convertFileSrc(uri);
      } catch (error) {
        console.error(`ImageCacheService: Failed to cache image "${url}". Using original URL.`, error);
        return url;
      }
    }
  }

  /**
   * Immediately deletes a specific image from local disk cache, forcing a fresh download on next view.
   * Call this when a user updates their profile picture or banner right inside the app!
   */
  async invalidateImage(url: string): Promise<void> {
    if (!Capacitor.isNativePlatform() || !url) {
      return;
    }
    const filename = this.generateSafeFilename(url);
    try {
      await Filesystem.deleteFile({
        path: `${this.CACHE_DIR}/${filename}`,
        directory: Directory.Cache,
      });
      this.sessionCheckedUrls.delete(url);
    } catch {
      // File already deleted or didn't exist
    }
  }

  /**
   * Clears all cached images from local device storage.
   */
  async clearCache(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await Filesystem.rmdir({
        path: this.CACHE_DIR,
        directory: Directory.Cache,
        recursive: true,
      });
      this.sessionCheckedUrls.clear();
    } catch (error) {
      console.error('ImageCacheService: Failed to clear image cache:', error);
    }
  }

  private generateSafeFilename(url: string): string {
    let hash = 5381;
    for (let i = 0; i < url.length; i++) {
      hash = (hash * 33) ^ url.charCodeAt(i);
    }
    const unsignedHash = hash >>> 0;

    const cleanUrl = url.split('?')[0].split('#')[0];
    const extMatch = cleanUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';

    return `img_${unsignedHash}_${url.length}.${ext}`;
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        resolve(base64 || '');
      };
      reader.readAsDataURL(blob);
    });
  }
}
