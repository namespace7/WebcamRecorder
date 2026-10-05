import { useRef, useState, useCallback, useEffect } from 'react'
import {
  RECORDING_OPTIONS,
  VIDEO_CONSTRAINTS,
  ensureExtension,
  extensionFor,
  getPreferredMimeType,
} from '../lib/recorder'
import type { PermissionState } from '../components/PermissionModal'

export type RecorderStatus = 'idle' | 'preview' | 'countdown' | 'recording' | 'paused' | 'stopped'

export interface UseWebcamRecorderReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>
  status: RecorderStatus
  error: string | null
  durationMs: number
  countdown: number | null
  recordedBlob: Blob | null
  saved: boolean
  fileName: string
  setFileName: (name: string) => void
  showSaveDialog: boolean
  setShowSaveDialog: (show: boolean) => void
  startPreview: () => Promise<void>
  pause: () => void
  resume: () => void
  stop: () => void
  saveRecording: () => Promise<void>
  discardRecording: () => void
  permissionState: PermissionState
  permissionModalOpen: boolean
  requestPermissions: () => Promise<void>
  dismissPermissionModal: () => void
}

interface FileSystemWritableLike {
  write: (data: Blob) => Promise<void>
  close: () => Promise<void>
}

interface FileSystemFileHandleLike {
  createWritable: () => Promise<FileSystemWritableLike>
}

interface ShowSaveFilePickerLike {
  (options?: { suggestedName?: string; types?: Array<{ description?: string; accept?: Record<string, string[]> }> }): Promise<FileSystemFileHandleLike>
}

function getShowSaveFilePicker(): ShowSaveFilePickerLike | null {
  const maybe = (window as unknown as { showSaveFilePicker?: ShowSaveFilePickerLike }).showSaveFilePicker
  return typeof maybe === 'function' ? maybe : null
}

export function useWebcamRecorder(): UseWebcamRecorderReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const startedRef = useRef(false)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)

  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [durationMs, setDurationMs] = useState(0)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [saved, setSaved] = useState(false)
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown')
  const [permissionModalOpen, setPermissionModalOpen] = useState(false)
  const [fileName, setFileName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearDurationInterval = useCallback(() => {
    if (durationIntervalRef.current !== null) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }
  }, [])

  const clearCountdownInterval = useCallback(() => {
    if (countdownIntervalRef.current !== null) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }, [])

  const startDurationInterval = useCallback(() => {
    clearDurationInterval()
    startTimeRef.current = Date.now()
    setDurationMs(0)
    durationIntervalRef.current = setInterval(() => {
      setDurationMs(Date.now() - startTimeRef.current)
    }, 100)
  }, [clearDurationInterval])

  const releaseTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const startRecordingNow = useCallback(() => {
    if (!streamRef.current || startedRef.current) return
    startedRef.current = true

    const mimeType = getPreferredMimeType()
    const recorder = new MediaRecorder(streamRef.current, { ...RECORDING_OPTIONS, mimeType })
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      clearDurationInterval()
      clearCountdownInterval()
      releaseTracks()
      setCountdown(null)

      const blob = new Blob(chunksRef.current, { type: mimeType })
      const ext = extensionFor(mimeType)
      setRecordedBlob(blob)
      setSaved(false)
      setFileName((prev) => prev || `recording-${Date.now()}.${ext}`)
      setShowSaveDialog(true)
      setStatus('stopped')
    }

    recorder.onerror = () => {
      clearDurationInterval()
      clearCountdownInterval()
      releaseTracks()
      setCountdown(null)
      setError('MediaRecorder encountered an error during recording.')
      setSaved(false)
      setStatus('stopped')
    }

    recorder.start(extensionFor(mimeType) === 'mp4' ? undefined : 1000)
    startDurationInterval()
    setStatus('recording')
  }, [clearCountdownInterval, clearDurationInterval, releaseTracks, startDurationInterval])

  const requestPermissions = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: VIDEO_CONSTRAINTS,
        audio: true,
      })
      stream.getTracks().forEach((t) => t.stop())
      setPermissionState('granted')
      setPermissionModalOpen(false)
    } catch (err: unknown) {
      const isDenied = err instanceof DOMException && err.name === 'NotAllowedError'
      setPermissionState(isDenied ? 'denied' : 'prompt')
      setPermissionModalOpen(true)
      setError(
        isDenied
          ? 'Camera / microphone permission denied. Allow access in your browser settings.'
          : 'Could not access camera or microphone. Check your device settings.',
      )
    }
  }, [])

  const dismissPermissionModal = useCallback(() => setPermissionModalOpen(false), [])

  useEffect(() => {
    let cancelled = false

    async function checkPermissions() {
      try {
        const permissions = navigator.permissions as {
          query?: (descriptor: { name: 'camera' | 'microphone' }) => Promise<{ state: PermissionState }>
        }
        if (!permissions.query) {
          if (!cancelled) {
            setPermissionState('unknown')
            setPermissionModalOpen(true)
          }
          return
        }

        const [camera, microphone] = await Promise.all([
          permissions.query({ name: 'camera' }),
          permissions.query({ name: 'microphone' }),
        ])
        if (cancelled) return

        if (camera.state === 'granted' && microphone.state === 'granted') {
          setPermissionState('granted')
          setPermissionModalOpen(false)
        } else if (camera.state === 'denied' || microphone.state === 'denied') {
          setPermissionState('denied')
          setPermissionModalOpen(true)
        } else {
          setPermissionState('prompt')
          setPermissionModalOpen(true)
        }
      } catch {
        if (!cancelled) {
          setPermissionState('unknown')
          setPermissionModalOpen(true)
        }
      }
    }

    checkPermissions()
    return () => {
      cancelled = true
    }
  }, [])

  const startPreview = useCallback(async () => {
    setError(null)
    setRecordedBlob(null)
    setSaved(false)
    setShowSaveDialog(false)
    setFileName('')
    setDurationMs(0)
    setCountdown(null)
    chunksRef.current = []
    startedRef.current = false
    clearCountdownInterval()
    clearDurationInterval()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: VIDEO_CONSTRAINTS,
        audio: true,
      })
      streamRef.current = stream
      setPermissionState('granted')
      setPermissionModalOpen(false)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setStatus('preview')
      setCountdown(3)
      setStatus('countdown')

      let remaining = 3
      countdownIntervalRef.current = setInterval(() => {
        remaining -= 1
        if (remaining <= 0) {
          clearCountdownInterval()
          setCountdown(null)
          startRecordingNow()
          return
        }
        setCountdown(remaining)
      }, 1000)
    } catch (err: unknown) {
      const msg =
        err instanceof DOMException
          ? err.name === 'NotAllowedError'
            ? 'Camera / microphone permission denied. Please allow access in your browser settings.'
            : `Hardware error: ${err.message}`
          : 'Could not access camera or microphone.'
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setPermissionState('denied')
        setPermissionModalOpen(true)
      }
      setError(msg)
      releaseTracks()
      setStatus('idle')
    }
  }, [clearCountdownInterval, clearDurationInterval, releaseTracks, startRecordingNow])

  const pause = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      clearDurationInterval()
      setStatus('paused')
    }
  }, [clearDurationInterval])

  const resume = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      startDurationInterval()
      setStatus('recording')
    }
  }, [startDurationInterval])

  const stop = useCallback(() => {
    clearCountdownInterval()
    setCountdown(null)

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      return
    }

    clearDurationInterval()
    releaseTracks()
    setStatus('stopped')
  }, [clearCountdownInterval, clearDurationInterval, releaseTracks])

  const discardRecording = useCallback(() => {
    clearDurationInterval()
    clearCountdownInterval()

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null
      mediaRecorderRef.current.onerror = null
      mediaRecorderRef.current.stop()
    }
    mediaRecorderRef.current = null
    releaseTracks()

    chunksRef.current = []
    startedRef.current = false
    setRecordedBlob(null)
    setSaved(false)
    setFileName('')
    setShowSaveDialog(false)
    setDurationMs(0)
    setCountdown(null)
    setError(null)
    setStatus('idle')
  }, [clearCountdownInterval, clearDurationInterval, releaseTracks])

  const saveRecording = useCallback(async () => {
    if (!recordedBlob) return

    const ext = extensionFor(recordedBlob.type)
    const finalName = ensureExtension(fileName, ext)
    const picker = getShowSaveFilePicker()

    if (picker) {
      try {
        const handle = await picker({
          suggestedName: finalName,
          types: [
            {
              description: ext === 'mp4' ? 'MP4 video' : 'WebM video',
              accept: ext === 'mp4' ? { 'video/mp4': ['.mp4'] } : { 'video/webm': ['.webm'] },
            },
          ],
        })
        const writable = await handle.createWritable()
        await writable.write(recordedBlob)
        await writable.close()
        setError(null)
        setSaved(true)
        setShowSaveDialog(false)
        return
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError('Could not save with the custom file picker. Use the download fallback.')
        return
      }
    }

    const url = URL.createObjectURL(recordedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = finalName
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setError(null)
    setSaved(true)
    setShowSaveDialog(false)
  }, [fileName, recordedBlob])

  useEffect(() => {
    return () => {
      clearDurationInterval()
      clearCountdownInterval()
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      releaseTracks()
    }
  }, [clearCountdownInterval, clearDurationInterval, releaseTracks])

  return {
    videoRef,
    status,
    error,
    durationMs,
    countdown,
    recordedBlob,
    saved,
    fileName,
    setFileName,
    showSaveDialog,
    setShowSaveDialog,
    startPreview,
    pause,
    resume,
    stop,
    saveRecording,
    discardRecording,
    permissionState,
    permissionModalOpen,
    requestPermissions,
    dismissPermissionModal,
  }
}