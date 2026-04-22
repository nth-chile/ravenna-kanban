import { type VariantProps, cva } from 'class-variance-authority';
import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils.js';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-fg hover:opacity-90',
        secondary: 'border border-border bg-surface text-fg hover:bg-bg',
        ghost: 'text-fg-muted hover:bg-bg hover:text-fg',
        danger: 'text-danger hover:bg-danger/10',
        'danger-solid': 'bg-danger text-white hover:opacity-90',
      },
      size: {
        sm: 'h-7 px-2 text-xs',
        md: 'h-8 px-3',
        lg: 'h-9 px-4',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

export { buttonVariants };
