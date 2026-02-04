
/**
 * Map CDR timezone to IANA timezone
 * V1: safe defaults for Australia
 */
export function resolvePlanTimeZone(
     cdrTimeZone?: string
   ): string {
     if (!cdrTimeZone || cdrTimeZone === "LOCAL") {
       // Default for Australia retail plans
       return "Australia/Sydney";
     }
   
     // Already valid IANA
     return cdrTimeZone;
   }
   