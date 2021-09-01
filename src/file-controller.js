const fs = require('fs');
const path = require('path');

class FileController {
  /**
   * Writes file with specified name and contents.
   * @param {String} fileName 
   * @param {Buffer} content 
   * @param {Object} options 
   */
  writeFile(fileName, content, options) {
    fs.writeFileSync(fileName, content, options);
  }

  /**
   * Remove directory contents and recreate the directory.
   * @param {String} directory 
   */
  mkdir(directory) {
    if (fs.existsSync(directory)){
      const directoryContents = fs.readdirSync(directory);

      for (const fileName of directoryContents) {
        fs.rmSync(path.join(directory, fileName));
      }
      fs.rmdirSync(directory);
    }
    fs.mkdirSync(directory);
  }
}

module.exports = FileController;
