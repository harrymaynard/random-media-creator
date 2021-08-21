const commander = require('commander');
const { createCanvas } = require('canvas');

const BaseCommand = require('./base-command');
const FileController = require('../file-controller');

class CreateImageCommand extends BaseCommand {
  constructor() {
    super();
    this.command = new commander.Command('image');
    this.command
      .argument('<count>', 'number of images to create')
      .action(async (count) => {
        const fileController = new FileController();
        fileController.mkdir('./images');

        console.log(`Creating ${count} images`);

        const width = 640;
        const height = 480;

        const canvas = createCanvas(width, height);
        const context = canvas.getContext('2d');

        context.fillStyle = '#F00';
        context.fillRect(0, 0, width, height);

        const buffer = canvas.toBuffer('image/png');
        fileController.writeFile('./images/my-image.png', buffer);
      });
  }
}

module.exports = CreateImageCommand;
