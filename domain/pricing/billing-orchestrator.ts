/**
 * Billing formula (annual):
 *
 * baseUsage =
 *   supply
 * + usage
 * + controlledLoadUsage
 * + controlledLoadSupply
 * + demand
 * - solarCredits
 *
 * grossTotal =
 *   baseUsage
 * + fees
 *
 * finalTotal =
 *   grossTotal
 * - discounts
 */
export function calculateBillingTotals({
     supply,
     usage,
     controlledLoadUsage,
     controlledLoadSupply,
     demand,
     solar,
     fees,
     discounts,
   }: {
     supply: number;
     usage: number;
     controlledLoadUsage: number;
     controlledLoadSupply: number;
     demand: number;
     solar: number;
     fees: number;
     discounts: number;
   }) {
     const baseUsage =
       supply +
       usage +
       controlledLoadUsage +
       controlledLoadSupply +
       demand -
       solar;
   
     const grossTotal = baseUsage + fees;
     const finalTotal = Math.max(grossTotal - discounts, 0);
   
     return {
       baseUsage,
       grossTotal,
       finalTotal,
     };
   }
   