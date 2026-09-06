# ShelfRelay hosting

The live public app is https://shelfrelay.netlify.app/ . The partnership page is https://shelfrelay.netlify.app/partners.html . No visitor login is required. No server, database, or secret is required for the app.

## Netlify

Published on September 6, 2026 to the existing Netlify project `shelfrelay` (site ID `49385a7c-01de-417b-8fd9-da6926e70618`). Production deployment `6a9d98a218b95afc69837c4b` completed successfully using the app's static files in `dist/`.

This deployment used a source upload; automatic deployment from GitHub is not configured. For future Git-based deployment, connect repository `Trenn1x/Trenn1x`, use branch `main`, set the base directory to `projects/shelfrelay`, leave the build command empty, and publish `dist`. The project includes `netlify.toml`.

## GitHub Pages

A byte-identical copy of the application is prepared under docs/shelfrelay, alongside the existing XLR8 site. The repository's docs/.nojekyll is already present. Enable Pages from the main branch and /docs folder in repository Settings > Pages. Once GitHub confirms a successful deployment, the expected route is https://trenn1x.github.io/Trenn1x/shelfrelay/ . This document does not claim the route is live.

## Moving a workspace

Browser storage belongs to its origin. To move data from the previous address, export the workspace JSON there and import it at the new address. Retain the export as a backup.
