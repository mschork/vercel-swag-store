'use client'

import { upload, uploadPresigned } from '@vercel/blob/client'
import { useState } from 'react'

const MAX_PHOTO_EDGE = 1600

/** Downsizes and re-encodes through a canvas, which drops EXIF. */
async function reencode(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = new OffscreenCanvas(Math.round(bitmap.width * scale), Math.round(bitmap.height * scale))
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 })
}

export function SpikeUpload() {
  const [result, setResult] = useState('')
  async function go(file: File, presigned: boolean) {
    const started = performance.now()
    try {
      const jpeg = await reencode(file)
      const options = { access: 'private' as const, contentType: 'image/jpeg' }
      const blob = presigned
        ? await uploadPresigned('testimonials/spike.jpg', jpeg, { ...options, handleUploadUrl: '/api/testimonials/upload-presigned' })
        : await upload('testimonials/spike.jpg', jpeg, { ...options, handleUploadUrl: '/api/testimonials/upload' })
      setResult(JSON.stringify({ ok: true, presigned, bytes: jpeg.size, ms: Math.round(performance.now() - started), pathname: blob.pathname, url: blob.url.replace(/\?.*/, '') }))
    } catch (error) {
      setResult(JSON.stringify({ ok: false, presigned, error: String(error).slice(0, 300) }))
    }
  }
  return (
    <div className="space-y-2">
      <label>
        token <input type="file" accept="image/*" data-testid="token" onChange={(e) => e.target.files?.[0] && go(e.target.files[0], false)} />
      </label>
      <label>
        presigned <input type="file" accept="image/*" data-testid="presigned" onChange={(e) => e.target.files?.[0] && go(e.target.files[0], true)} />
      </label>
      <pre data-testid="result">{result}</pre>
    </div>
  )
}
