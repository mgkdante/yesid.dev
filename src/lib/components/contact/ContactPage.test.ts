import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import ContactPage from './ContactPage.svelte';

async function typeInto(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
	el.value = value;
	await fireEvent.input(el);
	await tick();
	await tick();
}

async function submitForm(submitBtn: HTMLElement) {
	const form = submitBtn.closest('form') as HTMLFormElement;
	await fireEvent.submit(form);
	await tick();
}

describe('ContactPage', () => {
	it('renders with data-testid page-contact', () => {
		render(ContactPage);
		expect(screen.getByTestId('page-contact')).toBeTruthy();
	});

	it('renders the station label', () => {
		render(ContactPage);
		expect(screen.getByText(/CONTACT.*NEXT STOP/)).toBeTruthy();
	});

	it('renders info terminal', () => {
		render(ContactPage);
		// Both desktop and mobile render the snippet, so 2 instances
		const terminals = screen.getAllByTestId('contact-info-terminal');
		expect(terminals.length).toBeGreaterThanOrEqual(1);
	});

	it('renders form terminal', () => {
		render(ContactPage);
		const terminals = screen.getAllByTestId('contact-form-terminal');
		expect(terminals.length).toBeGreaterThanOrEqual(1);
	});

	it('renders all three form fields', () => {
		render(ContactPage);
		// Labels appear twice (desktop + mobile), so use getAllByLabelText
		expect(screen.getAllByLabelText(/^name/i).length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByLabelText(/^email/i).length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByLabelText(/^message/i).length).toBeGreaterThanOrEqual(1);
	});

	it('renders submit button', () => {
		render(ContactPage);
		const buttons = screen.getAllByRole('button', { name: /send/i });
		expect(buttons.length).toBeGreaterThanOrEqual(1);
	});

	it('renders social links', () => {
		render(ContactPage);
		expect(screen.getAllByTestId('contact-social-email').length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByTestId('contact-social-github').length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByTestId('contact-social-linkedin').length).toBeGreaterThanOrEqual(1);
	});

	it('email social uses mailto link', () => {
		render(ContactPage);
		const emailLinks = screen.getAllByTestId('contact-social-email');
		expect(emailLinks[0].getAttribute('href')).toMatch(/^mailto:/);
	});

	it('github social opens in new tab', () => {
		render(ContactPage);
		const ghLinks = screen.getAllByTestId('contact-social-github');
		expect(ghLinks[0].getAttribute('target')).toBe('_blank');
	});

	it('shows validation errors on empty submit', async () => {
		render(ContactPage);
		const submitBtns = screen.getAllByRole('button', { name: /send/i });
		await submitForm(submitBtns[0]);

		const errors = screen.getAllByText(/✗/);
		expect(errors.length).toBeGreaterThanOrEqual(3);
	});

	it('shows invalid email error for bad format', async () => {
		render(ContactPage);
		const nameInputs = screen.getAllByLabelText(/^name/i) as HTMLInputElement[];
		const emailInputs = screen.getAllByLabelText(/^email/i) as HTMLInputElement[];
		const messageInputs = screen.getAllByLabelText(/^message/i) as HTMLTextAreaElement[];

		await typeInto(nameInputs[0], 'Test');
		await typeInto(emailInputs[0], 'not-an-email');
		await typeInto(messageInputs[0], 'Hello');

		const submitBtns = screen.getAllByRole('button', { name: /send/i });
		await submitForm(submitBtns[0]);

		expect(screen.getAllByText(/invalid.*email/i).length).toBeGreaterThanOrEqual(1);
	});

	it('shows success state after valid submit', async () => {
		render(ContactPage);
		const nameInputs = screen.getAllByLabelText(/^name/i) as HTMLInputElement[];
		const emailInputs = screen.getAllByLabelText(/^email/i) as HTMLInputElement[];
		const messageInputs = screen.getAllByLabelText(/^message/i) as HTMLTextAreaElement[];

		await typeInto(nameInputs[0], 'Test User');
		await typeInto(emailInputs[0], 'test@example.com');
		await typeInto(messageInputs[0], 'Hello there');

		const submitBtns = screen.getAllByRole('button', { name: /send/i });
		await submitForm(submitBtns[0]);

		// Wait for typed sequence to complete (~150ms * 9 lines)
		await new Promise((r) => setTimeout(r, 2000));

		expect(screen.getAllByTestId('contact-success').length).toBeGreaterThanOrEqual(1);
	});

	it('displays weather when provided', () => {
		render(ContactPage, {
			props: { weather: { temp: 12, condition: 'partly cloudy', icon: '02d' } }
		});
		expect(screen.getAllByText(/12°C/).length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText(/partly cloudy/i).length).toBeGreaterThanOrEqual(1);
	});

	it('renders without weather gracefully', () => {
		render(ContactPage, { props: { weather: null } });
		expect(screen.queryAllByText(/°C/).length).toBe(0);
		expect(screen.getByTestId('page-contact')).toBeTruthy();
	});
});
