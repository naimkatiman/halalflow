# MosRev — Islamic Finance Workflow Engine

Open-source workflow engine for Islamic finance operators, mosques, zakat organizations, NGOs, cooperatives, and Muslim SMEs.

## What it does

MosRev helps teams manage structured approval workflows:

- Mosque expense approvals
- Zakat distribution requests
- Donation acknowledgments
- Invoice and payment approvals
- Cooperative cashflow workflows
- Any multi-step approval process

## MVP Features

| Feature | Status |
|---------|--------|
| Authentication | ✅ |
| Organizations / workspaces | ✅ |
| User roles (owner, admin, member) | ✅ |
| Workflow templates with ordered steps | ✅ |
| Workflow instances (submit, track) | ✅ |
| Step-by-step approvals (approve/reject) | ✅ |
| Status tracking | ✅ |
| Audit logs | ✅ |
| Comments per workflow | ✅ |
| Dashboard | ✅ |
| Settings + member invite | ✅ |

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4**
- **Prisma 6 + PostgreSQL** with row-level security (RLS)
- **iron-session** for auth
- **@phosphor-icons/react** for icons

## Getting Started

MosRev expects PostgreSQL locally and in production. Copy `.env.example`, create a local Postgres database, provision the two RLS roles from `prisma/rls-roles.sql`, then run migrations.

```bash
npm install
cp .env.example .env          # set DATABASE_URL, DATABASE_URL_ADMIN, DIRECT_URL, SESSION_SECRET
npm run db:migrate             # run migrations through DIRECT_URL
npm run db:seed                # optional: seed demo data
npm run dev
```

See [docs/deployment.md](docs/deployment.md) for the full Postgres + RLS setup guide.

Open [http://localhost:3000](http://localhost:3000).

Demo credentials: `admin@halalflow.app` / `changeme123`

## Demo mode

Set `DEMO_MODE="true"` to run the full billing lifecycle — trial countdown, reminder
emails, paywall, checkout, subscription, win-back — without Stripe or Resend keys.
Billing is simulated and outgoing emails are captured to an in-app outbox instead of
being sent. Real keys take precedence when set. Presenter runbook and click-path:
[docs/demo-mode.md](docs/demo-mode.md).

## Architecture

```
src/
├── app/
│   ├── dashboard/          # Org overview + recent workflows
│   ├── workflows/          # List, create, approve workflows
│   ├── templates/          # Create/manage workflow templates
│   ├── settings/           # Org settings, member management
│   ├── login/              # Auth pages
│   ├── register/
│   ├── onboarding/         # Create first org
│   └── api/                # REST API routes
│       ├── auth/
│       ├── orgs/
│       ├── templates/
│       └── workflows/
├── components/
│   ├── Navbar.tsx
│   └── ui/
└── lib/
    ├── db.ts               # Prisma app/admin clients + withOrg() RLS transaction helper
    └── session.ts          # iron-session config
```

## Data Model

```
Organization → OrgMember → User
Organization → WorkflowTemplate → TemplateStep
Organization → Workflow → Approval (one per step)
Workflow → Comment
Workflow → AuditLog
```

## Workflow Lifecycle

1. Owner/admin creates a **WorkflowTemplate** with ordered steps
2. Any member submits a **Workflow** from a template
3. Each step generates an **Approval** record (status: pending)
4. Members approve/reject the current step
5. On approval: advances to next step; on final step: status → `approved`
6. On rejection: status → `rejected` immediately

## Self-hosting

Works with any Node.js host that can provide PostgreSQL. For production, configure the three database URLs from `.env.example`:

```env
DATABASE_URL="postgresql://mosrev_app:***@host:5432/mosrev?schema=public"
DATABASE_URL_ADMIN="postgresql://mosrev_admin:***@host:5432/mosrev?schema=public"
DIRECT_URL="postgresql://owner:***@host:5432/mosrev?schema=public"
SESSION_SECRET="your-32-char-secret"
```

Before the first migration, run `prisma/rls-roles.sql` as the database owner/superuser. See [docs/deployment.md](docs/deployment.md) for the production checklist and RLS verification command.

## Roadmap

- [x] Email notifications on approval/rejection
- [x] Multi-org switching
- [x] Workflow template export/import
- [x] Per-step role assignment enforcement
- [x] PDF receipt generation
- [ ] Hosted SaaS (cloud.halalflow.app)

## License

MIT — free to use, self-host, and modify.
