import { UsageInput } from "../model/usage.types";
import { runUsagePipeline } from "../pipeline/usage-pipeline";

export function simulateUsage(input: UsageInput) {
  return runUsagePipeline(input);
}
