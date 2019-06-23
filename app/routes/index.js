const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
  console.log('works')
  res.status(200).end()
})

module.exports = router