import { CLIENT_TOOLS, MAX_TURNS, MESSAGE_MAX_LENGTH, type ClientTool } from '@repo/testimonials/constants'
import {
  CLIENT_TOOL_OUTPUTS,
  CodeSchema,
  EmailAddressSchema,
  PhotoUploadedSchema,
  runIdOfPathname,
} from '@repo/testimonials/schemas'
import { z } from 'zod'
import type { ClientAnswer, TurnInput } from './turn'

/**
 * The body the chat and message routes receive, and what it says the visitor
 * did. The body is untrusted: it is parsed here, and only a parsed turn
 * reaches the run.
 */

/** Past this, a request body is refused unread. */
export const MAX_BODY_BYTES = 256 * 1024

const PartSchema = z.looseObject({ type: z.string() })
const MessageSchema = z.looseObject({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  parts: z.array(PartSchema),
})

/** Every turn adds a message from each side; the greeting and a reload add none. */
const MAX_MESSAGES = 2 * MAX_TURNS + 2

export const ChatBodySchema = z.object({
  messages: z.array(MessageSchema).min(1).max(MAX_MESSAGES),
  /** A photo chosen in the greeting. */
  photo: z.string().optional(),
  /** The address `askEmail` collected, beside the tool's answer. */
  email: z.string().optional(),
  /** The code `askCode` collected, beside the tool's answer. */
  code: z.string().optional(),
})

export type ChatBody = z.infer<typeof ChatBodySchema>

const ToolPartSchema = z.looseObject({
  type: z.string().startsWith('tool-'),
  toolCallId: z.string().min(1),
  state: z.literal('output-available'),
  output: z.unknown(),
})

const TextPartSchema = z.looseObject({ type: z.literal('text'), text: z.string() })

function answersOf(parts: readonly unknown[]): ClientAnswer[] {
  return parts.flatMap((part) => {
    const tool = ToolPartSchema.safeParse(part)
    if (!tool.success) return []
    const name = tool.data.type.slice('tool-'.length)
    if (!(CLIENT_TOOLS as readonly string[]).includes(name)) return []
    const output = CLIENT_TOOL_OUTPUTS[name as ClientTool].safeParse(tool.data.output)
    if (!output.success) return []
    return [{ toolCallId: tool.data.toolCallId, toolName: name, output: output.data } as ClientAnswer]
  })
}

/**
 * What the visitor did, from a parsed body: chose a photo in the greeting,
 * answered widgets, or typed. `null` when the body says none of these. With
 * no `runId` only a typed message counts, because no photo can belong to a
 * run that does not exist yet.
 */
export function turnOf(body: ChatBody, runId?: string): TurnInput | null {
  if (body.photo !== undefined) {
    const photo = PhotoUploadedSchema.safeParse({ pathname: body.photo })
    if (!runId || !photo.success || runIdOfPathname(photo.data.pathname) !== runId) return null
    return { kind: 'photo', pathname: photo.data.pathname }
  }
  const last = body.messages.at(-1)
  if (!last) return null
  if (last.role === 'user') {
    const text = last.parts
      .flatMap((part) => {
        const parsed = TextPartSchema.safeParse(part)
        return parsed.success ? [parsed.data.text] : []
      })
      .join('\n')
      .trim()
    if (text.length === 0 || text.length > MESSAGE_MAX_LENGTH) return null
    return { kind: 'message', text }
  }
  if (!runId) return null
  const answers = answersOf(last.parts)
  if (answers.length === 0) return null
  const email = EmailAddressSchema.safeParse(body.email)
  const code = CodeSchema.safeParse({ code: body.code })
  return {
    kind: 'tools',
    answers,
    ...(email.success ? { email: email.data } : {}),
    ...(code.success ? { code: code.data.code } : {}),
  }
}

/** The body of a chat request, or `null` when it is too large or malformed. */
export async function readChatBody(request: Request): Promise<ChatBody | null> {
  const text = await request.text()
  if (text.length > MAX_BODY_BYTES) return null
  try {
    const body = ChatBodySchema.safeParse(JSON.parse(text))
    return body.success ? body.data : null
  } catch {
    return null
  }
}
