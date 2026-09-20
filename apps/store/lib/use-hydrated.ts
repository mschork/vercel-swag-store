import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * False on the server and while React hydrates the component, true from then
 * on, and true at once for a component that mounts on the client. A component
 * that renders from client state uses it to repeat the server's HTML first.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false)
}
