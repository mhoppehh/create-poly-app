import {
  Form,
  FormState,
  Question,
  QuestionGroup,
  ValidationRule,
  ValidationResult,
  ConditionalRule,
  FormEngineOptions,
  FormEvents,
} from './types'

export class FormEngine {
  private form: Form
  private state: FormState
  private options: FormEngineOptions
  private events: FormEvents

  constructor(form: Form, options: FormEngineOptions = {}, events: FormEvents = {}) {
    this.form = form
    this.options = {
      validateOnChange: true,
      validateOnBlur: true,
      autoSave: false,
      ...options,
    }
    this.events = events

    this.state = {
      formId: form.id,
      answers: {},
      currentGroupIndex: 0,
      isComplete: false,
      errors: {},
      touched: new Set(),
    }

    // Load saved state if autoSave is enabled
    if (this.options.autoSave && this.options.saveKey) {
      this.loadState()
    }
  }

  // Get current form state
  getState(): FormState {
    return { ...this.state }
  }

  // Get all visible groups based on current answers
  getVisibleGroups(): QuestionGroup[] {
    return this.form.groups.filter(group => this.shouldShowElement(group.showIf))
  }

  // Get visible questions for a specific group
  getVisibleQuestions(groupId: string): Question[] {
    const group = this.form.groups.find(g => g.id === groupId)
    if (!group) throw new Error(`Group with id ${groupId} not found`)

    return group.questions.filter(question => this.shouldShowElement(question.showIf))
  }

  // Get questions for current group
  getCurrentQuestions(): Question[] {
    const visibleGroups = this.getVisibleGroups()
    if (this.state.currentGroupIndex >= visibleGroups.length) {
      throw new Error('Current group index is out of bounds')
    }

    const currentGroup = visibleGroups[this.state.currentGroupIndex]
    if (!currentGroup) {
      throw new Error(`Group with index ${this.state.currentGroupIndex} not found`)
    }

    return this.getVisibleQuestions(currentGroup.id)
  }

  // Set answer for a question
  setAnswer(questionId: string, value: any): void {
    this.state.answers[questionId] = value
    this.state.touched.add(questionId)

    if (this.options.validateOnChange) {
      this.validateQuestion(questionId)
    }

    // Trigger answer change event
    if (this.events.onAnswerChange) {
      this.events.onAnswerChange(questionId, value, this.getState())
    }

    // Auto-save if enabled
    if (this.options.autoSave) {
      this.saveState()
    }
  }

  // Get answer for a question
  getAnswer(questionId: string): any {
    return this.state.answers[questionId]
  }

  // Validate a specific question
  validateQuestion(questionId: string): ValidationResult {
    const question = this.findQuestion(questionId)
    if (!question) {
      throw new Error(`Question with id ${questionId} not found`)
    }

    const value = this.state.answers[questionId]
    const errors: string[] = []

    // Run validation rules
    if (question.validation) {
      for (const rule of question.validation) {
        const error = this.runValidationRule(rule, value, question)
        if (error) {
          errors.push(error)
        }
      }
    }

    // Update state
    if (errors.length > 0) {
      this.state.errors[questionId] = errors
    } else {
      delete this.state.errors[questionId]
    }

    const result = {
      isValid: errors.length === 0,
      errors: { [questionId]: errors },
    }

    // Trigger validation event
    if (this.events.onQuestionValidate) {
      this.events.onQuestionValidate(questionId, result)
    }

    return result
  }

  // Validate all visible questions in current group
  validateCurrentGroup(): ValidationResult {
    const questions = this.getCurrentQuestions()
    const allErrors: Record<string, string[]> = {}
    let isValid = true

    for (const question of questions) {
      const result = this.validateQuestion(question.id)
      if (!result.isValid) {
        isValid = false
        Object.assign(allErrors, result.errors)
      }
    }

    return { isValid, errors: allErrors }
  }

  // Move to next group
  next(): boolean {
    const validation = this.validateCurrentGroup()
    if (!validation.isValid) {
      return false
    }

    const visibleGroups = this.getVisibleGroups()
    const currentGroup = visibleGroups[this.state.currentGroupIndex]

    if (this.events.onGroupComplete && currentGroup) {
      this.events.onGroupComplete(currentGroup.id, this.getState())
    }

    if (this.state.currentGroupIndex < visibleGroups.length - 1) {
      this.state.currentGroupIndex++
      if (this.options.autoSave) {
        this.saveState()
      }
      return true
    } else {
      // Form is complete
      this.state.isComplete = true
      if (this.events.onFormComplete) {
        this.events.onFormComplete(this.getState())
      }
      return false
    }
  }

  // Move to previous group
  previous(): boolean {
    if (this.state.currentGroupIndex > 0) {
      this.state.currentGroupIndex--
      if (this.options.autoSave) {
        this.saveState()
      }
      return true
    }
    return false
  }

  // Check if can go to next group
  canGoNext(): boolean {
    return this.validateCurrentGroup().isValid
  }

  // Check if can go to previous group
  canGoPrevious(): boolean {
    return this.state.currentGroupIndex > 0 && this.form.settings?.allowBack !== false
  }

  // Reset form state
  reset(): void {
    this.state = {
      formId: this.form.id,
      answers: {},
      currentGroupIndex: 0,
      isComplete: false,
      errors: {},
      touched: new Set(),
    }

    if (this.options.autoSave && this.options.saveKey) {
      localStorage.removeItem(this.options.saveKey)
    }
  }

  // Cancel form
  cancel(): void {
    if (this.events.onFormCancel) {
      this.events.onFormCancel(this.getState())
    }
  }

  // Private helper methods
  private findQuestion(questionId: string): Question | undefined {
    for (const group of this.form.groups) {
      const question = group.questions.find(q => q.id === questionId)
      if (question) return question
    }
    return undefined
  }

  private shouldShowElement(conditions?: ConditionalRule[]): boolean {
    if (!conditions || conditions.length === 0) {
      return true
    }

    return conditions.every(condition => this.evaluateCondition(condition))
  }

  private evaluateCondition(rule: ConditionalRule): boolean {
    const dependentValue = this.state.answers[rule.dependsOn]

    switch (rule.condition.type) {
      case 'equals':
        return dependentValue === rule.condition.value
      case 'notEquals':
        return dependentValue !== rule.condition.value
      case 'in':
        return rule.condition.values.includes(dependentValue)
      case 'notIn':
        return !rule.condition.values.includes(dependentValue)
      case 'greaterThan':
        return typeof dependentValue === 'number' && dependentValue > rule.condition.value
      case 'lessThan':
        return typeof dependentValue === 'number' && dependentValue < rule.condition.value
      case 'contains':
        return typeof dependentValue === 'string' && dependentValue.includes(rule.condition.value)
      case 'custom':
        return rule.condition.evaluator(dependentValue, this.state.answers)
      default:
        return false
    }
  }

  private runValidationRule(rule: ValidationRule, value: any, question: Question): string | null {
    switch (rule.type) {
      case 'required':
        if (question.required && (value === undefined || value === null || value === '')) {
          return rule.message || `${question.title} is required`
        }
        break

      case 'minLength':
        if (typeof value === 'string' && value.length < rule.value) {
          return rule.message || `${question.title} must be at least ${rule.value} characters`
        }
        break

      case 'maxLength':
        if (typeof value === 'string' && value.length > rule.value) {
          return rule.message || `${question.title} must be no more than ${rule.value} characters`
        }
        break

      case 'min':
        if (typeof value === 'number' && value < rule.value) {
          return rule.message || `${question.title} must be at least ${rule.value}`
        }
        break

      case 'max':
        if (typeof value === 'number' && value > rule.value) {
          return rule.message || `${question.title} must be no more than ${rule.value}`
        }
        break

      case 'pattern':
        if (typeof value === 'string' && !rule.value.test(value)) {
          return rule.message || `${question.title} format is invalid`
        }
        break

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (typeof value === 'string' && !emailRegex.test(value)) {
          return rule.message || `${question.title} must be a valid email address`
        }
        break

      case 'url':
        try {
          if (typeof value === 'string') {
            new URL(value)
          }
        } catch {
          return rule.message || `${question.title} must be a valid URL`
        }
        break

      case 'custom':
        const result = rule.validator(value)
        if (typeof result === 'string') {
          return result
        } else if (!result) {
          return rule.message || `${question.title} is invalid`
        }
        break
    }

    return null
  }

  private saveState(): void {
    if (this.options.saveKey && typeof localStorage !== 'undefined') {
      const stateToSave = {
        ...this.state,
        touched: Array.from(this.state.touched),
      }
      localStorage.setItem(this.options.saveKey, JSON.stringify(stateToSave))
    }
  }

  private loadState(): void {
    if (this.options.saveKey && typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(this.options.saveKey)
        if (saved) {
          const parsedState = JSON.parse(saved)
          this.state = {
            ...parsedState,
            touched: new Set(parsedState.touched || []),
          }
        }
      } catch (error) {
        // Ignore loading errors
        console.warn('Failed to load form state:', error)
      }
    }
  }
}
