// Keep the endpoint on the lambda so its CDN cache headers survive.
export const prerender = false;
export { fourAiToolsRedirect as GET } from '#lib/server/four-ai-tools-redirect.ts';
