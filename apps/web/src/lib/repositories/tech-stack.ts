// Tech-stack repository — thin async delegation over adapter.techStack.
// Validation helpers (validateTechItems, validateScenarios from the old
// content module) are test-only and intentionally not surfaced here.

import { adapter } from '$lib/adapters';
import type {
	TechStackItem,
	InfraLayer,
	DomainCluster,
	StackScenario,
	TechRelation,
} from '$lib/types';

export async function getAllTechItems(): Promise<readonly TechStackItem[]> {
	return adapter.techStack.all();
}

export async function getTechItemById(id: string): Promise<TechStackItem | undefined> {
	return adapter.techStack.byId(id);
}

export async function getTechItemsByLayer(
	layer: InfraLayer
): Promise<readonly TechStackItem[]> {
	return adapter.techStack.byLayer(layer);
}

export async function getTechItemsByDomain(
	domain: DomainCluster
): Promise<readonly TechStackItem[]> {
	return adapter.techStack.byDomain(domain);
}

export async function getConnections(id: string): Promise<readonly string[]> {
	return adapter.techStack.connections(id);
}

export async function getIncomingConnections(id: string): Promise<readonly string[]> {
	return adapter.techStack.incomingConnections(id);
}

export async function getOutgoingRelations(id: string): Promise<readonly TechRelation[]> {
	return adapter.techStack.outgoingRelations(id);
}

export async function getIncomingRelations(id: string): Promise<readonly TechRelation[]> {
	return adapter.techStack.incomingRelations(id);
}

export async function getTechItemContent(id: string): Promise<string> {
	return adapter.techStack.content(id);
}

export async function getAllScenarios(): Promise<readonly StackScenario[]> {
	return adapter.techStack.allScenarios();
}

export async function getScenarioForDomains(
	domains: DomainCluster[]
): Promise<StackScenario | undefined> {
	return adapter.techStack.scenarioForDomains(domains);
}
