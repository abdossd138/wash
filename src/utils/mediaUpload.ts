/**
 * Utility functions for client-side image compression, video processing, and URL formatting
 * Allows uploading directly from device gallery/camera as well as web URLs
 */

export interface VideoEmbedInfo {
  embedUrl: string;
  isIframe: boolean;
  isYouTube: boolean;
  thumbnailUrl?: string;
}

/**
 * Universal video URL parser supporting YouTube (Standard, Shorts, Share), Vimeo, Google Drive, and direct video links
 */
export function formatVideoEmbedInfo(url: string): VideoEmbedInfo {
  if (!url) {
    return { embedUrl: '', isIframe: false, isYouTube: false };
  }
  const trimmed = url.trim();

  // 1. YouTube Shorts: https://www.youtube.com/shorts/VIDEO_ID or https://youtube.com/shorts/VIDEO_ID
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/i);
  if (shortsMatch && shortsMatch[1]) {
    const videoId = shortsMatch[1];
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`,
      isIframe: true,
      isYouTube: true,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }

  // 2. YouTube standard watch: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (watchMatch && watchMatch[1]) {
    const videoId = watchMatch[1];
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`,
      isIframe: true,
      isYouTube: true,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }

  // 3. YouTube embed already
  if (trimmed.includes('youtube.com/embed/') || trimmed.includes('youtube-nocookie.com/embed/')) {
    const embedMatch = trimmed.match(/embed\/([^"&?\/\s]{11})/i);
    const videoId = embedMatch ? embedMatch[1] : undefined;
    return {
      embedUrl: trimmed,
      isIframe: true,
      isYouTube: true,
      thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : undefined,
    };
  }

  // 4. Google Drive preview: https://drive.google.com/file/d/FILE_ID/view... -> /preview
  const gdriveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (gdriveMatch && gdriveMatch[1]) {
    return {
      embedUrl: `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`,
      isIframe: true,
      isYouTube: false,
    };
  }

  // 5. Vimeo: https://vimeo.com/VIDEO_ID
  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      isIframe: true,
      isYouTube: false,
    };
  }

  // Direct MP4 / WebM / blob / data URL
  return {
    embedUrl: trimmed,
    isIframe: false,
    isYouTube: false,
  };
}

/**
 * Compresses an image file from device camera or gallery to a lightweight Web-optimized JPEG
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1200,
  maxHeight = 750,
  quality = 0.78
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio scaling
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('فشل في قراءة بيانات الصورة'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('فشل في تحميل ملف الصورة'));
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts a thumbnail poster image from a video file
 */
export async function extractVideoThumbnail(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const url = URL.createObjectURL(file);
      video.src = url;

      video.onloadeddata = () => {
        video.currentTime = Math.min(1.0, video.duration / 2 || 0.5);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(640, video.videoWidth || 640);
          canvas.height = Math.min(360, video.videoHeight || 360);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumb = canvas.toDataURL('image/jpeg', 0.7);
            URL.revokeObjectURL(url);
            resolve(thumb);
            return;
          }
        } catch (e) {
          console.warn('Canvas extract failed:', e);
        }
        URL.revokeObjectURL(url);
        resolve(null);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      // Fallback timeout in case video fails to seek
      setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve(null);
      }, 4000);
    } catch (e) {
      resolve(null);
    }
  });
}

/**
 * Reads a video file with size safety checks for direct embedding
 */
export async function readVideoFileAsDataUrl(
  file: File,
  maxSizeMB = 20
): Promise<{ dataUrl?: string; thumbnail?: string; error?: string; sizeMB: number }> {
  const sizeMB = file.size / (1024 * 1024);

  if (sizeMB > maxSizeMB) {
    return {
      sizeMB,
      error: `حجم الفيديو (${sizeMB.toFixed(1)} ميجابايت) يتجاوز الحد الأقصى (${maxSizeMB} ميجابايت). للملفات الكبيرة يُنصح بوضع رابط يوتيوب أو استخدام فيديو أقصر.`,
    };
  }

  const thumbnail = await extractVideoThumbnail(file);

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        dataUrl: reader.result as string,
        thumbnail: thumbnail || undefined,
        sizeMB,
      });
    };
    reader.onerror = () => {
      resolve({
        error: 'حدث خطأ أثناء قراءة ملف الفيديو من الجهاز.',
        sizeMB,
      });
    };
    reader.readAsDataURL(file);
  });
}
