# MS Bento Grid Generator — for Adobe Illustrator

**File:** `MS_Bento_Grid_Generator.jsx`
**Version:** 1.0.0 — FREE, standalone, no plugin / login / internet
**Compatible:** Adobe Illustrator CS6 and later (Windows / macOS)
**Language:** ExtendScript, ES3-compatible JavaScript only

Generates professional, fully editable Bento-style grid layouts directly inside Illustrator.

---

## 1. Exact Installation & Execution

### Option A — Permanent install (recommended, appears in Scripts menu)

**Windows:**
1. Close Illustrator (or keep it open — you will restart it after copying).
2. Copy `MS_Bento_Grid_Generator.jsx` to:
   ```
   C:\Program Files\Adobe\Adobe Illustrator <version>\Presets\en_US\Scripts\
   ```
   Example for 2024:
   ```
   C:\Program Files\Adobe\Adobe Illustrator 2024\Presets\en_US\Scripts\MS_Bento_Grid_Generator.jsx
   ```
   If your Illustrator language is not `en_US`, use your language folder instead, e.g. `en_GB\Scripts\`.
   You may need Administrator permission to paste into `Program Files` — click Continue when Windows asks.
3. Restart Illustrator.
4. Run: **File → Scripts → MS_Bento_Grid_Generator**

**macOS:**
1. Copy `MS_Bento_Grid_Generator.jsx` to:
   ```
   /Applications/Adobe Illustrator <version>/Presets/en_US/Scripts/
   ```
   Example:
   ```
   /Applications/Adobe Illustrator 2024/Presets/en_US/Scripts/MS_Bento_Grid_Generator.jsx
   ```
2. Restart Illustrator.
3. Run: **File → Scripts → MS_Bento_Grid_Generator**

### Option B — Run once without installing

1. In Illustrator, go to **File → Scripts → Other Script…** (in older versions: **File → Scripts → Browse…**).
2. Select `MS_Bento_Grid_Generator.jsx` and click Open.
3. The dialog opens immediately. No restart needed.

### Option C — Drag & drop (quick test)

Drag `MS_Bento_Grid_Generator.jsx` onto an open Illustrator window / dock icon. The dialog opens.

### How to use (30-second workflow)

1. Open any document (or run the script with no document — it will create one sized to your grid + margins).
2. **File → Scripts → MS_Bento_Grid_Generator**
3. Pick a **Preset** (e.g. Classic Bento). The dialog auto-fills Columns / Rows / Gap / Radius for that preset.
4. Adjust **Grid Width / Height** (defaults to your active artboard minus margins), **Columns / Rows**, **Gap**, **Margin**, **Corner Radius**, **Min / Max Cell Size** if you want.
5. Choose **Fill** (No Fill / Solid Fill / Preset Palette), **Color Palette**, and **Stroke** (on/off, width, colour).
6. Click **Generate Grid**. A success alert shows the cell count + seed. The grid appears centred on the active artboard, on a layer named **MS Bento Grid**, inside a group named `Bento Grid - <Preset>`.
7. Not happy with the arrangement? Click **Regenerate Layout** (same settings, new arrangement) or **Randomize Layout** (new seed + shuffled Columns/Rows/Gap/Radius). Click **Generate Grid** again any time.
8. Click **Reset Settings** to restore factory defaults for the current preset. Click **Cancel** to close without drawing.
9. Edit freely: expand the `MS Bento Grid` group in the Layers panel, select any cell, change its fill / stroke / corner radius, move / resize it, or ungroup to edit single cells. Nothing is rasterized or flattened.

> Tip: The dialog stays open after Generate / Regenerate / Randomize, so you can iterate without re-running the script. Close it with Cancel when you are done.

---

## 2. Supported Features

### Dialog & controls (all requested controls present)
- Grid Width and Height (pt) — defaults to active artboard size minus 2× Margin.
- Number of Columns (1–20) and Rows (1–20).
- Grid Gap / Gutter (pt, 0 or more).
- Outer Margin (pt, 0 or more).
- Corner Radius (pt, 0 or more) — per-cell clamped to half the smaller side, so Illustrator never gets an invalid radius.
- Minimum and Maximum Cell Size (pt, soft limits — see Limitations).
- Preset dropdown: Classic Bento, Portfolio Bento, Minimal Grid, Asymmetric Bento, Dashboard Layout, Random Bento.
- Fill type: No Fill / Solid Fill / Preset Palette.
- Colour palettes: Soft Pastel, Bold & Vibrant, Monochrome, Warm Sunset, Cool Ocean, Forest.
- Stroke: on/off checkbox, width (pt), colour (Black / White / Dark Gray / Light Gray).
- Buttons: **Randomize Layout**, **Generate Grid**, **Regenerate Layout**, **Reset Settings**, **Cancel**.
- Seed display (`Seed: 12345`) — same seed = same layout, so a layout is reproducible.

### Layout generation
- Occupancy-grid tiling: every grid cell is claimed by exactly one rectangle — **no overlaps, no unintended empty spaces** (the only gaps are your Gap setting).
- Square (1×1, 2×2, 3×3), portrait (1×2, 1×3, 2×3), landscape (2×1, 3×1, 3×2) and wide (3×1, 4×1) cells, with a balanced mix of large / medium / small cards per preset.
- Configurable row-and-column grid system (Columns × Rows).
- Consistent gaps between neighbours; all cells stay inside the specified grid bounds.
- Seeded random layouts: Generate re-uses the seed, Regenerate picks a fresh seed with the same settings, Randomize picks a fresh seed and shuffles Columns/Rows/Gap/Radius.
- Automatically adapts to different artboard dimensions: Grid Width/Height default from the active artboard; the grid is centred on the artboard; if the requested grid + margin would overflow the artboard it is clamped to fit and the alert tells you.
- Works with no document open: creates a new RGB document sized to Grid + 2× Margin.

### Shape styling & output
- Native, editable Illustrator vector rectangles — `pathItems.rectangle()` when Radius = 0, `pathItems.roundedRectangle()` when Radius > 0.
- Rounded corners from the Corner Radius setting.
- Fill: none / solid (first colour of the chosen palette) / palette cycling in cell order.
- Optional stroke with custom colour + width.
- All cells go into a clearly named layer **`MS Bento Grid`**, inside a group named `Bento Grid - <Preset>`. Each cell is named `Bento N (WxH)` in the Layers panel.
- Grouped logically; every cell stays individually editable. No rasterize / flatten / expand.
- Non-destructive: existing artwork and other layers are never touched. Re-running Generate / Regenerate only clears the previous contents of the `MS Bento Grid` layer, then draws the new grid.

### Technical
- Adobe Illustrator ExtendScript, ES3-compatible syntax only (`var`, plain `for` loops, no `let`/`const`/arrow/template literals/classes/promises/spread/destructuring, no browser / Node.js APIs, no external dependencies).
- Only supported Illustrator APIs: `app.documents`, `app.activeDocument`, `doc.layers`, `doc.artboards` + `getActiveArtboardIndex()` + `artboardRect`, `layer.groupItems`, `group.pathItems.roundedRectangle()` / `rectangle()`, `RGBColor`.
- Input validation on every numeric field with plain-language alerts; errors are caught with `try/catch` and reported instead of crashing.
- Bounded loops only — no infinite loops (generation is bounded by Rows × Cols × span-table size).
- All dimensions are in **points** (Illustrator's internal unit), regardless of the document ruler unit.

---

## 3. Known Limitations (honest list)

1. **Min / Max Cell Size are soft limits.** They filter which spans are *preferred*. The 1×1 fallback is always allowed so the grid can still be fully tiled even if Min/Max are tight (e.g. Min 300 pt on a 4-column 800 pt grid). If you need strict sizes, set Columns/Rows so the base cell size naturally lands in your range.
2. **No manual per-cell size input.** You control the *distribution* via preset + Columns/Rows + Min/Max, not the exact span of cell #7. Move / resize individual cells after generation if you need pixel-perfect control.
3. **No text / image auto-fill.** The script generates empty card shapes only. Add your own text, images, icons, or content inside the cards after generation.
4. **No saved custom presets.** The six built-in presets are fixed. You can re-run with your own numbers, but custom presets are not saved between runs.
5. **No undo grouping guarantee across versions.** Re-running the script clears the old `MS Bento Grid` layer contents (by design). If you edited cells and want to keep them, duplicate the layer/group first, or use Edit → Undo (Ctrl/Cmd+Z) after a generation.
6. **Single artboard at a time.** The grid is centred on the *active* artboard only. Multi-artboard documents need one run per artboard (select the artboard first).
7. **Stroke / fill are uniform per run.** All cells in one generation share the same stroke settings and the same fill mode; palette mode cycles colours, but you cannot set a different stroke per cell from the dialog — edit cells afterwards.
8. **Corner radius is uniform.** One radius value applies to all cells (clamped per cell). Individual corner control (e.g. only top corners rounded) is not supported — edit the Live Corners of a cell afterwards.
9. **Grid is rectangular.** No L-shaped / circular / masonry grids. Columns × Rows always form a full rectangle.
10. **CS6 ScriptUI appearance.** The dialog uses classic ScriptUI; it looks native but not modern. Functionality is identical on CS6–2025.
11. **Units are points.** If your ruler shows mm / inches, the dialog numbers are still points (1 pt = 1/72 inch). Convert if needed: 1 inch = 72 pt, 1 mm ≈ 2.835 pt.
12. **Large grids (e.g. 20×20 = 400 cells) are slower** but still bounded; keep Columns/Rows ≤ 12 for instant feedback on older machines.

---

## 4. Test Checklist

Run each row and tick it off. Expected result for every row: **no overlap, no out-of-bounds shape, no empty grid cell (except the Gap), all shapes editable, no script error.**

### A. Presets (default settings, 800×600 artboard, Margin 24)
| # | Preset | Check |
|---|--------|-------|
| A1 | Classic Bento | Generates, balanced mix of 2×2 / 2×1 / 1×2 / 1×1, centred, layer `MS Bento Grid` exists |
| A2 | Portfolio Bento | Generates, includes larger 3×2 cards |
| A3 | Minimal Grid | Generates, mostly 1×1 / 2×1, small radius |
| A4 | Asymmetric Bento | Generates, visibly irregular mix incl. 3×1 / 1×3 |
| A5 | Dashboard Layout | Generates, visibly wide cards (3×1 / 4×1) |
| A6 | Random Bento | Generates, different arrangement each Regenerate |

### B. Artboard sizes (Classic Bento, Margin 24)
| # | Artboard | Grid W×H | Check |
|---|----------|-----------|-------|
| B1 | 800×600 pt (default) | 752×552 | Fits, centred, no overflow |
| B2 | 1920×1080 pt (HD) | 1872×1032 | Fits, centred |
| B3 | 1080×1080 pt (square / Instagram) | 1032×1032 | Fits |
| B4 | 1080×1920 pt (portrait / story) | 1032×1872 | Fits, portrait cells present |
| B5 | 400×400 pt (small) | 352×352 | Fits, cells not degenerate |
| B6 | 3000×2000 pt (large print) | 2952×1952 | Fits |
| B7 | No document open | 800×600 | Creates new doc, grid drawn |

### C. Edge cases
| # | Case | Expected |
|---|------|----------|
| C1 | Columns = 1, Rows = 1 | Single cell fills the whole grid |
| C2 | Columns = 1, Rows = 5 | Vertical strip, 5 cells, no overlap |
| C3 | Columns = 8, Rows = 2 | Wide strip, no overlap |
| C4 | Gap = 0 | Cells touch edge-to-edge, no overlap, no gap |
| C5 | Gap = 40 (large) | Consistent 40 pt gutters, no overlap |
| C6 | Corner Radius = 0 | Sharp corners (plain rectangles) |
| C7 | Corner Radius = 100 (huge) | Clamped per cell, no error, no distorted shapes |
| C8 | Margin = 0 | Grid touches artboard edge, still in bounds |
| C9 | Margin too large (e.g. 1000 on 800×600) | Clear alert, no drawing, no crash |
| C10 | Min Cell Size > Max Cell Size | Clear alert, no drawing |
| C11 | Columns = 0 / Rows = 0 / negative numbers | Clear alert, no drawing |
| C12 | Gap so large it leaves no cell size | Clear alert, no drawing |
| C13 | Fill = No Fill + Stroke OFF | Clear alert (would be invisible) |
| C14 | Fill = No Fill + Stroke ON | Outlines only, all visible |
| C15 | Fill = Solid Fill | All cells same colour (first palette colour) |
| C16 | Fill = Preset Palette, each palette in turn | Colours cycle, no error |
| C17 | Stroke OFF | No stroke on any cell |
| C18 | Stroke Width = 5 | Thick uniform stroke |
| C19 | Existing artwork on another layer | Untouched after generation |
| C20 | Generate twice in a row | Second grid replaces first, no stacking / duplicates |

### D. Buttons & reproducibility
| # | Action | Expected |
|---|--------|----------|
| D1 | Generate → Generate (same seed) | Identical layout (same seed = same layout) |
| D2 | Regenerate | Same settings, visibly different valid layout, seed number changes |
| D3 | Randomize | Seed + Columns/Rows/Gap/Radius change, new valid layout |
| D4 | Reset Settings | Fields return to factory defaults for current preset, seed = 12345 |
| D5 | Cancel | Dialog closes, nothing drawn, no layer created |
| D6 | Preset dropdown change | Columns/Rows/Gap/Radius update to that preset's defaults |

### E. Editability (after any generation)
| # | Check |
|---|-------|
| E1 | Select a cell with Direct Selection (A) — it is a vector path, not an image |
| E2 | Change a cell's fill in the Colour panel — works |
| E3 | Change a cell's corner radius via Live Corners / Transform — works |
| E4 | Move / resize a cell — works, neighbours unaffected |
| E5 | Hide `MS Bento Grid` layer — whole grid hides |
| E6 | Save as .ai, reopen — grid intact, still editable |

### F. Automated verification (done before delivery)
- `node --check` on the `.jsx` (copied to `.js` for the check): **PASS — no syntax errors**.
- Forbidden modern-JS scan (non-comment code): **PASS — no `let`/`const`/arrow/template literals/`Object.keys`/`Array.isArray`/`JSON`/promises**.
- Layout harness (Node `vm`, 6 presets × 12 grid configs × 4 seeds = **288 runs**): **ALL PASS** — every run had full coverage (every grid cell claimed exactly once), zero overlaps, zero out-of-bounds cells.
- Reproducibility: same seed → byte-identical layout; different seed → different layout. **PASS**.
- Artwork harness (mocked Illustrator doc): rectangles in bounds, radius clamped to ≤ half the smaller side, Radius 0 → plain rectangles, No Fill → `filled = false`. **PASS**.

---

## 5. How the Code Is Organised (for developers)

| Section in the file | What it does |
|---------------------|--------------|
| 1. ES3 helpers | `trimString`, `isRealNumber`, `parseNumberField`, `clampNumber` |
| 2. Seeded random | `createSeededRandom` — Park-Miller LCG, same seed = same layout |
| 3. Presets + palettes | `getPresetDefaults`, `getSpanTable`, `getPaletteColors` |
| 4. Layout algorithm | `generateBentoCells` — occupancy-grid tiling, guarantees no overlap / no gaps / in bounds |
| 5. Validation | `validateSettings` — returns a plain-language error string or `""` |
| 6. Artwork creation | `makeRGB`, `getOrCreateLayer`, `clearLayerContents`, `getActiveArtboardRect`, `createBentoArtwork` |
| 7. Run one generation | `runGeneration` — validate → artboard → clamp/centre → generate → draw → alert |
| 8. ScriptUI dialog | `showDialog` — all controls + the five button handlers |
| 9. Entry point | `main()` — guards `app` exists, then shows the dialog |

Key invariant: `generateBentoCells()` never places a rectangle without first checking `rectIsFree()` (inside grid + every cell free), and every empty grid cell becomes the top-left corner of exactly one rectangle, so coverage is always complete.

---

*Free for personal and commercial design use. No attribution required.*
