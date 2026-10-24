import { cn } from "@/lib/utils";

/** Marka işareti: kapı aralığından sızan ışık. */
export function BrandMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Portföy Odası"
      className={cn("shrink-0", className)}
    >
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <path d="M11 8.5h8.5a1.5 1.5 0 0 1 1.5 1.5v14H11z" fill="var(--brand-glow)" opacity="0.95" />
      <path d="M11 8.5v15.5H9.5A1.5 1.5 0 0 1 8 22.5V10a1.5 1.5 0 0 1 1.5-1.5z" fill="var(--brand-dark-foreground)" opacity="0.9" />
      <circle cx="18.6" cy="16.5" r="1" fill="var(--brand-dark)" />
    </svg>
  );
}

export function Wordmark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark className={inverted ? "text-brand-dark-soft" : "text-brand-dark"} size={28} />
      <span className="font-display text-[1.15rem] font-semibold leading-none">Portföy Odası</span>
    </span>
  );
}
