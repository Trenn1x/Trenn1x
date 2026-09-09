"""Sensitivity check using the entire central 32^3 region of the 64^3 sample.

This was added after the eight-region exploratory result to assess a
specific field-of-view risk. The evaluated region still has a 16-cell halo.
"""
from pathlib import Path
import csv,json
import numpy as np
from scipy.ndimage import gaussian_filter
from vortex_observability import resolution_certificate
ROOT=Path(__file__).resolve().parent
arr=np.load(ROOT/'external_cache/public_sample_64.npz')['velocity'].astype(float)
roi=(slice(16,48),)*3;rows=[]
for frame in ('laboratory','volume_mean_subtracted'):
    u=arr if frame=='laboratory' else arr-arr.mean(axis=(0,1,2),keepdims=True)
    speed=np.linalg.norm(u[roi],axis=-1);reference=float(speed.max())
    loc=tuple(map(int,np.unravel_index(speed.argmax(),speed.shape)))
    for width in (.5,1.,1.5,2.):
        peaks=[float(np.linalg.norm(gaussian_filter(u,sigma=(a,r,r,0),mode='constant',truncate=4.)[roi],axis=-1).max()) for r,a in ((width,width),(2*width,width),(width,2*width))]
        eps=1e-4*reference;cert=resolution_certificate(peaks,[eps]*3,width,width,target=.9)
        rows.append(dict(frame=frame,width_cells=width,reference_grid_peak=reference,reference_peak_zyx_in_region=str(loc),reference_distance_to_region_edge_cells=min(min(i,31-i) for i in loc),sampled_peak_ratio=peaks[0]/reference,conditional_status=cert['status'],model_retention_lower=cert.get('retention_lower'),model_retention_upper=cert.get('retention_upper'),false_reassurance_on_grid=cert['status']=='resolved' and peaks[0]/reference<.9))
with (ROOT/'data/dns_fov_check.csv').open('w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
print(json.dumps(rows,indent=2))
