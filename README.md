# DeepPCB AI 自动布线 for EasyEDA Pro

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)

使用 [DeepPCB](https://app.deeppcb.ai) 云端 AI 引擎，在 **嘉立创EDA专业版 / EasyEDA Pro** 的 PCB 编辑器中一键自动布线。本扩展是开源项目 [deeppcb-kicad-plugin](https://github.com/instadeepai/deeppcb-kicad-plugin) 的 EasyEDA Pro 移植版，界面、菜单、设置弹窗、运行弹窗和输出回传流程均按参考项目实现。

> 本扩展为非官方社区项目，与 InstaDeep / DeepPCB 官方无隶属关系。DeepPCB 名称与 Logo 归 InstaDeep Ltd. 所有，Logo 资源来自上游开源仓库（Apache-2.0）。

---

## 功能

- **AI 自动布线**：把当前 PCB 导出为 Specctra `.dsn` 上传到 DeepPCB，由云端强化学习引擎生成布线方案。
- **方案自动回传**：下载 `SesFile`（Specctra SES），调用 `importAutoRouteSesFile()` 直接导入当前 PCB。
- **配额实时显示**：启动前检查余额，任务结束后刷新额度；余额不足时弹出充值入口。DeepPCB 为付费服务，额度需用户自行充值。
- **任务生命周期**：创建、启动、停止、继续、刷新、任务结束后新建任务。
- **多方案管理**：查看历史 revision，导入最新或指定方案，另存 `.ses` 到本地。
- **会话恢复**：按工程 UUID 在本机保存任务 ID，重新打开窗口后可恢复上次任务。
- **评分反馈**：任务完成后可对速度、DRC、方案质量打分并提交反馈。
- **中英双语**：跟随系统语言，可随时切换；支持浅色 / 深色主题。
- **本机配置**：API Key、API 地址、默认分配时间、自动导入开关均保存在扩展本地配置中。

## 环境要求

- 嘉立创EDA专业版 / EasyEDA Pro 桌面客户端或网页版，引擎版本 `>= 3.2.0`
- DeepPCB 账号：在 [app.deeppcb.ai](https://app.deeppcb.ai) 注册
- API Key：在 [app.deeppcb.ai/integration](https://app.deeppcb.ai/integration) 生成
- **额度**：DeepPCB 为付费服务，用户需要自行在 DeepPCB 账户中充值额度；本扩展不提供额度、代充或共享账号
- **直连说明**：DeepPCB API 目前尚未允许 EasyEDA 域名跨域直连，需要服务端放行 CORS 或使用远端 Worker（详见下文）

## 关于 CORS（重要）

DeepPCB API 目前只允许来自 `https://app.deeppcb.ai` 的浏览器请求。EasyEDA 扩展运行在 `https://pro.lceda.cn`，浏览器会拦截跨域响应（表现为 `Failed to fetch`）。这是 **DeepPCB 服务端的 CORS 策略**，扩展 JavaScript 无法绕过。扩展默认直连，服务端放行后即可直接使用，不需要任何中转。

### 方案 A：让 DeepPCB 放行 EasyEDA 来源（真正的直连）

需要 DeepPCB 在服务端 CORS 中加入以下来源：

- `https://pro.lceda.cn`（EasyEDA 桌面客户端 / 网页版当前实际来源）
- `https://pro.easyeda.com`（EasyEDA 国际版）
- `https://app.deeppcb.ai`（已有）

ASP.NET Core 示例：

```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy
        .WithOrigins(
            "https://app.deeppcb.ai",
            "https://pro.lceda.cn",
            "https://pro.easyeda.com")
        .AllowAnyHeader()    // 需要允许 x-deeppcb-api-key
        .AllowAnyMethod()
        .WithExposedHeaders("*"));
});
```

放行后，扩展设置中的 API 地址保持默认即可：

```text
https://api.deeppcb.ai/api/v1
```

### 方案 B：远端 Worker 中转（不需要本地进程）

如果暂时无法修改 DeepPCB 服务端，可把仓库中的 [`tools/deeppcb-cors-worker.js`](./tools/deeppcb-cors-worker.js) 部署到自己的 Cloudflare Workers 账号，然后把扩展的 API 地址设为：

```text
https://<你的-worker>.workers.dev/api/v1
```

> Worker 会看到 `x-deeppcb-api-key` 头，请部署自己的实例并保密 URL，不要使用公共部署。

### 方案 C：本地代理（可选）

仓库同时提供 `tools/deeppcb-proxy.mjs`；在设置中点击 **Save proxy script** 保存并运行：

```bash
node deeppcb-proxy.mjs
```

然后把 API 地址设为 `http://127.0.0.1:8787/api/v1`。代理只监听回环地址，不保存 API Key。

## 安装

### 方式一：扩展包安装（推荐）

1. 下载 `deeppcb-autorouter_v1.0.0.eext`（见 Releases 或自行构建）。
2. 打开嘉立创EDA专业版 → **设置 / 高级** → **扩展** → **从文件安装**。
3. 选择 `.eext` 文件并启用扩展。
4. 首次使用前，在该扩展的设置中允许 **外部交互 / 外部网络请求**。

### 方式二：从源码构建

```bash
npm install
npm run build
```

构建产物位于 `build/dist/deeppcb-autorouter_v1.0.0.eext`。

开发调试：

```bash
npm run debug
```

按 SDK 文档将调试扩展连接到编辑器即可热更新。

## 使用

1. 在 EasyEDA Pro 中打开一个包含 PCB 的工程，并切换到 **PCB 编辑器**。
2. 顶部菜单选择 **PCB → DeepPCB AI Autorouter → Open DeepPCB**。
3. 首次打开会弹出 **设置**，填入 DeepPCB API Key，点击 **测试连接** 确认额度可读取。
4. 在 **新建布线任务** 中确认板名和分配时间（5–120 分钟，默认 45 分钟）。
5. 点击 **开始布线**：
   - 扩展把当前 PCB 导出为 Specctra `.dsn` 并上传；
   - 等待 DeepPCB 解析、创建任务并检查额度；
   - 提交布线任务并等待云端开始运行。
6. 运行期间进度窗口 / 任务卡片会显示状态、剩余时间、方案数量；请勿同时修改 PCB。
7. 布线完成后，新方案会自动下载并导入；也可以手动点击 **导入最新方案** 或选择指定方案导入。
8. 可用 **保存 .ses** 导出方案文件，或 **在 DeepPCB 中打开** 查看网页端详情。

> 任务运行期间如需修改 PCB，请先点击 **停止**。提前停止会保留 5 分钟解锁费用。

## 额度与计费

- 扩展本身免费；DeepPCB 云端布线按额度（credits）计费。
- 费用估算：`creditsCostPerMinute × 分配时间`；任务启动前扩展会读取余额，余额不足会提示。
- 包含 5 分钟解锁费用，提前停止不退还该部分。
- **额度需要用户自行充值**：扩展不会代充、赠送或共享额度。充值入口：
  [app.deeppcb.ai/time-balance](https://app.deeppcb.ai/time-balance)
- 扩展只读取余额并显示，不处理支付；具体价格、免费额度和促销以 DeepPCB 官方为准。

## 菜单

| 菜单项 | 说明 |
| --- | --- |
| **Open DeepPCB** | 打开 / 聚焦 DeepPCB 面板 |
| **New Routing Job...** | 打开面板并聚焦新建任务 |
| **Settings...** | 打开 API Key / 网络 / 默认时间设置 |
| **About...** | 版本与项目信息 |

## 输出传递说明

EasyEDA Pro 版本的输入输出链路：

```text
当前 PCB
  └─ eda.pcb_ManufactureData.getDsnFile(...)
       └─ POST /api/v1/boards
            multipart: boardName, dsnFile
            （经本地代理转发时 API 地址为 http://127.0.0.1:8787/api/v1）
              └─ DeepPCB 云端 AI 布线
                   └─ GET /api/v1/boards/{id}/revision-artifact
                        type=SesFile, revisionType=Tidy
                          └─ eda.pcb_Document.importAutoRouteSesFile(file)
```

- **上传格式**：仅上传当前 PCB 的 Specctra `.dsn`（字段 `dsnFile`），不上传 `.epro` 工程包
- **回传格式**：Specctra `.ses`，通过 EasyEDA Pro 的自动布线导入接口写回 PCB
- **自动导入**：仅对在本次会话中启动的任务生效，避免恢复旧任务时覆盖当前布线
- **多 PCB 工程**：DSN 针对当前打开的 PCB；工程内有多个 PCB 时，请分别打开对应 PCB 运行任务

## 设置项

| 设置 | 默认值 | 说明 |
| --- | --- | --- |
| API Key | 空 | DeepPCB 个人 API Key |
| API 地址 | `https://api.deeppcb.ai/api/v1` | 可改为代理 / 私有网关 |
| 默认分配时间 | 45 分钟 | 新建任务时的初始时长 |
| 自动导入新方案 | 开启 | 新 revision 到达时自动写回当前 PCB |

API Key 以明文形式保存在本机扩展用户配置中，不会上传到第三方。公共电脑上使用后请及时清除。

## 常见问题

**没有检测到 EasyEDA API / 按钮不可用**
请从 PCB 编辑器的扩展菜单打开面板，而不是在浏览器中直接打开 HTML。

**请求失败 / CORS**
- 这是当前 DeepPCB API 的限制，不是扩展本身的错误。请按 [关于 CORS](#关于-cors重要) 启动本地代理，并在设置中点击 **Use local proxy**。
- 确认已在 EasyEDA 的扩展设置中允许本扩展进行外部交互。
- 如公司网络需要代理，可把 API 地址改为可访问的内部代理地址。

**本地代理无法启动 / 连接被拒绝**
- 确认已安装 Node.js 18+，并在运行 `node deeppcb-proxy.mjs` 的终端没有关闭。
- 确认端口 `8787` 未被占用；可用 `PORT=8788 node deeppcb-proxy.mjs` 换端口，并同步修改设置中的 API 地址。
- 代理只监听 `127.0.0.1`，不要放到公网。

**401 / 403**
API Key 无效或过期，请到 [app.deeppcb.ai/integration](https://app.deeppcb.ai/integration) 重新生成。

**额度不足**
启动前会按 `creditsCostPerMinute × 分配时间` 估算费用。充值入口见 [app.deeppcb.ai/time-balance](https://app.deeppcb.ai/time-balance)。

**导入失败**
- 确认当前打开的 PCB 与上传时属于同一工程。
- 确认 EasyEDA Pro 引擎版本 `>= 3.2.0`（需要 `importAutoRouteSesFile`）。
- 可先用 **保存 .ses** 导出文件，再通过 PCB 编辑器的自动布线导入功能手动导入。

**任务一直处于 Pending**
DeepPCB 解析 DSN 可能需要数十秒；面板会自动轮询。若长时间无变化，请在 DeepPCB 网页端查看任务详情。

## 项目结构

```text
src/index.ts         扩展入口：菜单注册、打开 / 聚焦 IFrame
iframe/index.html    面板结构
iframe/style.css     浅色 / 深色主题样式
iframe/i18n.js       中英文案
iframe/core.js       配置、存储、DeepPCB API 客户端
iframe/ui.js         渲染、设置 / 运行 / 评分弹窗
iframe/app.js        PCB DSN 导出、任务流程、轮询、SES 导入
tools/deeppcb-cors-worker.js  远端 CORS Worker（Cloudflare）
tools/deeppcb-proxy.mjs       本地 CORS 代理（Node.js，可选）
images/logo.png      扩展 Logo（来自上游仓库）
NOTICE               上游项目与商标归属说明
locales/             菜单与关于对话框本地化
```

## 开发

```bash
npm install          # 安装依赖
npm run lint         # ESLint
npm run build        # 编译 + 打包 eext
npm run debug        # 调试模式（WebSocket 热更新）
```

## 致谢与许可

- 参考项目：[instadeepai/deeppcb-kicad-plugin](https://github.com/instadeepai/deeppcb-kicad-plugin)，Copyright 2026 InstaDeep Ltd.，Apache-2.0。
- DeepPCB 名称与 Logo 归 InstaDeep Ltd. 所有；Logo 取自上游仓库。
- 本项目以 Apache-2.0 许可发布，详见 [LICENSE](./LICENSE) 与 [NOTICE](./NOTICE)。

---

## English

**DeepPCB AI Autorouter for EasyEDA Pro** — an unofficial port of the open-source DeepPCB KiCad plugin. It exports the current PCB as a Specctra `.dsn`, uploads it to the DeepPCB cloud AI engine (multipart field `dsnFile`), downloads the resulting Specctra `.ses`, and imports it into the open PCB through `importAutoRouteSesFile()`. No `.epro` project package is uploaded.

> **CORS note:** DeepPCB currently allows browser requests only from `https://app.deeppcb.ai`, so true direct access requires DeepPCB to allowlist the EasyEDA origin (`https://pro.lceda.cn`) server-side. Until then, use the remote Cloudflare Worker (`tools/deeppcb-cors-worker.js`) or the optional local proxy (`tools/deeppcb-proxy.mjs`). The extension defaults to the direct API URL and does not require any relay once DeepPCB allowlists the origin.

Highlights: one-click routing, live credit balance, create/start/stop/resume jobs, revision history, import latest or selected solution, save `.ses`, per-project session restore, board rating, bilingual UI (Chinese/English), light/dark themes.

Requirements: EasyEDA Pro engine `>= 3.2.0`, a DeepPCB account and API key. **DeepPCB is a paid service — users must top up their own DeepPCB credits**; this extension does not provide credits, top-ups, or shared accounts. Allow external network access for the extension in EasyEDA settings. The API key is stored locally in the extension user configuration.

Menus live under **PCB → DeepPCB AI Autorouter**: Open DeepPCB, New Routing Job, Settings, About.

Build with `npm install && npm run build`; the package is written to `build/dist/`.

License: Apache-2.0. DeepPCB name and logo belong to InstaDeep Ltd.; logo assets are taken from the upstream repository.
