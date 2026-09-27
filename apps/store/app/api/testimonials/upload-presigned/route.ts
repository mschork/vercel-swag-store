import { issueSignedToken } from '@vercel/blob'
import { handleUploadPresigned, type HandleUploadPresignedBody } from '@vercel/blob/client'

/** Spike: presigned client upload, signed over OIDC without the read-write token. */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadPresignedBody
  try {
    const result = await handleUploadPresigned({
      body,
      request,
      // Only verifies upload-completed callbacks, which this flow does not use.
      webhookPublicKey: 'unused',
      getSignedToken: async (pathname) => ({
        token: await issueSignedToken({
          // Forces OIDC: no read-write token is passed or read.
          token: undefined,
          oidcToken: process.env.VERCEL_OIDC_TOKEN,
          storeId: process.env.SPIKE_BLOB_STORE_ID,
          pathname,
          operations: ['put'],
          allowedContentTypes: ['image/jpeg'],
          maximumSizeInBytes: 2 * 1024 * 1024,
        }),
      }),
    })
    return Response.json(result)
  } catch (error) {
    console.error('[spike] presigned', error)
    return Response.json({ error: String(error) }, { status: 400 })
  }
}
