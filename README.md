# How to draw a chart from grid data that follows the grid's filters

One bar chart reads a twelve-row grid of deals, one bar per region, its length the region's total
deal value: `createChart({ grid, container, type: 'bar', x: 'region', y: 'deal' })`. Type into the
filter box and both the grid and the chart narrow to the match, because the chart reads the grid's
own filtered rows rather than a snapshot taken when it was made. Click a bar and `filterOnClick:
true` sets a column filter on the grid to that bar's region.

Live demo: https://toclocoinc.github.io/lattice-grid-howto-chart-that-follows-the-grid/

**Read the how-to:** https://www.latticegrid.dev/docs/how-to/chart-that-follows-the-grid/

## The snippet

```js
const grid = LatticeGrid.createGrid(document.getElementById('grid'), {
  rowKey: 'id',
  columns: [
    { field: 'rep', title: 'Rep' },
    { field: 'region', title: 'Region' },
    { field: 'deal', title: 'Deal', type: 'number', format: { style: 'currency', currency: 'USD' } },
  ],
  rows, // twelve deals across four regions
});

const chart = LatticeGrid.createChart({
  grid,
  container: document.getElementById('chart'),
  type: 'bar',
  x: 'region',
  y: 'deal',
  filterOnClick: true, // click a bar to filter the grid to it
});

document.getElementById('quick').addEventListener('input', (e) => {
  grid.filters.quick(e.target.value); // both the grid and the chart narrow
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
