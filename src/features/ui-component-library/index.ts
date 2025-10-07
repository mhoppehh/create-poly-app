import type { Feature } from '../../types'
import { ActivationConditions, ActivationRules } from '../../forms/feature-selector'

// Import codemods - these will be used in future stages when implementation is needed
import { configureSharedPackageJson, updateWorkspaceConfig, configureAppIntegration } from './codemods'

export const uiComponentLibrary: Feature = {
  id: 'ui-component-library',
  description:
    'Enterprise-grade modular component library with design system, theming, accessibility, and comprehensive UI components for rapid application development',
  name: 'UI Component Library',
  dependsOn: ['vite'],

  configuration: [
    {
      id: 'platforms',
      type: 'multiselect',
      title: 'Which platforms will you be developing for?',
      description:
        'Select all platforms you plan to support. The system will automatically configure cross-platform shared components when multiple platforms are selected.',
      required: true,
      options: [
        {
          label: 'Web (React)',
          value: 'web',
          description: 'React web applications with Vite and Tailwind CSS',
        },
        {
          label: 'Mobile (React Native)',
          value: 'mobile',
          description: 'React Native mobile applications for iOS and Android',
        },
      ],
      defaultValue: ['web'],
      validation: [{ type: 'minItems', value: 1, message: 'Please select at least one platform' }],
    },

    {
      id: 'componentLibrary',
      type: 'select',
      title: 'Which component library approach would you like to use?',
      description:
        'Choose your preferred component library setup. shadcn/ui provides maximum customization, while package-based libraries offer ready-to-use components.',
      required: true,
      options: [
        {
          label: 'shadcn/ui (Recommended)',
          value: 'shadcn',
          description:
            'Copy-paste components with full customization using Tailwind CSS - automatically adapts for cross-platform',
        },
        {
          label: 'Package-based Library',
          value: 'package',
          description:
            'Use established component libraries (Chakra UI, Material-UI, etc.) with platform-specific installation',
        },
        {
          label: 'Custom Components',
          value: 'custom',
          description: 'Start with a custom component foundation and build your own design system',
        },
      ],
      defaultValue: 'shadcn',
    },
    {
      id: 'packageLibrary',
      type: 'select',
      title: 'Which package-based component library would you like to use?',
      description:
        'Select your preferred component library. The system will handle platform-specific installation automatically.',
      required: true,
      showIf: [{ dependsOn: 'componentLibrary', condition: { type: 'equals', value: 'package' } }],
      options: [
        {
          label: 'Chakra UI',
          value: 'chakra',
          description: 'Simple, modular and accessible components (React only)',
        },
        {
          label: 'Material-UI (MUI)',
          value: 'mui',
          description: 'React components implementing Google Material Design (React only)',
        },
        {
          label: 'Ant Design',
          value: 'antd',
          description: 'Enterprise-grade UI design language (React only)',
        },
        {
          label: 'Mantine',
          value: 'mantine',
          description: 'Full-featured React components with dark theme support (React only)',
        },
        {
          label: 'NativeBase',
          value: 'nativebase',
          description: 'Universal components for web and mobile (Cross-platform)',
        },
        {
          label: 'Tamagui',
          value: 'tamagui',
          description: 'Universal UI with performance optimizations (Cross-platform)',
        },
      ],
      defaultValue: 'chakra',
    },
    {
      id: 'mobileLibrary',
      type: 'select',
      title: 'Which React Native component library would you like to add?',
      description: 'Select additional mobile-specific components to enhance your React Native experience.',
      required: false,
      showIf: [
        {
          dependsOn: 'platforms',
          condition: { type: 'includes', value: 'mobile' },
        },
      ],
      options: [
        {
          label: 'None',
          value: 'none',
          description: 'Use only cross-platform or custom components',
        },
        {
          label: 'React Native Elements',
          value: 'rn-elements',
          description: 'Comprehensive React Native UI toolkit',
        },
        {
          label: 'React Native Paper',
          value: 'rn-paper',
          description: 'Material Design components for React Native',
        },
        {
          label: 'React Native UI Kitten',
          value: 'rn-ui-kitten',
          description: 'Eva Design System for React Native',
        },
      ],
      defaultValue: 'none',
    },
    {
      id: 'designSystemFeatures',
      type: 'multiselect',
      title: 'Which design system features would you like to include?',
      description:
        'Select the design system features you need. More features provide consistency but increase initial setup time.',
      required: true,
      options: [
        {
          label: 'Design Tokens',
          value: 'tokens',
          description: 'Centralized colors, typography, spacing, and layout tokens',
        },
        {
          label: 'Theme System',
          value: 'theming',
          description: 'Light/dark mode support and custom theme configuration',
        },
        {
          label: 'Typography Scale',
          value: 'typography',
          description: 'Consistent typography system with responsive font sizes',
        },
        {
          label: 'Color Palette',
          value: 'colors',
          description: 'Comprehensive color system with semantic color naming',
        },
        {
          label: 'Spacing System',
          value: 'spacing',
          description: 'Consistent spacing scale for margins, padding, and layout',
        },
        {
          label: 'Component Variants',
          value: 'variants',
          description: 'Multiple size, color, and style variants for components',
        },
      ],
      defaultValue: ['tokens', 'theming', 'typography', 'colors'],
      validation: [{ type: 'minItems', value: 1, message: 'Please select at least one design system feature' }],
    },
    {
      id: 'componentCategories',
      type: 'multiselect',
      title: 'Which component categories would you like to include?',
      description: 'Select the types of components you need. You can always add more categories later.',
      required: true,
      options: [
        {
          label: 'Layout Components',
          value: 'layout',
          description: 'Container, Grid, Stack, Flex, Divider, etc.',
        },
        {
          label: 'Form Components',
          value: 'forms',
          description: 'Input, Button, Select, Checkbox, Radio, etc.',
        },
        {
          label: 'Data Display',
          value: 'data',
          description: 'Table, List, Card, Badge, Avatar, etc.',
        },
        {
          label: 'Feedback Components',
          value: 'feedback',
          description: 'Alert, Toast, Modal, Loading, Progress, etc.',
        },
        {
          label: 'Navigation',
          value: 'navigation',
          description: 'Menu, Breadcrumb, Tabs, Pagination, etc.',
        },
        {
          label: 'Overlay Components',
          value: 'overlay',
          description: 'Modal, Drawer, Popover, Tooltip, etc.',
        },
      ],
      defaultValue: ['layout', 'forms', 'feedback'],
      validation: [{ type: 'minItems', value: 1, message: 'Please select at least one component category' }],
    },
    {
      id: 'accessibilityLevel',
      type: 'select',
      title: 'What level of accessibility compliance do you need?',
      description: 'Higher levels provide better accessibility but require more setup and testing.',
      required: true,
      options: [
        {
          label: 'Basic (WCAG 2.1 A)',
          value: 'basic',
          description: 'Essential accessibility features - keyboard navigation, semantic HTML',
        },
        {
          label: 'Standard (WCAG 2.1 AA)',
          value: 'standard',
          description: 'Recommended level - includes color contrast, screen reader support',
        },
        {
          label: 'Enhanced (WCAG 2.1 AAA)',
          value: 'enhanced',
          description: 'Highest level - comprehensive accessibility with advanced features',
        },
      ],
      defaultValue: 'standard',
    },
    {
      id: 'integrations',
      type: 'multiselect',
      title: 'Which integrations would you like to enable?',
      description: 'Select integrations that will enhance your component library experience.',
      required: false,
      options: [
        {
          label: 'Storybook',
          value: 'storybook',
          description: 'Component documentation and testing playground',
        },
        {
          label: 'GraphQL Integration',
          value: 'graphql',
          description: 'Enhanced components when GraphQL client is detected',
        },
        {
          label: 'Form Libraries',
          value: 'forms',
          description: 'Integration with React Hook Form, Formik, etc.',
        },
        {
          label: 'Animation Libraries',
          value: 'animations',
          description: 'Framer Motion, React Spring integration',
        },
        {
          label: 'Icon Libraries',
          value: 'icons',
          description: 'Heroicons, Lucide React, React Icons',
        },
      ],
      defaultValue: ['icons'],
    },
    {
      id: 'advancedConfig',
      type: 'toggle',
      title: 'Enable advanced configuration options?',
      description: 'Show additional configuration options for power users and complex setups.',
      required: false,
      defaultValue: false,
    },
    {
      id: 'bundleOptimization',
      type: 'select',
      title: 'How would you like to optimize the component library bundle?',
      description: 'Choose the optimization strategy that best fits your application needs.',
      required: true,
      showIf: [{ dependsOn: 'advancedConfig', condition: { type: 'equals', value: true } }],
      options: [
        {
          label: 'Tree Shaking (Recommended)',
          value: 'tree-shaking',
          description: 'Import only used components for optimal bundle size',
        },
        {
          label: 'Modular Imports',
          value: 'modular',
          description: 'Explicit modular imports for maximum control',
        },
        {
          label: 'Full Bundle',
          value: 'full',
          description: 'Import entire library - simpler setup but larger bundle',
        },
      ],
      defaultValue: 'tree-shaking',
    },
    {
      id: 'testingSetup',
      type: 'multiselect',
      title: 'Which testing tools would you like to configure?',
      description: 'Set up testing infrastructure for your component library.',
      required: false,
      showIf: [{ dependsOn: 'advancedConfig', condition: { type: 'equals', value: true } }],
      options: [
        {
          label: 'React Testing Library',
          value: 'rtl',
          description: 'Testing utilities for React components',
        },
        {
          label: 'Jest DOM Matchers',
          value: 'jest-dom',
          description: 'Custom Jest matchers for testing DOM elements',
        },
        {
          label: 'Visual Regression',
          value: 'visual',
          description: 'Chromatic or similar for visual testing',
        },
        {
          label: 'Accessibility Testing',
          value: 'a11y',
          description: 'Automated accessibility testing with jest-axe',
        },
      ],
      defaultValue: ['rtl', 'jest-dom'],
    },
  ],

  stages: [
    // Base Setup - Always runs for core infrastructure
    {
      name: 'setup-workspace-structure',
      scripts: [
        // TODO: Create packages directory structure
        { src: 'mkdir -p packages', dir: '.' },
      ],
      templates: [
        // TODO: Add workspace configuration templates
        {
          source: 'src/features/ui-component-library/templates/workspace',
          destination: 'packages',
        },
      ],
    },

    // Cross-Platform Shared Components Setup - When multiple platforms selected
    {
      name: 'setup-shared-components',
      activatedBy: ActivationConditions.custom(
        'platforms',
        platforms => Array.isArray(platforms) && platforms.length > 1,
      ),
      scripts: [
        // TODO: Initialize shared component package
        {
          src: 'mkdir -p packages/ui-shared/components packages/ui-shared/lib packages/ui-shared/hooks packages/ui-shared/utils',
          dir: '.',
        },
        { src: 'pnpm init', dir: 'packages/ui-shared' },
      ],
      templates: [
        {
          source: 'src/features/ui-component-library/templates/shared',
          destination: 'packages/ui-shared',
        },
      ],
    },

    // Web-only Components Setup - When only web platform selected
    {
      name: 'setup-web-only-components',
      activatedBy: ActivationRules.and(
        ActivationConditions.includesValue('platforms', 'web'),
        ActivationConditions.custom(
          'platforms',
          platforms => Array.isArray(platforms) && platforms.length === 1 && platforms[0] === 'web',
        ),
      ),
      scripts: [
        // TODO: Setup web-specific component structure
        { src: 'mkdir -p packages/ui-web/components packages/ui-web/lib', dir: '.' },
        { src: 'pnpm init', dir: 'packages/ui-web' },
      ],
      templates: [
        {
          source: 'src/features/ui-component-library/templates/web-only',
          destination: 'packages/ui-web',
        },
      ],
    },

    // shadcn/ui Setup - When shadcn is selected
    {
      name: 'setup-shadcn-components',
      activatedBy: ActivationConditions.equals('componentLibrary', 'shadcn'),
      scripts: [
        // TODO: Install shadcn/ui dependencies and setup
        { src: 'pnpm add class-variance-authority clsx tailwind-merge', dir: 'packages/ui-shared' },
        { src: 'pnpm add -D @types/react @types/react-dom', dir: 'packages/ui-shared' },
      ],
      templates: [
        {
          source: 'src/features/ui-component-library/templates/shadcn',
          destination: 'packages/ui-shared',
        },
      ],
    },

    // Chakra UI Setup - When Chakra UI is selected
    {
      name: 'setup-chakra-components',
      activatedBy: ActivationRules.and(
        ActivationConditions.equals('componentLibrary', 'package'),
        ActivationConditions.equals('packageLibrary', 'chakra'),
      ),
      scripts: [
        // TODO: Install Chakra UI for web platform
        { src: 'pnpm add @chakra-ui/react @emotion/react @emotion/styled framer-motion', dir: 'web' },
      ],
      templates: [
        {
          source: 'src/features/ui-component-library/templates/chakra',
          destination: 'web/src',
        },
      ],
    },

    // Material-UI Setup - When MUI is selected
    {
      name: 'setup-mui-components',
      activatedBy: ActivationRules.and(
        ActivationConditions.equals('componentLibrary', 'package'),
        ActivationConditions.equals('packageLibrary', 'mui'),
      ),
      scripts: [
        // TODO: Install Material-UI for web platform
        { src: 'pnpm add @mui/material @emotion/react @emotion/styled @mui/icons-material', dir: 'web' },
      ],
      templates: [
        {
          source: 'src/features/ui-component-library/templates/mui',
          destination: 'web/src',
        },
      ],
    },

    // Ant Design Setup - When Ant Design is selected
    {
      name: 'setup-antd-components',
      activatedBy: ActivationRules.and(
        ActivationConditions.equals('componentLibrary', 'package'),
        ActivationConditions.equals('packageLibrary', 'antd'),
      ),
      scripts: [
        // TODO: Install Ant Design for web platform
        { src: 'pnpm add antd @ant-design/icons', dir: 'web' },
      ],
      templates: [
        {
          source: 'src/features/ui-component-library/templates/antd',
          destination: 'web/src',
        },
      ],
    },

    // Mantine Setup - When Mantine is selected
    {
      name: 'setup-mantine-components',
      activatedBy: ActivationRules.and(
        ActivationConditions.equals('componentLibrary', 'package'),
        ActivationConditions.equals('packageLibrary', 'mantine'),
      ),
      scripts: [
        // TODO: Install Mantine for web platform
        { src: 'pnpm add @mantine/core @mantine/hooks @mantine/notifications', dir: 'web' },
      ],
      templates: [
        {
          source: 'src/features/ui-component-library/templates/mantine',
          destination: 'web/src',
        },
      ],
    },

    // NativeBase Setup - When NativeBase is selected (Cross-platform)
    {
      name: 'setup-nativebase-components',
      activatedBy: ActivationRules.and(
        ActivationConditions.equals('componentLibrary', 'package'),
        ActivationConditions.equals('packageLibrary', 'nativebase'),
      ),
      scripts: [
        // TODO: Install NativeBase in shared location
        { src: 'pnpm add native-base react-native-svg react-native-safe-area-context', dir: 'packages/ui-shared' },
      ],
      templates: [
        {
          source: 'src/features/ui-component-library/templates/nativebase',
          destination: 'packages/ui-shared',
        },
      ],
    },

    // Tamagui Setup - When Tamagui is selected (Cross-platform)
    {
      name: 'setup-tamagui-components',
      activatedBy: ActivationRules.and(
        ActivationConditions.equals('componentLibrary', 'package'),
        ActivationConditions.equals('packageLibrary', 'tamagui'),
      ),
      scripts: [
        // TODO: Install Tamagui in shared location
        { src: 'pnpm add @tamagui/core @tamagui/config @tamagui/animations-react-native', dir: 'packages/ui-shared' },
      ],
      templates: [
        {
          source: 'src/features/ui-component-library/templates/tamagui',
          destination: 'packages/ui-shared',
        },
      ],
    },

    // React Native Elements Setup - When React Native Elements is selected
    {
      name: 'setup-rn-elements',
      activatedBy: ActivationRules.and(
        ActivationConditions.includesValue('platforms', 'mobile'),
        ActivationConditions.equals('mobileLibrary', 'rn-elements'),
      ),
      scripts: [
        // TODO: Install React Native Elements in mobile project (not packages/)
        { src: 'echo "TODO: Install react-native-elements in mobile project directory"' },
      ],
    },

    // React Native Paper Setup - When React Native Paper is selected
    {
      name: 'setup-rn-paper',
      activatedBy: ActivationRules.and(
        ActivationConditions.includesValue('platforms', 'mobile'),
        ActivationConditions.equals('mobileLibrary', 'rn-paper'),
      ),
      scripts: [
        // TODO: Install React Native Paper in mobile project (not packages/)
        { src: 'echo "TODO: Install react-native-paper in mobile project directory"' },
      ],
    },

    // React Native UI Kitten Setup - When UI Kitten is selected
    {
      name: 'setup-rn-ui-kitten',
      activatedBy: ActivationRules.and(
        ActivationConditions.includesValue('platforms', 'mobile'),
        ActivationConditions.equals('mobileLibrary', 'rn-ui-kitten'),
      ),
      scripts: [
        // TODO: Install React Native UI Kitten in mobile project (not packages/)
        { src: 'echo "TODO: Install @ui-kitten/components in mobile project directory"' },
      ],
    },

    // Design System Setup - When design system features are selected
    {
      name: 'setup-design-tokens',
      activatedBy: ActivationConditions.includesValue('designSystemFeatures', 'tokens'),
      templates: [
        {
          source: 'src/features/ui-component-library/templates/design-tokens',
          destination: 'packages/ui-shared/tokens',
        },
      ],
    },

    // Theme System Setup - When theming is selected
    {
      name: 'setup-theme-system',
      activatedBy: ActivationConditions.includesValue('designSystemFeatures', 'theming'),
      scripts: [
        // TODO: Install theme-related dependencies
        { src: 'pnpm add @emotion/react @emotion/styled', dir: 'packages/ui-shared' },
      ],
      templates: [
        {
          source: 'src/features/ui-component-library/templates/theme',
          destination: 'packages/ui-shared/theme',
        },
      ],
    },

    // Typography System Setup - When typography is selected
    {
      name: 'setup-typography-system',
      activatedBy: ActivationConditions.includesValue('designSystemFeatures', 'typography'),
      templates: [
        {
          source: 'src/features/ui-component-library/templates/typography',
          destination: 'packages/ui-shared/typography',
        },
      ],
    },

    // Component Categories - Layout Components
    {
      name: 'setup-layout-components',
      activatedBy: ActivationConditions.includesValue('componentCategories', 'layout'),
      templates: [
        {
          source: 'src/features/ui-component-library/templates/components/layout',
          destination: 'packages/ui-shared/components/layout',
        },
      ],
    },

    // Component Categories - Form Components
    {
      name: 'setup-form-components',
      activatedBy: ActivationConditions.includesValue('componentCategories', 'forms'),
      templates: [
        {
          source: 'src/features/ui-component-library/templates/components/forms',
          destination: 'packages/ui-shared/components/forms',
        },
      ],
    },

    // Component Categories - Data Display Components
    {
      name: 'setup-data-components',
      activatedBy: ActivationConditions.includesValue('componentCategories', 'data'),
      templates: [
        {
          source: 'src/features/ui-component-library/templates/components/data',
          destination: 'packages/ui-shared/components/data',
        },
      ],
    },

    // Component Categories - Feedback Components
    {
      name: 'setup-feedback-components',
      activatedBy: ActivationConditions.includesValue('componentCategories', 'feedback'),
      templates: [
        {
          source: 'src/features/ui-component-library/templates/components/feedback',
          destination: 'packages/ui-shared/components/feedback',
        },
      ],
    },

    // Component Categories - Navigation Components
    {
      name: 'setup-navigation-components',
      activatedBy: ActivationConditions.includesValue('componentCategories', 'navigation'),
      templates: [
        {
          source: 'src/features/ui-component-library/templates/components/navigation',
          destination: 'packages/ui-shared/components/navigation',
        },
      ],
    },

    // Component Categories - Overlay Components
    {
      name: 'setup-overlay-components',
      activatedBy: ActivationConditions.includesValue('componentCategories', 'overlay'),
      templates: [
        {
          source: 'src/features/ui-component-library/templates/components/overlay',
          destination: 'packages/ui-shared/components/overlay',
        },
      ],
    },

    // Accessibility Setup - Standard Level
    {
      name: 'setup-standard-accessibility',
      activatedBy: ActivationConditions.isOneOf('accessibilityLevel', ['standard', 'enhanced']),
      scripts: [
        // TODO: Install accessibility testing and validation tools
        { src: 'pnpm add -D @axe-core/react', dir: 'packages/ui-shared' },
      ],
      templates: [
        {
          source: 'src/features/ui-component-library/templates/accessibility/standard',
          destination: 'packages/ui-shared/accessibility',
        },
      ],
    },

    // Accessibility Setup - Enhanced Level
    {
      name: 'setup-enhanced-accessibility',
      activatedBy: ActivationConditions.equals('accessibilityLevel', 'enhanced'),
      scripts: [
        // TODO: Install advanced accessibility tools
        { src: 'pnpm add -D jest-axe @testing-library/jest-dom', dir: 'packages/ui-shared' },
      ],
      templates: [
        {
          source: 'src/features/ui-component-library/templates/accessibility/enhanced',
          destination: 'packages/ui-shared/accessibility',
        },
      ],
    },

    // Integration - Storybook Setup
    {
      name: 'setup-storybook-integration',
      activatedBy: ActivationConditions.includesValue('integrations', 'storybook'),
      scripts: [
        // TODO: Initialize Storybook for component documentation
        { src: 'pnpm add -D @storybook/react @storybook/addon-essentials', dir: 'packages/ui-shared' },
      ],
      templates: [
        {
          source: 'src/features/ui-component-library/templates/storybook',
          destination: 'packages/ui-shared/.storybook',
        },
      ],
    },

    // Integration - GraphQL Components
    {
      name: 'setup-graphql-integration',
      activatedBy: ActivationConditions.includesValue('integrations', 'graphql'),
      scripts: [
        // TODO: Add GraphQL-aware component helpers
        { src: 'pnpm add @apollo/client graphql', dir: 'packages/ui-shared' },
      ],
      templates: [
        {
          source: 'src/features/ui-component-library/templates/graphql',
          destination: 'packages/ui-shared/graphql',
        },
      ],
    },

    // Integration - Form Libraries
    {
      name: 'setup-form-integration',
      activatedBy: ActivationConditions.includesValue('integrations', 'forms'),
      scripts: [
        // TODO: Add form library integrations
        { src: 'pnpm add react-hook-form @hookform/resolvers', dir: 'packages/ui-shared' },
      ],
      templates: [
        {
          source: 'src/features/ui-component-library/templates/form-integration',
          destination: 'packages/ui-shared/forms',
        },
      ],
    },

    // Integration - Animation Libraries
    {
      name: 'setup-animation-integration',
      activatedBy: ActivationConditions.includesValue('integrations', 'animations'),
      scripts: [
        // TODO: Add animation library support
        { src: 'pnpm add framer-motion', dir: 'packages/ui-shared' },
      ],
      templates: [
        {
          source: 'src/features/ui-component-library/templates/animations',
          destination: 'packages/ui-shared/animations',
        },
      ],
    },

    // Integration - Icon Libraries
    {
      name: 'setup-icon-integration',
      activatedBy: ActivationConditions.includesValue('integrations', 'icons'),
      scripts: [
        // TODO: Add icon library support
        { src: 'pnpm add lucide-react @heroicons/react', dir: 'packages/ui-shared' },
      ],
      templates: [
        {
          source: 'src/features/ui-component-library/templates/icons',
          destination: 'packages/ui-shared/icons',
        },
      ],
    },

    // Advanced - Bundle Optimization
    {
      name: 'setup-tree-shaking-optimization',
      activatedBy: ActivationRules.and(
        ActivationConditions.equals('advancedConfig', true),
        ActivationConditions.equals('bundleOptimization', 'tree-shaking'),
      ),
      templates: [
        {
          source: 'src/features/ui-component-library/templates/optimization/tree-shaking',
          destination: 'packages/ui-shared',
        },
      ],
    },

    // Advanced - Modular Imports
    {
      name: 'setup-modular-imports-optimization',
      activatedBy: ActivationRules.and(
        ActivationConditions.equals('advancedConfig', true),
        ActivationConditions.equals('bundleOptimization', 'modular'),
      ),
      templates: [
        {
          source: 'src/features/ui-component-library/templates/optimization/modular',
          destination: 'packages/ui-shared',
        },
      ],
    },

    // Testing - React Testing Library
    {
      name: 'setup-react-testing-library',
      activatedBy: ActivationRules.and(
        ActivationConditions.equals('advancedConfig', true),
        ActivationConditions.includesValue('testingSetup', 'rtl'),
      ),
      scripts: [
        // TODO: Install React Testing Library
        { src: 'pnpm add -D @testing-library/react @testing-library/user-event', dir: 'packages/ui-shared' },
      ],
      templates: [
        {
          source: 'src/features/ui-component-library/templates/testing/rtl',
          destination: 'packages/ui-shared/tests',
        },
      ],
    },

    // Testing - Jest DOM Matchers
    {
      name: 'setup-jest-dom-matchers',
      activatedBy: ActivationRules.and(
        ActivationConditions.equals('advancedConfig', true),
        ActivationConditions.includesValue('testingSetup', 'jest-dom'),
      ),
      scripts: [
        // TODO: Install Jest DOM matchers
        { src: 'pnpm add -D @testing-library/jest-dom', dir: 'packages/ui-shared' },
      ],
      templates: [
        {
          source: 'src/features/ui-component-library/templates/testing/jest-dom',
          destination: 'packages/ui-shared/tests',
        },
      ],
    },

    // Testing - Visual Regression Testing
    {
      name: 'setup-visual-regression-testing',
      activatedBy: ActivationRules.and(
        ActivationConditions.equals('advancedConfig', true),
        ActivationConditions.includesValue('testingSetup', 'visual'),
      ),
      scripts: [
        // TODO: Setup visual regression testing
        { src: 'pnpm add -D @storybook/test-runner playwright', dir: 'packages/ui-shared' },
      ],
      templates: [
        {
          source: 'src/features/ui-component-library/templates/testing/visual',
          destination: 'packages/ui-shared/tests',
        },
      ],
    },

    // Testing - Accessibility Testing
    {
      name: 'setup-accessibility-testing',
      activatedBy: ActivationRules.and(
        ActivationConditions.equals('advancedConfig', true),
        ActivationConditions.includesValue('testingSetup', 'a11y'),
      ),
      scripts: [
        // TODO: Install accessibility testing tools
        { src: 'pnpm add -D jest-axe', dir: 'packages/ui-shared' },
      ],
      templates: [
        {
          source: 'src/features/ui-component-library/templates/testing/a11y',
          destination: 'packages/ui-shared/tests',
        },
      ],
    },

    // Final Configuration - Package.json Setup
    {
      name: 'configure-package-json',
      scripts: [
        // TODO: Configure package.json files with proper dependencies and scripts
        { src: 'echo "TODO: Configure package.json files for all created packages"' },
      ],
    },

    // Final Configuration - Workspace Integration
    {
      name: 'configure-workspace-integration',
      templates: [
        {
          source: 'src/features/ui-component-library/templates/workspace-integration',
          destination: '.',
        },
      ],
    },
  ],
}
