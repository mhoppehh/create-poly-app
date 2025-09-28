import { addTailwindImport } from './codemods/add-imports'
import { addViteConfig } from './codemods/add-vite-config'
import type { Feature } from '../../types'
import { ActivationConditions } from '../../forms/feature-selector'

export const tailwind: Feature = {
  id: 'tailwind',
  description: 'A utility-first CSS framework',
  name: 'TailwindCSS',
  dependsOn: ['vite'],
  activatedBy: ActivationConditions.includesValue('projectWorkspaces', 'react-webapp'),
  devDependencies: {
    tailwindcss: '^3.4.0',
    postcss: '^8.4.30',
    autoprefixer: '^10.4.10',
  },
  stages: [
    {
      name: 'install-tailwind',
      dependencies: [{ name: ['tailwindcss', '@tailwindcss/vite'], workspace: 'web', type: 'devDependencies' }],
    },
    {
      name: 'configure-tailwind',
      mods: {
        'web/vite.config.ts': [addViteConfig],
        'web/src/index.css': [addTailwindImport],
      },
    },
  ],
}
