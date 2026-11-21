# Security Certification Roadmap — Original-layout audit edition

**Status:** Draft, blocked from publication until lifecycle, pricing, and credibility verification is complete.

## Visual fidelity

The local-preview entrypoint is **`index.html`**. It is generated directly from the untouched upstream
`Security-Certification-Roadmap9.html`, not from a newly designed UI. This deliberately retains:

- Original CSS (including tile font weights, heights, sizes, widths, borders, typography, domain-specific outlines, and title styling).
- All nine original major domain columns and their existing subdomain headings, such as Cloud/SysOps, Unix/Linux, ICS/IoT, GRC, Forensics, Incident Handling, Penetration Testing, and Exploitation.
- All original grid spacers and 482 source tile positions, including their variable grid spans.
- The original link/tooltip presentation. The *information inside* tooltips is updated to identify provisional scores, issuer status, and verified acquisition price where available.
- Zero prices on visible tile faces.

**Intentional changes from original markup:**

1. Only certification tile *fill and contrasting label text* are driven by credibility. Score absent = black fill with white text; score present uses the green → yellow → orange → red gauge. Original domain container and subcategory colors remain unchanged.
2. Four difficulty tiers (**Expert / Advanced / Intermediate / Foundation**). Three narrow separators add space between tier bands; rows retain their original layout and membership.
3. Retired/in-abeyance tiles and the second visual occurrence of CIMP are hidden while preserving their original grid spaces. This avoids shifting neighboring tiles.
4. SC-500 replaces AZ-500 in the existing cell, SC-401 replaces SC-400 in the existing cell, and SecurityX replaces the CASP+ tile label. Other proposed additions remain in the JSON as planned additions pending an explicit position/layout decision.
5. A disabled remote static-image fallback is removed, so the actual chart displays directly from disk. External issuer URLs remain hyperlinks if clicked.
6. The original chart's bottom source count is updated to the active/displayed count and identifies the current draft status.

## Offline usage

```sh
git switch feature/audit-driven-roadmap-v1
git pull --ff-only
open index.html
```

No Python server, runtime JSON fetch, local web server, or installed frontend framework is required.
The chart is one standalone HTML file. On other operating systems, open `index.html` with a browser.

## Maintenance

**Source**: `Security-Certification-Roadmap9.html` (untouched upstream copy) and `data/certifications.json` (canonical master-audit snapshot).

**Build**:
```sh
node tools/build-standalone.mjs
node tools/validate-standalone.mjs
node tools/validate-data.mjs
node tools/check-publication.mjs
```

`build-standalone.mjs` regenerates `index.html` from the original and canonical data. This is required after changes to audit statuses, prices, scores, or placements; the HTML snapshot does not update itself automatically. `check-publication.mjs` intentionally exits nonzero while audit evidence is incomplete.

Audit master:
https://docs.google.com/spreadsheets/d/1XZurn69nC1RKBNWLdEl9hAlLsla6t-Wjhy9h7CzLVsk/edit

Upstream attribution:
https://github.com/PaulJerimy/SecCertRoadmapHTML

License remains CC BY-SA 4.0, retained from the original repository.

## Publication gate (2026-11-21)

The Google Sheet has a `Publication Gate` tab. Its last read showed 419 lifecycle statuses unverified and 440 records without a verified complete acquisition price (including inactive/planned records). The six existing credibility scores are provisional, not a completed evidence-backed credibility study. Neither source audit nor the updated HTML should be presented as a fully verified credential catalog.

These figures are a snapshot; the Google Sheet is authoritative for continuing review. The fork's `data/certifications.json` is a version-controlled export, not a live connection.

**Browser visual QA remains to be done**. Source markup and CSS fidelity checks establish preservation of layout structure, not pixel-accurate screenshots in every browser and viewport.

## Layout refinement — neutral headers and centered proficiency labels

- Keep the original domain labels, subtitles, and subcategory organization, but override heading/subtitle text to neutral charcoal, domain frames to neutral gray, and subcategory background fills to very light gray. Credibility-based tile fills are **not** affected.
- Increase foreground top offset from `4.8vmax` to `5.15vmax`, adding clearance between the Exploitation subtitle and the first OSEE tile.
- Preserve each original row position by replacing row-based rotated difficulty labels with equal-width spacer cells. Render an absolutely positioned four-band left-side axis that exactly follows the four vertical row groups: 6 / 7 / 8 / 6 rows, separated by the existing three narrow breaks. Each difficulty label is centered within its whole band.
- All modifications are in the generated standalone `index.html` and reproducible via `tools/build-standalone.mjs`.

## Tile border refinement

The original source CSS assigned category-colored borders to credential tiles. All audit-edition credential tiles now override those inherited colors with the same neutral gray (`#aeb4bd`); only tile fills and contrasting text indicate credibility. Original border thickness, tile widths, and domain grouping remain unchanged.

## Long certification labels

Labels too long for an original single-width tile (10 identified, including PECB 27005RM and PECB 27032CM) display as two centered lines. Only the second line is reduced to `0.43vmax` (with slight negative tracking); the first line retains the original font size. Tile positions, spans, domain mappings, colors and tooltip metadata remain unchanged. The build regenerates this formatting from the original source, rather than editing individual tile widths.
