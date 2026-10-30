import { fileURLToPath } from 'node:url';
import tokens from '@yesid/tokens/tokens.json' with { type: 'json' };
import { runContrastPairs, runIdentities, styleRegressionViolations } from '@yesid/gates';
import { YESID_AA_PAIRS, YESID_FORBIDDEN, YESID_IDENTITIES } from './design-gates';

const failures: string[] = [];

for (const { reason, hits } of styleRegressionViolations({
	root: fileURLToPath(new URL('../src', import.meta.url)),
	forbidden: YESID_FORBIDDEN,
})) {
	if (hits.length > 0) failures.push(`${reason}: ${hits.join(', ')}`);
}
for (const { label, ratio, floor, pass } of runContrastPairs(tokens, YESID_AA_PAIRS)) {
	if (!pass) failures.push(`${label}: ${ratio.toFixed(2)}:1 is under ${floor}:1`);
}
for (const { label, a, b, pass } of runIdentities(tokens, YESID_IDENTITIES)) {
	if (!pass) failures.push(`${label}: ${a} is not ${b}`);
}

if (failures.length > 0) {
	console.error(failures.join('\n'));
	process.exit(1);
}
