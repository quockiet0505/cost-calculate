export type SolarCurve = number[]; // length == 48

export function buildDailySolarCurve(): SolarCurve {
  const curve: SolarCurve = new Array(48).fill(0);

  const sunriseSlot = 12; // 06:00
  const sunsetSlot = 36;  // 18:00
  const peakSlot = 24;    // 12:00

  // Build a simple curve
  for (let i = sunriseSlot; i <= sunsetSlot; i++) {
    const distance = Math.abs(i - peakSlot);
    curve[i] = Math.max(
      0,
      1 - distance / (sunsetSlot - peakSlot)
    );
  }

  // normalize to total 1.0
  const total = curve.reduce((a, b) => a + b, 0);

  // if total >0, normalize
  if (total > 0) {
    for (let i = 0; i < 48; i++) {
      curve[i] = curve[i] / total;
    }
  }

  return curve;
}


export function solarWeightByMinute(minute: number): number {
  const sunrise = 6 * 60;   // 06:00
  const sunset = 18 * 60;   // 18:00
  const peak = 12 * 60;     // 12:00

  if (minute < sunrise || minute > sunset) return 0;

  const dist = Math.abs(minute - peak);
  const maxDist = sunset - peak;

  return Math.max(0, 1 - dist / maxDist);
}

