# ShelfRelay

A working, browser-local MVP for allocating donated household essentials to organization requests. Built by Thomas (Tom) Verdier.

## Run

Serve `dist/` using any static web server. For example: `python -m http.server 8080 --directory dist`. No build or package installation is required. JavaScript modules require HTTP(S), not a file URL.

## Core flow

1. Explore the labeled fictional sample, or start an empty workspace.
2. Record stock lots and organization requests using one of six explicit item/unit definitions.
3. Review a deterministic plan: urgent first, earliest due date next, stable request ID to break ties; eligible stock by earliest use-by date then lot ID.
4. Export packing CSV; confirm the physical handoff to deduct stock and increase fulfillment in one state update.
5. Export a JSON backup. A validated import restores a workspace. The latest dispatch can be reversed if recorded in error.

Plans exclude lots whose use-by date is before the current local date. No substitutions between catalog items or unit conversions occur. A blank use-by date means no date-based exclusion. Numeric limits: 1,000,000 units per entry, 2,000 lots, 2,000 requests, 500 dispatches; import limit 5 MB.

## Scope

This MVP stores data in localStorage and is meant for one coordinator/browser. Storage-event synchronization reduces accidental stale views across tabs, but this is not a transactional multi-user database. No authentication, cloud synchronization, third-party inventory connection, delivery routing, or safety certification is included. Organizations should not store individual beneficiary data. Use only nonperishable household essentials; inspect actual goods and recipient suitability before handoff. The sample names are fictional.

Google Fonts supplies optional web fonts, with system fallbacks. App records are not sent to a server. Hosting receives ordinary web requests.

## Validation

`node --test tests/engine.test.mjs`

## Commercial use

Copyright © 2026 Thomas Verdier. All rights reserved. Public source is provided for evaluation; no production, redistribution, or white-label license is granted by publication. Contact tverdier88@gmail.com about a paid pilot, licensing, source acquisition, or integration. Third-party fonts are subject to their own licenses.
