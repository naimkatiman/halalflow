/**
 * Public directory queries — the ONLY place in the codebase that reads
 * community data via prismaAdmin. Selects only public-safe fields and always
 * filters published: true (profiles) and active: true (facilities).
 *
 * Public visibility is NOT subscription-gated: community presence is free.
 * Admin processing (bookings, ledger, ramadan management) is what's paywalled.
 */
import { prismaAdmin } from "@/lib/db";

const publicProfileSelect = {
  displayName: true,
  description: true,
  address: true,
  city: true,
  state: true,
  phone: true,
  whatsapp: true,
  photoUrl: true,
  visitorsWelcome: true,
  visitorHours: true,
  dressCode: true,
  tourAvailable: true,
  tourNote: true,
  pantryAvailable: true,
  pantryType: true,
  pantryHours: true,
  pantryNote: true,
  updatedAt: true,
} as const;

export async function getPublishedMosques(filters: { state?: string }) {
  return prismaAdmin.mosqueProfile.findMany({
    where: {
      published: true,
      ...(filters.state && { state: filters.state }),
    },
    select: {
      ...publicProfileSelect,
      org: {
        select: {
          slug: true,
          facilities: {
            where: { active: true },
            select: { id: true, type: true },
          },
          ramadanPrograms: {
            select: { type: true, isFree: true },
          },
        },
      },
    },
    orderBy: { displayName: "asc" },
  });
}

export async function getMosqueBySlug(slug: string) {
  const org = await prismaAdmin.organization.findUnique({
    where: { slug },
    select: {
      slug: true,
      mosqueProfile: { select: { ...publicProfileSelect, published: true } },
      facilities: {
        where: { active: true },
        select: {
          id: true,
          name: true,
          type: true,
          capacity: true,
          description: true,
          photoUrl: true,
          rateKariah: true,
          rateAwam: true,
          deposit: true,
          rateNote: true,
          rules: true,
        },
        orderBy: { name: "asc" },
      },
      ramadanPrograms: {
        select: {
          type: true,
          title: true,
          description: true,
          time: true,
          schedule: true,
          isFree: true,
          sponsorName: true,
          updatedAt: true,
        },
        orderBy: { type: "asc" },
      },
    },
  });
  if (!org?.mosqueProfile?.published) return null;
  return org;
}

export async function getRamadanDirectory(filters: { state?: string }) {
  return prismaAdmin.ramadanProgram.findMany({
    where: {
      org: {
        mosqueProfile: {
          published: true,
          ...(filters.state && { state: filters.state }),
        },
      },
    },
    select: {
      type: true,
      title: true,
      description: true,
      time: true,
      schedule: true,
      isFree: true,
      sponsorName: true,
      org: {
        select: {
          slug: true,
          mosqueProfile: {
            select: { displayName: true, city: true, state: true },
          },
        },
      },
    },
    orderBy: [{ type: "asc" }],
  });
}
