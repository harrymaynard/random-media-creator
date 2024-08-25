export default class BaseMediaFactory {
  /**
   * Randomly gets a hex color code.
   * @returns string hex color code.
   */
  protected static getRandomBW(): string {
    const randomNumber = Math.random()
    if (randomNumber > 0.5) {
      return '#000'
    } else {
      return '#FFF'
    }
  }
}
