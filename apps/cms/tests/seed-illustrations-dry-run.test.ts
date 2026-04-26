import { describe, it, expect } from 'bun:test';
import {
	toIllustrationRow,
	loadIllustrationsFixture,
	type IllustrationFixture,
} from '../scripts/seed-illustrations';

describe('seed-illustrations pure helpers', () => {
	const fixture = loadIllustrationsFixture();

	describe('loadIllustrationsFixture', () => {
		it('returns at least 8 rows', () => {
			expect(fixture.length).toBeGreaterThanOrEqual(8);
		});

		it('every row has id + label + category + description', () => {
			for (const row of fixture) {
				expect(row.id).toBeTruthy();
				expect(row.label).toBeTruthy();
				expect(row.category).toBeTruthy();
				expect(row.description).toBeTruthy();
			}
		});
	});

	describe('toIllustrationRow', () => {
		it('returns the database row shape (no file_legacy_path; replaced by file UUID)', () => {
			const fakeUuid = '00000000-0000-0000-0000-000000000001';
			const row = toIllustrationRow(fixture[0], fakeUuid);
			expect(row).toEqual({
				id: fixture[0].id,
				file: fakeUuid,
				label: fixture[0].label,
				category: fixture[0].category,
				tags: fixture[0].tags,
				description: fixture[0].description,
				sort: fixture[0].sort,
			});
			expect(row).not.toHaveProperty('file_legacy_path');
		});
	});
});
