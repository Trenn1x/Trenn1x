"""Post-outcome direct-summation audit and additional region stress test."""
from pathlib import Path
import json, csv
import numpy as np
from scipy.ndimage import gaussian_filter
from analyze import peak_info
ROOT=Path(__file__).resolve().parent
arr=np.load(ROOT.parent/'external_cache/public_sample_128.npz')['velocity'].astype(float)
u=arr-arr.mean(axis=(0,1,2));center=[83,76,63];w=1.
sigmas=[(w,w,w),(w,2*w,2*w),(2*w,w,w),(1.5*w,)*3,(2*w,)*3]
audit=[];expanded=[]
native=np.linalg.norm(u,axis=-1)
for field,sigma in enumerate(sigmas):
    filtered=gaussian_filter(u,sigma=(*sigma,0),truncate=6,mode='constant',cval=0)
    speed=np.linalg.norm(filtered,axis=-1)
    p=peak_info(speed,center,16);loc=p['position']
    kernels=[];slices=[]
    for s,i in zip(sigma,loc):
        r=int(6*s+.5);x=np.arange(-r,r+1);k=np.exp(-.5*(x/s)**2);k/=k.sum()
        kernels.append(k);slices.append(slice(i-r,i+r+1))
    direct=np.einsum('i,j,k,ijkc->c',*kernels,u[tuple(slices)])
    reference=filtered[tuple(loc)]
    error=float(np.max(np.abs(direct-reference)))
    assert error < 1e-12
    audit.append(dict(field=field,position=loc,sigma_zyx=sigma,direct_peak=float(np.linalg.norm(direct)),
                      scipy_peak=float(np.linalg.norm(reference)),max_component_difference=error))
    for r in (8,12,16,20):
        pr=peak_info(speed,center,r);nr=peak_info(native,center,r)
        expanded.append(dict(field=field,region_side=2*r+1,peak=pr['value'],peak_edge=pr['edge'],
                             native_peak=nr['value'],native_edge=nr['edge'],ratio=pr['value']/nr['value']))
out=dict(audit_type='Post-outcome direct summation and additional 41-cubed region stress test',
         selected_case=dict(frame='expanded_128_mean_subtracted',center=center,width=w),
         direct_summation=audit,expanded_region=expanded)
(ROOT/'data/case_audit.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
