import { describe, it, expect } from 'vitest';
import { toIconifyId } from './tech-icon-utils';

describe('toIconifyId', () => {
	it('prepends logos: namespace by default', () => {
		expect(toIconifyId('airflow')).toBe('logos:airflow');
		expect(toIconifyId('postgresql')).toBe('logos:postgresql');
		expect(toIconifyId('react')).toBe('logos:react');
	});

	it('passes through pre-namespaced IDs unchanged', () => {
		expect(toIconifyId('logos:apache-airflow')).toBe('logos:apache-airflow');
		expect(toIconifyId('lucide:wind')).toBe('lucide:wind');
		expect(toIconifyId('simple-icons:typescript')).toBe('simple-icons:typescript');
	});

	it('returns empty string for empty input', () => {
		expect(toIconifyId('')).toBe('');
	});

	it('respects custom default namespace', () => {
		expect(toIconifyId('database', 'lucide')).toBe('lucide:database');
		expect(toIconifyId('typescript', 'simple-icons')).toBe('simple-icons:typescript');
	});

	it('does not double-prefix when input already namespaced even with custom default', () => {
		expect(toIconifyId('logos:react', 'lucide')).toBe('logos:react');
	});

	it('handles kebab-case slugs without splitting them', () => {
		expect(toIconifyId('jetpack-compose')).toBe('logos:jetpack-compose');
		expect(toIconifyId('github-actions')).toBe('logos:github-actions');
	});
});
