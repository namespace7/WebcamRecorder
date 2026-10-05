import { describe, expect, it } from 'vitest'
import { ensureExtension, extensionFor, formatDuration, getPreferredMimeType } from './recorder'

describe('getPreferredMimeType', () => {
  it('prefers webm vp8 opus when supported', () => {
    const support = (type: string) => type === 'video/webm;codecs=vp8,opus'
    expect(getPreferredMimeType(support)).toBe('video/webm;codecs=vp8,opus')
  })

  it('falls back to mp4 when webm codecs are unsupported', () => {
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

describe('formatDuration', () => {
  it('formats milliseconds as mm:ss', () => {
    expect(formatDuration(0)).toBe('00:00')
    expect(formatDuration(65_000)).toBe('01:05')
    expect(formatDuration(600_000)).toBe('10:00')
  })
})