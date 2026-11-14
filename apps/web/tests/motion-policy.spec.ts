import { test, expect } from '@playwright/test';
import { readRunningAnimations, unexpectedLoops, unexpectedFinite } from './_support/motion-inventory';
const scene = `<style>@keyframes policy-loop {from{height:10px}to{height:30px}} section>*{width:10px;height:10px}</style><section data-testid="closer-section"><div class="construction-extension"></div><div data-slot="closer-floodlight"></div><div class="closer-beam"></div><span data-construction-prop="fixture"><svg width="10" height="10"></svg></span></section>`;

test('infinite animations on every kept closing target are rejected', async ({ page }, info) => {
 await page.setContent(scene);
 await page.evaluate(() => {
  for (const el of document.querySelectorAll<HTMLElement | SVGElement>('.construction-extension,[data-slot="closer-floodlight"],.closer-beam,svg')) el.style.animation = 'policy-loop 10s linear infinite';
 });
 await expect.poll(async () => unexpectedLoops(await page.evaluate(readRunningAnimations)).length).toBe(4);
 const rejected = unexpectedLoops(await page.evaluate(readRunningAnimations));
 expect(rejected.every(a => a.loop && !a.closingTransition)).toBe(true);
 await info.attach('rejected-infinite', { body: JSON.stringify(rejected), contentType: 'application/json' });
});

test('unrelated transitions fail on the same targets while named scroll transitions pass', async ({ page }, info) => {
 await page.setContent(scene);
 await page.evaluate(() => {
  const nodes = [...document.querySelectorAll<HTMLElement | SVGElement>('.construction-extension,[data-slot="closer-floodlight"],.closer-beam,svg')];
  for (const el of nodes) {
   el.style.transition = 'none';
   el.style.width = '10px'; el.style.height = '10px'; el.style.translate = '0px'; el.style.scale = '1'; el.style.transform = 'translateY(0px)';
  }
  // Settle fixture initial values before enabling the transitions under test.
  document.body.getBoundingClientRect();
  for (const el of nodes) el.style.transition = 'width 10s linear,height 10s linear,translate 10s linear,scale 10s linear,transform 10s linear';
  document.body.getBoundingClientRect();
  for (const el of nodes) el.style.width = '30px';
  nodes[0].style.height = '30px'; nodes[1].style.translate = '1px'; nodes[2].style.height = '30px'; nodes[2].style.scale = '1.2'; nodes[3].style.transform = 'translateY(1px)';
 });
 await expect.poll(async () => unexpectedFinite(await page.evaluate(readRunningAnimations)).length).toBe(4);
 const records = await page.evaluate(readRunningAnimations);
 const rejected = unexpectedFinite(records);
 expect(rejected.every(a => a.name === 'transition:width' && !a.closingTransition && !a.loop)).toBe(true);
 expect(records.filter(a => a.closingTransition)).toHaveLength(5);
 await info.attach('rejected-unrelated', { body: JSON.stringify({ rejected, allowed: records.filter(a => a.closingTransition) }), contentType: 'application/json' });
});
