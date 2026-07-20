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
		const harness = mkdtempSync(join(tmpdir(), 'refresh-dev-from-prod-'));
		const bin = join(harness, 'bin');
		const log = join(harness, 'commands.log');
		const mainSha = 'a'.repeat(40);
		const developSha = 'b'.repeat(40);
		const treeSha = 'c'.repeat(40);
		const snapshotSha = 'd'.repeat(40);
		mkdirSync(bin);

		try {
			executable(
				join(bin, 'git'),
				`#!/bin/sh
log_file=${JSON.stringify(log)}
if [ -n "\${DIRECTUS_BUILD_TOKEN+x}" ]; then printf 'leaked prod token to git\\n' >> "$log_file"; fi
printf 'git %s\\n' "$*" >> "$log_file"
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
log_file=${JSON.stringify(log)}
head_ref_file=${JSON.stringify(join(harness, 'head-ref'))}
if [ -n "\${DIRECTUS_BUILD_TOKEN+x}" ]; then printf 'leaked prod token to gh\\n' >> "$log_file"; fi
printf 'gh %s\\n' "$*" >> "$log_file"
case "$*" in
  "api repos/mgkdante/yesid.dev/rules/branches/develop "*) printf 'ci\\ngitleaks\\ntest\\n' ;;
  *pr\\ create*)
    while [ "$#" -gt 0 ]; do
      if [ "$1" = "--head" ]; then shift; printf '%s\\n' "$1" > "$head_ref_file"; break; fi
      shift
    done
    printf '%s\\n' 'https://github.com/mgkdante/yesid.dev/pull/999'
    ;;
  *pr\\ checks*--json\\ name*) printf 'ci\\ngitleaks\\ntest\\n' ;;
  *pr\\ view*) printf 'true\\t%s\\t%s\\tdevelop\\t%s\\n' "$(cat "$head_ref_file")" '${snapshotSha}' '${developSha}' ;;
esac
`,
			);
			executable(
				join(bin, 'bun'),
				`#!/bin/sh
log_file=${JSON.stringify(log)}
if [ -n "\${DIRECTUS_BUILD_TOKEN+x}" ]; then printf 'leaked prod token to bun\\n' >> "$log_file"; fi
printf 'bun %s\\n' "$*" >> "$log_file"
case "$*" in
  *refresh-dev-database.ts*) exit 17 ;;
esac
`,
			);

			const result = spawnSync('bash', [join(import.meta.dir, 'refresh-dev-from-prod.sh')], {
				cwd: join(import.meta.dir, '../../..'),
				encoding: 'utf8',
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
				},
				input: 'y\n',
			});

			expect(result.status).toBe(17);
			expect(result.stdout).toContain(
				'an empty checked snapshot commit will trigger the refresh deployment',
			);
			expect(result.stderr).toContain('removing its non-mergeable GitHub preflight');
			const commands = readFileSync(log, 'utf8');
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
		} finally {
			rmSync(harness, { recursive: true, force: true });
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
