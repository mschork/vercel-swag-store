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
 * Types inferred from the zod schemas in `schemas.ts`. Type-only, so client
 * components may `import type` from here without pulling in server code.
 * Prices (`price`, `lineTotal`, `subtotal`) are integers in cents.
 */
export type Product = z.infer<typeof ProductSchema>
export type StockInfo = z.infer<typeof StockInfoSchema>
export type Category = z.infer<typeof CategorySchema>
export type Promotion = z.infer<typeof PromotionSchema>
export type CartItem = z.infer<typeof CartItemSchema>
/** A cart as handed to pages and actions: never carries the cart token. */
export type Cart = z.output<typeof CartSchema>
export type Pagination = z.infer<typeof PaginationSchema>
export type StoreConfig = z.infer<typeof StoreConfigSchema>
export type Health = z.infer<typeof HealthSchema>

export type ProductListResult = { products: Product[]; pagination: Pagination }
