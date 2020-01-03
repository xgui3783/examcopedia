const express = require('express')
const router = express.Router()

// TODO artifical latency
router.use('/questions', (req, res, next) => {
  setTimeout(next, 1000)
}, require('./questions'))
router.use('/categories', (req, res, next) => {
  setTimeout(next, 1000)
}, require('./categories'))

module.exports = router