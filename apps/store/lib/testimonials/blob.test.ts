import { beforeEach, describe, expect, it, vi } from 'vitest'

const blob = vi.hoisted(() => ({
  issueSignedToken: vi.fn(async () => ({ delegationToken: 'd', clientSigningToken: 'c', validUntil: 1 })),
  get: vi.fn(),
  list: vi.fn(),
  del: vi.fn(async () => {}),
}))
const env = vi.hoisted(() => ({ BLOB_STORE_ID: 'store_1' as string | undefined }))

vi.mock('@vercel/blob', () => blob)
vi.mock('@/lib/env', () => ({ serverEnv: env }))

const { deletePhotos, listPhotos, openPhoto, readPhoto, signUpload } = await import('./blob')

beforeEach(() => {
  env.BLOB_STORE_ID = 'store_1'
  for (const mock of Object.values(blob)) mock.mockClear()
})

describe('the photo store', () => {
  it('signs one JPEG put to one pathname in the named store', async () => {
    await signUpload('testimonials/wrun_1/1.jpg')
    expect(blob.issueSignedToken).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: 'store_1',
        pathname: 'testimonials/wrun_1/1.jpg',
        operations: ['put'],
        allowedContentTypes: ['image/jpeg'],
      }),
    )
  })

  it('throws without a store id', async () => {
    env.BLOB_STORE_ID = undefined
    expect(() => signUpload('x')).toThrow('BLOB_STORE_ID')
  })

  it('reads a private photo, or reports it gone', async () => {
    blob.get.mockResolvedValueOnce({ statusCode: 200, stream: new Response(new Uint8Array([1, 2])).body })
    expect(await readPhoto('p')).toEqual(new Uint8Array([1, 2]))
    expect(blob.get).toHaveBeenCalledWith('p', { storeId: 'store_1', access: 'private' })
    blob.get.mockResolvedValueOnce(null)
    expect(await openPhoto('p')).toBeNull()
    blob.get.mockResolvedValueOnce(null)
    await expect(readPhoto('p')).rejects.toThrow('gone')
  })

  it("lists a run's photos in order and deletes all but the one to keep", async () => {
    blob.list.mockResolvedValue({ blobs: [{ pathname: 'testimonials/wrun_1/2.jpg' }, { pathname: 'testimonials/wrun_1/1.jpg' }] })
    expect(await listPhotos('wrun_1')).toEqual(['testimonials/wrun_1/1.jpg', 'testimonials/wrun_1/2.jpg'])
    expect(blob.list).toHaveBeenCalledWith({ storeId: 'store_1', prefix: 'testimonials/wrun_1/' })
    await deletePhotos('wrun_1', 'testimonials/wrun_1/2.jpg')
    expect(blob.del).toHaveBeenCalledWith(['testimonials/wrun_1/1.jpg'], { storeId: 'store_1' })
  })

  it('deletes nothing when nothing is left', async () => {
    blob.list.mockResolvedValue({ blobs: [] })
    await deletePhotos('wrun_1')
    expect(blob.del).not.toHaveBeenCalled()
  })
})
