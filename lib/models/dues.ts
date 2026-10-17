export type DuesPaymentStatus = "paid" | "pending" | "overdue" | "waived";
export type DuesPaymentMethod = "paystack" | "paypal" | "zelle" | "bank-transfer" | "cash";
export type DuesFrequency = "yearly" | "monthly" | "twice-yearly";

export interface DuesPayment {
  id: string;
  userId: string;
  year: number;
  /** US dollars. */
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
  /** Coverage dates preserve historical partial-month payments, if any. */
  schemaVersion?: 2;
  frequency?: DuesFrequency;
  coverageStart?: string;
  coverageEnd?: string;
  submittedAt?: string;
  transferReference?: string;
  adminsNotifiedAt?: string;
  confirmedBy?: string;
  rejectionReason?: string;
  rejectedAt?: string;
}

export interface DuesSummary {
  frequency: DuesFrequency;
  billingStartsOn: string;
  asOf: string;
  status: "current" | "owing" | "at-risk";
  overdueMonths: string[];
  outstandingCents: number;
  paidThrough: string | null;
  nextPaymentDue: string;
  suspensionWarning: boolean;
  totalPaidCents: number;
  pendingPayment: DuesPayment | null;
  plans: { frequency: DuesFrequency; amountCents: number; coverageStart: string; coverageEnd: string }[];
  catchUp: { amountCents: number; coverageStart: string; coverageEnd: string } | null;
}

export interface DuesReminder {
  id: string;
  userId: string;
  month: string;
  status: "sending" | "sent" | "failed";
  leaseUntil: string;
  attempts: number;
  sentAt?: string;
  error?: string;
}

export type CreateDuesPaymentInput = Omit<DuesPayment, "id" | "createdAt" | "updatedAt">;
export type UpdateDuesPaymentInput = Partial<Omit<DuesPayment, "id" | "userId" | "year" | "createdAt">>;
