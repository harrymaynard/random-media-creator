const { createCanvas } = require('canvas');
const GIFEncoder = require('gifencoder');

const BaseMediaFactory = require('./base-media-factory');

const SQUARE_SIZE = 10;
const FRAMES_PER_SECOND = 30;
const DURATION = 2; // Seconds.

class ImageFactory extends BaseMediaFactory {
  createPNG(width, height) {
    const canvas = this._getCanvasFrame(width, height);
    return canvas.toBuffer('image/png');
  }

  createGIF(width, height) {
    const encoder = new GIFEncoder(width, height);

    encoder.start();
    encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat.
    encoder.setDelay(Math.ceil(1000 / FRAMES_PER_SECOND)); // frame delay in ms.
    encoder.setQuality(10); // image quality. 10 is default.
    
    // Add frames.
    for (let i = 0; i < DURATION * FRAMES_PER_SECOND; i++) {
      const canvas = this._getCanvasFrame(width, height);
      const context = canvas.getContext('2d');
      encoder.addFrame(context);
    }

    // Finalize encoding.
    encoder.finish();

    // Return data Buffer.
    return encoder.out.getData();
  }

  _getCanvasFrame(width, height) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    
    for (let x = 0; x < width; x += SQUARE_SIZE) {
      for (let y = 0; y < height; y += SQUARE_SIZE) {
        context.fillStyle = this.getRandomBW();
        context.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
      }
    }
    return canvas;
  }
};

module.exports = new ImageFactory();
