"""Run the frozen field-of-view follow-up. All DNS outcomes are exploratory."""
from pathlib import Path
import sys, csv, json, hashlib
from collections import Counter
import numpy as np
from scipy.ndimage import gaussian_filter, maximum_filter
from scipy.optimize import minimize_scalar
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from vortex_observability import resolution_certificate, retention, velocity, filtered_peak
ROOT = Path(__file__).resolve().parent
WIDTHS = (.5, 1., 1.5, 2.)

def q_field(u):
    # J_ij = d u_i / d x_j; array axes z,y,x, components x,y,z.
    J = np.stack([np.stack(np.gradient(u[..., i], edge_order=2)[::-1], axis=-1)
                  for i in range(3)], axis=-2)
    S = .5*(J + J.swapaxes(-1,-2)); O = .5*(J-J.swapaxes(-1,-2))
    return .5*((O*O).sum(axis=(-2,-1))-(S*S).sum(axis=(-2,-1)))

def peak_info(speed, center, radius, odd=True):
    start = np.asarray(center)-radius
    stop = np.asarray(center)+radius+int(odd)
    assert np.all(start >= 24) and np.all(stop <= np.asarray(speed.shape)-24)
    roi = tuple(slice(int(a),int(b)) for a,b in zip(start,stop))
    a = speed[roi]; local=np.asarray(np.unravel_index(a.argmax(),a.shape))
    return dict(value=float(a.max()), position=list(map(int,local+start)),
                edge=int(np.minimum(local,np.asarray(a.shape)-1-local).min()))

def filtered_speeds(u, w, truncate):
    sigmas=[(w,w,w),(w,2*w,2*w),(2*w,w,w),(1.5*w,)*3,(2*w,)*3]
    return [np.linalg.norm(gaussian_filter(u, sigma=(*s,0),mode='constant',
                         cval=0,truncate=truncate),axis=-1) for s in sigmas]

def heldout_interval(cert, m0, eps, multiplier, w):
    if cert['status']=='model_inconsistent':return None
    ar,br=cert['radial'],cert['axial']
    def relative(a,b):
        def f(s,p):
            if np.isinf(s):return 1.
            return ((s*s+w*w)/(s*s+(multiplier*w)**2))**p
        return f(a,1.5)*f(b,.5)
    return [max(0,m0-eps)*relative(ar['lower'],br['lower']),
            (m0+eps)*relative(ar['upper'],br['upper'])]

def candidates(u):
    speed=np.linalg.norm(u,axis=-1); q=q_field(u)
    mask=(speed==maximum_filter(speed,size=3,mode='constant'))&(q>0)
    allowed=np.zeros_like(mask);allowed[44:-44,44:-44,44:-44]=True
    coords=np.argwhere(mask&allowed)
    ordered=sorted(coords.tolist(),key=lambda c:(-float(speed[tuple(c)]),*c))
    picked=[]
    for c in ordered:
        if all(np.linalg.norm(np.asarray(c)-p)>=16 for p in picked):picked.append(c)
        if len(picked)==12:break
    return picked,[dict(center=c,speed=float(speed[tuple(c)]),Q=float(q[tuple(c)])) for c in picked],len(ordered)

def write_csv(name, rows):
    if not rows:
        (ROOT/'data'/name).write_text('no_eligible_candidates\n');return
    keys=list(dict.fromkeys(k for r in rows for k in r))
    with (ROOT/'data'/name).open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=keys);w.writeheader();w.writerows(rows)

def controls():
    z,y,x=np.meshgrid(np.arange(-3.,4),np.arange(-3.,4),np.arange(-3.,4),indexing='ij')
    rotation=np.stack((-y,x,0*x),axis=-1);strain=np.stack((x,-y,0*x),axis=-1)
    assert np.allclose(q_field(rotation),1) and np.allclose(q_field(strain),-1)
    rows=[]
    # Analytic peak controls use the same certificate and held-out predictor.
    for name,a,b,w in [('resolved_single',10.,10.,1.),('underresolved_single',2.,2.,1.)]:
        peaks=[filtered_peak(a,b,1.,r,z) for r,z in [(w,w),(2*w,w),(w,2*w)]]
        cert=resolution_certificate(peaks,[1e-4]*3,w,w)
        rows.append(dict(name=name,actual_ratio=peaks[0],status=cert['status'],
                         expected_status='resolved' if name=='resolved_single' else 'underresolved'))
        assert cert['status']==rows[-1]['expected_status']
        for m in (1.5,2.):
            lo,hi=heldout_interval(cert,peaks[0],1e-4,m,w)
            assert lo <= filtered_peak(a,b,1.,m*w,m*w) <= hi
    # Broad+narrow benchmark with a core resolved on the evaluation grid.
    grid=np.arange(0,40.0001,.125)
    def radial(r,d,e):
        result=0.*np.asarray(r)
        for a,p in [(10.,1.),(.5,3.)]:
            A=np.hypot(a,d); B=np.hypot(a,e); M=filtered_peak(a,a,p,d,e)
            result+=M*r/A*np.exp(.5-r*r/(2*A*A))
        return result
    ref=float(radial(grid,0,0).max()); w=2.
    peaks=[float(radial(grid,d,e).max()) for d,e in [(w,w),(2*w,w),(w,2*w)]]
    cert=resolution_certificate(peaks,[1e-4*ref]*3,w,w)
    residuals=[]
    for m in (1.5,2.):
        interval=heldout_interval(cert,peaks[0],1e-4*ref,m,w)
        value=float(radial(grid,m*w,m*w).max())
        residuals.append(None if interval is None else max(interval[0]-value,value-interval[1],0)/ref)
    rows.append(dict(name='hidden_core_sampled_analytic_filter',actual_ratio=peaks[0]/ref,
                     status=cert['status'],false_reassurance=cert['status']=='resolved' and peaks[0]/ref<.9,
                     heldout_max_miss=max(x for x in residuals if x is not None),
                     sample_spacing=.125,core_radius=.5))
    # Independent sampled convolution for operator sensitivity, not an inferred error bound.
    axis=np.arange(-32.,32.01,.5);zz,yy,xx=np.meshgrid(axis,axis,axis,indexing='ij')
    u=velocity(xx,yy,zz,3.,4.,1.)
    sampled=np.linalg.norm(gaussian_filter(u,sigma=(2.,2.,2.,0),mode='constant',truncate=6),axis=-1).max()
    exact=filtered_peak(3.,4.,1.,1.,1.)
    rows.append(dict(name='sampled_convolution_single',sampled_peak=float(sampled),
                     analytic_continuum_peak=exact,relative_difference=float(sampled/exact-1)))
    write_csv('controls.csv',rows)
    return rows

def main():
    frozen=json.loads((ROOT/'data/protocol_freeze.json').read_text())
    assert hashlib.sha256((ROOT/'PROTOCOL.md').read_bytes()).hexdigest()==frozen['protocol_sha256']
    control_results=controls()
    original=np.load(ROOT.parent/'external_cache/public_sample_128.npz')['velocity'].astype(float)
    previous=np.load(ROOT.parent/'external_cache/public_sample_64.npz')['velocity'].astype(float)
    backgrounds={'laboratory':np.zeros(3),'original_64_mean_subtracted':previous.mean(axis=(0,1,2)),
                 'expanded_128_mean_subtracted':original.mean(axis=(0,1,2))}
    central=[];events=[];selection={}; peakrows=[]
    for frame,background in backgrounds.items():
        print('Frame',frame,flush=True)
        u=original-background;native=np.linalg.norm(u,axis=-1)
        centers,selected,total=candidates(u)
        selection[frame]=dict(background=background.tolist(),candidate_count_before_separation=total,
                              selected=selected,distinct_candidates=len(centers))
        central_native=[peak_info(native,[64]*3,r,False) for r in (16,24,32)]
        for w in WIDTHS:
            fields=filtered_speeds(u,w,6.); fields4=filtered_speeds(u,w,4.)
            cp=[[peak_info(f,[64]*3,r,False) for f in [native,*fields]] for r in (16,24,32)]
            stable=abs(cp[-1][0]['value']/cp[-2][0]['value']-1)<=.01
            for k,radius in enumerate((16,24,32)):
                vals=[v['value'] for v in cp[k]];ref=vals[0];eps=1e-4*ref
                cert=resolution_certificate(vals[1:4],[eps]*3,w,w)
                central.append(dict(frame=frame,width=w,region_side=2*radius,reference=ref,
                     reference_position=str(cp[k][0]['position']),reference_edge_cells=cp[k][0]['edge'],
                     sampled_ratio=vals[1]/ref,status=cert['status'],lower=cert.get('retention_lower'),
                     upper=cert.get('retention_upper'),false_reassurance=cert['status']=='resolved' and vals[1]/ref<.9,
                     largest_reference_stable=stable,reference_eligible=bool(stable and cp[k][0]['edge']>=4)))
                for j,info in enumerate(cp[k]):peakrows.append(dict(kind='central',frame=frame,width=w,
                     center='64_64_64',region_side=2*radius,field=j,**info))
            for index,c in enumerate(centers):
                nested=[[peak_info(f,c,r) for f in [native,*fields]] for r in (8,12,16)]
                vals=np.array([p['value'] for p in nested[-1]]);ref=vals[0];eps=1e-4*ref
                medium=np.array([p['value'] for p in nested[-2]])
                change=float(np.max(np.abs(vals/medium-1)))
                edge=min(p['edge'] for p in nested[-1])
                cert=resolution_certificate(vals[1:4].tolist(),[eps]*3,w,w)
                misses=[]
                for j,m in enumerate((1.5,2.)):
                    interval=heldout_interval(cert,vals[1],eps,m,w)
                    misses.append(float('inf') if interval is None else max(interval[0]-vals[4+j],vals[4+j]-interval[1],0)/ref)
                trunc=max(abs(peak_info(f,c,16)['value']-vals[j+1])/ref for j,f in enumerate(fields4))
                row=dict(frame=frame,event=index,center=str(c),width=w,reference=ref,
                     sampled_ratio=vals[1]/ref,status=cert['status'],lower=cert.get('retention_lower'),upper=cert.get('retention_upper'),
                     interval_covers_sampled_ratio=bool(cert.get('retention_lower',float('inf'))<=vals[1]/ref<=cert.get('retention_upper',-float('inf'))),
                     false_reassurance=bool(cert['status']=='resolved' and vals[1]/ref<.9),
                     minimum_edge_cells=edge,max_relative_expansion_change=change,heldout_relative_miss=max(misses),
                     truncation_relative_change=trunc)
                for tol in (.005,.01,.02):
                    key=str(tol);passed=edge>=4 and change<=tol and max(misses)<=tol
                    row['screen_pass_'+key]=bool(passed)
                    row['screen_status_'+key]=cert['status'] if passed else 'abstain'
                events.append(row)
                for k,r in enumerate((8,12,16)):
                    for j,info in enumerate(nested[k]):peakrows.append(dict(kind='event',frame=frame,width=w,
                         center=str(c),region_side=2*r+1,field=j,**info))
            del fields,fields4
    summary=dict(volume_count=1,independent_replication=False,protocol=frozen,selection=selection,
                 central_assessments=len(central),event_assessments=len(events),controls=control_results,
                 event_raw_statuses=dict(Counter(r['status'] for r in events)),
                 event_raw_false_reassurance=sum(r['false_reassurance'] for r in events),
                 sensitivity={str(t):dict(statuses=dict(Counter(r['screen_status_'+str(t)] for r in events)),
                    eligible=sum(r['screen_pass_'+str(t)] for r in events),
                    false_reassurance=sum(r['false_reassurance'] and r['screen_pass_'+str(t)] for r in events)) for t in (.005,.01,.02)})
    write_csv('central_expansion.csv',central);write_csv('event_assessments.csv',events);write_csv('peak_locations.csv',peakrows)
    (ROOT/'data/summary.json').write_text(json.dumps(summary,indent=2,allow_nan=False)+'\n')
    fig,axes=plt.subplots(1,2,figsize=(10,4.2))
    for frame,marker in zip(backgrounds,('o','s','^')):
        rr=[r for r in central if r['frame']==frame and r['width']==2]
        axes[0].plot([r['region_side'] for r in rr],[r['sampled_ratio'] for r in rr],marker=marker,label=frame.replace('_',' '))
    axes[0].axhline(.9,color='gray',ls=':');axes[0].set(xlabel='Evaluation cube side (grid cells)',ylabel='Sampled peak ratio',title='Fixed width: 2 grid cells')
    axes[0].legend(fontsize=7,frameon=False)
    if events:
        axes[1].scatter([r['max_relative_expansion_change'] for r in events],[r['sampled_ratio'] for r in events],
             c=['#b44725' if r['false_reassurance'] else '#087f8c' for r in events],s=25)
        axes[1].axvline(.01,color='gray',ls=':');axes[1].axhline(.9,color='gray',ls=':')
    else:axes[1].text(.5,.5,'No eligible native candidates',ha='center',transform=axes[1].transAxes)
    axes[1].set(xlabel='Largest peak change on region expansion',ylabel='Sampled peak ratio',title='Selected local candidates')
    fig.suptitle('Field-of-view follow-up: one DNS snapshot');fig.tight_layout()
    fig.savefig(ROOT/'figures/fov_followup.png',dpi=180);fig.savefig(ROOT/'figures/fov_followup.pdf');plt.close(fig)
    print(json.dumps({k:v for k,v in summary.items() if k not in ('selection','controls')},indent=2))

if __name__=='__main__':main()
