import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMosqueBySlug } from "@/lib/public-directory";
import { BookingRequestForm } from "./BookingRequestForm";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const org = await getMosqueBySlug(slug);
  if (!org?.mosqueProfile) return { title: "Mohon Tempahan — MosRev" };
  return { title: `Mohon Tempahan — ${org.mosqueProfile.displayName} — MosRev` };
}

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ facility?: string }>;
}) {
  const { slug } = await params;
  const { facility: preselect } = await searchParams;
  const org = await getMosqueBySlug(slug);
  if (!org) notFound();
  return (
    <div className="max-w-screen-md mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700 mb-1">Sewaan Fasiliti</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-emerald-950">Mohon Tempahan</h1>
        <p className="mt-1 text-sm text-zinc-500">{org.mosqueProfile!.displayName}</p>
      </div>
      <BookingRequestForm slug={slug} facilities={org.facilities} preselect={preselect} />
    </div>
  );
}