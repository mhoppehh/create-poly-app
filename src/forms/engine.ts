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
    const question = this.findQuestion(questionId)
    if (!question) {
      throw new Error(`Question with id ${questionId} not found`)
    }

    // For list questions, ensure value is an array
    if (question.type === 'list') {
      if (!Array.isArray(value)) {
        // Initialize as empty array if not provided or not an array
        this.state.answers[questionId] = value === undefined || value === null ? [] : [value]
      } else {
        this.state.answers[questionId] = value
      }
    } else {
      this.state.answers[questionId] = value
    }

    this.state.touched.add(questionId)

    if (this.options.validateOnChange) {
      this.validateQuestion(questionId)
    }

    // Trigger answer change event
    if (this.events.onAnswerChange) {
      this.events.onAnswerChange(questionId, this.state.answers[questionId], this.getState())
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

  // Add item to list question
  addListItem(questionId: string, value: any): void {
    const question = this.findQuestion(questionId)
    if (!question || question.type !== 'list') {
      throw new Error(`Question with id ${questionId} is not a list question`)
    }

    const currentValue = this.state.answers[questionId] || []
    if (!Array.isArray(currentValue)) {
      this.state.answers[questionId] = []
    }

    // Check max items constraint
    const maxItems = question.listConfig?.maxItems
    if (maxItems && currentValue.length >= maxItems) {
      throw new Error(`Cannot add more than ${maxItems} items to ${question.title}`)
    }

    this.state.answers[questionId] = [...currentValue, value]
    this.state.touched.add(questionId)

    if (this.options.validateOnChange) {
      this.validateQuestion(questionId)
    }

    // Trigger answer change event
    if (this.events.onAnswerChange) {
      this.events.onAnswerChange(questionId, this.state.answers[questionId], this.getState())
    }

    // Auto-save if enabled
    if (this.options.autoSave) {
      this.saveState()
    }
  }

  // Remove item from list question
  removeListItem(questionId: string, index: number): void {
    const question = this.findQuestion(questionId)
    if (!question || question.type !== 'list') {
      throw new Error(`Question with id ${questionId} is not a list question`)
    }

    const currentValue = this.state.answers[questionId] || []
    if (!Array.isArray(currentValue) || index < 0 || index >= currentValue.length) {
      throw new Error(`Invalid index ${index} for list question ${questionId}`)
    }

    // Remove the item at the specified index
    const newValue = currentValue.filter((_, i) => i !== index)
    this.state.answers[questionId] = newValue
    this.state.touched.add(questionId)

    if (this.options.validateOnChange) {
      this.validateQuestion(questionId)
    }

    // Trigger answer change event
    if (this.events.onAnswerChange) {
      this.events.onAnswerChange(questionId, newValue, this.getState())
    }

    // Auto-save if enabled
    if (this.options.autoSave) {
      this.saveState()
    }
  }

  // Update specific item in list question
  updateListItem(questionId: string, index: number, value: any): void {
    const question = this.findQuestion(questionId)
    if (!question || question.type !== 'list') {
      throw new Error(`Question with id ${questionId} is not a list question`)
    }

    const currentValue = this.state.answers[questionId] || []
    if (!Array.isArray(currentValue) || index < 0 || index >= currentValue.length) {
      throw new Error(`Invalid index ${index} for list question ${questionId}`)
    }

    // Update the item at the specified index
    const newValue = [...currentValue]
    newValue[index] = value
    this.state.answers[questionId] = newValue
    this.state.touched.add(questionId)

    if (this.options.validateOnChange) {
      this.validateQuestion(questionId)
    }

    // Trigger answer change event
    if (this.events.onAnswerChange) {
      this.events.onAnswerChange(questionId, newValue, this.getState())
    }

    // Auto-save if enabled
    if (this.options.autoSave) {
      this.saveState()
    }
  }

  // Get list item count
  getListItemCount(questionId: string): number {
    const question = this.findQuestion(questionId)
    if (!question || question.type !== 'list') {
      throw new Error(`Question with id ${questionId} is not a list question`)
    }

    const value = this.state.answers[questionId]
    return Array.isArray(value) ? value.length : 0
  }

  // Validate a specific question
  validateQuestion(questionId: string): ValidationResult {
    const question = this.findQuestion(questionId)
    if (!question) {
      throw new Error(`Question with id ${questionId} not found`)
    }

    const value = this.state.answers[questionId]
    const errors: string[] = []

    // Handle list questions
    if (question.type === 'list') {
      const listErrors = this.validateListQuestion(question, value)
      errors.push(...listErrors)
    } else {
      // Run validation rules for non-list questions
      if (question.validation) {
        for (const rule of question.validation) {
          const error = this.runValidationRule(rule, value, question)
          if (error) {
            errors.push(error)
          }
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

  private validateListQuestion(question: Question, value: any): string[] {
    const errors: string[] = []

    if (!question.listConfig) {
      errors.push(`List question ${question.title} is missing list configuration`)
      return errors
    }

    // Ensure value is an array
    if (!Array.isArray(value)) {
      if (question.required) {
        errors.push(`${question.title} must have at least one item`)
      }
      return errors
    }

    // Validate list-level rules first
    if (question.validation) {
      for (const rule of question.validation) {
        const error = this.runValidationRule(rule, value, question)
        if (error) {
          errors.push(error)
        }
      }
    }

    // Apply listConfig constraints
    const { minItems, maxItems } = question.listConfig

    if (minItems !== undefined && value.length < minItems) {
      errors.push(`${question.title} must have at least ${minItems} items`)
    }

    if (maxItems !== undefined && value.length > maxItems) {
      errors.push(`${question.title} must have no more than ${maxItems} items`)
    }

    // Validate each item in the list
    const itemValidation = question.listConfig.itemValidation || []
    for (let i = 0; i < value.length; i++) {
      const itemValue = value[i]

      // Create a virtual question for the item to reuse existing validation logic
      const itemQuestion: Question = {
        id: `${question.id}_item_${i}`,
        type: question.listConfig.itemType,
        title: `${question.title} Item ${i + 1}`,
        required: question.required || false, // Items inherit required from parent
        validation: itemValidation,
        ...(question.listConfig.itemOptions && { options: question.listConfig.itemOptions }),
        ...(question.listConfig.itemProps && { props: question.listConfig.itemProps }),
      }

      // Validate the individual item
      for (const rule of itemValidation) {
        const error = this.runValidationRule(rule, itemValue, itemQuestion)
        if (error) {
          errors.push(`Item ${i + 1}: ${error}`)
        }
      }

      // Apply type-specific validation for the item
      const itemErrors = this.validateItemByType(itemQuestion, itemValue)
      errors.push(...itemErrors.map(err => `Item ${i + 1}: ${err}`))
    }

    return errors
  }

  private validateItemByType(itemQuestion: Question, value: any): string[] {
    const errors: string[] = []

    // Apply basic type validation based on item type
    switch (itemQuestion.type) {
      case 'email':
        if (value && typeof value === 'string') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            errors.push(`must be a valid email address`)
          }
        }
        break

      case 'url':
        if (value && typeof value === 'string') {
          try {
            new URL(value)
          } catch {
            errors.push(`must be a valid URL`)
          }
        }
        break

      case 'number':
        if (value !== undefined && value !== null && value !== '' && isNaN(Number(value))) {
          errors.push(`must be a valid number`)
        }
        break

      case 'boolean':
      case 'toggle':
        if (value !== undefined && typeof value !== 'boolean') {
          errors.push(`must be true or false`)
        }
        break

      case 'select':
        if (value && itemQuestion.options) {
          const validValues = itemQuestion.options.map(opt => opt.value)
          if (!validValues.includes(value)) {
            errors.push(`must be one of: ${validValues.join(', ')}`)
          }
        }
        break

      case 'multiselect':
        if (value && Array.isArray(value) && itemQuestion.options) {
          const validValues = itemQuestion.options.map(opt => opt.value)
          const invalidValues = value.filter(v => !validValues.includes(v))
          if (invalidValues.length > 0) {
            errors.push(`contains invalid values: ${invalidValues.join(', ')}`)
          }
        }
        break

      case 'date':
        if (value && typeof value === 'string') {
          const date = new Date(value)
          if (isNaN(date.getTime())) {
            errors.push(`must be a valid date`)
          }
        }
        break
    }

    return errors
  }

  private runValidationRule(rule: ValidationRule, value: any, question: Question): string | null {
    switch (rule.type) {
      case 'required':
        if (question.required) {
          if (question.type === 'list') {
            if (!Array.isArray(value) || value.length === 0) {
              return rule.message || `${question.title} must have at least one item`
            }
          } else if (value === undefined || value === null || value === '') {
            return rule.message || `${question.title} is required`
          }
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

      case 'minItems':
        if (Array.isArray(value) && value.length < rule.value) {
          return rule.message || `${question.title} must have at least ${rule.value} items`
        }
        break

      case 'maxItems':
        if (Array.isArray(value) && value.length > rule.value) {
          return rule.message || `${question.title} must have no more than ${rule.value} items`
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
