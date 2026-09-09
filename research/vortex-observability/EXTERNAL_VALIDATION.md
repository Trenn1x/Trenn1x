# External DNS pilot

Thomas Verdier · 9 September 2026 · version 0.3

## What was tested

The completed pilot exercises the conditional peak-ratio algorithm on data
from the Johns Hopkins Turbulence Database (JHTDB), `isotropic1024coarse`.
This is an external input dataset. It is not external peer review or a
validation of the Gaussian vortex assumption.

Eight separated 15³ velocity cutouts at time index 1 were selected by fixed
spatial indices. Both the laboratory velocity and velocity after subtracting
the whole-cutout mean were examined. Three base Gaussian widths, 0.35, 0.5,
and 0.7 native grid spacings, gave 48 assessments. These are correlated
assessments of eight cutouts at one time, not 48 independent experiments.

For each assessment, vector velocity was filtered at widths `(d,d)`,
`(2d,d)` and `(d,2d)`, where the first width is radial and the second axial.
The axes were fixed to the data coordinates. The same central 3³ grid region
was used for all peaks. The largest truncated filter had a six-cell radius,
so no boundary padding contributed to evaluated values. The native reference
was the unfiltered sampled speed maximum on that same region.

The absolute tolerance was set to 0.0001 times the regional reference peak
and the nominal retention target was 0.9. This tolerance is a diagnostic
setting. It is not a proved bound on model mismatch, sampling, or operator
error. The continuous single-vortex theorem therefore gives no coverage
guarantee for these data.

## Results for the small cutouts

| Conditional output | Assessments |
|---|---:|
| Resolved under the single-profile model | 38 |
| Underresolved under that model | 1 |
| Model inconsistent | 9 |
| Indeterminate | 0 |

There were zero cases where a conditional resolved decision coincided with
a regional sampled peak ratio below 0.9, and zero conditional underresolved
decisions with a regional ratio at or above 0.9. The observed ratios ranged
from 0.88863 to 1.01820.

A regional peak ratio above one is possible because a filter imports
velocity from outside the evaluation region. It does not contradict the
contraction inequality for a global maximum. For this reason these numbers
are called regional sampled peak ratios, not continuum peak retention.

The pilot did not reproduce false reassurance. It also does not establish
reliability: the widths are small, the evaluation region is tiny, no isolated
vortex profile was identified, and the true continuum peak is unknown. The
nine model-inconsistent assessments reinforce the need to report model
adequacy separately from fitted scale estimates.

## Wider-filter follow-up on a public 64³ sample

After the first pilot, a public HDF5 mirror provided one 64³ volume at the
same time index. A separately queried 3³ prefix matched JHTDB exactly at
float32 precision and confirmed array order. Provenance includes the pinned
mirror revision, source file metadata, and downloaded-array hash.

Eight nonoverlapping 16³ evaluation regions fill the central 32³ volume.
Each has a 16-cell halo, sufficient for the largest filter. Four base widths
(0.5, 1, 1.5, and 2 cells), two frame conventions, and the eight regions give
64 correlated assessments. This is one source volume, not eight independently
selected vortex events. The tolerance and target are unchanged.

| Conditional output | Assessments |
|---|---:|
| Resolved under the single-profile model | 60 |
| Underresolved under that model | 2 |
| Model inconsistent | 2 |
| Indeterminate | 0 |

Fourteen assessments were called resolved despite a regional sampled peak
ratio below 0.9: three in the laboratory frame and eleven after subtracting
the 64³ volume mean. No underresolved output had a ratio at or above 0.9.
The observed ratio range was 0.68418 to 0.99462. The largest disagreement
had a conditional retention interval of [0.920798, 0.921237] but a regional
sampled ratio of 0.684182, at base width 2 in mean-subtracted region with
zero-based local start `(z,y,x)=(16,16,32)`.

These are out-of-model decision disagreements. They do not contradict the
conditional theorem, whose continuous single-vortex and error-budget
hypotheses were not established. They also do not identify the two-component
hidden-core mechanism in DNS or give its frequency. Background, profile,
sampled-operator, and finite-region effects have not been separated.

## Field-of-view sensitivity check

A follow-up check, added after seeing those disagreements, used the entire
central 32³ region. All eight conditional outputs were resolved; one had a
regional ratio below 0.9. That case used mean subtraction and width 2, with
ratio 0.880466 and model interval [0.903977, 0.904363]. The laboratory-frame
ratio at width 2 was 0.904501 with model interval [0.945896, 0.946228].

The unfiltered maximum for both frame conventions lay on the region boundary
at local index `(31,0,31)`. Sufficient filter halo removes padding error but
does not establish that a region contains a vortex's full peak structure.
This check leaves the field-of-view issue unresolved. A larger event-centered
study with reference convergence is needed before interpreting these results
as actual vortex peak retention.

## Reproduction and provenance

```bash
python acquire_jhtdb.py
python dns_pilot.py
python acquire_public_sample.py
python dns_extended.py
python dns_fov_check.py
```

See `DATA_SOURCES.md`, `data/jhtdb_provenance.json`, `data/dns_pilot.csv`,
`data/dns_pilot_summary.json`, `data/dns_extended.csv`,
`data/dns_extended_summary.json`, and `data/dns_fov_check.csv`. Acquisition receipts include raw-response
and cached-array hashes. Source arrays are re-downloadable and are excluded
from the public source archive.

## Consequence for publication

The analytic hidden-core counterexample remains a demonstrated failure of
an unsupported total-peak interpretation. The DNS pilots show that an unsupported interpretation can also produce
regional decision disagreements, but provide no estimate of the hidden-core
mechanism's prevalence in turbulence. `STUDY_PROTOCOL.md` defines the larger
validation needed before making an empirical reliability claim.
