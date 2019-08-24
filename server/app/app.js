const express = require('express')
const app = express()

if (process.env.NODE_ENV !== 'production') {
  app.use(require('cors')())
  require('dotenv').config()
}

const api = require('./api')

require('./db')

/**
 * routes
 */
app.use('/api', api)

module.exports = app