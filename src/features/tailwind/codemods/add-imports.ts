import { parse, generate, List } from 'css-tree'
import type { CssNode } from 'css-tree'
import fs from 'fs'
import prettier from 'prettier'

export async function addTailwindImport(filePath: string): Promise<void> {
  console.log(`Processing CSS file: ${filePath}`)

  try {
    const cssContent = fs.readFileSync(filePath, 'utf8')
    console.log(`CSS content (first 200 chars): ${cssContent.substring(0, 200)}`)

    const ast = parse(cssContent)
    console.log(`AST parsed successfully: ${ast.type}`)

    const tailwindChildNode: CssNode = {
      type: 'String',
      value: 'tailwindcss',
    }

    const tailwindImportNode: CssNode = {
      type: 'Atrule',
      name: 'import',
      prelude: {
        type: 'AtrulePrelude',
        children: new List<CssNode>().appendData(tailwindChildNode),
      },
      block: null,
    }

    if (ast.type === 'StyleSheet' && ast.children) {
      ast.children.prependData(tailwindImportNode)
    }

    let updatedCssContent = generate(ast)

    try {
      updatedCssContent = await prettier.format(updatedCssContent, {
        parser: 'css',
      })
    } catch (error) {
      console.error('Error formatting CSS with Prettier:', error)
      // Continue with unformatted content if formatting fails
    }

    fs.writeFileSync(filePath, updatedCssContent, 'utf8')

    console.log(`Successfully added '@import "tailwindcss";' to ${filePath}`)
  } catch (error) {
    console.error(`Error in addTailwindImport for ${filePath}:`, error)
    throw error
  }
}
