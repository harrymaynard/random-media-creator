import { Command } from 'commander'
import packageJSON from '../package.json'
import GIFCommand from './commands/GIFCommand'
import PNGCommand from './commands/PNGCommand'
import VersionCommand from './commands/VersionCommand'

const program: Command = new Command()
program.version(packageJSON.version)

export default class CommandParser {
  constructor() {
    program.addCommand(new GIFCommand().command)
    program.addCommand(new PNGCommand().command)
    program.addCommand(new VersionCommand().command)
  }

  read(args): void {
    program.parse(args)
  }
}
