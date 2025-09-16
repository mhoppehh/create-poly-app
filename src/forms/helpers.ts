import { Form, Question, QuestionGroup, SelectOption, ValidationRule, ConditionalRule } from './types'

/**
 * Form Builder utility class for creating forms programmatically
 */
export class FormBuilder {
  private form: Partial<Form>
  private currentGroup: Partial<QuestionGroup> | null = null

  constructor(id: string, title: string) {
    this.form = {
      id,
      title,
      groups: [],
    }
  }

  /**
   * Set form description
   */
  description(description: string): FormBuilder {
    this.form.description = description
    return this
  }

  /**
   * Set form settings
   */
  settings(settings: NonNullable<Form['settings']>): FormBuilder {
    this.form.settings = settings
    return this
  }

  /**
   * Start a new question group
   */
  group(id: string, title?: string, description?: string): FormBuilder {
    // Save current group if exists
    if (this.currentGroup) {
      this.form.groups!.push(this.currentGroup as QuestionGroup)
    }

    this.currentGroup = {
      id,
      ...(title && { title }),
      ...(description && { description }),
      questions: [],
    }
    return this
  }

  /**
   * Set conditional rules for current group
   */
  groupShowIf(conditions: ConditionalRule[]): FormBuilder {
    if (!this.currentGroup) {
      throw new Error('No group started. Call group() first.')
    }
    this.currentGroup.showIf = conditions
    return this
  }

  /**
   * Add a question to the current group
   */
  question(question: Partial<Question> & { id: string; type: Question['type']; title: string }): FormBuilder {
    if (!this.currentGroup) {
      throw new Error('No group started. Call group() first.')
    }

    const fullQuestion: Question = {
      required: false,
      ...question,
    }

    this.currentGroup.questions!.push(fullQuestion)
    return this
  }

  /**
   * Build and return the complete form
   */
  build(): Form {
    // Save current group if exists
    if (this.currentGroup) {
      this.form.groups!.push(this.currentGroup as QuestionGroup)
      this.currentGroup = null
    }

    return this.form as Form
  }
}

/**
 * Helper functions for common question types and validation rules
 */
export const QuestionHelpers = {
  /**
   * Create a text question
   */
  text(
    id: string,
    title: string,
    options: Partial<Question> = {},
  ): Partial<Question> & { id: string; type: 'text'; title: string } {
    return {
      id,
      type: 'text',
      title,
      ...options,
    }
  },

  /**
   * Create a number question
   */
  number(
    id: string,
    title: string,
    options: Partial<Question> = {},
  ): Partial<Question> & { id: string; type: 'number'; title: string } {
    return {
      id,
      type: 'number',
      title,
      ...options,
    }
  },

  /**
   * Create a boolean/toggle question
   */
  toggle(
    id: string,
    title: string,
    options: Partial<Question> = {},
  ): Partial<Question> & { id: string; type: 'toggle'; title: string } {
    return {
      id,
      type: 'toggle',
      title,
      ...options,
    }
  },

  /**
   * Create a select question
   */
  select(
    id: string,
    title: string,
    options: SelectOption[],
    questionOptions: Partial<Question> = {},
  ): Partial<Question> & { id: string; type: 'select'; title: string } {
    return {
      id,
      type: 'select',
      title,
      options,
      ...questionOptions,
    }
  },

  /**
   * Create a multiselect question
   */
  multiselect(
    id: string,
    title: string,
    options: SelectOption[],
    questionOptions: Partial<Question> = {},
  ): Partial<Question> & { id: string; type: 'multiselect'; title: string } {
    return {
      id,
      type: 'multiselect',
      title,
      options,
      ...questionOptions,
    }
  },
}

/**
 * Helper functions for validation rules
 */
export const ValidationHelpers = {
  required(message?: string): ValidationRule {
    return message ? { type: 'required', message } : { type: 'required' }
  },

  minLength(value: number, message?: string): ValidationRule {
    return message ? { type: 'minLength', value, message } : { type: 'minLength', value }
  },

  maxLength(value: number, message?: string): ValidationRule {
    return message ? { type: 'maxLength', value, message } : { type: 'maxLength', value }
  },

  pattern(value: RegExp, message?: string): ValidationRule {
    return message ? { type: 'pattern', value, message } : { type: 'pattern', value }
  },

  email(message?: string): ValidationRule {
    return message ? { type: 'email', message } : { type: 'email' }
  },

  url(message?: string): ValidationRule {
    return message ? { type: 'url', message } : { type: 'url' }
  },

  min(value: number, message?: string): ValidationRule {
    return message ? { type: 'min', value, message } : { type: 'min', value }
  },

  max(value: number, message?: string): ValidationRule {
    return message ? { type: 'max', value, message } : { type: 'max', value }
  },

  custom(validator: (value: any) => boolean | string, message?: string): ValidationRule {
    return message ? { type: 'custom', validator, message } : { type: 'custom', validator }
  },
}

/**
 * Helper functions for conditional rules
 */
export const ConditionalHelpers = {
  equals(dependsOn: string, value: any): ConditionalRule {
    return { dependsOn, condition: { type: 'equals', value } }
  },

  notEquals(dependsOn: string, value: any): ConditionalRule {
    return { dependsOn, condition: { type: 'notEquals', value } }
  },

  in(dependsOn: string, values: any[]): ConditionalRule {
    return { dependsOn, condition: { type: 'in', values } }
  },

  notIn(dependsOn: string, values: any[]): ConditionalRule {
    return { dependsOn, condition: { type: 'notIn', values } }
  },

  greaterThan(dependsOn: string, value: number): ConditionalRule {
    return { dependsOn, condition: { type: 'greaterThan', value } }
  },

  lessThan(dependsOn: string, value: number): ConditionalRule {
    return { dependsOn, condition: { type: 'lessThan', value } }
  },

  contains(dependsOn: string, value: string): ConditionalRule {
    return { dependsOn, condition: { type: 'contains', value } }
  },

  custom(dependsOn: string, evaluator: (value: any, allAnswers: Record<string, any>) => boolean): ConditionalRule {
    return { dependsOn, condition: { type: 'custom', evaluator } }
  },
}

/**
 * Create common select options
 */
export const OptionHelpers = {
  /**
   * Yes/No options
   */
  yesNo(): SelectOption[] {
    return [
      { label: 'Yes', value: true },
      { label: 'No', value: false },
    ]
  },

  /**
   * Package manager options
   */
  packageManagers(): SelectOption[] {
    return [
      { label: 'pnpm (recommended)', value: 'pnpm', description: 'Fast, disk space efficient' },
      { label: 'npm', value: 'npm', description: 'Default Node.js package manager' },
      { label: 'yarn', value: 'yarn', description: 'Fast, reliable, and secure' },
    ]
  },

  /**
   * Experience level options
   */
  experienceLevels(): SelectOption[] {
    return [
      { label: 'Beginner (0-1 years)', value: 'beginner' },
      { label: 'Intermediate (1-3 years)', value: 'intermediate' },
      { label: 'Advanced (3-5 years)', value: 'advanced' },
      { label: 'Expert (5+ years)', value: 'expert' },
    ]
  },

  /**
   * Framework options
   */
  frontendFrameworks(): SelectOption[] {
    return [
      { label: 'React', value: 'react', description: 'A JavaScript library for building user interfaces' },
      { label: 'Vue.js', value: 'vue', description: 'The Progressive JavaScript Framework' },
      { label: 'Angular', value: 'angular', description: 'Platform for building mobile and desktop web applications' },
      { label: 'Svelte', value: 'svelte', description: 'Cybernetically enhanced web apps' },
    ]
  },
}
