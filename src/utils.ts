import * as fs from 'fs/promises'
import path from 'path'
import { getLogger } from './logger'

export async function createFolder(folderPath: string, source: string = 'utils') {
  const logger = getLogger()
  try {
    await fs.mkdir(folderPath, { recursive: true })
    logger.directoryCreated(source, folderPath)
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as any).code === 'EEXIST') {
      logger.info(source, 'Folder already exists: %s', folderPath)
    } else {
      logger.error(source, 'Error creating folder: %s', folderPath, err)
    }
  }
}

export async function createFile(filePath: string, content: string, source: string = 'utils') {
  const logger = getLogger()
  const directory = path.dirname(filePath)

  try {

    await fs.mkdir(directory, { recursive: true })
    await fs.writeFile(filePath, content, { encoding: 'utf8' })
    logger.fileCreated(source, filePath)
  } catch (err) {
    logger.error(source, 'Error creating/writing file: %s', filePath, err)
  }
}
