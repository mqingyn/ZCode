# Onyx 个人构建说明

本分支（`onyx-client`，基于 `zcode-new`）是个人自用的定制衍生版，基于 ZCode 开源版（Apache-2.0）同步维护。
产品身份为 **Onyx**，目标是完全自主可控：无官方账号、无官方服务依赖、数据目录独立。
上游同步（`chore: sync ZCode source`）后按本文「同步后重放」逐项恢复。

> **变更台账**：所有定制改动的 commit 级明细（文件清单、代码锚点、冲突处置）见 [ONYX-CHANGES.md](ONYX-CHANGES.md)。新增定制改动时先读其「登记规范」。

## 一、身份覆盖点

| 文件 | 字段 | 值 |
| --- | --- | --- |
| `packages/desktop/scripts/desktop-product-identity.mjs` | `PRODUCTION_IDENTITY` / `PREVIEW_IDENTITY` | `appId: dev.onyx.app(.preview)`、`productName: Onyx (Preview)`、`linux*: onyx` |
| `packages/desktop/src/main/desktopRuntimeEnv.ts` | `runtimeApplicationName` | `"Onyx Dev"` / `"Onyx Preview"` / `"Onyx"` |
| `packages/desktop/package.json` | `productName` | `"Onyx"` |

派生：`Onyx.app`、可执行名、安装包文件名、菜单栏/关于页/进程名、Electron userData（`~/Library/Application Support/Onyx`）。

## 二、官方能力剥离（本分支新增）

| 覆盖点 | 内容 | 效果 |
| --- | --- | --- |
| `packages/shared/src/zcodeEndpoint.ts` | `DEFAULT/TEST_ZCODE_ENDPOINT_ORIGIN` → `http://127.0.0.1:9`；`DEFAULT_WEB_REMOTE_CONTROL_RELAY_WS_URL` → `ws://127.0.0.1:9/...` | 官方控制面全部失效：Coding Plan 网关、额度重置、会话分享、反馈工单、Bots、远控 relay、官方市场在线目录、启动期提供商目录/业务配置后台刷新——全部请求立即失败并按既有未登录路径静默降级 |
| `packages/services/src/oauth/oauthService.ts` | `ONYX_ACCOUNT_LOGIN_DISABLED = true`，`startOAuthInternal` 入口熔断 | 所有 OAuth 登录发起（zai/bigmodel，桌面/Web/CLI 任何入口）直接抛错，应用保持全局未登录态 |

**保留不动**（不依赖登录的能力）：模型推理 API（bigmodel.cn / api.z.ai + 自配 API key provider）、用量查询（用自配 key 查 BigModel monitor 接口）、GitHub/CDN zip/本地 zip 插件源、个人市场、Claude 插件兼容、任意 stdio/http MCP、skills/commands/hooks 双层目录、SSH/WSL/Docker 远程工作区、自托管 Web/服务端。

**刻意保留的标识**：`.zcode-plugin/plugin.json` 是插件清单格式标记（兼容所有现成插件，等同 `.claude-plugin`），**不得**改名；`restore-legacy-sessions-plugin` 继续扫描旧 `~/.zcode`（其职责就是迁移旧数据）；`com.zcode/*` 为 MCP 协议标识符。

## 三、数据目录 `~/.zcode/` → `~/.onyx/`（本分支新增）

- 全量替换运行时代码中的 `".zcode"` 路径字面量（约 70 个文件：services/desktop/shared/adapters/bootstrap/scripts/dev-docs），含两处特殊点：`packages/shared/src/zcode-agent-runtime.ts` 的 `nativeConfigDir: ".onyx/cli"`；`~/.zcode` 波浪号字面量（`file-config.adapter.ts`、`create-app.ts` 等）。
- 项目级工作区约定同步改为 `.onyx/`（`<repo>/.onyx/config.json`、`.onyx/workflows` 等）——Onyx 与官方 App 在同一项目互不干扰，各自读自己的目录。
- 收口优先级不变：`setDataBaseDir() > ZCODE_DATA_BASE_DIR > homedir()`（`packages/services/src/paths.ts`）。

**一次性数据迁移**（把官方 App 里的本地数据带到 Onyx，凭据除外）：

```bash
mkdir -p ~/.onyx
cp -a ~/.zcode/AGENTS.md ~/.zcode/skills ~/.zcode/cli ~/.zcode/workspace ~/.onyx/ 2>/dev/null
cp -a ~/.zcode/v2 ~/.onyx/ && rm -f ~/.onyx/v2/credentials.json
```

## 四、自定义 provider 用量查询（本分支新增）

不登录官方账号时，自配的 BigModel/Z.AI provider（API key 直连）也能在设置页「用量统计」中查看剩余额度。

| 覆盖点 | 内容 |
| --- | --- |
| `packages/ui/src/lib/sidebarUsageCodingPlanProviderPreference.ts` | `SidebarUsageCodingPlanSourceId` 增加 `` `custom:${string}` `` 分支 |
| `packages/ui/src/lib/codingPlanUsageSources.ts` | 新增 `buildCustomProviderUsageSource()` |
| `packages/ui/src/SettingsPage.tsx` | `usagePersonalCodingPlanSources` 扫描自定义 provider：`enabled + api-key access + baseUrl 含 bigmodel.cn/api.z.ai + 有 apiKey` |
| `packages/services/src/node.ts` | `createUsageStatsService` 注入 `resolveApiAuthorization`，从 provider 配置提取 API key 并构建 quota URL |

**触发条件**：自定义 provider 满足 `enabled=true` + `access.type="api-key"` + `api.baseUrl` 包含 `bigmodel.cn` 或 `api.z.ai` + 有 `apiKey`。

## 五、图标与 Logo（本分支新增）

设计：黑色圆角方块 + 钛金属渐变 "O" 环 + 水平切口（缟玛瑙层带）。**主源文件：`public/logo/onyx-master.svg`（已入仓库）**；重新生成全尺寸：`qlmanage -t -s <size> -o <outdir> public/logo/onyx-master.svg`（macOS），`icon.icns` 用 iconutil 从 iconset 构建，`icon.ico` 为 16–256 七档 PNG 打包。

| 覆盖点 | 内容 |
| --- | --- |
| `public/logo/icons/` | 9 档 PNG（16–1024）+ `icon.icns` + `icon.ico` 全部替换 |
| `packages/desktop/build/` | `icon.{icns,ico,png}`、`icon_installer.{icns,ico,png}`、`icon_windows.png`、`icons/` 9 档 PNG 全部替换 |
| `packages/ui/src/assets/onyx-logo.svg` | 新增 Onyx 应用 logo（UI 内使用） |
| `packages/ui/src/App.tsx`、`packages/ui/src/components/mobile-ui/ZCodeAppLogo.tsx` | 应用 logo 引用从 `logo-zai.svg` 切换到 `onyx-logo.svg`（Web 登录页与远控品牌位经 `ZCodeAppLogo` 自动生效） |

**保留**：`provider-icons/logo-zai.svg` 仍由 `oauthProviderIcon.tsx` 使用——那是 Z.AI **供应商**品牌图标，不是应用 logo。

## 六、构建期可选能力：默认全关，无需处理

按 `docs/desktop/build-time-optional-capabilities.md`，ARMS 监控、数仓事件上报、桌面自动更新由构建期配置注入，开源导出不含私有默认配置，本仓库构建产物默认零遥测、零更新检查。

## 七、已知影响

- 登录/套餐/额度重置领取/分享/反馈/远控/官方市场在线目录：不可用（by design）。
- `appId` 变更后 macOS 视为全新应用，首次运行需重新授予系统权限。
- 与官方 ZCode App 可并存：数据目录（`~/.onyx` vs `~/.zcode`）、Electron userData、项目级 `.onyx/` vs `.zcode/` 全部隔离。
- 测试文件未随路径改名（个人构建以 typecheck/lint 为门禁，不跑全量测试）。

## 八、同步后重放

上游 sync 后如冲突，按序检查：

1. 身份覆盖点（第一节表格 3 个文件）；
2. `zcodeEndpoint.ts` 两个 origin 常量 + relay URL 是否被上游覆盖回官方地址；
3. `oauthService.ts` 熔断常量与 `startOAuthInternal` 入口 guard；
4. 自定义用量查询：`node.ts` 的 `resolveApiAuthorization` 注入、`codingPlanUsageSources.ts` 的 `buildCustomProviderUsageSource`、`sidebarUsageCodingPlanProviderPreference.ts` 的 `custom:` 分支；
5. 图标：`public/logo/icons/`、`packages/desktop/build/` 及 `icons/` 下的 PNG/icns/ico 是否被上游覆盖回 Z 字标；`App.tsx`、`ZCodeAppLogo.tsx` 的 `onyx-logo.svg` 引用是否被还原；
6. 路径复查：`git grep -n '"\.zcode"' -- packages apps scripts | grep -vE 'restore-legacy|zcode-plugin|\.test\.|/test/|\.md:'`，命中的行改回 `".onyx"`；再查 `git grep -n '"~/.zcode'`。

提交记录：`eb2259a8 rename for personal`（身份）；本批为目录迁移 + 官方剥离（待提交）。
