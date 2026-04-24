import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { createLogger } from './logger';

describe('scripts/lib/logger.ts', () => {
	let logSpy: ReturnType<typeof mock>;
	let warnSpy: ReturnType<typeof mock>;
	let errorSpy: ReturnType<typeof mock>;
	let originalDebug: string | undefined;

	beforeEach(() => {
		originalDebug = process.env.DEBUG;
		logSpy = mock(() => {});
		warnSpy = mock(() => {});
		errorSpy = mock(() => {});
		console.log = logSpy;
		console.warn = warnSpy;
		console.error = errorSpy;
	});

	afterEach(() => {
		if (originalDebug === undefined) delete process.env.DEBUG;
		else process.env.DEBUG = originalDebug;
	});

	it('info prefixes the scope', () => {
		const log = createLogger('seed');
		log.info('hello', 42);
		expect(logSpy).toHaveBeenCalledWith('[seed]', 'hello', 42);
	});

	it('warn prefixes scope + [warn]', () => {
		const log = createLogger('assets');
		log.warn('slow');
		expect(warnSpy).toHaveBeenCalledWith('[assets]', '[warn]', 'slow');
	});

	it('error prefixes scope + [error]', () => {
		const log = createLogger('sync');
		log.error('bang', new Error('x'));
		const args = errorSpy.mock.calls[0];
		expect(args[0]).toBe('[sync]');
		expect(args[1]).toBe('[error]');
		expect(args[2]).toBe('bang');
	});

	it('debug is silent without DEBUG env', () => {
		delete process.env.DEBUG;
		const log = createLogger('seed');
		log.debug('verbose');
		expect(logSpy).not.toHaveBeenCalled();
	});

	it('debug logs when DEBUG env is set', () => {
		process.env.DEBUG = '1';
		const log = createLogger('seed');
		log.debug('verbose');
		expect(logSpy).toHaveBeenCalledWith('[seed]', '[debug]', 'verbose');
	});
});
