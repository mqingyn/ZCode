import type { ReactNode } from "react";
import { cn } from "@/components/lib/utils.js";

interface RootStartupLoadingProps {
  label: string;
  children?: ReactNode;
  busy?: boolean;
}

export function RootStartupLoading({ label, children, busy = true }: RootStartupLoadingProps) {
  return (
    <div
      // Web 端全局 html/body/#root 为 Electron 透明背景让路，React 接管后会替换 HTML 启动壳。
      // 这里必须由阻塞态自身承接主题背景，否则远控链接会在 Root 恢复期间继续露出浏览器白底。
      className="flex h-full min-h-dvh flex-col items-center justify-center gap-6 bg-background text-foreground"
      role="status"
      aria-busy={busy}
      aria-label={label}
      data-testid="root-startup-loading"
    >
      <ZCodeStartupLogoBadge />
      {children}
    </div>
  );
}

/** 初始化与引导共用品牌图标，保持底色、描边、圆角和标志比例一致。 */
export function ZCodeStartupLogoBadge({
  animated = true,
  size = "default",
}: {
  animated?: boolean;
  size?: "default" | "titlebar";
}) {
  return (
    <div
      data-desktop-logo-badge={size === "titlebar" ? "true" : undefined}
      className={cn(
        "relative flex items-center justify-center bg-[linear-gradient(180deg,#000000_0%,#151718_100%)] text-[#ffffff] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-[rgba(255,255,255,0.1)] before:content-['']",
        size === "titlebar"
          ? "size-5 rounded shadow-sm/20 before:border-white/20"
          : "size-24 rounded-3xl shadow-xl/20",
      )}
    >
      {/* Button 会给 SVG 默认尺寸；紧凑 Logo 显式恢复自动高度，保持标志原始比例。 */}
      <ZCodeStartupLogo
        className={size === "titlebar" ? "size-auto w-3.25" : "h-auto w-14"}
        animated={animated}
      />
    </div>
  );
}

export function ZCodeStartupLogo({
  className,
  animated = true,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      fill="none"
      viewBox="0 0 18 18"
      className={cn("shrink-0", className)}
      aria-hidden="true"
      focusable="false"
    >
      {animated ? (
        <animate
          attributeName="opacity"
          begin="3s"
          dur="1.8s"
          repeatCount="indefinite"
          values="1;0.4;1"
        />
      ) : null}
      {/* Onyx：钛金属 O 环 + mask 透明切口（透出徽标壳渐变底）。 */}
      <defs>
        <linearGradient id="onyxTiStartup" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f5f6f8" />
          <stop offset="0.28" stop-color="#d6d8de" />
          <stop offset="0.46" stop-color="#eef0f3" />
          <stop offset="0.62" stop-color="#a2a4ae" />
          <stop offset="0.82" stop-color="#6b6d78" />
          <stop offset="1" stop-color="#46474f" />
        </linearGradient>
        <mask id="onyxCutStartup">
          <rect width="18" height="18" fill="white" />
          <rect x="0" y="8.62" width="18" height="0.76" fill="black" />
        </mask>
      </defs>
      <g mask="url(#onyxCutStartup)">
        <path
          fill="url(#onyxTiStartup)"
          fillRule="evenodd"
          d="M 9 3.55 A 5.45 5.45 0 1 0 9 14.45 A 5.45 5.45 0 1 0 9 3.55 Z M 9 5.86 A 3.14 3.14 0 1 1 9 12.14 A 3.14 3.14 0 1 1 9 5.86 Z"
        />
      </g>
    </svg>
  );
}
