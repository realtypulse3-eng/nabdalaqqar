import { clsx } from 'clsx';
import { forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        'w-full rounded-control border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-primary focus:ring-[3px] focus:ring-primary/15',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={clsx(
        'w-full rounded-control border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-primary focus:ring-[3px] focus:ring-primary/15',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={clsx(
        'w-full rounded-control border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-[3px] focus:ring-primary/15',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium text-ink-muted">{children}</label>;
}
