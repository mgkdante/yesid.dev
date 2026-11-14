import values from '../../../fixtures/content/copy-migration.json';
import type { LocalizedString } from '@repo/shared';

/** Preserve the approved fixture copy per locale while new production columns are empty. */
export function migrationCopy<C extends keyof typeof values>(
	rows: ReadonlyArray<Record<string, unknown> & { languages_code: string }>,
	collection: C,
	field: keyof (typeof values)[C],
): LocalizedString {
	const fallback = values[collection][field] as LocalizedString;
	const result = { ...fallback };
	for (const locale of ['en', 'fr', 'es'] as const) {
		const value = rows.find(row => row.languages_code === locale)?.[field as string];
		if (typeof value === 'string' && value.trim()) result[locale] = value;
	}
	return result;
}
