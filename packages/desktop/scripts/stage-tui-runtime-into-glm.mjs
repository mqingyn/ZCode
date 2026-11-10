#!/usr/bin/env node
// Onyx 个人构建：把 TUI 运行时（@zcode/tui 及其依赖，含 opentui/koffi/node-pty 平台原生包）
// staged 到 bundled-agents/<platform>/glm/node_modules，供「安装 onyx 命令」冷启动 TUI 使用。
//
// 官方桌面只以 app-server 模式运行 agent（不加载 @zcode/tui），故上游刻意不打包 TUI
// （见 prepare-agent-node-bundle.mjs 头注释）。Onyx 的 CLI 安装特性需要 TUI，这里复用
// SEA 发行包的收集器（collectSeaTuiAssets，递归收集 workspace 依赖）按宿主平台补齐。
// 文件落在 extraResources（Resources/glm/），不进 app.asar，native 门禁只扫 asar，无冲突。
import { chmod, cp, mkdir, mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolveAgentBundlePaths } from "./stage-agent-bundle.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const desktopRoot = resolve(scriptDir, "..");
const repoRoot = resolve(desktopRoot, "..", "..");

/** 桌面 platformKey（darwin/linux/win32-…）→ SEA target（darwin/linux/win-…）。 */
function seaTargetFromPlatformKey(platformKey) {
  const [os, arch] = platformKey.split("-");
  return `${os === "win32" ? "win" : os}-${arch}`;
}

export async function stageTuiRuntimeIntoGlm({ platformKey, log = console.log }) {
  const { glmDir } = resolveAgentBundlePaths({ repoRoot, platformKey });
  const tuiDist = resolve(repoRoot, "apps/zcode-cli/packages/tui/dist/index.js");
  if (!existsSync(tuiDist)) {
    throw new Error(
      "[stage:tui] @zcode/tui dist 缺失：请先 pnpm --filter @zcode/tui build（Onyx CLI 安装特性依赖 TUI 运行时）",
    );
  }

  const { collectSeaTuiAssets, seaTuiAssetPrefix } = await import(
    pathToFileURL(
      resolve(repoRoot, "apps/zcode-cli/packages/cli/scripts/sea-tui-assets.mjs"),
    ).href
  );
  const stagingDirectory = await mkdtemp(resolve(tmpdir(), "onyx-tui-stage-"));
  try {
    const { assets, manifest } = await collectSeaTuiAssets({
      root: resolve(repoRoot, "apps/zcode-cli"),
      stagingDirectory,
      target: seaTargetFromPlatformKey(platformKey),
    });
    for (const file of manifest.files) {
      const source = assets[`${seaTuiAssetPrefix}${file.path}`];
      if (!source) continue;
      const destination = resolve(glmDir, file.path);
      await mkdir(dirname(destination), { recursive: true });
      await cp(source, destination);
      if (file.mode !== undefined) await chmod(destination, file.mode);
    }
    log(`[stage:tui] ${manifest.files.length} 个 TUI 运行时文件已 staged 到 glm/node_modules`);
  } finally {
    await rm(stagingDirectory, { recursive: true, force: true });
  }
}
