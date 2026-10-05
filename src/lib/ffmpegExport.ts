import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import coreURL from '@ffmpeg/core?url'
import coreWasmURL from '@ffmpeg/core/wasm?url'

export interface ExportToMp4Options {
  onProgress?: (progress: number) => void
  signal?: AbortSignal
}

export async function exportBlobToMp4(input: Blob, options: ExportToMp4Options = {}): Promise<Blob> {
  const ffmpeg = new FFmpeg()

  const progressHandler = ({ progress }: { progress: number }) => {
    if (options.onProgress) {
      options.onProgress(Math.max(0, Math.min(1, progress)))
    }
  }

  try {
    ffmpeg.on('progress', progressHandler)

    await ffmpeg.load(
      {
        coreURL: await toBlobURL(coreURL, 'text/javascript'),
        wasmURL: await toBlobURL(coreWasmURL, 'application/wasm'),
      },
      { signal: options.signal },
    )

    const inputName = 'input.webm'
    const outputName = 'output.mp4'

    await ffmpeg.writeFile(inputName, await fetchFile(input), { signal: options.signal })

    const code = await ffmpeg.exec(
      [
        '-i',
        inputName,
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-crf',
        '23',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        outputName,
      ],
      undefined,
      { signal: options.signal },
    )

    if (code !== 0) {
      throw new Error(`MP4 export failed with exit code ${code}.`)
    }

    const data = await ffmpeg.readFile(outputName, undefined, { signal: options.signal })
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data)
    return new Blob([bytes], { type: 'video/mp4' })
  } finally {
    ffmpeg.off('progress', progressHandler)
    ffmpeg.terminate()
  }
}