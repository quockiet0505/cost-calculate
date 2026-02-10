export type ClimateZone =
  | "HOT"
  | "TEMPERATE"
  | "COLD";

export function postcodeToClimateZone(
  postcode?: string
): ClimateZone {
  if (!postcode) return "TEMPERATE";

  const p = Number(postcode.slice(0, 1));

  if (p === 4 || p === 3) return "HOT";
  if (p === 7) return "COLD";
  if (p === 5 || p === 6) return "COLD";

  return "TEMPERATE";
}
