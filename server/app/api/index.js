const express = require('express')
const router = express.Router()

router.use('/questions', require('./questions'))
router.use('/categories', require('./categories'))

module.exports = router