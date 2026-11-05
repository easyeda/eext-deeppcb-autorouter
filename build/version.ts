import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

/**
 * Package versioning:
 *   0.0.1 -> 0.0.2 -> ... -> 0.0.30 -> 0.1.0 -> ...
 *
 * Every `npm run build` increments the patch. After 30 patch steps the minor
 * is incremented and the patch resets to 0. The same 30-step rule rolls the
 * minor into the major.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const extensionPath = path.join(rootDir, 'extension.json');
const packagePath = path.join(rootDir, 'package.json');
const lockPath = path.join(rootDir, 'package-lock.json');

function nextVersion(current: string): string {
	const parts = String(current || '0.0.0').split('.').map(Number);
	if (parts.length !== 3 || parts.some(part => !Number.isInteger(part) || part < 0)) {
		return '0.0.1';
	}
	let [major, minor, patch] = parts;
	patch += 1;
	if (patch > 30) {
		patch = 0;
		minor += 1;
		if (minor > 30) {
			minor = 0;
			major += 1;
		}
	}
	return `${major}.${minor}.${patch}`;
}

async function main(): Promise<void> {
	const extension = await fs.readJson(extensionPath);
	const current = String(extension.version || '0.0.0');
	const version = nextVersion(current);

	extension.version = version;
	await fs.writeJson(extensionPath, extension, { spaces: '\t', EOL: '\n' });

	const packageJson = await fs.readJson(packagePath);
	packageJson.version = version;
	await fs.writeJson(packagePath, packageJson, { spaces: '\t', EOL: '\n' });

	if (await fs.pathExists(lockPath)) {
		const lock = await fs.readJson(lockPath);
		lock.version = version;
		if (lock.packages && lock.packages['']) {
			lock.packages[''].version = version;
		}
		await fs.writeJson(lockPath, lock, { spaces: '\t', EOL: '\n' });
	}

	console.log(`[version] ${current} -> ${version}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
