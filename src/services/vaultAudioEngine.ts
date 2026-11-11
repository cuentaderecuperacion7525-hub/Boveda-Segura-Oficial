import { DecryptedVaultItem } from '../components/PhotoViewerModal';

interface AudioEngineCallbacks {
  onPlayStateChange?: (isPlaying: boolean) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onTrackChange?: (item: DecryptedVaultItem, index: number) => void;
  onRateChange?: (rate: number) => void;
  onCoverChange?: (coverUrl: string | null) => void;
}

class VaultAudioEngine {
  private audioEl: HTMLAudioElement | null = null;
  private currentItem: DecryptedVaultItem | null = null;
  private playlist: DecryptedVaultItem[] = [];
  private currentIndex: number = -1;
  private isShuffle: boolean = false;
  private playbackRate: number = 1;
  private ownedBlobUrl: string | null = null;
  private currentCoverUrl: string | null = null;
  private callbacks: Set<AudioEngineCallbacks> = new Set();

  public getAudioElement(): HTMLAudioElement {
    if (!this.audioEl) {
      const existing = document.getElementById('vault-persistent-audio') as HTMLAudioElement | null;
      if (existing) {
        this.audioEl = existing;
      } else {
        const el = document.createElement('audio');
        el.id = 'vault-persistent-audio';
        el.preload = 'auto';
        el.style.display = 'none';
        document.body.appendChild(el);
        this.audioEl = el;
      }
      this.attachAudioListeners(this.audioEl);
    }
    return this.audioEl;
  }

  private attachAudioListeners(el: HTMLAudioElement) {
    el.onplay = () => {
      this.notifyPlayState(true);
      this.updateMediaSessionPlaybackState('playing');
    };
    el.onpause = () => {
      this.notifyPlayState(false);
      this.updateMediaSessionPlaybackState('paused');
    };
    el.ontimeupdate = () => {
      const cur = el.currentTime || 0;
      const dur = Number.isFinite(el.duration) ? el.duration : 0;
      this.notifyTimeUpdate(cur, dur);
      this.updateMediaSessionPosition(cur, dur);
    };
    el.onloadedmetadata = () => {
      const cur = el.currentTime || 0;
      const dur = Number.isFinite(el.duration) ? el.duration : 0;
      this.notifyTimeUpdate(cur, dur);
      this.updateMediaSessionPosition(cur, dur);
    };
    el.onratechange = () => {
      this.playbackRate = el.playbackRate;
      this.callbacks.forEach((cb) => cb.onRateChange?.(this.playbackRate));
    };
    el.onended = () => {
      this.handleTrackEnded();
    };
  }

  public subscribe(cb: AudioEngineCallbacks): () => void {
    this.callbacks.add(cb);
    return () => {
      this.callbacks.delete(cb);
    };
  }

  private notifyPlayState(playing: boolean) {
    this.callbacks.forEach((cb) => cb.onPlayStateChange?.(playing));
  }

  private notifyTimeUpdate(currentTime: number, duration: number) {
    this.callbacks.forEach((cb) => cb.onTimeUpdate?.(currentTime, duration));
  }

  private notifyTrackChange(item: DecryptedVaultItem, index: number) {
    this.callbacks.forEach((cb) => cb.onTrackChange?.(item, index));
  }

  private notifyCoverChange(coverUrl: string | null) {
    this.callbacks.forEach((cb) => cb.onCoverChange?.(coverUrl));
  }

  public getState() {
    const el = this.getAudioElement();
    return {
      currentItem: this.currentItem,
      playlist: this.playlist,
      currentIndex: this.currentIndex,
      isPlaying: !el.paused && !el.ended && el.readyState > 0,
      currentTime: el.currentTime || 0,
      duration: Number.isFinite(el.duration) ? el.duration : 0,
      isShuffle: this.isShuffle,
      playbackRate: this.playbackRate,
      coverUrl: this.currentCoverUrl,
    };
  }

  public setPlaylist(items: DecryptedVaultItem[], activeId?: string) {
    const audioOnly = items.filter(
      (it) => it.record.category === 'audio' || it.record.mimeType?.startsWith('audio/')
    );
    this.playlist = audioOnly;
    if (activeId) {
      this.currentIndex = audioOnly.findIndex((it) => it.id === activeId);
    } else if (this.currentItem) {
      this.currentIndex = audioOnly.findIndex((it) => it.id === this.currentItem?.id);
    }
  }

  public async loadAndPlay(item: DecryptedVaultItem, playlist?: DecryptedVaultItem[], autoPlay = true) {
    const el = this.getAudioElement();
    if (playlist) {
      this.setPlaylist(playlist, item.id);
    } else if (this.playlist.length > 0) {
      this.currentIndex = this.playlist.findIndex((it) => it.id === item.id);
    }

    // If the exact same track is already loaded in the persistent audio element, keep playing seamlessly
    if (this.currentItem?.id === item.id && el.src && this.ownedBlobUrl) {
      this.currentItem = item;
      this.setupMediaSession();
      if (autoPlay && el.paused) {
        try {
          await el.play();
        } catch {}
      }
      return;
    }

    // Revoke previous owned blob URL & cover URL before loading the new track
    this.revokeOwnedUrls();

    this.currentItem = item;

    try {
      const response = await fetch(item.blobUrl);
      const blob = await response.blob();
      const dedicatedUrl = URL.createObjectURL(blob);
      this.ownedBlobUrl = dedicatedUrl;

      // Extract embedded ID3v2 cover art if available
      const coverUrl = await extractId3CoverUrl(blob);
      this.currentCoverUrl = coverUrl;
      this.notifyCoverChange(coverUrl);

      el.src = dedicatedUrl;
      el.playbackRate = this.playbackRate;
      el.load();

      this.setupMediaSession();

      if (autoPlay) {
        try {
          await el.play();
        } catch {
          this.notifyPlayState(false);
        }
      }
    } catch {
      // Fallback to item.blobUrl directly if fetch fails
      el.src = item.blobUrl;
      el.playbackRate = this.playbackRate;
      this.currentCoverUrl = null;
      this.notifyCoverChange(null);
      this.setupMediaSession();
      if (autoPlay) {
        try {
          await el.play();
        } catch {
          this.notifyPlayState(false);
        }
      }
    }
  }

  public togglePlayPause() {
    const el = this.getAudioElement();
    if (!el.src && this.currentItem) {
      this.loadAndPlay(this.currentItem, undefined, true);
      return;
    }
    if (el.paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }

  public seekTo(seconds: number) {
    const el = this.getAudioElement();
    const dur = Number.isFinite(el.duration) ? el.duration : 0;
    const clamped = dur > 0 ? Math.max(0, Math.min(dur, seconds)) : Math.max(0, seconds);
    el.currentTime = clamped;
    this.notifyTimeUpdate(clamped, dur);
    this.updateMediaSessionPosition(clamped, dur);
  }

  public seekRelative(deltaSeconds: number) {
    const el = this.getAudioElement();
    this.seekTo((el.currentTime || 0) + deltaSeconds);
  }

  public toggleShuffle(): boolean {
    this.isShuffle = !this.isShuffle;
    return this.isShuffle;
  }

  public cyclePlaybackRate(): number {
    const rates = [0.75, 1, 1.25, 1.5, 2];
    const idx = rates.findIndex((r) => Math.abs(r - this.playbackRate) < 0.01);
    const nextRate = rates[(idx + 1) % rates.length];
    this.playbackRate = nextRate;
    const el = this.getAudioElement();
    el.playbackRate = nextRate;
    this.callbacks.forEach((cb) => cb.onRateChange?.(nextRate));
    return nextRate;
  }

  public playPrevious() {
    const el = this.getAudioElement();
    if (this.playlist.length <= 1) {
      this.seekTo(0);
      if (el.paused) {
        el.play().catch(() => {});
      }
      return;
    }

    if (el.currentTime > 4) {
      this.seekTo(0);
      return;
    }

    const prevIdx = this.currentIndex > 0 ? this.currentIndex - 1 : 0;
    const prevItem = this.playlist[prevIdx];
    if (prevItem) {
      this.currentIndex = prevIdx;
      this.notifyTrackChange(prevItem, prevIdx);
      this.loadAndPlay(prevItem, undefined, true);
    }
  }

  public playNext() {
    if (this.playlist.length <= 1) return;

    let nextIdx = this.currentIndex + 1;
    if (this.isShuffle) {
      const candidates = this.playlist
        .map((_, idx) => idx)
        .filter((idx) => idx !== this.currentIndex);
      if (candidates.length > 0) {
        nextIdx = candidates[Math.floor(Math.random() * candidates.length)];
      }
    }

    if (nextIdx >= 0 && nextIdx < this.playlist.length) {
      const nextItem = this.playlist[nextIdx];
      this.currentIndex = nextIdx;
      this.notifyTrackChange(nextItem, nextIdx);
      this.loadAndPlay(nextItem, undefined, true);
    }
  }

  private handleTrackEnded() {
    if (this.playlist.length > 1) {
      if (this.isShuffle) {
        this.playNext();
        return;
      }
      if (this.currentIndex >= 0 && this.currentIndex < this.playlist.length - 1) {
        this.playNext();
        return;
      }
    }
    this.notifyPlayState(false);
    this.updateMediaSessionPlaybackState('paused');
  }

  public revokeIfStoppedOnClose() {
    const el = this.getAudioElement();
    if (el.paused || el.ended) {
      this.stopAndRevoke();
    }
  }

  public stopAndRevoke() {
    if (this.audioEl) {
      try {
        this.audioEl.pause();
        this.audioEl.removeAttribute('src');
        this.audioEl.load();
      } catch {}
    }
    this.revokeOwnedUrls();
    this.currentItem = null;
    this.updateMediaSessionPlaybackState('none');
  }

  private revokeOwnedUrls() {
    if (this.ownedBlobUrl) {
      try {
        URL.revokeObjectURL(this.ownedBlobUrl);
      } catch {}
      this.ownedBlobUrl = null;
    }
    if (this.currentCoverUrl) {
      try {
        URL.revokeObjectURL(this.currentCoverUrl);
      } catch {}
      this.currentCoverUrl = null;
    }
  }

  private setupMediaSession() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !this.currentItem) {
      return;
    }

    const rawName = this.currentItem.record.name || 'Audio';
    const titleWithoutExt = stripAudioExtension(rawName);
    const artistOrFolder = extractSubtitleFragment(rawName, this.currentItem.record.album);

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: titleWithoutExt,
        artist: artistOrFolder,
        album: 'Bóveda Privada',
        artwork: this.currentCoverUrl
          ? [{ src: this.currentCoverUrl, sizes: '512x512', type: 'image/jpeg' }]
          : [],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        this.getAudioElement().play().catch(() => {});
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        this.getAudioElement().pause();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        this.playPrevious();
      });
      navigator.mediaSession.setActionHandler(
        'nexttrack',
        this.playlist.length > 1 ? () => this.playNext() : null
      );
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        this.seekRelative(-(details.seekOffset || 10));
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        this.seekRelative(details.seekOffset || 10);
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (typeof details.seekTime === 'number') {
          this.seekTo(details.seekTime);
        }
      });
    } catch {}
  }

  private updateMediaSessionPlaybackState(state: 'none' | 'paused' | 'playing') {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = state;
      } catch {}
    }
  }

  private updateMediaSessionPosition(position: number, duration: number) {
    if (
      typeof navigator !== 'undefined' &&
      'mediaSession' in navigator &&
      'setPositionState' in navigator.mediaSession &&
      duration > 0 &&
      Number.isFinite(duration) &&
      Number.isFinite(position)
    ) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, duration),
          playbackRate: this.playbackRate || 1,
          position: Math.max(0, Math.min(position, duration)),
        });
      } catch {}
    }
  }
}

export const vaultAudioEngine = new VaultAudioEngine();

export function stripAudioExtension(filename: string): string {
  if (!filename) return 'Audio';
  const lastDot = filename.lastIndexOf('.');
  if (lastDot <= 0) return filename;
  return filename.slice(0, lastDot);
}

export function extractSubtitleFragment(filename: string, album?: string): string {
  if (album && album.trim() && album !== 'General') {
    return album.trim();
  }
  const withoutExt = stripAudioExtension(filename);
  const dashParts = withoutExt.split(/\s+[-–—]\s+/);
  if (dashParts.length > 1 && dashParts[0].trim().length > 0) {
    return dashParts[0].trim();
  }
  return album && album.trim() ? album.trim() : 'Audios';
}

/**
 * Extracts embedded ID3v2 APIC/PIC cover art from an audio Blob if present.
 */
async function extractId3CoverUrl(blob: Blob): Promise<string | null> {
  try {
    const sliceSize = Math.min(blob.size, 1024 * 1024 * 2); // Inspect up to 2MB for ID3 tags
    const buffer = await blob.slice(0, sliceSize).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (bytes.length < 10) return null;
    // Check "ID3" magic header
    if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) {
      return null;
    }

    const version = bytes[3]; // 2, 3, or 4
    const tagSize =
      ((bytes[6] & 0x7f) << 21) |
      ((bytes[7] & 0x7f) << 14) |
      ((bytes[8] & 0x7f) << 7) |
      (bytes[9] & 0x7f);

    const limit = Math.min(bytes.length, 10 + tagSize);
    let offset = 10;

    // Skip extended header if flag bit 6 is set in v2.3/v2.4
    if ((bytes[5] & 0x40) !== 0 && offset + 4 < limit) {
      const extSize =
        version === 4
          ? ((bytes[offset] & 0x7f) << 21) |
            ((bytes[offset + 1] & 0x7f) << 14) |
            ((bytes[offset + 2] & 0x7f) << 7) |
            (bytes[offset + 3] & 0x7f)
          : (bytes[offset] << 24) |
            (bytes[offset + 1] << 16) |
            (bytes[offset + 2] << 8) |
            bytes[offset + 3];
      offset += extSize;
    }

    while (offset + 10 <= limit) {
      if (bytes[offset] === 0) break;

      if (version === 2) {
        if (offset + 6 > limit) break;
        const frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2]);
        const frameSize =
          (bytes[offset + 3] << 16) | (bytes[offset + 4] << 8) | bytes[offset + 5];
        if (frameSize <= 0 || offset + 6 + frameSize > limit) break;

        if (frameId === 'PIC') {
          const frameData = bytes.subarray(offset + 6, offset + 6 + frameSize);
          const imgBlob = extractImageBlobFromFrame(frameData);
          if (imgBlob) return URL.createObjectURL(imgBlob);
        }
        offset += 6 + frameSize;
      } else {
        const frameId = String.fromCharCode(
          bytes[offset],
          bytes[offset + 1],
          bytes[offset + 2],
          bytes[offset + 3]
        );
        const frameSize =
          version === 4
            ? ((bytes[offset + 4] & 0x7f) << 21) |
              ((bytes[offset + 5] & 0x7f) << 14) |
              ((bytes[offset + 6] & 0x7f) << 7) |
              (bytes[offset + 7] & 0x7f)
            : (bytes[offset + 4] << 24) |
              (bytes[offset + 5] << 16) |
              (bytes[offset + 6] << 8) |
              bytes[offset + 7];

        if (frameSize <= 0 || offset + 10 + frameSize > limit) break;

        if (frameId === 'APIC') {
          const frameData = bytes.subarray(offset + 10, offset + 10 + frameSize);
          const imgBlob = extractImageBlobFromFrame(frameData);
          if (imgBlob) return URL.createObjectURL(imgBlob);
        }
        offset += 10 + frameSize;
      }
    }
  } catch {}
  return null;
}

function extractImageBlobFromFrame(frameData: Uint8Array): Blob | null {
  // Scan for JPEG (FF D8 FF) or PNG (89 50 4E 47) magic bytes inside the APIC/PIC payload
  for (let i = 1; i < Math.min(frameData.length - 4, 256); i++) {
    if (frameData[i] === 0xff && frameData[i + 1] === 0xd8 && frameData[i + 2] === 0xff) {
      return new Blob([new Uint8Array(frameData.subarray(i))], { type: 'image/jpeg' });
    }
    if (
      frameData[i] === 0x89 &&
      frameData[i + 1] === 0x50 &&
      frameData[i + 2] === 0x4e &&
      frameData[i + 3] === 0x47
    ) {
      return new Blob([new Uint8Array(frameData.subarray(i))], { type: 'image/png' });
    }
  }
  return null;
}
