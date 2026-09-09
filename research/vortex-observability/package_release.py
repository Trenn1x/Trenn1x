"""Build the public source archive and a SHA-256 manifest from an allowlist."""
from pathlib import Path
import hashlib,json,zipfile
ROOT=Path(__file__).resolve().parent
TOP=['README.md','manuscript.md','manuscript.tex','REVIEW.md','EXTERNAL_VALIDATION.md','DATA_SOURCES.md','STUDY_PROTOCOL.md','LICENSE','CITATION.cff','.zenodo.json','.gitignore','requirements.txt','vortex_observability.py','reproduce.py','review_audit.py','build_paper.py','acquire_jhtdb.py','dns_pilot.py','acquire_public_sample.py','dns_extended.py','dns_fov_check.py','package_release.py']
paths=[ROOT/p for p in TOP]
paths += sorted((ROOT/'data').glob('*.json'))+sorted((ROOT/'data').glob('*.csv'))
paths += sorted((ROOT/'figures').glob('*.png'))+sorted((ROOT/'figures').glob('*.pdf'))
paths += [ROOT/'output/Finite_Resolution_Vortices.pdf']
assert all(p.is_file() for p in paths)
entries=[dict(path=p.relative_to(ROOT).as_posix(),bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest()) for p in paths]
manifest=dict(version='0.3.0',date='2026-09-09',description='Original research release. Source velocity caches, third-party full texts, temporary work, and private outreach are excluded.',files=entries)
(ROOT/'MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n')
archive=ROOT/'output/Finite_Resolution_Research_Package.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
    for p in paths+[ROOT/'MANIFEST.json']:z.write(p,'vortex-observability/'+p.relative_to(ROOT).as_posix())
with zipfile.ZipFile(archive) as z:assert z.testzip() is None
print(json.dumps({'archive':str(archive),'members':len(paths)+1,'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest()}))
