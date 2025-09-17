import type { Feature } from '../../types'

export const vite: Feature = {
  id: 'vite',
  description: 'A modern frontend build tool',
  name: 'Vite',
  dependsOn: ['projectDir'],
  stages: [
    {
      name: 'create-vite-app',
      scripts: [{ src: 'npm create vite@latest web -- --template react-ts' }],
    },
  ],
}
