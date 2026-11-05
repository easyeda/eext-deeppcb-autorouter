/**
 * DeepPCB AI Autorouter - EasyEDA Pro extension entry.
 *
 * The extension itself is intentionally thin: every menu action opens (or
 * focuses) the dashboard inline frame, which owns the DeepPCB client, the
 * project export, the routing job lifecycle and the SES import.
 */
import extensionConfig from '../extension.json' with { type: 'json' };

const IFRAME_ID = 'deeppcb-dashboard';
const IFRAME_HTML = '/iframe/index.html';
const IFRAME_WIDTH = 840;
const IFRAME_HEIGHT = 780;

/** Written before the dashboard opens so a fresh frame can act on the menu intent. */
const PENDING_ACTION_KEY = 'deeppcb_pending_action';
/** Public message-bus topic used to talk to an already-open dashboard. */
const COMMAND_TOPIC = 'deeppcb-command';

type DashboardAction = 'open' | 'new' | 'settings';

// eslint-disable-next-line unused-imports/no-unused-vars
export function activate(status?: 'onStartupFinished', arg?: string): void {}

/**
 * Open the dashboard, or bring it to the front when it is already open.
 *
 * `showIFrame` returns `false` for an id that does not exist, so a failed
 * focus is the signal to create the window. The pending action is consumed by
 * the dashboard on load; an already-open dashboard gets the same intent over
 * the public message bus.
 */
async function openDashboard(action: DashboardAction = 'open'): Promise<void> {
	try {
		await eda.sys_Storage.setExtensionUserConfig(PENDING_ACTION_KEY, action);
	}
	catch {
		// Storage is best-effort: the dashboard still opens without it.
	}

	let focused = false;
	try {
		focused = await eda.sys_IFrame.showIFrame(IFRAME_ID);
	}
	catch {
		focused = false;
	}

	if (focused) {
		if (action !== 'open') {
			try {
				eda.sys_MessageBus.publishPublic(COMMAND_TOPIC, { action });
			}
			catch {
				// The dashboard also polls the pending action from storage.
			}
		}
		return;
	}

	await eda.sys_IFrame.openIFrame(IFRAME_HTML, IFRAME_WIDTH, IFRAME_HEIGHT, IFRAME_ID, {
		title: eda.sys_I18n.text('DeepPCB AI Autorouter'),
		maximizeButton: false,
		minimizeButton: true,
		minimizeStyle: 'constricted',
	});
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

/** Menu: about dialog. */
export function about(): void {
	eda.sys_Dialog.showInformationMessage(
		eda.sys_I18n.text(
			// eslint-disable-next-line no-template-curly-in-string
			'DeepPCB AI Autorouter v${1}\n\nRoute your PCB automatically with the DeepPCB cloud AI engine.\n\nAPI key: https://app.deeppcb.ai/integration\nProject page: https://app.deeppcb.ai\n\nThis extension is an unofficial EasyEDA Pro port of the open-source DeepPCB KiCad plugin (Apache-2.0).',
			undefined,
			undefined,
			extensionConfig.version,
		),
		eda.sys_I18n.text('DeepPCB AI Autorouter'),
	);
}
