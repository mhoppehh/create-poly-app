export type QuestionType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'toggle'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'email'
  | 'password'
  | 'url'
  | 'list'

export type ValidationRule =
  | { type: 'required'; message?: string }
  | { type: 'minLength'; value: number; message?: string }
  | { type: 'maxLength'; value: number; message?: string }
  | { type: 'min'; value: number; message?: string }
  | { type: 'max'; value: number; message?: string }
  | { type: 'pattern'; value: RegExp; message?: string }
  | { type: 'email'; message?: string }
  | { type: 'url'; message?: string }
  | { type: 'minItems'; value: number; message?: string }
  | { type: 'maxItems'; value: number; message?: string }
  | { type: 'custom'; validator: (value: any) => boolean | string; message?: string }

export interface SelectOption {
  label: string
  value: string | number | boolean
  description?: string
}

export interface ListConfig {
  itemType: Exclude<QuestionType, 'list'>

  minItems?: number

  maxItems?: number

  itemOptions?: SelectOption[]

  itemValidation?: ValidationRule[]

  itemProps?: Record<string, any>

  itemPlaceholder?: string

  addLabel?: string

  removeLabel?: string
}

export interface ConditionalRule {
  dependsOn: string

  condition:
    | { type: 'equals'; value: any }
    | { type: 'notEquals'; value: any }
    | { type: 'in'; values: any[] }
    | { type: 'notIn'; values: any[] }
    | { type: 'greaterThan'; value: number }
    | { type: 'lessThan'; value: number }
    | { type: 'contains'; value: string }
    | { type: 'includes'; value: any }
    | { type: 'custom'; evaluator: (value: any, allAnswers: Record<string, any>) => boolean }
}

export interface Question {
  id: string
  type: QuestionType
  title: string
  description?: string
  required?: boolean
  defaultValue?: any
  placeholder?: string

  options?: SelectOption[]

  listConfig?: ListConfig

  validation?: ValidationRule[]

  showIf?: ConditionalRule[]

  props?: Record<string, any>
}

export interface QuestionGroup {
  id: string
  title?: string
  description?: string
  questions: Question[]
  showIf?: ConditionalRule[]
}

export interface Form {
  id: string
  title: string
  description?: string
  groups: QuestionGroup[]

  settings?: {
    allowBack?: boolean
    showProgress?: boolean
    submitLabel?: string
    cancelLabel?: string
  }
}

export interface Answer {
  questionId: string
  value: any
  isValid?: boolean
  errors?: string[]
}

export interface FormState {
  formId: string
  answers: Record<string, any>
  currentGroupIndex: number
  isComplete: boolean
  errors: Record<string, string[]>
  touched: Set<string>
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
}

export interface FormEvents {
  onAnswerChange?: (questionId: string, value: any, formState: FormState) => void
  onQuestionValidate?: (questionId: string, result: ValidationResult) => void
  onGroupComplete?: (groupId: string, formState: FormState) => void
  onFormComplete?: (formState: FormState) => void
  onFormCancel?: (formState: FormState) => void
}

export interface FormEngineOptions {
  validateOnChange?: boolean
  validateOnBlur?: boolean
  autoSave?: boolean
  saveKey?: string
}
