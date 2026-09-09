"""Small external-data pilot of the model-conditional peak-ratio workflow.

Reference peaks are on a 3^3 interior grid, not continuum vortex peaks.
Filtering is a sampled Gaussian; no profile or operator adequacy is asserted.
The purpose is to exercise the pipeline on real DNS and expose its limits.
"""
from pathlib import Path
import csv
import json
from collections import Counter
import numpy as np
from scipy.ndimage import gaussian_filter
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from vortex_observability import resolution_certificate

ROOT=Path(__file__).resolve().parent
ROI=(slice(6,9),)*3
WIDTHS=(.35,.5,.7)
TOLERANCE=1e-4
rows=[]
receipts=json.loads((ROOT/'data/jhtdb_provenance.json').read_text())
for receipt in receipts:
    original=np.load(ROOT/'external_cache'/f"{receipt['label']}.npz")['velocity'].astype(float)
    for frame in ('laboratory','cutout_mean_subtracted'):
        u=original if frame=='laboratory' else original-original.mean(axis=(0,1,2),keepdims=True)
        reference=float(np.linalg.norm(u[ROI],axis=-1).max())
        for width in WIDTHS:
            fields=[]
            for radial,axial in ((width,width),(2*width,width),(width,2*width)):
                # Array order is z,y,x,component. Keep all components separate.
                fields.append(gaussian_filter(u,sigma=(axial,radial,radial,0),
                                              mode='constant',cval=0,truncate=4.0))
            peaks=[float(np.linalg.norm(f[ROI],axis=-1).max()) for f in fields]
            # At these widths, the finite filter support lies wholly inside
            # the cutout for every evaluated point. Padding cannot affect it.
            max_radius=round(4*2*width)
            assert max_radius<=6
            eps=TOLERANCE*reference
            cert=resolution_certificate(peaks,[eps]*3,width,width,target=.9)
            peak_ratio=peaks[0]/reference
            rows.append(dict(cutout=receipt['label'],frame=frame,width_cells=width,
                             reference_grid_peak=reference,base_peak=peaks[0],radial_peak=peaks[1],
                             axial_peak=peaks[2],sampled_peak_ratio=peak_ratio,
                             error_tolerance=eps,conditional_status=cert['status'],
                             model_retention_lower=cert.get('retention_lower'),
                             model_retention_upper=cert.get('retention_upper'),
                             false_reassurance_on_grid=cert['status']=='resolved' and peak_ratio<.9,
                             false_underresolution_on_grid=cert['status']=='underresolved' and peak_ratio>=.9))
with (ROOT/'data/dns_pilot.csv').open('w',newline='') as stream:
    writer=csv.DictWriter(stream,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
summary=dict(dataset='JHTDB isotropic1024coarse',time_index=1,cutouts=len(receipts),
             downloaded_points=sum(x['points'] for x in receipts),cutout_shape=[15,15,15,3],
             evaluation_region=[3,3,3],widths_cells=WIDTHS,assessment_count=len(rows),
             relative_error_tolerance=TOLERANCE,status_counts=dict(Counter(r['conditional_status'] for r in rows)),
             false_reassurance_on_grid=sum(r['false_reassurance_on_grid'] for r in rows),
             false_underresolution_on_grid=sum(r['false_underresolution_on_grid'] for r in rows),
             sampled_peak_ratio_range=[min(r['sampled_peak_ratio'] for r in rows),max(r['sampled_peak_ratio'] for r in rows)],
             interpretation='Small workflow pilot, not validation of model adequacy or hidden-core prevalence.',
             limits=['Eight fixed spatial cutouts at one time; not independent statistical replications.',
                     'Reference is a 3^3 interior sampled maximum, not a continuum or isolated-vortex peak.',
                     'Small widths cannot test strong underresolution; no amplitude or profile selection was used.',
                     'Sampled, truncated Gaussian differs from the continuous observation operator.',
                     'Error tolerance is a diagnostic setting, not a bound on unknown model error.',
                     'Axes are fixed; the cutout mean is a frame convention, not validated background removal.'])
(ROOT/'data/dns_pilot_summary.json').write_text(json.dumps(summary,indent=2)+'\n')
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10,'axes.spines.top':False,'axes.spines.right':False,'pdf.fonttype':42})
fig,ax=plt.subplots(1,2,figsize=(9.2,3.8))
colors={'resolved':'#008677','underresolved':'#d55e00','indeterminate':'#9aa4af','model_inconsistent':'#9854a0'}
for frame,marker in [('laboratory','o'),('cutout_mean_subtracted','^')]:
    subset=[r for r in rows if r['frame']==frame]
    ax[0].scatter([r['width_cells'] for r in subset],[r['sampled_peak_ratio'] for r in subset],
                  c=[colors[r['conditional_status']] for r in subset],marker=marker,s=32,alpha=.75,
                  label='Laboratory frame' if frame=='laboratory' else 'Cutout mean subtracted')
ax[0].axhline(.9,color='#555',ls=':',lw=1)
ax[0].set(xlabel='Base Gaussian width / native grid spacing',ylabel='Interior sampled peak ratio',title='Eight small DNS cutouts')
ax[0].legend(frameon=False,fontsize=8)
states=list(summary['status_counts'])
ax[1].bar(range(len(states)),[summary['status_counts'][s] for s in states],color=[colors[s] for s in states])
ax[1].set_xticks(range(len(states)),[s.replace('_','\n') for s in states],fontsize=8)
ax[1].set(ylabel='Assessments',title='Conditional model output')
for i,s in enumerate(states):ax[1].text(i,summary['status_counts'][s]+.4,str(summary['status_counts'][s]),ha='center')
fig.suptitle('External-data pilot: a pipeline check, not evidence of hidden-core prevalence',fontsize=11)
fig.tight_layout()
fig.savefig(ROOT/'figures/05_dns_pilot.png',dpi=180,bbox_inches='tight')
fig.savefig(ROOT/'figures/05_dns_pilot.pdf',bbox_inches='tight')
plt.close(fig)
print(json.dumps(summary,indent=2))
