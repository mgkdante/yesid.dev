// Slice 15a: SSR re-enabled. Slice 17e's motion re-engineering moved all
// GSAP imports behind onMount / Svelte actions, so no browser-only
// APIs are touched during module-load or initial render. SSR is now safe and
// REQUIRED for social crawlers (Twitter/LinkedIn/Facebook don't run JS) to
// see the home page's meta tags emitted by <SeoHead> in +layout.svelte.
// If a new browser-only import is added to HomePage.svelte, guard it with
// `if (browser)` or lazy-load inside onMount — don't re-disable SSR here.
//
// DO NOT DELETE this file even though `ssr = true` is the SvelteKit default
// (slice-28.2 verified): with no universal +page.ts in this dir, svelte-kit
// sync emits a degraded `LayoutLoad` typing (`Partial<App.PageData> &
// Record<string, any> | void`) instead of `OutputDataShape<LayoutParentData>`,
// which breaks layout.test.ts type-checks (11 svelte-check errors).
export const ssr = true;
