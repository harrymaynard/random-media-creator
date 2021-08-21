const CommandParser = require('./command-parser');

class Application {
  constructor() {
    const commandParser = new CommandParser();
    commandParser.read(process.argv);
  }
}

module.exports = Application;
