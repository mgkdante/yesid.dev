// Tech-stack repository — thin async delegation over adapter.techStack.
// Reshaped in slice-18g Phase 4 Task 9: only all/byId/content remain.
// The removed methods (byLayer/byDomain/connections/incomingConnections/
// outgoing+incomingRelations/allScenarios/scenarioForDomains) were dropped
// together with the matching fields on TechStackItem (decisions Q1+Q2+Q5).
// Phase 5 will clean up the consumers (lib/components/stack/*.svelte,
// lib/content/tech-stack.ts).

import { adapter } from '$lib/adapters';
import type { TechStackItem } from '$lib/types';

export async function getAllTechItems(): Promise<readonly TechStackItem[]> {
	return adapter.techStack.all();
}

// getTechItemById / getTechItemContent — pruned in slice-28.3 (#117, zero
// route consumers). adapter.techStack.byId/content stay on the ContentAdapter
// contract — the static suites (adapter.test.ts, __tests__/
// static-content.test.ts) exercise them directly.
