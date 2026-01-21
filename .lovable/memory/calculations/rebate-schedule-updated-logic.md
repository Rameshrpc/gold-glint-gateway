# Memory: calculations/rebate-schedule-updated-logic
Updated: 2025-01-21

The early loan closure rebate schedule for the 'Interest Adjustment' is:
- Within 1-30 days: 66.67% (2/3) of Interest Adjustment
- Within 30-45 days: 66.67% (2/3) of Interest Adjustment  
- Within 45-60 days: 50% of Interest Adjustment
- Within 60-75 days: 33.33% (1/3) of Interest Adjustment
- After 75 days: 0% (No rebate)

This is implemented in `src/lib/interestCalculations.ts` functions:
- `calculateRebateSchedule()` - Returns the schedule for display
- `calculateRebateAtRedemption()` - Calculates actual rebate based on days since loan

The schedule is displayed in the Loan Form UI and rendered in the 'LoanReceiptPDF' document.
The 'calculateClosureSchedule()' function automatically syncs with this logic since it calls `calculateRebateAtRedemption()`.
