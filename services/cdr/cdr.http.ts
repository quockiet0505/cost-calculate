
// fetch plan list
export async function fetchPlanList(
  baseUri: string
): Promise<any> {
  const url = `${baseUri}cds-au/v1/energy/plans`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "x-v": "1",
      "x-min-v": "1",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `fetchPlanList failed (${baseUri}): ${res.status} ${text}`
    );
  }

  return res.json();
}

// fetch plan detail
export async function fetchPlanDetail(
  baseUri: string,
  planId: string,
  retries = 2
): Promise<any> {
  const url = `${baseUri}cds-au/v1/energy/plans/${planId}`;

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "x-v": "3",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 500));
    }
  }
}
