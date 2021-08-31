const commander = require('commander');

const BaseCommand = require('./base-command');
const FileController = require('../file-controller');
const ImageFactory = require('../factories/image-factory');

const DEFAULT_IMAGE_WIDTH = 640;
const DEFAULT_IMAGE_HEIGHT = 480;

class GIFCommand extends BaseCommand {
  constructor() {
    super();
    this.command = new commander.Command('gif');
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

        if (isNaN(width)) {
          console.error('\'width\' option must be numeric.');
          return;
        }
        if (isNaN(height)) {
          console.error('\'height\' option must be numeric.');
          return;
        }

        // Create images directory.
        fileController.mkdir('./images');

        // Create image(s).
        for (let i=0; i<numImages; i++) {
          const filePath = `./images/image-${i}.gif`;
          const imageBuffer = ImageFactory.createGIF(width, height);
          fileController.writeFile(filePath, imageBuffer);
          console.log(`Created GIF at: ${filePath}`);
        }

        console.log(`Created ${numImages} GIF${numImages > 1 ? 's' : ''}.`);
      });
  }
}

module.exports = GIFCommand;
