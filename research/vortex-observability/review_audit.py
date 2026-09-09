"""Further internal review: independent arithmetic and adversarial profiles.

No PDE is solved. Decimal computations are numerical cross-checks, not formal
proofs. Exact Fraction comparisons audit outward rounding of selected bounds.
"""
from pathlib import Path
from decimal import Decimal as D, localcontext
from fractions import Fraction
from itertools import product
import csv
import json
import math

import numpy as np
from scipy.optimize import minimize_scalar
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from vortex_observability import (
    normalized_maximum, crossover_limit, radius_interval,
    resolution_certificate, velocity, filtered_velocity, filtered_peak, energy,
)

ROOT=Path(__file__).resolve().parent
DATA,FIG=ROOT/"data",ROOT/"figures"
DATA.mkdir(exist_ok=True)
FIG.mkdir(exist_ok=True)


def save_csv(name,rows):
    with (DATA/name).open("w",newline="") as stream:
        writer=csv.DictWriter(stream,fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def independent_maximum(h,chi):
    """80-digit bisection of d log(F)/d log(s), without SciPy optimization."""
    with localcontext() as ctx:
        ctx.prec=80
        h,chi=D(str(h)),D(str(chi))
        E=(-4*chi).exp()
        def stationary(s):
            sp=((1-2*h)*s.ln()).exp()
            return -D("0.5")-h+D("1.5")/(s+1)+(D("0.5")-h)*E/(sp+E)
        lo,hi=D(1),D(4)
        assert stationary(lo)>0 and stationary(hi)<0
        for _ in range(270):
            mid=(lo+hi)/2
            if stationary(mid)>0:lo=mid
            else:hi=mid
        s=(lo+hi)/2
        logF=-(D("0.5")+h)*s.ln()-D("1.5")*(1+1/s).ln()
        logF-=D("0.5")*(1+E*((-1+2*h)*s.ln()).exp()).ln()
        return s,logF.exp()


max_rows=[]
for h,chi in product((0,.001,.005,.009),(0,.1,.5,1,5,20)):
    sd,cd=independent_maximum(h,chi)
    sf,cf=normalized_maximum(h,chi)
    row=dict(h=h,chi=chi,s_decimal=str(sd),C_decimal=str(cd),
             s_float=sf,C_float=cf,relative_peak_error=abs(cf/float(cd)-1),
             relative_location_error=abs(sf/float(sd)-1))
    assert row["relative_peak_error"]<5e-14
    assert row["relative_location_error"]<1e-6
    if h==0:
        sl,cl=crossover_limit(chi)
        assert abs(cl/float(cd)-1)<1e-14
        assert abs(sl/float(sd)-1)<1e-14
    max_rows.append(row)
save_csv("review_high_precision_maxima.csv",max_rows)

# A zero-width float interval cannot enclose sqrt(7/5); check the repaired
# algorithm using an exact rational predicate, independent of decimal sqrt.
rounding_rows=[]
for base,coarse,power in ((27,8,1.5),(3,2,.5)):
    radius=radius_interval(base,coarse,0,0,1,2,power)
    assert Fraction(radius["lower"])**2<=Fraction(7,5)<=Fraction(radius["upper"])**2
    assert radius["lower"]<radius["upper"]
    rounding_rows.append(dict(base=base,coarse=coarse,power=power,**radius))

boundary_cases=[
    ((1,1,0,0,1,2,1.5),"model_inconsistent"),
    ((8,1,0,0,1,2,1.5),"model_inconsistent"),
    ((2,1,0,0,1,2,.5),"model_inconsistent"),
    ((0,1,0,0,1,2,1.5),"model_inconsistent"),
    ((1,1,1,1,1,2,1.5),"noise_limited"),
    ((1,1,.1,.1,1,2,1.5),"enclosed"),
    ((7.9,1,.2,0,1,2,1.5),"enclosed"),
]
for args,status in boundary_cases:
    assert radius_interval(*args)["status"]==status
invalid_cases=[(1,1,-1,0,1,2,1.5),(1,1,0,0,0,2,1.5),
               (1,1,0,0,1,1,1.5),(math.nan,1,0,0,1,2,1.5)]
for args in invalid_cases:
    try:radius_interval(*args)
    except ValueError:pass
    else:raise AssertionError("Invalid input accepted")


def decimal_peak(a,b,d,eta):
    return ((1+(d/a)**2)**3*(1+(eta/b)**2)).sqrt()**-1


# All eight noise corners across 28 shape pairs, including almost saturated
# ratios. Include conversion error explicitly in the supplied error budget.
corner_rows=[]
with localcontext() as ctx:
    ctx.prec=80
    eps=D("0.00001")
    for astr,bstr in product((".01",".1","1","3","10","100","10000"),
                             (".02","1","20","1000")):
        a,b=D(astr),D(bstr)
        true=[decimal_peak(a,b,D(1),D(1)),decimal_peak(a,b,D(2),D(1)),
              decimal_peak(a,b,D(1),D(2))]
        for signs in product((-1,1),repeat=3):
            obs=[float(m+D(sign)*eps) for m,sign in zip(true,signs)]
            errs=[math.nextafter(float(eps)+16*math.ulp(m),math.inf) for m in obs]
            assert all(abs(D.from_float(m)-t)<=D.from_float(e) for m,t,e in zip(obs,true,errs))
            cert=resolution_certificate(obs,errs,1,1)
            assert cert["status"]!="model_inconsistent"
            for key,value in (("radial",a),("axial",b)):
                assert D.from_float(cert[key]["lower"])<=value<=D.from_float(cert[key]["upper"])
            assert D.from_float(cert["retention_lower"])<=true[0]<=D.from_float(cert["retention_upper"])
            if cert["status"]=="resolved":assert true[0]>=D.from_float(.9)
            if cert["status"]=="underresolved":assert true[0]<D.from_float(.9)
            corner_rows.append(dict(a=astr,b=bstr,noise_signs=str(signs),status=cert["status"]))
save_csv("review_noise_corners.csv",corner_rows)

# Two concentric, co-rotating Gaussian components. Along r>0, z=0 they
# are aligned; all z != 0 reduce each component, so the global peak lies here.
broad=(10.,10.,1.)
core=(.01,.01,3.)


def profile(r,widths=None):
    if widths is None:
        return sum(velocity(r,0,0,*part)[...,1] for part in (broad,core))
    return sum(filtered_velocity(r,0,0,*part,*widths)[...,1] for part in (broad,core))


def profile_maximum(widths=None):
    log_r=np.linspace(math.log(1e-6),math.log(200),12001)
    values=profile(np.exp(log_r),widths)
    indices=np.flatnonzero((values[1:-1]>values[:-2])&(values[1:-1]>values[2:]))+1
    candidates=[]
    for j in indices:
        result=minimize_scalar(lambda lr:-float(profile(math.exp(lr),widths)),
                               bounds=(log_r[j-1],log_r[j+1]),method="bounded",
                               options={"xatol":1e-14})
        assert result.success
        candidates.append((float(-result.fun),math.exp(result.x)))
    assert candidates
    return max(candidates)


true_peak,true_r=profile_maximum()
peaks=[profile_maximum(w)[0] for w in ((1,1),(2,1),(1,2))]
cert=resolution_certificate(peaks,[1e-12]*3,1,1,target=.9)
assert cert["status"]=="resolved"
actual_retention=peaks[0]/true_peak
# This analytic upper bound needs no numerical maximizer: total true peak
# >= 3 and the filtered norm is bounded by the sum of component norms.
analytic_upper=(filtered_peak(*broad,1,1)+filtered_peak(*core,1,1))/3
assert actual_retention<analytic_upper<.327
common_observation=[float(filtered_peak(*broad,*w)) for w in ((1,1),(2,1),(1,2))]
common_error=4e-8
# The hidden component's largest filtered peak is < 3e-8 at all three
# widths. These common data are compatible with both the broad and total
# fields; the budget also dominates floating-point evaluation error.
assert max(filtered_peak(*core,*w) for w in ((1,1),(2,1),(1,2)))<3e-8
common_cert=resolution_certificate(common_observation,[common_error]*3,1,1)
assert common_cert["status"]=="resolved" and common_cert["retention_lower"]>.98
hidden=dict(broad=dict(a=broad[0],b=broad[1],U=broad[2]),
            core=dict(a=core[0],b=core[1],U=core[2]),
            true_total_peak=true_peak,true_peak_radius=true_r,measured_peaks=peaks,
            actual_total_retention=actual_retention,analytic_retention_upper=analytic_upper,
            core_to_broad_L2_ratio=math.sqrt(energy(*core)/energy(*broad)),
            single_profile_certificate=cert,
            common_observation=common_observation,common_observation_error=common_error,
            common_observation_certificate=common_cert,
            interpretation="The model-conditional result does not certify the total flow.")
r=np.logspace(-5,2,3001)
save_csv("review_hidden_core_profiles.csv",[dict(radius=rr,total_true=tt,total_filtered=ff,
    broad_true=bb) for rr,tt,ff,bb in zip(r,profile(r),profile(r,(1,1)),velocity(r,0,0,*broad)[:,1])])
plt.rcParams.update({"font.family":"DejaVu Sans","font.size":10,
                     "axes.spines.top":False,"axes.spines.right":False,"pdf.fonttype":42})
fig,ax=plt.subplots(figsize=(8.8,3.8))
ax.semilogx(r,profile(r),color="#183a5b",lw=2,label="Total true speed")
ax.semilogx(r,profile(r,(1,1)),color="#d55e00",lw=2,label="Total filtered speed")
ax.semilogx(r,velocity(r,0,0,*broad)[:,1],color="#008677",ls="--",lw=1.5,label="Broad component alone")
ax.set(xlabel="Radius (log scale)",ylabel="Speed at z = 0",xlim=(1e-4,60),ylim=(0,3.25),
       title="A hidden core defeats an unvalidated profile assumption")
ax.text(.035,2.6,"Model estimate: 98.0% retained\nActual total peak: 32.7% retained",fontsize=10)
ax.legend(frameon=False,loc="upper right",fontsize=9)
ax.grid(alpha=.15)
fig.tight_layout()
fig.savefig(FIG/"04_hidden_core.png",dpi=180,bbox_inches="tight")
fig.savefig(FIG/"04_hidden_core.pdf",bbox_inches="tight")
plt.close(fig)

summary={"audit_kind":"Internal mathematical and numerical review; no external referee",
         "decimal_precision":80,"independent_maximum_cases":len(max_rows),
         "max_relative_peak_error":max(r["relative_peak_error"] for r in max_rows),
         "max_relative_location_error":max(r["relative_location_error"] for r in max_rows),
         "exact_rounding_cases":rounding_rows,"boundary_cases":len(boundary_cases),
         "invalid_input_cases":len(invalid_cases),"bounded_noise_corner_cases":len(corner_rows),
         "corner_coverage_failures":0,"hidden_core":hidden,
         "energy_resolution_bound":"If ||u||_2 <= B and ||u||_infinity >= c*tau^(-gamma), retention >= rho requires d^2*eta <= B^2*tau^(2*gamma)/(8*pi^(3/2)*rho^2*c^2)."}
(DATA/"review_summary.json").write_text(json.dumps(summary,indent=2)+"\n")
print(json.dumps(summary,indent=2))
