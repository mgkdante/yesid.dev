import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Window } from 'happy-dom';
import { hashScript, hashThemeScript } from './csp-script-hash.mjs';

const THEME_SCRIPT_HASH = `'${hashThemeScript(readFileSync(new URL('../src/app.html', import.meta.url), 'utf8'))}'`;

export const CONNECT_SOURCES = [
	"'self'",
	'https://plausible.io',
	'https://api.web3forms.com',
	'https://transit.yesid.dev',
];

export function scriptHash(source: string): string {
	return `'${hashScript(source)}'`;
}

/** Parse HTML without executing scripts or fetching any resources. */
export function checkHtml(html: string): string[] {
	const window = new Window({
		settings: {
			enableJavaScriptEvaluation: false,
			disableJavaScriptFileLoading: true,
			enableCSSFileLoading: false,
			enableImageFileLoading: false,
		},
	});
	try {
		const document = new window.DOMParser().parseFromString(html, 'text/html');
		const errors: string[] = [];
		const metas = [...document.querySelectorAll('meta[http-equiv]')].filter(
			(meta) => meta.getAttribute('http-equiv')?.toLowerCase() === 'content-security-policy',
		);
		if (metas.length !== 1) {
			errors.push(`expected exactly one CSP meta, found ${metas.length}`);
		}
		const meta = metas[0];
		if (meta && !document.head.contains(meta)) {
			errors.push('CSP meta must be inside <head>');
		}
		const directives = new Map<string, string[]>();
		for (const directive of (metas[0]?.getAttribute('content') ?? '').split(';')) {
			const [name, ...sources] = directive.trim().split(/\s+/);
			if (!name) continue;
			if (directives.has(name)) errors.push(`duplicate CSP directive: ${name}`);
			directives.set(name, sources);
		}
		for (const name of ['script-src-elem', 'script-src-attr']) {
			if (directives.has(name)) errors.push(`${name} must not override script-src`);
		}
		const connect = directives.get('connect-src') ?? [];
		if (
			connect.length !== CONNECT_SOURCES.length ||
			!CONNECT_SOURCES.every((source) => connect.includes(source))
		) {
			errors.push(`connect-src must equal ${CONNECT_SOURCES.join(' ')} (found ${connect.join(' ') || 'none'})`);
		}
		const scripts = directives.get('script-src') ?? [];
		let preMetaScripts = 0;
		for (const [index, script] of [...document.querySelectorAll('script')].entries()) {
			const type = script.getAttribute('type')?.trim().toLowerCase() ?? '';
			if (['application/ld+json', 'application/json'].includes(type)) continue;
			const hash = script.hasAttribute('src') ? null : scriptHash(script.textContent);
			if (meta && !(meta.compareDocumentPosition(script) & window.Node.DOCUMENT_POSITION_FOLLOWING)) {
				preMetaScripts++;
				if (hash !== THEME_SCRIPT_HASH) {
					errors.push(`CSP meta must precede executable script ${index + 1} unless it matches the app.html theme script`);
				}
				if (preMetaScripts > 1) errors.push('more than one executable script precedes the CSP meta');
			}
			if (hash === null) continue;
			if (!scripts.includes(hash)) errors.push(`inline script ${index + 1} missing script-src hash ${hash}`);
		}
		for (const element of document.querySelectorAll('*')) {
			for (const attribute of element.attributes) {
				if (/^on/i.test(attribute.name)) {
					errors.push(`inline event handler ${attribute.name} on <${element.localName}>`);
				}
			}
		}
		return errors;
	} finally {
		window.close();
	}
}

function htmlFiles(directory: string): string[] {
	if (!existsSync(directory)) return [];
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name);
		return entry.isDirectory() ? htmlFiles(path) : entry.name.endsWith('.html') ? [path] : [];
	});
}

export function checkBuild(root = process.cwd()): boolean {
	const files = [
		...htmlFiles(resolve(root, '.svelte-kit/output/prerendered/pages')),
		...htmlFiles(resolve(root, '.vercel/output/static')),
	];
	if (files.length === 0) {
		console.error('FAIL: no prerendered HTML found; run the web build first');
		return false;
	}
	let failures = 0;
	for (const file of files) {
		try {
			for (const error of checkHtml(readFileSync(file, 'utf8'))) {
				console.error(`FAIL: ${relative(root, file)}: ${error}`);
				failures++;
			}
		} catch (error) {
			console.error(`FAIL: ${relative(root, file)}: ${String(error)}`);
			failures++;
		}
	}
	if (failures > 0) return false;
	console.log(`OK: CSP checks pass for ${files.length} prerendered HTML files`);
	return true;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	if (!checkBuild()) process.exitCode = 1;
}
