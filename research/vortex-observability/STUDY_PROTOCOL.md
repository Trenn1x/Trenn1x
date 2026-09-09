# Next study: when does a fitted retention estimate miss a vortex peak?

This protocol is prospective. The completed small pilot does not establish
hidden-core prevalence in turbulence. Any additional exploratory analysis
must be identified before interpreting it as confirmation.

## Scientific question

Under what independently checked profile, background, and resolution
conditions do multiscale peak measurements give useful information about
the peak of a turbulent vortex? When do they confidently miss a narrow core?

## Data and units

Use suitably large DNS volumes and a PIV measurement benchmark recommended
by a domain collaborator. Record dataset version, source hashes, spatial and
temporal coordinates, grid spacing, and any downsampling. Select events by a
specified vortex criterion on native data before fitting the observation
model. Separate event selection from evaluation. Fix the reference frame and
orientation procedure explicitly. Distinct nearby filters, times, or pixels
are not independent experimental replications.

## Observation and reference

Filter vector components, then take the speed maximum. Use identical
physical evaluation regions across filter widths with enough surrounding
halo for the largest kernel. Check that the reference peak is well inside
the region and stable when it expands. Keep regional peak ratios distinct
from global peak retention; smoothing can import a faster surrounding value
into a region. Do not assume cutouts are periodic.

Compare sampled and continuous Gaussian operators, native-grid peak sampling,
noise, background subtraction, and actual PIV interrogation kernels. Establish
reference convergence before interpreting any measurement as continuum peak
retention. Use adequately resolved synthetic cases to calibrate operator error
separately from unknown flow-profile error.

## Baselines and outcomes

Compare the three-observation fit with a larger set of held-out directional
filter widths, a direct profile fit, and a conservative method that abstains
when the profile is unsupported. Additional filters diagnose mismatch but do
not, by themselves, rule out arbitrarily narrow components.

Report all conditional outcomes, including model inconsistency and abstention.
Primary outcomes are false reassurance and coverage relative to a clearly
stated reference, not only parameter-fit error. Include the analytic broad-plus-
narrow counterexample as a positive failure control and single vortices as
in-model controls. Freeze thresholds and error-budget rules before a held-out
comparison; show sensitivity to those choices.

Use event- or realization-level uncertainty estimates that account for
correlation. Release the selection procedure, exclusions, code, and data
provenance. Preserve negative results.

## Publication decision

A methods paper requires a defensible reference and either a useful,
independently supported applicability condition or a meaningful empirical
failure boundary. Without those results, retain the narrower technical note
and benchmark. Expert comments on priority and measurement interpretation
should shape the next version before journal submission.
