// define CDR base URL
const CDR_BASE = "https://cdr.energymadeeasy.gov.au";

// fetch plan list from CDR
export async function fetchPlanList(retailer: string): Promise<any> {
  const url = `${CDR_BASE}/${retailer}/cds-au/v1/energy/plans`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "x-v": "1",
      "x-min-v": "1",
    },
  });
  if (!res.ok) {
    throw new Error(`fetchPlanList failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  return res.json();
}

// fetch plan detail from CDR
export async function fetchPlanDetail(
  retailer: string,
  planId: string
): Promise<any> {
  const url = `${CDR_BASE}/${retailer}/cds-au/v1/energy/plans/${planId}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "x-v": "3",
    },
  });
  if (!res.ok) {
    throw new Error(`fetchPlanDetail failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  return res.json();
}
