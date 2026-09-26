// `next/cache` for workflow bundles that Node imports outside the Next runtime.
const noop = () => {}
export const cacheTag = noop
export const cacheLife = noop
export const updateTag = noop
export const revalidateTag = noop
export const refresh = noop
