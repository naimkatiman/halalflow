import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import { Hero } from "./Hero";
import { UseCases } from "./UseCases";
import { HowItWorks } from "./HowItWorks";
import { CommunityBand } from "./CommunityBand";
import { MasjidGallery } from "./MasjidGallery";
import { PricingFaq } from "./PricingFaq";
import { CtaBand } from "./CtaBand";

// Resolves the locale once and passes the dictionary down. All children are server
// components, so the dictionary (functions included) crosses no client boundary.
export async function LandingPage() {
  const t = getDictionary(await getLocale());
  return (
    <div className="space-y-14">
      <Hero t={t} />
      <UseCases t={t} />
      <HowItWorks t={t} />
      <CommunityBand t={t} />
      <MasjidGallery t={t} />
      <PricingFaq t={t} />
      <CtaBand t={t} />
    </div>
  );
}
