# Data provenance

## Original analytic and synthetic results

`data/` and `figures/` contain results computed by the included scripts.
The hidden-core example is constructed analytically. It is not an observed
Navier-Stokes blowup or a measured experimental vortex.

## External DNS pilot

Eight 15 × 15 × 15 velocity cutouts came from the Johns Hopkins Turbulence
Database (JHTDB), dataset `isotropic1024coarse`, time index 1. The starts in
one-based `(x,y,z)` grid coordinates are the eight combinations of 129 and
641. Source array order is `(z,y,x,component)`.

- [JHTDB home](https://turbulence.idies.jhu.edu/home)
- [Isotropic dataset description](https://turbulence.idies.jhu.edu/datasets/homogeneousTurbulence/isotropic)
- [Access and public testing identifier](https://turbulence.idies.jhu.edu/database)
- [Official Giverny client](https://github.com/sciserver/giverny)

`acquire_jhtdb.py` retrieves the cutouts using the documented public testing
identifier. Each request contains 3,375 points and stays within the documented
4,096-point testing limit. These separated cutouts are not assembled into a
larger volume. The identifier in the script is public, not a private credential.

`data/jhtdb_provenance.json` records source metadata, spatial indices,
retrieval timestamps, and SHA-256 hashes. Source velocity files are cached
locally and excluded from the public archive; the downloader reconstructs
them. Reported aggregate measurements and figures are derived results.
JHTDB source data and third-party publications are not relicensed by this
package's code license. Credit for the DNS belongs to the source creators.

## Larger public sample

A further 64³ velocity volume, source indices 97 through 160 inclusive on
all three axes at time index 1, was read from the public
[ArielLubonja JHTDB subset](https://huggingface.co/datasets/ArielLubonja/johns-hopkins-turbulence-database).
The source is a 256³, ten-snapshot HDF5 velocity file. Only the required byte
ranges were read, totaling 17,825,792 bytes. The source repository revision,
full-file LFS hash (reported by the host, not independently recomputed),
array hash, and metadata are recorded in `data/public_sample_provenance.json`.

The source mirror reports JHTDB provenance. An independently queried 3³
prefix matched the mirror sample exactly after conversion to float32 and
confirmed the `(z,y,x,component)` order. This checks the sampled source
consistency; it does not independently validate the DNS simulation or every
value in the mirror.

Run `python acquire_public_sample.py` to reproduce acquisition. The mirror
revision used in this release is
`9179e424e6eb75bcd89d3f608be795a633ccc1fa`. The cached source array is excluded
from the public archive. The mirror card declares MIT; this package does not
assert authority to relicense the original JHTDB data.
