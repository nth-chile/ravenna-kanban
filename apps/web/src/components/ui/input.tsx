import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils.js';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-8 w-full rounded-md border border-border bg-surface px-3 py-1 text-sm text-fg placeholder:text-fg-muted focus:border-fg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
