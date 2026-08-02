# uscs-classify — ASTM D2487 classification for `groundhog`

A Python port of the USCS soil-classification algorithm from
[`uscs-soil-classification-calculator.html`](../uscs-soil-classification-calculator.html),
written to the conventions of the [`groundhog`](https://github.com/snakesonabrain/groundhog)
geotechnical library (GPL-3.0) and contributed upstream.

`groundhog` could only map a group symbol to its description before this
contribution; `uscs_classify()` is the missing step — classify a soil from
sieve and Atterberg data.

## Files

| File | Purpose |
|------|---------|
| `uscs_classify.py` | `uscs_classify()` — grain size + plasticity → group symbol, group name, and the full decision path |
| `test_uscs_classify.py` | 14 unit tests covering every branch of the decision tree |

## License

GPL-3.0-only (see [LICENSE](../LICENSE) and [LICENSING.md](../LICENSING.md)).
