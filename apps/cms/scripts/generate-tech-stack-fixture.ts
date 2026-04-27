#!/usr/bin/env bun
/**
 * Generate `apps/cms/fixtures/collections/tech-stack.json` from the 34
 * static markdown files at `apps/web/src/content/stack/*.md`.
 *
 * Slice 18 18g Phase 1 Task 3. One-off generator; commit output alongside
 * this script. Re-run from **repo root** if markdown bodies change before
 * the static path is deleted in 18k.
 *
 * Must be run from repo root:
 *   bun run apps/cms/scripts/generate-tech-stack-fixture.ts
 *
 * Reads:  apps/web/src/content/stack/*.md  (relative to cwd = repo root)
 * Writes: apps/cms/fixtures/collections/tech-stack.json
 *
 * Per research P1: 33 files use `## Why I use it`; 1 file (threejs-threlte.md)
 * uses `## Why I chose it`. Both map to `why_i_use_it_instead`.
 * Per research P2: zero orphan FK refs — emit all junction refs verbatim.
 * Per decisions Q1+Q2+Q5: layer/domains/connectsTo/proficiency are DROPPED.
 * Per frontmatter quirk: name is wrapped in `"` in many files — strip them.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseFrontmatter, mapMarkdownToBlocks } from './migrate-markdown-to-blocks';
import { createLogger } from './lib/logger';
import type { BlockEditorDoc } from '@repo/shared';

// --- Types ------------------------------------------------------------------

interface TechStackTranslation {
	languages_code: 'en';
	what_it_is: BlockEditorDoc;
	what_i_use_it_for: BlockEditorDoc;
	why_i_use_it_instead: BlockEditorDoc;
}

interface TechStackFixtureRow {
	id: string;
	name: string;
	icon: string;
	status: 'published';
	sort: number;
	lang: 'en';
	translation: TechStackTranslation;
	related_services: string[];
	related_projects: string[];
}

// --- Logger -----------------------------------------------------------------

const log = createLogger('generate-tech-stack-fixture');

// --- Section splitter -------------------------------------------------------

/**
 * Split markdown body content (after frontmatter) into named sections at H2
 * boundaries. Returns a map of { lowercasedHeadingText → sectionBody }.
 *
 * Each section body is everything between the H2 line (exclusive) and the
 * next H2 line (or EOF), trimmed of leading/trailing whitespace.
 */
function splitSections(content: string): Map<string, string> {
	const lines = content.split(/\r?\n/);
	const sections = new Map<string, string>();

	let currentHeading: string | null = null;
	let currentLines: string[] = [];

	for (const line of lines) {
		const h2Match = line.match(/^##\s+(.+?)\s*$/);
		if (h2Match) {
			const headingText = h2Match[1] ?? '';
			if (currentHeading !== null) {
				sections.set(currentHeading, currentLines.join('\n').trim());
				currentLines = [];
			}
			currentHeading = headingText.toLowerCase();
		} else if (currentHeading !== null) {
			currentLines.push(line);
		}
	}

	// Save the last section
	if (currentHeading !== null) {
		sections.set(currentHeading, currentLines.join('\n').trim());
	}

	return sections;
}

/**
 * Extract the three required sections from a file's content.
 * Throws with a clear error if any required section is missing.
 */
function extractSections(
	content: string,
	filePath: string,
): {
	whatItIs: string;
	inPractice: string;
	whyIUseItInstead: string;
} {
	const sections = splitSections(content);

	const whatItIs = sections.get('what it is');
	if (!whatItIs) {
		throw new Error(
			`Missing required section "## What it is" in file: ${filePath}`,
		);
	}

	const inPractice = sections.get('in practice');
	if (!inPractice) {
		throw new Error(
			`Missing required section "## In Practice" in file: ${filePath}`,
		);
	}

	// Accept both "## Why I use it" and "## Why I chose it" (1 file uses the latter)
	const whyIUseItInstead =
		sections.get('why i use it') ?? sections.get('why i chose it');
	if (!whyIUseItInstead) {
		throw new Error(
			`Missing required section "## Why I use it" (or "## Why I chose it") in file: ${filePath}`,
		);
	}

	return { whatItIs, inPractice, whyIUseItInstead };
}

// --- Frontmatter helpers ----------------------------------------------------

/**
 * Strip surrounding double-quotes from a string value (if present).
 * parseFrontmatter does NOT strip them automatically.
 * e.g.  `"Apache Airflow"` → `Apache Airflow`
 */
function stripQuotes(value: string): string {
	if (value.startsWith('"') && value.endsWith('"')) {
		return value.slice(1, -1);
	}
	return value;
}

// --- Per-file transform -----------------------------------------------------

function processFile(filePath: string, sortIndex: number): TechStackFixtureRow {
	const raw = readFileSync(filePath, 'utf-8');
	const { data, content } = parseFrontmatter(raw);

	// Validate required frontmatter fields
	const id = data['id'];
	if (typeof id !== 'string' || !id) {
		throw new Error(`Missing or invalid frontmatter field "id" in file: ${filePath}`);
	}

	const rawName = data['name'];
	if (typeof rawName !== 'string' || !rawName) {
		throw new Error(`Missing or invalid frontmatter field "name" in file: ${filePath}`);
	}
	const name = stripQuotes(rawName);

	// icon: use frontmatter value; fallback to id if absent
	const rawIcon = data['icon'];
	const icon: string =
		typeof rawIcon === 'string' && rawIcon ? rawIcon : id;

	// Junction arrays — verbatim, no filtering (P2: zero orphans confirmed).
	// Per-element type guard avoids silent corruption if frontmatter ever
	// produces non-string values inside the array.
	const relatedServices = Array.isArray(data['relatedServices'])
		? data['relatedServices'].filter((x): x is string => typeof x === 'string')
		: [];
	const relatedProjects = Array.isArray(data['relatedProjects'])
		? data['relatedProjects'].filter((x): x is string => typeof x === 'string')
		: [];

	// Extract sections and convert each to BlockEditorDoc
	const { whatItIs, inPractice, whyIUseItInstead } = extractSections(content, filePath);

	const what_it_is = mapMarkdownToBlocks(whatItIs);
	const what_i_use_it_for = mapMarkdownToBlocks(inPractice);
	const why_i_use_it_instead = mapMarkdownToBlocks(whyIUseItInstead);

	return {
		id,
		name,
		icon,
		status: 'published',
		sort: sortIndex,
		lang: 'en',
		translation: {
			languages_code: 'en',
			what_it_is,
			what_i_use_it_for,
			why_i_use_it_instead,
		},
		related_services: relatedServices,
		related_projects: relatedProjects,
	};
}

// --- Main -------------------------------------------------------------------

function main(): void {
	const stackDir = resolve(process.cwd(), 'apps/web/src/content/stack');
	const outputPath = resolve(
		process.cwd(),
		'apps/cms/fixtures/collections/tech-stack.json',
	);

	log.info(`reading markdown files from: ${stackDir}`);

	// Collect .md files and sort alphabetically by filename (→ by id)
	const files = readdirSync(stackDir)
		.filter((f) => f.endsWith('.md'))
		.sort();

	log.info(`found ${files.length} markdown files`);

	const rows: TechStackFixtureRow[] = [];

	for (const [i, filename] of files.entries()) {
		const filePath = join(stackDir, filename);
		const row = processFile(filePath, i + 1); // 1-based sort index
		rows.push(row);
		log.info(
			`  ✓ ${row.id.padEnd(24)}  services=${row.related_services.length}  projects=${row.related_projects.length}`,
		);
	}

	// Output: 2-space indent, terminated with single trailing newline
	const json = JSON.stringify(rows, null, 2) + '\n';
	writeFileSync(outputPath, json, 'utf-8');

	const serviceTotal = rows.reduce((s, r) => s + r.related_services.length, 0);
	const projectTotal = rows.reduce((s, r) => s + r.related_projects.length, 0);

	log.info(`wrote ${outputPath}`);
	log.info(
		`summary: ${rows.length} entries | ${serviceTotal} service refs | ${projectTotal} project refs`,
	);
}

if (import.meta.main) {
	try {
		main();
	} catch (err) {
		log.error('FAILED:', err);
		process.exit(1);
	}
}
