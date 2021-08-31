const commander = require('commander');

const package = require('../package.json');
const GIFCommand = require('./commands/gif-command');
const PNGCommand = require('./commands/png-command');
const VersionCommand = require('./commands/version-command');

const program = new commander.Command();
program.version(package.version);

class CommandParser {
  constructor() {
    program.addCommand(new GIFCommand().command);
    program.addCommand(new PNGCommand().command);
    program.addCommand(new VersionCommand().command);
  }

  read(args) {
    program.parse(args);
  }
};

module.exports = CommandParser;
