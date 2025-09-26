import { addDevxScripts } from './codemods/add-devx-dependencies'
import { ActivationConditions } from '../../forms/feature-selector'
import type { Feature } from '../../types'

export const developerExperience: Feature = {
  id: 'developer-experience',
  description:
    'Comprehensive developer experience improvements including linting, formatting, Git automation, and productivity tools',
  name: 'Developer Experience Suite',
  activatedBy: ActivationConditions.equals('enableDevX', true),
  configuration: [
    {
      id: 'includeAccessibility',
      type: 'boolean',
      title: 'Include Accessibility Linting',
      description: 'Add ESLint rules for accessibility (jsx-a11y)',
      defaultValue: true,
    },
    {
      id: 'includeImportSorting',
      type: 'boolean',
      title: 'Enable Import Sorting',
      description: 'Automatically organize and sort imports',
      defaultValue: true,
    },
    {
      id: 'enableConventionalCommits',
      type: 'boolean',
      title: 'Enable Conventional Commits',
      description: 'Enforce conventional commit message format',
      defaultValue: true,
    },
    {
      id: 'enableSemanticRelease',
      type: 'boolean',
      title: 'Enable Semantic Release',
      description: 'Automatic versioning and changelog generation',
      defaultValue: false,
    },
  ],
  stages: [
    {
      name: 'install-core-dependencies',
      scripts: [
        {
          src: 'pnpm add -D -w @eslint/js @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-plugin-react-hooks eslint-plugin-react-refresh prettier globals',
          dir: '.',
        },
      ],
    },
    {
      name: 'install-accessibility-tools',
      activatedBy: ActivationConditions.equals('includeAccessibility', true),
      scripts: [{ src: 'pnpm add -D -w eslint-plugin-jsx-a11y', dir: '.' }],
    },
    {
      name: 'install-import-sorting-tools',
      activatedBy: ActivationConditions.equals('includeImportSorting', true),
      scripts: [
        {
          src: 'pnpm add -D -w eslint-plugin-import prettier-plugin-organize-imports prettier-plugin-packagejson',
          dir: '.',
        },
      ],
    },
    {
      name: 'install-git-hooks-and-conventional-commits',
      activatedBy: ActivationConditions.equals('enableConventionalCommits', true),
      scripts: [{ src: 'pnpm add -D -w lint-staged @commitlint/cli @commitlint/config-conventional', dir: '.' }],
    },
    {
      name: 'install-semantic-release',
      activatedBy: ActivationConditions.equals('enableSemanticRelease', true),
      scripts: [
        {
          src: 'pnpm add -D -w semantic-release @semantic-release/changelog @semantic-release/git @semantic-release/github @semantic-release/npm @semantic-release/commit-analyzer @semantic-release/release-notes-generator',
          dir: '.',
        },
      ],
    },
    {
      name: 'setup-configuration-files',
      templates: [
        {
          source: 'src/features/developer-experience/templates',
          destination: '.',
        },
      ],
    },
    {
      name: 'update-package-json-full',
      mods: {
        'package.json': [addDevxScripts],
      },
    },
    {
      name: 'run-linting-formatting',
      scripts: [
        {
          src: 'pnpm lint:fix && pnpm format:fix',
          dir: '.',
        },
      ],
    },
  ],
}
