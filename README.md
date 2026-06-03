# ToyX — Community Toy Exchange Platform

A marketplace platform for families to exchange toys within their community.

## Quick Start

```bash
cp .env.example .env     # Fill in your values
npm install
npm run dev              # Development on :3001
```

## Production

```bash
npm run build            # Build client + server
npm start                # Production on :5000
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full production guide.

## Branches

- `main` — Production
- `release-candidate-1` — Staging/QA
- Feature branches off `release-candidate-1`

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind + wouter
- **Backend**: Express + Drizzle ORM + PostgreSQL
- **Auth**: Passport.js (Google OAuth, Facebook OAuth, email/password)
- **Payments**: Paystack
- **Email**: Resend
- **Storage**: Cloudflare R2
- **Monitoring**: Sentry
