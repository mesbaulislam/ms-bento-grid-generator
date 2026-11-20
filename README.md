# MS Bento Grid Generator

A free, standalone Adobe Illustrator ExtendScript (`.jsx`) that generates
professional, fully editable Bento-style grid layouts directly inside
Illustrator. No plugin, no login, no internet connection.

- **Version:** 1.0.0
- **Author:** MS (Mesbaul Islam)
- **Compatible:** Adobe Illustrator CS6 and later (Windows / macOS)
- **Language:** ExtendScript — ES3-compatible JavaScript only
- **Licence:** Free for personal and commercial design use. No attribution
  required.

## What it does

Pick a preset in a ScriptUI dialog, click **Generate Grid**, and the
script draws a non-overlapping Bento layout of native, editable vector
rectangles on a layer named **`MS Bento Grid`**. Every cell stays
individually editable — nothing is rasterized or flattened. The dialog
stays open after generating, so you can iterate without re-running the
script.

```
MS_Bento_Grid_Generator.jsx
  → ScriptUI dialog (preset, grid, fill, stroke)
  → seeded occupancy-grid tiling (no overlaps, no gaps, in bounds)
  → native rectangles / rounded rectangles on layer "MS Bento Grid"
```

## Features

### Dialog controls

- Grid Width and Height (pt) — defaults to the active artboard size
  minus 2× Margin.
- Columns (1–20) and Rows (1–20).
- Gap / Gutter (pt, 0 or more), Outer Margin (pt, 0 or more),
  Corner Radius (pt, 0 or more — clamped per cell to half the smaller
  side, so Illustrator never gets an invalid radius).
- Minimum and Maximum Cell Size (pt, soft limits — see Limitations).
- Fill: No Fill / Solid Fill / Preset Palette.
- Colour palettes: Soft Pastel, Bold & Vibrant, Monochrome, Warm
  Sunset, Cool Ocean, Forest.
- Stroke: on/off, width (pt), colour (Black / White / Dark Gray /
  Light Gray).
- Buttons: **Randomize Layout**, **Generate Grid**,
  **Regenerate Layout**, **Reset Settings**, **Cancel**.
- Seed display (`Seed: 12345`) — same seed = same layout, so a layout
  is reproducible.

### Presets

| Preset | Columns × Rows | Gap | Radius |
|---|---:|---:|---:|
| Classic Bento | 4 × 3 | 12 | 14 |
| Portfolio Bento | 5 × 4 | 16 | 10 |
| Minimal Grid | 4 × 4 | 8 | 6 |
| Asymmetric Bento | 6 × 4 | 14 | 16 |
| Dashboard Layout | 6 × 3 | 10 | 10 |
| Random Bento | 5 × 4 | 12 | 12 |

Picking a preset auto-fills Columns / Rows / Gap / Radius. Every field
stays editable after picking a preset.

### Layout generation

- Occupancy-grid tiling: every grid cell is claimed by exactly one
  rectangle — no overlaps, no unintended empty spaces (the only gaps
  are your Gap setting).
- Square (1×1, 2×2, 3×3), portrait (1×2, 1×3, 2×3), landscape
  (2×1, 3×1, 3×2) and wide (3×1, 4×1) cells, with a balanced mix of
  large / medium / small cards per preset.
- Seeded random layouts (Park-Miller LCG): Generate re-uses the seed,
  Regenerate picks a fresh seed with the same settings, Randomize picks
  a fresh seed and shuffles Columns/Rows/Gap/Radius.
- Adapts to the artboard: Grid Width/Height default from the active
  artboard, the grid is centred on it, and if the requested grid +
  margin would overflow the artboard it is clamped to fit (the alert
  tells you).
- Works with no document open: creates a new RGB document sized to
  Grid + 2× Margin.

### Output

- Native Illustrator vector rectangles — `pathItems.rectangle()` when
  Radius = 0, `pathItems.roundedRectangle()` when Radius > 0.
- Fill: none / solid (first colour of the chosen palette) / palette
  cycling in cell order. Optional stroke with custom colour + width.
- All cells go into a layer **`MS Bento Grid`**, inside a group named
  `Bento Grid - <Preset>`. Each cell is named `Bento N (WxH)` in the
  Layers panel.
- Non-destructive: existing artwork and other layers are never touched.
  Re-running Generate / Regenerate only clears the previous contents
  of the `MS Bento Grid` layer, then draws the new grid.

## Project structure

```
ms-bento-grid-generator/
  README.md                          # This file
  MS_Bento_Grid_Generator.jsx        # The script (single file, v1.0.0)
  MS_Bento_Grid_Generator_README.md  # Original detailed guide (preserved)
  .gitignore
```

There is no build step, no dependencies and no other source file — the
`.jsx` is the whole application.

## Installation & usage

### Option A — Permanent install (recommended, appears in Scripts menu)

**Windows:**

1. Copy `MS_Bento_Grid_Generator.jsx` to:
   ```
   C:\Program Files\Adobe\Adobe Illustrator <version>\Presets\en_US\Scripts\
   ```
   Example for 2024:
   ```
   C:\Program Files\Adobe\Adobe Illustrator 2024\Presets\en_US\Scripts\MS_Bento_Grid_Generator.jsx
   ```
   If your Illustrator language is not `en_US`, use your language
   folder instead, e.g. `en_GB\Scripts\`. You may need Administrator
   permission to paste into `Program Files` — click Continue when
   Windows asks.
2. Restart Illustrator.
3. Run: **File → Scripts → MS_Bento_Grid_Generator**

**macOS:**

1. Copy `MS_Bento_Grid_Generator.jsx` to:
   ```
   /Applications/Adobe Illustrator <version>/Presets/en_US/Scripts/
   ```
2. Restart Illustrator.
3. Run: **File → Scripts → MS_Bento_Grid_Generator**

### Option B — Run once without installing

1. In Illustrator, go to **File → Scripts → Other Script…** (in older
   versions: **File → Scripts → Browse…**).
2. Select `MS_Bento_Grid_Generator.jsx` and click Open.
3. The dialog opens immediately. No restart needed.

### Option C — Drag & drop (quick test)

Drag `MS_Bento_Grid_Generator.jsx` onto an open Illustrator window /
dock icon. The dialog opens.

### 30-second workflow

1. Open any document (or run the script with no document — it will
   create one sized to your grid + margins).
2. **File → Scripts → MS_Bento_Grid_Generator**
3. Pick a **Preset** (e.g. Classic Bento). The dialog auto-fills
   Columns / Rows / Gap / Radius for that preset.
4. Adjust **Grid Width / Height**, **Columns / Rows**, **Gap**,
   **Margin**, **Corner Radius**, **Min / Max Cell Size** if you want.
5. Choose **Fill** (No Fill / Solid Fill / Preset Palette),
   **Color Palette**, and **Stroke** (on/off, width, colour).
6. Click **Generate Grid**. A success alert shows the cell count +
   seed. The grid appears centred on the active artboard, on a layer
   named **MS Bento Grid**, inside a group named
   `Bento Grid - <Preset>`.
7. Not happy with the arrangement? Click **Regenerate Layout** (same
   settings, new arrangement) or **Randomize Layout** (new seed +
   shuffled Columns/Rows/Gap/Radius). Click **Generate Grid** again
   any time.
8. Click **Reset Settings** to restore factory defaults for the
   current preset. Click **Cancel** to close without drawing.
9. Edit freely: expand the `MS Bento Grid` group in the Layers panel,
   select any cell, change its fill / stroke / corner radius, move /
   resize it, or ungroup to edit single cells.

## Examples

All dialog values are in points (pt). The script makes empty shapes
only — add your own text, images or icons inside the cards afterwards.
These settings were not device-tested as finished artwork; they are
starting points.

**Portfolio / Fiverr cover (1920×1080 pt):** Portfolio Bento, 5×4,
Gap 16, Radius 10, Margin 24, grid auto 1872×1032, Min 40 / Max 400,
Bold & Vibrant, Stroke ON, 1 pt, White.

**Story / Shorts cover (1080×1920 pt):** Asymmetric Bento, 6×4,
Gap 14, Radius 16, Margin 24, grid auto 1032×1872, Cool Ocean or
Warm Sunset.

> Tip: re-running clears the `MS Bento Grid` layer, so duplicate the
> layer first if you edited cells and want to keep them.

## Build & development

There is **no build step and no development command** for this project —
it is a single ExtendScript file that Illustrator runs directly. There
are no dependencies to install, no package manager and no dev server.

The only check used before delivery was a syntax check: the `.jsx`
copied to `.js` and run through `node --check` (PASS — no syntax
errors). That is a verification step, not a build command.

## How the code is organised

| Section in the file | What it does |
|---|---|
| 1. ES3 helpers | `trimString`, `isRealNumber`, `parseNumberField`, `clampNumber` |
| 2. Seeded random | `createSeededRandom` — Park-Miller LCG, same seed = same layout |
| 3. Presets + palettes | `getPresetDefaults`, `getSpanTable`, `getPaletteColors` |
| 4. Layout algorithm | `generateBentoCells` — occupancy-grid tiling, guarantees no overlap / no gaps / in bounds |
| 5. Validation | `validateSettings` — returns a plain-language error string or `""` |
| 6. Artwork creation | `makeRGB`, `getOrCreateLayer`, `clearLayerContents`, `getActiveArtboardRect`, `createBentoArtwork` |
| 7. Run one generation | `runGeneration` — validate → artboard → clamp/centre → generate → draw → alert |
| 8. ScriptUI dialog | `showDialog` — all controls + the five button handlers |
| 9. Entry point | `main()` — guards `app` exists, then shows the dialog |

Key invariant: `generateBentoCells()` never places a rectangle without
first checking `rectIsFree()` (inside grid + every cell free), and every
empty grid cell becomes the top-left corner of exactly one rectangle, so
coverage is always complete.

Technical notes:

- ES3-compatible syntax only (`var`, plain `for` loops — no
  `let`/`const`/arrow/template literals/classes/promises/spread/
  destructuring, no browser / Node.js APIs, no external dependencies).
- Only supported Illustrator APIs: `app.documents`,
  `app.activeDocument`, `doc.layers`, `doc.artboards` +
  `getActiveArtboardIndex()` + `artboardRect`, `layer.groupItems`,
  `group.pathItems.roundedRectangle()` / `rectangle()`, `RGBColor`.
- Input validation on every numeric field with plain-language alerts;
  errors are caught with `try/catch` and reported instead of crashing.
- Bounded loops only — no infinite loops (generation is bounded by
  Rows × Cols × span-table size).
- All dimensions are in **points** (Illustrator's internal unit),
  regardless of the document ruler unit.

## Screenshots

No screenshots are included — none were available in the project when
this repository was published.

## Known limitations

1. **Min / Max Cell Size are soft limits.** They filter which spans are
   *preferred*. The 1×1 fallback is always allowed so the grid can
   still be fully tiled even if Min/Max are tight (e.g. Min 300 pt on
   a 4-column 800 pt grid). If you need strict sizes, set
   Columns/Rows so the base cell size naturally lands in your range.
2. **No manual per-cell size input.** You control the *distribution*
   via preset + Columns/Rows + Min/Max, not the exact span of cell #7.
   Move / resize individual cells after generation if you need
   pixel-perfect control.
3. **No text / image auto-fill.** The script generates empty card
   shapes only. Add your own text, images, icons, or content inside
   the cards after generation.
4. **No saved custom presets.** The six built-in presets are fixed. You
   can re-run with your own numbers, but custom presets are not saved
   between runs.
5. **No undo grouping guarantee across versions.** Re-running the
   script clears the old `MS Bento Grid` layer contents (by design).
   If you edited cells and want to keep them, duplicate the
   layer/group first, or use Edit → Undo (Ctrl/Cmd+Z) after a
   generation.
6. **Single artboard at a time.** The grid is centred on the *active*
   artboard only. Multi-artboard documents need one run per artboard
   (select the artboard first).
7. **Stroke / fill are uniform per run.** All cells in one generation
   share the same stroke settings and the same fill mode; palette mode
   cycles colours, but you cannot set a different stroke per cell from
   the dialog — edit cells afterwards.
8. **Corner radius is uniform.** One radius value applies to all cells
   (clamped per cell). Individual corner control (e.g. only top
   corners rounded) is not supported — edit the Live Corners of a cell
   afterwards.
9. **Grid is rectangular.** No L-shaped / circular / masonry grids.
   Columns × Rows always form a full rectangle.
10. **CS6 ScriptUI appearance.** The dialog uses classic ScriptUI; it
    looks native but not modern. Functionality is identical on
    CS6–2025.
11. **Units are points.** If your ruler shows mm / inches, the dialog
    numbers are still points (1 pt = 1/72 inch). Convert if needed:
    1 inch = 72 pt, 1 mm ≈ 2.835 pt.
12. **Large grids (e.g. 20×20 = 400 cells) are slower** but still
    bounded; keep Columns/Rows ≤ 12 for instant feedback on older
    machines.

## Verification

Done before delivery (see `MS_Bento_Grid_Generator_README.md` for the
full test checklist):

- `node --check` on the `.jsx` (copied to `.js` for the check):
  **PASS — no syntax errors**.
- Forbidden modern-JS scan (non-comment code): **PASS — no
  `let`/`const`/arrow/template literals/`Object.keys`/`Array.isArray`/
  `JSON`/promises**.
- Layout harness (Node `vm`, 6 presets × 12 grid configs × 4 seeds =
  **288 runs**): **ALL PASS** — every run had full coverage (every grid
  cell claimed exactly once), zero overlaps, zero out-of-bounds cells.
- Reproducibility: same seed → byte-identical layout; different seed →
  different layout. **PASS**.
- Artwork harness (mocked Illustrator doc): rectangles in bounds,
  radius clamped to ≤ half the smaller side, Radius 0 → plain
  rectangles, No Fill → `filled = false`. **PASS**.

The script has not been run inside Illustrator on a real machine as
part of this upload — see the test checklist in
`MS_Bento_Grid_Generator_README.md` for the artboard-size, edge-case
and editability checks to run there.
