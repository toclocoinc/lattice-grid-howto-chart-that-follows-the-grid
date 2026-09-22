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
