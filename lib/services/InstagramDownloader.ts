import { igdl } from 'btch-downloader';
import YTDlpWrap from 'yt-dlp-wrap';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import ffmpeg from 'fluent-ffmpeg';

export interface DownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
  method?: 'igdl' | 'ytdlp' | 'direct';
  debugInfo?: any;
}

class InstagramDownloader {
  private ytDlp: YTDlpWrap | null = null;
  private tempDir: string;
  private ytDlpPath: string | null = null;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp');

    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    // Defer yt-dlp setup to ensureYtDlp()
  }

  /**
   * Ensure yt-dlp binary is available. Downloads it locally if missing.
   */
  private async ensureYtDlp(): Promise<void> {
    if (this.ytDlp) return;

    const binDir = path.join(this.tempDir, 'bin');
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }

    const binaryName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
    const destPath = path.join(binDir, binaryName);

    if (!fs.existsSync(destPath)) {
      console.log('yt-dlp not found locally. Downloading from GitHub...');
      try {
        await YTDlpWrap.downloadFromGithub(destPath);
        if (process.platform !== 'win32') {
          fs.chmodSync(destPath, 0o755);
        }
        console.log('yt-dlp downloaded to:', destPath);
      } catch (e) {
        console.warn('Failed to download yt-dlp:', e);
        // Fall back to system-installed yt-dlp if available
        try {
          this.ytDlp = new YTDlpWrap();
          return;
        } catch (err) {
          throw new Error('yt-dlp not available and download failed');
        }
      }
    }

    this.ytDlpPath = destPath;
    this.ytDlp = new YTDlpWrap(destPath);
  }

  /**
   * Check if a video file has an audio stream
   */
  private async hasAudioStream(filePath: string): Promise<boolean> {
    // If the file itself is an audio type, we can trust it has audio
    const ext = path.extname(filePath).toLowerCase();
    const audioExts = new Set(['.m4a', '.mp3', '.aac', '.wav', '.ogg', '.flac', '.mpega']);
    if (audioExts.has(ext)) return true;

    return new Promise((resolve) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          console.warn('ffprobe not available or failed, assuming audio present to proceed:', err.message);
          resolve(true);
        } else {
          const hasAudio = (metadata.streams || []).some((s: any) => s.codec_type === 'audio');
          resolve(hasAudio);
        }
      });
    });
  }

  /**
   * Extract Instagram reel ID from URL
   */
  private extractReelId(url: string): string | null {
    // Match patterns like:
    // https://www.instagram.com/reel/ABC123/
    // https://instagram.com/p/ABC123/
    // https://www.instagram.com/reels/ABC123/
    const patterns = [
      /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/reels\/([A-Za-z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Download reel using btch-downloader's igdl (Node.js scraper)
   */
  private async downloadWithBtch(url: string): Promise<DownloadResult> {
    try {
      console.log('Attempting download with btch-downloader...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Download timeout')), 30000)
      );

      const downloadPromise = (async () => {
        // btch-downloader exports `igdl` for Instagram
        const result = await igdl(url);

        // Expected shape: { developer, status: true|false, result: Array<{ thumbnail: string, url: string }> }
        if (!result || result.status !== true || !result.result || result.result.length === 0) {
          return {
            success: false,
            error: 'No media found in reel',
            method: 'igdl' as const,
            debugInfo: result
          };
        }

        // Get video URL from first media item
        const videoData = result.result[0];
        if (!videoData || !videoData.url) {
          return {
            success: false,
            error: 'No video URL found in response',
            method: 'igdl' as const,
            debugInfo: result
          };
        }

        const videoUrl = videoData.url;

        // Download the video file
        const filename = `reel-${Date.now()}.mp4`;
        const filePath = path.join(this.tempDir, filename);

        await this.downloadFile(videoUrl, filePath);

        return {
          success: true,
          filePath,
          method: 'igdl' as const
        };
      })();

      // Race timeout against download
      return await Promise.race([downloadPromise, timeoutPromise]) as DownloadResult;
    } catch (error: any) {
      console.error('btch-downloader error:', error.message);
      return {
        success: false,
        error: error.message || 'btch-downloader failed',
        method: 'igdl',
        debugInfo: error
      };
    }
  }

  /**
   * Download reel using yt-dlp (more reliable but requires binary)
   */
  private async downloadWithYtDlp(url: string): Promise<DownloadResult> {
    try {
      await this.ensureYtDlp();
      if (!this.ytDlp) {
        return {
          success: false,
          error: 'yt-dlp not available',
          method: 'ytdlp'
        };
      }
      console.log('Attempting download with yt-dlp (audio-only)...');

      const stamp = Date.now();
      const baseName = `reel-${stamp}`;
      const outputTemplate = path.join(this.tempDir, `${baseName}.%(ext)s`);

      // yt-dlp options: extract best audio as m4a with deterministic name
      const options = [
        '--no-warnings',
        '--no-playlist',
        '-f', 'bestaudio/best',
        '-x', '--audio-format', 'm4a',
        '-o', outputTemplate,
        url
      ];

      // Note: Instagram may require authentication
      // Add these if user provides credentials:
      // '--username', 'USERNAME',
      // '--password', 'PASSWORD',
      // or use cookies:
      // '--cookies-from-browser', 'chrome'

      await this.ytDlp.execPromise(options);

      // Resolve actual output (prefer m4a)
      const preferred = path.join(this.tempDir, `${baseName}.m4a`);
      if (fs.existsSync(preferred)) {
        return { success: true, filePath: preferred, method: 'ytdlp' };
      }
      // Fallback: find any file produced with this basename
      const files = fs.readdirSync(this.tempDir).filter(f => f.startsWith(baseName + '.'));
      const audioExts = new Set(['.m4a', '.mp3', '.aac', '.wav', '.ogg', '.flac', '.mpega']);
      const found = files.find(f => audioExts.has(path.extname(f).toLowerCase()));
      if (found) {
        const resolved = path.join(this.tempDir, found);
        return { success: true, filePath: resolved, method: 'ytdlp' };
      }

      return {
        success: false,
        error: 'File not created after download',
        method: 'ytdlp'
      };
    } catch (error: any) {
      console.error('yt-dlp download error:', error);
      return {
        success: false,
        error: error.message,
        method: 'ytdlp',
        debugInfo: error
      };
    }
  }

  /**
   * Download file from URL
   */
  private async downloadFile(url: string, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      const file = fs.createWriteStream(filePath);

      protocol.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });

        file.on('error', (err) => {
          fs.unlink(filePath, () => {}); // Clean up
          reject(err);
        });
      }).on('error', (err) => {
        fs.unlink(filePath, () => {}); // Clean up
        reject(err);
      });
    });
  }

  /**
   * Download Instagram reel from URL (tries multiple methods)
   */
  async downloadReel(url: string): Promise<DownloadResult> {
    const debugInfo: any = {
      url,
      reelId: this.extractReelId(url),
      timestamp: new Date().toISOString(),
      attempts: []
    };

    // Validate URL
    if (!url.includes('instagram.com')) {
      return {
        success: false,
        error: 'Invalid Instagram URL',
        debugInfo
      };
    }

    // Use yt-dlp (audio-only) to avoid video downloads and extraction
    console.log('Trying yt-dlp (audio-only)...');
    const ytdlpResult = await this.downloadWithYtDlp(url);
    debugInfo.attempts.push({ method: 'ytdlp', result: ytdlpResult });

    if (ytdlpResult.success) {
      // If ytdlp produced an audio file, proceed without probing
      const ext1 = path.extname(ytdlpResult.filePath!).toLowerCase();
      const audioExts1 = new Set(['.m4a', '.mp3', '.aac', '.wav', '.ogg', '.flac', '.mpega']);
      if (audioExts1.has(ext1)) {
        debugInfo.ytdlpHasAudio = true;
        return { ...ytdlpResult, debugInfo };
      }

      // Otherwise, check for audio in container
      const hasAudio1 = await this.hasAudioStream(ytdlpResult.filePath!);
      debugInfo.ytdlpHasAudio = hasAudio1;
      if (hasAudio1) {
        return { ...ytdlpResult, debugInfo };
      } else {
        if (ytdlpResult.filePath) {
          try { fs.unlinkSync(ytdlpResult.filePath); } catch {}
        }
        debugInfo.ytdlpNoAudio = true;
      }
    }

    // All methods failed or no audio in any download
    return {
      success: false,
      error: 'Audio download failed. Instagram may require authentication, URL may be invalid, or the reel is muted.',
      debugInfo
    };
  }

  /**
   * Clean up downloaded files
   */
  async cleanup(filePath: string): Promise<void> {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Cleaned up:', filePath);
    }
  }

  /**
   * Clean up old temp files (older than specified hours)
   */
  async cleanupOldFiles(olderThanHours: number = 24): Promise<void> {
    if (!fs.existsSync(this.tempDir)) {
      return;
    }

    const files = fs.readdirSync(this.tempDir);
    const now = Date.now();
    const maxAge = olderThanHours * 60 * 60 * 1000;

    files.forEach(file => {
      const filePath = path.join(this.tempDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old file: ${file}`);
      }
    });
  }
}

// Export singleton
export const instagramDownloader = new InstagramDownloader();
export default InstagramDownloader;
