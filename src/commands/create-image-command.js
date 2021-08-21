const commander = require('commander');

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

        
      });
  }
}

module.exports = CreateImageCommand;
