/** All storage keys used by the ECP localStorage backend. */
export const STORAGE_KEYS = {
  USERS: "ecp_users",
  MEMBERSHIP_APPLICATIONS: "ecp_membership_applications",
  EVENTS: "ecp_events",
  RSVPS: "ecp_rsvps",
  NEWS: "ecp_news",
  COMMITTEES: "ecp_committees",
  PRODUCTS: "ecp_products",
  ORDERS: "ecp_orders",
  DONATIONS: "ecp_donations",
  DOCUMENTS: "ecp_documents",
  /** Currently authenticated user id */
  AUTH_USER_ID: "ecp_auth_user_id",
  /** Map of userId → hashed/plain password (simulated auth) */
  USER_PASSWORDS: "ecp_user_passwords",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
