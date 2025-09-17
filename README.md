# Create Poly App

A scaffolding tool for creating modern web applications with TypeScript, React, and optional GraphQL server.

## Logging Configuration

The application includes a comprehensive logging system that provides both console output and file logging.

### Log File Location

By default, logs are written to `create-poly-app.log` in the current working directory. The log file is overwritten on each new session, providing a clean log for each run.

### Environment Variables

You can customize logging behavior using these environment variables:

- `LOG_LEVEL`: Set the logging level (`error`, `warn`, `info`, `debug`). Default: `info`
- `LOG_CONSOLE`: Enable/disable console logging (`true`/`false`). Default: `true`
- `LOG_FILE`: Enable/disable file logging (`true`/`false`). Default: `true`
- `LOG_FILE_PATH`: Custom path for the log file. Default: `create-poly-app.log`
- `LOG_COLORIZE`: Enable/disable colored console output (`true`/`false`). Default: `true`

### Examples

```bash
# Run with debug logging
LOG_LEVEL=debug npx create-poly-app

# Disable file logging
LOG_FILE=false npx create-poly-app

# Use custom log file location
LOG_FILE_PATH=/tmp/my-app.log npx create-poly-app

# Disable console logging (only file logging)
LOG_CONSOLE=false npx create-poly-app
```

### Log Format

**Console Output:**

```
[12:34:56] [source] Message content
```

**File Output:**

```
[2025-09-15T12:34:56.789Z] [INFO] [source] Message content
```

Each log entry includes:

- Timestamp
- Log level (ERROR, WARN, INFO, DEBUG)
- Source component (main, engine, utils, etc.)
- The actual log message

### Log Sources

- `main`: Application entry point and user interaction
- `engine`: Core scaffolding engine initialization and completion
- `Project Directory`: Setting up the project structure
- `Vite`: React application setup with Vite
- `TailwindCSS`: CSS framework configuration
- `Apollo Server`: GraphQL server setup
- `utils`: Utility functions for file/directory operations

## Usage

```bash
npx create-poly-app
```

Follow the interactive prompts to configure your project.

## Features

- Modern TypeScript setup
- React with Vite
- TailwindCSS integration
- Optional Apollo GraphQL server
- Comprehensive logging system

## Development

```bash
# Build the project
pnpm build

# Type check
pnpm type-check

# Lint and format
pnpm lint:fix
pnpm format:fix
```
