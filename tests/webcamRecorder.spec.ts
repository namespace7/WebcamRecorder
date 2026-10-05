import { test, expect } from '@playwright/test'

test.describe('WebcamRecorder', () => {
  test('initial state shows Start Recording button', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Start Recording' })).toBeVisible()
  })

  test('countdown appears then recording starts', async ({ page }) => {
    await page.addInitScript(() => {
      const OriginalMediaRecorder = window.MediaRecorder
      ;(window as any).__mediaRecorderCount = 0
      ;(window as any).MediaRecorder = class extends OriginalMediaRecorder {
        constructor(stream: MediaStream, options?: MediaRecorderOptions) {
          ;(window as any).__mediaRecorderCount += 1
          super(stream, options)
        }
      }
    })

    await page.goto('/')
    await page.getByRole('button', { name: 'Start Recording' }).click()

    await expect(page.getByTestId('countdown')).toBeVisible()
    await expect(page.getByTestId('countdown')).toHaveText(/[321]/)

    await expect(page.getByText('● Recording')).toBeVisible({ timeout: 8000 })
    await expect(page.getByTestId('countdown')).toHaveCount(0)
    expect(await page.evaluate(() => (window as any).__mediaRecorderCount)).toBe(1)
  })

  test('start → pause → resume → stop flow', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Recording' }).click()

    await expect(page.getByText('● Recording')).toBeVisible({ timeout: 8000 })
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()

    await page.getByRole('button', { name: 'Pause' }).click()
    await expect(page.getByText('PAUSED', { exact: true })).toBeVisible()
    await expect(page.getByText('⏸ Paused')).toBeVisible()

    await page.getByRole('button', { name: 'Resume' }).click()
    await expect(page.getByText('● Recording')).toBeVisible()

    await page.getByRole('button', { name: 'Stop' }).click()
    await expect(page.getByText('Stopped')).toBeVisible()
    await expect(page.getByLabel('File name')).toBeVisible()
  })

  test('cancel after stop discards recording and enables restart', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Recording' }).click()
    await expect(page.getByText('● Recording')).toBeVisible({ timeout: 8000 })
    await page.waitForTimeout(1500)
    await page.getByRole('button', { name: 'Stop' }).click()

    await expect(page.getByLabel('File name')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Recording' })).toBeDisabled()

    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByLabel('File name')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Start Recording' })).toBeEnabled()
  })

  test('save dialog uses showSaveFilePicker when available', async ({ page }) => {
    await page.addInitScript(() => {
      ;(window as any).__saveCalls = []
      ;(window as any).showSaveFilePicker = async (options: any) => {
        ;(window as any).__saveCalls.push(options)
        return {
          createWritable: async () => ({
            write: async () => {},
            close: async () => {},
          }),
        }
      }
    })

    await page.goto('/')
    await page.getByRole('button', { name: 'Start Recording' }).click()
    await expect(page.getByText('● Recording')).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: 'Stop' }).click()

    await page.getByLabel('File name').fill('my-demo')
    await page.getByRole('button', { name: 'Save' }).click()

    const calls = await page.evaluate(() => (window as any).__saveCalls)
    expect(calls[0].suggestedName).toBe('my-demo.webm')
    await expect(page.getByLabel('File name')).toHaveCount(0)
  })

  test('permission modal can be dismissed and then enabled', async ({ page }) => {
    await page.addInitScript(() => {
      const queryPrompt = async () => ({ state: 'prompt' as PermissionState })
      Object.defineProperty(navigator, 'permissions', {
        value: { query: queryPrompt },
        configurable: true,
      })
    })

    await page.goto('/')
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.getByRole('button', { name: 'Dismiss' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByText(/Camera\/microphone access is needed/i)).toBeVisible()

    await page.getByRole('button', { name: 'Enable access' }).click()
    await expect(page.getByText(/Camera\/microphone access is needed/i)).toHaveCount(0)
  })

  test('theme can be overridden and persisted', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Theme').selectOption('dark')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(await page.evaluate(() => window.localStorage.getItem('webcamrecorder-theme'))).toBe('dark')
  })

  test('quality presets reach getUserMedia and MediaRecorder', async ({ page }) => {
    await page.addInitScript(() => {
      ;(window as any).__gumCalls = []
      ;(window as any).__recorderOptions = []

      const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        ;(window as any).__gumCalls.push(constraints)
        return originalGetUserMedia(constraints)
      }

      const OriginalMediaRecorder = window.MediaRecorder
      ;(window as any).MediaRecorder = class extends OriginalMediaRecorder {
        constructor(stream: MediaStream, options?: MediaRecorderOptions) {
          ;(window as any).__recorderOptions.push(options)
          super(stream, options)
        }
      }
    })

    await page.goto('/')
    await expect(page.getByRole('option', { name: 'Ultra' })).toBeAttached()
    await page.getByLabel('Resolution').selectOption('1080p')
    await page.getByLabel('Bitrate').selectOption('high')
    await page.getByRole('button', { name: 'Start Recording' }).click()
    await expect(page.getByText('● Recording')).toBeVisible({ timeout: 8000 })

    const gumCalls = await page.evaluate(() => (window as any).__gumCalls)
    const recorderOptions = await page.evaluate(() => (window as any).__recorderOptions)
    expect(gumCalls[0].video).toMatchObject({ width: { ideal: 1920 }, height: { ideal: 1080 } })
    expect(recorderOptions[0]).toMatchObject({ audioBitsPerSecond: 128000, videoBitsPerSecond: 10000000 })
  })

  test('fallback download uses custom filename', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      delete (window as any).showSaveFilePicker
    })

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await expect(page.getByText('● Recording')).toBeVisible({ timeout: 8000 })
    await page.waitForTimeout(1500)
    await page.getByRole('button', { name: 'Stop' }).click()

    await page.getByLabel('File name').fill('custom-name')
    await expect(page.getByText(/Firefox\/Safari usually save/i)).toBeVisible()
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Save' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('custom-name.webm')
  })
})