import { clsx } from 'clsx';
import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-primary to-primary-dark text-white border border-white/20 hover:shadow-ai-glow disabled:opacity-60',
  secondary: 'bg-surface-2 border border-border-strong text-ink hover:bg-[#374151] hover:border-[#475569]',
  ghost: 'bg-transparent text-ink-muted hover:bg-surface-2',
  danger: 'bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-control px-4 py-2 text-sm font-medium tracking-[-0.01em] transition-all disabled:cursor-not-allowed',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
