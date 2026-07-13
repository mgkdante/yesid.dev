#!/usr/bin/env bun
/**
 * Compatibility entry point for the former default-only OG generator.
 *
 * `generate-og-cards.ts` is the single renderer for default, site, route, and
 * service cards. Delegating here prevents an older template or CMS tagline
 * from overwriting `default.<locale>.png` with conflicting public copy.
 *
 * The optional `--locale=en|fr|es` argument is forwarded. The canonical
 * generator refreshes the complete card set for that locale so every related
 * asset stays aligned.
 */

import { resolve } from 'node:path';

const generator = resolve(import.meta.dir, 'generate-og-cards.ts');
const child = Bun.spawn([process.execPath, generator, ...process.argv.slice(2)], {
	stdout: 'inherit',
	stderr: 'inherit',
});

process.exit(await child.exited);
