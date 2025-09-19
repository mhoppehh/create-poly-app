import type { Feature } from '../../types'
import { ActivationConditions } from '../../forms/feature-selector'

export const vite: Feature = {
  id: 'vite',
  description: 'A modern frontend build tool',
  name: 'Vite',
  dependsOn: ['projectDir'],
  activatedBy: ActivationConditions.includesValue('projectWorkspaces', 'react-webapp'),
  stages: [
    {
      name: 'create-vite-app',
      scripts: [{ src: 'npm create vite@latest web -- --template react-ts' }],
    },
  ],
}
