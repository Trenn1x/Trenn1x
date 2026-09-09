"""Exact measurement benchmark for a concentrating solenoidal Gaussian vortex.

This is a kinematic model, not a Navier--Stokes solver or a smooth-force
blowup construction. Filter widths are Gaussian standard deviations.
All vector norms are Euclidean. Spatial maxima are over the continuum.
"""
from __future__ import annotations

import math
from fractions import Fraction
from decimal import Decimal, localcontext
import numpy as np
from scipy.optimize import minimize_scalar


def scales(tau, h=0.005):
    if not 0 <= h < 0.01:
        raise ValueError("Expected 0 <= h < 0.01; h=0 is the comparison limit.")
    tau = np.asarray(tau, dtype=float)
    if np.any(tau <= 0):
        raise ValueError("tau must be positive")
    return tau**0.5, tau**(0.5-h), tau**(-0.5-h)


def velocity(x, y, z, a, b, peak=1.0):
    """Return a (..., 3) array; true continuum peak equals `peak`."""
    x, y, z = np.broadcast_arrays(x, y, z)
    c = peak/a * np.exp(0.5 - (x*x+y*y)/(2*a*a) - z*z/(2*b*b))
    return np.stack((-y*c, x*c, np.zeros_like(c)), axis=-1)


def retention(a, b, radial_width, axial_width):
    a, b = np.asarray(a), np.asarray(b)
    return (1+(radial_width/a)**2)**(-1.5) * (1+(axial_width/b)**2)**(-0.5)


def filtered_peak(a, b, peak, radial_width, axial_width):
    return peak * retention(a, b, radial_width, axial_width)


def filtered_velocity(x, y, z, a, b, peak, radial_width, axial_width):
    A = np.hypot(a, radial_width)
    B = np.hypot(b, axial_width)
    M = filtered_peak(a, b, peak, radial_width, axial_width)
    return velocity(x, y, z, A, B, M)


def energy(a, b, peak):
    return np.e * np.pi**1.5 / 2 * peak**2 * a**2 * b


def gaussian_l2(radial_width, axial_width):
    return (8*np.pi**1.5*radial_width**2*axial_width)**(-0.5)


def normalized_peak_curve(s, h, chi):
    """delta**(1+2h) M(tau), tau=delta**2*s, chi=h*log(1/delta).

    This stable expression avoids representing tiny delta or tau.
    """
    s = np.asarray(s, dtype=float)
    log_s = np.log(s)
    return np.exp(-(0.5+h)*log_s
                  - 1.5*np.logaddexp(0.0, -log_s)
                  - 0.5*np.logaddexp(0.0, -4*chi-(1-2*h)*log_s))


def normalized_maximum(h, chi):
    opt = minimize_scalar(
        lambda log_s: -normalized_peak_curve(np.exp(log_s), h, chi),
        bounds=(-8.0, 8.0), method="bounded",
        options={"xatol": 2e-13})
    if not opt.success:
        raise RuntimeError(opt.message)
    return float(np.exp(opt.x)), float(-opt.fun)


def crossover_limit(chi):
    E = np.exp(-4*np.asarray(chi))
    s = 1 + np.sqrt(1+3*E)
    C = s**1.5 / ((s+1)**1.5*np.sqrt(s+E))
    return s, C


def radius_from_ratio(ratio, width, kappa=2.0, power=1.5):
    """power=3/2 for radial comparison; power=1/2 for axial comparison."""
    Q = np.asarray(ratio)**(1/power)
    if np.any(Q <= 1) or np.any(Q >= kappa**2):
        raise ValueError("Ratio is outside the open model range")
    return width*np.sqrt((kappa**2-Q)/(Q-1))


def radius_interval(m_base, m_coarse, eps_base, eps_coarse,
                    width, kappa=2.0, power=1.5):
    """Outward enclosure for the exact real values of the supplied numbers.

    Rational arithmetic and bisection avoid unchecked power/ratio rounding.
    The final floating-point endpoints are rounded outward by exact square
    comparisons. Validity still requires the stated profile and error bounds.
    """
    values=[m_base,m_coarse,eps_base,eps_coarse,width,kappa]
    if not all(math.isfinite(float(x)) for x in values):
        raise ValueError("Inputs must be finite")
    if min(eps_base,eps_coarse)<0 or width<=0 or kappa<=1 or power not in (0.5,1.5):
        raise ValueError("Require errors >= 0, width > 0, kappa > 1, and power in {0.5,1.5}")
    m_base,m_coarse,eps_base,eps_coarse,width,kappa=map(Fraction,values)
    if m_base+eps_base <= 0 or m_coarse+eps_coarse <= 0:
        return {"lower": None, "upper": None, "status": "model_inconsistent"}
    if m_base <= eps_base or m_coarse <= eps_coarse:
        return {"lower": 0.0, "upper": float("inf"), "status": "noise_limited"}
    rlo=(m_base-eps_base)/(m_coarse+eps_coarse)
    rhi=(m_base+eps_base)/(m_coarse-eps_coarse)
    k2=kappa*kappa
    degree=3 if power==1.5 else 1
    slo,shi=rlo*rlo,rhi*rhi
    if shi<=1 or slo>=k2**degree:
        return {"lower": None, "upper": None, "status": "model_inconsistent"}
    def root_bounds(target):
        if target<=1:return Fraction(1),Fraction(1)
        if target>=k2**degree:return k2,k2
        if degree==1:return target,target
        low,high=Fraction(1),k2
        for _ in range(90):
            mid=(low+high)/2
            cube=mid**3
            if cube==target:return mid,mid
            if cube<target:low=mid
            else:high=mid
        return low,high
    qlo=root_bounds(slo)[0]
    qhi=root_bounds(shi)[1]
    lower2=Fraction(0) if qhi>=k2 else width**2*(k2-qhi)/(qhi-1)
    upper2=None if qlo<=1 else width**2*(k2-qlo)/(qlo-1)
    lo=_sqrt_outward(lower2,upper=False)
    hi=float("inf") if upper2 is None else _sqrt_outward(upper2,upper=True)
    return {"lower":lo,"upper":hi,"status":"enclosed"}


def _sqrt_outward(value, upper):
    """Enclose sqrt(nonnegative Fraction), verified by exact rational squares."""
    if value==0:return 0.0
    with localcontext() as ctx:
        ctx.prec=80
        candidate=float((Decimal(value.numerator)/Decimal(value.denominator)).sqrt())
    if math.isinf(candidate):
        if upper:return candidate
        candidate=math.nextafter(candidate,0.0)
    if upper:
        while Fraction(candidate)**2<value:
            candidate=math.nextafter(candidate,math.inf)
            if math.isinf(candidate):break
    else:
        while Fraction(candidate)**2>value:
            candidate=math.nextafter(candidate,0.0)
    return candidate


def _retention_squared(a,b,d,eta):
    def factor(size,width):
        if math.isinf(size):return Fraction(1)
        ss=Fraction(size)**2
        return ss/(ss+Fraction(width)**2)
    return factor(a,d)**3*factor(b,eta)


def resolution_certificate(peaks, errors, radial_width, axial_width,
                           kappa=2.0, target=0.9):
    """Certify retention CONDITIONAL on the single-vortex profile model.

    Three peaks cannot establish model adequacy or exclude a hidden core.
    The result does not certify the peak of an arbitrary measured flow.
    """
    if not math.isfinite(target) or not 0<target<1:
        raise ValueError("target must lie strictly between zero and one")
    m0, mr, mz = peaks
    e0, er, ez = errors
    ar = radius_interval(m0, mr, e0, er, radial_width, kappa, 1.5)
    br = radius_interval(m0, mz, e0, ez, axial_width, kappa, 0.5)
    if "model_inconsistent" in (ar["status"], br["status"]):
        return {"status": "model_inconsistent", "scope": "conditional_single_vortex_model",
                "radial": ar, "axial": br}

    lower2=_retention_squared(ar["lower"],br["lower"],radial_width,axial_width)
    upper2=_retention_squared(ar["upper"],br["upper"],radial_width,axial_width)
    lower=_sqrt_outward(lower2,upper=False)
    upper=_sqrt_outward(upper2,upper=True)
    target2=Fraction(target)**2
    if lower2 >= target2:
        status = "resolved"
    elif upper2 < target2:
        status = "underresolved"
    else:
        status = "indeterminate"
    return {"status": status, "scope": "conditional_single_vortex_model", "retention_lower": lower,
            "retention_upper": upper, "radial": ar, "axial": br}
