import {
  type Command,
  InvalidArgumentError
} from 'commander'

export default class BaseCommand {
  protected command: Command

  public getCommand(): Command {
    return this.command
  }

  protected positiveIntParser(value: string): number {
    const intNum: number = parseInt(value)
    const floatNum: number = parseFloat(value)
    
    if (isNaN(intNum) || intNum !== floatNum) {
      throw new InvalidArgumentError('Not an integer.')
    } else if (intNum < 1) {
      throw new InvalidArgumentError('Not a positive integer.')
    }
    return intNum
  }
}
