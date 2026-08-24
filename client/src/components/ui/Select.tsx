import { forwardRef, type SelectHTMLAttributes, type ChangeEvent } from 'react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string
  error?: string
  hint?: string
  placeholder?: string
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, placeholder, options, id, value, onChange, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e.target.value)
    }

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          value={value}
          onChange={handleChange}
          className={cn(
            'w-full px-3 py-2 rounded-lg border bg-white appearance-none',
            'text-[var(--color-text-primary)]',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-transparent',
            'disabled:bg-[var(--color-neutral-100)] disabled:cursor-not-allowed',
            error
              ? 'border-[var(--color-accent-danger)] focus:ring-[var(--color-accent-danger)]'
              : 'border-[var(--color-border-medium)] hover:border-[var(--color-border-dark)]',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-sm text-[var(--color-accent-danger)]" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${selectId}-hint`} className="mt-1.5 text-sm text-[var(--color-text-tertiary)]">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'