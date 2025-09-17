import { FEATURES } from '../features'
import type { Feature, FeatureActivationCondition, FeatureActivationRule } from '../types'

export function evaluateCondition(condition: FeatureActivationCondition, answers: Record<string, any>): boolean {
  const value = answers[condition.questionId]

  switch (condition.condition.type) {
    case 'equals':
      return value === condition.condition.value
    case 'includes':
      return Array.isArray(value) && value.includes(condition.condition.value)
    case 'contains':
      return typeof value === 'string' && value.includes(condition.condition.value)
    case 'in':
      return condition.condition.values.includes(value)
    case 'custom':
      return condition.condition.evaluator(value, answers)
    default:
      return false
  }
}

export function evaluateRule(
  rule: FeatureActivationRule | FeatureActivationCondition,
  answers: Record<string, any>,
): boolean {
  if ('questionId' in rule) {
    return evaluateCondition(rule, answers)
  }

  if (rule.type === 'and') {
    return rule.conditions.every(condition => evaluateRule(condition, answers))
  } else if (rule.type === 'or') {
    return rule.conditions.some(condition => evaluateRule(condition, answers))
  }

  return false
}

export function selectFeaturesFromAnswers(answers: Record<string, any>): string[] {
  const enabledFeatures: string[] = []

  enabledFeatures.push('projectDir')

  for (const [featureId, feature] of Object.entries(FEATURES)) {
    if (featureId === 'projectDir') continue

    if (feature.activatedBy && evaluateRule(feature.activatedBy, answers)) {
      enabledFeatures.push(featureId)
    }
  }

  return resolveDependencies(enabledFeatures)
}

function resolveDependencies(features: string[]): string[] {
  const resolved = new Set(features)
  const toProcess = [...features]

  while (toProcess.length > 0) {
    const featureId = toProcess.pop()!
    const feature = FEATURES[featureId]

    if (feature?.dependsOn) {
      for (const dependency of feature.dependsOn) {
        if (!resolved.has(dependency)) {
          resolved.add(dependency)
          toProcess.push(dependency)
        }
      }
    }
  }

  return Array.from(resolved)
}

export const ActivationConditions = {
  includesValue: (questionId: string, value: any): FeatureActivationCondition => ({
    questionId,
    condition: { type: 'includes', value },
  }),

  equals: (questionId: string, value: any): FeatureActivationCondition => ({
    questionId,
    condition: { type: 'equals', value },
  }),

  isOneOf: (questionId: string, values: any[]): FeatureActivationCondition => ({
    questionId,
    condition: { type: 'in', values },
  }),

  custom: (
    questionId: string,
    evaluator: (value: any, allAnswers: Record<string, any>) => boolean,
  ): FeatureActivationCondition => ({
    questionId,
    condition: { type: 'custom', evaluator },
  }),
}

export const ActivationRules = {
  and: (...conditions: (FeatureActivationCondition | FeatureActivationRule)[]): FeatureActivationRule => ({
    type: 'and',
    conditions,
  }),

  or: (...conditions: (FeatureActivationCondition | FeatureActivationRule)[]): FeatureActivationRule => ({
    type: 'or',
    conditions,
  }),
}
