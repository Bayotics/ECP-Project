import { nanoid } from "nanoid";
import type { Filter } from "mongodb";
import type { Cart, CartItem } from "@/lib/models";
import { getCollection, serializeDocument } from "@/lib/server/collections";

interface CartOwner {
  userId?: string;
  sessionId?: string;
}

function now(): string {
  return new Date().toISOString();
}

export function calculateCartShipping(subtotal: number): number {
  if (subtotal === 0) return 0;
  if (subtotal >= 15000) return 0;
  return 1500;
}

function normalizeCartItems(items: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();

  for (const item of items) {
    if (!item?.productId || item.quantity <= 0) continue;
    const existing = map.get(item.productId);
    if (existing) {
      map.set(item.productId, {
        ...existing,
        ...item,
        quantity: existing.quantity + item.quantity,
      });
      continue;
    }

    map.set(item.productId, {
      productId: item.productId,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      quantity: item.quantity,
      slug: item.slug,
    });
  }

  return [...map.values()];
}

function buildCart(owner: CartOwner, items: CartItem[], existing?: Cart | null): Cart {
  const normalizedItems = normalizeCartItems(items);
  const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = calculateCartShipping(subtotal);
  const timestamp = now();

  return {
    id: existing?.id ?? nanoid(),
    userId: owner.userId,
    sessionId: owner.sessionId,
    items: normalizedItems,
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function ownerFilter(owner: CartOwner): Filter<Cart> {
  if (owner.userId) return { userId: owner.userId };
  if (owner.sessionId) return { sessionId: owner.sessionId };
  throw new Error("Cart owner is required");
}

export function createEmptyCart(owner?: CartOwner): Cart {
  return buildCart(owner ?? {}, [], null);
}

export async function getCart(owner: CartOwner): Promise<Cart | null> {
  if (!owner.userId && !owner.sessionId) return null;
  const collection = await getCollection("carts");
  return serializeDocument(await collection.findOne(ownerFilter(owner)));
}

export async function saveCart(owner: CartOwner, items: CartItem[]): Promise<Cart> {
  const collection = await getCollection("carts");
  const existing = await getCart(owner);
  const cart = buildCart(owner, items, existing);

  await collection.updateOne(
    ownerFilter(owner),
    { $set: cart },
    { upsert: true }
  );

  return cart;
}

export async function clearCart(owner: CartOwner): Promise<void> {
  if (!owner.userId && !owner.sessionId) return;
  const collection = await getCollection("carts");
  await collection.deleteOne(ownerFilter(owner));
}

export async function mergeAnonymousCartIntoUser(sessionId: string | null, userId: string): Promise<Cart | null> {
  if (!sessionId) return getCart({ userId });

  const [guestCart, userCart] = await Promise.all([
    getCart({ sessionId }),
    getCart({ userId }),
  ]);

  if (!guestCart) return userCart;

  const merged = await saveCart({ userId }, [...(userCart?.items ?? []), ...guestCart.items]);
  await clearCart({ sessionId });
  return merged;
}
