# EchoFind

EchoFind is a lost-and-found web app built with Next.js, Auth.js, Prisma, and PostgreSQL. People can report lost or found belongings, browse reports, and get help reconnecting items with their owners.

## Requirements

- Node.js 20 or newer
- npm
- A PostgreSQL database

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the values. Keep real credentials out of Git.

3. Generate the Prisma client and apply the included database migrations:

   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

   For local schema development, use `npx prisma migrate dev` instead. If your database provider supplies pooled and direct connection strings, use the direct connection string when running migrations.

4. Start the development server:

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Secret used by Auth.js |
| `NEXTAUTH_URL` | Yes | App URL, such as `http://localhost:3000` |
| `AUTH_TRUST_HOST` | Self-hosted production | Set to `true` when deployed behind a trusted proxy; Vercel sets this automatically |
| `ADMIN_EMAIL` | Yes | Email address assigned the initial admin role |
| `IMAGEKIT_PRIVATE_KEY` | For image uploads | ImageKit private API key; keep it server-side and never expose it as a `NEXT_PUBLIC_` variable |
| `IMAGEKIT_URL_ENDPOINT` | For ImageKit images | ImageKit URL endpoint, such as `https://ik.imagekit.io/your_imagekit_id` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | No | Google sign-in credentials |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | No | GitHub sign-in credentials |
| `AUTH_FACEBOOK_ID` / `AUTH_FACEBOOK_SECRET` | No | Facebook sign-in credentials |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | No | SMTP settings for password-reset email |
| `SMTP_FROM` | No | Sender address for email; defaults to `SMTP_USER` |

## Useful commands

```bash
npm run dev       # Start the development server
npm run lint      # Run ESLint
npm run build     # Create a production build
npm start         # Serve the production build
```

## Deployment notes

Configure the environment variables and PostgreSQL database in your hosting provider, then run `npx prisma migrate deploy` as part of deployment.

### ImageKit setup

1. Create an ImageKit account and open its developer/API key settings.
2. Copy the current **private key** into `IMAGEKIT_PRIVATE_KEY` in `.env.local` (and your hosting provider's server environment). It should start with `private_` and must come from the same ImageKit account as the URL endpoint. Never commit it or expose it in a `NEXT_PUBLIC_` variable.
3. Copy the complete URL endpoint from that ImageKit account into `IMAGEKIT_URL_ENDPOINT`, replacing the example `your_imagekit_id` value. The endpoint looks like `https://ik.imagekit.io/<your_imagekit_id>`.
4. Restart the development server or redeploy so Next.js picks up the endpoint. New report photos will upload to the ImageKit `/reports` folder.

Image uploads require `IMAGEKIT_PRIVATE_KEY`; without it, the upload endpoint returns a configuration error. Existing reports that reference files under `/uploads/reports` continue to use those legacy local files.

### Authentication

The original landing page (`/`) is public. Workspace pages and APIs require a signed-in account; visitors are redirected to `/login`, can create an account at `/register`, and are returned to the requested page after signing in. Password-reset pages and Auth.js/signup endpoints remain public so account access can be restored or created.

## Project structure

- `app/` — pages, components, and API routes
- `lib/` — shared server-side utilities
- `prisma/` — database schema and migrations
- `public/` — static assets
