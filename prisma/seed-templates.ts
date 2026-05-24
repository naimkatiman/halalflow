export interface SeedTemplate {
  name: string;
  description: string;
  steps: { name: string; description: string; order: number }[];
}

export const defaultTemplates: SeedTemplate[] = [
  {
    name: "Mosque Expense Approval",
    description: "Standard approval flow for mosque operational expenses, maintenance, and capital expenditures",
    steps: [
      {
        name: "Request Submission",
        description: "Submit expense request with receipts, quotes, and justification",
        order: 0,
      },
      {
        name: "Treasurer Review",
        description: "Treasurer verifies budget availability, checks documentation, and ensures compliance with spending policies",
        order: 1,
      },
      {
        name: "Chairman Approval",
        description: "Final approval by the mosque chairman or board chair for disbursement authorization",
        order: 2,
      },
    ],
  },
  {
    name: "Zakat Distribution",
    description: "Multi-step workflow for assessing zakat applications and distributing funds to eligible asnaf",
    steps: [
      {
        name: "Application Intake",
        description: "Receive and record applicant details, required documents, and asnaf category",
        order: 0,
      },
      {
        name: "Eligibility Verification",
        description: "Verify applicant eligibility against zakat criteria and conduct home visit if required",
        order: 1,
      },
      {
        name: "Committee Approval",
        description: "Zakat committee reviews verified applications and approves allocation amounts",
        order: 2,
      },
      {
        name: "Distribution",
        description: "Disburse approved funds and record distribution for audit and reporting purposes",
        order: 3,
      },
    ],
  },
  {
    name: "Event Budget",
    description: "Approval workflow for organizing community events, seminars, and fundraising activities",
    steps: [
      {
        name: "Event Proposal",
        description: "Submit event proposal including objectives, target audience, estimated attendance, and preliminary budget",
        order: 0,
      },
      {
        name: "Finance Review",
        description: "Finance team reviews budget breakdown, funding sources, and projected surplus or deficit",
        order: 1,
      },
      {
        name: "Final Approval",
        description: "Board or management gives final sign-off to proceed with event planning and vendor commitments",
        order: 2,
      },
    ],
  },
];
