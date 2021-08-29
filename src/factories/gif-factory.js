const { createCanvas } = require('canvas');
const GIFEncoder = require('gifencoder');

const BaseMediaFactory = require('./base-media-factory');

class GifFactory extends BaseMediaFactory {
  createRandomGif() {
    const width = 640;
    const height = 480;

    const encoder = new GIFEncoder(width, height);

    encoder.start();
    encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
    encoder.setDelay(250);  // frame delay in ms
    encoder.setQuality(10); // image quality. 10 is default.
    
    encoder.addFrame(this.getFrame(width, height));
    encoder.addFrame(this.getFrame(width, height));

    encoder.finish();

    return encoder.out.getData();
  }

  getFrame(width, height) {
    const squareSize = 10;
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    
    for (let x=0; x<width; x+=squareSize) {
      for (let y=0; y<height; y+=squareSize) {
        context.fillStyle = this.getRandomBW();
        context.fillRect(x, y, squareSize, squareSize);
      }
    }

    return context;
  }
};

module.exports = new GifFactory();
