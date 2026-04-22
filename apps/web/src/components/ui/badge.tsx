import { type VariantProps, cva } from 'class-variance-authority';
import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils.js';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-border bg-bg/60 text-fg',
        outline: 'border-border bg-surface text-fg-muted',
        muted: 'border-transparent bg-bg text-fg-muted',
        accent: 'border-accent/50 bg-accent/10 text-fg',
      },
      interactive: {
        true: 'cursor-pointer hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        false: '',
      },
    },
    defaultVariants: { variant: 'default', interactive: false },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, interactive, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant, interactive }), className)} {...props} />
  ),
);
Badge.displayName = 'Badge';

export { badgeVariants };
