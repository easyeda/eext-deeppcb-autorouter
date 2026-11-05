/* DeepPCB AI Autorouter - dashboard UI */
(function () {
	'use strict';

	var DP = window.DP || (window.DP = {});

	function $(id) {
		return document.getElementById(id);
	}

	function setText(id, value) {
		var node = $(id);
		if (node) node.textContent = value;
	}

	function show(node, visible) {
		if (typeof node === 'string') node = $(node);
		if (!node) return;
		node.classList.toggle('hidden', !visible);
	}

	function isVisible(node) {
		return !!node && !node.classList.contains('hidden');
	}

	DP.$ = $;
	DP.setText = setText;
	DP.show = show;

	/* ---------------- Static text ---------------- */

	var STATIC = {
		'brand-sub': 'brandSub',
		'tab-route': 'routeTab',
		'tab-history': 'historyTab',
		'setup-title': 'setupTitle',
		'setup-subtitle': 'setupSubtitle',
		'label-board-name': 'boardName',
		'label-timeout': 'allocatedTime',
		'timeout-unit': 'min',
		'unlock-note': 'unlockNote',
		'label-auto-import': 'autoImport',
		'label-auto-import-2': 'autoImport',
		'auto-import-hint': 'autoImportHint',
		'auto-import-hint-2': 'autoImportHint',
		'start-btn-text': 'startRouting',
		'restore-inline-btn': 'restorePrevious',
		'restore-btn': 'restore',
		'restore-dismiss': 'dismiss',
		'run-title': 'runTitle',
		'metric-time-label': 'timeLeft',
		'metric-rev-label': 'solutions',
		'metric-rate-label': 'creditsPerMin',
		'edit-warning': 'editWarning',
		'stop-btn': 'stop',
		'start-pending-btn': 'startRouting',
		'resume-btn': 'resume',
		'newjob-btn': 'newJob',
		'import-latest-btn': 'importLatest',
		'save-ses-btn': 'saveSes',
		'open-app-btn': 'openInDeepPCB',
		'rate-btn': 'rate',
		'refresh-btn': 'refreshBtn',
		'advanced-summary': 'advancedSolutions',
		'import-selected-btn': 'importSelected',
		'how-title': 'howTitle',
		'how-1': 'how1',
		'how-2': 'how2',
		'how-3': 'how3',
		'how-4': 'how4',
		'history-title': 'historyTitle',
		'history-subtitle': 'historySubtitle',
		'clear-history-btn': 'clear',
		'settings-title': 'settingsTitle',
		'label-api-key': 'apiKey',
		'get-key-link': 'getApiKey',
		'get-key-link-2': 'getApiKey',
		'label-api-base': 'apiBase',
		'api-base-hint': 'apiBaseHint',
		'label-default-time': 'defaultTime',
		'set-timeout-unit': 'min',
		'settings-cancel': 'cancel',
		'settings-save': 'save',
		'test-btn': 'testConnection',
		'cors-help-title': 'corsHelpTitle',
		'cors-help-text': 'corsHelpText',
		'use-proxy-btn': 'useLocalProxy',
		'save-proxy-btn': 'downloadProxyPackage',
		'proxy-script-hint': 'proxyScriptHint',
		'permission-hint': 'permissionHint',
		'progress-title': 'progressTitle',
		'progress-close': 'close',
		'progress-settings-btn': 'settings',
		'rating-title': 'ratingTitle',
		'rating-intro': 'ratingIntro',
		'rating-speed': 'speed',
		'rating-drc': 'drc',
		'rating-solution': 'solutionQuality',
		'rating-feedback-label': 'feedback',
		'rating-cancel': 'cancel',
		'rating-submit': 'submit',
		'credits-title': 'insufficientTitle',
		'credits-cancel': 'cancel',
		'credits-buy': 'buyCredits',
		'api-notice-action': 'getApiKey',
	};

	function applyStaticText() {
		Object.keys(STATIC).forEach(function (id) {
			setText(id, DP.t(STATIC[id]));
		});
		$('brand-sub').textContent = DP.t('brandSub');
		$('timeout-unit').textContent = DP.t('min');
		$('set-timeout-unit').textContent = DP.t('min');
		$('lang-btn').textContent = DP.lang === 'zh' ? 'EN' : '中';
		$('lang-btn').title = DP.t('language');
		$('settings-btn').title = DP.t('settings');
		$('credits-chip').title = DP.t('credits');
		$('api-notice-action').textContent = DP.t('getApiKeyShort');
		$('get-key-link').textContent = DP.t('getApiKey');
		$('get-key-link-2').textContent = DP.t('getApiKey');
		$('rating-feedback').placeholder = DP.t('feedbackPlaceholder');
		$('confirm-cancel').textContent = DP.t('cancel');
		$('confirm-ok').textContent = DP.t('ok');
		$('settings-close').title = DP.t('close');
		$('rating-close').title = DP.t('close');
		$('credits-close').title = DP.t('close');
		$('board-name').placeholder = DP.t('boardName');
		$('credits-cancel').textContent = DP.t('cancel');
		$('credits-buy').textContent = DP.t('buyCredits');
		document.documentElement.lang = DP.lang === 'zh' ? 'zh-Hans' : 'en';
		document.title = 'DeepPCB AI Autorouter';
	}

	/* ---------------- Header / notice / project ---------------- */

	function renderHeader() {
		var chip = $('credits-chip');
		var state = DP.state;
		chip.classList.remove('invalid', 'loading');
		if (state.keyValid === false) {
			setText('credits-text', 'API Key ✕');
			chip.classList.add('invalid');
		}
		else if (state.credits === null || state.credits === undefined) {
			setText('credits-text', DP.t('noCredits'));
			chip.classList.add('loading');
		}
		else {
			setText('credits-text', DP.formatNumber(state.credits) + ' ' + DP.t('creditsSuffix'));
		}
	}

	function renderNotice() {
		var state = DP.state;
		var notice = $('api-notice');
		var action = $('api-notice-action');
		if (state.initializing && !DP.hasEda()) {
			// The iframe API is injected by the host right after the frame is
			// created; do not flash an error during that short window.
			notice.classList.add('hidden');
			return;
		}
		if (!DP.hasEda()) {
			notice.classList.remove('hidden');
			notice.classList.add('error');
			setText('api-notice-text', DP.t('apiNoticeNoEda'));
			action.textContent = DP.t('retry');
			state.noticeAction = 'retry';
			show(action, true);
			return;
		}
		if (!DP.hasNetwork()) {
			notice.classList.remove('hidden');
			notice.classList.add('error');
			setText('api-notice-text', DP.t('apiNoticeNoNetwork'));
			action.textContent = DP.t('retry');
			state.noticeAction = 'retry';
			show(action, true);
			return;
		}
		if (!DP.cfg.apiKey) {
			notice.classList.remove('hidden', 'error');
			setText('api-notice-text', DP.t('apiNoticeNoKey'));
			action.textContent = DP.t('getApiKeyShort');
			state.noticeAction = 'settings';
			show(action, true);
			return;
		}
		if (state.keyValid === false) {
			notice.classList.remove('hidden');
			notice.classList.add('error');
			setText('api-notice-text', DP.t('apiNoticeKeyInvalid'));
			action.textContent = DP.t('getApiKeyShort');
			state.noticeAction = 'settings';
			show(action, true);
			return;
		}
		notice.classList.add('hidden');
	}

	function renderProject() {
		var state = DP.state;
		var name = state.projectName || DP.t('unknown');
		var pcb = state.pcbName ? ' · ' + state.pcbName : '';
		setText('project-pill', name + pcb);
		if (!state.boardNameTouched && state.projectName) {
			state.boardName = state.projectName;
		}
		if (!state.boardName) {
			state.boardName = state.projectName || 'board';
		}
		var input = $('board-name');
		if (document.activeElement !== input) input.value = state.boardName;
	}

	/* ---------------- Setup ---------------- */

	function renderSetup() {
		var state = DP.state;
		var timeout = Number(DP.cfg.defaultTimeout) || 45;
		$('timeout').value = String(timeout);
		setText('timeout-value', String(timeout));
		$('auto-import').checked = !!DP.cfg.autoImport;

		var session = DP.loadSession();
		state.sessionAvailable = !!session;
		var restoreInline = $('restore-inline-btn');
		show(restoreInline, !!session);
		if (session) {
			restoreInline.textContent = DP.t('restorePrevious') + (session.boardName ? ' · ' + session.boardName : '');
		}

		var disabled = state.busy || !DP.cfg.apiKey;
		$('start-btn').disabled = disabled;
		$('start-btn').title = !DP.cfg.apiKey ? DP.t('apiNoticeNoKey') : '';
	}

	function renderRestoreCard() {
		var state = DP.state;
		var session = DP.loadSession();
		var card = $('restore-card');
		var visible = !!session && !state.sessionDismissed && !state.boardId;
		show(card, visible);
		if (!visible) return;
		setText('restore-title', DP.t('restorePrevious'));
		var parts = [];
		if (session.boardName) parts.push(session.boardName);
		if (session.projectName) parts.push(session.projectName);
		if (session.updatedAt) parts.push(DP.formatDate(session.updatedAt));
		setText('restore-sub', parts.join(' · '));
	}

	/* ---------------- Run ---------------- */

	function statusTone(status) {
		if (DP.isActive(status)) return 'active';
		if (status === 'Done') return 'ok';
		if (status === 'Failed') return 'err';
		if (status === 'Stopped') return 'warn';
		return '';
	}

	function renderRun() {
		var state = DP.state;
		var hasBoard = !!state.boardId;
		show($('setup-card'), !hasBoard);
		show($('restore-card'), !hasBoard && !!DP.loadSession() && !state.sessionDismissed);
		show($('run-card'), hasBoard);
		show($('how-card'), !hasBoard);
		if (!hasBoard) return;

		var status = state.status || '';
		var title = state.boardName || state.projectName || DP.t('runTitle');
		setText('run-title', title);
		setText('run-subtitle', DP.t('runSubtitle') + (state.boardPid ? ' · ' + state.boardPid.slice(0, 8) : ''));
		setText('status-pill', DP.statusLabel(status || 'unknown'));
		var pill = $('status-pill');
		pill.className = 'pill ' + (status === 'Done' ? 'ok' : status === 'Failed' ? 'err' : DP.isActive(status) ? 'info' : status === 'Stopped' ? 'warn' : '');

		var dot = $('status-dot');
		dot.className = 'status-dot ' + statusTone(status);

		var bar = $('run-progress');
		bar.classList.remove('indeterminate');
		if (DP.isActive(status) || status === 'Starting') {
			bar.classList.add('indeterminate');
		}
		else if (DP.isTerminal(status)) {
			bar.style.width = '100%';
		}
		else {
			bar.style.width = status ? '8%' : '0%';
		}

		var remaining = DP.remainingSeconds(state.board);
		if (remaining !== null && DP.isActive(status)) {
			setText('metric-time', DP.formatDuration(remaining));
		}
		else if (DP.isTerminal(status)) {
			setText('metric-time', '—');
		}
		else {
			setText('metric-time', '--');
		}

		var latest = state.latestRevision;
		setText('metric-rev', latest ? '#' + latest.revisionNumber : '0');

		var perMinute = state.board && Number(state.board.creditsCostPerMinute);
		setText('metric-rate', isFinite(perMinute) && perMinute > 0 ? DP.formatNumber(perMinute) : '--');

		show($('edit-warning'), DP.isActive(status));

		show($('stop-btn'), DP.isActive(status));
		show($('resume-btn'), status === 'Stopped');
		show($('start-pending-btn'), DP.isPreRun(status));
		show($('newjob-btn'), !status || DP.isTerminal(status) || DP.isPreRun(status));
		$('stop-btn').disabled = state.busy || state.importing;
		$('start-pending-btn').disabled = state.busy || state.importing;
		$('resume-btn').disabled = state.busy || state.importing;
		$('newjob-btn').disabled = state.busy;

		$('import-latest-btn').disabled = !latest || state.busy || state.importing;
		$('save-ses-btn').disabled = !latest || state.importing;
		$('open-app-btn').disabled = !state.boardPid;
		$('rate-btn').disabled = !DP.isTerminal(status);

		var select = $('revision-select');
		select.innerHTML = '';
		if (state.revisions.length) {
			state.revisions
				.slice()
				.reverse()
				.forEach(function (revision) {
					var option = document.createElement('option');
					option.value = String(revision.revisionNumber);
					option.textContent = '#' + revision.revisionNumber + (DP.isNewRevision(revision) ? ' · ' + DP.t('newBadge') : '');
					select.appendChild(option);
				});
			if (state.selectedRevision) select.value = String(state.selectedRevision);
			$('import-selected-btn').disabled = state.importing;
		}
		else {
			var option = document.createElement('option');
			option.value = '';
			option.textContent = DP.t('noSolutions');
			select.appendChild(option);
			$('import-selected-btn').disabled = true;
		}

		var imported = state.imported;
		show($('imported-note'), !!imported);
		if (imported) setText('imported-note', DP.t('importedNote', imported.revision));
	}

	/* ---------------- History ---------------- */

	function renderHistory() {
		var list = DP.loadHistory();
		var host = $('history-list');
		host.innerHTML = '';
		if (!list.length) {
			var empty = document.createElement('div');
			empty.className = 'empty-state';
			empty.textContent = DP.t('noHistory');
			host.appendChild(empty);
			return;
		}
		list.forEach(function (item) {
			var row = document.createElement('div');
			row.className = 'history-item';

			var main = document.createElement('div');
			main.className = 'history-main';
			var name = document.createElement('div');
			name.className = 'history-name';
			name.textContent = item.boardName || item.projectName || item.boardId;
			var meta = document.createElement('div');
			meta.className = 'history-meta';
			var status = document.createElement('span');
			status.textContent = item.status ? DP.statusLabel(item.status) : DP.t('statusUnknown');
			var date = document.createElement('span');
			date.textContent = DP.formatDate(item.updatedAt);
			meta.appendChild(status);
			meta.appendChild(date);
			main.appendChild(name);
			main.appendChild(meta);

			var actions = document.createElement('div');
			actions.className = 'history-actions';

			var openBtn = document.createElement('button');
			openBtn.className = 'btn secondary';
			openBtn.type = 'button';
			openBtn.textContent = DP.t('open');
			openBtn.addEventListener('click', function () {
				DP.openHistoryItem(item);
			});

			var removeBtn = document.createElement('button');
			removeBtn.className = 'btn ghost';
			removeBtn.type = 'button';
			removeBtn.textContent = DP.t('remove');
			removeBtn.addEventListener('click', function () {
				DP.removeHistoryItem(item.boardId);
			});

			actions.appendChild(openBtn);
			actions.appendChild(removeBtn);
			row.appendChild(main);
			row.appendChild(actions);
			host.appendChild(row);
		});
	}

	/* ---------------- Master render ---------------- */

	DP.render = function () {
		applyStaticText();
		renderHeader();
		renderNotice();
		renderProject();
		renderSetup();
		renderRestoreCard();
		renderRun();
		renderHistory();
	};

	DP.renderSetup = renderSetup;
	DP.renderRun = renderRun;
	DP.renderHeader = renderHeader;
	DP.renderHistory = renderHistory;
	DP.renderNotice = renderNotice;

	/* ---------------- Toast ---------------- */

	DP.toast = function (message, type) {
		var host = $('toast-host');
		if (!host) return;
		var node = document.createElement('div');
		node.className = 'toast ' + (type || '');
		node.textContent = message;
		host.appendChild(node);
		window.setTimeout(function () {
			node.style.opacity = '0';
			node.style.transition = 'opacity .25s ease';
			window.setTimeout(function () {
				if (node.parentNode) node.parentNode.removeChild(node);
			}, 260);
		}, 3600);
	};

	/* ---------------- Modals ---------------- */

	function openModal(id) {
		var node = $(id);
		if (node) node.classList.remove('hidden');
	}

	function closeModal(id) {
		var node = $(id);
		if (node) node.classList.add('hidden');
	}

	DP.openModal = openModal;
	DP.closeModal = closeModal;

	/* Settings */

	DP.openSettings = function (focusKey) {
		var dialog = $('settings-modal');
		if (!dialog) return;
		$('set-api-key').value = DP.cfg.apiKey || '';
		$('set-api-base').value = DP.cfg.apiBaseUrl || DP.API_DEFAULT;
		$('set-timeout').value = String(DP.cfg.defaultTimeout || 45);
		setText('set-timeout-value', String(DP.cfg.defaultTimeout || 45));
		$('set-auto-import').checked = !!DP.cfg.autoImport;
		$('set-api-key').type = 'password';
		setText('test-result', '');
		$('test-result').className = 'test-result';
		openModal('settings-modal');
		if (focusKey) window.setTimeout(function () { $('set-api-key').focus(); }, 30);
	};

	DP.closeSettings = function () {
		closeModal('settings-modal');
	};

	DP.saveSettingsFromUi = function () {
		var key = $('set-api-key').value.trim();
		var base = $('set-api-base').value.trim() || DP.API_DEFAULT;
		var timeout = Number($('set-timeout').value) || 45;
		DP.cfg.apiKey = key;
		DP.cfg.apiBaseUrl = base.replace(/\/+$/, '');
		DP.cfg.defaultTimeout = Math.max(5, Math.min(120, Math.round(timeout)));
		DP.cfg.autoImport = $('set-auto-import').checked;
		DP.saveConfig();
		DP.closeSettings();
		DP.render();
		DP.toast(DP.t('settingsSaved'), 'ok');
		DP.refreshCredits(true);
	};

	DP.testConnection = async function () {
		var resultNode = $('test-result');
		var previousKey = DP.cfg.apiKey;
		var previousBase = DP.cfg.apiBaseUrl;
		DP.cfg.apiKey = $('set-api-key').value.trim();
		DP.cfg.apiBaseUrl = ($('set-api-base').value.trim() || DP.API_DEFAULT).replace(/\/+$/, '');
		resultNode.className = 'test-result';
		resultNode.textContent = DP.t('testing');
		$('test-btn').disabled = true;
		var result = await DP.getBalance();
		$('test-btn').disabled = false;
		DP.cfg.apiKey = previousKey;
		DP.cfg.apiBaseUrl = previousBase;
		if (result.ok) {
			resultNode.className = 'test-result ok';
			resultNode.textContent = DP.t('connectionOk', DP.formatNumber(result.balance));
		}
		else {
			resultNode.className = 'test-result err';
			resultNode.textContent = DP.t('connectionFail', result.error || ('HTTP ' + result.status));
		}
	};

	/* Confirm */

	var confirmResolver = null;

	DP.confirm = function (message, options) {
		options = options || {};
		if (confirmResolver) {
			confirmResolver(false);
			confirmResolver = null;
		}
		setText('confirm-title', options.title || DP.t('confirmTitle'));
		setText('confirm-body', message);
		setText('confirm-ok', options.okLabel || DP.t('ok'));
		openModal('confirm-modal');
		return new Promise(function (resolve) {
			confirmResolver = resolve;
		});
	};

	function resolveConfirm(value) {
		if (confirmResolver) {
			var resolver = confirmResolver;
			confirmResolver = null;
			closeModal('confirm-modal');
			resolver(value);
		}
	}

	/* Credits */

	DP.showCreditsModal = async function (balance, cost) {
		var message;
		if (balance === undefined || balance === null) {
			var result = await DP.getBalance();
			balance = result.ok ? result.balance : null;
		}
		if (balance === null || balance === undefined) {
			message = DP.t('insufficientBody', '—', '—');
		}
		else {
			message = DP.t('insufficientBody', DP.formatNumber(cost || 0), DP.formatNumber(balance));
		}
		setText('credits-body', message);
		setText('credits-hint', DP.t('insufficientHint'));
		openModal('credits-modal');
	};

	/* Rating */

	var ratings = { speed: 0, drc: 0, solution: 0 };

	function buildStars() {
		Array.prototype.forEach.call(document.querySelectorAll('.stars'), function (host) {
			host.innerHTML = '';
			var dimension = host.getAttribute('data-dim');
			for (var i = 1; i <= 5; i++) {
				(function (value) {
					var button = document.createElement('button');
					button.type = 'button';
					button.className = 'star';
					button.textContent = '★';
					button.setAttribute('aria-label', String(value));
					button.addEventListener('click', function () {
						ratings[dimension] = value;
						paintStars();
						updateRatingSubmit();
					});
					host.appendChild(button);
				})(i);
			}
		});
	}

	function paintStars() {
		Array.prototype.forEach.call(document.querySelectorAll('.stars'), function (host) {
			var dimension = host.getAttribute('data-dim');
			var value = ratings[dimension] || 0;
			Array.prototype.forEach.call(host.children, function (button, index) {
				button.classList.toggle('on', index < value);
			});
		});
	}

	function updateRatingSubmit() {
		var feedback = $('rating-feedback').value.trim();
		var complete = ratings.speed > 0 && ratings.drc > 0 && ratings.solution > 0 && feedback.length > 0 && feedback.length <= 1000;
		$('rating-submit').disabled = !complete;
		setText('rating-count', feedback.length + ' / 1000');
	}

	DP.openRating = function () {
		ratings = { speed: 0, drc: 0, solution: 0 };
		$('rating-feedback').value = '';
		buildStars();
		paintStars();
		updateRatingSubmit();
		openModal('rating-modal');
	};

	DP.submitRating = async function () {
		var feedback = $('rating-feedback').value.trim();
		if (ratings.speed < 1 || ratings.drc < 1 || ratings.solution < 1 || !feedback) {
			DP.toast(DP.t('ratingIncomplete'), 'warn');
			return;
		}
		$('rating-submit').disabled = true;
		var result = await DP.rateBoard(DP.state.boardId, ratings.speed, ratings.drc, ratings.solution, feedback);
		$('rating-submit').disabled = false;
		if (result.ok) {
			closeModal('rating-modal');
			DP.toast(DP.t('ratingSubmitted'), 'ok');
		}
		else {
			DP.toast(DP.t('ratingFailed', result.error || ('HTTP ' + result.status)), 'err');
		}
	};

	/* Progress modal */

	var progressSteps = [];
	var progressIndex = -1;

	DP.progress = {
		open: function (steps) {
			progressSteps = steps.map(function (step) {
				return { title: step.title, sub: step.sub || '', state: 'pending' };
			});
			progressIndex = -1;
			var list = $('progress-steps');
			list.innerHTML = '';
			progressSteps.forEach(function (step) {
				var li = document.createElement('li');
				var icon = document.createElement('span');
				icon.className = 'step-icon';
				var text = document.createElement('div');
				text.className = 'step-text';
				var title = document.createElement('div');
				title.className = 'step-title';
				title.textContent = step.title;
				var sub = document.createElement('div');
				sub.className = 'step-sub';
				sub.textContent = step.sub;
				text.appendChild(title);
				text.appendChild(sub);
				li.appendChild(icon);
				li.appendChild(text);
				list.appendChild(li);
			});
			$('progress-bar').style.width = '0%';
			$('progress-bar').classList.remove('indeterminate');
			$('progress-error').classList.add('hidden');
			$('progress-error').textContent = '';
			$('progress-close').disabled = true;
			$('progress-subtitle').textContent = '';
			openModal('progress-modal');
		},
		set: function (index, state, subtitle) {
			if (index !== progressIndex && progressIndex >= 0) {
				var previous = $('progress-steps').children[progressIndex];
				if (previous && previous.getAttribute('data-state') !== 'error') {
					previous.setAttribute('data-state', 'done');
					previous.className = 'done';
				}
			}
			progressIndex = index;
			var node = $('progress-steps').children[index];
			if (node) {
				node.className = state === 'active' ? 'active' : state === 'done' ? 'done' : state === 'error' ? 'error' : '';
				node.setAttribute('data-state', state);
				if (subtitle) {
					var sub = node.querySelector('.step-sub');
					if (sub) sub.textContent = subtitle;
				}
			}
			var total = progressSteps.length || 1;
			var percent = Math.round((index / total) * 100);
			if (state === 'done') percent = Math.round(((index + 1) / total) * 100);
			var bar = $('progress-bar');
			bar.classList.toggle('indeterminate', state === 'active');
			bar.style.width = Math.max(0, Math.min(100, percent)) + '%';
			if (subtitle) $('progress-subtitle').textContent = subtitle;
		},
		finish: function (subtitle) {
			Array.prototype.forEach.call($('progress-steps').children, function (node) {
				if (node.className !== 'error') node.className = 'done';
			});
			$('progress-bar').classList.remove('indeterminate');
			$('progress-bar').style.width = '100%';
			if (subtitle) $('progress-subtitle').textContent = subtitle;
			$('progress-close').disabled = false;
		},
		fail: function (message) {
			if (progressIndex >= 0) {
				var node = $('progress-steps').children[progressIndex];
				if (node) node.className = 'error';
			}
			$('progress-bar').classList.remove('indeterminate');
			$('progress-error').textContent = message;
			$('progress-error').classList.remove('hidden');
			$('progress-close').disabled = false;
		},
		close: function () {
			closeModal('progress-modal');
		},
	};

	/* ---------------- Tabs ---------------- */

	function setTab(tab) {
		DP.state.activeTab = tab;
		Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (button) {
			button.classList.toggle('active', button.getAttribute('data-tab') === tab);
		});
		show('tab-panel-route', tab === 'route');
		show('tab-panel-history', tab === 'history');
		if (tab === 'history') renderHistory();
	}

	/* ---------------- Init ---------------- */

	DP.ui = {
		init: function () {
			applyStaticText();
			buildStars();
			renderHeader();
			renderNotice();
			renderProject();
			renderSetup();
			renderRun();
			renderHistory();

			Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (button) {
				button.addEventListener('click', function () {
					setTab(button.getAttribute('data-tab'));
				});
			});

			$('lang-btn').addEventListener('click', function () {
				DP.lang = DP.lang === 'zh' ? 'en' : 'zh';
				DP.storeSet(DP.KEYS.lang, DP.lang);
				// Re-render in place. Reloading the iframe would drop the
				// injected `eda` object and make the extension lose its config.
				DP.render();
			});

			$('settings-btn').addEventListener('click', function () {
				DP.openSettings(false);
			});
			$('api-notice-action').addEventListener('click', function () {
				if (DP.state.noticeAction === 'retry') DP.reinitialize();
				else DP.openSettings(true);
			});
			$('settings-close').addEventListener('click', DP.closeSettings);
			$('settings-cancel').addEventListener('click', DP.closeSettings);
			$('settings-save').addEventListener('click', DP.saveSettingsFromUi);
			$('test-btn').addEventListener('click', function () {
				DP.testConnection();
			});
			$('toggle-key').addEventListener('click', function () {
				var input = $('set-api-key');
				input.type = input.type === 'password' ? 'text' : 'password';
			});
			$('set-timeout').addEventListener('input', function () {
				setText('set-timeout-value', $('set-timeout').value);
			});
			$('use-proxy-btn').addEventListener('click', function () {
				$('set-api-base').value = 'http://127.0.0.1:8787/api/v1';
				DP.toast(DP.t('proxyApplied'), 'ok');
			});
			$('save-proxy-btn').addEventListener('click', async function () {
				if (!DP.hasEda() || !eda.sys_FileSystem) {
					DP.toast(DP.t('proxyScriptFailed', DP.t('apiNoticeNoEda')), 'err');
					return;
				}
				try {
					var file = await eda.sys_FileSystem.getExtensionFile('/tools/deeppcb-proxy.zip');
					if (!file) file = await eda.sys_FileSystem.getExtensionFile('tools/deeppcb-proxy.zip');
					if (!file) throw new Error('tools/deeppcb-proxy.zip not found in the package');
					await eda.sys_FileSystem.saveFile(file, 'deeppcb-proxy.zip');
					DP.toast(DP.t('proxyScriptSaved', 'deeppcb-proxy.zip'), 'ok');
				}
				catch (error) {
					DP.toast(DP.t('proxyScriptFailed', String((error && error.message) || error)), 'err');
				}
			});
			$('credits-chip').addEventListener('click', function () {
				DP.openExternal(DP.LINKS.credits);
			});

			$('timeout').addEventListener('input', function () {
				setText('timeout-value', $('timeout').value);
			});
			$('auto-import').addEventListener('change', function () {
				DP.cfg.autoImport = $('auto-import').checked;
				DP.saveConfig();
			});
			$('board-name').addEventListener('input', function () {
				DP.state.boardNameTouched = true;
				DP.state.boardName = $('board-name').value;
			});

			$('start-btn').addEventListener('click', function () {
				DP.startRun();
			});
			$('restore-btn').addEventListener('click', function () {
				DP.restoreSession();
			});
			$('restore-inline-btn').addEventListener('click', function () {
				DP.restoreSession();
			});
			$('restore-dismiss').addEventListener('click', function () {
				DP.state.sessionDismissed = true;
				DP.render();
			});

			$('stop-btn').addEventListener('click', function () {
				DP.stopRun();
			});
			$('start-pending-btn').addEventListener('click', function () {
				DP.startPendingRun();
			});
			$('resume-btn').addEventListener('click', function () {
				DP.resumeRun();
			});
			$('newjob-btn').addEventListener('click', function () {
				DP.newJob();
			});
			$('import-latest-btn').addEventListener('click', function () {
				DP.importLatest();
			});
			$('save-ses-btn').addEventListener('click', function () {
				DP.saveCurrentSes();
			});
			$('open-app-btn').addEventListener('click', function () {
				DP.openInApp();
			});
			$('rate-btn').addEventListener('click', function () {
				DP.openRating();
			});
			$('refresh-btn').addEventListener('click', function () {
				DP.refreshNow();
			});
			$('import-selected-btn').addEventListener('click', function () {
				DP.importSelected();
			});
			$('revision-select').addEventListener('change', function () {
				DP.state.selectedRevision = $('revision-select').value;
			});
			$('clear-history-btn').addEventListener('click', function () {
				DP.clearHistoryFromUi();
			});

			$('progress-close').addEventListener('click', function () {
				DP.progress.close();
			});
			$('progress-settings-btn').addEventListener('click', function () {
				DP.openSettings(true);
			});

			$('rating-close').addEventListener('click', function () {
				closeModal('rating-modal');
			});
			$('rating-cancel').addEventListener('click', function () {
				closeModal('rating-modal');
			});
			$('rating-feedback').addEventListener('input', updateRatingSubmit);
			$('rating-submit').addEventListener('click', function () {
				DP.submitRating();
			});

			$('credits-close').addEventListener('click', function () {
				closeModal('credits-modal');
			});
			$('credits-cancel').addEventListener('click', function () {
				closeModal('credits-modal');
			});
			$('credits-buy').addEventListener('click', function () {
				DP.openExternal(DP.LINKS.credits);
				closeModal('credits-modal');
			});

			$('confirm-cancel').addEventListener('click', function () {
				resolveConfirm(false);
			});
			$('confirm-ok').addEventListener('click', function () {
				resolveConfirm(true);
			});
			$('confirm-modal').addEventListener('click', function (event) {
				if (event.target === $('confirm-modal')) resolveConfirm(false);
			});
		},
	};

	DP.openExternal = function (url) {
		try {
			if (DP.hasEda() && eda.sys_Window && eda.sys_Window.open) {
				eda.sys_Window.open(url);
				return;
			}
		}
		catch (e) {
			/* fall through */
		}
		window.open(url, '_blank', 'noopener,noreferrer');
	};

	DP.buildStars = buildStars;
	DP.setTab = setTab;
	DP.applyStaticText = applyStaticText;
})();
