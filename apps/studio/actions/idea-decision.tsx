import { CheckmarkCircleIcon } from '@sanity/icons/CheckmarkCircle'
import { CloseCircleIcon } from '@sanity/icons/CloseCircle'
import { Button, Flex, Stack, Text, TextArea } from '@sanity/ui'
import { useState } from 'react'
import { useClient, type DocumentActionComponent, type DocumentActionProps } from 'sanity'

/**
 * Accept and Reject on a product idea (E13, slice 5). The idea is written by
 * the analysis as a published document, so the actions patch it directly: no
 * draft, no publish step. They set `status` (and the reason); the
 * `idea-decided` Function then stamps the date and moves the search gaps.
 *
 * Sanity Workflows was evaluated for this and left out: its runtime is marked
 * experimental by its own documentation (specs/callout.md).
 */
const API_VERSION = '2026-09-01'

/** Both the published document and a stray draft count: an idea decided once stays decided. */
const isOpen = ({ published, draft }: DocumentActionProps) =>
  ((draft ?? published)?.status ?? 'proposed') === 'proposed'

export const AcceptIdea: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion: API_VERSION })
  const [busy, setBusy] = useState(false)
  return {
    label: 'Accept',
    icon: CheckmarkCircleIcon,
    tone: 'positive',
    disabled: busy || !props.published || !isOpen(props),
    title: isOpen(props) ? 'A signal to whoever owns the catalogue; nothing is created' : 'Already decided',
    onHandle: async () => {
      setBusy(true)
      try {
        await client.patch(props.id).set({ status: 'accepted' }).unset(['rejectionReason']).commit()
      } finally {
        setBusy(false)
        props.onComplete()
      }
    },
  }
}

export const RejectIdea: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion: API_VERSION })
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [reason, setReason] = useState('')

  const close = () => {
    setOpen(false)
    props.onComplete()
  }
  const reject = async () => {
    setBusy(true)
    try {
      await client.patch(props.id).set({ status: 'rejected', rejectionReason: reason.trim() }).commit()
    } finally {
      setBusy(false)
      close()
    }
  }

  return {
    label: 'Reject',
    icon: CloseCircleIcon,
    tone: 'critical',
    disabled: busy || !props.published || !isOpen(props),
    title: isOpen(props) ? undefined : 'Already decided',
    onHandle: () => setOpen(true),
    dialog: open && {
      type: 'dialog',
      header: 'Reject this idea',
      onClose: close,
      content: (
        <Stack gap={4}>
          <Text size={1} muted>
            The reason stays on the idea, so the next person sees why. The searches behind it keep
            counting.
          </Text>
          <TextArea
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.currentTarget.value)}
            placeholder="Why not?"
            aria-label="Reason for rejecting"
          />
          <Flex justify="flex-end" gap={2}>
            <Button mode="ghost" text="Cancel" onClick={close} />
            <Button
              tone="critical"
              text="Reject"
              disabled={busy || reason.trim().length === 0}
              onClick={reject}
            />
          </Flex>
        </Stack>
      ),
    },
  }
}
