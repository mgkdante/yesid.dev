import { describe, it, expect } from 'vitest';
import { getStackRole, STACK_ROLE_MAP } from './stack-roles.js';

describe('STACK_ROLE_MAP', () => {
	it('is a non-empty record of string → string', () => {
		expect(Object.keys(STACK_ROLE_MAP).length).toBeGreaterThan(0);
		Object.entries(STACK_ROLE_MAP).forEach(([key, value]) => {
			expect(typeof key).toBe('string');
			expect(typeof value).toBe('string');
			expect(value.length).toBeLessThanOrEqual(9);
		});
	});

	it('maps known technologies to expected roles', () => {
		expect(STACK_ROLE_MAP['PostgreSQL']).toBe('DB');
		expect(STACK_ROLE_MAP['Python']).toBe('ETL');
		expect(STACK_ROLE_MAP['SvelteKit']).toBe('FE');
		expect(STACK_ROLE_MAP['Vercel']).toBe('DEPLOY');
	});
});

describe('getStackRole', () => {
	it('returns mapped role for a known tech', () => {
		expect(getStackRole('PostgreSQL')).toBe('DB');
		expect(getStackRole('dbt')).toBe('TRANSFORM');
		expect(getStackRole('Power BI')).toBe('VIZ');
	});

	it('falls back to uppercase truncated name for unknown tech', () => {
		expect(getStackRole('Terraform')).toBe('TERRAF');
	});

	it('handles short unknown names without crashing', () => {
		expect(getStackRole('Go')).toBe('GO');
		expect(getStackRole('R')).toBe('R');
	});

	it('truncates fallback to 6 characters max', () => {
		const result = getStackRole('SomeVeryLongTechnology');
		expect(result.length).toBeLessThanOrEqual(6);
	});
});
