import { Command } from 'commander'
import packageJSON from '../../package.json'
import BaseCommand from '@/commands/BaseCommand'

export default class VersionCommand extends BaseCommand {
  constructor() {
    super()
    this.command = new Command('version')
    this.command
      .action((count) => {
        console.log(packageJSON.version)
      })
  }
}
