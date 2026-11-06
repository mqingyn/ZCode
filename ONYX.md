# Onyx 个人构建说明

本分支（`zcode-new`）是个人自用的定制衍生版，基于 ZCode 开源版（Apache-2.0）同步维护。
产品身份为 **Onyx**，仅改动"身份外表面"，内部实现与上游保持一致，便于随 `chore: sync ZCode source` 持续同步。

## 身份覆盖点（同步上游后如冲突，按此表重新应用）

| 文件 | 字段 | 值 |
| --- | --- | --- |
| `packages/desktop/scripts/desktop-product-identity.mjs` | `PRODUCTION_IDENTITY` | `appId: dev.onyx.app`、`productName: Onyx`、`linuxExecutableName/PackageName: onyx` |
| `packages/desktop/scripts/desktop-product-identity.mjs` | `PREVIEW_IDENTITY` | `appId: dev.onyx.app.preview`、`productName: Onyx Preview`、`linux*: onyx-preview` |
| `packages/desktop/src/main/desktopRuntimeEnv.ts` | `runtimeApplicationName` | `"Onyx Dev"` / `"Onyx Preview"` / `"Onyx"` |
| `packages/desktop/package.json` | `productName` | `"Onyx"` |

由上述字段自动派生：`Onyx.app` 包名、`Contents/MacOS/Onyx` 可执行名、安装包文件名（`Onyx-<version>-...`）、菜单栏/关于页显示名。

## 刻意保留、不参与改名的内容

- `LICENSE`、`NOTICE.md`、`THIRD-PARTY-NOTICES.md`：Apache-2.0 署名与第三方声明，衍生的许可义务。
- `ZCODE_ENV`、`ZCODE_PREVIEW_IDENTITY`、`ZCODE_DESKTOP_APPLICATION_NAME` 等环境变量：功能开关，非品牌表面。
- `~/.zcode/`（CLI 会话库、凭据、插件缓存）与 `@zcode/*` 包名、`zcode-protocol` 等内部标识：数据与实现细节，改名只有成本没有收益。
- `desktopLinuxDeepLinkRegistration.ts` 的 Linux 桌面注册默认名、`resolveWindowsAppUserModelIdForFlavor` 的 Windows 开发态 `cn.aminer.zcode`：非 macOS 使用面，保留。

## 构建期可选能力：默认全关，无需处理

按 `docs/desktop/build-time-optional-capabilities.md`，ARMS 监控、数仓事件上报、桌面自动更新三项均由构建期配置注入，开源导出不包含私有默认配置（`config/private/build-defaults.json` 仅存在于内部仓库），因此本仓库构建产物**默认零遥测、零更新检查**。如需启用须在构建时显式设置 `ZCODE_ARMS_RUM_ENDPOINT` / `ZCODE_TELEMETRY_REPORT_ENDPOINT` / `ZCODE_AUTO_UPDATE`——个人构建保持不设置即可。

## 已知影响

- appId 变更后，macOS 视为全新应用，首次运行需重新授予系统权限（如辅助功能等）。
- Electron userData 目录随 `runtimeApplicationName` 变为 `~/Library/Application Support/Onyx`（开发态 `Onyx Dev`）；`~/.zcode` 下的会话与凭据不受影响。如需带走内嵌浏览器登录态等 Electron 层数据，执行一次：
  `mv ~/Library/Application\ Support/ZCode ~/Library/Application\ Support/Onyx`
