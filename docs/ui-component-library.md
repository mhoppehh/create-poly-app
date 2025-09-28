# UI Component Library

## Overview

Enterprise-grade modular component library with design system, theming, accessibility, and comprehensive UI components for rapid application development. Automatically adapts to support web-only, mobile-only, or cross-platform development based on detected platforms.

## Priority

**HIGH** - Essential foundation for consistent, accessible UI development

## Dependencies

- `vite` (React web application base) OR React Native setup (mobile application base)
- `tailwind` (styling foundation for web - when web platform detected)

## Auto-Detected Extensions

- **Cross-Platform Mode**: Automatically enabled when both web and mobile platforms are detected
- **GraphQL Integration**: Enhanced when `graphql-client` is present
- **Shared State Management**: Advanced sharing when both platforms use compatible state solutions

## Feature Description

Intelligent component library that automatically scales from single-platform to cross-platform development. Provides a shared component architecture where only cross-platform compatible components (like shadcn) are installed in a centralized shared directory accessible by both platforms. Platform-specific packages are installed directly in their respective projects. The system is designed for future extensibility to support shared utilities, hooks, and other development tools.

### System Architecture

**Shared Component Directory Structure**

```
packages/
  ui-shared/           # Cross-platform compatible components only
    components/        # shadcn and custom components (web + mobile compatible)
    hooks/            # Future: shared hooks (cross-platform)
    utils/            # Future: shared utilities (cross-platform)
    lib/              # Shared configuration and utilities
  ui-web/             # Web-specific components and overrides

# Mobile-specific packages are installed directly in the mobile project
# (e.g., my-project/mobile/node_modules/ or similar mobile project structure)
```

**Package Management Strategy**

- React Native packages → Installed directly in the mobile project (not in packages/ directory)
- React packages → Available to both web and mobile platforms
- shadcn components → Shared directory (cross-platform compatible only)
- Web-specific packages → Can be installed in `packages/ui-web/` if needed
- Platform-specific packages → Installed in their respective platform projects only

### Inspiration from Popular Component Libraries

This system draws best practices from leading component libraries:

#### Web Component Libraries

- **shadcn/ui**: Modular, copy-paste components with Tailwind CSS styling
- **Chakra UI**: Simple, modular, and accessible component library
- **Material-UI (MUI)**: Comprehensive React components implementing Material Design
- **Ant Design**: Enterprise-grade UI design language and React components
- **Mantine**: Full-featured components and hooks library with dark theme support
- **Headless UI**: Unstyled, accessible UI components for React and Vue

#### Cross-Platform Libraries

- **NativeBase**: Universal components that work on web, iOS, and Android
- **Tamagui**: Universal UI components with optimizations for React Native and web
- **Gluestack UI**: Universal components with platform-specific optimizations

_Note: These cross-platform libraries would be treated as React packages (usable by both platforms) rather than React Native-specific packages._

#### React Native Specific Libraries

- **React Native Elements**: React Native specific UI toolkit
- **React Native Paper**: Material Design for React Native
- **React Native UI Kitten**: Eva Design System for React Native

_Note: These React Native specific libraries would only be installed in the mobile project._

#### Design System Inspirations

- **Atlassian Design System**: Comprehensive design tokens and component guidelines
- **IBM Carbon**: Open-source design system with React components
- **Shopify Polaris**: Design system for building consistent merchant experiences
- **GitHub Primer**: Design system powering GitHub's interface

### Key Features

- **Shared Component Architecture**: Centralized component directory for cross-platform sharing
- **Platform-Aware Package Management**: Intelligent detection and restriction of platform-specific packages
- **Complete Design System**: Typography, colors, spacing, shadows, and layout tokens
- **Cross-Platform Design Tokens**: Shared design tokens that work across web and mobile
- **Theme Support**: Light/dark mode, custom themes, platform-adaptive styling
- **Accessibility First**: WCAG 2.1 AA compliance, screen reader support, keyboard navigation
- **Component Variants**: Multiple sizes, states, and style variations
- **Modular Architecture**: Tree-shakable components for optimal bundle size
- **Future Extensibility**: Architecture designed to support future additions like shared utils and hooks
- **Flexible Integration**: Mix cross-platform shadcn shared components with platform-specific packages installed in their respective projects

### Component Library Integration Options

The system provides a simple yet adaptable approach to component sharing across platforms:

#### shadcn/ui Integration (Cross-Platform Shared)

- **Cross-Platform Components Only**: Only shadcn components that work on both web and mobile are placed in the shared directory
- **Shared Installation**: Cross-platform compatible components installed in `packages/ui-shared`
- **Universal Access**: Both web and mobile applications can import the same components
- **Platform Adaptation**: Components automatically adapt styling and behavior based on the consuming platform
- **Consistent API**: Unified component interface across all platforms
- **Full Customization**: Complete control over component implementation and styling

#### Package-Based Libraries (Platform-Specific Installation)

The system handles different UI library packages with platform-aware installation:

**React Native Packages** (Mobile Project Only)

- Libraries like `react-native-elements`, `react-native-paper`, `@react-native-community/slider`
- Installed directly in the mobile project's `node_modules` (not in packages/ directory)
- Not accessible to web applications
- No shared directory or `ui-mobile` package placement

**React Packages** (Cross-Platform Compatible)

- Libraries like `@mui/material`, `chakra-ui`, `mantine`, `framer-motion`
- Can be used by both web and mobile applications
- Installed where both platforms can access them
- Cross-platform compatibility automatically configured

**Hybrid Approach**

- Mix cross-platform shadcn shared components with platform-specific packages
- React Native packages installed directly in the mobile project (not packages/ directory)
- Web-specific packages can be installed in `packages/ui-web/` if needed
- Shared components only include those compatible with both platforms
- Clear separation between shared and platform-specific resources

### Popular Component Patterns Supported

#### From shadcn/ui (Enhanced for Cross-Platform)

- **Shared component installation**: Components installed in `packages/ui-shared`
- **Cross-platform accessibility**: Both web and mobile can import the same components
- **Platform-adaptive styling**: Components automatically adapt to web/mobile contexts
- **Customizable component variants**: Using class-variance-authority (cva) with platform awareness
- **TypeScript-first**: Complete type safety across platforms

#### From Chakra UI

- **Simple API**: Intuitive prop-based styling
- **Responsive design**: Built-in responsive props
- **Theme customization**: Easy theme overrides
- **Accessibility**: ARIA attributes and keyboard navigation

#### From Material-UI

- **Comprehensive components**: Complete component ecosystem
- **Theming system**: Advanced theme customization
- **Design tokens**: Consistent spacing, colors, and typography
- **Styled components**: CSS-in-JS styling approach

#### Package-Based Libraries (Platform-Intelligent)

- **Automatic platform detection**: React Native packages installed directly in mobile project
- **Universal React packages**: Available to both web and mobile platforms
- **Smart dependency management**: Platform-appropriate package installation locations
- **Seamless integration**: Works alongside shared components
- **Future extensibility**: Architecture ready for additional shared resources
