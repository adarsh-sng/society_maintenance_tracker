import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 rounded-lg border bg-white',
            'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-transparent',
            'disabled:bg-[var(--color-neutral-100)] disabled:cursor-not-allowed',
            error
              ? 'border-[var(--color-accent-danger)] focus:ring-[var(--color-accent-danger)]'
              : 'border-[var(--color-border-medium)] hover:border-[var(--color-border-dark)]',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-[var(--color-accent-danger)]" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-[var(--color-text-tertiary)]">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full px-3 py-2 rounded-lg border bg-white resize-y min-h-[100px]',
            'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-transparent',
            'disabled:bg-[var(--color-neutral-100)] disabled:cursor-not-allowed',
            error
              ? 'border-[var(--color-accent-danger)] focus:ring-[var(--color-accent-danger)]'
              : 'border-[var(--color-border-medium)] hover:border-[var(--color-border-dark)]',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="mt-1.5 text-sm text-[var(--color-accent-danger)]" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${textareaId}-hint`} className="mt-1.5 text-sm text-[var(--color-text-tertiary)]">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'