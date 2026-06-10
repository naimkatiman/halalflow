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
- **Prisma 6 + SQLite** (swap for Postgres in production)
- **iron-session** for auth
- **@phosphor-icons/react** for icons

## Getting Started

```bash
npm install
cp .env.example .env          # set DATABASE_URL and SESSION_SECRET
npm run db:migrate             # run migrations
npm run db:seed                # seed demo data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo credentials: `admin@halalflow.app` / `changeme123`

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
    ├── db.ts               # Prisma client
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

Works with any Node.js host. For production, set:

```env
DATABASE_URL="file:./data/prod.db"   # or postgres://...
SESSION_SECRET="your-32-char-secret"
```

## Roadmap

- [x] Email notifications on approval/rejection
- [x] Multi-org switching
- [x] Workflow template export/import
- [x] Per-step role assignment enforcement
- [x] PDF receipt generation
- [ ] Hosted SaaS (cloud.halalflow.app)

## License

MIT — free to use, self-host, and modify.
