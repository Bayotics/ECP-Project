# Club assistant

The global chat widget calls the server-only `/api/assistant` endpoint. It uses the OpenAI Responses API with **gpt-5.4-mini**, the model selected for this project. There are no simulated delays, canned question matching, fabricated success states or random failures.

## Activation

Add `OPENAI_API_KEY` to the server environment (`.env.local` in local development). Do not use a `NEXT_PUBLIC_` variable or put the key in chat, source code, browser storage or an admin form. Set the same key privately in the deployment environment. `OPENAI_CHAT_MODEL=gpt-5.4-mini` is optional; that is the default. The model must support the Responses API, strict JSON-schema output and `reasoning.effort: none` if overridden. Restart/reload the development environment if it does not pick up environment changes.

Without a configured key, the interface says the assistant is unavailable and still provides public document downloads and Contact. A configured but invalid key, unavailable model or provider error produces a retryable error; it does not produce a mock answer.

## Sources and answer scope

- Reviewed navigation and club information are in `lib/server/assistant-knowledge.ts`. Dues and application fee amounts come from the same constants used by the application. The public About page and assistant share `lib/content/leadership.ts`, so the published office-holder roster has one source.
- Current public published events, recent published news, active committees and public documents are queried from MongoDB for each question. Event queries include the nearest 60 current/future events and 30 recent past events; lexical retrieval ranks relevant records. The assistant distinguishes an actual event date from the recurring Programs schedule and flags provisional dates. It does not promise exhaustive historical search.
- The constitution download is offered only when the local public PDF exists. Other documents require `access: public` and an attached file on the supported document host. New public documents uploaded in Admin > Documents are picked up automatically. Member-only/admin-only metadata, raw hosted URLs, user records, committee membership lists, RSVPs, volunteer signups, payments and private meeting URLs are not provided to OpenAI.
- Document access is rechecked on every download. Changing a public document to a private access level stops a previously returned download link from working anonymously. List/detail/write document endpoints now enforce access as well; file URLs and sizes from admin uploads are persisted correctly.
- Document **metadata**, not PDF contents, is supplied to the model. The assistant can find and link files but must not quote clauses, summarize unread files or invent eligibility rules. Questions needing unavailable information are directed to the club. General club mission/programs, public leadership, dues options and navigation are available as reviewed knowledge.
- Only public knowledge is used even if a member/admin is signed in. The assistant cannot inspect an account, change a subscription, register someone, confirm a transfer, send an email, approve an application or reinstate access. It directs people to the actual page/control instead.

The prompt requires source-backed answers, uncertainty when unsupported, clarification for ambiguous questions and a polite redirect for unrelated topics. Reference material and conversation history are explicitly untrusted. The model has no tools, general web browsing or arbitrary URL-fetch capability. Generated output is strict JSON containing plain answer text and source IDs. The server validates those IDs and supplies their actual URLs; model-generated links/HTML/unknown references are rejected. The client renders text with React escaping, with separate clickable source/download links, and never uses HTML injection.

Review navigation knowledge alongside route, policy or UI changes. Public committee/event/news edits are live; reviewed static guidance must be updated when the underlying workflow changes. Grounding and source validation reduce errors but are not a semantic guarantee that every model sentence is correct.

## Conversation and request limits

Chat history stays in widget memory until Clear chat or a full page reload. The recent 12 turns (up to 8,000 total characters, 1,200 per turn) are sent with each request. Clear chat cancels a pending request and discards its eventual reply. Questions/history are transmitted to OpenAI; the app does not save chat transcripts to MongoDB or logs. OpenAI is called with `store: false`; this does not make claims about the provider's separate abuse-monitoring/data policies.

Requests are restricted to JSON, same-origin browser use, 20 KB bodies, bounded context, a 1,000-token output ceiling and a 30-second upstream timeout. MongoDB atomic counters work across server instances and expire automatically. They contain HMAC-hashed client identifiers/counts, not raw IPs or message content.

Defaults, adjustable through positive integer server variables:

- `AI_CHAT_PER_MINUTE=6` per client
- `AI_CHAT_PER_DAY=40` per client
- `AI_CHAT_GLOBAL_PER_DAY=500` across all clients

On Vercel, the client identifier uses `x-vercel-forwarded-for`. On another host, configure a trusted reverse proxy to replace `x-forwarded-for`; do not trust a client-supplied header. The global daily cap applies even if an address is spoofed. These are request ceilings, not a dollar-denominated billing cap; set OpenAI project billing limits separately as appropriate. Buckets reset on UTC minute/day boundaries. Provider failures consume an accepted request slot to prevent retry abuse.

## Verification

`RUN_ASSISTANT_DB_TEST=1 npm run test:assistant:integration` uses a uniquely named disposable MongoDB database and mocks every OpenAI/document-host fetch. It checks public retrieval, exclusions, input/origin/body limits, verified links, provider errors, document permissions/upload persistence, access changes, concurrent rate limits, global caps and counter expiration. The test removes its database.

`npm run test:assistant:browser` checks the running local app with all APIs mocked: public download links, follow-up context, escaped input, errors/retry without duplicates, Clear chat during a pending request, offline behavior, keyboard focus, mobile layout and contrast in light/dark browser settings. Set `PLAYWRIGHT_MODULE` when using a workspace-provided Playwright installation.

`RUN_ASSISTANT_LIVE_TEST=1 npm run test:assistant:live` is an explicit opt-in smoke check making five real requests through the running server and its normal quotas. It covers constitution links, dues, volunteering, an unknown financial question and a private-account/prompt-injection request. It is not run without the real key.

Live model checks require the real key to be configured. Mock tests do not establish account/model access or evaluate real generated answers. Live checks should cover club mission/leadership, dues, membership navigation, constitution/public-file downloads, upcoming-event dates, unknown questions, private-account requests and prompt-injection attempts. Never put real member details in test questions.

Official API references: https://developers.openai.com/api/docs/guides/structured-outputs and https://developers.openai.com/api/docs/models/gpt-5.4-mini.
