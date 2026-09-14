import 'server-only'
import type { z } from 'zod'
import type {
  CartItemSchema,
  CartSchema,
  CategorySchema,
  HealthSchema,
  PaginationSchema,
  ProductSchema,
  PromotionSchema,
  StockInfoSchema,
  StoreConfigSchema,
} from './schemas'

/**
 * Types inferred from the zod schemas in `schemas.ts`. Client components may
 * `import type` from here: type imports are erased at compile time, so the
 * `server-only` guard above never runs for them and only blocks value imports.
 * Prices (`price`, `lineTotal`, `subtotal`) are integers in cents.
 */
export type Product = z.infer<typeof ProductSchema>
export type StockInfo = z.infer<typeof StockInfoSchema>
export type Category = z.infer<typeof CategorySchema>
export type Promotion = z.infer<typeof PromotionSchema>
export type CartItem = z.infer<typeof CartItemSchema>
/** A cart as handed to pages and actions; the credential is stripped, only `createCart` returns it. */
export type Cart = z.output<typeof CartSchema>
export type Pagination = z.infer<typeof PaginationSchema>
export type StoreConfig = z.infer<typeof StoreConfigSchema>
export type Health = z.infer<typeof HealthSchema>

export type ProductListResult = { products: Product[]; pagination: Pagination }
