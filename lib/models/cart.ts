export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  slug: string;
}

export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

/* Shipping, in US dollars. Kept here rather than in lib/server so the cart
   and checkout pages can show the threshold without pulling the MongoDB
   driver into the browser bundle.
   TO CONFIRM WITH THE CLUB: placeholders chosen to be sane for US domestic
   shipping, not a policy the club has set. */
export const FREE_SHIPPING_OVER_USD = 75;
export const FLAT_SHIPPING_USD = 8;

export function calculateCartShipping(subtotal: number): number {
  if (subtotal === 0) return 0;
  if (subtotal >= FREE_SHIPPING_OVER_USD) return 0;
  return FLAT_SHIPPING_USD;
}
