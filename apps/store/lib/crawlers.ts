/**
 * User agents of AI training and answer crawlers that `robots.txt` asks to
 * stay out (specs/E20-ai-crawlers.md). They ignore `X-Robots-Tag: noindex`
 * and obey `robots.txt`, so the header that keeps search engines out does
 * nothing for them. Add a new crawler here; `app/robots.ts` reads the list.
 */
export const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'anthropic-ai',
  'Google-Extended',
  'GoogleOther',
  'Applebot-Extended',
  'PerplexityBot',
  'Perplexity-User',
  'CCBot',
  'Bytespider',
  'Amazonbot',
  'meta-externalagent',
  'FacebookBot',
  'cohere-ai',
  'Diffbot',
  'DuckAssistBot',
  'MistralAI-User',
  'YouBot',
] as const
