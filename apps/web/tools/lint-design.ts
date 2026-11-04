import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { brandHexViolations, styleRegressionViolations } from '@yesid/gates';
import { YESID_FORBIDDEN } from './design-gates';

const failures: string[] = [];
const root = fileURLToPath(new URL('../src', import.meta.url));

const brand = brandHexViolations({
	root,
	hexes: ['#E07800', '#FFB627'],
	// Existing illustrations and Mermaid's fallback palette. New UI uses tokens.
	allowlist: new Set([
		join(root, 'lib/components/about/train-rocket-shapes.ts'),
		join(root, 'lib/motion/svg/MetroNetwork.svelte'),
		join(root, 'lib/utils/mermaid-theme.ts'),
	]),
});
if (brand.fileCount === 0) failures.push('Brand colour check scanned no source files');
failures.push(...brand.violations);

for (const { reason, hits } of styleRegressionViolations({
	root,
	forbidden: YESID_FORBIDDEN,
})) {
	if (hits.length > 0) failures.push(`${reason}: ${hits.join(', ')}`);
}

if (failures.length > 0) {
	console.error(failures.join('\n'));
	process.exit(1);
}
