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
