import { Buffer } from 'node:buffer';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import JSZip from 'jszip';

/**
 * Build tools/deeppcb-proxy.zip:
 *   deeppcb-proxy.mjs, start-proxy.bat, start-proxy.ps1, start-proxy.sh,
 *   start-proxy.command, README.txt
 *
 * The Windows entry points get CRLF line endings; the shell scripts keep LF
 * and are marked executable so macOS/Linux keep the bit after unzipping.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const bundleDir = path.join(rootDir, 'tools/proxy-bundle');
const proxyPath = path.join(rootDir, 'tools/deeppcb-proxy.mjs');
const outputPath = path.join(rootDir, 'tools/deeppcb-proxy.zip');

function toCrlf(buffer) {
	return Buffer.from(buffer.toString('utf8').replace(/\r?\n/g, '\r\n'), 'utf8');
}

async function main() {
	const zip = new JSZip();
	zip.file('deeppcb-proxy.mjs', await fs.readFile(proxyPath));

	const entries = await fs.readdir(bundleDir);
	for (const entry of entries) {
		const fullPath = path.join(bundleDir, entry);
		const stat = await fs.stat(fullPath);
		if (!stat.isFile()) {
			continue;
		}

		let data = await fs.readFile(fullPath);
		if (/\.(?:bat|ps1|txt)$/i.test(entry)) {
			data = toCrlf(data);
		}

		const options = {};
		if (/\.(?:sh|command)$/i.test(entry)) {
			options.unixPermissions = '755';
		}
		zip.file(entry, data, options);
	}

	const buffer = await zip.generateAsync({
		type: 'nodebuffer',
		compression: 'DEFLATE',
		compressionOptions: { level: 9 },
		platform: 'UNIX',
	});

	await fs.writeFile(outputPath, buffer);
	console.log(`[proxy] ${path.relative(rootDir, outputPath)} (${buffer.length} bytes)`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
