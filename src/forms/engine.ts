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
  Preset,
} from './types'
import { PresetManager } from './preset-manager'

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

    if (this.options.autoSave && this.options.saveKey) {
      this.loadState()
    }
  }

  getState(): FormState {
    return { ...this.state }
  }

  getVisibleGroups(): QuestionGroup[] {
    return this.form.groups.filter(group => this.shouldShowElement(group.showIf))
  }

  getVisibleQuestions(groupId: string): Question[] {
    const group = this.form.groups.find(g => g.id === groupId)
    if (!group) throw new Error(`Group with id ${groupId} not found`)

    return group.questions.filter(question => this.shouldShowElement(question.showIf))
  }

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

  setAnswer(questionId: string, value: any): void {
    const question = this.findQuestion(questionId)
    if (!question) {
      throw new Error(`Question with id ${questionId} not found`)
    }

    if (question.type === 'list') {
      if (!Array.isArray(value)) {
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

    if (this.events.onAnswerChange) {
      this.events.onAnswerChange(questionId, this.state.answers[questionId], this.getState())
    }

    if (this.options.autoSave) {
      this.saveState()
    }
  }

  getAnswer(questionId: string): any {
    return this.state.answers[questionId]
  }

  addListItem(questionId: string, value: any): void {
    const question = this.findQuestion(questionId)
    if (!question || question.type !== 'list') {
      throw new Error(`Question with id ${questionId} is not a list question`)
    }

    const currentValue = this.state.answers[questionId] || []
    if (!Array.isArray(currentValue)) {
      this.state.answers[questionId] = []
    }

    const maxItems = question.listConfig?.maxItems
    if (maxItems && currentValue.length >= maxItems) {
      throw new Error(`Cannot add more than ${maxItems} items to ${question.title}`)
    }

    this.state.answers[questionId] = [...currentValue, value]
    this.state.touched.add(questionId)

    if (this.options.validateOnChange) {
      this.validateQuestion(questionId)
    }

    if (this.events.onAnswerChange) {
      this.events.onAnswerChange(questionId, this.state.answers[questionId], this.getState())
    }

    if (this.options.autoSave) {
      this.saveState()
    }
  }

  removeListItem(questionId: string, index: number): void {
    const question = this.findQuestion(questionId)
    if (!question || question.type !== 'list') {
      throw new Error(`Question with id ${questionId} is not a list question`)
    }

    const currentValue = this.state.answers[questionId] || []
    if (!Array.isArray(currentValue) || index < 0 || index >= currentValue.length) {
      throw new Error(`Invalid index ${index} for list question ${questionId}`)
    }

    const newValue = currentValue.filter((_, i) => i !== index)
    this.state.answers[questionId] = newValue
    this.state.touched.add(questionId)

    if (this.options.validateOnChange) {
      this.validateQuestion(questionId)
    }

    if (this.events.onAnswerChange) {
      this.events.onAnswerChange(questionId, newValue, this.getState())
    }

    if (this.options.autoSave) {
      this.saveState()
    }
  }

  updateListItem(questionId: string, index: number, value: any): void {
    const question = this.findQuestion(questionId)
    if (!question || question.type !== 'list') {
      throw new Error(`Question with id ${questionId} is not a list question`)
    }

    const currentValue = this.state.answers[questionId] || []
    if (!Array.isArray(currentValue) || index < 0 || index >= currentValue.length) {
      throw new Error(`Invalid index ${index} for list question ${questionId}`)
    }

    const newValue = [...currentValue]
    newValue[index] = value
    this.state.answers[questionId] = newValue
    this.state.touched.add(questionId)

    if (this.options.validateOnChange) {
      this.validateQuestion(questionId)
    }

    if (this.events.onAnswerChange) {
      this.events.onAnswerChange(questionId, newValue, this.getState())
    }

    if (this.options.autoSave) {
      this.saveState()
    }
  }

  getListItemCount(questionId: string): number {
    const question = this.findQuestion(questionId)
    if (!question || question.type !== 'list') {
      throw new Error(`Question with id ${questionId} is not a list question`)
    }

    const value = this.state.answers[questionId]
    return Array.isArray(value) ? value.length : 0
  }

  validateQuestion(questionId: string): ValidationResult {
    const question = this.findQuestion(questionId)
    if (!question) {
      throw new Error(`Question with id ${questionId} not found`)
    }

    const value = this.state.answers[questionId]
    const errors: string[] = []

    if (question.type === 'list') {
      const listErrors = this.validateListQuestion(question, value)
      errors.push(...listErrors)
    } else {
      if (question.validation) {
        for (const rule of question.validation) {
          const error = this.runValidationRule(rule, value, question)
          if (error) {
            errors.push(error)
          }
        }
      }
    }

    if (errors.length > 0) {
      this.state.errors[questionId] = errors
    } else {
      delete this.state.errors[questionId]
    }

    const result = {
      isValid: errors.length === 0,
      errors: { [questionId]: errors },
    }

    if (this.events.onQuestionValidate) {
      this.events.onQuestionValidate(questionId, result)
    }

    return result
  }

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
      this.state.isComplete = true
      if (this.events.onFormComplete) {
        this.events.onFormComplete(this.getState())
      }
      return false
    }
  }

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

  canGoNext(): boolean {
    return this.validateCurrentGroup().isValid
  }

  canGoPrevious(): boolean {
    return this.state.currentGroupIndex > 0 && this.form.settings?.allowBack !== false
  }

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

  cancel(): void {
    if (this.events.onFormCancel) {
      this.events.onFormCancel(this.getState())
    }
  }

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
      case 'includes':
        return Array.isArray(dependentValue) && dependentValue.includes(rule.condition.value)
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

    if (!Array.isArray(value)) {
      if (question.required) {
        errors.push(`${question.title} must have at least one item`)
      }
      return errors
    }

    if (question.validation) {
      for (const rule of question.validation) {
        const error = this.runValidationRule(rule, value, question)
        if (error) {
          errors.push(error)
        }
      }
    }

    const { minItems, maxItems } = question.listConfig

    if (minItems !== undefined && value.length < minItems) {
      errors.push(`${question.title} must have at least ${minItems} items`)
    }

    if (maxItems !== undefined && value.length > maxItems) {
      errors.push(`${question.title} must have no more than ${maxItems} items`)
    }

    const itemValidation = question.listConfig.itemValidation || []
    for (let i = 0; i < value.length; i++) {
      const itemValue = value[i]

      const itemQuestion: Question = {
        id: `${question.id}_item_${i}`,
        type: question.listConfig.itemType,
        title: `${question.title} Item ${i + 1}`,
        required: question.required || false,
        validation: itemValidation,
        ...(question.listConfig.itemOptions && { options: question.listConfig.itemOptions }),
        ...(question.listConfig.itemProps && { props: question.listConfig.itemProps }),
      }

      for (const rule of itemValidation) {
        const error = this.runValidationRule(rule, itemValue, itemQuestion)
        if (error) {
          errors.push(`Item ${i + 1}: ${error}`)
        }
      }

      const itemErrors = this.validateItemByType(itemQuestion, itemValue)
      errors.push(...itemErrors.map(err => `Item ${i + 1}: ${err}`))
    }

    return errors
  }

  private validateItemByType(itemQuestion: Question, value: any): string[] {
    const errors: string[] = []

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

  async loadPreset(presetId: string, presetManager?: PresetManager): Promise<boolean> {
    const manager = presetManager || new PresetManager()
    const preset = await manager.getPreset(presetId)

    if (!preset) {
      return false
    }

    // Verify the preset is for this form
    if (preset.formId !== this.form.id) {
      console.warn(`Preset ${presetId} is for form ${preset.formId}, but current form is ${this.form.id}`)
      return false
    }

    // Load the answers
    this.state.answers = { ...preset.answers }

    // Clear errors and reset touched state
    this.state.errors = {}
    this.state.touched = new Set()

    // Reset to first group
    this.state.currentGroupIndex = 0
    this.state.isComplete = false

    // Save state if auto-save is enabled
    if (this.options.autoSave) {
      this.saveState()
    }

    return true
  }

  async saveAsPreset(
    name: string,
    description?: string,
    tags?: string[],
    presetManager?: PresetManager,
  ): Promise<Preset | null> {
    const manager = presetManager || new PresetManager()

    try {
      const presetData: Omit<Preset, 'id' | 'createdAt' | 'updatedAt'> = {
        name,
        formId: this.form.id,
        answers: { ...this.state.answers },
      }

      if (description !== undefined) {
        presetData.description = description
      }

      if (tags !== undefined) {
        presetData.tags = tags
      }

      const preset = await manager.savePreset(presetData)

      return preset
    } catch (error) {
      console.error('Failed to save preset:', error)
      return null
    }
  }

  async getFormPresets(presetManager?: PresetManager): Promise<Preset[]> {
    const manager = presetManager || new PresetManager()
    return await manager.getPresetsForForm(this.form.id)
  }

  canSaveAsPreset(): boolean {
    return Object.keys(this.state.answers).length > 0
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
        console.warn('Failed to load form state:', error)
      }
    }
  }
}
