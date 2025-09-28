import { projectDir } from './project-dir'
import { vite } from './vite'
import { tailwind } from './tailwind'
import { apolloServer } from './apollo-server'
import type { Feature } from '../types'
import { prisma } from './prisma'
import { graphqlClient } from './graphql-client'
import { developerExperience } from './developer-experience'
import { mobile } from './mobile'

export const FEATURES: Record<string, Feature> = {
  projectDir,
  vite,
  mobile: mobile,
  tailwind,
  'apollo-server': apolloServer,
  prisma: prisma,
  'graphql-client': graphqlClient,
  'developer-experience': developerExperience,
}
