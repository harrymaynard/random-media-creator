export default class ByteArray {
  public data: Array<number> = []

  public getData(): Buffer {
    return Buffer.from(this.data)
  }

  public writeByte(val: number) {
    this.data.push(val)
  }

  public writeUTFBytes(str: string) {
    for (var l = str.length, i = 0; i < l; i++)
      this.writeByte(str.charCodeAt(i))
  }

  public writeBytes(
    array: Array<number>,
    offset?: number,
    length?: number
  ): void {
    for (var l = length || array.length, i = offset || 0; i < l; i++)
      this.writeByte(array[i])
  }
}
