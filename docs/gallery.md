# Gallery

`/gallery` reads `/api/gallery` with no cache or static content fallback. MongoDB collections `galleryAlbums` and `galleryMedia` hold album and media records; new photo files are hosted by Cloudinary using the existing server credentials. Gallery API responses include only published media in published albums. Album/event links are shown only for published, public events that are not members-only.

## Admin workflow

Open **Gallery** in the admin menu (`/admin/gallery`). Create an album, optionally associate it with an existing event, and choose a category and visibility. New albums default to Draft. Select up to 50 photos and click Upload photos. JPEG, PNG, WebP and AVIF are supported, up to **4 MB per file**. Each request contains one photo to fit serverless request limits; three uploads run concurrently. Progress and results are displayed per file. Retry failed uploads without sending successful files again. The browser warns before closing while a batch is running; leaving the page stops remaining uploads.

File size, declared MIME type and actual file signature are validated on the server before Cloudinary decodes the image. Content hashes prevent duplicate files within an album. Deterministic Cloudinary public IDs and `overwrite:false` make an ambiguous upload/metadata failure recoverable without creating another hosted asset. Existing media with the same hash can reuse the hosted photo across albums. A duplicate that was hidden stays hidden.

Use Edit album to publish or return an album to Draft. Select a media card to change its accessible description/title, caption, album, or visibility. Hidden media and Draft albums remain available to admins. Assets are retained when hidden. Editing or moving a photo preserves its original added date.

## Public browsing

Recent photos and films are sorted by `addedAt DESC, id DESC`. This means **newest added**, not an inferred capture date. Public album cards show actual database counts and use the newest visible item as their cover. Category, album and media filters are supported. The recent grid uses stable cursor pagination, and the existing full-screen photograph/video/YouTube viewer is retained. Loading, empty and failure states are distinct; failures offer a retry.

## Existing library migration

Run `npm run migrate:gallery` once per deployment database, with `.env.local` configured. The CLI validates every local asset path and file before inserting. All inserts and a `galleryMigrations` completion marker are committed together in a MongoDB transaction. The migration copies the existing library into 5 published albums / 33 media items; existing local files continue to be served from `public/gallery`, with their URLs supplied by the backend. Local clips and YouTube references are preserved. New media uses Cloudinary.

Executive Council and patron profile portraits are excluded. For databases seeded by the earlier migration, rerunning the CLI applies a one-time correction that hides those 11 legacy portraits and unpublishes their album; profile images used elsewhere are retained.

The initial library migration never overwrites album/media records or guesses event associations or capture dates. Historical items receive the actual migration timestamp as their date added. A second one-time correction removes the 52 items starting with the Lagos ferry terminal / Blue Line / carnival row, covering the legacy Lagos, Adopt-a-Highway, Health Education and Back to School albums. These albums are excluded from fresh imports as well. Their source files remain available to other pages.

After these corrections, rerunning after completion is a no-op, including after admin edits, hidden items or deletions. Public GET requests never seed data. A deployment to another MongoDB database must run the migration explicitly if it needs the existing library.

## Configuration and verification

Use the existing `MONGODB_URI`, optional `MONGODB_DB`, `AUTH_JWT_SECRET`, and `CLOUDINARY_URL` (or the existing separate Cloudinary settings). No secret credentials reach the client. The MongoDB deployment must support transactions, as the other application workflows already require.

- `RUN_GALLERY_DB_TEST=1 npm run test:gallery:integration` exercises real MongoDB transactions in a uniquely named disposable database with Cloudinary mocked. It checks auth, validation, concurrent duplicates, failure recovery, drafts/hidden media, projections, ordering/pagination, filters, moving photos and one-time migration preservation.
- `npm run test:gallery:browser` uses Playwright and the running local app. Set `PLAYWRIGHT_MODULE` if Playwright is supplied by the workspace runtime. It reads an existing active admin only to establish SSR access; all browser API writes and uploads are mocked. It checks public browsing, errors, admin albums, bulk progress/partial failures/retry, editing, and desktop/mobile contrast in light/dark browser settings.

No test uploads photos to the live Cloudinary account or writes test gallery records to the configured application database.
