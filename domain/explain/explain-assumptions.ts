import { ExplainItem } from "./explain.types";

export function explainAssumptions(
  assumptions?: any
): ExplainItem[] {
  if (!assumptions) return [];

  const explains: ExplainItem[] = [];


  // Profile assumption

  if (assumptions.profileUsed === "home-evenings") {
    explains.push({
      reason: "ASSUMPTION_PROFILE",
      impact: 0,
      message:
        "This estimate assumes most of your electricity usage happens in the evenings.",
    });
  }

  if (assumptions.profileUsed === "home-all-day") {
    explains.push({
      reason: "ASSUMPTION_PROFILE",
      impact: 0,
      message:
        "This estimate assumes high electricity usage during daytime hours.",
    });
  }


  // Climate assumption

  if (assumptions.climateZone === "HOT") {
    explains.push({
      reason: "ASSUMPTION_CLIMATE",
      impact: 0,
      message:
        "Higher summer usage is assumed due to cooling needs in your area.",
    });
  }

  if (assumptions.climateZone === "COLD") {
    explains.push({
      reason: "ASSUMPTION_CLIMATE",
      impact: 0,
      message:
        "Higher winter usage is assumed due to heating needs in your area.",
    });
  }


  // Solar assumption

  if (assumptions.solar === "NONE") {
    explains.push({
      reason: "ASSUMPTION_SOLAR",
      impact: 0,
      message:
        "This estimate assumes no solar system is installed.",
    });
  }


  // Confidence warning

  if (assumptions.confidence === "LOW") {
    explains.push({
      reason: "LOW_CONFIDENCE",
      impact: 0,
      message:
        "This estimate is based on limited information and may vary significantly from your actual bill.",
    });
  }

  return explains;
}
