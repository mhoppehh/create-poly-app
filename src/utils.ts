import * as fs from 'fs/promises'
import path from 'path'

export async function createFolder(folderPath: string) {
  try {
    await fs.mkdir(folderPath, { recursive: true })
    console.log(`Folder '${folderPath}' created successfully.`)
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as any).code === 'EEXIST') {
      console.log(`Folder '${folderPath}' already exists.`)
    } else {
      console.error(`Error creating folder '${folderPath}':`, err)
    }
  }
}

export async function createFile(filePath: string, content: string) {
  const directory = path.dirname(filePath) // Get the directory path from the file path

  try {
    // Ensure the directory exists before writing the file
    await fs.mkdir(directory, { recursive: true })
    await fs.writeFile(filePath, content, { encoding: 'utf8' })
    console.log(`File '${filePath}' created/written successfully.`)
  } catch (err) {
    console.error(`Error creating/writing file '${filePath}':`, err)
  }
}
