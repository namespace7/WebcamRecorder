export type ResolutionPreset = '720p' | '1080p'
export type BitratePreset = 'low' | 'medium' | 'high' | 'ultra'

export const DEFAULT_RESOLUTION: ResolutionPreset = '720p'
export const DEFAULT_BITRATE: BitratePreset = 'medium'

export function videoConstraintsFor(resolution: ResolutionPreset): MediaTrackConstraints {
  return resolution === '1080p'
    ? { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } }
    : { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
}

export function recorderOptionsFor(
  resolution: ResolutionPreset,
  bitrate: BitratePreset,
): MediaRecorderOptions {
  const isHd = resolution === '1080p'
  switch (bitrate) {
    case 'low':
      return { audioBitsPerSecond: 64000, videoBitsPerSecond: isHd ? 2000000 : 1000000 }
    case 'medium':
      return { audioBitsPerSecond: 96000, videoBitsPerSecond: isHd ? 6000000 : 3000000 }
    case 'high':
      return { audioBitsPerSecond: 128000, videoBitsPerSecond: isHd ? 10000000 : 6000000 }
    case 'ultra':
      return { audioBitsPerSecond: 128000, videoBitsPerSecond: isHd ? 16000000 : 10000000 }
  }
}

export function getPreferredMimeType(isSupported: (type: string) => boolean = (type) => MediaRecorder.isTypeSupported(type)): string {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/mp4',
    'video/webm',
  ]
  for (const t of types) {
    if (isSupported(t)) return t
  }
  return 'video/webm'
}

export function extensionFor(mimeType: string): 'webm' | 'mp4' {
  return mimeType.includes('mp4') ? 'mp4' : 'webm'
}

export function ensureExtension(name: string, ext: 'webm' | 'mp4'): string {
  const trimmed = name.trim()
  if (!trimmed) return `recording.${ext}`
  return trimmed.toLowerCase().endsWith(`.${ext}`) ? trimmed : `${trimmed}.${ext}`
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function isSaveFilePickerSupported(): boolean {
  return typeof (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker === 'function'
}