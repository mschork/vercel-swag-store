import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Environment for the scripts, from the process or from the files this repo
 * keeps out of git: the store's `.env.local` for the API, `working/secrets.local`
 * for the Sanity write token. The token is never in Vercel: these scripts run
 * on a machine, by a person (specs/E08-sanity-content-model.md).
 */
const root = join(dirname(fileURLToPath(import.meta.url)), '../../..')

function readFile(path: string): Map<string, string> {
  const values = new Map<string, string>()
  try {
    for (const line of readFileSync(join(root, path), 'utf8').split('\n')) {
      const [, key, value] = /^([A-Z_]+)=(.*)$/.exec(line.trim()) ?? []
      if (key && value !== undefined) values.set(key, value.replace(/^["']|["']$/g, ''))
    }
  } catch {
    // Missing file is fine; the value may come from the process instead.
  }
  return values
}

const files = [readFile('apps/store/.env.local'), readFile('working/secrets.local')]

export function required(name: string): string {
  const value = process.env[name] ?? files.find((f) => f.has(name))?.get(name)
  if (!value) {
    throw new Error(
      `Missing ${name}. Put it in the environment, in apps/store/.env.local, or in working/secrets.local.`,
    )
  }
  return value
}
