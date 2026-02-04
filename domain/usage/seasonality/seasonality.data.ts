
// Seasonal multipliers by month (1–12)
// v1: hardcoded, phase 3 acceptable
export const SEASONALITY = {
     import: {
       1: 1.05,  // Jan - summer
       2: 1.05,
       3: 1.02,
       4: 1.0,
       5: 0.98,
       6: 0.95,  // winter
       7: 0.95,
       8: 0.96,
       9: 0.98,
       10: 1.0,
       11: 1.02,
       12: 1.04,
     },
   
     export: {
       1: 1.1,   // solar higher in summer
       2: 1.1,
       3: 1.05,
       4: 1.0,
       5: 0.9,
       6: 0.8,   // winter solar low
       7: 0.8,
       8: 0.85,
       9: 0.9,
       10: 1.0,
       11: 1.05,
       12: 1.1,
     },
   
     controlledLoad: {
       1: 0.95,
       2: 0.95,
       3: 1.0,
       4: 1.05,
       5: 1.1,
       6: 1.15,  // hot water winter 
       7: 1.15,
       8: 1.1,
       9: 1.05,
       10: 1.0,
       11: 0.98,
       12: 0.96,
     },
   };
   