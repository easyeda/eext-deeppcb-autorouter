# DeepPCB AI Autorouter for EasyEDA Pro

[English](#en) | [简体中文](#zh)

<a id="en"></a>
## English

Route your PCB automatically with the [DeepPCB](https://app.deeppcb.ai) cloud AI engine, directly inside the **EasyEDA Pro** PCB editor.

This extension is a port of the open-source [deeppcb-kicad-plugin](https://github.com/instadeepai/deeppcb-kicad-plugin) to EasyEDA Pro. It is an unofficial community project and is not affiliated with InstaDeep / DeepPCB. The DeepPCB name and logo belong to InstaDeep Ltd.

### Features

- **One-click AI routing** — exports the current PCB as Specctra DSN and sends it to the DeepPCB cloud engine.
- **Automatic import** — downloads the SES result and imports it into the open PCB; no manual file conversion.
- **Credit tracking** — checks the balance before a run, shows cost while running, and refreshes after it finishes.
- **Job management** — start, stop, resume and create new jobs; keep a revision history and import the latest or a selected solution.
- **Board limit check** — before starting, blocks boards over 8 copper layers, 1,200 airwires, 1,000 components or 2,200 pins with a toast.
- **Session restore** — reopen the window and restore the previous job.
- **Rating** — rate speed, DRC and solution quality after a run.
- **Bilingual UI** — Chinese / English, with light and dark themes.

### Install

1. Download the latest `deeppcb-autorouter_v*.eext` build.
2. In EasyEDA Pro, open **Settings → Extensions → Install from File**.
3. Select the `.eext` file and enable the extension.
4. On first use, allow **external interaction / external network requests** for the extension.

### Quick start

1. Open a project that contains a PCB and switch to the **PCB editor**.
2. Choose **PCB → DeepPCB AI Autorouter → Open DeepPCB**.
3. The settings dialog opens on first use:
   - enter your DeepPCB API key;
   - click **Test connection** and confirm the balance is readable;
   - click **Save**.
4. In **New routing job**, confirm the board name and allocated time (5–120 minutes, default 45).
5. Click **Start routing** and wait for the cloud run to finish.
6. When a solution is ready it is downloaded and imported automatically; you can also click **Import latest**.
7. Use **Save .ses** to export a solution file, or **Open in DeepPCB** to view the job on the web.

> Do not edit the PCB while a job is running. Click **Stop** first if you need to make changes. Stopping early keeps the 5-minute unlock fee.

### API key and credits

#### 1. Create an API key

- Register at [app.deeppcb.ai](https://app.deeppcb.ai).
- Generate a key at [app.deeppcb.ai/integration](https://app.deeppcb.ai/integration).

#### 2. Top up your own credits

**DeepPCB is a paid service. You must top up credits in your own DeepPCB account.** This extension does not provide credits, top-ups or shared accounts.

- Estimated cost: `creditsCostPerMinute × allocated time`
- Includes a 5-minute unlock fee; stopping early does not refund it
- Top-up page: [app.deeppcb.ai/time-balance](https://app.deeppcb.ai/time-balance)

The extension only reads and displays the balance; it never handles payments. Pricing, free credits and promotions are determined by DeepPCB.

### CORS / connection errors

The extension calls the DeepPCB API directly (default `https://api.deeppcb.ai/api/v1`). If a request is blocked or unreachable, check your network connection and the API base URL in Settings. DeepPCB must allow requests from the EasyEDA origin; contact DeepPCB if your network cannot reach the API.

### FAQ

**Test connection returns 401 / 403**
The API key is invalid or expired. Generate a new one at [app.deeppcb.ai/integration](https://app.deeppcb.ai/integration) and save it in Settings.

**Not enough credits**
Estimated as `creditsCostPerMinute × allocated time`. Top up at [app.deeppcb.ai/time-balance](https://app.deeppcb.ai/time-balance), or reduce the allocated time.

**CORS / Failed to fetch**
Check your network connection and the API base URL in Settings. DeepPCB must allow requests from the EasyEDA origin.

**The window does not open / "EasyEDA API not detected"**
- Open it from the **PCB editor** menu, not by opening the HTML file in a browser.
- Close the window and reopen it from the menu; restart EasyEDA Pro if needed.
- Make sure the extension is enabled and external interaction is allowed.

**Import failed**
- Make sure the open PCB is the one that was uploaded.
- Use **Save .ses** to export the solution and import it through the PCB editor's autoroute import if needed.
- Requires EasyEDA Pro engine `>= 3.2.0`.

**The job stays Pending**
DeepPCB may need tens of seconds to parse the DSN; the panel refreshes automatically. If it stays unchanged, check the job on the DeepPCB website.

### Settings

| Setting | Default | Description |
| --- | --- | --- |
| API key | empty | Your personal DeepPCB API key |
| API base URL | `https://api.deeppcb.ai/api/v1` | Change it when using a private gateway |
| Default allocated time | 45 min | Initial duration for a new job |
| Auto-import new solutions | on | Import new solutions into the open PCB automatically |

The API key is stored only in the local extension configuration. Requests go only to the API address configured in Settings.

### Menu

| Item | Description |
| --- | --- |
| **Open DeepPCB** | Open the dashboard |
| **New Job...** | Open the dashboard and focus the new-job form |
| **Settings...** | API key / network / default time settings |

### How it works

1. The extension exports the current PCB as Specctra DSN and uploads it to DeepPCB.
2. The DeepPCB cloud AI generates routing solutions within the allocated time.
3. The extension downloads the SES result and imports it into the current PCB.

### Build from source

```bash
npm install
npm run build
```

The package is written to `build/dist/deeppcb-autorouter_v<version>.eext`.

Versioning starts at `0.0.1`; every `npm run build` increments the patch, and after 30 patches the minor advances (`0.0.30` → `0.1.0`).

GitHub Actions packages and publishes the `.eext` when the major or minor version changes on `main`. Pushing a tag such as `v0.1.0`, or running the workflow manually, also publishes a release.

### Credits and license

- Upstream project: [instadeepai/deeppcb-kicad-plugin](https://github.com/instadeepai/deeppcb-kicad-plugin), Copyright 2026 InstaDeep Ltd., Apache-2.0.
- The DeepPCB name and logo belong to InstaDeep Ltd.; logo assets come from the upstream repository.
- This project is released under Apache-2.0. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).

[简体中文](#zh)

---

<a id="zh"></a>
## 简体中文

使用 [DeepPCB](https://app.deeppcb.ai) 云端 AI 引擎，在 **嘉立创EDA专业版 / EasyEDA Pro** 的 PCB 编辑器中一键自动布线。

本扩展是开源项目 [deeppcb-kicad-plugin](https://github.com/instadeepai/deeppcb-kicad-plugin) 的 EasyEDA Pro 移植版。非官方社区项目，与 InstaDeep / DeepPCB 官方无隶属关系；DeepPCB 名称与 Logo 归 InstaDeep Ltd. 所有。

### 功能

- **一键 AI 布线**：把当前 PCB 导出为 Specctra DSN，交给 DeepPCB 云端引擎生成布线方案。
- **自动回传**：下载 SES 布线结果并直接导入当前 PCB，不需要手动转换文件。
- **额度显示**：启动前检查余额，运行中显示费用，结束后刷新额度。
- **任务管理**：开始、停止、继续、新建任务；保留历史方案，可导入最新或指定方案。
- **板子规模检查**：开始前检查，超过 8 层、1,200 飞线、1,000 器件或 2,200 引脚时用吐司提示并阻止继续。
- **会话恢复**：重新打开窗口后可恢复上次任务。
- **评分反馈**：任务完成后可评价速度、DRC 和方案质量。
- **中英双语**：跟随系统语言，可随时切换；支持浅色 / 深色主题。

### 安装

1. 下载最新构建的 `deeppcb-autorouter_v*.eext`（版本号见文件名 / Releases）。
2. 打开 EasyEDA Pro → **设置 / 高级** → **扩展** → **从文件安装**。
3. 选择 `.eext` 文件并启用扩展。
4. 首次使用时，在扩展设置中允许 **外部交互 / 外部网络请求**。

### 快速开始

1. 打开一个包含 PCB 的工程，切换到 **PCB 编辑器**。
2. 顶部菜单选择 **PCB → DeepPCB AI Autorouter → Open DeepPCB**。
3. 首次打开会自动弹出设置：
   - 填入 DeepPCB API Key；
   - 点击 **测试连接**，确认能读到额度；
   - 点击 **保存**。
4. 在“新建任务”中确认板名和分配时间（5–120 分钟，默认 45 分钟）。
5. 点击 **开始布线**，等待 DeepPCB 云端完成。
6. 布线完成后，新方案会自动下载并导入当前 PCB；也可以手动点击 **导入最新方案**。
7. 可用 **保存 .ses** 导出方案文件，或 **在 DeepPCB 中打开** 查看网页端详情。

> 任务运行期间请勿修改 PCB。如需修改，请先点击 **停止**。提前停止会保留 5 分钟解锁费用。

### 第一次使用：API Key 与额度

#### 1. 注册并生成 API Key

- 注册 DeepPCB：[app.deeppcb.ai](https://app.deeppcb.ai)
- 生成 API Key：[app.deeppcb.ai/integration](https://app.deeppcb.ai/integration)

#### 2. 自行充值额度

**DeepPCB 是付费服务，额度需要你在自己的 DeepPCB 账户中充值。** 本扩展不提供额度、代充或共享账号。

- 费用估算：`creditsCostPerMinute × 分配时间`
- 包含 5 分钟解锁费用，提前停止不退还该部分
- 充值入口：[app.deeppcb.ai/time-balance](https://app.deeppcb.ai/time-balance)

扩展只会读取并显示余额，不处理支付。具体价格、免费额度和促销以 DeepPCB 官方为准。

### 连接失败 / 提示 CORS 时

扩展会直接调用 DeepPCB API（默认 `https://api.deeppcb.ai/api/v1`）。如果请求被拦截或无法访问，请检查网络连接和设置中的 API 地址；DeepPCB 需要允许 EasyEDA 来源访问，若你的网络无法访问该接口，请联系 DeepPCB。

### 常见问题

**测试连接提示 401 / 403**
API Key 无效或过期。请到 [app.deeppcb.ai/integration](https://app.deeppcb.ai/integration) 重新生成，并在设置中保存。

**额度不足**
按 `creditsCostPerMinute × 分配时间` 估算费用。请到 [app.deeppcb.ai/time-balance](https://app.deeppcb.ai/time-balance) 充值，或减少分配时间。

**提示 CORS / Failed to fetch**
检查网络连接和设置中的 API 地址；DeepPCB 需要允许 EasyEDA 来源访问。

**打不开窗口 / 提示“未检测到 EasyEDA API”**
- 请从 **PCB 编辑器** 的菜单打开，而不是在浏览器中直接打开 HTML。
- 关闭窗口后重新从菜单打开；必要时重启 EasyEDA Pro。
- 确认扩展已启用，并允许外部交互。

**导入失败**
- 确认当前打开的是上传时对应的 PCB。
- 可用 **保存 .ses** 导出方案，再通过 PCB 编辑器的自动布线导入功能手动导入。
- 需要 EasyEDA Pro 引擎 `>= 3.2.0`。

**任务一直处于 Pending**
DeepPCB 解析 DSN 可能需要数十秒，面板会自动刷新。若长时间无变化，请在 DeepPCB 网页端查看任务详情。

### 设置项

| 设置 | 默认值 | 说明 |
| --- | --- | --- |
| API Key | 空 | DeepPCB 个人 API Key |
| API 地址 | `https://api.deeppcb.ai/api/v1` | 使用私有网关时可修改 |
| 默认分配时间 | 45 分钟 | 新建任务时的初始时长 |
| 自动导入新方案 | 开启 | 新方案到达时自动写回当前 PCB |

API Key 仅保存在本机扩展配置中；请求只会发送给你在设置中配置的 API 地址。

### 菜单

| 菜单项 | 说明 |
| --- | --- |
| **Open DeepPCB** | 打开 DeepPCB 面板 |
| **New Job...** | 打开面板并聚焦新建任务 |
| **Settings...** | 打开 API Key / 网络 / 默认时间设置 |

### 工作原理

1. 扩展把当前 PCB 导出为 Specctra DSN 并上传到 DeepPCB。
2. DeepPCB 云端 AI 在分配时间内生成布线方案。
3. 扩展下载 SES 结果并导入当前 PCB。

### 从源码构建

```bash
npm install
npm run build
```

构建产物位于 `build/dist/deeppcb-autorouter_v<版本号>.eext`。

版本号从 `0.0.1` 开始，每次 `npm run build` 自动 +1；每 30 次进 1 位（`0.0.30` → `0.1.0`）。

GitHub Actions 会在 `main` 上的主版本号或次版本号变化时自动打包并发布 `.eext`；推送 `v0.1.0` 这类 tag，或手动运行工作流，也会发布 release。

### 致谢与许可

- 参考项目：[instadeepai/deeppcb-kicad-plugin](https://github.com/instadeepai/deeppcb-kicad-plugin)，Copyright 2026 InstaDeep Ltd.，Apache-2.0。
- DeepPCB 名称与 Logo 归 InstaDeep Ltd. 所有；Logo 取自上游仓库。
- 本项目以 Apache-2.0 许可发布，详见 [LICENSE](./LICENSE) 与 [NOTICE](./NOTICE)。

[Back to English](#en)
