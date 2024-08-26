import { Command, type OptionValues } from 'commander'
import BaseCommand from '@/commands/BaseCommand'
import FileController from '@/FileController'
import ImageFactory from '@/factories/ImageFactory'

const DEFAULT_IMAGE_WIDTH: number = 640
const DEFAULT_IMAGE_HEIGHT: number = 480
const OUTPUT_DIRECTORY: string = './rmc-output'

export default class PNGCommand extends BaseCommand {
  constructor() {
    super()
    this.command = new Command('png')
    this.command
      .argument('<count>', 'number of images to create', this.positiveIntParser)
      .option('-w, --width <width>', 'width of the PNG', this.positiveIntParser, DEFAULT_IMAGE_WIDTH)
      .option('-h, --height <height>', 'height of the PNG', this.positiveIntParser, DEFAULT_IMAGE_HEIGHT)
      .action(async (numImages) => {
        const options: OptionValues = this.command.opts()
        const { width, height } = options

        // Create images directory.
        FileController.mkdir(OUTPUT_DIRECTORY)

        // Create image(s).
        for (let i = 0; i < numImages; i++) {
          const filePath = `${OUTPUT_DIRECTORY}/image-${i}.png`
          ImageFactory.createPNG(filePath, width, height)
          console.log(`Created PNG at: ${filePath}`)
        }

        console.log(`Created ${numImages} PNG file${numImages > 1 ? 's' : ''}.`)
      })
  }
}
