const commander = require('commander');

const package = require('../package.json');
const CreateGifCommand = require('./commands/create-gif-command');
const CreateImageCommand = require('./commands/create-image-command');
const VersionCommand = require('./commands/version-command');

const program = new commander.Command();
program.version(package.version);

class CommandParser {
  constructor() {
    program.addCommand(new CreateGifCommand().command);
    program.addCommand(new CreateImageCommand().command);
    program.addCommand(new VersionCommand().command);
  }

  read(args) {
    program.parse(args);
  }
};

module.exports = CommandParser;
