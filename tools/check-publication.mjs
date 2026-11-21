import { readFileSync } from "node:fs";

const { certifications } = JSON.parse(readFileSync(new URL("../data/certifications.json", import.meta.url), "utf8"));
const active = certifications.filter(c => c.displayOnRoadmap && !c.plannedOnly);
const unknownLifecycle = active.filter(c => /unverified/i.test(c.status || ""));
const missingPrice = active.filter(c => c.priceUSD === null || !Number.isFinite(c.priceUSD));
const provisionalScore = active.filter(c => c.credibilityScore !== null && /provisional|not independently|not a completed/i.test(c.credibilityEvidence || ""));
console.log("Publication readiness — source data checks");
console.log("Active chart credentials: " + active.length);
console.log("Lifecycle unverified: " + unknownLifecycle.length);
console.log("Price unverified: " + missingPrice.length);
console.log("Credibility score provisional: " + provisionalScore.length);
if (unknownLifecycle.length || missingPrice.length || provisionalScore.length) {
  console.error("BLOCK: Do not publish as verified. Complete issuer audit and credibility verification.");
  process.exitCode = 1;
} else {
  console.log("PASS: Data gate passed (visual/browser QA is still required).");
}
