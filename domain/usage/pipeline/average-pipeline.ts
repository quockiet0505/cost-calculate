import { UsageInput } from "../model/usage.types";
import { CanonicalUsageInterval } from "../model/canonical-usage";

import { loadSyntheticProfile } from "../templates/load-profile";
import { scaleProfileToDailyKwh } from "../synthesize/scale-profile";
import { generateFutureUsage } from "../generators/generate-future";
import { applyHolidayBehaviour } from "../calendar/apply-holiday";
import { applyControlledLoadBehaviour } from "../controlled-load/apply-cl";

import { getLocalParts } from "../../../utils/time";
import { postcodeToClimateZone } from "../../../utils/postcode-climate";
import { SEASONALITY_BY_ZONE } from "../seasonality/seasonality-by-zone";

import {
  ModelAssumptions,
  UsageProfileType,
} from "../model/assumptions.types";

// Profile selection (Model 2 v2)
function selectProfileType(input: UsageInput): UsageProfileType {
  if (input.hasEV) return "EV";
  if (input.hasSolar) return "SOLAR";
  if (input.workFromHome) return "HOME_ALL_DAY";
  return "HOME_EVENINGS";
}

function mapProfileToTemplate(profile: UsageProfileType) {
  switch (profile) {
    case "EV":
      return "ev-household";
    case "SOLAR":
      return "solar-household";
    case "HOME_ALL_DAY":
      return "home-all-day";
    default:
      return "home-evenings";
  }
}

// Average pipeline (MODEL 2 v2)
export function runAveragePipeline(
  input: UsageInput
): CanonicalUsageInterval[] {
  if (!input.averageMonthlyKwh) {
    throw new Error("averageMonthlyKwh is required for AVERAGE mode");
  }

  const timeZone = "Australia/Sydney";
  const intervalMinutes = 30;

  //  Profile selection
  const profileType = selectProfileType(input);
  const templateName = mapProfileToTemplate(profileType);
  let template = loadSyntheticProfile(templateName);

  // Scale profile to DAILY kWh
  const dailyKwh = input.averageMonthlyKwh / 30.42;
  template = scaleProfileToDailyKwh(template, dailyKwh);

  //  Forecast start = next local month
  const now = new Date();
  const { monthKey } = getLocalParts(now, timeZone);
  const [year, month] = monthKey.split("-").map(Number);

  const forecastStart = new Date(
    Date.UTC(year, month + 1, 1, 0, 0, 0)
  );

  //  Generate 12 months
  let future = generateFutureUsage(
    template,
    forecastStart,
    12,
    intervalMinutes
  );

  //  Holiday behaviour
  future = applyHolidayBehaviour(future, template);

  //  Enrich local calendar fields
  future = future.map((item) => {
    const { weekday, time, dateKey, monthKey } = getLocalParts(
      new Date(item.timestamp_start),
      timeZone
    );

    return {
      ...item,
      localDate: dateKey,
      localMonth: monthKey,
      weekday,
      startTime: time,
      endTime: addMinutes(time, intervalMinutes),
    };
  });

  //  Climate-aware seasonality
  const climateZone = postcodeToClimateZone(input.postcode);
  const seasonal = SEASONALITY_BY_ZONE[climateZone];

  future = future.map((item) => {
    if (!item.localMonth) return item;

    const m = Number(item.localMonth.slice(5, 7));

    return {
      ...item,
      import_kwh: item.import_kwh * (seasonal.import[m] ?? 1),
      export_kwh: item.export_kwh * (seasonal.export[m] ?? 1),
      controlled_import_kwh:
        item.controlled_import_kwh *
        (seasonal.controlledLoad[m] ?? 1),
    };
  });

  //  Controlled Load behaviour
  future = applyControlledLoadBehaviour(
    future,
    input.averageMonthlyControlledKwh ?? 0
  );

  // MODEL 2 v2 assumptions 
  const assumptions: ModelAssumptions = {
    profileType,
    hasSolar: !!input.hasSolar,
    hasEV: !!input.hasEV,
    hasControlledLoad: !!input.hasControlledLoad,
    workFromHome: !!input.workFromHome,
    postcode: input.postcode,
    climateZone,
    confidence:
      input.postcode && input.occupants ? 0.75 : 0.6,
  };

  // non-breaking metadata attach
  (future as any).assumptions = assumptions;

  return future;
}

// Utils
function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const t = h * 60 + m + mins;

  return `${Math.floor((t % 1440) / 60)
    .toString()
    .padStart(2, "0")}:${(t % 60)
    .toString()
    .padStart(2, "0")}`;
}
