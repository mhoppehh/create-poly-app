import * as fs from 'fs'
import * as fsp from 'fs/promises'
import * as path from 'path'
import { SourceFile } from 'ts-morph'

export async function modPackageJsonApolloServer(sourceFile: SourceFile): Promise<void> {
  const filePath = sourceFile.getFilePath()

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

  pkg.type = 'module'
  pkg.scripts = pkg.scripts || {}
  pkg.scripts.compile = 'tsc'
  pkg.scripts.build = 'tsc -b tsconfig.build.json'
  pkg.scripts.dev = 'tsx watch --include "./src/**/*" ./src/index.ts'

  await fsp.writeFile(filePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
}
