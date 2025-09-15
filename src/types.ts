import { SourceFile } from 'ts-morph'

// A CodeMod is a function that modifies a source file.
export type CodeMod = (sourceFile: SourceFile) => void

export interface InstallTemplate {
  destination: string
  context?: any
}

export type InstallTemplates = Record<string, InstallTemplate>

export interface InstallScript {
  src: ((args: any) => string) | string
  dir?: string
}

export interface FeatureStage {
  name: string
  scripts?: InstallScript[]
  templates?: InstallTemplates
  mods?: Record<string, CodeMod[]>
}

export interface Feature {
  id: string
  name: string
  description: string

  // For dependency resolution
  dependsOn?: string[]

  // package.json modifications
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>

  // Merging for JSON config files
  configMerges?: Record<string, object>

  // Flexible stages system
  stages?: FeatureStage[]
}
