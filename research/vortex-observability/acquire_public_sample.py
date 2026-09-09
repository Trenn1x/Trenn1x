"""Read one 64^3 velocity volume from a public JHTDB mirror using HTTP ranges.

No JHTDB account or private token is required. The public HDF5 snapshot is
attributed to its source; its metadata and a direct JHTDB cross-check are
recorded. Byte ranges are checked before reading to avoid a full 2 GB download.
"""
from pathlib import Path
import io,hashlib,json
from datetime import datetime,timezone
import requests,h5py,numpy as np
ROOT=Path(__file__).resolve().parent
DATASET='ArielLubonja/johns-hopkins-turbulence-database'
FILENAME='isotropic1024-coarse-velocity.h5'

class RangeReader(io.RawIOBase):
    def __init__(self,url,size):
        self.url=url;self.pos=0;self.size=size;self.cache={}
        self.session=requests.Session();self.downloaded=0
    def readable(self):return True
    def seekable(self):return True
    def tell(self):return self.pos
    def seek(self,offset,whence=0):
        self.pos=offset if whence==0 else self.pos+offset if whence==1 else self.size+offset
        if self.pos<0:raise ValueError('Negative file offset')
        return self.pos
    def readinto(self,b):
        data=self.read(len(b));b[:len(data)]=data;return len(data)
    def read(self,n=-1):
        if n<0:n=self.size-self.pos
        if n>100_000_000:raise ValueError('Unexpected oversized read')
        end=min(self.size,self.pos+n);pieces=[]
        while self.pos<end:
            block=self.pos//1048576;start=block*1048576;stop=min(start+1048576,self.size)-1
            if block not in self.cache:
                r=self.session.get(self.url,params={'range_start':start},headers={'Range':f'bytes={start}-{stop}'},timeout=60,stream=True)
                expected=f'bytes {start}-{stop}/{self.size}'
                if r.status_code!=206 or r.headers.get('Content-Range')!=expected:
                    r.close();raise ValueError('Server did not honor exact byte range')
                self.cache[block]=r.content;r.close();self.downloaded+=len(self.cache[block])
                print('Read bytes',self.downloaded,flush=True)
            piece=self.cache[block][self.pos-start:min(end,stop+1)-start]
            if not piece:raise IOError('Unexpected end of remote block')
            pieces.append(piece);self.pos+=len(piece)
        return b''.join(pieces)

if __name__=='__main__':
    cache=ROOT/'external_cache';cache.mkdir(exist_ok=True)
    path=cache/'public_sample_64.npz';receipt=ROOT/'data/public_sample_provenance.json'
    if path.exists() and receipt.exists():
        print('Using cached sample');raise SystemExit(0)
    revision='9179e424e6eb75bcd89d3f608be795a633ccc1fa'  # pinned release source
    tree=requests.get(f'https://huggingface.co/api/datasets/{DATASET}/tree/{revision}',timeout=40);tree.raise_for_status()
    info=next(x for x in tree.json() if x['path']==FILENAME)
    url=f'https://huggingface.co/datasets/{DATASET}/resolve/{revision}/{FILENAME}'
    source=RangeReader(url,info['size'])
    with h5py.File(source,'r') as h:
        arr=h['Velocity_0001'][96:160,96:160,96:160,:]
        attrs={k:str(v) for k,v in h.attrs.items()}
        print('Velocity read',arr.shape,flush=True)
    # Verify mirror values and axis order against a separately queried 3^3
    # native-grid sample. This is a source consistency check, not validation
    # of the full DNS solver or a new independent turbulence realization.
    params=dict(token='edu.jhu.pha.turbulence.testing-201406',function='velocity',dataset='isotropic1024coarse',xs=97,xe=99,ys=97,ye=99,zs=97,ze=99,ts=1,te=1,stridet=1,stridex=1,stridey=1,stridez=1,filter_width=1)
    check=requests.get('https://web.idies.jhu.edu/turbulence-svc/cutout/api/local',params=params,timeout=60);check.raise_for_status();obj=check.json()
    direct=np.asarray(next(iter(obj['data_vars'].values()))['data'],dtype=np.float32)
    prefix=arr[:3,:3,:3,:]
    same=np.array_equal(prefix,direct);transposed=np.array_equal(prefix.transpose(2,1,0,3),direct)
    if not (same or transposed):raise ValueError('Mirror failed direct JHTDB source check')
    if transposed and not same:arr=arr.transpose(2,1,0,3)
    arr=np.ascontiguousarray(arr,dtype=np.float32)
    assert arr.shape==(64,64,64,3) and np.isfinite(arr).all()
    np.savez_compressed(path,velocity=arr)
    record=dict(source_dataset='JHTDB isotropic1024coarse',mirror=f'https://huggingface.co/datasets/{DATASET}',mirror_revision=revision,source_file=FILENAME,source_file_metadata=info,source_attributes=attrs,time_index=1,start_xyz=[97,97,97],shape=list(arr.shape),array_order='z,y,x,component',source_transpose_applied=bool(transposed and not same),direct_check_shape=list(direct.shape),direct_check_exact_float32_match=True,direct_response_sha256=hashlib.sha256(check.content).hexdigest(),downloaded_utc=datetime.now(timezone.utc).isoformat(),http_bytes_read=source.downloaded,velocity_float32_sha256=hashlib.sha256(arr.tobytes()).hexdigest(),cache_sha256=hashlib.sha256(path.read_bytes()).hexdigest())
    receipt.write_text(json.dumps(record,indent=2)+'\n')
    print('Complete',json.dumps({'shape':record['shape'],'source_match':True,'bytes_read':source.downloaded}),flush=True)
