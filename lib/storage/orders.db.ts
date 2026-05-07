import { STORAGE_KEYS } from "./keys";
import {
  getAll, getById, getWhere, createRecord, updateRecord, deleteRecord,
  nanoid, nextSequence, padSequence,
} from "./storage";
import type { Order, CreateOrderInput, UpdateOrderInput } from "../models/order";

const KEY = STORAGE_KEYS.ORDERS;
const COUNTER_KEY = "ecp_order_seq";
const now = () => new Date().toISOString();

function calcTotals(
  items: Order["items"],
  shippingFee = 0,
  discount = 0,
): { subtotal: number; total: number } {
  const subtotal = items.reduce((sum, it) => sum + it.subtotal, 0);
  return { subtotal, total: subtotal + shippingFee - discount };
}

export const ordersDB = {
  getAll: (): Order[] => getAll<Order>(KEY),

  getById: (id: string): Order | null => getById<Order>(KEY, id),

  getByOrderNumber: (orderNumber: string): Order | null =>
    getWhere<Order>(KEY, (o) => o.orderNumber === orderNumber)[0] ?? null,

  getByUser: (userId: string): Order[] =>
    getWhere<Order>(KEY, (o) => o.userId === userId).sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt),
    ),

  getByStatus: (status: Order["status"]): Order[] =>
    getWhere<Order>(KEY, (o) => o.status === status),

  create: (input: CreateOrderInput): Order => {
    const seq = nextSequence(COUNTER_KEY);
    const orderNumber = `ECP-${new Date().getFullYear()}-${padSequence(seq)}`;
    const { subtotal, total } = calcTotals(
      input.items,
      input.shippingFee,
      input.discount,
    );
    return createRecord<Order>(KEY, {
      id: nanoid(),
      orderNumber,
      subtotal,
      total,
      paymentStatus: "unpaid",
      status: "pending",
      createdAt: now(),
      updatedAt: now(),
      ...input,
      // Override computed fields
      shippingFee: input.shippingFee ?? 0,
      discount: input.discount ?? 0,
    });
  },

  update: (id: string, patch: UpdateOrderInput): Order | null =>
    updateRecord<Order>(KEY, id, { ...patch, updatedAt: now() }),

  confirm: (id: string, paymentReference?: string): Order | null =>
    updateRecord<Order>(KEY, id, {
      status: "confirmed",
      paymentStatus: "paid",
      paymentReference,
      confirmedAt: now(),
      updatedAt: now(),
    }),

  ship: (id: string): Order | null =>
    updateRecord<Order>(KEY, id, {
      status: "shipped",
      shippedAt: now(),
      updatedAt: now(),
    }),

  deliver: (id: string): Order | null =>
    updateRecord<Order>(KEY, id, {
      status: "delivered",
      deliveredAt: now(),
      updatedAt: now(),
    }),

  cancel: (id: string): Order | null =>
    updateRecord<Order>(KEY, id, {
      status: "cancelled",
      updatedAt: now(),
    }),

  delete: (id: string): boolean => deleteRecord<Order>(KEY, id),
};
