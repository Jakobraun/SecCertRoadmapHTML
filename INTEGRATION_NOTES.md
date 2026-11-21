# Audit-driven roadmap integration (draft v1)

This branch introduces a new `index.html` experience **without deleting or editing** the upstream `Security-Certification-Roadmap9.html` page. It is a working preview, not a production-verified credential directory.

## Source of truth

- Master audit: https://docs.google.com/spreadsheets/d/1XZurn69nC1RKBNWLdEl9hAlLsla6t-Wjhy9h7CzLVsk/edit
- Source inventory: https://github.com/PaulJerimy/SecCertRoadmap/blob/main/data/certificates.json
- Generated canonical snapshot: `data/certifications.json` (schemaVersion 1, generated 2026-11-21)
- Original HTML is preserved under its original filename; attribution and existing CC BY-SA 4.0 LICENSE.txt remain in the repository.

The JSON is a **snapshot** of the audit, not a live Google Sheets connection. Future revisions require exporting/reconciling the spreadsheet into the JSON. Do not edit the generated JSON and spreadsheet independently without tracking the divergence.

## Canonical record and domain rules

- One `certifications[]` object for each **distinct credential**, with stable `id` and `sourceIds` references back to the original 482 records and six approved additions.
- CIMP is a true duplicate source label and is consolidated into one credential retaining both original IDs and domains.
- CCSE and CCSA each denote **two distinct credentials from different issuers**. These are *acronym collisions*, not duplicates, and are preserved as separate records and tiles.
- `domains[]` may include multiple domains. With all domains shown, each credential renders **once** under `primaryDomain`. Selecting a domain includes credentials mapped to it through secondary domains, with no duplicate tile in that filtered view.
- The source includes `subdomain` and extra domain tags; there is no invented cross-domain issuer recognition.

## Proficiency, price, credibility

- Proficiency is an **independent** integer 1–4: Foundation, Intermediate, Advanced, Expert. The initial bulk migration uses the master audit's proposed tier, which largely translates legacy Y position; most individual proficiency positions still need syllabus review.
- Tiles show **one acquisition price only when the lowest pathway has been separately checked**. Legacy-tooltip prices are retained as `legacyPriceUSD` and labeled unverified in the details panel, never shown as current tile prices. Unknown price = no tile price.
- Credibility is the only source of tile fill color. Blank score = **black with white text**. Provisional scores use: 80–100 green, 65–79 light green, 50–64 yellow, 35–49 orange, 0–34 red. Foreground text switches to white or dark as appropriate.
- Only six entries currently have provisional credibility scores; these are explicitly *not* a completed employer-recognition study and should not be interpreted as final evidence-backed ratings.
- Status `Retired` or `In abeyance` is excluded from the default chart but retained in the data as an archive. Check **Show archived / retired** to inspect them.
- Unverified legacy lifecycle is **not** evidence of current availability.

## Preview

At the repository root:

```sh
python -m http.server 8000
```

Open http://localhost:8000/ . A local HTTP server is required because browsers commonly block `fetch()` from `file://`. This page uses no external JavaScript dependencies.

Run the JSON integrity check:

```sh
node tools/validate-data.mjs
```

For GitHub Pages, configure Pages to serve from the repository root of the desired published branch (usually after merging this PR to `main`). Opening the GitHub repository URL itself does not host the page.

## Known limitations / next audit work

1. Only 18 source credentials have individually targeted lifecycle/name treatment in the working audit; unknown lifecycle remains explicitly unverified.
2. Verified price and renewal fields are sparse. Legacy amounts do not appear as current prices.
3. Current credibility scores are provisional, not yet supported by a full weighted employer/job-market measurement.
4. Original chart had subdomains packed within larger columns; the first iteration uses major domain columns with secondary-domain filtering rather than pixel-exact original positioning.
5. No edit-in-browser or synchronization with Google Sheets is implemented. JSON is version-controlled and deployable as static data.
6. The original CCSE/CCSA acronym-collision error in the initial audit has been corrected in the Google Sheet and is prevented by the canonical data.

## Files

- `index.html`: application shell and filters
- `assets/roadmap.css`: compact chart layout + contrast-safe credibility palette
- `assets/roadmap.js`: rendering, filtering, and details
- `data/certifications.json`: audit-derived canonical source snapshot
- `tools/validate-data.mjs`: dataset integrity checks
- `Security-Certification-Roadmap9.html`: upstream static chart, unchanged

## Revision 2 — Original-density review and publication hold (2026-11-21)

Review feedback is incorporated on this branch:

- Default roadmap shows only the **nine original populated top-level domain groups**. AI / ML / LLM Security and Cloud/SysOps remain queryable as planned/secondary mappings, not permanent sparse columns.
- **SC-500 replaces AZ-500** in the original Security Architecture and Engineering domain; **SC-401 replaces SC-400** in original Security Operations. Extra mappings remain metadata.
- Tile spans use each matching anchor's original CSS grid span from the 2024 HTML when available. Rows are repacked into four bands; pixel-perfect source X/Y coordinates are not preserved.
- Dense CSS removes broad card padding, uses 43 proportional grid units plus proficiency labels, and uses a viewport-fitting tile-height calculation. Normal page scrolling and horizontal chart scrolling are disabled for the default desktop layout. Prices remain in hover/details, as in the original roadmap.
- **Browser visual QA is still required** across different screen resolutions; source/layout checks do not establish actual browser fit. At very small screens a dense chart necessarily reduces text size or sacrifices space.
- Google Sheets now includes a **Publication Gate** tab. At this point **419 source records still have unverified lifecycle** and **439 audit rows lack verified acquisition prices**; the cost count includes archived/planned rows and may contain justified exemptions. This is an explicit release blocker.
- Pricing/lifecycle were newly checked for 61 rows against issuer materials (mainly GIAC price roster, Microsoft, OffSec, CSA, ISACA and Palo Alto). Forty-eight currently have individually verified numeric acquisition prices; one previously estimated AAISM price was cleared because the full required pathway was not established. No estimate was silently converted from the legacy tooltip.
- Final publication must wait until status and minimum full-pathway pricing for every active displayed credential are reviewed, documented, and reflected in both the master Sheet and JSON. Entries not independently verified stay marked unverified and must not be represented as confirmed active/current.
- Do not merge this draft pull request just because the UI code is structurally functional; this is a **data audit and browser QA hold**.

To update the local preview from this branch:

```sh
git pull origin feature/audit-driven-roadmap-v1
python3 -m http.server 8000
```

Reload `http://localhost:8000/` with the browser cache bypassed. The page's JSON is fetched with `cache: "no-store"`.
