export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "unpaid" | "paid" | "failed" | "refunded";

export type PaymentMethod = "card" | "bank-transfer" | "ussd" | "paystack" | "flutterwave";

export interface OrderItem {
  productId: string;
  productName: string;
  imageUrl?: string;
  price: number; // unit price at time of order
  quantity: number;
  subtotal: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
}

export interface Order {
  id: string;
  orderNumber: string; // human-readable e.g. ECP-2026-0001
  userId?: string;
  // Customer (denormalized for guest orders)
  customerName: string;
  customerEmail: string;
  // Items
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  // Shipping
  shippingAddress?: ShippingAddress;
  // Payment
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  // Status
  status: OrderStatus;
  notes?: string;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export type CreateOrderInput = Omit<
  Order,
  "id" | "orderNumber" | "subtotal" | "total" | "paymentStatus" | "status" | "createdAt" | "updatedAt"
>;
export type UpdateOrderInput = Partial<Omit<Order, "id" | "orderNumber" | "createdAt">>;
