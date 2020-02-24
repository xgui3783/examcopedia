const express = require('express')
const router = express.Router()

// TODO artifical latency
router.use('/questions', require('./questions'))
router.use('/categories', require('./categories'))

module.exports = router