const express = require('express')
const app = express()

if (process.env.NODE_ENV !== 'production') {
  app.use(require('cors')())
}

const routes = require('./routes')

/**
 * routes
 */
app.use('/routes', routes)

module.exports = app