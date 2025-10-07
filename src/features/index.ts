import { projectDir } from './project-dir'
import { vite } from './vite'
import { tailwind } from './tailwind'
import { apolloServer } from './apollo-server'
import type { Feature } from '../types'
import { prisma } from './prisma'
import { graphqlClient } from './graphql-client'
import { developerExperience } from './developer-experience'
import { uiComponentLibrary } from './ui-component-library'

export const FEATURES: Record<string, Feature> = {
  projectDir,
  vite,
  tailwind,
  'apollo-server': apolloServer,
  prisma: prisma,
  'graphql-client': graphqlClient,
  'developer-experience': developerExperience,
  'ui-component-library': uiComponentLibrary,
}
