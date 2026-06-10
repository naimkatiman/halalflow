import { Hero } from "./Hero";
import { UseCases } from "./UseCases";
import { HowItWorks } from "./HowItWorks";
import { PricingFaq } from "./PricingFaq";
import { CtaBand } from "./CtaBand";

export function LandingPage() {
  return (
    <div className="space-y-14">
      <Hero />
      <UseCases />
      <HowItWorks />
      <PricingFaq />
      <CtaBand />
    </div>
  );
}
