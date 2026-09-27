import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'

/** Spike: client upload to private Blob with a client token (read-write token). */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/jpeg'],
        maximumSizeInBytes: 2 * 1024 * 1024,
        addRandomSuffix: true,
      }),
    })
    return Response.json(result)
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 400 })
  }
}
