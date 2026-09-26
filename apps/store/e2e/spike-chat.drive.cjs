// Drives the spike chat: turn 1 by message, askName via widget, a typed message
// while a widget is open, a reload mid-conversation, askEmail via widget.
const { chromium } = require(require.resolve('@playwright/test', { paths: [process.cwd()] }))
const BASE = process.env.BASE_URL ?? 'http://localhost:3100'
const t0 = Date.now()
const at = () => ((Date.now() - t0) / 1000).toFixed(1) + 's'
const log = (...a) => console.log(at(), ...a)

async function waitReady(page, label) {
  const t = Date.now()
  await page.waitForFunction(() => document.querySelector('[data-testid=status]')?.textContent === 'status: ready', null, { timeout: 120000 })
  log(label, 'ready after', Date.now() - t, 'ms')
}
async function dump(page, label) {
  const msgs = await page.$$eval('li[data-role]', (els) => els.map((e) => e.dataset.role + ': ' + e.textContent.slice(0, 160)))
  const draft = await page.textContent('[data-testid=draft]')
  const raw = await page.evaluate(() => (window.__messages ?? []).map((m) => ({ role: m.role, parts: m.parts.filter((p) => p.type !== 'step-start').map((p) => p.type === 'text' ? p.text : p.type + ':' + (p.state ?? '') + (p.output ? ' ' + JSON.stringify(p.output) : '')) })))
  log(label, JSON.stringify({ draft, raw }))
}

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  page.on('console', (m) => m.type() === 'error' && log('console.error', m.text().slice(0, 300)))
  await page.goto(BASE + '/spike/chat')
  await page.waitForSelector('[aria-label=message]')
  await page.fill('[aria-label=message]', 'Hi, I would like to leave a testimonial.')
  await page.click('button:has-text("Send")')
  await page.waitForTimeout(500)
  await waitReady(page, 'turn 1')
  await dump(page, 'after turn 1')

  // Typed instead of the widget
  if (await page.$('[data-testid=widget-askName]')) {
    await page.fill('[aria-label=message]', 'Why do you need my name?')
    await page.click('button:has-text("Send")')
    await page.waitForTimeout(500)
    await waitReady(page, 'turn 2 (typed instead)')
    await dump(page, 'after typed')
  }
  await page.waitForSelector('[data-testid=widget-askName]', { timeout: 60000 })
  await page.fill('[aria-label=askName]', 'Ada')
  await page.click('[data-testid=widget-askName] button')
  await page.waitForTimeout(300)
  // Reload in the middle of the turn that answers the name
  await page.waitForTimeout(Number(process.env.RELOAD_AFTER_MS ?? 800))
  log('reloading mid-turn')
  await page.reload()
  await page.waitForSelector('[aria-label=message]')
  await page.waitForTimeout(500)
  await waitReady(page, 'after reload')
  await dump(page, 'after reload')

  // The model should ask what was bought; answer, then the email widget.
  if (!(await page.$('[data-testid=widget-askEmail]'))) {
    await page.fill('[aria-label=message]', 'I bought the black mug.')
    await page.click('button:has-text("Send")')
    await page.waitForTimeout(500)
    await waitReady(page, 'product turn')
    await dump(page, 'after product')
  }
  await page.waitForSelector('[data-testid=widget-askEmail]', { timeout: 60000 })
  await page.fill('[aria-label=askEmail]', 'ada@example.com')
  await page.click('[data-testid=widget-askEmail] button')
  await page.waitForTimeout(500)
  await waitReady(page, 'email turn')
  await page.fill('[aria-label=message]', 'What exactly did the askEmail tool return? Quote it verbatim.')
  await page.click('button:has-text("Send")')
  await page.waitForTimeout(500)
  await waitReady(page, 'probe turn')
  await dump(page, 'final')
  log('log', await page.textContent('[data-testid=log]'))
  await browser.close()
})().catch((e) => { console.error(at(), e); process.exit(1) })
