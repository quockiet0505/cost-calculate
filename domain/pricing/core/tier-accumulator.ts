export type TierPeriod = "P1D" | "P1M" | "P1Y";

// Accumulator for tiered usage tracking
// tracks usage per key 
export class TierAccumulator {
  private usage = new Map<string, number>();

  get(key: string): number {
    return this.usage.get(key) ?? 0;
  }

  add(key: string, value: number) {
    this.usage.set(key, this.get(key) + value);
  }

  // reset usage for a specific key
  reset( key: string) {
    this.usage.delete(key);
  }
}
