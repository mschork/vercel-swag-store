import { initBotId } from 'botid/client/core'

// BotID challenges the testimonial chat's requests; each route checks the
// verdict with `checkBotId()`.
initBotId({
  protect: [
    { path: '/api/testimonials/chat', method: 'GET' },
    { path: '/api/testimonials/chat', method: 'POST' },
    { path: '/api/testimonials/chat', method: 'DELETE' },
    { path: '/api/testimonials/chat/*/message', method: 'POST' },
    { path: '/api/testimonials/chat/*/stream', method: 'GET' },
    { path: '/api/testimonials/upload', method: 'POST' },
  ],
})
