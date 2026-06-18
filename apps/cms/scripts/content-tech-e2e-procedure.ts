#!/usr/bin/env bun
/**
 * Align tech-stack copy with the CI policy:
 * cheap checks run automatically, Playwright E2E is a manual procedure.
 *
 * DEV-ONLY. Dry-run by default; pass --apply to execute.
 */

import { readItems, updateItem } from '@directus/sdk';
import type { BlockEditorDoc } from '@repo/shared';
import { getAdminToken } from './lib/auth';
import { assertDevCms, createClient, defaultDirectusUrl } from './lib/sdk';

type Locale = 'en' | 'fr';

interface TextDoc {
	text: string;
	time: number;
}

interface CopyPatch {
	id: string;
	locale: Locale;
	fields: {
		what_i_use_it_for?: TextDoc;
		why_i_use_it_instead?: TextDoc;
	};
}

interface TranslationRow {
	id: number;
	tech_stack_id: string | { id: string };
	languages_code: Locale;
}

const PATCHES: readonly CopyPatch[] = [
	{
		id: 'github-actions',
		locale: 'en',
		fields: {
			what_i_use_it_for: {
				time: 1777263977612,
				text: 'On yesid.dev, GitHub Actions runs the cheap CI gate on every push and PR: type checks, unit tests, token drift checks, package tests, and builds. Playwright E2E is still part of the procedure, but I trigger it manually when a release, risky UI change, or production check needs browser proof. That keeps broken builds visible without burning Vercel Edge Requests on every commit.',
			},
			why_i_use_it_instead: {
				time: 1777263977612,
				text: 'GitHub Actions integrates directly with where my code lives: no separate CI service, no webhooks to maintain, no extra accounts. I define the pipeline in <code>.github/workflows/</code>, keep the required checks cheap by default, and use manual workflow dispatch for heavier verification like Playwright. PR checks stay visible inline, deployments stay tied to commits, and the expensive tests run when they are actually useful.',
			},
		},
	},
	{
		id: 'github-actions',
		locale: 'fr',
		fields: {
			what_i_use_it_for: {
				time: 1777263977612,
				text: "Sur yesid.dev, GitHub Actions roule le contrôle CI léger à chaque push et PR : vérification de types, tests unitaires, drift des tokens, tests de packages et builds. Les tests E2E Playwright restent dans la procédure, mais je les déclenche manuellement quand une release, un changement UI risqué ou une vérification prod a besoin d'une preuve navigateur. Ça garde les builds cassés visibles sans brûler des Vercel Edge Requests à chaque commit.",
			},
			why_i_use_it_instead: {
				time: 1777263977612,
				text: "GitHub Actions s'intègre directement là où mon code vit : pas de service CI séparé, pas de webhooks à maintenir, pas de comptes additionnels. Je définis le pipeline dans <code>.github/workflows/</code>, je garde les checks requis légers par défaut et j'utilise le déclenchement manuel pour les vérifications plus lourdes comme Playwright. Les checks de PR restent visibles dans GitHub, les déploiements restent liés aux commits et les tests coûteux roulent quand ils sont vraiment utiles.",
			},
		},
	},
	{
		id: 'playwright',
		locale: 'en',
		fields: {
			what_i_use_it_for: {
				time: 1777263977619,
				text: "Playwright is yesid.dev's manual E2E layer for critical flows: navigating the tech stack diagram, opening detail panels, using filters, checking mobile layouts, and validating release candidates in a real browser. It is wired into GitHub Actions as an explicit workflow dispatch, not a default push check, so I can get browser proof without spending Edge Requests on routine commits.",
			},
		},
	},
	{
		id: 'playwright',
		locale: 'fr',
		fields: {
			what_i_use_it_for: {
				time: 1777263977619,
				text: "Playwright est la couche E2E manuelle de yesid.dev pour les parcours critiques : naviguer dans le diagramme du stack, ouvrir les panneaux de détails, utiliser les filtres, vérifier les layouts mobile et valider une release candidate dans un vrai navigateur. Il est branché dans GitHub Actions comme workflow déclenché explicitement, pas comme check par défaut à chaque push, donc je peux obtenir une preuve navigateur sans dépenser des Edge Requests sur les commits routiniers.",
			},
		},
	},
];

function parentId(row: TranslationRow): string {
	return typeof row.tech_stack_id === 'string' ? row.tech_stack_id : row.tech_stack_id.id;
}

function blockDoc(doc: TextDoc): BlockEditorDoc {
	return {
		time: doc.time,
		version: '2.31.2',
		blocks: [{ id: 'm00000001', type: 'paragraph', data: { text: doc.text } }],
	};
}

export async function apply(opts: {
	directusUrl: string;
	token: string;
	dryRun?: boolean;
}): Promise<readonly string[]> {
	const dryRun = opts.dryRun ?? true;
	const client = createClient(opts.directusUrl, opts.token);
	const ids = [...new Set(PATCHES.map((patch) => patch.id))];
	const rows = (await client.request(
		readItems('tech_stack_translations', {
			fields: ['id', 'tech_stack_id', 'languages_code'],
			filter: { tech_stack_id: { _in: ids }, languages_code: { _in: ['en', 'fr'] } },
			limit: -1,
		}),
	)) as TranslationRow[];
	const byKey = new Map(rows.map((row) => [`${parentId(row)}:${row.languages_code}`, row]));
	const log: string[] = [];

	for (const patch of PATCHES) {
		const current = byKey.get(`${patch.id}:${patch.locale}`);
		if (!current) throw new Error(`Missing tech_stack_translations row: ${patch.id}/${patch.locale}`);
		const payload = Object.fromEntries(
			Object.entries(patch.fields).map(([field, text]) => [field, blockDoc(text)]),
		);
		log.push(`${dryRun ? 'would update' : 'updated'} ${patch.id}/${patch.locale}: ${Object.keys(payload).join(', ')}`);
		if (!dryRun) await client.request(updateItem('tech_stack_translations', current.id, payload));
	}

	return log;
}

async function main(): Promise<void> {
	const dryRun = !process.argv.includes('--apply');
	const directusUrl = defaultDirectusUrl();
	assertDevCms(directusUrl);
	const token = await getAdminToken(directusUrl);
	const log = await apply({ directusUrl, token, dryRun });
	console.log(log.join('\n'));
	console.log(`\n${dryRun ? 'DRY-RUN. Re-run with --apply.' : 'APPLIED.'}`);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[content-tech-e2e-procedure] FAILED:', error);
		process.exit(1);
	});
}
