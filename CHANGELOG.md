# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-05

### Added

- DeepPCB AI autorouting for EasyEDA Pro PCB editor.
- Header menus under **PCB → DeepPCB** and the home page: Open, New Routing Job, Settings, About.
- Specctra DSN export via `pcb_ManufactureData.getDsnFile()`.
- DeepPCB board creation with the `dsnFile` multipart field (no `.epro` project upload).
- Job lifecycle: create, wait for board readiness, credit check, submit, poll status, stop, resume, new job.
- Specctra SES (`.ses`) download and import via `pcb_Document.importAutoRouteSesFile()`.
- Automatic import of new solutions (configurable), plus manual import of the latest or a selected revision.
- Save the selected solution as a local `.ses` file.
- Live credit balance, cost-per-minute display, remaining-time calculation and insufficient-credit dialog.
- Per-project session restore and a recent-run history stored in extension user configuration.
- Board rating dialog (speed, DRC, solution quality, feedback).
- Settings dialog: API key, API base URL, default allocated time, auto-import toggle, connection test.
- Bundled local CORS proxy (`tools/deeppcb-proxy.mjs`) with in-app "Save proxy script" and "Use local proxy" helpers; DeepPCB currently only allows browser requests from `app.deeppcb.ai`.
- Remote CORS Worker for Cloudflare (`tools/deeppcb-cors-worker.js`) as an alternative to the local proxy.
- Bilingual UI (Simplified Chinese / English), light and dark themes.
- Extension metadata and menu translations for `en` and `zh-Hans`.
- Language switching now re-renders in place (no iframe reload), preserving the API key and open dialogs.
- Settings modal keeps its header/close button and footer actions fixed while the body scrolls.
- Removed the footer branding line.
- README: notes that DeepPCB credits are user-funded and must be topped up by the user.
- README, NOTICE and upstream attribution; DeepPCB logo taken from the reference repository.

### Notes

- Unofficial community port of [deeppcb-kicad-plugin](https://github.com/instadeepai/deeppcb-kicad-plugin) (Apache-2.0).
- Requires EasyEDA Pro engine `>= 3.2.0` for `importAutoRouteSesFile()`.
- External network interaction must be allowed for the extension in EasyEDA settings.

[1.0.0]: https://github.com/instadeepai/deeppcb-kicad-plugin
