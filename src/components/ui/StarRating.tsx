import { Star } from 'lucide-react';

export function StarRating({
  rating,
  size = 16,
  showValue = false,
  count,
}: {
  rating: number;
  size?: number;
  showValue?: boolean;
  count?: number;
}) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
  const rounded = rating - full >= 0.75 ? full + 1 : full;
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < rounded;
          const half = hasHalf && i === full;
          return (
            <Star
              key={i}
              size={size}
              className={
                filled || half
                  ? 'text-accent-400 fill-accent-400'
                  : 'text-ink-200 fill-ink-200'
              }
              style={
                half
                  ? { clipPath: 'inset(0 50% 0 0)' }
                  : undefined
              }
            />
          );
        })}
      </div>
      {showValue && (
        <span className="text-xs font-medium text-ink-600">
          {rating.toFixed(1)}
          {typeof count === 'number' && (
            <span className="text-ink-400"> ({count.toLocaleString('en-IN')})</span>
          )}
        </span>
      )}
    </div>
  );
}
