import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const CMS_ROOT = join(import.meta.dir, '..');
const EXTENSION_ROOT = join(CMS_ROOT, 'extensions', 'noindex');
const ENTRYPOINT = join(EXTENSION_ROOT, 'dist', 'index.js');
const MANIFEST = join(EXTENSION_ROOT, 'package.json');
const ROBOTS_TAG = 'noindex, nofollow, noarchive';
const ROBOTS_BODY = 'User-agent: *\nDisallow: /\n';

type RequestLike = { path: string };
type ResponseLike = {
	setHeader(name: string, value: string): void;
	status(code: number): ResponseLike;
	send(body: string): ResponseLike;
};
type Middleware = (
	request: RequestLike,
	response: ResponseLike,
	next: () => void,
) => void;
type Initializer = (meta: { app: { use(handler: Middleware): void } }) => void;

async function loadRegistration(): Promise<{
	lifecycle: string;
	initializer: Initializer;
}> {
	expect(existsSync(ENTRYPOINT), 'Directus hook entrypoint is missing').toBe(true);

	const extension = (await import(pathToFileURL(ENTRYPOINT).href)) as {
		default: (register: {
			init(name: string, callback: Initializer): void;
		}) => void;
	};
	let lifecycle = '';
	let initializer: Initializer | undefined;

	extension.default({
		init(name, callback) {
			lifecycle = name;
			initializer = callback;
		},
	});

	expect(typeof initializer).toBe('function');
	return { lifecycle, initializer: initializer! };
}

async function loadMiddleware(): Promise<Middleware> {
	const { initializer } = await loadRegistration();
	let middleware: Middleware | undefined;

	initializer({
		app: {
			use(handler) {
				middleware = handler;
			},
		},
	});

	expect(typeof middleware).toBe('function');
	return middleware!;
}

function createResponse() {
	const headers = new Map<string, string>();
	let statusCode: number | undefined;
	let body: string | undefined;
	const response: ResponseLike = {
		setHeader(name, value) {
			headers.set(name.toLowerCase(), value);
		},
		status(code) {
			statusCode = code;
			return response;
		},
		send(value) {
			body = value;
			return response;
		},
	};

	return {
		response,
		headers,
		get statusCode() {
			return statusCode;
		},
		get body() {
			return body;
		},
	};
}

describe('Directus noindex hook extension', () => {
	it('registers before Directus middleware and routes', async () => {
		const { lifecycle } = await loadRegistration();
		expect(lifecycle).toBe('middlewares.before');
	});

	it('sets X-Robots-Tag and continues ordinary requests', async () => {
		const middleware = await loadMiddleware();
		const result = createResponse();
		let nextCalls = 0;

		middleware({ path: '/server/ping' }, result.response, () => {
			nextCalls += 1;
		});

		expect(result.headers.get('x-robots-tag')).toBe(ROBOTS_TAG);
		expect(nextCalls).toBe(1);
		expect(result.statusCode).toBeUndefined();
		expect(result.body).toBeUndefined();
	});

	it('short-circuits /robots.txt with a plain-text deny-all policy', async () => {
		const middleware = await loadMiddleware();
		const result = createResponse();
		let nextCalls = 0;

		middleware({ path: '/robots.txt' }, result.response, () => {
			nextCalls += 1;
		});

		expect(result.headers.get('x-robots-tag')).toBe(ROBOTS_TAG);
		expect(result.headers.get('content-type')).toBe('text/plain; charset=utf-8');
		expect(result.headers.get('cache-control')).toBe('no-store');
		expect(result.statusCode).toBe(200);
		expect(result.body).toBe(ROBOTS_BODY);
		expect(nextCalls).toBe(0);
	});

	it('declares a Directus 12 hook package wired to the built entrypoint', () => {
		expect(existsSync(MANIFEST), 'extension package.json is missing').toBe(true);
		const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as {
			name?: string;
			files?: string[];
			'directus:extension'?: Record<string, unknown>;
		};

		expect(manifest.name).toBe('directus-extension-noindex');
		expect(manifest.files).toContain('dist');
		expect(manifest['directus:extension']).toEqual({
			type: 'hook',
			path: 'dist/index.js',
			source: 'src/index.js',
			host: '^12.0.0',
		});
	});

	it('copies the extension into Directus EXTENSIONS_PATH during image build', () => {
		const dockerfile = readFileSync(join(CMS_ROOT, 'Dockerfile'), 'utf8');
		expect(dockerfile).toContain(
			'COPY --chown=node:node extensions/noindex /directus/extensions/directus-extension-noindex',
		);
	});
});
