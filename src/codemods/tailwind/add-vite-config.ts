import {
  CallExpression,
  ObjectLiteralExpression,
  ArrayLiteralExpression,
  PropertyAssignment,
  SyntaxKind,
  Node,
  SourceFile,
} from 'ts-morph'

export function addViteConfig(sourceFile: SourceFile): void {
  const importModule = '@tailwindcss/vite'
  const importName = 'tailwindcss'

  const existing = sourceFile.getImportDeclarations().find(d => d.getModuleSpecifierValue() === importModule)
  if (!existing) {
    sourceFile.addImportDeclaration({ defaultImport: importName, moduleSpecifier: importModule })
  } else if (!existing.getDefaultImport()) {
    existing.setDefaultImport(importName)
  }

  const exportAssignments = sourceFile.getExportAssignments()
  for (const assignment of exportAssignments) {
    const expr = assignment.getExpression()
    if (!expr) continue
    if (!Node.isCallExpression(expr)) continue
    const call = expr as CallExpression
    const callee = call.getExpression()
    if (callee.getText() !== 'defineConfig') continue

    const args = call.getArguments()
    if (args.length === 0) continue
    const first = args[0]
    if (!Node.isObjectLiteralExpression(first)) continue
    const obj = first as ObjectLiteralExpression

    let pluginsProp = obj.getProperty('plugins') as PropertyAssignment | undefined
    if (!pluginsProp) {
      pluginsProp = obj.addPropertyAssignment({ name: 'plugins', initializer: '[]' }) as PropertyAssignment
    }

    let initializer = pluginsProp.getInitializer()
    let arr: ArrayLiteralExpression | undefined = undefined
    if (initializer && initializer.getKind() === SyntaxKind.ArrayLiteralExpression) {
      arr = initializer as ArrayLiteralExpression
    } else {
      pluginsProp.setInitializer('[]')
      initializer = pluginsProp.getInitializer()
      if (initializer && initializer.getKind() === SyntaxKind.ArrayLiteralExpression) {
        arr = initializer as ArrayLiteralExpression
      }
    }

    if (!arr) continue

    const already = arr
      .getElements()
      .some(el => el.getText().includes(`${importName}(`) || el.getText().includes(`${importName}`))
    if (!already) {
      arr.addElement(`${importName}()`)
    }

    break
  }
}
