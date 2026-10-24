import { test, expect } from "@playwright/test";
import {
  gotoFirstDetail,
  blogPostLinks,
  projectDetailLinks,
} from "../_support/helpers";

for (const reducedMotion of ["reduce", "no-preference"] as const)
for (const theme of ["light", "dark"] as const) {
  for (const width of [375, 768, 1366]) {
    for (const kind of ["blog", "projects"] as const) {
      test(`${kind} article reading contrast and scale — ${theme} ${width}px ${reducedMotion}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 600 });
        await page.emulateMedia({ reducedMotion });
        await page.addInitScript(
          (theme) => localStorage.setItem("theme", theme),
          theme,
        );
        await gotoFirstDetail(
          page,
          `/${kind}`,
          kind === "blog" ? blogPostLinks : projectDetailLinks,
          kind === "blog" ? "blog-detail-page" : "project-detail-page",
        );
        const body = page
          .locator(
            kind === "blog"
              ? ".blog-section-body:visible"
              : '.sections-column .section-body:not([data-slot="collapsible-content"]):visible',
          )
          .first();
        await expect(body).toBeVisible();
        // Exercise inherited/Markdown prose in the article owner, independent of editorial copy.
        for (const markdown of kind === "projects" ? [false, true] : [true]) {
          const samples = await body.evaluate((element, markdown) => {
            element.classList.toggle("prose-dark", markdown);
            const fixture = document.createElement("div");
            fixture.innerHTML =
              "<p>Readable narrative with enough words to wrap naturally on a narrow phone.</p><ul><li>A list item retaining the same reading hierarchy.</li></ul><blockquote><p>A quoted passage with a distinct but legible treatment.</p></blockquote>";
            element.append(fixture);
            const ctx = document.createElement("canvas").getContext("2d")!;
            const pixel = () =>
              [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
            const luminance = (rgb: number[]) =>
              rgb
                .map((v) => {
                  const c = v / 255;
                  return c <= 0.04045
                    ? c / 12.92
                    : ((c + 0.055) / 1.055) ** 2.4;
                })
                .reduce(
                  (sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i],
                  0,
                );
            const results = [...fixture.querySelectorAll("p, li")].map(
              (node) => {
                const style = getComputedStyle(node);
                const ancestors: Element[] = [];
                for (let p: Element | null = node; p; p = p.parentElement)
                  ancestors.unshift(p);
                ctx.fillStyle = "#fff";
                ctx.fillRect(0, 0, 1, 1);
                for (const ancestor of ancestors) {
                  ctx.fillStyle = getComputedStyle(ancestor).backgroundColor;
                  ctx.fillRect(0, 0, 1, 1);
                }
                const background = luminance(pixel());
                ctx.fillStyle = style.color;
                ctx.fillRect(0, 0, 1, 1);
                const foreground = luminance(pixel());
                const rect = node.getBoundingClientRect();
                return {
                  contrast:
                    (Math.max(background, foreground) + 0.05) /
                    (Math.min(background, foreground) + 0.05),
                  size: parseFloat(style.fontSize),
                  leading:
                    parseFloat(style.lineHeight) / parseFloat(style.fontSize),
                  left: rect.left,
                  right: rect.right,
                };
              },
            );
            fixture.remove();
            return results;
          }, markdown);
          for (const sample of samples) {
            expect.soft(sample.contrast).toBeGreaterThanOrEqual(4.5);
            expect
              .soft(sample.size)
              .toBeGreaterThanOrEqual(width < 1024 ? 18 : 20);
            expect.soft(sample.leading).toBeGreaterThanOrEqual(1.6);
            expect
              .soft(Math.round(sample.leading * 100) / 100)
              .toBeLessThanOrEqual(1.9);
            expect.soft(sample.left).toBeGreaterThanOrEqual(0);
            expect.soft(sample.right).toBeLessThanOrEqual(width);
          }
        }
        await body.evaluate((element) => {
          for (const level of [2, 3, 4]) {
            const heading = document.createElement(`h${level}`);
            heading.dataset.permalinkFixture = String(level);
            heading.innerHTML = `Fixture heading <a class="heading-anchor" href="#fixture-${level}">#</a>`;
            element.append(heading);
          }
        });
        for (const level of [2, 3, 4]) {
          const heading = body.locator(`[data-permalink-fixture="${level}"]`);
          const link = heading.locator("a");
          await link.press("Shift");
          await heading.hover();
          await expect(link).toBeFocused();
          expect(await link.evaluate(el => el.matches(":focus-visible") && el.parentElement!.matches(":hover"))).toBe(true);
          await expect(link).toHaveCSS("opacity", "1");
          expect(await link.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe("none");
        }
      });
    }
  }
}
