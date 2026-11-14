import { writeFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

test.skip(({ viewport }) => viewport?.width !== 1440, 'Explicit cold-load viewports run in desktop.');
for (const width of [390, 1440]) {
 test(`${width}px cold home records CLS without an Easter-egg shift`, async ({ browser, baseURL }, info) => {
  const context = await browser.newContext({ baseURL, viewport: { width, height: 900 }, colorScheme: 'dark', serviceWorkers: 'block' });
  await context.addInitScript(() => {
   type Shift = { startTime: number; value: number; edge: boolean; sources: string[] };
   const state = { supported: PerformanceObserver.supportedEntryTypes.includes('layout-shift'), shifts: [] as Shift[] };
   Object.defineProperty(window, '__manifestoCLS', { value: state });
   document.addEventListener('themechange', () => performance.mark('cls-app-mounted'), { once: true });
   if (state.supported) new PerformanceObserver(list => {
    for (const item of list.getEntries()) {
     const entry = item as PerformanceEntry & { value: number; hadRecentInput: boolean; sources?: { node?: Node }[] };
     if (entry.hadRecentInput) continue;
     const elements = (entry.sources ?? []).map(s => s.node instanceof Element ? s.node : s.node?.parentElement).filter((el): el is Element => Boolean(el));
     state.shifts.push({ startTime: entry.startTime, value: entry.value, edge: elements.some(el => Boolean(el.closest('[data-testid="manifesto-edge-right"]'))), sources: elements.map(el => el.getAttribute('data-testid') ?? el.tagName) });
    }
   }).observe({ type: 'layout-shift', buffered: true });
  });
  const page = await context.newPage();
  try {
   await page.route(/plausible|web3forms|cal\.com|\/api\/event/, r => r.abort());
   await page.goto('/');
   await expect.poll(() => page.evaluate(() => performance.getEntriesByName('cls-app-mounted').length)).toBe(1);
   await page.evaluate(() => document.fonts.ready);
   await expect(page.getByTestId('manifesto-edge-right')).toBeAttached();
   // Observe startup after fonts and hydration; this is a measurement window, not a timeout override.
   await page.waitForTimeout(1000);
   const state = await page.evaluate(() => (window as unknown as { __manifestoCLS: { supported: boolean; shifts: { startTime: number; value: number; edge: boolean; sources: string[] }[] } }).__manifestoCLS);
   expect(state.supported).toBe(true);
   let cls = 0, session = 0, start = -1, last = -1;
   for (const shift of state.shifts) {
    if (start < 0 || shift.startTime - last > 1000 || shift.startTime - start > 5000) { session = shift.value; start = shift.startTime; }
    else session += shift.value;
    last = shift.startTime; cls = Math.max(cls, session);
   }
   const edgeCLS = state.shifts.filter(s => s.edge).reduce((sum, s) => sum + s.value, 0);
   expect(edgeCLS).toBe(0);
   const evidence = { width, cls, edgeCLS, shifts: state.shifts, cache: 'new isolated context; routed requests disable HTTP cache' };
   const path = info.outputPath(`cls-${width}.json`);
   writeFileSync(path, JSON.stringify(evidence, null, 2));
   await info.attach('cold-load-cls', { path, contentType: 'application/json' });
   console.log(`cold-load CLS ${width}: total=${cls}, Easter-egg=${edgeCLS}`);
  } finally { await context.close(); }
 });
}
