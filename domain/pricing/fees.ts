export function calculateFees({
  plan,
  baseTotal,
  months = 12,
}: any) {
  let total = 0;

  // iterate fees
  for (const f of plan.fees || []) {

    // calculate fee based on term
    if (f.term === "FIXED") {
      total += f.amount || 0;
    }
    if (f.term === "DAILY") {
      total += (f.amount || 0) * 365;
    }
    if (f.term === "MONTHLY") {
      total += (f.amount || 0) * months;
    }
    if (f.term === "PERCENT_OF_BILL") {
      total += baseTotal * (f.rate || 0);
    }
  }

  return total;
}
