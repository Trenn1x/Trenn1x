# XLR8 Workflow Lab

A static project showcase and interactive client-onboarding prototype by Thomas Verdier. The GitHub Pages edition presents the software and its behavior. It contains no purchase flow, paid service offers, lead form, or server integration.

## Publish on GitHub Pages

The ready-to-publish site is in [`/docs`](../../docs). It uses relative URLs, so it works at a GitHub project URL or a custom domain without rebuilding.

1. Open https://github.com/Trenn1x/Trenn1x/settings/pages.
2. Under Build and deployment, select **Deploy from a branch**.
3. Select **main**, then **/docs**, and click **Save**.
4. Wait for GitHub's Pages build to succeed. The expected URL is https://trenn1x.github.io/Trenn1x/ . This is the target URL, not a claim that publication has completed.

The connected GitHub tools can commit files but cannot change the repository's Pages settings. Pages was disabled when this edition was prepared. No domain registration is required. See [GitHub's publishing instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## What is included

- Home: project showcase with the XLR8 visual identity.
- `demo/`: three service templates, seven assigned tasks, approval gates, working-day dates, a welcome draft, and Markdown/CSV exports.
- `walkthrough/`: 55-second captioned animation with the existing energetic electronic score, transcript, and chapter controls. The commercial closing card from the original video is omitted in this project edition.
- Local image, video, CSS, and JavaScript assets. Google Fonts is optional; system font fallbacks are included. There is no dependency on the original site's host.

The demo holds input in tab memory and sends no email or form submissions. It uses deterministic templates, not an AI service. No real client results are claimed.

## Run locally

From the repository root:

```sh
python3 -m http.server 8000 --directory docs
node --test projects/xlr8/tests/engine.test.mjs
```

Open http://localhost:8000/ . Static files need no build or dependency installation. `.nojekyll` serves the authored files directly.

## Hosting scope

GitHub Pages has [restrictions on hosting online businesses and commercial transactions](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits). This edition is a project showcase and working demo. XLR8's separate business website remains at its existing address.

Original project: XLR8 Site, source commit `a4e2e0b02ccbbbebc970b718be07856f63509792`. GitHub Pages adaptation prepared September 5, 2026.
