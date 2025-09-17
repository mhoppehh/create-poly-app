import { projectDir } from './project-dir'
import { vite } from './vite'
import { tailwind } from './tailwind'
import { apolloServer } from './apollo-server'
import type { Feature } from '../types'
import { prisma } from './prisma'

export const FEATURES: Record<string, Feature> = {
  projectDir,
  vite,
  tailwind,
  'apollo-server': apolloServer,
  prisma: prisma,
}
