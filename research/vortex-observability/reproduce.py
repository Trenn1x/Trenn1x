"""Reproduce every numerical result and figure. Run: python reproduce.py

The experiments concern an analytic kinematic field. None integrate a PDE.
Numerical cross-checks use quadrature and sampled spatial convolution.
"""
from pathlib import Path
import csv
import json
import platform
import sys
from collections import Counter

import numpy as np
import scipy
from scipy.integrate import quad
from scipy.ndimage import gaussian_filter
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from vortex_observability import (
    scales, velocity, retention, filtered_peak, filtered_velocity,
    energy, normalized_maximum, normalized_peak_curve, crossover_limit,
    resolution_certificate, radius_from_ratio,
)

ROOT = Path(__file__).resolve().parent
DATA, FIG = ROOT/"data", ROOT/"figures"
DATA.mkdir(exist_ok=True)
FIG.mkdir(exist_ok=True)
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10,
                     "axes.spines.top": False, "axes.spines.right": False,
                     "axes.grid": True, "grid.alpha": 0.18,
                     "savefig.dpi": 180, "pdf.fonttype": 42})
COLORS = ["#183a5b", "#d55e00", "#008677", "#9854a0"]


def save_csv(name, rows):
    with (DATA/name).open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def save_figure(fig, name):
    fig.savefig(FIG/(name+".png"), bbox_inches="tight")
    fig.savefig(FIG/(name+".pdf"), bbox_inches="tight")
    plt.close(fig)


def independent_convolution(x, y, z, a, b, U, dr, dz):
    """Direct separable quadrature in the unfiltered coordinates.

    Integrate each Gaussian convolution, without using its closed form.
    Source coordinates cover twelve standard deviations in each direction.
    """
    def integ(location, scale, width, moment):
        norm = 1/(np.sqrt(2*np.pi)*width)
        return quad(lambda s: (scale*s)**moment * np.exp(-s*s/2)
                    * norm*np.exp(-(location-scale*s)**2/(2*width**2))*scale,
                    -12, 12, epsabs=1e-13, epsrel=2e-12, limit=300)[0]
    ix0, ix1 = [integ(x, a, dr, m) for m in (0, 1)]
    iy0, iy1 = [integ(y, a, dr, m) for m in (0, 1)]
    iz = integ(z, b, dz, 0)
    return np.exp(0.5)*U/a*np.array([-ix0*iy1*iz, ix1*iy0*iz, 0.0])


rng = np.random.default_rng(20260909)
quadrature = []
for i in range(40):
    a, b = 10**rng.uniform(-1.2, 0.4, size=2)
    dr, dz = a*10**rng.uniform(-0.5, 0.8), b*10**rng.uniform(-0.5, 0.8)
    U = 10**rng.uniform(-0.5, 1)
    A, B = np.hypot(a, dr), np.hypot(b, dz)
    xyz = np.array([A, 0., 0.]) if i % 2 == 0 else rng.uniform(-1.5, 1.5, 3)*[A, A, B]
    numeric = independent_convolution(*xyz, a, b, U, dr, dz)
    exact = filtered_velocity(*xyz, a, b, U, dr, dz)
    err = np.linalg.norm(numeric-exact)/filtered_peak(a, b, U, dr, dz)
    quadrature.append({"case": i, "a": a, "b": b, "dr": dr, "dz": dz,
                       "U": U, "normalized_error": err})
assert max(r["normalized_error"] for r in quadrature) < 1e-9
save_csv("quadrature_checks.csv", quadrature)

# Independent physical-space convolution of a sampled 3D velocity component.
a, b, U, dr, dz = 0.7, 1.2, 2.0, 0.45, 0.8
A, B = np.hypot(a, dr), np.hypot(b, dz)
sampled = []
for n in (49, 65, 97, 129):
    x = np.linspace(-7*A, 7*A, n)
    z = np.linspace(-7*B, 7*B, n)
    X, Y, Z = x[:, None, None], x[None, :, None], z[None, None, :]
    uy = U/a*X*np.exp(0.5-(X*X+Y*Y)/(2*a*a)-Z*Z/(2*b*b))
    calc = gaussian_filter(uy, sigma=(dr/(x[1]-x[0]), dr/(x[1]-x[0]), dz/(z[1]-z[0])),
                           mode="constant", cval=0.0, truncate=8.0)
    mid = n//2
    numeric_line = calc[:, mid, mid]
    exact_line = filtered_velocity(x, 0, 0, a, b, U, dr, dz)[:, 1]
    M = filtered_peak(a, b, U, dr, dz)
    sampled.append({"N_per_axis": n, "radial_step": x[1]-x[0],
                    "line_field_error_over_peak": np.max(np.abs(numeric_line-exact_line))/M,
                    "sampled_line_peak_relative_bias": abs(np.max(numeric_line)/M-1)})
assert max(r["line_field_error_over_peak"] for r in sampled) < 2e-8
save_csv("sampled_convolution.csv", sampled)

h, delta = 0.005, 0.02
tau = np.logspace(0, -14, 1001)
a, b, U = scales(tau, h)
M = filtered_peak(a, b, U, delta, delta)
E = energy(a, b, U)
rows = [dict(tau=t, a=aa, b=bb, true_peak=uu, measured_peak=mm,
             energy=ee, retention=mm/uu) for t, aa, bb, uu, mm, ee in zip(tau,a,b,U,M,E)]
save_csv("concentration_trajectory.csv", rows)
late = tau < 1e-10
observed_slope = np.polyfit(np.log(tau[late]), np.log(M[late]), 1)[0]
assert abs(observed_slope-(1.5-2*h)) < 1e-5
peak_idx = int(np.argmax(M))
fig, ax = plt.subplots(1, 2, figsize=(9.2, 3.7))
x = -np.log10(tau)
ax[0].semilogy(x, U, label="True peak", color=COLORS[0], lw=2)
ax[0].semilogy(x, M, label="Measured peak", color=COLORS[1], lw=2)
ax[0].axvline(x[peak_idx], color="#777777", lw=1, ls=":")
ax[0].set(xlabel=r"Concentration progress, $-\log_{10}\tau$", ylabel="Peak speed", title="Growth becomes apparent decay")
ax[0].legend(frameon=False)
ax[1].semilogy(x, E/E[0], label="Kinetic energy / initial value", color=COLORS[2], lw=2)
ax[1].semilogy(x, M/U, label="Fraction of peak retained", color=COLORS[3], lw=2)
ax[1].set(xlabel=r"Concentration progress, $-\log_{10}\tau$", ylabel="Fraction", title=r"$h=0.005$, filter width $\delta=0.02$")
ax[1].legend(frameon=False)
fig.tight_layout()
save_figure(fig, "01_apparent_decay")

# Noncommuting limits: independently optimize the exact finite-h expression.
crossover = []
chi_values = np.linspace(0, 2, 101)
for hh in (0.009, 0.005, 0.001):
    for chi in chi_values:
        s, c = normalized_maximum(hh, chi)
        sl, cl = crossover_limit(chi)
        crossover.append({"h": hh, "chi": chi, "s_max": s, "C_max": c,
                          "s_limit": float(sl), "C_limit": float(cl),
                          "relative_C_error": abs(c/cl-1)})
save_csv("crossover.csv", crossover)
fig, ax = plt.subplots(1, 2, figsize=(9.2, 3.6))
sl, cl = crossover_limit(chi_values)
ax[0].plot(chi_values, cl, color=COLORS[0], lw=2.5, label="Joint limit")
for hh, col in zip((0.009, 0.005, 0.001), COLORS[1:]):
    rr = [r for r in crossover if r["h"] == hh]
    ax[0].plot(chi_values, [r["C_max"] for r in rr], color=col, ls="--", label=f"h={hh}")
ax[0].set(xlabel=r"$\chi=h\log(1/\delta)$", ylabel="Normalized largest measured peak", title="A slow anisotropy crossover")
ax[0].legend(frameon=False, fontsize=8)
ax[1].plot(chi_values, sl, color=COLORS[0], lw=2.5)
ax[1].set(xlabel=r"$\chi=h\log(1/\delta)$", ylabel=r"$\tau_{\rm peak}/\delta^2$", title="Peak location in the joint limit", ylim=(1.9,3.1))
fig.tight_layout()
save_figure(fig, "02_crossover")

# Certified radius intervals and resolution decisions with bounded additive noise.
noise_rows = []
counts = Counter()
coverage_failures = false_resolved = false_underresolved = 0
target, eps = 0.9, 1e-4
for i in range(5000):
    aa, bb = 10**rng.uniform(-1.5, 1.5, 2)
    uu, dr, dz = 1.0, 1.0, 1.0
    true = np.array([filtered_peak(aa,bb,uu,dr,dz),
                     filtered_peak(aa,bb,uu,2*dr,dz),
                     filtered_peak(aa,bb,uu,dr,2*dz)])
    observed = true + rng.uniform(-eps, eps, 3)
    cert = resolution_certificate(observed, [eps]*3, dr, dz, target=target)
    state = cert["status"]
    counts[state] += 1
    if state == "model_inconsistent":
        coverage_failures += 1
        continue
    rtrue = float(retention(aa,bb,dr,dz))
    ar, br = cert["radial"], cert["axial"]
    if not (ar["lower"] <= aa <= ar["upper"] and br["lower"] <= bb <= br["upper"]):
        coverage_failures += 1
    if state == "resolved" and rtrue < target:
        false_resolved += 1
    if state == "underresolved" and rtrue >= target:
        false_underresolved += 1
    noise_rows.append({"case": i, "a": aa, "b": bb, "true_retention": rtrue,
                       "lower_retention": cert["retention_lower"],
                       "upper_retention": cert["retention_upper"], "status": state})
assert coverage_failures == false_resolved == false_underresolved == 0
save_csv("noise_certification.csv", noise_rows)
fig, ax = plt.subplots(1, 2, figsize=(9.2, 3.8))
for state, col in [("resolved",COLORS[2]),("underresolved",COLORS[1]),("indeterminate","#9aa4af")]:
    rr = [r for r in noise_rows if r["status"] == state]
    ax[0].scatter([r["a"] for r in rr],[r["b"] for r in rr],s=5,c=col,alpha=.55,label=state)
ax[0].set(xscale="log",yscale="log",xlabel=r"Radial size / filter width, $a/d$",ylabel=r"Axial size / filter width, $b/e$",title="Resolution certificate")
ax[0].legend(frameon=False,fontsize=8,markerscale=3)
labels = ["Underresolved", "Resolved", "Indeterminate"]
values = [counts["underresolved"],counts["resolved"],counts["indeterminate"]]
ax[1].bar(labels,values,color=[COLORS[1],COLORS[2],"#9aa4af"])
ax[1].set(ylabel="Cases",title="5,000 bounded-noise trials")
for j,v in enumerate(values):
    ax[1].text(j,v+35,str(v),ha="center",fontsize=9)
ax[1].tick_params(axis="x",labelsize=8)
fig.tight_layout()
save_figure(fig, "03_certification")

# Exact two-scale inversion without noise, away from singular endpoints.
inverse_errors = []
for aa in np.logspace(-1, 1, 41):
    for bb in (0.2,1,5):
        base = filtered_peak(aa,bb,1,1,1)
        radial = filtered_peak(aa,bb,1,2,1)
        axial = filtered_peak(aa,bb,1,1,2)
        ahat = radius_from_ratio(base/radial,1,power=1.5)
        bhat = radius_from_ratio(base/axial,1,power=0.5)
        inverse_errors.extend([abs(ahat/aa-1),abs(bhat/bb-1)])
assert max(inverse_errors) < 1e-10

summary = {
    "model": "Kinematic solenoidal Gaussian vortex; no PDE integration",
    "seed": 20260909,
    "versions": {"python":sys.version.split()[0], "numpy":np.__version__,
                 "scipy":scipy.__version__, "matplotlib":matplotlib.__version__,
                 "platform":platform.platform()},
    "quadrature_cases":len(quadrature),
    "max_quadrature_normalized_error":max(r["normalized_error"] for r in quadrature),
    "sampled_convolution":sampled,
    "late_time_fitted_exponent":float(observed_slope),
    "late_time_theory_exponent":1.5-2*h,
    "trajectory": {"h":h,"delta":delta,"tau_at_sampled_max":float(tau[peak_idx]),
                   "sampled_max_measured_peak":float(M[peak_idx]),
                   "last_true_peak":float(U[-1]),"last_measured_peak":float(M[-1]),
                   "last_energy_fraction":float(E[-1]/E[0])},
    "isotropic_normalized_limit":float(3*np.sqrt(3)/16),
    "anisotropy_first_normalized_limit":float(2/(3*np.sqrt(3))),
    "ratio_of_iterated_limits":32/27,
    "noise_trials":5000,"noise_absolute_bound":eps,"retention_target":target,
    "noise_status_counts":dict(counts),"interval_coverage_failures":coverage_failures,
    "false_resolved":false_resolved,"false_underresolved":false_underresolved,
    "max_noiseless_inverse_relative_error":float(max(inverse_errors)),
    "crossover_max_relative_error_by_h":{str(hh):max(r["relative_C_error"] for r in crossover if r["h"]==hh)
                                           for hh in (0.009,0.005,0.001)},
}
(DATA/"summary.json").write_text(json.dumps(summary,indent=2)+"\n")
print(json.dumps(summary,indent=2))
