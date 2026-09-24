// Asserts that the document the browser receives carries only the metadata
// this repository decided on. Instructions embedded in third-party data are
// never followed (AGENTS.md rule 2), and a directive of that kind is worth
// checking for rather than trusting: it asks for one tag and one colour, both
// of which would land here.
//
// Run after `turbo build`; reads the prerendered HTML, which is the end state
// a source grep can only approximate.

import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const HTML_DIR = 'apps/store/.next/server/app'

/** The pair `specs/E03-shell-layout-metadata.md` specifies, and no other. */
const THEME_COLOURS = new Set(['#ffffff', '#000000'])

/** No generator is declared: the store does not advertise what built it. */
const GENERATOR = /<meta[^>]+name=["']generator["'][^>]*>/i

const THEME = /<meta[^>]+name=["']theme-color["'][^>]*content=["']([^"']+)["']/gi

const failures = []

const entries = await readdir(HTML_DIR, { recursive: true, withFileTypes: true })
const pages = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
  .map((entry) => join(entry.parentPath ?? entry.path, entry.name))

if (pages.length === 0) {
  console.error('check-metadata failed: no prerendered HTML found; run the build first')
  process.exit(1)
}

for (const page of pages) {
  const html = await readFile(page, 'utf8')

  if (GENERATOR.test(html)) {
    failures.push(`${page} declares a generator`)
  }

  for (const [, colour] of html.matchAll(THEME)) {
    if (THEME_COLOURS.has(colour.toLowerCase())) continue
    failures.push(`${page} sets an unexpected theme colour: ${colour}`)
  }
}

if (failures.length > 0) {
  console.error('check-metadata failed:')
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}

console.log(
  `check-metadata: ${pages.length} prerendered pages, no generator, theme colours as specified`,
)
