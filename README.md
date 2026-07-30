# Heston Norcott — Engineering Tools & Portfolio

**Live at [thebigpicture.tech](https://thebigpicture.tech)**

Geotechnical & civil engineer (E.I., PE-Geotechnical 2026) who builds his own software and
applied-AI systems. This repository is the source of my portfolio site and its interactive
engineering tools — built from scratch, running entirely in the browser with no dependencies
and no build step.

## Interactive tools

| Tool | What it does |
|---|---|
| **[Surface-Wave Cavity Detection](https://thebigpicture.tech/cavity-detection-sim.html)**<br>`cavity-detection-sim.html` | A 2-D elastic (P-SV) staggered-grid finite-difference seismic simulator, built from my 2014 MS thesis, *"Finite-Difference Modeling of Surface-Wave Scattering for Shallow Cavity Detection"* (UNLV). Fire a seismic source and watch P (compressional), S (shear), and Rayleigh surface waves scatter off a shallow buried cavity — P and S isolated live by the divergence and curl of the wavefield. |
| **[Red Rock 3D Site Model](https://thebigpicture.tech/redrock-3d.html)**<br>`redrock-3d.html` | Real USGS elevation data of Red Rock Canyon, Nevada, rendered as an interactive 3-D site block — terrain surface, subsurface stratigraphy in the cut faces, and a graded building pad with engineered fill. Three.js, terrain data embedded. |
| **[Boring Log Generator](https://thebigpicture.tech/boring-log-generator.html)**<br>`boring-log-generator.html` | Enter soil strata, SPT N-values and groundwater depth; renders a professional USCS boring log with hatch patterns and an SPT plot, exportable to PNG. |
| **[SoilBox](https://thebigpicture.tech/soilbox.html)**<br>`soilbox.html` | A falling-sand physics toy running real soil behavior — sand slumps to its angle of repose, cohesive mud stands steeper, water seeks its level — with the underlying soil mechanics documented on the page. |

## Diagram library — `pe-diagrams/`

Original technical figures generated from code, solved from the physics where it matters.
`pegeo.py` is a shared drawing kit (palette plus geotechnical primitives — soil masses, strata,
water tables, failure wedges, pressure diagrams, dimensions and callouts) so every figure in the
set is consistent and a new one costs about twenty lines.

Highlight: **`seepage_flownet.png`** is a real flow net — Laplace's equation solved numerically
for both the head field and the stream function, then contoured at equal intervals, so the
curvilinear squares are actually square and the shape factor falls out of the solution.

Gallery: **[thebigpicture.tech/diagrams.html](https://thebigpicture.tech/diagrams.html)**

## How this is maintained

Free to look at, free to learn from. Figures are generated from code, so the geometry is explicit
and a correction is a one-line change and a re-run rather than a new edition. Where something can
be computed instead of approximated, it is. When I find an error — in my own work or in a source —
I fix it and say what it was; see [`pe-diagrams/CHANGELOG.md`](pe-diagrams/CHANGELOG.md), which
also states the known limits of each model up front. A reference nobody ever corrects isn't
careful, it's just quiet.

## What I do

Geotechnical consulting · Python automation for AEC · applied AI (self-hosted LLMs,
retrieval-augmented generation, agentic / MCP systems) · technical illustration.

Available for contract and expert work — details and contact at
**[thebigpicture.tech](https://thebigpicture.tech)**.

## License

© Heston Norcott. All rights reserved. Source is published for review and demonstration.
Contact me for licensing or custom builds.
