import { Command, type OptionValues } from 'commander'
import BaseCommand from '@/commands/BaseCommand'
import FileController from '@/FileController'
import VideoFactory from '@/factories/VideoFactory'

const DEFAULT_IMAGE_WIDTH: number = 640
const DEFAULT_IMAGE_HEIGHT: number = 480
const DEFAULT_FPS: number = 30
const DEFAULT_DURATION: number = 2 // In seconds.
const OUTPUT_DIRECTORY: string = './rmc-output'

export default class GIFCommand extends BaseCommand {
  constructor() {
    super()
    this.command = new Command('mp4')
    this.command
      .argument('<count>', 'number of images to create', this.positiveIntParser)
      .option('-w, --width <width>', 'width of the MP4', this.positiveIntParser, DEFAULT_IMAGE_WIDTH)
      .option('-h, --height <height>', 'height of the MP4', this.positiveIntParser, DEFAULT_IMAGE_HEIGHT)
      .option('-fps, --fps <fps>', 'frames per second of the MP4', this.positiveIntParser, DEFAULT_FPS)
      .option('-d, --duration <duration>', 'duration of the MP4 in seconds', this.positiveIntParser, DEFAULT_DURATION)
      .action(async (numImages) => {
        const options: OptionValues = this.command.opts()
        const { width, height, fps, duration } = options

        // Create images directory.
        FileController.mkdir(OUTPUT_DIRECTORY)

        // Create image(s).
        for (let i=0; i<numImages; i++) {
          const filePath = `${OUTPUT_DIRECTORY}/video-${i}.mp4`
          await VideoFactory.createMP4(filePath, width, height, fps, duration)
          console.log(`Created MP4 at: ${filePath}`)
        }

        console.log(`Created ${numImages} MP4 file${numImages > 1 ? 's' : ''}.`)
      })
  }
}
