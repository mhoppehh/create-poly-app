#!/usr/bin/env node
import prompts from 'prompts'
import path from 'path'
import { scaffoldProject } from './engine'

async function main() {
  const response = await prompts([
    {
      type: 'text',
      name: 'projectName',
      message: 'What is the name of your project?',
      initial: 'my-awesome-project',
    },
    {
      type: 'toggle',
      name: 'includeGraphQLServer',
      message: 'Do you want to include a basic GraphQL server?',
      initial: true,
      active: 'yes',
      inactive: 'no',
    },
    // ... more questions for React vs React Native, etc.
  ])

  console.log('User choices:', response)
  const projectPath = path.resolve(process.cwd(), response.projectName)
  console.log(`Project will be created at: ${projectPath}`)

  scaffoldProject(response.projectName, projectPath, ['projectDir', 'vite', 'tailwind', 'apollo-server'])
}

main().catch(console.error)
