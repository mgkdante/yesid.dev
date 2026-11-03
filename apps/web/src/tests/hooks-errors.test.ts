import { afterEach, describe, expect, it, vi } from 'vitest';
import { error as httpError, isHttpError } from '@sveltejs/kit';

import { errorPagesById } from '#lib/content/error-pages.ts';
import { ErrorPageContentSchema } from '@repo/shared';
import { handleError } from '../hooks.server';

const event = {
	url: new URL('https://yesid.dev/missing'),
} as Parameters<typeof handleError>[0]['event'];

afterEach(() => vi.restoreAllMocks());

describe('Kit 3 server error handling', () => {
	it('returns CMS 500 content synchronously so the SSR dispatcher retains it', () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const result = handleError({ kind: 'unknown', error: new Error('rendering failed'), event });
		expect(result).not.toBeInstanceOf(Promise);
		expect(result).toEqual({
			message: 'rendering failed',
			cmsErrorPage: ErrorPageContentSchema.parse(errorPagesById[500]),
		});
	});

	it.each([400, 405])('logs framework %s errors', (status) => {
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		const error = { status, message: 'Request failed' };
		handleError({ kind: 'framework', error, event });
		expect(log).toHaveBeenCalledExactlyOnceWith(`[handleError] ${status} /missing`, error);
	});

	it('logs validation errors', () => {
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		const error = { status: 400, message: 'Bad Request' };
		handleError({ kind: 'validation', error, issues: [], event });
		expect(log).toHaveBeenCalledExactlyOnceWith('[handleError] 400 /missing', error);
	});

	it('leaves expected error() bodies intact without logging or fetching content', async () => {
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});

		try {
			httpError(404, 'Project not found');
		} catch (error) {
			if (!isHttpError(error)) throw error;
			expect(await handleError({ kind: 'app', error: error.body, event })).toBeUndefined();
			expect(error.body).toEqual({ status: 404, message: 'Project not found' });
		}
		expect(log).not.toHaveBeenCalled();

	});

	it('keeps framework 404 status and error-page content without noisy logging', async () => {
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		const cmsErrorPage = ErrorPageContentSchema.parse(errorPagesById[404]);

		expect(await handleError({
			kind: 'framework', error: { status: 404, message: 'Not Found' }, event,
		})).toEqual({ message: 'Not Found', cmsErrorPage });

		expect(log).not.toHaveBeenCalled();
	});

	it.each([new Error('boom'), 'boom', null])('preserves real failure logging and returned shape for %s', async (error) => {
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		const cmsErrorPage = ErrorPageContentSchema.parse(errorPagesById[500]);

		expect(await handleError({ kind: 'unknown', error, event })).toEqual({
			message: error === null ? 'An unexpected error occurred' : 'boom', cmsErrorPage,
		});

		expect(log).toHaveBeenCalledExactlyOnceWith('[handleError] 500 /missing', error);
	});

});
