import WebcamRecorder from './components/WebcamRecorder'
import { useTheme } from './hooks/useTheme'

function App() {
  const { mode, setMode } = useTheme()

  return (
    <div
      style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '40px 20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: 'var(--text)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Webcam Recorder</h1>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 14 }}>
          Theme
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'light' | 'dark' | 'system')}
            style={{
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '6px 8px',
            }}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </div>
      <p style={{ color: 'var(--muted)', marginBottom: 32, fontSize: 15 }}>
        Record your Mac webcam and microphone entirely in the browser — no backend, no cloud storage.
      </p>
      <WebcamRecorder />
    </div>
  )
}

export default App