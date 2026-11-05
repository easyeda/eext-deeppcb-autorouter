DeepPCB 本地代理包 / DeepPCB local proxy
========================================

Windows
-------
1. 解压本压缩包到任意文件夹。
2. 双击 start-proxy.bat。
3. 如果电脑没有 Node.js，脚本会询问是否下载便携版（约 41 MB）到当前目录；选 Y 即可。
4. 保持窗口打开。
5. 回到 EasyEDA 扩展设置：Use local proxy → Test connection → Save。

macOS
-----
- 双击 start-proxy.command。若系统提示无法打开，右键 → 打开。
- 没有 Node.js 时，脚本会询问是否下载便携版到当前目录。

Linux
-----
- 在终端运行：bash start-proxy.sh

说明
----
- 代理只监听 http://127.0.0.1:8787，不保存 API Key。
- 使用完毕后关闭窗口即可。
- 便携版 Node.js 从官方 https://nodejs.org/ 下载，并校验 SHA-256。

English
-------
- Windows: double-click start-proxy.bat. If Node.js 18+ is missing, it offers to
  download a portable copy into this folder.
- macOS: double-click start-proxy.command (right-click -> Open if blocked).
- Linux: run `bash start-proxy.sh`.
- Keep the window open, then use "Use local proxy" in the extension settings.
- The proxy listens on http://127.0.0.1:8787 only and does not store your API key.
