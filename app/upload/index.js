const fs = require('fs')
const path = require('path')
const multer = require('multer')
const { PERSISTENT_DATA_DIR } = require('../constants')

const getPersistentDir = (req) => {
  const { app } = req
  return app.get(PERSISTENT_DATA_DIR) || __dirname
}

const mkDirIfNotExit = (path) => {
  fs.stat(path, (e, s) => {
    if (e) {
      fs.mkdirSync(path)
      return true
    } else {
      return true
    }
  })
}

const mobileStorage = multer.diskStorage({
  destination: function (req, files, cb) {
    try {
      const mobileStoragePath = path.join(getPersistentDir(req), 'mobileuploads')
      mkDirIfNotExit(mobileStoragePath)
      cb(null, mobileStoragePath)
    } catch (e) {
      cb(e)
    }
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

const orcStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    try{
      const orcStoragePath = path.join(getPersistentDir(req), 'ocrStorage')
      mkDirIfNotExit(orcStoragePath)
      cb(null, orcStoragePath)
    } catch(e) {
      cb(e)
    }
  }
})

const uploadMobile = multer({
  storage: mobileStorage
}).single('photo')

const uploadOCR = multer({
  storage: orcStorage
}).single('photo')

module.exports = {
  uploadMobile,
  uploadOCR
}