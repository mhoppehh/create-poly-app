import * as fs from 'fs'
import { SourceFile } from 'ts-morph'
import { parse, stringify } from 'yaml'

export function addApiToPnpmWorkspace(sourceFile: SourceFile): void {
  const filePath = sourceFile.getFilePath()

  const file = fs.readFileSync(filePath, 'utf8')

  const data = parse(file) as any
  if (!data.packages) {
    data.packages = []
  }
  if (!data.packages.includes('api')) {
    data.packages.push('api')
    const newFile = stringify(data)
    fs.writeFileSync(filePath, newFile, 'utf8')
    console.log(`Added 'api' to packages in ${filePath}`)
  } else {
    console.log(`'api' already exists in packages in ${filePath}`)
  }
}
