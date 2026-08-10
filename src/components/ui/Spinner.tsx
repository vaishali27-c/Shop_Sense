export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-ink-200 border-t-brand-600"
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}
