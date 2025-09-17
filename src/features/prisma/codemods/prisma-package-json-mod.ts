import * as fs from 'fs'
import * as fsp from 'fs/promises'
import * as path from 'path'

export async function modPackageJsonPrisma(filePath: string): Promise<void> {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    await fsp.mkdir(dir, { recursive: true })
  }

  let pkg: any = {}
  if (fs.existsSync(filePath)) {
    try {
      const src = await fsp.readFile(filePath, 'utf8')
      pkg = src.trim() ? JSON.parse(src) : {}
    } catch (err) {
      throw new Error(`Failed to read or parse ${filePath}: ${String(err)}`)
    }
  }

  pkg.scripts = pkg.scripts || {}
  pkg.scripts['prisma:generate'] = 'prisma generate'
  pkg.scripts['prisma:push'] = 'prisma db push'
  pkg.scripts['prisma:migrate'] = 'prisma migrate dev'
  pkg.scripts['prisma:deploy'] = 'prisma migrate deploy'
  pkg.scripts['prisma:reset'] = 'prisma migrate reset'
  pkg.scripts['prisma:seed'] = 'tsx prisma/seed.ts'
  pkg.scripts['prisma:studio'] = 'prisma studio'

  await fsp.writeFile(filePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
}
