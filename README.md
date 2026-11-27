# MICTer cover letter website

This static site accompanies the MICTer manuscript. It brings together the cover letter, Figures 2–6, and five interactive reconstructions in manuscript order.

Open `index.html` directly, or run a local server from the repository root and visit `http://localhost:8765`.

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

## Interactive reconstructions

| Figure | Time course | Playback | Score samples |
| --- | --- | --- | --- |
| 2 | Definitive endoderm, GSE75748 | 300 frames over 0–96 h | 161 over 0–96 h |
| 3 | Targeted iPSC differentiation | 102 frames over Day 0–5, including Day 2.325 | 201 over Day 0–5 |
| 4 | EMT/MET | 100 frames over Day 0–30 | 231 over Day 7–30 |
| 5 | Pancreatic endocrine differentiation, GSE114412 | 41 frames over Day 0–4 | 141 over Day 0.5–4 |
| 6 | Cardiac differentiation, GSE175634 | 71 frames over Day 0–7 | 261 over Day 0.5–7 |

The playback uses cached particle coordinates. The score chart reveals the available curve through the selected frame time. The [interactive data guide](docs/interactive-data.md) records cache sources, sample counts, projections, and score conventions.

## Repository layout

- [`index.html`](index.html) and [`styles.css`](styles.css) define the page and layout.
- [`dataset-config.js`](dataset-config.js) defines the dataset order, labels, axes, and playback settings. [`interactive.js`](interactive.js) renders the population and score panels.
- [`script.js`](script.js) and [`figure-config.js`](figure-config.js) support site navigation, the cover letter, and the figure browser.
- [`assets/`](assets/) holds the static preview and PDF bundle exported on 13 November 2026. The [figure index](docs/figure_index.md) and [asset manifest](docs/asset-manifest.json) record each source.
- [`downloads/scMICTer_cover_letter.txt`](downloads/scMICTer_cover_letter.txt) is the plain-text cover letter. The page also offers a print view.

The page loads its data and styles locally. To regenerate the static main-figure previews and PDFs, run `python3 tools/build_assets.py` from the repository root with Pillow and the 13 November Illustrator export bundle available.
