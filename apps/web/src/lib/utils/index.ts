// Utility-layer barrel.
// Pure client-safe engines — never CMS-owned. Imported by components, adapters,
// and route loaders alike. Function names are globally unique so
// `export *` is safe.
//
// IMPORTANT: server-only utilities are NOT re-exported here — importing them
// through the barrel would pull `$app/env/private` into the browser bundle.
// Import them directly by specific path:
//   - Weather fetch: `import { fetchMontrealWeather } from '#lib/utils/weather.ts'`
//     (server-only — uses $app/env/private; loaded from +page.server.ts only).
//   - Type-only consumers (e.g. <WeatherData> in a component) are also imported
//     directly: `import type { WeatherData } from '#lib/utils/weather.ts'`.
//   - README rendering: `import { renderGithubReadme } from '#lib/server/markdown.ts'`.
//     Slice-23 kept it out of this barrel; consolidation-deploy-honesty moved
//     it (with the Shiki highlighter it imports) into $lib/server so the build
//     itself refuses any client-reachable import — highlighting is
//     render/prerender-time only, CodeBlock consumes pre-highlighted HTML.
// Documented in CONSTITUTION.md § Data Architecture (17b-9).

export {
	cn,
	twMergeConfig,
	type WithoutChild,
	type WithoutChildren,
	type WithoutChildrenOrChild,
	type WithElementRef,
} from '@yesid/ui/cn';
export * from './collections'
export * from './locale'
export * from './project-metrics'
export * from './service-colors'
export * from './service-svg'
