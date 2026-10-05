export const RECORDING_OPTIONS: MediaRecorderOptions = {}

export const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30 },
}

export function getPreferredMimeType(isSupported: (type: string) => boolean = (type) => MediaRecorder.isTypeSupported(type)): string {
  const types = [
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
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