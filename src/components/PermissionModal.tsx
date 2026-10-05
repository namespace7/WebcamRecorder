import type { CSSProperties, FC } from 'react'

export type PermissionState = 'unknown' | 'prompt' | 'granted' | 'denied'

interface PermissionModalProps {
  open: boolean
  permissionState: PermissionState
  onEnable: () => void
  onDismiss: () => void
}

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.55)',
  padding: 20,
}

const card: CSSProperties = {
  maxWidth: 520,
  width: '100%',
  background: 'var(--surface)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 24,
  boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
}

const btn: CSSProperties = {
  padding: '9px 18px',
  border: 'none',
  borderRadius: 6,
  fontWeight: 700,
  cursor: 'pointer',
}

export const PermissionModal: FC<PermissionModalProps> = ({ open, permissionState, onEnable, onDismiss }) => {
  if (!open) return null

  const denied = permissionState === 'denied'

  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-labelledby="permission-title">
      <div style={card}>
        <h2 id="permission-title" style={{ margin: '0 0 10px', fontSize: 22 }}>
          {denied ? 'Camera & microphone blocked' : 'Camera & microphone access needed'}
        </h2>
        <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.5 }}>
          {denied
            ? 'Your browser is currently blocking camera/microphone access for this site. Allow access in the browser address bar or site settings, then reload.'
            : 'This app records your webcam and microphone locally in your browser. Please allow camera and microphone access so it can start.'}
        </p>
        {!denied && (
          <button onClick={onEnable} style={{ ...btn, marginTop: 18, background: 'var(--primary)', color: '#fff' }}>
            Allow access
          </button>
        )}
        <button
          onClick={onDismiss}
          style={{ ...btn, marginTop: 10, marginLeft: denied ? 0 : 10, background: 'var(--border)', color: 'var(--text)' }}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}