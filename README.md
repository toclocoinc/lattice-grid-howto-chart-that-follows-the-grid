# How to draw a chart from grid data that follows the grid's filters

One bar chart reads a twelve-row grid of deals, one bar per region, its length the region's total
deal value: `createChart({ grid, container, type: 'bar', x: 'region', y: 'deal' })`. Type into the
filter box and both the grid and the chart narrow to the match, because the chart reads the grid's
own filtered rows rather than a snapshot taken when it was made. Click a bar and `filterOnClick:
true` sets a column filter on the grid to that bar's region.

Live demo: https://toclocoinc.github.io/lattice-grid-howto-chart-that-follows-the-grid/

**Read the how-to:** https://www.latticegrid.dev/docs/how-to/chart-that-follows-the-grid/

## The full source

Two files: `index.html` loads the grid and declares the mount point, `demo.js` configures and creates it. Copy both as they are below and it runs.

### index.html

```html
<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>How to draw a chart from grid data that follows the grid's filters</title>
    <meta
      name="description"
      content="One bar chart reads a twelve-row grid of deals by region. Type in the filter box and both the grid and the chart narrow to the match; click a bar and the grid narrows to that region. Built with Lattice Grid loaded by script tag, no install and no build."
    />
    <link rel="icon" href="data:," />
    <!--
      The grid's stylesheet, from jsDelivr. The address names the exact
      release, 1.68.2, and carries the hash of the file it expects, so the
      page can never quietly pick up a different build than the one it was
      checked against.
    -->
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@toclocoinc/lattice-grid@1.68.2/lattice-grid.min.css"
      integrity="sha384-mcpd7S8C5nz58bZDAXdYH6rzezEhfN7B4u2SlW426dSe20GnkxTu4TygyOILnCth"
      crossorigin="anonymous"
    />
    <style>
      body { margin: 0; font-family: system-ui, sans-serif; background: #f4f6f9; color: #131a24; }
      header { padding: 1.5rem 1.5rem 0.5rem; max-width: 960px; margin: 0 auto; }
      header p { color: #4a5568; }
      header a { color: #2d6bff; }
      main { max-width: 960px; margin: 0 auto; padding: 0 1.5rem 2.5rem; }
      #toolbar { margin: 0 0 0.75rem; }
      #quick { font: inherit; padding: 0.4rem 0.75rem; border: 1px solid #ccd3dc; border-radius: 4px; width: 240px; }
      #chart { height: 220px; margin-bottom: 0.75rem; }
      #grid { height: 300px; }
      #stat { font-size: 0.9rem; color: #4a5568; margin: 0.75rem 0 0; }
    </style>
  </head>
  <body>
    <header>
      <h1>How to draw a chart from grid data that follows the grid's filters</h1>
      <p>
        Twelve deals sit in the grid below, one bar chart reading their value by region above it.
        Type in the box and both views narrow to the match, because the chart reads the grid's own
        filtered rows rather than a snapshot taken when it was made. Click a bar and the grid narrows
        to that region too. Read the
        <a href="https://www.latticegrid.dev/docs/how-to/chart-that-follows-the-grid/">full how-to</a>
        on latticegrid.dev.
      </p>
    </header>
    <main>
      <div id="toolbar">
        <input id="quick" type="search" placeholder="Filter rows…" aria-label="Filter rows" />
      </div>
      <div id="chart"></div>
      <div id="grid"></div>
      <p id="stat"></p>
    </main>

    <!--
      The library and the charts module, as classic script tags. No npm
      install, no bundler, no type="module": each file runs as it arrives.
      The charts module extends the LatticeGrid global with createChart
      rather than defining its own, so it must load after the core.
    -->
    <script
      src="https://cdn.jsdelivr.net/npm/@toclocoinc/lattice-grid@1.68.2/lattice-grid.min.js"
      integrity="sha384-vCzLyFYn0T0lz/vkdH4x0JpJZkOazZgI2LiGui7lm5uerdZd0Z46G9hr3Aq1FFPS"
      crossorigin="anonymous"
    ></script>
    <script
      src="https://cdn.jsdelivr.net/npm/@toclocoinc/lattice-grid@1.68.2/modules/charts.min.js"
      integrity="sha384-vce58lKHTYTPFMiuCVxvVrB1ElDH3vgbsvT2Ou+aVSL8hllLtbAnlOS6aReXJRU/"
      crossorigin="anonymous"
    ></script>
    <script src="./demo.js"></script>
  </body>
</html>
```

### demo.js

```js
/**
 * A bar chart drawn from the grid's own data, following its filtered rows.
 *
 * createChart({ grid, container, type, x, y }) draws one bar per distinct
 * value of `x`, its length the sum of `y` in the rows that carry it. It
 * subscribes to nothing: it redraws itself on the grid's own next frame
 * whenever the grid's rows change, so the same chart follows a quick filter
 * with no extra wiring. `filterOnClick: true` is the mirror image: clicking
 * a bar sets a column filter on the grid to the value that bar stands for.
 */

// Tied to toclocoinc.github.io only; has no effect anywhere else and needs
// no key at all to run this page from a local copy.
LatticeGrid.setLicence(
  'LG1.eyJ2IjoxLCJwIjoibGF0dGljZS1ncmlkIiwidCI6IlRPQ0xPQ08gSW5jIC0gcHVibGljIGRlbW9zIiwiZSI6IjIwMzAtMDEtMDEiLCJkIjpbInRvY2xvY29pbmMuZ2l0aHViLmlvIl19.9De42ua3aCGpiMB6EVRP7Tv-upUlDI-0T07rlSPzvCrsqg8t4YJi7SRnStEpAg48uzmcG7il1fR_TfwkUE7iCA'
);

const ROWS = [
  { id: 1, rep: 'Priya Shah', region: 'North', deal: 42000 },
  { id: 2, rep: 'Tom Blake', region: 'South', deal: 18500 },
  { id: 3, rep: 'Elin Karlsson', region: 'North', deal: 27500 },
  { id: 4, rep: 'Dan Kowalski', region: 'East', deal: 31000 },
  { id: 5, rep: 'Carla Nunes', region: 'South', deal: 22750 },
  { id: 6, rep: 'Frank Osei', region: 'West', deal: 15900 },
  { id: 7, rep: 'Alice Chen', region: 'East', deal: 38250 },
  { id: 8, rep: 'Bob Diaz', region: 'North', deal: 19800 },
  { id: 9, rep: 'Grace Lin', region: 'West', deal: 26400 },
  { id: 10, rep: 'Marco Rossi', region: 'South', deal: 33600 },
  { id: 11, rep: 'Nadia Petrov', region: 'East', deal: 21200 },
  { id: 12, rep: 'Owen Clarke', region: 'West', deal: 29750 },
];

const grid = LatticeGrid.createGrid(document.getElementById('grid'), {
  rowKey: 'id',
  columns: [
    { field: 'rep', title: 'Rep', layout: { width: 160 } },
    { field: 'region', title: 'Region', layout: { width: 120 } },
    {
      field: 'deal', title: 'Deal', type: 'number',
      format: { style: 'currency', currency: 'USD', decimals: 0 }, total: 'sum',
    },
  ],
  rows: ROWS,
});
window.__demoGrid = grid; // read by tools/verify.mjs

const chart = LatticeGrid.createChart({
  grid,
  container: document.getElementById('chart'),
  type: 'bar',
  x: 'region',
  y: 'deal',
  title: 'Deal value by region (click a bar to filter)',
  filterOnClick: true,
});
window.__demoChart = chart; // read by tools/verify.mjs

const stat = document.getElementById('stat');
const report = ({ categories, empty }) => {
  window.__lastDraw = { categories, empty }; // read by tools/verify.mjs
  const rows = grid.rows.count();
  stat.textContent = empty
    ? 'No rows match: the chart and the grid agree.'
    : `${categories.length} bar${categories.length === 1 ? '' : 's'}, ${rows} row${rows === 1 ? '' : 's'} in the grid.`;
};
report(chart.data()); // the chart has already drawn once by the time createChart returns
chart.on('draw', report);

document.getElementById('quick').addEventListener('input', (e) => {
  grid.filters.quick(e.target.value);
});
```

The chart subscribes to nothing: it redraws itself on the grid's own next frame whenever the
grid's rows change, so a quick filter, a column filter or a sort all reach the chart with no
extra wiring.

## Two things to know

- **A chart draws the grid's filtered rows, not the row count.** `y: 'deal'` sums the deal value
  of the rows behind each bar; a filter that removes rows changes the sum a bar reports, not just
  how many bars are drawn.
- **The quick filter and a bar click set different filters.** Clicking a bar sets a column filter
  (`region = North`); clearing the quick-filter box does not clear that column filter, since they
  are two independent filters composed together.

## Running it yourself

Open `index.html` in a browser, or serve the folder with any static file server. The grid and the
charts module load from jsDelivr by script tag, so there is no install and no build step. It runs
keyless on `localhost`; the licence key in `demo.js` is bound to `toclocoinc.github.io` and has no
effect anywhere else.

## Licence

MIT, see [LICENSE](./LICENSE). Lattice Grid itself is licensed separately per domain:
https://www.latticegrid.dev/pricing/
