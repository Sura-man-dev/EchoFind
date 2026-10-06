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
| `ADMIN_EMAIL` | Yes | Email address assigned the initial admin role |
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

Report image uploads currently write to `public/uploads/reports` on the app server. This is suitable for local development, but many deployment platforms use ephemeral or read-only filesystems. Before deploying image uploads to production, move them to persistent object storage and configure the app to use it.

## Project structure

- `app/` — pages, components, and API routes
- `lib/` — shared server-side utilities
- `prisma/` — database schema and migrations
- `public/` — static assets
