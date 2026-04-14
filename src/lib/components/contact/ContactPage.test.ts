import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import ContactPage from './ContactPage.svelte';

/**
 * Svelte 5 bind:value listens to the native `input` event and reads `el.value`.
 * We must set `el.value` directly on the DOM node before dispatching the event,
 * then flush with two ticks: the first for the bind handler's `await tick()`,
 * the second for any follow-up render_effects that depend on the new state.
 */
async function typeInto(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
	el.value = value;
	await fireEvent.input(el);
	await tick();
	await tick();
}

/**
 * Fire submit on the form element directly.
 * fireEvent.click(submitBtn) does not reliably trigger onsubmit in jsdom
 * for Svelte 5 components — using fireEvent.submit(form) is required.
 */
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
		expect(screen.getByTestId('contact-info-terminal')).toBeTruthy();
	});

	it('renders form terminal', () => {
		render(ContactPage);
		expect(screen.getByTestId('contact-form-terminal')).toBeTruthy();
	});

	it('renders all three form fields', () => {
		render(ContactPage);
		expect(screen.getByLabelText(/name/i)).toBeTruthy();
		expect(screen.getByLabelText(/email/i)).toBeTruthy();
		expect(screen.getByLabelText(/message/i)).toBeTruthy();
	});

	it('renders submit button', () => {
		render(ContactPage);
		expect(screen.getByRole('button', { name: /send/i })).toBeTruthy();
	});

	it('renders social links', () => {
		render(ContactPage);
		expect(screen.getByTestId('contact-social-email')).toBeTruthy();
		expect(screen.getByTestId('contact-social-github')).toBeTruthy();
		expect(screen.getByTestId('contact-social-linkedin')).toBeTruthy();
	});

	it('email social uses mailto link', () => {
		render(ContactPage);
		const emailLink = screen.getByTestId('contact-social-email');
		expect(emailLink.getAttribute('href')).toMatch(/^mailto:/);
	});

	it('github social opens in new tab', () => {
		render(ContactPage);
		const ghLink = screen.getByTestId('contact-social-github');
		expect(ghLink.getAttribute('target')).toBe('_blank');
	});

	it('shows validation errors on empty submit', async () => {
		render(ContactPage);
		const submitBtn = screen.getByRole('button', { name: /send/i });
		await submitForm(submitBtn);

		const errors = screen.getAllByText(/✗/);
		expect(errors.length).toBeGreaterThanOrEqual(3);
	});

	it('shows invalid email error for bad format', async () => {
		render(ContactPage);
		const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
		const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
		const messageInput = screen.getByLabelText(/message/i) as HTMLTextAreaElement;

		await typeInto(nameInput, 'Test');
		await typeInto(emailInput, 'not-an-email');
		await typeInto(messageInput, 'Hello');

		await submitForm(screen.getByRole('button', { name: /send/i }));

		expect(screen.getByText(/invalid.*email/i)).toBeTruthy();
	});

	it('shows success state after valid submit', async () => {
		render(ContactPage);
		const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
		const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
		const messageInput = screen.getByLabelText(/message/i) as HTMLTextAreaElement;

		await typeInto(nameInput, 'Test User');
		await typeInto(emailInput, 'test@example.com');
		await typeInto(messageInput, 'Hello there');

		await submitForm(screen.getByRole('button', { name: /send/i }));

		// Wait for typed sequence to complete (~150ms * 9 lines)
		await new Promise((r) => setTimeout(r, 2000));

		expect(screen.getByTestId('contact-success')).toBeTruthy();
	});
});
