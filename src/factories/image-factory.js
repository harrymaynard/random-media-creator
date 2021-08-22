const { createCanvas } = require('canvas');

const BaseMediaFactory = require('./base-media-factory');

class ImageFactory extends BaseMediaFactory {
  createRandomImage() {
    const width = 640;
    const height = 480;
    const squareSize = 10;

    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    
    for (let x=0; x<width; x+=squareSize) {
      for (let y=0; y<height; y+=squareSize) {
        context.fillStyle = this.getRandomBW();
        context.fillRect(x, y, squareSize, squareSize);
      }
    }
    return canvas.toBuffer('image/png');
  }
};

module.exports = new ImageFactory();
