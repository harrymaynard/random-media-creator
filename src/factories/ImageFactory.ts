import {
  type Canvas,
  type CanvasRenderingContext2D
} from 'canvas'
import GIFEncoder from 'gifencoder'
import BaseMediaFactory from '@/factories/BaseMediaFactory'

class ImageFactory extends BaseMediaFactory {
  /**
   * Creates a random PNG image.
   * @param {Number} width 
   * @param {Number} height 
   * @returns image Buffer.
   */
  public static createPNG(
    width: number,
    height: number
  ): Buffer {
    const canvas: Canvas = this.getCanvasFrame(width, height)
    return canvas.toBuffer('image/png')
  }

  /**
   * Creates a random animated GIF image.
   * @param {Number} width 
   * @param {Number} height 
   * @param {Number} fps 
   * @param {Number} duration 
   * @returns image Buffer.
   */
  public static createGIF(
    width: number,
    height: number,
    fps: number,
    duration: number
  ): Buffer {
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

    // Return data Buffer.
    return encoder.out.getData()
  }
}

export default ImageFactory
