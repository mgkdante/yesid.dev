// Locales that currently have translated content AND published URL coverage.
// THE FLIP LEVER (slice-28.6): adding a locale here causes:
//   - og:locale:alternate meta to emit for this locale
//   - hreflang link tags to include this locale
//   - sitemap to iterate routes × this locale
//   - canonicalFor to emit /{locale}-prefixed canonicals
//   - the EN|FR locale switcher (MenuOverlay/Footer) to become visible
//   - a `static/og/default.{locale}.png` asset to be needed
//
// Lives in its own dependency-free module (split from seo-defaults, homework
// batch 2026-07-02) so bare-bun scripts (scripts/generate-og-default.ts) can
// import it without dragging in locale-routing's virtual `$app/environment`.
// App code should keep importing it from $lib/utils/seo-defaults (re-export).
import type { Locale } from '$lib/types';

export const PUBLISHED_LOCALES: readonly Locale[] = ['en', 'fr', 'es'];
