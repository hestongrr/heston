# Diagram library — changelog

Corrections are listed here as they're made. Figures are generated from code
(`pegeo.py` + the `make_*.py` scripts), so a fix is a one-line change and a re-run.

## 2026-07-29 — library started
- `seepage_flownet` — first release. Flow net computed by solving Laplace's equation for the
  head field and the stream function (red-black SOR), contoured at equal intervals.
  Shape factor Nf/Nd = 0.645 comes from the solution.
- `ep03_*` (soil nail pullout), `ep05_*` (Las Vegas caliche), `uscs_*` (soil classification) —
  first release.

### Fixed before release
- **`ep05_hillside_cut`** — first draft drilled the soil nails into the *downhill* side. Nails
  must anchor into the retained uphill mass. Geometry rebuilt with the slope rising to the left.
- **Flow-net practice problem** — first pass used the wrong datum and produced *negative* uplift
  pressure. Datum re-set at bedrock (ground surface z = 10 m, upstream total head 18 m). Uplift
  now runs 72.6 kPa at the heel to 5.9 kPa at the toe, 235 kN/m total.
- **`ep03_comparison`** — the correct bar was labelled with its value twice; changed the in-bar
  label to a check mark.

### Known limits (stated, not hidden)
- **Exit gradient at a sharp corner is singular**, so the computed i_e ≈ 2.7 in the seepage
  problem is mesh-dependent — a coarser net gives a smaller value. The conclusion (unsafe
  without a cutoff wall) is robust; the precise number is not.
- The cavity-detection simulator is a 2-D, 2nd-order isotropic elastic model — a teaching
  version of the 3-D elastic codes used in the original thesis work.

## Reporting an error
Found something wrong? heston.norcott@gmail.com — I'd rather fix it than have it sit there.
