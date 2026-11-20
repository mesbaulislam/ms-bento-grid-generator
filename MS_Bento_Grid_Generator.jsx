/*
  MS Bento Grid Generator v1.0.0
  ------------------------------------------------------------
  A FREE, standalone Adobe Illustrator ExtendScript (.jsx) that
  generates professional, editable Bento-style grid layouts
  directly inside Illustrator. No plugin, no login, no internet.

  Author  : MS (Mesbaul Islam) — for Faisal / graphic design use
  Target  : Adobe Illustrator CS6 and later (Windows / macOS)
  Language: ExtendScript — ES3-compatible JavaScript only.
            No browser APIs, no Node.js, no external dependencies,
            no let / const / arrow functions / template literals /
            classes / promises / spread / destructuring.

  How it works (short version):
    1. User picks a preset + grid / style settings in a ScriptUI dialog.
    2. A seeded, occupancy-grid algorithm tiles the grid with
       non-overlapping rectangles (1x1 up to 3x3 spans).
    3. Each rectangle becomes a native, editable Illustrator
       rectangle (rounded when radius > 0) on a layer named
       "MS Bento Grid". Nothing is rasterized or flattened.

  Installation: see MS_Bento_Grid_Generator_README.md
    - Copy this file to:
        Windows: C:\Program Files\Adobe\Adobe Illustrator <version>\Presets\en_US\Scripts\
        macOS:   /Applications/Adobe Illustrator <version>/Presets/en_US/Scripts/
      OR: File > Scripts > Other Script... and pick this file.
    - Run: File > Scripts > MS_Bento_Grid_Generator
*/

// ------------------------------------------------------------------
// 1. Small ES3 helpers (no modern JS here)
// ------------------------------------------------------------------

// Trim leading / trailing whitespace. ExtendScript's String.trim()
// is not guaranteed on CS6, so we implement it manually.
function trimString(s) {
    if (s === null || s === undefined) { return ""; }
    s = "" + s;
    var start = 0;
    var end = s.length - 1;
    while (start <= end && (s.charAt(start) === " " || s.charAt(start) === "\t" || s.charAt(start) === "\r" || s.charAt(start) === "\n")) {
        start++;
    }
    while (end >= start && (s.charAt(end) === " " || s.charAt(end) === "\t" || s.charAt(end) === "\r" || s.charAt(end) === "\n")) {
        end--;
    }
    if (start > end) { return ""; }
    return s.substring(start, end + 1);
}

// Returns true when v is a real finite number (not NaN / Infinity).
function isRealNumber(v) {
    return (typeof v === "number") && !isNaN(v) && (v !== Infinity) && (v !== -Infinity);
}

// Parse an EditText field into a number. Returns defaultValue on failure.
function parseNumberField(field, defaultValue) {
    var raw = "";
    try { raw = field.text; } catch (e) { raw = ""; }
    raw = trimString(raw);
    if (raw === "") { return defaultValue; }
    var n = parseFloat(raw);
    if (isNaN(n)) { return defaultValue; }
    return n;
}

// Clamp a number into [min, max].
function clampNumber(v, min, max) {
    if (v < min) { return min; }
    if (v > max) { return max; }
    return v;
}

// ------------------------------------------------------------------
// 2. Seeded random — reproducible layouts
// ------------------------------------------------------------------
// Park-Miller LCG (minstd). Same seed => same layout every time.
// This is what makes "Regenerate" predictable and "Randomize" fresh:
// Randomize picks a new seed, Regenerate picks a new seed too but
// keeps every other setting unchanged, Generate re-uses the seed.
function createSeededRandom(seed) {
    var s = Math.floor(seed) % 2147483647;
    if (s <= 0) { s += 2147483646; }
    return function () {
        s = (s * 16807) % 2147483647;
        // Returns a float in (0, 1)
        return (s - 1) / 2147483646;
    };
}

// ------------------------------------------------------------------
// 3. Presets + palettes
// ------------------------------------------------------------------
// Preset defaults. Each preset only changes the *defaults* that are
// loaded into the dialog — the user can still edit every field after
// picking a preset. The span table (Section 4) decides the card mix.
function getPresetDefaults(presetKey) {
    // cols, rows, gap, radius
    if (presetKey === "portfolio") {
        return { cols: 5, rows: 4, gap: 16, radius: 10 };
    } else if (presetKey === "minimal") {
        return { cols: 4, rows: 4, gap: 8, radius: 6 };
    } else if (presetKey === "asymmetric") {
        return { cols: 6, rows: 4, gap: 14, radius: 16 };
    } else if (presetKey === "dashboard") {
        return { cols: 6, rows: 3, gap: 10, radius: 10 };
    } else if (presetKey === "random") {
        return { cols: 5, rows: 4, gap: 12, radius: 12 };
    } else {
        // "classic" is the fallback
        return { cols: 4, rows: 3, gap: 12, radius: 14 };
    }
}

function getPresetLabel(presetKey) {
    if (presetKey === "portfolio") { return "Portfolio Bento"; }
    if (presetKey === "minimal") { return "Minimal Grid"; }
    if (presetKey === "asymmetric") { return "Asymmetric Bento"; }
    if (presetKey === "dashboard") { return "Dashboard Layout"; }
    if (presetKey === "random") { return "Random Bento"; }
    return "Classic Bento";
}

function getPresetKeyFromIndex(index) {
    if (index === 1) { return "portfolio"; }
    if (index === 2) { return "minimal"; }
    if (index === 3) { return "asymmetric"; }
    if (index === 4) { return "dashboard"; }
    if (index === 5) { return "random"; }
    return "classic";
}

// Span table: candidate rectangle sizes (in grid cells) + weight.
// Higher weight = more likely to be picked when it fits.
// Square (2x2), portrait (1x2 / 1x3), landscape (2x1 / 3x1) and
// wide (3x1 / 4x1) shapes are all represented across presets.
function getSpanTable(presetKey) {
    var table = [];
    if (presetKey === "portfolio") {
        table = [
            { w: 2, h: 2, weight: 4 },
            { w: 2, h: 1, weight: 4 },
            { w: 1, h: 2, weight: 4 },
            { w: 1, h: 1, weight: 4 },
            { w: 3, h: 2, weight: 2 },
            { w: 3, h: 1, weight: 2 },
            { w: 1, h: 3, weight: 1 }
        ];
    } else if (presetKey === "minimal") {
        table = [
            { w: 1, h: 1, weight: 8 },
            { w: 2, h: 1, weight: 3 },
            { w: 1, h: 2, weight: 3 },
            { w: 2, h: 2, weight: 2 }
        ];
    } else if (presetKey === "asymmetric") {
        table = [
            { w: 3, h: 2, weight: 4 },
            { w: 2, h: 2, weight: 3 },
            { w: 3, h: 1, weight: 4 },
            { w: 1, h: 3, weight: 3 },
            { w: 2, h: 1, weight: 3 },
            { w: 1, h: 2, weight: 3 },
            { w: 1, h: 1, weight: 4 },
            { w: 2, h: 3, weight: 2 }
        ];
    } else if (presetKey === "dashboard") {
        table = [
            { w: 3, h: 1, weight: 5 },
            { w: 2, h: 1, weight: 5 },
            { w: 1, h: 1, weight: 5 },
            { w: 2, h: 2, weight: 3 },
            { w: 4, h: 1, weight: 2 },
            { w: 1, h: 2, weight: 2 },
            { w: 3, h: 2, weight: 2 }
        ];
    } else if (presetKey === "random") {
        table = [
            { w: 1, h: 1, weight: 3 },
            { w: 2, h: 1, weight: 3 },
            { w: 1, h: 2, weight: 3 },
            { w: 2, h: 2, weight: 3 },
            { w: 3, h: 1, weight: 2 },
            { w: 1, h: 3, weight: 2 },
            { w: 3, h: 2, weight: 2 },
            { w: 2, h: 3, weight: 2 },
            { w: 3, h: 3, weight: 1 }
        ];
    } else {
        // classic
        table = [
            { w: 2, h: 2, weight: 4 },
            { w: 2, h: 1, weight: 4 },
            { w: 1, h: 2, weight: 3 },
            { w: 1, h: 1, weight: 4 },
            { w: 3, h: 1, weight: 1 },
            { w: 1, h: 3, weight: 1 },
            { w: 3, h: 2, weight: 1 }
        ];
    }
    return table;
}

// Palettes as [R, G, B] triplets (0-255). All are print-friendly RGB.
function getPaletteColors(paletteKey) {
    if (paletteKey === "bold") {
        return [
            [255, 107, 107], [78, 205, 196], [255, 195, 0],
            [108, 92, 231], [0, 184, 148], [253, 121, 168],
            [45, 52, 54], [255, 118, 117]
        ];
    } else if (paletteKey === "mono") {
        return [
            [45, 52, 54], [99, 110, 114], [178, 190, 195],
            [223, 230, 233], [0, 0, 0], [150, 150, 150]
        ];
    } else if (paletteKey === "warm") {
        return [
            [255, 159, 67], [255, 107, 107], [255, 195, 0],
            [255, 133, 133], [230, 126, 34], [255, 224, 178]
        ];
    } else if (paletteKey === "cool") {
        return [
            [52, 152, 219], [46, 204, 113], [155, 89, 182],
            [26, 188, 156], [41, 128, 185], [174, 214, 241]
        ];
    } else if (paletteKey === "forest") {
        return [
            [39, 174, 96], [22, 160, 133], [241, 196, 15],
            [46, 204, 113], [39, 174, 96], [211, 84, 0]
        ];
    } else {
        // "soft" (default) — soft pastel
        return [
            [255, 223, 186], [186, 225, 255], [186, 255, 201],
            [255, 179, 186], [255, 255, 186], [202, 181, 255],
            [255, 205, 210], [178, 223, 219]
        ];
    }
}

function getPaletteKeyFromIndex(index) {
    if (index === 1) { return "bold"; }
    if (index === 2) { return "mono"; }
    if (index === 3) { return "warm"; }
    if (index === 4) { return "cool"; }
    if (index === 5) { return "forest"; }
    return "soft";
}

function getPaletteLabel(paletteKey) {
    if (paletteKey === "bold") { return "Bold & Vibrant"; }
    if (paletteKey === "mono") { return "Monochrome"; }
    if (paletteKey === "warm") { return "Warm Sunset"; }
    if (paletteKey === "cool") { return "Cool Ocean"; }
    if (paletteKey === "forest") { return "Forest"; }
    return "Soft Pastel";
}

// ------------------------------------------------------------------
// 4. Bento layout algorithm — the heart of the script
// ------------------------------------------------------------------
// generateBentoCells() tiles a cols x rows occupancy grid with
// non-overlapping rectangles and returns pixel-space cell rects.
//
// Guarantees:
//   - No overlap: every grid cell is claimed by exactly one rect
//     (occupancy matrix, checked before placing each rect).
//   - No gaps: the scan visits every grid cell in row-major order
//     and places at least a 1x1 rect on any still-empty cell, so
//     the whole grid is filled (gaps are only the user-set gutter).
//   - In bounds: x/y/w/h are computed from gridW/gridH/gap, never
//     beyond [0, gridW] x [0, gridH].
//   - No infinite loop: outer loops are bounded by rows*cols, the
//     inner candidate scan is bounded by the span table length.
//   - Reproducible: all randomness comes from the seeded RNG.
//
// Inputs: cols, rows (ints), gridW/gridH (points), gap (points),
//   presetKey (string), seed (int), minCellSize / maxCellSize (points,
//   soft limits — a 1x1 fallback is always allowed so the grid
//   can still be fully tiled even if min/max are tight).
// Output: array of { col, row, colSpan, rowSpan, x, y, w, h }
//   where x/y are measured from the grid's top-left corner,
//   x rightwards, y downwards, in points.
function generateBentoCells(cols, rows, gridW, gridH, gap, presetKey, seed, minCellSize, maxCellSize) {
    var cells = [];
    var r = 0;
    var c = 0;

    // Occupancy matrix: occupied[row][col] = true once claimed.
    var occupied = [];
    for (r = 0; r < rows; r++) {
        occupied[r] = [];
        for (c = 0; c < cols; c++) {
            occupied[r][c] = false;
        }
    }

    var rand = createSeededRandom(seed);
    var spanTable = getSpanTable(presetKey);

    // Base single-cell size (without gutter). Guard against gap
    // eating the whole grid — caller validates, this is a second net.
    var baseCellW = (gridW - gap * (cols - 1)) / cols;
    var baseCellH = (gridH - gap * (rows - 1)) / rows;
    if (baseCellW <= 0) { baseCellW = 1; }
    if (baseCellH <= 0) { baseCellH = 1; }

    // Helper (inline loop, not a closure over loop vars): checks that
    // the rectangle at (row, col) with size (spanW x spanH) is fully
    // inside the grid and every cell inside it is still free.
    // Returns true/false. Bounded loops only.
    function rectIsFree(row, col, spanW, spanH) {
        if (col + spanW > cols) { return false; }
        if (row + spanH > rows) { return false; }
        var rr = 0;
        var cc = 0;
        for (rr = row; rr < row + spanH; rr++) {
            for (cc = col; cc < col + spanW; cc++) {
                if (occupied[rr][cc]) { return false; }
            }
        }
        return true;
    }

    // Row-major scan. Each empty cell becomes the top-left corner
    // of exactly one new rectangle.
    for (r = 0; r < rows; r++) {
        for (c = 0; c < cols; c++) {
            if (occupied[r][c]) { continue; }

            // Collect every span-table candidate that fits here
            // (inside grid + all cells free + within min/max size
            // when that is possible). 1x1 always fits, so the list
            // is never empty.
            var fitting = [];
            var fittingWeights = [];
            var totalWeight = 0;
            var i = 0;
            for (i = 0; i < spanTable.length; i++) {
                var candW = spanTable[i].w;
                var candH = spanTable[i].h;
                if (!rectIsFree(r, c, candW, candH)) { continue; }
                // Pixel size of this candidate, including inner gutters.
                var pxW = candW * baseCellW + (candW - 1) * gap;
                var pxH = candH * baseCellH + (candH - 1) * gap;
                // Soft min/max filter: skip candidates outside the
                // user's size range, but never skip the 1x1 fallback.
                if (!(candW === 1 && candH === 1)) {
                    if (isRealNumber(minCellSize) && minCellSize > 0) {
                        if (pxW < minCellSize || pxH < minCellSize) { continue; }
                    }
                    if (isRealNumber(maxCellSize) && maxCellSize > 0) {
                        if (pxW > maxCellSize || pxH > maxCellSize) { continue; }
                    }
                }
                fitting.push({ w: candW, h: candH });
                fittingWeights.push(spanTable[i].weight);
                totalWeight += spanTable[i].weight;
            }

            // Weighted random pick among fitting candidates.
            // If somehow nothing fitted (should not happen because
            // 1x1 always fits), fall back to 1x1.
            var chosenW = 1;
            var chosenH = 1;
            if (fitting.length > 0 && totalWeight > 0) {
                var pick = rand() * totalWeight;
                var acc = 0;
                var chosenIndex = 0;
                for (i = 0; i < fitting.length; i++) {
                    acc += fittingWeights[i];
                    if (pick <= acc) { chosenIndex = i; break; }
                    chosenIndex = i;
                }
                chosenW = fitting[chosenIndex].w;
                chosenH = fitting[chosenIndex].h;
            }

            // Mark the rectangle's cells occupied.
            var rr2 = 0;
            var cc2 = 0;
            for (rr2 = r; rr2 < r + chosenH; rr2++) {
                for (cc2 = c; cc2 < c + chosenW; cc2++) {
                    occupied[rr2][cc2] = true;
                }
            }

            // Pixel rect (top-left origin, y downwards).
            var cellX = c * (baseCellW + gap);
            var cellY = r * (baseCellH + gap);
            var cellW = chosenW * baseCellW + (chosenW - 1) * gap;
            var cellH = chosenH * baseCellH + (chosenH - 1) * gap;

            cells.push({
                col: c,
                row: r,
                colSpan: chosenW,
                rowSpan: chosenH,
                x: cellX,
                y: cellY,
                w: cellW,
                h: cellH
            });
        }
    }

    return cells;
}

// ------------------------------------------------------------------
// 5. Validation
// ------------------------------------------------------------------
// validateSettings() checks every numeric input and returns an
// error string, or "" when everything is valid. The dialog shows
// the string in an alert and refuses to generate.
function validateSettings(s) {
    if (!isRealNumber(s.gridW) || s.gridW <= 0) {
        return "Grid Width must be a number greater than 0.";
    }
    if (!isRealNumber(s.gridH) || s.gridH <= 0) {
        return "Grid Height must be a number greater than 0.";
    }
    if (!isRealNumber(s.cols) || s.cols < 1 || s.cols > 20 || Math.floor(s.cols) !== s.cols) {
        return "Columns must be a whole number between 1 and 20.";
    }
    if (!isRealNumber(s.rows) || s.rows < 1 || s.rows > 20 || Math.floor(s.rows) !== s.rows) {
        return "Rows must be a whole number between 1 and 20.";
    }
    if (!isRealNumber(s.gap) || s.gap < 0) {
        return "Grid Gap must be 0 or greater.";
    }
    if (!isRealNumber(s.margin) || s.margin < 0) {
        return "Outer Margin must be 0 or greater.";
    }
    if (!isRealNumber(s.radius) || s.radius < 0) {
        return "Corner Radius must be 0 or greater.";
    }
    if (!isRealNumber(s.minCellSize) || s.minCellSize < 0) {
        return "Minimum Cell Size must be 0 or greater.";
    }
    if (!isRealNumber(s.maxCellSize) || s.maxCellSize < 0) {
        return "Maximum Cell Size must be 0 or greater.";
    }
    if (s.minCellSize > 0 && s.maxCellSize > 0 && s.minCellSize > s.maxCellSize) {
        return "Minimum Cell Size cannot be larger than Maximum Cell Size.";
    }
    if (!isRealNumber(s.strokeWidth) || s.strokeWidth < 0) {
        return "Stroke Width must be 0 or greater.";
    }
    // Gap must leave a positive cell size, otherwise the layout
    // math would produce zero / negative rectangles.
    if (s.gap * (s.cols - 1) >= s.gridW) {
        return "Gap is too large for the Grid Width and Columns.\nReduce the gap or increase the width.";
    }
    if (s.gap * (s.rows - 1) >= s.gridH) {
        return "Gap is too large for the Grid Height and Rows.\nReduce the gap or increase the height.";
    }
    // A fill of "none" plus no stroke would be invisible.
    if (s.fillType === "none" && !s.strokeEnabled) {
        return "Nothing would be visible: choose a Fill or enable Stroke.";
    }
    return "";
}

// ------------------------------------------------------------------
// 6. Illustrator artwork creation
// ------------------------------------------------------------------
// makeRGB() builds an Illustrator RGBColor from 0-255 components.
function makeRGB(r, g, b) {
    var col = new RGBColor();
    col.red = clampNumber(Math.round(r), 0, 255);
    col.green = clampNumber(Math.round(g), 0, 255);
    col.blue = clampNumber(Math.round(b), 0, 255);
    return col;
}

// getOrCreateLayer() finds a layer by name or creates it.
// It never touches any other layer, and never deletes artwork
// outside the "MS Bento Grid" layer.
function getOrCreateLayer(doc, layerName) {
    var i = 0;
    var layer = null;
    for (i = 0; i < doc.layers.length; i++) {
        if (doc.layers[i].name === layerName) {
            layer = doc.layers[i];
            break;
        }
    }
    if (layer === null) {
        layer = doc.layers.add();
        layer.name = layerName;
    }
    try { layer.locked = false; } catch (e1) {}
    try { layer.visible = true; } catch (e2) {}
    return layer;
}

// clearLayerContents() removes everything inside the given layer
// (previous Bento output) so Regenerate does not stack new grids
// on top of old ones. It does NOT touch other layers.
function clearLayerContents(layer) {
    // Remove from the end backwards; forward removal skips items.
    var n = 0;
    try { n = layer.pageItems.length; } catch (e) { n = 0; }
    var k = 0;
    for (k = n - 1; k >= 0; k--) {
        try { layer.pageItems[k].remove(); } catch (e2) {}
    }
    // Also clear any direct group items that pageItems may not list
    // on some versions (defensive, bounded loop).
    try {
        var g = layer.groupItems.length;
        var j = 0;
        for (j = g - 1; j >= 0; j--) {
            try { layer.groupItems[j].remove(); } catch (e3) {}
        }
    } catch (e4) {}
}

// getActiveArtboardRect() returns [left, top, right, bottom] in
// points for the active artboard, or null when unavailable.
// Illustrator's Y axis grows upwards, so top > bottom.
function getActiveArtboardRect(doc) {
    try {
        if (doc.artboards && doc.artboards.length > 0) {
            var idx = 0;
            try {
                idx = doc.artboards.getActiveArtboardIndex();
            } catch (eIdx) { idx = 0; }
            if (idx < 0 || idx >= doc.artboards.length) { idx = 0; }
            var rect = doc.artboards[idx].artboardRect;
            if (rect && rect.length === 4) { return rect; }
        }
    } catch (e) {}
    return null;
}

// createBentoArtwork() turns the layout cells into real,
// editable Illustrator rectangles.
//   doc      — active Illustrator document
//   cells    — array from generateBentoCells()
//   settings — validated settings object from the dialog
//   originX  — artboard X of the grid's top-left corner (points)
//   originY  — artboard Y of the grid's top-left corner (points,
//              Illustrator coords: larger Y = higher on page)
// Returns the number of rectangles created.
// Notes:
//   - Rounded rectangles use pathItems.roundedRectangle() when
//     radius > 0, otherwise pathItems.rectangle().
//   - Radius is clamped per-cell to half the smaller side so
//     Illustrator never receives an invalid radius.
//   - Shapes go into a Group inside "MS Bento Grid" so the whole
//     layout can be moved / hidden / deleted as one unit while
//     every cell stays individually editable.
function createBentoArtwork(doc, cells, settings, originX, originY) {
    var layer = getOrCreateLayer(doc, "MS Bento Grid");
    clearLayerContents(layer);

    var group = layer.groupItems.add();
    group.name = "Bento Grid - " + getPresetLabel(settings.presetKey);

    var palette = getPaletteColors(settings.paletteKey);
    var solidRGB = null;
    if (settings.fillType === "solid") {
        // Solid fill uses the first colour of the chosen palette,
        // so the palette dropdown still controls the look.
        solidRGB = makeRGB(palette[0][0], palette[0][1], palette[0][2]);
    }

    var strokeRGB = null;
    if (settings.strokeColorName === "White") {
        strokeRGB = makeRGB(255, 255, 255);
    } else if (settings.strokeColorName === "Dark Gray") {
        strokeRGB = makeRGB(80, 80, 80);
    } else if (settings.strokeColorName === "Light Gray") {
        strokeRGB = makeRGB(200, 200, 200);
    } else {
        strokeRGB = makeRGB(0, 0, 0); // "Black" default
    }

    var i = 0;
    for (i = 0; i < cells.length; i++) {
        var cell = cells[i];
        // Convert grid-top-left coords (y downwards) to Illustrator
        // coords (y upwards): left = originX + x, top = originY - y.
        var left = originX + cell.x;
        var top = originY - cell.y;

        var rect = null;
        // Clamp radius so it can never exceed half the cell size.
        var effRadius = settings.radius;
        var maxR = Math.min(cell.w, cell.h) / 2;
        if (effRadius > maxR) { effRadius = maxR; }

        if (effRadius > 0) {
            // roundedRectangle(top, left, width, height, hRadius, vRadius)
            rect = group.pathItems.roundedRectangle(top, left, cell.w, cell.h, effRadius, effRadius);
        } else {
            rect = group.pathItems.rectangle(top, left, cell.w, cell.h);
        }

        // ---- Fill ----
        if (settings.fillType === "none") {
            rect.filled = false;
        } else if (settings.fillType === "solid") {
            rect.filled = true;
            rect.fillColor = solidRGB;
        } else {
            // "palette" — cycle through the palette in cell order.
            var ci = palette[i % palette.length];
            rect.filled = true;
            rect.fillColor = makeRGB(ci[0], ci[1], ci[2]);
        }

        // ---- Stroke ----
        if (settings.strokeEnabled) {
            rect.stroked = true;
            rect.strokeColor = strokeRGB;
            rect.strokeWidth = settings.strokeWidth;
        } else {
            rect.stroked = false;
        }

        // Keep the cell name useful in the Layers panel.
        try {
            rect.name = "Bento " + (i + 1) + " (" + cell.colSpan + "x" + cell.rowSpan + ")";
        } catch (eName) {}
    }

    return cells.length;
}

// ------------------------------------------------------------------
// 7. Run one generation from a settings object
// ------------------------------------------------------------------
// runGeneration() is the single entry point used by Generate,
// Regenerate and Randomize. It validates, resolves the artboard,
// computes the centred grid origin, generates the layout, draws
// it, and reports the result. Returns true on success.
function runGeneration(settings) {
    var err = validateSettings(settings);
    if (err !== "") {
        alert("MS Bento Grid Generator\n\n" + err);
        return false;
    }

    // Ensure there is a document. If none exists, create one sized
    // to the grid + margins so the grid still has somewhere to go.
    var doc = null;
    try {
        if (app.documents.length === 0) {
            var docW = settings.gridW + settings.margin * 2;
            var docH = settings.gridH + settings.margin * 2;
            if (docW < 10) { docW = 10; }
            if (docH < 10) { docH = 10; }
            try {
                doc = app.documents.add(DocumentColorSpace.RGB, docW, docH);
            } catch (eDoc) {
                doc = app.documents.add();
            }
        } else {
            doc = app.activeDocument;
        }
    } catch (eApp) {
        alert("MS Bento Grid Generator\n\nCould not access an Illustrator document.\n" + eApp);
        return false;
    }

    // Artboard geometry. Fall back to the grid itself when the
    // artboard cannot be read (keeps the script usable).
    var artRect = getActiveArtboardRect(doc);
    var artLeft = 0;
    var artTop = 0;
    var artW = settings.gridW + settings.margin * 2;
    var artH = settings.gridH + settings.margin * 2;
    if (artRect !== null) {
        artLeft = artRect[0];
        artTop = artRect[1];
        artW = artRect[2] - artRect[0];
        artH = artRect[1] - artRect[3];
    }

    // The grid must fit inside the artboard with the margin kept.
    // If the user asked for a grid larger than the artboard allows,
    // clamp it (and tell them) instead of drawing out of bounds.
    var effGridW = settings.gridW;
    var effGridH = settings.gridH;
    var maxGridW = artW - settings.margin * 2;
    var maxGridH = artH - settings.margin * 2;
    var clamped = false;
    if (maxGridW > 0 && effGridW > maxGridW) { effGridW = maxGridW; clamped = true; }
    if (maxGridH > 0 && effGridH > maxGridH) { effGridH = maxGridH; clamped = true; }
    if (maxGridW <= 0 || maxGridH <= 0) {
        alert("MS Bento Grid Generator\n\nOuter Margin is too large for this artboard.\nReduce the margin or enlarge the artboard.");
        return false;
    }

    // Centre the grid on the artboard (respecting the margin).
    var originX = artLeft + (artW - effGridW) / 2;
    var originY = artTop - (artH - effGridH) / 2;

    var cells = null;
    try {
        cells = generateBentoCells(
            settings.cols, settings.rows,
            effGridW, effGridH, settings.gap,
            settings.presetKey, settings.seed,
            settings.minCellSize, settings.maxCellSize
        );
    } catch (eGen) {
        alert("MS Bento Grid Generator\n\nLayout generation failed.\n" + eGen);
        return false;
    }

    if (cells === null || cells.length === 0) {
        alert("MS Bento Grid Generator\n\nNo cells were generated. Try different Columns / Rows.");
        return false;
    }

    var created = 0;
    try {
        created = createBentoArtwork(doc, cells, settings, originX, originY);
    } catch (eDraw) {
        alert("MS Bento Grid Generator\n\nCould not draw the grid.\n" + eDraw);
        return false;
    }

    var msg = "Generated " + created + " Bento cells (" + getPresetLabel(settings.presetKey) + ").\n";
    msg += "Layer: MS Bento Grid  |  Seed: " + settings.seed + "\n";
    if (clamped) {
        msg += "Note: Grid was clamped to fit the artboard with the current margin.\n";
    }
    msg += "All shapes are editable vectors — ungroup to edit single cells.";
    alert("MS Bento Grid Generator\n\n" + msg);
    return true;
}

// ------------------------------------------------------------------
// 8. ScriptUI dialog
// ------------------------------------------------------------------
// showDialog() builds the whole UI. Field order follows the spec:
// Grid Width/Height, Columns/Rows, Gap, Margin, Corner Radius,
// Min/Max Cell Size, then styling, then the five buttons:
// Randomize / Generate / Regenerate / Reset / Cancel.
//
// Generate  = draw with the current settings + current seed.
// Regenerate = pick a fresh seed, then draw (same settings).
// Randomize  = pick a fresh seed AND shuffle gap/radius/cols/rows
//              a little, so the layout changes more dramatically.
// Reset      = restore the factory defaults for the current preset.
// Cancel     = close without drawing anything.
function showDialog() {
    // --- Resolve initial defaults from the active artboard ---
    var initGridW = 800;
    var initGridH = 600;
    var initMargin = 24;
    try {
        if (app.documents.length > 0) {
            var d0 = app.activeDocument;
            var r0 = getActiveArtboardRect(d0);
            if (r0 !== null) {
                var aw0 = r0[2] - r0[0];
                var ah0 = r0[1] - r0[3];
                if (aw0 > 0 && ah0 > 0) {
                    initGridW = Math.round(aw0 - initMargin * 2);
                    initGridH = Math.round(ah0 - initMargin * 2);
                    if (initGridW < 50) { initGridW = 50; }
                    if (initGridH < 50) { initGridH = 50; }
                }
            }
        }
    } catch (eInit) {}

    // Mutable state shared by all button handlers.
    var state = {
        seed: 12345,
        presetKey: "classic"
    };

    var dialog = new Window("dialog", "MS Bento Grid Generator v1.0.0");
    dialog.orientation = "column";
    dialog.alignChildren = ["fill", "top"];
    dialog.spacing = 8;
    dialog.margins = 16;

    // Title line
    var titleText = dialog.add("statictext", undefined, "Create editable Bento grids — no plugin, no internet, free.");
    titleText.alignment = ["fill", "top"];

    // ----- Preset row -----
    var presetGroup = dialog.add("group");
    presetGroup.orientation = "row";
    presetGroup.alignChildren = ["left", "center"];
    presetGroup.add("statictext", undefined, "Preset:");
    var presetDropdown = presetGroup.add("dropdownlist", undefined, [
        "Classic Bento",
        "Portfolio Bento",
        "Minimal Grid",
        "Asymmetric Bento",
        "Dashboard Layout",
        "Random Bento"
    ]);
    presetDropdown.selection = 0;
    presetDropdown.preferredSize.width = 200;

    var seedText = presetGroup.add("statictext", undefined, "Seed: 12345");
    seedText.alignment = ["right", "center"];

    // ----- Grid settings panel -----
    var gridPanel = dialog.add("panel", undefined, "Grid Settings");
    gridPanel.orientation = "column";
    gridPanel.alignChildren = ["fill", "top"];
    gridPanel.spacing = 4;
    gridPanel.margins = 10;

    // Helper to add one labelled number field. Returns the EditText.
    function addNumberRow(panel, label, defaultVal) {
        var row = panel.add("group");
        row.orientation = "row";
        row.alignChildren = ["left", "center"];
        var lab = row.add("statictext", undefined, label);
        lab.preferredSize.width = 150;
        var field = row.add("edittext", undefined, "" + defaultVal);
        field.characters = 10;
        field.alignment = ["fill", "center"];
        return field;
    }

    var widthField = addNumberRow(gridPanel, "Grid Width (pt):", initGridW);
    var heightField = addNumberRow(gridPanel, "Grid Height (pt):", initGridH);
    var colsField = addNumberRow(gridPanel, "Columns:", 4);
    var rowsField = addNumberRow(gridPanel, "Rows:", 3);
    var gapField = addNumberRow(gridPanel, "Grid Gap / Gutter (pt):", 12);
    var marginField = addNumberRow(gridPanel, "Outer Margin (pt):", 24);
    var radiusField = addNumberRow(gridPanel, "Corner Radius (pt):", 14);
    var minCellField = addNumberRow(gridPanel, "Minimum Cell Size (pt):", 40);
    var maxCellField = addNumberRow(gridPanel, "Maximum Cell Size (pt):", 400);

    // ----- Style panel -----
    var stylePanel = dialog.add("panel", undefined, "Shape Styling");
    stylePanel.orientation = "column";
    stylePanel.alignChildren = ["fill", "top"];
    stylePanel.spacing = 4;
    stylePanel.margins = 10;

    var fillRow = stylePanel.add("group");
    fillRow.orientation = "row";
    fillRow.alignChildren = ["left", "center"];
    var fillLabel = fillRow.add("statictext", undefined, "Fill:");
    fillLabel.preferredSize.width = 150;
    var fillDropdown = fillRow.add("dropdownlist", undefined, [
        "No Fill",
        "Solid Fill",
        "Preset Palette"
    ]);
    fillDropdown.selection = 2; // Preset Palette default
    fillDropdown.alignment = ["fill", "center"];

    var paletteRow = stylePanel.add("group");
    paletteRow.orientation = "row";
    paletteRow.alignChildren = ["left", "center"];
    var paletteLabel = paletteRow.add("statictext", undefined, "Color Palette:");
    paletteLabel.preferredSize.width = 150;
    var paletteDropdown = paletteRow.add("dropdownlist", undefined, [
        "Soft Pastel",
        "Bold & Vibrant",
        "Monochrome",
        "Warm Sunset",
        "Cool Ocean",
        "Forest"
    ]);
    paletteDropdown.selection = 0;
    paletteDropdown.alignment = ["fill", "center"];

    var strokeRow = stylePanel.add("group");
    strokeRow.orientation = "row";
    strokeRow.alignChildren = ["left", "center"];
    var strokeCheck = strokeRow.add("checkbox", undefined, "Stroke");
    strokeCheck.value = true;
    strokeCheck.preferredSize.width = 150;
    var strokeWidthField = strokeRow.add("edittext", undefined, "1");
    strokeWidthField.characters = 6;
    var strokeColorDropdown = strokeRow.add("dropdownlist", undefined, [
        "Black",
        "White",
        "Dark Gray",
        "Light Gray"
    ]);
    strokeColorDropdown.selection = 1; // White — separates palette fills
    strokeColorDropdown.alignment = ["fill", "center"];
    var strokeUnit = strokeRow.add("statictext", undefined, "pt");
    strokeUnit.preferredSize.width = 20;

    var noteText = dialog.add("statictext", undefined, "Output goes to layer \"MS Bento Grid\". Existing artwork is preserved.");
    noteText.alignment = ["fill", "top"];

    // ----- Buttons -----
    var btnGroup = dialog.add("group");
    btnGroup.orientation = "row";
    btnGroup.alignChildren = ["fill", "center"];
    btnGroup.spacing = 6;

    var randomizeBtn = btnGroup.add("button", undefined, "Randomize Layout");
    var generateBtn = btnGroup.add("button", undefined, "Generate Grid");
    var regenBtn = btnGroup.add("button", undefined, "Regenerate Layout");
    var resetBtn = btnGroup.add("button", undefined, "Reset Settings");
    var cancelBtn = btnGroup.add("button", undefined, "Cancel");

    // ----- Read current dialog values into a settings object -----
    function readSettings() {
        var presetIndex = 0;
        try { presetIndex = presetDropdown.selection.index; } catch (eP) { presetIndex = 0; }
        var fillIndex = 2;
        try { fillIndex = fillDropdown.selection.index; } catch (eF) { fillIndex = 2; }
        var paletteIndex = 0;
        try { paletteIndex = paletteDropdown.selection.index; } catch (ePal) { paletteIndex = 0; }
        var strokeColorIndex = 1;
        try { strokeColorIndex = strokeColorDropdown.selection.index; } catch (eSC) { strokeColorIndex = 1; }

        var fillType = "palette";
        if (fillIndex === 0) { fillType = "none"; }
        else if (fillIndex === 1) { fillType = "solid"; }

        var strokeColorName = "White";
        if (strokeColorIndex === 0) { strokeColorName = "Black"; }
        else if (strokeColorIndex === 2) { strokeColorName = "Dark Gray"; }
        else if (strokeColorIndex === 3) { strokeColorName = "Light Gray"; }

        var presetKey = getPresetKeyFromIndex(presetIndex);
        var paletteKey = getPaletteKeyFromIndex(paletteIndex);

        return {
            gridW: parseNumberField(widthField, initGridW),
            gridH: parseNumberField(heightField, initGridH),
            cols: Math.round(parseNumberField(colsField, 4)),
            rows: Math.round(parseNumberField(rowsField, 3)),
            gap: parseNumberField(gapField, 12),
            margin: parseNumberField(marginField, 24),
            radius: parseNumberField(radiusField, 14),
            minCellSize: parseNumberField(minCellField, 40),
            maxCellSize: parseNumberField(maxCellField, 400),
            fillType: fillType,
            paletteKey: paletteKey,
            strokeEnabled: (strokeCheck.value === true),
            strokeWidth: parseNumberField(strokeWidthField, 1),
            strokeColorName: strokeColorName,
            presetKey: presetKey,
            seed: state.seed
        };
    }

    // Apply a preset's defaults into the visible fields.
    function applyPresetToUI(presetKey) {
        var d = getPresetDefaults(presetKey);
        colsField.text = "" + d.cols;
        rowsField.text = "" + d.rows;
        gapField.text = "" + d.gap;
        radiusField.text = "" + d.radius;
        state.presetKey = presetKey;
    }

    function updateSeedLabel() {
        try { seedText.text = "Seed: " + state.seed; } catch (eSeed) {}
    }

    // ----- Button handlers -----
    presetDropdown.onChange = function () {
        var idx = 0;
        try { idx = presetDropdown.selection.index; } catch (e) { idx = 0; }
        applyPresetToUI(getPresetKeyFromIndex(idx));
    };

    randomizeBtn.onClick = function () {
        // New seed + a light shuffle of the layout knobs.
        state.seed = Math.floor(Math.random() * 1000000) + 1;
        updateSeedLabel();
        var rnd = createSeededRandom(state.seed);
        colsField.text = "" + (3 + Math.floor(rnd() * 4)); // 3-6
        rowsField.text = "" + (3 + Math.floor(rnd() * 3)); // 3-5
        gapField.text = "" + (8 + Math.floor(rnd() * 13)); // 8-20
        radiusField.text = "" + (4 + Math.floor(rnd() * 17)); // 4-20
        // Draw immediately so the user sees the new layout.
        runGeneration(readSettings());
    };

    generateBtn.onClick = function () {
        runGeneration(readSettings());
    };

    regenBtn.onClick = function () {
        // Same settings, fresh seed => a new valid arrangement.
        state.seed = Math.floor(Math.random() * 1000000) + 1;
        updateSeedLabel();
        runGeneration(readSettings());
    };

    resetBtn.onClick = function () {
        state.seed = 12345;
        updateSeedLabel();
        widthField.text = "" + initGridW;
        heightField.text = "" + initGridH;
        minCellField.text = "40";
        maxCellField.text = "400";
        marginField.text = "24";
        fillDropdown.selection = 2;
        paletteDropdown.selection = 0;
        strokeCheck.value = true;
        strokeWidthField.text = "1";
        strokeColorDropdown.selection = 1;
        // Reset to the currently selected preset's grid defaults.
        var idx = 0;
        try { idx = presetDropdown.selection.index; } catch (eR) { idx = 0; }
        applyPresetToUI(getPresetKeyFromIndex(idx));
    };

    cancelBtn.onClick = function () {
        dialog.close(0);
    };

    dialog.center();
    dialog.show();
}

// ------------------------------------------------------------------
// 9. Entry point
// ------------------------------------------------------------------
function main() {
    try {
        if (typeof app === "undefined" || app === null) {
            alert("MS Bento Grid Generator\n\nThis script must be run inside Adobe Illustrator.");
            return;
        }
        showDialog();
    } catch (eMain) {
        try {
            alert("MS Bento Grid Generator\n\nUnexpected error:\n" + eMain);
        } catch (eAlert) {}
    }
}

main();
