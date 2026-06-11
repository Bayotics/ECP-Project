export type DuesPaymentStatus = "paid" | "pending" | "overdue" | "waived";
export type DuesPaymentMethod = "paystack" | "paypal" | "zelle" | "bank-transfer" | "cash";

export interface DuesPayment {
  id: string;
  userId: string;
  year: number;
  amount: number;
  status: DuesPaymentStatus;
  dueDate: string;
  paidDate?: string;
  reference?: string;
  paymentMethod?: DuesPaymentMethod;
  paystackRef?: string;
  paystackSubscriptionCode?: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  zelleRef?: string;
  autoRenew: boolean;
  receiptSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateDuesPaymentInput = Omit<DuesPayment, "id" | "createdAt" | "updatedAt">;
export type UpdateDuesPaymentInput = Partial<Omit<DuesPayment, "id" | "userId" | "year" | "createdAt">>;
