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

  preInstallScripts?: InstallScript[]
  adInstallScripts?: InstallScript[]
  postInstallScripts?: InstallScript[]

  preInstallTemplate?: InstallTemplates
  adInstallTemplate?: InstallTemplates
  postInstallTemplate?: InstallTemplates

  preInstallMods?: Record<string, CodeMod[]>
  adInstallMods?: Record<string, CodeMod[]>
  postInstallMods?: Record<string, CodeMod[]>
}
