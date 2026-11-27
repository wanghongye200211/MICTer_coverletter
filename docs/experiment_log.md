# Work log

## 2026-10-05

- Created a local static cover based on the stCTDcover reference structure.
- Reused approved Figure 2, nine supplements and the existing native schematic.
- Converted cached score and population coordinates into browser data.
- Prepared a journal-neutral English cover letter from the saved manuscript.
- No training, new experiments, manuscript edits or public deployment.

## 2026-11-13 to 2026-11-17

- Added the static Figures 2–6 bundle and organized the site in manuscript order.
- JasonTangzoro supplied the endoderm and EMT/MET caches in [PR #1](https://github.com/wanghongye200211/MICTer_coverletter/pull/1).
- wly-yyy added the pancreatic and cardiac caches in [PR #2](https://github.com/wanghongye200211/MICTer_coverletter/pull/2) and densified the population display to 0.1-day frames.
- Added the Day 2.325 targeted iPSC snapshot and synchronized population and score playback. [Source commit](https://github.com/wanghongye200211/MICTer_coverletter/commit/5fdd1429b514920036f84e039e60906db94dcd11)

## 2026-11-27

- Integrated the denser endoderm and EMT/MET caches from JasonTangzoro's [PR #4](https://github.com/wanghongye200211/MICTer_coverletter/pull/4). Endoderm now plays 300 frames over 0–96 h. EMT/MET plays 100 frames over Day 0–30, with the trailing-window score beginning on Day 7 and peaking on Day 22.3.
- Extracted the dataset settings and player into dedicated scripts, with the five existing data-script paths retained for direct browser access.
- Recorded the input provenance and score conventions in the [interactive data guide](interactive-data.md).
