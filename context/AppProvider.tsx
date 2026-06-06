"use client";
import React from "react";
import { ToastProvider } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/Toast";
import { AuthProvider } from "./AuthContext";
import { UsersProvider } from "./UsersContext";
import { MembershipProvider } from "./MembershipContext";
import { EventsProvider } from "./EventsContext";
import { RSVPProvider } from "./RSVPContext";
import { NewsProvider } from "./NewsContext";
import { CommitteesProvider } from "./CommitteesContext";
import { ProductsProvider } from "./ProductsContext";
import { OrdersProvider } from "./OrdersContext";
import { DonationsProvider } from "./DonationsContext";
import { CartProvider } from "./CartContext";
import { DocumentsProvider } from "./DocumentsContext";

/**
 * Combined provider tree for the entire ECP app.
 * Wrap around the root layout's children.
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <UsersProvider>
          <MembershipProvider>
            <EventsProvider>
              <RSVPProvider>
                <NewsProvider>
                  <CommitteesProvider>
                    <ProductsProvider>
                      <OrdersProvider>
                        <DonationsProvider>
                          <DocumentsProvider>
                            <CartProvider>
                              {children}
                              <ToastContainer />
                            </CartProvider>
                          </DocumentsProvider>
                        </DonationsProvider>
                      </OrdersProvider>
                    </ProductsProvider>
                  </CommitteesProvider>
                </NewsProvider>
              </RSVPProvider>
            </EventsProvider>
          </MembershipProvider>
        </UsersProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
