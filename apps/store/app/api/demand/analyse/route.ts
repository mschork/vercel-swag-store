import { start } from 'workflow/api'
import { z } from 'zod'
import { authorised } from '@/lib/bearer'
import { serverEnv } from '@/lib/env'
import { analyseDemand } from '@/workflows/analyse-demand'

/**
 * Wakes the demand analysis. Called by the `gap-threshold` Sanity Function
 * when a search gap crosses the threshold, or by hand:
 *
 *   curl -X POST https://<host>/api/demand/analyse \
 *     -H "Authorization: Bearer $DEMAND_ANALYSE_SECRET" \
 *     -H "Content-Type: application/json" -d '{"settle":false}'
 *
 * It only starts the workflow and answers at once; calling it while a run is
 * in flight starts no second run, because the workflow's lock turns the extra
 * run away. With the secret unset the route refuses every call.
 */
const BodySchema = z.object({ settle: z.boolean().default(true) })

export async function POST(request: Request): Promise<Response> {
  if (!authorised(request.headers.get('authorization'), serverEnv.DEMAND_ANALYSE_SECRET)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = BodySchema.safeParse(await request.json().catch(() => ({})))
  if (!body.success) return Response.json({ error: 'Invalid body' }, { status: 400 })

  const run = await start(analyseDemand, [{ settle: body.data.settle }])
  return Response.json({ runId: run.runId }, { status: 202 })
}
