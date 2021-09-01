const commander = require('commander');

const BaseCommand = require('./base-command');
const FileController = require('../file-controller');
const ImageFactory = require('../factories/image-factory');

const DEFAULT_IMAGE_WIDTH = 640;
const DEFAULT_IMAGE_HEIGHT = 480;
const DEFAULT_FPS = 30;
const DEFAULT_DURATION = 2;
const DIRECTORY_PATH = './rmc-images';

class GIFCommand extends BaseCommand {
  constructor() {
    super();
    this.command = new commander.Command('gif');
    this.command
      .argument('<count>', 'number of images to create')
      .option('-w, --width <width>', 'width of the GIF', `${DEFAULT_IMAGE_WIDTH}`)
      .option('-h, --height <height>', 'height of the GIF', `${DEFAULT_IMAGE_HEIGHT}`)
      .option('-fps, --fps <fps>', 'frames per second of the GIF', `${DEFAULT_FPS}`)
      .option('-d, --duration <duration>', 'duration of the GIF in seconds', `${DEFAULT_DURATION}`)
      .action(async (count) => {
        const fileController = new FileController();
        const numImages = parseInt(count);
        const options = this.command.opts();
        const width = parseInt(options.width);
        const height = parseInt(options.height);
        const fps = parseInt(options.fps);
        const duration = parseInt(options.duration);

        // Check for non-numeric options.
        if (isNaN(width)) {
          console.error('\'width\' option must be numeric.');
          return;
        }
        if (isNaN(height)) {
          console.error('\'height\' option must be numeric.');
          return;
        }
        if (isNaN(fps)) {
          console.error('\'fps\' option must be numeric.');
          return;
        }
        if (isNaN(duration)) {
          console.error('\'duration\' option must be numeric.');
          return;
        }

        // Create images directory.
        fileController.mkdir(DIRECTORY_PATH);

        // Create image(s).
        for (let i=0; i<numImages; i++) {
          const filePath = `${DIRECTORY_PATH}/image-${i}.gif`;
          const imageBuffer = ImageFactory.createGIF(width, height, fps, duration);
          fileController.writeFile(filePath, imageBuffer);
          console.log(`Created GIF at: ${filePath}`);
        }

        console.log(`Created ${numImages} GIF${numImages > 1 ? 's' : ''}.`);
      });
  }
}

module.exports = GIFCommand;
