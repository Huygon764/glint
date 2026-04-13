import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";

type MaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "5xl";

const MAX_WIDTH_CLASSES: Record<MaxWidth, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "5xl": "max-w-5xl",
};

type Props = {
  children: ReactNode;
  /** Max-width of the content column. Default: "2xl". */
  maxWidth?: MaxWidth;
  /** Show the shared site header (brand + wallet button). Default: true. */
  showHeader?: boolean;
  /** Padding class applied to the `<main>` element. Default: "p-6". */
  padding?: string;
};

/**
 * Shared page shell. Centers content, applies consistent padding, and
 * renders the {@link SiteHeader}.
 *
 * Pages plug their content as children and override `maxWidth` when they
 * need something other than the default 2xl column.
 */
export function PageShell({
  children,
  maxWidth = "2xl",
  showHeader = true,
  padding = "p-6",
}: Props) {
  return (
    <main
      className={`min-h-screen ${padding} ${MAX_WIDTH_CLASSES[maxWidth]} mx-auto`}
    >
      {showHeader && <SiteHeader />}
      {children}
    </main>
  );
}
