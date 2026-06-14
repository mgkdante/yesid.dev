import { test, expect } from '@playwright/test';

test.describe('/tech-stack page content', () => {
  test('tech-stack hero section renders with explainer text', async ({ page }) => {
    const response = await page.goto('/tech-stack');
    expect(response?.status()).toBe(200);

    await expect(page.locator('[data-testid="tech-stack-hero"]')).toBeVisible();

    // Stack explainer paragraph
    const explainer = page.locator('[data-testid="stack-explainer"]');
    await expect(explainer).toBeVisible();
    const text = await explainer.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('tech-stack hero renders terminal lines (visible or hidden per motion)', async ({ page }) => {
    await page.goto('/tech-stack');

    // Terminal lines container
    const terminal = page.locator('.hero-terminal');
    await expect(terminal).toBeVisible();

    // Terminal lines
    const lines = page.locator('.hero-terminal-line');
    const count = await lines.count();
    expect(count).toBeGreaterThan(0);

    // Line 0 (the command) carries visible:true at init regardless of motion,
    // so it gets the hero-line-visible class and reads opacity:1 immediately.
    const firstLine = lines.first();
    await expect(firstLine).toHaveClass(/hero-line-visible/);
    expect((await firstLine.textContent())?.trim().length).toBeGreaterThan(0);
  });

  test('tech-stack hero shows item count gauge', async ({ page }) => {
    await page.goto('/tech-stack');

    const hero = page.locator('[data-testid="tech-stack-hero"]');
    await expect(hero).toBeVisible();

    // The hero stat-value gauge is static markup in hero-col-side — it ALWAYS
    // renders (StatusDot + {itemCount}). Assert it unconditionally.
    const statValue = page.locator('.hero-stat-value');
    await expect(statValue).toHaveCount(1);
    await expect(statValue).toBeVisible();
    const valueText = await statValue.textContent();
    // The count is data.items.length — a positive integer.
    const match = valueText?.match(/\d+/);
    expect(match).toBeTruthy();
    expect(Number(match![0])).toBeGreaterThan(0);

    // The gauge label sits beside the count.
    const statLabel = page.locator('.hero-stat-label');
    await expect(statLabel).toBeVisible();
    expect((await statLabel.textContent())?.trim().length).toBeGreaterThan(0);
  });

  test('tech-stack engine band renders with engine component or loading state', async ({ page }) => {
    await page.goto('/tech-stack');

    // engine-band is static SSR markup (the hazard-framed wrapper around either
    // the live engine or its loading placeholder) — visible at load, no need to
    // wait on the network. The web-first assertion below auto-waits for it.
    const engineBand = page.locator('[data-testid="engine-band"]');
    await expect(engineBand).toBeVisible();

    // The band always frames EITHER the live engine OR the loading placeholder
    // (stable-frame contract: {#if EngineComponent} swaps one for the other).
    // Use a retrying web-first assertion on the union so the {#if} swap can't
    // race a bare count() snapshot to an empty result.
    const engine = page.locator('[data-testid="stack-engine"]');
    const loading = page.locator('[data-testid="stack-engine-loading"]');
    await expect(engine.or(loading).first()).toBeVisible();
  });

  test('tech-stack engine renders after hydration', async ({ page }) => {
    await page.goto('/tech-stack');

    // The async engine chunk imports in onMount, then {#if EngineComponent}
    // swaps the loading placeholder for the live engine. The web-first
    // assertion auto-retries until that swap lands — a deterministic wait on the
    // engine landmark itself, not a racy network-idle guess.
    const engine = page.locator('[data-testid="stack-engine"]');
    await expect(engine).toBeVisible();
  });

  test('tech-stack renders hero columns (main + side)', async ({ page }) => {
    await page.goto('/tech-stack');

    const heroColMain = page.locator('[data-testid="hero-col-main"]');
    const heroColSide = page.locator('[data-testid="hero-col-side"]');

    await expect(heroColMain).toBeVisible();
    // Side column visible on desktop, may be hidden on mobile
    if (test.info().project.name === 'desktop-chrome') {
      await expect(heroColSide).toBeVisible();
    }
  });

  test('tech-stack CTA section renders', async ({ page }) => {
    await page.goto('/tech-stack');

    const cta = page.locator('[data-testid="tech-stack-cta"]');
    await expect(cta).toBeVisible();

    // CTA should have heading and buttons
    const heading = cta.locator('h2');
    const text = await heading.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('tech-stack respects reduced-motion preference', async ({ page }) => {
    // Set reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/tech-stack');

    // Wait for hydration so onMount's reduced-motion branch runs (it flips
    // every line — content + cursor — to visible:true synchronously). onMount
    // also kicks off the engine chunk, so the engine landmark becoming visible
    // is a deterministic proof that onMount executed — wait on it, not network
    // idle. The toHaveCount assertions below are web-first and auto-retry too.
    await expect(page.locator('[data-testid="stack-engine"]')).toBeVisible();

    const totalLines = page.locator('.hero-terminal-line');
    const visibleLines = page.locator('.hero-terminal-line.hero-line-visible');

    const totalCount = await totalLines.count();
    const visibleCount = await visibleLines.count();

    expect(totalCount).toBeGreaterThan(0);
    // In reduced-motion every line is revealed — no opacity:0 lines remain.
    await expect(visibleLines).toHaveCount(totalCount);
    expect(visibleCount).toBe(totalCount);

    // And no animation class is applied (hero-line-animate is gated on
    // !isPrefersReducedMotion()).
    await expect(page.locator('.hero-terminal-line.hero-line-animate')).toHaveCount(0);
  });

  test('tech-stack renders in EN', async ({ page }) => {
    const response = await page.goto('/tech-stack');
    expect(response?.status()).toBe(200);

    const explainer = page.locator('[data-testid="stack-explainer"]');
    await expect(explainer).toBeVisible();
    const text = await explainer.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);

    // The explainer kicker is locale-resolved (EN copy).
    const kicker = explainer.locator('.explainer-kicker');
    await expect(kicker).toHaveText('what\'s a "stack"?');
  });

  test('tech-stack renders in FR (/fr/tech-stack)', async ({ page }) => {
    const response = await page.goto('/fr/tech-stack');
    expect(response?.status()).toBe(200);

    const explainer = page.locator('[data-testid="stack-explainer"]');
    await expect(explainer).toBeVisible();
    const text = await explainer.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);

    // FR is genuinely localized — the kicker resolves to the French copy,
    // proving the locale path renders real translations (not EN fallback).
    const kicker = explainer.locator('.explainer-kicker');
    await expect(kicker).toHaveText('c\'est quoi un « stack »?');
  });
});

