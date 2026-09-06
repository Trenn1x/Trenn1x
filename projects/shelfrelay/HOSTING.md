# ShelfRelay hosting

The static app is ready for a dedicated public host. No server, database, or secret is required.

## Netlify

Connect the repository Trenn1x/Trenn1x, use branch main, set the base directory to projects/shelfrelay, leave the build command empty, and publish dist. The project includes netlify.toml. The actual URL must be taken from a successful Netlify deployment; a name is not reserved by these files.

## GitHub Pages

A byte-identical copy of the application is prepared under docs/shelfrelay, alongside the existing XLR8 site. The repository's docs/.nojekyll is already present. Enable Pages from the main branch and /docs folder in repository Settings > Pages. Once GitHub confirms a successful deployment, the expected route is https://trenn1x.github.io/Trenn1x/shelfrelay/ . This document does not claim the route is live.

## Moving a workspace

Browser storage belongs to its origin. To move data from the previous address, export the workspace JSON there and import it at the new address. Retain the export as a backup.
