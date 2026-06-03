# MyLegalPrompt

**Understand Any Legal Document in Plain English.**

MyLegalPrompt is a production-ready SaaS application that lets users upload legal
documents (PDF, DOCX, TXT) and instantly receive a plain-English explanation, a
risk score, detected clauses, obligations, deadlines, red flags, and recommended
questions — powered by Claude.

## Features

- **Document upload** — drag & drop with progress, size/type validation, and
  magic-byte sniffing (PDF, DOCX, TXT).
- **AI legal analysis** — executive summary, plain-English translation, key
  clauses, obligations (yours and the other party's), important dates, renewal &
  termination terms, payment requirements, potential risks, red flags, and
  recommended questions.
- **Risk score** — 0–100 score with Low / Moderate / High levels derived from
  termination, liability, auto-renewal, arbitration, indemnification, and
  hidden-fee signals.
- **Clause detection** — non-compete, arbitration, confidentiality, liability,
  indemnification, auto-renewal, cancellation, payment, and termination clauses.
- **Side-by-side view** — original text paired with the plain-English version,
  color-coded by risk (green / yellow / red).
- **Document history** — filename, dates, and risk score; reopen any analysis.
- **Accounts** — email/password and Google sign-in; dashboard with usage and
  subscription.
- **Billing** — Stripe Checkout, billing portal, and plan gating (Free vs Pro).

## Tech stack

| Layer    | Technology |
| -------- | ---------- |
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling  | Tailwind CSS with light/dark design tokens |
| Database | PostgreSQL + Prisma |
| Auth     | Auth.js (NextAuth v5) — credentials + Google, JWT sessions |
| AI       | Anthropic Claude (structured tool output, zod-validated) |
| Payments | Stripe (subscriptions + webhooks) |
| Files    | pdf-parse, mammoth (DOCX), pluggable storage driver |

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#    Fill in DATABASE_URL, AUTH_SECRET, ANTHROPIC_API_KEY, and (optionally)
#    Google OAuth + Stripe keys.

# 3. Set up the database
npm run db:migrate    # or: npm run db:push
npm run db:seed       # optional demo user (demo@mylegalprompt.com / demo1234)

# 4. Run
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start the dev server |
| `npm run build` | Generate Prisma client + production build |
| `npm run start` | Start the production server |
| `npm run typecheck` | Type-check with `tsc` |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |

## Security

- Auth-gated routes via Edge middleware; ownership/RBAC checks on every
  document API.
- Rate limiting on registration, uploads, and sensitive routes.
- Input validation (zod) and file validation (extension + MIME + magic bytes).
- Passwords hashed with bcrypt (cost 12).
- Stripe webhook signature verification.
- Audit logging of security-relevant actions.
- Secrets via environment variables only.

## Plans

| Plan | Price | Analyses / month | Max pages | Extras |
| ---- | ----- | ---------------- | --------- | ------ |
| Free | $0 | 3 | 10 | — |
| Pro | $9.99 | 50 | 100 | Export reports, priority processing |

---

_MyLegalPrompt provides informational summaries, not legal advice. Consult a
licensed attorney for legal decisions._
