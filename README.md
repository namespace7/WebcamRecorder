# WebcamRecorder

**WebcamRecorder** is a 100% free, privacy-first alternative to Loom. Built with React and the native MediaRecorder API to record webcam video locally with zero cloud or infrastructure costs.

## Problem it solves

Recording a webcam and microphone locally should not require:

- a paid screen-recording subscription
- uploading your camera/microphone media to third-party cloud storage
- a backend service
- a media processing pipeline

WebcamRecorder keeps the entire workflow in the browser. The camera/microphone stream is acquired with `navigator.mediaDevices.getUserMedia`, recorded with `MediaRecorder`, packaged as a `Blob`, and downloaded or saved locally.

## Features

- Webcam video constrained to approximately `1280x720` at 30 FPS
- Microphone recording via the browser MediaRecorder pipeline
- Countdown before recording starts, while the user previews the live camera
- Start, Pause, Resume, and Stop controls
- Dimmed video preview while paused
- MIME type fallback across browsers:
  - `video/webm;codecs=vp9,opus`
  - `video/mp4`
  - `video/webm`
- Clean hardware lifecycle cleanup: all media tracks are stopped when recording ends or the component unmounts
- Local file save using `URL.createObjectURL`
- Preferred save path in Chromium browsers: File System Access API (`showSaveFilePicker`)
- Fallback: regular `<a download>` browser download
- Save-before-restart rule: a new recording cannot start until the current take is saved or cancelled
- Error boundary for permission/runtime failures
- Permission guidance modal that explains camera/microphone access requirements
- Dark mode: follows system theme by default, with manual Light/Dark/System override stored in localStorage
- Browser-specific save behavior notes in the save dialog
- Quality presets for resolution (`720p`, `1080p`) and bitrate (`low`, `medium`, `high`, `ultra`) before the next recording
  - 720p: Low 1 Mbps, Medium 3 Mbps, High 6 Mbps, Ultra 10 Mbps
  - 1080p: Low 2 Mbps, Medium 6 Mbps, High 10 Mbps, Ultra 16 Mbps
- Optional MP4 export at save time using `ffmpeg.wasm`, with a WebM fallback during conversion
- Unit tests with Vitest
- Browser automation tests with Playwright

> MP4 export is optional and slower than native browser recording because the conversion runs fully inside the browser with `ffmpeg.wasm`. The ffmpeg WASM assets are only fetched when MP4 export is used.

## Architecture

```text
src/
  App.tsx
  main.tsx
  index.css

  components/
    WebcamRecorder.tsx
    RecordingErrorBoundary.tsx
    PermissionModal.tsx

  hooks/
    useWebcamRecorder.ts
    useTheme.ts

  lib/
    recorder.ts
    recorder.test.ts
    ffmpegExport.ts

tests/
  webcamRecorder.spec.ts
```

### `useWebcamRecorder`

Owns the recording lifecycle:

- requests camera/microphone permissions
- stores the active `MediaStream`
- exposes the stream through `videoRef`
- runs the countdown
- creates and controls `MediaRecorder`
- collects chunks into a final `Blob`
- resets state when recording is discarded
- stops tracks and releases hardware resources

### `WebcamRecorder`

Presentation component for:

- live preview
- countdown overlay
- paused overlay
- status badge
- lifecycle controls
- save dialog
- fallback download

### `RecordingErrorBoundary`

Catches unexpected React render errors and shows a recoverable error UI.

### `src/lib/recorder.ts`

Shared utilities:

- preferred MIME type selection
- extension normalization
- duration formatting
- recording constraints/options

## Commands

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run unit tests:

```bash
npm run test:unit
```

Run browser automation tests:

```bash
npm test
```

Run all tests:

```bash
npm run test:all
```

Lint:

```bash
npm run lint
```

## Suggested upgrades

- [ ] Add a `discard` confirmation modal
- [ ] Add optional screen recording support via `getDisplayMedia`
- [ ] Add camera/microphone device selectors
- [ ] Add recording duration limit with auto-stop
- [ ] Add webcam/mic level meters before recording
- [ ] Add retry permission flow when browser permission is denied
- [ ] Add a PR check workflow for lint/unit/e2e tests
- [ ] Add keyboard shortcuts for start/pause/stop
- [ ] Add a proper app favicon and PWA manifest
- [ ] Add Firefox/Safari verified playback/export notes if needed
