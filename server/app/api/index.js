const express = require('express')
const router = express.Router()

router.use('/questions', require('./questions'))
router.use('/categories', require('./categories'))
router.use('/images', require('./images'))

module.exports = router