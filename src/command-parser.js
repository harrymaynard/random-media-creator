const commander = require('commander');

const package = require('../package.json');
const CreateImageCommand = require('./commands/create-image-command');

const program = new commander.Command();
program.version(package.version);

class CommandParser {
  constructor() {
    program.addCommand(new CreateImageCommand().command);
  }

  read(args) {
    program.parse(args);
  }
};

module.exports = CommandParser;
