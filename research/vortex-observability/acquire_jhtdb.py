"""Acquire eight separate 15^3 DNS pilot cutouts using JHTDB's public test token.

Each request is 3,375 points, below the documented 4,096-point testing limit.
This small pilot does not assemble a larger cutout from subdivided requests.
For a substantive large-volume study, obtain a personal JHTDB token.
Reference client: sciserver/giverny, givernylocal turbulence_toolkit.py.
"""
from pathlib import Path
from itertools import product
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
import numpy as np
import requests

ROOT=Path(__file__).resolve().parent
CACHE=ROOT/'external_cache'
CACHE.mkdir(exist_ok=True)
ENDPOINT='https://web.idies.jhu.edu/turbulence-svc/cutout/api/local'
TOKEN='edu.jhu.pha.turbulence.testing-201406'
STARTS=list(product((129,641),repeat=3))


def acquire(start):
    x,y,z=start
    label=f'x{x}_y{y}_z{z}'
    output=CACHE/f'{label}.npz'
    receipt=CACHE/f'{label}.json'
    if output.exists() and receipt.exists():
        return json.loads(receipt.read_text())
    params=dict(token=TOKEN,function='velocity',dataset='isotropic1024coarse',
                xs=x,xe=x+14,ys=y,ye=y+14,zs=z,ze=z+14,ts=1,te=1,
                stridet=1,stridex=1,stridey=1,stridez=1,filter_width=1)
    response=requests.get(ENDPOINT,params=params,timeout=60)
    response.raise_for_status()
    obj=response.json()
    name=next(iter(obj['data_vars']))
    velocity=np.asarray(obj['data_vars'][name]['data'],dtype=np.float32)
    assert velocity.shape==(15,15,15,3) and np.isfinite(velocity).all()
    coords={key:np.asarray(value['data']) for key,value in obj['coords'].items()}
    np.savez_compressed(output,velocity=velocity,**coords)
    result=dict(label=label,start_xyz=start,points=3375,dataset='isotropic1024coarse',
                time_index=1,variable=name,shape=list(velocity.shape),
                coordinate_order=obj['data_vars'][name]['dims'],
                downloaded_utc=datetime.now(timezone.utc).isoformat(),
                response_sha256=hashlib.sha256(response.content).hexdigest(),
                velocity_float32_sha256=hashlib.sha256(velocity.tobytes()).hexdigest(),
                cache_sha256=hashlib.sha256(output.read_bytes()).hexdigest(),
                source_attributes=obj['attrs'],endpoint=ENDPOINT,
                public_token_documentation='https://turbulence.idies.jhu.edu/database')
    receipt.write_text(json.dumps(result,indent=2)+'\n')
    print('Acquired',label,flush=True)
    return result


if __name__=='__main__':
    with ThreadPoolExecutor(max_workers=2) as pool:
        receipts=list(pool.map(acquire,STARTS))
    (ROOT/'data/jhtdb_provenance.json').write_text(json.dumps(receipts,indent=2)+'\n')
    print('Complete:',len(receipts),'cutouts;',sum(x['points'] for x in receipts),'points')
