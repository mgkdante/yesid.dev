import { describe, expect, it } from 'bun:test';

interface PolicyRow {
	id: string;
	name: string;
	admin_access: boolean;
	app_access: boolean;
	icon: unknown;
	description: unknown;
	ip_access: unknown;
	enforce_tfa: unknown;
}

interface AccessRow {
	id: string;
	policy: string;
	role: string | null;
	user: string | null;
	sort: number | null;
}

interface PermissionRow {
	id: string | number;
}

interface PolicyState {
	policy: PolicyRow;
	access: AccessRow[];
	permissions: PermissionRow[];
	matchingPolicies: Array<{ id: string; name: string }>;
}

interface RenamePlan {
	action: 'rename' | 'noop';
	policyId: string;
	currentName: string;
	targetName: string;
	patch: { name: string } | null;
	permissionCount: number;
	adminAccess: false;
	appAccess: false;
	accessRowCount: number;
	roleOnlyAccessCount: number;
	userOnlyAccessCount: number;
	accessRows: Array<{
		id: string;
		policy: string;
		role: string | null;
		user: string | null;
		sort: number | null;
	}>;
	sourceNamePolicyIds: string[];
	quarantineNamePolicyIds: string[];
	preservedFields: {
		icon: unknown;
		description: unknown;
		ip_access: unknown;
		enforce_tfa: unknown;
	};
}

interface PolicyCms {
	read(): Promise<PolicyState>;
	patch(id: string, body: { name: string }): Promise<void>;
}

interface ReconcilerModule {
	PROD_CMS_URL: string;
	PROD_CONFIRM_PHRASE: string;
	TARGET_POLICY_ID: string;
	AUTHORITATIVE_POLICY_ID: string;
	CURRENT_POLICY_NAME: string;
	TARGET_POLICY_NAME: string;
	parseQuarantineRenameArgs(
		argv: readonly string[],
		publicDirectusUrl?: string,
	): { apply: boolean; directusUrl: string };
	requireStaticAdminToken(
		env?: Readonly<Record<string, string | undefined>>,
	): string;
	buildPolicyQuarantineRenamePlan(state: PolicyState): RenamePlan;
	formatPolicyQuarantineRenamePlan(plan: RenamePlan, writesSent?: 0 | 1): string;
	applyAndVerifyPolicyQuarantineRename(
		cms: PolicyCms,
		displayedPlan: RenamePlan,
	): Promise<RenamePlan>;
	createPolicyQuarantineRenameCms(
		api: (
			method: 'GET' | 'PATCH',
			path: string,
			body?: unknown,
		) => Promise<{ status: number; json: unknown }>,
	): PolicyCms;
}

const loadedModule = await import(
	'../scripts/reconcile-permission-policy-quarantine-name.ts'
).catch(() => null);

function subject(): ReconcilerModule | null {
	expect(loadedModule).not.toBeNull();
	return loadedModule as ReconcilerModule | null;
}

function policy(
	overrides: Partial<PolicyRow> = {},
): PolicyRow {
	return {
		id: 'cbe60d41-b585-4f02-b18a-486dbd1e59f1',
		name: 'Ops Bot content ops',
		admin_access: false,
		app_access: false,
		icon: 'badge-private-marker',
	description: 'description-private-marker',
	ip_access: ['203.0.113.0/24'],
	enforce_tfa: true,
		...overrides,
	};
}

function accessRow(overrides: Partial<AccessRow> = {}): AccessRow {
	return {
		id: 'access-role-a',
		policy: 'cbe60d41-b585-4f02-b18a-486dbd1e59f1',
		role: 'role-endpoint-a',
		user: null,
		sort: 1,
		...overrides,
	};
}

function state(overrides: Partial<PolicyState> = {}): PolicyState {
	return {
		policy: policy(),
		access: [accessRow()],
		permissions: [],
		matchingPolicies: [
			{
				id: 'cbe60d41-b585-4f02-b18a-486dbd1e59f1',
				name: 'Ops Bot content ops',
			},
			{
				id: 'cff6353e-922f-4da2-931d-e866868a9276',
				name: 'Ops Bot content ops',
			},
		],
		...overrides,
	};
}

function convergedState(
	overrides: Partial<PolicyState> = {},
): PolicyState {
	return state({
		policy: policy({
			name: 'QUARANTINED — duplicate Ops Bot content ops — zero permissions',
		}),
		matchingPolicies: [
			{
				id: 'cff6353e-922f-4da2-931d-e866868a9276',
				name: 'Ops Bot content ops',
			},
			{
				id: 'cbe60d41-b585-4f02-b18a-486dbd1e59f1',
				name:
					'QUARANTINED — duplicate Ops Bot content ops — zero permissions',
			},
		],
		...overrides,
	});
}

describe('policy quarantine rename CLI guard', () => {
	it('pins the exact policy identity, names, and confirmation phrase', () => {
		const module = subject();
		if (!module) return;
		expect(module.TARGET_POLICY_ID).toBe(
			'cbe60d41-b585-4f02-b18a-486dbd1e59f1',
		);
		expect(module.AUTHORITATIVE_POLICY_ID).toBe(
			'cff6353e-922f-4da2-931d-e866868a9276',
		);
		expect(module.CURRENT_POLICY_NAME).toBe('Ops Bot content ops');
		expect(module.TARGET_POLICY_NAME).toBe(
			'QUARANTINED — duplicate Ops Bot content ops — zero permissions',
		);
		expect(module.PROD_CONFIRM_PHRASE).toBe(
			'APPLY_PROD_PERMISSION_POLICY_QUARANTINE_RENAME',
		);
	});

	it('is production-only and dry-run by default', () => {
		const module = subject();
		if (!module) return;
		expect(
			module.parseQuarantineRenameArgs(
				['--target=prod'],
				`${module.PROD_CMS_URL}/`,
			),
		).toEqual({ apply: false, directusUrl: module.PROD_CMS_URL });
		expect(() =>
			module.parseQuarantineRenameArgs([], module.PROD_CMS_URL),
		).toThrow(/exactly one --target=prod/);
		expect(() =>
			module.parseQuarantineRenameArgs(
				['--target=dev'],
				module.PROD_CMS_URL,
			),
		).toThrow(/only --target=prod/);
		expect(() =>
			module.parseQuarantineRenameArgs(
				['--target=prod'],
				'https:\/\/cms.dev.yesid.dev',
			),
		).toThrow(/Unsupported PUBLIC_DIRECTUS_URL/);
		expect(() =>
			module.parseQuarantineRenameArgs(
				['--target=prod', '--apply', '--dry-run'],
				module.PROD_CMS_URL,
			),
		).toThrow(/choose one/);
		expect(() =>
			module.parseQuarantineRenameArgs(
				['--target=prod', '--apply', '--apply'],
				module.PROD_CMS_URL,
			),
		).toThrow(/at most one --apply/);
		expect(() =>
			module.parseQuarantineRenameArgs(
				['--target=prod', '--dry-run', '--dry-run'],
				module.PROD_CMS_URL,
			),
		).toThrow(/at most one --dry-run/);
		expect(() =>
			module.parseQuarantineRenameArgs(
				['--target=prod', '--target=prod'],
				module.PROD_CMS_URL,
			),
		).toThrow(/exactly one --target=prod/);
		expect(() =>
			module.parseQuarantineRenameArgs(
				['--target=prod', '--unknown'],
				module.PROD_CMS_URL,
			),
		).toThrow(/unknown argument/);
	});

	it('requires the exact confirmation only for apply', () => {
		const module = subject();
		if (!module) return;
		expect(() =>
			module.parseQuarantineRenameArgs(
				['--target=prod', '--apply'],
				module.PROD_CMS_URL,
			),
		).toThrow(module.PROD_CONFIRM_PHRASE);
		expect(() =>
			module.parseQuarantineRenameArgs(
				['--target=prod', '--apply', '--confirm=wrong'],
				module.PROD_CMS_URL,
			),
		).toThrow(module.PROD_CONFIRM_PHRASE);
		expect(
			module.parseQuarantineRenameArgs(
				[
					'--target=prod',
					'--apply',
					`--confirm=${module.PROD_CONFIRM_PHRASE}`,
				],
				module.PROD_CMS_URL,
			),
		).toEqual({ apply: true, directusUrl: module.PROD_CMS_URL });
		expect(() =>
			module.parseQuarantineRenameArgs(
				[
					'--target=prod',
					`--confirm=${module.PROD_CONFIRM_PHRASE}`,
				],
				module.PROD_CMS_URL,
			),
		).toThrow(/only for PROD apply/);
		expect(() =>
			module.parseQuarantineRenameArgs(
				[
					'--target=prod',
					'--apply',
					`--confirm=${module.PROD_CONFIRM_PHRASE}`,
					`--confirm=${module.PROD_CONFIRM_PHRASE}`,
				],
				module.PROD_CMS_URL,
			),
		).toThrow(/at most one --confirm/);
	});

	it('requires a static admin token with no credential fallback', () => {
		const module = subject();
		if (!module) return;
		expect(
			module.requireStaticAdminToken({ DIRECTUS_ADMIN_TOKEN: 'static-token' }),
		).toBe('static-token');
		expect(() =>
			module.requireStaticAdminToken({
				DIRECTUS_ADMIN_EMAIL: 'admin@example.com',
				DIRECTUS_ADMIN_PASSWORD: 'not-used',
			}),
		).toThrow(/DIRECTUS_ADMIN_TOKEN is required.*fallback is disabled/);
	});
});

describe('policy quarantine rename plan', () => {
	it('plans one name-only patch from exact raw access topology and ignores overlapping policy aliases', () => {
		const module = subject();
		if (!module) return;
		const overlappingAliasPolicy = {
			...policy(),
			roles: [accessRow()],
			users: [accessRow()],
		} as PolicyRow;
		const plan = module.buildPolicyQuarantineRenamePlan(
			state({ policy: overlappingAliasPolicy }),
		);
		expect(plan).toEqual({
			action: 'rename',
			policyId: module.TARGET_POLICY_ID,
			currentName: module.CURRENT_POLICY_NAME,
			targetName: module.TARGET_POLICY_NAME,
			patch: { name: module.TARGET_POLICY_NAME },
			permissionCount: 0,
			adminAccess: false,
			appAccess: false,
			accessRowCount: 1,
			roleOnlyAccessCount: 1,
			userOnlyAccessCount: 0,
			accessRows: [
				{
					id: 'access-role-a',
					policy: module.TARGET_POLICY_ID,
					role: 'role-endpoint-a',
					user: null,
					sort: 1,
				},
			],
			sourceNamePolicyIds: [
				module.TARGET_POLICY_ID,
				module.AUTHORITATIVE_POLICY_ID,
			].sort(),
			quarantineNamePolicyIds: [],
			preservedFields: {
				icon: 'badge-private-marker',
				description: 'description-private-marker',
				ip_access: ['203.0.113.0/24'],
				enforce_tfa: true,
			},
		});
		expect(Object.keys(plan.patch ?? {})).toEqual(['name']);
		expect(module.formatPolicyQuarantineRenamePlan(plan)).toContain(
			'admin_access=false app_access=false permissions=0 access_rows=1 role_only_access=1 user_only_access=0',
		);
		expect(module.formatPolicyQuarantineRenamePlan(plan)).not.toContain(
			'access-role-a',
		);
		expect(module.formatPolicyQuarantineRenamePlan(plan)).not.toContain(
			'badge-private-marker',
		);
		expect(module.formatPolicyQuarantineRenamePlan(plan)).not.toContain(
			'description-private-marker',
		);
		expect(module.formatPolicyQuarantineRenamePlan(plan)).not.toContain(
			'role-endpoint-a',
		);
		expect(module.formatPolicyQuarantineRenamePlan(plan)).toContain(
			'writes_sent=0',
		);
		expect(
			module.formatPolicyQuarantineRenamePlan(
				module.buildPolicyQuarantineRenamePlan(convergedState()),
				1,
			),
		).toContain('writes_sent=1');
	});

	it('is idempotent only when the exact target name is already present', () => {
		const module = subject();
		if (!module) return;
		const plan = module.buildPolicyQuarantineRenamePlan(convergedState());
		expect(plan.action).toBe('noop');
		expect(plan.patch).toBeNull();
	});

	it('fails closed on the wrong identity, unexpected name, any permission, access flag, or missing stable field', () => {
		const module = subject();
		if (!module) return;
		const incompleteStableFields = policy();
		delete (incompleteStableFields as Partial<PolicyRow>).description;
		expect(() =>
			module.buildPolicyQuarantineRenamePlan(
				state({ policy: policy({ id: 'wrong-policy' }) }),
			),
		).toThrow(/exact target policy id/);
		expect(() =>
			module.buildPolicyQuarantineRenamePlan(
				state({ policy: policy({ name: 'Ops Bot content ops copy' }) }),
			),
		).toThrow(/unexpected current name/);
		expect(() =>
			module.buildPolicyQuarantineRenamePlan(
				state({ permissions: [{ id: 42 }] }),
			),
		).toThrow(/expected zero permissions.*found 1/);
		expect(() =>
			module.buildPolicyQuarantineRenamePlan(
				state({ policy: policy({ admin_access: true }) }),
			),
		).toThrow(/admin_access must be exactly false/);
		expect(() =>
			module.buildPolicyQuarantineRenamePlan(
				state({ policy: policy({ app_access: true }) }),
			),
		).toThrow(/app_access must be exactly false/);
		expect(() =>
			module.buildPolicyQuarantineRenamePlan(
				state({ policy: incompleteStableFields }),
			),
		).toThrow(/stable policy field description.*missing/);
	});

	it('rejects malformed raw access rows before topology inference', () => {
		const module = subject();
		if (!module) return;
		const missingRequiredRows = (
			['id', 'policy', 'role', 'user', 'sort'] as const
		).map((key) => {
			const row = accessRow();
			delete (row as Partial<AccessRow>)[key];
			return row;
		});
		for (const invalidAccess of [
			[null],
			['not-an-object'],
			[[]],
			...missingRequiredRows.map((row) => [row]),
			[accessRow({ id: '' })],
			[accessRow({ id: 42 as never })],
			[accessRow({ policy: 'foreign-policy' })],
			[accessRow({ policy: { id: 'expanded-policy' } as never })],
			[accessRow({ role: '' })],
			[accessRow({ role: { id: 'expanded-role' } as never })],
			[accessRow({ role: null, user: '' })],
			[accessRow({ user: { id: 'expanded-user' } as never })],
			[accessRow({ user: 'user-endpoint-a' })],
			[accessRow({ role: null, user: null })],
			[accessRow({ sort: undefined as never })],
			[accessRow({ sort: '1' as never })],
		]) {
			expect(() =>
				module.buildPolicyQuarantineRenamePlan(
					state({ access: invalidAccess as AccessRow[] }),
				),
			).toThrow(/raw access row/);
		}
		expect(() =>
			module.buildPolicyQuarantineRenamePlan(
				state({ access: null as never }),
			),
		).toThrow(/raw access rows must be an array/);
	});

	it('requires one unique role-only raw access row and zero user-only rows', () => {
		const module = subject();
		if (!module) return;
		expect(() =>
			module.buildPolicyQuarantineRenamePlan(
				state({ access: [] }),
			),
		).toThrow(/exactly one role-only.*zero user-only.*roles=0.*users=0/);
		expect(() =>
			module.buildPolicyQuarantineRenamePlan(
				state({
					access: [
						accessRow(),
						accessRow({
							id: 'access-user-a',
							user: 'user-endpoint-a',
							role: null,
						}),
					],
				}),
			),
		).toThrow(/exactly one role-only.*zero user-only.*roles=1.*users=1/);
		expect(() =>
			module.buildPolicyQuarantineRenamePlan(
				state({
					access: [accessRow(), accessRow({ role: 'role-endpoint-b' })],
				}),
			),
		).toThrow(/duplicate raw access row id/);
		expect(() =>
			module.buildPolicyQuarantineRenamePlan(
				state({
					access: [
						accessRow(),
						accessRow({ id: 'access-role-b', role: 'role-endpoint-b' }),
					],
				}),
			),
		).toThrow(/exactly one role-only.*zero user-only.*roles=2.*users=0/);
	});

	it('does not disclose raw access ids or relation values in output or errors', () => {
		const module = subject();
		if (!module) return;
		const planText = module.formatPolicyQuarantineRenamePlan(
			module.buildPolicyQuarantineRenamePlan(state()),
		);
		expect(planText).not.toContain('access-role-a');
		expect(planText).not.toContain('role-endpoint-a');

		const rawMarkers = [
			'FOREIGN_POLICY_PRIVATE_MARKER',
			'ROLE_PRIVATE_MARKER',
			'USER_PRIVATE_MARKER',
		];
		const errorText = thrownText(() =>
			module.buildPolicyQuarantineRenamePlan(
				state({
					access: [
						accessRow({
							policy: rawMarkers[0],
							role: rawMarkers[1],
							user: rawMarkers[2],
						}),
					],
				}),
			),
		);
		for (const marker of rawMarkers) expect(errorText).not.toContain(marker);
	});

	it('requires the exact pre-rename and already-converged name topology with no collision', () => {
		const module = subject();
		if (!module) return;
		expect(() =>
			module.buildPolicyQuarantineRenamePlan(
				state({
					matchingPolicies: [
						{
							id: module.TARGET_POLICY_ID,
							name: module.CURRENT_POLICY_NAME,
						},
					],
				}),
			),
		).toThrow(/expected duplicate source-name topology/);
		expect(() =>
			module.buildPolicyQuarantineRenamePlan(
				state({
					matchingPolicies: [
						...state().matchingPolicies,
						{ id: 'collision', name: module.TARGET_POLICY_NAME },
					],
				}),
			),
		).toThrow(/quarantine target name must be unused/);
		expect(() =>
			module.buildPolicyQuarantineRenamePlan(
				convergedState({
					matchingPolicies: [
						...convergedState().matchingPolicies,
						{ id: 'second-quarantine', name: module.TARGET_POLICY_NAME },
					],
				}),
			),
		).toThrow(/expected exact converged name topology/);
	});
});

function fakeCms(reads: PolicyState[]): {
	cms: PolicyCms;
	patches: Array<{ id: string; body: unknown }>;
	readCount: () => number;
} {
	const patches: Array<{ id: string; body: unknown }> = [];
	let readCount = 0;
	return {
		cms: {
			read: async () => {
				readCount += 1;
				return reads.shift() ?? state({ permissions: [{ id: 'missing-read' }] });
			},
			patch: async (id, body) => {
				patches.push({ id, body: structuredClone(body) });
			},
		},
		patches,
		readCount: () => readCount,
	};
}

async function rejectionText(promise: Promise<unknown>): Promise<string> {
	try {
		await promise;
		return 'resolved without rejection';
	} catch (error) {
		return error instanceof Error ? error.message : String(error);
	}
}

function thrownText(action: () => unknown): string {
	try {
		action();
		return 'returned without throwing';
	} catch (error) {
		return error instanceof Error ? error.message : String(error);
	}
}

describe('policy quarantine rename apply verification', () => {
	it('re-GETs before mutation, PATCHes name only, and re-GET proves unchanged raw access', async () => {
		const module = subject();
		if (!module) return;
		const before = state();
		const displayed = module.buildPolicyQuarantineRenamePlan(before);
		const after = convergedState();
		const { cms, patches, readCount } = fakeCms([before, after]);

		const verified = await module.applyAndVerifyPolicyQuarantineRename(
			cms,
			displayed,
		);

		expect(readCount()).toBe(2);
		expect(patches).toEqual([
			{
				id: module.TARGET_POLICY_ID,
				body: { name: module.TARGET_POLICY_NAME },
			},
		]);
		expect(verified).toMatchObject({
			action: 'noop',
			permissionCount: 0,
			adminAccess: false,
			appAccess: false,
			accessRowCount: 1,
			roleOnlyAccessCount: 1,
			userOnlyAccessCount: 0,
			accessRows: [
				{
					id: 'access-role-a',
					policy: module.TARGET_POLICY_ID,
					role: 'role-endpoint-a',
					user: null,
					sort: 1,
				},
			],
		});
	});

	it('still performs a read-back for an idempotent apply', async () => {
		const module = subject();
		if (!module) return;
		const converged = convergedState();
		const displayed = module.buildPolicyQuarantineRenamePlan(converged);
		const { cms, patches, readCount } = fakeCms([converged, converged]);

		const verified = await module.applyAndVerifyPolicyQuarantineRename(
			cms,
			displayed,
		);

		expect(readCount()).toBe(2);
		expect(patches).toEqual([]);
		expect(verified.action).toBe('noop');
	});

	it('refuses stale pre-apply state and failed or unsafe read-back state', async () => {
		const module = subject();
		if (!module) return;
		const before = state();
		const displayed = module.buildPolicyQuarantineRenamePlan(before);
		const converged = convergedState();

		await expect(
			module.applyAndVerifyPolicyQuarantineRename(
				fakeCms([converged]).cms,
				displayed,
			),
		).rejects.toThrow(/state changed before apply/);
		await expect(
			module.applyAndVerifyPolicyQuarantineRename(
				fakeCms([before, before]).cms,
				displayed,
			),
		).rejects.toThrow(/post-apply verification failed.*target name/);
		await expect(
			module.applyAndVerifyPolicyQuarantineRename(
				fakeCms([
					before,
					convergedState({
						permissions: [{ id: 99 }],
					}),
				]).cms,
				displayed,
			),
		).rejects.toThrow(/expected zero permissions.*found 1/);
		await expect(
			module.applyAndVerifyPolicyQuarantineRename(
				fakeCms([
					before,
					convergedState({
						access: [accessRow({ id: 'access-role-replaced' })],
					}),
				]).cms,
				displayed,
			),
		).rejects.toThrow(/raw access projection changed/);
	});

	it('deep-compares the full raw access projection before and after PATCH', async () => {
		const module = subject();
		if (!module) return;
		const before = state();
		const displayed = module.buildPolicyQuarantineRenamePlan(before);
		const staleRole = fakeCms([
			state({
				access: [accessRow({ role: 'role-endpoint-replaced' })],
			}),
		]);
		await expect(
			module.applyAndVerifyPolicyQuarantineRename(staleRole.cms, displayed),
		).rejects.toThrow(/state changed before apply/);
		expect(staleRole.patches).toEqual([]);
		const stalePolicy = fakeCms([
			state({
				access: [accessRow({ policy: 'foreign-policy-before-patch' })],
			}),
		]);
		await expect(
			module.applyAndVerifyPolicyQuarantineRename(stalePolicy.cms, displayed),
		).rejects.toThrow(/raw access row.*unexpected policy/);
		expect(stalePolicy.patches).toEqual([]);

		const roleEndpointDrift = await rejectionText(
			module.applyAndVerifyPolicyQuarantineRename(
				fakeCms([
					before,
					convergedState({
						access: [accessRow({ role: 'role-endpoint-replaced' })],
					}),
				]).cms,
				displayed,
			),
		);
		expect(roleEndpointDrift).toContain('raw access projection changed');

		const sortDrift = await rejectionText(
			module.applyAndVerifyPolicyQuarantineRename(
				fakeCms([
					before,
					convergedState({
						access: [accessRow({ sort: 99 })],
					}),
				]).cms,
				displayed,
			),
		);
		expect(sortDrift).toContain('raw access projection changed');

		const policyDrift = await rejectionText(
			module.applyAndVerifyPolicyQuarantineRename(
				fakeCms([
					before,
					convergedState({
						access: [accessRow({ policy: 'foreign-policy-after-patch' })],
					}),
				]).cms,
				displayed,
			),
		);
		expect(policyDrift).toContain('raw access row 0 belongs to an unexpected policy');
		expect(policyDrift).not.toContain('foreign-policy-after-patch');
		expect(policyDrift).toContain('a name-only write may have occurred');
	});

	it('warns that a name-only write may have occurred when PATCH or post-readback fails', async () => {
		const module = subject();
		if (!module) return;
		const before = state();
		const displayed = module.buildPolicyQuarantineRenamePlan(before);
		const patchFailure = await rejectionText(
			module.applyAndVerifyPolicyQuarantineRename(
				{
					read: async () => before,
					patch: async () => {
						throw new Error('PATCH transport failed');
					},
				},
				displayed,
			),
		);
		expect(patchFailure).toContain('a name-only write may have occurred');

		const readBackFailure = await rejectionText(
			module.applyAndVerifyPolicyQuarantineRename(
				fakeCms([before, before]).cms,
				displayed,
			),
		);
		expect(readBackFailure).toContain('a name-only write may have occurred');
	});

	it('rejects stable-field drift before PATCH and after name-only read-back', async () => {
		const module = subject();
		if (!module) return;
		const before = state();
		const displayed = module.buildPolicyQuarantineRenamePlan(before);
		const stale = fakeCms([
			state({
				policy: policy({ description: 'changed before PATCH' }),
			}),
		]);
		await expect(
			module.applyAndVerifyPolicyQuarantineRename(stale.cms, displayed),
		).rejects.toThrow(/state changed before apply/);
		expect(stale.patches).toEqual([]);

		const postDrift = await rejectionText(
			module.applyAndVerifyPolicyQuarantineRename(
				fakeCms([
					before,
					convergedState({
						policy: policy({
							name: module.TARGET_POLICY_NAME,
							description: 'changed after PATCH',
						}),
					}),
				]).cms,
				displayed,
			),
		);
		expect(postDrift).toContain('preserved policy fields changed');
		expect(postDrift).toContain('a name-only write may have occurred');
	});
});

describe('policy quarantine rename Directus adapter', () => {
	it('GETs raw access without policy aliases, then PATCHes only the exact name', async () => {
		const module = subject();
		if (!module) return;
		const calls: Array<{ method: string; path: string; body?: unknown }> = [];
		const cms = module.createPolicyQuarantineRenameCms(
			async (method, path, body) => {
				calls.push({ method, path, body });
				if (method === 'GET' && path.startsWith('/policies/')) {
					return {
						status: 200,
						json: {
							data: {
								...policy(),
								roles: [accessRow()],
								users: [accessRow()],
							},
						},
					};
				}
				if (method === 'GET' && path.startsWith('/access?')) {
					return { status: 200, json: { data: [accessRow()] } };
				}
				if (method === 'GET' && path.startsWith('/permissions?')) {
					return { status: 200, json: { data: [] } };
				}
				if (method === 'GET' && path.startsWith('/policies?')) {
					return {
						status: 200,
						json: { data: state().matchingPolicies },
					};
				}
				if (method === 'PATCH' && path.startsWith('/policies/')) {
					return { status: 200, json: { data: { id: module.TARGET_POLICY_ID } } };
				}
				throw new Error(`unexpected ${method} ${path}`);
			},
		);

		await cms.read();
		await cms.patch(module.TARGET_POLICY_ID, {
			name: module.TARGET_POLICY_NAME,
		});

		const policyCall = calls.find(
			(call) =>
				call.method === 'GET' &&
				call.path.startsWith(`/policies/${module.TARGET_POLICY_ID}?`),
		);
		const accessCall = calls.find(
			(call) => call.method === 'GET' && call.path.startsWith('/access?'),
		);
		const permissionCall = calls.find(
			(call) => call.method === 'GET' && call.path.startsWith('/permissions?'),
		);
		const topologyCall = calls.find(
			(call) => call.method === 'GET' && call.path.startsWith('/policies?'),
		);
		const patchCall = calls.find((call) => call.method === 'PATCH');

		expect(calls.filter((call) => call.method === 'GET')).toHaveLength(4);
		expect(policyCall?.path).toContain(
			`/policies/${module.TARGET_POLICY_ID}?`,
		);
		expect(
			new URL(policyCall?.path ?? '', module.PROD_CMS_URL).searchParams.get(
				'fields',
			),
		).toBe(
			'id,name,admin_access,app_access,icon,description,ip_access,enforce_tfa',
		);
		expect(policyCall?.path).not.toMatch(
			/roles|users|email|first_name|last_name/,
		);
		const accessParams = new URL(
			accessCall?.path ?? '',
			module.PROD_CMS_URL,
		).searchParams;
		expect(accessParams.get('fields')).toBe('id,policy,role,user,sort');
		expect(accessParams.get('filter[policy][_eq]')).toBe(
			module.TARGET_POLICY_ID,
		);
		expect(accessParams.get('limit')).toBe('-1');
		expect(accessCall?.path).not.toMatch(/email|first_name|last_name|name/);
		expect(
			new URL(
				permissionCall?.path ?? '',
				module.PROD_CMS_URL,
			).searchParams.get('filter[policy][_eq]'),
		).toBe(module.TARGET_POLICY_ID);
		const topologyParams = new URL(
			topologyCall?.path ?? '',
			module.PROD_CMS_URL,
		).searchParams;
		expect(topologyParams.get('fields')).toBe('id,name');
		expect(topologyParams.get('filter[_or][0][name][_eq]')).toBe(
			module.CURRENT_POLICY_NAME,
		);
		expect(topologyParams.get('filter[_or][1][name][_eq]')).toBe(
			module.TARGET_POLICY_NAME,
		);
		expect(topologyCall?.path).not.toMatch(/email|first_name|last_name/);
		expect(patchCall).toEqual({
			method: 'PATCH',
			path: `/policies/${module.TARGET_POLICY_ID}`,
			body: { name: module.TARGET_POLICY_NAME },
		});
	});

	it('rejects any forged policy id, target name, or extra PATCH key', async () => {
		const module = subject();
		if (!module) return;
		const cms = module.createPolicyQuarantineRenameCms(async () => ({
			status: 200,
			json: { data: {} },
		}));
		await expect(
			cms.patch('wrong-policy', { name: module.TARGET_POLICY_NAME }),
		).rejects.toThrow(/exact target policy id/);
		await expect(
			cms.patch(module.TARGET_POLICY_ID, { name: 'wrong-name' }),
		).rejects.toThrow(/exact quarantine name/);
		await expect(
			cms.patch(module.TARGET_POLICY_ID, {
				name: module.TARGET_POLICY_NAME,
				access: [],
			} as never),
		).rejects.toThrow(/PATCH body must contain name only/);
	});

	it('reports HTTP status without leaking upstream response bodies', async () => {
		const module = subject();
		if (!module) return;
		const sensitiveMarker = 'UPSTREAM_RESPONSE_BODY_MUST_NOT_LEAK';
		const readCms = module.createPolicyQuarantineRenameCms(async () => ({
			status: 503,
			json: { errors: [{ message: sensitiveMarker }] },
		}));
		const readError = await rejectionText(readCms.read());
		expect(readError).toContain('GET /policies/');
		expect(readError).toContain('503');
		expect(readError).not.toContain(sensitiveMarker);

		const accessReadCms = module.createPolicyQuarantineRenameCms(
			async (method, path) => {
				if (method === 'GET' && path.startsWith('/policies/')) {
					return { status: 200, json: { data: policy() } };
				}
				return {
					status: 502,
					json: { errors: [{ message: sensitiveMarker }] },
				};
			},
		);
		const accessReadError = await rejectionText(accessReadCms.read());
		expect(accessReadError).toContain('GET /access failed (502)');
		expect(accessReadError).not.toContain(sensitiveMarker);

		const patchCms = module.createPolicyQuarantineRenameCms(async () => ({
			status: 500,
			json: { errors: [{ message: sensitiveMarker }] },
		}));
		const patchError = await rejectionText(
			patchCms.patch(module.TARGET_POLICY_ID, {
				name: module.TARGET_POLICY_NAME,
			}),
		);
		expect(patchError).toContain('PATCH /policies/');
		expect(patchError).toContain('500');
		expect(patchError).not.toContain(sensitiveMarker);
	});
});
