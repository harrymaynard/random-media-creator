import {
  type Canvas,
  type CanvasRenderingContext2D
} from 'canvas'
import FfmpegCommand from 'fluent-ffmpeg'
import BaseMediaFactory from '@/factories/BaseMediaFactory'

class VideoFactory extends BaseMediaFactory {
  /**
   * Creates a random MP4 video.
   * @param {Number} width
   * @param {Number} height
   * @param {Number} fps
   * @param {Number} duration
   * @returns video Buffer.
   */
  public static async createMP4(
    width: number,
    height: number,
    fps: number,
    duration: number
  ): Buffer {
    const ffmpeg = new FfmpegCommand()
    await new Promise((resolve, reject) => {
      ffmpeg()
  
        // Tell FFmpeg to stitch all images together in the provided directory
        .input(framesFilepath)
        .inputOptions([
          // Set input frame rate
          `-framerate ${frameRate}`,
        ])
  
        // Add the soundtrack
        .input(soundtrackFilePath)
        .audioFilters([
          // Fade out the volume 2 seconds before the end
          `afade=out:st=${duration - 2}:d=2`,
        ])
  
        .videoCodec('libx264')
        .outputOptions([
          // YUV color space with 4:2:0 chroma subsampling for maximum compatibility with
          // video players
          '-pix_fmt yuv420p',
        ])
  
        // Set the output duration. It is required because FFmpeg would otherwise
        // automatically set the duration to the longest input, and the soundtrack might
        // be longer than the desired video length
        .duration(duration)
        // Set output frame rate
        .fps(frameRate)
  
        // Resolve or reject (throw an error) the Promise once FFmpeg completes
        .saveToFile(outputFilepath)
        .on('end', () => resolve())
        .on('error', (error) => reject(new Error(error)))
    })
  }
}

export default VideoFactory
