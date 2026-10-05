import { describe, expect, it } from 'vitest'
import {
  ensureExtension,
  extensionFor,
  formatDuration,
  getPreferredMimeType,
  recorderOptionsFor,
  videoConstraintsFor,
} from './recorder'

describe('getPreferredMimeType', () => {
  it('prefers webm vp9 opus when supported', () => {
    const support = (type: string) => type === 'video/webm;codecs=vp9,opus'
    expect(getPreferredMimeType(support)).toBe('video/webm;codecs=vp9,opus')
  })

  it('falls back to mp4 when vp9 webm is unsupported', () => {
    const support = (type: string) => type === 'video/mp4'
    expect(getPreferredMimeType(support)).toBe('video/mp4')
  })

  it('defaults to webm when support map is empty/unknown', () => {
    expect(getPreferredMimeType(() => false)).toBe('video/webm')
  })
})

describe('extensionFor', () => {
  it('returns mp4 for mp4 mime types', () => {
    expect(extensionFor('video/mp4')).toBe('mp4')
  })

  it('returns webm for other mime types', () => {
    expect(extensionFor('video/webm;codecs=vp9,opus')).toBe('webm')
  })
})

describe('ensureExtension', () => {
  it('appends extension when missing', () => {
    expect(ensureExtension('demo', 'webm')).toBe('demo.webm')
  })

  it('keeps existing extension', () => {
    expect(ensureExtension('demo.webm', 'webm')).toBe('demo.webm')
  })

  it('is case-insensitive for existing extension', () => {
    expect(ensureExtension('demo.WEBM', 'webm')).toBe('demo.WEBM')
  })

  it('uses a default name when empty', () => {
    expect(ensureExtension('   ', 'mp4')).toBe('recording.mp4')
  })
})

describe('videoConstraintsFor', () => {
  it('returns 720p constraints by default preset value', () => {
    expect(videoConstraintsFor('720p')).toEqual({
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    })
  })

  it('returns 1080p constraints', () => {
    expect(videoConstraintsFor('1080p')).toEqual({
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 },
    })
  })
})

describe('recorderOptionsFor', () => {
  it('maps low bitrate for 720p and 1080p', () => {
    expect(recorderOptionsFor('720p', 'low')).toEqual({ audioBitsPerSecond: 64000, videoBitsPerSecond: 1000000 })
    expect(recorderOptionsFor('1080p', 'low')).toEqual({ audioBitsPerSecond: 64000, videoBitsPerSecond: 2000000 })
  })

  it('maps medium bitrate for 720p and 1080p', () => {
    expect(recorderOptionsFor('720p', 'medium')).toEqual({ audioBitsPerSecond: 96000, videoBitsPerSecond: 3000000 })
    expect(recorderOptionsFor('1080p', 'medium')).toEqual({ audioBitsPerSecond: 96000, videoBitsPerSecond: 6000000 })
  })

  it('maps high bitrate for 720p and 1080p', () => {
    expect(recorderOptionsFor('720p', 'high')).toEqual({ audioBitsPerSecond: 128000, videoBitsPerSecond: 6000000 })
    expect(recorderOptionsFor('1080p', 'high')).toEqual({ audioBitsPerSecond: 128000, videoBitsPerSecond: 10000000 })
  })

  it('maps ultra bitrate for 720p and 1080p', () => {
    expect(recorderOptionsFor('720p', 'ultra')).toEqual({ audioBitsPerSecond: 128000, videoBitsPerSecond: 10000000 })
    expect(recorderOptionsFor('1080p', 'ultra')).toEqual({ audioBitsPerSecond: 128000, videoBitsPerSecond: 16000000 })
  })
})

describe('formatDuration', () => {
  it('formats milliseconds as mm:ss', () => {
    expect(formatDuration(0)).toBe('00:00')
    expect(formatDuration(65_000)).toBe('01:05')
    expect(formatDuration(600_000)).toBe('10:00')
  })
})