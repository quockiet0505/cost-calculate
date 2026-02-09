// Auto-generated file for Canonical Usage Interval interface
export interface CanonicalUsageInterval {
     // original UTC 
     timestamp_start: string;
     timestamp_end: string;
   
     // energy
     import_kwh: number;
     export_kwh: number;
     controlled_import_kwh: number;
   
     // model 1 addition
     localDate?: string;   // YYYY-MM-DD
     localMonth?: string;  // YYYY-MM
     weekday?: string;     // MON, TUE...
     startTime?: string;   // HH:mm
     endTime?: string;     // HH:mm
   
     quality?: {
       estimated?: boolean;   // filled gap / interpolated
       source?: "INPUT" | "FILLED";
     };
   }
   