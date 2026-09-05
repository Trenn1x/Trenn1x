# Afterlight

[Open the live app](https://afterlight-outage-planner.tverd23.chatgpt.site) · The hosted link currently requires the owner's account. The portable edition below runs independently.

A practical power outage planner built by Thomas Verdier. The app opens directly
on an editable household scenario. It compares a battery's estimated duration
with the intended outage period, estimates water needs, and creates a checklist
that includes the household's selected needs.

## What works

- Household size and 1–14 day scenarios; stored water and explicit extra needs.
- Editable battery capacity, charge, reserve, output limit, efficiency, and idle draw.
- Device presets, custom devices, daily energy accounting, and essentials comparison.
- Battery-energy chart, simultaneous-load warning, and practical next steps.
- Conditional tasks for pets, mobility, refrigerated medicine, and power-dependent care.
- Local progress, contact and destination notes, JSON export/import, and reset.
- Print layout and a single-file offline app that embeds the current plan.
- Responsive layouts, semantic controls, keyboard focus, and reduced-motion support.
- No app accounts, analytics, remote API, database, or third-party runtime dependency.

The hosted service can apply its own access controls. All plan inputs are stored
in browser localStorage and exported files; they are not posted to an app server.

## Run or host

`dist/` is the authored static site. It can be served by any static host. Open
`dist/afterlight-offline.html` directly in a modern desktop browser for the portable
edition. On iPhone, the hosted app and its Print/PDF flow are the intended path;
local HTML file handling differs between mobile browsers and file viewers.

After changing `dist/index.html`, `styles.css`, `model.js`, or `app.js`, rebuild the
portable edition and run the focused checks:

```sh
python3 tools/build-portable.py
node --test tests/*.test.cjs
```

The portable builder only combines already-authored static assets; it does not
require npm, a framework, a network connection, or installation.

## Calculation model

For every active device, output Wh/day = watts × hours/day × quantity.
Battery Wh/day = total output Wh/day ÷ conversion efficiency + idle watts × 24.
Usable stored Wh = rated Wh × max(0, charge percent − reserve percent) ÷ 100.
Estimated runtime in hours = usable stored Wh ÷ battery Wh/day × 24.

Reserve is a percentage of rated capacity. The curve spreads daily consumption
evenly across time. Idle draw assumes the battery is on 24 hours per day, and is
included only when at least one selected device has positive watts and hours.
With no active load, runtime is undefined and the app does not report success.

The app does not model recharging, appliance starting surges, actual switching
times, equipment compatibility, battery temperature, or degradation. Device
presets and defaults are illustrative, editable assumptions. This is not a
medical-backup validation or an emergency-readiness certification.

Daily water baseline = people + user-entered extra US gallons/day. The CDC baseline
starts at one gallon per person per day, with at least a three-day supply. A
shorter calculator scenario does not replace that guidance. Individual needs,
heat, illness, pregnancy, and pets can require more water.

## Sources

Reviewed September 5, 2026. Source links and safety guidance appear in the app and
its printed plan:

- [CDC emergency water supply](https://www.cdc.gov/water-emergency/about/how-to-create-and-store-an-emergency-water-supply.html)
- [FDA food safety during outages](https://www.fda.gov/food/buy-store-serve-safe-food/food-and-water-safety-during-power-outages-and-floods)
- [CDC generator safety](https://www.cdc.gov/natural-disasters/psa-toolkit/use-a-generator-safely.html)
- [Ready.gov power outages](https://www.ready.gov/power-outages)
- [Ready.gov emergency kit](https://www.ready.gov/kit)
- [FDA medical devices in disasters](https://www.fda.gov/medical-devices/emergency-situations-medical-devices/fda-offers-tips-about-medical-devices-and-natural-disasters)
- [Ready.gov pets](https://www.ready.gov/pets)
- [Ready.gov people with disabilities](https://www.ready.gov/people-disabilities)

## Verification

Focused tests cover independent arithmetic examples, partial charge and reserve,
idle losses, zero-load and zero-battery behavior, water extras, output limits,
essential-device comparison, monotonicity, imported-data bounds, unique device
IDs, checklist adaptation, saved-plan round trips, offline dependencies, and
JavaScript syntax. Browser interaction and visual testing are not included in
these checks.

## Files

- `dist/index.html`: hosted entrypoint.
- `dist/styles.css`: shared responsive and print styles.
- `dist/model.js`: pure calculation and plan-validation module.
- `dist/app.js`: interface, local persistence, print, and export/import flows.
- `dist/sw.js`: optional cache for the app's own static resources.
- `dist/afterlight-offline.html`: generated standalone app, tracked for delivery.
- `tools/build-portable.py`: deterministic portable-file assembler.
- `tests/`: focused model and packaging checks.

## Future maintenance

Recheck official guidance before making safety-content changes. Preserve the
plan version when a schema is compatible; add an explicit migration when it is
not. If static caching behavior changes, change the service-worker cache version.
