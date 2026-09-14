export interface SanityEnv {
  projectId: string
  dataset: string
}

/**
 * Validates the Sanity project id and dataset read from the environment.
 * Callers pass the values together with the variable names they came from,
 * because the store (`NEXT_PUBLIC_SANITY_*`) and the Studio (`SANITY_STUDIO_*`)
 * use different names.
 */
export function requireSanityEnv(vars: {
  projectId: { name: string; value: string | undefined }
  dataset: { name: string; value: string | undefined }
}): SanityEnv {
  const missing = [vars.projectId, vars.dataset]
    .filter((v) => !v.value)
    .map((v) => v.name)
  if (missing.length > 0) {
    throw new Error(
      `Missing Sanity environment variable(s): ${missing.join(', ')}. ` +
        'See the .env.example next to the app you are running.',
    )
  }
  return {
    projectId: vars.projectId.value as string,
    dataset: vars.dataset.value as string,
  }
}
