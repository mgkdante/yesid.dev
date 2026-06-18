// Utility-layer barrel.
// Pure client-safe engines — never CMS-owned. Imported by components, repositories,
// adapters, and route loaders alike. Function names are globally unique so
// `export *` is safe.
//
// IMPORTANT: server-only utilities are NOT re-exported here — importing them
// through the barrel would pull `$env/dynamic/private` into the browser bundle.
// Import them directly by specific path:
//   - Weather fetch: `import { fetchMontrealWeather } from '$lib/utils/weather'`
//     (server-only — uses $env/dynamic/private; loaded from +page.server.ts only).
//   - Type-only consumers (e.g. <WeatherData> in a component) are also imported
//     directly: `import type { WeatherData } from '$lib/utils/weather'`.
//   - Markdown rendering: `import { marked } from '$lib/utils/markdown'`.
//     Slice-23: deliberately NOT re-exported here. The markdown renderer imports
//     the shared Shiki highlighter, which pulls its theme and language registry.
//     Browser components only need `cn`, `locale`, etc. from this barrel; forcing
//     syntax rendering imports to be specific keeps accidental bundle growth visible.
// Documented in CONSTITUTION.md § Data Architecture (17b-9).

export * from './cn'
export * from './collections'
export * from './locale'
export * from './project-metrics'
export * from './service-colors'
export * from './shapes'
export * from './stack-roles'
export * from './service-svg'
