import {
  addMobileToWorkspace,
  modifyRootPackageJsonForMobile,
  addExpoScripts,
  addReactNativeScripts,
} from './codemods/example-mobile-codemod'
import type { Feature } from '../../types'
import { ActivationConditions, ActivationRules } from '../../forms/feature-selector'

export const mobile: Feature = {
  id: 'mobile',
  description:
    'React Native mobile application development with shared components, navigation, and cross-platform capabilities',
  name: 'Mobile App Support',
  dependsOn: ['apollo-server'],
  activatedBy: ActivationConditions.includesValue('projectWorkspaces', 'mobile-app'),
  stages: [
    {
      name: 'create-expo-app',
      activatedBy: ActivationConditions.equals('mobileFramework', 'expo'),
      scripts: [
        { src: 'npx create-expo-app@latest mobile --template blank-typescript', dir: '.' },
        { src: 'pnpm install', dir: 'mobile' },
      ],
      templates: [
        {
          source: 'src/features/mobile/templates/expo-config',
          destination: 'mobile',
          context: {
            appName: '{{mobileAppName}}',
            bundleId: '{{bundleId}}',
          },
        },
      ],
      mods: {
        'pnpm-workspace.yaml': [addMobileToWorkspace],
        'package.json': [addExpoScripts],
      },
    },
    {
      name: 'create-react-native-app',
      activatedBy: ActivationConditions.equals('mobileFramework', 'react-native-cli'),
      scripts: [
        { src: 'npx react-native@latest init {{mobileAppName}} --directory mobile --skip-install', dir: '.' },
        { src: 'pnpm install', dir: 'mobile' },
        { src: 'pnpm install -D @types/react @types/react-native', dir: 'mobile' },
      ],
      templates: [
        {
          source: 'src/features/mobile/templates/react-native-config',
          destination: 'mobile',
          context: {
            appName: '{{mobileAppName}}',
            bundleId: '{{bundleId}}',
          },
        },
      ],
      mods: {
        'pnpm-workspace.yaml': [addMobileToWorkspace],
        'package.json': [addReactNativeScripts],
      },
    },
    {
      name: 'setup-navigation',
      activatedBy: ActivationConditions.equals('mobileNavigation', 'react-navigation'),
      scripts: [
        {
          src: 'pnpm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs',
          dir: 'mobile',
        },
        { src: 'pnpm install react-native-screens react-native-safe-area-context', dir: 'mobile' },
      ],
      templates: [
        {
          source: 'src/features/mobile/templates/navigation/react-navigation',
          destination: 'mobile/src',
          context: {
            navigationType: 'react-navigation',
          },
        },
      ],
    },
    {
      name: 'setup-wix-navigation',
      activatedBy: ActivationConditions.equals('mobileNavigation', 'react-native-navigation'),
      scripts: [
        { src: 'pnpm install react-native-navigation', dir: 'mobile' },
        { src: 'npx react-native-navigation install', dir: 'mobile' },
      ],
      templates: [
        {
          source: 'src/features/mobile/templates/navigation/wix-navigation',
          destination: 'mobile/src',
          context: {
            navigationType: 'react-native-navigation',
          },
        },
      ],
    },
    {
      name: 'setup-native-modules',
      activatedBy: ActivationConditions.equals('enableNativeModules', true),
      scripts: [
        { src: 'pnpm install @react-native-async-storage/async-storage react-native-vector-icons', dir: 'mobile' },
        { src: 'pnpm install react-native-permissions @react-native-camera/camera', dir: 'mobile' },
        { src: 'pnpm install @react-native-community/geolocation react-native-push-notification', dir: 'mobile' },
      ],
      templates: [
        {
          source: 'src/features/mobile/templates/native-modules',
          destination: 'mobile/src',
          context: {
            hasNativeModules: true,
          },
        },
      ],
    },
    {
      name: 'setup-shared-components',
      templates: [
        {
          source: 'src/features/mobile/templates/shared-components',
          destination: 'mobile/src/components',
          context: {
            appName: '{{mobileAppName}}',
          },
        },
      ],
    },
  ],
}
