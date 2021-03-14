const multer = require('multer')
const path = require('path')
const express = require('express') 
const router = express.Router()

const storage = multer.diskStorage({
  /**
   * configure where to store images?
   */
  destination: path.join(__dirname, 'upload'),
  filename: (req, file, cb) => {
    const { imagename } = req.params
    if (!imagename) {
      return cb(`imagename param not defined`)
    }
    cb(null, imagename)
  }
})

const multerUpload = multer({ storage })

router.post('/:imagename', multerUpload.single('image'), (req, res) => {
  res.status(200).send('OK')  
})

router.use(express.static(path.join(__dirname, 'upload')))

module.exports = router