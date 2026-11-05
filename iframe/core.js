/* DeepPCB AI Autorouter - core state, storage and API client */
(function () {
	'use strict';

	var DP = window.DP || (window.DP = {});

	DP.VERSION = '1.0.0';
	DP.API_DEFAULT = 'https://api.deeppcb.ai/api/v1';
	DP.LINKS = {
		home: 'https://app.deeppcb.ai',
		integration: 'https://app.deeppcb.ai/integration',
		credits: 'https://app.deeppcb.ai/time-balance',
		boards: 'https://app.deeppcb.ai/boards',
	};

	var KEYS = {
		apiKey: 'deeppcb_api_key',
		apiBase: 'deeppcb_api_base',
		timeout: 'deeppcb_default_timeout',
		autoImport: 'deeppcb_auto_import',
		lang: 'deeppcb_lang',
		pending: 'deeppcb_pending_action',
		sessionPrefix: 'deeppcb_session_',
		history: 'deeppcb_history',
	};
	DP.KEYS = KEYS;

	DP.hasEda = function () {
		return typeof eda !== 'undefined' && !!eda;
	};

	DP.hasNetwork = function () {
		return DP.hasEda() && !!eda.sys_ClientUrl && typeof eda.sys_ClientUrl.request === 'function';
	};

	function storeGet(key) {
		try {
			if (DP.hasEda() && eda.sys_Storage) {
				return eda.sys_Storage.getExtensionUserConfig(key);
			}
		}
		catch (e) {
			/* fall through to localStorage */
		}
		try {
			return window.localStorage.getItem(key);
		}
		catch (e) {
			return null;
		}
	}

	function storeSet(key, value) {
		try {
			if (DP.hasEda() && eda.sys_Storage) {
				var result = eda.sys_Storage.setExtensionUserConfig(key, value);
				if (result && typeof result.catch === 'function') {
					return result.catch(function () {});
				}
				return result;
			}
		}
		catch (e) {
			/* fall through to localStorage */
		}
		try {
			window.localStorage.setItem(key, String(value));
		}
		catch (e) {
			/* ignore */
		}
	}

	DP.storeGet = storeGet;
	DP.storeSet = storeSet;

	function boolValue(value, fallback) {
		if (value === true || value === 'true' || value === 1 || value === '1') return true;
		if (value === false || value === 'false' || value === 0 || value === '0') return false;
		return fallback;
	}

	DP.cfg = {
		apiKey: '',
		apiBaseUrl: DP.API_DEFAULT,
		defaultTimeout: 45,
		autoImport: true,
	};

	DP.lang = (function () {
		var stored = storeGet(KEYS.lang);
		if (stored === 'zh' || stored === 'en') return stored;
		var nav = (navigator.language || '').toLowerCase();
		return nav.indexOf('zh') === 0 ? 'zh' : 'en';
	})();

	DP.loadConfig = function () {
		var key = storeGet(KEYS.apiKey);
		if (typeof key === 'string') DP.cfg.apiKey = key.trim();
		var base = storeGet(KEYS.apiBase);
		if (typeof base === 'string' && base.trim()) DP.cfg.apiBaseUrl = base.trim();
		var timeout = Number(storeGet(KEYS.timeout));
		if (isFinite(timeout) && timeout >= 5 && timeout <= 120) DP.cfg.defaultTimeout = Math.round(timeout);
		DP.cfg.autoImport = boolValue(storeGet(KEYS.autoImport), true);
	};

	DP.saveConfig = function () {
		storeSet(KEYS.apiKey, DP.cfg.apiKey);
		storeSet(KEYS.apiBase, DP.cfg.apiBaseUrl);
		storeSet(KEYS.timeout, String(DP.cfg.defaultTimeout));
		storeSet(KEYS.autoImport, DP.cfg.autoImport ? 'true' : 'false');
		storeSet(KEYS.lang, DP.lang);
	};

	/* ---------------- State ---------------- */

	DP.state = {
		project: null,
		pcb: null,
		projectName: '',
		projectUuid: 'default',
		pcbName: '',
		boardNameTouched: false,

		boardId: '',
		boardPid: '',
		boardName: '',
		board: null,
		status: '',
		previousStatus: '',
		revisions: [],
		latestRevision: null,
		selectedRevision: '',
		imported: null,
		lastSesFile: null,

		credits: null,
		keyValid: null,
		busy: false,
		importing: false,
		initializing: true,
		jobStartedHere: false,
		pollTimer: null,
		polling: false,
		lastTickAt: 0,
		ratingPrompted: false,
		sessionAvailable: false,
		sessionDismissed: false,
		activeTab: 'route',
		lastError: '',
		progress: { steps: [], index: 0, active: false, finished: false },
	};

	/* ---------------- Utilities ---------------- */

	DP.sleep = function (ms) {
		return new Promise(function (resolve) {
			window.setTimeout(resolve, ms);
		});
	};

	DP.withTimeout = function (promise, ms, message) {
		return new Promise(function (resolve, reject) {
			var settled = false;
			var timer = window.setTimeout(function () {
				if (settled) return;
				settled = true;
				reject(new Error(message || 'timeout'));
			}, ms);
			promise.then(
				function (value) {
					if (settled) return;
					settled = true;
					window.clearTimeout(timer);
					resolve(value);
				},
				function (error) {
					if (settled) return;
					settled = true;
					window.clearTimeout(timer);
					reject(error);
				},
			);
		});
	};

	DP.escapeHtml = function (value) {
		return String(value === undefined || value === null ? '' : value)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	};

	DP.safeName = function (value, fallback) {
		var name = String(value || '').trim().replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_');
		if (!name) name = fallback || 'board';
		return name.slice(0, 80);
	};

	DP.uid = function () {
		try {
			if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
		}
		catch (e) {
			/* ignore */
		}
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			var r = (Math.random() * 16) | 0;
			var v = c === 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	};

	DP.formatNumber = function (value) {
		var number = Number(value);
		if (!isFinite(number)) return '--';
		return number % 1 === 0 ? String(number) : number.toFixed(2);
	};

	DP.formatDate = function (value) {
		if (!value) return '';
		var date = new Date(value);
		if (isNaN(date.getTime())) return '';
		try {
			return date.toLocaleString(DP.lang === 'zh' ? 'zh-CN' : undefined, {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
			});
		}
		catch (e) {
			return date.toISOString();
		}
	};

	DP.formatDuration = function (seconds) {
		var total = Math.max(0, Math.round(seconds));
		var minutes = Math.floor(total / 60);
		var secs = total % 60;
		if (minutes <= 0) return DP.t('timeLeftFormat', 0, secs);
		if (secs === 0) return DP.t('timeLeftMin', minutes);
		return DP.t('timeLeftFormat', minutes, secs);
	};

	/* ---------------- Status helpers ---------------- */

	var ACTIVE = { Running: 1, ReceivingRevisions: 1, Starting: 1, StopRequested: 1, StopFailed: 1 };
	var PRE_RUN = { Pending: 1, Created: 1 };
	var TERMINAL = { Stopped: 1, Failed: 1, Done: 1 };

	DP.isActive = function (status) {
		return !!ACTIVE[status];
	};
	DP.isPreRun = function (status) {
		return !!PRE_RUN[status];
	};
	DP.isTerminal = function (status) {
		return !!TERMINAL[status];
	};
	DP.statusLabel = function (status) {
		var map = {
			Pending: 'statusPending',
			Created: 'statusCreated',
			Starting: 'statusStarting',
			Running: 'statusRunning',
			ReceivingRevisions: 'statusReceiving',
			Done: 'statusDone',
			Stopped: 'statusStopped',
			Failed: 'statusFailed',
			StopRequested: 'statusStopRequested',
			StopFailed: 'statusStopFailed',
		};
		return status ? DP.t(map[status] || 'statusUnknown') : DP.t('statusUnknown');
	};

	/* ---------------- Board model ---------------- */

	DP.workflowsOf = function (board) {
		if (!board) return [];
		if (Array.isArray(board.workflows) && board.workflows.length) return board.workflows;
		if (board.workflow) return [board.workflow];
		return [];
	};

	DP.revisionsOf = function (board) {
		var byNumber = {};
		DP.workflowsOf(board).forEach(function (workflow) {
			var list = Array.isArray(workflow.revisions) ? workflow.revisions : [];
			list.forEach(function (revision) {
				var number = Number(revision && revision.revisionNumber);
				if (!isFinite(number)) return;
				var createdOn = (revision.result && revision.result.createdOn) || revision.createdOn || '';
				var current = byNumber[number];
				if (!current || (createdOn && current.createdOn && createdOn > current.createdOn) || (!current.createdOn && createdOn)) {
					byNumber[number] = { revisionNumber: number, createdOn: createdOn };
				}
			});
		});
		return Object.keys(byNumber)
			.map(function (key) {
				return byNumber[key];
			})
			.sort(function (a, b) {
				return a.revisionNumber - b.revisionNumber;
			});
	};

	DP.activeWorkflow = function (board) {
		var workflows = DP.workflowsOf(board);
		if (!workflows.length) return null;
		for (var i = workflows.length - 1; i >= 0; i--) {
			if (workflows[i] && workflows[i].startedOn) return workflows[i];
		}
		return workflows[workflows.length - 1] || null;
	};

	DP.remainingSeconds = function (board) {
		var workflow = DP.activeWorkflow(board);
		if (!workflow || !workflow.startedOn) return null;
		var timeout = Number(workflow.workflowTimeOut || workflow.workflowTimeout);
		if (!isFinite(timeout) || timeout <= 0) return null;
		var started = new Date(workflow.startedOn);
		if (isNaN(started.getTime())) return null;
		var elapsed = (Date.now() - started.getTime()) / 1000;
		return Math.max(0, timeout * 60 - elapsed);
	};

	DP.applyBoard = function (board) {
		var state = DP.state;
		state.board = board || null;
		state.status = (board && board.boardStatus) || '';
		state.boardPid = (board && board.boardPId) || state.boardPid;
		state.revisions = DP.revisionsOf(board);
		state.latestRevision = state.revisions.length ? state.revisions[state.revisions.length - 1] : null;
		if (!state.selectedRevision && state.latestRevision) {
			state.selectedRevision = String(state.latestRevision.revisionNumber);
		}
		if (state.selectedRevision && !state.revisions.some(function (revision) {
			return String(revision.revisionNumber) === String(state.selectedRevision);
		})) {
			state.selectedRevision = state.latestRevision ? String(state.latestRevision.revisionNumber) : '';
		}
	};

	DP.isNewRevision = function (revision) {
		if (!revision) return false;
		var imported = DP.state.imported;
		if (!imported) return true;
		if (Number(imported.revision) !== Number(revision.revisionNumber)) {
			return Number(revision.revisionNumber) > Number(imported.revision);
		}
		if (imported.createdOn && revision.createdOn) return revision.createdOn > imported.createdOn;
		return false;
	};

	/* ---------------- Session and history ---------------- */

	DP.sessionKey = function () {
		return KEYS.sessionPrefix + (DP.state.projectUuid || 'default');
	};

	DP.sessionCache = {};

	DP.loadSession = function () {
		var key = DP.sessionKey();
		if (DP.sessionCache[key]) return DP.sessionCache[key];
		var raw = storeGet(key);
		if (!raw) return null;
		try {
			var data = typeof raw === 'string' ? JSON.parse(raw) : raw;
			if (!data || !data.boardId) return null;
			DP.sessionCache[key] = data;
			return data;
		}
		catch (e) {
			return null;
		}
	};

	DP.saveSession = function (patch) {
		var state = DP.state;
		if (!state.boardId) return;
		var previous = DP.loadSession() || {};
		var data = {
			boardId: state.boardId,
			boardPid: state.boardPid || previous.boardPid || '',
			boardName: state.boardName || previous.boardName || '',
			projectName: state.projectName || previous.projectName || '',
			projectUuid: state.projectUuid,
			status: state.status || previous.status || '',
			imported: state.imported || previous.imported || null,
			jobStartedHere: state.jobStartedHere || previous.jobStartedHere || false,
			updatedAt: new Date().toISOString(),
		};
		if (patch) {
			Object.keys(patch).forEach(function (key) {
				data[key] = patch[key];
			});
		}
		DP.sessionCache[DP.sessionKey()] = data;
		storeSet(DP.sessionKey(), JSON.stringify(data));
		if (!previous.boardId || previous.status !== data.status || previous.boardName !== data.boardName || previous.projectName !== data.projectName) {
			DP.upsertHistory(data);
		}
		return data;
	};

	DP.clearSession = function () {
		try {
			delete DP.sessionCache[DP.sessionKey()];
			if (DP.hasEda() && eda.sys_Storage && eda.sys_Storage.deleteExtensionUserConfig) {
				eda.sys_Storage.deleteExtensionUserConfig(DP.sessionKey());
				return;
			}
		}
		catch (e) {
			/* fall through */
		}
		try {
			window.localStorage.removeItem(DP.sessionKey());
		}
		catch (e) {
			/* ignore */
		}
	};

	DP.loadHistory = function () {
		var raw = storeGet(KEYS.history);
		if (!raw) return [];
		try {
			var list = typeof raw === 'string' ? JSON.parse(raw) : raw;
			if (!Array.isArray(list)) return [];
			return list.filter(function (item) {
				return item && item.boardId;
			});
		}
		catch (e) {
			return [];
		}
	};

	DP.upsertHistory = function (entry) {
		if (!entry || !entry.boardId) return;
		var list = DP.loadHistory().filter(function (item) {
			return item.boardId !== entry.boardId;
		});
		list.unshift({
			boardId: entry.boardId,
			boardPid: entry.boardPid || '',
			boardName: entry.boardName || '',
			projectName: entry.projectName || '',
			projectUuid: entry.projectUuid || '',
			status: entry.status || '',
			updatedAt: entry.updatedAt || new Date().toISOString(),
		});
		storeSet(KEYS.history, JSON.stringify(list.slice(0, 20)));
	};

	DP.clearHistory = function () {
		storeSet(KEYS.history, '[]');
	};

	/* ---------------- API client ---------------- */

	function networkMessage(error) {
		var text = String((error && error.message) || error || '');
		if (/CORS|Failed to fetch|NetworkError|Load failed|ERR_NETWORK/i.test(text)) return DP.t('corsError');
		if (/permission|external|not allowed|denied|权限|外部交互/i.test(text)) return DP.t('permissionError');
		return DP.t('networkError', text || 'unknown');
	}

	function apiUrl(path) {
		var base = String(DP.cfg.apiBaseUrl || DP.API_DEFAULT).replace(/\/+$/, '');
		return base + path;
	}

	DP.request = async function (path, options) {
		options = options || {};
		var url = apiUrl(path);
		if (options.query) {
			var params = new URLSearchParams();
			Object.keys(options.query).forEach(function (key) {
				if (options.query[key] !== undefined && options.query[key] !== null) params.set(key, String(options.query[key]));
			});
			var query = params.toString();
			if (query) url += (url.indexOf('?') >= 0 ? '&' : '?') + query;
		}

		var headers = { accept: '*/*' };
		if (DP.cfg.apiKey) headers['x-deeppcb-api-key'] = DP.cfg.apiKey;
		var body = options.body;
		var method = options.method || 'GET';

		if (options.json !== undefined) {
			body = JSON.stringify(options.json);
			headers['Content-Type'] = options.contentType || 'application/json';
		}
		else if (options.contentType) {
			headers['Content-Type'] = options.contentType;
		}

		var timeout = options.timeout || 45000;
		var response;
		try {
			if (DP.hasNetwork()) {
				response = await DP.withTimeout(
					eda.sys_ClientUrl.request(url, method, body, { headers: headers }),
					timeout,
					'timeout',
				);
			}
			else if (DP.hasEda()) {
				return {
					ok: false,
					status: 0,
					text: '',
					data: null,
					error: DP.t('apiNoticeNoNetwork'),
				};
			}
			else {
				response = await DP.withTimeout(
					fetch(url, { method: method, body: body, headers: headers }),
					timeout,
					'timeout',
				);
			}
		}
		catch (error) {
			if (String((error && error.message) || error).indexOf('timeout') >= 0) {
				return {
					ok: false,
					status: 408,
					text: '',
					data: null,
					error: DP.t('networkError', 'Request timed out.'),
				};
			}
			return { ok: false, status: 0, text: '', data: null, error: networkMessage(error) };
		}

		var text = '';
		try {
			text = await response.text();
		}
		catch (error) {
			text = '';
		}

		var data = null;
		try {
			data = text ? JSON.parse(text) : null;
		}
		catch (error) {
			data = null;
		}

		var ok = !!response.ok;
		var errorText = '';
		if (!ok) {
			errorText = (data && (data.errorMessage || data.message || data.error)) || text || ('HTTP ' + response.status);
			if (response.status === 401 || response.status === 403) errorText = DP.t('keyInvalid');
		}

		return {
			ok: ok,
			status: response.status,
			text: text,
			data: data,
			error: errorText,
		};
	};

	DP.getBalance = async function () {
		var response = await DP.request('/apiuser/credit-flow');
		if (!response.ok) return { ok: false, status: response.status, error: response.error };
		var raw = response.data && (response.data.balance !== undefined ? response.data.balance : response.data.data && response.data.data.balance);
		var balance = Number(raw);
		return { ok: isFinite(balance), status: response.status, balance: isFinite(balance) ? balance : null };
	};

	DP.getBoard = async function (boardId) {
		var response = await DP.request('/boards/' + encodeURIComponent(boardId));
		if (!response.ok) {
			return { ok: false, status: response.status, error: response.error };
		}
		var board = response.data && response.data.data ? response.data.data : response.data;
		if (!board || typeof board !== 'object') {
			return { ok: false, status: response.status, error: 'Invalid board response' };
		}
		return { ok: true, status: response.status, board: board };
	};

	DP.parseBoardId = function (text) {
		var value = String(text || '').trim();
		if (!value) return '';
		try {
			var parsed = JSON.parse(value);
			if (typeof parsed === 'string') return parsed.trim();
			if (parsed && typeof parsed === 'object') {
				return String(parsed.boardId || parsed.boardPId || parsed.id || parsed.value || '').trim();
			}
		}
		catch (e) {
			/* plain text response */
		}
		if (value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
			try {
				return JSON.parse(value);
			}
			catch (e) {
				/* ignore */
			}
		}
		return value.replace(/^"|"$/g, '');
	};

	DP.createBoard = async function (file, boardName, field, inputType) {
		var form = new FormData();
		form.append('boardName', boardName);
		form.append('boardInputType', inputType || 'Dsn');
		form.append(field || 'dsnFile', file, file.name || 'board.dsn');
		form.append('requestId', DP.uid());
		form.append('routingType', 'CurrentUnprotectedWiring');
		form.append('batch', '1');
		return DP.request('/boards', { method: 'POST', body: form, timeout: 180000 });
	};

	DP.submitBoard = function (boardId, timeout) {
		return DP.request('/boards/' + encodeURIComponent(boardId) + '/confirm', {
			method: 'PATCH',
			contentType: 'application/json-patch+json',
			json: {
				timeout: timeout,
				maxBatchTimeout: 30,
				timeToLive: 300,
				maxInactivityWaitTimeout: 60,
				jobType: 'Routing',
			},
			timeout: 60000,
		});
	};

	DP.stopBoard = function (boardId) {
		return DP.request('/boards/' + encodeURIComponent(boardId) + '/stop', {
			method: 'PATCH',
			contentType: 'application/json-patch+json',
			timeout: 60000,
		});
	};

	DP.resumeBoard = function (boardId, timeout) {
		return DP.request('/boards/' + encodeURIComponent(boardId) + '/resume', {
			method: 'PATCH',
			contentType: 'application/json-patch+json',
			json: {
				timeout: timeout,
				maxBatchTimeout: 30,
				timeToLive: 300,
				responseBoardFormat: 1,
				jobType: 'Routing',
			},
			timeout: 60000,
		});
	};

	DP.downloadArtifact = function (boardId, revisionNumber, type) {
		return DP.request('/boards/' + encodeURIComponent(boardId) + '/revision-artifact', {
			query: {
				revision: revisionNumber,
				type: type || 'SesFile',
				revisionType: 'Tidy',
			},
			timeout: 120000,
		});
	};

	DP.rateBoard = function (boardId, speed, drc, solution, feedback) {
		return DP.request('/boards/' + encodeURIComponent(boardId) + '/rating', {
			method: 'PUT',
			json: {
				speedRating: speed,
				drcRating: drc,
				solutionRating: solution,
				feedback: feedback,
			},
			timeout: 60000,
		});
	};

	DP.pollBoardUntil = async function (boardId, predicate, options) {
		options = options || {};
		var interval = options.interval || 1200;
		var timeout = options.timeout || 90000;
		var started = Date.now();
		var last = null;
		while (Date.now() - started < timeout) {
			var result = await DP.getBoard(boardId);
			if (result.ok) {
				last = result.board;
				if (options.onTick) options.onTick(result.board);
				if (predicate(result.board)) return { ok: true, board: result.board };
			}
			else if (options.onError) {
				options.onError(result);
			}
			await DP.sleep(interval);
		}
		return { ok: false, board: last, error: 'timeout' };
	};
})();
