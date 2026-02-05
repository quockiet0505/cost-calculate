/**
 * @deprecated
 *
 * DO NOT USE FOR BUSINESS LOGIC
 *
 * This function uses UTC hours and is NOT DST-safe.
 * It must NOT be used for:
 * - TOU matching
 * - Controlled Load windows
 * - Demand windows
 *
 * It is temporarily kept to avoid breaking changes.
 * Will be replaced by timezone-aware slot calculation.
 */

export function getHalfHourIndex(date: Date): number{
     const hours = date.getUTCHours();
     const minutes = date.getUTCMinutes();
     return hours * 2 + (minutes >= 30 ? 1 : 0);
}