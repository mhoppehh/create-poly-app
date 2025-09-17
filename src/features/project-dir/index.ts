import type { Feature } from '../../types'

export const projectDir: Feature = {
  id: 'projectDir',
  description: 'The root directory of the project',
  name: 'Project Directory',
  stages: [
    {
      name: 'setup-directory',
      scripts: [{ src: args => `mkdir -p ${args.projectName}`, dir: '../' }],
    },
    {
      name: 'create-workspace',
      templates: [
        {
          source: 'src/features/project-dir/templates/pnpm-workspace.template.yaml',
          destination: 'pnpm-workspace.yaml',
        },
      ],
    },
  ],
}
