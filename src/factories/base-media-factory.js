class BaseMediaFactory {
  getRandomBW() {
    const randomNumber = Math.random();
    if (randomNumber > 0.5) {
      return '#000';
    } else {
      return '#FFF';
    }
  }
}

module.exports = BaseMediaFactory;
