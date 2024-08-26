import {
  type PathOrFileDescriptor,
  type WriteFileOptions,
  writeFileSync,
  existsSync,
  readdirSync,
  rmSync,
  rmdirSync,
  mkdirSync
} from 'fs'
import path from 'path'

export default class FileController {
  /**
   * Writes file with specified name and contents.
   * @param {String} fileName 
   * @param {Buffer} content 
   * @param {Object} options 
   */
  public static writeFile(
    fileName: PathOrFileDescriptor,
    content: string | NodeJS.ArrayBufferView,
    options?: WriteFileOptions
  ): void {
    writeFileSync(fileName, content, options)
  }

  /**
   * Remove directory contents and recreate the directory.
   * @param {String} directory 
   */
  public static mkdir(directory: string): void {
    if (existsSync(directory)){
      const directoryContents = readdirSync(directory)

      for (const fileName of directoryContents) {
        rmSync(path.join(directory, fileName))
      }
      rmdirSync(directory)
    }
    mkdirSync(directory)
  }

  /**
   * Remove directory and contents.
   * @param {String} directory 
   */
  public static rmDir(directory: string): void {
    if (existsSync(directory)){
      const directoryContents = readdirSync(directory)

      for (const fileName of directoryContents) {
        rmSync(path.join(directory, fileName))
      }
      rmdirSync(directory)
    }
  }
}
