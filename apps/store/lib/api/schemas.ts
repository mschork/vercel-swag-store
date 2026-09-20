import 'server-only'
import { z } from 'zod'

/**
 * zod schemas for every API response shape. This is one of the three trust
 * boundaries where zod is allowed (see AGENTS.md); `types.ts` infers the
 * TypeScript types from these so there is a single source of truth.
 *
 * `z.object` strips unknown keys, so new API fields never break parsing.
 */

const cents = z.int().nonnegative().describe('Amount in cents; format with formatPrice()')

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  price: cents,
  currency: z.string(),
  category: z.string(),
  images: z.array(z.string()),
  featured: z.boolean(),
  tags: z.array(z.string()),
  createdAt: z.string(),
})

export const StockInfoSchema = z.object({
  productId: z.string(),
  stock: z.int().nonnegative(),
  inStock: z.boolean(),
  lowStock: z.boolean(),
})

export const CategorySchema = z.object({
  slug: z.string(),
  name: z.string(),
  productCount: z.int().nonnegative(),
})

export const PromotionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  discountPercent: z.int(),
  code: z.string(),
  validFrom: z.string(),
  validUntil: z.string(),
  active: z.boolean(),
})

export const CartItemSchema = z.object({
  productId: z.string(),
  quantity: z.int().nonnegative(),
  addedAt: z.string(),
  product: ProductSchema,
  lineTotal: cents,
})

/**
 * The cart exactly as the API sends it, token included. Only `createCart`
 * reads this; everything else uses `CartSchema`, which strips the token so it
 * can never reach a client component (docs/adr/0002-cart-server-side-only.md).
 */
const cartShape = {
  items: z.array(CartItemSchema),
  totalItems: z.int().nonnegative(),
  subtotal: cents,
  currency: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
}

export const RawCartSchema = z.object({ token: z.string(), ...cartShape })

/** The cart as handed to pages and actions. Parsing drops `token` because the shape has no such key. */
export const CartSchema = z.object(cartShape)

export function withoutToken<T extends { token: string }>(cart: T): Omit<T, 'token'> {
  const copy: Partial<T> = { ...cart }
  delete copy.token
  return copy as Omit<T, 'token'>
}

export const PaginationSchema = z.object({
  page: z.int(),
  limit: z.int(),
  total: z.int(),
  totalPages: z.int(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
})

export const ProductListMetaSchema = z.object({
  pagination: PaginationSchema,
})

export const StoreConfigSchema = z.object({
  storeName: z.string(),
  currency: z.string(),
  features: z.record(z.string(), z.boolean()),
  socialLinks: z.record(z.string(), z.string()),
  seo: z.object({
    defaultTitle: z.string(),
    titleTemplate: z.string(),
    defaultDescription: z.string(),
  }),
})

export const HealthSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  services: z.record(z.string(), z.string()),
})

export const ErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})

export function successEnvelope<TData extends z.ZodType, TMeta extends z.ZodType>(
  data: TData,
  meta?: TMeta,
) {
  return z.object({
    success: z.literal(true),
    data,
    // Without a meta schema, whatever the API sends there is ignored, not rejected.
    meta: meta ?? z.unknown().optional(),
  })
}
