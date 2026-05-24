// Ambient type declaration for Vite's `?inline` import suffix on .ttf files.
// Vite returns the file contents as a base64 data URL string.
declare module '*.ttf?inline' {
	const dataUrl: string;
	export default dataUrl;
}
