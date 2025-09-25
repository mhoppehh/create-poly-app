# UI Component Library

## Overview

Enterprise-grade component library with design system, theming, accessibility, and comprehensive UI components for rapid application development.

## Priority

**HIGH** - Essential foundation for consistent, accessible UI development

## Dependencies

- `vite` (React application base)
- `tailwind` (styling foundation)

## Feature Description

Comprehensive UI component library providing consistent design system, accessibility standards, theme support, and extensive component collection for professional React applications.

### Key Features

- **Complete Design System**: Typography, colors, spacing, shadows, and layout tokens
- **Theme Support**: Light/dark mode, custom themes, CSS-in-JS or CSS variables
- **Accessibility First**: WCAG 2.1 AA compliance, screen reader support, keyboard navigation
- **Component Variants**: Multiple sizes, states, and style variations
- **Composition Patterns**: Compound components, render props, headless components
- **Animation System**: Smooth transitions, micro-interactions, loading states
- **Icon Library**: Comprehensive icon set with customization options
- **Form Components**: Advanced form controls with validation integration

## Configuration

```typescript
interface UILibraryConfig {
  library: 'custom' | 'shadcn-ui' | 'headless-ui' | 'mantine' | 'chakra-ui'
  designSystem: {
    primaryColor: string
    grayColor: string
    fontFamily: string
    borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl'
    animations: boolean
  }
  theme: {
    darkMode: 'class' | 'media' | 'manual'
    customProperties: boolean
    cssVariables: boolean
  }
  accessibility: {
    reducedMotion: boolean
    focusVisible: boolean
    announcements: boolean
  }
  components: {
    prefix: string
    sizeVariants: string[]
    colorVariants: string[]
  }
  icons: {
    library: 'lucide' | 'heroicons' | 'phosphor' | 'tabler'
    defaultSize: number
    strokeWidth: number
  }
}
```

## Generated Files

### Custom Component Library Structure

```
web/src/
├── components/
│   ├── ui/                           # Core UI components
│   │   ├── index.ts                  # Component exports
│   │   ├── button/
│   │   │   ├── Button.tsx           # Button component
│   │   │   ├── Button.stories.tsx   # Storybook stories
│   │   │   ├── Button.test.tsx      # Component tests
│   │   │   └── index.ts             # Button exports
│   │   ├── input/
│   │   │   ├── Input.tsx            # Input component
│   │   │   ├── TextArea.tsx         # TextArea component
│   │   │   ├── Select.tsx           # Select component
│   │   │   └── index.ts
│   │   ├── modal/
│   │   │   ├── Modal.tsx            # Modal component
│   │   │   ├── Dialog.tsx           # Dialog component
│   │   │   ├── Drawer.tsx           # Drawer component
│   │   │   └── index.ts
│   │   ├── feedback/
│   │   │   ├── Alert.tsx            # Alert component
│   │   │   ├── Toast.tsx            # Toast notifications
│   │   │   ├── Spinner.tsx          # Loading spinner
│   │   │   ├── Progress.tsx         # Progress bar
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── Container.tsx        # Container component
│   │   │   ├── Grid.tsx             # Grid system
│   │   │   ├── Stack.tsx            # Stack layout
│   │   │   ├── Divider.tsx          # Divider component
│   │   │   └── index.ts
│   │   ├── navigation/
│   │   │   ├── Tabs.tsx             # Tab navigation
│   │   │   ├── Breadcrumb.tsx       # Breadcrumb navigation
│   │   │   ├── Pagination.tsx       # Pagination
│   │   │   ├── Menu.tsx             # Dropdown menu
│   │   │   └── index.ts
│   │   ├── data-display/
│   │   │   ├── Table.tsx            # Data table
│   │   │   ├── Card.tsx             # Card component
│   │   │   ├── Badge.tsx            # Badge component
│   │   │   ├── Avatar.tsx           # Avatar component
│   │   │   ├── Tooltip.tsx          # Tooltip component
│   │   │   └── index.ts
│   │   └── forms/
│   │       ├── FormField.tsx        # Form field wrapper
│   │       ├── Checkbox.tsx         # Checkbox input
│   │       ├── Radio.tsx            # Radio input
│   │       ├── Switch.tsx           # Toggle switch
│   │       ├── Slider.tsx           # Range slider
│   │       └── index.ts
│   ├── icons/
│   │   ├── index.ts                 # Icon exports
│   │   ├── Icon.tsx                 # Base icon component
│   │   └── generated/               # Generated icon components
│   │       ├── ChevronDown.tsx
│   │       ├── User.tsx
│   │       ├── Search.tsx
│   │       └── ...
│   └── providers/
│       ├── ThemeProvider.tsx        # Theme context provider
│       ├── ToastProvider.tsx        # Toast notification provider
│       └── UIProvider.tsx           # Main UI provider
├── styles/
│   ├── globals.css                  # Global styles
│   ├── components.css               # Component styles
│   ├── tokens.css                   # Design tokens
│   └── themes/
│       ├── light.css                # Light theme
│       ├── dark.css                 # Dark theme
│       └── custom.css               # Custom theme
├── hooks/
│   ├── useTheme.ts                  # Theme management hook
│   ├── useMediaQuery.ts             # Media query hook
│   ├── useLocalStorage.ts           # Local storage hook
│   ├── useKeyboard.ts               # Keyboard interaction hook
│   └── useToast.ts                  # Toast notification hook
├── utils/
│   ├── cn.ts                        # Class name utility
│   ├── theme.ts                     # Theme utilities
│   ├── accessibility.ts            # A11y utilities
│   └── validation.ts                # Component validation
└── types/
    ├── component-props.ts           # Component prop types
    ├── theme.ts                     # Theme types
    └── variants.ts                  # Variant types
```

## Code Examples

### Button Component with Variants

```typescript
// web/src/components/ui/button/Button.tsx
import React, { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../../utils/cn'
import { Spinner } from '../feedback/Spinner'

const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium',
    'ring-offset-background transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-95 transition-transform duration-75'
  ],
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        xl: 'h-12 rounded-md px-12 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  loadingText?: string
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    disabled,
    children,
    leftIcon,
    rightIcon,
    loadingText,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : 'button'

    const isDisabled = disabled || loading

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <Spinner
            size="sm"
            className="mr-2"
            aria-label="Loading"
          />
        )}
        {!loading && leftIcon && (
          <span className="mr-2 flex items-center">
            {leftIcon}
          </span>
        )}
        <span>
          {loading && loadingText ? loadingText : children}
        </span>
        {!loading && rightIcon && (
          <span className="ml-2 flex items-center">
            {rightIcon}
          </span>
        )}
      </Comp>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
```

### Modal Component with Accessibility

```typescript
// web/src/components/ui/modal/Modal.tsx
import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { Button } from '../button/Button'
import { useFocusTrap } from '../../../hooks/useFocusTrap'
import { useKeyboard } from '../../../hooks/useKeyboard'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  className?: string
  overlayClassName?: string
}

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20
  }
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-none mx-4'
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  overlayClassName,
}) => {
  const modalRef = useRef<HTMLDivElement>(null)

  // Trap focus within modal
  useFocusTrap(modalRef, isOpen)

  // Handle escape key
  useKeyboard({
    Escape: closeOnEscape ? onClose : undefined,
  }, isOpen)

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Set initial focus to modal
      setTimeout(() => {
        modalRef.current?.focus()
      }, 0)
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnBackdropClick) {
      onClose()
    }
  }

  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          aria-describedby={description ? "modal-description" : undefined}
        >
          {/* Backdrop */}
          <motion.div
            className={cn(
              "absolute inset-0 bg-black/50 backdrop-blur-sm",
              overlayClassName
            )}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleBackdropClick}
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            className={cn(
              "relative w-full bg-background rounded-lg shadow-xl",
              "border border-border",
              "focus:outline-none",
              sizeClasses[size],
              className
            )}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              duration: 0.2,
              ease: [0.4, 0, 0.2, 1]
            }}
            tabIndex={-1}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex-1">
                  {title && (
                    <h2
                      id="modal-title"
                      className="text-lg font-semibold text-foreground"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p
                      id="modal-description"
                      className="mt-1 text-sm text-muted-foreground"
                    >
                      {description}
                    </p>
                  )}
                </div>

                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="ml-4 shrink-0"
                    aria-label="Close modal"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

// Confirmation Modal variant
export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  loading?: boolean
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm()
    } catch (error) {
      console.error('Confirmation action failed:', error)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      closeOnBackdropClick={!loading}
      closeOnEscape={!loading}
      showCloseButton={false}
    >
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          variant={variant === 'destructive' ? 'destructive' : 'default'}
          onClick={handleConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}
```

### Data Table Component

```typescript
// web/src/components/ui/data-display/Table.tsx
import React, { useMemo, useState } from 'react'
import { flexRender, getCoreRowModel, useReactTable, ColumnDef, SortingState, getSortedRowModel, getFilteredRowModel, getPaginationRowModel } from '@tanstack/react-table'
import { ChevronDown, ChevronUp, Search, Filter } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { Button } from '../button/Button'
import { Input } from '../input/Input'
import { Spinner } from '../feedback/Spinner'

export interface TableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  sortable?: boolean
  paginated?: boolean
  pageSize?: number
  className?: string
  emptyMessage?: string
  onRowClick?: (row: TData) => void
}

export function Table<TData>({
  data,
  columns,
  loading = false,
  searchable = false,
  searchPlaceholder = "Search...",
  sortable = true,
  paginated = true,
  pageSize = 10,
  className,
  emptyMessage = "No data available",
  onRowClick,
}: TableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: sortable ? getSortedRowModel() : undefined,
    getFilteredRowModel: searchable ? getFilteredRowModel() : undefined,
    getPaginationRowModel: paginated ? getPaginationRowModel() : undefined,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  const isEmpty = data.length === 0 && !loading

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filters */}
      {searchable && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="relative overflow-hidden rounded-md border border-border">
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header */}
            <thead className="bg-muted/50 border-b border-border">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        "px-4 py-3 text-left text-sm font-medium text-muted-foreground",
                        header.column.getCanSort() && sortable && "cursor-pointer select-none hover:text-foreground"
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && sortable && (
                          <div className="flex flex-col">
                            <ChevronUp className={cn(
                              "h-3 w-3",
                              header.column.getIsSorted() === 'asc' ? 'text-foreground' : 'text-muted-foreground'
                            )} />
                            <ChevronDown className={cn(
                              "h-3 w-3 -mt-1",
                              header.column.getIsSorted() === 'desc' ? 'text-foreground' : 'text-muted-foreground'
                            )} />
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            {/* Body */}
            <tbody>
              {isEmpty ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-border hover:bg-muted/50 transition-colors",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {paginated && !isEmpty && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getPrePaginationRowModel().rows.length)} of{' '}
            {table.getPrePaginationRowModel().rows.length} results
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Usage Example Component
interface User {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
}

export const UsersTable: React.FC<{ users: User[], loading?: boolean }> = ({ users, loading }) => {
  const columns: ColumnDef<User>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
          {row.original.role}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          row.original.status === 'active'
            ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300"
            : "bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300"
        )}>
          {row.original.status}
        </span>
      ),
    },
  ], [])

  const handleRowClick = (user: User) => {
    console.log('User clicked:', user)
  }

  return (
    <Table
      data={users}
      columns={columns}
      loading={loading}
      searchable
      searchPlaceholder="Search users..."
      onRowClick={handleRowClick}
    />
  )
}
```

### Theme Provider

```typescript
// web/src/components/providers/ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
```

### Design Tokens (CSS Variables)

```css
/* web/src/styles/tokens.css */
@layer base {
  :root {
    /* Colors */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;

    /* Spacing */
    --radius: 0.5rem;

    /* Typography */
    --font-sans: 'Inter', system-ui, sans-serif;
    --font-mono: 'Fira Code', monospace;

    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

    /* Animations */
    --duration-fast: 150ms;
    --duration-normal: 250ms;
    --duration-slow: 500ms;
    --ease-out: cubic-bezier(0, 0, 0.2, 1);
    --ease-in: cubic-bezier(0.4, 0, 1, 1);
    --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}

/* Component base styles */
@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings:
      'rlig' 1,
      'calt' 1;
  }

  /* Focus styles */
  .focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}
```

## Installation Steps

1. **Install Component Library Dependencies**

   ```bash
   # Core dependencies
   pnpm add @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu
   pnpm add @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-tooltip
   pnpm add class-variance-authority clsx tailwind-merge

   # Animation
   pnpm add framer-motion

   # Icons
   pnpm add lucide-react
   # or
   pnpm add @heroicons/react

   # Data table
   pnpm add @tanstack/react-table
   ```

2. **Setup Tailwind CSS Configuration**

   ```bash
   # Add to tailwind.config.js
   pnpm add tailwindcss-animate
   ```

3. **Configure TypeScript**

   ```bash
   # Type definitions
   pnpm add -D @types/react @types/react-dom
   ```

4. **Setup Storybook (Optional)**
   ```bash
   pnpm dlx storybook@latest init
   pnpm add -D @storybook/addon-a11y
   ```

This UI component library provides a complete foundation for building accessible, themeable, and professional React applications with enterprise-grade components.
