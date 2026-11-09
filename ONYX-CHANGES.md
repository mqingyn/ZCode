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
