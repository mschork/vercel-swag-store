import { SpikeUpload } from './spike-upload'

/** Spike: private Blob client upload under the store's CSP. Throwaway. */
export default function SpikeUploadPage() {
  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1>Blob upload spike</h1>
      <SpikeUpload />
    </main>
  )
}
