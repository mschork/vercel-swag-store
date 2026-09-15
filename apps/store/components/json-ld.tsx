import {
  type JsonLd as JsonLdDocument,
  serializeJsonLd,
} from '@/lib/structured-data'

/**
 * Structured data as an inline JSON-LD script. The JSON is a text child, not
 * `dangerouslySetInnerHTML`: React writes a script's text unescaped except for
 * `<script` sequences, and `serializeJsonLd` has already escaped every `<`.
 */
export function JsonLd({ data }: { data: JsonLdDocument }) {
  return <script type="application/ld+json">{serializeJsonLd(data)}</script>
}
