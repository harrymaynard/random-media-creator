import {
  type Canvas,
  type CanvasRenderingContext2D
} from 'canvas'
import GIFEncoder from 'gifencoder'
import BaseMediaFactory from '@/factories/BaseMediaFactory'
import FileController from '@/FileController'

class ImageFactory extends BaseMediaFactory {
  /**
   * Creates a random PNG image.
   * @param {String} filePath
   * @param {Number} width 
   * @param {Number} height 
   * @returns image Buffer.
   */
  public static createPNG(
    filePath: string,
    width: number,
    height: number
  ): void {
    const canvas: Canvas = this.getCanvasFrame(width, height)
    const imageBuffer: Buffer = canvas.toBuffer('image/png')
    FileController.writeFile(filePath, imageBuffer)
  }

  /**
   * Creates a random animated GIF image.
   * @param {String} filePath
   * @param {Number} width 
   * @param {Number} height 
   * @param {Number} fps 
   * @param {Number} duration 
   * @returns image Buffer.
   */
  public static createGIF(
    filePath: string,
    width: number,
    height: number,
    fps: number,
    duration: number
  ): void {
    const encoder = new GIFEncoder(width, height)

    encoder.start()
    encoder.setRepeat(0) // 0 for repeat, -1 for no-repeat.
    encoder.setDelay(Math.ceil(1000 / fps)) // frame delay in ms.
    encoder.setQuality(10) // image quality (on a scale of 1 to 10).
    
    // Add frames.
    for (let i = 0; i < duration * fps; i++) {
      const canvas: Canvas = this.getCanvasFrame(width, height)
      const context: CanvasRenderingContext2D = canvas.getContext('2d')
      encoder.addFrame(context)
    }

    // Finalize encoding.
    encoder.finish()

    // Write data Buffer to file.
    const imageBuffer: Buffer = encoder.out.getData()
    FileController.writeFile(filePath, imageBuffer)
  }
}

export default ImageFactory
