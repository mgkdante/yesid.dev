import type { RequestHandler } from '@sveltejs/kit';
import { loadOgTitle, type OgType } from '$lib/og/load-title';
import { buildOgTree } from '$lib/og/template';
import { renderOgPng } from '$lib/og/render';
import { getOgFonts } from '$lib/og/fonts';
import type { Locale } from '$lib/types';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '$lib/utils/locale';

// Eager-call so font failures surface at deploy time, not mid-request.
// If this throws at module init, the whole route fails loud (500) — that
// is intentional; a broken deploy must not silently fall back.
getOgFonts();

const SLUG_RE = /^[a-z0-9-]+$/;
const DEFAULT_OG_URL = '/og/default.en.png';

// slice-28.1 (audit #24): 302 fallbacks carry s-maxage=86400 so repeat
// crawler hits on a missing/broken slug are served from the CDN edge instead
// of re-invoking the lambda (the not-found path still does a CMS lookup, the
// error path still attempts a render). Browser TTLs stay short (60s/300s);
// Vercel's CDN cache resets on deploy, so a fixed render or newly published
// slug surfaces with the next deploy at the latest.
const NOT_FOUND_FALLBACK_HEADERS = {
  location: DEFAULT_OG_URL,
  'cache-control': 'public, max-age=300, s-maxage=86400',
};
const ERROR_FALLBACK_HEADERS = {
  location: DEFAULT_OG_URL,
  'cache-control': 'public, max-age=60, s-maxage=86400',
};

const HAPPY_HEADERS = {
  'content-type': 'image/png',
  'cache-control': 'public, max-age=60, s-maxage=31536000, stale-while-revalidate=86400',
};

// Gate on SUPPORTED_LOCALES (the type-valid set), not PUBLISHED_LOCALES.
// `loadOgTitle` handles per-locale fallback internally via resolveLocale,
// so forwarding any supported locale is safe; gating tighter would silently
// strip a valid query string and surprise share-debugger crawlers.
function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export const GET: RequestHandler = async (event) => {
  const { type, slug } = event.params as { type: OgType; slug: string };

  // Validate slug shape — param matcher already validated `type`.
  if (!SLUG_RE.test(slug)) {
    return new Response('invalid slug', { status: 400 });
  }

  // Locale resolution: ?locale= query param, else default. Unpublished
  // locales fall back to default (matches defaultOgImageFor behavior).
  const localeParam = event.url.searchParams.get('locale');
  const locale: Locale =
    localeParam && isSupportedLocale(localeParam) ? localeParam : DEFAULT_LOCALE;

  // Slug lookup. Null → 302 short-TTL.
  let titleResult;
  try {
    titleResult = await loadOgTitle(type, slug, locale);
  } catch (err) {
    console.error('[og]', type, slug, err);
    return new Response(null, { status: 302, headers: ERROR_FALLBACK_HEADERS });
  }
  if (!titleResult) {
    return new Response(null, { status: 302, headers: NOT_FOUND_FALLBACK_HEADERS });
  }

  // Render. Any failure → 302 short-TTL + log.
  try {
    const tree = buildOgTree(titleResult);
    const png = await renderOgPng(tree);
    // Cast: BodyInit's lib.dom.d.ts shape rejects Uint8Array<ArrayBufferLike>
    // (only accepts ArrayBufferView<ArrayBuffer>), but Response accepts it at
    // runtime in both Node and the Web Fetch standard. Verified at the
    // satori/resvg seam (Task 5) — png is always a finite, non-shared buffer.
    return new Response(png as BodyInit, { status: 200, headers: HAPPY_HEADERS });
  } catch (err) {
    console.error('[og]', type, slug, err);
    return new Response(null, { status: 302, headers: ERROR_FALLBACK_HEADERS });
  }
};
