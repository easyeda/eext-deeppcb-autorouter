#!/usr/bin/env node
/**
 * DeepPCB local CORS proxy.
 *
 * The DeepPCB API only allows browser requests from https://app.deeppcb.ai.
 * EasyEDA extensions run on https://pro.lceda.cn, so direct fetch() calls are
 * blocked by CORS. This tiny proxy forwards requests to the DeepPCB API and
 * adds the CORS headers the browser needs.
 *
 *   node tools/deeppcb-proxy.mjs
 *
 * Then set the extension's "API base URL" to:
 *   http://127.0.0.1:8787/api/v1
 *
 * Environment variables:
 *   PORT             listen port (default 8787)
 *   HOST             listen host (default 127.0.0.1)
 *   DEEPPCB_TARGET   upstream origin (default https://api.deeppcb.ai)
 *   ALLOW_ORIGIN     CORS allow-origin value (default *)
 *
 * The proxy binds to loopback only and does not store your API key. Stop it
 * when you are done. Do not expose it on a public interface.
 */
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const TARGET = (process.env.DEEPPCB_TARGET || 'https://api.deeppcb.ai').replace(/\/+$/, '');
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || '*';

const CORS_HEADERS = {
	'access-control-allow-origin': ALLOW_ORIGIN,
	'access-control-allow-methods': 'GET, POST, HEAD, PUT, PATCH, DELETE, OPTIONS',
	'access-control-allow-headers': 'accept, authorization, content-type, x-client-type, x-deeppcb-api-key',
	'access-control-expose-headers': '*',
	'access-control-max-age': '86400',
	'vary': 'Origin',
};

const HOP_BY_HOP = new Set([
	'connection',
	'keep-alive',
	'proxy-authenticate',
	'proxy-authorization',
	'te',
	'trailer',
	'transfer-encoding',
	'upgrade',
]);

function sendJson(response, status, payload) {
	response.writeHead(status, {
		...CORS_HEADERS,
		'content-type': 'application/json; charset=utf-8',
	});
	response.end(JSON.stringify(payload));
}

const server = http.createServer((request, response) => {
	if (request.method === 'OPTIONS') {
		response.writeHead(204, CORS_HEADERS);
		response.end();
		return;
	}

	if (request.url === '/__health') {
		sendJson(response, 200, { ok: true, target: TARGET });
		return;
	}

	let target;
	try {
		target = new URL(request.url || '/', `${TARGET}/`);
	}
	catch {
		sendJson(response, 400, { errorMessage: 'Invalid request URL.' });
		return;
	}

	const headers = {};
	for (const [name, value] of Object.entries(request.headers)) {
		if (HOP_BY_HOP.has(name) || name === 'host' || name === 'origin' || name === 'referer') continue;
		headers[name] = value;
	}
	headers.host = target.host;

	const transport = target.protocol === 'http:' ? http : https;
	const upstream = transport.request(
		target,
		{
			method: request.method,
			headers,
		},
		(upstreamResponse) => {
			const responseHeaders = { ...upstreamResponse.headers, ...CORS_HEADERS };
			for (const name of HOP_BY_HOP) delete responseHeaders[name];
			response.writeHead(upstreamResponse.statusCode || 502, responseHeaders);
			upstreamResponse.pipe(response);
			console.log(`${request.method} ${target.pathname}${target.search} -> ${upstreamResponse.statusCode}`);
		},
	);

	upstream.on('error', (error) => {
		console.error(`proxy error: ${error.message}`);
		if (!response.headersSent) {
			sendJson(response, 502, {
				errorMessage: `Could not reach ${TARGET}: ${error.message}`,
			});
		}
		else {
			response.end();
		}
	});

	request.pipe(upstream);
});

server.on('error', (error) => {
	console.error(`Failed to listen on ${HOST}:${PORT}: ${error.message}`);
	process.exitCode = 1;
});

server.listen(PORT, HOST, () => {
	console.log('');
	console.log('  DeepPCB local CORS proxy');
	console.log(`  listening   http://${HOST}:${PORT}`);
	console.log(`  forwarding  ${TARGET}`);
	console.log('');
	console.log('  In EasyEDA: DeepPCB → Settings → API base URL');
	console.log(`  set it to:  http://${HOST}:${PORT}/api/v1`);
	console.log('');
	console.log('  Keep this window open while using the extension. Ctrl+C to stop.');
	console.log('');
});

function shutdown() {
	server.close(() => process.exit(0));
	// Do not leave sockets hanging if an upload is in progress.
	setTimeout(() => process.exit(0), 1500).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
