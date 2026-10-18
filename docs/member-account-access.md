# Member account access

In **Admin → Members**, open a member and use **Portal access** to suspend,
revoke, or reinstate their membership. The confirmation identifies the member
and explains the access change. An optional reason is included in their email.
Administrator accounts cannot be changed through these member controls.

Suspended and revoked members cannot sign in. Every protected API guard and
server-rendered portal layout checks the current database record. Status changes
also increment `sessionVersion`, so old cookies stay invalid even after
reinstatement; the member signs in again using their existing credentials.
Open portal tabs recheck on focus/visibility changes and every 30 seconds, and
clear their authentication immediately when a protected API rejects the session.

Changing status, invalidating sessions, and appending an audit/notification entry
happen atomically in one member-document update. The audit records the previous
and new status, acting administrator, timestamp, and optional member-facing
reason. Private history and session versions are excluded from directory and
profile responses. Direct profile PATCH requests cannot change these fields or
membership status. Re-approving an application cannot reactivate a restricted
account: an administrator must reinstate it explicitly.

Email is attempted immediately through the existing Sendridge configuration.
A failed send never re-enables access: its queue entry persists, and the admin
sees that delivery is pending. Completed notices are not sent again; obsolete
restriction notices are suppressed if the member was subsequently reinstated.
A processing lease prevents concurrent deliveries from claiming the same entry.
An ambiguous provider timeout or failure after delivery but before recording
success can still produce a duplicate email on retry.

`GET /api/cron/account-status-notifications` retries undelivered notices.
`vercel.json` schedules it daily at 04:35 UTC. Deploy that configuration and set
`AUTH_JWT_SECRET`, `CRON_SECRET`, `SENDRIDGE_API_KEY`, `EMAIL_FROM`, and `NEXT_PUBLIC_SITE_URL` on the
host. Other schedulers can call the endpoint with `Authorization: Bearer
<CRON_SECRET>`. No secret belongs in the URL or a public environment variable.

Validation: `npm run test:account-access`, existing dues/membership/profile tests,
TypeScript, targeted lint, and `npm run build`. Provider tests use synthetic
members and mocked email delivery; real memberships are not suspended by tests.
