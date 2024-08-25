import {
  type Canvas,
  type CanvasRenderingContext2D,
  createCanvas
} from 'canvas'

const SQUARE_SIZE: number = 10

export default class BaseMediaFactory {
  /**
   * Randomly gets a hex color code.
   * @returns string hex color code.
   */
  protected static getRandomBW(): string {
    const randomNumber = Math.random()
    if (randomNumber > 0.5) {
      return '#000'
    } else {
      return '#FFF'
    }
  }

  /**
   * Creates a random canvas image frame.
   * @param {Number} width 
   * @param {Number} height 
   * @returns HTML canvas.
   */
  protected static getCanvasFrame(
    width: number,
    height: number
  ): Canvas {
    const canvas: Canvas = createCanvas(width, height)
    const context: CanvasRenderingContext2D = canvas.getContext('2d')
    
    for (let x = 0; x < width; x += SQUARE_SIZE) {
      for (let y = 0; y < height; y += SQUARE_SIZE) {
        context.fillStyle = this.getRandomBW()
        context.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE)
      }
    }
    return canvas
  }
}
