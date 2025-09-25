import { Preset, PresetMetadata, PresetManagerOptions } from './types'

export class PresetManager {
  private storageKey: string
  private maxPresets: number

  constructor(options: PresetManagerOptions = {}) {
    this.storageKey = options.storageKey || 'form-presets'
    this.maxPresets = options.maxPresets || 50
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
    
    // Remove oldest presets if we exceed the limit
    if (presets.length >= this.maxPresets) {
      const sortedByDate = presets.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      const toRemove = sortedByDate.slice(0, presets.length - this.maxPresets + 1)
      for (const preset of toRemove) {
        await this.deletePreset(preset.id)
      }
    }

    // Save the new preset
    const updatedPresets = [...(await this.getAllPresets()), newPreset]
    this.saveToStorage(updatedPresets)

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
    this.saveToStorage(presets)

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
      if (typeof localStorage === 'undefined') {
        return []
      }

      const stored = localStorage.getItem(this.storageKey)
      if (!stored) {
        return []
      }

      return JSON.parse(stored) || []
    } catch (error) {
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

    this.saveToStorage(filteredPresets)
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
      this.saveToStorage(filteredPresets)
    }

    return deletedCount
  }

  /**
   * Clear all presets
   */
  async clearAllPresets(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey)
    }
  }

  /**
   * Search presets by name, description, or tags
   */
  async searchPresets(query: string): Promise<Preset[]> {
    const presets = await this.getAllPresets()
    const searchTerm = query.toLowerCase()

    return presets.filter(preset => 
      preset.name.toLowerCase().includes(searchTerm) ||
      preset.description?.toLowerCase().includes(searchTerm) ||
      preset.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    )
  }

  /**
   * Export presets to JSON string
   */
  async exportPresets(): Promise<string> {
    const presets = await this.getAllPresets()
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      presets,
    }, null, 2)
  }

  /**
   * Import presets from JSON string
   */
  async importPresets(jsonData: string, merge: boolean = true): Promise<number> {
    try {
      const data = JSON.parse(jsonData)
      const importedPresets: Preset[] = data.presets || []

      if (!merge) {
        this.saveToStorage(importedPresets)
        return importedPresets.length
      }

      // Merge with existing presets
      const existingPresets = await this.getAllPresets()
      const existingIds = new Set(existingPresets.map(p => p.id))
      
      const newPresets = importedPresets.filter(p => !existingIds.has(p.id))
      const allPresets = [...existingPresets, ...newPresets]

      // Apply max limit
      if (allPresets.length > this.maxPresets) {
        const sortedByDate = allPresets.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        allPresets.splice(this.maxPresets)
      }

      this.saveToStorage(allPresets)
      return newPresets.length
    } catch (error) {
      throw new Error(`Failed to import presets: ${error}`)
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): { count: number; estimatedSize: string } {
    try {
      if (typeof localStorage === 'undefined') {
        return { count: 0, estimatedSize: '0 KB' }
      }

      const stored = localStorage.getItem(this.storageKey)
      if (!stored) {
        return { count: 0, estimatedSize: '0 KB' }
      }

      const presets = JSON.parse(stored)
      const sizeInBytes = new Blob([stored]).size
      const sizeInKB = Math.round(sizeInBytes / 1024 * 100) / 100

      return {
        count: presets.length,
        estimatedSize: `${sizeInKB} KB`,
      }
    } catch (error) {
      return { count: 0, estimatedSize: 'Unknown' }
    }
  }

  private saveToStorage(presets: Preset[]): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(presets))
    }
  }
}

// Export a default instance
export const defaultPresetManager = new PresetManager()