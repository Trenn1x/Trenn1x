# PilotProof

A working MVP by Thomas (Tom) Verdier for scoping and evaluating workflow pilots. It compares paired baseline and pilot runs, keeps quality separate, and exports a buyer-facing results readout.

## Run

Serve `dist/` over HTTP(S), for example `python -m http.server 8080 --directory dist`. There are no runtime dependencies and no build step. JavaScript modules need an HTTP origin.

## Workflow

1. Explore the explicitly fictional sample, then start a new pilot.
2. Define one unit of work, a comparison protocol, a time-reduction target, and the minimum number of paired comparisons.
3. Record the same number of units for each baseline and pilot run. Record working minutes and additional rework separately, plus the quality result for each whole run.
4. Review totals, unit-weighted time, quality coverage, and exclusions. Exclude a comparison with a reason instead of deleting it when preserving context matters.
5. Adjust the separately labeled USD capacity-value scenario. Export CSV, a JSON backup, or a standalone HTML readout. Print the readout to PDF with the browser.

## Calculation

Total time includes rework. Baseline/pilot time per unit = total included minutes / total included matched units. Time reduction = (baseline total - pilot total) / baseline total. Quality compares only included rows where both quality checks are complete; each whole run counts once, even when batch sizes vary. The target verdict also requires the user's minimum comparison count and complete quality checks on all included rows.

Scenario usable hours = observed minutes freed per unit * monthly volume / 60 * usable-share percentage. Estimated capacity value multiplies by hourly value. Monthly net capacity value subtracts recurring cost. Modeled setup recovery divides setup cost by positive monthly net capacity value; otherwise it is not reached. These are assumptions, not realized cash savings or revenue.

## Boundaries

This is a single-coordinator, browser-local tool. Back up workspaces as JSON. Data does not sync between devices or origins and can be lost if browser storage is cleared. It is not an immutable audit trail, electronic signature system, or independently verified record. Comparisons are user-entered and do not establish causality or statistical significance. All included/excluded observations and their notes are included in the report; CSV retains the individual timing fields.

Use non-sensitive project labels. No app analytics or tracking cookies. Google Fonts is optional and falls back to system fonts. Hosting sees ordinary web requests.

Import limits: 5 MB, 2,000 comparisons, valid finite nonnegative timing and cost values, unique comparison IDs, positive baseline total, whole positive unit counts, explicit exclusion reasons. HTML is escaped and spreadsheet formula prefixes are neutralized in CSV exports.

## Verification

`node --test tests/*.test.mjs`

Tests cover rework, weighted comparisons, negative results, missing/degraded quality, exclusions, scenario math, invalid imports, export escaping, and backup roundtrips. JavaScript syntax and local asset references are also checked. No browser interaction QA was performed in this build.

## Hosting and commercial use

Netlify uses the project folder as its base, no build command, and `dist` as the publish directory. Deployment details and confirmed URL are recorded in `HOSTING.md` after publication.

Copyright © 2026 Thomas Verdier. All rights reserved. Public source is provided for evaluation; publication does not grant a production, redistribution, or white-label license. Contact tverdier88@gmail.com about paid evaluations, licensing, or a purchase of the source code and product assets. Third-party fonts retain their own licenses.
