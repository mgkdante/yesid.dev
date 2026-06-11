// blueprint-param (slice-29) — serialize a Tech Stack Engine blueprint into
// the /contact?bp= query param and back.
//
// Format: '<archetype-slug|custom>~techId.techId.techId'
//   - head: the archetype slug, or the literal 'custom' for compose mode
//   - tail: picked/stack tech ids joined by '.', possibly empty
// All slugs/ids are [a-z0-9-], so the whole value is URL-safe without
// percent-encoding ('~' and '.' are unreserved-safe in query values).
//
// decodeBlueprint NEVER throws — any malformed input returns null so a
// hand-edited URL can't crash the contact page.

import { stackArchetypes } from '$lib/content/stack-archetypes';
import { techStackItems } from '$lib/content/tech-stack';

export interface BlueprintParam {
	/** Archetype slug, or null for a custom (compose-mode) blueprint. */
	archetype: string | null;
	techs: string[];
}

/** Reserved head marking a compose-mode blueprint with no archetype. */
const CUSTOM_HEAD = 'custom';

const SLUG_RE = /^[a-z0-9-]+$/;

export function encodeBlueprint(bp: BlueprintParam): string {
	const head = bp.archetype ?? CUSTOM_HEAD;
	return `${head}~${bp.techs.join('.')}`;
}

/** Inverse of encodeBlueprint. Null on any garbage — never throws. */
export function decodeBlueprint(raw: string | null | undefined): BlueprintParam | null {
	if (typeof raw !== 'string' || raw.length === 0) return null;
	const parts = raw.split('~');
	if (parts.length !== 2) return null;
	const [head, tail] = parts;
	if (!SLUG_RE.test(head)) return null;
	const techs = tail === '' ? [] : tail.split('.');
	if (!techs.every((id) => SLUG_RE.test(id))) return null;
	return { archetype: head === CUSTOM_HEAD ? null : head, techs };
}

/**
 * Build the /contact message prefill from a raw ?bp= value.
 *
 * "I'm interested in something like <archetype title (en) | a custom stack>
 *  built on <tech display names>." — unknown tech ids are skipped; when none
 * resolve, the built-on clause is dropped. Null when the param is absent or
 * garbage (the field stays empty).
 */
export function blueprintPrefillMessage(raw: string | null | undefined): string | null {
	const bp = decodeBlueprint(raw);
	if (!bp) return null;

	const archetype = bp.archetype
		? stackArchetypes.find((a) => a.slug === bp.archetype)
		: undefined;
	const subject = archetype ? archetype.title.en : 'a custom stack';

	const namesById = new Map(techStackItems.map((t) => [t.id, t.name]));
	const names = bp.techs
		.map((id) => namesById.get(id))
		.filter((name): name is string => typeof name === 'string' && name.length > 0);

	const builtOn = names.length > 0 ? ` built on ${names.join(', ')}` : '';
	return `I'm interested in something like ${subject}${builtOn}.`;
}
