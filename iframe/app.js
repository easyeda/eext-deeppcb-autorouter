/* DeepPCB AI Autorouter - project context, job flow, polling and import */
(function () {
	'use strict';

	var DP = window.DP || (window.DP = {});
	var S = DP.state;
	var $ = DP.$;

	function toast(message, type) {
		DP.toast(message, type);
	}

	function errorText(error) {
		return String((error && error.message) || error || 'unknown');
	}

	function apiError(message, response) {
		var error = new Error(message);
		error.response = response;
		return error;
	}

	/* ---------------- Context ---------------- */

	DP.loadProjectContext = async function () {
		S.projectName = '';
		S.pcbName = '';
		S.projectUuid = 'default';
		S.project = null;
		S.pcb = null;
		if (!DP.hasEda()) {
			S.projectName = 'Demo board';
			return;
		}
		try {
			S.project = await eda.dmt_Project.getCurrentProjectInfo();
		}
		catch (e) {
			S.project = null;
		}
		try {
			S.pcb = await eda.dmt_Pcb.getCurrentPcbInfo();
		}
		catch (e) {
			S.pcb = null;
		}
		if (S.project) {
			S.projectName = S.project.friendlyName || S.project.name || '';
			S.projectUuid = S.project.uuid || 'default';
		}
		if (S.pcb && S.pcb.name) S.pcbName = S.pcb.name;
		if (!S.projectName) S.projectName = '';
	};

	/* ---------------- Credits ---------------- */

	DP.refreshCredits = async function (silent) {
		if (!DP.cfg.apiKey) {
			S.credits = null;
			S.keyValid = null;
			DP.renderHeader();
			DP.renderNotice();
			return null;
		}
		var result = await DP.getBalance();
		if (result.ok) {
			S.credits = result.balance;
			S.keyValid = true;
		}
		else if (result.status === 401 || result.status === 403) {
			S.keyValid = false;
			S.credits = null;
			if (!silent) toast(DP.t('keyInvalid'), 'err');
		}
		else if (!silent) {
			toast(result.error || DP.t('genericError', result.status), 'warn');
		}
		DP.renderHeader();
		DP.renderNotice();
		return result;
	};

	/* ---------------- Project export ---------------- */

	async function exportBoardFile() {
		if (!DP.hasEda()) throw apiError(DP.t('apiNoticeNoEda'));
		if (!S.pcb) throw apiError(DP.t('noPcb'));
		if (!eda.pcb_ManufactureData || typeof eda.pcb_ManufactureData.getDsnFile !== 'function') {
			throw apiError('This EasyEDA version does not support getDsnFile().');
		}

		var name = DP.safeName(S.boardName || S.pcbName || S.projectName, 'board');
		var file = await DP.withTimeout(
			eda.pcb_ManufactureData.getDsnFile(name),
			45000,
			'export timeout',
		);
		if (!file) throw apiError(DP.t('exportFailed'));

		if (!file.name || !/\.dsn$/i.test(file.name)) {
			file = new File([file], name + '.dsn', { type: file.type || 'application/octet-stream' });
		}
		return { file: file, field: 'dsnFile' };
	}

	/* ---------------- Status polling ---------------- */

	function pollingInterval() {
		if (DP.isActive(S.status) || S.status === 'Starting') return 5000;
		if (DP.isTerminal(S.status)) return 45000;
		if (S.boardId) return 12000;
		return 0;
	}

	function stopPolling() {
		if (S.pollTimer) {
			window.clearTimeout(S.pollTimer);
			S.pollTimer = null;
		}
		S.polling = false;
	}

	function startPolling() {
		stopPolling();
		if (!S.boardId) return;
		S.polling = true;
		var run = async function () {
			if (!S.polling || !S.boardId) return;
			try {
				await tick();
			}
			catch (error) {
				console.error('[DeepPCB] poll failed:', error);
			}
			var delay = pollingInterval();
			if (delay > 0 && S.polling) {
				S.pollTimer = window.setTimeout(run, delay);
			}
		};
		run();
	}

	async function tick() {
		if (!S.boardId) return;
		var result = await DP.getBoard(S.boardId);
		S.lastTickAt = Date.now();
		if (!result.ok) {
			if (result.status === 401 || result.status === 403) {
				S.keyValid = false;
				DP.renderHeader();
				DP.renderNotice();
			}
			return;
		}
		var previous = S.status;
		S.previousStatus = previous;
		DP.applyBoard(result.board);
		if (previous !== S.status) {
			onStatusChanged(previous, S.status);
		}
		DP.renderRun();
		DP.renderHeader();
		DP.saveSession();
		await maybeAutoImport();
	}

	function onStatusChanged(previous, current) {
		if (!DP.isTerminal(current)) return;
		DP.refreshCredits(true);
		// Do not open the rating dialog automatically; the user opens it from
		// the Rate button on the job card when they want to leave feedback.
	}

	/* ---------------- Import ---------------- */

	async function deleteRoutingPrimitives(apiName) {
		var api = eda[apiName];
		if (!api) return 0;

		if (typeof api.getAllPrimitiveId === 'function') {
			var ids = await api.getAllPrimitiveId();
			if (!ids || !ids.length) return 0;
			for (var i = 0; i < ids.length; i += 400) {
				var deleted = await api.delete(ids.slice(i, i + 400));
				if (!deleted) throw apiError(DP.t('clearRoutingFailed'));
			}
			return ids.length;
		}

		if (typeof api.getAll === 'function') {
			var primitives = await api.getAll();
			if (!primitives || !primitives.length) return 0;
			var removed = await api.delete(primitives);
			if (!removed) throw apiError(DP.t('clearRoutingFailed'));
			return primitives.length;
		}

		throw apiError(DP.t('clearRoutingFailed'));
	}

	async function clearRouting() {
		// Delete vias first, then tracks, so the board ends up with no routing
		// before the new SES is imported. Without this, every import stacks on
		// top of the previous solution.
		var total = 0;
		total += await deleteRoutingPrimitives('pcb_PrimitiveVia');
		total += await deleteRoutingPrimitives('pcb_PrimitiveLine');
		return total;
	}

	async function importRevision(revisionNumber, options) {
		options = options || {};
		if (!DP.hasEda()) throw apiError(DP.t('apiNoticeNoEda'));
		if (!eda.pcb_Document || typeof eda.pcb_Document.importAutoRouteSesFile !== 'function') {
			throw apiError('This EasyEDA version does not support importAutoRouteSesFile().');
		}
		if (!S.boardId) throw apiError(DP.t('noProject'));
		var revision = options.revision || S.revisions.filter(function (item) {
			return Number(item.revisionNumber) === Number(revisionNumber);
		})[0] || null;

		var result = await DP.downloadArtifact(S.boardId, revisionNumber, 'SesFile');
		if (!result.ok) throw apiError(result.error || ('HTTP ' + result.status));
		if (!result.text || !result.text.trim()) throw apiError('Empty SES response');

		var baseName = DP.safeName(S.boardName || S.pcbName || S.projectName, 'board');
		var file = new File(
			[result.text],
			baseName + '_rev' + revisionNumber + '.ses',
			{ type: 'application/octet-stream' },
		);
		S.lastSesFile = file;

		await clearRouting();
		var imported = await eda.pcb_Document.importAutoRouteSesFile(file);
		if (!imported) throw apiError(DP.t('importFailed', 'importAutoRouteSesFile returned false'));

		S.imported = {
			revision: Number(revisionNumber),
			createdOn: (revision && revision.createdOn) || '',
		};
		S.autoImportAttempt = null;
		DP.saveSession();
		DP.renderRun();
		if (!options.silent) toast(DP.t('imported', revisionNumber), 'ok');
		return true;
	}

	async function maybeAutoImport() {
		if (!DP.cfg.autoImport || S.importing || S.busy) return;
		if (!S.jobStartedHere) return;
		var latest = S.latestRevision;
		if (!latest) return;
		if (!DP.isNewRevision(latest)) return;
		if (S.autoImportAttempt === latest.revisionNumber + ':' + (latest.createdOn || '')) return;
		S.autoImportAttempt = latest.revisionNumber + ':' + (latest.createdOn || '');
		S.importing = true;
		try {
			await importRevision(latest.revisionNumber, { revision: latest, silent: false });
		}
		catch (error) {
			S.autoImportAttempt = null;
			toast(DP.t('importFailed', errorText(error)), 'err');
		}
		finally {
			S.importing = false;
			DP.renderRun();
		}
	}

	/* ---------------- Start flow ---------------- */

	var STEPS = ['exporting', 'uploading', 'waitingReady', 'checkingCredits', 'submitting', 'waitingRun'];

	function progressSteps() {
		return STEPS.map(function (key) {
			return { title: DP.t(key), sub: DP.t(key + 'Sub') };
		});
	}

	function setStep(index, state, subtitle) {
		DP.progress.set(index, state, subtitle);
	}

	async function ensureCredits(board, timeout) {
		if (!board || !board.requiresCredits) return true;
		var perMinute = Number(board.creditsCostPerMinute);
		var cost = isFinite(perMinute) ? perMinute * timeout : 0;
		var result = await DP.getBalance();
		if (!result.ok) {
			throw apiError(DP.t('connectionFail', result.error || ('HTTP ' + result.status)));
		}
		S.credits = result.balance;
		DP.renderHeader();
		if (cost > 0 && result.balance < cost) {
			var error = new Error('insufficient_credits');
			error.code = 'insufficient_credits';
			error.balance = result.balance;
			error.cost = cost;
			throw error;
		}
		return true;
	}

	DP.startRun = async function () {
		if (S.busy) return;
		if (!DP.cfg.apiKey) {
			DP.openSettings(true);
			return;
		}
		if (!DP.hasEda()) {
			toast(DP.t('apiNoticeNoEda'), 'err');
			return;
		}
		if (!S.pcb) {
			toast(DP.t('noPcb'), 'err');
			return;
		}

		var timeout = Math.max(5, Math.min(120, Number($('timeout').value) || DP.cfg.defaultTimeout));
		var boardName = ($('board-name').value || '').trim() || S.pcbName || S.projectName || 'board';
		S.boardName = boardName;
		S.boardNameTouched = true;
		S.busy = true;
		S.lastError = '';
		DP.renderSetup();
		DP.progress.open(progressSteps());

		var boardId = '';
		try {
			setStep(0, 'active');
			var exported = await exportBoardFile();
			setStep(0, 'done', exported.file.name || exported.field);

			setStep(1, 'active');
			var created = await DP.createBoard(exported.file, boardName, exported.field);
			if (!created.ok) {
				throw apiError(DP.t('createFailed', created.error || ('HTTP ' + created.status)), created);
			}
			boardId = DP.parseBoardId(created.text);
			if (!boardId) throw apiError(DP.t('createFailed', 'empty board id'), created);
			S.boardId = boardId;
			S.boardName = boardName;
			S.status = 'Pending';
			S.jobStartedHere = true;
			S.ratingPrompted = false;
			DP.saveSession({ status: 'Pending' });
			setStep(1, 'done', 'ID ' + boardId.slice(0, 8));

			setStep(2, 'active');
			var ready = await DP.pollBoardUntil(
				boardId,
				function (board) {
					return board && (DP.isPreRun(board.boardStatus) || DP.isActive(board.boardStatus));
				},
				{
					interval: 1200,
					timeout: 90000,
					onTick: function (board) {
						if (board) setStep(2, 'active', DP.statusLabel(board.boardStatus));
					},
				},
			);
			if (!ready.ok) {
				throw apiError(DP.t('createFailed', ready.error || 'timeout waiting for the board'));
			}
			DP.applyBoard(ready.board);
			setStep(2, 'done', DP.t('boardReady'));

			setStep(3, 'active');
			await ensureCredits(ready.board, timeout);
			setStep(3, 'done', S.credits === null ? '--' : DP.formatNumber(S.credits));

			setStep(4, 'active');
			var submitted = await DP.submitBoard(boardId, timeout);
			if (!submitted.ok) {
				throw apiError(DP.t('submitFailed', submitted.error || ('HTTP ' + submitted.status)), submitted);
			}
			setStep(4, 'done');

			setStep(5, 'active');
			var running = await DP.pollBoardUntil(
				boardId,
				function (board) {
					return board && (DP.isActive(board.boardStatus) || DP.isTerminal(board.boardStatus));
				},
				{
					interval: 1500,
					timeout: 300000,
					onTick: function (board) {
						if (board) setStep(5, 'active', DP.statusLabel(board.boardStatus));
					},
				},
			);
			if (running.ok) {
				DP.applyBoard(running.board);
				setStep(5, 'done');
			}
			else {
				setStep(5, 'done', DP.t('notRunningYet', running.error || 'timeout'));
			}

			DP.progress.finish(DP.t('finishedSub'));
			DP.saveSession();
			S.busy = false;
			DP.render();
			startPolling();
			DP.refreshCredits(true);
			window.setTimeout(function () {
				DP.progress.close();
			}, 900);
		}
		catch (error) {
			S.busy = false;
			if (boardId) {
				S.boardId = boardId;
				DP.saveSession();
			}
			if (error && error.code === 'insufficient_credits') {
				DP.progress.close();
				DP.showCreditsModal(error.balance, error.cost);
			}
			else {
				var message = errorText(error);
				S.lastError = message;
				DP.progress.fail(message);
				if (error && error.response && (error.response.status === 401 || error.response.status === 403)) {
					S.keyValid = false;
					DP.renderNotice();
				}
			}
			DP.renderSetup();
			DP.renderRun();
		}
	};

	/* ---------------- Start an already-created board ---------------- */

	DP.startPendingRun = async function () {
		if (!S.boardId || S.busy) return;
		if (!DP.cfg.apiKey) {
			DP.openSettings(true);
			return;
		}
		var timeout = Math.max(5, Math.min(120, Number($('timeout').value) || DP.cfg.defaultTimeout || 45));
		S.busy = true;
		DP.renderRun();
		DP.progress.open([
			{ title: DP.t('checkingCredits'), sub: DP.t('checkingCreditsSub') },
			{ title: DP.t('submitting'), sub: DP.t('submittingSub') },
			{ title: DP.t('waitingRun'), sub: DP.t('waitingRunSub') },
		]);
		try {
			setStep(0, 'active');
			var current = await DP.getBoard(S.boardId);
			if (!current.ok) throw apiError(current.error || ('HTTP ' + current.status));
			DP.applyBoard(current.board);
			await ensureCredits(current.board, timeout);
			setStep(0, 'done');
			setStep(1, 'active');
			var submitted = await DP.submitBoard(S.boardId, timeout);
			if (!submitted.ok) {
				throw apiError(DP.t('submitFailed', submitted.error || ('HTTP ' + submitted.status)), submitted);
			}
			setStep(1, 'done');
			setStep(2, 'active');
			var running = await DP.pollBoardUntil(
				S.boardId,
				function (board) {
					return board && (DP.isActive(board.boardStatus) || DP.isTerminal(board.boardStatus));
				},
				{
					interval: 1500,
					timeout: 300000,
					onTick: function (board) {
						if (board) setStep(2, 'active', DP.statusLabel(board.boardStatus));
					},
				},
			);
			if (running.ok) {
				DP.applyBoard(running.board);
				setStep(2, 'done');
			}
			else {
				setStep(2, 'done', DP.t('notRunningYet', running.error || 'timeout'));
			}
			S.jobStartedHere = true;
			S.ratingPrompted = false;
			DP.saveSession();
			S.busy = false;
			DP.render();
			startPolling();
			DP.refreshCredits(true);
			DP.progress.finish(DP.t('finishedSub'));
			window.setTimeout(function () {
				DP.progress.close();
			}, 900);
		}
		catch (error) {
			S.busy = false;
			if (error && error.code === 'insufficient_credits') {
				DP.progress.close();
				DP.showCreditsModal(error.balance, error.cost);
			}
			else {
				DP.progress.fail(errorText(error));
			}
			DP.renderRun();
		}
	};

	/* ---------------- Session ---------------- */

	DP.restoreSession = async function () {
		var session = DP.loadSession();
		if (!session) {
			toast(DP.t('noHistory'), 'warn');
			return;
		}
		S.sessionDismissed = true;
		S.boardId = session.boardId;
		S.boardPid = session.boardPid || '';
		S.boardName = session.boardName || session.projectName || S.projectName;
		S.boardNameTouched = true;
		S.projectUuid = session.projectUuid || S.projectUuid;
		S.imported = session.imported || null;
		S.jobStartedHere = !!session.jobStartedHere || DP.isActive(session.status);
		S.ratingPrompted = false;
		DP.render();
		var result = await DP.getBoard(S.boardId);
		if (result.ok) {
			DP.applyBoard(result.board);
			toast(DP.t('restoredMsg'), 'ok');
		}
		else {
			toast(result.error || ('HTTP ' + result.status), 'warn');
		}
		DP.render();
		startPolling();
	};

	DP.openHistoryItem = async function (item) {
		if (!item || !item.boardId) return;
		S.sessionDismissed = true;
		S.boardId = item.boardId;
		S.boardPid = item.boardPid || '';
		S.boardName = item.boardName || item.projectName || item.boardId;
		S.boardNameTouched = true;
		S.projectUuid = item.projectUuid || S.projectUuid;
		S.imported = null;
		S.jobStartedHere = false;
		S.ratingPrompted = false;
		S.status = item.status || '';
		S.latestRevision = null;
		S.revisions = [];
		DP.setTab('route');
		DP.render();
		var result = await DP.getBoard(S.boardId);
		if (result.ok) DP.applyBoard(result.board);
		else toast(result.error || ('HTTP ' + result.status), 'warn');
		DP.render();
		startPolling();
	};

	DP.removeHistoryItem = function (boardId) {
		var list = DP.loadHistory().filter(function (item) {
			return item.boardId !== boardId;
		});
		DP.storeSet(DP.KEYS.history, JSON.stringify(list));
		DP.renderHistory();
	};

	DP.clearHistoryFromUi = async function () {
		var confirmed = await DP.confirm(DP.t('confirmClearHistory'), { okLabel: DP.t('clear') });
		if (!confirmed) return;
		DP.clearHistory();
		DP.renderHistory();
		toast(DP.t('sessionCleared'), 'ok');
	};

	/* ---------------- Actions ---------------- */

	DP.stopRun = async function () {
		if (!S.boardId || S.busy) return;
		var confirmed = await DP.confirm(DP.t('confirmStop'), { okLabel: DP.t('stop') });
		if (!confirmed) return;
		S.busy = true;
		DP.renderRun();
		var result = await DP.stopBoard(S.boardId);
		S.busy = false;
		if (result.ok) {
			toast(DP.t('stoppedMsg'), 'ok');
			await tick();
		}
		else {
			toast(DP.t('stopFailed', result.error || ('HTTP ' + result.status)), 'err');
		}
		DP.renderRun();
	};

	DP.resumeRun = async function () {
		if (!S.boardId || S.busy) return;
		var timeout = Math.max(5, Math.min(120, Number($('timeout').value) || DP.cfg.defaultTimeout || 45));
		var confirmed = await DP.confirm(DP.t('confirmResume', timeout), { okLabel: DP.t('resume') });
		if (!confirmed) return;
		S.busy = true;
		DP.renderRun();
		var result = await DP.resumeBoard(S.boardId, timeout);
		S.busy = false;
		if (result.ok) {
			S.jobStartedHere = true;
			toast(DP.t('restoredMsg'), 'ok');
			startPolling();
		}
		else {
			toast(result.error || ('HTTP ' + result.status), 'err');
		}
		DP.renderRun();
	};

	DP.newJob = async function () {
		var confirmed = await DP.confirm(DP.t('confirmNew'), { okLabel: DP.t('newJob') });
		if (!confirmed) return;
		stopPolling();
		DP.clearSession();
		S.boardId = '';
		S.boardPid = '';
		S.board = null;
		S.status = '';
		S.boardNameTouched = false;
		S.boardName = S.pcbName || S.projectName || 'board';
		S.revisions = [];
		S.latestRevision = null;
		S.selectedRevision = '';
		S.imported = null;
		S.jobStartedHere = false;
		S.ratingPrompted = false;
		S.autoImportAttempt = null;
		S.sessionDismissed = true;
		DP.setTab('route');
		DP.render();
		window.setTimeout(function () {
			var input = $('board-name');
			if (input) input.focus();
		}, 40);
	};

	DP.importLatest = async function () {
		if (!S.latestRevision) {
			toast(DP.t('noSolutions'), 'warn');
			return;
		}
		var revision = S.latestRevision;
		S.importing = true;
		DP.renderRun();
		try {
			await importRevision(revision.revisionNumber, { revision: revision });
		}
		catch (error) {
			toast(DP.t('importFailed', errorText(error)), 'err');
		}
		finally {
			S.importing = false;
			DP.renderRun();
		}
	};

	DP.importSelected = async function () {
		var value = $('revision-select').value;
		if (!value) {
			toast(DP.t('noSolutions'), 'warn');
			return;
		}
		S.importing = true;
		DP.renderRun();
		try {
			await importRevision(Number(value));
		}
		catch (error) {
			toast(DP.t('importFailed', errorText(error)), 'err');
		}
		finally {
			S.importing = false;
			DP.renderRun();
		}
	};

	DP.saveCurrentSes = async function () {
		if (!DP.hasEda()) {
			toast(DP.t('apiNoticeNoEda'), 'err');
			return;
		}
		var revision = Number(S.selectedRevision || (S.latestRevision && S.latestRevision.revisionNumber));
		if (!revision) {
			toast(DP.t('noSolutions'), 'warn');
			return;
		}
		try {
			var result = await DP.downloadArtifact(S.boardId, revision, 'SesFile');
			if (!result.ok || !result.text) throw apiError(result.error || ('HTTP ' + result.status));
			var file = new File(
				[result.text],
				DP.safeName(S.boardName || S.projectName, 'board') + '_rev' + revision + '.ses',
				{ type: 'application/octet-stream' },
			);
			S.lastSesFile = file;
			await eda.sys_FileSystem.saveFile(file, file.name);
			toast(DP.t('savedSes'), 'ok');
		}
		catch (error) {
			toast(DP.t('savedSesFailed', errorText(error)), 'err');
		}
	};

	DP.openInApp = function () {
		var id = S.boardPid || S.boardId;
		if (!id) return;
		DP.openExternal(DP.LINKS.boards + '/' + encodeURIComponent(id));
	};

	DP.refreshNow = async function () {
		await DP.refreshCredits(false);
		if (S.boardId) {
			var result = await DP.getBoard(S.boardId);
			if (result.ok) DP.applyBoard(result.board);
			DP.render();
		}
	};

	/* ---------------- Startup ---------------- */

	function consumePendingAction() {
		var action = DP.storeGet(DP.KEYS.pending);
		DP.storeSet(DP.KEYS.pending, '');
		return action;
	}

	function handleCommandAction(action) {
		if (action === 'settings') {
			DP.openSettings(true);
			return true;
		}
		if (action === 'new') {
			DP.setTab('route');
			var input = $('board-name');
			if (input) input.focus();
			return true;
		}
		return false;
	}

	async function boot() {
		DP.loadConfig();
		DP.ui.init();

		// EasyEDA copies the `eda` object onto the iframe window when the
		// window is created. Depending on how fast the frame document runs,
		// that copy can land a few milliseconds after these scripts.
		await waitForEda(4000);
		S.initializing = false;
		DP.loadConfig();
		var storedLang = DP.storeGet(DP.KEYS.lang);
		if (storedLang === 'zh' || storedLang === 'en') DP.lang = storedLang;

		await DP.loadProjectContext();
		DP.render();

		var action = consumePendingAction();
		await DP.refreshCredits(true);

		var session = DP.loadSession();
		if (session && action !== 'new' && (DP.isActive(session.status) || DP.isPreRun(session.status))) {
			await DP.restoreSession();
		}

		if (!DP.cfg.apiKey || action === 'settings') {
			DP.openSettings(!DP.cfg.apiKey);
		}
		else if (action === 'new') {
			handleCommandAction('new');
		}

		// Menus may act while the dashboard is already open. The message bus is
		// the fast path; polling the pending action is the reliable one.
		window.setInterval(function () {
			var next = consumePendingAction();
			if (next && next !== 'open') handleCommandAction(next);
		}, 1500);
	}

	async function waitForEda(timeoutMs) {
		var started = Date.now();
		while (!DP.hasEda() && Date.now() - started < timeoutMs) {
			await DP.sleep(100);
		}
		return DP.hasEda();
	}

	DP.waitForEda = waitForEda;
	DP.reinitialize = async function () {
		S.initializing = true;
		await waitForEda(2000);
		S.initializing = false;
		DP.loadConfig();
		var storedLang = DP.storeGet(DP.KEYS.lang);
		if (storedLang === 'zh' || storedLang === 'en') DP.lang = storedLang;
		await DP.loadProjectContext();
		DP.render();
		await DP.refreshCredits(true);
	};

	window.addEventListener('beforeunload', function () {
		stopPolling();
	});

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot);
	}
	else {
		boot();
	}
})();
