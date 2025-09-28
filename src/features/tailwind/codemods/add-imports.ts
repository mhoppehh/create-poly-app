import csstree, { CssNode } from 'css-tree'
import fs from 'fs'
import prettier from 'prettier'

export function addTailwindImport(filePath: string) {

  const cssContent = fs.readFileSync(filePath, 'utf8')

  let ast = csstree.parse(cssContent)

  const tailwindChildNode: CssNode = {
    type: 'String',
    value: 'tailwindcss',
  }

  const tailwindImportNode: csstree.CssNode = {
    type: 'Atrule',
    name: 'import',
    prelude: {
      type: 'AtrulePrelude',
      children: new csstree.List<CssNode>().appendData(tailwindChildNode),
    },
    block: null,
  }

  if (ast.type === 'StyleSheet' && ast.children) {
    ast.children.prependData(tailwindImportNode)
  }

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
