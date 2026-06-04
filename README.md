# ECP Platform

This is the Eko Club Philadelphia site built with Next.js, Tailwind CSS, Framer Motion, and MongoDB-backed API routes.

## Getting started

1. Install dependencies:

	```bash
	npm install
	```

2. Copy [.env.example](.env.example) to `.env.local` and set your MongoDB values:

	```bash
	MONGODB_URI=your-mongodb-uri
	MONGODB_DB=ecp_platform
	MONGODB_SEED_TOKEN=your-seed-token
	NEXT_PUBLIC_API_URL=http://localhost:3000/api
	NEXT_PUBLIC_SITE_URL=http://localhost:3000
	NEXT_PUBLIC_APP_NAME=ECP Platform
	```

3. Start the app:

	```bash
	npm run dev
	```

4. Open [http://localhost:3000](http://localhost:3000).

## MongoDB backend

MongoDB integration now includes:

- a shared connection layer in [lib/server/mongodb.ts](lib/server/mongodb.ts)
- typed collection helpers and indexes in [lib/server/collections.ts](lib/server/collections.ts)
- health check route at [app/api/health/route.ts](app/api/health/route.ts)
- seed route at [app/api/admin/seed/route.ts](app/api/admin/seed/route.ts)
- CRUD routes for events, news, and membership applications:
  - [app/api/events/route.ts](app/api/events/route.ts)
  - [app/api/events/[id]/route.ts](app/api/events/[id]/route.ts)
  - [app/api/news/route.ts](app/api/news/route.ts)
  - [app/api/news/[id]/route.ts](app/api/news/[id]/route.ts)
  - [app/api/membership-applications/route.ts](app/api/membership-applications/route.ts)
  - [app/api/membership-applications/[id]/route.ts](app/api/membership-applications/[id]/route.ts)

## Useful API routes

- `GET /api/health` — verify MongoDB connection and collection counts
- `POST /api/admin/seed` — seed MongoDB from the existing app seed data
  - add header `x-seed-token: <MONGODB_SEED_TOKEN>` if `MONGODB_SEED_TOKEN` is set
- `GET|POST /api/events`
- `GET|PATCH|DELETE /api/events/:id`
- `GET|POST /api/news`
- `GET|PATCH|DELETE /api/news/:id`
- `GET|POST /api/membership-applications`
- `GET|PATCH|DELETE /api/membership-applications/:id`

## Next step

The frontend is still reading from local in-browser storage through the existing context providers. The backend foundation is now in place, and the next step is wiring those providers to these API routes.
