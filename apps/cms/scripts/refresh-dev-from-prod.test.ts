import { describe, expect, it } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const script = readFileSync(join(import.meta.dir, 'refresh-dev-from-prod.sh'), 'utf8');

function executable(path: string, contents: string): void {
	writeFileSync(path, contents);
	chmodSync(path, 0o755);
}

function runRefresh(
	options: {
		args?: string[];
		env?: Record<string, string>;
		input?: string;
		terminal?: boolean;
		registeredContexts?: string;
		initialContexts?: string;
		databaseExit?: number;
	} = {},
) {
	const harness = mkdtempSync(join(tmpdir(), 'refresh-dev-from-prod-'));
	const bin = join(harness, 'bin');
	const log = join(harness, 'commands.log');
	const mainSha = 'a'.repeat(40);
	const developSha = 'b'.repeat(40);
	const treeSha = 'c'.repeat(40);
	const snapshotSha = 'd'.repeat(40);
	const contexts = options.registeredContexts ?? 'ci\ngitleaks\ntest';
	mkdirSync(bin);
	writeFileSync(log, '');

	try {
		const terminalStub = join(harness, 'terminal.sh');
		if (options.terminal) {
			// Simulate a terminal check while keeping spawnSync input deterministic on Windows.
			writeFileSync(
				terminalStub,
				'test() { if [[ "$*" == "-t 0" ]]; then return 0; fi; builtin test "$@"; }\n',
			);
		}
		const record = (command: string) => `log_file=${JSON.stringify(log)}
if [ -n "\${DIRECTUS_BUILD_TOKEN+x}" ]; then printf 'leaked prod token to ${command}\\n' >> "$log_file"; fi
printf '${command} %s\\n' "$*" >> "$log_file"
printf '${command} APPDATA=%s\\n' "$APPDATA" >> "$log_file"
`;
		executable(
			join(bin, 'git'),
			`#!/bin/sh
${record('git')}
if [ "$1" = "-C" ]; then shift 2; fi
case "$*" in
  "remote get-url origin") printf '%s\\n' 'https://github.com/mgkdante/yesid.dev.git' ;;
  "rev-parse refs/remotes/origin/main^{tree}") printf '%s\\n' '${treeSha}' ;;
  "rev-parse refs/remotes/origin/develop^{tree}") printf '%s\\n' '${treeSha}' ;;
  "rev-parse refs/remotes/origin/main") printf '%s\\n' '${mainSha}' ;;
  "rev-parse refs/remotes/origin/develop") printf '%s\\n' '${developSha}' ;;
  *commit-tree*) printf '%s\\n' '${snapshotSha}' ;;
esac
`,
		);
		executable(
			join(bin, 'gh'),
			`#!/bin/sh
${record('gh')}
head_ref_file=${JSON.stringify(join(harness, 'head-ref'))}
checks_file=${JSON.stringify(join(harness, 'checks'))}
ready_file=${JSON.stringify(join(harness, 'ready'))}
case "$*" in
  "api repos/mgkdante/yesid.dev/rules/branches/develop "*) printf 'ci\\ngitleaks\\ntest\\n' ;;
  *pr\\ create*)
    while [ "$#" -gt 0 ]; do
      if [ "$1" = "--head" ]; then shift; printf '%s\\n' "$1" > "$head_ref_file"; break; fi
      shift
    done
    printf '%s\\n' 'https://github.com/mgkdante/yesid.dev/pull/999'
    ;;
  *pr\\ checks*--json\\ name*)
    if [ ! -f "$checks_file" ]; then
      printf '%s\\n' '${options.initialContexts ?? contexts}'
      touch "$checks_file"
    else
      printf '%s\\n' '${contexts}'
    fi
    ;;
  *pr\\ ready*) touch "$ready_file" ;;
  *pr\\ view*)
    draft=true
    if [ -f "$ready_file" ]; then draft=false; fi
    printf '%s\\t%s\\t%s\\tdevelop\\t%s\\n' "$draft" "$(cat "$head_ref_file")" '${snapshotSha}' '${developSha}'
    ;;
esac
`,
		);
		executable(
			join(bin, 'bun'),
			`#!/bin/sh
${record('bun')}
case "$*" in
  *refresh-dev-database.ts*) exit ${options.databaseExit ?? 17} ;;
esac
`,
		);
		executable(
			join(bin, 'sleep'),
			`#!/bin/sh
${record('sleep')}
# Only the short timeout test waits in real time.
if [ "$1" -lt 10 ]; then /bin/sleep "$1"; fi
`,
		);

		const result = spawnSync(
			'bash',
			[join(import.meta.dir, 'refresh-dev-from-prod.sh'), ...(options.args ?? ['--yes'])],
			{
				cwd: join(import.meta.dir, '../../..'),
				encoding: 'utf8',
				timeout: 15_000,
				env: {
					HOME: harness,
					LANG: 'C.UTF-8',
					PATH: `${bin}:${process.env.PATH ?? ''}`,
					NEON_API_KEY: 'neon-secret',
					DIRECTUS_ADMIN_TOKEN: 'admin-secret',
					DIRECTUS_BUILD_TOKEN: 'prod-build-secret',
					DIRECTUS_DEV_BUILD_TOKEN: 'dev-build-secret',
					STORAGE_S3_KEY: 'r2-key',
					STORAGE_S3_SECRET: 'r2-secret',
					STORAGE_S3_ENDPOINT: 'https://r2.invalid',
					REFRESH_DEV_CONFIRM: 'wipe-dev',
					...(options.terminal ? { BASH_ENV: terminalStub.replaceAll('\\', '/') } : {}),
					...options.env,
				},
				input: options.input,
			},
		);
		const commands = readFileSync(log, 'utf8');
		return { result, commands };
	} finally {
		rmSync(harness, { recursive: true, force: true });
	}
}

describe('refresh-dev-from-prod orchestration', () => {
	it('passes PR checks, then rebinds the dev token before R2 and the develop merge', () => {
		const checks = script.lastIndexOf('\nrun_gh pr checks "$pr_url"');
		const resetAndRebind = script.lastIndexOf('\nrun_database_refresh\n');
		const r2 = script.lastIndexOf('\nrun_r2_refresh\n');
		const merge = script.lastIndexOf('\nrun_gh pr merge "$pr_url"');

		expect(checks).toBeGreaterThan(-1);
		expect(resetAndRebind).toBeGreaterThan(-1);
		expect(checks).toBeLessThan(resetAndRebind);
		expect(resetAndRebind).toBeLessThan(r2);
		expect(resetAndRebind).toBeLessThan(merge);
	});

	it('documents the distinct dev build token as required input', () => {
		expect(script).toContain('DIRECTUS_DEV_BUILD_TOKEN');
		expect(script).not.toContain('token is the SAME value on dev and');
		expect(script).toContain('[[ "$DIRECTUS_DEV_BUILD_TOKEN" == "$DIRECTUS_BUILD_TOKEN" ]]');
	});

	it('preflights every downstream credential before the destructive reset', () => {
		const preflight = script.indexOf('required_vars=(');
		const resetAndRebind = script.lastIndexOf('\nrun_database_refresh\n');
		expect(preflight).toBeGreaterThan(-1);
		expect(preflight).toBeLessThan(resetAndRebind);
		for (const name of [
			'NEON_API_KEY',
			'DIRECTUS_ADMIN_TOKEN',
			'DIRECTUS_BUILD_TOKEN',
			'DIRECTUS_DEV_BUILD_TOKEN',
			'STORAGE_S3_KEY',
			'STORAGE_S3_SECRET',
			'STORAGE_S3_ENDPOINT',
		]) {
			expect(script.slice(preflight, resetAndRebind)).toContain(name);
		}
	});

	it('updates protected develop through a checked synthetic snapshot PR', () => {
		expect(script).not.toContain('--force-with-lease');
		for (const command of [
			'commit-tree "$main_tree" -p "$develop_sha"',
			'run_gh pr create',
			'run_gh pr checks',
			'run_gh pr merge',
		]) {
			expect(script).toContain(command);
		}
		expect(script.indexOf('run_gh pr checks')).toBeLessThan(script.indexOf('run_gh pr merge'));
	});

	it('allows repeat refreshes when develop already has the main tree', () => {
		expect(script).not.toContain('ERROR: origin/develop already has the origin/main tree');
		expect(script).not.toContain('No reviewable reset PR can be created');
		expect(script).toContain('an empty checked snapshot commit will trigger the refresh deployment');
	});

	it('pins the PR head and confirms develop did not move before state mutation', () => {
		expect(script).toContain('--match-head-commit "$snapshot_sha"');
		expect(script).toContain('current_develop_sha');
		expect(script.indexOf('current_develop_sha')).toBeLessThan(
			script.lastIndexOf('\nrun_database_refresh\n'),
		);
	});

	it('keeps the preflight PR non-mergeable and cleans it up on failure', () => {
		expect(script).toContain('--draft');
		expect(script).toContain('trap cleanup_failed_refresh EXIT');
		expect(script).toContain('run_gh pr close "$pr_url"');
		expect(script).toContain('run_git push --delete origin "$refresh_branch"');

		const r2 = script.lastIndexOf('\nrun_r2_refresh\n');
		const ready = script.lastIndexOf('\nrun_gh pr ready "$pr_url"');
		const merge = script.lastIndexOf('\nrun_gh pr merge "$pr_url"');
		expect(r2).toBeLessThan(ready);
		expect(ready).toBeLessThan(merge);
	});

	it('waits for the complete branch-ruleset check set before state mutation', () => {
		expect(script).toContain('rules/branches/develop');
		expect(script).toContain('observed_required_contexts');
		expect(script).toContain('[[ "$observed_required_contexts" == "$required_contexts" ]]');
		expect(script).not.toContain('required_check_count');
	});

	it('revalidates the draft branch names and commit locks before every external stage', () => {
		expect(script).toContain('--json isDraft,headRefName,headRefOid,baseRefName,baseRefOid');
		expect(script).toContain('"$refresh_branch"');
		expect(script).toContain('\\tdevelop\\t');
		expect(script).toContain('assert_preflight_lock');
		expect(script.match(/^assert_preflight_lock(?: false)?$/gmu)).toHaveLength(4);
		expect(script).toContain('assert_preflight_lock false\nrun_gh pr merge');
	});

	it('closes the draft and deletes its branch when database refresh fails', () => {
		const { result, commands } = runRefresh();
		expect(result.status).toBe(17);
		expect(result.stdout).toContain(
			'an empty checked snapshot commit will trigger the refresh deployment',
		);
		expect(result.stderr).toContain('removing its non-mergeable GitHub preflight');
		expect(commands).toContain('gh pr create');
		expect(commands).toContain('--draft');
		expect(commands).toContain('bun ');
		expect(commands).toContain('refresh-dev-database.ts');
		expect(commands).toContain('gh pr close');
		expect(commands).toContain('git -C ');
		expect(commands).toContain('push --delete origin ops/refresh-dev-from-prod-');
		expect(commands).not.toContain('refresh-r2-from-prod.ts');
		expect(commands).not.toContain('gh pr ready');
		expect(commands).not.toContain('gh pr merge');
		expect(commands).not.toContain('leaked prod token');
	});

	it('requires both exact confirmations for a non-interactive refresh', () => {
		const { result, commands } = runRefresh({ input: '' });
		expect(result.status).toBe(17);
		expect(commands).toContain('refresh-dev-database.ts');
		expect(result.stderr).not.toContain('stdin is not a TTY');
	});

	it('rejects non-TTY input without explicit confirmation, even with a piped yes', () => {
		const { result, commands } = runRefresh({
			args: [],
			env: { REFRESH_DEV_CONFIRM: '' },
			input: 'y\n',
		});
		expect(result.status).toBe(1);
		expect(result.stderr).toContain('stdin is not a TTY');
		expect(result.stderr).toContain('--yes with REFRESH_DEV_CONFIRM=wipe-dev');
		expect(commands).toBe('');
	});

	it('rejects partial or inexact non-interactive confirmations', () => {
		for (const options of [
			{ args: [] },
			{ env: { REFRESH_DEV_CONFIRM: '' } },
			{ env: { REFRESH_DEV_CONFIRM: 'yes' } },
			{ env: { REFRESH_DEV_CONFIRM: 'wipe-dev ' } },
		]) {
			const { result, commands } = runRefresh(options);
			expect(result.status).toBe(1);
			expect(result.stderr).toContain('stdin is not a TTY');
			expect(commands).toBe('');
		}
	});

	it('keeps interactive confirmation when either explicit confirmation is absent', () => {
		for (const options of [
			{ args: [], env: { REFRESH_DEV_CONFIRM: '' } },
			{ args: ['--yes'], env: { REFRESH_DEV_CONFIRM: '' } },
			{ args: [], env: { REFRESH_DEV_CONFIRM: 'wipe-dev' } },
		]) {
			const accepted = runRefresh({ ...options, terminal: true, input: 'y\n' });
			expect(accepted.result.status).toBe(17);
			expect(accepted.commands).toContain('refresh-dev-database.ts');
			const declined = runRefresh({ ...options, terminal: true, input: 'n\n' });
			expect(declined.result.status).toBe(1);
			expect(declined.result.stdout).toContain('Aborted.');
			expect(declined.commands).not.toContain('gh pr create');
			expect(declined.commands).not.toContain('refresh-dev-database.ts');
		}
		expect(script).toContain("Wipe ALL dev state and replace it with prod's? (y/N): ");
	}, 20_000);

	it('rejects unknown or repeated arguments with usage', () => {
		for (const args of [['--help'], ['yes'], ['--yes', '--yes'], ['--yes', 'extra']]) {
			const { result, commands } = runRefresh({ args });
			expect(result.status).toBe(1);
			expect(result.stderr).toContain('Usage:');
			expect(commands).toBe('');
		}
	});

	it('validates the registration timeout before contacting providers', () => {
		for (const value of ['', '0', '-1', '1.5', 'ten', '1+2']) {
			const { result, commands } = runRefresh({
				env: { REFRESH_CHECK_REGISTRATION_TIMEOUT_SECONDS: value },
			});
			expect(result.status).toBe(1);
			expect(result.stderr).toContain('must be a positive integer');
			expect(commands).toBe('');
		}
	});

	it('polls every ten seconds until the exact check set registers and preserves platform values', () => {
		const { result, commands } = runRefresh({
			initialContexts: 'ci',
			databaseExit: 0,
			env: { APPDATA: 'platform path with spaces' },
		});
		expect(result.status).toBe(0);
		expect(commands).toContain('sleep 10\n');
		expect(commands).toContain('refresh-r2-from-prod.ts');
		expect(commands).toContain('gh pr merge');
		for (const command of ['git', 'gh', 'bun', 'sleep']) {
			expect(commands).toContain(`${command} APPDATA=platform path with spaces\n`);
		}
		expect(commands).not.toContain('leaked prod token');
	});

	it('reports only missing contexts on deadline and cleans up without resetting dev', () => {
		const { result, commands } = runRefresh({
			registeredContexts: 'ci\ntest',
			env: { REFRESH_CHECK_REGISTRATION_TIMEOUT_SECONDS: '1' },
		});
		expect(result.status).toBe(1);
		expect(result.stderr).toContain('Missing required contexts:\n  gitleaks\n');
		expect(result.stderr).not.toContain('\n  ci\n');
		expect(result.stderr).not.toContain('\n  test\n');
		// The check query itself can consume the one-second deadline.
		expect(commands).not.toContain('sleep 10\n');
		expect(commands).toContain('gh pr close');
		expect(commands).toContain('push --delete origin ops/refresh-dev-from-prod-');
		expect(commands).not.toContain('refresh-dev-database.ts');
		expect(commands).not.toContain('gh pr merge');
	});

	it('limits shared platform assignments to the allowed names in every wrapper', () => {
		const helper = script.slice(
			script.indexOf('collect_platform_environment()'),
			script.indexOf('run_database_refresh()'),
		);
		const names = helper.match(/for name in (.+); do/u)![1]!.split(' ');
		expect(names).toEqual([
			'SYSTEMROOT',
			'WINDIR',
			'APPDATA',
			'LOCALAPPDATA',
			'USERPROFILE',
			'TEMP',
			'TMP',
			'COMSPEC',
			'PATHEXT',
		]);
		expect(names.join(' ')).not.toMatch(/TOKEN|SECRET|PASSWORD|KEY|CREDENTIAL/u);
		expect(helper).toContain('[[ -n "${!name:-}" ]]');
		for (const wrapper of [
			'run_database_refresh',
			'run_r2_refresh',
			'run_git',
			'run_gh',
			'run_public',
		]) {
			const body = script.slice(script.indexOf(`${wrapper}()`)).split('\n}')[0]!;
			expect(body).toContain('env -i');
			expect(body).toContain('"${platform_environment[@]}"');
		}
	});

	it('forwards R2 configuration using names that the child reads, including fallbacks', () => {
		const r2Phase = script.slice(script.indexOf('run_r2_refresh()'), script.indexOf('run_git()'));
		const child = readFileSync(join(import.meta.dir, 'refresh-r2-from-prod.ts'), 'utf8');
		const forwarded = [...r2Phase.matchAll(/^\s+([A-Z][A-Z0-9_]*)=/gm)]
			.map((match) => match[1]!)
			.filter((name) => !['PATH', 'LANG'].includes(name));
		expect(forwarded).toHaveLength(5);
		for (const name of forwarded) {
			expect(child, `${name} must be read by the R2 child`).toMatch(
				new RegExp(`process\\.env\\.${name}\\b`),
			);
		}
	});

	it('gives each subprocess only the credentials required for its phase', () => {
		const databasePhase = script.slice(
			script.indexOf('run_database_refresh()'),
			script.indexOf('run_r2_refresh()'),
		);
		const r2Phase = script.slice(
			script.indexOf('run_r2_refresh()'),
			script.indexOf('run_git()'),
		);
		const gitPhase = script.slice(script.indexOf('run_git()'), script.indexOf('required_vars=('));

		expect(databasePhase).toContain('env -i');
		expect(databasePhase).toContain('NEON_API_KEY="$NEON_API_KEY"');
		expect(databasePhase).toContain('DIRECTUS_ADMIN_TOKEN="$DIRECTUS_ADMIN_TOKEN"');
		expect(databasePhase).toContain('DIRECTUS_DEV_BUILD_TOKEN="$DIRECTUS_DEV_BUILD_TOKEN"');
		expect(databasePhase).not.toContain('DIRECTUS_BUILD_TOKEN="$DIRECTUS_BUILD_TOKEN"');
		expect(databasePhase).not.toMatch(/STORAGE_S3_(?:KEY|SECRET|ENDPOINT)=/u);

		expect(r2Phase).toContain('env -i');
		expect(r2Phase).toContain('STORAGE_S3_KEY="$STORAGE_S3_KEY"');
		expect(r2Phase).toContain('STORAGE_S3_SECRET="$STORAGE_S3_SECRET"');
		expect(r2Phase).not.toMatch(/(?:NEON_API_KEY|DIRECTUS_(?:ADMIN|DEV_BUILD)_TOKEN)=/u);

		expect(gitPhase).toContain('env -i');
		expect(gitPhase).not.toMatch(
			/(?:NEON_API_KEY|DIRECTUS_(?:ADMIN|DEV_BUILD)_TOKEN|STORAGE_S3_(?:KEY|SECRET|ENDPOINT)|OP_TOKEN)=/u,
		);
	});
});
