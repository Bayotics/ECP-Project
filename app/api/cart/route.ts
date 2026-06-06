import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import type { CartItem } from "@/lib/models";
import { ensureCoreIndexes } from "@/lib/server/collections";
import { clearCart, createEmptyCart, getCart, saveCart } from "@/lib/server/cart";
import { getCartSessionId, getSessionUser, setCartSessionCookie } from "@/lib/server/session";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function isCartItem(item: CartItem | undefined): item is CartItem {
  return Boolean(
    item &&
      typeof item.productId === "string" &&
      typeof item.name === "string" &&
      typeof item.price === "number" &&
      typeof item.quantity === "number" &&
      typeof item.slug === "string"
  );
}

export async function GET(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const user = await getSessionUser(request);
    const sessionId = getCartSessionId(request);
    const cart = user
      ? await getCart({ userId: user.id })
      : sessionId
        ? await getCart({ sessionId })
        : null;

    return NextResponse.json({ ok: true, data: cart ?? createEmptyCart(user ? { userId: user.id } : undefined) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load cart";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const payload = (await request.json()) as { items?: CartItem[] };
    if (!Array.isArray(payload.items) || !payload.items.every(isCartItem)) {
      return badRequest("A valid cart items array is required");
    }

    const user = await getSessionUser(request);
    const existingSessionId = getCartSessionId(request);
    const sessionId = user ? undefined : existingSessionId ?? nanoid();
    const cart = await saveCart(user ? { userId: user.id } : { sessionId }, payload.items);
    const response = NextResponse.json({ ok: true, data: cart });

    if (!user && sessionId && sessionId !== existingSessionId) {
      setCartSessionCookie(response, sessionId);
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save cart";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const user = await getSessionUser(request);
    const sessionId = getCartSessionId(request);

    if (user) {
      await clearCart({ userId: user.id });
    } else if (sessionId) {
      await clearCart({ sessionId });
    }

    return NextResponse.json({ ok: true, data: createEmptyCart(user ? { userId: user.id } : undefined) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to clear cart";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
