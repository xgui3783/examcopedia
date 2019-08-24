const express = require('express')
const router = express.Router()

router.use('/questions', require('./questions'))
router.use('/categorise', require('./categorise'))

module.exports = router