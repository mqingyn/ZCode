import { cn } from "@/components/lib/utils.js";

export function ZCodeAboutLogo({ className }: { className?: string }) {
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
      {/* Onyx：钛金属 O 环 + mask 透明切口（透出所在徽标壳的渐变底）。 */}
      <defs>
        <linearGradient id="onyxTiAboutLogo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f5f6f8" />
          <stop offset="0.28" stop-color="#d6d8de" />
          <stop offset="0.46" stop-color="#eef0f3" />
          <stop offset="0.62" stop-color="#a2a4ae" />
          <stop offset="0.82" stop-color="#6b6d78" />
          <stop offset="1" stop-color="#46474f" />
        </linearGradient>
        <mask id="onyxCutAboutLogo">
          <rect width="18" height="18" fill="white" />
          <rect x="0" y="8.62" width="18" height="0.76" fill="black" />
        </mask>
      </defs>
      <g mask="url(#onyxCutAboutLogo)">
        <path
          fill="url(#onyxTiAboutLogo)"
          fillRule="evenodd"
          d="M 9 3.55 A 5.45 5.45 0 1 0 9 14.45 A 5.45 5.45 0 1 0 9 3.55 Z M 9 5.86 A 3.14 3.14 0 1 1 9 12.14 A 3.14 3.14 0 1 1 9 5.86 Z"
        />
      </g>
    </svg>
  );
}

export function ZCodeWordmarkLogo({ className }: { className?: string }) {
  // Onyx：原 ZCode 全字标已由产品名文字替代，保留占位避免上游引用断裂。
  return (
    <span
      className={cn(
        "shrink-0 select-none font-semibold tracking-tight text-current",
        className,
      )}
      aria-hidden="true"
    >
      Onyx
    </span>
  );
}
