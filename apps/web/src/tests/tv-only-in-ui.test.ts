// tv()-only-in-ui gate (design-system Phase C, 2026-07-03). A VALUE import
// from 'tailwind-variants' (anything that can call tv()) is only legal inside
// src/lib/components/ui; type-only imports are allowed anywhere. The engine +
// the convention it codifies live in @yesid/gates (minted there — it makes no
// byte-equivalence claim to an older gate); this is the thin consumer that
// runs it against yesid.dev's tree.
import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { tvOnlyInUiViolations } from '@yesid/gates';

describe('tv()-only-in-ui gate', () => {
	it('tailwind-variants value imports appear only under src/lib/components/ui', () => {
		const root = resolve(process.cwd(), 'src');
		const { fileCount, violations } = tvOnlyInUiViolations({
			root,
			uiRoots: [resolve(root, 'lib/components/ui')],
		});
		// Sanity: the walk actually scanned files (guards a silent zero-file pass).
		expect(fileCount).toBeGreaterThan(0);
		expect(violations, violations.join('\n')).toEqual([]);
	});
});
