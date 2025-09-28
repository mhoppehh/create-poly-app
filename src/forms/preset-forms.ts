import { Form, SelectOption } from './types'
import { PresetManager, defaultPresetManager } from './preset-manager'

/**
 * Generate a form for selecting a preset to load
 */
export async function createPresetLoadForm(
  formId: string,
  presetManager: PresetManager = defaultPresetManager,
): Promise<Form> {
  const presets = await presetManager.getPresetsForForm(formId)

  const presetOptions: SelectOption[] = presets.map(preset => ({
    label: preset.name,
    value: preset.id,
    description: preset.description || `Created ${new Date(preset.createdAt).toLocaleDateString()}`,
  }))

  // Add "None" option to start fresh
  presetOptions.unshift({
    label: '🆕 Start Fresh (No Preset)',
    value: 'none',
    description: 'Begin with an empty form',
  })

  const form: Form = {
    id: 'load-preset',
    title: '📂 Load Preset',
    description:
      presets.length > 0
        ? 'Choose a preset to load your previous answers, or start fresh'
        : 'No presets available for this form. You can save your answers as a preset after completing the form.',
    settings: {
      allowBack: false,
      showProgress: false,
      submitLabel: presets.length > 0 ? 'Load Selected' : 'Continue',
      cancelLabel: 'Cancel',
    },
    groups: [
      {
        id: 'preset-selection',
        title: 'Available Presets',
        questions:
          presets.length > 0
            ? [
                {
                  id: 'selectedPreset',
                  type: 'select',
                  title: 'Choose a preset to load:',
                  required: true,
                  defaultValue: 'none',
                  options: presetOptions,
                },
              ]
            : [
                {
                  id: 'noPresets',
                  type: 'toggle',
                  title: 'No presets available for this form',
                  description: 'You can save your answers as a preset after completing the form.',
                  required: true,
                  defaultValue: true,
                },
              ],
      },
    ],
  }

  return form
}

/**
 * Generate a form for managing existing presets
 */
export async function createPresetManagementForm(
  formId?: string,
  presetManager: PresetManager = defaultPresetManager,
): Promise<Form> {
  const allPresets = formId ? await presetManager.getPresetsForForm(formId) : await presetManager.getAllPresets()

  const presetOptions: SelectOption[] = allPresets.map(preset => {
    const formLabel = formId ? '' : ` (${preset.formId})`
    const dateLabel = new Date(preset.createdAt).toLocaleDateString()
    return {
      label: `${preset.name}${formLabel}`,
      value: preset.id,
      description: `${preset.description || 'No description'} • Created ${dateLabel}`,
    }
  })

  const form: Form = {
    id: 'manage-presets',
    title: '⚙️ Manage Presets',
    description:
      allPresets.length > 0
        ? 'View, export, or delete your saved presets'
        : 'No presets found. Complete some forms and save presets to see them here.',
    settings: {
      allowBack: true,
      showProgress: false,
      submitLabel: 'Apply Action',
      cancelLabel: 'Done',
    },
    groups:
      allPresets.length > 0
        ? [
            {
              id: 'preset-action',
              title: 'What would you like to do?',
              questions: [
                {
                  id: 'action',
                  type: 'select',
                  title: 'Choose an action:',
                  required: true,
                  options: [
                    { label: 'View Preset Details', value: 'view', description: 'See details about a preset' },
                    { label: 'Delete Preset', value: 'delete', description: 'Permanently remove a preset' },
                    { label: 'Export All Presets', value: 'export', description: 'Download presets as JSON file' },
                    {
                      label: 'Clear All Presets',
                      value: 'clear',
                      description: 'Delete all presets (cannot be undone)',
                    },
                  ],
                },
                {
                  id: 'selectedPreset',
                  type: 'select',
                  title: 'Select a preset:',
                  required: true,
                  options: presetOptions,
                  showIf: [
                    {
                      dependsOn: 'action',
                      condition: { type: 'in', values: ['view', 'delete'] },
                    },
                  ],
                },
                {
                  id: 'confirmDelete',
                  type: 'toggle',
                  title: 'Are you sure you want to delete this preset?',
                  description: 'This action cannot be undone.',
                  required: true,
                  defaultValue: false,
                  showIf: [
                    {
                      dependsOn: 'action',
                      condition: { type: 'equals', value: 'delete' },
                    },
                  ],
                },
                {
                  id: 'confirmClear',
                  type: 'text',
                  title: 'Type "DELETE ALL" to confirm clearing all presets:',
                  description: 'This will permanently delete all presets and cannot be undone.',
                  required: true,
                  showIf: [
                    {
                      dependsOn: 'action',
                      condition: { type: 'equals', value: 'clear' },
                    },
                  ],
                  validation: [
                    {
                      type: 'pattern',
                      value: /^DELETE ALL$/,
                      message: 'You must type "DELETE ALL" exactly to confirm',
                    },
                  ],
                },
              ],
            },
          ]
        : [
            {
              id: 'no-presets',
              title: 'No Presets Available',
              questions: [
                {
                  id: 'info',
                  type: 'toggle',
                  title: 'No presets found',
                  description: 'Complete some forms and save your answers as presets to manage them here.',
                  required: true,
                  defaultValue: true,
                },
              ],
            },
          ],
  }

  return form
}

/**
 * Generate a simple form asking if user wants to save current state as preset
 */
export function createSavePresetPromptForm(): Form {
  return {
    id: 'save-preset-prompt',
    title: '💾 Save as Preset?',
    description: 'Would you like to save your answers as a preset for future use?',
    settings: {
      allowBack: false,
      showProgress: false,
      submitLabel: 'Continue',
      cancelLabel: 'Skip',
    },
    groups: [
      {
        id: 'save-prompt',
        questions: [
          {
            id: 'shouldSave',
            type: 'toggle',
            title: 'Save these answers as a preset',
            description: 'You can reuse these settings for future projects',
            required: true,
            defaultValue: false,
          },
        ],
      },
    ],
  }
}
