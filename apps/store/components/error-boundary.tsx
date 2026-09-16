'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  /** Rendered instead of the children after a throw; `reset` clears the error. */
  fallback: (reset: () => void) => ReactNode
  children: ReactNode
}

/**
 * A boundary for one region of a page. `app/error.tsx` replaces the whole
 * page, which is the wrong answer when only part of it failed; this keeps the
 * rest, including anything the visitor was typing, on screen.
 *
 * A class component because React has no hook equivalent.
 */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  reset = () => this.setState({ failed: false })

  render() {
    return this.state.failed
      ? this.props.fallback(this.reset)
      : this.props.children
  }
}
