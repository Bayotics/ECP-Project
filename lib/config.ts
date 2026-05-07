/**
 * Runtime configuration — read once from environment variables.
 * Never expose secrets to the browser; prefix public vars with NEXT_PUBLIC_.
 */

const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME ?? "ECP Platform",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    env: (process.env.NODE_ENV ?? "development") as
      | "development"
      | "test"
      | "production",
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api",
    timeout: 15_000,
  },
  auth: {
    sessionCookieName: "ecp_session",
    tokenExpirySeconds: 60 * 60 * 24 * 7, // 7 days
  },
  features: {
    maintenanceMode: process.env.NEXT_PUBLIC_MAINTENANCE === "true",
    registrationOpen: process.env.NEXT_PUBLIC_REGISTRATION !== "false",
  },
} as const;

export default config;
export type AppConfig = typeof config;
