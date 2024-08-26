import { type Canvas } from 'canvas'
import FfmpegCommand from 'fluent-ffmpeg'
import { path as ffmpegPath} from '@ffmpeg-installer/ffmpeg'
import BaseMediaFactory from '@/factories/BaseMediaFactory'
import FileController from '@/FileController'

const TEMP_FRAMES_DIR: string = './rmc-temp'

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
    filePath: string,
    width: number,
    height: number,
    fps: number,
    duration: number
  ): Promise<void> {

    // Create temporary frames directory.
    FileController.mkdir(TEMP_FRAMES_DIR)

    // Create temporary directory for frames, and create them.
    for (let i = 0; i < duration * fps; i++) {
      const frameFilePath: string = `${TEMP_FRAMES_DIR}/frame-${i}.png`
      const canvas: Canvas = this.getCanvasFrame(width, height)
      const imageBuffer: Buffer = canvas.toBuffer('image/png')
      FileController.writeFile(frameFilePath, imageBuffer)
    }
    
    // Create video from frames using FFMPEG.
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = new FfmpegCommand()
      ffmpeg.setFfmpegPath(ffmpegPath)
      ffmpeg
        .input(`${TEMP_FRAMES_DIR}/frame-%d.png`)
        //.input(`${FRAMES_DIR_PATH}/`)
        .inputOptions([
          // Set input frame rate
          `-framerate ${fps}`,
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
        .fps(fps)
  
        // Resolve or reject (throw an error) the Promise once FFmpeg completes
        .saveToFile(filePath)
        .on('end', () => resolve())
        .on('error', (error) => reject(new Error(error)))
    })

    // Remove temporary frames directory.
    FileController.rmDir(TEMP_FRAMES_DIR)
  }
}

export default VideoFactory
