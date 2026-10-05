import { type FC } from 'react'
import { useWebcamRecorder, type RecorderStatus } from '../hooks/useWebcamRecorder'
import { RecordingErrorBoundary } from './RecordingErrorBoundary'
import { PermissionModal } from './PermissionModal'
import { formatDuration } from '../lib/recorder'

function statusLabel(s: RecorderStatus): string {
  switch (s) {
    case 'idle':
      return 'Ready'
    case 'preview':
      return 'Preparing'
    case 'countdown':
      return 'Get ready'
    case 'recording':
      return '● Recording'
    case 'paused':
      return '⏸ Paused'
    case 'stopped':
      return 'Stopped'
  }
}

const btn: React.CSSProperties = {
  padding: '8px 20px',
  border: 'none',
  borderRadius: 6,
  fontSize: 14,
  cursor: 'pointer',
  fontWeight: 600,
  transition: 'opacity 0.15s',
}

const WebcamRecorderInner: FC = () => {
  const {
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
  } = useWebcamRecorder()

  const canStart = status === 'idle' || (status === 'stopped' && (saved || !recordedBlob))

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', fontFamily: 'system-ui, sans-serif', color: 'var(--text)' }}>
      <div
        style={{
          position: 'relative',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#000',
          aspectRatio: '16 / 9',
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: status === 'paused' ? 0.3 : 1,
            transition: 'opacity 0.25s',
          }}
        />

        {status === 'countdown' && countdown !== null && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.45)',
              color: '#fff',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1 }} data-testid="countdown">
              {countdown}
            </div>
            <div style={{ marginTop: 8, fontSize: 16, fontWeight: 600 }}>Get ready…</div>
          </div>
        )}

        {status === 'paused' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.45)',
              color: '#fff',
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: 1,
              pointerEvents: 'none',
            }}
          >
            PAUSED
          </div>
        )}

        <span
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
            background:
              status === 'recording'
                ? 'rgba(220,38,38,0.85)'
                : status === 'paused'
                  ? 'rgba(234,179,8,0.85)'
                  : 'rgba(0,0,0,0.55)',
            color: '#fff',
          }}
        >
          {statusLabel(status)}
          {status === 'recording' && `  ${formatDuration(durationMs)}`}
        </span>

        {status === 'stopped' && recordedBlob && (
          <span
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              background: 'rgba(0,0,0,0.55)',
              color: '#fff',
            }}
          >
            {formatDuration(durationMs)}
          </span>
        )}
      </div>

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 14px',
            borderRadius: 8,
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {canStart && (
          <button onClick={startPreview} style={{ ...btn, background: '#2563eb', color: '#fff' }}>
            Start Recording
          </button>
        )}
        {status === 'stopped' && recordedBlob && !saved && (
          <button
            disabled
            title="Save or cancel the current recording before starting a new one"
            style={{ ...btn, background: '#93c5fd', color: '#fff', cursor: 'not-allowed', opacity: 0.6 }}
          >
            Start Recording
          </button>
        )}
        {(status === 'preview' || status === 'countdown') && (
          <button onClick={stop} style={{ ...btn, background: '#6b7280', color: '#fff' }}>
            Cancel
          </button>
        )}
        {status === 'recording' && (
          <>
            <button onClick={pause} style={{ ...btn, background: '#ca8a04', color: '#fff' }}>
              Pause
            </button>
            <button onClick={stop} style={{ ...btn, background: '#dc2626', color: '#fff' }}>
              Stop
            </button>
          </>
        )}
        {status === 'paused' && (
          <>
            <button onClick={resume} style={{ ...btn, background: '#16a34a', color: '#fff' }}>
              Resume
            </button>
            <button onClick={stop} style={{ ...btn, background: '#dc2626', color: '#fff' }}>
              Stop
            </button>
          </>
        )}
      </div>

      {!permissionModalOpen && permissionState !== 'granted' && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: 14,
          }}
        >
          <span>Camera/microphone access is needed before recording can work.</span>
          <button
            onClick={() => {
              // Re-open the modal so the same guidance and actions are shown.
              // eslint-disable-next-line @typescript-eslint/no-use-before-define
              requestPermissions()
            }}
            style={{ ...btn, padding: '6px 12px', background: 'var(--primary)', color: '#fff' }}
          >
            Enable access
          </button>
        </div>
      )}

      {recordedBlob && !showSaveDialog && !saved && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => setShowSaveDialog(true)}
            style={{ ...btn, background: '#059669', color: '#fff' }}
          >
            Save Recording
          </button>
        </div>
      )}

      {status === 'stopped' && recordedBlob && saved && (
        <p style={{ marginTop: 16, color: '#059669', fontWeight: 600 }}>
          Saved. You can start a new recording.
        </p>
      )}

      {showSaveDialog && recordedBlob && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 10,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            boxShadow: '0 10px 20px rgba(0,0,0,0.06)',
          }}
        >
          <label htmlFor="file-name" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
            File name
          </label>
          <input
            id="file-name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: 14,
            }}
          />
          <p style={{ marginTop: 8, color: '#6b7280', fontSize: 13 }}>
            Use Save to choose a custom folder/path in Chrome or Edge. If unavailable, the file
            downloads with this name. Cancel discards the current recording.
          </p>
          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <button onClick={saveRecording} style={{ ...btn, background: '#059669', color: '#fff' }}>
              Save
            </button>
            <button
              onClick={discardRecording}
              style={{ ...btn, background: 'var(--border)', color: 'var(--text)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <PermissionModal
        open={permissionModalOpen}
        permissionState={permissionState}
        onEnable={requestPermissions}
        onDismiss={dismissPermissionModal}
      />
    </div>
  )
}

const WebcamRecorder: FC = () => (
  <RecordingErrorBoundary>
    <WebcamRecorderInner />
  </RecordingErrorBoundary>
)

export default WebcamRecorder