import { describe, expect, it } from 'bun:test';
import { runInNewContext } from 'node:vm';
import flows from '../directus/collections/flows.json';
import operations from '../directus/collections/operations.json';
import { buildDirectusSyncPushArgs, readLastOptionValue, syncPushWillTouchSettings } from '../scripts/sync-push';

const PUBLISH_FLOW = 'd86a5982-6ab4-4474-ace8-cfd16962a9a4';
const VERSION_URL = 'https://yesid.dev/_app/version.json';
type Reply = { status: number; data: unknown };
type Notice = { recipient: string[]; subject: string; message: string };

/** Offline graph adapter, following Directus v12.5.1 flows.ts executeFlow /
 * executeOperation: each run has its own keyed data; thrown requests follow
 * reject; Run Script exports receive that data. HTTP/time/notifications are
 * boundaries, not a running Directus server or isolated-vm integration test. */
async function publish({
	before = { status: 200, data: { version: '1000' } },
	after = { status: 200, data: { version: '2000' } },
	hook = { status: 201, data: { job: { state: 'PENDING' } } },
	pause = async (_ms: number) => {},
	user = 'editor-a',
}: { before?: Reply | Error; after?: Reply | Error; hook?: Reply | Error;
	pause?: (ms: number) => Promise<void>; user?: string } = {}) {
	const flow = flows.find((entry) => entry._syncId === PUBLISH_FLOW)!;
	const data: Record<string, unknown> = {
		$accountability: { user }, $env: { VERCEL_DEPLOY_HOOK_URL: 'https://hook.invalid/publish' },
	};
	const notices: Notice[] = [];
	const requests: { method: string; url: string; headers?: unknown }[] = [];
	const waits: number[] = [];
	const render = (value: unknown): unknown => {
		if (typeof value === 'string') return value.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_, path: string) => {
			let result: unknown = data;
			for (const part of path.trim().split('.')) result = (result as Record<string, unknown>)?.[part];
			return String(result ?? '');
		});
		if (Array.isArray(value)) return value.map(render);
		if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, render(item)]));
		return value;
	};
	let next: string | null = flow.operation;
	let reads = 0;
	let steps = 0;
	while (next) {
		if (++steps > 30) throw new Error('Flow cycle');
		const operation = operations.find((entry) => entry._syncId === next);
		if (!operation) throw new Error(`Missing operation ${next}`);
		const options = render(operation.options) as Record<string, unknown>;
		let result: unknown;
		let branch: 'resolve' | 'reject' = 'resolve';
		try {
			switch (operation.type) {
				case 'request': {
					const request = options as { method: string; url: string; headers?: unknown };
					requests.push(request);
					if (request.method !== 'POST' && (request.method !== 'GET' || !request.url.startsWith(VERSION_URL))) throw new Error('Unexpected request');
					const reply = request.method === 'POST' ? hook : reads++ === 0 ? before : after;
					if (reply instanceof Error) throw reply;
					// Axios rejects non-2xx. Directus request/index.ts rethrows its response.
					if (reply.status < 200 || reply.status >= 300) throw JSON.stringify(reply);
					result = reply;
					break;
				}
				case 'exec': {
					const module = { exports: null as null | ((input: Record<string, unknown>) => unknown) };
					runInNewContext(String(options.code), { module }, { timeout: 1000 });
					if (!module.exports) throw new Error('Missing Run Script export');
					result = module.exports(structuredClone(data));
					break;
				}
				case 'sleep': {
					const milliseconds = Number(options.milliseconds);
					waits.push(milliseconds);
					await pause(milliseconds);
					break;
				}
				case 'notification': notices.push(options as Notice); break;
				default: throw new Error(`Unsupported operation ${operation.type}`);
			}
		} catch (error) {
			branch = 'reject';
			result = typeof error === 'string' ? JSON.parse(error) : error;
		}
		data[operation.key] = result ?? null;
		data.$last = result ?? null;
		next = operation[branch];
	}
	return { notices, requests, waits };
}

describe('manual Publish feedback', () => {
	it('notifies the triggering editor when the public version changes after ten minutes', async () => {
		const result = await publish();
		expect(result.notices).toHaveLength(1);
		expect(result.notices[0]).toMatchObject({ recipient: ['editor-a'], subject: 'Publish site: updated' });
		expect(result.notices[0]!.message).toContain('1000');
		expect(result.notices[0]!.message).toContain('2000');
		expect(result.waits).toEqual([600_000]);
		expect(result.requests.map(({ method }) => method)).toEqual(['GET', 'POST', 'GET']);
	});

	it('reports the same public version as not updated yet, without declaring a failed deployment', async () => {
		const { notices } = await publish({ after: { status: 200, data: { version: '1000' } } });
		expect(notices[0]?.subject).toBe('Publish site: not updated');
		expect(notices[0]?.message).toContain('may still be running');
		expect(notices[0]?.message).toContain('https://vercel.com/dashboard');
	});

	it.each([
		['HTTP 503', { status: 503, data: { version: '1000' } }],
		['network failure', new Error('private transport details')],
		['HTML response', { status: 200, data: '<html>error</html>' }],
		['missing version', { status: 200, data: {} }],
		['null body', { status: 200, data: null }],
		['non-string version', { status: 200, data: { version: 1000 } }],
		['unsafe version', { status: 200, data: { version: '<script>bad</script>' } }],
	] satisfies [string, Reply | Error][])('reports an unreadable baseline (%s) explicitly and still requests the build', async (_name, before) => {
		const { notices, requests, waits } = await publish({ before });
		expect(notices).toHaveLength(1);
		expect(notices[0]?.subject).toBe('Publish site: could not verify');
		expect(notices[0]?.message).toContain('before Publish');
		expect(notices[0]?.message).not.toContain('private transport details');
		expect(notices[0]?.message).not.toContain('<script>');
		expect(requests.map(({ method }) => method)).toEqual(['GET', 'POST', 'GET']);
		expect(waits).toEqual([600_000]);
	});

	it.each([
		['HTTP 404', { status: 404, data: { version: '1000' } }],
		['network failure', new Error('private transport details')],
		['invalid response', { status: 200, data: {} }],
	] satisfies [string, Reply | Error][])('reports an unreadable final version (%s) as unknown, not not-updated', async (_name, after) => {
		const { notices } = await publish({ after });
		expect(notices).toHaveLength(1);
		expect(notices[0]?.subject).toBe('Publish site: could not verify');
		expect(notices[0]?.message).toContain('after the wait');
	});

	it.each([new Error('hook secret must not leak'), { status: 403, data: 'hook secret must not leak' }])('gives hook rejection its own notice without waiting or exposing response details', async (hook) => {
		const { notices, requests, waits } = await publish({ hook });
		expect(notices).toHaveLength(1);
		expect(notices[0]?.subject).toBe('Publish site: hook rejected');
		expect(notices[0]?.message).not.toContain('hook secret must not leak');
		expect(notices[0]?.message).toContain('outcome unknown');
		expect(requests.map(({ method }) => method)).toEqual(['GET', 'POST']);
		expect(waits).toEqual([]);
	});

	it('keeps overlapping presses and recipients independent when their checks finish out of order', async () => {
		let resumeFirst!: () => void;
		let firstWaiting!: () => void;
		const reachedWait = new Promise<void>((resolve) => { firstWaiting = resolve; });
		const first = publish({
			before: { status: 200, data: { version: '1000' } },
			after: { status: 200, data: { version: '3000' } },
			pause: () => new Promise<void>((resolve) => { resumeFirst = resolve; firstWaiting(); }),
		});
		await reachedWait;
		const second = await publish({
			before: { status: 200, data: { version: '3000' } },
			after: { status: 200, data: { version: '3000' } }, user: 'editor-b',
		});
		resumeFirst();
		const one = (await first).notices[0]!;
		const two = second.notices[0]!;
		expect(one.subject).toBe('Publish site: updated');
		expect(one.message).toContain('from 1000 to 3000');
		expect(two.subject).toBe('Publish site: not updated');
		expect(two.message).toContain('still 3000');
		expect(one.recipient).toEqual(['editor-a']);
		expect(two.recipient).toEqual(['editor-b']);
		expect(one.message.split(' at ')[0]).not.toBe(two.message.split(' at ')[0]);
		for (const notice of [one, two]) expect(notice.message).toContain('cannot be attributed to a particular press');
	});

	it('keeps this a confirmed asynchronous manual action with no recurring database polling', () => {
		const flow = flows.find((entry) => entry._syncId === PUBLISH_FLOW)!;
		expect(flow.trigger).toBe('manual');
		expect(flow.options).toMatchObject({ async: true, requireConfirmation: true, collections: ['build_queue'] });
		const ownOperations = operations.filter((entry) => entry.flow === PUBLISH_FLOW);
		expect(ownOperations.filter((entry) => entry.type === 'request')).toHaveLength(3);
		expect(ownOperations.every((entry) => ['request', 'exec', 'sleep', 'notification'].includes(entry.type))).toBe(true);
		for (const operation of ownOperations.filter((entry) => entry.type === 'request' && entry.options.method === 'GET')) {
			expect(operation.options.url).toBe(VERSION_URL);
			expect(operation.options.headers).toContainEqual({ header: 'Cache-Control', value: 'no-cache' });
		}
	});

	it('allows a guarded flow-and-operation apply without including schema, settings or permission drift', () => {
		const args = buildDirectusSyncPushArgs(['--no-snapshot', '--only-collections', 'flows,operations'], {
			DIRECTUS_URL: 'https://cms.yesid.dev', DIRECTUS_SYNC_ALLOW_PROD_SCHEMA_PUSH: '1',
			DIRECTUS_SYNC_PUSH_ACK: 'sync-push-can-delete-cms-data',
		});
		expect(args).toContain('--no-snapshot');
		expect(readLastOptionValue(args, ['--only-collections', '-o'])).toBe('flows,operations');
		expect(syncPushWillTouchSettings(args)).toBe(false);
	});
});
