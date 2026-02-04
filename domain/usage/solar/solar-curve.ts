export type SolarCurve = number[]; // length == 48

export function buildDailySolarCurve(): SolarCurve {
  const curve: SolarCurve = new Array(48).fill(0);

  const sunriseSlot = 12; // 06:00
  const sunsetSlot = 36;  // 18:00
  const peakSlot = 24;    // 12:00

  for (let i = sunriseSlot; i <= sunsetSlot; i++) {
    const distance = Math.abs(i - peakSlot);
    curve[i] = Math.max(
      0,
      1 - distance / (sunsetSlot - peakSlot)
    );
  }

  const total = curve.reduce((a, b) => a + b, 0);

  if (total > 0) {
    for (let i = 0; i < 48; i++) {
      curve[i] = curve[i] / total;
    }
  }

  return curve;
}
