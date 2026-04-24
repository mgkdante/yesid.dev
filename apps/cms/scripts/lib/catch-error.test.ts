import { describe, it, expect } from 'bun:test';
import { DirectusError, parseErrors } from './catch-error';

describe('scripts/lib/catch-error.ts', () => {
	describe('DirectusError', () => {
		it('captures status + message + payload', () => {
			const payload = {
				errors: [{ message: 'not found', extensions: { code: 'RECORD_NOT_FOUND' } }],
			};
			const err = new DirectusError(404, 'Not Found', payload);
			expect(err.name).toBe('DirectusError');
			expect(err.status).toBe(404);
			expect(err.message).toBe('Not Found');
			expect(err.payload).toBe(payload);
			expect(err instanceof Error).toBe(true);
		});

		it('works without payload', () => {
			const err = new DirectusError(500, 'Internal');
			expect(err.status).toBe(500);
			expect(err.payload).toBeUndefined();
		});
	});

	describe('parseErrors', () => {
		it('returns [] for null/undefined', () => {
			expect(parseErrors(null)).toEqual([]);
			expect(parseErrors(undefined)).toEqual([]);
		});

		it('wraps string as single-element array', () => {
			expect(parseErrors('boom')).toEqual(['boom']);
		});

		it('extracts messages + codes from DirectusError payload', () => {
			const err = new DirectusError(400, 'Bad Request', {
				errors: [
					{ message: 'field missing', extensions: { code: 'REQUIRED' } },
					{ message: 'generic problem' },
				],
			});
			expect(parseErrors(err)).toEqual([
				'[REQUIRED] field missing',
				'generic problem',
			]);
		});

		it('extracts messages from raw Directus payload object', () => {
			const raw = {
				errors: [{ message: 'upstream failure', extensions: { code: 'UPSTREAM' } }],
			};
			expect(parseErrors(raw)).toEqual(['[UPSTREAM] upstream failure']);
		});

		it('falls back to Error.message for plain errors', () => {
			expect(parseErrors(new Error('oops'))).toEqual(['oops']);
		});

		it('JSON-stringifies arbitrary objects', () => {
			expect(parseErrors({ foo: 1 })).toEqual(['{"foo":1}']);
		});
	});
});
