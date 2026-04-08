import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Actions } from './$types.js';

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString().trim() ?? '';
		const email = data.get('email')?.toString().trim() ?? '';
		const message = data.get('message')?.toString().trim() ?? '';

		// Server-side validation
		const errors: Record<string, string> = {};
		if (!name) errors.name = 'Name is required';
		if (!email) errors.email = 'Email is required';
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email format';
		if (!message) errors.message = 'Message is required';

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors, name, email, message });
		}

		// Send via Web3Forms
		const apiKey = env.WEB3FORMS_ACCESS_KEY;
		if (!apiKey) {
			console.error('WEB3FORMS_ACCESS_KEY not set');
			return fail(500, {
				errors: { form: 'Contact form is not configured. Please email directly.' },
				name,
				email,
				message
			});
		}

		try {
			const res = await fetch('https://api.web3forms.com/submit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					access_key: apiKey,
					subject: `New contact from ${name} via yesid.dev`,
					from_name: name,
					email,
					message
				})
			});

			const result = await res.json();

			if (!result.success) {
				return fail(500, {
					errors: { form: 'Failed to send message. Please try again.' },
					name,
					email,
					message
				});
			}
		} catch {
			return fail(500, {
				errors: { form: 'Failed to send message. Please try again.' },
				name,
				email,
				message
			});
		}

		return { success: true };
	}
} satisfies Actions;
