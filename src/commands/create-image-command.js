const commander = require('commander');

const BaseCommand = require('./base-command');
const FileController = require('../file-controller');
const ImageFactory = require('../factories/image-factory');

class CreateImageCommand extends BaseCommand {
  constructor() {
    super();
    this.command = new commander.Command('image');
    this.command
      .argument('<count>', 'number of images to create')
      .action(async (count) => {
        const fileController = new FileController();
        const numImages = parseInt(count);

        // Create images directory.
        fileController.mkdir('./images');

        // Create image(s).
        for (let i=0; i<numImages; i++) {
          const imageBuffer = ImageFactory.createRandomImage();
          fileController.writeFile(`./images/image-${i}.png`, imageBuffer);
        }

        console.log(`Created ${numImages} image${numImages > 1 ? 's' : ''}.`);
      });
  }
}

module.exports = CreateImageCommand;
