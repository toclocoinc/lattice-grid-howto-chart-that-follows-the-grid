/**
 * Load the demo in a real headless browser and check that it works.
 *
 * Serves the project locally and drives it with the same minimal Chrome
 * driver the grid's own test suite uses (tools/browser.js), so this needs no
 * dependency beyond Chrome itself.
 *
 * Checks:
 *   - the library and the charts module arrived (LatticeGrid.createChart);
 *   - all 12 rows land in the grid (grid.rows.count()), and the chart draws
 *     four bars, one per region (chart.data().categories, the chart's own
 *     record of what it last bound - see the API reference's "The chart"
 *     method table);
 *   - typing into the quick-filter box narrows the grid AND the chart
 *     together: filtering to "North" leaves 3 rows and 1 bar, because the
 *     chart reads the grid's filtered rows rather than a snapshot taken
 *     when it was made; clearing the box brings both back to 12 and 4;
 *   - clicking a bar (a real pointer click, at the bar's own coordinates,
 *     since the chart hit-tests the click position rather than the DOM
 *     target) sets a column filter on the grid to that bar's region,
 *     narrowing the grid without touching the filter box;
 *   - nothing logged a console error or threw while the page ran.
 *
 * Exits non-zero on any failure, so it can gate a deployment.
 *
 * Usage: node tools/verify.mjs
 */

import { startServer } from './serve.mjs';
import { Browser, available } from './browser.js';

if (!available()) {
  console.log('No headless browser on this machine; skipping verify.mjs.');
  process.exit(0);
}

/** Click an element at its own on-screen centre, the way a visitor would.
 *  The chart hit-tests a click by its clientX/clientY against the plot,
 *  not by the DOM node the event targets, so a synthetic click with no
 *  coordinates (or coordinates at 0,0) always misses. */
const clickAt = (selector) => `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return false;
  const r = el.getBoundingClientRect();
  const ev = new MouseEvent('click', {
    bubbles: true, cancelable: true, view: window,
    clientX: r.x + r.width / 2, clientY: r.y + r.height / 2,
  });
  el.dispatchEvent(ev);
  return true;
})()`;

const { server, port } = await startServer();
const browser = new Browser();

try {
  await browser.start();

  await browser.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      window.__errs = [];
      addEventListener('error', (e) => window.__errs.push(String(e.message || e)));
      addEventListener('unhandledrejection', (e) => window.__errs.push('unhandledrejection: ' + String(e.reason)));
      const origError = console.error.bind(console);
      console.error = (...args) => { window.__errs.push('console.error: ' + args.map(String).join(' ')); origError(...args); };
    `,
  });

  await browser.open(`http://127.0.0.1:${port}/`);
  await new Promise((r) => setTimeout(r, 500));

  const failures = [];

  const hasGrid = await browser.evaluate(`typeof LatticeGrid !== 'undefined' && typeof LatticeGrid.createGrid === 'function'`);
  if (!hasGrid) failures.push('LatticeGrid.createGrid was not found on the page');

  const hasChart = await browser.evaluate(`typeof LatticeGrid.createChart === 'function'`);
  if (!hasChart) failures.push('LatticeGrid.createChart was not found on the page (the charts module did not load)');

  const totalRows = await browser.evaluate(`window.__demoGrid.rows.count()`);
  if (totalRows !== 12) failures.push(`expected 12 rows (grid.rows.count()), grid reports ${totalRows}`);

  const initialCats = await browser.evaluate(`window.__demoChart.data().categories`);
  const expectedCats = ['North', 'South', 'East', 'West'];
  if (JSON.stringify([...initialCats].sort()) !== JSON.stringify([...expectedCats].sort())) {
    failures.push(`expected 4 bars, one per region, got ${JSON.stringify(initialCats)}`);
  }
  const initialBars = await browser.evaluate(`document.querySelectorAll('#chart .lat-chartview__bar').length`);
  if (initialBars !== 4) failures.push(`expected 4 bar marks drawn, found ${initialBars}`);

  // Type "North" into the quick filter: both the grid and the chart should
  // narrow to the rows in that region.
  await browser.evaluate(`(() => {
    const input = document.getElementById('quick');
    input.value = 'North';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await new Promise((r) => setTimeout(r, 400));

  const filteredRows = await browser.evaluate(`window.__demoGrid.rows.count()`);
  const filteredBars = await browser.evaluate(`document.querySelectorAll('#chart .lat-chartview__bar').length`);
  const filteredCats = await browser.evaluate(`window.__demoChart.data().categories`);
  if (filteredRows !== 3) failures.push(`quick-filtering to "North" left the grid showing ${filteredRows} rows, expected 3`);
  if (filteredBars !== 1) failures.push(`quick-filtering to "North" left the chart showing ${filteredBars} bars, expected 1`);
  if (JSON.stringify(filteredCats) !== JSON.stringify(['North'])) {
    failures.push(`quick-filtering to "North" left the chart's categories as ${JSON.stringify(filteredCats)}, expected ["North"]`);
  }

  // Clear the box: both views come back to their unfiltered state.
  await browser.evaluate(`(() => {
    const input = document.getElementById('quick');
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await new Promise((r) => setTimeout(r, 400));

  const clearedRows = await browser.evaluate(`window.__demoGrid.rows.count()`);
  const clearedBars = await browser.evaluate(`document.querySelectorAll('#chart .lat-chartview__bar').length`);
  if (clearedRows !== 12) failures.push(`clearing the quick filter left the grid showing ${clearedRows} rows, expected 12`);
  if (clearedBars !== 4) failures.push(`clearing the quick filter left the chart showing ${clearedBars} bars, expected 4`);

  // Click the first bar (North): the grid narrows to that region, through a
  // column filter, not the quick-filter box.
  const clicked = await browser.evaluate(clickAt('#chart .lat-chartview__bar'));
  if (!clicked) failures.push('could not find a bar to click');
  await new Promise((r) => setTimeout(r, 400));

  const clickedRows = await browser.evaluate(`window.__demoGrid.rows.count()`);
  const appliedFilter = await browser.evaluate(`JSON.stringify(window.__demoGrid.filters.get())`);
  if (clickedRows !== 3) failures.push(`clicking the first bar left the grid showing ${clickedRows} rows, expected 3 (the North deals)`);
  if (!/"region"/.test(appliedFilter) || !/"North"/.test(appliedFilter)) {
    failures.push(`clicking the first bar did not set a region=North filter on the grid, filters.get() returned ${appliedFilter}`);
  }

  const errors = await browser.evaluate('window.__errs');
  if (errors.length) failures.push(`console/window errors: ${errors.join(' | ')}`);

  if (failures.length) {
    console.error('FAILED:\n' + failures.map((f) => `  - ${f}`).join('\n'));
    process.exitCode = 1;
  } else {
    console.log(
      'OK: 12 rows, a bar chart of deal value by region drawing 4 bars, typing "North" into the ' +
      'quick filter narrows both the grid (3 rows) and the chart (1 bar) together, clearing it ' +
      'restores both, and clicking a bar sets a region filter on the grid narrowing it to 3 rows. ' +
      '0 console errors.'
    );
  }
} finally {
  await browser.close();
  server.close();
}
