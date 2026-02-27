import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100',
            'border-neutral-300 dark:border-neutral-700',
            'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent',
            'placeholder:text-neutral-400 dark:placeholder:text-neutral-600',
            'disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed',
            'transition-all duration-200',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
