import { type Command } from 'commander'

export default class BaseCommand {
  protected command: Command

  public getCommand(): Command {
    return this.command
  }
}
