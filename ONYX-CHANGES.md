# Onyx 个人版变更登记簿

> 用途：记录 `onyx-client` 分支相对上游（ZCode 开源版）的每一处定制改动，绑定 commit ID，供后续 `chore: sync ZCode source` 合并上游时快速核对与恢复。
>
> 配合 [ONYX.md](ONYX.md) 使用：ONYX.md 是「是什么/为什么」的策略文档，本文是「何时改的/改了哪些文件/冲突了怎么办」的操作台账。

## 一、登记规范（后续新增改动必读）

每次定制改动遵循以下流程，**否则上游合并时无法低成本恢复**：

1. **一个主题一个 commit**：不把不同主题的改动混在一个 commit 里（例如「改端点」和「换图标」分开提交）；
2. **commit message 前缀**：定制改动用 `onyx:` 前缀（如 `onyx: 禁用官方市场在线目录`），一眼可与上游 sync commit 区分；
3. **登记本文档**：在「二、变更总览」加一行，在「三、变更档案」加一节，包含：commit ID、文件清单、代码锚点（函数名/常量名，不写行号——行号会漂移）、冲突处置方式、验证命令；
4. **批量替换类改动**（如 `.zcode → .onyx` 的 70 文件替换）必须登记**复查命令**（一条 git grep），而不是逐文件罗列；定点改动（常量、函数、小段新增）必须逐文件登记；
5. **新增文件优先于修改**：能新增文件解决的（如 `onyx-logo.svg`），不改上游文件——新增文件永不冲突；
6. **修改上游文件时**：改动越小越好、越靠近文件首尾越好（中间段落冲突率最高）；能在文件头加常量开关的，不改函数体内部逻辑。

## 二、变更总览

| Commit | 主题 | 文件数 | 性质 |
| --- | --- | --- | --- |
| `eb2259a8` | 产品身份：Onyx 命名 | 4 | 定点常量替换 |
| `1380bd0c` | 官方能力剥离 + 数据目录迁移 + 自定义用量查询 | 85 | 混合：3 处定点 + 批量替换 + 2 处新增函数 |
| `869b8286` | 图标与 Logo：钛金属 O 环 | 32 | 二进制替换 + 新增 SVG + 2 处 import 修改 |
| `361b4fda` | UI 文案路径提示修正 | 2 | 定点字符串替换 |
| `9db3984d` | 图标圆角外白底修复为透明 | 27 | 二进制重渲替换 |
| `d9c8f413` | UI 净化：欢迎页/模型设置/侧栏登录入口 | 9 | 新增开关文件 + 7 处定点门控 |
| `f0270d35` | DMG 安装窗口背景图改字 ZCODE → ONYX | 2 | 二进制重绘替换 |
| `fe6a6cf3` | 图标 Apple 网格 82% 边距（修 Dock 运行时变大）+ 启动 splash 换 Onyx 环 | 28 | 二进制重渲 + HTML 内嵌 SVG 替换 |
| `a1ad2edd` | 禁用官方 Coding Plan 网关改写（模型请求直连原始 URL） | 1 | 定点常量守卫 |
| `2c9bd8ac` | CLI 命令彻底改名 zcode→onyx | 14 | bin 字段 + 打包脚本命名 + Usage 文本 + TUI 品牌 |
| `f9ec1bad` | 菜单一键安装 onyx CLI 命令 | 5 | 新增安装器模块 + 命令 ID/文案/菜单/handler 四点接线 |
| `cc35917d` | 清除剩余 Z 字标（4 处内嵌 SVG） | 4 | 组件/HTML 内嵌 SVG 替换 |

基线：上游 `a9fe401e chore: sync ZCode source v3.17.2`。

## 三、变更档案

### `eb2259a8` — 产品身份：Onyx 命名

| 文件 | 锚点 | 改动 |
| --- | --- | --- |
| `packages/desktop/scripts/desktop-product-identity.mjs` | `PRODUCTION_IDENTITY` / `PREVIEW_IDENTITY` 两个常量对象 | `appId`/`productName`/`linuxExecutableName`/`linuxPackageName` → onyx 系 |
| `packages/desktop/src/main/desktopRuntimeEnv.ts` | `runtimeApplicationName` 三元表达式 | `"ZCode*"` → `"Onyx*"`（此值同时决定菜单栏名与 Electron userData 目录名） |
| `packages/desktop/package.json` | `"productName"` 字段 | `"ZCode"` → `"Onyx"` |
| `ONYX.md` | 新增文件 | 策略文档（本文件的姊妹篇） |

**冲突处置**：上游若改了 `desktop-product-identity.mjs` 同一常量对象，保留上游结构变化，重新套 Onyx 值（4 个字段逐一核对）；`desktopRuntimeEnv.ts` 同理，只需保三元表达式的三个字符串。

**验证**：`node -e "import('./packages/desktop/scripts/desktop-product-identity.mjs').then(m=>console.log(m.desktopProductIdentities.production.productName))"` 应输出 `Onyx`。

### `1380bd0c` — 官方能力剥离 + 数据目录迁移 + 自定义用量查询

本 commit 含三个独立主题（历史原因合并提交，后续同类改动应拆分）。

**主题 A：官方控制面剥离（定点）**

| 文件 | 锚点 | 改动 |
| --- | --- | --- |
| `packages/shared/src/zcodeEndpoint.ts` | `DEFAULT_ZCODE_ENDPOINT_ORIGIN`、`TEST_ZCODE_ENDPOINT_ORIGIN`、`DEFAULT_WEB_REMOTE_CONTROL_RELAY_WS_URL` 三个导出常量 | 官方地址 → `127.0.0.1:9` 死端口；一行覆盖恢复官方 |
| `packages/services/src/oauth/oauthService.ts` | 文件级常量 `ONYX_ACCOUNT_LOGIN_DISABLED`；`startOAuthInternal` 方法首行 guard | 所有 OAuth 发起（桌面/Web/CLI 任何入口）熔断 |

**主题 B：数据目录 `~/.zcode` → `~/.onyx`（批量替换 + 1 定点）**

- 批量：约 70 个运行时代码文件的 `".zcode"`/`"~/.zcode"`/`".zcode/..."` 字面量 → `.onyx` 等价物（含项目级工作区目录约定，Onyx 与官方版同项目互不干扰）；
- 定点：`packages/shared/src/zcode-agent-runtime.ts` 的 `ZCODE_AGENT_RUNTIME.nativeConfigDir` → `".onyx/cli"`；
- **明确不改**：`.zcode-plugin/`（插件清单格式标记，改了现成插件装不上）、`restore-legacy-sessions-plugin`（职责就是扫描旧 `~/.zcode` 迁数据）、`com.zcode/*` MCP 协议标识符、测试文件；
- 冲突处置与复查命令见 ONYX.md「八、同步后重放」第 6 条（一条 git grep 扫回全场）。

**主题 C：自定义 provider 用量查询（新增函数 + 注入）**

| 文件 | 锚点 | 改动 |
| --- | --- | --- |
| `packages/services/src/node.ts` | `createUsageStatsService({...})` 调用处 | 注入 `resolveApiAuthorization`：从 provider 配置提取 API key，endpoint 含 `bigmodel.cn`/`api.z.ai` 时构建 quota URL |
| `packages/ui/src/SettingsPage.tsx` | `usagePersonalCodingPlanSources` useMemo | 尾部追加自定义 provider 扫描块（`enabled + api-key + baseUrl 匹配 + 有 key`） |
| `packages/ui/src/lib/codingPlanUsageSources.ts` | 新增 `buildCustomProviderUsageSource()` | 纯新增导出函数，不改已有代码 |
| `packages/ui/src/lib/sidebarUsageCodingPlanProviderPreference.ts` | `SidebarUsageCodingPlanSourceId` 类型 + `isSidebarUsageCodingPlanSourceId` | 增加 `` `custom:${string}` `` 分支 |

**冲突处置**：`node.ts` 是高危文件（上游常改），注入块尽量保持独立、紧贴 `createUsageStatsService({` 参数列表末尾；冲突时保留上游全部改动，重新粘贴注入块。`SettingsPage.tsx` 同理：扫描块在 useMemo 末尾 `return sources;` 之前，依赖数组末尾追加 `usageProviderSettingsView`。

**验证**：设置 → 模型供应商配一个 baseUrl 含 `bigmodel.cn` 的自定义 provider（填 Coding Plan key）→ 设置 → 用量统计应出现该来源 tab。

### `869b8286` — 图标与 Logo：钛金属 O 环

| 类别 | 文件 | 说明 |
| --- | --- | --- |
| 二进制替换 | `public/logo/icons/` 9 档 PNG + `icon.icns` + `icon.ico`；`packages/desktop/build/` 的 `icon.*`、`icon_installer.*`、`icon_windows.png`、`icons/` 9 档 | 打包/托盘/关于窗口图标 |
| 新增 | `public/logo/onyx-master.svg`（主源文件）、`packages/ui/src/assets/onyx-logo.svg`（UI 内用） | 新增文件永不冲突 |
| import 修改 | `packages/ui/src/App.tsx`、`packages/ui/src/components/mobile-ui/ZCodeAppLogo.tsx` | `logo-zai.svg` → `onyx-logo.svg`；后者 `data-app-logo` 测试钩子 `zcode` → `onyx` |

**保留**：`provider-icons/logo-zai.svg` 由 `oauthProviderIcon.tsx` 使用，是 Z.AI 供应商品牌图标，不属于应用 logo。

**冲突处置**：上游若更新图标，二进制文件整文件取舍（选 Onyx 版）；两个 import 行冲突时保留 `onyx-logo.svg`。

**重新生成**：`qlmanage -t -s <size> -o <outdir> public/logo/onyx-master.svg`（详见 ONYX.md 第五节）。

### `361b4fda` — UI 文案路径提示修正

| 文件 | 锚点 | 改动 |
| --- | --- | --- |
| `packages/ui/src/onboarding/OnboardingDialog.tsx` | `targetPath` 兜底文案 | `~/.zcode/AGENTS.md` → `~/.onyx/AGENTS.md` |
| `packages/ui/src/settings/commandsSettingsShared.ts` | `pathHint` | `~/.zcode/commands` → `~/.onyx/commands` |

**冲突处置**：纯文案，accept ours。

### `9db3984d` — 图标圆角外白底修复为透明

**背景**：`869b8286` 的图标由 `qlmanage` 渲染 SVG 生成，qlmanage 会在圆角外铺白底（原版图标该区域为透明）。改为 Swift + CoreGraphics 直绘（脚本不入库，设计参数以 `public/logo/onyx-master.svg` 为准）。

| 类别 | 文件 | 说明 |
| --- | --- | --- |
| 二进制重渲 | 与 `869b8286` 相同的 27 个图标文件 | 内容不变（钛金属 O 环），仅圆角外由白底改为透明 alpha |

**验证**：解码 PNG 首行首像素应为 `[0,0,0,0]`（透明）；`869b8286` 版为 `[255,255,255,255]`。

**教训（登记在案）**：`qlmanage -t` 渲染的 PNG **不保留透明度**，涉及圆角/透明底的图标一律用 CoreGraphics 直绘路径；SVG 源仅作设计稿。

### `d9c8f413` — UI 净化：欢迎页 / 模型设置 / 侧栏登录入口

**新增开关文件（零冲突）**：`packages/ui/src/lib/onyxBuildFlags.ts` —— `ONYX_HIDE_OAUTH_LOGIN` / `ONYX_HIDE_ACCOUNT_PROVIDERS` 两个常量，全部 UI 净化改动以此为锚点。

| 文件 | 锚点 | 改动 |
| --- | --- | --- |
| `packages/ui/src/WelcomeScreen.tsx` | import 区 / `loginMode` useState / providers 块渲染条件 / `LoginPanelLogo` | 默认进入 API key 模式；OAuth 渠道按钮整块不渲染；欢迎 logo 换 `onyx-logo.svg` |
| `packages/ui/src/login/LoginApiKeyForm.tsx` | 取消按钮渲染 | 开关开启时隐藏「取消」（无处可返回） |
| `packages/ui/src/i18n/locales/zh-CN.ts`、`en-US.ts` | `login.title` / `login.description` | 文案改为 Onyx（「配置模型 API Key，开始使用 Onyx」） |
| `packages/ui/src/settings/ModelProviderSection.tsx` | `presetProviders` memo | 开关开启时返回 `[]`（智谱 BigModel / Z.AI 预置供应商不进导航） |
| `packages/ui/src/settings/model-provider-section/useModelProviderNavigation.ts` | `navigationGroups` memo | preset 分组整体条件渲染（含 Start Plan 条目）；重构为 `presetGroup` 常量 + 条件展开 |
| `packages/ui/src/WorkspaceSidebarFooter.tsx` | 登录菜单项渲染条件 | 开关开启时隐藏侧栏账号菜单的「登录」项（rewards 项原本就按 `user` 门控，未登录自动隐藏） |

**冲突处置**：所有门控都是「条件块包住上游原代码」形态——冲突时保留上游结构，确认开关常量引用仍在即可。`useModelProviderNavigation.ts` 的 memo 被重构成 `presetGroup` 常量 + 条件展开，上游若改 preset items 构造，把同样内容搬进 `presetGroup.items` 即可。

**验证**：`pnpm dev:desktop` → 首次启动欢迎页只显示 Onyx logo + API key 表单（无 Z.ai/BigModel 按钮）；设置 → 模型供应商左侧只有「自定义供应商」分组；侧栏账号菜单无「登录」项。

### `f0270d35` — DMG 安装窗口背景图改字 ZCODE → ONYX

| 文件 | 改动 |
| --- | --- |
| `packages/desktop/build/dmg_background.png`（540×380）、`dmg_background@2x.png`（1080×760） | 字标区域逐行克隆左侧同高度背景（贴合原图纵向渐变），居中绘制 ONYX（boldSystemFont 152pt @2x，字色采样原 Z 笔画）；装饰图标与箭头不动 |

**冲突处置**：上游若更新背景图，整文件取 Onyx 版后用同一方法重绘（采样字色 + 逐行克隆 + 居中绘制）。

**教训（登记在案）**：背景有渐变/纹理时平涂会留下矩形补丁缝，必须逐行克隆同高度干净区域。

### `fe6a6cf3` — 图标 82% 边距修复 + 启动 splash 换 Onyx 环

| 文件 | 改动 |
| --- | --- |
| `public/logo/icons/`、`packages/desktop/build/`（含 `icons/`）全部 27 个图标文件 | 重渲：内容区按 Apple 图标网格缩至画布 82%（原版实测 842/1024），四周透明边距 |
| `packages/desktop/src/renderer/index.html` | 启动 splash 内嵌 Z 字 SVG → Onyx 钛金属环（切口用 mask 挖空透出壳底渐变，无色差） |

**根因**：Dock 未运行时读 bundle icns，运行时被 `desktopWindowChrome.ts` 的 `applyAppIcon()`（`app.dock.setIcon(icon.png)`）覆盖；此前全出血 PNG 在运行时显示得更大。原版图标内容区 82% 才是标准尺寸。

**教训（登记在案）**：macOS 图标内容区必须占画布约 82%（Apple 图标网格），全出血会导致 `dock.setIcon` 运行时图标偏大；SVG 切口叠在渐变底色上时用 mask 透明镂空，不用实色平涂。

### `cc35917d` — 清除剩余 Z 字标（4 处内嵌 SVG）

| 文件 | 锚点 | 说明 |
| --- | --- | --- |
| `packages/ui/src/root/RootStartupLoading.tsx` | `ZCodeStartupLogo` 组件 SVG | React 接管后的启动加载屏（应用启动闪现 Z 的来源）；`ZCodeStartupLogoBadge` 消费方（标题栏 `DesktopTopOverlay`、`WindowsTopLeftLogo`、职业引导）随组件一次性生效 |
| `packages/ui/src/components/ui/ZCodeAboutLogo.tsx` | `ZCodeAboutLogo` / `ZCodeWordmarkLogo` | 环形 SVG + Wordmark 改为文字 "Onyx" 占位；消费方（WelcomeScreen 回退、HighspeedShareNoticeCard）随组件生效 |
| `packages/web/index.html` | boot-loading 内嵌 SVG | Web 版 splash |
| `packages/desktop/src/main/aboutWindow.ts` | 关于窗口 `app-logo` 内嵌 SVG | 关于窗口 logo |

各处 SVG 的渐变/mask 使用独立 ID（`onyxTiStartup`/`onyxTiAboutLogo`/`onyxTiWeb`/`onyxTiAboutWin`），避免同页多实例 ID 冲突。残留复查：`git grep -rln "M134.4 0.130152\|102.401 217.732" -- .` 应为空。

### `a1ad2edd` — 禁用官方 Coding Plan 网关改写

| 文件 | 锚点 | 改动 |
| --- | --- | --- |
| `apps/zcode-cli/packages/adapters/src/model/official-coding-plan-gateway.ts` | 常量 `ONYX_GATEWAY_REWRITE_DISABLED` + `resolve()` 首个守卫分支 | 改写表留档供上游对照，命中也一律返回 routed:false，模型请求直连原始 URL |

**背景**：官方客户端会把 `open.bigmodel.cn/api/anthropic/v1/messages`、`api.z.ai/api/anthropic/v1/messages` 两个 URL 的模型请求改写到 `zcode.z.ai/api/v1/ultra[-zai]/...` 网关（账号计费代理，需登录派生凭据）。Onyx 已剥离登录且控制面端点指向死端口，改写只会把可直连的官方 Anthropic 端点改坏。禁用后，自定义 provider 配 `https://open.bigmodel.cn/api/anthropic`（Anthropic 协议 + 套餐 key）即可直连官方同款端点，按套餐额度计费。

**事故记录**：本补丁最初误提交并推送到 `main`（`2a81a11e`，当时 HEAD 意外停留在 main），已 cherry-pick 回 onyx-client 并将 main 强推回上游基线 `a9fe401e`。教训：跨回合工作前先 `git branch --show-current` 确认 HEAD；推 main 前必须显式核对目标分支。

### `2c9bd8ac` — CLI 命令彻底改名 zcode → onyx

| 文件 | 锚点 | 改动 |
| --- | --- | --- |
| `apps/zcode-cli/packages/cli/package.json` | `bin` 字段 | `onyx: ./dist/zcode.cjs`（**内部 bundle 文件名 zcode.cjs 保留**——桌面包按 `ZCODE_AGENT_RUNTIME.nodeBundleEntryFile` 引用它，改文件名会级联到 bundle/SEA 装配且零用户可见收益） |
| `scripts/build-zcode.mjs` | `packageDirName` / `defaultOutDir` / runner 目标 / latest.json `name` / 包名 | dist 包根目录、`bin/onyx.mjs`、onyx-runtime |
| `scripts/zcode-distribution/runner.mjs` | usage 文本 | `onyx --web` 等 |
| `scripts/zcode-distribution/installer.mjs` | `packageDirName` / `$BIN_DIR/onyx` 包装器 / 提示语 | **顺带修复遗留**：`$HOME/.zcode/runtime` → `$HOME/.onyx/runtime` |
| `apps/zcode-cli/packages/cli/scripts/sea-targets.mjs`、`build-sea.mjs` | `outputBinaryName` / sea blob 名 | 单文件可执行产物 `onyx-<platform>-<arch>` |
| `cli/src/commands-command.ts`、`login-command.ts`、`plugins-command.ts`、`skills-command.ts` | Usage 文本 | `Usage: onyx ...` |
| `packages/tui/src/app-sidebar.tsx` | `PRODUCT_NAME` | TUI 侧栏品牌名 Onyx |
| `scripts/doctor-macos-release-app.sh` | `ZCODE_HOME_DIR` 等 | 修复遗留 `$HOME/.zcode` → `.onyx` |
| `scripts/zcode-distribution.test.mjs`、`cli/tests/build-sea.test.mjs` | 端到端断言同步 | 安装器测试通过（5✔1✖——✖ 为 node-pty 预编译在本环境缺 node_modules 的既有环境问题，与改名无关） |

**副作用核实（比预判更干净）**：搜索加速的 shell prelude 默认后端是 `native-binaries`（bfs/ugrep/rg 绝对路径），`zcode __internal-search` 的 internal-cli 后端只在测试夹具中出现、生产无引用——命令改名对搜索加速**零影响**。桌面版 spawn 的是包内资源路径的 agent，不经 PATH 命令名。

**刻意不改**：`dist/zcode.cjs` 内部文件名、`pnpm build:zcode` 脚本名、上游文档（`apps/zcode-cli/docs/**`、README CLI 章节）——dev/文档面改名只有 sync 冲突没有收益；命令名映射以本节为准。

### `f9ec1bad` — 菜单一键安装 onyx CLI 命令

| 文件 | 锚点 | 改动 |
| --- | --- | --- |
| `packages/desktop/src/main/installOnyxCliCommand.ts` | 新增文件 | 安装器：macOS only；校验包内 `Resources/glm/zcode.cjs` 存在 → 写 `~/.local/bin/onyx` 包装器（`ELECTRON_RUN_AS_NODE=1 exec <Electron> <bundle>`，0o755）→ PATH 检查，缺 PATH 时弹窗给出 `.zshrc` 导出提示 |
| `packages/shared/src/platform.ts` | `DesktopCommandIds.InstallOnyxCliCommand` | 新命令 ID |
| `packages/shared/src/desktopMenu.ts` | `helpInstallCliCommand` + zh/en 文案 | 「安装 onyx 命令行工具 / Install onyx command」 |
| `packages/desktop/src/main/desktopApplicationMenu.ts` | 帮助菜单「导出日志」后 | darwin 条件渲染菜单项 |
| `packages/desktop/src/main/desktopCommandHandlers.ts` | dispatch `InstallOnyxCliCommand` | 调用安装器 |

**已实测**（对官方 ZCode.app 包模拟安装流程）：`~/.local/bin/onyx` 包装器生成后 `onyx --version`（0.17.1）、`onyx doctor` 正常——机制与打包产物无关，Onyx.app 同构。

**修复（f02978f6，用户报告）**：安装的 onyx 命令跑 TUI 报 `Cannot find package '@zcode/tui'`——agent bundle 的 TUI 是 external，官方桌面只跑 app-server 故刻意不带 TUI（prepare-agent-node-bundle.mjs 头注释）。修复：新增 `packages/desktop/scripts/stage-tui-runtime-into-glm.mjs`（复用 SEA 的 collectSeaTuiAssets 收集器，按宿主平台把 @zcode/tui 及依赖含原生包 staged 到 `glm/node_modules/`，extraResources 不受 asar native 门禁限制）；接入 `prepare-agent-node-bundle.mjs` 的 `stageBundle()`；`build-desktop-agent-cli.mjs` 构建清单补 `@zcode/tui`（其 dist 为运行时入口）。包体约增几十 MB（opentui/react/node-pty natives）。

### `f4ade077` — 外露面 ZCode 全量收敛

| 域 | 改动 |
| --- | --- |
| i18n 文案 | `packages/ui/src/i18n/locales/zh-CN.ts`（137 处）/ `en-US.ts`（138 处）值级替换；CLI i18n 包 `apps/zcode-cli/packages/i18n/locales/*` 启动串 |
| 菜单/托盘/关于页 | `shared/src/desktopMenu.ts`（tray tooltip、打开/关于菜单）、`desktop/src/main/about.ts` 版权、renderer/web `index.html` 的 `<title>` |
| 进程名 | `shared/src/process-names.ts` 前缀 `zcode`→`onyx`（host/renderer/agent/gpu/utility 全部随前缀派生）、`node-repl-host` MCP 进程标题、CLI `CLI_PROCESS_NAME` |
| 对话框/错误串/远程提示 | `desktopCommandHandlers.ts` 清数据确认框（含 ~/.onyx/v2 事实修正）、`exportLogs.ts` 导出归档目录前缀、server/remote 提示、feedback/lock/OpenRouter 头、CLI/TUI 输出文本 |
| Windows 安装清单 | `.zcode-install-manifest` → `.onyx-install-manifest`（installer.nsh + electron-builder.config.js） |

**执行方式**：正则限定“仅字符串字面量内”替换（标识符、注释、模块路径不动），随后人工修复两类误伤：① 模板字符串 `${}` 插值里的函数名（6 处，已回退为 ZCode* 原名）；② 跨进程错误串匹配（UI `conversationProjectionStore` 过滤串与服务端抛错文案对齐为 Onyx*）。

**冲突处置**：批量文件均为字符串值替换，冲突时 accept ours 后跑复查命令。
**复查命令**：`git grep -rn '"ZCode' -- packages apps --include="*.ts" --include="*.tsx" | grep -vE "test|/tests/|import|type |ZCode[A-Z]"` —— 命中应仅剩 wdio.conf（E2E 配置）与插件内 dev 工具等刻意保留项。

**修复（8bcd5ab4）**：electron-builder 的 extraResources 复制会忽略被复制目录**顶层**的 node_modules（filter 正则无法覆盖该内置忽略；嵌套的不管——koffi 先例即嵌套路径）。改为 afterPack 钩子直接把 staged 的 glm/node_modules 拷进 .app（位于 zip/DMG 出包前，产物必然包含）。实测：DMG 236MB（+11MB），挂载内 glm/node_modules 68MB、@zcode/tui 在位。

**打包实操备忘**：必须带双镜像环境变量（仅 ELECTRON_MIRROR 不够，DMG 阶段下载 dmgbuild 走 GitHub 会 600s 超时）：
`ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/ pnpm bundle:desktop`

**架构门禁（d6d2452b）**：pre-push 的架构检查会把「上游 sync（v3.15.1→v3.17.2）引入的新文件」判为 unmanaged-new-file——根因是 fork 的 `architecture-policy.yaml` 未登记 sync 提交。已按机制设计把四次 sync 写入 `acceptedUpstreamCommits`（commit+previousHead+reason，与 acceptedUpstreamSnapshot 互斥、已移除 snapshot 行）。**后续每次上游 sync 后必须把新的 sync commit 追加进该列表**，否则 pre-push 会被误报拦截。

**教训（登记在案）**：字符串级批量替换必须排除 `${}` 插值区；跨进程“字符串契约”（错误消息 startsWith/includes 匹配）改名要两侧同步，先查消费侧再改生成侧。

**修复（779e7caa，用户报告）**：`workspace-hook-config.ts` / `workspace-hook-mutation.ts` 的 `".zcode/config.json"` kind 字面量是批量替换漏网（带 `/config.json` 后缀不匹配精确模式），导致候选路径构造（已是 `.onyx`）与 kind 归类（仍是 `.zcode`）分裂——自动发现的 workspace hook 配置永远归错类、可编辑性校验必败。已对齐为 `.onyx/config.json`（`zcode.json` 平面文件名保留）。测试文件未同步（既定策略）。

**修复（e077dabc）**：冷启动 wrapper 缺少 Host 会注入的 `ZCODE_BUILTIN_PROVIDER_CONFIG_FILE`，CLI 按相对入口探测打包布局失败并报"无法定位 CLI ZCode Built-in Provider Config"。wrapper 现在注入 `Resources/config/provider/zcode-builtin.json`（存在时），与 Host 拉起 agent 的约定一致。
**设计要点**：复用包内 Electron 作 Node 运行时，目标机器无需安装 Node；包装器含 Generated 注释，重复点击菜单安全幂等。

## 四、冲突高发预警（按改动性质分级）

| 级别 | 文件 | 原因 |
| --- | --- | --- |
| 🔴 高 | `packages/services/src/node.ts` | 服务装配总线，上游每次发版必动；我们的注入块在参数列表中 |
| 🔴 高 | `packages/ui/src/SettingsPage.tsx` | 巨型文件（2000+ 行），上游 UI 迭代热点；我们的扫描块在 useMemo 内 |
| 🟡 中 | `packages/shared/src/zcodeEndpoint.ts` | 端点常量文件，上游改端点结构时冲突；好在我们只动 3 个常量值 |
| 🟡 中 | `packages/desktop/scripts/desktop-product-identity.mjs` | 身份常量，上游加新身份维度时冲突 |
| 🟢 低 | 批量路径替换文件（约 70 个） | 上游单文件改动率低的居多；用复查命令兜底，不逐个盯 |
| 🟢 零 | `ONYX.md`、`ONYX-CHANGES.md`、`onyx-logo.svg`、`onyx-master.svg` | 新增文件，上游不会碰 |

## 五、合并上游标准流程（merge playbook）

```bash
# 1. 同步前：工作区干净，记录当前 HEAD
git status --short && git log --oneline -1

# 2. 拉上游（上游 sync 是压缩大 commit，逐 commit rebase 无意义，直接 merge/cherry-pick 该 commit）
git fetch origin main
git merge origin/main        # 或按仓库惯例的方式同步

# 3. 冲突解决：按「三、变更档案」逐条处置；批量路径文件优先 accept ours 再跑复查

# 4. 合并后复查（关键，两分钟）：
node -e "import('./packages/shared/src/zcodeEndpoint.ts').catch(()=>{})" 2>/dev/null
grep -n "127.0.0.1:9" packages/shared/src/zcodeEndpoint.ts          # 应 3 处命中
grep -n "ONYX_ACCOUNT_LOGIN_DISABLED" packages/services/src/oauth/oauthService.ts  # 应 2 处
grep -n "nativeConfigDir" packages/shared/src/zcode-agent-runtime.ts | grep onyx   # 应命中
grep -n "resolveApiAuthorization" packages/services/src/node.ts     # 应命中
grep -n '"\.zcode"' packages/services/src/paths.ts                  # 应为空
grep -n "onyx-logo.svg" packages/ui/src/App.tsx                     # 应命中
git grep -n '"\.zcode"' -- packages apps scripts | grep -vE 'restore-legacy|zcode-plugin|\.test\.|/test/|/tests/|/e2e/|\.md:'  # 应为空

# 5. 构建验证
pnpm typecheck && pnpm lint
```

复查命令任一不符 → 对照「三、变更档案」恢复对应锚点。

## 六、变更原则（降低未来冲突的根本手段）

1. **能新增不修改**（新文件零冲突）；
2. **能开关不删除**（常量熔断优于删代码，上游改了被删代码的邻居也不冲突）；
3. **能收口不分散**（优先改 `zcodeEndpoint.ts` 这类单点收口处，一处顶百处）；
4. **批量改动必有复查命令**（不靠记忆，靠 grep）；
5. **每个改动都在本文档留档**（commit ID + 锚点 + 处置方式）。
