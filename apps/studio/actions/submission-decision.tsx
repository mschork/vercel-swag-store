import { CheckmarkCircleIcon } from '@sanity/icons/CheckmarkCircle'
import { CloseCircleIcon } from '@sanity/icons/CloseCircle'
import { Button, Flex, Radio, Stack, Text, TextInput } from '@sanity/ui'
import { useState } from 'react'
import { useClient, type DocumentActionComponent, type DocumentActionProps } from 'sanity'
import { REJECTION_REASONS, type RejectionReason } from '@repo/testimonials/constants'
import { suggestReason } from '@repo/testimonials/reason'

/**
 * Accept and Reject on a testimonial submission. The run writes it as a
 * published document, so the actions patch it directly. They set `status`,
 * with `photoAlt` or `rejectionReason`; the `submission-decided` Function then
 * wakes the run, which publishes or emails. Editors never type text that goes
 * into an email: a rejection carries one of four reasons.
 */
const API_VERSION = '2026-09-01'

const REASON_LABELS: Record<RejectionReason, string> = {
  photo: 'The photo: unclear, unsuitable or not of the product',
  product: 'The product: the photo shows a different one',
  content: 'The words: the name or the quote cannot be published',
  other: 'Something else',
}

const isPending = ({ published }: DocumentActionProps) => published?.status === 'pending'

export const AcceptSubmission: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion: API_VERSION })
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [alt, setAlt] = useState('')

  const close = () => {
    setOpen(false)
    props.onComplete()
  }
  const accept = async () => {
    setBusy(true)
    try {
      await client
        .patch(props.id)
        .set({ status: 'accepted', photoAlt: alt.trim() })
        .unset(['rejectionReason'])
        .commit()
    } finally {
      setBusy(false)
      close()
    }
  }

  return {
    label: 'Accept',
    icon: CheckmarkCircleIcon,
    tone: 'positive',
    disabled: busy || !isPending(props),
    title: isPending(props) ? 'Publishes it as a testimonial and emails the visitor' : 'Already decided',
    onHandle: () => {
      setAlt(String(props.published?.photoAlt ?? ''))
      setOpen(true)
    },
    dialog: open && {
      type: 'dialog',
      header: 'Accept this submission',
      onClose: close,
      content: (
        <Stack gap={4}>
          <Text size={1} muted>
            The photo, the name and the quote are published as they are, and the visitor gets an
            email with a link to the product. Check the alternative text, which screen readers read
            out.
          </Text>
          <TextInput
            value={alt}
            onChange={(event) => setAlt(event.currentTarget.value)}
            placeholder="What the photo shows"
            aria-label="Alternative text"
          />
          <Flex justify="flex-end" gap={2}>
            <Button mode="ghost" text="Cancel" onClick={close} />
            <Button tone="positive" text="Accept" disabled={busy || alt.trim().length === 0} onClick={accept} />
          </Flex>
        </Stack>
      ),
    },
  }
}

export const RejectSubmission: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion: API_VERSION })
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [reason, setReason] = useState<RejectionReason | null>(null)

  const close = () => {
    setOpen(false)
    props.onComplete()
  }
  const reject = async () => {
    if (!reason) return
    setBusy(true)
    try {
      await client.patch(props.id).set({ status: 'rejected', rejectionReason: reason }).commit()
    } finally {
      setBusy(false)
      close()
    }
  }

  return {
    label: 'Reject',
    icon: CloseCircleIcon,
    tone: 'critical',
    disabled: busy || !isPending(props),
    title: isPending(props) ? 'Emails the visitor the reason' : 'Already decided',
    onHandle: () => {
      setReason(suggestReason(props.published?.findings as Parameters<typeof suggestReason>[0]))
      setOpen(true)
    },
    dialog: open && {
      type: 'dialog',
      header: 'Reject this submission',
      onClose: close,
      content: (
        <Stack gap={4}>
          <Text size={1} muted>
            The visitor gets one friendly sentence naming the reason, and an invitation to try again.
          </Text>
          <Stack gap={3} as="fieldset" style={{ border: 0, margin: 0, padding: 0 }}>
            {REJECTION_REASONS.map((value) => (
              <Flex key={value} as="label" align="center" gap={3}>
                <Radio
                  name="rejectionReason"
                  value={value}
                  checked={reason === value}
                  onChange={() => setReason(value)}
                />
                <Text size={1}>{REASON_LABELS[value]}</Text>
              </Flex>
            ))}
          </Stack>
          <Flex justify="flex-end" gap={2}>
            <Button mode="ghost" text="Cancel" onClick={close} />
            <Button tone="critical" text="Reject" disabled={busy || !reason} onClick={reject} />
          </Flex>
        </Stack>
      ),
    },
  }
}
