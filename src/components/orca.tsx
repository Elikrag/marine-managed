export function OrcaMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  // Dorsal fin + saddle patch, read as a mark.
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path d="M4 27c3-9 8-16 20-23-3 7-2 14 3 23H4z" fill="currentColor" />
      <path d="M14.5 27c.6-5 2.6-9 6.2-12.4-1.4 4.2-1.3 8.4.5 12.4h-6.7z" fill="var(--bg)" opacity=".9" />
    </svg>
  );
}
