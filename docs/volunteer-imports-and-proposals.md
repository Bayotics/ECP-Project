# Volunteer imports and event proposals

Admin pages:
- `/admin/volunteers`: unified volunteer table, source filters, sign-ups and delivery retries.
- `/admin/volunteers/import`: CSV mapping, preview, resumable batches, row errors.
- `/admin/volunteers/integrations`: connector key, event mappings, listing links and payload.
- `/admin/proposals`: review queue, notification recipients, approval and draft conversion.

Public pages: `/volunteer`, `/volunteer/preferences`, `/events/propose`.

## Eventbrite: activate Zapier or Make

Verified supported options: Zapier's **New Attendee Registered** instant trigger and Make's **Watch Attendees** / **Watch Attendees in Organization** modules. The Eventbrite API also provides attendee retrieval, but this implementation uses the automation route rather than an undocumented native webhook payload.

1. Create a volunteer-specific ticket class on the external event. Ordinary attendees are not volunteer sign-ups.
2. In the club integration page, add an Eventbrite mapping with the numeric external event ID, club event and numeric volunteer ticket class IDs. Club events must be published and open when registrations arrive.
3. Save and copy the generated connector key into your automation's private connection/header configuration. Only the hash is stored by the club; rotation invalidates the previous key. Do not put it in public listing links or client environment variables.
4. In Zapier, use Eventbrite **New Attendee Registered**, filter to the volunteer ticket classes, then a Webhooks custom POST action. In Make, use **Watch Attendees** and an HTTP JSON POST. Availability and workflow limits depend on the club's chosen automation account.
5. POST to `https://YOUR_CLUB_DOMAIN/api/integrations/volunteers`, with `Content-Type: application/json` and `Authorization: Bearer YOUR_CONNECTOR_KEY`.

```json
{
  "source": "eventbrite",
  "externalEventId": "EVENTBRITE_EVENT_ID",
  "ticketClassId": "VOLUNTEER_TICKET_CLASS_ID",
  "registrationId": "ATTENDEE_ID",
  "name": "ATTENDEE_FULL_NAME",
  "email": "ATTENDEE_EMAIL",
  "phone": ""
}
```

Map the values to actual trigger fields; the example strings are not IDs. If the trigger omits an attendee field, use its attendee lookup/API module to retrieve it rather than guessing. Email must belong to the volunteer, not automatically the order purchaser. `phone`, `interests` and `notes` are optional. Registration IDs must be stable across retries. The endpoint enforces the saved mapping and volunteer ticket class independently of workflow filters.

Responses: 200 saved/already registered; 401 credentials invalid; 400 mapping, event or input invalid; 422 non-volunteer ticket; 409 the same external registration arrived with a different email; 503 temporary failure (retry). A duplicate registration retains its reference and place. A replay does not reactivate an admin-cancelled sign-up. Cancellations/updates on external platforms are not silently inferred from a new-registration trigger; manage them in the club portal.

No external account is automatically connected by deploying this code. Activate and test the workflow in the club's Zapier or Make account. Use a real dedicated volunteer test ticket and confirm the table entry, email and waitlist behavior before enabling a listing.

Sources verified for this implementation:
- https://zapier.com/apps/eventbrite/integrations
- https://apps.make.com/eventbrite
- https://www.eventbrite.com/platform/new/api

## Partiful and other CSV imports

Partiful documents guest-list CSV export, not a verified public registration API. Export only the relevant volunteers, then review/map the CSV in the club portal. Do not import all event attendees as volunteers. Hosts may not receive guest emails in their export; collect actual email through the guest questionnaire where needed. Missing emails are rejected with row errors, never invented.

CSV supports UTF-8 BOM, quoted commas/newlines, escaped quotes and CRLF. Limit 1,000 rows / 2 MB per file. Name (or first name plus optional last name) and email are required. Optional phone, interests, notes and external registration ID can be mapped. Duplicate emails in a file use the first row; subsequent rows are reported/skipped. Across files and sources, normalized email identifies one person. The first source remains in `source`; `sources` records all channels on the person and event sign-up. Existing pre-import website records are backfilled as Website. A CSV import without an event joins the general interest list; choosing an event adds the event sign-up under the same cap and FIFO waitlist allocator used by website registration.

Existing contacts, notes, interests and email opt-outs are preserved. New imports default opportunity emails off. Imports commit each record and its outbox jobs before responding; Next.js `after()` starts delivery without holding up a CSV batch or automation response. Imports queue a welcome once per person, with a private preference link; new event sign-ups also queue their confirmation and staff/lead notices. Row failures do not roll back other saved rows. Resume an interrupted batch, or upload corrected failed rows; saved email/event pairs never reserve duplicate places.

Sources:
- https://help.partiful.com/en-us/articles/15525376-how-can-i-export-my-guest-list
- https://help.partiful.com/en-us/articles/15525420-what-information-can-i-see-about-my-guests

## Links on external listings

The admin integrations page generates source-attributed general and event-preselected links, plus listing text. Paste them into each external listing through the platform's account. This repository cannot edit club-owned Eventbrite/Partiful listings without their account access. Partiful documents a custom-link field, but its ticketing guidance restricts directing guests to external RSVP collection. Confirm the applicable listing policy before publishing a separate volunteer registration link there.

- https://help.partiful.com/en-us/articles/15525371-where-can-i-add-a-link-in-my-event
- https://help.partiful.com/en-us/articles/17223208-how-do-i-sell-tickets-if-i-already-collected-rsvps

## Preference access and email delivery

Private links use random 256-bit tokens with SHA-256 hashes in `volunteerAccessTokens`, a 90-day expiry and TTL cleanup. The raw token travels in the email link's URL fragment, never a query string. The page sends it in a Bearer header to the preferences API, which only exposes contact details, interests and opportunity-email consent. Notes and other volunteers' data are excluded. Invalid/expired links can request a fresh link with reCAPTCHA. Responses do not disclose whether an email is registered; requests have a per-person cooldown. Changing email rejects collisions, retires prior tokens, updates external identity references, and queues a fresh link to the new email. Public registration/import cannot overwrite another person's existing contact details or consent by supplying their email.

Sendridge uses the app's existing `SENDRIDGE_API_KEY`, `EMAIL_FROM`, optional `EMAIL_REPLY_TO`, and `NEXT_PUBLIC_SITE_URL`. Configure the canonical HTTPS site URL before publishing emails or integration endpoints. Existing `RECAPTCHA_SECRET_KEY` and `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` protect public volunteer, preference-link request and proposal forms. No secrets belong in CSV files or public links.

Both volunteer and proposal messages use durable per-recipient outboxes with leases, delivery status and retries. `/api/cron/volunteer-notifications` retries both queues and promotes eligible waitlisted volunteers; configure the existing `CRON_SECRET` and deployed cron schedule. Admins can retry individual volunteer/proposal emails. A successful sign-up is retained when email fails. Like most email outboxes, delivery can repeat if the provider accepts a message immediately before the process crashes before marking it sent; ordinary replay of a completed job is suppressed.

## Proposals

The public form requires name, email, title, description, proposed calendar date and location; estimated USD budget and notes are optional. reCAPTCHA runs before writes. Each client submission carries a stable UUID and content hash so retries return the same reference and do not queue another acknowledgement.

Initial notification recipients resolve active President, Vice President and admin/super-admin accounts; former officeholders are excluded. Admins can save an explicit deduplicated recipient list. Changes affect future submissions; already queued messages retain the intended recipients. Each recipient receives a separate message. Submitter contact details and review notes stay in admin-only APIs.

Review statuses are New, Under review, Approved and Declined. Only an approved proposal can create a draft. Creation and the proposal's draft link commit in the same MongoDB transaction; concurrent/repeated clicks return one event. A unique partial event index on `proposalId` is an additional guard. The event inherits title, proposed date and location; the plain-text description is escaped for the existing HTML event renderer, and defaults to draft with registration disabled. Admins open it in the existing editor to set time, leads, cap, images and registration and publish explicitly. Drafts are excluded from public list/detail APIs.

## Validation

- `npm run test:volunteer-imports`: CSV edge cases, source imports, connector authorization/ticket filtering, proposal validation and CAPTCHA boundary.
- `npm run test:volunteers`, `npm run test:events`, `npm run test:event-summary`: existing regression suites.
- PowerShell: `$env:RUN_VOLUNTEER_DB_TEST='1'; npm run test:volunteers:integration`: real transactions/concurrency in a fresh isolated database, provider mocked; drops only the uniquely named test database afterward. Includes imports, token expiry, recipient resolution, submission retries and concurrent draft conversion.

### Form contrast regression

Run `npm run test:form-contrast` with the local app running. It checks actual rendered labels, headings, helper text, inputs, selects and textareas at a minimum 4.5:1 contrast in light/dark themes at 1366px and 390px, including portalled admin dialogs. It uses an active local admin account for read-only session setup and mocks all browser API writes. Install Playwright in your development environment or set `PLAYWRIGHT_MODULE` to its module directory; `ECP_TEST_URL` optionally overrides localhost:3000. No real form submissions or emails are sent. White form surfaces and the admin portal explicitly retain dark text and a light native-control color scheme regardless of the operating system theme.

## Expanded volunteering and public committees

The public `/committees` page and form options read the existing MongoDB committee records used in the member portal, showing active committee names, descriptions, mandates, types, months and chair names. Private member IDs, biographies and contact links are excluded from the public API. Public browsing does not allow editing committee records. Each committee links to `/volunteer?committee=ID`; event links retain `?event=ID`, and both can be preselected together. The homepage's Committees carousel slide offers a volunteer action, and the public committees page is under Get Involved.

Website sign-up requires first name, last name and email, plus CAPTCHA. Phone, city, ZIP/postal code, committee choices, custom areas of interest, availability and referral information are optional. Multiple committee checkboxes and custom area chips are supported. Email consent is an optional unchecked checkbox. New public sign-ups store that explicit opportunity-email choice; imports continue to default opportunity emails off. Imported full-name rows remain compatible, with optional city, ZIP, availability and referral columns. Existing profile/contact preferences are changed through the private management page, rather than being overwritten by another public submission.

A member can also volunteer. Volunteer email remains unique, and a case-insensitive member email match links the profile to a stable `userId`. A unique partial `userId` index prevents duplicate volunteer profiles when a member's email changes. Linking does not create another member or change portal permissions. The admin table also resolves existing volunteer/member records by ID or email.

Every email sent to a volunteer includes **Manage my volunteering**, using the existing hashed, expiring, no-login access link. The private page edits the expanded profile and offers:
- Pause opportunity emails until a future Philadelphia calendar date, or until manually resumed. Existing event confirmations remain enabled while paused.
- Unsubscribe: status becomes inactive and further volunteer messages are suppressed. Existing event sign-ups remain recorded; they are not cancelled automatically.
- Resubscribe: status becomes active and the person explicitly consents to opportunity emails again.
- Request data deletion: record the dated request, stop volunteer emails and notify the club admins. The request appears in the admin deletion-request filter; it is not an automatic deletion or a deletion of the membership account.

Each actual profile/status/consent change writes a timestamped `volunteerChanges` record and a short confirmation in the same MongoDB transaction. Repeated unchanged actions do not queue duplicate confirmations. Confirmation emails for requested management changes and explicitly requested private access links can be sent while inactive; ordinary welcome, signup and opportunity messages are checked against current consent/status at send time and suppressed when necessary. Consent changes record the choice and its timestamp. Scheduled resume is idempotent and audited. The existing daily notification worker runs at 08:40 UTC, which is on the intended Philadelphia calendar day in both summer and winter; private-page reads, admin reads/exports and email delivery also check due resumes.

Admin volunteers can be searched and filtered by committee, event, volunteer status, event sign-up status, source and deletion request. The CSV download streams all matching records, not just the visible page, with linked member ID, structured contact/profile fields, consent, committees, status, source, event sign-ups and timestamps. CSV cells are quoted and protected against spreadsheet formula execution. Recent activity appears in volunteer details; the underlying audit collection retains the full history.

Validation: `npm run test:volunteer-management` covers structured profile validation, public committee projections, private management, consent, unsubscribe/pause behavior, audit records, CSV safety and access controls. The isolated MongoDB integration suite also verifies member linking across email changes, concurrent unsubscribe/resume, suppression of queued mail, deletion requests and the actual streaming CSV lookup pipeline. Browser checks mock all submissions and emails; contrast checks cover desktop/mobile in light and dark themes.


## One-click committee membership

`/committees`, `/member/committees`, member profiles and private volunteer profiles share the same Join/Leave controls. Active committees accept immediate self-service joins; approval requests are retired. Existing members can also leave a closed committee. “Pick at least one” is guidance: people can join several committees or leave their final committee.

Members use their live login. Volunteers without a login request a CAPTCHA-protected email link; opening it confirms their email and joins the selected committee. Existing private volunteering links also verify committee access. A hashed, expiring token backs an HttpOnly, SameSite=Lax cookie (Secure in production), remembered on that browser for up to 30 days, bounded by the token’s 90-day expiry. Expired links or another browser require email verification again. The raw link token is carried in a URL fragment and removed from the committee URL after exchange. An explicit private volunteer link takes priority over another member’s login on the same browser. State-changing requests reject cross-site origins; IDs and roles are derived from the authenticated identity.

Committee membership is distinct from unverified committee interests collected on the public signup form. Member/volunteer IDs resolve to the same committee place. The existing committee roster remains the membership source for the member/admin portal. Current state is also saved in `committeeMemberships`; each real Join/Leave appends an immutable `committeeMembershipChanges` row with date, status and role. Self-joins receive Member or Volunteer, never a leadership role. Repeated/concurrent requests do not create duplicate places, changes or mail. Existing roles are retained on departures.

Changes and per-recipient `committeeMessages` outbox entries commit in one MongoDB transaction. Confirmation goes to the person and notice to linked chair/vice-chair emails; where no lead email exists, active club admins receive the notice. No private volunteer link is included in lead notices. Every volunteer confirmation includes Manage my volunteering. Requested membership-change confirmations are transactional, even if the person opted out of opportunity emails. Provider failures preserve the change and retry from the existing notification cron; queued messages to an outdated contact address are suppressed.

Validation: PowerShell `$env:RUN_COMMITTEE_DB_TEST='1'; npm run test:committees:integration` exercises real transactions, concurrent joins, identity/role protections, CAPTCHA/email verification, cookie and token expiry, member/volunteer linking, dated roles, closed committees, rollback and email retry in a uniquely named disposable database. Email delivery is always mocked. `node scripts/check-committee-memberships.mjs` exercises the browser journeys with all API writes mocked; set `PLAYWRIGHT_MODULE` when Playwright is provided outside the repository.
