"""Acquire a pinned 128^3 DNS cutout; source velocity is not redistributed."""
from pathlib import Path
import sys, json, hashlib
from datetime import datetime, timezone
import h5py
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from acquire_public_sample import RangeReader

ROOT = Path(__file__).resolve().parent
CACHE = ROOT.parent / 'external_cache' / 'public_sample_128.npz'
REVISION = '9179e424e6eb75bcd89d3f608be795a633ccc1fa'
URL = ('https://huggingface.co/datasets/ArielLubonja/'
       'johns-hopkins-turbulence-database/resolve/' + REVISION +
       '/isotropic1024-coarse-velocity.h5')

if __name__ == '__main__':
    receipt = ROOT / 'data' / 'extended_provenance.json'
    if CACHE.exists() and receipt.exists():
        print('Verified cache already present.'); sys.exit(0)
    source = RangeReader(URL, 2015293800)
    with h5py.File(source, 'r') as handle:
        arr = np.ascontiguousarray(handle['Velocity_0001'][64:192,64:192,64:192,:], dtype=np.float32)
    prior = np.load(ROOT.parent / 'external_cache' / 'public_sample_64.npz')['velocity']
    assert arr.shape == (128,128,128,3) and np.isfinite(arr).all()
    assert np.array_equal(arr[32:96,32:96,32:96], prior), 'Exact overlap mismatch'
    np.savez_compressed(CACHE, velocity=arr)
    record = dict(source_url=URL, mirror_revision=REVISION, source_dataset='JHTDB isotropic1024coarse',
                  source_key='Velocity_0001', zero_based_start_zyx=[64]*3, shape=list(arr.shape),
                  array_order='z,y,x,component', exact_central_64_overlap=True,
                  velocity_float32_sha256=hashlib.sha256(arr.tobytes()).hexdigest(),
                  cache_sha256=hashlib.sha256(CACHE.read_bytes()).hexdigest(),
                  http_bytes_read=source.downloaded, acquired_at_utc=datetime.now(timezone.utc).isoformat())
    receipt.write_text(json.dumps(record, indent=2)+'\n')
    print(json.dumps(record, indent=2))
