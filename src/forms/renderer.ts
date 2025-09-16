import prompts from 'prompts'
import { Form, Question, QuestionType, SelectOption } from './types'
import { FormEngine } from './engine'

export class FormRenderer {
  private engine: FormEngine

  constructor(engine: FormEngine) {
    this.engine = engine
  }

  // Main method to run the form and collect answers
  async run(): Promise<Record<string, any>> {
    const form = this.engine['form'] // Access private form property

    console.log(`\n${form.title}`)
    if (form.description) {
      console.log(form.description)
    }

    let shouldContinue = true

    while (shouldContinue && !this.engine.getState().isComplete) {
      const visibleGroups = this.engine.getVisibleGroups()
      const currentGroupIndex = this.engine.getState().currentGroupIndex

      if (currentGroupIndex >= visibleGroups.length) {
        throw new Error('Current group index is out of bounds')
      }

      const currentGroup = visibleGroups[currentGroupIndex]
      const questions = this.engine.getCurrentQuestions()

      if (!currentGroup) {
        throw new Error(`Group with index ${currentGroupIndex} not found`)
      }
      if (questions.length === 0) {
        // No questions in this group, move to next
        this.engine.next()
        continue
      }

      // Show group title if exists
      if (currentGroup.title) {
        console.log(`\n--- ${currentGroup.title} ---`)
        if (currentGroup.description) {
          console.log(currentGroup.description)
        }
      }

      // Show progress if enabled
      if (form.settings?.showProgress) {
        const progress = `(${currentGroupIndex + 1}/${visibleGroups.length})`
        console.log(`Progress: ${progress}`)
      }

      // Process questions one at a time to allow early termination
      const groupAnswers: Record<string, any> = {}

      for (const question of questions) {
        const promptQuestion = this.questionToPrompt(question)

        try {
          const answer = await prompts(promptQuestion, {
            onCancel: () => {
              this.engine.cancel()
              return false
            },
          })

          // Check if user cancelled
          if (!answer.hasOwnProperty(question.id)) {
            shouldContinue = false
            break
          }

          groupAnswers[question.id] = answer[question.id]
          this.engine.setAnswer(question.id, answer[question.id])
        } catch (error) {
          console.error('Question interrupted:', error)
          shouldContinue = false
          break
        }
      }

      // Check if we have any answers to process
      if (Object.keys(groupAnswers).length === 0) {
        shouldContinue = false
        break
      }

      try {
        // Try to move to next group
        const canProceed = this.engine.next()
        if (!canProceed && !this.engine.getState().isComplete) {
          // Validation failed, show errors and stay on current group
          const state = this.engine.getState()
          console.log('\n❌ Please fix the following errors:')
          for (const [questionId, errors] of Object.entries(state.errors)) {
            const question = questions.find(q => q.id === questionId)
            if (question && errors.length > 0) {
              console.log(`  • ${question.title}: ${errors.join(', ')}`)
            }
          }
          console.log()
        }
      } catch (error) {
        console.error('Form interrupted:', error)
        shouldContinue = false
      }
    }

    return this.engine.getState().answers
  }

  // Convert a Question to prompts format
  private questionToPrompt(question: Question): prompts.PromptObject {
    const basePrompt: prompts.PromptObject = {
      type: this.mapQuestionType(question.type) as prompts.PromptType,
      name: question.id,
      message: question.title,
      initial: this.getInitialValue(question),
    }

    // Add description as hint if present
    if (question.description) {
      basePrompt.hint = question.description
    }

    // Add placeholder for text inputs
    if (question.placeholder && ['text', 'password', 'email', 'url'].includes(question.type)) {
      basePrompt.hint = question.placeholder
    }

    // Handle select/multiselect options
    if (question.options && ['select', 'multiselect'].includes(question.type)) {
      basePrompt.choices = question.options.map(option => ({
        title: option.label,
        description: option.description,
        value: option.value,
      }))
    }

    // Add validation
    if (question.validation || question.required) {
      basePrompt.validate = (value: any) => this.validateInput(question, value)
    }

    // Handle specific question type configurations
    switch (question.type) {
      case 'boolean':
      case 'toggle':
        basePrompt.active = 'yes'
        basePrompt.inactive = 'no'
        break

      case 'number':
        basePrompt.validate = (value: any) => {
          const numValue = Number(value)
          if (isNaN(numValue)) {
            return 'Please enter a valid number'
          }
          return this.validateInput(question, numValue)
        }
        break

      case 'date':
        basePrompt.validate = (value: any) => {
          const date = new Date(value)
          if (isNaN(date.getTime())) {
            return 'Please enter a valid date'
          }
          return this.validateInput(question, value)
        }
        break
    }

    // Apply any additional props
    if (question.props) {
      Object.assign(basePrompt, question.props)
    }

    return basePrompt
  }

  // Map our question types to prompts types
  private mapQuestionType(type: QuestionType): string {
    const typeMap: Record<QuestionType, string> = {
      text: 'text',
      number: 'number',
      boolean: 'confirm',
      toggle: 'toggle',
      select: 'select',
      multiselect: 'multiselect',
      date: 'date',
      email: 'text',
      password: 'password',
      url: 'text',
    }

    return typeMap[type] || 'text'
  }

  // Validate input using the form engine
  private validateInput(question: Question, value: any): boolean | string {
    // Create a temporary engine state for validation
    const tempEngine = new FormEngine(this.engine['form'], this.engine['options'])
    tempEngine['state'] = { ...this.engine.getState() }
    tempEngine.setAnswer(question.id, value)

    const result = tempEngine.validateQuestion(question.id)

    if (!result.isValid && result.errors[question.id]) {
      const errors = result.errors[question.id]
      if (errors && errors.length > 0 && errors[0]) {
        return errors[0] // Return first error message
      }
    }

    return true
  }

  // Get the proper initial value for different question types
  private getInitialValue(question: Question): any {
    const currentValue = this.engine.getAnswer(question.id)
    const defaultValue = question.defaultValue

    // For select questions, convert value to index
    if (question.type === 'select' && question.options) {
      const valueToUse = currentValue !== undefined ? currentValue : defaultValue
      if (valueToUse !== undefined) {
        const index = question.options.findIndex(option => option.value === valueToUse)
        return index >= 0 ? index : undefined
      }
      return undefined
    }

    // For multiselect questions, convert values to indices
    if (question.type === 'multiselect' && question.options) {
      const valueToUse = currentValue !== undefined ? currentValue : defaultValue
      if (Array.isArray(valueToUse)) {
        return valueToUse
          .map(value => question.options!.findIndex(option => option.value === value))
          .filter(index => index >= 0)
      }
      return []
    }

    // For all other question types, use the value directly
    return currentValue !== undefined ? currentValue : defaultValue
  }
}

// Utility function to create and run a form
export async function runForm(form: Form, options = {}): Promise<Record<string, any>> {
  const engine = new FormEngine(form, options)
  const renderer = new FormRenderer(engine)
  return await renderer.run()
}
