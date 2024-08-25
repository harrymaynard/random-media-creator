import CommandParser from './CommandParser'

export default class Application {
  constructor() {
    const commandParser = new CommandParser()
    commandParser.read(process.argv)
  }
}
