# Member dues

The member dues page is `/member/dues`; the treasurer's review page is
`/admin/dues`. Both read the same server-calculated coverage and balance.

## Billing policy

- The club rate is **USD 20.00 monthly**, **USD 240.00 yearly**, or **USD 120.00 twice yearly** (`MONTHLY_DUES_CENTS` in `lib/dues.ts`). All calculations use integer cents.
- Members can pay yearly, monthly, or twice yearly (six months per payment).
  Each invoice states the exact covered dates. Payments always cover the
  oldest unpaid period first, including arrears before any advance payment.
- Saved preferences for the superseded twice-monthly option display as twice
  yearly. Existing payment amounts and covered dates are preserved; new
  invoices use the selected monthly, six-month, or yearly coverage.
- New memberships start billing on the first of the month after membership
  approval (`membershipIdIssuedAt`, falling back to `joinedAt`). An administrator
  can set `duesStartDate` to a `YYYY-MM-01` date for an established member's
  opening balance. This field must reflect the real start of their dues.
- Existing genuine annual records cover January through December of their
  recorded year. No paid history is invented. Waived periods count as covered
  but do not increase the cash received total.
- An annual payment covering November 2026–October 2027 first qualifies for
  a warning on **31 January 2028**, if November, December and January remain
  unpaid. A monthly payment covering October 2026, with earlier dues cleared,
  first qualifies on **31 January 2027** if November–January remain unpaid.
- On **31 October**, unpaid August, September and October trigger a warning.
  The rule checks at least three completed months with unpaid dues, including
  partial unpaid months; it does not measure time since the last transaction.
  The current month enters the warning threshold at month-end. The dashboard
  shows the outstanding balance and unpaid periods as soon as they are due.
- Dates and month boundaries use **America/New_York**, the club's timezone,
  including daylight saving time. Warning messages describe possible suspension;
  this feature does not automatically suspend accounts.

## Payment verification

PayPal uses authenticated, server-priced invoices, order ownership, USD and
captured-amount checks, unique capture/order indexes, and atomic settlement.
Create/capture calls carry `PayPal-Request-Id`; a failed capture response can
be recovered by retrieving the bound order. See the official
[PayPal request guidance](https://developer.paypal.com/api/make-api-requests/).

Zelle transfers stay pending until an administrator matches the funds
in the bank account and confirms them in `/admin/dues`. Rejected submissions
return to the member with the treasurer's reason. Unconfirmed transfers never
clear debt. One open invoice per member prevents overlapping payment periods.
Drafts can be discarded before a provider order or transfer has been submitted.
There is no automatic debit or subscription promise. Paystack cannot settle USD
dues and its old dues settlement paths are disabled.

Dues use the same PayPal and Zelle methods as membership. The club-specified Zelle recipient is `ekoclubphiladelphia@gmail.com`, shared in `lib/payment-config.ts`; `NEXT_PUBLIC_ZELLE_EMAIL` can override it for both flows.

Required PayPal configuration: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, and `PAYPAL_BASE_URL`. PayPal is shown with an unavailable message until its credentials are present; Zelle remains available. Every active administrator receives Zelle submission emails, with optional `ADMIN_EMAIL` added to the recipient list. When an administrator confirms, the member receives a confirmation with the updated balance and next unpaid due date.

## Scheduled reminders

`vercel.json` schedules `GET /api/cron/dues-reminders` daily at 04:30 UTC,
which reaches Philadelphia at 23:30 or 00:30 around month-end across DST.
Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically.

Set a long random **CRON_SECRET in the deployment environment**, along with
`SENDRIDGE_API_KEY`, a verified `EMAIL_FROM`, and `NEXT_PUBLIC_SITE_URL`.
Deploy the updated application and cron configuration. Running a local Next.js
server does not activate a Vercel schedule. On another host, configure its
scheduler to call that endpoint daily with the same authorization header.
Never put the secret in a public environment variable or URL query parameter.

The job evaluates the latest completed month (or the last day of the current
month), checks whether the deficit is still present, and emails eligible
members once for that month. `duesReminders` stores unique member/month records,
delivery results and a ten-minute processing lease. Failed sends retry on a
later run; successful sends are skipped. Missing email configuration and failed
deliveries return non-200 responses for scheduler monitoring. An ambiguous
provider timeout or process failure after delivery but before recording success
can result in a duplicate retry; the email provider does not expose an
idempotency key in the current integration.

The job also retries member confirmation emails and administrator transfer alerts
that were not recorded as successfully delivered. These transactional retries
may repeat an administrator's email when another recipient failed.

`/admin/dues` shows failed reminder deliveries. The dashboard warning always
uses the current balance and remains available independently of email delivery.

## Existing data and indexes

The old dues GET fabricated a batch of three paid years and one pending year.
Those exact batches are excluded from every status, history, and PDF response.
The cleanup script archives exact matching rows to `duesPlaceholderArchive`
before deleting the unchanged originals, preserving a real payment that replaced
one of the fabricated rows.

```powershell
node scripts/clean-dues-placeholders.mjs          # read-only preview
node scripts/clean-dues-placeholders.mjs --apply  # archive and remove
```

The first dues write or reminder job runs `ensureCoreIndexes`, replacing the
retired unique `(userId, year)` index with an ordinary lookup index and adding
one-open-invoice, PayPal reference and reminder uniqueness indexes. Roll out all
application instances together so an old instance cannot recreate seeded rows.
The database account needs index creation/removal permissions.

## PDF export and verification

Authenticated members download their own history from `/api/dues/history`.
The response is an actual paginated PDF, with coverage, amounts, status, dates,
references, current balance and confirmed total. Private responses disable
caching. Names are transliterated for the built-in PDF font.

```powershell
npm run test:dues
npm run test:membership
npm run test:social-profiles
npm run build
```

The dues suite covers calendar/year boundaries, the supplied warning examples,
leap years, DST, cent rounding, partial payments, legacy records, placeholder
detection, ownership and amount checks, duplicate settlement requests, reminder
retry/deduplication, and PDF pagination. External payment and email providers
are mocked in these tests: no live charges or member emails are sent.
