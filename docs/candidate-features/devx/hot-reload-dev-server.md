# Hot Reload & Development Server

## Overview

Advanced hot module replacement (HMR) and development server configuration for instant feedback during development with React, TypeScript, and backend integration.

## Priority

**HIGH** - Critical for developer productivity and fast iteration

## Dependencies

- `vite` (build tool and dev server)
- React/TypeScript components
- Backend API integration

## Components

### Vite Development Server

- **Hot Module Replacement**: Instant module updates without page refresh
- **Fast Refresh**: React component state preservation during updates
- **TypeScript Integration**: Instant TypeScript compilation and error reporting
- **CSS Hot Reload**: Instant CSS changes without losing application state
- **Import Resolution**: Advanced import path resolution and aliases

### Backend Integration

- **API Proxy**: Proxy API requests to backend development server
- **WebSocket Proxy**: Proxy WebSocket connections for real-time features
- **CORS Configuration**: Development CORS setup for cross-origin requests
- **Environment Variables**: Dynamic environment variable injection
- **Mock API**: Development mock server for offline development

### Development Optimizations

- **Pre-bundling**: Optimize dependencies for faster startup
- **Source Maps**: High-quality source maps for debugging
- **Error Overlay**: Enhanced error display in browser
- **Build Caching**: Intelligent caching for faster rebuilds
- **Memory Management**: Optimize memory usage during long development sessions

### File Watching

- **Smart Watching**: Efficient file system monitoring
- **Ignore Patterns**: Skip irrelevant files and directories
- **Polling Fallback**: Fallback for environments with limited file watching
- **Batch Updates**: Batch rapid file changes to reduce noise
- **Custom Handlers**: Custom handling for specific file types

### Developer Tools Integration

- **React DevTools**: Enhanced React debugging integration
- **Redux DevTools**: State management debugging
- **GraphQL Playground**: Integrated GraphQL development tools
- **Network Inspection**: Request/response debugging tools
- **Performance Profiling**: Development performance monitoring

## Configuration

```typescript
interface HotReloadConfig {
  server: {
    host: string
    port: number
    https?: boolean
    hmr: boolean | { port: number; host?: string }
  }
  proxy: Record<string, string | ProxyOptions>
  optimizeDeps: {
    include: string[]
    exclude: string[]
    force: boolean
  }
  build: {
    sourcemap: boolean
    minify: boolean
    target: string
  }
}
```

## Generated Files

```
vite.config.ts                     # Main Vite configuration
dev/
├── server.ts                      # Development server setup
├── middleware/                    # Custom dev middleware
│   ├── apiProxy.ts               # API proxy configuration
│   ├── mockApi.ts                # Mock API endpoints
│   └── cors.ts                   # CORS configuration
├── plugins/                       # Custom Vite plugins
│   ├── reactRefresh.ts           # React Fast Refresh plugin
│   ├── typescript.ts             # TypeScript integration
│   └── errorOverlay.ts           # Enhanced error overlay
└── config/
    ├── aliases.ts                # Import path aliases
    ├── env.ts                    # Environment configuration
    └── optimization.ts           # Build optimizations
```

## Vite Configuration

```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import type { ProxyOptions } from 'vite'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react({
        // Enable React Fast Refresh
        fastRefresh: true,
        // Include emotion support if using styled components
        jsxImportSource: '@emotion/react',
        // Babel plugins for development
        babel: {
          plugins: mode === 'development' ? [['@babel/plugin-transform-react-jsx-development']] : [],
        },
      }),
    ],

    // Development server configuration
    server: {
      host: '0.0.0.0', // Allow external connections
      port: parseInt(env.VITE_DEV_PORT) || 3000,
      strictPort: false, // Try next available port if occupied

      // Hot Module Replacement
      hmr: {
        port: parseInt(env.VITE_HMR_PORT) || 3001,
        host: 'localhost',
      },

      // API proxy configuration
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
          ws: true, // Proxy websockets
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('Proxy error:', err)
            })
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('Proxying:', req.method, req.url, '->', options.target + req.url)
            })
          },
        },
        '/graphql': {
          target: env.VITE_GRAPHQL_URL || 'http://localhost:4000',
          changeOrigin: true,
          ws: true,
        },
        // WebSocket proxy for real-time features
        '/socket.io': {
          target: env.VITE_WS_URL || 'http://localhost:4000',
          ws: true,
        },
      },

      // CORS configuration
      cors: {
        origin: true,
        credentials: true,
      },

      // File watching configuration
      watch: {
        usePolling: process.env.VITE_USE_POLLING === 'true',
        ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/coverage/**'],
      },
    },

    // Import path aliases
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@components': resolve(__dirname, './src/components'),
        '@pages': resolve(__dirname, './src/pages'),
        '@hooks': resolve(__dirname, './src/hooks'),
        '@utils': resolve(__dirname, './src/utils'),
        '@types': resolve(__dirname, './src/types'),
        '@graphql': resolve(__dirname, './src/graphql'),
        '@assets': resolve(__dirname, './src/assets'),
      },
    },

    // Dependency optimization
    optimizeDeps: {
      include: ['react', 'react-dom', '@apollo/client', 'graphql', 'styled-components', 'framer-motion'],
      exclude: [
        // Exclude packages that should not be pre-bundled
      ],
      // Force re-optimization on every startup in development
      force: mode === 'development',
    },

    // Build configuration
    build: {
      // Generate source maps for debugging
      sourcemap: true,
      // Target modern browsers in development
      target: mode === 'development' ? 'esnext' : 'es2015',
      // Disable minification in development
      minify: mode === 'production' ? 'esbuild' : false,
      // Increase chunk size warnings threshold
      chunkSizeWarningLimit: 1000,
    },

    // CSS configuration
    css: {
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`,
        },
      },
    },

    // Environment variables
    define: {
      __DEV__: mode === 'development',
      __PROD__: mode === 'production',
      __API_URL__: JSON.stringify(env.VITE_API_URL),
      __GRAPHQL_URL__: JSON.stringify(env.VITE_GRAPHQL_URL),
    },
  }
})
```

## React Fast Refresh Integration

```typescript
// dev/plugins/reactRefresh.ts
import { Plugin } from 'vite'

export function enhancedReactRefresh(): Plugin {
  return {
    name: 'enhanced-react-refresh',
    configureServer(server) {
      server.ws.on('error', error => {
        console.error('WebSocket error:', error)
      })

      // Enhanced error handling for React components
      server.middlewares.use('/dev/react-refresh', (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Content-Type', 'application/javascript')

        const refreshScript = `
          if (import.meta.hot) {
            import.meta.hot.on('vite:beforeUpdate', (payload) => {
              // Custom logic before hot update
              console.log('Hot updating:', payload.updates.map(u => u.path))
            })

            import.meta.hot.on('vite:error', (payload) => {
              // Enhanced error display
              console.error('Hot reload error:', payload.error)
            })

            // React component error boundary integration
            window.__vite_plugin_react_error_overlay = (error) => {
              console.error('React error overlay:', error)
              // Could integrate with custom error reporting
            }
          }
        `

        res.end(refreshScript)
      })
    },
  }
}
```

## Development Middleware

```typescript
// dev/middleware/apiProxy.ts
import { Connect } from 'vite'
import httpProxy from 'http-proxy-middleware'

export function createApiProxy(target: string): Connect.NextHandleFunction {
  const proxy = httpProxy({
    target,
    changeOrigin: true,
    ws: true,
    logLevel: 'debug',

    onProxyReq: (proxyReq, req, res) => {
      // Add development headers
      proxyReq.setHeader('X-Dev-Server', 'vite')
      proxyReq.setHeader('X-Forwarded-Proto', 'http')

      // Log API requests in development
      console.log(`[API] ${req.method} ${req.url} -> ${target}${req.url}`)
    },

    onProxyRes: (proxyRes, req, res) => {
      // Add CORS headers for development
      proxyRes.headers['Access-Control-Allow-Origin'] = '*'
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true'
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'

      // Log response status
      console.log(`[API] ${req.method} ${req.url} <- ${proxyRes.statusCode}`)
    },

    onError: (err, req, res) => {
      console.error('[API Proxy Error]:', err.message)

      if (res.writeHead && !res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            error: 'Proxy Error',
            message: err.message,
            target,
          }),
        )
      }
    },
  })

  return proxy as Connect.NextHandleFunction
}

// Mock API for offline development
export function createMockApi(): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (!req.url?.startsWith('/api')) {
      return next()
    }

    // Simple mock responses for development
    const mockResponses: Record<string, any> = {
      '/api/health': { status: 'ok', timestamp: Date.now() },
      '/api/user': {
        id: '1',
        name: 'Development User',
        email: 'dev@example.com',
      },
      '/api/books': [
        { id: '1', title: 'Mock Book 1', author: 'Dev Author' },
        { id: '2', title: 'Mock Book 2', author: 'Test Author' },
      ],
    }

    const response = mockResponses[req.url]
    if (response) {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.end(JSON.stringify(response))
    } else {
      res.statusCode = 404
      res.end(JSON.stringify({ error: 'Mock endpoint not found' }))
    }
  }
}
```

## Error Overlay Enhancement

```typescript
// dev/plugins/errorOverlay.ts
import { Plugin } from 'vite'

export function enhancedErrorOverlay(): Plugin {
  return {
    name: 'enhanced-error-overlay',
    configureServer(server) {
      // Inject enhanced error overlay
      server.middlewares.use('/dev/error-overlay', (req, res) => {
        res.setHeader('Content-Type', 'text/html')

        const overlayHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Development Error</title>
            <style>
              body {
                font-family: 'Monaco', 'Consolas', monospace;
                background: #1a1a1a;
                color: #fff;
                margin: 0;
                padding: 20px;
                line-height: 1.6;
              }
              .error-container {
                max-width: 1200px;
                margin: 0 auto;
                background: #2d2d2d;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
              }
              .error-title {
                color: #ff6b6b;
                font-size: 24px;
                margin-bottom: 16px;
                border-bottom: 2px solid #ff6b6b;
                padding-bottom: 10px;
              }
              .error-stack {
                background: #1a1a1a;
                border-radius: 4px;
                padding: 16px;
                overflow-x: auto;
                font-size: 14px;
                border-left: 4px solid #ff6b6b;
              }
              .file-link {
                color: #61dafb;
                text-decoration: underline;
                cursor: pointer;
              }
              .suggestions {
                margin-top: 20px;
                padding: 16px;
                background: #2a4d3a;
                border-radius: 4px;
                border-left: 4px solid #4caf50;
              }
              .reload-button {
                background: #61dafb;
                color: #000;
                border: none;
                padding: 12px 24px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
                margin-top: 20px;
              }
              .reload-button:hover {
                background: #4fa8c5;
              }
            </style>
          </head>
          <body>
            <div class="error-container">
              <div class="error-title" id="error-title">Development Error</div>
              <div class="error-stack" id="error-stack">Loading error details...</div>
              <div class="suggestions" id="suggestions">
                <strong>Suggestions:</strong>
                <ul>
                  <li>Check the console for additional details</li>
                  <li>Verify all imports are correct</li>
                  <li>Ensure all dependencies are installed</li>
                  <li>Check for TypeScript compilation errors</li>
                </ul>
              </div>
              <button class="reload-button" onclick="window.location.reload()">
                Reload Page
              </button>
            </div>
            
            <script>
              // Enhanced error overlay with better formatting
              function formatErrorStack(stack) {
                return stack
                  .split('\\n')
                  .map(line => {
                    // Highlight file paths
                    if (line.includes('at ') && line.includes(':')) {
                      const parts = line.split('at ')
                      if (parts.length === 2) {
                        const [, location] = parts
                        return 'at <span class="file-link">' + location + '</span>'
                      }
                    }
                    return line
                  })
                  .join('<br>')
              }
              
              // Listen for error messages from Vite
              if (typeof window !== 'undefined' && window.parent) {
                window.addEventListener('message', (event) => {
                  if (event.data.type === 'vite:error') {
                    const error = event.data.error
                    document.getElementById('error-title').textContent = error.message
                    document.getElementById('error-stack').innerHTML = formatErrorStack(error.stack || '')
                  }
                })
              }
            </script>
          </body>
          </html>
        `

        res.end(overlayHTML)
      })
    },
  }
}
```

## TypeScript Integration

```typescript
// dev/config/typescript.ts
import { Plugin } from 'vite'
import typescript from '@rollup/plugin-typescript'

export function enhancedTypeScript(): Plugin {
  return {
    name: 'enhanced-typescript',
    configResolved(config) {
      // Ensure TypeScript is properly configured
      if (config.command === 'serve') {
        // Development-specific TypeScript configuration
        console.log('🔧 TypeScript development mode enabled')
      }
    },
    configureServer(server) {
      // Watch for tsconfig.json changes
      server.watcher.add('tsconfig.json')
      server.watcher.on('change', file => {
        if (file.endsWith('tsconfig.json')) {
          console.log('📝 TypeScript configuration changed, restarting...')
          server.restart()
        }
      })
    },
  }
}

// TypeScript path aliases helper
export function createTypeScriptAliases() {
  return {
    '@/*': ['./src/*'],
    '@components/*': ['./src/components/*'],
    '@pages/*': ['./src/pages/*'],
    '@hooks/*': ['./src/hooks/*'],
    '@utils/*': ['./src/utils/*'],
    '@types/*': ['./src/types/*'],
    '@graphql/*': ['./src/graphql/*'],
    '@assets/*': ['./src/assets/*'],
  }
}
```

## Environment Configuration

```typescript
// dev/config/env.ts
import { loadEnv } from 'vite'

export interface DevEnvironment {
  API_URL: string
  GRAPHQL_URL: string
  WS_URL: string
  DEV_PORT: number
  HMR_PORT: number
  USE_MOCK_API: boolean
  ENABLE_DEVTOOLS: boolean
}

export function loadDevEnvironment(mode: string): DevEnvironment {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    API_URL: env.VITE_API_URL || 'http://localhost:4000',
    GRAPHQL_URL: env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql',
    WS_URL: env.VITE_WS_URL || 'http://localhost:4000',
    DEV_PORT: parseInt(env.VITE_DEV_PORT) || 3000,
    HMR_PORT: parseInt(env.VITE_HMR_PORT) || 3001,
    USE_MOCK_API: env.VITE_USE_MOCK_API === 'true',
    ENABLE_DEVTOOLS: env.VITE_ENABLE_DEVTOOLS !== 'false',
  }
}

// Environment validation
export function validateEnvironment(env: DevEnvironment) {
  const errors: string[] = []

  if (!env.API_URL) {
    errors.push('API_URL is required')
  }

  if (!env.GRAPHQL_URL) {
    errors.push('GRAPHQL_URL is required')
  }

  if (env.DEV_PORT < 1000 || env.DEV_PORT > 65535) {
    errors.push('DEV_PORT must be between 1000 and 65535')
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`)
  }
}
```

## Performance Monitoring

```typescript
// dev/middleware/performance.ts
import { Connect } from 'vite'

export function developmentPerformanceMonitor(): Connect.NextHandleFunction {
  const requestTimes = new Map<string, number>()

  return (req, res, next) => {
    const start = Date.now()
    const url = req.url || ''

    // Track request start time
    requestTimes.set(url, start)

    // Override res.end to capture completion time
    const originalEnd = res.end
    res.end = function (chunk?: any) {
      const duration = Date.now() - start

      // Log slow requests
      if (duration > 1000) {
        console.warn(`🐌 Slow request: ${req.method} ${url} took ${duration}ms`)
      } else if (duration > 100) {
        console.log(`⚠️  ${req.method} ${url} took ${duration}ms`)
      }

      requestTimes.delete(url)
      return originalEnd.call(this, chunk)
    }

    next()
  }
}

// Memory usage monitoring
export function memoryMonitor() {
  setInterval(() => {
    const usage = process.memoryUsage()
    const mb = (bytes: number) => Math.round(bytes / 1024 / 1024)

    console.log(`📊 Memory: RSS ${mb(usage.rss)}MB, Heap ${mb(usage.heapUsed)}/${mb(usage.heapTotal)}MB`)

    // Warn about high memory usage
    if (usage.heapUsed > 512 * 1024 * 1024) {
      // 512MB
      console.warn('⚠️  High memory usage detected. Consider restarting the dev server.')
    }
  }, 30000) // Check every 30 seconds
}
```
