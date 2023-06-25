const fs = require('fs');
const HttpError = require('./http-error');

const uploadFile = (base64, fileName) => {
  try { 
    const base64Data = base64.replace(/^data:([A-Za-z-+/]+);base64,/, '');
    const path = `./storage/uploads/${fileName}`;
    fs.writeFileSync(path, base64Data, { encoding: 'base64' });
  } catch (err) {
    return new HttpError(`Upload failed - ${err}`, 500);
  }
};

const removeFile = (fileName) => {
  try {
    const path = `./storage/uploads/${fileName}`;
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
  } catch (err) {
    return new HttpError(`Remove file failed - ${err}`, 500);
  }
}

module.exports = {
  uploadFile,
  removeFile,
};