export type DonationType = "one-time" | "monthly" | "annual";
export type DonationCause =
  | "general"
  | "youth-empowerment"
  | "civic-education"
  | "environmental"
  | "infrastructure"
  | "healthcare"
  | "education";

export type DonationStatus = "pending" | "successful" | "failed" | "refunded";
export type DonationPaymentMethod = "paystack" | "paypal" | "zelle" | "bank-transfer" | "cash";

export interface Donation {
  id: string;
  referenceNumber: string; // e.g. DON-2026-0001
  userId?: string;
  // Donor (denormalized for anonymous donations)
  donorName: string;
  donorEmail: string;
  donorPhone?: string;
  isAnonymous: boolean;
  // Donation details
  amount: number; // in Naira
  type: DonationType;
  cause: DonationCause;
  message?: string;
  // Payment
  paymentMethod?: DonationPaymentMethod;
  paymentReference?: string;
  paystackRef?: string;
  paystackSubscriptionCode?: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  zelleRef?: string;
  status: DonationStatus;
  isRecurring: boolean;
  autoRenew: boolean;
  nextChargeDate?: string;
  // Admin
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  receiptSentAt?: string;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export type CreateDonationInput = Omit<
  Donation,
  "id" | "referenceNumber" | "status" | "createdAt" | "updatedAt"
> & { autoRenew?: boolean };
export type UpdateDonationInput = Partial<Omit<Donation, "id" | "referenceNumber" | "createdAt">>;
