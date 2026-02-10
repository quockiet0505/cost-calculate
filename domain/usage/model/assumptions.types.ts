import { ClimateZone } from "../../../utils/postcode-climate";

export type UsageProfileType =
  | "HOME_EVENINGS"
  | "HOME_ALL_DAY"
  | "SOLAR"
  | "EV";

export interface ModelAssumptions {
  profileType: UsageProfileType;

  hasSolar: boolean;
  hasEV: boolean;
  hasControlledLoad: boolean;
  workFromHome: boolean;

  postcode?: string;
  climateZone: ClimateZone;

  confidence: number; // 0–1
}
