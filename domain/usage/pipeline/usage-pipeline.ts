import { UsageInput } from "../model/usage.types";
import { CanonicalUsageInterval } from "../model/canonical-usage";
import { runIntervalPipeline } from "./interval-pipeline";
import { runAveragePipeline } from "./average-pipeline";

export function runUsagePipeline(
  input: UsageInput
): CanonicalUsageInterval[] {

  if (input.mode === "INTERVAL") {
    return runIntervalPipeline(input);
  }

  return runAveragePipeline(input);
}
