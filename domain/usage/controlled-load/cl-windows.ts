
export interface ControlledLoadWindow {
     startSlot: number; // inclusive
     endSlot: number;   // exclusive
   }
   
   /**
    * Default CL window:
    * 23:00 -> 07:00 (8 hours)
    * Half-hour slots:
    * 23:00 = slot 46
    * 07:00 = slot 14
    */
   export const DEFAULT_CL_WINDOWS: ControlledLoadWindow[] = [
     {
       startSlot: 46, // 23:00
       endSlot: 48,   // midnight
     },
     {
       startSlot: 0,  // midnight
       endSlot: 14,   // 07:00
     },
   ];
   
   /**
    * Check if a half-hour slot is inside CL window
    */
   export function isControlledLoadActive(slot: number): boolean {
     return DEFAULT_CL_WINDOWS.some(
       w => slot >= w.startSlot && slot < w.endSlot
     );
   }
   