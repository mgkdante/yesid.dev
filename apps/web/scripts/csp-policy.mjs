/**
 * @param {{ themeScriptHash: `sha256-${string}`; vercelEnv?: string }} options
 * @returns {NonNullable<import('@sveltejs/kit/vite').Config['csp']>['directives']}
 */
export function createCspDirectives({ themeScriptHash, vercelEnv }) {
	const preview = vercelEnv === 'preview';
	return {
		'default-src': ['self'],
		// Cloudflare's proxy injects its Web Analytics beacon; it reports to the same-origin /cdn-cgi/rum.
		'script-src': ['self', themeScriptHash, 'https://static.cloudflareinsights.com', ...(preview ? /** @type {const} */ (['https://vercel.live']) : [])],
		'style-src': ['self', 'unsafe-inline', ...(preview ? /** @type {const} */ (['https://vercel.live']) : [])],
		'img-src': ['self', 'data:', 'blob:', 'https://i.ytimg.com', ...(preview ? /** @type {const} */ (['https://vercel.live', 'https://vercel.com']) : [])],
		'font-src': ['self', 'data:', ...(preview ? /** @type {const} */ (['https://vercel.live', 'https://assets.vercel.com']) : [])],
		'connect-src': [
			'self',
			'https://plausible.io',
			'https://api.web3forms.com',
			'https://transit.yesid.dev',
			...(preview ? /** @type {const} */ (['https://vercel.live', 'wss://ws-us3.pusher.com']) : []),
		],
		'manifest-src': ['self'],
		'frame-src': ['https://www.youtube-nocookie.com', ...(preview ? /** @type {const} */ (['https://vercel.live']) : [])],
		'frame-ancestors': ['none'],
		'object-src': ['none'],
		'base-uri': ['self'],
		'form-action': ['self'],
	};
}
