import type { CodeMod } from '../../../types'
import { readFileSync, writeFileSync } from 'fs'

export const addDevxScripts: CodeMod = (filePath: string) => {
  // Read and parse package.json
  const text = readFileSync(filePath, 'utf-8')
  const packageJson = JSON.parse(text)

  // Add scripts - dependencies are handled by the installation stages
  const scripts = {
    lint: 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
    'lint:fix': 'eslint . --ext ts,tsx --fix',
    format: 'prettier --check "**/*.{ts,tsx,js,jsx,json,css,scss,md}"',
    'format:fix': 'prettier --write "**/*.{ts,tsx,js,jsx,json,css,scss,md}"',
    'type-check': 'tsc --noEmit',
    'lint-staged': 'lint-staged',
    commitlint: 'commitlint --edit',
  }

  packageJson.scripts = {
    ...packageJson.scripts,
    ...scripts,
  }

  packageJson.type = 'module'

  writeFileSync(filePath, JSON.stringify(packageJson, null, 2))
}
