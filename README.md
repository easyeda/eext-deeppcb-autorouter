# DeepPCB AI 自动布线 for EasyEDA Pro

使用 [DeepPCB](https://app.deeppcb.ai) 云端 AI 引擎，在 **嘉立创EDA专业版 / EasyEDA Pro** 的 PCB 编辑器中一键自动布线。

本扩展是开源项目 [deeppcb-kicad-plugin](https://github.com/instadeepai/deeppcb-kicad-plugin) 的 EasyEDA Pro 移植版。非官方社区项目，与 InstaDeep / DeepPCB 官方无隶属关系；DeepPCB 名称与 Logo 归 InstaDeep Ltd. 所有。

## 功能

- **一键 AI 布线**：把当前 PCB 导出为 Specctra DSN，交给 DeepPCB 云端引擎生成布线方案。
- **自动回传**：下载 SES 布线结果并直接导入当前 PCB，不需要手动转换文件。
- **额度显示**：启动前检查余额，运行中显示费用，结束后刷新额度。
- **任务管理**：开始、停止、继续、新建任务；保留历史方案，可导入最新或指定方案。
- **会话恢复**：重新打开窗口后可恢复上次任务。
- **评分反馈**：任务完成后可评价速度、DRC 和方案质量。
- **中英双语**：跟随系统语言，可随时切换；支持浅色 / 深色主题。

## 安装

1. 下载最新构建的 `deeppcb-autorouter_v*.eext`（版本号见文件名 / Releases）。
2. 打开 EasyEDA Pro → **设置 / 高级** → **扩展** → **从文件安装**。
3. 选择 `.eext` 文件并启用扩展。
4. 首次使用时，在扩展设置中允许 **外部交互 / 外部网络请求**。

## 快速开始

1. 打开一个包含 PCB 的工程，切换到 **PCB 编辑器**。
2. 顶部菜单选择 **PCB → DeepPCB AI Autorouter → Open DeepPCB**。
3. 首次打开会自动弹出设置：
   - 填入 DeepPCB API Key；
   - 点击 **测试连接**，确认能读到额度；
   - 点击 **保存**。
4. 在“新建布线任务”中确认板名和分配时间（5–120 分钟，默认 45 分钟）。
5. 点击 **开始布线**，等待 DeepPCB 云端完成。
6. 布线完成后，新方案会自动下载并导入当前 PCB；也可以手动点击 **导入最新方案**。
7. 可用 **保存 .ses** 导出方案文件，或 **在 DeepPCB 中打开** 查看网页端详情。

> 任务运行期间请勿修改 PCB。如需修改，请先点击 **停止**。提前停止会保留 5 分钟解锁费用。

## 第一次使用：API Key 与额度

### 1. 注册并生成 API Key

- 注册 DeepPCB：[app.deeppcb.ai](https://app.deeppcb.ai)
- 生成 API Key：[app.deeppcb.ai/integration](https://app.deeppcb.ai/integration)

### 2. 自行充值额度

**DeepPCB 是付费服务，额度需要你在自己的 DeepPCB 账户中充值。** 本扩展不提供额度、代充或共享账号。

- 费用估算：`creditsCostPerMinute × 分配时间`
- 包含 5 分钟解锁费用，提前停止不退还该部分
- 充值入口：[app.deeppcb.ai/time-balance](https://app.deeppcb.ai/time-balance)

扩展只会读取并显示余额，不处理支付。具体价格、免费额度和促销以 DeepPCB 官方为准。

## 连接失败 / 提示 CORS 时

DeepPCB 目前只允许来自其官网 `app.deeppcb.ai` 的浏览器请求，而 EasyEDA 扩展运行在 `pro.lceda.cn`，所以直连会被浏览器拦截（表现为 `Failed to fetch` 或“请求在到达 DeepPCB 前被浏览器拦截”）。在 DeepPCB 官方放行 EasyEDA 来源之前，请使用本地代理包：

### 1. 下载并解压代理包

打开扩展 **设置**，点击 **下载代理包**，保存 `deeppcb-proxy.zip`，然后解压到任意文件夹。

### 2. 双击启动

- **Windows**：双击 `start-proxy.bat`
- **macOS**：双击 `start-proxy.command`（若系统阻止，右键 → 打开）
- **Linux**：运行 `bash start-proxy.sh`

脚本会自动检测 Node.js 18+。如果没有安装，会询问是否下载便携版到**当前目录**（约 41MB，来自 nodejs.org，并校验 SHA-256），不需要单独安装 Node.js。

### 3. 在扩展中启用代理

保持代理窗口打开，回到扩展设置：

1. 点击 **使用本地代理**，API 地址会变为：

   ```text
   http://127.0.0.1:8787/api/v1
   ```

2. 点击 **测试连接**；
3. 成功后点击 **保存**。

代理只监听 `127.0.0.1:8787`，不保存 API Key。使用完毕后关闭代理窗口即可。

> 若 DeepPCB 官方之后放行 EasyEDA 来源，可把 API 地址改回 `https://api.deeppcb.ai/api/v1` 直连，不再需要代理。

## 常见问题

**测试连接提示 401 / 403**
API Key 无效或过期。请到 [app.deeppcb.ai/integration](https://app.deeppcb.ai/integration) 重新生成，并在设置中保存。

**额度不足**
按 `creditsCostPerMinute × 分配时间` 估算费用。请到 [app.deeppcb.ai/time-balance](https://app.deeppcb.ai/time-balance) 充值，或减少分配时间。

**提示 CORS / Failed to fetch**
按上面的“连接失败 / 提示 CORS 时”下载代理包，解压并双击启动脚本，然后在设置中点击 **使用本地代理**。

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

## 设置项

| 设置 | 默认值 | 说明 |
| --- | --- | --- |
| API Key | 空 | DeepPCB 个人 API Key |
| API 地址 | `https://api.deeppcb.ai/api/v1` | 使用本地代理时改为 `http://127.0.0.1:8787/api/v1` |
| 默认分配时间 | 45 分钟 | 新建任务时的初始时长 |
| 自动导入新方案 | 开启 | 新方案到达时自动写回当前 PCB |

API Key 仅保存在本机扩展配置中；请求只会发送给你在设置中配置的 API 地址（DeepPCB 或本地代理）。

## 菜单

| 菜单项 | 说明 |
| --- | --- |
| **Open DeepPCB** | 打开 DeepPCB 面板 |
| **New Routing Job...** | 打开面板并聚焦新建任务 |
| **Settings...** | 打开 API Key / 网络 / 默认时间设置 |

## 工作原理

1. 扩展把当前 PCB 导出为 Specctra DSN 并上传到 DeepPCB。
2. DeepPCB 云端 AI 在分配时间内生成布线方案。
3. 扩展下载 SES 结果并导入当前 PCB。

## 从源码构建

```bash
npm install
npm run build
```

构建产物位于 `build/dist/deeppcb-autorouter_v<版本号>.eext`。

版本号从 `0.0.1` 开始，每次 `npm run build` 自动 +1；每 30 次进 1 位（`0.0.30` → `0.1.0`）。`npm run build` 还会自动生成 `tools/deeppcb-proxy.zip`。

## 致谢与许可

- 参考项目：[instadeepai/deeppcb-kicad-plugin](https://github.com/instadeepai/deeppcb-kicad-plugin)，Copyright 2026 InstaDeep Ltd.，Apache-2.0。
- DeepPCB 名称与 Logo 归 InstaDeep Ltd. 所有；Logo 取自上游仓库。
- 本项目以 Apache-2.0 许可发布，详见 [LICENSE](./LICENSE) 与 [NOTICE](./NOTICE)。

---

## English

**DeepPCB AI Autorouter for EasyEDA Pro** exports the current PCB as Specctra DSN, routes it with the DeepPCB cloud AI engine, downloads the SES result and imports it into the open PCB.

- Install the `.eext` from **Settings → Extensions → Install from File**, enable it, and allow external network access.
- Get an API key at [app.deeppcb.ai/integration](https://app.deeppcb.ai/integration).
- **DeepPCB is paid: top up your own credits** at [app.deeppcb.ai/time-balance](https://app.deeppcb.ai/time-balance). This extension does not provide credits or shared accounts.
- If you see a CORS / `Failed to fetch` error, click **Download proxy package** in Settings, unzip it, then double-click `start-proxy.bat` (Windows) or `start-proxy.command` (macOS). The launcher checks Node.js 18+ and downloads a portable copy into the folder if needed. Then click **Use local proxy** and **Test connection**.
- Menus: **PCB → DeepPCB AI Autorouter → Open DeepPCB / New Routing Job / Settings**.
- License: Apache-2.0. DeepPCB name and logo belong to InstaDeep Ltd.; logo assets come from the upstream repository.
