# Workflow Templates

HalalFlow ships with pre-built workflow templates that cover common Islamic organizational approval processes. These templates are automatically seeded when you run `npx prisma db seed`.

## Default Templates

### 1. Mosque Expense Approval

A 3-step approval flow designed for mosque operational expenses, maintenance, and capital expenditures.

| Step | Name | Description |
|------|------|-------------|
| 1 | Request Submission | Submit expense request with receipts, quotes, and justification |
| 2 | Treasurer Review | Treasurer verifies budget availability, checks documentation, and ensures compliance with spending policies |
| 3 | Chairman Approval | Final approval by the mosque chairman or board chair for disbursement authorization |

### 2. Zakat Distribution

A 4-step workflow for assessing zakat applications and distributing funds to eligible asnaf.

| Step | Name | Description |
|------|------|-------------|
| 1 | Application Intake | Receive and record applicant details, required documents, and asnaf category |
| 2 | Eligibility Verification | Verify applicant eligibility against zakat criteria and conduct home visit if required |
| 3 | Committee Approval | Zakat committee reviews verified applications and approves allocation amounts |
| 4 | Distribution | Disburse approved funds and record distribution for audit and reporting purposes |

### 3. Event Budget

A 3-step approval workflow for organizing community events, seminars, and fundraising activities.

| Step | Name | Description |
|------|------|-------------|
| 1 | Event Proposal | Submit event proposal including objectives, target audience, estimated attendance, and preliminary budget |
| 2 | Finance Review | Finance team reviews budget breakdown, funding sources, and projected surplus or deficit |
| 3 | Final Approval | Board or management gives final sign-off to proceed with event planning and vendor commitments |

## Legacy Templates

The following templates are also seeded for backward compatibility:

- **Expense Approval** — Standard 2-step approval for operational expenses
- **Zakat Distribution Request** — 3-step workflow for zakat disbursement to beneficiaries
- **Donation Acknowledgment** — Single-step process to acknowledge and receipt donations

## Creating Custom Templates

You can create additional templates from the **Templates** page in the app. Each template requires:

- A unique name
- An optional description
- At least one approval step with a name and optional description

Templates can be exported as JSON and imported into other organizations.
