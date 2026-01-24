/*
  GIFEncoder.js

  Authors
  Kevin Weiner (original Java version - kweiner@fmsware.com)
  Thibault Imbert (AS3 version - bytearray.org)
  Johan Nordberg (JS version - code@johan-nordberg.com)
  Eugene Ware (node.js streaming version - eugene@noblesmaurai.com)
*/

import stream from 'stream'
import NeuQuant from './TypedNeuQuant'
import LZWEncoder from './LZWEncoder'
import ByteArray from './ByteArray'

class GIFEncoder {
  private width: number
  private height: number
  private transparent: any
  private transIndex: number
  private repeat: number
  private delay: number
  private image: any
  private pixels: any
  private indexedPixels: any
  private colorDepth: any
  private colorTab: any
  private usedEntry: any
  private palSize: number
  private dispose: number
  private firstFrame: boolean
  private sample: number
  private started: boolean
  private readStreams: any[]
  public out: ByteArray

  constructor(width: number, height: number) {
    // image size
    this.width = ~~width
    this.height = ~~height

    // transparent color if given
    this.transparent = null

    // transparent index in color table
    this.transIndex = 0

    // -1 = no repeat, 0 = forever. anything else is repeat count
    this.repeat = -1

    // frame delay (hundredths)
    this.delay = 0

    this.image = null // current frame
    this.pixels = null // BGR byte array from frame
    this.indexedPixels = null // converted frame indexed to palette
    this.colorDepth = null // number of bit planes
    this.colorTab = null // RGB palette
    this.usedEntry = new Array() // active palette entries
    this.palSize = 7 // color table size (bits-1)
    this.dispose = -1 // disposal code (-1 = use default)
    this.firstFrame = true
    this.sample = 10 // default sample interval for quantizer

    this.started = false // started encoding

    this.readStreams = []

    this.out = new ByteArray()
  }


  public createReadStream(rs: stream.Readable | null = null): stream.Readable {
    if (!rs) {
      rs = new stream.Readable()
      rs._read = function () {}
    }
    this.readStreams.push(rs)
    return rs
  }

  public createWriteStream(options: any = null): stream.Duplex {
    if (options) {
      Object.keys(options).forEach((option) => {
        const fn: string = 'set' + option[0].toUpperCase() + option.substr(1)
        if (~['setDelay', 'setFrameRate', 'setDispose', 'setRepeat',
            'setTransparent', 'setQuality'].indexOf(fn)) {
          this[fn].call(this, options[option])
        }
      });
    }

    const ws = new stream.Duplex({ objectMode: true });
    ws._read = function () {}
    this.createReadStream(ws)

      
    ws._write = (data, enc, next) => {
      if (!this.started) this.start()
      this.addFrame(data)
      next()
    }
    const end = ws.end

    // @ts-expect-error
    ws.end = () => {
      end.apply(ws, [].slice.call(arguments))
      this.finish()
    }
    return ws
  }

  public emit() {
    if (this.readStreams.length === 0) return
    if (this.out.data.length) {
      this.readStreams.forEach((rs) => {
        rs.push(Buffer.from(this.out.data))
      })
      this.out.data = []
    }
  }

  public end() {
    if (this.readStreams.length === null) return
    this.emit()
    this.readStreams.forEach((rs) => {
      rs.push(null)
    })
    this.readStreams = []
  }

  /**
    Sets the delay time between each frame, or changes it for subsequent frames
    (applies to the next frame added)
  */
  public setDelay(milliseconds: number) {
    this.delay = Math.round(milliseconds / 10)
  }

  /**
    Sets frame rate in frames per second.
  */
  public setFrameRate(fps: number) {
    this.delay = Math.round(100 / fps)
  }

  /**
    Sets the GIF frame disposal code for the last added frame and any
    subsequent frames.

    Default is 0 if no transparent color has been set, otherwise 2.
  */
  public setDispose(disposalCode: number) {
    if (disposalCode >= 0) this.dispose = disposalCode
  }

  /**
    Sets the number of times the set of GIF frames should be played.

    -1 = play once
    0 = repeat indefinitely

    Default is -1

    Must be invoked before the first image is added
  */

  public setRepeat(repeat: number) {
    this.repeat = repeat
  }

  /**
    Sets the transparent color for the last added frame and any subsequent
    frames. Since all colors are subject to modification in the quantization
    process, the color in the final palette for each frame closest to the given
    color becomes the transparent color for that frame. May be set to null to
    indicate no transparent color.
  */
  public setTransparent(color: any) {
    this.transparent = color
  }

  /**
    Adds next GIF frame. The frame is not written immediately, but is
    actually deferred until the next frame is received so that timing
    data can be inserted.  Invoking finish() flushes all frames.
  */
  public addFrame(imageData: any) {
    // HTML Canvas 2D Context Passed In
    if (imageData && imageData.getImageData) {
      this.image = imageData.getImageData(0, 0, this.width, this.height).data
    } else {
      this.image = imageData
    }

    this.getImagePixels() // convert to correct format if necessary
    this.analyzePixels() // build color table & map pixels

    if (this.firstFrame) {
      this.writeLSD() // logical screen descriptior
      this.writePalette() // global color table
      if (this.repeat >= 0) {
        // use NS app extension to indicate reps
        this.writeNetscapeExt()
      }
    }

    this.writeGraphicCtrlExt() // write graphic control extension
    this.writeImageDesc() // image descriptor
    if (!this.firstFrame) this.writePalette() // local color table
    this.writePixels() // encode and write pixel data

    this.firstFrame = false
    this.emit()
  }

  /**
    Adds final trailer to the GIF stream, if you don't call the finish method
    the GIF stream will not be valid.
  */
  public finish() {
    this.out.writeByte(0x3b) // gif trailer
    this.end()
  }

  /**
    Sets quality of color quantization (conversion of images to the maximum 256
    colors allowed by the GIF specification). Lower values (minimum = 1)
    produce better colors, but slow processing significantly. 10 is the
    default, and produces good color mapping at reasonable speeds. Values
    greater than 20 do not yield significant improvements in speed.
  */
  public setQuality(quality: number) {
    if (quality < 1) quality = 1
    this.sample = quality
  }

  /**
    Writes GIF file header
  */
  public start() {
    this.out.writeUTFBytes("GIF89a")
    this.started = true
    this.emit()
  }

  /**
    Analyzes current frame colors and creates color map.
  */
  public analyzePixels() {
    const len: number = this.pixels.length
    const nPix: number = len / 3

    this.indexedPixels = new Uint8Array(nPix)

    const imgq = new NeuQuant(this.pixels, this.sample)
    imgq.buildColormap() // create reduced palette
    this.colorTab = imgq.getColormap()

    // map image pixels to new palette
    let k: number = 0
    for (let j: number = 0; j < nPix; j++) {
      const index: number = imgq.lookupRGB(
        this.pixels[k++] & 0xff,
        this.pixels[k++] & 0xff,
        this.pixels[k++] & 0xff
      )
      this.usedEntry[index] = true
      this.indexedPixels[j] = index
    }

    this.pixels = null
    this.colorDepth = 8
    this.palSize = 7

    // get closest match to transparent color if specified
    if (this.transparent !== null) {
      this.transIndex = this.findClosest(this.transparent)

      // ensure that pixels with full transparency in the RGBA image are using the selected transparent color index in the indexed image.
      for (let pixelIndex: number = 0; pixelIndex < nPix; pixelIndex++) {
        if (this.image[pixelIndex * 4 + 3] == 0) {
          this.indexedPixels[pixelIndex] = this.transIndex
        }
      }
    }
  }

  /**
    Returns index of palette color closest to c
  */
  public findClosest(c) {
    if (this.colorTab === null) return -1

    const r: number = (c & 0xFF0000) >> 16
    const g: number = (c & 0x00FF00) >> 8
    const b: number = (c & 0x0000FF)
    let minpos: number = 0
    let dmin: number = 256 * 256 * 256
    const len: number = this.colorTab.length

    for (let i: number = 0; i < len;) {
      const index: number = i / 3
      const dr: number = r - (this.colorTab[i++] & 0xff)
      const dg: number = g - (this.colorTab[i++] & 0xff)
      const db: number = b - (this.colorTab[i++] & 0xff)
      const d: number = dr * dr + dg * dg + db * db

      if (this.usedEntry[index] && (d < dmin)) {
        dmin = d
        minpos = index
      }
    }

    return minpos
  }

  /**
    Extracts image pixels into byte array pixels
    (removes alphachannel from canvas imagedata)
  */
  public getImagePixels() {
    const w: number = this.width
    const h: number = this.height
    this.pixels = new Uint8Array(w * h * 3)

    const data = this.image
    let count: number = 0

    for (let i: number = 0; i < h; i++) {
      for (let j: number = 0; j < w; j++) {
        const b: number = (i * w * 4) + j * 4
        this.pixels[count++] = data[b]
        this.pixels[count++] = data[b+1]
        this.pixels[count++] = data[b+2]
      }
    }
  }

  /**
    Writes Graphic Control Extension
  */
  public writeGraphicCtrlExt() {
    this.out.writeByte(0x21) // extension introducer
    this.out.writeByte(0xf9) // GCE label
    this.out.writeByte(4) // data block size

    let transp: number
    let disp: number
    if (this.transparent === null) {
      transp = 0
      disp = 0 // dispose = no action
    } else {
      transp = 1
      disp = 2 // force clear if using transparent color
    }

    if (this.dispose >= 0) {
      disp = this.dispose & 7 // user override
    }
    disp <<= 2

    // packed fields
    this.out.writeByte(
      0 | // 1:3 reserved
      disp | // 4:6 disposal
      0 | // 7 user input - 0 = none
      transp // 8 transparency flag
    )

    this.writeShort(this.delay) // delay x 1/100 sec
    this.out.writeByte(this.transIndex) // transparent color index
    this.out.writeByte(0) // block terminator
  }

  /**
    Writes Image Descriptor
  */
  public writeImageDesc() {
    this.out.writeByte(0x2c) // image separator
    this.writeShort(0) // image position x,y = 0,0
    this.writeShort(0)
    this.writeShort(this.width) // image size
    this.writeShort(this.height)

    // packed fields
    if (this.firstFrame) {
      // no LCT - GCT is used for first (or only) frame
      this.out.writeByte(0)
    } else {
      // specify normal LCT
      this.out.writeByte(
        0x80 | // 1 local color table 1=yes
        0 | // 2 interlace - 0=no
        0 | // 3 sorted - 0=no
        0 | // 4-5 reserved
        this.palSize // 6-8 size of color table
      )
    }
  }

  /**
    Writes Logical Screen Descriptor
  */
  public writeLSD() {
    // logical screen size
    this.writeShort(this.width)
    this.writeShort(this.height)

    // packed fields
    this.out.writeByte(
      0x80 | // 1 : global color table flag = 1 (gct used)
      0x70 | // 2-4 : color resolution = 7
      0x00 | // 5 : gct sort flag = 0
      this.palSize // 6-8 : gct size
    )

    this.out.writeByte(0) // background color index
    this.out.writeByte(0) // pixel aspect ratio - assume 1:1
  }

  /**
    Writes Netscape application extension to define repeat count.
  */
  public writeNetscapeExt() {
    this.out.writeByte(0x21) // extension introducer
    this.out.writeByte(0xff) // app extension label
    this.out.writeByte(11) // block size
    this.out.writeUTFBytes('NETSCAPE2.0') // app id + auth code
    this.out.writeByte(3) // sub-block size
    this.out.writeByte(1) // loop sub-block id
    this.writeShort(this.repeat) // loop count (extra iterations, 0=repeat forever)
    this.out.writeByte(0) // block terminator
  }

  /**
    Writes color table
  */
  public writePalette() {
    this.out.writeBytes(this.colorTab)
    const n: number = (3 * 256) - this.colorTab.length
    for (let i: number = 0; i < n; i++)
      this.out.writeByte(0)
  }

  public writeShort(pValue: number) {
    this.out.writeByte(pValue & 0xFF)
    this.out.writeByte((pValue >> 8) & 0xFF)
  }

  /**
    Encodes and writes pixel data
  */
  public writePixels() {
    const enc = new LZWEncoder(this.width, this.height, this.indexedPixels, this.colorDepth)
    enc.encode(this.out)
  }
}

export default GIFEncoder
