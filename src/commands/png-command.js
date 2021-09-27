const commander = require('commander');

const BaseCommand = require('./base-command');
const FileController = require('../file-controller');
const ImageFactory = require('../factories/image-factory');

const DEFAULT_IMAGE_WIDTH = 640;
const DEFAULT_IMAGE_HEIGHT = 480;
const DIRECTORY_PATH = './rmc-images';

class PNGCommand extends BaseCommand {
  constructor() {
    super();
    this.command = new commander.Command('png');
    this.command
      .argument('<count>', 'number of images to create')
      .option('-w, --width <width>', 'width of the GIF', `${DEFAULT_IMAGE_WIDTH}`)
      .option('-h, --height <height>', 'height of the GIF', `${DEFAULT_IMAGE_HEIGHT}`)
      .action(async (count) => {
        const fileController = new FileController();
        const numImages = parseInt(count);
        const options = this.command.opts();
        const width = parseInt(options.width);
        const height = parseInt(options.height);

        // Check for non-numeric options.
        if (isNaN(width)) {
          console.error('\'width\' option must be numeric.');
          return;
        }
        if (isNaN(height)) {
          console.error('\'height\' option must be numeric.');
          return;
        }

        // Create images directory.
        fileController.mkdir(DIRECTORY_PATH);

        // Create image(s).
        for (let i = 0; i < numImages; i++) {
          const filePath = `${DIRECTORY_PATH}/image-${i}.png`;
          const imageBuffer = ImageFactory.createPNG(width, height);
          fileController.writeFile(filePath, imageBuffer);
          console.log(`Created PNG at: ${filePath}`);
        }

        console.log(`Created ${numImages} image${numImages > 1 ? 's' : ''}.`);
      });
  }
}

module.exports = PNGCommand;
