import type { Question } from './forms/types'

export type CodeMod = (filePath: string, config?: Record<string, any>) => void | Promise<void>

export interface InstallTemplate {
  source: string

  destination: string

  context?: any
}

export type InstallTemplates = InstallTemplate[]

export interface InstallScript {
  src: ((args: any, config?: Record<string, any>) => string) | string
  dir?: string
}

export interface FeatureStage {
  name: string
  scripts?: InstallScript[]
  templates?: InstallTemplates
  mods?: Record<string, CodeMod[]>

  activatedBy?: FeatureActivationRule | FeatureActivationCondition
}

export interface FeatureActivationCondition {
  questionId: string
  condition:
    | { type: 'equals'; value: any }
    | { type: 'includes'; value: any }
    | { type: 'contains'; value: any }
    | { type: 'in'; values: any[] }
    | { type: 'custom'; evaluator: (value: any, allAnswers: Record<string, any>) => boolean }
}

export interface FeatureActivationRule {
  type: 'and' | 'or'
  conditions: (FeatureActivationCondition | FeatureActivationRule)[]
}

export interface Feature {
  id: string
  name: string
  description: string

  dependsOn?: string[]

  activatedBy?: FeatureActivationRule | FeatureActivationCondition

  configuration?: Question[]

  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>

  configMerges?: Record<string, object>

  stages?: FeatureStage[]
}
