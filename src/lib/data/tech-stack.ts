// Tech stack data layer — Slice 10 "The Control Room"
// Parses markdown files from src/content/stack/ and src/content/scenarios/ at build time.
// Adding a new tech = one markdown file, zero code changes.

import type {
	TechStackItem,
	TechRelation,
	StackScenario,
	InfraLayer,
	DomainCluster,
	Proficiency,
	LocalizedString,
} from './types.js';

// --- Frontmatter parsing ---

function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!match) return { data: {}, content: raw };

	const frontmatter = match[1];
	const content = match[2];
	const data: Record<string, unknown> = {};

	for (const line of frontmatter.split('\n')) {
		const colonIdx = line.indexOf(':');
		if (colonIdx === -1) continue;
		const key = line.slice(0, colonIdx).trim();
		let value: unknown = line.slice(colonIdx + 1).trim();

		if (typeof value === 'string') {
			// Strip quotes
			if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
				value = (value as string).slice(1, -1);
			}
			// Parse arrays
			if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
				const inner = (value as string).slice(1, -1).trim();
				value = inner.length === 0 ? [] : inner.split(',').map((s) => s.trim());
			}
		}

		data[key] = value;
	}

	return { data, content };
}

// --- Validation constants ---

const VALID_LAYERS: InfraLayer[] = [
	'data', 'backend', 'api', 'frontend', 'mobile', 'analytics', 'devops', 'testing', 'systems',
];

const VALID_DOMAINS: DomainCluster[] = [
	'data-engineering', 'web-development', 'mobile-development', 'analytics-bi',
	'systems-programming', 'devops-infra', 'internal-tooling',
];

const VALID_PROFICIENCIES: Proficiency[] = ['expert', 'proficient', 'familiar'];

// --- Context phrase maps (for auto-deriving relation descriptions) ---

const DOMAIN_PHRASES: Record<DomainCluster, string> = {
	'data-engineering': 'data pipelines',
	'web-development': 'web applications',
	'mobile-development': 'mobile apps',
	'analytics-bi': 'analytics & reporting',
	'systems-programming': 'systems programming',
	'devops-infra': 'infrastructure',
	'internal-tooling': 'internal tools',
};

const LAYER_PHRASES: Record<InfraLayer, string> = {
	data: 'data storage',
	backend: 'backend services',
	api: 'API layer',
	frontend: 'frontend rendering',
	mobile: 'mobile interfaces',
	analytics: 'analytics processing',
	devops: 'deployment pipeline',
	testing: 'test automation',
	systems: 'systems layer',
};

// --- Raw file loading ---

const rawStackFiles = import.meta.glob('/src/content/stack/*.md', {
	query: '?raw',
	import: 'default',
	eager: true,
}) as Record<string, string>;

const rawScenarioFiles = import.meta.glob('/src/content/scenarios/*.md', {
	query: '?raw',
	import: 'default',
	eager: true,
}) as Record<string, string>;

// --- Parse tech items ---

function parseConnectionNotes(data: Record<string, unknown>): Record<string, string> | undefined {
	const raw = data.connectionNotes;
	if (!raw || typeof raw !== 'object') return undefined;
	const notes: Record<string, string> = {};
	for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
		if (typeof val === 'string') notes[key] = val;
	}
	return Object.keys(notes).length > 0 ? notes : undefined;
}

function parseStackItem(raw: string): TechStackItem | null {
	const { data } = parseFrontmatter(raw);
	if (!data.id || !data.name || !data.layer) return null;

	return {
		id: data.id as string,
		name: data.name as string,
		layer: data.layer as InfraLayer,
		domains: ((data.domains as string[]) ?? []) as DomainCluster[],
		connectsTo: (data.connectsTo as string[]) ?? [],
		relatedServices: (data.relatedServices as string[]) ?? [],
		relatedProjects: (data.relatedProjects as string[]) ?? [],
		icon: (data.icon as string) ?? data.id,
		proficiency: (data.proficiency as Proficiency) ?? 'familiar',
		connectionNotes: parseConnectionNotes(data),
	};
}

function parseScenario(raw: string): StackScenario | null {
	const { data, content } = parseFrontmatter(raw);
	if (!data.id || !data.domains) return null;

	return {
		id: data.id as string,
		domains: ((data.domains as string[]) ?? []) as DomainCluster[],
		recommended: (data.recommended as string[]) ?? [],
		summary: { en: content.trim() },
		relatedProjects: (data.relatedProjects as string[]) ?? [],
	};
}

// --- Parsed data ---

const techItems: TechStackItem[] = Object.values(rawStackFiles)
	.map(parseStackItem)
	.filter((item): item is TechStackItem => item !== null);

const scenarios: StackScenario[] = Object.values(rawScenarioFiles)
	.map(parseScenario)
	.filter((s): s is StackScenario => s !== null);

// Index for fast lookups
const itemsById = new Map(techItems.map((item) => [item.id, item]));

// --- Raw content cache (for sidebar markdown) ---

const contentByIdMap = new Map<string, string>();
for (const [path, raw] of Object.entries(rawStackFiles)) {
	const { content } = parseFrontmatter(raw);
	const filename = path.split('/').pop()?.replace('.md', '') ?? '';
	contentByIdMap.set(filename, content);
}

// --- Public API ---

/** All parsed tech stack items. */
export function getAllTechItems(): readonly TechStackItem[] {
	return techItems;
}

/** Single item by ID, or undefined if not found. */
export function getTechItemById(id: string): TechStackItem | undefined {
	return itemsById.get(id);
}

/** All items in a given infrastructure layer. */
export function getTechItemsByLayer(layer: InfraLayer): readonly TechStackItem[] {
	return techItems.filter((item) => item.layer === layer);
}

/** All items belonging to a given domain cluster. */
export function getTechItemsByDomain(domain: DomainCluster): readonly TechStackItem[] {
	return techItems.filter((item) => item.domains.includes(domain));
}

/** IDs of items that this item connects to (directional outgoing edges). */
export function getConnections(id: string): readonly string[] {
	return itemsById.get(id)?.connectsTo ?? [];
}

/** IDs of items that connect TO this item (directional incoming edges). */
export function getIncomingConnections(id: string): readonly string[] {
	return techItems.filter((item) => item.connectsTo.includes(id)).map((item) => item.id);
}

/** Raw markdown content body for a tech item (the prose below frontmatter). */
export function getTechItemContent(id: string): string {
	return contentByIdMap.get(id) ?? '';
}

/** All parsed scenarios. */
export function getAllScenarios(): readonly StackScenario[] {
	return scenarios;
}

// --- Relation helpers ---

/** Derive a context phrase for a connection between two items. */
function deriveContextPhrase(source: TechStackItem, target: TechStackItem): string {
	// 1. Custom override from source's connectionNotes
	if (source.connectionNotes?.[target.id]) {
		return source.connectionNotes[target.id];
	}

	// 2. Shared domain between source and target
	const shared = source.domains.find((d) => target.domains.includes(d));
	if (shared) {
		return DOMAIN_PHRASES[shared];
	}

	// 3. Fall back to target's primary domain
	if (target.domains.length > 0) {
		return DOMAIN_PHRASES[target.domains[0]];
	}

	// 4. Last resort: target's layer
	return LAYER_PHRASES[target.layer];
}

/** Outgoing connections with context phrases: "this item sends data to..." */
export function getOutgoingRelations(id: string): readonly TechRelation[] {
	const source = itemsById.get(id);
	if (!source) return [];

	return source.connectsTo
		.map((targetId) => {
			const target = itemsById.get(targetId);
			if (!target) return null;
			return {
				itemId: target.id,
				itemName: target.name,
				contextPhrase: deriveContextPhrase(source, target),
			};
		})
		.filter((r): r is TechRelation => r !== null);
}

/** Incoming connections with context phrases: "this item receives from..." */
export function getIncomingRelations(id: string): readonly TechRelation[] {
	const target = itemsById.get(id);
	if (!target) return [];

	return techItems
		.filter((source) => source.connectsTo.includes(id))
		.map((source) => ({
			itemId: source.id,
			itemName: source.name,
			contextPhrase: deriveContextPhrase(source, target),
		}));
}

/** Find the best matching scenario for a set of active domains. */
export function getScenarioForDomains(domains: DomainCluster[]): StackScenario | undefined {
	if (domains.length === 0) return undefined;

	const sorted = [...domains].sort();

	// Exact match first
	const exact = scenarios.find((s) => {
		const sDomains = [...s.domains].sort();
		return sDomains.length === sorted.length && sDomains.every((d, i) => d === sorted[i]);
	});
	if (exact) return exact;

	// Partial match: scenario domains are a subset of selected domains
	const partial = scenarios
		.filter((s) => s.domains.every((d) => sorted.includes(d)))
		.sort((a, b) => b.domains.length - a.domains.length);

	return partial[0];
}

// --- Validation helpers (used by tests) ---

export function validateTechItems(): string[] {
	const errors: string[] = [];
	const ids = new Set<string>();

	for (const item of techItems) {
		// Unique IDs
		if (ids.has(item.id)) errors.push(`Duplicate ID: ${item.id}`);
		ids.add(item.id);

		// Valid layer
		if (!VALID_LAYERS.includes(item.layer)) {
			errors.push(`${item.id}: invalid layer "${item.layer}"`);
		}

		// At least one domain
		if (item.domains.length === 0) {
			errors.push(`${item.id}: no domains assigned`);
		}

		// Valid domains
		for (const d of item.domains) {
			if (!VALID_DOMAINS.includes(d)) {
				errors.push(`${item.id}: invalid domain "${d}"`);
			}
		}

		// Valid proficiency
		if (!VALID_PROFICIENCIES.includes(item.proficiency)) {
			errors.push(`${item.id}: invalid proficiency "${item.proficiency}"`);
		}

		// No self-references
		if (item.connectsTo.includes(item.id)) {
			errors.push(`${item.id}: self-reference in connectsTo`);
		}
	}

	// Dangling connectsTo references
	for (const item of techItems) {
		for (const target of item.connectsTo) {
			if (!ids.has(target)) {
				errors.push(`${item.id}: connectsTo target "${target}" does not exist`);
			}
		}
	}

	return errors;
}

export function validateScenarios(): string[] {
	const errors: string[] = [];
	const ids = new Set<string>();
	const techIds = new Set(techItems.map((i) => i.id));

	for (const s of scenarios) {
		if (ids.has(s.id)) errors.push(`Duplicate scenario ID: ${s.id}`);
		ids.add(s.id);

		for (const d of s.domains) {
			if (!VALID_DOMAINS.includes(d)) {
				errors.push(`Scenario ${s.id}: invalid domain "${d}"`);
			}
		}

		for (const r of s.recommended) {
			if (!techIds.has(r)) {
				errors.push(`Scenario ${s.id}: recommended tech "${r}" does not exist`);
			}
		}

		if (!s.summary.en || s.summary.en.length === 0) {
			errors.push(`Scenario ${s.id}: missing summary`);
		}
	}

	return errors;
}
