/**
 * Scoped console logger with timestamp + scope prefix.
 *
 * Added in 18c Task 29 (F7). Consistent format across all scripts so CI logs
 * + local dev logs read the same way. Scope = short identifier like 'seed',
 * 'assets', 'sync' — prefixes every line.
 *
 * No external logger dep (pino/winston) — scripts are short-lived CLI tasks;
 * console is sufficient + keeps apps/cms runtime-deps minimal.
 */

export interface Logger {
	info(msg: string, ...args: unknown[]): void;
	warn(msg: string, ...args: unknown[]): void;
	error(msg: string, ...args: unknown[]): void;
	debug(msg: string, ...args: unknown[]): void;
}

export function createLogger(scope: string): Logger {
	const prefix = `[${scope}]`;
	return {
		info: (msg, ...args) => console.log(prefix, msg, ...args),
		warn: (msg, ...args) => console.warn(prefix, '[warn]', msg, ...args),
		error: (msg, ...args) => console.error(prefix, '[error]', msg, ...args),
		debug: (msg, ...args) => {
			if (process.env.DEBUG) console.log(prefix, '[debug]', msg, ...args);
		},
	};
}
