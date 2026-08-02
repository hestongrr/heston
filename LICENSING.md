# Licensing

This repository is **dual-licensed** by scope. Most of it is all-rights-reserved
portfolio work; a small, explicitly marked subset is free software under the
GNU General Public License version 3.

## GPL-3.0 — the contributable code

The following are licensed under the **GNU General Public License v3.0**
(see [`LICENSE`](LICENSE)) and are free for use, modification, and
distribution under its terms:

- **The USCS soil-classification logic** — the ASTM D2487 classification
  algorithm in [`uscs-soil-classification-calculator.html`](uscs-soil-classification-calculator.html)
  and its Python port in [`uscs-classify/`](uscs-classify/).

This code is contributed to the open-source geotechnical Python library
[`groundhog`](https://github.com/snakesonabrain/groundhog) (GPL-3.0), which
could not classify soils from grain-size and plasticity data before the port.
Each contributable file carries an `SPDX-License-Identifier: GPL-3.0-only`
marker.

## All rights reserved — the rest

Everything else in this repository — the other interactive tools, 3D models,
diagrams, figures, blog posts, and site content — remains **© Heston Norcott.
All rights reserved.** Source is published for review and demonstration. Contact
the author for licensing or custom builds.

## Why it is split this way

The portfolio tools are commercial work product (they are offered for licensing
to engineering firms), so they stay reserved. The classification logic is the
piece being contributed upstream to a GPL-3.0 project, so it is licensed to
match. The line between the two is drawn at file level and marked with SPDX
headers; if you are unsure whether a file is covered, check its header or ask.
