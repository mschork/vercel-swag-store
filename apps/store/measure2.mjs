import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'
const BASE='http://localhost:3000'
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n')
  .filter(l=>l.includes('=')&&!l.trim().startsWith('#'))
  .map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim()]}))
const headers = { 'x-vercel-protection-bypass': env.API_BYPASS_TOKEN }
const created = await fetch(`${env.API_BASE_URL}/cart/create`, { method: 'POST', headers })
const cartToken = created.headers.get('x-cart-token') ?? (await created.json()).data.token
await fetch(`${env.API_BASE_URL}/cart`, { method: 'POST',
  headers: { ...headers, 'content-type': 'application/json', 'x-cart-token': cartToken },
  body: JSON.stringify({ productId: 'tumbler_001', quantity: 1 }) })

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
await context.addCookies([{ name: 'cart_token', value: cartToken, url: BASE }])
const page = await context.newPage()
await page.goto(`${BASE}/cart`)
await page.getByRole('main').getByRole('listitem').first().waitFor({ timeout: 30000 })
await page.waitForTimeout(3000)

const read = () => page.evaluate(() => ({
  doc: document.documentElement.scrollHeight,
  summary: document.querySelector('section[aria-labelledby="cart-summary"]').getBoundingClientRect().height,
  grid: document.querySelector('section[aria-labelledby="cart-summary"]').parentElement.getBoundingClientRect().height,
  lines: document.querySelector('main ul').getBoundingClientRect().height,
}))
console.log('NOW    :', JSON.stringify(await read()))

await page.locator('dl').first().evaluate(dl => {
  const [, subtotal] = [...dl.children]
  subtotal.classList.remove('border-t', 'border-border', 'pt-3')
  const sep = document.createElement('div')
  sep.className = 'shrink-0 bg-border h-px w-full'
  dl.insertBefore(sep, subtotal)
})
console.log('AS OLD :', JSON.stringify(await read()))
await browser.close()
