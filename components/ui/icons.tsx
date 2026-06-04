// Dependency-free inline SVG icon set for the creator-studio theme.
// Outline style (currentColor stroke) so icons inherit text color. No external
// icon package — consistent with the project's existing inline-SVG usage.

import type { ReactNode } from "react";

type IconProps = { className?: string };

function Svg({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Filled play triangle — the signature "creator" mark (used sparingly, in red). */
export function PlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.52.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z" />
    </svg>
  );
}

export function LinkIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07l-1.41 1.41" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.41-1.41" />
    </Svg>
  );
}

export function TranscriptIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6 3h8l4 4v14a0 0 0 0 1 0 0H6z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6M9 16h6M9 8h2" />
    </Svg>
  );
}

export function ScorecardIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 18a8 8 0 1 1 14 0" />
      <path d="M12 18l3.5-4.5" />
      <circle cx="12" cy="18" r="1.1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function AnalyticsIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 21h18" />
      <path d="M7 21v-5" />
      <path d="M12 21V8" />
      <path d="M17 21v-9" />
    </Svg>
  );
}

/** Hook — a target. */
export function TargetIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Pacing — a waveform / signal. */
export function PacingIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 12h3l2-6 4 13 3-9 2 2h4" />
    </Svg>
  );
}

/** Packaging — a tag. */
export function TagIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V4h9l8.6 8.6a2 2 0 0 1 0 2.8z" />
      <circle cx="7.5" cy="7.5" r="1.3" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** SEO / discoverability — a search lens. */
export function SearchIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </Svg>
  );
}

export function BookmarkIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6 3h12v18l-6-4-6 4z" />
    </Svg>
  );
}

/** AI / insight — a sparkle. */
export function SparkleIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
    </Svg>
  );
}

export function HeartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 21s-7-4.35-9-7c-1.43-1.78-1-4 1-5 1.37-.74 3-1 4-3 .98-1.82 3-3 6-3s5.02 1.18 6 3c1 2 2.63 2.26 4 3 2 1 2.43 3.22 1 5-2 2.65-9 7-9 7z" />
    </svg>
  );
}

export function CommentIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12z" />
    </Svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </Svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 12h15" />
      <path d="M13 6l6 6-6 6" />
    </Svg>
  );
}

/** Top fixes — a lightning bolt. */
export function BoltIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13z" />
    </svg>
  );
}

/** Strengths — trending up. */
export function TrendingUpIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M17 7h4v4" />
    </Svg>
  );
}

/** Weaknesses / warnings — alert triangle. */
export function AlertIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </Svg>
  );
}

export function ChannelIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Svg>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v6M14 11v6" />
    </Svg>
  );
}
