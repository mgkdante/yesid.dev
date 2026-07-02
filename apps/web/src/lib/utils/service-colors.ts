// GO2-W5 STM line bullets — service id → métro line color. Shared by the
// project/service presentation atoms (ServiceBadge, ProjectCard station chip)
// so the mapping lives in one place.

const SERVICE_LINE_COLORS: Record<string, string> = {
	'database-engineering': 'var(--primary)', // orange line
	'data-pipeline': 'var(--line-amber)', // yellow line
	'analytics-reporting': 'var(--signal-proceed)', // green line
	'web-development': 'var(--signal-lunar)', // lunar line
};

/** Resolve a service id to its métro line color, defaulting to the lunar line. */
export function serviceLineColor(serviceId: string): string {
	return SERVICE_LINE_COLORS[serviceId] ?? 'var(--signal-lunar)';
}
