const fs = require('fs');

class FileController {
  writeFile(fileName, content, options) {
    fs.writeFileSync(fileName, content, options);
  }

  mkdir(directory) {
    if (fs.existsSync(directory)){
      fs.rmdirSync(directory);
    }
    fs.mkdirSync(directory);
  }
}

module.exports = FileController;
