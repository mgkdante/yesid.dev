export const ROBOTS_TAG = 'noindex, nofollow, noarchive';
export const ROBOTS_BODY = 'User-agent: *\nDisallow: /\n';

export function noindexMiddleware(request, response, next) {
	response.setHeader('X-Robots-Tag', ROBOTS_TAG);

	if (request.path !== '/robots.txt') {
		next();
		return;
	}

	response.setHeader('Content-Type', 'text/plain; charset=utf-8');
	response.setHeader('Cache-Control', 'no-store');
	response.status(200).send(ROBOTS_BODY);
}

export default ({ init }) => {
	init('middlewares.before', ({ app }) => {
		app.use(noindexMiddleware);
	});
};
