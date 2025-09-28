# Create Poly App

[![npm version](https://badge.fury.io/js/create-poly-app.svg)](https://badge.fury.io/js/create-poly-app)
[![npm downloads](https://img.shields.io/npm/dm/create-poly-app.svg)](https://www.npmjs.com/package/create-poly-app)
[![CI/CD Pipeline](https://github.com/mhoppehh/create-poly-app/actions/workflows/ci.yml/badge.svg)](https://github.com/mhoppehh/create-poly-app/actions/workflows/ci.yml)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

A CLI tool for scaffolding polyglot applications with a modular, feature-driven architecture. Creates full-stack projects with React frontends, GraphQL APIs, databases, and more through an interactive setup process.

## Features

- **Interactive Setup**: Form-driven project configuration
- **Modular Architecture**: Feature-based system with dependency management
- **Stack**: React + Vite, Apollo Server, Prisma ORM, TypeScript
- **Monorepo Ready**: Built-in pnpm workspace support
- **Code Generation**: Handlebars templates with code modifications
- **Flexible Styling**: TailwindCSS integration
- **Database Support**: Multiple database providers (SQLite, PostgreSQL, MySQL, MongoDB)
- **Auto-Save**: Persistent form state across sessions

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Features Overview](#features-overview)
- [Project Structure](#project-structure)
- [Available Features](#available-features)
- [Configuration](#configuration)
- [Development](#development)
- [API Reference](#api-reference)
- [Publishing & Releases](#publishing--releases)
- [Contributing](#contributing)
- [License](#license)

## Installation

### Requirements

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher (or equivalent pnpm/yarn)

### Global Installation (Recommended)

```bash
npm install -g create-poly-app
# or
pnpm install -g create-poly-app
# or
yarn global add create-poly-app
```

### NPX Usage (No Installation)

```bash
npx create-poly-app@latest
```

### Verify Installation

```bash
create-poly-app --version
```

## Quick Start

1. **Create a project**:

   ```bash
   create-poly-app
   ```

2. **Complete the configuration prompts**:
   - Enter project name
   - Select workspaces (React webapp, GraphQL API, Mobile app)
   - Configure features (Database, Styling, etc.)

3. **Navigate to project directory**:

   ```bash
   cd my-project
   pnpm install
   ```

4. **Start development servers**:

   ```bash
   # Start the frontend
   pnpm dev

   # Start the API server (if selected)
   pnpm --filter=api dev

   # Database setup (if Prisma selected)
   pnpm --filter=api prisma:push
   pnpm --filter=api prisma:seed
   ```

## Features Overview

### Workspace Types

- **React Webapp** - React + TypeScript + Vite frontend
- **GraphQL API Server** - Apollo Server with TypeScript and modular architecture
- **Mobile App** - React Native application (coming soon)

### Available Features

| Feature           | Description                                           | Dependencies      |
| ----------------- | ----------------------------------------------------- | ----------------- |
| **Vite**          | Frontend build tool with React + TypeScript           | Project Directory |
| **Apollo Server** | GraphQL API with TypeScript and code generation       | Project Directory |
| **Prisma ORM**    | Type-safe database operations with multiple providers | Apollo Server     |
| **TailwindCSS**   | Utility-first CSS framework                           | Vite              |

### Database Providers

- **SQLite** - Local development and prototyping
- **PostgreSQL** - Production-ready with additional features
- **MySQL** - Open-source relational database
- **MongoDB** - NoSQL document database for flexible schemas

## Project Structure

```
my-project/
├── pnpm-workspace.yaml          # Monorepo configuration
├── api/                         # GraphQL API Server
│   ├── src/
│   │   ├── index.ts            # Server entry point
│   │   ├── database.ts         # Database connection
│   │   ├── modules/            # GraphQL modules
│   │   │   ├── books/
│   │   │   │   ├── books.graphql
│   │   │   │   └── books.ts
│   │   │   └── index.ts
│   │   └── generated-types/    # Generated TypeScript types
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   └── package.json
└── web/                        # React Frontend (if selected)
    ├── src/
    ├── public/
    └── package.json
```

## Configuration

### Form System

The CLI uses a form system with:

- **Dynamic Questions**: Questions appear based on previous answers
- **Validation**: Real-time validation with custom rules
- **Auto-save**: Form state persists across sessions
- **Conditional Logic**: Form flow based on selections

### Feature Activation

Features are activated based on conditions:

```typescript
// Example: Prisma activates when both GraphQL server and database are selected
activatedBy: ActivationRules.and(
  ActivationConditions.includesValue('projectWorkspaces', 'graphql-server'),
  ActivationConditions.includesValue('apiFeatures', 'database'),
)
```

### Code Modifications

The tool uses a code modification system:

- **TypeScript AST Manipulation**: Uses ts-morph for code changes
- **Template System**: Handlebars templates with custom helpers
- **Dependency Resolution**: Automatic feature dependency sorting

## Development

### Prerequisites

- Node.js 18+
- pnpm (recommended)

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd create-poly-app

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run in development mode
pnpm demo:forms
```

### Scripts

| Script                  | Description            |
| ----------------------- | ---------------------- |
| `pnpm build`            | Build the CLI tool     |
| `pnpm demo:forms`       | Demo the form system   |
| `pnpm demo:forms:meta`  | Demo meta form builder |
| `pnpm scaffold:feature` | Create a new feature   |
| `pnpm type-check`       | Run TypeScript checks  |
| `pnpm lint:fix`         | Fix linting issues     |
| `pnpm format:fix`       | Format code            |

### Creating New Features

1. **Generate feature scaffold**:

   ```bash
   pnpm scaffold:feature
   ```

2. **Define feature structure** in `src/features/your-feature/index.ts`:

   ```typescript
   export const yourFeature: Feature = {
     id: 'your-feature',
     name: 'Your Feature',
     description: 'Feature description',
     dependsOn: ['projectDir'],
     activatedBy: ActivationConditions.includesValue('someField', 'value'),
     stages: [
       {
         name: 'setup',
         scripts: [{ src: 'npm install your-package' }],
         templates: [{ source: 'templates/path', destination: 'dest' }],
         mods: { 'package.json': [yourPackageJsonMod] },
       },
     ],
   }
   ```

3. **Add to feature registry** in `src/features/index.ts`

## API Reference

### Core Types

```typescript
interface Feature {
  id: string
  name: string
  description: string
  dependsOn?: string[]
  activatedBy?: ActivationRule
  configuration?: Question[]
  stages: Stage[]
}

interface Stage {
  name: string
  scripts?: InstallScript[]
  templates?: InstallTemplate[]
  mods?: Record<string, CodeMod[]>
}
```

### Form System

```typescript
interface Form {
  id: string
  title: string
  description: string
  groups: QuestionGroup[]
  settings?: FormSettings
}

interface Question {
  id: string
  type: 'text' | 'select' | 'multiselect' | 'boolean' | 'number' | 'toggle'
  title: string
  description?: string
  required: boolean
  defaultValue?: any
  options?: Option[]
  validation?: ValidationRule[]
  showIf?: ConditionalRule[]
}
```

## Example Workflows

### Full-Stack App with Database

1. **Select workspaces**: React Webapp + GraphQL Server
2. **Choose API features**: Database integration
3. **Configure database**: PostgreSQL
4. **Output**: Monorepo with:
   - React frontend with Vite
   - Apollo GraphQL server
   - Prisma ORM with PostgreSQL
   - Type-safe GraphQL code generation
   - Development scripts

### Frontend-Only Project

1. **Select workspaces**: React Webapp only
2. **Configure styling**: TailwindCSS
3. **Output**: React application with:
   - Vite build system
   - TypeScript configuration
   - TailwindCSS integration
   - Development server

## Logging Configuration

The application includes a logging system that provides console output and file logging.

### Environment Variables

You can customize logging behavior using these CLI flags:

- `--log-level <level>`: Set the logging level (`error`, `warn`, `info`, `debug`). Default: `info`
- `--log-console`: Enable console logging (default behavior)
- `--no-log-console`: Disable console logging
- `--log-file`: Enable file logging (default behavior)
- `--no-log-file`: Disable file logging
- `--log-file-path <path>`: Set custom log file path. Default: `create-poly-app.log`
- `--log-colorize`: Enable colored console output (default behavior)
- `--no-log-colorize`: Disable colored console output

### Examples

```bash
# Run with debug logging
npx create-poly-app --log-level debug

# Disable file logging
npx create-poly-app --no-log-file

# Use custom log file location
npx create-poly-app --log-file-path /tmp/my-app.log

# Disable console logging, use error level only
npx create-poly-app --no-log-console --log-level error

# Disable all logging
npx create-poly-app --no-log-console --no-log-file
```

## Publishing & Releases

This project uses automated CI/CD pipelines for package management:

### Automated Publishing

- **CI/CD Pipeline**: Automated testing, linting, building, and publishing
- **Multi-Node Testing**: Tests against Node.js 18, 20, and 22
- **Security Audits**: Automated vulnerability scanning
- **Release Management**: GitHub releases with automated changelog updates

### Release Process

1. **Create a release** via GitHub Actions workflow:

   ```bash
   # Trigger release workflow manually on GitHub
   # Choose version type: patch, minor, or major
   ```

2. **Automated steps**:
   - Run full test suite
   - Build and validate package
   - Update version and changelog
   - Create Git tag and GitHub release
   - Publish to NPM registry

### Version Management

- Follows [Semantic Versioning](https://semver.org/)
- Automated changelog generation
- Git tagging for releases
- NPM version synchronization

## Contributing

### Quick Start for Contributors

1. **Fork and clone**:

   ```bash
   git clone https://github.com/your-username/create-poly-app.git
   cd create-poly-app
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Run development commands**:
   ```bash
   pnpm build          # Build the project
   pnpm type-check     # Type checking
   pnpm lint           # Linting
   pnpm format:fix     # Format code
   ```

### Development Workflow

1. Create a feature branch from `main`
2. Make your changes with appropriate tests
3. Ensure all checks pass:
   ```bash
   pnpm type-check && pnpm lint && pnpm format && pnpm build
   ```
4. Submit a pull request with clear description

### Adding New Features

Use the built-in scaffolding tool:

```bash
pnpm scaffold:feature
```

This creates the proper feature structure with templates, codemods, and configuration.

## License

This project is licensed under the **ISC License**.

### ISC License Summary

- Commercial use - Use in commercial projects
- Modification - Modify the source code
- Distribution - Distribute original or modified code
- Private use - Use privately
- No warranty provided
- Author not liable for damages

See the [LICENSE](LICENSE) file for full details.

## Acknowledgments

- [Apollo Server](https://www.apollographql.com/docs/apollo-server/) - GraphQL server
- [Prisma](https://www.prisma.io/) - Database ORM
- [Vite](https://vitejs.dev/) - Frontend build tool
- [React](https://reactjs.org/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS

---

For more information, visit our [documentation](docs/) or [open an issue](issues/).

```

```
