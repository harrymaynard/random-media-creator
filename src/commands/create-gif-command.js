const commander = require('commander');

const BaseCommand = require('./base-command');
const FileController = require('../file-controller');
const GifFactory = require('../factories/gif-factory');

class CreateGifCommand extends BaseCommand {
  constructor() {
    super();
    this.command = new commander.Command('gif');
    this.command
      .argument('<count>', 'number of images to create')
      .action(async (count) => {
        const fileController = new FileController();
        const numImages = parseInt(count);

        // Create images directory.
        fileController.mkdir('./images');

        // Create image(s).
        for (let i=0; i<numImages; i++) {
          const imageBuffer = GifFactory.createRandomGif();
          fileController.writeFile(`./images/image-${i}.gif`, imageBuffer);
        }

        console.log(`Created ${numImages} GIF${numImages > 1 ? 's' : ''}.`);
      });
  }
}

module.exports = CreateGifCommand;
