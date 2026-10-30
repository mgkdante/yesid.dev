import { fileURLToPath } from 'node:url';
import { styleRegressionViolations } from '@yesid/gates';
import { YESID_FORBIDDEN } from './design-gates';

const failures: string[] = [];

for (const { reason, hits } of styleRegressionViolations({
	root: fileURLToPath(new URL('../src', import.meta.url)),
	forbidden: YESID_FORBIDDEN,
})) {
	if (hits.length > 0) failures.push(`${reason}: ${hits.join(', ')}`);
}

if (failures.length > 0) {
	console.error(failures.join('\n'));
	process.exit(1);
}
