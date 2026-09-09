# Field-of-view follow-up: frozen analysis plan

Recorded 9 September 2026 before extracting or examining the larger sample.
This is a prospective extension of an already explored DNS snapshot, not a
preregistered independent replication. The archived v0.3.0 stays unchanged.

## Data and fixed comparisons

Acquire the 128-cubed region at zero-based indices [64:192] in each spatial
axis from Velocity_0001 in the same pinned public JHTDB mirror. Validate its
central 64-cubed overlap exactly against the previously acquired array.
Retain the original volume-mean background for the primary mean-subtracted
frame across all region expansions; repeat with the new-volume mean as a
background sensitivity analysis. Also evaluate laboratory velocities.

Use Gaussian standard deviations 0.5, 1, 1.5, and 2 grid cells. Fit the same
three directional filters (w,w,w), (w,2w,2w), and (2w,w,w), in z,y,x order.
Evaluate two held-out isotropic filters, 1.5w and 2w. All filters use identical
physical regions, constant padding, and truncation at six standard deviations.
Compare with four-standard-deviation truncation on those same interior regions.
This comparison quantifies truncation sensitivity, not all operator error.
The existing certificate's absolute tolerance is 0.0001 times native peak;
the decision target remains 90 percent.

## Main boundary check

Center nested regions at (64,64,64) with half-widths 16, 24, and 32 cells.
Report every reference and filtered peak location, distance from its region
boundary, and ratio. A reference is eligible only if the maximum is at least
four cells from all faces and changes by no more than one percent between
the two largest regions. Report original-region failures even if excluded.

## Event selection and abstention

Select native speed maxima (3-cubed neighborhood) with Q>0, using centered
finite differences and Q=(||Omega||^2-||S||^2)/2. Keep candidates with at least
44 cells to the full-volume boundary. Sort by descending speed then by z,y,x;
greedily retain centers separated by at least 16 cells in Euclidean distance,
up to 12 per frame. Selection uses native data only, not the fitted outcome.
These are distinct local candidates, not proven independent realizations.

For each center compare 17-, 25-, and 33-cubed regions. Require native and all
five filtered maxima to be at least four cells inside the largest region, and
all six peak values to change by at most one percent from medium to large.
Use the model's radius intervals and base-peak tolerance to predict conservative
held-out-filter intervals. Allow an additional one-percent-of-native-peak
discrepancy for this empirical adequacy screen; this threshold is not a proved
measurement error bound. Abstain if the field-of-view or held-out screen fails.
Retain all exclusions, raw certificate outputs, and actual sampled peak ratios.
Report sensitivity at 0.5 and 2 percent without replacing the primary rule.

## Controls and reporting

Check the pipeline on resolved and underresolved single Gaussian vortices and
a resolved-on-the-grid broad-plus-narrow hidden-core control. Check Q's sign
with solid rotation and pure strain. Calibrate sampled versus analytic Gaussian
peaks as an operator check. Do not tune thresholds to make the controls pass.

Primary outcomes: eligible candidate counts, abstention counts, false reassurance
(resolved output with measured ratio below 0.9), and certificate coverage against
the sampled reference. Report results for one DNS volume without binomial
confidence intervals or a population prevalence estimate. Zero eligible events
is a legitimate result. Passing held-out filters does not exclude an arbitrarily
narrow hidden core or prove the single-vortex profile. This study cannot establish
continuum peak accuracy, independent replication, or experimental PIV validity.
