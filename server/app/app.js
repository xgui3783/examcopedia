const express = require('express')
const app = express()
const path = require('path')

if (process.env.NODE_ENV !== 'production') {
  app.use(require('cors')())
  require('dotenv').config()
}

const publicPath = path.join(__dirname, '../../public')

app.use(express.static(publicPath))

const api = require('./api')

require('./db')

/**
 * routes
 */
app.use('/api', api)

module.exports = app