// cdr.service.ts
import { CDR_BRANDS } from "./cdr.brands";
import { getEnabledBrands } from "./cdr.enabled";
import { fetchPlanList, fetchPlanDetail } from "./cdr.http";
import { mapCdrPlanToCanonical } from "./cdr.mapper";
import { CanonicalPlan } from "../../domain/plan/plan.model";

// Cache
type CacheEntry<T> = {
  value: T;
  fetchedAt: number;
};

const CACHE_TTL_MS = 60 * 60 * 1000;
const planCache = new Map<string, CacheEntry<CanonicalPlan>>();
const listCache = new Map<string, CacheEntry<any[]>>();

function isFresh(entry?: CacheEntry<any>) {
  return !!entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS;
}

// Geography helper
function isPlanAvailableForPostcode(
  plan: any,
  postcode: string
): boolean {
  const geo = plan.geography;
  if (!geo) return true;

  if (geo.excludedPostcodes?.includes(postcode)) return false;
  if (geo.includedPostcodes?.length)
    return geo.includedPostcodes.includes(postcode);

  return true;
}

// Fetch plan list (1 retailer)
export async function getPlansForRetailer(
  retailerKey: string
): Promise<any[]> {
  const brand = CDR_BRANDS[retailerKey];
  if (!brand) throw new Error(`Unknown retailer: ${retailerKey}`);

  const cached = listCache.get(retailerKey);
  if (isFresh(cached)) return cached!.value;

  const res = await fetchPlanList(brand.baseUri);
  const plans = res.data?.plans ?? [];

  listCache.set(retailerKey, {
    value: plans,
    fetchedAt: Date.now(),
  });

  return plans;
}

// Fetch + canonical 1 plan
export async function getPlan(
  retailerKey: string,
  planId: string
): Promise<CanonicalPlan> {
  const cacheKey = `${retailerKey}:${planId}`;
  const cached = planCache.get(cacheKey);
  if (isFresh(cached)) return cached!.value;

  const brand = CDR_BRANDS[retailerKey];
  if (!brand) throw new Error(`Unknown retailer: ${retailerKey}`);

  const res = await fetchPlanDetail(brand.baseUri, planId);
  const plan = mapCdrPlanToCanonical(res.data);

  planCache.set(cacheKey, {
    value: plan,
    fetchedAt: Date.now(),
  });

  return plan;
}

// Pick best plans for postcode
export async function getBestPlansForPostcode(
  postcode: string,
  limitPerRetailer = 5
): Promise<
  {
    retailer: string;
    planId: string;
    plan: CanonicalPlan;
  }[]
> {
  const brands = getEnabledBrands();

  const retailerTasks = brands.map(async (brand) => {
    try {
      const plans = await getPlansForRetailer(brand.brand);

      const candidates = plans
        .filter(
          (p: any) =>
            p.fuelType === "ELECTRICITY" &&
            isPlanAvailableForPostcode(p, postcode)
        )
        .slice(0, limitPerRetailer);

      console.log(
        `[CDR] ${brand.brand}: total=${plans.length}, picked=${candidates.length}`
      );

      //  PARALLEL fetch plan detail
      const detailed = await Promise.allSettled(
        candidates.map((p) =>
          getPlan(brand.brand, p.planId).then((plan) => ({
            retailer: brand.brand,
            planId: p.planId,
            plan,
          }))
        )
      );

      return detailed
        .filter((r) => r.status === "fulfilled")
        .map((r) => (r as PromiseFulfilledResult<any>).value);
    } catch (err) {
      console.warn(`[CDR] retailer failed: ${brand.brand}`, err);
      return [];
    }
  });

  const results = await Promise.all(retailerTasks);
  return results.flat();
}
