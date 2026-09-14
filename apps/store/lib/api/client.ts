import 'server-only'
import type { z } from 'zod'
import { serverEnv } from '@/lib/env'
import { ErrorEnvelopeSchema, successEnvelope } from './schemas'

export const REQUEST_TIMEOUT_MS = 5000
export const RETRY_BACKOFF_MS = 250

/**
 * Codes the client produces itself. The API's own codes (`NOT_FOUND`,
 * `VALIDATION_ERROR`, …) pass through unchanged.
 */
export type ClientErrorCode = 'HTTP_ERROR' | 'TIMEOUT' | 'NETWORK_ERROR' | 'INVALID_RESPONSE'

export class ApiError extends Error {
  override readonly name = 'ApiError'

  constructor(
    /** HTTP status; 0 when no response was received (timeout, network). */
    readonly status: number,
    readonly code: ClientErrorCode | (string & {}),
    message: string,
    /** Request path relative to the API base, never including a token. */
    readonly path: string,
    readonly details?: unknown,
  ) {
    super(message)
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export interface FetchApiOptions<TData> {
  schema: z.ZodType<TData>
  method?: Method
  body?: unknown
  /** Extra request headers, e.g. `x-cart-token`. Merged over the defaults. */
  headers?: Record<string, string>
}

export interface ApiResult<TData, TMeta = undefined> {
  data: TData
  meta: TMeta
  /** Raw response headers for callers that need them (`createCart` reads `x-cart-token`). */
  headers: Headers
}

/**
 * The one place that talks to the Swag Store API. Builds the URL, adds the
 * bypass header, parses the envelope and validates `data` against `schema`.
 *
 * Caching is not decided here: callers wrap themselves in `"use cache"` or
 * deliberately do not (see the cache policy table in AGENTS.md).
 *
 * Failure modes, all thrown as `ApiError`:
 * - API error envelope (any status, or `success: false`): the API's own code and message.
 * - Non-JSON non-2xx (Vercel's HTML 401 for a bad bypass token, a gateway page): `HTTP_ERROR`.
 * - No response within 5 s: `TIMEOUT`, never retried.
 * - Network failure or 5xx: retried once for GET only, then `NETWORK_ERROR` / the API error.
 * - 2xx body that is not JSON or fails the schema: `INVALID_RESPONSE`, logged with the path only.
 *
 * Nothing that could contain a token, neither the bypass token nor a cart
 * body, is ever placed in an error message or a log line.
 */
export async function fetchApi<TData>(
  path: string,
  options: FetchApiOptions<TData>,
): Promise<ApiResult<TData, undefined>>
export async function fetchApi<TData, TMeta>(
  path: string,
  options: FetchApiOptions<TData> & { metaSchema: z.ZodType<TMeta> },
): Promise<ApiResult<TData, TMeta>>
export async function fetchApi<TData, TMeta>(
  path: string,
  options: FetchApiOptions<TData> & { metaSchema?: z.ZodType<TMeta> },
): Promise<ApiResult<TData, TMeta | undefined>> {
  const method = options.method ?? 'GET'
  const headers: Record<string, string> = {
    accept: 'application/json',
    'x-vercel-protection-bypass': serverEnv.API_BYPASS_TOKEN,
    ...(options.body !== undefined ? { 'content-type': 'application/json' } : {}),
    ...options.headers,
  }
  const init: RequestInit = {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  }

  const response = await send(`${serverEnv.API_BASE_URL}${path}`, init, path, method === 'GET')

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    if (!response.ok) throw httpError(response, path)
    throw invalidResponse(path, response.status, ['body is not JSON'])
  }

  let json: unknown
  try {
    json = await response.json()
  } catch {
    if (!response.ok) throw httpError(response, path)
    throw invalidResponse(path, response.status, ['body is not valid JSON'])
  }

  const failure = ErrorEnvelopeSchema.safeParse(json)
  if (failure.success) {
    const { code, message, details } = failure.data.error
    throw new ApiError(response.status, code, message, path, details)
  }
  if (!response.ok) throw httpError(response, path)

  const parsed = successEnvelope(options.schema, options.metaSchema).safeParse(json)
  if (!parsed.success) {
    throw invalidResponse(
      path,
      response.status,
      parsed.error.issues.map((issue) => `${issue.path.join('.') || '$'}: ${issue.message}`),
    )
  }
  return {
    data: parsed.data.data as TData,
    meta: parsed.data.meta as TMeta | undefined,
    headers: response.headers,
  }
}

/** One attempt, plus one retry after a short backoff when `retryable` and the failure was a network error or a 5xx. */
async function send(url: string, init: RequestInit, path: string, retryable: boolean): Promise<Response> {
  const attempts = retryable ? 2 : 1
  let last: Response | ApiError | undefined
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await sleep(RETRY_BACKOFF_MS)
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
      if (response.status < 500) return response
      last = response
    } catch (error) {
      if (isTimeout(error)) {
        throw new ApiError(0, 'TIMEOUT', `Request to ${path} timed out after ${REQUEST_TIMEOUT_MS} ms`, path)
      }
      last = new ApiError(0, 'NETWORK_ERROR', `Could not reach the API for ${path}`, path)
    }
  }
  if (last instanceof ApiError) throw last
  // Unreachable in practice: `last` is always set after the loop.
  if (last === undefined) throw new ApiError(0, 'NETWORK_ERROR', `No response for ${path}`, path)
  return last
}

function httpError(response: Response, path: string): ApiError {
  return new ApiError(
    response.status,
    'HTTP_ERROR',
    `${response.status} ${response.statusText}`.trim(),
    path,
  )
}

function invalidResponse(path: string, status: number, issues: string[]): ApiError {
  console.error(`[api] invalid response from ${path} (status ${status})`, issues)
  return new ApiError(status, 'INVALID_RESPONSE', `Unexpected response shape from ${path}`, path)
}

function isTimeout(error: unknown): boolean {
  return error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
