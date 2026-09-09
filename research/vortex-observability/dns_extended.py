"""Exploratory wider-filter pilot on one public 64^3 JHTDB volume.

Eight pre-specified, nonoverlapping 16^3 evaluation regions fill its central
32^3 volume. All filters have sufficient halo. Regions, frames, and widths
are correlated; there is one volume and no event or continuum certification.
"""
from pathlib import Path
from itertools import product
from collections import Counter
import csv,json
import numpy as np
from scipy.ndimage import gaussian_filter
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from vortex_observability import resolution_certificate
ROOT=Path(__file__).resolve().parent
WIDTHS=(.5,1.,1.5,2.)
original=np.load(ROOT/'external_cache/public_sample_64.npz')['velocity'].astype(float)
rows=[]
for frame in ('laboratory','volume_mean_subtracted'):
    u=original if frame=='laboratory' else original-original.mean(axis=(0,1,2),keepdims=True)
    for width in WIDTHS:
        fields=[gaussian_filter(u,sigma=(axial,radial,radial,0),mode='constant',cval=0,truncate=4.) for radial,axial in ((width,width),(2*width,width),(width,2*width))]
        assert round(4*2*width)<=16
        for start in product((16,32),repeat=3):
            roi=tuple(slice(i,i+16) for i in start)
            reference=float(np.linalg.norm(u[roi],axis=-1).max())
            peaks=[float(np.linalg.norm(f[roi],axis=-1).max()) for f in fields]
            eps=1e-4*reference;cert=resolution_certificate(peaks,[eps]*3,width,width,target=.9)
            ratio=peaks[0]/reference
            rows.append(dict(region_zyx='_'.join(map(str,start)),frame=frame,width_cells=width,
                             reference_grid_peak=reference,base_peak=peaks[0],radial_peak=peaks[1],axial_peak=peaks[2],sampled_peak_ratio=ratio,error_tolerance=eps,
                             conditional_status=cert['status'],model_retention_lower=cert.get('retention_lower'),model_retention_upper=cert.get('retention_upper'),
                             false_reassurance_on_grid=cert['status']=='resolved' and ratio<.9,
                             false_underresolution_on_grid=cert['status']=='underresolved' and ratio>=.9))
with (ROOT/'data/dns_extended.csv').open('w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
summary=dict(dataset='JHTDB isotropic1024coarse, public mirror',volume_count=1,time_index=1,volume_shape=[64,64,64,3],region_shape=[16,16,16],region_count=8,region_starts_zyx=list(product((16,32),repeat=3)),widths_cells=WIDTHS,frames=['laboratory','volume_mean_subtracted'],assessment_count=len(rows),status_counts=dict(Counter(r['conditional_status'] for r in rows)),false_reassurance_on_grid=sum(r['false_reassurance_on_grid'] for r in rows),false_underresolution_on_grid=sum(r['false_underresolution_on_grid'] for r in rows),sampled_peak_ratio_range=[min(r['sampled_peak_ratio'] for r in rows),max(r['sampled_peak_ratio'] for r in rows)],error_tolerance_relative=1e-4,target=.9,interpretation='Exploratory regional sampled-peak comparison on one volume; no model, continuum-peak, or prevalence validation.')
(ROOT/'data/dns_extended_summary.json').write_text(json.dumps(summary,indent=2)+'\n')
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10,'axes.spines.top':False,'axes.spines.right':False,'pdf.fonttype':42})
fig,ax=plt.subplots(1,2,figsize=(9.2,3.8));colors={'resolved':'#008677','underresolved':'#d55e00','indeterminate':'#9aa4af','model_inconsistent':'#9854a0'}
for frame,marker in [('laboratory','o'),('volume_mean_subtracted','^')]:
    subset=[r for r in rows if r['frame']==frame]
    ax[0].scatter([r['width_cells'] for r in subset],[r['sampled_peak_ratio'] for r in subset],c=[colors[r['conditional_status']] for r in subset],marker=marker,s=33,alpha=.7,label=frame.replace('_',' '))
ax[0].axhline(.9,color='#555',ls=':',lw=1);ax[0].set(xlabel='Base Gaussian width / native grid spacing',ylabel='Regional sampled peak ratio',title='Eight regions in one 64³ volume');ax[0].legend(frameon=False,fontsize=8)
states=list(summary['status_counts']);ax[1].bar(range(len(states)),[summary['status_counts'][s] for s in states],color=[colors[s] for s in states]);ax[1].set_xticks(range(len(states)),[s.replace('_','\n') for s in states],fontsize=8);ax[1].set(ylabel='Assessments',title='Conditional model output')
for i,s in enumerate(states):ax[1].text(i,summary['status_counts'][s]+.4,str(summary['status_counts'][s]),ha='center')
fig.suptitle('Wider-filter pilot: regional sampled peaks, without a validated vortex profile',fontsize=11);fig.tight_layout();fig.savefig(ROOT/'figures/06_dns_extended.png',dpi=180,bbox_inches='tight');fig.savefig(ROOT/'figures/06_dns_extended.pdf',bbox_inches='tight');plt.close(fig)
print(json.dumps(summary,indent=2))
