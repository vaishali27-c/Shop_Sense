import type { ReactNode } from 'react';

type Tone = 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const tones: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-700',
  accent: 'bg-accent-100 text-accent-800',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  neutral: 'bg-ink-100 text-ink-700',
  info: 'bg-sky-50 text-sky-700',
};

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span className={`badge ${tones[tone]} ${className}`}>{children}</span>
  );
}

export function StockBadge({ status }: { status: string }) {
  const tone: Tone =
    status === 'In Stock'
      ? 'success'
      : status === 'Low Stock'
        ? 'warning'
        : 'danger';
  return <Badge tone={tone}>{status}</Badge>;
}
