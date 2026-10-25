/**
 * @param {{ themeScriptHash: `sha256-${string}`; vercelEnv?: string }} options
 * @returns {NonNullable<import('@sveltejs/kit/vite').Config['csp']>['directives']}
 */
export function createCspDirectives({ themeScriptHash, vercelEnv }) {
	const preview = vercelEnv === 'preview';
	return {
		'default-src': ['self'],
		'script-src': ['self', themeScriptHash, ...(preview ? /** @type {const} */ (['https://vercel.live']) : [])],
		'style-src': ['self', 'unsafe-inline', ...(preview ? /** @type {const} */ (['https://vercel.live']) : [])],
		'img-src': ['self', 'data:', 'blob:', ...(preview ? /** @type {const} */ (['https://vercel.live', 'https://vercel.com']) : [])],
		'font-src': ['self', 'data:', ...(preview ? /** @type {const} */ (['https://vercel.live', 'https://assets.vercel.com']) : [])],
		'connect-src': [
			'self',
			'https://plausible.io',
			'https://api.web3forms.com',
			'https://transit.yesid.dev',
			...(preview ? /** @type {const} */ (['https://vercel.live', 'wss://ws-us3.pusher.com']) : []),
		],
		'manifest-src': ['self'],
		'frame-src': preview ? ['https://vercel.live'] : ['none'],
		'frame-ancestors': ['none'],
		'object-src': ['none'],
		'base-uri': ['self'],
		'form-action': ['self'],
	};
}
