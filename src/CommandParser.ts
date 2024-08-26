import { Command } from 'commander'
import packageJSON from '../package.json'
import GIFCommand from '@/commands/GIFCommand'
import MP4Command from '@/commands/MP4Command'
import PNGCommand from '@/commands/PNGCommand'
import VersionCommand from '@/commands/VersionCommand'

export default class CommandParser {
  private program: Command

  constructor() {
    this.program = new Command()
    this.program.version(packageJSON.version)

    this.program.addCommand(new GIFCommand().getCommand())
    this.program.addCommand(new MP4Command().getCommand())
    this.program.addCommand(new PNGCommand().getCommand())
    this.program.addCommand(new VersionCommand().getCommand())
  }

  public read(args: Array<string>): void {
    this.program.parse(args)
  }
}
