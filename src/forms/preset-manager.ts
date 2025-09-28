import { Preset, PresetMetadata, PresetManagerOptions } from './types'
import { promises as fs } from 'fs'
import * as path from 'path'
import { homedir } from 'os'

export class PresetManager {
  private presetFilePath: string
  private createDirectoryIfNotExists: boolean

  constructor(options: PresetManagerOptions = {}) {
    this.presetFilePath = options.presetFilePath || path.join(homedir(), '.create-poly-app', 'presets.json')
    this.createDirectoryIfNotExists = options.createDirectoryIfNotExists ?? true
  }

  /**
   * Save a new preset or update an existing one
   */
  async savePreset(preset: Omit<Preset, 'id' | 'createdAt' | 'updatedAt'>): Promise<Preset> {
    const now = new Date().toISOString()

    // Generate unique ID if not provided
    const id = `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const newPreset: Preset = {
      id,
      createdAt: now,
      updatedAt: now,
      ...preset,
    }

    const presets = await this.getAllPresets()

    // Save the new preset
    const updatedPresets = [...presets, newPreset]
    await this.saveToFile(updatedPresets)

    return newPreset
  }

  /**
   * Update an existing preset
   */
  async updatePreset(id: string, updates: Partial<Omit<Preset, 'id' | 'createdAt'>>): Promise<Preset | null> {
    const presets = await this.getAllPresets()
    const preset = presets.find(p => p.id === id)

    if (!preset) {
      return null
    }

    const updatedPreset: Preset = {
      id: preset.id,
      name: preset.name,
      formId: preset.formId,
      answers: preset.answers,
      createdAt: preset.createdAt,
      updatedAt: new Date().toISOString(),
      ...updates,
    }

    const index = presets.findIndex(p => p.id === id)
    presets[index] = updatedPreset
    await this.saveToFile(presets)

    return updatedPreset
  }

  /**
   * Get a specific preset by ID
   */
  async getPreset(id: string): Promise<Preset | null> {
    const presets = await this.getAllPresets()
    return presets.find(p => p.id === id) || null
  }

  /**
   * Get all presets
   */
  async getAllPresets(): Promise<Preset[]> {
    try {
      await this.ensurePresetFileExists()

      const fileContent = await fs.readFile(this.presetFilePath, 'utf-8')
      if (!fileContent.trim()) {
        return []
      }

      const data = JSON.parse(fileContent)
      return Array.isArray(data.presets) ? data.presets : []
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        // File doesn't exist, return empty array
        return []
      }
      console.warn('Failed to load presets:', error)
      return []
    }
  }

  /**
   * Get preset metadata (without full answers) for listing
   */
  async getPresetMetadata(): Promise<PresetMetadata[]> {
    const presets = await this.getAllPresets()
    return presets.map(preset => {
      const metadata: PresetMetadata = {
        id: preset.id,
        name: preset.name,
        formId: preset.formId,
        createdAt: preset.createdAt,
        updatedAt: preset.updatedAt,
        answerCount: Object.keys(preset.answers).length,
      }

      if (preset.description !== undefined) {
        metadata.description = preset.description
      }

      if (preset.tags !== undefined) {
        metadata.tags = preset.tags
      }

      return metadata
    })
  }

  /**
   * Get presets filtered by form ID
   */
  async getPresetsForForm(formId: string): Promise<Preset[]> {
    const presets = await this.getAllPresets()
    return presets.filter(p => p.formId === formId)
  }

  /**
   * Delete a preset by ID
   */
  async deletePreset(id: string): Promise<boolean> {
    const presets = await this.getAllPresets()
    const filteredPresets = presets.filter(p => p.id !== id)

    if (filteredPresets.length === presets.length) {
      return false // Preset not found
    }

    await this.saveToFile(filteredPresets)
    return true
  }

  /**
   * Delete all presets for a specific form
   */
  async deletePresetsForForm(formId: string): Promise<number> {
    const presets = await this.getAllPresets()
    const filteredPresets = presets.filter(p => p.formId !== formId)
    const deletedCount = presets.length - filteredPresets.length

    if (deletedCount > 0) {
      await this.saveToFile(filteredPresets)
    }

    return deletedCount
  }

  /**
   * Clear all presets
   */
  async clearAllPresets(): Promise<void> {
    await this.saveToFile([])
  }

  /**
   * Search presets by name, description, or tags
   */
  async searchPresets(query: string): Promise<Preset[]> {
    const presets = await this.getAllPresets()
    const searchTerm = query.toLowerCase()

    return presets.filter(
      preset =>
        preset.name.toLowerCase().includes(searchTerm) ||
        preset.description?.toLowerCase().includes(searchTerm) ||
        preset.tags?.some(tag => tag.toLowerCase().includes(searchTerm)),
    )
  }

  /**
   * Export presets to JSON string
   */
  async exportPresets(): Promise<string> {
    const presets = await this.getAllPresets()
    return JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        presets,
      },
      null,
      2,
    )
  }

  /**
   * Import presets from JSON string
   */
  async importPresets(jsonData: string, merge: boolean = true): Promise<number> {
    try {
      const data = JSON.parse(jsonData)
      const importedPresets: Preset[] = data.presets || []

      if (!merge) {
        await this.saveToFile(importedPresets)
        return importedPresets.length
      }

      // Merge with existing presets
      const existingPresets = await this.getAllPresets()
      const existingIds = new Set(existingPresets.map(p => p.id))

      const newPresets = importedPresets.filter(p => !existingIds.has(p.id))
      const allPresets = [...existingPresets, ...newPresets]

      await this.saveToFile(allPresets)
      return newPresets.length
    } catch (error) {
      throw new Error(`Failed to import presets: ${error}`)
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): { count: number; estimatedSize: string; filePath: string } {
    try {
      // For file-based storage, we'll read the file synchronously for this info method
      const fs = require('fs')

      if (!fs.existsSync(this.presetFilePath)) {
        return { count: 0, estimatedSize: '0 KB', filePath: this.presetFilePath }
      }

      const fileContent = fs.readFileSync(this.presetFilePath, 'utf-8')
      const data = JSON.parse(fileContent)
      const presets = Array.isArray(data.presets) ? data.presets : []

      const stats = fs.statSync(this.presetFilePath)
      const sizeInKB = Math.round((stats.size / 1024) * 100) / 100

      return {
        count: presets.length,
        estimatedSize: `${sizeInKB} KB`,
        filePath: this.presetFilePath,
      }
    } catch (error) {
      return { count: 0, estimatedSize: 'Unknown', filePath: this.presetFilePath }
    }
  }

  /**
   * Ensure the preset file and its directory exist
   */
  private async ensurePresetFileExists(): Promise<void> {
    if (this.createDirectoryIfNotExists) {
      const dir = path.dirname(this.presetFilePath)
      await fs.mkdir(dir, { recursive: true })
    }

    try {
      await fs.access(this.presetFilePath)
    } catch (error) {
      // File doesn't exist, create an empty one
      const initialData = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        presets: [],
      }
      await fs.writeFile(this.presetFilePath, JSON.stringify(initialData, null, 2), 'utf-8')
    }
  }

  /**
   * Save presets to file
   */
  private async saveToFile(presets: Preset[]): Promise<void> {
    await this.ensurePresetFileExists()

    const data = {
      version: '1.0',
      updatedAt: new Date().toISOString(),
      presets,
    }

    await fs.writeFile(this.presetFilePath, JSON.stringify(data, null, 2), 'utf-8')
  }
}

// Export a default instance with simple default configuration
export const defaultPresetManager = new PresetManager({
  presetFilePath: path.join(homedir(), 'create-poly-app', 'presets.json'),
  createDirectoryIfNotExists: true,
})
