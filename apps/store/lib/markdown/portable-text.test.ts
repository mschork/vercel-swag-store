import { describe, expect, it } from 'vitest'
import {
  escapeMarkdown,
  portableTextToMarkdown,
  portableTextToPlainText,
} from './portable-text'

const block = (children: object[], markDefs: object[] = []) => ({
  _type: 'block',
  children,
  markDefs,
})
const span = (text: string, marks: string[] = []) => ({ _type: 'span', text, marks })

describe('portableTextToMarkdown', () => {
  it('separates paragraphs with a blank line', () => {
    expect(portableTextToMarkdown([block([span('One.')]), block([span('Two.')])])).toBe(
      'One.\n\nTwo.',
    )
  })

  it('writes bold, italic and both, keeping the space outside the markers', () => {
    const value = [
      block([span('Wash '), span('cold ', ['strong']), span('and'), span(' flat', ['em', 'strong'])]),
    ]
    expect(portableTextToMarkdown(value)).toBe('Wash **cold** and ***flat***')
  })

  it('writes a link from its mark definition', () => {
    const value = [
      block(
        [span('See the '), span('size guide', ['k1']), span('.')],
        [{ _key: 'k1', _type: 'link', href: 'https://example.com/a (b)' }],
      ),
    ]
    expect(portableTextToMarkdown(value)).toBe(
      'See the [size guide](https://example.com/a%20%28b%29).',
    )
  })

  it('keeps the words of a link whose target is not http, https or mailto', () => {
    const value = [
      block([span('click', ['k1'])], [{ _key: 'k1', _type: 'link', href: 'javascript:alert(1)' }]),
    ]
    expect(portableTextToMarkdown(value)).toBe('click')
  })

  it('escapes what Markdown would read as markup', () => {
    expect(portableTextToMarkdown([block([span('# Not a heading, *not* [a](link) <b>')])])).toBe(
      '\\# Not a heading, \\*not\\* \\[a\\](link) \\<b\\>',
    )
  })

  it('skips blocks it does not know and empty paragraphs', () => {
    expect(
      portableTextToMarkdown([{ _type: 'image' }, block([span('  ')]), block([span('Kept.')])]),
    ).toBe('Kept.')
  })

  it('is empty for anything that is not rich text', () => {
    expect(portableTextToMarkdown(null)).toBe('')
    expect(portableTextToMarkdown('text')).toBe('')
  })
})

describe('portableTextToPlainText', () => {
  it('joins spans without markup and paragraphs with a line break', () => {
    const value = [
      block([span('Wash '), span('cold', ['strong']), span('.')]),
      block([span('Dry flat.')]),
    ]
    expect(portableTextToPlainText(value)).toBe('Wash cold.\nDry flat.')
  })
})

describe('escapeMarkdown', () => {
  it('defuses list and quote markers at the start of a line only', () => {
    expect(escapeMarkdown('- one\n2. two\n> three\na - b')).toBe('\\- one\n2\\. two\n\\> three\na - b')
  })
})
