// Maps technology names (as they appear in project.stack) to short role labels
// for the hero edge metadata display. Roles should be <=9 chars, uppercase.
// WHY: The project detail hero auto-generates edge metadata from the stack array.
// This mapping gives each tech a meaningful category label (DB, ETL, FE) instead
// of repeating the tech name.
export const STACK_ROLE_MAP: Readonly<Record<string, string>> = {
	'PostgreSQL': 'DB',
	'SQL Server': 'DB',
	'MySQL': 'DB',
	'Python': 'ETL',
	'dbt': 'TRANSFORM',
	'Power BI': 'VIZ',
	'Apache Airflow': 'ORCH',
	'Airflow': 'ORCH',
	'Retool': 'UI',
	'SvelteKit': 'FE',
	'Svelte 5': 'FE',
	'TypeScript': 'LANG',
	'Tailwind CSS': 'STYLE',
	'Vercel': 'DEPLOY',
	'Node.js': 'RUNTIME',
	'REST API': 'API',
	'Alembic': 'MIGRATE',
	'SSMS': 'TOOL',
	'T-SQL': 'LANG',
	'DAX': 'LANG',
};

/**
 * Returns the role label for a given technology name.
 * Falls back to the first 6 characters uppercased if the tech is not in the map.
 * WHY: Edge metadata needs a short role prefix for every stack item. Unknown
 * techs get a truncated name rather than throwing — graceful degradation.
 */
export function getStackRole(tech: string): string {
	return STACK_ROLE_MAP[tech] ?? tech.toUpperCase().slice(0, 6);
}
