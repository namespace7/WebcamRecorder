import { useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = window.localStorage.getItem('webcamrecorder-theme')
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system'
  })

  const [systemDark, setSystemDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const effectiveTheme = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode

  useEffect(() => {
    window.localStorage.setItem('webcamrecorder-theme', mode)
    document.documentElement.dataset.theme = effectiveTheme
  }, [mode, effectiveTheme])

  return { mode, effectiveTheme, setMode }
}