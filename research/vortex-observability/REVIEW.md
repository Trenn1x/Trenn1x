# Further review and publication assessment

**9 September 2026 — internal review of version 0.1; revisions incorporated in version 0.2.**

The requested further review is complete. This is an internal mathematical,
literature, and implementation audit, not independent human peer review.
The numerical cross-checks use independent methods; they do not constitute
an independent referee's assessment or a formal proof.

## Publication judgment

**Develop this as a reproducible technical note on measurement limits.**
The analytic Gaussian benchmark survives review. Its particular 32/27
crossover is correct, but its underlying filtering and scale-selection
mechanisms are established mathematics. The strongest practical result is
the explicit hidden-core example: an apparently reassuring 98% model
retention estimate can coexist with only 32.7% retention of the actual peak.

Version 0.2 is suitable for author review as a clearly scoped technical
preprint. I would not present it as a new Navier–Stokes theorem or as a
validated general-purpose vortex diagnostic. The current evidence does not
support a strong journal-novelty claim based on the 32/27 constant alone.
This is an editorial assessment, not a prediction of acceptance.

The internal review identified two consequential revisions: make the
profile condition operationally explicit, and repair arithmetic enclosures.
Both are implemented. The full-flow question now has a precise answer:
an elementary necessary resolution bound transfers conditionally; the
Gaussian coefficient and absolute disappearance law do not follow.

## Findings and disposition

| Claim or implementation | Review result | Revision or evidence |
|---|---|---|
| Divergence-free field, peak and energy | Analytically correct | Rechecked normalization and cylindrical integrals |
| Compatibility with smooth-force dynamics | The benchmark requires singular forcing | Equation (4a) retains this explicit distinction |
| Gaussian filtering and fixed-kernel disappearance | Correct for the stated family | Gaussian derivative calculation and Taylor remainder checked |
| Bounded-noise snapshot obstruction | Correct with nonzero noise and no additional trajectory prior | Scope retained; no claim of noiseless noninjectivity |
| Unique measured-peak maximum | Correct | Strict monotonicity of the logarithmic derivative |
| Joint limit and 32/27 ratio | Correct for the stated profile and normalization | Uniform tails justify maximizing after the limit; 24 high-precision cases |
| Radius and retention formulas | Correct as conditional real-arithmetic statements | Endpoint and monotonicity audit |
| Floating-point interval endpoints | Version 0.1 could fail exact enclosure | Replaced unchecked rounding with rational bounds and outward endpoints |
| Use on an arbitrary flow | Unsupported; explicit counterexample | New hidden-core example and prominent scope in the API and manuscript |
| Full-flow application | Limited necessary condition is justified | New Proposition 7; no transfer of the Gaussian crossover asserted |
| Broad novelty claim | Not supported by the reviewed literature | Reframed as a benchmark and methods note |

## The hidden-core finding

Consider two aligned, concentric Gaussian vortices, with parameters
`(a,b,U)=(10,10,1)` and `(0.01,0.01,3)`. The narrow core contributes only
`9.4868e-5` of the broad vortex's L2 norm. Gaussian filters with radial/axial
widths `(1,1)`, `(2,1)` and `(1,2)` produce the following results:

| Quantity | Value |
|---|---:|
| True total peak | 3.001648947 |
| Base measured peak | 0.9802960494 |
| Actual retained fraction | 0.3265858422 |
| Retention inferred under a single-profile assumption | approximately 0.9802960494 |
| Single-profile decision at a 90% target | Resolved |

The failure is not an optimizer artifact. The true peak is at least 3;
the filtered peak is at most the sum of the two exact component peaks.
Therefore actual retention is analytically below 0.327.

There is also a common-data argument: the broad vortex's three peaks,
with errors bounded by `4e-8`, are compatible with both fields because
every filtered hidden-core peak is below `3e-8`. Those data give a
conditional retention interval contained in `[0.98029599,0.98029611]`.
The certificate correctly describes the broad model but cannot certify
the total flow. Even these very small errors do not validate the profile.

This changes the practical interpretation of the paper. A good fit to three
peaks and tiny relative energy error are insufficient grounds for asserting
that the actual maximum velocity is resolved. The original 5,000 trials
tested only the assumed family and could not expose this failure.

## Arithmetic repair and executed validation

With radial observations `27` and `8`, zero errors, width `1`, and
coarsening factor `2`, the exact inferred radius is `sqrt(7/5)`.
An ordinary floating-point implementation can report the same rounded
number at both endpoints; that interval cannot contain the exact radius.
The analytic interval theorem was correct, but version 0.1's code did not
guarantee its claimed arithmetic enclosure.

Version 0.2 converts supplied numbers to exact rationals, bounds the needed
cube roots by rational bisection, verifies outward square-root endpoints
by exact comparisons, and makes retention decisions using rational squares.
The guarantee concerns the supplied inputs. Measurement error and any
upstream numerical error still belong in the error budget. This is a
specialized enclosure implementation, not a general interval library or
formal verification of the whole program.

| Executed check | Result |
|---|---|
| 40 direct convolution quadrature cases | Maximum normalized discrepancy `9.87e-16` |
| Sampled 3D convolution, four grid sizes | Field values agree; finite-grid peak bias remains explicitly reported |
| 24 stationary-point checks with 80-digit Decimal arithmetic | Peak discrepancy at most `2.23e-16`; location discrepancy below `4.0e-8` |
| Two exact rational endpoint cases | Both enclose `sqrt(7/5)` |
| Seven boundary/noise cases and four invalid inputs | Expected outcomes |
| 224 bounded-noise corner cases | No radius or retention coverage failures |
| Original 5,000 trials, rerun after repair | 3,507 underresolved; 525 resolved; 968 indeterminate; no in-model failures |
| Two-component hidden core | Expected out-of-model failure reproduced and independently bounded |

Detailed results are in `data/review_summary.json`, `data/summary.json`, and
the corresponding CSV files. Run `python reproduce.py` and
`python review_audit.py` to regenerate them. Numerical agreement is evidence
about implementation; the manuscript provides the mathematical proofs.

## Closest-literature comparison

The additional search checked full-text passages most relevant to the
novelty question. The following comparison distinguishes overlap from the
specific construction in this manuscript.

| Primary source and passages checked | Established overlap | Consequence for our claim |
|---|---|---|
| [Lindeberg (2013), Sections 3.3 and 5.2](https://link.springer.com/article/10.1007/s10851-012-0378-3) | Anisotropic Gaussian models, exact extrema over scale, sensitivity to nonuniform scaling | Gaussian anisotropic scale optimization is established; our narrow distinction is the chosen vector observable and singular concentration path |
| [Rahgozar, Maciel and Schlatter (2013), Section 3.2.1](https://doi.org/10.1080/14685248.2013.851386), checked in [author-uploaded full text](https://www.researchgate.net/publication/259195554_Spatial_resolution_analysis_of_planar_PIV_measurements_to_characterise_vortices_in_turbulent_flows) | Gaussian approximation of PIV filtering and vortex-resolution effects | Neither Gaussian vortex blurring nor its measurement implications should be described as newly discovered |
| [Deem et al. (2013), full paper](https://www.jstage.jst.go.jp/article/jfst/8/2/8_219/_pdf/-char/en) | Vortex-wandering smoothing and deconvolution | Recovering vortex structure from blurred measurements is an existing research direction |

Earlier contextual references on numerical singularities, Gaussian
discretization, and learned PIV reconstruction remain in the manuscript.
They were not used to assert a head-to-head performance advantage.

Targeted queries included `"vortex" "32/27"`,
`"Gaussian" "32/27" scale`, `"vortex" "Gaussian" "noncommuting" limits`,
and combinations of anisotropy, resolution, and Gaussian scale selection.
No exact prior occurrence of this particular crossover was located.
That negative search result does not establish priority. The defensible
claim is an explicit, independently derived specialization with an auditable
implementation. An exhaustive novelty or citation survey was not performed.

## What carries over to a complete flow

For any family with `||v_tau||_2 <= B` and
`||v_tau||_infinity >= c*tau^(-gamma)`, Cauchy–Schwarz proves that retaining
at least a fraction `rho` of the true peak requires

$$
d^2\eta \leq \frac{B^2\tau^{2\gamma}}{8\pi^{3/2}\rho^2c^2}.
$$

This new proposition in the note is an elementary application of an
established inequality, not a claimed new sharp PDE estimate. It needs no
Gaussian vortex-profile assumption. At fixed widths the retained fraction
necessarily tends to zero; the filtered signal itself need not vanish.

The relevant source statements are [OpenAI's manuscript](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf),
Theorem 3.1(iv), equation (10.21), and Lemma 10.4. Conditional on them,
use `gamma=1/2+h`, `c=e0/2`, and `B=F(1)`. Isotropic width must then satisfy
`delta <= C*tau^((1+2h)/3)`. Source Section 3.6 does not supply uniformity
in `h` for the present joint-limit argument.

Matching concentration exponents does not identify a convolution profile.
To transfer the Gaussian crossover would require control of the complete
rescaled field, its filtered corrections, exterior contribution, and
parameter uniformity. Those hypotheses have not been established here.
This review checked the cited source implications, not the entire claimed
Navier–Stokes proof or its Lean repository.

## Deliverable status at completion of version 0.2

All identified internal corrections are included in manuscript version 0.2,
the code, and the regenerated results. The reproducible package contains
the editable manuscript, generated LaTeX, PDF, review, scripts, data,
figures, dependency versions, and a SHA-256 manifest.

The publication recommendation is a modest, transparent technical note
whose claims match these results. No paper has been posted or submitted,
no external referee has reviewed it, and no third party has been contacted.

## Version 0.3 release addendum

The public release adds two external DNS pilots and a field-of-view
sensitivity check, described in `EXTERNAL_VALIDATION.md`. The original
48-assessment pilot found no regional false reassurance. A wider-filter
64-assessment pilot on one volume found 14 model/data decision disagreements;
one disagreement remained in eight assessments on the combined interior
region. The reference maximum in that combined region was at its boundary.
These are exploratory, correlated, out-of-model measurements, not proof of
hidden-core prevalence or validation of total-peak certificates.

Version 0.3 includes acquisition provenance, source code, release metadata,
and `STUDY_PROTOCOL.md`. The earlier review's statement that no public
release or outreach had occurred records the version 0.2 review stage.
The scientific review remains internal; public availability is not peer review.
