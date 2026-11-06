/**
 * DeepPCB AI Autorouter - EasyEDA Pro extension entry.
 *
 * The extension itself is intentionally thin: every menu action opens the
 * dashboard inline frame, which owns the DeepPCB client, the PCB export, the
 * routing job lifecycle and the SES import.
 */

const IFRAME_ID = 'deeppcb-dashboard';
const IFRAME_HTML = '/iframe/index.html';
const IFRAME_WIDTH = 600;
const IFRAME_HEIGHT = 720;

/** Written before the dashboard opens so a fresh frame can act on the menu intent. */
const PENDING_ACTION_KEY = 'deeppcb_pending_action';

type DashboardAction = 'open' | 'new' | 'settings';

// eslint-disable-next-line unused-imports/no-unused-vars
export function activate(status?: 'onStartupFinished', arg?: string): void {}

/**
 * Open a fresh dashboard window.
 *
 * Always close the previous frame first: an iframe loaded by an older build
 * (or reloaded in place) can keep the same id but no longer have the injected
 * `eda` object. Re-creating it guarantees the current HTML and a working API.
 */
async function openDashboard(action: DashboardAction = 'open'): Promise<void> {
	try {
		eda.sys_Storage.setExtensionUserConfig(PENDING_ACTION_KEY, action);
	}
	catch {
		// Storage is best-effort: the dashboard still opens without it.
	}

	let existing = false;
	try {
		if (typeof eda.sys_IFrame.isIFrameAlreadyExist === 'function') {
			existing = await eda.sys_IFrame.isIFrameAlreadyExist(IFRAME_ID);
		}
	}
	catch {
		existing = false;
	}

	if (existing) {
		try {
			await Promise.race([
				eda.sys_IFrame.closeIFrame(IFRAME_ID),
				new Promise<void>((resolve) => {
					setTimeout(resolve, 800);
				}),
			]);
		}
		catch {
			// The frame is already gone.
		}
	}

	const openIFrame = (): Promise<boolean> => eda.sys_IFrame.openIFrame(IFRAME_HTML, IFRAME_WIDTH, IFRAME_HEIGHT, IFRAME_ID, {
		title: eda.sys_I18n.text('DeepPCB AI Autorouter'),
		maximizeButton: false,
		minimizeButton: true,
		minimizeStyle: 'constricted',
	});

	let lastError: unknown = null;
	try {
		const opened = await openIFrame();
		if (opened) {
			return;
		}
		lastError = new Error('openIFrame returned false');
	}
	catch (error) {
		lastError = error;
	}

	// A dialog may still be registered under this id even though the query
	// above failed (older engines). Try one clean close-and-reopen.
	try {
		await eda.sys_IFrame.closeIFrame(IFRAME_ID);
		const retried = await openIFrame();
		if (retried) {
			return;
		}
		lastError = new Error('openIFrame returned false after retry');
	}
	catch (error) {
		lastError = error;
	}

	try {
		eda.sys_Dialog.showInformationMessage(
			eda.sys_I18n.text(
				// eslint-disable-next-line no-template-curly-in-string
				'Cannot open the DeepPCB window: ${1}\n\nMake sure the extension is enabled and the iframe files are present.',
				undefined,
				undefined,
				lastError instanceof Error ? lastError.message : String(lastError),
			),
			eda.sys_I18n.text('DeepPCB AI Autorouter'),
		);
	}
	catch {
		// Nothing else we can do if even the dialog API is unavailable.
	}
}

/** Menu: open the dashboard. */
export function openDeepPcb(): void {
	void openDashboard('open');
}

/** Menu: open the dashboard on the "new routing job" form. */
export function newRoutingJob(): void {
	void openDashboard('new');
}

/** Menu: open the dashboard settings. */
export function openSettings(): void {
	void openDashboard('settings');
}
