import csstree, { CssNode } from 'css-tree'
import fs from 'fs'
import { SourceFile } from 'ts-morph'
import prettier from 'prettier'

export function addTailwindImport(sourceFile: SourceFile) {
  const filePath = sourceFile.getFilePath()
  // 1. Read the CSS file
  const cssContent = fs.readFileSync(filePath, 'utf8')

  // 2. Parse the CSS into an AST
  let ast = csstree.parse(cssContent)

  const tailwindChildNode: CssNode = {
    type: 'String',
    value: 'tailwindcss',
  }

  // 3. Create a new @import AST node
  const tailwindImportNode: csstree.CssNode = {
    type: 'Atrule',
    name: 'import',
    prelude: {
      type: 'AtrulePrelude',
      children: new csstree.List<CssNode>().appendData(tailwindChildNode),
    },
    block: null,
  }

  // 4. Insert the new node at the beginning of the stylesheet's children
  // Ensure the AST is a StyleSheet and has a children list
  if (ast.type === 'StyleSheet' && ast.children) {
    ast.children.prependData(tailwindImportNode)
  }

  // 5. Generate CSS from the modified AST
  let updatedCssContent = csstree.generate(ast)

  prettier
    .format(updatedCssContent, {
      parser: 'css',
    })
    .then(formatted => {
      updatedCssContent = formatted

      fs.writeFileSync(filePath, updatedCssContent, 'utf8')

      console.log(`Successfully added '@import "tailwindcss";' to ${filePath}`)
    })
    .catch(() => {
      console.error('Error formatting CSS with Prettier')
    })
}
