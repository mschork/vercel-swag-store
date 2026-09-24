import type { Page, Request } from '@playwright/test'

/**
 * Watches a page's Server Action posts, told apart from navigations by Next's
 * `next-action` header. A post has answered once it finished or failed:
 * Playwright reports one as cancelled when the page has read its answer, so
 * a test never awaits `response.finished()`.
 */
export function watchActions(page: Page) {
  const sent: Request[] = []
  const answered: Request[] = []
  const isAction = (request: Request) => !!request.headers()['next-action']
  const answer = (request: Request) => {
    if (isAction(request)) answered.push(request)
  }
  page.on('request', (request) => {
    if (isAction(request)) sent.push(request)
  })
  page.on('requestfinished', answer)
  page.on('requestfailed', answer)

  // An add posts its form, whose fields carry `productId`; a row's change and
  // the cart opened on intent post plain arguments.
  const isAdd = (request: Request) => request.postData()?.includes('productId') ?? false
  return {
    sent: () => sent.length,
    answered: () => answered.length,
    addsAnswered: () => answered.filter(isAdd).length,
  }
}
