
export type CodeMod = (filePath: string) => void | Promise<void>

export interface InstallTemplate {

  source: string

  destination: string

  context?: any
}

export type InstallTemplates = InstallTemplate[]

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

  dependsOn?: string[]

  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>

  configMerges?: Record<string, object>

  stages?: FeatureStage[]
}
