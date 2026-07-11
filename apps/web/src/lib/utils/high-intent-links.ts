const APPROVED_WHATSAPP_HOSTS = new Set(['wa.me']);

function parseAbsoluteUrl(href: string): URL | null {
	const value = href.trim();
	if (!value) return null;

	try {
		return new URL(value);
	} catch {
		return null;
	}
}

export function isDirectContactHref(href: string): boolean {
	const url = parseAbsoluteUrl(href);
	if (!url) return false;

	if (url.protocol === 'mailto:') {
		return url.pathname.includes('@');
	}

	if (url.protocol === 'tel:') {
		return /\d/.test(url.pathname);
	}

	return (
		url.protocol === 'https:' &&
		url.port === '' &&
		APPROVED_WHATSAPP_HOSTS.has(url.hostname) &&
		url.pathname !== '/'
	);
}

export function isProjectProofHref(href: string): boolean {
	const url = parseAbsoluteUrl(href);
	if (!url || url.username || url.password) return false;

	return (
		(url.protocol === 'https:' || url.protocol === 'http:') &&
		url.hostname.length > 0
	);
}
