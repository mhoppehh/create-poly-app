# Form Management

## Overview

Advanced form handling system with validation, field management, complex form logic, and excellent developer experience for React applications.

## Priority

**HIGH** - Essential for data input and user interaction

## Dependencies

- `vite` (React application base)
- `tailwind` (styling foundation)
- `ui-component-library` (form UI components)

## Feature Description

Comprehensive form management solution providing validation, field state management, conditional logic, multi-step forms, and seamless integration with UI components for robust form handling.

### Key Features

- **Validation Engine**: Schema-based validation with Zod, Yup, or Joi integration
- **Field Management**: Dynamic fields, conditional rendering, field arrays
- **Form State**: Real-time validation, dirty state tracking, submission handling
- **Multi-Step Forms**: Wizard-style forms with navigation and state persistence
- **File Uploads**: Drag-and-drop file handling with preview and validation
- **Accessibility**: ARIA labels, error announcements, keyboard navigation
- **Performance**: Optimized re-renders, field-level subscriptions

## Configuration

```typescript
interface FormManagementConfig {
  validation: {
    library: 'zod' | 'yup' | 'joi' | 'react-hook-form'
    strategy: 'onSubmit' | 'onChange' | 'onBlur' | 'onTouched'
    showErrorsOn: 'submit' | 'blur' | 'change'
  }
  fields: {
    autoComplete: boolean
    autoFocus: boolean
    validateOnMount: boolean
    clearErrorsOnChange: boolean
  }
  forms: {
    persistState: boolean
    persistKey: string
    autoSave: boolean
    autoSaveDelay: number
  }
  ui: {
    errorDisplay: 'inline' | 'toast' | 'summary'
    loadingStates: boolean
    successFeedback: boolean
  }
  accessibility: {
    announceErrors: boolean
    describedBy: boolean
    requiredIndicator: string
  }
}
```

## Generated Files

### Form Management Structure

```
web/src/
├── forms/
│   ├── index.ts                      # Form exports
│   ├── components/
│   │   ├── Form.tsx                  # Main form wrapper
│   │   ├── FormField.tsx             # Form field wrapper
│   │   ├── FormSection.tsx           # Form section grouping
│   │   ├── FormStep.tsx              # Multi-step form step
│   │   ├── FormSummary.tsx           # Form summary/review
│   │   ├── fields/
│   │   │   ├── TextField.tsx         # Text input field
│   │   │   ├── SelectField.tsx       # Select dropdown field
│   │   │   ├── CheckboxField.tsx     # Checkbox field
│   │   │   ├── RadioField.tsx        # Radio button field
│   │   │   ├── TextAreaField.tsx     # Textarea field
│   │   │   ├── FileUploadField.tsx   # File upload field
│   │   │   ├── DateField.tsx         # Date picker field
│   │   │   ├── NumberField.tsx       # Number input field
│   │   │   ├── PasswordField.tsx     # Password input field
│   │   │   ├── SliderField.tsx       # Range slider field
│   │   │   └── index.ts
│   │   ├── complex/
│   │   │   ├── AddressField.tsx      # Address input group
│   │   │   ├── PhoneField.tsx        # Phone number field
│   │   │   ├── FieldArray.tsx        # Dynamic field arrays
│   │   │   ├── ConditionalField.tsx  # Conditional rendering
│   │   │   ├── SearchField.tsx       # Search with autocomplete
│   │   │   └── index.ts
│   │   └── multi-step/
│   │       ├── StepWizard.tsx        # Multi-step form wizard
│   │       ├── StepIndicator.tsx     # Step progress indicator
│   │       ├── StepNavigation.tsx    # Step navigation controls
│   │       └── index.ts
│   ├── validation/
│   │   ├── schemas/
│   │   │   ├── userSchema.ts         # User validation schema
│   │   │   ├── bookSchema.ts         # Book validation schema
│   │   │   ├── addressSchema.ts      # Address validation schema
│   │   │   ├── contactSchema.ts      # Contact form schema
│   │   │   └── index.ts
│   │   ├── validators/
│   │   │   ├── customValidators.ts   # Custom validation functions
│   │   │   ├── asyncValidators.ts    # Async validation (API calls)
│   │   │   └── conditionalValidators.ts # Conditional validation
│   │   └── messages.ts               # Validation error messages
│   ├── hooks/
│   │   ├── useForm.ts                # Main form hook
│   │   ├── useFormField.ts           # Individual field hook
│   │   ├── useFormValidation.ts      # Validation hook
│   │   ├── useMultiStepForm.ts       # Multi-step form hook
│   │   ├── useFormPersistence.ts     # Form state persistence
│   │   ├── useFileUpload.ts          # File upload handling
│   │   └── useFieldArray.ts          # Dynamic field arrays
│   ├── utils/
│   │   ├── formUtils.ts              # Form utility functions
│   │   ├── validationUtils.ts        # Validation utilities
│   │   ├── transformers.ts           # Data transformers
│   │   ├── formatters.ts             # Input formatters
│   │   └── persistence.ts            # Form persistence utilities
│   ├── types/
│   │   ├── form.ts                   # Form type definitions
│   │   ├── validation.ts             # Validation types
│   │   ├── field.ts                  # Field types
│   │   └── events.ts                 # Form event types
│   └── examples/
│       ├── UserRegistrationForm.tsx  # User registration example
│       ├── ContactForm.tsx           # Contact form example
│       ├── BookCreationForm.tsx      # Book creation example
│       ├── CheckoutForm.tsx          # Multi-step checkout
│       └── DynamicForm.tsx           # Dynamic form example
```

## Code Examples

### Main Form Hook

```typescript
// web/src/forms/hooks/useForm.ts
import { useCallback, useEffect, useMemo, useState } from 'react'
import { z } from 'zod'

export interface FormOptions<T> {
  schema?: z.ZodSchema<T>
  defaultValues?: Partial<T>
  mode?: 'onChange' | 'onBlur' | 'onSubmit'
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit'
  shouldFocusError?: boolean
  shouldUseNativeValidation?: boolean
  criteriaMode?: 'firstError' | 'all'
  delayError?: number
}

export interface FormState<T> {
  values: T
  errors: Record<keyof T, string[]>
  touched: Record<keyof T, boolean>
  dirty: Record<keyof T, boolean>
  isSubmitting: boolean
  isValidating: boolean
  isValid: boolean
  submitCount: number
}

export interface FormReturn<T> {
  // State
  formState: FormState<T>
  watch: (name?: keyof T) => any
  getValues: () => T

  // Field registration
  register: (name: keyof T, options?: RegisterOptions) => RegisterReturn
  setValue: (name: keyof T, value: any, options?: SetValueOptions) => void
  setError: (name: keyof T, error: string | string[]) => void
  clearErrors: (name?: keyof T) => void

  // Form actions
  handleSubmit: (
    onValid: (data: T) => void | Promise<void>,
    onInvalid?: (errors: FormErrors<T>) => void,
  ) => (e?: React.FormEvent) => void
  reset: (values?: Partial<T>) => void
  trigger: (name?: keyof T) => Promise<boolean>
}

interface RegisterOptions {
  required?: boolean | string
  min?: number | { value: number; message: string }
  max?: number | { value: number; message: string }
  minLength?: number | { value: number; message: string }
  maxLength?: number | { value: number; message: string }
  pattern?: RegExp | { value: RegExp; message: string }
  validate?: (value: any) => boolean | string | Promise<boolean | string>
  disabled?: boolean
}

interface RegisterReturn {
  name: string
  onChange: (event: React.ChangeEvent<any>) => void
  onBlur: (event: React.FocusEvent<any>) => void
  value: any
  error?: string
  'aria-invalid': boolean
  'aria-describedby'?: string
}

export function useForm<T extends Record<string, any>>(options: FormOptions<T> = {}): FormReturn<T> {
  const {
    schema,
    defaultValues = {} as Partial<T>,
    mode = 'onSubmit',
    reValidateMode = 'onChange',
    shouldFocusError = true,
    delayError = 0,
  } = options

  const [formState, setFormState] = useState<FormState<T>>({
    values: { ...defaultValues } as T,
    errors: {} as Record<keyof T, string[]>,
    touched: {} as Record<keyof T, boolean>,
    dirty: {} as Record<keyof T, boolean>,
    isSubmitting: false,
    isValidating: false,
    isValid: true,
    submitCount: 0,
  })

  const [fieldRefs] = useState<Map<keyof T, HTMLElement>>(new Map())
  const [validationTimeouts] = useState<Map<keyof T, NodeJS.Timeout>>(new Map())

  // Validation function
  const validateField = useCallback(
    async (name: keyof T, value: any): Promise<string[]> => {
      if (!schema) return []

      try {
        // Create partial schema for single field validation
        const fieldSchema = z.object({ [name]: schema.shape[name as string] })
        await fieldSchema.parseAsync({ [name]: value })
        return []
      } catch (error) {
        if (error instanceof z.ZodError) {
          return error.errors.map(err => err.message)
        }
        return ['Validation error']
      }
    },
    [schema],
  )

  const validateForm = useCallback(
    async (values: T): Promise<Record<keyof T, string[]>> => {
      if (!schema) return {} as Record<keyof T, string[]>

      try {
        await schema.parseAsync(values)
        return {} as Record<keyof T, string[]>
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errors = {} as Record<keyof T, string[]>
          error.errors.forEach(err => {
            const path = err.path[0] as keyof T
            if (!errors[path]) errors[path] = []
            errors[path].push(err.message)
          })
          return errors
        }
        return {} as Record<keyof T, string[]>
      }
    },
    [schema],
  )

  // Debounced validation
  const debouncedValidate = useCallback(
    (name: keyof T, value: any) => {
      const existingTimeout = validationTimeouts.get(name)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }

      const timeout = setTimeout(async () => {
        const fieldErrors = await validateField(name, value)

        setFormState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            [name]: fieldErrors,
          },
          isValid: Object.values({
            ...prev.errors,
            [name]: fieldErrors,
          }).every(errors => errors.length === 0),
        }))
      }, delayError)

      validationTimeouts.set(name, timeout)
    },
    [validateField, delayError, validationTimeouts],
  )

  // Register field
  const register = useCallback(
    (name: keyof T, options: RegisterOptions = {}): RegisterReturn => {
      const value = formState.values[name]
      const errors = formState.errors[name] || []
      const hasError = errors.length > 0

      return {
        name: name as string,
        value,
        error: hasError ? errors[0] : undefined,
        'aria-invalid': hasError,
        'aria-describedby': hasError ? `${name as string}-error` : undefined,
        onChange: (event: React.ChangeEvent<any>) => {
          const newValue = event.target.value

          setFormState(prev => ({
            ...prev,
            values: { ...prev.values, [name]: newValue },
            dirty: { ...prev.dirty, [name]: true },
            touched: { ...prev.touched, [name]: true },
          }))

          // Validate based on mode
          if (mode === 'onChange' || (formState.touched[name] && reValidateMode === 'onChange')) {
            debouncedValidate(name, newValue)
          }
        },
        onBlur: (event: React.FocusEvent<any>) => {
          const newValue = event.target.value

          setFormState(prev => ({
            ...prev,
            touched: { ...prev.touched, [name]: true },
          }))

          // Validate based on mode
          if (mode === 'onBlur' || (formState.touched[name] && reValidateMode === 'onBlur')) {
            debouncedValidate(name, newValue)
          }
        },
      }
    },
    [formState, mode, reValidateMode, debouncedValidate],
  )

  // Set field value programmatically
  const setValue = useCallback(
    (name: keyof T, value: any, options: SetValueOptions = {}) => {
      const { shouldValidate = false, shouldDirty = true, shouldTouch = false } = options

      setFormState(prev => ({
        ...prev,
        values: { ...prev.values, [name]: value },
        dirty: shouldDirty ? { ...prev.dirty, [name]: true } : prev.dirty,
        touched: shouldTouch ? { ...prev.touched, [name]: true } : prev.touched,
      }))

      if (shouldValidate) {
        debouncedValidate(name, value)
      }
    },
    [debouncedValidate],
  )

  // Set field error
  const setError = useCallback((name: keyof T, error: string | string[]) => {
    const errors = Array.isArray(error) ? error : [error]

    setFormState(prev => ({
      ...prev,
      errors: { ...prev.errors, [name]: errors },
      isValid: false,
    }))
  }, [])

  // Clear field errors
  const clearErrors = useCallback((name?: keyof T) => {
    setFormState(prev => {
      if (name) {
        const newErrors = { ...prev.errors }
        delete newErrors[name]
        return {
          ...prev,
          errors: newErrors,
          isValid: Object.values(newErrors).every(errors => errors.length === 0),
        }
      } else {
        return {
          ...prev,
          errors: {} as Record<keyof T, string[]>,
          isValid: true,
        }
      }
    })
  }, [])

  // Handle form submission
  const handleSubmit = useCallback(
    (onValid: (data: T) => void | Promise<void>, onInvalid?: (errors: Record<keyof T, string[]>) => void) => {
      return async (e?: React.FormEvent) => {
        if (e) {
          e.preventDefault()
          e.stopPropagation()
        }

        setFormState(prev => ({
          ...prev,
          isSubmitting: true,
          submitCount: prev.submitCount + 1,
        }))

        try {
          // Validate entire form
          const errors = await validateForm(formState.values)
          const hasErrors = Object.keys(errors).length > 0

          setFormState(prev => ({
            ...prev,
            errors,
            isValid: !hasErrors,
          }))

          if (hasErrors) {
            // Focus first error field
            if (shouldFocusError) {
              const firstErrorField = Object.keys(errors)[0] as keyof T
              const fieldElement = fieldRefs.get(firstErrorField)
              fieldElement?.focus()
            }

            onInvalid?.(errors)
          } else {
            await onValid(formState.values)
          }
        } catch (error) {
          console.error('Form submission error:', error)
        } finally {
          setFormState(prev => ({
            ...prev,
            isSubmitting: false,
          }))
        }
      }
    },
    [formState.values, validateForm, shouldFocusError, fieldRefs],
  )

  // Watch field values
  const watch = useCallback(
    (name?: keyof T) => {
      if (name) {
        return formState.values[name]
      }
      return formState.values
    },
    [formState.values],
  )

  // Get all values
  const getValues = useCallback(() => formState.values, [formState.values])

  // Reset form
  const reset = useCallback(
    (values?: Partial<T>) => {
      const resetValues = values ? { ...defaultValues, ...values } : defaultValues

      setFormState({
        values: resetValues as T,
        errors: {} as Record<keyof T, string[]>,
        touched: {} as Record<keyof T, boolean>,
        dirty: {} as Record<keyof T, boolean>,
        isSubmitting: false,
        isValidating: false,
        isValid: true,
        submitCount: 0,
      })
    },
    [defaultValues],
  )

  // Trigger validation
  const trigger = useCallback(
    async (name?: keyof T): Promise<boolean> => {
      if (name) {
        const errors = await validateField(name, formState.values[name])

        setFormState(prev => ({
          ...prev,
          errors: { ...prev.errors, [name]: errors },
        }))

        return errors.length === 0
      } else {
        const errors = await validateForm(formState.values)
        const isValid = Object.keys(errors).length === 0

        setFormState(prev => ({
          ...prev,
          errors,
          isValid,
        }))

        return isValid
      }
    },
    [formState.values, validateField, validateForm],
  )

  return {
    formState,
    register,
    setValue,
    setError,
    clearErrors,
    handleSubmit,
    watch,
    getValues,
    reset,
    trigger,
  }
}

interface SetValueOptions {
  shouldValidate?: boolean
  shouldDirty?: boolean
  shouldTouch?: boolean
}

type FormErrors<T> = Record<keyof T, string[]>
```

### Form Field Component

```typescript
// web/src/forms/components/FormField.tsx
import React from 'react'
import { cn } from '../../utils/cn'

export interface FormFieldProps {
  name: string
  label?: string
  description?: string
  error?: string
  required?: boolean
  children: React.ReactElement
  className?: string
  labelClassName?: string
  errorClassName?: string
  descriptionClassName?: string
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  description,
  error,
  required = false,
  children,
  className,
  labelClassName,
  errorClassName,
  descriptionClassName,
}) => {
  const hasError = !!error
  const fieldId = `field-${name}`
  const errorId = `${name}-error`
  const descriptionId = `${name}-description`

  // Clone the child element and add necessary props
  const childWithProps = React.cloneElement(children, {
    id: fieldId,
    'aria-invalid': hasError,
    'aria-describedby': cn(
      error && errorId,
      description && descriptionId
    ) || undefined,
    ...children.props,
  })

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label
          htmlFor={fieldId}
          className={cn(
            "block text-sm font-medium text-foreground",
            labelClassName
          )}
        >
          {label}
          {required && (
            <span
              className="ml-1 text-destructive"
              aria-label="required"
            >
              *
            </span>
          )}
        </label>
      )}

      {description && (
        <p
          id={descriptionId}
          className={cn(
            "text-sm text-muted-foreground",
            descriptionClassName
          )}
        >
          {description}
        </p>
      )}

      {childWithProps}

      {error && (
        <p
          id={errorId}
          className={cn(
            "text-sm text-destructive",
            errorClassName
          )}
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  )
}

// Compound FormField components
export const FormLabel: React.FC<{
  htmlFor?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}> = ({ htmlFor, required, children, className }) => (
  <label
    htmlFor={htmlFor}
    className={cn(
      "block text-sm font-medium text-foreground",
      className
    )}
  >
    {children}
    {required && (
      <span
        className="ml-1 text-destructive"
        aria-label="required"
      >
        *
      </span>
    )}
  </label>
)

export const FormDescription: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <p className={cn("text-sm text-muted-foreground", className)}>
    {children}
  </p>
)

export const FormError: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <p
    className={cn("text-sm text-destructive", className)}
    role="alert"
    aria-live="polite"
  >
    {children}
  </p>
)
```

### Text Field Component

```typescript
// web/src/forms/components/fields/TextField.tsx
import React, { forwardRef } from 'react'
import { Input } from '../../../components/ui/input/Input'
import { FormField } from '../FormField'
import { useForm } from '../../hooks/useForm'

export interface TextFieldProps {
  name: string
  label?: string
  description?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  type?: 'text' | 'email' | 'tel' | 'url' | 'search'
  autoComplete?: string
  autoFocus?: boolean
  maxLength?: number
  pattern?: string
  className?: string
  inputClassName?: string
  validation?: {
    required?: boolean | string
    minLength?: number | { value: number; message: string }
    maxLength?: number | { value: number; message: string }
    pattern?: RegExp | { value: RegExp; message: string }
    validate?: (value: string) => boolean | string | Promise<boolean | string>
  }
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({
    name,
    label,
    description,
    placeholder,
    required = false,
    disabled = false,
    type = 'text',
    autoComplete,
    autoFocus = false,
    maxLength,
    pattern,
    className,
    inputClassName,
    validation,
    ...props
  }, ref) => {
    // This would typically come from a FormContext
    // For demo purposes, we'll assume it's passed down
    const formContext = useForm() // This would come from context
    const field = formContext.register(name, {
      required: validation?.required,
      minLength: validation?.minLength,
      maxLength: validation?.maxLength,
      pattern: validation?.pattern,
      validate: validation?.validate,
      disabled,
    })

    return (
      <FormField
        name={name}
        label={label}
        description={description}
        error={field.error}
        required={required}
        className={className}
      >
        <Input
          {...field}
          ref={ref}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          maxLength={maxLength}
          pattern={pattern}
          className={inputClassName}
          {...props}
        />
      </FormField>
    )
  }
)

TextField.displayName = 'TextField'
```

### Multi-Step Form Hook

```typescript
// web/src/forms/hooks/useMultiStepForm.ts
import { useState, useCallback, useMemo } from 'react'
import { useForm, FormOptions } from './useForm'

export interface Step<T = any> {
  id: string
  title: string
  description?: string
  schema?: any
  component: React.ComponentType<StepProps<T>>
  optional?: boolean
  validate?: (data: T) => Promise<boolean>
}

export interface StepProps<T> {
  data: T
  updateData: (updates: Partial<T>) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (stepIndex: number) => void
  isFirstStep: boolean
  isLastStep: boolean
}

export interface MultiStepFormOptions<T> extends FormOptions<T> {
  steps: Step<T>[]
  persistState?: boolean
  persistKey?: string
  onStepChange?: (currentStep: number, totalSteps: number) => void
  onComplete?: (data: T) => void | Promise<void>
}

export interface MultiStepFormReturn<T> {
  // Current step info
  currentStep: number
  currentStepData: Step<T>
  totalSteps: number
  isFirstStep: boolean
  isLastStep: boolean

  // Progress
  completedSteps: Set<number>
  canGoToStep: (stepIndex: number) => boolean
  progress: number

  // Navigation
  nextStep: () => Promise<boolean>
  prevStep: () => void
  goToStep: (stepIndex: number) => Promise<boolean>

  // Form data
  formData: T
  updateFormData: (updates: Partial<T>) => void

  // Form controls
  reset: () => void
  submit: () => Promise<void>

  // Step component props
  getStepProps: () => StepProps<T>
}

export function useMultiStepForm<T extends Record<string, any>>(
  options: MultiStepFormOptions<T>,
): MultiStepFormReturn<T> {
  const {
    steps,
    persistState = false,
    persistKey = 'multi-step-form',
    onStepChange,
    onComplete,
    ...formOptions
  } = options

  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [formData, setFormData] = useState<T>(() => {
    if (persistState && typeof window !== 'undefined') {
      const saved = localStorage.getItem(persistKey)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (error) {
          console.warn('Failed to parse saved form data:', error)
        }
      }
    }
    return (formOptions.defaultValues || {}) as T
  })

  const form = useForm<T>({
    ...formOptions,
    defaultValues: formData,
  })

  // Persist form data
  const persistFormData = useCallback(
    (data: T) => {
      if (persistState && typeof window !== 'undefined') {
        localStorage.setItem(persistKey, JSON.stringify(data))
      }
    },
    [persistState, persistKey],
  )

  // Update form data
  const updateFormData = useCallback(
    (updates: Partial<T>) => {
      const newData = { ...formData, ...updates }
      setFormData(newData)
      persistFormData(newData)

      // Update form state as well
      Object.entries(updates).forEach(([key, value]) => {
        form.setValue(key as keyof T, value)
      })
    },
    [formData, persistFormData, form],
  )

  // Validate current step
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const step = steps[currentStep]

    // Schema validation
    if (step.schema) {
      try {
        await step.schema.parseAsync(formData)
      } catch (error) {
        return false
      }
    }

    // Custom validation
    if (step.validate) {
      return await step.validate(formData)
    }

    return true
  }, [currentStep, steps, formData])

  // Navigation functions
  const nextStep = useCallback(async (): Promise<boolean> => {
    if (currentStep >= steps.length - 1) return false

    const isValid = await validateCurrentStep()
    if (!isValid) return false

    // Mark current step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep]))

    const nextStepIndex = currentStep + 1
    setCurrentStep(nextStepIndex)
    onStepChange?.(nextStepIndex, steps.length)

    return true
  }, [currentStep, steps.length, validateCurrentStep, onStepChange])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1
      setCurrentStep(prevStepIndex)
      onStepChange?.(prevStepIndex, steps.length)
    }
  }, [currentStep, onStepChange, steps.length])

  const goToStep = useCallback(
    async (stepIndex: number): Promise<boolean> => {
      if (stepIndex < 0 || stepIndex >= steps.length) return false
      if (stepIndex === currentStep) return true

      // If going forward, validate all steps in between
      if (stepIndex > currentStep) {
        for (let i = currentStep; i < stepIndex; i++) {
          setCurrentStep(i)
          const isValid = await validateCurrentStep()
          if (!isValid) {
            setCurrentStep(currentStep) // Revert to original step
            return false
          }
          setCompletedSteps(prev => new Set([...prev, i]))
        }
      }

      setCurrentStep(stepIndex)
      onStepChange?.(stepIndex, steps.length)
      return true
    },
    [currentStep, steps.length, validateCurrentStep, onStepChange],
  )

  // Check if can go to specific step
  const canGoToStep = useCallback(
    (stepIndex: number): boolean => {
      if (stepIndex < 0 || stepIndex >= steps.length) return false
      if (stepIndex <= currentStep) return true

      // Check if all previous steps are completed
      for (let i = 0; i < stepIndex; i++) {
        if (!completedSteps.has(i) && !steps[i].optional) {
          return false
        }
      }

      return true
    },
    [currentStep, steps.length, completedSteps, steps],
  )

  // Submit form
  const submit = useCallback(async () => {
    // Validate all steps
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i)
      const isValid = await validateCurrentStep()
      if (!isValid && !steps[i].optional) {
        setCurrentStep(i) // Stay on invalid step
        return
      }
    }

    // All steps valid, submit
    await onComplete?.(formData)

    // Clear persisted data on successful submission
    if (persistState && typeof window !== 'undefined') {
      localStorage.removeItem(persistKey)
    }
  }, [steps, validateCurrentStep, onComplete, formData, persistState, persistKey])

  // Reset form
  const reset = useCallback(() => {
    setCurrentStep(0)
    setCompletedSteps(new Set())
    const defaultData = (formOptions.defaultValues || {}) as T
    setFormData(defaultData)
    form.reset(defaultData)

    // Clear persisted data
    if (persistState && typeof window !== 'undefined') {
      localStorage.removeItem(persistKey)
    }
  }, [formOptions.defaultValues, form, persistState, persistKey])

  // Computed values
  const currentStepData = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const progress = ((completedSteps.size + (completedSteps.has(currentStep) ? 0 : 0)) / steps.length) * 100

  // Get props for current step component
  const getStepProps = useCallback(
    (): StepProps<T> => ({
      data: formData,
      updateData: updateFormData,
      nextStep: async () => {
        await nextStep()
      },
      prevStep,
      goToStep: async (stepIndex: number) => {
        await goToStep(stepIndex)
      },
      isFirstStep,
      isLastStep,
    }),
    [formData, updateFormData, nextStep, prevStep, goToStep, isFirstStep, isLastStep],
  )

  return {
    currentStep,
    currentStepData,
    totalSteps: steps.length,
    isFirstStep,
    isLastStep,
    completedSteps,
    canGoToStep,
    progress,
    nextStep,
    prevStep,
    goToStep,
    formData,
    updateFormData,
    reset,
    submit,
    getStepProps,
  }
}
```

### User Registration Form Example

```typescript
// web/src/forms/examples/UserRegistrationForm.tsx
import React from 'react'
import { z } from 'zod'
import { useForm } from '../hooks/useForm'
import { Button } from '../../components/ui/button/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card/Card'
import { TextField } from '../components/fields/TextField'
import { SelectField } from '../components/fields/SelectField'
import { CheckboxField } from '../components/fields/CheckboxField'
import { useToast } from '../../hooks/useToast'

// Validation schema
const registrationSchema = z.object({
  firstName: z.string().min(1, 'First name is required').min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(1, 'Last name is required').min(2, 'Last name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required').min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  country: z.string().min(1, 'Please select your country'),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  newsletter: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegistrationFormData = z.infer<typeof registrationSchema>

const countries = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  // ... more countries
]

export const UserRegistrationForm: React.FC = () => {
  const { addToast } = useToast()

  const form = useForm<RegistrationFormData>({
    schema: registrationSchema,
    mode: 'onBlur',
    defaultValues: {
      newsletter: false,
      acceptTerms: false,
    },
  })

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Remove confirmPassword from submission data
      const { confirmPassword, ...submissionData } = data

      console.log('Registration data:', submissionData)

      addToast({
        type: 'success',
        title: 'Registration Successful!',
        message: 'Welcome to our platform. Please check your email to verify your account.',
      })

      form.reset()
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Registration Failed',
        message: 'There was an error creating your account. Please try again.',
      })
    }
  }

  const onError = (errors: Record<keyof RegistrationFormData, string[]>) => {
    console.log('Form errors:', errors)
    addToast({
      type: 'error',
      title: 'Please correct the errors',
      message: 'There are validation errors in the form. Please check and try again.',
    })
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Your Account</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                name="firstName"
                label="First Name"
                required
                autoComplete="given-name"
                validation={{
                  required: 'First name is required',
                  minLength: { value: 2, message: 'Must be at least 2 characters' }
                }}
              />

              <TextField
                name="lastName"
                label="Last Name"
                required
                autoComplete="family-name"
                validation={{
                  required: 'Last name is required',
                  minLength: { value: 2, message: 'Must be at least 2 characters' }
                }}
              />
            </div>

            <TextField
              name="dateOfBirth"
              label="Date of Birth"
              type="date"
              required
              validation={{
                required: 'Date of birth is required',
                validate: (value) => {
                  const age = new Date().getFullYear() - new Date(value).getFullYear()
                  return age >= 13 || 'You must be at least 13 years old'
                }
              }}
            />

            <SelectField
              name="country"
              label="Country"
              required
              options={countries}
              placeholder="Select your country"
              validation={{
                required: 'Please select your country'
              }}
            />
          </div>

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Account Information</h3>

            <TextField
              name="email"
              label="Email Address"
              type="email"
              required
              autoComplete="email"
              validation={{
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Please enter a valid email address'
                }
              }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                name="password"
                label="Password"
                type="password"
                required
                autoComplete="new-password"
                description="Must be at least 8 characters with uppercase, lowercase, and number"
                validation={{
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Must be at least 8 characters' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                    message: 'Must contain uppercase, lowercase, and number'
                  }
                }}
              />

              <TextField
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                required
                autoComplete="new-password"
                validation={{
                  required: 'Please confirm your password',
                  validate: (value) => {
                    const password = form.getValues().password
                    return value === password || "Passwords don't match"
                  }
                }}
              />
            </div>
          </div>

          {/* Terms and Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Terms & Preferences</h3>

            <CheckboxField
              name="acceptTerms"
              label="I accept the Terms of Service and Privacy Policy"
              required
              validation={{
                required: 'You must accept the terms and conditions'
              }}
            />

            <CheckboxField
              name="newsletter"
              label="Subscribe to our newsletter for updates and promotions"
              description="You can unsubscribe at any time"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={form.formState.isSubmitting}
              loadingText="Creating Account..."
            >
              Create Account
            </Button>
          </div>

          {/* Form Debug (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Form Debug</h4>
              <div className="space-y-2 text-sm">
                <div>Valid: {form.formState.isValid.toString()}</div>
                <div>Submitting: {form.formState.isSubmitting.toString()}</div>
                <div>Submit Count: {form.formState.submitCount}</div>
                <div>Errors: {Object.keys(form.formState.errors).length}</div>
                <pre className="mt-2 p-2 bg-background rounded text-xs overflow-auto">
                  {JSON.stringify(form.formState.values, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
```

## Installation Steps

1. **Install Form Management Dependencies**

   ```bash
   # Form validation
   pnpm add zod react-hook-form
   # or
   pnpm add yup @hookform/resolvers

   # Utilities
   pnpm add date-fns
   ```

2. **Install Additional Form Components**

   ```bash
   # File upload
   pnpm add react-dropzone

   # Date picker
   pnpm add react-day-picker

   # Rich text editor (optional)
   pnpm add @tiptap/react @tiptap/pm
   ```

3. **Setup TypeScript Configuration**
   ```bash
   # Type definitions for better form handling
   pnpm add -D @types/node
   ```

This form management system provides comprehensive form handling with validation, accessibility, multi-step capabilities, and excellent developer experience for React applications.
