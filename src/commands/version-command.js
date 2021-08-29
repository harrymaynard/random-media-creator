const commander = require('commander');

const packageJSON = require('../../package.json');

class VersionCommand {
  constructor() {
    this.command = new commander.Command('version');
    this.command
      .action((count) => {
        console.log(packageJSON.version);
      });
  }
}

module.exports = VersionCommand;
