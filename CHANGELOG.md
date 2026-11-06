# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.7] - 2026-11-06

### Added

- Pre-flight board limit check before routing: 8 copper layers, 1,200 airwires, 1,000 components and 2,200 pins. Boards above any limit are blocked with a toast showing the actual and allowed values.
- GitHub Actions release workflow: packages and publishes the extension when the major or minor version changes, or when a `v*` tag is pushed.

## [0.0.6] - 2026-11-06

### Changed

- Shorten the new-job card copy and the menu label to **New Job...** / 新建任务....
- Default new tasks to the PCB name; reopening **New Job...** resets a stale task name to the current PCB.

## [0.0.5] - 2026-11-06

### Changed

- Remove the auto-import checkbox from the new-routing-job card; the option remains in Settings.
- Remove the "previous run" card from the top of the dashboard. Use **Restore previous run** next to **Start routing** instead.
- Size the dashboard to its content (600 × 510, or 600 × 565 before an API key is configured) so the empty strip at the bottom is gone.

## [0.0.4] - 2026-11-06

### Changed

- Reduce the dashboard to 600 × 720 so it covers less of the PCB canvas.
- Replace the four-step workflow card with a single horizontal business axis.
- Compact the settings dialog: API key, API URL + Test connection inline, allocated time and auto-import side by side, shorter hints.

## [0.0.3] - 2026-11-06

### Fixed

- Clear existing tracks and vias before importing a new SES solution, so solutions no longer stack on the canvas.
- Import a new solution directly (clear + import) without a confirmation dialog.
- Do not open the rating dialog automatically after a job; the user opens it from the Rate button.
- Default the board name to the PCB name instead of the project name.
- Use the edited board name for the uploaded DSN filename.
- Reduce the dashboard width to 720 px so it covers less of the canvas.
- Move **Test connection** directly below the API base URL field.
- Reduce the empty space at the bottom of the routing progress dialog.

### Changed

- Removed the external bridge / CORS proxy settings; the extension uses the DeepPCB API directly.
- README: English version first with a link to Chinese; removed the proxy package instructions.

## [0.0.1] - 2026-11-05

### Added

- DeepPCB AI autorouting for EasyEDA Pro PCB editor.
- Header menu under **PCB → DeepPCB AI Autorouter**: Open, New Routing Job, Settings.
- Specctra DSN export via `pcb_ManufactureData.getDsnFile()`.
- DeepPCB board creation with the `dsnFile` multipart field (no `.epro` project upload).
- Board creation sends the `webhookUrl` / `webhookToken` fields required by DeepPCB's API-key validation.
- Job lifecycle: create, wait for board readiness, credit check, submit, poll status, stop, resume, new job.
- Specctra SES (`.ses`) download and import via `pcb_Document.importAutoRouteSesFile()`.
- Automatic import of new solutions (configurable), plus manual import of the latest or a selected revision.
- Save the selected solution as a local `.ses` file.
- Live credit balance, cost-per-minute display, remaining-time calculation and insufficient-credit dialog.
- Per-project session restore and a recent-run history stored in extension user configuration.
- Board rating dialog (speed, DRC, solution quality, feedback).
- Settings dialog: API key, API base URL, default allocated time, auto-import toggle, connection test.
- Bundled local proxy package (`tools/deeppcb-proxy.zip`) with double-click launchers for Windows/macOS/Linux; the launcher detects Node.js and downloads a verified portable copy into the current folder when needed.
- In-app **Download proxy package** and **Use local proxy** helpers; DeepPCB currently only allows browser requests from `app.deeppcb.ai`.
- Automatic versioning: starts at `0.0.1`, increments on every build, and advances the minor after 30 patches (`0.0.30` → `0.1.0`).
- Bilingual UI (Simplified Chinese / English), light and dark themes.
- Extension metadata and menu translations for `en` and `zh-Hans`.
- Language switching now re-renders in place (no iframe reload), preserving the API key and open dialogs.
- Settings modal keeps its header/close button and footer actions fixed while the body scrolls.
- Dashboard opens a fresh iframe each time, avoiding a stale/blank frame after upgrading the extension.
- Removed the footer branding line.
- Removed the About dialog and menu entry.
- README rewritten for end users; the local Node proxy is the only documented relay.
- README: notes that DeepPCB credits are user-funded and must be topped up by the user.
- README, NOTICE and upstream attribution; DeepPCB logo taken from the reference repository.

### Notes

- Unofficial community port of [deeppcb-kicad-plugin](https://github.com/instadeepai/deeppcb-kicad-plugin) (Apache-2.0).
- Requires EasyEDA Pro engine `>= 3.2.0` for `importAutoRouteSesFile()`.
- External network interaction must be allowed for the extension in EasyEDA settings.

[0.0.7]: https://github.com/easyeda/eext-deeppcb-autorouter
[0.0.6]: https://github.com/easyeda/eext-deeppcb-autorouter
[0.0.5]: https://github.com/easyeda/eext-deeppcb-autorouter
[0.0.4]: https://github.com/easyeda/eext-deeppcb-autorouter
[0.0.3]: https://github.com/easyeda/eext-deeppcb-autorouter
[0.0.1]: https://github.com/easyeda/eext-deeppcb-autorouter
