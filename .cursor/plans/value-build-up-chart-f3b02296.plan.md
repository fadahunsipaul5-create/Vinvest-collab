<!-- f3b02296-0a5f-4eeb-8d70-de36fa6920d8 114107ca-ec9f-4e96-8153-30a8382e4c1f -->
# Add Multiples Chart Under Value Build-up

## Overview

Create a new `MultiplesChart` component that mirrors the provided sketch. It will render directly below `ValueBuildupChart` when the Valuation tab is active. The charts container already scrolls; placing the new component below ensures it appears on scroll.

## Files to Add/Modify

- `sec_frontend/src/components/MultiplesChart.tsx` — New component (controls + bar chart)
- `sec_frontend/src/components/home.tsx` — Render `MultiplesChart` immediately after `ValueBuildupChart` inside the `activeChart === 'valuation'` branch

## Implementation Details

- Controls row:
- Left title: “Multiples” with a pill button labeled “Holistic” (non-functional for now)
- Two compact Selects with default text:
  - Numerator: `default – EV Foundation`
  - Denominator: `default – NOPAT`
- A full-width search input with placeholder: `Search for Companies/Industry to company`
- Chart:
- Recharts `BarChart` with categorical X-axis (tickers) and a single series
- Static mock data (e.g., WMT, COST, TGT, DG) with simple values
- Responsive, same container style as other charts
- Layout:
- Wrap inside a white card-like div with padding and rounded corners (matching existing style)
- Add `className="mt-6"` in `home.tsx` to ensure it appears under `ValueBuildupChart`
- No legend/tooltips required now; keep minimal for clarity

## Notes

- Use existing Tailwind styles present in the project
- Keep logic minimal (static data); hook up real data later

### To-dos

- [ ] Create ValueBuildupChart component with mock data structure
- [ ] Add conditional rendering in home.tsx for activeChart === 'valuation'
- [ ] Apply styling and ensure responsive layout matches existing charts