/**
 * DeepPCB remote CORS relay for Cloudflare Workers.
 *
 * Use this when you cannot change DeepPCB's CORS policy and do not want to run
 * a process on your machine. Deploy it to your own Cloudflare account, then set
 * the extension's API base URL to:
 *
 *   https://<your-worker>.workers.dev/api/v1
 *
 * WARNING: the Worker forwards the x-deeppcb-api-key header, so the Worker sees
 * your key. Deploy your own instance, keep the URL private, and do not use a
 * shared/public deployment.
 *
 * True direct access (without any relay) requires DeepPCB to allowlist the
 * EasyEDA origin, e.g. https://pro.lceda.cn, in its server CORS policy.
 */

const UPSTREAM = 'https://api.deeppcb.ai';

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, HEAD, PUT, PATCH, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'accept, authorization, content-type, x-client-type, x-deeppcb-api-key',
	'Access-Control-Expose-Headers': '*',
	'Access-Control-Max-Age': '86400',
	'Vary': 'Origin',
};

export default {
	async fetch(request) {
		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: CORS_HEADERS });
		}

		const incoming = new URL(request.url);
		const target = new URL(incoming.pathname + incoming.search, UPSTREAM);

		const headers = new Headers(request.headers);
		headers.delete('host');
		headers.delete('origin');
		headers.delete('referer');

		const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
		const upstream = await fetch(target, {
			method: request.method,
			headers,
			body: hasBody ? request.body : undefined,
		});

		const responseHeaders = new Headers(upstream.headers);
		for (const [name, value] of Object.entries(CORS_HEADERS)) {
			responseHeaders.set(name, value);
		}

		return new Response(upstream.body, {
			status: upstream.status,
			headers: responseHeaders,
		});
	},
};
