/**
 * The store's rich text as Markdown and as plain text. It covers what the
 * `richText` schema type allows (paragraphs, bold, italic, links) and drops
 * anything else, so a block type added to the schema shows up here as missing
 * text, not as broken markup.
 */

type Span = { _type?: string; text?: string; marks?: string[] }
type MarkDef = { _key?: string; _type?: string; href?: string }
type Block = { _type?: string; children?: Span[]; markDefs?: MarkDef[] }

/** Link targets a Markdown file may carry; the schema allows the same three. */
const LINK_SCHEMES = /^(https?:|mailto:)/i

function blocksOf(value: unknown): Block[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (block): block is Block =>
      typeof block === 'object' && block !== null && (block as Block)._type === 'block',
  )
}

function textOf(block: Block): string {
  return (block.children ?? []).map((span) => span.text ?? '').join('')
}

/**
 * Text that Markdown reads as text. Catalogue and CMS copy pass through
 * verbatim, so every character that could start markup is escaped, and a
 * marker at the start of a line (`#`, `>`, `-`, `+`, `1.`) loses its meaning.
 */
export function escapeMarkdown(text: string): string {
  return text
    .replace(/([\\`*_[\]<>|])/g, '\\$1')
    .replace(/^(\s*)([#>+-])/gm, '$1\\$2')
    .replace(/^(\s*\d+)([.)])/gm, '$1\\$2')
}

function spanToMarkdown(span: Span, markDefs: MarkDef[]): string {
  const raw = span.text ?? ''
  if (raw.trim() === '') return raw
  // Emphasis markers must hug the words, so surrounding space stays outside.
  const [, lead = '', body = '', trail = ''] = /^(\s*)([\s\S]*?)(\s*)$/.exec(raw) ?? []
  let text = escapeMarkdown(body).replace(/\n/g, '  \n')
  const marks = span.marks ?? []
  if (marks.includes('em')) text = `*${text}*`
  if (marks.includes('strong')) text = `**${text}**`
  const link = markDefs.find(
    (def) => def._type === 'link' && def._key !== undefined && marks.includes(def._key),
  )
  if (link?.href && LINK_SCHEMES.test(link.href)) {
    text = `[${text}](${link.href.replace(/[()\s]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)})`
  }
  return `${lead}${text}${trail}`
}

/** Paragraphs separated by a blank line; `''` for no content. */
export function portableTextToMarkdown(value: unknown): string {
  return blocksOf(value)
    .map((block) =>
      (block.children ?? [])
        .map((span) => spanToMarkdown(span, block.markDefs ?? []))
        .join('')
        .trim(),
    )
    .filter(Boolean)
    .join('\n\n')
}

/** Paragraphs separated by a line break, with no markup; `''` for no content. */
export function portableTextToPlainText(value: unknown): string {
  return blocksOf(value)
    .map((block) => textOf(block).trim())
    .filter(Boolean)
    .join('\n')
}
