# Hidden vortex cores and false confidence in measurement resolution

**Thomas Verdier · Technical note and reproducible benchmark · v0.3.0 · 9 September 2026**

Three precise Gaussian-filtered peak measurements can support approximately
**98% inferred retention under a single-vortex model while the actual
combined flow retains only 32.7% of its peak**. The manuscript proves an
explicit broad-plus-narrow counterexample and identifies the scope of a
conditional resolution certificate.

The analytic benchmark also gives exact Gaussian convolution, fixed-kernel
disappearance for a concentrating solenoidal vortex, and a singular
anisotropy-resolution crossover whose two orders of limits differ by 32/27.
Gaussian scale selection has substantial prior literature; the note makes
no claim that this general mechanism or width recovery is new.

[Read the manuscript](output/Finite_Resolution_Vortices.pdf) ·
[Download the research package](output/Finite_Resolution_Research_Package.zip) ·
[Read the internal review](REVIEW.md) ·
[Inspect external DNS results](EXTERNAL_VALIDATION.md)

![A broad vortex controls the measured signal while a narrow component controls the actual peak.](figures/04_hidden_core.png)

## What has been checked

- Exact proofs and conditional scope in `manuscript.md`; an internal audit in `REVIEW.md`.
- Independent quadrature, sampled convolution, 24 high-precision maximum checks,
  224 noise-corner checks, and 5,000 bounded-noise synthetic trials.
- An initial external DNS pilot: 48 correlated assessments on eight small
  cutouts, with no regional false reassurance at the tested widths.
- A wider-filter follow-up: 64 correlated assessments on eight regions in one
  64³ volume, with 14 model/data disagreements at a 90% target. The largest
  paired about 92% inferred model retention with a 68% regional sampled ratio.
- A field-of-view check: one disagreement remained in eight assessments on the
  combined region; its reference maximum lay at the region boundary.

The DNS comparisons are exploratory. They do not establish a Gaussian vortex
profile, a continuum peak, a total error bound, or the prevalence of hidden
cores. Read the definitions and limitations in `EXTERNAL_VALIDATION.md`.

This is a **kinematic measurement benchmark**. Its prescribed concentrating
vortex is not a smooth-force Navier-Stokes blowup construction. The conditional
connection to reported energy and growth estimates is stated separately in
Proposition 7. No external referee, formal proof checker, journal acceptance,
or DOI is claimed. Codex assistance is disclosed in the manuscript.

## Reproduce the analytic and synthetic results

```bash
python -m pip install -r requirements.txt
python reproduce.py
python review_audit.py
```

These computations require no network or external dataset. They regenerate
CSV/JSON results and the first four figures. The hidden-core failure is
intentional and outside the single-profile hypothesis.

## Reproduce the external pilots

```bash
python acquire_jhtdb.py
python dns_pilot.py
python acquire_public_sample.py
python dns_extended.py
python dns_fov_check.py
```

Acquisition requires network access. The first downloader uses JHTDB's
public testing identifier within its documented per-request limit. The
second reads a pinned public HDF5 subset through checked HTTP byte ranges,
then cross-checks a small prefix against JHTDB. See `DATA_SOURCES.md` for
provenance and hashes. Source velocity arrays are cached locally, excluded
from this archive, and not relicensed by this package.

## Build and cite

```bash
python build_paper.py
# Optional editable LaTeX regeneration; requires Pandoc:
pandoc manuscript.md --standalone -o manuscript.tex
python package_release.py
```

The PDF uses ReportLab, Matplotlib equation images, and bundled DejaVu fonts.
The complete mathematical source remains available in Markdown and LaTeX.
`MANIFEST.json` records the archived files and SHA-256 hashes.

Cite Thomas Verdier, *Hidden vortex cores and false confidence in measurement
resolution*, technical note and benchmark, version 0.3.0 (2026), with this
repository URL and the commit used. Machine-readable metadata is in
`CITATION.cff`. `.zenodo.json` prepares archive metadata; its presence does
not mean a Zenodo deposit or DOI exists.

Original code and documentation: MIT. Manuscript and original figures are
also available under CC BY 4.0. External source material is excluded; see
`LICENSE` and `DATA_SOURCES.md`.

## Using the conditional certificate

`resolution_certificate` assumes a known single Gaussian vortex profile and
valid absolute error bounds on three spatial peak observations. Widths are
Gaussian standard deviations, not mesh sizes. Velocity is filtered before
taking its Euclidean speed maximum. The output includes
`scope="conditional_single_vortex_model"`.

The code uses exact rational comparisons and verified outward rounding to
enclose supplied inputs. That arithmetic does not certify upstream data or
model adequacy. Unknown model, sampling, filtering, field-of-view, and
background errors must not be silently replaced by a small numerical tolerance.
A positive output does not exclude an unresolved component.

The next empirical study is specified in `STUDY_PROTOCOL.md`.
